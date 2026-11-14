/* MouldMaster process-data deep dive — 50 additional synthetic evidence cases */
(function(){
'use strict';
const VERSION='2026.11.08.1',REVIEWED='2026-08-26',REVIEW_BY='2026-11-26';
const E=window.MM_EVIDENCE_SOURCES,PACKS=window.MM_PROCESS_DATA_DEEP_DIVE_PACKS||[];
if(!E||!E.sources)throw new Error('process-data-deep-dive-50.js requires MM_EVIDENCE_SOURCES');
if(PACKS.length!==5)throw new Error('process-data deep-dive requires five data packs');
const EXTRA_SOURCES={
 'sensor-review-2019':{name:'In-Mold Sensors for Injection Molding: On the Way to Industry 4.0',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3390/s19163551'},
 'measurement-review-2024':{name:'Zhao et al. (2024) — measurement techniques in injection molding',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1016/j.measurement.2024.114163'},
 'smart-sensor-review-2025':{name:'Shin et al. (2025) — in-situ and in-line monitoring with intelligent sensors',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.1016/j.sna.2025.116248'},
 'quality-ml-2024':{name:'Ke (2024) — data-driven quality prediction in injection molding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.26866'},
 'predictive-maintenance-2026':{name:'Rebelo et al. (2026) — condition maintenance and prediction system in an injection molding machine',authority:'peer-reviewed research',kind:'case study',url:'https://doi.org/10.1108/JQME-05-2025-0050'},
 'ultrasound-review-2021':{name:'Kariminejad et al. (2021) — Ultrasound Sensors for Process Monitoring in Injection Moulding',authority:'peer-reviewed research',kind:'review',url:'https://doi.org/10.3390/s21155193'}
};
Object.assign(E.sources,EXTRA_SOURCES);
const RAW=PACKS.flatMap(p=>p.cases||[]);
if(RAW.length!==50)throw new Error(`process-data deep-dive expected 50 cases, got ${RAW.length}`);
const DEFS=RAW.map(r=>({id:r[0],title:r[1],kind:r[2],sourceIds:r[3],signals:Object.fromEntries(r[4].map(s=>[s[0],s.slice(1)])),fault:r[5],diagnosis:r[6],next:r[7]}));
if(new Set(DEFS.map(d=>d.id)).size!==50)throw new Error('process-data deep-dive case IDs must be unique');
function rng(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function noise(r,scale){return(r()-0.5)*2*scale}
function generate(def,index){const r=rng(70000+index*211),rows=[];for(const [phase,p] of [['baseline',0],['fault',1],['recovery',2]])for(let cycle=1;cycle<=24;cycle++){const row={phase,cycle};for(const [key,v] of Object.entries(def.signals)){const base=+v[0],delta=+v[1],recovery=+v[2],target=p===0?base:p===1?base+delta:recovery,spread=Math.max(Math.abs(delta)*0.045,Math.abs(base)*0.0015,0.001);row[key]=+(target+noise(r,spread)).toFixed(4)}rows.push(row)}return{...def,synthetic:true,rows,phaseCounts:{baseline:24,fault:24,recovery:24},educationBoundary:'Synthetic training data only; relationships are illustrative and are not universal production setpoints, limits, maintenance thresholds or instructions.'}}
const DATASETS=DEFS.map(generate);
function csv(ds){const keys=['phase','cycle',...Object.keys(ds.signals)],lines=[keys.join(',')];for(const row of ds.rows)lines.push(keys.map(k=>row[k]).join(','));return lines.join('\n')+'\n'}
window.MM_PROCESS_DATA_DEEP_DIVE_50={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),datasets:DATASETS,byId:id=>DATASETS.find(d=>d.id===id)||null,toCsv:id=>{const d=DATASETS.find(x=>x.id===id);return d?csv(d):''},scope:'50 retained deterministic synthetic process-data cases; synthetic training only, outside formal assessment, not a production recipe; dataset records remain available without a user-facing Process Data screen.'};
})();
