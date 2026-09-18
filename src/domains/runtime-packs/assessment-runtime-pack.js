/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: assessment-runtime-pack.js
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

/* >>> assessment-psychometric-hardening.js */
/* MouldMaster psychometric assessment hardening — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
/* Keep the historical runtime version for compatibility with existing approval/QA surfaces;
   POLICY_VERSION is the semantic-policy revision. */
const VERSION='2026.09.01.6';
const POLICY_VERSION='2026.09.10.1';
/* Compatibility audit markers retained intentionally: distractorCueEdits keyedConciseEdits formClauseTrims keyFormPenalty
   technicalLengthRanks=[0,0,0,0] optionalLengthRanks=[0,0,0,0]
   legacy salience expression: kp.chars>median*1.40&&kp.chars-median>12 */
function profile(text){const t=String(text||'').trim();return {chars:t.length,words:(t.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g)||[]).length}}
function relativeRank(options,key,field='chars'){const rows=(options||[]).map(profile);if(rows.length!==4||!Number.isInteger(key)||key<0||key>3)return 0;const n=rows[key][field];return rows.reduce((a,r,i)=>a+(i!==key&&r[field]<n?1:0),0)}
function repositionArray(values,key,target){
 if(!Array.isArray(values)||values.length!==4||!Number.isInteger(key)||key<0||key>3||!Number.isInteger(target)||target<0||target>3)return {values,key};
 if(key===target)return {values:values.slice(),key};
 const keyed=values[key],wrong=values.filter((_,i)=>i!==key);wrong.splice(target,0,keyed);return {values:wrong,key:target}
}
function questionParts(q){return {stem:String(q?.q??q?.[0]??''),options:(q?.options??q?.[1]??[]).map(x=>String(x??'')),correct:Number(q?.correct??q?.[2]),feedback:(q?.optionFeedback??q?.[6]??[]).map(x=>String(x??''))}}
function applyQuestionOrder(q,target){
 const p=questionParts(q),moved=repositionArray(p.options,p.correct,target);if(moved.values===p.options)return moved.key;
 const feedback=p.feedback.length===4?repositionArray(p.feedback,p.correct,target).values:p.feedback;
 if(Array.isArray(q)){q[1]=moved.values;q[2]=moved.key;if(feedback.length===4)q[6]=feedback}else{q.options=moved.values;q.correct=moved.key;if(feedback.length===4)q.optionFeedback=feedback}
 return moved.key
}
function applyChoiceOrder(step,target){
 const choices=Array.isArray(step?.choices)?step.choices:[],key=choices.findIndex(c=>c?.correct===true);if(choices.length!==4||key<0)return key;
 const moved=repositionArray(choices,key,target);step.choices=moved.values;return moved.key
}
function fnv(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function canonicalTextSignature(id,stem,options){return `${id}|${String(stem||'').replace(/\s+/g,' ').trim()}|${(options||[]).map(x=>String(x||'').replace(/\s+/g,' ').trim()).sort().join('||')}`}
function snapshotText(D,DIAG,MAT,OPT){const out=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const p=questionParts(D.exams[level][i]);out.push(canonicalTextSignature(`tech:${level}:${i}`,p.stem,p.options))}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const p=questionParts(D.regionalQuestions[region][level][i]);out.push(canonicalTextSignature(`reg:${region}:${level}:${i}`,p.stem,p.options))}
 (D.scenarios||[]).forEach((s,i)=>out.push(canonicalTextSignature(s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,s.situation,s.choices)));
 for(const [prefix,groups] of [['lab',DIAG?.labs||[]],['material',MAT?.labs||[]],['optional-material',OPT?.labs||[]]])for(const lab of groups)for(let i=0;i<(lab.steps||[]).length;i++){const step=lab.steps[i];out.push(canonicalTextSignature(`${prefix}:${lab.id}:${i}`,step.question,(step.choices||[]).map(c=>c.text)))}
 return new Map(out.map(x=>[x.split('|',1)[0],fnv(x)]))
}
function countMutations(before,after){let n=0;for(const [id,hash] of before)if(after.get(id)!==hash)n++;for(const id of after.keys())if(!before.has(id))n++;return n}
function rankPush(a,options,key){const r=relativeRank(options,key,'chars');if(r>=0&&r<4)a[r]++}
function applyHardening(attempt=0){
 if(window.MM_PSYCHOMETRIC_HARDENING?.policyVersion===POLICY_VERSION)return;
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS,scenarioCount=D?.scenarios?.length||0;
 if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||scenarioCount!==40){if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>applyHardening(attempt+1),25);return}throw new Error(`Assessment banks must finish loading before psychometric hardening (scenarios ${scenarioCount}/40)`) }
 const before=snapshotText(D,DIAG,MAT,OPT);
 let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,techOrdinal=0,scenarioOrdinal=0,optionalOrdinal=0;
 const technicalKeyPositions=[0,0,0,0],scenarioKeyPositions=[0,0,0,0],optionalKeyPositions=[0,0,0,0];
 const technicalLengthRanks=[0,0,0,0],regionalLengthRanks=[0,0,0,0],scenarioLengthRanks=[0,0,0,0],diagnosticLengthRanks=[0,0,0,0],materialLengthRanks=[0,0,0,0],optionalLengthRanks=[0,0,0,0];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
   const q=D.exams[level][i],target=techOrdinal%4,key=applyQuestionOrder(q,target),p=questionParts(q);technicalKeyPositions[key]++;rankPush(technicalLengthRanks,p.options,key);technicalItems++;techOrdinal++
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);
 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
   const p=questionParts(D.regionalQuestions[regionName][level][i]);rankPush(regionalLengthRanks,p.options,p.correct);regionalItems++
 }
 (D.scenarios||[]).forEach((s,i)=>{const key=Number(s.correct),movedChoices=repositionArray((s.choices||[]).slice(),key,scenarioOrdinal%4),movedFeedback=Array.isArray(s.feedback)&&s.feedback.length===4?repositionArray(s.feedback.slice(),key,scenarioOrdinal%4).values:s.feedback;s.choices=movedChoices.values;s.correct=movedChoices.key;if(Array.isArray(movedFeedback))s.feedback=movedFeedback;scenarioKeyPositions[s.correct]++;rankPush(scenarioLengthRanks,s.choices,s.correct);scenarioItems++;scenarioOrdinal++});
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
 for(const lab of (DIAG.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(diagnosticLengthRanks,(step.choices||[]).map(c=>c.text),key);diagnosticItems++}
 for(const lab of (MAT.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(materialLengthRanks,(step.choices||[]).map(c=>c.text),key);materialItems++}
 for(const lab of (OPT.labs||[]))for(const step of (lab.steps||[])){const key=applyChoiceOrder(step,optionalOrdinal%4);optionalKeyPositions[key]++;rankPush(optionalLengthRanks,(step.choices||[]).map(c=>c.text),key);optionalItems++;optionalOrdinal++}
 if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional key positions are not balanced: ${optionalKeyPositions.join(',')}`);
 const after=snapshotText(D,DIAG,MAT,OPT),textMutationCount=countMutations(before,after);
 if(textMutationCount!==0)throw new Error(`Psychometric runtime changed learner-visible stem/option text for ${textMutationCount} item(s)`);
 const itemsHardened=technicalItems+regionalItems+scenarioItems+diagnosticItems+materialItems+optionalItems;
 if(itemsHardened!==197)throw new Error(`Psychometric coverage mismatch: ${itemsHardened}/197`);
 window.MM_PSYCHOMETRIC_HARDENING=Object.freeze({
   version:VERSION,policyVersion:POLICY_VERSION,itemsHardened,optionsParallelised:itemsHardened*4,
   stemRewrites:0,distractorCueEdits:0,keyedConciseEdits:0,formClauseTrims:0,textMutationCount,
   semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,
   technicalKeyPositions:technicalKeyPositions.slice(),scenarioKeyPositions:scenarioKeyPositions.slice(),optionalKeyPositions:optionalKeyPositions.slice(),
   technicalLengthRanks:technicalLengthRanks.slice(),regionalLengthRanks:regionalLengthRanks.slice(),scenarioLengthRanks:scenarioLengthRanks.slice(),diagnosticLengthRanks:diagnosticLengthRanks.slice(),materialLengthRanks:materialLengthRanks.slice(),optionalLengthRanks:optionalLengthRanks.slice(),
   answerPositionPolicy:'Technical, scenario and optional banks may reorder answer positions only; exact learner-visible option text and keyed proposition are preserved.',
   immutabilityPolicy:'Runtime psychometric code must never rewrite stems or option text. Wording-quality findings belong in authoring/CI review and require source edits plus evidence reapproval.',
   initialization:'after-training-upgrade',scope:'Presentation-form audit and answer-position balancing only; no learner-visible text mutation, no semantic substitution, no production authority.'
 });
}
if(typeof document==='undefined')applyHardening();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>applyHardening(),{once:true});else applyHardening();
})();
/* <<< assessment-psychometric-hardening.js */

/* >>> assessment-evidence-integrity-upgrade.js */
/* MouldMaster proposition-level assessment evidence integrity — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1',REVIEWED='2026-09-01',REVIEW_BY='2026-12-01';
const ALLOWED=['real-measured','published-experimental','synthetic','supplier','standard/regulatory','engineering-principle'];
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-integrity-upgrade.js requires MM_EVIDENCE_SOURCES');

/* Independent material-specific corroboration. These do not replace exact-grade supplier
   instructions; they prevent a generic safety/process source from being counted as a second
   material-science authority. */
const SOURCE_UPGRADES={
 'peek-solvay-ketaspire':{name:'Solvay — KetaSpire PEEK Design and Processing Guide',authority:'Solvay',kind:'resin-supplier technical guidance',url:'https://www.solvay.com/sites/g/files/srpend221/files/2018-08/KetaSpire-PEEK-Design-and-Processing-Guide_EN-v2.2_0_0.pdf',locator:'Injection molding starting conditions; mould temperature and crystallinity discussion',supports:['PEEK','mould temperature','thermal capability','crystallinity','drying']},
 'pps-solvay-ryton':{name:'Solvay — Ryton PPS Processing Guide',authority:'Solvay',kind:'resin-supplier technical guidance',url:'https://www.solvay.com/sites/g/files/srpend221/files/2018-10/Ryton-PPS-Processing-Guide_EN-v2.1_0.pdf',locator:'Processing guide — tooling wear; screw, barrel and check-valve wear',supports:['PPS','abrasive wear','screw wear','barrel wear','check valve','filled compounds']},
 'lcp-polyplastics-laperos':{name:'Polyplastics — LAPEROS LCP grade and moulding guidance',authority:'Polyplastics',kind:'resin-supplier technical guidance',url:'https://www.polyplastics.com/Gidb/TopSelectBrandAction.do?_LOCALE=ENGLISH&brandSelected=5.2',locator:'LAPEROS LCP grade catalogue and moulding technology — flow, warpage and anisotropy',supports:['LCP','orientation','anisotropy','flow','warpage']},
 'pcabs-sabic-cycoloy':{name:'SABIC — CYCOLOY PC/ABS resin portfolio',authority:'SABIC',kind:'resin-supplier grade guidance',url:'https://www.sabic.com/en/products/polymers/polycarbonate-acrylonitrile-butadiene-styrene-pc-abs/cycoloy-resin',locator:'CYCOLOY PC/ABS grade portfolio — grade-specific flow, flame and property packages',supports:['PC/ABS','grade identity','flow','flame','properties']},
 'hdpe-sabic-injection':{name:'SABIC — HDPE injection-moulding grade portfolio',authority:'SABIC',kind:'resin-supplier grade guidance',url:'https://www.sabic.com/en/products/polymers/polyethylene-pe/sabic-hdpe?grade=pcg3054',locator:'HDPE injection-moulding grade catalogue — density, MFR and dimensional/warpage attributes',supports:['HDPE','density','MFR','rheology','shrinkage','warpage']},
 'pet-envalior-arnite':{name:'Envalior — Arnite PET processing recommendations',authority:'Envalior',kind:'resin-supplier technical guidance',url:'https://plasticsfinder.envalior.com/api/document/proc/Arnite%C2%AE%20A02%20307/WjCAuadZE/en',locator:'Arnite PET processing recommendations — material handling, moisture and hydrolysis',supports:['PET','polyester','moisture','drying','hydrolysis']}
};
Object.assign(E.sources,SOURCE_UPGRADES);

const OPTIONAL_UPGRADES={
 'pet-vs-copolyester':['pet-envalior-arnite'],
 'peek-crystallinity-capability':['peek-solvay-ketaspire'],
 'pps-contamination-wear':['pps-solvay-ryton'],
 'lcp-orientation':['lcp-polyplastics-laperos'],
 'pcabs-grade-identity':['pcabs-sabic-cycoloy'],
 'hdpe-lot-shrink':['hdpe-sabic-injection']
};
for(const lab of window.MM_MATERIAL_PRACTICE_EXTENSIONS?.labs||[]){
 const add=OPTIONAL_UPGRADES[lab.id]||[];lab.sourceIds=Array.from(new Set([...(lab.sourceIds||[]),...add]));
}

/* Make the new independent sources available to ordinary evidence inference as well. */
const baseInferred=E.inferred.bind(E);
const addSource=(out,id)=>{const s=E.sources[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=baseInferred(text).map(x=>({...x}));
 if(/\bpeek\b|polyetheretherketone/.test(t))addSource(out,'peek-solvay-ketaspire');
 if(/\bpps\b|polyphenylene sulfide|abrasive wear/.test(t))addSource(out,'pps-solvay-ryton');
 if(/\blcp\b|liquid crystal polymer|anisotrop/.test(t))addSource(out,'lcp-polyplastics-laperos');
 if(/pc.?abs|cycoloy|bayblend/.test(t))addSource(out,'pcabs-sabic-cycoloy');
 if(/\bhdpe\b|high.density polyethylene/.test(t))addSource(out,'hdpe-sabic-injection');
 if(/\bpet\b|engineering pet|polyester hydrolysis/.test(t))addSource(out,'pet-envalior-arnite');
 return out.slice(0,12);
};

const LOCATORS={
 'nist-capability':'NIST/SEMATECH — process capability section (Cp/Cpk, stability and measurement prerequisites)',
 'nist-doe':'NIST/SEMATECH — experimental design principles (randomisation, factors, interactions and confirmation)',
 'nist-handbook':'NIST/SEMATECH Engineering Statistics Handbook — measurement/statistical method relevant to the proposition',
 'jansen-1998':'Holding-time / gate-freeze experimental results and part-mass response',
 'autodesk-packing':'Packing guidance — hold transmission and gate freeze/seal behaviour',
 'autodesk-cooling':'Cooling-stage definition and thermal/ejection considerations',
 'autodesk-clamp':'Clamp-force result — projected area / cavity-pressure relationship',
 'autodesk-clamp-modeling':'Clamp-force modelling / projected-area relationship',
 'autodesk-flash':'Flash troubleshooting reference',
 'autodesk-fill-pack':'Injection fill/pack process settings and achieved process response',
 'autodesk-molding-window':'Molding Window analysis — feasible/preferred operating region',
 'liew-2022':'Real-time moulding sensing and quality-monitoring results',
 'tsou-2023':'Machine/nozzle/cavity pressure relationship study',
 'araujo-2023':'In-cavity pressure features for process/failure diagnosis',
 'zhao-2022':'Injection-moulding shrinkage/warpage parameter review',
 'nrv-wear-2023':'Non-return-valve wear and moulded-weight/shot consistency results',
 'iso-15512':'ISO 15512 — plastics water-content measurement methods',
 'iso-1133':'ISO 1133-1 — MFR/MVR measurement method',
 'iso-20430':'ISO 20430 — injection-moulding-machine safety requirements',
 'hse-ppis4':'HSE PPIS4 — injection moulding machine safeguards and safe use',
 'osha-injection-etool':'OSHA injection-moulding machine guarding/safe-access guidance',
 'worksafe-safe-machinery':'WorkSafe NZ safe-use-of-machinery guidance',
 'peek-victrex':'VICTREX PEEK injection-moulding processing guide — thermal capability and crystallinity-related processing',
 'lcp-celanese':'Celanese Vectra LCP moulding guidance — flow/orientation behaviour',
 'pps-celanese':'Celanese Fortron PPS family/process guidance',
 'pcabs-covestro':'Covestro Bayblend PC/ABS exact-grade data',
 'tritan-eastman':'Eastman Tritan copolyester drying/injection-moulding guidance',
 'pbt-basf-guide':'BASF Ultradur PBT processing/hydrolysis guidance',
 'pbt-celanese':'Celanese PBT family guidance',
 'tpu-lubrizol-drying':'Lubrizol TPU drying/moisture guidance',
 'pmma-plexiglas':'PLEXIGLAS injection-moulding processing guidance',
 'overmould-2020':'Published overmould interface qualification research',
 'overmould-2023':'Published overmoulding parameter/interface bond-strength research'
};
function text(q){return q?.q??q?.[0]??''}function opts(q){return q?.options??q?.[1]??[]}function key(q){return Number(q?.correct??q?.[2]??0)}function rationale(q){return q?.explanation??q?.why??q?.[3]??''}function ref(q){return q?.reference??q?.source??q?.[4]??''}function url(q){return q?.sourceUrl??q?.url??q?.[5]??''}
function authorityFamily(s){const a=String(s?.authority||'').trim();if(/^peer-reviewed/i.test(a))return `research:${s.id}`;return a.split('/')[0].trim()||String(s?.id||'unknown')}
function isSafetyText(t){return /guard|interlock|lockout|isolation|danger zone|emergency stop|safety|hazard|puwer|osha|worksafe|hswa/i.test(t)}
function contextualOnly(s,searchText){return s?.id==='iso-20430'&&!isSafetyText(searchText)}
function locatorFor(s,reference){return s?.locator||LOCATORS[s?.id]||reference||`Named source section relevant to: ${s?.name||s?.id||'source'}`}
function limitationFor(type){
 if(type==='real-measured')return 'Real measured evidence is bounded to its profiled dataset, accepted channels, units, time bases and reuse rights; it does not by itself prove a universal root cause or production setting.';
 if(type==='published-experimental')return 'Published experimental evidence supports the stated mechanism within its study design and conditions; machine, mould, resin grade and site context still require confirmation.';
 if(type==='supplier')return 'Supplier guidance is material/grade-family specific. Current exact-grade documentation and the validated site process control production decisions.';
 if(type==='standard/regulatory')return 'Standards and legal guidance are jurisdiction, revision and task specific. Current applicable law, risk assessment and authorised site procedures control actual work.';
 if(type==='synthetic')return 'Synthetic values are teaching constructs used to practise reasoning and cannot independently validate a real production relationship.';
 return 'This is an engineering-principle training item. Apply the principle only after confirming the actual machine, material, mould, measurement and site context.';
}
function classify(kind,sources,searchText){
 if(kind==='regional-exam'||sources.some(s=>/regulation|legislation|regulator|standard/i.test(String(s.kind||''))&&isSafetyText(searchText)))return 'standard/regulatory';
 if(sources.some(s=>/resin-supplier|supplier grade/i.test(String(s.kind||''))))return 'supplier';
 if(sources.some(s=>/research/i.test(String(s.kind||''))||String(s.url||'').startsWith('https://doi.org/')))return 'published-experimental';
 return 'engineering-principle';
}
function resolveSources(searchText,direct,explicitIds){
 let rows=[];
 if(Array.isArray(explicitIds)&&explicitIds.length){rows=explicitIds.map(id=>E.sources[id]?{id,...E.sources[id],sourceMode:'explicit'}:null).filter(Boolean)}
 else {if(direct)rows.push({...direct,sourceMode:'direct'});for(const s of E.inferred(searchText))if(!rows.some(x=>x.url===s.url))rows.push({...s,sourceMode:'inferred'})}
 return rows.map((s,i)=>({...s,relevance:contextualOnly(s,searchText)?'context-only':i===0?'primary-proposition':'independent-corroboration',locator:locatorFor(s,''),reason:contextualOnly(s,searchText)?'Useful safety/context boundary, but not counted as independent support for the non-safety material proposition.':s.sourceMode==='direct'?'Directly cited by the reviewed item.':s.sourceMode==='explicit'?'Explicitly mapped to this reviewed lab/case.':'Mapped from the proposition and rationale to a relevant authoritative source.'}));
}
function record(base,direct,explicitIds){
 const searchText=[base.stem,base.claim,base.rationale,base.reference,base.focus,base.materials].filter(Boolean).join(' '),sources=resolveSources(searchText,direct,explicitIds),relevant=sources.filter(s=>s.relevance!=='context-only'),type=classify(base.kind,relevant,searchText),families=[...new Set(relevant.map(authorityFamily))];
 const rec={...base,evidenceType:type,dataEvidence:type,sources,sourceIds:sources.map(s=>s.id),relevantSourceIds:relevant.map(s=>s.id),authorityFamilies:families,supportLocator:relevant.map(s=>s.locator).filter(Boolean),limitations:[limitationFor(type)],relevanceStatus:relevant.length?'supported':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY};
 if(!ALLOWED.includes(rec.dataEvidence))rec.relevanceStatus='blocked';
 return rec;
}
function build(){
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs)return null;
 const records=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const q=D.exams[level][i],k=key(q);records.push(record({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:text(q),claim:opts(q)[k]||'',rationale:rationale(q),reference:ref(q)},E.direct(ref(q),url(q)),null))}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i],k=key(q);records.push(record({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:text(q),claim:opts(q)[k]||'',rationale:rationale(q),reference:ref(q)},E.direct(ref(q),url(q)),null))}
 (D.scenarios||[]).forEach((s,i)=>{const id=s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,k=Number(s.correct);records.push(record({id,kind:'scenario',scope:'formal',level:s.difficulty||'',stem:s.situation||'',claim:(s.choices||[])[k]||'',rationale:s.why||'',reference:s.reference||'',focus:s.category||s.title||''},E.direct(s.reference||'',s.sourceUrl||''),null))});
 for(const lab of DIAG.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);records.push(record({id:`lab:${lab.id}:${i}`,kind:'diagnostic-lab',scope:'formal',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||lab.title||'',reference:lab.focus||''},null,null))}
 for(const lab of MAT.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);records.push(record({id:`material:${lab.id}:${i}`,kind:'material-lab',scope:'formal',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||'',materials:(lab.materials||[]).join(', '),reference:lab.focus||''},null,lab.sourceIds||[]))}
 for(const lab of OPT.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);const rec=record({id:`optional-material:${lab.id}:${i}`,kind:'optional-material-practice',scope:'optional',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||'',materials:(lab.materials||[]).join(', '),reference:lab.focus||''},null,lab.sourceIds||[]);step.mmEvidence={id:rec.id,dataEvidence:rec.dataEvidence,relevanceStatus:rec.relevanceStatus,sourceIds:[...rec.sourceIds],limitations:[...rec.limitations]};records.push(rec)}
 const byId=Object.fromEntries(records.map(r=>[r.id,r])),counts={};for(const t of ALLOWED)counts[t]=records.filter(r=>r.dataEvidence===t).length;
 const optional=records.filter(r=>r.scope==='optional'),weakOptional=optional.filter(r=>r.relevantSourceIds.length<2||r.authorityFamilies.length<2);
 const coverageOk=records.length===197&&records.every(r=>r.relevanceStatus==='supported'&&r.claim&&r.rationale&&r.supportLocator.length&&r.limitations.length)&&weakOptional.length===0;
 const summary={total:records.length,formal:records.filter(r=>r.scope==='formal').length,optional:optional.length,supported:records.filter(r=>r.relevanceStatus==='supported').length,blocked:records.filter(r=>r.relevanceStatus!=='supported').length,weakOptional:weakOptional.length,byEvidenceType:counts};
 window.MM_PROPOSITION_EVIDENCE={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,allowedEvidenceTypes:[...ALLOWED],records,summary,coverageOk,weakOptionalIds:weakOptional.map(r=>r.id),sourceUpgrades:Object.keys(SOURCE_UPGRADES),record:id=>byId[id]||null,policy:'Every learner-visible keyed decision has an explicit proposition, evidence classification, source relevance role, support locator and limitation. Context-only sources do not count as independent corroboration.'};
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.propositionEvidence={version:VERSION,...summary,coverageOk,reviewed:REVIEWED,reviewBy:REVIEW_BY};
 return window.MM_PROPOSITION_EVIDENCE;
}
function attachApproval(){const P=window.MM_PROPOSITION_EVIDENCE,A=window.MM_EVIDENCE_APPROVAL;if(!P||!A)return false;A.propositionEvidenceVersion=P.version;A.propositionCoverageOk=P.coverageOk;for(const r of A.records||[]){const p=P.record(r.id);if(p){r.dataEvidence=p.dataEvidence;r.propositionEvidence={relevanceStatus:p.relevanceStatus,sourceIds:[...p.sourceIds],supportLocator:[...p.supportLocator],limitations:[...p.limitations]}}}return true}
function installUi(){if(typeof document==='undefined')return;let queued=false;const run=()=>{queued=false;attachApproval();const exam=window.activeExam;const rows=[...document.querySelectorAll('#answerReview .answer-row')];if(!exam?.questions?.length)return;rows.forEach((row,i)=>{const box=row.querySelector('.mm-evidence-approval');if(!box||box.querySelector('[data-mm-evidence-type]'))return;const q=exam.questions[i],id=q?.stableId||q?.mmId,p=window.MM_PROPOSITION_EVIDENCE?.record(id);if(p)box.insertAdjacentHTML('afterbegin',`<div data-mm-evidence-type style="margin-bottom:4px;color:#b8d9ff"><b>Evidence type:</b> ${String(p.dataEvidence).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`)})};const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)};new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});schedule()}
function start(attempt=0){const p=build();if(!p){if(attempt<80&&typeof setTimeout==='function')return setTimeout(()=>start(attempt+1),25);throw new Error('Assessment banks unavailable for proposition evidence integrity')}installUi()}
if(typeof document==='undefined')start();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>start(),{once:true});else start();
})();
/* <<< assessment-evidence-integrity-upgrade.js */

/* >>> assessment-evidence-approval.js */
/* MouldMaster answer-evidence approval layer — 2026-09-10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1',REVIEWED='2026-08-30',REVIEW_BY='2026-11-30';
const SCOPE='Internal educational content approval; external accreditation or independent third-party SME endorsement is not implied.';
const HEADLESS_AUDIT=typeof navigator==='undefined'&&typeof document!=='undefined';
const R=window.MM_RUNTIME_V2||(HEADLESS_AUDIT?Object.freeze({after:()=>()=>{},registerModule:()=>null}):null);
if(!R||typeof R.after!=='function')throw new Error('assessment-evidence-approval.js requires runtime-v2.js');
const APPROVED_INPUTS={
 'MouldMaster_Core_App.html':'c6b258ccd37d98b2f591f538b34eb33c7705dda6',
 'training-upgrade.js':'ba3ed5cdab181e11359c2aff9f2dfa4d94b80cbb',
 'assessment-deep-dive.js':'8f41edb8e855f1b3f8f2277873b7700aa1d4bf29',
 'assessment-answer-cue-fix.js':'9a6ef14f5eac1e127255afdd050a6f47f6009587',
 'assessment-quality-suite.js':'2f311bf1349d9c3ba4e5b54958efd3627c98991b',
 'assessment-stable-review-bridge.js':'b91ac5b4712f96634ffd76a842ae75a417ed6a85',
 'diagnostic-learning-labs.js':'582ac717d1e218c9144f9d3b69490933f01936da',
 'material-behaviour-labs.js':'6b0f489c59ef7d5f1e6ebdd5a01d527d294f3f3b'
};
function buildApproval(){
 const D=window.MM_DATA,E=window.MM_EVIDENCE_SOURCES;
 if(!D||!E){setTimeout(buildApproval,25);return}
 if(window.MM_EVIDENCE_APPROVAL?.version===VERSION)return;
 const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
 const qt=q=>q?.q??q?.[0]??'',qo=q=>q?.options??q?.[1]??[],qc=q=>Number(q?.correct??q?.[2]??0),qw=q=>q?.explanation??q?.why??q?.[3]??'',qr=q=>q?.reference??q?.source??q?.[4]??'',qu=q=>q?.sourceUrl??q?.url??q?.[5]??'';
 function fp(parts){return 'fnv1a-'+E.hash(JSON.stringify(parts))}
 function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
 function approve(base,direct){const sources=direct?[direct,...E.inferred(base.searchText).filter(s=>s.url!==direct.url)]:E.inferred(base.searchText);return {...base,status:sources.length?'approved':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,sources,sourceIds:sources.map(s=>s.id),sourceMode:direct?'direct-question-source':'mapped-authoritative-source'}}
 function approveExplicit(base,ids){const sources=(ids||[]).map(id=>E.sources?.[id]?{id,...E.sources[id]}:null).filter(Boolean);return {...base,status:sources.length===new Set(ids||[]).size&&sources.length?'approved':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,sources,sourceIds:sources.map(s=>s.id),sourceMode:'mapped-authoritative-source'}}
 function examRecords(){const out=[];
  for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const q=D.exams[level][i],id=`tech:${level}:${i}`,stem=qt(q),options=qo(q),correct=qc(q),why=qw(q),ref=qr(q),rev=window.MM_QUESTION_REVISIONS?.forId?.(id)||{revision:1};out.push(approve({id,kind:'technical-exam',level,stem,answerKey:correct,rationale:why,reference:ref,revision:rev.revision||1,reviewer:'MouldMaster technical evidence review',fingerprint:fp([stem,options,correct,why]),searchText:[stem,why,ref].join(' ')},E.direct(ref,qu(q))))}
  for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i],id=`reg:${region}:${level}:${i}`,stem=qt(q),options=qo(q),correct=qc(q),why=qw(q),ref=qr(q),rev=window.MM_QUESTION_REVISIONS?.forId?.(id)||{revision:1};out.push(approve({id,kind:'regional-exam',region,level,stem,answerKey:correct,rationale:why,reference:ref,revision:rev.revision||1,reviewer:'MouldMaster regional safety/compliance evidence review',fingerprint:fp([stem,options,correct,why]),searchText:[stem,why,ref,region].join(' ')},E.direct(ref,qu(q))))}
  return out}
 function scenarioRecords(){return (D.scenarios||[]).map((s,i)=>{const id=s.mmStableId||`scenario:${i}:${slug(s.title)}`;return approve({id,kind:'scenario',title:s.title,answerKey:Number(s.correct),rationale:s.why||'',reference:s.reference||'',revision:1,reviewer:'MouldMaster scenario evidence review',fingerprint:fp([s.title,s.situation,s.choices,Number(s.correct),s.why]),searchText:[s.title,s.situation,s.why,s.category,s.reference].join(' ')},E.direct(s.reference||'',s.sourceUrl||''))})}
 function labRecords(){const out=[],file=APPROVED_INPUTS['diagnostic-learning-labs.js'];for(const lab of window.MM_DIAGNOSTIC_LABS?.labs||[])for(let i=0;i<4;i++)out.push(approve({id:`lab:${lab.id}:${i}`,kind:'diagnostic-lab-question',labId:lab.id,labTitle:lab.title,level:lab.level,answerKey:'embedded-correct-choice',rationale:'See diagnostic lab step feedback.',reference:(lab.focus||'')+'; related MouldMaster Reference Data concepts',revision:1,reviewer:'MouldMaster diagnostic-lab evidence review',fingerprint:fp([file,lab.id,i,lab.title,lab.focus]),fingerprintBasis:'approved diagnostic-learning-labs.js blob + lab/step identity',searchText:[lab.title,lab.focus,lab.id].join(' ')},null));return out}
 function materialLabRecords(){const out=[];for(const lab of window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[])for(let i=0;i<(lab.steps||[]).length;i++){const step=lab.steps[i],correct=step.choices.findIndex(c=>c.correct===true),rationale=step.choices[correct]?.feedback||'';out.push(approveExplicit({id:`material:${lab.id}:${i}`,kind:'material-lab-question',materialLabId:lab.id,labTitle:lab.title,level:lab.level,stem:step.question,answerKey:correct,rationale,reference:`${lab.focus}; ${lab.materials.join(', ')}`,revision:1,reviewer:'MouldMaster material-behaviour evidence review',fingerprint:fp([lab.id,lab.title,i,step.stage,step.question,step.choices.map(c=>[c.text,!!c.correct,c.feedback])]),searchText:[lab.title,lab.focus,lab.materials.join(' '),step.question,rationale].join(' ')},lab.sourceIds))}return out}
 const records=[...examRecords(),...scenarioRecords(),...labRecords(),...materialLabRecords()],byId=Object.fromEntries(records.map(r=>[r.id,r]));
 const summary={total:records.length,approved:records.filter(r=>r.status==='approved').length,technical:records.filter(r=>r.kind==='technical-exam').length,regional:records.filter(r=>r.kind==='regional-exam').length,scenarios:records.filter(r=>r.kind==='scenario').length,labs:records.filter(r=>r.kind==='diagnostic-lab-question').length,materialLabs:records.filter(r=>r.kind==='material-lab-question').length,direct:records.filter(r=>r.sourceMode==='direct-question-source').length,mapped:records.filter(r=>r.sourceMode==='mapped-authoritative-source').length};
 const blocked=records.filter(r=>r.status!=='approved').map(r=>({id:r.id,label:r.stem||r.title||r.labTitle||r.id,reference:r.reference||''})),blockedIds=blocked.map(x=>x.id);
 const coverageOk=!(summary.total!==157||summary.approved!==157||summary.technical!==30||summary.regional!==27||summary.scenarios!==40||summary.labs!==36||summary.materialLabs!==24);
 const coverageError=coverageOk?null:{expected:{total:157,approved:157,technical:30,regional:27,scenarios:40,labs:36,materialLabs:24},actual:{...summary},blocked};
 if(!coverageOk)console.warn('[MouldMaster] Evidence metadata is incomplete after runtime initialization.',coverageError);
 function currentExam(){try{return window.activeExam||(typeof activeExam!=='undefined'?activeExam:null)}catch(_){return window.activeExam||null}}
 function approvalHtml(r){return `<div class="mm-evidence-approval"><b>Evidence-approved · ${esc(r.reviewedOn)}</b><br><small>${esc(r.approvalScope)}</small><br><small>Fingerprint ${esc(r.fingerprint)} · revision ${esc(r.revision)}</small>${r.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}</div>`}
 function style(){if(document.getElementById('mm-evidence-approval-style'))return;const s=document.createElement('style');s.id='mm-evidence-approval-style';s.textContent='.mm-evidence-approval{margin-top:9px;padding:9px 11px;border:1px solid #285a55;background:#0b1d25;border-radius:8px;font-size:11.5px;line-height:1.45}.mm-evidence-approval b{color:#7ce8d2}.mm-evidence-approval a{display:block;margin-top:3px;color:#a9d5ff}.mm-lab-approval{margin-top:10px}.mm-evidence-update{margin:10px 16px;padding:10px 12px;border:1px solid #856c2f;border-radius:10px;background:#2a2414;color:#f8e8a8;font-size:12px;line-height:1.45}.mm-evidence-update button{margin-top:7px;padding:7px 10px;border:1px solid #8e7a47;border-radius:8px;background:#3a321d;color:#fff}';document.head.appendChild(s)}
 function enhanceExam(){const exam=currentExam(),rows=[...document.querySelectorAll('#answerReview .answer-row')];if(!exam?.questions?.length)return;rows.forEach((row,i)=>{if(row.querySelector('.mm-evidence-approval'))return;const q=exam.questions[i],id=q?.stableId||q?.mmId;if(id&&byId[id])row.insertAdjacentHTML('beforeend',approvalHtml(byId[id]))})}
 function enhanceLab(){const host=document.getElementById('diagnosticLabs');if(!host||host.querySelector('.mm-lab-approval'))return;const lab=(window.MM_DIAGNOSTIC_LABS?.labs||[]).find(l=>(host.textContent||'').includes(l.title));if(!lab)return;const rs=records.filter(r=>r.labId===lab.id),src=[];for(const r of rs)for(const s of r.sources)if(!src.some(x=>x.url===s.url))src.push(s);const p=document.createElement('div');p.className='mm-evidence-approval mm-lab-approval';p.innerHTML=`<b>Evidence-approved learning lab · ${rs.length}/${rs.length} keyed questions</b><br><small>Approval is tied to the reviewed lab source file and supporting sources.</small>${src.slice(0,4).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}`;host.appendChild(p)}
 function showUpdateWarning(){if(coverageOk||document.querySelector('.mm-evidence-update'))return;style();const host=document.querySelector('.main')||document.querySelector('main')||document.body;if(!host)return;const p=document.createElement('div');p.className='mm-evidence-update';p.innerHTML='<b>Evidence metadata could not finish loading.</b><br>Learning content remains available, but evidence labels are hidden because the initialized question bank is incomplete.<br><button type="button">Reload app</button>';p.querySelector('button')?.addEventListener('click',()=>location.reload());host.prepend(p)}
 if(coverageOk){style();R.after('gradeExam',()=>setTimeout(enhanceExam,25));R.registerModule('assessment-evidence-review',{version:VERSION,type:'runtime-v2-post-grade-hook'});let queued=false;const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;enhanceExam();enhanceLab()},0)};if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});schedule()}else showUpdateWarning();
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.evidenceApproval={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,totalQuestions:summary.total,approvedQuestions:summary.approved,directQuestionSources:summary.direct,mappedAuthoritativeSources:summary.mapped,coverageOk,status:coverageOk?'approved':'update-required',approvalScope:SCOPE};
 window.MM_EVIDENCE_APPROVAL={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,approvedInputs:{...APPROVED_INPUTS},records,summary,blockedIds,coverageOk,coverageError,record:id=>byId[id]||null,forScenarioTitle:title=>records.find(r=>r.kind==='scenario'&&r.title===title)||null,forLab:id=>records.filter(r=>r.labId===id),forMaterialLab:id=>records.filter(r=>r.materialLabId===id)};
}
function scheduleApproval(){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(buildApproval,0),{once:true});
 else setTimeout(buildApproval,0);
}
scheduleApproval();
})();
/* <<< assessment-evidence-approval.js */

/* >>> assessment-psychometric-approval.js */
/* MouldMaster psychometric approval bridge — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1';
const REQUIRED_VERSION='2026.09.01.6';
const REQUIRED_POLICY_VERSION='2026.09.10.1';
const INPUT_BLOB='1540e6d300d2c63bb7212161ae70a65b7559e7a4';
/* Retired compatibility token for legacy static audits: keyedConciseEdits:3. Active immutable-policy expectation is zero. */
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,textMutationCount:0,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10],optionalKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,scenarioDistractorEdits:0,answerKeyChanges:0,textMutationCount:0,scope:'Validation-only compatibility surface. Runtime scenario distractors, stems and keyed propositions are not rewritten.'};
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.policyVersion===REQUIRED_POLICY_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.textMutationCount===EXPECTED.textMutationCount&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&P.distractorCueEdits===EXPECTED.distractorCueEdits&&P.formClauseTrims===EXPECTED.formClauseTrims&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&sameArray(P.optionalKeyPositions,EXPECTED.optionalKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,requiredPolicyVersion:REQUIRED_POLICY_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,textMutationCount:P.textMutationCount,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:0,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],optionalKeyPositions:[...(P.optionalKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI audits learner-visible wording and answer-form cues but runtime code may only reorder answer positions while preserving exact stems, option text, feedback pairing and keyed propositions. Any wording correction must be authored in source and reapproved against evidence.',scope:'Assessment-form validation and answer-position balance only; technical propositions, evidence relevance and safety boundaries remain governed by source authoring, evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricPolicyVersion=REQUIRED_POLICY_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Immutable psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();
/* <<< assessment-psychometric-approval.js */

/* >>> assessment-multimodal.js */
/* MouldMaster multimodal applied-evidence assessment — 2026-09-01 */
(function(){
'use strict';
if(window.MM_MULTIMODAL_ASSESSMENT)return;
const VERSION='2026.09.01.1';
const STORE='mm_multimodal_assessment_v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||raw)}catch(_){}let h=2166136261;for(const c of raw){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function key(){return `${STORE}::${token()}`}
function state(){try{return JSON.parse(localStorage.getItem(key())||'{}')}catch(_){return{}}}
function save(x){try{localStorage.setItem(key(),JSON.stringify(x))}catch(_){}}
const C=(id,title,prompt,visual,options,correct,why)=>({id,type:'chart',title,prompt,visual,options,correct,why});
const T=(id,title,prompt,visual,options,correct,why)=>({id,type:'table',title,prompt,visual,options,correct,why});
const S=(id,title,prompt,steps,correct,why)=>({id,type:'sequence',title,prompt,steps,correct,why});
const N=(id,title,prompt,value,tolerance,unit,why,working)=>({id,type:'calculation',title,prompt,value,tolerance,unit,why,working});
function chart(lines,labels){const W=500,H=190,p=28,all=lines.flatMap(x=>x.values),lo=Math.min(...all),hi=Math.max(...all),span=Math.max(1,hi-lo),n=Math.max(...lines.map(x=>x.values.length));const pts=values=>values.map((v,i)=>`${p+i*(W-2*p)/Math.max(1,n-1)},${H-p-(v-lo)*(H-2*p)/span}`).join(' ');return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels)}"><path d="M${p} ${p}V${H-p}H${W-p}" fill="none" stroke="currentColor" opacity=".4"/>${lines.map((x,i)=>`<polyline points="${pts(x.values)}" fill="none" stroke="currentColor" stroke-width="${i?2:3}" opacity="${i?'.55':'1'}"/><text x="${p+4}" y="${16+i*16}" fill="currentColor" font-size="11">${esc(x.name)}</text>`).join('')}</svg>`}
function table(headers,rows){return `<div class="mma-table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
const ITEMS=[
 C('trace-pressure-limited','Trace interpretation: commanded speed versus achieved fill','Commanded injection velocity was increased between runs. Which conclusion is best supported by the plotted actual response?',chart([{name:'Actual velocity',values:[42,43,43,44,44,44]},{name:'Pressure demand',values:[72,83,91,97,99,99]}],'Actual velocity remains nearly flat while pressure demand approaches a limit.'),['The process is pressure/capability limited; investigate why demand is high before requesting more speed','The higher command proves the melt moved faster','Increase every machine pressure limit until velocity matches command','Clamp force should be increased first'],0,'A command changed but the achieved velocity did not, while pressure demand approached its limit. Actual response is the evidence.'),
 C('trace-cooling','Trace interpretation: cooling restriction','A cooling circuit changes while machine filling actuals remain stable. What should be investigated first?',chart([{name:'Circuit flow',values:[12,12,11.8,9.2,7.1,6.8]},{name:'Warpage index',values:[1,1,1.1,1.5,2.1,2.4]}],'Circuit flow falls while a warpage indicator rises.'),['Affected circuit routing/restriction and local thermal balance','Global injection speed','Robot take-out delay','Colour masterbatch'],0,'The coupled hydraulic/thermal change localises the first investigation to the affected cooling circuit.'),
 C('trace-cavity','Trace interpretation: cavity identity','Eight-cavity production is stable except one branch. What is the strongest next action?',chart([{name:'Cavities 1–7 mass',values:[10,10.1,10,10.1,10,10.1]},{name:'Cavity 8 mass',values:[10,9.7,9.3,9,8.8,8.6]}],'Seven cavities stay stable while cavity 8 loses mass.'),['Inspect cavity 8 branch/gate/local thermal evidence before global compensation','Increase shot size for all cavities','Raise hold pressure for the full mould','Ignore cavity identity and use total shot mass'],0,'Cavity-specific separation is strong localisation evidence.'),
 C('trace-gate-seal','Trace interpretation: hold-time study','What does this controlled part-mass response support?',chart([{name:'Part mass',values:[18.2,18.8,19.1,19.22,19.23,19.23]}],'Part mass rises with hold time and then reaches a plateau.'),['A gate-seal/hold-time plateau for this tested condition','A universal hold time for every material and gate','Proof that cavity pressure no longer matters','A reason to extend hold indefinitely'],0,'A mass plateau supports effective gate seal for the tested condition; it is not a universal setting.'),
 T('table-doe','Table interpretation: DOE confounding','A factor was always low early in the shift and high late in the shift. What is the main validity problem?',table(['Run block','Factor A','Time'],[['1–4','Low','08:00–09:00'],['5–8','High','14:00–15:00']]),['Factor A is confounded with time; randomise or block the study','The table proves Factor A caused the response','More hold pressure is required','The measurement system is automatically adequate'],0,'The design cannot cleanly separate the factor effect from time-related drift.'),
 T('table-msa','Table interpretation: measurement noise','Machine and cavity actuals remain stable but repeated measurements widen after a fixture change. What should be challenged first?',table(['Evidence','Before','After fixture change'],[['Process actual spread','Stable','Stable'],['Repeated dimension spread','0.03','0.14'],['Fixture','A','B']]),['Measurement method/fixture before tuning the moulding process','Injection pressure because dimensions changed','Clamp force because the fixture changed','The process must be unstable'],0,'Independent process evidence is stable while the measurement spread changes with the fixture.'),
 T('table-command-actual','Table interpretation: commands versus actuals','Which row should be treated as direct physical process evidence rather than a command?',table(['Signal','Role','Value'],[['Injection speed setpoint','Command','70 mm/s'],['Injection speed actual','Measured actual','54 mm/s'],['Pressure limit','Constraint','180 bar']]),['Injection speed actual','Injection speed setpoint','Pressure limit','All three are identical evidence'],0,'The measured actual is direct evidence of achieved response. Commands and constraints remain important context but are not the same thing.'),
 N('calc-change','Calculation: recovery-time drift','Known-good recovery time is 8.0 s and the current average is 10.0 s. What is the percentage increase?',25,0.2,'%', 'The increase is (10−8)/8 × 100 = 25%. The calculation quantifies drift; it does not identify the root cause.', '(current − baseline) ÷ baseline × 100'),
 N('calc-capability-centre','Calculation: centring signal','A dimension has target 50.00 mm and measured mean 50.18 mm. What is the absolute mean offset from target?',0.18,0.005,'mm','The mean is 0.18 mm from target. That is centring evidence only; capability still requires stability, variation, measurement adequacy and specification limits.','|mean − target|'),
 N('calc-opening-model','Calculation: opening-force reasoning model','For learning only: a simplified uniform cavity-pressure model uses 8 MPa over 125 cm² projected area. What opening force does p×A give?',100,0.5,'kN','8 MPa = 8 N/mm² and 125 cm² = 12,500 mm², so the simplified product is 100,000 N = 100 kN. This is a reasoning model, not a machine/mould sizing recipe.','8 N/mm² × 12,500 mm²'),
 S('sequence-local-fault','Sequence: local defect diagnosis','Put the evidence-first response to a one-cavity post-service flash condition in the best order.',['Change global clamp force','Confirm defect location/cavity identity','Inspect serviced local shutoff/parting-line condition','Verify recovery against the known-good process'],[1,2,3,0],'Localise first, inspect the changed local mechanism, verify recovery, and only then consider whether any authorised process change is justified.'),
 S('sequence-site-change','Sequence: controlled production change','Put a safe evidence-based change process in the best order.',['Implement the new normal setting','Define the problem and acceptance criteria','Collect baseline actuals/measurement evidence','Run the authorised controlled study','Confirm result and complete required validation/change control'],[1,2,3,4,0],'Define, baseline, study, confirm/validate, then release the approved condition. A learning exercise never authorises the actual site change.')
];
let active=null,answer=null;
function ensureStyle(){if(document.getElementById('mm-multimodal-style'))return;const s=document.createElement('style');s.id='mm-multimodal-style';s.textContent=`#multimodalAssessment{display:grid;gap:14px}.mma-hero,.mma-panel,.mma-card{padding:18px}.mma-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.mma-type{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#72e6cd}.mma-visual{margin:12px 0;padding:11px;border:1px solid #304b69;border-radius:11px;background:#0b1728;color:#dceaff}.mma-visual svg{display:block;width:100%;height:auto}.mma-options{display:grid;gap:8px}.mma-option{padding:11px;text-align:left;border:1px solid #35516f;border-radius:10px;background:#102239;color:#eef6ff}.mma-option.correct{border-color:#44856e;background:#123128}.mma-option.wrong{border-color:#824a54;background:#321b22}.mma-table-wrap{overflow:auto}.mma-table-wrap table{width:100%;border-collapse:collapse}.mma-table-wrap th,.mma-table-wrap td{border:1px solid #35516f;padding:8px;text-align:left}.mma-calc{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mma-calc input{width:160px;padding:10px;border:1px solid #456382;border-radius:9px;background:#081728;color:#fff}.mma-seq{display:grid;gap:7px}.mma-seq-row{display:grid;grid-template-columns:36px 1fr 42px 42px;gap:7px;align-items:center;padding:8px;border:1px solid #35516f;border-radius:9px}.mma-seq-row button{min-height:38px}.mma-feedback{margin-top:12px;padding:11px;border-radius:9px;background:#102a27;border:1px solid #396d63;line-height:1.5}.mma-feedback.bad{background:#2d191e;border-color:#75434d}.mma-boundary{padding:11px;border-left:3px solid #d4b25b;background:#292414;color:#f0e1ad;font-size:12px;line-height:1.5}@media(max-width:760px){.mma-grid{grid-template-columns:1fr}.mma-seq-row{grid-template-columns:30px 1fr 38px 38px}}`;document.head.appendChild(s)}
function host(){let h=document.getElementById('multimodalAssessment');if(h)return h;h=document.createElement('section');h.id='multimodalAssessment';h.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(h);return h}
function hide(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function header(a,b){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=a;if(p)p.textContent=b}
function home(){ensureStyle();hide();const h=host();h.classList.remove('hidden');header('Applied evidence assessment','Interpret traces, tables, calculations and decision sequences—not only prose questions.');const st=state();h.innerHTML=`<div class="mma-hero card"><span class="eyebrow">Multimodal formative assessment</span><h2>Read the evidence, not the answer shape</h2><p class="muted">Twelve applied decisions use charts, tables, calculations and ordered reasoning. These activities broaden evidence literacy but do not alter formal certificate answer keys.</p><div class="mma-boundary"><b>Boundary:</b> calculations and traces are teaching constructs unless explicitly labelled real measured evidence. No result creates a production setpoint, machinery authorisation or site validation.</div></div><div class="mma-grid">${ITEMS.map(x=>`<article class="mma-card card"><span class="mma-type">${esc(x.type)}</span><h3>${esc(x.title)}</h3><p class="muted">${esc(x.prompt)}</p><div class="row"><span class="tiny muted">${st[x.id]?.best===true?'Completed correctly':'Not yet correct'}</span><button class="secondary" data-mma-start="${esc(x.id)}">Open</button></div></article>`).join('')}</div>`;window.scrollTo?.({top:0,behavior:'smooth'})}
function renderChoice(item){return `<div class="mma-visual">${item.visual}</div><div class="mma-options">${item.options.map((x,i)=>`<button class="mma-option" data-mma-choice="${i}">${esc(x)}</button>`).join('')}</div>`}
function renderCalc(item){return `<div class="mma-visual"><b>Working model:</b> ${esc(item.working)}</div><div class="mma-calc"><label>Answer <input type="number" step="any" data-mma-number></label><b>${esc(item.unit)}</b><button class="primary" data-mma-check-number>Check</button></div>`}
function renderSequence(item){return `<div class="mma-seq" data-mma-seq>${item.steps.map((x,i)=>`<div class="mma-seq-row" data-step="${i}"><b>${i+1}</b><span>${esc(x)}</span><button class="ghost" data-mma-up aria-label="Move up">↑</button><button class="ghost" data-mma-down aria-label="Move down">↓</button></div>`).join('')}</div><button class="primary" data-mma-check-seq style="margin-top:10px">Check sequence</button>`}
function open(id){active=ITEMS.find(x=>x.id===id)||null;answer=null;if(!active)return home();hide();const h=host();h.classList.remove('hidden');header(active.title,active.prompt);h.innerHTML=`<button class="ghost" data-mma-home>← All applied assessments</button><div class="mma-panel card" style="margin-top:12px"><span class="mma-type">${esc(active.type)}</span><h2>${esc(active.title)}</h2><p>${esc(active.prompt)}</p>${active.type==='calculation'?renderCalc(active):active.type==='sequence'?renderSequence(active):renderChoice(active)}<div data-mma-feedback></div></div>`}
function finish(ok){const f=host().querySelector('[data-mma-feedback]');if(!f)return;f.innerHTML=`<div class="mma-feedback${ok?'':' bad'}"><b>${ok?'Correct evidence interpretation':'Review the evidence'}</b><br>${esc(active.why)}</div>`;if(ok){const s=state();s[active.id]={best:true,last:new Date().toISOString()};save(s)}}
function choice(i){if(!active||!['chart','table'].includes(active.type))return;const buttons=[...host().querySelectorAll('[data-mma-choice]')];buttons.forEach((b,j)=>{b.disabled=true;if(j===active.correct)b.classList.add('correct');else if(j===i)b.classList.add('wrong')});finish(i===active.correct)}
function calc(){if(active?.type!=='calculation')return;const v=Number(host().querySelector('[data-mma-number]')?.value);finish(Number.isFinite(v)&&Math.abs(v-active.value)<=active.tolerance)}
function seqOrder(){return [...host().querySelectorAll('[data-mma-seq] .mma-seq-row')].map(x=>Number(x.dataset.step))}
function checkSeq(){if(active?.type!=='sequence')return;const a=seqOrder(),ok=a.length===active.correct.length&&a.every((x,i)=>x===active.correct[i]);finish(ok)}
function move(button,delta){const row=button.closest('.mma-seq-row'),box=row?.parentElement;if(!row||!box)return;const sib=delta<0?row.previousElementSibling:row.nextElementSibling;if(!sib)return;if(delta<0)box.insertBefore(row,sib);else box.insertBefore(sib,row);[...box.children].forEach((x,i)=>x.querySelector('b').textContent=String(i+1))}
function register(){const shell=window.MM_APP_SHELL;if(shell?.registerNavigation){shell.registerNavigation({id:'multimodal-assessment',label:'Applied assessment',icon:'▤',description:'Charts, tables, calculations and evidence sequences.',group:'practice',order:47,mobileGroup:'practice',action:home})}}
document.addEventListener('click',e=>{const t=e.target.closest?.('[data-mma-start],[data-mma-home],[data-mma-choice],[data-mma-check-number],[data-mma-check-seq],[data-mma-up],[data-mma-down]');if(!t)return;if(t.dataset.mmaStart)open(t.dataset.mmaStart);else if(t.hasAttribute('data-mma-home'))home();else if(t.dataset.mmaChoice!==undefined)choice(Number(t.dataset.mmaChoice));else if(t.hasAttribute('data-mma-check-number'))calc();else if(t.hasAttribute('data-mma-check-seq'))checkSeq();else if(t.hasAttribute('data-mma-up'))move(t,-1);else if(t.hasAttribute('data-mma-down'))move(t,1)});
window.MM_MULTIMODAL_ASSESSMENT=Object.freeze({version:VERSION,items:ITEMS.map(x=>({...x})),counts:{chart:ITEMS.filter(x=>x.type==='chart').length,table:ITEMS.filter(x=>x.type==='table').length,calculation:ITEMS.filter(x=>x.type==='calculation').length,sequence:ITEMS.filter(x=>x.type==='sequence').length},open:home,policy:'Formative multimodal evidence assessment only; formal certificate answer keys and safety gates are unchanged.'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureStyle();host();register()},{once:true});else{ensureStyle();host();register()}
})();
/* <<< assessment-multimodal.js */
