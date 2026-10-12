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
    // Incidental rerenders must not override the learner's disclosure choice.
    await expect(familyScience).not.toHaveAttribute('open','');
    // The first button is now the real "All lessons" shortcut into Learn,
    // not a family-science disclosure toggle. Enter an actual Materials mode.
    await study.locator(':scope > .mat-tabs > button').filter({hasText:'Interactive labs'}).click();
    // The original Materials router REPLACES the explorer with the standalone
    // labs screen. The explorer's optional <details> correctly disappears; it
    // is not supposed to reopen inside a no-longer-mounted catalogue.
    await expect(page.locator('#materials .mat-labs')).toBeVisible();
    await expect(page.locator('#materials [data-mm-family-science]')).toHaveCount(0);
    await expect(page.locator('#materials .mat-tabs > button')).toHaveCount(5);
    await page.evaluate(()=>window.MM_REFERENCE_LAYOUT.refresh());
    await expect(page.locator('#materials .mat-labs')).toBeVisible();
    // All lessons must navigate to the shared Learn catalogue without creating
    // a competing second catalogue within Materials.
    await page.locator('#materials .mat-tabs > button').filter({hasText:'All lessons'}).click();
    await expect(page.locator('#path .mm-all-lessons')).toBeVisible();

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
    // Hover/focus background is animated. Check the entire allowed light
    // contrast range rather than one intermediate CSS interpolation frame.
    await expect.poll(async()=>questions.locator('.mm-reference-practice-choice').first().evaluate(el=>{
      const rgb=value=>(value.match(/[0-9.]+/g)||[]).map(Number);
      const bg=rgb(getComputedStyle(el).backgroundColor);
      const text=rgb(getComputedStyle(el.querySelector('b')).color);
      return bg.length>=3&&bg[0]>=205&&bg[1]>=225&&bg[2]>=225&&
        (bg.length<4||bg[3]>=.85)&&text[0]<=40&&text[1]<=75&&text[2]<=90;
    })).toBe(true);
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

test('Diagnostic learning notes never leak across two local learner profiles',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const learner=(id)=>({id,name:id,role:'learner',completed:[],bookmarks:[],notes:{},
      examScores:{},certificates:[],currentLesson:1,lastSeen:'2026-10-13T00:00:00Z',
      onboardingDone:true,experience:'Beginner',goal:'Learn injection moulding',dailyMinutes:15,region:'ALL'});
    localStorage.clear();
    localStorage.setItem('mouldmasterProDB',JSON.stringify({
      activeUser:'diagnostic-a',
      users:{'diagnostic-a':learner('diagnostic-a'),'diagnostic-b':learner('diagnostic-b')}
    }));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED&&window.MM_DIAGNOSTIC_WORKBENCH)&&!document.getElementById('mmBootstrap'));
  await page.evaluate(()=>switchView('defects'));
  const root=page.locator('#defects .mm-dx-workbench');
  await root.locator('[data-mm-dx-action="choose"]').first().click();
  await root.locator('textarea[name="baseline"]').fill('Learner A controlled baseline');
  await root.locator('[data-mm-dx-evidence="material"]').check();
  expect((await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report())).context.baseline)
    .toBe('Learner A controlled baseline');

  await page.evaluate(()=>switchUser('diagnostic-b'));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mouldmasterProDB')||'{}').activeUser==='diagnostic-b');
  await page.evaluate(()=>switchView('defects'));
  await expect(root.locator('.mm-dx-empty')).toBeVisible();
  const bReport=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(bReport.selectedDefect).toBeNull();
  expect(bReport.context.baseline).toBe('');
  expect(bReport.evidenceReportedAvailable).toEqual([]);
  await root.locator('[data-mm-dx-action="choose"]').first().click();
  await expect(root.locator('textarea[name="baseline"]')).toHaveValue('');
  await expect(root.locator('[data-mm-dx-evidence="material"]')).not.toBeChecked();

  await page.evaluate(()=>switchUser('diagnostic-a'));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mouldmasterProDB')||'{}').activeUser==='diagnostic-a');
  await page.evaluate(()=>switchView('defects'));
  await expect(root.locator('.mm-dx-empty')).toBeVisible();
});

test('Diagnostic controls discard stale events immediately after a learner change',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const learner=id=>({id,name:id,role:'learner',completed:[],bookmarks:[],notes:{},
      examScores:{},certificates:[],currentLesson:1,lastSeen:'2026-10-13T00:00:00Z',
      onboardingDone:true,experience:'Beginner',goal:'Learn injection moulding',
      dailyMinutes:15,region:'ALL'});
    localStorage.clear();
    localStorage.setItem('mouldmasterProDB',JSON.stringify({
      activeUser:'diagnostic-a',users:{
        'diagnostic-a':learner('diagnostic-a'),'diagnostic-b':learner('diagnostic-b')
      }
    }));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED&&window.MM_DIAGNOSTIC_WORKBENCH)&&!document.getElementById('mmBootstrap'));
  await page.evaluate(()=>switchView('defects'));
  const root=page.locator('#defects .mm-dx-workbench');
  await root.locator('[data-mm-dx-action="choose"]').first().click();
  await root.locator('textarea[name="observations"]').fill('Learner A should not be transferred');
  await root.locator('[data-mm-dx-evidence="part"]').check();
  // Trigger the old connected element's input synchronously after switching
  // users, before a navigation/render pass has refreshed the diagnostic pane.
  // A delayed observer alone cannot protect this same-task event.
  await page.evaluate(()=>{
    const stale=document.querySelector('#defects textarea[name="observations"]');
    switchUser('diagnostic-b');
    stale.value='stale cross-profile event';
    stale.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const report=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(report.selectedDefect).toBeNull();
  expect(report.context.observations).toBe('');
  expect(report.evidenceReportedAvailable).toEqual([]);
  await page.evaluate(()=>switchView('defects'));
  await expect(root.locator('.mm-dx-empty')).toBeVisible();
  await expect(root.locator('textarea[name="observations"]')).toHaveCount(0);
});

test('Choosing another defect clears unrelated measurements, evidence and judgement',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('defects'));
  const root=page.locator('#defects .mm-dx-workbench');
  const choices=root.locator('[data-mm-dx-action="choose"]');
  expect(await choices.count()).toBeGreaterThan(1);
  await choices.first().click();
  await root.locator('textarea[name="baseline"]').fill('First-defect known-good baseline');
  await root.locator('textarea[name="observations"]').fill('First-defect measured sample');
  await root.locator('[data-mm-dx-evidence="part"]').check();
  await root.locator('[data-mm-dx-action="analyse"]').click();
  const hypothesis=root.locator('[data-mm-dx-hypothesis]').first();
  if(await hypothesis.count())await hypothesis.selectOption('support');
  const oldReport=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(oldReport.context.observations).toBe('First-defect measured sample');
  expect(oldReport.evidenceReportedAvailable).toContain('part');
  await choices.nth(1).click();
  await expect(root.locator('textarea[name="baseline"]')).toHaveValue('');
  await expect(root.locator('textarea[name="observations"]')).toHaveValue('');
  await expect(root.locator('[data-mm-dx-evidence="part"]')).not.toBeChecked();
  const nextReport=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(nextReport.selectedDefect).not.toBe(oldReport.selectedDefect);
  expect(nextReport.context.observations).toBe('');
  expect(nextReport.context.baseline).toBe('');
  expect(nextReport.evidenceReportedAvailable).toEqual([]);
  expect(nextReport.hypotheses.every(row=>row.learnerAssessment==='unassessed')).toBe(true);
  expect(nextReport.rootCauseVerified).toBe(false);
  expect(nextReport.productionSetpointsAuthorized).toBe(false);
});

test('Diagnostic workbench keeps keyboard arrival across symptom, evidence, revision and reset',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('defects'));
  const workbench=page.locator('#defects .mm-dx-workbench');
  await expect(workbench).toBeVisible();
  const symptom=workbench.locator('[data-mm-dx-action="choose"]').first();
  await symptom.focus();
  await symptom.press('Enter');
  const firstField=workbench.locator('.mm-dx-fields select').first();
  await expect(firstField).toBeFocused();
  await workbench.locator('textarea[name="observations"]').fill('Compare measured results with validated baseline.');
  await workbench.locator('[data-mm-dx-action="analyse"]').focus();
  await page.keyboard.press('Enter');
  const analysisHeading=workbench.locator('.mm-dx-results .mm-dx-section-head h2');
  await expect(analysisHeading).toBeFocused();
  await expect(analysisHeading).toHaveCSS('outline-style','solid');
  await workbench.locator('[data-mm-dx-action="back"]').focus();
  await page.keyboard.press('Enter');
  await expect(workbench.locator('.mm-dx-fields select').first()).toBeFocused();
  await expect(workbench.locator('textarea[name="observations"]')).toHaveValue('Compare measured results with validated baseline.');
  await workbench.locator('[data-mm-dx-action="analyse"]').click();
  await workbench.locator('[data-mm-dx-action="reset"]').focus();
  await page.keyboard.press('Enter');
  await expect(workbench.locator('#mmDxSearch')).toBeFocused();
  await expect(workbench.locator('.mm-dx-empty')).toBeVisible();
});

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
    // The simple-reader intentionally hides/removes legacy lesson sidebar on small screens.
    await expect(lesson.locator('.mm-simple-lesson-hero')).toBeVisible();
    await expect(lesson.locator('.lesson-body > .content-block:not(.mm-simple-note-section), .lesson-body > .mm-simple-section:not(.mm-simple-note-section)').first()).toHaveCSS('background-color','rgb(240, 247, 250)');
    await lesson.locator('.mm-simple-note-disclosure > summary').click();
    await lesson.locator('#lessonNotes').fill('Test setup notes — do not use as process settings.');
    await lesson.getByRole('button',{name:'Save notes'}).click();
    await expect(lesson.locator('.mm-simple-lesson-hero > .mm-reference-deep-art')).toHaveCount(1);

    await page.evaluate(()=>switchView('simulator'));
    const simulator=page.locator('#simulator');
    await expect(simulator.locator('.form-card > .mm-reference-deep-art')).toBeVisible();
    await expect(simulator.locator('.output-panel > .mm-reference-deep-art')).toBeVisible();
    // The Virtual Apprenticeship and other embedded training widgets own
    // additional controls. Scope the count to the governed core simulator.
    const advanced=simulator.locator(':scope > .grid2 > .form-card > .mm-engineer-sim-groups');
    await expect(advanced.locator(':scope > summary')).toBeVisible();
    await advanced.locator(':scope > summary').click();
    const modelSliders=advanced.locator('.form-grid > label > .range-row > input[type="range"]');
    await expect(modelSliders).toHaveCount(10);
    await expect(simulator.locator('#mmSimMetricInputs')).toBeVisible();
    await expect(simulator.locator('#mmSimPrimaryFinding')).toContainText('training baseline');
    await expect(simulator.locator('#simAdvice')).toContainText('What to verify next');
    const fillSlider=modelSliders.first();
    await expect(fillSlider).toHaveValue('50');
    await fillSlider.focus();
    await fillSlider.press('ArrowRight');
    await expect(fillSlider).toHaveValue('51');
    await simulator.getByRole('button',{name:'Reset to baseline',exact:true}).click();
    await expect(simulator.locator('.mm-engineer-sim-groups input[type="range"]').first()).toHaveValue('50');
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

test('Materials routes quiz, reference evidence, explorer and labs without stale guide state',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('materials'));
  const material=page.locator('#materials');
  const study=material.locator('.mm-material-study-tools');
  const guide=study.locator('[data-mm-family-science]');
  await expect(guide).toHaveCount(1);
  await expect(guide).not.toHaveAttribute('open','');

  await study.locator(':scope > .mat-tabs > button').filter({hasText:'Knowledge check'}).click();
  const quiz=material.locator('.mat-quiz-card');
  await expect(quiz).toBeVisible();
  await expect(quiz.locator('.mat-q')).toHaveCount(18);
  await expect(material.locator('[data-mm-family-science]')).toHaveCount(0);
  await quiz.locator('.mat-q').first().locator('input[type="radio"]').first().check();
  await quiz.getByRole('button',{name:'Grade & review'}).click();
  await expect(quiz.locator('#materialQuizResult')).toBeVisible();
  await expect(quiz.locator('#materialQuizReview .mat-review')).toHaveCount(18);

  await material.locator('.mat-tabs > button').filter({hasText:'Evidence & references'}).click();
  await expect(material.locator('.standard-card')).toHaveCount(6);
  const paperLink=material.locator('.standard-card a.standard-link').first();
  await expect(paperLink).toBeVisible();
  await expect(paperLink).toHaveAttribute('href',/^https:\/\//);
  const paperTarget=await paperLink.getAttribute('target');
  if(paperTarget==='_blank')expect((await paperLink.getAttribute('rel')||'').split(/\s+/)).toContain('noopener');
  await expect(material.locator('[data-mm-family-science]')).toHaveCount(0);

  await material.locator('.mat-tabs > button').filter({hasText:'Material explorer'}).click();
  await expect(material.locator('.mat-explorer-controls')).toBeVisible();
  await material.locator('.mat-tabs > button').filter({hasText:'Interactive labs'}).click();
  await expect(material.locator('.mat-labs')).toBeVisible();
  await expect(material.locator('#rheoCurve svg')).toBeVisible();
  await expect(material.locator('[data-mm-family-science]')).toHaveCount(0);

  await material.locator('.mat-tabs > button').filter({hasText:'All lessons'}).click();
  await expect(page.locator('#path .mm-all-lessons')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

for(const width of [390,810]){
  test('real Materials labs, quiz and references share readable deep-screen controls at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:900});
    await openApp(page);
    await page.evaluate(()=>switchView('materials'));

    await page.locator('#materials .mat-tabs button').filter({hasText:'Interactive labs'}).click();
    const labs=page.locator('#materials .mat-shell .mat-labs');
    await expect(labs.locator(':scope > .mat-lab')).toHaveCount(4);
    await expect(labs.locator('.mat-lab').first()).toHaveCSS('background-color','rgb(240, 247, 250)');
    await expect(labs.locator('.mat-lab-output').first()).toHaveCSS('background-color','rgb(224, 239, 245)');
    const rheology=labs.locator('#rheoShear');
    await expect(rheology).toBeVisible();
    await rheology.focus();
    await rheology.press('ArrowRight');
    await expect(rheology).toHaveValue('46');
    await expect(labs.locator('#rheoOut')).toContainText('Illustrative');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);

    await page.locator('#materials .mat-tabs button').filter({hasText:'Knowledge check'}).click();
    const quiz=page.locator('#materials .mat-quiz-card');
    await expect(quiz).toBeVisible();
    await expect(quiz.locator('.mat-q')).toHaveCount(18);
    await expect(quiz.locator('.mat-q').first()).toHaveCSS('background-color','rgb(224, 239, 245)');
    await quiz.locator('.mat-q label').first().click();
    await expect(quiz.locator('.mat-q input[type=radio]:checked')).toHaveCount(1);
    await quiz.getByRole('button',{name:/Grade & review/i}).click();
    await expect(quiz.locator('#materialQuizResult')).toBeVisible();
    await expect(quiz.locator('#materialQuizResult')).toHaveCSS('background-color','rgb(213, 238, 233)');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);

    await page.locator('#materials .mat-tabs button').filter({hasText:'Evidence & references'}).click();
    const refs=page.locator('#materials .mat-shell .standard-card');
    await expect(refs.first()).toHaveCSS('background-color','rgb(240, 247, 250)');
    const sourceLink=refs.first().locator('a.standard-link');
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute('href',/^https:\/\//);
    if(await sourceLink.getAttribute('target')==='_blank'){
      expect((await sourceLink.getAttribute('rel')||'').split(/\s+/)).toContain('noopener');
    }
    await page.locator('#materials .mat-tabs button').filter({hasText:'Material explorer'}).click();
    // Native Material Explorer owns its curated grade filtering controls.
    // The separate indexed exact-grade catalogue is not cloned into this
    // nested mode, which must remain functional on phones and tablets.
    await expect(page.locator('#materials .mat-explorer-controls')).toBeVisible();
    await expect(page.locator('#materials .mat-material-grid .mat-material').first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  });
}
