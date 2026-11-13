/* MouldMaster guided process-data diagnostics — 2026.11.08.1 */
(function(){
'use strict';

const VERSION='2026.11.13.3';
const PACK=window.MM_PROCESS_EVIDENCE_DATASETS;
const SOURCES=window.MM_EVIDENCE_SOURCES?.sources||{};
if(!PACK||!Array.isArray(PACK.datasets))throw new Error('process-data-diagnostics.js requires MM_PROCESS_EVIDENCE_DATASETS');

const STORAGE_BASE='mm_process_data_diagnostics_v1';
const GUIDES={
  'check-ring-leakage':{
    signal:'Part mass and cushion move together while peak injection pressure rises and fill time changes only slightly.',
    diagnosis:'Unstable effective shot delivery consistent with non-return-valve/check-ring leakage or wear.',
    next:'Run a controlled shot-delivery repeatability study using cushion, transfer/shot position, part mass and machine inspection evidence before compensating with recipe changes.'
  },
  'cooling-restriction':{
    signal:'Cooling flow falls while return and eject temperatures rise, followed by more warpage.',
    diagnosis:'A local cooling-circuit restriction is creating thermal imbalance and dimensional response.',
    next:'Verify circuit identity, actual flow, supply/return temperatures and local mould/part temperature before changing packing or cycle settings.'
  },
  'gate-seal-study':{
    signal:'Part mass and pressure-time area rise toward a plateau while sink response improves less with additional hold time.',
    diagnosis:'The data are showing a gate-seal/packing-transmission plateau rather than a reason to keep extending hold indefinitely.',
    next:'Repeat the study within the approved process envelope and identify the response plateau with part mass/pressure history and quality confirmation.'
  },
  'material-moisture-pc':{
    signal:'Material moisture and splay rise together while impact response falls even though part mass barely moves.',
    diagnosis:'A material-conditioning interruption is the strongest mechanism, not a global fill or packing problem.',
    next:'Verify actual resin moisture and the grade-specific drying/closed-transfer history before adjusting the moulding process.'
  },
  'hot-runner-zone-drift':{
    signal:'Heater duty rises strongly while the displayed zone temperature barely moves, with local mass/pressure response changing.',
    diagnosis:'A hot-runner thermal/control problem can exist even while the temperature display appears stable.',
    next:'Compare heater output, sensor health, branch/gate response and local cavity evidence using the approved hot-runner troubleshooting procedure.'
  },
  'valve-gate-timing':{
    signal:'One cavity fill signature separates as gate delay changes while the other cavity remains nearly stable.',
    diagnosis:'A local sequential valve-gate timing difference is driving cavity imbalance rather than a global machine recipe change.',
    next:'Verify commanded and actual valve timing plus cavity-specific fill/pressure response before touching global injection settings.'
  },
  'local-flash-tooling':{
    signal:'Flash width and local part mass change while clamp force and cavity peak pressure remain broadly stable.',
    diagnosis:'The pattern favours a local tooling/shutoff condition over insufficient global clamp force.',
    next:'Inspect the exact flash location, seating, support and tool condition using approved safe procedures before applying more process force.'
  },
  'energy-base-load':{
    signal:'Energy per cycle rises materially while cycle time and accepted quality remain almost unchanged.',
    diagnosis:'The increase points toward machine or auxiliary base load rather than a moulding-quality mechanism.',
    next:'Break energy use down by machine/auxiliary state and compare heater, pump/drive and temperature-control demand against a known-good baseline.'
  },
  'measurement-noise':{
    signal:'Measured dimensional spread increases while true dimension and independent process signals remain stable.',
    diagnosis:'Measurement-system variation is masquerading as process drift.',
    next:'Study measurement method, fixture, conditioning time, resolution and repeatability/reproducibility before adjusting the process.'
  },
  'recycled-pp-lot':{
    signal:'MFR changes with the lot while fill pressure/time and warpage move in a consistent rheology-related direction.',
    diagnosis:'A material lot-to-lot rheology shift is changing in-mould behaviour despite a similar nominal material description.',
    next:'Confirm lot identity and material-property evidence, then compare process actuals and part requirements before deciding whether revalidation is needed.'
  },
  'machine-transfer':{
    signal:'The velocity setpoint stays identical but actual peak velocity, transfer position and part mass change on the receiving machine.',
    diagnosis:'Copied setpoints are not reproducing the same physical process response on the second machine.',
    next:'Compare machine capability and actual velocity/pressure/position traces, then transfer on validated process responses rather than screen numbers alone.'
  },
  'cavity-pack-area':{
    signal:'Peak cavity pressure stays nearly unchanged while pressure-time area, hold time and dimension all shift.',
    diagnosis:'A single pressure peak is hiding a meaningful change in the full packing pressure history.',
    next:'Compare the full cavity-pressure curve/area and timing against the known-good baseline before interpreting peak pressure as equivalent.'
  },
  'screw-barrel-wear':{
    signal:'Recovery time, melt temperature and shot mass drift together while back-pressure response also moves.',
    diagnosis:'The coupled plasticising signals point toward screw/barrel or plasticising-system consistency rather than a purely cavity-side defect.',
    next:'Trend recovery and melt/shot evidence, verify material condition, and inspect machine plasticising components under the approved maintenance process.'
  },
  'ejector-drag':{
    signal:'Eject force, surface temperature, drag score and dimension move together during the fault phase.',
    diagnosis:'A local cooling/thermal imbalance is increasing part release load and dimensional response.',
    next:'Verify local cooling flow/temperature and part-release condition before increasing ejection force or rewriting the process.'
  }
};

const DATASETS=PACK.datasets.map(ds=>({...ds,guide:GUIDES[ds.id]})).filter(ds=>ds.guide);
if(DATASETS.length!==PACK.datasets.length)throw new Error('Every process evidence dataset must have a guided diagnostic case');


const MATH_DRILLS=Object.freeze([
  {category:'Units',level:'Starter',question:'A resin batch weighs 3.2 kg. How many grams is that?',choices:['320 g','3,200 g','32,000 g'],answer:1,hint:'There are 1,000 grams in 1 kilogram.',working:'3.2 kg × 1,000 = 3,200 g.'},
  {category:'Units and time',level:'Starter',question:'A cycle takes 1.25 minutes. How many seconds is that?',choices:['65 seconds','75 seconds','125 seconds'],answer:1,hint:'There are 60 seconds in 1 minute.',working:'1.25 min × 60 s/min = 75 s.'},
  {category:'Shot mass',level:'Core',question:'A cold-runner mould has 4 cavities. Each part weighs 13.2 g and the runner weighs 6.8 g. What is the total shot mass?',choices:['52.8 g','59.6 g','60.4 g'],answer:1,hint:'Add the mass of all parts to the runner mass.',working:'4 × 13.2 g + 6.8 g = 59.6 g per shot. A hot-runner system needs its own accounting because the runner is not normally ejected with each shot.'},
  {category:'Material percentages',level:'Core',question:'An 8 kg final blend contains 2.5% additive by total blend mass. How much additive is in the blend?',choices:['20 g','200 g','250 g'],answer:1,hint:'Convert 2.5% to 0.025, then multiply by the total blend mass.',working:'8 kg × 0.025 = 0.2 kg = 200 g additive. The remaining base resin is 7.8 kg. This question defines percentage of the final blend; parts-per-hundred-resin calculations use a different denominator.'},
  {category:'Cycle time and output',level:'Core',question:'A 4-cavity mould runs at a 30 second cycle. What is the theoretical output per hour if every cycle fills all cavities and the machine never stops?',choices:['120 parts/hour','480 parts/hour','720 parts/hour'],answer:1,hint:'First calculate 3,600 seconds per hour ÷ cycle seconds, then multiply by active cavities.',working:'3,600 ÷ 30 = 120 cycles/hour. 120 × 4 cavities = 480 theoretical parts/hour. Real good output is lower when there are stops, short shots or rejects.'},
  {category:'Actual production rate',level:'Core',question:'The shift record shows 360 accepted good parts during a 90 minute scheduled window, including stoppages. What was the average good output per scheduled hour?',choices:['240 parts/hour','360 parts/hour','540 parts/hour'],answer:0,hint:'90 minutes is 1.5 hours. Divide accepted parts by the full scheduled time in hours.',working:'360 ÷ 1.5 h = 240 accepted good parts per scheduled hour. State whether your time window includes downtime; do not compare unlike windows.'},
  {category:'Scrap and yield',level:'Core',question:'There were 15 rejects among 600 total parts produced. What are the reject rate and first-pass yield?',choices:['2.5% reject; 97.5% yield','2.5% reject; 2.5% yield','40% reject; 60% yield'],answer:0,hint:'Reject rate = rejects ÷ total × 100. Yield = accepted good parts ÷ total × 100.',working:'15 ÷ 600 × 100 = 2.5% rejects. If the other 585 parts were accepted as good, 585 ÷ 600 × 100 = 97.5% yield. Keep rework separate until the parts pass the agreed acceptance checks.'},
  {category:'Measurement statistics',level:'Core',question:'Four part-mass readings are 10.1, 10.3, 10.2 and 10.2 g. What are the mean and range?',choices:['Mean 10.2 g; range 0.2 g','Mean 10.2 g; range 0.1 g','Mean 10.1 g; range 0.3 g'],answer:0,hint:'Mean = sum ÷ number of readings. Range = largest − smallest.',working:'(10.1 + 10.3 + 10.2 + 10.2) ÷ 4 = 10.2 g mean. 10.3 − 10.1 = 0.2 g range. Keep cavity identity and measurement method with the readings.'},
  {category:'Percentage change',level:'Core',question:'A stable baseline mean is 64 g. A later mean is 67.2 g. What is the percentage increase from baseline?',choices:['3.2%','5%','105%'],answer:1,hint:'Percentage change = (new − old) ÷ old × 100.',working:'(67.2 − 64) ÷ 64 × 100 = 5%. A change in mean is a signal to investigate; it does not by itself prove the parts are acceptable or identify the cause.'},
  {category:'Shrinkage',level:'Advanced',question:'For one measured direction, a mould dimension is 100.0 mm and the conditioned part dimension is 98.5 mm. What is the simple linear shrinkage estimate?',choices:['1.5%','0.15%','1.5 mm'],answer:0,hint:'Subtract part size from mould size, divide by mould size, then multiply by 100.',working:'(100.0 − 98.5) ÷ 100.0 × 100 = 1.5%. This is a simple direction-specific estimate; material, process, conditioning time and measurement method affect the result.'},
  {category:'Clamp-force estimate',level:'Advanced',question:'A simplified example uses 3,200 mm² projected area and 35 MPa cavity pressure. What separating-force estimate does the calculation give?',choices:['About 11.4 tonne-force','About 112 tonne-force','About 11.4 kN'],answer:0,hint:'1 MPa = 1 N/mm². Calculate pressure × area for newtons, convert to kN, then divide by 9.80665 for tonne-force.',working:'35 × 3,200 = 112,000 N = 112 kN. 112 ÷ 9.80665 ≈ 11.4 tonne-force. This is a simplified training estimate only, not a clamp setting or machine-selection approval. Use total projected area and relevant cavity-pressure evidence; actual clamp requirements need qualified engineering and approved machine, mould and site limits.'},
  {category:'Measurement skill',level:'Shop-floor check',question:'Two operators get different readings from the same part, while the apparent difference is small. What should be checked before changing the moulding process?',choices:['Increase pressure to see which reading is right','Standardise the instrument, fixture, method and part-conditioning time, then check repeatability','Average the readings and discard the originals'],answer:1,hint:'First find out whether the measured difference is real and repeatable.',working:'Check instrument resolution and condition, fixture, method, operator repeatability, part location and conditioning time. Keep the original readings and method with the record before interpreting a process shift.'},
  {category:'Reading data',level:'Shop-floor check',question:'Four cavities have stable measurements near 10.0 mm, but one cavity is repeatedly near 10.4 mm. What is the best first analysis?',choices:['Average all cavities and treat the mould as one population','Separate results by cavity and confirm the measurement method before diagnosing the local difference','Change a global setting until all readings match'],answer:1,hint:'A combined average can hide a repeatable cavity-to-cavity difference.',working:'Keep cavity identity, compare like-for-like measurements and confirm the measurement system. Then investigate the local tool/process evidence. Do not erase a real cavity difference by averaging it away or jump straight to a global setting change.'}
]);
const MATH_FORMULAS=Object.freeze([
  {title:'Units and conversions',body:'Mass: 1 kg = 1,000 g. Time: 1 min = 60 s. Area: 1 cm² = 100 mm². Keep units written beside every number.'},
  {title:'Shot mass',body:'Cold runner: total shot mass = (part mass per cavity × cavities filled) + ejected runner mass. Example: 4 × 13.2 g + 6.8 g = 59.6 g. Account for hot-runner systems separately.'},
  {title:'Blend percentages',body:'For a percentage of the final blend: additive mass = total blend mass × percentage ÷ 100. Example: 8 kg × 2.5% = 0.2 kg additive. Parts per hundred resin (phr) uses resin mass as its base instead.'},
  {title:'Cycle and theoretical output',body:'Cycles/hour = 3,600 ÷ cycle seconds. Theoretical parts/hour = cycles/hour × active cavities. Example: 30 s and 4 cavities = 480 parts/hour before stops, rejects or incomplete fills.'},
  {title:'Actual good output',body:'Average good output = accepted good parts ÷ elapsed time. State whether elapsed time includes stops. Use the same time basis when comparing runs.'},
  {title:'Reject rate and yield',body:'Reject rate (%) = rejects ÷ total produced × 100. First-pass yield (%) = accepted good parts ÷ total produced × 100. Keep rework separate until accepted.'},
  {title:'Mean, range and percentage change',body:'Mean = sum of readings ÷ count. Range = highest − lowest. Percentage change = (new − baseline) ÷ baseline × 100. Separate cavity data and keep the measurement method consistent.'},
  {title:'Linear shrinkage estimate',body:'For one measured direction: shrinkage (%) = (mould dimension − conditioned part dimension) ÷ mould dimension × 100. Use matching units, axis and a defined conditioning/measurement method.'},
  {title:'Clamp-force estimate',body:'Simplified force (kN) = projected area (mm²) × cavity pressure (MPa) ÷ 1,000, because 1 MPa = 1 N/mm². Tonne-force ≈ kN ÷ 9.80665. This teaches the relationship only; it is not a production setting or machine-sizing approval.'},
  {title:'Measurement before adjustment',body:'Check instrument resolution, fixture, method, part location, operator repeatability and conditioning time. Preserve raw values and cavity identity; verify the signal before changing a stable process.'}
]);
let mathIndex=0,mathSelected=null;
function renderMathGuide(){
  mathIndex=0;mathSelected=null;activeId=null;answers=[];hadError=false;
  const host=ensureSection();if(!host)return;
  const cards=MATH_FORMULAS.map(item=>'<article class="pdlab-card card"><h3>'+esc(item.title)+'</h3><p>'+esc(item.body)+'</p></article>').join('');
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-hero card"><div class="eyebrow">Learn, then practise · injection moulding numeracy</div><h2>Maths and shop-floor skills</h2><p>Work through the formulas, then answer short questions and see the worked method. Start with units and production basics, then move to quality and process-engineering estimates.</p><div class="pd-boundary"><b>Training boundary:</b> examples use simple training values. They do not prescribe process settings. Machine, mould, resin, site and quality requirements must come from approved, grade-specific documents and qualified procedures.</div></div>'+
    '<div class="pd-toolbar"><div><h2>Key formulas</h2><p class="muted">Check the units and assumptions before using a formula.</p></div></div>'+
    '<div class="pdlab-grid">'+cards+'</div>'+
    '<div class="pd-panel card"><h3>Try 13 short problems</h3><p class="muted">Ungraded practice with hints and worked answers. Your answers are not added to formal assessments or learner scores.</p><button class="primary" data-pd-math-start>Start the practice set →</button></div>';
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function startMathPractice(){mathIndex=0;mathSelected=null;renderMathDrill()}
function renderMathDrill(){
  const q=MATH_DRILLS[mathIndex];if(!q)return renderMathSummary();
  const host=ensureSection();if(!host)return;
  const choices=q.choices.map((choice,i)=>{
    const selected=mathSelected===i,style=selected?(i===q.answer?' correct':' wrong'):'';
    return '<button class="pd-choice'+style+'" data-pd-math-choice="'+i+'" '+(mathSelected===null?'':'disabled')+'>'+esc(choice)+'</button>';
  }).join('');
  let feedback='';
  if(mathSelected!==null&&mathSelected===q.answer)feedback='<div class="pd-feedback"><b>Correct. Here is the method:</b><br>'+esc(q.working)+'<div class="pd-actions"><button class="primary" data-pd-math-next>'+(mathIndex+1===MATH_DRILLS.length?'Finish practice':'Next problem →')+'</button></div></div>';
  else if(mathSelected!==null)feedback='<div class="pd-feedback bad"><b>Not quite. Try the hint and calculate it again.</b><br>'+esc(q.hint)+'</div><button class="secondary" data-pd-math-retry>Try again</button>';
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Formula guide</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">'+esc(q.category)+'</span><span class="pd-chip">'+esc(q.level)+'</span></div><div class="pd-progress">'+MATH_DRILLS.map((_,i)=>'<span class="'+(i<mathIndex?'done':i===mathIndex?'current':'')+'"></span>').join('')+'</div><div class="pd-stage">Problem '+(mathIndex+1)+' of '+MATH_DRILLS.length+'</div><div class="pd-question">'+esc(q.question)+'</div><p class="tiny muted">Work it out before choosing. All values are for training.</p><div class="pd-choices">'+choices+'</div>'+feedback+'</div>';
  host.dataset.step=String(mathIndex);
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function renderMathSummary(){
  const host=ensureSection();if(!host)return;
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Formula guide</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-summary card"><div class="eyebrow">Practice set complete · ungraded</div><strong>'+MATH_DRILLS.length+' problems completed</strong><h2>Injection moulding maths</h2><p class="muted">Review any formula, retry the practice set, or return to the process-data cases. The clamp-force exercise is a simplified calculation, not a machine setting.</p><div class="pd-actions"><button class="primary" data-pd-math-start>Practise again</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div></div>';
  window.scrollTo?.({top:0,behavior:'smooth'});
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerId(){try{const id=window.db?.activeUser||window.user?.id||'';return id?String(id):null}catch(_){return null}}
function learnerScope(){
  const scope=window.MM_LEARNER_SCOPE;
  if(!scope||typeof scope.tokenFor!=='function'||typeof scope.storageKey!=='function'||typeof scope.migrateStoragePrefix!=='function')throw new Error('process-data-diagnostics.js requires MM_LEARNER_SCOPE');
  return scope
}
function storageKey(){
  const scope=learnerScope(),id=learnerId(),prefix=`${STORAGE_BASE}::`;
  if(!id)throw new Error('process-data-diagnostics.js requires an active learner before persistence');
  scope.registerStoragePrefix?.(prefix);scope.migrateStoragePrefix(prefix,id);
  return scope.storageKey(prefix,scope.tokenFor(id))
}
function readState(){try{const s=JSON.parse(localStorage.getItem(storageKey())||'{}');return s&&typeof s==='object'&&!Array.isArray(s)?s:{}}catch(_){return {}}}
function writeState(s){try{const k=storageKey(),payload=JSON.stringify(s);localStorage.setItem(k,payload);return localStorage.getItem(k)===payload}catch(_){return false}}
function caseState(id){return readState()[id]||{attempts:0,completed:false,bestScore:0}}
function saveCase(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};const saved=writeState(all);if(!saved)window.toast?.('Progress could not be saved on this device.');return saved}

function mean(rows,key){const vals=rows.map(r=>Number(r[key])).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function decimals(key){return /(_pct|Score|_g|_mm|_s|_MPa|_C|_Lmin|_kWh|_kN|_ms|_mm_s|_MPas)/.test(key)?2:2}
function summary(ds){
  const keys=Object.keys(ds.signals||{});const phases=['baseline','fault','recovery'];
  return keys.map(key=>{
    const values=Object.fromEntries(phases.map(p=>[p,mean(ds.rows.filter(r=>r.phase===p),key)]));
    const delta=values.fault-values.baseline;
    const relative=Math.abs(values.baseline)>1e-9?delta/Math.abs(values.baseline):delta;
    return {key,values,delta,relative}
  })
}
function labelSignal(key){return key.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2')}
function format(v,key){return Number(v).toFixed(decimals(key))}
function sourceNames(ds){return (ds.sourceIds||[]).map(id=>SOURCES[id]?.name||id)}

function buildSteps(ds){
  const g=ds.guide;
  return [
    {stage:'Read the pattern',question:'Which interpretation best describes the most useful change across baseline → fault?',correct:g.signal,distractors:[
      'The programmed recipe exists, so the physical process must be unchanged.',
      'One isolated number is enough; the other signals can be ignored.',
      'The recovery phase should be ignored because only the fault phase contains useful evidence.'
    ],feedback:'Use several linked actuals and the time sequence. The strongest pattern is the one that changes coherently with the fault and moves back during recovery.'},
    {stage:'Diagnose',question:'Which mechanism best fits the combined evidence?',correct:g.diagnosis,distractors:[
      'Increase a convenient global setting first and use the result as the diagnosis.',
      'Assume the material is always the cause because polymers vary.',
      'Assume the machine is always the cause because the data came from a moulding machine.'
    ],feedback:'Mechanism-first diagnosis uses location, timing and correlated actuals. It does not choose a cause just because a setting is easy to change.'},
    {stage:'Choose the next evidence',question:'What is the strongest next check before changing production standards?',correct:g.next,distractors:[
      'Change several settings together and keep whichever combination appears to work.',
      'Copy a generic internet setpoint because it provides a faster answer.',
      'Skip verification if one cycle looks acceptable.'
    ],feedback:'The next action should discriminate between plausible causes while preserving safety, traceability and the known-good baseline.'},
    {stage:'Interpret recovery',question:'What does the recovery phase allow you to conclude?',correct:'The return toward baseline strengthens the suspected mechanism because the linked signals recover together, but it still needs engineering confirmation in the real machine/mould/material context.',distractors:[
      'Recovery proves the same numeric settings will work on every machine, mould and resin grade.',
      'Recovery proves no further verification or maintenance evidence is required.',
      'Recovery means the fault phase can be deleted because it is no longer relevant.'
    ],feedback:'Recovery is powerful causal evidence, especially when several signals move back together. It does not turn synthetic training values into universal production limits.'}
  ]
}
function deterministicChoices(step,caseId,stepIndex){
  const arr=[{text:step.correct,correct:true},...step.distractors.map(x=>({text:x,correct:false}))];
  let seed=0;for(const ch of `${caseId}:${stepIndex}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}
function evaluateChoice(caseId,stepIndex,choiceIndex){
  const ds=DATASETS.find(x=>x.id===String(caseId||'')),stepNo=Number(stepIndex),choiceNo=Number(choiceIndex);
  if(!ds||!Number.isInteger(stepNo)||stepNo<0||stepNo>3||!Number.isInteger(choiceNo)||choiceNo<0||choiceNo>3)return {valid:false,correct:false,total:4};
  const steps=buildSteps(ds),choices=deterministicChoices(steps[stepNo],ds.id,stepNo),choice=choices[choiceNo];
  return {valid:!!choice,correct:!!choice?.correct,total:steps.length};
}

let activeId=null,answers=[],hadError=false;
function ensureStyle(){
  if(document.getElementById('mm-process-data-style'))return;
  const s=document.createElement('style');s.id='mm-process-data-style';s.textContent=`
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pdlab-sections{display:grid;gap:14px;margin-top:14px}.pdlab-section{padding:18px}.pdlab-section>h3{margin:6px 0}.pdlab-section>p{line-height:1.55}.pdlab-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.pdlab-real-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pdlab-card{padding:15px;display:flex;flex-direction:column;gap:8px;min-height:185px}.pdlab-card h3{margin:0}.pdlab-card p{color:var(--muted);font-size:12px;line-height:1.5;flex:1}.pdlab-card button{align-self:flex-start}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.pd-grid,.pdlab-grid{grid-template-columns:1fr}.pd-loop{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.pd-stats{grid-template-columns:1fr}.pd-toolbar{align-items:stretch}.pd-toolbar button{width:100%}.pd-panel,.pdlab-section{padding:16px}.pdlab-card button{width:100%}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('processDataLabs');if(section)return section;
  section=document.createElement('section');section.id='processDataLabs';section.className='view hidden';
  (document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function setHeader(t,s){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(p)p.textContent=s}
function returnToPractice(){if(typeof switchView==='function')switchView('scenarios');if(typeof window.MM_PRIMARY_HUBS?.renderPracticeHub==='function')return window.MM_PRIMARY_HUBS.renderPracticeHub();if(typeof switchView==='function')return switchView('scenarios')}
function stats(){const state=readState();let done=0,attempted=0,total=0;for(const ds of DATASETS){const s=state[ds.id];if(s?.completed)done++;if(s?.attempts){attempted++;total+=Number(s.bestScore||0)}}return {done,attempted,avg:attempted?Math.round(total/attempted):0}}

function openHome(){
  ensureStyle();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');window.MM_APP_SHELL?.navigation?.setCustomActive?.('','practice');setHeader('Process data lab','Practise reading process evidence or analyse prepared site data.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})
}
function openMaths(){
  ensureStyle();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');
  window.MM_APP_SHELL?.navigation?.setCustomActive?.('maths','maths');
  setHeader('Maths and shop-floor skills','Learn injection moulding calculations and practise shop-floor numeracy.');
  renderMathGuide();window.scrollTo?.({top:0,behavior:'smooth'})
}
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection();
  host.innerHTML=`<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div>
  <div class="pd-hero card"><div class="eyebrow">Practice · process evidence</div><h2>Start with a guided case</h2><p>Work through a synthetic example first. Use the advanced libraries when you want more cases, or choose local CSV analysis to work with prepared site data.</p><div class="pd-boundary"><b>Training boundary:</b> examples teach evidence reading. They do not set production limits or authorise machine changes. Local CSV preparation and analysis stay on this device.</div></div>
  <div class="pdlab-sections">
    <section class="card pdlab-section"><div class="eyebrow">Start here · synthetic training</div><h3>Guided diagnosis</h3><p>Choose from 14 cases. Each walks through baseline, fault and recovery evidence in four decisions.</p><button class="primary" data-pdlab-guided>Choose a guided case →</button><p class="tiny muted">The values are synthetic and are not machine units or universal limits.</p></section>
    <details class="pd-more-libraries"><summary>Explore more synthetic case libraries · 50 and 200 cases</summary><div class="pdlab-grid"><article class="pdlab-card card"><span class="pd-chip">50 additional cases</span><h3>Evidence deep dive</h3><p>Browse machine, tooling, material, scientific-moulding and quality/sensor datasets.</p><button class="secondary" data-pdlab-50>Browse 50 cases →</button></article><article class="pdlab-card card"><span class="pd-chip">20 passes · 200 cases</span><h3>Advanced evidence atlas</h3><p>Search a broad library of normalized, unitless signal patterns for advanced practice.</p><button class="secondary" data-pdlab-atlas>Browse the 200-case atlas →</button></article></div><p class="tiny muted">The atlas uses each case’s own normalized baseline. Its values are not machine units or universal limits.</p></details>
    <section class="card pdlab-section"><div class="eyebrow">Optional · local analysis</div><h3>Work with prepared site data</h3><p>The intake checks privacy preparation, signal meaning, role, units, sampling and shot sequence before data can be analysed.</p><div class="pdlab-grid pdlab-real-grid"><article class="pdlab-card card"><h3>Prepare a new CSV</h3><p>Review local privacy rules, define the channels and save the prepared dataset on this device.</p><button class="primary" data-pdlab-csv>Prepare a CSV →</button></article><article class="pdlab-card card"><h3>Analyse saved data</h3><p>Compare baseline drift, before/after windows, cavities, quality associations and energy per good part when the data support each view.</p><button class="secondary" data-pdlab-saved>Open saved datasets →</button></article></div><p class="tiny muted">Raw CSV is prepared in-session and is not uploaded. Prepared evidence is stored locally on this device.</p></section>
  </div>`
}
function renderGuidedHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection(),st=stats();
  host.innerHTML=`<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div><div class="pd-hero card"><div class="eyebrow">Process-data practice</div><h2>Guided Data Diagnosis</h2><p>Work through the same evidence pattern experienced process engineers use: establish a baseline, identify what changed, connect signals to a plausible mechanism, choose the next discriminating check, then use recovery evidence to challenge your conclusion.</p><div class="pd-loop"><span>1 Read pattern</span><span>2 Diagnose</span><span>3 Choose evidence</span><span>4 Interpret recovery</span></div><div class="pd-boundary"><b>Training boundary:</b> all values are deterministic synthetic training data. They illustrate signal relationships only and are not universal production setpoints, acceptance limits or substitutes for machine, mould, resin, site or legal requirements.</div></div>
  <div class="pd-stats"><div class="pd-stat card"><span>Cases completed</span><b>${st.done}/${DATASETS.length}</b></div><div class="pd-stat card"><span>Cases attempted</span><b>${st.attempted}</b></div><div class="pd-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div>
  <div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button><div><h2 style="margin:0">Choose a guided case</h2><p class="muted" style="margin:4px 0 0">Each case contains 72 cycles: 24 baseline, 24 fault and 24 recovery.</p></div></div>
  <div class="pd-grid" style="margin-top:12px">${DATASETS.map(cardHtml).join('')}</div>`
}
function cardHtml(ds){const s=caseState(ds.id);return `<article class="pd-card card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">${ds.rows.length} cycles</span><span class="pd-chip">${Object.keys(ds.signals).length} signals</span></div><h3>${esc(ds.title)}</h3><p>${esc(ds.fault)}</p><div class="pd-foot"><span class="${s.completed?'pd-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-pd-start="${esc(ds.id)}">${s.completed?'Practise again':'Start case'}</button></div></article>`}
function tableHtml(ds){return `<div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Signal</th><th>Baseline mean</th><th>Fault mean</th><th>Recovery mean</th><th>Fault Δ</th></tr></thead><tbody>${summary(ds).map(r=>`<tr><td>${esc(labelSignal(r.key))}</td><td>${format(r.values.baseline,r.key)}</td><td>${format(r.values.fault,r.key)}</td><td>${format(r.values.recovery,r.key)}</td><td class="${r.delta>=0?'pd-up':'pd-down'}">${r.delta>=0?'+':''}${format(r.delta,r.key)}</td></tr>`).join('')}</tbody></table></div>`}
function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}
function renderCase(stepIndex){
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return renderGuidedHome();const steps=buildSteps(ds),step=steps[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex),selected=answers[stepIndex],host=ensureSection();
  host.innerHTML=`<div class="pd-case"><div class="pd-toolbar"><button class="ghost" data-pd-home>← Case list</button><button class="ghost" data-pd-practice>← Practice</button></div><div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">synthetic training data</span></div><h2 style="margin:8px 0">${esc(ds.title)}</h2><p class="muted">${esc(ds.fault)}</p><div class="pd-progress">${steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div>
  <div class="pd-panel card"><h3>Evidence board</h3><p class="muted">Compare phase means first. Use the CSV only if you want to inspect the individual 72 cycles.</p>${tableHtml(ds)}<div class="pd-actions" style="margin-top:12px"><button class="ghost" data-pd-csv>Export 72-cycle CSV</button></div></div>
  <div class="pd-panel card"><div class="pd-stage">${esc(step.stage)} · ${stepIndex+1}/4</div><div class="pd-question">${esc(step.question)}</div><div class="pd-choices">${choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(choices[selected],step)}${selected===null?'':`<div class="pd-actions" style="margin-top:12px">${stepIndex<3?'<button class="primary" data-pd-next>Next step</button>':'<button class="primary" data-pd-finish>Finish case</button>'}<button class="ghost" data-pd-retry>Try this question again</button></div>`}</div>
  <div class="pd-panel card"><h3>Evidence sources</h3><div class="pd-source-list">${sourceNames(ds).map(x=>`<div>${esc(x)}</div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">These sources support the mechanism and study method. They do not make the synthetic values production specifications.</p></div></div>`;host.dataset.step=String(stepIndex)
}
function choiceHtml(c,i,selected){const chosen=selected===i,cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="pd-choice${cls}" data-pd-choice="${i}" ${selected===null?'':'disabled'}>${esc(c.text)}</button>`}
function feedbackHtml(choice,step){return `<div class="pd-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good evidence use':'Re-check the pattern'}</b><br>${esc(choice.correct?step.feedback:'Choose the answer that is most directly supported by the linked signals and preserves a controlled diagnostic sequence.')}</div>`}
function exportCsv(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const blob=new Blob([PACK.toCsv(ds.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-${ds.id}-synthetic-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function finishCase(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const steps=buildSteps(ds);let correct=0;for(let i=0;i<steps.length;i++){const choices=deterministicChoices(steps[i],ds.id,i);if(choices[answers[i]]?.correct)correct++}const score=Math.round(correct/steps.length*100),prior=caseState(ds.id),saved=saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();host.innerHTML=`<div class="pd-summary card"><div class="eyebrow">Data case complete${saved?'':' · progress not saved'}</div><strong>${score}% · ${correct}/4 decisions</strong><h2>${esc(ds.title)}</h2><p class="muted">${score===100?'You used the baseline, fault and recovery evidence as one reasoning chain.':'Review the missed step and try again. The goal is to explain why a signal pattern supports one mechanism more strongly than another.'}</p><div class="pd-actions"><button class="primary" data-pd-home>Choose another dataset</button><button class="secondary" data-pd-restart>Practise this case again</button><button class="ghost" data-pd-practice>← Practice</button></div></div>`}
function openLocalIntake(){const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(typeof api?.open==='function')return api.open();window.toast?.('Local CSV analysis is still loading. Try again in a moment.')}
function openSavedData(){const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(typeof api?.openLibrary==='function')return api.openLibrary();window.toast?.('Saved process datasets are still loading. Try again in a moment.')}
function handleClick(e){
  const t=e.target.closest('[data-pdlab-math-open],[data-pdlab-home],[data-pd-math-guide],[data-pd-math-start],[data-pd-math-choice],[data-pd-math-retry],[data-pd-math-next],[data-pdlab-guided],[data-pdlab-50],[data-pdlab-atlas],[data-pdlab-csv],[data-pdlab-saved],[data-pd-start],[data-pd-home],[data-pd-practice],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.hasAttribute('data-pdlab-math-open')||t.hasAttribute('data-pd-math-guide'))return renderMathGuide();
  if(t.hasAttribute('data-pdlab-home'))return openHome();
  if(t.hasAttribute('data-pd-math-start'))return startMathPractice();
  if(t.dataset.pdMathChoice!==undefined){const i=Number(t.dataset.pdMathChoice);if(mathSelected===null&&Number.isInteger(i)&&i>=0&&i<MATH_DRILLS[mathIndex].choices.length){mathSelected=i;return renderMathDrill()}return}
  if(t.hasAttribute('data-pd-math-retry')){mathSelected=null;return renderMathDrill()}
  if(t.hasAttribute('data-pd-math-next')){if(mathSelected!==MATH_DRILLS[mathIndex].answer)return;mathIndex++;mathSelected=null;return mathIndex<MATH_DRILLS.length?renderMathDrill():renderMathSummary()}
  if(t.hasAttribute('data-pdlab-guided'))return renderGuidedHome();
  if(t.hasAttribute('data-pdlab-50')){const api=window.MM_PROCESS_DATA_DEEP_DIVE_50;if(typeof api?.open==='function')return api.open();return window.toast?.('The 50-case library is still loading.')}
  if(t.hasAttribute('data-pdlab-atlas')){const api=window.MM_PROCESS_DATA_20_PASS_ATLAS;if(typeof api?.open==='function')return api.open();return window.toast?.('The evidence atlas is still loading.')}
  if(t.hasAttribute('data-pdlab-csv'))return openLocalIntake();
  if(t.hasAttribute('data-pdlab-saved'))return openSavedData();
  if(t.dataset.pdStart)return openCase(t.dataset.pdStart);
  if(t.hasAttribute('data-pd-home'))return renderGuidedHome();
  if(t.hasAttribute('data-pd-practice'))return returnToPractice();
  if(t.hasAttribute('data-pd-restart'))return openCase(activeId);
  if(t.hasAttribute('data-pd-csv'))return exportCsv();
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const stepIndex=Number(ensureSection().dataset.step||0),step=buildSteps(ds)[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex);
  if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-retry')){answers[stepIndex]=null;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-next'))return renderCase(Math.min(stepIndex+1,3));if(t.hasAttribute('data-pd-finish'))return finishCase()
}
function install(){ensureStyle();const host=ensureSection();if(host&&!host.__mmPdClick){host.addEventListener('click',handleClick);host.__mmPdClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,openMaths,openGuidedCases:renderGuidedHome,evaluateChoice,storage:'MM_LEARNER_SCOPE 128-bit collision-safe learner progress',storagePrefix:`${STORAGE_BASE}::`,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};
window.MM_APP_SHELL?.navigation?.register?.({
  id:'maths',label:'Maths',icon:'∑',description:'Learn and practise injection moulding calculations.',
  order:35,group:'practice',mobileGroup:'maths',mobilePrimary:true,mobileMore:false,
  action:openMaths
});
})();
