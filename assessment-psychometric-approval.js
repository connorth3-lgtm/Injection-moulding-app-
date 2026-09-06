/* MouldMaster psychometric approval bridge — 2026.09.06.2 */
(function(){
'use strict';
const VERSION='2026.09.06.2';
const REQUIRED_VERSION='2026.09.01.6';
const INPUT_BLOB='fdcc6fc4d655e3a90a33acdc38712197ff040ebf';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:3,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10]};
const UNSAFE=/\b(bypass|defeat|disable)\b.{0,60}\b(guard|interlock|safeguard|protection|lockout)\b|\bopen\b.{0,45}\b(hot|pressurised|pressurized)\b/i;
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
function cueVerb(seed){return ['Check','Compare','Review','Test'][Math.abs(Number(seed)||0)%4]}
function competingDiagnostic(text,seed=0){
 const raw=String(text||'').trim(),t=raw.replace(/[.;]+$/,'');
 if(!t||UNSAFE.test(t))return raw;
 const v=cueVerb(seed),rules=[
  [/^(increase|reduce|change|raise|lower)\s+clamp force\b/i,`${v} clamp-force response first`],
  [/^(increase|reduce|change|raise|lower)\s+(packing|pack|hold) pressure\b/i,`${v} packing-pressure response first`],
  [/^(increase|reduce|change|raise|lower)\s+(total )?hold time\b/i,`${v} hold-time response first`],
  [/^(increase|reduce|change|raise|lower|shorten|lengthen)\s+cooling( time)?\b/i,`${v} cooling-time response first`],
  [/^(increase|reduce|change|raise|lower)\s+(main )?(injection|fill) (speed|velocity)\b/i,`${v} fill-speed response first`],
  [/^(increase|reduce|change|raise|lower)\s+(mould|mold) temperature/i,`${v} mould-temperature response first`],
  [/^(increase|reduce|change|raise|lower)\s+(barrel|melt|nozzle) temperature/i,`${v} melt-temperature response first`],
  [/^(increase|reduce|change|raise|lower)\s+shot size\b/i,`${v} shot-delivery response first`],
  [/^(increase|reduce|change|raise|lower)\s+gas dose\b/i,`${v} foaming-dose response first`],
  [/^(increase|reduce|change|raise|lower)\s+(all )?(heater|manifold) (setpoints?|temperature)/i,`${v} heater-duty response first`],
  [/^change\s+robot take-out timing\b/i,`${v} robot-timing response first`],
  [/^reduce\s+total cycle time\b/i,`${v} total cycle and phase timing first`],
  [/^change\s+part specification\b/i,`${v} the part specification first`],
  [/^change\s+the dimensional specification\b/i,`${v} the dimensional specification first`],
  [/^approve it because the line is cosmetic$/i,'Use appearance for weld-line acceptance'],
  [/^accept it because weight target is the process objective$/i,'Use mass reduction as the acceptance criterion'],
  [/^assume the material pair is incompatible everywhere$/i,`${v} bulk material compatibility first`],
  [/^assume all model outputs remain valid because one target is accurate$/i,'Use the accurate mass model as the validity check'],
  [/^treat the cycle as unchanged because the peak is stable$/i,'Use peak cavity pressure as the equivalence check'],
  [/^treat total part mass as proof the microfeatures are full$/i,'Use total part mass as microfeature evidence'],
  [/^treat it as moisture splay (automatically|typically)$/i,`${v} material-moisture history first`],
  [/^reject the mfr test as invalid$/i,`${v} the MFR result first`],
  [/^copy the previous lot.?s settings because mfr matches$/i,'Use previous-lot settings as the comparison'],
  [/^ignore heater output because displayed temperature is correct$/i,'Use displayed temperature as the thermal indicator'],
  [/^ignore the signal if part mass is stable$/i,'Use stable part mass as the sensor-health check'],
  [/^ignore the dimension because pressure peak passed$/i,'Use the stable pressure peak as the dimension check'],
  [/^ignore wear if average part mass passes$/i,'Use average part mass as the gate-wear check'],
  [/^ignore first-off parts without a defined startup plan$/i,'Use steady-state results for startup acceptance'],
  [/^average all cavity traces and ignore identity$/i,'Use the averaged cavity trace for diagnosis'],
  [/^average the old and new cooling times$/i,'Use the midpoint cooling time as the trial'],
  [/^keep the faster cycle because cooling improved$/i,'Use cycle-time improvement as the acceptance check'],
  [/^continue production until displayed temperature moves$/i,'Use displayed temperature trend as the stop trigger'],
  [/^save a separate permanent packing correction for the first cycles$/i,'Use a startup packing correction for first-off parts'],
  [/^retrain every quality model first$/i,'Use model retraining as the first sensor response'],
  [/^retrain using the failed predictions as ground truth$/i,'Use recent prediction errors as retraining data'],
  [/^polish the opposite mould half$/i,`${v} the opposite mould surface first`]
 ];
 for(const [rx,replacement] of rules)if(rx.test(t))return replacement;
 const m=/^(increase|decrease|raise|lower|reduce|change|adjust|shorten|lengthen|boost|maximi[sz]e|minimi[sz]e)\s+(.+)$/i.exec(t);
 if(m){const subject=m[2].replace(/\b(first|immediately|globally|automatically)\b/gi,'').replace(/\s{2,}/g,' ').trim().slice(0,42);return `${v} ${subject} first`}
 return raw;
}
function neutraliseScenarioDistractors(){
 const D=window.MM_DATA;if(!Array.isArray(D?.scenarios))return 0;let edits=0;
 D.scenarios.forEach((s,scenarioIndex)=>{
  if(!Array.isArray(s?.choices)||s.choices.length!==4||!Number.isInteger(s.correct)||s.correct<0||s.correct>3)return;
  s.feedback=Array.isArray(s.feedback)&&s.feedback.length===4?s.feedback.slice():['','','',''];
  for(let i=0;i<4;i++){
   if(i===s.correct)continue;
   const before=String(s.choices[i]||''),after=competingDiagnostic(before,scenarioIndex*4+i);
   if(after===before)continue;
   if(s.choices.some((x,j)=>j!==i&&String(x||'').trim().toLowerCase()===after.trim().toLowerCase()))continue;
   s.choices[i]=after;
   s.feedback[i]=`Not the strongest first decision. “${after}” is a plausible competing path, but it does not fit the stated evidence as directly as the keyed mechanism.`;
   edits++;
  }
 });
 return edits;
}
const CUE_NEUTRALISATION_EDITS=neutraliseScenarioDistractors();
window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,scenarioDistractorEdits:CUE_NEUTRALISATION_EDITS,answerKeyChanges:0,scope:'Wrong scenario choices only; stems, keyed choices, key positions and rationales are unchanged.'};
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&Number(P.distractorCueEdits)>0&&Number(P.formClauseTrims)>0&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&CUE_NEUTRALISATION_EDITS>0;
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:CUE_NEUTRALISATION_EDITS,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI re-runs the standard and extreme learner-visible audits for the exact post-approval runtime. Scenario distractors are concise plausible competing diagnostic paths rather than naked parameter commands; answer-form length balance, stems, keyed propositions, key positions, technical terminology and safety boundaries are preserved.',scope:'Assessment-form hardening only; technical propositions, evidence relevance and safety boundaries remain governed by the evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P,cueEdits:CUE_NEUTRALISATION_EDITS});
}
attach();
})();
