/* MouldMaster primary Learn / Practice hubs — 2026.09.06.3 */
(function(){
'use strict';
if(window.MM_PRIMARY_HUBS)return;
if(typeof renderPath!=='function'||typeof renderScenarios!=='function'||typeof switchView!=='function'){
  console.warn('[MouldMaster] Primary hubs require the core learning and practice views.');
  return;
}

const VERSION='2026.09.06.3';
const originalRenderPath=renderPath;
const originalRenderScenarios=renderScenarios;
const originalMore=typeof window.openMobileMenu==='function'?window.openMobileMenu:null;

/* Hub presentation lives in ui-shell.css. The app CSP intentionally blocks
   runtime-created <style> elements, so keeping these rules external prevents
   the unstyled grey-button fallback seen on mobile. */

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
  if(typeof openDailyChallenge==='function'){openDailyChallenge();requestAnimationFrame(sanitizeDailyChallenge);return}
  openScenarioDetail();
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
    case 'lesson': return switchView('lesson');
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
    case 'scenario-detail': return openScenarioDetail();
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
function practiceHubMarkup(){
  const done=typeof dailyDone==='function'&&dailyDone();
  const scenarioCount=D?.scenarios?.length||0;
  const examCount=D?.exams?Object.keys(D.exams).length:0;
  return `<div class="mm-primary-hub mm-practice-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Practice</span><h1>What do you want to practise?</h1><p>Choose the kind of job you want to work on.</p></header>
    <section class="mm-hub-continue mm-primary-hub-card" aria-label="Daily practice"><div class="mm-hub-continue-copy"><span class="eyebrow">Quick practice · about 5 min</span><h2>${done?'Daily practice complete ✓':'One moulding decision'}</h2><p>${done?'Today’s short drill is complete. You can keep practising whenever you want.':'Make one evidence-first decision and check your reasoning.'}</p></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="daily">${done?'Practise another scenario →':'Start daily practice →'}</button></section>
    <section class="mm-hub-section"><div class="mm-hub-section-head"><h2>Choose a practice mode</h2><p>Start from the job, not the tool.</p></div><div class="mm-hub-grid">
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="troubleshooting"><span class="eyebrow">Fault finding</span><b>Diagnose a moulding problem</b><small>Work from the defect and evidence to choose the next check.</small><span class="mm-hub-tile-action">Open troubleshooting →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="process-data"><span class="eyebrow">Process evidence</span><b>Analyse process data</b><small>Compare baseline, fault and recovery trends.</small><span class="mm-hub-tile-action">Open data diagnosis →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="scenario-detail"><span class="eyebrow">Decision practice</span><b>Work a shop-floor scenario</b><small>Choose the strongest next action from the evidence${scenarioCount?` across ${scenarioCount} scenarios`:''}.</small><span class="mm-hub-tile-action">Open scenarios →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="labs"><span class="eyebrow">Explore behaviour</span><b>Use labs & simulators</b><small>Explore process and material behaviour safely.</small><span class="mm-hub-tile-action">Open labs & simulators →</span></button>
    </div></section>
    <section class="mm-hub-assessment"><div class="mm-hub-assessment-copy"><b>Ready to check your understanding?</b><small>${examCount?`${examCount} assessment levels`:'Assessments'} stay separate from normal practice.</small></div><button class="secondary" type="button" data-mm-hub-action="assessments">Open assessments →</button></section>
  </div>`;
}
function renderLearnHub(){const root=document.getElementById('path');if(!root)return;root.innerHTML=learnHubMarkup();bind(root)}
function renderPracticeHub(){const root=document.getElementById('scenarios');if(!root)return;root.innerHTML=practiceHubMarkup();bind(root)}
function detailBack(root,label,back){
  const bar=document.createElement('div');bar.className='mm-hub-detail-back';bar.innerHTML=`<button type="button">← ${esc(back)}</button><span>${esc(label)}</span>`;
  bar.querySelector('button').addEventListener('click',()=>back==='Learn'?renderLearnHub():renderPracticeHub());root.prepend(bar);
}
function openLearningPathDetail(){const root=document.getElementById('path');if(!root)return;originalRenderPath();detailBack(root,'Full learning pathway','Learn');window.scrollTo({top:0,behavior:'smooth'})}
function openScenarioDetail(){const root=document.getElementById('scenarios');if(!root)return;originalRenderScenarios();detailBack(root,'Troubleshooting Arena','Practice');window.scrollTo({top:0,behavior:'smooth'})}

renderPath=renderLearnHub;window.renderPath=renderLearnHub;
renderScenarios=renderPracticeHub;window.renderScenarios=renderPracticeHub;
window.mmHubOpenLearningPath=openLearningPathDetail;
window.mmHubOpenScenarios=openScenarioDetail;

function simplifyHome(){
  const root=document.getElementById('dashboard');if(!root)return;
  root.querySelectorAll('.mm-home-task-hub').forEach(el=>el.remove());
  root.querySelectorAll('#mmDashboardRegistryBefore .mm-dashboard-slot:not([data-mm-dashboard-section="today-focus"]),#mmDashboardRegistryAfter .mm-dashboard-slot').forEach(el=>el.remove());
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

simplifyHome();
if(typeof currentView==='string'){
  if(currentView==='path')renderLearnHub();
  if(currentView==='scenarios')renderPracticeHub();
}
window.MM_APP_SHELL?.navigation?.sync?.();
window.MM_PRIMARY_HUBS={version:VERSION,renderLearnHub,renderPracticeHub,openLearningPathDetail,openScenarioDetail};
})();