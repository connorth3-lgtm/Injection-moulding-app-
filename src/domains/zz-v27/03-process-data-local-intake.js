/* MouldMaster strict local process-data intake — 2026.09.08.27 (security-hardened 2026-09-09) */
(function(){
'use strict';
const VERSION='2026.09.08.27';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
if(!BASE)throw new Error('process-data-local-intake-v27.js requires process-data-diagnostics.js');
const MAX_ROWS=50000;
const MAX_QUALITY_CATEGORIES=24;
const DIRECT_ID=/(?:^|_)(?:name|email|phone|address|customer|supplier_contact|serial_number|asset_tag|user|username|operator|operator_id|employee|employee_id|personnel)(?:_|$)/i;
const TIME=/^(?:timestamp|date|datetime|time|created_at|updated_at|recorded_at|event_timestamp|shot_timestamp|cycle_timestamp)$/i;
const QUALITY=/^(?:quality|quality_result|quality_status|inspection_result|pass_fail|passfail)$/i;
const SAFE_QUALITY_STATUS=/^(?:pass|fail|ok|nok|accepted?|rejected?|good|bad|scrap|rework|hold|conforming|non[-_ ]?conforming|yes|no)$/i;
const OP_ID=/(?:machine|cell|mould|mold|tool|cavity|material|grade|resin|lot|batch|job|work_?order|part_?(?:number|no)|intervention)/i;
let lastPrepared=null;
const one=(root,selector)=>root&&typeof root.querySelector==='function'?root.querySelector(selector):null;
const all=(root,selector)=>root&&typeof root.querySelectorAll==='function'?[...root.querySelectorAll(selector)]:[];
function norm(v){return String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function parseCsv(text){
 const s=String(text??'').replace(/^\uFEFF/,''),rows=[];let row=[],field='',quoted=false,closed=false,started=false;
 const pushField=()=>{row.push(field);field='';closed=false;started=false};
 const pushRow=()=>{pushField();rows.push(row);if(rows.length>MAX_ROWS+1)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit.`);row=[]};
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(quoted){if(ch==='"'){if(s[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}else field+=ch;continue}
  if(closed){if(ch===','){pushField();continue}if(ch==='\n'){pushRow();continue}if(ch==='\r'){if(s[i+1]==='\n')i++;pushRow();continue}throw new Error(`Malformed CSV: unexpected character after closing quote at position ${i+1}.`)}
  if(ch==='"'){if(started||field.length)throw new Error(`Malformed CSV: quote inside an unquoted field at position ${i+1}.`);quoted=true;started=true;continue}
  if(ch===','){pushField();continue}if(ch==='\n'){pushRow();continue}if(ch==='\r'){if(s[i+1]==='\n')i++;pushRow();continue}
  field+=ch;started=true;
 }
 if(quoted)throw new Error('Malformed CSV: unterminated quoted field.');
 if(closed||started||field.length||row.length)pushRow();
 while(rows.length&&rows.at(-1).every(v=>String(v).trim()===''))rows.pop();
 if(!rows.length)throw new Error('CSV needs a non-empty header row.');
 const headers=rows[0].map(norm);if(headers.some(h=>!h))throw new Error('CSV header names must be non-empty after normalization.');
 const seen=new Set();for(const h of headers){if(seen.has(h))throw new Error(`CSV contains duplicate normalized header: ${h}`);seen.add(h)}
 const body=rows.slice(1);if(body.length>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit.`);
 body.forEach((r,i)=>{if(r.length!==headers.length)throw new Error(`Malformed CSV: row ${i+2} has ${r.length} columns; expected ${headers.length}.`)});
 return {headers,rows:body.map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()]))),sourceRows:body.length,truncated:false};
}
function numeric(rows,key){let present=0,ok=0;for(const r of rows){const v=String(r[key]??'').trim();if(!v)continue;present++;if(Number.isFinite(Number(v)))ok++}return present>0&&ok/present>=.9}
function qualityProfile(rows,key){
 const values=rows.map(r=>String(r[key]??'').trim()).filter(Boolean),distinct=[...new Set(values)];
 if(!values.length)return {safe:false,reason:'empty-quality-field',present:0,distinct:0};
 if(distinct.length>MAX_QUALITY_CATEGORIES)return {safe:false,reason:'quality-cardinality-limit',present:values.length,distinct:distinct.length};
 if(values.length>=12&&distinct.length/values.length>.5)return {safe:false,reason:'quality-high-cardinality',present:values.length,distinct:distinct.length};
 return {safe:true,reason:'categorical-quality',present:values.length,distinct:distinct.length};
}
function aliasPrefix(key){return key.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,20)||'id'}
function prepare(parsed){
 const {headers=[],rows=[]}=parsed||{};if(!headers.length||!rows.length)throw new Error('CSV needs a header row and at least one data row.');
 const profiles={};
 const rules=headers.map(key=>{
  if(DIRECT_ID.test(key)||TIME.test(key))return {key,action:'drop',reason:'privacy-boundary'};
  if(QUALITY.test(key)){const p=qualityProfile(rows,key);profiles[key]=p;return p.safe?{key,action:'quality',reason:p.reason}:{key,action:'drop',reason:p.reason}}
  if(OP_ID.test(key))return {key,action:'alias',reason:'operational-identifier'};
  if(numeric(rows,key))return {key,action:'keep',reason:'numeric-process-signal'};
  return {key,action:'drop',reason:'non-numeric-unclassified'};
 });
 const maps={};for(const r of rules)if(r.action==='alias'||r.action==='quality')maps[r.key]=new Map();
 const invalidNumeric={};let pseudonymisedQualityValues=0;
 const keepShot=rules.some(r=>r.key==='shot_index'&&r.action==='keep');
 const out=rows.map((src,index)=>{
  const dst=keepShot?{}:{shot_index:index+1};
  for(const r of rules){
   if(r.action==='drop')continue;
   const v=String(src[r.key]??'').trim();
   if(r.action==='quality'){
    if(!v){dst[r.key]='';continue}
    if(SAFE_QUALITY_STATUS.test(v)){dst[r.key]=v.toUpperCase().replace(/\s+/g,'_');continue}
    const m=maps[r.key];if(!m.has(v))m.set(v,`${aliasPrefix(r.key)}-category-${String(m.size+1).padStart(2,'0')}`);
    dst[r.key]=m.get(v);pseudonymisedQualityValues++;continue
   }
   if(r.action==='keep'){
    if(!v){dst[r.key]='';continue}
    const n=Number(v);if(Number.isFinite(n))dst[r.key]=n;else{dst[r.key]='';invalidNumeric[r.key]=(invalidNumeric[r.key]||0)+1}
    continue
   }
   if(!v){dst[r.key]='';continue}
   const m=maps[r.key];if(!m.has(v))m.set(v,`${aliasPrefix(r.key)}-${String(m.size+1).padStart(2,'0')}`);dst[r.key]=m.get(v)
  }
  return dst
 });
 const kept=rules.filter(r=>r.action!=='drop').map(r=>r.key),outputHeaders=keepShot?kept:['shot_index',...kept.filter(k=>k!=='shot_index')];
 const invalidNumericValues=Object.values(invalidNumeric).reduce((a,b)=>a+b,0);
 const droppedQualityFields=rules.filter(r=>QUALITY.test(r.key)&&r.action==='drop').length;
 return {
  schema:5,version:VERSION,headers:outputHeaders,rows:out,rules,
  validation:{invalidNumericValues,pseudonymisedQualityValues,droppedQualityFields,reviewRequired:invalidNumericValues>0||droppedQualityFields>0},
  summary:{sourceRows:parsed.sourceRows,inputRows:rows.length,outputRows:out.length,truncated:false,invalidNumericValues,pseudonymisedQualityValues,droppedQualityFields},
  boundary:'Prepared locally in memory. Malformed CSV is rejected atomically; direct identifiers and timestamps are removed; operational identifiers are pseudonymised; only explicit quality fields are considered categorical. Common PASS/FAIL-style outcomes are retained, other low-cardinality quality labels are pseudonymised, and high-cardinality quality fields are dropped. Output is spreadsheet-safe but is not proof of anonymity and is not a production recipe.'
 };
}
function spreadsheetSafe(v){
 if(typeof v==='number'&&Number.isFinite(v))return String(v);
 const s=String(v??'');
 return /^\s*[=+\-@]/.test(s)?`'${s}`:s;
}
function cell(v){const s=spreadsheetSafe(v);return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(p){return [p.headers.map(cell).join(','),...p.rows.map(r=>p.headers.map(h=>cell(r[h])).join(','))].join('\n')+'\n'}
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
function dictionaryCsv(p){
 const reason={
  keep:'Numeric process signal retained for local analysis.',
  quality:'Common quality status labels are retained; other low-cardinality category labels are replaced with session-local category aliases.',
  alias:'Operational identifier replaced with a session-local pseudonym.',
  drop:'Excluded from prepared output by the local privacy boundary.'
 };
 return ['source_field,handling,reason',...(p?.rules||[]).map(r=>[cell(r.key),cell(r.action),cell(r.reason?`${reason[r.action]||'Reviewed locally.'} Rule: ${r.reason}.`:(reason[r.action]||'Reviewed locally.'))].join(','))].join('\n')+'\n'
}
function retireLegacy(){document.querySelectorAll('[data-pdi-launch],[data-pdi-root]').forEach(el=>el.remove())}
function clearSummary(root){for(const el of all(root,'[data-pdi-kpi],[data-pdi-rule]'))el.remove()}
function showSummary(root,p){
 clearSummary(root);if(!root||!p)return;
 const summary=document.createElement('div');summary.className='mm-v27-pdi-summary';
 const rows=document.createElement('p');rows.className='pdi-kpi';rows.setAttribute('data-pdi-kpi','rows');rows.textContent=`Rows prepared locally: ${p.summary.outputRows}.`;
 const fields=document.createElement('p');fields.className='pdi-kpi';fields.setAttribute('data-pdi-kpi','fields');fields.textContent=`Prepared fields: ${p.headers.length}. Invalid numeric values removed: ${p.summary.invalidNumericValues}. Quality labels pseudonymised: ${p.summary.pseudonymisedQualityValues}. Quality fields dropped for unsafe cardinality: ${p.summary.droppedQualityFields}.`;
 const rules=document.createElement('ul');rules.setAttribute('aria-label','Local preparation rules');
 const labels={keep:'retained as numeric process data',quality:'retained as a bounded categorical outcome with non-standard labels pseudonymised',alias:'pseudonymised for this prepared dataset',drop:'removed from prepared output'};
 for(const rule of p.rules){const li=document.createElement('li');li.className='pdi-rule';li.setAttribute('data-pdi-rule',rule.action);const key=document.createElement('span');key.textContent=`${rule.key}: `;const action=document.createElement('b');action.className=rule.action;action.textContent=rule.action;const detail=document.createElement('span');detail.textContent=` — ${labels[rule.action]||'reviewed locally'}${rule.reason?` (${rule.reason})`:''}.`;li.append(key,action,detail);rules.appendChild(li)}
 summary.append(rows,fields,rules);root.appendChild(summary)
}
function render(message='Select a local CSV.'){
 retireLegacy();
 const host=document.getElementById('processDataLabs');if(!host)return false;
 let card=one(host,'[data-mm-v27-pdi-root]');
 if(card){const status=one(card,'[data-mm-v27-pdi-status]');if(status&&message)status.textContent=message;return true}
 card=document.createElement('section');card.className='card form-card';card.setAttribute('data-mm-v27-pdi-root','1');
 const title=document.createElement('h2');title.textContent='Prepare shot data without uploading it';
 const note=document.createElement('p');note.className='muted';note.id='mmLocalCsvBoundary';note.textContent='Malformed CSV is rejected before preparation. Files stay in this browser/desktop session; direct identifiers are removed, operational IDs and non-standard quality labels are pseudonymised, and high-cardinality quality text is dropped. Prepared output is not guaranteed anonymous.';
 const status=document.createElement('p');status.setAttribute('data-mm-v27-pdi-status','1');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent=message;
 const label=document.createElement('label');label.setAttribute('for','mmLocalCsvPicker');label.textContent='Choose real-shot CSV';
 const input=document.createElement('input');input.id='mmLocalCsvPicker';input.type='file';input.accept='.csv,text/csv';input.setAttribute('data-pdi-file','1');input.setAttribute('aria-describedby','mmLocalCsvBoundary');
 const exportDict=document.createElement('button');exportDict.type='button';exportDict.className='secondary';exportDict.textContent='Export data dictionary';exportDict.disabled=!lastPrepared;
 const exportPrepared=document.createElement('button');exportPrepared.type='button';exportPrepared.className='secondary';exportPrepared.textContent='Export prepared CSV';exportPrepared.disabled=!lastPrepared;
 input.addEventListener('change',async()=>{
  clearSummary(card);lastPrepared=null;exportDict.disabled=true;exportPrepared.disabled=true;
  try{const f=input.files?.[0];if(!f){status.textContent='Select a local CSV.';return}const parsed=parseCsv(await f.text());lastPrepared=prepare(parsed);status.textContent=`Accepted locally: ${lastPrepared.rows.length} rows prepared. No source row values are displayed or uploaded.`;exportDict.disabled=false;exportPrepared.disabled=false;showSummary(card,lastPrepared)}catch(err){status.textContent=`Rejected: ${err?.message||'CSV could not be prepared.'}`}
 });
 exportDict.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-data-dictionary.csv',dictionaryCsv(lastPrepared),'text/csv;charset=utf-8')});
 exportPrepared.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-shot-data.csv',toCsv(lastPrepared),'text/csv;charset=utf-8')});
 card.append(title,note,status,label,input,exportDict,exportPrepared);host.appendChild(card);if(lastPrepared)showSummary(card,lastPrepared);return true
}
function ensureLauncher(){
 retireLegacy();
 const host=document.getElementById('processDataLabs');if(!host)return false;
 let launch=one(host,'[data-mm-v27-pdi-launch]');if(launch)return true;
 const wrap=document.createElement('section');wrap.className='card';wrap.setAttribute('data-mm-v27-pdi-launcher','1');
 const heading=document.createElement('h3');heading.textContent='Local shot-data preparation';
 const copy=document.createElement('p');copy.className='muted';copy.textContent='Prepare a CSV locally without replacing the guided diagnostics, engineering store or other Process Data tools.';
 launch=document.createElement('button');launch.type='button';launch.className='secondary';launch.setAttribute('data-mm-v27-pdi-launch','1');launch.textContent='Prepare real shot CSV locally';launch.addEventListener('click',()=>{render();one(host,'[data-mm-v27-pdi-root]')?.scrollIntoView?.({block:'start'})});
 wrap.append(heading,copy,launch);host.appendChild(wrap);return true
}
const originalOpen=BASE.open.bind(BASE);
BASE.open=function(){const r=originalOpen();requestAnimationFrame(()=>{ensureLauncher();render()});return r};
function open(){return BASE.open()}
retireLegacy();
// Connected-data runtime intentionally decorates `prepare`/`open` and adds
// __rawPrepare/enrichment helpers. Keep the API container extensible while the
// strict parser itself remains the canonical parseCsv function.
window.MM_PROCESS_DATA_LOCAL_INTAKE={
 version:VERSION,maxRows:MAX_ROWS,maxQualityCategories:MAX_QUALITY_CATEGORIES,
 parseCsv,prepare,toCsv,open,render,ensureLauncher,
 exportDataDictionary:()=>{if(lastPrepared)download('mouldmaster-data-dictionary.csv',dictionaryCsv(lastPrepared),'text/csv;charset=utf-8')},
 scope:'Strict local in-memory CSV preparation only. Malformed structure is rejected atomically; identifiers and free-text-like/high-cardinality categorical leakage fail closed; exports neutralise spreadsheet-formula prefixes; no upload, storage, machine control or production limits.'
};
})();
