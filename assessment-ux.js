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

R.transform('getExamQuestions',(rows,level,region)=>rotateOpeningQuestion(rows,level,region));
R.after('startExam',()=>{state=null;setTimeout(decorateExam,0)});
R.after('gradeExam',()=>setTimeout(decorateReview,0));
const baseScenario=window.answerScenario;if(typeof baseScenario==='function'&&!baseScenario.__mmAssessmentUx){const wrapped=function(i,ci,el){const r=baseScenario.apply(this,arguments);setTimeout(()=>decorateScenario(i,ci,el),0);return r};wrapped.__mmAssessmentUx=true;window.answerScenario=wrapped}
R.registerModule('assessment-ux',{version:VERSION,type:'assessment-ui-hooks',storage:'runtime-v2 learner-scoped'});

window.MM_ASSESSMENT_UX={version:VERSION,decorateExam,decorateReview,showQuestion,rotateOpeningQuestion,resetQuestionRotation,questionRotation:{historyLimit:FIRST_HISTORY_LIMIT,scope:'learner + level + region',persistence:'learner-scoped localStorage stable IDs only; no answers or personal data',storageKey:()=>R.storage.key(HISTORY_KEY),policy:'avoid the last three opening questions across starts, reloads and learner switches when another valid item is available'}};
})();