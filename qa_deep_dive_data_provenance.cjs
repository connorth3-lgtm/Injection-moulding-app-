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
  const a='learner-q79jhhgk6ehf',b='learner-jf994s6gsyyq',prefix='mm_learning_analytics_v1::';
  const storage=memoryStorage();
  const {sandbox,scope}=loadScope({users:{[a]:{id:a},[b]:{id:b}},activeUser:a,storage});
  assert.strictEqual(scope.legacyTokenFor(a),scope.legacyTokenFor(b),'deterministic legacy collision fixture no longer collides');
  assert.strictEqual(scope.legacyTokenFor(a),'1rwit4f','legacy collision fixture changed unexpectedly');
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

// Finding 2: stable-ID-only legacy question counters do not prove which question
// revision produced them. Current catalog metadata must therefore be separate from
// the analytics revision identity.
{
  const source=fs.readFileSync('src/domains/assessment/assessment-analytics-v2.js','utf8');
  const legacyQuestion={stableId:'tech:Advanced:2',attempts:6,correct:4,wrong:2,unanswered:0,difficulty:'Advanced',optionSelections:{Alpha:4,Beta:2},totalResponseMs:6000,last:'2026-08-20T12:00:00.000Z'};
  const window={
    MM_DATA_SPINE:{fingerprint:v=>String(v)},
    MM_QUESTION_REVISIONS:{bankVersion:'bank-current',forId:()=>({revision:7,date:'2026-09-04'})},
    MM_ASSESSMENT_ANALYTICS:{export:()=>({questions:{q:legacyQuestion},exams:{},responseTimingBasis:'legacy'})}
  };
  const sandbox={window,console,Math,Object,Number,String};window.window=window;
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'assessment-analytics-v2.js'});
  let out=window.MM_ASSESSMENT_ANALYTICS_V2.export();
  let row=out.questions['tech:Advanced:2@legacy-unversioned'];
  assert(row,'legacy stable-ID counters were not kept in an unversioned analytics bucket');
  assert.strictEqual(row.questionRevision,null,'legacy counters were assigned a fabricated current question revision');
  assert.strictEqual(row.revisionStatus,'legacy-unversioned');
  assert.strictEqual(row.catalogRevision,7,'current catalog revision metadata was lost');
  assert.strictEqual(row.questionRevisionDate,null,'current revision date was attached to unversioned historical counters');
  assert(row.choiceSelections.every(x=>x.choiceFingerprint.includes('@legacy-unversioned|')),'legacy choice counters were fingerprinted as a current revision');
  assert.strictEqual(window.MM_ASSESSMENT_ANALYTICS_V2.summary().revisionProvenQuestions,0);

  legacyQuestion.questionRevision=3;
  out=window.MM_ASSESSMENT_ANALYTICS_V2.export();row=out.questions['tech:Advanced:2@r3'];
  assert(row,'explicit source revision did not produce a revision-scoped analytics bucket');
  assert.strictEqual(row.questionRevision,3);
  assert.strictEqual(row.revisionStatus,'proven');
  assert.strictEqual(row.catalogRevision,7,'catalog revision should remain distinct from the proven historical revision');
  assert.strictEqual(row.questionRevisionDate,null,'current catalog date was attached to a different proven historical revision');
  assert.strictEqual(window.MM_ASSESSMENT_ANALYTICS_V2.summary().revisionProvenQuestions,1);
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

console.log('Deep-dive data provenance QA passed: learner-token collisions fail closed with safe migration/quarantine and assessment revision lineage remains explicit.');