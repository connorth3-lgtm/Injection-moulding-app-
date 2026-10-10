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
test('120 core, 36 material and 20 optional specialist lessons share one Learn page',async({page})=>{
  await ready(page);
  const library=page.locator('#path .mm-all-lessons');
  await expect(library.locator('[data-mm-lesson-id]')).toHaveCount(120);
  await expect(library.locator('[data-mm-specialist-id]')).toHaveCount(20);
  await expect(library.locator('[data-mm-material-id]')).toHaveCount(36);
  await expect(library.locator('[data-mm-catalog-group]')).toHaveCount(22);
  await expect(library.locator('[data-mm-catalog-count]')).toHaveText('176 lessons shown');
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
test('temporary search restores the learner’s expanded courses instead of opening all tracks',async({page})=>{
  await ready(page);
  const catalog=page.locator('#path .mm-all-lessons');
  const groups=catalog.locator('[data-mm-catalog-group]');
  const first=groups.nth(0),second=groups.nth(1),third=groups.nth(2);
  expect(await first.evaluate(el=>el.open)).toBe(true);
  expect(await second.evaluate(el=>el.open)).toBe(false);
  await second.locator('summary').first().click();
  expect(await second.evaluate(el=>el.open)).toBe(true);
  await catalog.locator('[data-mm-catalog-query]').fill('zzzz-no-match');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('0 lessons shown');
  await catalog.locator('[data-mm-catalog-query]').fill('');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('176 lessons shown');
  expect(await first.evaluate(el=>el.open)).toBe(true);
  expect(await second.evaluate(el=>el.open)).toBe(true);
  expect(await third.evaluate(el=>el.open)).toBe(false);
});
test('lesson reader links back to Learn rather than rendering a second lesson catalogue',async({page})=>{
  await ready(page);
  await page.locator('#path [data-mm-catalog-group]').nth(1).locator('summary').first().click();
  await page.locator('#path [data-mm-lesson-id="12"]').click();
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#lesson .lesson-side')).toHaveCount(0);
  await expect(page.locator('#lesson .mm-lessons-drawer,#lesson .mm-all-lessons')).toHaveCount(0);
  const returnLink=page.locator('#lesson .mm-lesson-catalog-return button');
  await expect(returnLink).toHaveText('← All lessons');
  await returnLink.click();
  await expect(page.locator('#path .mm-all-lessons')).toBeVisible();
  await expect(page.locator('#path [data-mm-lesson-id]')).toHaveCount(120);
  await expect(page.locator('#path [data-mm-specialist-id]')).toHaveCount(20);
  await expect(page.locator('#path [data-mm-material-id]')).toHaveCount(36);
});

test('saved lesson cards and duplicate specialist grids are removed from other views',async({page})=>{
  await ready(page);
  await page.evaluate(()=>switchView('profile'));
  // Profile can legitimately contain additional data/backup cards; lesson browsing must not be duplicated here.
  await expect(page.locator('#profile .form-card')).not.toHaveCount(0);
  await expect(page.locator('#profile .course-card')).toHaveCount(0);
  await expect(page.locator('#profile .section-head').filter({hasText:'Saved lessons'})).toHaveCount(0);
  await page.evaluate(()=>window.MM_LESSON_CATALOG.open({filter:'saved'}));
  const library=page.locator('#path .mm-all-lessons');
  await expect(library.locator('[data-mm-catalog-count]')).toHaveText('2 lessons shown');
  await expect(library.locator('[data-mm-catalog-filter]')).toHaveValue('saved');
  await page.evaluate(()=>switchView('dashboard'));
  await expect(page.locator('#dashboard #mmSpecialistDashboard')).toHaveCount(0);
});

test('legacy specialist launch opens the filtered Learn catalogue, not a second modal grid',async({page})=>{
  await ready(page);
  await page.evaluate(()=>window.MM_SPECIALIST_CURRICULUM.open());
  await expect(page.locator('#path .mm-all-lessons')).toBeVisible();
  await expect(page.locator('#path [data-mm-catalog-filter]')).toHaveValue('specialist');
  await expect(page.locator('#path [data-mm-catalog-count]')).toHaveText('20 lessons shown');
  await expect(page.locator('#mmSpecialistModal')).toBeHidden();
  await page.locator('#path [data-mm-specialist-id="S01"]').click();
  await expect(page.locator('#mmSpecialistModal')).toBeVisible();
  await page.locator('#mmSpecialistBody').getByRole('button',{name:/All specialist extensions/}).click();
  await expect(page.locator('#mmSpecialistModal')).toBeHidden();
  await expect(page.locator('#path [data-mm-catalog-filter]')).toHaveValue('specialist');
});
test('36 material lessons move to Learn while keeping independent progress and original content',async({page})=>{
  await ready(page);
  await page.evaluate(()=>window.MM_LESSON_CATALOG.open({filter:'material'}));
  const catalog=page.locator('#path .mm-all-lessons');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('36 lessons shown');
  await expect(catalog.locator('[data-mm-material-id]')).toHaveCount(36);
  await expect(catalog.locator('[data-mm-catalog-group]:not([hidden])')).toHaveCount(9);
  await catalog.locator('[data-mm-material-id="1"]').click();
  await expect(page.locator('#materials article.mat-lesson')).toBeVisible();
  await expect(page.locator('#materials .mat-chapters,#materials .mat-lesson-list')).toHaveCount(0);
  await expect(page.locator('#materials .mat-lesson')).toContainText('Macromolecules & chain architecture');
  await page.locator('#materials .lesson-actions-sticky .primary').click();
  await expect(page.locator('#materials .mat-lesson')).toContainText('Thermoplastics, thermosets & elastomers');
  const state=await page.evaluate(()=>({core:[...user.completed],material:user.materialScience?.completed||[]}));
  expect(state.core).toEqual([1,2]);
  expect(state.material).toEqual([1]);
  await page.locator('#materials .mm-lesson-catalog-return button').click();
  await expect(catalog.locator('[data-mm-catalog-filter]')).toHaveValue('material');
  await expect(catalog.locator('[data-mm-material-id="1"]')).toContainText('Done');
  await page.evaluate(()=>switchView('materials'));
  await expect(page.locator('#materials .mat-chapters')).toHaveCount(0);
  await expect(page.locator('#materials .mat-tabs')).toBeVisible();
  await expect(page.locator('#materials .mat-tabs button').filter({hasText:'All lessons'})).toHaveCount(1);
  await page.locator('#materials .mat-tabs button').filter({hasText:'All lessons'}).click();
  await expect(catalog.locator('[data-mm-catalog-filter]')).toHaveValue('material');
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

test('specialist completion appears in unified Done/Not finished filters without granting core credit',async({page})=>{
  await ready(page);
  const catalog=page.locator('#path .mm-all-lessons');
  await catalog.locator('[data-mm-catalog-filter]').selectOption('specialist');
  const specialist=catalog.locator('[data-mm-specialist-id="S01"]');
  await expect(specialist.locator('.mm-catalog-state')).toHaveText('Open');
  await specialist.click();
  await expect(page.locator('#mmSpecialistModal')).toBeVisible();
  await page.locator('#mmSpecialistBody').getByRole('button',{name:'Mark specialist lesson complete'}).click();
  await expect(specialist.locator('.mm-catalog-state')).toHaveText('✓ Done');
  await expect(specialist).toHaveAttribute('data-mm-catalog-done','1');
  await page.evaluate(()=>window.mmSpecialistClose());
  await catalog.locator('[data-mm-catalog-filter]').selectOption('done');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('3 lessons shown');
  await expect(specialist).toBeVisible();
  await catalog.locator('[data-mm-catalog-filter]').selectOption('todo');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('173 lessons shown');
  await expect(specialist).toBeHidden();
  expect(await page.evaluate(()=>user.completed)).toEqual([1,2]);
  await catalog.locator('[data-mm-catalog-filter]').selectOption('specialist');
  await specialist.click();
  await page.locator('#mmSpecialistBody').getByRole('button',{name:'Mark incomplete'}).click();
  await expect(specialist.locator('.mm-catalog-state')).toHaveText('Open');
  await page.evaluate(()=>window.mmSpecialistClose());
  await catalog.locator('[data-mm-catalog-filter]').selectOption('done');
  await expect(catalog.locator('[data-mm-catalog-count]')).toHaveText('2 lessons shown');
});


test('specialist legacy progress migrates only to its owning strong learner scope',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    const make=id=>({id,name:id,role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'});
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'specialist-a',users:{'specialist-a':make('specialist-a'),'specialist-b':make('specialist-b')}}));
    let hash=2166136261;
    for(const ch of 'specialist-a'){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
    localStorage.setItem('mm_specialist_curriculum_v1::'+(hash>>>0).toString(36),JSON.stringify({S01:true}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MM_SPECIALIST_CURRICULUM?.isComplete&&!!window.MM_LEARNER_SCOPE&&!!window.MM_LESSON_CATALOG&&!document.getElementById('mmBootstrap'));
  const migrated=await page.evaluate(()=>{
    const scope=window.MM_LEARNER_SCOPE,prefix='mm_specialist_curriculum_v1::';
    return {newKey:scope.storageKey(prefix,scope.tokenFor('specialist-a')),oldKey:scope.storageKey(prefix,scope.legacyTokenFor('specialist-a')),completed:window.MM_SPECIALIST_CURRICULUM.isComplete('S01')};
  });
  expect(migrated.completed).toBe(true);
  expect(migrated.newKey).toMatch(/[a-f0-9]{32}$/);
  expect(await page.evaluate(key=>localStorage.getItem(key),migrated.oldKey)).toBeNull();
  expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),migrated.newKey))).toEqual({S01:true});
  await page.evaluate(()=>switchUser('specialist-b'));
  expect(await page.evaluate(()=>window.MM_SPECIALIST_CURRICULUM.isComplete('S01'))).toBe(false);
  await page.evaluate(()=>switchUser('specialist-a'));
  expect(await page.evaluate(()=>window.MM_SPECIALIST_CURRICULUM.isComplete('S01'))).toBe(true);
});


test('global search leads to Learn without displaying another list of lesson matches',async({page})=>{
  await ready(page);
  await page.evaluate(()=>openSearch());
  await page.locator('#globalSearch').fill('polymer');
  const results=page.locator('#searchResults');
  await expect(results.locator('[data-mm-global-lesson-library]')).toBeVisible();
  await expect(results.locator('button[data-mm-onclick*="goLesson("]')).toHaveCount(0);
  await results.locator('[data-mm-global-lesson-library]').click();
  await expect(page.locator('#path .mm-all-lessons')).toBeVisible();
  await expect(page.locator('#path [data-mm-catalog-query]')).toHaveValue('polymer');
});
test('catalogue stays within a 360px mobile viewport',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await ready(page);
  const root=page.locator('#path .mm-all-lessons');
  await root.locator('[data-mm-catalog-query]').fill('injection');
  const overshoot=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overshoot).toBeLessThanOrEqual(2);
});