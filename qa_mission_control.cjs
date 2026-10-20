'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

global.document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null},
  querySelector(){return null},
  querySelectorAll(){return []},
  body:null
};
global.window={addEventListener(){},dispatchEvent(){}};

require(path.join(__dirname,'src/domains/shell/mission-control.js'));
const api=global.window.MM_MISSION_CONTROL;
assert.ok(api,'Mission Control API must register');
assert.equal(api.version,'2026.10.08.8');
assert.equal(api.stages.length,8,'Mission Control must expose the full eight-stage mission timeline');
assert.deepEqual(api.stages.map(x=>x[0]),['brief','baseline','evidence','hypothesis','test','intervention','verification','reflection']);
assert.deepEqual(Object.keys(api.modes),['learner','technician','engineer']);
assert.match(api.boundary,/learner-scoped/i);
assert.match(api.boundary,/no machine-control/i);
assert.match(api.boundary,/production-setting/i);
assert.match(api.boundary,/competence-signoff/i);

const source=fs.readFileSync(path.join(__dirname,'src/domains/shell/mission-control.js'),'utf8');
for(const marker of [
  'Mission Control',
  'Mission context',
  'Mission timeline',
  'Mission evidence',
  'Search MouldMaster or type a command',
  'Learner',
  'Technician',
  'Engineer',
  'Start a mission',
  'Open evidence drawer',
  'Spatial Twin',
  'Virtual Apprenticeship',
  'Digital Factory — Case One',
  'Mould Master',
  'Process Data',
  'MM_APP_SHELL',
  'mm:mission-change',
  'MM_RUNTIME_V2',
  'mm_mission_control_v1'
])assert.ok(source.includes(marker),`missing Mission Control marker: ${marker}`);

assert.ok(!/style\s*=/.test(source),'Mission Control runtime must not create inline style attributes under the app CSP');
assert.ok(!/\.style\./.test(source),'Mission Control runtime must not mutate inline styles under the app CSP');
assert.ok(source.includes('function hydrateScopedState()'),'Mission Control must support late learner-scoped state hydration');
assert.ok(source.includes("const PROFILE_DB_KEY='mouldmasterProDB'")&&source.includes('function persistedLearnerId()'),'Mission Control must resolve the persisted active learner during startup');
assert.ok(source.includes('shared.storageKey(prefix,token)')&&source.includes("const prefix=STORAGE_KEY+'::'"),'Mission Control persisted-profile fallback must use the canonical learner-scope key format');
assert.ok(source.includes('function readScopedState()')&&source.includes('function writeScopedState(value)'),'Mission Control must use one scoped read/write boundary across live and startup identity states');
assert.ok(source.includes('function hydrateBeforeMutation()'),'Mission Control must hydrate learner-scoped state before passive or explicit writes');
assert.ok(source.includes('function guardLearnerAction(handler,boundToken)')&&source.includes('if(boundToken!==resolvedLearnerToken())'),'stale mounted Mission Control controls must be rejected after a learner switch');
assert.ok(source.includes('function snapshot(){')&&source.includes('synchronizeLearnerState();\n  return Object.freeze'),'programmatic Mission Control reads must synchronize learner scope before exposure');
assert.ok(source.includes('function setSurface(id){synchronizeLearnerState();state.surface'),'Mission Control surface changes must synchronize the active learner before saving');
assert.ok(source.includes('function scheduleHydration(attempt=0)')&&source.includes('setTimeout(()=>scheduleHydration(attempt+1),50)'),'Mission Control must retry scoped hydration until learner identity is available');
assert.ok(source.includes('const changed=hydrateCurrentLearner();')&&source.includes('if(attempt>=120)return changed'),'Mission Control startup hydration must keep watching after the first token so transient learner identities cannot strand persisted missions');
assert.ok(source.includes('hydratedLearnerToken===null&&localMeaningful')&&source.includes('storage.set?.(STORAGE_KEY'),'Mission Control must persist startup mission work when learner scope first resolves');
assert.ok(source.includes('class="mm-mc-drawer-panel" role="region" aria-label="Mission evidence"'),'Mission evidence drawer must be a labelled modeless region');
assert.ok(source.includes("state.drawerOpen?evidenceMarkup():''"),'closed Mission evidence drawer must not leave hidden interactive/text content in the DOM');
assert.ok(source.includes('synchronizeLearnerState();state.surface'),'view changes must synchronize learner-scoped Mission Control state before saving');
assert.ok(source.includes('role="dialog" aria-modal="true" aria-label="Mission Control command search"'),'Mission Control command palette must remain an explicitly named modal dialog');

const css=fs.readFileSync(path.join(__dirname,'src/domains/shell/mission-control.css'),'utf8');
for(const marker of [
  '#mmMissionControl',
  '.mm-mc-context',
  '.mm-mc-timeline',
  '.mm-mc-stage-track',
  '.mm-mc-drawer',
  '.mm-mc-palette',
  '.mm-mc-home-card',
  'data-mm-mission-mode="technician"',
  'data-mm-mission-mode="engineer"',
  '@media(max-width:700px)',
  '@media(max-width:480px)',
  '@media(prefers-reduced-motion:reduce)',
  '@media(forced-colors:active)'
])assert.ok(css.includes(marker),`missing Mission Control stylesheet contract: ${marker}`);
assert.ok(!css.includes('@import'),'Mission Control CSS must not import remote or implicit stylesheets');
assert.ok(!css.includes('http://')&&!css.includes('https://'),'Mission Control CSS must remain fully local/offline');

const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'runtime-domain-manifest.json'),'utf8'));
assert.ok((manifest.assets||[]).includes('./src/domains/shell/mission-control.js'),'Mission Control must load from the governed domain manifest');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
assert.ok(sw.includes("'./src/domains/shell/mission-control.js'"),'Mission Control JS must be atomically cached');
assert.ok(sw.includes("'./src/domains/shell/mission-control.css'"),'Mission Control CSS must be atomically cached');
const index=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert.ok(index.includes('mission-control.css'),'Mission Control CSS must load during first-paint shell assembly');

const spatial=fs.readFileSync(path.join(__dirname,'src/domains/engineering/spatial-twin.js'),'utf8');
assert.ok(spatial.includes('MM_MISSION_CONTROL?.attachContext'),'Spatial Twin must feed case context into Mission Control');
assert.ok(spatial.includes('MM_MISSION_CONTROL?.setStage'),'Spatial Twin timeline must feed Mission Control stages');
const apprenticeship=fs.readFileSync(path.join(__dirname,'src/domains/engineering/virtual-apprenticeship.js'),'utf8');
assert.ok(apprenticeship.includes('MM_MISSION_CONTROL?.attachContext'),'Virtual Apprenticeship must feed Mission Control context');
assert.ok(apprenticeship.includes("hypothesis:'hypothesis'")&&apprenticeship.includes("verify:'verification'"),'Apprenticeship reasoning must map to mission stages');
const workspace=fs.readFileSync(path.join(__dirname,'mould-master-workspace.js'),'utf8');
assert.ok(workspace.includes('syncMissionContext(c)'),'Mould Master must feed persistent engineering context into Mission Control');
assert.ok(workspace.includes("return 'reflection'")&&workspace.includes("return 'verification'"),'Mould Master evidence maturity must map into the mission timeline');

require('./qa_mission_control_isolation.cjs');
console.log('Mission Control app-wide context, timeline, evidence, command, responsive and authority-boundary QA passed');
