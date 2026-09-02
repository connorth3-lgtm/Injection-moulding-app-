/* MouldMaster research ↔ local data context bridge — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
let queued=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();

function datasetContext(dataset,extraText=''){
  dataset=dataset&&typeof dataset==='object'?dataset:{};
  const semantics=Object.values(dataset.semantics||{});
  const signals=semantics.filter(s=>['actual','derived'].includes(s.role)).flatMap(s=>[s.column,s.meaning]).filter(Boolean);
  const outcomes=semantics.filter(s=>s.role==='quality').flatMap(s=>[s.column,s.meaning]).filter(Boolean);
  const sensors=semantics.flatMap(s=>[s.sensor_ref,s.kind]).filter(Boolean);
  return {
    text:[dataset.datasetMeta?.source_label,dataset.evidenceState,...semantics.flatMap(s=>[s.column,s.meaning,s.role,s.unit]),extraText].filter(Boolean).join(' '),
    materials:[dataset.entities?.materialGrade,dataset.datasetMeta?.material_context].filter(Boolean),
    process:['injection moulding'],
    tooling:[dataset.entities?.mould,dataset.datasetMeta?.mould_context].filter(Boolean),
    sensors,
    signals,
    outcomes
  }
}
async function findDatasetById(id){const api=window.MM_CONNECTED_PROCESS_DATA;if(!api)return null;return (await api.storage.listDatasets()).find(x=>x.id===id)||null}
async function forDataset(id,extraText='',limit=5){const dataset=await findDatasetById(id);if(!dataset)return {dataset:null,context:null,researchEvidence:[]};const context=datasetContext(dataset,extraText),researchEvidence=window.MM_RESEARCH_EVIDENCE?.retrieve?.(context,limit)||[];return {dataset,context,researchEvidence}}

function intakeContext(root){
  const meta={};root.querySelectorAll('[data-di-meta]').forEach(el=>meta[el.dataset.diMeta]=clean(el.value));
  const signals=[],outcomes=[],sensors=[],semanticText=[];
  root.querySelectorAll('[data-di-channel]').forEach(row=>{
    const column=row.dataset.diChannel||'',meaning=clean(row.querySelector('[data-di-meaning]')?.value),role=clean(row.querySelector('[data-di-role]')?.value),unit=clean(row.querySelector('[data-di-unit]')?.value),sensor=clean(row.querySelector('[data-di-sensor]')?.value);
    semanticText.push(column,meaning,role,unit);if(['actual','derived'].includes(role))signals.push(column,meaning);if(role==='quality')outcomes.push(column,meaning);if(sensor)sensors.push(sensor)
  });
  return {text:semanticText.filter(Boolean).join(' '),materials:[meta.material_context].filter(Boolean),process:['injection moulding'],tooling:[meta.mould_context].filter(Boolean),sensors,signals:signals.filter(Boolean),outcomes:outcomes.filter(Boolean)}
}
function wireIntake(){
  const root=document.querySelector('[data-di-root]');if(!root||root.dataset.mmResearchWired==='1'||!root.querySelector('[data-di-channel]'))return;
  root.dataset.mmResearchWired='1';
  const render=()=>{root.querySelector(':scope > [data-mm-research-context]')?.remove();window.MM_RESEARCH_EVIDENCE_UI?.render?.(root,intakeContext(root),4,'process-intake')};
  render();root.addEventListener('change',e=>{if(e.target.closest?.('[data-di-channel],[data-di-meta]'))render()})
}

async function processIntelligenceContext(root){
  const label=clean(root.querySelector('.di-hero h2')?.textContent);const api=window.MM_CONNECTED_PROCESS_DATA;if(!label||!api)return null;
  const datasets=await api.storage.listDatasets();const dataset=datasets.find(d=>clean(d.datasetMeta?.source_label)===label||d.id===label);if(!dataset)return null;
  return {dataset,context:datasetContext(dataset,root.textContent||'')}
}
async function wireProcessIntelligence(){
  const root=document.querySelector('[data-pi-root]');if(!root||root.dataset.mmResearchWired==='1')return;root.dataset.mmResearchWired='1';
  const match=await processIntelligenceContext(root).catch(()=>null);if(!match)return;
  window.MM_RESEARCH_EVIDENCE_UI?.render?.(root,match.context,4,'site-process-data')
}

function workspaceCaseFromDom(root){
  const out={};root.querySelectorAll('[data-mw-field]').forEach(el=>out[el.dataset.mwField]=el.value);return out
}
function workspaceResearchSummary(wrapper,current){
  const api=window.MM_RESEARCH_WORKSPACE,workspace=window.MM_MOULD_MASTER_WORKSPACE;if(!api||!workspace)return;
  const similar=api.similarEvidence(workspace.cases?.()||[],current).filter(x=>!(current.id&&x.case?.id===current.id)).slice(0,3);if(!similar.length)return;
  wrapper.insertAdjacentHTML('beforeend',`<div class="mw-panel card" data-mm-research-similar><h3>Similar evidence mechanisms in saved cases</h3><div class="di-similar">${similar.map(x=>`<div class="di-dataset"><b>${esc(x.case?.title||x.case?.defect||'Saved case')}</b><div class="muted">Shared research mechanisms: ${esc(x.sharedMechanisms.join(', '))}</div></div>`).join('')}</div><p class="muted">Similarity is mechanism overlap only; compare the actual machine, mould, material and measured evidence before reusing a conclusion.</p></div>`)
}
function renderWorkspaceResearch(root){
  const aside=root.querySelector('.mw-summary');if(!aside)return;aside.querySelector('[data-mm-research-workspace-wrap]')?.remove();
  const current=workspaceCaseFromDom(root),context=window.MM_RESEARCH_WORKSPACE?.contextFromCase?.(current)||{text:root.textContent||''};
  const wrapper=document.createElement('div');wrapper.dataset.mmResearchWorkspaceWrap='1';aside.appendChild(wrapper);window.MM_RESEARCH_EVIDENCE_UI?.render?.(wrapper,context,3,'workspace-case');workspaceResearchSummary(wrapper,current)
}
function wireWorkspace(){
  const root=document.getElementById('mmMouldMasterWorkspace');if(!root||!root.querySelector('.mw-layout')||root.dataset.mmResearchWired==='1')return;root.dataset.mmResearchWired='1';renderWorkspaceResearch(root);
  root.addEventListener('change',e=>{if(e.target.closest?.('[data-mw-field="defect"],[data-mw-field="material"],[data-mw-field="mould"]'))renderWorkspaceResearch(root)})
}

function run(){queued=false;wireIntake();wireProcessIntelligence();wireWorkspace()}
function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
window.MM_RESEARCH_DATA_CONTEXT={version:VERSION,datasetContext,forDataset,intakeContext,scope:'Connects promoted research mechanisms to local semantic dataset metadata and local troubleshooting cases without exposing raw rows or creating production authority.'};
})();
