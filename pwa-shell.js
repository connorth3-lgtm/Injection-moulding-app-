/* MouldMaster PWA shell controller — 2026.09.06 */
(function(){
'use strict';
const RELEASE='2026.09.26.1';
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
      repair.addEventListener('click',()=>{if(displayContext().mode==='Desktop package')location.reload();else location.assign('./repair.html')});
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
  document.querySelectorAll('.scenario-scoreboard .scorebox').forEach(box=>{if(/\bXP\b/i.test(box.textContent||''))box.remove()});
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
      if(node.nodeType===Node.TEXT_NODE&&/XP is only an engagement reward/i.test(node.nodeValue||''))node.nodeValue=(node.nodeValue||'').replace(/XP is only an engagement reward; it does not affect certificates\./i,'Practice activity does not affect certificates.');
    });
  });
  document.querySelectorAll('.lesson-quest small').forEach(el=>{if(/Complete the lesson for \d+ XP\./i.test(el.textContent||''))setText(el,(el.textContent||'').replace(/Complete the lesson for \d+ XP\./i,'Complete the lesson when you are ready.'))});
}
function setQuestionCollapsed(elements,collapsed){elements.forEach(el=>el.classList.toggle('mm-question-collapsed',collapsed))}
function enhanceScenarioQuestionLists(){
  const cards=Array.from(document.querySelectorAll('#scenarios .scenario'));
  if(!cards.length)return;
  cards.forEach((card,index)=>{
    const collapsible=Array.from(card.children).filter(el=>el.matches('p,.choice,.feedback'));
    if(!collapsible.length)return;
    collapsible.forEach(el=>el.classList.add('mm-scenario-collapsible'));
    let toggle=card.querySelector('[data-mm-scenario-toggle]');
    if(!isMobileNav()){
      setQuestionCollapsed(collapsible,false);
      if(toggle){toggle.hidden=true;toggle.setAttribute('aria-expanded','true');setText(toggle,'Hide scenario')}
      return;
    }
    if(!toggle){
      const heading=card.querySelector('h3');if(!heading)return;
      const collapsed=index>0;
      toggle=document.createElement('button');toggle.type='button';toggle.className='ghost mm-question-toggle';toggle.dataset.mmScenarioToggle='1';toggle.setAttribute('aria-expanded',String(!collapsed));toggle.textContent=collapsed?'Show scenario':'Hide scenario';
      heading.insertAdjacentElement('afterend',toggle);
      setQuestionCollapsed(collapsible,collapsed);
      toggle.addEventListener('click',()=>{
        const expanded=toggle.getAttribute('aria-expanded')==='true';
        toggle.setAttribute('aria-expanded',String(!expanded));
        setText(toggle,expanded?'Show scenario':'Hide scenario');
        setQuestionCollapsed(collapsible,expanded);
      });
    }else toggle.hidden=false;
  });
}
function enhanceExamQuestionList(){
  const host=document.getElementById('examQuestions');if(!host)return;
  const questions=Array.from(host.children).filter(el=>el.classList.contains('question'));
  const existing=document.querySelector('[data-mm-exam-question-toggle]');
  const governed=host.classList.contains('mm-focus-mode')||host.dataset.mmAssessmentUx==='1'||document.querySelector('.mm-exam-steps')!==null;
  if(governed){
    questions.forEach(q=>q.classList.remove('mm-question-collapsed'));
    if(existing)existing.remove();
    delete host.dataset.mmQuestionDisclosure;
    return;
  }
  if(!isMobileNav()||questions.length<=5){
    questions.forEach(q=>q.classList.remove('mm-question-collapsed'));
    if(existing)existing.hidden=true;
    return;
  }
  if(host.dataset.mmQuestionDisclosure==='1')return;
  host.dataset.mmQuestionDisclosure='1';
  const extra=questions.slice(5);setQuestionCollapsed(extra,true);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='secondary mm-question-toggle';toggle.dataset.mmExamQuestionToggle='1';toggle.setAttribute('aria-expanded','false');toggle.textContent=`Show questions 6–${questions.length}`;
  host.insertAdjacentElement('afterend',toggle);
  toggle.addEventListener('click',()=>{
    const expanded=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!expanded));
    setText(toggle,expanded?`Show questions 6–${questions.length}`:`Hide questions 6–${questions.length}`);
    setQuestionCollapsed(extra,expanded);
  });
}
function installQuestionDisclosures(){enhanceScenarioQuestionLists();enhanceExamQuestionList()}
function scheduleQuestionDisclosures(){(window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(()=>{scrubLegacyGamification();installQuestionDisclosures()})}
function patchQuestionListRenderers(){
  if(window.__MM_QUESTION_LIST_RENDER_PATCH__)return;
  if(typeof window.renderScenarios==='function'){
    const baseScenarios=window.renderScenarios;
    window.renderScenarios=function(){const r=baseScenarios.apply(this,arguments);scheduleQuestionDisclosures();return r};
  }
  if(window.MM_RUNTIME_V2?.after)window.MM_RUNTIME_V2.after('startExam',scheduleQuestionDisclosures);
  else if(typeof window.startExam==='function'){
    const baseStartExam=window.startExam;
    window.startExam=function(){const r=baseStartExam.apply(this,arguments);scheduleQuestionDisclosures();return r};
  }
  window.__MM_QUESTION_LIST_RENDER_PATCH__=true;
}
function installMobileLayoutGuard(){
  document.documentElement.classList.add('mm-mobile-layout-guard');
}
function syncVisibleViewChrome(){
  const home=document.getElementById('dashboard'),isHome=!!home&&!home.classList.contains('hidden');document.body?.classList.toggle('mm-home-visible',isHome);
  if(window.MM_APP_SHELL?.finalized)return;
  document.querySelectorAll('.mobile-nav button[data-view]').forEach(button=>{const target=button.dataset.view,view=target?document.getElementById(target):null,active=!!view&&!view.classList.contains('hidden');button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')})
}
function dockReferenceLauncher(){
  const open=document.getElementById('mm-src-open');if(!open)return;
  if(isMobileNav()){open.style.display='none';open.setAttribute('aria-hidden','true');open.tabIndex=-1;open.dataset.mmDocked='mobile-hidden-unified-reference-page';return}
  open.removeAttribute('aria-hidden');open.tabIndex=0;const sidebar=document.querySelector('.sidebar-foot'),dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');if(!dock)return;
  if(open.parentElement!==dock)dock.appendChild(open);open.style.position='static';open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';open.style.zIndex='auto';open.style.pointerEvents='auto';open.style.width=sidebar?'100%':'auto';open.style.margin=sidebar?'12px 0 0':'0';open.style.display=sidebar?'flex':'inline-flex';open.style.justifyContent='center';open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content'
}
function configureReferenceDrawer(){
  const modal=document.querySelector('.mmsrc');if(!modal)return;modal.classList.add('mm-reference-drawer');modal.setAttribute('aria-modal','false');modal.setAttribute('aria-label','MouldMaster references — non-blocking reference drawer');
  modal.dataset.mmNonBlocking='1'
}
function openStandaloneReferenceData(){location.assign(REFERENCE_DATA_URL)}
function dockReferenceDataLauncher(){
  const open=document.getElementById('mmrd-open');if(!open)return;open.style.position='static';open.style.left='auto';open.style.right='auto';open.style.top='auto';open.style.bottom='auto';open.style.zIndex='auto';open.style.pointerEvents='auto';
  if(isMobileNav()){open.style.display='none';open.style.width='auto';open.style.margin='0';open.dataset.mmDocked='mobile-more-standalone-page';return}
  setText(open,'References');open.setAttribute('aria-label','Open References');const sidebar=document.querySelector('.sidebar-foot'),dock=sidebar||document.querySelector('.top-actions')||document.querySelector('.main');if(!dock)return;if(open.parentElement!==dock)dock.appendChild(open);open.style.width=sidebar?'100%':'auto';open.style.margin=sidebar?'8px 0 0':'0';open.style.display=sidebar?'flex':'inline-flex';open.style.justifyContent='center';open.dataset.mmDocked=sidebar?'sidebar':dock.classList.contains('top-actions')?'topbar':'content'
}
function configureReferenceDataDrawer(){
  const modal=document.querySelector('.mmrd');if(!modal)return;modal.classList.add('mm-reference-data-drawer');modal.setAttribute('aria-modal','false');modal.setAttribute('aria-label','MouldMaster references');if(isMobileNav())modal.dataset.open='0';
  modal.dataset.mmNonBlocking='1'
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
function runSync(){syncQueued=false;syncPlatformClasses();syncLabels();syncStandardsReviewDate();syncUpdateCard();hideInternalQaProvenance();patchQuestionListRenderers();retireLegacyGamification();installMobileLayoutGuard();scrubLegacyGamification();installQuestionDisclosures();syncVisibleViewChrome();dockReferenceLauncher();configureReferenceDrawer();dockReferenceDataLauncher();configureReferenceDataDrawer();addNZLegacyNote()}
function scheduleSync(){if(syncQueued)return;syncQueued=true;(window.requestAnimationFrame||function(fn){return setTimeout(fn,0)})(runSync)}
function bindLifecycle(){
  const shell=window.MM_APP_SHELL;
  shell?.events?.onViewChange?.(scheduleSync);
  for(const view of ['dashboard','scenarios','standards','materials','profile','exams'])shell?.events?.onRender?.(view,scheduleSync);
  window.addEventListener('mm:domains-ready',scheduleSync,{once:true});
}
patchStandards();bindLifecycle();
runSync();
window.addEventListener('resize',scheduleSync,{passive:true});
window.addEventListener('load',()=>{runSync();register();setTimeout(scheduleSync,250)},{once:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync()});
window.MM_SHELL_RELEASE=RELEASE;window.MM_CONTENT_RELEASE=CONTENT;window.MM_DISPLAY_CONTEXT=displayContext;window.MM_REFERENCE_LAUNCHER_DOCK='sidebar-first-normal-flow';window.MM_REFERENCE_DRAWER_MODE='non-blocking';window.MM_REFERENCE_DATA_URL=REFERENCE_DATA_URL;window.MM_REFERENCE_DATA_LAUNCHER_DOCK='mobile-more-standalone-page';window.MM_REFERENCE_DATA_DRAWER_MODE='standalone-mobile-page-desktop-drawer';window.MM_BROWSER_UPDATE_MODE='shared-origin-service-worker';window.MM_MOBILE_LAYOUT_GUARD='home-task-first-fixed-nav-clearance-v2';window.MM_IOS_LAYOUT_PATCH='safe-area-viewport-profile-v1';window.MM_UI_POLISH='compact-shell-no-gamification-v1';window.MM_QUESTION_DISCLOSURES='mobile-scenario-and-exam-v1';window.MM_GAMIFICATION_MODE='retired';
})();