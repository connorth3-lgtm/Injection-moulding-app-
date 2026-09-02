/* MouldMaster research ↔ local data context bridge — 2026.09.02.2 */
(function(){
'use strict';
const VERSION='2026.09.02.2';
let queued=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
const fmt=(v,d=2)=>Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—';

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
  const render=()=>{root.querySelector(':scope > [data-mm-research-context]')?.remove();window.MM_RESEARCH_EVIDENCE_UI?.render?.(root,intakeContext(root),3,'process-intake')};
  render();root.addEventListener('change',e=>{if(e.target.closest?.('[data-di-channel],[data-di-meta]'))render()})
}

async function processIntelligenceContext(root){
  const label=clean(root.querySelector('.di-hero h2')?.textContent),api=window.MM_CONNECTED_PROCESS_DATA;if(!label||!api)return null;
  const datasets=await api.storage.listDatasets(),dataset=datasets.find(d=>clean(d.datasetMeta?.source_label)===label||d.id===label);if(!dataset)return null;
  return {dataset,context:datasetContext(dataset,root.textContent||'')}
}
function ensureRunStyle(){if(document.getElementById('mm-run-insights-style'))return;const s=document.createElement('style');s.id='mm-run-insights-style';s.textContent=`
.mm-run-insights{margin:12px 0;border:1px solid #3c6388;border-radius:14px;background:linear-gradient(145deg,#10243a,#0b192a);padding:16px}.mm-run-insights h3{font-size:22px;margin:4px 0 6px}.mm-ri-lead{color:#c5d7e8;line-height:1.55;margin:0 0 12px}.mm-ri-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.mm-ri-card{border:1px solid #2e4b68;border-radius:10px;background:#0d1d30;padding:11px}.mm-ri-card>small{display:block;color:#89a3bd;text-transform:uppercase;letter-spacing:.07em;font-size:9px}.mm-ri-card>b{display:block;margin:5px 0;font-size:14px}.mm-ri-card p{margin:4px 0;color:#bdd0e2;font-size:11px;line-height:1.45}.mm-ri-signal{display:grid;grid-template-columns:1fr auto;gap:8px;padding:6px 8px;margin-top:5px;border:1px solid #2c465f;border-radius:8px;background:#0a1828;font-size:11px}.mm-ri-signal span:last-child{font-weight:800}.mm-ri-high span:last-child{color:#ff9da8}.mm-ri-review span:last-child{color:#ffd166}.mm-ri-stable span:last-child{color:#7ce6a3}.mm-ri-readiness{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.mm-ri-chip{border:1px solid #405e7d;border-radius:999px;padding:4px 7px;font-size:9px}.mm-ri-chip.ok{border-color:#39765e;color:#8ee7be}.mm-ri-chip.missing{border-color:#795d36;color:#ffd18a}.mm-ri-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mm-ri-detail{margin-top:10px;border-top:1px solid #2b4864;padding-top:10px}.mm-ri-detail summary{cursor:pointer;font-weight:800}.mm-ri-engineer{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.mm-ri-note{padding:9px;border-left:3px solid #557ca5;background:#0b1929;font-size:11px;line-height:1.5;color:#bad0e4}@media(max-width:850px){.mm-ri-grid,.mm-ri-engineer{grid-template-columns:1fr}}`;
 document.head.appendChild(s)}
function qualityLinked(rows){return rows.some(r=>clean(r.quality_result))}
function cavityLinked(rows){return new Set(rows.map(r=>clean(r.cavity)).filter(Boolean)).size>1}
function interventionLinked(rows){return rows.some(r=>clean(r.intervention_code||r.intervention))}
function energyLinked(dataset){return Object.values(dataset.semantics||{}).some(s=>['actual','derived'].includes(s.role)&&!(s.blockers||[]).length&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||''))&&/(energy|power|kwh|watt.?hour)/i.test(`${s.column||''} ${s.meaning||''}`))}
function readiness(dataset,rows,baselineId){return [
  {ok:!!dataset.quality?.analysisReady,label:'Signals defined',fix:'Resolve semantic or sequence blockers.'},
  {ok:!!baselineId,label:'Known-good baseline',fix:'Create a Golden baseline from an accepted stable run.'},
  {ok:qualityLinked(rows),label:'Quality linked',fix:'Retain a controlled quality_result for quality association.'},
  {ok:cavityLinked(rows),label:'Cavity identity',fix:'Retain cavity identity for multi-cavity comparison.'},
  {ok:interventionLinked(rows),label:'Changes marked',fix:'Mark controlled interventions for before/after evidence.'},
  {ok:energyLinked(dataset),label:'Energy linked',fix:'Map an actual energy channel with a recognised energy unit.'}
]}
function fitLabel(v){return ({high:'Strong match',moderate:'Possible match',low:'Weak match',unknown:'Not enough context'})[v]||'Not enough context'}
function driftRows(drift){return (drift?.signals||[]).slice().sort((a,b)=>Math.abs(Number(b.normalizedShift)||0)-Math.abs(Number(a.normalizedShift)||0))}
function researchContext(base,drift){const signals=driftRows(drift).slice(0,8).map(x=>x.meaning||x.channel);return {...base,text:`${base.text||''} ${signals.join(' ')}`,signals:[...(base.signals||[]),...signals]}}
async function saveRunCase(dataset,drift,mechanism,plan){
  const workspace=window.MM_MOULD_MASTER_WORKSPACE,api=window.MM_CONNECTED_PROCESS_DATA;if(!workspace?.newCase)return;
  const changes=driftRows(drift).slice(0,4).map(x=>`${x.meaning||x.channel}: ${fmt(x.normalizedShift)} sigma`).join('; ');
  const id=workspace.newCase({title:`Run review · ${dataset.datasetMeta?.source_label||dataset.id}`,material:dataset.entities?.materialGrade||'',machine:dataset.entities?.machine||'',mould:dataset.entities?.mould||'',baseline:drift?'Compared with site-local Golden baseline':'No compatible Golden baseline yet',evidence:changes||'Analysis-ready local dataset; discriminating evidence still required.',hypothesis:mechanism?.title||'',controlledTest:plan?.strongestNextCheck||''});
  await api.cases?.linkCase?.(id,{datasetId:dataset.id,machine:dataset.entities?.machine||null,mould:dataset.entities?.mould||null,materialGrade:dataset.entities?.materialGrade||null,researchMechanismId:mechanism?.id||null});
  window.MM_RESEARCH_UTILISATION?.record?.('run_insight_case_created',{mechanismId:mechanism?.id||'none',surface:'run-insights',applicability:mechanism?.applicability?.label||'unknown'})
}
async function renderRunInsights(root,dataset,baseContext){
  if(root.querySelector('[data-mm-run-insights]'))return;ensureRunStyle();const api=window.MM_CONNECTED_PROCESS_DATA,rows=await api.storage.rowsForDataset(dataset.id);
  const baselineSelect=root.querySelector('[data-pi-baseline]'),baselineId=[...baselineSelect?.options||[]].map(x=>x.value).find(Boolean)||'';
  let drift=null;if(baselineId&&dataset.quality?.analysisReady)try{drift=await api.intelligence.compareToBaseline(dataset.id,baselineId)}catch(_){drift=null}
  const context=researchContext(baseContext,drift),mechanism=window.MM_RESEARCH_EVIDENCE?.retrieve?.(context,3)?.[0]||null,plan=mechanism?window.MM_RESEARCH_EVIDENCE?.verificationPlan?.(context,mechanism.id):null,changes=driftRows(drift),top=changes[0],ready=readiness(dataset,rows,baselineId);
  const changeMarkup=changes.length?changes.slice(0,4).map(x=>`<div class="mm-ri-signal mm-ri-${esc(x.level||'review')}"><span>${esc(x.meaning||x.channel)}</span><span>${fmt(x.normalizedShift)}σ</span></div>`).join(''):'<p>No compatible resolved channels could be compared yet.</p>';
  const missing=ready.filter(x=>!x.ok);
  const section=document.createElement('section');section.className='mm-run-insights';section.dataset.mmRunInsights='1';section.innerHTML=`<div class="eyebrow">Run Insights</div><h3>What changed — and what to check next</h3><p class="mm-ri-lead">Start with the site-local measured difference. Research only ranks explanations and the next discriminating check; it does not create production settings.</p><div class="mm-ri-grid"><div class="mm-ri-card"><small>1 · What changed</small><b>${baselineId?(top?`${esc(top.meaning||top.channel)} moved most`:'Known-good comparison available'):'Create a known-good comparison'}</b>${baselineId?changeMarkup:'<p>Create a Golden baseline from an accepted stable run. This turns raw values into site-specific change evidence.</p>'}</div><div class="mm-ri-card"><small>2 · What it may mean</small><b>${esc(mechanism?.title||'Keep the cause open')}</b><p>${esc(mechanism?`${fitLabel(mechanism.applicability?.label)} to this run. ${mechanism.claim}`:'The available context is not strong enough to rank a promoted research mechanism. Keep machine, mould, material and measurement alternatives open.')}</p></div><div class="mm-ri-card"><small>3 · Check next</small><b>${esc(plan?.strongestNextCheck||(!baselineId?'Create or select the known-good baseline':'Collect an independent actual measurement'))}</b><p>${esc(mechanism?.weakens?.[0]?`Rule it out if: ${mechanism.weakens[0]}`:'Confirm the signal change with physical quality or another independent actual before assigning cause.')}</p></div></div><div class="mm-ri-readiness">${ready.map(x=>`<span class="mm-ri-chip ${x.ok?'ok':'missing'}" title="${esc(x.ok?'Available':x.fix)}">${x.ok?'✓':'○'} ${esc(x.label)}</span>`).join('')}</div><div class="mm-ri-actions"><button class="primary" type="button" data-mm-ri-case>Save as troubleshooting case</button><button class="ghost" type="button" data-mm-ri-compare>Open detailed comparisons</button></div><details class="mm-ri-detail"><summary>Engineering interpretation</summary><div class="mm-ri-engineer"><div class="mm-ri-note"><b>How well the research matches this run</b><br>${esc(mechanism?`${fitLabel(mechanism.applicability?.label)}${mechanism.applicability?.score==null?'':` · ${Math.round(mechanism.applicability.score*100)}% contextual fit`}`:'No promoted mechanism matched strongly enough.')}</div><div class="mm-ri-note"><b>What would weaken this explanation</b><br>${esc(mechanism?.weakens?.[0]||'Independent actual measurements remain stable while the physical outcome changes.')}</div><div class="mm-ri-note"><b>Alternative to keep open</b><br>${esc(mechanism?.alternatives?.[0]||'Measurement-system, material, machine and tooling alternatives remain open.')}</div><div class="mm-ri-note"><b>Recovery evidence</b><br>${esc(plan?.recoveryCriterion||mechanism?.recovery||'The changed actual and physical outcome should return toward the validated local reference together.')}</div></div>${missing.length?`<p class="muted"><b>To make this analysis stronger:</b> ${missing.map(x=>esc(x.fix)).join(' ')}</p>`:''}</details>`;
  const hero=root.querySelector('.di-hero');(hero?.nextSibling?hero.parentNode.insertBefore(section,hero.nextSibling):root.prepend(section));
  section.querySelector('[data-mm-ri-case]')?.addEventListener('click',()=>saveRunCase(dataset,drift,mechanism,plan).catch(err=>window.toast?.(err?.message||String(err))));section.querySelector('[data-mm-ri-compare]')?.addEventListener('click',()=>root.querySelector('.pi-grid')?.scrollIntoView?.({behavior:'smooth',block:'start'}));
  window.MM_RESEARCH_UTILISATION?.record?.('run_insight_shown',{mechanismId:mechanism?.id||'none',surface:'run-insights',applicability:mechanism?.applicability?.label||'unknown'});
}
async function wireProcessIntelligence(){
  const root=document.querySelector('[data-pi-root]');if(!root||root.dataset.mmResearchWired==='1')return;root.dataset.mmResearchWired='1';
  const match=await processIntelligenceContext(root).catch(()=>null);if(!match)return;await renderRunInsights(root,match.dataset,match.context).catch(()=>{});
  if(!root.querySelector('[data-mm-ri-research-detail]')){const details=document.createElement('details');details.className='mm-ri-detail';details.dataset.mmRiResearchDetail='1';details.innerHTML='<summary>Research evidence and limitations</summary><div data-mm-ri-research-host></div>';root.appendChild(details);window.MM_RESEARCH_EVIDENCE_UI?.render?.(details.querySelector('[data-mm-ri-research-host]'),match.context,2,'site-process-data')}
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
window.MM_RESEARCH_DATA_CONTEXT={version:VERSION,datasetContext,forDataset,intakeContext,renderRunInsights,scope:'Connects promoted research mechanisms to local semantic dataset metadata and troubleshooting cases. Site-process views are technician-first: measured change, likely explanation, next check and rule-out evidence appear before detailed research. No raw rows are exposed and no production authority is created.'};
})();
