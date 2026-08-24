/* MouldMaster PWA shell controller — 2026.08.24.7 */
(function(){
'use strict';
const RELEASE='2026.08.24.1';
const CONTENT='2026.08.24.2';
let referenceDataReturnView='dashboard';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function isMobileNav(){return !!window.matchMedia?.('(max-width:680px)').matches}
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
function configureReferenceDrawer(){
  const modal=document.querySelector('.mmsrc');if(!modal)return;
  modal.classList.add('mm-reference-drawer');
  modal.setAttribute('aria-modal','false');
  modal.setAttribute('aria-label','MouldMaster references — non-blocking reference drawer');
  if(!document.getElementById('mm-reference-drawer-style')){
    const style=document.createElement('style');
    style.id='mm-reference-drawer-style';
    style.textContent=`
.mmsrc.mm-reference-drawer{background:transparent!important;align-items:flex-end!important;justify-content:flex-end!important;padding:12px!important;pointer-events:none!important}
.mmsrc.mm-reference-drawer[data-open="1"]{display:flex!important}
.mmsrc.mm-reference-drawer .mmsrc-panel{width:min(430px,calc(100vw - 24px))!important;max-height:min(72dvh,760px)!important;height:auto!important;border-radius:16px!important;pointer-events:auto!important;box-shadow:0 18px 52px rgba(0,0,0,.42)!important}
.mmsrc.mm-reference-drawer .mmsrc-head{flex:0 0 auto!important}
.mmsrc.mm-reference-drawer .mmsrc-body{min-height:0!important;overscroll-behavior:contain!important}
@media(max-width:680px){.mmsrc.mm-reference-drawer{padding:6px 6px calc(82px + env(safe-area-inset-bottom))!important}.mmsrc.mm-reference-drawer .mmsrc-panel{width:calc(100vw - 12px)!important;max-height:48dvh!important;border-radius:15px!important}.mmsrc.mm-reference-drawer .mmsrc-head{padding-top:10px!important}}
`;
    document.head.appendChild(style);
  }
  modal.dataset.mmNonBlocking='1';
}
function ensureReferenceDataPage(){
  const main=document.querySelector('.main');if(!main)return null;
  let page=document.getElementById('mm-reference-data-page');
  if(!page){
    page=document.createElement('section');
    page.id='mm-reference-data-page';page.className='view hidden';
    page.setAttribute('aria-label','Reference data');
    main.appendChild(page);
  }
  return page;
}
function openReferenceDataPage(){
  const modal=document.querySelector('.mmrd'),panel=modal?.querySelector('.mmrd-panel'),page=ensureReferenceDataPage();
  if(!modal||!panel||!page)return false;
  const visible=[...document.querySelectorAll('.main > .view')].find(v=>v.id!=='mm-reference-data-page'&&!v.classList.contains('hidden'));
  if(visible?.id)referenceDataReturnView=visible.id;
  document.querySelectorAll('.main > .view').forEach(v=>v.classList.add('hidden'));
  modal.dataset.open='0';
  page.classList.remove('hidden');page.dataset.open='1';
  panel.classList.add('mmrd-page-panel');page.appendChild(panel);
  requestAnimationFrame(()=>{window.scrollTo({top:0,behavior:'auto'});panel.querySelector('.mmrd-search')?.focus({preventScroll:true})});
  return true;
}
function closeReferenceDataPage(){
  const page=document.getElementById('mm-reference-data-page'),modal=document.querySelector('.mmrd'),panel=page?.querySelector('.mmrd-panel');
  if(panel&&modal){panel.classList.remove('mmrd-page-panel');modal.appendChild(panel)}
  if(page){page.dataset.open='0';page.classList.add('hidden')}
  const target=referenceDataReturnView||'dashboard';
  if(typeof window.switchView==='function'){try{window.switchView(target);return}catch(_){}}
  (document.getElementById(target)||document.getElementById('dashboard'))?.classList.remove('hidden');
}
function patchReferenceDataPageEvents(){
  if(window.__MM_REFERENCE_DATA_PAGE_EVENTS__)return;
  document.addEventListener('click',e=>{
    if(!isMobileNav())return;
    const close=e.target.closest?.('#mm-reference-data-page .mmrd-close');
    if(!close)return;
    e.preventDefault();e.stopImmediatePropagation();closeReferenceDataPage();
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&isMobileNav()&&document.getElementById('mm-reference-data-page')?.dataset.open==='1'){
      e.preventDefault();e.stopImmediatePropagation();closeReferenceDataPage();
    }
  },true);
  window.__MM_REFERENCE_DATA_PAGE_EVENTS__=true;
}
function patchMobileMoreForReferenceData(){
  if(window.__MM_REFERENCE_DATA_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
  const base=window.openMobileMenu;
  window.openMobileMenu=function(){
    const r=base.apply(this,arguments);
    requestAnimationFrame(()=>{
      const card=document.querySelector('#modal .modal-card');
      const grid=card?.querySelector('.grid2');
      if(!grid||grid.querySelector('[data-mm-reference-data-menu]'))return;
      const button=document.createElement('button');
      button.type='button';button.className='quick-action';button.dataset.mmReferenceDataMenu='1';
      button.innerHTML='<span class="icon">▤</span><b>Reference data</b><small>Materials, defects, signals and troubleshooting data.</small>';
      button.addEventListener('click',()=>{
        try{window.closeModal?.()}catch(_){}
        if(!openReferenceDataPage())document.getElementById('mmrd-open')?.click();
      });
      grid.appendChild(button);
    });
    return r;
  };
  window.__MM_REFERENCE_DATA_MORE_PATCH__=true;
}
function dockReferenceDataLauncher(){
  const open=document.getElementById('mmrd-open');if(!open)return;
  open.style.position='static';
  open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';
  open.style.zIndex='auto';open.style.pointerEvents='auto';
  if(isMobileNav()){
    open.style.display='none';open.style.width='auto';open.style.margin='0';
    open.dataset.mmDocked='mobile-more-menu-page';
    patchMobileMoreForReferenceData();patchReferenceDataPageEvents();
    return;
  }
  const sidebar=document.querySelector('.sidebar-foot');
  const dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');
  if(!dock)return;
  if(open.parentElement!==dock)dock.appendChild(open);
  open.style.width=sidebar?'100%':'auto';
  open.style.margin=sidebar?'8px 0 0':'0';
  open.style.display=sidebar?'flex':'inline-flex';
  open.style.justifyContent='center';
  open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content';
}
function configureReferenceDataDrawer(){
  const modal=document.querySelector('.mmrd');if(!modal)return;
  modal.classList.add('mm-reference-data-drawer');
  modal.setAttribute('aria-modal',isMobileNav()?'false':'false');
  modal.setAttribute('aria-label','MouldMaster reference data');
  if(!document.getElementById('mm-reference-data-drawer-style')){
    const style=document.createElement('style');
    style.id='mm-reference-data-drawer-style';
    style.textContent=`
.mmrd.mm-reference-data-drawer{background:transparent!important;align-items:flex-end!important;justify-content:flex-end!important;padding:12px!important;pointer-events:none!important}
.mmrd.mm-reference-data-drawer[data-open="1"]{display:flex!important}
.mmrd.mm-reference-data-drawer .mmrd-panel{width:min(520px,calc(100vw - 24px))!important;max-height:min(74dvh,800px)!important;height:auto!important;border-radius:16px!important;pointer-events:auto!important;box-shadow:0 18px 52px rgba(0,0,0,.42)!important}
.mmrd.mm-reference-data-drawer .mmrd-head{flex:0 0 auto!important}
.mmrd.mm-reference-data-drawer .mmrd-body{min-height:0!important;overscroll-behavior:contain!important}
@media(max-width:680px){
  .mmrd.mm-reference-data-drawer{display:none!important}
  #mm-reference-data-page{padding:0 0 calc(86px + env(safe-area-inset-bottom))!important}
  #mm-reference-data-page .mmrd-panel{width:100%!important;max-height:none!important;height:auto!important;min-height:0!important;border:1px solid #304866!important;border-radius:16px!important;box-shadow:none!important;background:#0e1a2c!important;overflow:visible!important}
  #mm-reference-data-page .mmrd-head{padding-top:14px!important;border-radius:16px 16px 0 0}
  #mm-reference-data-page .mmrd-body{overflow:visible!important;padding-bottom:24px!important}
}
`;
    document.head.appendChild(style);
  }
  modal.dataset.mmNonBlocking='1';
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
function runSync(){syncQueued=false;syncLabels();syncUpdateCard();dockReferenceLauncher();configureReferenceDrawer();dockReferenceDataLauncher();configureReferenceDataDrawer();patchReferenceDataPageEvents();addNZLegacyNote()}
function scheduleSync(){
  if(syncQueued)return;
  syncQueued=true;
  (window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(runSync);
}
patchStandards();
const observer=new MutationObserver(scheduleSync);
if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
runSync();
window.addEventListener('resize',scheduleSync,{passive:true});
window.addEventListener('load',()=>{runSync();register();setTimeout(scheduleSync,250)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync()});
window.MM_SHELL_RELEASE=RELEASE;window.MM_CONTENT_RELEASE=CONTENT;window.MM_DISPLAY_CONTEXT=displayContext;window.MM_REFERENCE_LAUNCHER_DOCK='sidebar-first-normal-flow';window.MM_REFERENCE_DRAWER_MODE='non-blocking';window.MM_REFERENCE_DATA_LAUNCHER_DOCK='mobile-more-menu-page';window.MM_REFERENCE_DATA_DRAWER_MODE='mobile-page-desktop-drawer';
})();
