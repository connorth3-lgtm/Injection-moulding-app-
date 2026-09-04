'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

// Finding 1: a learner must not be able to activate the cross-profile analytics export,
// even if code manufactures a click on the legacy export control. The exporter itself
// also carries an internal role assertion, so authorization is not only a UI convention.
{
  const source=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
  const legacySource=fs.readFileSync('learning-analytics.js','utf8');
  assert(legacySource.includes("function requireInstructor(action='Cross-profile analytics export')"),'legacy analytics exporter lost its internal instructor assertion');
  assert(legacySource.includes('function exportAnonymousSummary(){\n  requireInstructor();'),'cross-profile export no longer fails closed inside the exporter');
  assert(legacySource.includes('canExportCrossProfile:isInstructor'),'analytics API no longer exposes the instructor export capability boundary');
  const listeners={document:{},window:{}};
  const exportNode={hidden:false,attrs:new Map(),setAttribute(k,v){this.attrs.set(k,String(v))},removeAttribute(k){this.attrs.delete(k)}};
  const document={
    addEventListener(type,fn,capture){listeners.document[type]={fn,capture}},
    querySelectorAll(sel){return sel==='[data-la-export]'?[exportNode]:[]},
    createElement(){return{dataset:{},async:true,onload:null,onerror:null,src:''}},
    body:{appendChild(script){sandbox.window.MM_LEARNING_ANALYTICS={version:'test'};script.onload?.()}},
  };
  const sandbox={
    user:{role:'learner'},document,console,encodeURIComponent,queueMicrotask:fn=>fn(),Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    window:{MM_LEARNER_SCOPE:{token:()=> 'learner',storageKey:(prefix,token)=>`${prefix}${token}`,registerStoragePrefix:()=>{},includeStorageToken:()=>true},addEventListener(type,fn){listeners.window[type]=fn}},
    localStorage:{length:0,key:()=>null,getItem:()=>null},
  };
  sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.toast=()=>{};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'learning-analytics-loader.js'});
  assert.strictEqual(listeners.document.click.capture,true,'analytics export guard must run in capture phase');
  const learnerEvent={target:{closest:sel=>sel==='[data-la-export]'?exportNode:null},prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  listeners.document.click.fn(learnerEvent);
  assert.strictEqual(learnerEvent.prevented,true,'learner export activation was not prevented');
  assert.strictEqual(learnerEvent.stopped,true,'learner export activation reached the legacy handler');
  assert.strictEqual(exportNode.hidden,true,'learner cross-profile export control remained visible');
  sandbox.user.role='instructor';
  assert.strictEqual(sandbox.window.MM_LEARNING_ANALYTICS_ACCESS.enforce(),true,'instructor role was not recognized');
  assert.strictEqual(exportNode.hidden,false,'instructor export control remained hidden');
  assert(sandbox.window.MM_LEARNING_ANALYTICS_QUALITY,'corrected analytics quality bridge did not install');
  const instructorEvent={target:{closest:()=>exportNode},prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  listeners.document.click.fn(instructorEvent);
  assert.strictEqual(instructorEvent.prevented,true,'instructor export was not intercepted before the legacy mixed-profile exporter');
  assert.strictEqual(instructorEvent.stopped,true,'instructor export reached the legacy mixed-profile handler');
}

// Finding 2: formal assessment evidence must carry the real persisted assessment
// timestamp into learner recency. Legacy records without a timestamp remain unknown.
{
  const learnerSource=fs.readFileSync('src/domains/learning/learner-model.js','utf8');
  const assessedAt='2026-09-01T12:34:56.000Z';
  const window={MM_ACTIVITY_EVENTS_V2:{events:()=>[],assessmentSnapshot:()=>({questions:[{attempts:2,correct:2,wrong:0,competency:'process-control',concept:'fill-balance',last:assessedAt}]})}};
  const sandbox={window,Date,Math,Object,Number,String,Set,Map,console};window.window=window;
  vm.createContext(sandbox);vm.runInContext(learnerSource,sandbox,{filename:'learner-model.js'});
  let model=window.MM_LEARNER_MODEL.build();
  for(const key of ['competency:process-control','concept:fill-balance']){
    const row=model.topics.find(x=>x.key===key);assert(row,`formal assessment topic missing: ${key}`);assert.strictEqual(row.last,assessedAt,`assessment recency timestamp was lost for ${key}`);assert(row.activityTypes.includes('formal-assessment'));assert.strictEqual(row.recencyKnown,true);
  }
  window.MM_ACTIVITY_EVENTS_V2={events:()=>[],assessmentSnapshot:()=>({questions:[{attempts:1,correct:1,wrong:0,competency:'legacy-topic',concept:'',last:null}]})};
  model=window.MM_LEARNER_MODEL.build();
  const legacy=model.topics.find(x=>x.key==='competency:legacy-topic');assert(legacy);assert.strictEqual(legacy.last,null,'legacy assessment recency was fabricated from the current time');assert.strictEqual(legacy.recencyKnown,false,'legacy assessment recency was incorrectly treated as known');assert.strictEqual(legacy.forgettingRisk,null,'legacy assessment recency was converted into synthetic forgetting risk');
  const activitySource=fs.readFileSync('src/domains/learning/activity-events-v2.js','utf8');
  assert(activitySource.includes('last:q.last||null'),'assessment activity projection no longer preserves analytics timestamps');
}

// Finding 3: singleton/undersized groups cannot produce confidence intervals or
// standardized effects by silently treating an undefined sample SD as zero.
{
  const stats=require('./src/domains/process/process-statistics.js');
  const adequate=stats.meanDifference([1,2,3,4,5],[3,4,5,6,7]);
  assert(Array.isArray(adequate.ci95)&&adequate.ci95.length===2,'adequate sample lost its confidence interval');
  const singleton=stats.meanDifference([1],[3,4,5]);
  assert.strictEqual(singleton.difference,3);
  assert.strictEqual(singleton.ci95,null,'singleton group produced a confidence interval');
  assert.strictEqual(singleton.effectSize,null,'singleton group produced a standardized effect');
  assert.match(singleton.boundary,/at least two finite observations/i);
  const both=stats.meanDifference([10],[12]);
  assert.strictEqual(both.difference,2);
  assert.strictEqual(both.ci95,null,'two singleton groups produced a zero-width confidence interval');
  assert.strictEqual(both.effectSize,null);
}

console.log('Audit remediation runtime QA passed: instructor-only cross-profile export, persisted formal-assessment recency and fail-closed inadequate-sample confidence intervals verified.');

// Keep the next-stage learner-model, analytics-quality and data-provenance decision
// pipelines inside the mandatory Release QA context that caught the audited regressions.
require('./qa_learner_recommendation_pipeline.cjs');
require('./qa_learning_analytics_quality.cjs');
require('./qa_deep_dive_data_provenance.cjs');