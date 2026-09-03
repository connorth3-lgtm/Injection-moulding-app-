/* MouldMaster exact-grade material registry — 2026.09.03 */
(function(){
'use strict';
if(window.MM_MATERIAL_REGISTRY)return;
const VERSION='2026.09.03.7';
const CATALOG_URL='./material-catalog-v1.json';
let catalog=null;
let readyPromise=null;

function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function safeUrl(v){try{const u=new URL(clean(v),location.href);return u.protocol==='https:'?u.href:''}catch(_){return''}}
function humanKind(v){return clean(v).replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
async function load(){
  if(catalog)return catalog;
  if(!readyPromise)readyPromise=fetch(CATALOG_URL,{cache:'no-store',credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(`${CATALOG_URL} returned ${r.status}`);return r.json()}).then(x=>{if(x?.schemaVersion!==1||!Array.isArray(x?.grades))throw new Error('invalid material catalog');catalog=x;return x});
  return readyPromise;
}
function displayName(g){return [g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function searchable(g){return norm([g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend,g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].filter(Boolean).join(' '))}
async function all(){return (await load()).grades.slice()}
async function get(id){return (await load()).grades.find(x=>x.id===id)||null}
async function search(query,{manufacturerId=null,polymerFamily=null,limit=50}={}){
  const terms=norm(query).split(/\s+/).filter(Boolean);
  const grades=(await load()).grades.filter(g=>{
    if(manufacturerId&&g?.manufacturer?.id!==manufacturerId)return false;
    if(polymerFamily&&norm(g?.polymer?.family)!==norm(polymerFamily))return false;
    const hay=searchable(g);return terms.every(t=>hay.includes(t));
  });
  return grades.slice(0,Math.max(1,Math.min(Number(limit)||50,200)));
}
function propertyKey(obs){return norm(obs?.property).replace(/ /g,'_')}
async function propertyObservations(materialGradeId,property){
  const grade=await get(materialGradeId);if(!grade)return[];
  const wanted=norm(property).replace(/ /g,'_');
  return (grade.properties||[]).filter(x=>propertyKey(x)===wanted);
}
function comparableSignature(obs){return JSON.stringify({property:propertyKey(obs),unit:clean(obs?.unit),testMethod:clean(obs?.testMethod),temperatureC:obs?.temperatureC??null,loadKg:obs?.loadKg??null,specimen:clean(obs?.specimen),conditioning:clean(obs?.conditioning),direction:clean(obs?.direction)})}
async function compareProperty(materialGradeIds,property){
  const rows=[];
  for(const id of materialGradeIds||[]){
    const grade=await get(id);if(!grade)continue;
    const observations=(grade.properties||[]).filter(o=>propertyKey(o)===norm(property).replace(/ /g,'_'));
    for(const observation of observations)rows.push({materialGradeId:id,material:displayName(grade),observation,comparisonReady:observation.comparisonReady===true,signature:comparableSignature(observation)});
  }
  const ready=rows.filter(x=>x.comparisonReady),signatures=[...new Set(ready.map(x=>x.signature))];
  return {property,rows,comparisonReady:ready.length===rows.length&&rows.length>1&&signatures.length===1,blocker:rows.length<2?'At least two exact-grade observations are required.':ready.length!==rows.length?'One or more observations are not comparison-ready.':signatures.length!==1?'Test conditions differ; do not compare these values directly.':null};
}
async function manufacturers(){return (await load()).manufacturers||[]}
async function stats(){const c=await load();return {catalogVersion:c.catalogVersion||'',manufacturers:(c.manufacturers||[]).length,grades:(c.grades||[]).length,status:c.status||''}}

async function startMouldMasterCase(materialGradeId){
  const grade=await get(materialGradeId);if(!grade)throw new Error(`Unknown exact material grade ${materialGradeId}`);
  const workspace=window.MM_MOULD_MASTER_WORKSPACE;if(!workspace?.newCase)throw new Error('Mould Master workspace unavailable');
  const name=displayName(grade);
  const caseId=await workspace.newCase({title:`${grade.grade} material investigation`,material:name,materialGradeId});
  const store=window.MM_ENGINEERING_STORE;if(store?.linkCaseMaterial)await store.linkCaseMaterial(caseId,materialGradeId,name);
  return caseId;
}

function valueText(obs){const value=obs?.value??'',unit=clean(obs?.unit);return `${clean(value)}${unit?` ${unit}`:''}`}
function propertyCondition(obs){
  const parts=[];
  if(clean(obs?.testMethod))parts.push(clean(obs.testMethod));
  if(Number.isFinite(obs?.temperatureC))parts.push(`${obs.temperatureC}°C`);
  if(Number.isFinite(obs?.loadKg))parts.push(`${obs.loadKg} kg`);
  if(clean(obs?.specimen))parts.push(clean(obs.specimen));
  if(clean(obs?.conditioning))parts.push(clean(obs.conditioning));
  if(['flow','transverse'].includes(obs?.direction))parts.push(obs.direction==='flow'?'flow direction':'transverse direction');
  return parts.join(' · ')||'Condition not fully resolved';
}
function processValue(obs){
  const unit=clean(obs?.unit);
  if(obs?.value!==null&&obs?.value!==undefined)return `${clean(obs.value)}${unit?` ${unit}`:''}`;
  if(obs?.min!==null&&obs?.min!==undefined&&obs?.max!==null&&obs?.max!==undefined)return `${obs.min}–${obs.max}${unit?` ${unit}`:''}`;
  if(obs?.min!==null&&obs?.min!==undefined)return `≥ ${obs.min}${unit?` ${unit}`:''}`;
  if(obs?.max!==null&&obs?.max!==undefined)return `≤ ${obs.max}${unit?` ${unit}`:''}`;
  return 'Not stated';
}
function preferredProperty(g){const props=g?.properties||[];return props.find(o=>['mfr','mfi','melt_flow_index','melt_flow_rate','melt_mass_flow_rate','melt_volume_flow_rate','mvr'].includes(propertyKey(o)))||props[0]||null}
function sourceById(g,id){return (g?.sources||[]).find(s=>s.id===id)||null}
function sourceLink(g,id){const s=sourceById(g,id),url=safeUrl(s?.url);if(!s||!url)return'';return `<a class="mm-exact-source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(humanKind(s.kind)||'Primary source')}</a>`}
function renderPropertyRows(g){return (g.properties||[]).map(o=>`<tr><th scope="row">${esc(o.property)}</th><td><strong>${esc(valueText(o))}</strong></td><td>${esc(propertyCondition(o))}</td><td><span class="mm-exact-status ${o.comparisonReady===true?'ready':'context'}">${o.comparisonReady===true?'Comparable when conditions match':'Context only'}</span>${sourceLink(g,o.sourceId)}</td></tr>`).join('')}
function renderPropertyLimitations(g){const notes=[...new Set((g.properties||[]).map(o=>clean(o.limitations)).filter(Boolean))];return notes.length?`<div class="mm-exact-limitations"><b>Supplier limitation</b>${notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}
function renderProcessingRows(g){return (g.processing||[]).map(o=>`<tr><th scope="row">${esc(o.parameter)}</th><td><strong>${esc(processValue(o))}</strong></td><td>${esc(o.condition||'Supplier guidance; verify current exact-grade source and site conditions.')}</td><td>${sourceLink(g,o.sourceId)}</td></tr>`).join('')}
function renderSources(g){return (g.sources||[]).map(s=>{const url=safeUrl(s.url);return `<li><b>${esc(s.title)}</b><span>${esc(humanKind(s.kind))}${s.retrievedAt?` · retrieved ${esc(s.retrievedAt)}`:''}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open primary source</a>`:''}</li>`}).join('')}
function renderGrade(g){
  const key=preferredProperty(g),properties=g.properties||[],processing=g.processing||[],variant=[g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].map(clean).filter(Boolean).join(' · ');
  return `<article class="mm-exact-grade" data-mm-material-grade="${esc(g.id)}"><span class="eyebrow">Exact commercial grade</span><h3>${esc(displayName(g))}</h3><p>${esc(g.polymer?.family||'Unknown polymer family')}${g.polymer?.blend&&g.polymer.blend!==g.polymer.family?` · ${esc(g.polymer.blend)}`:''}${variant?` · ${esc(variant)}`:''}</p>${key?`<div class="mm-exact-key"><span>Key sourced property</span><strong>${esc(key.property)} · ${esc(valueText(key))}</strong><small>${esc(propertyCondition(key))}</small></div>`:''}<p>${properties.length} sourced properties · ${processing.length} processing observations</p><details class="mm-exact-detail"><summary>View sourced grade details</summary><div class="mm-exact-detail-body">${properties.length?`<h4>Properties</h4>${renderPropertyLimitations(g)}<div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Property</th><th>Value</th><th>Test / condition</th><th>Evidence use</th></tr></thead><tbody>${renderPropertyRows(g)}</tbody></table></div>`:'<p class="mm-exact-empty">No property observations have been published for this exact grade yet.</p>'}${processing.length?`<h4>Supplier processing guidance</h4><p class="mm-exact-caution"><b>Starting evidence, not a production recipe.</b> Confirm the current supplier document, machine/tool constraints and site validation before making production changes.</p><div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Parameter</th><th>Guidance</th><th>Boundary / condition</th><th>Source</th></tr></thead><tbody>${renderProcessingRows(g)}</tbody></table></div>`:''}<h4>Primary sources</h4><ul class="mm-exact-sources">${renderSources(g)}</ul><p class="mm-exact-provenance">Lifecycle status: ${esc(g.lifecycle?.status||'unknown')} · checked ${esc(g.lifecycle?.checkedAt||'not recorded')} · provenance ${esc(g.provenance?.stage||'unknown')}.</p></div></details><div class="mm-exact-actions"><button type="button" class="secondary" data-mm-exact-case="${esc(g.id)}">Start Mould Master case</button></div></article>`;
}

function style(){if(document.getElementById('mm-exact-material-style'))return;const s=document.createElement('style');s.id='mm-exact-material-style';s.textContent=`
.mm-exact-materials{margin-top:16px;padding:18px}.mm-exact-head{display:flex;justify-content:space-between;gap:12px;align-items:end}.mm-exact-head h2{margin:4px 0}.mm-exact-head p{margin:4px 0 0;color:var(--muted);line-height:1.5}.mm-exact-search{display:grid;grid-template-columns:1fr minmax(190px,.35fr);gap:9px;margin-top:13px}.mm-exact-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px;align-items:start}.mm-exact-grade{min-width:0;padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mm-exact-grade h3{margin:4px 0 7px}.mm-exact-grade p{margin:4px 0;color:#b8c9dc;font-size:12px;line-height:1.45}.mm-exact-key{margin:10px 0;padding:9px 10px;border:1px solid #294966;border-radius:9px;background:#0a1728}.mm-exact-key span,.mm-exact-key small{display:block;color:#9fb3c9;font-size:11px;line-height:1.4}.mm-exact-key strong{display:block;margin:3px 0;font-size:13px}.mm-exact-detail{margin-top:10px;border-top:1px solid #29415c;padding-top:9px}.mm-exact-detail>summary{cursor:pointer;font-weight:700;color:#dcecff;padding:4px 0}.mm-exact-detail>summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.mm-exact-detail-body{padding-top:9px}.mm-exact-detail-body h4{margin:13px 0 7px;font-size:13px}.mm-exact-limitations{margin:7px 0 9px;padding:9px 10px;border:1px solid #4a425c;border-radius:8px;background:#19192a;color:#cbd4e1;font-size:10px;line-height:1.45}.mm-exact-limitations b{display:block;color:#e4eaff;margin-bottom:2px}.mm-exact-limitations p{margin:2px 0!important;color:#cbd4e1!important;font-size:10px!important}.mm-exact-table-wrap{max-width:100%;overflow:auto;border:1px solid #29415c;border-radius:9px}.mm-exact-table{width:100%;min-width:660px;border-collapse:collapse;font-size:11px}.mm-exact-table th,.mm-exact-table td{padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #233a53;line-height:1.45}.mm-exact-table thead th{background:#13253b;color:#cfe3f7}.mm-exact-table tbody th{color:#d8e8f7;min-width:140px}.mm-exact-table tr:last-child th,.mm-exact-table tr:last-child td{border-bottom:0}.mm-exact-status{display:inline-block;padding:3px 6px;border-radius:999px;font-size:10px;font-weight:700}.mm-exact-status.ready{background:#153729;color:#bfead2}.mm-exact-status.context{background:#342d1b;color:#f0dfa7}.mm-exact-source-link{display:block;margin-top:5px;font-size:10px;color:#a9d3ff}.mm-exact-caution{padding:9px 10px;border-left:3px solid #b18a36;background:#211f19;color:#e9dfc6!important}.mm-exact-sources{list-style:none;padding:0;margin:7px 0;display:grid;gap:7px}.mm-exact-sources li{padding:8px 9px;border:1px solid #29415c;border-radius:8px}.mm-exact-sources b,.mm-exact-sources span,.mm-exact-sources a{display:block}.mm-exact-sources span{font-size:10px;color:#9fb3c9;margin:2px 0 4px}.mm-exact-sources a{font-size:11px}.mm-exact-provenance{font-size:10px!important}.mm-exact-actions{margin-top:10px}.mm-exact-actions button{margin-top:0}.mm-exact-empty{margin-top:12px;padding:13px;border:1px dashed #405b78;border-radius:10px;color:var(--muted);line-height:1.5}.mm-exact-boundary{font-size:11px;color:var(--muted);line-height:1.45;margin-top:11px}@media(max-width:700px){.mm-exact-search,.mm-exact-results{grid-template-columns:1fr}.mm-exact-materials{padding:14px}.mm-exact-table{min-width:620px}}
`;document.head.appendChild(s)}
async function renderResults(root){
  const input=root.querySelector('[data-mm-exact-query]'),select=root.querySelector('[data-mm-exact-manufacturer]'),host=root.querySelector('[data-mm-exact-results]');if(!host)return;
  const rows=await search(input?.value||'',{manufacturerId:select?.value||null,limit:40});
  if(!rows.length){host.innerHTML='<div class="mm-exact-empty">No published exact commercial grades match this filter. The family-level Academy material reference remains available above; it must not be treated as an exact-grade datasheet.</div>';return}
  host.innerHTML=rows.map(renderGrade).join('');
  host.querySelectorAll('[data-mm-exact-case]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await startMouldMasterCase(b.dataset.mmExactCase)}catch(err){console.error('[MouldMaster materials]',err);b.disabled=false}}));
}
async function installPanel(){
  const host=document.getElementById('materials');if(!host||host.querySelector('#mmExactMaterialCatalog'))return false;
  style();const c=await load();
  const section=document.createElement('section');section.id='mmExactMaterialCatalog';section.className='card mm-exact-materials';
  section.innerHTML=`<div class="mm-exact-head"><div><span class="eyebrow">Canonical material domain</span><h2>Exact commercial grades</h2><p>Search source-backed exact grades separately from generic resin-family learning.</p></div><span class="pill">${(c.grades||[]).length} published</span></div><div class="mm-exact-search"><label>Search manufacturer, brand or grade<input data-mm-exact-query placeholder="e.g. manufacturer, PC/ABS, grade"></label><label>Manufacturer<select data-mm-exact-manufacturer><option value="">All manufacturers</option>${(c.manufacturers||[]).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></label></div><div class="mm-exact-results" data-mm-exact-results></div><div class="mm-exact-boundary">Only validated exact-grade records are shown here. Property values retain their test context; processing observations retain their primary source and are not universal production recipes.</div>`;
  host.appendChild(section);
  const rerender=()=>renderResults(section).catch(err=>console.warn('[MouldMaster materials]',err));
  section.querySelector('[data-mm-exact-query]')?.addEventListener('input',rerender);
  section.querySelector('[data-mm-exact-manufacturer]')?.addEventListener('change',rerender);
  await renderResults(section);return true;
}
function bindMaterialsLifecycle(){
  const install=()=>installPanel().catch(err=>console.warn('[MouldMaster materials]',err));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  const shell=window.MM_APP_SHELL;
  shell?.events?.onRender?.('materials',install);
  shell?.events?.onViewChange?.(view=>{if(view==='materials')install()});
  window.addEventListener('mm:domains-ready',install,{once:true});
}

window.MM_MATERIAL_REGISTRY=Object.freeze({version:VERSION,catalogUrl:CATALOG_URL,load,all,get,search,displayName,manufacturers,propertyObservations,compareProperty,stats,startMouldMasterCase,installPanel});
load().then(bindMaterialsLifecycle).catch(err=>console.warn('[MouldMaster materials] exact-grade catalog unavailable',err));
})();