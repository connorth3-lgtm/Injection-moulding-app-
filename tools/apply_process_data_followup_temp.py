#!/usr/bin/env python3
"""Temporary branch-only helper for deep-audit process-data remediations.

This file is removed after the generated patch passes its full validation gate.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def one(path: str, old: str, new: str, label: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# #281 — never invent epsilon spread for underpowered/constant references.
one(
    "data-integration-runtime.js",
    "function variance(a,m=mean(a)){if(a.length<2||m==null)return 0;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}\n"
    "function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}\n"
    "function stats(values){\n"
    "  const a=values.map(num).filter(v=>v!==null).sort((x,y)=>x-y),m=mean(a),sd=Math.sqrt(variance(a,m));\n"
    "  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};\n"
    "}\n"
    "function roleToKind(role){",
    "function variance(a,m=mean(a)){if(a.length<2||m==null)return null;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}\n"
    "function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?sorted[l]:sorted[l]+(sorted[h]-sorted[l])*(p-l)}\n"
    "function stats(values){\n"
    "  const a=values.map(num).filter(v=>v!==null).sort((x,y)=>x-y),m=mean(a),v=variance(a,m),sd=v==null?null:Math.sqrt(v);\n"
    "  return {n:a.length,min:a[0]??null,q1:quantile(a,.25),median:quantile(a,.5),q3:quantile(a,.75),max:a[a.length-1]??null,mean:m,sd};\n"
    "}\n"
    "function referenceScale(summary){\n"
    "  if(!summary||Number(summary.n)<2)return null;\n"
    "  const s=num(summary.sd),q1=num(summary.q1),q3=num(summary.q3);\n"
    "  const robust=q1!==null&&q3!==null?Math.abs(q3-q1)/1.349:null;\n"
    "  const candidates=[s,robust].filter(v=>Number.isFinite(v)&&v>0);\n"
    "  return candidates.length?Math.max(...candidates):null;\n"
    "}\n"
    "function roleToKind(role){",
    "runtime reference-spread semantics",
)
one(
    "data-integration-runtime.js",
    "  for(const [key,b] of Object.entries(baseline.summary||{})){\n"
    "    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;\n"
    "    const scale=Math.max(Math.abs(Number(b.sd)||0),Math.abs(Number(b.q3)-Number(b.q1))/1.349,1e-9);\n"
    "    const normalizedShift=Math.abs(c.mean-b.mean)/scale;\n"
    "    const variabilityRatio=(Number(b.sd)||0)>0?(Number(c.sd)||0)/(Number(b.sd)||0):null;\n"
    "    const level=normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';\n"
    "    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,normalizedShift,variabilityRatio,level});\n"
    "  }\n"
    "  return {datasetId,baselineId,signals:signals.sort((a,b)=>b.normalizedShift-a.normalizedShift),boundary:'Drift scores compare this site-local dataset with its selected baseline. They are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};\n"
    "}\n"
    "function compareWindows(rows,semantics,splitIndex,windowSize=20){\n"
    "  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));\n"
    "  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];\n"
    "  for(const key of Object.keys(a)){if(!b[key]||a[key].mean==null||b[key].mean==null)continue;const scale=Math.max(a[key].sd||0,Math.abs((a[key].q3||0)-(a[key].q1||0))/1.349,1e-9);changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,normalizedChange:Math.abs(b[key].mean-a[key].mean)/scale})}\n"
    "  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort((x,y)=>y.normalizedChange-x.normalizedChange),boundary:'Before/after comparison supports controlled-test evidence. Association with an intervention does not by itself prove causality.'};\n"
    "}",
    "  for(const [key,b] of Object.entries(baseline.summary||{})){\n"
    "    const c=cur[key];if(!c||c.mean==null||b.mean==null)continue;\n"
    "    const scale=referenceScale(b),normalizedShift=scale==null?null:Math.abs(c.mean-b.mean)/scale;\n"
    "    const baselineSd=num(b.sd),currentSd=num(c.sd);\n"
    "    const variabilityRatio=baselineSd!==null&&baselineSd>0&&currentSd!==null?currentSd/baselineSd:null;\n"
    "    const level=normalizedShift==null?'insufficient':normalizedShift>=3?'high':normalizedShift>=2?'review':'stable';\n"
    "    signals.push({channel:key,meaning:b.meaning||key,unit:b.unit||'',baselineMean:b.mean,currentMean:c.mean,normalizedShift,variabilityRatio,level,reason:normalizedShift==null?'Reference requires at least two finite observations and positive estimated spread.':null});\n"
    "  }\n"
    "  return {datasetId,baselineId,signals:signals.sort((a,b)=>(b.normalizedShift??-Infinity)-(a.normalizedShift??-Infinity)),boundary:'Drift scores compare this site-local dataset with its selected baseline. Channels without at least two finite reference observations and positive estimated spread remain explicitly unscored. Scores are evidence-attention heuristics, not automatic root-cause diagnoses or production control limits.'};\n"
    "}\n"
    "function compareWindows(rows,semantics,splitIndex,windowSize=20){\n"
    "  const i=Math.max(1,Math.min(rows.length-1,Number(splitIndex)||Math.floor(rows.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));\n"
    "  const before=rows.slice(Math.max(0,i-n),i),after=rows.slice(i,Math.min(rows.length,i+n)),a=summarizeRows(before,semantics),b=summarizeRows(after,semantics),changes=[];\n"
    "  for(const key of Object.keys(a)){\n"
    "    if(!b[key]||a[key].mean==null||b[key].mean==null)continue;\n"
    "    const enough=Number(a[key].n)>=2&&Number(b[key].n)>=2,scale=enough?referenceScale(a[key]):null;\n"
    "    changes.push({channel:key,meaning:a[key].meaning||key,unit:a[key].unit||'',beforeMean:a[key].mean,afterMean:b[key].mean,normalizedChange:scale==null?null:Math.abs(b[key].mean-a[key].mean)/scale,status:scale==null?'insufficient':'scored',reason:scale==null?'Both windows require at least two finite observations and the reference window requires positive estimated spread.':null});\n"
    "  }\n"
    "  return {splitIndex:i,beforeRows:before.length,afterRows:after.length,changes:changes.sort((x,y)=>(y.normalizedChange??-Infinity)-(x.normalizedChange??-Infinity)),boundary:'Before/after comparison supports controlled-test evidence. Underpowered or zero-spread channels remain explicitly unscored. Association with an intervention does not by itself prove causality.'};\n"
    "}",
    "runtime drift/window fail-closed scoring",
)
one(
    "data-integration-runtime.js",
    "intelligence:{createBaseline,compareToBaseline,baselineCompatibility,contextCompatibility,assertBaselineCompatible,compareWindows,summarizeRows}",
    "intelligence:{createBaseline,compareToBaseline,baselineCompatibility,contextCompatibility,assertBaselineCompatible,compareWindows,summarizeRows,referenceScale}",
    "expose referenceScale for regression QA",
)

# #283 — secondary intelligence UI must use the same missing-value semantics.
one(
    "process-data-intelligence-ui.js",
    "function fmt(v,d=3){return Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}\n"
    "function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\n"
    "function sd(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}",
    "function finite(v){if(v==null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}\n"
    "function fmt(v,d=3){const n=finite(v);return n==null?'—':n.toLocaleString(undefined,{maximumFractionDigits:d})}\n"
    "function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}\n"
    "function sd(a){if(a.length<2)return null;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}",
    "process-intelligence blank-safe numeric helper",
)
one(
    "process-data-intelligence-ui.js",
    "    const values={};for(const s of channels){const a=rs.map(r=>Number(r[s.column])).filter(Number.isFinite);values[s.column]=mean(a)}",
    "    const values={};for(const s of channels){const a=rs.map(r=>finite(r[s.column])).filter(v=>v!==null);values[s.column]=mean(a)}",
    "cavity missing-value handling",
)
one(
    "process-data-intelligence-ui.js",
    "    const good=labelled.filter(x=>x.y===1).map(x=>Number(x.r[s.column])).filter(Number.isFinite);\n"
    "    const bad=labelled.filter(x=>x.y===0).map(x=>Number(x.r[s.column])).filter(Number.isFinite);\n"
    "    if(good.length<3||bad.length<3)continue;\n"
    "    const pooled=Math.max(Math.sqrt((sd(good)**2+sd(bad)**2)/2),1e-9);\n"
    "    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference:Math.abs(mean(good)-mean(bad))/pooled});\n"
    "  }\n"
    "  return out.sort((a,b)=>b.standardizedDifference-a.standardizedDifference).slice(0,10)",
    "    const good=labelled.filter(x=>x.y===1).map(x=>finite(x.r[s.column])).filter(v=>v!==null);\n"
    "    const bad=labelled.filter(x=>x.y===0).map(x=>finite(x.r[s.column])).filter(v=>v!==null);\n"
    "    if(good.length<3||bad.length<3)continue;\n"
    "    const gs=sd(good),bs=sd(bad),pooled=gs==null||bs==null?null:Math.sqrt((gs*gs+bs*bs)/2);\n"
    "    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference:pooled>0?Math.abs(mean(good)-mean(bad))/pooled:null,status:pooled>0?'scored':'insufficient-spread'});\n"
    "  }\n"
    "  return out.sort((a,b)=>(b.standardizedDifference??-Infinity)-(a.standardizedDifference??-Infinity)).slice(0,10)",
    "quality-association spread handling",
)
one(
    "process-data-intelligence-ui.js",
    "  const candidates=resolvedNumeric(dataset).filter(s=>/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||'')));\n"
    "  if(!candidates.length)return null;\n"
    "  const s=candidates[0],vals=rows.map(r=>Number(r[s.column])).filter(Number.isFinite);if(!vals.length)return null;\n"
    "  let total=vals.reduce((a,b)=>a+b,0),unit=s.unit;\n"
    "  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}\n"
    "  const q=rows.map(r=>qualityLabel(r.quality_result)).filter(x=>x!=null),good=q.filter(x=>x===1).length;\n"
    "  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyPerGoodPart:unit==='kWh'&&good?total/good:null,sourceUnit:s.unit}",
    "  const candidates=resolvedNumeric(dataset).filter(s=>/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||''))&&String(s.sampling_basis||s.samplingBasis||'').trim().toLowerCase()==='per-cycle');\n"
    "  if(!candidates.length)return null;\n"
    "  const s=candidates[0],energyValues=rows.map(r=>finite(r[s.column])),vals=energyValues.filter(v=>v!==null);if(!vals.length)return null;\n"
    "  let total=vals.reduce((a,b)=>a+b,0),unit=s.unit;\n"
    "  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}\n"
    "  const labels=rows.map(r=>qualityLabel(r.quality_result)),q=labels.filter(x=>x!=null),good=q.filter(x=>x===1).length;\n"
    "  const coverageComplete=rows.length>0&&vals.length===rows.length&&q.length===rows.length;\n"
    "  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyRows:vals.length,qualityRows:q.length,totalRows:rows.length,coverageComplete,energyPerGoodPart:unit==='kWh'&&good&&coverageComplete?total/good:null,sourceUnit:s.unit,samplingBasis:s.sampling_basis||s.samplingBasis||''}",
    "energy sampling and aligned coverage",
)
one(
    "process-data-intelligence-ui.js",
    "<span>${fmt(x.normalizedShift,2)}σ · ${esc(x.level)}</span>",
    "<span>${x.normalizedShift==null?'Unscored · insufficient spread/sample':`${fmt(x.normalizedShift,2)}σ · ${esc(x.level)}`}</span>",
    "drift unscored rendering",
)
one(
    "process-data-intelligence-ui.js",
    "<span>${fmt(x.normalizedChange,2)}σ</span>",
    "<span>${x.normalizedChange==null?'Unscored · insufficient spread/sample':`${fmt(x.normalizedChange,2)}σ`}</span>",
    "before-after unscored rendering",
)
one(
    "process-data-intelligence-ui.js",
    "<span>${fmt(q.standardizedDifference,2)}σ separation</span>",
    "<span>${q.standardizedDifference==null?'Unscored · zero spread':`${fmt(q.standardizedDifference,2)}σ separation`}</span>",
    "quality unscored rendering",
)
one(
    "process-data-intelligence-ui.js",
    "<div class=\"pi-kpi\"><b>${fmt(energy.totalKwh,4)}</b><small>kWh in dataset</small></div>",
    "<div class=\"pi-kpi\"><b>${fmt(energy.totalKwh,4)}</b><small>observed kWh in dataset</small></div>",
    "energy total coverage label",
)
one(
    "process-data-intelligence-ui.js",
    "<div class=\"pi-kpi\"><b>${esc(energy.channel)}</b><small>energy channel</small></div></div>`:'<div class=\"di-empty\">No resolved energy channel with an engineering energy unit (kWh, Wh, J, kJ or MJ) was found.</div>'}</section></div>`;",
    "<div class=\"pi-kpi\"><b>${esc(energy.channel)}</b><small>energy channel</small></div></div><p class=\"muted\">Coverage: energy ${energy.energyRows}/${energy.totalRows} rows · quality ${energy.qualityRows}/${energy.totalRows} rows. kWh/good part is withheld unless the energy channel is confirmed per-cycle and both energy and quality coverage are complete.</p>`:'<div class=\"di-empty\">No resolved per-cycle energy channel with an engineering energy unit (kWh, Wh, J, kJ or MJ) was found.</div>'}</section></div>`;",
    "energy coverage disclosure",
)

# #284 — reject ambiguous CSV structure before semantic/numeric preparation.
one(
    "process-data-local-intake.js",
    "function parseCsv(text){\n"
    "  const rows=[];let row=[],field='',quoted=false;\n"
    "  const s=String(text||'').replace(/^\\uFEFF/,'');\n"
    "  for(let i=0;i<s.length;i++){\n"
    "    const ch=s[i];\n"
    "    if(quoted){if(ch==='\"'&&s[i+1]==='\"'){field+='\"';i++}else if(ch==='\"')quoted=false;else field+=ch;continue}\n"
    "    if(ch==='\"'){quoted=true;continue}\n"
    "    if(ch===','){row.push(field);field='';continue}\n"
    "    if(ch==='\\n'){row.push(field);rows.push(row);enforceRowLimit(rows);row=[];field='';continue}\n"
    "    if(ch==='\\r')continue;\n"
    "    field+=ch;\n"
    "  }\n"
    "  if(field.length||row.length){row.push(field);rows.push(row);enforceRowLimit(rows)}\n"
    "  while(rows.length&&rows[rows.length-1].every(x=>String(x).trim()===''))rows.pop();\n"
    "  if(rows.length<2)return {headers:rows[0]?.map(cleanHeader)||[],rows:[],sourceRows:0,truncated:false};\n"
    "  const headers=rows[0].map(cleanHeader);\n"
    "  const seen={};for(let i=0;i<headers.length;i++){const base=headers[i];seen[base]=(seen[base]||0)+1;if(seen[base]>1)headers[i]=`${base}_${seen[base]}`}\n"
    "  const dataRows=rows.slice(1);\n"
    "  if(dataRows.length>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`);\n"
    "  return {headers,rows:dataRows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()]))),sourceRows:dataRows.length,truncated:false}\n"
    "}",
    "function parseCsv(text){\n"
    "  const rows=[],rowLines=[];let row=[],field='',quoted=false,line=1,rowStartLine=1;\n"
    "  const s=String(text||'').replace(/^\\uFEFF/,'');\n"
    "  for(let i=0;i<s.length;i++){\n"
    "    const ch=s[i];\n"
    "    if(quoted){\n"
    "      if(ch==='\"'&&s[i+1]==='\"'){field+='\"';i++;continue}\n"
    "      if(ch==='\"'){quoted=false;continue}\n"
    "      if(ch==='\\n')line++;\n"
    "      field+=ch;continue\n"
    "    }\n"
    "    if(ch==='\"'){if(field.length)throw new Error(`CSV has an unexpected quote on source line ${line}.`);quoted=true;continue}\n"
    "    if(ch===','){row.push(field);field='';continue}\n"
    "    if(ch==='\\n'){row.push(field);rows.push(row);rowLines.push(rowStartLine);enforceRowLimit(rows);row=[];field='';line++;rowStartLine=line;continue}\n"
    "    if(ch==='\\r')continue;\n"
    "    field+=ch;\n"
    "  }\n"
    "  if(quoted)throw new Error(`CSV has an unterminated quoted field starting on source line ${rowStartLine}.`);\n"
    "  if(field.length||row.length){row.push(field);rows.push(row);rowLines.push(rowStartLine);enforceRowLimit(rows)}\n"
    "  while(rows.length&&rows[rows.length-1].every(x=>String(x).trim()==='')){rows.pop();rowLines.pop()}\n"
    "  if(rows.length<2)return {headers:rows[0]?.map(cleanHeader)||[],rows:[],sourceRows:0,truncated:false};\n"
    "  const headers=rows[0].map(cleanHeader);\n"
    "  const seen={};for(let i=0;i<headers.length;i++){const base=headers[i];seen[base]=(seen[base]||0)+1;if(seen[base]>1)headers[i]=`${base}_${seen[base]}`}\n"
    "  const records=rows.slice(1).map((cells,i)=>({cells,line:rowLines[i+1]??i+2})).filter(x=>!x.cells.every(v=>String(v).trim()===''));\n"
    "  for(const record of records)if(record.cells.length!==headers.length)throw new Error(`CSV source line ${record.line} has ${record.cells.length} cells; expected ${headers.length}.`);\n"
    "  const dataRows=records.map(x=>x.cells);\n"
    "  if(dataRows.length>MAX_ROWS)throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} data-row safety limit. No truncated subset was prepared; split or filter the controlled source export and try again.`);\n"
    "  return {headers,rows:dataRows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??'').trim()]))),sourceRows:dataRows.length,truncated:false}\n"
    "}",
    "CSV structural validation",
)

# Executable behavior regression for all three findings.
qa = r''' 'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadRuntime(){
  const source=fs.readFileSync('data-integration-runtime.js','utf8').replace("install().catch(err=>{console.error('MouldMaster connected process-data runtime failed to initialise',err)});",'');
  const sandbox={window:{},console};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'data-integration-runtime.js'});
  return sandbox.window.MM_CONNECTED_PROCESS_DATA;
}
const api=loadRuntime();
assert.equal(api.intelligence.referenceScale({n:1,sd:null,q1:5,q3:5}),null,'single-observation reference must be unscored');
assert.equal(api.intelligence.referenceScale({n:4,sd:0,q1:5,q3:5}),null,'zero-spread reference must be unscored');
assert(api.intelligence.referenceScale({n:3,sd:1,q1:1.5,q3:2.5})>0,'positive-spread reference must remain scoreable');
const sem={x:{column:'x',kind:'direct-measurement',role:'actual',blockers:[],unit:'mm',meaning:'X',canonical_quantity:'x'}};
let result=api.intelligence.compareWindows([{x:1},{x:2}],sem,1,20);
assert.equal(result.changes[0].normalizedChange,null,'one-point windows must remain unscored');
assert.equal(result.changes[0].status,'insufficient');
result=api.intelligence.compareWindows([{x:1},{x:1},{x:1},{x:2},{x:2},{x:2}],sem,3,20);
assert.equal(result.changes[0].normalizedChange,null,'constant reference window must not use epsilon normalization');
result=api.intelligence.compareWindows([{x:1},{x:2},{x:3},{x:2},{x:3},{x:4}],sem,3,20);
assert(Number.isFinite(result.changes[0].normalizedChange)&&result.changes[0].normalizedChange>0,'positive-spread windows must remain scoreable');

function extractFunction(source,name){
  const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`missing function ${name}`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape){escape=false;continue}if(ch==='\\'){escape=true;continue}if(ch===quote)quote=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated function ${name}`);
}
const ui=fs.readFileSync('process-data-intelligence-ui.js','utf8');
const names=['finite','fmt','mean','sd','qualityLabel','resolvedNumeric','cavitySummary','qualityAssociations','energySummary'];
const helpers=new Function(`const PASS=new Set(['pass','ok','good','accept','accepted','yes','true','1']);const FAIL=new Set(['fail','ng','bad','reject','rejected','no','false','0']);${names.map(n=>extractFunction(ui,n)).join('\n')}return {${names.join(',')}};`)();
assert.equal(helpers.finite(''),null,'UI blank must remain missing');
assert.equal(helpers.finite('0'),0,'UI string zero must remain numeric');
assert.equal(helpers.fmt(''),'—','UI blank display must not become zero');
const metricDataset={semantics:{metric:{column:'metric',role:'actual',blockers:[],unit:'mm',meaning:'Metric',sampling_basis:'per-cycle'}}};
const cavities=helpers.cavitySummary([{cavity:'A',metric:''},{cavity:'A',metric:'0'},{cavity:'B',metric:null},{cavity:'B',metric:'10'}],metricDataset);
assert.equal(cavities.find(x=>x.cavity==='A').values.metric,0,'genuine zero must survive cavity summary');
assert.equal(cavities.find(x=>x.cavity==='B').values.metric,10,'blank/null must not depress cavity mean');
const constantRows=[1,1,1,1,1,2,2,2,2,2].map((v,i)=>({quality_result:i<5?'pass':'fail',metric:String(v)}));
const constant=helpers.qualityAssociations(constantRows,metricDataset);
assert.equal(constant[0].standardizedDifference,null,'zero-spread quality groups must remain unscored');
assert.equal(constant[0].status,'insufficient-spread');
const variableRows=[1,2,3,4,5,6,7,8,9,10].map((v,i)=>({quality_result:i<5?'pass':'fail',metric:String(v)}));
assert(Number.isFinite(helpers.qualityAssociations(variableRows,metricDataset)[0].standardizedDifference),'positive-spread quality groups must remain scoreable');
const energyDataset={semantics:{energy:{column:'cycle_energy_wh',role:'actual',blockers:[],unit:'Wh',meaning:'Cycle energy',sampling_basis:'per-cycle'}}};
let energy=helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'',quality_result:'pass'},{cycle_energy_wh:'200',quality_result:'fail'}],energyDataset);
assert.equal(energy.totalKwh,0.3,'blank energy must not be converted to zero');
assert.equal(energy.coverageComplete,false,'missing energy must make coverage incomplete');
assert.equal(energy.energyPerGoodPart,null,'energy/good part must be withheld on incomplete coverage');
energy=helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'100',quality_result:'pass'},{cycle_energy_wh:'200',quality_result:'fail'}],energyDataset);
assert.equal(energy.coverageComplete,true);
assert.equal(energy.energyPerGoodPart,0.2,'complete per-cycle coverage should preserve valid energy/good-part calculation');
const eventEnergy={semantics:{energy:{column:'cycle_energy_wh',role:'actual',blockers:[],unit:'Wh',meaning:'Energy meter',sampling_basis:'event'}}};
assert.equal(helpers.energySummary([{cycle_energy_wh:'100',quality_result:'pass'}],eventEnergy),null,'non-per-cycle energy must not be treated as cycle energy');

global.window={MM_PROCESS_DATA_DIAGNOSTICS:{open(){}}};
global.document={getElementById(){return null},createElement(){return {}},body:{appendChild(){}},head:{appendChild(){}}};
global.requestAnimationFrame=f=>f();
vm.runInThisContext(fs.readFileSync('process-data-local-intake.js','utf8'),{filename:'process-data-local-intake.js'});
const intake=window.MM_PROCESS_DATA_LOCAL_INTAKE;
assert.equal(intake.parseCsv('a,b\n"x,y",2\n').rows[0].a,'x,y','quoted comma must parse');
assert.equal(intake.parseCsv('a,b\n"x""y",2\n').rows[0].a,'x"y','escaped quote must parse');
assert.equal(intake.parseCsv('a,b\n"x\ny",2\n').rows[0].a,'x\ny','quoted newline must parse');
assert.throws(()=>intake.parseCsv('a,b\n"x,2\n'),/unterminated quoted field/i,'unterminated quote must fail closed');
assert.throws(()=>intake.parseCsv('a,b\n1,2,3\n'),/3 cells; expected 2/i,'extra cells must fail closed');
assert.throws(()=>intake.parseCsv('a,b\n1\n'),/1 cells; expected 2/i,'missing cells must fail closed');
console.log('Process-data follow-up regression passed: underpowered statistics, UI numeric/energy semantics, and CSV structure fail closed.');
'''
(ROOT / 'qa_process_data_followup.cjs').write_text(qa.lstrip(), encoding='utf-8')

# Make path-scoped connected-data CI own the new code and behavior test.
wf = ROOT / '.github/workflows/data-integration-qa.yml'
text = wf.read_text(encoding='utf-8')
for old, new, label in [
    ("      - 'process-data-intelligence-ui.js'\n", "      - 'process-data-intelligence-ui.js'\n      - 'process-data-local-intake.js'\n", 'intake workflow path'),
    ("      - 'qa_data_integration_statistics.cjs'\n", "      - 'qa_data_integration_statistics.cjs'\n      - 'qa_process_data_followup.cjs'\n", 'follow-up QA workflow path'),
    ("          node --check qa_data_integration_statistics.cjs\n", "          node --check qa_data_integration_statistics.cjs\n          node --check qa_process_data_followup.cjs\n          node --check process-data-local-intake.js\n", 'follow-up syntax checks'),
    ("      - name: Process-data integrity regressions\n        run: node qa_process_data_integrity.cjs\n", "      - name: Process-data integrity regressions\n        run: node qa_process_data_integrity.cjs\n      - name: Process-data follow-up regressions\n        run: node qa_process_data_followup.cjs\n", 'follow-up behavior step'),
]:
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected one match, found {text.count(old)}')
    text = text.replace(old, new, 1)
wf.write_text(text, encoding='utf-8')

print('Applied deterministic process-data follow-up patch for issues #281, #283 and #284.')
