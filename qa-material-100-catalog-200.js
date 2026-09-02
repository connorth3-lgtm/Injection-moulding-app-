/* Deterministic 200-case QA for 100-material catalog */
'use strict';
const assert=require('assert'),D=require('./material-100-catalog-extension.js');
let assertions=0;const ok=(v,m)=>{assert.ok(v,m);assertions++},eq=(a,b,m)=>{assert.strictEqual(a,b,m);assertions++};
const audit=D.material100CatalogAudit();eq(audit.errors.length,0,audit.errors.join('\n'));eq(audit.familyCount,71,'expected 71 material families');eq(audit.gradeCount,72,'expected 72 representative grade/family records');eq(audit.commonSelectionCount,72,'expected 72 common selections');eq(audit.specialtySelectionCount,28,'expected 28 specialty selections');eq(audit.selectionCount,100,'expected exactly 100 selectable materials');eq(audit.addedFamilyCount,5);eq(audit.addedGradeCount,5);
const families=new Set(D.families.map(x=>x.id)),gradeIds=new Set(),selectionIds=new Set();
for(const g of D.grades){ok(!gradeIds.has(g.id),'duplicate grade '+g.id);gradeIds.add(g.id);ok(families.has(g.familyId),'unknown grade family '+g.familyId);ok(/^https:\/\//.test(g.source?.url||''),'grade source must be HTTPS: '+g.id)}
for(const s of D.selectionCatalog){ok(!selectionIds.has(s.id),'duplicate selection '+s.id);selectionIds.add(s.id);ok(families.has(s.familyId),'unknown selection family '+s.familyId);ok(s.tier==='COMMON'||s.tier==='SPECIALTY','bad tier '+s.id)}
for(const id of ['PA46','PA410','PA610','PA612','PCT'])ok(families.has(id),'new family '+id);
for(const id of ['PP-LGF','PP-CF','PC-OPTICAL','PC-MEDICAL','PMMA-IMPACT','POM-LUBE','POM-GF','PA6-CF','PA66-CF','PBT-FR','TPU-FR','TPU-TRANSPARENT','PPS-GF','PEEK-CF','PPA-GF','PA46','PA410','PA610','PA612','PCT'])ok(selectionIds.has(id),'new selector '+id);
const pa612=D.grades.find(x=>x.id==='EMS-GRILAMID-2D-PA612');ok(pa612?.source?.level===D.sourceLevels.GUIDE,'PA612 family processing must remain guide-level');
const pct=D.grades.find(x=>x.id==='CELANESE-THERMX-CGT33');eq(pct?.injection?.meltC?.min,295);eq(pct?.injection?.meltC?.max,310);eq(pct?.drying?.tempC,95);eq(pct?.shrinkage?.parallelPct,.3);eq(pct?.shrinkage?.normalPct,.8);
let seed=0x100C0FFE>>>0;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<200;i++){
 const s=D.selectionCatalog[Math.floor(rnd()*D.selectionCatalog.length)];ok(!!s,'sample selection exists');ok(families.has(s.familyId),'sample family exists');ok(typeof s.name==='string'&&s.name.length>1,'sample name');
 const familyGrades=D.grades.filter(g=>g.familyId===s.familyId);if(familyGrades.length){const g=familyGrades[Math.floor(rnd()*familyGrades.length)];ok(/^https:\/\//.test(g.source.url),'sample grade provenance');ok(['PRIMARY_SUPPLIER','PRIMARY_SUPPLIER_GUIDE','SECONDARY_SUPPLIER_ATTRIBUTED'].includes(g.source.level),'sample source level')}
}
console.log(`qa-material-100-catalog-200: PASS — ${audit.familyCount} families, ${audit.gradeCount} records, ${audit.commonSelectionCount} common + ${audit.specialtySelectionCount} specialty = ${audit.selectionCount} selections, ${assertions} assertions`);