/* MouldMaster psychometric approval bridge — 2026.09.01.3 */
(function(){
'use strict';
const VERSION='2026.09.01.3';
const REQUIRED_VERSION='2026.09.01.4';
const INPUT_BLOB='8236712b70777f1f56b8e15ca8929e6b39abb721';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:3,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===3&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&Number(P.distractorCueEdits)>0&&Number(P.formClauseTrims)>0&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,technicalLengthRanks:[...(P.technicalLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI re-runs the 50-pass standard and extreme within-question relative-form cue audits for this exact runtime. Keyed propositions and technical terminology are preserved; selected distractor explanation tails move to feedback instead of acting as answer-format cues; no filler padding is used.',scope:'Assessment-form hardening only; technical propositions, evidence relevance and safety boundaries remain governed by the evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();
