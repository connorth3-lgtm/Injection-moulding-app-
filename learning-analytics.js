/* MouldMaster privacy-preserving learning analytics — 2026.09.03.2 */
(function(){
'use strict';

const VERSION='2026.09.03.2';
const STORAGE_PREFIX='mm_learning_analytics_v1::';
const MAX_EVENTS=1500;
const IDLE_MS=5*60*1000;
const PRACTICE_LABELS={
  diagnostic:['Observe','Best next test','Controlled response','Explain'],
  'process-data':['Read pattern','Diagnose','Next evidence','Recovery']
};
const learnerScope=window.MM_LEARNER_SCOPE;
if(!learnerScope)throw new Error('MM_LEARNER_SCOPE must load before Learning Analytics');

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function activeUserId(){return learnerScope.activeId()}
function tokenFor(raw){return learnerScope.tokenFor(raw)}
function learnerToken(){return learnerScope.token()}
function storageKey(token=learnerToken()){return learnerScope.storageKey(STORAGE_PREFIX,token)}
function emptyStore(){return {schema:1,version:VERSION,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}
function readStore(token=learnerToken()){
  try{const x=JSON.parse(localStorage.getItem(storageKey(token))||'null');if(x&&x.schema===1&&Array.isArray(x.events))return x}catch(_){}
  return emptyStore();
}
function writeStore(store,token=learnerToken()){
  try{store.events=(store.events||[]).slice(-MAX_EVENTS);store.updatedAt=new Date().toISOString();localStorage.setItem(storageKey(token),JSON.stringify(store))}catch(_){}
}
function safeString(v,max=80){return String(v??'').replace(/[^a-zA-Z0-9:_\-. ]/g,'').slice(0,max)}
function record(type,data={}){
  const event={v:1,t:new Date().toISOString(),type:safeString(type,48)};
  for(const key of ['module','id','reason'])if(data[key]!=null)event[key]=safeString(data[key],96);
  for(const key of ['step','score','durationSec','attempt'])if(Number.isFinite(Number(data[key])))event[key]=Number(data[key]);
  if(typeof data.correct==='boolean')event.correct=data.correct;
  const store=readStore();store.events.push(event);writeStore(store);return event;
}

function allAnalyticsTokens(){
  const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(STORAGE_PREFIX))out.push(k.slice(STORAGE_PREFIX.length))}}catch(_){}
  return [...new Set(out)];
}
function eventsFor(token=learnerToken()){return readStore(token).events||[]}
function durationLabel(seconds){const s=Math.max(0,Math.round(Number(seconds)||0));if(s<60)return `${s}s`;const m=Math.floor(s/60),r=s%60;return r?`${m}m ${r}s`:`${m}m`}
function currentRole(){try{return String(typeof user!=='undefined'&&user?.role||'learner')}catch(_){return 'learner'}}
function currentCompletedLessons(){try{return Array.isArray(user?.completed)?user.completed.length:0}catch(_){return 0}}

function aggregate(events){
  const e=Array.isArray(events)?events:[];
  const lessonTime=e.filter(x=>x.type==='lesson_time').reduce((s,x)=>s+(Number(x.durationSec)||0),0);
  const practice=e.filter(x=>x.type==='practice_complete');
  const practiceStarts=e.filter(x=>x.type==='practice_start');
  const missed=e.filter(x=>x.type==='practice_miss');
  const scores=new Map();
  for(const x of practice){const k=`${x.module}:${x.id}`;if(!scores.has(k))scores.set(k,[]);scores.get(k).push(Number(x.score)||0)}
  const repeated=[...scores.values()].filter(a=>a.length>=2);
  const gains=repeated.map(a=>Math.max(...a)-a[0]);
  const avgGain=gains.length?gains.reduce((a,b)=>a+b,0)/gains.length:0;
  const improved=gains.filter(x=>x>0).length;
  const practiceTime=practice.reduce((s,x)=>s+(Number(x.durationSec)||0),0);
  const avgScore=practice.length?practice.reduce((s,x)=>s+(Number(x.score)||0),0)/practice.length:0;
  const missedByStep={};
  for(const x of missed){const k=`${x.module}:${Number(x.step)||0}`;missedByStep[k]=(missedByStep[k]||0)+1}
  const difficult=Object.entries(missedByStep).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return {
    events:e.length,
    lessonTime,
    practiceTime,
    activeTime:lessonTime+practiceTime,
    practiceAttempts:practiceStarts.length,
    practiceCompleted:practice.length,
    avgScore,
    repeatedCases:repeated.length,
    avgGain,
    improvedCases:improved,
    misses:missed.length,
    difficult,
    lessonCompletions:new Set(e.filter(x=>x.type==='lesson_complete').map(x=>x.id)).size
  };
}
function stepLabel(key){const [module,raw]=String(key).split(':');const step=Number(raw)||0;return `${module==='diagnostic'?'Diagnostic lab':'Process-data case'} · ${PRACTICE_LABELS[module]?.[step]||`Step ${step+1}`}`}

let lessonSession=null,idleTimer=null;
function lessonId(){try{return typeof currentLesson==='function'?String(currentLesson()?.id||''):''}catch(_){return ''}}
function accrueLesson(){
  if(!lessonSession||lessonSession.activeSince==null)return;
  const now=Date.now();lessonSession.activeMs+=Math.max(0,now-lessonSession.activeSince);lessonSession.activeSince=now;
}
function pauseLesson(){if(!lessonSession||lessonSession.activeSince==null)return;accrueLesson();lessonSession.activeSince=null;clearTimeout(idleTimer);idleTimer=null}
function armIdle(){clearTimeout(idleTimer);if(!lessonSession||document.visibilityState!=='visible')return;idleTimer=setTimeout(pauseLesson,IDLE_MS)}
function touchActivity(){if(!lessonSession||document.visibilityState!=='visible')return;if(lessonSession.activeSince==null)lessonSession.activeSince=Date.now();armIdle()}
function startLessonSession(){
  const id=lessonId();if(!id)return;
  if(lessonSession?.id===id){touchActivity();return}
  closeLessonSession('lesson-change');
  lessonSession={id,startedAt:Date.now(),activeMs:0,activeSince:document.visibilityState==='visible'?Date.now():null};
  record('lesson_open',{module:'lesson',id});armIdle();
}
function closeLessonSession(reason='leave'){
  if(!lessonSession)return;
  accrueLesson();const sec=Math.round(lessonSession.activeMs/1000);if(sec>0)record('lesson_time',{module:'lesson',id:lessonSession.id,durationSec:sec,reason});lessonSession=null;clearTimeout(idleTimer);idleTimer=null;
}

const attemptTimers={diagnostic:null,'process-data':null};
let currentDiagnostic=null,currentProcessData=null;
function startPractice(module,id){
  const safeId=safeString(id,96);if(!safeId)return;attemptTimers[module]={id:safeId,startedAt:Date.now()};
  const prior=eventsFor().filter(x=>x.type==='practice_start'&&x.module===module&&x.id===safeId).length;
  record('practice_start',{module,id:safeId,attempt:prior+1});
}
function finishPractice(module,id,score){
  const timer=attemptTimers[module],durationSec=timer&&timer.id===id?Math.round((Date.now()-timer.startedAt)/1000):0;
  record('practice_complete',{module,id,score:Number(score)||0,durationSec});attemptTimers[module]=null;
}
function abandonPractice(module,id){
  const timer=attemptTimers[module];if(timer&&timer.id===id){record('practice_abandon',{module,id,durationSec:Math.round((Date.now()-timer.startedAt)/1000)});attemptTimers[module]=null}
}

function installCoreHooks(){
  try{
    if(typeof renderLesson==='function'&&!renderLesson.__mmAnalytics){
      const base=renderLesson;const wrapped=function(){const r=base.apply(this,arguments);try{if(typeof currentView==='undefined'||currentView==='lesson')startLessonSession()}catch(_){}return r};wrapped.__mmAnalytics=true;renderLesson=wrapped;window.renderLesson=wrapped;
    }
  }catch(_){}
  try{
    if(typeof switchView==='function'&&!switchView.__mmAnalytics){
      const base=switchView;const wrapped=function(id){if(id!=='lesson')closeLessonSession('view-change');const r=base.apply(this,arguments);if(id==='lesson')startLessonSession();return r};wrapped.__mmAnalytics=true;switchView=wrapped;window.switchView=wrapped;
    }
  }catch(_){}
  try{
    if(typeof goLesson==='function'&&!goLesson.__mmAnalytics){
      const base=goLesson;const wrapped=function(id){closeLessonSession('lesson-change');const r=base.apply(this,arguments);startLessonSession();return r};wrapped.__mmAnalytics=true;goLesson=wrapped;window.goLesson=wrapped;
    }
  }catch(_){}
  try{
    if(typeof window.mmCompleteAndContinue==='function'&&!window.mmCompleteAndContinue.__mmAnalytics){
      const base=window.mmCompleteAndContinue;const wrapped=function(id){let was=false;try{was=Array.isArray(user?.completed)&&user.completed.includes(id)}catch(_){}closeLessonSession('complete');if(!was)record('lesson_complete',{module:'lesson',id:String(id)});const r=base.apply(this,arguments);try{if(typeof currentView==='undefined'||currentView==='lesson')startLessonSession()}catch(_){}return r};wrapped.__mmAnalytics=true;window.mmCompleteAndContinue=wrapped;
    }
  }catch(_){}
  try{
    if(typeof completeLesson==='function'&&!completeLesson.__mmAnalytics){
      const base=completeLesson;const wrapped=function(id){let was=false;try{was=Array.isArray(user?.completed)&&user.completed.includes(id)}catch(_){}closeLessonSession('complete');const r=base.apply(this,arguments);if(!was)record('lesson_complete',{module:'lesson',id:String(id)});startLessonSession();return r};wrapped.__mmAnalytics=true;completeLesson=wrapped;window.completeLesson=wrapped;
    }
  }catch(_){}
}

function handlePracticeClick(e){
  const t=e.target.closest?.('[data-dl-start],[data-dl-choice],[data-dl-finish],[data-dl-restart],[data-dl-home],[data-dl-back],[data-pd-start],[data-pd-choice],[data-pd-finish],[data-pd-restart],[data-pd-home],[data-pd-back]');if(!t)return;
  if(t.dataset.dlStart){currentDiagnostic=t.dataset.dlStart;startPractice('diagnostic',currentDiagnostic);return}
  if(t.hasAttribute('data-dl-restart')){if(currentDiagnostic)startPractice('diagnostic',currentDiagnostic);return}
  if(t.dataset.dlChoice!==undefined&&currentDiagnostic){const host=document.getElementById('diagnosticLabs'),step=Number(host?.dataset.step||0);if(host?.querySelector('.dl-choice.wrong'))record('practice_miss',{module:'diagnostic',id:currentDiagnostic,step,correct:false});return}
  if(t.hasAttribute('data-dl-finish')&&currentDiagnostic){const m=document.querySelector('#diagnosticLabs .dl-summary strong')?.textContent?.match(/(\d+)%/);finishPractice('diagnostic',currentDiagnostic,m?Number(m[1]):0);return}
  if((t.hasAttribute('data-dl-home')||t.hasAttribute('data-dl-back'))&&currentDiagnostic){abandonPractice('diagnostic',currentDiagnostic);currentDiagnostic=null;return}

  if(t.dataset.pdStart){currentProcessData=t.dataset.pdStart;startPractice('process-data',currentProcessData);return}
  if(t.hasAttribute('data-pd-restart')){if(currentProcessData)startPractice('process-data',currentProcessData);return}
  if(t.dataset.pdChoice!==undefined&&currentProcessData){const host=document.getElementById('processDataLabs'),step=Number(host?.dataset.step||0);if(host?.querySelector('.pd-choice.wrong'))record('practice_miss',{module:'process-data',id:currentProcessData,step,correct:false});return}
  if(t.hasAttribute('data-pd-finish')&&currentProcessData){const m=document.querySelector('#processDataLabs .pd-summary strong')?.textContent?.match(/(\d+)%/);finishPractice('process-data',currentProcessData,m?Number(m[1]):0);return}
  if((t.hasAttribute('data-pd-home')||t.hasAttribute('data-pd-back'))&&currentProcessData){abandonPractice('process-data',currentProcessData);currentProcessData=null}
}

function ensureStyle(){
  if(document.getElementById('mm-learning-analytics-style'))return;
  const s=document.createElement('style');s.id='mm-learning-analytics-style';s.textContent=`
#learningInsights{--la-line:#304b69}.la-hero{padding:24px;background:radial-gradient(circle at 90% 0%,rgba(85,214,190,.15),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}.la-hero h2{font-size:30px;margin:7px 0 9px}.la-hero p{max-width:900px;color:#bfd0e2;line-height:1.6}.la-privacy{margin-top:13px;padding:13px 15px;border:1px solid #355a55;border-radius:11px;background:#102824;color:#d6eee7;font-size:12px;line-height:1.55}.la-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.la-kpi{padding:15px}.la-kpi span{font-size:11px;color:var(--muted)}.la-kpi strong{display:block;font-size:24px;margin-top:5px}.la-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.la-panel{padding:18px}.la-panel h3{margin:0 0 10px}.la-list{display:grid;gap:7px}.la-row{display:flex;justify-content:space-between;gap:12px;padding:10px 11px;border:1px solid #2d4563;border-radius:9px;background:#0e1d31}.la-row small{color:var(--muted)}.la-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.la-note{font-size:12px;color:var(--muted);line-height:1.5}.la-empty{padding:16px;border:1px dashed #3b5574;border-radius:10px;color:var(--muted)}
@media(max-width:900px){.la-kpis{grid-template-columns:repeat(2,1fr)}.la-grid{grid-template-columns:1fr}}@media(max-width:560px){.la-kpis{grid-template-columns:1fr}}
`;
  document.head.appendChild(s)
}
function ensureSection(){
  let section=document.getElementById('learningInsights');if(section)return section;section=document.createElement('section');section.id='learningInsights';section.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(section);return section
}
function ensureNav(){
  const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-learning-insights]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.mmLearningInsights='1';b.innerHTML='◫ <span>Learning insights</span>';
  const anchor=nav.querySelector('button[data-view="profile"]')||nav.lastElementChild;if(anchor)anchor.insertAdjacentElement('beforebegin',b);else nav.appendChild(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openInsights()})
}
function patchMobileMore(){
  if(window.__MM_LEARNING_INSIGHTS_MORE__||typeof window.openMobileMenu!=='function')return;const base=window.openMobileMenu;
  window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-learning-insights-menu]'))return;const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmLearningInsightsMenu='1';b.innerHTML='<span class="icon">◫</span><b>Learning insights</b><small>See local learning progress and retry trends.</small>';b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openInsights()});grid.appendChild(b)});return r};window.__MM_LEARNING_INSIGHTS_MORE__=true
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-learning-insights]')?.classList.add('active')}
function setHeader(){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent='Learning insights';if(p)p.textContent='Local evidence of practice, time-on-task and improvement.'}

function recentHtml(events){
  const rows=events.filter(x=>['lesson_complete','practice_complete','practice_miss'].includes(x.type)).slice(-10).reverse();if(!rows.length)return '<div class="la-empty">No tracked learning events yet. New activity from this release will appear here.</div>';
  return `<div class="la-list">${rows.map(x=>{let label=x.type==='lesson_complete'?`Lesson ${esc(x.id)} completed`:x.type==='practice_complete'?`${x.module==='diagnostic'?'Diagnostic':'Process-data'} case ${esc(x.id)} · ${Math.round(Number(x.score)||0)}%`:`Missed ${esc(stepLabel(`${x.module}:${x.step}`))}`;return `<div class="la-row"><span>${label}</span><small>${new Date(x.t).toLocaleDateString()}</small></div>`}).join('')}</div>`
}
function learnerPanel(events){
  const a=aggregate(events),difficult=a.difficult.length?a.difficult.map(([k,n])=>`<div class="la-row"><span>${esc(stepLabel(k))}</span><strong>${n} miss${n===1?'':'es'}</strong></div>`).join(''):'<div class="la-empty">No repeated trouble spots recorded yet.</div>';
  return `
    <div class="la-kpis">
      <div class="la-kpi card"><span>Current lesson progress</span><strong>${currentCompletedLessons()}/120</strong></div>
      <div class="la-kpi card"><span>Tracked active learning</span><strong>${durationLabel(a.activeTime)}</strong></div>
      <div class="la-kpi card"><span>Practice attempts</span><strong>${a.practiceAttempts}</strong></div>
      <div class="la-kpi card"><span>Average retry gain</span><strong>${a.repeatedCases?`${a.avgGain.toFixed(1)} pts`:'—'}</strong></div>
    </div>
    <div class="la-grid">
      <div class="la-panel card"><h3>Where practice is hardest</h3><div class="la-list">${difficult}</div><p class="la-note">Miss counts show which reasoning stage caused difficulty, not the answer text a learner selected.</p></div>
      <div class="la-panel card"><h3>Retry improvement</h3><div class="la-list"><div class="la-row"><span>Cases attempted more than once</span><strong>${a.repeatedCases}</strong></div><div class="la-row"><span>Cases with a higher later best score</span><strong>${a.improvedCases}</strong></div><div class="la-row"><span>Completed practice cases</span><strong>${a.practiceCompleted}</strong></div><div class="la-row"><span>Average completed-case score</span><strong>${a.practiceCompleted?a.avgScore.toFixed(1)+'%':'—'}</strong></div></div></div>
      <div class="la-panel card"><h3>Recent tracked activity</h3>${recentHtml(events)}</div>
      <div class="la-panel card"><h3>What this measures</h3><p class="la-note">Time-on-task counts visible, active lesson time and completed guided-practice time. A five-minute idle limit prevents a forgotten open lesson from inflating the total. Retry gain compares each repeated case with its first tracked completed attempt.</p><p class="la-note">Analytics starts with this release. Existing lesson completion totals remain visible, but historical timing and retry events are not reconstructed.</p></div>
    </div>`
}
function instructorPanel(){
  const tokens=allAnalyticsTokens(),stores=tokens.map(t=>eventsFor(t)),combined=stores.flat(),a=aggregate(combined);
  return `<div class="la-panel card" style="margin-top:14px"><div class="eyebrow">Instructor view · this device only</div><h3 style="margin-top:6px">Anonymous pilot summary</h3><div class="la-kpis" style="margin-bottom:0"><div class="la-kpi card"><span>Anonymous learner profiles</span><strong>${tokens.length}</strong></div><div class="la-kpi card"><span>Tracked practice attempts</span><strong>${a.practiceAttempts}</strong></div><div class="la-kpi card"><span>Completed practice cases</span><strong>${a.practiceCompleted}</strong></div><div class="la-kpi card"><span>Average retry gain</span><strong>${a.repeatedCases?a.avgGain.toFixed(1)+' pts':'—'}</strong></div></div><p class="la-note">Profiles are represented only by local hashed storage tokens. No learner names are displayed or included in the exported pilot summary.</p></div>`
}
function exportAnonymousSummary(){
  const tokens=allAnalyticsTokens(),perProfile=tokens.map(t=>aggregate(eventsFor(t))),combined=aggregate(tokens.flatMap(t=>eventsFor(t)));
  const payload={schema:1,version:VERSION,generatedAt:new Date().toISOString(),privacy:'Anonymous aggregate only; no names, notes, answer text or event timestamps.',anonymousProfiles:tokens.length,aggregate:{activeLearningSeconds:combined.activeTime,practiceAttempts:combined.practiceAttempts,practiceCompleted:combined.practiceCompleted,averagePracticeScore:+combined.avgScore.toFixed(2),repeatedCases:combined.repeatedCases,averageRetryGain:+combined.avgGain.toFixed(2),missesByStage:combined.difficult.map(([k,n])=>({stage:stepLabel(k),count:n}))},profiles:perProfile.map((x,i)=>({anonymousProfile:i+1,activeLearningSeconds:x.activeTime,practiceAttempts:x.practiceAttempts,practiceCompleted:x.practiceCompleted,averagePracticeScore:+x.avgScore.toFixed(2),repeatedCases:x.repeatedCases,averageRetryGain:+x.avgGain.toFixed(2)}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mouldmaster-anonymous-learning-summary.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
function clearCurrentAnalytics(){if(!confirm('Clear tracked learning analytics for this local profile? Lesson progress, notes and assessment records are not changed.'))return;try{localStorage.removeItem(storageKey())}catch(_){}renderInsights()}
function renderInsights(){
  const host=ensureSection(),events=eventsFor();if(!host)return;host.innerHTML=`<div class="la-hero card"><div class="eyebrow">Privacy-preserving learner validation</div><h2>Learning insights</h2><p>Use real learning behaviour to see whether MouldMaster is helping: completion, active time, retries, missed reasoning stages and improvement across repeat attempts.</p><div class="la-privacy"><b>Local-only by design:</b> analytics stay on this device. MouldMaster does not store names, email addresses, notes, free-text responses, formal assessment answers or selected answer text in this analytics log, and this module has no network upload path.</div><div class="la-actions"><button class="secondary" type="button" data-la-export>Export anonymous summary</button><button class="ghost" type="button" data-la-clear>Clear my analytics</button></div></div>${learnerPanel(events)}${currentRole()==='instructor'?instructorPanel():''}`
}
function openInsights(){closeLessonSession('insights');ensureStyle();const host=ensureSection();if(!host)return;hideOtherViews();host.classList.remove('hidden');markNav();setHeader();renderInsights();window.scrollTo?.({top:0,behavior:'smooth'})}

function install(){ensureStyle();ensureSection();ensureNav();patchMobileMore();installCoreHooks()}

document.addEventListener('click',e=>{handlePracticeClick(e);const t=e.target.closest?.('[data-la-export],[data-la-clear]');if(t?.hasAttribute('data-la-export'))exportAnonymousSummary();if(t?.hasAttribute('data-la-clear'))clearCurrentAnalytics()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseLesson();else touchActivity()});
window.addEventListener('beforeunload',()=>{closeLessonSession('unload');abandonPractice('diagnostic',currentDiagnostic);abandonPractice('process-data',currentProcessData)});
document.addEventListener('pointerdown',touchActivity,{passive:true});document.addEventListener('keydown',touchActivity);document.addEventListener('scroll',touchActivity,{passive:true});

let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
try{if(typeof currentView!=='undefined'&&currentView==='lesson')startLessonSession()}catch(_){}

window.MM_LEARNING_ANALYTICS={version:VERSION,record,summary:()=>aggregate(eventsFor()),open:openInsights,scope:'Learner-scoped local analytics only; no names, notes, free text, assessment answers or network upload.'};
})();
