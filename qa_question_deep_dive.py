from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parent
PATCH='assessment-deep-dive.js'
REGIONAL='assessment-answer-cue-fix.js'
REGISTER='sources/QUESTION_BANK_DEEP_DIVE.md'

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

for p in [PATCH,REGIONAL,REGISTER,'index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    need((ROOT/p).exists(),f'missing assessment deep-dive file: {p}')

tech=text(PATCH); regional=text(REGIONAL)
for marker in [
    "technicalItemsRewritten:30","scenarioItemsRewritten:8","regionalAnswerChanges:0",
    "observation:true","decision:true","discrimination:true","verification:true","insufficientEvidence:true",
    "MFR is measured under specified test conditions",
    "Part mass reaches a repeatable plateau",
    "Machine/nozzle and local cavity pressure are measurements at different locations",
    "factor effect may be confounded with time-related drift",
    "There is insufficient evidence for a defensible quantitative pressure-loss calculation",
    "https://doi.org/10.1007/s13367-023-00081-y",
    "https://doi.org/10.1515/ipp-2022-4281",
]: need(marker in tech,f'technical deep-dive marker missing: {marker}')
for marker in [
    "regionalItemsRewritten:27","regionalAnswerChanges:0","appliedSafety:true","officialSources:true",
    "PUWER 1998 Regulation 11","OSHA 29 CFR 1910.147","Health and Safety at Work Amendment Act 2026",
    "1 April 2027","regionalSet(region,level,i,item)"
]: need(marker in regional,f'regional deep-dive marker missing: {marker}')
need('http://' not in tech and 'http://' not in regional,'assessment sources must use HTTPS')

for js in [PATCH,REGIONAL]:
    p=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    need(p.returncode==0,f'{js} syntax error: {p.stderr}')

scenario_titles=[
 'Fill time drifts but recipe does not','One cavity becomes light','Recovery time becomes erratic','Dimension shifts after water-line work',
 'Part sticks after texture change','Cpk drops after gauge change','DOE result changes by run order','Pressure sensor disagrees with machine'
]
regional_keys={
 'UK':{'Beginner':[2,3,0],'Intermediate':[1,2,3],'Advanced':[0,1,2]},
 'US':{'Beginner':[3,0,1],'Intermediate':[2,3,0],'Advanced':[1,2,3]},
 'NZ':{'Beginner':[0,1,2],'Intermediate':[3,0,1],'Advanced':[2,3,0]},
}
node_test=r'''
const fs=require('fs'),vm=require('vm');
const titles=%s,keys=%s;
const oldTech=()=>['old technical',['one','two','three','four'],0,'old why','old ref',null,['old a','old b','old c','old d'],false];
const oldReg=k=>['old regional',['one','two','three','four'],k,'old why','old ref','https://example.com/old',['old a','old b','old c','old d'],true];
const D={exams:{Beginner:Array.from({length:10},oldTech),Intermediate:Array.from({length:10},oldTech),Advanced:Array.from({length:10},oldTech)},regionalQuestions:{},scenarios:titles.map(title=>({title,situation:'old',choices:['a','b','c','d'],correct:0,why:'old',feedback:['old a','old b','old c','old d']})),assessmentQA:{}};
for(const region of ['UK','US','NZ']){D.regionalQuestions[region]={};for(const level of ['Beginner','Intermediate','Advanced'])D.regionalQuestions[region][level]=keys[region][level].map(oldReg)}
const beforeKeys=JSON.stringify(Object.fromEntries(Object.entries(D.regionalQuestions).map(([r,levels])=>[r,Object.fromEntries(Object.entries(levels).map(([l,qs])=>[l,qs.map(q=>q[2])]))])));
const sandbox={window:{MM_DATA:D},console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:%s});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:%s});
function checkRow(q,critical){
 if(!Array.isArray(q)||q.length<8)throw new Error('question fields incomplete');
 if(!Array.isArray(q[1])||q[1].length!==4||new Set(q[1].map(x=>String(x).trim().toLowerCase())).size!==4)throw new Error('option integrity');
 if(!Number.isInteger(q[2])||q[2]<0||q[2]>3)throw new Error('invalid key');
 if(!String(q[3]).trim()||!String(q[4]).trim())throw new Error('missing rationale/reference');
 if(q[5]!==null&&!String(q[5]).startsWith('https://'))throw new Error('source must be HTTPS/null');
 if(!Array.isArray(q[6])||q[6].length!==4||q[6].some(x=>String(x).trim().length<20))throw new Error('feedback integrity');
 if(!String(q[6][q[2]]).toLowerCase().includes('correct'))throw new Error('keyed feedback must identify correct answer');
 if(q[7]!==critical)throw new Error('critical flag changed');
}
let techChanged=0,regionalChanged=0;
for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.exams[level]){checkRow(q,false);if(q[0]!=='old technical')techChanged++}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.regionalQuestions[region][level]){checkRow(q,true);if(q[0]!=='old regional')regionalChanged++}
if(techChanged!==30)throw new Error(`expected 30 technical rewrites, got ${techChanged}`);
if(regionalChanged!==27)throw new Error(`expected 27 regional rewrites, got ${regionalChanged}`);
const afterKeys=JSON.stringify(Object.fromEntries(Object.entries(D.regionalQuestions).map(([r,levels])=>[r,Object.fromEntries(Object.entries(levels).map(([l,qs])=>[l,qs.map(q=>q[2])]))])));
if(afterKeys!==beforeKeys)throw new Error('regional answer key changed');
for(const s of D.scenarios){if(!Array.isArray(s.choices)||s.choices.length!==4||!Array.isArray(s.feedback)||s.feedback.length!==4||!String(s.feedback[s.correct]).toLowerCase().includes('correct'))throw new Error(`scenario integrity: ${s.title}`)}
if(D.exams.Advanced[7][2]!==2||!D.exams.Advanced[7][1][2].startsWith('Match validated fill'))throw new Error('advanced transfer cue fix missing');
const t=D.assessmentQA.questionDeepDive,r=D.assessmentQA.regionalDeepDive;
if(!t||t.technicalItemsRewritten!==30||t.scenarioItemsRewritten!==8)throw new Error('technical metadata missing');
if(!r||r.regionalItemsRewritten!==27||r.regionalAnswerChanges!==0||r.appliedSafety!==true)throw new Error('regional metadata missing');
if(!sandbox.window.MM_QUESTION_DEEP_DIVE?.allTechnicalEvidenceReasoning)throw new Error('technical runtime marker missing');
if(!sandbox.window.MM_REGIONAL_QUESTION_DEEP_DIVE?.appliedSafety)throw new Error('regional runtime marker missing');
console.log('runtime all-live-question deep dive passed');
'''%(json.dumps(scenario_titles),json.dumps(regional_keys),json.dumps(str(ROOT/PATCH)),json.dumps(PATCH),json.dumps(str(ROOT/REGIONAL)),json.dumps(REGIONAL))
p=subprocess.run(['node','-e',node_test],capture_output=True,text=True)
need(p.returncode==0,f'all-question runtime QA failed: {p.stderr or p.stdout}')

reg=text(REGISTER)
for marker in ['209 unique keyed learner decisions','30 technical exam questions','27 regional UK/US/NZ safety/compliance questions','five evidence-reasoning modes','Insufficient evidence remains a valid expert answer','ISO 20430:2020','OSHA 29 CFR 1910.147','WorkSafe New Zealand']:
    need(marker.lower() in reg.lower(),f'question deep-dive register marker missing: {marker}')

idx=text('index.html')
need(idx.index('assessment-deep-dive.js')<idx.index('assessment-answer-cue-fix.js')<idx.index('assessment-quality-suite.js'),'assessment rewrite load order wrong')
need("'./assessment-deep-dive.js'" in text('service-worker.js') and "'./assessment-answer-cue-fix.js'" in text('service-worker.js'),'assessment patches not cached offline')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-deep-dive.js' in froms and '../../assessment-answer-cue-fix.js' in froms,'assessment patches missing from desktop package')
integ=text('desktop/electron/scripts/generate-integrity.cjs');need("'assessment-deep-dive.js'" in integ and "'assessment-answer-cue-fix.js'" in integ,'assessment patches missing from integrity set')
qy=text('.github/workflows/qa.yml');need('node --check assessment-deep-dive.js' in qy and 'node --check assessment-answer-cue-fix.js' in qy and 'python qa_question_deep_dive.py' in qy,'release workflow missing question QA')
need('python qa_question_deep_dive.py' in text('.github/workflows/open-desktop-build.yml'),'desktop workflow missing question QA')
need('python qa_question_deep_dive.py' in text('.github/workflows/microsoft-store-msix.yml'),'Store workflow missing question QA')

print('MouldMaster question-and-answer deep dive passed: canonical 209-decision register retained; 30 technical + 27 regional live exam rewrites; 8 deepened scenarios; 0 regional key changes')
