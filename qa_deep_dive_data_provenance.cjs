'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

function memoryStorage(initial={}){
  const data=new Map(Object.entries(initial));
  return {
    get length(){return data.size},
    key(i){return [...data.keys()][i]??null},
    getItem(k){return data.has(String(k))?data.get(String(k)):null},
    setItem(k,v){data.set(String(k),String(v))},
    removeItem(k){data.delete(String(k))},
    dump(){return Object.fromEntries(data)}
  };
}
function loadScope({users,activeUser,storage}){
  const window={};
  const sandbox={window,localStorage:storage,db:{activeUser,users},user:users[activeUser],console,Math,Object,String,Array,Set,Map};
  window.window=window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('src/domains/shared/learner-scope.js','utf8'),sandbox,{filename:'learner-scope.js'});
  return {sandbox,scope:window.MM_LEARNER_SCOPE};
}

// Finding 1: the old 32-bit token can collide for ordinary learner IDs. The new
// token must separate them, and a legacy bucket with two known owners must be
// quarantined rather than copied into either learner's current history.
{
  const a='learner-r2c9qcdfks2g',b='learner-8b62nqgdhctb',prefix='mm_learning_analytics_v1::';
  const storage=memoryStorage();
  const {sandbox,scope}=loadScope({users:{[a]:{id:a},[b]:{id:b}},activeUser:a,storage});
  assert.strictEqual(scope.legacyTokenFor(a),scope.legacyTokenFor(b),'deterministic legacy collision fixture no longer collides');
  assert.strictEqual(scope.legacyTokenFor(a),'10ru0ym','legacy collision fixture changed unexpectedly');
  assert.notStrictEqual(scope.tokenFor(a),scope.tokenFor(b),'strong learner tokens still collide for the regression fixture');
  assert.match(scope.tokenFor(a),/^[0-9a-f]{32}$/,'new learner token is not a 128-bit hex identity');
  const legacyKey=prefix+scope.legacyTokenFor(a),payload=JSON.stringify({schema:1,events:[{type:'practice_complete',score:77}]});
  storage.setItem(legacyKey,payload);
  scope.registerStoragePrefix(prefix);
  assert.strictEqual(storage.getItem(legacyKey),null,'ambiguous legacy learner bucket remained in the active analytics namespace');
  assert.strictEqual(storage.getItem(prefix+scope.tokenFor(a)),null,'ambiguous legacy history was assigned to learner A');
  assert.strictEqual(storage.getItem(prefix+scope.tokenFor(b)),null,'ambiguous legacy history was assigned to learner B');
  assert(Object.keys(storage.dump()).some(k=>k.startsWith('mm_scope_quarantine_v1::')),'ambiguous legacy history was not preserved in quarantine');
  assert.strictEqual(scope.migrationPlan(a).ambiguous,true,'collision was not reported as ambiguous ownership');
  sandbox.db.activeUser=b;sandbox.user=sandbox.db.users[b];
  assert.notStrictEqual(scope.token(),scope.tokenFor(a),'switching to colliding learner reused the first learner strong token');
}

// A uniquely owned legacy bucket may migrate losslessly to the strong token.
{
  const id='learner-unique-1',prefix='mm_activity_events_v2::';
  const storage=memoryStorage();
  const {scope}=loadScope({users:{[id]:{id}},activeUser:id,storage});
  const oldKey=prefix+scope.legacyTokenFor(id),newKey=prefix+scope.tokenFor(id),payload=JSON.stringify({schema:2,events:[{type:'lesson_complete'}]});
  storage.setItem(oldKey,payload);
  const result=scope.registerStoragePrefix(prefix);
  assert.strictEqual(result,prefix);
  assert.strictEqual(storage.getItem(newKey),payload,'uniquely owned legacy history was not migrated losslessly');
  assert.strictEqual(storage.getItem(oldKey),null,'legacy key remained after verified migration');
}

// Finding 2: pre-ledger stable-ID counters remain explicitly unversioned, while the
// next real grade is captured in a proven revision bucket without changing that
// frozen legacy baseline.
{
  const source=fs.readFileSync('src/domains/assessment/assessment-analytics-v2.js','utf8');
  const storage=memoryStorage();
  const legacyQuestion={stableId:'tech:Advanced:2',attempts:6,correct:4,wrong:2,unanswered:0,difficulty:'Advanced',competency:'process-control',concept:'interaction',optionSelections:{Alpha:4,Beta:2},totalResponseMs:6000,last:'2026-08-20T12:00:00.000Z'};
  const exportLegacy=()=>({questions:{q:JSON.parse(JSON.stringify(legacyQuestion))},exams:{},responseTimingBasis:'legacy'});
  const scope={registerStoragePrefix(){},token:()=> '0123456789abcdef0123456789abcdef',storageKey:(prefix,token)=>prefix+token};
  const question={stableId:'tech:Advanced:2',correct:0,options:['Alpha','Beta'],difficulty:'Advanced',competency:'process-control',concept:'interaction'};
  const activeExam={level:'Advanced',questions:[question]};
  const document={querySelector:sel=>sel==='input[name=ex0]:checked'?{value:'0'}:null};
  const window={
    MM_LEARNER_SCOPE:scope,
    MM_DATA_SPINE:{fingerprint:v=>String(v)},
    MM_QUESTION_REVISIONS:{bankVersion:'bank-current',forId:()=>({revision:7,date:'2026-09-04'})},
    MM_ASSESSMENT_ANALYTICS:{export:exportLegacy},
    addEventListener(){},
    gradeExam(){legacyQuestion.attempts++;legacyQuestion.correct++;legacyQuestion.optionSelections.Alpha++;return 'graded'}
  };
  const sandbox={window,localStorage:storage,activeExam,document,console,Math,Object,Number,String,Date,WeakSet};window.window=window;
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'assessment-analytics-v2.js'});
  assert.strictEqual(window.gradeExam('Advanced'),'graded','revision-aware wrapper changed gradeExam return value');
  const out=window.MM_ASSESSMENT_ANALYTICS_V2.export();
  const legacy=out.questions['tech:Advanced:2@legacy-unversioned'];
  const current=out.questions['tech:Advanced:2@r7'];
  assert(legacy,'pre-ledger stable-ID counters were not preserved as legacy-unversioned');
  assert.strictEqual(legacy.attempts,6,'legacy baseline was not frozen before the first revision-aware grade');
  assert.strictEqual(legacy.questionRevision,null,'legacy counters were assigned the current question revision');
  assert.strictEqual(legacy.revisionStatus,'legacy-unversioned');
  assert.strictEqual(legacy.catalogRevision,7,'current catalog revision metadata was lost');
  assert.strictEqual(legacy.questionRevisionDate,null,'current revision date was attached to unversioned historical counters');
  assert(legacy.choiceSelections.every(x=>x.choiceFingerprint.includes('@legacy-unversioned|')),'legacy choice counters were fingerprinted as current revision data');
  assert(current,'new grade was not written to a revision-aware analytics bucket');
  assert.strictEqual(current.questionRevision,7);
  assert.strictEqual(current.revisionStatus,'proven');
  assert.strictEqual(current.attempts,1,'revision-aware ledger did not isolate the new attempt');
  assert.strictEqual(current.correct,1);
  assert.strictEqual(current.catalogRevision,7);
  assert.strictEqual(window.MM_ASSESSMENT_ANALYTICS_V2.summary().revisionProvenQuestions,1);
  assert.strictEqual(window.MM_ASSESSMENT_ANALYTICS_V2.summary().legacyUnversionedQuestions,1);
  window.gradeExam('Advanced');
  assert.strictEqual(window.MM_ASSESSMENT_ANALYTICS_V2.export().questions['tech:Advanced:2@r7'].attempts,1,'duplicate grade activation double-counted the revision-aware attempt');
}

// Integration contracts: the learner analytics and activity bridges must register
// their scoped stores, filter unsafe legacy cohort buckets, and never restore the old
// current-revision fallback in assessment snapshots.
{
  const loader=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
  const activity=fs.readFileSync('src/domains/learning/activity-events-v2.js','utf8');
  assert(loader.includes('scope.registerStoragePrefix?.(STORAGE_PREFIX)'),'learning analytics store is not registered for safe token migration');
  assert(loader.includes('scope.includeStorageToken?.(STORAGE_PREFIX,t)!==false'),'cohort analytics no longer exclude unsafe legacy scope buckets');
  assert(activity.includes("scope.registerStoragePrefix?.(PREFIX);scope.registerStoragePrefix?.(LEGACY_LEARNING_PREFIX)"),'activity stores are not registered for learner-token migration');
  assert(activity.includes("revision:null,revisionStatus:'legacy-unversioned'"),'legacy assessment snapshot regained a fabricated current revision');
}

console.log('Deep-dive data provenance QA passed: learner-token collisions fail closed with safe migration/quarantine, legacy assessment baselines freeze unversioned, and future grades are revision-aware.');