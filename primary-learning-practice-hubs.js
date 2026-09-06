/* MouldMaster primary Learn / Practice hubs — 2026.09.06.2 */
(function(){
'use strict';
if(window.MM_PRIMARY_HUBS)return;
if(typeof renderPath!=='function'||typeof renderScenarios!=='function'||typeof switchView!=='function'){
  console.warn('[MouldMaster] Primary hubs require the core learning and practice views.');
  return;
}

const VERSION='2026.09.06.2';
const originalRenderPath=renderPath;
const originalRenderScenarios=renderScenarios;
const originalMore=typeof window.openMobileMenu==='function'?window.openMobileMenu:null;

const style=document.createElement('style');
style.id='mm-primary-hubs-style';
style.textContent=`
.mm-primary-hub{max-width:1040px;margin:0 auto;display:grid;gap:18px}
.mm-primary-hub-head{padding:2px 2px 0}.mm-primary-hub-head .eyebrow{display:block;margin-bottom:5px}.mm-primary-hub-head h1{margin:0;font-size:clamp(29px,4vw,39px);line-height:1.08;letter-spacing:-.025em}.mm-primary-hub-head p{margin:7px 0 0;color:#aebfd4;line-height:1.5;max-width:700px;font-size:15px}
.mm-hub-continue{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:end;padding:23px 24px;border:1px solid #41617f;border-radius:18px;background:linear-gradient(180deg,#142b43,#10243a);box-shadow:none}
.mm-hub-continue-copy .eyebrow{display:block;margin-bottom:7px;font-size:11px;letter-spacing:.13em}.mm-hub-continue h2{margin:0;font-size:clamp(24px,3.4vw,32px);line-height:1.15;letter-spacing:-.018em}.mm-hub-continue p{margin:8px 0 0;color:#bfd0e1;line-height:1.52;max-width:700px;font-size:15px}
.mm-hub-progress{display:flex;align-items:center;gap:10px;margin-top:14px;color:#9eb3ca;font-size:12px}.mm-hub-progress .mini-bar{flex:1;max-width:320px;margin:0}.mm-hub-progress strong{color:#dce8f6;font-size:12px;white-space:nowrap}
.mm-hub-continue-action{min-width:185px;min-height:48px;padding:11px 17px;font-size:15px;font-weight:800}
.mm-hub-section{display:grid;gap:10px}.mm-hub-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:0 2px}.mm-hub-section-head h2{margin:0;font-size:18px;line-height:1.25}.mm-hub-section-head p{margin:0;color:#8299b2;font-size:12px}
.mm-hub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.mm-hub-tile{appearance:none;width:100%;min-height:142px;padding:18px 19px;border:1px solid #304b68;border-radius:15px;background:linear-gradient(180deg,#11243a,#0e1f33);color:#eef6ff;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;cursor:pointer;box-shadow:none;transition:border-color .16s ease,transform .16s ease,background .16s ease}
.mm-hub-tile:hover{border-color:#52779a;background:linear-gradient(180deg,#152c45,#10243a);transform:translateY(-1px)}.mm-hub-tile:focus-visible{outline:2px solid #8fe8d6;outline-offset:2px}
.mm-hub-tile .eyebrow{display:block;margin:0 0 6px;font-size:10px;letter-spacing:.12em}.mm-hub-tile b{display:block;font-size:19px;line-height:1.22}.mm-hub-tile small{display:block;margin-top:7px;color:#aebfd4;font-size:13px;line-height:1.45;max-width:560px}.mm-hub-tile-action{display:block;margin-top:auto;padding-top:14px;color:#8fe8d6;font-size:12px;font-weight:850}
.mm-hub-assessment{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border:1px solid #2c455f;border-radius:14px;background:#0e1f32}.mm-hub-assessment-copy b{display:block;font-size:15px}.mm-hub-assessment-copy small{display:block;margin-top:4px;color:#9eb2c9;line-height:1.4}.mm-hub-assessment button{flex:0 0 auto;min-height:42px;padding:9px 14px}
.mm-hub-detail-back{display:flex;align-items:center;gap:10px;margin:0 0 15px;padding:12px 14px;border:1px solid #304a68;border-radius:14px;background:#0f1f34;color:#dce8f6}.mm-hub-detail-back button{border:0;background:transparent;color:#8fe8d6;font-weight:800;padding:0}.mm-hub-detail-back span{color:#9fb1c7;font-size:13px}
.mm-hub-picker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.mm-hub-picker-grid button{min-height:100px;padding:15px;border:1px solid #35516f;border-radius:14px;background:#11243a;color:#edf5ff;text-align:left}.mm-hub-picker-grid button b{display:block;font-size:15px;margin-bottom:5px}.mm-hub-picker-grid button small{display:block;color:#a9bdd4;line-height:1.45}
#dashboard .mm-home-task-hub{display:none!important}
#dashboard #mmDashboardRegistryBefore .mm-dashboard-slot:not([data-mm-dashboard-section="today-focus"]),#dashboard #mmDashboardRegistryAfter .mm-dashboard-slot{display:none!important}
@media(max-width:760px){
 .mm-primary-hub{gap:16px}.mm-primary-hub-head{padding:0}.mm-primary-hub-head h1{font-size:30px}.mm-primary-hub-head p{font-size:14px}
 .mm-hub-continue{grid-template-columns:1fr;gap:15px;padding:19px;border-radius:17px}.mm-hub-continue h2{font-size:25px}.mm-hub-continue p{font-size:14px}.mm-hub-progress{margin-top:12px}.mm-hub-continue-action{width:100%;min-height:48px}
 .mm-hub-section-head{align-items:start;flex-direction:column;gap:2px}.mm-hub-section-head p{display:none}.mm-hub-grid{grid-template-columns:1fr;gap:9px}
 .mm-hub-tile{min-height:0;padding:16px 17px;border-radius:14px}.mm-hub-tile b{font-size:18px}.mm-hub-tile small{font-size:13px}.mm-hub-tile-action{padding-top:11px}
 .mm-hub-assessment{align-items:stretch;flex-direction:column;gap:11px}.mm-hub-assessment button{width:100%}.mm-hub-picker-grid{grid-template-columns:1fr}.mm-hub-picker-grid button{min-height:0}
}
`;
document.head.appendChild(style);

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
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="path-detail"><span class="eyebrow">Core learning</span><b>Learning path</b><small>Browse all ${totalTracks} tracks and choose a different lesson.</small><span class="mm-hub-tile-action">Browse learning path →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="materials"><span class="eyebrow">Materials</span><b>Material science</b><small>Understand polymer behaviour, material families and evidence boundaries.</small><span class="mm-hub-tile-action">Open material learning →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="specialist"><span class="eyebrow">Advanced</span><b>Specialist learning</b><small>${specialistCount?`${specialistCount} optional lessons`:'Optional lessons'} for deeper technical study beyond the core path.</small><span class="mm-hub-tile-action">Open specialist learning →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="learn-resources"><span class="eyebrow">Reference while learning</span><b>Visuals, glossary & saved</b><small>Use diagrams, plain-language terms and ${saved} saved lesson${saved===1?'':'s'} when you need them.</small><span class="mm-hub-tile-action">Open learning resources →</span></button>
    </div></section>
  </div>`;
}
function practiceHubMarkup(){
  const done=typeof dailyDone==='function'&&dailyDone();
  const scenarioCount=D?.scenarios?.length||0;
  const examCount=D?.exams?Object.keys(D.exams).length:0;
  return `<div class="mm-primary-hub mm-practice-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Practice</span><h1>What do you want to practise?</h1><p>Choose the type of job you want to work on.</p></header>
    <section class="mm-hub-continue mm-primary-hub-card" aria-label="Daily practice"><div class="mm-hub-continue-copy"><span class="eyebrow">Quick practice · about 5 min</span><h2>${done?'Daily practice complete ✓':'One moulding decision'}</h2><p>${done?'You have finished today’s short drill. You can practise another scenario whenever you want.':'Make one evidence-first decision and check your reasoning.'}</p></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="daily">${done?'Practise another scenario →':'Start daily practice →'}</button></section>
    <section class="mm-hub-section"><div class="mm-hub-section-head"><h2>Choose a practice mode</h2><p>Start from the job, not the tool.</p></div><div class="mm-hub-grid">
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="troubleshooting"><span class="eyebrow">Fault finding</span><b>Diagnose a moulding problem</b><small>Work from the defect, evidence and process history to choose the strongest next check.</small><span class="mm-hub-tile-action">Open troubleshooting →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="process-data"><span class="eyebrow">Process evidence</span><b>Analyse process data</b><small>Read baseline, fault and recovery trends before deciding what to check next.</small><span class="mm-hub-tile-action">Open data diagnosis →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="scenario-detail"><span class="eyebrow">Decision practice</span><b>Work a shop-floor scenario</b><small>Choose the strongest next action from the evidence across ${scenarioCount} scenarios.</small><span class="mm-hub-tile-action">Open scenarios →</span></button>
      <button class="mm-hub-tile mm-primary-hub-card-secondary" type="button" data-mm-hub-action="labs"><span class="eyebrow">Explore behaviour</span><b>Use labs & simulators</b><small>Explore process and material behaviour in controlled training tools.</small><span class="mm-hub-tile-action">Open labs & simulators →</span></button>
    </div></section>
    <section class="mm-hub-assessment"><div class="mm-hub-assessment-copy"><b>Ready to check your understanding?</b><small>${examCount?`${examCount} assessment levels`:'Assessments'} remain separate from practice so drills do not feel like tests.</small></div><button class="secondary" type="button" data-mm-hub-action="assessments">Open assessments →</button></section>
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
