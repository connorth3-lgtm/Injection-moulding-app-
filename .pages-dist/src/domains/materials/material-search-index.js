/* MouldMaster material search index — 2026.09.03 */
(function(){
'use strict';
if(window.MM_MATERIAL_SEARCH)return;
const VERSION='2026.09.03.1';
let state=null;
let readyPromise=null;

function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function tokens(v){return [...new Set(norm(v).split(/\s+/).filter(Boolean))]}
function searchable(g){return [g?.manufacturer?.name,g?.brand,g?.grade,...(g?.aliases||[]),g?.polymer?.family,g?.polymer?.blend,g?.identity?.variantId,g?.identity?.regionalVariant,g?.production?.country,g?.production?.plant].filter(Boolean).join(' ')}
function add(map,key,id){if(!key)return;let bucket=map.get(key);if(!bucket){bucket=new Set();map.set(key,bucket)}bucket.add(id)}
function intersect(left,right){if(!left)return new Set(right||[]);if(!right)return new Set();const out=new Set();const [small,large]=left.size<=right.size?[left,right]:[right,left];for(const value of small)if(large.has(value))out.add(value);return out}

function build(grades){
  const byId=new Map(),tokenIndex=new Map(),manufacturerIndex=new Map(),familyIndex=new Map();
  const ordered=[];
  for(const grade of grades||[]){
    if(!grade?.id||byId.has(grade.id))continue;
    byId.set(grade.id,grade);ordered.push(grade.id);
    for(const token of tokens(searchable(grade)))add(tokenIndex,token,grade.id);
    add(manufacturerIndex,clean(grade?.manufacturer?.id),grade.id);
    add(familyIndex,norm(grade?.polymer?.family),grade.id);
  }
  state={byId,ordered,tokenIndex,manufacturerIndex,familyIndex};
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
  const index=await ensure();
  const queryTokens=tokens(query);
  let ids=null;
  for(const token of queryTokens)ids=intersect(ids,index.tokenIndex.get(token));
  if(ids===null)ids=new Set(index.ordered);
  if(manufacturerId)ids=intersect(ids,index.manufacturerIndex.get(clean(manufacturerId)));
  if(polymerFamily)ids=intersect(ids,index.familyIndex.get(norm(polymerFamily)));

  const ordered=index.ordered.filter(id=>ids.has(id));
  const safePageSize=Math.max(1,Math.min(Number(pageSize)||25,100));
  const total=ordered.length;
  const pageCount=Math.max(1,Math.ceil(total/safePageSize));
  const safePage=Math.max(1,Math.min(Number(page)||1,pageCount));
  const start=(safePage-1)*safePageSize;
  return {
    items:ordered.slice(start,start+safePageSize).map(id=>index.byId.get(id)),
    total,
    page:safePage,
    pageSize:safePageSize,
    pageCount,
    hasPrevious:safePage>1,
    hasNext:safePage<pageCount,
  };
}

function invalidate(){state=null;readyPromise=null}
function stats(){return state?{grades:state.ordered.length,tokens:state.tokenIndex.size,manufacturers:state.manufacturerIndex.size,families:state.familyIndex.size}:null}

window.MM_MATERIAL_SEARCH=Object.freeze({version:VERSION,searchPage,invalidate,stats,_buildForTest:build});
})();
