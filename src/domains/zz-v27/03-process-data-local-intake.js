/* MouldMaster strict local process-data intake — 2026.09.08.27 */
(function(){
'use strict';
const VERSION='2026.09.08.27';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
if(!BASE)throw new Error('process-data-local-intake-v27.js requires process-data-diagnostics.js');
const MAX_ROWS=50000;
const DIRECT_ID=/(?:^|_)(?:name|email|phone|address|customer|supplier_contact|serial_number|asset_tag|user|username|operator|operator_id|employee|employee_id|personnel)(?:_|$)/i;
const TIME=/^(?:timestamp|date|datetime|time|created_at|updated_at|recorded_at|event_timestamp|shot_timestamp|cycle_timestamp)$/i;
const OP_ID=/(?:machine|cell|mould|mold|tool|cavity|material|grade|resin|lot|batch|job|work_?order|part_?(?:number|no)|intervention)/i;
let lastPrepared=null;
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
function aliasPrefix(key){return key.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,20)||'id'}
function prepare(parsed){
 const {headers=[],rows=[]}=parsed||{};if(!headers.length||!rows.length)throw new Error('CSV needs a header row and at least one data row.');
 const rules=headers.map(key=>DIRECT_ID.test(key)||TIME.test(key)?{key,action:'drop'}:OP_ID.test(key)?{key,action:'alias'}:numeric(rows,key)?{key,action:'keep'}:{key,action:'drop'});
 const maps={};for(const r of rules)if(r.action==='alias')maps[r.key]=new Map();const invalidNumeric={};
 const keepShot=rules.some(r=>r.key==='shot_index'&&r.action==='keep');
 const out=rows.map((src,index)=>{const dst=keepShot?{}:{shot_index:index+1};for(const r of rules){if(r.action==='drop')continue;const v=String(src[r.key]??'').trim();if(r.action==='keep'){if(!v){dst[r.key]='';continue}const n=Number(v);if(Number.isFinite(n))dst[r.key]=n;else{dst[r.key]='';invalidNumeric[r.key]=(invalidNumeric[r.key]||0)+1}continue}if(!v){dst[r.key]='';continue}const m=maps[r.key];if(!m.has(v))m.set(v,`${aliasPrefix(r.key)}-${String(m.size+1).padStart(2,'0')}`);dst[r.key]=m.get(v)}return dst});
 const kept=rules.filter(r=>r.action!=='drop').map(r=>r.key),outputHeaders=keepShot?kept:['shot_index',...kept.filter(k=>k!=='shot_index')];
 const invalidNumericValues=Object.values(invalidNumeric).reduce((a,b)=>a+b,0);
 return {schema:4,version:VERSION,headers:outputHeaders,rows:out,rules,validation:{invalidNumericValues,reviewRequired:invalidNumericValues>0},summary:{sourceRows:parsed.sourceRows,inputRows:rows.length,outputRows:out.length,truncated:false,invalidNumericValues},boundary:'Prepared locally in memory. Malformed CSV is rejected atomically; direct identifiers and timestamps are removed; operational identifiers are pseudonymised. Output is not proof of anonymity and is not a production recipe.'};
}
function cell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(p){return [p.headers.join(','),...p.rows.map(r=>p.headers.map(h=>cell(r[h])).join(','))].join('\n')+'\n'}
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
function retireLegacy(){document.querySelectorAll('[data-pdi-launch],[data-pdi-root]').forEach(el=>el.remove())}
function render(message='Select a local CSV.'){retireLegacy();const host=document.getElementById('processDataLabs');if(!host)return;host.innerHTML='';const card=document.createElement('section');card.className='card form-card';const title=document.createElement('h2');title.textContent='Strict local CSV preparation';const note=document.createElement('p');note.className='muted';note.textContent='Malformed CSV is rejected before preparation. Files stay in this browser/desktop session; prepared output is pseudonymised, not guaranteed anonymous.';const status=document.createElement('p');status.setAttribute('role','status');status.textContent=message;const input=document.createElement('input');input.type='file';input.accept='.csv,text/csv';const exportBtn=document.createElement('button');exportBtn.className='secondary';exportBtn.textContent='Export prepared CSV';exportBtn.disabled=!lastPrepared;input.addEventListener('change',async()=>{try{const f=input.files?.[0];if(!f)return;lastPrepared=prepare(parseCsv(await f.text()));render(`${lastPrepared.rows.length} rows prepared.`)}catch(err){lastPrepared=null;render(err?.message||'CSV rejected.')}});exportBtn.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-shot-data.csv',toCsv(lastPrepared),'text/csv;charset=utf-8')});card.append(title,note,status,input,exportBtn);host.appendChild(card)}
function open(){BASE.open();requestAnimationFrame(()=>render())}
const originalOpen=BASE.open.bind(BASE);BASE.open=function(){const r=originalOpen();requestAnimationFrame(retireLegacy);return r};
retireLegacy();
window.MM_PROCESS_DATA_LOCAL_INTAKE=Object.freeze({version:VERSION,maxRows:MAX_ROWS,parseCsv,prepare,toCsv,open,scope:'Strict local in-memory CSV preparation only. Malformed structure is rejected atomically; no upload, storage, machine control or production limits.'});
})();