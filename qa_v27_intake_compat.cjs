'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/domains/zz-v27/03-process-data-local-intake.js','utf8');
const integration=fs.readFileSync('data-integration-runtime.js','utf8');
assert(integration.includes('api.__rawPrepare=api.prepare'),'fixture must cover the real connected-data __rawPrepare decorator');
assert(integration.includes('api.prepare=function(parsed,overrides={},meta={})'),'fixture must cover the real connected-data prepare wrapper');
assert(!source.includes('MM_PROCESS_DATA_LOCAL_INTAKE=Object.freeze'),'strict intake API container must remain extensible for connected-data compatibility');

const noop=()=>{};
const document={
  querySelectorAll(){return[]},
  getElementById(){return null},
  createElement(){return {append(){},addEventListener(){},remove(){},setAttribute(){},className:'',textContent:'',disabled:false}},
  body:{appendChild(){}},head:{appendChild(){}}
};
const window={MM_PROCESS_DATA_DIAGNOSTICS:{open:noop},requestAnimationFrame:fn=>fn()};
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
