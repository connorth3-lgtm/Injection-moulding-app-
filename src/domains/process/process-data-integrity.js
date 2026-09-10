/* MouldMaster process-data integrity compatibility hardening — 2026.09.10.3 */
(function(){
'use strict';
if(window.MM_PROCESS_DATA_INTEGRITY)return;

const VERSION='2026.09.10.3';
const DB_NAME='mouldmaster-process-data-v1';
const DB_VERSION=1;
const CONTEXT_KEYS=['machine','mould','materialGrade','job'];
let activeDatasetId='';
let installAttempts=0;
let optionFilterQueued=false;

function norm(value){return String(value??'').trim().toLowerCase()}
function contextCompatibility(left={},right={}){
  const missing=[],mismatched=[];
  for(const key of CONTEXT_KEYS){
    const a=norm(left?.[key]),b=norm(right?.[key]);
    if(!a||!b){missing.push(key);continue}
    if(a!==b)mismatched.push(key);
  }
  return {compatible:missing.length===0&&mismatched.length===0,missing,mismatched};
}
function baselineCompatibility(dataset={},baseline={}){
  if(dataset?.id&&baseline?.datasetId===dataset.id)return {compatible:true,sameDataset:true,missing:[],mismatched:[]};
  return {sameDataset:false,...contextCompatibility(dataset?.entities||{},baseline?.entities||{})};
}
function assertBaselineCompatible(dataset,baseline){
  const result=baselineCompatibility(dataset,baseline);
  if(result.compatible)return result;
  const detail=[];
  if(result.missing.length)detail.push(`missing ${result.missing.join(', ')}`);
  if(result.mismatched.length)detail.push(`different ${result.mismatched.join(', ')}`);
  throw new Error(`Baseline context mismatch: cross-dataset comparisons require the same machine, mould, material grade, and job (${detail.join('; ')}).`);
}
function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
  });
}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction aborted'))})}
async function get(storeName,key){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,'readonly'),req=tx.objectStore(storeName).get(key);
    req.onsuccess=()=>{resolve(req.result||null);db.close()};
    req.onerror=()=>{reject(req.error||new Error(`Could not read ${storeName}`));db.close()};
  });
}
function deleteCursorMatches(request,match){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return}if(match(cursor.value))cursor.delete();cursor.continue()};
    request.onerror=()=>reject(request.error||new Error('IndexedDB cursor failed'));
  });
}
async function deleteDatasetCascade(id){
  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');
  const db=await openDb();
  try{
    const tx=db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite');
    tx.objectStore('datasets').delete(datasetId);
    const shotIndex=tx.objectStore('shots').index('datasetId');
    await deleteCursorMatches(shotIndex.openCursor(IDBKeyRange.only(datasetId)),()=>true);
    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);
    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);
    await txDone(tx);
    return true;
  }finally{db.close()}
}
async function guardedCompare(original,datasetId,baselineId,args,receiver){
  const [dataset,baseline]=await Promise.all([get('datasets',datasetId),get('baselines',baselineId)]);
  if(!dataset||!baseline)throw new Error('Dataset or baseline not found');
  assertBaselineCompatible(dataset,baseline);
  return original.apply(receiver,args);
}
function harden(api=window.MM_CONNECTED_PROCESS_DATA){
  if(!api?.storage||!api?.intelligence)return false;
  if(api.__mmProcessDataIntegrity===VERSION)return true;
  if(api.__mmCanonicalProcessDataIntegrity){api.__mmProcessDataIntegrity=VERSION;return true}
  const originalCompare=api.intelligence.compareToBaseline;
  if(typeof originalCompare!=='function')return false;
  api.intelligence.compareToBaseline=function(datasetId,baselineId){return guardedCompare(originalCompare,datasetId,baselineId,arguments,this)};
  api.intelligence.baselineCompatibility=baselineCompatibility;
  api.storage.deleteDataset=deleteDatasetCascade;
  api.__mmProcessDataIntegrity=VERSION;
  return true;
}
async function filterBaselineOptions(){
  optionFilterQueued=false;
  const select=document.querySelector('[data-pi-baseline]');
  if(!select||!activeDatasetId)return;
  const dataset=await get('datasets',activeDatasetId).catch(()=>null);if(!dataset)return;
  for(const option of Array.from(select.options||[])){
    if(!option.value)continue;
    const baseline=await get('baselines',option.value).catch(()=>null);
    if(!baseline||!baselineCompatibility(dataset,baseline).compatible)option.remove();
  }
  const button=document.querySelector('[data-pi-drift]');
  if(button)button.disabled=!Array.from(select.options||[]).some(x=>x.value);
}
function queueOptionFilter(){if(optionFilterQueued)return;optionFilterQueued=true;(window.requestAnimationFrame||setTimeout)(()=>filterBaselineOptions().catch(()=>{}),0)}
function captureUi(event){
  const analyze=event.target?.closest?.('[data-pi-analyze]');
  if(analyze?.dataset?.piAnalyze){activeDatasetId=analyze.dataset.piAnalyze;setTimeout(queueOptionFilter,0)}
  const del=event.target?.closest?.('[data-di-delete]');
  if(!del?.dataset?.diDelete)return;
  if(window.MM_CONNECTED_PROCESS_DATA?.__mmCanonicalProcessDataIntegrity)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!window.confirm?.('Delete this local dataset, its shots, baselines, and linked troubleshooting references?'))return;
  deleteDatasetCascade(del.dataset.diDelete).then(()=>{
    window.toast?.('Local dataset and linked evidence deleted');
    window.MM_PROCESS_DATA_LOCAL_INTAKE?.openLibrary?.();
  }).catch(err=>window.toast?.(`Dataset delete failed: ${err?.message||err}`));
}
function installWhenReady(){
  if(harden())return;
  if(++installAttempts<100)setTimeout(installWhenReady,50);
  else console.error('MouldMaster process-data integrity hardening could not find the connected process-data runtime');
}

document.addEventListener('click',captureUi,true);
const observer=new MutationObserver(queueOptionFilter);observer.observe(document.documentElement,{childList:true,subtree:true});
window.MM_PROCESS_DATA_INTEGRITY=Object.freeze({version:VERSION,contextKeys:[...CONTEXT_KEYS],contextCompatibility,baselineCompatibility,assertBaselineCompatible,deleteDatasetCascade,harden});
installWhenReady();
})();
