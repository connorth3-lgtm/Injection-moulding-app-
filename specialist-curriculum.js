/* MouldMaster specialist curriculum — optional gap-driven extensions — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const STORAGE_BASE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-curriculum.js requires the canonical 120-lesson core');

const LESSONS=[
  {
    id:'S01',title:'Hazardous-energy intervention, isolation & stored energy',level:'Specialist safety',
    gap:'The core teaches safe observation and safeguarding, while regional assessment evidence goes deeper into servicing, guard removal, danger-zone entry and stored energy. This extension connects those ideas without replacing site-specific authorised isolation training.',
    coreLessons:[6,15,100],
    objectives:['Distinguish normal stop, emergency stop, safeguarding and hazardous-energy isolation.','Recognise when servicing or intervention changes the risk state of the moulding cell.','Identify the evidence an authorised isolation procedure must address before work begins.'],
    keypoints:['A stopped machine can still contain electrical, hydraulic, pneumatic, thermal, gravitational or mechanically stored energy.','An interlock or emergency-stop function is not automatically an energy-isolation method.','Isolation requirements depend on the real task, equipment, jurisdiction and approved site procedure.','Training must never encourage bypassing guards, defeating interlocks or entering a danger zone to complete an exercise.'],
    evidenceTask:'For a hypothetical intervention, list the energy forms that could remain after a normal stop, then identify which current machine manual, site isolation procedure and jurisdiction-specific safety source would have to be checked by an authorised person before work.',
    practices:[{type:'standards',label:'Review standards & safety references'},{type:'core',id:'6',label:'Revisit core lesson 6 — Safe start-up observation'}]
  },
  {
    id:'S02',title:'Clamp force, projected area & mould-opening risk',level:'Specialist process engineering',
    gap:'Clamp anatomy and flash are already covered, but the core does not give projected-area reasoning its own focused learning step even though the assessment and defect library use it.',
    coreLessons:[14,18,52,65],
    objectives:['Explain how cavity pressure acting over projected area creates mould-opening force.','Separate local flash/tooling evidence from a genuine global clamp-capability question.','Recognise why machine-, mould- and process-specific methods are required instead of a universal tonnage rule.'],
    keypoints:['Projected area is the cavity and runner area projected onto the parting plane, not part surface area in three dimensions.','Cavity pressure is not perfectly uniform, so simple multiplication is a reasoning model rather than a universal sizing recipe.','Local flash after a tooling event can occur while global clamp force remains stable.','More clamp force is not a substitute for inspecting parting lines, inserts, support, mould condition and the actual pressure history.'],
    evidenceTask:'Sketch the projected footprint of an example multi-cavity tool, identify what pressure evidence would be needed to reason about opening force, and separately list evidence that would favour a local shutoff/tooling cause.',
    practices:[{type:'data',id:'local-flash-tooling',label:'Data diagnosis — Local flash vs global clamp'},{type:'core',id:'14',label:'Revisit core lesson 14 — Clamp unit anatomy'}]
  },
  {
    id:'S03',title:'Plasticising controls: back pressure, screw speed, decompression & recovery',level:'Specialist machine/process',
    gap:'Screw recovery is a core topic, but plasticising controls need a deeper systems view so learners do not treat recovery time, melt condition, mixing and decompression as independent knobs.',
    coreLessons:[11,12,13,25,48],
    objectives:['Relate screw rotation, back pressure, recovery time and melt condition as coupled plasticising responses.','Explain why decompression is a pressure-management function rather than a material-quality cure.','Use recovery and shot-delivery trends to decide whether a machine/plasticising investigation is warranted.'],
    keypoints:['Screw speed and back pressure can change shear work, mixing, recovery time and material thermal history.','A barrel-zone setpoint does not by itself prove actual melt condition.','Decompression can influence nozzle pressure and feed behaviour but should not be used to hide an unstable shot-delivery mechanism.','Trend recovery time, cushion, transfer, shot mass and melt evidence together before making a mechanism claim.'],
    evidenceTask:'Compare a stable and drifting plasticising sequence. Decide which measured actuals would distinguish feed inconsistency, check-ring behaviour, excessive recovery demand and a developing screw/barrel condition.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'data',id:'check-ring-leakage',label:'Data diagnosis — Check-ring leakage'}]
  },
  {
    id:'S04',title:'Reinforced polymers: fibre orientation, anisotropy & conditioning',level:'Specialist materials',
    gap:'The core covers polymer families, orientation and warpage, but reinforced materials need an explicit bridge between fibre direction, anisotropic shrinkage/stiffness and the material conditioning state used for measurement.',
    coreLessons:[21,23,58,104,107],
    objectives:['Explain why reinforced polymers can respond differently along and across flow direction.','Separate pre-mould drying from post-mould conditioning and test-state definition.','Connect gate/flow orientation and thermal balance to directional dimensional behaviour.'],
    keypoints:['Fibre reinforcement can make shrinkage, stiffness and warpage strongly direction-dependent.','Drying before moulding and conditioning after moulding are different operations with different purposes.','A property or dimension without its conditioning state and measurement direction can be misleading.','Global process compensation can hide an orientation or tooling mechanism rather than correct it.'],
    evidenceTask:'Define a dimensional study for a glass-filled polyamide part that records flow direction, conditioning state, measurement timing and local thermal evidence before comparing dimensions.',
    practices:[{type:'material',id:'pa66-gf30-dry-conditioned',label:'Material lab — PA66-GF30 dry vs conditioned'},{type:'core',id:'104',label:'Revisit core lesson 104 — Orientation'}]
  },
  {
    id:'S05',title:'Purging, contamination & material compatibility',level:'Specialist materials/safety',
    gap:'Material changeover and thermal degradation are core topics, but contamination and purge compatibility need a stronger material-specific safety boundary.',
    coreLessons:[27,28,29,30],
    objectives:['Treat purge/changeover decisions as material-specific rather than universal.','Recognise when contamination or excessive thermal history becomes a safety issue as well as a quality issue.','Use identity, history and approved supplier/site procedures before attempting process recovery.'],
    keypoints:['A purge method acceptable for one resin may be ineffective or unsafe for another.','Unknown material identity is evidence of uncertainty, not permission to process through it.','Thermal abuse can create degradation products and pressure hazards; increasing heat is not a universal blockage response.','Contamination evidence should be traced through hoppers, dryers, transfer lines, barrel/nozzle, hot runner and regrind streams as applicable.'],
    evidenceTask:'For a hypothetical mixed-material changeover, identify the material identities and compatibility information that must be verified, the locations where hold-up could remain, and the approved documents that control the clean-out/restart decision.',
    practices:[{type:'material',id:'pom-thermal-safety',label:'Material lab — POM thermal/contamination safety'},{type:'material',id:'abs-thermal-history',label:'Material lab — ABS thermal history'}]
  },
  {
    id:'S06',title:'Internal defects: voids, delamination & hidden failure modes',level:'Specialist troubleshooting',
    gap:'Voids and delamination already exist in the Defect Finder but do not have dedicated core lessons, leaving a gap between visible symptom troubleshooting and internal/sectioned evidence.',
    coreLessons:[53,56,59,67],
    objectives:['Distinguish internal shrinkage voids from surface sink and other internal discontinuities.','Recognise contamination/incompatibility and interlayer bonding as possible delamination mechanisms.','Choose destructive inspection, material identity and packing evidence when surface appearance is insufficient.'],
    keypoints:['A visually acceptable surface does not prove the interior is sound.','Voids in thick sections can reflect center shrinkage, gate effectiveness and cooling gradients.','Delamination can point toward incompatibility, contamination, excessive shear or weak interlayer bonding.','Sectioning, microscopy or other approved inspection methods can be more diagnostic than repeated machine adjustments.'],
    evidenceTask:'Take one hypothetical hidden defect and define the minimum evidence needed to distinguish geometry/packing/cooling from material incompatibility or degradation before changing the validated process.',
    practices:[{type:'defects',label:'Defect Finder — Voids and delamination'},{type:'data',id:'gate-seal-study',label:'Data diagnosis — Gate-seal/packing plateau'}]
  },
  {
    id:'S07',title:'SPC, control charts & reaction plans',level:'Specialist quality engineering',
    gap:'Capability and DOE are strong in the core, but statistical process control needs an explicit lesson on time order, common/special causes and disciplined reaction rather than adjustment to every point.',
    coreLessons:[9,60,71,72,73,74,80],
    objectives:['Explain why time-ordered stability evidence comes before capability interpretation.','Distinguish common-cause variation from signals that warrant investigation under an approved reaction plan.','Avoid tampering with a stable process in response to measurement noise or isolated points.'],
    keypoints:['A process can be within specification and still be unstable; specification limits and control limits answer different questions.','Control charts are decision aids whose chart type, subgrouping and rules must match the process and quality system.','Reaction plans should identify what evidence to check before changing the process.','Measurement-system problems can create apparent process signals that should not be tuned away.'],
    evidenceTask:'Design a simple time-ordered monitoring plan for one critical dimension or process actual: define the subgroup logic, known-good baseline evidence, investigation trigger and first checks in the reaction plan without inventing universal numeric limits.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement noise masquerading as drift'},{type:'core',id:'72',label:'Revisit core lesson 72 — Stability before capability'}]
  },
  {
    id:'S08',title:'Gage R&R, MSA & measurement uncertainty',level:'Specialist measurement',
    gap:'Measurement-system awareness is already a core lesson, but learners need a deeper exercise separating repeatability, reproducibility, resolution, fixture/method and part variation.',
    coreLessons:[60,72,75,76,82],
    objectives:['Separate process variation from variation introduced by the measurement system.','Explain repeatability and reproducibility in practical moulded-part measurement.','Recognise when fixture, conditioning time, operator method or resolution can dominate the conclusion.'],
    keypoints:['A larger measured spread does not prove the moulding process became less stable.','Measurement studies must reflect the real characteristic, method, operators/conditions and expected part range.','Resolution alone does not establish measurement adequacy.','Capability, DOE and validation conclusions inherit the limitations of the measurement system used to generate them.'],
    evidenceTask:'Build a measurement-system investigation for a dimension that suddenly appears noisier: define repeated measurements, operator/method comparisons, fixture and conditioning controls, and an independent process signal to compare against.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement-system variation'},{type:'core',id:'75',label:'Revisit core lesson 75 — Measurement system awareness'}]
  },
  {
    id:'S09',title:'Sequential and valve-gate timing',level:'Specialist tooling/process',
    gap:'Hot runners and balancing are core topics, but sequential valve-gate timing deserves focused treatment because a local timing shift can look like a global fill problem.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Explain why valve timing changes local flow-front interaction and cavity balance.','Compare commanded valve timing with actual actuation and cavity-specific response.','Avoid global recipe changes when the evidence isolates one sequential branch or gate.'],
    keypoints:['One cavity or branch separating while others remain stable is strong localisation evidence.','Commanded timing is not proof that the valve physically actuated at that time.','Cavity pressure, fill signature, actuator/sensor evidence and part pattern should be interpreted together.','Sequential-gating optimisation must remain within approved tool, hot-runner and process limits.'],
    evidenceTask:'For a two-branch sequential-gate example, identify the signals that would distinguish an actual valve-delay fault from a global viscosity or machine-velocity change.',
    practices:[{type:'data',id:'valve-gate-timing',label:'Data diagnosis — Valve-gate timing'},{type:'core',id:'108',label:'Revisit core lesson 108 — Hot-runner balancing'}]
  },
  {
    id:'S10',title:'Screw/barrel wear & plasticising-system health',level:'Specialist maintenance/process',
    gap:'Maintenance-process interaction is a core expert lesson, but screw/barrel wear deserves its own diagnostic bridge because gradual wear often appears first as coupled recovery, melt and shot-delivery drift.',
    coreLessons:[11,12,13,48,113,118],
    objectives:['Recognise coupled process signatures that justify a plasticising-system investigation.','Separate gradual machine wear from material-lot, feed and cavity-side causes.','Use trend and maintenance evidence rather than compensating indefinitely with recipe changes.'],
    keypoints:['Wear can alter conveying, melting, recovery and repeatability before it becomes visually obvious.','Recovery time alone is not enough; combine it with melt, shot, back-pressure and material evidence.','A changed process response after maintenance should be compared with the known-good baseline.','Confirmed mechanical deterioration should be corrected under the approved maintenance process before redefining the validated moulding window.'],
    evidenceTask:'Create a trend review that uses recovery time, melt/shot evidence, back-pressure response, material history and maintenance findings to decide whether a machine inspection is warranted.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'core',id:'118',label:'Revisit core lesson 118 — Maintenance-process interaction'}]
  },
  {
    id:'S11',title:'Ejector/tool condition, drag & release evidence',level:'Specialist tooling',
    gap:'Ejection is taught in the core, but drag, eject force and local thermal/tool condition need a deeper diagnostic link so learners do not simply increase ejection force or speed.',
    coreLessons:[35,36,37,49,58,106],
    objectives:['Relate ejection load to local temperature, shrinkage, draft, texture and tool condition.','Use eject-force and thermal trends as evidence rather than treating release as a purely mechanical setting.','Separate a local release problem from a global cycle or packing problem.'],
    keypoints:['Higher eject force is a symptom measurement as well as a machine setting concern.','Local cooling imbalance can change dimensions and release load together.','Draft, texture, surface/tool condition and deformation can all affect drag.','Increasing ejection force without identifying the mechanism can damage parts or tooling and conceal the real condition.'],
    evidenceTask:'Compare baseline and high-drag cycles using eject force, part/eject temperature, dimension, surface evidence and cooling-flow data. State which evidence would send the investigation toward cooling versus tooling/release geometry.',
    practices:[{type:'data',id:'ejector-drag',label:'Data diagnosis — Ejector drag'},{type:'core',id:'37',label:'Revisit core lesson 37 — Ejection'}]
  },
  {
    id:'S12',title:'Sustainable processing: energy base load & recycled-feedstock variability',level:'Specialist sustainability/process',
    gap:'Cycle-time economics and scrap reduction are in the expert core, but energy efficiency and recycled-material variability need explicit evidence-based treatment so sustainability changes are not separated from quality and validation.',
    coreLessons:[29,63,71,80,112,116,117],
    objectives:['Separate energy consumed by productive moulding work from machine/auxiliary base load.','Treat recycled-feedstock lot variation as a material/process input that may require verification or revalidation.','Evaluate sustainability changes against quality, robustness, traceability and approved material requirements rather than one metric alone.'],
    keypoints:['Energy per cycle can rise while cycle time and accepted quality remain stable, pointing toward machine or auxiliary demand.','Nominally similar recycled feedstock can show meaningful rheology and lot variation.','Lower energy or higher recycled content is not a valid improvement if quality, material compliance or process robustness is lost.','Track material identity, lot/property evidence, process actuals, reject/scrap response and energy together.'],
    evidenceTask:'Build a before/after sustainability review that includes energy per accepted part, cycle/quality stability, material lot/property evidence and the change-control decision needed before adopting a new normal condition.',
    practices:[{type:'data',id:'energy-base-load',label:'Data diagnosis — Energy base load'},{type:'data',id:'recycled-pp-lot',label:'Data diagnosis — Recycled PP lot variability'},{type:'material',id:'recycled-pp-lot-rheology',label:'Material lab — Recycled PP rheology'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeState(x){try{localStorage.setItem(storageKey(),JSON.stringify(x))}catch(_){}}
function isDone(id){return !!readState()[id]}
function setDone(id,done){const s=readState();if(done)s[id]=true;else delete s[id];writeState(s);decorateDashboard(true)}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}

function ensureStyle(){
  if(document.getElementById('mm-specialist-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-style';s.textContent=`
.mm-specialist-strip{margin-top:16px;padding:18px;border:1px solid #315171;border-radius:14px;background:linear-gradient(135deg,#10243a,#0d1c30)}.mm-specialist-strip h3{margin:4px 0 8px}.mm-specialist-strip p{color:var(--muted,#a9bdd6);line-height:1.55;margin:0 0 12px}.mm-specialist-meta{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0 13px}.mm-specialist-meta span{font-size:11px;border:1px solid #3a5a79;border-radius:999px;padding:5px 8px;color:#bfd2e8}.mm-specialist-modal{position:fixed;inset:0;z-index:10050;background:rgba(4,10,20,.82);display:grid;place-items:center;padding:18px}.mm-specialist-modal.hidden{display:none}.mm-specialist-dialog{width:min(1080px,96vw);max-height:92vh;overflow:auto;border:1px solid #385a7c;border-radius:18px;background:#0c182a;color:#edf5ff;box-shadow:0 26px 70px rgba(0,0,0,.5)}.mm-specialist-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:19px 21px;background:#101f33;border-bottom:1px solid #28435f}.mm-specialist-head h2{margin:4px 0 0}.mm-specialist-body{padding:20px}.mm-specialist-boundary{padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;line-height:1.55;font-size:12px;margin:0 0 16px}.mm-specialist-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mm-specialist-card{padding:17px;border:1px solid #2e4a68;border-radius:13px;background:#102037}.mm-specialist-card h3{margin:7px 0}.mm-specialist-card p{font-size:13px;color:#b8cbe0;line-height:1.55}.mm-specialist-card .done{color:#79e3b2;font-weight:800}.mm-specialist-eyebrow{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#79aef2;font-weight:800}.mm-specialist-section{padding:15px;border:1px solid #294661;border-radius:12px;background:#0f1d30;margin:12px 0}.mm-specialist-section h3{margin-top:0}.mm-specialist-section ul{margin:8px 0 0;padding-left:20px}.mm-specialist-section li{margin:7px 0;line-height:1.5;color:#d6e2ef}.mm-specialist-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mm-specialist-actions button{min-height:38px}.mm-specialist-core{display:flex;gap:6px;flex-wrap:wrap}.mm-specialist-core button{font-size:11px}.mm-specialist-evidence{border-left:4px solid #55d6be;padding-left:14px}.mm-specialist-done-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid #29445f}@media(max-width:760px){.mm-specialist-grid{grid-template-columns:1fr}.mm-specialist-modal{padding:0}.mm-specialist-dialog{width:100vw;max-height:100vh;height:100vh;border-radius:0}.mm-specialist-head{padding:15px}.mm-specialist-body{padding:15px}}
`;
  document.head.appendChild(s)
}
function ensureModal(){
  ensureStyle();let m=document.getElementById('mmSpecialistModal');if(m)return m;
  m=document.createElement('div');m.id='mmSpecialistModal';m.className='mm-specialist-modal hidden';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Specialist curriculum extensions');
  m.innerHTML='<div class="mm-specialist-dialog"><div class="mm-specialist-head"><div><span class="mm-specialist-eyebrow">Optional specialist learning</span><h2 id="mmSpecialistTitle">Specialist extensions</h2></div><button class="ghost" type="button" onclick="mmSpecialistClose()" aria-label="Close specialist curriculum">Close ×</button></div><div class="mm-specialist-body" id="mmSpecialistBody"></div></div>';
  m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m
}
function open(){const m=ensureModal();m.classList.remove('hidden');renderCatalog();m.querySelector('button')?.focus()}
function close(){document.getElementById('mmSpecialistModal')?.classList.add('hidden')}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Verify the exact resin, machine, mould, approved site procedure and applicable safety requirements before real work.</div>'}
function renderCatalog(){
  const body=document.getElementById('mmSpecialistBody');const title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;
  title.textContent='Specialist extensions';const done=LESSONS.filter(x=>isDone(x.id)).length;
  body.innerHTML=boundary()+`<div class="mm-specialist-meta"><span>120 core lessons unchanged</span><span>${LESSONS.length} optional extensions</span><span>${done}/${LESSONS.length} completed locally</span></div><div class="mm-specialist-grid">${LESSONS.map(l=>`<article class="mm-specialist-card"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p>${isDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" onclick="mmSpecialistLesson('${l.id}')">Open extension →</button></div></article>`).join('')}</div>`
}
function renderLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;const m=ensureModal();m.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');title.textContent=l.title;
  const coreButtons=l.coreLessons.map(id=>{const x=coreLesson(id);return x?`<button class="ghost" type="button" onclick="mmSpecialistPractice('core','${id}')">${id}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use existing MouldMaster formative practice to test the mechanism with evidence.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${isDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" onclick="mmSpecialistToggle('${l.id}')">${isDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`
}
function practice(type,id){
  close();
  if(type==='core'){
    const n=Number(id);if(typeof openLesson==='function')return openLesson(n);try{currentLesson=n;if(typeof switchView==='function')switchView('lesson')}catch(_){}return
  }
  if(type==='defects'){if(typeof switchView==='function')switchView('defects');return}
  if(type==='standards'){if(typeof switchView==='function')switchView('standards');return}
  if(type==='data'&&window.MM_PROCESS_DATA_DIAGNOSTICS){window.MM_PROCESS_DATA_DIAGNOSTICS.open();setTimeout(()=>document.querySelector(`[data-pd-start="${id}"]`)?.click(),0);return}
  if(type==='material'&&window.MM_MATERIAL_BEHAVIOUR_LABS){window.MM_MATERIAL_BEHAVIOUR_LABS.open();setTimeout(()=>document.querySelector(`[data-ml-start="${id}"]`)?.click(),0);return}
}
function toggle(id){setDone(id,!isDone(id));renderLesson(id)}
function decorateDashboard(force){
  ensureStyle();const root=document.getElementById('dashboard');if(!root)return;const old=root.querySelector('#mmSpecialistDashboard');if(old){if(!force)return;old.remove()}
  const done=LESSONS.filter(x=>isDone(x.id)).length;
  root.insertAdjacentHTML('beforeend',`<section class="mm-specialist-strip" id="mmSpecialistDashboard" aria-label="Specialist curriculum extensions"><span class="mm-specialist-eyebrow">Go deeper where the core stops</span><h3>Specialist extensions</h3><p>The 120-lesson core remains the complete main pathway. These ${LESSONS.length} optional lessons close specific depth gaps in safety intervention, machine health, materials, measurement, tooling and sustainability—and each links back to existing evidence practice.</p><div class="mm-specialist-meta"><span>${LESSONS.length} optional lessons</span><span>${done} completed locally</span><span>No certificate requirement</span></div><button class="secondary" type="button" onclick="mmSpecialistOpen()">Explore specialist extensions →</button></section>`)
}

const originalRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(originalRenderDashboard){renderDashboard=function(){originalRenderDashboard();decorateDashboard(false)}}
window.mmSpecialistOpen=open;window.mmSpecialistClose=close;window.mmSpecialistLesson=renderLesson;window.mmSpecialistPractice=practice;window.mmSpecialistToggle=toggle;
window.MM_SPECIALIST_CURRICULUM={version:VERSION,coreLessonCount:120,optional:true,lessons:LESSONS.map(l=>({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p}))})),open,scope:'Optional formative specialist learning; canonical 120-lesson completion path and formal assessment/certificate rules are unchanged; no production recipe.'};
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
if(typeof currentView==='string'&&currentView==='dashboard')decorateDashboard(false);
})();
