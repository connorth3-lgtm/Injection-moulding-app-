/* MouldMaster advanced process-statistics evidence layer — 2026.09.02.2 */
(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){
  if(!root.MM_PROCESS_STATISTICS_V2){
    root.MM_PROCESS_STATISTICS_V2=Object.freeze({...api,version:'2026.09.02.2'});
    api.install(root);
  }
}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const VERSION='2026.09.02.2';
const BOUNDARY='Descriptive site-local statistical evidence only. Run rules, autocorrelation, approximate confidence intervals and variance decompositions are attention aids; they are not specification limits, validated process windows, causal proof, machine safety limits or automatic production-change authority.';
const DIMENSIONS=Object.freeze({
  machine:['machine','machine_id'],
  mould:['mould','mold','tool'],
  material:['material_grade','resin_grade'],
  job:['job','work_order']
});
function present(v){return v!==''&&v!=null&&!(typeof v==='string'&&!v.trim())}
function finite(values){return(values||[]).filter(present).map(Number).filter(Number.isFinite)}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function variance(a,m=mean(a)){if(a.length<2||m==null)return null;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function sd(a){const v=variance(a);return v==null?null:Math.sqrt(v)}
function summary(values,totalRows=null){
  const a=finite(values),m=mean(a),s=sd(a),rows=Number.isFinite(Number(totalRows))?Number(totalRows):(values||[]).length;
  return{n:a.length,rows,missing:Math.max(0,rows-a.length),missingRate:rows?Math.max(0,rows-a.length)/rows:null,mean:m,sd:s,min:a.length?Math.min(...a):null,max:a.length?Math.max(...a):null}
}
function lag1Autocorrelation(values){
  const a=finite(values);if(a.length<4)return{n:a.length,r:null,strength:'insufficient',warning:null};
  const x=a.slice(0,-1),y=a.slice(1),mx=mean(x),my=mean(y);let num=0,dx=0,dy=0;
  for(let i=0;i<x.length;i++){const vx=x[i]-mx,vy=y[i]-my;num+=vx*vy;dx+=vx*vx;dy+=vy*vy}
  const den=Math.sqrt(dx*dy),r=den>0?num/den:null,abs=Math.abs(Number(r));
  return{n:a.length,r:Number.isFinite(r)?r:null,strength:!Number.isFinite(r)?'undefined':abs>=.5?'strong':abs>=.3?'moderate':'low',warning:Number.isFinite(r)&&abs>=.3?'Consecutive cycles are correlated; simple independent-sample confidence approximations may be optimistic.':null}
}
function sideBeyond(v,c,multiple,s){return v>c+multiple*s?1:v<c-multiple*s?-1:0}
function spcRunRules(values,centre=null,sigma=null){
  const a=finite(values),c=Number.isFinite(Number(centre))?Number(centre):mean(a),s=Number.isFinite(Number(sigma))&&Number(sigma)>0?Number(sigma):sd(a),events=[];
  if(a.length<2||!Number.isFinite(c)||!Number.isFinite(s)||s<=0)return{n:a.length,centre:c,sigma:s,events,flags:[],boundary:'Insufficient variation/sample for run-rule screening. '+BOUNDARY};
  const push=(rule,start,end,side,detail)=>events.push({rule,startIndex:start,endIndex:end,side,detail});
  for(let i=0;i<a.length;i++)if(Math.abs(a[i]-c)>3*s)push('1-beyond-3sigma',i,i,a[i]>c?'high':'low','One point lies more than 3 local standard deviations from the reference centre.');
  for(let i=0;i<=a.length-3;i++){
    const w=a.slice(i,i+3),hi=w.filter(v=>sideBeyond(v,c,2,s)===1).length,lo=w.filter(v=>sideBeyond(v,c,2,s)===-1).length;
    if(hi>=2||lo>=2)push('2-of-3-beyond-2sigma',i,i+2,hi>=2?'high':'low','Two of three consecutive points are beyond 2 local standard deviations on the same side.');
  }
  for(let i=0;i<=a.length-5;i++){
    const w=a.slice(i,i+5),hi=w.filter(v=>sideBeyond(v,c,1,s)===1).length,lo=w.filter(v=>sideBeyond(v,c,1,s)===-1).length;
    if(hi>=4||lo>=4)push('4-of-5-beyond-1sigma',i,i+4,hi>=4?'high':'low','Four of five consecutive points are beyond 1 local standard deviations on the same side.');
  }
  for(let i=0;i<=a.length-8;i++){
    const w=a.slice(i,i+8),hi=w.every(v=>v>c),lo=w.every(v=>v<c);if(hi||lo)push('8-same-side',i,i+7,hi?'high':'low','Eight consecutive points lie on the same side of the reference centre.');
  }
  for(let i=0;i<=a.length-6;i++){
    const w=a.slice(i,i+6),up=w.every((v,j)=>j===0||v>w[j-1]),down=w.every((v,j)=>j===0||v<w[j-1]);if(up||down)push('6-trend',i,i+5,up?'increasing':'decreasing','Six consecutive points move monotonically in one direction.');
  }
  for(let i=0;i<=a.length-14;i++){
    const w=a.slice(i,i+14);
    const alternating=w.slice(2).every((v,j)=>{
      const prevDirection=w[j+1]-w[j],currentDirection=v-w[j+1];
      return prevDirection!==0&&currentDirection!==0&&prevDirection*currentDirection<0;
    });
    if(alternating)push('14-alternating',i,i+13,'alternating','Fourteen consecutive points alternate direction; investigate cyclic or over-control patterns before interpreting independence.');
  }
  const unique=[...new Map(events.map(x=>[`${x.rule}:${x.startIndex}:${x.endIndex}`,x])).values()];
  return{n:a.length,centre:c,sigma:s,events:unique,flags:[...new Set(unique.map(x=>x.rule))],boundary:BOUNDARY}
}
function meanDifference(before,after){
  const a=finite(before),b=finite(after),ma=mean(a),mb=mean(b),sa=sd(a),sb=sd(b);
  if(!a.length||!b.length)return{nBefore:a.length,nAfter:b.length,meanBefore:ma,meanAfter:mb,difference:null,ci95:null,effectSize:null,boundary:BOUNDARY};
  const difference=mb-ma,se=Math.sqrt((Number(sa)||0)**2/Math.max(1,a.length)+(Number(sb)||0)**2/Math.max(1,b.length));
  const ci95=Number.isFinite(se)?[difference-1.96*se,difference+1.96*se]:null;
  const pooledDen=a.length+b.length-2,pooled=pooledDen>0?Math.sqrt(((a.length-1)*(Number(sa)||0)**2+(b.length-1)*(Number(sb)||0)**2)/pooledDen):null;
  const effectSize=Number.isFinite(pooled)&&pooled>0?difference/pooled:null;
  return{nBefore:a.length,nAfter:b.length,meanBefore:ma,meanAfter:mb,difference,ci95,effectSize,boundary:'Approximate 95% mean-difference interval and standardized mean difference; serial correlation/non-stationarity can invalidate independent-sample assumptions. '+BOUNDARY}
}
function dimensionKey(rows,candidates){return candidates.find(k=>(rows||[]).some(r=>present(r?.[k])))||null}
function stratify(rows,channel){
  const out={};
  for(const [dimension,candidates] of Object.entries(DIMENSIONS)){
    const key=dimensionKey(rows,candidates);if(!key)continue;
    const groups=new Map();let unlabelled=0;
    for(const row of rows||[]){const label=String(row?.[key]??'').trim();if(!label){unlabelled++;continue}if(!groups.has(label))groups.set(label,[]);groups.get(label).push(row?.[channel])}
    const summaries=[...groups].map(([label,values])=>({label,...summary(values,values.length)})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
    if(summaries.length>1)out[dimension]={sourceColumn:key,groupCount:summaries.length,unlabelledRows:unlabelled,groups:summaries.slice(0,12),warning:`${summaries.length} ${dimension} strata are mixed; compare within like-for-like strata before attributing an overall shift.`};
  }
  return out
}
function cavityVariance(rows,channel){
  const key=dimensionKey(rows,['cavity','cavity_id']);if(!key)return{available:false,reason:'No retained cavity identifier',boundary:BOUNDARY};
  const groups=new Map();
  for(const row of rows||[]){const c=String(row?.[key]??'').trim(),v=Number(row?.[channel]);if(!c||!Number.isFinite(v))continue;if(!groups.has(c))groups.set(c,[]);groups.get(c).push(v)}
  const usable=[...groups].filter(([,a])=>a.length>=2);if(usable.length<2)return{available:false,reason:'At least two cavities with two numeric observations each are required',boundary:BOUNDARY};
  const all=usable.flatMap(([,a])=>a),grand=mean(all),k=usable.length,N=all.length;let withinSS=0,betweenSS=0;
  const cavities=usable.map(([c,a])=>{const m=mean(a),s=sd(a);withinSS+=a.reduce((sum,v)=>sum+(v-m)*(v-m),0);betweenSS+=a.length*(m-grand)*(m-grand);return{cavity:c,n:a.length,mean:m,sd:s}});
  const withinVariance=N>k?withinSS/(N-k):null,betweenVariance=k>1?betweenSS/(k-1):null;
  const varianceRatio=Number.isFinite(withinVariance)&&withinVariance>0&&Number.isFinite(betweenVariance)?betweenVariance/withinVariance:null;
  return{available:true,sourceColumn:key,cavityCount:k,n:N,grandMean:grand,withinVariance,betweenVariance,betweenToWithinRatio:varianceRatio,cavities,boundary:'Between/within cavity variance decomposition is descriptive and does not substitute for a validated random-effects model, gauge study or cavity-specific control plan. '+BOUNDARY}
}
function channelDiagnostics(rows,channel,reference={}){
  const values=(rows||[]).map(r=>r?.[channel]),s=summary(values,(rows||[]).length),acf=lag1Autocorrelation(values),spc=spcRunRules(values,reference.centre,reference.sigma),strata=stratify(rows,channel),cavity=cavityVariance(rows,channel);
  return{channel,summary:s,lag1Autocorrelation:acf,spc,stratification:strata,cavityVariance:cavity,boundary:BOUNDARY}
}
function windowDiagnostics(rows,channel,splitIndex,windowSize=20){
  const source=rows||[],i=Math.max(1,Math.min(source.length-1,Number(splitIndex)||Math.floor(source.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20));
  const beforeRows=source.slice(Math.max(0,i-n),i),afterRows=source.slice(i,Math.min(source.length,i+n)),before=beforeRows.map(r=>r?.[channel]),after=afterRows.map(r=>r?.[channel]),bs=summary(before,beforeRows.length);
  return{...meanDifference(before,after),before:channelDiagnostics(beforeRows,channel),after:channelDiagnostics(afterRows,channel,{centre:bs.mean,sigma:bs.sd}),sampleBalance:beforeRows.length&&afterRows.length?Math.min(beforeRows.length,afterRows.length)/Math.max(beforeRows.length,afterRows.length):null,boundary:BOUNDARY}
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v,d=2){return Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—'}
function ci(ci95){return Array.isArray(ci95)&&ci95.length===2?`${fmt(ci95[0])} to ${fmt(ci95[1])}`:'—'}
function compactStrata(x){const names=Object.entries(x||{}).map(([k,v])=>`${k}: ${v.groupCount}`);return names.length?names.join(' · '):'none detected'}
function diagnosticRow(name,d){
  const acf=d?.lag1Autocorrelation,spc=d?.spc,cavity=d?.cavityVariance;
  return`<div class="mm-stat-v2-row"><div><b>${esc(name)}</b><small>n ${fmt(d?.summary?.n,0)} · missing ${Number.isFinite(d?.summary?.missingRate)?fmt(d.summary.missingRate*100,1)+'%':'—'}</small></div><span><small>Lag-1 r</small>${fmt(acf?.r)}${acf?.warning?'<em> correlated</em>':''}</span><span><small>SPC screens</small>${fmt(spc?.events?.length||0,0)}<em>${esc((spc?.flags||[]).slice(0,2).join(' · ')||'none')}</em></span><span><small>Strata</small>${esc(compactStrata(d?.stratification))}</span><span><small>Cavity B/W</small>${cavity?.available?fmt(cavity.betweenToWithinRatio):'—'}</span></div>`
}
function panelMarkup(kind,result){
  const rows=(kind==='drift'?result?.signals:result?.changes)||[],top=rows.slice(0,3);if(!top.length)return'';
  return`<section class="mm-stat-v2" data-mm-stat-v2="${esc(kind)}"><h4>Advanced statistical checks</h4><p>Serial correlation, run-rule screens, like-for-like strata and cavity variation for the strongest displayed signals.</p><div class="mm-stat-v2-grid">${top.map(x=>{const d=x.advancedStatistics;if(kind==='windows'&&d){return diagnosticRow(x.meaning||x.channel,d.after)+`<div class="mm-stat-v2-effect"><small>Before/after difference</small> ${fmt(d.difference)} · 95% approx CI ${esc(ci(d.ci95))} · standardized effect ${fmt(d.effectSize)} · sample balance ${Number.isFinite(d.sampleBalance)?fmt(d.sampleBalance*100,0)+'%':'—'}</div>`}return diagnosticRow(x.meaning||x.channel,d)}).join('')}</div><div class="mm-stat-v2-boundary">${esc(BOUNDARY)}</div></section>`
}
function ensureStyle(doc){
  if(doc.getElementById('mm-process-statistics-v2-style'))return;
  const s=doc.createElement('style');s.id='mm-process-statistics-v2-style';s.textContent='.mm-stat-v2{margin-top:10px;padding:11px;border:1px solid #3b5f78;border-radius:10px;background:#081622}.mm-stat-v2 h4{margin:0 0 5px}.mm-stat-v2>p,.mm-stat-v2-boundary{font-size:10px;color:#a8bdce;line-height:1.45}.mm-stat-v2-grid{display:grid;gap:6px}.mm-stat-v2-row{display:grid;grid-template-columns:minmax(150px,1.4fr) repeat(4,minmax(80px,1fr));gap:7px;padding:7px;border:1px solid #29465f;border-radius:8px;font-size:10px}.mm-stat-v2-row small{display:block;color:#8faabe}.mm-stat-v2-row em{display:block;font-style:normal;color:#e1ba6b}.mm-stat-v2-effect{padding:6px 8px;margin-top:-4px;border-left:2px solid #527e9d;font-size:10px;color:#bed0dc}.mm-stat-v2-effect small{color:#8faabe}@media(max-width:780px){.mm-stat-v2-row{grid-template-columns:1fr 1fr}.mm-stat-v2-row>div{grid-column:1/-1}}';doc.head.appendChild(s)
}
function decorate(root,latest){
  const doc=root.document;if(!doc)return;ensureStyle(doc);
  for(const [kind,selector] of [['drift','[data-pi-drift-result]'],['windows','[data-pi-change-result]']]){
    const host=doc.querySelector(selector),result=latest[kind];if(!host||!result)continue;
    host.querySelector('[data-mm-stat-v2]')?.remove();const wrap=doc.createElement('div');wrap.innerHTML=panelMarkup(kind,result);if(wrap.firstElementChild)host.appendChild(wrap.firstElementChild)
  }
}
function openDbGet(root,store,key){
  return new Promise(resolve=>{try{const req=root.indexedDB.open('mouldmaster-process-data-v1',1);req.onerror=()=>resolve(null);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains(store)){db.close();resolve(null);return}const tx=db.transaction(store,'readonly'),g=tx.objectStore(store).get(key);g.onsuccess=()=>{resolve(g.result||null);db.close()};g.onerror=()=>{resolve(null);db.close()}}}catch(_){resolve(null)}})
}
function install(root){
  let attempts=0;const latest={drift:null,windows:null};
  function schedule(){(root.requestAnimationFrame||((fn)=>setTimeout(fn,0)))(()=>decorate(root,latest))}
  function attach(){
    attempts++;const intel=root.MM_CONNECTED_PROCESS_DATA?.intelligence,storage=root.MM_CONNECTED_PROCESS_DATA?.storage;
    if(!intel||!storage||!intel.__mmEvidenceEnhanced){if(attempts<160)setTimeout(attach,50);return false}
    if(intel.__mmStatisticsV2)return true;
    const baseDrift=intel.compareToBaseline?.bind(intel),baseWindows=intel.compareWindows?.bind(intel);if(!baseDrift||!baseWindows)return false;
    intel.compareToBaseline=async function(datasetId,baselineId){
      const result=await baseDrift(datasetId,baselineId),currentRows=await storage.rowsForDataset(datasetId).catch(()=>[]),baseline=await openDbGet(root,'baselines',baselineId),baselineRows=baseline?.datasetId?await storage.rowsForDataset(baseline.datasetId).catch(()=>[]):[];
      for(const signal of result?.signals||[]){const baselineValues=baselineRows.map(r=>r?.[signal.channel]),bs=summary(baselineValues,baselineRows.length);signal.advancedStatistics=channelDiagnostics(currentRows,signal.channel,{centre:Number.isFinite(bs.mean)?bs.mean:signal.baselineMean,sigma:Number.isFinite(bs.sd)&&bs.sd>0?bs.sd:signal.baselineSd})}
      result.advancedStatistics={version:VERSION,boundary:BOUNDARY};latest.drift=result;schedule();return result
    };
    intel.compareWindows=function(rows,semantics,splitIndex,windowSize=20){
      const result=baseWindows(rows,semantics,splitIndex,windowSize);
      for(const change of result?.changes||[])change.advancedStatistics=windowDiagnostics(rows,change.channel,splitIndex,windowSize);
      result.advancedStatistics={version:VERSION,boundary:BOUNDARY};latest.windows=result;schedule();return result
    };
    intel.__mmStatisticsV2=true;root.MM_PROCESS_STATISTICS_V2_RUNTIME=Object.freeze({version:VERSION,installed:true,boundary:BOUNDARY});return true
  }
  const ready=root.MM_APP_INTEGRATION_READY;if(ready&&typeof ready.then==='function')ready.finally(attach);else if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  return{attach,latest}
}
return{BOUNDARY,summary,lag1Autocorrelation,spcRunRules,meanDifference,stratify,cavityVariance,channelDiagnostics,windowDiagnostics,panelMarkup,install};
});