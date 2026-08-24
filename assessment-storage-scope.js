/* MouldMaster learner-scoped assessment storage — 2026-08-24.4 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof Storage==='undefined'||typeof localStorage==='undefined')return;
const VERSION='2026.08.24.4';
const ANALYTICS_BASE='mm_assessment_analytics_v1';
const TIMING_BASE='mm_assessment_exposure_timing_v1';
const BASES=[ANALYTICS_BASE,TIMING_BASE];
const P=Storage.prototype;
if(P.__mmAssessmentStorageScopeInstalled)return;
const rawGet=P.getItem,rawSet=P.setItem,rawRemove=P.removeItem,rawKey=P.key;
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
function scopeToken(){return hashScope(learnerId())}
function scopedKey(key){const k=String(key);return BASES.includes(k)?`${k}::${scopeToken()}`:k}
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
Object.defineProperty(P,'getItem',{configurable:true,writable:true,value:function(key){return rawGet.call(this,this===localStorage?scopedKey(key):key)}});
Object.defineProperty(P,'setItem',{configurable:true,writable:true,value:function(key,value){return rawSet.call(this,this===localStorage?scopedKey(key):key,value)}});
Object.defineProperty(P,'removeItem',{configurable:true,writable:true,value:function(key){return rawRemove.call(this,this===localStorage?scopedKey(key):key)}});
Object.defineProperty(P,'__mmAssessmentStorageScopeInstalled',{configurable:false,writable:false,value:true});
const legacy=migrateLegacy();
const baseSwitch=typeof window.switchUser==='function'?window.switchUser:null;
if(baseSwitch)window.switchUser=function(){cancelInMemoryAttempt();return baseSwitch.apply(this,arguments)};
const baseReset=typeof window.resetData==='function'?window.resetData:null;
if(baseReset)window.resetData=function(){
 let before=null;try{before=rawGet.call(localStorage,'mouldmasterProDB')}catch(_){}
 cancelInMemoryAttempt();const r=baseReset.apply(this,arguments);
 setTimeout(()=>{try{const after=rawGet.call(localStorage,'mouldmasterProDB');if(after!==before)clearAll()}catch(_){}},0);
 return r;
};
window.MM_ASSESSMENT_STORAGE_SCOPE={version:VERSION,scopeToken,analyticsKey:()=>scopedKey(ANALYTICS_BASE),timingKey:()=>scopedKey(TIMING_BASE),clearAll,cancelInMemoryAttempt,legacyMigration:{...legacy},learnerScoped:true};
})();
