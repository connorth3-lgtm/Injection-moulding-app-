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

test('lesson essentials keep only the minimum default teaching and deeper reasoning stays collapsed',async({page})=>{
  await openLesson(page);
  const section=page.locator('#mmLessonDeepV2');
  const essentials=section.locator('.mm-deep-v2-essentials');
  await expect(essentials).toBeVisible();
  const rows=essentials.locator('.mm-deep-v2-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).getByRole('heading',{name:'Key takeaway'})).toBeVisible();
  await expect(rows.nth(1).getByRole('heading',{name:'Apply'})).toBeVisible();

  const visibleCopy=await rows.locator('p').allTextContents();
  expect(visibleCopy).toHaveLength(2);
  for(const text of visibleCopy)expect(text.trim().length).toBeLessThanOrEqual(176);
  await expect(section.locator('.mm-deep-v2-grid')).toHaveCount(0);

  const details=section.locator('details');
  expect(await details.evaluate(el=>el.open)).toBe(false);
  await expect(details.locator('.mm-deep-v2-detail')).toBeHidden();
  await details.locator('summary').click();
  await expect(details.locator('.mm-deep-v2-detail')).toBeVisible();
  await expect(details.getByRole('heading',{name:'Mechanism'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Evidence chain'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Plant decision'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Misconception check'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Teach-back'})).toBeVisible();
  await expect(details.locator('.mm-deep-v2-boundary')).toBeVisible();
});

test('lesson notes are a small optional action until the learner opens them',async({page})=>{
  await openLesson(page);
  const notes=page.locator('#lesson .mm-simple-note-disclosure');
  await expect(notes).toBeVisible();
  expect(await notes.evaluate(el=>el.open)).toBe(false);
  await expect(notes.locator('summary')).toContainText('Add note');
  await expect(page.locator('#lessonNotes')).toBeHidden();

  await notes.locator('summary').click();
  await expect(page.locator('#lessonNotes')).toBeVisible();
  await page.locator('#lessonNotes').fill('Check cushion repeatability on machine A.');
  await expect(notes.locator('summary')).toContainText('Edit note');
  await page.waitForTimeout(750);
  const persisted=await page.evaluate(()=>{
    const db=JSON.parse(localStorage.getItem('mouldmasterProDB')||'{}');
    return db.users?.['lesson-simplicity-qa']?.notes?.['1']||db.users?.['lesson-simplicity-qa']?.notes?.[1]||'';
  });
  expect(persisted).toContain('Check cushion repeatability');
});

test('generic no-source references do not consume the mobile lesson screen',async({page})=>{
  await openLesson(page);
  const generic=page.getByText(/No general external source was auto-selected for this topic/i);
  if(await generic.count())await expect(generic).toBeHidden();
});


test('lesson has one clear ending and optional evidence stays out of the default flow',async({page})=>{
  await openLesson(page);
  const details=page.locator('#mmLessonDeepV2 details');
  const directEvidenceCount=await page.locator('#lesson .lesson-body > .content-block, #lesson .lesson-body > .mm-simple-section').evaluateAll(nodes=>nodes.filter(node=>/^Evidence check$/i.test(node.querySelector(':scope > h3')?.textContent?.trim()||'')).length);
  expect(directEvidenceCount).toBe(0);
  await details.locator('summary').click();
  await expect(details.getByRole('heading',{name:'Evidence check'})).toBeVisible();
  await expect(details.getByText(/^Capture:/)).toBeVisible();
  await expect(details.getByText(/^Common trap:/)).toBeVisible();
  await details.locator('summary').click();
  const actions=page.locator('#lesson .lesson-actions-sticky.mm-simple-completion');
  await expect(actions).toBeVisible();
  await expect(actions.locator('button:visible')).toHaveCount(1);
  await expect(actions.locator('button.primary')).toBeVisible();
  const bookmark=page.locator('#lesson .mm-simple-lesson-meta .mm-simple-lesson-bookmark');
  await expect(bookmark).toBeVisible();
  const bookmarkBox=await bookmark.boundingBox();
  expect(bookmarkBox?.width||999).toBeLessThanOrEqual(46);
  expect(bookmarkBox?.height||999).toBeLessThanOrEqual(46);
  const measured=page.locator('#lesson .mm-simple-measured-evidence');
  await expect(measured).toBeVisible();
  expect(await measured.evaluate(el=>el.open)).toBe(false);
  await expect(measured.locator('> .mme-panel')).toBeHidden();
  await expect(measured.locator('summary')).toHaveText('Measured evidence');
  const listen=page.locator('.mm-read-aloud details:not([open]) summary');
  await expect(listen).toBeVisible();
  const listenBox=await listen.boundingBox();
  expect(listenBox?.width||999).toBeLessThanOrEqual(112);
  expect(listenBox?.height||999).toBeLessThanOrEqual(48);
});
