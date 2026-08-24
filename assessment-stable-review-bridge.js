/* MouldMaster stable spaced-review ID bridge — 2026-08-24.2 */
(function(){
'use strict';
if(!window.MM_ASSESSMENT_QUALITY||typeof window.getExamQuestions!=='function')throw new Error('Assessment quality suite must load before stable review bridge');
const base=window.getExamQuestions;
window.getExamQuestions=function(){
 const rows=base.apply(this,arguments);
 rows.forEach(q=>{if(q&&q.stableId)q.mmId=q.stableId});
 return rows;
};
window.MM_STABLE_REVIEW_BRIDGE={version:'2026.08.24.2',stableIdsPrimary:true,legacyRecordsMigratedBy:'assessment-quality-suite.js'};
})();
