/* Deterministic 200-case deep material/provenance QA */
'use strict';
const assert=require('assert'),D=require('./material-engineering-deep-extension.js');
let assertions=0;const ok=(v,m)=>{assert.ok(v,m);assertions++},eq=(a,b,m)=>{assert.strictEqual(a,b,m);assertions++};
const audit=D.deepAudit();eq(audit.errors.length,0,audit.errors.join('\n'));ok(audit.familyCount>=33,'expected >=33 families');ok(audit.gradeCount>=34,'expected >=34 grades');eq(audit.addedFamilyCount,9);eq(audit.addedGradeCount,9);
for(const id of ['PVDF','PSU','PESU','PAI','PAEK','PEKK','COC','COPOLYESTER','PARA'])ok(D.families.some(f=>f.id===id),'missing family '+id);
for(const id of ['ARKEMA-KYNAR-720','SYENSQO-UDEL-P1700-WH7407','SYENSQO-VERADEL-HC-A301','SYENSQO-TORLON-4203L-HF','SYENSQO-AVASPIRE-AV651-NT','ARKEMA-KEPSTAN-8010C30','TOPAS-6013S-04','EASTMAN-TRITAN-TX1001','SYENSQO-IXEF-GS1022-WH01'])ok(D.get(id),'missing grade '+id);
const k=D.get('ARKEMA-KYNAR-720');eq(k.densityGcm3,1.78);eq(k.injection.moldC,null,'do not reinterpret source terminal column as mould temperature');eq(k.shrinkage.parallelPct.min,2);eq(k.shrinkage.normalPct.max,3);
const u=D.get('SYENSQO-UDEL-P1700-WH7407');eq(u.drying.tempC,135);eq(u.drying.timeH,4);eq(u.drying.maxMoisturePct,.05);eq(u.injection.moldC.min,140);eq(u.processFlags.hotRunnerGenerallyRecommended,false);
eq(D.get('SYENSQO-TORLON-4203L-HF').processFlags.postCureRequired,true);eq(D.get('SYENSQO-TORLON-4203L-HF').injection.meltC,null);eq(D.get('EASTMAN-TRITAN-TX1001').injection.meltC,null);eq(D.get('SYENSQO-IXEF-GS1022-WH01').drying.tempC,null);
let seed=0xD33F200>>>0;const rnd=()=>{seed=(1103515245*seed+12345)>>>0;return seed/4294967296};
const rangeOk=v=>v==null||typeof v==='number'||(typeof v==='object'&&(!Number.isFinite(v.min)||!Number.isFinite(v.max)||v.min<=v.max));
for(let i=0;i<200;i++){const g=D.grades[Math.floor(rnd()*D.grades.length)];ok(g&&g.id,'sample has id');ok(D.families.some(f=>f.id===g.familyId),'sample family exists');ok(/^https:\/\//.test(g.source.url),'sample source URL');ok(Object.values(D.sourceLevels).includes(g.source.level),'sample source level');ok(rangeOk(g.drying?.tempC),'dry temp range');ok(rangeOk(g.drying?.timeH),'dry time range');ok(rangeOk(g.injection?.meltC),'melt range');ok(rangeOk(g.injection?.moldC),'mould range');ok(rangeOk(g.shrinkage?.parallelPct),'shrink parallel');ok(rangeOk(g.shrinkage?.normalPct),'shrink normal');}
console.log(`qa-material-engineering-deep-200: PASS — 200 deterministic material cases, ${assertions} assertions, ${audit.familyCount} families, ${audit.gradeCount} grades`);
