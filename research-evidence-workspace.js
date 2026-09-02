/* MouldMaster research evidence workspace bridge — 2026.09.02.2 */
(function(){
'use strict';
const VERSION='2026.09.02.2';
function contextFromCase(c){
  c=c&&typeof c==='object'?c:{};
  return {
    text:[c.title,c.defect,c.onset,c.location,c.baseline,c.evidence,c.hypothesis,c.controlledTest,c.testResult,c.afterChange,c.verification,c.conclusion,c.symptoms,c.hypotheses,c.tests,c.outcomes,c.notes].filter(Boolean).join(' '),
    materials:[c.materialFamily,c.material,c.materialGrade].filter(Boolean),
    process:[c.processFamily,'injection moulding'].filter(Boolean),
    tooling:[c.mould,c.mold,c.tool].filter(Boolean),
    sensors:Array.isArray(c.sensors)?c.sensors:[],
    signals:Array.isArray(c.signals)?c.signals:[],
    outcomes:[c.defect,...(Array.isArray(c.qualityOutcomes)?c.qualityOutcomes:[])].filter(Boolean)
  }
}
function enrich(c){const e=window.MM_RESEARCH_EVIDENCE;if(!e)return {...c,researchEvidence:[]};const ctx=contextFromCase(c),researchEvidence=e.retrieve(ctx,5);return {...c,researchEvidence,researchVerificationPlan:researchEvidence[0]?e.verificationPlan(ctx,researchEvidence[0].id):null}}
function similarEvidence(cases,target){const t=enrich(target),ids=new Set((t.researchEvidence||[]).map(x=>x.id));return (cases||[]).map(c=>{const e=enrich(c),shared=(e.researchEvidence||[]).filter(x=>ids.has(x.id)).map(x=>x.id);return {case:c,sharedMechanisms:shared,score:shared.length}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)}
window.MM_RESEARCH_WORKSPACE={version:VERSION,contextFromCase,enrich,similarEvidence,scope:'Adds research mechanism context to troubleshooting cases without turning research into a production verdict.'};
})();
