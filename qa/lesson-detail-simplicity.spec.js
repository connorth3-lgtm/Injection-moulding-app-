const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openLesson(page){
  await page.setViewportSize({width:412,height:915});
  await page.addInitScript(()=>{
    const user={id:'lesson-simplicity-qa',name:'Lesson Simplicity QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await page.getByRole('button',{name:/Continue lesson/i}).first().click();
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#mmLessonDeepV2')).toBeVisible();
}

test('one clear lesson flow keeps original engineering depth without repeated takeaways',async({page})=>{
  await openLesson(page);
  const article=page.locator('#lesson article.lesson-body');
  await expect(article.locator('.mm-simple-lesson-hero')).toBeVisible();
  await expect(article.getByRole('heading',{name:'What you need to know'})).toBeVisible();
  await expect(article.locator('.callout')).toBeVisible();
  await expect(article.locator('.mm-next-card')).toHaveCount(0);
  await expect(article.locator('.mm-reading-guide,.mm-read-marker,.mm-lesson-progress')).toHaveCount(0);

  const goals=article.locator('.mm-simple-goals');
  await expect(goals).toBeVisible();
  expect(await goals.evaluate(el=>el.open)).toBe(false);
  const authored=await page.evaluate(()=>({
    objectives:D.lessons.find(l=>l.id===user.currentLesson).objectives,
    keypoints:D.lessons.find(l=>l.id===user.currentLesson).keypoints,
    exercise:D.lessons.find(l=>l.id===user.currentLesson).exercise
  }));
  await expect(goals.locator('li')).toHaveCount(authored.objectives.length);
  await goals.locator('summary').click();
  for(const objective of authored.objectives)await expect(goals).toContainText(objective);
  for(const point of authored.keypoints)await expect(article).toContainText(point);
  await expect(article).toContainText(authored.exercise);

  const deep=article.locator('#mmLessonDeepV2');
  await expect(deep.locator('.mm-deep-v2-essentials')).toHaveCount(0);
  const details=deep.locator('details.mm-deep-v2-card');
  expect(await details.evaluate(el=>el.open)).toBe(false);
  await expect(details.locator('.mm-deep-v2-detail')).toBeHidden();
  await expect(details.locator('summary')).toContainText('Engineering detail & examples');
  await details.locator('summary').first().click();
  await expect(details.getByRole('heading',{name:'Mechanism'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Evidence chain'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Plant decision'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Misconception check'})).toBeVisible();
  await expect(details.getByRole('heading',{name:'Teach-back'})).toBeVisible();
  await expect(details.locator('.mm-deep-v2-boundary')).toBeVisible();
  await expect(details.locator('.mm-extra-help')).toHaveCount(1);
  await expect(article.locator(':scope > .mm-extra-help')).toHaveCount(0);
  await details.locator('.mm-extra-help > summary').click();
  await expect(details.locator('#mmTeaching')).toBeVisible();
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
  await details.locator(':scope > summary').click();
  await expect(details.getByRole('heading',{name:'Evidence check'})).toBeVisible();
  await expect(details.getByText(/^Capture:/)).toBeVisible();
  await expect(details.getByText(/^Common trap:/)).toBeVisible();
  await details.locator(':scope > summary').click();
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

test('safety-specific boundary stays visible while technical detail is optional',async({page})=>{
  await openLesson(page);
  const safetyId=await page.evaluate(()=>window.MM_LESSON_DEEP_AUTHORING_V2.records.find(row=>row.boundary.startsWith('Safety boundary:'))?.id);
  expect(safetyId).toBeTruthy();
  await page.evaluate(id=>goLesson(id),safetyId);
  const deep=page.locator('#lesson #mmLessonDeepV2');
  const essentials=deep.locator('.mm-deep-v2-essentials');
  await expect(essentials).toBeVisible();
  await expect(essentials.locator('.mm-deep-v2-row')).toHaveCount(1);
  await expect(essentials.getByRole('heading',{name:'Watch out'})).toBeVisible();
  await expect(essentials).toContainText('Safety boundary');
  const detail=deep.locator('details.mm-deep-v2-card');
  expect(await detail.evaluate(el=>el.open)).toBe(false);
  await detail.locator('summary').first().click();
  await expect(detail.locator('.mm-deep-v2-boundary')).toContainText('Safety boundary');
});

test('only literally repeated introductions collapse; differing engineering context stays visible',async({page})=>{
  await openLesson(page);
  const candidate=await page.evaluate(()=>{
    const clean=v=>String(v||'').toLowerCase().replace(/\s+/g,' ').replace(/[.!?]+$/,'').trim();
    const different=D.lessons.find(l=>clean(l.intro)!==clean(l.summary));
    return different?.id||1;
  });
  await page.evaluate(id=>goLesson(id),candidate);
  const active=await page.evaluate(()=>({intro:D.lessons.find(l=>l.id===user.currentLesson).intro,summary:D.lessons.find(l=>l.id===user.currentLesson).summary}));
  if(active.intro.toLowerCase().trim()!==active.summary.toLowerCase().trim()){
    const intro=page.locator('#lesson .lesson-body .content-block').filter({has:page.getByRole('heading',{name:'Why this matters'})});
    await expect(intro).toBeVisible();
    await expect(intro).toContainText(active.intro);
  }
  await page.evaluate(()=>{
    const lesson=D.lessons.find(l=>l.id===user.currentLesson);
    lesson.intro=lesson.summary;
    renderLesson();
  });
  await expect(page.locator('#lesson .lesson-body .content-block').filter({has:page.getByRole('heading',{name:'Why this matters'})})).toHaveCount(0);
  await expect(page.locator('#lesson .mm-simple-lesson-summary')).toBeVisible();
});
