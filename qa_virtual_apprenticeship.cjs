'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

global.document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null},
  querySelector(){return null}
};
global.window={addEventListener(){}};
const originalSetInterval=global.setInterval;
const originalClearInterval=global.clearInterval;
global.setInterval=()=>0;
global.clearInterval=()=>{};

require(path.join(__dirname,'src/domains/engineering/virtual-apprenticeship.js'));
const api=global.window.MM_VIRTUAL_APPRENTICESHIP;
assert.ok(api,'virtual apprenticeship API must register');
assert.equal(api.version,'2026.10.09.3');
assert.equal(api.cases.length,6,'v1 must ship six governed authored practice cases');
assert.deepEqual(Object.keys(api.levels),['beginner','developing','advanced']);
assert.match(api.boundary,/no machine-control/i);
assert.match(api.boundary,/production-setting/i);
assert.match(api.boundary,/predictive-physics/i);

const ids=new Set();
for(const c of api.cases){
  assert.match(c.id,/^VA-0[1-6]$/);
  assert.ok(!ids.has(c.id),`duplicate case id ${c.id}`);
  ids.add(c.id);
  assert.ok(c.title&&c.brief&&c.baseline&&c.focus,`${c.id} missing authored learning context`);
  assert.equal(c.observations.length,5,`${c.id} should expose five bounded evidence observations`);
  for(const key of ['hypothesis','test','response','verify']){
    assert.ok(c[key]?.prompt,`${c.id} missing ${key} prompt`);
    assert.equal(c[key].options.length,3,`${c.id} ${key} needs three choices`);
    assert.equal(c[key].options.filter(x=>x[2]===true).length,1,`${c.id} ${key} must have one keyed reasoning choice`);
    for(const option of c[key].options)assert.ok(option[3]?.length>20,`${c.id} ${key} choice missing explanatory coaching`);
  }
  const perfect={};
  for(const key of ['hypothesis','test','response','verify'])perfect[key]=c[key].options.find(x=>x[2]===true)[0];
  const scored=api.scoreReasoning(c,perfect);
  assert.equal(scored.total,4,`${c.id} correct evidence chain should score 4/4`);
  assert.equal(scored.pct,100,`${c.id} correct evidence chain should score 100%`);
}

assert.equal(api.factoryTrack.length,6,'six existing cases form one formative programme');
assert.equal(api.factoryCaseOne.caseId,'VA-02','factory entry must reuse the authored cavity case');
assert.deepEqual(api.factoryCaseOne.book.map(c=>c.id),['multi-cavity','cavity-pressure','feed-system','diagnostic-method']);
assert.ok(api.factoryCaseOne.windows.every(w=>w.mass.length===4),'cavity identities must not be averaged away');
const target=api.cases[1];
const good=Object.fromEntries(['hypothesis','test','response','verify'].map(k=>[k,target[k].options.find(o=>o[2])[0]]));
assert.equal(api.tutorPlan(target,api.scoreReasoning(target,good)).gaps.length,0);
assert.equal(api.tutorPlan(target,api.scoreReasoning(target,{})).book.length,4,'missed skills must recommend relevant Book reading');
assert.equal(api.competencyRecord().length,6,'one scoped practice record for academy track');
const first=api.cases[0];
const wrong={
  hypothesis:first.hypothesis.options.find(x=>!x[2])[0],
  test:first.test.options.find(x=>!x[2])[0],
  response:first.response.options.find(x=>!x[2])[0],
  verify:first.verify.options.find(x=>!x[2])[0]
};
assert.equal(api.scoreReasoning(first,wrong).total,0,'incorrect reasoning chain should not receive hidden partial credit');
assert.equal(api.scoreReasoning(first,{}).total,0,'blank reasoning chain must score zero');

const source=fs.readFileSync(path.join(__dirname,'src/domains/engineering/virtual-apprenticeship.js'),'utf8');
for(const marker of [
  'Virtual apprenticeship',
  'Shop-floor brief',
  'Evidence board',
  'Your investigation',
  'Reasoning quality',
  'validated baseline',
  'discriminating next evidence',
  'controlled response',
  'verification',
  'Authored case evidence is separate from physical prediction',
  'does not simulate validated machine physics',
  'does not',
  'prescribe production settings',
  'bypass safeguards',
  'MM_RUNTIME_V2',
  'mm_virtual_apprenticeship_v1',
  'const baseSimulatorRender',
  'renderSimulatorWithApprenticeship',
  'window.renderSimulator=renderSimulatorWithApprenticeship',
  'root.insertBefore(host,root.firstChild)',
  'navigation cannot silently remove',
  'function openCase',
  'Explore this case in Spatial Twin'
])assert.ok(source.includes(marker),`missing apprenticeship/safety marker: ${marker}`);

assert.ok(!source.includes("root.insertBefore(host,output)"),'apprenticeship must not insert relative to a nested simulator output node');

for(const forbidden of [
  'automatic machine control',
  'guaranteed root cause',
  'defect probability',
  'validated digital twin'
])assert.ok(!source.toLowerCase().includes(forbidden.toLowerCase()),`forbidden authority/prediction claim present: ${forbidden}`);

global.setInterval=originalSetInterval;
global.clearInterval=originalClearInterval;
console.log('Virtual apprenticeship authored-case, scoring and safety-boundary QA passed');
