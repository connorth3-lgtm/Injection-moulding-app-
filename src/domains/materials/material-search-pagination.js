/* MouldMaster indexed material catalog pagination — 2026.09.04 */
(function(){
'use strict';
if(window.MM_MATERIAL_SEARCH_PAGINATION)return;
const VERSION='2026.09.29.1';
const PAGE_SIZE=24;
const ALL_PAGE_SIZE=12;
function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeUrl(v){try{const u=new URL(clean(v),location.href);return u.protocol==='https:'?u.href:''}catch(_){return''}}
function humanKind(v){return clean(v).replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function propertyKey(obs){return norm(obs?.property).replace(/ /g,'_')}
function valueText(obs){const value=obs?.value??'',unit=clean(obs?.unit);return `${clean(value)}${unit?` ${unit}`:''}`}
function processValue(obs){const unit=clean(obs?.unit);if(obs?.value!==null&&obs?.value!==undefined)return `${clean(obs.value)}${unit?` ${unit}`:''}`;if(obs?.min!==null&&obs?.min!==undefined&&obs?.max!==null&&obs?.max!==undefined)return `${obs.min}–${obs.max}${unit?` ${unit}`:''}`;if(obs?.min!==null&&obs?.min!==undefined)return `≥ ${obs.min}${unit?` ${unit}`:''}`;if(obs?.max!==null&&obs?.max!==undefined)return `≤ ${obs.max}${unit?` ${unit}`:''}`;return 'Not stated'}
function propertyCondition(obs){const parts=[];if(clean(obs?.testMethod))parts.push(clean(obs.testMethod));if(Number.isFinite(obs?.temperatureC))parts.push(`${obs.temperatureC}°C`);if(Number.isFinite(obs?.loadKg))parts.push(`${obs.loadKg} kg`);if(clean(obs?.specimen))parts.push(clean(obs.specimen));if(clean(obs?.conditioning))parts.push(clean(obs.conditioning));if(['flow','transverse'].includes(obs?.direction))parts.push(obs.direction==='flow'?'flow direction':'transverse direction');return parts.join(' · ')||'Condition not fully resolved'}
function preferredProperty(g){const props=g?.properties||[];return props.find(o=>['mfr','mfi','melt_flow_index','melt_flow_rate','melt_mass_flow_rate','melt_volume_flow_rate','mvr'].includes(propertyKey(o)))||props[0]||null}
function sourceById(g,id){return (g?.sources||[]).find(s=>s.id===id)||null}
function sourceLink(g,id){const s=sourceById(g,id),url=safeUrl(s?.url);if(!s||!url)return'';return `<a class="mm-exact-source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(humanKind(s.kind)||'Primary source')}</a>`}
function renderPropertyRows(g){return (g.properties||[]).map(o=>`<tr><th scope="row">${esc(o.property)}</th><td><strong>${esc(valueText(o))}</strong></td><td>${esc(propertyCondition(o))}</td><td><span class="mm-exact-status ${o.comparisonReady===true?'ready':'context'}">${o.comparisonReady===true?'Comparable when conditions match':'Context only'}</span>${sourceLink(g,o.sourceId)}</td></tr>`).join('')}
function renderPropertyLimitations(g){const notes=[...new Set((g.properties||[]).map(o=>clean(o.limitations)).filter(Boolean))];return notes.length?`<div class="mm-exact-limitations"><b>Supplier limitation</b>${notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}
function renderProcessingRows(g){return (g.processing||[]).map(o=>`<tr><th scope="row">${esc(o.parameter)}</th><td><strong>${esc(processValue(o))}</strong></td><td>${esc(o.condition||'Supplier guidance; verify current exact-grade source and site conditions.')}</td><td>${sourceLink(g,o.sourceId)}</td></tr>`).join('')}
function renderSources(g){return (g.sources||[]).map(s=>{const url=safeUrl(s.url);return `<li><b>${esc(s.title)}</b><span>${esc(humanKind(s.kind))}${s.retrievedAt?` · retrieved ${esc(s.retrievedAt)}`:''}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open primary source</a>`:''}</li>`}).join('')}
function displayName(g){return window.MM_MATERIAL_REGISTRY?.displayName?.(g)||[g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function renderGrade(g){const key=preferredProperty(g),properties=g.properties||[],processing=g.processing||[],variant=[g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].map(clean).filter(Boolean).join(' · ');return `<article class="mm-exact-grade" data-mm-material-grade="${esc(g.id)}"><span class="eyebrow">Exact commercial grade</span><h3>${esc(displayName(g))}</h3><p>${esc(g.polymer?.family||'Unknown polymer family')}${g.polymer?.blend&&g.polymer.blend!==g.polymer.family?` · ${esc(g.polymer.blend)}`:''}${variant?` · ${esc(variant)}`:''}</p>${key?`<div class="mm-exact-key"><span>Key sourced property</span><strong>${esc(key.property)} · ${esc(valueText(key))}</strong><small>${esc(propertyCondition(key))}</small></div>`:''}<p>${properties.length} sourced properties · ${processing.length} processing observations</p><details class="mm-exact-detail"><summary>View sourced grade details</summary><div class="mm-exact-detail-body">${properties.length?`<h4>Properties</h4>${renderPropertyLimitations(g)}<div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Property</th><th>Value</th><th>Test / condition</th><th>Evidence use</th></tr></thead><tbody>${renderPropertyRows(g)}</tbody></table></div>`:'<p class="mm-exact-empty">No property observations have been published for this exact grade yet.</p>'}${processing.length?`<h4>Supplier processing guidance</h4><p class="mm-exact-caution"><b>Starting evidence, not a production recipe.</b> Confirm the current supplier document, machine/tool constraints and site validation before making production changes.</p><div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Parameter</th><th>Guidance</th><th>Boundary / condition</th><th>Source</th></tr></thead><tbody>${renderProcessingRows(g)}</tbody></table></div>`:''}<h4>Primary sources</h4><ul class="mm-exact-sources">${renderSources(g)}</ul><p class="mm-exact-provenance">Lifecycle status: ${esc(g.lifecycle?.status||'unknown')} · checked ${esc(g.lifecycle?.checkedAt||'not recorded')} · provenance ${esc(g.provenance?.stage||'unknown')}.</p></div></details><div class="mm-exact-actions"><button type="button" class="secondary" data-mm-exact-case="${esc(g.id)}">Start Mould Master case</button></div></article>`}
function materialTypeLabel(type){return ({'exact-grade':'Exact grade','reference-material':'Material family / reference','material-lab':'Material lab','material-practice':'Material practice'})[type]||humanKind(type)}
function compactText(value,max=260){const text=clean(value).replace(/\s+/g,' ');return text.length>max?text.slice(0,max-1).trimEnd()+'…':text}
function resultSummary(doc){
  const p=doc?.payload||{};
  if(doc.type==='exact-grade'){
    const props=(p.properties||[]).map(x=>`${clean(x.property)} ${valueText(x)}`).join(' · ');
    const proc=(p.processing||[]).map(x=>`${clean(x.parameter)} ${processValue(x)}`).join(' · ');
    return compactText([props,proc].filter(Boolean).join(' · ')||doc.subtitle);
  }
  if(doc.type==='reference-material')return compactText([...(p.traits||[]),...(p.watch||[]),p.verify].filter(Boolean).join(' · '));
  return compactText([p.summary,...(p.evidence||[]),...(p.related||[])].filter(Boolean).join(' · '));
}
function renderAllResult(doc){
  const sourceCount=(doc.sourceIds||[]).length;
  return `<article class="mm-material-index-card" data-mm-material-index-result="${esc(doc.id)}" data-mm-material-index-type="${esc(doc.type)}"><div class="mm-material-index-meta"><span class="pill">${esc(materialTypeLabel(doc.type))}</span>${sourceCount?`<span>${sourceCount} evidence source${sourceCount===1?'':'s'}</span>`:''}</div><h4>${esc(doc.title)}</h4>${doc.subtitle?`<p class="mm-material-index-subtitle">${esc(doc.subtitle)}</p>`:''}<p>${esc(resultSummary(doc))}</p>${doc.materialGradeId?`<button type="button" class="secondary" data-mm-index-grade="${esc(doc.materialGradeId)}">Show exact grade</button>`:''}</article>`;
}
function installAllIndex(root,index,query){
  if(root.querySelector('[data-mm-all-material-index]'))return;
  const section=document.createElement('section');section.className='mm-material-all-index';section.dataset.mmAllMaterialIndex='';
  section.innerHTML=`<div class="mm-material-all-index-head"><span class="eyebrow">Search all material knowledge</span><h3>Unified material index</h3><p>Search published exact-grade evidence, family/reference guidance and material practice content. Private staging records are excluded.</p></div><div class="mm-material-all-index-controls"><label>Search all material data<input data-mm-all-material-query type="search" placeholder="e.g. moisture, shrinkage, PC/ABS, warpage, GP5206F"></label><label>Result type<select data-mm-all-material-type><option value="">All published material data</option><option value="exact-grade">Exact grades</option><option value="reference-material">Family / reference</option><option value="material-lab">Material labs</option><option value="material-practice">Material practice</option></select></label></div><p class="mm-exact-boundary" data-mm-all-material-status role="status" aria-live="polite"></p><div class="mm-material-all-results" data-mm-all-material-results></div><div class="mm-exact-actions" data-mm-all-material-pager><button type="button" class="secondary" data-mm-all-material-page="previous">Previous</button><button type="button" class="secondary" data-mm-all-material-page="next">Next</button></div>`;
  const exactSearch=root.querySelector('.mm-exact-search');exactSearch?.insertAdjacentElement('beforebegin',section);
  const allQuery=section.querySelector('[data-mm-all-material-query]'),type=section.querySelector('[data-mm-all-material-type]'),host=section.querySelector('[data-mm-all-material-results]'),status=section.querySelector('[data-mm-all-material-status]'),pager=section.querySelector('[data-mm-all-material-pager]'),previous=section.querySelector('[data-mm-all-material-page="previous"]'),next=section.querySelector('[data-mm-all-material-page="next"]');
  let page=1,seq=0;
  async function render(reset=false){
    if(reset)page=1;const mine=++seq;const selected=type.value?[type.value]:null;const result=await index.searchAllPage(allQuery.value||'',{types:selected,page,pageSize:ALL_PAGE_SIZE});if(mine!==seq)return;
    page=result.page;host.innerHTML=result.items.length?result.items.map(renderAllResult).join(''):'<div class="mm-exact-empty">No published material data match this search.</div>';
    previous.disabled=!result.hasPrevious;next.disabled=!result.hasNext;pager.hidden=result.pageCount<=1;
    status.textContent=`${result.total} matching material records · page ${result.page} of ${result.pageCount}`;
    root.dataset.mmUnifiedMaterialIndex='1';root.dataset.mmUnifiedMaterialTotal=String(result.total);
    host.querySelectorAll('[data-mm-index-grade]').forEach(button=>button.addEventListener('click',()=>{query.value=button.dataset.mmIndexGrade||'';query.dispatchEvent(new Event('input',{bubbles:true}));query.focus();}));
  }
  allQuery.addEventListener('input',()=>render(true).catch(err=>console.warn('[MouldMaster unified material index]',err)));type.addEventListener('change',()=>render(true).catch(err=>console.warn('[MouldMaster unified material index]',err)));previous.addEventListener('click',()=>{page=Math.max(1,page-1);render().catch(err=>console.warn('[MouldMaster unified material index]',err))});next.addEventListener('click',()=>{page+=1;render().catch(err=>console.warn('[MouldMaster unified material index]',err))});
  render(true).catch(err=>console.warn('[MouldMaster unified material index]',err));
}
function makeButton(label,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.dataset.mmMaterialPage=action;return b}
function replaceControl(root,selector){const old=root.querySelector(selector);if(!old)return null;const next=old.cloneNode(true);old.replaceWith(next);return next}
async function enhance(){
  const registry=window.MM_MATERIAL_REGISTRY,index=window.MM_MATERIAL_SEARCH;if(!registry?.installPanel||!index?.searchPage)return false;
  await registry.installPanel();const root=document.getElementById('mmExactMaterialCatalog');if(!root||root.dataset.mmIndexedPagination==='1')return !!root;
  root.dataset.mmIndexedPagination='1';
  const query=replaceControl(root,'[data-mm-exact-query]'),manufacturer=replaceControl(root,'[data-mm-exact-manufacturer]'),host=root.querySelector('[data-mm-exact-results]');if(!query||!manufacturer||!host)return false;
  installAllIndex(root,index,query);
  const status=document.createElement('p');status.className='mm-exact-boundary';status.dataset.mmMaterialPageStatus='';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const pager=document.createElement('div');pager.className='mm-exact-actions';pager.dataset.mmMaterialPager='';const previous=makeButton('Previous','previous'),next=makeButton('Next','next');pager.append(previous,next);host.insertAdjacentElement('afterend',status);status.insertAdjacentElement('afterend',pager);
  let page=1,seq=0;
  async function render(reset=false){if(reset)page=1;const mine=++seq;const started=performance.now();const result=await index.searchPage(query.value||'',{manufacturerId:manufacturer.value||null,page,pageSize:PAGE_SIZE});if(mine!==seq)return;page=result.page;host.innerHTML=result.items.length?result.items.map(renderGrade).join(''):'<div class="mm-exact-empty">No published exact commercial grades match this filter. The family-level Academy material reference remains available above; it must not be treated as an exact-grade datasheet.</div>';host.querySelectorAll('[data-mm-exact-case]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await registry.startMouldMasterCase(b.dataset.mmExactCase)}catch(err){console.error('[MouldMaster materials]',err);b.disabled=false}}));previous.disabled=!result.hasPrevious;next.disabled=!result.hasNext;pager.hidden=result.pageCount<=1;status.textContent=`${result.total} matching exact grades · page ${result.page} of ${result.pageCount} · indexed in ${Math.max(0,Math.round(performance.now()-started))} ms`;root.dataset.mmMaterialSearchMode='indexed';root.dataset.mmMaterialPage=String(result.page);root.dataset.mmMaterialTotal=String(result.total)}
  query.addEventListener('input',()=>render(true).catch(err=>console.warn('[MouldMaster materials index]',err)));manufacturer.addEventListener('change',()=>render(true).catch(err=>console.warn('[MouldMaster materials index]',err)));previous.addEventListener('click',()=>{page=Math.max(1,page-1);render().catch(err=>console.warn('[MouldMaster materials index]',err))});next.addEventListener('click',()=>{page+=1;render().catch(err=>console.warn('[MouldMaster materials index]',err))});
  await render(true);return true;
}
function install(){enhance().catch(err=>console.warn('[MouldMaster materials index]',err))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_APP_SHELL?.events?.onRender?.('materials',install);window.MM_APP_SHELL?.events?.onViewChange?.(view=>{if(view==='materials')install()});
window.MM_MATERIAL_SEARCH_PAGINATION=Object.freeze({version:VERSION,enhance,pageSize:PAGE_SIZE,allPageSize:ALL_PAGE_SIZE});
})();
