from pathlib import Path
import json
import re
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

ASSET='assessment-system-upgrade.js'
for p in [ASSET,'assessment-deep-dive.js','training-upgrade.js','version.json','index.html','service-worker.js','desktop/electron/package.json','desktop/electron/scripts/generate-integrity.cjs','sources/ASSESSMENT_SYSTEM_REGISTER.md','sources/SOURCE_FRESHNESS.json','qa_source_freshness.py','.github/workflows/source-freshness.yml','.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    need((ROOT/p).exists(),f'assessment-system file missing: {p}')

src=text(ASSET)
for marker in [
    "const BANK_VERSION='2026.08.24.2'",
    "mm_assessment_analytics_v1",
    "localOnlyAnalytics:true",
    "BLUEPRINTS",
    "stableTech",
    "stableReg",
    "revisionHistory",
    "duplicateConceptGuard:true",
    "answerLeakQA:true",
    "perQuestionEvidence:true",
    "sourceFreshnessMonitoring:true",
    "regionalAnswerChanges:0",
    "Evidence ·",
    "Clear local analytics",
]: need(marker in src,f'assessment-system marker missing: {marker}')
need(src.count("{title:'")>=27,'production scenario expansion unexpectedly small')
need('http://' not in src,'assessment-system sources must use HTTPS')

p=subprocess.run(['node','--check',str(ROOT/ASSET)],capture_output=True,text=True)
need(p.returncode==0,f'{ASSET} syntax error: {p.stderr}')
p=subprocess.run(['python','qa_source_freshness.py'],cwd=ROOT,capture_output=True,text=True)
need(p.returncode==0,f'source freshness static QA failed: {p.stderr or p.stdout}')

core=text('MouldMaster_Core_App.html'); mark='window.MM_DATA = '
need(mark in core,'MM_DATA marker missing')
D,_=json.JSONDecoder().raw_decode(core[core.index(mark)+len(mark):])
extra_titles=['Fill time drifts but recipe does not','One cavity becomes light','Recovery time becomes erratic','Dimension shifts after water-line work','Part sticks after texture change','Cpk drops after gauge change','DOE result changes by run order','Pressure sensor disagrees with machine']
for title in extra_titles:
    D['scenarios'].append({'title':title,'situation':'synthetic pre-upgrade scenario','choices':['a','b','c','d'],'correct':0,'why':'synthetic','feedback':['a','b','c','d']})

with tempfile.NamedTemporaryFile('w',suffix='.json',delete=False,encoding='utf-8') as f:
    json.dump(D,f,ensure_ascii=False); data_path=Path(f.name)
node_test=r'''
const fs=require('fs'),vm=require('vm');
const D=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const sandbox={window:{MM_DATA:D},console,Math,Date};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),sandbox,{filename:'assessment-deep-dive.js'});
vm.runInContext(fs.readFileSync(process.argv[3],'utf8'),sandbox,{filename:'assessment-system-upgrade.js'});
const S=sandbox.window.MM_ASSESSMENT_SYSTEM;if(!S)throw new Error('assessment system runtime marker missing');
if(S.bankVersion!=='2026.08.24.2')throw new Error('runtime bank version mismatch');
if(D.scenarios.length!==43)throw new Error(`expected 43 scenarios, got ${D.scenarios.length}`);
if(S.scenarioCount!==43)throw new Error('runtime scenario metadata mismatch');
const norm=x=>String(x||'').trim().toLowerCase();
const ids=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<10;i++)ids.push(S.stableTech(level,i));
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<3;i++)ids.push(S.stableReg(region,level,i));
if(ids.length!==57||new Set(ids).size!==57)throw new Error('57 stable question IDs are not unique');
if(Object.keys(S.revisionChanges||{}).length!==12)throw new Error('expected 12 explicit revision-2 technical records');
const blueprint=S.blueprints;
function validateExam(level,region){
 const q=S.buildExam(level,region),expected=region==='ALL'?16:10;if(q.length!==expected)throw new Error(`${level}/${region} count ${q.length}`);
 const tech=q.filter(x=>x.kind==='technical'),reg=q.filter(x=>x.kind==='regional');if(tech.length!==7)throw new Error('technical count must be 7');if(reg.length!==(region==='ALL'?9:3))throw new Error('regional count wrong');
 if(reg.some(x=>!x.critical||x.competency!=='safety'))throw new Error('regional question lost safety-critical metadata');
 const concepts=new Set();for(const x of q){
   if(!x.stableId||!x.revision||!x.difficulty||!x.competency)throw new Error('question metadata incomplete');
   if(!x.mmId||!x.mmId.includes('2026.08.24.2'))throw new Error('spaced-review mmId not on current bank version');
   if(!Array.isArray(x.options)||x.options.length!==4||new Set(x.options.map(norm)).size!==4)throw new Error('bad answer options');
   if(!Number.isInteger(x.correct)||x.correct<0||x.correct>3)throw new Error('bad correct key');
   if(!Array.isArray(x.optionFeedback)||x.optionFeedback.length!==4)throw new Error('option feedback misaligned');
   if(x.sourceUrl&&!String(x.sourceUrl).startsWith('https://'))throw new Error('non-HTTPS exact source');
   for(const e of x.evidence||[])if(!String(e[1]||'').startsWith('https://'))throw new Error('non-HTTPS evidence link');
   if(x.kind==='technical'){if(concepts.has(x.concept))throw new Error('duplicate technical concept in generated exam');concepts.add(x.concept)}
 }
 const counts={};for(const x of tech)counts[x.competency]=(counts[x.competency]||0)+1;
 for(const [c,n] of Object.entries(blueprint[level]))if((counts[c]||0)<n)throw new Error(`${level} blueprint missing ${c}: ${counts[c]||0}/${n}`);
}
for(let run=0;run<100;run++)for(const level of ['Beginner','Intermediate','Advanced'])for(const region of ['UK','US','NZ','ALL'])validateExam(level,region);
const scenarioIds=new Set();for(const s of D.scenarios){
 if(!s.stableId||scenarioIds.has(s.stableId))throw new Error('scenario stable ID missing/duplicate');scenarioIds.add(s.stableId);
 if(!s.revision||!s.competency||!s.difficulty||!Array.isArray(s.revisionHistory)||!s.revisionHistory.length)throw new Error('scenario metadata incomplete');
 if(!Array.isArray(s.choices)||s.choices.length!==4||new Set(s.choices.map(norm)).size!==4)throw new Error(`scenario options invalid: ${s.title}`);
 if(!Number.isInteger(s.correct)||s.correct<0||s.correct>3)throw new Error('scenario answer key invalid');
 if(!String(s.why||'').trim()||!Array.isArray(s.feedback)||s.feedback.length!==4)throw new Error('scenario rationale/feedback incomplete');
}
if(D.assessmentQA?.systemUpgrade?.regionalAnswerChanges!==0)throw new Error('system layer must record zero regional answer changes');
// Severe answer-leak scan: flag only extreme length asymmetry or explicit answer labels.
const all=[];for(const level of Object.keys(D.exams))for(const q of D.exams[level])all.push(['technical',level,q]);for(const region of Object.keys(D.regionalQuestions))for(const level of Object.keys(D.regionalQuestions[region]))for(const q of D.regionalQuestions[region][level])all.push(['regional',`${region}/${level}`,q]);
const warnings=[];for(const [kind,where,q] of all){const words=q[1].map(x=>String(x).trim().split(/\s+/).filter(Boolean).length),correct=words[q[2]],ds=words.filter((_,i)=>i!==q[2]).sort((a,b)=>a-b),median=ds[1];if(correct>=Math.max(16,median*3.25)&&correct-median>=10)warnings.push(`${kind} ${where}: unusually long correct option (${correct} vs ${median})`);if(median>=12&&correct<=3&&median-correct>=9)warnings.push(`${kind} ${where}: unusually short correct option (${correct} vs ${median})`);if(/^correct\b/i.test(String(q[1][q[2]])))throw new Error('correct option explicitly labels itself correct')}
if(warnings.length>8)throw new Error(`severe answer-length cue count too high: ${warnings.length}`);warnings.forEach(x=>console.log('ANSWER-CUE WARNING:',x));
console.log(JSON.stringify({scenarios:D.scenarios.length,stableIds:ids.length,revision2:Object.keys(S.revisionChanges).length,answerCueWarnings:warnings.length}));
'''
try:
    p=subprocess.run(['node','-e',node_test,str(data_path),str(ROOT/'assessment-deep-dive.js'),str(ROOT/ASSET)],capture_output=True,text=True)
finally:
    data_path.unlink(missing_ok=True)
need(p.returncode==0,f'assessment runtime/blueprint QA failed: {p.stderr or p.stdout}')

V=json.loads(text('version.json'))
need(V.get('question_bank_version')=='2026.08.24.2','question bank version must be bumped to 2026.08.24.2')
need(V.get('content_version')=='2026.08.24.2','content version must be bumped to 2026.08.24.2')
need("const BANK_VERSION='2026.08.24.2'" in text('training-upgrade.js'),'spaced-review bank version not bumped')

idx=text('index.html')
need('<script src="./assessment-system-upgrade.js">' in idx,'assessment system not loaded by shell')
need(idx.index('assessment-deep-dive.js')<idx.index('assessment-system-upgrade.js')<idx.index('source-library.js'),'assessment-system load order wrong')
need("'./assessment-system-upgrade.js'" in text('service-worker.js'),'assessment system missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-system-upgrade.js' in froms,'assessment system missing from desktop package')
need("'assessment-system-upgrade.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'assessment system missing from integrity set')

qy=text('.github/workflows/qa.yml')
need('node --check assessment-system-upgrade.js' in qy and 'python qa_assessment_system.py' in qy and 'python qa_source_freshness.py' in qy,'release workflow missing assessment/freshness QA')
ow=text('.github/workflows/open-desktop-build.yml')
for marker in ["- 'assessment-system-upgrade.js'","- 'qa_assessment_system.py'","- 'qa_source_freshness.py'","- 'sources/ASSESSMENT_SYSTEM_REGISTER.md'","- 'sources/SOURCE_FRESHNESS.json'","- '.github/workflows/source-freshness.yml'",'python qa_assessment_system.py','python qa_source_freshness.py']:
    need(marker in ow,f'open desktop workflow missing {marker}')
store=text('.github/workflows/microsoft-store-msix.yml')
need('python qa_assessment_system.py' in store and 'python qa_source_freshness.py' in store,'Store workflow missing assessment/freshness QA')

print('MouldMaster assessment-system QA passed (57 stable exam IDs; blueprint sampling; 43 scenarios; revision history; local analytics; answer-cue guard; source freshness)')
