const {test,expect}=require('@playwright/test');
const fs=require('fs');
const http=require('http');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const WORKER_TEMPLATE=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
const CACHE_REVISION='two-release-transition';

function workerFor(release){
  let source=WORKER_TEMPLATE
    .replace(/^const CACHE_VERSION='[^']+';$/m,`const CACHE_VERSION='${release}';`)
    .replace(/^const CACHE_REVISION='[^']+';$/m,`const CACHE_REVISION='${CACHE_REVISION}';`);
  const start=source.indexOf('const CORE=[');
  const end=source.indexOf('const RELEASE_ASSETS=',start);
  if(start<0||end<0)throw new Error('Could not isolate the service-worker release asset declarations.');
  const minimal=[
    "const CORE=['./index.html','./runtime.js','./version.json'];",
    'const OPTIONAL=[];',
    ''
  ].join('\n');
  return source.slice(0,start)+minimal+source.slice(end);
}

function htmlFor(release){
  return `<!doctype html>
<meta charset="utf-8">
<title>PWA transition ${release}</title>
<script>window.__documentVersion=${JSON.stringify(release)};</script>
<script src="./runtime.js"></script>
<script>
window.__registrationPromise=('serviceWorker' in navigator)
  ? navigator.serviceWorker.register('./service-worker.js',{scope:'./'})
  : Promise.reject(new Error('service workers unavailable'));
</script>`;
}

function makeServer(){
  const state={release:'v1',offline:false};
  const server=http.createServer((req,res)=>{
    if(state.offline){
      res.writeHead(503,{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'});
      res.end('offline fixture');
      return;
    }
    const pathname=new URL(req.url,'http://fixture.invalid').pathname;
    const common={'Cache-Control':'no-store'};
    if(pathname==='/'||pathname==='/index.html'){
      res.writeHead(200,{...common,'Content-Type':'text/html; charset=utf-8'});
      res.end(htmlFor(state.release));
      return;
    }
    if(pathname==='/runtime.js'){
      res.writeHead(200,{...common,'Content-Type':'text/javascript; charset=utf-8'});
      res.end(`window.__runtimeVersion=${JSON.stringify(state.release)};\n`);
      return;
    }
    if(pathname==='/version.json'){
      res.writeHead(200,{...common,'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({release:state.release}));
      return;
    }
    if(pathname==='/service-worker.js'){
      res.writeHead(200,{...common,'Content-Type':'text/javascript; charset=utf-8','Service-Worker-Allowed':'/'});
      res.end(workerFor(state.release));
      return;
    }
    res.writeHead(404,{...common,'Content-Type':'text/plain; charset=utf-8'});
    res.end('not found');
  });
  return {state,server};
}

async function listen(server){
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',resolve);
  });
  const address=server.address();
  if(!address||typeof address==='string')throw new Error('transition fixture did not expose a TCP port');
  return `http://127.0.0.1:${address.port}/`;
}

async function closeServer(server){
  await new Promise(resolve=>server.close(()=>resolve()));
}

async function waitForControlled(page){
  await page.waitForFunction(async()=>{
    if(!('serviceWorker' in navigator))return false;
    await navigator.serviceWorker.ready;
    return true;
  },{timeout:30000});
  if(!(await page.evaluate(()=>!!navigator.serviceWorker.controller))){
    await page.reload({waitUntil:'load'});
  }
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
}

async function cacheKeys(page){
  return page.evaluate(()=>caches.keys());
}

// Regression contract for issue #251. This intentionally models two distinct
// release generations while reusing the repository's real service-worker logic.
// This test reproduces the .25 mixed-release failure and is the acceptance
// contract for the next governed release: a waiting worker may cache the next
// generation, but the active client must remain byte-coherent until a full
// document transition. Automated browser evidence never substitutes for physical PWA QA.
test('an old controlled client stays release-coherent until a complete new release takes over',async({page,context})=>{
  test.setTimeout(90000);
  const fixture=makeServer();
  const base=await listen(fixture.server);
  try{
    await page.goto(base,{waitUntil:'load'});
    await waitForControlled(page);
    expect(await page.evaluate(()=>({document:window.__documentVersion,runtime:window.__runtimeVersion}))).toEqual({document:'v1',runtime:'v1'});
    expect(await cacheKeys(page)).toContain(`mouldmaster-static-v1-${CACHE_REVISION}`);

    // Publish v2 while the v1-controlled document remains open, then explicitly
    // ask the registration to check for the newer worker.
    fixture.state.release='v2';
    await page.evaluate(async()=>{
      const registration=await navigator.serviceWorker.getRegistration();
      if(!registration)throw new Error('missing v1 service-worker registration');
      await registration.update();
    });
    await expect.poll(async()=>(await cacheKeys(page)).includes(`mouldmaster-static-v2-${CACHE_REVISION}`),{timeout:30000}).toBe(true);

    // The still-open v1 document must continue to receive v1 governed bytes.
    // A v2 fetch here is a mixed-release execution window.
    const oldClient=await page.evaluate(async()=>{
      const runtimeText=await (await fetch('./runtime.js',{cache:'no-store'})).text();
      const version=await (await fetch('./version.json',{cache:'no-store'})).json();
      const fetchedRuntime=/__runtimeVersion=["']([^"']+)["']/.exec(runtimeText)?.[1]||'';
      return {
        document:window.__documentVersion,
        runtime:window.__runtimeVersion,
        fetchedRuntime,
        fetchedVersion:version.release,
        caches:await caches.keys()
      };
    });
    expect(oldClient.document).toBe('v1');
    expect(oldClient.runtime).toBe('v1');
    expect(oldClient.fetchedRuntime).toBe('v1');
    expect(oldClient.fetchedVersion).toBe('v1');
    expect(oldClient.caches).toContain(`mouldmaster-static-v1-${CACHE_REVISION}`);
    expect(oldClient.caches).toContain(`mouldmaster-static-v2-${CACHE_REVISION}`);

    // Once the old client leaves the scope, the fully installed v2 release may
    // take over. Retry through about:blank so a transient v1 page never pins the
    // old worker indefinitely while activation settles.
    await page.close();
    const next=await context.newPage();
    let transitioned=false;
    for(let attempt=0;attempt<12&&!transitioned;attempt+=1){
      await next.goto(base,{waitUntil:'load'});
      await next.waitForFunction(()=>window.__documentVersion&&window.__runtimeVersion,{timeout:10000});
      const identity=await next.evaluate(()=>({document:window.__documentVersion,runtime:window.__runtimeVersion}));
      transitioned=identity.document==='v2'&&identity.runtime==='v2';
      if(!transitioned){
        await next.goto('about:blank');
        await new Promise(resolve=>setTimeout(resolve,250));
      }
    }
    expect(transitioned).toBe(true);
    await waitForControlled(next);
    expect(await next.evaluate(async()=>({
      document:window.__documentVersion,
      runtime:window.__runtimeVersion,
      fetchedVersion:(await (await fetch('./version.json')).json()).release
    }))).toEqual({document:'v2',runtime:'v2',fetchedVersion:'v2'});

    // The completed v2 release must still relaunch coherently with the origin
    // unavailable, preserving the existing offline recovery contract.
    fixture.state.offline=true;
    await next.close();
    const offline=await context.newPage();
    await offline.goto(base,{waitUntil:'load'});
    expect(await offline.evaluate(()=>({document:window.__documentVersion,runtime:window.__runtimeVersion}))).toEqual({document:'v2',runtime:'v2'});
  }finally{
    fixture.state.offline=false;
    await closeServer(fixture.server);
  }
});
