const {test,expect}=require('@playwright/test');

function learner(id='premium-ui-qa'){
  return {id,name:'Premium UI QA',role:'learner',completed:[1,2,3],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-16T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
}

async function openApp(page){
  await page.addInitScript(({user})=>{
    let db=null;
    try{db=JSON.parse(localStorage.getItem('mouldmasterProDB')||'null')}catch(_){}
    const seeded=Boolean(db&&db.activeUser===user.id&&db.users&&db.users[user.id]);
    if(!seeded){
      localStorage.clear();
      localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
    }
  },{user:learner()});
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&typeof window.switchView==='function');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

async function assertNoHorizontalOverflow(page,label){
  const dims=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(dims.scrollWidth,`${label}: no horizontal overflow`).toBeLessThanOrEqual(dims.clientWidth+1);
}

test('compact desktop shell retains Materials and specialist More access',async({page})=>{
  await page.setViewportSize({width:1440,height:860});
  await openApp(page);
  const nav=page.locator('#nav');
  for(const label of ['Home','Learn','Materials','Practice']){
    await expect(nav.locator(':scope > button:visible').filter({hasText:label})).toHaveCount(1);
  }
  await expect(nav.locator('button[data-mm-desktop-more-tools]')).toBeVisible();
  // Advanced tools remain reachable through the existing modal: no cloned
  // button hierarchy or changed routing contract is added to the app shell.
  await nav.locator('button[data-mm-desktop-more-tools]').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal').getByRole('button',{name:'Standards & safety'})).toBeVisible();
  await page.locator('#modal').getByRole('button',{name:'Standards & safety'}).click();
  await expect(page.locator('#standards')).toBeVisible();
});

test('Book reading hides Mission Control strip without losing learner workspace',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const mission=page.locator('#mmMissionControl > .mm-mc-context');
  await expect(mission).toBeHidden();
  await page.evaluate(()=>switchView('scenarios'));
  await expect(mission).toBeVisible();
  await page.evaluate(()=>window.MMBook.open());
  await expect(page.locator('#mmBookView')).toBeVisible();
  await expect(mission).toBeHidden();
  await expect(page.locator('#pageSubtitle')).toBeHidden();
  // The mission's overlays and learner data are untouched; hiding the strip
  // is specific to the Book reading route, not a global app state change.
  await expect(page.locator('#mmMissionControl .mm-mc-palette-host')).toBeAttached();
  await page.locator('#nav').getByRole('button',{name:'Home'}).click();
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(mission).toBeHidden();
  await expect(page.locator('#pageSubtitle')).toBeVisible();
  await page.evaluate(()=>switchView('scenarios'));
  await expect(mission).toBeVisible();
});

test('Book opens as 20 plain chapters with previous/next and optional end matter',async({page})=>{
  await page.setViewportSize({width:1280,height:860});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MMBook?.openReaderChapter));
  await page.evaluate(()=>window.MMBook.openReaderChapter('r01'));
  const reader=page.locator('#mmBookView [data-mm-book-reader]');
  await expect(reader.locator('[data-mm-book-reader-chapter="r01"]')).toBeVisible();
  await expect(reader.locator('.mm-book-chapter-number')).toHaveText('Chapter 1');
  await expect(reader.locator('[data-mm-book-reader-module]').first()).toBeVisible();
  await expect(page.locator('#mmBookView [data-mm-book-hero]')).toBeHidden();
  await expect(page.locator('#mmBookView [data-mm-book-accuracy]')).toBeHidden();
  await expect(reader.locator('.mm-book-scope-note').first()).toBeVisible();
  // Technical review is not edited away or treated as a verified machine source.
  await expect(reader.locator('.mm-book-reader-notes')).not.toHaveAttribute('open');
  await expect(reader.locator('.mm-book-reader-study')).not.toHaveAttribute('open');
  await reader.locator('.mm-book-reader-notes > summary').click();
  await expect(reader.locator('.mm-book-inline-evidence').first()).toBeVisible();
  await expect(reader.locator('.mm-book-reader-references')).toBeVisible();
  await reader.locator('.mm-book-reader-guide > summary').click();
  await expect(reader.locator('.mm-book-reader-key-terms')).toBeVisible();
  await reader.locator('[data-mm-book-page-turn="r02"]').click();
  await expect(page.locator('#mmBookView')).toBeVisible();
  await expect(reader.locator('.mm-book-chapter-number')).toHaveText('Chapter 2');
  await reader.locator('[data-mm-book-page-turn="r01"]').click();
  await expect(reader.locator('.mm-book-chapter-number')).toHaveText('Chapter 1');
  await reader.locator('.mm-book-page-turn [data-mm-book-back]').click();
  await expect(page.locator('#mmBookView [data-mm-book-hero]')).toBeVisible();
  const contents=page.locator('#mmBookView [data-mm-book-contents]');
  await expect(contents.locator('.mm-book-toc > li > button[data-mm-book-reader-chapter-open]')).toHaveCount(20);
  await expect(contents.locator('.mm-book-toc > li').first()).toContainText('1.');
  await expect(contents.locator('.mm-book-contents-guide')).not.toHaveAttribute('open');
  await contents.locator('.mm-book-contents-guide > summary').click();
  await expect(contents.locator('.mm-book-term-guide > summary')).toBeVisible();
  await expect(contents.locator('.mm-book-governed-index [data-mm-book-chapter]')).toHaveCount(46);
});

test('phone Book is a simple contents page, original intro and sources preserved',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await page.evaluate(async()=>{window.MMBook.open();await window.MMBook.load();});
  const contents=page.locator('#mmBookView [data-mm-book-contents]');
  await expect(contents).toBeVisible();
  // Actual document order puts chapters ahead of optional publication utilities.
  expect(await page.locator('#mmBookView').evaluate(view=>Array.from(view.children).indexOf(view.querySelector('[data-mm-book-contents]'))<Array.from(view.children).indexOf(view.querySelector('[data-mm-book-hero]')))).toBe(true);
  const intro=page.locator('#mmBookView .mm-book-intro-details');
  await expect(intro).toHaveCount(1);
  await expect(intro).not.toHaveAttribute('open');
  const first=contents.locator('.mm-book-toc > li > button').first();
  await expect(first).toBeVisible();
  const firstTop=await first.evaluate(el=>el.getBoundingClientRect().top);
  const bar=await page.locator('.mobile-nav').boundingBox();
  expect(firstTop,'chapter 1 starts above fixed mobile navigation').toBeLessThan((bar?.y||730)-22);
  await intro.locator(':scope > summary').click();
  await expect(intro.locator('h2')).toContainText('Injection moulding');
  await expect(intro.locator('p')).toContainText('reference');
  await expect(page.locator('#mmBookView [data-mm-book-hero] [data-mm-book-mode="listen"]')).toBeVisible();
  await expect(page.locator('#mmBookView [data-mm-book-hero] .mm-book-governance > summary')).toBeVisible();
  await first.click();
  const reader=page.locator('#mmBookView [data-mm-book-reader]');
  await expect(reader.locator('.mm-book-chapter-number')).toHaveText('Chapter 1');
  await expect(reader.locator('.mm-book-reader-study')).not.toHaveAttribute('open');
  await expect(reader.locator('.mm-book-reader-notes')).not.toHaveAttribute('open');
  await expect(reader.locator('.mm-book-scope-note').first()).toBeVisible();
  await expect(reader.locator('[data-mm-book-page-turn="r02"]')).toBeAttached();
});

test('premium UI stylesheet is active on the primary learner shell',async({page})=>{
  await openApp(page);
  const premiumLink=page.locator('link[href*="premium-ui.css"]');
  await expect(premiumLink).toHaveCount(1);
  const shell=await page.locator('.sidebar').evaluate(el=>{
    const cs=getComputedStyle(el);
    return {border:cs.borderRightColor,background:cs.backgroundImage,shadow:cs.boxShadow};
  });
  expect(shell.background).toContain('linear-gradient');
  expect(shell.shadow).not.toBe('none');
  await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
  const focusCard=await page.locator('#dashboard .mm-today-focus').evaluate(el=>({
    radius:getComputedStyle(el).borderRadius,
    shadow:getComputedStyle(el).boxShadow,
    background:getComputedStyle(el).backgroundImage
  }));
  expect(parseFloat(focusCard.radius)).toBeGreaterThanOrEqual(18);
  expect(focusCard.shadow).not.toBe('none');
  expect(focusCard.background).toContain('linear-gradient');
});

test('premium UI has no horizontal overflow across primary responsive surfaces',async({page})=>{
  for(const width of [320,360]){
    await page.setViewportSize({width,height:800});
    await openApp(page);
    for(const [view,ready] of [
    ['dashboard','#dashboard'],['path','#path .mm-learn-hub'],['scenarios','#scenarios .mm-practice-hub'],['lesson','#lesson']
  ]){
    if(view==='lesson')await page.evaluate(()=>{goLesson(4);switchView('lesson')});
    else await page.evaluate(v=>switchView(v),view);
    await expect(page.locator(ready)).toBeVisible();
      await assertNoHorizontalOverflow(page,`${view}-${width}`);
    }
  }
});

test('premium controls retain professional touch and focus targets',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const navButtons=page.locator('.mobile-nav button:visible');
  const count=await navButtons.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for(let i=0;i<count;i++){
    const box=await navButtons.nth(i).boundingBox();
    expect(box?.height||0).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Tab');
  const focus=await page.evaluate(()=>{
    const el=document.activeElement;
    const cs=el?getComputedStyle(el):null;
    return {tag:el?.tagName||'',outline:cs?.outlineStyle||'none',width:parseFloat(cs?.outlineWidth||'0')||0};
  });
  expect(focus.tag).not.toBe('BODY');
  expect(focus.outline==='none'&&focus.width===0).toBeFalsy();
});

test('premium UI reduced motion contract remains calm',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  await expect(page.locator('#path .mm-all-lessons')).toBeVisible();
  const durations=await page.locator('#path .mm-catalog-lesson').first().evaluate(el=>({transition:getComputedStyle(el).transitionDuration,animation:getComputedStyle(el).animationDuration}));
  const parse=s=>String(s).split(',').map(v=>parseFloat(v)||0);
  expect(Math.max(...parse(durations.transition))).toBeLessThanOrEqual(.02);
  expect(Math.max(...parse(durations.animation))).toBeLessThanOrEqual(.02);
});

test('premium UI forced-colour-safe CSS remains present',async({page})=>{
  await openApp(page);
  const css=await page.evaluate(async()=>fetch('./premium-ui.css').then(r=>r.text()));
  expect(css).toContain('@media(forced-colors:active)');
  expect(css).toContain('background:Canvas!important');
});


test('forced colours are actually applied in Chromium',async({page,browserName})=>{
  test.skip(browserName!=='chromium','Forced-colours emulation is governed in Chromium; CSS presence remains cross-browser.');
  await page.emulateMedia({forcedColors:'active'});
  await openApp(page);
  const style=await page.locator('#dashboard .mm-today-focus').evaluate(el=>({shadow:getComputedStyle(el).boxShadow,border:getComputedStyle(el).borderTopStyle}));
  expect(style.shadow).toBe('none');
  expect(style.border).not.toBe('none');
});


test('assessment focus UI is responsive and hides inactive controls',async({page})=>{
  test.setTimeout(90000);
  for(const width of [320,360,390,412,1024]){
    await page.setViewportSize({width,height:width<500?844:900});
    await openApp(page);
    await page.evaluate(()=>startExam('Beginner'));
    await expect(page.locator('#examQuestions.mm-focus-mode')).toBeVisible();
    await expect(page.locator('#examQuestions .question.mm-current-question')).toHaveCount(1);
    await assertNoHorizontalOverflow(page,`assessment-${width}`);
    const steps=page.locator('.mm-exam-steps .mm-step');
    expect(await steps.count()).toBeGreaterThanOrEqual(10);
    const inactive=page.locator('#examQuestions .question:not(.mm-current-question)');
    expect(await inactive.count()).toBeGreaterThan(0);
    for(let i=0;i<await inactive.count();i++){
      await expect(inactive.nth(i)).toBeHidden();
      const radios=inactive.nth(i).locator('input[type=radio]');
      for(let j=0;j<await radios.count();j++)await expect(radios.nth(j)).not.toBeFocused();
    }
    const grade=page.locator('.mm-native-grade');
    await expect(grade).toBeDisabled();
  }
});

test('assessment keyboard navigation moves focus only into the active question',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>startExam('Beginner'));
  const next=page.locator('.mm-exam-next');
  await next.click();
  await expect(page.locator('.question.mm-current-question .mm-question-stem')).toBeFocused();
  const active=await page.evaluate(()=>({
    current:document.querySelector('.question.mm-current-question')?.getAttribute('aria-hidden'),
    hidden:[...document.querySelectorAll('#examQuestions .question:not(.mm-current-question)')].every(x=>x.getAttribute('aria-hidden')==='true'),
    hiddenChecked:[...document.querySelectorAll('#examQuestions .question:not(.mm-current-question) input[type=radio]')].some(x=>x===document.activeElement)
  }));
  expect(active.current).toBe('false');
  expect(active.hidden).toBe(true);
  expect(active.hiddenChecked).toBe(false);
});


test('product hierarchy keeps Home focused and Materials catalogue dense',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const focus=page.locator('#dashboard .mm-today-focus');
  const utilities=page.locator('#dashboard .mm-home-balance');
  await expect(focus).toBeVisible();
  await expect(utilities).toBeVisible();
  // learner-ui-polish.css is attached by its domain module. WebKit can expose the
  // adopted Home nodes before that stylesheet has finished attaching, so wait for
  // the canonical style owner rather than sampling the transient legacy card style.
  await page.waitForFunction(()=>{
    const link=document.querySelector('link[data-mm-learner-ui-polish]');
    const focus=document.querySelector('#dashboard .mm-today-focus');
    const utilities=document.querySelector('#dashboard .mm-home-balance');
    // A parsed WebKit stylesheet can precede the first computed-style update.
    // Wait for the required presentation, not only link.sheet availability.
    return Boolean(window.MM_LEARNER_UI_POLISH && link?.sheet && focus && utilities &&
      getComputedStyle(focus).boxShadow!=='none' &&
      getComputedStyle(utilities).boxShadow==='none');
  });
  const hierarchy=await page.evaluate(()=>({
    focusShadow:getComputedStyle(document.querySelector('#dashboard .mm-today-focus')).boxShadow,
    utilityShadow:getComputedStyle(document.querySelector('#dashboard .mm-home-balance')).boxShadow
  }));
  expect(hierarchy.focusShadow).not.toBe('none');
  expect(hierarchy.utilityShadow).toBe('none');

  await page.waitForFunction(()=>Boolean(window.MM_MATERIAL_REGISTRY?.openPage));
  await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.openPage({replaceUrl:false}));
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  const columns=await page.locator('#mmExactMaterialCatalog [data-mm-exact-results]').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBeGreaterThanOrEqual(3);
});

test('mobile shell uses floating thumb-friendly navigation without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const nav=page.locator('.mobile-nav');
  const box=await nav.boundingBox();
  expect(box?.width||0).toBeLessThan(390);
  expect(box?.x||0).toBeGreaterThan(0);
  await assertNoHorizontalOverflow(page,'floating-mobile-nav');
});


test('first-run setup is concise, keyboard reachable and touch sized',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const user={id:'first-run-premium',name:'Learner 1',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:false,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
  });
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&window.MM_LEARNER_UI_POLISH);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  const modal=page.locator('.mm-onboarding-product');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Three quick choices');
  await expect(modal.getByText('Experience',{exact:true})).toBeVisible();
  await expect(modal.getByText('Typical session',{exact:true})).toBeVisible();
  const controls=modal.locator('input,select,button');
  for(let i=0;i<await controls.count();i++){
    const box=await controls.nth(i).boundingBox();
    expect(box?.height||0).toBeGreaterThanOrEqual(44);
  }
  await modal.locator('#onName').focus();
  await expect(modal.locator('#onName')).toBeFocused();
});

test('Materials comparison guides valid choices before running evidence work',async({page})=>{
  await page.setViewportSize({width:1024,height:900});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_MATERIAL_REGISTRY?.openPage));
  await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.openPage({replaceUrl:false}));
  const a=page.locator('[data-mm-compare-a]'),b=page.locator('[data-mm-compare-b]');
  const run=page.locator('[data-mm-run-material-compare]');
  await expect(run).toBeDisabled();
  const options=await a.locator('option').evaluateAll(nodes=>nodes.map(x=>x.value).filter(Boolean));
  expect(options.length).toBeGreaterThanOrEqual(2);
  await a.selectOption(options[0]);
  await expect(run).toBeDisabled();
  await b.selectOption(options[1]);
  await expect(run).toBeEnabled();
  await run.click();
  await expect(page.locator('[data-mm-material-compare-result]')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('[data-mm-material-compare-result] .mm-material-compare-card')).toHaveCount(2);
});


test('390px Home keeps lesson, Book and specialist tools in canonical order',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const actions=page.locator('#dashboard .mm-home-balance-grid button');
  await expect(actions).toHaveCount(2);
  await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
  const book=page.locator('#dashboard [data-mm-home-book]');
  await expect(book).toBeVisible();
  await expect(book.getByRole('button',{name:/Open Book|Keep Reading/})).toBeVisible();
  const geometry=await page.evaluate(()=>{
    const focus=document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect();
    const book=document.querySelector('#dashboard [data-mm-home-book]').getBoundingClientRect();
    const tools=document.querySelector('#dashboard .mm-home-balance').getBoundingClientRect();
    const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
    return {focusBottom:focus.bottom,bookTop:book.top,bookBottom:book.bottom,toolsTop:tools.top,toolsBottom:tools.bottom,navTop:nav.top};
  });
  expect(geometry.bookTop).toBeGreaterThanOrEqual(geometry.focusBottom-1);
  expect(geometry.toolsTop).toBeGreaterThanOrEqual(geometry.bookBottom-1);
  expect(geometry.toolsBottom).toBeLessThanOrEqual(geometry.navTop+1);
  await expect(page.locator('#dashboard .mm-home-balance')).not.toContainText(/Materials|Practice|Saved lessons|Reference book/i);
  await assertNoHorizontalOverflow(page,'home-390-primary-actions');
});

test('mobile Materials keeps search controls sticky and touch sized',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_MATERIAL_REGISTRY?.openPage));
  await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.openPage({replaceUrl:false}));
  const filters=page.locator('#mmExactMaterialCatalog .mm-exact-search');
  await expect(filters).toBeVisible();
  const readFilterContract=()=>page.evaluate(()=>{
    const filters=document.querySelector('#mmExactMaterialCatalog .mm-exact-search');
    const query=document.querySelector('[data-mm-exact-query]');
    const manufacturer=document.querySelector('[data-mm-exact-manufacturer]');
    if(!filters||!query||!manufacturer||!filters.isConnected)return null;
    const style=getComputedStyle(filters),q=query.getBoundingClientRect(),m=manufacturer.getBoundingClientRect();
    return {position:style.position,top:Number.parseFloat(style.top),queryHeight:q.height,manufacturerHeight:m.height};
  });
  await expect.poll(readFilterContract).toEqual({
    position:'sticky',
    top:expect.any(Number),
    queryHeight:expect.any(Number),
    manufacturerHeight:expect.any(Number)
  });
  const hydrated=await readFilterContract();
  expect(hydrated?.top??-1).toBeGreaterThanOrEqual(0);
  expect(hydrated?.queryHeight??0).toBeGreaterThanOrEqual(44);
  expect(hydrated?.manufacturerHeight??0).toBeGreaterThanOrEqual(44);
  await page.locator('[data-mm-exact-results]').evaluate(el=>el.scrollIntoView({block:'end'}));
  await expect(filters).toBeVisible();
  await expect.poll(async()=> (await readFilterContract())?.position||'').toBe('sticky');
  await assertNoHorizontalOverflow(page,'materials-sticky-filters');
});

test('mobile evidence cards wrap long engineering metadata without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_ENGINEERING_STORE&&window.MM_MOULD_MASTER_WORKSPACE));
  await page.evaluate(async()=>{
    const store=window.MM_ENGINEERING_STORE;
    const token=store.learnerToken();
    const c=await store.saveCase({
      id:'qa-mobile-evidence-density',
      title:'Long evidence wrapping case',
      material:'PA66 GF30 very long commercial material identity for mobile wrapping',
      machine:'IMM-07',
      mould:'MOULD-184',
      evidence:'Measured evidence',
      controlledTest:'Controlled test',
      verification:'Verified',
      conclusion:'Conclusion'
    },{token});
    await store.saveCaseEvidence(c.id,{
      kind:'dimensional-check',
      title:'Cavity 3 critical dimension after controlled verification with long descriptive metadata',
      occurredAt:new Date().toISOString(),
      sourceRef:'QC-REPORT-184-03-LONG-REFERENCE',
      measurement:'25.004',
      unit:'mm',
      methodRef:'CMM measurement plan with long controlled inspection method reference',
      acceptanceStatus:'accepted',
      acceptanceBasis:'Approved drawing and QA disposition reference with long descriptive authority',
      result:'Dimension remained within the approved tolerance across the verification sample.'
    },token);
    await window.MM_MOULD_MASTER_WORKSPACE.hydrate({force:true});
    await window.MM_MOULD_MASTER_WORKSPACE.open(c.id);
  });
  const row=page.locator('#mmMouldMasterWorkspace .mw-evidence-row').first();
  await expect(row).toBeVisible();
  await assertNoHorizontalOverflow(page,'mould-master-evidence-390');
  const title=await row.locator(':scope > b').first().evaluate(el=>getComputedStyle(el).overflowWrap);
  expect(['anywhere','break-word']).toContain(title);
});


test('Spatial Twin opens as a responsive evidence-led moulding world',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_SPATIAL_TWIN?.open&&window.MM_VIRTUAL_APPRENTICESHIP?.cases?.length===6));
  await page.evaluate(()=>window.MM_SPATIAL_TWIN.open({caseIndex:1}));
  const twin=page.locator('#mmSpatialTwin');
  await expect(twin).toBeVisible();
  await expect(twin.locator('[data-mm-st-mode]')).toHaveCount(7);
  await expect(twin.locator('[data-mm-st-hotspot]')).toHaveCount(7);
  await expect(twin.locator('[data-mm-st-phase]')).toHaveCount(6);
  await expect(twin).toContainText('Explore the moulding system, not the menu');
  await expect(twin).toContainText('No machine control');

  await twin.locator('[data-mm-st-mode="pressure"]').click();
  await expect(twin.locator('.mm-st-shell')).toHaveAttribute('data-mode','pressure');
  await twin.locator('[data-mm-st-phase="2"]').click();
  await expect(twin.locator('.mm-st-shell')).toHaveAttribute('data-phase','fault');
  await twin.locator('[data-mm-st-hotspot="cavity4"]').click();
  await expect(twin.locator('[data-mm-st-inspector]')).toContainText('Cavity 4');
  await expect(twin.locator('[data-mm-st-inspector]')).toContainText('Evidence to seek');

  await page.setViewportSize({width:390,height:844});
  await expect(twin).toBeVisible();
  await assertNoHorizontalOverflow(page,'spatial-twin-390');
  const mobileWorld=await twin.locator('.mm-st-layout').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(mobileWorld).toBe(1);

  await twin.locator('[data-mm-st-close]').click();
  await expect(twin).toBeHidden();
  await expect(page.locator('#mmVirtualApprenticeship')).toBeVisible();
});

test('Mission Control persists context, evidence and command search across app surfaces',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_MISSION_CONTROL?.startMission&&window.MM_APP_SHELL));

  const mc=page.locator('#mmMissionControl');
  await expect(mc.locator('.mm-mc-context')).toBeHidden();
  await page.evaluate(()=>window.switchView('scenarios'));
  await expect(mc).toBeVisible();
  await page.evaluate(()=>window.MM_MISSION_CONTROL.startMission({
    title:'QA cavity-balance mission',
    kind:'qa',
    stage:'baseline',
    context:{machine:'IMM-07',mould:'MOULD-184',material:'PA66 GF30',part:'Housing A',caseId:'QA-MISSION-01'}
  }));
  await expect(mc).toContainText('QA cavity-balance mission');
  await expect(mc).toContainText('IMM-07');
  await expect(mc).toContainText('MOULD-184');
  await expect(mc).toContainText('PA66 GF30');
  await expect(mc.locator('[data-mm-mc-stage]')).toHaveCount(8);

  await page.evaluate(()=>window.MM_MISSION_CONTROL.addEvidence({kind:'measured',text:'Cavity 4 mass lower than peer cavities across repeat shots.'}));
  await mc.locator('[data-mm-mc-evidence]').click();
  await expect(mc.locator('.mm-mc-drawer')).toHaveClass(/open/);
  await expect(mc.locator('.mm-mc-evidence-row')).toContainText('Cavity 4 mass lower than peer cavities');
  await mc.locator('[data-mm-mc-drawer-close]').click();

  await page.keyboard.press('Control+K');
  await expect(mc.locator('.mm-mc-palette-host')).toHaveClass(/open/);
  const query=mc.locator('[data-mm-mc-query]');
  await query.fill('Spatial Twin');
  await expect(mc.locator('[data-mm-mc-command="spatial"]')).toContainText('Spatial Twin');
  await page.keyboard.press('Escape');

  await page.evaluate(()=>window.switchView('materials'));
  await expect(mc).toContainText('QA cavity-balance mission');
  await expect(mc).toContainText('PA66 GF30');
  await page.evaluate(()=>window.MM_MISSION_CONTROL.setMode('engineer'));
  await expect(page.locator('body')).toHaveAttribute('data-mm-mission-mode','engineer');

  await page.setViewportSize({width:390,height:844});
  await expect(mc).toBeVisible();
  await assertNoHorizontalOverflow(page,'mission-control-390');
  await expect(mc.locator('.mm-mc-timeline')).toBeVisible();
});



test('Mission Control persists context across the app and remains mobile-safe',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_MISSION_CONTROL?.startMission&&window.MM_APP_SHELL?.finalized));
  await expect(page.locator('#mmMissionControl .mm-mc-context')).toBeHidden();
  await page.evaluate(()=>window.switchView('scenarios'));
  await page.evaluate(()=>window.MM_MISSION_CONTROL.startMission({
    title:'QA connected moulding mission',
    kind:'investigation',
    stage:'baseline',
    context:{machine:'IMM-07',mould:'MOULD-184',material:'PA66 GF30',part:'Housing A',caseId:'QA-MC-01'}
  }));

  const mc=page.locator('#mmMissionControl');
  await expect(mc).toBeVisible();
  await expect(mc.locator('[data-mm-mc-stage]')).toHaveCount(8);
  await expect(mc).toContainText('QA connected moulding mission');
  await expect(mc).toContainText('IMM-07');
  await expect(mc).toContainText('MOULD-184');
  await expect(mc).toContainText('PA66 GF30');
  const insideMain=await mc.evaluate(el=>Boolean(el.closest('.main')));
  expect(insideMain).toBe(true);

  await page.evaluate(()=>window.MM_MISSION_CONTROL.addEvidence({kind:'measured',text:'Cavity 4 mass is 0.8% below the known-good baseline.'}));
  await mc.locator('[data-mm-mc-evidence]').click();
  await expect(mc.locator('.mm-mc-drawer')).toHaveClass(/open/);
  await expect(mc.locator('.mm-mc-evidence-row')).toContainText('Cavity 4 mass is 0.8% below the known-good baseline.');
  await mc.locator('[data-mm-mc-drawer-close]').click();

  await mc.locator('[data-mm-mc-palette]').click();
  const query=mc.locator('[data-mm-mc-query]');
  await query.fill('gate seal');
  await expect(mc.locator('[data-mm-mc-results]')).toContainText('Search learning for “gate seal”');
  await query.fill('Spatial Twin');
  await expect(mc.locator('[data-mm-mc-results]')).toContainText('Spatial Twin');
  await mc.locator('[data-mm-mc-palette-close]').first().click();

  await page.evaluate(()=>window.MM_MISSION_CONTROL.setMode('engineer'));
  await expect(page.locator('body')).toHaveAttribute('data-mm-mission-mode','engineer');
  await page.evaluate(()=>window.switchView('materials'));
  await expect(mc).toContainText('QA connected moulding mission');
  await expect(mc).toContainText('PA66 GF30');

  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MM_MISSION_CONTROL?.state));
  await page.evaluate(()=>window.switchView('dashboard'));
  await expect(page.locator('#mmMissionControl .mm-mc-context')).toBeHidden();
  await page.evaluate(()=>window.switchView('materials'));
  await expect(page.locator('#mmMissionControl')).toBeVisible();
  await expect(page.locator('#mmMissionControl')).toContainText('QA connected moulding mission');
  const persisted=await page.evaluate(()=>window.MM_MISSION_CONTROL.state());
  expect(persisted.mission?.context?.machine).toBe('IMM-07');
  expect(persisted.evidence?.length).toBeGreaterThanOrEqual(1);

  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#mmMissionControl')).toBeVisible();
  await assertNoHorizontalOverflow(page,'mission-control-390');
});
