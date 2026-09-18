/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: bootstrap-assessment-source-runtime-pack.js
 */

/* >>> assessment-runtime-v2.js */
/* MouldMaster assessment runtime v2 — blueprint-preserving bank rotation 2026-09-01 */
(function(){
'use strict';
if(window.MM_ASSESSMENT_RUNTIME_V2)return;
const VERSION='2026.09.01.3';
const STORAGE_BASE='mm_assessment_membership_history_v2';
const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting'];
const D=window.MM_DATA,R=window.MM_RUNTIME_V2;
if(!D||!D.exams||!D.regionalQuestions)throw new Error('assessment-runtime-v2.js requires the canonical assessment bank');
if(!R||typeof R.setImplementation!=='function')throw new Error('assessment-runtime-v2.js requires runtime-v2.js');
if(typeof window.getExamQuestions!=='function')throw new Error('assessment-runtime-v2.js requires the audited assessment selector');
function storageKey(){return R.storage.key(STORAGE_BASE)}
function emptyHistory(){return {schema:2,version:VERSION,forms:{},items:{}}}
function readHistory(){const x=R.storage.get(STORAGE_BASE,null);return x&&x.schema===2&&x.version===VERSION&&x.items&&x.forms?x:emptyHistory()}
function writeHistory(x){x.version=VERSION;return R.storage.set(STORAGE_BASE,x)}
function resetHistory(){return R.storage.remove(STORAGE_BASE)}
function norm(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ')}
function competencies(text){
  const t=norm(text),out=[];
  if(/resin|polymer|material|moisture|dry|mfr|mvr|rheolog|viscos|melt temp|crystalli|regrind|recycl|degrad/.test(t))out.push('materials');
  if(/machine|screw|cushion|recovery|non-return|check ring|barrel|controller|setpoint|injection unit|clamp|transfer position|hydraulic|servo/.test(t))out.push('machine');
  if(/mould|mold|cavity|gate|runner|vent|cooling|water line|parting line|ejection|hot runner|valve gate|surface temperature|tool/.test(t))out.push('tooling');
  if(/fill|pack|hold|gate seal|velocity|pressure|cycle|process window|transfer|shot|flow|shear|residence/.test(t))out.push('process');
  if(/cpk|ppk|capability|measurement|gauge|gage|doe|experiment|random|block|validation|specification|sample|control chart|quality|dimension/.test(t))out.push('quality');
  if(/diagnos|troubleshoot|first|strongest|investigat|drift|changes|becomes|fails|defect|short shot|flash|sink|splay|burn|weld|warpage|brittle|disagree|evidence/.test(t))out.push('troubleshooting');
  return [...new Set(out)]
}
function concept(text){
  const t=norm(text),defs=[
    ['moisture-drying',/moisture|hygroscopic|dry/],['mfr-rheology',/\bmfr\b|\bmvr\b|rheolog|viscos/],['gate-seal',/gate seal|gate freeze|mass plateau/],
    ['cavity-pressure',/cavity pressure|in-cavity|machine peak pressure/],['shot-delivery',/cushion|non-return|check ring|shot delivery|recovery/],
    ['cooling-thermal',/cooling|water line|mould-surface|mold-surface|warpage/],['capability',/cpk|ppk|capability/],['measurement',/measurement|gauge|gage|fixture/],
    ['doe',/\bdoe\b|experiment|randomis|randomiz|blocking|confound/],['process-transfer',/receiving machine|process equivalence|transfer strategy/],
    ['setpoint-actual',/setpoint|saved recipe|known-good baseline/],['tooling-locality',/one cavity|local flow|branch|parting line|gate wear/]
  ];
  for(const [id,re] of defs)if(re.test(t))return id;
  return t.split(/[^a-z0-9]+/).filter(x=>x.length>4).slice(0,4).join('-')||'general'
}
function tech(level,i,q){
  const text=q?.q??q?.[0]??'',options=q?.options??q?.[1]??[],correct=Number(q?.correct??q?.[2]??0),feedback=q?.optionFeedback??q?.feedback??q?.[6]??[];
  const cs=competencies(text);return {q:text,options:[...options],correct,explanation:q?.explanation??q?.why??q?.[3]??'',reference:q?.reference??q?.source??q?.[4]??'',sourceUrl:q?.sourceUrl??q?.url??q?.[5]??null,optionFeedback:[...feedback],critical:!!(q?.critical??q?.[7]),kind:'technical',level,bankIndex:i,stableId:`tech:${level}:${i}`,mmId:`tech:${level}:${i}`,competencies:cs,competency:cs[0]||BLUEPRINT[i%BLUEPRINT.length],concept:concept(text)}
}
function regional(region,level,i,q){
  return {q:q?.q??q?.[0]??'',options:[...(q?.options??q?.[1]??[])],correct:Number(q?.correct??q?.[2]??0),explanation:q?.explanation??q?.why??q?.[3]??'',reference:q?.reference??q?.source??q?.[4]??'',sourceUrl:q?.sourceUrl??q?.url??q?.[5]??null,optionFeedback:[...(q?.optionFeedback??q?.feedback??q?.[6]??[])],critical:(q?.critical??q?.[7])!==false,kind:'regional',region,level,bankIndex:i,stableId:`reg:${region}:${level}:${i}`,mmId:`reg:${region}:${level}:${i}`,competencies:['safety'],competency:'safety',concept:`safety-${region.toLowerCase()}-${i}`}
}
function seeded(seed){let x=2166136261;for(const c of String(seed)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function shuffle(a,rng){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function shuffleOptions(item,rng){const rows=item.options.map((text,i)=>({text,correct:i===item.correct,feedback:item.optionFeedback?.[i]??null}));const mixed=shuffle(rows,rng);return {...item,options:mixed.map(x=>x.text),optionFeedback:mixed.map(x=>x.feedback),correct:mixed.findIndex(x=>x.correct)}}
function exposure(history,id){return history.items[id]||{count:0,last:-1}}
function rank(pool,history,rng){
  const tie=new Map(pool.map(x=>[x.stableId,rng()]));
  return pool.slice().sort((a,b)=>{const ea=exposure(history,a.stableId),eb=exposure(history,b.stableId);return ea.count-eb.count||ea.last-eb.last||tie.get(a.stableId)-tie.get(b.stableId)})
}
function selectTechnical(level,history,formNumber,rng){
  const pool=(D.exams[level]||[]).map((q,i)=>tech(level,i,q));
  if(pool.length!==10)throw new Error(`assessment runtime v2 expects 10 technical items for ${level}; found ${pool.length}`);
  const chosen=[],used=new Set(),add=item=>{if(!item||used.has(item.stableId))return false;chosen.push(item);used.add(item.stableId);return true};
  for(const domain of BLUEPRINT){const candidates=pool.filter(x=>!used.has(x.stableId)&&x.competencies.includes(domain));if(candidates.length)add(rank(candidates,history,rng)[0])}
  while(chosen.length<7){const remaining=pool.filter(x=>!used.has(x.stableId));if(!remaining.length)break;const concepts=new Set(chosen.map(x=>x.concept)),diverse=remaining.filter(x=>!concepts.has(x.concept));add(rank(diverse.length?diverse:remaining,history,rng)[0])}
  if(chosen.length!==7)throw new Error(`assessment runtime v2 could select only ${chosen.length}/7 technical items for ${level}`);
  const covered=new Set();for(const q of chosen)for(const c of q.competencies)covered.add(c);const missing=BLUEPRINT.filter(x=>!covered.has(x));if(missing.length)throw new Error(`assessment runtime v2 blueprint incomplete for ${level}: ${missing.join(', ')}`);
  return chosen
}
function selectRegional(region,level,rng){
  if(region==='ALL'){const out=[];for(const r of ['UK','US','NZ'])for(let i=0;i<(D.regionalQuestions[r]?.[level]||[]).length;i++)out.push(regional(r,level,i,D.regionalQuestions[r][level][i]));return out}
  return shuffle((D.regionalQuestions[region]?.[level]||[]).map((q,i)=>regional(region,level,i,q)),rng).slice(0,3)
}
function nextExam(level,region){
  const history=readHistory(),formNumber=Number(history.forms[level]||0)+1,rng=seeded(`${R.storage.learnerToken()}:${level}:${region}:${formNumber}`);
  const technical=selectTechnical(level,history,formNumber,rng),regs=selectRegional(region,level,rng),selected=[...technical,...regs];history.forms[level]=formNumber;
  for(const q of technical){const e=exposure(history,q.stableId);history.items[q.stableId]={count:e.count+1,last:formNumber}}writeHistory(history);
  return shuffle(selected,rng).map(q=>shuffleOptions(q,rng))
}
const legacySelector=window.getExamQuestions;
function selector(level,region){if(!['Beginner','Intermediate','Advanced'].includes(level)||!['UK','US','NZ','ALL'].includes(region))return legacySelector.apply(this,arguments);return nextExam(level,region)}
R.setImplementation('getExamQuestions',selector,'assessment-runtime-v2');
R.registerModule('assessment-runtime-v2',{version:VERSION,type:'assessment-selector',owns:'getExamQuestions'});
function coverageSimulation(level,attempts=3){const history=emptyHistory(),seen=new Set();for(let n=1;n<=attempts;n++){const rng=seeded(`qa:${level}:${n}`),rows=selectTechnical(level,history,n,rng);for(const q of rows){seen.add(q.stableId);const e=exposure(history,q.stableId);history.items[q.stableId]={count:e.count+1,last:n}}}return {level,attempts,seen:[...seen],coverage:seen.size,total:(D.exams[level]||[]).length}}
window.MM_ASSESSMENT_RUNTIME_V2=Object.freeze({version:VERSION,blueprint:[...BLUEPRINT],technicalPerExam:7,technicalBankPerLevel:10,membershipHistory:'learner-scoped persistent exposure counts; each generated form advances exposure because displaying an item is itself exposure',selectionPolicy:'least-exposed blueprint-preserving stable IDs; all six domains required every generated form',storageKey,resetHistory,history:()=>JSON.parse(JSON.stringify(readHistory())),coverageSimulation});
})();
/* <<< assessment-runtime-v2.js */

/* >>> assessment-ux.js */
/* MouldMaster assessment experience — question-only focus mode 2026-09-10.1 */
(function(){
'use strict';

const VERSION='2026.09.10.1';
const FIRST_HISTORY_LIMIT=3;
const HISTORY_KEY='mm_assessment_opening_history_v2';
const LEGACY_HISTORY_KEY='mm_assessment_opening_history_v1';
const R=window.MM_RUNTIME_V2;
if(!R?.storage||typeof R.transform!=='function'||typeof R.after!=='function')throw new Error('assessment-ux.js requires runtime-v2 transform/after hooks');
const root=document.documentElement;
const firstQuestionHistory=new Map();
try{localStorage.removeItem(LEGACY_HISTORY_KEY)}catch(_){}

function readQuestionHistory(){
  try{
    const raw=R.storage.get(HISTORY_KEY,{});
    firstQuestionHistory.clear();
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return true;
    for(const [scope,ids] of Object.entries(raw)){
      if(!Array.isArray(ids))continue;
      const clean=ids.map(x=>String(x||'').trim()).filter(Boolean).slice(0,FIRST_HISTORY_LIMIT);
      if(clean.length)firstQuestionHistory.set(scope,clean);
    }
    return true;
  }catch(_){return false}
}
function persistQuestionHistory(){
  try{
    const out={};
    for(const [scope,ids] of firstQuestionHistory.entries()){
      const clean=(Array.isArray(ids)?ids:[]).map(x=>String(x||'').trim()).filter(Boolean).slice(0,FIRST_HISTORY_LIMIT);
      if(clean.length)out[scope]=clean;
    }
    return R.storage.set(HISTORY_KEY,out);
  }catch(_){return false}
}
readQuestionHistory();

function addStyles(){
  if(document.getElementById('mm-assessment-ux-style'))return;
  const s=document.createElement('style');
  s.id='mm-assessment-ux-style';
  s.textContent=`
  .modal-card.mm-assessment-modal{width:min(980px,96vw);padding:clamp(18px,3vw,30px);scroll-padding-bottom:110px}
  .mm-assessment-modal .mm-exam-prelude,.mm-assessment-modal .mm-question-meta,.mm-assessment-modal .mm-qmeta,.mm-assessment-modal .question-plain-language,.mm-assessment-modal .mm-confidence{display:none!important}
  .mm-assessment-modal [id^="mmDialogTitle"]{margin:0 42px 10px 0;font-size:clamp(20px,2.5vw,27px)}
  #examQuestions.mm-focus-mode{margin-top:18px}
  #examQuestions.mm-focus-mode .question{display:none!important;margin:0;padding:clamp(18px,3vw,28px);border:1px solid #314a69;border-radius:16px;background:linear-gradient(180deg,#10213a,#0c1a2e);box-shadow:0 14px 34px rgba(0,0,0,.18)}
  #examQuestions.mm-focus-mode .question.mm-current-question{display:block!important}
  .mm-question-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px;color:#98acc9;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
  .mm-question-stem{display:block;font-size:clamp(18px,2.4vw,24px);line-height:1.45;color:#f4f8ff;margin:0 0 18px;font-weight:760}
  .mm-option-card{display:grid!important;grid-template-columns:22px 32px minmax(0,1fr);gap:10px;align-items:start;min-height:52px;padding:13px 14px!important;margin:9px 0!important;border:1px solid #355171!important;border-radius:12px!important;background:#102039!important;color:#e8f1fc!important;line-height:1.5;cursor:pointer;transition:border-color .12s ease,background .12s ease,transform .12s ease}
  .mm-option-card:hover{border-color:#5f84aa!important;background:#142943!important}
  .mm-option-card:focus-within{outline:3px solid rgba(105,168,255,.3);outline-offset:2px}
  .mm-option-card input[type=radio]{width:18px;height:18px;margin:3px 0 0;accent-color:#69a8ff}
  .mm-option-key{width:29px;height:29px;border-radius:9px;display:grid;place-items:center;background:#1c314e;border:1px solid #395879;color:#bcd2ed;font-weight:800;font-size:12px;line-height:1}
  .mm-option-card.mm-option-selected{border-color:#69a8ff!important;background:#17314f!important;box-shadow:inset 3px 0 0 #69a8ff}
  .mm-option-card.mm-option-selected .mm-option-key{background:#69a8ff;color:#07131b;border-color:#69a8ff}
  .mm-exam-steps{display:flex;gap:6px;flex-wrap:wrap;margin:16px 0 10px}
  .mm-step{width:38px;height:38px;border-radius:10px;border:1px solid #355171;background:#102039;color:#a9bdd6;font-size:12px;font-weight:800;padding:0}
  .mm-step:hover{background:#172b46;color:#fff}
  .mm-step.mm-step-answered{border-color:#3e756b;color:#cffff5;background:#12302e}
  .mm-step.mm-step-current{outline:2px solid #69a8ff;outline-offset:2px;color:#fff}
  .mm-exam-nav{position:sticky;bottom:-1px;z-index:8;margin-top:16px;padding:12px;border:1px solid #304a69;border-radius:14px;background:rgba(8,18,32,.96);backdrop-filter:blur(12px);box-shadow:0 -8px 28px rgba(0,0,0,.2)}
  .mm-exam-nav-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
  .mm-exam-progress{font-weight:800;color:#edf5ff}.mm-exam-answered{font-size:12px;color:#9fb4ce}
  .mm-exam-actions{display:flex;justify-content:space-between;gap:9px;align-items:center}
  .mm-exam-actions .primary,.mm-exam-actions .secondary{min-height:44px}
  .mm-exam-actions .mm-native-grade{margin-left:auto}
  .mm-exam-actions button[disabled]{cursor:not-allowed;opacity:.48}
  .mm-unanswered-note{color:#ffd166;font-size:12px;margin-left:auto;text-align:right}
  .mm-exam-reviewed #examQuestions,.mm-exam-reviewed .mm-exam-nav,.mm-exam-reviewed .mm-exam-steps{display:none!important}
  .mm-exam-reviewed #examResult{margin-top:18px;font-size:16px;line-height:1.55}
  .mm-exam-reviewed .answer-review{gap:12px}
  .mm-exam-reviewed .answer-row{padding:15px 16px;border-radius:12px;line-height:1.5}
  .mm-exam-reviewed .answer-row.correct{background:#0d2925;border-color:#397466}
  .mm-exam-reviewed .answer-row.incorrect{background:#2a171d;border-color:#74424d}
  .scenario .choice.mm-choice-selected{border-color:#69a8ff;background:#17314f;box-shadow:inset 3px 0 0 #69a8ff}
  .scenario .choice.mm-choice-correct{border-color:#397466;background:#0d2925;box-shadow:inset 3px 0 0 #7ce6a3}
  .scenario .choice.mm-choice-review{border-color:#74424d;background:#2a171d;box-shadow:inset 3px 0 0 #ff7b7b}
  @media(max-width:680px){
    .modal{padding:0}.modal-card.mm-assessment-modal{width:100vw;max-width:none;max-height:100dvh;min-height:100dvh;border-radius:0;padding:18px 15px 120px}
    #examQuestions.mm-focus-mode .question{padding:18px 14px;border-radius:13px}
    .mm-question-stem{font-size:19px;line-height:1.5}
    .mm-option-card{grid-template-columns:20px 30px minmax(0,1fr);padding:12px 11px!important;font-size:14px}
    .mm-exam-steps{gap:5px}.mm-step{width:38px;height:38px;border-radius:9px}
    .mm-exam-nav{position:fixed;left:0;right:0;bottom:0;border-radius:14px 14px 0 0;margin:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -14px 34px rgba(0,0,0,.34)}
    .mm-exam-nav-top{margin-bottom:8px}.mm-exam-actions{display:grid;grid-template-columns:1fr 1fr}.mm-exam-actions .mm-native-grade{grid-column:1/-1;width:100%;margin:0}
    .mm-unanswered-note{grid-column:1/-1;text-align:left;margin:0}
  }
  @media(prefers-reduced-motion:reduce){.mm-option-card{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function questionIdentity(item){return String(item?.stableId||item?.mmId||item?.id||item?.q||'').trim()}
function questionScope(level,region){return `${String(level||'unknown')}::${String(region||'ALL')}`}
function rotateOpeningQuestion(rows,level,region){
  if(!Array.isArray(rows)||rows.length<2)return rows;
  readQuestionHistory();
  const scope=questionScope(level,region);
  const recent=firstQuestionHistory.get(scope)||[];
  const current=questionIdentity(rows[0]);
  if(current&&recent.includes(current)){
    let swap=rows.findIndex((item,index)=>index>0&&questionIdentity(item)&&!recent.includes(questionIdentity(item)));
    if(swap<1)swap=rows.findIndex((item,index)=>index>0&&questionIdentity(item)!==current);
    if(swap>0)[rows[0],rows[swap]]=[rows[swap],rows[0]];
  }
  const first=questionIdentity(rows[0]);
  if(first){
    const limit=Math.min(FIRST_HISTORY_LIMIT,Math.max(1,rows.length-1));
    firstQuestionHistory.set(scope,[first,...recent.filter(id=>id!==first)].slice(0,limit));
    persistQuestionHistory();
  }
  return rows;
}
function resetQuestionRotation(){firstQuestionHistory.clear();R.storage.remove(HISTORY_KEY)}

function hasAnswer(card){return !!card.querySelector('label.option input[type=radio]:checked')}
function stripLegacyAttemptControls(card){card.querySelectorAll('.mm-confidence').forEach(control=>control.remove())}
function optionLabels(card,index){
  const labels=[...card.querySelectorAll('label.option')];
  labels.forEach((label,j)=>{
    label.classList.add('mm-option-card');
    const input=label.querySelector('input[type=radio]');
    if(!input)return;
    if(!label.querySelector('.mm-option-key')){
      const key=document.createElement('span');
      key.className='mm-option-key';key.setAttribute('aria-hidden','true');key.textContent=String.fromCharCode(65+j);input.insertAdjacentElement('afterend',key);
    }
    const sync=()=>{
      labels.forEach(x=>x.classList.toggle('mm-option-selected',!!x.querySelector('input[type=radio]:checked')));
      const step=document.querySelector(`.mm-step[data-mm-question="${index}"]`);
      if(step)step.classList.toggle('mm-step-answered',hasAnswer(card));
      updateAssessmentStatus();
    };
    input.addEventListener('change',sync,{passive:true});
  });
}

let state=null;
function updateAssessmentStatus(){
  if(!state)return;
  const answered=state.cards.filter(hasAnswer).length;
  const remaining=state.cards.length-answered;
  state.answered.textContent=`${answered}/${state.cards.length} answered`;
  state.grade.disabled=remaining>0;
  state.grade.title=remaining?`Answer ${remaining} remaining question${remaining===1?'':'s'} before grading`:'Grade and review every answer';
  state.unanswered.textContent=remaining?`${remaining} unanswered`:'Ready to grade';
  state.steps.forEach((step,i)=>step.classList.toggle('mm-step-answered',hasAnswer(state.cards[i])));
  if(state.current===state.cards.length-1){state.next.textContent=remaining?'Review unanswered':'All questions answered';state.next.disabled=!remaining}
  else{state.next.textContent='Next question';state.next.disabled=false}
}
function showQuestion(index,moveFocus){
  if(!state)return;
  const max=state.cards.length-1;
  state.current=Math.max(0,Math.min(index,max));
  state.cards.forEach((card,i)=>{const on=i===state.current;card.classList.toggle('mm-current-question',on);card.setAttribute('aria-hidden',on?'false':'true')});
  state.steps.forEach((step,i)=>{step.classList.toggle('mm-step-current',i===state.current);if(i===state.current)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current')});
  state.progress.textContent=`Question ${state.current+1} of ${state.cards.length}`;
  state.prev.disabled=state.current===0;
  updateAssessmentStatus();
  if(moveFocus){
    const stem=state.cards[state.current].querySelector('.mm-question-stem');
    if(stem){try{stem.focus({preventScroll:true})}catch(_){stem.focus()}}
    try{state.cards[state.current].scrollIntoView({block:'nearest',behavior:root.matches(':root')&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}
  }
}
function firstUnanswered(){if(!state)return -1;return state.cards.findIndex(card=>!hasAnswer(card))}

function decorateExam(){
  const host=document.getElementById('examQuestions');
  if(!host||host.dataset.mmAssessmentUx==='1')return;
  const cards=[...host.querySelectorAll('.question')];if(!cards.length)return;
  const modal=host.closest('.modal-card')||host.parentElement;if(!modal)return;
  const grade=[...modal.querySelectorAll('button')].find(b=>/Grade\s*&?\s*review/i.test(b.textContent||''));if(!grade)return;
  host.dataset.mmAssessmentUx='1';host.classList.add('mm-focus-mode');modal.classList.add('mm-assessment-modal');
  const title=modal.querySelector('[id^="mmDialogTitle"],h2');
  if(title){title.classList.remove('mm-exam-prelude');title.removeAttribute('aria-hidden')}
  for(let node=host.previousElementSibling;node;node=node.previousElementSibling){
    if(node===title||node.matches?.('[id^="mmDialogTitle"]'))continue;
    node.classList.add('mm-exam-prelude');node.setAttribute('aria-hidden','true');
    node.querySelectorAll?.('button,a,input,select,textarea,[tabindex]').forEach(control=>control.tabIndex=-1);
  }
  cards.forEach((card,i)=>{
    stripLegacyAttemptControls(card);
    const stem=card.querySelector('b');
    if(stem){
      stem.classList.add('mm-question-stem');stem.id=`mm-question-stem-${i}`;stem.tabIndex=-1;card.setAttribute('role','group');card.setAttribute('aria-labelledby',stem.id);
      const meta=document.createElement('div');meta.className='mm-question-meta';meta.innerHTML=`<span>Question ${i+1}</span><span>${i===cards.length-1?'Final question':'Choose the best answer'}</span>`;stem.insertAdjacentElement('beforebegin',meta);
    }
    optionLabels(card,i);
  });
  const steps=document.createElement('div');steps.className='mm-exam-steps';steps.setAttribute('aria-label','Assessment question navigation');
  cards.forEach((_card,i)=>{const b=document.createElement('button');b.type='button';b.className='mm-step';b.dataset.mmQuestion=String(i);b.textContent=String(i+1);b.setAttribute('aria-label',`Go to question ${i+1}`);b.addEventListener('click',()=>showQuestion(i,true));steps.appendChild(b)});
  host.insertAdjacentElement('beforebegin',steps);
  const nav=document.createElement('div');nav.className='mm-exam-nav';nav.innerHTML=`<div class="mm-exam-nav-top"><div><div class="mm-exam-progress" aria-live="polite"></div><div class="mm-exam-answered"></div></div><div class="mm-unanswered-note" aria-live="polite"></div></div><div class="mm-exam-actions"><button type="button" class="secondary mm-exam-prev">Previous</button><button type="button" class="secondary mm-exam-next">Next question</button></div>`;
  host.insertAdjacentElement('afterend',nav);
  const actions=nav.querySelector('.mm-exam-actions');grade.classList.add('mm-native-grade');actions.appendChild(grade);
  state={modal,host,cards,steps:[...steps.querySelectorAll('.mm-step')],nav,grade,current:0,progress:nav.querySelector('.mm-exam-progress'),answered:nav.querySelector('.mm-exam-answered'),unanswered:nav.querySelector('.mm-unanswered-note'),prev:nav.querySelector('.mm-exam-prev'),next:nav.querySelector('.mm-exam-next')};
  state.prev.addEventListener('click',()=>showQuestion(state.current-1,true));
  state.next.addEventListener('click',()=>{if(state.current<state.cards.length-1)showQuestion(state.current+1,true);else{const i=firstUnanswered();if(i>=0)showQuestion(i,true)}});
  grade.disabled=true;showQuestion(0,false);
}
function decorateReview(){
  const result=document.getElementById('examResult');const review=document.getElementById('answerReview');if(!result||result.classList.contains('hidden')||!review)return;
  const raw=(result.textContent||'').replace(/\s+/g,' ').trim();
  const score=raw.match(/(\d+)\s*\/\s*(\d+)\s+correct\s*[—-]\s*(\d+)%/i);
  const passed=/\bPass\s*✓/i.test(raw)&&!/\bNot passed/i.test(raw);
  const safety=raw.match(/(\d+)\s+safety-critical regional answer\(s\) need correction/i);
  const earned=/certificate earned/i.test(raw);
  const modal=result.closest('.modal-card');if(modal)modal.classList.add('mm-exam-reviewed');
  const rows=[...review.querySelectorAll('.answer-row')];
  const wrong=rows.filter(row=>!row.classList.contains('correct'));
  rows.forEach((row,i)=>{
    const isCorrect=row.classList.contains('correct');
    if(isCorrect){row.hidden=true;row.setAttribute('aria-hidden','true');row.tabIndex=-1;row.removeAttribute('role');return}
    row.hidden=false;row.removeAttribute('aria-hidden');row.tabIndex=0;row.setAttribute('role','listitem');
    const heading=row.querySelector(':scope > b');
    const number=(heading?.textContent||'').match(/^\s*(\d+)\./)?.[1]||String(i+1);
    if(heading)heading.textContent=`Question ${number}`;
    const ref=row.querySelector(':scope > .ref');
    if(ref&&!ref.closest('.mm-review-source')){
      const details=document.createElement('details');details.className='mm-review-source';
      const summary=document.createElement('summary');summary.textContent='Source';details.appendChild(summary);
      ref.replaceWith(details);details.appendChild(ref);
    }
    row.setAttribute('aria-label',`Question ${number}: review needed`);
  });
  let intro=document.getElementById('mmReviewIntro');
  if(!intro){intro=document.createElement('div');intro.id='mmReviewIntro';intro.className='mm-review-intro';review.insertAdjacentElement('beforebegin',intro)}
  if(wrong.length){
    intro.hidden=false;intro.innerHTML='<h3>Review these answers</h3><p></p>';intro.querySelector('p').textContent=`${wrong.length} answer${wrong.length===1?'':'s'} to check before your next attempt.`;
    review.hidden=false;review.setAttribute('role','list');review.setAttribute('aria-label','Answers to review');
  }else{
    intro.hidden=true;review.hidden=true;review.removeAttribute('role');review.removeAttribute('aria-label');
  }
  const summary=document.createElement('section');summary.className='mm-result-summary';summary.setAttribute('aria-label','Assessment result');
  const eyebrow=document.createElement('p');eyebrow.className='mm-result-eyebrow';eyebrow.textContent='Assessment result';summary.appendChild(eyebrow);
  const main=document.createElement('div');main.className='mm-result-main';
  const scoreEl=document.createElement('strong');scoreEl.className='mm-result-score';scoreEl.textContent=score?`${score[3]}%`:'Complete';
  const status=document.createElement('span');status.className='mm-result-status';status.textContent=passed?'Passed':'Review needed';
  main.append(scoreEl,status);summary.appendChild(main);
  const message=document.createElement('p');message.className='mm-result-message';
  message.textContent=wrong.length?(passed?`${wrong.length} answer${wrong.length===1?'':'s'} to review below.`:`Review ${wrong.length} answer${wrong.length===1?'':'s'} below, then try again.`):'All answers are correct. You’re done.';
  summary.appendChild(message);
  if(earned){const note=document.createElement('p');note.className='mm-result-note';note.textContent='Certificate earned.';summary.appendChild(note)}
  if(safety){const warning=document.createElement('p');warning.className='mm-result-safety';warning.textContent=`${safety[1]} safety-critical answer${safety[1]==='1'?'':'s'} must be corrected before this assessment can pass.`;summary.appendChild(warning)}
  result.replaceChildren(summary);result.setAttribute('role','status');result.tabIndex=-1;
  try{result.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}
  setTimeout(()=>{try{result.focus({preventScroll:true})}catch(_){result.focus()}},0);
}
function decorateScenario(i,ci,el){
  if(!el||!el.closest)return;const scenario=el.closest('.scenario');if(!scenario)return;
  const choices=[...scenario.querySelectorAll('.choice')];choices.forEach(x=>x.classList.remove('mm-choice-selected','mm-choice-correct','mm-choice-review'));el.classList.add('mm-choice-selected');
  const D=window.MM_DATA;const correct=D?.scenarios?.[i]?.correct;if(Number.isInteger(correct))el.classList.add(ci===correct?'mm-choice-correct':'mm-choice-review');
}

addStyles();
R.transform('getExamQuestions',(rows,level,region)=>rotateOpeningQuestion(rows,level,region));
R.after('startExam',()=>{state=null;setTimeout(decorateExam,0)});
R.after('gradeExam',()=>setTimeout(decorateReview,0));
const baseScenario=window.answerScenario;if(typeof baseScenario==='function'&&!baseScenario.__mmAssessmentUx){const wrapped=function(i,ci,el){const r=baseScenario.apply(this,arguments);setTimeout(()=>decorateScenario(i,ci,el),0);return r};wrapped.__mmAssessmentUx=true;window.answerScenario=wrapped}
R.registerModule('assessment-ux',{version:VERSION,type:'assessment-ui-hooks',storage:'runtime-v2 learner-scoped'});

window.MM_ASSESSMENT_UX={version:VERSION,decorateExam,decorateReview,showQuestion,rotateOpeningQuestion,resetQuestionRotation,questionRotation:{historyLimit:FIRST_HISTORY_LIMIT,scope:'learner + level + region',persistence:'learner-scoped localStorage stable IDs only; no answers or personal data',storageKey:()=>R.storage.key(HISTORY_KEY),policy:'avoid the last three opening questions across starts, reloads and learner switches when another valid item is available'}};
})();
/* <<< assessment-ux.js */

/* >>> source-library.js */
/* MouldMaster authoritative source library — 2026.08.24.1 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const SOURCES={
 safety:[
  ['ISO 20430:2020','Injection moulding machine safety requirements.','https://www.iso.org/standard/68000.html'],
  ['HSE — Plastics industry guidance','UK plastics-processing safety guidance index including PPIS4 and PPIS13.','https://www.hse.gov.uk/pubns/plasindx.htm'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['HSE PPIS13(rev1)','Controlling fume during plastics processing.','https://www.hse.gov.uk/pubns/ppis13.pdf'],
  ['OSHA Injection Molding eTool','US horizontal injection-moulding safeguarding and hazard guidance.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],
  ['OSHA 1910.212','General machine-guarding requirements.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212'],
  ['OSHA 1910.147','Control of hazardous energy (lockout/tagout).','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'],
  ['OSHA 1910.1200','Hazard Communication standard.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200'],
  ['WorkSafe NZ — Safe use of machinery','Current NZ machinery risk-management and safeguarding guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'],
  ['WorkSafe NZ — Machine lockouts','Current NZ de-energisation and lockout guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/']
 ],
 law:[
  ['UK — PUWER 1998','Official text of the Provision and Use of Work Equipment Regulations 1998.','https://www.legislation.gov.uk/uksi/1998/2306/contents'],
  ['UK — COSHH 2002','Official text of the Control of Substances Hazardous to Health Regulations 2002.','https://www.legislation.gov.uk/uksi/2002/2677/contents'],
  ['NZ — Health and Safety at Work Act 2015','Official NZ legislation source for PCBU duties and SFAIRP framework.','https://www.legislation.govt.nz/act/public/2015/70/en/latest/']
 ],
 materials:[
  ['ISO 1133-1:2022','MFR/MVR testing under specified conditions.','https://www.iso.org/standard/83905.html'],
  ['ASTM D1238','Melt-flow-rate test method for thermoplastics.','https://store.astm.org/standards/d1238'],
  ['ISO 294-1:2017','General principles for injection moulding thermoplastic test specimens.','https://www.iso.org/standard/67036.html'],
  ['Covestro — Drying for injection moulding','Manufacturer technical background on moisture, drying and hydrolysis-sensitive materials.','https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf'],
  ['Trotta et al. (2021)','Injection-moulding rheology and high-shear behaviour.','https://doi.org/10.1016/j.polymertesting.2021.107068'],
  ['Hu et al. (2022)','Cooling-rate effects on polypropylene crystallisation.','https://doi.org/10.3390/polym14173646']
 ],
 process:[
  ['Zhao et al. (2022)','Review of warpage, shrinkage and interacting injection-moulding process parameters.','https://pubmed.ncbi.nlm.nih.gov/35194289/'],
  ['Autodesk Moldflow — Cooling stage','Cooling-stage heat-removal and solidification background.','https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'],
  ['Autodesk Moldflow — Packing guidance','Packing/hold and gate-freeze simulation background.','https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html']
 ],
 sensors:[
  ['Araújo et al. (2023)','In-cavity pressure measurement for injection-moulding diagnosis and simulation correlation.','https://link.springer.com/article/10.1007/s00170-023-11100-1'],
  ['Párizs et al. (2023)','Multiple in-mould sensors for quality and process control.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9920048/'],
  ['Kovács et al. (2019)','Review of in-mould sensors for injection moulding and Industry 4.0.','https://pubmed.ncbi.nlm.nih.gov/31443164/'],
  ['Weinert et al. (2023)','Condition monitoring of injection-mould tooling.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9966701/']
 ],
 stats:[
  ['NIST Engineering Statistics Handbook','Engineering statistics, measurement, capability and DOE reference.','https://www.itl.nist.gov/div898/handbook/'],
  ['NIST — Process capability','Capability concepts and interpretation prerequisites.','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],
  ['NIST — Experimental design','Factors, interactions, randomisation and blocking.','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'],
  ['ISO 22514-2:2026','Process capability and performance for time-dependent process models.','https://www.iso.org/standard/88883.html'],
  ['ISO 22514-7:2021','Capability of measurement processes; recheck ISO status before formal use because a replacement edition was progressing in 2026.','https://www.iso.org/standard/80624.html']
 ]
};
function categories(text){const t=String(text||'').toLowerCase(),out=[];
 if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell|fume|emergency/.test(t))out.push('safety');
 if(/puwer|coshh|hswa|law|legal|pcbu|regulation/.test(t))out.push('law');
 if(/material|polymer|resin|rheolog|viscos|mfr|mvr|moisture|dry|crystalli|degrad|regrind/.test(t))out.push('materials');
 if(/pack|hold|gate|cool|thermal|shrink|warpage|fill|flow|pressure|cavity|runner|vent|burn|weld|sink/.test(t))out.push('process');
 if(/sensor|cavity pressure|monitor|trace|industry 4|condition monitoring/.test(t))out.push('sensors');
 if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling|msa/.test(t))out.push('stats');
 return [...new Set(out)];}
function select(text,limit=5){const out=[];for(const cat of categories(text))for(const s of SOURCES[cat]||[])if(!out.some(x=>x[2]===s[2]))out.push(s);return out.slice(0,limit)}
function panel(text){const src=select(text);if(!src.length)return '';return `<section class="mm-ref-panel mm-authoritative-more" data-mm-authoritative-sources="1"><span class="eyebrow">More authoritative sources</span><h3>Verify and go deeper</h3>${src.map(s=>`<a href="${esc(s[2])}" target="_blank" rel="noopener"><b>${esc(s[0])}</b><small>${esc(s[1])}</small><em>Open ↗</em></a>`).join('')}<p>These sources support principles and obligations, not universal process settings. Current material data, machine/tool documentation, approved site procedures and applicable law control specific limits.</p></section>`}
function lesson(){const article=document.querySelector('#lesson article.lesson-body');if(!article||article.querySelector('[data-mm-authoritative-sources]'))return;const title=article.querySelector('h2')?.textContent||'';const body=[...article.querySelectorAll('h3')].map(x=>x.textContent).join(' ');const html=panel(title+' '+body);if(html)article.insertAdjacentHTML('beforeend',html)}
function standards(){const host=document.getElementById('standards');if(!host||host.querySelector('[data-mm-authoritative-sources]'))return;const region=(window.user&&window.user.region)||'ALL';let text='safety law';if(region==='UK')text+=' puwer coshh';if(region==='US')text+=' osha lockout hazard';if(region==='NZ')text+=' hswa pcbu worksafe';const html=panel(text);if(html)host.insertAdjacentHTML('beforeend',html)}
function run(){lesson();standards()}
const mo=new MutationObserver(()=>requestAnimationFrame(run));if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
window.MM_SOURCE_LIBRARY=SOURCES;
})();
/* <<< source-library.js */

/* >>> measured-evidence-integration.js */
/* MouldMaster canonical measured-evidence runtime bridge — 2026.08.30.1 */
(function(){
'use strict';
const VERSION='2026.08.30.1';
const CANONICAL={inventoried:34,rightsExecutable:21,fullyProfiled:17,timeSeriesValues:85569824};
const FAMILIES=[
 {id:'mendeley-gtnb4j7bfx-v1',title:'Injection production records',kind:'record-level production',scale:'4,502 injection records profiled',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/gtnb4j7bfx.1',topics:['quality','reject','flash','product weight','melt temperature','mould temperature','mold temperature','cycle time','cooling','injection pressure','hold pressure','injection speed','production'],boundary:'Production-order/run-level records are not assumed to be shot-resolved; correlations do not prove root cause or a validated process window.'},
 {id:'scatimdata-avaps',title:'AVAPS high-resolution injection traces',kind:'process waveform',scale:'13,631,488 accepted pressure/flow values',timeSeries:13631488,rights:'CC BY 4.0',restricted:false,source:'https://github.com/sc4t1m/scatimdata',topics:['injection pressure','pressure curve','flow curve','fill','filling','part weight','dimension','cycle','process trace','waveform','transfer'],boundary:'Accepted counts use the 2,048 values actually delivered per linked trace, not the paper-reported 2,049; these experiments do not establish universal settings.'},
 {id:'openmms-t4g',title:'OpenMMS-T4G mould monitoring',kind:'mould/sensor waveform',scale:'298,080 accepted sensor values',timeSeries:298080,rights:'BSD-3-Clause',restricted:false,source:'https://github.com/TEPGomes/OpenMMS-T4G',topics:['cavity pressure','temperature','extraction force','ejection','acceleration','vibration','angular velocity','tooling','mould monitoring','mold monitoring','condition monitoring','fault'],boundary:'One monitored experimental campaign, including a simulated extraction-system fault; it supports condition-monitoring learning but not a universal machine-health diagnosis.'},
 {id:'cross-process-chain-17240390',title:'Cross-process injection chain',kind:'process waveform',scale:'51,241,491 accepted injection-process values',timeSeries:51241491,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.17240390',topics:['injection pressure','velocity','volume','recyclate','glass fibre','glass fiber','process chain','state','lower workpiece','upper workpiece','fill','waveform'],boundary:'Only source-defined injection-moulding measurements are accepted; commands, screw-driving streams and unresolved upper pressure/state semantics remain excluded.'},
 {id:'impure-pascoe-2022',title:'ImPure PASCOE cavity sensing',kind:'cavity-sensor waveform',scale:'1,188,348 accepted cavity pressure/temperature values',timeSeries:1188348,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.6913660',topics:['cavity pressure','cavity temperature','mould temperature','mold temperature','sensor','pressure','temperature','medical','cycle','pascoe','process trace'],boundary:'Only two cavity-pressure and two cavity-temperature channels have sufficient source semantics; hydraulic pressure, screw position and analogue inputs remain excluded.'},
 {id:'forinfpro-himd-v1',title:'FORinFPRO hybrid moulding machine temperatures',kind:'machine-temperature waveform',scale:'162,112 accepted heating-zone temperature values',timeSeries:162112,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.20744054',topics:['temperature','heating zone','barrel','machine temperature','hybrid moulding','hybrid molding','organosheet','glass fibre','glass fiber','engel','thermal'],boundary:'Sixteen ENGEL heating-zone actual-temperature channels are accepted; zone location is machine-specific and other machine/in-mould/ultrasonic fields remain excluded pending semantics.'},
 {id:'iguzzini-road-lenses',title:'Road-lens production quality records',kind:'record-level process/quality',scale:'1,451 production rows · 18,863 measured process values',timeSeries:0,rights:'Research & education release terms',restricted:true,source:'https://github.com/airtlab/machine-learning-for-quality-prediction-in-plastic-injection-molding',topics:['quality','classification','melt temperature','mould temperature','mold temperature','fill time','cycle time','clamping force','back pressure','injection pressure','screw position','shot volume','torque','production'],boundary:'Research-and-education use only; record-level evidence, not waveform evidence, and raw redistribution rights are not widened.'},
 {id:'mendeley-fhj5p7ww9v-v1',title:'PP/composite/foam measured outcomes',kind:'record-level material outcomes',scale:'96 accepted weight/flexural outcome values',timeSeries:0,rights:'CC BY-NC 3.0',restricted:true,source:'https://doi.org/10.17632/fhj5p7ww9v.1',topics:['polypropylene','pp','foam','composite','flexural strength','flexural modulus','weight','mechanical property','material'],boundary:'Noncommercial education/research only; values are source-reported outcomes by condition, not raw replicates or process waveforms.'},
 {id:'mendeley-6k8fpbrd9s-v1',title:'Polypropylene pvT characterisation',kind:'material characterisation',scale:'28,590 direct physical pvT cells profiled',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/6k8fpbrd9s.1',topics:['polypropylene','pp','pvt','specific volume','pressure','temperature','shrinkage','material','rheology','thermal'],boundary:'Material-characterisation evidence rather than injection-cycle waveform evidence; cross-figure reuse may exist, so no deduplicated experiment count is claimed.'},
 {id:'mendeley-4h98rz9f92-v3',title:'Injection-moulded material property records',kind:'record-level material properties',scale:'525 accepted direct measured property values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/4h98rz9f92.3',topics:['material property','mechanical','injection moulded','injection molded','specimen','strength','property','material'],boundary:'Only direct measured property values are represented; 105 derived averages are excluded from direct-measurement counts.'},
 {id:'pmc4753395-hdpe-cenosphere-v1',title:'HDPE/cenosphere mechanical traces',kind:'material-test trace',scale:'142,884 accepted stress/strain trace values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.1016/j.dib.2016.01.058',topics:['hdpe','cenosphere','stress','strain','tensile','mechanical','composite','material','strength','modulus'],boundary:'Mechanical specimen-test traces are material evidence, not injection-machine/cavity time-series values.'},
 {id:'mendeley-8c8fjwcw86-v1',title:'Injection-moulded Nylon 12 XRD',kind:'material characterisation',scale:'6,588 accepted XRD intensity values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/8c8fjwcw86.1',topics:['nylon 12','pa12','xrd','crystallinity','crystal','material','characterisation','characterization','structure'],boundary:'Only the series explicitly identified as injection-moulded Nylon 12 is accepted; the category/axis values do not inflate the measurement count.'},
 {id:'mendeley-yxz2w7ctnh-v1',title:'Injection-moulded ABS/PLA mechanical testing',kind:'record-level mechanical testing',scale:'489 accepted tensile/bending values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/yxz2w7ctnh.1',topics:['abs','pla','tensile','bending','mechanical','strength','injection moulded','injection molded','material','specimen'],boundary:'Only route-explicit injection-moulded tensile and bending measurements are accepted; other manufacturing-route or unsupported outcome data are excluded.'},
 {id:'mendeley-crmb7xjymg-v1',title:'XPS material/tool-interface characterisation',kind:'material/tool characterisation',scale:'71,868 accepted XPS count values',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/crmb7xjymg.1',topics:['xps','surface','interface','tool','mould surface','mold surface','material','chemistry','characterisation','characterization'],boundary:'XPS signal counts are accepted; energy axes, calibration and transmission variables are not counted as direct measurements.'},
 {id:'mendeley-ypf95p4bs4-v1',title:'Injection operations time-study',kind:'record-level operations',scale:'666 accepted observed operation durations',timeSeries:0,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.17632/ypf95p4bs4.1',topics:['maintenance','mould change','mold change','setup','downtime','cleaning','time study','operations','changeover','production'],boundary:'Direct observed operational durations only; simulation, sales, formula, financial and scheduling artefacts are excluded.'},
 {id:'mendeley-ztkc87d6sr-v1',title:'SiC/Nylon-6 tribology',kind:'record-level tribology',scale:'40 accepted friction/wear values',timeSeries:0,rights:'CC BY-NC 3.0 accepted payload',restricted:true,source:'https://doi.org/10.17632/47k6jswwg7.1',topics:['nylon 6','pa6','sic','tribology','wear','friction','coefficient of friction','material','tool interface'],boundary:'Accepted under the narrower alternate-release noncommercial licence; image-only TGA/FTIR/SEM evidence is not OCR-counted.'},
 {id:'zenodo-energy-20338544',title:'Industrial production electrical energy',kind:'industrial energy waveform',scale:'19,048,305 accepted electrical values',timeSeries:19048305,rights:'CC BY 4.0',restricted:false,source:'https://doi.org/10.5281/zenodo.20338544',topics:['energy','power','current','voltage','frequency','electrical','machine load','auxiliary','base load','production','sustainability'],boundary:'Only 15 direct physical Shelly Pro 3EM channels from the accepted production streams are counted; derived totals/power factor, neutral current and the overlapping curated test subset are excluded.'}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hasTopic(text,topic){if(topic.length>3)return text.includes(topic);const safe=topic.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^a-z0-9])${safe}(?:$|[^a-z0-9])`,'i').test(text)}
function score(f,text){const t=String(text||'').toLowerCase();return f.topics.reduce((n,k)=>n+(hasTopic(t,k)?Math.max(1,k.split(' ').length):0),0)}
function select(text,limit=4){return FAMILIES.map(f=>({f,s:score(f,text)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||b.f.timeSeries-a.f.timeSeries).slice(0,limit).map(x=>x.f)}
function badge(f){return `<span class="mme-chip">${esc(f.kind)}</span><span class="mme-chip">${esc(f.rights)}</span>`}
function card(f){return `<article class="mme-card"><div class="mme-card-head"><div><b>${esc(f.title)}</b><small>${esc(f.id)}</small></div><a href="${esc(f.source)}" target="_blank" rel="noopener">Source ↗</a></div><div class="mme-chips">${badge(f)}</div><strong>${esc(f.scale)}</strong><p>${esc(f.boundary)}</p></article>`}
function style(){if(document.getElementById('mm-measured-evidence-style'))return;const s=document.createElement('style');s.id='mm-measured-evidence-style';s.textContent=`
.mme-panel{margin-top:14px;padding:16px;border:1px solid #355272;border-radius:12px;background:#0d1d31}.mme-panel h3{margin:2px 0 6px}.mme-panel>p{margin:0 0 12px;color:#b9cbe0;font-size:12px;line-height:1.55}.mme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mme-card{padding:12px;border:1px solid #2e4968;border-radius:10px;background:#102238}.mme-card-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.mme-card-head b{display:block}.mme-card-head small{display:block;color:#8098b3;font-size:9px;margin-top:3px;overflow-wrap:anywhere}.mme-card-head a{font-size:10px;white-space:nowrap}.mme-card strong{display:block;margin:8px 0 4px;font-size:12px}.mme-card p{margin:0;color:#aebfd2;font-size:11px;line-height:1.45}.mme-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.mme-chip{font-size:9px;border:1px solid #426381;border-radius:999px;padding:3px 6px;color:#c9d9e9}.mme-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.mme-kpi{padding:9px;border:1px solid #2d4866;border-radius:9px;background:#0d1b2e;text-align:center}.mme-kpi b{display:block;font-size:18px}.mme-kpi span{font-size:9px;color:#9db2c8}.mme-all summary{cursor:pointer;font-weight:700;margin:10px 0}.mme-boundary{border-left:3px solid #d8b95c;padding-left:9px!important;color:#dfd2a4!important}.mme-workspace{margin:14px 0}.mme-restricted{color:#f1d699;font-size:10px;margin-top:8px}
@media(max-width:720px){.mme-grid{grid-template-columns:1fr}.mme-kpis{grid-template-columns:repeat(2,1fr)}}
`;document.head.appendChild(s)}
function contextText(host){const fields=[...host.querySelectorAll('input,textarea,select')].map(x=>x.value||'').join(' ');return `${host.textContent||''} ${fields}`}
function relevantPanel(text){const rows=select(text);if(!rows.length)return '';return `<section class="mme-panel" data-mm-measured-evidence="relevant"><div class="eyebrow">Canonical measured evidence</div><h3>Measured data behind this topic</h3><p>These source-profiled datasets show real measured behaviour in bounded experiments or production records. They support comparison and learning; they do not supply universal settings, prove root cause by themselves, or override the validated machine/mould/material/site process.</p><div class="mme-grid">${rows.map(card).join('')}</div></section>`}
function catalogPanel(){return `<section class="mme-panel mme-workspace" data-mm-measured-evidence="catalog"><div class="eyebrow">Measured evidence baseline</div><h3>17 fully profiled dataset families are available as evidence context</h3><div class="mme-kpis"><div class="mme-kpi"><b>${CANONICAL.fullyProfiled}</b><span>profiled families</span></div><div class="mme-kpi"><b>${CANONICAL.rightsExecutable}</b><span>rights-executable sources</span></div><div class="mme-kpi"><b>${(CANONICAL.timeSeriesValues/1e6).toFixed(1)}M</b><span>process time-series values</span></div><div class="mme-kpi"><b>${CANONICAL.inventoried}</b><span>inventoried sources</span></div></div><p class="mme-boundary">Evidence is context-specific. Record-level, material-characterisation, specimen-test and waveform evidence remain distinct; restricted educational/noncommercial rights are preserved; unresolved channels and blocked sources are not silently counted.</p><details class="mme-all"><summary>Browse all 17 measured families</summary><div class="mme-grid">${FAMILIES.map(card).join('')}</div><div class="mme-restricted">Restricted-use families are labelled explicitly; opening a source does not change its reuse terms.</div></details></section>`}
function addRelevant(host){if(!host||host.classList?.contains('hidden')||host.querySelector('[data-mm-measured-evidence="relevant"]'))return;const html=relevantPanel(contextText(host));if(html)host.insertAdjacentHTML('beforeend',html)}
function run(){
 style();
 const lesson=document.querySelector('#lesson article.lesson-body');if(lesson&&!lesson.querySelector('[data-mm-measured-evidence]')){const html=relevantPanel(contextText(lesson));if(html)lesson.insertAdjacentHTML('beforeend',html)}
 ['diagnosticLabs','processDataLabs'].forEach(id=>addRelevant(document.getElementById(id)));
 const material=[...document.querySelectorAll('.view[id]')].find(x=>/material.*lab/i.test(x.id));if(material)addRelevant(material);
 const ws=document.getElementById('mmMouldMasterWorkspace');if(ws&&!ws.classList.contains('hidden')){
   if(!ws.querySelector('[data-mm-measured-evidence="relevant"]')){const html=relevantPanel(contextText(ws));if(html)ws.insertAdjacentHTML('beforeend',html)}
   if(!ws.querySelector('[data-mm-measured-evidence="catalog"]'))ws.insertAdjacentHTML('beforeend',catalogPanel());
 }
}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;run()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();window.addEventListener('load',schedule);
window.MM_MEASURED_EVIDENCE={version:VERSION,canonical:{...CANONICAL},families:FAMILIES.map(x=>({...x,topics:[...x.topics]})),select:(text,limit=4)=>select(text,limit).map(x=>({...x,topics:[...x.topics]})),scope:'Metadata-only bridge to 17 canonically profiled measured families; no raw third-party rows, universal production recipes or root-cause authority.'};
})();
/* <<< measured-evidence-integration.js */

/* >>> measured-evidence-decision.js */
/* MouldMaster measured-evidence decision layer — 2026.08.30.3 */
(function(){
'use strict';
const VERSION='2026.08.30.3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function base(){return window.MM_MEASURED_EVIDENCE||null}
function hasTopic(text,topic){const t=String(text||'').toLowerCase(),k=String(topic||'').toLowerCase();if(k.length>3)return t.includes(k);const safe=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^a-z0-9])${safe}(?:$|[^a-z0-9])`,'i').test(t)}
function matchedTopics(f,text){return (f.topics||[]).filter(k=>hasTopic(text,k)).sort((a,b)=>b.length-a.length)}
function role(f){
 if(Number(f.timeSeries)>0)return {group:'direct',label:'Direct measured signal',detail:'The source contains an accepted machine, mould/cavity, sensor or energy waveform close to the decision variable.'};
 if(/production|process\/quality|operations/i.test(f.kind))return {group:'supporting',label:'Supporting process context',detail:'The source contains record-level production, quality or operational measurements rather than an intra-cycle waveform.'};
 return {group:'supporting',label:'Supporting material evidence',detail:'The source contains material, specimen, surface or tribology measurements that help interpret mechanisms but are not machine/cavity waveforms.'};
}
function explain(text,limit=4){const b=base();if(!b)return[];return b.select(text,limit).map(f=>{const matches=matchedTopics(f,text),r=role(f);return {id:f.id,title:f.title,role:r.group,roleLabel:r.label,matches,why:`${r.detail}${matches.length?` Matched topic${matches.length===1?'':'s'}: ${matches.join(', ')}.`:''}`,boundary:f.boundary,rights:f.rights,restricted:!!f.restricted,timeSeries:Number(f.timeSeries)||0}})}
function cleanContext(panel){const host=panel?.parentElement;if(!host)return'';const clone=host.cloneNode(true);clone.querySelectorAll('[data-mm-measured-evidence]').forEach(x=>x.remove());const fields=[...clone.querySelectorAll('input,textarea,select')].map(x=>x.value||'').join(' ');return `${clone.textContent||''} ${fields}`}
function addRole(card,f){if(card.querySelector('[data-mme-decision-role]'))return;const r=role(f),chips=card.querySelector('.mme-chips');if(!chips)return;chips.insertAdjacentHTML('beforeend',`<span class="mme-chip mme-role-${r.group}" data-mme-decision-role="${r.group}">${esc(r.label)}</span>`)}
function annotatePanel(panel){const b=base();if(!b||!panel)return;const byId=new Map(b.families.map(f=>[f.id,f]));const relevant=panel.getAttribute('data-mm-measured-evidence')==='relevant';const context=relevant?cleanContext(panel):'';const decisions=relevant?new Map(explain(context,8).map(x=>[x.id,x])):new Map();
 panel.querySelectorAll('.mme-card').forEach(card=>{const id=card.querySelector('.mme-card-head small')?.textContent?.trim(),f=byId.get(id);if(!f)return;addRole(card,f);if(relevant&&!card.querySelector('[data-mme-why]')){const d=decisions.get(id);if(d)card.insertAdjacentHTML('beforeend',`<p class="mme-why" data-mme-why><b>Why relevant:</b> ${esc(d.why)}</p>`)}});
 if(relevant&&!panel.querySelector('[data-mme-decision-legend]')){const intro=panel.querySelector('h3')?.nextElementSibling;if(intro)intro.insertAdjacentHTML('afterend','<p class="mme-decision-legend" data-mme-decision-legend><b>Evidence role:</b> Direct measured signal means the accepted waveform is close to the decision variable. Supporting evidence helps interpret material, quality or operational context; neither is a root-cause verdict or a universal setpoint.</p>')}
}
function style(){if(document.getElementById('mm-measured-evidence-decision-style'))return;const s=document.createElement('style');s.id='mm-measured-evidence-decision-style';s.textContent='.mme-role-direct{border-color:#4d8b78}.mme-role-supporting{border-color:#806c43}.mme-why{margin-top:8px!important;padding-top:7px;border-top:1px solid #29435e;color:#c9d8e8!important;overflow-wrap:anywhere}.mme-why b,.mme-decision-legend b{color:#eef6ff}.mme-decision-legend{padding:8px 10px;border-left:3px solid #537aa4;background:#10243b;color:#bed0e1!important}';document.head.appendChild(s)}
let queued=false;function run(){queued=false;style();document.querySelectorAll('[data-mm-measured-evidence="relevant"],[data-mm-measured-evidence="catalog"]').forEach(annotatePanel)}
function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_MEASURED_EVIDENCE_DECISIONS={version:VERSION,explain,roleForFamily:id=>{const f=base()?.families.find(x=>x.id===id);return f?{...role(f)}:null},scope:'Decision-support metadata only. Direct and supporting evidence remain bounded by the canonical source profile and never become universal setpoints or root-cause verdicts.'};
})();
/* <<< measured-evidence-decision.js */
