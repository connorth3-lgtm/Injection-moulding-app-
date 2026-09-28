/* MouldMaster exact-grade material registry — 2026.09.03 */
(function(){
'use strict';
if(window.MM_MATERIAL_REGISTRY)return;
const VERSION='2026.09.29.2';
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
function observationsMatching(g,kind,pattern){
  const rows=kind==='processing'?(g?.processing||[]):(g?.properties||[]);
  return rows.filter(row=>pattern.test(clean(kind==='processing'?row?.parameter:row?.property)));
}
function compactObservation(row,kind){
  return {label:clean(kind==='processing'?row?.parameter:row?.property),value:kind==='processing'?processValue(row):valueText(row),condition:kind==='processing'?clean(row?.condition)||'Supplier guidance; verify current exact-grade source and site conditions.':propertyCondition(row),sourceId:clean(row?.sourceId),comparisonReady:row?.comparisonReady===true,direction:clean(row?.direction),testMethod:clean(row?.testMethod)};
}
function decisionSnapshot(g){
  return {
    id:g.id,name:displayName(g),family:clean(g?.polymer?.family)||'Not stated',morphology:clean(g?.polymer?.morphology)||'Not stated',
    drying:observationsMatching(g,'processing',/(dry|moisture)/i).map(x=>compactObservation(x,'processing')),
    shrinkage:observationsMatching(g,'properties',/shrink/i).map(x=>compactObservation(x,'property')),
    flow:observationsMatching(g,'properties',/(melt.?flow|mfr|mfi|mvr)/i).map(x=>compactObservation(x,'property')),
    thermal:observationsMatching(g,'processing',/(melt|barrel|mould|mold).?temperature/i).map(x=>compactObservation(x,'processing')),
    sourceCount:(g?.sources||[]).length
  };
}
function matchedComparisonRows(a,b){
  const rows=[];
  for(const oa of a?.properties||[]){
    if(oa?.comparisonReady!==true)continue;
    const sig=comparableSignature(oa);
    for(const ob of b?.properties||[]){
      if(ob?.comparisonReady!==true||comparableSignature(ob)!==sig)continue;
      rows.push({property:clean(oa.property),condition:propertyCondition(oa),a:valueText(oa),b:valueText(ob)});
    }
  }
  return rows;
}
async function decisionComparison(materialGradeIds){
  const ids=[...(materialGradeIds||[])].filter(Boolean).slice(0,2);
  const grades=[];
  for(const id of ids){const g=await get(id);if(g)grades.push(g)}
  if(grades.length!==2)return {ready:false,grades:grades.map(decisionSnapshot),matched:[],boundary:'Select two published exact grades.'};
  return {ready:true,grades:grades.map(decisionSnapshot),matched:matchedComparisonRows(grades[0],grades[1]),boundary:'Side-by-side evidence is not a material ranking or production recipe. Numeric values are directly comparable only when their governed test conditions match exactly; supplier processing guidance remains grade-specific and must be verified against current supplier, machine, mould, product and site requirements.'};
}
function compositionSummary(g){
  const c=g?.composition||{};
  const parts=[];
  if(Number.isFinite(c.glassFibrePct))parts.push(`Glass fibre ${c.glassFibrePct}%`);
  if(Number.isFinite(c.mineralPct))parts.push(`Mineral ${c.mineralPct}%`);
  if(c.flameRetardant===true)parts.push('Flame retardant');
  if(clean(c.notes))parts.push(clean(c.notes));
  return parts.join(' · ')||'No additional published composition detail';
}
function normalizedEvidenceMap(g,kind){
  const rows=kind==='property'?(g?.properties||[]):(g?.processing||[]);
  const map=new Map();
  for(const row of rows){
    const key=norm(kind==='property'?row?.property:row?.parameter);
    if(!key)continue;
    const entry={label:clean(kind==='property'?row?.property:row?.parameter),value:kind==='property'?valueText(row):processValue(row),condition:kind==='property'?propertyCondition(row):clean(row?.condition)||'Supplier guidance; verify current exact-grade source and site conditions.',signature:kind==='property'?comparableSignature(row):JSON.stringify({parameter:key,unit:clean(row?.unit)}),sourceId:clean(row?.sourceId),comparisonReady:row?.comparisonReady===true};
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(entry);
  }
  return map;
}
function evidenceDelta(before,after,kind,pattern){
  const left=normalizedEvidenceMap(before,kind),right=normalizedEvidenceMap(after,kind),keys=[...new Set([...left.keys(),...right.keys()])].filter(k=>pattern.test(k)).sort();
  const rows=[];
  for(const key of keys){
    const a=left.get(key)||[],b=right.get(key)||[];
    if(!a.length||!b.length){
      rows.push({key,label:(a[0]||b[0])?.label||key,status:'missing-one-side',before:a.map(x=>x.value).join(' / ')||'Not published',after:b.map(x=>x.value).join(' / ')||'Not published',condition:'Evidence gap: one exact-grade record does not publish this observation.'});
      continue;
    }
    let matched=null;
    for(const x of a)for(const y of b)if(x.signature===y.signature){matched={x,y};break}
    if(kind==='property'&&!matched){
      rows.push({key,label:a[0].label,status:'not-directly-comparable',before:a.map(x=>x.value).join(' / '),after:b.map(x=>x.value).join(' / '),condition:'Published values exist on both grades, but governed test conditions differ.'});
      continue;
    }
    const x=matched?.x||a[0],y=matched?.y||b[0],same=x.value===y.value;
    rows.push({key,label:x.label||y.label,status:same?'unchanged':'changed',before:x.value,after:y.value,condition:kind==='property'?x.condition:[x.condition,y.condition].filter(Boolean).join(' | ')});
  }
  return rows;
}
function identityDelta(before,after){
  const rows=[
    ['Manufacturer',clean(before?.manufacturer?.name)||'Not stated',clean(after?.manufacturer?.name)||'Not stated'],
    ['Commercial grade',clean(before?.grade)||'Not stated',clean(after?.grade)||'Not stated'],
    ['Polymer family',clean(before?.polymer?.family)||'Not stated',clean(after?.polymer?.family)||'Not stated'],
    ['Morphology',clean(before?.polymer?.morphology)||'Not stated',clean(after?.polymer?.morphology)||'Not stated'],
    ['Composition',compositionSummary(before),compositionSummary(after)]
  ];
  return rows.map(([label,a,b])=>({label,before:a,after:b,status:a===b?'unchanged':'changed'}));
}
function missingEvidence(snapshot){
  const missing=[];
  if(!snapshot.drying.length)missing.push('drying / moisture');
  if(!snapshot.shrinkage.length)missing.push('shrinkage');
  if(!snapshot.flow.length)missing.push('melt-flow / rheology proxy');
  if(!snapshot.thermal.length)missing.push('thermal processing guidance');
  return missing;
}
function verificationActions(report){
  const actions=[
    'Confirm the exact new commercial grade, supplier document revision/region, lot identity and approved site material specification before changing the process.',
    'Preserve the previous validated baseline and record the material change as a controlled change with traceable before/after evidence.'
  ];
  const changed=rows=>rows.some(r=>r.status==='changed'||r.status==='not-directly-comparable'||r.status==='missing-one-side');
  if(changed(report.drying))actions.push('Re-verify material handling, drying/moisture evidence and post-dryer exposure using the current exact-grade supplier and site requirements; do not copy the old grade recipe.');
  if(changed(report.flow))actions.push('Verify the new grade’s actual filling/pressure response in the mould. Melt-flow data can support the investigation but does not reproduce the mould’s full rheology.');
  if(changed(report.shrinkage)||report.identity.some(r=>r.label==='Morphology'&&r.status==='changed')||report.identity.some(r=>r.label==='Composition'&&r.status==='changed'))actions.push('Re-check dimensional risk with actual part geometry, orientation/reinforcement, packing, mould-temperature balance, cooling, conditioning and measurement timing; coupon shrinkage alone is not a warpage prediction.');
  if(changed(report.thermal))actions.push('Confirm the machine, hot-runner and mould can operate inside the new grade’s current supplier/site thermal boundaries before controlled trials; do not infer setpoints from this report.');
  if(report.missingBefore.length||report.missingAfter.length)actions.push('Close important evidence gaps with current primary supplier documentation or controlled local measurements before treating missing fields as equivalent.');
  actions.push('Run a controlled verification within approved safety and process limits, recording process actuals, cavity/part identity, mass/dimensions, defects and acceptance results before updating an approved process.');
  return actions;
}
async function materialChangeReport(beforeId,afterId){
  const before=await get(beforeId),after=await get(afterId);
  if(!before||!after||before.id===after.id)return {ready:false,boundary:'Choose two different published exact grades.'};
  const beforeSnapshot=decisionSnapshot(before),afterSnapshot=decisionSnapshot(after);
  const report={
    ready:true,before:beforeSnapshot,after:afterSnapshot,
    identity:identityDelta(before,after),
    drying:evidenceDelta(before,after,'processing',/(dry|moisture)/i),
    flow:evidenceDelta(before,after,'property',/(melt.?flow|mfr|mfi|mvr)/i),
    shrinkage:evidenceDelta(before,after,'property',/shrink/i),
    thermal:evidenceDelta(before,after,'processing',/(melt|barrel|mould|mold).?temperature/i),
    missingBefore:missingEvidence(beforeSnapshot),missingAfter:missingEvidence(afterSnapshot),
    sources:{before:(before.sources||[]).map(s=>({id:s.id,title:clean(s.title),publisher:clean(s.publisher),documentDate:clean(s.documentDate),retrievedAt:clean(s.retrievedAt),url:safeUrl(s.url)})),after:(after.sources||[]).map(s=>({id:s.id,title:clean(s.title),publisher:clean(s.publisher),documentDate:clean(s.documentDate),retrievedAt:clean(s.retrievedAt),url:safeUrl(s.url)}))},
    boundary:'This report identifies governed evidence differences and verification needs. It does not rank materials and does not prescribe purge/changeover settings, authorize production changes, or prove that a changed value will cause a specific part response.'
  };
  report.actions=verificationActions(report);
  return report;
}
function statusText(status){return ({changed:'Changed',unchanged:'No published change', 'missing-one-side':'Evidence gap','not-directly-comparable':'Not directly comparable'})[status]||humanKind(status)}
function renderDeltaRows(rows){
  if(!rows.length)return '<p class="mm-material-evidence-missing">Neither exact-grade record publishes a governed observation in this category.</p>';
  return `<div class="mm-exact-table-wrap"><table class="mm-exact-table mm-material-delta-table"><thead><tr><th>Evidence</th><th>Old grade</th><th>New grade</th><th>Status / condition</th></tr></thead><tbody>${rows.map(row=>`<tr data-mm-delta-status="${esc(row.status)}"><th scope="row">${esc(row.label)}</th><td>${esc(row.before)}</td><td>${esc(row.after)}</td><td><b>${esc(statusText(row.status))}</b>${row.condition?`<small>${esc(row.condition)}</small>`:''}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderSourceColumn(title,grade,sources){
  return `<div class="mm-material-change-sources"><h4>${esc(title)} · ${esc(grade.name)}</h4>${sources.length?`<ul>${sources.map(s=>`<li><b>${esc(s.title||s.id)}</b><span>${esc([s.publisher,s.documentDate?`document ${s.documentDate}`:'',s.retrievedAt?`retrieved ${s.retrievedAt}`:''].filter(Boolean).join(' · '))}</span>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open primary source</a>`:''}</li>`).join('')}</ul>`:'<p>No primary source metadata is published in this exact-grade record.</p>'}</div>`;
}
function renderMaterialChangeReport(report){
  if(!report.ready)return `<p class="mm-exact-empty">${esc(report.boundary)}</p>`;
  const gaps=(label,items)=>items.length?`<li><b>${esc(label)}:</b> ${esc(items.join(', '))}</li>`:`<li><b>${esc(label)}:</b> no missing core evidence categories detected.</li>`;
  return `<div class="mm-material-change-report"><div class="mm-material-change-hero"><span class="eyebrow">Material change delta</span><h3>${esc(report.before.name)} → ${esc(report.after.name)}</h3><p>Review what the published evidence says changed, what stayed the same, what cannot be compared directly, and what is missing.</p></div><section><h4>Identity and composition</h4>${renderDeltaRows(report.identity)}</section><section><h4>Drying / moisture</h4>${renderDeltaRows(report.drying)}</section><section><h4>Rheology / melt-flow evidence</h4>${renderDeltaRows(report.flow)}</section><section><h4>Shrinkage evidence</h4>${renderDeltaRows(report.shrinkage)}</section><section><h4>Thermal guidance</h4>${renderDeltaRows(report.thermal)}</section><section class="mm-material-change-gaps"><h4>Published evidence gaps</h4><ul>${gaps('Old grade',report.missingBefore)}${gaps('New grade',report.missingAfter)}</ul></section><section><h4>Verification actions before an approved process change</h4><ol class="mm-material-change-actions">${report.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section><section><h4>Primary-source trail</h4><div class="mm-material-change-source-grid">${renderSourceColumn('Old grade',report.before,report.sources.before)}${renderSourceColumn('New grade',report.after,report.sources.after)}</div></section><p class="mm-exact-boundary">${esc(report.boundary)}</p></div>`;
}

function evidenceList(title,rows,empty){
  return `<div class="mm-material-evidence-group"><h4>${esc(title)}</h4>${rows.length?`<ul>${rows.map(row=>`<li><b>${esc(row.label)}</b><span>${esc(row.value)}</span><small>${esc(row.condition)}</small></li>`).join('')}</ul>`:`<p class="mm-material-evidence-missing">${esc(empty)}</p>`}</div>`;
}
function renderDecisionGrade(snapshot){
  return `<article class="mm-material-compare-card"><span class="eyebrow">Exact-grade evidence</span><h3>${esc(snapshot.name)}</h3><p><b>Family:</b> ${esc(snapshot.family)} · <b>Morphology:</b> ${esc(snapshot.morphology)}</p>${evidenceList('Drying / moisture evidence',snapshot.drying,'No published drying or moisture observation in this exact-grade record.')}${evidenceList('Shrinkage evidence',snapshot.shrinkage,'No published shrinkage observation in this exact-grade record.')}${evidenceList('Flow evidence',snapshot.flow,'No published melt-flow observation in this exact-grade record.')}${evidenceList('Thermal guidance',snapshot.thermal,'No published melt/barrel/mould-temperature observation in this exact-grade record.')}<p class="mm-material-source-count">${snapshot.sourceCount} primary source${snapshot.sourceCount===1?'':'s'} attached to this record.</p></article>`;
}
function renderDecisionResult(result){
  if(!result.ready)return `<p class="mm-exact-empty">${esc(result.boundary)}</p>`;
  const [a,b]=result.grades;
  const matched=result.matched.length?`<div class="mm-material-matched"><h4>Condition-matched numeric observations</h4><div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Property</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th>Matched condition</th></tr></thead><tbody>${result.matched.map(row=>`<tr><th scope="row">${esc(row.property)}</th><td>${esc(row.a)}</td><td>${esc(row.b)}</td><td>${esc(row.condition)}</td></tr>`).join('')}</tbody></table></div></div>`:'<p class="mm-material-no-match"><b>No directly comparable numeric observations.</b> The records can still be reviewed side by side, but their test conditions do not form an exact match.</p>';
  return `<div class="mm-material-compare-grid">${renderDecisionGrade(a)}${renderDecisionGrade(b)}</div>${matched}<div class="mm-material-reasoning"><h4>Shrinkage / warpage reasoning</h4><p>Use coupon shrinkage and morphology as evidence inputs, not a part-warpage prediction. Check flow versus transverse evidence where available, then add actual part geometry, gate/fibre orientation, packing history, mould-temperature balance, cooling, ejection and conditioning before drawing a cause conclusion.</p></div><p class="mm-exact-boundary">${esc(result.boundary)}</p>`;
}
function renderMaterialChangeChecklist(){
  return `<div class="mm-material-change-checklist"><h3>Material-change evidence checklist</h3><ol><li><b>Confirm identity.</b> Record the exact commercial grade, supplier, revision/region and lot identity. Do not substitute a family label for the grade.</li><li><b>Verify material condition.</b> Check the current exact-grade drying/moisture requirement and the site's approved handling evidence. Do not copy a drying recipe from another grade.</li><li><b>Control the changeover.</b> Verify compatibility and use supplier, machine and site-approved purge/changeover procedures; this tool does not prescribe purge temperatures, quantities or machine actions.</li><li><b>Review thermal and rheology evidence.</b> Compare sourced guidance and test conditions, then verify the actual machine/tool capability and measured process response.</li><li><b>Anticipate dimensional risk.</b> Review shrinkage, morphology, reinforcement/orientation, conditioning and cooling balance; coupon values do not predict final-part warpage by themselves.</li><li><b>Run a controlled verification.</b> Preserve the previous baseline, change one governed factor at a time where practical, and record actuals, part mass/dimensions, cavity identity, defects and acceptance evidence before updating an approved process.</li></ol></div>`;
}

function renderGrade(g){
  const key=preferredProperty(g),properties=g.properties||[],processing=g.processing||[],variant=[g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].map(clean).filter(Boolean).join(' · ');
  return `<article class="mm-exact-grade" data-mm-material-grade="${esc(g.id)}"><span class="eyebrow">Exact commercial grade</span><h3>${esc(displayName(g))}</h3><p>${esc(g.polymer?.family||'Unknown polymer family')}${g.polymer?.blend&&g.polymer.blend!==g.polymer.family?` · ${esc(g.polymer.blend)}`:''}${variant?` · ${esc(variant)}`:''}</p>${key?`<div class="mm-exact-key"><span>Key sourced property</span><strong>${esc(key.property)} · ${esc(valueText(key))}</strong><small>${esc(propertyCondition(key))}</small></div>`:''}<p>${properties.length} sourced properties · ${processing.length} processing observations</p><details class="mm-exact-detail"><summary>View sourced grade details</summary><div class="mm-exact-detail-body">${properties.length?`<h4>Properties</h4>${renderPropertyLimitations(g)}<div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Property</th><th>Value</th><th>Test / condition</th><th>Evidence use</th></tr></thead><tbody>${renderPropertyRows(g)}</tbody></table></div>`:'<p class="mm-exact-empty">No property observations have been published for this exact grade yet.</p>'}${processing.length?`<h4>Supplier processing guidance</h4><p class="mm-exact-caution"><b>Starting evidence, not a production recipe.</b> Confirm the current supplier document, machine/tool constraints and site validation before making production changes.</p><div class="mm-exact-table-wrap"><table class="mm-exact-table"><thead><tr><th>Parameter</th><th>Guidance</th><th>Boundary / condition</th><th>Source</th></tr></thead><tbody>${renderProcessingRows(g)}</tbody></table></div>`:''}<h4>Primary sources</h4><ul class="mm-exact-sources">${renderSources(g)}</ul><p class="mm-exact-provenance">Lifecycle status: ${esc(g.lifecycle?.status||'unknown')} · checked ${esc(g.lifecycle?.checkedAt||'not recorded')} · provenance ${esc(g.provenance?.stage||'unknown')}.</p></div></details><div class="mm-exact-actions"><button type="button" class="secondary" data-mm-exact-case="${esc(g.id)}">Start Mould Master case</button></div></article>`;
}

function style(){if(document.getElementById('mm-exact-material-style'))return;const s=document.createElement('style');s.id='mm-exact-material-style';s.textContent=`
.mm-exact-materials{margin-top:16px;padding:18px}.mm-exact-head{display:flex;justify-content:space-between;gap:12px;align-items:end}.mm-exact-head h2{margin:4px 0}.mm-exact-head p{margin:4px 0 0;color:var(--muted);line-height:1.5}.mm-exact-search{display:grid;grid-template-columns:1fr minmax(190px,.35fr);gap:9px;margin-top:13px}.mm-exact-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px;align-items:start}.mm-exact-grade{min-width:0;padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mm-exact-grade h3{margin:4px 0 7px}.mm-exact-grade p{margin:4px 0;color:#b8c9dc;font-size:12px;line-height:1.45}.mm-exact-key{margin:10px 0;padding:9px 10px;border:1px solid #294966;border-radius:9px;background:#0a1728}.mm-exact-key span,.mm-exact-key small{display:block;color:#9fb3c9;font-size:11px;line-height:1.4}.mm-exact-key strong{display:block;margin:3px 0;font-size:13px}.mm-exact-detail{margin-top:10px;border-top:1px solid #29415c;padding-top:9px}.mm-exact-detail>summary{cursor:pointer;font-weight:700;color:#dcecff;padding:4px 0}.mm-exact-detail>summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.mm-exact-detail-body{padding-top:9px}.mm-exact-detail-body h4{margin:13px 0 7px;font-size:13px}.mm-exact-limitations{margin:7px 0 9px;padding:9px 10px;border:1px solid #4a425c;border-radius:8px;background:#19192a;color:#cbd4e1;font-size:10px;line-height:1.45}.mm-exact-limitations b{display:block;color:#e4eaff;margin-bottom:2px}.mm-exact-limitations p{margin:2px 0!important;color:#cbd4e1!important;font-size:10px!important}.mm-exact-table-wrap{max-width:100%;overflow:auto;border:1px solid #29415c;border-radius:9px}.mm-exact-table{width:100%;min-width:660px;border-collapse:collapse;font-size:11px}.mm-exact-table th,.mm-exact-table td{padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #233a53;line-height:1.45}.mm-exact-table thead th{background:#13253b;color:#cfe3f7}.mm-exact-table tbody th{color:#d8e8f7;min-width:140px}.mm-exact-table tr:last-child th,.mm-exact-table tr:last-child td{border-bottom:0}.mm-exact-status{display:inline-block;padding:3px 6px;border-radius:999px;font-size:10px;font-weight:700}.mm-exact-status.ready{background:#153729;color:#bfead2}.mm-exact-status.context{background:#342d1b;color:#f0dfa7}.mm-exact-source-link{display:block;margin-top:5px;font-size:10px;color:#a9d3ff}.mm-exact-caution{padding:9px 10px;border-left:3px solid #b18a36;background:#211f19;color:#e9dfc6!important}.mm-exact-sources{list-style:none;padding:0;margin:7px 0;display:grid;gap:7px}.mm-exact-sources li{padding:8px 9px;border:1px solid #29415c;border-radius:8px}.mm-exact-sources b,.mm-exact-sources span,.mm-exact-sources a{display:block}.mm-exact-sources span{font-size:10px;color:#9fb3c9;margin:2px 0 4px}.mm-exact-sources a{font-size:11px}.mm-exact-provenance{font-size:10px!important}.mm-exact-actions{margin-top:10px}.mm-exact-actions button{margin-top:0}.mm-material-all-index{margin:14px 0;padding:14px;border:1px solid #304b69;border-radius:11px;background:#0a1728}.mm-material-all-index-head h3{margin:4px 0}.mm-material-all-index-head p{margin:4px 0;color:#b8c9dc;font-size:12px;line-height:1.5}.mm-material-all-index-controls{display:grid;grid-template-columns:1fr minmax(190px,.35fr);gap:9px;margin-top:11px}.mm-material-all-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mm-material-index-card{padding:11px;border:1px solid #29415c;border-radius:9px;background:#101c2e;min-width:0}.mm-material-index-card h4{margin:6px 0}.mm-material-index-card p{margin:4px 0;color:#c7d5e5;font-size:11px;line-height:1.45}.mm-material-index-subtitle{color:#9fb3c9!important}.mm-material-index-meta{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.mm-material-index-meta>span:not(.pill){font-size:10px;color:#9fb3c9}.mm-material-index-card button{margin-top:8px}.mm-material-decision{margin-top:16px;padding-top:16px;border-top:1px solid #304b69}.mm-material-decision-head h3{margin:4px 0}.mm-material-decision-head p{margin:4px 0;color:var(--muted);font-size:12px;line-height:1.5}.mm-material-compare-controls{display:grid;grid-template-columns:1fr 1fr auto;gap:9px;align-items:end;margin:12px 0}.mm-material-compare-controls button{min-height:42px}.mm-material-compare-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mm-material-compare-card{border:1px solid #304b69;border-radius:11px;background:#0a1728;padding:12px;min-width:0}.mm-material-compare-card h3{margin:4px 0 8px}.mm-material-compare-card>p{font-size:11px;color:#b8c9dc;line-height:1.45}.mm-material-evidence-group{margin-top:11px}.mm-material-evidence-group h4{margin:0 0 5px;font-size:12px}.mm-material-evidence-group ul{list-style:none;padding:0;margin:0;display:grid;gap:5px}.mm-material-evidence-group li{padding:7px 8px;border:1px solid #29415c;border-radius:8px}.mm-material-evidence-group b,.mm-material-evidence-group span,.mm-material-evidence-group small{display:block}.mm-material-evidence-group span{font-size:12px;margin:2px 0}.mm-material-evidence-group small,.mm-material-evidence-missing,.mm-material-source-count{font-size:10px;color:#9fb3c9;line-height:1.4}.mm-material-matched,.mm-material-reasoning,.mm-material-change-checklist,.mm-material-change-assistant{margin-top:11px;padding:11px;border:1px solid #304b69;border-radius:10px;background:#101c2e}.mm-material-change-assistant>h3{margin:4px 0}.mm-material-change-assistant>p{font-size:11px;line-height:1.5;color:#c7d5e5}.mm-material-change-report{display:grid;gap:12px;margin-top:11px}.mm-material-change-report section{padding:10px;border:1px solid #29415c;border-radius:9px;background:#0a1728}.mm-material-change-report section>h4{margin:0 0 7px}.mm-material-change-hero h3{margin:4px 0}.mm-material-change-hero p{margin:4px 0;color:#b8c9dc;font-size:11px;line-height:1.5}.mm-material-delta-table small{display:block;margin-top:4px;color:#9fb3c9;line-height:1.4}.mm-material-delta-table [data-mm-delta-status="changed"] td:last-child b,.mm-material-delta-table [data-mm-delta-status="missing-one-side"] td:last-child b,.mm-material-delta-table [data-mm-delta-status="not-directly-comparable"] td:last-child b{color:#f0dfa7}.mm-material-change-gaps ul,.mm-material-change-actions{margin:0;padding-left:20px;display:grid;gap:6px}.mm-material-change-gaps li,.mm-material-change-actions li{font-size:11px;line-height:1.5;color:#c7d5e5}.mm-material-change-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mm-material-change-sources{padding:9px;border:1px solid #29415c;border-radius:8px}.mm-material-change-sources h4{margin:0 0 6px}.mm-material-change-sources ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}.mm-material-change-sources li{padding:7px;border:1px solid #233a53;border-radius:7px}.mm-material-change-sources b,.mm-material-change-sources span,.mm-material-change-sources a{display:block}.mm-material-change-sources span{font-size:10px;color:#9fb3c9;margin:2px 0}.mm-material-change-sources a{font-size:10px}.mm-material-matched h4,.mm-material-reasoning h4,.mm-material-change-checklist h3{margin:0 0 7px}.mm-material-no-match{margin:11px 0;padding:10px;border-left:3px solid #b18a36;background:#211f19;color:#e9dfc6;font-size:11px;line-height:1.45}.mm-material-reasoning p,.mm-material-change-checklist li{font-size:11px;line-height:1.5;color:#c7d5e5}.mm-material-change-checklist ol{margin:0;padding-left:20px;display:grid;gap:7px}.mm-exact-empty{margin-top:12px;padding:13px;border:1px dashed #405b78;border-radius:10px;color:var(--muted);line-height:1.5}.mm-exact-boundary{font-size:11px;color:var(--muted);line-height:1.45;margin-top:11px}@media(max-width:700px){.mm-exact-search,.mm-exact-results,.mm-material-compare-controls,.mm-material-compare-grid,.mm-material-all-index-controls,.mm-material-all-results,.mm-material-change-source-grid{grid-template-columns:1fr}.mm-exact-materials{padding:14px}.mm-exact-table{min-width:620px}}
`;document.head.appendChild(s)}
async function renderResults(root){
  const input=root.querySelector('[data-mm-exact-query]'),select=root.querySelector('[data-mm-exact-manufacturer]'),host=root.querySelector('[data-mm-exact-results]');if(!host)return;
  const rows=await search(input?.value||'',{manufacturerId:select?.value||null,limit:40});
  if(!rows.length){host.innerHTML='<div class="mm-exact-empty">No published exact commercial grades match this filter. The family-level Academy material reference remains available above; it must not be treated as an exact-grade datasheet.</div>';return}
  host.innerHTML=rows.map(renderGrade).join('');
  host.querySelectorAll('[data-mm-exact-case]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await startMouldMasterCase(b.dataset.mmExactCase)}catch(err){console.error('[MouldMaster materials]',err);b.disabled=false}}));
}
async function installPanel(){
  let host=document.getElementById('materials');if(!host||host.querySelector('#mmExactMaterialCatalog'))return false;
  style();const c=await load();
  host=document.getElementById('materials');if(!host||host.querySelector('#mmExactMaterialCatalog'))return false;
  const section=document.createElement('section');section.id='mmExactMaterialCatalog';section.className='card mm-exact-materials';
  const gradeOptions=(c.grades||[]).map(g=>`<option value="${esc(g.id)}">${esc(displayName(g))}</option>`).join('');
  section.innerHTML=`<div class="mm-exact-head"><div><span class="eyebrow">Canonical material domain</span><h2>Exact commercial grades</h2><p>Search source-backed exact grades separately from generic resin-family learning.</p></div><span class="pill">${(c.grades||[]).length} published</span></div><div class="mm-exact-search"><label>Search manufacturer, brand or grade<input data-mm-exact-query placeholder="e.g. manufacturer, PC/ABS, grade"></label><label>Manufacturer<select data-mm-exact-manufacturer><option value="">All manufacturers</option>${(c.manufacturers||[]).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></label></div><div class="mm-exact-results" data-mm-exact-results></div><div class="mm-material-decision" data-mm-material-decision><div class="mm-material-decision-head"><span class="eyebrow">Decision support</span><h3>Compare exact-grade evidence</h3><p>Compare what the governed records actually say about drying, moisture, shrinkage, flow and thermal guidance. This does not rank materials or generate production settings.</p></div><div class="mm-material-compare-controls"><label>Grade A<select data-mm-compare-a><option value="">Select exact grade</option>${gradeOptions}</select></label><label>Grade B<select data-mm-compare-b><option value="">Select exact grade</option>${gradeOptions}</select></label><button type="button" class="secondary" data-mm-run-material-compare>Compare evidence</button></div><div data-mm-material-compare-result aria-live="polite"><p class="mm-exact-empty">Select two exact grades to review their evidence side by side.</p></div><div class="mm-material-change-assistant" data-mm-material-change-assistant><span class="eyebrow">Material Change Assistant</span><h3>Plan an evidence-led grade change</h3><p>Choose the current and proposed exact grades. The report highlights governed differences, evidence gaps and verification actions without generating production settings.</p><div class="mm-material-compare-controls"><label>Current grade<select data-mm-change-before><option value="">Select current exact grade</option>${gradeOptions}</select></label><label>Proposed grade<select data-mm-change-after><option value="">Select proposed exact grade</option>${gradeOptions}</select></label><button type="button" class="secondary" data-mm-run-material-change>Build delta report</button></div><div data-mm-material-change-result aria-live="polite"><p class="mm-exact-empty">Select two exact grades to build a sourced change report.</p></div></div>${renderMaterialChangeChecklist()}</div><div class="mm-exact-boundary">Only validated exact-grade records are shown here. Property values retain their test context; processing observations retain their primary source and are not universal production recipes.</div>`;
  host.appendChild(section);
  const rerender=()=>renderResults(section).catch(err=>console.warn('[MouldMaster materials]',err));
  section.querySelector('[data-mm-exact-query]')?.addEventListener('input',rerender);
  section.querySelector('[data-mm-exact-manufacturer]')?.addEventListener('change',rerender);
  section.querySelector('[data-mm-run-material-compare]')?.addEventListener('click',async()=>{
    const resultHost=section.querySelector('[data-mm-material-compare-result]');
    const a=section.querySelector('[data-mm-compare-a]')?.value||'',b=section.querySelector('[data-mm-compare-b]')?.value||'';
    if(a&&a===b){resultHost.innerHTML='<p class="mm-exact-empty">Choose two different exact grades.</p>';return}
    const result=await decisionComparison([a,b]);resultHost.innerHTML=renderDecisionResult(result);
  });
  section.querySelector('[data-mm-run-material-change]')?.addEventListener('click',async()=>{
    const resultHost=section.querySelector('[data-mm-material-change-result]');
    const before=section.querySelector('[data-mm-change-before]')?.value||'',after=section.querySelector('[data-mm-change-after]')?.value||'';
    const report=await materialChangeReport(before,after);resultHost.innerHTML=renderMaterialChangeReport(report);
  });
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

window.MM_MATERIAL_REGISTRY=Object.freeze({version:VERSION,catalogUrl:CATALOG_URL,load,all,get,search,displayName,manufacturers,propertyObservations,compareProperty,decisionComparison,materialChangeReport,stats,startMouldMasterCase,installPanel});
load().then(bindMaterialsLifecycle).catch(err=>console.warn('[MouldMaster materials] exact-grade catalog unavailable',err));
})();