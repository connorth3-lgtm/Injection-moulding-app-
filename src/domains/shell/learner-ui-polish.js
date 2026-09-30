/* MouldMaster learner UI polish — 2026.09.30.8
 * Presentation/navigation refinement only. Evidence, assessment, safety and
 * production-authority semantics remain owned by their governed runtimes.
 */
(function(){
'use strict';
if(window.MM_LEARNER_UI_POLISH)return;
const VERSION='2026.09.30.8';
const DESKTOP_QUERY='(min-width:1101px)';
const WIDE_QUERY='(min-width:701px)';
let queued=false;

function ensureStyles(){
  if(document.querySelector('link[data-mm-learner-ui-polish]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`./src/domains/shell/learner-ui-polish.css?v=${encodeURIComponent(VERSION)}`;
  link.dataset.mmLearnerUiPolish=VERSION;
  document.head.appendChild(link);
}
function wide(){return !!window.matchMedia?.(WIDE_QUERY).matches}
function desktop(){return !!window.matchMedia?.(DESKTOP_QUERY).matches}
function safe(fn){try{return typeof fn==='function'?fn():undefined}catch(error){console.warn('[MouldMaster UI polish]',error);return undefined}}

function runQuickAction(action){
  switch(action){
    case 'practice': return safe(()=>window.switchView?.('scenarios'));
    case 'book': return safe(()=>window.MMBook?.open?.());
    case 'materials': return safe(()=>window.MM_MATERIAL_REGISTRY?.openPage?.({replaceUrl:true})||window.switchView?.('materials'));
    case 'mould-master': return safe(()=>window.MM_MOULD_MASTER_WORKSPACE?.open?.()||window.switchView?.('defects'));
    case 'process-data': return safe(()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
    case 'learn': return safe(()=>window.switchView?.('path'));
    case 'saved': return safe(()=>window.switchView?.('profile'));
    case 'recent-case': {
      const row=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()?.[0];
      return safe(()=>row?window.MM_MOULD_MASTER_WORKSPACE?.open?.(row.id):window.MM_MOULD_MASTER_WORKSPACE?.open?.());
    }
  }
}
function homeActivity(){
  const active=typeof user==='object'&&user?user:null,data=typeof D==='object'&&D?D:null;
  const completed=Array.isArray(active?.completed)?active.completed.length:0;
  const total=Array.isArray(data?.lessons)?data.lessons.length:120;
  const saved=Array.isArray(active?.bookmarks)?active.bookmarks.length:0;
  const cases=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()||[];
  const recent=cases[0]||null;
  return {completed,total,saved,cases:cases.length,recent}
}
function homeBalanceMarkup(){
  return `<div class="mm-home-balance-copy"><div><span class="eyebrow">Workbench</span><h2>Tools & shortcuts</h2><p>Jump to troubleshooting, materials or process evidence without losing your place in learning.</p></div><div class="mm-home-snapshot" aria-label="Your local activity"><span><b data-mm-home-stat="lessons">0/120</b><small>lessons</small></span><span><b data-mm-home-stat="cases">0</b><small>cases</small></span><span><b data-mm-home-stat="saved">0</b><small>saved</small></span></div></div><div class="mm-home-balance-grid"><button type="button" data-mm-home-action="mould-master"><span class="mm-home-balance-icon" aria-hidden="true">◆</span><span><b>Troubleshoot</b><small>Open Mould Master and build an evidence-led case.</small></span></button><button type="button" data-mm-home-action="materials"><span class="mm-home-balance-icon" aria-hidden="true">⬡</span><span><b>Materials</b><small>Search exact grades, evidence and comparisons.</small></span></button><button type="button" data-mm-home-action="process-data"><span class="mm-home-balance-icon" aria-hidden="true">⌁</span><span><b>Analyse data</b><small>Read measured process trends and recovery evidence.</small></span></button><button type="button" data-mm-home-action="practice"><span class="mm-home-balance-icon" aria-hidden="true">◎</span><span><b>Practice</b><small>Work one evidence-first shop-floor decision.</small></span></button></div><div data-mm-home-recent-slot hidden></div><div class="mm-home-link-row"><button type="button" class="ghost" data-mm-home-action="learn">Browse learning</button><button type="button" class="ghost" data-mm-home-action="saved">Saved lessons</button><button type="button" class="ghost" data-mm-home-action="book">Reference book</button></div>`;
}
function syncHomeBalanceContent(panel){
  const a=homeActivity();
  const setStat=(name,value)=>{
    const el=panel.querySelector(`[data-mm-home-stat="${name}"]`);
    const next=String(value);
    if(el&&el.textContent!==next)el.textContent=next;
  };
  setStat('lessons',`${a.completed}/${a.total}`);
  setStat('cases',a.cases);
  setStat('saved',a.saved);

  const slot=panel.querySelector('[data-mm-home-recent-slot]');
  if(!slot)return;
  let button=slot.querySelector('[data-mm-home-action="recent-case"]');
  if(!a.recent){
    button?.remove();
    slot.hidden=true;
    return;
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='mm-home-recent';
    button.dataset.mmHomeAction='recent-case';
    button.innerHTML='<span><span class="eyebrow">Recent case</span><b data-mm-home-recent-title></b><small data-mm-home-recent-status></small></span><span aria-hidden="true">→</span>';
    slot.appendChild(button);
  }
  const title=button.querySelector('[data-mm-home-recent-title]');
  const status=button.querySelector('[data-mm-home-recent-status]');
  const nextTitle=String(a.recent.title||'Untitled troubleshooting case');
  const nextStatus=`${String(a.recent.status||'Investigating')} · continue where you left off`;
  if(title&&title.textContent!==nextTitle)title.textContent=nextTitle;
  if(status&&status.textContent!==nextStatus)status.textContent=nextStatus;
  slot.hidden=false;
}
function syncHomeBalance(){
  const root=document.getElementById('dashboard');if(!root)return;
  let panel=root.querySelector('[data-mm-home-balance]');
  if(!panel){
    panel=document.createElement('section');
    panel.className='card mm-home-balance';
    panel.dataset.mmHomeBalance=VERSION;
    panel.setAttribute('aria-label','Moulding workbench');
    panel.innerHTML=homeBalanceMarkup();
    panel.addEventListener('click',event=>{const button=event.target?.closest?.('[data-mm-home-action]');if(button)runQuickAction(button.dataset.mmHomeAction)});
  }
  panel.dataset.mmHomeBalance=VERSION;
  syncHomeBalanceContent(panel);
  const focus=root.querySelector('.mm-today-focus');
  const focusSlot=focus?.closest?.('.mm-dashboard-slot'),anchor=focusSlot||focus;
  if(anchor&&panel.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',panel);
  else if(!anchor&&!panel.isConnected)root.prepend(panel);
}

function syncBookDisclosure(){
  const view=document.getElementById('mmBookView');
  if(!view)return;
  const hero=view.querySelector('[data-mm-book-hero]');
  if(hero){
    const title=hero.querySelector(':scope > h2');
    if(title&&!title.dataset.mmUiPolished){
      title.textContent='Injection moulding: foundations to advanced troubleshooting';
      title.dataset.mmUiPolished='1';
    }
    const intro=[...hero.querySelectorAll(':scope > p')].find(p=>!p.matches('[data-mm-book-summary],[data-mm-book-sme-status]'));
    if(intro&&!intro.dataset.mmUiPolished){
      intro.textContent='A practical chapter reference with evidence, applicability and review boundaries available when you need them.';
      intro.dataset.mmUiPolished='1';
    }
    const summary=hero.querySelector('[data-mm-book-summary]');
    const sme=hero.querySelector('[data-mm-book-sme-status]');
    let details=hero.querySelector('.mm-book-governance');
    if((summary||sme)&&!details){
      details=document.createElement('details');
      details.className='mm-book-governance';
      const heading=document.createElement('summary');
      heading.innerHTML='<b>Publication & review status</b><span>Evidence and independent-review details</span>';
      const body=document.createElement('div');
      body.className='mm-book-governance-body';
      details.append(heading,body);
      const actions=hero.querySelector('.mm-book-hero-actions');
      actions?.insertAdjacentElement('beforebegin',details)||hero.appendChild(details);
    }
    const body=details?.querySelector('.mm-book-governance-body');
    if(body){
      if(summary&&summary.parentElement!==body)body.appendChild(summary);
      if(sme&&sme.parentElement!==body)body.appendChild(sme);
      if(!body.querySelector('[data-mm-book-boundary-note]')){
        const note=document.createElement('p');
        note.dataset.mmBookBoundaryNote='1';
        note.className='muted tiny';
        note.textContent='Evidence verification does not replace current machine, mould, material, hot-runner, workplace or independent-human review requirements.';
        body.appendChild(note);
      }
    }
    const listen=hero.querySelector('[data-mm-book-mode="listen"]');
    if(listen&&!listen.disabled&&listen.textContent!=='Listen to Book')listen.textContent='Listen to Book';
  }

  const accuracy=view.querySelector('[data-mm-book-accuracy]');
  if(accuracy&&!accuracy.querySelector('.mm-book-assurance-details')){
    const details=document.createElement('details');
    details.className='mm-book-assurance-details';
    const summary=document.createElement('summary');
    summary.innerHTML='<b>Accuracy & assurance boundary</b><span>What “evidence verified” does and does not mean</span>';
    const body=document.createElement('div');
    body.className='mm-book-assurance-body';
    while(accuracy.firstChild)body.appendChild(accuracy.firstChild);
    details.append(summary,body);
    accuracy.appendChild(details);
  }
  if(!view.classList.contains('hidden')&&document.getElementById('pageTitle')?.textContent==='Book'){
    const subtitle=document.getElementById('pageSubtitle');
    const text='Evidence-governed injection moulding reference.';
    if(subtitle&&subtitle.textContent!==text)subtitle.textContent=text;
  }
}

const PRIMARY_DESKTOP_VIEWS=new Set(['dashboard','path','materials','scenarios']);
function hideNavButton(button,hidden){
  if(!button)return;
  if(hidden){
    if(button.dataset.mmUiPolishHidden!=='1'){
      button.dataset.mmUiPolishHidden='1';
      button.dataset.mmUiPolishPrevHidden=button.hidden?'1':'0';
      button.dataset.mmUiPolishPrevAria=button.hasAttribute('aria-hidden')?button.getAttribute('aria-hidden'):'__none__';
      button.dataset.mmUiPolishPrevTab=button.hasAttribute('tabindex')?button.getAttribute('tabindex'):'__none__';
    }
    button.hidden=true;button.setAttribute('aria-hidden','true');button.tabIndex=-1;
  }else if(button.dataset.mmUiPolishHidden==='1'){
    button.hidden=button.dataset.mmUiPolishPrevHidden==='1';
    if(button.dataset.mmUiPolishPrevAria==='__none__')button.removeAttribute('aria-hidden');else button.setAttribute('aria-hidden',button.dataset.mmUiPolishPrevAria);
    if(button.dataset.mmUiPolishPrevTab==='__none__')button.removeAttribute('tabindex');else button.setAttribute('tabindex',button.dataset.mmUiPolishPrevTab);
    delete button.dataset.mmUiPolishHidden;delete button.dataset.mmUiPolishPrevHidden;delete button.dataset.mmUiPolishPrevAria;delete button.dataset.mmUiPolishPrevTab;
  }
}
function syncDesktopNavigation(){
  const nav=document.getElementById('nav');if(!nav)return;
  const isDesktop=desktop();
  const labels={dashboard:'Home',path:'Learn',materials:'Materials',scenarios:'Practice'};
  [...nav.querySelectorAll(':scope > button')].forEach(button=>{
    if(button.dataset.mmDesktopMoreTools)return;
    const view=button.dataset.view||'';
    const keep=PRIMARY_DESKTOP_VIEWS.has(view);
    hideNavButton(button,isDesktop&&!keep);
    if(keep&&button.querySelector('span'))button.querySelector('span').textContent=labels[view];
  });
  nav.querySelectorAll(':scope > .nav-group-label,:scope > details.more-nav').forEach(node=>{node.hidden=isDesktop});
  let more=nav.querySelector('[data-mm-desktop-more-tools]');
  if(isDesktop&&!more){
    more=document.createElement('button');more.type='button';more.dataset.mmDesktopMoreTools='1';more.className='mm-desktop-more-tools';
    more.innerHTML='<span class="mm-more-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>More</span>';
    more.addEventListener('click',()=>safe(()=>window.openMobileMenu?.()));nav.appendChild(more);
  }
  if(more)more.hidden=!isDesktop;
}
function visibleViewId(){
  for(const id of ['dashboard','path','materials','lesson','scenarios','simulator','defects','coach','exams','certificates','glossary','profile','standards','visuals','instructor']){
    const el=document.getElementById(id);if(el&&!el.classList.contains('hidden'))return id
  }
  return document.body?.dataset?.mmView||''
}
function syncTopbarContext(){
  const view=visibleViewId(),title=document.getElementById('pageTitle'),subtitle=document.getElementById('pageSubtitle');
  const search=document.getElementById('searchBtn'),continueBtn=document.getElementById('continueBtn');
  const primary={
    dashboard:['Home','Continue learning or jump straight into the moulding task you need.'],
    path:['Learn','Your current lesson first, with the full pathway and resources behind it.'],
    materials:['Materials','Exact-grade catalogue, source evidence, comparisons and material learning.'],
    scenarios:['Practice','Recommended practice first; specialist tools stay one level deeper.']
  };
  if(primary[view]){
    if(title)title.textContent=primary[view][0];
    if(subtitle)subtitle.textContent=primary[view][1];
  }
  if(search)search.hidden=!['dashboard','path'].includes(view);
  if(continueBtn)continueBtn.hidden=!['dashboard','path'].includes(view);
}
function syncFirstRunModal(){
  const root=document.querySelector('.onboarding');
  if(!root||root.dataset.mmProductPolished==='1')return;
  root.dataset.mmProductPolished='1';root.classList.add('mm-onboarding-product');
  const h2=root.querySelector('h2');if(h2)h2.textContent='Set up your learning path';
  const intro=root.querySelector(':scope > p');if(intro){intro.textContent='Three quick choices. You can change them later in Profile.';intro.classList.add('mm-onboarding-intro')}
  const headings=[...root.querySelectorAll('h3')];
  if(headings[0])headings[0].textContent='Experience';
  if(headings[1])headings[1].textContent='Main goal';
  if(headings[2])headings[2].textContent='Typical session';
  const primary=root.querySelector('.hero-buttons .primary');if(primary)primary.textContent='Start my path →';
}
function syncProductStates(){
  document.querySelectorAll('.empty-friendly,.mm-exact-empty,.mm-material-no-match').forEach(el=>el.dataset.mmProductState='empty');
  const failure=document.getElementById('mmStartupFailure');if(failure)failure.dataset.mmProductState='error';
}
function syncReadAloudLabel(){
  const host=document.querySelector('.mm-read-aloud details:not([open]) summary');
  if(host&&!host.getAttribute('aria-label'))host.setAttribute('aria-label','Read aloud');
}
function run(){
  syncHomeBalance();
  syncBookDisclosure();
  syncDesktopNavigation();
  syncTopbarContext();
  syncReadAloudLabel();
  syncProductStates();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;run()});
}
function install(){
  ensureStyles();
  run();
  syncFirstRunModal();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{syncFirstRunModal();syncProductStates()}));
  // Shell render/view lifecycle events cover app-owned mutations. Avoid a whole-body characterData observer,
  // which previously scheduled a full polish pass for every text mutation in the application.
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener?.('mm:domains-ready',schedule);
  window.MM_APP_SHELL?.events?.onRender?.('dashboard',schedule);
  window.MM_APP_SHELL?.events?.onViewChange?.(schedule);
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-mm-onclick*="showOnboarding"],[onclick*="showOnboarding"]'))requestAnimationFrame(()=>{syncFirstRunModal();syncProductStates()})
  },true);
  window.MM_LEARNER_UI_POLISH=Object.freeze({version:VERSION,refresh:schedule});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
