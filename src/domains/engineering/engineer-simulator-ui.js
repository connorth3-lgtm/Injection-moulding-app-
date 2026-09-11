/* MouldMaster engineer-friendly simulator UI — 2026.09.11 */
(function(){
'use strict';
if(window.MM_ENGINEER_SIMULATOR_UI)return;
const VERSION='2026.09.11.3';
const baseRender=window.renderSimulator;
const baseUpdate=window.updateSimulator;
if(typeof baseRender!=='function'||typeof baseUpdate!=='function'){
  console.warn('[MouldMaster] Engineer simulator UI unavailable: base simulator is not ready.');
  return;
}
const MODEL_KEYS=['fillAgg','transfer','pack','hold','meltOffset','mouldOffset','cooling','clampMargin'];
const GROUPS=[
  {title:'1 · Fill',copy:'Use measured fill time and V/P transfer fill percentage where available. Relative indices remain available as a fallback training control.',keys:['fillAgg','transfer']},
  {title:'2 · Pack & hold',copy:'Use plastic/cavity pressure in MPa and hold duration in seconds against your validated baseline.',keys:['pack','hold']},
  {title:'3 · Thermal & cooling',copy:'Use °C and seconds. Temperature effects are evaluated as measured deviation from the validated material/tool baseline.',keys:['meltOffset','mouldOffset','cooling']},
  {title:'4 · Process conditions',copy:'Clamp demand can be estimated from projected area and average cavity pressure. Venting and drying controls remain qualitative unless measured data is supplied.',keys:['clampMargin','vent','moistureConfidence']}
];
const VERIFY={
  'Short shot':'Verify fill completion and transfer repeatability. Compare actual cavity or transfer pressure, fill time and part mass with the known-good cycle.',
  'Flash':'Inspect parting-line condition and clamp/tool evidence. Compare cavity-pressure response, clamp utilisation and part mass before changing several settings.',
  'Sink':'Compare part mass versus hold duration and confirm gate-seal behaviour before changing pressure and time together.',
  'Burn':'Check vent condition and location plus evidence of trapped gas. Compare fill time and cavity-pressure response with one controlled change at a time.',
  'Splay':'Verify material-specific drying and handling evidence plus recent material history before adjusting melt conditions.',
  'Warpage':'Compare cooling and ejection symmetry, mould-surface temperature evidence and part dimensions with the known-good condition.'
};
const METRIC_FIELDS=[
  {key:'fillTime',label:'Fill time',unit:'s',min:0.01,step:0.01,help:'Measured fill-stage time.'},
  {key:'vpFill',label:'V/P transfer fill',unit:'%',min:1,max:100,step:0.1,help:'Cavity/shot fill percentage at transfer, using one consistent method.'},
  {key:'packPressure',label:'Pack / hold pressure',unit:'MPa',min:0.1,step:0.1,help:'Use plastic or cavity pressure consistently; do not mix hydraulic and plastic pressure. 1 MPa = 10 bar.'},
  {key:'holdTime',label:'Hold time',unit:'s',min:0.01,step:0.01,help:'Pressure-hold duration.'},
  {key:'meltTemp',label:'Melt temperature',unit:'°C',step:0.1,help:'Prefer measured melt temperature rather than barrel setpoint where possible.'},
  {key:'mouldTemp',label:'Mould surface temperature',unit:'°C',step:0.1,help:'Measured mould/tool surface temperature at a consistent location.'},
  {key:'coolingTime',label:'Cooling time',unit:'s',min:0.01,step:0.01,help:'Cooling stage duration using one cycle definition.'}
];
const FLOW_FIELDS=[
  {id:'mm_flow_volume',label:'Fill-stage melt volume (cm³)',step:'0.01',help:'Volume delivered during the same interval used for fill time.'},
  {id:'mm_flow_mass',label:'Fill-stage polymer mass (g)',step:'0.01',help:'Mass delivered during the same fill interval. Do not substitute a final packed part mass unless the timing basis matches.'},
  {id:'mm_flow_stroke',label:'Injection stroke during fill (mm)',step:'0.01',help:'Screw/ram forward travel during the measured fill interval.'}
];
const state={baseline:{},current:{},lastDerived:null};
function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!=null)el.textContent=text;
  return el;
}
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
function finite(value){if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
function positive(value){const n=finite(value);return n!=null&&n>0?n:null}
function keyForLabel(label){
  const input=label?.querySelector('input[type="range"][data-mm-oninput],input[type="range"][oninput]');
  const code=input?.getAttribute('data-mm-oninput')||input?.getAttribute('oninput')||'';
  return code.match(/simChange\('([^']+)'/)?.[1]||'';
}
function makeIntro(root){
  if(root.querySelector('#mmEngineerSimIntro'))return;
  const legal=root.querySelector('.legal-note');
  const intro=node('div','tip');intro.id='mmEngineerSimIntro';
  const icon=node('span','', '✓');
  const copy=node('div');
  const strong=node('b','', 'Engineer workflow: validated baseline → measured change → model signal → verification');
  const text=document.createTextNode(' Use metric process values where they are measurable. The model normalises them against your own known-good process; it does not prescribe universal settings.');
  copy.append(strong,text);intro.append(icon,copy);
  legal?.insertAdjacentElement('afterend',intro);
}
function makeNumberField(prefix,field){
  const label=node('label');
  const title=node('span','',`${field.label} (${field.unit})`);
  const input=document.createElement('input');
  input.type='number';input.inputMode='decimal';input.id=`mm_${prefix}_${field.key}`;
  if(field.min!=null)input.min=String(field.min);if(field.max!=null)input.max=String(field.max);input.step=String(field.step||'any');
  const stored=state[prefix][field.key];if(Number.isFinite(stored))input.value=String(stored);
  input.addEventListener('input',()=>{const n=finite(input.value);if(n==null)delete state[prefix][field.key];else state[prefix][field.key]=n;renderFlowReadout(deriveFlowMetrics())});
  const help=node('span','tiny muted',field.help);
  label.append(title,input,help);return label;
}
function metricStatus(text,kind){
  const el=document.getElementById('mmSimMetricStatus');if(!el)return;
  el.textContent=text;el.dataset.status=kind||'info';
}
function readMetricFields(prefix){
  METRIC_FIELDS.forEach(field=>{const el=document.getElementById(`mm_${prefix}_${field.key}`);const n=finite(el?.value);if(n==null)delete state[prefix][field.key];else state[prefix][field.key]=n});
}
function copyCurrentToBaseline(){
  readMetricFields('current');
  for(const field of METRIC_FIELDS){const value=state.current[field.key];if(Number.isFinite(value)){state.baseline[field.key]=value;const el=document.getElementById(`mm_baseline_${field.key}`);if(el)el.value=String(value)}}
  metricStatus('Baseline captured from the current measured values. Change only the current column to compare the process against this reference.','ok');
}
function ratioIndex(currentValue,baselineValue,inverse){
  const c=positive(currentValue),b=positive(baselineValue);if(c==null||b==null)return null;
  return 50*(inverse?b/c:c/b);
}
function clampModel(key,value,min,max,notes){
  const limited=clamp(value,min,max);
  if(Math.abs(limited-value)>1e-9)notes.push(`${key} reached the advisory model boundary (${min}…${max}).`);
  return limited;
}
function deriveMetricModel(){
  readMetricFields('baseline');readMetricFields('current');
  const b=state.baseline,c=state.current,missing=[];
  for(const field of METRIC_FIELDS){if(!Number.isFinite(b[field.key])||!Number.isFinite(c[field.key]))missing.push(`${field.label} (${field.unit})`)}
  if(missing.length)return {ok:false,message:`Complete baseline and current values for: ${missing.join(', ')}.`};
  const mustBePositive=['fillTime','vpFill','packPressure','holdTime','coolingTime'];
  const invalid=mustBePositive.filter(key=>!(b[key]>0&&c[key]>0));
  if(invalid.length)return {ok:false,message:`Baseline and current values must be greater than zero for: ${invalid.join(', ')}.`};
  const notes=[];
  const derived={};
  derived.fillAgg=clampModel('fill-time normalisation',ratioIndex(c.fillTime,b.fillTime,true),0,100,notes);
  derived.transfer=clampModel('V/P-transfer normalisation',ratioIndex(c.vpFill,b.vpFill,false),0,100,notes);
  derived.pack=clampModel('pack-pressure normalisation',ratioIndex(c.packPressure,b.packPressure,false),0,100,notes);
  derived.hold=clampModel('hold-time normalisation',ratioIndex(c.holdTime,b.holdTime,false),0,100,notes);
  derived.meltOffset=clampModel('melt-temperature deviation',c.meltTemp-b.meltTemp,-20,20,notes);
  derived.mouldOffset=clampModel('mould-temperature deviation',c.mouldTemp-b.mouldTemp,-20,20,notes);
  derived.cooling=clampModel('cooling-time normalisation',ratioIndex(c.coolingTime,b.coolingTime,false),0,100,notes);
  return {ok:true,derived,notes};
}
function calculateFlowMetrics(fillTime,volume,mass,stroke){
  const t=positive(fillTime);if(t==null)return null;
  const v=positive(volume),m=positive(mass),s=positive(stroke);
  if(v==null&&m==null&&s==null)return null;
  return {
    fillTime:t,
    volumetricFlowCm3S:v==null?null:v/t,
    massFlowGS:m==null?null:m/t,
    averageStrokeSpeedMmS:s==null?null:s/t
  };
}
function deriveFlowMetrics(){
  const fillTime=positive(document.getElementById('mm_current_fillTime')?.value);
  return calculateFlowMetrics(
    fillTime,
    document.getElementById('mm_flow_volume')?.value,
    document.getElementById('mm_flow_mass')?.value,
    document.getElementById('mm_flow_stroke')?.value
  );
}
function renderFlowReadout(result){
  const el=document.getElementById('mmSimFlowReadout');if(!el)return;
  const packPressure=positive(document.getElementById('mm_current_packPressure')?.value);
  const pressureText=packPressure==null?'':` Pack/hold pressure equivalent: ${packPressure.toFixed(2)} MPa = ${(packPressure*10).toFixed(1)} bar.`;
  if(!result){el.textContent=`Enter current fill time plus at least one fill-stage volume, mass or injection-stroke measurement to calculate rates.${pressureText}`;return}
  const parts=[];
  if(result.volumetricFlowCm3S!=null)parts.push(`volumetric fill rate ${result.volumetricFlowCm3S.toFixed(2)} cm³/s`);
  if(result.massFlowGS!=null)parts.push(`average mass delivery rate ${result.massFlowGS.toFixed(2)} g/s`);
  if(result.averageStrokeSpeedMmS!=null)parts.push(`average screw/ram forward speed ${result.averageStrokeSpeedMmS.toFixed(2)} mm/s`);
  el.textContent=`Calculated from entered measurements: ${parts.join('; ')}.${pressureText} Screw/ram speed is not melt-front velocity; no shear rate or viscosity is inferred without flow-path geometry and material rheology.`;
}
function deriveClamp(){
  const area=positive(document.getElementById('mm_clamp_area')?.value);
  const pressure=positive(document.getElementById('mm_clamp_pressure')?.value);
  const capacity=positive(document.getElementById('mm_clamp_capacity')?.value);
  if(area==null||pressure==null||capacity==null)return null;
  const openingForceKN=pressure*area*0.1;
  const utilisationPct=100*openingForceKN/capacity;
  const marginOnRequiredPct=100*(capacity/openingForceKN-1);
  return {area,pressure,capacity,openingForceKN,utilisationPct,marginOnRequiredPct};
}
function renderClampReadout(result){
  const el=document.getElementById('mmSimClampReadout');if(!el)return;
  if(!result){el.textContent='Optional: enter projected area, representative average cavity pressure and machine clamp capacity to calculate a simple opening-force estimate.';return}
  el.textContent=`Calculated estimate: opening force ${result.openingForceKN.toFixed(1)} kN; machine utilisation ${result.utilisationPct.toFixed(1)}%; capacity margin over estimated requirement ${result.marginOnRequiredPct.toFixed(1)}%. Pressure equivalent: ${result.pressure.toFixed(2)} MPa = ${(result.pressure*10).toFixed(1)} bar. Assumption: the entered pressure represents the average pressure acting over the entered projected area.`;
}
function syncModelDisplays(){
  for(const key of MODEL_KEYS){
    const range=document.querySelector(`#simulator input[type="range"][oninput*="simChange('${key}'"],#simulator input[type="range"][data-mm-oninput*="simChange('${key}'"]`);
    if(range&&Number.isFinite(window.simulatorState?.[key]))range.value=String(window.simulatorState[key]);
    const out=document.getElementById(`sim_${key}`);if(out&&typeof window.safeSimLabel==='function'&&Number.isFinite(window.simulatorState?.[key]))out.value=window.safeSimLabel(key,window.simulatorState[key]);
  }
}
function applyMetricModel(){
  const result=deriveMetricModel();if(!result.ok){metricStatus(result.message,'warn');return}
  Object.assign(window.simulatorState,result.derived);
  const clampResult=deriveClamp();
  if(clampResult){
    window.simulatorState.clampMargin=clamp(clampResult.marginOnRequiredPct,0,50);
    if(clampResult.marginOnRequiredPct>50)result.notes.push('Clamp margin exceeds the advisory model ceiling; the physical estimate is shown separately.');
    if(clampResult.marginOnRequiredPct<0)result.notes.push('Estimated opening force exceeds entered machine clamp capacity.');
  }
  state.lastDerived={...result,clamp:clampResult,flow:deriveFlowMetrics()};
  syncModelDisplays();renderClampReadout(clampResult);renderFlowReadout(state.lastDerived.flow);window.updateSimulator();
  const note=result.notes.length?` ${result.notes.join(' ')}`:'';
  metricStatus(`Applied metric process values to the baseline-normalised advisory model.${note}`,'ok');
}
function buildMetricSection(form){
  if(form.querySelector('#mmSimMetricInputs'))return;
  const section=node('section','content-block');section.id='mmSimMetricInputs';
  section.append(node('h3','', 'Measured process values · metric engineering units'));
  section.append(node('p','muted','Enter your validated/known-good baseline and the current process. Ratios are dimensionless; temperatures use direct °C deviation. No universal resin or machine setpoints are supplied.'));
  const grid=node('div','grid2');
  const baseline=node('div','content-block');baseline.append(node('h3','', 'Validated baseline'));
  const bGrid=node('div','form-grid');METRIC_FIELDS.forEach(field=>bGrid.append(makeNumberField('baseline',field)));baseline.append(bGrid);
  const current=node('div','content-block');current.append(node('h3','', 'Current / scenario'));
  const cGrid=node('div','form-grid');METRIC_FIELDS.forEach(field=>cGrid.append(makeNumberField('current',field)));current.append(cGrid);
  grid.append(baseline,current);section.append(grid);
  const flowBox=node('div','content-block');flowBox.append(node('h3','', 'Calculated fill-rate measurements'));
  flowBox.append(node('p','tiny muted','Optional current-cycle calculations using the current fill time above. These are direct rate calculations only; they are not cavity-flow, shear-rate or rheology predictions.'));
  const flowGrid=node('div','form-grid');
  FLOW_FIELDS.forEach(field=>{const label=node('label');const title=node('span','',field.label);const input=document.createElement('input');input.type='number';input.inputMode='decimal';input.id=field.id;input.min='0';input.step=field.step;input.addEventListener('input',()=>renderFlowReadout(deriveFlowMetrics()));label.append(title,input,node('span','tiny muted',field.help));flowGrid.append(label)});
  flowBox.append(flowGrid);const flowReadout=node('p','tiny muted','Enter current fill time plus at least one fill-stage volume, mass or injection-stroke measurement to calculate rates.');flowReadout.id='mmSimFlowReadout';flowReadout.setAttribute('aria-live','polite');flowBox.append(flowReadout);section.append(flowBox);
  const clampBox=node('div','content-block');clampBox.append(node('h3','', 'Clamp-force estimate'));
  clampBox.append(node('p','tiny muted','Optional calculation. F = p̄ × A. Use representative average cavity pressure, not machine hydraulic pressure. Actual distributed cavity pressure should be integrated over projected area for high-fidelity work.'));
  const clampGrid=node('div','form-grid');
  [
    ['mm_clamp_area','Projected area (cm²)','0.1'],
    ['mm_clamp_pressure','Average cavity pressure (MPa)','0.1'],
    ['mm_clamp_capacity','Machine clamp capacity (kN)','1']
  ].forEach(([id,labelText,step])=>{const label=node('label','',labelText);const input=document.createElement('input');input.type='number';input.inputMode='decimal';input.id=id;input.min='0';input.step=step;input.addEventListener('input',()=>renderClampReadout(deriveClamp()));label.append(input);clampGrid.append(label)});
  clampBox.append(clampGrid);const clampReadout=node('p','tiny muted','Optional: enter projected area, representative average cavity pressure and machine clamp capacity to calculate a simple opening-force estimate.');clampReadout.id='mmSimClampReadout';clampReadout.setAttribute('aria-live','polite');clampBox.append(clampReadout);section.append(clampBox);
  const actions=node('div','hero-buttons');
  const capture=node('button','secondary','Capture current as baseline');capture.type='button';capture.addEventListener('click',copyCurrentToBaseline);
  const apply=node('button','primary','Apply metric values to model');apply.type='button';apply.addEventListener('click',applyMetricModel);
  actions.append(capture,apply);section.append(actions);
  const status=node('p','tiny muted','Metric mode is ready. Until values are applied, the relative training controls below continue to drive the model.');status.id='mmSimMetricStatus';status.setAttribute('aria-live','polite');section.append(status);
  const groups=form.querySelector('.mm-engineer-sim-groups');if(groups)form.insertBefore(section,groups);else form.append(section);
}
function groupInputs(form){
  const grid=form.querySelector(':scope > .form-grid');
  if(!grid||grid.dataset.mmEngineerGrouped==='1')return;
  const labels=Array.from(grid.querySelectorAll(':scope > label'));
  const byKey=new Map(labels.map(label=>[keyForLabel(label),label]));
  const details=node('details','content-block');details.classList.add('mm-engineer-sim-groups');
  const summary=node('summary','', 'Advanced model-normalised controls');
  details.append(summary,node('p','muted','These dimensionless controls remain for training and sensitivity work. For engineering scenarios, use the measured metric values above.'));
  for(const group of GROUPS){
    const section=node('section','content-block');
    section.append(node('h3','',group.title),node('p','muted',group.copy));
    const inner=node('div','form-grid');
    for(const key of group.keys){const label=byKey.get(key);if(label)inner.appendChild(label)}
    section.append(inner);details.appendChild(section);
  }
  for(const label of labels)if(label.parentElement===grid)details.appendChild(label);
  grid.replaceWith(details);details.dataset.mmEngineerGrouped='1';
}
function demoteChallenge(form){
  const challenge=form.querySelector(':scope > .sim-challenge');
  if(!challenge||challenge.closest('#mmSimPractice'))return;
  const details=node('details','content-block');details.id='mmSimPractice';
  details.append(node('summary','', 'Optional practice challenge'),challenge);form.prepend(details);
  const eyebrow=challenge.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Practice mode';
}
function movePartVisual(output){
  const visual=output.querySelector(':scope > .part-visual');
  if(!visual||visual.closest('#mmSimPartVisual'))return;
  const details=node('details','content-block');details.id='mmSimPartVisual';
  details.append(node('summary','', 'Illustrative part visual'),node('p','tiny muted','Conceptual only. The visual is not CFD, a cavity-pressure map or a prediction of actual part appearance.'),visual);output.appendChild(details);
}
function engineeringDetail(output){
  if(output.querySelector('#mmSimEngineeringDetail'))return;
  const details=node('details','content-block');details.id='mmSimEngineeringDetail';
  details.append(node('summary','', 'Equations, units and validity'));
  const list=node('ul');
  [
    'Metric process inputs: fill/hold/cooling time in s; temperature in °C; pressure in MPa (bar equivalent shown); projected area in cm²; injection stroke in mm; clamp force in kN; mass in g.',
    'Direct flow calculations: volumetric fill rate Q[cm³/s] = fill-stage volume[cm³] / fill time[s]; mass delivery rate ṁ[g/s] = fill-stage mass[g] / fill time[s]; average screw/ram speed v[mm/s] = fill stroke[mm] / fill time[s].',
    'Average screw/ram speed is not melt-front velocity. Shear rate, viscosity and pressure loss are not inferred without flow-path geometry and material rheology.',
    'Pressure conversion: 1 MPa = 10 bar. Keep hydraulic, plastic and cavity pressure definitions distinct; do not compare them as interchangeable values.',
    'Baseline-normalised ratio: model index = 50 × current/baseline. Fill aggressiveness uses the inverse fill-time ratio: 50 × baseline fill time/current fill time.',
    'Temperature model inputs are current minus baseline in °C and are bounded to the model validity range of ±20 °C.',
    'Clamp opening-force estimate: F[kN] = average cavity pressure[MPa] × projected area[cm²] × 0.1. Distributed cavity pressure is more accurately integrated over projected area.',
    'The 0–100 defect values are advisory training indicators, not probabilities, Cp/Cpk values, specifications or production limits.',
    'Venting condition and moisture-control confidence remain qualitative indices because safe vent dimensions and moisture limits are material/tool specific.'
  ].forEach(text=>list.appendChild(node('li','',text)));
  details.append(list);output.appendChild(details);
}
function enhanceStructure(){
  const root=document.getElementById('simulator');if(!root)return;
  makeIntro(root);
  const form=root.querySelector('.form-card'),output=root.querySelector('.output-panel');
  if(form){
    const eyebrow=form.querySelector(':scope > .eyebrow');if(eyebrow)eyebrow.textContent='Engineer process setup';
    const title=form.querySelector(':scope > h2');if(title)title.textContent='Compare measured process conditions to a validated baseline';
    if(!form.querySelector('#mmSimSetupHelp')){const help=node('p','muted','Default unit system: metric moulding conventions. Use measured values where possible and keep machine-pressure type consistent.');help.id='mmSimSetupHelp';title?.insertAdjacentElement('afterend',help)}
    demoteChallenge(form);groupInputs(form);buildMetricSection(form);
    const buttons=Array.from(form.querySelectorAll('.hero-buttons button'));
    for(const button of buttons){if(button.textContent.trim()==='Balanced example')button.textContent='Load balanced training example';if(button.textContent.trim()==='Unstable example')button.textContent='Load unstable training example'}
  }
  if(output){
    const eyebrow=output.querySelector(':scope > .eyebrow');if(eyebrow)eyebrow.textContent='Engineering readout';
    const title=output.querySelector(':scope > h2');if(title)title.textContent='What the advisory model is flagging';
    if(!output.querySelector('#mmSimOutputScope')){const scope=node('p','muted','Advisory model output. Read the strongest signal first, then confirm it with measured machine, mould, material and part evidence.');scope.id='mmSimOutputScope';title?.insertAdjacentElement('afterend',scope)}
    const risk=output.querySelector('#riskList');if(risk){risk.setAttribute('aria-live','polite');risk.setAttribute('aria-atomic','true')}
    movePartVisual(output);engineeringDetail(output);
  }
}
function band(score){return score<30?'low model signal':score<55?'watch':'strong model signal'}
function enhanceResult(){
  const root=document.getElementById('simulator');if(!root)return;
  const output=root.querySelector('.output-panel'),riskList=root.querySelector('#riskList');if(!output||!riskList)return;
  const rows=Array.from(riskList.querySelectorAll('.risk')).map(row=>{
    const name=row.querySelector(':scope > span')?.textContent?.trim()||'';
    const value=Number.parseFloat(row.querySelector(':scope > b')?.textContent||'');
    if(!name||!Number.isFinite(value))return null;
    const score=Math.max(0,Math.min(100,Math.round(value)));
    const valueEl=row.querySelector(':scope > b');if(valueEl)valueEl.textContent=`${score} / 100`;
    row.setAttribute('aria-label',`${name}: advisory training indicator ${score} out of 100, ${band(score)}`);
    return {name,score};
  }).filter(Boolean);
  if(!rows.length)return;rows.sort((a,b)=>b.score-a.score);const top=rows[0];
  let primary=output.querySelector('#mmSimPrimaryFinding');
  if(!primary){primary=node('div','callout');primary.id='mmSimPrimaryFinding';primary.setAttribute('role','status');primary.setAttribute('aria-live','polite');riskList.insertAdjacentElement('beforebegin',primary)}
  primary.textContent=top.score<30?`Primary finding: no dominant advisory signal. Highest indicator is ${top.name} at ${top.score}/100 (${band(top.score)}).`:`Primary watch: ${top.name} · ${top.score}/100 (${band(top.score)}). This is a model indicator, not a probability.`;
  const advice=root.querySelector('#simAdvice');if(advice)advice.replaceChildren(node('b','', 'What to verify next'),document.createElement('br'),document.createTextNode(VERIFY[top.name]||'Compare the changed condition with the known-good cycle and collect measured evidence before making another change.'));
}
function renderWrapped(){const result=baseRender.apply(this,arguments);enhanceStructure();enhanceResult();return result}
function updateWrapped(){const result=baseUpdate.apply(this,arguments);enhanceResult();return result}
window.renderSimulator=renderWrapped;
window.updateSimulator=updateWrapped;
if(window.MM_RUNTIME_V2?.registerModule)window.MM_RUNTIME_V2.registerModule('engineer-simulator-ui',{version:VERSION,type:'simulator-presentation',scope:'metric-baseline-normalised-advisory'});
if(document.getElementById('simulator')?.children.length){enhanceStructure();enhanceResult()}
window.MM_ENGINEER_SIMULATOR_UI=Object.freeze({version:VERSION,enhance(){enhanceStructure();enhanceResult()},deriveMetricModel,calculateFlowMetrics,deriveFlowMetrics,deriveClamp});
})();
