/* MouldMaster training data/assessment bridge — 2026.09.05.2 */
(function(){
'use strict';
const REVIEW_KEY='mm_spaced_review_v2', LEGACY_REVIEW='mm_spaced_review_v1', SIGN_KEY='mm_practical_signoff_v1';
const ASSESSMENT_ANALYTICS_PREFIXES=['mm_assessment_analytics_v1','mm_assessment_exposure_timing_v1','mm_assessment_opening_history_v1'];
const LEARNING_ANALYTICS_PREFIX='mm_learning_analytics_v1::';
const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED';
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
function clearTrainingExtrasStores(){return clearMatchingStores('training extras',k=>k===REVIEW_KEY||k===LEGACY_REVIEW||k===SIGN_KEY)}
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

/* One export contains the strictly validated core DB plus training extras. Assessment and Learning Insights analytics are deliberately excluded from the progress backup. */
window.exportData=function(){try{const p=JSON.parse(JSON.stringify(db));p.backupFormat='mouldmaster-backup-v2';p.trainingExtras={version:2,spacedReview:cleanReview(read(REVIEW_KEY,{items:{}})),practicalSignoff:cleanSign(read(SIGN_KEY,{}))};const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);window.toast?.('Backup exported with review and sign-off data')}catch(e){alert('Backup could not be created on this device.')}};

/* Import validates and stages core/training writes first. Before the imported profile set becomes active, every analytics store must be deleted and re-enumerated successfully. If cleanup cannot be verified, staged core/training writes are rolled back and the imported learner registry is never activated. */
window.importData=function(file){
 if(!file)return;
 if(file.size>10*1024*1024){alert('That backup is too large to import safely. No existing data was changed.');return}
 const r=new FileReader();
 r.onload=()=>{
  let committed=false;
  try{
   const x=JSON.parse(r.result);
   if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string'||!x.users[x.activeUser])throw new Error('Invalid backup structure');
   if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');
   const users={};
   for(const [id,u] of Object.entries(x.users).slice(0,500)){
    const sid=String(id).slice(0,160),clean=normaliseImportedUser(u,id);
    if(!sid||users[sid])throw new Error('Invalid or duplicate learner identifier');
    clean.id=sid;
    clean.certificates=[];clean.certificateMeta={};clean.examPassStatus={};
    users[sid]=clean;
   }
   const active=String(x.activeUser).slice(0,160);
   if(!users[active])throw new Error('Missing active learner');
   const extras=obj(x.trainingExtras)?x.trainingExtras:{};
   const cleanR=cleanReview(extras.spacedReview||{items:{}}),cleanS=cleanSign(extras.practicalSignoff||{});
   const proposed={activeUser:active,users};
   const writes={mouldmasterProDB:JSON.stringify(proposed),[REVIEW_KEY]:JSON.stringify(cleanR),[SIGN_KEY]:JSON.stringify(cleanS)};
   const keys=[...Object.keys(writes),LEGACY_REVIEW],before={};
   keys.forEach(k=>before[k]=localStorage.getItem(k));
   try{
    for(const [k,v] of Object.entries(writes))localStorage.setItem(k,v);
    localStorage.removeItem(LEGACY_REVIEW);
    clearAllAnalyticsStores();
   }catch(storageError){
    const rolledBack=restoreSnapshot(before);
    if(storageError?.code===ANALYTICS_CLEANUP_CODE){storageError.importRollbackVerified=rolledBack;throw storageError}
    throw storageError;
   }
   db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();
   try{updateGlobalProgress();switchView('profile')}catch(uiError){console.warn('[MouldMaster] imported data saved; view refresh failed:',uiError)}
   window.toast?.('Progress imported. Certificates must be re-earned; local assessment and Learning Insights analytics were reset and verified.');
  }catch(e){
   if(e?.code===ANALYTICS_CLEANUP_CODE){alert(cleanupFailureMessage('Import',e.importRollbackVerified!==false));return}
   if(committed)alert('Progress was imported, but the screen could not refresh. Reopen MouldMaster.');
   else alert('That file is not a valid MouldMaster backup. No existing data was changed.');
  }
 };
 r.readAsText(file);
};

/* Confirmed factory reset is fail-closed: old analytics/training extras must be removed and verified before the fresh default learner registry is persisted or activated. */
const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){
 if(!confirm('Reset all local MouldMaster users and progress?'))return;
 try{clearAllAnalyticsStores();clearTrainingExtrasStores()}
 catch(e){console.error('[MouldMaster] factory reset cleanup blocked:',e);alert(cleanupFailureMessage('Factory reset',false));return}
 const proposedReset=JSON.parse(JSON.stringify(defaultDB));
 const resetUser=proposedReset.users[proposedReset.activeUser];if(resetUser)resetUser.lastSeen=new Date().toISOString();
 try{localStorage.setItem('mouldmasterProDB',JSON.stringify(proposedReset))}catch(e){alert('Factory reset could not save the clean learner state. Analytics were cleared, but existing progress was not replaced. Reopen MouldMaster and try again.');return}
 const beforeDb=db;db=proposedReset;user=db.users[db.activeUser];if(db!==beforeDb)cancelActiveExam();
 try{updateGlobalProgress();renderProfile()}catch(uiError){console.warn('[MouldMaster] reset saved; view refresh failed:',uiError)}
 window.toast?.('Data reset. Local assessment and Learning Insights analytics were cleared and verified.');
};

/* One-time migration: legacy text-keyed review records are intentionally not guessed into stable IDs. */
try{if(!localStorage.getItem(REVIEW_KEY)&&localStorage.getItem(LEGACY_REVIEW))localStorage.setItem(REVIEW_KEY,JSON.stringify({items:{}}))}catch(_){}
window.MM_TRAINING_DATA_BRIDGE={version:'2026.09.05.2',cleanupFailureCode:ANALYTICS_CLEANUP_CODE,clearAssessmentAnalyticsStores,clearLearningAnalyticsStores,clearAllAnalyticsStores,clearTrainingExtrasStores,cancelActiveExam};
})();