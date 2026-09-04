/* MouldMaster domain bridge for legacy Learning Analytics — 2026.09.05.3 */
(function(){
'use strict';
if(window.MM_LEARNING_ANALYTICS||window.MM_LEARNING_ANALYTICS_LOADING)return;
if(!window.MM_LEARNER_SCOPE)throw new Error('MM_LEARNER_SCOPE must load before Learning Analytics');
const base='./learning-analytics.js';
const version=String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
const src=version?`${base}?v=${encodeURIComponent(version)}`:base;
const STORAGE_PREFIX='mm_learning_analytics_v1::';
const MIN_EXPORT_PROFILES=5;
const scope=window.MM_LEARNER_SCOPE;
scope.registerStoragePrefix?.(STORAGE_PREFIX);
function currentRole(){try{return String(typeof user!=='undefined'&&user?.role||'learner').trim().toLowerCase()}catch(_){return'learner'}}
function isInstructor(){return currentRole()==='instructor'}
function localModeBoundary(){return 'Local instructor view is a device-local convenience mode, not authenticated identity or an authorization boundary. Anyone able to control this browser profile can change local application state.'}
function enforceExportAccess(root=document){
  const allowed=isInstructor();
  for(const node of root.querySelectorAll?.('[data-la-export]')||[]){node.hidden=!allowed;if(!allowed)node.setAttribute?.('aria-hidden','true');else node.removeAttribute?.('aria-hidden')}
  return allowed
}
function decorateRoleControl(root=document){
  const select=root.getElementById?.('profileRole')||root.querySelector?.('#profileRole');if(!select)return false;
  let note=root.getElementById?.('mmLocalRoleBoundary')||root.querySelector?.('#mmLocalRoleBoundary');
  if(!note){note=document.createElement('small');note.id='mmLocalRoleBoundary';note.dataset.mmLocalRoleBoundary='1';note.className='tiny muted';note.textContent='Local view mode only. Choosing instructor enables cohort-level aggregate summaries stored in this browser; it is not login, identity verification or a security boundary.';select.insertAdjacentElement?.('afterend',note)}
  select.setAttribute?.('aria-describedby','mmLocalRoleBoundary');
  return true
}
function storageKey(token=scope.token()){return scope.storageKey(STORAGE_PREFIX,token)}
function storageFailure(kind){
  try{window.dispatchEvent?.(new CustomEvent('mm:learning-analytics-storage-error',{detail:{kind}}))}catch(_){}
  throw new Error(`Learning analytics storage unavailable (${kind})`)
}
function readEvents(token=scope.token()){
  try{
    const raw=localStorage.getItem(storageKey(token));if(raw==null)return [];
    const x=JSON.parse(raw);if(x?.schema===1&&Array.isArray(x.events))return x.events;
    return storageFailure('invalid-analytics-store')
  }catch(err){if(/Learning analytics storage unavailable/.test(String(err?.message||'')))throw err;return storageFailure('analytics-read-failed')}
}
function knownTokenSets(){
  const ids=scope.knownIds?.()||[];
  const strong=new Set(),legacy=new Set();
  for(const id of ids){try{strong.add(scope.tokenFor(id))}catch(_){}try{if(scope.legacyTokenFor)legacy.add(scope.legacyTokenFor(id))}catch(_){}}
  return {ids,strong,legacy}
}
function liveToken(token,known=knownTokenSets()){
  const t=String(token||'').toLowerCase();
  if(known.strong.has(t))return true;
  if(scope.isLegacyToken?.(t)&&known.legacy.has(t)&&scope.includeStorageToken?.(STORAGE_PREFIX,t)!==false)return true;
  return false
}
function allTokens(){
  const out=[],known=knownTokenSets();
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(STORAGE_PREFIX)){const t=k.slice(STORAGE_PREFIX.length);if(liveToken(t,known))out.push(t)}}}
  catch(_){return storageFailure('analytics-index-read-failed')}
  return [...new Set(out)]
}
function clearAllAnalytics(){
  let removed=0;
  try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k?.startsWith(STORAGE_PREFIX)){localStorage.removeItem(k);removed++}}}
  catch(_){return storageFailure('analytics-clear-all-failed')}
  return removed
}
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
  const tokens=allTokens(),stores=tokens.map(t=>readEvents(t));
  const namespaced=stores.flatMap((events,i)=>events.map(e=>e?.id==null?e:{...e,id:`profile-${i}:${e.id}`}));
  return {tokens,aggregate:aggregate(namespaced)};
}
function stageLabel(key){const [module,raw]=String(key).split(':');const labels={diagnostic:['Observe','Best next test','Controlled response','Explain'],'process-data':['Read pattern','Diagnose','Next evidence','Recovery']};const step=Number(raw)||0;return `${module==='diagnostic'?'Diagnostic lab':'Process-data case'} · ${labels[module]?.[step]||`Step ${step+1}`}`}
function requireInstructor(){if(!isInstructor())throw new Error('Cohort analytics export requires local instructor view mode on this device; this mode is not authentication')}
function requireExportCohort(c){if(c.tokens.length<MIN_EXPORT_PROFILES)throw new Error(`Cohort aggregate export requires at least ${MIN_EXPORT_PROFILES} current local learner profiles.`);return c}
function exportAnonymousSummary(){
  requireInstructor();
  const c=requireExportCohort(cohort()),combined=c.aggregate;
  const payload={schema:2,version:version||'domain-quality-v2',generatedAt:new Date().toISOString(),privacy:`Cohort aggregate only; minimum ${MIN_EXPORT_PROFILES} current local profiles; no per-profile rows, names, hashed learner tokens, notes, answer text or event timestamps. Orphaned, ambiguous or unowned learner buckets are excluded. Local instructor view is a device-local convenience mode, not authenticated identity or a security boundary.`,anonymousProfiles:c.tokens.length,aggregate:{activeLearningSeconds:combined.activeTime,practiceAttempts:combined.practiceAttempts,practiceCompleted:combined.practiceCompleted,averagePracticeScore:+combined.avgScore.toFixed(2),repeatedCases:combined.repeatedCases,averageRetryGain:+combined.avgGain.toFixed(2),improvedCases:combined.improvedCases,missesByStage:combined.difficult.map(([k,n])=>({stage:stageLabel(k),count:n}))}};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mouldmaster-cohort-learning-summary.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);return payload
}
function setMetric(label,value,index=0){const matches=[...(document.querySelectorAll?.('#learningInsights .la-kpi span')||[])].filter(x=>x.textContent?.trim()===label);const node=matches[index]?.parentElement?.querySelector?.('strong');if(node)node.textContent=value}
function patchCohortNote(count){
  const heading=[...(document.querySelectorAll?.('#learningInsights .eyebrow')||[])].find(x=>/^Instructor view\b|^Local instructor view\b/.test(x.textContent?.trim()||''));
  if(!heading)return;
  heading.textContent='Local instructor view · this device only';
  const panel=heading.closest?.('.la-panel');const note=panel?.querySelector?.('.la-note');if(!note)return;
  note.textContent=`The export contains cohort-level aggregate metrics only and requires at least ${MIN_EXPORT_PROFILES} current local learner profiles. Orphaned analytics buckets from removed/imported profiles are excluded. It does not include per-profile rows, learner names, hashed learner tokens, notes or event timestamps. Local instructor view is a convenience mode, not authenticated authorization.${count>=MIN_EXPORT_PROFILES?'':' More current local learner profiles are needed before export is enabled by policy.'}`
}
function patchRenderedMetrics(){
  if(!window.MM_LEARNING_ANALYTICS)return;
  try{
    const current=aggregate(readEvents());
    setMetric('Average retry gain',current.repeatedCases?`${current.avgGain.toFixed(1)} pts`:'—',0);
    const rows=[...(document.querySelectorAll?.('#learningInsights .la-row span')||[])];
    const improved=rows.find(x=>x.textContent?.trim()==='Cases with a higher later best score'||x.textContent?.trim()==='Cases with a higher latest score');
    if(improved){improved.textContent='Cases with a higher latest score';const strong=improved.parentElement?.querySelector?.('strong');if(strong)strong.textContent=String(current.improvedCases)}
    if(isInstructor()){
      const c=cohort();
      setMetric('Local learner profiles',String(c.tokens.length));
      setMetric('Tracked practice attempts',String(c.aggregate.practiceAttempts));
      setMetric('Completed practice cases',String(c.aggregate.practiceCompleted));
      setMetric('Average retry gain',c.aggregate.repeatedCases?`${c.aggregate.avgGain.toFixed(1)} pts`:'—',1);
      patchCohortNote(c.tokens.length);
    }
  }catch(err){window.toast?.(err?.message||String(err))}
  decorateRoleControl();
}
function installQuality(){
  const api=window.MM_LEARNING_ANALYTICS;if(!api||api.__mmQualityCorrected)return;
  const baseOpen=api.open;
  api.summary=()=>aggregate(readEvents());
  api.cohortSummary=()=>{requireInstructor();const c=cohort();return {anonymousProfiles:c.tokens.length,aggregate:c.aggregate,boundary:localModeBoundary()}};
  api.exportAnonymousSummary=exportAnonymousSummary;
  api.clearAllAnalytics=clearAllAnalytics;
  api.minimumAggregateProfiles=MIN_EXPORT_PROFILES;
  api.open=function(){const r=baseOpen?.apply(this,arguments);queueMicrotask(patchRenderedMetrics);return r};
  api.__mmQualityCorrected=true;
  window.MM_LEARNING_ANALYTICS_QUALITY=Object.freeze({aggregate,cohortSummary:api.cohortSummary,exportAnonymousSummary,clearAllAnalytics,liveTokens:()=>allTokens().slice(),minimumAggregateProfiles:MIN_EXPORT_PROFILES,localModeBoundary,scope:'Retry gain is latest completed attempt minus first completed attempt. Cross-profile metrics use only analytics buckets that map to current local learner profiles; orphaned strong-token buckets and ambiguous/unowned legacy buckets are excluded. Exports contain cohort-level aggregate data only and require a minimum cohort size. Storage read/index failures fail closed. Local instructor view is not authenticated identity or an authorization boundary.'});
  queueMicrotask(patchRenderedMetrics);
}
function guardExport(event){
  queueMicrotask(()=>{enforceExportAccess();patchRenderedMetrics();decorateRoleControl()});
  const target=event.target?.closest?.('[data-la-export]');
  if(!target)return;
  if(!isInstructor()){
    event.preventDefault?.();event.stopImmediatePropagation?.();window.toast?.('Enable local instructor view to use the cohort aggregate summary');return;
  }
  if(window.MM_LEARNING_ANALYTICS_QUALITY){event.preventDefault?.();event.stopImmediatePropagation?.();try{window.MM_LEARNING_ANALYTICS_QUALITY.exportAnonymousSummary()}catch(err){window.toast?.(err?.message||String(err))}}
}
document.addEventListener('click',guardExport,true);
window.MM_APP_SHELL?.events?.onRender?.('profile',()=>decorateRoleControl());
window.addEventListener('load',()=>{enforceExportAccess();installQuality();patchRenderedMetrics();decorateRoleControl()});
window.addEventListener('mm:domains-ready',()=>{enforceExportAccess();installQuality();patchRenderedMetrics();decorateRoleControl()});
window.MM_LEARNING_ANALYTICS_ACCESS=Object.freeze({isInstructor,isLocalInstructorMode:isInstructor,enforce:enforceExportAccess,localModeBoundary,scope:'Cross-profile learning analytics are available only while this device is in local instructor view. That local view is a convenience mode, not authenticated identity or a security boundary. Learner-scoped analytics remain available to the active learner.'});
const ready=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.mmDomainBridge='learning-analytics';
  s.onload=()=>{enforceExportAccess();installQuality();decorateRoleControl();resolve(window.MM_LEARNING_ANALYTICS||null)};
  s.onerror=()=>reject(new Error(`Learning Analytics asset failed: ${base}`));
  document.body.appendChild(s);
});
window.MM_LEARNING_ANALYTICS_LOADING=ready;
})();