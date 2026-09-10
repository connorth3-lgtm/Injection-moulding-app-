#!/usr/bin/env python3
"""Freeze the reviewed learner-visible assessment output and retire runtime heuristics.

This one-way migration preserves the currently reviewed 197-item rendered bank, then
replaces heuristic psychometric/answer-length mutation with an explicit authored snapshot.
Future wording/key changes must edit reviewed source/snapshot content and pass QA; runtime
code is no longer allowed to rewrite answer semantics from cue words or clause lengths.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE_QA=ROOT/'qa_question_quality_50_pass.py'
RUNTIME_QA=ROOT/'qa_question_quality_50_pass_runtime.py'
PSYCH=ROOT/'assessment-psychometric-hardening.js'
BRIDGE=ROOT/'assessment-stable-review-bridge.js'


def replace_once(path:Path,old:str,new:str)->None:
    text=path.read_text(encoding='utf-8')
    if new in text:return
    n=text.count(old)
    if n!=1:raise SystemExit(f'Expected one anchor in {path.name}; found {n}')
    path.write_text(text.replace(old,new,1),encoding='utf-8')


def replace_section(path:Path,start:str,end:str,new:str)->None:
    text=path.read_text(encoding='utf-8')
    if new in text:return
    a=text.find(start);b=text.find(end,a+1)
    if a<0 or b<0 or b<=a:raise SystemExit(f'Could not locate section in {path.name}: {start!r} -> {end!r}')
    path.write_text(text[:a]+new.rstrip()+'\n\n'+text[b:],encoding='utf-8')


def patch_qa_for_current_optional_contract()->None:
    # During snapshot extraction the old 93-answer bridge is still present. Accept either
    # the historical migration state or the final read-only state, then tighten below.
    replace_once(
        BASE_QA,
        "    need(data.get('bridge',{}).get('strictAnswerBalance',{}).get('applied')==93,'strict answer-balance bridge did not reach 93/93 before audit')",
        "    balance=data.get('bridge',{}).get('strictAnswerBalance',{})\n    need(balance.get('applied')==93 or balance.get('runtimeMutation') is False,'stable-review bridge must be historical 93/93 or final read-only')",
    )
    new_optional=r"""def load_optional_runtime():
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
    need(OPTIONAL_POSITIONS==[10,10,10,10],f'optional key positions not balanced: {OPTIONAL_POSITIONS}')
    need(OPTIONAL_OVERLAY.get('optionalKeyPositions')==[10,10,10,10],f'optional overlay key-position mismatch: {OPTIONAL_OVERLAY}')
    return items"""
    replace_section(RUNTIME_QA,'def load_optional_runtime():','def load_final_runtime():',new_optional)
    text=RUNTIME_QA.read_text(encoding='utf-8')
    text=text.replace("title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]","title:x.title||x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]")
    RUNTIME_QA.write_text(text,encoding='utf-8')


def import_runtime_qa():
    spec=importlib.util.spec_from_file_location('mm_runtime_qa_freeze',RUNTIME_QA)
    if not spec or not spec.loader:raise SystemExit('Could not import runtime QA')
    module=importlib.util.module_from_spec(spec)
    sys.path.insert(0,str(ROOT))
    try:spec.loader.exec_module(module)
    finally:
        try:sys.path.remove(str(ROOT))
        except ValueError:pass
    return module


def compact_snapshot(items:list[dict])->list[dict]:
    out=[]
    for x in items:
        row={k:x.get(k) for k in ('id','kind','level','region','labId','title','stem','options','correct','feedback') if x.get(k) is not None}
        if len(row.get('options') or [])!=4 or not isinstance(row.get('correct'),int):
            raise SystemExit(f'Invalid frozen item shape: {row.get("id")}')
        out.append(row)
    if len(out)!=197 or len({x['id'] for x in out})!=197:raise SystemExit('Frozen snapshot must contain 197 unique items')
    return out


def render_psychometric(snapshot:list[dict])->str:
    payload=json.dumps(snapshot,ensure_ascii=False,separators=(',',':'))
    digest=hashlib.sha256(payload.encode()).hexdigest()
    return f'''/* MouldMaster authored psychometric snapshot — 2026.09.10.1 */
(function(){{
'use strict';
const VERSION='2026.09.10.1';
const CONTENT_SHA256='{digest}';
const SNAPSHOT={payload};
const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||D.scenarios?.length!==40)throw new Error('All assessment banks must load before the authored psychometric snapshot');
function question(id){{
 let m=id.match(/^tech:([^:]+):(\\d+)$/);if(m)return D.exams?.[m[1]]?.[Number(m[2])];
 m=id.match(/^reg:([^:]+):([^:]+):(\\d+)$/);if(m)return D.regionalQuestions?.[m[1]]?.[m[2]]?.[Number(m[3])];
 if(id.startsWith('scenario:'))return (D.scenarios||[]).find((s,i)=>(s.mmStableId||`scenario:${{String(i+1).padStart(2,'0')}}`)===id);
 const banks=[['lab:',DIAG],['material:',MAT],['optional-material:',OPT]];
 for(const [prefix,bank] of banks)if(id.startsWith(prefix)){{const tail=id.slice(prefix.length),cut=tail.lastIndexOf(':'),labId=tail.slice(0,cut),step=Number(tail.slice(cut+1));return (bank.labs||[]).find(l=>l.id===labId)?.steps?.[step]}}
 return null
}}
function setFormal(q,row){{if(Array.isArray(q)){{q[0]=row.stem;q[1]=row.options.slice();q[2]=row.correct;q[6]=(row.feedback||[]).slice()}}else{{q.q=row.stem;q.options=row.options.slice();q.correct=row.correct;q.optionFeedback=(row.feedback||[]).slice()}}}}
function setScenario(s,row){{const prefix=`${{s.title}}: `;s.situation=String(row.stem||'').startsWith(prefix)?String(row.stem).slice(prefix.length):String(row.stem||'');s.choices=row.options.slice();s.correct=row.correct;s.feedback=(row.feedback||[]).slice()}}
function setLab(step,row){{step.question=row.stem;step.choices=row.options.map((text,i)=>({{text,correct:i===row.correct,feedback:(row.feedback||[])[i]||''}}));if(row.kind==='optional-material-practice')step.answerIndex=row.correct}}
let applied=0;for(const row of SNAPSHOT){{const target=question(row.id);if(!target)throw new Error(`Authored psychometric item missing: ${{row.id}}`);if(row.kind==='technical-exam'||row.kind==='regional-exam')setFormal(target,row);else if(row.kind==='scenario')setScenario(target,row);else setLab(target,row);applied++}}
if(applied!==197)throw new Error(`Authored psychometric snapshot coverage mismatch: ${{applied}}/197`);
const keyPositions=rows=>rows.reduce((a,x)=>{{const k=Number(x);if(k>=0&&k<4)a[k]++;return a}},[0,0,0,0]);
const technical=[];for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.exams?.[level]||[])technical.push(Number(q?.correct??q?.[2]));
const scenarios=(D.scenarios||[]).map(s=>Number(s.correct));
const technicalKeyPositions=keyPositions(technical),scenarioKeyPositions=keyPositions(scenarios);
if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Authored technical key positions changed: ${{technicalKeyPositions.join(',')}}`);
if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Authored scenario key positions changed: ${{scenarioKeyPositions.join(',')}}`);
const meta={{version:VERSION,contentSha256:CONTENT_SHA256,itemsHardened:197,optionsParallelised:788,sourceAuthoredSnapshotApplied:197,runtimeHeuristicSemanticEdits:0,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions,scenarioKeyPositions,initialization:'explicit-reviewed-snapshot',policy:'Learner-visible stems, answer text, answer keys and option feedback are explicit reviewed content. Runtime cue-word substitution, clause trimming and answer-length rewriting are forbidden.'}};
D.assessmentQA=D.assessmentQA||{{}};D.assessmentQA.psychometricHardening={{...meta}};window.MM_PSYCHOMETRIC_HARDENING=Object.freeze(meta);
}})();
'''


def render_bridge()->str:
    return '''/* MouldMaster stable spaced-review ID + blueprint guard — read-only 2026.09.10.1 */
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
window.MM_STABLE_REVIEW_BRIDGE={version:'2026.09.10.1',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{applied:0,required:0,retiredMappingCount:93,runtimeMutation:false,policy:'The former 93 keyed-answer runtime rewrites are retired. Final reviewed wording is materialised by assessment-psychometric-hardening.js as an explicit authored snapshot.'}};
})();
'''


def tighten_base_qa()->None:
    text=BASE_QA.read_text(encoding='utf-8')
    old="    balance=data.get('bridge',{}).get('strictAnswerBalance',{})\n    need(balance.get('applied')==93 or balance.get('runtimeMutation') is False,'stable-review bridge must be historical 93/93 or final read-only')"
    new="    balance=data.get('bridge',{}).get('strictAnswerBalance',{})\n    need(balance.get('runtimeMutation') is False,'stable-review bridge must be read-only; answer wording belongs to the authored psychometric snapshot')"
    if new not in text:
        if old not in text:raise SystemExit('Could not tighten stable-review QA')
        text=text.replace(old,new,1)
    BASE_QA.write_text(text,encoding='utf-8')


def verify()->None:
    psych=PSYCH.read_text(encoding='utf-8');bridge=BRIDGE.read_text(encoding='utf-8')
    for forbidden in ('DISTRACTOR_CUE_RULES','CLAUSE_MARKERS','refineDistractor(','clauseCandidates(','balanceFormRows(','KEYED_CONCISE_OVERRIDES'):
        if forbidden in psych:raise SystemExit('Heuristic psychometric mutation remains: '+forbidden)
    if 'sourceAuthoredSnapshotApplied:197' not in psych or 'runtimeHeuristicSemanticEdits:0' not in psych:raise SystemExit('Authored snapshot metadata missing')
    if 'STRICT_ANSWER_BALANCE' in bridge or 'opts[key]=replacement' in bridge or 'runtimeMutation:false' not in bridge:raise SystemExit('Stable-review answer mutation remains')
    subprocess.run(['node','--check',str(PSYCH.name)],cwd=ROOT,check=True)
    subprocess.run(['node','--check',str(BRIDGE.name)],cwd=ROOT,check=True)
    subprocess.run([sys.executable,'-m','py_compile',BASE_QA.name,RUNTIME_QA.name],cwd=ROOT,check=True)
    subprocess.run([sys.executable,'qa_question_quality_50_pass_runtime.py'],cwd=ROOT,check=True)


def main()->None:
    # Idempotent after the freeze: the explicit snapshot is already authoritative.
    if 'sourceAuthoredSnapshotApplied:197' in PSYCH.read_text(encoding='utf-8'):
        tighten_base_qa();verify();print('Assessment psychometric bank already frozen and verified.');return
    patch_qa_for_current_optional_contract()
    qa=import_runtime_qa();items=qa.load_final_runtime();snapshot=compact_snapshot(items)
    PSYCH.write_text(render_psychometric(snapshot),encoding='utf-8')
    BRIDGE.write_text(render_bridge(),encoding='utf-8')
    tighten_base_qa();verify()
    print('Frozen 197 reviewed learner-visible assessment items; retired heuristic psychometric and 93-answer runtime mutation.')

if __name__=='__main__':main()
