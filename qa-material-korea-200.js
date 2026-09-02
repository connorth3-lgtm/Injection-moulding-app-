/* Deterministic South Korea material/grade audit — 2026.09.03.1 */
'use strict';
const assert=require('assert');
const D=require('./material-korea-grade-extension.js');
const a=D.koreaGradeAudit();
assert.deepStrictEqual(a.errors,[],'Korea grade audit errors: '+a.errors.join('; '));
assert(a.koreanSupplierCount>=9,'expected >=9 Korean supplier sources');
assert(a.familyCount>=87,'expected >=87 families after POKETONE');
assert(a.gradeCount>=88,'expected >=88 representative records after POKETONE');
assert(a.selectionCount>=141,'expected >=141 selectors after POKETONE');
for(const id of ['ABS','SAN','POM','PBT','PA','COPOLYESTER','PK'])assert((a.counts[id]||0)>=10,id+' must have >=10 Korean source-backed grade identities');
let seed=0x4B4F5245,assertions=0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const ids=D.gradeIdentities.filter(x=>x.country==='KR');
for(let i=0;i<200;i++){
 const x=ids[Math.floor(rand()*ids.length)];
 assert(x&&x.familyId&&x.supplier&&x.grade);assertions+=4;
 assert.strictEqual(x.country,'KR');assertions++;
 assert.strictEqual(x.evidenceType,'COMMERCIAL_GRADE_IDENTITY');assertions++;
 assert.strictEqual(x.processDataAuthority,false);assertions++;
 assert(/^https:\/\//.test(x.source.url));assertions++;
 assert(D.families.some(f=>f.id===x.familyId));assertions++;
}
console.log(`qa-material-korea-200: PASS — 200 deterministic cases, ${assertions} assertions, ${ids.length} Korean grade identities, ${a.koreanSupplierCount} supplier groups, ${a.familyCount} families, ${a.selectionCount} selections`);