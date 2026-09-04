/* MouldMaster learner-scoped assessment storage — 2026-09-05.1 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof Storage==='undefined'||typeof localStorage==='undefined')return;
const VERSION='2026.09.05.1';
const ANALYTICS_BASE='mm_assessment_analytics_v1';
const TIMING_BASE='mm_assessment_exposure_timing_v1';
const ROTATION_BASE='mm_assessment_opening_history_v1';
const BASES=[ANALYTICS_BASE,TIMING_BASE,ROTATION_BASE];
const P=Storage.prototype;
if(P.__mmAssessmentStorageScopeInstalled)return;
const rawGet=P.getItem,rawSet=P.setItem,rawRemove=P.removeItem,rawKey=P.key;
let sharedMigration={status:'not-run',migrated:0,removedDuplicate:0,conflicts:0,ambiguous:0};
let sharedMigrationComplete=false;
function learnerId(){
 try{
  if(typeof db!=='undefined'&&db&&db.activeUser)return String(db.activeUser).slice(0,160);
  if(typeof user!=='undefined'&&user&&user.id)return String(user.id).slice(0,160);
 }catch(_){}
 return 'anonymous';
}
// Compatibility-only hash used for assessment buckets created before the shared
// MM_LEARNER_SCOPE service became canonical. New reads/writes use tokenFor().
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
   const oldKey=rawScopedKey(base,oldToken),legacy=rawGet.call(localStorage,oldKey);if(legacy==null)continue;
   if(owners.length!==1){ambiguous++;continue}
   const target=rawScopedKey(base,shared.tokenFor(owners[0])),current=rawGet.call(localStorage,target);
   if(current==null){rawSet.call(localStorage,target,legacy);if(rawGet.call(localStorage,target)===legacy){rawRemove.call(localStorage,oldKey);migrated++}else conflicts++;continue}
   if(current===legacy){rawRemove.call(localStorage,oldKey);removedDuplicate++;continue}
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
function scopedKey(key){const k=String(key);return BASES.includes(k)?rawScopedKey(k,scopeToken()):k}
function rawKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=rawKey.call(localStorage,i);if(k!=null)out.push(k)}return out}
function assessmentKey(k){return BASES.some(base=>k===base||k.startsWith(base+'::'))}
function clearAll(){for(const k of rawKeys())if(assessmentKey(k))rawRemove.call(localStorage,k)}
function cancelInMemoryAttempt(){
 try{if(typeof activeExam!=='undefined')activeExam=null}catch(_){}
 try{window.activeExam=null}catch(_){}
}
function migrateLegacy(){
 let migrated=0,discarded=0,userCount=0;
 try{userCount=(typeof db!=='undefined'&&db&&db.users)?Object.keys(db.users).length:0}catch(_){}
 for(const base of BASES){
  const old=rawGet.call(localStorage,base);if(old==null)continue;
  if(userCount===1){const target=scopedKey(base);if(rawGet.call(localStorage,target)==null){rawSet.call(localStorage,target,old);migrated++}}
  else discarded++;
  rawRemove.call(localStorage,base);
 }
 return {migrated,discarded};
}
function wrapLearnerChange(name){
 const base=typeof window[name]==='function'?window[name]:null;if(!base)return;
 window[name]=function(){const before=learnerId();try{return base.apply(this,arguments)}finally{if(learnerId()!==before)cancelInMemoryAttempt()}};
}
Object.defineProperty(P,'getItem',{configurable:true,writable:true,value:function(key){return rawGet.call(this,this===localStorage?scopedKey(key):key)}});
Object.defineProperty(P,'setItem',{configurable:true,writable:true,value:function(key,value){return rawSet.call(this,this===localStorage?scopedKey(key):key,value)}});
Object.defineProperty(P,'removeItem',{configurable:true,writable:true,value:function(key){return rawRemove.call(this,this===localStorage?scopedKey(key):key)}});
Object.defineProperty(P,'__mmAssessmentStorageScopeInstalled',{configurable:false,writable:false,value:true});
const legacy=migrateLegacy();
wrapLearnerChange('switchUser');
wrapLearnerChange('createLearner');
const baseReset=typeof window.resetData==='function'?window.resetData:null;
if(baseReset)window.resetData=function(){
 let before=null;try{before=rawGet.call(localStorage,'mouldmasterProDB')}catch(_){}
 const r=baseReset.apply(this,arguments);
 setTimeout(()=>{try{const after=rawGet.call(localStorage,'mouldmasterProDB');if(after!==before){cancelInMemoryAttempt();clearAll()}}catch(_){}},0);
 return r;
};
window.addEventListener?.('mm:domains-ready',()=>ensureSharedMigration(),{once:true});
window.MM_ASSESSMENT_STORAGE_SCOPE={version:VERSION,scopeToken,analyticsKey:()=>scopedKey(ANALYTICS_BASE),timingKey:()=>scopedKey(TIMING_BASE),rotationKey:()=>scopedKey(ROTATION_BASE),clearAll,cancelInMemoryAttempt,migrateFallbackScopes:ensureSharedMigration,legacyMigration:{...legacy},get sharedMigration(){return {...sharedMigration}},scopeProvider:()=>sharedScope()?'MM_LEARNER_SCOPE':'compatibility-hash',learnerScoped:true,boundary:'Assessment analytics, exposure timing and opening-history stores use MM_LEARNER_SCOPE 128-bit tokens once the shared scope service is available. The previous assessment hash remains only for fail-closed migration; ambiguous or conflicting legacy buckets are never reassigned automatically.'};
})();
