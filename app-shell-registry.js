/* MouldMaster canonical app-shell registry — 2026.08.26.4 */
(function(){
'use strict';
if(window.MM_APP_SHELL)return;

const VERSION='2026.08.26.4';
const captured={
  renderDashboard:typeof renderDashboard==='function'?renderDashboard:null,
  renderLesson:typeof renderLesson==='function'?renderLesson:null,
  switchView:typeof switchView==='function'?switchView:null,
  openMobileMenu:typeof openMobileMenu==='function'?openMobileMenu:null
};
if(!captured.renderDashboard||!captured.renderLesson||!captured.switchView||!captured.openMobileMenu){
  throw new Error('app-shell-registry.js requires the canonical core UI functions');
}

const dashboardSections=new Map();
const navigationItems=new Map();
const viewListeners=new Set();
const renderListeners=new Map();
let finalized=false;
let activeCustomId='';
let mobileNavObserver=null;
let geometryQueued=false;
let dashboardComposeQueued=false;

const CORE_NAV=[
  {id:'home',view:'dashboard',mobile:'home'},
  {id:'learn',view:'path',mobile:'learn'},
  {id:'practice',view:'scenarios',mobile:'practice'},
  {id:'lesson',view:'lesson',mobile:'learn'},
  {id:'defects',view:'defects',mobile:'practice'},
  {id:'simulator',view:'simulator',mobile:'practice'},
  {id:'materials',view:'materials',mobile:'learn'},
  {id:'exams',view:'exams',mobile:'more'},
  {id:'certificates',view:'certificates',mobile:'more'},
  {id:'profile',view:'profile',mobile:'more'},
  {id:'standards',view:'standards',mobile:'more'}
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeCall(fn,...args){try{return typeof fn==='function'?fn(...args):undefined}catch(e){console.warn('[MouldMaster shell]',e);return undefined}}

function installGeometry(){
  if(document.getElementById('mm-app-shell-registry-style'))return;
  const s=document.createElement('style');s.id='mm-app-shell-registry-style';s.textContent=`
:root{--mm-mobile-nav-height:calc(70px + env(safe-area-inset-bottom));--mm-mobile-nav-clearance:var(--mm-mobile-nav-height);--mm-mobile-content-clearance:calc(var(--mm-mobile-nav-clearance) + 26px)}
.mm-dashboard-registry{display:grid;gap:14px}.mm-dashboard-registry:empty{display:none}
.mm-registry-nav-divider{height:1px;background:#20344d;margin:9px 8px}
@media(max-width:700px){
  html{scroll-padding-bottom:calc(var(--mm-mobile-content-clearance) + 12px)!important}
  body{padding-bottom:0!important}
  .main{padding-bottom:var(--mm-mobile-content-clearance)!important}
  .mobile-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;min-height:var(--mm-mobile-nav-height);z-index:40!important;background:#07101c!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important;box-shadow:0 -12px 28px rgba(0,0,0,.30),0 90px 0 #07101c!important}
  .mobile-nav>button:not([data-view]):not([onclick*="openMobileMenu"]):not([data-mm-onclick*="openMobileMenu"]){display:none!important}
  body[data-mm-view="dashboard"] #continueBtn{display:none!important}
  .mm-mobile-actions{bottom:var(--mm-mobile-nav-clearance)!important;z-index:35!important;padding-bottom:9px!important}
  #lesson .lesson-body{padding-bottom:calc(var(--mm-mobile-content-clearance) + 86px)!important}
  .toast{bottom:calc(var(--mm-mobile-content-clearance) + 12px)!important}
}
`;
  document.head.appendChild(s)
}
function syncMobileGeometry(){
  if(geometryQueued)return;geometryQueued=true;
  requestAnimationFrame(()=>{
    geometryQueued=false;
    const nav=document.querySelector('.mobile-nav');if(!nav||!window.matchMedia?.('(max-width:700px)').matches)return;
    const h=Math.ceil(nav.getBoundingClientRect().height);
    if(h>0)document.documentElement.style.setProperty('--mm-mobile-nav-height',`${h}px`)
  })
}
function canonicalMoreButton(button){const handler=button.getAttribute('data-mm-onclick')||button.getAttribute('onclick')||'';return !button.dataset.view&&(handler.includes('openMobileMenu')||/\bMore\b/i.test(button.textContent||''))}
function normalizeMobilePrimaryNav(){
  const nav=document.querySelector('.mobile-nav');if(!nav)return;
  [...nav.querySelectorAll(':scope > button')].forEach(button=>{
    const view=button.dataset.view||'';
    const keep=view==='dashboard'||view==='path'||view==='scenarios'||canonicalMoreButton(button);
    if(!keep)button.remove()
  });
  if(!mobileNavObserver){
    mobileNavObserver=new MutationObserver(()=>{normalizeMobilePrimaryNav();syncMobileGeometry()});
    mobileNavObserver.observe(nav,{childList:true})
  }
  syncMobileGeometry()
}

function ensureDashboardHosts(root){
  let before=root.querySelector(':scope > #mmDashboardRegistryBefore');
  let after=root.querySelector(':scope > #mmDashboardRegistryAfter');
  if(!before){before=document.createElement('div');before.id='mmDashboardRegistryBefore';before.className='mm-dashboard-registry';root.prepend(before)}
  if(!after){after=document.createElement('div');after.id='mmDashboardRegistryAfter';after.className='mm-dashboard-registry';root.append(after)}
  return {before,after}
}
function existingDashboardSlot(root,id){return [...root.querySelectorAll('.mm-dashboard-slot')].find(x=>x.dataset.mmDashboardSection===id)||null}
function releaseDashboardSlot(root,slot){
  if(slot.dataset.mmDashboardAdopt==='1'){
    const after=root.querySelector(':scope > #mmDashboardRegistryAfter');
    while(slot.firstChild)root.insertBefore(slot.firstChild,after||null)
  }
  slot.remove()
}
function materialize(section,slot,root){
  slot.dataset.mmDashboardSection=section.id;
  slot.dataset.mmDashboardOrder=String(section.order||50);
  slot.dataset.mmDashboardAdopt=section.adopt?'1':'0';
  if(section.adopt){
    const owned=[...slot.children].find(node=>node.matches?.(section.adopt));
    if(owned)return;
    const node=root.querySelector(section.adopt);
    if(node&&node!==slot)slot.appendChild(node);
    return
  }
  slot.innerHTML='';
  const out=safeCall(section.render,slot,root);
  if(typeof out==='string')slot.innerHTML=out;
  else if(out instanceof Node)slot.appendChild(out)
}
function composeDashboard(){
  const root=document.getElementById('dashboard');if(!root)return;
  const {before,after}=ensureDashboardHosts(root);
  const sections=[...dashboardSections.values()].filter(section=>!section.when||safeCall(section.when)!==false).sort((a,b)=>(a.order||50)-(b.order||50));
  const desired=new Set(sections.map(section=>section.id));
  for(const slot of [...root.querySelectorAll('.mm-dashboard-slot')])if(!desired.has(slot.dataset.mmDashboardSection))releaseDashboardSlot(root,slot);
  for(const section of sections){
    const host=section.zone==='after'?after:before;
    let slot=existingDashboardSlot(root,section.id);
    if(!slot){slot=document.createElement('div');slot.className='mm-dashboard-slot'}
    host.appendChild(slot);
    materialize(section,slot,root)
  }
}
function queueDashboardCompose(){
  if(!finalized||dashboardComposeQueued)return;
  dashboardComposeQueued=true;
  requestAnimationFrame(()=>{dashboardComposeQueued=false;composeDashboard()})
}
function registerDashboard(section){
  if(!section||!section.id)throw new Error('Dashboard registry entries require id');
  dashboardSections.set(section.id,{zone:'before',order:50,...section});
  queueDashboardCompose();
  return ()=>{dashboardSections.delete(section.id);queueDashboardCompose()}
}

function registerNavigation(item){
  if(!item||!item.id)throw new Error('Navigation registry entries require id');
  navigationItems.set(item.id,{desktop:true,mobileMore:true,order:50,...item});
  if(finalized)syncNavigation();
  return ()=>{navigationItems.delete(item.id);if(finalized)syncNavigation()}
}
function removeLegacyDynamicNav(){
  document.querySelectorAll('#nav [data-mm-diagnostic-labs],#nav [data-mm-process-data],#nav [data-mm-material-labs],#nav [data-mm-learning-insights],#nav [data-mm-mould-master]').forEach(x=>x.remove())
}
function desktopAnchor(item){
  const nav=document.getElementById('nav');if(!nav)return null;
  if(item.anchorSelector)return nav.querySelector(item.anchorSelector);
  if(item.group==='progress')return nav.querySelector('button[data-view="profile"]')||nav.querySelector('.more-nav');
  return nav.querySelector('button[data-view="scenarios"]')
}
function makeDesktopButton(item){
  const b=document.createElement('button');b.type='button';b.dataset.mmRegistryNav=item.id;
  if(item.legacyDataset)b.dataset[item.legacyDataset]='1';
  b.innerHTML=`${esc(item.icon||'•')} <span>${esc(item.label||item.id)}</span>`;
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();activeCustomId=item.id;safeCall(item.action);syncActiveState()});
  return b
}
function syncDesktopNavigation(){
  const nav=document.getElementById('nav');if(!nav)return;
  removeLegacyDynamicNav();
  nav.querySelectorAll('[data-mm-registry-nav]').forEach(x=>x.remove());
  const items=[...navigationItems.values()].filter(x=>x.desktop!==false).sort((a,b)=>(a.order||50)-(b.order||50));
  let lastPractice=null,lastProgress=null;
  for(const item of items){
    const b=makeDesktopButton(item);const anchor=desktopAnchor(item);
    if(item.group==='progress'){
      if(lastProgress)lastProgress.insertAdjacentElement('afterend',b);else if(anchor)anchor.insertAdjacentElement('beforebegin',b);else nav.appendChild(b);lastProgress=b
    }else{
      if(lastPractice)lastPractice.insertAdjacentElement('afterend',b);else if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.appendChild(b);lastPractice=b
    }
  }
}
function mobileGrid(){return document.querySelector('#modal .modal-card .grid2')}
function makeMobileMoreButton(item){
  const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmRegistryMenu=item.id;
  b.innerHTML=`<span class="icon">${esc(item.icon||'•')}</span><b>${esc(item.label||item.id)}</b><small>${esc(item.description||'Open this tool.')}</small>`;
  b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}activeCustomId=item.id;safeCall(item.action);syncActiveState()});return b
}
function populateMobileMore(){
  requestAnimationFrame(()=>{
    const grid=mobileGrid();if(!grid)return;
    grid.querySelectorAll('[data-mm-registry-menu],[data-mm-diagnostic-menu],[data-mm-process-data-menu],[data-mm-material-menu],[data-mm-learning-insights-menu],[data-mm-reference-data-menu]').forEach(x=>x.remove());
    const items=[...navigationItems.values()].filter(x=>x.mobileMore!==false).sort((a,b)=>(a.order||50)-(b.order||50));
    for(const item of items)grid.appendChild(makeMobileMoreButton(item))
  })
}
function visibleCoreView(){
  for(const item of CORE_NAV){
    const el=document.getElementById(item.view);
    if(el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none')return item.view;
  }
  return ''
}
function canonicalMobileGroup(view){
  const item=navigationItems.get(activeCustomId);if(item)return item.mobileGroup||'more';
  const core=CORE_NAV.find(x=>x.view===view);return core?.mobile||'more'
}
function syncActiveState(){
  normalizeMobilePrimaryNav();
  const visible=visibleCoreView();
  const view=visible||(typeof currentView==='string'?currentView:'dashboard');
  document.body.dataset.mmView=activeCustomId||view;
  document.querySelectorAll('#nav button').forEach(b=>{
    const registryId=b.dataset.mmRegistryNav;
    const active=registryId?registryId===activeCustomId:!activeCustomId&&b.dataset.view===view;
    b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')
  });
  const group=canonicalMobileGroup(view);
  const primary=[...document.querySelectorAll('.mobile-nav > button')];
  primary.forEach(b=>{
    const v=b.dataset.view;let match=false;
    if(group==='home')match=v==='dashboard';
    else if(group==='learn')match=v==='path';
    else if(group==='practice')match=v==='scenarios';
    else if(group==='more')match=canonicalMoreButton(b);
    b.classList.toggle('active',match);if(match)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')
  });
  syncMobileGeometry()
}
function syncNavigation(){installGeometry();syncDesktopNavigation();normalizeMobilePrimaryNav();syncActiveState()}

function onViewChange(fn){viewListeners.add(fn);return ()=>viewListeners.delete(fn)}
function onRender(view,fn){if(!renderListeners.has(view))renderListeners.set(view,new Set());renderListeners.get(view).add(fn);return ()=>renderListeners.get(view)?.delete(fn)}
function emitView(id){for(const fn of viewListeners)safeCall(fn,id)}
function emitRender(id){for(const fn of renderListeners.get(id)||[])safeCall(fn,id)}

function bindExternalTool(id,apiName){
  const api=window[apiName];if(!api||typeof api.open!=='function'||api.__mmShellBound)return;
  const base=api.open;
  api.open=function(){activeCustomId=id;const r=base.apply(this,arguments);syncActiveState();requestAnimationFrame(syncActiveState);emitView(id);return r};
  api.__mmShellBound=true
}
function bindExternalTools(){
  bindExternalTool('mould-master','MM_MOULD_MASTER_WORKSPACE');
  bindExternalTool('diagnostic-labs','MM_DIAGNOSTIC_LABS');
  bindExternalTool('process-data','MM_PROCESS_DATA_DIAGNOSTICS');
  bindExternalTool('material-labs','MM_MATERIAL_BEHAVIOUR_LABS')
}

function curriculumLessonAdapter(){
  const api=window.MM_CURRICULUM_INTEGRATION;if(!api?.recommendations||typeof currentLesson!=='function')return;
  const lesson=currentLesson(),root=document.getElementById('lesson');if(!lesson||!root||root.querySelector('#mmCurriculumPractice'))return;
  const recs=api.recommendations(lesson.id).slice(0,2);if(!recs.length)return;
  const notes=root.querySelector('#mmNotes')||[...root.querySelectorAll('.lesson-body h3')].find(h=>h.textContent.trim()==='Your lesson notes');if(!notes)return;
  const cards=recs.map((r,i)=>`<article class="mm-curriculum-card"><span class="eyebrow">${i===0?'Closest practice':'Second evidence angle'}</span><h4>${esc(r.title||r.id)}</h4><p>${esc(r.why||'Apply the lesson in guided formative practice.')}</p><button class="secondary" type="button" data-mm-curriculum-open="${esc(r.type)}" data-mm-curriculum-id="${esc(r.id)}">Open practice →</button></article>`).join('');
  notes.insertAdjacentHTML('beforebegin',`<section class="mm-curriculum-section" id="mmCurriculumPractice" aria-label="Linked curriculum practice"><div class="mm-curriculum-head"><div><span class="eyebrow">Theory → practice → evidence</span><h3>Apply this lesson</h3><p>Use two guided activities to test the mechanism, then return and explain which evidence changed your conclusion.</p></div><span class="pill">2 linked activities</span></div><div class="mm-curriculum-grid">${cards}</div><div class="mm-curriculum-boundary"><b>Learning boundary:</b> linked practice is optional formative learning. It does not change formal assessment answers, certificate rules or production setpoints.</div></section>`);
  root.querySelectorAll('[data-mm-curriculum-open]').forEach(b=>b.addEventListener('click',()=>api.open?.(b.dataset.mmCurriculumOpen,b.dataset.mmCurriculumId,lesson.id)));
  const jumps=root.querySelector('.mm-learning-jumps');if(jumps&&!jumps.querySelector('[data-mm-curriculum-jump]')){const b=document.createElement('button');b.type='button';b.dataset.mmCurriculumJump='1';b.textContent='Linked practice';b.addEventListener('click',()=>document.getElementById('mmCurriculumPractice')?.scrollIntoView({behavior:'smooth',block:'start'}));jumps.appendChild(b)}
}
function curriculumDashboardHtml(){
  const api=window.MM_CURRICULUM_INTEGRATION;if(!api?.recommendations||typeof currentLesson!=='function')return '';
  const lesson=currentLesson(),rec=api.recommendations(lesson.id)[0];if(!rec)return '';
  return `<section class="mm-curriculum-focus" aria-label="Current lesson practice connection"><div><span class="eyebrow">Learning loop</span><b>After ${esc(lesson.title)}: ${esc(rec.title||rec.id)}</b><p>Move from the lesson explanation into guided practice, then return to explain what evidence changed your conclusion.</p></div><button class="ghost" type="button" data-mm-curriculum-dashboard-open>Open linked practice</button></section>`
}
function specialistDashboardHtml(){
  const api=window.MM_SPECIALIST_CURRICULUM;if(!api?.lessons?.length)return '';
  return `<section class="mm-specialist-strip" id="mmSpecialistDashboard" aria-label="Specialist curriculum extensions"><span class="mm-specialist-eyebrow">Go deeper where the core stops</span><h3>Specialist extensions</h3><p>The 120-lesson core remains the complete main pathway. These ${api.lessons.length} optional extensions add depth in safety, machine health, materials, measurement, tooling and sustainability.</p><div class="mm-specialist-meta"><span>${api.lessons.length} optional lessons</span><span>Local optional progress</span><span>No certificate requirement</span></div><button class="secondary" type="button" data-mm-specialist-open>Explore specialist extensions →</button></section>`
}

function installDefaultDashboardSections(){
  registerDashboard({id:'today-focus',zone:'before',order:10,adopt:'.mm-today-focus'});
  registerDashboard({id:'task-hub',zone:'before',order:20,adopt:'.mm-home-task-hub'});
  registerDashboard({id:'curriculum-focus',zone:'before',order:30,render:slot=>{slot.innerHTML=curriculumDashboardHtml();slot.querySelector('[data-mm-curriculum-dashboard-open]')?.addEventListener('click',()=>{const lesson=currentLesson(),rec=window.MM_CURRICULUM_INTEGRATION?.recommendations?.(lesson.id)?.[0];if(rec)window.MM_CURRICULUM_INTEGRATION.open?.(rec.type,rec.id,lesson.id)})}});
  registerDashboard({id:'specialist',zone:'after',order:90,render:slot=>{slot.innerHTML=specialistDashboardHtml();slot.querySelector('[data-mm-specialist-open]')?.addEventListener('click',()=>window.MM_SPECIALIST_CURRICULUM?.open?.())}})
}
function installDefaultNavigation(){
  registerNavigation({id:'mould-master',label:'Mould Master',icon:'◆',description:'Build an evidence-led troubleshooting case.',order:10,group:'practice',legacyDataset:'mmMouldMaster',mobileGroup:'practice',action:()=>window.MM_MOULD_MASTER_WORKSPACE?.open?.()});
  registerNavigation({id:'diagnostic-labs',label:'Diagnostic labs',icon:'⌁',description:'Practise evidence-first troubleshooting.',order:20,group:'practice',legacyDataset:'mmDiagnosticLabs',mobileGroup:'practice',action:()=>window.MM_DIAGNOSTIC_LABS?.open?.()});
  registerNavigation({id:'process-data',label:'Data diagnosis',icon:'⌁',description:'Read process trends and choose the next evidence check.',order:30,group:'practice',legacyDataset:'mmProcessData',mobileGroup:'practice',action:()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.()});
  registerNavigation({id:'material-labs',label:'Material labs',icon:'◈',description:'Compare resin-specific behaviour and evidence.',order:40,group:'practice',legacyDataset:'mmMaterialLabs',mobileGroup:'practice',action:()=>window.MM_MATERIAL_BEHAVIOUR_LABS?.open?.()});
  registerNavigation({id:'reference-data',label:'Reference data',icon:'▤',description:'Materials, defects, signals and troubleshooting data.',order:50,group:'progress',desktop:false,mobileGroup:'more',action:()=>location.assign('./reference-data.html')});
  registerNavigation({id:'learning-insights',label:'Learning insights',icon:'◫',description:'See local learning progress and retry trends.',order:60,group:'progress',legacyDataset:'mmLearningInsights',mobileGroup:'more',action:()=>window.MM_LEARNING_ANALYTICS?.open?.()});
  registerNavigation({id:'repair-app-files',label:'Repair app files',icon:'↻',description:'Refresh installed files without deleting learner progress.',order:70,group:'progress',desktop:false,mobileGroup:'more',action:()=>location.assign('./repair.html')})
}

function renderDashboardCanonical(){
  activeCustomId='';captured.renderDashboard.apply(this,arguments);
  safeCall(window.MM_LEARNING_EXPERIENCE?.decorateDashboard);
  composeDashboard();syncActiveState();emitRender('dashboard')
}
function renderLessonCanonical(){
  activeCustomId='';captured.renderLesson.apply(this,arguments);
  safeCall(window.MM_LEARNING_EXPERIENCE?.decorateLesson);
  curriculumLessonAdapter();syncActiveState();requestAnimationFrame(syncActiveState);emitRender('lesson')
}
function switchViewCanonical(id){
  activeCustomId='';const r=captured.switchView.apply(this,arguments);syncActiveState();requestAnimationFrame(syncActiveState);emitView(id);return r
}
function openMobileMenuCanonical(){const r=captured.openMobileMenu.apply(this,arguments);populateMobileMore();return r}

function setCustomActive(id,mobileGroup){activeCustomId=id||'';if(mobileGroup&&navigationItems.has(id))navigationItems.get(id).mobileGroup=mobileGroup;syncActiveState();emitView(id)}

function finalize(){
  if(finalized)return;
  installGeometry();installDefaultDashboardSections();installDefaultNavigation();bindExternalTools();
  renderDashboard=renderDashboardCanonical;window.renderDashboard=renderDashboardCanonical;
  renderLesson=renderLessonCanonical;window.renderLesson=renderLessonCanonical;
  switchView=switchViewCanonical;window.switchView=switchViewCanonical;
  openMobileMenu=openMobileMenuCanonical;window.openMobileMenu=openMobileMenuCanonical;
  window.__MM_DIAGNOSTIC_MORE_PATCH__=true;window.__MM_PROCESS_DATA_MORE_PATCH__=true;window.__MM_MATERIAL_MORE_PATCH__=true;window.__MM_REFERENCE_DATA_MORE_PATCH__=true;window.__MM_LEARNING_INSIGHTS_MORE__=true;
  finalized=true;
  syncNavigation();window.addEventListener('resize',syncMobileGeometry,{passive:true});
  try{if(typeof currentView==='string'&&currentView==='dashboard')renderDashboardCanonical();else if(currentView==='lesson')renderLessonCanonical();else syncActiveState()}catch(e){console.warn('[MouldMaster shell] initial canonical render failed',e)}
}

window.MM_APP_SHELL={version:VERSION,captured:Object.freeze({...captured}),dashboard:{register:registerDashboard,compose:composeDashboard,requestCompose:queueDashboardCompose,sections:dashboardSections},navigation:{register:registerNavigation,sync:syncNavigation,items:navigationItems,setCustomActive},events:{onViewChange,onRender},geometry:{mobileNavHeight:'--mm-mobile-nav-height',mobileNavClearance:'--mm-mobile-nav-clearance',contentClearance:'--mm-mobile-content-clearance',sync:syncMobileGeometry},finalize,get finalized(){return finalized}};
})();
