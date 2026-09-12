const CACHE_VERSION='2026.09.12.15';
const CACHE_REVISION='engineer-simulator-ui-r1-20260911';
const STATIC_CACHE=`mouldmaster-static-${CACHE_VERSION}-${CACHE_REVISION}`;

// Release assets are grouped for readability, but activation is atomic across both
// groups. A new worker must cache the complete offline application before it can
// replace the previous validated release.
const CORE=[
  './index.html',
  './MouldMaster_Core_App.html',
  './src/core-runtime/inline-style-bridge.js',
  './src/core-runtime/core-inline-010.js',
  './src/core-runtime/core-inline-009.js',
  './src/core-runtime/core-inline-008.js',
  './src/core-runtime/core-inline-007.js',
  './src/core-runtime/core-inline-006.js',
  './src/core-runtime/core-inline-005.js',
  './src/core-runtime/core-inline-004.js',
  './src/core-runtime/core-inline-003.js',
  './src/core-runtime/core-inline-002.js',
  './src/core-runtime/core-inline-001.js',
  './manifest.webmanifest',
  './mouldmaster-192.png',
  './mouldmaster-512.png',
  './version.json',
  './reading-patch.css',
  './ui-shell.css',
  './mobile-lesson-fix.css',
  './learner-ux-repair.css',
  './reading-patch.js',
  './read-aloud.js',
  './training-upgrade.js',
  './training-qa-fix.js',
  './runtime-v2.js',
  './assessment-runtime-v2.js',
  './app-shell-registry.js',
  './pwa-shell.js',
  './learning-experience.js',
  './lesson-simple-experience.js',
  './primary-learning-practice-hubs.js',
  './learner-ux-repair.js',
  './process-data-diagnostics.js',
  './process-data-local-intake.js',
  './curriculum-integration.js',
  './specialist-curriculum.js',
  './specialist-evidence-gap-extension.js',
  './mould-master-workspace.js',
  './src/domains/domain-bootstrap.js',
  './runtime-domain-manifest.json',
  './src/domains/shared/learner-scope.js',
  './src/domains/shared/data-spine.js',
  './src/domains/shared/signal-registry.js',
  './src/domains/research/governed-mechanisms.js',
  './src/domains/assessment/assessment-analytics-v2.js',
  './src/domains/engineering/engineering-store.js',
  './src/domains/engineering/evidence-chain.js',
  './src/domains/engineering/research-context.js',
  './src/domains/engineering/engineer-simulator-ui.js',
  './src/domains/learning/learning-analytics-loader.js',
  './src/domains/learning/activity-events-v2.js',
  './src/domains/learning/learner-model.js',
  './src/domains/learning/delayed-transfer-reviews.js',
  './src/domains/materials/material-registry.js',
  './src/domains/materials/material-search-index.js',
  './src/domains/materials/material-search-pagination.js',
  './src/domains/materials/material-observation-v2.js',
  './src/domains/process/evidence-granularity.js',
  './src/domains/learning/content-intelligence.js',
  './src/domains/process/process-statistics.js',
  './src/domains/process/process-data-integrity.js',
  './src/domains/shell/accessibility-loader.js',
  './src/domains/shell/product-areas.js',
  './material-catalog-v1.json',
  './learning-analytics.js',
  './accessibility-hardening.js',
  './app-shell-finalize.js',
  './production-health.js',
  './data-integration-runtime.js',
  './process-data-intelligence-ui.js',
  './process-data-semantic-registry.json',
  './current-data-manifest.json',
  './repair.html',
  './privacy.html',
  './support.html'
];

const OPTIONAL=[
  './src/domains/runtime-packs/evidence-runtime-pack.js',
  './src/domains/runtime-packs/process-data-runtime-pack.js',
  './assessment-100-pass.js',
  './assessment-deep-dive.js',
  './assessment-answer-cue-fix.js',
  './assessment-storage-scope.js',
  './assessment-quality-suite.js',
  './assessment-stable-review-bridge.js',
  './assessment-analytics-ui.js',
  './assessment-final-hardening.js',
  './assessment-ux.js',
  './source-library.js',
  './measured-evidence-integration.js',
  './measured-evidence-decision.js',
  './measured-learning-library.js',
  './measured-learning-library.css',
  './data/measured-learning/promoted-v1.json',
  './data/measured-learning/manifest-v1.json',
  './data/measured-learning/expansion-manifest-v2.json',
  './data/measured-learning/v2-policy.json',
  './data/measured-learning/source-readiness-v2.json',
  './reference-data.js',
  './reference-data.html',
  './reference-deep-dive.js',
  './reference-research-extension.js',
  './reference-20x-extension.js',
  './reference-2026-expansion.js',
  './reference-sources.js',
  './reference-browser-ui.js',
  './diagnostic-learning-labs.js',
  './material-behaviour-labs.js',
  './assessment-evidence-sources.js',
  './evidence-maturity-deep-dive.js',
  './evidence-maturity-formal-bridge.js',
  './assessment-psychometric-hardening.js',
  './assessment-evidence-integrity-upgrade.js',
  './lesson-evidence-depth.js',
  './lesson-deep-authoring-v2.js',
  './assessment-evidence-approval.js',
  './assessment-psychometric-approval.js',
  './assessment-multimodal.js',
  './real-measured-data-assessment.js',
  './process-data-deep-dive-machine.js',
  './process-data-deep-dive-tooling.js',
  './process-data-deep-dive-material.js',
  './process-data-deep-dive-scientific.js',
  './process-data-deep-dive-quality.js',
  './process-data-deep-dive-50.js',
  './process-data-20-pass-01-05.js',
  './process-data-20-pass-06-10.js',
  './process-data-20-pass-11-15.js',
  './process-data-20-pass-16-20.js',
  './process-data-20-pass-atlas.js'
];
const RELEASE_ASSETS=[...new Set([...CORE,...OPTIONAL])];
const RELEASE_PATHS=new Set(RELEASE_ASSETS.map(asset=>new URL(asset,self.registration.scope).pathname));

async function cacheAsset(cache,url){
  const request=new Request(url,{cache:'reload'});
  const response=await fetch(request);
  if(!response||!response.ok)throw new Error(`${url} returned ${response?.status||'no-response'}`);
  await cache.put(url,response.clone());
  return url;
}

async function releaseCacheMatch(request){
  const cache=await caches.open(STATIC_CACHE);
  return await cache.match(request,{ignoreSearch:true});
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    const results=await Promise.allSettled(RELEASE_ASSETS.map(url=>cacheAsset(cache,url)));
    const failed=results.map((x,i)=>x.status==='rejected'?RELEASE_ASSETS[i]:null).filter(Boolean);
    if(failed.length){
      await caches.delete(STATIC_CACHE);
      throw new Error(`MouldMaster offline release update is incomplete; keeping the previous worker. Missing: ${failed.join(', ')}`);
    }
    // Deliberately do not call skipWaiting(). The complete new release waits until
    // existing clients using the previous worker have left its scope, preventing an
    // in-place controller swap over a document that is still executing old bytes.
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Normal service-worker waiting semantics mean the previous active worker no
    // longer has controlled clients when this runs, so its release cache can now be
    // retired without breaking an older document that still depends on it.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('mouldmaster-static-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)));
    // Do not claim already-open uncontrolled documents. The new worker controls the
    // next navigation, keeping controller changes aligned with a full document load.
  })());
});

// Governed release bytes are immutable for the lifetime of the active worker. A
// waiting worker may cache a newer generation in parallel, but the active worker
// always reads from its own named cache rather than from the network or a global
// caches.match() that could select another generation.
async function fetchNetwork(event){
  try{return await fetch(event.request,{cache:'no-store'})}catch(_){return null}
}
function criticalOfflineResponse(url){
  if(url.pathname.endsWith('.json'))return new Response(JSON.stringify({error:'mouldmaster-offline-asset-unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  return new Response('/* MouldMaster runtime asset is unavailable offline. Reconnect and reopen the app to cache this runtime feature pack. */\n',{status:503,headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
}
function offlineDocumentResponse(){
  return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>MouldMaster offline</title><main style="font:16px system-ui;padding:24px;max-width:680px"><h1>MouldMaster is not fully installed offline yet</h1><p>Reconnect once and reopen the app. The complete offline release installs atomically before a new worker can replace the previous validated cache.</p></main>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const exact=await releaseCacheMatch(event.request);
      if(exact)return exact;
      const index=await releaseCacheMatch(new Request(new URL('./index.html',self.registration.scope)));
      return index||offlineDocumentResponse();
    })());
    return;
  }

  if(RELEASE_PATHS.has(url.pathname)){
    event.respondWith((async()=>{
      const cached=await releaseCacheMatch(event.request);
      if(cached)return cached;
      return criticalOfflineResponse(url);
    })());
    return;
  }

  const runtimeCritical=url.pathname.endsWith('.js')||url.pathname.endsWith('.json');
  if(runtimeCritical){
    event.respondWith((async()=>await fetchNetwork(event)||criticalOfflineResponse(url))());
    return;
  }

  event.respondWith((async()=>await fetchNetwork(event)||new Response('MouldMaster asset unavailable offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}}))());
});
