/* MouldMaster Spatial Twin — explorable training cell 2026.10.08.3 */
(function(){
'use strict';
if(window.MM_SPATIAL_TWIN)return;

const VERSION='2026.10.08.3';
const STORAGE_KEY='mm_spatial_twin_v1';
const MODES=Object.freeze([
  ['system','System','Whole-cell context'],
  ['flow','Flow','Material path and fill progression'],
  ['pressure','Pressure','Relative pressure evidence'],
  ['thermal','Thermal','Relative thermal zones'],
  ['cooling','Cooling','Cooling-circuit evidence'],
  ['quality','Quality','Part and cavity outcomes'],
  ['evidence','Evidence','Known, inferred and unknown']
]);
const PHASES=Object.freeze([
  ['baseline','Known good'],
  ['drift','Drift'],
  ['fault','Fault visible'],
  ['test','Evidence test'],
  ['intervention','Intervention'],
  ['recovery','Recovery']
]);
const HOTSPOTS=Object.freeze({
  material:{label:'Material & dryer',short:'Material',kind:'context',x:11,y:20,
    meaning:'Material condition, lot identity and preparation can change process behaviour without a recorded recipe change.',
    evidence:'Use verified material identity, drying/moisture evidence and change history before assigning a material cause.',
    boundary:'A training highlight is not proof that material condition caused the observed process change.'},
  injection:{label:'Injection unit',short:'Injection',kind:'machine',x:29,y:49,
    meaning:'The injection unit generates and delivers the shot. Screw position, fill time, transfer and pressure signals describe delivery behaviour.',
    evidence:'Compare actual shot-delivery signals against the known-good cycle and preserve units, locations and signal semantics.',
    boundary:'Machine summary values are evidence, not automatic root-cause proof.'},
  mould:{label:'Mould & flow path',short:'Mould',kind:'tool',x:54,y:49,
    meaning:'The mould contains the runner, gates, cavities, vents and local thermal paths that can create cavity-specific behaviour.',
    evidence:'Preserve cavity identity and compare local flow/pressure/thermal evidence with peer cavities and the prior baseline.',
    boundary:'A localised symptom does not prove one specific tooling mechanism until competing explanations are separated.'},
  cavity4:{label:'Cavity 4',short:'Cavity 4',kind:'quality',x:62,y:41,
    meaning:'Cavity-specific evidence can reveal imbalance that is hidden by whole-mould averages.',
    evidence:'Compare cavity-resolved part mass, pressure, temperature or inspection evidence against this cavity’s own baseline and peer cavities.',
    boundary:'A light cavity is an observation. It is not by itself a diagnosis of gate, vent, hot-runner or cooling condition.'},
  cooling:{label:'Cooling circuit',short:'Cooling',kind:'utility',x:55,y:76,
    meaning:'Cooling delivery affects mould temperature distribution, dimensional behaviour, cycle stability and local heat removal.',
    evidence:'Use verified supply/return temperature, flow, circuit identity and mould-surface evidence where available.',
    boundary:'Coolant flow being present does not prove balanced heat transfer or a normal mould thermal state.'},
  sensor:{label:'Cavity-pressure sensor',short:'Sensor',kind:'sensor',x:68,y:54,
    meaning:'A sensor is part of a measurement chain. Identity, zero, calibration, units, filtering and timing all affect interpretation.',
    evidence:'When signals conflict, verify sensor identity, calibration, mapping, units and time alignment before diagnosing the physical process.',
    boundary:'No single signal is automatically authoritative when independent evidence disagrees.'},
  part:{label:'Part & quality',short:'Part',kind:'quality',x:86,y:48,
    meaning:'Part mass, dimensions and visible defects are process outcomes. Their location and repeatability can constrain mechanisms.',
    evidence:'Link quality evidence to cavity, shot, inspection method and time. Compare against a traceable known-good window.',
    boundary:'One acceptable part does not establish stable recovery.'}
});
const CASE_SCENES=Object.freeze({
  'VA-01':{
    cell:'Cell 07',machine:'Electric press · training identity',mould:'4-cavity training mould',material:'Engineering polymer · governed training case',
    focus:['material','injection','mould'],mentor:'The recipe is unchanged, but the process is not. Separate a changed signal from the physical mechanism that could produce it.',
    metrics:{
      baseline:{fill:'1.20 s',transfer:'48 MPa',cavity:'balanced',quality:'mass stable'},
      drift:{fill:'1.28 s',transfer:'51 MPa',cavity:'slight delay',quality:'mass −0.4%'},
      fault:{fill:'1.36 s',transfer:'56 MPa',cavity:'late fill',quality:'mass −0.9%'},
      test:{fill:'compare trace',transfer:'compare actual',cavity:'inspect pressure',quality:'verify mass'},
      intervention:{fill:'controlled test',transfer:'one cause-linked change',cavity:'hold others fixed',quality:'record response'},
      recovery:{fill:'toward 1.20 s',transfer:'toward baseline',cavity:'repeatable',quality:'repeat window'}
    }
  },
  'VA-02':{
    cell:'Cell 07',machine:'Electric press · training identity',mould:'4-cavity training mould',material:'Stable material lot · training case',
    focus:['mould','cavity4','part'],mentor:'Three cavities remain stable. Before changing a global machine setting, ask whether the evidence points to a local mechanism.',
    metrics:{
      baseline:{fill:'stable',transfer:'stable',cavity:'C1–C4 balanced',quality:'all masses aligned'},
      drift:{fill:'machine stable',transfer:'machine stable',cavity:'C4 begins falling',quality:'C4 −0.5%'},
      fault:{fill:'machine stable',transfer:'machine stable',cavity:'C4 low',quality:'C4 −1.2%'},
      test:{fill:'preserve global state',transfer:'compare cavities',cavity:'local evidence',quality:'cavity-resolved'},
      intervention:{fill:'unrelated fixed',transfer:'unrelated fixed',cavity:'local cause-linked',quality:'watch C1–C4'},
      recovery:{fill:'stable',transfer:'stable',cavity:'C4 rejoins peers',quality:'repeat balance'}
    }
  },
  'VA-03':{
    cell:'Cell 04',machine:'Hydraulic press · training identity',mould:'Dimensional training tool',material:'Stable lot · training case',
    focus:['cooling','mould','part'],mentor:'The dimensional shift starts after cooling-circuit work. Intervention timing is evidence; it is not proof. Test the thermal path and the measurement system.',
    metrics:{
      baseline:{fill:'stable',transfer:'stable',cavity:'thermal balance',quality:'dimension centred'},
      drift:{fill:'stable',transfer:'stable',cavity:'surface ΔT appears',quality:'dimension shifts'},
      fault:{fill:'stable',transfer:'stable',cavity:'thermal imbalance',quality:'dimension off baseline'},
      test:{fill:'hold process',transfer:'hold process',cavity:'flow / ΔT / gauge',quality:'repeat measure'},
      intervention:{fill:'unrelated fixed',transfer:'unrelated fixed',cavity:'restore verified circuit',quality:'record'},
      recovery:{fill:'stable',transfer:'stable',cavity:'thermal balance returns',quality:'dimension recentres'}
    }
  },
  'VA-04':{
    cell:'Cell 11',machine:'Training press',mould:'Thick-section study mould',material:'Study material',
    focus:['mould','part','injection'],mentor:'A hold-time study can bound what the observed mass plateau supports. It cannot create a universal optimum or erase geometry and cooling effects.',
    metrics:{
      baseline:{fill:'stable',transfer:'stable',cavity:'gate open',quality:'sink baseline'},
      drift:{fill:'stable',transfer:'stable',cavity:'hold extended',quality:'mass rises'},
      fault:{fill:'stable',transfer:'stable',cavity:'plateau region',quality:'sink improved'},
      test:{fill:'repeat point',transfer:'preserve',cavity:'confirm plateau',quality:'inspect section'},
      intervention:{fill:'preserve',transfer:'preserve',cavity:'bound effective hold',quality:'investigate remainder'},
      recovery:{fill:'repeatable',transfer:'repeatable',cavity:'bounded study',quality:'verified window'}
    }
  },
  'VA-05':{
    cell:'Cell 03',machine:'Training press',mould:'End-of-fill defect tool',material:'Controlled material history',
    focus:['mould','cavity4','part'],mentor:'End-of-fill location supports a trapped-gas hypothesis, but location alone does not eliminate material degradation or local thermal mechanisms.',
    metrics:{
      baseline:{fill:'known good',transfer:'baseline',cavity:'vent path clear',quality:'no mark'},
      drift:{fill:'slightly faster',transfer:'near baseline',cavity:'gas escape uncertain',quality:'intermittent mark'},
      fault:{fill:'fast relative',transfer:'near baseline',cavity:'end-fill event',quality:'burn-like mark'},
      test:{fill:'compare end-fill',transfer:'pressure trace',cavity:'inspect vent path',quality:'map location'},
      intervention:{fill:'unrelated fixed',transfer:'unrelated fixed',cavity:'restore authorised vent',quality:'record'},
      recovery:{fill:'toward baseline',transfer:'stable',cavity:'end-fill normalises',quality:'mark absent repeatably'}
    }
  },
  'VA-06':{
    cell:'Cell 09',machine:'Sensor-equipped training press',mould:'Instrumented training mould',material:'Stable case material',
    focus:['sensor','mould','part'],mentor:'The cavity-pressure trace disagrees with the machine and part evidence. Diagnose the measurement chain before changing the process to match an unverified signal.',
    metrics:{
      baseline:{fill:'coherent',transfer:'coherent',cavity:'trace aligned',quality:'mass aligned'},
      drift:{fill:'machine stable',transfer:'machine stable',cavity:'trace shifts',quality:'mass stable'},
      fault:{fill:'machine stable',transfer:'machine stable',cavity:'large trace shift',quality:'mass stable'},
      test:{fill:'independent check',transfer:'time alignment',cavity:'zero / mapping / units',quality:'independent outcome'},
      intervention:{fill:'process fixed',transfer:'process fixed',cavity:'correct measurement chain',quality:'record'},
      recovery:{fill:'coherent',transfer:'coherent',cavity:'new baseline',quality:'coherent'}
    }
  }
});

const state={caseIndex:0,mode:'system',phase:0,selected:'mould',open:false};
function byId(id){return document.getElementById(id)}
function safeText(v){return String(v??'')}
function esc(value){return safeText(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function cases(){return Array.isArray(window.MM_VIRTUAL_APPRENTICESHIP?.cases)?window.MM_VIRTUAL_APPRENTICESHIP.cases:[]}
function currentCase(){return cases()[state.caseIndex]||cases()[0]||{id:'VA-02',title:'One cavity becomes light',difficulty:'Beginner'}}
function scene(){return CASE_SCENES[currentCase().id]||CASE_SCENES['VA-02']}
function phaseKey(){return PHASES[state.phase]?.[0]||'baseline'}
function modeLabel(){return MODES.find(x=>x[0]===state.mode)?.[1]||'System'}
function scopedStorage(){return window.MM_RUNTIME_V2?.storage||null}
function saveState(){scopedStorage()?.set?.(STORAGE_KEY,{caseIndex:state.caseIndex,mode:state.mode,phase:state.phase,selected:state.selected})}
function restoreState(){
  const row=scopedStorage()?.get?.(STORAGE_KEY,null);if(!row||typeof row!=='object')return;
  if(Number.isInteger(Number(row.caseIndex)))state.caseIndex=Math.max(0,Math.min(cases().length-1,Number(row.caseIndex)));
  if(MODES.some(x=>x[0]===row.mode))state.mode=row.mode;
  if(Number.isInteger(Number(row.phase)))state.phase=Math.max(0,Math.min(PHASES.length-1,Number(row.phase)));
  if(HOTSPOTS[row.selected])state.selected=row.selected;
}
function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el}
function svgMarkup(){
  return `<svg class="mm-st-cell-svg" viewBox="0 0 1200 620" role="img" aria-labelledby="mmStSvgTitle mmStSvgDesc">
    <title id="mmStSvgTitle">Interactive injection moulding training cell</title>
    <desc id="mmStSvgDesc">A conceptual training diagram showing material preparation, injection unit, mould, cavities, cooling circuit, pressure sensor and finished part.</desc>
    <defs>
      <linearGradient id="mmStMachine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#183754"/><stop offset="1" stop-color="#0b1d31"/></linearGradient>
      <linearGradient id="mmStMould" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#35526c"/><stop offset="1" stop-color="#172a3d"/></linearGradient>
      <filter id="mmStGlow"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect class="mm-st-floor" x="40" y="500" width="1080" height="30" rx="15"/>
    <g class="mm-st-layer mm-st-layer-system">
      <rect class="mm-st-machine-base" x="175" y="330" width="705" height="150" rx="28"/>
      <rect class="mm-st-injection-shell" x="185" y="350" width="350" height="92" rx="45"/>
      <path class="mm-st-screw" d="M220 396 C250 365 285 427 318 396 S385 365 418 396 S485 427 515 396"/>
      <path class="mm-st-nozzle" d="M520 382 L625 382 L655 396 L625 410 L520 410 Z"/>
      <rect class="mm-st-mould-half" x="655" y="286" width="105" height="205" rx="18"/>
      <rect class="mm-st-mould-half" x="766" y="286" width="105" height="205" rx="18"/>
      <rect class="mm-st-cavity" x="735" y="326" width="54" height="54" rx="15"/>
      <rect class="mm-st-cavity mm-st-cavity-focus" x="735" y="397" width="54" height="54" rx="15"/>
      <path class="mm-st-runner" d="M650 396 H708 V353 H735 M708 396 V424 H735"/>
      <rect class="mm-st-part" x="955" y="350" width="125" height="115" rx="40"/>
      <path class="mm-st-part-detail" d="M985 383 H1050 M985 407 H1034 M985 431 H1060"/>
      <path class="mm-st-hopper" d="M285 105 H410 L382 245 H313 Z"/>
      <rect class="mm-st-throat" x="330" y="245" width="38" height="102" rx="8"/>
      <rect class="mm-st-tcu" x="630" y="525" width="250" height="70" rx="16"/>
      <path class="mm-st-cool-line" d="M675 525 V478 H692 V304 M835 525 V478 H850 V304"/>
      <circle class="mm-st-sensor" cx="810" cy="354" r="12"/>
      <path class="mm-st-sensor-wire" d="M810 354 C900 300 960 270 1050 285"/>
    </g>
    <g class="mm-st-layer mm-st-layer-flow">
      <path class="mm-st-flow-path" d="M347 180 V320 C347 365 380 396 430 396 H650 H708 V353 H760"/>
      <path class="mm-st-flow-path mm-st-flow-path-secondary" d="M708 396 V424 H760"/>
      <circle class="mm-st-flow-dot" cx="347" cy="185" r="10"/><circle class="mm-st-flow-dot" cx="455" cy="396" r="10"/><circle class="mm-st-flow-dot" cx="682" cy="396" r="10"/><circle class="mm-st-flow-dot" cx="760" cy="424" r="10"/>
    </g>
    <g class="mm-st-layer mm-st-layer-pressure">
      <ellipse class="mm-st-pressure-zone mm-st-pressure-high" cx="570" cy="396" rx="130" ry="85"/>
      <ellipse class="mm-st-pressure-zone mm-st-pressure-mid" cx="742" cy="396" rx="115" ry="125"/>
      <ellipse class="mm-st-pressure-zone mm-st-pressure-low" cx="800" cy="424" rx="75" ry="70"/>
    </g>
    <g class="mm-st-layer mm-st-layer-thermal">
      <rect class="mm-st-thermal-zone mm-st-thermal-hot" x="205" y="345" width="315" height="100" rx="50"/>
      <rect class="mm-st-thermal-zone mm-st-thermal-mid" x="655" y="286" width="216" height="205" rx="20"/>
      <rect class="mm-st-thermal-zone mm-st-thermal-cool" x="945" y="340" width="145" height="135" rx="48"/>
    </g>
    <g class="mm-st-layer mm-st-layer-cooling">
      <path class="mm-st-cooling-active" d="M675 558 V478 H692 V304 M835 558 V478 H850 V304"/>
      <path class="mm-st-cooling-return" d="M704 304 V490 H710 V570 M822 304 V490 H805 V570"/>
      <circle class="mm-st-cool-dot" cx="692" cy="345" r="8"/><circle class="mm-st-cool-dot" cx="850" cy="420" r="8"/>
    </g>
    <g class="mm-st-layer mm-st-layer-quality">
      <circle class="mm-st-quality-ring" cx="762" cy="424" r="42"/>
      <path class="mm-st-quality-link" d="M805 424 C875 424 885 407 955 407"/>
      <circle class="mm-st-quality-marker" cx="1020" cy="407" r="13"/>
    </g>
    <g class="mm-st-layer mm-st-layer-evidence">
      <g transform="translate(300 70)"><rect width="108" height="30" rx="15"/><text x="54" y="20">OBSERVED</text></g>
      <g transform="translate(705 245)"><rect width="102" height="30" rx="15"/><text x="51" y="20">MEASURED</text></g>
      <g transform="translate(915 310)"><rect width="102" height="30" rx="15"/><text x="51" y="20">UNKNOWN</text></g>
    </g>
  </svg>`;
}
function hotspotMarkup(){
  return Object.entries(HOTSPOTS).map(([id,h])=>`<button type="button" class="mm-st-hotspot" data-mm-st-hotspot="${id}" aria-label="Inspect ${esc(h.label)}"><span aria-hidden="true"></span><b>${esc(h.short)}</b></button>`).join('');
}
function modeMarkup(){
  return MODES.map(([id,label,desc])=>`<button type="button" data-mm-st-mode="${id}" aria-pressed="${id===state.mode?'true':'false'}" title="${esc(desc)}">${esc(label)}</button>`).join('');
}
function contextMarkup(){
  const s=scene(),c=currentCase();
  return `<div class="mm-st-context">
    <div><span>Cell</span><b>${esc(s.cell)}</b></div>
    <div><span>Machine</span><b>${esc(s.machine)}</b></div>
    <div><span>Mould</span><b>${esc(s.mould)}</b></div>
    <div><span>Material</span><b>${esc(s.material)}</b></div>
    <div class="mm-st-context-case"><span>Case</span><b>${esc(c.id)} · ${esc(c.title)}</b></div>
  </div>`;
}
function renderHost(){
  const host=byId('mmSpatialTwin');if(!host)return;
  const c=currentCase();
  host.innerHTML=`<div class="mm-st-shell" data-mode="${esc(state.mode)}" data-phase="${esc(phaseKey())}">
    <header class="mm-st-header">
      <div><span class="eyebrow">MouldMaster Spatial Twin</span><h2>Explore the moulding system, not the menu</h2><p>Move through the cell, change evidence views and scrub the case timeline. This is an authored training visualisation, not a validated physics twin.</p></div>
      <button type="button" class="ghost" data-mm-st-close>Return to simulator</button>
    </header>
    ${contextMarkup()}
    <div class="mm-st-casebar">
      <label>Training case<select data-mm-st-case>${cases().map((row,i)=>`<option value="${i}" ${i===state.caseIndex?'selected':''}>${esc(row.id)} · ${esc(row.title)}</option>`).join('')}</select></label>
      <div class="mm-st-modebar" role="group" aria-label="Spatial Twin view mode">${modeMarkup()}</div>
    </div>
    <div class="mm-st-layout">
      <aside class="mm-st-left">
        <span class="eyebrow">System navigator</span>
        <h3>Inspect the cell</h3>
        <p class="muted">Select a physical area. MouldMaster keeps the evidence boundary visible.</p>
        <div class="mm-st-navlist">${Object.entries(HOTSPOTS).map(([id,h])=>`<button type="button" data-mm-st-select="${id}" class="${id===state.selected?'active':''}"><span>${esc(h.short)}</span><small>${esc(h.kind)}</small></button>`).join('')}</div>
      </aside>
      <main class="mm-st-world">
        <div class="mm-st-world-head"><div><span class="eyebrow">${esc(modeLabel())} mode</span><b>${esc(PHASES[state.phase][1])}</b></div><div class="mm-st-world-status"><span>Authored training state</span><span>No machine control</span></div></div>
        <div class="mm-st-stage">${svgMarkup()}<div class="mm-st-hotspots">${hotspotMarkup()}</div></div>
        <div class="mm-st-timeline">
          <div class="mm-st-timeline-labels">${PHASES.map((p,i)=>`<button type="button" data-mm-st-phase="${i}" class="${i===state.phase?'active':''}"><span>${i+1}</span><b>${esc(p[1])}</b></button>`).join('')}</div>
          <input data-mm-st-range type="range" min="0" max="5" step="1" value="${state.phase}" aria-label="Case timeline phase">
        </div>
      </main>
      <aside class="mm-st-right">
        <section class="mm-st-inspector" data-mm-st-inspector></section>
        <section class="mm-st-signals" data-mm-st-signals></section>
        <section class="mm-st-mentor">
          <div class="mm-st-mentor-head"><span class="mm-st-orb" aria-hidden="true">MM</span><div><span class="eyebrow">Context coach</span><b>Reason from the evidence</b></div></div>
          <p>${esc(scene().mentor)}</p>
          <button type="button" class="secondary" data-mm-st-apprentice>Continue this case in Virtual Apprenticeship →</button>
        </section>
      </aside>
    </div>
    <footer class="mm-st-boundary">Safety & evidence boundary: Spatial Twin is an authored educational visualisation. It does not reproduce validated machine physics, prescribe production settings, authorise maintenance/safeguard bypass, or provide automatic machine control.</footer>
  </div>`;
  bind(host);renderInspector();renderSignals();syncWorld();
}
function renderInspector(){
  const h=HOTSPOTS[state.selected]||HOTSPOTS.mould,box=byId('mmSpatialTwin')?.querySelector('[data-mm-st-inspector]');if(!box)return;
  const focus=scene().focus.includes(state.selected);
  box.innerHTML=`<div class="mm-st-inspector-head"><div><span class="eyebrow">${focus?'Case-relevant area':'System area'}</span><h3>${esc(h.label)}</h3></div><span class="pill">${esc(h.kind)}</span></div>
    <div class="mm-st-inspector-block"><b>What it means</b><p>${esc(h.meaning)}</p></div>
    <div class="mm-st-inspector-block"><b>Evidence to seek</b><p>${esc(h.evidence)}</p></div>
    <div class="mm-st-inspector-block mm-st-boundary-card"><b>Boundary</b><p>${esc(h.boundary)}</p></div>`;
}
function renderSignals(){
  const box=byId('mmSpatialTwin')?.querySelector('[data-mm-st-signals]');if(!box)return;
  const m=scene().metrics[phaseKey()]||scene().metrics.baseline;
  const rows=[['Fill',m.fill],['Transfer / delivery',m.transfer],['Cavity evidence',m.cavity],['Quality',m.quality]];
  box.innerHTML=`<div class="mm-st-signals-head"><span class="eyebrow">Evidence at this moment</span><b>${esc(PHASES[state.phase][1])}</b></div>
    <div class="mm-st-signal-grid">${rows.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
    <p class="tiny muted">Values are authored case cues and relative training descriptors unless the case explicitly identifies a measured value.</p>`;
}
function syncWorld(){
  const shell=byId('mmSpatialTwin')?.querySelector('.mm-st-shell');if(!shell)return;
  shell.dataset.mode=state.mode;shell.dataset.phase=phaseKey();
  shell.querySelectorAll('[data-mm-st-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mmStMode===state.mode)));
  shell.querySelectorAll('[data-mm-st-select]').forEach(b=>b.classList.toggle('active',b.dataset.mmStSelect===state.selected));
  shell.querySelectorAll('[data-mm-st-hotspot]').forEach(b=>b.classList.toggle('active',b.dataset.mmStHotspot===state.selected));
  shell.querySelectorAll('[data-mm-st-phase]').forEach(b=>b.classList.toggle('active',Number(b.dataset.mmStPhase)===state.phase));
  const range=shell.querySelector('[data-mm-st-range]');if(range)range.value=String(state.phase);
  const label=shell.querySelector('.mm-st-world-head .eyebrow');if(label)label.textContent=modeLabel()+' mode';
  const phase=shell.querySelector('.mm-st-world-head b');if(phase)phase.textContent=PHASES[state.phase][1];
}
function selectHotspot(id){if(!HOTSPOTS[id])return;state.selected=id;saveState();renderInspector();syncWorld()}
function setMode(id){if(!MODES.some(x=>x[0]===id))return;state.mode=id;saveState();syncWorld()}
function setPhase(value){const n=Math.max(0,Math.min(PHASES.length-1,Number(value)||0));state.phase=n;saveState();renderSignals();syncWorld()}
function setCase(index){
  const list=cases();if(!list.length)return;
  state.caseIndex=Math.max(0,Math.min(list.length-1,Number(index)||0));
  const focus=scene().focus||[];state.selected=focus[0]||'mould';state.phase=0;saveState();renderHost();
}
function bind(host){
  host.querySelector('[data-mm-st-close]')?.addEventListener('click',close);
  host.querySelector('[data-mm-st-case]')?.addEventListener('change',e=>setCase(e.target.value));
  host.querySelectorAll('[data-mm-st-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mmStMode)));
  host.querySelectorAll('[data-mm-st-select]').forEach(b=>b.addEventListener('click',()=>selectHotspot(b.dataset.mmStSelect)));
  host.querySelectorAll('[data-mm-st-hotspot]').forEach(b=>b.addEventListener('click',()=>selectHotspot(b.dataset.mmStHotspot)));
  host.querySelectorAll('[data-mm-st-phase]').forEach(b=>b.addEventListener('click',()=>setPhase(b.dataset.mmStPhase)));
  host.querySelector('[data-mm-st-range]')?.addEventListener('input',e=>setPhase(e.target.value));
  host.querySelector('[data-mm-st-apprentice]')?.addEventListener('click',openApprenticeship);
}
function install(){
  const simulator=byId('simulator');if(!simulator)return false;
  let host=byId('mmSpatialTwin');
  if(!host){host=make('section','mm-spatial-twin');host.id='mmSpatialTwin';host.hidden=true;simulator.insertBefore(host,simulator.firstChild)}
  return true;
}
function open(options={}){
  if(typeof window.switchView==='function')window.switchView('simulator');
  if(!install())return false;
  if(Number.isInteger(Number(options.caseIndex)))state.caseIndex=Math.max(0,Math.min(cases().length-1,Number(options.caseIndex)));
  else restoreState();
  if(options.mode&&MODES.some(x=>x[0]===options.mode))state.mode=options.mode;
  const host=byId('mmSpatialTwin');host.hidden=false;state.open=true;
  document.body?.setAttribute('data-mm-spatial-twin','1');
  renderHost();saveState();
  requestAnimationFrame(()=>{try{host.scrollIntoView({block:'start',behavior:'auto'})}catch(_){}})
  return true;
}
function close(){
  const host=byId('mmSpatialTwin');if(host)host.hidden=true;state.open=false;
  document.body?.removeAttribute('data-mm-spatial-twin');
  try{window.renderSimulator?.()}catch(_){}
}
function openApprenticeship(){
  const index=state.caseIndex;close();
  if(window.MM_VIRTUAL_APPRENTICESHIP?.openCase)return window.MM_VIRTUAL_APPRENTICESHIP.openCase(index);
  if(typeof window.switchView==='function')window.switchView('simulator');
  const target=byId('mmVirtualApprenticeship');target?.scrollIntoView?.({block:'start',behavior:'smooth'});
}
function installWhenReady(){if(install())return;requestAnimationFrame(()=>install())}
const api=Object.freeze({
  version:VERSION,modes:MODES,phases:PHASES,hotspots:HOTSPOTS,scenes:CASE_SCENES,
  open,close,install,setMode,setPhase,setCase,selectHotspot,
  boundary:'Authored spatial learning visualisation only; no validated machine-physics, production-setting, safeguarding, maintenance or machine-control authority.'
});
window.MM_SPATIAL_TWIN=api;
try{window.MM_RUNTIME_V2?.registerModule?.('spatial-twin',{version:VERSION,type:'spatial-learning',scope:'authored-system-evidence-visualisation',authority:'training-only'})}catch(_){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installWhenReady,{once:true});else installWhenReady();
window.addEventListener?.('mm:domains-ready',installWhenReady,{once:true});
})();
