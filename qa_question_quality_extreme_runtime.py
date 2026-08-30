from pathlib import Path
import json
import subprocess
import tempfile

import qa_question_quality_50_pass as base
import qa_question_quality_50_pass_runtime as runtime
import qa_question_quality_extreme_50_pass as extreme

ROOT=Path(__file__).resolve().parent
PSYCHOMETRIC_META=None


def need(ok,msg):
    if not ok: raise AssertionError(msg)


def load_psychometric_items():
    global PSYCHOMETRIC_META
    items=[]
    items.extend(runtime.apply_formal_runtime_overlay())
    items.extend(base.load_lab_file('diagnostic-learning-labs.js','MM_DIAGNOSTIC_LABS','diagnostic-lab','lab:'))
    items.extend(base.load_lab_file('material-behaviour-labs.js','MM_MATERIAL_BEHAVIOUR_LABS','material-lab','material:'))
    items.extend(runtime.load_optional_runtime())
    need(len(items)==197,f'pre-hardening item count mismatch: {len(items)}')
    node=r'''
const fs=require('fs'),vm=require('vm'),items=%s;
const D={exams:{Beginner:[],Intermediate:[],Advanced:[]},regionalQuestions:{UK:{Beginner:[],Intermediate:[],Advanced:[]},US:{Beginner:[],Intermediate:[],Advanced:[]},NZ:{Beginner:[],Intermediate:[],Advanced:[]}},scenarios:[],assessmentQA:{}};
const diagMap=new Map(),matMap=new Map(),optMap=new Map();
const mkChoice=(text,correct,feedback)=>({text,correct,feedback});
for(const x of items){
 if(x.kind==='technical-exam')D.exams[x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],!!x.critical]);
 else if(x.kind==='regional-exam')D.regionalQuestions[x.region][x.level].push([x.stem,x.options,x.correct,x.rationale,x.reference||'',x.sourceUrl||null,x.feedback||[],true]);
 else if(x.kind==='scenario'){
   const parts=String(x.stem||'').split(': ');D.scenarios.push({title:parts.shift()||x.id,situation:parts.join(': '),choices:x.options,correct:x.correct,why:x.rationale,feedback:x.feedback||[],category:x.category||'',difficulty:x.level||'',mmStableId:x.id});
 }
 else if(x.kind==='diagnostic-lab'){
   if(!diagMap.has(x.labId))diagMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',steps:[]});
   diagMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
 else if(x.kind==='material-lab'){
   if(!matMap.has(x.labId))matMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   matMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
 else if(x.kind==='optional-material-practice'){
   if(!optMap.has(x.labId))optMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   optMap.get(x.labId).steps.push({stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||''))});
 }
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
process.stdout.write(JSON.stringify({items:out,meta:window.MM_PSYCHOMETRIC_HARDENING}));
'''%json.dumps(items)
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);pth=Path(h.name)
    try:
        p=subprocess.run(['node',str(pth)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    need(p.returncode==0,'psychometric runtime failed: '+(p.stderr or p.stdout)[:8000])
    data=json.loads(p.stdout);PSYCHOMETRIC_META=data.get('meta');out=data['items']
    need(len(out)==197,f'post-hardening item count mismatch: {len(out)}')
    need(PSYCHOMETRIC_META and PSYCHOMETRIC_META.get('distractorsRewritten')==591,f'psychometric coverage mismatch: {PSYCHOMETRIC_META}')
    need(PSYCHOMETRIC_META.get('scenarioKeyPositions')==[10,10,10,10],f'scenario key positions not balanced: {PSYCHOMETRIC_META}')
    return out


def main():
    extreme.load_all=load_psychometric_items
    extreme.main()
    report=json.loads((ROOT/'question-quality-extreme-50-pass-report.json').read_text(encoding='utf-8'))
    report['psychometric_runtime']=PSYCHOMETRIC_META
    (ROOT/'question-quality-extreme-50-pass-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('Psychometric runtime verified:',PSYCHOMETRIC_META)


if __name__=='__main__':main()
