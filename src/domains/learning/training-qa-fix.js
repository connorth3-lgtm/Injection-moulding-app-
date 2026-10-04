/* MouldMaster training data/assessment bridge — 2026.10.04.1 */
(function(){
'use strict';
const REVIEW_KEY='mm_spaced_review_v2', LEGACY_REVIEW='mm_spaced_review_v1', SIGN_KEY='mm_practical_signoff_v1';
const ASSESSMENT_ANALYTICS_PREFIXES=['mm_assessment_analytics_v1','mm_assessment_exposure_timing_v1','mm_assessment_opening_history_v1','mm-assessment-question-history-v4','mm-assessment-result-meta-v1'];
const LEARNING_ANALYTICS_PREFIX='mm_learning_analytics_v1::';
const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED';
const LEARNER_ID_RE=/^[A-Za-z0-9][A-Za-z0-9._:@+-]{0,159}$/;
function canonicalLearnerId(v){const s=String(v??'');if(!LEARNER_ID_RE.test(s))throw new Error('Invalid learner identifier');return s}
function hasOwnLearner(users,id){return !!users&&Object.prototype.hasOwnProperty.call(users,id)}
function cleanupError(area,detail){const e=new Error(`Local ${area} cleanup could not be verified${detail?`: ${detail}`:''}`);e.code=ANALYTICS_CLEANUP_CODE;e.area=area;return e}
function matchingKeys(predicate,area){
 try{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&predicate(k))out.push(k)}return [...new Set(out)]}
 catch(e){throw cleanupError(area,'storage index unavailable')}
}
function clearMatchingStores(area,predicate){
 const targets=matchingKeys(predicate,area);
 for(const k of targets){try{localStorage.removeItem(k)}catch(e){throw cleanupError(area,`delete failed for ${k}`)}}
 const remaining=matchingKeys(predicate,area);
 if(remaining.length)throw cleanupError(area,`remaining key(s): ${remaining.slice(0,3).join(', ')}`);
 return Object.freeze({area,removed:targets.length,verified:true})
}
function clearAssessmentAnalyticsStores(){return clearMatchingStores('assessment analytics',k=>ASSESSMENT_ANALYTICS_PREFIXES.some(p=>k===p||k.startsWith(p+'::')))}
function clearLearningAnalyticsStores(){return clearMatchingStores('Learning Insights analytics',k=>k.startsWith(LEARNING_ANALYTICS_PREFIX))}
function clearAllAnalyticsStores(){
 const results={},errors=[];
 for(const [name,fn] of [['assessment',clearAssessmentAnalyticsStores],['learning',clearLearningAnalyticsStores]]){try{results[name]=fn()}catch(e){errors.push(e)}}
 if(errors.length){const e=cleanupError('analytics',errors.map(x=>x.message).join(' | '));e.causes=errors;throw e}
 return Object.freeze({assessment:results.assessment.removed,learning:results.learning.removed,total:results.assessment.removed+results.learning.removed,verified:true})
}
function runtimeLearnerToken(raw){
 const id=String(raw||'anonymous'),scope=window.MM_LEARNER_SCOPE;
 if(scope&&typeof scope.legacyTokenFor==='function')return scope.legacyTokenFor(id);
 let h=2166136261;for(const ch of id){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function trainingKey(base,learnerId){
 const id=learnerId==null?(typeof db!=='undefined'?db?.activeUser:null):learnerId;
 return `${base}::${runtimeLearnerToken(String(id||'anonymous'))}`
}
function readTraining(base,d,learnerId){try{const x=JSON.parse(localStorage.getItem(trainingKey(base,learnerId))||'');return obj(x)?x:d}catch(_){return d}}
function trainingStorePredicate(k){
 const prefixes=[REVIEW_KEY+'::',SIGN_KEY+'::'],globals=new Set([REVIEW_KEY,LEGACY_REVIEW,SIGN_KEY]);
 return globals.has(k)||prefixes.some(p=>k.startsWith(p))
}
function clearTrainingExtrasStores(){return clearMatchingStores('training extras',trainingStorePredicate)}
function uniqueKeys(values){return [...new Set(values.filter(Boolean))]}
function learnerAssessmentKeys(learnerId){
 const api=window.MM_ASSESSMENT_STORAGE_SCOPE;
 if(!api||typeof api.keysForLearner!=='function')throw cleanupError('assessment analytics','learner-scoped storage API unavailable');
 return api.keysForLearner(learnerId)
}
function learnerLearningAnalyticsKeys(learnerId){
 const scope=window.MM_LEARNER_SCOPE;
 if(!scope||typeof scope.tokenFor!=='function'||typeof scope.storageKey!=='function')throw cleanupError('Learning Insights analytics','learner scope unavailable');
 const keys=[scope.storageKey(LEARNING_ANALYTICS_PREFIX,scope.tokenFor(learnerId))],plan=scope.migrationPlan?.(learnerId);
 if(plan?.uniqueOwner&&plan.legacyToken)keys.push(scope.storageKey(LEARNING_ANALYTICS_PREFIX,plan.legacyToken));
 return uniqueKeys(keys)
}
function learnerTrainingKeys(learnerId){
 const keys=[trainingKey(REVIEW_KEY,learnerId),trainingKey(SIGN_KEY,learnerId)],scope=window.MM_LEARNER_SCOPE;
 if(scope&&typeof scope.tokenFor==='function'){
  const strong=scope.tokenFor(learnerId);keys.push(`${REVIEW_KEY}::${strong}`,`${SIGN_KEY}::${strong}`)
 }
 return uniqueKeys(keys)
}
function learnerOwnedKeys(learnerId){return uniqueKeys([...learnerAssessmentKeys(learnerId),...learnerLearningAnalyticsKeys(learnerId),...learnerTrainingKeys(learnerId)])}
function snapshotKeys(keys){const out={};for(const k of uniqueKeys(keys))out[k]=localStorage.getItem(k);return out}
function clearExactKeys(area,keys){
 const targets=uniqueKeys(keys);for(const k of targets){try{localStorage.removeItem(k)}catch(_){throw cleanupError(area,`delete failed for ${k}`)}}
 const remaining=targets.filter(k=>{try{return localStorage.getItem(k)!=null}catch(_){return true}});
 if(remaining.length)throw cleanupError(area,`remaining key(s): ${remaining.slice(0,3).join(', ')}`);
 return Object.freeze({area,removed:targets.length,verified:true})
}
function clearLearnerAnalyticsStores(learnerId){
 const assessment=clearExactKeys('assessment analytics',learnerAssessmentKeys(learnerId));
 const learning=clearExactKeys('Learning Insights analytics',learnerLearningAnalyticsKeys(learnerId));
 return Object.freeze({assessment:assessment.removed,learning:learning.removed,total:assessment.removed+learning.removed,verified:true})
}
function clearLearnerTrainingExtras(learnerId){return clearExactKeys('training extras',learnerTrainingKeys(learnerId))}
function cancelActiveExam(){
 try{if(typeof activeExam!=='undefined')activeExam=null}catch(_){}
 try{window.activeExam=null}catch(_){}
}

function mirror(){try{if(typeof activeExam==='undefined'||!activeExam)return;(activeExam.questions||[]).forEach(q=>{if(!q||typeof q!=='object')return;if(q.why==null)q.why=q.explanation;if(q.source==null)q.source=q.reference;if(q.url==null)q.url=q.sourceUrl;if(q.feedback==null)q.feedback=q.optionFeedback});window.activeExam=activeExam}catch(e){console.warn('[MouldMaster] exam bridge:',e)}}
const baseStart=window.startExam;if(typeof baseStart==='function')window.startExam=function(){const r=baseStart.apply(this,arguments);mirror();setTimeout(mirror,0);return r};

const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), clamp=(n,a,b,d=0)=>Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d;
function cleanReview(v){const out={items:{}};if(!obj(v)||!obj(v.items))return out;for(const [id,x] of Object.entries(v.items).slice(0,1000)){if(!obj(x))continue;const sid=String(id).slice(0,220);if(!/^(tech|reg|legacy):/.test(sid))continue;out.items[sid]={id:sid,stage:Math.floor(clamp(x.stage,0,5)),due:clamp(x.due,0,4102444800000,Date.now()),wrong:Math.floor(clamp(x.wrong,0,100000)),right:Math.floor(clamp(x.right,0,100000)),last:clamp(x.last,0,4102444800000),confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'medium'}}return out}
function cleanSign(v){const o={checks:{},supervisor:'',date:'',notes:''};if(!obj(v))return o;if(obj(v.checks))for(const [k,b] of Object.entries(v.checks).slice(0,50))o.checks[String(k).slice(0,20)]=b===true;o.supervisor=String(v.supervisor||'').slice(0,160);o.date=String(v.date||'').slice(0,20);o.notes=String(v.notes||'').slice(0,10000);return o}
function read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'');return obj(x)?x:d}catch(_){return d}}
function restoreSnapshot(before){let failed=false;for(const [k,v] of Object.entries(before)){try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(_){failed=true}}return !failed}
function cleanupFailureMessage(action,rolledBack=true){return `${action} was not completed because local analytics/training cleanup could not be fully verified.${rolledBack?' Existing learner progress was kept.':''} Some old analytics may already have been removed. Clear this app/site data before handing the same browser profile to another learner if the warning persists.`}

function buildTrainingExtras(users=(typeof db!=='undefined'?db?.users:null)){
 if(!obj(users))throw new Error('Learner registry unavailable for backup');
 const learners={};
 for(const id of Object.keys(users)){
  const sid=canonicalLearnerId(id);
  learners[sid]={spacedReview:cleanReview(readTraining(REVIEW_KEY,{items:{}},sid)),practicalSignoff:cleanSign(readTraining(SIGN_KEY,{},sid))}
 }
 return {version:4,scope:'learner-registry',learners}
}
function trainingExtrasForImport(extras,users,active){
 const out=new Map(),ids=Object.keys(users).map(canonicalLearnerId);
 if(!obj(extras)||!Object.keys(extras).length||extras.version===2)return out;
 if(extras.version===3){
  if(extras.scope!=='active-learner'||canonicalLearnerId(extras.learnerId)!==active)throw new Error('Training extras learner scope mismatch');
  out.set(active,{spacedReview:cleanReview(extras.spacedReview||{items:{}}),practicalSignoff:cleanSign(extras.practicalSignoff||{})});
  return out
 }
 if(extras.version!==4||extras.scope!=='learner-registry'||!obj(extras.learners))throw new Error('Unsupported training extras format');
 const extraIds=Object.keys(extras.learners).map(canonicalLearnerId).sort(),wanted=[...ids].sort();
 if(extraIds.length!==wanted.length||extraIds.some((id,index)=>id!==wanted[index]))throw new Error('Training extras registry does not match learner registry');
 for(const id of ids){
  const row=extras.learners[id];if(!obj(row))throw new Error(`Training extras missing learner ${id}`);
  out.set(id,{spacedReview:cleanReview(row.spacedReview||{items:{}}),practicalSignoff:cleanSign(row.practicalSignoff||{})})
 }
 return out
}
window.exportData=function(){try{
 const p=JSON.parse(JSON.stringify(db));p.backupFormat='mouldmaster-backup-v2';p.trainingExtras=buildTrainingExtras(p.users);
 const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
 window.toast?.('Backup exported with learner-scoped review and sign-off data')
}catch(e){console.error('[MouldMaster] backup export failed:',e);alert('Backup could not be created on this device.')}};

window.importData=function(file){
 if(!file)return;
 if(file.size>10*1024*1024){alert('That backup is too large to import safely. No existing data was changed.');return}
 const r=new FileReader();
 r.onload=()=>{
  let committed=false;
  try{
   const x=JSON.parse(r.result);
   if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string'||!hasOwnLearner(x.users,x.activeUser))throw new Error('Invalid backup structure');
   if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');
   const entries=Object.entries(x.users);
   if(!entries.length||entries.length>500)throw new Error('Invalid learner count in backup');
   const users={};
   for(const [id,u] of entries){
    const sid=canonicalLearnerId(id),clean=normaliseImportedUser(u,sid);
    if(hasOwnLearner(users,sid))throw new Error('Invalid or duplicate learner identifier');
    if(u?.id!=null&&canonicalLearnerId(u.id)!==sid)throw new Error('Learner identifier mismatch');
    clean.id=sid;clean.certificates=[];clean.certificateMeta={};clean.examPassStatus={};users[sid]=clean
   }
   const active=canonicalLearnerId(x.activeUser);if(!hasOwnLearner(users,active))throw new Error('Missing active learner');
   const extras=trainingExtrasForImport(x.trainingExtras,users,active),proposed={activeUser:active,users};
   const existingCount=obj(db?.users)?Object.keys(db.users).length:0;
   if(typeof confirm==='function'&&!confirm(`Import this backup and replace all ${existingCount} local learner profile${existingCount===1?'':'s'} with the ${entries.length} profile${entries.length===1?'':'s'} in the backup? Existing local assessment and Learning Insights analytics will be cleared. Saved process-data evidence is managed separately.`))return;
   const trainingWrites={};
   for(const [id,row] of extras){
    trainingWrites[trainingKey(REVIEW_KEY,id)]=JSON.stringify(row.spacedReview);
    trainingWrites[trainingKey(SIGN_KEY,id)]=JSON.stringify(row.practicalSignoff)
   }
   const existingTraining=matchingKeys(trainingStorePredicate,'training extras');
   const before=snapshotKeys(['mouldmasterProDB',...existingTraining,...Object.keys(trainingWrites)]);
   try{
    clearTrainingExtrasStores();
    clearAllAnalyticsStores();
    for(const [k,v] of Object.entries(trainingWrites))localStorage.setItem(k,v);
    const serialized=JSON.stringify(proposed);localStorage.setItem('mouldmasterProDB',serialized);
    if(localStorage.getItem('mouldmasterProDB')!==serialized)throw new Error('Learner registry write could not be verified')
   }catch(storageError){
    const rolledBack=restoreSnapshot(before);
    if(storageError?.code===ANALYTICS_CLEANUP_CODE){storageError.importRollbackVerified=rolledBack;throw storageError}
    if(!rolledBack)storageError.importRollbackVerified=false;
    throw storageError
   }
   db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();
   try{updateGlobalProgress();switchView('profile')}catch(uiError){console.warn('[MouldMaster] imported data saved; view refresh failed:',uiError)}
   window.toast?.('Progress imported. Learner-scoped review/sign-off data were restored. Certificates must be re-earned; local analytics were reset.')
  }catch(e){
   if(e?.code===ANALYTICS_CLEANUP_CODE){alert(cleanupFailureMessage('Import',e.importRollbackVerified!==false));return}
   if(committed)alert('Progress was imported, but the screen could not refresh. Reopen MouldMaster.');
   else if(e?.importRollbackVerified===false)alert('Import failed and local rollback could not be fully verified. Reopen MouldMaster and inspect local learner data before continuing.');
   else alert('That file is not a valid MouldMaster backup. No existing data was changed.')
  }
 };
 r.onerror=()=>alert('That backup could not be read. No existing data was changed.');
 r.readAsText(file)
};

function labelLearnerReset(){if(typeof document==='undefined')return;document.querySelectorAll?.('[data-mm-onclick="resetData()"]').forEach?.(button=>{if(String(button.textContent||'').trim()==='Reset all local data')button.textContent='Reset learner data'})}
const baseRenderProfile=window.renderProfile;if(typeof baseRenderProfile==='function')window.renderProfile=function(){const result=baseRenderProfile.apply(this,arguments);labelLearnerReset();return result};
function cleanResetLearner(prior,id){
 const template=JSON.parse(JSON.stringify(defaultDB?.users?.[defaultDB.activeUser]||{})),clean={...template,id,name:String(prior?.name||'Learner'),role:prior?.role==='instructor'?'instructor':'learner'};
 for(const key of ['region','experience','goal','dailyMinutes','onboardingDone'])if(prior&&Object.prototype.hasOwnProperty.call(prior,key))clean[key]=prior[key];
 clean.completed=[];clean.bookmarks=[];clean.notes={};clean.examScores={};clean.examPassStatus={};clean.certificates=[];clean.certificateMeta={};clean.currentLesson=1;clean.lastSeen=new Date().toISOString();
 if(obj(prior?.fun))clean.fun={sound:prior.fun.sound===true,celebrations:prior.fun.celebrations!==false};
 return clean
}
const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){
 let active;try{active=canonicalLearnerId(db?.activeUser)}catch(_){alert('Learner reset is unavailable because the active learner identity is invalid.');return}
 const prior=db?.users?.[active];if(!prior){alert('Learner reset is unavailable because the active learner profile could not be found.');return}
 if(!confirm(`Reset learning data for "${String(prior.name||active)}" only? Other local learner profiles and saved process-data evidence will be kept. This learner's progress, notes, certificates, analytics and review/sign-off state will be cleared.`))return;
 let owned;try{owned=learnerOwnedKeys(active)}catch(e){console.error('[MouldMaster] learner reset scope unavailable:',e);alert(cleanupFailureMessage('Learner reset',true));return}
 const before=snapshotKeys(['mouldmasterProDB',...owned]),proposed=JSON.parse(JSON.stringify(db));proposed.users[active]=cleanResetLearner(prior,active);proposed.activeUser=active;
 try{
  clearLearnerAnalyticsStores(active);clearLearnerTrainingExtras(active);
  const serialized=JSON.stringify(proposed);localStorage.setItem('mouldmasterProDB',serialized);
  if(localStorage.getItem('mouldmasterProDB')!==serialized)throw new Error('Learner registry write could not be verified')
 }catch(e){
  const rolledBack=restoreSnapshot(before);console.error('[MouldMaster] learner reset blocked:',e);
  alert(rolledBack?'Learner reset was not completed. Existing learner progress and scoped training state were restored.':'Learner reset failed and rollback could not be fully verified. Reopen MouldMaster and inspect local learner data before continuing.');
  return
 }
 const beforeDb=db;db=proposed;user=db.users[active];if(db!==beforeDb)cancelActiveExam();
 try{updateGlobalProgress();renderProfile()}catch(uiError){console.warn('[MouldMaster] learner reset saved; view refresh failed:',uiError)}
 window.toast?.('This learner was reset. Other local learner profiles and saved process-data evidence were kept.');
 labelLearnerReset()
};
labelLearnerReset();

// Historical device-global review/sign-off ownership is ambiguous. Never adopt it into a learner scope.
window.MM_TRAINING_DATA_BRIDGE={version:'2026.10.04.1',cleanupFailureCode:ANALYTICS_CLEANUP_CODE,canonicalLearnerId,buildTrainingExtras,trainingExtrasForImport,learnerOwnedKeys,clearLearnerAnalyticsStores,clearLearnerTrainingExtras,clearAssessmentAnalyticsStores,clearLearningAnalyticsStores,clearAllAnalyticsStores,clearTrainingExtrasStores,cancelActiveExam};
})();
