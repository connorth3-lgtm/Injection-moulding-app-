/* MouldMaster learner-scoped assessment storage — 2026-09-11.1 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof localStorage==='undefined')return;
const VERSION='2026.09.11.1';
const ANALYTICS_BASE='mm_assessment_analytics_v1';
const TIMING_BASE='mm_assessment_exposure_timing_v1';
const ROTATION_BASE='mm_assessment_opening_history_v1';
const QUESTION_HISTORY_BASE='mm-assessment-question-history-v4';
const RESULT_META_BASE='mm-assessment-result-meta-v1';
const BASES=[ANALYTICS_BASE,TIMING_BASE,ROTATION_BASE,QUESTION_HISTORY_BASE,RESULT_META_BASE];
if(window.MM_ASSESSMENT_STORAGE_SCOPE?.version===VERSION)return;
const rawGet=localStorage.getItem.bind(localStorage);
const rawSet=localStorage.setItem.bind(localStorage);
const rawRemove=localStorage.removeItem.bind(localStorage);
const rawKey=localStorage.key.bind(localStorage);
let sharedMigration={status:'not-run',migrated:0,removedDuplicate:0,conflicts:0,ambiguous:0};
let sharedMigrationComplete=false;
function learnerId(){
 try{
  if(typeof db!=='undefined'&&db&&db.activeUser)return String(db.activeUser).slice(0,160);
  if(typeof user!=='undefined'&&user&&user.id)return String(user.id).slice(0,160);
 }catch(_){}
 return 'anonymous';
}
function hashScope(value){
 const s=String(value||'anonymous');let h1=0xdeadbeef^s.length,h2=0x41c6ce57^s.length;
 for(let i=0;i<s.length;i++){const ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
 h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
 return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
}
function profileIds(){try{return typeof db!=='undefined'&&db?.users&&typeof db.users==='object'&&!Array.isArray(db.users)?Object.keys(db.users).map(String).filter(Boolean):[]}catch(_){return[]}}
function rawScopedKey(base,token){return `${base}::${String(token)}`}
function sharedScope(){const s=window.MM_LEARNER_SCOPE;return s&&typeof s.tokenFor==='function'?s:null}
function migrateFallbackScopes(){
 const shared=sharedScope();if(!shared)return {status:'shared-unavailable',migrated:0,removedDuplicate:0,conflicts:0,ambiguous:0};
 const ids=[...new Set(profileIds())],byOld=new Map();
 for(const id of ids){const token=hashScope(id);if(!byOld.has(token))byOld.set(token,[]);byOld.get(token).push(id)}
 let migrated=0,removedDuplicate=0,conflicts=0,ambiguous=0;
 for(const base of BASES){
  for(const [oldToken,owners] of byOld){
   const oldKey=rawScopedKey(base,oldToken),legacy=rawGet(oldKey);if(legacy==null)continue;
   if(owners.length!==1){ambiguous++;continue}
   const target=rawScopedKey(base,shared.tokenFor(owners[0])),current=rawGet(target);
   if(current==null){rawSet(target,legacy);if(rawGet(target)===legacy){rawRemove(oldKey);migrated++}else conflicts++;continue}
   if(current===legacy){rawRemove(oldKey);removedDuplicate++;continue}
   conflicts++;
  }
 }
 return {status:conflicts||ambiguous?'partial-fail-closed':'migrated',migrated,removedDuplicate,conflicts,ambiguous}
}
function ensureSharedMigration(){
 if(sharedMigrationComplete||!sharedScope())return sharedMigration;
 sharedMigration=migrateFallbackScopes();sharedMigrationComplete=true;return sharedMigration
}
function scopeToken(raw=learnerId()){
 const shared=sharedScope();if(shared){ensureSharedMigration();return shared.tokenFor(raw)}
 return hashScope(raw)
}
function scopedKey(base,raw=learnerId()){
 const k=String(base);return BASES.includes(k)?rawScopedKey(k,scopeToken(raw)):k
}
function rawKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=rawKey(i);if(k!=null)out.push(k)}return out}
function assessmentKey(k){return BASES.some(base=>k===base||k.startsWith(base+'::'))}
function getItem(base){return rawGet(scopedKey(base))}
function setItem(base,value){rawSet(scopedKey(base),String(value));return true}
function removeItem(base){rawRemove(scopedKey(base));return true}
function read(base,fallback=null){try{const raw=getItem(base);if(raw==null)return fallback;const value=JSON.parse(raw);return value==null?fallback:value}catch(_){return fallback}}
function write(base,value){try{return setItem(base,JSON.stringify(value))}catch(_){return false}}
function clearAll(){for(const k of rawKeys())if(assessmentKey(k))rawRemove(k)}
function cancelInMemoryAttempt(){
 try{if(typeof activeExam!=='undefined')activeExam=null}catch(_){}
 try{window.activeExam=null}catch(_){}
}
function migrateLegacy(){
 let migrated=0,removedDuplicate=0,conflicts=0,ambiguous=0;
 const ids=[...new Set(profileIds())],active=learnerId(),sole=ids.length===1?ids[0]:null;
 for(const base of BASES){
  const old=rawGet(base);if(old==null)continue;
  if(!sole||active!==sole){ambiguous++;continue}
  const target=scopedKey(base,sole),current=rawGet(target);
  if(current==null){
   rawSet(target,old);
   if(rawGet(target)===old){rawRemove(base);migrated++}else conflicts++;
   continue
  }
  if(current===old){rawRemove(base);removedDuplicate++;continue}
  conflicts++;
 }
 return {status:conflicts||ambiguous?'partial-fail-closed':'migrated',migrated,removedDuplicate,conflicts,ambiguous};
}
function wrapLearnerChange(name){
 const base=typeof window[name]==='function'?window[name]:null;if(!base||base.__mmAssessmentScopeWrapped)return;
 const wrapped=function(){const before=learnerId();try{return base.apply(this,arguments)}finally{if(learnerId()!==before)cancelInMemoryAttempt()}};
 Object.defineProperty(wrapped,'__mmAssessmentScopeWrapped',{value:true});window[name]=wrapped;
}
const legacy=migrateLegacy();
wrapLearnerChange('switchUser');
wrapLearnerChange('createLearner');
const baseReset=typeof window.resetData==='function'?window.resetData:null;
if(baseReset&&!baseReset.__mmAssessmentScopeWrapped){
 const wrappedReset=function(){
  let before=null;try{before=rawGet('mouldmasterProDB')}catch(_){}
  const r=baseReset.apply(this,arguments);
  setTimeout(()=>{try{const after=rawGet('mouldmasterProDB');if(after!==before){cancelInMemoryAttempt();clearAll()}}catch(_){}},0);
  return r;
 };
 Object.defineProperty(wrappedReset,'__mmAssessmentScopeWrapped',{value:true});window.resetData=wrappedReset;
}
window.addEventListener?.('mm:domains-ready',()=>ensureSharedMigration(),{once:true});
window.MM_ASSESSMENT_STORAGE_SCOPE={
 version:VERSION,
 scopeToken,
 key:scopedKey,
 getItem,
 setItem,
 removeItem,
 read,
 write,
 analyticsKey:()=>scopedKey(ANALYTICS_BASE),
 timingKey:()=>scopedKey(TIMING_BASE),
 rotationKey:()=>scopedKey(ROTATION_BASE),
 questionHistoryKey:()=>scopedKey(QUESTION_HISTORY_BASE),
 resultMetaKey:()=>scopedKey(RESULT_META_BASE),
 clearAll,
 cancelInMemoryAttempt,
 migrateFallbackScopes:ensureSharedMigration,
 legacyMigration:{...legacy},
 get sharedMigration(){return {...sharedMigration}},
 scopeProvider:()=>sharedScope()?'MM_LEARNER_SCOPE':'compatibility-hash',
 learnerScoped:true,
 prototypeInterception:false,
 boundary:'Assessment persistence is explicit: callers use this API for learner-scoped analytics and assessment metadata. Native browser storage methods are never replaced. Single-owner legacy values are copied and verified before removal; ambiguous or conflicting legacy data remains untouched and is never inherited automatically.'
};
})();
