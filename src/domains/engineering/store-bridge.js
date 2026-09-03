/* MouldMaster legacy case migration bridge — 2026.09.03 */
(function(){
'use strict';
if(window.MM_CASE_STORE_BRIDGE)return;
const VERSION='2026.09.03.4';
const store=window.MM_ENGINEERING_STORE;
if(!store)throw new Error('store-bridge.js requires MM_ENGINEERING_STORE');

async function initialise(){
  const migration=await store.bootstrap();
  const workspace=window.MM_MOULD_MASTER_WORKSPACE;
  if(workspace){
    workspace.canonicalStore='indexeddb-v2';
    if(typeof workspace.hydrate==='function')await workspace.hydrate();
  }
  return {migration,canonicalStore:'indexeddb-v2',legacyMode:'one-time-import-only'}
}

const ready=initialise().catch(err=>{console.warn('[MouldMaster case migration bridge]',err);return {migration:null,canonicalStore:'unavailable',legacyMode:'one-time-import-only',error:String(err?.message||err)}});
window.MM_CASE_STORE_BRIDGE=Object.freeze({version:VERSION,canonicalStore:'indexeddb-v2',legacyMode:'one-time-import-only',ready});
})();
