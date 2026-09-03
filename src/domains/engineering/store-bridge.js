/* MouldMaster Mould Master -> engineering-store compatibility bridge — 2026.09.03 */
(function(){
'use strict';
if(window.MM_CASE_STORE_BRIDGE)return;
const VERSION='2026.09.03.3';
const PREFIX='mm_mould_master_cases_v1::';
const EVENT='mm:mould-master-cases-changed';
const store=window.MM_ENGINEERING_STORE;
if(!store){throw new Error('store-bridge.js requires MM_ENGINEERING_STORE')}

let pending=Promise.resolve();
function queue(task){pending=pending.then(task,task).catch(err=>console.warn('[MouldMaster case bridge]',err));return pending}
function parseCases(value){try{const x=JSON.parse(String(value||'[]'));return Array.isArray(x)?x:[]}catch(_){return[]}}
function activeToken(){return store.learnerToken()}
function activeKey(){return PREFIX+activeToken()}

function syncEvent(event){
  const detail=event?.detail||{},token=String(detail.learnerToken||'');
  if(!token||!Array.isArray(detail.cases))return;
  queue(()=>store.syncLegacySnapshot(detail.cases,token));
}
window.addEventListener(EVENT,syncEvent);

async function reconcileActive(){const token=activeToken();return store.syncLegacySnapshot(parseCases(localStorage.getItem(activeKey())||'[]'),token)}
const workspace=window.MM_MOULD_MASTER_WORKSPACE;if(workspace&&!workspace.canonicalStore)workspace.canonicalStore='indexeddb-v2-with-explicit-legacy-ui-events';
window.MM_CASE_STORE_BRIDGE=Object.freeze({version:VERSION,prefix:PREFIX,event:EVENT,reconcileActive,ready:queue(reconcileActive)});
})();
