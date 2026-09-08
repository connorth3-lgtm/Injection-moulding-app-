'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

class StorageMock{
  constructor(){this.data=new Map()}
  getItem(k){return this.data.has(String(k))?this.data.get(String(k)):null}
  setItem(k,v){this.data.set(String(k),String(v))}
  removeItem(k){this.data.delete(String(k))}
}

const runtimeSource=fs.readFileSync('runtime-v2.js','utf8');
const bridgeSource=fs.readFileSync('src/domains/zz-v27/01-runtime-v2-scope-bridge.js','utf8');
assert(runtimeSource.includes('window.MM_RUNTIME_V2=Object.freeze({'),'fixture must exercise the real frozen legacy runtime export');
assert(!bridgeSource.includes('Object.assign(R'),'v27 bridge must not mutate the frozen legacy MM_RUNTIME_V2 object');
assert(!/Object\.freeze\(\s*\{\s*\.\.\.R/.test(bridgeSource),'v27 bridge facade must remain extensible for legacy lazy decorators');

const localStorage=new StorageMock();
const scope={token:()=> '0123456789abcdef0123456789abcdef'};
const noop=()=>true;
const window={
  MM_LEARNER_SCOPE:scope,
  db:{activeUser:'learner-a'},
  user:{id:'learner-a'},
  renderLesson:noop,
  renderDashboard:noop,
  switchView:noop,
  startExam:noop,
  gradeExam:noop,
  getExamQuestions:noop
};
const sandbox={window,localStorage,Object,String,JSON,Error,console,Map,Set,Math};
vm.createContext(sandbox);
vm.runInContext(runtimeSource,sandbox,{filename:'runtime-v2.js'});
const base=window.MM_RUNTIME_V2;
assert.strictEqual(Object.isFrozen(base),true,'legacy runtime must be frozen before the bridge runs');
const weakToken=base.storage.learnerToken();
assert.notStrictEqual(weakToken,scope.token(),'legacy fixture must start with the old learner token');

vm.runInContext(bridgeSource,sandbox,{filename:'01-runtime-v2-scope-bridge.js'});
const runtime=window.MM_RUNTIME_V2;
assert.notStrictEqual(runtime,base,'v27 bridge must expose a mutable facade instead of mutating the frozen legacy runtime');
assert.strictEqual(Object.isFrozen(base),true,'legacy runtime must remain frozen and untouched');
assert.strictEqual(Object.isExtensible(runtime),true,'v27 bridge facade must stay extensible for legacy lazy decorators');
runtime.__rawPrepareRegression=()=>true;
assert.strictEqual(runtime.__rawPrepareRegression(),true,'legacy post-bridge runtime decoration must remain possible');
assert.strictEqual(runtime.version,base.version,'legacy runtime version metadata must remain truthful');
assert.strictEqual(runtime.setImplementation,base.setImplementation,'runtime dispatcher methods must delegate unchanged');
assert.strictEqual(runtime.storage.key('mm_test'),'mm_test::0123456789abcdef0123456789abcdef','scoped storage key regressed');
assert.strictEqual(runtime.storage.set('mm_test',{ok:true}),true,'scoped storage write failed');
assert.deepStrictEqual(runtime.storage.get('mm_test'),{ok:true},'scoped storage read failed');
const snap=runtime.snapshot();
assert.strictEqual(snap.version,base.version,'base snapshot version was lost');
assert.strictEqual(snap.learnerToken,scope.token(),'learner token missing from runtime snapshot');
assert.strictEqual(snap.scopeProvider,'MM_LEARNER_SCOPE','scope provider metadata regressed');
assert.strictEqual(snap.scopeBridgeVersion,'2026.09.08.27','scope bridge version metadata regressed');
assert.strictEqual(runtime.module('runtime-v2-scope-bridge-v27')?.status,'active','runtime bridge registration regressed');
console.log('v27 runtime bridge real frozen-runtime compatibility QA passed');
