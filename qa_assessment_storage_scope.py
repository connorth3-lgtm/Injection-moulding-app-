from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

scope=ROOT/'assessment-storage-scope.js'
need(scope.exists(),'assessment-storage-scope.js missing')
js=text('assessment-storage-scope.js')
for marker in ["VERSION='2026.09.05.1'","ANALYTICS_BASE='mm_assessment_analytics_v1'","TIMING_BASE='mm_assessment_exposure_timing_v1'","ROTATION_BASE='mm_assessment_opening_history_v1'","BASES=[ANALYTICS_BASE,TIMING_BASE,ROTATION_BASE]","rotationKey:()=>scopedKey(ROTATION_BASE)","learnerScoped:true","MM_LEARNER_SCOPE","function hashScope","Compatibility-only hash","migrateFallbackScopes","partial-fail-closed","scopeProvider","migrateLegacy","clearAll","cancelInMemoryAttempt","wrapLearnerChange('switchUser')","wrapLearnerChange('createLearner')","after!==before){cancelInMemoryAttempt();clearAll()"]:
    need(marker in js,f'assessment storage scope marker missing: {marker}')
p=subprocess.run(['node','--check',str(scope)],capture_output=True,text=True)
need(p.returncode==0,f'assessment-storage-scope.js syntax error: {p.stderr}')

node=r'''
const fs=require('fs'),vm=require('vm');
class Storage{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return [...this.m.keys()][i]??null}getItem(k){return this.m.has(String(k))?this.m.get(String(k)):null}setItem(k,v){this.m.set(String(k),String(v))}removeItem(k){this.m.delete(String(k))}}
const localStorage=new Storage();
localStorage.setItem('mm_assessment_analytics_v1','legacy-one-profile');
localStorage.setItem('mouldmasterProDB','before');
const db={activeUser:'learner-a',users:{'learner-a':{id:'learner-a'}}};
let user=db.users[db.activeUser];
let activeExam={level:'Beginner'};
const listeners={};
const window={activeExam,__doReset:false,addEventListener(type,fn){listeners[type]=fn},resetData(){if(this.__doReset)localStorage.setItem('mouldmasterProDB','after')},switchUser(id){if(db.users[id]){db.activeUser=id;user=db.users[id]}},createLearner(){const id='learner-c';db.users[id]={id};db.activeUser=id;user=db.users[id]}};
const sandbox={window,Storage,localStorage,db,user,activeExam,Math,Object,String,Date,setTimeout:fn=>{if(typeof fn==='function')fn()},console};
window.window=window;window.localStorage=localStorage;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-storage-scope.js'});
const api=window.MM_ASSESSMENT_STORAGE_SCOPE;
if(api.scopeProvider()!=='compatibility-hash')throw new Error('assessment storage did not start on compatibility scope before shared service loaded');
const aKey=api.analyticsKey(),aRotationKey=api.rotationKey();
if(localStorage.getItem('mm_assessment_analytics_v1')!=='legacy-one-profile')throw new Error('single-profile legacy analytics not migrated into learner scope');
localStorage.setItem('mm_assessment_analytics_v1','A');
localStorage.setItem('mm_assessment_opening_history_v1',JSON.stringify({'Beginner::NZ':['q1','q2','q3']}));
if(!aRotationKey.startsWith('mm_assessment_opening_history_v1::'))throw new Error('learner A rotation key is not scoped');
let sameAttempt={level:'Beginner'};sandbox.activeExam=sameAttempt;window.activeExam=sameAttempt;window.switchUser('learner-a');
if(sandbox.activeExam!==sameAttempt||window.activeExam!==sameAttempt)throw new Error('same-profile switch cancelled the active exam');
db.users['learner-b']={id:'learner-b'};window.switchUser('learner-b');
if(sandbox.activeExam!==null||window.activeExam!==null)throw new Error('profile switch did not cancel in-memory exam attempt');
if(localStorage.getItem('mm_assessment_analytics_v1')!==null)throw new Error('learner B can read learner A analytics');
if(localStorage.getItem('mm_assessment_opening_history_v1')!==null)throw new Error('learner B can read learner A opening history');
localStorage.setItem('mm_assessment_analytics_v1','B');
localStorage.setItem('mm_assessment_opening_history_v1',JSON.stringify({'Beginner::NZ':['q4']}));
const bKey=api.analyticsKey(),bRotationKey=api.rotationKey();
if(aKey===bKey||aRotationKey===bRotationKey)throw new Error('compatibility learner scope keys collide');
let createAttempt={level:'Intermediate'};sandbox.activeExam=createAttempt;window.activeExam=createAttempt;window.createLearner();
if(sandbox.activeExam!==null||window.activeExam!==null||db.activeUser!=='learner-c')throw new Error('new learner transition did not cancel in-memory exam attempt');
if(localStorage.getItem('mm_assessment_opening_history_v1')!==null)throw new Error('new learner inherited another learner opening history');

// Shared learner scope arrives later in the real bootstrap. Existing assessment
// buckets must migrate only after ownership can be resolved from the profile registry.
window.MM_LEARNER_SCOPE={tokenFor:id=>'strong-'+String(id)};
if(typeof listeners['mm:domains-ready']!=='function')throw new Error('shared learner-scope migration listener missing');
listeners['mm:domains-ready']();
if(api.scopeProvider()!=='MM_LEARNER_SCOPE')throw new Error('assessment storage did not switch to shared learner scope');
db.activeUser='learner-a';
const strongAKey=api.analyticsKey(),strongARotationKey=api.rotationKey();
if(!strongAKey.endsWith('strong-learner-a')||!strongARotationKey.endsWith('strong-learner-a'))throw new Error('shared learner scope token not used for learner A');
if(localStorage.getItem('mm_assessment_analytics_v1')!=='A')throw new Error('learner A analytics lost during shared-scope migration');
const restored=JSON.parse(localStorage.getItem('mm_assessment_opening_history_v1')||'{}');
if((restored['Beginner::NZ']||[]).join(',')!=='q1,q2,q3')throw new Error('learner A opening history lost during shared-scope migration');
db.activeUser='learner-b';
if(localStorage.getItem('mm_assessment_analytics_v1')!=='B')throw new Error('learner B analytics lost during shared-scope migration');
if(api.sharedMigration.migrated<4)throw new Error('expected assessment compatibility buckets were not migrated to shared scope');

let keepAttempt={level:'Advanced'};sandbox.activeExam=keepAttempt;window.activeExam=keepAttempt;window.__doReset=false;window.resetData();
if(sandbox.activeExam!==keepAttempt||window.activeExam!==keepAttempt)throw new Error('cancelled/no-op reset cancelled the active exam');
window.__doReset=true;window.resetData();
if(sandbox.activeExam!==null||window.activeExam!==null)throw new Error('confirmed reset did not cancel in-memory exam attempt');
if(localStorage.getItem('mm_assessment_analytics_v1')!==null)throw new Error('confirmed reset did not clear learner analytics');
if(localStorage.getItem('mm_assessment_opening_history_v1')!==null)throw new Error('confirmed reset did not clear learner opening history');
localStorage.setItem('unrelated','keep');api.clearAll();if(localStorage.getItem('unrelated')!=='keep')throw new Error('clearAll removed unrelated storage');
process.stdout.write(JSON.stringify({version:api.version,learnerScoped:api.learnerScoped,aKey,bKey,strongAKey,sharedMigration:api.sharedMigration}));
'''%json.dumps(str(scope))
p=subprocess.run(['node','-e',node],capture_output=True,text=True)
need(p.returncode==0,f'assessment storage scope runtime QA failed: {p.stderr or p.stdout}')
r=json.loads(p.stdout);need(r['version']=='2026.09.05.1' and r['learnerScoped'] is True,'assessment storage scope runtime metadata mismatch')
need(r['strongAKey'].endswith('strong-learner-a'),'assessment storage runtime did not use shared learner-scope token')
need(r['sharedMigration']['conflicts']==0 and r['sharedMigration']['ambiguous']==0,'normal shared-scope migration unexpectedly failed closed')

idx=text('index.html');need('<script src="./assessment-storage-scope.js">' in idx,'storage scope not loaded by shell')
need(idx.index('assessment-deep-dive.js')<idx.index('assessment-storage-scope.js')<idx.index('assessment-quality-suite.js'),'storage scope load order must precede analytics suite')
need("'./assessment-storage-scope.js'" in text('service-worker.js'),'storage scope missing from offline cache')
pkg=json.loads(text('desktop/electron/package.json'));froms={x.get('from') for x in pkg['build']['extraResources'] if isinstance(x,dict)}
need('../../assessment-storage-scope.js' in froms,'storage scope missing from desktop package')
need("'assessment-storage-scope.js'" in text('desktop/electron/scripts/generate-integrity.cjs'),'storage scope missing from integrity set')

bridge=text('training-qa-fix.js')
for marker in ['clearAssessmentAnalyticsStores','cancelActiveExam','mm_assessment_analytics_v1','mm_assessment_exposure_timing_v1','mm_assessment_opening_history_v1','committed=true;cancelActiveExam();clearAssessmentAnalyticsStores()','clearAssessmentAnalyticsStores();cancelActiveExam()']:
    need(marker in bridge,f'training reset/import assessment cleanup missing: {marker}')

V=json.loads(text('version.json'));need(V.get('assessment_storage_scope_version')=='2026.09.05.1','assessment storage scope version missing')
for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/microsoft-store-msix.yml']:
    w=text(wf);need('python qa_assessment_storage_scope.py' in w,f'{wf} missing learner-scoped analytics QA')
print('MouldMaster learner-scoped assessment storage QA passed (shared 128-bit learner scope with fail-closed compatibility migration)')
