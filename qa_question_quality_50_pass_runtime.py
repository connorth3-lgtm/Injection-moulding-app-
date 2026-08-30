from pathlib import Path
import json
import re
import subprocess
import tempfile
from collections import Counter
import qa_question_quality_50_pass as base

ROOT=Path(__file__).resolve().parent
FORMAL_OVERLAY=None
OPTIONAL_OVERLAY=None
OPTIONAL_POSITIONS=None
BASE_EVALUATE=base.evaluate_item


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


def apply_formal_runtime_overlay():
    global FORMAL_OVERLAY
    items=base.load_runtime_bank()
    scenarios=[x for x in items if x.get('kind')=='scenario']
    payload=[{
        'title':x['stem'].split(': ',1)[0],
        'situation':x['stem'].split(': ',1)[1] if ': ' in x['stem'] else x['stem'],
        'choices':x['options'],'correct':x['correct'],'why':x['rationale'],
        'feedback':x.get('feedback',[]),'category':x.get('category','')
    } for x in scenarios]
    node=r'''
const fs=require('fs'),vm=require('vm'),rows=%s;
const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
const window={MM_DATA:{scenarios:rows},MM_EVIDENCE_SOURCES:{sources:{},inferred:()=>[],hash}};
const sandbox={window,console,URL};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('evidence-maturity-formal-bridge.js','utf8'),sandbox,{filename:'evidence-maturity-formal-bridge.js'});
process.stdout.write(JSON.stringify({scenarios:window.MM_DATA.scenarios,overlay:window.MM_QUESTION_QUALITY_OVERLAY||null}));
'''%json.dumps(payload)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'formal quality overlay runtime failed: '+(p.stderr or p.stdout)[:5000])
    data=json.loads(p.stdout);FORMAL_OVERLAY=data.get('overlay')
    need(FORMAL_OVERLAY and FORMAL_OVERLAY.get('scenarioFeedbackUpgraded',0)>=24,f'scenario feedback overlay incomplete: {FORMAL_OVERLAY}')
    by_title={x['title']:x for x in data['scenarios']}
    for item in scenarios:
        title=item['stem'].split(': ',1)[0]
        if title in by_title:item['feedback']=by_title[title].get('feedback',[])
    return items


def load_optional_runtime():
    global OPTIONAL_OVERLAY,OPTIONAL_POSITIONS
    src=base.text('evidence-maturity-deep-dive.js')
    start=src.find('const MATERIAL_PRACTICE=[');end=src.find('\n];\nfunction normalisePractice',start)
    need(start>=0 and end>start,'extended MATERIAL_PRACTICE block missing')
    block=src[start:end+3]
    node=block+r'''
const fs=require('fs'),vm=require('vm');
function normalisePractice(){return MATERIAL_PRACTICE.map(l=>({...l,steps:l.steps.map(s=>({stage:s[0],question:s[1],choices:s.slice(2).map((text,i)=>({text,correct:i===0,feedback:i===0?'Correct. This choice tests the mechanism with the strongest evidence.':'Not the strongest evidence-first response for this scenario.'}))}))}))}
const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
const window={MM_EVIDENCE_SOURCES:{sources:{},inferred:()=>[],hash},MM_MATERIAL_PRACTICE_EXTENSIONS:{version:'qa',labs:normalisePractice(),scope:'QA runtime'}};
const sandbox={window,console,URL};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('evidence-maturity-formal-bridge.js','utf8'),sandbox,{filename:'evidence-maturity-formal-bridge.js'});
const out=[];
for(const lab of window.MM_MATERIAL_PRACTICE_EXTENSIONS.labs)for(let i=0;i<(lab.steps||[]).length;i++){
 const step=lab.steps[i],choices=step.choices||[],correct=choices.findIndex(c=>c&&c.correct===true);
 out.push({id:`optional-material:${lab.id}:${i}`,kind:'optional-material-practice',scope:'optional',labId:lab.id,level:lab.level||'',stage:step.stage||'',stem:step.question||'',options:choices.map(c=>c.text),correct,feedback:choices.map(c=>c.feedback||''),rationale:correct>=0?(choices[correct].feedback||''):'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(step.question||''))});
}
process.stdout.write(JSON.stringify({items:out,overlay:window.MM_QUESTION_QUALITY_OVERLAY||null}));
'''
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'optional material-practice runtime failed: '+(p.stderr or p.stdout)[:5000])
    data=json.loads(p.stdout);items=data['items'];OPTIONAL_OVERLAY=data.get('overlay')
    OPTIONAL_POSITIONS=[sum(1 for x in items if x['correct']==i) for i in range(4)]
    need(OPTIONAL_OVERLAY and OPTIONAL_OVERLAY.get('optionalChoicesUpgraded')==40,f'optional quality overlay incomplete: {OPTIONAL_OVERLAY}')
    need(OPTIONAL_POSITIONS==[10,10,10,10],f'optional key positions not balanced: {OPTIONAL_POSITIONS}')
    need(OPTIONAL_OVERLAY.get('optionalKeyPositions')==[10,10,10,10],f'overlay key-position metadata mismatch: {OPTIONAL_OVERLAY}')
    return items


def evaluate_runtime(item):
    result=BASE_EVALUATE(item)
    if item.get('kind')!='optional-material-practice':
        return result
    hard=set(result['hard']);warnings=set(result['warnings']);warnings.discard('optional-feedback-generated-at-runtime')
    feedback=[base.norm(x) for x in item.get('feedback',[])]
    if len(feedback)!=4:hard.add('feedback-count')
    elif min(map(base.char_len,feedback))<20:hard.add('lab-feedback-too-shallow')
    if len({base.norm_lower(x) for x in feedback if x})<3:hard.add('repetitive-option-feedback')
    score=max(0,100-25*len(hard)-4*len(warnings))
    return {'hard':sorted(hard),'warnings':sorted(warnings),'score':score}


def main():
    base.load_runtime_bank=apply_formal_runtime_overlay
    base.load_optional_material_practice=load_optional_runtime
    base.evaluate_item=evaluate_runtime
    base.main()
    report=json.loads((ROOT/'question-quality-50-pass-report.json').read_text(encoding='utf-8'))
    report['quality_overlay']=OPTIONAL_OVERLAY
    report['scenario_feedback_upgraded']=FORMAL_OVERLAY.get('scenarioFeedbackUpgraded',0) if FORMAL_OVERLAY else 0
    report['optional_answer_positions']=OPTIONAL_POSITIONS
    report['runtime_quality_version']='2026.08.30.1'
    report['rubric']['hard_gates'] += ['balanced 10/10/10/10 optional answer positions','option-specific optional feedback']
    (ROOT/'question-quality-50-pass-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(f"Runtime overlay verified: scenarios={report['scenario_feedback_upgraded']} optional=40 positions={OPTIONAL_POSITIONS}")


if __name__=='__main__':
    main()
