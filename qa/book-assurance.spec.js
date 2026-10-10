const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'book-assurance-qa',name:'Book Assurance QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'book-assurance-qa',users:{'book-assurance-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS&&window.MMBook,{timeout:30000});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

test('Book distinguishes source evidence review from independent human validation',async({page})=>{
  await openApp(page);
  await page.evaluate(()=>window.MMBook.open());

  const view=page.locator('#mmBookView');
  await expect(view).toBeVisible();
  await expect(view.locator('[data-mm-book-summary]')).toContainText('46 governed modules');

  const contract=await page.evaluate(()=>{
    const data=window.MMBook?.getSmeReview?.();
    if(!data)return null;
    const approved=new Set((data.reviews||[]).filter(review=>review?.conclusion==='approved').map(review=>review.chapterId)).size;
    return {status:data.status,total:(data.chapterIds||[]).length,approved};
  });
  expect(contract,'governed Book SME review contract should be available in the installed release').not.toBeNull();
  const expectedState=contract.status==='validated'&&contract.approved===contract.total?'validated':'pending';
  await expect(view.locator('[data-mm-book-sme-status]')).toHaveText(`Independent human SME review: ${expectedState} — ${contract.approved}/${contract.total} governed modules approved. Reader chapters are derived groupings, not separate SME approvals.`);

  const readerButtons=view.locator('.mm-book-toc > li > button[data-mm-book-reader-chapter-open]');
  const moduleButtons=view.locator('[data-mm-book-chapter]');
  await expect(readerButtons).toHaveCount(20);
  await expect(moduleButtons).toHaveCount(46);
  await expect(moduleButtons.first()).toContainText('Source evidence reviewed');
  await expect(view).not.toContainText(/\bEvidence verified\b/i);

  const boundary=view.locator('[data-mm-book-accuracy]');
  await expect(boundary).toContainText('Source evidence reviewed');
  await expect(boundary).toContainText('does not imply independent human SME approval');
  await expect(boundary).toContainText('physical-device validation');
  await expect(boundary).toContainText('learner-outcome validation');
  await expect(boundary).toContainText('accreditation');
  await expect(boundary).toContainText('production validation');
});

test('Book defers governed payloads and heavy material evidence until requested',async({page})=>{
  await openApp(page);
  const initial=await page.evaluate(()=>({
    manifest:window.MMBook?.getManifest?.()||null,
    claimTraceReady:window.MM_BOOK_CLAIM_TRACE?.isReady?.()||false,
    catalog:window.MMBook?.getMaterialCatalog?.()||null,
    regional:window.MMBook?.getMaterialRegionalEvidence?.()||null,
    resources:performance.getEntriesByType('resource').map(entry=>entry.name)
  }));
  expect(initial.manifest).toBeNull();
  expect(initial.claimTraceReady).toBe(false);
  expect(initial.catalog).toBeNull();
  expect(initial.regional).toBeNull();
  expect(initial.resources.some(url=>url.includes('book-material-regional-evidence-v1.json'))).toBeFalsy();

  await page.evaluate(()=>window.MMBook.open());
  await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length===8);
  await page.waitForFunction(()=>window.MM_BOOK_CLAIM_TRACE?.isReady?.()===true);
  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog())).toBeNull();
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence())).toBeNull();

  await page.evaluate(()=>window.MMBook.openChapter('material-families'));
  await page.waitForFunction(()=>window.MMBook?.getMaterialCatalog?.()?.grades?.length===260&&window.MMBook?.getMaterialRegionalEvidence?.()?.records?.length===284);
  await expect(page.locator('[data-mm-book-catalog-grade]')).toHaveCount(24);
  await expect(page.locator('[data-mm-book-regional-row]')).toHaveCount(24);
});

test('Book open fails closed and governed retry can recover from a transient manifest error',async({page})=>{
  await page.addInitScript(()=>{
    window.__mmBookUnhandled=[];
    window.addEventListener('unhandledrejection',event=>window.__mmBookUnhandled.push(String(event.reason?.message||event.reason||'unknown')));
  });
  let manifestAttempts=0;
  await page.route('**/src/domains/learning/book-data/book-manifest-v1.json',async route=>{
    manifestAttempts++;
    if(manifestAttempts===1)return route.fulfill({status:503,contentType:'application/json',body:'{}'});
    return route.continue();
  });
  await openApp(page);
  await page.evaluate(()=>window.MMBook.open());
  await expect(page.locator('[data-mm-book-summary]')).toContainText('could not be verified');
  await expect(page.locator('[data-mm-book-failure]')).toContainText('Book unavailable');
  expect(await page.evaluate(()=>window.MMBook.getManifest())).toBeNull();
  const retry=page.locator('[data-mm-book-retry]');
  await expect(retry).toHaveText('Retry governed Book load');
  await retry.click();
  await page.waitForFunction(()=>Boolean(window.MMBook.getManifest()?.parts?.length));
  await expect(page.locator('[data-mm-book-failure]')).toHaveCount(0);
  await expect(page.locator('[data-mm-book-summary]')).toContainText('20 reader chapters');
  expect(manifestAttempts).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.__mmBookUnhandled)).toEqual([]);
});

test('Cold global search finds exact-grade Book material chapter without loading regional Book evidence',async({page})=>{
  await openApp(page);
  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog())).toBeNull();
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence())).toBeNull();
  await page.evaluate(()=>window.openSearch());
  const input=page.locator('#globalSearch');
  await input.fill('DURACON M90-44');
  await expect(page.locator('[data-mm-book-search-result]')).not.toHaveCount(0);
  await expect(page.locator('[data-mm-book-search-result]').first()).toContainText('Book:');
  await input.fill('D');
  await expect(page.locator('[data-mm-book-search-result]')).toHaveCount(0);
  await input.fill('DURACON M90-44');
  await expect(page.locator('[data-mm-book-search-result]')).not.toHaveCount(0);
  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog())).toBeNull();
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence())).toBeNull();
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>entry.name));
  expect(resources.some(url=>url.includes('book-material-regional-evidence-v1.json'))).toBeFalsy();
});



test('Book ignores a delayed chapter load after switching back to Home',async({page})=>{
  await openApp(page);
  expect(await page.evaluate(()=>window.MMBook.getManifest())).toBeNull();
  let unblockRequest,requestStarted;
  const blocked=new Promise(resolve=>{unblockRequest=resolve;});
  const requested=new Promise(resolve=>{requestStarted=resolve;});
  await page.route('**/book-publication-authorization-v1.json',async route=>{
    requestStarted();
    await blocked;
    await route.continue();
  });
  try{
    await page.evaluate(()=>{void window.MMBook.openReaderChapter('r01');});
    await requested;
    await expect(page.locator('#mmBookView')).toBeVisible();
    await page.evaluate(()=>window.switchView('dashboard'));
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page.locator('#mmBookView')).toBeHidden();
    unblockRequest();
    await page.waitForFunction(()=>Boolean(window.MMBook.getManifest()));
    await expect(page.locator('#mmBookView [data-mm-book-reader-chapter]')).toHaveCount(0);
    await expect(page.locator('#nav [data-mm-book-tab].active')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.classList.contains('mm-book-instant-scroll'))).toBe(false);
  }finally{unblockRequest();}
});


test('Book route changes preserve the last visible reading bookmark',async({page})=>{
  await openApp(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r01'));
  await expect(page.locator('#mmBookView [data-mm-book-reader]')).toBeVisible();
  // Route exit flushes any pending 180ms scroll save. Compare with the
  // visible scroll at the instant of exit, not with an older debounced value
  // that can legitimately still be 0 during WebKit's deferred layout.
  const {before,after,visibleScrollY,storageWrites,debug}=await page.evaluate(()=>{
    let root=document.querySelector('#mmBookView [data-mm-book-reader]');
    for(;root&&root!==document.body;root=root.parentElement){
      const style=getComputedStyle(root);
      if(/^(auto|scroll|overlay)$/.test(String(style.overflowY||'').toLowerCase())&&root.scrollHeight>root.clientHeight+1)break;
    }
    if(!root||root===document.body)root=document.scrollingElement||document.documentElement;
    const visibleScrollY=Math.max(0,Number(root.scrollTop)||0);
    const before=window.MMBook.getResume();
    const storageWrites=[],setItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(String(key).startsWith('mm_book_resume_v1::')){
        try{storageWrites.push({value:JSON.parse(value)?.scrollY,key:String(key)})}catch(_){}
      }
      return setItem.call(this,key,value);
    };
    const debug={hasPreExit:typeof window.MMBook.prepareRouteExit,
      dispatch:window.MM_RUNTIME_V2?.snapshot?.()?.core?.switchView,
      viewHidden:document.querySelector('#mmBookView')?.classList.contains('hidden'),
      readerHidden:document.querySelector('#mmBookView [data-mm-book-reader]')?.hidden};
    try{window.switchView('dashboard')}finally{Storage.prototype.setItem=setItem}
    return {before,after:window.MMBook.getResume(),visibleScrollY,storageWrites,debug};
  });
  expect(before?.kind).toBe('reader-chapter');
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('#mmBookView')).toBeHidden();
  expect(after?.id).toBe(before.id);
  expect(after?.anchorId).toBe(before.anchorId);
  expect(after?.scrollY,`route exit: ${JSON.stringify({before:before?.scrollY,after:after?.scrollY,visibleScrollY,storageWrites,debug})}`).toBeCloseTo(visibleScrollY,1);
  expect(await page.evaluate(()=>document.documentElement.classList.contains('mm-book-instant-scroll'))).toBe(false);
});

test('Book menu launch survives its canonical route event and closes on Home',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const more=page.locator('#nav [data-mm-desktop-more-tools]');
  await expect(more).toBeVisible();
  await more.click();
  const launcher=page.locator('[data-mm-registry-menu="book"]');
  await expect(launcher).toBeVisible();
  await launcher.click();
  // The shell emits onViewChange('book') *after* opening the Book.
  // This event announces the current route; it must not close the reader.
  await expect(page.locator('#mmBookView')).toBeVisible();
  await page.evaluate(()=>window.switchView('dashboard'));
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('#mmBookView')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.classList.contains('mm-book-instant-scroll'))).toBe(false);
});
