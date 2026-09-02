/* MouldMaster engineering domain store v2 — 2026.09.03 */
(function(){
'use strict';
if(window.MM_ENGINEERING_STORE)return;

const VERSION='2026.09.03.1';
const DB_NAME='mouldmaster-engineering-v2';
const DB_VERSION=1;
const LEGACY_CASE_BASE='mm_mould_master_cases_v1::';

function uid(prefix='id'){try{return `${prefix}-${crypto.randomUUID()}`}catch(_){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}}
function learnerId(){try{return String((typeof db!=='undefined'&&db?.activeUser)||window.user?.id||'anonymous')}catch(_){return'anonymous'}}
function learnerToken(raw=learnerId()){let h=2166136261;for(const ch of String(raw)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function now(){return new Date().toISOString()}

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('cases')){
        const s=db.createObjectStore('cases',{keyPath:'id'});
        s.createIndex('learnerToken','learnerToken',{unique:false});
        s.createIndex('materialGradeId','materialGradeId',{unique:false});
        s.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('caseLinks')){
        const s=db.createObjectStore('caseLinks',{keyPath:'id'});
        s.createIndex('caseId','caseId',{unique:false});
        s.createIndex('kind','kind',{unique:false});
        s.createIndex('targetId','targetId',{unique:false});
      }
      if(!db.objectStoreNames.contains('migrations'))db.createObjectStore('migrations',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('engineering IndexedDB open failed'));
  });
}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('engineering transaction failed'));tx.onabort=()=>reject(tx.error||new Error('engineering transaction aborted'))})}

async function put(storeName,value){const db=await openDb(),tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(value);await txDone(tx);db.close();return value}
async function get(storeName,key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),r=tx.objectStore(storeName).get(key);r.onsuccess=()=>{resolve(r.result||null);db.close()};r.onerror=()=>{reject(r.error);db.close()}})}
async function getAllByIndex(storeName,indexName,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),idx=tx.objectStore(storeName).index(indexName),r=idx.getAll(IDBKeyRange.only(value));r.onsuccess=()=>{resolve(r.result||[]);db.close()};r.onerror=()=>{reject(r.error);db.close()}})}

function normalizeCase(input={}){
  return {
    schemaVersion:2,
    id:String(input.id||uid('case')),
    learnerToken:String(input.learnerToken||learnerToken()),
    createdAt:String(input.createdAt||now()),
    updatedAt:String(input.updatedAt||now()),
    title:String(input.title||''),
    defectId:input.defectId?String(input.defectId):null,
    defect:String(input.defect||''),
    materialGradeId:input.materialGradeId?String(input.materialGradeId):null,
    material:String(input.material||''),
    machineId:input.machineId?String(input.machineId):null,
    machine:String(input.machine||''),
    mouldId:input.mouldId?String(input.mouldId):null,
    mould:String(input.mould||''),
    cavityId:input.cavityId?String(input.cavityId):null,
    onset:String(input.onset||'Unknown / not yet defined'),
    location:String(input.location||''),
    baseline:String(input.baseline||''),
    evidence:String(input.evidence||''),
    hypothesis:String(input.hypothesis||''),
    controlledTest:String(input.controlledTest||''),
    testResult:String(input.testResult||''),
    afterChange:String(input.afterChange||''),
    verification:String(input.verification||''),
    conclusion:String(input.conclusion||''),
    status:String(input.status||'Investigating'),
    legacySource:input.legacySource||null
  };
}

async function saveCase(input){const record=normalizeCase(input);record.updatedAt=now();return put('cases',record)}
async function listCases(token=learnerToken()){return (await getAllByIndex('cases','learnerToken',String(token))).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
async function getCase(id){return get('cases',String(id))}

async function linkCase(caseId,kind,targetId,meta={}){
  if(!caseId||!kind||!targetId)throw new Error('caseId, kind and targetId are required');
  const id=`${caseId}::${kind}::${targetId}`;
  const record={id,caseId:String(caseId),kind:String(kind),targetId:String(targetId),meta:{...meta},updatedAt:now()};
  await put('caseLinks',record);
  return record;
}
async function linksForCase(caseId){return getAllByIndex('caseLinks','caseId',String(caseId))}

async function linkCaseMaterial(caseId,materialGradeId,displayName=''){
  const c=await getCase(caseId);
  if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.materialGradeId=String(materialGradeId);
  if(displayName)c.material=String(displayName);
  await saveCase(c);
  return linkCase(caseId,'material-grade',materialGradeId,{displayName:String(displayName||'')});
}
async function linkCaseDataset(caseId,datasetId,label=''){return linkCase(caseId,'process-dataset',datasetId,{label:String(label||'')})}

function legacyKey(token=learnerToken()){return LEGACY_CASE_BASE+String(token)}
function readLegacyCases(token=learnerToken()){
  try{const raw=JSON.parse(localStorage.getItem(legacyKey(token))||'[]');return Array.isArray(raw)?raw:[]}catch(_){return[]}
}
async function migrateLegacyMouldMasterCases(token=learnerToken()){
  const migrationId=`legacy-mould-master-v1::${token}`;
  const prior=await get('migrations',migrationId);
  if(prior?.complete)return {...prior,alreadyComplete:true};
  const legacy=readLegacyCases(token);
  let migrated=0;
  for(const old of legacy){
    const existing=old?.id?await getCase(old.id):null;
    if(existing)continue;
    await saveCase({...old,learnerToken:String(token),legacySource:'mm_mould_master_cases_v1'});
    migrated++;
  }
  const result={id:migrationId,complete:true,migrated,legacyCount:legacy.length,completedAt:now(),destructive:false};
  await put('migrations',result);
  return result;
}

async function bootstrap(){try{return await migrateLegacyMouldMasterCases()}catch(err){console.warn('[MouldMaster engineering store] legacy migration skipped',err);return null}}

window.MM_ENGINEERING_STORE=Object.freeze({
  version:VERSION,
  dbName:DB_NAME,
  normalizeCase,
  saveCase,
  listCases,
  getCase,
  linkCase,
  linksForCase,
  linkCaseMaterial,
  linkCaseDataset,
  migrateLegacyMouldMasterCases,
  bootstrap,
  learnerToken
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();
})();
