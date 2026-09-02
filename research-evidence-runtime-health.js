/* MouldMaster research evidence runtime health — 2026.09.02.6 */
(function(){
'use strict';
const VERSION='2026.09.02.6';
function check(){
 const e=window.MM_RESEARCH_EVIDENCE;
 const modules={ui:window.MM_RESEARCH_EVIDENCE_UI,adapter:window.MM_RESEARCH_ADAPTER,workspace:window.MM_RESEARCH_WORKSPACE,microlearning:window.MM_RESEARCH_MICROLEARNING,adaptiveLearning:window.MM_ADAPTIVE_LEARNING,learningEffectiveness:window.MM_LEARNING_EFFECTIVENESS,specialistLearningQuality:window.MM_SPECIALIST_LEARNING_QUALITY,utilisation:window.MM_RESEARCH_UTILISATION,gaps:window.MM_RESEARCH_GAPS,freshness:window.MM_RESEARCH_CLAIM_FRESHNESS,dataContext:window.MM_RESEARCH_DATA_CONTEXT,connectedData:window.MM_CONNECTED_PROCESS_DATA,appIntegration:window.MM_APP_INTEGRATION};
 const issues=[];
 if(!e)issues.push('engine-missing');else{
  const s=e.sourceCoverage?.()||{};
  if(s.mechanisms!==12)issues.push('mechanism-count');
  if(s.promoted!==12)issues.push('promotion-count');
  if(s.primaryMeasuredLinks<24)issues.push('primary-source-links');
  const sample=e.retrieve?.({text:'hot runner valve gate heater duty cavity pressure',process:['injection moulding'],tooling:['hot runner'],signals:['cavity pressure']},2)||[];
  if(!sample.some(x=>x.id==='hot-runner-actual-behaviour'))issues.push('retrieval-smoke-check')
 }
 for(const [name,value] of Object.entries(modules))if(!value)issues.push(`${name}-missing`);
 const manifest=window.MM_CONNECTED_PROCESS_DATA?.currentManifest?.();
 if(manifest&&manifest.researchUtilisation?.promotedMechanisms!==12)issues.push('manifest-research-state');
 if(manifest&&manifest.researchUtilisation?.supportsDelayedTransferChecks!==true)issues.push('manifest-delayed-transfer-state');
 const integration=window.MM_APP_INTEGRATION;
 return{version:VERSION,ok:issues.length===0,issues,coverage:e?.sourceCoverage?.()||null,assessment:integration?.assessmentAudit?.()||null,competency:integration?.competencySummary?.()||null,accessibility:integration?.accessibilityAudit?.()||null,scope:'Research-runtime coherence plus app-integration presence. It validates module wiring and governed evidence coverage; it does not assert production causality, machine safety limits or formal psychometric validity.'}
}
window.MM_RESEARCH_EVIDENCE_HEALTH=Object.freeze({version:VERSION,check});
})();
