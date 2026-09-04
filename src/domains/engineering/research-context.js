/* MouldMaster engineering case -> governed research context adapter — 2026.09.04.2 */
(function(root,factory){
'use strict';
const api=factory(root||globalThis);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root&&!root.MM_ENGINEERING_RESEARCH_CONTEXT)root.MM_ENGINEERING_RESEARCH_CONTEXT=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const VERSION='2026.09.04.2';
const RANKING_FIELDS=Object.freeze([
  'title','defect','onset','location','baseline','evidence','testResult','afterChange','verification',
  'material','materialGradeId','machine','machineId','mould','mouldId','cavityId'
]);
const EXCLUDED_REASONING_FIELDS=Object.freeze(['hypothesis','controlledTest','conclusion']);
const PLAN_APPLICABILITY=Object.freeze(['high','moderate']);
const BOUNDARY='Engineering-case research matching is read-only decision support. A ranked promoted mechanism is not a diagnosis or local root-cause finding and does not authorize production changes. Production decisions require local measured evidence, validated process limits, supplier/machine/tool documentation, approved site procedures and applicable safety controls.';
const BIAS_BOUNDARY='Learner-entered hypothesis, planned controlled test and conclusion are intentionally excluded from research ranking so the adapter does not simply reinforce an existing causal claim.';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function services(){return{research:root.MM_GOVERNED_RESEARCH||null,store:root.MM_ENGINEERING_STORE||null}}
function values(record,fields){return fields.map(k=>[k,clean(record?.[k])]).filter(([,v])=>v)}
function contextFromCase(record={}){
  const rows=values(record,RANKING_FIELDS),by=Object.fromEntries(rows),sourceFields=rows.map(([k])=>k);
  const text=['title','defect','onset','location','baseline','evidence','testResult','afterChange','verification'].map(k=>by[k]).filter(Boolean).join('. ');
  const input={
    text,
    materials:[by.material,by.materialGradeId].filter(Boolean),
    process:['injection moulding',by.machine,by.machineId].filter(Boolean),
    tooling:[by.mould,by.mouldId,by.cavityId].filter(Boolean),
    symptoms:[by.defect,by.location,by.onset].filter(Boolean),
    outcomes:[by.testResult,by.afterChange,by.verification].filter(Boolean)
  };
  const excludedFields=EXCLUDED_REASONING_FIELDS.filter(k=>clean(record?.[k]));
  return Object.freeze({input:Object.freeze(input),sourceFields:Object.freeze(sourceFields),excludedFields:Object.freeze(excludedFields),hasContext:sourceFields.length>0});
}
function candidateView(row){return Object.freeze({
  mechanismId:row.id,
  title:row.title,
  evidenceState:row.evidenceState,
  evidenceQuality:row.evidenceQuality,
  applicability:row.applicability,
  mechanismContext:row.whyItMatters,
  collect:Object.freeze((row.desiredEvidence||[]).slice()),
  limitation:row.limitation,
  sources:Object.freeze((row.sources||[]).map(x=>Object.freeze({...x})))
})}
function analyzeCase(record={},limit=5){
  const {research}=services();
  if(!research||typeof research.retrieve!=='function')throw new Error('MM_GOVERNED_RESEARCH must load before engineering research context');
  const context=contextFromCase(record);
  if(!context.hasContext)return Object.freeze({schemaVersion:1,caseId:clean(record?.id)||null,status:'no-context',sourceFields:context.sourceFields,excludedFields:context.excludedFields,candidates:Object.freeze([]),boundary:BOUNDARY,biasBoundary:BIAS_BOUNDARY});
  const rows=research.retrieve(context.input,limit);
  return Object.freeze({
    schemaVersion:1,
    caseId:clean(record?.id)||null,
    status:rows.length?'candidates':'no-governed-match',
    sourceFields:context.sourceFields,
    excludedFields:context.excludedFields,
    candidates:Object.freeze(rows.map(candidateView)),
    boundary:BOUNDARY,
    biasBoundary:BIAS_BOUNDARY
  });
}
function evidencePlan(record={},mechanismId){
  const {research}=services();
  if(!research||typeof research.localEvidencePlan!=='function')throw new Error('MM_GOVERNED_RESEARCH must load before engineering research context');
  const mechanism=clean(mechanismId);
  if(!mechanism)return null;
  const analysis=analyzeCase(record,12),candidate=analysis.candidates.find(x=>x.mechanismId===mechanism);
  if(!candidate||!PLAN_APPLICABILITY.includes(candidate.applicability))return Object.freeze({schemaVersion:1,caseId:clean(record?.id)||null,mechanismId:mechanism,status:'not-supported-by-case-context',applicability:candidate?.applicability||'unknown',plan:null,boundary:BOUNDARY});
  const context=contextFromCase(record),plan=research.localEvidencePlan(context.input,mechanism);
  return Object.freeze({schemaVersion:1,caseId:clean(record?.id)||null,mechanismId:mechanism,status:'candidate-plan',applicability:candidate.applicability,plan:plan?Object.freeze({...plan,collect:Object.freeze((plan.collect||[]).slice()),sources:Object.freeze((plan.sources||[]).map(x=>Object.freeze({...x})))}):null,boundary:BOUNDARY});
}
async function analyzeCaseById(caseId,limit=5,token){
  const {store}=services();
  if(!store||typeof store.getCase!=='function')throw new Error('MM_ENGINEERING_STORE must load before caseId research analysis');
  const record=await store.getCase(String(caseId||''),token);
  return record?analyzeCase(record,limit):null;
}
async function evidencePlanById(caseId,mechanismId,token){
  const {store}=services();
  if(!store||typeof store.getCase!=='function')throw new Error('MM_ENGINEERING_STORE must load before caseId research analysis');
  const record=await store.getCase(String(caseId||''),token);
  return record?evidencePlan(record,mechanismId):null;
}
return Object.freeze({version:VERSION,rankingFields:RANKING_FIELDS,excludedReasoningFields:EXCLUDED_REASONING_FIELDS,planApplicability:PLAN_APPLICABILITY,contextFromCase,analyzeCase,evidencePlan,analyzeCaseById,evidencePlanById,boundary:BOUNDARY,biasBoundary:BIAS_BOUNDARY});
});
