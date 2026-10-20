/* MouldMaster manifest-driven domain bootstrap — 2026.09.06 */
(function(){
'use strict';
if(window.MM_DOMAIN_BOOTSTRAP)return;
const VERSION='2026.09.06.4';
const MANIFEST='./runtime-domain-manifest.json';
const runtimeScriptUrl=src=>typeof window.MM_RUNTIME_SCRIPT_URL==='function'?window.MM_RUNTIME_SCRIPT_URL(src):src;

function preloadScript(src){
  const href=runtimeScriptUrl(src);
  if(document.querySelector(`link[data-mm-domain-preload][href="${href}"]`))return;
  const link=document.createElement('link');
  link.rel='preload';
  link.as='script';
  link.href=href;
  link.dataset.mmDomainPreload='1';
  document.head.appendChild(link);
}
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=runtimeScriptUrl(src);s.async=false;s.dataset.mmDomainAsset='1';s.onload=()=>resolve(src);s.onerror=()=>reject(new Error(`Domain asset failed: ${src}`));document.body.appendChild(s)})}
function loadPrimaryHubs(){
  if(window.MM_PRIMARY_HUBS||document.querySelector('script[data-mm-primary-hubs]'))return;
  const s=document.createElement('script');
  s.src=runtimeScriptUrl('./primary-learning-practice-hubs.js');
  s.async=true;
  s.dataset.mmPrimaryHubs='1';
  s.addEventListener('error',()=>console.warn('[MouldMaster] Condensed Learn / Practice hubs could not be loaded; standard views remain available.'));
  document.body.appendChild(s);
}
function loadLearnerUxRepair(){
  if(window.MM_LEARNER_UX_REPAIR||document.querySelector('script[data-mm-learner-ux-repair]'))return;
  const s=document.createElement('script');
  s.src=runtimeScriptUrl('./learner-ux-repair.js');
  s.async=true;
  s.dataset.mmLearnerUxRepair='1';
  s.addEventListener('error',()=>console.warn('[MouldMaster] Learner UX repair runtime could not be loaded; standard lesson and assessment views remain available.'));
  document.body.appendChild(s);
}
async function boot(){
  const r=await fetch(MANIFEST,{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw new Error(`${MANIFEST} returned ${r.status}`);
  const manifest=await r.json();
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets))throw new Error('Invalid domain runtime manifest');
  const assets=manifest.assets.map(src=>{
    const safe=typeof src==='string'
      && /^\.\/src\/domains\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.js$/.test(src)
      && !src.split('/').includes('..');
    if(!safe)throw new Error(`Unsafe domain asset: ${src}`);
    return src;
  });
  // Start all same-origin transfers together, then preserve the governed execution order.
  // Preload only changes network scheduling; scripts are still inserted and executed one-by-one.
  assets.forEach(preloadScript);
  const loaded=[];
  for(const src of assets){await loadScript(src);loaded.push(src)}
  window.dispatchEvent(new CustomEvent('mm:domains-ready',{detail:{version:VERSION,loaded}}));
  return loaded;
}
loadPrimaryHubs();
loadLearnerUxRepair();
const ready=boot().catch(err=>{console.error('[MouldMaster domains]',err);window.dispatchEvent(new CustomEvent('mm:domains-failed',{detail:{message:String(err?.message||err)}}));throw err});
window.MM_DOMAIN_BOOTSTRAP=Object.freeze({version:VERSION,manifest:MANIFEST,ready});
})();
