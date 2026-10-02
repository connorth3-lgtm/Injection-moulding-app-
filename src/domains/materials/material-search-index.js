/* MouldMaster material search index — 2026.09.29 */
(function(){
'use strict';
if(window.MM_MATERIAL_SEARCH)return;
const VERSION='2026.09.30.3';
let state=null;
let readyPromise=null;

function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function tokens(v){return [...new Set(norm(v).split(/\s+/).filter(Boolean))]}
function flat(v){
  if(Array.isArray(v))return v.map(flat).join(' ');
  if(v&&typeof v==='object')return Object.values(v).map(flat).join(' ');
  return clean(v);
}
const COUNTRY_REGION={
  'South Korea':'Asia-Pacific','Singapore':'Asia-Pacific','Japan':'Asia-Pacific','China':'Asia-Pacific','Taiwan':'Asia-Pacific','Thailand':'Asia-Pacific','Vietnam':'Asia-Pacific','Malaysia':'Asia-Pacific','India':'Asia-Pacific','Australia':'Asia-Pacific','New Zealand':'Asia-Pacific',
  'Germany':'Europe','Belgium':'Europe','Netherlands':'Europe','France':'Europe','United Kingdom':'Europe','United States':'North America','Canada':'North America'
};
function manufacturerCountry(g){return clean(g?.manufacturer?.country)}
function catalogRegion(g){const country=manufacturerCountry(g);return COUNTRY_REGION[country]||'Other / unclassified'}
function sourceTextForTagging(g){return norm([flat(g?.composition),flat(g?.applications),flat(g?.processing),flat(g?.approvals),flat(g?.identity)].join(' '))}
const APPLICATION_RULES=[
  ['Automotive',/automotive|vehicle|car\b|bumper|interior trim/],
  ['Electrical / electronics',/electrical|electronic|connector|appliance|home electronics/],
  ['Food / beverage',/food|beverage|container|bottle|cap\b|closure/],
  ['Medical / healthcare',/medical|healthcare|syringe|diagnostic/],
  ['Consumer goods',/consumer|household|home appliance|cosmetic|baby care/],
  ['Industrial',/industrial|engineering part|machine part|gear|bearing/],
  ['Packaging',/packaging|thin wall|container|closure|cap\b/],
  ['Optical / transparent',/transparent|transparency|optical|clear|high gloss/],
  ['Building / construction',/building|construction|insulation|thermal insulation|drainage pipe|sewage pipe/]
];
const PROCESS_RULES=[
  ['Injection moulding',/injection|injection mould|injection mold/],
  ['Thin-wall injection',/thin wall|thin-wall/],
  ['Extrusion',/extrusion|extrud/],
  ['Blow moulding',/blow mould|blow mold/],
  ['Compression moulding',/compression mould|compression mold|\bccm\b/],
  ['Two-component / LSR',/two component|2 component|lsr|liquid silicone/],
  ['EPS pre-expansion / steam moulding',/expandable polystyrene|\beps\b|pre-expansion|steam mould|steam mold|foaming/],
  ['Thermoforming',/thermoform|vacuum forming|pressure forming/],
  ['Film extrusion',/\bbopp\b|\bcpp\b|packaging film|film extrusion|metallizing/],
  ['Spunbond / fibre',/spunbond|non-woven|nonwoven|filament|\bfiber\b|\bfibre\b/],
  ['Coating / lamination',/coating|lamination|laminating|neck-in/],
  ['Compounding',/compounding|compounder/],
  ['Pipe extrusion',/sewage pipe|drainage pipe|pipe extrusion|ppr pipe/]
];
function taxonomyTags(g,rules){const text=sourceTextForTagging(g);return rules.filter(([,rx])=>rx.test(text)).map(([label])=>label)}
const GOVERNED_PROCESS_EXCLUSIONS={
  EPS:new Set(['Injection moulding','Thin-wall injection'])
};
function processTags(g){
  const tags=taxonomyTags(g,PROCESS_RULES);
  const blocked=GOVERNED_PROCESS_EXCLUSIONS[clean(g?.polymer?.family).toUpperCase()];
  return blocked?tags.filter(label=>!blocked.has(label)):tags;
}
function propertyKinds(g){
  const names=(g?.properties||[]).map(o=>norm(o?.property));
  return {
    rheology:names.some(n=>/melt flow|mfr|mfi|mvr|melt index/.test(n)),
    shrinkage:names.some(n=>/shrink/.test(n)),
    thermal:names.some(n=>/heat deflection|hdt|vicat|melting|glass transition|thermal/.test(n)),
    mechanical:names.some(n=>/tensile|flexural|impact|modulus|strength/.test(n)),
    processing:(g?.processing||[]).length>0,
    comparisonReady:(g?.properties||[]).some(o=>o?.comparisonReady===true),
    primarySource:(g?.sources||[]).some(s=>/manufacturer/.test(norm(s?.kind))||clean(s?.publisher)===clean(g?.manufacturer?.name)),
    regulatorySource:(g?.sources||[]).some(s=>norm(s?.kind)==='regulatory')
  };
}
function evidenceBadges(g){
  const e=propertyKinds(g),out=[];
  if(clean(g?.provenance?.stage)==='validated')out.push(e.primarySource?'Validated · primary-source backed':e.regulatorySource?'Validated record · regulatory evidence':'Validated record · source-qualified');
  if(e.comparisonReady)out.push('Comparison-ready property');
  if(e.rheology)out.push('Rheology');
  if(e.shrinkage)out.push('Shrinkage');
  if(e.thermal)out.push('Thermal');
  if(e.processing)out.push('Processing guidance');
  if(e.primarySource)out.push('Primary source');
  if(!e.primarySource&&e.regulatorySource)out.push('Regulatory evidence');
  return out;
}
function gradeSearchable(g){return [g?.id,g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend,g?.identity?.variantId,g?.identity?.regionalVariant,manufacturerCountry(g),catalogRegion(g),...taxonomyTags(g,APPLICATION_RULES),...processTags(g),...evidenceBadges(g),g?.production?.country,g?.production?.plant].filter(Boolean).join(' ')}
function add(map,key,id){if(!key)return;let bucket=map.get(key);if(!bucket){bucket=new Set();map.set(key,bucket)}bucket.add(id)}
function intersect(left,right){if(!left)return new Set(right||[]);if(!right)return new Set();const out=new Set();const [small,large]=left.size<=right.size?[left,right]:[right,left];for(const value of small)if(large.has(value))out.add(value);return out}
function titleForGrade(g){return [g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function documentRecord({id,type,title,subtitle='',searchText='',sourceIds=[],materialGradeId=null,payload=null,catalog=null}){
  return {id,type,title,subtitle,searchText,sourceIds:[...new Set((sourceIds||[]).map(clean).filter(Boolean))],materialGradeId,payload,catalog};
}
function exactGradeDocument(g){
  const propertyText=(g?.properties||[]).map(o=>[o.property,o.value,o.unit,o.testMethod,o.temperatureC,o.loadKg,o.specimen,o.conditioning,o.direction,o.limitations].filter(x=>x!==null&&x!==undefined).join(' '));
  const processingText=(g?.processing||[]).map(o=>[o.parameter,o.value,o.min,o.max,o.unit,o.condition,o.claimType].filter(x=>x!==null&&x!==undefined).join(' '));
  const sourceText=(g?.sources||[]).map(s=>[s.publisher,s.title,s.kind,s.revision,s.documentDate,s.url].filter(Boolean).join(' '));
  return documentRecord({
    id:'grade:'+g.id,type:'exact-grade',title:titleForGrade(g),
    subtitle:[g?.polymer?.family,g?.polymer?.morphology].map(clean).filter(Boolean).join(' · '),
    searchText:[gradeSearchable(g),flat(g?.composition),...propertyText,...processingText,...sourceText,flat(g?.provenance),flat(g?.lifecycle)].join(' '),
    sourceIds:(g?.sources||[]).map(s=>s.id),materialGradeId:g.id,payload:g,
    catalog:{region:catalogRegion(g),country:manufacturerCountry(g),manufacturerId:clean(g?.manufacturer?.id),manufacturer:clean(g?.manufacturer?.name),family:clean(g?.polymer?.family),applications:taxonomyTags(g,APPLICATION_RULES),processes:processTags(g),evidenceStage:clean(g?.provenance?.stage),evidence:evidenceBadges(g)}
  });
}
function referenceDocuments(){
  const materials=window.MM_REFERENCE_DATA?.materials||[];
  return materials.map((m,i)=>documentRecord({
    id:'reference:'+(norm(m.name)||i),type:'reference-material',title:clean(m.name)||`Material reference ${i+1}`,
    subtitle:clean(m.family),searchText:flat(m),sourceIds:[],payload:m
  }));
}
function labDocuments(){
  const groups=[
    ['material-lab',window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[]],
    ['material-practice',window.MM_MATERIAL_PRACTICE_EXTENSIONS?.labs||[]]
  ];
  const out=[];
  for(const [type,labs] of groups)for(const lab of labs){
    out.push(documentRecord({
      id:type+':'+clean(lab.id),type,title:clean(lab.title)||clean(lab.id),
      subtitle:[lab.level,lab.focus,(lab.materials||[]).join(', ')].map(clean).filter(Boolean).join(' · '),
      searchText:flat(lab),sourceIds:lab.sourceIds||[],payload:lab
    }));
  }
  return out;
}
function build(grades){
  const byId=new Map(),tokenIndex=new Map(),manufacturerIndex=new Map(),familyIndex=new Map(),countryIndex=new Map(),regionIndex=new Map(),ordered=[];
  for(const grade of grades||[]){
    if(!grade?.id||byId.has(grade.id))continue;
    byId.set(grade.id,grade);ordered.push(grade.id);
    for(const token of tokens(gradeSearchable(grade)))add(tokenIndex,token,grade.id);
    add(manufacturerIndex,clean(grade?.manufacturer?.id),grade.id);
    add(familyIndex,norm(grade?.polymer?.family),grade.id);
    add(countryIndex,manufacturerCountry(grade),grade.id);
    add(regionIndex,catalogRegion(grade),grade.id);
  }
  const documents=[...(grades||[]).map(exactGradeDocument),...referenceDocuments(),...labDocuments()];
  const documentById=new Map(),documentTokenIndex=new Map(),typeIndex=new Map(),documentOrder=[];
  for(const doc of documents){
    if(!doc?.id||documentById.has(doc.id))continue;
    documentById.set(doc.id,doc);documentOrder.push(doc.id);
    for(const token of tokens([doc.title,doc.subtitle,doc.searchText,doc.sourceIds.join(' ')].join(' ')))add(documentTokenIndex,token,doc.id);
    add(typeIndex,doc.type,doc.id);
  }
  state={byId,ordered,tokenIndex,manufacturerIndex,familyIndex,countryIndex,regionIndex,documentById,documentTokenIndex,typeIndex,documentOrder};
  return state;
}
async function ensure(){
  if(state)return state;
  if(!readyPromise)readyPromise=(async()=>{
    const registry=window.MM_MATERIAL_REGISTRY;
    if(!registry?.all)throw new Error('MM_MATERIAL_REGISTRY is unavailable');
    return build(await registry.all());
  })();
  return readyPromise;
}
async function searchPage(query,{manufacturerId=null,polymerFamily=null,country=null,region=null,page=1,pageSize=25}={}){
  const index=await ensure();const queryTokens=tokens(query);let ids=null;
  for(const token of queryTokens)ids=intersect(ids,index.tokenIndex.get(token));
  if(ids===null)ids=new Set(index.ordered);
  if(manufacturerId)ids=intersect(ids,index.manufacturerIndex.get(clean(manufacturerId)));
  if(polymerFamily)ids=intersect(ids,index.familyIndex.get(norm(polymerFamily)));
  if(country)ids=intersect(ids,index.countryIndex.get(clean(country)));
  if(region)ids=intersect(ids,index.regionIndex.get(clean(region)));
  const ordered=index.ordered.filter(id=>ids.has(id));const safePageSize=Math.max(1,Math.min(Number(pageSize)||25,100));const total=ordered.length;const pageCount=Math.max(1,Math.ceil(total/safePageSize));const safePage=Math.max(1,Math.min(Number(page)||1,pageCount));const start=(safePage-1)*safePageSize;
  return {items:ordered.slice(start,start+safePageSize).map(id=>index.byId.get(id)),total,page:safePage,pageSize:safePageSize,pageCount,hasPrevious:safePage>1,hasNext:safePage<pageCount};
}
async function searchAllPage(query,{types=null,region=null,country=null,manufacturerId=null,polymerFamily=null,application=null,process=null,evidence=null,page=1,pageSize=20}={}){
  const index=await ensure();const queryTokens=tokens(query);let ids=null;
  for(const token of queryTokens)ids=intersect(ids,index.documentTokenIndex.get(token));
  if(ids===null)ids=new Set(index.documentOrder);
  const selected=[...(types||[])].map(clean).filter(Boolean);
  if(selected.length){
    const allowed=new Set();
    for(const type of selected)for(const id of index.typeIndex.get(type)||[])allowed.add(id);
    ids=intersect(ids,allowed);
  }
  if(region||country||manufacturerId||polymerFamily||application||process||evidence){
    const allowed=new Set();
    for(const id of index.documentOrder){
      const doc=index.documentById.get(id),cat=doc?.catalog;
      if(!cat)continue;
      if(region&&cat.region!==clean(region))continue;
      if(country&&cat.country!==clean(country))continue;
      if(manufacturerId&&cat.manufacturerId!==clean(manufacturerId))continue;
      if(polymerFamily&&norm(cat.family)!==norm(polymerFamily))continue;
      if(application&&!(cat.applications||[]).includes(clean(application)))continue;
      if(process&&!(cat.processes||[]).includes(clean(process)))continue;
      if(evidence&&!(cat.evidence||[]).includes(clean(evidence)))continue;
      allowed.add(id);
    }
    ids=intersect(ids,allowed);
  }
  const ordered=index.documentOrder.filter(id=>ids.has(id));const safePageSize=Math.max(1,Math.min(Number(pageSize)||20,100));const total=ordered.length;const pageCount=Math.max(1,Math.ceil(total/safePageSize));const safePage=Math.max(1,Math.min(Number(page)||1,pageCount));const start=(safePage-1)*safePageSize;
  return {items:ordered.slice(start,start+safePageSize).map(id=>index.documentById.get(id)),total,page:safePage,pageSize:safePageSize,pageCount,hasPrevious:safePage>1,hasNext:safePage<pageCount,types:[...index.typeIndex.keys()]};
}
async function facets(){
  const index=await ensure();
  const grades=index.ordered.map(id=>index.byId.get(id));
  const regions=[...new Set(grades.map(catalogRegion).filter(Boolean))].sort();
  const countries=[...new Set(grades.map(manufacturerCountry).filter(Boolean))].sort();
  const manufacturers=[...new Map(grades.map(g=>[clean(g?.manufacturer?.id),{id:clean(g?.manufacturer?.id),name:clean(g?.manufacturer?.name),country:manufacturerCountry(g),region:catalogRegion(g)}])).values()].filter(x=>x.id).sort((a,b)=>a.name.localeCompare(b.name));
  const families=[...new Set(grades.map(g=>clean(g?.polymer?.family)).filter(Boolean))].sort();
  const applications=[...new Set(grades.flatMap(g=>taxonomyTags(g,APPLICATION_RULES)))].sort();
  const processes=[...new Set(grades.flatMap(processTags))].sort();
  const evidence=[...new Set(grades.flatMap(evidenceBadges))].sort();
  const countBy=values=>values.reduce((acc,v)=>(acc[v]=(acc[v]||0)+1,acc),{});
  const counts={
    regions:countBy(grades.map(catalogRegion)),
    countries:countBy(grades.map(manufacturerCountry)),
    families:countBy(grades.map(g=>clean(g?.polymer?.family))),
    applications:countBy(grades.flatMap(g=>taxonomyTags(g,APPLICATION_RULES))),
    processes:countBy(grades.flatMap(processTags)),
    evidence:countBy(grades.flatMap(evidenceBadges))
  };
  return {regions,countries,manufacturers,families,applications,processes,evidence,counts,boundary:'Country is the manufacturer country. Region is a browsing facet derived from manufacturer country; neither field proves exact-grade manufacturing origin, plant origin, or local availability. Application and process tags are derived from explicit published grade text for browsing only; they are not suitability recommendations.'};
}
function invalidate(){state=null;readyPromise=null}
function stats(){return state?{grades:state.ordered.length,tokens:state.tokenIndex.size,manufacturers:state.manufacturerIndex.size,families:state.familyIndex.size,countries:state.countryIndex.size,regions:state.regionIndex.size,documents:state.documentOrder.length,documentTokens:state.documentTokenIndex.size,types:[...state.typeIndex.keys()]}:null}
window.MM_MATERIAL_SEARCH=Object.freeze({version:VERSION,searchPage,searchAllPage,facets,invalidate,stats,_buildForTest:build});
})();
