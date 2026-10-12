/* MouldMaster learner UI polish — 2026.10.11.10
 * Presentation/navigation refinement only. Evidence, assessment, safety and
 * production-authority semantics remain owned by their governed runtimes.
 */
(function(){
'use strict';
if(window.MM_LEARNER_UI_POLISH)return;
const VERSION='2026.10.11.10';
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
    case 'mould-master': return safe(()=>window.MM_MOULD_MASTER_WORKSPACE?.open?.()||window.switchView?.('defects'));
    case 'process-data': return safe(()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
    case 'recent-case': {
      const row=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()?.[0];
      return safe(()=>row?window.MM_MOULD_MASTER_WORKSPACE?.open?.(row.id):window.MM_MOULD_MASTER_WORKSPACE?.open?.());
    }
  }
}
function homeActivity(){
  const cases=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()||[];
  return {recent:cases[0]||null}
}
function homeBalanceMarkup(){
  // The current lesson and Book already own the primary Home decisions.
  // Keep advanced tools useful but visually quiet and user-collapsible.
  return `<details class="mm-home-toolbox" data-mm-home-toolbox open>
    <summary><span class="mm-home-toolbox-label"><b>Toolbox</b><small>Optional diagnostic and data tools</small></span><span class="mm-home-toolbox-hint">Show / hide <span aria-hidden="true">⌄</span></span></summary>
    <div class="mm-home-toolbox-body">
      <div class="mm-home-balance-grid">
        <button type="button" data-mm-home-action="mould-master"><span class="mm-home-balance-icon" aria-hidden="true">◆</span><span><b>Troubleshoot</b><small>Build an evidence-led Mould Master case.</small></span><span class="mm-home-action-arrow" aria-hidden="true">→</span></button>
        <button type="button" data-mm-home-action="process-data"><span class="mm-home-balance-icon" aria-hidden="true">⌁</span><span><b>Analyse data</b><small>Review measured trends and recovery evidence.</small></span><span class="mm-home-action-arrow" aria-hidden="true">→</span></button>
      </div>
      <div data-mm-home-recent-slot hidden></div>
    </div>
  </details>`;
}

function syncHomeBalanceContent(panel){
  const a=homeActivity();
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
    panel.setAttribute('aria-label','Specialist moulding tools');
    panel.innerHTML=homeBalanceMarkup();
    panel.addEventListener('click',event=>{const button=event.target?.closest?.('[data-mm-home-action]');if(button)runQuickAction(button.dataset.mmHomeAction)});
  }
  panel.dataset.mmHomeBalance=VERSION;
  syncHomeBalanceContent(panel);
  const book=root.querySelector('[data-mm-home-book]'),focus=root.querySelector('.mm-today-focus');
  const bookSlot=book?.closest?.('.mm-dashboard-slot'),focusSlot=focus?.closest?.('.mm-dashboard-slot'),anchor=bookSlot||book||focusSlot||focus;
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
    // The book's original title and introduction duplicate the app-level Book
    // heading before the reader reaches chapter one, especially on phones.
    // Keep the actual nodes and content, but make that optional orientation
    // readable on demand. No technical text, status or listening action moves.
    const introHeading=hero.querySelector(':scope > h2');
    const introText=[...hero.querySelectorAll(':scope > p')].find(p=>
      !p.matches('[data-mm-book-summary],[data-mm-book-sme-status]'));
    if(introHeading&&introText&&!hero.querySelector('.mm-book-intro-details')){
      const introDetails=document.createElement('details');
      introDetails.className='mm-book-intro-details';
      const introSummary=document.createElement('summary');
      introSummary.textContent='About this Book';
      introDetails.append(introSummary,introHeading,introText);
      const governance=hero.querySelector('.mm-book-governance');
      if(governance)governance.insertAdjacentElement('beforebegin',introDetails);
      else hero.appendChild(introDetails);
    }
    const listen=hero.querySelector('[data-mm-book-mode="listen"]');
    if(listen&&!listen.disabled&&listen.textContent!=='Listen to Book')listen.textContent='Listen to Book';
  }

  const accuracy=view.querySelector('[data-mm-book-accuracy]');
  if(accuracy&&!accuracy.querySelector('.mm-book-assurance-details')){
    const details=document.createElement('details');
    details.className='mm-book-assurance-details';
    const summary=document.createElement('summary');
    summary.innerHTML='<b>Accuracy & assurance boundary</b><span>What “source evidence reviewed” does and does not mean</span>';
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
    const view=button.dataset.view||'',registryId=button.dataset.mmRegistryNav||'';
    const keep=PRIMARY_DESKTOP_VIEWS.has(view)||registryId==='book';
    hideNavButton(button,isDesktop&&!keep);
    if(keep&&labels[view]&&button.querySelector('span'))button.querySelector('span').textContent=labels[view];
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
  const book=document.getElementById('mmBookView');if(book&&!book.classList.contains('hidden'))return 'book';
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
    scenarios:['Practice','Recommended practice first; specialist tools stay one level deeper.'],
    book:['Book','Evidence-governed injection moulding reference.']
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
function installFirstRunPolishHook(){
  // The delayed core 120ms startup callback invokes the mutable global
  // onboarding function. Patch just that entry point, not the DOM or body.
  const original=window.showOnboarding;
  if(typeof original!=='function'||original.mmProductPolishHook)return;
  const wrapped=function(...args){
    const result=original.apply(this,args);
    syncFirstRunModal();syncProductStates();
    return result;
  };
  Object.defineProperty(wrapped,'mmProductPolishHook',{value:true});
  window.showOnboarding=wrapped;
}
function syncProductStates(){
  document.querySelectorAll('.empty-friendly,.mm-exact-empty,.mm-material-no-match').forEach(el=>el.dataset.mmProductState='empty');
  const failure=document.getElementById('mmStartupFailure');if(failure)failure.dataset.mmProductState='error';
}
function syncDataResetLink(){
  const profile=document.getElementById('profile');if(!profile)return;
  let card=profile.querySelector('[data-mm-data-reset-link]');
  if(!card){
    card=document.createElement('section');
    card.className='card form-card';
    card.dataset.mmDataResetLink='1';
    const eyebrow=document.createElement('span');eyebrow.className='eyebrow';eyebrow.textContent='Local data';
    const title=document.createElement('h2');title.textContent='Data & Reset';
    const copy=document.createElement('p');copy.className='muted';copy.textContent='Learner progress, analytics, process-data evidence, engineering evidence, diagnostics and offline app data use different local stores and controls.';
    const link=document.createElement('a');link.className='ghost';link.href='./support.html#data-reset';link.textContent='Open Data & Reset guide';
    card.append(eyebrow,title,copy,link);
    profile.appendChild(card);
  }
}
function syncReadAloudLabel(){
  const summary=document.querySelector('.mm-read-aloud details:not([open]) summary');
  if(summary&&!summary.getAttribute('aria-label'))summary.setAttribute('aria-label','Read aloud');
}
function run(){
  syncHomeBalance();
  syncBookDisclosure();
  syncDesktopNavigation();
  syncTopbarContext();
  syncDataResetLink();
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
  installFirstRunPolishHook();
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

/* MouldMaster: illustrated mobile reference layout, user-approved visual direction.
   Real lessons, source-backed materials and current case actions remain authoritative. */
(function(){
'use strict';
if(window.MM_REFERENCE_LAYOUT)return;
const ASSET='./assets/book-diagrams/';
const PHOTO_ASSET='./assets/mockup-reference-tiles.webp';
// The small photographs here are direct visual crops of the user-selected
// five-screen mockup, not grade provenance or equipment evidence.
const photoProbe=new Image();
photoProbe.onload=()=>document.documentElement.classList.add('mm-reference-photo-ready');
photoProbe.src=PHOTO_ASSET;
const sourcePhotoTile={machine:0,cycle:1,controls:2,materials:3,mould:4,
  process:5,defects:6,maintenance:7,cases:8,setup:19,quality:20,
  diagnosing:21,training:24,challenges:23,selecting:25,thermal:26,evidence:27};
function picture(key,description,index=sourcePhotoTile[key]??0){
  const holder=document.createElement('span');
  holder.className='mm-reference-photo';
  holder.dataset.mmPhotoIndex=String(index);
  holder.setAttribute('aria-hidden','true');
  holder.style.backgroundImage='url("'+PHOTO_ASSET+'")';
  holder.style.backgroundSize='700% 500%';
  holder.style.backgroundPosition=(index%7)*100/6+'% '+Math.floor(index/7)*25+'%';
  holder.appendChild(image(key,description)); // local engineering-diagram fallback
  return holder;
}
const art={
  machine:'machine-mould-system-overview.svg',
  cycle:'cycle-timeline.svg',
  controls:'vp-transfer.svg',
  materials:'polymer-family-evidence-map.svg',
  mould:'runner-gate-flow-path.svg',
  process:'rheology-shear-temperature.svg',
  defects:'surface-defect-source-map.svg',
  maintenance:'cooling-circuit-balance.svg',
  cases:'diagnostic-hypothesis-tree.svg',
  setup:'plasticising-sequence.svg',
  quality:'shrinkage-warpage.svg',
  diagnosing:'filling-boundary-pattern-map.svg',
  challenges:'doe-interaction.svg',
  training:'multicavity-balance.svg',
  selecting:'polymer-family-evidence-map.svg',
  thermal:'thermal-gradient-wall.svg',
  evidence:'process-baseline-evidence-package.svg'
};
function image(key,description){
  const img=document.createElement('img');
  img.src=ASSET+(art[key]||art.machine);
  img.alt=description||'Injection moulding engineering diagram';
  img.loading='lazy';
  img.decoding='async';
  img.className='mm-reference-picture';
  return img;
}
function sectionHeading(title,root){
  if(!root||root.querySelector(':scope > .mm-reference-title'))return;
  const h=document.createElement('h1');h.className='mm-reference-title';h.textContent=title;
  root.prepend(h);
}
function home(){
  const root=document.getElementById('dashboard'),focus=root?.querySelector('.mm-today-focus');
  if(!root||!focus)return;
  sectionHeading('Home',root);
  if(!root.querySelector('.mm-reference-home-hero')){
    const hero=document.createElement('section');
    hero.className='mm-reference-home-hero';
    hero.setAttribute('aria-label','MouldMaster welcome');
    const words=document.createElement('div');words.className='mm-reference-hero-words';
    const h=document.createElement('h2');h.textContent='Welcome back';
    const p=document.createElement('p');p.textContent='Build your injection moulding skills with structured learning, realistic practice and trusted materials guidance.';
    words.append(h,p);
    const machinePhoto=document.createElement('img');
    machinePhoto.src='./assets/mockup-home-machine.webp';
    machinePhoto.alt=''; // decorative owner-selected machine image; heading gives context
    machinePhoto.className='mm-reference-hero-photo';
    machinePhoto.decoding='async';
    machinePhoto.loading='eager';
    // A blocked/degraded image must not show the native broken-image glyph
    // or cover the welcome copy. Keep the readable gradient hero instead.
    machinePhoto.addEventListener('error',()=>{
      machinePhoto.hidden=true;
      hero.classList.add('mm-reference-hero-fallback');
    },{once:true});
    hero.append(words,machinePhoto);
    const anchor=focus.closest('.mm-dashboard-slot')||focus;
    anchor.before(hero);
  }
  const book=root.querySelector('[data-mm-home-book]');
  if(book&&!book.querySelector('.mm-reference-book-art')){
    const pic=picture('materials','Reference Book thumbnail',29);
    pic.className+=' mm-reference-book-art';
    book.prepend(pic);
  }
  if(!root.querySelector('.mm-reference-home-practice')){
    const practice=document.createElement('button');practice.type='button';
    practice.className='mm-reference-home-practice';
    const play=document.createElement('span');play.className='mm-reference-play';play.textContent='▶';play.setAttribute('aria-hidden','true');
    const copy=document.createElement('span');copy.className='mm-reference-home-practice-copy';
    const label=document.createElement('b');label.textContent='Continue practice →';
    const description=document.createElement('small');description.textContent='Work a shop-floor scenario';
    copy.append(label,description);practice.append(play,copy);
    practice.addEventListener('click',()=>{
      window.switchView?.('scenarios');
      // Continue practice is a direct workflow shortcut, not a redundant
      // second link back to the Practice chooser.
      if(!document.querySelector('#scenarios [data-mm-hub-action="scenario-detail"]'))
        window.MM_PRIMARY_HUBS?.renderPracticeHub?.();
      requestAnimationFrame(()=>document.querySelector('#scenarios [data-mm-hub-action="scenario-detail"]')?.click());
    });
    const hero=root.querySelector('.mm-reference-home-hero');
    // Anchor the action to the hero, not its positioned copy wrapper:
    // that wrapper previously made the absolute button overlap the headline.
    (hero||book||focus).appendChild(practice);
  }
  if(!root.querySelector('.mm-reference-quick-tools')){
    const tools=document.createElement('section');
    tools.className='mm-reference-quick-tools';
    tools.setAttribute('aria-label','Quick tools');
    const title=document.createElement('h3');title.textContent='Quick tools';
    const tiles=document.createElement('div');tiles.className='mm-reference-quick-grid';
    const options=[
      ['⌕','Material search',()=>{window.switchView?.('materials');requestAnimationFrame(()=>document.querySelector('#materials [data-mm-all-material-query]')?.focus({preventScroll:true}))}],
      ['⚠','Defect guide',()=>{window.switchView?.('scenarios');requestAnimationFrame(()=>document.querySelector('#scenarios [data-mm-hub-action="troubleshooting"]')?.click())}],
      ['▥','Process basics',()=>{window.switchView?.('path');requestAnimationFrame(()=>document.querySelector('#path [data-mm-lesson-catalog]')?.scrollIntoView({behavior:'smooth',block:'start'}))}],
      ['▦','Unit converter',()=>openReferenceConverter()]
    ];
    for(const [symbol,label,run] of options){
      const button=document.createElement('button');button.type='button';button.className='mm-reference-quick-tool';
      const icon=document.createElement('span');icon.className='mm-reference-quick-icon';icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
      const text=document.createElement('span');text.textContent=label;
      button.append(icon,text);button.addEventListener('click',run);tiles.appendChild(button);
    }
    tools.append(title,tiles);
    root.querySelector('.mm-reference-home-hero')?.insertAdjacentElement('afterend',tools);
  }
}
function openReferenceConverter(){
  let dialog=document.getElementById('mmReferenceUnitConverter');
  if(!dialog){
    dialog=document.createElement('dialog');
    dialog.id='mmReferenceUnitConverter';
    dialog.className='mm-reference-converter';
    const heading=document.createElement('h2');heading.textContent='Unit converter';
    const intro=document.createElement('p');intro.textContent='Basic physical-unit conversions only. Not a validated machine setting or production recipe.';
    const select=document.createElement('select');select.setAttribute('aria-label','Conversion');
    const conversions=[
      ['Pressure: bar to MPa',v=>v/10,'MPa'],
      ['Pressure: MPa to bar',v=>v*10,'bar'],
      ['Length: mm to in',v=>v/25.4,'in'],
      ['Length: in to mm',v=>v*25.4,'mm'],
      ['Temperature: °C to °F',v=>v*9/5+32,'°F'],
      ['Temperature: °F to °C',v=>(v-32)*5/9,'°C']
    ];
    for(const [label] of conversions){const option=document.createElement('option');option.value=String(select.options.length);option.textContent=label;select.appendChild(option)}
    const input=document.createElement('input');input.type='number';input.step='any';input.placeholder='Enter a value';input.setAttribute('aria-label','Value to convert');
    const result=document.createElement('output');result.setAttribute('aria-live','polite');result.textContent='Enter a value';
    const update=()=>{const value=Number(input.value),kind=conversions[Number(select.value)||0];result.textContent=input.value.trim()&&Number.isFinite(value)?Number(kind[1](value).toPrecision(9))+' '+kind[2]:'Enter a valid number'};
    input.addEventListener('input',update);select.addEventListener('change',update);
    const close=document.createElement('button');close.type='button';close.textContent='Close';close.addEventListener('click',()=>dialog.close());
    dialog.append(heading,intro,select,input,result,close);document.body.appendChild(dialog);
  }
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
  dialog.querySelector('input')?.focus();
}
// Source-backed course names control the card copy. Catalogue order can
// change when a lesson/course is added; position-based copy mislabelled the
// Materials, Mould Design and Process Setup cards on Android.
const coursePresentation=[
 [/^foundations$/i,'Fundamentals and key principles','machine',0],
 [/^machine\s*(?:&|and)\s*controls$/i,'Machines, controls and the moulding cycle','controls',2],
 [/^materials$/i,'Polymers, properties and material selection','materials',3],
 [/^mould\s*design$/i,'Tooling, runners, gates and cooling','mould',4],
 [/^process\s*setup$/i,'Establishing and verifying process settings','setup',19],
 [/optimis|optimiz/i,'Monitoring and improving process repeatability','process',5],
 [/troubleshoot|defect/i,'Identify defects and test likely causes','defects',6],
 [/maintenan/i,'Equipment care and preventive maintenance','maintenance',7],
 [/case\s*stud|quality|advanced/i,'Apply evidence to worked examples','cases',8]
];
function learnPresentation(title){
  const row=coursePresentation.find(([pattern])=>pattern.test(title));
  return row?{hint:row[1],art:row[2],tile:row[3]}:
    {hint:'Open this course and its lessons',art:'training',tile:24};
}
function learn(){
  const root=document.getElementById('path'),hub=root?.querySelector('.mm-learn-hub');
  const catalogue=hub?.querySelector('[data-mm-lesson-catalog]');
  if(!hub||!catalogue)return;
  sectionHeading('Learn',hub);
  // Course shortcuts used to duplicate the real course accordions and search.
  // Illustrate the existing, accessible course summaries instead.
  hub.querySelector('.mm-reference-learn-list')?.remove();
  const groups=Array.from(catalogue.querySelectorAll('[data-mm-catalog-group]'));
  // All 12 core tracks, all nine Material Science chapters and the optional
  // specialist track share the same image-led card. The previous first-nine
  // slice left the bottom of the catalogue as large unillustrated boxes.
  const materialTiles=[
    ['materials',3],['materials',11],['process',5],
    ['thermal',26],['materials',12],['mould',4],
    ['quality',20],['evidence',27],['controls',2]
  ];
  groups.forEach((group,index)=>{
    const summary=group.querySelector(':scope > summary');
    if(!summary||summary.querySelector('.mm-reference-course-art'))return;
    const fullTitle=group.querySelector('.mm-catalog-group-name')?.textContent||'Learning module';
    const title=fullTitle.replace(/^[0-9]+[.] */, '');
    const isMaterial=fullTitle.startsWith('Material science ·');
    const isSpecialist=fullTitle.startsWith('Optional specialist');
    const focus=materialTiles[Math.max(0,index-12)%materialTiles.length];
    const present=isMaterial
      ? {art:focus[0],tile:focus[1],hint:'Explore polymer behaviour and its evidence'}
      :isSpecialist
        ? {art:'training',tile:24,hint:'Optional advanced topics'}
        :index===9
          ? {art:'controls',tile:2,hint:'Sensors, automation and control'}
          :index===10
            ? {art:'mould',tile:4,hint:'Advanced tooling and simulation'}
            :index===11
              ? {art:'process',tile:5,hint:'Expert process engineering'}
              :learnPresentation(title);
    group.classList.toggle('mm-catalog-material-track',isMaterial);
    group.classList.toggle('mm-catalog-specialist-track',isSpecialist);
    const art=picture(present.art,'',present.tile);
    art.classList.add('mm-reference-course-art');
    art.alt='';
    art.setAttribute('aria-hidden','true');
    summary.classList.add('mm-unified-course-summary');
    summary.prepend(art);
    if(!summary.querySelector('.mm-reference-course-desc')){
      const desc=document.createElement('span');desc.className='mm-reference-course-desc';
      desc.textContent=present.hint;
      summary.querySelector('.mm-catalog-group-name')?.insertAdjacentElement('afterend',desc);
    }
  });
  hub.dataset.mmReferenceLearn='1';
}
function practice(){
  const root=document.getElementById('scenarios'),hub=root?.querySelector('.mm-practice-hub');
  if(!hub)return;
  sectionHeading('Practice',hub);
  // Keep one functional task chooser. The former nine illustrated shortcuts
  // repeated its tasks and launched the same destinations a second time.
  hub.querySelector('.mm-reference-practice-list')?.remove();
  const artByAction={
    troubleshooting:['quality',20],
    'scenario-detail':['cases',22],
    'process-data':['challenges',23],
    labs:['setup',19],
    'question-centre':['evidence',27]
  };
  hub.querySelectorAll('.mm-hub-section .mm-hub-grid > button[data-mm-hub-action]').forEach(button=>{
    if(button.querySelector('.mm-reference-practice-art'))return;
    const action=button.dataset.mmHubAction;
    const artData=artByAction[action];
    if(!artData)return;
    const art=picture(artData[0],'',artData[1]);
    art.classList.add('mm-reference-practice-art');
    art.alt='';
    art.setAttribute('aria-hidden','true');
    button.classList.add('mm-unified-practice-card');
    button.prepend(art);
  });
  hub.dataset.mmReferencePractice='1';
}
const familyArt=[
 [/(\bABS\b|ABS\/|PC\/ABS)/i,'materials'],
 [/\bPC\b/i,'controls'],
 [/\bPP\b/i,'process'],
 [/\bPE\b/i,'materials'],
 [/\bPA\d*\b|NYLON/i,'mould'],
 [/\bPOM\b/i,'thermal'],
 [/\bPET\b/i,'quality'],
 [/\bPBT\b/i,'evidence'],
 [/\bPMMA\b/i,'process'],
 [/TPU|TPE|ELASTOMER/i,'materials']
];
function materialArt(label){
  for(const [matcher,pic] of familyArt)if(matcher.test(label))return pic;
  return 'materials';
}
function materials(){
  const root=document.getElementById('materials'),catalogue=root?.querySelector('[data-mm-all-material-index]');
  if(!root||!catalogue)return;
  // One visible heading belongs to the consolidated catalogue itself.
  // Never add a separate Materials hero above the catalogue.
  const heading=catalogue.querySelector('.mm-material-all-index-head h3');
  if(heading){
    heading.textContent='Materials';
    heading.classList.add('mm-reference-materials-title');
  }
  root.querySelectorAll(':scope > .mm-reference-materials-title').forEach(extra=>extra.remove());
  // Source-backed grade folders and the older conceptual family explorer now
  // live in one Materials surface. Keep generic tendencies explicitly optional,
  // distinct from supplier-specific grade data and never treat them as recipes.
  // The real learning pane moves inside the optional guide after first render.
  // Discover it there too: repeated navigation and tab changes must still
  // reopen the guide when teaching content becomes active.
  const legacy=root.querySelector('.mat-shell');
  if(legacy){
    let guide=catalogue.parentElement?.querySelector('[data-mm-family-science]');
    if(!guide){
      guide=document.createElement('details');
      guide.className='mm-family-science';
      guide.dataset.mmFamilyScience='1';
      const summary=document.createElement('summary');
      summary.textContent='Polymer-family behaviour & learning (general reference)';
      const explanation=document.createElement('p');
      explanation.className='muted tiny';
      explanation.textContent='Optional family-level guidance. Use exact supplier grades and source evidence above for any real decision.';
      const slot=document.createElement('div');
      slot.dataset.mmFamilyScienceContent='1';
      guide.append(summary,explanation,slot);
      catalogue.insertAdjacentElement('afterend',guide);
    }
    // Keep the learning landmark and tab navigation visible. Only the
    // explanatory family reference belongs inside the optional disclosure.
    // Hiding these controls previously broke material lesson navigation.
    const tabs=root.querySelector('.mm-material-study-tools > .mat-tabs')||legacy.querySelector(':scope > .mat-tabs');
    const teachingSlot=guide.querySelector('[data-mm-family-science-content]');
    if(teachingSlot&&legacy.parentElement!==teachingSlot)teachingSlot.appendChild(legacy);
    // When a learner opens a material lesson, lab, quiz or references using
    // the existing tab routing, the teaching pane MUST NOT remain inside a
    // collapsed family guide. Preserve the optional explorer default.
    const currentTab=tabs?.querySelector('button.active')?.textContent?.trim()||'';
    const lessonShown=!!legacy.querySelector('.mat-lesson');
    const intro=root.querySelector('#mmMaterialLearningAnchor');
    // Combine the detached Material Science intro, five legacy mode buttons
    // and optional general-reference guide into one clear secondary panel.
    // Preserve the *real* mode buttons and their event handlers; the guide
    // only contains generic family science, never exact supplier-grade data.
    let study=root.querySelector('.mm-material-study-tools');
    if(!study){
      study=document.createElement('section');
      study.className='mm-material-study-tools';
      study.setAttribute('aria-label','Material learning and tools');
      catalogue.insertAdjacentElement('afterend',study);
    }
    // Do not reparent focused controls on every refresh. Native buttons keep
    // their listeners and keyboard focus through material result rerenders.
    if(intro&&intro.parentElement!==study)study.appendChild(intro);
    if(tabs&&tabs.parentElement!==study)study.appendChild(tabs);
    if(guide.parentElement!==study)study.appendChild(guide);
    if(lessonShown||(['Learn','Interactive labs','Knowledge check','Evidence & references'].includes(currentTab)))guide.open=true;
  }
  const selectedFamily=catalogue.querySelector('[data-mm-family-detail]:not([hidden])');
  if(selectedFamily){
    const code=selectedFamily.dataset.mmFamilyCurrent||'';
    const art=selectedFamily.querySelector('[data-mm-family-detail-art]');
    if(art&&art.dataset.mmFamilyArt!==code){
      const tile=/^PP$/.test(code)?11:/^(HDPE|LDPE|PE)$/.test(code)?12:/^PC$/.test(code)?10:
        /^PA/.test(code)?13:/^POM$/.test(code)?14:/^PET$/.test(code)?15:
        /^PBT$/.test(code)?16:/^PMMA$/.test(code)?17:9;
      art.replaceChildren(picture(materialArt(code),'',tile));
      art.dataset.mmFamilyArt=code;
    }
  }
  catalogue.querySelectorAll('.mm-material-family-card:not([data-mm-reference-illustrated])').forEach(card=>{
    card.dataset.mmReferenceIllustrated='1';
    const familyCode=card.dataset.mmFamilyOpen||'';
    const materialTile=/(ABS|PC\/ABS)/.test(familyCode)?9:/^PC$/.test(familyCode)?10:
      /^PP$/.test(familyCode)?11:/^(HDPE|LDPE|PE)$/.test(familyCode)?12:
      /^PA\d+/.test(familyCode)?13:/^POM$/.test(familyCode)?14:
      /^PET$/.test(familyCode)?15:/^PBT$/.test(familyCode)?16:
      /^PMMA$/.test(familyCode)?17:/TPE|TPU|ELASTOMER|TPV/i.test(familyCode)?18:9;
    const img=picture(materialArt(familyCode),'Illustrative polymer family texture',materialTile);
    img.classList.add('mm-reference-family-art');
    card.prepend(img);
  });
  catalogue.querySelectorAll('.mm-material-index-card:not([data-mm-reference-illustrated])').forEach(card=>{
    card.dataset.mmReferenceIllustrated='1';
    const sum=card.querySelector('.mm-material-index-summary');
    if(!sum)return;
    const title=card.querySelector('.mm-material-index-title')?.textContent||'';
    const family=card.querySelector('.mm-material-index-subtitle')?.textContent||'';
    const familyCode=(family+' '+title).toUpperCase();
    const materialTile=/(ABS|PC\/ABS)/.test(familyCode)?9:/\bPC\b/.test(familyCode)?10:
      /\bPP\b/.test(familyCode)?11:/\bPE\b/.test(familyCode)?12:
      /\bPA\d*\b|NYLON/.test(familyCode)?13:/\bPOM\b/.test(familyCode)?14:
      /\bPET\b/.test(familyCode)?15:/\bPBT\b/.test(familyCode)?16:
      /\bPMMA\b/.test(familyCode)?17:/TPE|TPU|ELASTOMER/.test(familyCode)?18:9;
    const img=picture(materialArt(family+' '+title),'Illustrative polymer texture from user reference',materialTile);
    img.classList.add('mm-reference-material-art');
    sum.prepend(img);
    const sourced=card.querySelector('[data-mm-unified-grade]');
    if(sourced&&!sourced.querySelector('.mm-reference-diagrams')){
      const figure=document.createElement('figure');figure.className='mm-reference-diagrams';
      figure.append(
        picture('materials','Illustrative polymer pellets from selected design',materialTile),
        picture('process','Conceptual molecule diagram from selected design',31),
        picture('mould','Illustrative moulded component from selected design',32)
      );
      const note=document.createElement('figcaption');
      note.textContent='Reference illustrations only; none identify this supplier grade or establish its composition. Exact properties and applications require linked primary sources.';
      figure.append(note);
      // Retain the real explanatory SVG diagrams separately. These teach
      // mechanisms and must not be misrepresented as grade-specific evidence.
      const teaching=document.createElement('details');
      teaching.className='mm-reference-technical-diagrams';
      const summary=document.createElement('summary');summary.textContent='Engineering diagrams and explanations';
      const drawing=document.createElement('div');drawing.className='mm-reference-teaching-art';
      drawing.append(
        image('materials','Polymer-family evidence relationship diagram'),
        image('process','Rheology: shear and temperature diagram'),
        image('mould','Mould runner and gate flow-path diagram')
      );
      teaching.append(summary,drawing);
      const actions=sourced.querySelector('.mm-material-inline-actions');
      if(actions){actions.before(figure);actions.before(teaching)}
      else sourced.append(figure,teaching);
    }
  });
  // Search/pagination replaces result nodes asynchronously. Decorate new
  // source-backed rows as soon as the index has rendered them.
  const resultHost=catalogue.querySelector('[data-mm-all-material-results]');
  if(resultHost&&!resultHost.dataset.mmReferenceObserved){
    resultHost.dataset.mmReferenceObserved='1';
    new window.MutationObserver(refresh).observe(resultHost,{childList:true});
  }
  root.dataset.mmReferenceMaterials='1';
}
function more(){
  const grid=document.querySelector('#modal .grid2[data-mm-more-organized="1"]');
  if(!grid||grid.dataset.mmReferenceMore==='1')return;
  grid.dataset.mmReferenceMore='1';
  const mapped=[['learning','Resources','Guides, charts and learning materials'],
    ['references','Tools','Calculators and technical references'],
    ['account','Settings & account','Preferences, profile and support'],
    ['mission','Mission tools','Saved evidence and command search']];
  mapped.forEach(([id,title,desc])=>{
    const group=grid.querySelector('[data-mm-more-section="'+id+'"]');if(!group)return;
    const b=group.querySelector('summary b'),small=group.querySelector('summary small');
    if(b)b.textContent=title;if(small)small.textContent=desc;
  });
  // Six top-level More destinations: four governed tool groups and distinct
  // help/about disclosures. The exact links stay local to the application.
  for(const [title,hint,label,href] of [
    ['Help & support','Guides, FAQs and contact','Open support information','./support.html'],
    ['About MouldMaster','Version, acknowledgements and safety','View app version and safety information','./support.html#mmPwa']
  ]){
    const details=document.createElement('details');details.className='mm-more-disclosure mm-reference-more-extra';
    const summary=document.createElement('summary'),copy=document.createElement('span');
    copy.className='mm-more-disclosure-name';
    const heading=document.createElement('b');heading.textContent=title;
    const description=document.createElement('small');description.textContent=hint;
    copy.append(heading,description);summary.append(copy);details.append(summary);
    const area=document.createElement('div');area.className='mm-more-disclosure-items';
    const link=document.createElement('a');link.href=href;link.className='quick-action';link.textContent=label;
    area.append(link);details.append(area);
    // Ensure the first actionable Help link is visible at More entry, while
    // other categories retain their native collapsible behaviour.
    if(title==='Help & support')details.open=true;
    grid.append(details);
  }
  const direct=Array.from(grid.querySelectorAll(':scope > .mm-reference-more-extra'));
  grid.prepend(...direct);
}
let scheduled=false;
function refresh(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    try{home();learn();practice();materials();more()}catch(error){console.warn('[MouldMaster reference layout]',error)}
  });
}
function boot(){
  document.documentElement.classList.add('mm-reference-layout');
  refresh();
  window.MM_APP_SHELL?.events?.onViewChange?.(refresh);
  for(const name of ['dashboard','path','materials','scenarios'])window.MM_APP_SHELL?.events?.onRender?.(name,refresh);
  const targets=['dashboard','path','materials','scenarios','modal'];
  for(const id of targets){
    const node=document.getElementById(id);if(!node)continue;
    new window.MutationObserver(refresh).observe(node,{childList:true,subtree:false});
  }
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('.mm-material-index-card summary,.mobile-nav,[data-mm-registry-menu]'))refresh();
  });
  window.MM_REFERENCE_LAYOUT=Object.freeze({version:'2026.10.11.11',refresh});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
