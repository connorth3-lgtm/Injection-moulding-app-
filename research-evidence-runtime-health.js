/* MouldMaster app-wide integration + research runtime health — 2026.09.02.5 */
(function(){
'use strict';
const VERSION='2026.09.02.5';
const LEARNING_PREFIX='mm_learning_analytics_v1::';
const COHORT_KEY='mm_cohort_calibration_v1';
const COMPETENCY_ORDER=['viewed','completed','practised','demonstrated','transferred','retained'];
const ALIASES=new Map([['diagnose','mould-master'],['problem-now','mould-master'],['due-reviews','learning-insights']]);
const bus=new Map();
const state={route:'',focus:null,dueReview:null};
const safe=(fn,...args)=>{try{return typeof fn==='function'?fn(...args):undefined}catch(e){console.warn('[MouldMaster integration]',e)}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>{try{return structuredClone(v)}catch(_){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}};
function emit(name,payload){for(const fn of bus.get(name)||[])safe(fn,clone(payload))}
function on(name,fn){if(typeof fn!=='function')return()=>{};if(!bus.has(name))bus.set(name,new Set());bus.get(name).add(fn);return()=>bus.get(name)?.delete(fn)}
function off(name,fn){bus.get(name)?.delete(fn)}
function getState(){return clone(state)}
function setState(next){for(const k of Object.keys(state))delete state[k];Object.assign(state,clone(next)||{});emit('state',getState());return getState()}
function patchState(patch){Object.assign(state,clone(patch)||{});emit('state',getState());return getState()}
function subscribeState(fn){const stop=on('state',fn);safe(fn,getState());return stop}
function registerAlias(from,to){if(from&&to)ALIASES.set(String(from),String(to));return()=>ALIASES.delete(String(from))}
function resolveRoute(route){let r=String(route||'');const seen=new Set();while(ALIASES.has(r)&&!seen.has(r)){seen.add(r);r=ALIASES.get(r)}return r}
function upgradeShell(){
 const shell=window.MM_APP_SHELL;if(!shell)return false;
 Object.assign(shell,{on,off,emit,getState,setState,patchState,subscribeState,registerAlias,resolveRoute});
 if(!shell.__mmIntegratedGo&&typeof shell.go==='function'){
  const base=shell.go.bind(shell);shell.go=function(route,options){const resolved=resolveRoute(route);patchState({route:resolved});emit('route',{requested:route,resolved,options:clone(options||{})});return base(resolved,options)};shell.__mmIntegratedGo=true;
 }
 return true
}
function openWorkspace(){
 patchState({route:'mould-master',focus:'problem-now'});emit('route',{requested:'diagnose',resolved:'mould-master'});
 if(window.MM_MOULD_MASTER_WORKSPACE?.open)return safe(window.MM_MOULD_MASTER_WORKSPACE.open);
 if(window.MM_APP_SHELL?.go)return safe(window.MM_APP_SHELL.go,'mould-master');
 const root=document.getElementById('mmMouldMasterWorkspace');if(root){root.scrollIntoView({behavior:'smooth',block:'start'});root.focus?.();return true}
 return false
}
function bindProblemEntry(){
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('button,a');if(!b)return;const text=(b.textContent||'').trim();
  if(/diagnose a moulding problem|i have a problem now/i.test(text)){e.preventDefault();e.stopImmediatePropagation();openWorkspace()}
 },true)
}
function activeUserId(){try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}return'anonymous'}
function tokenFor(raw){let h=2166136261;for(const ch of String(raw||'anonymous')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function learnerEvents(){try{const x=JSON.parse(localStorage.getItem(LEARNING_PREFIX+tokenFor(activeUserId()))||'null');return Array.isArray(x?.events)?x.events:[]}catch(_){return[]}}
function completedSet(){try{return new Set((user?.completed||[]).map(String))}catch(_){return new Set()}}
function lessonIdNow(){try{return String(typeof currentLesson==='function'?currentLesson()?.id||'':'')}catch(_){return''}}
function markViewed(){const id=lessonIdNow();if(!id)return;try{const key=`mm_competency_viewed_v1::${tokenFor(activeUserId())}`,x=JSON.parse(localStorage.getItem(key)||'[]'),s=new Set(Array.isArray(x)?x.map(String):[]);if(!s.has(id)){s.add(id);localStorage.setItem(key,JSON.stringify([...s].slice(-500)))}}catch(_){}}
function viewedSet(){try{const x=JSON.parse(localStorage.getItem(`mm_competency_viewed_v1::${tokenFor(activeUserId())}`)||'[]');return new Set((Array.isArray(x)?x:[]).map(String))}catch(_){return new Set()}}
function competencySummary(){
 const viewed=viewedSet(),completed=completedSet(),events=learnerEvents(),practice=new Set(),demonstrated=new Set(),transferred=new Set(),retained=new Set();
 const contexts=new Map();
 for(const x of events){
  const id=String(x.lessonId||x.lesson||x.id||'');
  if(x.type==='practice_complete'){practice.add(id);if(Number(x.score)>=100||x.correct===true)demonstrated.add(id);if(/^run-insight-/.test(id)&&(Number(x.score)>=100||x.correct===true)){const m=id.match(/^run-insight-(.+?)-(evidence|falsification|recovery|integration)(?:-([a-z0-9]+))?$/);if(m){const key=`${m[1]}:${m[2]}`,set=contexts.get(key)||new Set();set.add(m[3]||'legacy');contexts.set(key,set);if(set.size>=2)transferred.add(key)}}}
  if(x.type==='retention_check'&&(Number(x.score)>=100||x.correct===true))retained.add(id)
 }
 return {viewed:viewed.size,completed:completed.size,practised:practice.size,demonstrated:demonstrated.size,transferred:transferred.size,retained:retained.size,order:COMPETENCY_ORDER.slice(),boundary:'Completion records finishing a lesson. Demonstrated, transferred and retained are separate evidence states and must not be inferred from completion alone.'}
}
function dueReviews(){return window.MM_LEARNING_EFFECTIVENESS?.dueTransferChecks?.()||[]}
function openDueReview(item){if(!item)return;patchState({dueReview:clone(item),route:'learning-insights'});emit('due-review-opened',item);if(window.MM_APP_SHELL?.go)safe(window.MM_APP_SHELL.go,'learning-insights');else safe(window.MM_LEARNING_ANALYTICS_UI?.open);requestAnimationFrame(()=>renderDueReviewFocus(item))}
function renderDueReviewFocus(item){
 const root=document.getElementById('learningInsights')||document.getElementById('dashboard');if(!root)return;
 root.querySelector('[data-mm-due-review-focus]')?.remove();const box=document.createElement('section');box.dataset.mmDueReviewFocus='1';box.className='mm-integrated-card';box.innerHTML=`<span class="eyebrow">Due review</span><h3>${esc(item.intervalDays)}-day transfer check</h3><p>Re-test <b>${esc(item.stage)}</b> reasoning for <b>${esc(String(item.mechanismId||'').replace(/-/g,' '))}</b>. State the evidence that would support the explanation, the evidence that would weaken it, and what recovery would need to look like.</p><p><small>This is formative retention practice. It does not reveal or modify formal assessment items.</small></p>`;root.prepend(box)
}
function ensureStyle(){if(document.getElementById('mm-app-wide-integration-style'))return;const s=document.createElement('style');s.id='mm-app-wide-integration-style';s.textContent=`.mm-integrated-card{margin:12px 0;padding:14px;border:1px solid #395875;border-radius:13px;background:#0d1b2a}.mm-integrated-card h3{margin:5px 0 8px}.mm-integrated-card p{margin:6px 0;color:#bfd0df;line-height:1.45}.mm-integrated-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mm-integrated-cell{padding:9px;border:1px solid #2c4962;border-radius:9px;background:#091624}.mm-integrated-cell small{display:block;color:#8faabe}.mm-integrated-cell b{display:block;margin-top:3px}.mm-integrated-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}@media(max-width:760px){.mm-integrated-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;document.head.appendChild(s)}
function dashboardSections(){
 const shell=window.MM_APP_SHELL;if(!shell?.registerDashboard||shell.__mmAppWideSections)return;shell.__mmAppWideSections=true;
 shell.registerDashboard({id:'app-wide-due-reviews',zone:'before',order:8,when:()=>dueReviews().length>0,render:slot=>{const due=dueReviews();slot.innerHTML=`<section class="mm-integrated-card"><span class="eyebrow">Due reviews</span><h3>${due.length} transfer check${due.length===1?'':'s'} due</h3><p>Retention reviews are available from Home; you do not need to wait for a comparable production run to appear.</p><div class="mm-integrated-actions">${due.slice(0,3).map((x,i)=>`<button type="button" class="secondary" data-mm-open-due="${i}">${esc(x.intervalDays)}d · ${esc(x.stage)} · ${esc(String(x.mechanismId).replace(/-/g,' '))}</button>`).join('')}</div></section>`;slot.querySelectorAll('[data-mm-open-due]').forEach(b=>b.addEventListener('click',()=>openDueReview(due[Number(b.dataset.mmOpenDue)])))}});
 shell.registerDashboard({id:'app-wide-competency',zone:'after',order:92,render:slot=>{const c=competencySummary();slot.innerHTML=`<section class="mm-integrated-card"><span class="eyebrow">Competency evidence</span><h3>Progress is more than lesson completion</h3><div class="mm-integrated-grid">${COMPETENCY_ORDER.map(k=>`<div class="mm-integrated-cell"><small>${esc(k[0].toUpperCase()+k.slice(1))}</small><b>${Number(c[k]||0)}</b></div>`).join('')}</div><p><small>Viewed and completed are activity states. Demonstrated, transferred and retained require evidence from practice.</small></p></section>`}})
}
async function processWorkspaceReport(){
 const api=window.MM_CONNECTED_PROCESS_DATA?.storage;if(!api?.listDatasets)return{schema:1,datasets:[]};const ds=await api.listDatasets();return{schema:1,generatedAt:new Date().toISOString(),scope:'device-site-workspace',rawRowsIncluded:false,datasets:ds.map(x=>({id:x.id,createdAt:x.createdAt,rowCount:x.rowCount,headers:x.headers,entities:x.entities,datasetMeta:x.datasetMeta,quality:x.quality,evidenceState:x.evidenceState,authority:x.authority}))}
}
async function exportProcessWorkspace(){const report=await processWorkspaceReport(),blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mouldmaster-process-workspace-metadata.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);return report}
async function clearProcessWorkspace(){const api=window.MM_CONNECTED_PROCESS_DATA?.storage;if(!api?.listDatasets||!api?.deleteDataset)return 0;const ds=await api.listDatasets();for(const x of ds)await api.deleteDataset(x.id);emit('process-workspace-cleared',{count:ds.length});return ds.length}
function decorateProcessPrivacy(){
 const roots=[document.querySelector('[data-pi-root]'),document.querySelector('[data-di-root]')].filter(Boolean);for(const root of roots){if(root.querySelector('[data-mm-workspace-boundary]'))continue;const box=document.createElement('section');box.dataset.mmWorkspaceBoundary='1';box.className='mm-integrated-card';box.innerHTML=`<b>Local site/process workspace</b><p>Raw source files are not uploaded. Prepared datasets can persist in this browser/device IndexedDB until you delete them. They are device/site workspace data, not learner-profile data.</p><div class="mm-integrated-actions"><button type="button" class="ghost" data-mm-process-export>Export metadata only</button><button type="button" class="ghost" data-mm-process-clear>Delete saved datasets</button></div>`;root.appendChild(box)}
}
function normalCdfApprox(z){return .5*(1+Math.sign(z)*Math.sqrt(1-Math.exp(-2*z*z/Math.PI)))}
function evidenceForSignal(s){const b=Number(s.baselineMean),c=Number(s.currentMean),z=Number(s.normalizedShift),delta=Number.isFinite(b)&&Number.isFinite(c)?c-b:null;const standardized=Number.isFinite(z)?Math.abs(z):null;return{sampleSizeBaseline:Number(s.baselineN||s.nBaseline||0)||null,sampleSizeCurrent:Number(s.currentN||s.nCurrent||0)||null,delta,effectSizeApprox:standardized,approxTwoSidedTail:standardized==null?null:Math.max(0,Math.min(1,2*(1-normalCdfApprox(standardized)))),interpretation:standardized==null?'insufficient-context':standardized>=3?'large-local-shift':standardized>=2?'moderate-local-shift':'small-or-stable',boundary:'Descriptive local evidence only. Approximate standardized shift is not causal proof, an acceptance limit or a substitute for an appropriate statistical model.'}}
function enhanceProcessStatistics(){
 const intel=window.MM_CONNECTED_PROCESS_DATA?.intelligence;if(!intel||intel.__mmUncertaintyEnhanced)return false;
 for(const name of ['compareToBaseline','compareWindows'])if(typeof intel[name]==='function'){
  const base=intel[name].bind(intel);intel[name]=async function(){const out=await base(...arguments);if(Array.isArray(out?.signals))out.signals=out.signals.map(s=>({...s,uncertainty:evidenceForSignal(s)}));out.evidenceBoundary='Interpret magnitude with sample count, missingness, temporal stability and process context. Association and external research relevance do not establish causation.';return out}
 }
 intel.__mmUncertaintyEnhanced=true;return true
}
function cohortPayload(){try{return JSON.parse(localStorage.getItem(COHORT_KEY)||'null')}catch(_){return null}}
function validateCohort(payload){
 if(!payload||typeof payload!=='object'||!Array.isArray(payload.items))throw new Error('Invalid cohort calibration payload');const text=JSON.stringify(payload);if(/learner|email|name\"|answerText|notes|timestamp|rawRows|shot/i.test(text))throw new Error('Cohort import contains prohibited identifying or raw-data fields');
 const profiles=Number(payload.anonymousProfiles||payload.profileCount||0);if(profiles<5)throw new Error('At least 5 anonymous profiles are required');for(const x of payload.items){if(!x.mechanismId||!x.stage||Number(x.attempts)<1)throw new Error('Cohort item missing aggregate fields')}return{schema:1,anonymousProfiles:profiles,items:payload.items.map(x=>({mechanismId:String(x.mechanismId),stage:String(x.stage),attempts:Number(x.attempts),successRate:Number.isFinite(Number(x.successRate))?Number(x.successRate):null,discrimination:Number.isFinite(Number(x.discrimination))?Number(x.discrimination):null,difficultyQuality:String(x.difficultyQuality||x.quality||'unknown'),calibratedChallenge:String(x.calibratedChallenge||x.challenge||'standard')})),importedAt:new Date().toISOString(),privacy:'Aggregate calibration only; no learner identifiers, answers, notes, exact event timestamps or process rows.'}
}
function importCohort(payload){const clean=validateCohort(payload);localStorage.setItem(COHORT_KEY,JSON.stringify(clean));emit('cohort-calibration-imported',{anonymousProfiles:clean.anonymousProfiles,items:clean.items.length});return clean}
function cohortCalibration(){return clone(cohortPayload())}
function assessmentAudit(){
 const exams=window.MM_DATA?.exams||{},levels={};let ok=true;for(const level of ['Beginner','Intermediate','Advanced']){const rows=Array.isArray(exams[level])?exams[level]:[],stems=rows.map(q=>String(q?.q??q?.[0]??'').toLowerCase().replace(/\W+/g,' ').trim()).filter(Boolean),unique=new Set(stems);levels[level]={items:rows.length,uniqueStems:unique.size,minimumTarget:30,ready:rows.length>=30&&unique.size===rows.length};if(!levels[level].ready)ok=false}return{ok,levels,boundary:'Formal-bank readiness requires at least 30 independently authored unique technical items per level. Runtime duplication or stem cloning is not accepted as bank expansion.'}
}
function accessibilityAudit(root=document){const issues=[];root.querySelectorAll('button,[role="button"],a[href]').forEach(el=>{const name=(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').trim();if(!name||/^action$/i.test(name))issues.push({type:'control-name',tag:el.tagName})});root.querySelectorAll('img').forEach(img=>{if(!img.hasAttribute('alt'))issues.push({type:'missing-alt',src:(img.getAttribute('src')||'').slice(0,80)});else if(img.alt===''&&!img.dataset.decorative&&!img.closest('[aria-hidden="true"]'))issues.push({type:'unmarked-empty-alt',src:(img.getAttribute('src')||'').slice(0,80)})});return{ok:issues.length===0,issues}}
function installActions(){document.addEventListener('click',e=>{const ex=e.target.closest?.('[data-mm-process-export]');if(ex){e.preventDefault();exportProcessWorkspace()}const cl=e.target.closest?.('[data-mm-process-clear]');if(cl){e.preventDefault();if(confirm('Delete all saved prepared process datasets from this device? Raw source files are not affected.'))clearProcessWorkspace().then(()=>decorateProcessPrivacy())}},true)}
function check(){
 const e=window.MM_RESEARCH_EVIDENCE;const modules={ui:window.MM_RESEARCH_EVIDENCE_UI,adapter:window.MM_RESEARCH_ADAPTER,workspace:window.MM_RESEARCH_WORKSPACE,microlearning:window.MM_RESEARCH_MICROLEARNING,adaptiveLearning:window.MM_ADAPTIVE_LEARNING,learningEffectiveness:window.MM_LEARNING_EFFECTIVENESS,specialistLearningQuality:window.MM_SPECIALIST_LEARNING_QUALITY,utilisation:window.MM_RESEARCH_UTILISATION,gaps:window.MM_RESEARCH_GAPS,freshness:window.MM_RESEARCH_CLAIM_FRESHNESS,dataContext:window.MM_RESEARCH_DATA_CONTEXT,connectedData:window.MM_CONNECTED_PROCESS_DATA};const issues=[];
 if(!e)issues.push('engine-missing');else{const s=e.sourceCoverage?.()||{};if(s.mechanisms!==12)issues.push('mechanism-count');if(s.promoted!==12)issues.push('promotion-count');if(s.primaryMeasuredLinks<24)issues.push('primary-source-links');const sample=e.retrieve?.({text:'hot runner valve gate heater duty cavity pressure',process:['injection moulding'],tooling:['hot runner'],signals:['cavity pressure']},2)||[];if(!sample.some(x=>x.id==='hot-runner-actual-behaviour'))issues.push('retrieval-smoke-check')}
 for(const [name,value] of Object.entries(modules))if(!value)issues.push(`${name}-missing`);const manifest=window.MM_CONNECTED_PROCESS_DATA?.currentManifest?.();if(manifest&&manifest.researchUtilisation?.promotedMechanisms!==12)issues.push('manifest-research-state');if(manifest&&manifest.researchUtilisation?.supportsDelayedTransferChecks!==true)issues.push('manifest-delayed-transfer-state');if(!upgradeShell())issues.push('app-shell-missing');return{version:VERSION,ok:issues.length===0,issues,coverage:e?.sourceCoverage?.()||null,assessment:assessmentAudit(),competency:competencySummary(),accessibility:accessibilityAudit(),scope:'Runtime coherence plus app-wide integration health. It validates module presence and product boundaries; it does not assert production causality, machine safety limits or formal psychometric validity.'}
}
function install(){ensureStyle();upgradeShell();bindProblemEntry();installActions();enhanceProcessStatistics();dashboardSections();markViewed();decorateProcessPrivacy();const observer=new MutationObserver(()=>{upgradeShell();dashboardSections();markViewed();decorateProcessPrivacy();enhanceProcessStatistics()});observer.observe(document.documentElement,{childList:true,subtree:true});window.MM_APP_INTEGRATION={version:VERSION,on,off,emit,getState,setState,patchState,subscribeState,registerAlias,resolveRoute,openWorkspace,competencySummary,dueReviews,openDueReview,processWorkspaceReport,exportProcessWorkspace,clearProcessWorkspace,importCohort,cohortCalibration,assessmentAudit,accessibilityAudit,scope:'One integration layer for routing, state/events, competency evidence, due reviews, local process-workspace continuity, aggregate cohort calibration and evidence-strength annotations. It does not create machine control, universal setpoints, causal proof or formal answer keys.'}}
window.MM_RESEARCH_EVIDENCE_HEALTH={version:VERSION,check};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
