const CACHE_VERSION='2026.08.26.2';
const CACHE_REVISION='process-data-sweep-20260827';
const STATIC_CACHE=`mouldmaster-static-${CACHE_VERSION}-${CACHE_REVISION}`;
const CORE=[
  './index.html',
  './MouldMaster_Core_App.html',
  './MouldMaster_Academy_App.html',
  './manifest.webmanifest',
  './mouldmaster-192.png',
  './mouldmaster-512.png',
  './version.json',
  './reading-patch.css',
  './reading-patch.js',
  './training-upgrade.js',
  './training-qa-fix.js',
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
  './lesson-evidence-depth.js',
  './assessment-evidence-approval.js',
  './app-shell-registry.js',
  './pwa-shell.js',
  './learning-experience.js',
  './process-data-diagnostics.js',
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
  './process-data-20-pass-atlas.js',
  './process-data-local-intake.js',
  './curriculum-integration.js',
  './specialist-curriculum.js',
  './mould-master-workspace.js',
  './app-shell-finalize.js',
  './learning-analytics.js',
  './repair.html',
  './privacy.html',
  './support.html'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    await cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'})));
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
      const name=url.pathname.split('/').pop();
      await c.put(name?`./${name}`:event.request,r.clone());
    }
    return r;
  }catch(_){return null}
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
      return await caches.match(event.request,{ignoreSearch:true})||await caches.match('./index.html')||new Response('<h1>MouldMaster is offline</h1><p>Reconnect once to finish installing the offline copy.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
    })());
    return;
  }
  const runtimeCritical=url.pathname.endsWith('.js')||url.pathname.endsWith('.json');
  if(runtimeCritical){
    event.respondWith((async()=>{
      const network=await fetchAndCache(event,url);
      if(network&&network.ok)return network;
      return await caches.match(event.request,{ignoreSearch:true})||new Response('',{status:504});
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    const network=fetchAndCache(event,url);
    if(cached){event.waitUntil(network);return cached}
    return await network||new Response('',{status:504});
  })());
});