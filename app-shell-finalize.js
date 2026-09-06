/* MouldMaster app-shell finalizer — 2026.09.06.8 */
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
  'weld-line-mechanical-strength':'Promoted',
  'runner-gate-multicavity-imbalance':'Promoted',
  'hot-runner-actual-behaviour':'Promoted',
  'liquid-silicone-rubber':'Promoted',
  'fluid-assisted-moulding':'Promoted',
  'surface-replication-release':'Promoted',
  'injection-compression-precision-optics':'Promoted'
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
  const gaps=GAP.lessons.length-promoted-provisional;
  GAP.evidenceSummary={promoted,provisional,gaps};
  const status=provisional?(promoted?'Mixed':'Provisional'):(promoted?'Promoted':'Gap');
  BASE.evidenceGapExtension={...(BASE.evidenceGapExtension||{}),status,evidenceSummary:{...GAP.evidenceSummary}};
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
function loadProductionHealth(){
  if(window.MM_PRODUCTION_HEALTH||document.querySelector('script[data-mm-production-health]'))return;
  const script=document.createElement('script');script.src='./production-health.js';script.async=true;script.dataset.mmProductionHealth='1';document.head.appendChild(script);
}
function loadConnectedDataRuntime(){
  if(window.MM_CONNECTED_PROCESS_DATA||document.querySelector('script[data-mm-connected-data]'))return;
  const script=document.createElement('script');
  script.src='./data-integration-runtime.js';
  script.async=true;
  script.dataset.mmConnectedData='1';
  script.addEventListener('load',()=>{
    if(window.MM_PROCESS_INTELLIGENCE_UI||document.querySelector('script[data-mm-process-intelligence]'))return;
    const ui=document.createElement('script');ui.src='./process-data-intelligence-ui.js';ui.async=true;ui.dataset.mmProcessIntelligence='1';document.head.appendChild(ui);
  });
  script.addEventListener('error',()=>console.error('MouldMaster connected process-data runtime could not be loaded'));
  document.head.appendChild(script);
}
function loadMeasuredLearningRuntime(){
  if(window.MM_MEASURED_LEARNING_LIBRARY||document.querySelector('script[data-mm-measured-learning]'))return;
  const script=document.createElement('script');
  script.src='./measured-learning-library.js';
  script.async=true;
  script.dataset.mmMeasuredLearning='1';
  script.addEventListener('error',()=>console.warn('[MouldMaster] Measured Learning runtime unavailable; learner navigation remains disabled.'));
  document.head.appendChild(script);
}
function removeHomeJobRouter(root){
  if(!root)return;
  const normalize=value=>String(value||'')
    .replace(/[·•|–—-]/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
  const isLegacyRouterText=value=>{
    const text=normalize(value);
    return (text.includes('one platform')&&text.includes('five jobs'))||text.includes('what do you need to do');
  };

  for(const block of Array.from(root.querySelectorAll('.mm-dashboard-slot,section,.card,[class*="router"],[class*="job"]'))){
    if(block.classList?.contains('mm-home-task-hub'))continue;
    if(isLegacyRouterText(block.textContent))block.remove();
  }

  for(const node of Array.from(root.querySelectorAll('h1,h2,h3,.eyebrow,[class*="eyebrow"],[class*="kicker"]'))){
    if(!isLegacyRouterText(node.textContent))continue;
    const block=node.closest('.mm-dashboard-slot,section,.card,[class*="router"],[class*="job"]')||node.parentElement;
    if(block&&block!==root&&!block.classList?.contains('mm-home-task-hub'))block.remove();
  }
}
function removeHomeSecondaryBlocks(root){
  if(!root)return;
  root.querySelectorAll('.region-banner').forEach(el=>el.remove());
  for(const slot of Array.from(root.querySelectorAll('.mm-dashboard-slot'))){
    const text=(slot.textContent||'').replace(/\s+/g,' ').trim();
    if(/^Standards mode:/i.test(text)||/^Process data labs\b/i.test(text))slot.remove();
  }
  for(const heading of Array.from(root.querySelectorAll('h2,h3'))){
    const text=(heading.textContent||'').replace(/\s+/g,' ').trim();
    if(!/^Process data labs$/i.test(text))continue;
    const block=heading.closest('.mm-dashboard-slot')||heading.closest('section,.card')||heading.parentElement;
    if(block&&block!==root)block.remove();
  }
}
function simplifyHomeScreen(){
  const root=document.getElementById('dashboard');
  if(!root)return;

  root.querySelectorAll('.mm-home-core-hero,.mm-home-kpis,.mm-home-course-head,.mm-home-course-grid,.hero,.friendly-hero,.kpis,.fun-dashboard').forEach(el=>el.remove());
  removeHomeJobRouter(root);
  removeHomeSecondaryBlocks(root);

  const redundantHeadings=/^(What would you like to do\?|Your next learning tracks|Continue your path|How MouldMaster works|Achievements|Your achievements)$/i;
  for(const head of Array.from(root.querySelectorAll('.section-head'))){
    const title=(head.querySelector('h2,h3')?.textContent||'').trim();
    if(!redundantHeadings.test(title))continue;
    const next=head.nextElementSibling;
    if(next?.matches('.grid,.grid2,.grid4,.quick-grid,.how-grid,.achievement-grid,.learning-map'))next.remove();
    head.remove();
  }

  const oldQuickGrid=root.querySelector('.quick-grid');
  if(oldQuickGrid)oldQuickGrid.remove();
  root.querySelectorAll('.how-grid,.achievement-grid').forEach(el=>el.remove());

  const actions=Array.from(root.querySelectorAll('.mm-home-action'));
  const learningShortcut=actions.find(button=>/Explore your learning/i.test(button.textContent||''));
  if(learningShortcut){
    let done=false;
    try{done=typeof window.dailyDone==='function'&&window.dailyDone()}catch(_){}
    learningShortcut.removeAttribute('data-mm-onclick');
    learningShortcut.dataset.mmPracticeAction=done?'scenarios':'daily';
    learningShortcut.innerHTML=`<span class="mm-home-action-icon">✓</span><span><strong>${done?'Daily practice complete':'Daily practice'}</strong><small>${done?'Keep practising with another evidence-first scenario.':'Take one short evidence-first moulding decision for today.'}</small></span>`;
  }
}
function stabilizeRetiredChrome(){
  const root=document.getElementById('dashboard');
  if(root){
    removeHomeJobRouter(root);
    removeHomeSecondaryBlocks(root);
    root.querySelectorAll('.fun-dashboard:not(.mm-daily-only),.fun-dashboard .level-card,.achievement-grid,.fun-settings').forEach(el=>el.remove());
    root.querySelectorAll('button').forEach(button=>{
      const text=button.textContent||'';
      if(/\+\s*\d+\s*XP\b/i.test(text))button.textContent=text.replace(/\s*\+\s*\d+\s*XP\b/ig,'');
    });
  }
  document.querySelectorAll('#xpPop,.xp-pop,#profileMini .fun-hud').forEach(el=>el.remove());

  const mobile=!!window.matchMedia?.('(max-width:700px)').matches;
  for(const id of ['mm-src-open','mmrd-open']){
    const launcher=document.getElementById(id);if(!launcher)continue;
    if(mobile){
      launcher.style.setProperty('display','none','important');
      launcher.style.setProperty('visibility','hidden','important');
      launcher.style.setProperty('pointer-events','none','important');
      launcher.setAttribute('aria-hidden','true');launcher.tabIndex=-1;
    }else{
      if(launcher.style.getPropertyPriority('display')==='important')launcher.style.removeProperty('display');
      launcher.style.removeProperty('visibility');launcher.style.removeProperty('pointer-events');
    }
  }
  if(mobile){
    const nav=document.querySelector('.mobile-nav');
    nav?.querySelectorAll(':scope > button,:scope > a').forEach(item=>{
      const text=(item.textContent||'').replace(/\s+/g,' ').trim();
      if(/^(References|Reference Data)$/i.test(text)&&!item.dataset.view&&!/More/i.test(text))item.remove();
    });
  }
}
function installRetiredChromeGuard(){
  if(window.__MM_RETIRED_CHROME_GUARD__)return;
  stabilizeRetiredChrome();
  const observer=new MutationObserver(()=>stabilizeRetiredChrome());
  const home=document.getElementById('dashboard'),nav=document.querySelector('.mobile-nav');
  if(home)observer.observe(home,{childList:true,subtree:true});
  if(nav)observer.observe(nav,{childList:true});
  window.addEventListener('resize',stabilizeRetiredChrome,{passive:true});
  window.__MM_RETIRED_CHROME_GUARD__={version:'2026.09.06.8',observer};
}
function installHomeScreenSimplification(){
  if(window.__MM_HOME_SIMPLIFICATION__||typeof window.renderDashboard!=='function')return;
  const base=window.renderDashboard;
  window.renderDashboard=function(){const result=base.apply(this,arguments);simplifyHomeScreen();stabilizeRetiredChrome();return result};
  window.__MM_HOME_SIMPLIFICATION__='2026.09.06.8';
  simplifyHomeScreen();
}

syncEvidenceExports();
const originalSpecialistOpen=window.mmSpecialistOpen;
const originalGapLesson=window.mmSpecialistGapLesson;
window.mmSpecialistOpen=function(){const result=originalSpecialistOpen?.();queueMicrotask(patchEvidenceUi);return result};
window.mmSpecialistGapLesson=function(id){const result=originalGapLesson?.(id);queueMicrotask(patchEvidenceUi);return result};
window.MM_SPECIALIST_EVIDENCE_STATUS={version:'2026.08.29.1',statuses:{...EVIDENCE_STATUS},summary:{...GAP.evidenceSummary},scope:'Resolved display state from the historical mechanism registry plus the formal promotion overlay; no assessment, certificate, process-setting or production authority.'};

loadProductionHealth();
loadConnectedDataRuntime();
window.MM_APP_SHELL.finalize();
installHomeScreenSimplification();
installRetiredChromeGuard();
window.MM_APP_SHELL.navigation?.sync?.();
loadMeasuredLearningRuntime();
const geometryStyle=document.getElementById('mm-app-shell-registry-style');
if(geometryStyle&&geometryStyle.parentNode===document.head)document.head.appendChild(geometryStyle);
window.addEventListener('popstate',()=>window.MM_APP_SHELL.navigation?.sync?.());
requestAnimationFrame(()=>{window.MM_APP_SHELL.geometry?.sync?.();patchEvidenceUi();simplifyHomeScreen();stabilizeRetiredChrome();window.MM_APP_SHELL.navigation?.sync?.()});
// Preserve the canonical shell compatibility marker. Evidence-status bridging and connected-data runtime have their own versions above.
window.MM_APP_SHELL_FINALIZED='2026.08.26.4';
})();
