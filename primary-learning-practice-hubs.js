/* MouldMaster primary Learn / Practice hubs — 2026.09.06.1 */
(function(){
'use strict';
if(window.MM_PRIMARY_HUBS)return;
if(typeof renderPath!=='function'||typeof renderScenarios!=='function'||typeof switchView!=='function'){
  console.warn('[MouldMaster] Primary hubs require the core learning and practice views.');
  return;
}

const VERSION='2026.09.06.1';
const originalRenderPath=renderPath;
const originalRenderScenarios=renderScenarios;
const originalMore=typeof window.openMobileMenu==='function'?window.openMobileMenu:null;

const style=document.createElement('style');
style.id='mm-primary-hubs-style';
style.textContent=`
.mm-primary-hub{max-width:960px;margin:0 auto;display:grid;gap:15px}
.mm-primary-hub-head{padding:3px 2px 4px}.mm-primary-hub-head .eyebrow{display:block;margin-bottom:6px}.mm-primary-hub-head h1{margin:0;font-size:clamp(28px,4vw,38px);line-height:1.1}.mm-primary-hub-head p{margin:8px 0 0;color:#aebfd4;line-height:1.5;max-width:720px}
.mm-primary-hub-card{padding:22px 23px;border:1px solid #35516f;border-radius:19px;background:linear-gradient(180deg,#13283e,#102338);box-shadow:none}
.mm-primary-hub-card .eyebrow{display:block;margin-bottom:8px;font-size:12px;letter-spacing:.13em}.mm-primary-hub-card h2{margin:0;font-size:clamp(25px,4vw,34px);line-height:1.12;letter-spacing:-.02em}.mm-primary-hub-card p{margin:11px 0 0;color:#bdcde0;font-size:16px;line-height:1.55;max-width:780px}
.mm-primary-hub-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.mm-primary-hub-card .mini-bar{margin:14px 0 0}.mm-primary-hub-card>.primary,.mm-primary-hub-card>.secondary{width:100%;min-height:50px;margin-top:16px;font-size:16px;font-weight:800}
.mm-primary-hub-card-secondary h2{font-size:25px}.mm-primary-hub-card-secondary p{font-size:15px}.mm-primary-hub-card-secondary>.primary{min-height:48px}
.mm-hub-detail-back{display:flex;align-items:center;gap:10px;margin:0 0 15px;padding:12px 14px;border:1px solid #304a68;border-radius:14px;background:#0f1f34;color:#dce8f6}.mm-hub-detail-back button{border:0;background:transparent;color:#8fe8d6;font-weight:800;padding:0}.mm-hub-detail-back span{color:#9fb1c7;font-size:13px}
.mm-hub-picker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.mm-hub-picker-grid button{min-height:112px;padding:15px;border:1px solid #35516f;border-radius:14px;background:#11243a;color:#edf5ff;text-align:left}.mm-hub-picker-grid button b{display:block;font-size:15px;margin-bottom:5px}.mm-hub-picker-grid button small{display:block;color:#a9bdd4;line-height:1.45}
#dashboard .mm-home-task-hub{display:none!important}
#dashboard #mmDashboardRegistryBefore .mm-dashboard-slot:not([data-mm-dashboard-section="today-focus"]),#dashboard #mmDashboardRegistryAfter .mm-dashboard-slot{display:none!important}
@media(max-width:760px){.mm-primary-hub{gap:13px}.mm-primary-hub-head{padding:0}.mm-primary-hub-head h1{font-size:29px}.mm-primary-hub-card{padding:20px 19px;border-radius:18px}.mm-primary-hub-card h2{font-size:29px}.mm-primary-hub-card p{font-size:16px}.mm-primary-hub-card-secondary h2{font-size:25px}.mm-primary-hub-card-secondary p{font-size:15px}.mm-hub-picker-grid{grid-template-columns:1fr}.mm-hub-picker-grid button{min-height:0}}
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
function pill(text){return `<span class="pill">${esc(text)}</span>`}
function bind(root){
  root?.querySelectorAll('[data-mm-hub-action]').forEach(button=>button.addEventListener('click',()=>runAction(button.dataset.mmHubAction)));
}
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
    openModal(`<span class="eyebrow">Learn</span><h2>Learning resources</h2><p class="muted">Open the resource you need without adding another permanent section to Learn.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="visuals"><b>Animated visuals</b><small>See core cycle and process ideas visually.</small></button><button type="button" data-mm-hub-action="glossary"><b>Glossary</b><small>Look up injection moulding terms in plain language.</small></button><button type="button" data-mm-hub-action="saved"><b>Saved lessons</b><small>Return to lessons you bookmarked for review.</small></button></div>`);
  }else if(kind==='troubleshooting'){
    openModal(`<span class="eyebrow">Practice</span><h2>Troubleshooting</h2><p class="muted">Choose the troubleshooting activity that matches what you want to practise.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="mould-master"><b>Mould Master</b><small>Build an evidence-led troubleshooting case from a real defect.</small></button><button type="button" data-mm-hub-action="defects"><b>Defect finder</b><small>Start from the symptom and review mechanisms and checks.</small></button><button type="button" data-mm-hub-action="coach"><b>Troubleshooting coach</b><small>Work through a problem with structured offline guidance.</small></button><button type="button" data-mm-hub-action="diagnostic-labs"><b>Diagnostic labs</b><small>Practise evidence-first fault isolation.</small></button></div>`);
  }else if(kind==='labs'){
    openModal(`<span class="eyebrow">Practice</span><h2>Labs & simulators</h2><p class="muted">Use controlled learning tools to explore process and material behaviour.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="simulator"><b>Process simulator</b><small>Explore relative process changes in the training model.</small></button><button type="button" data-mm-hub-action="material-labs"><b>Material labs</b><small>Compare resin behaviour and evidence.</small></button></div>`);
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
  const totalLessons=D?.lessons?.length||120;
  const lesson=c?.lesson;const course=c?.course;
  return `<div class="mm-primary-hub mm-learn-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Learn</span><h1>Keep learning simple.</h1><p>Continue where you left off, or open one learning area. Everything lesson-based now lives here.</p></header>
    <section class="mm-primary-hub-card"><span class="eyebrow">Continue learning</span><h2>${esc(lesson?.title||'Your next lesson')}</h2><p>${course?`Track ${course.id}: ${esc(course.name)} · Lesson ${(c.position||0)+1}/${course.lessonIds.length}. Pick up exactly where you left off.`:'Open your current lesson and continue your pathway.'}</p><div class="mm-primary-hub-meta">${pill(`${lesson?.duration||12} min lesson`)}${pill(`${c?.overall||0}% overall`)}${pill(`${totalLessons} lessons`)}</div><div class="mini-bar"><span style="width:${c?.overall||0}%"></span></div><button class="primary" type="button" data-mm-hub-action="lesson">Continue lesson →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Learning path</span><h2>All lesson tracks</h2><p>Browse the full beginner-to-expert pathway only when you want to choose a different track.</p><div class="mm-primary-hub-meta">${pill(`${totalTracks} tracks`)}${pill(`${totalLessons} core lessons`)}</div><button class="primary" type="button" data-mm-hub-action="path-detail">Browse learning path →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Materials</span><h2>Material science</h2><p>Learn polymer behaviour, material families and evidence boundaries in one dedicated area.</p><div class="mm-primary-hub-meta">${pill('Material behaviour')}${pill('Interactive learning')}</div><button class="primary" type="button" data-mm-hub-action="materials">Open material learning →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Go deeper</span><h2>Specialist learning</h2><p>Open optional specialist lessons when you need more depth beyond the core pathway.</p><div class="mm-primary-hub-meta">${pill(specialistCount?`${specialistCount} optional lessons`:'Optional lessons')}${pill('Evidence-bounded')}</div><button class="primary" type="button" data-mm-hub-action="specialist">Open specialist learning →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Resources</span><h2>Visuals, glossary & saved lessons</h2><p>Keep supporting learning resources together instead of spreading them across navigation menus.</p><div class="mm-primary-hub-meta">${pill(`${saved} saved`)}${pill('Visual learning')}${pill('Glossary')}</div><button class="primary" type="button" data-mm-hub-action="learn-resources">Open learning resources →</button></section>
  </div>`;
}
function practiceHubMarkup(){
  const done=typeof dailyDone==='function'&&dailyDone();
  const scenarioCount=D?.scenarios?.length||0;
  const examCount=D?.exams?Object.keys(D.exams).length:0;
  return `<div class="mm-primary-hub mm-practice-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Practice</span><h1>Practise one thing at a time.</h1><p>All drills, troubleshooting, process-data work, labs and assessments now start here.</p></header>
    <section class="mm-primary-hub-card"><span class="eyebrow">Daily practice</span><h2>${done?'Daily practice complete ✓':'One short moulding decision'}</h2><p>${done?'You have completed today’s short decision drill. Use another practice area when you want more.':'Take one short evidence-first scenario to keep troubleshooting judgement sharp.'}</p><div class="mm-primary-hub-meta">${pill('About 5 min')}${pill('Evidence-first')}${pill(done?'Complete today':'Ready now')}</div><button class="primary" type="button" data-mm-hub-action="daily">${done?'Practise another scenario →':'Start daily practice →'}</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Troubleshooting</span><h2>Diagnose moulding problems</h2><p>Use Mould Master, the defect finder, coach or diagnostic labs from one troubleshooting entry point.</p><div class="mm-primary-hub-meta">${pill('Mould Master')}${pill('Defects')}${pill('Diagnostic labs')}</div><button class="primary" type="button" data-mm-hub-action="troubleshooting">Open troubleshooting →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Process evidence</span><h2>Analyse process data</h2><p>Read baseline, fault and recovery trends before deciding what evidence or setting to check next.</p><div class="mm-primary-hub-meta">${pill('Trends')}${pill('Evidence checks')}${pill('Local data')}</div><button class="primary" type="button" data-mm-hub-action="process-data">Open data diagnosis →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Decision drills</span><h2>Practice scenarios</h2><p>Work through realistic shop-floor situations and choose the strongest next action from the evidence.</p><div class="mm-primary-hub-meta">${pill(`${scenarioCount} scenarios`)}${pill('Shop-floor judgement')}</div><button class="primary" type="button" data-mm-hub-action="scenario-detail">Open scenarios →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Explore behaviour</span><h2>Labs & simulators</h2><p>Use the process simulator and material labs for controlled learning without treating them as production recipes.</p><div class="mm-primary-hub-meta">${pill('Process simulator')}${pill('Material labs')}</div><button class="primary" type="button" data-mm-hub-action="labs">Open labs & simulators →</button></section>
    <section class="mm-primary-hub-card mm-primary-hub-card-secondary"><span class="eyebrow">Check understanding</span><h2>Knowledge checks</h2><p>Take the governed assessments when you are ready to test what you have learned.</p><div class="mm-primary-hub-meta">${pill(examCount?`${examCount} levels`:'Assessments')}${pill('Safety-gated')}${pill('80% pass rule')}</div><button class="primary" type="button" data-mm-hub-action="assessments">Open assessments →</button></section>
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
