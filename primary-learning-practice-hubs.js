/* MouldMaster primary Learn / Practice hubs — 2026.09.24.1 */
(function(){
'use strict';
if(window.MM_PRIMARY_HUBS)return;
if(typeof renderPath!=='function'||typeof renderScenarios!=='function'||typeof switchView!=='function'){
  console.warn('[MouldMaster] Primary hubs require the core learning and practice views.');
  return;
}

const VERSION='2026.10.10.4';
const PRACTICE_ROTATION_KEY='mm_practice_scenario_rotation_v1';
const originalRenderScenarios=renderScenarios;

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
    const lesson=typeof mmCoreSafeLesson==='function'
      ? mmCoreSafeLesson()
      : (D.lessons.find(l=>l.id===user.currentLesson)||D.lessons[0]);
    if(!lesson)return null;
    const course=D.courses.find(x=>x.id===lesson.course);
    if(!course)return null;
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
function practiceStore(){return window.MM_RUNTIME_V2?.storage||null}
function readPracticeRotation(){
  const store=practiceStore();
  if(!store?.get)return NaN;
  const row=store.get(PRACTICE_ROTATION_KEY,null);return Number(row?.last)
}
function writePracticeRotation(index){
  const store=practiceStore();
  return !!store?.set?.(PRACTICE_ROTATION_KEY,{last:index})
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
    openModal(`<span class="eyebrow">Learn</span><h2>Learning resources</h2><p class="muted">Choose the resource you need.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="visuals"><b>Animated visuals</b><small>See core cycle and process ideas visually.</small></button><button type="button" data-mm-hub-action="glossary"><b>Glossary</b><small>Look up injection moulding terms in plain language.</small></button></div>`);
  }else if(kind==='troubleshooting'){
    openModal(`<span class="eyebrow">Practice</span><h2>Troubleshooting</h2><p class="muted">Choose how you want to work the problem.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="mould-master"><b>Mould Master</b><small>Build an evidence-led troubleshooting case from a real defect.</small></button><button type="button" data-mm-hub-action="diagnostic-workbench"><b>Defect Finder + Troubleshooting Coach</b><small>One guided workspace: symptoms, competing mechanisms, measured evidence and review-ready learning notes.</small></button><button type="button" data-mm-hub-action="diagnostic-labs"><b>Diagnostic labs</b><small>Practise evidence-first fault isolation.</small></button></div>`);
  }else if(kind==='labs'){
    openModal(`<span class="eyebrow">Practice</span><h2>Labs & simulators</h2><p class="muted">Choose a controlled learning tool.</p><div class="mm-hub-picker-grid"><button type="button" data-mm-hub-action="spatial-twin"><b>Spatial Twin</b><small>Enter an explorable moulding cell, switch evidence modes and time-travel through a governed diagnostic case.</small></button><button type="button" data-mm-hub-action="simulator"><b>Virtual apprenticeship</b><small>Investigate authored shop-floor cases, justify the next evidence, then explore relative process changes in the simulator.</small></button><button type="button" data-mm-hub-action="material-labs"><b>Material labs</b><small>Compare resin behaviour and evidence.</small></button></div>`);
  }else if(kind==='questions'){
    return openQuestionCentreDetail();
  }
  requestAnimationFrame(()=>bind(document.getElementById('modal')));
}
function closePicker(){try{window.closeModal?.()}catch(_){}}

/* Unified Defect Finder + Troubleshooting Coach.
   Extension-only: never edit the frozen/generated core. This is a guided,
   user-evidence-labelled learning workflow, not a production expert system. */
const DX_VERSION='2026.10.08.1';
const DX_EVIDENCE=[
  ['part','Cavity-labelled part quality / mass and the acceptance criteria'],
  ['pressure','Actual cavity / plastic-side pressure, sensor position and calibration'],
  ['cycle','Fill, transfer, cushion and recovery actuals from matching shots'],
  ['material','Verified grade, lot, drying/moisture and conditioning history'],
  ['mould','Mould, gate, vent, cooling and maintenance observations'],
  ['baseline','Stable baseline and a comparable sample/measurement system']
];
const dxState={selected:-1,query:'',phase:'intake',form:{
  when:'unknown',distribution:'unknown',change:'unknown',baseline:'',observations:'',
  comparison:'',reflection:''
},evidence:[],hypotheses:{}};
function dxDefects(){return Array.isArray(D?.defects)?D.defects:[]}
function dxFormValue(key){return esc(dxState.form[key]||'')}
function dxSelect(key,label,values){
  return '<label class="mm-dx-field"><span>'+esc(label)+'</span><select name="'+key+'">'+
    values.map(pair=>'<option value="'+esc(pair[0])+'"'+(dxState.form[key]===pair[0]?' selected':'')+'>'+esc(pair[1])+'</option>').join('')+'</select></label>';
}
function dxOpt(key,label){
  return '<label class="mm-dx-field"><span>'+esc(label)+'</span><textarea name="'+key+'" rows="3" maxlength="2000" placeholder="Record measured observations, not assumed causes">'+dxFormValue(key)+'</textarea></label>';
}
function dxEvidenceRows(){
  return DX_EVIDENCE.map(pair=>'<label class="mm-dx-check"><input type="checkbox" data-mm-dx-evidence="'+esc(pair[0])+'"'+(dxState.evidence.includes(pair[0])?' checked':'')+'> <span>'+esc(pair[1])+'</span></label>').join('');
}
function dxLibrary(){
  return '<section class="mm-dx-pane"><div class="mm-dx-section-head"><h2>1 · Choose a symptom</h2><span>'+dxDefects().length+' training patterns</span></div>'+
    '<label class="mm-dx-field"><span>Search signs or mechanisms</span><input id="mmDxSearch" type="search" autocomplete="off" placeholder="e.g. short shot, burn, splay" value="'+esc(dxState.query)+'"></label>'+
    '<div class="mm-dx-library" role="group" aria-label="Defect patterns">'+dxDefects().map((d,i)=>{
      const terms=(d.name+' '+d.symptom+' '+(d.mechanisms||[]).join(' ')).toLowerCase();
      return '<button class="mm-dx-symptom'+(dxState.selected===i?' is-selected':'')+'" type="button" data-mm-dx-action="choose" data-mm-dx-id="'+i+'" data-mm-dx-terms="'+esc(terms)+'" aria-pressed="'+(dxState.selected===i?'true':'false')+'"><b>'+esc(d.name)+'</b><small>'+esc(d.symptom)+'</small></button>';
    }).join('')+'</div></section>';
}
function dxIntake(){
  const defect=dxDefects()[dxState.selected];
  if(!defect)return '<section class="mm-dx-pane mm-dx-empty"><h2>2 · Build the evidence picture</h2><p>Choose one symptom first. Similar-looking defects may have different mechanisms; no cause is assumed.</p></section>';
  return '<section class="mm-dx-pane"><div class="mm-dx-section-head"><h2>2 · Describe the actuals</h2><span>'+esc(defect.name)+'</span></div>'+
    '<p class="muted">For learning only. Do not enter names, serial numbers, confidential recipes or site identifiers.</p>'+
    '<div class="mm-dx-fields">'+
    dxSelect('when','When did it appear?',[
      ['unknown','Not established'],['sudden','Suddenly'],['lot','Following a material or batch change'],
      ['tool','Following tooling / maintenance'],['machine','Following machine intervention'],['gradual','Gradual drift']])+
    dxSelect('distribution','Where is the symptom seen?',[
      ['unknown','Not established'],['one-cavity','One cavity / region'],['all-cavities','Multiple cavities'],
      ['intermittent','Intermittently'],['whole-part','Whole part']])+
    dxSelect('change','What changed?',[
      ['unknown','Unknown'],['material','Material / handling'],['tooling','Tooling / cooling / venting'],
      ['machine','Machine / tooling configuration'],['method','Method / validated process'],
      ['none','No known change']])+
    dxOpt('baseline','Known-good baseline or acceptance evidence')+
    dxOpt('observations','Current observations, units, location and shot window')+
    '</div><fieldset class="mm-dx-evidence"><legend>Which evidence is actually available?</legend>'+dxEvidenceRows()+'</fieldset>'+
    '<button class="primary mm-dx-main-action" type="button" data-mm-dx-action="analyse">Build evidence-led investigation →</button></section>';
}
function dxHypothesisRows(defect){
  return (defect.mechanisms||[]).map((mechanism,i)=>{
    const value=dxState.hypotheses[i]||'unassessed';
    return '<div class="mm-dx-hypothesis"><p><strong>'+esc(mechanism)+'</strong></p>'+
      '<label>Human evidence assessment <select data-mm-dx-hypothesis="'+i+'">'+
      [['unassessed','Not assessed'],['support','Evidence may support'],['against','Evidence may oppose']].map(pair=>'<option value="'+pair[0]+'"'+(value===pair[0]?' selected':'')+'>'+pair[1]+'</option>').join('')+
      '</select></label></div>';
  }).join('');
}
function dxReportData(){
  const defect=dxDefects()[dxState.selected];
  return {
    schema:'mm-diagnostic-learning-case-v1',
    authority:'educational-investigation-only',
    rootCauseVerified:false,
    productionSetpointsAuthorized:false,
    selectedDefect:defect?.name||null,
    symptomDescription:defect?.symptom||null,
    context:{...dxState.form},
    evidenceReportedAvailable:[...dxState.evidence],
    hypotheses:(defect?.mechanisms||[]).map((name,i)=>({name,learnerAssessment:dxState.hypotheses[i]||'unassessed',validated:false})),
    referenceChecks:[...(defect?.checks||[])],
    gaps:DX_EVIDENCE.filter(x=>!dxState.evidence.includes(x[0])).map(x=>x[1]),
    notes:'A user-entered evidence label or hypothesis is not proof. Follow approved site/OEM/material procedures and independent qualified review.'
  };
}
function dxAnalysis(){
  const defect=dxDefects()[dxState.selected];if(!defect)return dxIntake();
  const gaps=DX_EVIDENCE.filter(x=>!dxState.evidence.includes(x[0]));
  const noBaseline=!dxState.form.baseline.trim();
  const noObservations=!dxState.form.observations.trim();
  const selections=['when','distribution','change'].filter(key=>dxState.form[key]==='unknown');
  return '<section class="mm-dx-pane mm-dx-results" aria-live="polite">'+
    '<div class="mm-dx-section-head"><h2>3 · Compare mechanisms</h2><span>Unverified investigation</span></div>'+
    '<p class="mm-dx-boundary"><strong>No cause confirmed.</strong> This is a transparent library-based investigation, not an AI diagnosis, probability estimate, validated physical model or machine instruction.</p>'+
    '<div class="mm-dx-result-block"><h3>Evidence gaps to resolve</h3><ul>'+
    (noBaseline?'<li>No comparable known-good baseline documented.</li>':'')+
    (noObservations?'<li>No current measured observations documented.</li>':'')+
    selections.map(k=>'<li>'+esc(k)+' remains unknown.</li>').join('')+
    gaps.map(pair=>'<li>'+esc(pair[1])+' — not yet reported available.</li>').join('')+
    (!gaps.length&&!noBaseline&&!noObservations&&!selections.length?'<li>References recorded; still independently verify actual records, uncertainty and comparable conditions.</li>':'')+
    '</ul></div>'+
    '<div class="mm-dx-result-block"><h3>Mechanism hypotheses</h3><p class="muted">Change these labels only after reviewing direct evidence; the selections are human judgements, not algorithmic confidence.</p>'+dxHypothesisRows(defect)+'</div>'+
    '<div class="mm-dx-result-block"><h3>Discriminating checks from the defect library</h3><ol>'+
    (defect.checks||[]).map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol>'+
    '<p class="muted">Compare like-for-like shots, cavity locations and measurement conditions. Qualified staff choose whether a controlled test is safe and valid.</p></div>'+
    '<div class="mm-dx-fields">'+dxOpt('comparison','What test or measurement would distinguish these mechanisms?')+
    dxOpt('reflection','What evidence would confirm recovery, and what remains uncertain?')+'</div>'+
    '<div class="mm-dx-actions"><button type="button" class="secondary" data-mm-dx-action="back">← Revise intake</button>'+
    '<button type="button" class="secondary" data-mm-dx-action="export">Export learning case JSON</button>'+
    '<button type="button" class="secondary" data-mm-dx-action="reset">Start another case</button></div></section>';
}
function dxRender(view){
  const root=document.getElementById(view);if(!root)return;
  root.dataset.mmDxMode='unified';
  root.innerHTML='<div class="mm-dx-workbench"><header class="mm-dx-hero"><span class="eyebrow">Practice · Unified diagnostic workbench</span>'+
    '<h1>Defect Finder + Troubleshooting Coach</h1>'+
    '<p>Find the physical symptom, develop competing hypotheses, choose the next measurement and document a recovery criterion — in one guided, offline learning workspace.</p>'+
    '<div class="mm-dx-disclaimer">Educational advisory only · No automatic root-cause ranking · No machine settings or production control</div></header>'+
    '<div class="mm-dx-layout">'+dxLibrary()+(dxState.phase==='analysis'?dxAnalysis():dxIntake())+'</div></div>';
  if(!root.dataset.mmDxBound){
    root.dataset.mmDxBound='1';
    root.addEventListener('click',event=>{
      const el=event.target.closest('[data-mm-dx-action]');if(!el||!root.contains(el))return;
      const action=el.dataset.mmDxAction;
      if(action==='choose'){
        const index=Number(el.dataset.mmDxId);
        if(!Number.isInteger(index)||!dxDefects()[index])return;
        dxState.selected=index;dxState.phase='intake';dxState.hypotheses={};dxRender(view);
      }else if(action==='analyse'){
        dxState.phase='analysis';dxRender(view);
      }else if(action==='back'){dxState.phase='intake';dxRender(view)}
      else if(action==='reset'){
        dxState.selected=-1;dxState.phase='intake';dxState.query='';
        dxState.hypotheses={};dxState.evidence=[];
        dxState.form={when:'unknown',distribution:'unknown',change:'unknown',
          baseline:'',observations:'',comparison:'',reflection:''};
        dxRender(view);
      }else if(action==='export'){
        const data=JSON.stringify(dxReportData(),null,2);
        const file=new Blob([data],{type:'application/json'});
        const url=URL.createObjectURL(file);
        const a=document.createElement('a');a.href=url;a.download='mouldmaster-diagnostic-learning-case.json';
        document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
      }
    });
    root.addEventListener('input',event=>{
      if(event.target.id==='mmDxSearch'){
        dxState.query=event.target.value;
        const term=dxState.query.trim().toLowerCase();
        root.querySelectorAll('[data-mm-dx-terms]').forEach(button=>{button.hidden=!button.dataset.mmDxTerms.includes(term)});
      }else if(event.target.name&&Object.hasOwn(dxState.form,event.target.name)){
        dxState.form[event.target.name]=event.target.value;
      }
    });
    root.addEventListener('change',event=>{
      if(event.target.matches('[data-mm-dx-evidence]')){
        const id=event.target.dataset.mmDxEvidence;
        dxState.evidence=event.target.checked?[...new Set([...dxState.evidence,id])]:dxState.evidence.filter(x=>x!==id);
      }else if(event.target.matches('[data-mm-dx-hypothesis]')){
        dxState.hypotheses[Number(event.target.dataset.mmDxHypothesis)]=event.target.value;
      }else if(event.target.name&&Object.hasOwn(dxState.form,event.target.name)){
        dxState.form[event.target.name]=event.target.value;
      }
    });
  }
  const query=root.querySelector('#mmDxSearch');
  if(query&&dxState.query)query.dispatchEvent(new Event('input',{bubbles:true}));
}
function dxOpen(index){
  if(Number.isInteger(index)&&dxDefects()[index]){dxState.selected=index;dxState.phase='intake'}
  try{window.closeModal?.()}catch(_){}
  switchView('defects');
}
function renderUnifiedDefects(){dxRender('defects')}
function renderUnifiedCoach(){dxRender('coach')}
if(typeof renderDefects==='function'){
  renderDefects=renderUnifiedDefects;window.renderDefects=renderUnifiedDefects;
}
if(typeof renderCoach==='function'){
  renderCoach=renderUnifiedCoach;window.renderCoach=renderUnifiedCoach;
}
if(typeof openDefect==='function'){
  openDefect=dxOpen;window.openDefect=dxOpen;
}
if(typeof askCoachForDefect==='function'){
  askCoachForDefect=dxOpen;window.askCoachForDefect=dxOpen;
}
window.MM_DIAGNOSTIC_WORKBENCH=Object.freeze({
  version:DX_VERSION,open:dxOpen,
  report:dxReportData,
  authority:'educational learning investigation only',
  noProductionControl:true
});

function runAction(action){
  switch(action){
    case 'lesson': return openCurrentLesson();
    case 'path-detail': return lessonCatalog.open({filter:'all'});
    case 'materials': return switchView('materials');
    case 'specialist': return lessonCatalog.open({filter:'specialist'});
    case 'learn-resources': return openPicker('learn-resources');
    case 'visuals': closePicker(); return switchView('visuals');
    case 'glossary': closePicker(); return switchView('glossary');
    case 'saved': closePicker(); return lessonCatalog.open({filter:'saved'});
    case 'daily': return openDaily();
    case 'troubleshooting': return dxOpen();
    case 'mould-master': closePicker(); return safeOpen('MM_MOULD_MASTER_WORKSPACE',()=>switchView('defects'));
    case 'diagnostic-workbench': return dxOpen();
    case 'defects': return dxOpen();
    case 'coach': return dxOpen();
    case 'diagnostic-labs': closePicker(); return safeOpen('MM_DIAGNOSTIC_LABS',()=>switchView('scenarios'));
    case 'process-data': return safeOpen('MM_PROCESS_DATA_DIAGNOSTICS');
    case 'scenario-detail': closePicker(); return openScenarioDetail(nextScenarioIndex());
    case 'labs': return openPicker('labs');
    case 'spatial-twin': closePicker(); return safeOpen('MM_SPATIAL_TWIN',()=>switchView('simulator'));
    case 'simulator': closePicker(); return switchView('simulator');
    case 'material-labs': closePicker(); return safeOpen('MM_MATERIAL_BEHAVIOUR_LABS',()=>switchView('materials'));
    case 'measured-decisions': closePicker(); return safeOpen('MM_REAL_MEASURED_ASSESSMENT');
    case 'question-centre': return openQuestionCentreDetail();
    case 'assessments': closePicker(); return switchView('exams');
  }
}

function createLessonCatalog(){
  const state={query:'',filter:'all'};
  const core=()=>Array.isArray(D?.lessons)?D.lessons:[];
  const courses=()=>Array.isArray(D?.courses)?D.courses:[];
  const specialists=()=>Array.isArray(window.MM_SPECIALIST_CURRICULUM?.lessons)?window.MM_SPECIALIST_CURRICULUM.lessons:[];
  const materialLessons=()=>typeof MAT_LESSONS!=='undefined'&&Array.isArray(MAT_LESSONS)?MAT_LESSONS:[];
  const materialChapters=()=>typeof MATERIALS!=='undefined'&&Array.isArray(MATERIALS.chapters)?MATERIALS.chapters:[];
  const materialDone=id=>Array.isArray(user?.materialScience?.completed)&&user.materialScience.completed.includes(id);
  const done=id=>Array.isArray(user?.completed)&&user.completed.includes(id);
  const saved=id=>Array.isArray(user?.bookmarks)&&user.bookmarks.includes(id);
  // Specialist completion is owned by the independent specialist curriculum.
  // Read through its API rather than reimplementing learner storage or credit.
  const specialistDone=id=>window.MM_SPECIALIST_CURRICULUM?.isComplete?.(id)===true||window.MM_SPECIALIST_EVIDENCE_GAPS?.isComplete?.(id)===true;
  function markup(){
    const active=Number(user?.currentLesson);
    const groups=courses().map(course=>{
      const lessons=(course.lessonIds||[]).map(id=>core().find(l=>l.id===id)).filter(Boolean);
      const complete=lessons.filter(l=>done(l.id)).length;
      return `<details class="mm-catalog-group" data-mm-catalog-group ${course.lessonIds?.includes(active)?'open':''}>
        <summary><span class="mm-catalog-group-name">${course.id}. ${esc(course.name)}</span><span class="mm-catalog-group-meta">${complete}/${lessons.length} · ${esc(course.level||'Core')}</span></summary>
        <div class="mm-catalog-rows">${lessons.map(l=>`<button type="button" class="mm-catalog-lesson${l.id===active?' is-current':''}" data-mm-lesson-id="${l.id}" data-mm-catalog-item data-mm-catalog-type="core" data-mm-catalog-done="${done(l.id)?'1':'0'}" data-mm-catalog-saved="${saved(l.id)?'1':'0'}" data-mm-catalog-text="${esc([l.title,l.summary,course.name,l.level,l.id].join(' ').toLowerCase())}" ${l.id===active?'aria-current="step"':''}><span class="mm-catalog-num">${l.id}</span><span class="mm-catalog-title">${esc(l.title)}</span><span class="mm-catalog-state">${done(l.id)?'✓ Done':saved(l.id)?'★ Saved':l.id===active?'Reading':'Open'}</span></button>`).join('')}</div></details>`;
    }).join('');
    const materialGroups=materialChapters().map(chapter=>{
      const lessons=materialLessons().filter(l=>l.chapter===chapter.id);
      const completed=lessons.filter(l=>materialDone(l.id)).length;
      return `<details class="mm-catalog-group" data-mm-catalog-group>
        <summary><span class="mm-catalog-group-name">Material science · ${chapter.id}. ${esc(chapter.name)}</span><span class="mm-catalog-group-meta">${completed}/${lessons.length} · separate progress</span></summary>
        <div class="mm-catalog-rows">${lessons.map(l=>`<button type="button" class="mm-catalog-lesson" data-mm-material-id="${l.id}" data-mm-catalog-item data-mm-catalog-type="material" data-mm-catalog-done="${materialDone(l.id)?'1':'0'}" data-mm-catalog-saved="0" data-mm-catalog-text="${esc([l.title,l.intro,l.chapterName,l.level,l.id].join(' ').toLowerCase())}"><span class="mm-catalog-num">M${l.id}</span><span class="mm-catalog-title">${esc(l.title)}</span><span class="mm-catalog-state">${materialDone(l.id)?'✓ Done':'Open'}</span></button>`).join('')}</div></details>`;
    }).join('');
    const extra=specialists();
    const extraGroup=extra.length?`<details class="mm-catalog-group" data-mm-catalog-group><summary><span class="mm-catalog-group-name">Optional specialist lessons</span><span class="mm-catalog-group-meta">${extra.length} extras · separate progress</span></summary><div class="mm-catalog-rows">${extra.map(l=>`<button type="button" class="mm-catalog-lesson" data-mm-specialist-id="${esc(l.id)}" data-mm-catalog-item data-mm-catalog-type="specialist" data-mm-catalog-done="${specialistDone(l.id)?'1':'0'}" data-mm-catalog-text="${esc([l.id,l.title,l.level].join(' ').toLowerCase())}"><span class="mm-catalog-num">${esc(l.id)}</span><span class="mm-catalog-title">${esc(l.title)}</span><span class="mm-catalog-state">${specialistDone(l.id)?'✓ Done':'Open'}</span></button>`).join('')}</div></details>`:'';
    return `<section class="mm-all-lessons" data-mm-lesson-catalog aria-label="All lessons">
      <div class="mm-catalog-head"><h2>All lessons</h2><p>${core().length} core · ${materialLessons().length} material science · ${extra.length} optional specialist lessons. All in one library, with separate progress.</p></div>
      <div class="mm-catalog-controls"><label><span>Find a lesson</span><input type="search" autocomplete="off" placeholder="Search topics or lessons" data-mm-catalog-query value="${esc(state.query)}"></label><label><span>Show</span><select data-mm-catalog-filter><option value="all"${state.filter==='all'?' selected':''}>All lessons</option><option value="todo"${state.filter==='todo'?' selected':''}>Not finished</option><option value="done"${state.filter==='done'?' selected':''}>Completed</option><option value="saved"${state.filter==='saved'?' selected':''}>Saved</option><option value="material"${state.filter==='material'?' selected':''}>Material science</option><option value="specialist"${state.filter==='specialist'?' selected':''}>Specialist</option></select></label></div>
      <p class="mm-catalog-results" aria-live="polite" data-mm-catalog-count></p>
      <div class="mm-catalog-groups">${groups}${materialGroups}${extraGroup}</div>
      <p class="mm-catalog-empty" data-mm-catalog-empty hidden>No matching lessons. Try another search or filter.</p>
    </section>`;
  }
  function update(root){
    const box=root?.querySelector('[data-mm-lesson-catalog]');if(!box)return;
    let count=0;
    const query=state.query.trim().toLowerCase();
    const filtering=!!query||state.filter!=='all';
    const wasFiltering=box.dataset.mmCatalogFiltering==='1';
    // A temporary search should not leave all thirteen courses expanded.
    // Restore the learner's pre-search open sections when the filter clears.
    if(filtering&&!wasFiltering){
      box.querySelectorAll('[data-mm-catalog-group]').forEach(group=>{
        group.dataset.mmCatalogPrevOpen=group.open?'1':'0';
      });
    }
    box.querySelectorAll('[data-mm-catalog-group]').forEach(group=>{
      let visible=0;
      group.querySelectorAll('[data-mm-catalog-item]').forEach(button=>{
        const type=button.dataset.mmCatalogType;
        const matchesStatus=state.filter==='all'||
          (state.filter==='specialist'?type==='specialist':
           state.filter==='material'?type==='material':
           state.filter==='saved'?type==='core'&&button.dataset.mmCatalogSaved==='1':
           (type==='core'||type==='material'||type==='specialist')&&
            (state.filter==='todo'?button.dataset.mmCatalogDone==='0':button.dataset.mmCatalogDone==='1'));
        const matchesText=!query||(button.dataset.mmCatalogText||'').includes(query);
        button.hidden=!(matchesStatus&&matchesText);
        if(!button.hidden)visible++;
      });
      group.hidden=visible===0;
      if(filtering)group.open=visible>0;
      else if(wasFiltering&&group.dataset.mmCatalogPrevOpen!==undefined){
        group.open=group.dataset.mmCatalogPrevOpen==='1';
        delete group.dataset.mmCatalogPrevOpen;
      }
      count+=visible;
    });
    box.dataset.mmCatalogFiltering=filtering?'1':'0';
    const counter=box.querySelector('[data-mm-catalog-count]');
    if(counter)counter.textContent=`${count} lesson${count===1?'':'s'} shown`;
    const empty=box.querySelector('[data-mm-catalog-empty]');if(empty)empty.hidden=count>0;
  }
  function refreshSpecialistProgress(){
    const root=document.getElementById('path'),box=root?.querySelector('[data-mm-lesson-catalog]');
    if(!box)return;
    box.querySelectorAll('[data-mm-specialist-id]').forEach(button=>{
      const completed=specialistDone(button.dataset.mmSpecialistId);
      button.dataset.mmCatalogDone=completed?'1':'0';
      const status=button.querySelector('.mm-catalog-state');
      if(status)status.textContent=completed?'✓ Done':'Open';
    });
    update(root);
  }
  function attach(root){
    const box=root?.querySelector('[data-mm-lesson-catalog]');if(!box||box.dataset.mmCatalogBound==='1')return;
    box.dataset.mmCatalogBound='1';
    const input=box.querySelector('[data-mm-catalog-query]');
    const filter=box.querySelector('[data-mm-catalog-filter]');
    input?.addEventListener('input',()=>{state.query=input.value;update(root)});
    filter?.addEventListener('change',()=>{state.filter=filter.value;update(root)});
    box.addEventListener('click',event=>{
      const button=event.target.closest('button[data-mm-lesson-id],button[data-mm-specialist-id],button[data-mm-material-id]');
      if(!button||!box.contains(button))return;
      if(button.dataset.mmSpecialistId){
        const id=button.dataset.mmSpecialistId;
        if(specialists().some(l=>l.id===id)){
          // S13–S20 use the independent evidence-gap reader; the base
          // specialist reader intentionally knows only S01–S12.
          if(window.MM_SPECIALIST_EVIDENCE_GAPS?.lessons?.some(l=>l.id===id))window.mmSpecialistGapLesson?.(id);
          else window.mmSpecialistLesson?.(id);
        }
        return;
      }
      if(button.dataset.mmMaterialId){
        const materialId=Number(button.dataset.mmMaterialId);
        if(Number.isInteger(materialId)&&materialLessons().some(l=>l.id===materialId)&&typeof openMaterialLesson==='function'){
          if(typeof materialTab!=='undefined')materialTab='learn';
          switchView('materials');
          openMaterialLesson(materialId);
          mountMaterialReader();
        }
        return;
      }
      const id=Number(button.dataset.mmLessonId);
      if(!Number.isInteger(id)||!core().some(l=>l.id===id))return;
      user.currentLesson=id;persist();openCurrentLesson();
    });
    update(root);
  }
  function open(options={}){
    const allowed=['all','todo','done','saved','material','specialist'];
    state.filter=allowed.includes(options.filter)?options.filter:'all';
    state.query=typeof options.query==='string'?options.query.trim().slice(0,120):'';
    window.mmSpecialistClose?.();
    if(typeof materialTab!=='undefined'&&materialTab==='learn')materialTab='explorer';
    if(typeof currentView==='string'&&currentView==='path')renderLearnHub();
    else switchView('path');
    requestAnimationFrame(()=>{
      const library=document.querySelector('#path .mm-all-lessons');
      library?.scrollIntoView?.({block:'start',behavior:'auto'});
    });
  }
  function mountLesson(){
    const root=document.getElementById('lesson');
    if(!root||!root.querySelector('.lesson-body'))return;
    root.querySelector('.mm-lessons-drawer')?.remove();
    root.querySelector('.lesson-side')?.remove();
    root.classList.add('mm-unified-lesson');
    const layout=root.querySelector('.lesson-layout');
    if(layout)layout.classList.add('mm-one-column-lesson');
    if(root.querySelector('.mm-lesson-catalog-return'))return;
    const nav=document.createElement('nav');
    nav.className='mm-lesson-catalog-return';
    nav.setAttribute('aria-label','Return to the lesson library');
    const button=document.createElement('button');
    button.type='button';
    button.className='ghost';
    button.textContent='← All lessons';
    button.addEventListener('click',()=>open({filter:'all'}));
    nav.appendChild(button);
    root.insertBefore(nav,layout||root.firstChild);
  }
  return Object.freeze({markup,attach,mountLesson,open,refreshSpecialistProgress,counts:()=>({core:core().length,material:materialLessons().length,specialist:specialists().length})});
}
const lessonCatalog=createLessonCatalog();
window.addEventListener('mm:specialist-progress-change',()=>lessonCatalog.refreshSpecialistProgress());
// The manifest installs learner scope after the classic-script curriculum pack.
// Refresh any Learn page opened during bootstrap once owned progress can migrate.
window.addEventListener('mm:domains-ready',()=>lessonCatalog.refreshSpecialistProgress());

function learnHubMarkup(){
  const c=lessonContext();
  const lesson=c?.lesson;const course=c?.course;
  const lessonLine=course?`${esc(course.name)} · Lesson ${(c.position||0)+1} of ${course.lessonIds.length}`:'Your current lesson';
  return `<div class="mm-primary-hub mm-learn-hub">
    <header class="mm-primary-hub-head"><span class="eyebrow">Learn</span><h1>Lessons</h1><p>Core, material science and specialist lessons in one place.</p></header>
    <section class="mm-hub-continue mm-primary-hub-card" aria-label="Continue learning"><div class="mm-hub-continue-copy"><span class="eyebrow">Continue</span><h2>${esc(lesson?.title||'Your next lesson')}</h2><p>${lessonLine}</p><div class="mm-hub-progress"><div class="mini-bar" aria-hidden="true"><span style="width:${c?.overall||0}%"></span></div><strong>${c?.overall||0}% complete</strong></div></div><button class="primary mm-hub-continue-action" type="button" data-mm-hub-action="lesson">Continue lesson →</button></section>
    ${lessonCatalog.markup()}
    <div class="mm-catalog-extra"><button class="secondary" type="button" data-mm-hub-action="learn-resources">Visuals & glossary →</button></div>
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
function questionCentreCounts(){
 const formal=(D?.exams?Object.values(D.exams).reduce((n,rows)=>n+(rows?.length||0),0):0)+(D?.regionalQuestions?Object.values(D.regionalQuestions).reduce((n,levels)=>n+Object.values(levels||{}).reduce((m,rows)=>m+(rows?.length||0),0),0):0);
 const scenarios=D?.scenarios?.length||0;
 const diagnostic=window.MM_DIAGNOSTIC_LABS?.labs?.reduce?.((n,lab)=>n+(lab?.steps?.length||0),0)||36;
 const materials=window.MM_MATERIAL_BEHAVIOUR_LABS?.labs?.reduce?.((n,lab)=>n+(lab?.steps?.length||0),0)||24;
 const measured=window.MM_REAL_MEASURED_ASSESSMENT?.decisionCount||12;
 return {formal,scenarios,diagnostic,materials,measured,total:formal+scenarios+diagnostic+materials+measured};
}
function questionCentreMarkup(){
 const q=questionCentreCounts();
 return `<span class="eyebrow">${q.total} governed prompts</span><h2>Choose how you want to be questioned</h2><p class="muted">Most governed question-based learning is collected here. Formal checks and low-stakes practice keep their existing scoring and evidence boundaries.</p><div class="mm-hub-picker-grid">
 <button type="button" data-mm-hub-action="assessments"><b>Formal knowledge checks</b><small>30 approved technical + 27 regional-safety bank items. Attempts use the governed level/region blueprint: 10 questions in one jurisdiction or 16 in Compare All.</small></button>
 <button type="button" data-mm-hub-action="scenario-detail"><b>Shop-floor scenarios</b><small>${q.scenarios} evidence-first decisions with immediate feedback.</small></button>
 <button type="button" data-mm-hub-action="diagnostic-labs"><b>Diagnostic questions</b><small>${q.diagnostic} guided fault-isolation decisions across the diagnostic labs.</small></button>
 <button type="button" data-mm-hub-action="material-labs"><b>Material questions</b><small>${q.materials} resin/evidence decisions across the material labs.</small></button>
 <button type="button" data-mm-hub-action="measured-decisions"><b>Measured-evidence decisions</b><small>${q.measured} decisions grounded in audited measured-data contracts.</small></button>
 </div><p class="tiny muted" style="margin-top:12px">${q.total} governed question/decision prompts across these five modes. Book chapter self-checks and lesson exercises stay with the teaching they belong to.</p>`;
}
function openQuestionCentreDetail(){
  const root=document.getElementById('scenarios');if(!root)return;
  try{window.closeModal?.()}catch(_){}
  if(typeof switchView==='function'&&typeof currentView==='string'&&currentView!=='scenarios')switchView('scenarios');
  root.dataset.mmHubMode='question-centre';
  root.innerHTML=`<div class="mm-primary-hub mm-question-centre"><header class="mm-primary-hub-head"><span class="eyebrow">Practice · Question Centre</span><h1>Questions, checks and decisions</h1><p>Use one place to choose the kind of question you need. Scoring, evidence and safety rules stay with each governed source.</p></header><section class="mm-primary-hub-card mm-question-centre-card">${questionCentreMarkup()}</section></div>`;
  detailBack(root,'Question Centre','Practice');
  bind(root);
  window.MM_APP_SHELL?.navigation?.setCustomActive?.('question-centre','practice');
  window.scrollTo({top:0,behavior:'smooth'});
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
    <section class="mm-hub-assessment" aria-label="Question Centre"><div class="mm-hub-assessment-copy"><b>Question Centre</b><small>Formal checks, scenarios, diagnostic questions, material questions and measured-evidence decisions are gathered here. Lesson exercises and Book self-checks stay beside their teaching.</small></div><button class="secondary" type="button" data-mm-hub-action="question-centre">Open all question modes →</button></section>
  </div>`;
}
function renderLearnHub(){const root=document.getElementById('path');if(!root)return;root.dataset.mmHubMode='hub';root.innerHTML=learnHubMarkup();bind(root);lessonCatalog.attach(root)}
function renderPracticeHub(){const root=document.getElementById('scenarios');if(!root)return;root.dataset.mmHubMode='hub';root.innerHTML=practiceHubMarkup();bind(root);window.MM_APP_SHELL?.navigation?.setCustomActive?.('')}
function detailBack(root,label,back){
  const bar=document.createElement('div');bar.className='mm-hub-detail-back';bar.innerHTML=`<button type="button">← ${esc(back)}</button><span>${esc(label)}</span>`;
  bar.querySelector('button').addEventListener('click',()=>back==='Learn'?renderLearnHub():renderPracticeHub());root.prepend(bar);
}
function openLearningPathDetail(){return lessonCatalog.open({filter:'all'})}
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
window.MM_APP_SHELL?.events?.onRender?.('lesson',()=>requestAnimationFrame(lessonCatalog.mountLesson));
window.MM_LESSON_CATALOG=Object.freeze({version:'2026.10.10.3',counts:lessonCatalog.counts,open:lessonCatalog.open});
// Material Science authored lessons share Learn's single catalogue. Their
// own reader and local completion state are preserved, while the Materials
// workspace remains available for reference, labs and knowledge checks.
const materialView=document.getElementById('materials');
const originalSwitchMaterialTab=typeof switchMaterialTab==='function'?switchMaterialTab:null;
if(typeof materialTab!=='undefined'&&materialTab==='learn')materialTab='explorer';
function mountMaterialReader(){
  if(!materialView)return;
  const legacy=materialView.querySelector('.mat-chapters');
  if(legacy&&originalSwitchMaterialTab){originalSwitchMaterialTab('explorer');return}
  const layout=materialView.querySelector('.mat-learn-layout');
  if(layout){
    layout.classList.add('mm-one-column-material');
    layout.querySelector('.mat-side')?.remove();
    if(!materialView.querySelector('.mm-lesson-catalog-return')){
      const nav=document.createElement('nav');
      nav.className='mm-lesson-catalog-return';
      nav.setAttribute('aria-label','Return to all material lessons');
      const back=document.createElement('button');
      back.type='button';back.className='ghost';
      back.textContent='← All material lessons';
      back.addEventListener('click',()=>lessonCatalog.open({filter:'material'}));
      nav.appendChild(back);
      layout.before(nav);
    }
  }
  materialView.querySelectorAll('.mat-tabs button').forEach(button=>{
    if(!/switchMaterialTab\(['"]learn['"]\)/.test(button.getAttribute('data-mm-onclick')||''))return;
    button.textContent='All lessons';
    button.setAttribute('data-mm-onclick','mmHubOpenMaterialLessons()');
    button.classList.remove('active');
  });
}
window.mmHubOpenMaterialLessons=()=>lessonCatalog.open({filter:'material'});
if(originalSwitchMaterialTab){
  window.switchMaterialTab=function(tab){
    if(tab==='learn')return lessonCatalog.open({filter:'material'});
    return originalSwitchMaterialTab(tab);
  };
}
if(materialView)new MutationObserver(mountMaterialReader).observe(materialView,{childList:true,subtree:true});
mountMaterialReader();

// The specialist reader stays independent, but all specialist *browsing*
// goes through Learn. Old launches (Home, More, specialist reader Back) land
// on the same filtered catalogue instead of opening a second lesson grid.
if(window.MM_SPECIALIST_CURRICULUM){
  window.MM_SPECIALIST_CURRICULUM.open=()=>lessonCatalog.open({filter:'specialist'});
  window.mmSpecialistOpen=window.MM_SPECIALIST_CURRICULUM.open;
}
window.mmHubOpenLesson=openCurrentLesson;
window.mmHubOpenLearningPath=openLearningPathDetail;
window.mmHubOpenScenarios=openScenarioDetail;

function normalizeHomeActions(){
  const root=document.getElementById('dashboard');if(!root)return;
  root.querySelectorAll('#mmSpecialistDashboard').forEach(el=>el.remove());
  root.querySelectorAll('button[data-mm-onclick]').forEach(button=>{
    const action=button.getAttribute('data-mm-onclick')||'';
    if(/switchView\((['"])lesson\1\)/.test(action))button.setAttribute('data-mm-onclick','mmHubOpenLesson()');
  });
}
window.MM_APP_SHELL?.events?.onRender?.('dashboard',()=>requestAnimationFrame(normalizeHomeActions));
// Dashboard slots may recompose outside normal render calls (Book resume,
// domain readiness). Never let that recreate a second specialist lesson list.
const homeRoot=document.getElementById('dashboard');
if(homeRoot)new MutationObserver(()=>{
  homeRoot.querySelectorAll('#mmSpecialistDashboard').forEach(el=>el.remove());
}).observe(homeRoot,{childList:true,subtree:true});

function removeProfileLessonGrid(){
  const root=document.getElementById('profile');if(!root)return;
  for(const heading of root.querySelectorAll(':scope > .section-head')){
    if(!/^Saved lessons$/i.test(heading.querySelector('h2,h3')?.textContent?.trim()||''))continue;
    const list=heading.nextElementSibling;
    if(list?.matches('.grid'))list.remove();
    heading.remove();
  }
}
const profileRoot=document.getElementById('profile');
if(profileRoot)new MutationObserver(removeProfileLessonGrid).observe(profileRoot,{childList:true});
removeProfileLessonGrid();

// Global search still finds defects. It no longer duplicates a second
// searchable list of lessons: a single contextual link opens Learn filtered.
document.addEventListener('input',event=>{
  if(event.target?.id!=='globalSearch')return;
  const query=String(event.target.value||'').trim();
  requestAnimationFrame(()=>{
    const modal=document.getElementById('modal');
    const results=modal?.querySelector('#searchResults');
    if(!results||!modal.contains(event.target))return;
    const matches=results.querySelectorAll('button.search-item[data-mm-onclick*="goLesson("]');
    matches.forEach(el=>el.remove());
    results.querySelector('[data-mm-global-lesson-library]')?.remove();
    if(query.length<2)return;
    const link=document.createElement('button');
    link.type='button';link.className='search-item';
    link.dataset.mmGlobalLessonLibrary='1';
    link.textContent='Search all lessons in Learn →';
    link.addEventListener('click',()=>{window.closeModal?.();lessonCatalog.open({query})});
    results.prepend(link);
  });
});

function configureMore(){
  const items=window.MM_APP_SHELL?.navigation?.items;
  const practiceOwned=new Set(['mould-master','diagnostic-labs','process-data','material-labs','question-centre']);
  if(items?.forEach)items.forEach((item,id)=>{item.mobileMore=id!=='materials-page'&&!practiceOwned.has(id)});
}
function pruneMore(){
  const modal=document.getElementById('modal');if(!modal)return;
  const duplicate=/^(Materials|Material science)$/i;
  modal.querySelectorAll('.quick-action').forEach(button=>{const label=(button.querySelector('b')?.textContent||'').trim();if(duplicate.test(label))button.remove()});
}
configureMore();
window.MM_APP_SHELL?.events?.onViewChange?.(id=>{if(id==='more')requestAnimationFrame(()=>requestAnimationFrame(pruneMore))});

function refreshPracticePersonalisation(){
  const root=document.getElementById('scenarios');
  if(root?.dataset.mmHubMode==='hub'&&typeof currentView==='string'&&currentView==='scenarios')renderPracticeHub();
}
window.addEventListener('mm:domains-ready',()=>requestAnimationFrame(refreshPracticePersonalisation));

normalizeHomeActions();
if(typeof currentView==='string'){
  if(currentView==='path')renderLearnHub();
  if(currentView==='scenarios')renderPracticeHub();
}
window.MM_APP_SHELL?.navigation?.sync?.();
window.MM_QUESTION_CENTRE=Object.freeze({version:VERSION,open:openQuestionCentreDetail,counts:questionCentreCounts,scope:'Learner-facing consolidated launcher only; governed question sources, scoring, outcome-review status and evidence remain in their canonical subsystems.'});
window.MM_PRIMARY_HUBS={version:VERSION,renderLearnHub,renderPracticeHub,openCurrentLesson,openLearningPathDetail,openScenarioDetail,nextScenarioIndex,learnerPracticePlan};
})();