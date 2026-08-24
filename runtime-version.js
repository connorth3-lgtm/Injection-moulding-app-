/* MouldMaster runtime/version presentation — 2026.08.24.1 */
(function(){
'use strict';
const RELEASE='2026.08.24.1';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function context(){
  const params=new URLSearchParams(location.search),requested=params.get('desktopRelease')||'';
  const desktop=!!requested&&location.hostname==='127.0.0.1'&&/\bElectron\//.test(navigator.userAgent||'');
  const standalone=!desktop&&!!window.matchMedia?.('(display-mode: standalone)').matches;
  return desktop
    ?{desktop:true,version:requested,mode:'Verified desktop package',title:'Desktop build',detail:'This desktop package verifies its bundled MouldMaster files before launch. Install a newer trusted package to update it.'}
    :{desktop:false,version:RELEASE,mode:standalone?'Installed PWA':'Browser / PWA',title:'Browser app updates',detail:'MouldMaster refreshes app files when online and keeps an offline copy after a successful install.'};
}
function sync(){
  const ctx=context();
  document.querySelectorAll('[data-mm-update-card]').forEach(card=>{
    setText(card.querySelector('.eyebrow'),'App version');
    setText(card.querySelector('h2'),ctx.title);
    const intro=card.querySelector('h2 + p');if(intro)setText(intro,ctx.detail);
    card.querySelectorAll('.stat').forEach(stat=>{
      const label=(stat.querySelector('span')?.textContent||'').trim(),value=stat.querySelector('b');
      if(label==='Installed version')setText(value,ctx.version);
      if(label==='Update mode')setText(value,ctx.mode);
    });
  });
}
let queued=false;
function run(){queued=false;sync()}
function schedule(){
  if(queued)return;
  queued=true;
  (window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(run);
}
const observer=new MutationObserver(schedule);
if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
window.MM_RUNTIME_CONTEXT=context;
})();
