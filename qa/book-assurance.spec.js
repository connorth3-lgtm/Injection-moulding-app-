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

  const readerButtons=view.locator('[data-mm-book-reader-chapter-open]');
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
    catalog:window.MMBook?.getMaterialCatalog?.()||null,
    regional:window.MMBook?.getMaterialRegionalEvidence?.()||null,
    resources:performance.getEntriesByType('resource').map(entry=>entry.name)
  }));
  expect(initial.manifest).toBeNull();
  expect(initial.catalog).toBeNull();
  expect(initial.regional).toBeNull();
  expect(initial.resources.some(url=>url.includes('book-material-regional-evidence-v1.json'))).toBeFalsy();

  await page.evaluate(()=>window.MMBook.open());
  await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length===8);
  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog())).toBeNull();
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence())).toBeNull();

  await page.evaluate(()=>window.MMBook.openChapter('material-families'));
  await page.waitForFunction(()=>window.MMBook?.getMaterialCatalog?.()?.grades?.length===260&&window.MMBook?.getMaterialRegionalEvidence?.()?.records?.length===284);
  await expect(page.locator('[data-mm-book-catalog-grade]')).toHaveCount(24);
  await expect(page.locator('[data-mm-book-regional-row]')).toHaveCount(24);
});

test('Book open consumes governed-load rejection while remaining fail-closed',async({page})=>{
  await page.addInitScript(()=>{
    window.__mmBookUnhandled=[];
    window.addEventListener('unhandledrejection',event=>window.__mmBookUnhandled.push(String(event.reason?.message||event.reason||'unknown')));
  });
  await page.route('**/src/domains/learning/book-data/book-manifest-v1.json',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await openApp(page);
  await page.evaluate(()=>window.MMBook.open());
  await expect(page.locator('[data-mm-book-summary]')).toContainText('could not be verified');
  await expect(page.locator('#mmBookView')).toContainText('Book unavailable');
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.__mmBookUnhandled)).toEqual([]);
  expect(await page.evaluate(()=>window.MMBook.getManifest())).toBeNull();
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
  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog())).toBeNull();
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence())).toBeNull();
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>entry.name));
  expect(resources.some(url=>url.includes('book-material-regional-evidence-v1.json'))).toBeFalsy();
});

