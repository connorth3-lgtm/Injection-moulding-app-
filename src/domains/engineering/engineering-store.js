/* MouldMaster engineering domain store v3 — 2026.09.03 */
(function(){
'use strict';
if(window.MM_ENGINEERING_STORE)return;

const VERSION='2026.09.29.6';
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
    archivedAt:input.archivedAt?String(input.archivedAt):null,
    archiveReason:String(input.archiveReason||''),
    legacySource:input.legacySource||null
  };
}

async function saveCase(input,{token=null,allowForeignId=false,allowArchivedRestore=false}={}){
  const owner=tokenValue(token||input?.learnerToken),record=normalizeCase({...input,learnerToken:owner});
  const prior=await getRaw('cases',record.id);
  if(prior&&String(prior.learnerToken)!==owner&&!allowForeignId)throw new Error('Engineering case belongs to a different learner profile');
  if(prior?.archivedAt&&!allowArchivedRestore)throw new Error('Archived engineering cases are immutable; restore by importing a new case bundle');
  record.createdAt=String(prior?.createdAt||record.createdAt||now());record.updatedAt=now();
  return put('cases',record)
}
async function listCases(token=learnerToken()){return (await getAllByIndex('cases','learnerToken',tokenValue(token))).filter(x=>!x.archivedAt).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
async function getCase(id,token=learnerToken(),{includeArchived=false}={}){const record=await getRaw('cases',String(id));return record&&String(record.learnerToken)===tokenValue(token)&&(includeArchived||!record.archivedAt)?record:null}
async function archiveCase(id,reason='Archived from Mould Master workspace',token=learnerToken()){
  const owner=tokenValue(token),record=await getCase(id,owner);if(!record)return false;
  const archivedAt=now(),archived=normalizeCase({...record,status:'Archived',archivedAt,archiveReason:String(reason||'Archived from Mould Master workspace'),updatedAt:archivedAt,learnerToken:owner});
  const audit=normalizeEvidenceAudit({action:'case-archive',reason:archived.archiveReason,recordedAt:archivedAt},String(id),owner);
  const db=await openDb(),tx=db.transaction(['cases','caseEvidence'],'readwrite');
  tx.objectStore('cases').put(archived);
  tx.objectStore('caseEvidence').add(audit);
  await txDone(tx);db.close();return true
}
async function deleteCase(id,token=learnerToken()){return archiveCase(id,'Archived through legacy delete API',token)}

async function linkCase(caseId,kind,targetId,meta={},token=learnerToken()){
  if(!caseId||!kind||!targetId)throw new Error('caseId, kind and targetId are required');
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case for active learner: ${caseId}`);
  const id=`${caseId}::${kind}::${targetId}`;
  const record={id,caseId:String(caseId),learnerToken:owner,kind:String(kind),targetId:String(targetId),meta:{...meta},updatedAt:now()};
  await put('caseLinks',record);return record
}
async function linksForCase(caseId,token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner,{includeArchived:true});if(!c)return[];
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
const EVIDENCE_REQUIRED=Object.freeze({
  'controlled-trial':['title','sourceRef','result'],
  'dimensional-check':['title','sourceRef','measurement','unit','methodRef','result'],
  'defect-observation':['title','sourceRef','result'],
  'maintenance-event':['title','sourceRef','result'],
  'material-lot':['title','sourceRef','materialLot'],
  'acceptance-check':['title','sourceRef','result','acceptanceBasis']
});
function evidenceCompleteness(input={}){
  const kind=EVIDENCE_KINDS.includes(String(input.kind||''))?String(input.kind):'controlled-trial';
  const required=[...(EVIDENCE_REQUIRED[kind]||[])];
  if(['accepted','rejected'].includes(String(input.acceptanceStatus||''))&&!required.includes('acceptanceBasis'))required.push('acceptanceBasis');
  const missing=required.filter(key=>!String(input[key]??'').trim());
  return {kind,required,missing,complete:missing.length===0}
}
function normalizeCaseEvidence(input={},caseRecord={},owner=learnerToken()){
  const kind=EVIDENCE_KINDS.includes(String(input.kind||''))?String(input.kind):'controlled-trial';
  const acceptanceStatus=ACCEPTANCE_STATES.includes(String(input.acceptanceStatus||''))?String(input.acceptanceStatus):'not-assessed';
  const record={
    schemaVersion:2,
    recordType:'evidence',
    id:String(input.id||uid('evidence')),
    caseId:String(input.caseId||caseRecord.id||''),
    learnerToken:String(owner),
    kind,
    occurredAt:String(input.occurredAt||now()),
    recordedAt:String(input.recordedAt||now()),
    updatedAt:String(input.updatedAt||now()),
    title:String(input.title||''),
    sourceRef:String(input.sourceRef||''),
    materialLot:String(input.materialLot||''),
    measurement:String(input.measurement||''),
    unit:String(input.unit||''),
    methodRef:String(input.methodRef||''),
    result:String(input.result||''),
    acceptanceStatus,
    acceptanceBasis:String(input.acceptanceBasis||''),
    notes:String(input.notes||''),
    revisionOf:input.revisionOf?String(input.revisionOf):null,
    importedLegacy:Boolean(input.importedLegacy),
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
  const completeness=evidenceCompleteness(record);
  record.complete=completeness.complete;record.missingFields=completeness.missing;
  return record
}
function normalizeEvidenceAudit(input={},caseId='',owner=learnerToken()){
  return {
    schemaVersion:2,recordType:'audit',id:String(input.id||uid('evidence-audit')),caseId:String(caseId),
    learnerToken:String(owner),action:String(input.action||''),targetEvidenceId:String(input.targetEvidenceId||''),
    reason:String(input.reason||''),recordedAt:String(input.recordedAt||now()),updatedAt:String(input.recordedAt||now())
  }
}
async function saveCaseEvidence(caseId,input={},token=learnerToken(),{allowLegacyIncomplete=false}={}){
  const owner=tokenValue(token),c=await getCase(caseId,owner);if(!c)throw new Error(`Unknown engineering case ${caseId}`);
  const record=normalizeCaseEvidence({...input,caseId},c,owner),prior=await getRaw('caseEvidence',record.id);
  if(prior)throw new Error('Engineering evidence is append-only; create a revision instead of overwriting an existing record');
  if(!record.complete&&!allowLegacyIncomplete)throw new Error(`Evidence record is incomplete: ${record.missingFields.join(', ')}`);
  return put('caseEvidence',record)
}
async function evidenceRows(caseId,owner){return (await getAllByIndex('caseEvidence','caseId',String(caseId))).filter(x=>String(x.learnerToken)===owner)}
async function listCaseEvidence(caseId,token=learnerToken(),{includeVoided=true}={}){
  const owner=tokenValue(token),c=await getCase(caseId,owner,{includeArchived:true});if(!c)return[];
  const rows=await evidenceRows(caseId,owner),audits=rows.filter(x=>x.recordType==='audit'),voided=new Map();
  for(const action of audits)if(action.action==='void'&&action.targetEvidenceId)voided.set(String(action.targetEvidenceId),action);
  return rows.filter(x=>x.recordType!=='audit').map(x=>{
    const completeness=evidenceCompleteness(x),voidAction=voided.get(String(x.id));
    return {...x,complete:completeness.complete,missingFields:completeness.missing,voided:Boolean(voidAction),voidReason:voidAction?.reason||'',voidedAt:voidAction?.recordedAt||null}
  }).filter(x=>includeVoided||!x.voided).sort((a,b)=>String(b.occurredAt||b.recordedAt).localeCompare(String(a.occurredAt||a.recordedAt)))
}
async function evidenceAuditTrail(caseId,token=learnerToken()){
  const owner=tokenValue(token),c=await getCase(caseId,owner,{includeArchived:true});if(!c)return[];
  return (await evidenceRows(caseId,owner)).filter(x=>x.recordType==='audit').sort((a,b)=>String(a.recordedAt).localeCompare(String(b.recordedAt)))
}
async function voidCaseEvidence(id,reason='',token=learnerToken()){
  const owner=tokenValue(token),record=await getRaw('caseEvidence',String(id));
  if(!record||record.recordType==='audit'||String(record.learnerToken)!==owner)return false;
  if(!String(reason||'').trim())throw new Error('A reason is required to void an evidence record');
  const existing=(await evidenceAuditTrail(record.caseId,owner)).find(x=>x.action==='void'&&x.targetEvidenceId===String(id));
  if(existing)return existing;
  return put('caseEvidence',normalizeEvidenceAudit({action:'void',targetEvidenceId:String(id),reason:String(reason).trim()},record.caseId,owner))
}
async function reviseCaseEvidence(id,changes={},token=learnerToken()){
  const owner=tokenValue(token),prior=await getRaw('caseEvidence',String(id));
  if(!prior||prior.recordType==='audit'||String(prior.learnerToken)!==owner)throw new Error('Evidence record unavailable for revision');
  return saveCaseEvidence(prior.caseId,{...prior,...changes,id:uid('evidence'),recordedAt:now(),updatedAt:now(),revisionOf:prior.id},owner)
}
async function deleteCaseEvidence(id,token=learnerToken()){return voidCaseEvidence(id,'Voided through legacy delete API',token)}
async function evidenceSummary(caseId,token=learnerToken()){
  const items=await listCaseEvidence(caseId,token),active=items.filter(x=>!x.voided),byKind={},acceptance={};
  for(const item of active){byKind[item.kind]=(byKind[item.kind]||0)+1;acceptance[item.acceptanceStatus]=(acceptance[item.acceptanceStatus]||0)+1}
  return {caseId:String(caseId),count:items.length,activeCount:active.length,voidedCount:items.length-active.length,completeCount:active.filter(x=>x.complete).length,incompleteCount:active.filter(x=>!x.complete).length,byKind,acceptance,latestAt:active[0]?.occurredAt||null,boundary:'Counts describe recorded evidence only; completeness and acceptance still require human/site review.'}
}
function validateCaseBundle(bundle){
  if(!bundle||typeof bundle!=='object'||![3,4].includes(Number(bundle.schema)))throw new Error('Unsupported MouldMaster case export schema');
  if(!bundle.case||typeof bundle.case!=='object')throw new Error('Case export is missing its case record');
  if(!Array.isArray(bundle.evidence)||bundle.evidence.length>500)throw new Error('Case export evidence collection is invalid or too large');
  if(bundle.links!=null&&(!Array.isArray(bundle.links)||bundle.links.length>100))throw new Error('Case export link collection is invalid or too large');
  if(bundle.evidenceAudit!=null&&(!Array.isArray(bundle.evidenceAudit)||bundle.evidenceAudit.length>500))throw new Error('Case export audit collection is invalid or too large');
  const legacy=Number(bundle.schema)===3;
  const evidence=bundle.evidence.map(row=>{
    if(!row||typeof row!=='object'||row.recordType==='audit')throw new Error('Case export contains an invalid evidence record');
    if(!EVIDENCE_KINDS.includes(String(row.kind||'')))throw new Error(`Case export contains unknown evidence kind: ${String(row.kind||'')}`);
    const normalized=normalizeCaseEvidence({...row,importedLegacy:legacy||Boolean(row.importedLegacy)},bundle.case,'IMPORT-PREFLIGHT');
    if(!normalized.complete&&!legacy)throw new Error(`Case export contains incomplete evidence: ${normalized.missingFields.join(', ')}`);
    return normalized
  });
  const audit=(Array.isArray(bundle.evidenceAudit)?bundle.evidenceAudit:[]).map(row=>{
    if(!row||typeof row!=='object'||row.recordType!=='audit'||!['void'].includes(String(row.action||''))||!row.targetEvidenceId)throw new Error('Case export contains an invalid evidence audit record');
    return {...row}
  });
  return {schema:Number(bundle.schema),legacy,caseRecord:normalizeCase(bundle.case),evidence,audit,links:Array.isArray(bundle.links)?bundle.links:[]}
}
async function importCaseBundle(bundle,token=learnerToken()){
  const owner=tokenValue(token),validated=validateCaseBundle(bundle),newId=uid('case-import'),importedAt=now();
  const caseRecord=normalizeCase({...validated.caseRecord,id:newId,learnerToken:owner,createdAt:importedAt,updatedAt:importedAt,legacySource:`case-export-v${validated.schema}:${validated.caseRecord.id||'unknown'}`});
  const idMap=new Map(validated.evidence.map(row=>[String(row.id),uid('evidence')]));
  const evidence=validated.evidence.map(row=>normalizeCaseEvidence({...row,id:idMap.get(String(row.id)),caseId:newId,learnerToken:owner,recordedAt:row.recordedAt||importedAt,updatedAt:importedAt,revisionOf:row.revisionOf?(idMap.get(String(row.revisionOf))||null):null,importedLegacy:validated.legacy||Boolean(row.importedLegacy)},caseRecord,owner));
  const audit=validated.audit.map(row=>normalizeEvidenceAudit({...row,id:uid('evidence-audit'),targetEvidenceId:idMap.get(String(row.targetEvidenceId))||''},newId,owner)).filter(row=>row.targetEvidenceId);
  const contextLinks=[
    ['material-grade',caseRecord.materialGradeId,caseRecord.material],['machine',caseRecord.machineId,caseRecord.machine],
    ['mould',caseRecord.mouldId,caseRecord.mould],['product',caseRecord.productId,caseRecord.product],['part',caseRecord.partId,caseRecord.part]
  ].filter(([,id])=>id).map(([kind,targetId,displayName])=>({id:`${newId}::${kind}::${targetId}`,caseId:newId,learnerToken:owner,kind,targetId:String(targetId),meta:{displayName:String(displayName||'')},updatedAt:importedAt}));
  const db=await openDb(),tx=db.transaction(['cases','caseLinks','caseEvidence'],'readwrite');
  tx.objectStore('cases').add(caseRecord);
  for(const link of contextLinks)tx.objectStore('caseLinks').put(link);
  for(const row of evidence)tx.objectStore('caseEvidence').add(row);
  for(const row of audit)tx.objectStore('caseEvidence').add(row);
  await txDone(tx);db.close();
  return {caseId:newId,sourceCaseId:String(validated.caseRecord.id||''),schema:validated.schema,evidenceImported:evidence.length,auditImported:audit.length,linksImported:contextLinks.length,legacyEvidence:validated.legacy,importedAt,destructive:false}
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

window.MM_ENGINEERING_STORE=Object.freeze({version:VERSION,dbName:DB_NAME,dbVersion:DB_VERSION,normalizeCase,saveCase,listCases,getCase,archiveCase,deleteCase,linkCase,linksForCase,linkCaseMaterial,linkCaseMachine,linkCaseMould,linkCaseProduct,linkCasePart,linkCaseContext,linkCaseDataset,normalizeCaseEvidence,evidenceCompleteness,saveCaseEvidence,listCaseEvidence,evidenceAuditTrail,voidCaseEvidence,reviseCaseEvidence,deleteCaseEvidence,evidenceSummary,validateCaseBundle,importCaseBundle,evidenceKinds:EVIDENCE_KINDS,acceptanceStates:ACCEPTANCE_STATES,importLegacyCases,migrateLegacyMouldMasterCases,repairLegacyLinkOwnership,bootstrap,learnerToken,legacyKey});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();
})();