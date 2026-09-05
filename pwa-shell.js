/* MouldMaster PWA shell controller — 2026.09.06 */
(function(){
'use strict';
const RELEASE='2026.09.06.3';
const CONTENT='2026.08.26.1';
const REFERENCE_DATA_URL='./reference-data.html';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function isMobileNav(){return !!window.matchMedia?.('(max-width:680px)').matches}
function isIOSFamily(){const ua=navigator.userAgent||'';return /iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&Number(navigator.maxTouchPoints||0)>1)}
function syncPlatformClasses(){const ios=isIOSFamily(),standalone=ios&&!!window.matchMedia?.('(display-mode: standalone)').matches;document.documentElement.classList.toggle('mm-ios-webkit',ios);document.documentElement.classList.toggle('mm-ios-standalone',standalone)}
function displayContext(){
  const requested=new URLSearchParams(location.search).get('desktopRelease')||'';
  const desktop=location.hostname==='127.0.0.1'&&/\bElectron\//.test(navigator.userAgent||'')?requested:'';
  const standalone=!desktop&&!!window.matchMedia?.('(display-mode: standalone)').matches;
  return desktop
    ?{version:desktop,mode:'Desktop package',title:'Desktop build',detail:'This desktop package uses the release version supplied by the verified desktop launcher.'}
    :{version:RELEASE,mode:standalone?'Installed PWA':'Browser',title:standalone?'Installed app updates':'Browser app updates',detail:standalone?'The installed PWA refreshes app files when online and keeps a verified offline copy.':'Browser mode uses the same verified same-origin service worker/cache as an installed PWA, so opening a normal tab never removes the installed offline copy.'};
}
function syncLabels(){
  const copy=`Android release ${RELEASE}. Training content ${CONTENT}. Learner progress, notes, scores and certificates remain in this browser profile during app updates.`;
  document.querySelectorAll('[data-mm-android-pwa] .tiny.muted').forEach(p=>{if(/Android release/i.test(p.textContent||''))setText(p,copy)});
  const meta=document.querySelector('meta[name="mm-shell-release"]');if(meta)setAttr(meta,'content',RELEASE);
}
function sourceReviewDisplayDate(){
  const iso=window.MM_DATA?.assessmentQA?.qualitySuite?.sourceFreshnessReviewed||'';
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!match)return '';
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month=months[Number(match[2])-1];return month?`${Number(match[3])} ${month} ${match[1]}`:'';
}
function syncStandardsReviewDate(){
  const reviewed=sourceReviewDisplayDate();if(!reviewed)return;
  if(window.MM_DATA?.standards)window.MM_DATA.standards.verified=reviewed;
  document.querySelectorAll('small,.tiny,.muted,p,span').forEach(el=>{
    const text=el.textContent||'';
    if(/References reviewed\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/i.test(text))setText(el,text.replace(/(References reviewed\s+)\d{1,2}\s+[A-Za-z]+\s+\d{4}/gi,`$1${reviewed}`));
  });
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
    if(!card.querySelector('[data-mm-repair-link]')){
      const repair=document.createElement('button');repair.type='button';repair.className='secondary';repair.dataset.mmRepairLink='1';repair.textContent='Repair app files';
      repair.addEventListener('click',()=>location.assign('./repair.html'));
      card.appendChild(repair);
    }
  });
}
function hideInternalQaProvenance(){
  document.querySelectorAll('h3').forEach(heading=>{
    if((heading.textContent||'').trim()==='Plugin-assisted QA provenance'){
      const card=heading.closest('.card');if(card){card.hidden=true;card.style.display='none';card.setAttribute('aria-hidden','true')}
    }
  });
}
function rewardWithoutGamification(_amount,key){
  if(!key)return false;
  let f=null;
  try{if(typeof window.funEnsure==='function')f=window.funEnsure()}catch(_){}
  if(!f)return false;
  f.rewarded=f.rewarded||{};
  if(f.rewarded[key])return false;
  f.rewarded[key]=Date.now();
  try{if(typeof window.recordLearningDay==='function')window.recordLearningDay()}catch(_){}
  try{if(typeof window.persist==='function')window.persist()}catch(_){}
  return true;
}
rewardWithoutGamification.mmGamificationRetired=true;
function dailyChallengePanel(){
  let done=false;
  try{done=typeof window.dailyDone==='function'&&window.dailyDone()}catch(_){}
  const primaryAction=done?'continue':'daily';
  return `<div class="fun-dashboard mm-daily-only"><div class="card mission-card"><div class="mission-label"><span class="mission-dot"></span> TODAY'S PRACTICE</div><h2>${done?'Daily challenge complete ✓':'Solve one real moulding decision'}</h2><p>${done?'Continue the learning path or practise another troubleshooting scenario.':'A short scenario keeps troubleshooting judgement sharp without adding points, ranks or badges.'}</p><div class="hero-buttons"><button type="button" class="primary" data-mm-practice-action="${primaryAction}">${done?'Continue learning →':'Take daily challenge'}</button><button type="button" class="ghost" data-mm-practice-action="scenarios">Open Troubleshooting Arena</button></div></div></div>`;
}
dailyChallengePanel.mmGamificationRetired=true;
function bindPracticeActions(){
  if(window.__MM_PRACTICE_ACTIONS_BOUND__)return;
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-mm-practice-action]');if(!button)return;
    const action=button.dataset.mmPracticeAction;
    if(action==='daily'){try{window.openDailyChallenge?.()}catch(_){}}
    else if(action==='continue'){try{window.switchView?.('lesson')}catch(_){}}
    else if(action==='scenarios'){try{window.switchView?.('scenarios')}catch(_){}}
  });
  window.__MM_PRACTICE_ACTIONS_BOUND__=true;
}
function retireLegacyGamification(){
  bindPracticeActions();
  window.awardXP=rewardWithoutGamification;
  window.xpPop=function(){};
  window.checkAchievements=function(){return []};
  window.achievementsHTML=function(){return ''};
  window.updateFunHud=function(){scrubLegacyGamification()};
  window.funDashboardPanel=dailyChallengePanel;
  try{
    if(typeof window.funEnsure==='function'){
      const f=window.funEnsure();let changed=false;
      if(f.xp!==0){f.xp=0;changed=true}
      if(Array.isArray(f.achievements)&&f.achievements.length){f.achievements=[];changed=true}
      if(changed&&typeof window.persist==='function')window.persist();
    }
  }catch(_){}
  window.__MM_GAMIFICATION_RETIRED__=true;
}
function scrubLegacyGamification(){
  document.querySelectorAll('#xpPop,.xp-pop,.achievement-grid,.fun-settings,.fun-dashboard .level-card,#profileMini .fun-hud').forEach(el=>el.remove());
  document.querySelectorAll('.section-head h2,.section-head h3').forEach(heading=>{
    if(/^Achievements$/i.test((heading.textContent||'').trim())){
      const head=heading.closest('.section-head');
      const next=head?.nextElementSibling;
      if(next?.classList.contains('achievement-grid'))next.remove();
      head?.remove();
    }
  });
  document.querySelectorAll('button').forEach(button=>{
    const text=button.textContent||'';
    if(/\+\s*\d+\s*XP\b/i.test(text))setText(button,text.replace(/\s*\+\s*\d+\s*XP\b/ig,''));
  });
  document.querySelectorAll('.exam-integrity').forEach(el=>{
    el.childNodes.forEach(node=>{
      if(node.nodeType===Node.TEXT_NODE&&/XP and achievements cannot change this rule/i.test(node.nodeValue||''))node.nodeValue=(node.nodeValue||'').replace(/XP and achievements cannot change this rule\./i,'Practice rewards cannot change this rule.');
    });
  });
}
function installMobileLayoutGuard(){
  if(document.getElementById('mm-mobile-layout-guard-style'))return;
  const style=document.createElement('style');style.id='mm-mobile-layout-guard-style';style.textContent=`
:root{--mm-mobile-nav-clearance:104px;--shadow:0 7px 22px rgba(0,0,0,.18)}
.card{border-radius:14px!important;border-color:#263b58!important;box-shadow:var(--shadow)!important;background:linear-gradient(180deg,rgba(18,32,52,.96),rgba(13,25,42,.96))!important}
.main{padding-top:20px}
.topbar{margin-bottom:16px!important}
.topbar h1{line-height:1.12}
.hero{gap:12px!important}
.hero-main{padding:22px!important;min-height:220px!important}
.hero-main h2{font-size:clamp(29px,4vw,34px)!important;margin-bottom:9px!important}
.hero-main p{line-height:1.58!important}
.kpis{gap:10px!important;margin:13px 0!important}.kpi{padding:14px!important}
.section-head{margin:22px 0 10px!important}.grid,.grid2{gap:12px!important}.grid4{gap:10px!important}
.course-card{min-height:220px!important;padding:16px!important}
.lesson-body{padding:22px!important}
.lesson-read-block,.mm-reading-guide,.question,.exam-card .question,.mm-teach,.mm-ref-panel,.lesson-source-box,.question-reference{box-shadow:none!important}
.lesson-read-block,.mm-teach,.mm-ref-panel,.lesson-source-box,.question-reference{border-radius:12px!important}
.mm-reading-guide{border-width:1px!important;border-radius:12px!important;padding:14px 16px!important}
.lesson-read-primary{border-width:1px!important;box-shadow:none!important}
.fun-dashboard.mm-daily-only{grid-template-columns:1fr!important;margin-bottom:14px!important}
.fun-dashboard.mm-daily-only .mission-card{min-height:0!important;padding:18px!important}
@media(max-width:700px){
  :root{--mm-mobile-nav-clearance:104px}
  html{scroll-padding-bottom:calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))}
  body{padding-bottom:0!important}
  .main{padding:14px 14px calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}
  .topbar{position:relative!important;top:auto!important;z-index:1!important;background:transparent!important;backdrop-filter:none!important;gap:10px!important;margin-bottom:14px!important;padding:0 0 6px!important}
  .topbar h1{font-size:clamp(24px,7vw,28px)!important}.topbar p{font-size:13px!important;line-height:1.45!important}
  .top-actions{gap:8px!important;flex-wrap:wrap!important}.top-actions button{min-height:44px!important;padding:9px 12px!important}
  .mobile-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;background:rgba(7,16,28,.97)!important;border-top:1px solid #263b58!important;padding:6px 8px calc(6px + env(safe-area-inset-bottom))!important;box-shadow:0 -5px 18px rgba(0,0,0,.22),0 56px 0 #07101c!important}
  .mobile-nav button{min-height:48px!important;padding:6px 4px!important}
  body.mm-home-visible #continueBtn{display:none!important}
  body.mm-home-visible .top-actions{justify-content:flex-start!important}
  body.mm-home-visible #searchBtn{flex:0 0 auto!important;min-width:108px!important}
  #dashboard{padding-bottom:12px!important}
  #dashboard .hero-main{padding:18px!important;min-height:0!important}
  #dashboard .hero-main h2{font-size:clamp(26px,8vw,31px)!important}
  #dashboard .hero-main p{font-size:14px!important}
  #dashboard .kpis{gap:8px!important;margin:10px 0!important}
  #dashboard .kpi{padding:12px!important}
  #dashboard .mm-specialist-strip{margin-bottom:12px!important}
  .course-card{min-height:0!important;padding:14px!important}
  .lesson-body{padding:14px!important}
  .section-head{margin:18px 0 9px!important}
  .toast{bottom:calc(84px + env(safe-area-inset-bottom))!important}
  html body[data-mm-view="profile"] .topbar{gap:10px!important;margin-bottom:14px!important;padding:0 0 4px!important}
  html body[data-mm-view="profile"] .top-actions{width:100%!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:stretch!important;margin:0!important}
  html body[data-mm-view="profile"] .top-actions button{flex:1 1 130px!important;width:auto!important;min-width:0!important;min-height:44px!important;padding:9px 11px!important;white-space:normal!important}
  html body[data-mm-view="profile"] .main{padding-bottom:calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}
  html body[data-mm-view="profile"] #profile{padding-bottom:12px!important}
  html body[data-mm-view="profile"] #profile>*:last-child{margin-bottom:12px!important}
  html.mm-ios-webkit body[data-mm-view="profile"] .main{padding-top:calc(14px + env(safe-area-inset-top))!important;padding-left:max(14px,env(safe-area-inset-left))!important;padding-right:max(14px,env(safe-area-inset-right))!important;padding-bottom:calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}
  html.mm-ios-webkit body[data-mm-view="profile"] .topbar{margin-bottom:14px!important}
  html.mm-ios-webkit .mobile-nav{padding-left:max(8px,env(safe-area-inset-left))!important;padding-right:max(8px,env(safe-area-inset-right))!important;padding-bottom:calc(6px + env(safe-area-inset-bottom))!important}
}
@media(max-width:390px){html body[data-mm-view="profile"] .top-actions{display:flex!important;grid-template-columns:none!important}html body[data-mm-view="profile"] .top-actions button{flex:1 1 100%!important;min-height:44px!important}}
`;document.head.appendChild(style)}
function syncVisibleViewChrome(){
  const home=document.getElementById('dashboard'),isHome=!!home&&!home.classList.contains('hidden');document.body?.classList.toggle('mm-home-visible',isHome);
  if(window.MM_APP_SHELL?.finalized)return;
  document.querySelectorAll('.mobile-nav button[data-view]').forEach(button=>{const target=button.dataset.view,view=target?document.getElementById(target):null,active=!!view&&!view.classList.contains('hidden');button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')})
}
function dockReferenceLauncher(){
  const open=document.getElementById('mm-src-open');if(!open)return;const sidebar=document.querySelector('.sidebar-foot'),dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');if(!dock)return;
  if(open.parentElement!==dock)dock.appendChild(open);open.style.position='static';open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';open.style.zIndex='auto';open.style.pointerEvents='auto';open.style.width=sidebar?'100%':'auto';open.style.margin=sidebar?'12px 0 0':'0';open.style.display=sidebar?'flex':'inline-flex';open.style.justifyContent='center';open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content'
}
function configureReferenceDrawer(){
  const modal=document.querySelector('.mmsrc');if(!modal)return;modal.classList.add('mm-reference-drawer');modal.setAttribute('aria-modal','false');modal.setAttribute('aria-label','MouldMaster references — non-blocking reference drawer');
  if(!document.getElementById('mm-reference-drawer-style')){const style=document.createElement('style');style.id='mm-reference-drawer-style';style.textContent=`
.mmsrc.mm-reference-drawer{background:transparent!important;align-items:flex-end!important;justify-content:flex-end!important;padding:12px!important;pointer-events:none!important}
.mmsrc.mm-reference-drawer[data-open="1"]{display:flex!important}
.mmsrc.mm-reference-drawer .mmsrc-panel{width:min(430px,calc(100vw - 24px))!important;max-height:min(72dvh,760px)!important;height:auto!important;border-radius:16px!important;pointer-events:auto!important;box-shadow:0 18px 52px rgba(0,0,0,.42)!important}
.mmsrc.mm-reference-drawer .mmsrc-head{flex:0 0 auto!important}.mmsrc.mm-reference-drawer .mmsrc-body{min-height:0!important;overscroll-behavior:contain!important}
@media(max-width:680px){.mmsrc.mm-reference-drawer{padding:6px 6px calc(82px + env(safe-area-inset-bottom))!important}.mmsrc.mm-reference-drawer .mmsrc-panel{width:calc(100vw - 12px)!important;max-height:48dvh!important;border-radius:15px!important}.mmsrc.mm-reference-drawer .mmsrc-head{padding-top:10px!important}}
`;document.head.appendChild(style)}modal.dataset.mmNonBlocking='1'
}
function openStandaloneReferenceData(){location.assign(REFERENCE_DATA_URL)}
function patchMobileMoreForReferenceData(){
  if(window.__MM_REFERENCE_DATA_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;const base=window.openMobileMenu;
  window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{const card=document.querySelector('#modal .modal-card'),grid=card?.querySelector('.grid2');if(!grid||grid.querySelector('[data-mm-reference-data-menu]'))return;const button=document.createElement('button');button.type='button';button.className='quick-action';button.dataset.mmReferenceDataMenu='1';button.innerHTML='<span class="icon">▤</span><b>Reference data</b><small>Materials, defects, signals and troubleshooting data.</small>';button.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openStandaloneReferenceData()});grid.appendChild(button)});return r};window.__MM_REFERENCE_DATA_MORE_PATCH__=true
}
function dockReferenceDataLauncher(){
  const open=document.getElementById('mmrd-open');if(!open)return;open.style.position='static';open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';open.style.zIndex='auto';open.style.pointerEvents='auto';
  if(isMobileNav()){open.style.display='none';open.style.width='auto';open.style.margin='0';open.dataset.mmDocked='mobile-more-standalone-page';patchMobileMoreForReferenceData();return}
  const sidebar=document.querySelector('.sidebar-foot'),dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');if(!dock)return;if(open.parentElement!==dock)dock.appendChild(open);open.style.width=sidebar?'100%':'auto';open.style.margin=sidebar?'8px 0 0':'0';open.style.display=sidebar?'flex':'inline-flex';open.style.justifyContent='center';open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content'
}
function configureReferenceDataDrawer(){
  const modal=document.querySelector('.mmrd');if(!modal)return;modal.classList.add('mm-reference-data-drawer');modal.setAttribute('aria-modal','false');modal.setAttribute('aria-label','MouldMaster reference data');if(isMobileNav())modal.dataset.open='0';
  if(!document.getElementById('mm-reference-data-drawer-style')){const style=document.createElement('style');style.id='mm-reference-data-drawer-style';style.textContent=`
.mmrd.mm-reference-data-drawer{background:transparent!important;align-items:flex-end!important;justify-content:flex-end!important;padding:12px!important;pointer-events:none!important}.mmrd.mm-reference-data-drawer[data-open="1"]{display:flex!important}
.mmrd.mm-reference-data-drawer .mmrd-panel{width:min(520px,calc(100vw - 24px))!important;max-height:min(74dvh,800px)!important;height:auto!important;border-radius:16px!important;pointer-events:auto!important;box-shadow:0 18px 52px rgba(0,0,0,.42)!important}.mmrd.mm-reference-data-drawer .mmrd-head{flex:0 0 auto!important}.mmrd.mm-reference-data-drawer .mmrd-body{min-height:0!important;overscroll-behavior:contain!important}
@media(max-width:680px){.mmrd.mm-reference-data-drawer,.mmrd.mm-reference-data-drawer[data-open="1"]{display:none!important;pointer-events:none!important}}
`;document.head.appendChild(style)}modal.dataset.mmNonBlocking='1'
}
function addNZLegacyNote(){
  const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-nz-legacy-note]')||[...host.querySelectorAll('.legal-note')].some(x=>/NZ source-status (?:note|clarification)/i.test(x.textContent||'')))return;const region=(window.user&&window.user.region)||'ALL';if(region!=='ALL'&&region!=='NZ')return;host.insertAdjacentHTML('beforeend',`<div class="legal-note" data-mm-nz-legacy-note="1"><b>NZ source-status note:</b> the older WorkSafe injection/blow-moulding fact sheet is retained only as <b>legacy supplementary guidance</b>. For current duties and safeguarding practice, use the Health and Safety at Work Act framework, current WorkSafe machinery/lockout guidance, applicable site procedures and current machinery standards. Do not treat the old fact sheet as the controlling current legal source.</div>`)
}
function patchStandards(){if(typeof window.renderStandards!=='function'||window.__MM_STANDARDS_STATUS_PATCH__)return;const base=window.renderStandards;window.renderStandards=function(){const r=base.apply(this,arguments);addNZLegacyNote();return r};window.__MM_STANDARDS_STATUS_PATCH__=true}
async function register(){
  if(displayContext().mode==='Desktop package'||!('serviceWorker' in navigator))return null;
  try{const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});await reg.update();return reg}catch(e){console.warn('[MouldMaster] Offline/update support unavailable:',e);return null}
}
let syncQueued=false;
function runSync(){syncQueued=false;syncPlatformClasses();syncLabels();syncStandardsReviewDate();syncUpdateCard();hideInternalQaProvenance();retireLegacyGamification();installMobileLayoutGuard();scrubLegacyGamification();syncVisibleViewChrome();dockReferenceLauncher();configureReferenceDrawer();dockReferenceDataLauncher();configureReferenceDataDrawer();addNZLegacyNote()}
function scheduleSync(){if(syncQueued)return;syncQueued=true;(window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(runSync)}
function bindLifecycle(){
  const shell=window.MM_APP_SHELL;
  shell?.events?.onViewChange?.(scheduleSync);
  for(const view of ['dashboard','standards','materials','profile','exams'])shell?.events?.onRender?.(view,scheduleSync);
  window.addEventListener('mm:domains-ready',scheduleSync,{once:true});
}
patchStandards();bindLifecycle();
runSync();
window.addEventListener('resize',scheduleSync,{passive:true});
window.addEventListener('load',()=>{runSync();register();setTimeout(scheduleSync,250)},{once:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync()});
window.MM_SHELL_RELEASE=RELEASE;window.MM_CONTENT_RELEASE=CONTENT;window.MM_DISPLAY_CONTEXT=displayContext;window.MM_REFERENCE_LAUNCHER_DOCK='sidebar-first-normal-flow';window.MM_REFERENCE_DRAWER_MODE='non-blocking';window.MM_REFERENCE_DATA_URL=REFERENCE_DATA_URL;window.MM_REFERENCE_DATA_LAUNCHER_DOCK='mobile-more-standalone-page';window.MM_REFERENCE_DATA_DRAWER_MODE='standalone-mobile-page-desktop-drawer';window.MM_BROWSER_UPDATE_MODE='shared-origin-service-worker';window.MM_MOBILE_LAYOUT_GUARD='home-task-first-fixed-nav-clearance-v2';window.MM_IOS_LAYOUT_PATCH='safe-area-viewport-profile-v1';window.MM_UI_POLISH='compact-shell-no-gamification-v1';window.MM_GAMIFICATION_MODE='retired';
})();
