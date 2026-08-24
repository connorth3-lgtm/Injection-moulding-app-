/* MouldMaster final assessment hardening — 2026-08-24.3 */
(function(){
'use strict';
const D=window.MM_DATA;
const A=window.MM_ASSESSMENT_ANALYTICS;
if(!D||!A||typeof window.startExam!=='function'||typeof window.gradeExam!=='function')throw new Error('Assessment quality and analytics must load before final hardening');

const VERSION='2026.08.24.3';
const BANK_VERSION='2026.08.24.2';
const TIMING_KEY='mm_assessment_exposure_timing_v1';
const SOURCE_REVIEWED='2026-08-24';
const SOURCE_REVIEW_BY='2026-11-24';
const BASELINE={revision:1,date:'2026-08-20',change:'Safety-first audited assessment baseline.'};
const REVISION2={
 'tech:Beginner:3':{revision:2,date:'2026-08-24',change:'Deepened barrel-setpoint versus measured melt-temperature reasoning and made competing thermal explanations more realistic.'},
 'tech:Beginner:4':{revision:2,date:'2026-08-24',change:'Reframed drying around grade-specific moisture evidence rather than generic drying recipes.'},
 'tech:Beginner:9':{revision:2,date:'2026-08-24',change:'Changed from simple troubleshooting recognition to comparison against known-good evidence.'},
 'tech:Intermediate:0':{revision:2,date:'2026-08-24',change:'Clarified that a part-mass plateau is supporting gate-seal evidence for the tested condition, not universal proof.'},
 'tech:Intermediate:5':{revision:2,date:'2026-08-24',change:'Strengthened shot-delivery diagnosis before packing compensation.'},
 'tech:Intermediate:7':{revision:2,date:'2026-08-24',change:'Expanded cooling acceptance to include ejection condition, conditioned dimensions, warpage and product requirements.'},
 'tech:Intermediate:9':{revision:2,date:'2026-08-24',change:'Clarified the legitimate use and limitations of one-factor-at-a-time testing.'},
 'tech:Advanced:1':{revision:2,date:'2026-08-24',change:'Added pooled-versus-cavity-specific capability and rational-subgroup reasoning.'},
 'tech:Advanced:3':{revision:2,date:'2026-08-24',change:'Replaced definition recall with a real DOE time-confounding case.'},
 'tech:Advanced:4':{revision:2,date:'2026-08-24',change:'Distinguished upstream machine/nozzle pressure from local cavity-pressure history.'},
 'tech:Advanced:7':{revision:2,date:'2026-08-24',change:'Reframed machine transfer around reproduced physical process outputs and receiving-machine capability.'},
 'tech:Advanced:8':{revision:2,date:'2026-08-24',change:'Added research-backed distinction between MFR and moulding rheology/mouldability.'}
};
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const read=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||'');return x&&typeof x==='object'?x:d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
function revisionFor(id){return REVISION2[id]||BASELINE}
function allStableIds(){
 const out=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++)out.push(`tech:${level}:${i}`);
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++)out.push(`reg:${region}:${level}:${i}`);
 return out;
}

let timingSession=null;
function activeNow(){
 if(!timingSession)return performance.now();
 const now=performance.now();
 return now-(timingSession.hiddenAccum||0)-(timingSession.hiddenSince==null?0:now-timingSession.hiddenSince);
}
function markExposure(i){if(timingSession&&timingSession.firstExposure[i]==null)timingSession.firstExposure[i]=activeNow()}
function visibleFraction(el){
 const r=el.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight||0,vw=window.innerWidth||document.documentElement.clientWidth||0;
 const h=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0)),w=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0));
 const area=Math.max(1,r.width*r.height);return h*w/area;
}
function initExposureTiming(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 if(timingSession?.observer)try{timingSession.observer.disconnect()}catch(_){}
 timingSession={exam:activeExam,firstExposure:{},response:{},hiddenAccum:0,hiddenSince:document.hidden?performance.now():null,graded:false,observer:null};
 const cards=[...document.querySelectorAll('#examQuestions .question')];
 const visibilityCheck=()=>cards.forEach((card,i)=>{if(visibleFraction(card)>=0.55)markExposure(i)});
 if('IntersectionObserver' in window){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>=0.55){const i=cards.indexOf(e.target);if(i>=0)markExposure(i)}}),{threshold:[0.55]});
  cards.forEach(c=>obs.observe(c));timingSession.observer=obs;
 }else{
  window.addEventListener('scroll',visibilityCheck,{passive:true,once:false});
 }
 cards.forEach((card,i)=>{
  const expose=()=>markExposure(i);
  card.addEventListener('focusin',expose,{passive:true});card.addEventListener('pointerdown',expose,{passive:true});card.addEventListener('touchstart',expose,{passive:true});
  card.querySelectorAll('input[type=radio]').forEach(input=>input.addEventListener('change',()=>{markExposure(i);if(timingSession&&timingSession.response[i]==null)timingSession.response[i]=Math.max(0,activeNow()-timingSession.firstExposure[i])},{passive:true}));
 });
 document.addEventListener('visibilitychange',()=>{
  if(!timingSession)return;
  const now=performance.now();
  if(document.hidden&&timingSession.hiddenSince==null)timingSession.hiddenSince=now;
  else if(!document.hidden&&timingSession.hiddenSince!=null){timingSession.hiddenAccum+=now-timingSession.hiddenSince;timingSession.hiddenSince=null;visibilityCheck()}
 },{passive:true});
 setTimeout(visibilityCheck,0);
}
function timingStore(){const x=read(TIMING_KEY,{schema:1,version:VERSION,questions:{}});x.schema=1;x.version=VERSION;x.questions=x.questions&&typeof x.questions==='object'?x.questions:{};return x}
function persistExposureTiming(){
 if(!timingSession||timingSession.graded||timingSession.exam!==activeExam)return;
 const store=timingStore();
 activeExam.questions.forEach((q,i)=>{
  const ms=timingSession.response[i];if(!Number.isFinite(ms))return;
  const id=q.stableId||q.mmId;if(!id)return;
  const x=store.questions[id]||{stableId:id,attempts:0,totalResponseMs:0,minResponseMs:null,maxResponseMs:0,lastResponseMs:null};
  const v=Math.min(Math.max(0,Math.round(ms)),3600000);x.attempts++;x.totalResponseMs+=v;x.lastResponseMs=v;x.minResponseMs=x.minResponseMs==null?v:Math.min(x.minResponseMs,v);x.maxResponseMs=Math.max(x.maxResponseMs||0,v);x.last=Date.now();store.questions[id]=x;
 });
 timingSession.graded=true;write(TIMING_KEY,store);
}
function patchedAnalyticsExport(){
 const raw=A.__mmOriginalExport?A.__mmOriginalExport():A.export();
 const out=JSON.parse(JSON.stringify(raw||{})),t=timingStore();out.responseTimingBasis='first meaningful question exposure (>=55% visible or direct interaction), excluding hidden-tab time';
 for(const [id,x] of Object.entries(t.questions||{})){
  if(!out.questions?.[id])continue;const q=out.questions[id];
  q.legacyExamElapsedTotalMs=q.totalResponseMs??0;q.legacyExamElapsedLastMs=q.lastResponseMs??null;
  q.totalResponseMs=x.totalResponseMs;q.lastResponseMs=x.lastResponseMs;q.responseTimingAttempts=x.attempts;q.minResponseMs=x.minResponseMs;q.maxResponseMs=x.maxResponseMs;q.responseTimingBasis=out.responseTimingBasis;
 }
 return out;
}
function installAnalyticsExportPatch(){
 if(A.__mmExposureTimingPatched)return;
 const original=A.export.bind(A),originalReset=typeof A.reset==='function'?A.reset.bind(A):null;
 A.__mmOriginalExport=original;A.__mmOriginalReset=originalReset;A.export=patchedAnalyticsExport;
 if(originalReset)A.reset=function(){localStorage.removeItem(TIMING_KEY);timingSession=null;return originalReset()};
 A.__mmExposureTimingPatched=true;
}
function slowestExposure(){
 const t=timingStore(),a=patchedAnalyticsExport(),rows=Object.values(t.questions||{}).filter(x=>x.attempts>0).map(x=>({id:x.stableId,avg:x.totalResponseMs/x.attempts,stem:a.questions?.[x.stableId]?.stem||x.stableId}));
 return rows.sort((x,y)=>y.avg-x.avg).slice(0,3);
}
function rewriteTimingPanel(){
 const host=document.querySelector('.mm-analytics');if(!host)return;
 const blocks=[...host.querySelectorAll('.grid2>div')],target=blocks.find(x=>/Slowest so far/i.test(x.textContent||''));if(!target)return;
 const rows=slowestExposure();target.innerHTML=`<b>Slowest by question exposure</b><ul>${rows.length?rows.map(x=>`<li>${esc(x.stem)} — ${Math.round(x.avg/1000)}s average</li>`).join(''):'<li>No exposure-based response-time data yet.</li>'}</ul><small class="muted">Timing starts when a question is substantially visible or directly interacted with; hidden-tab time is excluded.</small>`;
}
function enhanceRevisionDetails(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const rows=[...document.querySelectorAll('#answerReview .answer-row')];
 rows.forEach((row,i)=>{
  const q=activeExam.questions[i],panel=row.querySelector('.mm-evidence');if(!q||!panel||panel.querySelector('.mm-revision-detail'))return;
  const id=q.stableId||q.mmId||'',r=revisionFor(id),research=String(q.sourceUrl||'').startsWith('https://doi.org/');
  panel.insertAdjacentHTML('beforeend',`<div class="mm-revision-detail"><b>Question revision ${r.revision}</b> · ${esc(r.date)}<br>${esc(r.change)}</div>`);
  const small=panel.querySelector('small');if(small&&research)small.textContent=`Research DOI resolver set reviewed ${SOURCE_REVIEWED}; scheduled DOI recheck by ${SOURCE_REVIEW_BY}. · Question revision ${r.revision}`;
 });
}
function addStyles(){if(document.getElementById('mm-final-assessment-style'))return;const s=document.createElement('style');s.id='mm-final-assessment-style';s.textContent='.mm-revision-detail{margin-top:8px;padding:8px 10px;border-left:3px solid #55d6be;background:#0b192a;border-radius:6px;font-size:11.5px;line-height:1.45}.mm-revision-detail b{color:#72e6cd}';document.head.appendChild(s)}

installAnalyticsExportPatch();addStyles();
const baseStart=window.startExam;window.startExam=function(){const r=baseStart.apply(this,arguments);setTimeout(initExposureTiming,0);return r};
const baseGrade=window.gradeExam;window.gradeExam=function(){persistExposureTiming();const r=baseGrade.apply(this,arguments);setTimeout(()=>{enhanceRevisionDetails();rewriteTimingPanel()},20);return r};
const baseRender=typeof window.renderExams==='function'?window.renderExams:null;if(baseRender)window.renderExams=function(){const r=baseRender.apply(this,arguments);setTimeout(rewriteTimingPanel,20);return r};

D.assessmentQA=D.assessmentQA||{};D.assessmentQA.finalHardening={version:VERSION,bankVersion:BANK_VERSION,stableIds:allStableIds().length,revision2Items:Object.keys(REVISION2).length,responseTiming:'first meaningful question exposure; hidden-tab time excluded',researchFreshness:'separate DOI resolver QA'};
window.MM_QUESTION_REVISIONS={version:VERSION,bankVersion:BANK_VERSION,stableIds:allStableIds(),baseline:{...BASELINE},revision2:{...REVISION2},forId:revisionFor};
window.MM_ASSESSMENT_FINAL_HARDENING={version:VERSION,responseTimingKey:TIMING_KEY,rewriteTimingPanel,enhanceRevisionDetails};
})();
