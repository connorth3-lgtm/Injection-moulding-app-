'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const analyticsSource=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
const trainingSource=fs.readFileSync('src/domains/learning/training-qa-fix.js','utf8');

// Learner-analytics cohort discovery must be derived from the current profile
// registry. A syntactically valid strong-token bucket left by a removed/imported
// profile must not count toward the minimum cohort or influence the aggregate.
for(const marker of [
  'scope.knownIds?.()',
  'strong.add(scope.tokenFor(id))',
  'known.strong.has(t)',
  'function liveToken(',
  'function clearAllAnalytics()',
  'orphaned strong-token buckets',
])assert(analyticsSource.includes(marker),`analytics lifecycle marker missing: ${marker}`);

// Reset/import cleanup is now a verified lifecycle boundary, not a best-effort
// side effect after the new learner registry has already become active.
for(const marker of [
  "const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED'",
  'function clearMatchingStores(',
  'remaining key(s):',
  'clearAllAnalyticsStores();',
  'const rolledBack=restoreSnapshot(before)',
  'db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();',
  'buildTrainingExtras',
  'trainingExtrasForImport',
  'clearLearnerAnalyticsStores(active);clearLearnerTrainingExtras(active);',
  'proposed=JSON.parse(JSON.stringify(db));proposed.users[active]=cleanResetLearner(prior,active)',
  'Other local learner profiles',
])assert(trainingSource.includes(marker),`training analytics cleanup marker missing: ${marker}`);

// Cohort regression: 4 current profiles + 1 orphan must remain an undersized
// cohort, and clear-all must not touch unrelated application storage.
{
  const listeners={};
  const memory=new Map([
    ['mm_learning_analytics_v1::strong-a',JSON.stringify({schema:1,events:[{type:'practice_start',module:'diagnostic',id:'a'}]})],
    ['mm_learning_analytics_v1::strong-b',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-c',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-d',JSON.stringify({schema:1,events:[]})],
    ['mm_learning_analytics_v1::strong-orphan',JSON.stringify({schema:1,events:[{type:'practice_start',module:'diagnostic',id:'orphan'}]})],
    ['unrelated-app-key','keep-me'],
  ]);
  const localStorage={
    get length(){return memory.size},
    key(i){return [...memory.keys()][i]??null},
    getItem(k){return memory.has(k)?memory.get(k):null},
    setItem(k,v){memory.set(k,String(v))},
    removeItem(k){memory.delete(k)},
  };
  const exportNode={hidden:false,setAttribute(){},removeAttribute(){}};
  let sandbox;
  const document={
    addEventListener(type,fn,capture){listeners[type]={fn,capture}},
    querySelectorAll(sel){return sel==='[data-la-export]'?[exportNode]:[]},
    querySelector(){return null},getElementById(){return null},
    createElement(tag){return tag==='script'?{dataset:{},async:true,onload:null,onerror:null,src:'',setAttribute(){}}:{dataset:{},setAttribute(){},remove(){},click(){}}},
    body:{appendChild(script){sandbox.window.MM_LEARNING_ANALYTICS={version:'test',open(){}};script.onload?.()}},
  };
  const scope={
    token:()=> 'strong-a',storageKey:(prefix,token)=>`${prefix}${token}`,registerStoragePrefix:()=>{},includeStorageToken:()=>true,
    knownIds:()=>['a','b','c','d'],tokenFor:id=>`strong-${id}`,legacyTokenFor:id=>`legacy-${id}`,isLegacyToken:t=>String(t).startsWith('legacy-'),
  };
  sandbox={
    user:{role:'instructor'},document,localStorage,console,encodeURIComponent,
    queueMicrotask:fn=>fn(),Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    window:{MM_LEARNER_SCOPE:scope,addEventListener(){},dispatchEvent(){},toast(){}},
  };
  sandbox.window.window=sandbox.window;sandbox.window.document=document;
  vm.createContext(sandbox);vm.runInContext(analyticsSource,sandbox,{filename:'learning-analytics-loader.js'});
  const quality=sandbox.window.MM_LEARNING_ANALYTICS_QUALITY;
  assert(quality,'analytics quality API did not install');
  assert.deepStrictEqual([...quality.liveTokens()].sort(),['strong-a','strong-b','strong-c','strong-d'],'orphan strong-token analytics bucket counted as a live profile');
  const cohort=quality.cohortSummary();
  assert.strictEqual(cohort.anonymousProfiles,4,'cohort profile count included an orphan bucket');
  assert.strictEqual(cohort.aggregate.practiceAttempts,1,'orphan analytics contaminated cohort aggregate metrics');
  assert.throws(()=>quality.exportAnonymousSummary(),/at least 5 current local learner profiles/i,'four live profiles plus one orphan incorrectly satisfied minimum cohort');
  const removed=quality.clearAllAnalytics();
  assert.strictEqual(removed,5,'clear-all analytics did not remove every Learning Insights bucket');
  assert.strictEqual([...memory.keys()].some(k=>k.startsWith('mm_learning_analytics_v1::')),false,'Learning Insights bucket survived clear-all lifecycle cleanup');
  assert.strictEqual(memory.get('unrelated-app-key'),'keep-me','analytics cleanup removed unrelated local storage');
}

function trainingSandbox(removeMode='normal',writeMode='normal'){
  const oldDb={activeUser:'old',users:{
    old:{id:'old',name:'Old learner',role:'learner',completed:[1,2],bookmarks:[2],notes:{1:'old note'},examScores:{Beginner:90},certificates:['Beginner-ALL'],currentLesson:3},
    peer:{id:'peer',name:'Peer learner',role:'learner',completed:[9],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:9}
  }};
  const oldSerialized=JSON.stringify(oldDb);
  const memory=new Map([
    ['mouldmasterProDB',oldSerialized],
    ['mm_spaced_review_v2::strong-old',JSON.stringify({items:{'tech:q1':{id:'tech:q1',stage:2}}})],
    ['mm_practical_signoff_v1::strong-old',JSON.stringify({checks:{safe:true}})],
    ['mm_real_measured_assessment_v1::strong-old',JSON.stringify({'avaps-delivered-traces':{best:100,last:67}})],
    ['mm_spaced_review_v2::strong-peer',JSON.stringify({items:{'tech:q2':{id:'tech:q2',stage:1}}})],
    ['mm_practical_signoff_v1::strong-peer',JSON.stringify({checks:{peer:true}})],
    ['mm_real_measured_assessment_v1::strong-peer',JSON.stringify({'cross-process-upper-boundary':{best:67,last:33}})],
    ['mm_assessment_analytics_v1::strong-old','assessment-old'],
    ['mm_assessment_analytics_v1::strong-peer','assessment-peer'],
    ['mm_learning_analytics_v1::strong-old','learning-old'],
    ['mm_learning_analytics_v1::strong-peer','learning-peer'],
    ['unrelated-app-key','keep-me'],
  ]);
  let failedDbWrite=false;
  const localStorage={
    get length(){return memory.size},key(i){return [...memory.keys()][i]??null},
    getItem(k){return memory.has(String(k))?memory.get(String(k)):null},
    setItem(k,v){
      k=String(k);
      if(writeMode==='fail-next-db'&&k==='mouldmasterProDB'&&!failedDbWrite){failedDbWrite=true;throw new Error('simulated registry write failure')}
      memory.set(k,String(v))
    },
    removeItem(k){
      k=String(k);
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='throw')throw new Error('simulated delete failure');
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='silent')return;
      memory.delete(k)
    },
  };
  const alerts=[],toasts=[];
  class FileReader{readAsText(file){this.result=file.contents;this.onload?.()}}
  const learnerScope={
    tokenFor:id=>`strong-${id}`,legacyTokenFor:id=>`legacy-${id}`,
    storageKey:(prefix,token)=>`${prefix}${token}`,
    migrationPlan:id=>({uniqueOwner:true,legacyToken:`legacy-${id}`}),registerStoragePrefix(){},migrateStoragePrefix(){}
  };
  const assessmentScope={keysForLearner:id=>[`mm_assessment_analytics_v1::strong-${id}`]};
  const sandbox={
    console,localStorage,Date,Math,Object,String,Number,JSON,Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    FileReader,setTimeout:fn=>{if(typeof fn==='function')fn()},confirm:()=>true,
    alert:msg=>alerts.push(String(msg)),
    db:JSON.parse(oldSerialized),user:null,MM_LEARNER_SCOPE:learnerScope,MM_ASSESSMENT_STORAGE_SCOPE:assessmentScope,
    defaultDB:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:'2026-09-05T00:00:00.000Z'}}},
    normaliseImportedUser:(u,id)=>({...u,id:String(id),completed:Array.isArray(u.completed)?u.completed:[]}),
    updateGlobalProgress(){},switchView(){},renderProfile(){},
    startExam:undefined,activeExam:null,resetData(){},toast:msg=>toasts.push(String(msg)),
  };
  sandbox.user=sandbox.db.users[sandbox.db.activeUser];sandbox.window=sandbox;
  vm.createContext(sandbox);vm.runInContext(trainingSource,sandbox,{filename:'src/domains/learning/training-qa-fix.js'});
  return {sandbox,memory,alerts,toasts,oldSerialized,bridge:sandbox.MM_TRAINING_DATA_BRIDGE}
}

// Thrown delete failure: an import may stage storage writes, but the imported
// profile registry must never become active; staged core/training writes roll back.
{
  const t=trainingSandbox('throw');
  const incoming={activeUser:'new',users:{new:{id:'new',name:'New learner',completed:[1,2]}},trainingExtras:{version:2,spacedReview:{items:{}},practicalSignoff:{checks:{}}}};
  t.sandbox.importData({size:500,contents:JSON.stringify(incoming)});
  assert.strictEqual(t.sandbox.db.activeUser,'old','import activated new learner registry after analytics cleanup failure');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'failed import did not roll staged core storage back');
  assert(t.alerts.some(x=>/Import was not completed because local analytics\/training cleanup could not be fully verified/i.test(x)),'cleanup failure did not surface a specific blocking import warning');
  assert(!t.toasts.some(x=>/^Progress imported/i.test(x)),'failed cleanup falsely reported a successful import');
}

// Silent removeItem failure is just as unsafe as a thrown exception. Re-enumeration
// must detect the retained key and fail closed.
{
  const t=trainingSandbox('silent');
  assert.throws(()=>t.bridge.clearAllAnalyticsStores(),e=>e&&e.code==='MM_ANALYTICS_CLEANUP_FAILED','silent analytics deletion failure was not detected by verification');
  assert(t.memory.has('mm_learning_analytics_v1::strong-old'),'silent-failure fixture unexpectedly deleted its retained analytics key');
}

// Successful learner reset clears only the active learner's scoped state and
// preserves every peer profile/store plus unrelated application storage.
{
  const t=trainingSandbox('normal');
  const extras=t.bridge.buildTrainingExtras(t.sandbox.db.users);
  assert.strictEqual(extras.version,5);
  assert.deepStrictEqual(Object.keys(extras.learners).sort(),['old','peer']);
  assert(extras.learners.old.spacedReview.items['tech:q1'],'active learner review state missing from multi-profile backup payload');
  assert(extras.learners.peer.spacedReview.items['tech:q2'],'peer review state missing from multi-profile backup payload');
  assert.strictEqual(extras.learners.old.measuredAssessment['avaps-delivered-traces'].best,100,'active learner measured challenge state missing from multi-profile backup payload');
  assert.strictEqual(extras.learners.peer.measuredAssessment['cross-process-upper-boundary'].last,33,'peer measured challenge state missing from multi-profile backup payload');
  t.sandbox.resetData();
  assert.strictEqual(t.sandbox.db.activeUser,'old','learner reset changed the active learner identity');
  assert.strictEqual(t.sandbox.db.users.old.completed.length,0,'active learner progress survived learner reset');
  assert.strictEqual(t.sandbox.db.users.old.certificates.length,0,'active learner certificates survived learner reset');
  assert.strictEqual(JSON.stringify(t.sandbox.db.users.peer.completed),'[9]','learner reset deleted or changed a peer profile');
  assert.strictEqual(t.memory.has('mm_assessment_analytics_v1::strong-old'),false,'active learner assessment analytics survived reset');
  assert.strictEqual(t.memory.has('mm_learning_analytics_v1::strong-old'),false,'active learner Learning Insights survived reset');
  assert.strictEqual(t.memory.has('mm_spaced_review_v2::strong-old'),false,'active learner review state survived reset');
  assert.strictEqual(t.memory.has('mm_practical_signoff_v1::strong-old'),false,'active learner sign-off survived reset');
  assert.strictEqual(t.memory.has('mm_real_measured_assessment_v1::strong-old'),false,'active learner measured challenge progress survived reset');
  assert.strictEqual(t.memory.get('mm_assessment_analytics_v1::strong-peer'),'assessment-peer','learner reset removed peer assessment analytics');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-peer'),'learning-peer','learner reset removed peer Learning Insights');
  assert(t.memory.has('mm_spaced_review_v2::strong-peer'),'learner reset removed peer review state');
  assert(t.memory.has('mm_practical_signoff_v1::strong-peer'),'learner reset removed peer sign-off');
  assert(t.memory.has('mm_real_measured_assessment_v1::strong-peer'),'learner reset removed peer measured challenge progress');
  assert.strictEqual(t.memory.get('unrelated-app-key'),'keep-me','learner reset removed unrelated local storage');
  assert(t.toasts.some(x=>/Other local learner profiles/i.test(x)),'learner reset did not report peer-profile preservation');
}

// If the final learner-registry write fails after scoped cleanup, the reset must
// restore the active learner registry and its learner-owned stores.
{
  const t=trainingSandbox('normal','fail-next-db');
  t.sandbox.resetData();
  assert.strictEqual(t.sandbox.db.activeUser,'old','failed reset mutated the in-memory learner registry');
  assert.strictEqual(t.memory.get('mouldmasterProDB'),t.oldSerialized,'failed reset did not restore the persisted learner registry');
  assert.strictEqual(t.memory.get('mm_assessment_analytics_v1::strong-old'),'assessment-old','failed reset did not restore assessment analytics');
  assert.strictEqual(t.memory.get('mm_learning_analytics_v1::strong-old'),'learning-old','failed reset did not restore Learning Insights');
  assert(t.memory.has('mm_spaced_review_v2::strong-old'),'failed reset did not restore spaced review state');
  assert(t.memory.has('mm_practical_signoff_v1::strong-old'),'failed reset did not restore sign-off state');
  assert(t.memory.has('mm_real_measured_assessment_v1::strong-old'),'failed reset did not restore measured challenge progress');
  assert(t.alerts.some(x=>/Existing learner progress and scoped training state were restored/i.test(x)),'failed reset did not disclose verified rollback');
}

console.log('Final audit lifecycle QA passed: import cleanup remains fail-closed; strong-scoped learner reset clears review/sign-off/measured progress, preserves peer state and verifies rollback.');