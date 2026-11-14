/* MouldMaster connected process-data runtime — 2026.09.15.4 */
(function(){
'use strict';

const VERSION='2026.11.08.1';
const DB_NAME='mouldmaster-process-data-v1';
const DB_VERSION=1;
const MAX_ROWS=50000;
const MAX_CSV_BYTES=10*1024*1024;
const ROLE_OPTIONS=['unresolved','actual','setpoint','command','state','quality','derived','structural'];
const SAMPLING_OPTIONS=['unknown','per-cycle','trace-sample','event','batch'];
const BLOCKING_SEMANTIC_KINDS=new Set(['unresolved']);
const CONTEXT_KEYS=['machine','mould','materialGrade','job'];
let semanticRegistry=null;
let currentManifest=null;
let installQueued=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeToken(v,max=96){return String(v??'').replace(/[^a-zA-Z0-9:_\-. /]/g,'').slice(0,max)}
function uid(prefix='id'){try{return `${prefix}-${crypto.randomUUID()}`}catch(_){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}}
function num(v){if(v==null)return null;if(typeof v==='string'&&!v.trim())return null;const n=Number(v);return Number.isFinite(n)?n:null}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function variance(a,m=mean(a)){if(a.length<2||m==null)return 0;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}
function stats(values){
  const a=values.map(num).filter(x=>x!==null).sort((x,y)=>x-y),m=mean(a),sd=Math.sqrt(variance(a,m));
  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};
}
function referenceScale(summary){
  if(!summary||Number(summary.n)<2)return null;
  const sdv=Math.abs(num(summary.sd)??0),q1=num(summary.q1),q3=num(summary.q3);
  const robust=q1!==null&&q3!==null?Math.abs(q3-q1)/1.349:0,scale=Math.max(sdv,robust);
  return Number.isFinite(scale)&&scale>0?scale:null;
}
function scoreSort(field){return (a,b)=>{const av=num(a?.[field]),bv=num(b?.[field]);if(av===null&&bv===null)return String(a.channel||'').localeCompare(String(b.channel||''));if(av===null)return 1;if(bv===null)return -1;return bv-av}}
function roleToKind(role){
  return ({actual:'direct-measurement',setpoint:'command-signal',command:'command-signal',state:'state-signal',quality:'quality-measurement',derived:'derived-feature',structural:'structural',unresolved:'unresolved'})[role]||'unresolved';
}
function format(n,d=3){const v=num(n);return v===null?'—':v.toLocaleString(undefined,{maximumFractionDigits:d})}
function normContext(value){return String(value??'').trim().toLowerCase()}
function contextCompatibility(left={},right={}){
  const missing=[],mismatched=[];
  for(const key of CONTEXT_KEYS){
    const a=normContext(left?.[key]),b=normContext(right?.[key]);
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

async function loadJson(url){
  const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw new Error(`${url} returned ${r.status}`);
  return r.json();
}
async function loadPublicMetadata(){
  const [registry,manifest]=await Promise.all([
    loadJson('./process-data-semantic-registry.json').catch(()=>null),
    loadJson('./current-data-manifest.json').catch(()=>null)
  ]);
  if(registry)semanticRegistry=registry;
  if(manifest)currentManifest=manifest;
  return {registry:semanticRegistry,manifest:currentManifest};
}

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('datasets'))db.createObjectStore('datasets',{keyPath:'id'});
      if(!db.objectStoreNames.contains('shots')){
        const s=db.createObjectStore('shots',{keyPath:'id'});
        s.createIndex('datasetId','datasetId',{unique:false});
        s.createIndex('machine','machine',{unique:false});
        s.createIndex('mould','mould',{unique:false});
        s.createIndex('materialGrade','materialGrade',{unique:false});
      }
      if(!db.objectStoreNames.contains('baselines'))db.createObjectStore('baselines',{keyPath:'id'});
      if(!db.objectStoreNames.contains('caseLinks'))db.createObjectStore('caseLinks',{keyPath:'caseId'});
      if(!db.objectStoreNames.contains('interventions'))db.createObjectStore('interventions',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
  });
}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction aborted'))})}
async function put(storeName,value){
  const db=await openDb();const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(value);await txDone(tx);db.close();return value;
}
async function get(storeName,key){
  const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),r=tx.objectStore(storeName).get(key);r.onsuccess=()=>{resolve(r.result||null);db.close()};r.onerror=()=>{reject(r.error);db.close()}})
}
async function getAll(storeName){
  const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),r=tx.objectStore(storeName).getAll();r.onsuccess=()=>{resolve(r.result||[]);db.close()};r.onerror=()=>{reject(r.error);db.close()}})
}
async function rowsForDataset(datasetId){
  const db=await openDb();return new Promise((resolve,reject)=>{
    const tx=db.transaction('shots','readonly'),idx=tx.objectStore('shots').index('datasetId'),r=idx.getAll(IDBKeyRange.only(datasetId));
    r.onsuccess=()=>{const rows=(r.result||[]).sort((a,b)=>Number(a.rowOrdinal??a.shotIndex)-Number(b.rowOrdinal??b.shotIndex)||Number(a.shotIndex)-Number(b.shotIndex)).map(x=>x.values);resolve(rows);db.close()};
    r.onerror=()=>{reject(r.error);db.close()}
  })
}
function deleteCursorMatches(request,match){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return}if(match(cursor.value))cursor.delete();cursor.continue()};
    request.onerror=()=>reject(request.error||new Error('IndexedDB cursor failed'));
  });
}
async function countStore(db,storeName){return new Promise((resolve,reject)=>{const req=db.transaction(storeName,'readonly').objectStore(storeName).count();req.onsuccess=()=>resolve(Number(req.result)||0);req.onerror=()=>reject(req.error||new Error(`Could not count ${storeName}`))})}
async function deleteDataset(id){
  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');
  const db=await openDb();
  try{
    const tx=db.transaction(['datasets','shots','baselines','caseLinks','interventions'],'readwrite');
    tx.objectStore('datasets').delete(datasetId);
    const shots=tx.objectStore('shots').index('datasetId');
    await deleteCursorMatches(shots.openCursor(IDBKeyRange.only(datasetId)),()=>true);
    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);
    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);
    await deleteCursorMatches(tx.objectStore('interventions').openCursor(),row=>row?.datasetId===datasetId);
    await txDone(tx);return true;
  }finally{db.close()}
}
async function deleteAllProcessData(){
  const stores=['datasets','shots','baselines','caseLinks','interventions'],db=await openDb();
  try{const tx=db.transaction(stores,'readwrite');for(const store of stores)tx.objectStore(store).clear();await txDone(tx)}finally{db.close()}
  const verifyDb=await openDb();
  try{const counts={};for(const store of stores)counts[store]=await countStore(verifyDb,store);const remaining=Object.values(counts).reduce((a,b)=>a+b,0);if(remaining)throw new Error(`Process-data reset verification failed: ${JSON.stringify(counts)}`);return Object.freeze({verified:true,counts})}finally{verifyDb.close()}
}

function knownDefinition(column){
  const defs=semanticRegistry?.channels||{};
  if(Object.prototype.hasOwnProperty.call(defs,column))return {...defs[column]};
  const lower=String(column||'').toLowerCase();
  let role='unresolved',unit=null,meaning='',sampling_basis='unknown',confidence='low';
  if(/(?:^|_)(?:setpoint|set_point|target|command|cmd)(?:_|$)/.test(lower)){role='command';confidence='medium'}
  else if(/(?:^|_)(?:actual|measured|feedback|pv)(?:_|$)/.test(lower)){role='actual';confidence='medium'}
  else if(/(?:^|_)(?:state|phase)(?:_|$)/.test(lower)){role='state';confidence='medium'}
  else if(/(?:quality|mass|weight|dimension|reject|defect)/.test(lower)){role='quality';confidence='medium'}
  const suffixes=[
    [/_mpa$/,'MPa'],[/_bar$/,'bar'],[/_mm$/,'mm'],[/_cm3_s$/,'cm3/s'],[/_cm3$/,'cm3'],[/_ms$/,'ms'],[/_s$/,'s'],
    [/_degc$/,'°C'],[/_temp_c$/,'°C'],[/_c$/,'°C'],[/_g$/,'g'],[/_kg$/,'kg'],[/_lmin$/,'L/min'],[/_pct$/,'%'],[/_percent$/,'%']
  ];
  for(const [re,u] of suffixes)if(re.test(lower)){unit=u;break}
  return {canonical_quantity:lower,meaning,role,kind:roleToKind(role),actualness:role==='actual'?'actual':role==='setpoint'?'setpoint':role==='command'?'command':'unresolved',unit,sampling_basis,confidence,source:'heuristic',status:role==='unresolved'?'unresolved':'needs-confirmation'};
}
function semanticFor(column,override={}){
  const base=knownDefinition(column);
  const role=override.role||base.role||'unresolved';
  const unit=(override.unit??base.unit??'')||null;
  const meaning=(override.meaning??base.meaning??'').trim();
  const sampling_basis=override.sampling_basis||base.sampling_basis||'unknown';
  const dynamicUnitColumn=base.unit_from_column||null;
  const blockers=[];
  if(role==='unresolved')blockers.push('role');
  if(!meaning&&!base.meaning&&role!=='structural')blockers.push('meaning');
  if(role!=='structural'&&role!=='state'&&!unit&&!dynamicUnitColumn)blockers.push('unit');
  if(['actual','derived','quality'].includes(role)&&sampling_basis==='unknown')blockers.push('sampling_basis');
  return {
    column,
    canonical_quantity:override.canonical_quantity||base.canonical_quantity||column,
    meaning:meaning||base.meaning||'',
    role,
    kind:roleToKind(role),
    actualness:role==='actual'||role==='derived'||role==='quality'?'actual':role==='setpoint'?'setpoint':role==='command'?'command':'not-applicable',
    unit,
    unit_from_column:dynamicUnitColumn,
    sampling_basis,
    phase:override.phase||base.phase||null,
    sensor_ref:safeToken(override.sensor_ref||'',72)||null,
    calibration_ref:safeToken(override.calibration_ref||'',72)||null,
    missing_rule:override.missing_rule||'blank-is-missing',
    confidence:override.role||override.unit||override.meaning?'user-declared':(base.confidence||'low'),
    source:override.role||override.unit||override.meaning?'local-user-declaration':(base.source||'heuristic'),
    blockers:[...new Set(blockers)]
  };
}
function enrichPrepared(prepared,overrides={},datasetMeta={}){
  const rows=prepared?.rows||[],rules=prepared?.rules||[];
  const numeric=rules.filter(x=>x.action==='keep').map(x=>x.key);
  const semantics={};
  const issues=[];
  for(const key of numeric){
    const override=Object.prototype.hasOwnProperty.call(overrides,key)?overrides[key]:{};
    const sem=semanticFor(key,override&&typeof override==='object'&&!Array.isArray(override)?override:{});
    semantics[key]=sem;
    const vals=rows.map(r=>r[key]),present=vals.filter(v=>v!==''&&v!=null),finite=present.map(Number).filter(Number.isFinite),s=stats(finite);
    const missing=rows.length-present.length,invalid=present.length-finite.length,missingRate=rows.length?missing/rows.length:1;
    const channelIssues=[];
    if(sem.blockers.length)channelIssues.push({level:'block',code:'semantic-unresolved',detail:`Missing ${sem.blockers.join(', ')}`});
    if(invalid)channelIssues.push({level:'block',code:'non-numeric-values',detail:`${invalid} non-numeric retained values`});
    if(missingRate>.2)channelIssues.push({level:'warn',code:'high-missingness',detail:`${Math.round(missingRate*100)}% missing`});
    if(finite.length>1&&s.sd===0)channelIssues.push({level:'warn',code:'constant-channel',detail:'No variation in available rows'});
    if(sem.role==='actual'&&!sem.calibration_ref)channelIssues.push({level:'note',code:'calibration-unlinked',detail:'No local calibration reference recorded'});
    for(const x of channelIssues)issues.push({channel:key,...x});
    sem.profile={rows:rows.length,present:present.length,missing,missingRate,invalid,...s};
  }
  if(prepared?.sequence?.reviewRequired)for(const w of prepared.sequence.warnings||[])issues.push({channel:'sequence',level:'block',code:'sequence-review',detail:w});
  if(prepared?.validation?.reviewRequired){
    const byColumn=(prepared.validation.invalidNumericByColumn||[]).filter(x=>Number(x?.count)>0).map(x=>`${x.column}: ${x.count}`).join(', ');
    const detail=prepared.validation.note||`Prepared intake requires review${byColumn?` (${byColumn})`:''}.`;
    issues.push({channel:'intake',level:'block',code:'prepared-data-review',detail});
  }
  const blocking=issues.filter(x=>x.level==='block');
  const warnings=issues.filter(x=>x.level==='warn');
  const meta={
    source_label:safeToken(datasetMeta.source_label||'',96),
    confidentiality:['local-confidential','internal-approved','public-cleared'].includes(datasetMeta.confidentiality)?datasetMeta.confidentiality:'local-confidential',
    machine_context:safeToken(datasetMeta.machine_context||'',72),
    mould_context:safeToken(datasetMeta.mould_context||'',72),
    material_context:safeToken(datasetMeta.material_context||'',72),
    job_context:safeToken(datasetMeta.job_context||'',72),
    notes_boundary:'Engineering metadata only. Do not enter names, emails, customer names, employee IDs or other personal identifiers.'
  };
  return {...prepared,schema:3,semanticVersion:semanticRegistry?.version||VERSION,semantics,quality:{analysisReady:blocking.length===0,blockingCount:blocking.length,warningCount:warnings.length,issues},datasetMeta:meta,boundary:`${prepared.boundary||''} Analysis readiness is fail-closed and evaluated separately from privacy preparation; unresolved intake review states, roles, units, meanings, sampling bases or sequence warnings block process intelligence until resolved.`};
}

function publicDatasetRecord(prepared,id){
  const first=prepared.rows?.[0]||{};
  return {
    id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    rowCount:prepared.rows?.length||0,headers:prepared.headers||[],
    semantics:prepared.semantics||{},quality:prepared.quality||{},datasetMeta:prepared.datasetMeta||{},
    entities:{
      machine:first.machine||first.machine_id||prepared.datasetMeta?.machine_context||null,
      mould:first.mould||first.mold||first.tool||prepared.datasetMeta?.mould_context||null,
      materialGrade:first.material_grade||first.resin_grade||prepared.datasetMeta?.material_context||null,
      job:first.job||first.work_order||prepared.datasetMeta?.job_context||null
    },
    evidenceState:'site-local-measured-prepared',
    authority:'Local evidence dataset only; not a validated production recipe or universal process window.'
  };
}
async function savePrepared(prepared){
  if(!prepared?.rows?.length)throw new Error('No prepared rows');
  const id=uid('dataset'),record=publicDatasetRecord(prepared,id),db=await openDb();
  const tx=db.transaction(['datasets','shots'],'readwrite');
  tx.objectStore('datasets').put(record);
  const shots=tx.objectStore('shots');
  for(let i=0;i<prepared.rows.length;i++){
    const row=prepared.rows[i],rowOrdinal=i+1,sourceShotIndex=row.shot_index??null,parsedShotIndex=Number(sourceShotIndex);
    shots.put({
      id:`${id}:row:${rowOrdinal}`,datasetId:id,rowOrdinal,
      sourceShotIndex:sourceShotIndex==null?null:String(sourceShotIndex),
      shotIndex:Number.isFinite(parsedShotIndex)?parsedShotIndex:rowOrdinal,
      machine:row.machine||row.machine_id||record.entities.machine||'',
      mould:row.mould||row.mold||row.tool||record.entities.mould||'',
      materialGrade:row.material_grade||row.resin_grade||record.entities.materialGrade||'',
      cavity:row.cavity||'',intervention:row.intervention_code||row.intervention||'',values:row
    });
  }
  await txDone(tx);db.close();
  window.MM_LEARNING_ANALYTICS?.record?.('process_dataset_saved',{module:'process-data',id,score:prepared.quality?.analysisReady?100:0});
  return record;
}
async function listDatasets(){return (await getAll('datasets')).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}

function resolvedNumericSemantics(semantics){
  return Object.values(semantics||{}).filter(s=>!BLOCKING_SEMANTIC_KINDS.has(s.kind)&&['actual','derived','quality'].includes(s.role)&&s.blockers?.length===0);
}
function summarizeRows(rows,semantics){
  const out={};for(const sem of resolvedNumericSemantics(semantics)){const values=rows.map(r=>r[sem.column]);out[sem.column]={...stats(values),unit:sem.unit,role:sem.role,meaning:sem.meaning,canonical_quantity:sem.canonical_quantity}}
  return out;
}
async function createBaseline(datasetId,label='Known-good local baseline'){
  const record=await get('datasets',datasetId);if(!record)throw new Error('Dataset not found');
  if(!record.quality?.analysisReady)throw new Error('Dataset has unresolved analysis-readiness blockers');
  const rows=await rowsForDataset(datasetId),summary=summarizeRows(rows,record.semantics);
  const baseline={id:uid('baseline'),datasetId,label:safeToken(label,96),createdAt:new Date().toISOString(),entities:record.entities,summary,rowCount:rows.length,boundary:'Statistical site-local reference only. Attention signals are not machine safety limits, acceptance limits or validated process windows.'};
  await put('baselines',baseline);return baseline;
}
async function compareToBaseline(datasetId,baselineId){
  const [record,baseline]=await Promise.all([get('datasets',datasetId),get('baselines',baselineId)]);
  if(!record||!baseline)throw new Error('Dataset or baseline not found');
  assertBaselineCompatible(record,baseline);
  if(!record.quality?.analysisReady)throw new Error('Dataset has unresolved analysis-readiness blockers');
  const rows=await rowsForDataset(datasetId),cur=summarizeRows(rows,record.semantics),signals=[];
  for(const [key,b] of Object.entries(baseline.summary||{})){
    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;
    const scale=referenceScale(b),normalizedShift=scale===null?null:Math.abs(c.mean-b.mean)/scale;
    const variabilityRatio=num(b.sd)>0?(num(c.sd)??0)/num(b.sd):null;
    const level=normalizedShift===null?'unscored':normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';
    const scoreReason=Number(b.n)<2?'insufficient-reference-observations':scale===null?'zero-reference-spread':null;
    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,baselineN:Number(b.n)||0,currentN:Number(c.n)||0,normalizedShift,variabilityRatio,level,scoreReason});
  }
  return {datasetId,baselineId,signals:signals.sort(scoreSort('normalizedShift')),boundary:'Drift scores compare this site-local dataset with its selected baseline. Channels with fewer than two reference observations or no positive reference spread remain explicitly unscored. Scored values are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};
}
function compareWindows(rows,semantics,splitIndex,windowSize=20){
  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));
  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];
  for(const key of Object.keys(a)){
    if(!b[key]||a[key].mean==null||b[key].mean==null)continue;
    const beforeN=Number(a[key].n)||0,afterN=Number(b[key].n)||0,scale=beforeN>=2&&afterN>=2?referenceScale(a[key]):null;
    const normalizedChange=scale===null?null:Math.abs(b[key].mean-a[key].mean)/scale;
    const scoreReason=beforeN<2||afterN<2?'insufficient-window-observations':scale===null?'zero-before-spread':null;
    changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,beforeN,afterN,normalizedChange,scoreReason});
  }
  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort(scoreSort('normalizedChange')),boundary:'Before/after comparison supports controlled-test evidence. Channels with fewer than two finite observations on either side or no positive before-window spread remain explicitly unscored. Association with an intervention does not by itself prove causality.'};
}

async function linkCase(caseId,link){
  const existing=await get('caseLinks',caseId)||{caseId,createdAt:new Date().toISOString()};
  const next={...existing,...link,caseId,updatedAt:new Date().toISOString()};
  await put('caseLinks',next);return next;
}
async function caseLink(caseId){return get('caseLinks',caseId)}
function caseTokens(c){return new Set(String([c?.defect,c?.material,c?.materialGradeId,c?.machine,c?.machineId,c?.mould,c?.mouldId,c?.product,c?.productId,c?.part,c?.partId,c?.title,c?.evidence,c?.hypothesis].filter(Boolean).join(' ')).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(x=>x.length>2))}
function sameIdentity(a,b,key){return Boolean(a?.[key]&&b?.[key]&&String(a[key])===String(b[key]))}
async function similarCases(caseId){
  const api=window.MM_MOULD_MASTER_WORKSPACE,current=api?.getCase?.(caseId);if(!current)return[];
  const all=api.cases?.()||[],ct=caseTokens(current),cl=await caseLink(caseId),out=[];
  for(const c of all){
    if(c.id===caseId)continue;
    const t=caseTokens(c);let score=0;
    for(const x of ct)if(t.has(x))score++;
    if(sameIdentity(current,c,'materialGradeId'))score+=4;
    if(sameIdentity(current,c,'machineId'))score+=4;
    if(sameIdentity(current,c,'mouldId'))score+=5;
    if(sameIdentity(current,c,'productId'))score+=3;
    if(sameIdentity(current,c,'partId'))score+=5;
    const l=await caseLink(c.id);
    if(cl?.datasetId&&l?.datasetId===cl.datasetId)score+=4;
    if(cl?.machine&&l?.machine===cl.machine)score+=2;
    if(cl?.mould&&l?.mould===cl.mould)score+=3;
    if(cl?.materialGrade&&l?.materialGrade===cl.materialGrade)score+=2;
    if(score>0)out.push({caseId:c.id,title:c.title||c.defect||'Untitled case',score,link:l||null,context:{materialGradeId:c.materialGradeId||null,machineId:c.machineId||null,mouldId:c.mouldId||null,productId:c.productId||null,partId:c.partId||null}})
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,6);
}

function patchIntakeApi(){
  const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(!api||api.__mmConnectedData)return;
  api.__rawPrepare=api.prepare;
  api.prepare=function(parsed,overrides={},meta={}){return enrichPrepared(api.__rawPrepare(parsed),overrides,meta)};
  api.enrich=enrichPrepared;api.savePrepared=savePrepared;api.listDatasets=listDatasets;api.__mmConnectedData=true;
}
function patchWorkspaceApi(){
  const api=window.MM_MOULD_MASTER_WORKSPACE;if(!api||api.__mmConnectedData)return;
  api.linkData=linkCase;api.getDataLink=caseLink;api.similarCases=similarCases;api.__mmConnectedData=true
}
function scheduleInstall(){
  if(installQueued)return;installQueued=true;requestAnimationFrame(()=>{installQueued=false;patchIntakeApi();patchWorkspaceApi()})
}
async function install(){
  await loadPublicMetadata();patchIntakeApi();patchWorkspaceApi();
  window.addEventListener?.('mm:domains-ready',scheduleInstall);
  window.MM_APP_SHELL?.events?.onViewChange?.(scheduleInstall);
  scheduleInstall()
}

window.MM_CONNECTED_PROCESS_DATA={
  version:VERSION,
  __mmCanonicalProcessDataIntegrity:VERSION,
  loadPublicMetadata,
  semanticRegistry:()=>semanticRegistry,
  currentManifest:()=>currentManifest,
  enrichPrepared,
  storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset,deleteAllProcessData},
  intelligence:{createBaseline,compareToBaseline,baselineCompatibility,contextCompatibility,assertBaselineCompatible,compareWindows,summarizeRows},
  diagnostics:{num,stats,referenceScale},
  cases:{linkCase,caseLink,similarCases},
  scope:'Local-first connected process-data infrastructure. It distinguishes privacy preparation from semantic readiness, stores prepared site data in IndexedDB, provides site-local statistical evidence comparisons, and never creates universal production limits, causal proof or machine-control authority.'
};

install().catch(err=>{console.error('MouldMaster connected process-data runtime failed to initialise',err)});
})();
