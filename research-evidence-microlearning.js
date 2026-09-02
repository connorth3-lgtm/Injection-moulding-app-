/* MouldMaster contextual research microlearning bridge — 2026.09.02.2 */
(function(){
'use strict';
const VERSION='2026.09.02.2';
function build(input,limit=2){const e=window.MM_RESEARCH_EVIDENCE;if(!e)return[];return e.retrieve(input,limit).map(r=>({mechanismId:r.id,title:r.title,evidenceState:r.status,applicability:r.applicability.label,lesson:`Why it matters: ${r.claim}`,lookFor:(r.supports||[])[0]||r.nextEvidence,dontAssume:r.limitation,nextCheck:r.nextEvidence}))}
function hash(text){let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rotate(items,offset){const xs=items.slice(),n=xs.length;if(!n)return xs;const k=((Number(offset)||0)%n+n)%n;return xs.slice(k).concat(xs.slice(0,k))}
function buildPractice(input,extra={}){
  const e=window.MM_RESEARCH_EVIDENCE;if(!e)return null;
  const r=e.retrieve(input,1)?.[0];if(!r)return null;
  const plan=e.verificationPlan(input,r.id);if(!plan)return null;
  const observed=String(extra.observed||'A site-local process signal has moved away from its known-good reference.').trim();
  const options=[
    {key:'discriminating-check',text:plan.strongestNextCheck,correct:true,feedback:'This is the strongest answer because it collects independent local evidence that can support or weaken the proposed mechanism before a production conclusion is made.'},
    {key:'display-only',text:'Recheck only the displayed command or setpoint and assume it represents the actual process response.',correct:false,feedback:'Displayed commands and setpoints are not the same as measured actual behaviour. A useful check should observe the relevant actual or physical outcome.'},
    {key:'broad-adjustment',text:'Make a broad process adjustment and judge success from appearance alone.',correct:false,feedback:'A broad adjustment changes several variables at once and appearance may not represent the physical outcome. It weakens diagnosis rather than discriminating between explanations.'},
    {key:'assume-cause',text:'Treat the research match as the confirmed root cause because the signal moved.',correct:false,feedback:'Research fit ranks explanations; it does not prove causation. Local measured evidence, a controlled check and recovery evidence are still required.'}
  ];
  const shuffled=rotate(options,hash(r.id)%options.length),correctIndex=shuffled.findIndex(x=>x.correct);
  return {
    id:`run-insight-${r.id}`,mechanismId:r.id,title:r.title,
    prompt:`${observed} Which next step gives the strongest discriminating evidence?`,
    options:shuffled,correctIndex,
    rationale:`The aim is not to guess a setting. The aim is to choose the measurement or controlled check that can distinguish this explanation from realistic alternatives.`,
    weakeningQuestion:'What finding would most weaken this explanation?',
    weakeningAnswer:(r.weakens||[])[0]||'Independent actual measurements remain stable while the physical outcome changes.',
    recoveryAnswer:plan.recoveryCriterion,
    boundary:'Formative practice only. It does not change formal assessment results, authorize production changes or convert research relevance into proof of root cause.'
  }
}
window.MM_RESEARCH_MICROLEARNING={version:VERSION,build,buildPractice,scope:'Contextual microlearning generated only from promoted mechanism claims. Run-linked practice teaches evidence discrimination and rule-out reasoning; it remains outside the formal assessment bank and exposes no formal answer keys before grading.'};
})();
