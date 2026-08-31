/* MouldMaster assessment experience — persistent question rotation hardening 2026-08-31.4 */
(function(){
'use strict';

const VERSION='2026.08.31.4';
const FIRST_HISTORY_LIMIT=3;
const HISTORY_KEY='mm_assessment_opening_history_v1';
const root=document.documentElement;
const firstQuestionHistory=new Map();

function readQuestionHistory(){
  try{
    const stored=localStorage.getItem(HISTORY_KEY);
    const raw=JSON.parse(stored||'{}');
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
    localStorage.setItem(HISTORY_KEY,JSON.stringify(out));
    return true;
  }catch(_){return false}
}
readQuestionHistory();

function addStyles(){
  if(document.getElementById('mm-assessment-ux-style'))return;
  const s=document.createElement('style');
  s.id='mm-assessment-ux-style';
  s.textContent=`
  .modal-card.mm-assessment-modal{width:min(980px,96vw);padding:clamp(18px,3vw,30px);scroll-padding-bottom:110px}
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
  .mm-step{width:34px;height:34px;border-radius:10px;border:1px solid #355171;background:#102039;color:#a9bdd6;font-size:12px;font-weight:800;padding:0}
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
    .mm-exam-steps{gap:5px}.mm-step{width:31px;height:31px;border-radius:9px}
    .mm-exam-nav{position:fixed;left:0;right:0;bottom:0;border-radius:14px 14px 0 0;margin:0;padding:10px 12px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -14px 34px rgba(0,0,0,.34)}
    .mm-exam-nav-top{margin-bottom:8px}.mm-exam-actions{display:grid;grid-template-columns:1fr 1fr}.mm-exam-actions .mm-native-grade{grid-column:1/-1;width:100%;margin:0}
    .mm-unanswered-note{grid-column:1/-1;text-align:left;margin:0}
  }
  @media(prefers-reduced-motion:reduce){.mm-option-card{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function questionIdentity(item){
  return String(item?.stableId||item?.mmId||item?.id||item?.q||'').trim();
}
function questionScope(level,region){
  return `${String(level||'unknown')}::${String(region||'ALL')}`;
}
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
function resetQuestionRotation(){
  firstQuestionHistory.clear();
  try{localStorage.removeItem(HISTORY_KEY)}catch(_){}
}

function optionLabels(card,index){
  const labels=[...card.querySelectorAll('label.option')];
  labels.forEach((label,j)=>{
    label.classList.add('mm-option-card');
    const input=label.querySelector('input[type=radio]');
    if(!input)return;
    if(!label.querySelector('.mm-option-key')){
      const key=document.createElement('span');
      key.className='mm-option-key';
      key.setAttribute('aria-hidden','true');
      key.textContent=String.fromCharCode(65+j);
      input.insertAdjacentElement('afterend',key);
    }
    const sync=()=>{
      labels.forEach(x=>x.classList.toggle('mm-option-selected',!!x.querySelector('input[type=radio]:checked')));
      const step=document.querySelector(`.mm-step[data-mm-question="${index}"]`);
      if(step)step.classList.toggle('mm-step-answered',!!card.querySelector('input[type=radio]:checked'));
      updateAssessmentStatus();
    };
    input.addEventListener('change',sync,{passive:true});
  });
}

let state=null;
function updateAssessmentStatus(){
  if(!state)return;
  const answered=state.cards.filter(c=>!!c.querySelector('input[type=radio]:checked')).length;
  const remaining=state.cards.length-answered;
  state.answered.textContent=`${answered}/${state.cards.length} answered`;
  state.grade.disabled=remaining>0;
  state.grade.title=remaining?`Answer ${remaining} remaining question${remaining===1?'':'s'} before grading`:'Grade and review every answer';
  state.unanswered.textContent=remaining?`${remaining} unanswered`:'Ready to grade';
  state.steps.forEach((step,i)=>step.classList.toggle('mm-step-answered',!!state.cards[i].querySelector('input[type=radio]:checked')));
  if(state.current===state.cards.length-1){
    state.next.textContent=remaining?'Review unanswered':'All questions answered';
    state.next.disabled=!remaining;
  }else{
    state.next.textContent='Next question';
    state.next.disabled=false;
  }
}

function showQuestion(index,moveFocus){
  if(!state)return;
  const max=state.cards.length-1;
  state.current=Math.max(0,Math.min(index,max));
  state.cards.forEach((card,i)=>{
    const on=i===state.current;
    card.classList.toggle('mm-current-question',on);
    card.setAttribute('aria-hidden',on?'false':'true');
  });
  state.steps.forEach((step,i)=>{
    step.classList.toggle('mm-step-current',i===state.current);
    if(i===state.current)step.setAttribute('aria-current','step'); else step.removeAttribute('aria-current');
  });
  state.progress.textContent=`Question ${state.current+1} of ${state.cards.length}`;
  state.prev.disabled=state.current===0;
  updateAssessmentStatus();
  if(moveFocus){
    const stem=state.cards[state.current].querySelector('.mm-question-stem');
    if(stem){try{stem.focus({preventScroll:true})}catch(_){stem.focus()}}
    try{state.cards[state.current].scrollIntoView({block:'nearest',behavior:root.matches(':root')&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}
  }
}

function firstUnanswered(){
  if(!state)return -1;
  return state.cards.findIndex(c=>!c.querySelector('input[type=radio]:checked'));
}

function decorateExam(){
  const host=document.getElementById('examQuestions');
  if(!host||host.dataset.mmAssessmentUx==='1')return;
  const cards=[...host.querySelectorAll('.question')];
  if(!cards.length)return;
  const modal=host.closest('.modal-card')||host.parentElement;
  if(!modal)return;
  const grade=[...modal.querySelectorAll('button')].find(b=>/Grade\s*&?\s*review/i.test(b.textContent||''));
  if(!grade)return;

  host.dataset.mmAssessmentUx='1';
  host.classList.add('mm-focus-mode');
  modal.classList.add('mm-assessment-modal');

  cards.forEach((card,i)=>{
    const stem=card.querySelector('b');
    if(stem){
      stem.classList.add('mm-question-stem');
      stem.id=`mm-question-stem-${i}`;
      stem.tabIndex=-1;
      card.setAttribute('role','group');
      card.setAttribute('aria-labelledby',stem.id);
      const meta=document.createElement('div');
      meta.className='mm-question-meta';
      meta.innerHTML=`<span>Question ${i+1}</span><span>${i===cards.length-1?'Final question':'Choose the best answer'}</span>`;
      stem.insertAdjacentElement('beforebegin',meta);
    }
    optionLabels(card,i);
  });

  const steps=document.createElement('div');
  steps.className='mm-exam-steps';
  steps.setAttribute('aria-label','Assessment question navigation');
  cards.forEach((_card,i)=>{
    const b=document.createElement('button');
    b.type='button';b.className='mm-step';b.dataset.mmQuestion=String(i);b.textContent=String(i+1);b.setAttribute('aria-label',`Go to question ${i+1}`);
    b.addEventListener('click',()=>showQuestion(i,true));steps.appendChild(b);
  });
  host.insertAdjacentElement('beforebegin',steps);

  const nav=document.createElement('div');
  nav.className='mm-exam-nav';
  nav.innerHTML=`<div class="mm-exam-nav-top"><div><div class="mm-exam-progress" aria-live="polite"></div><div class="mm-exam-answered"></div></div><div class="mm-unanswered-note" aria-live="polite"></div></div><div class="mm-exam-actions"><button type="button" class="secondary mm-exam-prev">Previous</button><button type="button" class="secondary mm-exam-next">Next question</button></div>`;
  host.insertAdjacentElement('afterend',nav);
  const actions=nav.querySelector('.mm-exam-actions');
  grade.classList.add('mm-native-grade');
  actions.appendChild(grade);

  state={
    modal,host,cards,steps:[...steps.querySelectorAll('.mm-step')],nav,grade,current:0,
    progress:nav.querySelector('.mm-exam-progress'),answered:nav.querySelector('.mm-exam-answered'),unanswered:nav.querySelector('.mm-unanswered-note'),
    prev:nav.querySelector('.mm-exam-prev'),next:nav.querySelector('.mm-exam-next')
  };
  state.prev.addEventListener('click',()=>showQuestion(state.current-1,true));
  state.next.addEventListener('click',()=>{
    if(state.current<state.cards.length-1)showQuestion(state.current+1,true);
    else{const i=firstUnanswered();if(i>=0)showQuestion(i,true)}
  });
  grade.disabled=true;
  showQuestion(0,false);
}

function decorateReview(){
  const result=document.getElementById('examResult');
  const review=document.getElementById('answerReview');
  if(!result||result.classList.contains('hidden')||!review)return;
  const modal=result.closest('.modal-card');
  if(modal)modal.classList.add('mm-exam-reviewed');
  review.setAttribute('aria-label','Assessment answer review');
  [...review.querySelectorAll('.answer-row')].forEach((row,i)=>{
    row.tabIndex=0;
    row.setAttribute('aria-label',`Question ${i+1} review: ${row.classList.contains('correct')?'correct':'review needed'}`);
  });
  try{result.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}
}

function decorateScenario(i,ci,el){
  if(!el||!el.closest)return;
  const scenario=el.closest('.scenario');
  if(!scenario)return;
  const choices=[...scenario.querySelectorAll('.choice')];
  choices.forEach(x=>x.classList.remove('mm-choice-selected','mm-choice-correct','mm-choice-review'));
  el.classList.add('mm-choice-selected');
  const D=window.MM_DATA;
  const correct=D?.scenarios?.[i]?.correct;
  if(Number.isInteger(correct))el.classList.add(ci===correct?'mm-choice-correct':'mm-choice-review');
}

addStyles();
const baseQuestions=window.getExamQuestions;
if(typeof baseQuestions==='function')window.getExamQuestions=function(level,region){
  return rotateOpeningQuestion(baseQuestions.apply(this,arguments),level,region);
};
const baseStart=window.startExam;
if(typeof baseStart==='function')window.startExam=function(){state=null;const r=baseStart.apply(this,arguments);setTimeout(decorateExam,0);return r};
const baseGrade=window.gradeExam;
if(typeof baseGrade==='function')window.gradeExam=function(){const r=baseGrade.apply(this,arguments);setTimeout(decorateReview,0);return r};
const baseScenario=window.answerScenario;
if(typeof baseScenario==='function')window.answerScenario=function(i,ci,el){const r=baseScenario.apply(this,arguments);setTimeout(()=>decorateScenario(i,ci,el),0);return r};

window.MM_ASSESSMENT_UX={
  version:VERSION,
  decorateExam,
  decorateReview,
  showQuestion,
  rotateOpeningQuestion,
  resetQuestionRotation,
  questionRotation:{historyLimit:FIRST_HISTORY_LIMIT,scope:'learner + level + region',persistence:'learner-scoped localStorage stable IDs only; no answers or personal data',storageKey:HISTORY_KEY,policy:'avoid the last three opening questions across starts, reloads and learner switches when another valid item is available'}
};
})();