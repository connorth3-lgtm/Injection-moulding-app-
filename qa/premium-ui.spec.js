const {test,expect}=require('@playwright/test');

function learner(id='premium-ui-qa'){
  return {id,name:'Premium UI QA',role:'learner',completed:[1,2,3],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-16T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
}

async function openApp(page){
  await page.addInitScript(({user})=>{
    localStorage.clear();
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
  },{user:learner()});
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&typeof window.switchView==='function');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

async function assertNoHorizontalOverflow(page,label){
  const dims=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(dims.scrollWidth,`${label}: no horizontal overflow`).toBeLessThanOrEqual(dims.clientWidth+1);
}

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
  await expect(page.locator('#path .mm-hub-tile').first()).toBeVisible();
  const durations=await page.locator('#path .mm-hub-tile').first().evaluate(el=>({transition:getComputedStyle(el).transitionDuration,animation:getComputedStyle(el).animationDuration}));
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
  await expect.poll(
    async()=>utilities.evaluate(el=>getComputedStyle(el).boxShadow),
    {timeout:10000,message:'Home utility card must settle to the governed subordinate no-shadow hierarchy'}
  ).toBe('none');
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
    await window.MM_MOULD_MASTER_WORKSPACE.open(c.id);
  });
  const row=page.locator('#mmMouldMasterWorkspace .mw-evidence-row').first();
  await expect(row).toBeVisible();
  await assertNoHorizontalOverflow(page,'mould-master-evidence-390');
  const title=await row.locator(':scope > b').first().evaluate(el=>getComputedStyle(el).overflowWrap);
  expect(['anywhere','break-word']).toContain(title);
});
