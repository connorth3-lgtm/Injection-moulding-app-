/* MouldMaster exact-grade material registry — 2026.09.03 */
(function(){
'use strict';
if(window.MM_MATERIAL_REGISTRY)return;
const VERSION='2026.09.03.1';
const CATALOG_URL='./data/materials/catalog-v1.json';
let catalog=null;
let readyPromise=null;

function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
async function load(){
  if(catalog)return catalog;
  if(!readyPromise)readyPromise=fetch(CATALOG_URL,{cache:'no-store',credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(`${CATALOG_URL} returned ${r.status}`);return r.json()}).then(x=>{if(x?.schemaVersion!==1||!Array.isArray(x?.grades))throw new Error('invalid material catalog');catalog=x;return x});
  return readyPromise;
}
function displayName(g){return [g?.manufacturer?.name,g?.brand,g?.grade].map(clean).filter(Boolean).join(' · ')}
function searchable(g){return norm([g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend].filter(Boolean).join(' '))}
async function all(){return (await load()).grades.slice()}
async function get(id){return (await load()).grades.find(x=>x.id===id)||null}
async function search(query,{manufacturerId=null,polymerFamily=null,limit=50}={}){
  const terms=norm(query).split(/\s+/).filter(Boolean);
  const grades=(await load()).grades.filter(g=>{
    if(manufacturerId&&g?.manufacturer?.id!==manufacturerId)return false;
    if(polymerFamily&&norm(g?.polymer?.family)!==norm(polymerFamily))return false;
    const hay=searchable(g);return terms.every(t=>hay.includes(t));
  });
  return grades.slice(0,Math.max(1,Math.min(Number(limit)||50,200)));
}
function propertyKey(obs){return norm(obs?.property).replace(/ /g,'_')}
async function propertyObservations(materialGradeId,property){
  const grade=await get(materialGradeId);if(!grade)return[];
  const wanted=norm(property).replace(/ /g,'_');
  return (grade.properties||[]).filter(x=>propertyKey(x)===wanted);
}
function comparableSignature(obs){
  const prop=propertyKey(obs);
  return JSON.stringify({
    property:prop,
    unit:clean(obs?.unit),
    testMethod:clean(obs?.testMethod),
    temperatureC:obs?.temperatureC??null,
    loadKg:obs?.loadKg??null,
    specimen:clean(obs?.specimen),
    conditioning:clean(obs?.conditioning),
    direction:clean(obs?.direction)
  });
}
async function compareProperty(materialGradeIds,property){
  const rows=[];
  for(const id of materialGradeIds||[]){
    const grade=await get(id);if(!grade)continue;
    const observations=(grade.properties||[]).filter(o=>propertyKey(o)===norm(property).replace(/ /g,'_'));
    for(const observation of observations)rows.push({materialGradeId:id,material:displayName(grade),observation,comparisonReady:observation.comparisonReady===true,signature:comparableSignature(observation)});
  }
  const ready=rows.filter(x=>x.comparisonReady);
  const signatures=[...new Set(ready.map(x=>x.signature))];
  return {
    property,
    rows,
    comparisonReady:ready.length===rows.length&&rows.length>1&&signatures.length===1,
    blocker:rows.length<2?'At least two exact-grade observations are required.':ready.length!==rows.length?'One or more observations are not comparison-ready.':signatures.length!==1?'Test conditions differ; do not compare these values directly.':null
  };
}
async function manufacturers(){return (await load()).manufacturers||[]}
async function stats(){const c=await load();return {catalogVersion:c.catalogVersion||'',manufacturers:(c.manufacturers||[]).length,grades:(c.grades||[]).length,status:c.status||''}}

window.MM_MATERIAL_REGISTRY=Object.freeze({version:VERSION,catalogUrl:CATALOG_URL,load,all,get,search,displayName,manufacturers,propertyObservations,compareProperty,stats});
load().catch(err=>console.warn('[MouldMaster materials] exact-grade catalog unavailable',err));
})();
