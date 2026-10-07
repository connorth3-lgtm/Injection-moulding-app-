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
assert.equal(api.version,'2026.10.08.1');
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
  'mm_virtual_apprenticeship_v1'
])assert.ok(source.includes(marker),`missing apprenticeship/safety marker: ${marker}`);

for(const forbidden of [
  'automatic machine control',
  'guaranteed root cause',
  'universal optimum',
  'defect probability',
  'validated digital twin'
])assert.ok(!source.toLowerCase().includes(forbidden.toLowerCase()),`forbidden authority/prediction claim present: ${forbidden}`);

global.setInterval=originalSetInterval;
global.clearInterval=originalClearInterval;
console.log('Virtual apprenticeship authored-case, scoring and safety-boundary QA passed');
