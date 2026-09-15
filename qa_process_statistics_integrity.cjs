const fs=require('fs'),vm=require('vm'),assert=require('assert');
function baseContext(){
  const noop=()=>{};
  const document={
    documentElement:{},body:{appendChild:noop},head:{appendChild:noop},
    getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,
    createElement:()=>({setAttribute:noop,appendChild:noop,remove:noop,style:{},dataset:{},addEventListener:noop})
  };
  const sandbox={console,document,window:null,MutationObserver:function(){this.observe=noop},requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},clearTimeout:noop,URL:{createObjectURL:()=>'',revokeObjectURL:noop},Blob:function(){},fetch:async()=>({ok:false,status:404}),crypto:{randomUUID:()=> 'test-id'},indexedDB:{},IDBKeyRange:{only:x=>x}};
  sandbox.window=sandbox;return vm.createContext(sandbox);
}
{
  const c=baseContext();vm.runInContext(fs.readFileSync('data-integration-runtime.js','utf8'),c);
  const api=c.MM_CONNECTED_PROCESS_DATA,diag=api.diagnostics;
  assert.strictEqual(diag.num(''),null);assert.strictEqual(diag.num('   '),null);assert.strictEqual(diag.num(null),null);assert.strictEqual(diag.num(undefined),null);
  assert.strictEqual(diag.num(0),0);assert.strictEqual(diag.num('0'),0);assert.strictEqual(diag.num('1.25'),1.25);
  const s=diag.stats(['',null,' ',0,'0',2]);assert.strictEqual(s.n,3);assert.strictEqual(s.mean,2/3);
  assert.strictEqual(diag.referenceScale({n:1,sd:1,q1:0,q3:1}),null);
  assert.strictEqual(diag.referenceScale({n:4,sd:0,q1:5,q3:5}),null);
  assert(diag.referenceScale({n:4,sd:2,q1:1,q3:3})>0);
  const semantics={x:{column:'x',kind:'direct-measurement',role:'actual',blockers:[],unit:'MPa',meaning:'pressure'}};
  let out=api.intelligence.compareWindows([{x:5},{x:5},{x:9},{x:9}],semantics,2,3);
  assert.strictEqual(out.changes[0].normalizedChange,null);assert.strictEqual(out.changes[0].scoreReason,'zero-before-spread');
  out=api.intelligence.compareWindows([{x:4},{x:6},{x:8},{x:10}],semantics,2,3);
  assert(Number.isFinite(out.changes[0].normalizedChange));
  out=api.intelligence.compareWindows([{x:''},{x:6},{x:8},{x:10}],semantics,2,3);
  assert.strictEqual(out.changes[0].normalizedChange,null);assert.strictEqual(out.changes[0].scoreReason,'insufficient-window-observations');
}
{
  const c=baseContext();c.MM_CONNECTED_PROCESS_DATA={};vm.runInContext(fs.readFileSync('process-data-intelligence-ui.js','utf8'),c);
  const d=c.MM_PROCESS_INTELLIGENCE_UI.diagnostics;
  assert.strictEqual(d.finiteNumber(''),null);assert.strictEqual(d.finiteNumber('   '),null);assert.strictEqual(d.finiteNumber(null),null);assert.strictEqual(d.finiteNumber(0),0);assert.strictEqual(d.finiteNumber('0'),0);
  const dataset={semantics:{p:{column:'p',role:'actual',blockers:[],meaning:'Pressure',unit:'MPa',sampling_basis:'per-cycle'},e:{column:'energy_kwh',role:'actual',blockers:[],meaning:'Cycle energy',unit:'kWh',sampling_basis:'per-cycle'},batch:{column:'batch_energy_kwh',role:'actual',blockers:[],meaning:'Batch energy',unit:'kWh',sampling_basis:'batch'}}};
  const cavities=d.cavitySummary([{cavity:'1',p:''},{cavity:'1',p:0},{cavity:'2',p:'2'},{cavity:'2',p:null}],dataset);assert.strictEqual(cavities[0].values.p,0);assert.strictEqual(cavities[1].values.p,2);
  const qa=d.qualityAssociations([
    ...[1,2,3].map(i=>({quality_result:'good',p:5})),...[1,2,3].map(i=>({quality_result:'bad',p:7})),
    ...[1,2,3,4].map(i=>({quality_result:'good',p:''})),...[1,2,3,4].map(i=>({quality_result:'bad',p:null}))
  ],dataset);assert.strictEqual(qa[0].standardizedDifference,null);assert.strictEqual(qa[0].scoreStatus,'unscored-zero-spread');
  let energy=d.energySummary([{energy_kwh:1,quality_result:'good'},{energy_kwh:2,quality_result:'bad'}],dataset);assert.strictEqual(energy.energyPerGoodPart,3);assert.strictEqual(energy.coverageComplete,true);
  energy=d.energySummary([{energy_kwh:1,quality_result:'good'},{energy_kwh:'',quality_result:'good'}],dataset);assert.strictEqual(energy.energyPerGoodPart,null);assert.strictEqual(energy.scoreStatus,'unscored-incomplete-coverage');
  const onlyBatch={semantics:{batch:{column:'batch_energy_kwh',role:'actual',blockers:[],meaning:'Batch energy',unit:'kWh',sampling_basis:'batch'}}};assert.strictEqual(d.energySummary([{batch_energy_kwh:3,quality_result:'good'}],onlyBatch),null);
}
console.log('Process statistics integrity QA passed: blanks stay missing, real zero survives, undefined spread stays unscored, windows require support, and energy-per-good-part requires per-cycle aligned coverage.');
