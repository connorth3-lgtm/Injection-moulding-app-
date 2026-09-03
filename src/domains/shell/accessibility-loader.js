/* MouldMaster domain bridge for legacy Accessibility Hardening — 2026.09.03 */
(function(){
'use strict';
if(window.MM_ACCESSIBILITY_HARDENING||window.MM_ACCESSIBILITY_HARDENING_LOADING)return;
const analyticsReady=window.MM_LEARNING_ANALYTICS_LOADING||Promise.resolve(window.MM_LEARNING_ANALYTICS||null);
const base='./accessibility-hardening.js';
const version=String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
const src=version?`${base}?v=${encodeURIComponent(version)}`:base;
const ready=Promise.resolve(analyticsReady).catch(()=>null).then(()=>new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset.mmDomainBridge='accessibility-hardening';
  s.onload=()=>resolve(window.MM_ACCESSIBILITY_HARDENING||true);
  s.onerror=()=>reject(new Error(`Accessibility Hardening asset failed: ${base}`));
  document.body.appendChild(s);
}));
window.MM_ACCESSIBILITY_HARDENING_LOADING=ready;
})();
