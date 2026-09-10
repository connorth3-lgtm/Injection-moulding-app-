#!/usr/bin/env python3
"""Freeze the exact audited-main 197-item learner-visible assessment output.

The migration reads the already reviewed baseline commit in a detached worktree, asks that
commit's own runtime QA to materialise its final learner-visible bank, and writes that exact
bank as an explicit snapshot. Runtime cue-word substitution, clause trimming and the former
93 keyed-answer rewrite are then retired. Current QA is adapted to validate, not mutate.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASELINE='48e1e7a6777c288fd7c67d6dbc9fcd891a4a9307'
PSYCH=ROOT/'assessment-psychometric-hardening.js'
BRIDGE=ROOT/'assessment-stable-review-bridge.js'
BASE_QA=ROOT/'qa_question_quality_50_pass.py'
RUNTIME_QA=ROOT/'qa_question_quality_50_pass_runtime.py'


def run(args,cwd=ROOT,**kw):
    return subprocess.run(args,cwd=cwd,check=True,**kw)


def replace_section(path:Path,start:str,end:str,replacement:str)->None:
    text=path.read_text(encoding='utf-8')
    a=text.find(start);b=text.find(end,a+1)
    if a<0 or b<0 or b<=a:raise SystemExit(f'Could not locate section in {path.name}: {start!r} -> {end!r}')
    path.write_text(text[:a]+replacement.rstrip()+'\n\n'+text[b:],encoding='utf-8')


def audited_baseline_items()->list[dict]:
    temp=Path(tempfile.mkdtemp(prefix='mm-assessment-baseline-'))
    try:
        run(['git','worktree','add','--detach',str(temp),BASELINE])
        # Prove the source baseline still satisfies its own zero-warning final-runtime contract.
        run([sys.executable,'qa_question_quality_50_pass_runtime.py'],cwd=temp,stdout=subprocess.DEVNULL)
        code="import json,qa_question_quality_50_pass_runtime as q;print(json.dumps(q.load_final_runtime(),ensure_ascii=False))"
        env=os.environ.copy();env['PYTHONPATH']=str(temp)
        p=run([sys.executable,'-c',code],cwd=temp,capture_output=True,text=True,encoding='utf-8',env=env)
        items=json.loads(p.stdout)
    finally:
        subprocess.run(['git','worktree','remove','--force',str(temp)],cwd=ROOT,check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        shutil.rmtree(temp,ignore_errors=True)
    if len(items)!=197 or len({x.get('id') for x in items})!=197:raise SystemExit('Audited baseline did not materialise 197 unique items')
    counts={}
    for x in items:counts[x['kind']]=counts.get(x['kind'],0)+1
    expected={'technical-exam':30,'regional-exam':27,'scenario':40,'diagnostic-lab':36,'material-lab':24,'optional-material-practice':40}
    if counts!=expected:raise SystemExit(f'Audited baseline item taxonomy changed: {counts}')
    return items


def compact(items:list[dict])->list[dict]:
    keep=('id','kind','level','region','labId','title','stem','options','correct','feedback')
    out=[]
    for item in items:
        row={k:item.get(k) for k in keep if item.get(k) is not None}
        if len(row.get('options') or [])!=4 or not isinstance(row.get('correct'),int) or not 0<=row['correct']<4:
            raise SystemExit(f'Invalid audited item shape: {row.get("id")}')
        out.append(row)
    return out


def psychometric_source(snapshot:list[dict])->str:
    payload=json.dumps(snapshot,ensure_ascii=False,separators=(',',':'))
    digest=hashlib.sha256(payload.encode('utf-8')).hexdigest()
    return f'''/* MouldMaster explicit reviewed assessment snapshot — 2026.09.10.2 */
(function(){{
'use strict';
const VERSION='2026.09.10.2',CONTENT_SHA256='{digest}',BASELINE_COMMIT='{BASELINE}';
const SNAPSHOT={payload};
const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||D.scenarios?.length!==40)throw new Error('All assessment banks must load before reviewed snapshot');
function target(id){{
 let m=id.match(/^tech:([^:]+):(\\d+)$/);if(m)return D.exams?.[m[1]]?.[Number(m[2])];
 m=id.match(/^reg:([^:]+):([^:]+):(\\d+)$/);if(m)return D.regionalQuestions?.[m[1]]?.[m[2]]?.[Number(m[3])];
 if(id.startsWith('scenario:'))return (D.scenarios||[]).find((s,i)=>(s.mmStableId||`scenario:${{String(i+1).padStart(2,'0')}}`)===id);
 for(const [prefix,bank] of [['lab:',DIAG],['material:',MAT],['optional-material:',OPT]])if(id.startsWith(prefix)){{const tail=id.slice(prefix.length),cut=tail.lastIndexOf(':'),labId=tail.slice(0,cut),step=Number(tail.slice(cut+1));return (bank.labs||[]).find(l=>l.id===labId)?.steps?.[step]}}
 return null
}}
function formal(q,row){{if(Array.isArray(q)){{q[0]=row.stem;q[1]=row.options.slice();q[2]=row.correct;q[6]=(row.feedback||[]).slice()}}else{{q.q=row.stem;q.options=row.options.slice();q.correct=row.correct;q.optionFeedback=(row.feedback||[]).slice()}}}}
function scenario(s,row){{const prefix=`${{s.title}}: `;s.situation=String(row.stem||'').startsWith(prefix)?String(row.stem).slice(prefix.length):String(row.stem||'');s.choices=row.options.slice();s.correct=row.correct;s.feedback=(row.feedback||[]).slice()}}
function lab(step,row){{step.question=row.stem;step.choices=row.options.map((text,i)=>({{text,correct:i===row.correct,feedback:(row.feedback||[])[i]||''}}));if(row.kind==='optional-material-practice')step.answerIndex=row.correct}}
let applied=0;for(const row of SNAPSHOT){{const q=target(row.id);if(!q)throw new Error(`Reviewed snapshot item missing: ${{row.id}}`);if(row.kind==='technical-exam'||row.kind==='regional-exam')formal(q,row);else if(row.kind==='scenario')scenario(q,row);else lab(q,row);applied++}}
if(applied!==197)throw new Error(`Reviewed snapshot coverage mismatch: ${{applied}}/197`);
const positions=xs=>xs.reduce((a,k)=>{{k=Number(k);if(k>=0&&k<4)a[k]++;return a}},[0,0,0,0]);
const technical=[];for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.exams?.[level]||[])technical.push(Number(q?.correct??q?.[2]));
const technicalKeyPositions=positions(technical),scenarioKeyPositions=positions((D.scenarios||[]).map(s=>s.correct));
if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Reviewed technical key positions changed: ${{technicalKeyPositions}}`);
if(scenarioKeyPositions.join(',')!=='10,10,10,10')throw new Error(`Reviewed scenario key positions changed: ${{scenarioKeyPositions}}`);
const meta={{version:VERSION,baselineCommit:BASELINE_COMMIT,contentSha256:CONTENT_SHA256,itemsHardened:197,optionsParallelised:788,sourceAuthoredSnapshotApplied:197,runtimeHeuristicSemanticEdits:0,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions,scenarioKeyPositions,initialization:'explicit-reviewed-snapshot',policy:'Learner-visible stems, choices, answer keys and feedback are explicit reviewed content from the audited baseline. Runtime semantic cue substitution, clause trimming and answer-length rewriting are forbidden.'}};
D.assessmentQA=D.assessmentQA||{{}};D.assessmentQA.psychometricHardening={{...meta}};window.MM_PSYCHOMETRIC_HARDENING=Object.freeze(meta);
}})();
'''


def bridge_source()->str:
    return '''/* MouldMaster stable spaced-review ID + blueprint guard — read-only 2026.09.10.2 */
(function(){
'use strict';
const S=window.MM_ASSESSMENT_QUALITY,D=window.MM_DATA;
if(!S||!D||typeof window.getExamQuestions!=='function')throw new Error('Assessment quality suite must load before stable review bridge');
const base=window.getExamQuestions;
window.getExamQuestions=function(){
 const rows=base.apply(this,arguments),technical=rows.filter(q=>q&&q.kind==='technical'),covered=new Set();
 technical.forEach(q=>(Array.isArray(q.competencies)&&q.competencies.length?q.competencies:[q.competency]).filter(Boolean).forEach(c=>covered.add(c)));
 const missing=(S.blueprint||[]).filter(c=>!covered.has(c));if(missing.length)throw new Error(`Assessment blueprint incomplete: missing ${missing.join(', ')}`);
 rows.forEach(q=>{if(q&&q.stableId)q.mmId=q.stableId});return rows
};
window.MM_STABLE_REVIEW_BRIDGE={version:'2026.09.10.2',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{applied:0,required:0,retiredMappingCount:93,runtimeMutation:false,policy:'Former keyed-answer rewrites are retired; final reviewed wording is supplied by the explicit assessment snapshot.'}};
})();
'''


def patch_base_qa()->None:
    text=BASE_QA.read_text(encoding='utf-8')
    old="    need(data.get('bridge',{}).get('strictAnswerBalance',{}).get('applied')==93,'strict answer-balance bridge did not reach 93/93 before audit')"
    new="    need(data.get('bridge',{}).get('strictAnswerBalance',{}).get('runtimeMutation') is False,'stable-review bridge must be read-only')"
    if old in text:text=text.replace(old,new,1)
    elif new not in text:raise SystemExit('Base QA stable-review contract anchor moved')
    BASE_QA.write_text(text,encoding='utf-8')


def patch_runtime_qa()->None:
    replacement=r"""def load_optional_runtime():
    global OPTIONAL_OVERLAY,OPTIONAL_POSITIONS
    src=base.text('evidence-maturity-deep-dive.js')
    start=src.find('const MATERIAL_PRACTICE=[')
    marker='const PRACTICE_LABS=normalisePractice();'
    end=src.find(marker,start)
    need(start>=0 and end>start,'extended material-practice source/normalizer missing')
    block=src[start:end+len(marker)]
    node=block+r'''
const fs=require('fs'),vm=require('vm');
const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
const window={MM_EVIDENCE_SOURCES:{sources:{},inferred:()=>[],hash},MM_MATERIAL_PRACTICE_EXTENSIONS:{version:'qa',labs:PRACTICE_LABS,scope:'QA runtime'}};
const sandbox={window,console,URL};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('evidence-maturity-formal-bridge.js','utf8'),sandbox,{filename:'evidence-maturity-formal-bridge.js'});
const out=[];
for(const lab of window.MM_MATERIAL_PRACTICE_EXTENSIONS.labs)for(let i=0;i<(lab.steps||[]).length;i++){
 const step=lab.steps[i],choices=step.choices||[],correct=choices.findIndex(c=>c&&c.correct===true);
 out.push({id:`optional-material:${lab.id}:${i}`,kind:'optional-material-practice',scope:'optional',labId:lab.id,title:lab.title||lab.id,level:lab.level||'',stage:step.stage||'',stem:step.question||'',options:choices.map(c=>c.text),correct,feedback:choices.map(c=>c.feedback||''),rationale:correct>=0?(choices[correct].feedback||''):'',sourceIds:lab.sourceIds||[],focus:lab.focus||'',critical:/safety|isolation|guard|interlock|shutdown|high-temperature/i.test((lab.focus||'')+' '+(step.question||''))});
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
    need(OPTIONAL_OVERLAY and OPTIONAL_OVERLAY.get('optionalChoicesValidated')==40,f'optional validation incomplete: {OPTIONAL_OVERLAY}')
    need(OPTIONAL_OVERLAY.get('optionalChoicesUpgraded')==0,f'optional bridge must be read-only: {OPTIONAL_OVERLAY}')
    need(OPTIONAL_POSITIONS==[10,10,10,10],f'optional source key positions not balanced: {OPTIONAL_POSITIONS}')
    return items"""
    replace_section(RUNTIME_QA,'def load_optional_runtime():','def load_final_runtime():',replacement)
    text=RUNTIME_QA.read_text(encoding='utf-8')
    text=text.replace("title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]","title:x.title||x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]")
    RUNTIME_QA.write_text(text,encoding='utf-8')


def verify()->None:
    p=PSYCH.read_text(encoding='utf-8');b=BRIDGE.read_text(encoding='utf-8')
    for marker in ('DISTRACTOR_CUE_RULES','CLAUSE_MARKERS','refineDistractor(','clauseCandidates(','balanceFormRows(','KEYED_CONCISE_OVERRIDES'):
        if marker in p:raise SystemExit('Heuristic psychometric mutation remains: '+marker)
    if 'sourceAuthoredSnapshotApplied:197' not in p or 'runtimeHeuristicSemanticEdits:0' not in p:raise SystemExit('Reviewed snapshot metadata missing')
    if 'STRICT_ANSWER_BALANCE' in b or 'opts[key]=replacement' in b or 'runtimeMutation:false' not in b:raise SystemExit('Stable-review runtime answer mutation remains')
    run(['node','--check',PSYCH.name]);run(['node','--check',BRIDGE.name])
    run([sys.executable,'-m','py_compile',BASE_QA.name,RUNTIME_QA.name])
    run([sys.executable,'qa_question_quality_50_pass_runtime.py'])


def main()->None:
    if 'sourceAuthoredSnapshotApplied:197' not in PSYCH.read_text(encoding='utf-8'):
        snapshot=compact(audited_baseline_items())
        PSYCH.write_text(psychometric_source(snapshot),encoding='utf-8')
        BRIDGE.write_text(bridge_source(),encoding='utf-8')
    patch_base_qa();patch_runtime_qa();verify()
    print(f'Frozen exact audited-main assessment output from {BASELINE}: 197 items; runtime semantic mutation retired.')

if __name__=='__main__':main()
