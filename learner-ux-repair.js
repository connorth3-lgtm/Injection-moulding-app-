/* MouldMaster learner UX repair — 2026.09.06.14 */
(function(){
'use strict';
if(window.MM_LEARNER_UX_REPAIR)return;
const VERSION='2026.09.06.14';
const ASSESSMENT_HISTORY_KEY='mm-assessment-question-history-v4';
const ASSESSMENT_HISTORY_LIMIT=8;
const ASSESSMENT_CANDIDATES=12;
let lastLessonId=null;
let queued=false;
let resetQueued=false;

function ensureStyles(){
  if(document.querySelector('link[data-mm-learner-ux-repair]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`./learner-ux-repair.css?v=${encodeURIComponent(VERSION)}`;
  link.dataset.mmLearnerUxRepair=VERSION;
  document.head.appendChild(link);
}
function mobile(){return !!window.matchMedia?.('(max-width:760px)').matches}
function lessonVisible(){const root=document.getElementById('lesson');return !!(root&&!root.classList.contains('hidden'))}
function currentLessonId(){
  try{return typeof currentLesson==='function'?String(currentLesson()?.id??''):''}catch(_){return ''}
}
function hideRedundant(el){
  if(!el)return;
  el.hidden=true;
  el.setAttribute('aria-hidden','true');
  if(el.matches?.('button,a,input,select,textarea'))el.tabIndex=-1;
  el.querySelectorAll?.('button,a,input,select,textarea').forEach(x=>x.tabIndex=-1);
}
function repairLessonChrome(){
  if(!mobile())return;
  const root=document.getElementById('lesson');
  const article=root?.querySelector('.lesson-body');
  if(!root||!article)return;
  root.classList.add('mm-learner-ux-repaired');
  root.querySelectorAll('.mm-mobile-actions,.mm-mobile-lessons,.mm-lesson-progress,.mm-reading-guide,.mm-read-marker').forEach(hideRedundant);
  const hero=article.querySelector(':scope > .mm-simple-lesson-hero');
  if(hero&&article.firstElementChild!==hero)article.prepend(hero);
}
function resetLessonScroll(){
  if(!mobile()||!lessonVisible())return;
  const nodes=[document.documentElement,document.body,document.scrollingElement,document.querySelector('main.main'),document.querySelector('.main'),document.getElementById('app')];
  for(const node of nodes){if(!node)continue;try{node.scrollTop=0;node.scrollLeft=0}catch(_){}}
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){try{window.scrollTo(0,0)}catch(__){}}
}
function runRepair(reset){
  repairLessonChrome();
  if(reset)resetLessonScroll();
}
function scheduleRepair(reset=false){
  if(reset)resetQueued=true;
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    const shouldReset=resetQueued;resetQueued=false;
    runRepair(shouldReset);
    requestAnimationFrame(()=>{
      repairLessonChrome();
      if(shouldReset)resetLessonScroll();
      requestAnimationFrame(()=>{repairLessonChrome();if(shouldReset)resetLessonScroll()});
    });
  });
}
function onLessonRender(){
  const id=currentLessonId();
  const changed=!!id&&id!==lastLessonId;
  if(id)lastLessonId=id;
  scheduleRepair(changed);
}
function normaliseQuestionText(value){return String(value||'').replace(/\s+/g,' ').trim().toLowerCase()}
function questionKey(item){return normaliseQuestionText(item?.q||item?.question||item?.[0])}
function validQuestion(item){
  if(!item||!questionKey(item))return false;
  const options=Array.isArray(item.options)?item.options:(Array.isArray(item[1])?item[1]:null);
  const correct=Number.isInteger(item.correct)?item.correct:(Number.isInteger(item[2])?item[2]:NaN);
  return !!(options&&options.length>=2&&options.every(option=>String(option||'').trim())&&Number.isInteger(correct)&&correct>=0&&correct<options.length);
}
function dedupeForm(items){
  const seen=new Set();
  return (Array.isArray(items)?items:[]).filter(item=>{
    const key=questionKey(item);
    if(!validQuestion(item)||seen.has(key))return false;
    seen.add(key);return true;
  });
}
function historyScope(level,region){return `${String(level||'unknown')}|${String(region||'ALL')}`}
function readAssessmentHistory(){
  try{
    const raw=JSON.parse(localStorage.getItem(ASSESSMENT_HISTORY_KEY)||'{}');
    return raw&&typeof raw==='object'?raw:{};
  }catch(_){return {}}
}
function writeAssessmentHistory(history){
  try{localStorage.setItem(ASSESSMENT_HISTORY_KEY,JSON.stringify(history))}catch(_){}
}
function candidateScore(form,recent){
  const keys=form.map(questionKey);
  const last=recent[0]||[];
  const recentCounts=new Map();
  recent.forEach((attempt,age)=>attempt.forEach(key=>recentCounts.set(key,(recentCounts.get(key)||0)+(ASSESSMENT_HISTORY_LIMIT-age))));
  const overlapLast=keys.reduce((sum,key)=>sum+(last.includes(key)?1:0),0);
  const reuseWeight=keys.reduce((sum,key)=>sum+(recentCounts.get(key)||0),0);
  const sameFirst=!!(keys[0]&&last[0]&&keys[0]===last[0]);
  return (sameFirst?100000:0)+(overlapLast*1000)+reuseWeight;
}
function rotateAwayFromPreviousFirst(form,previousFirst){
  if(!previousFirst||form.length<2||questionKey(form[0])!==previousFirst)return form;
  const at=form.findIndex((item,index)=>index>0&&questionKey(item)!==previousFirst);
  if(at<1)return form;
  const copy=form.slice();
  const [replacement]=copy.splice(at,1);copy.unshift(replacement);
  return copy;
}
function assessmentFingerprint(form){
  const text=form.map(item=>`${questionKey(item)}|${String(item.options?.[item.correct]??item?.[1]?.[item?.[2]]??'')}`).sort().join('\n');
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return `qbank-${(hash>>>0).toString(16).padStart(8,'0')}`;
}
function installAssessmentRotation(){
  if(window.__MM_ASSESSMENT_ROTATION_V4__)return;
  const base=window.getExamQuestions;
  if(typeof base!=='function')return;
  window.getExamQuestions=function(level,region){
    const scope=historyScope(level,region);
    const history=readAssessmentHistory();
    const recent=Array.isArray(history[scope])?history[scope].filter(Array.isArray).slice(0,ASSESSMENT_HISTORY_LIMIT):[];
    const candidates=[];
    let expectedLength=0;
    for(let i=0;i<ASSESSMENT_CANDIDATES;i++){
      let raw=[];
      try{raw=base.apply(this,arguments)}catch(error){if(i===0)throw error;continue}
      if(!Array.isArray(raw))continue;
      if(!expectedLength)expectedLength=raw.length;
      const clean=dedupeForm(raw);
      if(clean.length===expectedLength)candidates.push(clean);
    }
    if(!candidates.length){
      const fallback=dedupeForm(base.apply(this,arguments));
      if(!fallback.length)throw new Error('Assessment question selector returned no valid questions.');
      candidates.push(fallback);
    }
    candidates.sort((a,b)=>candidateScore(a,recent)-candidateScore(b,recent));
    let chosen=candidates[0].slice();
    chosen=rotateAwayFromPreviousFirst(chosen,recent[0]?.[0]);
    const keys=chosen.map(questionKey);
    history[scope]=[keys,...recent].slice(0,ASSESSMENT_HISTORY_LIMIT);
    writeAssessmentHistory(history);
    const bankVersion=assessmentFingerprint(chosen);
    window.MM_ACTIVE_QUESTION_FORM=Object.freeze({version:VERSION,bankVersion,level:String(level||''),region:String(region||'ALL'),questionKeys:Object.freeze(keys.slice())});
    return chosen;
  };
  window.__MM_ASSESSMENT_ROTATION_V4__=Object.freeze({version:VERSION,historyKey:ASSESSMENT_HISTORY_KEY,candidates:ASSESSMENT_CANDIDATES,historyLimit:ASSESSMENT_HISTORY_LIMIT});
}

ensureStyles();
window.MM_APP_SHELL?.events?.onRender?.('lesson',onLessonRender);
window.MM_APP_SHELL?.events?.onViewChange?.(id=>{if(id==='lesson')scheduleRepair(true)});
window.addEventListener('resize',()=>scheduleRepair(false),{passive:true});

const observer=new MutationObserver(()=>{
  if(lessonVisible())scheduleRepair(false);
});
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
lastLessonId=currentLessonId()||null;
scheduleRepair(lessonVisible());
installAssessmentRotation();
window.MM_LEARNER_UX_REPAIR=Object.freeze({version:VERSION,repair:()=>scheduleRepair(false),resetLesson:()=>scheduleRepair(true),assessmentRotation:window.__MM_ASSESSMENT_ROTATION_V4__||null});
})();
