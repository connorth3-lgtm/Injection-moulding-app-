/* MouldMaster site-local process statistics — 2026.09.04.2 */
(function(root,factory){
'use strict';
const api=factory(root||null);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root&&!root.MM_PROCESS_STATISTICS)root.MM_PROCESS_STATISTICS=Object.freeze({...api,version:'2026.09.04.2'});
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(root){
'use strict';
const VERSION='2026.09.04.2';
const BOUNDARY='Descriptive site-local statistical evidence only. Missingness, run rules, autocorrelation, approximate confidence intervals, effect sizes, stratification and variance decomposition are attention aids; they are not specification limits, validated process windows, causal proof, machine safety limits or automatic production-change authority.';
const DIMENSIONS=Object.freeze({
 machine:['machine','machine_id'],
 mould:['mould','mold','tool','tool_id'],
 material:['material_grade','resin_grade','material'],
 job:['job','work_order','job_id']
});
function present(v){return v!==''&&v!=null&&!(typeof v==='string'&&!v.trim())}
function number(v){if(!present(v))return null;const n=Number(v);return Number.isFinite(n)?n:null}
function finite(values){return(values||[]).map(number).filter(v=>v!==null)}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function variance(a,m=mean(a)){if(a.length<2||m==null)return null;return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function sd(a){const v=variance(a);return v==null?null:Math.sqrt(v)}
function summary(values,totalRows=null){
 const source=values||[],a=finite(source),explicitRows=number(totalRows),rows=explicitRows!==null?explicitRows:source.length,m=mean(a),s=sd(a);
 return{n:a.length,rows,missing:Math.max(0,rows-a.length),missingRate:rows?Math.max(0,rows-a.length)/rows:null,mean:m,sd:s,min:a.length?Math.min(...a):null,max:a.length?Math.max(...a):null};
}
function lag1Autocorrelation(values){
 const raw=(values||[]).map(number),pairs=[];
 for(let i=1;i<raw.length;i++)if(raw[i-1]!==null&&raw[i]!==null)pairs.push([raw[i-1],raw[i]]);
 if(pairs.length<3)return{nPairs:pairs.length,r:null,strength:'insufficient',warning:'At least three consecutive numeric pairs are required; missing values break lag pairs.'};
 const x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]),mx=mean(x),my=mean(y);let num=0,dx=0,dy=0;
 for(let i=0;i<x.length;i++){const vx=x[i]-mx,vy=y[i]-my;num+=vx*vy;dx+=vx*vx;dy+=vy*vy}
 const den=Math.sqrt(dx*dy),r=den>0?num/den:null,abs=Math.abs(Number(r));
 return{nPairs:pairs.length,r:Number.isFinite(r)?r:null,strength:!Number.isFinite(r)?'undefined':abs>=.5?'strong':abs>=.3?'moderate':'low',warning:Number.isFinite(r)&&abs>=.3?'Consecutive valid cycles are correlated; independent-sample confidence approximations may be optimistic.':null};
}
function contiguousSegments(values){
 const out=[],raw=(values||[]).map(number);let seg=[];
 for(let i=0;i<raw.length;i++){
  if(raw[i]===null){if(seg.length)out.push(seg);seg=[];continue}
  seg.push({index:i,value:raw[i]});
 }
 if(seg.length)out.push(seg);return out;
}
function sideBeyond(v,c,multiple,s){return v>c+multiple*s?1:v<c-multiple*s?-1:0}
function spcRunRules(values,centre=null,sigma=null){
 const numeric=finite(values),suppliedCentre=number(centre),suppliedSigma=number(sigma),c=suppliedCentre!==null?suppliedCentre:mean(numeric),s=suppliedSigma!==null&&suppliedSigma>0?suppliedSigma:sd(numeric),events=[];
 if(numeric.length<2||!Number.isFinite(c)||!Number.isFinite(s)||s<=0)return{n:numeric.length,centre:c,sigma:s,events,flags:[],missingBreaks:(values||[]).length-numeric.length,boundary:'Insufficient variation/sample for run-rule screening. '+BOUNDARY};
 const push=(rule,a,b,side,detail)=>events.push({rule,startIndex:a,endIndex:b,side,detail});
 for(const seg of contiguousSegments(values)){
  const a=seg.map(x=>x.value),idx=j=>seg[j].index;
  for(let i=0;i<a.length;i++)if(Math.abs(a[i]-c)>3*s)push('1-beyond-3sigma',idx(i),idx(i),a[i]>c?'high':'low','One point lies more than 3 local standard deviations from the reference centre.');
  for(let i=0;i<=a.length-3;i++){const w=a.slice(i,i+3),hi=w.filter(v=>sideBeyond(v,c,2,s)===1).length,lo=w.filter(v=>sideBeyond(v,c,2,s)===-1).length;if(hi>=2||lo>=2)push('2-of-3-beyond-2sigma',idx(i),idx(i+2),hi>=2?'high':'low','Two of three consecutive valid points are beyond 2 local standard deviations on the same side.');}
  for(let i=0;i<=a.length-5;i++){const w=a.slice(i,i+5),hi=w.filter(v=>sideBeyond(v,c,1,s)===1).length,lo=w.filter(v=>sideBeyond(v,c,1,s)===-1).length;if(hi>=4||lo>=4)push('4-of-5-beyond-1sigma',idx(i),idx(i+4),hi>=4?'high':'low','Four of five consecutive valid points are beyond 1 local standard deviation on the same side.');}
  for(let i=0;i<=a.length-8;i++){const w=a.slice(i,i+8),hi=w.every(v=>v>c),lo=w.every(v=>v<c);if(hi||lo)push('8-same-side',idx(i),idx(i+7),hi?'high':'low','Eight consecutive valid points lie on the same side of the reference centre.');}
  for(let i=0;i<=a.length-6;i++){const w=a.slice(i,i+6),up=w.every((v,j)=>j===0||v>w[j-1]),down=w.every((v,j)=>j===0||v<w[j-1]);if(up||down)push('6-trend',idx(i),idx(i+5),up?'increasing':'decreasing','Six consecutive valid points move monotonically in one direction.');}
  for(let i=0;i<=a.length-14;i++){const w=a.slice(i,i+14),alternating=w.slice(2).every((v,j)=>{const p=w[j+1]-w[j],q=v-w[j+1];return p!==0&&q!==0&&p*q<0});if(alternating)push('14-alternating',idx(i),idx(i+13),'alternating','Fourteen consecutive valid points alternate direction; investigate cyclic or over-control patterns before interpreting independence.');}
 }
 const unique=[...new Map(events.map(x=>[`${x.rule}:${x.startIndex}:${x.endIndex}`,x])).values()];
 return{n:numeric.length,centre:c,sigma:s,events:unique,flags:[...new Set(unique.map(x=>x.rule))],missingBreaks:(values||[]).length-numeric.length,boundary:BOUNDARY};
}
function meanDifference(before,after){
 const a=finite(before),b=finite(after),ma=mean(a),mb=mean(b),sa=sd(a),sb=sd(b);
 if(!a.length||!b.length)return{nBefore:a.length,nAfter:b.length,meanBefore:ma,meanAfter:mb,difference:null,ci95:null,effectSize:null,boundary:BOUNDARY};
 const difference=mb-ma,se=Math.sqrt((Number(sa)||0)**2/Math.max(1,a.length)+(Number(sb)||0)**2/Math.max(1,b.length)),ci95=Number.isFinite(se)?[difference-1.96*se,difference+1.96*se]:null;
 const pooledDen=a.length+b.length-2,pooled=pooledDen>0?Math.sqrt(((a.length-1)*(Number(sa)||0)**2+(b.length-1)*(Number(sb)||0)**2)/pooledDen):null,effectSize=Number.isFinite(pooled)&&pooled>0?difference/pooled:null;
 return{nBefore:a.length,nAfter:b.length,meanBefore:ma,meanAfter:mb,difference,ci95,effectSize,boundary:'Approximate 95% normal mean-difference interval and standardized mean difference. Serial correlation, non-stationarity, unequal sampling and small samples can invalidate the approximation. '+BOUNDARY};
}
function dimensionKey(rows,candidates){return candidates.find(k=>(rows||[]).some(r=>present(r?.[k])))||null}
function stratify(rows,channel){
 const out={};for(const [dimension,candidates] of Object.entries(DIMENSIONS)){
  const key=dimensionKey(rows,candidates);if(!key)continue;const groups=new Map();let unlabelledRows=0;
  for(const row of rows||[]){const label=String(row?.[key]??'').trim();if(!label){unlabelledRows++;continue}if(!groups.has(label))groups.set(label,[]);groups.get(label).push(row?.[channel])}
  const summaries=[...groups].map(([label,values])=>({label,...summary(values,values.length)})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  if(summaries.length>1)out[dimension]={sourceColumn:key,groupCount:summaries.length,unlabelledRows,groups:summaries.slice(0,12),warning:`${summaries.length} ${dimension} strata are mixed; compare within like-for-like strata before attributing an overall shift.`};
 }return out;
}
function cavityVariance(rows,channel){
 const key=dimensionKey(rows,['cavity','cavity_id']);if(!key)return{available:false,reason:'No retained cavity identifier',boundary:BOUNDARY};const groups=new Map();
 for(const row of rows||[]){const c=String(row?.[key]??'').trim(),v=number(row?.[channel]);if(!c||v===null)continue;if(!groups.has(c))groups.set(c,[]);groups.get(c).push(v)}
 const usable=[...groups].filter(([,a])=>a.length>=2);if(usable.length<2)return{available:false,reason:'At least two cavities with two numeric observations each are required',boundary:BOUNDARY};
 const all=usable.flatMap(([,a])=>a),grand=mean(all),k=usable.length,N=all.length;let withinSS=0,betweenSS=0;
 const cavities=usable.map(([c,a])=>{const m=mean(a),s=sd(a);withinSS+=a.reduce((sum,v)=>sum+(v-m)*(v-m),0);betweenSS+=a.length*(m-grand)*(m-grand);return{cavity:c,n:a.length,mean:m,sd:s}});
 const withinVariance=N>k?withinSS/(N-k):null,betweenVariance=k>1?betweenSS/(k-1):null,betweenToWithinRatio=Number.isFinite(withinVariance)&&withinVariance>0&&Number.isFinite(betweenVariance)?betweenVariance/withinVariance:null;
 return{available:true,sourceColumn:key,cavityCount:k,n:N,grandMean:grand,withinVariance,betweenVariance,betweenToWithinRatio,cavities,boundary:'Between/within cavity variance decomposition is descriptive and does not substitute for a validated random-effects model, gauge study or cavity-specific control plan. '+BOUNDARY};
}
function semanticStatus(channel,options={}){
 const registry=options.signalRegistry||root?.MM_SIGNAL_REGISTRY||null;if(!registry?.resolve)return{status:'review-required',canonicalId:null,reason:'Canonical signal registry is unavailable; statistics are not engineering-ready evidence.'};
 return registry.resolve(channel,{unit:options.unit??null,role:options.role??null,confirmed:options.confirmed===true});
}
function channelDiagnostics(rows,channel,options={}){
 const values=(rows||[]).map(r=>r?.[channel]),s=summary(values,(rows||[]).length),semantics=semanticStatus(channel,options.semantic||options),acf=lag1Autocorrelation(values),spc=spcRunRules(values,options.centre,options.sigma),strata=stratify(rows,channel),cavity=cavityVariance(rows,channel);
 return{channel,semantics,engineeringEvidenceReady:semantics.status==='resolved',summary:s,lag1Autocorrelation:acf,spc,stratification:strata,cavityVariance:cavity,boundary:BOUNDARY};
}
function windowDiagnostics(rows,channel,splitIndex,windowSize=20,options={}){
 const source=rows||[],i=Math.max(1,Math.min(source.length-1,Number(splitIndex)||Math.floor(source.length/2))),n=Math.max(3,Math.min(500,Number(windowSize)||20)),beforeRows=source.slice(Math.max(0,i-n),i),afterRows=source.slice(i,Math.min(source.length,i+n)),bs=summary(beforeRows.map(r=>r?.[channel]),beforeRows.length);
 return{...meanDifference(beforeRows.map(r=>r?.[channel]),afterRows.map(r=>r?.[channel])),before:channelDiagnostics(beforeRows,channel,options),after:channelDiagnostics(afterRows,channel,{...options,centre:bs.mean,sigma:bs.sd}),sampleBalance:beforeRows.length&&afterRows.length?Math.min(beforeRows.length,afterRows.length)/Math.max(beforeRows.length,afterRows.length):null,boundary:BOUNDARY};
}
return Object.freeze({version:VERSION,boundary:BOUNDARY,present,summary,lag1Autocorrelation,spcRunRules,meanDifference,stratify,cavityVariance,semanticStatus,channelDiagnostics,windowDiagnostics});
});
