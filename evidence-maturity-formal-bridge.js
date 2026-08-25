/* MouldMaster formal evidence triangulation bridge — 2026.08.26.3 */
(function(){
'use strict';
const VERSION='2026.08.26.3';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before formal evidence bridge');

const MICROCELLULAR_AUTODESK={
 name:'Autodesk Moldflow — Microcellular Injection Molding analysis',
 authority:'Autodesk',
 kind:'technical documentation',
 url:'https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/GUID-153A6DF0-0451-48D4-BA8E-9747595110B4.html'
};
E.sources['autodesk-microcellular']=MICROCELLULAR_AUTODESK;

const base=E.inferred.bind(E);
const add=(out,id)=>{const s=E.sources?.[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=base(text).map(x=>({...x}));
 if(/microcellular|foamed|foam\b|cell morphology|cellular structure|weight reduction.*stiff|stiffness.*weight/.test(t)){
   add(out,'autodesk-microcellular');
   add(out,'microcellular-mechanics-2022');
 }
 if(/model drift|quality model|prediction error|training.?domain|domain coverage|ground truth|vision model|model output|classifier drift/.test(t)){
   add(out,'nist-ai-drift');
   add(out,'liew-2022');
 }
 if(/pressure sensor|in.?cavity sensor|cavity pressure.*machine|machine peak pressure/.test(t)){
   add(out,'araujo-2023');
   add(out,'liew-2022');
   add(out,'tsou-2023');
 }
 return out.slice(0,10);
};

// Formal material-lab approval uses explicit lab.sourceIds, so add the independent
// Delrin supplier guide before assessment-evidence-approval.js snapshots the 157 records.
const pom=window.MM_MATERIAL_BEHAVIOUR_LABS?.labs?.find(x=>x.id==='pom-thermal-safety');
if(pom&&!pom.sourceIds.includes('delrin-pom-molding'))pom.sourceIds.push('delrin-pom-molding');

E.version=VERSION;
E.formalTriangulationBridge={
 version:VERSION,
 minimumDistinctUrls:2,
 minimumAuthorityFamilies:2,
 microcellularIndependentAuthority:'Autodesk',
 pomIndependentSuppliers:['Celanese','Delrin'],
 localOnly:true
};
})();
