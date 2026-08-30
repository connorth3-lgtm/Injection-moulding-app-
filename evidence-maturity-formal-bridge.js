/* MouldMaster formal evidence triangulation bridge — 2026.08.26.6 */
(function(){
'use strict';
const VERSION='2026.08.26.6';
const QUALITY_VERSION='2026.08.30.1';
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
   Preserve their evidence-backed mechanisms while removing two avoidable assessment cues:
   verbose keyed answers and a fixed first-position key. */
const OPTIONAL_CORRECT={
 'pbt-hydrolysis:0':'Measure actual resin moisture',
 'pbt-hydrolysis:1':'Measure moisture against the exact grade requirement',
 'pbt-hydrolysis:2':'Restore approved drying and verify moisture',
 'pbt-hydrolysis:3':'Hydrolysis can reduce molecular weight and properties',
 'pet-vs-copolyester:0':'Follow the exact grade guidance for each polyester',
 'pet-vs-copolyester:1':'Compare grade identity, moisture needs and product requirements',
 'pet-vs-copolyester:2':'Rebuild drying and thermal controls from the new grade data',
 'pet-vs-copolyester:3':'Polyester grade chemistry changes hydrolysis and crystallisation behaviour',
 'tpu-moisture-reabsorption:0':'Verify moisture in the resin entering the screw',
 'tpu-moisture-reabsorption:1':'Measure moisture and inspect the protected transfer path',
 'tpu-moisture-reabsorption:2':'Restore approved drying and transfer, then verify moisture',
 'tpu-moisture-reabsorption:3':'Moisture can reduce TPU molecular weight and properties',
 'pmma-optical-stress:0':'Do not assume one cosmetic symptom proves one cause',
 'pmma-optical-stress:1':'Verify material condition, thermal actuals and stress response',
 'pmma-optical-stress:2':'Investigate filling, packing and cooling stress history',
 'pmma-optical-stress:3':'Validate optical appearance and structural stress separately',
 'peek-crystallinity-capability:0':'Setpoints alone do not prove clean, uniform thermal capability',
 'peek-crystallinity-capability:1':'Verify machine/tool thermal capability and exact grade needs',
 'peek-crystallinity-capability:2':'Correct and validate the thermal system first',
 'peek-crystallinity-capability:3':'Equipment capability and thermal state affect PEEK validation',
 'pps-contamination-wear:0':'Separate contamination history from equipment wear',
 'pps-contamination-wear:1':'Inspect material cleanliness and melt-path/tool condition safely',
 'pps-contamination-wear:2':'Correct equipment wear and revalidate the process',
 'pps-contamination-wear:3':'PPS still needs thermal, wear and contamination controls',
 'lcp-orientation:0':'Easy filling does not rule out strong flow orientation',
 'lcp-orientation:1':'Map flow direction, welds, thickness and directional response',
 'lcp-orientation:2':'Study gate/tool design and orientation before global compensation',
 'lcp-orientation:3':'High flowability can coexist with strong anisotropy',
 'pcabs-grade-identity:0':'Treat the replacement as a new exact grade requiring validation',
 'pcabs-grade-identity:1':'Compare grade data, moisture, rheology, shrinkage and product needs',
 'pcabs-grade-identity:2':'Keep the change unvalidated until the required property is proven',
 'pcabs-grade-identity:3':'PC/ABS family names do not guarantee equivalent properties',
 'hdpe-lot-shrink:0':'Check lot rheology/density with process and cooling evidence',
 'hdpe-lot-shrink:1':'Compare material data and in-mould response at fixed conditions',
 'hdpe-lot-shrink:2':'Validate the new material/process combination against requirements',
 'hdpe-lot-shrink:3':'HDPE dimensions still depend on crystallinity, rheology and cooling',
 'tpe-overmould-compatibility:0':'Separate material compatibility from interface thermal/flow history',
 'tpe-overmould-compatibility:1':'Verify the material pair, surface and bond strength under controlled conditions',
 'tpe-overmould-compatibility:2':'Material compatibility belongs in the validated specification',
 'tpe-overmould-compatibility:3':'Overmould quality depends on chemistry, surface and process history'
};
const PRACTICE=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
let optionalChoicesUpgraded=0;
const optionalKeyPositions=[0,0,0,0];
const plausibleQualifier={
 'Observe':' while holding the remaining conditions at the known baseline',
 'Best next test':' under a controlled repeat with a documented acceptance rule',
 'Controlled response':' then verify the result against the same baseline evidence',
 'Explain':' as the primary mechanism across the stated observations'
};
function ensureLongerDistractor(wrong,correctLength,stage){
 const safe=wrong.filter(c=>!/bypass|defeat|disable/i.test(String(c.text||'')));
 const pool=safe.length?safe:wrong;
 if(!pool.length)return;
 let candidate=pool.reduce((a,b)=>String(a.text||'').length>=String(b.text||'').length?a:b),suffix=plausibleQualifier[stage]||' under the same controlled comparison';
 while(String(candidate.text||'').length<=correctLength)candidate.text=String(candidate.text||'').trim()+suffix;
}
if(PRACTICE?.labs){
 PRACTICE.labs.forEach((lab,labIndex)=>(lab.steps||[]).forEach((step,stepIndex)=>{
   const choices=Array.isArray(step.choices)?step.choices.map(c=>({...c})):[];
   if(choices.length!==4)return;
   let keyIndex=choices.findIndex(c=>c.correct===true);if(keyIndex<0)return;
   const mapKey=`${lab.id}:${stepIndex}`,replacement=OPTIONAL_CORRECT[mapKey];
   if(!replacement)throw new Error(`Missing optional-practice quality mapping: ${mapKey}`);
   choices[keyIndex].text=replacement;
   const correctChoice=choices[keyIndex],wrong=choices.filter((_,i)=>i!==keyIndex);
   ensureLongerDistractor(wrong,String(correctChoice.text).length,step.stage);
   const focus=String(lab.focus||'the stated mechanism').toLowerCase();
   correctChoice.feedback=`Correct. ${correctChoice.text}. This directly addresses ${focus}.`;
   wrong.forEach(c=>{c.feedback=wrongFeedback(c.text,focus,'Test the material or process mechanism with the most direct evidence before changing unrelated conditions.')});
   const targetPosition=(labIndex*4+stepIndex)%4,reordered=wrong.slice();reordered.splice(targetPosition,0,correctChoice);step.choices=reordered;
   optionalKeyPositions[targetPosition]++;optionalChoicesUpgraded++;
 }));
}
if(optionalChoicesUpgraded&&optionalChoicesUpgraded!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesUpgraded}/40`);
if(optionalChoicesUpgraded&&optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
window.MM_QUESTION_QUALITY_OVERLAY={version:QUALITY_VERSION,scenarioFeedbackUpgraded,optionalChoicesUpgraded,optionalKeyPositions:optionalKeyPositions.slice(),optionalAnswerLengthPolicy:'keyed option must not be longest or tied-longest',optionalKeyPositionPolicy:'10 keyed decisions in each of four positions',evidenceMechanismsPreserved:true};

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
