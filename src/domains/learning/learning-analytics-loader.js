/* MouldMaster domain bridge for legacy Learning Analytics — 2026.09.03 */
(function(){
'use strict';
if(window.MM_LEARNING_ANALYTICS||window.MM_LEARNING_ANALYTICS_LOADING)return;
if(!window.MM_LEARNER_SCOPE)throw new Error('MM_LEARNER_SCOPE must load before Learning Analytics');
const base='./learning-analytics.js';
const version=String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
const src=version?`${base}?v=${encodeURIComponent(version)}`:base;
const ready=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.mmDomainBridge='learning-analytics';
  s.onload=()=>resolve(window.MM_LEARNING_ANALYTICS||null);
  s.onerror=()=>reject(new Error(`Learning Analytics asset failed: ${base}`));
  document.body.appendChild(s);
});
window.MM_LEARNING_ANALYTICS_LOADING=ready;
})();
