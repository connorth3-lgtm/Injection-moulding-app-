/* MouldMaster 20-pass process-data atlas — 200 normalized synthetic evidence cases */
(function(){
'use strict';
const VERSION='2026.11.08.1';
const REVIEWED='2026-08-26';
const REVIEW_BY='2026-11-26';
const E=window.MM_EVIDENCE_SOURCES;
const PASSES=window.MM_PROCESS_DATA_20_PASS_PACKS||[];
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

function csv(ds){const keys=['phase','cycle',...Object.keys(ds.signals)],lines=[keys.join(',')];for(const row of ds.rows)lines.push(keys.map(k=>row[k]).join(','));return lines.join('\n')+'\n'}
function passes(){return PASSES.slice().sort((a,b)=>a.pass-b.pass)}
window.MM_PROCESS_DATA_20_PASS_ATLAS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,passes:passes().map(p=>({pass:p.pass,id:p.id,title:p.title,domain:p.domain,purpose:p.purpose,sourceIds:p.sourceIds,count:p.cases.length})),cases:DATASETS.map(d=>({id:d.id,title:d.title,pass:d.pass,passTitle:d.passTitle,domain:d.domain,signals:Object.keys(d.signals),sourceIds:d.sourceIds,fault:d.fault,diagnosis:d.diagnosis,next:d.next,verification:d.verification,compensationTrap:d.compensationTrap,origin:'20-pass atlas'})),datasets:DATASETS,byId:id=>DATASETS.find(d=>d.id===id)||null,toCsv:id=>{const d=DATASETS.find(x=>x.id===id);return d?csv(d):''},scope:'200 retained deterministic normalized synthetic process-data cases across 20 deep-dive passes; synthetic training only, outside formal assessment, not a production recipe or universal setpoints; dataset records remain available without a user-facing Process Data screen.'};
})();
