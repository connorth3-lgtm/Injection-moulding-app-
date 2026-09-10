from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

scope=ROOT/'assessment-storage-scope.js'
need(scope.exists(),'assessment-storage-scope.js missing')
js=text('assessment-storage-scope.js')
for marker in [
    "VERSION='2026.09.11.1'",
    "ANALYTICS_BASE='mm_assessment_analytics_v1'",
    "TIMING_BASE='mm_assessment_exposure_timing_v1'",
    "ROTATION_BASE='mm_assessment_opening_history_v1'",
    "QUESTION_HISTORY_BASE='mm-assessment-question-history-v4'",
    "RESULT_META_BASE='mm-assessment-result-meta-v1'",
    "BASES=[ANALYTICS_BASE,TIMING_BASE,ROTATION_BASE,QUESTION_HISTORY_BASE,RESULT_META_BASE]",
    'function getItem(base)', 'function setItem(base,value)', 'function removeItem(base)',
    'function read(base,fallback=null)', 'function write(base,value)',
    'prototypeInterception:false', 'learnerScoped:true', 'MM_LEARNER_SCOPE',
    'function hashScope', 'migrateFallbackScopes', 'partial-fail-closed', 'scopeProvider',
    'migrateLegacy', 'clearAll', 'cancelInMemoryAttempt',
    "wrapLearnerChange('switchUser')", "wrapLearnerChange('createLearner')",
    'after!==before){cancelInMemoryAttempt();clearAll()',
]:
    need(marker in js,f'assessment storage scope marker missing: {marker}')
for forbidden in ['Storage.prototype', "Object.defineProperty(P,'getItem'", "Object.defineProperty(P,'setItem'", "Object.defineProperty(P,'removeItem'"]:
    need(forbidden not in js,f'native Storage interception must be retired: {forbidden}')

for path in [scope,ROOT/'assessment-quality-suite.js',ROOT/'assessment-final-hardening.js']:
    p=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    need(p.returncode==0,f'{path.name} syntax error: {p.stderr}')

node=r'''
const fs=require('fs'),vm=require('vm');
class Storage{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return [...this.m.keys()][i]??null}getItem(k){return this.m.has(String(k))?this.m.get(String(k)):null}setItem(k,v){this.m.set(String(k),String(v))}removeItem(k){this.m.delete(String(k))}}
const native={get:Storage.prototype.getItem,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem,key:Storage.prototype.key};
const source=fs.readFileSync(%s,'utf8');
function make(users,active,seed={}){
  const localStorage=new Storage();for(const [k,v] of Object.entries(seed))native.set.call(localStorage,k,v);
  native.set.call(localStorage,'mouldmasterProDB','before');
  const db={activeUser:active,users:Object.fromEntries(users.map(id=>[id,{id}]))};let user=db.users[active];
  const listeners={};
  const window={activeExam:null,__doReset:false,addEventListener(type,fn){listeners[type]=fn},resetData(){if(this.__doReset)native.set.call(localStorage,'mouldmasterProDB','after')},switchUser(id){if(db.users[id]){db.activeUser=id;user=db.users[id]}},createLearner(){const id='learner-c';db.users[id]={id};db.activeUser=id;user=db.users[id]}};
  const sandbox={window,Storage,localStorage,db,user,activeExam:null,Math,Object,String,Date,setTimeout:fn=>{if(typeof fn==='function')fn()},console};window.window=window;window.localStorage=localStorage;
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'assessment-storage-scope.js'});
  return {localStorage,db,window,sandbox,listeners,api:window.MM_ASSESSMENT_STORAGE_SCOPE};
}
const seed={
 'mm_assessment_analytics_v1':JSON.stringify({owner:'legacy-a'}),
 'mm_assessment_opening_history_v1':JSON.stringify({'Beginner::NZ':['q1','q2']}),
 'mm-assessment-question-history-v4':JSON.stringify({'Beginner|ALL':[['legacy-q']]}),
 'mm-assessment-result-meta-v1':JSON.stringify([{formFingerprint:'legacy-form'}]),
};
const x=make(['learner-a'],'learner-a',seed),api=x.api;
if(Storage.prototype.getItem!==native.get||Storage.prototype.setItem!==native.set||Storage.prototype.removeItem!==native.remove||Storage.prototype.key!==native.key)throw new Error('assessment scope changed native Storage.prototype');
if(api.prototypeInterception!==false)throw new Error('explicit persistence metadata missing');
if(native.get.call(x.localStorage,'mm_assessment_analytics_v1')!==null)throw new Error('verified single-owner legacy key was not retired');
if(api.read('mm_assessment_analytics_v1',{}).owner!=='legacy-a')throw new Error('single-owner legacy analytics not migrated into learner scope');
if(api.read('mm-assessment-result-meta-v1',[])[0].formFingerprint!=='legacy-form')throw new Error('single-owner result metadata not migrated');
api.write('mm_assessment_analytics_v1',{owner:'A'});api.write('mm_assessment_opening_history_v1',{'Beginner::NZ':['a1','a2']});api.write('mm-assessment-question-history-v4',{'Beginner|ALL':[['a1']]});api.write('mm-assessment-result-meta-v1',[{formFingerprint:'form-a'}]);
const aKeys=[api.analyticsKey(),api.rotationKey(),api.questionHistoryKey(),api.resultMetaKey()];
let attempt={level:'Beginner'};x.sandbox.activeExam=attempt;x.window.activeExam=attempt;x.window.switchUser('learner-a');if(x.sandbox.activeExam!==attempt||x.window.activeExam!==attempt)throw new Error('same-profile switch cancelled active exam');
x.db.users['learner-b']={id:'learner-b'};x.window.switchUser('learner-b');if(x.sandbox.activeExam!==null||x.window.activeExam!==null)throw new Error('profile switch did not cancel active exam');
if(api.getItem('mm_assessment_analytics_v1')!==null||api.getItem('mm-assessment-result-meta-v1')!==null)throw new Error('learner B inherited learner A assessment state');
api.write('mm_assessment_analytics_v1',{owner:'B'});api.write('mm_assessment_opening_history_v1',{'Beginner::NZ':['b1']});api.write('mm-assessment-question-history-v4',{'Beginner|ALL':[['b1']]});api.write('mm-assessment-result-meta-v1',[{formFingerprint:'form-b'}]);
const bKeys=[api.analyticsKey(),api.rotationKey(),api.questionHistoryKey(),api.resultMetaKey()];if(aKeys.some((k,i)=>k===bKeys[i]))throw new Error('learner scope key collision');
let createAttempt={level:'Intermediate'};x.sandbox.activeExam=createAttempt;x.window.activeExam=createAttempt;x.window.createLearner();if(x.sandbox.activeExam!==null||x.window.activeExam!==null||x.db.activeUser!=='learner-c')throw new Error('create learner did not cancel active exam');

x.window.MM_LEARNER_SCOPE={tokenFor:id=>'strong-'+String(id)};if(typeof x.listeners['mm:domains-ready']!=='function')throw new Error('shared learner-scope migration listener missing');x.listeners['mm:domains-ready']();
if(api.scopeProvider()!=='MM_LEARNER_SCOPE')throw new Error('assessment storage did not switch to shared learner scope');
x.db.activeUser='learner-a';if(api.read('mm_assessment_analytics_v1',{}).owner!=='A')throw new Error('learner A analytics lost in shared-scope migration');if(!api.analyticsKey().endsWith('strong-learner-a'))throw new Error('shared token not used for learner A');
x.db.activeUser='learner-b';if(api.read('mm_assessment_analytics_v1',{}).owner!=='B')throw new Error('learner B analytics lost in shared-scope migration');if(api.read('mm-assessment-result-meta-v1',[])[0].formFingerprint!=='form-b')throw new Error('learner B result metadata lost in shared-scope migration');
if(api.sharedMigration.conflicts!==0||api.sharedMigration.ambiguous!==0||api.sharedMigration.migrated<8)throw new Error('normal shared-scope migration did not complete cleanly');

let keepAttempt={level:'Advanced'};x.sandbox.activeExam=keepAttempt;x.window.activeExam=keepAttempt;x.window.__doReset=false;x.window.resetData();if(x.sandbox.activeExam!==keepAttempt||x.window.activeExam!==keepAttempt)throw new Error('no-op reset cancelled active exam');
x.window.__doReset=true;x.window.resetData();if(x.sandbox.activeExam!==null||x.window.activeExam!==null)throw new Error('confirmed reset did not cancel active exam');
for(const base of ['mm_assessment_analytics_v1','mm_assessment_opening_history_v1','mm-assessment-question-history-v4','mm-assessment-result-meta-v1']){x.db.activeUser='learner-a';if(api.getItem(base)!==null)throw new Error('reset did not clear learner A '+base);x.db.activeUser='learner-b';if(api.getItem(base)!==null)throw new Error('reset did not clear learner B '+base)}
native.set.call(x.localStorage,'unrelated','keep');api.clearAll();if(native.get.call(x.localStorage,'unrelated')!=='keep')throw new Error('clearAll removed unrelated storage');

const y=make(['learner-a','learner-b'],'learner-a',{'mm_assessment_analytics_v1':JSON.stringify({owner:'ambiguous-legacy'})});
if(y.api.legacyMigration.ambiguous<1)throw new Error('multi-profile unsuffixed legacy value was not marked ambiguous');
if(native.get.call(y.localStorage,'mm_assessment_analytics_v1')===null)throw new Error('ambiguous legacy value was deleted');
if(y.api.getItem('mm_assessment_analytics_v1')!==null)throw new Error('ambiguous legacy value was inherited by active learner');
process.stdout.write(JSON.stringify({version:api.version,learnerScoped:api.learnerScoped,prototypeInterception:api.prototypeInterception,sharedMigration:api.sharedMigration,ambiguous:y.api.legacyMigration.ambiguous}));
'''%json.dumps(str(scope))
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,f'assessment storage scope runtime QA failed: {p.stderr or p.stdout}')
r=json.loads(p.stdout)
need(r['version']=='2026.09.11.1' and r['learnerScoped'] is True and r['prototypeInterception'] is False,'assessment storage runtime metadata mismatch')
need(r['sharedMigration']['conflicts']==0 and r['sharedMigration']['ambiguous']==0,'normal shared-scope migration unexpectedly failed closed')
need(r['ambiguous']>=1,'ambiguous legacy fail-closed case was not exercised')

quality=text('assessment-quality-suite.js')
for marker in ['const ASSESSMENT_STORAGE=window.MM_ASSESSMENT_STORAGE_SCOPE;', 'ASSESSMENT_STORAGE.read(ANALYTICS_KEY', 'ASSESSMENT_STORAGE.write(ANALYTICS_KEY', 'ASSESSMENT_STORAGE.removeItem(ANALYTICS_KEY)']:
    need(marker in quality,f'assessment analytics explicit storage marker missing: {marker}')
need('localStorage.removeItem(ANALYTICS_KEY)' not in quality,'assessment analytics reset still bypasses learner-scoped storage')
final=text('assessment-final-hardening.js')
for marker in ['const S=window.MM_ASSESSMENT_STORAGE_SCOPE;', 'S.read(k,d)', 'S.write(k,v)', 'S.removeItem(TIMING_KEY)']:
    need(marker in final,f'assessment timing explicit storage marker missing: {marker}')

idx=text('index.html');need('<script src="./assessment-storage-scope.js">' in idx,'storage scope not loaded by shell')
need(idx.index('assessment-deep-dive.js')<idx.index('assessment-storage-scope.js')<idx.index('assessment-quality-suite.js'),'storage scope load order must precede analytics suite')
need("'./assessment-storage-scope.js'" in text('service-worker.js'),'storage scope missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-storage-scope.js' in froms,'storage scope missing from desktop package')
need("'assessment-storage-scope.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'storage scope missing from integrity set')

bridge=text('training-qa-fix.js')
for marker in ['clearAssessmentAnalyticsStores','clearLearningAnalyticsStores','clearAllAnalyticsStores','clearTrainingExtrasStores','cancelActiveExam','mm_assessment_analytics_v1','mm_assessment_exposure_timing_v1','mm_assessment_opening_history_v1','mm-assessment-question-history-v4','mm-assessment-result-meta-v1','mm_learning_analytics_v1::','ANALYTICS_CLEANUP_CODE','remaining key(s):','restoreSnapshot(before)','clearAllAnalyticsStores();clearTrainingExtrasStores()','const proposedReset=JSON.parse(JSON.stringify(defaultDB))']:
    need(marker in bridge,f'training reset/import verified analytics cleanup missing: {marker}')

V=json.loads(text('version.json'))
need(V.get('assessment_storage_scope_version')=='2026.08.24.4','published assessment storage release lane drifted during migration-only hardening')
need(V.get('assessment_storage_migration_version')=='2026.09.11.1','assessment storage migration/ownership version missing')
for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    w=text(wf);need('python qa_assessment_storage_scope.py' in w,f'{wf} missing learner-scoped analytics QA')
print('MouldMaster learner-scoped assessment storage QA passed: explicit persistence, native Storage preservation, learner isolation, fail-closed legacy migration, shared scope migration, and verified reset cleanup.')
