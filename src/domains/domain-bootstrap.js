/* MouldMaster manifest-driven domain bootstrap — 2026.09.03 */
(function(){
'use strict';
if(window.MM_DOMAIN_BOOTSTRAP)return;
const VERSION='2026.09.03.1';
const MANIFEST='./data/runtime-domain-manifest.json';

function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.dataset.mmDomainAsset='1';s.onload=()=>resolve(src);s.onerror=()=>reject(new Error(`Domain asset failed: ${src}`));document.body.appendChild(s)})}
async function boot(){
  const r=await fetch(MANIFEST,{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw new Error(`${MANIFEST} returned ${r.status}`);
  const manifest=await r.json();
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets))throw new Error('Invalid domain runtime manifest');
  const loaded=[];
  for(const src of manifest.assets){
    if(typeof src!=='string'||!src.startsWith('./src/domains/')||!src.endsWith('.js'))throw new Error(`Unsafe domain asset: ${src}`);
    await loadScript(src);loaded.push(src);
  }
  window.dispatchEvent(new CustomEvent('mm:domains-ready',{detail:{version:VERSION,loaded}}));
  return loaded;
}
const ready=boot().catch(err=>{console.error('[MouldMaster domains]',err);window.dispatchEvent(new CustomEvent('mm:domains-failed',{detail:{message:String(err?.message||err)}}));throw err});
window.MM_DOMAIN_BOOTSTRAP=Object.freeze({version:VERSION,manifest:MANIFEST,ready});
})();
