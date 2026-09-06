/* MouldMaster learning experience tightening — 2026.09.07.1 */
(function(){
'use strict';

const VERSION='2026.09.07.1';
if(typeof renderLesson!=='function'||typeof renderDashboard!=='function'||typeof currentLesson!=='function'){
  throw new Error('MouldMaster core learning functions must load before learning-experience.js');
}

const originalRenderLesson=renderLesson;
const originalRenderDashboard=renderDashboard;
let noteTimer=null;

const styles=document.createElement('style');
styles.id='mm-learning-experience-style';
styles.textContent=`
.mm-learning-progress{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px 15px;margin:-6px 0 18px;border:1px solid #2f4968;border-radius:13px;background:#0d1b2f}
.mm-learning-progress strong{display:block;margin-bottom:3px}.mm-learning-progress small{color:var(--muted);line-height:1.4}.mm-learning-progress .mini-bar{grid-column:1/-1;margin:0}
.mm-learning-jumps{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}.mm-learning-jumps button{min-height:38px;padding:7px 10px;border:1px solid #344f6f;border-radius:999px;background:#11243a;color:#c8d9ec;font-size:12px}
.mm-learning-jumps button:hover,.mm-learning-jumps button:focus-visible{border-color:#68a7ff;background:#17304d;color:#fff}
.mm-next-card{margin-top:18px;padding:16px;border:1px solid #34516e;border-radius:13px;background:linear-gradient(135deg,#10243a,#122b3d)}
.mm-next-card h3{margin:5px 0 7px}.mm-next-card p{margin:0;color:#b9cade;line-height:1.5}.mm-next-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.mm-note-status{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:7px;color:var(--muted);font-size:11px}.mm-note-status [data-state="saved"]{color:var(--good)}
.mm-today-focus{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:17px 18px;margin-bottom:14px;border:1px solid #34516e;border-radius:15px;background:linear-gradient(135deg,#10233a,#122b3d)}
.mm-today-focus h2{font-size:20px;margin:4px 0 5px}.mm-today-focus p{margin:0;color:#b9cade;line-height:1.45}.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
.mm-home-utility{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mm-home-utility button{min-height:44px;padding:8px 11px}
.mm-saved-list{display:grid;gap:8px;margin-top:14px}.mm-saved-row{width:100%;min-height:54px;padding:11px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center;text-align:left;border:1px solid #304b69;border-radius:12px;background:#102039;color:#edf5ff}.mm-saved-row:hover,.mm-saved-row:focus-visible{border-color:#69a8ff;background:#152a45}.mm-saved-row b{display:block}.mm-saved-row small{display:block;margin-top:3px;color:#9fb3cb}.mm-saved-empty{padding:14px;border:1px dashed #35516f;border-radius:12px;color:#aebfd4}.mm-search-result-type{display:inline-block;min-width:64px;margin-right:7px;color:#9fd8ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.mm-search-result-reason{display:block;margin-top:3px;color:#91a8c4;font-size:11px}.mm-home-resume-label{display:inline-flex;align-items:center;gap:5px;margin-bottom:2px;color:#9ff3df;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.mm-home-task-hub{margin-bottom:16px;padding:18px;border:1px solid #2f4968;border-radius:16px;background:linear-gradient(180deg,#101f34,#0d1a2d)}
.mm-home-task-hub h2{font-size:21px;margin:5px 0 5px}.mm-home-task-hub>p{margin:0;color:#aebfd4;line-height:1.45}
.mm-home-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
.mm-home-action{min-height:128px;padding:15px;border:1px solid #35516f;border-radius:14px;background:linear-gradient(180deg,#14243a,#0e1c2f);color:#edf5ff;text-align:left;display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.mm-home-action:hover,.mm-home-action:focus-visible{border-color:#69a8ff;background:#172b45;transform:translateY(-1px)}
.mm-home-action-primary{border-color:#438177;background:linear-gradient(180deg,#12333a,#10262f)}
.mm-home-action-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#19334c;color:#9dd3ff;font-size:18px;font-weight:900}
.mm-home-action-primary .mm-home-action-icon{background:#16433d;color:#9ff3df}
.mm-home-action strong{display:block;font-size:14px;line-height:1.3}.mm-home-action small{display:block;margin-top:4px;color:#9fb3cb;line-height:1.4;font-size:11px}
.mm-lesson-list-state{font-size:10px;color:var(--muted);margin-left:4px}.lesson-list button[aria-current="step"]{box-shadow:inset 3px 0 0 var(--accent)}
.mm-mobile-actions{display:none}
@media(max-width:1100px){.mm-home-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
  .mm-today-focus{grid-template-columns:1fr}.mm-today-focus>button{width:100%}
  .mm-home-task-hub{padding:15px;margin-bottom:14px}.mm-home-task-hub h2{font-size:19px}
  .mm-home-actions{grid-template-columns:1fr 1fr;gap:8px}.mm-home-action{min-height:116px;padding:13px}
  #dashboard .mm-home-core-hero,#dashboard .mm-home-kpis,#dashboard .mm-home-course-head,#dashboard .mm-home-course-grid{display:none!important}
  #dashboard .mm-specialist-strip{padding:14px 15px!important;margin-top:14px!important}
  #dashboard .mm-specialist-strip>p{display:none!important}
  #dashboard .mm-specialist-strip .mm-specialist-meta{margin:7px 0 10px!important}
  #dashboard .mm-specialist-strip .mm-specialist-meta span:last-child{display:none!important}
  #dashboard .mm-specialist-strip button{width:100%}
  #lesson .lesson-body{padding:19px 17px 98px}.mm-learning-progress{grid-template-columns:1fr}.mm-learning-progress .pill{width:max-content}
  .mm-mobile-actions{position:fixed;display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;left:0;right:0;bottom:0;z-index:18;padding:9px max(12px,env(safe-area-inset-right)) calc(9px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:rgba(7,16,28,.96);border-top:1px solid #314966;backdrop-filter:blur(12px)}
  .mm-mobile-actions button{min-height:46px}.mm-mobile-actions .primary{width:100%}
  #lesson .lesson-side{margin-bottom:76px}.mm-learning-jumps{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.mm-learning-jumps button{white-space:nowrap}
}
@media(max-width:430px){.mm-home-actions{grid-template-columns:1fr}.mm-home-action{min-height:0;display:grid;grid-template-columns:auto 1fr;align-items:center}.mm-home-action-icon{grid-row:1/span 2}}
@media(prefers-reduced-motion:reduce){.mm-learning-jumps button{scroll-behavior:auto}.mm-home-action:hover{transform:none}}
`;
document.head.appendChild(styles);

function context(){
  const lesson=currentLesson();
  const course=D.courses.find(x=>x.id===lesson.course);
  const position=Math.max(0,course.lessonIds.indexOf(lesson.id));
  const globalIndex=Math.max(0,D.lessons.findIndex(x=>x.id===lesson.id));
  const previous=D.lessons[globalIndex-1]||null;
  const next=D.lessons[globalIndex+1]||null;
  return {lesson,course,position,globalIndex,previous,next};
}

function jumpTo(id){
  const el=document.getElementById(id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}
window.mmLearningJump=jumpTo;


function lessonById(id){return D?.lessons?.find(x=>x.id===Number(id))||null}
function courseForLesson(lesson){return lesson?D?.courses?.find(x=>x.id===lesson.course)||null:null}
function openSavedLesson(id){
  const lesson=lessonById(id);if(!lesson)return;
  user.currentLesson=lesson.id;persist();
  if(typeof closeModal==='function')closeModal();
  if(typeof switchView==='function')switchView('lesson');
  try{window.scrollTo({top:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
}
function openSavedLessons(){
  const ids=(Array.isArray(user?.bookmarks)?user.bookmarks:[]).map(Number).filter(id=>lessonById(id));
  const rows=ids.map(id=>{
    const lesson=lessonById(id),course=courseForLesson(lesson);
    return `<button class="mm-saved-row" type="button" data-mm-saved-lesson="${lesson.id}"><span><b>${esc(lesson.title)}</b><small>${course?`Track ${course.id}: ${esc(course.name)}`:'Saved lesson'}</small></span><span aria-hidden="true">Open →</span></button>`;
  }).join('');
  if(typeof openModal!=='function')return;
  openModal(`<span class="eyebrow">Learn</span><h2>Saved lessons</h2><p class="muted">${ids.length?`${ids.length} lesson${ids.length===1?'':'s'} saved on this device.`:'Bookmark a lesson and it will appear here.'}</p>${rows?`<div class="mm-saved-list">${rows}</div>`:'<div class="mm-saved-empty">No saved lessons yet.</div>'}`);
  document.querySelectorAll('#modal [data-mm-saved-lesson]').forEach(button=>button.addEventListener('click',()=>openSavedLesson(button.dataset.mmSavedLesson)));
}
window.mmOpenSavedLessons=openSavedLessons;
window.mmOpenSavedLesson=openSavedLesson;

function normaliseSearch(value){return String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function flattenText(value,out=[]){
  if(value==null)return out;
  if(typeof value==='string'||typeof value==='number')out.push(String(value));
  else if(Array.isArray(value))value.forEach(v=>flattenText(v,out));
  else if(typeof value==='object')Object.values(value).forEach(v=>flattenText(v,out));
  return out;
}
function rankText(query,title,body){
  const q=normaliseSearch(query),t=normaliseSearch(title),b=normaliseSearch(body);if(!q)return 0;
  const tokens=q.split(' ').filter(Boolean);let score=0;
  if(t===q)score+=220;else if(t.startsWith(q))score+=150;else if(t.includes(q))score+=115;
  for(const token of tokens){if(t.split(' ').includes(token))score+=42;else if(t.includes(token))score+=25;if(b.includes(token))score+=7}
  if(tokens.every(token=>t.includes(token)))score+=55;
  if(tokens.every(token=>`${t} ${b}`.includes(token)))score+=20;
  return score;
}
function rankedSearch(query){
  const results=[];
  for(const lesson of D?.lessons||[]){
    const course=courseForLesson(lesson);const body=flattenText(lesson).join(' ');const title=lesson.title||'';
    const score=rankText(query,title,`${course?.name||''} ${body}`);if(!score)continue;
    results.push({type:'Lesson',name:title,score,reason:course?`Track ${course.id}: ${course.name}`:'Learning path',action:()=>openSavedLesson(lesson.id)});
  }
  for(const [term,definition] of Object.entries(D?.glossary||{})){
    const score=rankText(query,term,definition);if(!score)continue;
    results.push({type:'Glossary',name:term,score,reason:String(definition).slice(0,90),action:()=>{if(typeof closeModal==='function')closeModal();if(typeof switchView==='function')switchView('glossary');requestAnimationFrame(()=>{const input=document.getElementById('glossarySearch');if(input){input.value=term;if(typeof filterGlossary==='function')filterGlossary()}})}});
  }
  return results.sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type)||a.name.localeCompare(b.name)).slice(0,12);
}
window.mmRankedSearch=rankedSearch;
window.doSearch=function(){
  const input=document.getElementById('searchInput'),area=document.getElementById('searchResults');if(!input||!area)return;
  const query=input.value.trim();if(!query){area.innerHTML='<div class="p muted">Type a lesson or moulding term.</div>';return}
  const results=rankedSearch(query);
  area.innerHTML=results.length?results.map((row,i)=>`<button class="search-item" type="button" data-mm-search-result="${i}"><span class="mm-search-result-type">${esc(row.type)}</span>${esc(row.name)}<small class="mm-search-result-reason">${esc(row.reason)}</small></button>`).join(''):'<div class="p muted">No matches. Try a shorter moulding term.</div>';
  area.querySelectorAll('[data-mm-search-result]').forEach(button=>button.addEventListener('click',()=>results[Number(button.dataset.mmSearchResult)]?.action()));
};

function saveNotesNow(id,area,status){
  if(!area)return;
  user.notes=user.notes||{};
  user.notes[id]=area.value;
  persist();
  if(status){status.textContent='Saved';status.dataset.state='saved'}
}

function installAutosave(lesson){
  const area=document.getElementById('lessonNotes');
  if(!area)return;
  const status=document.querySelector('#lesson .mm-note-save-state');
  const schedule=()=>{
    if(status){status.textContent='Saving…';status.dataset.state='saving'}
    clearTimeout(noteTimer);
    noteTimer=setTimeout(()=>saveNotesNow(lesson.id,area,status),650);
  };
  area.addEventListener('input',schedule);
  area.addEventListener('blur',()=>{
    clearTimeout(noteTimer);
    saveNotesNow(lesson.id,area,status);
  });
}

function completeAndContinue(id){
  const active=D.lessons.find(x=>x.id===id);
  if(!active)return;
  const wasComplete=user.completed.includes(id);
  if(!wasComplete)user.completed.push(id);
  const index=D.lessons.findIndex(x=>x.id===id);
  const next=D.lessons[index+1]||null;
  if(next){
    const courseFinished=active.course!==next.course;
    user.currentLesson=next.id;
    persist();
    renderLesson();
    window.scrollTo({top:0,behavior:'smooth'});
    toast(courseFinished?'Track complete · next track ready':'Lesson complete · next lesson ready');
  }else{
    persist();
    renderLesson();
    toast('Learning path complete ✓');
  }
}
window.mmCompleteAndContinue=completeAndContinue;

window.mmPreviousLesson=function(){
  const c=context();
  if(c.previous)goLesson(c.previous.id);
};
window.mmNextLesson=function(){
  const c=context();
  if(c.next)goLesson(c.next.id);
};
window.mmOpenMouldMaster=function(){
  if(typeof switchView==='function')switchView('defects');
};
window.mmOpenDataDiagnosis=function(){
  if(window.MM_PROCESS_DATA_DIAGNOSTICS?.open)return window.MM_PROCESS_DATA_DIAGNOSTICS.open();
  if(typeof toast==='function')toast('Data diagnosis is still loading. Try again in a moment.');
};

function decorateLesson(){
  const root=document.getElementById('lesson');
  const article=root?.querySelector('.lesson-body');
  const side=root?.querySelector('.lesson-side');
  if(!article||!side)return;
  const c=context();
  const doneInCourse=c.course.lessonIds.filter(id=>user.completed.includes(id)).length;
  const coursePct=Math.round(doneInCourse/c.course.lessonIds.length*100);
  const complete=user.completed.includes(c.lesson.id);

  article.insertAdjacentHTML('afterbegin',`
    <div class="mm-learning-progress" aria-label="Lesson progress">
      <div><strong>Track ${c.course.id}: ${esc(c.course.name)}</strong><small>Lesson ${c.position+1} of ${c.course.lessonIds.length} · ${c.lesson.duration} min · ${doneInCourse}/${c.course.lessonIds.length} completed</small></div>
      <span class="pill">${coursePct}% track progress</span>
      <div class="mini-bar" aria-hidden="true"><span style="width:${coursePct}%"></span></div>
    </div>
    <nav class="mm-learning-jumps" aria-label="Lesson sections">
      <button type="button" data-mm-onclick="mmLearningJump('mmObjectives')">Objectives</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmKeyPoints')">Key points</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmExercise')">Practice</button>
      <button type="button" data-mm-onclick="mmLearningJump('mmNotes')">Notes</button>
    </nav>`);

  const headings=[...article.querySelectorAll('h3')];
  const objectives=headings.find(x=>x.textContent.trim()==='Learning objectives');
  const keypoints=headings.find(x=>x.textContent.trim()==='Key engineering points');
  const exercise=headings.find(x=>x.textContent.trim()==='Shop-floor exercise');
  const notes=headings.find(x=>x.textContent.trim()==='Your lesson notes');
  if(objectives)objectives.id='mmObjectives';
  if(keypoints)keypoints.id='mmKeyPoints';
  if(exercise)exercise.id='mmExercise';
  if(notes)notes.id='mmNotes';

  const buttons=[...article.querySelectorAll('.hero-buttons button')];
  const completeButton=buttons.find(b=>(b.getAttribute('onclick')||'').includes('completeLesson'));
  if(completeButton){
    completeButton.textContent=complete?'Continue to next lesson →':'Complete & continue →';
    completeButton.setAttribute('onclick',`mmCompleteAndContinue(${c.lesson.id})`);
  }
  const noteButton=buttons.find(b=>(b.getAttribute('onclick')||'').includes('saveLessonNote'));
  if(noteButton)noteButton.textContent='Save now';

  const area=document.getElementById('lessonNotes');
  if(area){
    area.setAttribute('aria-describedby','mmNoteSaveHelp');
    area.insertAdjacentHTML('afterend',`<div class="mm-note-status" id="mmNoteSaveHelp"><span>Notes autosave on this device.</span><span class="mm-note-save-state" data-state="saved">Saved</span></div>`);
  }

  const actionRow=article.querySelector('.hero-buttons:last-of-type');
  if(actionRow){
    const nextTitle=c.next?`${c.next.id}. ${esc(c.next.title)}`:'You have reached the end of the 120-lesson path.';
    actionRow.insertAdjacentHTML('afterend',`
      <section class="mm-next-card" aria-label="Next learning step">
        <span class="eyebrow">Up next</span><h3>${nextTitle}</h3>
        <p>${c.next?'Complete this lesson when you can explain the key points in your own words and identify what evidence you would check in practice.':'Review your bookmarks, scenarios and knowledge checks to reinforce the full pathway.'}</p>
        <div class="mm-next-actions">
          ${c.previous?'<button class="ghost" type="button" data-mm-onclick="mmPreviousLesson()">← Previous lesson</button>':''}
          ${c.next?`<button class="secondary" type="button" data-mm-onclick="mmNextLesson()">Preview next lesson</button>`:'<button class="secondary" type="button" data-mm-onclick="switchView(\'dashboard\')">Return home</button>'}
        </div>
      </section>`);
  }

  const lessonButtons=[...side.querySelectorAll('.lesson-list button')];
  lessonButtons.forEach((button,index)=>{
    const id=c.course.lessonIds[index];
    if(id===c.lesson.id)button.setAttribute('aria-current','step');
    button.title=user.completed.includes(id)?'Completed lesson':'Open lesson';
  });
  const sideNext=[...side.querySelectorAll('button')].find(b=>b.textContent.includes('Next lesson'));
  if(sideNext){
    sideNext.textContent=c.next?'Next lesson →':'End of path ✓';
    sideNext.disabled=!c.next;
  }

  root.insertAdjacentHTML('beforeend',`
    <div class="mm-mobile-actions" aria-label="Mobile lesson actions">
      <button class="ghost" type="button" data-mm-onclick="mmPreviousLesson()" ${c.previous?'':'disabled'} aria-label="Previous lesson">←</button>
      <button class="primary" type="button" data-mm-onclick="mmCompleteAndContinue(${c.lesson.id})">${complete?'Continue →':'Complete & continue →'}</button>
    </div>`);
  installAutosave(c.lesson);
}

function decorateDashboard(){
  const root=document.getElementById('dashboard');
  if(!root)return;
  const c=context();
  const overall=completedPct();
  const hero=root.querySelector('.hero');if(hero)hero.classList.add('mm-home-core-hero');
  const kpis=root.querySelector('.kpis');if(kpis)kpis.classList.add('mm-home-kpis');
  const courseHead=[...root.querySelectorAll('.section-head')].find(x=>/Continue your path/i.test(x.textContent||''));
  if(courseHead){courseHead.classList.add('mm-home-course-head');courseHead.nextElementSibling?.classList.add('mm-home-course-grid')}
  root.insertAdjacentHTML('afterbegin',`
    <section class="mm-today-focus" aria-label="Today's learning focus">
      <div>
        <span class="mm-home-resume-label">Resume</span><span class="eyebrow">Today’s focus</span>
        <h2>${esc(c.lesson.title)}</h2>
        <p>Track ${c.course.id}: ${esc(c.course.name)} · Lesson ${c.position+1}/${c.course.lessonIds.length}. Pick up exactly where you left off.</p>
        <div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>
        <div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-onclick="switchView('scenarios')">◎ Daily practice</button><button class="ghost" type="button" data-mm-home-saved="1">☆ Saved lessons</button></div>
      </div>
      <button class="primary" type="button" data-mm-onclick="switchView('lesson')">Continue lesson →</button>
    </section>
    <section class="mm-home-task-hub" aria-label="MouldMaster quick actions">
      <span class="eyebrow">What do you need help with?</span>
      <h2>Choose your next task</h2>
      <p>Go straight to diagnosis, process evidence or practice without searching through the course catalogue.</p>
      <div class="mm-home-actions">
        <button class="mm-home-action mm-home-action-primary" type="button" data-mm-onclick="mmOpenMouldMaster()"><span class="mm-home-action-icon">◇</span><span><strong>Diagnose a moulding problem</strong><small>Mould Master · start from the defect, rank mechanisms and check evidence.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-onclick="mmOpenDataDiagnosis()"><span class="mm-home-action-icon">⌁</span><span><strong>Analyse process data</strong><small>Read baseline, fault and recovery trends before changing settings.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-onclick="switchView('scenarios')"><span class="mm-home-action-icon">◎</span><span><strong>Practice a scenario</strong><small>Build shop-floor judgement with evidence-first decisions.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-onclick="switchView('path')"><span class="mm-home-action-icon">▦</span><span><strong>Explore your learning</strong><small>Open the 120-lesson pathway, progress and linked practice.</small></span></button>
      </div>
    </section>`);
  const savedButton=root.querySelector('[data-mm-home-saved="1"]');
  if(savedButton&&savedButton.dataset.mmSavedBound!=='1'){
    savedButton.dataset.mmSavedBound='1';
    savedButton.addEventListener('click',openSavedLessons);
  }
}

renderLesson=function(){
  originalRenderLesson();
  decorateLesson();
};
renderDashboard=function(){
  originalRenderDashboard();
  decorateDashboard();
};

window.MM_LEARNING_EXPERIENCE={version:VERSION,decorateLesson,decorateDashboard,completeAndContinue,openSavedLessons,rankedSearch};
if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
})();
