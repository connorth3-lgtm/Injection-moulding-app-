/* MouldMaster: illustrated mobile reference layout, user-approved visual direction.
   Real lessons, source-backed materials and current case actions remain authoritative. */
(function(){
'use strict';
if(window.MM_REFERENCE_LAYOUT)return;
const ASSET='./assets/book-diagrams/';
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
    const h=document.createElement('h2');h.textContent='Welcome to MouldMaster';
    const p=document.createElement('p');p.textContent='Practical knowledge for injection moulding.';
    words.append(h,p);
    hero.append(words,image('machine','Diagram of an injection moulding machine and mould'));
    const anchor=focus.closest('.mm-dashboard-slot')||focus;
    anchor.before(hero);
  }
  const book=root.querySelector('[data-mm-home-book]');
  if(book&&!book.querySelector('.mm-reference-book-art')){
    const pic=image('materials','Polymer and processing reference diagram');
    pic.className+=' mm-reference-book-art';
    book.prepend(pic);
  }
  if(book&&!root.querySelector('.mm-reference-home-practice')){
    const practice=document.createElement('button');practice.type='button';
    practice.className='mm-reference-home-practice';
    practice.append(image('setup','Plasticising sequence process illustration'));
    const wrap=document.createElement('span');wrap.className='mm-reference-home-practice-copy';
    const title=document.createElement('b');title.textContent='Continue practice';
    const desc=document.createElement('small');desc.textContent='Work a short evidence-led moulding decision';
    wrap.append(title,desc);practice.append(wrap);
    practice.addEventListener('click',()=>window.switchView?.('scenarios'));
    const anchor=book.closest('.mm-dashboard-slot')||book;
    anchor.after(practice);
  }
}
const hints=[
 'Fundamentals and key principles',
 'Step by step through the moulding cycle',
 'Components and operation',
 'Polymer selection and behaviour',
 'Tooling and design considerations',
 'Setting and optimising parameters',
 'Common issues and diagnosis',
 'Keeping production equipment healthy',
 'Real examples and evidence'
];
const learnArt=['machine','cycle','controls','materials','mould','process','defects','maintenance','cases'];
function learn(){
  const root=document.getElementById('path'),hub=root?.querySelector('.mm-learn-hub');
  const catalogue=hub?.querySelector('[data-mm-lesson-catalog]');
  if(!hub||!catalogue)return;
  sectionHeading('Learn',hub);
  if(hub.querySelector('.mm-reference-learn-list'))return;
  const groups=Array.from(catalogue.querySelectorAll('[data-mm-catalog-group]'));
  const container=document.createElement('nav');
  container.className='mm-reference-learn-list';
  container.setAttribute('aria-label','Illustrated lesson categories');
  const search=document.createElement('input');search.type='search';search.className='mm-reference-learn-search';
  search.setAttribute('aria-label','Search lessons');search.placeholder='Search lessons…';
  const searchWrap=document.createElement('label');searchWrap.className='mm-reference-learn-search-wrap';
  searchWrap.append(search);container.append(searchWrap);
  const cards=document.createElement('div');cards.className='mm-reference-list-cards';
  groups.slice(0,9).forEach((group,i)=>{
    const button=document.createElement('button');button.type='button';button.className='mm-reference-list-card';
    const title=group.querySelector('.mm-catalog-group-name')?.textContent?.replace(/^\d+\.\s*/, '')||'Learning module';
    const copy=document.createElement('span');copy.className='mm-reference-card-copy';
    const b=document.createElement('b');b.textContent=title;
    const small=document.createElement('small');small.textContent=hints[i]||'Open the course and its lessons';
    const chevron=document.createElement('span');chevron.className='mm-reference-chevron';chevron.textContent='›';chevron.setAttribute('aria-hidden','true');
    copy.append(b,small);button.append(image(learnArt[i],title+' concept diagram'),copy,chevron);
    button.addEventListener('click',()=>{
      group.open=true;group.scrollIntoView({block:'start',behavior:'smooth'});
      group.querySelector('summary')?.focus({preventScroll:true});
    });
    cards.append(button);
  });
  container.append(cards);
  search.addEventListener('input',()=>{
    const field=catalogue.querySelector('[data-mm-catalog-query]');
    if(!field)return;
    field.value=search.value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    catalogue.open=true;
  });
  catalogue.before(container);
  hub.dataset.mmReferenceLearn='1';
}
const practiceTiles=[
 ['Process setup practice','Set parameters and see the results','setup','labs'],
 ['Defect identification','Identify and diagnose common defects','quality','troubleshooting'],
 ['Troubleshooting scenarios','Real-world problems to solve','diagnosing','troubleshooting'],
 ['Case studies','Work through complete moulding cases','cases','scenario-detail'],
 ['Parameter challenges','Optimise settings for different parts','challenges','process-data'],
 ['Mould design exercises','Explore tool design and features','training','labs'],
 ['Material selection','Choose the right material for the application','selecting','material-labs'],
 ['Maintenance scenarios','Keep production running','thermal','diagnostic-labs'],
 ['Mixed challenges','Test your overall knowledge','evidence','question-centre']
];
function practice(){
  const root=document.getElementById('scenarios'),hub=root?.querySelector('.mm-practice-hub');
  if(!hub||hub.querySelector('.mm-reference-practice-list'))return;
  sectionHeading('Practice',hub);
  const nav=document.createElement('nav');nav.className='mm-reference-practice-list';
  nav.setAttribute('aria-label','Illustrated practice activities');
  practiceTiles.forEach(([title,desc,picture,action])=>{
    const btn=document.createElement('button');btn.type='button';btn.className='mm-reference-list-card';
    const copy=document.createElement('span');copy.className='mm-reference-card-copy';
    const name=document.createElement('b');name.textContent=title;
    const small=document.createElement('small');small.textContent=desc;
    const arrow=document.createElement('span');arrow.className='mm-reference-chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
    copy.append(name,small);btn.append(image(picture,title+' training diagram'),copy,arrow);
    btn.addEventListener('click',()=>{
      const existing=hub.querySelector('[data-mm-hub-action="'+action+'"]');
      if(existing)existing.click();
      else if(action==='material-labs')window.switchView?.('materials');
      else hub.querySelector('[data-mm-hub-action="labs"]')?.click();
    });
    nav.append(btn);
  });
  hub.insertBefore(nav,hub.querySelector('.mm-hub-continue')||hub.firstElementChild);
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
  if(!root.querySelector('.mm-reference-materials-title')){
    const h=document.createElement('h1');h.className='mm-reference-materials-title';h.textContent='Materials';
    catalogue.before(h);
  }
  catalogue.querySelectorAll('.mm-material-index-card:not([data-mm-reference-illustrated])').forEach(card=>{
    card.dataset.mmReferenceIllustrated='1';
    const sum=card.querySelector('.mm-material-index-summary');
    if(!sum)return;
    const title=card.querySelector('.mm-material-index-title')?.textContent||'';
    const family=card.querySelector('.mm-material-index-subtitle')?.textContent||'';
    const img=image(materialArt(family+' '+title),'Polymer and material reference diagram');
    img.classList.add('mm-reference-material-art');
    sum.prepend(img);
    const sourced=card.querySelector('[data-mm-unified-grade]');
    if(sourced&&!sourced.querySelector('.mm-reference-diagrams')){
      const figure=document.createElement('figure');figure.className='mm-reference-diagrams';
      const img1=image('materials','Polymer-family evidence relationship diagram');
      const img2=image('process','Polymer rheology: shear and temperature diagram');
      const img3=image('mould','Mould runner and gate flow-path diagram');
      figure.append(img1,img2,img3);
      const note=document.createElement('figcaption');
      note.textContent='Learning diagrams: conceptual only. Verify actual grade properties against the linked supplier sources.';
      figure.append(note);
      const actions=sourced.querySelector('.mm-material-inline-actions');
      actions?.before(figure)||sourced.append(figure);
    }
  });
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
  for(const [title,detail,href] of [
    ['Support','Help, privacy and contact','./support.html'],
    ['About','App version and safety information','./README.md']
  ]){
    const details=document.createElement('details');details.className='mm-more-disclosure mm-reference-more-extra';
    const summary=document.createElement('summary');
    const copy=document.createElement('span');copy.className='mm-more-disclosure-name';
    const b=document.createElement('b');b.textContent=title;
    const small=document.createElement('small');small.textContent=detail;
    copy.append(b,small);summary.append(copy);details.append(summary);
    const area=document.createElement('div');area.className='mm-more-disclosure-items';
    const link=document.createElement('a');link.href=href;link.className='quick-action';link.textContent=title==='Support'?'Open support information':'Read about MouldMaster';
    area.append(link);details.append(area);grid.append(details);
  }
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
    new MutationObserver(refresh).observe(node,{childList:true,subtree:false});
  }
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('.mm-material-index-card summary,.mobile-nav,[data-mm-registry-menu]'))refresh();
  });
  window.MM_REFERENCE_LAYOUT=Object.freeze({version:'2026.10.11.7',refresh});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();