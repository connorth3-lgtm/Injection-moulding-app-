/* MouldMaster process-atlas case evidence mapping — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
const STOP=new Set(['about','after','against','also','and','are','before','between','case','compare','during','evidence','for','from','into','next','not','only','process','same','that','the','then','this','through','to','using','verification','with']);
function toks(v){return (String(v||'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>x.length>=3&&!STOP.has(x))}
function hash(v){let h=2166136261;for(const c of String(v||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function sourceText(E,id){const s=E.sources?.[id]||{};return [id,s.name,s.authority,s.kind,s.topic,s.notes].filter(Boolean).join(' ')}
function score(text,E,id,caseId){const a=new Set(toks(text)),b=new Set(toks(sourceText(E,id))),hits=[...a].filter(x=>b.has(x));return{sourceId:id,score:hits.length*100+(hash(caseId+':'+id)%97)/100,matchTerms:hits.slice(0,8)}}
function choose(ids,text,E,caseId,exclude){return ids.filter(id=>id!==exclude).map(id=>score(text,E,id,caseId)).sort((a,b)=>b.score-a.score||a.sourceId.localeCompare(b.sourceId))[0]||null}
function run(attempt=0){const A=window.MM_PROCESS_DATA_20_PASS_ATLAS,E=window.MM_EVIDENCE_SOURCES;if(!A?.datasets||A.datasets.length!==200||!E?.sources){if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>run(attempt+1),25);return}window.MM_PROCESS_ATLAS_CASE_EVIDENCE={version:VERSION,status:'review-required',reason:'atlas/evidence registry was not ready'};return}
 const byId=new Map((A.cases||[]).map(x=>[x.id,x])),signatures=new Set(),mapped=[];
 for(const d of A.datasets){const candidates=[...(d.sourceIds||[])];if(candidates.length<2){window.MM_PROCESS_ATLAS_CASE_EVIDENCE={version:VERSION,status:'review-required',reason:`${d.id} has fewer than two reviewed pass sources`};return}
   const mechanism=choose(candidates,[d.title,d.domain,d.fault,d.diagnosis].join(' '),E,d.id,null);
   const method=choose(candidates,[d.next,d.verification,...Object.keys(d.signals||{})].join(' '),E,d.id,mechanism?.sourceId)||mechanism;
   const selected=[mechanism,method].filter(Boolean),ids=[...new Set(selected.map(x=>x.sourceId))];
   if(ids.length<2){const alt=candidates.slice().sort((a,b)=>(hash(d.id+':'+a)-hash(d.id+':'+b)))[0];if(alt&&!ids.includes(alt))ids.push(alt)}
   const records=ids.map((id,i)=>{const ranked=selected.find(x=>x.sourceId===id)||score([d.title,d.domain,d.fault,d.diagnosis,d.next,d.verification].join(' '),E,id,d.id);return{sourceId:id,role:i===0?'mechanism-context':'measurement-or-verification-method',matchTerms:ranked.matchTerms,selection:'case-token-ranked-from-reviewed-pass-sources'}});
   d.passSourceIds=candidates.slice();d.caseEvidence=records;d.sourceIds=ids;
   const pub=byId.get(d.id);if(pub){pub.passSourceIds=candidates.slice();pub.caseEvidence=records;pub.sourceIds=ids.slice()}
   signatures.add(ids.slice().sort().join('|'));mapped.push({id:d.id,pass:d.pass,sourceIds:ids,caseEvidence:records});
 }
 const status=mapped.length===200&&mapped.every(x=>x.sourceIds.length>=2)&&signatures.size>=20?'approved':'review-required';
 A.caseEvidenceVersion=VERSION;A.caseEvidence=mapped;A.caseEvidenceCount=mapped.length;A.caseEvidenceUniqueSignatures=signatures.size;A.scope=A.scope+' Evidence display is narrowed per case from the pass-reviewed source pool; token ranking is a traceable relevance aid, not a new scientific claim.';
 window.MM_PROCESS_ATLAS_CASE_EVIDENCE={version:VERSION,status,cases:mapped.length,uniqueSourceSignatures:signatures.size,passInheritedOnly:mapped.filter(x=>{const d=A.datasets.find(y=>y.id===x.id);return JSON.stringify((d?.passSourceIds||[]).slice().sort())===JSON.stringify(x.sourceIds.slice().sort())}).length,scope:'Each of the 200 atlas cases receives an explicit case-level source subset and role from its already reviewed pass-level source pool. No source is invented or promoted by token matching.'};
 if(status!=='approved')console.warn('[MouldMaster] case-level atlas evidence mapping requires review',window.MM_PROCESS_ATLAS_CASE_EVIDENCE)}
run();
})();
