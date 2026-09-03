/* MouldMaster curriculum integration — theory → practice → evidence — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const RETURN_KEY='mm_curriculum_return_v1';

if(typeof renderLesson!=='function'||typeof renderDashboard!=='function'||typeof currentLesson!=='function'||typeof D==='undefined'){
  throw new Error('curriculum-integration.js requires the core lesson runtime');
}
if(!window.MM_LEARNING_EXPERIENCE||!window.MM_DIAGNOSTIC_LABS||!window.MM_PROCESS_DATA_DIAGNOSTICS||!window.MM_MATERIAL_BEHAVIOUR_LABS){
  throw new Error('curriculum-integration.js requires learning experience, diagnostic, process-data and material practice modules');
}

const ROUTES=Object.freeze([
  {type:'diagnostic',id:'cavity-short-shot',courses:[4,6,11,12],keywords:['short shot','cavity','imbalance','gate','runner','vent','local flow'],why:'Use cavity identity and local-versus-global evidence before changing the whole process.'},
  {type:'diagnostic',id:'splay-moisture',courses:[3,6,12],keywords:['splay','silver streak','moisture','drying','material change','volatile'],why:'Separate displayed dryer conditions from verified resin condition and handling history.'},
  {type:'diagnostic',id:'pressure-limited-fill',courses:[1,2,5,7,12],keywords:['setpoint','actual','velocity','injection speed','pressure limit','fill time','machine capability'],why:'Compare commanded settings with measured machine response before assuming the process followed the recipe.'},
  {type:'diagnostic',id:'check-ring-repeatability',courses:[2,5,7,8,12],keywords:['check ring','non-return','cushion','repeatability','shot delivery','part mass','transfer position'],why:'Connect repeatability signals to the physical shot-delivery system instead of tuning around instability.'},
  {type:'diagnostic',id:'cooling-warpage',courses:[4,6,11,12],keywords:['cooling','warpage','coolant','circuit','mould temperature','thermal balance'],why:'Use cooling-flow and thermal-balance evidence to distinguish a tooling condition from a recipe problem.'},
  {type:'diagnostic',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','hold pressure','part mass','scientific moulding','process window'],why:'Turn packing theory into a controlled study that links one input change to a measured response.'},
  {type:'diagnostic',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','gauge','gage','repeatability','reproducibility','noise','dimension','capability'],why:'Challenge the measurement system before adjusting a stable moulding process to chase noise.'},
  {type:'diagnostic',id:'hot-runner-imbalance',courses:[4,10,11,12],keywords:['hot runner','heater','thermocouple','manifold','branch','cavity balance'],why:'Combine local cavity behaviour with heater/control evidence instead of trusting one displayed temperature.'},
  {type:'diagnostic',id:'local-flash',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tool damage','mould support','clamp force'],why:'Use defect location and tooling history to test a local mechanism before applying global force or pressure.'},

  {type:'data',id:'check-ring-leakage',courses:[1,2,5,7,8,12],keywords:['check ring','non-return','cushion','shot mass','shot delivery','repeatability'],why:'Read correlated cushion, mass and pressure signals across baseline, fault and recovery cycles.'},
  {type:'data',id:'cooling-restriction',courses:[4,6,11,12],keywords:['cooling','coolant','flow','warpage','mould temperature','thermal'],why:'Use a 72-cycle pattern to connect reduced circuit flow with thermal and dimensional response.'},
  {type:'data',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','part mass','pressure area'],why:'Use synthetic study data to recognise the response plateau that supports a gate-seal conclusion.'},
  {type:'data',id:'material-moisture-pc',courses:[3,6,12],keywords:['moisture','drying','polycarbonate','pc','splay','material condition'],why:'Compare material-condition signals with cosmetic and mechanical responses instead of relying on a dryer screen.'},
  {type:'data',id:'hot-runner-zone-drift',courses:[4,10,11,12],keywords:['hot runner','heater duty','zone','temperature drift','thermocouple','controller'],why:'See how control effort and local response can expose a thermal fault even when displayed temperature looks stable.'},
  {type:'data',id:'valve-gate-timing',courses:[4,10,11,12],keywords:['valve gate','sequential','timing','cavity trace','cavity pressure'],why:'Use cavity-specific timing evidence to distinguish a local sequence problem from a global machine change.'},
  {type:'data',id:'local-flash-tooling',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tooling','local defect'],why:'Compare local flash evidence with stable global signals to test a tooling mechanism.'},
  {type:'data',id:'energy-base-load',courses:[1,8,10,12],keywords:['energy','efficiency','economics','cycle time','utility','base load'],why:'Connect stable quality and cycle performance with changing energy demand so efficiency decisions stay evidence based.'},
  {type:'data',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','noise','msa','gauge','gage','dimension','repeatability','reproducibility'],why:'Compare true process stability with rising measurement spread before drawing a process conclusion.'},
  {type:'data',id:'recycled-pp-lot',courses:[3,8,9,12],keywords:['recycled','regrind','polypropylene','pp','mfr','mvr','lot','rheology'],why:'Connect incoming-material lot evidence to pressure, fill and dimensional response instead of copying old settings.'},
  {type:'data',id:'machine-transfer',courses:[1,2,5,7,8,12],keywords:['machine transfer','transfer process','setpoint','actual','machine capability','copy recipe','process transfer'],why:'See why identical screen values on two machines do not guarantee the same physical process response.'},
  {type:'data',id:'cavity-pack-area',courses:[4,5,7,8,11,12],keywords:['cavity pressure','pack area','pressure curve','pressure history','packing','peak pressure'],why:'Use the full pressure-history area to see changes that a single peak value can hide.'},
  {type:'data',id:'screw-barrel-wear',courses:[2,5,8,12],keywords:['screw','barrel','wear','recovery','plasticising','back pressure','melt temperature'],why:'Trend plasticising and recovery signals together before compensating for a changing mechanical system.'},
  {type:'data',id:'ejector-drag',courses:[4,6,10,11,12],keywords:['ejection','ejector','drag','release','draft','eject force'],why:'Connect ejection force, local temperature and part response to a cooling/release mechanism.'},

  {type:'material',id:'pp-vs-pc-drying',courses:[1,3,5],keywords:['polymer family','polypropylene','pp','polycarbonate','pc','drying','grade','material handling'],why:'Compare two resin families to practise using exact grade requirements instead of one generic drying rule.'},
  {type:'material',id:'pc-wet-vs-dry',courses:[3,6,8,12],keywords:['polycarbonate','pc','moisture','drying','splay','hydrolysis','impact'],why:'Connect verified pellet moisture to appearance and property risk after a handling interruption.'},
  {type:'material',id:'pa66-gf30-dry-conditioned',courses:[3,4,8,11,12],keywords:['nylon','pa66','glass fibre','glass fiber','fibre orientation','fiber orientation','conditioning','anisotropy','warpage','shrinkage'],why:'Separate pre-mould drying from post-mould conditioning and connect reinforcement orientation to dimensional behaviour.'},
  {type:'material',id:'abs-thermal-history',courses:[3,5,6,12],keywords:['abs','residence time','thermal history','degradation','purge','black speck','discolour','discolor'],why:'Use process history and restart timing to distinguish thermal degradation from a generic moisture assumption.'},
  {type:'material',id:'pom-thermal-safety',courses:[3,5,6,12],keywords:['pom','acetal','formaldehyde','contamination','thermal degradation','nozzle blockage','material safety'],why:'Practise the point where material identity changes the safe decision space before optimisation can continue.'},
  {type:'material',id:'recycled-pp-lot-rheology',courses:[3,8,9,12],keywords:['recycled','regrind','secondary feedstock','mfr','mvr','rheology','material lot','polypropylene'],why:'Use lot identity, incoming QC and process actuals together when secondary-feedstock rheology changes.'}
]);

const COURSE_FALLBACKS=Object.freeze({
  1:[{type:'diagnostic',id:'pressure-limited-fill'},{type:'data',id:'check-ring-leakage'}],
  2:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}],
  3:[{type:'material',id:'pp-vs-pc-drying'},{type:'data',id:'material-moisture-pc'}],
  4:[{type:'diagnostic',id:'cooling-warpage'},{type:'data',id:'cooling-restriction'}],
  5:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'gate-seal-study'}],
  6:[{type:'diagnostic',id:'cavity-short-shot'},{type:'data',id:'local-flash-tooling'}],
  7:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'cavity-pack-area'}],
  8:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'machine-transfer'}],
  9:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'measurement-noise'}],
  10:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'valve-gate-timing'}],
  11:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'hot-runner-zone-drift'}],
  12:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}]
});

const TYPE_META=Object.freeze({
  diagnostic:{label:'Diagnostic lab',detail:'Reason through a realistic evidence-first fault case.',selector:'data-dl-start'},
  data:{label:'Data diagnosis',detail:'Read baseline → fault → recovery evidence from a 72-cycle synthetic dataset.',selector:'data-pd-start'},
  material:{label:'Material lab',detail:'Apply grade-aware material evidence and safe handling logic.',selector:'data-ml-start'}
});

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function key(route){return `${route.type}:${route.id}`}
function courseFor(lesson){return D.courses.find(c=>c.id===lesson.course)||null}
function libraryFor(type){
  if(type==='diagnostic')return window.MM_DIAGNOSTIC_LABS.labs||[];
  if(type==='data')return window.MM_PROCESS_DATA_DIAGNOSTICS.cases||[];
  if(type==='material')return window.MM_MATERIAL_BEHAVIOUR_LABS.labs||[];
  return [];
}
function itemFor(route){return libraryFor(route.type).find(item=>item.id===route.id)||null}
function routeFor(type,id){return ROUTES.find(r=>r.type===type&&r.id===id)||null}
function lessonText(lesson,course){
  return [lesson.title,lesson.summary,lesson.intro,...(lesson.objectives||[]),...(lesson.keypoints||[]),lesson.exercise,course?.name,course?.description].join(' ').toLowerCase();
}
function scoreRoute(route,lesson,course){
  const title=String(lesson.title||'').toLowerCase();
  const text=lessonText(lesson,course);
  let score=route.courses.includes(lesson.course)?2:0;
  for(const keyword of route.keywords){
    const k=keyword.toLowerCase();
    if(title.includes(k))score+=8;
    else if(text.includes(k))score+=4;
  }
  return score;
}
function expand(routeLike){
  const route=routeFor(routeLike.type,routeLike.id);
  if(!route)return null;
  const item=itemFor(route);
  return item?{...route,item}:null;
}
function recommendationsFor(lesson){
  const course=courseFor(lesson);
  const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,lesson,course)})).filter(x=>itemFor(x.route)).sort((a,b)=>b.score-a.score||key(a.route).localeCompare(key(b.route)));
  const chosen=[];
  const seen=new Set();
  const add=route=>{const expanded=expand(route);if(!expanded||seen.has(key(expanded)))return false;seen.add(key(expanded));chosen.push(expanded);return true};

  const strong=ranked.filter(x=>x.score>2);
  if(strong[0])add(strong[0].route);
  const firstType=chosen[0]?.type;
  const diverse=strong.find(x=>x.route.type!==firstType&&!seen.has(key(x.route)));
  if(diverse)add(diverse.route);
  for(const candidate of strong){if(chosen.length>=2)break;add(candidate.route)}
  for(const fallback of COURSE_FALLBACKS[lesson.course]||[]){if(chosen.length>=2)break;add(fallback)}
  for(const candidate of ranked){if(chosen.length>=2)break;add(candidate.route)}
  return chosen.slice(0,2);
}

function validateCoverage(){
  if(!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('Curriculum integration expects the canonical 120-lesson pathway');
  for(let course=1;course<=12;course++){
    const fallback=COURSE_FALLBACKS[course];
    if(!Array.isArray(fallback)||fallback.length<2)throw new Error(`Curriculum integration missing fallback practice for course ${course}`);
    for(const item of fallback)if(!expand(item))throw new Error(`Curriculum integration fallback is not available: ${item.type}:${item.id}`);
  }
  for(const route of ROUTES)if(!itemFor(route))throw new Error(`Curriculum route points to unavailable practice: ${key(route)}`);
  for(const lesson of D.lessons){
    const recs=recommendationsFor(lesson);
    if(recs.length!==2)throw new Error(`Lesson ${lesson.id} does not have two valid curriculum practice connections`);
  }
}

function setReturn(lessonId){
  try{sessionStorage.setItem(RETURN_KEY,JSON.stringify({lessonId:Number(lessonId),at:Date.now()}))}catch(_){}
  updateReturnButton();
}
function getReturn(){
  try{const x=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');return x&&Number.isInteger(Number(x.lessonId))?x:null}catch(_){return null}
}
function clearReturn(){try{sessionStorage.removeItem(RETURN_KEY)}catch(_){}updateReturnButton()}
function practiceButton(type,id){
  const attr=TYPE_META[type]?.selector;
  return attr?document.querySelector(`[${attr}="${id}"]`):null;
}
function openPractice(type,id,lessonId){
  const route=expand({type,id});
  if(!route)return toast?.('Linked practice is unavailable');
  setReturn(lessonId);
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_practice_open',{module:type,id});
  if(type==='diagnostic')window.MM_DIAGNOSTIC_LABS.open();
  else if(type==='data')window.MM_PROCESS_DATA_DIAGNOSTICS.open();
  else if(type==='material')window.MM_MATERIAL_BEHAVIOUR_LABS.open();
  requestAnimationFrame(()=>{
    const button=practiceButton(type,id);
    if(button)button.click();
    else toast?.('Open the recommended practice from this activity list');
    updateReturnButton();
  });
}
window.mmCurriculumOpen=openPractice;

function returnToLesson(){
  const origin=getReturn();
  if(!origin)return;
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  if(!lesson){clearReturn();return}
  user.currentLesson=lesson.id;
  persist();
  clearReturn();
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_return',{module:'lesson',id:String(lesson.id)});
  switchView('lesson');
  toast?.('Returned to linked lesson');
}
window.mmCurriculumReturn=returnToLesson;

function ensureReturnButton(){
  let button=document.getElementById('mmCurriculumReturnButton');
  if(button)return button;
  button=document.createElement('button');
  button.id='mmCurriculumReturnButton';
  button.type='button';
  button.className='secondary mm-curriculum-return hidden';
  button.addEventListener('click',returnToLesson);
  document.body.appendChild(button);
  return button;
}
function updateReturnButton(){
  const button=ensureReturnButton();
  const origin=getReturn();
  const lessonVisible=!document.getElementById('lesson')?.classList.contains('hidden');
  if(!origin||lessonVisible){button.classList.add('hidden');return}
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  button.textContent=lesson?`← Return to lesson ${lesson.id}`:'← Return to lesson';
  button.classList.remove('hidden');
}

const style=document.createElement('style');
style.id='mm-curriculum-integration-style';
style.textContent=`
.mm-curriculum-section{margin-top:24px;padding:18px;border:1px solid #38617a;border-radius:15px;background:linear-gradient(135deg,#0f2638,#11243a)}
.mm-curriculum-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.mm-curriculum-head h3{margin:5px 0 6px}.mm-curriculum-head p{margin:0;color:#bdd0e2;line-height:1.5;max-width:760px}
.mm-curriculum-loop{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mm-curriculum-loop span{font-size:10px;padding:5px 8px;border:1px solid #3a5877;border-radius:999px;background:#102137;color:#c6d8ea}.mm-curriculum-loop b{color:var(--accent)}
.mm-curriculum-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.mm-curriculum-card{padding:14px;border:1px solid #34516e;border-radius:12px;background:#0d1d31}.mm-curriculum-card h4{margin:6px 0 7px;font-size:16px}.mm-curriculum-card p{margin:0;color:#b9cade;font-size:12px;line-height:1.5}.mm-curriculum-card .mm-next-actions{margin-top:11px}
.mm-curriculum-type{font-size:10px;text-transform:uppercase;letter-spacing:.11em;color:var(--accent);font-weight:800}.mm-curriculum-boundary{margin-top:12px;font-size:11px;color:#9fb4ca;line-height:1.5}.mm-curriculum-boundary b{color:#d8e5f1}
.mm-curriculum-focus{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:-3px 0 14px;padding:13px 15px;border:1px solid #304d6b;border-radius:13px;background:#0e1e31}.mm-curriculum-focus p{margin:3px 0 0;color:#aebfd1;font-size:12px;line-height:1.4}.mm-curriculum-focus b{display:block}
.mm-curriculum-return{position:fixed;right:18px;bottom:18px;z-index:24;box-shadow:0 10px 30px rgba(0,0,0,.35)}
@media(max-width:760px){.mm-curriculum-grid{grid-template-columns:1fr}.mm-curriculum-focus{align-items:stretch;flex-direction:column}.mm-curriculum-focus button{width:100%}.mm-curriculum-return{right:12px;bottom:78px;max-width:calc(100vw - 24px)}}
`;
document.head.appendChild(style);

function cardHtml(rec,index,lessonId){
  const meta=TYPE_META[rec.type];
  const title=rec.item.title||rec.id;
  const detail=index===0?'Best fit for this lesson':'Evidence extension';
  return `<article class="mm-curriculum-card"><span class="mm-curriculum-type">${esc(meta.label)} · ${detail}</span><h4>${esc(title)}</h4><p>${esc(rec.why||meta.detail)}</p><div class="mm-next-actions"><button class="secondary" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lessonId)})">Open linked practice →</button></div></article>`;
}
function decorateLesson(){
  const root=document.getElementById('lesson');
  const lesson=currentLesson();
  const notes=root?.querySelector('#mmNotes')||[...(root?.querySelectorAll('.lesson-body h3')||[])].find(h=>h.textContent.trim()==='Your lesson notes');
  if(!root||!notes||root.querySelector('#mmCurriculumPractice'))return;
  const recs=recommendationsFor(lesson);
  notes.insertAdjacentHTML('beforebegin',`<section class="mm-curriculum-section" id="mmCurriculumPractice" aria-label="Linked curriculum practice"><div class="mm-curriculum-head"><div><span class="eyebrow">Theory → practice → evidence</span><h3>Apply this lesson</h3><p>Use the concept you just studied in two guided activities. The first is the closest fit; the second strengthens the evidence habit from another angle.</p></div><span class="pill">2 linked activities</span></div><div class="mm-curriculum-loop"><span><b>1</b> Learn the mechanism</span><span><b>2</b> Make a diagnosis</span><span><b>3</b> Read the evidence</span><span><b>4</b> Return and explain</span></div><div class="mm-curriculum-grid">${recs.map((rec,index)=>cardHtml(rec,index,lesson.id)).join('')}</div><div class="mm-curriculum-boundary"><b>Learning boundary:</b> linked practice is optional formative learning. It does not change formal assessment answers, certificate rules or production setpoints.</div></section>`);
  const jumps=root.querySelector('.mm-learning-jumps');
  if(jumps&&!jumps.querySelector('[data-mm-curriculum-jump]'))jumps.insertAdjacentHTML('beforeend','<button type="button" data-mm-curriculum-jump data-mm-onclick="mmLearningJump(\'mmCurriculumPractice\')">Linked practice</button>');
  const origin=getReturn();
  if(origin&&Number(origin.lessonId)===lesson.id)clearReturn();
}
function decorateDashboard(){
  const root=document.getElementById('dashboard');
  if(!root||root.querySelector('.mm-curriculum-focus'))return;
  const lesson=currentLesson();
  const rec=recommendationsFor(lesson)[0];
  if(!rec)return;
  const focus=root.querySelector('.mm-today-focus');
  const html=`<section class="mm-curriculum-focus" aria-label="Current lesson practice connection"><div><span class="eyebrow">Learning loop</span><b>After ${esc(lesson.title)}: ${esc(rec.item.title||rec.id)}</b><p>Move from the lesson explanation into guided practice, then return to explain what evidence changed your conclusion.</p></div><button class="ghost" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lesson.id)})">Open linked practice</button></section>`;
  if(focus)focus.insertAdjacentHTML('afterend',html);else root.insertAdjacentHTML('afterbegin',html);
}

const originalRenderLesson=renderLesson;
const originalRenderDashboard=renderDashboard;
renderLesson=function(){originalRenderLesson();decorateLesson();updateReturnButton()};
renderDashboard=function(){originalRenderDashboard();decorateDashboard();updateReturnButton()};

validateCoverage();
ensureReturnButton();
window.MM_CURRICULUM_INTEGRATION={
  version:VERSION,
  recommendations:lessonId=>{const lesson=D.lessons.find(l=>l.id===Number(lessonId));return lesson?recommendationsFor(lesson).map(r=>({type:r.type,id:r.id,title:r.item.title||r.id,why:r.why})):[]},
  open:openPractice,
  returnToLesson,
  coverage:{lessons:D.lessons.length,courses:D.courses.length,linksPerLesson:2},
  scope:'Formative curriculum links from lessons to existing diagnostic, material and synthetic-data practice; no formal assessment mutation and no production recipe.'
};

if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
updateReturnButton();
})();