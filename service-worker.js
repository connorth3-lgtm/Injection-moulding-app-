const CACHE_VERSION = "2026.08.23.1";
const STATIC_CACHE = `mouldmaster-static-${CACHE_VERSION}`;
const CORE = [
  "./index.html",
  "./manifest.webmanifest",
  "./mouldmaster-192.png",
  "./mouldmaster-512.png",
  "./version.json",
  "./reading-patch.css",
  "./reading-patch.js"
];

function injectReadingPatch(html){
  if(!html.includes('reading-patch.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="./reading-patch.css"></head>');
  }
  if(!html.includes('reading-patch.js')){
    html=html.replace('</body>','<script src="./reading-patch.js"></script></body>');
  }
  return html;
}

async function patchedHtmlResponse(response){
  const text=await response.text();
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  return new Response(injectReadingPatch(text),{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(CORE.map(async url => {
      try { await cache.add(new Request(url, {cache:"reload"})); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith("mouldmaster-static-") && key !== STATIC_CACHE).map(key => caches.delete(key))
    );
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
        const response = await fetch(event.request, {cache:"no-store"});
        if(response && response.ok){
          const patched=await patchedHtmlResponse(response.clone());
          const cache=await caches.open(STATIC_CACHE);
          await cache.put("./index.html",patched.clone());
          return patched;
        }
        return response;
      }catch(_){
        const cached = await caches.match("./index.html");
        if(cached){
          const ct=cached.headers.get('content-type')||'';
          if(ct.includes('text/html')) return patchedHtmlResponse(cached.clone());
          return cached;
        }
        return new Response("<h1>MouldMaster is offline</h1><p>Reconnect once to finish installing the offline copy.</p>",{status:503,headers:{"Content-Type":"text/html; charset=utf-8"}});
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    const network = fetch(event.request, {cache:"no-store"}).then(async response => {
      if(response && response.ok){
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    }).catch(() => null);
    if(cached){ event.waitUntil(network); return cached; }
    const response = await network;
    return response || new Response("", {status:504});
  })());
});
