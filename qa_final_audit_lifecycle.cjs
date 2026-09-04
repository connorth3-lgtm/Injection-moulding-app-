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

// Factory reset and successful backup import must clear Learning Insights as well
// as assessment-derived analytics, matching the public privacy promise.
for(const marker of [
  "const LEARNING_ANALYTICS_PREFIX='mm_learning_analytics_v1::'",
  'function clearLearningAnalyticsStores()',
  'function clearAllAnalyticsStores()',
  'committed=true;cancelActiveExam();clearAllAnalyticsStores();',
  'clearAllAnalyticsStores();cancelActiveExam()',
])assert(trainingSource.includes(marker),`training analytics cleanup marker missing: ${marker}`);

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
  token:()=> 'strong-a',
  storageKey:(prefix,token)=>`${prefix}${token}`,
  registerStoragePrefix:()=>{},
  includeStorageToken:()=>true,
  knownIds:()=>['a','b','c','d'],
  tokenFor:id=>`strong-${id}`,
  legacyTokenFor:id=>`legacy-${id}`,
  isLegacyToken:t=>String(t).startsWith('legacy-'),
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

console.log('Final audit lifecycle QA passed: orphan analytics excluded from current cohorts; reset/import cleanup contract and clear-all behavior verified.');
