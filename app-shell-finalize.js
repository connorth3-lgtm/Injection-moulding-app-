/* MouldMaster app-shell finalizer — 2026.08.26.3 */
(function(){
'use strict';
if(!window.MM_APP_SHELL)throw new Error('app-shell-finalize.js requires app-shell-registry.js');
if(!window.MM_LEARNING_EXPERIENCE)throw new Error('app-shell-finalize.js requires learning-experience.js');
if(!window.MM_CURRICULUM_INTEGRATION)throw new Error('app-shell-finalize.js requires curriculum-integration.js');
if(!window.MM_SPECIALIST_CURRICULUM)throw new Error('app-shell-finalize.js requires specialist-curriculum.js');
if(!window.MM_MOULD_MASTER_WORKSPACE)throw new Error('app-shell-finalize.js requires mould-master-workspace.js');
window.MM_APP_SHELL.finalize();
const geometryStyle=document.getElementById('mm-app-shell-registry-style');
if(geometryStyle&&geometryStyle.parentNode===document.head)document.head.appendChild(geometryStyle);

function isVisibleView(id){
  const el=document.getElementById(id);
  return Boolean(el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none');
}
function activeMobileGroup(){
  if(['mmMouldMasterWorkspace','diagnosticLabs','processDataLabs','materialLabs','defects','simulator','scenarios'].some(isVisibleView))return 'practice';
  if(['lesson','path','materials'].some(isVisibleView))return 'learn';
  if(isVisibleView('dashboard'))return 'home';
  return 'more';
}
function isMoreButton(button){
  return !button.dataset.view&&((button.getAttribute('onclick')||'').includes('openMobileMenu')||/\bMore\b/i.test(button.textContent||''));
}
function syncMobileAccessibility(){
  const group=activeMobileGroup();
  const buttons=[...document.querySelectorAll('.mobile-nav > button')];
  for(const button of buttons){
    const view=button.dataset.view||'';
    let active=false;
    if(group==='home')active=view==='dashboard';
    else if(group==='learn')active=view==='path';
    else if(group==='practice')active=view==='scenarios';
    else active=isMoreButton(button);
    button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  window.MM_APP_SHELL.geometry?.sync?.();
}
const viewRoot=document.getElementById('mainContent')||document.querySelector('main.main');
if(viewRoot){
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.type==='attributes'&&r.target.classList?.contains('view')))queueMicrotask(syncMobileAccessibility);
  });
  observer.observe(viewRoot,{subtree:true,attributes:true,attributeFilter:['class']});
  window.__MM_APP_SHELL_VIEW_OBSERVER__=observer;
}
document.addEventListener('click',()=>requestAnimationFrame(syncMobileAccessibility),true);
window.addEventListener('popstate',syncMobileAccessibility);
requestAnimationFrame(syncMobileAccessibility);

window.MM_APP_SHELL_FINALIZED='2026.08.26.3';
})();
