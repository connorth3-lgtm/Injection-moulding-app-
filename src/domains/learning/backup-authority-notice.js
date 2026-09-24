/* MouldMaster backup authority + integrity UX — 2026.09.18.1 */
(function(){
'use strict';
if(window.MM_BACKUP_AUTHORITY_NOTICE)return;

const VERSION='2026.09.18.1';
const BACKUP_FORMAT='mouldmaster-backup-v3';
const LEGACY_FORMAT='mouldmaster-backup-v2';
const INTEGRITY_ALGORITHM='SHA-256';
const CANONICALIZATION='json-stable-v1';
const INTEGRITY_SCOPE='backupFormat+payload';
const MAX_BACKUP_BYTES=10*1024*1024;
const REVIEW_KEY='mm_spaced_review_v2', SIGN_KEY='mm_practical_signoff_v1';
const LEGACY_SUCCESS='Backup imported and strictly validated';
const CLEAR_SUCCESS='Progress imported. Certificates and pass authority must be re-earned; local assessment and Learning Insights analytics are reset.';
const baseToast=window.toast;
const baseImportData=window.importData;

if(typeof baseToast==='function')window.toast=function(message){return baseToast.call(this,message===LEGACY_SUCCESS?CLEAR_SUCCESS:message)};

function obj(value){return !!value&&typeof value==='object'&&!Array.isArray(value)}
function clamp(n,a,b,d=0){return Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d}
function cleanReview(value){
 const out={items:{}};
 if(!obj(value)||!obj(value.items))return out;
 for(const [id,item] of Object.entries(value.items).slice(0,1000)){
  if(!obj(item))continue;
  const sid=String(id).slice(0,220);
  if(!/^(tech|reg|legacy):/.test(sid))continue;
  out.items[sid]={
   id:sid,
   stage:Math.floor(clamp(item.stage,0,5)),
   due:clamp(item.due,0,4102444800000,Date.now()),
   wrong:Math.floor(clamp(item.wrong,0,100000)),
   right:Math.floor(clamp(item.right,0,100000)),
   last:clamp(item.last,0,4102444800000),
   confidence:['low','medium','high'].includes(item.confidence)?item.confidence:'medium'
  };
 }
 return out;
}
function cleanSign(value){
 const out={checks:{},supervisor:'',date:'',notes:''};
 if(!obj(value))return out;
 if(obj(value.checks))for(const [key,checked] of Object.entries(value.checks).slice(0,50))out.checks[String(key).slice(0,20)]=checked===true;
 out.supervisor=String(value.supervisor||'').slice(0,160);
 out.date=String(value.date||'').slice(0,20);
 out.notes=String(value.notes||'').slice(0,10000);
 return out;
}
function readLocalJson(key,fallback){
 try{const value=JSON.parse(localStorage.getItem(key)||'');return obj(value)?value:fallback}catch(_){return fallback}
}
function stableStringify(value){
 if(value===null)return 'null';
 if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
 if(obj(value))return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableStringify(value[key])).join(',')+'}';
 if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'){
  if(!Number.isFinite(value))throw new Error('Backup contains a non-finite number');
  return JSON.stringify(value);
 }
 throw new Error('Backup contains an unsupported value');
}
function canonicalIntegrityInput(payload){return {backupFormat:BACKUP_FORMAT,payload}}
function bytesToHex(buffer){return [...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
async function sha256Hex(value){
 const subtle=window.crypto&&window.crypto.subtle;
 if(!subtle||typeof subtle.digest!=='function')throw new Error('SHA-256 backup integrity is unavailable in this browser context');
 const canonical=stableStringify(value);
 const bytes=new TextEncoder().encode(canonical);
 return bytesToHex(await subtle.digest(INTEGRITY_ALGORITHM,bytes));
}
function legacyPayload(){
 const payload=JSON.parse(JSON.stringify(db));
 payload.backupFormat=LEGACY_FORMAT;
 payload.trainingExtras={
  version:2,
  spacedReview:cleanReview(readLocalJson(REVIEW_KEY,{items:{}})),
  practicalSignoff:cleanSign(readLocalJson(SIGN_KEY,{}))
 };
 return payload;
}
async function buildEnvelope(){
 const payload=legacyPayload();
 const digest=await sha256Hex(canonicalIntegrityInput(payload));
 return {
  backupFormat:BACKUP_FORMAT,
  integrity:{algorithm:INTEGRITY_ALGORITHM,canonicalization:CANONICALIZATION,scope:INTEGRITY_SCOPE,digest},
  payload
 };
}
function exactKeys(value,expected){
 if(!obj(value))return false;
 const actual=Object.keys(value).sort(),wanted=[...expected].sort();
 return actual.length===wanted.length&&actual.every((key,index)=>key===wanted[index]);
}
async function verifyEnvelope(envelope){
 if(!exactKeys(envelope,['backupFormat','integrity','payload'])||envelope.backupFormat!==BACKUP_FORMAT)throw new Error('Invalid v3 backup envelope');
 const meta=envelope.integrity;
 if(!exactKeys(meta,['algorithm','canonicalization','scope','digest']))throw new Error('Invalid backup integrity metadata');
 if(meta.algorithm!==INTEGRITY_ALGORITHM||meta.canonicalization!==CANONICALIZATION||meta.scope!==INTEGRITY_SCOPE)throw new Error('Unsupported backup integrity metadata');
 if(typeof meta.digest!=='string'||!/^[0-9a-f]{64}$/.test(meta.digest))throw new Error('Invalid backup integrity digest');
 if(!obj(envelope.payload)||envelope.payload.backupFormat!==LEGACY_FORMAT)throw new Error('Invalid backup payload');
 const expected=await sha256Hex(canonicalIntegrityInput(envelope.payload));
 if(expected!==meta.digest){const error=new Error('Backup integrity check failed');error.code='MM_BACKUP_INTEGRITY_MISMATCH';throw error}
 return envelope.payload;
}
function readFileText(file){
 if(file&&typeof file.text==='function')return file.text();
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(new Error('Backup file could not be read'));
  reader.readAsText(file);
 });
}
function downloadJson(value){
 const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),anchor=document.createElement('a');
 anchor.href=URL.createObjectURL(blob);
 anchor.download='mouldmaster-progress-v3.json';
 anchor.click();
 setTimeout(()=>URL.revokeObjectURL(anchor.href),0);
}

window.exportData=async function(){
 try{
  const envelope=await buildEnvelope();
  downloadJson(envelope);
  window.toast?.('Backup exported with SHA-256 integrity checksum, review and sign-off data');
 }catch(error){
  console.error('[MouldMaster backup] export failed:',error);
  alert('Backup could not be created with a verifiable SHA-256 integrity checksum on this device. No backup file was exported.');
 }
};

window.importData=function(file){
 if(!file)return;
 if(file.size>MAX_BACKUP_BYTES){alert('That backup is too large to import safely. No existing data was changed.');return}
 void (async()=>{
  try{
   const text=await readFileText(file),parsed=JSON.parse(text);
   if(parsed?.backupFormat===BACKUP_FORMAT){
    const payload=await verifyEnvelope(parsed);
    if(typeof baseImportData!=='function')throw new Error('Core backup importer unavailable');
    baseImportData(new Blob([JSON.stringify(payload)],{type:'application/json'}));
    return;
   }
   if(!obj(parsed)||!obj(parsed.users)||typeof parsed.activeUser!=='string')throw new Error('Invalid legacy backup structure');
   if(parsed.backupFormat&&parsed.backupFormat!==LEGACY_FORMAT)throw new Error('Unsupported backup format');
   const proceed=typeof confirm!=='function'||confirm('This older MouldMaster backup has no cryptographic integrity checksum. Its structure will still be validated, but file corruption or modification cannot be independently detected. Continue importing this legacy backup?');
   if(!proceed)return;
   if(typeof baseImportData!=='function')throw new Error('Core backup importer unavailable');
   baseImportData(file);
  }catch(error){
   console.error('[MouldMaster backup] import blocked:',error);
   if(error?.code==='MM_BACKUP_INTEGRITY_MISMATCH')alert('This MouldMaster backup failed its SHA-256 integrity check. It may be corrupted or modified. No existing data was changed.');
   else alert('That file is not a supported, verifiable MouldMaster backup. No existing data was changed.');
  }
 })();
};

function annotate(root=document){
 for(const heading of root.querySelectorAll?.('h2')||[]){
  if(String(heading.textContent||'').trim()!=='Backup & reset')continue;
  const card=heading.closest('.card');if(!card||card.querySelector('[data-mm-backup-authority-note]'))continue;
  const note=document.createElement('div');note.className='callout';note.dataset.mmBackupAuthorityNote='1';
  note.innerHTML='<b>Transfer boundary:</b> Current backups include a SHA-256 integrity checksum so corruption or file changes are detected before restore. The checksum is not a digital signature and does not prove who created the backup. Progress, notes and supported training extras can move in a backup; certificates, pass authority and local analytics do not transfer as trusted evidence and must be re-earned after import.';
  const controls=card.querySelector('.hero-buttons');card.insertBefore(note,controls||null);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>annotate(),{once:true});else annotate();
window.addEventListener?.('mm:domains-ready',()=>annotate());
window.MM_APP_SHELL?.events?.onViewChange?.(()=>annotate());
window.MM_APP_SHELL?.events?.onRender?.('profile',()=>annotate());

window.MM_LEARNER_BACKUP_INTEGRITY=Object.freeze({
 version:VERSION,
 backupFormat:BACKUP_FORMAT,
 legacyFormat:LEGACY_FORMAT,
 algorithm:INTEGRITY_ALGORITHM,
 canonicalization:CANONICALIZATION,
 stableStringify,
 buildEnvelope,
 verifyEnvelope
});
window.MM_BACKUP_AUTHORITY_NOTICE=Object.freeze({version:VERSION,legacySuccess:LEGACY_SUCCESS,clearSuccess:CLEAR_SUCCESS,annotate,integrity:window.MM_LEARNER_BACKUP_INTEGRITY});
})();
