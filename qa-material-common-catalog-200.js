/* Deterministic 200-case QA for common-material catalog extension */
'use strict';
const assert=require('assert'),D=require('./material-common-catalog-extension.js');
let assertions=0;const ok=(v,m)=>{assert.ok(v,m);assertions++},eq=(a,b,m)=>{assert.strictEqual(a,b,m);assertions++};
const audit=D.commonCatalogAudit();eq(audit.errors.length,0,audit.errors.join('\n'));eq(audit.familyCount,50,'expected exactly 50 material families');eq(audit.gradeCount,51,'expected 51 representative grade/family records');eq(audit.commonSelectionCount,50,'expected 50 common selector entries');eq(audit.specialtySelectionCount,14,'expected 14 specialty selector entries');eq(audit.selectionCount,64,'expected 64 total selector entries');eq(audit.addedFamilyCount,17);eq(audit.addedGradeCount,17);
const families=new Set(D.families.map(x=>x.id)),gradeIds=new Set(),selectionIds=new Set();
for(const g of D.grades){ok(!gradeIds.has(g.id),'duplicate grade '+g.id);gradeIds.add(g.id);ok(families.has(g.familyId),'unknown grade family '+g.familyId);ok(/^https:\/\//.test(g.source?.url||''),'grade source must be HTTPS: '+g.id)}
for(const s of D.selectionCatalog){ok(!selectionIds.has(s.id),'duplicate selection '+s.id);selectionIds.add(s.id);ok(families.has(s.familyId),'unknown selection family '+s.familyId);ok(s.tier==='COMMON'||s.tier==='SPECIALTY','bad tier '+s.id)}
const common=D.selectionCatalog.filter(x=>x.tier==='COMMON'),specialty=D.selectionCatalog.filter(x=>x.tier==='SPECIALTY');eq(common.length,50);eq(specialty.length,14);
let seed=0x50C0FFEE>>>0;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<200;i++){
 const s=D.selectionCatalog[Math.floor(rnd()*D.selectionCatalog.length)];ok(!!s,'sample exists');ok(families.has(s.familyId),'sample family exists');ok(typeof s.name==='string'&&s.name.length>1,'sample name');
 const familyGrades=D.grades.filter(g=>g.familyId===s.familyId);if(familyGrades.length){const g=familyGrades[Math.floor(rnd()*familyGrades.length)];ok(/^https:\/\//.test(g.source.url),'sample grade provenance');ok(['PRIMARY_SUPPLIER','PRIMARY_SUPPLIER_GUIDE','SECONDARY_SUPPLIER_ATTRIBUTED'].includes(g.source.level),'sample source level')}
}
for(const id of ['MDPE','LLDPE','EVA','POE','TPO','TPV','TPCET','PEBA','IONOMER','PLA','PA11','PA12','PVC','CPVC','PCPBT','PCPET','PPEPS'])ok(families.has(id),'new family '+id);
for(const id of ['PPS','PEEK','PPA','PEI','PPSU','PSU','PESU','LCP','PVDF','PAI','PAEK','PEKK','PARA','COC'])ok(specialty.some(x=>x.familyId===id),'specialty selector '+id);
console.log(`qa-material-common-catalog-200: PASS — ${audit.familyCount} families, ${audit.gradeCount} records, ${common.length} common + ${specialty.length} specialty selections, ${assertions} assertions`);