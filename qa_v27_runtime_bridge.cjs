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

const source=fs.readFileSync('src/domains/zz-v27/01-runtime-v2-scope-bridge.js','utf8');
assert(!/Object\.freeze\(\s*\{\s*\.\.\.R/.test(source),'v27 bridge must not freeze a replacement MM_RUNTIME_V2 object');

const localStorage=new StorageMock();
const scope={token:()=> '0123456789abcdef0123456789abcdef'};
let registration=null;
const runtime={
  version:'2026.09.01.6',
  policy:'base runtime policy.',
  snapshot(){return {base:true}},
  registerModule(id,meta){registration={id,meta}}
};
const window={MM_RUNTIME_V2:runtime,MM_LEARNER_SCOPE:scope};
const sandbox={window,localStorage,Object,String,JSON,Error,console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'01-runtime-v2-scope-bridge.js'});

assert.strictEqual(window.MM_RUNTIME_V2,runtime,'v27 bridge must preserve MM_RUNTIME_V2 object identity');
assert.strictEqual(Object.isExtensible(runtime),true,'v27 bridge must leave MM_RUNTIME_V2 extensible for legacy lazy decorators');
runtime.__rawPrepareRegression=()=>true;
assert.strictEqual(runtime.__rawPrepareRegression(),true,'legacy post-bridge runtime decoration must remain possible');
assert.strictEqual(runtime.storage.key('mm_test'),'mm_test::0123456789abcdef0123456789abcdef','scoped storage key regressed');
assert.strictEqual(runtime.storage.set('mm_test',{ok:true}),true,'scoped storage write failed');
assert.deepStrictEqual(runtime.storage.get('mm_test'),{ok:true},'scoped storage read failed');
const snap=runtime.snapshot();
assert.strictEqual(snap.base,true,'base runtime snapshot was lost');
assert.strictEqual(snap.learnerToken,scope.token(),'learner token missing from runtime snapshot');
assert.strictEqual(snap.scopeProvider,'MM_LEARNER_SCOPE','scope provider metadata regressed');
assert.strictEqual(snap.scopeBridgeVersion,'2026.09.08.27','scope bridge version metadata regressed');
assert.strictEqual(registration.id,'runtime-v2-scope-bridge-v27','runtime bridge registration regressed');
console.log('v27 runtime bridge compatibility QA passed');
