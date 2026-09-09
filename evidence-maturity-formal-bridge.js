/* MouldMaster formal evidence triangulation bridge — 2026.09.10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1';
const QUALITY_VERSION='2026.09.10.1';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before formal evidence bridge');

const EXTRA={
 'autodesk-microcellular':{
  name:'Autodesk Moldflow — Microcellular Injection Molding analysis',authority:'Autodesk',kind:'technical documentation',
  url:'https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/GUID-153A6DF0-0451-48D4-BA8E-9747595110B4.html'
 },
 'iso-22514-2':{name:'ISO 22514-2:2026 — process capability and performance',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/88883.html'},
 'iso-22514-7':{name:'ISO 22514-7:2021 — capability of measurement processes',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/80624.html'},
 'kistler-cavity-pressure':{name:'Kistler — Cavity pressure measurement and process monitoring',authority:'Kistler',kind:'sensor-manufacturer technical guidance',url:'https://www.kistler.com/en/cavity-pressure/cavity-pressure/C00000099'},
 'euromap-77':{name:'EUROMAP 77 — IMM/MES data exchange',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://euromap.org/euromap77'},
 'iso-20816-1':{name:'ISO 20816-1:2016 — general machine-vibration measurement guidance',authority:'ISO',kind:'standard measurement framework',url:'https://www.iso.org/standard/63180.html'}
};
Object.assign(E.sources,EXTRA);

const base=E.inferred.bind(E);
const add=(out,id)=>{const s=E.sources?.[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
const authorityFamily=s=>{
 const a=String(s?.authority||'').trim();
 if(a){if(/^peer-reviewed/i.test(a))return 'peer-reviewed research';return a.split('/')[0].trim()}
 try{return new URL(s?.url||'').hostname.replace(/^www\./,'')}catch(_){return ''}
};
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=base(text).map(x=>({...x}));
 if(/microcellular|foamed|foam\b|cell morphology|cellular structure|weight reduction.*stiff|stiffness.*weight/.test(t)){
   add(out,'autodesk-microcellular');add(out,'microcellular-mechanics-2022');
 }
 if(/model drift|quality model|prediction error|training.?domain|domain coverage|ground truth|vision model|model output|classifier drift/.test(t)){
   add(out,'nist-ai-drift');add(out,'liew-2022');
 }
 if(/pressure sensor|in.?cavity sensor|cavity pressure|pressure.?time|pressure area|machine peak pressure/.test(t)){
   add(out,'kistler-cavity-pressure');add(out,'araujo-2023');add(out,'liew-2022');add(out,'tsou-2023');
 }
 if(/\bcpk\b|\bcp\b|capabilit|process performance/.test(t)){
   add(out,'iso-22514-2');add(out,'nist-capability');
 }
 if(/measurement|gauge|gage|measurement noise|repeatability|reproducibility/.test(t)){
   add(out,'iso-22514-7');add(out,'nist-handbook');
 }
 if(/flash|parting.?line|shutoff|tool seating|mould seating|mold seating/.test(t)){
   add(out,'basf-troubleshooter');add(out,'autodesk-flash');add(out,'autodesk-clamp');
 }
 return out.slice(0,12);
};

// Formal material-lab approval uses explicit lab.sourceIds, so add the independent
// Delrin supplier guide before assessment-evidence-approval.js snapshots the 157 records.
const pom=window.MM_MATERIAL_BEHAVIOUR_LABS?.labs?.find(x=>x.id==='pom-thermal-safety');
if(pom&&!pom.sourceIds.includes('delrin-pom-molding'))pom.sourceIds.push('delrin-pom-molding');

/* Quality overlay: improve learner-visible feedback for generated scenario drills without
   changing stems, choices, answer keys or evidence fingerprints. */
function wrongFeedback(choice,focus,why){
 const t=String(choice||'').trim(),low=t.toLowerCase(),topic=String(focus||'the stated mechanism').toLowerCase();
 if(/bypass|defeat|disable/.test(low)&&/guard|interlock|safeguard|protection/.test(low))return `Unsafe. Safeguards remain in force; “${t}” is not an acceptable diagnostic action.`;
 if(/\b(always|never|only|every|all|identical|automatically|guarantee)\b/.test(low))return `“${t}” overgeneralises beyond the evidence. The decision must stay specific to ${topic}.`;
 if(/^(increase|reduce|lower|raise|change|adjust|shorten|lengthen|keep|blend|dry)/.test(low))return `“${t}” changes or carries forward a condition before ${topic} is verified. ${why||'Test the stated mechanism first.'}`;
 if(/^(ignore|approve|accept|assume|judge|treat)/.test(low))return `“${t}” accepts a conclusion without the evidence needed to establish ${topic}. ${why||'Keep the evidence boundary explicit.'}`;
 return `“${t}” is less discriminating for ${topic}. ${why||'Prefer the observation or test that most directly separates the plausible mechanisms.'}`;
}
const scenarioRows=window.MM_DATA?.scenarios||[];
let scenarioFeedbackUpgraded=0;
for(const s of scenarioRows){
 const choices=Array.isArray(s?.choices)?s.choices:[],feedback=Array.isArray(s?.feedback)?s.feedback:[];
 const unique=new Set(feedback.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean));
 if(choices.length!==4||!Number.isInteger(Number(s?.correct))||Number(s.correct)<0||Number(s.correct)>3||unique.size>=3)continue;
 const key=Number(s.correct),why=String(s.why||'').trim(),focus=String(s.category||s.title||'the stated mechanism');
 s.feedback=choices.map((choice,i)=>i===key?`Correct. ${why}`:wrongFeedback(choice,focus,why));
 scenarioFeedbackUpgraded++;
}

/* The 40 extended material-practice decisions sit outside the formal 157-keyed bank.
   Their stems, answer text, answer key and choice order are source-authored by
   evidence-maturity-deep-dive.js. This bridge is deliberately read-only: it validates the
   published contract and must never repair, shorten, lengthen or reorder learner answers. */
const PRACTICE=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
let optionalChoicesValidated=0;
const optionalKeyPositions=[0,0,0,0];
if(PRACTICE?.labs){
 PRACTICE.labs.forEach((lab,labIndex)=>(lab.steps||[]).forEach((step,stepIndex)=>{
   const expectedId=`optional:${lab.id}:${stepIndex}`;
   const choices=Array.isArray(step.choices)?step.choices:[];
   if(step.id!==expectedId)throw new Error(`Optional-practice stable ID mismatch: ${step.id||'(missing)'} != ${expectedId}`);
   if(Number(step.revision)!==1)throw new Error(`Optional-practice revision missing for ${expectedId}`);
   if(choices.length!==4)throw new Error(`Optional-practice choice count mismatch for ${expectedId}: ${choices.length}/4`);
   const keys=choices.map((c,i)=>c?.correct===true?i:-1).filter(i=>i>=0);
   if(keys.length!==1)throw new Error(`Optional-practice answer-key count mismatch for ${expectedId}: ${keys.length}`);
   const keyIndex=keys[0];
   if(Number(step.answerIndex)!==keyIndex)throw new Error(`Optional-practice answerIndex mismatch for ${expectedId}: ${step.answerIndex} != ${keyIndex}`);
   if(keyIndex!==(labIndex*4+stepIndex)%4)throw new Error(`Optional-practice key-position contract mismatch for ${expectedId}: ${keyIndex}`);
   if(choices.some(c=>!String(c?.text||'').trim()))throw new Error(`Optional-practice empty choice text for ${expectedId}`);
   optionalKeyPositions[keyIndex]++;optionalChoicesValidated++;
 }));
}
if(optionalChoicesValidated!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesValidated}/40`);
if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
window.MM_QUESTION_QUALITY_OVERLAY={
 version:QUALITY_VERSION,
 scenarioFeedbackUpgraded,
 optionalChoicesUpgraded:0,
 optionalChoicesValidated,
 optionalKeyPositions:optionalKeyPositions.slice(),
 optionalAnswerSemanticMutationPolicy:'forbidden',
 optionalKeyPositionPolicy:'10 source-authored keyed decisions in each of four positions',
 stableOptionalItemIdPolicy:'optional:<lab-id>:<step-index> with explicit revision',
 evidenceMechanismsPreserved:true
};

// Reference extensions can legitimately contain repeated display names. Preserve every
// live record, triangulate the remaining signal entries, and give each record a deterministic ID.
const RT=window.MM_REFERENCE_TRACEABILITY;
if(RT?.audit){
 const baseAudit=RT.audit.bind(RT);
 const dynamicKeys=new Set(['id','sources','sourceIds','authorityFamilies','status','reviewedOn','reviewBy']);
 const semanticIdentity=row=>{
   const stable={};
   for(const key of Object.keys(row||{}).sort())if(!dynamicKeys.has(key))stable[key]=row[key];
   return E.hash(JSON.stringify(stable));
 };
 const enrichReference=row=>{
   const sources=(row.sources||[]).map(s=>({...s})),key=String(row.id||'').toLowerCase();
   if(key.includes('screw-torque-drive-load'))add(sources,'euromap-77');
   if(key.includes('local-cavity-pressure-features'))add(sources,'kistler-cavity-pressure');
   if(key.includes('machine-vibration-features'))add(sources,'iso-20816-1');
   if(key.includes('vision-defect-score')||key.includes('anomaly-score'))add(sources,'nist-ai-drift');
   const families=[...new Set(sources.map(authorityFamily).filter(Boolean))];
   return {...row,sources,sourceIds:sources.map(s=>s.id),authorityFamilies:families,status:sources.length>=2&&families.length>=2?'strong':sources.length>=2?'supported':'weak'};
 };
 const hardenedAudit=()=>{
   const result=baseAudit(),seen=new Map();
   const records=(result.records||[]).map(enrichReference).map((row,index)=>{
     const baseId=String(row.id||`ref:record:${index}`),semantic=semanticIdentity(row);
     const candidate=`${baseId}:${semantic}`;
     const occurrence=(seen.get(candidate)||0)+1;seen.set(candidate,occurrence);
     return {...row,id:occurrence===1?candidate:`${candidate}:${occurrence}`};
   });
   const counts={strong:0,supported:0,weak:0};records.forEach(r=>counts[r.status]++);
   return {...result,records,total:records.length,counts};
 };
 RT.audit=hardenedAudit;
 RT.record=id=>hardenedAudit().records.find(x=>x.id===id)||null;
 RT.idPolicy={version:VERSION,scheme:'existing-semantic-id + content hash + duplicate ordinal',preservesAllEntries:true};
 RT.triangulationPolicy={version:VERSION,minimumUrls:2,minimumAuthorityFamilies:2,signalFrameworks:{'screw-torque-drive-load':'EUROMAP 77','local-cavity-pressure-features':'Kistler','machine-vibration-features':'ISO 20816-1','vision-defect-score':'NIST AI RMF','anomaly-score':'NIST AI RMF'}};
}

E.version=VERSION;
E.formalTriangulationBridge={
 version:VERSION,minimumDistinctUrls:2,minimumAuthorityFamilies:2,
 capabilityAuthorities:['NIST','ISO'],measurementAuthorities:['NIST','ISO'],
 cavityPressureAuthorities:['peer-reviewed research','Kistler'],flashAuthorities:['Autodesk','BASF'],
 microcellularIndependentAuthority:'Autodesk',pomIndependentSuppliers:['Celanese','Delrin'],
 referenceIdPolicy:'semantic-hash-with-duplicate-ordinal',referenceSignalAuthorities:['EUROMAP','Kistler','ISO','NIST'],localOnly:true
};
})();
