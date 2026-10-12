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
    await expect(page.locator('#dashboard .mm-reference-home-hero h2')).toHaveText('Welcome back');
    await expect(page.locator('#dashboard .mm-reference-quick-tool')).toHaveCount(4);
    await page.locator('#dashboard .mm-reference-quick-tool').filter({hasText:'Unit converter'}).click();
    const converter=page.locator('#mmReferenceUnitConverter');
    await expect(converter).toBeVisible();
    await converter.getByRole('combobox',{name:'Conversion'}).selectOption('0');
    await converter.getByRole('spinbutton',{name:'Value to convert'}).fill('10');
    await expect(converter.locator('output')).toHaveText('1 MPa');
    await converter.getByRole('button',{name:'Close'}).click();
    await expect(converter).toBeHidden();
    await page.locator('#dashboard .mm-reference-home-practice').click();
    await expect(page.locator('#scenarios')).toHaveAttribute('data-mm-hub-mode','detail');
    await expect(page.locator('#scenarios .mm-hub-detail-back')).toBeVisible();
    await page.evaluate(()=>switchView('dashboard'));
    await expect(page.locator('#dashboard .mm-reference-home-hero')).toBeVisible();
    await expect(page.locator('#mmMissionControl .mm-mc-context')).toHaveCount(0);
    await expect(page.locator('#mmMissionControl .mm-mc-timeline')).toHaveCount(0);

    await page.evaluate(()=>switchView('path'));
    await expect(page.locator('#path .mm-reference-title')).toHaveText('Learn');
    // One canonical lesson catalogue; course illustrations decorate its
    // native disclosure summaries rather than a second nine-card navigation.
    await expect(page.locator('#path .mm-reference-learn-list')).toHaveCount(0);
    const illustratedCourses=page.locator('#path .mm-unified-course-summary');
    await expect(illustratedCourses).toHaveCount(22);
    await expect(illustratedCourses.locator('.mm-reference-course-art')).toHaveCount(22);
    // The formerly missed courses 10–12 and all Material Science chapters
    // must have the SAME accessible, illustrated compact summary treatment.
    await expect(illustratedCourses.nth(9)).toContainText('Automation & Sensors');
    await expect(illustratedCourses.nth(10)).toContainText('Advanced Tooling');
    await expect(illustratedCourses.nth(11)).toContainText('Expert Process Engineering');
    await expect(page.locator('#path .mm-catalog-material-track')).toHaveCount(9);
    await expect(illustratedCourses.last()).toContainText('Optional specialist');
    await expect(illustratedCourses.nth(1)).toContainText('Machine');
    await expect(illustratedCourses.nth(2)).toContainText('Materials');
    await expect(illustratedCourses.nth(3)).toContainText('Mould');
    expect(await illustratedCourses.nth(2).locator('.mm-reference-photo').getAttribute('data-mm-photo-index')).toBe('3');
    await expect(page.locator('#path [data-mm-lesson-catalog]')).toHaveCount(1);
    await page.locator('#path [data-mm-catalog-query]').fill('injection');
    await expect(page.locator('#path [data-mm-catalog-query]')).toHaveValue('injection');

    await page.evaluate(()=>switchView('materials'));
    await expect(page.locator('#materials .mm-reference-materials-title')).toHaveText('Materials');
    await expect(page.locator('#materials .mm-reference-materials-title')).toHaveCount(1);
    await expect(page.locator('#materials .mm-material-all-index-head h3')).toHaveText('Materials');
    await expect(page.locator('#materials [data-mm-all-material-index]')).toHaveCount(1);
    await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
    await expect(page.locator('#materials [data-mm-exact-query]')).toBeHidden();
    // The old conceptual explorer is retained under the SAME Materials
    // catalogue, available on demand, not a second competing page section.
    const familyScience=page.locator('#materials #mmExactMaterialCatalog [data-mm-family-science]');
    await expect(familyScience).toHaveCount(1);
    await expect(familyScience).not.toHaveAttribute('open','');
    await familyScience.locator('summary').click();
    await expect(familyScience.locator('.mat-shell')).toBeVisible();
    await familyScience.locator('summary').click();
    const pp=page.locator('#materials [data-mm-family-open="PP"]');
    await expect(pp).toBeVisible();
    await expect(pp).toContainText('95 published grades');
    await expect(pp.locator('.mm-reference-family-art')).toBeVisible();
    await pp.click();
    const detail=page.locator('#materials [data-mm-family-detail]');
    await expect(detail).toBeVisible();
    await expect(detail.locator('[data-mm-family-title]')).toContainText('PP · Polypropylene');
    await expect(detail.locator('[data-mm-family-count]')).toContainText('95 published grades');
    await detail.locator('[data-mm-family-view="overview"]').click();
    await expect(detail.locator('[data-mm-family-info]')).toContainText('Polypropylene');
    await detail.locator('[data-mm-family-view="properties"]').click();
    await expect(detail.locator('[data-mm-family-info]')).toContainText('grade data sheet');
    await detail.locator('[data-mm-family-view="applications"]').click();
    await expect(detail.locator('[data-mm-family-info]')).toContainText('not grade recommendations');
    await detail.locator('[data-mm-family-view="grades"]').click();
    await expect(detail.locator('[data-mm-family-view="grades"]')).toHaveAttribute('aria-pressed','true');
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
    await first.locator('[data-mm-material-jump="learning"]').click();
    await expect(familyScience).toHaveAttribute('open','');
    // The learning landing section stays visible outside the optional
    // family-science disclosure, so lesson navigation is never hidden.
    const study=page.locator('#materials .mm-material-study-tools');
    await expect(study).toHaveCount(1);
    await expect(study.locator('#mmMaterialLearningAnchor')).toBeVisible();
    await expect(study.locator(':scope > .mat-tabs')).toBeVisible();
    await expect(study.locator(':scope > .mat-tabs button')).toHaveCount(5);
    await expect(study.locator('[data-mm-family-science]')).toHaveCount(1);
    // Shortcuts, learning introduction and optional family guide belong to
    // one panel, without changing the actual learning/lab/compare actions.
    const modes=await study.locator(':scope > .mat-tabs button').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect()));
    expect(modes.every(b=>b.width>60&&b.height>=44)).toBe(true);
    // The learning shell has already moved under the guide. A subsequent
    // refresh must still locate it and reveal an opened teaching mode, without
    // recreating its buttons or trapping the lesson behind a closed disclosure.
    await familyScience.locator('summary').click();
    await expect(familyScience).not.toHaveAttribute('open','');
    await page.evaluate(()=>window.MM_REFERENCE_LAYOUT.refresh());
    await study.getByRole('button',{name:'Learn',exact:true}).click();
    await page.evaluate(()=>window.MM_REFERENCE_LAYOUT.refresh());
    await expect(familyScience).toHaveAttribute('open','');
    await expect(study.locator(':scope > .mat-tabs button')).toHaveCount(5);

    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-reference-title')).toHaveText('Practice');
    await expect(page.locator('#scenarios .mm-reference-practice-list')).toHaveCount(0);
    const activities=page.locator('#scenarios .mm-unified-practice-card');
    await expect(activities).toHaveCount(5);
    await expect(activities.locator('.mm-reference-photo')).toHaveCount(5);
    await expect(activities.filter({hasText:'Question Centre'})).toHaveCount(1);
    await activities.filter({hasText:'Question Centre'}).click();
    await expect(page.locator('#scenarios .mm-question-centre')).toBeVisible();
    await page.evaluate(()=>window.MM_PRIMARY_HUBS.renderPracticeHub());

    await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();
    await expect(page.locator('#modal .mm-more-disclosure')).toHaveCount(6);
    await expect(page.locator('#modal .mm-reference-more-extra')).toHaveCount(2);
    await expect(page.locator('#modal .mm-reference-more-extra')).toHaveCount(2);
    await expect(page.locator('#modal .mm-reference-more-extra').first()).toContainText('Help & support');
    await expect(page.locator('#modal .mm-reference-more-extra').nth(1)).toContainText('About MouldMaster');
    await expect(page.locator('#modal .mm-reference-more-extra').nth(1).locator('a')).toHaveAttribute('href','./support.html#mmPwa');
    await expect(page.locator('#modal [data-mm-registry-menu="mission-evidence"]')).toHaveCount(1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}

test('unified practice illustrations load locally without external dependencies',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios .mm-reference-practice-art')).toHaveCount(5);
  await page.waitForFunction(()=>document.documentElement.classList.contains('mm-reference-photo-ready'));
  const tiles=await page.locator('#scenarios .mm-reference-practice-art.mm-reference-photo').evaluateAll(nodes=>nodes.map(el=>({
    tile:Number(el.dataset.mmPhotoIndex),
    background:getComputedStyle(el).backgroundImage
  })));
  expect(tiles.map(row=>row.tile)).toEqual([20,22,23,19,27]);
  expect(tiles.every(row=>row.background.includes('mockup-reference-tiles.webp'))).toBe(true);
});
