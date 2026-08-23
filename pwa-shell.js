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
async function register(){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});
    await reg.update();
  }catch(e){console.warn('[MouldMaster] Offline/update support unavailable:',e)}
}
const observer=new MutationObserver(syncLabels);
if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('load',()=>{syncLabels();register();setTimeout(syncLabels,250)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncLabels()});
window.MM_SHELL_RELEASE=RELEASE;
window.MM_CONTENT_RELEASE=CONTENT;
})();
