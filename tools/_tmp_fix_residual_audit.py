#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_RELEASE = "2026.09.15.3"
NEW_RELEASE = "2026.09.15.4"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one occurrence, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))


def replace_all_exact(path: str, old: str, new: str, minimum: int = 1) -> None:
    text = read(path)
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f"{path}: expected at least {minimum} occurrences of {old}, found {count}")
    write(path, text.replace(old, new))


# ---- Connected process-data statistics: blanks are missing; undefined scales remain unscored. ----
replace_once(
    "data-integration-runtime.js",
    "/* MouldMaster connected process-data runtime — 2026.09.11.1 */",
    "/* MouldMaster connected process-data runtime — 2026.09.15.4 */",
)
replace_once(
    "data-integration-runtime.js",
    "const VERSION='2026.09.11.1';",
    "const VERSION='2026.09.15.4';",
)
replace_once(
    "data-integration-runtime.js",
    "function num(v){const n=Number(v);return Number.isFinite(n)?n:null}\nfunction mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\nfunction variance(a,m=mean(a)){if(a.length<2||m==null)return 0;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}\nfunction quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}\nfunction stats(values){\n  const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y),m=mean(a),sd=Math.sqrt(variance(a,m));\n  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};\n}",
    "function num(v){if(v==null)return null;if(typeof v==='string'&&!v.trim())return null;const n=Number(v);return Number.isFinite(n)?n:null}\nfunction mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\nfunction variance(a,m=mean(a)){if(a.length<2||m==null)return 0;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}\nfunction quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}\nfunction stats(values){\n  const a=values.map(num).filter(x=>x!==null).sort((x,y)=>x-y),m=mean(a),sd=Math.sqrt(variance(a,m));\n  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};\n}\nfunction referenceScale(summary){\n  if(!summary||Number(summary.n)<2)return null;\n  const sdv=Math.abs(num(summary.sd)??0),q1=num(summary.q1),q3=num(summary.q3);\n  const robust=q1!==null&&q3!==null?Math.abs(q3-q1)/1.349:0,scale=Math.max(sdv,robust);\n  return Number.isFinite(scale)&&scale>0?scale:null;\n}\nfunction scoreSort(field){return (a,b)=>{const av=num(a?.[field]),bv=num(b?.[field]);if(av===null&&bv===null)return String(a.channel||'').localeCompare(String(b.channel||''));if(av===null)return 1;if(bv===null)return -1;return bv-av}}",
)
replace_once(
    "data-integration-runtime.js",
    "function format(n,d=3){return Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}",
    "function format(n,d=3){const v=num(n);return v===null?'—':v.toLocaleString(undefined,{maximumFractionDigits:d})}",
)
replace_once(
    "data-integration-runtime.js",
    "async function deleteDataset(id){\n  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');\n  const db=await openDb();\n  try{\n    const tx=db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite');\n    tx.objectStore('datasets').delete(datasetId);\n    const shots=tx.objectStore('shots').index('datasetId');\n    await deleteCursorMatches(shots.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n    await txDone(tx);return true;\n  }finally{db.close()}\n}",
    "async function countStore(db,storeName){return new Promise((resolve,reject)=>{const req=db.transaction(storeName,'readonly').objectStore(storeName).count();req.onsuccess=()=>resolve(Number(req.result)||0);req.onerror=()=>reject(req.error||new Error(`Could not count ${storeName}`))})}\nasync function deleteDataset(id){\n  const datasetId=String(id||'');if(!datasetId)throw new Error('Dataset id is required');\n  const db=await openDb();\n  try{\n    const tx=db.transaction(['datasets','shots','baselines','caseLinks','interventions'],'readwrite');\n    tx.objectStore('datasets').delete(datasetId);\n    const shots=tx.objectStore('shots').index('datasetId');\n    await deleteCursorMatches(shots.openCursor(IDBKeyRange.only(datasetId)),()=>true);\n    await deleteCursorMatches(tx.objectStore('baselines').openCursor(),row=>row?.datasetId===datasetId);\n    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n    await deleteCursorMatches(tx.objectStore('interventions').openCursor(),row=>row?.datasetId===datasetId);\n    await txDone(tx);return true;\n  }finally{db.close()}\n}\nasync function deleteAllProcessData(){\n  const stores=['datasets','shots','baselines','caseLinks','interventions'],db=await openDb();\n  try{const tx=db.transaction(stores,'readwrite');for(const store of stores)tx.objectStore(store).clear();await txDone(tx)}finally{db.close()}\n  const verifyDb=await openDb();\n  try{const counts={};for(const store of stores)counts[store]=await countStore(verifyDb,store);const remaining=Object.values(counts).reduce((a,b)=>a+b,0);if(remaining)throw new Error(`Process-data reset verification failed: ${JSON.stringify(counts)}`);return Object.freeze({verified:true,counts})}finally{verifyDb.close()}\n}",
)
replace_once(
    "data-integration-runtime.js",
    "  for(const [key,b] of Object.entries(baseline.summary||{})){\n    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;\n    const scale=Math.max(Math.abs(Number(b.sd)||0),Math.abs(Number(b.q3)-Number(b.q1))/1.349,1e-9);\n    const normalizedShift=Math.abs(c.mean-b.mean)/scale;\n    const variabilityRatio=(Number(b.sd)||0)>0?(Number(c.sd)||0)/(Number(b.sd)||0):null;\n    const level=normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';\n    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,normalizedShift,variabilityRatio,level});\n  }\n  return {datasetId,baselineId,signals:signals.sort((a,b)=>b.normalizedShift-a.normalizedShift),boundary:'Drift scores compare this site-local dataset with its selected baseline. They are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};",
    "  for(const [key,b] of Object.entries(baseline.summary||{})){\n    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;\n    const scale=referenceScale(b),normalizedShift=scale===null?null:Math.abs(c.mean-b.mean)/scale;\n    const variabilityRatio=num(b.sd)>0?(num(c.sd)??0)/num(b.sd):null;\n    const level=normalizedShift===null?'unscored':normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';\n    const scoreReason=Number(b.n)<2?'insufficient-reference-observations':scale===null?'zero-reference-spread':null;\n    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,baselineN:Number(b.n)||0,currentN:Number(c.n)||0,normalizedShift,variabilityRatio,level,scoreReason});\n  }\n  return {datasetId,baselineId,signals:signals.sort(scoreSort('normalizedShift')),boundary:'Drift scores compare this site-local dataset with its selected baseline. Channels with fewer than two reference observations or no positive reference spread remain explicitly unscored. Scored values are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};",
)
replace_once(
    "data-integration-runtime.js",
    "function compareWindows(rows,semantics,splitIndex,windowSize=20){\n  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));\n  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];\n  for(const key of Object.keys(a)){if(!b[key]||a[key].mean==null||b[key].mean==null)continue;const scale=Math.max(a[key].sd||0,Math.abs((a[key].q3||0)-(a[key].q1||0))/1.349,1e-9);changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,normalizedChange:Math.abs(b[key].mean-a[key].mean)/scale})}\n  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort((x,y)=>y.normalizedChange-x.normalizedChange),boundary:'Before/after comparison supports controlled-test evidence. Association with an intervention does not by itself prove causality.'};\n}",
    "function compareWindows(rows,semantics,splitIndex,windowSize=20){\n  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));\n  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];\n  for(const key of Object.keys(a)){\n    if(!b[key]||a[key].mean==null||b[key].mean==null)continue;\n    const beforeN=Number(a[key].n)||0,afterN=Number(b[key].n)||0,scale=beforeN>=2&&afterN>=2?referenceScale(a[key]):null;\n    const normalizedChange=scale===null?null:Math.abs(b[key].mean-a[key].mean)/scale;\n    const scoreReason=beforeN<2||afterN<2?'insufficient-window-observations':scale===null?'zero-before-spread':null;\n    changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,beforeN,afterN,normalizedChange,scoreReason});\n  }\n  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort(scoreSort('normalizedChange')),boundary:'Before/after comparison supports controlled-test evidence. Channels with fewer than two finite observations on either side or no positive before-window spread remain explicitly unscored. Association with an intervention does not by itself prove causality.'};\n}",
)
replace_once(
    "data-integration-runtime.js",
    "h.innerHTML=`<div data-di-library-root><div class=\"di-actions\" style=\"margin-bottom:12px\"><button class=\"ghost\" data-di-intake>← Process-data intake</button><button class=\"ghost\" data-di-back>Data diagnosis</button></div><div class=\"card di-hero\"><div class=\"eyebrow\">Local process-data store</div><h2>Dataset library</h2><p>Prepared datasets are stored in IndexedDB on this device. Analysis-blocked datasets remain preserved but cannot be used for baseline or drift calculations until semantics are resolved and re-saved.</p></div>",
    "h.innerHTML=`<div data-di-library-root><div class=\"di-actions\" style=\"margin-bottom:12px\"><button class=\"ghost\" data-di-intake>← Process-data intake</button><button class=\"ghost\" data-di-back>Data diagnosis</button><button class=\"danger\" data-di-delete-all>Delete all local process-data evidence</button></div><div class=\"card di-hero\"><div class=\"eyebrow\">Local process-data store</div><h2>Dataset library</h2><p>Prepared datasets are stored in IndexedDB on this device until you delete them here or clear this app/site data. Learner-profile reset does not silently delete engineering evidence. Analysis-blocked datasets remain preserved but cannot be used for baseline or drift calculations until semantics are resolved and re-saved.</p></div>",
)
replace_once(
    "data-integration-runtime.js",
    "  root.querySelectorAll('[data-di-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this local dataset, its shots, baselines, and linked troubleshooting references?'))return;await deleteDataset(b.dataset.diDelete);renderDatasetLibrary()}))",
    "  root.querySelectorAll('[data-di-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this local dataset, its shots, baselines, interventions, and linked troubleshooting references?'))return;await deleteDataset(b.dataset.diDelete);renderDatasetLibrary()}));\n  root.querySelector('[data-di-delete-all]')?.addEventListener('click',async()=>{if(!confirm('Delete ALL locally saved prepared process-data evidence on this device? This clears datasets, shots, baselines, interventions and case links, but does not reset learner progress.'))return;try{await deleteAllProcessData();window.toast?.('All local process-data evidence deleted and verified');renderDatasetLibrary()}catch(err){window.toast?.(`Process-data delete failed: ${err?.message||err}`)}})",
)
replace_once(
    "data-integration-runtime.js",
    "  storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset},\n  intelligence:{createBaseline,compareToBaseline,baselineCompatibility,contextCompatibility,assertBaselineCompatible,compareWindows,summarizeRows},",
    "  storage:{savePrepared,listDatasets,rowsForDataset,deleteDataset,deleteAllProcessData},\n  intelligence:{createBaseline,compareToBaseline,baselineCompatibility,contextCompatibility,assertBaselineCompatible,compareWindows,summarizeRows},\n  diagnostics:{num,stats,referenceScale},",
)

# ---- Process intelligence UI: no blank-to-zero, no epsilon scores, per-cycle/coverage-gated energy. ----
replace_once(
    "process-data-intelligence-ui.js",
    "/* MouldMaster local process intelligence UI — 2026.09.02.2 */",
    "/* MouldMaster local process intelligence UI — 2026.09.15.4 */",
)
replace_once(
    "process-data-intelligence-ui.js",
    "const VERSION='2026.09.02.2';",
    "const VERSION='2026.09.15.4';",
)
replace_once(
    "process-data-intelligence-ui.js",
    "function fmt(v,d=3){return Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}\nfunction mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\nfunction sd(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}",
    "function finiteNumber(v){if(v==null)return null;if(typeof v==='string'&&!v.trim())return null;const n=Number(v);return Number.isFinite(n)?n:null}\nfunction fmt(v,d=3){const n=finiteNumber(v);return n===null?'—':n.toLocaleString(undefined,{maximumFractionDigits:d})}\nfunction mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\nfunction sd(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}",
)
replace_once(
    "process-data-intelligence-ui.js",
    "    const values={};for(const s of channels){const a=rs.map(r=>Number(r[s.column])).filter(Number.isFinite);values[s.column]=mean(a)}",
    "    const values={};for(const s of channels){const a=rs.map(r=>finiteNumber(r[s.column])).filter(x=>x!==null);values[s.column]=mean(a)}",
)
replace_once(
    "process-data-intelligence-ui.js",
    "    const good=labelled.filter(x=>x.y===1).map(x=>Number(x.r[s.column])).filter(Number.isFinite);\n    const bad=labelled.filter(x=>x.y===0).map(x=>Number(x.r[s.column])).filter(Number.isFinite);\n    if(good.length<3||bad.length<3)continue;\n    const pooled=Math.max(Math.sqrt((sd(good)**2+sd(bad)**2)/2),1e-9);\n    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference:Math.abs(mean(good)-mean(bad))/pooled});\n  }\n  return out.sort((a,b)=>b.standardizedDifference-a.standardizedDifference).slice(0,10)",
    "    const good=labelled.filter(x=>x.y===1).map(x=>finiteNumber(x.r[s.column])).filter(x=>x!==null);\n    const bad=labelled.filter(x=>x.y===0).map(x=>finiteNumber(x.r[s.column])).filter(x=>x!==null);\n    if(good.length<3||bad.length<3)continue;\n    const pooled=Math.sqrt((sd(good)**2+sd(bad)**2)/2),standardizedDifference=pooled>0?Math.abs(mean(good)-mean(bad))/pooled:null;\n    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference,scoreStatus:standardizedDifference===null?'unscored-zero-spread':'scored'});\n  }\n  return out.sort((a,b)=>{if(a.standardizedDifference===null&&b.standardizedDifference===null)return String(a.channel).localeCompare(String(b.channel));if(a.standardizedDifference===null)return 1;if(b.standardizedDifference===null)return -1;return b.standardizedDifference-a.standardizedDifference}).slice(0,10)",
)
replace_once(
    "process-data-intelligence-ui.js",
    "function energySummary(rows,dataset){\n  const candidates=resolvedNumeric(dataset).filter(s=>/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||'')));\n  if(!candidates.length)return null;\n  const s=candidates[0],vals=rows.map(r=>Number(r[s.column])).filter(Number.isFinite);if(!vals.length)return null;\n  let total=vals.reduce((a,b)=>a+b,0),unit=s.unit;\n  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}\n  const q=rows.map(r=>qualityLabel(r.quality_result)).filter(x=>x!=null),good=q.filter(x=>x===1).length;\n  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyPerGoodPart:unit==='kWh'&&good?total/good:null,sourceUnit:s.unit}\n}",
    "function energySummary(rows,dataset){\n  const candidates=resolvedNumeric(dataset).filter(s=>s.sampling_basis==='per-cycle'&&/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||'')));\n  if(!candidates.length)return null;\n  const s=candidates[0],pairs=rows.map(r=>({energy:finiteNumber(r[s.column]),quality:qualityLabel(r.quality_result)})),energyRows=pairs.filter(x=>x.energy!==null),qualityRows=pairs.filter(x=>x.quality!==null);if(!energyRows.length)return null;\n  let total=energyRows.reduce((sum,x)=>sum+x.energy,0),unit=s.unit;\n  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}\n  const aligned=pairs.filter(x=>x.energy!==null&&x.quality!==null),good=aligned.filter(x=>x.quality===1).length,complete=rows.length>0&&energyRows.length===rows.length&&qualityRows.length===rows.length;\n  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyPerGoodPart:unit==='kWh'&&complete&&good?total/good:null,sourceUnit:s.unit,samplingBasis:s.sampling_basis,energyRows:energyRows.length,qualityRows:qualityRows.length,alignedRows:aligned.length,totalRows:rows.length,coverageComplete:complete,scoreStatus:complete?'aligned':'unscored-incomplete-coverage'}\n}",
)
replace_once(
    "process-data-intelligence-ui.js",
    "<span class=\"pi-${esc(x.level)}\">${fmt(x.normalizedShift,2)}σ · ${esc(x.level)}</span>",
    "<span class=\"pi-${esc(x.level)}\">${x.normalizedShift==null?`unscored · ${esc(x.scoreReason||'insufficient reference')}`:`${fmt(x.normalizedShift,2)}σ · ${esc(x.level)}`}</span>",
)
replace_once(
    "process-data-intelligence-ui.js",
    "<span>${fmt(x.normalizedChange,2)}σ</span>",
    "<span>${x.normalizedChange==null?`unscored · ${esc(x.scoreReason||'insufficient window')}`:`${fmt(x.normalizedChange,2)}σ`}</span>",
)
replace_once(
    "process-data-intelligence-ui.js",
    "<span>${fmt(q.standardizedDifference,2)}σ separation</span>",
    "<span>${q.standardizedDifference==null?'unscored · zero spread':`${fmt(q.standardizedDifference,2)}σ separation`}</span>",
)
replace_once(
    "process-data-intelligence-ui.js",
    "<section class=\"card di-panel\" style=\"margin-top:12px\"><h3>Energy per good part</h3>${energy?`<div class=\"pi-kpis\"><div class=\"pi-kpi\"><b>${fmt(energy.totalKwh,4)}</b><small>kWh in dataset</small></div><div class=\"pi-kpi\"><b>${energy.goodParts}</b><small>good labelled parts</small></div><div class=\"pi-kpi\"><b>${fmt(energy.energyPerGoodPart,6)}</b><small>kWh / good part</small></div><div class=\"pi-kpi\"><b>${esc(energy.channel)}</b><small>energy channel</small></div></div>`:'<div class=\"di-empty\">No resolved energy channel with an engineering energy unit (kWh, Wh, J, kJ or MJ) was found.</div>'}</section>",
    "<section class=\"card di-panel\" style=\"margin-top:12px\"><h3>Energy per good part</h3>${energy?`<div class=\"pi-kpis\"><div class=\"pi-kpi\"><b>${fmt(energy.totalKwh,4)}</b><small>observed kWh · ${energy.energyRows}/${energy.totalRows} rows</small></div><div class=\"pi-kpi\"><b>${energy.goodParts}</b><small>aligned good parts · ${energy.alignedRows}/${energy.totalRows}</small></div><div class=\"pi-kpi\"><b>${fmt(energy.energyPerGoodPart,6)}</b><small>${energy.coverageComplete?'kWh / good part':'ratio unavailable · incomplete aligned coverage'}</small></div><div class=\"pi-kpi\"><b>${esc(energy.channel)}</b><small>per-cycle energy channel</small></div></div>`:'<div class=\"di-empty\">No resolved <b>per-cycle</b> energy channel with an engineering energy unit (kWh, Wh, J, kJ or MJ) was found. Energy-per-good-part is not inferred from unknown, trace-sample, event or batch sampling.</div>'}</section>",
)
replace_once(
    "process-data-intelligence-ui.js",
    "window.MM_PROCESS_INTELLIGENCE_UI={version:VERSION,openAnalysis,scope:'Local statistical evidence UI for baseline drift, before/after interventions, cavity comparison, quality associations and energy-per-good-part. Connected intake keeps backward-compatible privacy transformation visibility without weakening semantic fail-closed gates. No machine control or universal process limits.'}",
    "window.MM_PROCESS_INTELLIGENCE_UI={version:VERSION,openAnalysis,diagnostics:{finiteNumber,cavitySummary,qualityAssociations,energySummary},scope:'Local statistical evidence UI for baseline drift, before/after interventions, cavity comparison, quality associations and energy-per-good-part. Missing values stay missing, zero-spread comparisons remain unscored, and energy-per-good-part requires explicit per-cycle semantics plus complete aligned energy/quality coverage. No machine control or universal process limits.'}",
)

# ---- Process-data integrity compatibility layer follows the canonical store deletion scope. ----
replace_once(
    "src/domains/process/process-data-integrity.js",
    "/* MouldMaster process-data integrity compatibility hardening — 2026.09.10.3 */",
    "/* MouldMaster process-data integrity compatibility hardening — 2026.09.15.4 */",
)
replace_once(
    "src/domains/process/process-data-integrity.js",
    "const VERSION='2026.09.10.3';",
    "const VERSION='2026.09.15.4';",
)
replace_once(
    "src/domains/process/process-data-integrity.js",
    "    const tx=db.transaction(['datasets','shots','baselines','caseLinks'],'readwrite');",
    "    const tx=db.transaction(['datasets','shots','baselines','caseLinks','interventions'],'readwrite');",
)
replace_once(
    "src/domains/process/process-data-integrity.js",
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n    await txDone(tx);",
    "    await deleteCursorMatches(tx.objectStore('caseLinks').openCursor(),row=>row?.datasetId===datasetId);\n    await deleteCursorMatches(tx.objectStore('interventions').openCursor(),row=>row?.datasetId===datasetId);\n    await txDone(tx);",
)
replace_once(
    "src/domains/process/process-data-integrity.js",
    "  api.storage.deleteDataset=deleteDatasetCascade;\n  api.__mmProcessDataIntegrity=VERSION;",
    "  api.storage.deleteDataset=deleteDatasetCascade;\n  if(typeof api.storage.deleteAllProcessData!=='function')throw new Error('Canonical process-data bulk delete is unavailable');\n  api.__mmProcessDataIntegrity=VERSION;",
)
replace_once(
    "src/domains/process/process-data-integrity.js",
    "if(!window.confirm?.('Delete this local dataset, its shots, baselines, and linked troubleshooting references?'))return;",
    "if(!window.confirm?.('Delete this local dataset, its shots, baselines, interventions, and linked troubleshooting references?'))return;",
)

# ---- Import identity hardening and truthful learner-reset scope. ----
replace_once(
    "training-qa-fix.js",
    "/* MouldMaster training data/assessment bridge — 2026.09.06.1 */",
    "/* MouldMaster training data/assessment bridge — 2026.09.15.4 */",
)
replace_once(
    "training-qa-fix.js",
    "const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED';",
    "const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED';\nconst LEARNER_ID_RE=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;\nfunction canonicalLearnerId(v){const s=String(v??'');if(!LEARNER_ID_RE.test(s))throw new Error('Invalid learner identifier');return s}",
)
replace_once(
    "training-qa-fix.js",
    "   for(const [id,u] of Object.entries(x.users).slice(0,500)){\n    const sid=String(id).slice(0,160),clean=normaliseImportedUser(u,id);\n    if(!sid||users[sid])throw new Error('Invalid or duplicate learner identifier');\n    clean.id=sid;",
    "   for(const [id,u] of Object.entries(x.users).slice(0,500)){\n    const sid=canonicalLearnerId(id),clean=normaliseImportedUser(u,sid);\n    if(users[sid])throw new Error('Invalid or duplicate learner identifier');\n    if(u?.id!=null&&canonicalLearnerId(u.id)!==sid)throw new Error('Learner identifier mismatch');\n    clean.id=sid;",
)
replace_once(
    "training-qa-fix.js",
    "   const active=String(x.activeUser).slice(0,160);",
    "   const active=canonicalLearnerId(x.activeUser);",
)
replace_once(
    "training-qa-fix.js",
    "const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){\n if(!confirm('Reset all local MouldMaster users and progress?'))return;",
    "function labelLearnerReset(){document.querySelectorAll?.('[data-mm-onclick=\"resetData()\"]').forEach?.(button=>{if(String(button.textContent||'').trim()==='Reset all local data')button.textContent='Reset learner data'})}\nconst baseRenderProfile=window.renderProfile;if(typeof baseRenderProfile==='function')window.renderProfile=function(){const result=baseRenderProfile.apply(this,arguments);labelLearnerReset();return result};\nconst baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){\n if(!confirm('Reset local MouldMaster learner profiles, progress, analytics and training extras? Saved process-data evidence is managed separately in Process Data.'))return;",
)
replace_once(
    "training-qa-fix.js",
    " window.toast?.('Data reset. Local assessment and Learning Insights analytics were cleared and verified.');\n};",
    " window.toast?.('Learner data reset. Local assessment and Learning Insights analytics were cleared and verified. Saved process-data evidence was not deleted.');\n labelLearnerReset();\n};\nlabelLearnerReset();",
)
replace_once(
    "training-qa-fix.js",
    "window.MM_TRAINING_DATA_BRIDGE={version:'2026.09.06.1',cleanupFailureCode:ANALYTICS_CLEANUP_CODE,clearAssessmentAnalyticsStores,clearLearningAnalyticsStores,clearAllAnalyticsStores,clearTrainingExtrasStores,cancelActiveExam};",
    "window.MM_TRAINING_DATA_BRIDGE={version:'2026.09.15.4',cleanupFailureCode:ANALYTICS_CLEANUP_CODE,canonicalLearnerId,clearAssessmentAnalyticsStores,clearLearningAnalyticsStores,clearAllAnalyticsStores,clearTrainingExtrasStores,cancelActiveExam};",
)

# ---- Privacy notice now distinguishes raw session files from explicitly saved prepared evidence. ----
replace_once(
    "privacy.html",
    "<h2>Local process-data files</h2><p>The Process Data area can prepare a CSV that you explicitly choose from a machine, cavity-sensing, quality or auxiliary system. The current intake module reads that selected file locally in the browser/desktop session and does not intentionally upload the raw file or save the raw file into MouldMaster learner storage. By default it removes timestamps and direct/person identifiers (including operator/person fields), aliases operational identifiers such as machine, mould, cavity, material and lot values within that preparation run, keeps suitable numeric evidence signals and only retains limited quality categories. Files above the 50,000-data-row safety limit are rejected rather than silently truncated. If a predominantly numeric retained column contains malformed nonblank values, those values are omitted from the prepared output and reported by column instead of being exported as <code>NaN</code>.</p><p>The prepared CSV and data-dictionary files are created only when you request an export, and you choose where to save or share them. This preparation is <b>pseudonymisation, not guaranteed anonymisation</b>: combinations such as rare tool/material/defect patterns or proprietary part and grade information may still be sensitive. Review prepared files before sharing them and follow your organisation's confidentiality, data-retention and data-governance requirements. MouldMaster's local preparation tool is not a substitute for the controlled source record held under your site's approved process.</p>",
    "<h2>Local process-data files</h2><p>The Process Data area can prepare a CSV that you explicitly choose from a machine, cavity-sensing, quality or auxiliary system. The current intake module reads that selected raw file locally in the browser/desktop session and does not intentionally upload or persist the raw source file. By default it removes timestamps and direct/person identifiers (including operator/person fields), aliases operational identifiers such as machine, mould, cavity, material and lot values within that preparation run, keeps suitable numeric evidence signals and only retains limited quality categories. Files above the 50,000-data-row safety limit are rejected rather than silently truncated. If a predominantly numeric retained column contains malformed nonblank values, those values are omitted from the prepared output and reported by column instead of being exported as <code>NaN</code>.</p><p>If you explicitly choose <b>Save ... dataset locally</b>, MouldMaster persists the prepared/pseudonymised dataset and related shot rows, baselines, case links and intervention records in the local IndexedDB database <code>mouldmaster-process-data-v1</code>. That prepared engineering evidence remains on this device until you delete the dataset, use <b>Delete all local process-data evidence</b>, or clear the app/site data. Learner-profile reset does not silently delete this separately managed engineering evidence. The process-data bulk-delete control clears and re-checks the datasets, shots, baselines, case links and interventions stores before reporting success.</p><p>The prepared CSV and data-dictionary files are created only when you request an export, and you choose where to save or share them. This preparation is <b>pseudonymisation, not guaranteed anonymisation</b>: combinations such as rare tool/material/defect patterns or proprietary part and grade information may still be sensitive. Review prepared files before sharing them and follow your organisation's confidentiality, data-retention and data-governance requirements. MouldMaster's local preparation tool is not a substitute for the controlled source record held under your site's approved process.</p>",
)
replace_once(
    "privacy.html",
    "A confirmed factory reset first removes and re-checks MouldMaster-owned assessment analytics, Learning insights analytics and training extras; only after that verified cleanup does it replace the learner registry with the clean default profile. If cleanup cannot be verified, factory reset is blocked and the current learner registry remains active rather than presenting the device as clean. If that warning persists before another learner uses the same browser/app profile, use the browser/OS site-data controls to clear the MouldMaster app data. Process-data intake is session-based; close or leave the preparation screen if you do not want the selected raw file retained in the current in-memory preparation state.",
    "A confirmed <b>Reset learner data</b> first removes and re-checks MouldMaster-owned assessment analytics, Learning insights analytics and training extras; only after that verified cleanup does it replace the learner registry with the clean default profile. It does not delete separately saved process-data evidence. If learner cleanup cannot be verified, learner reset is blocked and the current learner registry remains active rather than presenting the device as clean. The Process Data dataset library provides separate per-dataset deletion and a confirmed <b>Delete all local process-data evidence</b> operation. If a storage warning persists before another learner or engineering user uses the same browser/app profile, use the browser/OS site-data controls to clear the MouldMaster app data. Raw process-data intake is session-based; close or leave the preparation screen if you do not want the selected raw source file retained in the current in-memory preparation state.",
)

# ---- Behavioral QA for the corrected numerical and identity boundaries. ----
write(
    "qa_process_statistics_integrity.cjs",
    r'''const fs=require('fs'),vm=require('vm'),assert=require('assert');
function baseContext(){
  const noop=()=>{};
  const document={
    documentElement:{},body:{appendChild:noop},head:{appendChild:noop},
    getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,
    createElement:()=>({setAttribute:noop,appendChild:noop,remove:noop,style:{},dataset:{},addEventListener:noop})
  };
  const sandbox={console,document,window:null,MutationObserver:function(){this.observe=noop},requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},clearTimeout:noop,URL:{createObjectURL:()=>'',revokeObjectURL:noop},Blob:function(){},fetch:async()=>({ok:false,status:404}),crypto:{randomUUID:()=> 'test-id'},indexedDB:{},IDBKeyRange:{only:x=>x}};
  sandbox.window=sandbox;return vm.createContext(sandbox);
}
{
  const c=baseContext();vm.runInContext(fs.readFileSync('data-integration-runtime.js','utf8'),c);
  const api=c.MM_CONNECTED_PROCESS_DATA,diag=api.diagnostics;
  assert.strictEqual(diag.num(''),null);assert.strictEqual(diag.num('   '),null);assert.strictEqual(diag.num(null),null);assert.strictEqual(diag.num(undefined),null);
  assert.strictEqual(diag.num(0),0);assert.strictEqual(diag.num('0'),0);assert.strictEqual(diag.num('1.25'),1.25);
  const s=diag.stats(['',null,' ',0,'0',2]);assert.strictEqual(s.n,3);assert.strictEqual(s.mean,2/3);
  assert.strictEqual(diag.referenceScale({n:1,sd:1,q1:0,q3:1}),null);
  assert.strictEqual(diag.referenceScale({n:4,sd:0,q1:5,q3:5}),null);
  assert(diag.referenceScale({n:4,sd:2,q1:1,q3:3})>0);
  const semantics={x:{column:'x',kind:'direct-measurement',role:'actual',blockers:[],unit:'MPa',meaning:'pressure'}};
  let out=api.intelligence.compareWindows([{x:5},{x:5},{x:9},{x:9}],semantics,2,3);
  assert.strictEqual(out.changes[0].normalizedChange,null);assert.strictEqual(out.changes[0].scoreReason,'zero-before-spread');
  out=api.intelligence.compareWindows([{x:4},{x:6},{x:8},{x:10}],semantics,2,3);
  assert(Number.isFinite(out.changes[0].normalizedChange));
  out=api.intelligence.compareWindows([{x:''},{x:6},{x:8},{x:10}],semantics,2,3);
  assert.strictEqual(out.changes[0].normalizedChange,null);assert.strictEqual(out.changes[0].scoreReason,'insufficient-window-observations');
}
{
  const c=baseContext();c.MM_CONNECTED_PROCESS_DATA={};vm.runInContext(fs.readFileSync('process-data-intelligence-ui.js','utf8'),c);
  const d=c.MM_PROCESS_INTELLIGENCE_UI.diagnostics;
  assert.strictEqual(d.finiteNumber(''),null);assert.strictEqual(d.finiteNumber('   '),null);assert.strictEqual(d.finiteNumber(null),null);assert.strictEqual(d.finiteNumber(0),0);assert.strictEqual(d.finiteNumber('0'),0);
  const dataset={semantics:{p:{column:'p',role:'actual',blockers:[],meaning:'Pressure',unit:'MPa',sampling_basis:'per-cycle'},e:{column:'energy_kwh',role:'actual',blockers:[],meaning:'Cycle energy',unit:'kWh',sampling_basis:'per-cycle'},batch:{column:'batch_energy_kwh',role:'actual',blockers:[],meaning:'Batch energy',unit:'kWh',sampling_basis:'batch'}}};
  const cavities=d.cavitySummary([{cavity:'1',p:''},{cavity:'1',p:0},{cavity:'2',p:'2'},{cavity:'2',p:null}],dataset);assert.strictEqual(cavities[0].values.p,0);assert.strictEqual(cavities[1].values.p,2);
  const qa=d.qualityAssociations([
    ...[1,2,3].map(i=>({quality_result:'good',p:5})),...[1,2,3].map(i=>({quality_result:'bad',p:7})),
    ...[1,2,3,4].map(i=>({quality_result:'good',p:''})),...[1,2,3,4].map(i=>({quality_result:'bad',p:null}))
  ],dataset);assert.strictEqual(qa[0].standardizedDifference,null);assert.strictEqual(qa[0].scoreStatus,'unscored-zero-spread');
  let energy=d.energySummary([{energy_kwh:1,quality_result:'good'},{energy_kwh:2,quality_result:'bad'}],dataset);assert.strictEqual(energy.energyPerGoodPart,3);assert.strictEqual(energy.coverageComplete,true);
  energy=d.energySummary([{energy_kwh:1,quality_result:'good'},{energy_kwh:'',quality_result:'good'}],dataset);assert.strictEqual(energy.energyPerGoodPart,null);assert.strictEqual(energy.scoreStatus,'unscored-incomplete-coverage');
  const onlyBatch={semantics:{batch:{column:'batch_energy_kwh',role:'actual',blockers:[],meaning:'Batch energy',unit:'kWh',sampling_basis:'batch'}}};assert.strictEqual(d.energySummary([{batch_energy_kwh:3,quality_result:'good'}],onlyBatch),null);
}
console.log('Process statistics integrity QA passed: blanks stay missing, real zero survives, undefined spread stays unscored, windows require support, and energy-per-good-part requires per-cycle aligned coverage.');
''',
)

write(
    "qa_import_identity_integrity.cjs",
    r'''const fs=require('fs'),vm=require('vm'),assert=require('assert');
const memory=new Map();
const localStorage={get length(){return memory.size},key(i){return [...memory.keys()][i]??null},getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const sandbox={console,localStorage,confirm:()=>false,alert:()=>{},document:{querySelectorAll:()=>[]},window:null,db:{},user:{},defaultDB:{activeUser:'learner-1',users:{'learner-1':{id:'learner-1'}}},normaliseImportedUser:(u,id)=>({...u,id}),updateGlobalProgress(){},switchView(){},renderProfile(){},resetData(){},activeExam:null,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},FileReader:function(){}};
sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('training-qa-fix.js','utf8'),sandbox);
const fn=sandbox.MM_TRAINING_DATA_BRIDGE.canonicalLearnerId;
for(const good of ['learner-1','learner-1723456789012','learner-A','legacy.user:2','A_1'])assert.strictEqual(fn(good),good);
for(const bad of ['', ' learner-1','learner 1','learner\"x','learner<x','learner\nx','x/'.repeat(50)])assert.throws(()=>fn(bad));
const src=fs.readFileSync('training-qa-fix.js','utf8');
assert(src.includes('const sid=canonicalLearnerId(id)'));assert(src.includes('canonicalLearnerId(u.id)!==sid'));assert(src.includes('const active=canonicalLearnerId(x.activeUser)'));
assert(src.includes('Reset learner data'));assert(src.includes('Saved process-data evidence was not deleted'));
console.log('Import identity integrity QA passed: learner IDs use a canonical safe allowlist with no truncation collision, active IDs are checked, embedded IDs must match, and learner reset states its separate process-data boundary.');
''',
)

# Data-integration QA now locks the new correctness/privacy behaviors.
replace_once(
    "qa_data_integration.py",
    "        \"data-pdi-launch\",\n        \"current-data-manifest.json\",",
    "        \"data-pdi-launch\",\n        \"deleteAllProcessData\",\n        \"referenceScale\",\n        \"insufficient-reference-observations\",\n        \"zero-reference-spread\",\n        \"insufficient-window-observations\",\n        \"current-data-manifest.json\",",
)
replace_once(
    "qa_data_integration.py",
    "        \"['datasets','shots','baselines','caseLinks']\",",
    "        \"['datasets','shots','baselines','caseLinks','interventions']\",",
)
replace_once(
    "qa_data_integration.py",
    "        \"includes('blocked')\",\n    ]:",
    "        \"includes('blocked')\",\n        \"finiteNumber\",\n        \"unscored-zero-spread\",\n        \"sampling_basis==='per-cycle'\",\n        \"unscored-incomplete-coverage\",\n    ]:",
)
replace_once(
    "qa_data_integration.py",
    "    require(\"extract_service_worker_assets\" in builder, \"Pages builder must publish both atomic-core and runtime-fetched worker assets\")",
    "    require((ROOT / \"qa_process_statistics_integrity.cjs\").exists(), \"behavioral process-statistics regression test missing\")\n    require((ROOT / \"qa_import_identity_integrity.cjs\").exists(), \"behavioral import-identity regression test missing\")\n    require(\"extract_service_worker_assets\" in builder, \"Pages builder must publish both atomic-core and runtime-fetched worker assets\")",
)

# ---- Frozen recovery contract: independently hash the commit-pinned raw payload. ----
write(
    "tools/verify_frozen_recovery.py",
    r'''#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'latest.json').read_text(encoding='utf-8'))
url=str(manifest.get('app_url') or '')
match=re.fullmatch(r'https://raw\.githubusercontent\.com/connorth3-lgtm/Injection-moulding-app-/([0-9a-f]{40})/MouldMaster_Core_App\.html',url)
if not match: raise SystemExit('frozen recovery app_url must be raw.githubusercontent.com and pinned to an immutable 40-hex commit SHA')
expected=str(manifest.get('sha256') or '').lower()
if not re.fullmatch(r'[0-9a-f]{64}',expected): raise SystemExit('frozen recovery sha256 is invalid')
req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-Recovery-Contract/1'})
with urllib.request.urlopen(req,timeout=30) as response: payload=response.read()
actual=hashlib.sha256(payload).hexdigest()
if actual!=expected: raise SystemExit(f'frozen recovery hash mismatch: expected {expected}, got {actual}')
print(f'Frozen recovery contract passed: commit {match.group(1)} payload matches sha256:{actual}.')
''',
)
write(
    ".github/workflows/frozen-recovery-contract.yml",
    """name: Frozen Recovery Contract\n\non:\n  push:\n    branches: [main]\n    paths:\n      - 'latest.json'\n      - 'tools/verify_frozen_recovery.py'\n      - '.github/workflows/frozen-recovery-contract.yml'\n  pull_request:\n    paths:\n      - 'latest.json'\n      - 'tools/verify_frozen_recovery.py'\n      - '.github/workflows/frozen-recovery-contract.yml'\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  verify-frozen-recovery:\n    runs-on: ubuntu-24.04\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n      - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97\n        with:\n          python-version: '3.12'\n      - name: Download and hash immutable recovery payload\n        run: python tools/verify_frozen_recovery.py\n""",
)

# ---- Web release .4: runtime bytes changed, so all release-specific human evidence remains HOLD. ----
release_files = [
    "README.md","version.json","index.html","service-worker.js","pwa-shell.js","support.html",
    "qa_release.py","qa_release_docs.py","data/book-sme-review-v1.json",
    "src/domains/learning/book-data/book-sme-review-v1.json","data/learner-pilot-v1.json",
    "data/release-external-validation-v1.json",
]
for path in release_files:
    replace_all_exact(path, OLD_RELEASE, NEW_RELEASE)

for stem in ["BOOK_SME_REVIEW", "LEARNER_PILOT"]:
    src=f"qa/{stem}_{OLD_RELEASE}.md"
    dst=f"qa/{stem}_{NEW_RELEASE}.md"
    if (ROOT/dst).exists():
        raise SystemExit(f"{dst} already exists")
    write(dst, read(src).replace(OLD_RELEASE, NEW_RELEASE))

# Make sure the release-specific contracts remain fail-closed.
external=json.loads(read('data/release-external-validation-v1.json'))
assert external['release']==NEW_RELEASE
for key in ['accessibility','pwaPhysicalDevices','windowsDistribution','bookSme','curriculumSme','learnerOutcomes']:
    if external[key]['status']!='hold': raise SystemExit(f"external HOLD unexpectedly changed: {key}")
if external['productionUse']['status']!='advisory-only': raise SystemExit('production use boundary changed')
if any(external['claims'].values()): raise SystemExit('external claims were promoted')

print('Residual audit remediation staged for', NEW_RELEASE)
