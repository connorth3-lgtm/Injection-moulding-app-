/* Deterministic 200-case QA for expanded 60-common/20-specialty material catalog */
'use strict';
const assert=require('assert'),D=require('./material-expanded-catalog-extension.js');
let assertions=0;const ok=(v,m)=>{assert.ok(v,m);assertions++},eq=(a,b,m)=>{assert.strictEqual(a,b,m);assertions++};
const audit=D.expandedCatalogAudit();eq(audit.errors.length,0,audit.errors.join('\n'));eq(audit.familyCount,66,'expected 66 material families');eq(audit.gradeCount,67,'expected 67 representative grade/family records');eq(audit.commonSelectionCount,60,'expected 60 common selector entries');eq(audit.specialtySelectionCount,20,'expected 20 specialty selector entries');eq(audit.selectionCount,80,'expected 80 total selector entries');eq(audit.addedFamilyCount,16);eq(audit.addedGradeCount,16);
const families=new Set(D.families.map(x=>x.id)),grades=new Set(),selections=new Set();
for(const x of D.grades){ok(!grades.has(x.id),'duplicate grade '+x.id);grades.add(x.id);ok(families.has(x.familyId),'grade family exists '+x.id);ok(/^https:\/\//.test(x.source?.url||''),'HTTPS source '+x.id)}
for(const s of D.selectionCatalog){ok(!selections.has(s.id),'duplicate selection '+s.id);selections.add(s.id);ok(families.has(s.familyId),'selection family exists '+s.id);ok(s.tier==='COMMON'||s.tier==='SPECIALTY','valid tier '+s.id)}
const common=D.selectionCatalog.filter(x=>x.tier==='COMMON'),specialty=D.selectionCatalog.filter(x=>x.tier==='SPECIALTY');eq(common.length,60);eq(specialty.length,20);
for(const id of ['MABS','AES','SBC','SEBS','SMMA','PPEPA','MBS','ABSPA','ASAPA','ASAPC'])ok(common.some(x=>x.familyId===id),'new common selector '+id);
for(const id of ['SPS','PMP','ETFE','FEP','PFA','EFEP'])ok(specialty.some(x=>x.familyId===id),'new specialty selector '+id);
let seed=0x60C0FFEE>>>0;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<200;i++){
 const s=D.selectionCatalog[Math.floor(rnd()*D.selectionCatalog.length)];ok(!!s,'sample selection');ok(families.has(s.familyId),'sample family');
 const familyGrades=D.grades.filter(x=>x.familyId===s.familyId);ok(familyGrades.length>0,'every selected family has at least one representative record: '+s.familyId);
 const x=familyGrades[Math.floor(rnd()*familyGrades.length)];ok(/^https:\/\//.test(x.source.url),'sample provenance');ok(['PRIMARY_SUPPLIER','PRIMARY_SUPPLIER_GUIDE','SECONDARY_SUPPLIER_ATTRIBUTED'].includes(x.source.level),'sample evidence level');
}
console.log(`qa-material-expanded-catalog-200: PASS — ${audit.familyCount} families, ${audit.gradeCount} records, ${common.length} common + ${specialty.length} specialty selections, ${assertions} assertions`);