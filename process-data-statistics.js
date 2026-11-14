/* MouldMaster local process-data statistics — data helpers only; learner screens retired. */
(function(){
'use strict';
const VERSION='2026.11.14.1';
const PASS=new Set(['pass','ok','good','accept','accepted','yes','true','1']);
const FAIL=new Set(['fail','ng','bad','reject','rejected','no','false','0']);
function finiteNumber(v){if(v==null)return null;if(typeof v==='string'&&!v.trim())return null;const n=Number(v);return Number.isFinite(n)?n:null}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function sd(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1))}
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
    const values={};for(const s of channels){const a=rs.map(r=>finiteNumber(r[s.column])).filter(x=>x!==null);values[s.column]=mean(a)}
    return {cavity:c,rows:rs.length,goodRate:q.length?mean(q):null,values}
  }).sort((a,b)=>String(a.cavity).localeCompare(String(b.cavity),undefined,{numeric:true}))
}
function qualityAssociations(rows,dataset){
  const labelled=rows.map(r=>({r,y:qualityLabel(r.quality_result)})).filter(x=>x.y!=null);if(labelled.length<10)return[];
  const out=[];for(const s of resolvedNumeric(dataset).filter(x=>x.role!=='quality')){
    const good=labelled.filter(x=>x.y===1).map(x=>finiteNumber(x.r[s.column])).filter(x=>x!==null);
    const bad=labelled.filter(x=>x.y===0).map(x=>finiteNumber(x.r[s.column])).filter(x=>x!==null);
    if(good.length<3||bad.length<3)continue;
    const pooled=Math.sqrt((sd(good)**2+sd(bad)**2)/2),standardizedDifference=pooled>0?Math.abs(mean(good)-mean(bad))/pooled:null;
    out.push({channel:s.column,meaning:s.meaning||s.column,unit:s.unit||'',goodMean:mean(good),badMean:mean(bad),standardizedDifference,scoreStatus:standardizedDifference===null?'unscored-zero-spread':'scored'});
  }
  return out.sort((a,b)=>{if(a.standardizedDifference===null&&b.standardizedDifference===null)return String(a.channel).localeCompare(String(b.channel));if(a.standardizedDifference===null)return 1;if(b.standardizedDifference===null)return -1;return b.standardizedDifference-a.standardizedDifference}).slice(0,10)
}
function energySummary(rows,dataset){
  const candidates=resolvedNumeric(dataset).filter(s=>s.sampling_basis==='per-cycle'&&/(energy|power.*energy|kwh|watt.?hour)/i.test(`${s.column} ${s.meaning||''}`)&&/^(?:kWh|Wh|J|kJ|MJ)$/i.test(String(s.unit||'')));
  if(!candidates.length)return null;
  const s=candidates[0],pairs=rows.map(r=>({energy:finiteNumber(r[s.column]),quality:qualityLabel(r.quality_result)})),energyRows=pairs.filter(x=>x.energy!==null),qualityRows=pairs.filter(x=>x.quality!==null);if(!energyRows.length)return null;
  let total=energyRows.reduce((sum,x)=>sum+x.energy,0),unit=s.unit;
  if(/^wh$/i.test(unit)){total/=1000;unit='kWh'}else if(/^j$/i.test(unit)){total/=3.6e6;unit='kWh'}else if(/^kj$/i.test(unit)){total/=3600;unit='kWh'}else if(/^mj$/i.test(unit)){total/=3.6;unit='kWh'}
  const aligned=pairs.filter(x=>x.energy!==null&&x.quality!==null),good=aligned.filter(x=>x.quality===1).length,complete=rows.length>0&&energyRows.length===rows.length&&qualityRows.length===rows.length;
  return {channel:s.column,totalKwh:unit==='kWh'?total:null,goodParts:good,energyPerGoodPart:unit==='kWh'&&complete&&good?total/good:null,sourceUnit:s.unit,samplingBasis:s.sampling_basis,energyRows:energyRows.length,qualityRows:qualityRows.length,alignedRows:aligned.length,totalRows:rows.length,coverageComplete:complete,scoreStatus:complete?'aligned':'unscored-incomplete-coverage'}
}

window.MM_PROCESS_DATA_STATISTICS=Object.freeze({version:VERSION,finiteNumber,cavitySummary,qualityAssociations,energySummary,interventionPoints,scope:'Local statistical helpers for retained process-evidence data; no user-facing Process Data screens or event handlers.'});
})();
