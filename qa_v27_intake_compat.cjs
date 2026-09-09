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
  const el={
    tagName:String(tag).toUpperCase(),children:[],
    append(...xs){for(const x of xs)this.appendChild(x)},
    appendChild(x){this.children.push(x);if(x&&x.id)nodes.set(x.id,x);return x},
    addEventListener(){},remove(){},setAttribute(k,v){this[k]=v},
    className:'',textContent:'',disabled:false,id:'',innerHTML:'',files:null
  };
  return el;
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

// Reproduce the connected-data decoration contract.
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

// Regression: explicit PASS/FAIL categorical outcomes remain useful.
const quality=api.prepare(api.parseCsv(
  'quality_result,fill_time_s,machine\nPASS,1.20,IMM-A\nFAIL,1.24,IMM-A\n'
));
assert.strictEqual(quality.rows[0].quality_result,'PASS','PASS quality outcome must remain readable');
assert.strictEqual(quality.rows[1].quality_result,'FAIL','FAIL quality outcome must remain readable');
assert.match(quality.rows[0].machine,/^machine-\d+$/,'operational identifiers must remain pseudonymised');

// Privacy regression: a generic "result" column is too broad and must not be treated as quality.
const genericResult=api.prepare(api.parseCsv(
  'result,fill_time_s\nOperator John Smith rejected this,1.20\n'
));
assert(!genericResult.headers.includes('result'),'generic result field must fail closed instead of exporting arbitrary text');

// Privacy regression: non-standard low-cardinality quality labels keep grouping but not raw text.
const nonStandard=api.prepare(api.parseCsv(
  'quality_status,fill_time_s\nCosmetic class alpha,1.20\nCosmetic class alpha,1.21\nCosmetic class beta,1.22\n'
));
assert.match(nonStandard.rows[0].quality_status,/^quality-status-category-\d+$/,'non-standard quality label must be category-aliased');
assert.strictEqual(nonStandard.rows[0].quality_status,nonStandard.rows[1].quality_status,'same raw category must receive the same session-local alias');
assert.notStrictEqual(nonStandard.rows[0].quality_status,nonStandard.rows[2].quality_status,'different raw categories must remain analytically distinct');
assert(!JSON.stringify(nonStandard.rows).includes('Cosmetic class'),'raw non-standard quality text must not survive preparation');
assert(nonStandard.summary.pseudonymisedQualityValues>=3,'pseudonymised quality count must be reported');

// High-cardinality quality text must be dropped rather than exported as a quasi-identifier/free-text channel.
const many=['quality_result,fill_time_s'];
for(let i=0;i<14;i++)many.push(`unique_label_${i},${1+i/100}`);
const highCard=api.prepare(api.parseCsv(many.join('\n')+'\n'));
assert(!highCard.headers.includes('quality_result'),'high-cardinality quality field must be dropped');
assert.strictEqual(highCard.summary.droppedQualityFields,1,'dropped high-cardinality quality field must be reported');
assert.strictEqual(highCard.validation.reviewRequired,true,'unsafe quality drop must request review');

// Spreadsheet-formula regression: source quality text is never exported raw and generic CSV export neutralises formula prefixes.
const formulaQuality=api.prepare(api.parseCsv(
  'quality_result,fill_time_s\n"=HYPERLINK(""https://example.invalid"",""Open"")",1.20\nPASS,1.21\n'
));
const preparedCsv=api.toCsv(formulaQuality);
assert(!preparedCsv.includes('=HYPERLINK('),'formula-like quality label must not survive prepared export');
assert.match(formulaQuality.rows[0].quality_result,/^quality-result-category-\d+$/,'formula-like quality label must be pseudonymised');

const adversarial=api.toCsv({headers:['note','numeric'],rows:[
  {note:'=2+2',numeric:-1.25},
  {note:'+SUM(1,1)',numeric:2},
  {note:'@cmd',numeric:3},
  {note:'-danger',numeric:4},
  {note:'line1\rline2',numeric:5}
]});
assert(adversarial.includes("'=2+2"),'leading = must be neutralised for spreadsheet import');
assert(adversarial.includes("'+SUM(1,1)"),'leading + must be neutralised for spreadsheet import');
assert(adversarial.includes("'@cmd"),'leading @ must be neutralised for spreadsheet import');
assert(adversarial.includes("'-danger"),'leading - text must be neutralised for spreadsheet import');
assert(adversarial.includes('-1.25'),'real numeric negatives must remain numeric');
assert(adversarial.includes('"line1\rline2"'),'bare carriage return must force CSV quoting');

console.log('v27 strict-intake connected-data/privacy/export compatibility QA passed');
