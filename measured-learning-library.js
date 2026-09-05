/* MouldMaster Measured Learning Library — governed learner runtime */
(function(){
'use strict';
if(window.MM_MEASURED_LEARNING_LIBRARY)return;
const MANIFEST='./data/measured-learning/manifest-v1.json';
const PROMOTED='./data/measured-learning/promoted-v1.json';
let root=null,state={manifest:null,promoted:null,cases:new Map(),loaded:false};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function list(items){return `<ul class="mm-measured-list">${(items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function ensureRoot(){
  if(root)return root;
  root=document.createElement('section');root.id='mmMeasuredLearningLibrary';root.className='mm-measured-library';root.hidden=true;root.setAttribute('aria-label','Measured Learning Library');
  root.innerHTML='<div class="mm-measured-shell"><div class="mm-measured-head"><div><span class="mm-measured-eyebrow">Real measurement learning</span><h2>Measured Learning Library</h2><p class="mm-measured-muted">Real measured behaviour, governed provenance and explicit evidence limits.</p></div><button class="mm-measured-close" type="button" data-mm-measured-close>Close</button></div><div data-mm-measured-body></div></div>';
  document.body.appendChild(root);root.querySelector('[data-mm-measured-close]').addEventListener('click',close);return root
}
function decodeCatalogue(){const m=state.manifest,fields=m?.fields||[];return (m?.cases||[]).map(row=>Object.fromEntries(fields.map((f,i)=>[f,row[i]])))}
async function load(){
  if(state.loaded)return state;
  const [manifest,promoted]=await Promise.all([fetch(MANIFEST,{cache:'no-store'}),fetch(PROMOTED,{cache:'no-store'})]);
  if(!manifest.ok||!promoted.ok)throw new Error('Measured Learning Library governance assets are unavailable.');
  state.manifest=await manifest.json();state.promoted=await promoted.json();
  const ids=new Set(state.promoted.caseIds||[]);
  for(const id of ids){const r=await fetch(`./data/measured-learning/cases/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!r.ok)throw new Error(`Promoted measured case ${id} is missing.`);const c=await r.json();if(c.id!==id||c.promotionState!=='promoted')throw new Error(`Promoted measured case ${id} failed runtime identity checks.`);state.cases.set(id,c)}
  state.loaded=true;return state
}
function statusHtml(){
  const catalogue=decodeCatalogue(),promoted=state.promoted?.caseIds||[],sources=new Set(catalogue.map(c=>c.sourceFamily));
  return `<div class="mm-measured-status"><div class="mm-measured-stat"><span class="mm-measured-muted">Published measured cases</span><b>${promoted.length}</b></div><div class="mm-measured-stat"><span class="mm-measured-muted">Governed curriculum target</span><b>${state.manifest?.targetCaseCount||70}</b></div><div class="mm-measured-stat"><span class="mm-measured-muted">Eligible profiled source families represented</span><b>${sources.size}</b></div></div>`
}
function renderLibrary(){
  const body=ensureRoot().querySelector('[data-mm-measured-body]'),published=[...state.cases.values()];
  body.innerHTML=statusHtml()+`<div class="mm-measured-boundary"><b>Evidence boundary:</b> catalogue targets are not presented as completed cases. Only cases with an exact reviewed source/window binding, resolved units and semantics, compact measured representation, provenance fingerprints and passing release QA appear below. Public measured behaviour can support observations and bounded associations; it does not become a production root-cause claim merely because the data are real.</div>`+
  (published.length?`<div class="mm-measured-grid">${published.map(c=>`<article class="mm-measured-card"><span class="mm-measured-chip">${esc(c.evidenceTier)}</span><h3>${esc(c.title)}</h3><p class="mm-measured-muted">${esc(c.difficulty)} · ${esc(c.analysisLens)}</p><button type="button" data-mm-measured-open="${esc(c.id)}">Open case</button></article>`).join('')}</div>`:`<div class="mm-measured-empty"><b>No measured learner cases are promoted yet.</b><p>The governed 70-case curriculum is installed, but MouldMaster will not substitute synthetic or invented traces for missing source-window bindings. Cases appear here only after exact measured evidence passes the promotion gate.</p></div>`);
  body.querySelectorAll('[data-mm-measured-open]').forEach(b=>b.addEventListener('click',()=>renderCase(b.dataset.mmMeasuredOpen)))
}
function points(values,width=900,height=190){
  if(!values?.length)return '';
  const ys=values.map(Number),min=Math.min(...ys),max=Math.max(...ys),span=max-min||1;
  return ys.map((v,i)=>`${(i/(ys.length-1))*width},${height-((v-min)/span)*height}`).join(' ')
}
function traceHtml(signal){const rep=signal.representation||{},poly=points(rep.y||[]);return `<div class="mm-measured-trace"><b>${esc(signal.label)} <span class="mm-measured-muted">(${esc(signal.unit)})</span></b><svg viewBox="0 0 900 210" role="img" aria-label="${esc(signal.label)} compact measured trace"><polyline points="${poly}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"></polyline></svg><p class="mm-measured-muted">${esc(rep.originalPointCount)} original points → ${(rep.y||[]).length} displayed · ${esc(rep.reductionMethod)}</p></div>`}
function renderCase(id){
  const c=state.cases.get(id);if(!c)return;
  const body=ensureRoot().querySelector('[data-mm-measured-body]'),e=c.evidence||{},task=c.learnerTask||{};
  body.innerHTML=`<button type="button" class="mm-measured-back" data-mm-measured-back>← Library</button><article class="mm-measured-case"><div class="mm-measured-section"><span class="mm-measured-chip">${esc(c.evidenceTier)}</span><h2>${esc(c.title)}</h2><p class="mm-measured-muted">${esc(c.id)} · ${esc(c.difficulty)} · claim scope: ${esc(c.claimScope)}</p></div><section class="mm-measured-section"><h3>1 · Observe</h3><p>${esc(task.observePrompt)}</p>${(c.signals||[]).map(traceHtml).join('')}</section><section class="mm-measured-section"><h3>2 · Quantify & compare</h3>${list((c.features||[]).map(f=>`${f.label||f.id}: ${f.value}${f.unit?` ${f.unit}`:''}`))}</section><section class="mm-measured-section"><h3>3 · Investigate</h3><p>${esc(task.investigatePrompt)}</p></section><section class="mm-measured-section"><h3>4 · Explain</h3><p>${esc(task.explanation)}</p><p><b>Takeaway:</b> ${esc(task.takeaway)}</p></section><section class="mm-measured-section"><h3>5 · Evidence boundary</h3><div class="mm-measured-evidence-grid"><div class="mm-measured-good"><b>What the measurements support</b>${list(e.supportedConclusions)}</div><div class="mm-measured-limit"><b>What they do not establish</b>${list(e.unsupportedConclusions)}</div></div><p class="mm-measured-muted"><b>Limitations:</b></p>${list(e.limitations)}</section><section class="mm-measured-section"><h3>Provenance</h3><p class="mm-measured-muted">Source family: ${esc(c.source?.familyId)}<br>Dataset: ${esc(c.source?.datasetId)}<br>Source fingerprint: ${esc(c.source?.sourceFingerprint)}<br>Window fingerprint: ${esc(c.source?.sourceWindowFingerprint)}</p></section></article>`;
  body.querySelector('[data-mm-measured-back]').addEventListener('click',renderLibrary);body.scrollIntoView({block:'start'})
}
async function open(){
  ensureRoot();root.hidden=false;document.documentElement.style.overflow='hidden';
  const body=root.querySelector('[data-mm-measured-body]');body.innerHTML='<div class="mm-measured-empty">Loading governed measured cases…</div>';
  try{await load();renderLibrary()}catch(err){body.innerHTML=`<div class="mm-measured-empty"><b>Measured library unavailable</b><p>${esc(err.message)}</p></div>`}
}
function close(){if(root)root.hidden=true;document.documentElement.style.removeProperty('overflow');window.MM_APP_SHELL?.navigation?.setCustomActive?.('')}
const api={version:'2026.09.05.1',open,close,load,get state(){return state}};window.MM_MEASURED_LEARNING_LIBRARY=api;
if(window.MM_APP_SHELL?.navigation?.register){window.MM_APP_SHELL.navigation.register({id:'measured-learning',label:'Measured learning',icon:'⌁',description:'Explore governed real measured behaviour and evidence limits.',order:35,group:'practice',mobileGroup:'practice',action:open})}
})();
