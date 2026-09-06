/* MouldMaster learner UX repair — 2026.09.06.13 */
(function(){
'use strict';
if(window.MM_LEARNER_UX_REPAIR)return;
const VERSION='2026.09.06.13';
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
window.MM_LEARNER_UX_REPAIR=Object.freeze({version:VERSION,repair:()=>scheduleRepair(false),resetLesson:()=>scheduleRepair(true)});
})();
