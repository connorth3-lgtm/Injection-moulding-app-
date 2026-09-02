/* MouldMaster research claim freshness registry — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
const REVIEWED='2026-09-02',REVIEW_BY='2026-12-02';
const CATEGORIES=['confirmation','contradiction','boundary-refinement','new-measurement-method','replication','superseding-method','unrelated'];
function classifyCandidate(candidate){const x=candidate&&typeof candidate==='object'?candidate:{},tags=Array.isArray(x.tags)?x.tags.map(v=>String(v).toLowerCase()):[],text=`${x.title||''} ${x.summary||''}`.toLowerCase();if(tags.includes('contradiction')||/contradict|opposite result|failed to reproduce/.test(text))return'contradiction';if(tags.includes('boundary')||/only when|limited to|depends on|boundary condition/.test(text))return'boundary-refinement';if(tags.includes('replication')||/replicat|reproduc/.test(text))return'replication';if(tags.includes('measurement')||/sensor|measurement method|metrology/.test(text))return'new-measurement-method';if(tags.includes('superseding')||/outperform|replacement method|supersed/.test(text))return'superseding-method';if(tags.includes('confirmation')||/confirm|consistent with|supports/.test(text))return'confirmation';return'unrelated'}
function reviewItem(candidate){const category=classifyCandidate(candidate);return {category,requiresHumanReview:category!=='unrelated',autoChangesEvidenceState:false,note:'Candidate classification is a review-queue hint only. Evidence promotion, contradiction or limitation changes require human verification against the primary source and existing mechanism dossier.'}}
window.MM_RESEARCH_CLAIM_FRESHNESS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,categories:CATEGORIES,classifyCandidate,reviewItem};
})();
