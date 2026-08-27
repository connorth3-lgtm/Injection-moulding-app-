/* MouldMaster specialist evidence-gap extension — optional formative learning — 2026.08.28.2 */
(function(){
'use strict';
if(window.MM_SPECIALIST_EVIDENCE_GAPS)return;

const VERSION='2026.08.28.2';
const STORAGE_BASE='mm_specialist_evidence_gaps_v1';
const BASE_STORAGE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
const BASE=window.MM_SPECIALIST_CURRICULUM;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-evidence-gap-extension.js requires the canonical 120-lesson core');
if(!BASE||!Array.isArray(BASE.lessons)||BASE.lessons.length!==12)throw new Error('specialist-evidence-gap-extension.js requires the established 12 specialist extensions');

const LESSONS=[
  {
    id:'S13',title:'Residual stress, frozen-in orientation & birefringence',level:'Specialist materials/quality',
    evidenceArea:'residual-stress-birefringence',evidenceStatus:'Provisional',
    gap:'Warpage and orientation are already covered, but residual stress needs a separate evidence path because a dimensionally acceptable part can still contain frozen-in stress that later appears as optical distortion, cracking, creep or dimensional movement.',
    coreLessons:[23,49,58,59,104],
    objectives:['Explain how flow, pressure and cooling history can leave non-uniform residual stress.','Distinguish visible warpage from hidden stress or optical anisotropy.','Choose physical evidence such as polarised-light response, controlled annealing comparison or dimensional relaxation before claiming a residual-stress mechanism.'],
    keypoints:['Residual stress is a history-dependent material state, not a single machine setting.','Birefringence can reveal molecular orientation or stress in suitable transparent polymers, but interpretation depends on material, thickness and optical method.','A change in mould temperature, fill/pack history or cooling balance can change residual stress without producing an immediate reject.','Simulation or appearance alone is not proof of the internal stress field.'],
    evidenceTask:'Compare two hypothetical transparent mouldings with similar dimensions but different optical stress patterns. Define the process-history, thermal, optical and post-conditioning evidence needed to decide whether the difference is consistent with frozen-in stress rather than surface marking or measurement error.',
    practices:[{type:'core',id:'58',label:'Revisit core learning — warpage mechanisms'},{type:'defects',label:'Defect Finder — dimensional and surface evidence'}]
  },
  {
    id:'S14',title:'Weld-line structural strength versus appearance',level:'Specialist defect mechanics',
    evidenceArea:'weld-line-mechanical-strength',evidenceStatus:'Provisional',
    gap:'Weld lines are easy to judge visually, but a faint line can still be structurally important and a visible line can be acceptable. This extension separates appearance from local mechanical integrity.',
    coreLessons:[31,53,55,67,104],
    objectives:['Explain why flow-front meeting conditions can affect molecular/fibre interdiffusion and local strength.','Separate cosmetic visibility from structural performance.','Define a test plan that compares weld-line location, loading direction and matched non-weld specimens.'],
    keypoints:['Weld-line strength depends on material, temperature history, pressure, contamination, venting, fibre orientation and geometry.','Visual severity is not a universal proxy for tensile, impact or fatigue strength.','A weld line positioned in a high-stress region can matter more than a more visible line elsewhere.','Local process changes should be checked against the validated part function, not cosmetic appearance alone.'],
    evidenceTask:'Design a comparison for a part with a weld line near a loaded feature: specify matched specimens, loading direction, conditioning, weld position, process actuals and the physical failure metric that would distinguish cosmetic from structural risk.',
    practices:[{type:'defects',label:'Defect Finder — weld lines'},{type:'core',id:'55',label:'Revisit core learning — flow-front meeting defects'}]
  },
  {
    id:'S15',title:'Runner, gate & multicavity imbalance diagnosis',level:'Specialist tooling/process',
    evidenceArea:'runner-gate-multicavity-imbalance',evidenceStatus:'Provisional',
    gap:'Balancing is present in the core, but learners need a stricter localisation method for separating a genuinely global viscosity/fill shift from one branch, gate or cavity drifting away from the rest.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Use cavity-to-cavity patterns to distinguish local distribution imbalance from global process movement.','Compare fill, pressure, part mass and temperature evidence by cavity rather than relying on the machine average.','Recognise when runner/gate geometry, restriction, temperature or venting should be investigated before changing the global recipe.'],
    keypoints:['A machine trace can remain stable while one cavity becomes locally under-packed or delayed.','Cavity-specific part mass and pressure evidence are often more diagnostic than a single total shot metric.','Balanced geometry does not guarantee balanced flow when temperatures, restrictions, gates or venting differ.','Global compensation can move all cavities and hide the local mechanism rather than correct it.'],
    evidenceTask:'Given four hypothetical cavities where one progressively loses mass, define the minimum cavity-specific evidence needed to distinguish a local gate/runner restriction, local temperature issue and global viscosity shift.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'defects',label:'Defect Finder — short shot, flash and weld evidence'}]
  },
  {
    id:'S16',title:'Hot-runner actual thermal & mechanical behaviour',level:'Specialist hot-runner/process',
    evidenceArea:'hot-runner-actual-behaviour',evidenceStatus:'Provisional',
    gap:'Set temperatures and valve commands are not the same as actual melt-channel condition or physical valve response. This extension teaches learners to seek independent actuals before blaming the machine recipe.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Separate hot-runner setpoint from actual heater/sensor/channel behaviour.','Compare commanded valve-gate timing with physical actuation and cavity response.','Recognise branch-specific evidence that justifies hot-runner inspection instead of a global moulding adjustment.'],
    keypoints:['A displayed zone temperature proves controller/sensor state, not uniform melt temperature everywhere in the manifold.','Heater, thermocouple, wiring, tip, valve-pin and pneumatic/hydraulic faults can create local symptoms.','Repeated cavity-specific timing or pressure separation is strong localisation evidence.','Hot-runner intervention requires approved tooling procedures and hazardous-energy controls; this lesson does not authorise servicing.'],
    evidenceTask:'Create an evidence chain for one cavity that begins filling late while machine velocity and total shot remain stable. Include commanded/actual valve evidence, heater/sensor trends, cavity pressure or part mass, and the maintenance evidence needed before concluding a hot-runner fault.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'standards',label:'Review authorised tooling and safety references'}]
  },
  {
    id:'S17',title:'Liquid silicone rubber: metering, mixing & cure behaviour',level:'Specialist material/process',
    evidenceArea:'liquid-silicone-rubber',evidenceStatus:'Provisional',
    gap:'The main pathway is thermoplastic-centred. LSR needs a separate conceptual boundary because mixing, inhibition, cure kinetics and cold-runner/hot-mould behaviour differ materially from conventional thermoplastic injection moulding.',
    coreLessons:[20,21,22,27,30,43],
    objectives:['Distinguish thermoset cure behaviour from thermoplastic cooling/solidification.','Identify metering/mixing, inhibition, mould temperature and cure-time evidence relevant to LSR.','Avoid transferring thermoplastic troubleshooting rules directly to LSR without material-system evidence.'],
    keypoints:['LSR quality depends on controlled component ratio, mixing, contamination control and cure history.','Some contaminants can inhibit cure; adding temperature or time is not a universal correction.','Cold-runner and hot-mould architecture reverses several familiar thermoplastic thermal assumptions.','Supplier-system instructions, machine/tool documentation and validated cure evidence are essential because formulations vary.'],
    evidenceTask:'For a hypothetical under-cured LSR feature, list the evidence that would separate ratio/metering error, mixing problem, inhibition/contamination, local mould-temperature loss and insufficient cure residence before any process change.',
    practices:[{type:'core',id:'21',label:'Revisit core learning — polymer/material behaviour'},{type:'standards',label:'Review material-system and machine documentation'}]
  },
  {
    id:'S18',title:'Gas-, water- & projectile-assisted moulding',level:'Specialist assisted moulding',
    evidenceArea:'fluid-assisted-moulding',evidenceStatus:'Provisional',
    gap:'Fluid-assisted processes introduce a moving internal medium, penetration timing and hollow-section formation that cannot be diagnosed from conventional cavity filling logic alone.',
    coreLessons:[31,32,40,41,52,63],
    objectives:['Explain the purpose of an assisted medium in creating hollow or cored regions.','Identify penetration, fingering, breakthrough and switchover evidence distinct from conventional short-shot behaviour.','Recognise the additional pressure, equipment and safety controls required by assisted processes.'],
    keypoints:['Gas, water and projectile-assisted variants have different heat transfer, penetration and equipment behaviours.','Medium timing relative to polymer fill/pack state strongly affects penetration.','Part weight, internal geometry, pressure traces and sectioning can be more informative than exterior appearance.','High-pressure assisted systems require approved equipment procedures; this education does not authorise intervention.'],
    evidenceTask:'For a hollow handle with unstable penetration length, define the fill/assist timing, pressure, part-mass, sectioning and temperature evidence needed to distinguish polymer-viscosity movement from assist-delivery or tooling effects.',
    practices:[{type:'core',id:'31',label:'Revisit core learning — filling behaviour'},{type:'standards',label:'Review assisted-process equipment and safety references'}]
  },
  {
    id:'S19',title:'Surface replication, texture, adhesion & release',level:'Specialist surface/tooling',
    evidenceArea:'surface-replication-release',evidenceStatus:'Provisional',
    gap:'Microtexture and high-fidelity surfaces couple filling, local thermal history, pressure, surface energy and demoulding. Better replication can increase release load, so quality and ejection evidence must be interpreted together.',
    coreLessons:[31,37,49,58,67,106],
    objectives:['Relate local surface replication to melt/mould temperature, pressure history and feature geometry.','Explain why improved replication can alter contact area and demoulding force.','Use microscopy/replication metrics together with eject-force or release evidence instead of treating surface quality in isolation.'],
    keypoints:['Feature replication is scale- and geometry-dependent; bulk part fill does not prove microfeature fill.','Surface coating, roughness, texture, material and temperature can change adhesion/friction at release.','Higher mould temperature may improve replication while also changing cycle, shrinkage and release behaviour.','A surface-image improvement is not automatically a production improvement if damage or ejection risk rises.'],
    evidenceTask:'Define a trial for a textured insert that records feature-replication quality, mould/part temperature, pressure history, eject force and surface damage so the learner can judge the trade-off between replication and release.',
    practices:[{type:'core',id:'37',label:'Revisit core lesson 37 — ejection'},{type:'defects',label:'Defect Finder — surface and drag evidence'}]
  },
  {
    id:'S20',title:'Injection-compression & precision optical moulding',level:'Specialist precision processing',
    evidenceArea:'injection-compression-precision-optics',evidenceStatus:'Provisional',
    gap:'Precision optical parts add compression-stroke timing, optical stress, replication fidelity and extremely tight geometry requirements that need a distinct evidence chain beyond conventional pack-and-hold thinking.',
    coreLessons:[31,49,58,59,71,79],
    objectives:['Explain how injection-compression changes cavity pressure development and replication compared with conventional packing.','Identify optical/precision outcomes such as birefringence, form error, replication and dimensional stability.','Separate machine command timing from actual mould movement, pressure and part response.'],
    keypoints:['Compression timing and gap/position interact with fill state and pressure history.','Low visible defect levels do not guarantee low optical stress or acceptable form accuracy.','Mould temperature uniformity, replication and demoulding can all affect optical quality.','Process optimisation must use the actual optic, tool and metrology method; published settings are not universal recipes.'],
    evidenceTask:'For a precision lens showing acceptable mass but variable optical distortion, define the compression position/timing, cavity pressure, mould temperature, optical metrology and dimensional evidence needed before attributing the issue to compression control.',
    practices:[{type:'core',id:'79',label:'Revisit core learning — validation and dimensional evidence'},{type:'core',id:'58',label:'Revisit core learning — warpage and stress-related behaviour'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function key(base){return `${base}::${learnerToken()}`}
function readKey(base){try{const x=JSON.parse(localStorage.getItem(key(base))||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeGap(x){try{localStorage.setItem(key(STORAGE_BASE),JSON.stringify(x))}catch(_){}}
function gapDone(id){return !!readKey(STORAGE_BASE)[id]}
function setGapDone(id,done){const s=readKey(STORAGE_BASE);if(done)s[id]=true;else delete s[id];writeGap(s);patchDashboard();}
function baseDoneCount(){return Object.keys(readKey(BASE_STORAGE)).filter(id=>/^S(?:0[1-9]|1[0-2])$/.test(id)).length}
function gapDoneCount(){return LESSONS.filter(x=>gapDone(x.id)).length}
function totalDone(){return baseDoneCount()+gapDoneCount()}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}
function resolvedStatus(l){
  const bridged=window.MM_SPECIALIST_EVIDENCE_STATUS?.statuses?.[l.evidenceArea];
  if(bridged)return bridged;
  const exported=window.MM_SPECIALIST_EVIDENCE_GAPS?.lessons?.find(x=>x.id===l.id)?.evidenceStatus;
  return exported||l.evidenceStatus||'Provisional';
}
function evidenceStateMarkup(l){
  const state=resolvedStatus(l);
  if(state==='Promoted')return `<strong>Evidence status: Promoted</strong><br>Registry area: ${esc(l.evidenceArea)}. Independent publisher-verified primary measured studies have satisfied the mechanism promotion rule. Promotion is mechanism-level only; study-specific settings remain bounded to their material, mould, machine and test context.`;
  if(state==='Gap')return `<strong>Evidence status: Gap</strong><br>Registry area: ${esc(l.evidenceArea)}. Suitable primary measured confirmation is not yet retained. Treat this as a hypothesis/evidence exercise, not validated production guidance.`;
  return `<strong>Evidence status: Provisional</strong><br>Registry area: ${esc(l.evidenceArea)}. This mechanism remains bounded formative learning and is not promoted evidence until independent publisher-verified primary measured studies satisfy the repository promotion rule.`;
}

function ensureStyle(){
  if(document.getElementById('mm-specialist-gap-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-gap-style';s.textContent=`
.mm-specialist-evidence-state{margin:10px 0 0;padding:10px 12px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.5}.mm-specialist-evidence-state strong{color:#ffe69a}.mm-specialist-gap-card{border-color:#5e5430!important}.mm-specialist-gap-card .mm-specialist-eyebrow{color:#e8c96a}.mm-specialist-gap-chip{display:inline-block;margin-top:8px;padding:4px 8px;border:1px solid #6b5e2d;border-radius:999px;color:#f1dd98;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
`;
  document.head.appendChild(s)
}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Evidence-gap lessons start with conservative provisional fallbacks and show Promoted only after the mechanism-level registry promotion rule is satisfied; learner completion never changes evidence status.</div>'}
function patchCatalog(){
  ensureStyle();
  const body=document.getElementById('mmSpecialistBody');if(!body)return;
  const grid=body.querySelector('.mm-specialist-grid');if(!grid)return;
  for(const l of LESSONS){
    if(grid.querySelector(`[data-specialist-gap="${l.id}"]`))continue;
    const state=resolvedStatus(l);
    grid.insertAdjacentHTML('beforeend',`<article class="mm-specialist-card mm-specialist-gap-card" data-specialist-gap="${esc(l.id)}" data-evidence-status="${esc(state.toLowerCase())}"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p><span class="mm-specialist-gap-chip">Evidence: ${esc(state)}</span>${gapDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" onclick="mmSpecialistGapLesson('${l.id}')">Open extension →</button></div></article>`)
  }
  const meta=body.querySelectorAll('.mm-specialist-meta span');
  if(meta[1])meta[1].textContent='20 optional extensions';
  if(meta[2])meta[2].textContent=`${totalDone()}/20 completed locally`;
}
function openGapLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;
  ensureStyle();const modal=document.getElementById('mmSpecialistModal');if(!modal){window.mmSpecialistOpen?.();return setTimeout(()=>openGapLesson(id),0)}
  modal.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;title.textContent=l.title;
  const coreButtons=l.coreLessons.map(n=>{const x=coreLesson(n);return x?`<button class="ghost" type="button" onclick="mmSpecialistPractice('core','${n}')">${n}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p><div class="mm-specialist-evidence-state">${evidenceStateMarkup(l)}</div></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use established formative learning to examine the mechanism without turning study-specific evidence into a universal production rule.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${gapDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" onclick="mmSpecialistGapToggle('${l.id}')">${gapDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`;
}
function toggle(id){setGapDone(id,!gapDone(id));openGapLesson(id)}
function patchDashboard(){
  const panel=document.getElementById('mmSpecialistDashboard');if(!panel)return;
  const p=panel.querySelector('p');if(p)p.textContent='The 120-lesson core remains the complete main pathway. These 20 optional lessons close specific depth gaps in safety, machine health, materials, measurement, tooling, sustainability and eight registry-tracked evidence areas. Each evidence-gap lesson displays its current evidence state; completing a lesson never promotes the mechanism.';
  const spans=panel.querySelectorAll('.mm-specialist-meta span');if(spans[0])spans[0].textContent='20 optional lessons';if(spans[1])spans[1].textContent=`${totalDone()} completed locally`;
}

const baseOpen=window.mmSpecialistOpen;
window.mmSpecialistOpen=function(){baseOpen();patchCatalog()};
window.mmSpecialistGapLesson=openGapLesson;window.mmSpecialistGapToggle=toggle;

const priorRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(priorRenderDashboard){renderDashboard=function(){priorRenderDashboard();patchDashboard()}}

for(const l of LESSONS){BASE.lessons.push({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p})),evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus})}
BASE.evidenceGapExtension={version:VERSION,lessonCount:LESSONS.length,status:'Registry-controlled',scope:'Optional formative evidence-gap learning; does not alter the canonical 120 lessons, formal assessment answers or certificate requirements.'};
window.MM_SPECIALIST_EVIDENCE_GAPS={version:VERSION,optional:true,lessonCount:LESSONS.length,lessons:LESSONS.map(l=>({id:l.id,title:l.title,evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus,coreLessons:[...l.coreLessons]})),open:window.mmSpecialistOpen,scope:BASE.evidenceGapExtension.scope};
if(typeof currentView==='string'&&currentView==='dashboard')patchDashboard();
})();
