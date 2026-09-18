/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: curriculum-workspace-runtime-pack.js
 */

/* >>> process-data-local-intake.js */
/* MouldMaster local process-data intake — privacy-first preparation for real shot exports */
(function(){
'use strict';
const VERSION='2026.09.12.1';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
if(!BASE)throw new Error('process-data-local-intake.js requires process-data-diagnostics.js');
const MAX_ROWS=50000;
const DROP_RE=/(?:^|_)(?:name|email|phone|address|customer|supplier_contact|serial_number|asset_tag|user|username|operator|operator_id|employee|employee_id|personnel)(?:_|$)/i;
const TIME_RE=/^(?:timestamp|date|datetime|time|created_at|updated_at|recorded_at|event_timestamp|shot_timestamp|cycle_timestamp)$/i;
const ALIAS_RE=/(?:machine|cell|mould|mold|tool|cavity|material|grade|resin|lot|batch|job|work_?order|part_?(?:number|no)|intervention)/i;
const ALIAS_ID_TOKEN_RE=/(?:^|_)(?:id|alias|code|number|no|serial)(?:_|$)/i;
const ALIAS_EXACT_RE=/^(?:machine|cell|mould|mold|tool|cavity|material|material_grade|material_lot|grade|resin|resin_grade|lot|batch|job|work_?order|part_?(?:number|no)|intervention)$/i;
const QUALITY_RE=/(?:quality|result|status|pass|fail|reject|defect|inspection|ok_ng|ng_ok)/i;
const CATEGORY_RE=/^(?:phase)$/i;
const UNIT_RE=/(?:^|_)unit$/i;
const SAFE_QUALITY=new Set(['pass','fail','ok','ng','good','bad','accept','accepted','reject','rejected','yes','no','0','1','true','false']);
const SAFE_CATEGORY=new Set(['baseline','known-good','known_good','fault','drift','test','intervention','recovery','verification']);
const SAFE_UNIT_RE=/^[a-z0-9%°µμ./^*_-]{1,16}$/i;
let lastPrepared=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function cleanHeader(v,index){let x=String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!x)x=`column_${index+1}`;return x}
function enforceRowLimit(rows){if(rows.length>MAX_ROWS+1)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`)}
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false,physicalLine=1,rowStartLine=1;
  const s=String(text||'').replace(/^\uFEFF/,'');
  for(let i=0;i<s.length;i++){
    const ch=s[i];
    if(quoted){
      if(ch==='"'&&s[i+1]==='"'){field+='"';i++}
      else if(ch==='"')quoted=false;
      else{field+=ch;if(ch==='\n')physicalLine++}
      continue
    }
    if(ch==='"'){quoted=true;continue}
    if(ch===','){row.push(field);field='';continue}
    if(ch==='\n'){row.push(field);rows.push(row);enforceRowLimit(rows);row=[];field='';physicalLine++;rowStartLine=physicalLine;continue}
    if(ch==='\r')continue;
    field+=ch;
  }
  if(quoted)throw new Error(`CSV has an unterminated quoted field starting on source line ${rowStartLine}; reached end of file at line ${physicalLine}. No data was prepared.`);
  if(field.length||row.length){row.push(field);rows.push(row);enforceRowLimit(rows)}
  while(rows.length&&rows[rows.length-1].every(x=>String(x).trim()===''))rows.pop();
  if(rows.length<2)return {headers:rows[0]?.map(cleanHeader)||[],rows:[],sourceRows:0,truncated:false};
  const headerWidth=rows[0].length;
  for(let i=1;i<rows.length;i++){
    const sourceRow=rows[i];
    if(sourceRow.every(x=>String(x).trim()===''))continue;
    if(sourceRow.length!==headerWidth){const cells=sourceRow.length;throw new Error(`CSV row ${i+1} has ${cells} cell${cells===1?'':'s'}; expected ${headerWidth} from the header. No data was prepared.`)}
  }
  const headers=rows[0].map(cleanHeader);
  const seen={};for(let i=0;i<headers.length;i++){const base=headers[i];seen[base]=(seen[base]||0)+1;if(seen[base]>1)headers[i]=`${base}_${seen[base]}`}
  const dataRows=rows.slice(1);
  if(dataRows.length>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`);
  return {headers,rows:dataRows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()]))),sourceRows:dataRows.length,truncated:false}
}
function numericColumn(rows,key){let present=0,numeric=0;for(const r of rows){const v=String(r[key]??'').trim();if(!v)continue;present++;if(Number.isFinite(Number(v)))numeric++}return present>0&&numeric/present>=0.9}
function explicitOperationalIdentifier(key){return ALIAS_RE.test(key)&&(ALIAS_EXACT_RE.test(key)||ALIAS_ID_TOKEN_RE.test(key))}
function strictlyIncreasing(values){if(values.length<2)return null;for(let i=1;i<values.length;i++)if(values[i]<=values[i-1])return false;return true}
function sequenceAudit(headers,rows){
  const warnings=[],hasShotIndex=headers.includes('shot_index'),usableShotIndex=hasShotIndex&&numericColumn(rows,'shot_index');
  let shotIndexMonotonic=null,shotIndexMissing=0;
  if(hasShotIndex){
    const raw=rows.map(r=>String(r.shot_index??'').trim()),values=raw.filter(Boolean).map(Number).filter(Number.isFinite);
    shotIndexMissing=raw.filter(v=>!v).length;
    if(usableShotIndex){
      shotIndexMonotonic=strictlyIncreasing(values);
      if(shotIndexMonotonic===false)warnings.push('Source shot_index is not strictly increasing in file row order; review sorting/grouping before analysis.');
      if(shotIndexMissing)warnings.push(`Source shot_index has ${shotIndexMissing} missing value${shotIndexMissing===1?'':'s'}; preserve the controlled source record for sequence review.`);
    }else warnings.push('Source shot_index is not predominantly numeric; a generated sequential shot_index will replace it in the prepared export.');
  }
  const timestampChecks=[];
  for(const key of headers.filter(h=>TIME_RE.test(h))){
    const raw=rows.map(r=>String(r[key]??'').trim()).filter(Boolean),parsed=raw.map(v=>Date.parse(v)).filter(Number.isFinite);
    const parseComplete=raw.length===parsed.length,monotonic=parsed.length>=2?strictlyIncreasing(parsed):null;
    timestampChecks.push({column:key,present:raw.length,parsed:parsed.length,parseComplete,monotonic});
    if(raw.length&&!parseComplete)warnings.push(`${key} contains unparseable date/time values; sequence could not be fully verified before the timestamp column was removed.`);
    if(monotonic===false)warnings.push(`${key} is not strictly increasing in file row order; review source ordering before analysis.`);
  }
  return {sourceShotIndex:usableShotIndex?'preserved':'generated',sourceShotIndexPresent:hasShotIndex,shotIndexMonotonic,shotIndexMissing,timestampChecks,reviewRequired:warnings.length>0,warnings};
}
function classify(headers,rows){return headers.map(key=>{if(DROP_RE.test(key))return {key,action:'drop',reason:'direct/person identifier'};if(TIME_RE.test(key))return {key,action:'drop',reason:'timestamp/date checked for sequence then removed; row order remains represented by shot_index'};if(explicitOperationalIdentifier(key))return {key,action:'alias',reason:'operational identifier replaced with stable per-file alias'};if(numericColumn(rows,key))return {key,action:'keep',reason:'numeric process/quality signal; malformed nonblank values are omitted and reported'};if(ALIAS_RE.test(key))return {key,action:'alias',reason:'operational identifier replaced with stable per-file alias'};if(UNIT_RE.test(key))return {key,action:'unit',reason:'structured measurement unit retained only when it is a short unit token'};if(CATEGORY_RE.test(key))return {key,action:'category',reason:'controlled analysis phase retained; unknown labels aliased per file'};if(QUALITY_RE.test(key))return {key,action:'quality',reason:'limited quality category; unknown labels aliased per file'};return {key,action:'drop',reason:'unrecognised free-text field'}})}
function aliasPrefix(key){return key.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,24)||'id'}
function prepare(parsed){
  const headers=parsed?.headers||[],rows=parsed?.rows||[];
  if(rows.length>MAX_ROWS||Number(parsed?.sourceRows||rows.length)>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared.`);
  const sequence=sequenceAudit(headers,rows),rules=classify(headers,rows),maps={},invalidNumeric={};
  for(const rule of rules)if(['alias','quality','category'].includes(rule.action))maps[rule.key]=new Map();
  const preserveShotIndex=sequence.sourceShotIndex==='preserved';
  const out=rows.map((raw,index)=>{
    const row=preserveShotIndex?{}:{shot_index:index+1};
    for(const rule of rules){const v=String(raw[rule.key]??'').trim();if(rule.action==='drop')continue;
      if(rule.action==='keep'){
        if(v===''){row[rule.key]='';continue}
        const n=Number(v);if(Number.isFinite(n)){row[rule.key]=n}else{row[rule.key]='';invalidNumeric[rule.key]=(invalidNumeric[rule.key]||0)+1}
        continue
      }
      if(rule.action==='unit'){row[rule.key]=!v?'':SAFE_UNIT_RE.test(v)?v:'';continue}
      if(rule.action==='category'){const q=v.toLowerCase();if(!q){row[rule.key]='';continue}if(SAFE_CATEGORY.has(q)){row[rule.key]=q;continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v);continue}
      if(rule.action==='quality'){const q=v.toLowerCase();if(!q){row[rule.key]='';continue}if(SAFE_QUALITY.has(q)){row[rule.key]=q;continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v);continue}
      if(rule.action==='alias'){if(!v){row[rule.key]='';continue}const m=maps[rule.key];if(!m.has(v))m.set(v,`${aliasPrefix(rule.key)}-${String(m.size+1).padStart(2,'0')}`);row[rule.key]=m.get(v)}
    }
    return row
  });
  const keptHeaders=rules.filter(r=>r.action!=='drop').map(r=>r.key),outputHeaders=preserveShotIndex?keptHeaders:['shot_index',...keptHeaders.filter(k=>k!=='shot_index')];
  if(new Set(outputHeaders).size!==outputHeaders.length)throw new Error('Prepared output contains duplicate headers; review the source column names.');
  const invalidNumericByColumn=Object.entries(invalidNumeric).map(([column,count])=>({column,count})),invalidNumericValues=invalidNumericByColumn.reduce((s,x)=>s+x.count,0);
  const validation={invalidNumericValues,invalidNumericByColumn,reviewRequired:invalidNumericValues>0,note:invalidNumericValues?'Malformed nonblank values in predominantly numeric columns were omitted from prepared output and are listed by column.':'No malformed nonblank numeric values were detected in retained numeric columns.'};
  return {schema:3,version:VERSION,rows:out,headers:outputHeaders,rules,sequence,validation,summary:{sourceRows:Number(parsed?.sourceRows??rows.length),inputRows:rows.length,outputRows:out.length,truncated:false,invalidNumericValues,keptNumeric:rules.filter(r=>r.action==='keep').length,aliased:rules.filter(r=>r.action==='alias').length,quality:rules.filter(r=>r.action==='quality').length,categories:rules.filter(r=>r.action==='category').length,units:rules.filter(r=>r.action==='unit').length,dropped:rules.filter(r=>r.action==='drop').length},boundary:'Prepared locally in memory. Files over the row safety limit are rejected rather than silently truncated. Raw identifiers, person/operator fields and timestamps are not retained by this module. Timestamp and source shot-index values may be inspected in-session only to flag ordering problems before timestamp removal. Malformed nonblank values in retained numeric columns are omitted and reported by column rather than converted to NaN. Structurally malformed CSV rows and unterminated quoted fields are rejected before preparation. Unknown categorical quality/phase labels are aliased only within the current prepared file. Output is pseudonymised/prepared data, not proof of anonymity and not a production recipe.'}
}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCsv(prepared){const lines=[prepared.headers.map(csvCell).join(',')];for(const row of prepared.rows)lines.push(prepared.headers.map(k=>csvCell(row[k])).join(','));return lines.join('\n')+'\n'}
function templateCsv(){return 'timestamp,shot_index,machine,mould,cavity,material_grade,material_lot,phase,fill_time_s,transfer_position_mm,transfer_pressure_mpa,cushion_mm,recovery_time_s,peak_cavity_pressure_mpa,pressure_time_area,part_mass_g,cycle_time_s,cooling_time_s,supply_temp_c,return_temp_c,flow_lmin,dimension_value,dimension_unit,quality_result,defect_code,intervention_code\n'}
function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function host(){return document.getElementById('processDataLabs')}
function ensureStyle(){if(document.getElementById('mm-pdi-style'))return;const s=document.createElement('style');s.id='mm-pdi-style';s.textContent=`.pdi-launch{margin:12px 8px 0 0}.pdi-hero{padding:22px}.pdi-note{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;font-size:12px;line-height:1.55}.pdi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.pdi-panel{padding:18px}.pdi-actions{display:flex;gap:8px;flex-wrap:wrap}.pdi-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:12px 0}.pdi-kpi{padding:10px;border:1px solid #304b69;border-radius:9px;background:#0e1d31}.pdi-kpi b{display:block;font-size:18px}.pdi-kpi span{font-size:10px;color:var(--muted)}.pdi-rules{display:grid;gap:6px;max-height:320px;overflow:auto}.pdi-rule{display:grid;grid-template-columns:minmax(120px,1fr) 90px 2fr;gap:8px;padding:8px 10px;border-radius:8px;background:#0e1d31;font-size:11px}.pdi-rule b{text-transform:uppercase}.pdi-rule .keep{color:#7ce6a3}.pdi-rule .alias{color:#69a8ff}.pdi-rule .quality,.pdi-rule .category{color:#ffd166}.pdi-rule .unit{color:#c4d8ed}.pdi-rule .drop{color:#ff9da8}.pdi-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted)}@media(max-width:760px){.pdi-grid{grid-template-columns:1fr}.pdi-summary{grid-template-columns:1fr 1fr}.pdi-rule{grid-template-columns:1fr}.pdi-actions button,.pdi-actions label{width:100%}}`;document.head.appendChild(s)}
function attachLauncher(){const h=host();if(!h||!h.querySelector('.pd-hero')||h.querySelector('[data-pdi-launch]')||h.querySelector('[data-pdi-root]'))return;ensureStyle();const b=document.createElement('button');b.type='button';b.className='secondary pdi-launch';b.dataset.pdiLaunch='1';b.textContent='Prepare real shot CSV locally';b.addEventListener('click',open);h.querySelector('.pd-hero').appendChild(b)}
function sequenceHtml(p){const q=p.sequence||{},warnings=q.warnings||[],source=q.sourceShotIndex==='preserved'?'Source shot_index preserved.':'Generated shot_index follows source file row order.',checked=(q.timestampChecks||[]).filter(x=>x.present).length;return `<div class="pdi-note" style="margin-top:12px"><b>${warnings.length?'Sequence review required':'Sequence check'}</b><br>${esc(source)} ${checked?`${checked} timestamp/date column${checked===1?' was':'s were'} checked before removal.`:'No parseable timestamp/date sequence was supplied.'}${warnings.length?`<br>${warnings.map(x=>`• ${esc(x)}`).join('<br>')}`:'<br>No ordering warning was detected in the available sequence fields.'}</div>`}
function validationHtml(p){const v=p.validation||{};if(!v.invalidNumericValues)return `<div class="pdi-note" style="margin-top:12px"><b>Numeric validation</b><br>No malformed nonblank values were detected in retained numeric columns.</div>`;return `<div class="pdi-note" style="margin-top:12px"><b>Numeric review required</b><br>${v.invalidNumericValues} malformed nonblank value${v.invalidNumericValues===1?' was':'s were'} omitted rather than converted to NaN.<br>${(v.invalidNumericByColumn||[]).map(x=>`• ${esc(x.column)}: ${x.count}`).join('<br>')}</div>`}
function render(prepared=null,error=''){
  ensureStyle();const h=host();if(!h)return;lastPrepared=prepared;
  h.innerHTML=`<div data-pdi-root><div class="pdi-actions" style="margin-bottom:12px"><button class="ghost" data-pdi-back>← Guided data diagnosis</button><button class="ghost" data-pdi-template>Download CSV template</button></div><div class="card pdi-hero"><div class="eyebrow">Local real-data preparation</div><h2>Prepare shot data without uploading it</h2><p>Choose a CSV exported from your machine, cavity-sensing, quality or auxiliary system. MouldMaster processes it only in this browser/desktop session, checks available shot/timestamp order before dropping timestamps, removes direct/person identifiers, aliases operational identifiers and keeps numeric evidence signals.</p><div class="pdi-note"><b>Privacy & engineering boundary:</b> this is pseudonymisation and schema preparation, not guaranteed anonymisation. Review the prepared file before sharing it. Files above ${MAX_ROWS.toLocaleString()} data rows are rejected rather than silently truncated. Structurally malformed CSV is rejected before any data is prepared. No raw file is stored or uploaded by this module, and the output does not create production limits, validated setpoints or machine authorisation.</div></div><div class="pdi-grid"><section class="card pdi-panel"><h3>1 · Select local CSV</h3><p class="muted">Maximum ${MAX_ROWS.toLocaleString()} data rows per preparation run; oversized files are rejected rather than truncated.</p><input type="file" accept=".csv,text/csv" data-pdi-file>${error?`<p style="color:#ff9da8">${esc(error)}</p>`:''}<div class="pdi-actions" style="margin-top:12px"><button class="secondary" data-pdi-export ${prepared?'':'disabled'}>Export prepared CSV</button><button class="ghost" data-pdi-dictionary ${prepared?'':'disabled'}>Export data dictionary</button></div>${prepared?summaryHtml(prepared)+sequenceHtml(prepared)+validationHtml(prepared):'<div class="pdi-empty" style="margin-top:12px">No file processed yet. Raw file contents stay in memory only while this page is open.</div>'}</section><section class="card pdi-panel"><h3>2 · Column treatment</h3>${prepared?rulesHtml(prepared):'<div class="pdi-empty">After selecting a CSV, this panel shows exactly which columns were kept, aliased or dropped.</div>'}</section></div></div>`;
  h.querySelector('[data-pdi-back]')?.addEventListener('click',()=>BASE.open());
  h.querySelector('[data-pdi-template]')?.addEventListener('click',()=>download('mouldmaster-shot-data-template.csv',templateCsv(),'text/csv;charset=utf-8'));
  h.querySelector('[data-pdi-file]')?.addEventListener('change',async e=>{try{const file=e.target.files?.[0];if(!file)return;const parsed=parseCsv(await file.text());if(!parsed.headers.length||!parsed.rows.length)throw new Error('CSV needs a header row and at least one data row.');render(prepare(parsed))}catch(err){render(null,err?.message||'Could not prepare this CSV.')}});
  h.querySelector('[data-pdi-export]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-shot-data.csv',toCsv(lastPrepared),'text/csv;charset=utf-8')});
  h.querySelector('[data-pdi-dictionary]')?.addEventListener('click',()=>{if(lastPrepared)download('mouldmaster-prepared-data-dictionary.json',JSON.stringify({schema:lastPrepared.schema,version:lastPrepared.version,summary:lastPrepared.summary,sequence:lastPrepared.sequence,validation:lastPrepared.validation,rules:lastPrepared.rules,boundary:lastPrepared.boundary},null,2)+'\n','application/json;charset=utf-8')});
}
function summaryHtml(p){const s=p.summary;return `<div class="pdi-summary"><div class="pdi-kpi"><b>${s.outputRows}</b><span>rows prepared</span></div><div class="pdi-kpi"><b>${s.keptNumeric}</b><span>numeric kept</span></div><div class="pdi-kpi"><b>${s.aliased}</b><span>ID columns aliased</span></div><div class="pdi-kpi"><b>${s.invalidNumericValues}</b><span>invalid numeric omitted</span></div><div class="pdi-kpi"><b>${s.dropped}</b><span>columns dropped</span></div></div>`}
function rulesHtml(p){return `<div class="pdi-rules">${p.rules.map(r=>`<div class="pdi-rule"><span>${esc(r.key)}</span><b class="${esc(r.action)}">${esc(r.action)}</b><span>${esc(r.reason)}</span></div>`).join('')}</div>`}
function open(){BASE.open();requestAnimationFrame(()=>render())}
const originalOpen=BASE.open.bind(BASE);BASE.open=function(){const r=originalOpen();requestAnimationFrame(attachLauncher);return r};
attachLauncher();
window.MM_PROCESS_DATA_LOCAL_INTAKE={version:VERSION,maxRows:MAX_ROWS,parseCsv,prepare,toCsv,templateCsv,open,scope:'Local in-memory CSV preparation only; rejects oversized or structurally malformed CSV rather than truncating or silently repairing it, checks available sequence fields, strips direct/person identifiers and timestamps, aliases operational identifiers and unknown quality/phase categories per prepared file, omits/reports malformed numeric values, keeps evidence signals and structured units, performs no upload/storage/machine control and does not define production limits.'};
})();
/* <<< process-data-local-intake.js */

/* >>> curriculum-integration.js */
/* MouldMaster curriculum integration — theory → practice → evidence — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const RETURN_KEY='mm_curriculum_return_v1';

if(typeof renderLesson!=='function'||typeof renderDashboard!=='function'||typeof currentLesson!=='function'||typeof D==='undefined'){
  throw new Error('curriculum-integration.js requires the core lesson runtime');
}
if(!window.MM_LEARNING_EXPERIENCE||!window.MM_DIAGNOSTIC_LABS||!window.MM_PROCESS_DATA_DIAGNOSTICS||!window.MM_MATERIAL_BEHAVIOUR_LABS){
  throw new Error('curriculum-integration.js requires learning experience, diagnostic, process-data and material practice modules');
}

const ROUTES=Object.freeze([
  {type:'diagnostic',id:'cavity-short-shot',courses:[4,6,11,12],keywords:['short shot','cavity','imbalance','gate','runner','vent','local flow'],why:'Use cavity identity and local-versus-global evidence before changing the whole process.'},
  {type:'diagnostic',id:'splay-moisture',courses:[3,6,12],keywords:['splay','silver streak','moisture','drying','material change','volatile'],why:'Separate displayed dryer conditions from verified resin condition and handling history.'},
  {type:'diagnostic',id:'pressure-limited-fill',courses:[1,2,5,7,12],keywords:['setpoint','actual','velocity','injection speed','pressure limit','fill time','machine capability'],why:'Compare commanded settings with measured machine response before assuming the process followed the recipe.'},
  {type:'diagnostic',id:'check-ring-repeatability',courses:[2,5,7,8,12],keywords:['check ring','non-return','cushion','repeatability','shot delivery','part mass','transfer position'],why:'Connect repeatability signals to the physical shot-delivery system instead of tuning around instability.'},
  {type:'diagnostic',id:'cooling-warpage',courses:[4,6,11,12],keywords:['cooling','warpage','coolant','circuit','mould temperature','thermal balance'],why:'Use cooling-flow and thermal-balance evidence to distinguish a tooling condition from a recipe problem.'},
  {type:'diagnostic',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','hold pressure','part mass','scientific moulding','process window'],why:'Turn packing theory into a controlled study that links one input change to a measured response.'},
  {type:'diagnostic',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','gauge','gage','repeatability','reproducibility','noise','dimension','capability'],why:'Challenge the measurement system before adjusting a stable moulding process to chase noise.'},
  {type:'diagnostic',id:'hot-runner-imbalance',courses:[4,10,11,12],keywords:['hot runner','heater','thermocouple','manifold','branch','cavity balance'],why:'Combine local cavity behaviour with heater/control evidence instead of trusting one displayed temperature.'},
  {type:'diagnostic',id:'local-flash',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tool damage','mould support','clamp force'],why:'Use defect location and tooling history to test a local mechanism before applying global force or pressure.'},

  {type:'data',id:'check-ring-leakage',courses:[1,2,5,7,8,12],keywords:['check ring','non-return','cushion','shot mass','shot delivery','repeatability'],why:'Read correlated cushion, mass and pressure signals across baseline, fault and recovery cycles.'},
  {type:'data',id:'cooling-restriction',courses:[4,6,11,12],keywords:['cooling','coolant','flow','warpage','mould temperature','thermal'],why:'Use a 72-cycle pattern to connect reduced circuit flow with thermal and dimensional response.'},
  {type:'data',id:'gate-seal-study',courses:[5,7,8,9],keywords:['gate seal','hold time','packing','part mass','pressure area'],why:'Use synthetic study data to recognise the response plateau that supports a gate-seal conclusion.'},
  {type:'data',id:'material-moisture-pc',courses:[3,6,12],keywords:['moisture','drying','polycarbonate','pc','splay','material condition'],why:'Compare material-condition signals with cosmetic and mechanical responses instead of relying on a dryer screen.'},
  {type:'data',id:'hot-runner-zone-drift',courses:[4,10,11,12],keywords:['hot runner','heater duty','zone','temperature drift','thermocouple','controller'],why:'See how control effort and local response can expose a thermal fault even when displayed temperature looks stable.'},
  {type:'data',id:'valve-gate-timing',courses:[4,10,11,12],keywords:['valve gate','sequential','timing','cavity trace','cavity pressure'],why:'Use cavity-specific timing evidence to distinguish a local sequence problem from a global machine change.'},
  {type:'data',id:'local-flash-tooling',courses:[4,6,11,12],keywords:['flash','shutoff','parting line','tooling','local defect'],why:'Compare local flash evidence with stable global signals to test a tooling mechanism.'},
  {type:'data',id:'energy-base-load',courses:[1,8,10,12],keywords:['energy','efficiency','economics','cycle time','utility','base load'],why:'Connect stable quality and cycle performance with changing energy demand so efficiency decisions stay evidence based.'},
  {type:'data',id:'measurement-noise',courses:[8,9,10,12],keywords:['measurement','noise','msa','gauge','gage','dimension','repeatability','reproducibility'],why:'Compare true process stability with rising measurement spread before drawing a process conclusion.'},
  {type:'data',id:'recycled-pp-lot',courses:[3,8,9,12],keywords:['recycled','regrind','polypropylene','pp','mfr','mvr','lot','rheology'],why:'Connect incoming-material lot evidence to pressure, fill and dimensional response instead of copying old settings.'},
  {type:'data',id:'machine-transfer',courses:[1,2,5,7,8,12],keywords:['machine transfer','transfer process','setpoint','actual','machine capability','copy recipe','process transfer'],why:'See why identical screen values on two machines do not guarantee the same physical process response.'},
  {type:'data',id:'cavity-pack-area',courses:[4,5,7,8,11,12],keywords:['cavity pressure','pack area','pressure curve','pressure history','packing','peak pressure'],why:'Use the full pressure-history area to see changes that a single peak value can hide.'},
  {type:'data',id:'screw-barrel-wear',courses:[2,5,8,12],keywords:['screw','barrel','wear','recovery','plasticising','back pressure','melt temperature'],why:'Trend plasticising and recovery signals together before compensating for a changing mechanical system.'},
  {type:'data',id:'ejector-drag',courses:[4,6,10,11,12],keywords:['ejection','ejector','drag','release','draft','eject force'],why:'Connect ejection force, local temperature and part response to a cooling/release mechanism.'},

  {type:'material',id:'pp-vs-pc-drying',courses:[1,3,5],keywords:['polymer family','polypropylene','pp','polycarbonate','pc','drying','grade','material handling'],why:'Compare two resin families to practise using exact grade requirements instead of one generic drying rule.'},
  {type:'material',id:'pc-wet-vs-dry',courses:[3,6,8,12],keywords:['polycarbonate','pc','moisture','drying','splay','hydrolysis','impact'],why:'Connect verified pellet moisture to appearance and property risk after a handling interruption.'},
  {type:'material',id:'pa66-gf30-dry-conditioned',courses:[3,4,8,11,12],keywords:['nylon','pa66','glass fibre','glass fiber','fibre orientation','fiber orientation','conditioning','anisotropy','warpage','shrinkage'],why:'Separate pre-mould drying from post-mould conditioning and connect reinforcement orientation to dimensional behaviour.'},
  {type:'material',id:'abs-thermal-history',courses:[3,5,6,12],keywords:['abs','residence time','thermal history','degradation','purge','black speck','discolour','discolor'],why:'Use process history and restart timing to distinguish thermal degradation from a generic moisture assumption.'},
  {type:'material',id:'pom-thermal-safety',courses:[3,5,6,12],keywords:['pom','acetal','formaldehyde','contamination','thermal degradation','nozzle blockage','material safety'],why:'Practise the point where material identity changes the safe decision space before optimisation can continue.'},
  {type:'material',id:'recycled-pp-lot-rheology',courses:[3,8,9,12],keywords:['recycled','regrind','secondary feedstock','mfr','mvr','rheology','material lot','polypropylene'],why:'Use lot identity, incoming QC and process actuals together when secondary-feedstock rheology changes.'}
]);

const COURSE_FALLBACKS=Object.freeze({
  1:[{type:'diagnostic',id:'pressure-limited-fill'},{type:'data',id:'check-ring-leakage'}],
  2:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}],
  3:[{type:'material',id:'pp-vs-pc-drying'},{type:'data',id:'material-moisture-pc'}],
  4:[{type:'diagnostic',id:'cooling-warpage'},{type:'data',id:'cooling-restriction'}],
  5:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'gate-seal-study'}],
  6:[{type:'diagnostic',id:'cavity-short-shot'},{type:'data',id:'local-flash-tooling'}],
  7:[{type:'diagnostic',id:'gate-seal-study'},{type:'data',id:'cavity-pack-area'}],
  8:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'machine-transfer'}],
  9:[{type:'diagnostic',id:'measurement-noise'},{type:'data',id:'measurement-noise'}],
  10:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'valve-gate-timing'}],
  11:[{type:'diagnostic',id:'hot-runner-imbalance'},{type:'data',id:'hot-runner-zone-drift'}],
  12:[{type:'diagnostic',id:'check-ring-repeatability'},{type:'data',id:'machine-transfer'}]
});

const TYPE_META=Object.freeze({
  diagnostic:{label:'Diagnostic lab',detail:'Reason through a realistic evidence-first fault case.',selector:'data-dl-start'},
  data:{label:'Data diagnosis',detail:'Read baseline → fault → recovery evidence from a 72-cycle synthetic dataset.',selector:'data-pd-start'},
  material:{label:'Material lab',detail:'Apply grade-aware material evidence and safe handling logic.',selector:'data-ml-start'}
});

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function key(route){return `${route.type}:${route.id}`}
function courseFor(lesson){return D.courses.find(c=>c.id===lesson.course)||null}
function libraryFor(type){
  if(type==='diagnostic')return window.MM_DIAGNOSTIC_LABS.labs||[];
  if(type==='data')return window.MM_PROCESS_DATA_DIAGNOSTICS.cases||[];
  if(type==='material')return window.MM_MATERIAL_BEHAVIOUR_LABS.labs||[];
  return [];
}
function itemFor(route){return libraryFor(route.type).find(item=>item.id===route.id)||null}
function routeFor(type,id){return ROUTES.find(r=>r.type===type&&r.id===id)||null}
function lessonText(lesson,course){
  return [lesson.title,lesson.summary,lesson.intro,...(lesson.objectives||[]),...(lesson.keypoints||[]),lesson.exercise,course?.name,course?.description].join(' ').toLowerCase();
}
function scoreRoute(route,lesson,course){
  const title=String(lesson.title||'').toLowerCase();
  const text=lessonText(lesson,course);
  let score=route.courses.includes(lesson.course)?2:0;
  for(const keyword of route.keywords){
    const k=keyword.toLowerCase();
    if(title.includes(k))score+=8;
    else if(text.includes(k))score+=4;
  }
  return score;
}
function expand(routeLike){
  const route=routeFor(routeLike.type,routeLike.id);
  if(!route)return null;
  const item=itemFor(route);
  return item?{...route,item}:null;
}
function recommendationsFor(lesson){
  const course=courseFor(lesson);
  const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,lesson,course)})).filter(x=>itemFor(x.route)).sort((a,b)=>b.score-a.score||key(a.route).localeCompare(key(b.route)));
  const chosen=[];
  const seen=new Set();
  const add=route=>{const expanded=expand(route);if(!expanded||seen.has(key(expanded)))return false;seen.add(key(expanded));chosen.push(expanded);return true};

  const strong=ranked.filter(x=>x.score>2);
  if(strong[0])add(strong[0].route);
  const firstType=chosen[0]?.type;
  const diverse=strong.find(x=>x.route.type!==firstType&&!seen.has(key(x.route)));
  if(diverse)add(diverse.route);
  for(const candidate of strong){if(chosen.length>=2)break;add(candidate.route)}
  for(const fallback of COURSE_FALLBACKS[lesson.course]||[]){if(chosen.length>=2)break;add(fallback)}
  for(const candidate of ranked){if(chosen.length>=2)break;add(candidate.route)}
  return chosen.slice(0,2);
}

function validateCoverage(){
  if(!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('Curriculum integration expects the canonical 120-lesson pathway');
  for(let course=1;course<=12;course++){
    const fallback=COURSE_FALLBACKS[course];
    if(!Array.isArray(fallback)||fallback.length<2)throw new Error(`Curriculum integration missing fallback practice for course ${course}`);
    for(const item of fallback)if(!expand(item))throw new Error(`Curriculum integration fallback is not available: ${item.type}:${item.id}`);
  }
  for(const route of ROUTES)if(!itemFor(route))throw new Error(`Curriculum route points to unavailable practice: ${key(route)}`);
  for(const lesson of D.lessons){
    const recs=recommendationsFor(lesson);
    if(recs.length!==2)throw new Error(`Lesson ${lesson.id} does not have two valid curriculum practice connections`);
  }
}

function setReturn(lessonId){
  try{sessionStorage.setItem(RETURN_KEY,JSON.stringify({lessonId:Number(lessonId),at:Date.now()}))}catch(_){}
  updateReturnButton();
}
function getReturn(){
  try{const x=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');return x&&Number.isInteger(Number(x.lessonId))?x:null}catch(_){return null}
}
function clearReturn(){try{sessionStorage.removeItem(RETURN_KEY)}catch(_){}updateReturnButton()}
function practiceButton(type,id){
  const attr=TYPE_META[type]?.selector;
  return attr?document.querySelector(`[${attr}="${id}"]`):null;
}
function openPractice(type,id,lessonId){
  const route=expand({type,id});
  if(!route)return toast?.('Linked practice is unavailable');
  setReturn(lessonId);
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_practice_open',{module:type,id});
  if(type==='diagnostic')window.MM_DIAGNOSTIC_LABS.open();
  else if(type==='data')window.MM_PROCESS_DATA_DIAGNOSTICS.open();
  else if(type==='material')window.MM_MATERIAL_BEHAVIOUR_LABS.open();
  requestAnimationFrame(()=>{
    const button=practiceButton(type,id);
    if(button)button.click();
    else toast?.('Open the recommended practice from this activity list');
    updateReturnButton();
  });
}
window.mmCurriculumOpen=openPractice;

function returnToLesson(){
  const origin=getReturn();
  if(!origin)return;
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  if(!lesson){clearReturn();return}
  user.currentLesson=lesson.id;
  persist();
  clearReturn();
  window.MM_LEARNING_ANALYTICS?.record?.('curriculum_return',{module:'lesson',id:String(lesson.id)});
  switchView('lesson');
  toast?.('Returned to linked lesson');
}
window.mmCurriculumReturn=returnToLesson;

function ensureReturnButton(){
  let button=document.getElementById('mmCurriculumReturnButton');
  if(button)return button;
  button=document.createElement('button');
  button.id='mmCurriculumReturnButton';
  button.type='button';
  button.className='secondary mm-curriculum-return hidden';
  button.addEventListener('click',returnToLesson);
  document.body.appendChild(button);
  return button;
}
function updateReturnButton(){
  const button=ensureReturnButton();
  const origin=getReturn();
  const lessonVisible=!document.getElementById('lesson')?.classList.contains('hidden');
  if(!origin||lessonVisible){button.classList.add('hidden');return}
  const lesson=D.lessons.find(l=>l.id===Number(origin.lessonId));
  button.textContent=lesson?`← Return to lesson ${lesson.id}`:'← Return to lesson';
  button.classList.remove('hidden');
}

const style=document.createElement('style');
style.id='mm-curriculum-integration-style';
style.textContent=`
.mm-curriculum-section{margin-top:24px;padding:18px;border:1px solid #38617a;border-radius:15px;background:linear-gradient(135deg,#0f2638,#11243a)}
.mm-curriculum-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.mm-curriculum-head h3{margin:5px 0 6px}.mm-curriculum-head p{margin:0;color:#bdd0e2;line-height:1.5;max-width:760px}
.mm-curriculum-loop{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.mm-curriculum-loop span{font-size:10px;padding:5px 8px;border:1px solid #3a5877;border-radius:999px;background:#102137;color:#c6d8ea}.mm-curriculum-loop b{color:var(--accent)}
.mm-curriculum-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.mm-curriculum-card{padding:14px;border:1px solid #34516e;border-radius:12px;background:#0d1d31}.mm-curriculum-card h4{margin:6px 0 7px;font-size:16px}.mm-curriculum-card p{margin:0;color:#b9cade;font-size:12px;line-height:1.5}.mm-curriculum-card .mm-next-actions{margin-top:11px}
.mm-curriculum-type{font-size:10px;text-transform:uppercase;letter-spacing:.11em;color:var(--accent);font-weight:800}.mm-curriculum-boundary{margin-top:12px;font-size:11px;color:#9fb4ca;line-height:1.5}.mm-curriculum-boundary b{color:#d8e5f1}
.mm-curriculum-focus{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:-3px 0 14px;padding:13px 15px;border:1px solid #304d6b;border-radius:13px;background:#0e1e31}.mm-curriculum-focus p{margin:3px 0 0;color:#aebfd1;font-size:12px;line-height:1.4}.mm-curriculum-focus b{display:block}
.mm-curriculum-return{position:fixed;right:18px;bottom:18px;z-index:24;box-shadow:0 10px 30px rgba(0,0,0,.35)}
@media(max-width:760px){.mm-curriculum-grid{grid-template-columns:1fr}.mm-curriculum-focus{align-items:stretch;flex-direction:column}.mm-curriculum-focus button{width:100%}.mm-curriculum-return{right:12px;bottom:78px;max-width:calc(100vw - 24px)}}
`;
document.head.appendChild(style);

function cardHtml(rec,index,lessonId){
  const meta=TYPE_META[rec.type];
  const title=rec.item.title||rec.id;
  const detail=index===0?'Best fit for this lesson':'Evidence extension';
  return `<article class="mm-curriculum-card"><span class="mm-curriculum-type">${esc(meta.label)} · ${detail}</span><h4>${esc(title)}</h4><p>${esc(rec.why||meta.detail)}</p><div class="mm-next-actions"><button class="secondary" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lessonId)})">Open linked practice →</button></div></article>`;
}
function decorateLesson(){
  const root=document.getElementById('lesson');
  const lesson=currentLesson();
  const notes=root?.querySelector('#mmNotes')||[...(root?.querySelectorAll('.lesson-body h3')||[])].find(h=>h.textContent.trim()==='Your lesson notes');
  if(!root||!notes||root.querySelector('#mmCurriculumPractice'))return;
  const recs=recommendationsFor(lesson);
  notes.insertAdjacentHTML('beforebegin',`<section class="mm-curriculum-section" id="mmCurriculumPractice" aria-label="Linked curriculum practice"><div class="mm-curriculum-head"><div><span class="eyebrow">Theory → practice → evidence</span><h3>Apply this lesson</h3><p>Use the concept you just studied in two guided activities. The first is the closest fit; the second strengthens the evidence habit from another angle.</p></div><span class="pill">2 linked activities</span></div><div class="mm-curriculum-loop"><span><b>1</b> Learn the mechanism</span><span><b>2</b> Make a diagnosis</span><span><b>3</b> Read the evidence</span><span><b>4</b> Return and explain</span></div><div class="mm-curriculum-grid">${recs.map((rec,index)=>cardHtml(rec,index,lesson.id)).join('')}</div><div class="mm-curriculum-boundary"><b>Learning boundary:</b> linked practice is optional formative learning. It does not change formal assessment answers, certificate rules or production setpoints.</div></section>`);
  const jumps=root.querySelector('.mm-learning-jumps');
  if(jumps&&!jumps.querySelector('[data-mm-curriculum-jump]'))jumps.insertAdjacentHTML('beforeend','<button type="button" data-mm-curriculum-jump data-mm-onclick="mmLearningJump(\'mmCurriculumPractice\')">Linked practice</button>');
  const origin=getReturn();
  if(origin&&Number(origin.lessonId)===lesson.id)clearReturn();
}
function decorateDashboard(){
  const root=document.getElementById('dashboard');
  if(!root||root.querySelector('.mm-curriculum-focus'))return;
  const lesson=currentLesson();
  const rec=recommendationsFor(lesson)[0];
  if(!rec)return;
  const focus=root.querySelector('.mm-today-focus');
  const html=`<section class="mm-curriculum-focus" aria-label="Current lesson practice connection"><div><span class="eyebrow">Learning loop</span><b>After ${esc(lesson.title)}: ${esc(rec.item.title||rec.id)}</b><p>Move from the lesson explanation into guided practice, then return to explain what evidence changed your conclusion.</p></div><button class="ghost" type="button" data-mm-onclick="mmCurriculumOpen('${esc(rec.type)}','${esc(rec.id)}',${Number(lesson.id)})">Open linked practice</button></section>`;
  if(focus)focus.insertAdjacentHTML('afterend',html);else root.insertAdjacentHTML('afterbegin',html);
}

const originalRenderLesson=renderLesson;
const originalRenderDashboard=renderDashboard;
renderLesson=function(){originalRenderLesson();decorateLesson();updateReturnButton()};
renderDashboard=function(){originalRenderDashboard();decorateDashboard();updateReturnButton()};

validateCoverage();
ensureReturnButton();
window.MM_CURRICULUM_INTEGRATION={
  version:VERSION,
  recommendations:lessonId=>{const lesson=D.lessons.find(l=>l.id===Number(lessonId));return lesson?recommendationsFor(lesson).map(r=>({type:r.type,id:r.id,title:r.item.title||r.id,why:r.why})):[]},
  open:openPractice,
  returnToLesson,
  coverage:{lessons:D.lessons.length,courses:D.courses.length,linksPerLesson:2},
  scope:'Formative curriculum links from lessons to existing diagnostic, material and synthetic-data practice; no formal assessment mutation and no production recipe.'
};

if(typeof currentView==='string'){
  if(currentView==='lesson')decorateLesson();
  if(currentView==='dashboard')decorateDashboard();
}
updateReturnButton();
})();
/* <<< curriculum-integration.js */

/* >>> specialist-curriculum.js */
/* MouldMaster specialist curriculum — optional gap-driven extensions — 2026.08.26.1 */
(function(){
'use strict';

const VERSION='2026.08.26.1';
const STORAGE_BASE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-curriculum.js requires the canonical 120-lesson core');

const LESSONS=[
  {
    id:'S01',title:'Hazardous-energy intervention, isolation & stored energy',level:'Specialist safety',
    gap:'The core teaches safe observation and safeguarding, while regional assessment evidence goes deeper into servicing, guard removal, danger-zone entry and stored energy. This extension connects those ideas without replacing site-specific authorised isolation training.',
    coreLessons:[6,15,100],
    objectives:['Distinguish normal stop, emergency stop, safeguarding and hazardous-energy isolation.','Recognise when servicing or intervention changes the risk state of the moulding cell.','Identify the evidence an authorised isolation procedure must address before work begins.'],
    keypoints:['A stopped machine can still contain electrical, hydraulic, pneumatic, thermal, gravitational or mechanically stored energy.','An interlock or emergency-stop function is not automatically an energy-isolation method.','Isolation requirements depend on the real task, equipment, jurisdiction and approved site procedure.','Training must never encourage bypassing guards, defeating interlocks or entering a danger zone to complete an exercise.'],
    evidenceTask:'For a hypothetical intervention, list the energy forms that could remain after a normal stop, then identify which current machine manual, site isolation procedure and jurisdiction-specific safety source would have to be checked by an authorised person before work.',
    practices:[{type:'standards',label:'Review standards & safety references'},{type:'core',id:'6',label:'Revisit core lesson 6 — Safe start-up observation'}]
  },
  {
    id:'S02',title:'Clamp force, projected area & mould-opening risk',level:'Specialist process engineering',
    gap:'Clamp anatomy and flash are already covered, but the core does not give projected-area reasoning its own focused learning step even though the assessment and defect library use it.',
    coreLessons:[14,18,52,65],
    objectives:['Explain how cavity pressure acting over projected area creates mould-opening force.','Separate local flash/tooling evidence from a genuine global clamp-capability question.','Recognise why machine-, mould- and process-specific methods are required instead of a universal tonnage rule.'],
    keypoints:['Projected area is the cavity and runner area projected onto the parting plane, not part surface area in three dimensions.','Cavity pressure is not perfectly uniform, so simple multiplication is a reasoning model rather than a universal sizing recipe.','Local flash after a tooling event can occur while global clamp force remains stable.','More clamp force is not a substitute for inspecting parting lines, inserts, support, mould condition and the actual pressure history.'],
    evidenceTask:'Sketch the projected footprint of an example multi-cavity tool, identify what pressure evidence would be needed to reason about opening force, and separately list evidence that would favour a local shutoff/tooling cause.',
    practices:[{type:'data',id:'local-flash-tooling',label:'Data diagnosis — Local flash vs global clamp'},{type:'core',id:'14',label:'Revisit core lesson 14 — Clamp unit anatomy'}]
  },
  {
    id:'S03',title:'Plasticising controls: back pressure, screw speed, decompression & recovery',level:'Specialist machine/process',
    gap:'Screw recovery is a core topic, but plasticising controls need a deeper systems view so learners do not treat recovery time, melt condition, mixing and decompression as independent knobs.',
    coreLessons:[11,12,13,25,48],
    objectives:['Relate screw rotation, back pressure, recovery time and melt condition as coupled plasticising responses.','Explain why decompression is a pressure-management function rather than a material-quality cure.','Use recovery and shot-delivery trends to decide whether a machine/plasticising investigation is warranted.'],
    keypoints:['Screw speed and back pressure can change shear work, mixing, recovery time and material thermal history.','A barrel-zone setpoint does not by itself prove actual melt condition.','Decompression can influence nozzle pressure and feed behaviour but should not be used to hide an unstable shot-delivery mechanism.','Trend recovery time, cushion, transfer, shot mass and melt evidence together before making a mechanism claim.'],
    evidenceTask:'Compare a stable and drifting plasticising sequence. Decide which measured actuals would distinguish feed inconsistency, check-ring behaviour, excessive recovery demand and a developing screw/barrel condition.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'data',id:'check-ring-leakage',label:'Data diagnosis — Check-ring leakage'}]
  },
  {
    id:'S04',title:'Reinforced polymers: fibre orientation, anisotropy & conditioning',level:'Specialist materials',
    gap:'The core covers polymer families, orientation and warpage, but reinforced materials need an explicit bridge between fibre direction, anisotropic shrinkage/stiffness and the material conditioning state used for measurement.',
    coreLessons:[21,23,58,104,107],
    objectives:['Explain why reinforced polymers can respond differently along and across flow direction.','Separate pre-mould drying from post-mould conditioning and test-state definition.','Connect gate/flow orientation and thermal balance to directional dimensional behaviour.'],
    keypoints:['Fibre reinforcement can make shrinkage, stiffness and warpage strongly direction-dependent.','Drying before moulding and conditioning after moulding are different operations with different purposes.','A property or dimension without its conditioning state and measurement direction can be misleading.','Global process compensation can hide an orientation or tooling mechanism rather than correct it.'],
    evidenceTask:'Define a dimensional study for a glass-filled polyamide part that records flow direction, conditioning state, measurement timing and local thermal evidence before comparing dimensions.',
    practices:[{type:'material',id:'pa66-gf30-dry-conditioned',label:'Material lab — PA66-GF30 dry vs conditioned'},{type:'core',id:'104',label:'Revisit core lesson 104 — Orientation'}]
  },
  {
    id:'S05',title:'Purging, contamination & material compatibility',level:'Specialist materials/safety',
    gap:'Material changeover and thermal degradation are core topics, but contamination and purge compatibility need a stronger material-specific safety boundary.',
    coreLessons:[27,28,29,30],
    objectives:['Treat purge/changeover decisions as material-specific rather than universal.','Recognise when contamination or excessive thermal history becomes a safety issue as well as a quality issue.','Use identity, history and approved supplier/site procedures before attempting process recovery.'],
    keypoints:['A purge method acceptable for one resin may be ineffective or unsafe for another.','Unknown material identity is evidence of uncertainty, not permission to process through it.','Thermal abuse can create degradation products and pressure hazards; increasing heat is not a universal blockage response.','Contamination evidence should be traced through hoppers, dryers, transfer lines, barrel/nozzle, hot runner and regrind streams as applicable.'],
    evidenceTask:'For a hypothetical mixed-material changeover, identify the material identities and compatibility information that must be verified, the locations where hold-up could remain, and the approved documents that control the clean-out/restart decision.',
    practices:[{type:'material',id:'pom-thermal-safety',label:'Material lab — POM thermal/contamination safety'},{type:'material',id:'abs-thermal-history',label:'Material lab — ABS thermal history'}]
  },
  {
    id:'S06',title:'Internal defects: voids, delamination & hidden failure modes',level:'Specialist troubleshooting',
    gap:'Voids and delamination already exist in the Defect Finder but do not have dedicated core lessons, leaving a gap between visible symptom troubleshooting and internal/sectioned evidence.',
    coreLessons:[53,56,59,67],
    objectives:['Distinguish internal shrinkage voids from surface sink and other internal discontinuities.','Recognise contamination/incompatibility and interlayer bonding as possible delamination mechanisms.','Choose destructive inspection, material identity and packing evidence when surface appearance is insufficient.'],
    keypoints:['A visually acceptable surface does not prove the interior is sound.','Voids in thick sections can reflect center shrinkage, gate effectiveness and cooling gradients.','Delamination can point toward incompatibility, contamination, excessive shear or weak interlayer bonding.','Sectioning, microscopy or other approved inspection methods can be more diagnostic than repeated machine adjustments.'],
    evidenceTask:'Take one hypothetical hidden defect and define the minimum evidence needed to distinguish geometry/packing/cooling from material incompatibility or degradation before changing the validated process.',
    practices:[{type:'defects',label:'Defect Finder — Voids and delamination'},{type:'data',id:'gate-seal-study',label:'Data diagnosis — Gate-seal/packing plateau'}]
  },
  {
    id:'S07',title:'SPC, control charts & reaction plans',level:'Specialist quality engineering',
    gap:'Capability and DOE are strong in the core, but statistical process control needs an explicit lesson on time order, common/special causes and disciplined reaction rather than adjustment to every point.',
    coreLessons:[9,60,71,72,73,74,80],
    objectives:['Explain why time-ordered stability evidence comes before capability interpretation.','Distinguish common-cause variation from signals that warrant investigation under an approved reaction plan.','Avoid tampering with a stable process in response to measurement noise or isolated points.'],
    keypoints:['A process can be within specification and still be unstable; specification limits and control limits answer different questions.','Control charts are decision aids whose chart type, subgrouping and rules must match the process and quality system.','Reaction plans should identify what evidence to check before changing the process.','Measurement-system problems can create apparent process signals that should not be tuned away.'],
    evidenceTask:'Design a simple time-ordered monitoring plan for one critical dimension or process actual: define the subgroup logic, known-good baseline evidence, investigation trigger and first checks in the reaction plan without inventing universal numeric limits.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement noise masquerading as drift'},{type:'core',id:'72',label:'Revisit core lesson 72 — Stability before capability'}]
  },
  {
    id:'S08',title:'Gage R&R, MSA & measurement uncertainty',level:'Specialist measurement',
    gap:'Measurement-system awareness is already a core lesson, but learners need a deeper exercise separating repeatability, reproducibility, resolution, fixture/method and part variation.',
    coreLessons:[60,72,75,76,82],
    objectives:['Separate process variation from variation introduced by the measurement system.','Explain repeatability and reproducibility in practical moulded-part measurement.','Recognise when fixture, conditioning time, operator method or resolution can dominate the conclusion.'],
    keypoints:['A larger measured spread does not prove the moulding process became less stable.','Measurement studies must reflect the real characteristic, method, operators/conditions and expected part range.','Resolution alone does not establish measurement adequacy.','Capability, DOE and validation conclusions inherit the limitations of the measurement system used to generate them.'],
    evidenceTask:'Build a measurement-system investigation for a dimension that suddenly appears noisier: define repeated measurements, operator/method comparisons, fixture and conditioning controls, and an independent process signal to compare against.',
    practices:[{type:'data',id:'measurement-noise',label:'Data diagnosis — Measurement-system variation'},{type:'core',id:'75',label:'Revisit core lesson 75 — Measurement system awareness'}]
  },
  {
    id:'S09',title:'Sequential and valve-gate timing',level:'Specialist tooling/process',
    gap:'Hot runners and balancing are core topics, but sequential valve-gate timing deserves focused treatment because a local timing shift can look like a global fill problem.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Explain why valve timing changes local flow-front interaction and cavity balance.','Compare commanded valve timing with actual actuation and cavity-specific response.','Avoid global recipe changes when the evidence isolates one sequential branch or gate.'],
    keypoints:['One cavity or branch separating while others remain stable is strong localisation evidence.','Commanded timing is not proof that the valve physically actuated at that time.','Cavity pressure, fill signature, actuator/sensor evidence and part pattern should be interpreted together.','Sequential-gating optimisation must remain within approved tool, hot-runner and process limits.'],
    evidenceTask:'For a two-branch sequential-gate example, identify the signals that would distinguish an actual valve-delay fault from a global viscosity or machine-velocity change.',
    practices:[{type:'data',id:'valve-gate-timing',label:'Data diagnosis — Valve-gate timing'},{type:'core',id:'108',label:'Revisit core lesson 108 — Hot-runner balancing'}]
  },
  {
    id:'S10',title:'Screw/barrel wear & plasticising-system health',level:'Specialist maintenance/process',
    gap:'Maintenance-process interaction is a core expert lesson, but screw/barrel wear deserves its own diagnostic bridge because gradual wear often appears first as coupled recovery, melt and shot-delivery drift.',
    coreLessons:[11,12,13,48,113,118],
    objectives:['Recognise coupled process signatures that justify a plasticising-system investigation.','Separate gradual machine wear from material-lot, feed and cavity-side causes.','Use trend and maintenance evidence rather than compensating indefinitely with recipe changes.'],
    keypoints:['Wear can alter conveying, melting, recovery and repeatability before it becomes visually obvious.','Recovery time alone is not enough; combine it with melt, shot, back-pressure and material evidence.','A changed process response after maintenance should be compared with the known-good baseline.','Confirmed mechanical deterioration should be corrected under the approved maintenance process before redefining the validated moulding window.'],
    evidenceTask:'Create a trend review that uses recovery time, melt/shot evidence, back-pressure response, material history and maintenance findings to decide whether a machine inspection is warranted.',
    practices:[{type:'data',id:'screw-barrel-wear',label:'Data diagnosis — Screw/barrel wear'},{type:'core',id:'118',label:'Revisit core lesson 118 — Maintenance-process interaction'}]
  },
  {
    id:'S11',title:'Ejector/tool condition, drag & release evidence',level:'Specialist tooling',
    gap:'Ejection is taught in the core, but drag, eject force and local thermal/tool condition need a deeper diagnostic link so learners do not simply increase ejection force or speed.',
    coreLessons:[35,36,37,49,58,106],
    objectives:['Relate ejection load to local temperature, shrinkage, draft, texture and tool condition.','Use eject-force and thermal trends as evidence rather than treating release as a purely mechanical setting.','Separate a local release problem from a global cycle or packing problem.'],
    keypoints:['Higher eject force is a symptom measurement as well as a machine setting concern.','Local cooling imbalance can change dimensions and release load together.','Draft, texture, surface/tool condition and deformation can all affect drag.','Increasing ejection force without identifying the mechanism can damage parts or tooling and conceal the real condition.'],
    evidenceTask:'Compare baseline and high-drag cycles using eject force, part/eject temperature, dimension, surface evidence and cooling-flow data. State which evidence would send the investigation toward cooling versus tooling/release geometry.',
    practices:[{type:'data',id:'ejector-drag',label:'Data diagnosis — Ejector drag'},{type:'core',id:'37',label:'Revisit core lesson 37 — Ejection'}]
  },
  {
    id:'S12',title:'Sustainable processing: energy base load & recycled-feedstock variability',level:'Specialist sustainability/process',
    gap:'Cycle-time economics and scrap reduction are in the expert core, but energy efficiency and recycled-material variability need explicit evidence-based treatment so sustainability changes are not separated from quality and validation.',
    coreLessons:[29,63,71,80,112,116,117],
    objectives:['Separate energy consumed by productive moulding work from machine/auxiliary base load.','Treat recycled-feedstock lot variation as a material/process input that may require verification or revalidation.','Evaluate sustainability changes against quality, robustness, traceability and approved material requirements rather than one metric alone.'],
    keypoints:['Energy per cycle can rise while cycle time and accepted quality remain stable, pointing toward machine or auxiliary demand.','Nominally similar recycled feedstock can show meaningful rheology and lot variation.','Lower energy or higher recycled content is not a valid improvement if quality, material compliance or process robustness is lost.','Track material identity, lot/property evidence, process actuals, reject/scrap response and energy together.'],
    evidenceTask:'Build a before/after sustainability review that includes energy per accepted part, cycle/quality stability, material lot/property evidence and the change-control decision needed before adopting a new normal condition.',
    practices:[{type:'data',id:'energy-base-load',label:'Data diagnosis — Energy base load'},{type:'data',id:'recycled-pp-lot',label:'Data diagnosis — Recycled PP lot variability'},{type:'material',id:'recycled-pp-lot-rheology',label:'Material lab — Recycled PP rheology'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeState(x){try{localStorage.setItem(storageKey(),JSON.stringify(x))}catch(_){}}
function isDone(id){return !!readState()[id]}
function setDone(id,done){const s=readState();if(done)s[id]=true;else delete s[id];writeState(s);decorateDashboard(true)}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}

function ensureStyle(){
  if(document.getElementById('mm-specialist-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-style';s.textContent=`
.mm-specialist-strip{margin-top:16px;padding:18px;border:1px solid #315171;border-radius:14px;background:linear-gradient(135deg,#10243a,#0d1c30)}.mm-specialist-strip h3{margin:4px 0 8px}.mm-specialist-strip p{color:var(--muted,#a9bdd6);line-height:1.55;margin:0 0 12px}.mm-specialist-meta{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0 13px}.mm-specialist-meta span{font-size:11px;border:1px solid #3a5a79;border-radius:999px;padding:5px 8px;color:#bfd2e8}.mm-specialist-modal{position:fixed;inset:0;z-index:10050;background:rgba(4,10,20,.82);display:grid;place-items:center;padding:18px}.mm-specialist-modal.hidden{display:none}.mm-specialist-dialog{width:min(1080px,96vw);max-height:92vh;overflow:auto;border:1px solid #385a7c;border-radius:18px;background:#0c182a;color:#edf5ff;box-shadow:0 26px 70px rgba(0,0,0,.5)}.mm-specialist-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:19px 21px;background:#101f33;border-bottom:1px solid #28435f}.mm-specialist-head h2{margin:4px 0 0}.mm-specialist-body{padding:20px}.mm-specialist-boundary{padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;line-height:1.55;font-size:12px;margin:0 0 16px}.mm-specialist-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mm-specialist-card{padding:17px;border:1px solid #2e4a68;border-radius:13px;background:#102037}.mm-specialist-card h3{margin:7px 0}.mm-specialist-card p{font-size:13px;color:#b8cbe0;line-height:1.55}.mm-specialist-card .done{color:#79e3b2;font-weight:800}.mm-specialist-eyebrow{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#79aef2;font-weight:800}.mm-specialist-section{padding:15px;border:1px solid #294661;border-radius:12px;background:#0f1d30;margin:12px 0}.mm-specialist-section h3{margin-top:0}.mm-specialist-section ul{margin:8px 0 0;padding-left:20px}.mm-specialist-section li{margin:7px 0;line-height:1.5;color:#d6e2ef}.mm-specialist-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mm-specialist-actions button{min-height:38px}.mm-specialist-core{display:flex;gap:6px;flex-wrap:wrap}.mm-specialist-core button{font-size:11px}.mm-specialist-evidence{border-left:4px solid #55d6be;padding-left:14px}.mm-specialist-done-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid #29445f}@media(max-width:760px){.mm-specialist-grid{grid-template-columns:1fr}.mm-specialist-modal{padding:0}.mm-specialist-dialog{width:100vw;max-height:100vh;height:100vh;border-radius:0}.mm-specialist-head{padding:15px}.mm-specialist-body{padding:15px}}
`;
  document.head.appendChild(s)
}
function ensureModal(){
  ensureStyle();let m=document.getElementById('mmSpecialistModal');if(m)return m;
  m=document.createElement('div');m.id='mmSpecialistModal';m.className='mm-specialist-modal hidden';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Specialist curriculum extensions');
  m.innerHTML='<div class="mm-specialist-dialog"><div class="mm-specialist-head"><div><span class="mm-specialist-eyebrow">Optional specialist learning</span><h2 id="mmSpecialistTitle">Specialist extensions</h2></div><button class="ghost" type="button" data-mm-onclick="mmSpecialistClose()" aria-label="Close specialist curriculum">Close ×</button></div><div class="mm-specialist-body" id="mmSpecialistBody"></div></div>';
  m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m
}
function open(){const m=ensureModal();m.classList.remove('hidden');renderCatalog();m.querySelector('button')?.focus()}
function close(){document.getElementById('mmSpecialistModal')?.classList.add('hidden')}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Verify the exact resin, machine, mould, approved site procedure and applicable safety requirements before real work.</div>'}
function renderCatalog(){
  const body=document.getElementById('mmSpecialistBody');const title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;
  title.textContent='Specialist extensions';const done=LESSONS.filter(x=>isDone(x.id)).length;
  body.innerHTML=boundary()+`<div class="mm-specialist-meta"><span>120 core lessons unchanged</span><span>${LESSONS.length} optional extensions</span><span>${done}/${LESSONS.length} completed locally</span></div><div class="mm-specialist-grid">${LESSONS.map(l=>`<article class="mm-specialist-card"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p>${isDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" data-mm-onclick="mmSpecialistLesson('${l.id}')">Open extension →</button></div></article>`).join('')}</div>`
}
function renderLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;const m=ensureModal();m.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');title.textContent=l.title;
  const coreButtons=l.coreLessons.map(id=>{const x=coreLesson(id);return x?`<button class="ghost" type="button" data-mm-onclick="mmSpecialistPractice('core','${id}')">${id}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" data-mm-onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use existing MouldMaster formative practice to test the mechanism with evidence.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" data-mm-onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${isDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" data-mm-onclick="mmSpecialistToggle('${l.id}')">${isDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`
}
function practice(type,id){
  close();
  if(type==='core'){
    const n=Number(id);if(typeof openLesson==='function')return openLesson(n);try{currentLesson=n;if(typeof switchView==='function')switchView('lesson')}catch(_){}return
  }
  if(type==='defects'){if(typeof switchView==='function')switchView('defects');return}
  if(type==='standards'){if(typeof switchView==='function')switchView('standards');return}
  if(type==='data'&&window.MM_PROCESS_DATA_DIAGNOSTICS){window.MM_PROCESS_DATA_DIAGNOSTICS.open();setTimeout(()=>document.querySelector(`[data-pd-start="${id}"]`)?.click(),0);return}
  if(type==='material'&&window.MM_MATERIAL_BEHAVIOUR_LABS){window.MM_MATERIAL_BEHAVIOUR_LABS.open();setTimeout(()=>document.querySelector(`[data-ml-start="${id}"]`)?.click(),0);return}
}
function toggle(id){setDone(id,!isDone(id));renderLesson(id)}
function decorateDashboard(force){
  ensureStyle();const root=document.getElementById('dashboard');if(!root)return;const old=root.querySelector('#mmSpecialistDashboard');if(old){if(!force)return;old.remove()}
  const done=LESSONS.filter(x=>isDone(x.id)).length;
  root.insertAdjacentHTML('beforeend',`<section class="mm-specialist-strip" id="mmSpecialistDashboard" aria-label="Specialist curriculum extensions"><span class="mm-specialist-eyebrow">Go deeper where the core stops</span><h3>Specialist extensions</h3><p>The 120-lesson core remains the complete main pathway. These ${LESSONS.length} optional lessons close specific depth gaps in safety intervention, machine health, materials, measurement, tooling and sustainability—and each links back to existing evidence practice.</p><div class="mm-specialist-meta"><span>${LESSONS.length} optional lessons</span><span>${done} completed locally</span><span>No certificate requirement</span></div><button class="secondary" type="button" data-mm-onclick="mmSpecialistOpen()">Explore specialist extensions →</button></section>`)
}

const originalRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(originalRenderDashboard){renderDashboard=function(){originalRenderDashboard();decorateDashboard(false)}}
window.mmSpecialistOpen=open;window.mmSpecialistClose=close;window.mmSpecialistLesson=renderLesson;window.mmSpecialistPractice=practice;window.mmSpecialistToggle=toggle;
window.MM_SPECIALIST_CURRICULUM={version:VERSION,coreLessonCount:120,optional:true,lessons:LESSONS.map(l=>({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p}))})),open,scope:'Optional formative specialist learning; canonical 120-lesson completion path and formal assessment/certificate rules are unchanged; no production recipe.'};
window.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
if(typeof currentView==='string'&&currentView==='dashboard')decorateDashboard(false);
})();
/* <<< specialist-curriculum.js */

/* >>> specialist-evidence-gap-extension.js */
/* MouldMaster specialist evidence-gap extension — optional formative learning — 2026.08.28.2 */
(function(){
'use strict';
if(window.MM_SPECIALIST_EVIDENCE_GAPS)return;

const VERSION='2026.08.28.2';
const STORAGE_BASE='mm_specialist_evidence_gaps_v1';
const BASE_STORAGE='mm_specialist_curriculum_v1';
const CORE=window.MM_DATA;
const BASE=window.MM_SPECIALIST_CURRICULUM;
if(!CORE||!Array.isArray(CORE.lessons)||CORE.lessons.length!==120)throw new Error('specialist-evidence-gap-extension.js requires the canonical 120-lesson core');
if(!BASE||!Array.isArray(BASE.lessons)||BASE.lessons.length!==12)throw new Error('specialist-evidence-gap-extension.js requires the established 12 specialist extensions');

const LESSONS=[
  {
    id:'S13',title:'Residual stress, frozen-in orientation & birefringence',level:'Specialist materials/quality',
    evidenceArea:'residual-stress-birefringence',evidenceStatus:'Provisional',
    gap:'Warpage and orientation are already covered, but residual stress needs a separate evidence path because a dimensionally acceptable part can still contain frozen-in stress that later appears as optical distortion, cracking, creep or dimensional movement.',
    coreLessons:[23,49,58,59,104],
    objectives:['Explain how flow, pressure and cooling history can leave non-uniform residual stress.','Distinguish visible warpage from hidden stress or optical anisotropy.','Choose physical evidence such as polarised-light response, controlled annealing comparison or dimensional relaxation before claiming a residual-stress mechanism.'],
    keypoints:['Residual stress is a history-dependent material state, not a single machine setting.','Birefringence can reveal molecular orientation or stress in suitable transparent polymers, but interpretation depends on material, thickness and optical method.','A change in mould temperature, fill/pack history or cooling balance can change residual stress without producing an immediate reject.','Simulation or appearance alone is not proof of the internal stress field.'],
    evidenceTask:'Compare two hypothetical transparent mouldings with similar dimensions but different optical stress patterns. Define the process-history, thermal, optical and post-conditioning evidence needed to decide whether the difference is consistent with frozen-in stress rather than surface marking or measurement error.',
    practices:[{type:'core',id:'58',label:'Revisit core learning — warpage mechanisms'},{type:'defects',label:'Defect Finder — dimensional and surface evidence'}]
  },
  {
    id:'S14',title:'Weld-line structural strength versus appearance',level:'Specialist defect mechanics',
    evidenceArea:'weld-line-mechanical-strength',evidenceStatus:'Provisional',
    gap:'Weld lines are easy to judge visually, but a faint line can still be structurally important and a visible line can be acceptable. This extension separates appearance from local mechanical integrity.',
    coreLessons:[31,53,55,67,104],
    objectives:['Explain why flow-front meeting conditions can affect molecular/fibre interdiffusion and local strength.','Separate cosmetic visibility from structural performance.','Define a test plan that compares weld-line location, loading direction and matched non-weld specimens.'],
    keypoints:['Weld-line strength depends on material, temperature history, pressure, contamination, venting, fibre orientation and geometry.','Visual severity is not a universal proxy for tensile, impact or fatigue strength.','A weld line positioned in a high-stress region can matter more than a more visible line elsewhere.','Local process changes should be checked against the validated part function, not cosmetic appearance alone.'],
    evidenceTask:'Design a comparison for a part with a weld line near a loaded feature: specify matched specimens, loading direction, conditioning, weld position, process actuals and the physical failure metric that would distinguish cosmetic from structural risk.',
    practices:[{type:'defects',label:'Defect Finder — weld lines'},{type:'core',id:'55',label:'Revisit core learning — flow-front meeting defects'}]
  },
  {
    id:'S15',title:'Runner, gate & multicavity imbalance diagnosis',level:'Specialist tooling/process',
    evidenceArea:'runner-gate-multicavity-imbalance',evidenceStatus:'Provisional',
    gap:'Balancing is present in the core, but learners need a stricter localisation method for separating a genuinely global viscosity/fill shift from one branch, gate or cavity drifting away from the rest.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Use cavity-to-cavity patterns to distinguish local distribution imbalance from global process movement.','Compare fill, pressure, part mass and temperature evidence by cavity rather than relying on the machine average.','Recognise when runner/gate geometry, restriction, temperature or venting should be investigated before changing the global recipe.'],
    keypoints:['A machine trace can remain stable while one cavity becomes locally under-packed or delayed.','Cavity-specific part mass and pressure evidence are often more diagnostic than a single total shot metric.','Balanced geometry does not guarantee balanced flow when temperatures, restrictions, gates or venting differ.','Global compensation can move all cavities and hide the local mechanism rather than correct it.'],
    evidenceTask:'Given four hypothetical cavities where one progressively loses mass, define the minimum cavity-specific evidence needed to distinguish a local gate/runner restriction, local temperature issue and global viscosity shift.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'defects',label:'Defect Finder — short shot, flash and weld evidence'}]
  },
  {
    id:'S16',title:'Hot-runner actual thermal & mechanical behaviour',level:'Specialist hot-runner/process',
    evidenceArea:'hot-runner-actual-behaviour',evidenceStatus:'Provisional',
    gap:'Set temperatures and valve commands are not the same as actual melt-channel condition or physical valve response. This extension teaches learners to seek independent actuals before blaming the machine recipe.',
    coreLessons:[33,38,39,64,94,108],
    objectives:['Separate hot-runner setpoint from actual heater/sensor/channel behaviour.','Compare commanded valve-gate timing with physical actuation and cavity response.','Recognise branch-specific evidence that justifies hot-runner inspection instead of a global moulding adjustment.'],
    keypoints:['A displayed zone temperature proves controller/sensor state, not uniform melt temperature everywhere in the manifold.','Heater, thermocouple, wiring, tip, valve-pin and pneumatic/hydraulic faults can create local symptoms.','Repeated cavity-specific timing or pressure separation is strong localisation evidence.','Hot-runner intervention requires approved tooling procedures and hazardous-energy controls; this lesson does not authorise servicing.'],
    evidenceTask:'Create an evidence chain for one cavity that begins filling late while machine velocity and total shot remain stable. Include commanded/actual valve evidence, heater/sensor trends, cavity pressure or part mass, and the maintenance evidence needed before concluding a hot-runner fault.',
    practices:[{type:'core',id:'108',label:'Revisit core lesson 108 — hot-runner balancing'},{type:'standards',label:'Review authorised tooling and safety references'}]
  },
  {
    id:'S17',title:'Liquid silicone rubber: metering, mixing & cure behaviour',level:'Specialist material/process',
    evidenceArea:'liquid-silicone-rubber',evidenceStatus:'Provisional',
    gap:'The main pathway is thermoplastic-centred. LSR needs a separate conceptual boundary because mixing, inhibition, cure kinetics and cold-runner/hot-mould behaviour differ materially from conventional thermoplastic injection moulding.',
    coreLessons:[20,21,22,27,30,43],
    objectives:['Distinguish thermoset cure behaviour from thermoplastic cooling/solidification.','Identify metering/mixing, inhibition, mould temperature and cure-time evidence relevant to LSR.','Avoid transferring thermoplastic troubleshooting rules directly to LSR without material-system evidence.'],
    keypoints:['LSR quality depends on controlled component ratio, mixing, contamination control and cure history.','Some contaminants can inhibit cure; adding temperature or time is not a universal correction.','Cold-runner and hot-mould architecture reverses several familiar thermoplastic thermal assumptions.','Supplier-system instructions, machine/tool documentation and validated cure evidence are essential because formulations vary.'],
    evidenceTask:'For a hypothetical under-cured LSR feature, list the evidence that would separate ratio/metering error, mixing problem, inhibition/contamination, local mould-temperature loss and insufficient cure residence before any process change.',
    practices:[{type:'core',id:'21',label:'Revisit core learning — polymer/material behaviour'},{type:'standards',label:'Review material-system and machine documentation'}]
  },
  {
    id:'S18',title:'Gas-, water- & projectile-assisted moulding',level:'Specialist assisted moulding',
    evidenceArea:'fluid-assisted-moulding',evidenceStatus:'Provisional',
    gap:'Fluid-assisted processes introduce a moving internal medium, penetration timing and hollow-section formation that cannot be diagnosed from conventional cavity filling logic alone.',
    coreLessons:[31,32,40,41,52,63],
    objectives:['Explain the purpose of an assisted medium in creating hollow or cored regions.','Identify penetration, fingering, breakthrough and switchover evidence distinct from conventional short-shot behaviour.','Recognise the additional pressure, equipment and safety controls required by assisted processes.'],
    keypoints:['Gas, water and projectile-assisted variants have different heat transfer, penetration and equipment behaviours.','Medium timing relative to polymer fill/pack state strongly affects penetration.','Part weight, internal geometry, pressure traces and sectioning can be more informative than exterior appearance.','High-pressure assisted systems require approved equipment procedures; this education does not authorise intervention.'],
    evidenceTask:'For a hollow handle with unstable penetration length, define the fill/assist timing, pressure, part-mass, sectioning and temperature evidence needed to distinguish polymer-viscosity movement from assist-delivery or tooling effects.',
    practices:[{type:'core',id:'31',label:'Revisit core learning — filling behaviour'},{type:'standards',label:'Review assisted-process equipment and safety references'}]
  },
  {
    id:'S19',title:'Surface replication, texture, adhesion & release',level:'Specialist surface/tooling',
    evidenceArea:'surface-replication-release',evidenceStatus:'Provisional',
    gap:'Microtexture and high-fidelity surfaces couple filling, local thermal history, pressure, surface energy and demoulding. Better replication can increase release load, so quality and ejection evidence must be interpreted together.',
    coreLessons:[31,37,49,58,67,106],
    objectives:['Relate local surface replication to melt/mould temperature, pressure history and feature geometry.','Explain why improved replication can alter contact area and demoulding force.','Use microscopy/replication metrics together with eject-force or release evidence instead of treating surface quality in isolation.'],
    keypoints:['Feature replication is scale- and geometry-dependent; bulk part fill does not prove microfeature fill.','Surface coating, roughness, texture, material and temperature can change adhesion/friction at release.','Higher mould temperature may improve replication while also changing cycle, shrinkage and release behaviour.','A surface-image improvement is not automatically a production improvement if damage or ejection risk rises.'],
    evidenceTask:'Define a trial for a textured insert that records feature-replication quality, mould/part temperature, pressure history, eject force and surface damage so the learner can judge the trade-off between replication and release.',
    practices:[{type:'core',id:'37',label:'Revisit core lesson 37 — ejection'},{type:'defects',label:'Defect Finder — surface and drag evidence'}]
  },
  {
    id:'S20',title:'Injection-compression & precision optical moulding',level:'Specialist precision processing',
    evidenceArea:'injection-compression-precision-optics',evidenceStatus:'Provisional',
    gap:'Precision optical parts add compression-stroke timing, optical stress, replication fidelity and extremely tight geometry requirements that need a distinct evidence chain beyond conventional pack-and-hold thinking.',
    coreLessons:[31,49,58,59,71,79],
    objectives:['Explain how injection-compression changes cavity pressure development and replication compared with conventional packing.','Identify optical/precision outcomes such as birefringence, form error, replication and dimensional stability.','Separate machine command timing from actual mould movement, pressure and part response.'],
    keypoints:['Compression timing and gap/position interact with fill state and pressure history.','Low visible defect levels do not guarantee low optical stress or acceptable form accuracy.','Mould temperature uniformity, replication and demoulding can all affect optical quality.','Process optimisation must use the actual optic, tool and metrology method; published settings are not universal recipes.'],
    evidenceTask:'For a precision lens showing acceptable mass but variable optical distortion, define the compression position/timing, cavity pressure, mould temperature, optical metrology and dimensional evidence needed before attributing the issue to compression control.',
    practices:[{type:'core',id:'79',label:'Revisit core learning — validation and dimensional evidence'},{type:'core',id:'58',label:'Revisit core learning — warpage and stress-related behaviour'}]
  }
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerToken(){
  let raw='anonymous';
  try{if(typeof user!=='undefined'&&user?.id)raw=String(user.id);else if(window.db?.activeUser)raw=String(window.db.activeUser)}catch(_){}
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function key(base){return `${base}::${learnerToken()}`}
function readKey(base){try{const x=JSON.parse(localStorage.getItem(key(base))||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeGap(x){try{localStorage.setItem(key(STORAGE_BASE),JSON.stringify(x))}catch(_){}}
function gapDone(id){return !!readKey(STORAGE_BASE)[id]}
function setGapDone(id,done){const s=readKey(STORAGE_BASE);if(done)s[id]=true;else delete s[id];writeGap(s);patchDashboard();}
function baseDoneCount(){return Object.keys(readKey(BASE_STORAGE)).filter(id=>/^S(?:0[1-9]|1[0-2])$/.test(id)).length}
function gapDoneCount(){return LESSONS.filter(x=>gapDone(x.id)).length}
function totalDone(){return baseDoneCount()+gapDoneCount()}
function coreLesson(id){return CORE.lessons.find(x=>x.id===Number(id))}
function resolvedStatus(l){
  const bridged=window.MM_SPECIALIST_EVIDENCE_STATUS?.statuses?.[l.evidenceArea];
  if(bridged)return bridged;
  const exported=window.MM_SPECIALIST_EVIDENCE_GAPS?.lessons?.find(x=>x.id===l.id)?.evidenceStatus;
  return exported||l.evidenceStatus||'Provisional';
}
function evidenceStateMarkup(l){
  const state=resolvedStatus(l);
  if(state==='Promoted')return `<strong>Evidence status: Promoted</strong><br>Registry area: ${esc(l.evidenceArea)}. Independent publisher-verified primary measured studies have satisfied the mechanism promotion rule. Promotion is mechanism-level only; study-specific settings remain bounded to their material, mould, machine and test context.`;
  if(state==='Gap')return `<strong>Evidence status: Gap</strong><br>Registry area: ${esc(l.evidenceArea)}. Suitable primary measured confirmation is not yet retained. Treat this as a hypothesis/evidence exercise, not validated production guidance.`;
  return `<strong>Evidence status: Provisional</strong><br>Registry area: ${esc(l.evidenceArea)}. This mechanism remains bounded formative learning and is not promoted evidence until independent publisher-verified primary measured studies satisfy the repository promotion rule.`;
}

function ensureStyle(){
  if(document.getElementById('mm-specialist-gap-style'))return;
  const s=document.createElement('style');s.id='mm-specialist-gap-style';s.textContent=`
.mm-specialist-evidence-state{margin:10px 0 0;padding:10px 12px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.5}.mm-specialist-evidence-state strong{color:#ffe69a}.mm-specialist-gap-card{border-color:#5e5430!important}.mm-specialist-gap-card .mm-specialist-eyebrow{color:#e8c96a}.mm-specialist-gap-chip{display:inline-block;margin-top:8px;padding:4px 8px;border:1px solid #6b5e2d;border-radius:999px;color:#f1dd98;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
`;
  document.head.appendChild(s)
}
function boundary(){return '<div class="mm-specialist-boundary"><strong>Learning boundary:</strong> These are optional specialist extensions outside the canonical 120-lesson completion path. They are formative education, do not change formal assessment answers or certificate requirements, and are not production recipes or machine-specific authorisation. Evidence-gap lessons start with conservative provisional fallbacks and show Promoted only after the mechanism-level registry promotion rule is satisfied; learner completion never changes evidence status.</div>'}
function patchCatalog(){
  ensureStyle();
  const body=document.getElementById('mmSpecialistBody');if(!body)return;
  const grid=body.querySelector('.mm-specialist-grid');if(!grid)return;
  for(const l of LESSONS){
    if(grid.querySelector(`[data-specialist-gap="${l.id}"]`))continue;
    const state=resolvedStatus(l);
    grid.insertAdjacentHTML('beforeend',`<article class="mm-specialist-card mm-specialist-gap-card" data-specialist-gap="${esc(l.id)}" data-evidence-status="${esc(state.toLowerCase())}"><span class="mm-specialist-eyebrow">${esc(l.id)} · ${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.gap)}</p><span class="mm-specialist-gap-chip">Evidence: ${esc(state)}</span>${gapDone(l.id)?'<div class="done">Completed ✓</div>':''}<div class="mm-specialist-actions"><button class="secondary" type="button" data-mm-onclick="mmSpecialistGapLesson('${l.id}')">Open extension →</button></div></article>`)
  }
  const meta=body.querySelectorAll('.mm-specialist-meta span');
  if(meta[1])meta[1].textContent='20 optional extensions';
  if(meta[2])meta[2].textContent=`${totalDone()}/20 completed locally`;
}
function openGapLesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return;
  ensureStyle();const modal=document.getElementById('mmSpecialistModal');if(!modal){window.mmSpecialistOpen?.();return setTimeout(()=>openGapLesson(id),0)}
  modal.classList.remove('hidden');const body=document.getElementById('mmSpecialistBody'),title=document.getElementById('mmSpecialistTitle');if(!body||!title)return;title.textContent=l.title;
  const coreButtons=l.coreLessons.map(n=>{const x=coreLesson(n);return x?`<button class="ghost" type="button" data-mm-onclick="mmSpecialistPractice('core','${n}')">${n}. ${esc(x.title)}</button>`:''}).join('');
  body.innerHTML=boundary()+`<button class="ghost" type="button" data-mm-onclick="mmSpecialistOpen()">← All specialist extensions</button><section class="mm-specialist-section"><span class="mm-specialist-eyebrow">Gap this closes</span><p>${esc(l.gap)}</p><div class="mm-specialist-evidence-state">${evidenceStateMarkup(l)}</div></section><section class="mm-specialist-section"><h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section"><h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="mm-specialist-section mm-specialist-evidence"><h3>Evidence task</h3><p>${esc(l.evidenceTask)}</p></section><section class="mm-specialist-section"><h3>Linked core learning</h3><div class="mm-specialist-core">${coreButtons}</div></section><section class="mm-specialist-section"><h3>Apply the extension</h3><p>Use established formative learning to examine the mechanism without turning study-specific evidence into a universal production rule.</p><div class="mm-specialist-actions">${l.practices.map((p,i)=>`<button class="secondary" type="button" data-mm-onclick="mmSpecialistPractice('${p.type}','${esc(p.id||'')}')">${esc(p.label||`Practice ${i+1}`)}</button>`).join('')}</div></section><div class="mm-specialist-done-row"><span>${gapDone(l.id)?'Completed locally ✓':'Optional completion is stored only on this device for this learner.'}</span><button class="primary" type="button" data-mm-onclick="mmSpecialistGapToggle('${l.id}')">${gapDone(l.id)?'Mark incomplete':'Mark specialist lesson complete'}</button></div>`;
}
function toggle(id){setGapDone(id,!gapDone(id));openGapLesson(id)}
function patchDashboard(){
  const panel=document.getElementById('mmSpecialistDashboard');if(!panel)return;
  const p=panel.querySelector('p');if(p)p.textContent='The 120-lesson core remains the complete main pathway. These 20 optional lessons close specific depth gaps in safety, machine health, materials, measurement, tooling, sustainability and eight registry-tracked evidence areas. Each evidence-gap lesson displays its current evidence state; completing a lesson never promotes the mechanism.';
  const spans=panel.querySelectorAll('.mm-specialist-meta span');if(spans[0])spans[0].textContent='20 optional lessons';if(spans[1])spans[1].textContent=`${totalDone()} completed locally`;
}

const baseOpen=window.mmSpecialistOpen;
window.mmSpecialistOpen=function(){baseOpen();patchCatalog()};
window.mmSpecialistGapLesson=openGapLesson;window.mmSpecialistGapToggle=toggle;

const priorRenderDashboard=typeof renderDashboard==='function'?renderDashboard:null;
if(priorRenderDashboard){renderDashboard=function(){priorRenderDashboard();patchDashboard()}}

for(const l of LESSONS){BASE.lessons.push({id:l.id,title:l.title,level:l.level,coreLessons:[...l.coreLessons],practices:l.practices.map(p=>({...p})),evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus})}
BASE.evidenceGapExtension={version:VERSION,lessonCount:LESSONS.length,status:'Registry-controlled',scope:'Optional formative evidence-gap learning; does not alter the canonical 120 lessons, formal assessment answers or certificate requirements.'};
window.MM_SPECIALIST_EVIDENCE_GAPS={version:VERSION,optional:true,lessonCount:LESSONS.length,lessons:LESSONS.map(l=>({id:l.id,title:l.title,evidenceArea:l.evidenceArea,evidenceStatus:l.evidenceStatus,coreLessons:[...l.coreLessons]})),open:window.mmSpecialistOpen,scope:BASE.evidenceGapExtension.scope};
if(typeof currentView==='string'&&currentView==='dashboard')patchDashboard();
})();
/* <<< specialist-evidence-gap-extension.js */

/* >>> mould-master-workspace.js */
/* MouldMaster evidence-led troubleshooting workspace — 2026.09.03.3 */
(function(){
'use strict';
const VERSION='2026.09.03.3';
const MAX_CASES=80;
let activeId='';
let caseCache=[];
let hydrationPromise=null;
let hydratedLearnerToken='';
let storageFailure='';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function engineeringStore(){return window.MM_ENGINEERING_STORE||null}
async function resolveStore(){
  let store=engineeringStore();if(store)return store;
  try{if(window.MM_DOMAIN_BOOTSTRAP?.ready)await window.MM_DOMAIN_BOOTSTRAP.ready}catch(_){}
  return engineeringStore()
}
function uid(){try{return crypto.randomUUID()}catch(_){return 'case-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}}
function now(){return new Date().toISOString()}
function blank(){return{id:uid(),createdAt:now(),updatedAt:now(),title:'',defectId:null,defect:'',materialGradeId:null,material:'',machineId:null,machine:'',mouldId:null,mould:'',cavityId:null,onset:'Unknown / not yet defined',location:'',baseline:'',evidence:'',hypothesis:'',controlledTest:'',testResult:'',afterChange:'',verification:'',conclusion:'',status:'Investigating'}}
function all(){return caseCache.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))}
function get(id){return all().find(x=>x.id===id)||null}
function replaceCache(cases){caseCache=(Array.isArray(cases)?cases:[]).slice(0,MAX_CASES).map(x=>({...x}));return all()}
async function hydrate({force=false}={}){
  const store=await resolveStore();if(!store)throw new Error('Engineering case store unavailable');
  const owner=store.learnerToken();
  if(!force&&hydrationPromise&&hydratedLearnerToken===owner)return hydrationPromise;
  if(hydratedLearnerToken!==owner){activeId='';caseCache=[]}
  hydratedLearnerToken=owner;
  hydrationPromise=(async()=>{
    await store.bootstrap?.();
    const cases=await store.listCases(owner);
    if(hydratedLearnerToken!==owner)return all();
    storageFailure='';return replaceCache(cases)
  })().catch(err=>{if(hydratedLearnerToken===owner){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] canonical case store unavailable',err)}return all()});
  return hydrationPromise
}
async function saveCase(c){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  c.status=status(c);c.updatedAt=now();
  const saved=await store.saveCase(c,{token:owner}),cases=all().filter(x=>x.id!==saved.id);caseCache=[{...saved},...cases].slice(0,MAX_CASES);return saved
}
async function deleteCase(id){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  const removed=await store.deleteCase(id,owner);if(removed)caseCache=all().filter(x=>x.id!==id);if(activeId===id)activeId='';return removed
}
function persistenceError(err){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] case persistence failed',err);window.toast?.('Case could not be saved locally')}

function defects(){try{return Array.isArray(D?.defects)?D.defects:[]}catch(_){return[]}}
function lessons(){try{return Array.isArray(D?.lessons)?D.lessons:[]}catch(_){return[]}}
function specialist(){return window.MM_SPECIALIST_CURRICULUM?.lessons||[]}
function dataCases(){
  const guided=(window.MM_PROCESS_DATA_DIAGNOSTICS?.cases||[]).map(x=>({...x,origin:'Guided 14'}));
  const deep=(window.MM_PROCESS_DATA_DEEP_DIVE_50?.cases||[]).map(x=>({...x,origin:'50-case deep dive'}));
  const atlas=(window.MM_PROCESS_DATA_20_PASS_ATLAS?.cases||[]).map(x=>({...x,kind:x.kind||x.domain||'20-pass atlas',origin:'20-pass atlas'}));
  return [...guided,...deep,...atlas]
}
function materialLabs(){return window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[]}
function selectedDefect(c){return defects().find(d=>d.name===c.defect)||null}
const SHORT_TERMS=new Set(['PP','PC','ABS','POM','PET','PBT','TPU','PMMA','PEEK','PPS','LCP','HDPE','PA66','PA6','PPA','PEI','TPE'].map(x=>x.toLowerCase()));
function words(v){return String(v||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>3||SHORT_TERMS.has(x))}
function caseTerms(c){return [...new Set(words([c.defect,c.material,c.title,c.evidence,c.hypothesis].join(' ')))].slice(0,28)}
function scoreText(text,terms){const s=String(text||'').toLowerCase();return terms.reduce((n,t)=>n+(s.includes(t)?1:0),0)}
function relatedLessons(c){const terms=caseTerms(c);return lessons().map(l=>({l,score:scoreText([l.title,l.summary,l.intro,(l.keypoints||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.l)}
function relatedSpecialist(c){const terms=caseTerms(c);return specialist().map(l=>({l,score:scoreText([l.title,l.level].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.l)}
function relatedData(c){const terms=caseTerms(c);return dataCases().map(x=>({x,score:scoreText([x.title,x.kind,x.domain,x.passTitle,x.fault,x.diagnosis,x.next,(x.signals||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.x)}
function relatedMaterial(c){const terms=caseTerms(c);return materialLabs().map(x=>({x,score:scoreText([x.title,x.focus,(x.materials||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.x)}

function status(c){
  if(c.conclusion.trim()&&c.verification.trim()&&c.afterChange.trim())return 'Verified / documented';
  if(c.testResult.trim())return 'Tested — verification pending';
  if(c.controlledTest.trim())return 'Test planned';
  if(c.hypothesis.trim())return 'Mechanism ranked';
  return 'Investigating'
}
function completeness(c){const fields=['defect','onset','baseline','evidence','hypothesis','controlledTest','testResult','afterChange','verification','conclusion'];return Math.round(fields.filter(k=>String(c[k]||'').trim()).length/fields.length*100)}

function style(){if(document.getElementById('mm-mould-master-style'))return;const s=document.createElement('style');s.id='mm-mould-master-style';s.textContent=`
#mmMouldMasterWorkspace{--mw-line:#31506f;--mw-soft:#0e1d31}.mw-hero{padding:22px;background:radial-gradient(circle at 92% 0%,rgba(85,214,190,.17),transparent 33%),linear-gradient(135deg,#13273d,#0d1b2e)}.mw-hero h2{font-size:30px;margin:7px 0 8px}.mw-hero p{max-width:920px;line-height:1.6;color:#bfd0e2}.mw-boundary{margin-top:12px;padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.55}.mw-loop{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:14px}.mw-loop span{padding:8px 5px;text-align:center;border:1px solid #31506f;border-radius:9px;background:#102137;color:#bfd3e8;font-size:10px}.mw-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}.mw-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:14px}.mw-panel{padding:18px}.mw-panel h3{margin:0 0 10px}.mw-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.mw-form .wide{grid-column:1/-1}.mw-form textarea{min-height:96px}.mw-form textarea.tall{min-height:132px}.mw-help{font-size:11px;color:var(--muted);line-height:1.45;margin-top:5px}.mw-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.mw-summary{display:grid;gap:10px}.mw-kpi{padding:13px;border:1px solid #2d4764;border-radius:10px;background:#0e1d31}.mw-kpi span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.mw-kpi b{display:block;margin-top:4px}.mw-list{display:grid;gap:7px}.mw-item{padding:10px 11px;border:1px solid #2f4a68;border-radius:10px;background:#0f2035}.mw-item b{display:block;margin-bottom:4px}.mw-item p{margin:0;color:#b8c9dc;font-size:12px;line-height:1.45}.mw-chip-row{display:flex;gap:6px;flex-wrap:wrap}.mw-chip{font-size:10px;border:1px solid #3b5978;border-radius:999px;padding:4px 7px;color:#c4d8ed;background:#102137}.mw-cases{display:grid;gap:8px}.mw-case{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mw-case small{color:var(--muted)}.mw-danger{border-color:#6b3b45!important;color:#ffc7d0!important}.mw-evidence-board{display:grid;gap:8px}.mw-evidence-row{padding:10px 12px;border-left:4px solid #69a8ff;background:#102137;border-radius:8px;line-height:1.45;font-size:12px}.mw-mechanism{border-left-color:#ffd166}.mw-check{border-left-color:#55d6be}.mw-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted);font-size:12px}.mw-related button{width:100%;text-align:left;margin-top:6px}.mw-progress{height:7px;background:#20344d;border-radius:99px;overflow:hidden}.mw-progress i{display:block;height:100%;background:linear-gradient(90deg,#55d6be,#69a8ff)}
@media(max-width:900px){.mw-layout{grid-template-columns:1fr}.mw-loop{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.mw-form{grid-template-columns:1fr}.mw-form .wide{grid-column:auto}.mw-loop{grid-template-columns:repeat(2,1fr)}.mw-toolbar button{flex:1}.mw-panel{padding:15px}}
`;document.head.appendChild(s)}
function section(){let x=document.getElementById('mmMouldMasterWorkspace');if(x)return x;x=document.createElement('section');x.id='mmMouldMasterWorkspace';x.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(x);return x}
function hideViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function header(){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent='Mould Master';if(p)p.textContent='Build an evidence-led troubleshooting case from symptom to verified conclusion.'}
function mark(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));window.MM_APP_SHELL?.navigation?.setCustomActive?.('mould-master','practice')}

function defectOptions(c){return `<option value="">Select a defect / symptom…</option>${defects().map(d=>`<option ${d.name===c.defect?'selected':''}>${esc(d.name)}</option>`).join('')}`}
function onsetOptions(c){const vals=['Unknown / not yet defined','Just started','After material change','After mould maintenance','After machine change','After restart / setup','Gradually over time','Intermittent'];return vals.map(x=>`<option ${x===c.onset?'selected':''}>${esc(x)}</option>`).join('')}
function textField(label,key,c,wide=false,help=''){return `<label class="${wide?'wide':''}">${esc(label)}<input data-mw-field="${key}" value="${esc(c[key]||'')}">${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}
function area(label,key,c,help='',tall=false){return `<label class="wide">${esc(label)}<textarea class="${tall?'tall':''}" data-mw-field="${key}">${esc(c[key]||'')}</textarea>${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}

function evidenceBoard(c){const d=selectedDefect(c);if(!d)return '<div class="mw-empty">Choose a defect to load its known symptom, mechanism candidates and evidence checks. These are prompts to investigate, not an automatic diagnosis.</div>';return `<div class="mw-evidence-board"><div class="mw-evidence-row"><b>Observed symptom pattern</b><br>${esc(d.symptom||'')}</div>${(d.mechanisms||[]).slice(0,5).map(x=>`<div class="mw-evidence-row mw-mechanism"><b>Mechanism candidate</b><br>${esc(x)}</div>`).join('')}${(d.checks||[]).slice(0,6).map(x=>`<div class="mw-evidence-row mw-check"><b>Evidence to collect</b><br>${esc(x)}</div>`).join('')}</div>`}
function relatedHtml(c){
  const ls=relatedLessons(c),ss=relatedSpecialist(c),ds=relatedData(c),ms=relatedMaterial(c);
  const lessonButtons=ls.length?ls.map(l=>`<button class="ghost" type="button" data-mw-lesson="${l.id}">${esc(l.id+'. '+l.title)}</button>`).join(''):'<div class="mw-empty">Add a defect, material or evidence terms to surface related lessons.</div>';
  const spec=ss.length?`<div class="mw-chip-row">${ss.map(x=>`<span class="mw-chip">${esc(x.id+' · '+x.title)}</span>`).join('')}</div>`:'';
  const data=ds.length?ds.map(x=>`<button class="ghost" type="button" data-mw-data="${esc(x.id)}" data-mw-data-origin="${esc(x.origin||'Guided 14')}">${esc(x.origin||'Data case')} · ${esc(x.title)}</button>`).join(''):'';
  const mat=ms.length?ms.map(x=>`<button class="ghost" type="button" data-mw-material="${esc(x.id)}">Material lab · ${esc(x.title)}</button>`).join(''):'';
  return `<div class="mw-related"><h3>Learning & evidence links</h3>${lessonButtons}${spec}${data}${mat}<button class="ghost" type="button" data-mw-defects>Open Defect Finder</button><button class="ghost" type="button" data-mw-diagnostic>Open Diagnostic Labs</button><button class="ghost" type="button" data-mw-data-home>Open Data Diagnosis</button><p class="mw-help">Use these links to learn the mechanism or test your reasoning. Case notes remain your own local evidence record.</p></div>`
}
function casesHtml(active){const cs=all();if(!cs.length)return '<div class="mw-empty">No saved cases yet.</div>';return `<div class="mw-cases">${cs.slice(0,12).map(c=>`<div class="mw-case"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><small>${esc(status(c))} · ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button class="ghost" type="button" data-mw-open="${esc(c.id)}">${c.id===active?'Open':'View'}</button></div>`).join('')}</div>`}

function renderCase(c){activeId=c.id;const host=section();c.status=status(c);const pct=completeness(c);host.innerHTML=`
<div class="mw-hero card"><div class="eyebrow">Evidence-led troubleshooting workspace</div><h2>Mould Master case</h2><p>Define the symptom, localise where and when it occurs, compare against a known-good baseline, rank mechanisms, run the smallest controlled discriminating test, then verify the before/after result.</p><div class="mw-loop"><span>1 Define</span><span>2 Localise</span><span>3 Collect evidence</span><span>4 Rank mechanism</span><span>5 Controlled test</span><span>6 Verify</span></div><div class="mw-boundary"><b>Production boundary:</b> this workspace organises evidence and learning. It does not provide universal temperatures, pressures, speeds, force limits or authorisation to defeat safeguards. Verify the exact resin, machine, mould, validated process, approved site procedure and applicable safety requirements before real changes.</div></div>
<div class="mw-toolbar"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><div class="mw-help">Saved locally for this learner only.</div></div><div class="mw-actions"><button class="secondary" type="button" data-mw-new>New case</button><button class="ghost" type="button" data-mw-list>Case list</button><button class="ghost" type="button" data-mw-export>Export case</button></div></div>
<div class="mw-layout">
  <div class="mw-panel card"><h3>Case evidence record</h3><div class="mw-form">
    ${textField('Case title','title',c,false,'Use a short identifier such as “Cavity 3 flash after insert change”.')}
    <label>Defect / symptom<select data-mw-field="defect">${defectOptions(c)}</select><div class="mw-help">Select the closest visible symptom; the mechanism still has to be proven.</div></label>
    ${textField('Material / grade','material',c,false,'Record the exact grade and lot when known.')}
    ${textField('Machine / cell','machine',c,false,'Record the actual machine/cell, not only a recipe name.')}
    ${textField('Mould / tool / cavity','mould',c,false,'Include cavity, gate, insert or local area where relevant.')}
    <label>When did it start?<select data-mw-field="onset">${onsetOptions(c)}</select><div class="mw-help">Timing around a change event is often strong localisation evidence.</div></label>
    ${textField('Where / how often','location',c,true,'e.g. cavity-specific, one side of part, every cycle, intermittent, after warm-up.')}
    ${area('Known-good baseline','baseline',c,'Record the last verified-good condition: actuals, material state, tool/cooling condition and part response as applicable.')}
    ${area('Current measured evidence','evidence',c,'Use actual measurements, alarms, trends, part location/pattern and physical inspection. Separate facts from assumptions.',true)}
    ${area('Ranked mechanism / hypothesis','hypothesis',c,'State the mechanism and why the evidence supports it more strongly than alternatives. Do not write a setting change as the diagnosis.')}
    ${area('Smallest controlled discriminating test','controlledTest',c,'Define one safe test or inspection that separates plausible mechanisms while staying inside approved limits.',true)}
    ${area('Test result','testResult',c,'Record what actually changed and whether the result supported or weakened the mechanism.')}
    ${area('After-change / recovery evidence','afterChange',c,'Compare the same signals and part response used in the baseline. Recovery toward baseline strengthens causal confidence.')}
    ${area('Verification & repeatability','verification',c,'Record repeat cycles, independent quality checks, measurement confidence and any maintenance/tooling confirmation.')}
    ${area('Conclusion / standardisation','conclusion',c,'State what was proven, what remains uncertain, and what approved standard/work instruction/change-control action follows.',true)}
  </div><div class="mw-actions"><button class="primary" type="button" data-mw-save>Save case</button><button class="danger mw-danger" type="button" data-mw-delete>Delete case</button></div></div>
  <aside class="mw-summary">
    <div class="mw-panel card"><h3>Case status</h3><div class="mw-kpi"><span>Evidence chain</span><b>${esc(c.status)}</b></div><div class="mw-kpi"><span>Record completeness</span><b>${pct}%</b><div class="mw-progress"><i style="width:${pct}%"></i></div></div><div class="mw-kpi"><span>Decision rule</span><b>${c.verification.trim()?'Verification recorded':'Do not standardise yet'}</b></div></div>
    <div class="mw-panel card"><h3>Defect evidence board</h3>${evidenceBoard(c)}</div>
    <div class="mw-panel card">${relatedHtml(c)}</div>
  </aside>
</div>`;wire(host,c)}

function collect(c){document.querySelectorAll('#mmMouldMasterWorkspace [data-mw-field]').forEach(el=>{c[el.dataset.mwField]=el.value});c.status=status(c);return c}
function wire(host,c){
  let timer=null;host.querySelectorAll('[data-mw-field]').forEach(el=>el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{try{await saveCase(collect(c))}catch(err){persistenceError(err)}},500)}));
  host.querySelector('[data-mw-save]')?.addEventListener('click',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved);window.toast?.('Mould Master case saved')}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const n=await saveCase(blank());renderCase(n)}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-list]')?.addEventListener('click',()=>renderList());
  host.querySelector('[data-mw-delete]')?.addEventListener('click',async()=>{if(!confirm('Delete this local troubleshooting case?'))return;try{await deleteCase(c.id);renderList()}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-export]')?.addEventListener('click',()=>exportCase(collect(c)));
  host.querySelectorAll('[data-mw-lesson]').forEach(b=>b.addEventListener('click',()=>{try{user.currentLesson=Number(b.dataset.mwLesson);persist();switchView('lesson')}catch(_){}}));
  host.querySelector('[data-mw-defects]')?.addEventListener('click',()=>switchView('defects'));
  host.querySelector('[data-mw-diagnostic]')?.addEventListener('click',()=>window.MM_DIAGNOSTIC_LABS?.open?.());
  host.querySelector('[data-mw-data-home]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
  host.querySelectorAll('[data-mw-data]').forEach(b=>b.addEventListener('click',()=>{
    const origin=b.dataset.mwDataOrigin||'Guided 14',id=b.dataset.mwData;
    if(origin==='20-pass atlas'){
      window.MM_PROCESS_DATA_20_PASS_ATLAS?.open?.();
      return setTimeout(()=>document.querySelector(`[data-at20-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    if(origin==='50-case deep dive'){
      window.MM_PROCESS_DATA_DEEP_DIVE_50?.open?.();
      return setTimeout(()=>document.querySelector(`[data-dd50-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.();
    setTimeout(()=>document.querySelector(`[data-pd-start="${CSS.escape(id)}"]`)?.click(),0)
  }));
  host.querySelectorAll('[data-mw-material]').forEach(b=>b.addEventListener('click',()=>{window.MM_MATERIAL_BEHAVIOUR_LABS?.open?.();setTimeout(()=>document.querySelector(`[data-ml-start="${CSS.escape(b.dataset.mwMaterial)}"]`)?.click(),0)}));
  host.querySelector('[data-mw-field="defect"]')?.addEventListener('change',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved)}catch(err){persistenceError(err)}})
}
function exportCase(c){const payload={schema:1,version:VERSION,exportedAt:now(),trainingBoundary:'Evidence record only; not a universal production recipe or machine authorisation.',case:c};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-case-${String(c.title||c.id).replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,48)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function renderList(){activeId='';const host=section();host.innerHTML=`<div class="mw-hero card"><div class="eyebrow">Mould Master</div><h2>Troubleshooting casebook</h2><p>Keep diagnosis tied to the evidence chain rather than a sequence of unrecorded machine adjustments.</p><div class="mw-boundary"><b>Local-only record:</b> cases stay in this browser/desktop profile unless you explicitly export a case JSON file. No case data is uploaded by this module.</div></div><div class="mw-toolbar"><div><h2 style="margin:0">Saved cases</h2><p class="muted" style="margin:4px 0 0">${all().length} local case${all().length===1?'':'s'}</p></div><button class="primary" type="button" data-mw-new>New case</button></div><div class="mw-panel card">${casesHtml('')}</div>`;host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const c=await saveCase(blank());renderCase(c)}catch(err){persistenceError(err)}});host.querySelectorAll('[data-mw-open]').forEach(b=>b.addEventListener('click',()=>{const c=get(b.dataset.mwOpen);if(c)renderCase(c)}))}
async function open(id){style();await hydrate();const host=section();hideViews();host.classList.remove('hidden');header();mark();const c=id&&get(id)||get(activeId);if(c)renderCase(c);else renderList();window.scrollTo?.({top:0,behavior:'smooth'})}
async function newCase(seed={}){await hydrate();const c=await saveCase({...blank(),...seed,id:uid(),createdAt:now(),updatedAt:now()});await open(c.id);return c.id}

style();section();
window.mmOpenMouldMaster=()=>open();
window.MM_MOULD_MASTER_WORKSPACE={version:VERSION,canonicalStore:'indexeddb-v2',hydrate,open,newCase,cases:()=>all().map(x=>({...x})),getCase:id=>{const c=get(id);return c?{...c}:null},learnerToken:()=>hydratedLearnerToken,storageError:()=>storageFailure,scope:'Learner-scoped local IndexedDB evidence casebook; legacy localStorage is migration input only; no network upload, universal production setpoints, assessment mutation or machine authorisation.'};
window.addEventListener('mm:domains-ready',()=>hydrate({force:true}),{once:true});
})();
/* <<< mould-master-workspace.js */
