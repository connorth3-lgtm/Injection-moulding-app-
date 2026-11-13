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
.mm-lesson-list-state{font-size:10px;color:var(--muted);margin-left:4px}.lesson-list button[aria-current="step"]{box-shadow:inset 3px 0 0 var(--accent)}
.mm-mobile-actions{display:none}
@media(max-width:760px){
  .mm-today-focus{grid-template-columns:1fr}.mm-today-focus>button{width:100%}
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
@media(prefers-reduced-motion:reduce){.mm-learning-jumps button{scroll-behavior:auto}}
`;
document.head.appendChild(styles);

function context(){
  const lesson=typeof mmCoreSafeLesson==='function'
    ? mmCoreSafeLesson()
    : (D.lessons.find(l=>l.id===user.currentLesson)||D.lessons[0]);
  if(!lesson)return null;
  const course=D.courses.find(x=>x.id===lesson.course);
  if(!course)return null;
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
  if(!area)return false;
  user.notes=user.notes||{};
  user.notes[id]=area.value;
  const durable=persist();
  if(status){
    status.textContent=durable?'Saved':'Session only';
    status.dataset.state=durable?'saved':'session-only';
  }
  return durable;
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
      </div>
      <button class="primary" type="button" data-mm-role="continue-lesson" data-mm-onclick="switchView('lesson')">Continue lesson →</button>
    </section>
  `);

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
/* MouldMaster guided process-data diagnostics — 2026.11.14.1 */
(function(){
'use strict';

const VERSION='2026.11.14.1';
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


const MATH_DRILLS=Object.freeze([
  {category:'Units',level:'Starter',question:'A resin batch weighs 3.2 kg. How many grams is that?',choices:['320 g','3,200 g','32,000 g'],answer:1,hint:'There are 1,000 grams in 1 kilogram.',working:'3.2 kg × 1,000 = 3,200 g.'},
  {category:'Units and time',level:'Starter',question:'A cycle takes 1.25 minutes. How many seconds is that?',choices:['65 seconds','75 seconds','125 seconds'],answer:1,hint:'There are 60 seconds in 1 minute.',working:'1.25 min × 60 s/min = 75 s.'},
  {category:'Shot mass',level:'Core',question:'A cold-runner mould has 4 cavities. Each part weighs 13.2 g and the runner weighs 6.8 g. What is the total shot mass?',choices:['52.8 g','59.6 g','60.4 g'],answer:1,hint:'Add the mass of all parts to the runner mass.',working:'4 × 13.2 g + 6.8 g = 59.6 g per shot. A hot-runner system needs its own accounting because the runner is not normally ejected with each shot.'},
  {category:'Material percentages',level:'Core',question:'An 8 kg final blend contains 2.5% additive by total blend mass. How much additive is in the blend?',choices:['20 g','200 g','250 g'],answer:1,hint:'Convert 2.5% to 0.025, then multiply by the total blend mass.',working:'8 kg × 0.025 = 0.2 kg = 200 g additive. The remaining base resin is 7.8 kg. This question defines percentage of the final blend; parts-per-hundred-resin calculations use a different denominator.'},
  {category:'Cycle time and output',level:'Core',question:'A 4-cavity mould runs at a 30 second cycle. What is the theoretical output per hour if every cycle fills all cavities and the machine never stops?',choices:['120 parts/hour','480 parts/hour','720 parts/hour'],answer:1,hint:'First calculate 3,600 seconds per hour ÷ cycle seconds, then multiply by active cavities.',working:'3,600 ÷ 30 = 120 cycles/hour. 120 × 4 cavities = 480 theoretical parts/hour. Real good output is lower when there are stops, short shots or rejects.'},
  {category:'Actual production rate',level:'Core',question:'The shift record shows 360 accepted good parts during a 90 minute scheduled window, including stoppages. What was the average good output per scheduled hour?',choices:['240 parts/hour','360 parts/hour','540 parts/hour'],answer:0,hint:'90 minutes is 1.5 hours. Divide accepted parts by the full scheduled time in hours.',working:'360 ÷ 1.5 h = 240 accepted good parts per scheduled hour. State whether your time window includes downtime; do not compare unlike windows.'},
  {category:'Scrap and yield',level:'Core',question:'There were 15 rejects among 600 total parts produced. What are the reject rate and first-pass yield?',choices:['2.5% reject; 97.5% yield','2.5% reject; 2.5% yield','40% reject; 60% yield'],answer:0,hint:'Reject rate = rejects ÷ total × 100. Yield = accepted good parts ÷ total × 100.',working:'15 ÷ 600 × 100 = 2.5% rejects. If the other 585 parts were accepted as good, 585 ÷ 600 × 100 = 97.5% yield. Keep rework separate until the parts pass the agreed acceptance checks.'},
  {category:'Measurement statistics',level:'Core',question:'Four part-mass readings are 10.1, 10.3, 10.2 and 10.2 g. What are the mean and range?',choices:['Mean 10.2 g; range 0.2 g','Mean 10.2 g; range 0.1 g','Mean 10.1 g; range 0.3 g'],answer:0,hint:'Mean = sum ÷ number of readings. Range = largest − smallest.',working:'(10.1 + 10.3 + 10.2 + 10.2) ÷ 4 = 10.2 g mean. 10.3 − 10.1 = 0.2 g range. Keep cavity identity and measurement method with the readings.'},
  {category:'Percentage change',level:'Core',question:'A stable baseline mean is 64 g. A later mean is 67.2 g. What is the percentage increase from baseline?',choices:['3.2%','5%','105%'],answer:1,hint:'Percentage change = (new − old) ÷ old × 100.',working:'(67.2 − 64) ÷ 64 × 100 = 5%. A change in mean is a signal to investigate; it does not by itself prove the parts are acceptable or identify the cause.'},
  {category:'Shrinkage',level:'Advanced',question:'For one measured direction, a mould dimension is 100.0 mm and the conditioned part dimension is 98.5 mm. What is the simple linear shrinkage estimate?',choices:['1.5%','0.15%','1.5 mm'],answer:0,hint:'Subtract part size from mould size, divide by mould size, then multiply by 100.',working:'(100.0 − 98.5) ÷ 100.0 × 100 = 1.5%. This is a simple direction-specific estimate; material, process, conditioning time and measurement method affect the result.'},
  {category:'Clamp-force estimate',level:'Advanced',question:'A simplified example uses 3,200 mm² projected area and 35 MPa cavity pressure. What separating-force estimate does the calculation give?',choices:['About 11.4 tonne-force','About 112 tonne-force','About 11.4 kN'],answer:0,hint:'1 MPa = 1 N/mm². Calculate pressure × area for newtons, convert to kN, then divide by 9.80665 for tonne-force.',working:'35 × 3,200 = 112,000 N = 112 kN. 112 ÷ 9.80665 ≈ 11.4 tonne-force. This is a simplified training estimate only, not a clamp setting or machine-selection approval. Use total projected area and relevant cavity-pressure evidence; actual clamp requirements need qualified engineering and approved machine, mould and site limits.'},
  {category:'Measurement skill',level:'Shop-floor check',question:'Two operators get different readings from the same part, while the apparent difference is small. What should be checked before changing the moulding process?',choices:['Increase pressure to see which reading is right','Standardise the instrument, fixture, method and part-conditioning time, then check repeatability','Average the readings and discard the originals'],answer:1,hint:'First find out whether the measured difference is real and repeatable.',working:'Check instrument resolution and condition, fixture, method, operator repeatability, part location and conditioning time. Keep the original readings and method with the record before interpreting a process shift.'},
  {category:'Reading data',level:'Shop-floor check',question:'Four cavities have stable measurements near 10.0 mm, but one cavity is repeatedly near 10.4 mm. What is the best first analysis?',choices:['Average all cavities and treat the mould as one population','Separate results by cavity and confirm the measurement method before diagnosing the local difference','Change a global setting until all readings match'],answer:1,hint:'A combined average can hide a repeatable cavity-to-cavity difference.',working:'Keep cavity identity, compare like-for-like measurements and confirm the measurement system. Then investigate the local tool/process evidence. Do not erase a real cavity difference by averaging it away or jump straight to a global setting change.'}
]);
const MATH_COURSE=Object.freeze([
  {id:'calculation-basics',unit:'1 · Maths foundations',title:'How to solve a shop-floor calculation',level:'Start here',goal:'Turn a written problem into a checked answer.',teach:'First say what you need to find. Write every known number with its unit, convert values to matching units, choose a formula, substitute the numbers, calculate, then ask whether the answer is a sensible size. Keep the original readings so another person can follow your working.',formula:'Estimate → list known values and units → choose/rearrange formula → calculate → check units and size.',example:['Question: A cycle lasts 2.5 minutes. Find the time in seconds.','Known: 2.5 min. Conversion: 60 s = 1 min.','Calculate: 2.5 × 60 = 150 s. Check: 2 min 30 s is 150 s.'],watch:'A number without its unit is incomplete. Do not round intermediate values too early.',check:{question:'A cycle lasts 1.5 minutes. How many seconds is that?',choices:['60 seconds','90 seconds','150 seconds'],answer:1,hint:'Multiply minutes by 60 seconds per minute.',working:'1.5 min × 60 s/min = 90 s.'}},
  {id:'units',unit:'1 · Maths foundations',title:'Metric units and conversions',level:'Start here',goal:'Convert measurements without mixing millimetres, grams or minutes.',teach:'Use the conversion factor that connects the units. Length: 10 mm = 1 cm, 1,000 mm = 1 m, and 1 inch = 25.4 mm. Mass: 1 kg = 1,000 g and 1 kg ≈ 2.20462 lb. Time: 1 min = 60 s. Temperature: °F = (°C × 9 ÷ 5) + 32; temperature differences use Δ°F = Δ°C × 9 ÷ 5. Volume: 1 cm³ = 1,000 mm³ = 1 mL, and 1 L = 1,000 cm³. Area and volume conversions are squared and cubed, so 1 cm² = 100 mm² but 1 cm³ = 1,000 mm³.',formula:'Converted value = original value × conversion factor. Write the factor with units so the old unit cancels.',example:['Convert 2.4 kg to grams: 2.4 kg × (1,000 g ÷ 1 kg).','The kg units cancel.','2.4 × 1,000 = 2,400 g. For 50 mm: 50 ÷ 25.4 ≈ 1.97 in.'],watch:'Do not convert an area or volume as if it were a length. Keep the exponent on mm² and mm³. Temperature differences and actual temperatures use different conversions.',check:{question:'A material sample weighs 0.75 kg. What is its mass in grams?',choices:['75 g','750 g','7,500 g'],answer:1,hint:'There are 1,000 grams in 1 kilogram.',working:'0.75 kg × 1,000 g/kg = 750 g.'}},
  {id:'percent-ratios',unit:'1 · Maths foundations',title:'Decimals, fractions, ratios and percentages',level:'Start here',goal:'Read blend percentages correctly and use the right denominator.',teach:'A percentage is a fraction out of 100: 2.5% = 2.5 ÷ 100 = 0.025. To find a percentage of a total, multiply the total by the decimal fraction. For a ratio, first confirm the order of components, then add the ratio parts to find the total. A ratio 1:4 means five total parts, so the first component is 1/5 = 20% of the total. Always identify whether a blend percentage is based on final blend, base resin or another stated quantity.',formula:'Part of total = total × percentage ÷ 100. Percentage = part ÷ stated base × 100. Ratio fraction = component parts ÷ all ratio parts.',example:['For an 8 kg final blend with 2.5% additive by total blend mass:','2.5% = 0.025. Additive = 8 × 0.025 = 0.2 kg.','Base resin = 8 − 0.2 = 7.8 kg. For an additive:resin ratio of 1:4, additive is 1 ÷ (1 + 4) = 20% of that blend.'],watch:'A percentage of final blend and a percentage added on top of the resin have different denominators. Confirm what each side of a ratio represents.',check:{question:'A 12 kg final blend contains 3% additive by total blend mass. How much additive is in it?',choices:['0.036 kg','0.36 kg','3.6 kg'],answer:1,hint:'Convert 3% to 0.03, then multiply by 12 kg.',working:'12 kg × 0.03 = 0.36 kg, or 360 g.'}},
  {id:'formulas',unit:'1 · Maths foundations',title:'Using and rearranging formulas',level:'Start here',goal:'Make the required value the subject of the equation.',teach:'A formula describes a relationship. To rearrange it, perform the same operation on both sides. If cycles per hour = 3,600 ÷ cycle seconds, then cycle seconds = 3,600 ÷ cycles per hour. Check by substituting the answer back into the original formula. Units often show whether you have rearranged it correctly.',formula:'If y = a × b, then a = y ÷ b. If y = a ÷ b, then a = y × b.',example:['A line completes 120 cycles per hour. Find the cycle time.','Cycle seconds = 3,600 s/hour ÷ 120 cycles/hour.','Cycle time = 30 s/cycle. Substitution: 3,600 ÷ 30 = 120 cycles/hour.'],watch:'Do not swap multiplication and division without checking the original equation and units.',check:{question:'A machine completes 120 cycles per hour. What cycle time does that imply?',choices:['20 seconds','30 seconds','60 seconds'],answer:1,hint:'There are 3,600 seconds in one hour. Divide by cycles per hour.',working:'3,600 ÷ 120 = 30 seconds per cycle.'}},
  {id:'projected-area',unit:'2 · Parts and materials',title:'Length, area and projected area',level:'Core',goal:'Calculate simple areas and understand the area used in a clamp-force estimate.',teach:'Rectangle area is length × width. Circle area is π × diameter² ÷ 4. Projected area is the two-dimensional silhouette seen along the clamping direction at the mould parting plane. For a mould estimate, the relevant projected areas of all cavities and the runner system may need to be included. It is not the total surface area of the part.',formula:'Rectangle: A = L × W. Circle: A = πD² ÷ 4. Keep dimensions in mm to get mm².',example:['A 40 mm diameter circle has area A = π × 40² ÷ 4.','A ≈ 1,256.6 mm².','For several cavities, add the relevant cavity and runner projected areas from the approved mould layout.'],watch:'The correct projected area depends on the actual mould layout and clamping direction; verify it from approved drawings.',illustration:'projected-area',check:{question:'A rectangle measures 50 mm by 20 mm. What is its area?',choices:['100 mm²','700 mm²','1,000 mm²'],answer:2,hint:'Multiply length by width and keep square units.',working:'50 mm × 20 mm = 1,000 mm².'}},
  {id:'volume',unit:'2 · Parts and materials',title:'Volume and simple geometry',level:'Core',goal:'Calculate a simple cavity or screw-displacement volume.',teach:'A rectangular prism has volume length × width × height. A cylinder has volume π × diameter² ÷ 4 × length. If all dimensions are in mm, volume is mm³. Divide mm³ by 1,000 to get cm³. These shapes are learning models; real parts have ribs, cores, tapers and other features that require drawings or CAD for accurate volume.',formula:'Rectangular volume: V = L × W × H. Cylindrical volume: V = πD²L ÷ 4. 1 cm³ = 1,000 mm³.',example:['A simple block is 20 mm × 10 mm × 5 mm.','V = 20 × 10 × 5 = 1,000 mm³.','1,000 mm³ ÷ 1,000 = 1 cm³.'],watch:'Use one unit system throughout the calculation. A volume estimate is only as accurate as the geometry supplied.',check:{question:'What is the volume of a 20 mm × 10 mm × 5 mm block in cm³?',choices:['0.1 cm³','1 cm³','10 cm³'],answer:1,hint:'First find mm³, then divide by 1,000.',working:'20 × 10 × 5 = 1,000 mm³. 1,000 ÷ 1,000 = 1 cm³.'}},
  {id:'density',unit:'2 · Parts and materials',title:'Density, volume and mass',level:'Core',goal:'Convert a volume estimate into a material mass estimate.',teach:'Density tells you how much mass occupies a given volume. Multiply volume by density when the units match. If volume is cm³ and density is g/cm³, the result is grams. Resin grade, fillers, temperature, voids and actual part geometry can affect the value, so use a grade-specific data sheet or a measured part mass when accuracy matters.',formula:'Mass = density × volume. Example units: g = (g/cm³) × cm³.',example:['Assume a measured material density of 1.2 g/cm³ and a volume of 30 cm³.','Mass = 1.2 × 30.','Estimated mass = 36 g.'],watch:'A generic density is for teaching only. Do not use it in a production material or shot-size decision without grade-specific data.',check:{question:'At 1.1 g/cm³, what is the estimated mass of 50 cm³?',choices:['5.5 g','55 g','550 g'],answer:1,hint:'Multiply density by volume; cm³ cancels.',working:'1.1 g/cm³ × 50 cm³ = 55 g.'}},
  {id:'shot-mass',unit:'2 · Parts and materials',title:'Part mass and total shot mass',level:'Core',goal:'Add cavity output and any ejected runner mass correctly.',teach:'For a cold-runner mould, shot mass is the mass of all parts produced in that shot plus the ejected runner and other material that leaves the mould. Multiply one part mass by the number of cavities actually producing parts, then add the runner mass. A hot-runner system usually keeps the runner melt in the tool, so account for it according to the actual system rather than adding a cold-runner mass.',formula:'Cold-runner shot mass = (part mass × active cavities) + ejected runner mass.',example:['Four active cavities produce parts of 13.2 g each; the cold runner weighs 6.8 g.','Part mass total = 4 × 13.2 = 52.8 g.','Shot mass = 52.8 + 6.8 = 59.6 g per shot.'],watch:'Use active cavities and measured weights from the same process and material. Do not mix per-part and per-shot quantities.',illustration:'shot-mass',check:{question:'Eight active cavities make 5 g parts; the ejected cold runner weighs 12 g. What is total shot mass?',choices:['40 g','52 g','60 g'],answer:1,hint:'Multiply part mass by active cavities, then add the runner.',working:'8 × 5 g + 12 g = 52 g per shot.'}},
  {id:'blends',unit:'2 · Parts and materials',title:'Additives, phr, masterbatch and regrind',level:'Core',goal:'Calculate blend quantities while keeping the denominator clear.',teach:'For a percentage of the final blend, additive mass = final blend mass × percentage. Parts per hundred resin (phr) uses the resin mass as the base: 3 phr means 3 parts additive for each 100 parts resin. For masterbatch, active additive = masterbatch mass × active concentration. To achieve a target active mass, divide by the masterbatch concentration. Regrind percentages also need a stated base and must follow the approved grade and quality procedure.',formula:'phr = additive mass ÷ resin mass × 100. Masterbatch needed = target active mass ÷ active fraction.',example:['For 4 kg resin at 3 phr: additive = 4 × 3 ÷ 100 = 0.12 kg.','That is 120 g additive; the total blend is 4.12 kg if nothing is removed.','If a masterbatch is 20% active, 120 g active would require 120 ÷ 0.20 = 600 g masterbatch.'],watch:'Do not treat phr as a percentage of the final blend. Regrind and additives require grade-specific approval and accurate weighing.',check:{question:'How much additive is 3 phr on 4 kg of resin?',choices:['12 g','120 g','400 g'],answer:1,hint:'Multiply resin mass by 3, then divide by 100.',working:'4 kg × 3 ÷ 100 = 0.12 kg = 120 g.'}},
  {id:'material-planning',unit:'2 · Parts and materials',title:'Material planning for an order',level:'Core',goal:'Estimate theoretical material demand before adding separately measured losses.',teach:'Start with shot mass and the number of shots, not just the number of parts. If an order is stated as good parts, estimate the shots required using active cavities and a yield based on actual evidence. Round up to a whole shot, multiply by shot mass, then add separately identified startup, purge, sampling and other process losses. Keep assumptions visible and do not count the same reject or runner loss twice.',formula:'Shots required = ceil[good-part target ÷ (active cavities × expected yield fraction)]. Theoretical material (kg) = shot mass (g) × shots ÷ 1,000.',example:['Target = 1,000 good parts; 4 active cavities; evidence-based yield estimate = 95%.','Shots = 1,000 ÷ (4 × 0.95) = 263.16, so plan at least 264 whole shots.','At 59.6 g/shot, theoretical material = 59.6 × 264 ÷ 1,000 ≈ 15.73 kg, before separately estimated startup or purge material.'],watch:'Yield is an estimate from relevant records, not a guaranteed result. Identify whether runner, startup and scrap are already included before adding allowances.',check:{question:'A 32 g shot runs for 1,000 shots. How much theoretical material is used?',choices:['3.2 kg','32 kg','320 kg'],answer:1,hint:'Multiply grams per shot by shots, then divide grams by 1,000 for kg.',working:'32 g × 1,000 = 32,000 g = 32 kg.'}},
  {id:'cycle-time',unit:'3 · Time and production',title:'Cycle time and cycles per hour',level:'Core',goal:'Move between cycle seconds and a theoretical hourly cycle rate.',teach:'One hour contains 3,600 seconds. Divide 3,600 by seconds per cycle to calculate theoretical cycles per hour. This assumes the machine completes cycles continuously for the full hour. It does not include stops, setup, rejects or unavailable time.',formula:'Theoretical cycles/hour = 3,600 ÷ cycle time in seconds.',example:['Cycle time = 30 seconds.','Cycles/hour = 3,600 ÷ 30.','Theoretical rate = 120 cycles/hour.'],watch:'Confirm whether the time is seconds per cycle, minutes per cycle, or elapsed production time. They are different measures.',check:{question:'At a 24-second cycle, how many theoretical cycles fit in one hour?',choices:['60 cycles','120 cycles','150 cycles'],answer:2,hint:'Divide 3,600 seconds by 24 seconds per cycle.',working:'3,600 ÷ 24 = 150 cycles/hour.'}},
  {id:'production-rate',unit:'3 · Time and production',title:'Cavities, parts per hour and shift output',level:'Core',goal:'Convert cycles into parts using the cavities actually producing.',teach:'Multiply cycles per hour by the number of active cavities to get theoretical parts per hour. For shift output, multiply by scheduled running time, then adjust using measured downtime and accepted good yield. A blocked cavity reduces output even if the mould still cycles. Always record cycles, active cavities, total parts and good parts separately.',formula:'Theoretical parts/hour = cycles/hour × active cavities. Good parts = total produced − rejected parts.',example:['A 45-second cycle gives 3,600 ÷ 45 = 80 cycles/hour.','With four active cavities: 80 × 4 = 320 parts/hour.','Actual accepted output is lower if there are stops, unfilled cavities or rejects.'],watch:'Do not multiply by the mould’s total cavities when some cavities are inactive or not producing acceptable parts.',check:{question:'A 45-second cycle runs with four active cavities. What is theoretical output per hour?',choices:['80 parts/hour','180 parts/hour','320 parts/hour'],answer:2,hint:'Find cycles per hour first, then multiply by four active cavities.',working:'3,600 ÷ 45 = 80 cycles/hour. 80 × 4 = 320 parts/hour.'}},
  {id:'oee',unit:'3 · Time and production',title:'Availability, performance and OEE',level:'Advanced',goal:'Separate downtime, speed loss and quality loss in a production measure.',teach:'Availability = run time ÷ planned production time. Performance compares actual output with the ideal output for the actual run time. Quality = accepted good pieces ÷ total pieces. OEE is availability × performance × quality, expressed as fractions. For moulding, calculate ideal output using the applicable ideal cycle and active-cavity count, then use matching time and part-count definitions. Use site-approved rules; otherwise OEE comparisons can mislead.',formula:'Availability = run time ÷ planned time. Performance = actual total output ÷ ideal output during run time. Quality = accepted good output ÷ actual total output. OEE = A × P × Q.',example:['An 8-hour schedule has 1 hour downtime, so availability = 7 ÷ 8 = 87.5%.','During 7 running hours, ideal output is 2,800 pieces; actual output is 2,500 and 2,460 pass. Performance = 2,500 ÷ 2,800 = 89.3%; quality = 2,460 ÷ 2,500 = 98.4%.','OEE = 0.875 × 0.893 × 0.984 ≈ 76.9%.'],watch:'OEE definitions can vary between sites. Use site-approved definitions and consistent cavities, time windows, cycle rates and quality rules.',check:{question:'Availability is 0.875, performance is 0.893 and quality is 0.984. What is approximate OEE?',choices:['68.2%','76.9%','98.4%'],answer:1,hint:'Multiply the three fractions, then convert to a percent.',working:'0.875 × 0.893 × 0.984 ≈ 0.769, or 76.9%.'}},
  {id:'yield',unit:'4 · Quality and measurement',title:'Reject rate, yield and scrap',level:'Core',goal:'Calculate quality percentages with a clear total and disposition.',teach:'Reject rate is rejected pieces divided by total pieces produced. First-pass yield is accepted good pieces divided by total pieces produced. Rework should remain separate until the part passes the defined acceptance check. If you convert scrap mass to a percentage, state whether the denominator is shot mass, total material issued or another defined quantity.',formula:'Reject rate (%) = rejects ÷ total produced × 100. First-pass yield (%) = first-pass good ÷ total produced × 100.',example:['600 pieces are produced and 15 are rejected.','Reject rate = 15 ÷ 600 × 100 = 2.5%.','If the other 585 pass first time, yield = 585 ÷ 600 × 100 = 97.5%.'],watch:'Do not count rework as good until it has passed the acceptance criteria. Keep counts and weights distinct.',check:{question:'There are 18 rejects among 900 produced pieces. What are reject rate and first-pass yield?',choices:['2% reject; 98% yield','2% reject; 2% yield','18% reject; 82% yield'],answer:0,hint:'Reject rate is rejects divided by total; yield is the remaining good fraction.',working:'18 ÷ 900 × 100 = 2% rejects. The remaining 882 ÷ 900 × 100 = 98% first-pass yield.'}},
  {id:'tolerance',unit:'4 · Quality and measurement',title:'Nominal dimensions, tolerance and limits',level:'Core',goal:'Translate a drawing tolerance into lower and upper limits.',teach:'Nominal is the target dimension. A bilateral tolerance such as 10.0 ± 0.1 mm gives a lower limit of 9.9 mm and an upper limit of 10.1 mm. Compare each valid measurement with the specified limits using the defined measurement method. Measurement resolution, calibration, fixture, part conditioning and location all matter near a limit.',formula:'Lower limit = nominal − lower tolerance. Upper limit = nominal + upper tolerance.',example:['Drawing: 10.0 ± 0.1 mm.','Lower limit = 10.0 − 0.1 = 9.9 mm.','Upper limit = 10.0 + 0.1 = 10.1 mm.'],watch:'A tolerance is not the same as a process control limit. Use the drawing and customer-approved inspection method.',illustration:'tolerance',check:{question:'For a dimension of 10.0 ± 0.1 mm, what is the upper limit?',choices:['9.9 mm','10.0 mm','10.1 mm'],answer:2,hint:'Add the positive tolerance to the nominal dimension.',working:'10.0 + 0.1 = 10.1 mm upper limit.'}},
  {id:'statistics',unit:'4 · Quality and measurement',title:'Mean, median and range',level:'Core',goal:'Summarise measurements without hiding cavity or time differences.',teach:'The mean is the total of all readings divided by the number of readings. The median is the middle reading after sorting; for an even count, average the two middle readings. The range is the largest reading minus the smallest. These summaries describe a data set but do not replace individual checks against specification. Keep cavity, time, material lot and measurement method attached; combining different groups can hide a real issue.',formula:'Mean = Σx ÷ n. Median = middle sorted value (or mean of two middle values). Range = maximum − minimum.',example:['Readings: 10.1, 10.3, 10.2 and 10.2 g. Sort: 10.1, 10.2, 10.2, 10.3.','Mean = 40.8 ÷ 4 = 10.2 g; median = (10.2 + 10.2) ÷ 2 = 10.2 g.','Range = 10.3 − 10.1 = 0.2 g.'],watch:'An average does not prove every part is in specification. Preserve raw readings and separate cavities where appropriate.',check:{question:'Readings are 8, 9 and 10 g. What are the mean and range?',choices:['Mean 8 g; range 2 g','Mean 9 g; range 2 g','Mean 9 g; range 1 g'],answer:1,hint:'Add and divide by three for the mean; subtract smallest from largest for range.',working:'Mean = (8 + 9 + 10) ÷ 3 = 9 g. Range = 10 − 8 = 2 g.'}},
  {id:'percent-change',unit:'4 · Quality and measurement',title:'Percentage change and a stable baseline',level:'Core',goal:'Compare like-for-like measurements against a defined baseline.',teach:'Percentage change uses the baseline as the denominator. Subtract the baseline from the new value, divide by the baseline, then multiply by 100. State whether the result is an increase or decrease. Compare the same signal, units, cavity, time window and measurement method. A change is a prompt to investigate; it does not prove a cause or make a part acceptable.',formula:'Percentage change = (new value − baseline value) ÷ baseline value × 100.',example:['Baseline cycle time = 40 s; new cycle time = 36 s.','Change = (36 − 40) ÷ 40 × 100.','Result = −10%, meaning cycle time is 10% lower than baseline.'],watch:'Do not use a changing or unsuitable baseline. Confirm like-for-like data before drawing a conclusion.',check:{question:'A cycle changes from 40 seconds to 36 seconds. What is the percentage change?',choices:['4% decrease','10% decrease','10% increase'],answer:1,hint:'Use (new − baseline) ÷ baseline × 100.',working:'(36 − 40) ÷ 40 × 100 = −10%, a 10% decrease.'}},
  {id:'shrinkage',unit:'4 · Quality and measurement',title:'Linear shrinkage estimates',level:'Advanced',goal:'Calculate a simple direction-specific mould-to-part shrinkage estimate.',teach:'Compare a mould dimension with a corresponding conditioned part dimension along the same direction. Subtract part size from mould size, divide by mould size and multiply by 100. Shrinkage varies with resin grade, fibre direction, wall thickness, gate, packing, cooling, mould temperature and conditioning. This simple calculation is descriptive; tooling changes need approved engineering evidence.',formula:'Linear shrinkage (%) = (mould dimension − conditioned part dimension) ÷ mould dimension × 100.',example:['Mould dimension = 50.0 mm; conditioned part dimension = 49.0 mm.','Difference = 50.0 − 49.0 = 1.0 mm.','Shrinkage estimate = 1.0 ÷ 50.0 × 100 = 2.0%.'],watch:'Match the same axis and measurement points. Do not treat one measured shrinkage value as universal for a resin or mould.',check:{question:'A mould dimension is 50.0 mm and the conditioned part is 49.0 mm. What is the simple shrinkage estimate?',choices:['1%','2%','5%'],answer:1,hint:'Difference divided by mould dimension, then multiply by 100.',working:'(50 − 49) ÷ 50 × 100 = 2% for that measured direction and condition.'}},
  {id:'pressure',unit:'5 · Machine and utility calculations',title:'Pressure units and what a display means',level:'Core',goal:'Convert pressure units and distinguish hydraulic pressure from melt pressure.',teach:'One MPa equals 10 bar, about 145 psi, and 1 N/mm². These are unit conversions only. A machine may display hydraulic pressure, calculated melt pressure, or another signal; machine geometry and intensification ratios can change the relationship. Read the machine manual and signal definition before interpreting a display. Never substitute one pressure type for another.',formula:'1 MPa = 10 bar = 1 N/mm² ≈ 145 psi. 1 bar = 0.1 MPa.',example:['Convert 5 MPa to bar.','5 MPa × 10 bar/MPa.','Result = 50 bar. This does not identify whether a machine display is hydraulic or plastic pressure.'],watch:'Pressure conversion does not tell you which pressure sensor or machine limit applies. Use the exact machine documentation.',check:{question:'What is 5 MPa in bar?',choices:['5 bar','50 bar','500 bar'],answer:1,hint:'Each MPa is 10 bar.',working:'5 MPa × 10 bar/MPa = 50 bar.'}},
  {id:'clamp-force',unit:'5 · Machine and utility calculations',title:'Force, projected area and a clamp-force estimate',level:'Advanced',goal:'Understand the pressure × area relationship and its limits.',teach:'Force equals pressure multiplied by area. Since 1 MPa = 1 N/mm², multiplying MPa by mm² gives newtons. Divide by 1,000 for kN. A simplified separating-force estimate can use cavity pressure and total projected area, but actual clamp requirements depend on mould layout, pressure distribution, material, process envelope and machine/tool limits. This lesson is not a machine-selection or setting instruction.',formula:'F(kN) = pressure (MPa) × projected area (mm²) ÷ 1,000. Tonne-force ≈ kN ÷ 9.80665.',example:['For a simplified example only: 20 MPa × 1,000 mm² = 20,000 N.','20,000 N ÷ 1,000 = 20 kN.','20 kN ÷ 9.80665 ≈ 2.04 metric tonne-force. A qualified engineer must determine real requirements.'],watch:'This estimate is not a clamp setting, safety margin or machine approval. Use approved engineering calculations and site limits.',illustration:'clamp-force',check:{question:'Using a simplified example, 20 MPa acts over 1,000 mm². What force does the equation give?',choices:['2 kN','20 kN','200 kN'],answer:1,hint:'MPa × mm² gives newtons. Divide by 1,000 for kN.',working:'20 × 1,000 = 20,000 N = 20 kN. This is a teaching calculation, not a machine setting.'}},
  {id:'shot-capacity',unit:'5 · Machine and utility calculations',title:'Screw displacement and shot capacity',level:'Advanced',goal:'Understand geometric screw displacement and why it is not actual delivered shot.',teach:'The barrel screw’s swept volume can be approximated from screw diameter and travel using the cylinder formula. Convert mm³ to cm³ before comparing volumes. This is only a geometric displacement estimate. Actual delivered melt depends on machine design, check-ring condition, compression, cushion, material, and the manufacturer’s rating method. Use the resin-specific machine data and qualified procedure for real capacity checks.',formula:'Swept volume = π × screw diameter² ÷ 4 × screw travel. 1 cm³ = 1,000 mm³.',example:['Screw diameter = 20 mm; travel = 10 mm.','Area = π × 20² ÷ 4 ≈ 314.16 mm².','Volume = 314.16 × 10 = 3,141.6 mm³ ≈ 3.14 cm³ geometric displacement.'],watch:'Geometric displacement is not the same as usable shot mass or delivered melt volume. Do not infer a safe shot size from this alone.',check:{question:'A 20 mm screw travels 10 mm. What is the approximate geometric swept volume?',choices:['0.314 cm³','3.14 cm³','31.4 cm³'],answer:1,hint:'Calculate πD²/4 × travel in mm³, then divide by 1,000.',working:'π × 20² ÷ 4 × 10 ≈ 3,142 mm³. 3,142 ÷ 1,000 ≈ 3.14 cm³.'}},
  {id:'cooling',unit:'5 · Machine and utility calculations',title:'Cooling flow and temperature difference',level:'Advanced',goal:'Calculate basic flow and temperature differences from measured values.',teach:'Flow conversion is straightforward: multiply litres per minute by 60 to get litres per hour. Temperature difference is outlet temperature minus inlet temperature when both are measured at identified locations. These values help describe a circuit; they do not reveal the full mould temperature field or prove a restriction. Heat-transfer calculations also require actual mass flow and material heat capacity.',formula:'Flow (L/hour) = flow (L/min) × 60. Temperature difference ΔT = outlet temperature − inlet temperature.',example:['A measured circuit flow is 5 L/min.','Hourly flow = 5 × 60 = 300 L/hour.','If supply is 20°C and return is 24°C, the measured rise is 4°C.'],watch:'Identify the exact circuit and probe locations. Do not infer a universal cooling target from a single inlet/outlet difference.',check:{question:'A circuit flow meter reads 5 L/min. What is that in L/hour?',choices:['50 L/hour','180 L/hour','300 L/hour'],answer:2,hint:'Multiply litres per minute by 60 minutes per hour.',working:'5 L/min × 60 min/hour = 300 L/hour.'}},
  {id:'energy-cost',unit:'5 · Machine and utility calculations',title:'Energy and material cost per accepted part',level:'Core',goal:'Calculate energy use, energy cost and a clearly defined cost per good part.',teach:'Energy in kilowatt-hours is average measured power in kilowatts multiplied by operating hours. Multiply measured energy by the actual tariff for energy cost. To calculate an energy charge per accepted part, divide that period’s energy cost by accepted good output in the same period. Material cost per good part is defined material cost divided by accepted good output; state how scrap, runners and startup material are allocated. Nameplate motor power is not the same as actual average machine draw.',formula:'Energy (kWh) = average measured power (kW) × time (h). Energy cost = kWh × tariff. Energy cost/good part = period energy cost ÷ accepted good parts.',example:['Average measured draw = 12 kW for 2.5 hours: energy = 12 × 2.5 = 30 kWh.','At $0.25/kWh, energy cost = 30 × $0.25 = $7.50.','If 300 good parts were accepted in that period, measured energy cost per good part = $7.50 ÷ 300 = $0.025, or 2.5 cents.'],watch:'This is the energy portion only, not the full part cost. Use measured load, actual tariff, matching time windows and accepted-good output.',check:{question:'A period uses 30 kWh at $0.25/kWh and produces 300 accepted parts. What is the energy cost per part?',choices:['0.25 cents','2.5 cents','25 cents'],answer:1,hint:'Find the period energy cost, then divide by accepted good parts.',working:'30 × $0.25 = $7.50. $7.50 ÷ 300 = $0.025 = 2.5 cents per accepted part.'}},
  {id:'cooling-heat-load',unit:'5 · Machine and utility calculations',title:'Cooling water heat-carrying estimate',level:'Advanced',goal:'Connect water flow and temperature rise to a simple heat-removal estimate.',teach:'For a flowing liquid, heat carried per second is mass flow × specific heat capacity × temperature change. For a teaching estimate with water near room temperature, 1 L is approximately 1 kg and specific heat is about 4.18 kJ/(kg·°C). Convert litres per minute to kilograms per second before calculating kilowatts. This estimates heat carried by the measured coolant stream; it does not equal the mould surface temperature or prove the entire tool cools evenly.',formula:'Heat rate (kW) ≈ mass flow (kg/s) × specific heat [kJ/(kg·°C)] × ΔT (°C). For water near room temperature: ρ ≈ 1 kg/L; cp ≈ 4.18 kJ/(kg·°C).',example:['Flow = 5 L/min ≈ 5 kg/min = 5 ÷ 60 = 0.0833 kg/s. Return rise ΔT = 4°C.','Heat rate ≈ 0.0833 × 4.18 × 4 = 1.39 kJ/s.','Since 1 kJ/s = 1 kW, the measured stream carries about 1.39 kW under these assumptions.'],watch:'Use the correct coolant properties if using glycol or a different fluid. Confirm calibrated flow and temperature readings; do not treat this estimate as a mould cooling specification.',illustration:'cooling-heat-load',check:{question:'Water flows at 1 kg/s and warms by 2°C. Using cp ≈ 4.18 kJ/(kg·°C), what heat rate is carried?',choices:['2.09 kW','4.18 kW','8.36 kW'],answer:2,hint:'Multiply mass flow × specific heat × temperature rise.',working:'1 kg/s × 4.18 kJ/(kg·°C) × 2°C = 8.36 kJ/s = 8.36 kW.'}},
  {id:'shot-utilisation',unit:'5 · Machine and utility calculations',title:'Shot-capacity utilisation as a calculation',level:'Advanced',goal:'Compare a measured shot mass with the correct manufacturer rating basis.',teach:'A utilisation percentage compares the measured material mass per shot with a manufacturer’s stated shot-mass capacity when both values use the same material basis and rating method. It describes a ratio only. Screw design, resin density, check-ring behaviour and manufacturer rating conventions affect the comparison, so do not substitute a generic target or use the result by itself to approve a production shot size.',formula:'Shot-mass utilisation (%) = measured total shot mass ÷ compatible manufacturer-rated shot mass × 100.',example:['Measured total shot mass = 40 g; compatible manufacturer reference = 100 g.','Utilisation = 40 ÷ 100 × 100.','The ratio is 40%. It is a comparison, not an instruction to change shot size.'],watch:'Confirm the exact press, screw and resin rating basis. This percentage is not a safe-shot recommendation or machine-capacity approval.',check:{question:'A 40 g measured shot is compared with a compatible 100 g rated shot-mass reference. What ratio does it give?',choices:['4%','40%','400%'],answer:1,hint:'Divide measured mass by rated mass, then multiply by 100.',working:'40 ÷ 100 × 100 = 40%. This arithmetic does not approve a process setting.'}},
  {id:'standard-deviation',unit:'6 · Advanced quality maths',title:'Standard deviation: measuring process spread',level:'Advanced',goal:'Calculate sample standard deviation before using Cp or Cpk.',teach:'Standard deviation estimates how widely individual readings spread around their mean. For a sample, first find the mean, subtract it from every reading, square each difference, add the squares, divide by one less than the number of readings, then take the square root. The result has the same unit as the readings. Use a representative, stable set collected with a suitable measurement method; a small teaching example is not enough to judge a real process.',formula:'Sample standard deviation: s = √[Σ(x − x̄)² ÷ (n − 1)].',example:['Readings: 9, 10 and 11 g. Mean = 10 g; differences are −1, 0 and +1 g.','Square and add: 1 + 0 + 1 = 2 g². Divide by n − 1: 2 ÷ 2 = 1 g².','Square root: s = √1 = 1 g.'],watch:'Do not mix cavities, shifts, materials or measurement methods into one spread estimate without a valid reason. For a complete population, a different denominator is used.',illustration:'standard-deviation',check:{question:'What is the sample standard deviation of 9, 10 and 11 g?',choices:['0.5 g','1 g','2 g'],answer:1,hint:'The mean is 10 g. Square the differences, divide their sum by n − 1, then take the square root.',working:'Mean = 10 g. Squared differences: 1 + 0 + 1 = 2. Sample variance = 2 ÷ (3 − 1) = 1 g². Standard deviation = √1 = 1 g.'}},
  {id:'capability',unit:'6 · Advanced quality maths',title:'Process capability: Cp and Cpk',level:'Advanced',goal:'Learn what capability ratios calculate and what evidence they require.',teach:'Cp compares specification width with six standard deviations of process spread. Cpk also accounts for how close the process mean is to the nearer specification limit. These calculations are meaningful only with a valid measurement system, stable representative data, correctly defined specifications and suitable statistical assumptions. A capability number is not proof that every part will conform and does not replace the customer’s acceptance rule.',formula:'Cp = (USL − LSL) ÷ (6s). Cpk = min[(USL − mean) ÷ (3s), (mean − LSL) ÷ (3s)].',example:['Specification limits: LSL = 9.4 mm and USL = 10.6 mm; s = 0.1 mm.','Cp = (10.6 − 9.4) ÷ (6 × 0.1) = 1.2 ÷ 0.6 = 2.0.','If the mean is 10.4 mm, the upper-side index is (10.6 − 10.4) ÷ (3 × 0.1) = 0.67; the lower side is 3.33.','Cpk = the smaller side = 0.67. A qualified person must interpret capability against site and customer rules.'],watch:'Do not calculate capability on unstable, cherry-picked or mixed-cavity data. Site and customer criteria govern interpretation.',check:{question:'LSL = 9.4 mm, USL = 10.6 mm, mean = 10.4 mm and s = 0.1 mm. What is Cpk?',choices:['0.67','2.0','3.33'],answer:0,hint:'Find each spec-limit distance divided by 3s, then use the smaller value.',working:'Upper side = (10.6 − 10.4) ÷ 0.3 ≈ 0.67. Lower side = (10.4 − 9.4) ÷ 0.3 ≈ 3.33. Cpk is the smaller value: about 0.67.'}}
]);
const MATH_FORMULAS=Object.freeze(MATH_COURSE.map(item=>({title:item.title,body:item.formula})));
let mathIndex=0,mathSelected=null;
let mathCourseSelections=Object.create(null),mathCourseProgressOwner=null,mathCourseCompleted=new Set();
const MATH_ILLUSTRATIONS=Object.freeze({
  'projected-area':'<figure class="pd-math-figure"><svg viewBox="0 0 680 190" role="img" aria-labelledby="pd-area-title pd-area-desc"><title id="pd-area-title">Projected area through the mould</title><desc id="pd-area-desc">Four cavity rectangles connected by a runner are viewed along the clamp direction. The dashed outline encloses the projected area.</desc><defs><marker id="pd-area-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f2c14e"/></marker></defs><rect x="155" y="32" width="360" height="126" rx="12" fill="none" stroke="#f2c14e" stroke-width="3" stroke-dasharray="10 7"/><path d="M85 95 H137" stroke="#f2c14e" stroke-width="4" marker-end="url(#pd-area-arrow)"/><text x="24" y="78" fill="#f4e7b5" font-size="14">Clamp</text><text x="20" y="112" fill="#f4e7b5" font-size="14">direction</text><path d="M335 55 V135 M235 95 H435" stroke="#83b7ff" stroke-width="13" stroke-linecap="round"/><rect x="180" y="47" width="92" height="40" rx="7" fill="#235a76" stroke="#8bd5f5" stroke-width="2"/><rect x="398" y="47" width="92" height="40" rx="7" fill="#235a76" stroke="#8bd5f5" stroke-width="2"/><rect x="180" y="103" width="92" height="40" rx="7" fill="#235a76" stroke="#8bd5f5" stroke-width="2"/><rect x="398" y="103" width="92" height="40" rx="7" fill="#235a76" stroke="#8bd5f5" stroke-width="2"/><text x="335" y="178" fill="#d9e7f7" font-size="14" text-anchor="middle">Cavities + runner silhouette seen along the clamp direction</text></svg><figcaption>Projected area is the silhouette at the parting plane. Use the approved mould layout to identify which part and runner areas belong in a real calculation.</figcaption></figure>',
  'shot-mass':'<figure class="pd-math-figure"><svg viewBox="0 0 680 170" role="img" aria-labelledby="pd-shot-title pd-shot-desc"><title id="pd-shot-title">Parts and runner make up a cold-runner shot</title><desc id="pd-shot-desc">Four parts at 13.2 grams each total 52.8 grams. Adding a 6.8 gram runner gives 59.6 grams per shot.</desc><rect x="34" y="34" width="470" height="54" rx="8" fill="#1c5673"/><text x="269" y="67" fill="#f4f8ff" text-anchor="middle" font-size="18" font-weight="700">4 parts × 13.2 g = 52.8 g</text><text x="518" y="68" fill="#e5edf7" font-size="22">+</text><rect x="550" y="34" width="92" height="54" rx="8" fill="#74542a"/><text x="596" y="67" fill="#fff1cb" text-anchor="middle" font-size="16" font-weight="700">6.8 g</text><text x="338" y="124" fill="#f4c86a" text-anchor="middle" font-size="20" font-weight="800">Total cold-runner shot = 59.6 g</text><text x="596" y="108" fill="#e5edf7" text-anchor="middle" font-size="12">runner</text></svg><figcaption>Count only cavities producing parts on that cycle. Include a runner when it is ejected; a hot-runner system needs its own accounting.</figcaption></figure>',
  'tolerance':'<figure class="pd-math-figure"><svg viewBox="0 0 680 170" role="img" aria-labelledby="pd-tol-title pd-tol-desc"><title id="pd-tol-title">Tolerance limits around a nominal dimension</title><desc id="pd-tol-desc">For 10.0 plus or minus 0.1 millimetres, the acceptable drawing interval runs from 9.9 to 10.1 millimetres, centered on 10.0.</desc><rect x="150" y="65" width="380" height="25" rx="12" fill="#1d654e"/><line x1="150" y1="48" x2="150" y2="108" stroke="#a9c7e6" stroke-width="3"/><line x1="340" y1="39" x2="340" y2="117" stroke="#f3cb68" stroke-width="4"/><line x1="530" y1="48" x2="530" y2="108" stroke="#a9c7e6" stroke-width="3"/><text x="150" y="136" fill="#e4edf8" text-anchor="middle" font-size="17">9.9 mm</text><text x="340" y="136" fill="#f3cb68" text-anchor="middle" font-size="17" font-weight="700">10.0 mm nominal</text><text x="530" y="136" fill="#e4edf8" text-anchor="middle" font-size="17">10.1 mm</text><text x="340" y="27" fill="#9ce0bf" text-anchor="middle" font-size="14">Drawing interval ±0.1 mm</text></svg><figcaption>The green span is the drawing tolerance interval. Inspection method and measurement uncertainty still matter near either limit.</figcaption></figure>',
  'clamp-force':'<figure class="pd-math-figure"><svg viewBox="0 0 680 180" role="img" aria-labelledby="pd-force-title pd-force-desc"><title id="pd-force-title">Pressure acting over projected area creates force</title><desc id="pd-force-desc">Distributed pressure arrows act on an outlined projected area. The simplified relationship is force equals pressure multiplied by area.</desc><defs><marker id="pd-force-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f2c14e"/></marker></defs><rect x="196" y="66" width="288" height="64" rx="8" fill="#1c5673" stroke="#8bd5f5" stroke-width="3"/><text x="340" y="105" fill="#f4f8ff" text-anchor="middle" font-size="19" font-weight="700">Projected area A</text><path d="M228 26 V58 M284 26 V58 M340 26 V58 M396 26 V58 M452 26 V58" stroke="#f2c14e" stroke-width="3" marker-end="url(#pd-force-arrow)"/><text x="340" y="20" fill="#f4e7b5" text-anchor="middle" font-size="14">Pressure p</text><text x="340" y="163" fill="#d9e7f7" text-anchor="middle" font-size="18">Simplified relation: F = p × A</text></svg><figcaption>This diagram explains the relationship only. A qualified engineering calculation is needed for real mould, material and machine conditions.</figcaption></figure>',
  'standard-deviation':'<figure class="pd-math-figure"><svg viewBox="0 0 680 170" role="img" aria-labelledby="pd-sd-title pd-sd-desc"><title id="pd-sd-title">Readings spread around their mean</title><desc id="pd-sd-desc">Three sample readings, 9, 10 and 11 grams, are shown around a mean of 10 grams. Their sample standard deviation is 1 gram.</desc><line x1="120" y1="93" x2="560" y2="93" stroke="#8ca6c3" stroke-width="3"/><line x1="340" y1="45" x2="340" y2="121" stroke="#f2c14e" stroke-width="4"/><circle cx="230" cy="93" r="16" fill="#57a6d8"/><circle cx="340" cy="93" r="16" fill="#f2c14e"/><circle cx="450" cy="93" r="16" fill="#57a6d8"/><text x="230" y="142" fill="#e5edf7" font-size="16" text-anchor="middle">9 g</text><text x="340" y="142" fill="#f2c14e" font-size="16" text-anchor="middle">mean 10 g</text><text x="450" y="142" fill="#e5edf7" font-size="16" text-anchor="middle">11 g</text><text x="340" y="27" fill="#d9e7f7" font-size="14" text-anchor="middle">Sample s = 1 g</text></svg><figcaption>Standard deviation describes spread around the mean. The three-point drawing is a small arithmetic example, not enough data for a real capability claim.</figcaption></figure>',
  'cooling-heat-load':'<figure class="pd-math-figure"><svg viewBox="0 0 680 150" role="img" aria-labelledby="pd-cool-title pd-cool-desc"><title id="pd-cool-title">Cooling water carries heat away</title><desc id="pd-cool-desc">Cool water enters a mould circuit, gains heat, and leaves warmer. Heat rate depends on mass flow, coolant heat capacity and temperature rise.</desc><defs><marker id="pd-cool-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8bd5f5"/></marker></defs><rect x="238" y="34" width="204" height="78" rx="12" fill="#1c3d58" stroke="#6a8fb0" stroke-width="2"/><path d="M55 74 H225 M455 74 H624" stroke="#8bd5f5" stroke-width="6" marker-end="url(#pd-cool-arrow)"/><text x="132" y="48" fill="#a9e2ff" text-anchor="middle" font-size="15">Cool inlet</text><text x="545" y="48" fill="#ffd28a" text-anchor="middle" font-size="15">Warmer return</text><text x="340" y="66" fill="#f4f8ff" text-anchor="middle" font-size="17" font-weight="700">Mould circuit</text><text x="340" y="92" fill="#c9d9eb" text-anchor="middle" font-size="14">ṁ × cp × ΔT</text><text x="340" y="139" fill="#d9e7f7" text-anchor="middle" font-size="13">Heat carried by the measured coolant stream</text></svg><figcaption>The estimate describes heat in the coolant stream. It does not measure the mould surface temperature or prove uniform cooling.</figcaption></figure>'
});
function getMathCourseProgress(){
  const learner=learnerId()||'__session__';
  if(learner!==mathCourseProgressOwner){
    mathCourseProgressOwner=learner;mathCourseCompleted=new Set();mathCourseSelections=Object.create(null);
    if(learner!=='__session__'){
      const ids=caseState('math-course-progress').completedLessonIds;
      if(Array.isArray(ids))ids.forEach(id=>{if(MATH_COURSE.some(lesson=>lesson.id===id))mathCourseCompleted.add(id)});
    }
  }
  return mathCourseCompleted
}
function completeMathLesson(id){
  const progress=getMathCourseProgress();progress.add(id);
  if(learnerId())saveCase('math-course-progress',{completedLessonIds:Array.from(progress),updatedAt:new Date().toISOString()});
}
function renderMathGuide(){
  mathIndex=0;mathSelected=null;activeId=null;answers=[];hadError=false;
  const host=ensureSection();if(!host)return;
  const progress=getMathCourseProgress();
  const groups=[...new Set(MATH_COURSE.map(lesson=>lesson.unit))];
  const sections=groups.map(group=>{
    const cards=MATH_COURSE.filter(lesson=>lesson.unit===group).map((lesson,index)=>{
      const done=progress.has(lesson.id);
      return '<article class="pdlab-card card"><div class="pd-meta"><span class="pd-chip">'+esc(lesson.level)+'</span><span class="pd-chip">'+(done?'✓ Passed':'Lesson '+(MATH_COURSE.indexOf(lesson)+1))+'</span></div><h3>'+esc(lesson.title)+'</h3><p>'+esc(lesson.goal)+'</p><button class="secondary" data-pd-math-lesson="'+esc(lesson.id)+'">'+(done?'Review lesson →':'Start lesson →')+'</button></article>';
    }).join('');
    return '<section class="card pdlab-section"><h3>'+esc(group)+'</h3><div class="pdlab-grid">'+cards+'</div></section>';
  }).join('');
  const formulas=MATH_FORMULAS.map(item=>'<article class="pdlab-card card"><h3>'+esc(item.title)+'</h3><p>'+esc(item.body)+'</p></article>').join('');
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div>'+
    '<div class="pd-hero card"><div class="eyebrow">A step-by-step course · beginner to advanced</div><h2>Injection moulding maths</h2><p>Learn the calculation skills used on the shop floor, starting with units and percentages. Each lesson explains the idea, shows every step in a worked example, and ends with a check question and explanation.</p><div class="pd-boundary"><b>Training boundary:</b> examples teach maths, not machine recipes. Real settings, mould sizing and acceptance decisions must follow approved machine, material, drawing, site and quality requirements.</div></div>'+
    '<div class="pd-stats"><div class="pd-stat card"><span>Lessons passed</span><b>'+progress.size+'/'+MATH_COURSE.length+'</b></div><div class="pd-stat card"><span>Course sections</span><b>'+groups.length+'</b></div><div class="pd-stat card"><span>Mixed review questions</span><b>'+MATH_DRILLS.length+'</b></div></div>'+
    '<div class="pd-toolbar"><div><h2 style="margin:0">Course path</h2><p class="muted" style="margin:4px 0 0">Go in order or choose any lesson. Passing a check records progress on this device when learner storage is available.</p></div></div>'+
    '<div class="pdlab-sections">'+sections+'</div>'+
    '<div class="pd-panel card"><h3>Mixed review</h3><p class="muted">Try the ungraded questions after studying the lessons. Hints and full worked answers appear as you go.</p><button class="primary" data-pd-math-start>Start mixed review →</button></div>'+
    '<details class="pd-panel card"><summary><b>Quick formula reference · '+MATH_FORMULAS.length+' formulas</b></summary><div class="pdlab-grid">'+formulas+'</div></details>';
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function renderMathLesson(id){
  const index=MATH_COURSE.findIndex(lesson=>lesson.id===id),lesson=MATH_COURSE[index];
  if(!lesson)return renderMathGuide();
  const progress=getMathCourseProgress(),selected=mathCourseSelections[id]??null,check=lesson.check;
  const choices=check.choices.map((choice,i)=>{
    const chosen=selected===i,style=chosen?(i===check.answer?' correct':' wrong'):'';
    return '<button class="pd-choice'+style+'" data-pd-math-check="'+i+'" data-pd-math-id="'+esc(id)+'" '+(selected===null?'':'disabled')+'>'+esc(choice)+'</button>';
  }).join('');
  let feedback='';
  if(selected!==null&&selected===check.answer)feedback='<div class="pd-feedback"><b>Correct. Here is the working:</b><br>'+esc(check.working)+'</div>';
  else if(selected!==null)feedback='<div class="pd-feedback bad"><b>Not quite. Use the hint and try again.</b><br>'+esc(check.hint)+'</div><button class="secondary" data-pd-math-check-retry="'+esc(id)+'">Try again</button>';
  const worked=lesson.example.map(step=>'<li>'+esc(step)+'</li>').join('');
  const previous=index>0?MATH_COURSE[index-1]:null,next=index+1<MATH_COURSE.length?MATH_COURSE[index+1]:null;
  const host=ensureSection();if(!host)return;
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-course>← Course path</button><span class="pd-chip">Lesson '+(index+1)+' of '+MATH_COURSE.length+'</span></div>'+
    '<div class="pd-hero card"><div class="eyebrow">'+esc(lesson.unit)+' · '+esc(lesson.level)+(progress.has(id)?' · ✓ check passed':'')+'</div><h2>'+esc(lesson.title)+'</h2><p>'+esc(lesson.goal)+'</p></div>'+
    '<div class="pd-panel card"><h3>Learn the idea</h3><p>'+esc(lesson.teach)+'</p><div class="pd-boundary"><b>Formula:</b> '+esc(lesson.formula)+'</div>'+(lesson.illustration&&MATH_ILLUSTRATIONS[lesson.illustration]?MATH_ILLUSTRATIONS[lesson.illustration]:'')+'</div>'+
    '<div class="pd-panel card"><h3>Worked example</h3><ol>'+worked+'</ol></div>'+
    '<div class="pd-panel card"><h3>Common mistake to avoid</h3><p>'+esc(lesson.watch)+'</p></div>'+
    '<div class="pd-panel card"><div class="pd-stage">Check your understanding</div><div class="pd-question">'+esc(check.question)+'</div><div class="pd-choices">'+choices+'</div>'+feedback+'</div>'+
    '<div class="pd-actions"><button class="ghost" data-pd-math-course>Course path</button>'+(previous?'<button class="secondary" data-pd-math-lesson="'+esc(previous.id)+'">← Previous lesson</button>':'')+(next?'<button class="primary" data-pd-math-lesson="'+esc(next.id)+'">Next lesson →</button>':'<button class="primary" data-pd-math-course>Finish course path →</button>')+'</div>';
  host.dataset.step=String(index);
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function startMathPractice(){mathIndex=0;mathSelected=null;renderMathDrill()}
function renderMathDrill(){
  const q=MATH_DRILLS[mathIndex];if(!q)return renderMathSummary();
  const host=ensureSection();if(!host)return;
  const choices=q.choices.map((choice,i)=>{
    const selected=mathSelected===i,style=selected?(i===q.answer?' correct':' wrong'):'';
    return '<button class="pd-choice'+style+'" data-pd-math-choice="'+i+'" '+(mathSelected===null?'':'disabled')+'>'+esc(choice)+'</button>';
  }).join('');
  let feedback='';
  if(mathSelected!==null&&mathSelected===q.answer)feedback='<div class="pd-feedback"><b>Correct. Here is the method:</b><br>'+esc(q.working)+'<div class="pd-actions"><button class="primary" data-pd-math-next>'+(mathIndex+1===MATH_DRILLS.length?'Finish practice':'Next problem →')+'</button></div></div>';
  else if(mathSelected!==null)feedback='<div class="pd-feedback bad"><b>Not quite. Try the hint and calculate it again.</b><br>'+esc(q.hint)+'</div><button class="secondary" data-pd-math-retry>Try again</button>';
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Maths course</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">'+esc(q.category)+'</span><span class="pd-chip">'+esc(q.level)+'</span></div><div class="pd-progress">'+MATH_DRILLS.map((_,i)=>'<span class="'+(i<mathIndex?'done':i===mathIndex?'current':'')+'"></span>').join('')+'</div><div class="pd-stage">Problem '+(mathIndex+1)+' of '+MATH_DRILLS.length+'</div><div class="pd-question">'+esc(q.question)+'</div><p class="tiny muted">Work it out before choosing. All values are for training.</p><div class="pd-choices">'+choices+'</div>'+feedback+'</div>';
  host.dataset.step=String(mathIndex);
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function renderMathSummary(){
  const host=ensureSection();if(!host)return;
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Maths course</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-summary card"><div class="eyebrow">Practice set complete · ungraded</div><strong>'+MATH_DRILLS.length+' problems completed</strong><h2>Injection moulding maths</h2><p class="muted">Review the course, retry the practice set, or return to the process-data cases. The clamp-force exercise is a simplified calculation, not a machine setting.</p><div class="pd-actions"><button class="primary" data-pd-math-start>Practise again</button><button class="secondary" data-pd-math-course>← Maths course</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div></div>';
  window.scrollTo?.({top:0,behavior:'smooth'});
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerId(){try{const id=window.db?.activeUser||window.user?.id||'';return id?String(id):null}catch(_){return null}}
function learnerScope(){
  const scope=window.MM_LEARNER_SCOPE;
  if(!scope||typeof scope.tokenFor!=='function'||typeof scope.storageKey!=='function'||typeof scope.migrateStoragePrefix!=='function')throw new Error('process-data-diagnostics.js requires MM_LEARNER_SCOPE');
  return scope
}
function storageKey(){
  const scope=learnerScope(),id=learnerId(),prefix=`${STORAGE_BASE}::`;
  if(!id)throw new Error('process-data-diagnostics.js requires an active learner before persistence');
  scope.registerStoragePrefix?.(prefix);scope.migrateStoragePrefix(prefix,id);
  return scope.storageKey(prefix,scope.tokenFor(id))
}
function readState(){try{const s=JSON.parse(localStorage.getItem(storageKey())||'{}');return s&&typeof s==='object'&&!Array.isArray(s)?s:{}}catch(_){return {}}}
function writeState(s){try{const k=storageKey(),payload=JSON.stringify(s);localStorage.setItem(k,payload);return localStorage.getItem(k)===payload}catch(_){return false}}
function caseState(id){return readState()[id]||{attempts:0,completed:false,bestScore:0}}
function saveCase(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};const saved=writeState(all);if(!saved)window.toast?.('Progress could not be saved on this device.');return saved}

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
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pdlab-sections{display:grid;gap:14px;margin-top:14px}.pdlab-section{padding:18px}.pdlab-section>h3{margin:6px 0}.pdlab-section>p{line-height:1.55}.pdlab-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.pdlab-real-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pdlab-card{padding:15px;display:flex;flex-direction:column;gap:8px;min-height:185px}.pdlab-card h3{margin:0}.pdlab-card p{color:var(--muted);font-size:12px;line-height:1.5;flex:1}.pdlab-card button{align-self:flex-start}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-math-figure{margin:8px 0 0;padding:12px;border:1px solid #2d4563;background:#0c1b2d;border-radius:12px}.pd-math-figure svg{display:block;width:100%;height:auto;max-height:230px}.pd-math-figure figcaption{margin-top:8px;color:#b8cbe0;font-size:12px;line-height:1.5}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.pd-grid,.pdlab-grid{grid-template-columns:1fr}.pd-loop{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.pd-stats{grid-template-columns:1fr}.pd-toolbar{align-items:stretch}.pd-toolbar button{width:100%}.pd-panel,.pdlab-section{padding:16px}.pdlab-card button{width:100%}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('processDataLabs');if(section)return section;
  section=document.createElement('section');section.id='processDataLabs';section.className='view hidden';
  (document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function setHeader(t,s){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(p)p.textContent=s}
function returnToPractice(){if(typeof switchView==='function')switchView('scenarios');if(typeof window.MM_PRIMARY_HUBS?.renderPracticeHub==='function')return window.MM_PRIMARY_HUBS.renderPracticeHub();if(typeof switchView==='function')return switchView('scenarios')}
function stats(){const state=readState();let done=0,attempted=0,total=0;for(const ds of DATASETS){const s=state[ds.id];if(s?.completed)done++;if(s?.attempts){attempted++;total+=Number(s.bestScore||0)}}return {done,attempted,avg:attempted?Math.round(total/attempted):0}}

function openHome(){
  ensureStyle();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');window.MM_APP_SHELL?.navigation?.setCustomActive?.('','practice');setHeader('Process data lab','Practise reading process evidence or analyse prepared site data.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})
}
function openMaths(){
  ensureStyle();hideOtherViews();const host=ensureSection();host.classList.remove('hidden');
  window.MM_APP_SHELL?.navigation?.setCustomActive?.('maths','maths');
  setHeader('Injection moulding maths','Learn step by step from basic units to process and quality calculations.');
  renderMathGuide();window.scrollTo?.({top:0,behavior:'smooth'})
}
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection();
  host.innerHTML=`<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div>
  <div class="pd-hero card"><div class="eyebrow">Practice · process evidence</div><h2>Start with a guided case</h2><p>Work through a synthetic example first. Use the advanced libraries when you want more cases, or choose local CSV analysis to work with prepared site data.</p><div class="pd-boundary"><b>Training boundary:</b> examples teach evidence reading. They do not set production limits or authorise machine changes. Local CSV preparation and analysis stay on this device.</div></div>
  <div class="pdlab-sections">
    <section class="card pdlab-section"><div class="eyebrow">Start here · synthetic training</div><h3>Guided diagnosis</h3><p>Choose from 14 cases. Each walks through baseline, fault and recovery evidence in four decisions.</p><button class="primary" data-pdlab-guided>Choose a guided case →</button><p class="tiny muted">The values are synthetic and are not machine units or universal limits.</p></section>
    <details class="pd-more-libraries"><summary>Explore more synthetic case libraries · 50 and 200 cases</summary><div class="pdlab-grid"><article class="pdlab-card card"><span class="pd-chip">50 additional cases</span><h3>Evidence deep dive</h3><p>Browse machine, tooling, material, scientific-moulding and quality/sensor datasets.</p><button class="secondary" data-pdlab-50>Browse 50 cases →</button></article><article class="pdlab-card card"><span class="pd-chip">20 passes · 200 cases</span><h3>Advanced evidence atlas</h3><p>Search a broad library of normalized, unitless signal patterns for advanced practice.</p><button class="secondary" data-pdlab-atlas>Browse the 200-case atlas →</button></article></div><p class="tiny muted">The atlas uses each case’s own normalized baseline. Its values are not machine units or universal limits.</p></details>
    <section class="card pdlab-section"><div class="eyebrow">Optional · local analysis</div><h3>Work with prepared site data</h3><p>The intake checks privacy preparation, signal meaning, role, units, sampling and shot sequence before data can be analysed.</p><div class="pdlab-grid pdlab-real-grid"><article class="pdlab-card card"><h3>Prepare a new CSV</h3><p>Review local privacy rules, define the channels and save the prepared dataset on this device.</p><button class="primary" data-pdlab-csv>Prepare a CSV →</button></article><article class="pdlab-card card"><h3>Analyse saved data</h3><p>Compare baseline drift, before/after windows, cavities, quality associations and energy per good part when the data support each view.</p><button class="secondary" data-pdlab-saved>Open saved datasets →</button></article></div><p class="tiny muted">Raw CSV is prepared in-session and is not uploaded. Prepared evidence is stored locally on this device.</p></section>
  </div>`
}
function renderGuidedHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection(),st=stats();
  host.innerHTML=`<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div><div class="pd-hero card"><div class="eyebrow">Process-data practice</div><h2>Guided Data Diagnosis</h2><p>Work through the same evidence pattern experienced process engineers use: establish a baseline, identify what changed, connect signals to a plausible mechanism, choose the next discriminating check, then use recovery evidence to challenge your conclusion.</p><div class="pd-loop"><span>1 Read pattern</span><span>2 Diagnose</span><span>3 Choose evidence</span><span>4 Interpret recovery</span></div><div class="pd-boundary"><b>Training boundary:</b> all values are deterministic synthetic training data. They illustrate signal relationships only and are not universal production setpoints, acceptance limits or substitutes for machine, mould, resin, site or legal requirements.</div></div>
  <div class="pd-stats"><div class="pd-stat card"><span>Cases completed</span><b>${st.done}/${DATASETS.length}</b></div><div class="pd-stat card"><span>Cases attempted</span><b>${st.attempted}</b></div><div class="pd-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div>
  <div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button><div><h2 style="margin:0">Choose a guided case</h2><p class="muted" style="margin:4px 0 0">Each case contains 72 cycles: 24 baseline, 24 fault and 24 recovery.</p></div></div>
  <div class="pd-grid" style="margin-top:12px">${DATASETS.map(cardHtml).join('')}</div>`
}
function cardHtml(ds){const s=caseState(ds.id);return `<article class="pd-card card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">${ds.rows.length} cycles</span><span class="pd-chip">${Object.keys(ds.signals).length} signals</span></div><h3>${esc(ds.title)}</h3><p>${esc(ds.fault)}</p><div class="pd-foot"><span class="${s.completed?'pd-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-pd-start="${esc(ds.id)}">${s.completed?'Practise again':'Start case'}</button></div></article>`}
function tableHtml(ds){return `<div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Signal</th><th>Baseline mean</th><th>Fault mean</th><th>Recovery mean</th><th>Fault Δ</th></tr></thead><tbody>${summary(ds).map(r=>`<tr><td>${esc(labelSignal(r.key))}</td><td>${format(r.values.baseline,r.key)}</td><td>${format(r.values.fault,r.key)}</td><td>${format(r.values.recovery,r.key)}</td><td class="${r.delta>=0?'pd-up':'pd-down'}">${r.delta>=0?'+':''}${format(r.delta,r.key)}</td></tr>`).join('')}</tbody></table></div>`}
function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}
function renderCase(stepIndex){
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return renderGuidedHome();const steps=buildSteps(ds),step=steps[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex),selected=answers[stepIndex],host=ensureSection();
  host.innerHTML=`<div class="pd-case"><div class="pd-toolbar"><button class="ghost" data-pd-home>← Case list</button><button class="ghost" data-pd-practice>← Practice</button></div><div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">${esc(ds.kind)}</span><span class="pd-chip">synthetic training data</span></div><h2 style="margin:8px 0">${esc(ds.title)}</h2><p class="muted">${esc(ds.fault)}</p><div class="pd-progress">${steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div>
  <div class="pd-panel card"><h3>Evidence board</h3><p class="muted">Compare phase means first. Use the CSV only if you want to inspect the individual 72 cycles.</p>${tableHtml(ds)}<div class="pd-actions" style="margin-top:12px"><button class="ghost" data-pd-csv>Export 72-cycle CSV</button></div></div>
  <div class="pd-panel card"><div class="pd-stage">${esc(step.stage)} · ${stepIndex+1}/4</div><div class="pd-question">${esc(step.question)}</div><div class="pd-choices">${choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(choices[selected],step)}${selected===null?'':`<div class="pd-actions" style="margin-top:12px">${stepIndex<3?'<button class="primary" data-pd-next>Next step</button>':'<button class="primary" data-pd-finish>Finish case</button>'}<button class="ghost" data-pd-retry>Try this question again</button></div>`}</div>
  <div class="pd-panel card"><h3>Evidence sources</h3><div class="pd-source-list">${sourceNames(ds).map(x=>`<div>${esc(x)}</div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">These sources support the mechanism and study method. They do not make the synthetic values production specifications.</p></div></div>`;host.dataset.step=String(stepIndex)
}
function choiceHtml(c,i,selected){const chosen=selected===i,cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="pd-choice${cls}" data-pd-choice="${i}" ${selected===null?'':'disabled'}>${esc(c.text)}</button>`}
function feedbackHtml(choice,step){return `<div class="pd-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good evidence use':'Re-check the pattern'}</b><br>${esc(choice.correct?step.feedback:'Choose the answer that is most directly supported by the linked signals and preserves a controlled diagnostic sequence.')}</div>`}
function exportCsv(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const blob=new Blob([PACK.toCsv(ds.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-${ds.id}-synthetic-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function finishCase(){const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const steps=buildSteps(ds);let correct=0;for(let i=0;i<steps.length;i++){const choices=deterministicChoices(steps[i],ds.id,i);if(choices[answers[i]]?.correct)correct++}const score=Math.round(correct/steps.length*100),prior=caseState(ds.id),saved=saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();host.innerHTML=`<div class="pd-summary card"><div class="eyebrow">Data case complete${saved?'':' · progress not saved'}</div><strong>${score}% · ${correct}/4 decisions</strong><h2>${esc(ds.title)}</h2><p class="muted">${score===100?'You used the baseline, fault and recovery evidence as one reasoning chain.':'Review the missed step and try again. The goal is to explain why a signal pattern supports one mechanism more strongly than another.'}</p><div class="pd-actions"><button class="primary" data-pd-home>Choose another dataset</button><button class="secondary" data-pd-restart>Practise this case again</button><button class="ghost" data-pd-practice>← Practice</button></div></div>`}
function openLocalIntake(){const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(typeof api?.open==='function')return api.open();window.toast?.('Local CSV analysis is still loading. Try again in a moment.')}
function openSavedData(){const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(typeof api?.openLibrary==='function')return api.openLibrary();window.toast?.('Saved process datasets are still loading. Try again in a moment.')}
function handleClick(e){
  const t=e.target.closest('[data-pdlab-math-open],[data-pdlab-home],[data-pd-math-course],[data-pd-math-guide],[data-pd-math-lesson],[data-pd-math-check],[data-pd-math-check-retry],[data-pd-math-start],[data-pd-math-choice],[data-pd-math-retry],[data-pd-math-next],[data-pdlab-guided],[data-pdlab-50],[data-pdlab-atlas],[data-pdlab-csv],[data-pdlab-saved],[data-pd-start],[data-pd-home],[data-pd-practice],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.hasAttribute('data-pdlab-math-open')||t.hasAttribute('data-pd-math-guide')||t.hasAttribute('data-pd-math-course'))return renderMathGuide();
  if(t.dataset.pdMathLesson)return renderMathLesson(t.dataset.pdMathLesson);
  if(t.dataset.pdMathCheck!==undefined){
    const id=t.dataset.pdMathId,lesson=MATH_COURSE.find(item=>item.id===id),choice=Number(t.dataset.pdMathCheck);
    if(!lesson||mathCourseSelections[id]!==undefined||!Number.isInteger(choice)||choice<0||choice>=lesson.check.choices.length)return;
    mathCourseSelections[id]=choice;
    if(choice===lesson.check.answer)completeMathLesson(id);
    return renderMathLesson(id);
  }
  if(t.dataset.pdMathCheckRetry!==undefined){delete mathCourseSelections[t.dataset.pdMathCheckRetry];return renderMathLesson(t.dataset.pdMathCheckRetry)}
  if(t.hasAttribute('data-pdlab-home'))return openHome();
  if(t.hasAttribute('data-pd-math-start'))return startMathPractice();
  if(t.dataset.pdMathChoice!==undefined){const i=Number(t.dataset.pdMathChoice);if(mathSelected===null&&Number.isInteger(i)&&i>=0&&i<MATH_DRILLS[mathIndex].choices.length){mathSelected=i;return renderMathDrill()}return}
  if(t.hasAttribute('data-pd-math-retry')){mathSelected=null;return renderMathDrill()}
  if(t.hasAttribute('data-pd-math-next')){if(mathSelected!==MATH_DRILLS[mathIndex].answer)return;mathIndex++;mathSelected=null;return mathIndex<MATH_DRILLS.length?renderMathDrill():renderMathSummary()}
  if(t.hasAttribute('data-pdlab-guided'))return renderGuidedHome();
  if(t.hasAttribute('data-pdlab-50')){const api=window.MM_PROCESS_DATA_DEEP_DIVE_50;if(typeof api?.open==='function')return api.open();return window.toast?.('The 50-case library is still loading.')}
  if(t.hasAttribute('data-pdlab-atlas')){const api=window.MM_PROCESS_DATA_20_PASS_ATLAS;if(typeof api?.open==='function')return api.open();return window.toast?.('The evidence atlas is still loading.')}
  if(t.hasAttribute('data-pdlab-csv'))return openLocalIntake();
  if(t.hasAttribute('data-pdlab-saved'))return openSavedData();
  if(t.dataset.pdStart)return openCase(t.dataset.pdStart);
  if(t.hasAttribute('data-pd-home'))return renderGuidedHome();
  if(t.hasAttribute('data-pd-practice'))return returnToPractice();
  if(t.hasAttribute('data-pd-restart'))return openCase(activeId);
  if(t.hasAttribute('data-pd-csv'))return exportCsv();
  const ds=DATASETS.find(x=>x.id===activeId);if(!ds)return;const stepIndex=Number(ensureSection().dataset.step||0),step=buildSteps(ds)[stepIndex],choices=deterministicChoices(step,ds.id,stepIndex);
  if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-retry')){answers[stepIndex]=null;return renderCase(stepIndex)}
  if(t.hasAttribute('data-pd-next'))return renderCase(Math.min(stepIndex+1,3));if(t.hasAttribute('data-pd-finish'))return finishCase()
}
function install(){ensureStyle();const host=ensureSection();if(host&&!host.__mmPdClick){host.addEventListener('click',handleClick);host.__mmPdClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,openMaths,openGuidedCases:renderGuidedHome,evaluateChoice,storage:'MM_LEARNER_SCOPE 128-bit collision-safe learner progress',storagePrefix:`${STORAGE_BASE}::`,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};
window.MM_APP_SHELL?.navigation?.register?.({
  id:'maths',label:'Maths',icon:'∑',description:'Learn and practise injection moulding calculations.',
  order:35,group:'practice',mobileGroup:'maths',mobilePrimary:true,mobileMore:false,
  action:openMaths
});
})();
/* <<< process-data-diagnostics.js */

/* >>> real-measured-data-assessment.js */
/* MouldMaster real measured-data assessment — 2026.10.05.1 */
(function(){
'use strict';
const VERSION='2026.10.05.1',STORAGE='mm_real_measured_assessment_v1',STORAGE_PREFIX='mm_real_measured_assessment_v1::';
const CASES=[
 {id:'avaps-delivered-traces',title:'AVAPS: count what the delivered traces actually contain',source:'scatimdata-avaps',contractPath:'data/public-benchmark-results/scatimdata-avaps-v1.json',contractBlob:'7692f3f029cd4ab1227db1f39e0376023c0eebbf',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Linked labelled cycles',3328],['Delivered points per signal per linked cycle',2048],['Accepted pressure + flow values',13631488],['Paper-reported points per signal',2049]],boundary:'Accepted counts use the 2,048 values actually delivered per signal per linked cycle. The dataset does not establish universal settings, causal defect mechanisms or a production process window.',questions:[
  ['Which point count should MouldMaster use when counting the delivered pressure/flow traces?',['2,048 delivered values per signal','2,049 values reported by the paper','2,048.5 as an averaged trace count','2,049 values after reconstructing a point'],0,'Use the delivered file structure. The contract explicitly refuses to fabricate the paper-reported extra point.'],
  ['What is the accepted real measured time-series total for this profiled family?',['13,631,488 accepted pressure/flow values','3,328 values from the linked-cycle count alone','6,815,744 values after counting one signal only','13,638,144 values after reconstructing missing points'],0,'The three accepted archive totals sum to 13,631,488 pressure and flow values.'],
  ['What conclusion is justified by this evidence profile?',['The waveforms support bounded analysis, not a universal window or root cause','The waveforms establish a universal injection-pressure recipe for similar machines','Observed pressure/flow correlations establish causal defect mechanisms','The paper-reported sample count overrides the delivered archive structure'],0,'Real measured data strengthen evidence context, but the source contract keeps causality and universal-setting claims out of scope.']
 ]},
 {id:'openmms-time-samples',title:'OpenMMS-T4G: distinguish time samples from moulding cycles',source:'openmms-t4g',contractPath:'data/public-benchmark-results/openmms-t4g-v1.json',contractBlob:'b1ae42ff8af7926e08bf5aabc1d6b3a99afc4208',license:'BSD-3-Clause',evidenceType:'real-measured',facts:[['Rows/time samples',29808],['Measured signal columns',10],['Accepted measured values',298080],['Paper-reported case-study cycles',110]],boundary:'The 29,808 rows are time samples across two recorded module time bases, not 29,808 moulding cycles. The extraction fault was simulated in one experimental campaign and is not a universal machine-health diagnosis.',questions:[
  ['How should the 29,808 delivered rows be interpreted?',['As time samples across the recorded module time bases','As moulding cycles counted directly from each delivered row','As rejected parts counted directly from each delivered row','As machine recipes recorded once for each delivered row'],0,'The source contract distinguishes time samples from the paper-reported 110 case-study cycles.'],
  ['Why is the accepted measured-value total 298,080?',['29,808 rows × 10 accepted measured-signal columns','110 case-study cycles × 2,710 inferred signal values','29,808 rows + 268,272 reconstructed signal values','29,808 rows × all 12 structural and measured columns'],0,'Ten source-defined measured signal columns are accepted; time bases/other structural columns are not inflated into the measured total.'],
  ['What does the simulated extraction fault allow you to claim?',['It supports condition-monitoring learning within that experiment','It proves future extraction-force changes share that root cause','It establishes production alarm limits transferable to all moulds','It removes the need to inspect the real machine after an alarm'],0,'The fault context is real experimental evidence but remains bounded to the campaign and its instrumentation.']
 ]},
 {id:'cross-process-lower-contract',title:'Cross-process lower workpiece: separate commands from measured actuals',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json',contractBlob:'94bea551aa3e4755c435b663d2553b53bcc0c6c2',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted files',4989],['Accepted rows',2475581],['Accepted actual channels per row',3],['Accepted measured values',7426743],['Sampling interval',0.03]],boundary:'Pressure target is a command and is excluded. Accepted lower-workpiece actuals are pressure actual (bar), screw volume actual (cm³) and injection flow actual (cm³/s). Lower semantics must not be copied to the upper workpiece by analogy.',questions:[
  ['Which lower-workpiece channels count as measured process values?',['Pressure actual, screw-volume actual and injection-flow actual','Pressure target, pressure actual and the recorded time base','Pressure target together with all three delivered actual channels','Recorded time, pressure target and screw-volume actual only'],0,'The source contract accepts exactly three actual channels and excludes the pressure target command.'],
  ['What is the source-defined lower sampling interval?',['0.03 s from the lower-workpiece contract','0.01 s inferred by borrowing the upper-file timing','1 ms inferred from typical injection-waveform acquisition','No interval because the lower files lack timing metadata'],0,'All 4,989 accepted lower TXT files resolve to the explicit 0.03 s interval in this contract.'],
  ['Why must the lower pressure unit not be copied to the upper dataset?',['The lower unit does not establish the upper pressure-channel unit','A shared archive establishes one pressure unit for both workpieces','Matching pressure-column names establish matching engineering units','Upper state-code timing establishes the missing pressure unit'],0,'A source-defined lower unit is not authoritative metadata for a separate upper schema.']
 ]},
 {id:'cross-process-upper-boundary',title:'Cross-process upper workpiece: fail closed on unresolved semantics',source:'cross-process-chain-17240390',contractPath:'data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json',contractBlob:'a3e23a0ecd5711158c3937f47a031212e7d1de8d',license:'CC BY 4.0',evidenceType:'real-measured',facts:[['Accepted cycle CSVs',10697],['Accepted rows',21907374],['Accepted measured channels per row',2],['Accepted measured values',43814748],['Pressure actual values excluded pending unit',21907374],['State values excluded pending semantics',21907374]],boundary:'Only melt volume (cm³) and volumetric injection velocity (cm³/s) are accepted as measured upper channels. Upper pressure actual remains excluded until its engineering unit is authoritative; state codes 0/1/2/4/8 remain uninterpreted until their semantics are authoritative.',questions:[
  ['Which upper-workpiece channels currently count as accepted measured values?',['Melt volume and injection velocity','Pressure actual and injection velocity','Pressure target and pressure actual','State code and pressure actual'],0,'The current contract accepts only the two source-defined channels with authoritative semantics/units.'],
  ['How should the 21,907,374 upper pressure-actual values be treated today?',['Exclude them until the authoritative engineering unit is established','Treat them as bar because the lower workpiece records pressure in bar','Convert them to MPa using the lower-workpiece unit relationship','Count them as valid unitless pressure measurements in the total'],0,'Structurally valid numbers are not enough: the engineering unit is part of the measurement meaning.'],
  ['What is the correct treatment of state codes 0, 1, 2, 4 and 8?',['Preserve the codes without assigning unverified phase names','Map the codes to injection, pack and cooling from their timing','Discard the codes because unresolved semantics make them unusable','Name the most frequent code as the production phase by default'],0,'The project deliberately preserves unresolved codes without inventing process-state semantics.']
 ]}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function learnerId(){try{const id=window.db?.activeUser||window.user?.id||'';return id?String(id):null}catch(_){return null}}
function key(){
 const scope=window.MM_LEARNER_SCOPE,id=learnerId();
 if(!id||!scope||typeof scope.tokenFor!=='function'||typeof scope.storageKey!=='function')return null;
 try{scope.registerStoragePrefix?.(STORAGE_PREFIX);scope.migrateStoragePrefix?.(STORAGE_PREFIX,id);return scope.storageKey(STORAGE_PREFIX,scope.tokenFor(id))}catch(_){return null}
}
function state(){try{const k=key();return k?JSON.parse(localStorage.getItem(k)||'{}'):{} }catch(_){return{}}}
function save(x){try{const k=key();if(!k)return false;const payload=JSON.stringify(x);localStorage.setItem(k,payload);return localStorage.getItem(k)===payload}catch(_){return false}}
function shuffled(q,caseId,qi){const rows=q[1].map((text,i)=>({text,correct:i===q[2]})),caseIndex=Math.max(0,CASES.findIndex(c=>c.id===caseId)),target=(caseIndex*3+qi)%4,keyIndex=rows.findIndex(x=>x.correct);if(keyIndex>=0&&keyIndex!==target){const [keyed]=rows.splice(keyIndex,1);rows.splice(target,0,keyed)}return rows}
let active=null,answers=[];
function style(){if(document.getElementById('mm-real-measured-style'))return;const s=document.createElement('style');s.id='mm-real-measured-style';s.textContent=`#realMeasuredAssessment{display:grid;gap:14px}.rma-hero,.rma-panel,.rma-card{padding:18px}.rma-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.rma-meta{display:flex;gap:6px;flex-wrap:wrap}.rma-chip{font-size:10px;padding:4px 7px;border:1px solid #47627f;border-radius:999px;color:#c6d8eb}.rma-boundary{padding:11px;border-left:3px solid #d4b25b;background:#272316;color:#eddfaa;font-size:12px;line-height:1.5}.rma-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}.rma-fact{padding:9px;border:1px solid #2f4966;border-radius:9px;background:#0e1e31}.rma-fact small{display:block;color:#97adc5}.rma-fact b{font-size:16px}.rma-choices{display:grid;gap:8px}.rma-choice{padding:11px;text-align:left;border:1px solid #35516f;border-radius:10px;background:#102239;color:#eef6ff}.rma-choice.correct{border-color:#44856e;background:#123128}.rma-choice.wrong{border-color:#824a54;background:#321b22}.rma-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between}.rma-source{font-size:11px;color:#9fb7cf;overflow-wrap:anywhere}@media(max-width:760px){.rma-grid,.rma-facts{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function section(){let h=document.getElementById('realMeasuredAssessment');if(h)return h;h=document.createElement('section');h.id='realMeasuredAssessment';h.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(h);return h}
function nav(){const n=document.getElementById('nav');if(!n||n.querySelector('[data-mm-real-measured]'))return;const b=document.createElement('button');b.type='button';b.dataset.mmRealMeasured='1';b.innerHTML='▥ <span>Measured data</span>';const a=n.querySelector('[data-mm-process-data]')||n.querySelector('[data-mm-diagnostic-labs]');a?a.insertAdjacentElement('afterend',b):n.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();home()})}
function patchMobileMore(){
 if(window.__MM_REAL_MEASURED_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
 const base=window.openMobileMenu;
 window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{
  const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-real-measured-menu]'))return;
  const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmRealMeasuredMenu='1';
  b.innerHTML='<span class="icon">▥</span><b>Measured-data challenges</b><small>Practise evidence boundaries using real measured dataset contracts.</small>';
  b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}home()});grid.appendChild(b)
 });return r};
 window.__MM_REAL_MEASURED_MORE_PATCH__=true
}
function hide(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-real-measured]')?.classList.add('active')}
function header(a,b){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=a;if(p)p.textContent=b}
function home(){style();nav();hide();active=null;answers=[];const h=section();h.classList.remove('hidden');header('Measured data','Practise evidence boundaries using committed aggregate contracts from real injection-moulding datasets.');const st=state();h.innerHTML=`<div class="rma-hero card"><div class="eyebrow">Real measured evidence</div><h2>Measured-Data Evidence Challenges</h2><p class="muted">These questions use audited aggregate metadata from real public measured datasets. No third-party raw rows are embedded here. The objective is to interpret what the data contract establishes—and what it deliberately does not establish.</p><div class="rma-boundary"><b>Boundary:</b> real measured does not mean universal. Units, signal roles, time bases, licensing, experiment design and unresolved semantics remain part of the evidence.</div></div><div class="rma-grid">${CASES.map(c=>`<article class="rma-card card"><div class="rma-meta"><span class="rma-chip">real-measured</span><span class="rma-chip">${esc(c.license)}</span><span class="rma-chip">3 decisions</span></div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.boundary)}</p><div class="rma-actions"><span class="tiny muted">${st[c.id]?.best!==undefined?`Best ${st[c.id].best}%`:'Not attempted'}</span><button class="secondary" data-rma-start="${c.id}">Start</button></div></article>`).join('')}</div>`;window.scrollTo?.({top:0,behavior:'smooth'})}
function render(qi){const c=CASES.find(x=>x.id===active);if(!c)return home();const q=c.questions[qi],choices=shuffled(q,c.id,qi),sel=answers[qi],h=section();h.innerHTML=`<div class="rma-actions"><button class="ghost" data-rma-home>← All measured-data cases</button><span class="rma-chip">Decision ${qi+1}/3</span></div><div class="rma-panel card"><div class="rma-meta"><span class="rma-chip">${esc(c.evidenceType)}</span><span class="rma-chip">${esc(c.license)}</span></div><h2>${esc(c.title)}</h2><div class="rma-facts">${c.facts.map(([k,v])=>`<div class="rma-fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div><div class="rma-boundary">${esc(c.boundary)}</div><p class="rma-source">Contract: ${esc(c.contractPath)} · pinned blob ${esc(c.contractBlob)}</p></div><div class="rma-panel card"><div class="eyebrow">Question ${qi+1}</div><h3>${esc(q[0])}</h3><div class="rma-choices">${choices.map((x,i)=>`<button class="rma-choice${sel===i?(x.correct?' correct':' wrong'):''}" data-rma-choice="${i}" ${sel==null?'':'disabled'}>${esc(x.text)}</button>`).join('')}</div>${sel==null?'':`<div class="${choices[sel].correct?'pd-feedback':'pd-feedback bad'}" style="margin-top:12px" data-rma-feedback tabindex="-1" role="status" aria-live="polite"><b>${choices[sel].correct?'Correct evidence boundary':'Re-check the contract'}</b><br>${esc(choices[sel].correct?q[3]:'Use only the units, roles, counts and semantics that the audited source contract actually establishes.')}</div><div class="rma-actions" style="margin-top:12px"><button class="ghost" data-rma-retry>Try again</button>${qi<2?'<button class="primary" data-rma-next>Next</button>':'<button class="primary" data-rma-finish>Finish</button>'}</div>`}</div>`;h.dataset.qi=String(qi);requestAnimationFrame(()=>{const target=sel==null?h.querySelector('.rma-choice:not([disabled])'):h.querySelector('[data-rma-feedback]');target?.focus?.()})}
function start(id){active=id;answers=[null,null,null];render(0)}
function finish(){const c=CASES.find(x=>x.id===active);let n=0;c.questions.forEach((q,i)=>{const rows=shuffled(q,c.id,i);if(rows[answers[i]]?.correct)n++});const score=Math.round(n/3*100),s=state();s[c.id]={best:Math.max(Number(s[c.id]?.best||0),score),last:score};const saved=save(s);if(!saved)window.toast?.('Progress could not be saved on this device.');const h=section();h.innerHTML=`<div class="rma-panel card"><div class="eyebrow">Measured-data case complete${saved?'':' · progress not saved'}</div><h2>${score}% · ${n}/3</h2><p class="muted">${score===100?'You kept measured values, commands, units, time bases and unresolved semantics inside their audited boundaries.':'Review the contract boundary and repeat the case. The goal is to distinguish what is measured from what is merely named, commanded, inferred or unresolved.'}</p><div class="rma-actions"><button class="primary" data-rma-home>Choose another case</button><button class="secondary" data-rma-start="${c.id}">Practise again</button></div></div>`}
function click(e){const t=e.target.closest('[data-rma-start],[data-rma-home],[data-rma-choice],[data-rma-retry],[data-rma-next],[data-rma-finish]');if(!t)return;if(t.dataset.rmaStart)return start(t.dataset.rmaStart);if(t.hasAttribute('data-rma-home'))return home();const qi=Number(section().dataset.qi||0),c=CASES.find(x=>x.id===active),q=c?.questions[qi];if(!q)return;if(t.dataset.rmaChoice!==undefined){answers[qi]=Number(t.dataset.rmaChoice);return render(qi)}if(t.hasAttribute('data-rma-retry')){answers[qi]=null;return render(qi)}if(t.hasAttribute('data-rma-next'))return render(Math.min(2,qi+1));if(t.hasAttribute('data-rma-finish'))return finish()}
function install(){style();nav();patchMobileMore();const h=section();if(h&&!h.__rma){h.addEventListener('click',click);h.__rma=true}}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();new MutationObserver(install).observe(document.documentElement,{subtree:true,childList:true})}
window.MM_REAL_MEASURED_ASSESSMENT={version:VERSION,evidenceType:'real-measured',decisionCount:CASES.reduce((n,c)=>n+c.questions.length,0),storagePrefix:STORAGE_PREFIX,cases:CASES.map(c=>({...c,facts:c.facts.map(x=>[...x]),questions:c.questions.map(q=>[q[0],[...q[1]],q[2],q[3]])})),open:home,scope:'Twelve learner decisions based on audited aggregate contracts from real measured datasets. Learner progress uses MM_LEARNER_SCOPE collision-safe storage. No raw third-party rows, universal production settings or inferred unresolved semantics.'};
})();
/* <<< real-measured-data-assessment.js */
