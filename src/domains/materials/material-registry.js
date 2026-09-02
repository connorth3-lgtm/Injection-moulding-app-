/* MouldMaster exact-grade material registry — 2026.09.03 */
(function(){
'use strict';
if(window.MM_MATERIAL_REGISTRY)return;
const VERSION='2026.09.03.3';
const CATALOG_URL='./material-catalog-v1.json';
let catalog=null;
let readyPromise=null;

function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function load(){
  if(catalog)return catalog;
  if(!readyPromise)readyPromise=fetch(CATALOG_URL,{cache:'no-store',credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(`${CATALOG_URL} returned ${r.status}`);return r.json()}).then(x=>{if(x?.schemaVersion!==1||!Array.isArray(x?.grades))throw new Error('invalid material catalog');catalog=x;return x});
  return readyPromise;
}
function displayName(g){return [g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function searchable(g){return norm([g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend].filter(Boolean).join(' '))}
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
function comparableSignature(obs){
  const prop=propertyKey(obs);
  return JSON.stringify({
    property:prop,
    unit:clean(obs?.unit),
    testMethod:clean(obs?.testMethod),
    temperatureC:obs?.temperatureC??null,
    loadKg:obs?.loadKg??null,
    specimen:clean(obs?.specimen),
    conditioning:clean(obs?.conditioning),
    direction:clean(obs?.direction)
  });
}
async function compareProperty(materialGradeIds,property){
  const rows=[];
  for(const id of materialGradeIds||[]){
    const grade=await get(id);if(!grade)continue;
    const observations=(grade.properties||[]).filter(o=>propertyKey(o)===norm(property).replace(/ /g,'_'));
    for(const observation of observations)rows.push({materialGradeId:id,material:displayName(grade),observation,comparisonReady:observation.comparisonReady===true,signature:comparableSignature(observation)});
  }
  const ready=rows.filter(x=>x.comparisonReady);
  const signatures=[...new Set(ready.map(x=>x.signature))];
  return {
    property,
    rows,
    comparisonReady:ready.length===rows.length&&rows.length>1&&signatures.length===1,
    blocker:rows.length<2?'At least two exact-grade observations are required.':ready.length!==rows.length?'One or more observations are not comparison-ready.':signatures.length!==1?'Test conditions differ; do not compare these values directly.':null
  };
}
async function manufacturers(){return (await load()).manufacturers||[]}
async function stats(){const c=await load();return {catalogVersion:c.catalogVersion||'',manufacturers:(c.manufacturers||[]).length,grades:(c.grades||[]).length,status:c.status||''}}

async function startMouldMasterCase(materialGradeId){
  const grade=await get(materialGradeId);if(!grade)throw new Error(`Unknown exact material grade ${materialGradeId}`);
  const workspace=window.MM_MOULD_MASTER_WORKSPACE;
  if(!workspace?.newCase)throw new Error('Mould Master workspace unavailable');
  const name=displayName(grade);
  const caseId=workspace.newCase({title:`${grade.grade} material investigation`,material:name});
  const legacy=workspace.getCase?.(caseId)||{id:caseId,title:`${grade.grade} material investigation`,material:name};
  const store=window.MM_ENGINEERING_STORE;
  if(store?.saveCase){
    await store.saveCase({...legacy,materialGradeId});
    await store.linkCaseMaterial(caseId,materialGradeId,name);
  }
  return caseId;
}

function style(){if(document.getElementById('mm-exact-material-style'))return;const s=document.createElement('style');s.id='mm-exact-material-style';s.textContent=`
.mm-exact-materials{margin-top:16px;padding:18px}.mm-exact-head{display:flex;justify-content:space-between;gap:12px;align-items:end}.mm-exact-head h2{margin:4px 0}.mm-exact-head p{margin:4px 0 0;color:var(--muted);line-height:1.5}.mm-exact-search{display:grid;grid-template-columns:1fr minmax(190px,.35fr);gap:9px;margin-top:13px}.mm-exact-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.mm-exact-grade{padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mm-exact-grade h3{margin:4px 0 7px}.mm-exact-grade p{margin:4px 0;color:#b8c9dc;font-size:12px;line-height:1.45}.mm-exact-grade button{margin-top:8px}.mm-exact-empty{margin-top:12px;padding:13px;border:1px dashed #405b78;border-radius:10px;color:var(--muted);line-height:1.5}.mm-exact-boundary{font-size:11px;color:var(--muted);line-height:1.45;margin-top:11px}@media(max-width:700px){.mm-exact-search,.mm-exact-results{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
async function renderResults(root){
  const input=root.querySelector('[data-mm-exact-query]'),select=root.querySelector('[data-mm-exact-manufacturer]'),host=root.querySelector('[data-mm-exact-results]');if(!host)return;
  const rows=await search(input?.value||'',{manufacturerId:select?.value||null,limit:40});
  if(!rows.length){host.innerHTML='<div class="mm-exact-empty">No published exact commercial grades match this filter. The family-level Academy material reference remains available above; it must not be treated as an exact-grade datasheet.</div>';return}
  host.innerHTML=rows.map(g=>`<article class="mm-exact-grade"><span class="eyebrow">Exact commercial grade</span><h3>${esc(displayName(g))}</h3><p>${esc(g.polymer?.family||'Unknown polymer family')}${g.polymer?.blend?` · ${esc(g.polymer.blend)}`:''}</p><p>${(g.properties||[]).length} sourced properties · ${(g.processing||[]).length} processing observations</p><button type="button" class="secondary" data-mm-exact-case="${esc(g.id)}">Start Mould Master case</button></article>`).join('');
  host.querySelectorAll('[data-mm-exact-case]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await startMouldMasterCase(b.dataset.mmExactCase)}catch(err){console.error('[MouldMaster materials]',err);b.disabled=false}}));
}
async function installPanel(){
  const host=document.getElementById('materials');if(!host||host.querySelector('#mmExactMaterialCatalog'))return false;
  style();const c=await load();
  const section=document.createElement('section');section.id='mmExactMaterialCatalog';section.className='card mm-exact-materials';
  section.innerHTML=`<div class="mm-exact-head"><div><span class="eyebrow">Canonical material domain</span><h2>Exact commercial grades</h2><p>Search source-backed exact grades separately from generic resin-family learning.</p></div><span class="pill">${(c.grades||[]).length} published</span></div><div class="mm-exact-search"><label>Search manufacturer, brand or grade<input data-mm-exact-query placeholder="e.g. manufacturer, PC/ABS, grade"></label><label>Manufacturer<select data-mm-exact-manufacturer><option value="">All manufacturers</option>${(c.manufacturers||[]).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></label></div><div class="mm-exact-results" data-mm-exact-results></div><div class="mm-exact-boundary">Only validated exact-grade records are shown here. Processing observations retain their source and are not universal production recipes.</div>`;
  host.appendChild(section);
  const rerender=()=>renderResults(section).catch(err=>console.warn('[MouldMaster materials]',err));
  section.querySelector('[data-mm-exact-query]')?.addEventListener('input',rerender);
  section.querySelector('[data-mm-exact-manufacturer]')?.addEventListener('change',rerender);
  await renderResults(section);return true;
}
function watchMaterials(){
  installPanel().catch(()=>{});
  const observer=new MutationObserver(()=>installPanel().catch(()=>{}));observer.observe(document.documentElement,{childList:true,subtree:true});
}

window.MM_MATERIAL_REGISTRY=Object.freeze({version:VERSION,catalogUrl:CATALOG_URL,load,all,get,search,displayName,manufacturers,propertyObservations,compareProperty,stats,startMouldMasterCase,installPanel});
load().then(watchMaterials).catch(err=>console.warn('[MouldMaster materials] exact-grade catalog unavailable',err));
})();
