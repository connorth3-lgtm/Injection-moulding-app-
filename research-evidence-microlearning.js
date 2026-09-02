/* MouldMaster contextual research microlearning bridge — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
function build(input,limit=2){const e=window.MM_RESEARCH_EVIDENCE;if(!e)return[];return e.retrieve(input,limit).map(r=>({mechanismId:r.id,title:r.title,evidenceState:r.status,applicability:r.applicability.label,lesson:`Why it matters: ${r.claim}`,lookFor:(r.supports||[])[0]||r.nextEvidence,dontAssume:r.limitation,nextCheck:r.nextEvidence}))}
window.MM_RESEARCH_MICROLEARNING={version:VERSION,build,scope:'Contextual microlearning generated only from promoted mechanism claims; no assessment answers are exposed before grading.'};
})();
