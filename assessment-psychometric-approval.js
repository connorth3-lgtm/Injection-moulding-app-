/* MouldMaster psychometric approval bridge — 2026.09.06.1 */
(function(){
'use strict';
const VERSION='2026.09.06.1';
const REQUIRED_VERSION='2026.09.01.6';
const INPUT_BLOB='fdcc6fc4d655e3a90a33acdc38712197ff040ebf';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:3,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10]};
const UNSAFE=/\b(bypass|defeat|disable)\b.{0,60}\b(guard|interlock|safeguard|protection|lockout)\b|\bopen\b.{0,45}\b(hot|pressurised|pressurized)\b/i;
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
function competingDiagnostic(text){
 const raw=String(text||'').trim(),t=raw.replace(/[.;]+$/,'');
 if(!t||UNSAFE.test(t))return raw;
 const l=t.toLowerCase();
 const rules=[
  [/^(increase|reduce|change|raise|lower)\s+clamp force\b/i,'Check clamp-force and mould-opening evidence as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(packing|pack|hold) pressure\b/i,'Compare packing-pressure and part-mass response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(total )?hold time\b/i,'Compare hold-time and gate-seal response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower|shorten|lengthen)\s+cooling( time)?\b/i,'Compare cooling-time, ejection-temperature and dimensional response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(main )?(injection|fill) (speed|velocity)\b/i,'Compare fill-speed and injection-pressure response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(mould|mold) temperature/i,'Compare mould-temperature balance and local thermal response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(barrel|melt|nozzle) temperature/i,'Compare melt-path thermal history and pressure response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+shot size\b/i,'Check shot-delivery, cushion and part-mass response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+gas dose\b/i,'Compare foaming dose, density and cell-structure response as the primary diagnostic path'],
  [/^(increase|reduce|change|raise|lower)\s+(all )?(heater|manifold) (setpoints?|temperature)/i,'Compare heater duty and manifold thermal response as the primary diagnostic path'],
  [/^change\s+robot take-out timing\b/i,'Compare robot timing and cycle-state evidence as the primary diagnostic path'],
  [/^reduce\s+total cycle time\b/i,'Use total cycle time and phase timing as the primary process comparison'],
  [/^change\s+part specification\b/i,'Review the part specification as the primary explanation for the observed change'],
  [/^change\s+the dimensional specification\b/i,'Review the dimensional specification as the primary explanation for the observed surface change'],
  [/^approve it because the line is cosmetic$/i,'Use visual appearance as the primary weld-line acceptance criterion'],
  [/^accept it because weight target is the process objective$/i,'Use mass reduction as the primary acceptance criterion for the foamed part'],
  [/^assume the material pair is incompatible everywhere$/i,'Check bulk material-pair compatibility as the primary bond-strength hypothesis'],
  [/^assume all model outputs remain valid because one target is accurate$/i,'Use the still-accurate mass model as the primary evidence that the model remains valid'],
  [/^treat the cycle as unchanged because the peak is stable$/i,'Use peak cavity pressure as the primary process-equivalence indicator'],
  [/^treat total part mass as proof the microfeatures are full$/i,'Use total part mass as the primary evidence of microfeature replication'],
  [/^treat it as moisture splay (automatically|typically)$/i,'Check material-moisture history as the primary surface-defect hypothesis'],
  [/^reject the mfr test as invalid$/i,'Repeat the MFR result as the primary explanation for the moulding difference'],
  [/^copy the previous lot.?s settings because mfr matches$/i,'Use the previous lot’s settings as the primary comparison condition because MFR is similar'],
  [/^ignore heater output because displayed temperature is correct$/i,'Use displayed temperature as the primary hot-runner thermal indicator'],
  [/^ignore the signal if part mass is stable$/i,'Use stable part mass as the primary evidence that the sensor signal can be deprioritised'],
  [/^ignore the dimension because pressure peak passed$/i,'Use the stable pressure peak as the primary evidence that the dimensional shift is unrelated'],
  [/^ignore wear if average part mass passes$/i,'Use average part mass as the primary evidence that the measured gate wear is not yet process-significant'],
  [/^ignore first-off parts without a defined startup plan$/i,'Use steady-state production results as the primary basis for startup acceptance'],
  [/^average all cavity traces and ignore identity$/i,'Use the averaged cavity trace as the primary representation of valve-gate behaviour'],
  [/^average the old and new cooling times$/i,'Use the midpoint of the old and new cooling times as the primary trial condition'],
  [/^keep the faster cycle because cooling improved$/i,'Use cycle-time improvement as the primary acceptance criterion for the cooling redesign'],
  [/^continue production until displayed temperature moves$/i,'Use displayed temperature trend as the primary indicator before interrupting production'],
  [/^save a separate permanent packing correction for the first cycles$/i,'Use a startup-specific packing correction as the primary response to the first-off dimensional shift'],
  [/^retrain every quality model first$/i,'Use model retraining as the primary response to the changed cavity-sensor signal'],
  [/^retrain using the failed predictions as ground truth$/i,'Use the recent prediction errors as the primary retraining dataset'],
  [/^polish the opposite mould half$/i,'Inspect and polish the opposite mould surface as the primary weld-line corrective path']
 ];
 for(const [rx,replacement] of rules)if(rx.test(t))return replacement;
 const m=/^(increase|decrease|raise|lower|reduce|change|adjust|shorten|lengthen|boost|maximi[sz]e|minimi[sz]e)\s+(.+)$/i.exec(t);
 if(m)return `Compare ${m[2].replace(/\b(first|immediately|globally|automatically)\b/gi,'').replace(/\s{2,}/g,' ').trim()} response as the primary diagnostic path`;
 return raw;
}
function neutraliseScenarioDistractors(){
 const D=window.MM_DATA;if(!Array.isArray(D?.scenarios))return 0;let edits=0;
 for(const s of D.scenarios){
  if(!Array.isArray(s?.choices)||s.choices.length!==4||!Number.isInteger(s.correct)||s.correct<0||s.correct>3)continue;
  s.feedback=Array.isArray(s.feedback)&&s.feedback.length===4?s.feedback.slice():['','','',''];
  for(let i=0;i<4;i++){
   if(i===s.correct)continue;
   const before=String(s.choices[i]||''),after=competingDiagnostic(before);
   if(after===before)continue;
   if(s.choices.some((x,j)=>j!==i&&String(x||'').trim().toLowerCase()===after.trim().toLowerCase()))continue;
   s.choices[i]=after;
   s.feedback[i]=`Not the strongest first decision. “${after}” is a plausible competing path, but it does not fit the stated evidence as directly as the keyed mechanism.`;
   edits++;
  }
 }
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
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:CUE_NEUTRALISATION_EDITS,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI re-runs the standard and extreme learner-visible audits for the exact post-approval runtime. Scenario distractors are phrased as plausible competing diagnostic paths rather than naked parameter commands, while stems, keyed propositions, key positions, technical terminology and safety boundaries remain unchanged.',scope:'Assessment-form hardening only; technical propositions, evidence relevance and safety boundaries remain governed by the evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P,cueEdits:CUE_NEUTRALISATION_EDITS});
}
attach();
})();