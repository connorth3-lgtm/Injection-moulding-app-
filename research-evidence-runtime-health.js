/* MouldMaster research evidence runtime health — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
function check(){const e=window.MM_RESEARCH_EVIDENCE,u=window.MM_RESEARCH_EVIDENCE_UI,a=window.MM_RESEARCH_ADAPTER,w=window.MM_RESEARCH_WORKSPACE,m=window.MM_RESEARCH_MICROLEARNING;const issues=[];if(!e)issues.push('engine-missing');else{const s=e.sourceCoverage?.()||{};if(s.mechanisms!==12)issues.push('mechanism-count');if(s.promoted!==12)issues.push('promotion-count');if(s.primaryMeasuredLinks<24)issues.push('primary-source-links')}if(!u)issues.push('ui-missing');if(!a)issues.push('adapter-missing');if(!w)issues.push('workspace-bridge-missing');if(!m)issues.push('microlearning-bridge-missing');return {version:VERSION,ok:issues.length===0,issues}}
window.MM_RESEARCH_EVIDENCE_HEALTH={version:VERSION,check};
})();
