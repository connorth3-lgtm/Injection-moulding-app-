'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

// Finding 1: cross-profile analytics remain unavailable in learner view, while
// the runtime must explicitly disclose that the locally editable instructor flag
// is a convenience/view mode rather than authenticated identity or authorization.
// Any instructor export must be cohort-only and fail closed below the minimum size.
{
  const source=fs.readFileSync('src/domains/learning/learning-analytics-loader.js','utf8');
  const legacySource=fs.readFileSync('learning-analytics.js','utf8');
  const privacy=fs.readFileSync('privacy.html','utf8');
  assert(legacySource.includes("function requireInstructor(action='Cross-profile analytics export')"),'legacy analytics exporter lost its internal local-view assertion');
  assert(legacySource.includes("requireInstructor('Cohort aggregate analytics export')"),'legacy cohort export no longer fails closed outside instructor view');
  assert(legacySource.includes('const MIN_EXPORT_PROFILES=5'),'legacy cohort export minimum-size policy is missing');
  assert(source.includes('const MIN_EXPORT_PROFILES=5'),'canonical analytics override minimum-size policy is missing');
  assert(source.includes('requireExportCohort(cohort())'),'canonical analytics override no longer enforces minimum cohort size');
  assert(!source.includes('profiles:c.perProfile')&&!source.includes('anonymousProfile:i+1'),'canonical analytics override reintroduced per-profile export rows');
  assert(!legacySource.includes('profiles:perProfile')&&!legacySource.includes('anonymousProfile:i+1'),'legacy analytics export reintroduced per-profile rows');
  assert(source.includes('no per-profile rows, names, hashed learner tokens'),'canonical cohort export privacy boundary is missing');
  assert(source.includes('storageFailure')&&source.includes('analytics-read-failed')&&source.includes('analytics-index-read-failed'),'canonical analytics override must fail closed on storage read/index failures');
  assert(source.includes('not authenticated identity or an authorization boundary'),'analytics access API no longer discloses the local role boundary');
  assert(source.includes('Local view mode only.'),'profile role control no longer receives an explicit local-mode disclosure');
  assert(/not login, identity verification or a security\/authorization boundary/i.test(privacy),'privacy notice overstates local instructor view as authenticated authorization');
  assert(/cohort-level aggregate data only/i.test(privacy),'privacy notice no longer states the cohort-only Learning insights export boundary');
  const listeners={document:{},window:{}};
  const exportNode={hidden:false,attrs:new Map(),setAttribute(k,v){this.attrs.set(k,String(v))},removeAttribute(k){this.attrs.delete(k)}};
  const document={
    addEventListener(type,fn,capture){listeners.document[type]={fn,capture}},
    querySelectorAll(sel){return sel==='[data-la-export]'?[exportNode]:[]},
    querySelector(){return null},getElementById(){return null},
    createElement(){return{dataset:{},async:true,onload:null,onerror:null,src:'',setAttribute(){},insertAdjacentElement(){}}},
    body:{appendChild(script){sandbox.window.MM_LEARNING_ANALYTICS={version:'test'};script.onload?.()}},
  };
  const sandbox={
    user:{role:'learner'},document,console,encodeURIComponent,queueMicrotask:fn=>fn(),Blob:function(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    window:{MM_LEARNER_SCOPE:{token:()=> 'learner',storageKey:(prefix,token)=>`${prefix}${token}`,registerStoragePrefix:()=>{},includeStorageToken:()=>true},addEventListener(type,fn){listeners.window[type]=fn}},
    localStorage:{length:0,key:()=>null,getItem:()=>null},
  };
  sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.toast=()=>{};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'learning-analytics-loader.js'});
  assert.strictEqual(listeners.document.click.capture,true,'analytics local-view guard must run in capture phase');
  const learnerEvent={target:{closest:sel=>sel==='[data-la-export]'?exportNode:null},prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  listeners.document.click.fn(learnerEvent);
  assert.strictEqual(learnerEvent.prevented,true,'learner-view export activation was not prevented');
  assert.strictEqual(learnerEvent.stopped,true,'learner-view export activation reached the legacy handler');
  assert.strictEqual(exportNode.hidden,true,'cross-profile export control remained visible in learner view');
  sandbox.user.role='instructor';
  assert.strictEqual(sandbox.window.MM_LEARNING_ANALYTICS_ACCESS.enforce(),true,'local instructor view was not recognized');
  assert.strictEqual(exportNode.hidden,false,'local instructor export control remained hidden');
  assert.match(sandbox.window.MM_LEARNING_ANALYTICS_ACCESS.localModeBoundary(),/not authenticated identity or an authorization boundary/i);
  assert(sandbox.window.MM_LEARNING_ANALYTICS_QUALITY,'corrected analytics quality bridge did not install');
  assert.strictEqual(sandbox.window.MM_LEARNING_ANALYTICS_QUALITY.minimumAggregateProfiles,5,'canonical cohort minimum drifted');
  assert.throws(()=>sandbox.window.MM_LEARNING_ANALYTICS_QUALITY.exportAnonymousSummary(),/at least 5 local learner profiles/i,'undersized cohort export did not fail closed');
  const instructorEvent={target:{closest:()=>exportNode},prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  listeners.document.click.fn(instructorEvent);
  assert.strictEqual(instructorEvent.prevented,true,'local instructor export was not intercepted before the legacy handler');
  assert.strictEqual(instructorEvent.stopped,true,'local instructor export reached the legacy handler');
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

// Finding 4: Material Lab retries must not increment completion correctness more
// than once per step, and every normalized percentage score must remain in 0..100.
{
  const source=fs.readFileSync('src/domains/learning/activity-events-v2.js','utf8');
  const listeners={};
  const memory=new Map();
  const localStorage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
  const lab={id:'retry-lab',title:'Retry Lab',focus:'retry-integrity',steps:[
    {stage:'Observe',choices:[{correct:true},{correct:false}]},
    {stage:'Explain',choices:[{correct:true},{correct:false}]},
  ]};
  let step=0;
  const document={
    addEventListener(type,fn){listeners[type]=fn},
    querySelector(sel){if(sel==='#materialLabs h2')return{textContent:'Retry Lab'};return null},
    getElementById(id){return id==='materialLabs'?{dataset:{step:String(step)}}:null},
  };
  const scope={token:()=> 'tok',storageKey:(prefix,token)=>`${prefix}${token}`,registerStoragePrefix:()=>{}};
  const window={MM_LEARNER_SCOPE:scope,MM_MATERIAL_BEHAVIOUR_LABS:{labs:[lab]},addEventListener(){}};window.window=window;
  const sandbox={window,document,localStorage,console,Date,Math,Object,Number,String,Set,Map};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'activity-events-v2.js'});
  const click=attrs=>listeners.click({target:{closest:()=>attrs}});
  click({dataset:{mlStart:'retry-lab'},hasAttribute:()=>false});
  const choice=n=>({dataset:{mlChoice:String(n)},hasAttribute:()=>false});
  click(choice(0));
  click(choice(0)); // manufactured duplicate correct click for the same step
  step=1;click(choice(0));
  click({dataset:{},hasAttribute:name=>name==='data-ml-finish'});
  const events=window.MM_ACTIVITY_EVENTS_V2.events({includeLegacy:false});
  const complete=events.find(e=>e.type==='practice_complete');
  assert(complete,'Material Lab completion event missing');
  assert.strictEqual(complete.score,100,'duplicate correct click inflated Material Lab completion score');
  const high=window.MM_ACTIVITY_EVENTS_V2.record('practice_complete',{score:250});
  const low=window.MM_ACTIVITY_EVENTS_V2.record('practice_complete',{score:-20});
  assert.strictEqual(high.score,100,'activity event accepted a score above 100');
  assert.strictEqual(low.score,0,'activity event accepted a score below 0');
}

// Finding 5: canonical graph IDs are lossy slugs, so distinct raw identifiers
// that collapse to the same slug must fail closed rather than silently merge.
{
  const source=fs.readFileSync('src/domains/shared/data-spine.js','utf8');
  const window={addEventListener(){},MM_DATA:{lessons:[]}};window.window=window;
  const sandbox={window,console,Date,Math,Object,Number,String,Set,Map,clearTimeout(){},setTimeout(){return 1}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'data-spine.js'});
  const spine=window.MM_DATA_SPINE;
  const first=spine.register('lesson','A/B',{id:'spoofed',kind:'spoofed',key:'spoofed'});
  assert.strictEqual(first.id,'lesson:a-b');assert.strictEqual(first.kind,'lesson');assert.strictEqual(first.key,'A/B');
  assert.throws(()=>spine.register('lesson','A-B'),/Canonical data-spine id collision/,'distinct raw identifiers silently merged after slug collision');
  const rel=spine.relation('lesson','left','lesson','right','depends on',{id:'spoofed',from:'spoofed',to:'spoofed',type:'spoofed'});
  assert.strictEqual(rel.id,'lesson:left|depends-on|lesson:right');assert.strictEqual(rel.from,'lesson:left');assert.strictEqual(rel.to,'lesson:right');assert.strictEqual(rel.type,'depends-on');
}

console.log('Audit remediation runtime QA passed: local-role/cohort-export semantics, persisted assessment recency, fail-closed inadequate-sample statistics, retry-safe bounded activity scoring and canonical graph collision safety verified.');

// Keep the next-stage learner-model, analytics-quality and data-provenance decision
// pipelines inside the mandatory Release QA context that caught the audited regressions.
require('./qa_learner_recommendation_pipeline.cjs');
require('./qa_learning_analytics_quality.cjs');
require('./qa_deep_dive_data_provenance.cjs');