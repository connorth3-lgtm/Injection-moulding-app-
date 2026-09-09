/* MouldMaster psychometric approval bridge — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1';
const REQUIRED_VERSION='2026.09.01.6';
const REQUIRED_POLICY_VERSION='2026.09.10.1';
const INPUT_BLOB='f5eba58116467f9d40f123a4887c8cfb2368c8ab';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,textMutationCount:0,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10],optionalKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,scenarioDistractorEdits:0,answerKeyChanges:0,textMutationCount:0,scope:'Validation-only compatibility surface. Runtime scenario distractors, stems and keyed propositions are not rewritten.'};
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.policyVersion===REQUIRED_POLICY_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.textMutationCount===EXPECTED.textMutationCount&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&P.distractorCueEdits===EXPECTED.distractorCueEdits&&P.formClauseTrims===EXPECTED.formClauseTrims&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&sameArray(P.optionalKeyPositions,EXPECTED.optionalKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,requiredPolicyVersion:REQUIRED_POLICY_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,textMutationCount:P.textMutationCount,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:0,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],optionalKeyPositions:[...(P.optionalKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI audits learner-visible wording and answer-form cues but runtime code may only reorder answer positions while preserving exact stems, option text, feedback pairing and keyed propositions. Any wording correction must be authored in source and reapproved against evidence.',scope:'Assessment-form validation and answer-position balance only; technical propositions, evidence relevance and safety boundaries remain governed by source authoring, evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricPolicyVersion=REQUIRED_POLICY_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Immutable psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();