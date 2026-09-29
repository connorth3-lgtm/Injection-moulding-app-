/* MouldMaster engineering domain store v3 — 2026.09.03 */
(function(){
'use strict';
if(window.MM_ENGINEERING_STORE)return;

const VERSION='2026.09.29.5';
const DB_NAME='mouldmaster-engineering-v2';
const DB_VERSION=3;
const LEGACY_CASE_BASE='mm_mould_master_cases_v1::';
const learnerScope=window.MM_LEARNER_SCOPE;
if(!learnerScope)throw new Error('MM_LEARNER_SCOPE must load before the engineering store');
learnerScope.registerStoragePrefix?.(LEGACY_CASE_BASE);

function uid(prefix='id'){try{return `${prefix}-${crypto.randomUUID()}`}catch(_){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}}
function learnerId(){return learnerScope.activeId()}
function learnerToken(raw=learnerId()){return learnerScope.tokenFor(raw)}
function now(){return new Date().toISOString()}
function tokenValue(token){return learnerScope.normalizeToken(token||learnerToken())}
function timeValue(value){const n=Date.parse(String(value||''));return Number.isFinite(n)?n:0}

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result,tx=req.transaction;
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
        s.createIndex('learnerToken','learnerToken',{unique:false});
      }else if(tx){
        const s=tx.objectStore('caseLinks');
        if(!s.indexNames.contains('learnerToken'))s.createIndex('learnerToken','learnerToken',{unique:false});
      }
      if(!db.objectStoreNames.contains('caseEvidence')){
        const s=db.createObjectStore('caseEvidence',{keyPath:'id'});
        s.createIndex('caseId','caseId',{unique:false});
        s.createIndex('learnerToken','learnerToken',{unique:false});
        s.createIndex('kind','kind',{unique:false});
        s.createIndex('occurredAt','occurredAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('migrations'))db.createObjectStore('migrations',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('engineering IndexedDB open failed'));
  });
}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('engineering transaction failed'));tx.onabort=()=>reject(tx.error||new Error('engineering transaction aborted'))})}
async function put(storeName,value){const db=await openDb(),tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(value);await txDone(tx);db.close();return value}
async function remove(storeName,key){const db=await openDb(),tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).delete(key);await txDone(tx);db.close();return true}
async function getRaw(storeName,key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),r=tx.objectStore(storeName).get(key);r.onsuccess=()=>{resolve(r.result||null);db.close()};r.onerror=()=>{reject(r.error);db.close()}})}
async function getAllByIndex(storeName,indexName,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),idx=tx.objectStore(storeName).index(indexName),r=idx.getAll(IDBKeyRange.only(value));r.onsuccess=()=>{resolve(r.result||[]);db.close()};r.onerror=()=>{reject(r.error);db.close()}})}

function normalizeCase(input={}){
  return {
    schemaVersion:4,
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
    productId:input.productId?String(input.productId):null,
    product:String(input.product||''),
    partId:input.partId?String(input.partId):null,
    part:String(input.part||''),
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

async function saveCase(input,{token=null,allowForeignId=false}={}){
  const owner=tokenValue(token||input?.learnerToken),record=normalizeCase({...input,learnerToken:owner});
  const prior=await getRaw('cases',record.id);
  if(prior&&String(prior.learnerToken)!==owner&&!allowForeignId)throw new Error('Engineering case belongs to a different learner profile');
  record.createdAt=String(prior?.createdAt||record.createdAt||now());record.updatedAt=now();
  return put('cases',record)
}
async function listCases(token=learnerToken()){return (await getAllByIndex('cases','learnerToken',tokenValue(token))).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
async function getCase(id,token=learnerToken()){const record=await getRaw('cases',String(id));return record&&String(record.learnerToken)===tokenValue(token)?record:null}
async function deleteCase(id,token=learnerToken()){
  const owner=tokenValue(token),record=await getCase(id,owner);if(!record)return false;
  const links=await getAllByIndex('caseLinks','caseId',String(id));
  for(const link of links)if(String(link.learnerToken||owner)===owner)await remove('caseLinks',link.id);
  const evidence=await getAllByIndex('caseEvidence','caseId',String(id));
  for(const item of evidence)if(String(item.learnerToken||owner)===owner)await remove('caseEvidence',item.id);
  await remove('cases',String(id));return true
}

async function linkCase(caseId,kind,targetId,meta={},token=learnerToken()){
  if(!caseId||!kind||!targetId)throw new Error('caseId, kind and targetId are required');
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case for active learner: ${caseId}`);
  const id=`${caseId}::${kind}::${targetId}`;
  const record={id,caseId:String(caseId),learnerToken:owner,kind:String(kind),targetId:String(targetId),meta:{...meta},updatedAt:now()};
  await put('caseLinks',record);return record
}
async function linksForCase(caseId,token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)return[];
  return (await getAllByIndex('caseLinks','caseId',String(caseId))).filter(x=>String(x.learnerToken||owner)===owner)
}
async function linkCaseMaterial(caseId,materialGradeId,displayName='',token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.materialGradeId=String(materialGradeId);if(displayName)c.material=String(displayName);
  await saveCase(c,{token:owner});return linkCase(caseId,'material-grade',materialGradeId,{displayName:String(displayName||'')},owner)
}
async function linkCaseMachine(caseId,machineId,displayName='',token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.machineId=String(machineId);if(displayName)c.machine=String(displayName);
  await saveCase(c,{token:owner});return linkCase(caseId,'machine',machineId,{displayName:String(displayName||'')},owner)
}
async function linkCaseMould(caseId,mouldId,displayName='',token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.mouldId=String(mouldId);if(displayName)c.mould=String(displayName);
  await saveCase(c,{token:owner});return linkCase(caseId,'mould',mouldId,{displayName:String(displayName||'')},owner)
}
async function linkCaseProduct(caseId,productId,displayName='',token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.productId=String(productId);if(displayName)c.product=String(displayName);
  await saveCase(c,{token:owner});return linkCase(caseId,'product',productId,{displayName:String(displayName||'')},owner)
}
async function linkCasePart(caseId,partId,displayName='',token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  c.partId=String(partId);if(displayName)c.part=String(displayName);
  await saveCase(c,{token:owner});return linkCase(caseId,'part',partId,{displayName:String(displayName||'')},owner)
}
async function linkCaseContext(caseId,context={},token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  const specs=[
    ['material-grade','materialGradeId','material'],
    ['machine','machineId','machine'],
    ['mould','mouldId','mould'],
    ['product','productId','product'],
    ['part','partId','part']
  ],links=[];
  for(const [kind,idKey,nameKey] of specs){
    const targetId=context[idKey]??c[idKey],displayName=context[nameKey]??c[nameKey];
    if(!targetId)continue;
    c[idKey]=String(targetId);if(displayName)c[nameKey]=String(displayName);
    links.push(await linkCase(caseId,kind,targetId,{displayName:String(displayName||'')},owner));
  }
  await saveCase(c,{token:owner});
  return {caseId:String(caseId),links}
}
async function linkCaseDataset(caseId,datasetId,label='',token=learnerToken()){return linkCase(caseId,'process-dataset',datasetId,{label:String(label||'')},token)}

const EVIDENCE_KINDS=Object.freeze(['controlled-trial','dimensional-check','defect-observation','maintenance-event','material-lot','acceptance-check']);
const ACCEPTANCE_STATES=Object.freeze(['not-assessed','pending','accepted','rejected']);
function normalizeCaseEvidence(input={},caseRecord={},owner=learnerToken()){
  const kind=EVIDENCE_KINDS.includes(String(input.kind||''))?String(input.kind):'controlled-trial';
  const acceptanceStatus=ACCEPTANCE_STATES.includes(String(input.acceptanceStatus||''))?String(input.acceptanceStatus):'not-assessed';
  return {
    schemaVersion:1,
    id:String(input.id||uid('evidence')),
    caseId:String(input.caseId||caseRecord.id||''),
    learnerToken:String(owner),
    kind,
    occurredAt:String(input.occurredAt||now()),
    recordedAt:String(input.recordedAt||now()),
    updatedAt:now(),
    title:String(input.title||''),
    sourceRef:String(input.sourceRef||''),
    materialLot:String(input.materialLot||''),
    measurement:String(input.measurement||''),
    unit:String(input.unit||''),
    result:String(input.result||''),
    acceptanceStatus,
    notes:String(input.notes||''),
    context:{
      materialGradeId:input.context?.materialGradeId??caseRecord.materialGradeId??null,
      machineId:input.context?.machineId??caseRecord.machineId??null,
      mouldId:input.context?.mouldId??caseRecord.mouldId??null,
      productId:input.context?.productId??caseRecord.productId??null,
      partId:input.context?.partId??caseRecord.partId??null,
      cavityId:input.context?.cavityId??caseRecord.cavityId??null
    },
    boundary:'Recorded site-local evidence only; does not prove causation, validate a universal process window, or authorize production changes.'
  };
}
async function saveCaseEvidence(caseId,input={},token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  const record=normalizeCaseEvidence({...input,caseId},c,owner),prior=await getRaw('caseEvidence',record.id);
  if(prior&&String(prior.learnerToken)!==owner)throw new Error('Engineering evidence belongs to a different learner profile');
  record.recordedAt=String(prior?.recordedAt||record.recordedAt);record.updatedAt=now();
  return put('caseEvidence',record)
}
async function listCaseEvidence(caseId,token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)return[];
  return (await getAllByIndex('caseEvidence','caseId',String(caseId))).filter(x=>String(x.learnerToken)===owner).sort((a,b)=>String(b.occurredAt||b.recordedAt).localeCompare(String(a.occurredAt||a.recordedAt)))
}
async function deleteCaseEvidence(id,token=learnerToken()){
  const owner=tokenValue(token),record=await getRaw('caseEvidence',String(id));if(!record||String(record.learnerToken)!==owner)return false;
  await remove('caseEvidence',String(id));return true
}
async function evidenceSummary(caseId,token=learnerToken()){
  const items=await listCaseEvidence(caseId,token),byKind={},acceptance={};
  for(const item of items){byKind[item.kind]=(byKind[item.kind]||0)+1;acceptance[item.acceptanceStatus]=(acceptance[item.acceptanceStatus]||0)+1}
  return {caseId:String(caseId),count:items.length,byKind,acceptance,latestAt:items[0]?.occurredAt||null,boundary:'Counts describe recorded evidence only; completeness and acceptance still require human/site review.'}
}

function legacyKey(token=learnerToken()){return learnerScope.storageKey(LEGACY_CASE_BASE,tokenValue(token))}
function readLegacyCases(token=learnerToken()){try{const raw=JSON.parse(localStorage.getItem(legacyKey(token))||'[]');return Array.isArray(raw)?raw:[]}catch(_){return[]}}
async function importLegacyCases(cases,token=learnerToken()){
  const owner=tokenValue(token),incoming=Array.isArray(cases)?cases:[];
  let imported=0,preservedExisting=0,conflicts=0;
  for(const old of incoming){
    if(!old?.id)continue;
    const id=String(old.id),prior=await getRaw('cases',id);
    if(prior&&String(prior.learnerToken)!==owner){conflicts++;continue}
    if(prior&&timeValue(prior.updatedAt)>=timeValue(old.updatedAt||old.createdAt)){preservedExisting++;continue}
    await saveCase({...old,learnerToken:owner,materialGradeId:old.materialGradeId||prior?.materialGradeId||null,legacySource:'mm_mould_master_cases_v1'},{token:owner});
    imported++
  }
  return {learnerToken:owner,legacyCount:incoming.length,imported,preservedExisting,conflicts,importedAt:now(),destructive:false}
}
async function migrateLegacyMouldMasterCases(token=learnerToken()){
  const owner=tokenValue(token),migrationId=`legacy-mould-master-v1::${owner}`,prior=await getRaw('migrations',migrationId);
  if(prior?.complete)return {...prior,alreadyComplete:true};
  const legacy=readLegacyCases(owner),summary=await importLegacyCases(legacy,owner);
  const result={id:migrationId,complete:true,...summary,completedAt:now(),alreadyComplete:false};
  await put('migrations',result);return result
}
async function repairLegacyLinkOwnership(token=learnerToken()){
  const owner=tokenValue(token),cases=await listCases(owner);let repaired=0;
  for(const c of cases){for(const link of await getAllByIndex('caseLinks','caseId',String(c.id))){if(!link.learnerToken){link.learnerToken=owner;link.updatedAt=now();await put('caseLinks',link);repaired++}}}
  return repaired
}
async function bootstrap(){try{const migration=await migrateLegacyMouldMasterCases();await repairLegacyLinkOwnership();return migration}catch(err){console.warn('[MouldMaster engineering store] legacy migration skipped',err);return null}}

window.MM_ENGINEERING_STORE=Object.freeze({version:VERSION,dbName:DB_NAME,normalizeCase,saveCase,listCases,getCase,deleteCase,linkCase,linksForCase,linkCaseMaterial,linkCaseMachine,linkCaseMould,linkCaseProduct,linkCasePart,linkCaseContext,linkCaseDataset,normalizeCaseEvidence,saveCaseEvidence,listCaseEvidence,deleteCaseEvidence,evidenceSummary,evidenceKinds:EVIDENCE_KINDS,acceptanceStates:ACCEPTANCE_STATES,importLegacyCases,migrateLegacyMouldMasterCases,repairLegacyLinkOwnership,bootstrap,learnerToken,legacyKey});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();
})();