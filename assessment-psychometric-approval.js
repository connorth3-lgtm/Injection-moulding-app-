/* MouldMaster psychometric approval bridge — 2026.08.30.1 */
(function(){
'use strict';
const VERSION='2026.08.30.1';
const REQUIRED_VERSION='2026.08.30.5';
const INPUT_BLOB='822c90596dcdc40187b381ea0343017836a75e04';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,scenarioKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verifiedSurfaceCueMean:0.269,verifiedOptionPermutationEvaluations:9850,scope:'Assessment-form hardening only; technical propositions and safety boundaries remain governed by the evidence approval records.'};
 if(D?.assessmentQA?.evidenceApproval){
   D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;
   D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;
   D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;
   if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required';
 }
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();
