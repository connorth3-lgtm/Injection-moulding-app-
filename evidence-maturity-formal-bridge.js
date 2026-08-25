/* MouldMaster formal evidence triangulation bridge — 2026.08.26.5 */
(function(){
'use strict';
const VERSION='2026.08.26.5';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before formal evidence bridge');

const EXTRA={
 'autodesk-microcellular':{
  name:'Autodesk Moldflow — Microcellular Injection Molding analysis',authority:'Autodesk',kind:'technical documentation',
  url:'https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/GUID-153A6DF0-0451-48D4-BA8E-9747595110B4.html'
 },
 'iso-22514-2':{name:'ISO 22514-2:2026 — process capability and performance',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/88883.html'},
 'iso-22514-7':{name:'ISO 22514-7:2021 — capability of measurement processes',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/80624.html'},
 'kistler-cavity-pressure':{name:'Kistler — Cavity pressure measurement and process monitoring',authority:'Kistler',kind:'sensor-manufacturer technical guidance',url:'https://www.kistler.com/en/cavity-pressure/cavity-pressure/C00000099'}
};
Object.assign(E.sources,EXTRA);

const base=E.inferred.bind(E);
const add=(out,id)=>{const s=E.sources?.[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
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

// Reference extensions can legitimately contain repeated display names.  Preserve every
// live record while giving each one a deterministic semantic ID rather than collapsing it.
const RT=window.MM_REFERENCE_TRACEABILITY;
if(RT?.audit){
 const baseAudit=RT.audit.bind(RT);
 const dynamicKeys=new Set(['id','sources','sourceIds','authorityFamilies','status','reviewedOn','reviewBy']);
 const semanticIdentity=row=>{
   const stable={};
   for(const key of Object.keys(row||{}).sort())if(!dynamicKeys.has(key))stable[key]=row[key];
   return E.hash(JSON.stringify(stable));
 };
 const hardenedAudit=()=>{
   const result=baseAudit(),seen=new Map();
   const records=(result.records||[]).map((row,index)=>{
     const baseId=String(row.id||`ref:record:${index}`),semantic=semanticIdentity(row);
     const candidate=`${baseId}:${semantic}`;
     const occurrence=(seen.get(candidate)||0)+1;seen.set(candidate,occurrence);
     return {...row,id:occurrence===1?candidate:`${candidate}:${occurrence}`};
   });
   return {...result,records,total:records.length};
 };
 RT.audit=hardenedAudit;
 RT.record=id=>hardenedAudit().records.find(x=>x.id===id)||null;
 RT.idPolicy={version:VERSION,scheme:'existing-semantic-id + content hash + duplicate ordinal',preservesAllEntries:true};
}

E.version=VERSION;
E.formalTriangulationBridge={
 version:VERSION,minimumDistinctUrls:2,minimumAuthorityFamilies:2,
 capabilityAuthorities:['NIST','ISO'],measurementAuthorities:['NIST','ISO'],
 cavityPressureAuthorities:['peer-reviewed research','Kistler'],flashAuthorities:['Autodesk','BASF'],
 microcellularIndependentAuthority:'Autodesk',pomIndependentSuppliers:['Celanese','Delrin'],
 referenceIdPolicy:'semantic-hash-with-duplicate-ordinal',localOnly:true
};
})();
