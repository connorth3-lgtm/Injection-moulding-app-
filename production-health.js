/* MouldMaster local production health diagnostics — 2026.09.01.1 */
(function(){
'use strict';

const VERSION='2026.09.01.1';
const STORE_KEY='mm_production_health_v1';
const MAX_EVENTS=120;
const ALLOWED_KINDS=new Set([
  'runtime_error','promise_error','resource_error','offline','online',
  'sw_update_found','sw_installed','sw_redundant','sw_controller_change',
  'deployment_ok','deployment_mismatch','deployment_unreachable'
]);

function safeToken(value,max=64){return String(value??'').replace(/[^a-zA-Z0-9._:-]/g,'').slice(0,max)}
function dayStamp(){return new Date().toISOString().slice(0,10)}
function emptyStore(){return {schema:1,version:VERSION,events:[],lastDeployment:null}}
function readStore(){
  try{const x=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(x&&x.schema===1&&Array.isArray(x.events))return x}catch(_){}
  return emptyStore();
}
function writeStore(store){
  try{store.version=VERSION;store.events=(store.events||[]).slice(-MAX_EVENTS);localStorage.setItem(STORE_KEY,JSON.stringify(store))}catch(_){}
}
function record(kind,data={}){
  if(!ALLOWED_KINDS.has(kind))return null;
  const event={v:1,day:dayStamp(),kind};
  for(const key of ['asset','code','state','runtime','source'])if(data[key]!=null)event[key]=safeToken(data[key],key==='source'?40:64);
  const store=readStore();store.events.push(event);writeStore(store);return event;
}
function sameOriginAsset(raw){
  try{const u=new URL(String(raw||''),location.href);if(u.origin!==location.origin)return 'external';const bits=u.pathname.split('/').filter(Boolean);return safeToken(bits.pop()||'document',80)}catch(_){return 'unknown'}
}
function errorCode(value){
  try{if(value&&typeof value==='object'&&value.constructor?.name)return safeToken(value.constructor.name,48)}catch(_){}
  return typeof value==='string'?'non-error-string':'unknown-error';
}
function displayMode(){
  if(location.hostname==='127.0.0.1'&&/\bElectron\//.test(navigator.userAgent||''))return 'desktop';
  if(window.matchMedia?.('(display-mode: standalone)').matches)return 'installed-pwa';
  return 'browser';
}
function browserFamily(){const u=navigator.userAgent||'';if(/Edg\//.test(u))return 'Edge';if(/Firefox\//.test(u))return 'Firefox';if(/Chrome\//.test(u))return 'Chrome';if(/Safari\//.test(u))return 'Safari';return 'Other'}
function platformFamily(){
  const p=String(navigator.userAgentData?.platform||navigator.platform||navigator.userAgent||'');
  if(/Android/i.test(p))return 'Android';if(/iPhone|iPad|iPod/i.test(p))return 'iOS';if(/Win/i.test(p))return 'Windows';if(/Mac/i.test(p))return 'macOS';if(/Linux/i.test(p))return 'Linux';return 'Other';
}
function isPublicPages(){return location.hostname==='connorth3-lgtm.github.io'}
function deploymentResult(status,extra={}){return {status,...extra}}

async function checkDeployment(){
  const mode=displayMode();
  if(!isPublicPages()){
    const result=deploymentResult('not-applicable',{mode});
    const store=readStore();store.lastDeployment=result;writeStore(store);return result;
  }
  if(!navigator.onLine){
    const result=deploymentResult('offline',{mode});
    const store=readStore();store.lastDeployment=result;writeStore(store);return result;
  }
  try{
    const nonce=Date.now().toString(36);
    const [depResponse,manifestResponse,workerResponse]=await Promise.all([
      fetch(`./deployment.json?health=${nonce}`,{cache:'no-store',credentials:'same-origin'}),
      fetch(`./pages-manifest.json?health=${nonce}`,{cache:'no-store',credentials:'same-origin'}),
      fetch(`./service-worker.js?health=${nonce}`,{cache:'no-store',credentials:'same-origin'})
    ]);
    if(!depResponse.ok||!manifestResponse.ok||!workerResponse.ok){
      const code=`http-${depResponse.status}-${manifestResponse.status}-${workerResponse.status}`;
      record('deployment_unreachable',{code});
      const result=deploymentResult('unreachable',{mode,code});const store=readStore();store.lastDeployment=result;writeStore(store);return result;
    }
    const deployment=await depResponse.json();
    const manifest=await manifestResponse.json();
    const workerText=await workerResponse.text();
    const workerRevision=/CACHE_REVISION\s*=\s*['"]([^'"]+)['"]/.exec(workerText)?.[1]||'';
    const source=safeToken(deployment?.source_sha,40);
    const runtime=safeToken(deployment?.assessment_runtime,64);
    const expectedRevision=safeToken(deployment?.service_worker_cache_revision,64);
    const coherent=/^[a-f0-9]{40}$/.test(source)&&manifest?.source_sha===source&&workerRevision===expectedRevision&&manifest?.assets?.['index.html']&&manifest?.assets?.['service-worker.js'];
    const status=coherent?'ok':'mismatch';
    record(coherent?'deployment_ok':'deployment_mismatch',{source,runtime,state:workerRevision||'missing-revision'});
    const result=deploymentResult(status,{mode,source_sha:source,assessment_runtime:runtime,service_worker_cache_revision:expectedRevision});
    const store=readStore();store.lastDeployment=result;writeStore(store);return result;
  }catch(err){
    const code=errorCode(err);record('deployment_unreachable',{code});
    const result=deploymentResult('unreachable',{mode,code});const store=readStore();store.lastDeployment=result;writeStore(store);return result;
  }
}

function eventCounts(events){const counts={};for(const event of events||[])counts[event.kind]=(counts[event.kind]||0)+1;return counts}
function snapshot(){
  const store=readStore();
  return {
    schema:1,
    production_health_version:VERSION,
    privacy:'Local-only diagnostic summary. No learner identity, notes, answers, free text, raw process data, full URLs, query strings or exact event timestamps.',
    environment:{mode:displayMode(),browser:browserFamily(),platform:platformFamily(),online:!!navigator.onLine,service_worker_controlled:!!navigator.serviceWorker?.controller},
    runtime_asset_version:safeToken(window.MM_RUNTIME_ASSET_VERSION||'',80)||null,
    deployment:store.lastDeployment||null,
    event_counts:eventCounts(store.events),
    recent_signals:(store.events||[]).slice(-20).map(event=>{const out={kind:event.kind};for(const key of ['asset','code','state','runtime','source'])if(event[key])out[key]=event[key];return out})
  };
}
async function copySafeSnapshot(){
  const text=JSON.stringify(snapshot(),null,2);
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch(_){}
  try{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return !!ok}catch(_){return false}
}
function clear(){try{localStorage.removeItem(STORE_KEY)}catch(_){}return true}

window.addEventListener('error',event=>{
  try{
    if(event.target&&event.target!==window){const tag=String(event.target.tagName||'').toLowerCase();if(['script','link','img','source'].includes(tag)){const raw=event.target.src||event.target.href||'';record('resource_error',{asset:sameOriginAsset(raw),code:tag});return}}
    record('runtime_error',{asset:sameOriginAsset(event.filename||location.href),code:errorCode(event.error)});
  }catch(_){}
},true);
window.addEventListener('unhandledrejection',event=>{try{record('promise_error',{code:errorCode(event.reason)})}catch(_){}},true);
window.addEventListener('offline',()=>record('offline'));
window.addEventListener('online',()=>{record('online');checkDeployment()});

try{
  for(const entry of performance.getEntriesByType?.('resource')||[]){if(Number(entry.responseStatus)>=400)record('resource_error',{asset:sameOriginAsset(entry.name),code:`http-${entry.responseStatus}`})}
}catch(_){}

if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>record('sw_controller_change'));
  navigator.serviceWorker.ready.then(reg=>{
    reg.addEventListener('updatefound',()=>{
      record('sw_update_found');const worker=reg.installing;if(!worker)return;
      worker.addEventListener('statechange',()=>{if(worker.state==='installed')record('sw_installed');if(worker.state==='redundant')record('sw_redundant')});
    });
  }).catch(()=>{});
}

window.MM_PRODUCTION_HEALTH=Object.freeze({version:VERSION,storageKey:STORE_KEY,checkDeployment,snapshot,copySafeSnapshot,clear});
setTimeout(()=>checkDeployment(),400);
})();
