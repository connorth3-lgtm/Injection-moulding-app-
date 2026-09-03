const CACHE_VERSION='2026.08.26.2';
const CACHE_REVISION='maturity-hardening-v2-r2-20260903';
const STATIC_CACHE=`mouldmaster-static-${CACHE_VERSION}-${CACHE_REVISION}`;
const LEGACY_RECOVERY_SOURCE_ONLY='./MouldMaster_Academy_App.html';

// Small fail-closed offline foundation. Remaining feature packs are warmed best-effort and never block activation.
const CORE=[
  './index.html',
  './MouldMaster_Core_App.html',
  './manifest.webmanifest',
  './mouldmaster-192.png',
  './mouldmaster-512.png',
  './version.json',
  './reading-patch.css',
  './reading-patch.js',
  './read-aloud.js',
  './training-upgrade.js',
  './training-qa-fix.js',
  './runtime-v2.js',
  './assessment-runtime-v2.js',
  './app-shell-registry.js',
  './pwa-shell.js',
  './learning-experience.js',
  './process-data-diagnostics.js',
  './process-data-local-intake.js',
  './curriculum-integration.js',
  './specialist-curriculum.js',
  './specialist-evidence-gap-extension.js',
  './mould-master-workspace.js',
  './src/domains/domain-bootstrap.js',
  './runtime-domain-manifest.json',
  './src/domains/shared/learner-scope.js',
  './src/domains/engineering/engineering-store.js',
  './src/domains/learning/learning-analytics-loader.js',
  './src/domains/materials/material-registry.js',
  './src/domains/materials/material-search-index.js',
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

async function cacheAsset(cache,url){
  const request=new Request(url,{cache:'reload'});
  const response=await fetch(request);
  if(!response||!response.ok)throw new Error(`${url} returned ${response?.status||'no-response'}`);
  await cache.put(url,response.clone());
  return url;
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    const coreResults=await Promise.allSettled(CORE.map(url=>cacheAsset(cache,url)));
    const failed=coreResults.map((x,i)=>x.status==='rejected'?CORE[i]:null).filter(Boolean);
    if(failed.length){
      await caches.delete(STATIC_CACHE);
      throw new Error(`MouldMaster offline core update is incomplete; keeping the previous worker. Missing: ${failed.join(', ')}`);
    }
    await Promise.allSettled(OPTIONAL.map(url=>cacheAsset(cache,url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('mouldmaster-static-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

async function fetchAndCache(event,url){
  try{
    const r=await fetch(event.request,{cache:'no-store'});
    if(r&&r.ok){
      const c=await caches.open(STATIC_CACHE);
      const scopePath=new URL('./',self.location.href).pathname;
      const key=url.pathname.startsWith(scopePath)?`./${url.pathname.slice(scopePath.length)}`:event.request;
      await c.put(key,r.clone());
    }
    return r;
  }catch(_){return null}
}
function criticalOfflineResponse(url){
  if(url.pathname.endsWith('.json'))return new Response(JSON.stringify({error:'mouldmaster-offline-asset-unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  return new Response('/* MouldMaster runtime asset is unavailable offline. Reconnect and reopen the app to cache this runtime feature pack. */\n',{status:503,headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const isShell=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
      try{
        const r=await fetch(event.request,{cache:'no-store'});
        if(r&&r.ok){if(isShell){const c=await caches.open(STATIC_CACHE);await c.put('./index.html',r.clone())}return r}
      }catch(_){}
      return await caches.match(event.request,{ignoreSearch:true})||await caches.match('./index.html')||new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>MouldMaster offline</title><main style="font:16px system-ui;padding:24px;max-width:680px"><h1>MouldMaster is not fully installed offline yet</h1><p>Reconnect once and reopen the app. The core shell installs atomically; additional learning and specialist packs are warmed best-effort and cached again when requested online.</p></main>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    })());
    return;
  }
  const runtimeCritical=url.pathname.endsWith('.js')||url.pathname.endsWith('.json');
  if(runtimeCritical){
    event.respondWith((async()=>{
      const network=await fetchAndCache(event,url);
      if(network&&network.ok)return network;
      return await caches.match(event.request,{ignoreSearch:true})||criticalOfflineResponse(url);
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    const network=fetchAndCache(event,url);
    if(cached){event.waitUntil(network);return cached}
    return await network||new Response('MouldMaster asset unavailable offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  })());
});
