/* MouldMaster guided process-data diagnostics — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
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

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const s=JSON.parse(localStorage.getItem(storageKey())||'{}');return s&&typeof s==='object'?s:{}}catch(_){return {}}}
function writeState(s){try{localStorage.setItem(storageKey(),JSON.stringify(s))}catch(_){}}
function caseState(id){return readState()[id]||{attempts:0,completed:false,bestScore:0}}
function saveCase(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}

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

let activeId=null,answers=[],hadError=false;
function ensureStyle(){
  if(document.getElementById('mm-process-data-style'))return;
  const s=document.createElement('style');s.id='mm-process-data-style';s.textContent=`
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.pd-grid{grid-template-columns:1fr}.pd-loop{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.pd-stats{grid-template-columns:1fr}.pd-toolbar{align-items:stretch}.pd-toolbar button{width:100%}.pd-panel{padding:16px}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('processDataLabs');if(section)return section;
  section=document.createElement('section');section.id='processDataLabs';section.className='view hidden';
  (document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function ensureNav(){
  const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-process-data]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.mmProcessData='1';b.innerHTML='⌁ <span>Data diagnosis</span>';
  const anchor=nav.querySelector('[data-mm-diagnostic-labs]')||nav.querySelector('button[data-view="scenarios"]');
  if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openHome()})
}
function patchMobileMore(){
  if(window.__MM_PROCESS_DATA_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
  const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{
    const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-process-data-menu]'))return;
    const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmProcessDataMenu='1';b.innerHTML='<span class="icon">⌁</span><b>Data diagnosis</b><small>Read process trends and choose the next evidence check.</small>';
    b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openHome()});grid.appendChild(b)
  });return r};window.__MM_PROCESS_DATA_MORE_PATCH__=true
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function setHeader(t,s){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(p)p.textContent=s}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-process-data]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('[data-mm-diagnostic-labs]')||document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click()}
function stats(){const state=readState();let done=0,attempted=0,total=0;for(const ds of DATASETS){const s=state[ds.id];if(s?.completed)done++;if(s?.attempts){attempted++;total+=Number(s.bestScore||0)}}return {done,attempted,avg:attempted?Math.round(total/attempted):0}}

function openHome(){
  ensureStyle();ensureNav();patchMobileMore();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');markNav();setHeader('Data diagnosis','Use process trends to distinguish mechanisms before changing settings.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})
}
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection(),st=stats();
  host.innerHTML=`<div class="pd-hero card"><div class="eyebrow">Process-data practice</div><h2>Guided Data Diagnosis</h2><p>Work through the same evidence pattern experienced process engineers use: establish a baseline, identify what changed, connect signals to a plausible mechanism, choose the next discriminating check, then use recovery evidence to challenge your conclusion.</p><div class="pd-loop"><span>1 Read pattern</span><span>2 Diagnose</span><span>3 Choose evidence</span><span>4 Interpret recovery</span></div><div class="pd-boundary"><b>Training boundary:</b> all values are deterministic synthetic training data. They illustrate signal relationships only and are not universal production setpoints, acceptance limits or substitutes for machine, mould, resin, site or legal requirements.</div></div>
  <div class="pd-stats"><div class="pd-stat card"><span>Cases completed</span><b>${st.done}/${DATASETS.length}</b></div><div class="pd-stat card"><span>Cases attempted</span><b>${st.attempted}</b></div><div class="pd-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div>
  <div class="pd-toolbar"><div><h2 style="margin:0">Choose a dataset</h2><p class="muted" style="margin:4px 0 0">Each case contains 72 cycles: 24 baseline, 24 fault and 24 recovery.</p></div><button class="ghost" data-pd-back>Back to diagnostic practice</button></div>
  <div class="pd-grid" style="margin-top:12px">${DATASETS.map(cardHtml).join('')}</div>`
}
function cardHtml(ds){const s=caseState(ds.id);return `<article class="pd-card card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">${ds.rows.length} cycles</span><span class="pd-chip">${Object.keys(ds.signals).length} signals</span></div><h3>${esc(ds.title)}</h3><p>${esc(ds.fault)}</p><div class="pd-foot"><span class="${s.completed?'pd-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-pd-start="${esc(ds.id)}">${s.completed?'Practise again':'Start case'}</button></div></article>`}
function tableHtml(ds){return `<div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Signal</th><th>Baseline mean</th><th>Fault mean</th><th>Recovery mean</th><th>Fault Δ</th></tr></thead><tbody>${summary(ds).map(r=>`<tr><td>${esc(labelSignal(r.key))}</td><td>${format(r.values.baseline,r.key)}</td><td>${format(r.values.fault,r.key)}</td><td>${format(r.values.recovery,r.key)}</td><td class="${r.delta>=0?'pd-up':'pd-down'}">${r.delta>=0?'+':''}${format(r.delta,r.key)}</td></tr>`).join('')}</tbody></table></div>`}
function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}
function renderCase(stepIndex){
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return renderHome();const steps=buildSteps(ds),step=steps[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex),selected=answers[stepIndex],host=ensureSection();
  host.innerHTML=`<div class="pd-case"><div class="pd-toolbar"><button class="ghost" data-pd-home>← All data cases</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div><div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">synthetic training data</span></div><h2 style="margin:8px 0">${esc(ds.title)}</h2><p class="muted">${esc(ds.fault)}</p><div class="pd-progress">${steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div>
  <div class="pd-panel card"><h3>Evidence board</h3><p class="muted">Compare phase means first. Use the CSV only if you want to inspect the individual 72 cycles.</p>${tableHtml(ds)}<div class="pd-actions" style="margin-top:12px"><button class="ghost" data-pd-csv>Export 72-cycle CSV</button></div></div>
  <div class="pd-panel card"><div class="pd-stage">${esc(step.stage)} · ${stepIndex+1}/4</div><div class="pd-question">${esc(step.question)}</div><div class="pd-choices">${choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(choices[selected],step)}${selected===null?'':`<div class="pd-actions" style="margin-top:12px">${stepIndex<3?'<button class="primary" data-pd-next>Next step</button>':'<button class="primary" data-pd-finish>Finish case</button>'}<button class="ghost" data-pd-retry>Try this question again</button></div>`}</div>
  <div class="pd-panel card"><h3>Evidence sources</h3><div class="pd-source-list">${sourceNames(ds).map(x=>`<div>${esc(x)}</div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">These sources support the mechanism and study method. They do not make the synthetic values production specifications.</p></div></div>`;host.dataset.step=String(stepIndex)
}
function choiceHtml(c,i,selected){const chosen=selected===i,cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="pd-choice${cls}" data-pd-choice="${i}" ${selected===null?'':'disabled'}>${esc(c.text)}</button>`}
function feedbackHtml(choice,step){return `<div class="pd-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good evidence use':'Re-check the pattern'}</b><br>${esc(choice.correct?step.feedback:'Choose the answer that is most directly supported by the linked signals and preserves a controlled diagnostic sequence.')}</div>`}
function exportCsv(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const blob=new Blob([PACK.toCsv(ds.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-${ds.id}-synthetic-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function finishCase(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const steps=buildSteps(ds);let correct=0;for(let i=0;i<steps.length;i++){const choices=deterministicChoices(steps[i],ds.id,i);if(choices[answers[i]]?.correct)correct++}const score=Math.round(correct/steps.length*100),prior=caseState(ds.id);saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();host.innerHTML=`<div class="pd-summary card"><div class="eyebrow">Data case complete</div><strong>${score}% · ${correct}/4 decisions</strong><h2>${esc(ds.title)}</h2><p class="muted">${score===100?'You used the baseline, fault and recovery evidence as one reasoning chain.':'Review the missed step and try again. The goal is to explain why a signal pattern supports one mechanism more strongly than another.'}</p><div class="pd-actions"><button class="primary" data-pd-home>Choose another dataset</button><button class="secondary" data-pd-restart>Practise this case again</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div></div>`}
function handleClick(e){
  const t=e.target.closest('[data-pd-start],[data-pd-home],[data-pd-back],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.dataset.pdStart)return openCase(t.dataset.pdStart);if(t.hasAttribute('data-pd-home'))return renderHome();if(t.hasAttribute('data-pd-back'))return backToPractice();if(t.hasAttribute('data-pd-restart'))return openCase(activeId);if(t.hasAttribute('data-pd-csv'))return exportCsv();
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const stepIndex=Number(ensureSection().dataset.step||0),step=buildSteps(ds)[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex);
  if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-retry')){answers[stepIndex]=null;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-next'))return renderCase(Math.min(stepIndex+1,3));if(t.hasAttribute('data-pd-finish'))return finishCase()
}
function install(){ensureStyle();const host=ensureSection();ensureNav();patchMobileMore();if(host&&!host.__mmPdClick){host.addEventListener('click',handleClick);host.__mmPdClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe.'};
})();
