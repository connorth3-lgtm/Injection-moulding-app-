const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
async function ready(page){
  await page.addInitScript(()=>{
    const person={id:'catalog-qa',name:'Catalog QA',role:'learner',completed:[1,2],bookmarks:[1,12],notes:{},examScores:{},learningAwards:[],currentLesson:3,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:person.id,users:{[person.id]:person}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_PRIMARY_HUBS&&window.MM_SIMPLE_LESSON_EXPERIENCE&&window.MM_LESSON_CATALOG&&window.MM_APP_SHELL_FINALIZED));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.evaluate(()=>switchView('path'));
}
test('all 120 core and 20 optional specialist lessons share one browsable Learn page',async({page})=>{
  await ready(page);
  const library=page.locator('#path .mm-all-lessons');
  await expect(library.locator('[data-mm-lesson-id]')).toHaveCount(120);
  await expect(library.locator('[data-mm-specialist-id]')).toHaveCount(20);
  await expect(library.locator('[data-mm-catalog-group]')).toHaveCount(13);
  await expect(library.locator('[data-mm-catalog-count]')).toHaveText('140 lessons shown');
  await expect(page.locator('#path [data-mm-hub-action="path-detail"]')).toHaveCount(0);
  await expect(page.locator('#path [data-mm-hub-action="specialist"]')).toHaveCount(0);
});
test('search, status and saved filters find the canonical lessons without changing progress',async({page})=>{
  await ready(page);
  const root=page.locator('#path .mm-all-lessons');
  await root.locator('[data-mm-catalog-filter]').selectOption('done');
  await expect(root.locator('[data-mm-catalog-count]')).toHaveText('2 lessons shown');
  await root.locator('[data-mm-catalog-filter]').selectOption('saved');
  await expect(root.locator('[data-mm-catalog-count]')).toHaveText('2 lessons shown');
  await root.locator('[data-mm-catalog-filter]').selectOption('specialist');
  await expect(root.locator('[data-mm-catalog-count]')).toHaveText('20 lessons shown');
  await root.locator('[data-mm-catalog-filter]').selectOption('all');
  await root.locator('[data-mm-catalog-query]').fill('zzzz-no-match-zzzz');
  await expect(root.locator('[data-mm-catalog-count]')).toHaveText('0 lessons shown');
  await expect(root.locator('[data-mm-catalog-empty]')).toBeVisible();
  const db=await page.evaluate(()=>JSON.parse(localStorage.getItem('mouldmasterProDB')));
  expect(db.users['catalog-qa'].completed).toEqual([1,2]);
});
test('lesson reader includes the same library, not an extra 10-lesson sidebar',async({page})=>{
  await ready(page);
  await page.locator('#path [data-mm-catalog-group]').nth(1).locator('summary').first().click();
  await page.locator('#path [data-mm-lesson-id="12"]').click();
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#lesson .lesson-side')).toHaveCount(0);
  const drawer=page.locator('#lesson .mm-lessons-drawer');
  await expect(drawer).toBeVisible();
  await drawer.locator('summary').first().click();
  await expect(drawer.locator('[data-mm-lesson-id]')).toHaveCount(120);
  await expect(drawer.locator('[data-mm-specialist-id]')).toHaveCount(20);
  await drawer.locator('[data-mm-catalog-query]').fill('zzzz-no-match');
  await expect(drawer.locator('[data-mm-catalog-empty]')).toBeVisible();
  await drawer.locator('[data-mm-catalog-query]').fill('');
  await drawer.locator('[data-mm-lesson-id="9"]').click();
  await expect(page.locator('#lesson .mm-simple-lesson-hero')).toContainText('9');
  expect(await page.evaluate(()=>user.currentLesson)).toBe(9);
});
test('optional specialist selection opens its authored content without awarding core credit',async({page})=>{
  await ready(page);
  const root=page.locator('#path .mm-all-lessons');
  await root.locator('[data-mm-catalog-filter]').selectOption('specialist');
  await root.locator('[data-mm-specialist-id="S01"]').click();
  await expect(page.locator('#mmSpecialistModal')).toBeVisible();
  await expect(page.locator('#mmSpecialistTitle')).toContainText('Hazardous-energy');
  const done=await page.evaluate(()=>user.completed);
  expect(done).toEqual([1,2]);
});
test('catalogue stays within a 360px mobile viewport',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await ready(page);
  const root=page.locator('#path .mm-all-lessons');
  await root.locator('[data-mm-catalog-query]').fill('injection');
  const overshoot=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overshoot).toBeLessThanOrEqual(2);
});