/* MouldMaster local process-data intake — privacy-first preparation for real shot exports */
(function(){
'use strict';
const VERSION='2026.08.26.1';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
if(!BASE)throw new Error('process-data-local-intake.js requires process-data-diagnostics.js');
const MAX_ROWS=50000;
const DROP_RE=/(?:^|_)(?:name|email|phone|address|customer|supplier_contact|serial_number|asset_tag|user|username|operator|operator_id|employee|employee_id|personnel)(?:_|$)/i;
const TIME_RE=/^(?:timestamp|date|datetime|time|created_at|updated_at|recorded_at|event_timestamp|shot_timestamp|cycle_timestamp)$/i;
const ALIAS_RE=/(?:machine|cell|mould|mold|tool|cavity|material|grade|resin|lot|batch|job|work_?order|part_?(?:number|no))/i;
const QUALITY_RE=/(?:quality|result|status|pass|fail|reject|defect|inspection|ok_ng|ng_ok)/i;
const SAFE_QUALITY=new Set(['pass','fail','ok','ng','good','bad','accept','accepted','reject','rejected','yes','no','0','1','true','false']);
let lastPrepared=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function cleanHeader(v,index){let x=String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!x)x=`column_${index+1}`;return x}
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false;
  const s=String(text||'').replace(/^\uFEFF/,'');
  for(let i=0;i<s.length;i++){
    const ch=s[i];
    if(quoted){if(ch==='"'&&s[i+1]==='"'){field+='"';i++}else if(ch==='"')quoted=false;else field+=ch;continue}
    if(ch==='"'){quoted=true;continue}
    if(ch===','){row.push(field);field='';continue}
    if(ch==='\n'){row.push(field);rows.push(row);row=[];field='';continue}
    if(ch==='\r')continue;
    field+=ch;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  while(rows.length&&rows[rows.length-1].every(x=>String(x).trim()===''))rows.pop();
  if(rows.length<2)return {headers:rows[0]?.map(cleanHeader)||[],rows:[]};
  const headers=rows[0].map(cleanHeader);
  const seen={};for(let i=0;i<headers.length;i++){const base=headers[i];seen[base]=(seen[base]||0)+1;if(seen[base]>1)headers[i]=`${base}_${seen[base]}`}
  return {headers,rows:rows.slice(1,MAX_ROWS+1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()])))}
}
function numericColumn(rows,key){let present=0,numeric=0;for(const r of rows){const v=String(r[key]??'').trim();if(!v)continue;present++;if(Number.isFinite(Number(v)))numeric++}return present>0&&numeric/present>=0.9}
function classify(headers,rows){return headers.map(key=>{if(DROP_RE.test(key))return {key,action:'drop',reason:'direct/person identifier'};if(TIME_RE.test(key))return {key,action:'drop',reason:'timestamp/date removed; row order becomes shot_index'};if(ALIAS_RE.test(key))return {key,action:'alias',reason:'operational identifier replaced with stable per-file alias'};if(numericColumn(rows,key))return {key,action:'keep',reason:'numeric process/quality signal'};if(QUALITY_RE.test(key))return {key,action:'quality',reason:'limited quality category'};return {key,action:'drop',reason:'unrecognised free-text field'}})}
function aliasPrefix(key){return key.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,24)||'id'}
function prepare(parsed){
  const headers=parsed?.headers||[],rows=(parsed?.rows||[]).slice(0,MAX_ROWS),rules=classify(headers,rows),maps={};
  for(const rule of rules)if(rule.action==='alias')maps[rule.key]=new Map();
  const out=rows.map((raw,index)=>{
    const row={shot_index:index+1};
    for(const rule of rules){const v=String(raw[rule.key]??'').trim();if(rule.action==='drop')continue;
      if(rule.action==='keep'){row[rule.key]=v===''?'':Number(v);continue}
      if(rule.action==='quality'){const q=v.toLowerCase();row[rule.key]=SAFE_QUALITY.has(q)?q:(q?`category-${Math.abs(hash32(q))%1000}`:'');continue}
      if(rule.action==='alias'){if(!v){row[rule.key]='';continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v)}
    }
    return row
  });
  const outputHeaders=['shot_index',...rules.filter(r=>r.action!=='drop').map(r=>r.key)];
  return {schema:1,version:VERSION,rows:out,headers:outputHeaders,rules,summary:{inputRows:rows.length,outputRows:out.length,keptNumeric:rules.filter(r=>r.action==='keep').length,aliased:rules.filter(r=>r.action==='alias').length,quality:rules.filter(r=>r.action==='quality').length,dropped:rules.filter(r=>r.action==='drop').length},boundary:'Prepared locally in memory. Raw identifiers, person/operator fields and timestamps are not retained by this module. Output is pseudonymised/prepared data, not proof of anonymity and not a production recipe.'}
}
function hash32(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h|0}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(prepared){const lines=[prepared.headers.map(csvCell).join(',')];for(const row of prepared.rows)lines.push(prepared.headers.map(k=>csvCell(row[k])).join(','));return lines.join('\n')+'\n'}
function templateCsv(){return 'timestamp,machine,mould,cavity,material_grade,material_lot,fill_time_s,transfer_pressure_mpa,cushion_mm,peak_cavity_pressure_mpa,pressure_time_area,part_mass_g,cycle_time_s,cooling_time_s,supply_temp_c,return_temp_c,flow_lmin,quality_result,defect_code\n'}
function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function host(){return document.getElementById('processDataLabs')}
function ensureStyle(){if(document.getElementById('mm-pdi-style'))return;const s=document.createElement('style');s.id='mm-pdi-style';s.textContent=`.pdi-launch{margin:12px 8px 0 0}.pdi-hero{padding:22px}.pdi-note{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;font-size:12px;line-height:1.55}.pdi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.pdi-panel{padding:18px}.pdi-actions{display:flex;gap:8px;flex-wrap:wrap}.pdi-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:12px 0}.pdi-kpi{padding:10px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.pdi-kpi b{display:block;font-size:18px}.pdi-kpi span{font-size:10px;color:var(--muted)}.pdi-rules{display:grid;gap:6px;max-height:320px;overflow:auto}.pdi-rule{display:grid;grid-template-columns:minmax(120px,1fr) 90px 2fr;gap:8px;padding:8px 10px;border-radius:8px;background:#0e1d31;font-size:11px}.pdi-rule b{text-transform:uppercase}.pdi-rule .keep{color:#7ce6a3}.pdi-rule .alias{color:#69a8ff}.pdi-rule .quality{color:#ffd166}.pdi-rule .drop{color:#ff9da8}.pdi-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted)}@media(max-width:760px){.pdi-grid{grid-template-columns:1fr}.pdi-summary{grid-template-columns:1fr 1fr}.pdi-rule{grid-template-columns:1fr}.pdi-actions button,.pdi-actions label{width:100%}}`;document.head.appendChild(s)}
function attachLauncher(){const h=host();if(!h||!h.querySelector('.pd-hero')||h.querySelector('[data-pdi-launch]')||h.querySelector('[data-pdi-root]'))return;ensureStyle();const b=document.createElement('button');b.type='button';b.className='secondary pdi-launch';b.dataset.pdiLaunch='1';b.textContent='Prepare real shot CSV locally';b.addEventListener('click',open);h.querySelector('.pd-hero').appendChild(b)}
function render(prepared=null,error=''){
  ensureStyle();const h=host();if(!h)return;lastPrepared=prepared;
  h.innerHTML=`<div data-pdi-root><div class="pdi-actions" style="margin-bottom:12px"><button class="ghost" data-pdi-back>← Guided data diagnosis</button><button class="ghost" data-pdi-template>Download CSV template</button></div><div class="card pdi-hero"><div class="eyebrow">Local real-data preparation</div><h2>Prepare shot data without uploading it</h2><p>Choose a CSV exported from your machine, cavity-sensing, quality or auxiliary system. MouldMaster processes it only in this browser/desktop session, removes timestamps and direct/person identifiers, aliases operational identifiers and keeps numeric evidence signals.</p><div class="pdi-note"><b>Privacy & engineering boundary:</b> this is pseudonymisation and schema preparation, not guaranteed anonymisation. Review the prepared file before sharing it. No raw file is stored or uploaded by this module, and the output does not create production limits, validated setpoints or machine authorisation.</div></div><div class="pdi-grid"><section class="card pdi-panel"><h3>1 · Select local CSV</h3><p class="muted">Maximum ${MAX_ROWS.toLocaleString()} data rows per preparation run.</p><input type="file" accept=".csv,text/csv" data-pdi-file>${error?`<p style="color:#ff9da8">${esc(error)}</p>`:''}<div class="pdi-actions" style="margin-top:12px"><button class="secondary" data-pdi-export ${prepared?'':'disabled'}>Export prepared CSV</button><button class="ghost" data-pdi-dictionary ${prepared?'':'disabled'}>Export data dictionary</button></div>${prepared?summaryHtml(prepared):'<div class="pdi-empty" style="margin-top:12px">No file processed yet. Raw file contents stay in memory only while this page is open.</div>'}</section><section class="card pdi-panel"><h3>2 · Column treatment</h3>${prepared?rulesHtml(prepared):'<div class="pdi-empty">After selecting a CSV, this panel shows exactly which columns were kept, aliased or dropped.</div>'}</section></div></div>`;
  h.querySelector('[data-pdi-back]')?.addEventListener('click',()=>BASE.open());
  h.querySelector('[data-pdi-template]')?.addEventListener('click',()=>download('mouldmaster-shot-data-template.csv',templateCsv(),'text/csv;charset=utf-8'));
  h.querySelector('[data-pdi-file]')?.addEventListener('change',async e=>{try{const file=e.target.files?.[0];if(!file)return;const parsed=parseCsv(await file.text());if(!parsed.headers.length||!parsed.rows.length)throw new Error('CSV needs a header row and at least one data row.');render(prepare(parsed))}catch(err){render(null,err?.message||'Could not prepare this CSV.')}});
  h.querySelector('[data-pdi-export]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-shot-data.csv',toCsv(lastPrepared),'text/csv;charset=utf-8')});
  h.querySelector('[data-pdi-dictionary]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-data-dictionary.json',JSON.stringify({schema:lastPrepared.schema,version:lastPrepared.version,summary:lastPrepared.summary,rules:lastPrepared.rules,boundary:lastPrepared.boundary},null,2)+'\n','application/json;charset=utf-8')});
}
function summaryHtml(p){const s=p.summary;return `<div class="pdi-summary"><div class="pdi-kpi"><b>${s.outputRows}</b><span>rows prepared</span></div><div class="pdi-kpi"><b>${s.keptNumeric}</b><span>numeric kept</span></div><div class="pdi-kpi"><b>${s.aliased}</b><span>ID columns aliased</span></div><div class="pdi-kpi"><b>${s.quality}</b><span>quality columns</span></div><div class="pdi-kpi"><b>${s.dropped}</b><span>columns dropped</span></div></div>`}
function rulesHtml(p){return `<div class="pdi-rules">${p.rules.map(r=>`<div class="pdi-rule"><span>${esc(r.key)}</span><b class="${esc(r.action)}">${esc(r.action)}</b><span>${esc(r.reason)}</span></div>`).join('')}</div>`}
function open(){BASE.open();requestAnimationFrame(()=>render())}
const originalOpen=BASE.open.bind(BASE);BASE.open=function(){const r=originalOpen();requestAnimationFrame(attachLauncher);return r};
attachLauncher();
window.MM_PROCESS_DATA_LOCAL_INTAKE={version:VERSION,maxRows:MAX_ROWS,parseCsv,prepare,toCsv,templateCsv,open,scope:'Local in-memory CSV preparation only; strips direct/person identifiers and timestamps, aliases operational identifiers, keeps evidence signals, performs no upload/storage/machine control and does not define production limits.'};
})();
