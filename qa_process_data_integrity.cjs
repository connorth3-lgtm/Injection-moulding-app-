'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const runtimeSource=fs.readFileSync('data-integration-runtime.js','utf8');
for(const [token,message] of [
  ["const CONTEXT_KEYS=['machine','mould','materialGrade','job']",'canonical runtime must own the full baseline context identity'],
  ['function baselineCompatibility(dataset={},baseline={})','canonical runtime must own baseline compatibility'],
  ['assertBaselineCompatible(record,baseline);','canonical comparison must fail closed before drift analysis'],
  ["db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite')",'canonical deletion must atomically include troubleshooting links'],
  ['row=>row?.datasetId===datasetId','canonical deletion must remove dataset-linked troubleshooting records'],
  ['__mmCanonicalProcessDataIntegrity:VERSION','canonical runtime must advertise native integrity ownership'],
  ['baselineCompatibility,contextCompatibility,assertBaselineCompatible','canonical integrity helpers must be exposed through the process-data API'],
])assert(runtimeSource.includes(token),message);

function immediate(fn){setImmediate(fn)}

const tables={
  datasets:new Map(),
  shots:new Map(),
  baselines:new Map(),
  caseLinks:new Map(),
  interventions:new Map(),
};

function makeRequest(run,tx){
  const req={onsuccess:null,onerror:null,result:null,error:null};
  tx._pending++;
  immediate(()=>{
    try{req.result=run();req.onsuccess?.()}catch(err){req.error=err;req.onerror?.()}
    finally{tx._pending--;tx._maybeComplete()}
  });
  return req;
}
function cursorRequest(entries,map,tx){
  const req={onsuccess:null,onerror:null,result:null,error:null};
  tx._pending++;
  let index=0;
  function next(){
    immediate(()=>{
      try{
        if(index>=entries.length){req.result=null;req.onsuccess?.();tx._pending--;tx._maybeComplete();return}
        const [key,value]=entries[index++];
        req.result={value,delete:()=>map.delete(key),continue:next};
        req.onsuccess?.();
      }catch(err){req.error=err;req.onerror?.();tx._pending--;tx._maybeComplete()}
    });
  }
  next();return req;
}
function makeTransaction(names){
  const allowed=new Set(Array.isArray(names)?names:[names]);
  let completeHandler=null;
  const tx={
    _pending:0,_completed:false,error:null,onerror:null,onabort:null,
    _maybeComplete(){if(!this._completed&&this._pending===0&&completeHandler){this._completed=true;immediate(()=>completeHandler())}},
    objectStore(name){
      assert(allowed.has(name),`store ${name} was not declared in transaction`);
      const map=tables[name];assert(map,`unknown store ${name}`);
      return {
        get:key=>makeRequest(()=>map.get(key),tx),
        delete:key=>{map.delete(key)},
        openCursor:()=>cursorRequest([...map.entries()],map,tx),
        index(indexName){
          assert.equal(indexName,'datasetId');
          return {openCursor:range=>cursorRequest([...map.entries()].filter(([,row])=>row?.datasetId===range),map,tx)};
        },
      };
    },
  };
  Object.defineProperty(tx,'oncomplete',{get:()=>completeHandler,set:fn=>{completeHandler=fn;tx._maybeComplete()}});
  return tx;
}
const fakeDb={transaction:names=>makeTransaction(names),close(){}};
global.indexedDB={open(){const req={onsuccess:null,onerror:null,result:null,error:null};immediate(()=>{req.result=fakeDb;req.onsuccess?.()});return req}};
global.IDBKeyRange={only:value=>value};
global.document={addEventListener(){},documentElement:{},querySelector(){return null}};
global.MutationObserver=class{observe(){}};
global.requestAnimationFrame=fn=>setImmediate(fn);
global.window=global;
global.confirm=()=>true;

let compareCalls=0;
window.MM_CONNECTED_PROCESS_DATA={
  storage:{deleteDataset:async()=>{throw new Error('unhardened delete called')}},
  intelligence:{compareToBaseline:async(datasetId,baselineId)=>{compareCalls++;return {datasetId,baselineId,original:true}}},
};

vm.runInThisContext(fs.readFileSync('src/domains/process/process-data-integrity.js','utf8'),{filename:'process-data-integrity.js'});
const integrity=window.MM_PROCESS_DATA_INTEGRITY;
assert(integrity,'integrity API not installed');

const canonicalDelete=async()=>true;
const canonicalCompare=async()=>({canonical:true});
const canonicalApi={
  __mmCanonicalProcessDataIntegrity:'2026.09.10.3',
  storage:{deleteDataset:canonicalDelete},
  intelligence:{compareToBaseline:canonicalCompare},
};
assert.equal(integrity.harden(canonicalApi),true,'compatibility sidecar should accept a canonical runtime');
assert.equal(canonicalApi.storage.deleteDataset,canonicalDelete,'compatibility sidecar must not replace canonical deletion');
assert.equal(canonicalApi.intelligence.compareToBaseline,canonicalCompare,'compatibility sidecar must not wrap canonical comparison');
assert.equal(canonicalApi.__mmProcessDataIntegrity,integrity.version,'compatibility sidecar should record successful canonical handoff');

function entity(machine='M1',mould='T1',materialGrade='PP-A',job='JOB-1'){return {machine,mould,materialGrade,job}}

assert.deepEqual(integrity.contextKeys,['machine','mould','materialGrade','job'],'cross-dataset gate must include job context');
assert.equal(integrity.baselineCompatibility({id:'d1',entities:{}},{datasetId:'d1',entities:{}}).compatible,true,'same-dataset baseline must remain valid');
assert.equal(integrity.baselineCompatibility({id:'d1',entities:entity(' M1 ',' T1 ',' PP-A ',' JOB-1 ')},{datasetId:'other',entities:entity('m1','t1','pp-a','job-1')}).compatible,true,'cross-dataset context comparison should normalize case and whitespace');
assert.equal(integrity.baselineCompatibility({id:'d1',entities:entity()},{datasetId:'other',entities:{machine:'M1',mould:'T1',materialGrade:'PP-A'}}).compatible,false,'missing job identity must fail closed');
assert.equal(integrity.baselineCompatibility({id:'d1',entities:entity()},{datasetId:'other',entities:entity('M1','T1','PP-A','JOB-2')}).compatible,false,'job mismatch must fail closed');
assert.equal(integrity.baselineCompatibility({id:'d1',entities:entity()},{datasetId:'other',entities:entity('M1','T2','PP-A','JOB-1')}).compatible,false,'mould mismatch must fail closed');

for(const [key,value] of [
  ['d-current',{id:'d-current',quality:{analysisReady:true},entities:entity()}],
  ['d-delete',{id:'d-delete',quality:{analysisReady:true},entities:entity('M2','T2','ABS','JOB-2')}],
])tables.datasets.set(key,value);
tables.baselines.set('b-good',{id:'b-good',datasetId:'other-good',entities:entity(),summary:{}});
tables.baselines.set('b-bad',{id:'b-bad',datasetId:'other-bad',entities:entity('M1','T9','PP-A','JOB-1'),summary:{}});
tables.baselines.set('b-same',{id:'b-same',datasetId:'d-current',entities:{},summary:{}});

(async()=>{
  const good=await window.MM_CONNECTED_PROCESS_DATA.intelligence.compareToBaseline('d-current','b-good');
  assert.equal(good.original,true);
  await window.MM_CONNECTED_PROCESS_DATA.intelligence.compareToBaseline('d-current','b-same');
  await assert.rejects(()=>window.MM_CONNECTED_PROCESS_DATA.intelligence.compareToBaseline('d-current','b-bad'),/Baseline context mismatch/);
  assert.equal(compareCalls,2,'rejected baseline must not reach original comparison implementation');

  tables.shots.set('shot-delete',{id:'shot-delete',datasetId:'d-delete'});
  tables.shots.set('shot-keep',{id:'shot-keep',datasetId:'d-current'});
  tables.baselines.set('baseline-delete',{id:'baseline-delete',datasetId:'d-delete'});
  tables.baselines.set('baseline-keep',{id:'baseline-keep',datasetId:'d-current'});
  tables.caseLinks.set('case-delete',{caseId:'case-delete',datasetId:'d-delete'});
  tables.caseLinks.set('case-keep',{caseId:'case-keep',datasetId:'d-current'});

  await window.MM_CONNECTED_PROCESS_DATA.storage.deleteDataset('d-delete');
  assert.equal(tables.datasets.has('d-delete'),false,'dataset must be deleted');
  assert.equal(tables.shots.has('shot-delete'),false,'dataset shots must be deleted');
  assert.equal(tables.baselines.has('baseline-delete'),false,'dataset baselines must be deleted');
  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');
  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');
  assert.equal(tables.shots.has('shot-keep'),true,'unrelated shot must remain');
  assert.equal(tables.baselines.has('baseline-keep'),true,'unrelated baseline must remain');
  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');

  console.log('Process-data integrity QA passed: canonical runtime ownership, fallback compatibility, context gating, and atomic dataset/case-link cascade verified.');
})().catch(err=>{console.error(err);process.exitCode=1});
