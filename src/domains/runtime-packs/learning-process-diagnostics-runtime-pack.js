/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: learning-process-diagnostics-runtime-pack.js
 */

/* >>> learning-experience.js */
/* MouldMaster learning experience tightening — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.09.10.3';
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
    <section class="mm-today-focus" data-mm-role="today-focus" aria-label="Today's learning focus">
      <div>
        <span class="eyebrow">Today’s focus</span>
        <h2>${esc(c.lesson.title)}</h2>
        <p>Track ${c.course.id}: ${esc(c.course.name)} · Lesson ${c.position+1}/${c.course.lessonIds.length}. Pick up exactly where you left off.</p>
        <div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>
        <div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-role="daily-practice" data-mm-onclick="switchView('scenarios')">◎ Daily practice</button><button class="ghost" type="button" data-mm-role="saved-lessons" data-mm-onclick="switchView('profile')">☆ Saved lessons</button></div>
      </div>
      <button class="primary" type="button" data-mm-role="continue-lesson" data-mm-onclick="switchView('lesson')">Continue lesson →</button>
    </section>
    <section class="mm-home-task-hub" data-mm-role="task-hub" aria-label="MouldMaster quick actions">
      <span class="eyebrow">What do you need help with?</span>
      <h2>Choose your next task</h2>
      <p>Go straight to diagnosis, process evidence or practice without searching through the course catalogue.</p>
      <div class="mm-home-actions">
        <button class="mm-home-action mm-home-action-primary" type="button" data-mm-role="diagnose-defect" data-mm-onclick="mmOpenMouldMaster()"><span class="mm-home-action-icon">◇</span><span><strong>Diagnose a moulding problem</strong><small>Mould Master · start from the defect, rank mechanisms and check evidence.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="process-data" data-mm-onclick="mmOpenDataDiagnosis()"><span class="mm-home-action-icon">⌁</span><span><strong>Analyse process data</strong><small>Read baseline, fault and recovery trends before changing settings.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="practice-scenario" data-mm-onclick="switchView('scenarios')"><span class="mm-home-action-icon">◎</span><span><strong>Practice a scenario</strong><small>Build shop-floor judgement with evidence-first decisions.</small></span></button>
        <button class="mm-home-action" type="button" data-mm-role="explore-learning" data-mm-onclick="switchView('path')"><span class="mm-home-action-icon">▦</span><span><strong>Explore your learning</strong><small>Open the 120-lesson pathway, progress and linked practice.</small></span></button>
      </div>
    </section>`);
}

renderLesson=function(){
  originalRenderLesson();
  decorateLesson();
};
renderDashboard=function(){
  originalRenderDashboard();
  decorateDashboard();
};

window.MM_LEARNING_EXPERIENCE={version:VERSION,decorateLesson,decorateDashboard,completeAndContinue};
if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
})();
/* <<< learning-experience.js */

/* >>> process-data-diagnostics.js */
/* MouldMaster guided process-data diagnostics — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.09.10.1';
const PACK=window.MM_PROCESS_EVIDENCE_DATASETS;
const SOURCES=window.MM_EVIDENCE_SOURCES?.sources||{};
if(!PACK||!Array.isArray(PACK.datasets))throw new Error('process-data-diagnostics.js requires MM_PROCESS_EVIDENCE_DATASETS');

const STORAGE_BASE='mm_process_data_diagnostics_v1';
const GUIDES={
  'check-ring-leakage':{
    signal:'Part mass and cushion move together while peak injection pressure rises and fill time changes only slightly.',
    diagnosis:'Unstable effective shot delivery consistent with non-return-valve/check-ring leakage or wear.',
    next:'Run a controlled shot-delivery repeatability study using cushion, transfer/shot position, part mass and machine inspection evidence before compensating with recipe changes.'
  },
  'cooling-restriction':{
    signal:'Cooling flow falls while return and eject temperatures rise, followed by more warpage.',
    diagnosis:'A local cooling-circuit restriction is creating thermal imbalance and dimensional response.',
    next:'Verify circuit identity, actual flow, supply/return temperatures and local mould/part temperature before changing packing or cycle settings.'
  },
  'gate-seal-study':{
    signal:'Part mass and pressure-time area rise toward a plateau while sink response improves less with additional hold time.',
    diagnosis:'The data are showing a gate-seal/packing-transmission plateau rather than a reason to keep extending hold indefinitely.',
    next:'Repeat the study within the approved process envelope and identify the response plateau with part mass/pressure history and quality confirmation.'
  },
  'material-moisture-pc':{
    signal:'Material moisture and splay rise together while impact response falls even though part mass barely moves.',
    diagnosis:'A material-conditioning interruption is the strongest mechanism, not a global fill or packing problem.',
    next:'Verify actual resin moisture and the grade-specific drying/closed-transfer history before adjusting the moulding process.'
  },
  'hot-runner-zone-drift':{
    signal:'Heater duty rises strongly while the displayed zone temperature barely moves, with local mass/pressure response changing.',
    diagnosis:'A hot-runner thermal/control problem can exist even while the temperature display appears stable.',
    next:'Compare heater output, sensor health, branch/gate response and local cavity evidence using the approved hot-runner troubleshooting procedure.'
  },
  'valve-gate-timing':{
    signal:'One cavity fill signature separates as gate delay changes while the other cavity remains nearly stable.',
    diagnosis:'A local sequential valve-gate timing difference is driving cavity imbalance rather than a global machine recipe change.',
    next:'Verify commanded and actual valve timing plus cavity-specific fill/pressure response before touching global injection settings.'
  },
  'local-flash-tooling':{
    signal:'Flash width and local part mass change while clamp force and cavity peak pressure remain broadly stable.',
    diagnosis:'The pattern favours a local tooling/shutoff condition over insufficient global clamp force.',
    next:'Inspect the exact flash location, seating, support and tool condition using approved safe procedures before applying more process force.'
  },
  'energy-base-load':{
    signal:'Energy per cycle rises materially while cycle time and accepted quality remain almost unchanged.',
    diagnosis:'The increase points toward machine or auxiliary base load rather than a moulding-quality mechanism.',
    next:'Break energy use down by machine/auxiliary state and compare heater, pump/drive and temperature-control demand against a known-good baseline.'
  },
  'measurement-noise':{
    signal:'Measured dimensional spread increases while true dimension and independent process signals remain stable.',
    diagnosis:'Measurement-system variation is masquerading as process drift.',
    next:'Study measurement method, fixture, conditioning time, resolution and repeatability/reproducibility before adjusting the process.'
  },
  'recycled-pp-lot':{
    signal:'MFR changes with the lot while fill pressure/time and warpage move in a consistent rheology-related direction.',
    diagnosis:'A material lot-to-lot rheology shift is changing in-mould behaviour despite a similar nominal material description.',
    next:'Confirm lot identity and material-property evidence, then compare process actuals and part requirements before deciding whether revalidation is needed.'
  },
  'machine-transfer':{
    signal:'The velocity setpoint stays identical but actual peak velocity, transfer position and part mass change on the receiving machine.',
    diagnosis:'Copied setpoints are not reproducing the same physical process response on the second machine.',
    next:'Compare machine capability and actual velocity/pressure/position traces, then transfer on validated process responses rather than screen numbers alone.'
  },
  'cavity-pack-area':{
    signal:'Peak cavity pressure stays nearly unchanged while pressure-time area, hold time and dimension all shift.',
    diagnosis:'A single pressure peak is hiding a meaningful change in the full packing pressure history.',
    next:'Compare the full cavity-pressure curve/area and timing against the known-good baseline before interpreting peak pressure as equivalent.'
  },
  'screw-barrel-wear':{
    signal:'Recovery time, melt temperature and shot mass drift together while back-pressure response also moves.',
    diagnosis:'The coupled plasticising signals point toward screw/barrel or plasticising-system consistency rather than a purely cavity-side defect.',
    next:'Trend recovery and melt/shot evidence, verify material condition, and inspect machine plasticising components under the approved maintenance process.'
  },
  'ejector-drag':{
    signal:'Eject force, surface temperature, drag score and dimension move together during the fault phase.',
    diagnosis:'A local cooling/thermal imbalance is increasing part release load and dimensional response.',
    next:'Verify local cooling flow/temperature and part-release condition before increasing ejection force or rewriting the process.'
  }
};

const DATASETS=PACK.datasets.map(ds=>({...ds,guide:GUIDES[ds.id]})).filter(ds=>ds.guide);
if(DATASETS.length!==PACK.datasets.length)throw new Error('Every process evidence dataset must have a guided diagnostic case');

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const s=JSON.parse(localStorage.getItem(storageKey())||'{}');return s&&typeof s==='object'?s:{}}catch(_){return {}}}
function writeState(s){try{localStorage.setItem(storageKey(),JSON.stringify(s))}catch(_){}}
function caseState(id){return readState()[id]||{attempts:0,completed:false,bestScore:0}}
function saveCase(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}

function mean(rows,key){const vals=rows.map(r=>Number(r[key])).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function decimals(key){return /(_pct|Score|_g|_mm|_s|_MPa|_C|_Lmin|_kWh|_kN|_ms|_mm_s|_MPas)/.test(key)?2:2}
function summary(ds){
  const keys=Object.keys(ds.signals||{});const phases=['baseline','fault','recovery'];
  return keys.map(key=>{
    const values=Object.fromEntries(phases.map(p=>[p,mean(ds.rows.filter(r=>r.phase===p),key)]));
    const delta=values.fault-values.baseline;
    const relative=Math.abs(values.baseline)>1e-9?delta/Math.abs(values.baseline):delta;
    return {key,values,delta,relative}
  })
}
function labelSignal(key){return key.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2')}
function format(v,key){return Number(v).toFixed(decimals(key))}
function sourceNames(ds){return (ds.sourceIds||[]).map(id=>SOURCES[id]?.name||id)}

function buildSteps(ds){
  const g=ds.guide;
  return [
    {stage:'Read the pattern',question:'Which interpretation best describes the most useful change across baseline → fault?',correct:g.signal,distractors:[
      'The programmed recipe exists, so the physical process must be unchanged.',
      'One isolated number is enough; the other signals can be ignored.',
      'The recovery phase should be ignored because only the fault phase contains useful evidence.'
    ],feedback:'Use several linked actuals and the time sequence. The strongest pattern is the one that changes coherently with the fault and moves back during recovery.'},
    {stage:'Diagnose',question:'Which mechanism best fits the combined evidence?',correct:g.diagnosis,distractors:[
      'Increase a convenient global setting first and use the result as the diagnosis.',
      'Assume the material is always the cause because polymers vary.',
      'Assume the machine is always the cause because the data came from a moulding machine.'
    ],feedback:'Mechanism-first diagnosis uses location, timing and correlated actuals. It does not choose a cause just because a setting is easy to change.'},
    {stage:'Choose the next evidence',question:'What is the strongest next check before changing production standards?',correct:g.next,distractors:[
      'Change several settings together and keep whichever combination appears to work.',
      'Copy a generic internet setpoint because it provides a faster answer.',
      'Skip verification if one cycle looks acceptable.'
    ],feedback:'The next action should discriminate between plausible causes while preserving safety, traceability and the known-good baseline.'},
    {stage:'Interpret recovery',question:'What does the recovery phase allow you to conclude?',correct:'The return toward baseline strengthens the suspected mechanism because the linked signals recover together, but it still needs engineering confirmation in the real machine/mould/material context.',distractors:[
      'Recovery proves the same numeric settings will work on every machine, mould and resin grade.',
      'Recovery proves no further verification or maintenance evidence is required.',
      'Recovery means the fault phase can be deleted because it is no longer relevant.'
    ],feedback:'Recovery is powerful causal evidence, especially when several signals move back together. It does not turn synthetic training values into universal production limits.'}
  ]
}
function deterministicChoices(step,caseId,stepIndex){
  const arr=[{text:step.correct,correct:true},...step.distractors.map(x=>({text:x,correct:false}))];
  let seed=0;for(const ch of `${caseId}:${stepIndex}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}
function evaluateChoice(caseId,stepIndex,choiceIndex){
  const ds=DATASETS.find(x=>x.id===String(caseId||'')),stepNo=Number(stepIndex),choiceNo=Number(choiceIndex);
  if(!ds||!Number.isInteger(stepNo)||stepNo<0||stepNo>3||!Number.isInteger(choiceNo)||choiceNo<0||choiceNo>3)return {valid:false,correct:false,total:4};
  const steps=buildSteps(ds),choices=deterministicChoices(steps[stepNo],ds.id,stepNo),choice=choices[choiceNo];
  return {valid:!!choice,correct:!!choice?.correct,total:steps.length};
}

let activeId=null,answers=[],hadError=false;
function ensureStyle(){
  if(document.getElementById('mm-process-data-style'))return;
  const s=document.createElement('style');s.id='mm-process-data-style';s.textContent=`
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.pd-grid{grid-template-columns:1fr}.pd-loop{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.pd-stats{grid-template-columns:1fr}.pd-toolbar{align-items:stretch}.pd-toolbar button{width:100%}.pd-panel{padding:16px}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('processDataLabs');if(section)return section;
  section=document.createElement('section');section.id='processDataLabs';section.className='view hidden';
  (document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function ensureNav(){
  const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-process-data]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.mmProcessData='1';b.innerHTML='⌁ <span>Data diagnosis</span>';
  const anchor=nav.querySelector('[data-mm-diagnostic-labs]')||nav.querySelector('button[data-view="scenarios"]');
  if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openHome()})
}
function patchMobileMore(){
  if(window.__MM_PROCESS_DATA_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
  const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{
    const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-process-data-menu]'))return;
    const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmProcessDataMenu='1';b.innerHTML='<span class="icon">⌁</span><b>Data diagnosis</b><small>Read process trends and choose the next evidence check.</small>';
    b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openHome()});grid.appendChild(b)
  });return r};window.__MM_PROCESS_DATA_MORE_PATCH__=true
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function setHeader(t,s){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(p)p.textContent=s}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-process-data]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('[data-mm-diagnostic-labs]')||document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click()}
function stats(){const state=readState();let done=0,attempted=0,total=0;for(const ds of DATASETS){const s=state[ds.id];if(s?.completed)done++;if(s?.attempts){attempted++;total+=Number(s.bestScore||0)}}return {done,attempted,avg:attempted?Math.round(total/attempted):0}}

function openHome(){
  ensureStyle();ensureNav();patchMobileMore();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');markNav();setHeader('Data diagnosis','Use process trends to distinguish mechanisms before changing settings.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})
}
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection(),st=stats();
  host.innerHTML=`<div class="pd-hero card"><div class="eyebrow">Process-data practice</div><h2>Guided Data Diagnosis</h2><p>Work through the same evidence pattern experienced process engineers use: establish a baseline, identify what changed, connect signals to a plausible mechanism, choose the next discriminating check, then use recovery evidence to challenge your conclusion.</p><div class="pd-loop"><span>1 Read pattern</span><span>2 Diagnose</span><span>3 Choose evidence</span><span>4 Interpret recovery</span></div><div class="pd-boundary"><b>Training boundary:</b> all values are deterministic synthetic training data. They illustrate signal relationships only and are not universal production setpoints, acceptance limits or substitutes for machine, mould, resin, site or legal requirements.</div></div>
  <div class="pd-stats"><div class="pd-stat card"><span>Cases completed</span><b>${st.done}/${DATASETS.length}</b></div><div class="pd-stat card"><span>Cases attempted</span><b>${st.attempted}</b></div><div class="pd-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div>
  <div class="pd-toolbar"><div><h2 style="margin:0">Choose a dataset</h2><p class="muted" style="margin:4px 0 0">Each case contains 72 cycles: 24 baseline, 24 fault and 24 recovery.</p></div><button class="ghost" data-pd-back>Back to diagnostic practice</button></div>
  <div class="pd-grid" style="margin-top:12px">${DATASETS.map(cardHtml).join('')}</div>`
}
function cardHtml(ds){const s=caseState(ds.id);return `<article class="pd-card card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">${ds.rows.length} cycles</span><span class="pd-chip">${Object.keys(ds.signals).length} signals</span></div><h3>${esc(ds.title)}</h3><p>${esc(ds.fault)}</p><div class="pd-foot"><span class="${s.completed?'pd-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-pd-start="${esc(ds.id)}">${s.completed?'Practise again':'Start case'}</button></div></article>`}
function tableHtml(ds){return `<div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Signal</th><th>Baseline mean</th><th>Fault mean</th><th>Recovery mean</th><th>Fault Δ</th></tr></thead><tbody>${summary(ds).map(r=>`<tr><td>${esc(labelSignal(r.key))}</td><td>${format(r.values.baseline,r.key)}</td><td>${format(r.values.fault,r.key)}</td><td>${format(r.values.recovery,r.key)}</td><td class="${r.delta>=0?'pd-up':'pd-down'}">${r.delta>=0?'+':''}${format(r.delta,r.key)}</td></tr>`).join('')}</tbody></table></div>`}
function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}
function renderCase(stepIndex){
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return renderHome();const steps=buildSteps(ds),step=steps[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex),selected=answers[stepIndex],host=ensureSection();
  host.innerHTML=`<div class="pd-case"><div class="pd-toolbar"><button class="ghost" data-pd-home>← All data cases</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div><div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">synthetic training data</span></div><h2 style="margin:8px 0">${esc(ds.title)}</h2><p class="muted">${esc(ds.fault)}</p><div class="pd-progress">${steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div>
  <div class="pd-panel card"><h3>Evidence board</h3><p class="muted">Compare phase means first. Use the CSV only if you want to inspect the individual 72 cycles.</p>${tableHtml(ds)}<div class="pd-actions" style="margin-top:12px"><button class="ghost" data-pd-csv>Export 72-cycle CSV</button></div></div>
  <div class="pd-panel card"><div class="pd-stage">${esc(step.stage)} · ${stepIndex+1}/4</div><div class="pd-question">${esc(step.question)}</div><div class="pd-choices">${choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(choices[selected],step)}${selected===null?'':`<div class="pd-actions" style="margin-top:12px">${stepIndex<3?'<button class="primary" data-pd-next>Next step</button>':'<button class="primary" data-pd-finish>Finish case</button>'}<button class="ghost" data-pd-retry>Try this question again</button></div>`}</div>
  <div class="pd-panel card"><h3>Evidence sources</h3><div class="pd-source-list">${sourceNames(ds).map(x=>`<div>${esc(x)}</div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">These sources support the mechanism and study method. They do not make the synthetic values production specifications.</p></div></div>`;host.dataset.step=String(stepIndex)
}
function choiceHtml(c,i,selected){const chosen=selected===i,cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="pd-choice${cls}" data-pd-choice="${i}" ${selected===null?'':'disabled'}>${esc(c.text)}</button>`}
function feedbackHtml(choice,step){return `<div class="pd-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good evidence use':'Re-check the pattern'}</b><br>${esc(choice.correct?step.feedback:'Choose the answer that is most directly supported by the linked signals and preserves a controlled diagnostic sequence.')}</div>`}
function exportCsv(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const blob=new Blob([PACK.toCsv(ds.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-${ds.id}-synthetic-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function finishCase(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const steps=buildSteps(ds);let correct=0;for(let i=0;i<steps.length;i++){const choices=deterministicChoices(steps[i],ds.id,i);if(choices[answers[i]]?.correct)correct++}const score=Math.round(correct/steps.length*100),prior=caseState(ds.id);saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();host.innerHTML=`<div class="pd-summary card"><div class="eyebrow">Data case complete</div><strong>${score}% · ${correct}/4 decisions</strong><h2>${esc(ds.title)}</h2><p class="muted">${score===100?'You used the baseline, fault and recovery evidence as one reasoning chain.':'Review the missed step and try again. The goal is to explain why a signal pattern supports one mechanism more strongly than another.'}</p><div class="pd-actions"><button class="primary" data-pd-home>Choose another dataset</button><button class="secondary" data-pd-restart>Practise this case again</button><button class="ghost" data-pd-back>Back to diagnostic practice</button></div></div>`}
function handleClick(e){
  const t=e.target.closest('[data-pd-start],[data-pd-home],[data-pd-back],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.dataset.pdStart)return openCase(t.dataset.pdStart);if(t.hasAttribute('data-pd-home'))return renderHome();if(t.hasAttribute('data-pd-back'))return backToPractice();if(t.hasAttribute('data-pd-restart'))return openCase(activeId);if(t.hasAttribute('data-pd-csv'))return exportCsv();
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const stepIndex=Number(ensureSection().dataset.step||0),step=buildSteps(ds)[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex);
  if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-retry')){answers[stepIndex]=null;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-next'))return renderCase(Math.min(stepIndex+1,3));if(t.hasAttribute('data-pd-finish'))return finishCase()
}
function install(){ensureStyle();const host=ensureSection();ensureNav();patchMobileMore();if(host&&!host.__mmPdClick){host.addEventListener('click',handleClick);host.__mmPdClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,evaluateChoice,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};
})();
/* <<< process-data-diagnostics.js */

/* >>> real-measured-data-assessment.js */
/* MouldMaster real measured-data assessment — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1',STORAGE='mm_real_measured_assessment_v1';
const CASES=[
 {id:'avaps-delivered-traces',title:'AVAPS: count what the delivered traces actually contain',source:'scatimdata-avaps',contractPath:'data/public-benchmark-results/scatimdata-avaps-v1.json',contractBlob:'7692f3f029cd4ab1227db1f39e0376023c0eebbf',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Linked labelled cycles',3328],['Delivered points per signal per linked cycle',2048],['Accepted pressure + flow values',13631488],['Paper-reported points per signal',2049]],boundary:'Accepted counts use the 2,048 values actually delivered per signal per linked cycle. The dataset does not establish universal settings, causal defect mechanisms or a production process window.',questions:[
  ['Which point count should MouldMaster use when counting the delivered pressure/flow traces?',['2,048 values actually present in each delivered signal','2,049 because the paper reports that number','The average of 2,048 and 2,049','An inferred 2,049th point added to every trace'],0,'Use the delivered file structure. The contract explicitly refuses to fabricate the paper-reported extra point.'],
  ['What is the accepted real measured time-series total for this profiled family?',['13,631,488 pressure/flow values','3,328 values because there are 3,328 linked cycles','6,815,744 because only one signal should count','13,638,144 after adding one missing point per signal'],0,'The three accepted archive totals sum to 13,631,488 pressure and flow values.'],
  ['What conclusion is justified by this evidence profile?',['Real pressure/flow waveforms and linked quality outcomes are available for bounded analysis, but they do not prove a universal process window or root cause','The measured waveforms establish one universal injection-pressure recipe','Every pressure/flow correlation in the dataset is causal','The paper-reported sample count should override the delivered data'],0,'Real measured data strengthen evidence context, but the source contract keeps causality and universal-setting claims out of scope.']
 ]},
 {id:'openmms-time-samples',title:'OpenMMS-T4G: distinguish time samples from moulding cycles',source:'openmms-t4g',contractPath:'data/public-benchmark-results/openmms-t4g-v1.json',contractBlob:'b1ae42ff8af7926e08bf5aabc1d6b3a99afc4208',license:'BSD-3-Clause',evidenceType:'real-measured',facts:[['Rows/time samples',29808],['Measured signal columns',10],['Accepted measured values',298080],['Paper-reported case-study cycles',110]],boundary:'The 29,808 rows are time samples across two recorded module time bases, not 29,808 moulding cycles. The extraction fault was simulated in one experimental campaign and is not a universal machine-health diagnosis.',questions:[
  ['How should the 29,808 delivered rows be interpreted?',['As time samples across the recorded sensor-module time bases','As 29,808 moulding cycles','As 29,808 rejected parts','As one row per machine recipe'],0,'The source contract distinguishes time samples from the paper-reported 110 case-study cycles.'],
  ['Why is the accepted measured-value total 298,080?',['29,808 rows multiplied by 10 accepted measured signal columns','110 cycles multiplied by 2,710 values','29,808 rows plus 268,272 inferred values','Because all 12 CSV columns are counted as measurements'],0,'Ten source-defined measured signal columns are accepted; time bases/other structural columns are not inflated into the measured total.'],
  ['What does the simulated extraction fault allow you to claim?',['It supports condition-monitoring learning for that experiment, not a universal extraction-fault diagnosis','It proves every future extraction-force change has the same root cause','It establishes production alarm limits for all moulds','It makes inspection of the real machine unnecessary'],0,'The fault context is real experimental evidence but remains bounded to the campaign and its instrumentation.']
 ]},
 {id:'cross-process-lower-contract',title:'Cross-process lower workpiece: separate commands from measured actuals',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json',contractBlob:'94bea551aa3e4755c435b663d2553b53bcc0c6c2',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted files',4989],['Accepted rows',2475581],['Accepted actual channels per row',3],['Accepted measured values',7426743],['Sampling interval',0.03]],boundary:'Pressure target is a command and is excluded. Accepted lower-workpiece actuals are pressure actual (bar), screw volume actual (cm³) and injection flow actual (cm³/s). Lower semantics must not be copied to the upper workpiece by analogy.',questions:[
  ['Which lower-workpiece channels count as measured process values?',['Pressure actual, screw-volume actual and injection-flow actual','Pressure target, pressure actual and time','Pressure target plus all three actual channels','Time, pressure target and screw volume only'],0,'The source contract accepts exactly three actual channels and excludes the pressure target command.'],
  ['What is the source-defined lower sampling interval?',['0.03 s','0.01 s inferred from the upper files','1 ms because injection waveforms are always high frequency','No interval is available'],0,'All 4,989 accepted lower TXT files resolve to the explicit 0.03 s interval in this contract.'],
  ['Why must the lower pressure unit not be copied to the upper dataset?',['The lower contract defines only the lower channels; the upper pressure unit still requires authoritative upper-workpiece metadata','Both workpieces must use bar because they are in one archive','Matching column names prove matching engineering units','The state codes can be used to infer the missing unit'],0,'A source-defined lower unit is not authoritative metadata for a separate upper schema.']
 ]},
 {id:'cross-process-upper-boundary',title:'Cross-process upper workpiece: fail closed on unresolved semantics',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json',contractBlob:'a3e23a0ecd5711158c3937f47a031212e7d1de8d',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted cycle CSVs',10697],['Accepted rows',21907374],['Accepted measured channels per row',2],['Accepted measured values',43814748],['Pressure actual values excluded pending unit',21907374],['State values excluded pending semantics',21907374]],boundary:'Only melt volume (cm³) and volumetric injection velocity (cm³/s) are accepted as measured upper channels. Upper pressure actual remains excluded until its engineering unit is authoritative; state codes 0/1/2/4/8 remain uninterpreted until their semantics are authoritative.',questions:[
  ['Which upper-workpiece channels currently count as accepted measured values?',['Melt volume and injection velocity','Pressure actual and injection velocity','Pressure target and pressure actual','State code and pressure actual'],0,'The current contract accepts only the two source-defined channels with authoritative semantics/units.'],
  ['How should the 21,907,374 upper pressure-actual values be treated today?',['Keep them excluded from measured totals until the authoritative engineering unit is established','Assume bar because the lower workpiece uses bar','Convert them to MPa using a guessed bar scale','Count them as unitless pressure values'],0,'Structurally valid numbers are not enough: the engineering unit is part of the measurement meaning.'],
  ['What is the correct treatment of state codes 0, 1, 2, 4 and 8?',['Preserve and aggregate the codes without assigning phase names until an authoritative mapping is found','Map them to injection, pack and cooling from their timing','Discard them because unresolved data have no value','Use the most common code as the production phase'],0,'The project deliberately preserves unresolved codes without inventing process-state semantics.']
 ]}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){let x='anonymous';try{x=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}let h=2166136261;for(const c of x){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function key(){return `${STORAGE}::${token()}`}
function state(){try{return JSON.parse(localStorage.getItem(key())||'{}')}catch(_){return{}}}
function save(x){try{localStorage.setItem(key(),JSON.stringify(x))}catch(_){}}
function shuffled(q,caseId,qi){const rows=q[1].map((text,i)=>({text,correct:i===q[2]}));let seed=2166136261;for(const c of `${caseId}:${qi}`){seed^=c.charCodeAt(0);seed=Math.imul(seed,16777619)}for(let i=rows.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[rows[i],rows[j]]=[rows[j],rows[i]]}return rows}
let active=null,answers=[];
function style(){if(document.getElementById('mm-real-measured-style'))return;const s=document.createElement('style');s.id='mm-real-measured-style';s.textContent=`#realMeasuredAssessment{display:grid;gap:14px}.rma-hero,.rma-panel,.rma-card{padding:18px}.rma-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.rma-meta{display:flex;gap:6px;flex-wrap:wrap}.rma-chip{font-size:10px;padding:4px 7px;border:1px solid #47627f;border-radius:999px;color:#c6d8eb}.rma-boundary{padding:11px;border-left:3px solid #d4b25b;background:#272316;color:#eddfaa;font-size:12px;line-height:1.5}.rma-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}.rma-fact{padding:9px;border:1px solid #2f4966;border-radius:9px;background:#0e1e31}.rma-fact small{display:block;color:#97adc5}.rma-fact b{font-size:16px}.rma-choices{display:grid;gap:8px}.rma-choice{padding:11px;text-align:left;border:1px solid #35516f;border-radius:10px;background:#102239;color:#eef6ff}.rma-choice.correct{border-color:#44856e;background:#123128}.rma-choice.wrong{border-color:#824a54;background:#321b22}.rma-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between}.rma-source{font-size:11px;color:#9fb7cf;overflow-wrap:anywhere}@media(max-width:760px){.rma-grid,.rma-facts{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function section(){let h=document.getElementById('realMeasuredAssessment');if(h)return h;h=document.createElement('section');h.id='realMeasuredAssessment';h.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(h);return h}
function nav(){const n=document.getElementById('nav');if(!n||n.querySelector('[data-mm-real-measured]'))return;const b=document.createElement('button');b.type='button';b.dataset.mmRealMeasured='1';b.innerHTML='▥ <span>Measured data</span>';const a=n.querySelector('[data-mm-process-data]')||n.querySelector('[data-mm-diagnostic-labs]');a?a.insertAdjacentElement('afterend',b):n.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();home()})}
function hide(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-real-measured]')?.classList.add('active')}
function header(a,b){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=a;if(p)p.textContent=b}
function home(){style();nav();hide();active=null;answers=[];const h=section();h.classList.remove('hidden');header('Measured data','Practise evidence boundaries using committed aggregate contracts from real injection-moulding datasets.');const st=state();h.innerHTML=`<div class="rma-hero card"><div class="eyebrow">Real measured evidence</div><h2>Measured-Data Evidence Challenges</h2><p class="muted">These questions use audited aggregate metadata from real public measured datasets. No third-party raw rows are embedded here. The objective is to interpret what the data contract establishes—and what it deliberately does not establish.</p><div class="rma-boundary"><b>Boundary:</b> real measured does not mean universal. Units, signal roles, time bases, licensing, experiment design and unresolved semantics remain part of the evidence.</div></div><div class="rma-grid">${CASES.map(c=>`<article class="rma-card card"><div class="rma-meta"><span class="rma-chip">real-measured</span><span class="rma-chip">${esc(c.license)}</span><span class="rma-chip">3 decisions</span></div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.boundary)}</p><div class="rma-actions"><span class="tiny muted">${st[c.id]?.best!==undefined?`Best ${st[c.id].best}%`:'Not attempted'}</span><button class="secondary" data-rma-start="${c.id}">Start</button></div></article>`).join('')}</div>`;window.scrollTo?.({top:0,behavior:'smooth'})}
function render(qi){const c=CASES.find(x=>x.id===active);if(!c)return home();const q=c.questions[qi],choices=shuffled(q,c.id,qi),sel=answers[qi],h=section();h.innerHTML=`<div class="rma-actions"><button class="ghost" data-rma-home>← All measured-data cases</button><span class="rma-chip">Decision ${qi+1}/3</span></div><div class="rma-panel card"><div class="rma-meta"><span class="rma-chip">${esc(c.evidenceType)}</span><span class="rma-chip">${esc(c.license)}</span></div><h2>${esc(c.title)}</h2><div class="rma-facts">${c.facts.map(([k,v])=>`<div class="rma-fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div><div class="rma-boundary">${esc(c.boundary)}</div><p class="rma-source">Contract: ${esc(c.contractPath)} · pinned blob ${esc(c.contractBlob)}</p></div><div class="rma-panel card"><div class="eyebrow">Question ${qi+1}</div><h3>${esc(q[0])}</h3><div class="rma-choices">${choices.map((x,i)=>`<button class="rma-choice${sel===i?(x.correct?' correct':' wrong'):''}" data-rma-choice="${i}" ${sel==null?'':'disabled'}>${esc(x.text)}</button>`).join('')}</div>${sel==null?'':`<div class="${choices[sel].correct?'pd-feedback':'pd-feedback bad'}" style="margin-top:12px"><b>${choices[sel].correct?'Correct evidence boundary':'Re-check the contract'}</b><br>${esc(choices[sel].correct?q[3]:'Use only the units, roles, counts and semantics that the audited source contract actually establishes.')}</div><div class="rma-actions" style="margin-top:12px"><button class="ghost" data-rma-retry>Try again</button>${qi<2?'<button class="primary" data-rma-next>Next</button>':'<button class="primary" data-rma-finish>Finish</button>'}</div>`}</div>`;h.dataset.qi=String(qi)}
function start(id){active=id;answers=[null,null,null];render(0)}
function finish(){const c=CASES.find(x=>x.id===active);let n=0;c.questions.forEach((q,i)=>{const rows=shuffled(q,c.id,i);if(rows[answers[i]]?.correct)n++});const score=Math.round(n/3*100),s=state();s[c.id]={best:Math.max(Number(s[c.id]?.best||0),score),last:score};save(s);const h=section();h.innerHTML=`<div class="rma-panel card"><div class="eyebrow">Measured-data case complete</div><h2>${score}% · ${n}/3</h2><p class="muted">${score===100?'You kept measured values, commands, units, time bases and unresolved semantics inside their audited boundaries.':'Review the contract boundary and repeat the case. The goal is to distinguish what is measured from what is merely named, commanded, inferred or unresolved.'}</p><div class="rma-actions"><button class="primary" data-rma-home>Choose another case</button><button class="secondary" data-rma-start="${c.id}">Practise again</button></div></div>`}
function click(e){const t=e.target.closest('[data-rma-start],[data-rma-home],[data-rma-choice],[data-rma-retry],[data-rma-next],[data-rma-finish]');if(!t)return;if(t.dataset.rmaStart)return start(t.dataset.rmaStart);if(t.hasAttribute('data-rma-home'))return home();const qi=Number(section().dataset.qi||0),c=CASES.find(x=>x.id===active),q=c?.questions[qi];if(!q)return;if(t.dataset.rmaChoice!==undefined){answers[qi]=Number(t.dataset.rmaChoice);return render(qi)}if(t.hasAttribute('data-rma-retry')){answers[qi]=null;return render(qi)}if(t.hasAttribute('data-rma-next'))return render(Math.min(2,qi+1));if(t.hasAttribute('data-rma-finish'))return finish()}
function install(){style();nav();const h=section();if(h&&!h.__rma){h.addEventListener('click',click);h.__rma=true}}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();new MutationObserver(install).observe(document.documentElement,{subtree:true,childList:true})}
window.MM_REAL_MEASURED_ASSESSMENT={version:VERSION,evidenceType:'real-measured',decisionCount:CASES.reduce((n,c)=>n+c.questions.length,0),cases:CASES.map(c=>({...c,facts:c.facts.map(x=>[...x]),questions:c.questions.map(q=>[q[0],[...q[1]],q[2],q[3]])})),open:home,scope:'Twelve learner decisions based on audited aggregate contracts from real measured datasets. No raw third-party rows, universal production settings or inferred unresolved semantics.'};
})();
/* <<< real-measured-data-assessment.js */
