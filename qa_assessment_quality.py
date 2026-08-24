from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'assessment-quality-report.json'

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

for p in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js','assessment-deep-dive.js','training-upgrade.js','MouldMaster_Core_App.html','version.json','sources/QUESTION_BANK_CHANGELOG.md','sources/SOURCE_FRESHNESS.json','qa_source_freshness.py']:
    need((ROOT/p).exists(),f'missing assessment quality file: {p}')

suite=text('assessment-quality-suite.js')
for marker in [
    "const VERSION='2026.08.24.2'",
    "mm_assessment_analytics_v1",
    "tech:${level}:${index}",
    "reg:${region}:${level}:${index}",
    "const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting']",
    "Evidence, difficulty & revision",
    "Device-local learning analytics",
    "nearDuplicates",
    "answerLeakRisks",
    "migrateStableReviewIds",
    "scenarioDrills:D.scenarios.length",
    "sourceFreshnessReviewBy",
]: need(marker in suite,f'assessment quality marker missing: {marker}')
need(suite.count("['")>=24,'scenario expansion unexpectedly small')
need('http://' not in suite,'assessment quality source links must use HTTPS')
p=subprocess.run(['node','--check',str(ROOT/'assessment-quality-suite.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-quality-suite.js syntax error: {p.stderr}')

bridge=text('assessment-stable-review-bridge.js')
for marker in ["q.mmId=q.stableId","stableIdsPrimary:true","legacyRecordsMigratedBy:'assessment-quality-suite.js'"]:
    need(marker in bridge,f'stable-review bridge marker missing: {marker}')
p=subprocess.run(['node','--check',str(ROOT/'assessment-stable-review-bridge.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-stable-review-bridge.js syntax error: {p.stderr}')

analytics_ui=text('assessment-analytics-ui.js')
for marker in [
    'Accuracy by difficulty',
    'Most-selected wrong distractors',
    'Exam pass rates',
    'Export local analytics JSON',
    'mouldmaster-question-analytics.json',
    'MM_ASSESSMENT_ANALYTICS_REVIEW',
]: need(marker in analytics_ui,f'assessment analytics UI marker missing: {marker}')
need('fetch(' not in analytics_ui and 'XMLHttpRequest' not in analytics_ui,'assessment analytics UI must remain device-local and make no network analytics calls')
p=subprocess.run(['node','--check',str(ROOT/'assessment-analytics-ui.js')],capture_output=True,text=True)
need(p.returncode==0,f'assessment-analytics-ui.js syntax error: {p.stderr}')

core=text('MouldMaster_Core_App.html'); mark='window.MM_DATA = '
need(mark in core,'MM_DATA marker missing')
D,_=json.JSONDecoder().raw_decode(core[core.index(mark)+len(mark):])
need(sum(len(v) for v in D['exams'].values())==30,'technical bank must remain 30 items')
need(sum(len(v) for r in D['regionalQuestions'].values() for v in r.values())==27,'regional bank must remain 27 items')
need(len(D['scenarios'])==8,'core scenario baseline must remain 8')

extra_titles=['Fill time drifts but recipe does not','One cavity becomes light','Recovery time becomes erratic','Dimension shifts after water-line work','Part sticks after texture change','Cpk drops after gauge change','DOE result changes by run order','Pressure sensor disagrees with machine']
upgrade=text('training-upgrade.js')
for title in extra_titles: need(title in upgrade,f'training scenario missing: {title}')

base=json.loads(json.dumps(D))
for title in extra_titles:
    base['scenarios'].append({'title':title,'situation':'placeholder','choices':['a','b','c','d'],'correct':0,'why':'placeholder','feedback':['a','b','c','d']})
node=r'''
const fs=require('fs'),vm=require('vm');
const D=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
const document={
 getElementById:()=>null,
 querySelectorAll:()=>[],
 querySelector:()=>null,
 createElement:()=>({set id(v){this._id=v},get id(){return this._id},textContent:'',appendChild(){},setAttribute(){},insertAdjacentHTML(){},addEventListener(){}}),
 head:{appendChild(){}},body:{appendChild(){}},documentElement:{},readyState:'complete'
};
const sandbox={window:{MM_DATA:D},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}}};
sandbox.window.window=sandbox.window;sandbox.window.localStorage=localStorage;sandbox.window.document=document;sandbox.window.URL=sandbox.URL;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-deep-dive.js'});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-quality-suite.js'});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-stable-review-bridge.js'});
const Q=sandbox.window.MM_ASSESSMENT_QUALITY;
const exams={};
for(const level of ['Beginner','Intermediate','Advanced']){
 exams[level]={};
 for(const region of ['UK','US','NZ','ALL']){
   const arr=sandbox.window.getExamQuestions(level,region);
   exams[level][region]=arr.map(q=>({id:q.stableId,mmId:q.mmId,difficulty:q.difficulty,competency:q.competency,competencies:q.competencies||[q.competency],concept:q.concept,critical:q.critical,region:q.region||null,options:q.options,correct:q.correct,stem:q.q}));
 }
}
const scenarios=D.scenarios.map(s=>({id:s.mmStableId,title:s.title,choices:s.choices.length,correct:s.correct,feedback:Array.isArray(s.feedback)?s.feedback.length:0,category:s.category,difficulty:s.difficulty,reference:s.reference||null,sourceUrl:s.sourceUrl||null}));
process.stdout.write(JSON.stringify({scenarioCount:D.scenarios.length,exams,quality:Q,scenarios,qa:D.assessmentQA.qualitySuite,history:D.assessmentQA.questionRevisionHistory,bridge:sandbox.window.MM_STABLE_REVIEW_BRIDGE}));
'''%(json.dumps(base),json.dumps(str(ROOT/'assessment-deep-dive.js')),json.dumps(str(ROOT/'assessment-quality-suite.js')),json.dumps(str(ROOT/'assessment-stable-review-bridge.js')))
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,f'assessment quality runtime QA failed: {p.stderr or p.stdout}')
runtime=json.loads(p.stdout)
need(runtime['scenarioCount']==40,f"expected 40 scenario drills, got {runtime['scenarioCount']}")
need(runtime['qa']['scenarioDrills']==40,'runtime assessment metadata must report 40 scenarios')
need(runtime['qa']['stableQuestionIds'] is True,'stable question IDs not enabled')
need(runtime['qa']['analytics']=='device-local only','analytics privacy marker missing')
need(runtime['bridge']['stableIdsPrimary'] is True,'stable review bridge not active')
need(len(runtime.get('history',[]))>=3,'question revision history missing')

live_technical={}
for level,regions in runtime['exams'].items():
    for region,items in regions.items():
        expected=16 if region=='ALL' else 10
        need(len(items)==expected,f'{level}/{region} exam count must be {expected}')
        ids=[x['id'] for x in items]; need(all(ids),'every live item needs a stable ID'); need(len(ids)==len(set(ids)),f'{level}/{region} has duplicate stable IDs')
        need(all(x['mmId']==x['id'] for x in items),f'{level}/{region} spaced-review ID must equal stable ID')
        need(all(len(x['options'])==4 and 0<=x['correct']<4 for x in items),f'{level}/{region} option/key integrity')
        tech=[x for x in items if x['id'].startswith('tech:')]; reg=[x for x in items if x['id'].startswith('reg:')]
        need(len(tech)==7,f'{level}/{region} must contain 7 technical items')
        need(len(reg)==(9 if region=='ALL' else 3),f'{level}/{region} regional safety item count')
        need(all(x['critical'] for x in reg),f'{level}/{region} regional items must remain safety-critical')
        coverage=set(c for x in tech for c in x.get('competencies',[]) if c)
        need(len(coverage)>=5,f'{level}/{region} blueprint covers fewer than 5 technical competency groups: {sorted(coverage)}')
        need(all(x['difficulty'] for x in items),f'{level}/{region} difficulty metadata missing')
        concepts=[x['concept'] for x in tech]; need(len(set(concepts))>=5,f'{level}/{region} has excessive repeated technical concepts')
        for x in tech: live_technical[x['id']]=x

sc=runtime['scenarios']; need(len({x['id'] for x in sc})==40,'scenario stable IDs must be unique'); need(len({x['title'].strip().lower() for x in sc})==40,'scenario titles must be unique')
need(all(x['choices']==4 and 0<=x['correct']<4 and x['feedback']==4 for x in sc),'scenario choice/key/feedback integrity')
need(all(x['category'] and x['difficulty'] for x in sc),'scenario category/difficulty metadata missing')

near=runtime['quality'].get('nearDuplicates',[]); runtime_leaks=runtime['quality'].get('answerLeakRisks',[])
cue_flags=[]
qualifiers=re.compile(r'\b(under|unless|provided|before|rather|while|current|validated|applicable|appropriate|within|depending|evidence)\b',re.I)
absolutes=re.compile(r'\b(always|never|only|automatically|proves?|guarantees?|must)\b',re.I)
def technical_density(s):
    return sum(1 for w in re.findall(r"[A-Za-z][A-Za-z-]+",s) if len(w)>=10)
for q in live_technical.values():
    opts=q['options']; c=q['correct']; correct=opts[c]; others=[o for i,o in enumerate(opts) if i!=c]
    clen=len(correct); med=sorted(len(o) for o in others)[1]
    if clen>med*1.85 and clen-med>28: cue_flags.append({'id':q['id'],'type':'correct-option-length','correct_length':clen,'peer_median':med})
    cq=len(qualifiers.findall(correct)); oq=max([len(qualifiers.findall(o)) for o in others] or [0])
    if cq>=2 and cq>=oq+2: cue_flags.append({'id':q['id'],'type':'qualification-density','correct':cq,'max_distractor':oq})
    ct=technical_density(correct); ot=max([technical_density(o) for o in others] or [0])
    if ct>=4 and ct>=ot+3: cue_flags.append({'id':q['id'],'type':'technical-term-density','correct':ct,'max_distractor':ot})
    abs_wrong=sum(1 for o in others if absolutes.search(o)); abs_correct=bool(absolutes.search(correct))
    if abs_wrong>=2 and not abs_correct: cue_flags.append({'id':q['id'],'type':'absolute-language-distractors','distractors_flagged':abs_wrong})
severe=[x for x in cue_flags if x['type']=='correct-option-length' and x.get('correct_length',0)>max(70,x.get('peer_median',1)*2.6)]
need(not severe,'severe correct-option length cue detected: '+json.dumps(severe[:5]))
report={'schema':1,'quality_version':'2026.08.24.2','scenario_count':40,'near_duplicate_flags':near,'runtime_answer_leak_flags':runtime_leaks,'multi_cue_answer_leak_flags':cue_flags,'severe_answer_leaks':severe,'exam_blueprint_minimum':'7 technical items covering at least 5 technical competency groups plus regional safety/compliance','stable_review_ids':True,'analytics':'device-local'}
REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')

V=json.loads(text('version.json'))
need(V.get('question_bank_version')=='2026.08.24.2','question_bank_version must be bumped to 2026.08.24.2')
need(V.get('content_version')=='2026.08.24.2','content_version must be bumped to 2026.08.24.2')
need(V.get('legacy_review_id_version')=='2026.08.21.1','legacy review ID version must remain explicit for migration')

log=text('sources/QUESTION_BANK_CHANGELOG.md')
for marker in ['2026.08.24.2','stable question IDs','device-local question analytics','competency-balanced exam blueprint','Expanded shop-floor scenario drills from 16 to 40','scheduled authoritative-source freshness monitoring']:
    need(marker in log,f'question-bank changelog marker missing: {marker}')

idx=text('index.html')
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f'<script src="./{asset}">' in idx,f'{asset} not loaded by shell')
need(idx.index('assessment-deep-dive.js')<idx.index('assessment-quality-suite.js')<idx.index('assessment-stable-review-bridge.js')<idx.index('assessment-analytics-ui.js')<idx.index('source-library.js'),'assessment quality stack load order wrong')
sw=text('service-worker.js')
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f"'./{asset}'" in sw,f'{asset} not cached offline')
pkg=json.loads(text('desktop/electron/package.json')); froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f'../../{asset}' in froms,f'{asset} missing from desktop package')
integrity=text('desktop/electron/scripts/generate-integrity.cjs')
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f"'{asset}'" in integrity,f'{asset} missing from integrity hashes')
qy=text('.github/workflows/qa.yml')
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f'node --check {asset}' in qy,f'release workflow must syntax-check {asset}')
need('python qa_assessment_quality.py' in qy and 'python qa_source_freshness.py' in qy,'release workflow missing assessment quality gates')
ow=text('.github/workflows/open-desktop-build.yml')
for asset in ['assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js']:
    need(f"- '{asset}'" in ow,f'desktop workflow trigger missing {asset}')
need("- 'qa_assessment_quality.py'" in ow and 'python qa_assessment_quality.py' in ow,'desktop workflow missing assessment quality suite')
need('python qa_assessment_quality.py' in text('.github/workflows/microsoft-store-msix.yml'),'Store workflow missing assessment quality QA')
need((ROOT/'.github/workflows/source-freshness.yml').exists(),'scheduled source freshness workflow missing')

print(f"MouldMaster assessment quality QA passed (57 exam items; 40 scenarios; stable IDs; device-local analytics; near-duplicate flags={len(near)}; answer-cue flags={len(cue_flags)})")
