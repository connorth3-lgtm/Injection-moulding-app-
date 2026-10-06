const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

function learner(id,name){
  return {id,name,role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
}
async function boot(page,active='reader-a'){
  await page.addInitScript(({active,a,b})=>{
    localStorage.clear();
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:active,users:{'reader-a':a,'reader-b':b}}));
  },{active,a:learner('reader-a','Reader A'),b:learner('reader-b','Reader B')});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&Boolean(window.MMBook?.openReaderChapter)&&Boolean(window.MM_LEARNER_SCOPE)&&!document.getElementById('mmBootstrap'));
}
async function activate(page,id){
  await page.evaluate(id=>{
    if(typeof window.switchUser!=='function')throw new Error('learner switch API unavailable');
    window.switchUser(id);
    window.MM_APP_SHELL?.dashboard?.requestCompose?.();
  },id);
  await page.waitForFunction(id=>{
    const store=JSON.parse(localStorage.getItem('mouldmasterProDB')||'{}');
    return store.activeUser===id&&Boolean(window.MMBook?.getResume)&&!document.getElementById('mmBootstrap');
  },id);
}

test('Home Book opens on first load and Keep Reading is learner scoped',async({page})=>{
  await boot(page);
  const homeBook=page.locator('#dashboard [data-mm-home-book]');
  await expect(homeBook).toBeVisible();
  await expect(homeBook.getByRole('button',{name:'Open Book'})).toBeVisible();
  await homeBook.getByRole('button',{name:'Open Book'}).click();
  await expect(page.locator('#mmBookView')).toBeVisible();

  await page.evaluate(()=>window.MMBook.openReaderChapter('r01'));
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  const marker=page.locator('[data-mm-book-reader] [data-mm-book-anchor]').nth(3);
  await expect(marker).toBeVisible();
  await marker.evaluate(el=>el.scrollIntoView({block:'start',behavior:'auto'}));
  await page.waitForTimeout(250);
  const aKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.getByRole('button',{name:'Home'}).first().click();
  await expect(page.locator('#dashboard [data-mm-home-book]')).toContainText('Keep reading');
  const aResume=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),aKey);
  expect(aResume.id).toBe('r01');
  expect(aResume.anchorId).toBeTruthy();

  await activate(page,'reader-b');
  await expect(page.locator('#dashboard [data-mm-home-book]')).toContainText('Injection moulding reference');
  expect(await page.evaluate(()=>window.MMBook.getResume())).toBeNull();
  const bKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  expect(bKey).not.toBe(aKey);
});

test('Keep Reading prioritises stable anchor ID over text/index fallback',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r08'));
  const heads=page.locator('[data-mm-book-reader] [data-mm-book-anchor]');
  await expect(heads.nth(4)).toBeVisible();
  const target=heads.nth(4);
  const targetAnchor=await target.getAttribute('data-mm-book-anchor');
  const misleadingText=await heads.nth(1).innerText();
  expect(targetAnchor).toBeTruthy();
  await target.evaluate(el=>el.scrollIntoView({block:'start',behavior:'auto'}));
  await page.waitForTimeout(250);
  await page.getByRole('button',{name:'Home'}).first().click();
  const key=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.evaluate(({key,misleadingText,targetAnchor})=>{
    const saved=JSON.parse(localStorage.getItem(key));
    saved.anchorId=targetAnchor;
    saved.anchorIndex=1;
    saved.anchorText=misleadingText;
    localStorage.setItem(key,JSON.stringify(saved));
  },{key,misleadingText,targetAnchor});

  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Keep Reading'}).click();
  const restored=page.locator(`[data-mm-book-reader] [data-mm-book-anchor="${targetAnchor}"]`);
  await expect(restored).toBeVisible();
  await page.waitForTimeout(80);
  const restoredTop=await restored.evaluate(el=>Math.round(el.getBoundingClientRect().top));
  expect(Math.abs(restoredTop)).toBeLessThan(180);
});

test('Keep Reading survives Material Atlas hydration without anchor drift',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r03'));
  const atlasHeading=page.getByRole('heading',{name:'Complete Material Data Atlas',exact:true});
  await expect(atlasHeading).toBeVisible();
  await expect(atlasHeading).toHaveAttribute('data-mm-book-anchor','module:material-families:atlas');
  await page.waitForFunction(()=>document.querySelector('[data-mm-book-material-atlas]')&&!document.querySelector('[data-mm-book-material-status]'));
  await expect(atlasHeading).toHaveAttribute('data-mm-book-anchor','module:material-families:atlas');
  await atlasHeading.evaluate(el=>el.scrollIntoView({block:'start',behavior:'auto'}));
  await page.waitForTimeout(250);
  const beforeTop=await atlasHeading.evaluate(el=>Math.round(el.getBoundingClientRect().top));
  await page.getByRole('button',{name:'Home'}).first().click();
  const saved=await page.evaluate(()=>window.MMBook.getResume());
  expect(saved.anchorId).toBe('module:material-families:atlas');
  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Keep Reading'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-mm-book-material-atlas]')&&!document.querySelector('[data-mm-book-material-status]'));
  await expect(atlasHeading).toHaveAttribute('data-mm-book-anchor','module:material-families:atlas');
  const afterTop=await atlasHeading.evaluate(el=>Math.round(el.getBoundingClientRect().top));
  expect(Math.abs(afterTop-beforeTop)).toBeLessThan(140);
});

test('Keep Reading restores, stale IDs fail to contents, and learner reset clears only active resume',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r02'));
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  const resumeTarget=page.locator('[data-mm-book-reader] [data-mm-book-anchor]').nth(4);
  await expect(resumeTarget).toBeVisible();
  const resumeAnchor=await resumeTarget.getAttribute('data-mm-book-anchor');
  await resumeTarget.evaluate(el=>el.scrollIntoView({block:'start',behavior:'auto'}));
  await page.waitForTimeout(250);
  const beforeTop=await resumeTarget.evaluate(el=>Math.round(el.getBoundingClientRect().top));
  const aKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.getByRole('button',{name:'Home'}).first().click();

  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Keep Reading'}).click();
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  expect(await page.evaluate(()=>window.MMBook.getResume().id)).toBe('r02');
  const restoredTarget=page.locator(`[data-mm-book-reader] [data-mm-book-anchor="${resumeAnchor}"]`);
  await expect(restoredTarget).toBeVisible();
  await page.waitForTimeout(80);
  const restoredTop=await restoredTarget.evaluate(el=>Math.round(el.getBoundingClientRect().top));
  expect(Math.abs(restoredTop-beforeTop)).toBeLessThan(160);

  await activate(page,'reader-b');
  await page.evaluate(()=>window.MMBook.openReaderChapter('r03'));
  const bKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.getByRole('button',{name:'Home'}).first().click();
  page.once('dialog',d=>d.accept());
  await page.evaluate(()=>window.resetData());
  await expect(page.locator('#dashboard [data-mm-home-book]')).toContainText('Injection moulding reference');
  await expect(page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Open Book'})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),bKey)).toBeNull();
  expect(await page.evaluate(key=>localStorage.getItem(key),aKey)).not.toBeNull();

  await activate(page,'reader-a');
  await page.evaluate(()=>{
    const key=window.MMBook.resumeStorageKey();
    const value=JSON.parse(localStorage.getItem(key));
    value.id='removed-reader-id';
    localStorage.setItem(key,JSON.stringify(value));
  });
  const result=await page.evaluate(()=>window.MMBook.openResume());
  expect(result).toBeFalsy();
  await expect(page.locator('[data-mm-book-contents]')).toBeVisible();
  expect(await page.evaluate(()=>window.MMBook.getResume())).toBeNull();
});
