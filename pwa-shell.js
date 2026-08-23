/* MouldMaster PWA shell controller — 2026.08.23.6 */
(function(){
'use strict';
const RELEASE='2026.08.23.6';
const CONTENT='2026.08.23.1';
function syncLabels(){
  document.querySelectorAll('[data-mm-android-pwa] .tiny.muted').forEach(p=>{
    if(/Android release/i.test(p.textContent||''))p.textContent=`Android release ${RELEASE}. Training content ${CONTENT}. Learner progress, notes, scores and certificates remain in this browser profile during app updates.`;
  });
  const meta=document.querySelector('meta[name="mm-shell-release"]');if(meta)meta.content=RELEASE;
}
function addNZLegacyNote(){
  const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-nz-legacy-note]'))return;
  const region=(window.user&&window.user.region)||'ALL';if(region!=='ALL'&&region!=='NZ')return;
  host.insertAdjacentHTML('beforeend',`<div class="legal-note" data-mm-nz-legacy-note="1"><b>NZ source-status note:</b> the older WorkSafe injection/blow-moulding fact sheet is retained only as <b>legacy supplementary guidance</b>. For current duties and safeguarding practice, use the Health and Safety at Work Act framework, current WorkSafe machinery/lockout guidance, applicable site procedures and current machinery standards. Do not treat the old fact sheet as the controlling current legal source.</div>`);
}
function patchStandards(){
  if(typeof window.renderStandards!=='function'||window.__MM_STANDARDS_STATUS_PATCH__)return;
  const base=window.renderStandards;window.renderStandards=function(){const r=base.apply(this,arguments);addNZLegacyNote();return r};window.__MM_STANDARDS_STATUS_PATCH__=true;
}
async function register(){
  if(!('serviceWorker' in navigator))return;
  try{const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});await reg.update()}catch(e){console.warn('[MouldMaster] Offline/update support unavailable:',e)}
}
patchStandards();
const observer=new MutationObserver(()=>{syncLabels();addNZLegacyNote()});
if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('load',()=>{syncLabels();addNZLegacyNote();register();setTimeout(syncLabels,250)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncLabels();addNZLegacyNote()}});
window.MM_SHELL_RELEASE=RELEASE;window.MM_CONTENT_RELEASE=CONTENT;
})();
