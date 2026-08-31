/* MouldMaster psychometric approval bridge — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1';
const REQUIRED_VERSION='2026.09.01.1';
const INPUT_BLOB='edeb332a06cbcd1f59bbee3418e69290cb1e1b6e';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,optionTextMutations:0,lexicalSubstitutions:0,paddingApplied:false,optionsTextPreserved:true,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===0&&P.optionTextMutations===0&&P.lexicalSubstitutions===0&&P.paddingApplied===false&&P.optionsTextPreserved===true&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,optionTextMutations:P.optionTextMutations,lexicalSubstitutions:P.lexicalSubstitutions,paddingApplied:P.paddingApplied,optionsTextPreserved:P.optionsTextPreserved,technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI re-runs the 50-pass standard and extreme surface-cue audits for this exact runtime; previous wording metrics are not carried forward.',scope:'Assessment-form hardening only; technical propositions, evidence relevance and safety boundaries remain governed by the evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();
