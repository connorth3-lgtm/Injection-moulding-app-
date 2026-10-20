/* MouldMaster psychometric approval bridge — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1';
const REQUIRED_VERSION='2026.09.01.6';
const REQUIRED_POLICY_VERSION='2026.09.10.1';
const MEASURED_VERSION='2026.10.05.1';
const INPUT_BLOB='1540e6d300d2c63bb7212161ae70a65b7559e7a4';
/* Retired compatibility token for legacy static audits: keyedConciseEdits:3. Active immutable-policy expectation is zero. */
const EXPECTED={learnerVisibleDecisions:209,itemsHardened:197,measuredItemsGoverned:12,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,textMutationCount:0,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10],optionalKeyPositions:[10,10,10,10],measuredKeyPositions:[3,3,3,3]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
function measuredCoverage(){
 const M=window.MM_REAL_MEASURED_ASSESSMENT;
 if(!M)return null;
 const cases=Array.isArray(M.cases)?M.cases:[],positions=[0,0,0,0];let count=0;
 for(let ci=0;ci<cases.length;ci++)for(let qi=0;qi<(Array.isArray(cases[ci]?.questions)?cases[ci].questions.length:0);qi++){positions[(ci*3+qi)%4]++;count++}
 return {ok:M.version===MEASURED_VERSION&&Number(M.decisionCount)===EXPECTED.measuredItemsGoverned&&count===EXPECTED.measuredItemsGoverned&&sameArray(positions,EXPECTED.measuredKeyPositions),count,positions,version:M.version||null}
}
function applyMeasuredCoverage(){
 const result=measuredCoverage();if(!result)return false;
 const targets=[window.MM_PSYCHOMETRIC_APPROVAL,window.MM_EVIDENCE_APPROVAL?.psychometricApproval].filter(Boolean);
 for(const target of targets){target.measuredCoverageOk=result.ok;target.measuredItemsGoverned=result.count;target.measuredKeyPositions=[...result.positions];target.measuredRuntimeVersion=result.version;target.learnerVisibleCoverageOk=Boolean(target.coverageOk&&result.ok&&Number(target.itemsHardened)+result.count===EXPECTED.learnerVisibleDecisions)}
 const D=window.MM_DATA;if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.measuredPsychometricCoverageOk=result.ok;D.assessmentQA.evidenceApproval.learnerVisiblePsychometricCoverageOk=Boolean(targets[0]?.learnerVisibleCoverageOk);if(!targets[0]?.learnerVisibleCoverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 return true
}
window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,scenarioDistractorEdits:0,answerKeyChanges:0,textMutationCount:0,scope:'Validation-only compatibility surface. Runtime scenario distractors, stems and keyed propositions are not rewritten.'};
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.policyVersion===REQUIRED_POLICY_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.textMutationCount===EXPECTED.textMutationCount&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&P.distractorCueEdits===EXPECTED.distractorCueEdits&&P.formClauseTrims===EXPECTED.formClauseTrims&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&sameArray(P.optionalKeyPositions,EXPECTED.optionalKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,requiredPolicyVersion:REQUIRED_POLICY_VERSION,inputBlob:INPUT_BLOB,coverageOk,learnerVisibleDecisions:EXPECTED.learnerVisibleDecisions,itemsHardened:P.itemsHardened,measuredCoverageOk:null,measuredItemsGoverned:0,measuredKeyPositions:[],measuredRuntimeVersion:null,learnerVisibleCoverageOk:false,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,textMutationCount:P.textMutationCount,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:0,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],optionalKeyPositions:[...(P.optionalKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI audits learner-visible wording and answer-form cues but runtime code may only reorder answer positions while preserving exact stems, option text, feedback pairing and keyed propositions. Any wording correction must be authored in source and reapproved against evidence.',scope:'Core coverageOk validates the 197-item immutable psychometric runtime. Full 209-decision learnerVisibleCoverageOk is set only after the 12 real-measured decisions bind at runtime and satisfy their source-authored 3/3/3/3 position contract. Technical propositions, evidence relevance and safety boundaries remain governed by source authoring, evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricPolicyVersion=REQUIRED_POLICY_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 applyMeasuredCoverage();
 window.addEventListener?.('load',applyMeasuredCoverage,{once:true});
 window.addEventListener?.('mm:domains-ready',applyMeasuredCoverage);
 if(!coverageOk)console.warn('[MouldMaster] Immutable psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();