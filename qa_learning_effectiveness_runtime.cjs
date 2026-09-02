'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('learning-effectiveness.js','utf8');
const data=new Map();
const localStorage={
  get length(){return data.size},key(i){return [...data.keys()][i]??null},
  getItem(k){return data.has(k)?data.get(k):null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))}
};
const document={readyState:'complete',documentElement:{},getElementById(){return null},querySelectorAll(){return[]},addEventListener(){},body:{appendChild(){}}};
function MutationObserver(){this.observe=()=>{}}
const sandbox={window:{},document,localStorage,MutationObserver,Blob:function(){},URL:{createObjectURL(){return'blob:test'},revokeObjectURL(){}},setTimeout(fn){fn()},clearTimeout(){},Date,console};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.requestAnimationFrame=fn=>fn();sandbox.window.MM_LEARNING_ANALYTICS={record(){return true}};sandbox.global=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'learning-effectiveness.js'});
const api=sandbox.window.MM_LEARNING_EFFECTIVENESS;assert(api,'effectiveness API missing');
function hash(text){let h=2166136261;for(const ch of String(text||'anonymous')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function id(mechanism,stage,ctx){return`run-insight-${mechanism}-${stage}-${ctx}`}
function complete(mechanism,stage,ctx,correct,t){return{t,type:'practice_complete',module:'process-data',id:id(mechanism,stage,ctx),score:correct?100:0,correct,durationSec:18}}
function store(name,events){localStorage.setItem(`mm_learning_analytics_v1::${hash(name)}`,JSON.stringify({schema:1,version:'test',events}))}

// Small samples must never self-calibrate.
store('small-a',[complete('hot-runner-actual-behaviour','evidence','a',true,'2026-08-01T00:00:00Z')]);
let s=api.itemStats('hot-runner-actual-behaviour','evidence');assert.equal(s.eligible,false);assert.equal(s.challenge,'standard');assert.equal(s.quality,'insufficient-sample');

// High success across the privacy threshold may make formative practice harder.
for(let i=0;i<5;i++){const ev=[];for(let j=0;j<3;j++)ev.push(complete('recyclate-process-variability','evidence',`h${i}${j}`,!(i===0&&j===0),'2026-08-02T00:00:00Z'));store(`high-${i}`,ev)}
s=api.itemStats('recyclate-process-variability','evidence');assert(s.eligible);assert(s.successRate>.86);assert.equal(s.challenge,'stretch');

// Low success across the threshold may add support, but only to formative practice.
for(let i=0;i<5;i++){const ev=[];for(let j=0;j<3;j++)ev.push(complete('surface-replication-release','falsification',`l${i}${j}`,j===0&&i<2,'2026-08-03T00:00:00Z'));store(`low-${i}`,ev)}
s=api.itemStats('surface-replication-release','falsification');assert(s.eligible);assert(s.successRate<.55);assert.equal(s.challenge,'support');

// High/low cohort discrimination should be positive when stronger profiles outperform weaker profiles on the target item.
for(let i=0;i<8;i++){
  const high=i>=4,ev=[];
  ev.push(complete('moisture-drying-degradation','integration',`t${i}a`,high,'2026-08-04T00:00:00Z'));
  ev.push(complete('moisture-drying-degradation','integration',`t${i}b`,high,'2026-08-04T00:01:00Z'));
  ev.push(complete('runner-gate-multicavity-imbalance','evidence',`ability${i}`,high,'2026-08-04T00:02:00Z'));
  store(`disc-${i}`,ev)
}
s=api.itemStats('moisture-drying-degradation','integration');assert(s.eligible);assert(s.discrimination!==null&&s.discrimination>.5,`expected strong positive discrimination, got ${s.discrimination}`);

// Delayed transfer should become due only after mastery in two distinct contexts.
sandbox.db={activeUser:'retention-user'};
const masteredAt='2026-08-20T00:00:00Z';const mastered=[
  complete('liquid-silicone-rubber','evidence','ctx1',true,'2026-08-19T23:59:00Z'),
  complete('liquid-silicone-rubber','evidence','ctx2',true,masteredAt)
];store('retention-user',mastered);
let due=api.dueTransferChecks(Date.parse('2026-08-26T23:59:59Z'));assert.equal(due.length,0,'7-day check became due too early');
due=api.dueTransferChecks(Date.parse('2026-08-27T00:00:01Z'));assert(due.some(x=>x.mechanismId==='liquid-silicone-rubber'&&x.stage==='evidence'&&x.intervalDays===7),'7-day check not due');
due=api.dueTransferChecks(Date.parse('2026-09-19T00:00:01Z'));assert(due.some(x=>x.intervalDays===7)&&due.some(x=>x.intervalDays===30),'7/30-day checks not both due after 30 days');
const failed=[...mastered,{t:'2026-08-27T01:00:00Z',type:'retention_check',module:'process-data',id:id('liquid-silicone-rubber','evidence','ctx3'),reason:'7d:evidence',score:0,correct:false}];store('retention-user',failed);due=api.dueTransferChecks(Date.parse('2026-08-28T00:00:00Z'));assert(due.some(x=>x.intervalDays===7),'failed 7-day retention check incorrectly cleared the due state');
const passed=[...failed,{t:'2026-08-28T01:00:00Z',type:'retention_check',module:'process-data',id:id('liquid-silicone-rubber','evidence','ctx4'),reason:'7d:evidence',score:100,correct:true}];store('retention-user',passed);due=api.dueTransferChecks(Date.parse('2026-08-29T00:00:00Z'));assert(!due.some(x=>x.intervalDays===7),'passed 7-day retention check stayed due');

// Aggregate export may contain item-level statistics, never profile identifiers or raw event histories.
const report=api.anonymousReport(),serialized=JSON.stringify(report);assert(Array.isArray(report.items));assert(!('profiles' in report));assert(!serialized.includes('retention-user'));assert(!serialized.includes('small-a'));assert(!serialized.includes('practice_complete'));assert(/no names/i.test(report.privacy));
console.log('Learning effectiveness runtime QA passed: sample thresholds, support/stretch calibration, positive cohort discrimination, 7/30-day retention scheduling, failed-check persistence and anonymous aggregate export verified.');
