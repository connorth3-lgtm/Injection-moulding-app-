const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/';

test('normal browser visits preserve the MouldMaster offline service worker and cache',async({page,context})=>{
  test.setTimeout(90000);
  await page.goto(BASE,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.MM_BROWSER_UPDATE_MODE,{timeout:30000});
  expect(await page.evaluate(()=>window.MM_BROWSER_UPDATE_MODE)).toBe('shared-origin-service-worker');
  await page.evaluate(async()=>{if('serviceWorker'in navigator)await navigator.serviceWorker.ready});
  const before=await page.evaluate(async()=>({
    registrations:'serviceWorker'in navigator?(await navigator.serviceWorker.getRegistrations()).length:0,
    caches:'caches'in window?(await caches.keys()).filter(k=>k.startsWith('mouldmaster-static-')):[]
  }));
  expect(before.registrations).toBeGreaterThan(0);
  expect(before.caches.length).toBeGreaterThan(0);

  const second=await context.newPage();
  await second.goto(BASE,{waitUntil:'load'});
  await second.waitForFunction(()=>window.MM_BROWSER_UPDATE_MODE==='shared-origin-service-worker',{timeout:30000});
  await second.evaluate(async()=>{if('serviceWorker'in navigator)await navigator.serviceWorker.ready});
  await second.close();

  const after=await page.evaluate(async()=>({
    registrations:(await navigator.serviceWorker.getRegistrations()).length,
    caches:(await caches.keys()).filter(k=>k.startsWith('mouldmaster-static-'))
  }));
  expect(after.registrations).toBeGreaterThan(0);
  expect(after.caches.length).toBeGreaterThan(0);
});
