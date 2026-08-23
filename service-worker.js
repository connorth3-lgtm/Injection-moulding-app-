const CACHE_VERSION = "2026.08.23.3";
const STATIC_CACHE = `mouldmaster-static-${CACHE_VERSION}`;
const CORE = [
  "./index.html",
  "./manifest.webmanifest",
  "./mouldmaster-192.png",
  "./mouldmaster-512.png",
  "./version.json",
  "./reading-patch.css",
  "./reading-patch.js",
  "./training-upgrade.js"
];

function enhanceHTML(text){
  let out=text.replaceAll('2026.08.22.2','2026.08.23.3').replaceAll('2026.08.23.1','2026.08.23.3').replaceAll('2026.08.23.2','2026.08.23.3');
  if(!out.includes('reading-patch.css')) out=out.replace('</head>','  <link rel="stylesheet" href="./reading-patch.css?v=2026.08.23.3">\n</head>');
  if(!out.includes('reading-patch.js')) out=out.replace('</body>','  <script src="./reading-patch.js?v=2026.08.23.3"></script>\n</body>');
  if(!out.includes('training-upgrade.js')) out=out.replace('</body>','  <script src="./training-upgrade.js?v=2026.08.23.3"></script>\n</body>');
  return out;
}

async function enhancedNavigationResponse(response){
  const text=await response.text();
  const headers=new Headers(response.headers);
  headers.set('Content-Type','text/html; charset=utf-8');
  headers.delete('Content-Length');
  return new Response(enhanceHTML(text),{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    try{
      const raw=await fetch(new Request("./index.html",{cache:"reload"}));
      if(raw&&raw.ok) await cache.put("./index.html",await enhancedNavigationResponse(raw.clone()));
    }catch(_){}
    await Promise.all(CORE.filter(x=>x!=="./index.html").map(async url=>{
      try{await cache.add(new Request(url,{cache:"reload"}));}catch(_){}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("mouldmaster-static-") && key !== STATIC_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  if(event.request.mode === "navigate"){
    event.respondWith((async () => {
      try{
        const raw = await fetch(event.request,{cache:"no-store"});
        if(raw && raw.ok){
          const response=await enhancedNavigationResponse(raw.clone());
          const cache=await caches.open(STATIC_CACHE);
          await cache.put("./index.html",response.clone());
          return response;
        }
        return raw;
      }catch(_){
        const cached=await caches.match("./index.html");
        if(cached) return cached;
        return new Response("<h1>MouldMaster is offline</h1><p>Reconnect once to finish installing the offline copy.</p>",{status:503,headers:{"Content-Type":"text/html; charset=utf-8"}});
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached=await caches.match(event.request);
    const network=fetch(event.request,{cache:"no-store"}).then(async response=>{
      if(response&&response.ok){
        const cache=await caches.open(STATIC_CACHE);
        await cache.put(event.request,response.clone());
      }
      return response;
    }).catch(()=>null);
    if(cached){event.waitUntil(network);return cached;}
    return await network || new Response("",{status:504});
  })());
});
