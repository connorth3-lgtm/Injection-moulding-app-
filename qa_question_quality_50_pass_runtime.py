from pathlib import Path
import json
import subprocess
import tempfile
import qa_question_quality_50_pass as base

ROOT=Path(__file__).resolve().parent
FORMAL_OVERLAY=None
OPTIONAL_OVERLAY=None
OPTIONAL_POSITIONS=None
FINAL_RUNTIME=None
FINAL_META=None
BASE_LOAD_RUNTIME=base.load_runtime_bank
BASE_LOAD_LAB=base.load_lab_file
BASE_LOAD_OPTIONAL=base.load_optional_material_practice
BASE_EVALUATE=base.evaluate_item


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


def evaluate_runtime(item):
    """Compatibility surface used by the extreme audit; evaluates final items with the shared rubric."""
    return BASE_EVALUATE(item)


def apply_formal_runtime_overlay():
    global FORMAL_OVERLAY
    items=BASE_LOAD_RUNTIME()
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


def load_final_runtime():
    global FINAL_RUNTIME,FINAL_META
    if FINAL_RUNTIME is not None:
        return FINAL_RUNTIME
    items=[]
    items.extend(apply_formal_runtime_overlay())
    items.extend(BASE_LOAD_LAB('diagnostic-learning-labs.js','MM_DIAGNOSTIC_LABS','diagnostic-lab','lab:'))
    items.extend(BASE_LOAD_LAB('material-behaviour-labs.js','MM_MATERIAL_BEHAVIOUR_LABS','material-lab','material:'))
    items.extend(load_optional_runtime())
    need(len(items)==197,f'pre-hardening final-runtime item count mismatch: {len(items)}')
    node=r'''
const fs=require('fs'),vm=require('vm'),items=%s;
const D={exams:{Beginner:[],Intermediate:[],Advanced:[]},regionalQuestions:{UK:{Beginner:[],Intermediate:[],Advanced:[]},US:{Beginner:[],Intermediate:[],Advanced:[]},NZ:{Beginner:[],Intermediate:[],Advanced:[]}},scenarios:[],assessmentQA:{}};
const diagMap=new Map(),matMap=new Map(),optMap=new Map();
const mkChoice=(text,correct,feedback)=>({text,correct,feedback});
for(const x of items){
 if(x.kind==='technical-exam')D.exams[x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],!!x.critical]);
 else if(x.kind==='regional-exam')D.regionalQuestions[x.region][x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],true]);
 else if(x.kind==='scenario'){const parts=String(x.stem||'').split(': ');D.scenarios.push({title:parts.shift()||x.id,situation:parts.join(': '),choices:x.options,correct:x.correct,why:x.rationale,feedback:x.feedback||[],category:x.category||'',difficulty:x.level||'',mmStableId:x.id});}
 else if(x.kind==='diagnostic-lab'){if(!diagMap.has(x.labId))diagMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',steps:[]});diagMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
 else if(x.kind==='material-lab'){if(!matMap.has(x.labId))matMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});matMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
 else if(x.kind==='optional-material-practice'){if(!optMap.has(x.labId))optMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});optMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
}
const DIAG={labs:[...diagMap.values()]},MAT={labs:[...matMap.values()]},OPT={labs:[...optMap.values()]};
const window={MM_DATA:D,MM_DIAGNOSTIC_LABS:DIAG,MM_MATERIAL_BEHAVIOUR_LABS:MAT,MM_MATERIAL_PRACTICE_EXTENSIONS:OPT};
const sandbox={window,console};window.window=window;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assessment-psychometric-hardening.js','utf8'),sandbox,{filename:'assessment-psychometric-hardening.js'});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.exams[level].length;i++){const q=D.exams[level][i];out.push({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:!!q[7]})}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.regionalQuestions[region][level].length;i++){const q=D.regionalQuestions[region][level][i];out.push({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:true})}
for(const s of D.scenarios)out.push({id:s.mmStableId,kind:'scenario',scope:'formal',level:s.difficulty||'',category:s.category||'',stem:`${s.title}: ${s.situation}`,options:s.choices,correct:s.correct,rationale:s.why,feedback:s.feedback,critical:false});
function labsToOut(labs,kind,prefix,scope){for(const lab of labs)for(let i=0;i<lab.steps.length;i++){const s=lab.steps[i],correct=s.choices.findIndex(c=>c.correct===true);out.push({id:prefix+lab.id+':'+i,kind,scope,labId:lab.id,level:lab.level||'',stage:s.stage||'',stem:s.question||'',options:s.choices.map(c=>c.text),correct,feedback:s.choices.map(c=>c.feedback||''),rationale:s.choices[correct]?.feedback||'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(s.question||''))})}}
labsToOut(DIAG.labs,'diagnostic-lab','lab:','formal');labsToOut(MAT.labs,'material-lab','material:','formal');labsToOut(OPT.labs,'optional-material-practice','optional-material:','optional');
process.stdout.write(JSON.stringify({items:out,meta:window.MM_PSYCHOMETRIC_HARDENING||null}));
'''%json.dumps(items)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'final learner-visible psychometric runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout);FINAL_RUNTIME=data['items'];FINAL_META=data.get('meta')
    need(len(FINAL_RUNTIME)==197,f'post-hardening final-runtime item count mismatch: {len(FINAL_RUNTIME)}')
    need(FINAL_META and FINAL_META.get('itemsHardened')==197 and FINAL_META.get('optionsParallelised')==788,f'final psychometric coverage mismatch: {FINAL_META}')
    need(FINAL_META.get('technicalKeyPositions')==[8,8,7,7],f'final technical key positions not balanced: {FINAL_META}')
    need(FINAL_META.get('scenarioKeyPositions')==[10,10,10,10],f'final scenario key positions not balanced: {FINAL_META}')
    return FINAL_RUNTIME


def final_formal_runtime():
    return [x for x in load_final_runtime() if x['kind'] in ('technical-exam','regional-exam','scenario')]


def final_lab_runtime(path,global_name,kind,prefix):
    return [x for x in load_final_runtime() if x['kind']==kind]


def final_optional_runtime():
    return [x for x in load_final_runtime() if x['kind']=='optional-material-practice']


def main():
    base.load_runtime_bank=final_formal_runtime
    base.load_lab_file=final_lab_runtime
    base.load_optional_material_practice=final_optional_runtime
    base.evaluate_item=BASE_EVALUATE
    base.main()
    report=json.loads((ROOT/'question-quality-50-pass-report.json').read_text(encoding='utf-8'))
    report['quality_overlay']=OPTIONAL_OVERLAY
    report['scenario_feedback_upgraded']=FORMAL_OVERLAY.get('scenarioFeedbackUpgraded',0) if FORMAL_OVERLAY else 0
    report['optional_answer_positions']=OPTIONAL_POSITIONS
    report['psychometric_runtime']=FINAL_META
    report['runtime_quality_version']='2026.08.31.1'
    report['rubric']['hard_gates'] += ['balanced 8/8/7/7 technical answer positions','balanced 10/10/10/10 scenario and optional answer positions','option-specific optional feedback','zero learner-visible quality warnings']
    need(not report.get('warning_types'),f"final learner-visible standard audit still has warnings: {report.get('warning_types')} / {report.get('warning_items')}")
    (ROOT/'question-quality-50-pass-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(f"Final runtime verified: psychometric={FINAL_META.get('version')} technical={FINAL_META.get('technicalKeyPositions')} scenarios={FINAL_META.get('scenarioKeyPositions')} warnings=0")


if __name__=='__main__':
    main()
