'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/domains/zz-v27/03-process-data-local-intake.js','utf8');
const integration=fs.readFileSync('data-integration-runtime.js','utf8');
assert(integration.includes('api.__rawPrepare=api.prepare'),'fixture must cover the real connected-data __rawPrepare decorator');
assert(integration.includes('api.prepare=function(parsed,overrides={},meta={})'),'fixture must cover the real connected-data prepare wrapper');
assert(!source.includes('MM_PROCESS_DATA_LOCAL_INTAKE=Object.freeze'),'strict intake API container must remain extensible for connected-data compatibility');

let legacyOpenCount=0;
const nodes=new Map();
function element(tag='div'){
  return {tagName:String(tag).toUpperCase(),children:[],append(...xs){this.children.push(...xs);for(const x of xs)if(x&&x.id)nodes.set(x.id,x)},addEventListener(){},remove(){},setAttribute(k,v){this[k]=v},className:'',textContent:'',disabled:false,id:'',innerHTML:'',files:null};
}
const host=element('div');host.id='processDataLabs';nodes.set(host.id,host);
const document={
  querySelectorAll(){return[]},
  getElementById(id){return nodes.get(id)||null},
  createElement:element,
  body:{appendChild(){}},head:{appendChild(){}}
};
const window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){legacyOpenCount++;return'legacy-opened'}},requestAnimationFrame:fn=>fn()};
const URL={createObjectURL(){return'blob:test'},revokeObjectURL(){}};
function Blob(){}
const sandbox={window,document,URL,Blob,requestAnimationFrame:fn=>fn(),Object,String,JSON,Error,Map,Set,Number,Math,console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'03-process-data-local-intake.js'});
const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;
assert(api,'strict intake API missing');
assert.strictEqual(Object.isExtensible(api),true,'strict intake API must be extensible for connected-data runtime');
const strictParse=api.parseCsv;
const strictPrepare=api.prepare;

// The established Practice route calls the legacy diagnostics open function.
// .27 must preserve that route while replacing the old intake UI with the
// strict parser, rather than leaving learners at a dead end.
const legacyResult=window.MM_PROCESS_DATA_DIAGNOSTICS.open();
assert.strictEqual(legacyResult,'legacy-opened','legacy Practice open result should be preserved');
assert.strictEqual(legacyOpenCount,1,'legacy Practice open should be called exactly once');
const picker=nodes.get('mmLocalCsvPicker');
assert(picker,'legacy Practice route must render the strict local CSV picker');
assert.strictEqual(picker.type,'file','strict local CSV picker must remain a file input');
assert.strictEqual(picker.accept,'.csv,text/csv','strict local CSV picker must restrict selection to CSV');
assert.strictEqual(picker['aria-describedby'],'mmLocalCsvBoundary','strict picker must expose its local-processing boundary');

// Reproduce the legacy connected-data decoration contract that caused Chromium
// startup to fail when the .27 API container was frozen.
api.__rawPrepare=api.prepare;
api.prepare=function(parsed){return api.__rawPrepare(parsed)};
api.open=()=>true;
api.enrich=()=>true;
api.savePrepared=async()=>true;
api.listDatasets=async()=>[];
api.openLibrary=()=>true;
api.__mmConnectedData=true;
assert.strictEqual(api.__rawPrepare,strictPrepare,'connected-data raw prepare capture regressed');
assert.strictEqual(api.parseCsv,strictParse,'connected-data decoration must not replace strict CSV parsing');
assert.strictEqual(api.__mmConnectedData,true,'connected-data marker could not be attached');

const parsed=api.parseCsv('a,b\n1,2\n');
assert.strictEqual(api.prepare(parsed).rows.length,1,'decorated strict prepare failed');
for(const bad of ['a,b\n"x,2\n','a,a\n1,2\n','a,b\n1,2,3\n','a,b\nx"y,2\n']){
  let failed=false;
  try{api.parseCsv(bad)}catch(_){failed=true}
  assert(failed,`strict CSV parser became permissive after connected-data compatibility decoration: ${JSON.stringify(bad)}`);
}
console.log('v27 strict-intake connected-data compatibility QA passed');
