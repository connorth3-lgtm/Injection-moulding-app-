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
    await familyScience.locator(':scope > summary').click();
    await expect(familyScience.locator('.mat-shell')).toBeVisible();
    await familyScience.locator(':scope > summary').click();
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
    await summary.click();
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
    await familyScience.locator(':scope > summary').click();
    await expect(familyScience).not.toHaveAttribute('open','');
    await page.evaluate(()=>window.MM_REFERENCE_LAYOUT.refresh());
    await study.locator(':scope > .mat-tabs > button').first().click();
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
    await expect(page.locator('#modal .mm-reference-more-card > summary > .mm-reference-more-art')).toHaveCount(6);
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

for(const width of [360,810]){
  test('Practice entry cards and inner tools share one accessible illustrated design at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:900});
    await openApp(page);
    await page.evaluate(()=>switchView('scenarios'));
    const hub=page.locator('#scenarios .mm-practice-hub');
    await expect(hub).toBeVisible();
    const activities=hub.locator('.mm-hub-section:not([aria-label="More recommended practice"]) .mm-reference-practice-choice');
    await expect(activities).toHaveCount(5);
    await expect(activities.locator(':scope > .mm-reference-practice-art')).toHaveCount(5);
    const recommended=hub.locator('.mm-reference-practice-feature');
    await expect(recommended.locator(':scope > .mm-reference-practice-feature-art')).toHaveCount(1);
    await page.evaluate(()=>{window.MM_REFERENCE_LAYOUT.refresh();window.MM_REFERENCE_LAYOUT.refresh()});
    await expect(activities.locator(':scope > .mm-reference-practice-art')).toHaveCount(5);
    const sizing=await activities.evaluateAll(nodes=>({
      overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      touch:nodes.every(el=>el.getBoundingClientRect().height>=44),
      descriptions:nodes.every(el=>el.querySelector('small')?.getBoundingClientRect().height>0),
      actions:nodes.every(el=>el.querySelector('.mm-hub-tile-action')?.getBoundingClientRect().height>0)
    }));
    expect(sizing.overflow).toBeLessThanOrEqual(2);
    expect(sizing.touch&&sizing.descriptions&&sizing.actions).toBe(true);

    // Actual Lab button and modal action listeners must survive decoration.
    await hub.locator('[data-mm-hub-action="labs"]').click();
    const labPicker=page.locator('#modal:not(.hidden) .mm-hub-picker-grid[data-mm-reference-practice-picker="modal"]');
    await expect(labPicker.locator('button.mm-reference-practice-choice')).toHaveCount(3);
    await expect(labPicker.locator(':scope > button > .mm-reference-practice-art')).toHaveCount(3);
    await expect(labPicker.locator('button').first()).toHaveCSS('color','rgb(9, 43, 66)');
    await labPicker.locator('[data-mm-hub-action="simulator"]').click();
    await expect(page.locator('#simulator')).toBeVisible();
    await expect(page.locator('#mmVirtualApprenticeship > .section-head > .mm-reference-practice-tool-art')).toBeVisible();
    await page.locator('#mmVirtualApprenticeship .hero-buttons button').filter({hasText:'Explore this case in Spatial Twin'}).click();
    await expect(page.locator('#mmSpatialTwin:not([hidden]) .mm-st-header .mm-reference-practice-tool-art')).toBeVisible();
    await page.locator('#mmSpatialTwin [data-mm-st-close]').click();

    await page.evaluate(()=>switchView('scenarios'));
    await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="question-centre"]').click();
    const questions=page.locator('#scenarios .mm-question-centre');
    await expect(questions).toBeVisible();
    await expect(questions.locator('.mm-hub-picker-grid[data-mm-reference-practice-picker="question-centre"] > .mm-reference-practice-choice')).toHaveCount(5);
    await expect(questions.locator('.mm-reference-practice-art')).toHaveCount(5);
    const contrast=await questions.locator('.mm-reference-practice-choice').first().evaluate(el=>({
      bg:getComputedStyle(el).backgroundColor,
      text:getComputedStyle(el.querySelector('b')).color
    }));
    expect(contrast.bg).toBe('rgb(241, 247, 250)');
    expect(contrast.text).toBe('rgb(11, 41, 64)');
    const questionOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(questionOverflow).toBeLessThanOrEqual(2);

    // The rotating shop-floor scenarios must retain their native answer
    // buttons and feedback while sharing the illustrated inner-screen layout.
    await questions.locator('[data-mm-hub-action="scenario-detail"]').click();
    await expect(page.locator('#scenarios')).toHaveAttribute('data-mm-hub-mode','detail');
    await expect(page.locator('#scenarios .mm-reference-practice-scenario-head > .mm-reference-practice-scenario-art')).toHaveCount(1);
    const firstScenario=page.locator('#scenarios .scenario').first();
    await expect(firstScenario).toBeVisible();
    const firstChoice=firstScenario.locator('button.choice').first();
    expect((await firstChoice.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await firstChoice.click();
    await expect(firstScenario.locator('.feedback')).toBeVisible();
    const scenarioOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(scenarioOverflow).toBeLessThanOrEqual(2);

    await page.locator('#scenarios .mm-hub-detail-back button').click();
    await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
    await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="troubleshooting"]').click();
    await expect(page.locator('#defects .mm-dx-workbench')).toBeVisible();
    await expect(page.locator('#defects .mm-dx-library .mm-dx-symptom').first()).toBeVisible();
    await page.locator('#defects .mm-dx-library .mm-dx-symptom').first().click();
    await expect(page.locator('#defects .mm-dx-evidence')).toBeVisible();
    await expect(page.locator('#defects .mm-dx-main-action')).toBeVisible();
    // Presentation upgrade is never approval of the diagnostic results.
    await expect(page.locator('#defects .mm-dx-disclaimer')).toContainText('No automatic');
  });
}

test('Practice nested labs, data diagnosis and assessments keep working illustrated landing headers',async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:390,height:844});
  await openApp(page);

  await page.evaluate(()=>switchView('scenarios'));
  await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="process-data"]').click();
  const data=page.locator('#processDataLabs');
  await expect(data.locator('.pd-hero > .mm-reference-practice-tool-art')).toBeVisible();
  await expect(data.locator('[data-pd-start]').first()).toBeVisible();
  await data.locator('[data-pd-start]').first().click();
  const dataChoice=data.locator('button.pd-choice').first();
  await expect(dataChoice).toBeVisible();
  expect((await dataChoice.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(data.locator('.pd-case > .pd-panel').first()).toHaveCSS('background-color','rgb(239, 247, 250)');
  await dataChoice.click();
  await expect(data.locator('.pd-feedback')).toBeVisible();
  await expect(data.locator('[data-pd-home]')).toBeVisible();
  await data.locator('[data-pd-home]').click();
  await expect(data.locator('.pd-hero > .mm-reference-practice-tool-art')).toHaveCount(1);

  for(const [action,root,hero,start,back] of [
    ['diagnostic-labs','#diagnosticLabs','.dl-hero','[data-dl-start]','[data-dl-home]'],
    ['material-labs','#materialLabs','.ml-hero','[data-ml-start]','[data-ml-home]']
  ]){
    await page.evaluate(()=>switchView('scenarios'));
    await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="question-centre"]').click();
    await page.locator('#scenarios .mm-question-centre [data-mm-hub-action="'+action+'"]').click();
    await expect(page.locator(root+' '+hero+' > .mm-reference-practice-tool-art')).toBeVisible();
    await expect(page.locator(root+' '+start).first()).toBeVisible();
    await page.locator(root+' '+start).first().click();
    const questionChoice=page.locator(root+' button'+(action==='diagnostic-labs'?'.dl-choice':'.ml-choice')).first();
    await expect(questionChoice).toBeVisible();
    expect((await questionChoice.boundingBox()).height).toBeGreaterThanOrEqual(44);
    const panel=action==='diagnostic-labs'?'.dl-lab > .dl-panel':'.ml-lab > .ml-panel';
    await expect(page.locator(root+' '+panel).first()).toHaveCSS('background-color','rgb(239, 247, 250)');
    await questionChoice.click();
    await expect(page.locator(root+' '+(action==='diagnostic-labs'?'.dl-feedback':'.ml-feedback'))).toBeVisible();
    await expect(page.locator(root+' '+back)).toBeVisible();
    await page.locator(root+' '+back).click();
    await expect(page.locator(root+' '+hero+' > .mm-reference-practice-tool-art')).toHaveCount(1);
  }

  await page.evaluate(()=>switchView('scenarios'));
  await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="question-centre"]').click();
  await page.locator('#scenarios .mm-question-centre [data-mm-hub-action="assessments"]').click();
  await expect(page.locator('#exams .section-head > .mm-reference-practice-tool-art')).toBeVisible();
  const startExam=page.locator('#exams .exam-card button').first();
  await expect(startExam).toBeVisible();
  await startExam.click();
  await expect(page.locator('#modal:not(.hidden) #examQuestions .question').first()).toBeVisible();
});

test('More keeps six illustrated native disclosures, original actions and keyboard access',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();
  const groups=page.locator('#modal .mm-reference-more-card');
  await expect(groups).toHaveCount(6);
  await expect(groups.locator(':scope > summary > .mm-reference-more-art')).toHaveCount(6);
  const registryActions=await page.locator('#modal [data-mm-registry-menu]').count();
  await page.evaluate(()=>{window.MM_REFERENCE_LAYOUT.refresh();window.MM_REFERENCE_LAYOUT.refresh()});
  await expect(groups.locator(':scope > summary > .mm-reference-more-art')).toHaveCount(6);
  expect(await page.locator('#modal [data-mm-registry-menu]').count()).toBe(registryActions);
  const about=page.locator('#modal .mm-reference-more-extra').filter({hasText:'About MouldMaster'});
  await expect(about).not.toHaveAttribute('open','');
  const header=about.locator(':scope > summary');
  await header.focus();
  await header.press('Enter');
  await expect(about).toHaveAttribute('open','');
  await expect(about.locator('a[href="./support.html#mmPwa"]')).toBeVisible();
  await header.press('Enter');
  await expect(about).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.evaluate(()=>window.closeModal?.());
  await expect(page.locator('#modal .modal-card')).toBeHidden();
  await page.locator('.mobile-nav > button').filter({hasText:'Practice'}).click();
  await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
});

for(const width of [360,810]){
  test('approved deep-screen design keeps actual lesson, simulator and resource actions at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:900});
    await openApp(page);
    await page.evaluate(()=>switchView('lesson'));
    const lesson=page.locator('#lesson');
    await expect(lesson.locator('.mm-simple-lesson-hero > .mm-reference-deep-art')).toBeVisible();
    await expect(lesson.locator('.lesson-body.mm-reference-deep-panel')).toBeVisible();
    await expect(lesson.locator('.lesson-side.mm-reference-deep-panel')).toHaveCount(1);
    await expect(lesson.locator('.lesson-body > .content-block:not(.mm-simple-note-section), .lesson-body > .mm-simple-section:not(.mm-simple-note-section)').first()).toHaveCSS('background-color','rgb(240, 247, 250)');
    await lesson.locator('.mm-simple-note-disclosure > summary').click();
    await lesson.locator('#lessonNotes').fill('Test setup notes — do not use as process settings.');
    await lesson.getByRole('button',{name:'Save notes'}).click();
    await expect(lesson.locator('.mm-simple-lesson-hero > .mm-reference-deep-art')).toHaveCount(1);

    await page.evaluate(()=>switchView('simulator'));
    const simulator=page.locator('#simulator');
    await expect(simulator.locator('.form-card > .mm-reference-deep-art')).toBeVisible();
    await expect(simulator.locator('.output-panel > .mm-reference-deep-art')).toBeVisible();
    await expect(simulator.locator('.form-grid > label')).toHaveCount(10);
    await expect(simulator.locator('#simAdvice')).toContainText('baseline');
    const sliders=simulator.locator('input[type="range"]');
    await sliders.first().focus();
    await sliders.first().press('ArrowRight');
    await expect(simulator.locator('#sim_speed')).toHaveValue('56%');
    await simulator.getByRole('button',{name:'Reset',exact:true}).click();
    await expect(simulator.locator('#sim_speed')).toHaveValue('55%');
    await expect(simulator.locator('.form-card > .mm-reference-deep-art')).toHaveCount(1);

    await page.evaluate(()=>switchView('visuals'));
    const visuals=page.locator('#visuals');
    await expect(visuals.locator('.visual-wrap:first-child > .mm-reference-deep-art')).toBeVisible();
    await visuals.getByRole('button',{name:'Filling',exact:true}).click();
    await expect(visuals.locator('#phaseText')).toContainText('velocity control');

    await page.evaluate(()=>switchView('glossary'));
    const glossary=page.locator('#glossary');
    await expect(glossary.locator('.section-head > .mm-reference-deep-art')).toBeVisible();
    await glossary.locator('#glossarySearch').fill('pressure');
    await expect(glossary.locator('.term:visible').first()).toBeVisible();

    await page.evaluate(()=>switchView('defects'));
    const defects=page.locator('#defects');
    await expect(defects.locator('.mm-dx-hero > .mm-reference-deep-art')).toBeVisible();
    await expect(defects.locator('.mm-dx-pane.mm-reference-deep-panel').first()).toBeVisible();

    await page.evaluate(()=>switchView('coach'));
    await expect(page.locator('#coach .mm-dx-hero > .mm-reference-deep-art')).toBeVisible();
    await expect(page.locator('#coach .mm-dx-library .mm-dx-symptom').first()).toBeVisible();

    await page.evaluate(()=>switchView('standards'));
    await expect(page.locator('#standards .section-head > .mm-reference-deep-art')).toBeVisible();
    await page.evaluate(()=>switchView('certificates'));
    await expect(page.locator('#certificates .section-head > .mm-reference-deep-art')).toBeVisible();
    await page.evaluate(()=>switchView('profile'));
    await expect(page.locator('#profile .form-card:first-child > .mm-reference-deep-art')).toBeVisible();
    await expect(page.locator('#profile #profileName')).toBeVisible();

    await page.evaluate(()=>switchView('lesson'));
    await expect(lesson.locator('#lessonNotes')).toHaveValue('Test setup notes — do not use as process settings.');
    await expect(lesson.locator('.mm-simple-lesson-hero > .mm-reference-deep-art')).toHaveCount(1);
    const documentOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(documentOverflow).toBeLessThanOrEqual(2);
  });
}
