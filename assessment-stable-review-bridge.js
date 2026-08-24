/* MouldMaster stable spaced-review ID + blueprint guard — 2026-08-24.2 */
(function(){
'use strict';
const S=window.MM_ASSESSMENT_QUALITY;
if(!S||typeof window.getExamQuestions!=='function')throw new Error('Assessment quality suite must load before stable review bridge');
const base=window.getExamQuestions;
window.getExamQuestions=function(){
 const rows=base.apply(this,arguments);
 const technical=rows.filter(q=>q&&q.kind==='technical');
 const covered=new Set();
 technical.forEach(q=>(Array.isArray(q.competencies)&&q.competencies.length?q.competencies:[q.competency]).filter(Boolean).forEach(c=>covered.add(c)));
 const missing=(S.blueprint||[]).filter(c=>!covered.has(c));
 if(missing.length)throw new Error(`Assessment blueprint incomplete: missing ${missing.join(', ')}`);
 rows.forEach(q=>{if(q&&q.stableId)q.mmId=q.stableId});
 return rows;
};
window.MM_STABLE_REVIEW_BRIDGE={version:'2026.08.24.2',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js'};
})();
