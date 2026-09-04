/* MouldMaster domain bridge for legacy Learning Analytics — 2026.09.03 */
(function(){
'use strict';
if(window.MM_LEARNING_ANALYTICS||window.MM_LEARNING_ANALYTICS_LOADING)return;
if(!window.MM_LEARNER_SCOPE)throw new Error('MM_LEARNER_SCOPE must load before Learning Analytics');
const base='./learning-analytics.js';
const version=String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
const src=version?`${base}?v=${encodeURIComponent(version)}`:base;
function currentRole(){try{return String(typeof user!=='undefined'&&user?.role||'learner').trim().toLowerCase()}catch(_){return'learner'}}
function isInstructor(){return currentRole()==='instructor'}
function enforceExportAccess(root=document){
  const allowed=isInstructor();
  for(const node of root.querySelectorAll?.('[data-la-export]')||[]){node.hidden=!allowed;if(!allowed)node.setAttribute?.('aria-hidden','true');else node.removeAttribute?.('aria-hidden')}
  return allowed
}
function guardExport(event){
  queueMicrotask(()=>enforceExportAccess());
  const target=event.target?.closest?.('[data-la-export]');
  if(!target||isInstructor())return;
  event.preventDefault?.();event.stopImmediatePropagation?.();window.toast?.('Instructor role required for cross-profile analytics export')
}
document.addEventListener('click',guardExport,true);
window.addEventListener('load',()=>enforceExportAccess());
window.addEventListener('mm:domains-ready',()=>enforceExportAccess());
window.MM_LEARNING_ANALYTICS_ACCESS=Object.freeze({isInstructor,enforce:enforceExportAccess,scope:'Cross-profile learning analytics export is instructor-only. Learner-scoped analytics remain available to the active learner.'});
const ready=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.mmDomainBridge='learning-analytics';
  s.onload=()=>{enforceExportAccess();resolve(window.MM_LEARNING_ANALYTICS||null)};
  s.onerror=()=>reject(new Error(`Learning Analytics asset failed: ${base}`));
  document.body.appendChild(s);
});
window.MM_LEARNING_ANALYTICS_LOADING=ready;
})();