from pathlib import Path
import json
import re
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

PATCH='assessment-deep-dive.js'
REGISTER='sources/QUESTION_BANK_DEEP_DIVE.md'
for p in [PATCH,REGISTER,'index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    need((ROOT/p).exists(),f'missing deep assessment file: {p}')

src=text(PATCH)
need(src.count("set('")==12,'deep dive must rewrite exactly 12 technical items')
for marker in [
    "technicalItemsRewritten:12",
    "scenarioItemsRewritten:8",
    "regionalAnswerChanges:0",
    "MFR is measured under specified test conditions",
    "Part mass reaches a repeatable plateau",
    "Machine/nozzle and local cavity pressure are measurements at different locations",
    "factor effect may be confounded with time-related drift",
    "Reproduce the relevant material/process outputs",
    "https://doi.org/10.1007/s13367-023-00081-y",
    "https://doi.org/10.1515/ipp-2022-4281",
    "https://doi.org/10.1007/s00170-023-11100-1",
    "https://doi.org/10.3390/s22134792",
]: need(marker in src,f'deep-dive marker missing: {marker}')
need('http://' not in src,'deep assessment sources must use HTTPS')
need('regionalQuestions' not in src,'deep-dive patch must not mutate regional question bank')

scenario_titles=[
 'Fill time drifts but recipe does not','One cavity becomes light','Recovery time becomes erratic','Dimension shifts after water-line work',
 'Part sticks after texture change','Cpk drops after gauge change','DOE result changes by run order','Pressure sensor disagrees with machine'
]
for title in scenario_titles: need(title in src,f'scenario rewrite missing: {title}')

p=subprocess.run(['node','--check',str(ROOT/PATCH)],capture_output=True,text=True)
need(p.returncode==0,f'{PATCH} syntax error: {p.stderr}')

# Execute the real patch against a synthetic data bank. This tests runtime mutation,
# answer structure, feedback alignment and regional-bank isolation without needing a browser.
node_test=r'''
const fs=require('fs'),vm=require('vm');
const titles=%s;
const old=()=>['old question',['one','two','three','four'],0,'old why','old ref',null,['a','b','c','d'],false];
const D={exams:{Beginner:Array.from({length:10},old),Intermediate:Array.from({length:10},old),Advanced:Array.from({length:10},old)},scenarios:titles.map(title=>({title,situation:'old',choices:['a','b','c','d'],correct:0,why:'old',feedback:['a','b','c','d']})),regionalQuestions:{UK:{sentinel:1},US:{sentinel:2},NZ:{sentinel:3}},assessmentQA:{}};
const before=JSON.stringify(D.regionalQuestions);
const sandbox={window:{MM_DATA:D},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:%s});
let changed=0;
for(const level of Object.keys(D.exams))for(const q of D.exams[level]){
  if(q[0]!=='old question')changed++;
  if(q[0]==='old question')continue;
  if(!Array.isArray(q)||q.length<8)throw new Error('question fields incomplete');
  if(!Array.isArray(q[1])||q[1].length!==4)throw new Error('question must have four options');
  if(new Set(q[1].map(x=>String(x).trim().toLowerCase())).size!==4)throw new Error('duplicate options');
  if(!Number.isInteger(q[2])||q[2]<0||q[2]>3)throw new Error('invalid answer key');
  if(!String(q[3]).trim()||!String(q[4]).trim())throw new Error('missing rationale/reference');
  if(q[5]!==null&&!String(q[5]).startsWith('https://'))throw new Error('non-HTTPS source');
  if(!Array.isArray(q[6])||q[6].length!==4)throw new Error('feedback must align to four options');
  if(q[6].some(x=>String(x).trim().length<20))throw new Error('feedback too shallow');
  if(new Set(q[6].map(x=>String(x).trim().toLowerCase())).size<3)throw new Error('feedback is overly generic');
  if(!String(q[6][q[2]]).toLowerCase().includes('correct'))throw new Error('keyed feedback must explicitly identify correct answer');
}
if(changed!==12)throw new Error(`expected 12 rewrites, got ${changed}`);
for(const s of D.scenarios){
  if(!Array.isArray(s.choices)||s.choices.length!==4)throw new Error('scenario choice count');
  if(new Set(s.choices.map(x=>String(x).trim().toLowerCase())).size!==4)throw new Error('scenario duplicate choices');
  if(!Number.isInteger(s.correct)||s.correct<0||s.correct>3)throw new Error('scenario key');
  if(!Array.isArray(s.feedback)||s.feedback.length!==4)throw new Error('scenario feedback count');
  if(s.feedback.some(x=>String(x).trim().length<20))throw new Error('scenario feedback too shallow');
  if(!String(s.feedback[s.correct]).toLowerCase().includes('correct'))throw new Error('scenario keyed feedback');
}
if(JSON.stringify(D.regionalQuestions)!==before)throw new Error('regional bank changed');
if(!D.assessmentQA.questionDeepDive||D.assessmentQA.questionDeepDive.technicalItemsRewritten!==12||D.assessmentQA.questionDeepDive.scenarioItemsRewritten!==8)throw new Error('deep-dive metadata missing');
if(!sandbox.window.MM_QUESTION_DEEP_DIVE||sandbox.window.MM_QUESTION_DEEP_DIVE.regionalAnswerChanges!==0)throw new Error('deep-dive runtime marker missing');
console.log('runtime deep question patch passed');
'''%(json.dumps(scenario_titles),json.dumps(str(ROOT/PATCH)),json.dumps(PATCH))
p=subprocess.run(['node','-e',node_test],capture_output=True,text=True)
need(p.returncode==0,f'deep question runtime QA failed: {p.stderr or p.stdout}')

reg=text(REGISTER)
for marker in [
 'all 57 live exam questions','all 16 troubleshooting scenario drills','Twelve technical questions and eight scenario drills','regional safety/compliance answer keys','MFR needed stronger treatment','DOE reasoning needed a real confounding case','ISO 20430:2020 remains published and confirmed','Research results are evidence of mechanisms or methods, not automatic local production settings'
]: need(marker in reg,f'deep question register marker missing: {marker}')

idx=text('index.html')
need('<script src="./assessment-deep-dive.js">' in idx,'deep assessment patch not loaded by shell')
need(idx.index('assessment-100-pass.js')<idx.index('assessment-deep-dive.js')<idx.index('source-library.js'),'deep assessment patch load order wrong')
need("'./assessment-deep-dive.js'" in text('service-worker.js'),'deep assessment patch not cached offline')
pkg=json.loads(text('desktop/electron/package.json'))
froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-deep-dive.js' in froms,'deep assessment patch missing from desktop package')
need("'assessment-deep-dive.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'deep assessment patch missing from integrity hashes')

qy=text('.github/workflows/qa.yml')
need('node --check assessment-deep-dive.js' in qy and 'python qa_question_deep_dive.py' in qy,'release workflow missing deep question QA')
ow=text('.github/workflows/open-desktop-build.yml')
need("- 'assessment-deep-dive.js'" in ow and "- 'qa_question_deep_dive.py'" in ow and "- 'sources/QUESTION_BANK_DEEP_DIVE.md'" in ow and 'python qa_question_deep_dive.py' in ow,'desktop workflow missing deep question QA')
need('python qa_question_deep_dive.py' in text('.github/workflows/microsoft-store-msix.yml'),'Store workflow missing deep question QA')

print('MouldMaster deep question-and-answer QA passed (57 exams reviewed; 12 technical rewrites; 16 scenarios reviewed; 8 scenario rewrites; 0 regional key changes)')
