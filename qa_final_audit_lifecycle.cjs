'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const analyticsSource=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
const trainingSource=fs.readFileSync('training-qa-fix.js','utf8');

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
  'clearAllAnalyticsStores();clearTrainingExtrasStores()',
  'const proposedReset=JSON.parse(JSON.stringify(defaultDB))',
  'analytics were cleared and verified',
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

function trainingSandbox(removeMode='normal'){
  const oldDb={activeUser:'old',users:{old:{id:'old',name:'Old learner',completed:[],certificates:[]}}};
  const oldSerialized=JSON.stringify(oldDb);
  const memory=new Map([
    ['mouldmasterProDB',oldSerialized],
    ['mm_spaced_review_v2',JSON.stringify({items:{}})],
    ['mm_practical_signoff_v1',JSON.stringify({checks:{}})],
    ['mm_assessment_analytics_v1::old','assessment-old'],
    ['mm_learning_analytics_v1::old','learning-old'],
    ['unrelated-app-key','keep-me'],
  ]);
  const localStorage={
    get length(){return memory.size},key(i){return [...memory.keys()][i]??null},
    getItem(k){return memory.has(String(k))?memory.get(String(k)):null},
    setItem(k,v){memory.set(String(k),String(v))},
    removeItem(k){
      k=String(k);
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='throw')throw new Error('simulated delete failure');
      if(k.startsWith('mm_learning_analytics_v1::')&&removeMode==='silent')return;
      memory.delete(k);
    },
  };
  const alerts=[],toasts=[];
  class FileReader{readAsText(file){this.result=file.contents;this.onload?.()}}
  const sandbox={
    console,localStorage,Date,Math,Object,String,Number,JSON,Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    FileReader,setTimeout:fn=>{if(typeof fn==='function')fn()},confirm:()=>true,
    alert:msg=>alerts.push(String(msg)),
    db:JSON.parse(oldSerialized),user:null,
    defaultDB:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:'2026-09-05T00:00:00.000Z'}}},
    normaliseImportedUser:(u,id)=>({...u,id:String(id),completed:Array.isArray(u.completed)?u.completed:[]}),
    updateGlobalProgress(){},switchView(){},renderProfile(){},
    startExam:undefined,activeExam:null,resetData(){},toast:msg=>toasts.push(String(msg)),
  };
  sandbox.user=sandbox.db.users[sandbox.db.activeUser];sandbox.window=sandbox;
  vm.createContext(sandbox);vm.runInContext(trainingSource,sandbox,{filename:'training-qa-fix.js'});
  return {sandbox,memory,alerts,toasts,oldSerialized,bridge:sandbox.MM_TRAINING_DATA_BRIDGE};
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
  assert(t.memory.has('mm_learning_analytics_v1::old'),'silent-failure fixture unexpectedly deleted its retained analytics key');
}

// Successful factory reset clears/verifies analytics and training extras before the
// fresh default learner registry is activated, while unrelated storage survives.
{
  const t=trainingSandbox('normal');
  t.sandbox.resetData();
  assert.strictEqual(t.sandbox.db.activeUser,'learner-1','verified factory reset did not activate the clean default learner registry');
  assert.strictEqual([...t.memory.keys()].some(k=>k.startsWith('mm_assessment_analytics_')||k.startsWith('mm_learning_analytics_v1::')),false,'verified factory reset left analytics behind');
  assert.strictEqual(t.memory.has('mm_spaced_review_v2'),false,'factory reset left spaced-review training extras behind');
  assert.strictEqual(t.memory.has('mm_practical_signoff_v1'),false,'factory reset left practical sign-off training extras behind');
  assert.strictEqual(t.memory.get('unrelated-app-key'),'keep-me','factory reset removed unrelated local storage');
  assert(t.toasts.some(x=>/analytics were cleared and verified/i.test(x)),'factory reset did not report the verified cleanup boundary');
}

console.log('Final audit lifecycle QA passed: orphan analytics excluded; reset/import cleanup is verified, failure-injected and fail-closed before learner-registry activation.');
