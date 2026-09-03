/* MouldMaster explicit process-case evidence granularity — 2026.09.04.2 */
(function(){
'use strict';
if(window.MM_PROCESS_CASE_EVIDENCE)return;
const VERSION='2026.09.04.2';
const ATLAS_GRANULARITY='case-context-subset-from-pass-reviewed-pool';
const ATLAS_FALLBACK='explicit-pass-inherited';
const ATLAS_RELATIONSHIP='context-support-not-direct-validation';
const SELECTION='case-token-ranked-from-reviewed-pass-sources';
const STOP=new Set(['about','after','against','also','and','are','before','between','case','compare','during','evidence','for','from','into','next','not','only','process','same','that','the','then','this','through','to','using','verification','with']);
function fp(v){return window.MM_DATA_SPINE?.fingerprint(v)||''}
function toks(v){return (String(v||'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>x.length>=3&&!STOP.has(x))}
function hash(v){let h=2166136261;for(const c of String(v||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function sourceText(registry,id){const s=registry?.sources?.[id]||{};return [id,s.name,s.authority,s.kind,s.topic,s.notes].filter(Boolean).join(' ')}
function score(text,registry,id,caseId){const wanted=new Set(toks(text)),available=new Set(toks(sourceText(registry,id))),matchTerms=[...wanted].filter(x=>available.has(x));return{sourceId:id,score:matchTerms.length*100+(hash(`${caseId}:${id}`)%97)/100,matchTerms:matchTerms.slice(0,8)}}
function choose(ids,text,registry,caseId,exclude){return ids.filter(id=>id!==exclude).map(id=>score(text,registry,id,caseId)).sort((a,b)=>b.score-a.score||a.sourceId.localeCompare(b.sourceId))[0]||null}
function fallbackAtlas(ds,passSourceIds,reason){return{caseId:ds.id,sourceIds:passSourceIds.slice(),passSourceIds:passSourceIds.slice(),caseEvidence:[],granularity:ATLAS_FALLBACK,relationship:ATLAS_RELATIONSHIP,selection:'pass-reviewed-source-pool-fallback',fallbackReason:reason,pass:ds.pass,passId:ds.passId,fingerprint:fp([ds.id,ds.passId,passSourceIds,ATLAS_FALLBACK])}}
function atlasRecord(ds){
  const passSourceIds=(ds.sourceIds||[]).slice(),registry=window.MM_EVIDENCE_SOURCES;
  if(passSourceIds.length<2)return fallbackAtlas(ds,passSourceIds,'fewer-than-two-pass-sources');
  if(!registry?.sources)return fallbackAtlas(ds,passSourceIds,'evidence-registry-unavailable');
  if(passSourceIds.some(id=>!registry.sources[id]))return fallbackAtlas(ds,passSourceIds,'pass-source-missing-from-evidence-registry');
  const mechanism=choose(passSourceIds,[ds.title,ds.domain,ds.fault,ds.diagnosis].join(' '),registry,ds.id,null);
  const method=choose(passSourceIds,[ds.next,ds.verification,...Object.keys(ds.signals||{})].join(' '),registry,ds.id,mechanism?.sourceId);
  if(!mechanism||!method||mechanism.sourceId===method.sourceId)return fallbackAtlas(ds,passSourceIds,'could-not-select-two-distinct-context-sources');
  const selected=[mechanism,method],sourceIds=selected.map(x=>x.sourceId);
  const caseEvidence=selected.map((ranked,index)=>({sourceId:ranked.sourceId,role:index===0?'mechanism-context':'measurement-or-verification-method',matchTerms:ranked.matchTerms.slice(),selection:SELECTION}));
  return{caseId:ds.id,sourceIds,passSourceIds,caseEvidence,granularity:ATLAS_GRANULARITY,relationship:ATLAS_RELATIONSHIP,selection:SELECTION,pass:ds.pass,passId:ds.passId,fingerprint:fp([ds.id,ds.passId,passSourceIds,sourceIds,caseEvidence])};
}
function atlasDatasets(){
  const atlas=window.MM_PROCESS_DATA_20_PASS_ATLAS?.datasets;
  if(Array.isArray(atlas)&&atlas.length)return atlas;
  const out=[];
  for(const pack of window.MM_PROCESS_DATA_20_PASS_PACKS||[])for(const c of pack.cases||[])out.push({id:c[0],title:c[1],pass:pack.pass,passId:pack.id,domain:pack.domain,sourceIds:(pack.sourceIds||[]).slice(),signals:Object.fromEntries((c[2]||[]).map(x=>[x[0],x.slice(1)])),fault:c[3],diagnosis:c[4],next:c[5],verification:c[6]});
  return out;
}
function records(){
  const out=[];
  for(const ds of window.MM_PROCESS_EVIDENCE_DATASETS?.datasets||[])out.push({caseId:ds.id,sourceIds:(ds.sourceIds||[]).slice(),granularity:'case',relationship:'case-supported',fingerprint:fp([ds.id,ds.sourceIds])});
  for(const pack of window.MM_PROCESS_DATA_DEEP_DIVE_PACKS||[])for(const c of pack.cases||[])out.push({caseId:c[0],sourceIds:(c[3]||[]).slice(),granularity:'case',relationship:'case-supported',fingerprint:fp([c[0],c[3]])});
  for(const ds of atlasDatasets())out.push(atlasRecord(ds));
  return out;
}
function summary(){
  const r=records(),atlas=r.filter(x=>x.passId),signatures=new Set(atlas.filter(x=>x.granularity===ATLAS_GRANULARITY).map(x=>x.sourceIds.slice().sort().join('|')));
  return{version:VERSION,total:r.length,caseSupported:r.filter(x=>x.granularity==='case').length,atlasContextSubsets:atlas.filter(x=>x.granularity===ATLAS_GRANULARITY).length,explicitPassInherited:r.filter(x=>x.granularity===ATLAS_FALLBACK).length,uniqueAtlasSourceSignatures:signatures.size,directValidationClaimed:r.filter(x=>x.relationship==='direct-validation').length};
}
window.MM_PROCESS_CASE_EVIDENCE=Object.freeze({version:VERSION,records,summary,boundary:'Guided and deep-dive cases retain their authored case-support relationships. Atlas cases may receive a deterministic case-context source subset only from their already reviewed pass source pool; token ranking is a relevance aid, not a new scientific claim, source review, causal proof or direct case validation. If source semantics are unavailable, atlas evidence remains explicit pass-inherited context.'});
})();
