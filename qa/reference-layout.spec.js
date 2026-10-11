const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function openApp(page){
  await page.addInitScript(()=>{
    const id='reference-layout-qa';
    localStorage.setItem('mouldmasterProDB',JSON.stringify({
      activeUser:id,users:{[id]:{id,name:'Reference Layout QA',role:'learner',
      completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],
      currentLesson:1,lastSeen:'2026-10-11T00:00:00Z',onboardingDone:true,
      experience:'Beginner',goal:'Learn injection moulding',dailyMinutes:15,region:'ALL'}}
    }));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED&&window.MM_REFERENCE_LAYOUT));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

for(const width of [320,360,390,412]){
  test('reference layout has illustrated, functional mobile tabs at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:844});
    await openApp(page);
    await expect(page.locator('#dashboard .mm-reference-home-hero')).toBeVisible();
    const machine=page.locator('#dashboard .mm-reference-hero-photo');
    await expect(machine).toHaveAttribute('src','./assets/mockup-home-machine.webp');
    await expect.poll(()=>machine.evaluate(img=>img.complete&&img.naturalWidth>=90)).toBe(true);
    await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
    await expect(page.locator('#dashboard .mm-reference-home-practice')).toBeVisible();
    await expect(page.locator('#mmMissionControl .mm-mc-context')).toHaveCount(0);
    await expect(page.locator('#mmMissionControl .mm-mc-timeline')).toHaveCount(0);

    await page.evaluate(()=>switchView('path'));
    await expect(page.locator('#path .mm-reference-title')).toHaveText('Learn');
    await expect(page.locator('#path .mm-reference-list-card')).toHaveCount(9);
    const illustratedCourses=page.locator('#path .mm-reference-list-card');
    await expect(illustratedCourses.nth(1)).toContainText('Machines, controls and the moulding cycle');
    await expect(illustratedCourses.nth(2)).toContainText('Polymers, properties and material selection');
    await expect(illustratedCourses.nth(3)).toContainText('Tooling, runners, gates and cooling');
    await expect(illustratedCourses.nth(4)).toContainText('Establishing and verifying process settings');
    expect(await illustratedCourses.nth(2).locator('.mm-reference-photo').getAttribute('data-mm-photo-index')).toBe('3');
    await expect(page.locator('#path [data-mm-lesson-catalog]')).toHaveCount(1);
    await page.locator('#path .mm-reference-learn-search').fill('injection');
    await expect(page.locator('#path [data-mm-catalog-query]')).toHaveValue('injection');

    await page.evaluate(()=>switchView('materials'));
    await expect(page.locator('#materials .mm-reference-materials-title')).toHaveText('Materials');
    await expect(page.locator('#materials .mm-reference-materials-title')).toHaveCount(1);
    await expect(page.locator('#materials .mm-material-all-index-head h3')).toHaveText('Materials');
    await expect(page.locator('#materials [data-mm-all-material-index]')).toHaveCount(1);
    await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
    await expect(page.locator('#materials [data-mm-exact-query]')).toBeHidden();
    const first=page.locator('#materials .mm-material-index-card[data-mm-material-index-type="exact-grade"]').first();
    await expect(first).toBeVisible();
    await expect(first.locator('.mm-reference-material-art')).toBeVisible();
    const summary=first.locator('summary.mm-material-index-summary');
    // The original core has a ::after arrow AND the illustrated card adds one
    // explicit arrow. Mobile screenshots exposed both rendering simultaneously.
    expect(await summary.evaluate(el=>getComputedStyle(el,'::after').content)).toBe('none');
    await expect(first.locator('.mm-material-index-expand')).toBeVisible();
    await first.locator('summary').click();
    await expect(first.locator('.mm-material-index-expand')).toBeVisible();
    await expect(first.locator('.mm-reference-diagrams .mm-reference-photo')).toHaveCount(3);
    const gradeTiles=await first.locator('.mm-reference-diagrams .mm-reference-photo').evaluateAll(nodes=>nodes.map(el=>Number(el.dataset.mmPhotoIndex)));
    const gradeThumbnail=Number(await first.locator('.mm-reference-material-art').getAttribute('data-mm-photo-index'));
    expect(gradeTiles).toEqual([gradeThumbnail,31,32]);
    await expect(first.locator('.mm-reference-technical-diagrams .mm-reference-picture')).toHaveCount(3);
    await expect(first.locator('.mm-exact-sources')).toBeAttached();
    await expect(first.locator('[data-mm-material-jump="compare"]')).toBeVisible();

    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-reference-title')).toHaveText('Practice');
    await expect(page.locator('#scenarios .mm-reference-list-card')).toHaveCount(9);
    await page.locator('#scenarios .mm-reference-list-card').filter({hasText:'Material selection'}).click();
    await expect(page.locator('#materials')).toBeVisible();

    await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();
    await expect(page.locator('#modal .mm-more-disclosure')).toHaveCount(6);
    await expect(page.locator('#modal .mm-reference-more-extra')).toHaveCount(2);
    await expect(page.locator('#modal .mm-reference-more-extra').filter({hasText:'About'}).locator('a')).toHaveAttribute('href','./support.html#mmPwa');
    await expect(page.locator('#modal [data-mm-registry-menu="mission-evidence"]')).toHaveCount(1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}

test('reference diagrams load locally without external image dependencies',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios .mm-reference-picture')).toHaveCount(9);
  await page.waitForFunction(()=>document.documentElement.classList.contains('mm-reference-photo-ready'));
  await expect(page.locator('#scenarios .mm-reference-photo')).toHaveCount(9);
  const tiles=await page.locator('#scenarios .mm-reference-photo').evaluateAll(rows=>rows.map(node=>({tile:Number(node.dataset.mmPhotoIndex),background:getComputedStyle(node).backgroundImage})));
  expect(tiles.map(x=>x.tile)).toEqual([19,20,21,22,23,24,25,26,27]);
  expect(tiles.every(x=>x.background.includes('mockup-reference-tiles.webp'))).toBe(true);
  const images=await page.locator('#scenarios .mm-reference-picture').evaluateAll(rows=>
    rows.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0})));
  expect(images.every(img=>img.src.startsWith('./assets/book-diagrams/')&&img.loaded)).toBeTruthy();
});