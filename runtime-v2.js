/* MouldMaster canonical runtime v2 — explicit core dispatch, module registry and scoped storage 2026-09-01 */
(function(){
'use strict';
if(window.MM_RUNTIME_V2)return;
const VERSION='2026.09.01.1';
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
 const slot={name,original,implementation:original,owner:'legacy-captured',before:new Set(),after:new Set()};
 const dispatch=function(){
  const args=[...arguments];for(const fn of slot.before){try{fn.apply(this,args)}catch(e){console.warn(`[MouldMaster runtime v2 before:${name}]`,e)}}
  const out=slot.implementation.apply(this,args);
  for(const fn of slot.after){try{fn.call(this,out,...args)}catch(e){console.warn(`[MouldMaster runtime v2 after:${name}]`,e)}}
  return out
 };
 Object.defineProperty(dispatch,'__mmRuntimeV2',{value:true});slot.dispatch=dispatch;slots.set(name,slot);window[name]=dispatch
}
for(const name of CORE)installCore(name);
function slot(name){const x=slots.get(name);if(!x)throw new Error(`runtime v2 core slot unavailable: ${name}`);return x}
function setImplementation(name,fn,owner){if(typeof fn!=='function')throw new Error(`runtime v2 implementation for ${name} must be a function`);const s=slot(name),next=String(owner||'').trim();if(!next)throw new Error(`runtime v2 implementation owner required for ${name}`);if(s.owner!=='legacy-captured'&&s.owner!==next)throw new Error(`runtime v2 ${name} already owned by ${s.owner}`);s.implementation=fn;s.owner=next;return true}
function restoreLegacy(name,owner){const s=slot(name);if(s.owner!==owner)throw new Error(`runtime v2 ${name} is owned by ${s.owner}, not ${owner}`);s.implementation=s.original;s.owner='legacy-captured';return true}
function before(name,fn){const s=slot(name);s.before.add(fn);return()=>s.before.delete(fn)}
function after(name,fn){const s=slot(name);s.after.add(fn);return()=>s.after.delete(fn)}
function registerModule(id,meta={}){id=String(id||'').trim();if(!id)throw new Error('runtime v2 module id required');if(modules.has(id))throw new Error(`runtime v2 duplicate module: ${id}`);const row=Object.freeze({id,...meta});modules.set(id,row);return row}
function snapshot(){return {version:VERSION,learnerToken:storage.learnerToken(),modules:[...modules.values()].map(x=>({...x})),core:Object.fromEntries([...slots].map(([name,s])=>[name,{owner:s.owner,beforeHooks:s.before.size,afterHooks:s.after.size}]))}}
window.MM_RUNTIME_V2=Object.freeze({version:VERSION,storage,setImplementation,restoreLegacy,before,after,registerModule,module:id=>modules.get(String(id))||null,snapshot,policy:'New MouldMaster features register through one explicit runtime dispatcher. A core implementation slot has one owner at a time; additive behavior uses named before/after hooks instead of wrapper chains.'});
registerModule('runtime-v2',{version:VERSION,type:'core-runtime',status:'migration-boundary'});
})();
