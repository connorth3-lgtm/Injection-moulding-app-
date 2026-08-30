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
 "const VERSION='2026.08.24.3'","const BANK_VERSION='2026.08.30.1'","mm_assessment_exposure_timing_v1",
 "const REVISION3=","const REGIONAL_REVISION_CHANGE=","REVISION3[id]||REVISION2[id]||BASELINE",
 "revision2Items:Object.keys(REVISION2).length","revision3Items:Object.keys(REVISION3).length",
 "intersectionRatio>=0.55","document.hidden","hiddenAccum","first meaningful question exposure",
 "legacyExamElapsedTotalMs","legacyExamElapsedLastMs","Slowest by question exposure",
 "mm-revision-detail","Research DOI resolver set reviewed","MM_QUESTION_REVISIONS","MM_ASSESSMENT_FINAL_HARDENING",
 "localStorage.removeItem(TIMING_KEY)","__mmOriginalReset"
]: need(marker in js,f'final assessment hardening marker missing: {marker}')
p=subprocess.run(['node','--check',str(ROOT/'assessment-final-hardening.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-final-hardening.js syntax error: {p.stderr}')

rev=json.loads(text('sources/QUESTION_REVISION_INDEX.json'))
need(rev.get('schema')==1 and rev.get('bank_version')=='2026.08.30.1','question revision index version mismatch')
ids=rev.get('all_stable_ids',[])
need(len(ids)==57 and len(set(ids))==57,'question revision index must contain exactly 57 unique stable IDs')
need(rev.get('stable_id_count')==57,'question revision stable_id_count mismatch')
rev2=rev.get('revision2',{}); rev3=rev.get('revision3',{})
need(len(rev2)==39,'reviewed revision-2 set must contain 12 earlier technical + 27 regional items')
need(len(rev3)==18,'evidence-diagnostic revision-3 set must contain 18 technical items')
need(not (set(rev2) & set(rev3)),'revision2 and revision3 stable-ID sets must not overlap')
need(set(rev2)|set(rev3)==set(ids),'all 57 live stable IDs must have an explicit reviewed revision')
regional_ids={x for x in ids if x.startswith('reg:')}
technical_ids={x for x in ids if x.startswith('tech:')}
need(len(regional_ids)==27 and regional_ids <= set(rev2),'all 27 regional stable IDs must be reviewed revision 2')
need(len(technical_ids)==30 and technical_ids <= (set(rev2)|set(rev3)),'all 30 technical stable IDs must have a reviewed revision')
need(sum(1 for x in rev2 if x.startswith('tech:'))==12,'revision 2 must retain exactly 12 earlier technical reviews')
need(all(x.startswith('tech:') for x in rev3),'revision 3 must contain technical questions only')

node=r'''
const fs=require('fs'),vm=require('vm');
const D={assessmentQA:{},exams:{Beginner:Array(10).fill(0),Intermediate:Array(10).fill(0),Advanced:Array(10).fill(0)},regionalQuestions:{}};
for(const r of ['UK','US','NZ']){D.regionalQuestions[r]={};for(const l of ['Beginner','Intermediate','Advanced'])D.regionalQuestions[r][l]=Array(3).fill(0)}
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
const document={hidden:false,documentElement:{clientHeight:800,clientWidth:1200},getElementById:()=>null,createElement:()=>({id:'',textContent:''}),head:{appendChild(){}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
let originalResetCalled=0;
const analytics={export:()=>({questions:{}}),reset:()=>{originalResetCalled++}};
const window={MM_DATA:D,MM_ASSESSMENT_ANALYTICS:analytics,startExam(){},gradeExam(){},renderExams(){},innerHeight:800,innerWidth:1200,addEventListener(){}};
const sandbox={window,document,localStorage,performance:{now:()=>1000},console,setTimeout:fn=>{if(typeof fn==='function')fn()},IntersectionObserver:function(){this.observe=()=>{};this.disconnect=()=>{}},Date,Math,JSON,Object,Number};
window.window=window;window.document=document;window.localStorage=localStorage;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-final-hardening.js'});
localStorage.setItem('mm_assessment_exposure_timing_v1',JSON.stringify({schema:1,questions:{sample:{attempts:1}}}));
window.MM_ASSESSMENT_ANALYTICS.reset();
process.stdout.write(JSON.stringify({ids:window.MM_QUESTION_REVISIONS.stableIds,revision2:window.MM_QUESTION_REVISIONS.revision2,revision3:window.MM_QUESTION_REVISIONS.revision3,qa:D.assessmentQA.finalHardening,version:window.MM_ASSESSMENT_FINAL_HARDENING.version,timingCleared:localStorage.getItem('mm_assessment_exposure_timing_v1')===null,originalResetCalled}));
'''%json.dumps(str(ROOT/'assessment-final-hardening.js'))
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,f'final hardening runtime QA failed: {p.stderr or p.stdout}')
runtime=json.loads(p.stdout)
need(runtime['ids']==ids,'runtime stable question IDs differ from revision index')
r2=runtime['revision2']; r3=runtime['revision3']
need(set(r2)==set(rev2),'runtime revision-2 stable IDs differ from governance index')
need(r3==rev3,'runtime revision-3 reasons differ from governance index')
# The 12 historical technical revision-2 reasons remain exact. Regional UI uses a concise
# shared description while the governance JSON retains item-specific audit reasons.
for qid in set(rev2) & technical_ids:
    need(r2[qid]==rev2[qid],f'runtime technical revision-2 reason differs for {qid}')
for qid in regional_ids:
    need(r2[qid].get('revision')==2 and r2[qid].get('date')=='2026-08-30',f'runtime regional revision metadata differs for {qid}')
    need('applied decision' in str(r2[qid].get('change','')).lower() and 'answer key' in str(r2[qid].get('change','')).lower(),f'runtime regional revision note is too weak for {qid}')
    need(rev2[qid].get('revision')==2 and rev2[qid].get('date')=='2026-08-30',f'governance regional revision metadata differs for {qid}')
need(runtime['qa']['stableIds']==57 and runtime['qa']['revision2Items']==39 and runtime['qa']['revision3Items']==18,'runtime final-hardening revision counts mismatch')
need(runtime['version']=='2026.08.24.3','runtime final-hardening version mismatch')
need(runtime['timingCleared'] is True,'Reset local analytics must remove exposure-timing data')
need(runtime['originalResetCalled']==1,'final hardening reset wrapper must preserve the original analytics reset')

V=json.loads(text('version.json'))
need(V.get('question_bank_version')=='2026.08.30.1','question bank version must reflect evidence-diagnostic rewrites')
need(V.get('assessment_quality_version')=='2026.08.24.3','assessment quality version must remain 2026.08.24.3')

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

print('MouldMaster final assessment hardening QA passed (57/57 stable IDs reviewed; 39 revision-2 + 18 revision-3; exposure-based timing; complete analytics reset; research DOI freshness gated)')
