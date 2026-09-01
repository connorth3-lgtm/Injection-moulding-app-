/* MouldMaster local process intelligence UI — 2026.09.02.1 */
(function(){
'use strict';

const VERSION='2026.09.02.1';
const DB_NAME='mouldmaster-process-data-v1';
const PASS=new Set(['pass','ok','good','accept','accepted','yes','true','1']);
const FAIL=new Set(['fail','ng','bad','reject','rejected','no','false','0']);
let queued=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v,d=3){return Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function sd(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}
function openDb(){
  return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
}
async function all(store){
  const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>{resolve(r.result||[]);db.close()};r.onerror=()=>{reject(r.error);db.close()}})
}
async function one(store,key){
  const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(store,'readonly').objectStore(store).get(key);r.onsuccess=()=>{resolve(r.result||null);db.close()};r.onerror=()=>{reject(r.error);db.close()}})
}
async function baselinesFor(dataset){
  const xs=await all('baselines');return xs.filter(x=>x.datasetId===dataset.id||entityCompatible(x.entities,dataset.entities)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))
}
function entityCompatible(a={},b={}){
  const keys=['machine','mould','materialGrade'];let compared=0;
  for(const k of keys){if(a[k]&&b[k]){compared++;if(a[k]!==b[k])return false}}
  return compared>0
}
function qualityLabel(v){const x=String(v??'').trim().toLowerCase();if(PASS.has(x))return 1;if(FAIL.has(x))return 0;return null}
function resolvedNumeric(dataset){
  return Object.values(dataset.semantics||{}).filter(x=>['actual','derived','quality'].includes(x.role)&&!(x.blockers||[]).length)
}
function interventionPoints(rows){
  const keys=['intervention_code','intervention'];const key=keys.find(k=>rows.some(r=>String(r[k]??'').trim()));if(!key)return[];
  const out=[];let prev='';
  for(let i=0;i<rows.length;i++){const cur=String(rows[i][key]??'').trim();if(cur&&cur!==prev)out.push({index:i,label:cur});if(cur)prev=cur}
  return out.slice(0,50)
}
function cavitySummary(rows,dataset){
  const groups=new Map();for(const r of rows){const c=String(r.cavity??'').trim();if(!c)continue;if(!groups.has(c))groups.set(c,[]);groups.get(c).push(r)}
  if(groups.size<2)return[];
  const channels=resolvedNumeric(dataset).filter(s=>s.role!=='quality').slice(0,6);
  return [...groups].map(([c,rs])=>{
    const q=rs.map(r=>qualityLabel(r.quality_result)).filter(x=>x!=null);
    const values={};for(const s of channels){const a=rs.map(r=>Number(r[s.column])).filter(Number.isFinite);values[s.column]=mean(a)}
    return {cavity:c,rows:rs.length,goodRate:q.length?mean(q):null,values}
  }).sort((a,b)=>String(a.cavity).localeCompare(String(b.cavity),undefined,{numeric:true}))
}
function qualityAssociations(rows,dataset){
  const labelled=rows.map(r=>({r,y:qualityLabel(r.quality_result)})).filter(x=>x.y!=null);if(labelled.length<10)return[];
  const out=[];for(const s of resolvedNumeric(dataset).filter(x=>x.role!=='quality')){
    const good=labelled.filter(x=>x.y===1).map(x=>Number(x.r[s.column])).filter(Number.isFinite);
    const bad=labelled.filter(x=>x.y===0).map(x=>Number(x.r[s.column])).filter(Number.isFinite);
    if(good.length<3||bad.length<3)continue;
    const pooled=Math.max(Math.sqrt((sd(good)**2+sd(bad)**2)/2),1e-9);
    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference:Math.abs(mean(good)-mean(bad))/pooled});
  }
  return out.sort((a,b)=>b.standardizedDifference-a.standardizedDifference).slice(0,10)
}
function energySummary(rows,dataset){
  const candidates=resolvedNumeric(dataset).filter(s=>/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||'')));
  if(!candidates.length)return null;
  const s=candidates[0],vals=rows.map(r=>Number(r[s.column])).filter(Number.isFinite);if(!vals.length)return null;
  let total=vals.reduce((a,b)=>a+b,0),unit=s.unit;
  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}
  const q=rows.map(r=>qualityLabel(r.quality_result)).filter(x=>x!=null),good=q.filter(x=>x===1).length;
  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyPerGoodPart:unit==='kWh'&&good?total/good:null,sourceUnit:s.unit}
}
function driftHtml(result){
  if(!result?.signals?.length)return '<div class="di-empty">No common resolved numeric channels were available for this baseline comparison.</div>';
  return `<div class="pi-table">${result.signals.slice(0,15).map(x=>`<div class="pi-row"><div><b>${esc(x.meaning||x.channel)}</b><small>${esc(x.channel)} · ${esc(x.unit||'')}</small></div><span>${fmt(x.baselineMean)}</span><span>${fmt(x.currentMean)}</span><span class="pi-${esc(x.level)}">${fmt(x.normalizedShift,2)}σ · ${esc(x.level)}</span></div>`).join('')}</div><p class="muted">${esc(result.boundary)}</p>`
}
function changeHtml(result){
  if(!result?.changes?.length)return '<div class="di-empty">No resolved numeric channels were available in both windows.</div>';
  return `<div class="pi-table">${result.changes.slice(0,15).map(x=>`<div class="pi-row"><div><b>${esc(x.meaning||x.channel)}</b><small>${esc(x.channel)} · ${esc(x.unit||'')}</small></div><span>${fmt(x.beforeMean)}</span><span>${fmt(x.afterMean)}</span><span>${fmt(x.normalizedChange,2)}σ</span></div>`).join('')}</div><p class="muted">${esc(result.boundary)}</p>`
}
function ensureStyle(){
  if(document.getElementById('mm-process-intelligence-style'))return;
  const s=document.createElement('style');s.id='mm-process-intelligence-style';s.textContent=`
  .pi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.pi-table{display:grid;gap:5px}.pi-row{display:grid;grid-template-columns:minmax(180px,1.6fr) 1fr 1fr 1fr;gap:8px;align-items:center;padding:8px 10px;border:1px solid #304b69;border-radius:8px;background:#0e1d31;font-size:11px}.pi-row small{display:block;color:var(--muted)}.pi-high{color:#ff9da8}.pi-review{color:#ffd166}.pi-stable{color:#7ce6a3}.pi-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.pi-kpi{padding:10px;border:1px solid #304b69;border-radius:8px;background:#0e1d31}.pi-kpi b{display:block;font-size:18px}.pi-kpi small{color:var(--muted)}.pi-analysis-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.pi-analysis-controls label{min-width:160px}.pi-analysis-controls select,.pi-analysis-controls input{width:100%}
  @media(max-width:800px){.pi-grid{grid-template-columns:1fr}.pi-row{grid-template-columns:1fr 1fr}.pi-kpis{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(s)
}
async function openAnalysis(datasetId){
  const api=window.MM_CONNECTED_PROCESS_DATA;if(!api)return;
  const [dataset,rows]=await Promise.all([one('datasets',datasetId),api.storage.rowsForDataset(datasetId)]);if(!dataset)return;
  if(!dataset.quality?.analysisReady){window.toast?.('Resolve semantic or sequence blockers before process intelligence');return}
  const baselines=await baselinesFor(dataset),points=interventionPoints(rows),cavities=cavitySummary(rows,dataset),quality=qualityAssociations(rows,dataset),energy=energySummary(rows,dataset);
  const host=document.getElementById('processDataLabs');if(!host)return;ensureStyle();
  host.innerHTML=`<div data-pi-root><div class="di-actions" style="margin-bottom:12px"><button class="ghost" data-pi-library>← Dataset library</button><button class="ghost" data-pi-intake>Process-data intake</button></div><div class="card di-hero"><div class="eyebrow">Site-local process intelligence</div><h2>${esc(dataset.datasetMeta?.source_label||dataset.id)}</h2><p>${dataset.rowCount} prepared rows · analysis-ready · ${esc([dataset.entities?.machine,dataset.entities?.mould,dataset.entities?.materialGrade].filter(Boolean).join(' · '))}</p><div class="di-note"><b>Boundary:</b> these are site-local statistical evidence views. They do not create universal settings, machine safety limits, validated process windows, automatic root cause or production-change authority.</div></div>
  <div class="pi-grid"><section class="card di-panel"><h3>Golden baseline / drift</h3><div class="pi-analysis-controls"><label>Baseline<select data-pi-baseline><option value="">Choose baseline</option>${baselines.map(b=>`<option value="${esc(b.id)}">${esc(b.label)} · ${new Date(b.createdAt).toLocaleDateString()}</option>`).join('')}</select></label><button class="secondary" data-pi-drift ${baselines.length?'':'disabled'}>Compare drift</button></div><div data-pi-drift-result style="margin-top:10px">${baselines.length?'<div class="di-empty">Select a compatible site-local baseline.</div>':'<div class="di-empty">No compatible baseline yet. Create one from an analysis-ready known-good dataset in the library.</div>'}</div></section>
  <section class="card di-panel"><h3>Before / after intervention</h3><div class="pi-analysis-controls"><label>Split row<input type="number" min="1" max="${Math.max(1,rows.length-1)}" value="${points[0]?.index||Math.floor(rows.length/2)}" data-pi-split></label><label>Window rows<input type="number" min="3" max="500" value="20" data-pi-window></label><button class="secondary" data-pi-before-after>Compare windows</button></div>${points.length?`<p class="muted">Detected intervention labels: ${points.slice(0,8).map(p=>`${esc(p.label)} @ row ${p.index}`).join(' · ')}</p>`:'<p class="muted">No intervention-code transition was detected; choose the split row manually.</p>'}<div data-pi-change-result><div class="di-empty">Compare matched windows around one controlled change or event.</div></div></section></div>
  <div class="pi-grid"><section class="card di-panel"><h3>Cavity intelligence</h3>${cavities.length?`<div class="pi-table">${cavities.slice(0,24).map(c=>`<div class="pi-row"><div><b>Cavity ${esc(c.cavity)}</b><small>${c.rows} rows</small></div><span>${c.goodRate==null?'—':`${fmt(c.goodRate*100,1)}% good`}</span><span>${Object.entries(c.values).slice(0,1).map(([k,v])=>`${esc(k)} ${fmt(v)}`).join('')}</span><span></span></div>`).join('')}</div>`:'<div class="di-empty">At least two retained cavity identifiers are needed for cavity comparison.</div>'}</section>
  <section class="card di-panel"><h3>Quality associations</h3>${quality.length?`<div class="pi-table">${quality.map(q=>`<div class="pi-row"><div><b>${esc(q.meaning)}</b><small>${esc(q.channel)} · correlation support only</small></div><span>Good ${fmt(q.goodMean)}</span><span>Bad ${fmt(q.badMean)}</span><span>${fmt(q.standardizedDifference,2)}σ separation</span></div>`).join('')}</div><p class="muted">Association does not establish causality and is not a release/acceptance rule.</p>`:'<div class="di-empty">A controlled pass/fail quality_result plus enough resolved numeric rows is needed for local association ranking.</div>'}</section></div>
  <section class="card di-panel" style="margin-top:12px"><h3>Energy per good part</h3>${energy?`<div class="pi-kpis"><div class="pi-kpi"><b>${fmt(energy.totalKwh,4)}</b><small>kWh in dataset</small></div><div class="pi-kpi"><b>${energy.goodParts}</b><small>good labelled parts</small></div><div class="pi-kpi"><b>${fmt(energy.energyPerGoodPart,6)}</b><small>kWh / good part</small></div><div class="pi-kpi"><b>${esc(energy.channel)}</b><small>energy channel</small></div></div>`:'<div class="di-empty">No resolved energy channel with an engineering energy unit (kWh, Wh, J, kJ or MJ) was found.</div>'}</section></div>`;
  wire(host,dataset,rows)
}
function wire(host,dataset,rows){
  const api=window.MM_CONNECTED_PROCESS_DATA;
  host.querySelector('[data-pi-library]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_LOCAL_INTAKE?.openLibrary?.());
  host.querySelector('[data-pi-intake]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_LOCAL_INTAKE?.open?.());
  host.querySelector('[data-pi-drift]')?.addEventListener('click',async()=>{const id=host.querySelector('[data-pi-baseline]')?.value;if(!id)return;try{const result=await api.intelligence.compareToBaseline(dataset.id,id);host.querySelector('[data-pi-drift-result]').innerHTML=driftHtml(result)}catch(err){window.toast?.(err?.message||String(err))}});
  host.querySelector('[data-pi-before-after]')?.addEventListener('click',()=>{const split=Number(host.querySelector('[data-pi-split]')?.value),windowSize=Number(host.querySelector('[data-pi-window]')?.value),result=api.intelligence.compareWindows(rows,dataset.semantics,split,windowSize);host.querySelector('[data-pi-change-result]').innerHTML=changeHtml(result)})
}
function enhanceLibrary(){
  const root=document.querySelector('[data-di-library-root]');if(!root)return;
  root.querySelectorAll('.di-dataset').forEach(card=>{
    if(card.querySelector('[data-pi-analyze]'))return;
    if((card.querySelector('.muted')?.textContent||'').includes('blocked'))return;
    const id=card.querySelector('[data-di-baseline],[data-di-delete]')?.dataset.diBaseline||card.querySelector('[data-di-delete]')?.dataset.diDelete;
    if(!id)return;
    const actions=card.querySelector('.di-actions');if(!actions)return;
    const b=document.createElement('button');b.className='primary';b.dataset.piAnalyze=id;b.textContent='Analyze';b.addEventListener('click',()=>openAnalysis(id));actions.prepend(b)
  })
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceLibrary()})}
function install(){
  ensureStyle();
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  schedule();
  window.MM_PROCESS_INTELLIGENCE_UI={version:VERSION,openAnalysis,scope:'Local statistical evidence UI for baseline drift, before/after interventions, cavity comparison, quality associations and energy-per-good-part. No machine control or universal process limits.'}
}
function wait(){
  if(window.MM_CONNECTED_PROCESS_DATA){install();return}
  setTimeout(wait,25)
}
wait();
})();
