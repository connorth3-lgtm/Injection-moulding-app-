/* MouldMaster domain bridge for legacy Learning Analytics — 2026.09.04.2 */
(function(){
'use strict';
if(window.MM_LEARNING_ANALYTICS||window.MM_LEARNING_ANALYTICS_LOADING)return;
if(!window.MM_LEARNER_SCOPE)throw new Error('MM_LEARNER_SCOPE must load before Learning Analytics');
const base='./learning-analytics.js';
const version=String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
const src=version?`${base}?v=${encodeURIComponent(version)}`:base;
const STORAGE_PREFIX='mm_learning_analytics_v1::';
const scope=window.MM_LEARNER_SCOPE;
scope.registerStoragePrefix?.(STORAGE_PREFIX);
function currentRole(){try{return String(typeof user!=='undefined'&&user?.role||'learner').trim().toLowerCase()}catch(_){return'learner'}}
function isInstructor(){return currentRole()==='instructor'}
function enforceExportAccess(root=document){
  const allowed=isInstructor();
  for(const node of root.querySelectorAll?.('[data-la-export]')||[]){node.hidden=!allowed;if(!allowed)node.setAttribute?.('aria-hidden','true');else node.removeAttribute?.('aria-hidden')}
  return allowed
}
function storageKey(token=scope.token()){return scope.storageKey(STORAGE_PREFIX,token)}
function readEvents(token=scope.token()){
  try{const x=JSON.parse(localStorage.getItem(storageKey(token))||'null');return x?.schema===1&&Array.isArray(x.events)?x.events:[]}catch(_){return[]}
}
function allTokens(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(STORAGE_PREFIX)){const t=k.slice(STORAGE_PREFIX.length);if(scope.includeStorageToken?.(STORAGE_PREFIX,t)!==false)out.push(t)}}}catch(_){}return [...new Set(out)]}
function aggregate(events){
  const e=Array.isArray(events)?events:[];
  const lessonTime=e.filter(x=>x.type==='lesson_time').reduce((s,x)=>s+(Number(x.durationSec)||0),0);
  const practice=e.filter(x=>x.type==='practice_complete');
  const practiceStarts=e.filter(x=>x.type==='practice_start');
  const missed=e.filter(x=>x.type==='practice_miss');
  const scores=new Map();
  for(const x of practice){const k=`${x.module}:${x.id}`;if(!scores.has(k))scores.set(k,[]);scores.get(k).push(Number(x.score)||0)}
  const repeated=[...scores.values()].filter(a=>a.length>=2);
  const gains=repeated.map(a=>a[a.length-1]-a[0]);
  const avgGain=gains.length?gains.reduce((a,b)=>a+b,0)/gains.length:0;
  const improved=gains.filter(x=>x>0).length;
  const practiceTime=practice.reduce((s,x)=>s+(Number(x.durationSec)||0),0);
  const avgScore=practice.length?practice.reduce((s,x)=>s+(Number(x.score)||0),0)/practice.length:0;
  const missedByStep={};
  for(const x of missed){const k=`${x.module}:${Number(x.step)||0}`;missedByStep[k]=(missedByStep[k]||0)+1}
  const difficult=Object.entries(missedByStep).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return {events:e.length,lessonTime,practiceTime,activeTime:lessonTime+practiceTime,practiceAttempts:practiceStarts.length,practiceCompleted:practice.length,avgScore,repeatedCases:repeated.length,avgGain,improvedCases:improved,misses:missed.length,difficult,lessonCompletions:new Set(e.filter(x=>x.type==='lesson_complete').map(x=>x.id)).size};
}
function cohort(){
  const tokens=allTokens(),perProfile=tokens.map(t=>aggregate(readEvents(t)));
  const namespaced=tokens.flatMap((t,i)=>readEvents(t).map(e=>e?.id==null?e:{...e,id:`profile-${i}:${e.id}`}));
  return {tokens,perProfile,aggregate:aggregate(namespaced)};
}
function stageLabel(key){const [module,raw]=String(key).split(':');const labels={diagnostic:['Observe','Best next test','Controlled response','Explain'],'process-data':['Read pattern','Diagnose','Next evidence','Recovery']};const step=Number(raw)||0;return `${module==='diagnostic'?'Diagnostic lab':'Process-data case'} · ${labels[module]?.[step]||`Step ${step+1}`}`}
function requireInstructor(){if(!isInstructor())throw new Error('Cross-profile analytics export requires instructor role')}
function exportAnonymousSummary(){
  requireInstructor();
  const c=cohort(),combined=c.aggregate;
  const payload={schema:2,version:version||'domain-quality-v1',generatedAt:new Date().toISOString(),privacy:'Anonymous aggregate only; profile boundaries are preserved for retry metrics; ambiguous or unowned legacy learner buckets are quarantined/excluded; no names, notes, answer text or event timestamps.',anonymousProfiles:c.tokens.length,aggregate:{activeLearningSeconds:combined.activeTime,practiceAttempts:combined.practiceAttempts,practiceCompleted:combined.practiceCompleted,averagePracticeScore:+combined.avgScore.toFixed(2),repeatedCases:combined.repeatedCases,averageRetryGain:+combined.avgGain.toFixed(2),improvedCases:combined.improvedCases,missesByStage:combined.difficult.map(([k,n])=>({stage:stageLabel(k),count:n}))},profiles:c.perProfile.map((x,i)=>({anonymousProfile:i+1,activeLearningSeconds:x.activeTime,practiceAttempts:x.practiceAttempts,practiceCompleted:x.practiceCompleted,averagePracticeScore:+x.avgScore.toFixed(2),repeatedCases:x.repeatedCases,averageRetryGain:+x.avgGain.toFixed(2),improvedCases:x.improvedCases}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mouldmaster-anonymous-learning-summary.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);return payload
}
function setMetric(label,value,index=0){const matches=[...(document.querySelectorAll?.('#learningInsights .la-kpi span')||[])].filter(x=>x.textContent?.trim()===label);const node=matches[index]?.parentElement?.querySelector?.('strong');if(node)node.textContent=value}
function patchRenderedMetrics(){
  if(!window.MM_LEARNING_ANALYTICS)return;
  const current=aggregate(readEvents());
  setMetric('Average retry gain',current.repeatedCases?`${current.avgGain.toFixed(1)} pts`:'—',0);
  const rows=[...(document.querySelectorAll?.('#learningInsights .la-row span')||[])];
  const improved=rows.find(x=>x.textContent?.trim()==='Cases with a higher later best score'||x.textContent?.trim()==='Cases with a higher latest score');
  if(improved){improved.textContent='Cases with a higher latest score';const strong=improved.parentElement?.querySelector?.('strong');if(strong)strong.textContent=String(current.improvedCases)}
  if(isInstructor()){const c=cohort().aggregate;setMetric('Average retry gain',c.repeatedCases?`${c.avgGain.toFixed(1)} pts`:'—',1)}
}
function installQuality(){
  const api=window.MM_LEARNING_ANALYTICS;if(!api||api.__mmQualityCorrected)return;
  const baseOpen=api.open;
  api.summary=()=>aggregate(readEvents());
  api.cohortSummary=()=>{requireInstructor();const c=cohort();return {anonymousProfiles:c.tokens.length,aggregate:c.aggregate,profiles:c.perProfile}};
  api.exportAnonymousSummary=exportAnonymousSummary;
  api.open=function(){const r=baseOpen?.apply(this,arguments);queueMicrotask(patchRenderedMetrics);return r};
  api.__mmQualityCorrected=true;
  window.MM_LEARNING_ANALYTICS_QUALITY=Object.freeze({aggregate,cohortSummary:api.cohortSummary,exportAnonymousSummary,scope:'Retry gain is latest completed attempt minus first completed attempt. Cross-profile aggregation preserves anonymous learner boundaries. Legacy learner buckets with ambiguous or unproven local ownership are excluded rather than assigned to a profile.'});
  queueMicrotask(patchRenderedMetrics);
}
function guardExport(event){
  queueMicrotask(()=>{enforceExportAccess();patchRenderedMetrics()});
  const target=event.target?.closest?.('[data-la-export]');
  if(!target)return;
  if(!isInstructor()){
    event.preventDefault?.();event.stopImmediatePropagation?.();window.toast?.('Instructor role required for cross-profile analytics export');return;
  }
  if(window.MM_LEARNING_ANALYTICS_QUALITY){event.preventDefault?.();event.stopImmediatePropagation?.();try{window.MM_LEARNING_ANALYTICS_QUALITY.exportAnonymousSummary()}catch(err){window.toast?.(err?.message||String(err))}}
}
document.addEventListener('click',guardExport,true);
window.addEventListener('load',()=>{enforceExportAccess();installQuality();patchRenderedMetrics()});
window.addEventListener('mm:domains-ready',()=>{enforceExportAccess();installQuality();patchRenderedMetrics()});
window.MM_LEARNING_ANALYTICS_ACCESS=Object.freeze({isInstructor,enforce:enforceExportAccess,scope:'Cross-profile learning analytics export is instructor-only. Learner-scoped analytics remain available to the active learner.'});
const ready=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.mmDomainBridge='learning-analytics';
  s.onload=()=>{enforceExportAccess();installQuality();resolve(window.MM_LEARNING_ANALYTICS||null)};
  s.onerror=()=>reject(new Error(`Learning Analytics asset failed: ${base}`));
  document.body.appendChild(s);
});
window.MM_LEARNING_ANALYTICS_LOADING=ready;
})();