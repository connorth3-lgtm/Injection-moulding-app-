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
/* MouldMaster guided process-data diagnostics — 2026.11.08.1 */
(function(){
'use strict';

const VERSION='2026.11.13.2';
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
const MATH_FORMULAS=Object.freeze([
  {title:'Units and conversions',body:'Mass: 1 kg = 1,000 g. Time: 1 min = 60 s. Area: 1 cm² = 100 mm². Keep units written beside every number.'},
  {title:'Shot mass',body:'Cold runner: total shot mass = (part mass per cavity × cavities filled) + ejected runner mass. Example: 4 × 13.2 g + 6.8 g = 59.6 g. Account for hot-runner systems separately.'},
  {title:'Blend percentages',body:'For a percentage of the final blend: additive mass = total blend mass × percentage ÷ 100. Example: 8 kg × 2.5% = 0.2 kg additive. Parts per hundred resin (phr) uses resin mass as its base instead.'},
  {title:'Cycle and theoretical output',body:'Cycles/hour = 3,600 ÷ cycle seconds. Theoretical parts/hour = cycles/hour × active cavities. Example: 30 s and 4 cavities = 480 parts/hour before stops, rejects or incomplete fills.'},
  {title:'Actual good output',body:'Average good output = accepted good parts ÷ elapsed time. State whether elapsed time includes stops. Use the same time basis when comparing runs.'},
  {title:'Reject rate and yield',body:'Reject rate (%) = rejects ÷ total produced × 100. First-pass yield (%) = accepted good parts ÷ total produced × 100. Keep rework separate until accepted.'},
  {title:'Mean, range and percentage change',body:'Mean = sum of readings ÷ count. Range = highest − lowest. Percentage change = (new − baseline) ÷ baseline × 100. Separate cavity data and keep the measurement method consistent.'},
  {title:'Linear shrinkage estimate',body:'For one measured direction: shrinkage (%) = (mould dimension − conditioned part dimension) ÷ mould dimension × 100. Use matching units, axis and a defined conditioning/measurement method.'},
  {title:'Clamp-force estimate',body:'Simplified force (kN) = projected area (mm²) × cavity pressure (MPa) ÷ 1,000, because 1 MPa = 1 N/mm². Tonne-force ≈ kN ÷ 9.80665. This teaches the relationship only; it is not a production setting or machine-sizing approval.'},
  {title:'Measurement before adjustment',body:'Check instrument resolution, fixture, method, part location, operator repeatability and conditioning time. Preserve raw values and cavity identity; verify the signal before changing a stable process.'}
]);
let mathIndex=0,mathSelected=null;
function renderMathGuide(){
  mathIndex=0;mathSelected=null;activeId=null;answers=[];hadError=false;
  const host=ensureSection();if(!host)return;
  const cards=MATH_FORMULAS.map(item=>'<article class="pdlab-card card"><h3>'+esc(item.title)+'</h3><p>'+esc(item.body)+'</p></article>').join('');
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-hero card"><div class="eyebrow">Learn, then practise · injection moulding numeracy</div><h2>Maths and shop-floor skills</h2><p>Work through the formulas, then answer short questions and see the worked method. Start with units and production basics, then move to quality and process-engineering estimates.</p><div class="pd-boundary"><b>Training boundary:</b> examples use simple training values. They do not prescribe process settings. Machine, mould, resin, site and quality requirements must come from approved, grade-specific documents and qualified procedures.</div></div>'+
    '<div class="pd-toolbar"><div><h2>Key formulas</h2><p class="muted">Check the units and assumptions before using a formula.</p></div></div>'+
    '<div class="pdlab-grid">'+cards+'</div>'+
    '<div class="pd-panel card"><h3>Try 13 short problems</h3><p class="muted">Ungraded practice with hints and worked answers. Your answers are not added to formal assessments or learner scores.</p><button class="primary" data-pd-math-start>Start the practice set →</button></div>';
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
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Formula guide</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-panel card"><div class="pd-meta"><span class="pd-chip">'+esc(q.category)+'</span><span class="pd-chip">'+esc(q.level)+'</span></div><div class="pd-progress">'+MATH_DRILLS.map((_,i)=>'<span class="'+(i<mathIndex?'done':i===mathIndex?'current':'')+'"></span>').join('')+'</div><div class="pd-stage">Problem '+(mathIndex+1)+' of '+MATH_DRILLS.length+'</div><div class="pd-question">'+esc(q.question)+'</div><p class="tiny muted">Work it out before choosing. All values are for training.</p><div class="pd-choices">'+choices+'</div>'+feedback+'</div>';
  host.dataset.step=String(mathIndex);
  window.scrollTo?.({top:0,behavior:'smooth'});
}
function renderMathSummary(){
  const host=ensureSection();if(!host)return;
  host.innerHTML='<div class="pd-toolbar"><button class="ghost" data-pd-math-guide>← Formula guide</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div>'+
    '<div class="pd-summary card"><div class="eyebrow">Practice set complete · ungraded</div><strong>'+MATH_DRILLS.length+' problems completed</strong><h2>Injection moulding maths</h2><p class="muted">Review any formula, retry the practice set, or return to the process-data cases. The clamp-force exercise is a simplified calculation, not a machine setting.</p><div class="pd-actions"><button class="primary" data-pd-math-start>Practise again</button><button class="ghost" data-pdlab-home>← Process Data Lab</button></div></div>';
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
#processDataLabs{--pd-line:#304b69;--pd-soft:#0f1f34}.pd-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(104,167,255,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.pd-hero h2{font-size:30px;margin:7px 0 9px}.pd-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.pd-boundary{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px;margin-top:12px}.pd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pd-stat{padding:14px}.pd-stat b{display:block;font-size:24px;margin-top:4px}.pd-stat span{font-size:11px;color:var(--muted)}.pd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pd-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.pd-card h3{margin:7px 0}.pd-card p{font-size:13px;color:var(--muted);line-height:1.5;flex:1}.pdlab-sections{display:grid;gap:14px;margin-top:14px}.pdlab-section{padding:18px}.pdlab-section>h3{margin:6px 0}.pdlab-section>p{line-height:1.55}.pdlab-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}.pdlab-real-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pdlab-card{padding:15px;display:flex;flex-direction:column;gap:8px;min-height:185px}.pdlab-card h3{margin:0}.pdlab-card p{color:var(--muted);font-size:12px;line-height:1.5;flex:1}.pdlab-card button{align-self:flex-start}.pd-meta{display:flex;gap:6px;flex-wrap:wrap}.pd-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.pd-foot,.pd-toolbar,.pd-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.pd-done{color:var(--good);font-size:12px;font-weight:800}.pd-case{display:grid;gap:14px}.pd-panel{padding:20px}.pd-panel h2,.pd-panel h3{margin-top:0}.pd-table-wrap{overflow:auto;border:1px solid #2d4563;border-radius:11px}.pd-table{width:100%;border-collapse:collapse;min-width:640px}.pd-table th,.pd-table td{padding:10px 11px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.pd-table th:first-child,.pd-table td:first-child{text-align:left}.pd-table th{color:#9db5cf;background:#0d1b2e;position:sticky;top:0}.pd-up{color:#ffd166}.pd-down{color:#7ce6a3}.pd-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-progress span{height:7px;border-radius:99px;background:#253951}.pd-progress .done{background:var(--accent)}.pd-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.pd-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.pd-question{font-size:19px;font-weight:800;margin:8px 0 12px}.pd-choices{display:grid;gap:8px}.pd-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.pd-choice:hover{background:#17304b}.pd-choice[disabled]{cursor:default;opacity:.9}.pd-choice.correct{border-color:#4a8a75;background:#123229}.pd-choice.wrong{border-color:#7c4651;background:#321a22}.pd-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.pd-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.pd-source-list{display:grid;gap:6px;margin-top:9px}.pd-source-list div{font-size:12px;color:#b8cbe0;padding:8px 10px;background:#0e1d31;border-radius:8px}.pd-summary{padding:20px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.pd-summary strong{font-size:22px}.pd-loop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.pd-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
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
function renderHome(){
  activeId=null;answers=[];hadError=false;const host=ensureSection();
  host.innerHTML=`<div class="pd-toolbar"><button class="ghost" data-pd-practice>← Practice</button></div>
  <div class="pd-hero card"><div class="eyebrow">Practice · process evidence</div><h2>Start with a guided case</h2><p>Work through a synthetic example first. Use the advanced libraries when you want more cases, or choose local CSV analysis to work with prepared site data.</p><div class="pd-boundary"><b>Training boundary:</b> examples teach evidence reading. They do not set production limits or authorise machine changes. Local CSV preparation and analysis stay on this device.</div></div>
  <div class="pdlab-sections">
    <section class="card pdlab-section"><div class="eyebrow">Start here · synthetic training</div><h3>Guided diagnosis</h3><p>Choose from 14 cases. Each walks through baseline, fault and recovery evidence in four decisions.</p><button class="primary" data-pdlab-guided>Choose a guided case →</button><p class="tiny muted">The values are synthetic and are not machine units or universal limits.</p></section>
    <section class="card pdlab-section"><div class="eyebrow">Learn then practise · 13 short drills</div><h3>Injection moulding maths and shop-floor skills</h3><p>Learn the key formulas, then practise units, shot mass, material percentages, production output, quality data, shrinkage and a simplified clamp-force estimate.</p><button class="secondary" data-pdlab-math-open>Learn the formulas and practise →</button><p class="tiny muted">Training values only. Exercises are ungraded and never set production machine values.</p></section>
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
  const t=e.target.closest('[data-pdlab-math-open],[data-pdlab-home],[data-pd-math-guide],[data-pd-math-start],[data-pd-math-choice],[data-pd-math-retry],[data-pd-math-next],[data-pdlab-guided],[data-pdlab-50],[data-pdlab-atlas],[data-pdlab-csv],[data-pdlab-saved],[data-pd-start],[data-pd-home],[data-pd-practice],[data-pd-choice],[data-pd-next],[data-pd-finish],[data-pd-retry],[data-pd-restart],[data-pd-csv]');if(!t)return;
  if(t.hasAttribute('data-pdlab-math-open')||t.hasAttribute('data-pd-math-guide'))return renderMathGuide();
  if(t.hasAttribute('data-pdlab-home'))return renderHome();
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
window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,openGuidedCases:renderGuidedHome,evaluateChoice,storage:'MM_LEARNER_SCOPE 128-bit collision-safe learner progress',storagePrefix:`${STORAGE_BASE}::`,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};
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
