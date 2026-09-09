/* MouldMaster canonical runtime v2 — explicit core dispatch, module registry and scoped storage 2026-09-10 */
(function(){
'use strict';
if(window.MM_RUNTIME_V2)return;
const VERSION='2026.09.10.1';
const CORE=['renderLesson','renderDashboard','switchView','startExam','gradeExam','getExamQuestions'];
const modules=new Map(),slots=new Map();
function learnerRaw(){try{if(window.db?.activeUser)return String(window.db.activeUser)}catch(_){}try{if(window.user?.id)return String(window.user.id)}catch(_){}return 'anonymous'}
function hash(raw){let h=2166136261;for(const c of String(raw||'anonymous')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function scopedKey(base){return `${String(base)}::${hash(learnerRaw())}`}
const storage=Object.freeze({
 key:scopedKey,
 get(base,fallback=null){try{const raw=localStorage.getItem(scopedKey(base));return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}},
 set(base,value){try{localStorage.setItem(scopedKey(base),JSON.stringify(value));return true}catch(_){return false}},
 remove(base){try{localStorage.removeItem(scopedKey(base));return true}catch(_){return false}},
 learnerToken:()=>hash(learnerRaw())
});
function installCore(name){
 const original=typeof window[name]==='function'?window[name]:null;if(!original)return;
 const slot={name,original,implementation:original,owner:'legacy-captured',before:new Set(),transform:new Set(),after:new Set()};
 const dispatch=function(){
  const args=[...arguments];
  for(const fn of slot.before){try{fn.apply(this,args)}catch(e){console.warn(`[MouldMaster runtime v2 before:${name}]`,e)}}
  let out=slot.implementation.apply(this,args);
  for(const fn of slot.transform){try{const next=fn.call(this,out,...args);if(next!==undefined)out=next}catch(e){console.warn(`[MouldMaster runtime v2 transform:${name}]`,e)}}
  for(const fn of slot.after){try{fn.call(this,out,...args)}catch(e){console.warn(`[MouldMaster runtime v2 after:${name}]`,e)}}
  return out
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
registerModule('runtime-v2',{version:VERSION,type:'core-runtime',status:'migration-boundary'});
})();
