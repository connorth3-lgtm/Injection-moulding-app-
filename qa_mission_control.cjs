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
  'MM_APP_SHELL',
  'mm:mission-change',
  'MM_RUNTIME_V2',
  'mm_mission_control_v1'
])assert.ok(source.includes(marker),`missing Mission Control marker: ${marker}`);
assert.ok(!source.includes('Process Data'),'Mission Control must not expose the retired Process Data entry point');

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
assert.ok(source.includes('const changed=hydrateCurrentLearner();')&&source.includes('if(attempt>=120)return changed'),'Mission Control startup hydration must keep watching after the first token so transient learner identities cannot strand persiste