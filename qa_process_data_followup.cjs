'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadRuntime(){
  const source=fs.readFileSync('data-integration-runtime.js','utf8').replace("install().catch(err=>{console.error('MouldMaster connected process-data runtime failed to initialise',err)});",'');
  const sandbox={window:{},console};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'data-integration-runtime.js'});
  return sandbox.window.MM_CONNECTED_PROCESS_DATA;
}
const api=loadRuntime();
assert.equal(api.intelligence.referenceScale({n:1,sd:null,q1:5,q3:5}),null,'single-observation reference must be unscored');
assert.equal(api.intelligence.referenceScale({n:4,sd:0,q1:5,q3:5}),null,'zero-spread reference must be unscored');
assert(api.intelligence.referenceScale({n:3,sd:1,q1:1.5,q3:2.5})>0,'positive-spread reference must remain scoreable');
const sem={x:{column:'x',kind:'direct-measurement',role:'actual',blockers:[],unit:'mm',meaning:'X',canonical_quantity:'x'}};
let result=api.intelligence.compareWindows([{x:1},{x:2}],sem,1,20);
assert.equal(result.changes[0].normalizedChange,null,'one-point windows must remain unscored');
assert.equal(result.changes[0].status,'insufficient');
result=api.intelligence.compareWindows([{x:1},{x:1},{x:1},{x:2},{x:2},{x:2}],sem,3,20);
assert.equal(result.changes[0].normalizedChange,null,'constant reference window must not use epsilon normalization');
result=api.intelligence.compareWindows([{x:1},{x:2},{x:3},{x:2},{x:3},{x:4}],sem,3,20);
assert(Number.isFinite(result.changes[0].normalizedChange)&&result.changes[0].normalizedChange>0,'positive-spread windows must remain scoreable');

function extractFunction(source,name){
  const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`missing function ${name}`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape){escape=false;continue}if(ch==='\\'){escape=true;continue}if(ch===quote)quote=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated function ${name}`);
}
const ui=fs.readFileSync('process-data-intelligence-ui.js','utf8');
const names=['finite','fmt','mean','sd','qualityLabel','resolvedNumeric','cavitySummary','qualityAssociations','energySummary'];
const helpers=new Function(`const PASS=new Set(['pass','ok','good','accept','accepted','yes','true','1']);const FAIL=new Set(['fail','ng','bad','reject','rejected','no','false','0']);${names.map(n=>extractFunction(ui,n)).join('\n')}return {${names.join(',')}};`)();
assert.equal(helpers.finite(''),null,'UI blank must remain missing');
assert.equal(helpers.finite('0'),0,'UI string zero must remain numeric');
assert.equal(helpers.fmt(''),'—','UI blank display must not become zero');
const metricDataset={semantics:{metric:{column:'metric',role:'actual',blockers:[],unit:'mm',meaning:'Metric',sampling_basis:'per-cycle'}}};
const cavities=helpers.cavitySummary([{cavity:'A',metric:''},{cavity:'A',metric:'0'},{cavity:'B',metric:null},{cavity:'B',metric:'10'}],metricDataset);
assert.equal(cavities.find(x=>x.cavity==='A').values.metric,0,'genuine zero must survive cavity summary');
assert.equal(cavities.find(x=>x.cavity==='B').values.metric,10,'blank/null must not depress cavity mean');
const constantRows=[1,1,1,1,1,2,2,2,2,2].map((v,i)=>({quality_result:i<5?'pass':'fail',metric:String(v)}));
const constant=helpers.qualityAssociations(constantRows,metricDataset);
assert.equal(constant[0].standardizedDifference,null,'zero-spread quality groups must remain unscored');
assert.equal(constant[0].status,'insufficient-spread');
const variableRows=[1,2,3,4,5,6,7,8,9,10].map((v,i)=>({quality_result:i<5?'pass':'fail',metric:String(v)}));
assert(Number.isFinite(helpers.qualityAssociations(variableRows,metricDataset)[0].standardizedDifference),'positive-spread quality groups must remain scoreable');
const energyDataset={semantics:{energy:{column:'cycle_energy_wh',role:'actual',blockers:[],unit:'Wh',meaning:'Cycle energy',sampling_basis:'per-cycle'}}};
let energy=helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'',quality_result:'pass'},{cycle_energy_wh:'200',quality_result:'fail'}],energyDataset);
assert.equal(energy.totalKwh,0.3,'blank energy must not be converted to zero');
assert.equal(energy.coverageComplete,false,'missing energy must make coverage incomplete');
assert.equal(energy.energyPerGoodPart,null,'energy/good part must be withheld on incomplete coverage');
energy=helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'200',quality_result:'fail'}],energyDataset);
assert.equal(energy.coverageComplete,true);
assert.equal(energy.energyPerGoodPart,0.2,'complete per-cycle coverage should preserve valid energy/good-part calculation');
const mixedCaseKwhEnergy={semantics:{energy:{column:'cycle_energy_kwh',role:'actual',blockers:[],unit:' KWH ',meaning:'Cycle energy',sampling_basis:'per-cycle'}}};
energy=helpers.energySummary([{cycle_energy_kwh:'0.1',quality_result:'pass'},{cycle_energy_kwh:'0.2',quality_result:'pass'}],mixedCaseKwhEnergy);
assert(Math.abs(energy.totalKwh-0.3)<1e-12,'supported kWh spelling/case must normalize before aggregation');
assert(Math.abs(energy.energyPerGoodPart-0.15)<1e-12,'normalized kWh input must preserve energy/good-part calculation');
const eventEnergy={semantics:{energy:{column:'cycle_energy_wh',role:'actual',blockers:[],unit:'Wh',meaning:'Energy meter',sampling_basis:'event'}}};
assert.equal(helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'}],eventEnergy),null,'non-per-cycle energy must not be treated as cycle energy');

global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}}};
global.document={getElementById(){return null},createElement(){return {}},body:{appendChild(){}},head:{appendChild(){}}};
global.requestAnimationFrame=f=>f();
vm.runInThisContext(fs.readFileSync('process-data-local-intake.js','utf8'),{filename:'process-data-local-intake.js'});
const intake=window.MM_PROCESS_DATA_LOCAL_INTAKE;
assert.equal(intake.parseCsv('a,b\n"x,y",2\n').rows[0].a,'x,y','quoted comma must parse');
assert.equal(intake.parseCsv('a,b\n"x""y",2\n').rows[0].a,'x"y','escaped quote must parse');
assert.equal(intake.parseCsv('a,b\n"x\ny",2\n').rows[0].a,'x\ny','quoted newline must parse');
assert.throws(()=>intake.parseCsv('a,b\n"x,2\n'),/unterminated quoted field/i,'unterminated quote must fail closed');
assert.throws(()=>intake.parseCsv('a,b\n1,2,3\n'),/3 cells; expected 2/i,'extra cells must fail closed');
assert.throws(()=>intake.parseCsv('a,b\n1\n'),/1 cells; expected 2/i,'missing cells must fail closed');
console.log('Process-data follow-up regression passed: underpowered statistics, UI numeric/energy semantics, and CSV structure fail closed.');
