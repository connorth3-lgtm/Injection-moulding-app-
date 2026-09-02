/* MouldMaster adaptive evidence-reasoning reinforcement — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
const STORAGE_PREFIX='mm_learning_analytics_v1::';
const STAGES=['evidence','falsification','recovery','integration'];
const STAGE_LABELS={evidence:'Choose discriminating evidence',falsification:'Try to disprove the hypothesis',recovery:'Verify recovery',integration:'Integrate competing explanations'};
const STEP_LABELS=['Read the pattern','Diagnose','Choose next evidence','Verify recovery'];
const MISCONCEPTION_LESSONS={
  'command-vs-actual':[3,17,94,114],
  'premature-adjustment':[9,50,61,81],
  'causation-overreach':[61,89,111],
  'alternative-mechanism':[51,60,111],
  'confirmation-bias':[75,85,89],
  'appearance-only':[7,56,75],
  'premature-verification':[89,112],
  'recovery-shortcut':[50,89,112],
  'unsupported-conclusion':[61,111]
};
const STEP_LESSONS={0:[9,72,94],1:[51,61,111],2:[3,61,75,81],3:[50,89,112]};
const MECHANISM_LESSONS={
  'ejection-demoulding-physics':[36,37],
  'residual-stress-birefringence':[58,75,107],
  'weld-line-mechanical-strength':[56,75],
  'fibre-breakage-retained-length':[24,104],
  'runner-gate-multicavity-imbalance':[32,33,39,64],
  'hot-runner-actual-behaviour':[38,108],
  'liquid-silicone-rubber':[],
  'fluid-assisted-moulding':[],
  'moisture-drying-degradation':[26,28,54],
  'recyclate-process-variability':[29,115],
  'surface-replication-release':[36,37,101],
  'injection-compression-precision-optics':[]
};
const SPECIALIST_GAPS={
  'liquid-silicone-rubber':'No dedicated core-path lesson yet; use the promoted specialist evidence and practise evidence discrimination without pretending a generic thermoplastic lesson is equivalent.',
  'fluid-assisted-moulding':'No dedicated core-path lesson yet; use specialist evidence and process-family-specific practice rather than collapsing assisted moulding into a generic recipe.',
  'injection-compression-precision-optics':'No dedicated core-path lesson yet; use the promoted precision-process evidence and treat this as a curriculum-depth gap.'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tokenFor(raw){let h=2166136261;for(const ch of String(raw||'anonymous')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function activeUserId(){try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}return'anonymous'}
function events(){try{const x=JSON.parse(localStorage.getItem(STORAGE_PREFIX+tokenFor(activeUserId()))||'null');return Array.isArray(x?.events)?x.events:[]}catch(_){return[]}}
function completedIds(){try{return new Set((user?.completed||[]).map(Number))}catch(_){return new Set()}}
function completedCount(){return completedIds().size}
function parsePracticeId(id){
  let raw=String(id||'');if(!raw.startsWith('run-insight-'))return null;raw=raw.slice(12);
  let stage='evidence';for(const s of STAGES)if(raw.endsWith('-'+s)){stage=s;raw=raw.slice(0,-s.length-1);break}
  return raw?{mechanismId:raw,stage}:null
}
function mechanismStageStats(mechanismId){
  const out=Object.fromEntries(STAGES.map(s=>[s,{attempts:0,correct:0,misses:0}]));
  for(const x of events()){
    const p=parsePracticeId(x.id);if(!p||p.mechanismId!==mechanismId)continue;const s=out[p.stage]||out.evidence;
    if(x.type==='practice_complete'){s.attempts++;if(Number(x.score)>=100||x.correct===true)s.correct++}
    if(x.type==='practice_miss')s.misses++
  }
  return out
}
function stageForMechanism(mechanismId){
  const s=mechanismStageStats(mechanismId);
  if(s.evidence.correct<2)return'evidence';
  if(s.falsification.correct<2)return'falsification';
  if(s.recovery.correct<2)return'recovery';
  return'integration'
}
function reasoningProfile(){
  const recent=events().slice(-160),steps=[0,1,2,3].map(step=>({step,label:STEP_LABELS[step],misses:0,completions:0})),misconceptions={},mechanisms={};
  for(const x of recent){
    if(x.module==='process-data'&&x.type==='practice_miss'&&Number.isInteger(Number(x.step))&&steps[Number(x.step)])steps[Number(x.step)].misses++;
    if(x.module==='process-data'&&x.type==='practice_complete'){const p=parsePracticeId(x.id);if(p){steps[p.stage==='evidence'?2:p.stage==='falsification'?1:p.stage==='recovery'?3:1].completions++;const m=mechanisms[p.mechanismId]||(mechanisms[p.mechanismId]={attempts:0,correct:0});m.attempts++;if(Number(x.score)>=100||x.correct===true)m.correct++}}
    if(x.type==='practice_misconception'&&x.reason){misconceptions[x.reason]=(misconceptions[x.reason]||0)+1}
  }
  const weakest=steps.slice().sort((a,b)=>b.misses-a.misses||a.step-b.step)[0];
  const topMisconception=Object.entries(misconceptions).sort((a,b)=>b[1]-a[1])[0]||null;
  return {steps,weakest:weakest?.misses?weakest:null,misconceptions,topMisconception,mechanisms}
}
function lessonById(id){return window.MM_DATA?.lessons?.find(x=>Number(x.id)===Number(id))||null}
function maxRecommendationId(){const n=completedCount();return n<20?20:n<50?70:n<90?100:120}
function chooseLesson(ids){
  const max=maxRecommendationId(),done=completedIds(),valid=(ids||[]).map(lessonById).filter(Boolean).filter(x=>Number(x.id)<=max);
  return valid.find(x=>!done.has(Number(x.id)))||valid[0]||null
}
function recommendation(mechanismId=null){
  const p=reasoningProfile();let reasonKey=p.topMisconception?.[0]||null,skillLesson=reasonKey?chooseLesson(MISCONCEPTION_LESSONS[reasonKey]):p.weakest?chooseLesson(STEP_LESSONS[p.weakest.step]):null;
  const mechanismLesson=mechanismId?chooseLesson(MECHANISM_LESSONS[mechanismId]||[]):null;
  const gap=mechanismId?SPECIALIST_GAPS[mechanismId]||null:null;
  if(!skillLesson&&!mechanismLesson&&!gap)return null;
  const reason=reasonKey?`Your recent choices show a recurring ${reasonKey.replace(/-/g,' ')} reasoning trap.`:p.weakest?`Recent practice shows the most friction at “${p.weakest.label}”.`:`Reinforce the mechanism with a linked lesson before the next case.`;
  return {reasonKey,reason,primary:skillLesson||mechanismLesson,mechanismLesson:mechanismLesson&&skillLesson&&mechanismLesson.id!==skillLesson.id?mechanismLesson:null,gap,stage:mechanismId?stageForMechanism(mechanismId):'evidence',mastery:'Move on after two correct decisions at this reasoning stage, then the next Run Insight increases the challenge.'}
}
function lessonChallenge(lesson){
  if(!lesson)return null;const course=Number(lesson.course)||1,title=lesson.title||'this topic';
  if(course<=2)return {stage:'Observe',task:`For “${title}”, separate one command/setpoint from one measured actual or physical observation.`,standard:'Explain why the actual is better evidence of what the process really did.',stretch:'Name one condition that could make the displayed value misleading.'};
  if(course<=6)return {stage:'Diagnose',task:`For “${title}”, name two plausible mechanisms and one observation that would separate them.`,standard:'Choose evidence before proposing a setting change.',stretch:'State one result that would make your preferred mechanism less likely.'};
  if(course<=9)return {stage:'Discriminate',task:`Design one controlled check for “${title}” that changes or observes the minimum necessary variable.`,standard:'Predict both the supporting result and the result that would weaken the hypothesis.',stretch:'Identify one nuisance variable, interaction or measurement issue that could confuse the result.'};
  if(course<=11)return {stage:'Falsify',task:`For “${title}”, compare the process or sensor evidence with a realistic competing explanation.`,standard:'State the context boundary: material, machine, mould, sensor location or process family.',stretch:'Describe what independent physical outcome would confirm that the signal matters to the part.'};
  return {stage:'Verify & transfer',task:`Build a recovery and transfer argument for “${title}”: what must return, what must remain stable, and what must be revalidated elsewhere?`,standard:'Separate local evidence, transferable mechanism knowledge and site-specific limits.',stretch:'Explain the reasoning to another technician without giving them a recipe or hiding uncertainty.'}
}
function goLesson(id){if(!id)return;try{if(typeof window.goLesson==='function')return window.goLesson(Number(id));if(typeof goLesson==='function')return goLesson(Number(id))}catch(_){}try{if(typeof switchView==='function')switchView('path')}catch(_){}}
function ensureStyle(){if(document.getElementById('mm-adaptive-learning-style'))return;const s=document.createElement('style');s.id='mm-adaptive-learning-style';s.textContent=`.mm-adaptive-card{margin:14px 0;padding:16px;border:1px solid #41658d;border-radius:14px;background:linear-gradient(145deg,#10243a,#0d1c2f)}.mm-adaptive-card h3,.mm-adaptive-card h4{margin:5px 0 7px}.mm-adaptive-card p{margin:5px 0;color:#bdd0e2;line-height:1.5}.mm-adaptive-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.mm-adaptive-step{padding:10px;border:1px solid #304c68;border-radius:9px;background:#0b1929;font-size:11px;line-height:1.45}.mm-adaptive-step b{display:block;color:#edf5ff;margin-bottom:4px}.mm-adaptive-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.mm-adaptive-gap{margin-top:9px;padding:9px;border-left:3px solid #d8aa52;background:#251e12;font-size:11px;line-height:1.45}.mm-adaptive-stage{display:inline-flex;padding:4px 8px;border:1px solid #47749b;border-radius:999px;font-size:10px;color:#a9d5ff}@media(max-width:760px){.mm-adaptive-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function recommendationHtml(rec){if(!rec)return'';const l=rec.primary;return `<section class="mm-adaptive-card" data-mm-adaptive-recommendation><span class="eyebrow">Adaptive reinforcement</span><h3>Your strongest next learning move</h3><p>${esc(rec.reason)}</p>${l?`<div class="mm-adaptive-actions"><button type="button" class="secondary" data-mm-adaptive-lesson="${l.id}">Revisit ${esc(l.title)} →</button>${rec.mechanismLesson?`<button type="button" class="ghost" data-mm-adaptive-lesson="${rec.mechanismLesson.id}">Mechanism lesson: ${esc(rec.mechanismLesson.title)}</button>`:''}</div>`:''}${rec.gap?`<div class="mm-adaptive-gap"><b>Curriculum depth gap</b><br>${esc(rec.gap)}</div>`:''}<p><small>${esc(rec.mastery)}</small></p></section>`}
function decorateInsights(){const root=document.getElementById('learningInsights');if(!root||root.classList.contains('hidden')||root.querySelector('[data-mm-adaptive-recommendation]'))return;ensureStyle();const rec=recommendation();if(!rec)return;const hero=root.querySelector('.la-hero');hero?.insertAdjacentHTML('afterend',recommendationHtml(rec))}
function decorateLesson(){const root=document.getElementById('lesson'),article=root?.querySelector('.lesson-body');if(!article||article.querySelector('[data-mm-adaptive-lesson-challenge]'))return;let lesson=null;try{lesson=typeof currentLesson==='function'?currentLesson():null}catch(_){}const c=lessonChallenge(lesson);if(!c)return;ensureStyle();const section=document.createElement('section');section.className='mm-adaptive-card';section.dataset.mmAdaptiveLessonChallenge='1';section.innerHTML=`<span class="mm-adaptive-stage">${esc(c.stage)} challenge</span><h4>Make this lesson harder than the last one</h4><div class="mm-adaptive-grid"><div class="mm-adaptive-step"><b>Reasoning task</b>${esc(c.task)}</div><div class="mm-adaptive-step"><b>Evidence standard</b>${esc(c.standard)}</div><div class="mm-adaptive-step"><b>Stretch</b>${esc(c.stretch)}</div></div>`;const jumps=article.querySelector('.mm-learning-jumps');jumps?.insertAdjacentElement('afterend',section)||article.insertAdjacentElement('afterbegin',section)}
function annotatePractice(){document.querySelectorAll('[data-mm-ri-practice]').forEach(host=>{if(host.dataset.mmAdaptiveAnnotated==='1')return;host.dataset.mmAdaptiveAnnotated='1';const p=parsePracticeId(host.dataset.mmRiPractice);if(!p)return;const title=host.querySelector('h4');title?.insertAdjacentHTML('beforebegin',`<span class="mm-adaptive-stage">${esc(STAGE_LABELS[p.stage]||p.stage)}</span>`)})}
function recordChoice(button){const host=button.closest('[data-mm-ri-practice]');if(!host||host.dataset.mmAdaptiveChoiceRecorded==='1')return;const id=host.dataset.mmRiPractice,index=Number(button.dataset.mmRiChoice),meta=window.MM_RESEARCH_MICROLEARNING?.choiceMeta?.(id,index);if(!meta||meta.correct)return;host.dataset.mmAdaptiveChoiceRecorded='1';const p=parsePracticeId(id);setTimeout(()=>{window.MM_LEARNING_ANALYTICS?.record?.('practice_misconception',{module:'process-data',id,step:p?.stage==='recovery'?3:p?.stage==='evidence'?2:1,reason:meta.misconception||'unsupported-conclusion',correct:false});const feedback=host.querySelector('[data-mm-ri-feedback]');if(feedback&&!feedback.querySelector('[data-mm-adaptive-inline]')){const rec=recommendation(p?.mechanismId);if(rec){const wrap=document.createElement('div');wrap.dataset.mmAdaptiveInline='1';wrap.innerHTML=recommendationHtml(rec);feedback.appendChild(wrap)}}},0)}
document.addEventListener('click',e=>{const choice=e.target.closest?.('[data-mm-ri-choice]');if(choice)recordChoice(choice);const lesson=e.target.closest?.('[data-mm-adaptive-lesson]');if(lesson){e.preventDefault();goLesson(lesson.dataset.mmAdaptiveLesson)}} ,true);
let queued=false;function run(){queued=false;decorateInsights();decorateLesson();annotatePractice()}function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_ADAPTIVE_LEARNING={version:VERSION,reasoningProfile,stageForMechanism,recommendation,lessonChallenge,parsePracticeId,scope:'Learner-scoped adaptive reinforcement from local aggregate practice events only. No names, free text, formal assessment answers or network upload. Recommendations do not change formal assessment content or production authority.'};
})();
