/* MouldMaster app-shell finalizer — 2026.08.28.2 */
(function(){
'use strict';
if(!window.MM_APP_SHELL)throw new Error('app-shell-finalize.js requires app-shell-registry.js');
if(!window.MM_LEARNING_EXPERIENCE)throw new Error('app-shell-finalize.js requires learning-experience.js');
if(!window.MM_CURRICULUM_INTEGRATION)throw new Error('app-shell-finalize.js requires curriculum-integration.js');
if(!window.MM_SPECIALIST_CURRICULUM)throw new Error('app-shell-finalize.js requires specialist-curriculum.js');
if(!window.MM_SPECIALIST_EVIDENCE_GAPS)throw new Error('app-shell-finalize.js requires specialist-evidence-gap-extension.js');
if(!window.MM_MOULD_MASTER_WORKSPACE)throw new Error('app-shell-finalize.js requires mould-master-workspace.js');

const EVIDENCE_STATUS=Object.freeze({
  'residual-stress-birefringence':'Promoted',
  'weld-line-mechanical-strength':'Provisional',
  'runner-gate-multicavity-imbalance':'Provisional',
  'hot-runner-actual-behaviour':'Provisional',
  'liquid-silicone-rubber':'Provisional',
  'fluid-assisted-moulding':'Provisional',
  'surface-replication-release':'Provisional',
  'injection-compression-precision-optics':'Provisional'
});
const GAP=window.MM_SPECIALIST_EVIDENCE_GAPS;
const BASE=window.MM_SPECIALIST_CURRICULUM;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function syncEvidenceExports(){
  for(const lesson of GAP.lessons){
    const state=EVIDENCE_STATUS[lesson.evidenceArea]||'Provisional';
    lesson.evidenceStatus=state;
    const base=BASE.lessons.find(x=>x.id===lesson.id);if(base)base.evidenceStatus=state;
  }
  const promoted=GAP.lessons.filter(x=>x.evidenceStatus==='Promoted').length;
  const provisional=GAP.lessons.filter(x=>x.evidenceStatus==='Provisional').length;
  GAP.evidenceSummary={promoted,provisional,gaps:GAP.lessons.length-promoted-provisional};
  BASE.evidenceGapExtension={...(BASE.evidenceGapExtension||{}),status:promoted?'Mixed':'Provisional',evidenceSummary:{...GAP.evidenceSummary}};
}
function evidenceMessage(lesson){
  if(lesson.evidenceStatus==='Promoted')return `<strong>Evidence status: Promoted</strong><br>Registry area: ${esc(lesson.evidenceArea)}. This mechanism has met the repository promotion rule with independent publisher-verified primary measured studies. Promotion is mechanism-level only; study-specific settings remain bounded to their material, mould, machine and test context.`;
  if(lesson.evidenceStatus==='Gap')return `<strong>Evidence status: Gap</strong><br>Registry area: ${esc(lesson.evidenceArea)}. Suitable primary measured confirmation is not yet retained. Treat this as a hypothesis/evidence exercise, not validated production guidance.`;
  return `<strong>Evidence status: Provisional</strong><br>Registry area: ${esc(lesson.evidenceArea)}. This mechanism remains bounded formative learning and is not promoted evidence until independent publisher-verified primary measured studies satisfy the repository promotion rule.`;
}
function patchEvidenceUi(){
  for(const lesson of GAP.lessons){
    const card=document.querySelector(`[data-specialist-gap="${lesson.id}"]`);if(card){const chip=card.querySelector('.mm-specialist-gap-chip');if(chip)chip.textContent=`Evidence: ${lesson.evidenceStatus}`;card.dataset.evidenceStatus=lesson.evidenceStatus.toLowerCase()}
  }
  const title=document.getElementById('mmSpecialistTitle')?.textContent||'';
  const active=GAP.lessons.find(x=>x.title===title);
  const state=document.querySelector('#mmSpecialistBody .mm-specialist-evidence-state');
  if(active&&state)state.innerHTML=evidenceMessage(active);
  const panel=document.getElementById('mmSpecialistDashboard');
  if(panel){const meta=panel.querySelector('.mm-specialist-meta');let summary=meta?.querySelector('[data-evidence-summary]');if(meta&&!summary){meta.insertAdjacentHTML('beforeend','<span data-evidence-summary></span>');summary=meta.querySelector('[data-evidence-summary]')}if(summary)summary.textContent=`${GAP.evidenceSummary.promoted} promoted evidence lessons · ${GAP.evidenceSummary.provisional} provisional`}
}
syncEvidenceExports();
const originalSpecialistOpen=window.mmSpecialistOpen;
const originalGapLesson=window.mmSpecialistGapLesson;
window.mmSpecialistOpen=function(){const result=originalSpecialistOpen?.();queueMicrotask(patchEvidenceUi);return result};
window.mmSpecialistGapLesson=function(id){const result=originalGapLesson?.(id);queueMicrotask(patchEvidenceUi);return result};
window.MM_SPECIALIST_EVIDENCE_STATUS={version:'2026.08.28.2',statuses:{...EVIDENCE_STATUS},summary:{...GAP.evidenceSummary},scope:'Registry-aligned display state for optional evidence-gap learning; no assessment or certificate authority.'};

window.MM_APP_SHELL.finalize();
const geometryStyle=document.getElementById('mm-app-shell-registry-style');
if(geometryStyle&&geometryStyle.parentNode===document.head)document.head.appendChild(geometryStyle);
window.addEventListener('popstate',()=>window.MM_APP_SHELL.navigation?.sync?.());
requestAnimationFrame(()=>{window.MM_APP_SHELL.geometry?.sync?.();patchEvidenceUi()});
// Preserve the canonical shell compatibility marker. Evidence-status bridging has its own version above.
window.MM_APP_SHELL_FINALIZED='2026.08.26.4';
})();
