from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

required=[
 'assessment-final-hardening.js','sources/QUESTION_REVISION_INDEX.json','sources/RESEARCH_SOURCE_FRESHNESS.json',
 'qa_research_source_freshness.py','index.html','service-worker.js','version.json','desktop/electron/package.json',
 'desktop/electron/scripts/generate-integrity.cjs','.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml',
 '.github/workflows/microsoft-store-msix.yml','.github/workflows/source-freshness.yml'
]
for p in required: need((ROOT/p).exists(),f'final hardening file missing: {p}')

js=text('assessment-final-hardening.js')
for marker in [
 "const VERSION='2026.08.24.3'","const BANK_VERSION='2026.08.24.2'","mm_assessment_exposure_timing_v1",
 "intersectionRatio>=0.55","document.hidden","hiddenAccum","first meaningful question exposure",
 "legacyExamElapsedTotalMs","legacyExamElapsedLastMs","Slowest by question exposure",
 "mm-revision-detail","Research DOI resolver set reviewed","MM_QUESTION_REVISIONS","MM_ASSESSMENT_FINAL_HARDENING"
]: need(marker in js,f'final assessment hardening marker missing: {marker}')
p=subprocess.run(['node','--check',str(ROOT/'assessment-final-hardening.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-final-hardening.js syntax error: {p.stderr}')

rev=json.loads(text('sources/QUESTION_REVISION_INDEX.json'))
need(rev.get('schema')==1 and rev.get('bank_version')=='2026.08.24.2','question revision index version mismatch')
ids=rev.get('all_stable_ids',[]); need(len(ids)==57 and len(set(ids))==57,'question revision index must contain exactly 57 unique stable IDs')
need(rev.get('stable_id_count')==57,'question revision stable_id_count mismatch')
need(len(rev.get('revision2',{}))==12,'deep-review revision-2 set must contain 12 questions')

node=r'''
const fs=require('fs'),vm=require('vm');
const D={assessmentQA:{},exams:{Beginner:Array(10).fill(0),Intermediate:Array(10).fill(0),Advanced:Array(10).fill(0)},regionalQuestions:{}};
for(const r of ['UK','US','NZ']){D.regionalQuestions[r]={};for(const l of ['Beginner','Intermediate','Advanced'])D.regionalQuestions[r][l]=Array(3).fill(0)}
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
const document={hidden:false,documentElement:{clientHeight:800,clientWidth:1200},getElementById:()=>null,createElement:()=>({id:'',textContent:''}),head:{appendChild(){}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
const analytics={export:()=>({questions:{}})};
const window={MM_DATA:D,MM_ASSESSMENT_ANALYTICS:analytics,startExam(){},gradeExam(){},renderExams(){},innerHeight:800,innerWidth:1200,addEventListener(){}};
const sandbox={window,document,localStorage,performance:{now:()=>1000},console,setTimeout:fn=>{if(typeof fn==='function')fn()},IntersectionObserver:function(){this.observe=()=>{};this.disconnect=()=>{}},Date,Math,JSON,Object,Number};
window.window=window;window.document=document;window.localStorage=localStorage;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-final-hardening.js'});
process.stdout.write(JSON.stringify({ids:window.MM_QUESTION_REVISIONS.stableIds,revision2:window.MM_QUESTION_REVISIONS.revision2,qa:D.assessmentQA.finalHardening,version:window.MM_ASSESSMENT_FINAL_HARDENING.version}));
'''%json.dumps(str(ROOT/'assessment-final-hardening.js'))
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,f'final hardening runtime QA failed: {p.stderr or p.stdout}')
runtime=json.loads(p.stdout)
need(runtime['ids']==ids,'runtime stable question IDs differ from revision index')
need(runtime['revision2']==rev['revision2'],'runtime revision reasons differ from governance index')
need(runtime['qa']['stableIds']==57 and runtime['qa']['revision2Items']==12,'runtime final-hardening metadata mismatch')
need(runtime['version']=='2026.08.24.3','runtime final-hardening version mismatch')

V=json.loads(text('version.json'))
need(V.get('question_bank_version')=='2026.08.24.2','question bank must remain unchanged by analytics hardening')
need(V.get('assessment_quality_version')=='2026.08.24.3','assessment quality version must be 2026.08.24.3')

idx=text('index.html')
need('<script src="./assessment-final-hardening.js">' in idx,'final hardening not loaded by shell')
need(idx.index('assessment-analytics-ui.js')<idx.index('assessment-final-hardening.js')<idx.index('source-library.js'),'final hardening load order wrong')
need("'./assessment-final-hardening.js'" in text('service-worker.js'),'final hardening missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-final-hardening.js' in froms,'final hardening missing from desktop package')
need("'assessment-final-hardening.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'final hardening missing from integrity set')

qy=text('.github/workflows/qa.yml')
need('node --check assessment-final-hardening.js' in qy,'release workflow missing final hardening syntax check')
need('python qa_assessment_final_hardening.py' in qy,'release workflow missing final hardening QA')
need('python qa_research_source_freshness.py' in qy,'release workflow missing research-source freshness QA')
ow=text('.github/workflows/open-desktop-build.yml')
for marker in ["- 'assessment-final-hardening.js'","- 'qa_assessment_final_hardening.py'","- 'qa_research_source_freshness.py'","- 'sources/RESEARCH_SOURCE_FRESHNESS.json'",'python qa_assessment_final_hardening.py','python qa_research_source_freshness.py']:
    need(marker in ow,f'open-desktop workflow missing final hardening marker: {marker}')
store_yml=text('.github/workflows/microsoft-store-msix.yml')
need('python qa_assessment_final_hardening.py' in store_yml and 'python qa_research_source_freshness.py' in store_yml,'Store workflow missing final assessment/research QA')
fresh=text('.github/workflows/source-freshness.yml')
need('python qa_research_source_freshness.py --network' in fresh,'weekly freshness workflow missing DOI resolver checks')
need('research-source-freshness-report.json' in fresh,'weekly freshness workflow must retain DOI freshness report')

p=subprocess.run(['python',str(ROOT/'qa_research_source_freshness.py')],capture_output=True,text=True)
need(p.returncode==0,f'research-source static freshness QA failed: {p.stderr or p.stdout}')

print('MouldMaster final assessment hardening QA passed (57 stable IDs; 12 revision-2 items; exposure-based timing; research DOI freshness gated)')
