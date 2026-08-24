/* MouldMaster PWA shell controller — 2026.08.24.4 */
(function(){
'use strict';
const RELEASE='2026.08.24.1';
const CONTENT='2026.08.24.2';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function displayContext(){
  const requested=new URLSearchParams(location.search).get('desktopRelease')||'';
  const desktop=location.hostname==='127.0.0.1'&&/\bElectron\//.test(navigator.userAgent||'')?requested:'';
  const standalone=!desktop&&!!window.matchMedia?.('(display-mode: standalone)').matches;
  return desktop
    ?{version:desktop,mode:'Desktop package',title:'Desktop build',detail:'This desktop package uses the release version supplied by the verified desktop launcher.'}
    :{version:RELEASE,mode:standalone?'Installed PWA':'Browser / PWA',title:'Browser app updates',detail:'MouldMaster refreshes app files when online and keeps an offline copy after a successful install.'};
}
function syncLabels(){
  const copy=`Android release ${RELEASE}. Training content ${CONTENT}. Learner progress, notes, scores and certificates remain in this browser profile during app updates.`;
  document.querySelectorAll('[data-mm-android-pwa] .tiny.muted').forEach(p=>{if(/Android release/i.test(p.textContent||''))setText(p,copy)});
  const meta=document.querySelector('meta[name="mm-shell-release"]');if(meta)setAttr(meta,'content',RELEASE);
}
function syncUpdateCard(){
  const ctx=displayContext();
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
function dockReferenceLauncher(){
  const open=document.getElementById('mm-src-open');if(!open)return;
  const sidebar=document.querySelector('.sidebar-foot');
  const dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');
  if(!dock)return;
  if(open.parentElement!==dock)dock.appendChild(open);
  open.style.position='static';
  open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';
  open.style.zIndex='auto';open.style.pointerEvents='auto';
  open.style.width=sidebar?'100%':'auto';
  open.style.margin=sidebar?'12px 0 0':'0';
  open.style.display=sidebar?'flex':'inline-flex';
  open.style.justifyContent='center';
  open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content';
}
function addNZLegacyNote(){
  const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-nz-legacy-note]')||[...host.querySelectorAll('.legal-note')].some(x=>/NZ source-status (?:note|clarification)/i.test(x.textContent||'')))return;
  const region=(window.user&&window.user.region)||'ALL';if(region!=='ALL'&&region!=='NZ')return;
  host.insertAdjacentHTML('beforeend',`<div class="legal-note" data-mm-nz-legacy-note="1"><b>NZ source-status note:</b> the older WorkSafe injection/blow-moulding fact sheet is retained only as <b>legacy supplementary guidance</b>. For current duties and safeguarding practice, use the Health and Safety at Work Act framework, current WorkSafe machinery/lockout guidance, applicable site procedures and current machinery standards. Do not treat the old fact sheet as the controlling current legal source.</div>`);
}
function patchStandards(){
  if(typeof window.renderStandards!=='function'||window.__MM_STANDARDS_STATUS_PATCH__)return;
  const base=window.renderStandards;window.renderStandards=function(){const r=base.apply(this,arguments);addNZLegacyNote();return r};window.__MM_STANDARDS_STATUS_PATCH__=true;
}
async function register(){
  if(displayContext().mode==='Desktop package'||!('serviceWorker' in navigator))return;
  try{const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});await reg.update()}catch(e){console.warn('[MouldMaster] Offline/update support unavailable:',e)}
}
let syncQueued=false;
function runSync(){syncQueued=false;syncLabels();syncUpdateCard();dockReferenceLauncher();addNZLegacyNote()}
function scheduleSync(){
  if(syncQueued)return;
  syncQueued=true;
  (window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(runSync);
}
patchStandards();
const observer=new MutationObserver(scheduleSync);
if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('load',()=>{runSync();register();setTimeout(scheduleSync,250)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync()});
window.MM_SHELL_RELEASE=RELEASE;window.MM_CONTENT_RELEASE=CONTENT;window.MM_DISPLAY_CONTEXT=displayContext;window.MM_REFERENCE_LAUNCHER_DOCK='sidebar-first-normal-flow';
})();
