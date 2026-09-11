'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const runtimeSource=fs.readFileSync('data-integration-runtime.js','utf8');
for(const [token,message] of [
  ["const CONTEXT_KEYS=['machine','mould','materialGrade','job']",'canonical runtime must own the full baseline context identity'],
  ['function baselineCompatibility(dataset={},baseline={})','canonical runtime must own baseline compatibility'],
  ['assertBaselineCompatible(record,baseline);','canonical comparison must fail closed before drift analysis'],
  ["const PROCESS_DATA_STORES=['datasets','shots','baselines','caseLinks','interventions']",'canonical process-data cleanup must own every IndexedDB store'],
  ["db.transaction(PROCESS_DATA_STORES,'readwrite')",'canonical deletion must atomically include all process-data stores'],
  ["clearAllProcessData",'canonical runtime must expose verified whole-process-data cleanup'],
  ['row=>row?.datasetId===datasetId','canonical deletion must remove dataset-linked troubleshooting records'],
  ['__mmCanonicalProcessDataIntegrity:VERSION','canonical runtime must advertise native integrity ownership'],
  ['baselineCompatibility,contextCompatibility,assertBaselineCompatible','canonical integrity helpers must be exposed through the process-data API'],
  ['prepared?.validation?.reviewRequired','canonical readiness must consume intake review state'],
  ["code:'prepared-data-review'",'canonical readiness must expose a stable intake-review blocker code'],
  ['analysis-readiness blockers','baseline/drift errors must describe the full canonical readiness gate'],
])assert(runtimeSource.includes(token),message);

/* Exercise the canonical enrichment predicate without starting its browser installer. */
const runtimeForReadiness=runtimeSource.replace("install().catch(err=>{console.error('MouldMaster connected process-data runtime failed to initialise',err)});",'');
const readinessSandbox={window:{},console};
vm.createContext(readinessSandbox);
vm.runInContext(runtimeForReadiness,readinessSandbox,{filename:'data-integration-runtime.js'});
const readinessApi=readinessSandbox.window.MM_CONNECTED_PROCESS_DATA;
assert(readinessApi?.enrichPrepared,'canonical readiness API not installed');
const basePrepared={
  schema:3,rows:[{fill_time_s:1},{fill_time_s:2}],headers:['fill_time_s'],
  rules:[{key:'fill_time_s',action:'keep'}],sequence:{reviewRequired:false,warnings:[]},
  validation:{reviewRequired:false,invalidNumericValues:0,invalidNumericByColumn:[],note:'No malformed numeric values.'},
  summary:{outputRows:2,keptNumeric:1},boundary:'Prepared locally.'
};
const declared={fill_time_s:{meaning:'Measured fill time',role:'actual',unit:'s',sampling_basis:'per-cycle'}};
const clean=readinessApi.enrichPrepared(basePrepared,declared,{});
assert.equal(clean.quality.analysisReady,true,'fully declared clean intake should be analysis-ready');
assert.equal(clean.quality.blockingCount,0,'clean intake should have no readiness blockers');
const needsReview=JSON.parse(JSON.stringify(basePrepared));
needsReview.rows[1].fill_time_s='';
needsReview.validation={reviewRequired:true,invalidNumericValues:1,invalidNumericByColumn:[{column:'fill_time_s',count:1}],note:'Malformed nonblank numeric value was omitted and requires review.'};
const blocked=readinessApi.enrichPrepared(needsReview,declared,{});
assert.equal(blocked.quality.analysisReady,false,'intake review state must fail closed even after malformed cells are blanked');
assert(blocked.quality.issues.some(x=>x.level==='block'&&x.code==='prepared-data-review'),'intake review blocker missing from quality issues');
const reapplied=readinessApi.enrichPrepared(blocked,declared,{});
assert.equal(reapplied.quality.analysisReady,false,'reapplying semantic declarations must not erase unresolved intake review');
assert(reapplied.quality.issues.some(x=>x.code==='prepared-data-review'),'intake review blocker must survive re-enrichment');

/* Missing measurements must never be coerced to measured zero by statistical summaries. */
const summarySemantics={
  melt_temperature:{column:'melt_temperature',kind:'direct-measurement',role:'actual',blockers:[],unit:'°C',meaning:'Melt temperature',canonical_quantity:'melt_temperature'},
  real_zero:{column:'real_zero',kind:'direct-measurement',role:'actual',blockers:[],unit:'mm',meaning:'Zero-capable measurement',canonical_quantity:'real_zero'},
};
const missingSummary=readinessApi.intelligence.summarizeRows([
  {melt_temperature:'250',real_zero:'0'},
  {melt_temperature:'',real_zero:''},
  {melt_temperature:'   ',real_zero:null},
  {melt_temperature:null,real_zero:undefined},
  {melt_temperature:'260',real_zero:'10'},
  {melt_temperature:'not-a-number',real_zero:'not-a-number'},
],summarySemantics);
assert.equal(missingSummary.melt_temperature.n,2,'blank/null/invalid process measurements must be excluded from n');
assert.equal(missingSummary.melt_temperature.mean,255,'missing process measurements must not depress the mean toward zero');
assert.equal(missingSummary.melt_temperature.min,250,'missing process measurements must not create a false zero minimum');
assert.equal(missingSummary.real_zero.n,2,'missing values must be excluded while genuine zero remains a measurement');
assert.equal(missingSummary.real_zero.mean,5,'genuine numeric zero must remain in statistics');
assert.equal(missingSummary.real_zero.min,0,'genuine zero must not be filtered as missing');

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
        getAll:()=>makeRequest(()=>[...map.values()],tx),
        delete:key=>{map.delete(key)},
        clear:()=>{map.clear()},
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
  __mmCanonicalProcessDataIntegrity:'2026.09.11.1',
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
  tables.interventions.set('intervention-delete',{id:'intervention-delete',datasetId:'d-delete'});
  tables.interventions.set('intervention-keep',{id:'intervention-keep',datasetId:'d-current'});

  await window.MM_CONNECTED_PROCESS_DATA.storage.deleteDataset('d-delete');
  assert.equal(tables.datasets.has('d-delete'),false,'dataset must be deleted');
  assert.equal(tables.shots.has('shot-delete'),false,'dataset shots must be deleted');
  assert.equal(tables.baselines.has('baseline-delete'),false,'dataset baselines must be deleted');
  assert.equal(tables.caseLinks.has('case-delete'),false,'dataset-linked troubleshooting reference must be deleted');
  assert.equal(tables.interventions.has('intervention-delete'),false,'dataset-linked intervention record must be deleted');
  assert.equal(tables.datasets.has('d-current'),true,'unrelated dataset must remain');
  assert.equal(tables.shots.has('shot-keep'),true,'unrelated shot must remain');
  assert.equal(tables.baselines.has('baseline-keep'),true,'unrelated baseline must remain');
  assert.equal(tables.caseLinks.has('case-keep'),true,'unrelated troubleshooting reference must remain');
  assert.equal(tables.interventions.has('intervention-keep'),true,'unrelated intervention record must remain');

  const cleanup=await window.MM_CONNECTED_PROCESS_DATA.storage.clearAllProcessData();
  assert.equal(cleanup.verified,true,'whole-process-data cleanup must verify the post-delete state');
  for(const [name,map] of Object.entries(tables))assert.equal(map.size,0,`whole-process-data cleanup must empty ${name}`);

  console.log('Process-data integrity QA passed: canonical ownership, fail-closed intake review, missing-value statistics, context gating, fallback compatibility, per-dataset five-store cascade, and verified whole-process-data cleanup.');
})().catch(err=>{console.error(err);process.exitCode=1});
