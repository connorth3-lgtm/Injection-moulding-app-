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
    const store=JSON.parse(localStorage.getItem('mouldmasterProDB'));
    store.activeUser=id;
    localStorage.setItem('mouldmasterProDB',JSON.stringify(store));
  },id);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&Boolean(window.MMBook?.getResume)&&!document.getElementById('mmBootstrap'));
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
  await page.evaluate(()=>window.scrollTo(0,Math.max(360,Math.floor(document.documentElement.scrollHeight*0.35))));
  const aKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.getByRole('button',{name:'Home'}).first().click();
  await expect(page.locator('#dashboard [data-mm-home-book]')).toContainText('Keep reading');
  const aResume=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),aKey);
  expect(aResume.id).toBe('r01');
  expect(aResume.scrollY).toBeGreaterThan(0);

  await activate(page,'reader-b');
  await expect(page.locator('#dashboard [data-mm-home-book]')).toContainText('Injection moulding reference');
  expect(await page.evaluate(()=>window.MMBook.getResume())).toBeNull();
  const bKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  expect(bKey).not.toBe(aKey);
});

test('Keep Reading distinguishes duplicate heading text with ordinal anchors',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r08'));
  const dup=page.getByRole('heading',{name:'What evidence should change the conclusion?',exact:true});
  await expect(dup).toHaveCount(2);
  await dup.nth(1).scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollBy(0,80));
  const secondTop=await dup.nth(1).evaluate(el=>Math.round(el.getBoundingClientRect().top));
  const secondAnchor=await dup.nth(1).getAttribute('data-mm-book-anchor');
  expect(secondAnchor).toBeTruthy();
  await page.getByRole('button',{name:'Home'}).first().click();
  const saved=await page.evaluate(()=>window.MMBook.getResume());
  expect(saved.anchorId).toBe(secondAnchor);
  expect(Number.isInteger(saved.anchorIndex)).toBeTruthy();
  expect(saved.anchorText).toBe('What evidence should change the conclusion?');

  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Keep Reading'}).click();
  await expect(dup).toHaveCount(2);
  await page.waitForTimeout(50);
  const firstTop=await dup.nth(0).evaluate(el=>Math.round(el.getBoundingClientRect().top));
  const restoredSecondTop=await dup.nth(1).evaluate(el=>Math.round(el.getBoundingClientRect().top));
  expect(Math.abs(restoredSecondTop-secondTop)).toBeLessThan(140);
  expect(Math.abs(restoredSecondTop)).toBeLessThan(Math.abs(firstTop));
});

test('Keep Reading survives Material Atlas hydration without anchor drift',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MMBook.openReaderChapter('r03'));
  const atlasHeading=page.getByRole('heading',{name:'Complete Material Data Atlas',exact:true});
  await expect(atlasHeading).toBeVisible();
  await expect(atlasHeading).toHaveAttribute('data-mm-book-anchor','module:material-families:atlas');
  await page.waitForFunction(()=>document.querySelector('[data-mm-book-material-atlas]')&&!document.querySelector('[data-mm-book-material-status]'));
  await expect(atlasHeading).toHaveAttribute('data-mm-book-anchor','module:material-families:atlas');
  await atlasHeading.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollBy(0,70));
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
  await page.evaluate(()=>window.scrollTo(0,420));
  const beforeLeaveY=await page.evaluate(()=>window.scrollY);
  const aKey=await page.evaluate(()=>window.MMBook.resumeStorageKey());
  await page.getByRole('button',{name:'Home'}).first().click();

  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:'Keep Reading'}).click();
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  expect(await page.evaluate(()=>window.MMBook.getResume().id)).toBe('r02');
  await page.waitForTimeout(50);
  const restoredY=await page.evaluate(()=>window.scrollY);
  expect(Math.abs(restoredY-beforeLeaveY)).toBeLessThan(140);

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
