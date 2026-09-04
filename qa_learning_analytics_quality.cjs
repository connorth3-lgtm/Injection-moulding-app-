'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
const prefix='mm_learning_analytics_v1::';
const stores={
  [`${prefix}alpha`]:JSON.stringify({schema:1,events:[
    {type:'practice_complete',module:'diagnostic',id:'same-case',score:20,durationSec:10},
    {type:'practice_complete',module:'diagnostic',id:'same-case',score:80,durationSec:10},
    {type:'practice_complete',module:'diagnostic',id:'same-case',score:40,durationSec:10},
  ]}),
  [`${prefix}beta`]:JSON.stringify({schema:1,events:[
    {type:'practice_complete',module:'diagnostic',id:'same-case',score:90,durationSec:10},
    {type:'practice_complete',module:'diagnostic',id:'same-case',score:70,durationSec:10},
  ]}),
};
const keys=Object.keys(stores);
const localStorage={length:keys.length,key:i=>keys[i]??null,getItem:key=>stores[key]??null};
const listeners={};
const document={
  querySelectorAll(){return[]},
  addEventListener(type,fn,capture){listeners[type]={fn,capture}},
  createElement(tag){return tag==='script'?{dataset:{},async:true,onload:null,onerror:null,src:''}:{href:'',download:'',click(){},remove(){} }},
  body:{appendChild(node){if(node.dataset?.mmDomainBridge==='learning-analytics'){sandbox.window.MM_LEARNING_ANALYTICS={version:'legacy',summary:()=>({wrong:true}),open:()=>{}};node.onload?.()}}},
};
const scope={token:()=> 'alpha',storageKey:(p,t)=>`${p}${t}`};
const sandbox={
  user:{role:'instructor'},localStorage,document,console,encodeURIComponent,queueMicrotask:fn=>fn(),Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
  window:{MM_LEARNER_SCOPE:scope,addEventListener(){},toast(){}},
};
sandbox.window.window=sandbox.window;sandbox.window.document=document;
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'learning-analytics-loader.js'});

const quality=sandbox.window.MM_LEARNING_ANALYTICS_QUALITY;
assert(quality,'learning analytics quality bridge did not install');
const single=quality.aggregate([
  {type:'practice_complete',module:'diagnostic',id:'case',score:20},
  {type:'practice_complete',module:'diagnostic',id:'case',score:80},
  {type:'practice_complete',module:'diagnostic',id:'case',score:40},
]);
assert.strictEqual(single.repeatedCases,1);
assert.strictEqual(single.avgGain,20,'retry gain used best-ever score instead of latest completed score');
assert.strictEqual(single.improvedCases,1);

const current=sandbox.window.MM_LEARNING_ANALYTICS.summary();
assert.strictEqual(current.avgGain,20,'public learner analytics summary did not use corrected retry gain');
const cohort=sandbox.window.MM_LEARNING_ANALYTICS.cohortSummary();
assert.strictEqual(cohort.anonymousProfiles,2);
assert.strictEqual(cohort.aggregate.repeatedCases,2,'same case across two profiles was merged into one retry sequence');
assert.strictEqual(cohort.aggregate.avgGain,0,'cohort retry gain did not preserve per-profile case boundaries');
assert.strictEqual(cohort.aggregate.improvedCases,1);
assert.deepStrictEqual(Array.from(cohort.profiles,x=>x.avgGain),[20,-20]);
assert.match(quality.scope,/namespaces case sequences by anonymous learner profile/i);

console.log('Learning analytics quality QA passed: latest-vs-first retry gain and anonymous profile boundaries are preserved.');
