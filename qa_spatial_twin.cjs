'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

global.document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null}
};
global.window={addEventListener(){}};

require(path.join(__dirname,'src/domains/engineering/spatial-twin.js'));
const api=global.window.MM_SPATIAL_TWIN;
assert.ok(api,'Spatial Twin API must register');
assert.equal(api.version,'2026.10.08.3');
assert.equal(api.modes.length,7,'Spatial Twin must expose seven governed view modes');
assert.equal(api.phases.length,6,'Spatial Twin timeline must expose six authored phases');
assert.equal(Object.keys(api.hotspots).length,7,'Spatial Twin must expose seven physical/system hotspots');
assert.equal(Object.keys(api.scenes).length,6,'Spatial Twin must map all six apprenticeship cases');

for(const id of ['material','injection','mould','cavity4','cooling','sensor','part']){
  const h=api.hotspots[id];
  assert.ok(h?.label&&h?.meaning&&h?.evidence&&h?.boundary,`${id} hotspot must carry meaning/evidence/boundary context`);
}
for(const id of ['VA-01','VA-02','VA-03','VA-04','VA-05','VA-06']){
  const scene=api.scenes[id];
  assert.ok(scene?.mentor,`${id} missing contextual coaching`);
  assert.equal(Object.keys(scene.metrics||{}).length,6,`${id} must carry all six timeline states`);
  for(const phase of ['baseline','drift','fault','test','intervention','recovery']){
    for(const key of ['fill','transfer','cavity','quality'])assert.ok(scene.metrics[phase]?.[key],`${id}/${phase} missing ${key} cue`);
  }
}
assert.match(api.boundary,/no validated machine-physics/i);
assert.match(api.boundary,/production-setting/i);
assert.match(api.boundary,/machine-control/i);

const source=fs.readFileSync(path.join(__dirname,'src/domains/engineering/spatial-twin.js'),'utf8');
for(const marker of [
  'MouldMaster Spatial Twin',
  'Explore the moulding system, not the menu',
  'System navigator',
  'Evidence at this moment',
  'Known good',
  'Fault visible',
  'Evidence test',
  'Intervention',
  'Recovery',
  'Context coach',
  'Continue this case in Virtual Apprenticeship',
  'Authored training state',
  'No machine control',
  'does not reproduce validated machine physics',
  'MM_VIRTUAL_APPRENTICESHIP',
  'MM_RUNTIME_V2'
])assert.ok(source.includes(marker),`missing Spatial Twin marker: ${marker}`);

assert.ok(!/data-mm-st-hotspot="\$\{id\}" style=/.test(source),'hotspot placement must not depend on CSP-blocked style attributes');
for(const forbidden of ['automatic machine control','guaranteed root cause','validated digital twin','production recipe authority']){
  assert.ok(!source.toLowerCase().includes(forbidden),`forbidden authority claim present: ${forbidden}`);
}
console.log('Spatial Twin structure, case mapping and authority-boundary QA passed');
