/* MouldMaster connected process-data runtime — 2026.09.02.1 */
(function(){
'use strict';

const VERSION='2026.09.02.1';
const DB_NAME='mouldmaster-process-data-v1';
const DB_VERSION=1;
const MAX_ROWS=50000;
const ROLE_OPTIONS=['unresolved','actual','setpoint','command','state','quality','derived','structural'];
const SAMPLING_OPTIONS=['unknown','per-cycle','trace-sample','event','batch'];
const BLOCKING_SEMANTIC_KINDS=new Set(['unresolved']);
let semanticRegistry=null;
let currentManifest=null;
let preparedSession=null;
let activeWorkspaceCaseId='';
let installQueued=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeToken(v,max=96){return String(v??'').replace(/[^a-zA-Z0-9:_\-. /]/g,'').slice(0,max)}
function uid(prefix='id'){try{return `${prefix}-${crypto.randomUUID()}`}catch(_){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function variance(a,m=mean(a)){if(a.length<2||m==null)return 0;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}
function stats(values){
  const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y),m=mean(a),sd=Math.sqrt(variance(a,m));
  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};
}
function roleToKind(role){
  return ({actual:'direct-measurement',setpoint:'command-signal',command:'command-signal',state:'state-signal',quality:'quality-measurement',derived:'derived-feature',structural:'structural',unresolved:'unresolved'})[role]||'unresolved';
}
function format(n,d=3){return Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}

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
    r.onsuccess=()=>{const rows=(r.result||[]).sort((a,b)=>Number(a.shotIndex)-Number(b.shotIndex)).map(x=>x.values);resolve(rows);db.close()};
    r.onerror=()=>{reject(r.error);db.close()}
  })
}
async function deleteDataset(id){
  const db=await openDb();
  try{
    const tx=db.transaction(['datasets','shots','baselines'],'readwrite'),done=txDone(tx);
    tx.objectStore('datasets').delete(id);
    const range=IDBKeyRange.only(id);
    const deleteShots=new Promise((resolve,reject)=>{
      const r=tx.objectStore('shots').index('datasetId').openCursor(range);
      r.onsuccess=()=>{const c=r.result;if(!c){resolve();return}c.delete();c.continue()};
      r.onerror=()=>reject(r.error||new Error('Shot deletion failed'));
    });
    const deleteBaselines=new Promise((resolve,reject)=>{
      const r=tx.objectStore('baselines').openCursor();
      r.onsuccess=()=>{const c=r.result;if(!c){resolve();return}if(c.value.datasetId===id)c.delete();c.continue()};
      r.onerror=()=>reject(r.error||new Error('Baseline deletion failed'));
    });
    await Promise.all([deleteShots,deleteBaselines,done]);
    return true;
  }finally{db.close()}
}

function knownDefinition(column){
  const defs=semanticRegistry?.channels||{};
  if(defs[column])return {...defs[column]};
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
    const sem=semanticFor(key,overrides[key]||{});
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
  return {...prepared,schema:3,semanticVersion:semanticRegistry?.version||VERSION,semantics,quality:{analysisReady:blocking.length===0,blockingCount:blocking.length,warningCount:warnings.length,issues},datasetMeta:meta,boundary:`${prepared.boundary||''} Semantic readiness is evaluated separately from privacy preparation; unresolved roles, units, meanings, sampling bases or sequence warnings block process intelligence until resolved.`};
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
    const row=prepared.rows[i],shotIndex=row.shot_index??i+1;
    shots.put({
      id:`${id}:${shotIndex}`,datasetId:id,shotIndex:Number(shotIndex)||i+1,
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
  if(!record.quality?.analysisReady)throw new Error('Dataset has unresolved semantic or sequence blockers');
  const rows=await rowsForDataset(datasetId),summary=summarizeRows(rows,record.semantics);
  const baseline={id:uid('baseline'),datasetId,label:safeToken(label,96),createdAt:new Date().toISOString(),entities:record.entities,summary,rowCount:rows.length,boundary:'Statistical site-local reference only. Attention signals are not machine safety limits, acceptance limits or validated process windows.'};
  await put('baselines',baseline);return baseline;
}
async function compareToBaseline(datasetId,baselineId){
  const [record,baseline]=await Promise.all([get('datasets',datasetId),get('baselines',baselineId)]);
  if(!record||!baseline)throw new Error('Dataset or baseline not found');
  if(!record.quality?.analysisReady)throw new Error('Dataset has unresolved semantic or sequence blockers');
  const rows=await rowsForDataset(datasetId),cur=summarizeRows(rows,record.semantics),signals=[];
  for(const [key,b] of Object.entries(baseline.summary||{})){
    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;
    const scale=Math.max(Math.abs(Number(b.sd)||0),Math.abs(Number(b.q3)-Number(b.q1))/1.349,1e-9);
    const normalizedShift=Math.abs(c.mean-b.mean)/scale;
    const variabilityRatio=(Number(b.sd)||0)>0?(Number(c.sd)||0)/(Number(b.sd)||0):null;
    const level=normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';
    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,normalizedShift,variabilityRatio,level});
  }
  return {datasetId,baselineId,signals:signals.sort((a,b)=>b.normalizedShift-a.normalizedShift),boundary:'Drift scores compare this site-local dataset with its selected baseline. They are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};
}
function compareWindows(rows,semantics,splitIndex,windowSize=20){
  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));
  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];
  for(const key of Object.keys(a)){if(!b[key]||a[key].mean==null||b[key].mean==null)continue;const scale=Math.max(a[key].sd||0,Math.abs((a[key].q3||0)-(a[key].q1||0))/1.349,1e-9);changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,normalizedChange:Math.abs(b[key].mean-a[key].mean)/scale})}
  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort((x,y)=>y.normalizedChange-x.normalizedChange),boundary:'Before/after comparison supports controlled-test evidence. Association with an intervention does not by itself prove causality.'};
}

async function linkCase(caseId,link){
  const existing=await get('caseLinks',caseId)||{caseId,createdAt:new Date().toISOString()};
  const next={...existing,...link,caseId,updatedAt:new Date().toISOString()};
  await put('caseLinks',next);return next;
}
async function caseLink(caseId){return get('caseLinks',caseId)}
function caseTokens(c){return new Set(String([c?.defect,c?.material,c?.machine,c?.mould,c?.title,c?.evidence,c?.hypothesis].filter(Boolean).join(' ')).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(x=>x.length>2))}
async function similarCases(caseId){
  const api=window.MM_MOULD_MASTER_WORKSPACE,current=api?.getCase?.(caseId);if(!current)return[];
  const all=api.cases?.()||[],ct=caseTokens(current),cl=await caseLink(caseId),out=[];
  for(const c of all){if(c.id===caseId)continue;const t=caseTokens(c);let score=0;for(const x of ct)if(t.has(x))score++;const l=await caseLink(c.id);if(cl?.datasetId&&l?.datasetId===cl.datasetId)score+=4;if(cl?.machine&&l?.machine===cl.machine)score+=2;if(cl?.mould&&l?.mould===cl.mould)score+=3;if(cl?.materialGrade&&l?.materialGrade===cl.materialGrade)score+=2;if(score>0)out.push({caseId:c.id,title:c.title||c.defect||'Untitled case',score,link:l||null})}
  return out.sort((a,b)=>b.score-a.score).slice(0,6);
}

function download(name,text,type='application/json;charset=utf-8'){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
function semanticRowsHtml(p){
  const numeric=p.rules.filter(x=>x.action==='keep').map(x=>x.key);
  if(!numeric.length)return '<div class="di-empty">No predominantly numeric evidence columns were retained.</div>';
  return `<div class="di-semantic-table">${numeric.map(key=>{const s=p.semantics[key];return `<div class="di-sem-row" data-di-channel="${esc(key)}"><div><b>${esc(key)}</b><small>${esc(s.profile?.present||0)}/${esc(s.profile?.rows||0)} values · ${esc(s.source)}</small></div><label>Meaning<input data-di-meaning value="${esc(s.meaning||'')}" placeholder="engineering meaning"></label><label>Role<select data-di-role>${ROLE_OPTIONS.map(x=>`<option value="${x}" ${s.role===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Unit<input data-di-unit value="${esc(s.unit||'')}" placeholder="e.g. MPa"></label><label>Sampling<select data-di-sampling>${SAMPLING_OPTIONS.map(x=>`<option value="${x}" ${s.sampling_basis===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Sensor ref<input data-di-sensor value="${esc(s.sensor_ref||'')}" placeholder="optional local ref"></label><label>Calibration ref<input data-di-calibration value="${esc(s.calibration_ref||'')}" placeholder="optional local ref"></label><div class="di-sem-state ${s.blockers.length?'blocked':'ready'}">${s.blockers.length?`Needs ${esc(s.blockers.join(', '))}`:'Semantically ready'}</div></div>`}).join('')}</div>`;
}
function issuesHtml(p){
  const xs=p.quality?.issues||[];if(!xs.length)return '<div class="di-ok">No semantic, sequence or basic data-quality blockers detected.</div>';
  return `<div class="di-issues">${xs.slice(0,30).map(x=>`<div class="di-issue ${esc(x.level)}"><b>${esc(x.level.toUpperCase())}</b> ${esc(x.channel)} · ${esc(x.detail)}</div>`).join('')}${xs.length>30?`<div class="di-issue note">${xs.length-30} more issues not shown</div>`:''}</div>`;
}
function ensureStyle(){
  if(document.getElementById('mm-data-integration-style'))return;
  const s=document.createElement('style');s.id='mm-data-integration-style';s.textContent=`
  .di-hero,.di-panel{padding:18px}.di-actions{display:flex;gap:8px;flex-wrap:wrap}.di-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.di-note{padding:11px 13px;border:1px solid #66582c;border-radius:10px;background:#282313;color:#f2e6b4;font-size:12px;line-height:1.5}.di-ok{padding:11px 13px;border:1px solid #355a55;border-radius:10px;background:#102824;color:#d6eee7}.di-empty{padding:13px;border:1px dashed #3a5675;border-radius:9px;color:var(--muted)}.di-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.di-kpi{padding:10px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.di-kpi b{display:block;font-size:18px}.di-kpi small{color:var(--muted)}.di-semantic-table{display:grid;gap:8px;max-height:520px;overflow:auto}.di-sem-row{display:grid;grid-template-columns:minmax(150px,1.2fr) 1.5fr 120px 100px 130px 130px 130px minmax(120px,1fr);gap:7px;align-items:end;padding:9px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.di-sem-row small{display:block;color:var(--muted)}.di-sem-row label{font-size:10px;color:var(--muted)}.di-sem-row input,.di-sem-row select{width:100%;margin-top:3px}.di-sem-state{font-size:10px;padding:7px;border-radius:7px}.di-sem-state.ready{background:#102824;color:#8ce4c6}.di-sem-state.blocked{background:#32251b;color:#ffd49a}.di-issues{display:grid;gap:5px}.di-issue{padding:8px 9px;border-radius:7px;background:#0e1d31;font-size:11px}.di-issue.block{border-left:4px solid #ff8c9b}.di-issue.warn{border-left:4px solid #ffd166}.di-issue.note{border-left:4px solid #69a8ff}.di-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.di-meta .wide{grid-column:1/-1}.di-dataset-list{display:grid;gap:7px}.di-dataset{padding:10px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.di-workspace-panel{margin-top:10px}.di-workspace-panel select{width:100%}.di-similar{display:grid;gap:6px;margin-top:8px}
  @media(max-width:1100px){.di-sem-row{grid-template-columns:1fr 1fr 1fr}.di-grid{grid-template-columns:1fr}}@media(max-width:650px){.di-kpis,.di-meta,.di-sem-row{grid-template-columns:1fr}.di-actions button,.di-actions label{width:100%}}
  `;document.head.appendChild(s)
}
function advancedHost(){return document.getElementById('processDataLabs')}
function renderAdvancedIntake(prepared=null,error=''){
  ensureStyle();const h=advancedHost();if(!h)return;
  const ready=prepared?.quality?.analysisReady;
  h.innerHTML=`<div data-di-root><div class="di-actions" style="margin-bottom:12px"><button class="ghost" data-di-back>← Data diagnosis</button><button class="ghost" data-di-template>Download standard CSV template</button><button class="ghost" data-di-library>Local dataset library</button></div>
  <div class="card di-hero"><div class="eyebrow">Connected local process data</div><h2>Prepare, define and validate real shot data</h2><p>Raw CSV stays in this browser/desktop session. Privacy preparation happens first; semantic readiness is checked separately so a clean file cannot be mistaken for an interpretable engineering dataset.</p><div class="di-note"><b>Fail-closed rule:</b> unresolved meaning, actual/setpoint/command role, engineering unit, sampling basis or sequence integrity blocks baseline and drift intelligence. Saved data can remain locally preserved while blocked.</div></div>
  ${error?`<div class="di-note" style="margin-top:12px"><b>Could not prepare file:</b> ${esc(error)}</div>`:''}
  <div class="di-grid"><section class="card di-panel"><h3>1 · Local CSV and context</h3><div class="di-meta"><label class="wide">CSV<input type="file" accept=".csv,text/csv" data-di-file></label><label>Source label<input data-di-meta="source_label" placeholder="e.g. machine export"></label><label>Confidentiality<select data-di-meta="confidentiality"><option value="local-confidential">local-confidential</option><option value="internal-approved">internal-approved</option><option value="public-cleared">public-cleared</option></select></label><label>Machine context<input data-di-meta="machine_context" placeholder="non-person local alias"></label><label>Mould context<input data-di-meta="mould_context" placeholder="non-person local alias"></label><label>Material context<input data-di-meta="material_context" placeholder="grade/code"></label><label>Job context<input data-di-meta="job_context" placeholder="non-person work-order alias"></label></div><p class="muted">Do not enter operator, employee, customer or contact identifiers.</p></section>
  <section class="card di-panel"><h3>Readiness</h3>${prepared?`<div class="di-kpis"><div class="di-kpi"><b>${prepared.summary.outputRows}</b><small>rows</small></div><div class="di-kpi"><b>${prepared.summary.keptNumeric}</b><small>numeric channels</small></div><div class="di-kpi"><b>${prepared.quality.blockingCount}</b><small>blockers</small></div><div class="di-kpi"><b>${ready?'READY':'BLOCKED'}</b><small>analysis state</small></div></div>${issuesHtml(prepared)}`:'<div class="di-empty">Choose a CSV. MouldMaster will strip/alias sensitive fields, profile numeric channels and require semantic declarations before process intelligence.</div>'}</section></div>
  ${prepared?`<section class="card di-panel" style="margin-top:12px"><h3>2 · Channel semantic dictionary</h3><p class="muted">Confirm each numeric channel. Heuristic matches are suggestions, never authority.</p>${semanticRowsHtml(prepared)}<div class="di-actions" style="margin-top:10px"><button class="secondary" data-di-apply>Apply semantic declarations</button></div></section>
  <section class="card di-panel" style="margin-top:12px"><h3>3 · Use the prepared dataset</h3><div class="di-actions"><button class="ghost" data-di-csv>Download prepared CSV</button><button class="ghost" data-di-dictionary>Download semantic dictionary</button><button class="primary" data-di-save>${ready?'Save analysis-ready dataset locally':'Save blocked dataset locally'}</button></div><p class="muted">Saving uses IndexedDB on this device. No network upload is performed by this module.</p></section>`:''}</div>`;
  wireAdvancedIntake(prepared)
}
function readDatasetMeta(root){
  const out={};root.querySelectorAll('[data-di-meta]').forEach(el=>out[el.dataset.diMeta]=el.value);return out
}
function readOverrides(root){
  const out={};root.querySelectorAll('[data-di-channel]').forEach(row=>{out[row.dataset.diChannel]={meaning:row.querySelector('[data-di-meaning]')?.value||'',role:row.querySelector('[data-di-role]')?.value||'unresolved',unit:row.querySelector('[data-di-unit]')?.value||'',sampling_basis:row.querySelector('[data-di-sampling]')?.value||'unknown',sensor_ref:row.querySelector('[data-di-sensor]')?.value||'',calibration_ref:row.querySelector('[data-di-calibration]')?.value||''}});return out
}
function wireAdvancedIntake(prepared){
  const root=document.querySelector('[data-di-root]');if(!root)return;
  root.querySelector('[data-di-back]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
  root.querySelector('[data-di-template]')?.addEventListener('click',()=>{const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;download('mouldmaster-process-data-template.csv',api?.templateCsv?.()||'', 'text/csv;charset=utf-8')});
  root.querySelector('[data-di-library]')?.addEventListener('click',renderDatasetLibrary);
  root.querySelector('[data-di-file]')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const text=await file.text(),base=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(!base)throw new Error('Local intake module unavailable');
      const parsed=base.parseCsv(text),privacyPrepared=base.__rawPrepare?base.__rawPrepare(parsed):base.prepare(parsed);
      preparedSession=enrichPrepared(privacyPrepared,{},readDatasetMeta(root));renderAdvancedIntake(preparedSession)
    }catch(err){preparedSession=null;renderAdvancedIntake(null,err?.message||String(err))}
  });
  root.querySelector('[data-di-apply]')?.addEventListener('click',()=>{if(!prepared)return;preparedSession=enrichPrepared(prepared,readOverrides(root),readDatasetMeta(root));renderAdvancedIntake(preparedSession)});
  root.querySelector('[data-di-csv]')?.addEventListener('click',()=>{const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(prepared&&api)download('mouldmaster-prepared-process-data.csv',api.toCsv(prepared),'text/csv;charset=utf-8')});
  root.querySelector('[data-di-dictionary]')?.addEventListener('click',()=>{if(!prepared)return;download('mouldmaster-semantic-dictionary.json',JSON.stringify({schema:1,version:VERSION,datasetMeta:prepared.datasetMeta,semantics:prepared.semantics,quality:prepared.quality,boundary:prepared.boundary},null,2))});
  root.querySelector('[data-di-save]')?.addEventListener('click',async()=>{try{const rec=await savePrepared(prepared);window.toast?.(`Dataset saved locally · ${rec.rowCount} rows`);renderDatasetLibrary()}catch(err){window.toast?.(`Dataset save failed: ${err?.message||err}`)}})
}
async function renderDatasetLibrary(){
  ensureStyle();const h=advancedHost();if(!h)return;
  const datasets=await listDatasets().catch(()=>[]);
  h.innerHTML=`<div data-di-library-root><div class="di-actions" style="margin-bottom:12px"><button class="ghost" data-di-intake>← Process-data intake</button><button class="ghost" data-di-back>Data diagnosis</button></div><div class="card di-hero"><div class="eyebrow">Local process-data store</div><h2>Dataset library</h2><p>Prepared datasets are stored in IndexedDB on this device. Analysis-blocked datasets remain preserved but cannot be used for baseline or drift calculations until semantics are resolved and re-saved.</p></div><section class="card di-panel" style="margin-top:12px"><div class="di-dataset-list">${datasets.length?datasets.map(d=>`<div class="di-dataset"><b>${esc(d.datasetMeta?.source_label||d.id)}</b><div class="muted">${d.rowCount} rows · ${d.quality?.analysisReady?'analysis-ready':'blocked'} · ${esc(d.entities?.machine||'machine not linked')} · ${esc(d.entities?.mould||'mould not linked')}</div><div class="di-actions" style="margin-top:7px">${d.quality?.analysisReady?`<button class="secondary" data-di-baseline="${esc(d.id)}">Create baseline</button>`:''}<button class="ghost" data-di-delete="${esc(d.id)}">Delete local dataset</button></div></div>`).join(''):'<div class="di-empty">No locally stored datasets yet.</div>'}</div></section></div>`;
  const root=h.querySelector('[data-di-library-root]');root.querySelector('[data-di-intake]')?.addEventListener('click',()=>renderAdvancedIntake(preparedSession));root.querySelector('[data-di-back]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
  root.querySelectorAll('[data-di-baseline]').forEach(b=>b.addEventListener('click',async()=>{try{await createBaseline(b.dataset.diBaseline);window.toast?.('Local baseline created')}catch(err){window.toast?.(err?.message||String(err))}}));
  root.querySelectorAll('[data-di-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this local dataset and its local shots/baselines?'))return;await deleteDataset(b.dataset.diDelete);renderDatasetLibrary()}))
}
function openAdvancedIntake(){window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.();requestAnimationFrame(()=>renderAdvancedIntake(preparedSession))}

function patchIntakeApi(){
  const api=window.MM_PROCESS_DATA_LOCAL_INTAKE;if(!api||api.__mmConnectedData)return;
  api.__rawPrepare=api.prepare;
  api.prepare=function(parsed,overrides={},meta={}){return enrichPrepared(api.__rawPrepare(parsed),overrides,meta)};
  api.open=openAdvancedIntake;
  api.enrich=enrichPrepared;api.savePrepared=savePrepared;api.listDatasets=listDatasets;api.openLibrary=renderDatasetLibrary;api.__mmConnectedData=true;
}
function interceptLegacyLauncher(e){
  const b=e.target.closest?.('[data-pdi-launch]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openAdvancedIntake()
}

function identifyWorkspaceCase(){
  if(activeWorkspaceCaseId&&window.MM_MOULD_MASTER_WORKSPACE?.getCase?.(activeWorkspaceCaseId))return activeWorkspaceCaseId;
  const title=document.querySelector('#mmMouldMasterWorkspace [data-mw-field="title"]')?.value||'',defect=document.querySelector('#mmMouldMasterWorkspace [data-mw-field="defect"]')?.value||'';
  const candidates=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()||[],match=candidates.find(c=>(title&&c.title===title)||(defect&&c.defect===defect));if(match)activeWorkspaceCaseId=match.id;return activeWorkspaceCaseId
}
async function workspacePanel(){
  const host=document.getElementById('mmMouldMasterWorkspace');if(!host||!host.querySelector('[data-mw-save]')||host.querySelector('[data-di-workspace-panel]'))return;
  const caseId=identifyWorkspaceCase();if(!caseId)return;
  const datasets=await listDatasets().catch(()=>[]),link=await caseLink(caseId).catch(()=>null),similar=await similarCases(caseId).catch(()=>[]);
  const aside=host.querySelector('.mw-summary');if(!aside)return;
  const panel=document.createElement('div');panel.className='mw-panel card di-workspace-panel';panel.dataset.diWorkspacePanel='1';
  panel.innerHTML=`<h3>Connected process data</h3><p class="mw-help">Link this troubleshooting case to a locally stored measured dataset and structured context. Links stay on this device.</p><label>Dataset<select data-di-case-dataset><option value="">No dataset linked</option>${datasets.map(d=>`<option value="${esc(d.id)}" ${link?.datasetId===d.id?'selected':''}>${esc(d.datasetMeta?.source_label||d.id)} · ${d.rowCount} rows</option>`).join('')}</select></label><div class="di-meta" style="margin-top:8px"><label>Machine<input data-di-case-machine value="${esc(link?.machine||'')}"></label><label>Mould<input data-di-case-mould value="${esc(link?.mould||'')}"></label><label>Material grade<input data-di-case-material value="${esc(link?.materialGrade||'')}"></label><label>Cavity<input data-di-case-cavity value="${esc(link?.cavity||'')}"></label><label>Intervention<input data-di-case-intervention value="${esc(link?.intervention||'')}"></label><label>Run<input data-di-case-run value="${esc(link?.runId||'')}"></label></div><div class="di-actions" style="margin-top:8px"><button class="secondary" data-di-case-save>Save data link</button></div><div class="di-similar"><b>Similar local cases</b>${similar.length?similar.map(x=>`<button class="ghost" data-di-similar-case="${esc(x.caseId)}">${esc(x.title)} · score ${x.score}</button>`).join(''):'<div class="mw-help">No related structured/local cases found yet.</div>'}</div>`;
  aside.appendChild(panel);
  panel.querySelector('[data-di-case-save]')?.addEventListener('click',async()=>{
    const datasetId=panel.querySelector('[data-di-case-dataset]')?.value||'',dataset=datasetId?await get('datasets',datasetId):null;
    await linkCase(caseId,{datasetId:datasetId||null,machine:safeToken(panel.querySelector('[data-di-case-machine]')?.value||dataset?.entities?.machine||'',72),mould:safeToken(panel.querySelector('[data-di-case-mould]')?.value||dataset?.entities?.mould||'',72),materialGrade:safeToken(panel.querySelector('[data-di-case-material]')?.value||dataset?.entities?.materialGrade||'',72),cavity:safeToken(panel.querySelector('[data-di-case-cavity]')?.value||'',48),intervention:safeToken(panel.querySelector('[data-di-case-intervention]')?.value||'',72),runId:safeToken(panel.querySelector('[data-di-case-run]')?.value||'',72)});
    window.MM_LEARNING_ANALYTICS?.record?.('process_case_linked',{module:'process-data',id:caseId});window.toast?.('Process-data link saved locally');panel.remove();workspacePanel()
  });
  panel.querySelectorAll('[data-di-similar-case]').forEach(b=>b.addEventListener('click',()=>{activeWorkspaceCaseId=b.dataset.diSimilarCase;window.MM_MOULD_MASTER_WORKSPACE?.open?.(activeWorkspaceCaseId)}))
}
function patchWorkspaceApi(){
  const api=window.MM_MOULD_MASTER_WORKSPACE;if(!api||api.__mmConnectedData)return;
  const oldOpen=api.open,oldNew=api.newCase;
  api.open=function(id){if(id)activeWorkspaceCaseId=id;const r=oldOpen.apply(this,arguments);requestAnimationFrame(workspacePanel);return r};
  api.newCase=function(seed={}){const id=oldNew.call(this,seed);activeWorkspaceCaseId=id;requestAnimationFrame(workspacePanel);return id};
  api.linkData=linkCase;api.getDataLink=caseLink;api.similarCases=similarCases;api.__mmConnectedData=true
}
function workspaceCapture(e){
  const open=e.target.closest?.('[data-mw-open]');if(open?.dataset.mwOpen)activeWorkspaceCaseId=open.dataset.mwOpen;
  if(e.target.closest?.('[data-mw-new]'))setTimeout(()=>{const first=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()?.[0];if(first){activeWorkspaceCaseId=first.id;workspacePanel()}},0);
  if(e.target.closest?.('[data-mw-save]'))setTimeout(workspacePanel,0)
}

async function learningRecommendationPanel(){
  const host=document.getElementById('learningInsights');if(!host||host.classList.contains('hidden')||host.querySelector('[data-di-learning-panel]'))return;
  const cases=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()||[];if(!cases.length)return;
  const linked=[];for(const c of cases.slice(0,12)){const l=await caseLink(c.id).catch(()=>null);if(l?.datasetId||l?.machine||l?.mould||l?.materialGrade)linked.push({c,l})}
  const recent=linked.slice(0,5);if(!recent.length)return;
  const panel=document.createElement('section');panel.className='la-panel card';panel.dataset.diLearningPanel='1';panel.innerHTML=`<h3>From your process work</h3><p class="la-note">Use recent structured troubleshooting context to revisit relevant evidence and data-reading skills. This stays learner-scoped and local.</p><div class="la-list">${recent.map(x=>`<div class="la-row"><div><b>${esc(x.c.title||x.c.defect||'Troubleshooting case')}</b><small>${esc([x.l.machine,x.l.mould,x.l.materialGrade].filter(Boolean).join(' · '))}</small></div><button class="ghost" data-di-learn-case="${esc(x.c.id)}">Open case</button></div>`).join('')}</div>`;
  (host.querySelector('.la-grid')||host).appendChild(panel;
  panel.querySelectorAll('[data-di-learn-case]').forEach(b=>b.addEventListener('click',()=>window.MM_MOULD_MASTER_WORKSPACE?.open?.(b.dataset.diLearnCase)))
}

function scheduleInstall(){
  if(installQueued)return;installQueued=true;requestAnimationFrame(()=>{installQueued=false;patchIntakeApi();patchWorkspaceApi();workspacePanel();learningRecommendationPanel()})
}
async function install(){
  ensureStyle();await loadPublicMetadata();patchIntakeApi();patchWorkspaceApi();
  document.addEventListener('click',interceptLegacyLauncher,true);
  document.addEventListener('click',workspaceCapture,true);
  const observer=new MutationObserver(scheduleInstall);observer.observe(document.documentElement,{childList:true,subtree:true});
  scheduleInstall()
}

window.MM_CONNECTED_PROCESS_DATA={
  version:VERSION,
  loadPublicMetadata,
  semanticRegistry:()=>semanticRegistry,
  currentManifest:()=>currentManifest,
  enrichPrepared,
  storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset},
  intelligence:{createBaseline,compareToBaseline,compareWindows,summarizeRows},
  cases:{linkCase,caseLink,similarCases},
  scope:'Local-first connected process-data infrastructure. It distinguishes privacy preparation from semantic readiness, stores prepared site data in IndexedDB, provides site-local statistical evidence comparisons, and never creates universal production limits, causal proof or machine-control authority.'
};

install().catch(err=>{console.error('MouldMaster connected process-data runtime failed to initialise',err)});
})();
