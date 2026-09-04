'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/domains/learning/learner-model.js','utf8');
const dashboard=fs.readFileSync('src/domains/learning/content-intelligence.js','utf8');
const REAL_DATE=Date;
const NOW='2026-09-04T00:00:00.000Z';
class FixedDate extends REAL_DATE{
  constructor(...args){super(...(args.length?args:[NOW]));}
  static now(){return REAL_DATE.parse(NOW);}
  static parse(value){return REAL_DATE.parse(value);}
  static UTC(...args){return REAL_DATE.UTC(...args);}
}

function load({events=[],questions=[]}={}){
  const window={MM_ACTIVITY_EVENTS_V2:{events:()=>events,assessmentSnapshot:()=>({questions})}};
  const sandbox={window,Date:FixedDate,Math,Object,Number,String,Set,Map,console};
  window.window=window;
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'learner-model.js'});
  return window.MM_LEARNER_MODEL;
}

// Unknown recency must stay unknown. It must never become a synthetic very-old date,
// a forgetting-risk score or an overdue-review count.
{
  const model=load({questions:[{attempts:4,correct:4,wrong:0,competency:'legacy-recency',concept:'',last:null}]});
  const row=model.build().topics.find(x=>x.key==='competency:legacy-recency');
  assert(row,'legacy assessment topic missing');
  assert.strictEqual(row.last,null);
  assert.strictEqual(row.recencyKnown,false);
  assert.strictEqual(row.ageDays,null);
  assert.strictEqual(row.forgettingRisk,null);
  const summary=model.summary();
  assert.strictEqual(summary.reviewDue,0,'unknown recency was counted as review due');
  assert.strictEqual(summary.recencyUnknown,1,'unknown recency was not exposed explicitly');
  const rec=model.recommendations(10).find(x=>x.topic==='competency:legacy-recency');
  assert(rec,'unknown-recency topic did not produce a safe next action');
  assert.strictEqual(rec.actionType,'refresh-recency-evidence');
  assert.strictEqual(rec.recencyKnown,false);
}

// Genuine old timestamped evidence should still drive spaced retrieval.
{
  const model=load({questions:[{attempts:5,correct:5,wrong:0,competency:'old-but-known',concept:'',last:'2026-07-01T00:00:00.000Z'}]});
  const row=model.build().topics.find(x=>x.key==='competency:old-but-known');
  assert(row.recencyKnown);
  assert(row.forgettingRisk>=45,'old timestamped evidence did not produce forgetting risk');
  const rec=model.recommendations(10).find(x=>x.topic==='competency:old-but-known');
  assert.strictEqual(rec.actionType,'spaced-retrieval');
  assert.strictEqual(rec.suggestedActivity,'retrieval-practice');
}

// Repeated misses should outrank a generic low-confidence request and produce remediation.
{
  const events=[1,2].map(i=>({type:'practice_miss',t:`2026-09-03T0${i}:00:00.000Z`,activityType:'scenario',activityId:'fill-balance',competencyIds:['fill-balance'],conceptIds:[],mechanismIds:[]}));
  const model=load({events});
  const rec=model.recommendations(10).find(x=>x.topic==='competency:fill-balance');
  assert(rec,'repeated misses did not produce a recommendation');
  assert.strictEqual(rec.actionType,'targeted-remediation');
  assert.strictEqual(rec.suggestedActivity,'discriminating-scenario-practice');
}

// A material fall in repeated practice performance should be surfaced as regression,
// rather than being hidden behind a generic transfer suggestion.
{
  const events=[95,60].map((score,i)=>({type:'practice_complete',score,t:`2026-09-03T0${i+1}:30:00.000Z`,activityType:'scenario',activityId:'process-window',competencyIds:['process-window'],conceptIds:[],mechanismIds:[]}));
  const model=load({events});
  const row=model.build().topics.find(x=>x.key==='competency:process-window');
  assert(row.learningVelocity<=-15,'negative learning velocity was not detected');
  const rec=model.recommendations(10).find(x=>x.topic==='competency:process-window');
  assert.strictEqual(rec.actionType,'stabilize-regression');
}

// Strong same-context performance with weak diversity should ask for transfer evidence.
{
  const events=[1,2,3,4].map(i=>({type:'practice_complete',score:80,t:`2026-09-03T${String(i+10).padStart(2,'0')}:00:00.000Z`,activityType:'scenario',activityId:'transfer-topic',competencyIds:['transfer-topic'],conceptIds:[],mechanismIds:[]}));
  const model=load({events});
  const row=model.build().topics.find(x=>x.key==='competency:transfer-topic');
  assert.strictEqual(row.evidenceDiversity,1);
  assert(row.transferStrength<45);
  const rec=model.recommendations(10).find(x=>x.topic==='competency:transfer-topic');
  assert.strictEqual(rec.actionType,'transfer-practice');
  assert.strictEqual(rec.suggestedActivity,'different-context-scenario');
}

for(const marker of ['Recency unknown','Avg confidence','actionType','suggestedActivity','Unknown recency is kept separate from overdue review']){
  assert(dashboard.includes(marker),`data-intelligence dashboard is not surfacing learner-model signal: ${marker}`);
}

console.log('Learner recommendation pipeline QA passed: unknown recency, spaced retrieval, remediation, regression and transfer actions are distinguished and surfaced.');
