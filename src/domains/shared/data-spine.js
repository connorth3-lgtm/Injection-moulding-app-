/* MouldMaster canonical data spine — 2026.09.05.1 */
(function(){
'use strict';
if(window.MM_DATA_SPINE)return;
const VERSION='2026.09.05.1';
const nodes=new Map(),edges=new Map();
const KIND_ALIASES=Object.freeze({question:'assessment-question',case:'process-case',material:'material-grade',source:'evidence-source',signal:'process-signal'});
function clean(v){return String(v??'').trim()}
function slug(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'unknown'}
function kind(v){const k=slug(v);return KIND_ALIASES[k]||k}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stable).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}'}
function fingerprint(value){const text=typeof value==='string'?value:stable(value);let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return `fnv1a-${(h>>>0).toString(16).padStart(8,'0')}`}
function canonicalId(nodeKind,value){const k=kind(nodeKind),raw=clean(value);if(!raw)throw new Error('Canonical data-spine id requires a value');if(raw.startsWith(k+':'))return raw;return `${k}:${slug(raw)}`}
function register(nodeKind,value,meta={}){
  const k=kind(nodeKind),key=clean(value),id=canonicalId(k,key),prior=nodes.get(id)||null;
  if(prior&&prior.key!==key)throw new Error(`Canonical data-spine id collision: ${id} maps both ${prior.key} and ${key}`);
  const updatedAt=meta.updatedAt||prior?.updatedAt||new Date().toISOString();
  const record=Object.freeze({...prior,...meta,id,kind:k,key,updatedAt});nodes.set(id,record);return record
}
function relation(fromKind,fromValue,toKind,toValue,type,meta={}){const from=register(fromKind,fromValue),to=register(toKind,toValue),rel=slug(type),id=`${from.id}|${rel}|${to.id}`,record=Object.freeze({...meta,id,from:from.id,to:to.id,type:rel});edges.set(id,record);return record}
function get(nodeKind,value){return nodes.get(canonicalId(nodeKind,value))||null}
function list(nodeKind=null){const k=nodeKind?kind(nodeKind):null;return [...nodes.values()].filter(x=>!k||x.kind===k)}
function relationsFor(nodeKind,value,{type=null,direction='both'}={}){const id=canonicalId(nodeKind,value),wanted=type?slug(type):null;return [...edges.values()].filter(e=>(!wanted||e.type===wanted)&&((direction==='out'||direction==='both')&&e.from===id||(direction==='in'||direction==='both')&&e.to===id))}
function connected(nodeKind,value,{type=null,targetKind=null}={}){const id=canonicalId(nodeKind,value),tk=targetKind?kind(targetKind):null,out=[];for(const e of relationsFor(nodeKind,value,{type})){const other=e.from===id?e.to:e.from,n=nodes.get(other);if(n&&(!tk||n.kind===tk))out.push({node:n,relation:e})}return out}
function registerEvidenceRecord(r){if(!r?.id)return;const q=register('assessment-question',r.id,{recordKind:r.kind||'',reviewedOn:r.reviewedOn||'',fingerprint:r.fingerprint||''});for(const sid of r.sourceIds||[])relation('assessment-question',r.id,'evidence-source',sid,'supported-by',{sourceMode:r.sourceMode||''});if(r.materialLabId)relation('assessment-question',r.id,'activity',`material-lab:${r.materialLabId}`,'belongs-to');return q}
function ingestSynchronous(){
  try{for(const lesson of window.MM_DATA?.lessons||[])register('lesson',lesson.id,{title:lesson.title||'',course:lesson.course||''})}catch(_){}
  try{for(const r of window.MM_EVIDENCE_APPROVAL?.records||[])registerEvidenceRecord(r)}catch(_){}
  try{for(const lab of window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[]){register('activity',`material-lab:${lab.id}`,{activityType:'material-lab',title:lab.title||''});for(const m of lab.materials||[])relation('activity',`material-lab:${lab.id}`,'material-family',m,'uses-material');for(const sid of lab.sourceIds||[])relation('activity',`material-lab:${lab.id}`,'evidence-source',sid,'supported-by')}}catch(_){}
  try{for(const lab of window.MM_DIAGNOSTIC_LABS?.labs||[])register('activity',`diagnostic:${lab.id}`,{activityType:'diagnostic',title:lab.title||''})}catch(_){}
  try{for(const ds of window.MM_PROCESS_EVIDENCE_DATASETS?.datasets||[]){register('process-case',ds.id,{title:ds.title||'',domain:ds.kind||''});for(const sid of ds.sourceIds||[])relation('process-case',ds.id,'evidence-source',sid,'supported-by',{granularity:'case'});for(const signal of Object.keys(ds.signals||{})){const resolved=window.MM_SIGNAL_REGISTRY?.resolve?.(signal,{confirmed:true}),target=resolved?.canonicalId||signal;relation('process-case',ds.id,'process-signal',target,'observes',{sourceSignal:signal,semanticStatus:resolved?.status||'unmapped'})}}}catch(_){}
}
async function ingestMaterials(){try{const registry=window.MM_MATERIAL_REGISTRY;if(!registry?.all)return 0;const grades=await registry.all();for(const g of grades){register('material-grade',g.id,{displayName:[g.manufacturer?.name,g.brand,g.grade].filter(Boolean).join(' · '),family:g.polymer?.family||'',provenance:g.provenance?.stage||''});if(g.polymer?.family)relation('material-grade',g.id,'material-family',g.polymer.family,'member-of');for(const p of g.properties||[]){register('material-property',p.id,{property:p.property||'',unit:p.unit||'',comparisonReady:p.comparisonReady===true});relation('material-grade',g.id,'material-property',p.id,'has-property');if(p.sourceId)relation('material-property',p.id,'evidence-source',p.sourceId,'supported-by')}for(const s of g.sources||[])register('evidence-source',s.id,{title:s.title||'',publisher:s.publisher||'',url:s.url||''})}return grades.length}catch(_){return 0}}
function exportGraph(){return {schema:1,version:VERSION,nodes:[...nodes.values()],relations:[...edges.values()]}}
let ingestTimer=null;function scheduleIngest(){clearTimeout(ingestTimer);ingestTimer=setTimeout(()=>{ingestSynchronous();ingestMaterials()},0)}
ingestSynchronous();scheduleIngest();window.addEventListener('mm:domains-ready',scheduleIngest,{once:true});window.addEventListener('load',scheduleIngest,{once:true});
window.MM_DATA_SPINE=Object.freeze({version:VERSION,canonicalId,fingerprint,register,relation,get,list,relationsFor,connected,ingest:async()=>{ingestSynchronous();await ingestMaterials();return exportGraph()},export:exportGraph});
})();
