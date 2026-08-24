/* MouldMaster legacy spaced-review ID compatibility — 2026-08-24 */
(function(){
'use strict';
const S=window.MM_ASSESSMENT_SYSTEM;
if(!S||typeof S.buildExam!=='function')throw new Error('Assessment system must load before review-ID compatibility');
const LEGACY_REVIEW_BANK='2026.08.21.1';
const base=S.buildExam;
function indexOf(q){const m=/(\d+)$/.exec(String(q.stableId||''));return m?Math.max(0,Number(m[1])-1):0}
function buildExam(level,region){
 const rows=base(level,region);
 rows.forEach(q=>{
  const i=indexOf(q);
  q.mmId=q.kind==='regional'?`reg:${LEGACY_REVIEW_BANK}:${q.region}:${level}:${i}`:`tech:${LEGACY_REVIEW_BANK}:${level}:${i}`;
 });
 return rows;
}
S.buildExam=buildExam;
S.legacyReviewBankVersion=LEGACY_REVIEW_BANK;
S.stableIdsArePrimary=true;
window.getExamQuestions=buildExam;
window.MM_ASSESSMENT_REVIEW_ID_COMPAT={version:'2026-08-24',legacyReviewBankVersion:LEGACY_REVIEW_BANK,currentQuestionBankVersion:S.bankVersion};
})();
