/* MouldMaster primary Learn / Practice hubs — 2026.09.10.8 */
(function(){
'use strict';
if(window.MM_PRIMARY_HUBS)return;
if(typeof renderPath!=='function'||typeof renderScenarios!=='function'||typeof switchView!=='function'){
  console.warn('[MouldMaster] Primary hubs require the core learning and practice views.');
  return;
}

const VERSION='2026.09.10.8';
const PRACTICE_ROTATION_KEY='mm_practice_scenario_rotation_v1';
const originalRenderPath=renderPath;
const originalRenderScenarios=renderScenarios;
const originalMore=typeof window.openMobileMenu==='function'?window.openMobileMenu:null;

/* Hub presentation lives in external CSS because the app CSP intentionally
   blocks unapproved runtime-created style content. */
function ensureHubStylesheet(){
  if(!document.querySelector('link[data-mm-primary-hub-style]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`./ui-shell.css?hub=${encodeURIComponent(VERSION)}`;
    link.dataset.mmPrimaryHubStyle=VERSION;
    document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-mm-mobile-lesson-fix]')){
    const fix=document.createElement('link');
    fix.rel='stylesheet';
    fix.href=`./mobile-lesson-fix.css?v=${encodeURIComponent(VERSION)}`;
    fix.dataset.mmMobileLessonFix=VERSION;
    document.head.appendChild(fix);
  }
}
ensureHubStylesheet();

/* Blocking app modals must own the scroll gesture. Freezing the document and
   main content prevents Home/Learn/Practice moving behind More, search and
   picker screens while leaving the modal card itself scrollable. */
const modalScrollState={locked:false,rootOverflow:'',bodyOverflow:'',bodyOverscroll:'',mainOverflow:'',modalOverscroll:'',cardOverscroll:'',cardWebkitScroll:''};
function modalIsOpen(){const modal=document.getElementById('modal');return !!(modal&&!modal.classList.contains('hidden'))}
function lockModalBackground(){
  if(modalScrollState.locked||!modalIsOpen())return;
  const root=document.documentElement,body=document.body,main=document.querySelector('main.main')||document.querySelector('.main');
  const modal=document.getElementById('modal'),card=modal?.querySelector('.modal-card');
  modalScrollState.rootOverflow=root.style.overflow;
  modalScrollState.bodyOverflow=body.style.overflow;
  modalScrollState.bodyOverscroll=body.style.overscrollBehavior;
  modalScrollState.mainOverflow=main?.style.overflow||'';
  modalScrollState.modalOverscroll=modal?.style.overscrollBehavior||'';
  modalScrollState.cardOverscroll=card?.style.overscrollBehavior||'';
  modalScrollState.cardWebkitScroll=card?.style.webkitOverflowScrolling||'';
  root.style.overflow='hidden';
  body.style.overflow='hidden';
  body.style.overscrollBehavior='none';
  if(main)main.style.overflow='hidden';
  if(modal)modal.style.overscrollBehavior='none';
  if(card){card.style.overscrollBehavior='contain';card.style.webkitOverflowScrolling='touch'}
  root.dataset.mmModalScrollLock='1';
  modalScrollState.locked=true;
}
function unlockModalBackground(){
  if(!modalScrollState.locked)return;
  const root=document.documentElement,body=document.body,main=document.querySelector('main.main')||document.querySelector('.main');
  const modal=document.getElementById('modal'),card=modal?.querySelector('.modal-card');
  root.style.overflow=modalScrollState.rootOverflow;
  body.style.overflow=modalScrollState.bodyOverflow;
  body.style.overscrollBehavior=modalScrollState.bodyOverscroll;
  if(main)main.style.overflow=modalScrollState.mainOverflow;
  if(modal)modal.style.overscrollBehavior=modalScrollState.modalOverscroll;
  if(card){card.style.overscrollBehavior=modalScrollState.cardOverscroll;card.style.webkitOverflowScrolling=modalScrollState.cardWebkitScroll}
  delete root.dataset.mmModalScrollLock;
  modalScrollState.locked=false;
}
function syncModalScrollLock(){if(modalIsOpen())lockModalBackground();else unlockModalBackground()}
function installModalScrollLock(){
  const modal=document.getElementById('modal');
  if(!modal||window.__MM_MODAL_SCROLL_LOCK__)return;
  const observer=new MutationObserver(syncModalScrollLock);
  observer.observe(modal,{attributes:true,attributeFilter:['class']});
  document.addEventListener('touchmove',event=>{
    if(!modalScrollState.locked||event.target?.closest?.('#modal .modal-card'))return;
    event.preventDefault();
  },{passive:false});
  window.__MM_MODAL_SCROLL_LOCK__=Object.freeze({version:VERSION,sync:syncModalScrollLock});
  syncModalScrollLock();
}
installModalScrollLock();

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function lessonContext(){
  try{
    const lesson=currentLesson();
    const course=D.courses.find(x=>x.id===lesson.course);
    const position=Math.max(0,course.lessonIds.indexOf(lesson.id));
    const completed=Array.isArray(user?.completed)?user.completed.length:0;
    const overall=D.lessons?.length?Math.round(completed/D.lessons.length*100):0;
    return {lesson,course,position,overall};
  }catch(_){return null}
}
function scrollLessonTop(){
  const main=document.querySelector('main.main')||document.querySelector('.main');
  if(main)main.scrollTop=0;
  if(document.body)document.body.scrollTop=0;
  const scrolling=document.scrollingElement;if(scrolling)scrolling.scrollTop=0;
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
}
function withoutSmoothScroll(fn){
  const original=window.scrollTo;
  window.scrollTo=function(leftOrOptions,top){
    if(leftOrOptions&&typeof leftOrOptions==='object')return original.call(window,{...leftOrOptions,behavior:'auto'});
    return original.call(window,leftOrOptions,top);
  };
  try{return fn()}finally{window.scrollTo=original}
}
function openCurrentLesson(){
  const active=document.activeElement;
  if(active&&typeof active.blur==='function')active.blur();
  const root=document.documentElement;
  const previousAnchor=root.style.overflowAnchor;
  root.style.overflowAnchor='none';
  scrollLessonTop();
  const result=withoutSmoothScroll(()=>switchView('lesson'));
  scrollLessonTop();
  requestAnimationFrame(()=>{
    scrollLessonTop();
    requestAnimationFrame(()=>{scrollLessonTop();root.style.overflowAnchor=previousAnchor});
  });
  return result;
}
function readPracticeRotation(){
  const store=window.MM_RUNTIME_V2?.storage;
  if(store?.get){const row=store.get(PRACTICE_ROTATION_KEY,null);return Number(row?.last)}
  try{return Number(localStorage.getItem(PRACTICE_ROTATION_KEY))}catch(_){return NaN}
}
function writePracticeRotation(index){
  const store=window.MM_RUNTIME_V2?.storage;
  if(store?.set)return store.set(PRACTICE_ROTATION_KEY,{last:index});
  try{localStorage.setItem(PRACTICE_ROTATION_KEY,String(index));return true}catch(_){return false}
}
function nextScenarioIndex(){
  const total=Array.isArray(D?.scenarios)?D.scenarios.length:0;
  if(total<=1)return 0;
  const daily=Math.floor(Date.now()/86400000)%total;
  let last=readPracticeRotation();
  if(!Number.isInteger(last)||last<0||last>=total)last=daily;
  let next=(last+1)%total;
  if(next===daily)next=(next+1)%total;
  writePracticeRotation(next);
  return next;
}
function bind(root){root?.querySelectorAll('[data-mm-hub-action]').forEach(button=>button.addEventListener('click',()=>runAction(button.dataset.mmHubAction)))}
function safeOpen(apiName,fallback){
  const api=window[apiName];
  if(api&&typeof api.open==='function')return api.open();
  if(fallback)return fallback();
  if(typeof toast==='function')toast('This activity is still loading. Try again in a moment.');
}
function sanitizeDailyChallenge(){
  const modal=document.getElementById('modal');if(!modal)return;
  modal.querySelectorAll('button').forEach(button=>{button.textContent=(button.textContent||'').replace(/\s*\+\s*\d+\s*XP\b/ig,'')});
  modal.querySelectorAll('.exam-integrity').forEach(box=>{box.textContent=(box.textContent||'').replace(/\s*XP[^.]*\.?/ig,'').trim()});
}
function openDaily(){
  let done=false;try{done=typeof dailyDone==='function'&&dailyDone()}catch(_){}
  if(done)return openScenarioDetail(nextScenarioIndex());
  if(typeof openDailyChallenge==='function'){openDailyChallenge();requestAnimationFrame(sanitizeDailyChallenge);return}
  return openScenarioDetail(nextScenarioIndex());
}
function openPicker(kind){
  if(typeof openModal!=='function')return;
  if(kind==='learn-resources'){
    openModal(`<span class="eyebrow">Learn</span><h2>Learning resources</h2><p class="muted">Choose the resource you need.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="visuals"><b>Animated visuals</b><small>See core cycle and process ideas visually.</small></button><button type="button" data-mm-hub-action="glossary"><b>Glossary</b><small>Look up injection moulding terms in plain language.</small></button><button type="button" data-mm-hub-action="saved"><b>Saved lessons</b><small>Return to lessons you bookmarked.</small></button></div>`);
  }else if(kind==='troubleshooting'){
    openModal(`<span class="eyebrow">Practice</span><h2>Troubleshooting</h2><p class="muted">Choose how you want to work the problem.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="mould-master"><b>Mould Master</b><small>Build an evidence-led troubleshooting case from a real defect.</small></button><button type="button" data-mm-hub-action="defects"><b>Defect finder</b><small>Start from the symptom and review mechanisms and checks.</small></button><button type="button" data-mm-hub-action="coach"><b>Troubleshooting coach</b><small>Work through a problem with structured offline guidance.</small></button><button type="button" data-mm-hub-action="diagnostic-labs"><b>Diagnostic labs</b><small>Practise evidence-first fault isolation.</small></button></div>`);
  }else if(kind==='labs'){
    openModal(`<span class="eyebrow">Practice</span><h2>Labs & simulators</h2><p class="muted">Choose a controlled learning tool.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="simulator"><b>Process simulator</b><small>Explore relative process changes in the training model.</small></button><button type="button" data-mm-hub-action="material-labs"><b>Material labs</b><small>Compare resin behaviour and evidence.</small></button></div>`);
  }
  requestAnimationFrame(()=>bind(document.getElementById('modal')));
}
function closePicker(){try{window.closeModal?.()}catch(_){}}
function runAction(action){
  switch(action){
    case 'lesson': return openCurrentLesson();
    case 'path-detail': return openLearningPathDetail();
    case 'materials': return switchView('materials');
    case 'specialist': return safeOpen('MM_SPECIALIST_CURRICULUM');
    case 'learn-resources': return openPicker('learn-resources');
    case 'visuals': closePicker(); return switchView('visuals');
    case 'glossary': closePicker(); return switchView('glossary');
    case 'saved': closePicker(); return switchView('profile');
    case 'daily': return openDaily();
    case 'troubleshooting': return openPicker('troubleshooting');
    case 'mould-master': closePicker(); return safeOpen('MM_MOULD_MASTER_WORKSPACE',()=>switchView('defects'));
    case 'defects': closePicker(); return switchView('defects');
    case 'coach': closePicker(); return switchView('coach');
    case 'diagnostic-labs': closePicker(); return safeOpen('MM_DIAGNOSTIC_LABS',()=>switchView('scenarios'));
    case 'process-data': return safeOpen('MM_PROCESS_DATA_DIAGNOSTICS');
    case 'scenario-detail': return openScenarioDetail(nextScenarioIndex());
    case 'labs': return openPicker('labs');
    case 'simulator': closePicker(); return switchView('simulator');
    case 'material-labs': closePicker(); return safeOpen('MM_MATERIAL_BEHAVIOUR_LABS',()=>switchView('materials'));
    case 'assessments': return switchView('exams');
  }
}

function learnHubMarkup(){
  const c=lessonContext();
  const saved=Array.isArray(user?.bookmarks)?user.bookmarks.length:0;
  const specialistCount=window.MM_SPECIALIST_CURRICULUM?.lessons?.length||0;
  const totalTracks=D?.courses?.length||12;
  const lesson=c?.lesson;const course=c?.course;
  const lessonLine=course?`${esc(course.name)} · Lesson ${(c.position||0)+1} of ${course.lessonIds.length}`:'Your current learning path';
  return `<div class="mm-primary-hub mm-learn-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Learn</span><h1>What do you want to learn?</h1><p>Continue your current lesson or choose a learning area.</p></header>
    <section class="mm-hub-continue mm-primary-hub-card" aria-label="Continue learning"><div class="mm-hub-continue-copy"><span class="eyebrow">Continue</span><h2>${esc(lesson?.title||'Your next lesson')}</h2><p>${lessonLine}</p><div class="mm-hub-progress"><div class="mini-bar" aria-hidden="true"><span style="width:${c?.overall||0}%"></span></div><strong>${c?.overall||0}% complete</strong></div></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="lesson">Continue lesson →</button></section>
    <section class="mm-hub-section"><div class="mm-hub-section-head"><h2>Choose a learning area</h2><p>Open only what you need.</p></div><div class="mm-hub-grid">
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="path-detail"><span class="eyebrow">Core learning</span><b>Learning path</b><small>All ${totalTracks} tracks and lessons.</small><span class="mm-hub-tile-action">Browse learning path →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="materials"><span class="eyebrow">Materials</span><b>Material science</b><small>Polymers, material families and behaviour.</small><span class="mm-hub-tile-action">Open material learning →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="specialist"><span class="eyebrow">Advanced</span><b>Specialist learning</b><small>${specialistCount?`${specialistCount} optional advanced lessons.`:'Optional advanced lessons.'}</small><span class="mm-hub-tile-action">Open specialist learning →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="learn-resources"><span class="eyebrow">Resources</span><b>Visuals, glossary & saved</b><small>Diagrams, terms and ${saved} saved lesson${saved===1?'':'s'}.</small><span class="mm-hub-tile-action">Open learning resources →</span></button>
    </div></section>
  </div>`;
}

function practiceTopicLabel(topic){
  const raw=String(topic||'').replace(/^[^:]+:/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  return raw?raw.replace(/\b\w/g,ch=>ch.toUpperCase()):'Moulding judgement';
}
function practiceActionFor(rec){
  const topic=String(rec?.topic||'').toLowerCase();
  const suggested=String(rec?.suggestedActivity||'').toLowerCase();
  if(/material|moisture|dry|rheolog|viscos|polymer|resin/.test(topic))return 'material-labs';
  if(['discriminating-scenario-practice','retrieval-practice','timestamped-practice-or-assessment','different-context-scenario'].includes(suggested))return 'scenario-detail';
  if(suggested==='guided-retrieval-and-feedback'||rec?.actionType==='stabilize-regression')return 'diagnostic-labs';
  if(suggested==='different-practice-format'||rec?.actionType==='evidence-confirmation')return 'labs';
  return 'scenario-detail';
}
function practiceRecommendationLabel(rec){
  return ({
    'targeted-remediation':'Untangle a weak area',
    'spaced-retrieval':'Refresh before it fades',
    'refresh-recency-evidence':'Refresh your evidence',
    'evidence-confirmation':'Confirm it another way',
    'stabilize-regression':'Rebuild a slipping skill',
    'transfer-practice':'Use it in a new context'
  })[rec?.actionType]||'Recommended next';
}
function practiceRecommendationCta(action,rec){
  if(action==='material-labs')return 'Start material practice →';
  if(action==='diagnostic-labs')return 'Start diagnostic practice →';
  if(action==='labs')return 'Choose a practice lab →';
  const suggested=String(rec?.suggestedActivity||'').toLowerCase();
  if(suggested==='discriminating-scenario-practice')return 'Start discriminating scenario →';
  if(suggested==='retrieval-practice')return 'Start retrieval practice →';
  if(suggested==='timestamped-practice-or-assessment')return 'Refresh with a scenario →';
  if(suggested==='different-context-scenario')return 'Try a new-context scenario →';
  return 'Start recommended scenario →';
}
function learnerPracticePlan(){
  const model=window.MM_LEARNER_MODEL;
  if(!model?.recommendations||!model?.summary)return null;
  try{
    const recommendations=model.recommendations(3)||[],summary=model.summary()||{};
    if(!recommendations.length)return {recommendations:[],summary};
    return {recommendations,summary};
  }catch(_){return null}
}
function practiceStatusLine(plan){
  if(!plan)return 'Your practice suggestions will personalise as you complete lessons, scenarios, labs and assessments.';
  const s=plan.summary||{},bits=[];
  if(Number(s.highStuckness)>0)bits.push(`${s.highStuckness} weak area${s.highStuckness===1?'':'s'} to untangle`);
  if(Number(s.reviewDue)>0)bits.push(`${s.reviewDue} review${s.reviewDue===1?'':'s'} due`);
  if(Number(s.negativeVelocity)>0)bits.push(`${s.negativeVelocity} skill${s.negativeVelocity===1?'':'s'} slipping`);
  if(bits.length)return bits.join(' · ');
  if(Number(s.topics)>0)return 'No urgent weak area detected — use varied practice to strengthen transfer.';
  return 'Complete a lesson, scenario or lab and this page will start recommending what to practise next.';
}
function recommendedPracticeMarkup(plan,done){
  const rec=plan?.recommendations?.[0];
  if(!rec){
    return `<section class="mm-hub-continue mm-primary-hub-card" aria-label="Recommended practice"><div class="mm-hub-continue-copy"><span class="eyebrow">${done?'Keep going · about 5 min':'Recommended start · about 5 min'}</span><h2>${done?'Try a different shop-floor decision':'One moulding decision'}</h2><p>${done?'Your daily drill is complete. Use another scenario to keep the evidence-to-decision habit active.':'Start with one short evidence-first decision. Personal recommendations will appear as the app gathers local learning evidence.'}</p></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="daily">${done?'Practise another scenario →':'Start quick practice →'}</button></section>`;
  }
  const action=practiceActionFor(rec),topic=practiceTopicLabel(rec.topic),label=practiceRecommendationLabel(rec);
  const signal=rec.actionType==='targeted-remediation'&&Number.isFinite(Number(rec.stuckness))?`Repeated misses · ${Math.round(Number(rec.stuckness))}% stuckness signal`:rec.actionType==='spaced-retrieval'&&Number.isFinite(Number(rec.ageDays))?`Last evidence ${Math.round(Number(rec.ageDays))} day${Math.round(Number(rec.ageDays))===1?'':'s'} ago`:'Based on your local learning evidence';
  return `<section class="mm-hub-continue mm-primary-hub-card" aria-label="Recommended practice"><div class="mm-hub-continue-copy"><span class="eyebrow">${esc(label)} · 5–10 min</span><h2>${esc(topic)}</h2><p>${esc(rec.reason||'Use a different practice format to strengthen this skill.')}</p><div class="mm-hub-progress"><strong>${esc(signal)}</strong></div></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="${esc(action)}">${esc(practiceRecommendationCta(action,rec))}</button></section>`;
}
function practicePlanRows(plan){
  const rows=(plan?.recommendations||[]).slice(1,3);
  if(!rows.length)return '';
  return `<section class="mm-hub-section" aria-label="More recommended practice"><div class="mm-hub-section-head"><h2>Next after that</h2><p>Optional follow-up based on your learning evidence.</p></div><div class="mm-hub-grid">${rows.map(rec=>{const action=practiceActionFor(rec);return `<button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="${esc(action)}"><span class="eyebrow">${esc(practiceRecommendationLabel(rec))}</span><b>${esc(practiceTopicLabel(rec.topic))}</b><small>${esc(rec.reason||'Use another practice format to strengthen transfer.')}</small><span class="mm-hub-tile-action">${esc(practiceRecommendationCta(action,rec))}</span></button>`}).join('')}</div></section>`;
}
function practiceHubMarkup(){
  let done=false;try{done=typeof dailyDone==='function'&&dailyDone()}catch(_){}
  const scenarioCount=D?.scenarios?.length||0;
  const examCount=D?.exams?Object.keys(D.exams).length:0;
  const plan=learnerPracticePlan();
  return `<div class="mm-primary-hub mm-practice-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Practice</span><h1>What should I practise next?</h1><p>${esc(practiceStatusLine(plan))}</p></header>
    ${recommendedPracticeMarkup(plan,done)}
    ${practicePlanRows(plan)}
    <section class="mm-hub-section"><div class="mm-hub-section-head"><h2>Choose by the job you want to practise</h2><p>Practice is for learning; assessments stay separate.</p></div><div class="mm-hub-grid">
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="troubleshooting"><span class="eyebrow">Find the cause · 5–15 min</span><b>Diagnose a moulding problem</b><small>Start from a defect, separate plausible mechanisms and choose the next discriminating check.</small><span class="mm-hub-tile-action">Choose troubleshooting practice →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="scenario-detail"><span class="eyebrow">Make a decision · about 5 min</span><b>Work a shop-floor scenario</b><small>Read the evidence and choose the strongest next action${scenarioCount?` across ${scenarioCount} scenarios`:''}. Each launch rotates the case.</small><span class="mm-hub-tile-action">Start next scenario →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="process-data"><span class="eyebrow">Read evidence · 10–20 min</span><b>Analyse process data</b><small>Prepare local data, verify signal meaning and compare a fault or recovery against a valid baseline.</small><span class="mm-hub-tile-action">Open data diagnosis →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="labs"><span class="eyebrow">Explore behaviour · 5–15 min</span><b>Use labs & simulators</b><small>Test process and material reasoning in a controlled training environment without changing a real machine.</small><span class="mm-hub-tile-action">Choose a lab or simulator →</span></button>
    </div></section>
    <section class="mm-hub-assessment"><div class="mm-hub-assessment-copy"><b>Want to check what you can demonstrate?</b><small>${examCount?`${examCount} assessment levels`:'Assessments'} are kept separate so practice remains low-stakes and useful for learning.</small></div><button class="secondary" type="button" data-mm-hub-action="assessments">Open assessments →</button></section>
  </div>`;
}
function renderLearnHub(){const root=document.getElementById('path');if(!root)return;root.dataset.mmHubMode='hub';root.innerHTML=learnHubMarkup();bind(root)}
function renderPracticeHub(){const root=document.getElementById('scenarios');if(!root)return;root.dataset.mmHubMode='hub';root.innerHTML=practiceHubMarkup();bind(root)}
function detailBack(root,label,back){
  const bar=document.createElement('div');bar.className='mm-hub-detail-back';bar.innerHTML=`<button type="button">← ${esc(back)}</button><span>${esc(label)}</span>`;
  bar.querySelector('button').addEventListener('click',()=>back==='Learn'?renderLearnHub():renderPracticeHub());root.prepend(bar);
}
function openLearningPathDetail(){const root=document.getElementById('path');if(!root)return;root.dataset.mmHubMode='detail';originalRenderPath();detailBack(root,'Full learning pathway','Learn');window.scrollTo({top:0,behavior:'smooth'})}
function openScenarioDetail(index=null){
  const root=document.getElementById('scenarios');if(!root)return;
  root.dataset.mmHubMode='detail';
  originalRenderScenarios();
  detailBack(root,'Troubleshooting Arena','Practice');
  if(!Number.isInteger(index)){window.scrollTo({top:0,behavior:'smooth'});return}
  requestAnimationFrame(()=>{
    const cards=Array.from(root.querySelectorAll('.scenario,.mm-scenario-card,[data-scenario-id]'));
    const target=cards[Math.max(0,Math.min(cards.length-1,index))]||cards[0];
    target?.scrollIntoView?.({block:'start',behavior:'smooth'});
  });
}

renderPath=renderLearnHub;window.renderPath=renderLearnHub;
renderScenarios=renderPracticeHub;window.renderScenarios=renderPracticeHub;
window.mmHubOpenLesson=openCurrentLesson;
window.mmHubOpenLearningPath=openLearningPathDetail;
window.mmHubOpenScenarios=openScenarioDetail;

function simplifyHome(){
  const root=document.getElementById('dashboard');if(!root)return;
  root.querySelectorAll('.mm-home-task-hub').forEach(el=>el.remove());
  root.querySelectorAll('#mmDashboardRegistryBefore .mm-dashboard-slot:not([data-mm-dashboard-section="today-focus"]),#mmDashboardRegistryAfter .mm-dashboard-slot').forEach(el=>el.remove());
  root.querySelectorAll('button[data-mm-onclick]').forEach(button=>{
    const action=button.getAttribute('data-mm-onclick')||'';
    if(/switchView\((['"])lesson\1\)/.test(action))button.setAttribute('data-mm-onclick','mmHubOpenLesson()');
  });
}
window.MM_APP_SHELL?.events?.onRender?.('dashboard',()=>requestAnimationFrame(simplifyHome));

function configureMore(){
  const moved=new Set(['mould-master','diagnostic-labs','process-data','material-labs']);
  const items=window.MM_APP_SHELL?.navigation?.items;
  if(items?.forEach)items.forEach((item,id)=>{if(moved.has(id))item.mobileMore=false});
}
function pruneMore(){
  const modal=document.getElementById('modal');if(!modal)return;
  const moved=/^(Material science|Process simulator|Defect finder|Troubleshooting coach|Knowledge checks|Mould Master|Diagnostic labs|Data diagnosis|Material labs)$/i;
  modal.querySelectorAll('.quick-action').forEach(button=>{const label=(button.querySelector('b')?.textContent||'').trim();if(moved.test(label))button.remove()});
}
configureMore();
if(originalMore){
  window.openMobileMenu=function(){const result=originalMore.apply(this,arguments);requestAnimationFrame(()=>requestAnimationFrame(pruneMore));return result};
}

function refreshPracticePersonalisation(){
  const root=document.getElementById('scenarios');
  if(root?.dataset.mmHubMode==='hub'&&typeof currentView==='string'&&currentView==='scenarios')renderPracticeHub();
}
window.addEventListener('mm:domains-ready',()=>requestAnimationFrame(refreshPracticePersonalisation));

simplifyHome();
if(typeof currentView==='string'){
  if(currentView==='path')renderLearnHub();
  if(currentView==='scenarios')renderPracticeHub();
}
window.MM_APP_SHELL?.navigation?.sync?.();
window.MM_PRIMARY_HUBS={version:VERSION,renderLearnHub,renderPracticeHub,openCurrentLesson,openLearningPathDetail,openScenarioDetail,nextScenarioIndex,learnerPracticePlan};
})();