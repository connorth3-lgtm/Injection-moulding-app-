/* MouldMaster specialist evidence-status bridge — registry-aligned optional learning — 2026.08.28.1 */
(function(){
'use strict';
if(window.MM_SPECIALIST_EVIDENCE_STATUS_BRIDGE)return;

const VERSION='2026.08.28.1';
const REGISTRY_URL='./data/evidence-coverage-v1.json';
const GAP=window.MM_SPECIALIST_EVIDENCE_GAPS;
const BASE=window.MM_SPECIALIST_CURRICULUM;
if(!GAP||!Array.isArray(GAP.lessons)||GAP.lessons.length!==8)throw new Error('specialist-evidence-status-bridge.js requires S13-S20 evidence-gap lessons');
if(!BASE||!Array.isArray(BASE.lessons)||BASE.lessons.length!==20)throw new Error('specialist-evidence-status-bridge.js requires 20 optional specialist lessons');

let statusByArea={};
let ready=false;
let loadError='';

function label(status){
  const s=String(status||'provisional').toLowerCase();
  if(s==='promoted')return 'Promoted';
  if(s==='gap')return 'Gap';
  return 'Provisional';
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function applyExports(){
  for(const lesson of GAP.lessons){
    const state=label(statusByArea[lesson.evidenceArea]);
    lesson.evidenceStatus=state;
    const base=BASE.lessons.find(x=>x.id===lesson.id);
    if(base)base.evidenceStatus=state;
  }
  const promoted=GAP.lessons.filter(x=>x.evidenceStatus==='Promoted').length;
  const provisional=GAP.lessons.filter(x=>x.evidenceStatus==='Provisional').length;
  GAP.evidenceSummary={promoted,provisional,gaps:GAP.lessons.length-promoted-provisional,registry:REGISTRY_URL};
  BASE.evidenceGapExtension={...(BASE.evidenceGapExtension||{}),status:promoted?'Mixed':'Provisional',registry:REGISTRY_URL,evidenceSummary:{...GAP.evidenceSummary}};
}
function patchCatalog(){
  for(const lesson of GAP.lessons){
    const card=document.querySelector(`[data-specialist-gap="${lesson.id}"]`);if(!card)continue;
    const chip=card.querySelector('.mm-specialist-gap-chip');if(chip)chip.textContent=`Evidence: ${lesson.evidenceStatus}`;
    card.dataset.evidenceStatus=lesson.evidenceStatus.toLowerCase();
  }
}
function patchLesson(id){
  const lesson=GAP.lessons.find(x=>x.id===id);if(!lesson)return;
  const state=document.querySelector('#mmSpecialistBody .mm-specialist-evidence-state');if(!state)return;
  if(lesson.evidenceStatus==='Promoted'){
    state.innerHTML=`<strong>Evidence status: Promoted</strong><br>Registry area: ${escapeHtml(lesson.evidenceArea)}. This mechanism has met the repository promotion rule with independent publisher-verified primary measured studies. The promotion is mechanism-level only; study-specific settings remain bounded to their material, mould, machine and test context.`;
  }else if(lesson.evidenceStatus==='Gap'){
    state.innerHTML=`<strong>Evidence status: Gap</strong><br>Registry area: ${escapeHtml(lesson.evidenceArea)}. The mechanism can be explored as a hypothesis/evidence problem, but suitable primary measured confirmation is not yet retained. Do not treat the lesson as validated production guidance.`;
  }else{
    state.innerHTML=`<strong>Evidence status: Provisional</strong><br>Registry area: ${escapeHtml(lesson.evidenceArea)}. This mechanism is teachable as a bounded hypothesis/evidence problem, but it is not promoted evidence until independent publisher-verified primary measured studies satisfy the repository promotion rule.`;
  }
}
function patchDashboard(){
  const panel=document.getElementById('mmSpecialistDashboard');if(!panel)return;
  const summary=GAP.evidenceSummary||{};
  const meta=panel.querySelector('.mm-specialist-meta');
  if(meta&&!meta.querySelector('[data-evidence-summary]'))meta.insertAdjacentHTML('beforeend',`<span data-evidence-summary>${summary.promoted||0} promoted evidence lessons · ${summary.provisional||0} provisional</span>`);
  else if(meta?.querySelector('[data-evidence-summary]'))meta.querySelector('[data-evidence-summary]').textContent=`${summary.promoted||0} promoted evidence lessons · ${summary.provisional||0} provisional`;
}
function patchAll(){patchCatalog();patchDashboard()}

const originalOpen=window.mmSpecialistOpen;
const originalLesson=window.mmSpecialistGapLesson;
window.mmSpecialistOpen=function(){const r=originalOpen?.();queueMicrotask(patchAll);return r};
window.mmSpecialistGapLesson=function(id){const r=originalLesson?.(id);queueMicrotask(()=>patchLesson(id));return r};

async function load(){
  try{
    const response=await fetch(REGISTRY_URL,{cache:'no-store'});
    if(!response.ok)throw new Error(`registry HTTP ${response.status}`);
    const data=await response.json();
    if(!Array.isArray(data?.mechanisms))throw new Error('registry mechanisms missing');
    statusByArea=Object.fromEntries(data.mechanisms.map(x=>[x.id,x.status]));
    for(const lesson of GAP.lessons){if(!statusByArea[lesson.evidenceArea])throw new Error(`registry area missing: ${lesson.evidenceArea}`)}
    ready=true;applyExports();patchAll();
  }catch(err){
    loadError=String(err?.message||err);
    statusByArea=Object.fromEntries(GAP.lessons.map(x=>[x.evidenceArea,'provisional']));
    applyExports();patchAll();
    console.warn('MouldMaster specialist evidence registry unavailable; retaining conservative provisional states',err);
  }
}

window.MM_SPECIALIST_EVIDENCE_STATUS_BRIDGE={version:VERSION,registryUrl:REGISTRY_URL,get ready(){return ready},get loadError(){return loadError},get statuses(){return {...statusByArea}},refresh:load};
load();
})();
