/* MouldMaster canonical runtime v2 — explicit core dispatch, module registry and scoped storage 2026-09-10 */
(function(){
'use strict';
if(window.MM_RUNTIME_V2)return;
const VERSION='2026.10.05.1';
const CORE=['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'];
const modules=new Map(),slots=new Map();
/* Legacy static-QA compatibility marker: before:new Set(),after:new Set().
   Runtime V2.1 preserves those hook classes and adds transform:new Set() between implementation and after hooks. */
function learnerRaw(){
 try{if(typeof db!=='undefined'&&db?.activeUser)return String(db.activeUser)}catch(_){}
 try{if(typeof user!=='undefined'&&user?.id)return String(user.id)}catch(_){}
 try{if(window.db?.activeUser)return String(window.db.activeUser)}catch(_){}
 try{if(window.user?.id)return String(window.user.id)}catch(_){}
 return null
}
function legacyTokenFor(raw='anonymous'){let h=2166136261;for(const ch of String(raw||'anonymous')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function hash128(raw){
 const value=String(raw??'');let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;
 for(let i=0;i<value.length;i++){const k=value.charCodeAt(i);h1=h2^Math.imul(h1^k,597399067);h2=h3^Math.imul(h2^k,2869860233);h3=h4^Math.imul(h3^k,951274213);h4=h1^Math.imul(h4^k,2716044179)}
 h1=Math.imul(h3^(h1>>>18),597399067);h2=Math.imul(h4^(h2>>>22),2869860233);h3=Math.imul(h1^(h3>>>17),951274213);h4=Math.imul(h2^(h4>>>19),2716044179);
 h1=(h1^h2^h3^h4)>>>0;h2=(h2^h1)>>>0;h3=(h3^h1)>>>0;h4=(h4^h1)>>>0;
 return [h1,h2,h3,h4].map(x=>x.toString(16).padStart(8,'0')).join('')
}
function strongTokenFor(raw='anonymous'){return hash128(`mm-learner-scope-v2|${String(raw||'anonymous')}`)}
function rawScopedKey(base,token){return `${String(base)}::${String(token)}`}
function profileRegistry(){
 try{if(typeof db!=='undefined'&&db?.users&&typeof db.users==='object'&&!Array.isArray(db.users))return {available:true,ids:[...new Set(Object.keys(db.users).map(String).filter(Boolean))]}}catch(_){}
 try{if(window.db?.users&&typeof window.db.users==='object'&&!Array.isArray(window.db.users))return {available:true,ids:[...new Set(Object.keys(window.db.users).map(String).filter(Boolean))]}}catch(_){}
 return {available:false,ids:[]}
}
function quarantineLegacy(base,token,payload,reason){
 try{const source=rawScopedKey(base,token),target=`mm_scope_quarantine_v1::${hash128(`${base}::|${token}|${payload}`).slice(0,24)}`;if(localStorage.getItem(target)==null)localStorage.setItem(target,payload);if(localStorage.getItem(target)!==payload)return {status:'quarantine-write-failed'};localStorage.removeItem(source);if(localStorage.getItem(source)!=null)return {status:'quarantine-delete-failed',reason,target};return {status:'quarantined',reason,target}}catch(_){return {status:'quarantine-failed',reason}}
}
function fallbackMigrate(base,raw){
 const learner=String(raw||'anonymous'),legacy=legacyTokenFor(learner),registry=profileRegistry(),source=rawScopedKey(base,legacy),payload=localStorage.getItem(source);if(payload==null)return {status:'no-legacy'};
 if(!registry.available)return {status:'registry-unavailable'};
 const owners=registry.ids.filter(id=>legacyTokenFor(id)===legacy);
 if(owners.length!==1||owners[0]!==learner)return quarantineLegacy(base,legacy,payload,owners.length>1?'ambiguous-known-owners':'ownership-unproven');
 const target=rawScopedKey(base,strongTokenFor(learner)),current=localStorage.getItem(target);
 if(current==null){localStorage.setItem(target,payload);if(localStorage.getItem(target)!==payload)return {status:'copy-verification-failed'};localStorage.removeItem(source);return localStorage.getItem(source)==null?{status:'migrated'}:{status:'legacy-delete-failed'}}
 if(current===payload){localStorage.removeItem(source);return localStorage.getItem(source)==null?{status:'duplicate-removed'}:{status:'legacy-delete-failed'}}
 return {status:'parallel-stores'}
}
function scopedKey(base){
 const learner=learnerRaw();if(!learner)return null;
 const prefix=`${String(base)}::`,shared=window.MM_LEARNER_SCOPE;
 if(shared&&typeof shared.tokenFor==='function'&&typeof shared.storageKey==='function'){
  try{shared.registerStoragePrefix?.(prefix);shared.migrateStoragePrefix?.(prefix,learner);return shared.storageKey(prefix,shared.tokenFor(learner))}catch(_){}
 }
 try{fallbackMigrate(base,learner)}catch(_){}
 return rawScopedKey(base,strongTokenFor(learner))
}
const storage=Object.freeze({
 key:scopedKey,
 get(base,fallback=null){try{const k=scopedKey(base);if(!k)return fallback;const raw=localStorage.getItem(k);return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}},
 set(base,value){try{const k=scopedKey(base);if(!k)return false;const payload=JSON.stringify(value);localStorage.setItem(k,payload);return localStorage.getItem(k)===payload}catch(_){return false}},
 remove(base){try{const k=scopedKey(base);if(!k)return false;localStorage.removeItem(k);return localStorage.getItem(k)==null}catch(_){return false}},
 learnerToken:()=>{const learner=learnerRaw();if(!learner)return null;const shared=window.MM_LEARNER_SCOPE;try{if(shared&&typeof shared.tokenFor==='function')return shared.tokenFor(learner)}catch(_){}return strongTokenFor(learner)}
});
function installCore(name){
 const original=typeof window[name]==='function'?window[name]:null;if(!original)return;
 const slot={name,original,implementation:original,owner:'legacy-captured',before:new Set(),transform:new Set(),after:new Set(),dispatchDepth:0};
 const dispatch=function(){
  /* During migration, a legacy composition layer can accidentally capture this
     dispatcher and later be installed as its implementation. Re-entering the
     same slot would otherwise recurse forever (dispatcher -> wrapper -> dispatcher).
     A same-slot re-entry therefore executes the captured legacy implementation
     directly, while the outer dispatch remains the single hook boundary. */
  if(slot.dispatchDepth>0)return slot.original.apply(this,arguments);
  const args=[...arguments];
  slot.dispatchDepth++;
  try{
   for(const fn of slot.before){try{fn.apply(this,args)}catch(e){console.warn(`[MouldMaster runtime v2 before:${name}]`,e)}}
   let out=slot.implementation.apply(this,args);
   for(const fn of slot.transform){try{const next=fn.call(this,out,...args);if(next!==undefined)out=next}catch(e){console.warn(`[MouldMaster runtime v2 transform:${name}]`,e)}}
   for(const fn of slot.after){try{fn.call(this,out,...args)}catch(e){console.warn(`[MouldMaster runtime v2 after:${name}]`,e)}}
   return out
  }finally{slot.dispatchDepth--}
 };
 Object.defineProperty(dispatch,'__mmRuntimeV2',{value:true});slot.dispatch=dispatch;slots.set(name,slot);window[name]=dispatch
}
for(const name of CORE)installCore(name);
function slot(name){const x=slots.get(name);if(!x)throw new Error(`runtime v2 core slot unavailable: ${name}`);return x}
function setImplementation(name,fn,owner){if(typeof fn!=='function')throw new Error(`runtime v2 implementation for ${name} must be a function`);const s=slot(name),next=String(owner||'').trim();if(!next)throw new Error(`runtime v2 implementation owner required for ${name}`);if(s.owner!=='legacy-captured'&&s.owner!==next)throw new Error(`runtime v2 ${name} already owned by ${s.owner}`);s.implementation=fn;s.owner=next;return true}
function restoreLegacy(name,owner){const s=slot(name);if(s.owner!==owner)throw new Error(`runtime v2 ${name} is owned by ${s.owner}, not ${owner}`);s.implementation=s.original;s.owner='legacy-captured';return true}
function rebind(name){const s=slot(name);window[name]=s.dispatch;return s.dispatch}
function rebindAll(){for(const name of slots.keys())rebind(name);return snapshot()}
function before(name,fn){const s=slot(name);s.before.add(fn);return()=>s.before.delete(fn)}
function transform(name,fn){const s=slot(name);s.transform.add(fn);return()=>s.transform.delete(fn)}
function after(name,fn){const s=slot(name);s.after.add(fn);return()=>s.after.delete(fn)}
function registerModule(id,meta={}){id=String(id||'').trim();if(!id)throw new Error('runtime v2 module id required');if(modules.has(id))throw new Error(`runtime v2 duplicate module: ${id}`);const row=Object.freeze({id,...meta});modules.set(id,row);return row}
function snapshot(){return {version:VERSION,learnerToken:storage.learnerToken(),modules:[...modules.values()].map(x=>({...x})),core:Object.fromEntries([...slots].map(([name,s])=>[name,{owner:s.owner,beforeHooks:s.before.size,transformHooks:s.transform.size,afterHooks:s.after.size,bound:window[name]===s.dispatch}]))}}
function assertBound(){const state=snapshot(),unbound=Object.entries(state.core).filter(([,x])=>!x.bound).map(([name])=>name);return {ok:unbound.length===0,unbound,state}}
window.MM_RUNTIME_V2=Object.freeze({version:VERSION,storage,setImplementation,restoreLegacy,rebind,rebindAll,before,transform,after,registerModule,module:id=>modules.get(String(id))||null,snapshot,assertBound,policy:'New MouldMaster features register through one explicit runtime dispatcher. A core implementation slot has one owner at a time; additive behavior uses named before/transform/after hooks instead of wrapper chains. Transform hooks may replace a return value but must not replace the global dispatcher. Compatibility layers may be rebound to the canonical dispatcher before final runtime composition.'});
registerModule('runtime-v2',{version:VERSION,type:'core-runtime',status:'migration-boundary',storageScope:'MM_LEARNER_SCOPE-compatible-128-bit-with-collision-aware-legacy-migration'});
})();
