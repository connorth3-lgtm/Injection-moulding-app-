/* MouldMaster Mould Master -> engineering-store compatibility bridge — 2026.09.03 */
(function(){
'use strict';
if(window.MM_CASE_STORE_BRIDGE)return;
const VERSION='2026.09.03.2';
const PREFIX='mm_mould_master_cases_v1::';
const P=window.Storage?.prototype;
const store=window.MM_ENGINEERING_STORE;
if(!P||!store){throw new Error('store-bridge.js requires MM_ENGINEERING_STORE')}

const rawSet=P.setItem,rawRemove=P.removeItem;
let pending=Promise.resolve();
function queue(task){pending=pending.then(task,task).catch(err=>console.warn('[MouldMaster case bridge]',err));return pending}
function tokenFromKey(key){const k=String(key||'');return k.startsWith(PREFIX)?k.slice(PREFIX.length):''}
function parseCases(value){try{const x=JSON.parse(String(value||'[]'));return Array.isArray(x)?x:[]}catch(_){return[]}}
function syncValue(key,value){const token=tokenFromKey(key);if(!token)return;queue(()=>store.syncLegacySnapshot(parseCases(value),token))}

Object.defineProperty(P,'setItem',{configurable:true,writable:true,value:function(key,value){const result=rawSet.call(this,key,value);if(this===localStorage)syncValue(key,value);return result}});
Object.defineProperty(P,'removeItem',{configurable:true,writable:true,value:function(key){const result=rawRemove.call(this,key);if(this===localStorage){const token=tokenFromKey(key);if(token)queue(()=>store.syncLegacySnapshot([],token))}return result}});

async function reconcileActive(){const token=store.learnerToken(),key=PREFIX+token;return store.syncLegacySnapshot(parseCases(localStorage.getItem(key)||'[]'),token)}
const workspace=window.MM_MOULD_MASTER_WORKSPACE;if(workspace&&!workspace.canonicalStore)workspace.canonicalStore='indexeddb-v2-with-legacy-ui-mirror';
window.MM_CASE_STORE_BRIDGE=Object.freeze({version:VERSION,prefix:PREFIX,reconcileActive,ready:queue(reconcileActive)});
})();
