/* MouldMaster 20-pass process-data atlas — 200 normalized synthetic evidence cases */
(function(){
'use strict';
const VERSION='2026.08.26.1';
const REVIEWED='2026-08-26';
const REVIEW_BY='2026-11-26';
const BASE=window.MM_PROCESS_DATA_DIAGNOSTICS;
const E=window.MM_EVIDENCE_SOURCES;
const PASSES=window.MM_PROCESS_DATA_20_PASS_PACKS||[];
if(!BASE)throw new Error('process-data-20-pass-atlas.js requires process-data-diagnostics.js');
if(!E||!E.sources)throw new Error('process-data-20-pass-atlas.js requires MM_EVIDENCE_SOURCES');
if(PASSES.length!==20)throw new Error(`20-pass process-data atlas expected 20 passes, got ${PASSES.length}`);

/* Sources added only where the existing evidence library had a genuine gap. */
const EXTRA_SOURCES={
 'switchover-review-2025':{name:'Injection-to-holding pressure switchover methods review (2025)',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3390/polym17081096'},
 'thermal-control-review-2022':{name:'Injection mould thermal-control systems review (2022)',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3390/ma15124048'},
 'ai-cognition-2025':{name:'AI-driven cognition and process monitoring for injection moulding (2025)',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-025-15611-x'},
 'warpage-review-2025':{name:'Injection-moulding warpage research review (2025)',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1177/14644207241285399'},
 'conformal-cooling-review-2020':{name:'Conformal cooling channels in injection moulding review (2020)',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3934/mbe.2020292'},
 'monitor-control-review-2018':{name:'Injection moulding process monitoring and control review (2018)',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1016/j.procir.2017.12.229'},
 'measurement-review-2024':{name:'Zhao et al. (2024) — measurement techniques in injection molding',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1016/j.measurement.2024.114163'},
 'smart-sensor-review-2025':{name:'Shin et al. (2025) — in-situ and in-line monitoring with intelligent sensors',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1016/j.sna.2025.116248'},
 'predictive-maintenance-2026':{name:'Rebelo et al. (2026) — condition maintenance and prediction system in an injection molding machine',authority:'peer-reviewed research',kind:'case study',url:'https://doi.org/10.1108/JQME-05-2025-0050'},
 'sensor-review-2019':{name:'In-Mold Sensors for Injection Molding: On the Way to Industry 4.0',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3390/s19163551'}
};
for(const [id,source] of Object.entries(EXTRA_SOURCES))if(!E.sources[id])E.sources[id]=source;

const RAW=[];
for(const pass of PASSES){
  for(const row of pass.cases||[])RAW.push({pass,...Object.fromEntries([]),row});
}
if(RAW.length!==200)throw new Error(`20-pass process-data atlas expected 200 cases, got ${RAW.length}`);

const DEFS=RAW.map(({pass,row})=>({
  id:row[0],title:row[1],pass:pass.pass,passId:pass.id,passTitle:pass.title,domain:pass.domain,
  sourceIds:pass.sourceIds.slice(),purpose:pass.purpose,
  signals:Object.fromEntries(row[2].map(x=>[x[0],x.slice(1)])),
  fault:row[3],diagnosis:row[4],next:row[5],verification:row[6],compensationTrap:row[7]
}));
if(new Set(DEFS.map(x=>x.id)).size!==200)throw new Error('20-pass process-data case IDs must be unique');

function seedFrom(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function noise(r,scale){return(r()-.5)*2*scale}
function generate(def){
  const r=rng(seedFrom(def.id)),rows=[];
  for(const [phase,p] of [['baseline',0],['fault',1],['recovery',2]]){
    for(let cycle=1;cycle<=24;cycle++){
      const row={phase,cycle};
      for(const [name,v] of Object.entries(def.signals)){
        const base=+v[0],delta=+v[1],recovery=+v[2];
        const target=p===0?base:p===1?base+delta:recovery;
        const spread=Math.max(0.45,Math.abs(delta)*0.035);
        row[name]=+(target+noise(r,spread)).toFixed(3);
      }
      rows.push(row);
    }
  }
  return {...def,synthetic:true,rows,phaseCounts:{baseline:24,fault:24,recovery:24},normalisation:{baselineIndex:100,meaning:'100 is the normalized known-good signature for this training case, not a production setpoint or specification.'},educationBoundary:'Synthetic normalized training data only. Indices illustrate relative signal relationships and recovery; they are not universal production settings, acceptance limits, maintenance thresholds or machine-control instructions.'};
}
const DATASETS=DEFS.map(generate);

function mean(rows,key){const a=rows.map(r=>Number(r[key])).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function summary(ds){return Object.keys(ds.signals).map(key=>{const b=mean(ds.rows.filter(r=>r.phase==='baseline'),key),f=mean(ds.rows.filter(r=>r.phase==='fault'),key),r=mean(ds.rows.filter(r=>r.phase==='recovery'),key);return{key,b,f,r,d:f-b}})}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function label(v){return String(v||'').replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2')}
function source(id){return E.sources[id]||{name:id,url:''}}
function sourceHtml(id){const x=source(id),name=esc(x.name||id),url=String(x.url||'');return /^https:\/\//.test(url)?`<a href="${esc(url)}" target="_blank" rel="noopener">${name} ↗</a>`:name}
function pattern(ds){return summary(ds).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,3).map(x=>`${label(x.key)} ${x.d>=0?'rises':'falls'} ${Math.abs(x.d).toFixed(1)} index points`).join('; ')}
function csv(ds){const keys=['phase','cycle',...Object.keys(ds.signals)],lines=[keys.join(',')];for(const row of ds.rows)lines.push(keys.map(k=>row[k]).join(','));return lines.join('\n')+'\n'}
function host(){return document.getElementById('processDataLabs')}

function ensureStyle(){if(document.getElementById('mm-atlas20-style'))return;const s=document.createElement('style');s.id='mm-atlas20-style';s.textContent=`
.at20-launch{margin:12px 8px 0 0}.at20-hero{padding:22px}.at20-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.at20-kpi{padding:12px;border:1px solid #304b69;border-radius:10px;background:#0e1d31}.at20-kpi b{display:block;font-size:22px}.at20-kpi span{font-size:10px;color:var(--muted)}.at20-note{padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;font-size:12px;line-height:1.55}.at20-tools{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin:14px 0}.at20-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.at20-card{padding:15px;display:flex;flex-direction:column;gap:8px}.at20-card h3{margin:0}.at20-card p{margin:0;color:var(--muted);font-size:12px;line-height:1.5;flex:1}.at20-tags{display:flex;gap:5px;flex-wrap:wrap}.at20-tag{font-size:10px;border:1px solid #365575;border-radius:999px;padding:4px 7px;color:#c5d9ee;background:#102137}.at20-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:12px 0}.at20-panel{padding:18px;margin-top:11px}.at20-tablewrap{overflow:auto;border:1px solid #2d4563;border-radius:10px}.at20-table{width:100%;border-collapse:collapse;min-width:650px}.at20-table th,.at20-table td{padding:9px 10px;border-bottom:1px solid #253b55;text-align:right;font-size:12px}.at20-table th:first-child,.at20-table td:first-child{text-align:left}.at20-chain{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.at20-chain>div{padding:11px;border-left:4px solid #69a8ff;border-radius:8px;background:#102137;font-size:12px;line-height:1.5}.at20-chain>div:nth-child(2){border-left-color:#ffd166}.at20-chain>div:nth-child(3){border-left-color:#55d6be}.at20-chain>div:nth-child(4){border-left-color:#c68cff}.at20-trap{padding:12px;border:1px solid #7d4b52;background:#301c22;border-radius:10px;color:#ffd5da;line-height:1.5;font-size:12px;margin-top:10px}.at20-sources{display:grid;gap:6px}.at20-sources div{font-size:12px;padding:8px 10px;border-radius:8px;background:#0e1d31}.at20-empty{padding:18px;border:1px dashed #3b5978;border-radius:10px;color:var(--muted)}
@media(max-width:800px){.at20-grid{grid-template-columns:1fr}.at20-kpis{grid-template-columns:1fr 1fr}.at20-chain{grid-template-columns:1fr 1fr}.at20-tools{grid-template-columns:1fr}}
@media(max-width:480px){.at20-kpis,.at20-chain{grid-template-columns:1fr}}
`;document.head.appendChild(s)}

function attachLauncher(){const h=host();if(!h||!h.querySelector('.pd-hero')||h.querySelector('[data-at20-launch]')||h.querySelector('[data-at20-root]'))return;ensureStyle();const b=document.createElement('button');b.type='button';b.className='secondary at20-launch';b.dataset.at20Launch='1';b.textContent='Open 20-pass · 200-case atlas';h.querySelector('.pd-hero').appendChild(b)}
function open(){BASE.open();requestAnimationFrame(()=>renderHome())}
function passes(){return PASSES.slice().sort((a,b)=>a.pass-b.pass)}
function filterList(pass='all',q=''){const query=String(q||'').trim().toLowerCase();return DATASETS.filter(d=>(pass==='all'||String(d.pass)===String(pass))&&(!query||[d.title,d.domain,d.passTitle,d.fault,d.diagnosis,d.next,d.verification,d.compensationTrap,...Object.keys(d.signals)].join(' ').toLowerCase().includes(query)))}
function renderHome(pass='all',q=''){
  ensureStyle();const h=host();if(!h)return;const list=filterList(pass,q);
  h.innerHTML=`<div data-at20-root class="at20-hero card"><div class="eyebrow">Twenty-pass evidence atlas</div><h2>200 advanced process-data cases</h2><p>Twenty independent deep-dive passes cover machine delivery, tooling, materials, scientific moulding, sensing, quality, maintenance, transfer, precision and sustainability. Every case uses four linked signals across 24 known-good baseline, 24 fault and 24 recovery cycles.</p><div class="at20-kpis"><div class="at20-kpi"><b>20</b><span>deep-dive passes</span></div><div class="at20-kpi"><b>200</b><span>retained cases</span></div><div class="at20-kpi"><b>14,400</b><span>synthetic cycles</span></div><div class="at20-kpi"><b>4</b><span>linked signals per case</span></div></div><div class="at20-note"><b>How to read the numbers:</b> baseline index 100 means “this case's normalized known-good signature.” It is deliberately unitless. A value of 125 means the synthetic signal is about 25 index points above its own baseline — not 125 °C, MPa, mm/s, kN or any other production setting. These cases are evidence practice, not a production recipe.</div></div>
  <div class="at20-tools"><select data-at20-pass aria-label="Filter atlas by pass"><option value="all">All 20 passes · 200 cases</option>${passes().map(p=>`<option value="${p.pass}" ${String(pass)===String(p.pass)?'selected':''}>${String(p.pass).padStart(2,'0')} · ${esc(p.title)} · 10</option>`).join('')}</select><input data-at20-search value="${esc(q)}" placeholder="Search case, signal or mechanism…" aria-label="Search 200 process-data cases"><button class="ghost" data-at20-guided>Back to guided 14 cases</button></div>
  <div class="muted tiny" style="margin:0 0 10px">Showing ${list.length} of 200 cases.</div><div class="at20-grid">${list.length?list.map(card).join(''):'<div class="at20-empty">No cases match this filter.</div>'}</div>`;
}
function card(d){return `<article class="at20-card card"><div class="at20-tags"><span class="at20-tag">Pass ${String(d.pass).padStart(2,'0')}</span><span class="at20-tag">${esc(d.domain)}</span><span class="at20-tag">72 cycles</span></div><h3>${esc(d.title)}</h3><p>${esc(d.fault)}</p><button type="button" class="secondary" data-at20-open="${esc(d.id)}">Inspect evidence case</button></article>`}
function renderCase(id){const d=DATASETS.find(x=>x.id===id);if(!d)return renderHome();const h=host(),rows=summary(d);h.innerHTML=`<div data-at20-root><div class="at20-toolbar"><button class="ghost" data-at20-home>← 200-case atlas</button><button class="ghost" data-at20-guided>Guided 14 cases</button></div><div class="at20-hero card"><div class="at20-tags"><span class="at20-tag">Pass ${String(d.pass).padStart(2,'0')} · ${esc(d.passTitle)}</span><span class="at20-tag">${esc(d.domain)}</span><span class="at20-tag">normalized synthetic data</span></div><h2>${esc(d.title)}</h2><p>${esc(d.fault)}</p><div class="at20-note">${esc(d.educationBoundary)} Baseline index 100 is this case's own known-good reference only.</div></div><div class="at20-panel card"><h3>Baseline → fault → recovery</h3><div class="at20-tablewrap"><table class="at20-table"><thead><tr><th>Signal</th><th>Known-good index</th><th>Fault index</th><th>Recovery index</th><th>Fault Δ</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(label(r.key))}</td><td>${r.b.toFixed(1)}</td><td>${r.f.toFixed(1)}</td><td>${r.r.toFixed(1)}</td><td>${r.d>=0?'+':''}${r.d.toFixed(1)}</td></tr>`).join('')}</tbody></table></div><p><b>Read the pattern:</b> ${esc(pattern(d))}</p><div class="at20-chain"><div><b>Observed pattern</b><br>${esc(d.fault)}</div><div><b>Ranked root-cause mechanism</b><br>${esc(d.diagnosis)}</div><div><b>Best next evidence</b><br>${esc(d.next)}</div><div><b>Verification</b><br>${esc(d.verification)}</div></div><div class="at20-trap"><b>Compensation trap — do not mistake masking for root-cause correction:</b><br>${esc(d.compensationTrap)}</div><div class="at20-toolbar"><button class="secondary" data-at20-csv="${esc(d.id)}">Export 72-cycle CSV</button></div></div><div class="at20-panel card"><h3>Evidence sources for the mechanism/study method</h3><div class="at20-sources">${d.sourceIds.map(id=>`<div>${sourceHtml(id)}</div>`).join('')}</div><p class="tiny muted">Sources support the mechanism or measurement/study method. They do not convert the synthetic indices into universal limits or production authority.</p></div></div>`}
function download(id){const d=DATASETS.find(x=>x.id===id);if(!d)return;const blob=new Blob([csv(d)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-atlas-${d.id}-normalized-training.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function currentFilters(){const h=host();return{pass:h?.querySelector('[data-at20-pass]')?.value||'all',q:h?.querySelector('[data-at20-search]')?.value||''}}
function click(e){const t=e.target.closest('[data-at20-launch],[data-at20-open],[data-at20-home],[data-at20-guided],[data-at20-csv]');if(!t)return;if(t.hasAttribute('data-at20-launch'))return open();if(t.dataset.at20Open)return renderCase(t.dataset.at20Open);if(t.hasAttribute('data-at20-home'))return renderHome();if(t.hasAttribute('data-at20-guided'))return BASE.open();if(t.dataset.at20Csv)return download(t.dataset.at20Csv)}
function change(e){if(e.target.matches('[data-at20-pass]')){const f=currentFilters();renderHome(e.target.value,f.q)}}
let searchTimer=0;function input(e){if(!e.target.matches('[data-at20-search]'))return;clearTimeout(searchTimer);const val=e.target.value;searchTimer=setTimeout(()=>{const f=currentFilters();renderHome(f.pass,val);const box=host()?.querySelector('[data-at20-search]');if(box){box.focus();box.setSelectionRange(box.value.length,box.value.length)}},140)}
document.addEventListener('click',click);document.addEventListener('change',change);document.addEventListener('input',input);
const previousOpen=BASE.open.bind(BASE);BASE.open=function(){const r=previousOpen();requestAnimationFrame(attachLauncher);return r};
attachLauncher();
window.MM_PROCESS_DATA_20_PASS_ATLAS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,passes:passes().map(p=>({pass:p.pass,id:p.id,title:p.title,domain:p.domain,purpose:p.purpose,sourceIds:p.sourceIds,count:p.cases.length})),cases:DATASETS.map(d=>({id:d.id,title:d.title,pass:d.pass,passTitle:d.passTitle,domain:d.domain,signals:Object.keys(d.signals),sourceIds:d.sourceIds,fault:d.fault,diagnosis:d.diagnosis,next:d.next,verification:d.verification,compensationTrap:d.compensationTrap,origin:'20-pass atlas'})),datasets:DATASETS,byId:id=>DATASETS.find(d=>d.id===id)||null,toCsv:id=>{const d=DATASETS.find(x=>x.id===id);return d?csv(d):''},open,scope:'200 deterministic normalized synthetic process-data cases across 20 deep-dive passes; evidence-learning only, outside formal assessment and not a production recipe or source of universal setpoints.'};
})();
