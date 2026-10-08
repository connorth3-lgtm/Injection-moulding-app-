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
assert.match(api.boundary,/control authority over production equipment/i);

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
const css=fs.readFileSync(path.join(__dirname,'src/domains/engineering/spatial-twin.css'),'utf8');
for(const marker of [
  '.mm-st-shell','.mm-st-layout','.mm-st-stage','.mm-st-hotspot','.mm-st-timeline','.mm-st-mentor',
  '.mm-st-layer-flow','.mm-st-layer-pressure','.mm-st-layer-thermal','.mm-st-layer-cooling',
  '.mm-st-layer-quality','.mm-st-layer-evidence','@media(max-width:820px)','@media(max-width:520px)',
  '@media(prefers-reduced-motion:reduce)'
])assert.ok(css.includes(marker),`missing Spatial Twin stylesheet contract: ${marker}`);
for(const marker of [
  '#mmSpatialTwin{width:100%;max-width:100%;min-width:0',
  '.mm-st-casebar select{width:100%;max-width:100%;min-width:0',
  '.mm-st-layout{display:grid;grid-template-columns:220px minmax(0,1fr) 300px;gap:12px;min-width:0;max-width:100%',
  '.mm-st-right{display:grid;gap:12px;min-width:0'
])assert.ok(css.includes(marker),`Spatial Twin mobile intrinsic-width safeguard missing: ${marker}`);

const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'runtime-domain-manifest.json'),'utf8'));
const assets=manifest.assets||[];
const va=assets.indexOf('./src/domains/engineering/virtual-apprenticeship.js');
const spatial=assets.indexOf('./src/domains/engineering/spatial-twin.js');
assert.ok(va>=0&&spatial>va,'Spatial Twin must load after Virtual Apprenticeship');

const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
assert.ok(sw.includes("'./src/domains/engineering/spatial-twin.js'"),'Spatial Twin JS must be atomically cached');
assert.ok(sw.includes("'./src/domains/engineering/spatial-twin.css'"),'Spatial Twin CSS must be atomically cached');
const index=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert.ok(index.includes('spatial-twin.css'),'Spatial Twin CSS must load from the governed shell');
console.log('Spatial Twin runtime, integration, CSP and authority-boundary QA passed');
