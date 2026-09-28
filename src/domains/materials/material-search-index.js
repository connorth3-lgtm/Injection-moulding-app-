/* MouldMaster material search index — 2026.09.29 */
(function(){
'use strict';
if(window.MM_MATERIAL_SEARCH)return;
const VERSION='2026.09.29.1';
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
function gradeSearchable(g){return [g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend,g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].filter(Boolean).join(' ')}
function add(map,key,id){if(!key)return;let bucket=map.get(key);if(!bucket){bucket=new Set();map.set(key,bucket)}bucket.add(id)}
function intersect(left,right){if(!left)return new Set(right||[]);if(!right)return new Set();const out=new Set();const [small,large]=left.size<=right.size?[left,right]:[right,left];for(const value of small)if(large.has(value))out.add(value);return out}
function titleForGrade(g){return [g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function documentRecord({id,type,title,subtitle='',searchText='',sourceIds=[],materialGradeId=null,payload=null}){
  return {id,type,title,subtitle,searchText,sourceIds:[...new Set((sourceIds||[]).map(clean).filter(Boolean))],materialGradeId,payload};
}
function exactGradeDocument(g){
  const propertyText=(g?.properties||[]).map(o=>[o.property,o.value,o.unit,o.testMethod,o.temperatureC,o.loadKg,o.specimen,o.conditioning,o.direction,o.limitations].filter(x=>x!==null&&x!==undefined).join(' '));
  const processingText=(g?.processing||[]).map(o=>[o.parameter,o.value,o.min,o.max,o.unit,o.condition,o.claimType].filter(x=>x!==null&&x!==undefined).join(' '));
  const sourceText=(g?.sources||[]).map(s=>[s.publisher,s.title,s.kind,s.revision,s.documentDate,s.url].filter(Boolean).join(' '));
  return documentRecord({
    id:'grade:'+g.id,type:'exact-grade',title:titleForGrade(g),
    subtitle:[g?.polymer?.family,g?.polymer?.morphology].map(clean).filter(Boolean).join(' · '),
    searchText:[gradeSearchable(g),flat(g?.composition),...propertyText,...processingText,...sourceText,flat(g?.provenance),flat(g?.lifecycle)].join(' '),
    sourceIds:(g?.sources||[]).map(s=>s.id),materialGradeId:g.id,payload:g
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
  const byId=new Map(),tokenIndex=new Map(),manufacturerIndex=new Map(),familyIndex=new Map(),ordered=[];
  for(const grade of grades||[]){
    if(!grade?.id||byId.has(grade.id))continue;
    byId.set(grade.id,grade);ordered.push(grade.id);
    for(const token of tokens(gradeSearchable(grade)))add(tokenIndex,token,grade.id);
    add(manufacturerIndex,clean(grade?.manufacturer?.id),grade.id);
    add(familyIndex,norm(grade?.polymer?.family),grade.id);
  }
  const documents=[...(grades||[]).map(exactGradeDocument),...referenceDocuments(),...labDocuments()];
  const documentById=new Map(),documentTokenIndex=new Map(),typeIndex=new Map(),documentOrder=[];
  for(const doc of documents){
    if(!doc?.id||documentById.has(doc.id))continue;
    documentById.set(doc.id,doc);documentOrder.push(doc.id);
    for(const token of tokens([doc.title,doc.subtitle,doc.searchText,doc.sourceIds.join(' ')].join(' ')))add(documentTokenIndex,token,doc.id);
    add(typeIndex,doc.type,doc.id);
  }
  state={byId,ordered,tokenIndex,manufacturerIndex,familyIndex,documentById,documentTokenIndex,typeIndex,documentOrder};
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
async function searchPage(query,{manufacturerId=null,polymerFamily=null,page=1,pageSize=25}={}){
  const index=await ensure();const queryTokens=tokens(query);let ids=null;
  for(const token of queryTokens)ids=intersect(ids,index.tokenIndex.get(token));
  if(ids===null)ids=new Set(index.ordered);
  if(manufacturerId)ids=intersect(ids,index.manufacturerIndex.get(clean(manufacturerId)));
  if(polymerFamily)ids=intersect(ids,index.familyIndex.get(norm(polymerFamily)));
  const ordered=index.ordered.filter(id=>ids.has(id));const safePageSize=Math.max(1,Math.min(Number(pageSize)||25,100));const total=ordered.length;const pageCount=Math.max(1,Math.ceil(total/safePageSize));const safePage=Math.max(1,Math.min(Number(page)||1,pageCount));const start=(safePage-1)*safePageSize;
  return {items:ordered.slice(start,start+safePageSize).map(id=>index.byId.get(id)),total,page:safePage,pageSize:safePageSize,pageCount,hasPrevious:safePage>1,hasNext:safePage<pageCount};
}
async function searchAllPage(query,{types=null,page=1,pageSize=20}={}){
  const index=await ensure();const queryTokens=tokens(query);let ids=null;
  for(const token of queryTokens)ids=intersect(ids,index.documentTokenIndex.get(token));
  if(ids===null)ids=new Set(index.documentOrder);
  const selected=[...(types||[])].map(clean).filter(Boolean);
  if(selected.length){
    const allowed=new Set();
    for(const type of selected)for(const id of index.typeIndex.get(type)||[])allowed.add(id);
    ids=intersect(ids,allowed);
  }
  const ordered=index.documentOrder.filter(id=>ids.has(id));const safePageSize=Math.max(1,Math.min(Number(pageSize)||20,100));const total=ordered.length;const pageCount=Math.max(1,Math.ceil(total/safePageSize));const safePage=Math.max(1,Math.min(Number(page)||1,pageCount));const start=(safePage-1)*safePageSize;
  return {items:ordered.slice(start,start+safePageSize).map(id=>index.documentById.get(id)),total,page:safePage,pageSize:safePageSize,pageCount,hasPrevious:safePage>1,hasNext:safePage<pageCount,types:[...index.typeIndex.keys()]};
}
function invalidate(){state=null;readyPromise=null}
function stats(){return state?{grades:state.ordered.length,tokens:state.tokenIndex.size,manufacturers:state.manufacturerIndex.size,families:state.familyIndex.size,documents:state.documentOrder.length,documentTokens:state.documentTokenIndex.size,types:[...state.typeIndex.keys()]}:null}
window.MM_MATERIAL_SEARCH=Object.freeze({version:VERSION,searchPage,searchAllPage,invalidate,stats,_buildForTest:build});
})();
