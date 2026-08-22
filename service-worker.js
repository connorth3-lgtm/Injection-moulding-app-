const CACHE_VERSION = "2026.08.22.1";
const STATIC_CACHE = `mouldmaster-static-${CACHE_VERSION}`;
const CORE = [
  "./index.html",
  "./manifest.webmanifest",
  "./mouldmaster-192.png",
  "./mouldmaster-512.png",
  "./version.json"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // index.html is the required offline fallback.
    await cache.add(new Request("./index.html", {cache:"reload"}));
    // These improve install/offline UX, but one failed optional asset must not brick an update.
    await Promise.all(
      CORE.filter(x => x !== "./index.html").map(async url => {
        try { await cache.add(new Request(url, {cache:"reload"})); } catch (_) {}
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith("mouldmaster-static-") && key !== STATIC_CACHE)
        .map(key => caches.delete(key))
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
          const cache = await caches.open(STATIC_CACHE);
          await cache.put("./index.html", response.clone());
        }
        return response;
      }catch(_){
        const cached = await caches.match("./index.html");
        if(cached) return cached;
        return new Response(
          "<h1>MouldMaster is offline</h1><p>Reconnect once to finish installing the offline copy.</p>",
          {status:503, headers:{"Content-Type":"text/html; charset=utf-8"}}
        );
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

    if(cached){
      event.waitUntil(network);
      return cached;
    }
    const response = await network;
    return response || new Response("", {status:504});
  })());
});
