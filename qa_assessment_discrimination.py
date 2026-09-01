from pathlib import Path
import json
import re
import subprocess
import tempfile

import qa_question_quality_extreme_runtime as psychometric

ROOT=Path(__file__).resolve().parent
SCRIPT=ROOT/'assessment-discrimination-hardening.js'
EXPECTED_COUNTS={
    'evidence-verb-key-cue':77,
    'parameter-change-distractor-cue':45,
    'correct-qualification-density':24,
    'correct-length-salience-moderate':16,
    'negation-key-cue':15,
    'implausibly-short-distractor':2,
}


def need(ok,msg):
    if not ok:
        raise AssertionError(msg)


def load_discrimination_runtime():
    items=psychometric.load_psychometric_items()
    need(len(items)==197,f'expected 197 post-psychometric items, got {len(items)}')
    node=r'''
const fs=require('fs'),vm=require('vm'),items=%s;
const D={exams:{Beginner:[],Intermediate:[],Advanced:[]},regionalQuestions:{UK:{Beginner:[],Intermediate:[],Advanced:[]},US:{Beginner:[],Intermediate:[],Advanced:[]},NZ:{Beginner:[],Intermediate:[],Advanced:[]}},scenarios:[]};
const diagMap=new Map(),matMap=new Map(),optMap=new Map();
const mkChoice=(text,correct,feedback)=>({text,correct,feedback});
for(const x of items){
 if(x.kind==='technical-exam')D.exams[x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],!!x.critical]);
 else if(x.kind==='regional-exam')D.regionalQuestions[x.region][x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],true]);
 else if(x.kind==='scenario'){const p=String(x.stem||'').split(': ');D.scenarios.push({title:p.shift()||x.id,situation:p.join(': '),choices:x.options,correct:x.correct,why:x.rationale,feedback:x.feedback||[],category:x.category||'',difficulty:x.level||'',mmStableId:x.id});}
 else if(x.kind==='diagnostic-lab'){if(!diagMap.has(x.labId))diagMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',steps:[]});diagMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
 else if(x.kind==='material-lab'){if(!matMap.has(x.labId))matMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});matMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
 else if(x.kind==='optional-material-practice'){if(!optMap.has(x.labId))optMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});optMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});}
}
const DIAG={labs:[...diagMap.values()]},MAT={labs:[...matMap.values()]},OPT={labs:[...optMap.values()]};
const window={MM_DATA:D,MM_DIAGNOSTIC_LABS:DIAG,MM_MATERIAL_BEHAVIOUR_LABS:MAT,MM_MATERIAL_PRACTICE_EXTENSIONS:OPT,MM_PSYCHOMETRIC_HARDENING:{version:'qa'}};
const sandbox={window,console};window.window=window;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assessment-discrimination-hardening.js','utf8'),sandbox,{filename:'assessment-discrimination-hardening.js'});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.exams[level].length;i++){const q=D.exams[level][i];out.push({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:!!q[7]})}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<D.regionalQuestions[region][level].length;i++){const q=D.regionalQuestions[region][level][i];out.push({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:q[0],options:q[1],correct:q[2],rationale:q[3],feedback:q[6],reference:q[4],sourceUrl:q[5],critical:true})}
for(const s of D.scenarios)out.push({id:s.mmStableId,kind:'scenario',scope:'formal',level:s.difficulty||'',category:s.category||'',stem:`${s.title}: ${s.situation}`,options:s.choices,correct:s.correct,rationale:s.why,feedback:s.feedback,critical:false});
function labsToOut(labs,kind,prefix,scope){for(const lab of labs)for(let i=0;i<lab.steps.length;i++){const s=lab.steps[i],correct=s.choices.findIndex(c=>c.correct===true);out.push({id:prefix+lab.id+':'+i,kind,scope,labId:lab.id,level:lab.level||'',stage:s.stage||'',stem:s.question||'',options:s.choices.map(c=>c.text),correct,feedback:s.choices.map(c=>c.feedback||''),rationale:s.choices[correct]?.feedback||'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(s.question||''))})}}
labsToOut(DIAG.labs,'diagnostic-lab','lab:','formal');labsToOut(MAT.labs,'material-lab','material:','formal');labsToOut(OPT.labs,'optional-material-practice','optional-material:','optional');
process.stdout.write(JSON.stringify({items:out,meta:window.MM_ASSESSMENT_DISCRIMINATION_HARDENING||null}));
'''%json.dumps(items)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'assessment discrimination runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout)
    return items,data['items'],data.get('meta')


def main():
    need(SCRIPT.exists(),'assessment discrimination runtime is missing')
    p=subprocess.run(['node','--check',str(SCRIPT)],capture_output=True,text=True)
    need(p.returncode==0,'assessment-discrimination-hardening.js syntax error: '+(p.stderr or p.stdout))
    before,after,meta=load_discrimination_runtime()
    need(meta and meta.get('status')=='approved',f'discrimination hardening did not approve: {meta}')
    need(meta.get('targetedItems')==111,f'expected 111 cue-warning items, got {meta.get("targetedItems")}')
    need(meta.get('cueWarningsBefore')==179 and meta.get('cueWarningsAfter')==0,f'cue-warning totals drifted: {meta}')
    need(meta.get('warningCountsBefore')==EXPECTED_COUNTS,f'cue-warning category counts drifted: {meta.get("warningCountsBefore")}')
    need(all(v==0 for v in meta.get('warningCountsAfter',{}).values()),f'post-rewrite cue warnings remain: {meta.get("warningCountsAfter")}')
    need(meta.get('answerKeysChanged')==0,'answer-key changes are not permitted in discrimination hardening')
    need(len(after)==197 and [x['id'] for x in before]==[x['id'] for x in after],'question identity/order changed')
    target_ids=set(meta.get('targetIds') or [])
    need(len(target_ids)==111,'target ID coverage mismatch')
    for a,b in zip(before,after):
        need(a['correct']==b['correct'],f"answer key changed: {a['id']}")
        need(len(b.get('options',[]))==4 and len(set(b['options']))==4,f"option integrity failed: {b['id']}")
        if b['id'] in target_ids:
            need(all(str(x).startswith('Response — ') for x in b['options']),f"neutral response framing missing: {b['id']}")
            need(any(a['options'][i]!=b['options'][i] for i in range(4)),f"targeted item was not rewritten: {b['id']}")
            for i,o in enumerate(b['options']):
                if i==b['correct']:
                    continue
                core=re.sub(r'^Response\s*[—-]\s*','',str(o),flags=re.I)
                need(not re.match(r'^(Ignore|Assume)\b',core,re.I),f"implausible distractor lead remains: {b['id']} option {i+1}")
                need(len(re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?",core))>=4,f"distractor too thin: {b['id']} option {i+1}")
    print('Assessment discrimination QA passed: 111 audited cue-warning items rewritten; 179 cue warnings reduced to 0; answer keys unchanged.')


if __name__=='__main__':
    main()
