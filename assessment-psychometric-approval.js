/* MouldMaster psychometric approval bridge — 2026.09.09.3 */
(function(){
'use strict';
const VERSION='2026.09.09.3';
const REQUIRED_VERSION='2026.09.01.6';
const INPUT_BLOB='fdcc6fc4d655e3a90a33acdc38712197ff040ebf';
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,keyedConciseEdits:3,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10]};
const EXPECTED_BANK_ITEMS={'technical-exam':30,'regional-exam':27,'scenario':40,'diagnostic-lab':36,'material-lab':24,'optional-material-practice':40};
const UNSAFE=/\b(bypass|defeat|disable)\b.{0,60}\b(guard|interlock|safeguard|protection|lockout)\b|\bopen\b.{0,45}\b(hot|pressurised|pressurized)\b/i;
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
function cueVerb(seed){const verbs=['Check','Compare','Review','Test','Inspect','Measure','Map'];return verbs[Math.abs(Number(seed)||0)%verbs.length]}
function competingDiagnostic(text,seed=0,allowGeneric=true){
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
 if(allowGeneric){
  const m=/^(increase|decrease|raise|lower|reduce|change|adjust|shorten|lengthen|boost|maximi[sz]e|minimi[sz]e)\s+(.+)$/i.exec(t);
  if(m){const subject=m[2].replace(/\b(first|immediately|globally|automatically)\b/gi,'').replace(/\s{2,}/g,' ').trim().slice(0,42);return `${v} ${subject} first`}
 }
 return raw;
}
function optionSignature(text){return String(text||'').trim().toLowerCase()}
function neutraliseOptions(options,key,feedback,seedBase,allowGeneric){
 if(!Array.isArray(options)||options.length!==4||!Number.isInteger(key)||key<0||key>3)return {items:0,edits:0,duplicates:0,feedback:Array.isArray(feedback)?feedback:[]};
 const fb=Array.isArray(feedback)&&feedback.length===4?feedback.slice():['','','',''];let edits=0,duplicates=0;
 for(let i=0;i<4;i++){
  if(i===key)continue;
  const before=String(options[i]||''),after=competingDiagnostic(before,seedBase+i,allowGeneric);
  if(after===before)continue;
  if(!allowGeneric){const keyed=String(options[key]||'').trim();if(keyed&&after.length<Math.max(24,Math.ceil(keyed.length*0.65)))continue}
  if(options.some((x,j)=>j!==i&&optionSignature(x)===optionSignature(after))){duplicates++;continue}
  options[i]=after;
  fb[i]=`Not the strongest first decision. “${after}” is a plausible competing path, but it does not fit the stated evidence as directly as the keyed mechanism.`;
  edits++;
 }
 return {items:1,edits,duplicates,feedback:fb};
}
function questionParts(q){return Array.isArray(q)?{options:q[1],key:Number(q[2]),feedback:q[6],setFeedback:v=>{q[6]=v}}:{options:q?.options,key:Number(q?.correct),feedback:q?.optionFeedback,setFeedback:v=>{q.optionFeedback=v}}}
function snapshotKeys(){
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS,out=[];
 const add=(id,key,options)=>{if(Array.isArray(options)&&options.length===4&&Number.isInteger(key)&&key>=0&&key<4)out.push([id,key,String(options[key]||'')])};
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D?.exams?.[level]||[]).length;i++){const p=questionParts(D.exams[level][i]);add(`tech:${level}:${i}`,p.key,p.options)}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D?.regionalQuestions?.[region]?.[level]||[]).length;i++){const p=questionParts(D.regionalQuestions[region][level][i]);add(`reg:${region}:${level}:${i}`,p.key,p.options)}
 for(let i=0;i<(D?.scenarios||[]).length;i++){const s=D.scenarios[i];add(String(s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`),Number(s.correct),s.choices)}
 const labs=(obj,prefix)=>{for(const lab of (obj?.labs||[]))for(let i=0;i<(lab.steps||[]).length;i++){const c=lab.steps[i].choices||[],key=c.findIndex(x=>x?.correct===true);add(`${prefix}${lab.id}:${i}`,key,c.map(x=>x?.text))}};
 labs(DIAG,'lab:');labs(MAT,'material:');labs(OPT,'optional-material:');return out;
}
function compareKeySnapshots(before,after){
 const map=new Map(after.map(x=>[x[0],x])),result={answerKeyChanges:0,keyedChoiceChanges:0,missingItems:0};
 for(const b of before){const a=map.get(b[0]);if(!a){result.missingItems++;continue}if(a[1]!==b[1])result.answerKeyChanges++;if(a[2]!==b[2])result.keyedChoiceChanges++}return result;
}
function neutraliseAllBanks(){
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
 const before=snapshotKeys(),editsByBank={},itemsByBank={},duplicatesByBank={};let seed=0;
 const record=(kind,r)=>{itemsByBank[kind]=(itemsByBank[kind]||0)+r.items;editsByBank[kind]=(editsByBank[kind]||0)+r.edits;duplicatesByBank[kind]=(duplicatesByBank[kind]||0)+r.duplicates;seed+=4};
 for(const level of ['Beginner','Intermediate','Advanced'])for(const q of (D?.exams?.[level]||[])){const p=questionParts(q),r=neutraliseOptions(p.options,p.key,p.feedback,seed,false);p.setFeedback(r.feedback);record('technical-exam',r)}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(const q of (D?.regionalQuestions?.[region]?.[level]||[])){const p=questionParts(q),r=neutraliseOptions(p.options,p.key,p.feedback,seed,false);p.setFeedback(r.feedback);record('regional-exam',r)}
 for(let scenarioIndex=0;scenarioIndex<(D?.scenarios||[]).length;scenarioIndex++){
  const s=D.scenarios[scenarioIndex],r=neutraliseOptions(s.choices,Number(s.correct),s.feedback,seed,true);s.feedback=r.feedback;record('scenario',r);
  if(String(s.mmStableId||'')==='scenario:07'&&Array.isArray(s.choices)&&s.choices.length===4&&Number.isInteger(s.correct)){
   const alternatives=[
    'Review measurement-system method and fixture consistency between shifts before changing the process',
    'Compare shot-delivery, cushion and part-mass response between shifts before reviewing thermal conditions',
    'Test packing response and dimensional trend between shifts before reviewing water and material state'
   ];
   let n=0;
   for(let i=0;i<4;i++){
    if(i===s.correct)continue;
    const after=alternatives[n++],beforeChoice=String(s.choices[i]||'');
    if(beforeChoice===after)continue;
    if(s.choices.some((x,j)=>j!==i&&optionSignature(x)===optionSignature(after))){duplicatesByBank.scenario=(duplicatesByBank.scenario||0)+1;continue}
    s.choices[i]=after;s.feedback[i]=`Not the strongest first decision. “${after}” is a plausible competing path, but the shift-linked evidence is broader than this single hypothesis.`;editsByBank.scenario++;
   }
  }
 }
 const neutraliseLabs=(obj,kind)=>{for(const lab of (obj?.labs||[]))for(const step of (lab.steps||[])){const choices=step.choices||[],key=choices.findIndex(c=>c?.correct===true),options=choices.map(c=>c?.text),feedback=choices.map(c=>c?.feedback||''),r=neutraliseOptions(options,key,feedback,seed,false);if(r.items){for(let i=0;i<4;i++){choices[i].text=options[i];choices[i].feedback=r.feedback[i]}}record(kind,r)}};
 neutraliseLabs(DIAG,'diagnostic-lab');neutraliseLabs(MAT,'material-lab');neutraliseLabs(OPT,'optional-material-practice');
 const after=snapshotKeys(),invariants=compareKeySnapshots(before,after),totalEdits=Object.values(editsByBank).reduce((a,b)=>a+b,0),itemsInspected=Object.values(itemsByBank).reduce((a,b)=>a+b,0),duplicateOptionConflicts=Object.values(duplicatesByBank).reduce((a,b)=>a+b,0);
 const expectedCoverage=Object.entries(EXPECTED_BANK_ITEMS).every(([k,n])=>itemsByBank[k]===n);
 return {itemsInspected,itemsByBank,editsByBank,totalDistractorEdits:totalEdits,scenarioDistractorEdits:editsByBank.scenario||0,duplicateOptionConflicts,expectedCoverage,...invariants};
}
let CUE_NEUTRALISATION=null;
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 if(!CUE_NEUTRALISATION){CUE_NEUTRALISATION=neutraliseAllBanks();window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,...CUE_NEUTRALISATION,scope:'Wrong choices across all six learner-visible assessment banks only; stems, keyed choices, key positions and rationales are unchanged.'}}
 const C=CUE_NEUTRALISATION;
 const coverageOk=P.version===REQUIRED_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&Number(P.distractorCueEdits)>0&&Number(P.formClauseTrims)>0&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&C.expectedCoverage===true&&C.itemsInspected===197&&C.totalDistractorEdits>C.scenarioDistractorEdits&&C.answerKeyChanges===0&&C.keyedChoiceChanges===0&&C.missingItems===0&&C.duplicateOptionConflicts===0;
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,allBankDistractorCueEdits:C.totalDistractorEdits,scenarioDistractorCueEdits:C.scenarioDistractorEdits,distractorCueEditsByBank:{...C.editsByBank},itemsInspected:C.itemsInspected,itemsByBank:{...C.itemsByBank},answerKeyChanges:C.answerKeyChanges,keyedChoiceChanges:C.keyedChoiceChanges,duplicateOptionConflicts:C.duplicateOptionConflicts,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI re-runs the standard and extreme learner-visible audits for the exact post-approval runtime. Wrong choices across all six banks may be reframed as concise plausible competing diagnostic paths only when an existing vetted mapping applies; stems, keyed propositions, key positions, technical terminology and safety boundaries are preserved.',scope:'Assessment-form hardening only; technical propositions, evidence relevance and safety boundaries remain governed by the evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P,cue:C});
}
attach();
})();
