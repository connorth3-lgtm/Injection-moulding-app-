/* MouldMaster empirical learning-effectiveness layer — 2026.09.02.3 */
(function(){
'use strict';
if(window.MM_LEARNING_EFFECTIVENESS)return;
const VERSION='2026.09.02.3';
const PREFIX='mm_learning_analytics_v1::';
const STAGES=['evidence','falsification','recovery','integration'];
const MIN_PROFILES=5,MIN_ATTEMPTS=12,RETENTION_DAYS=[7,30];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hash(text){let h=2166136261;for(const ch of String(text||'anonymous')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function activeUserId(){try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}return'anonymous'}
function parsePracticeId(id){let raw=String(id||'');if(!raw.startsWith('run-insight-'))return null;raw=raw.slice(12);const m=raw.match(/-(evidence|falsification|recovery|integration)(?:-([a-z0-9]+))?$/);return m?{mechanismId:raw.slice(0,m.index),stage:m[1],contextKey:m[2]||'legacy'}:null}
function stores(){const out=[];try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;const x=JSON.parse(localStorage.getItem(key)||'null');if(x&&Array.isArray(x.events))out.push({token:key.slice(PREFIX.length),events:x.events})}}catch(_){}return out}
function currentEvents(){const token=hash(activeUserId());return stores().find(x=>x.token===token)?.events||[]}
function contextualCompletes(events){return (events||[]).filter(x=>x.type==='practice_complete'&&x.module==='process-data'&&parsePracticeId(x.id))}
function profileAccuracy(events,exclude=null){const xs=contextualCompletes(events).filter(x=>{const p=parsePracticeId(x.id);return !exclude||`${p.mechanismId}:${p.stage}`!==exclude});if(!xs.length)return null;return xs.filter(x=>Number(x.score)>=100||x.correct===true).length/xs.length}
function itemStats(mechanismId,stage){
  const key=`${mechanismId}:${stage}`,profiles=[];let attempts=0,correct=0,totalDuration=0,durations=0;const misconceptions={};
  for(const store of stores()){
    const completes=store.events.filter(x=>x.type==='practice_complete'&&x.module==='process-data').filter(x=>{const p=parsePracticeId(x.id);return p?.mechanismId===mechanismId&&p.stage===stage});
    if(!completes.length)continue;
    const c=completes.filter(x=>Number(x.score)>=100||x.correct===true).length;attempts+=completes.length;correct+=c;
    for(const x of completes)if(Number.isFinite(Number(x.durationSec))){totalDuration+=Number(x.durationSec);durations++}
    for(const x of store.events.filter(x=>x.type==='practice_misconception')){const p=parsePracticeId(x.id);if(p?.mechanismId===mechanismId&&p.stage===stage&&x.reason)misconceptions[x.reason]=(misconceptions[x.reason]||0)+1}
    profiles.push({attempts:completes.length,correct:c,accuracy:c/completes.length,ability:profileAccuracy(store.events,key)});
  }
  const profileCount=profiles.length,successRate=attempts?correct/attempts:null,eligible=profileCount>=MIN_PROFILES&&attempts>=MIN_ATTEMPTS;
  let discrimination=null;
  const ability=profiles.filter(x=>Number.isFinite(x.ability)).sort((a,b)=>a.ability-b.ability);
  if(ability.length>=8){const n=Math.max(2,Math.floor(ability.length*.27)),low=ability.slice(0,n),high=ability.slice(-n),rate=x=>x.reduce((s,p)=>s+p.correct,0)/Math.max(1,x.reduce((s,p)=>s+p.attempts,0));discrimination=rate(high)-rate(low)}
  let challenge='standard',quality='insufficient-sample';
  if(eligible){if(successRate>=.86)challenge='stretch';else if(successRate<=.55)challenge='support';quality=successRate>=.92?'too-easy':successRate<=.42?'too-hard':'in-range';if(discrimination!=null&&discrimination<.10)quality=quality==='in-range'?'low-discrimination':quality}
  const topMisconception=Object.entries(misconceptions).sort((a,b)=>b[1]-a[1])[0]||null;
  return {mechanismId,stage,profileCount,attempts,correct,successRate,averageDurationSec:durations?totalDuration/durations:null,eligible,challenge,quality,discrimination,topMisconception:topMisconception?{reason:topMisconception[0],count:topMisconception[1]}:null};
}
function challengeFor(mechanismId,stage){return itemStats(mechanismId,stage).challenge}
function masteryAt(mechanismId,stage,events=currentEvents()){
  const seen=new Set();for(const x of contextualCompletes(events).slice().sort((a,b)=>String(a.t||'').localeCompare(String(b.t||'')))){const p=parsePracticeId(x.id);if(p?.mechanismId!==mechanismId||p.stage!==stage||!(Number(x.score)>=100||x.correct===true))continue;seen.add(p.contextKey||'legacy');if(seen.size>=2)return x.t||null}return null
}
function retentionDone(mechanismId,stage,days,events=currentEvents()){
  return events.some(x=>x.type==='retention_check'&&x.module==='process-data'&&x.reason===`${days}d:${stage}`&&parsePracticeId(x.id)?.mechanismId===mechanismId&&(Number(x.score)>=100||x.correct===true))
}
function dueTransferChecks(now=Date.now()){
  const events=currentEvents(),mechanisms=new Set(contextualCompletes(events).map(x=>parsePracticeId(x.id)?.mechanismId).filter(Boolean)),due=[];
  for(const mechanismId of mechanisms)for(const stage of STAGES){const at=masteryAt(mechanismId,stage,events);if(!at)continue;const mastered=Date.parse(at);if(!Number.isFinite(mastered))continue;for(const days of RETENTION_DAYS){const dueAt=mastered+days*86400000;if(now>=dueAt&&!retentionDone(mechanismId,stage,days,events))due.push({mechanismId,stage,intervalDays:days,dueAt:new Date(dueAt).toISOString()})}}
  return due.sort((a,b)=>a.dueAt.localeCompare(b.dueAt))
}
function practiceIntent(mechanismId,fallbackStage='evidence'){
  const due=dueTransferChecks().find(x=>x.mechanismId===mechanismId);return due?{stage:due.stage,mode:'retention',intervalDays:due.intervalDays,label:`${due.intervalDays}-day delayed transfer check`}:{stage:STAGES.includes(fallbackStage)?fallbackStage:'evidence',mode:'progression',intervalDays:null,label:'progression practice'}
}
function recordOutcome(practice,correct,durationSec){
  if(practice?.mode!=='retention'||!practice?.retentionIntervalDays)return null;
  return window.MM_LEARNING_ANALYTICS?.record?.('retention_check',{module:'process-data',id:practice.id,reason:`${practice.retentionIntervalDays}d:${practice.stage}`,score:correct?100:0,durationSec:Number(durationSec)||0,correct:!!correct})||null
}
function allItemStats(){const keys=new Set();for(const store of stores())for(const x of contextualCompletes(store.events)){const p=parsePracticeId(x.id);if(p)keys.add(`${p.mechanismId}|${p.stage}`)}return [...keys].map(k=>{const [m,s]=k.split('|');return itemStats(m,s)})}
function anonymousReport(){const items=allItemStats().filter(x=>x.profileCount>=MIN_PROFILES).map(x=>({mechanismId:x.mechanismId,stage:x.stage,anonymousProfiles:x.profileCount,attempts:x.attempts,successRate:x.successRate==null?null:+x.successRate.toFixed(3),averageDurationSec:x.averageDurationSec==null?null:+x.averageDurationSec.toFixed(1),difficultyQuality:x.quality,calibratedChallenge:x.challenge,discrimination:x.discrimination==null?null:+x.discrimination.toFixed(3),topMisconception:x.topMisconception}));return{schema:1,version:VERSION,generatedAt:new Date().toISOString(),privacy:`Aggregate items require at least ${MIN_PROFILES} anonymous local profiles; no names, learner tokens, answer text, notes or event timestamps are exported.`,anonymousProfiles:stores().length,thresholds:{minimumProfiles:MIN_PROFILES,minimumAttempts:MIN_ATTEMPTS,retentionDays:RETENTION_DAYS},items}}
function exportReport(){const blob=new Blob([JSON.stringify(anonymousReport(),null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mouldmaster-learning-effectiveness.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function role(){try{return String(user?.role||'learner')}catch(_){return'learner'}}
function ensureStyle(){if(document.getElementById('mm-learning-effectiveness-style'))return;const s=document.createElement('style');s.id='mm-learning-effectiveness-style';s.textContent=`.mm-effectiveness{margin:14px 0;padding:16px;border:1px solid #3b665f;border-radius:14px;background:linear-gradient(145deg,#102824,#0d1d2d)}.mm-effectiveness h3{margin:5px 0 8px}.mm-effectiveness p{color:#bdd5d0;font-size:12px;line-height:1.5}.mm-effectiveness-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mm-effectiveness-cell{padding:10px;border:1px solid #315650;border-radius:9px;background:#0b1b22}.mm-effectiveness-cell small{display:block;color:#8fb7ae}.mm-effectiveness-cell b{display:block;margin-top:4px}.mm-effectiveness-due{margin-top:9px;padding:9px;border-left:3px solid #d6ab55;background:#282113;color:#f4dfac;font-size:11px;line-height:1.45}.mm-effectiveness-tag{display:inline-flex;margin:3px 4px 0 0;padding:3px 7px;border:1px solid #497169;border-radius:999px;font-size:9px;color:#bce1d8}@media(max-width:760px){.mm-effectiveness-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function renderCard(){
  const root=document.getElementById('learningInsights');if(!root||root.classList.contains('hidden')||root.querySelector('[data-mm-learning-effectiveness]'))return;ensureStyle();
  const due=dueTransferChecks(),items=allItemStats(),calibrated=items.filter(x=>x.eligible),weak=calibrated.filter(x=>x.quality==='too-hard'||x.quality==='low-discrimination').length,strong=calibrated.filter(x=>x.quality==='too-easy').length;
  const box=document.createElement('section');box.className='mm-effectiveness';box.dataset.mmLearningEffectiveness='1';box.innerHTML=`<span class="eyebrow">Learning effectiveness</span><h3>Is the learning actually sticking?</h3><p>Contextual practice now separates immediate progression from delayed transfer and only calibrates formative difficulty after a privacy threshold is reached.</p><div class="mm-effectiveness-grid"><div class="mm-effectiveness-cell"><small>Delayed checks due</small><b>${due.length}</b></div><div class="mm-effectiveness-cell"><small>Device-local anonymous profiles</small><b>${stores().length}</b></div><div class="mm-effectiveness-cell"><small>Items with enough calibration evidence</small><b>${calibrated.length}</b></div></div>${due[0]?`<div class="mm-effectiveness-due"><b>${esc(due[0].intervalDays)}-day transfer check due</b><br>The next comparable Run Insight for ${esc(due[0].mechanismId.replace(/-/g,' '))} will retest ${esc(due[0].stage)} reasoning rather than simply advancing difficulty.</div>`:''}${role()==='instructor'?`<p><b>Quality flags:</b> ${weak} need difficulty/discrimination review · ${strong} are currently too easy once minimum sample requirements are met.</p><button type="button" class="secondary" data-mm-effectiveness-export>Export anonymous effectiveness report</button>`:`<p>Calibration stays at the authored standard until at least ${MIN_PROFILES} anonymous local profiles and ${MIN_ATTEMPTS} attempts exist for an item.</p>`}`;
  const anchor=root.querySelector('[data-mm-adaptive-recommendation]')||root.querySelector('.la-hero');anchor?.insertAdjacentElement('afterend',box)
}
function annotatePractices(){
  const due=dueTransferChecks();document.querySelectorAll('[data-mm-ri-practice]').forEach(host=>{if(host.dataset.mmEffectivenessAnnotated==='1')return;const p=parsePracticeId(host.dataset.mmRiPractice);if(!p)return;host.dataset.mmEffectivenessAnnotated='1';const stats=itemStats(p.mechanismId,p.stage),meta=host.querySelector('.mm-ri-practice-meta');if(!meta)return;meta.insertAdjacentHTML('beforeend',`<span class="mm-effectiveness-tag">Difficulty: ${esc(stats.challenge)}${stats.eligible?' · calibrated':' · authored'}</span>`);const delayed=due.find(x=>x.mechanismId===p.mechanismId&&x.stage===p.stage);if(delayed)meta.insertAdjacentHTML('beforeend',`<span class="mm-effectiveness-tag">${delayed.intervalDays}-day transfer check</span>`)})
}
function recordRetentionChoice(button){
  const host=button.closest?.('[data-mm-ri-practice]');if(!host||host.dataset.mmRetentionRecorded==='1')return;const p=parsePracticeId(host.dataset.mmRiPractice);if(!p)return;const due=dueTransferChecks().find(x=>x.mechanismId===p.mechanismId&&x.stage===p.stage);if(!due)return;const index=Number(button.dataset.mmRiChoice),option=window.MM_RESEARCH_MICROLEARNING?.choiceMeta?.(host.dataset.mmRiPractice,index);if(!option)return;host.dataset.mmRetentionRecorded='1';window.MM_LEARNING_ANALYTICS?.record?.('retention_check',{module:'process-data',id:host.dataset.mmRiPractice,reason:`${due.intervalDays}d:${p.stage}`,score:option.correct?100:0,correct:!!option.correct})
}
document.addEventListener('click',e=>{const exportButton=e.target.closest?.('[data-mm-effectiveness-export]');if(exportButton)exportReport();const choice=e.target.closest?.('[data-mm-ri-choice]');if(choice)recordRetentionChoice(choice)});
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;renderCard();annotatePractices()},0)}new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_LEARNING_EFFECTIVENESS={version:VERSION,itemStats,allItemStats,challengeFor,masteryAt,dueTransferChecks,practiceIntent,recordOutcome,anonymousReport,scope:'Empirical learning-quality analysis from learner-scoped local analytics. Difficulty calibration requires anonymous device-local cohort thresholds; failed delayed checks remain due for another comparable context, and aggregate exports contain item statistics only with no learner tokens, names, answer text, notes or event timestamps.'};
})();
