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
    await expect(page.locator('#scenarios')).toHaveAttribute('data-mm-hub-mode','problem-practice');
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
    // Core Materials is followed immediately by all nine numbered chapters;
    // the process and tooling courses continue after the complete materials run.
    const orderedCourseNames=await illustratedCourses.locator('.mm-catalog-group-name').allTextContents();
    expect(orderedCourseNames.slice(0,13)).toEqual([
      '1. Foundations',
      '2. Machine & Controls',
      '3. Materials',
      'Material science В· 1. Polymer foundations',
      'Material science В· 2. Morphology & transitions',
      'Material science В· 3. Rheology & flow',
      'Material science В· 4. Thermal behaviour & cooling',
      'Material science В· 5. Moisture, drying & degradation',
      'Material science В· 6. Mechanical & long-term properties',
      'Material science В· 7. Shrinkage, orientation & warpage',
      'Material science В· 8. Fillers, fibres, additives & recyclate',
      'Material science В· 9. Material selection & data interpretation',
      '4. Mould Design'
    ]);
    for(const courseName of ['Automation & Sensors','Advanced Tooling & Simulation','Expert Process Engineering']){
      const course=illustratedCourses.filter({hasText:courseName});
      await expect(course).toHaveCount(1);
      await expect(course.locator('.mm-reference-course-art')).toBeVisible();
    }
    await expect(page.locator('#path .mm-catalog-material-track')).toHaveCount(9);
    await expect(illustratedCourses.last()).toContainText('Optional specialist');
    await expect(illustratedCourses.nth(1)).toContainText('Machine');
    await expect(illustratedCourses.nth(2)).toContainText('Materials');
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
    const study=page.locator('#materials #mmMaterialLearningAnchor');
    await expect(familyScience).toHaveCount(1);
    await expect(familyScience).not.toHaveAttribute('open','');
    await study.locator(':scope > summary').click();
    await familyScience.locator(':scope > summary').click();
    await expect(familyScience.locator('.mat-shell')).toBeVisible();
    await familyScience.locator(':scope > summary').click();
    await study.locator(':scope > summary').click();
    const pp=page.locator('#materials [data-mm-family-open="PP"]');
    await expect(pp).toBeVisible();
    await expect(pp).toContainText('96 published grades');
    await expect(pp.locator('.mm-reference-family-art')).toBeVisible();
    await pp.click();
    const detail=page.locator('#materials [data-mm-family-detail]');
    await expect(detail).toBeVisible();
    await expect(detail.locator('[data-mm-family-title]')).toContainText('PP В· Polypropylene');
    await expect(detail.locator('[data-mm-family-count]')).toContainText('96 published grades');
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
    await expect(study).toHaveCount(1);
    await expect(study).toHaveAttribute('open','');
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
    await expect(activities).toHaveCount(2);
    await expect(activities.locator('.mm-reference-photo')).toHaveCount(2);
    await expect(activities.filter({hasText:'Question Centre'})).toHaveCount(0);
    await expect(page.locator('#scenarios [data-mm-hub-action="question-centre"]')).toHaveCount(0);

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
  await expect(page.locator('#scenarios .mm-reference-practice-art')).toHaveCount(2);
  await page.waitForFunction(()=>document.documentElement.classList.contains('mm-reference-photo-ready'));
  const tiles=await page.locator('#scenarios .mm-reference-practice-art.mm-reference-photo').evaluateAll(nodes=>nodes.map(el=>({
    tile:Number(el.dataset.mmPhotoIndex),
    background:getComputedStyle(el).backgroundImage
  })));
  expect(tiles.map(row=>row.tile)).toEqual([20,19]);
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
    await expect(activities).toHaveCount(2);
    await expect(activities.locator(':scope > .mm-reference-practice-art')).toHaveCount(2);
    await expect(hub.locator('[data-mm-hub-action="material-labs"]')).toHaveCount(0);
    // The QA learner has no local learning evidence, so no generic substitute card should appear.
    await expect(hub.locator('.mm-reference-practice-feature')).toHaveCount(0);
    await page.evaluate(()=>{window.MM_REFERENCE_LAYOUT.refresh();window.MM_REFERENCE_LAYOUT.refresh()});
    await expect(activities.locator(':scope > .mm-reference-practice-art')).toHaveCount(2);
    const sizing=await activities.evaluateAll(nodes=>({
      overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      touch:nodes.every(el=>el.getBoundingClientRect().height>=44),
      descriptions:nodes.every(el=>el.querySelector('small')?.getBoundingClientRect().height>0),
      actions:nodes.every(el=>el.querySelector('.mm-hub-tile-action')?.getBoundingClientRect().height>0)
    }));
    expect(sizing.overflow).toBeLessThanOrEqual(2);
    expect(sizing.touch&&sizing.descriptions&&sizing.actions).toBe(true);

    // Virtual lab button and modal action listeners must survive decoration.
    await hub.locator('[data-mm-hub-action="labs"]').click();
    const labPicker=page.locator('#modal:not(.hidden) .mm-hub-picker-grid[data-mm-reference-practice-picker="modal"]');
    await expect(labPicker.locator('button.mm-reference-practice-choice')).toHaveCount(2);
    await expect(labPicker.locator(':scope > button > .mm-reference-practice-art')).toHaveCount(2);
    await expect(labPicker.locator('button').first()).toHaveCSS('color','rgb(9, 43, 66)');
    await labPicker.locator('[data-mm-hub-action="simulator"]').click();
    await expect(page.locator('#simulator')).toBeVisible();
    await expect(page.locator('#mmVirtualApprenticeship > .section-head > .mm-reference-practice-tool-art')).toBeVisible();
    await page.locator('#mmVirtualApprenticeship .hero-buttons button').filter({hasText:'Explore this case in Spatial Twin'}).click();
    await expect(page.locator('#mmSpatialTwin:not([hidden]) .mm-st-header .mm-reference-practice-tool-art')).toBeVisible();
    await page.locator('#mmSpatialTwin [data-mm-st-close]').click();

    await page.evaluate(()=>switchView('path'));
    await page.locator('#path .mm-learn-hub [data-mm-hub-action="question-centre"]').click();
    const questions=page.locator('#path .mm-question-centre');
    await expect(questions).toBeVisible();
    await expect(questions.locator('.mm-hub-picker-grid[data-mm-reference-learn-picker="question-centre"] > .mm-reference-practice-choice')).toHaveCount(5);
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
    await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
    await expect(page.locator('#path [data-mm-hub-action="question-centre"]')).toBeFocused();
    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
    await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="problem-practice"]').click();
    await page.locator('#scenarios .mm-problem-practice [data-mm-hub-action="diagnose-cause"]').click();
    await expect(page.locator('#defects .mm-dx-workbench')).toBeVisible();
    await expect(page.locator('#defects > .mm-practice-tool-return')).toBeVisible();
    await expect(page.locator('#defects .mm-dx-library .mm-dx-symptom').first()).toBeVisible();
    await page.locator('#defects .mm-dx-library .mm-dx-symptom').first().click();
    await expect(page.locator('#defects .mm-dx-evidence')).toBeVisible();
    await expect(page.locator('#defects .mm-dx-main-action')).toBeVisible();
    // Presentation upgrade is never approval of the diagnostic results.
    await expect(page.locator('#defects .mm-dx-disclaimer')).toContainText('No automatic');
    await page.locator('#defects .mm-practice-tool-back').click();
    await expect(hub).toBeVisible();
    await expect(hub.locator('[data-mm-hub-action="problem-practice"]')).toBeFocused();
  });
}

test('Diagnostic learning notes never leak across two local learner profiles',async({page})=>ЧЭ6¶‰ћЛkєwµзJ	Э^\™XVЫ[YOH›ШњЩ\ќ][ЫњИ—IКJKќТ]™U[YJ	ЙКNВ€]ШZ]^XЭ
›ЫЭ›ШШ]ЬЉ	ЦЩ]K[[KYY]љY[ЩOHњ\ќ—IКJK››ЭќР™PЪXЪЩY

NВ€ЫЫњЭ™^™\ЬќX]ШZ]YЩK™][X]J

OOќЪ[™ЭЛ“SWСPQУ“ФХPЧХУФ’Р‘SђТњ™\Ьќ

JNВ€^XЭ
™^™\ЬќњЩ[XЭYY™XЭ
K››ЭќР™JЫ™\ЬќњЩ[XЭYY™XЭ
NВ€^XЭ
™^™\ЬќЫЫќ^›ШњЩ\ќ][ЫњКKќР™J	ЙКNВ€^XЭ
™^™\ЬќЫЫќ^\Щ[[™JKќР™J	ЙКNВ€^XЭ
™^™\Ьќ™]љY[ЩT™\ЬќY]Z[X›JKќС\]X[
ЧJNВ€^XЭ
™^™\Ьќљ\Э\Щ\Л™]™\ћJ›ЭПOњ›ЭЛ›X\›™\ђ\ЬЩ\ЬЫY[ќOOIЭ[\ЬЩ\ЬЩY	КJKќР™JќYJNВ€^XЭ
™^™\Ьќњ›ЫЭШ]\ЩU™\љYљYY
KќР™J[ЩJNВ€^XЭ
™^™\Ьќњ›ЩXЭ[Ы”Щ]Ъ[ќР]]Ьљ^™Y
KќР™J[ЩJNВџJNВ‚ќ\Э
	СXYЫ›ЬЭXИЫЬљШ™[ЪЩY\ИЩ^X›Ш\™\њљ][XЬ›ЬЬИЮ[\ЫK]љY[ЩK™]љ\Ъ[Ы€[™™\Щ]	Л\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYЊОLZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЩY™XЭЙКJNВ€ЫЫњЭЫЬљШ™[Ъ\YЩK›ШШ]ЬЉ	ИЩY™XЭИ›[KY]ЫЬљШ™[Ъ	КNВ€]ШZ]^XЭ
ЫЬљШ™[Ъ
KќР™Uљ\ЪX›J
NВ€ЫЫњЭЮ[\ЫO]ЫЬљШ™[Ъ›ШШ]ЬЉ	ЦЩ]K[[KYXXЭ[ЫЏHЪЫЬЩH—IКK™љ\њЭ

NВ€]ШZ]Ю[\ЫK™›ШЭ\К
NВ€]ШZ]Ю[\ЫKњ™\ЬК	С[ќ\‰КNВ€ЫЫњЭљ\њЭљY[]ЫЬљШ™[Ъ›ШШ]ЬЉ	Л›[KYYљY[ИЩ[XЭ	КK™љ\њЭ

NВ€]ШZ]^XЭ
љ\њЭљY[
KќР™Q›ШЭ\ЩY

NВ€]ШZ]ЫЬљШ™[Ъ›ШШ]ЬЉ	Э^\™XVЫ[YOH›ШњЩ\ќ][ЫњИ—IКK™љ[
	РЫЫ\\™HYX\Э\™Y™\Э[ИЪ][Y]Y\Щ[[™K‰КNВ€]ШZ]ЫЬљШ™[Ъ›ШШ]ЬЉ	ЦЩ]K[[KYXXЭ[ЫЏH[[\ЩH—IКK™›ШЭ\К
NВ€]ШZ]YЩKљЩ^X›Ш\™њ™\ЬК	С[ќ\‰КNВ€ЫЫњЭ[[\Ъ\ТXY[™П]ЫЬљШ™[Ъ›ШШ]ЬЉ	Л›[KY\™\Э[И›[KY\ЩXЭ[Ы‹ZXY‰КNВ€]ШZ]^XЭ
[[\Ъ\ТXY[™КKќР™Q›ШЭ\ЩY

NВ€]ШZ]^XЭ
[[\Ъ\ТXY[™КKќТ]™PФФК	ЫЭ][™K\Э[IЛ	ЬЫЫY	КNВ€]ШZ]ЫЬљШ™[Ъ›ШШ]ЬЉ	ЦЩ]K[[KYXXЭ[ЫЏHXЪИ—IКK™›ШЭ\К
NВ€]ШZ]YЩKљЩ^X›Ш\™њ™\ЬК	С[ќ\‰КNВ€]ШZ]^XЭ
ЫЬљШ™[Ъ›ШШ]ЬЉ	Л›[KYYљY[ИЩ[XЭ	КK™љ\њЭ

JKќР™Q›ШЭ\ЩY

NВ€]ШZ]^XЭ
ЫЬљШ™[Ъ›ШШ]ЬЉ	Э^\™XVЫ[YOH›ШњЩ\ќ][ЫњИ—IКJKќТ]™U[YJ	РЫЫ\\™HYX\Э\™Y™\Э[ИЪ][Y]Y\Щ[[™K‰КNВ€]ШZ]ЫЬљШ™[Ъ›ШШ]ЬЉ	ЦЩ]K[[KYXXЭ[ЫЏH[[\ЩH—IКKЫXЪК
NВ€]ШZ]ЫЬљШ™[Ъ›ШШ]ЬЉ	ЦЩ]K[[KYXXЭ[ЫЏHњ™\Щ]—IКK™›ШЭ\К
NВ€]ШZ]YЩKљЩ^X›Ш\™њ™\ЬК	С[ќ\‰КNВ€]ШZ]^XЭ
ЫЬљШ™[Ъ›ШШ]ЬЉ	ИЫ[QЩX\Ъ	КJKќР™Q›ШЭ\ЩY

NВ€]ШZ]^XЭ
ЫЬљШ™[Ъ›ШШ]ЬЉ	Л›[KYY[\IКJKќР™Uљ\ЪX›J
NВџJNВ‚ќ\Э
	ФXЭXЩH™\ЭYXњИ[™\ЬЩ\ЬЫY[ќИЩY\ЫЬљЪ[™И[\Э]Y[™[™ИXY\њЙЛ\Ю[КЬYЩ_JOOћВ€\ЭњЩ][Y[Э]
L
NВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYЊОLZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ‚€›ЬЉЫЫњЭШXЭ[Ы‹›ЫЭ\›ЛЭ\ќXЪЧHЩ€В€ЙЩXYЫ›ЬЭXЛ[XњЙЛ	ИЩXYЫ›ЬЭXУXњЙЛ	Л™Z\›ЙЛ	ЦЩ]KY\Э\ќIЛ	ЦЩ]KYZЫYWIЧK€ЙЫX]\љX[[XњЙЛ	ИЫX]\љX[XњЙЛ	Л›[Z\›ЙЛ	ЦЩ]K[[\Э\ќIЛ	ЦЩ]K[[ZЫYWIЧB€J^В€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Ь]	КJNВ€]ШZ]YЩK›ШШ]ЬЉ	ИЬ]›[K[X\›‹ZX€Щ]K[[KZX‹XXЭ[ЫЏHњ]Y\Э[Ы‹XЩ[ќ™H—IКKЫXЪК
NВ€]ШZ]YЩK›ШШ]ЬЉ	ИЬ]›[K\]Y\Э[Ы‹XЩ[ќ™HЩ]K[[KZX‹XXЭ[ЫЏH‰КШXЭ[ЫЉЙИ—IКKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КЪ\›КЙИ€›[K\™Y™\™[ЩK\XЭXЩK]ЫЫX\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ€›[K\XЭXЩK]ЫЫ\™]\›‰КJKќТ]™PЫЭ[ќ
JNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КЬЭ\ќ
K™љ\њЭ

JKќР™Uљ\ЪX›J
NВ€]ШZ]YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КЬЭ\ќ
K™љ\њЭ

KЫXЪК
NВ€ЫЫњЭ]Y\Э[ЫђЪЪXЩO\YЩK›ШШ]ЬЉ›ЫЭ
ЙИќ]Ы‰ККXЭ[ЫЏOOIЩXYЫ›ЬЭXЛ[XњЙПЙЛ™XЪЪXЩIО‰Л›[XЪЪXЩIКJK™љ\њЭ

NВ€]ШZ]^XЭ
]Y\Э[ЫђЪЪXЩJKќР™Uљ\ЪX›J
NВ€^XЭ

]ШZ]]Y\Э[ЫђЪЪXЩK›Э[™[™Р›Ю

JKљZYЪ
KќР™QЬ™X]\•[“Ь‘\]X[

NВ€ЫЫњЭ[™[XXЭ[ЫЏOOIЩXYЫ›ЬЭXЛ[XњЙПЙЛ™[X€€™\[™[	О‰Л›[[X€€›[\[™[	ОВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КЬ[™[
K™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЊОKЌЛЌL
IКNВ€]ШZ]]Y\Э[ЫђЪЪXЩKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	ККXЭ[ЫЏOOIЩXYЫ›ЬЭXЛ[XњЙПЙЛ™Y™YYXЪЙО‰Л›[Y™YYXЪЙКJJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КШXЪКJKќР™Uљ\ЪX›J
NВ€]ШZ]YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КШXЪКKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИ	КЪ\›КЙИ€›[K\™Y™\™[ЩK\XЭXЩK]ЫЫX\ќ	КJKќТ]™PЫЭ[ќ
JNВ€B‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Ь]	КJNВ€]ШZ]YЩK›ШШ]ЬЉ	ИЬ]›[K[X\›‹ZX€Щ]K[[KZX‹XXЭ[ЫЏHњ]Y\Э[Ы‹XЩ[ќ™H—IКKЫXЪК
NВ€]ШZ]YЩK›ШШ]ЬЉ	ИЬ]›[K\]Y\Э[Ы‹XЩ[ќ™HЩ]K[[KZX‹XXЭ[ЫЏH\ЬЩ\ЬЫY[ќИ—IКKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЩ^[\ИњЩXЭ[Ы‹ZXY€›[K\™Y™\™[ЩK\XЭXЩK]ЫЫX\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЩ^[\И€›[K\XЭXЩK]ЫЫ\™]\›‰КJKќТ]™PЫЭ[ќ
JNВ€ЫЫњЭЭ\ќ^[O\YЩK›ШШ]ЬЉ	ИЩ^[\И™^[KXШ\™ќ]Ы‰КK™љ\њЭ

NВ€]ШZ]^XЭ
Э\ќ^[JKќР™Uљ\ЪX›J
NВ€]ШZ]Э\ќ^[KЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[››Э
љY[ЉHЩ^[T]Y\Э[ЫњИњ]Y\Э[Ы‰КK™љ\њЭ

JKќР™Uљ\ЪX›J
NВџJNВ‚ќ\Э
	У[Ь™HЩY\ИЪ^[\Э]Y]]™H\ШЫЬЭ\™\ЛЬљYЪ[[XЭ[ЫњИ[™Щ^X›Ш\™XШЩ\ЬЙЛ\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYЊОLZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK›ШШ]ЬЉ	Л›[Шљ[K[]€€ќ]Ы‰КK™љ[\ЉЪ\Х^‰У[Ь™IЯJKЫXЪК
NВ€ЫЫњЭЬ›Э\П\YЩK›ШШ]ЬЉ	ИЫ[Щ[›[K\™Y™\™[ЩK[[Ь™KXШ\™	КNВ€]ШZ]^XЭ
Ь›Э\КKќТ]™PЫЭ[ќ
ЉNВ€]ШZ]^XЭ
Ь›Э\Л›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћH€›[K\™Y™\™[ЩK[[Ь™KX\ќ	КJKќТ]™PЫЭ[ќ
ЉNВ€ЫЫњЭ™YЪ\ЭћPXЭ[ЫњПX]ШZ]YЩK›ШШ]ЬЉ	ИЫ[Щ[Щ]K[[K\™YЪ\ЭћK[Y[ќWIКKЫЭ[ќ

NВ€]ШZ]YЩK™][X]J

OOћЭЪ[™ЭЛ“SWФ‘Q‘T‘SђСWУVSХUњ™Yњ™\Ъ

NЭЪ[™ЭЛ“SWФ‘Q‘T‘SђСWУVSХUњ™Yњ™\Ъ

_JNВ€]ШZ]^XЭ
Ь›Э\Л›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћH€›[K\™Y™\™[ЩK[[Ь™KX\ќ	КJKќТ]™PЫЭ[ќ
ЉNВ€^XЭ
]ШZ]YЩK›ШШ]ЬЉ	ИЫ[Щ[Щ]K[[K\™YЪ\ЭћK[Y[ќWIКKЫЭ[ќ

JKќР™J™YЪ\ЭћPXЭ[ЫњКNВ€ЫЫњЭX›Э]\YЩK›ШШ]ЬЉ	ИЫ[Щ[›[K\™Y™\™[ЩK[[Ь™KY^IКK™љ[\ЉЪ\Х^‰РX›Э][Э[X\Э\‰ЯJNВ€]ШZ]^XЭ
X›Э]
K››ЭќТ]™P]љXќ]J	ЫЬ[‰Л	ЙКNВ€ЫЫњЭXY\ЏXX›Э]›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћIКNВ€]ШZ]XY\‹™›ШЭ\К
NВ€]ШZ]XY\‹њ™\ЬК	С[ќ\‰КNВ€]ШZ]^XЭ
X›Э]
KќТ]™P]љXќ]J	ЫЬ[‰Л	ЙКNВ€]ШZ]^XЭ
X›Э]›ШШ]ЬЉ	ШVЪ™YЏH‹‹ЬЭ\Ьќљ[Ы[TШH—IКJKќР™Uљ\ЪX›J
NВ€]ШZ]XY\‹њ™\ЬК	С[ќ\‰КNВ€]ШZ]^XЭ
X›Э]
K››ЭќТ]™P]љXќ]J	ЫЬ[‰Л	ЙКNВ€^XЭ
]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYZ[›™\•ЪY
JKќР™S\ЬХ[“Ь‘\]X[
ЉNВ€]ШZ]YЩK™][X]J

OOќЪ[™ЭЛЫЬЩS[Щ[ЛЉ
JNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[›[Щ[XШ\™	КJKќР™RY[Љ
NВ€]ШZ]YЩK›ШШ]ЬЉ	Л›[Шљ[K[]€€ќ]Ы‰КK™љ[\ЉЪ\Х^‰ФXЭXЩIЯJKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЬШЩ[\љ[ЬИ›[K\XЭXЩKZX‰КJKќР™Uљ\ЪX›J
NВџJNВ‚™›ЬЉЫЫњЭЪYЩ€МНЊLJ^В€\Э
	Ш\›Э™YY\\ШЬ™Y[€\ЪYЫ€ЩY\ИXЭX[\ЬЫЫ‹Ъ[][]Ь€[™™\ЫЭ\ЩHXЭ[ЫњИ]	КЭЪY
ЙЬ	Л\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYZYЪЋLJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Ы\ЬЫЫ‰КJNВ€ЫЫњЭ\ЬЫЫЏ\YЩK›ШШ]ЬЉ	ИЫ\ЬЫЫ‰КNВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›[K\Ъ[\K[\ЬЫЫ‹Z\›И€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›\ЬЫЫ‹X›ЩK›[K\™Y™\™[ЩKYY\\[™[	КJKќР™Uљ\ЪX›J
NВ€ЛИHЪ[\K\™XY\€[ќ[ќ[Ы[HY\ЛЬ™[[Э™\ИYШXЮH\ЬЫЫ€ЪYX\€Ы€ЫX[ШЬ™Y[њЛ‚€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›[K\Ъ[\K[\ЬЫЫ‹Z\›ЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›\ЬЫЫ‹X›ЩH€ЫЫќ[ќX›ШЪО››Э
›[K\Ъ[\K[›ЭK\ЩXЭ[ЫЉK›\ЬЫЫ‹X›ЩH€›[K\Ъ[\K\ЩXЭ[ЫЋ››Э
›[K\Ъ[\K[›ЭK\ЩXЭ[ЫЉIКK™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЌЌЛЌL
IКNВ€]ШZ]\ЬЫЫ‹›ШШ]ЬЉ	Л›[K\Ъ[\K[›ЭKY\ШЫЬЭ\™H€Э[[X\ћIКKЫXЪК
NВ€]ШZ]\ЬЫЫ‹›ШШ]ЬЉ	ИЫ\ЬЫЫ“›Э\ЙКK™љ[
	Х\ЭЩ]\›Э\И8 %И›Э\ЩH\И›ШЩ\ЬИЩ][™ЬЛ‰КNВ€]ШZ]\ЬЫЫ‹™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‰ФШ]™H›Э\ЙЯJKЫXЪК
NВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›[K\Ъ[\K[\ЬЫЫ‹Z\›И€›[K\™Y™\™[ЩKYY\X\ќ	КJKќТ]™PЫЭ[ќ
JNВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЬЪ[][]Ь‰КJNВ€ЫЫњЭЪ[][]ЬЏ\YЩK›ШШ]ЬЉ	ИЬЪ[][]Ь‰КNВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	Л™›Ь›KXШ\™€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	Л›Э]]\[™[€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€ЛИHљ\ќX[\™[ќXЩ\Ъ\[™Э\€[X™YYZ[љ[™ИЪYЩ]ИЭЫ‚€ЛИY][Ы[ЫЫќ›ЫЛ€ШЫЬHHЫЭ[ќИHЫЭ™\›™YЫЬ™HЪ[][]Ь‹‚€ЫЫњЭY[ЩY\Ъ[][]Ь‹›ШШ]ЬЉ	ОњШЫЬH€™ЬљY€€™›Ь›KXШ\™€›[KY[™Ъ[™Y\‹\Ъ[KYЬ›Э\ЙКNВ€]ШZ]^XЭ
Y[ЩY›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћIКJKќР™Uљ\ЪX›J
NВ€]ШZ]Y[ЩY›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћIКKЫXЪК
NВ€ЫЫњЭ[Щ[ЫY\њПXY[ЩY›ШШ]ЬЉ	Л™›Ь›KYЬљY€X™[€њ[™ЩK\›ЭИ€[њ]Э\OHњ[™ЩH—IКNВ€]ШZ]^XЭ
[Щ[ЫY\њКKќТ]™PЫЭ[ќ
L
NВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	ИЫ[TЪ[SY]љXТ[њ]ЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	ИЫ[TЪ[Tљ[X\ћQљ[™[™ЙКJKќРЫЫќZ[•^
	ЭZ[љ[™И\Щ[[™IКNВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	ИЬЪ[PYљXЩIКJKќРЫЫќZ[•^
	ХЪ]И™\љYћH™^	КNВ€ЫЫњЭљ[ЫY\Џ[[Щ[ЫY\њЛ™љ\њЭ

NВ€]ШZ]^XЭ
љ[ЫY\ЉKќТ]™U[YJ	НL	КNВ€]ШZ]љ[ЫY\‹™›ШЭ\К
NВ€]ШZ]љ[ЫY\‹њ™\ЬК	Р\њ›ЭФљYЪ	КNВ€]ШZ]^XЭ
љ[ЫY\ЉKќТ]™U[YJ	НLIКNВ€]ШZ]Ъ[][]Ь‹™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‰Ф™\Щ]И\Щ[[™IЛ^XЭќќY_JKЫXЪК
NВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	Л›[KY[™Ъ[™Y\‹\Ъ[KYЬ›Э\И[њ]Э\OHњ[™ЩH—IКK™љ\њЭ

JKќТ]™U[YJ	НL	КNВ€]ШZ]^XЭ
Ъ[][]Ь‹›ШШ]ЬЉ	Л™›Ь›KXШ\™€›[K\™Y™\™[ЩKYY\X\ќ	КJKќТ]™PЫЭ[ќ
JNВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Эљ\ЭX[ЙКJNВ€ЫЫњЭљ\ЭX[П\YЩK›ШШ]ЬЉ	ИЭљ\ЭX[ЙКNВ€]ШZ]^XЭ
љ\ЭX[Л›ШШ]ЬЉ	Лќљ\ЭX[]Ь\™љ\њЭXЪ[€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]љ\ЭX[Л™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‰Сљ[[™ЙЛ^XЭќќY_JKЫXЪК
NВ€]ШZ]^XЭ
љ\ЭX[Л›ШШ]ЬЉ	ИЬ\ЩU^	КJKќРЫЫќZ[•^
	Э™[ШЪ]HЫЫќ›Ы	КNВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЩЫЬЬШ\ћIКJNВ€ЫЫњЭЫЬЬШ\ћO\YЩK›ШШ]ЬЉ	ИЩЫЬЬШ\ћIКNВ€]ШZ]^XЭ
ЫЬЬШ\ћK›ШШ]ЬЉ	ЛњЩXЭ[Ы‹ZXY€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]ЫЬЬШ\ћK›ШШ]ЬЉ	ИЩЫЬЬШ\ћTЩX\Ъ	КK™љ[
	Ь™\ЬЭ\™IКNВ€]ШZ]^XЭ
ЫЬЬШ\ћK›ШШ]ЬЉ	Лќ\›Nќљ\ЪX›IКK™љ\њЭ

JKќР™Uљ\ЪX›J
NВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЩY™XЭЙКJNВ€ЫЫњЭY™XЭП\YЩK›ШШ]ЬЉ	ИЩY™XЭЙКNВ€]ШZ]^XЭ
Y™XЭЛ›ШШ]ЬЉ	Л›[KYZ\›И€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
Y™XЭЛ›ШШ]ЬЉ	Л›[KY\[™K›[K\™Y™\™[ЩKYY\\[™[	КK™љ\њЭ

JKќР™Uљ\ЪX›J
NВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ШЫШXЪ	КJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИШЫШXЪ›[KYZ\›И€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИШЫШXЪ›[KY[Xњ\ћH›[KY\Ю[\ЫIКK™љ\њЭ

JKќР™Uљ\ЪX›J
NВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЬЭ[™\™ЙКJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЬЭ[™\™ИњЩXЭ[Ы‹ZXY€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ШЩ\ќYљXШ]\ЙКJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИШЩ\ќYљXШ]\ИњЩXЭ[Ы‹ZXY€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Ь›Щљ[IКJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЬ›Щљ[H™›Ь›KXШ\™™љ\њЭXЪ[€›[K\™Y™\™[ЩKYY\X\ќ	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЬ›Щљ[HЬ›Щљ[S[YIКJKќР™Uљ\ЪX›J
NВ‚€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	Ы\ЬЫЫ‰КJNВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	ИЫ\ЬЫЫ“›Э\ЙКJKќТ]™U[YJ	Х\ЭЩ]\›Э\И8 %И›Э\ЩH\И›ШЩ\ЬИЩ][™ЬЛ‰КNВ€]ШZ]^XЭ
\ЬЫЫ‹›ШШ]ЬЉ	Л›[K\Ъ[\K[\ЬЫЫ‹Z\›И€›[K\™Y™\™[ЩKYY\X\ќ	КJKќТ]™PЫЭ[ќ
JNВ€ЫЫњЭШЭ[Y[ќЭ™\™›ЭПX]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYYШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќЫY[ќЪY
NВ€^XЭ
ШЭ[Y[ќЭ™\™›ЭКKќР™S\ЬХ[“Ь‘\]X[
ЉNВ€JNВџB‚ќ\Э
	УX]\љX[И›Э]\И]Z^‹™Y™\™[ЩH]љY[ЩK^Ь™\€[™XњИЪ]Э]Э[HЭZYHЭ]IЛ\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYЊОLZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЫX]\љX[ЙКJNВ€ЫЫњЭX]\љX[\YЩK›ШШ]ЬЉ	ИЫX]\љX[ЙКNВ€ЫЫњЭЭYO[X]\љX[›ШШ]ЬЉ	Л›[K[X]\љX[\ЭYK]ЫЫЙКNВ€ЫЫњЭЭZYO\ЭYK›ШШ]ЬЉ	ЦЩ]K[[KY[Z[K\ШЪY[ЩWIКNВ€]ШZ]^XЭ
ЭZYJKќТ]™PЫЭ[ќ
JNВ€]ШZ]^XЭ
ЭZYJK››ЭќТ]™P]љXќ]J	ЫЬ[‰Л	ЙКNВ€]ШZ]ЭYK›ШШ]ЬЉ	ОњШЫЬH€Э[[X\ћIКKЫXЪК
NВ‚€]ШZ]ЭYK›ШШ]ЬЉ	ОњШЫЬH€›X]]XњИ€ќ]Ы‰КK™љ[\ЉЪ\Х^‰ТЫ›ЭЫYЩHЪXЪЙЯJKЫXЪК
NВ€ЫЫњЭ]Z^Џ[X]\љX[›ШШ]ЬЉ	Л›X]\]Z^‹XШ\™	КNВ€]ШZ]^XЭ
]Z^ЉKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	Л›X]\IКJKќТ]™PЫЭ[ќ
N
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	ЦЩ]K[[KY[Z[K\ШЪY[ЩWIКJKќТ]™PЫЭ[ќ

NВ€]ШZ]]Z^‹›ШШ]ЬЉ	Л›X]\IКK™љ\њЭ

K›ШШ]ЬЉ	Ъ[њ]Э\OHњY[И—IКK™љ\њЭ

KЪXЪК
NВ€]ШZ]]Z^‹™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‰СЬYH	€™]љY]ЙЯJKЫXЪК
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	ИЫX]\љX[]Z^”™\Э[	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	ИЫX]\љX[]Z^”™]љY]И›X]\™]љY]ЙКJKќТ]™PЫЭ[ќ
N
NВ‚€]ШZ]X]\љX[›ШШ]ЬЉ	Л›X]]XњИ€ќ]Ы‰КK™љ[\ЉЪ\Х^‰С]љY[ЩH	€™Y™\™[Щ\ЙЯJKЫXЪК
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	ЛњЭ[™\™XШ\™	КJKќТ]™PЫЭ[ќ
ЉNВ€ЫЫњЭ\\“[љП[X]\љX[›ШШ]ЬЉ	ЛњЭ[™\™XШ\™KњЭ[™\™[[љЙКK™љ\њЭ

NВ€]ШZ]^XЭ
\\“[љКKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
\\“[љКKќТ]™P]љXќ]J	Ъ™Y‰ЛЧљО—ЧЛКNВ€ЫЫњЭ\\•\™Щ]X]ШZ]\\“[љЛ™Щ]]љXќ]J	Э\™Щ]	КNВ€YЉ\\•\™Щ]OOIЧШ›[љЙКY^XЭ

]ШZ]\\“[љЛ™Щ]]љXќ]J	Ь™[	К_	ЙКKњЬ]
ЧКЛКJKќРЫЫќZ[Љ	Ы›ЫЬ[™\‰КNВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	ЦЩ]K[[KY[Z[K\ШЪY[ЩWIКJKќТ]™PЫЭ[ќ

NВ‚€]ШZ]X]\љX[›ШШ]ЬЉ	Л›X]]XњИ€ќ]Ы‰КK™љ[\ЉЪ\Х^‰УX]\љX[^Ь™\‰ЯJKЫXЪК
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	Л›X]Y^Ь™\‹XЫЫќ›ЫЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]X]\љX[›ШШ]ЬЉ	Л›X]]XњИ€ќ]Ы‰КK™љ[\ЉЪ\Х^‰Т[ќ\XЭ]™HXњЙЯJKЫXЪК
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	Л›X][XњЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	ИЬљ[РЭ\ќ™HЭ™ЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
X]\љX[›ШШ]ЬЉ	ЦЩ]K[[KY[Z[K\ШЪY[ЩWIКJKќТ]™PЫЭ[ќ

NВ‚€]ШZ]X]\љX[›ШШ]ЬЉ	Л›X]]XњИ€ќ]Ы‰КK™љ[\ЉЪ\Х^‰Р[\ЬЫЫњЙЯJKЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЬ]›[KX[[\ЬЫЫњЙКJKќР™Uљ\ЪX›J
NВ€ЫЫњЭЭ™\™›ЭПX]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYYШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќЫY[ќЪY
NВ€^XЭ
Э™\™›ЭКKќР™S\ЬХ[“Ь‘\]X[
ЉNВџJNВ‚™›ЬЉЫЫњЭЪYЩ€МОLLJ^В€\Э
	Ь™X[X]\љX[ИXњЛ]Z^€[™™Y™\™[Щ\ИЪ\™H™XYX›HY\\ШЬ™Y[€ЫЫќ›ЫИ]	КЭЪY
ЙЬ	Л\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYZYЪЋLJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЫX]\љX[ЙКJNВ‚€]ШZ]YЩK›ШШ]ЬЉ	ИЫ[SX]\љX[X\›љ[™Р[ЪЬ€€Э[[X\ћIКKЫXЪК
NВ€]ШZ]YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]]XњИќ]Ы‰КK™љ[\ЉЪ\Х^‰Т[ќ\XЭ]™HXњЙЯJKЫXЪК
NВ€ЫЫњЭXњП\YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]\Ъ[›X][XњЙКNВ€]ШZ]^XЭ
XњЛ›ШШ]ЬЉ	ОњШЫЬH€›X][X‰КJKќТ]™PЫЭ[ќ

NВ€]ШZ]^XЭ
XњЛ›ШШ]ЬЉ	Л›X][X‰КK™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЌЌЛЌL
IКNВ€]ШZ]^XЭ
XњЛ›ШШ]ЬЉ	Л›X][X‹[Э]]	КK™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЊЌЊОKЌJIКNВ€ЫЫњЭљ[ЫЩЮO[XњЛ›ШШ]ЬЉ	ИЬљ[ФЪX\‰КNВ€]ШZ]^XЭ
љ[ЫЩЮJKќР™Uљ\ЪX›J
NВ€]ШZ]љ[ЫЩЮK™›ШЭ\К
NВ€]ШZ]љ[ЫЩЮKњ™\ЬК	Р\њ›ЭФљYЪ	КNВ€]ШZ]^XЭ
љ[ЫЩЮJKќТ]™U[YJ	Н‰КNВ€]ШZ]^XЭ
XњЛ›ШШ]ЬЉ	ИЬљ[УЭ]	КJKќРЫЫќZ[•^
	Т[\Э]]™IКNВ€^XЭ
]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYZ[›™\•ЪY
JKќР™S\ЬХ[“Ь‘\]X[
ЉNВ‚€]ШZ]YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]]XњИќ]Ы‰КK™љ[\ЉЪ\Х^‰ТЫ›ЭЫYЩHЪXЪЙЯJKЫXЪК
NВ€ЫЫњЭ]Z^Џ\YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]\]Z^‹XШ\™	КNВ€]ШZ]^XЭ
]Z^ЉKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	Л›X]\IКJKќТ]™PЫЭ[ќ
N
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	Л›X]\IКK™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЊЌЊОKЌJIКNВ€]ШZ]]Z^‹›ШШ]ЬЉ	Л›X]\HX™[	КK™љ\њЭ

KЫXЪК
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	Л›X]\H[њ]Э\O\Y[ЧNЪXЪЩY	КJKќТ]™PЫЭ[ќ
JNВ€]ШZ]]Z^‹™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‹СЬYH	€™]љY]ЛЪ_JKЫXЪК
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	ИЫX]\љX[]Z^”™\Э[	КJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
]Z^‹›ШШ]ЬЉ	ИЫX]\љX[]Z^”™\Э[	КJKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЊLЛЊОЊМКIКNВ€^XЭ
]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYZ[›™\•ЪY
JKќР™S\ЬХ[“Ь‘\]X[
ЉNВ‚€]ШZ]YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]]XњИќ]Ы‰КK™љ[\ЉЪ\Х^‰С]љY[ЩH	€™Y™\™[Щ\ЙЯJKЫXЪК
NВ€ЫЫњЭ™YњП\YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]\Ъ[њЭ[™\™XШ\™	КNВ€]ШZ]^XЭ
™YњЛ™љ\њЭ

JKќТ]™PФФК	ШXЪЩЬ›Э[™XЫЫЬ‰Л	Ь™ШЉЌЌЛЌL
IКNВ€ЫЫњЭЫЭ\ЩS[љП\™YњЛ™љ\њЭ

K›ШШ]ЬЉ	ШKњЭ[™\™[[љЙКNВ€]ШZ]^XЭ
ЫЭ\ЩS[љКKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
ЫЭ\ЩS[љКKќТ]™P]љXќ]J	Ъ™Y‰ЛЧљО—ЧЛКNВ€YЉ]ШZ]ЫЭ\ЩS[љЛ™Щ]]љXќ]J	Э\™Щ]	КOOOIЧШ›[љЙК^В€^XЭ

]ШZ]ЫЭ\ЩS[љЛ™Щ]]љXќ]J	Ь™[	К_	ЙКKњЬ]
ЧКЛКJKќРЫЫќZ[Љ	Ы›ЫЬ[™\‰КNВ€B€]ШZ]YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]]XњИќ]Ы‰КK™љ[\ЉЪ\Х^‰УX]\љX[^Ь™\‰ЯJKЫXЪК
NВ€ЛИ]]™HX]\љX[^Ь™\€ЭЫњИ]ИЭ\]YЬYHљ[\љ[™ИЫЫќ›ЫЛ‚€ЛИHЩ\\]H[™^Y^XЭYЬYHШ][ЩЭYH\И›ЭЫЫ™Y[ќИ\В€ЛИ™\ЭY[ЩKЪXЪ]\Э™[XZ[€ќ[Э[Ы[Ы€Ы™\И[™X›]Л‚€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X]Y^Ь™\‹XЫЫќ›ЫЙКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫX]\љX[И›X][X]\љX[YЬљY›X][X]\љX[	КK™љ\њЭ

JKќР™Uљ\ЪX›J
NВ€^XЭ
]ШZ]YЩK™][X]J

OO™ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYZ[›™\•ЪY
JKќР™S\ЬХ[“Ь‘\]X[
ЉNВ€JNВџB‚‹ЛИ^\Ъ\ЩH]™\ћHљ[X\ћH[Шљ[HX€[™\[™[ќHЩ€Hљ\ЭX[ЫЫ[€љ[\Л‚‹ЛИHШ[YHЪ[ќ\‹Щ›ШЭ\ЛЫЭ™\™›ЭИЪXЪЬИ\HИЫYKX\›‹X]\љX[Л‹ЛИXЭXЩKX]И[™[Ь™H][›Э\€\›Э™Y\њ›ЭИљY]ЬЬќЪYЛ‚™›ЬЉЫЫњЭЪYЩ€ММЊНЊОLL—J^В€\Э
	Ш[Ъ^[Шљ[HXњИЩY\ЫЫњЪ\Э[ќ]љYШ][Ы€[™›ИЭ[HЭ™\€]	КЭЪY
ЙЬ	Л\Ю[КЬYЩ_JOOћВ€\ЭњЩ][Y[Э]
L
NВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ€ЫЫњЭXњПVВ€ЙТЫYIЛ	ИЩ\Ъ›Ш\™	Л	ИЩ\Ъ›Ш\™›[K\™Y™\™[ЩKZЫYKZ\›ЙЧK€ЙУX\›‰Л	ИЬ]	Л	ИЬ]›[K\™Y™\™[ЩK]]IЧK€ЙУX]\љX[ЙЛ	ИЫX]\љX[ЙЛ	ИЫX]\љX[И›[K\™Y™\™[ЩK[X]\љX[Л]]IЧK€ЙФXЭXЩIЛ	ИЬШЩ[\љ[ЬЙЛ	ИЬШЩ[\љ[ЬИ›[K\™Y™\™[ЩK]]IЧK€NВ€›ЬЉЫЫњЭЫ[YK›ЫЭ[™X\љЧHЩ€XњК^В€ЫЫњЭќ]ЫЏ\YЩK›ШШ]ЬЉ	Л›[Шљ[K[]€€ќ]Ы‰КK™љ[\ЉЪ\Х^›[Y_JNВ€]ШZ]^XЭ
ќ]ЫЉKќТ]™PЫЭ[ќ
JNВ€]ШZ]ќ]Ы‹ЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
JKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ[™X\љКJKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
ќ]ЫЉKќТ]™P]љXќ]J	Ш\љXKXЭ\њ™[ќ	Л	ЬYЩIКNВ€ЫЫњЭ]›ЮX]ШZ]ќ]Ы‹›Э[™[™Р›Ю

NВ€^XЭ
]›Ю[YJЙИ]љYШ][Ы€\\™Щ]	КK››ЭќР™Sќ[

NВ€^XЭ
]›ЮќЪY
KќР™QЬ™X]\•[“Ь‘\]X[

NВ€^XЭ
]›ЮљZYЪ
KќР™QЬ™X]\•[“Ь‘\]X[

NВ€ЛИHЭ[HЪ[ќ\€Э™\€X€][\И]\Э›ЭШ\њћH[ќИ[›Э\€Ш\\™K‚€]ШZ]YЩK›[Э\ЩK›[Э™JKJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ›ЫЭ
ЙИљ\Кќ]Ы‹VЪ™Y—KЭ[[X\ћKЬ›ЫOHќ]Ы€—JNљЭ™\‰КJKќТ]™PЫЭ[ќ

NВ€ЫЫњЭЭ™\™›ЭПX]ШZ]YЩK™][X]J

OO‚€ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYYШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќЫY[ќЪY€
NВ€^XЭ
Э™\™›ЭЛ[YJЙИ]\Э›ЭЭ™\™›ЭИЬљ^›Ыќ[IКKќР™S\ЬХ[“Ь‘\]X[
ЉNВ€B€ЫЫњЭ[Ь™O\YЩK›ШШ]ЬЉ	Л›[Шљ[K[]€€ќ]Ы‰КK™љ[\ЉЪ\Х^‰У[Ь™IЯJNВ€]ШZ]^XЭ
[Ь™JKќТ]™PЫЭ[ќ
JNВ€]ШZ][Ь™KЫXЪК
NВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[›[K[[Ь™KY\ШЫЬЭ\™IКJKќТ]™PЫЭ[ќ
ЉNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[	КK™Щ]ћT›ЫJ	ЪXY[™ЙЛЫ[YN‰У[Ь™IЯJJKќР™Uљ\ЪX›J
NВ€ЫЫњЭ]›ЮX]ШZ][Ь™K›Э[™[™Р›Ю

NВ€^XЭ
]›Ю
K››ЭќР™Sќ[

NВ€^XЭ
]›ЮќЪY
KќР™QЬ™X]\•[“Ь‘\]X[

NВ€^XЭ
]›ЮљZYЪ
KќР™QЬ™X]\•[“Ь‘\]X[

NВ€]ШZ]YЩK›[Э\ЩK›[Э™JKJNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[љ\Кќ]Ы‹VЪ™Y—KЭ[[X\ћKЬ›ЫOHќ]Ы€—JNљЭ™\‰КJKќТ]™PЫЭ[ќ

NВ€ЫЫњЭЭ™\™›ЭПX]ШZ]YЩK™][X]J

OO‚€ШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќњШЬ›ЫЪYYШЭ[Y[ќ™ШЭ[Y[ќ[[Y[ќЫY[ќЪY€
NВ€^XЭ
Э™\™›ЭЛ	У[Ь™H]\Э›ЭЭ™\™›ЭИЬљ^›Ыќ[IКKќР™S\ЬХ[“Ь‘\]X[
ЉNВ€]ШZ]YЩK™][X]J

OOќЪ[™ЭЛЫЬЩS[Щ[ЛЉ
JNВ€]ШZ]^XЭ
YЩK›ШШ]ЬЉ	ИЫ[Щ[›[Щ[XШ\™	КJKќР™RY[Љ
NВ€JNВџB‚‹ЛИXЭXЩH[ЫY\ИЬ]X[Ъ[€[€]ИXњИЪЫЬЩ\‹€]И™\ЭYЪ[][]Ь‚‹ЛИ]\ЭЩY\HШ[YHЩ^X›Ш\™XXШЩ\ЬЪX›H™]\›€]\ИHЭ\€ЫЫЛ‚ќ\Э
	ФXЭXЩHЬ]X[Ъ[€™\ЭЬ™\ИXњЛXШ\™›ШЭ\Ињ›ЫH]ИЭЫ€ЭXњYЩIЛ\Ю[КЬYЩ_JOOћВ€]ШZ]YЩKњЩ]љY]ЬЬќЪ^™JЭЪYЊОLZYЪЋJNВ€]ШZ]Ь[ђ\
YЩJNВ€]ШZ]YЩK™][X]J

OOњЭЪ]ЪљY]К	ЬШЩ[\љ[ЬЙКJNВ€ЫЫњЭXЏ\YЩK›ШШ]ЬЉ	ИЬШЩ[\љ[ЬИ›[K\XЭXЩKZX‰КNВ€ЫЫњЭXњПZX‹›ШШ]ЬЉ	ЦЩ]K[[KZX‹XXЭ[ЫЏH›XњИ—IКNВ€]ШZ]XњЛЫXЪК
NВ€ЫЫњЭXЪЩ\Џ\YЩK›ШШ]ЬЉ	ИЫ[Щ[››Э
љY[ЉH›[KZX‹\XЪЩ\‹YЬљY	КNВ€]ШZ]XЪЩ\‹›ШШ]ЬЉ	ЦЩ]K[[KZX‹XXЭ[ЫЏHњЬ]X[]Ъ[€—IКKЫXЪК
NВ€ЫЫњЭЪ[Џ\YЩK›ШШ]ЬЉ	ИЫ[TЬ]X[Ъ[‰КNВ€]ШZ]^XЭ
Ъ[ЉKќР™Uљ\ЪX›J
NВ€ЫЫњЭ]Џ]Ъ[‹›ШШ]ЬЉ	ОњШЫЬH€›[K\XЭXЩK]ЫЫ\™]\›‰КNВ€]ШZ]^XЭ
]ЉKќТ]™PЫЭ[ќ
JNВ€]ШZ]]‹™Щ]ћT›ЫJ	Шќ]Ы‰ЛЫ[YN‹РXЪИИXЭXЩKЯJKЫXЪК
NВ€]ШZ]^XЭ
XЉKќР™Uљ\ЪX›J
NВ€]ШZ]^XЭ
XњКKќР™Q›ШЭ\ЩY

NВџJNВ