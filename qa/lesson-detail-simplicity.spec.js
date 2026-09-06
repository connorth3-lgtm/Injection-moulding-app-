const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openLesson(page){
  await page.setViewportSize({width:412,height:915});
  await page.addInitScript(()=>{
    const user={id:'lesson-simplicity-qa',name:'Lesson Simplicity QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await page.getByRole('button',{name:/Continue lesson/i}).first().click();
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#mmLessonDeepV2')).toBeVisible();
}

test('lesson essentials use one compact panel and deeper reasoning stays collapsed',async({page})=>{
  await openLesson(page);
  const section=page.locator('#mmLessonDeepV2');
  const essentials=section.locator('.mm-deep-v2-essentials');
  await expect(essentials).toBeVisible();
  const rows=essentials.locator('.mm-deep-v2-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).getByRole('heading',{name:'Key takeaway'})).toBeVisible();
  await expect(rows.nth(1).getByRole('heading',{name:'Apply'})).toBeVisible();
  await expect(rows.nth(2).getByRole('heading',{name:'Watch out'})).toBeVisible();

  const visibleCopy=await rows.locator('p').allTextContents();
  expect(visibleCopy).toHaveLength(3);
  for(const text of visibleCopy)expect(text.trim().length).toBeLessThanOrEqual(176);
  await expect(section.locator('.mm-deep-v2-grid')).toHaveCount(0);

  const details=section.locator('details');
  expect(await details.evaluate(el=>el.open)).toBe(false);
  await expect(details.locator('.mm-deep-v2-detail')).toBeHidden();
  await details.locator('summary').click();
  await expect(details.locator('.mm-deep-v2-detail')).toBeVisible();
  await expect(details.getByRole('heading',{name:'Mechanism'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Evidence chain'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Teach-back'})).toBeVisible();
  await expect(details.locator('.mm-deep-v2-boundary')).toBeVisible();
});

test('generic no-source references do not consume the mobile lesson screen',async({page})=>{
  await openLesson(page);
  const generic=page.getByText(/No general external source was auto-selected for this topic/i);
  if(await generic.count())await expect(generic).toBeHidden();
});
