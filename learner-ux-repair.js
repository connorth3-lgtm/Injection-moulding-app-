/* MouldMaster learner UX repair — 2026.09.06.13 */
(function(){
'use strict';
if(window.MM_LEARNER_UX_REPAIR)return;
const VERSION='2026.09.06.13';
const ROTATION_KEY='mm_exam_question_rotation_v2';
let lastLessonId=null;
let queued=false;
let resetQueued=false;
let activeExamAttempt=null;

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

function learnerKey(){
  try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}
  try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}
  return 'local-learner';
}
function rotationKey(level,region){return `${learnerKey()}|${String(level||'')}|${String(region||'ALL')}`}
function loadRotation(){
  try{const row=JSON.parse(localStorage.getItem(ROTATION_KEY)||'{}');return row&&typeof row==='object'?row:{}}catch(_){return {}}
}
function saveRotation(row){try{localStorage.setItem(ROTATION_KEY,JSON.stringify(row));return true}catch(_){return false}}
function qText(q){return q?.q??q?.[0]??''}
function qOptions(q){const options=q?.options??q?.[1]??[];return Array.isArray(options)?options.slice():[]}
function qCorrect(q){return Number(q?.correct??q?.[2]??0)}
function coreQuestion(q){
  const prompt=qText(q),options=qOptions(q),correct=qCorrect(q);
  let explanation='';
  try{if(typeof technicalExplanation==='function')explanation=technicalExplanation(q)}catch(_){}
  if(!explanation)explanation=`Correct answer: ${options[correct]||''}. Apply the principle within material-supplier guidance, machine/tool limits and the site's approved process.`;
  return {q:prompt,options,correct,explanation,reference:q?.reference??q?.[4]??'Common injection moulding engineering principle'};
}
function installQuestionRotation(){
  if(typeof window.getExamQuestions!=='function'||typeof window.startExam!=='function'||window.startExam.__mmQuestionRotation)return false;
  const originalGet=window.getExamQuestions;
  const originalStart=window.startExam;

  window.getExamQuestions=function(level,region){
    const standard=originalGet.apply(this,arguments);
    if(!activeExamAttempt||activeExamAttempt.key!==rotationKey(level,region))return standard;
    const regional=Array.isArray(standard)?standard.filter(q=>q&&q.region):[];
    const coreCount=Math.max(0,(Array.isArray(standard)?standard.length:0)-regional.length);
    let pool=[];
    try{pool=Array.isArray(D?.exams?.[level])?D.exams[level]:[]}catch(_){}
    if(coreCount<1||pool.length<=coreCount)return standard;

    const stride=Math.max(2,Math.ceil(pool.length/3));
    const start=(activeExamAttempt.index*stride)%pool.length;
    const selected=[];
    for(let i=0;i<pool.length&&selected.length<coreCount;i++)selected.push(pool[(start+i)%pool.length]);
    return selected.map(coreQuestion).concat(regional);
  };

  window.startExam=function(level){
    let region='ALL';
    try{region=typeof user!=='undefined'&&user?.region?user.region:'ALL'}catch(_){}
    const key=rotationKey(level,region);
    const state=loadRotation();
    const index=Math.max(0,Number(state[key])||0);
    activeExamAttempt={key,index};
    let opened=false;
    try{
      const result=originalStart.apply(this,arguments);
      opened=true;
      return result;
    }finally{
      activeExamAttempt=null;
      if(opened){state[key]=index+1;saveRotation(state)}
    }
  };
  window.startExam.__mmQuestionRotation=true;
  window.startExam.__mmQuestionRotationVersion=VERSION;
  return true;
}

ensureStyles();
installQuestionRotation();
window.MM_APP_SHELL?.events?.onRender?.('lesson',onLessonRender);
window.MM_APP_SHELL?.events?.onViewChange?.(id=>{if(id==='lesson')scheduleRepair(true)});
window.addEventListener('resize',()=>scheduleRepair(false),{passive:true});

const observer=new MutationObserver(()=>{
  if(lessonVisible())scheduleRepair(false);
  if(!window.startExam?.__mmQuestionRotation)installQuestionRotation();
});
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
lastLessonId=currentLessonId()||null;
scheduleRepair(lessonVisible());
window.MM_LEARNER_UX_REPAIR=Object.freeze({version:VERSION,repair:()=>scheduleRepair(false),resetLesson:()=>scheduleRepair(true),questionRotation:true});
})();
