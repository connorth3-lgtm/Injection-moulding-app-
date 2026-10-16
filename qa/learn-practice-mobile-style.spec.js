const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'hub-style-qa',name:'Hub Style QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'hub-style-qa',users:{'hub-style-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&/^\d{4}\.\d{2}\.\d{2}\.\d+$/.test(window.MM_APP_SHELL_FINALIZED)&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

async function openHub(page,label,selector){
  await page.locator('.mobile-nav > button').filter({hasText:label}).click();
  await expect(page.locator(selector)).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function expectReadableTiles(page,rootSelector,expectedCount=5){
  const result=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const grid=root.querySelector('.mm-hub-grid');
    const tiles=[...root.querySelectorAll('.mm-hub-tile')];
    const first=tiles[0];
    const tile=getComputedStyle(first);
    const eyebrow=getComputedStyle(first.querySelector('.eyebrow'));
    const title=getComputedStyle(first.querySelector('b'));
    const copy=getComputedStyle(first.querySelector('small'));
    const action=getComputedStyle(first.querySelector('.mm-hub-tile-action'));
    const helper=root.querySelector('.mm-hub-section-head p');
    const boxes=tiles.map(x=>x.getBoundingClientRect());
    return {
      count:tiles.length,
      columns:new Set(tiles.map(x=>Math.round(x.getBoundingClientRect().left))).size,
      display:tile.display,
      direction:tile.flexDirection,
      align:tile.alignItems,
      textAlign:tile.textAlign,
      whiteSpace:tile.whiteSpace,
      background:tile.backgroundColor,
      eyebrowDisplay:eyebrow.display,
      titleDisplay:title.display,
      copyDisplay:copy.display,
      actionDisplay:action.display,
      helperDisplay:helper?getComputedStyle(helper).display:null,
      minHeight:Math.min(...boxes.map(x=>x.height)),
      maxHeight:Math.max(...boxes.map(x=>x.height)),
      maxWidth:Math.max(...boxes.map(x=>x.width)),
      minWidth:Math.min(...boxes.map(x=>x.width)),
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  },rootSelector);
  expect(result.count).toBe(expectedCount);
  // The illustrated task choices now occupy one scan-friendly mobile column
  // instead of 2 cramped text-only columns plus a duplicate Question Centre.
  expect(result.columns).toBe(1);
  expect(result.display).toBe('grid');
  expect(result.textAlign).toBe('left');
  expect(result.whiteSpace).toBe('normal');
  expect(result.background).not.toBe('rgb(128, 128, 128)');
  expect(result.titleDisplay).not.toBe('none');
  expect(result.copyDisplay).not.toBe('none');
  expect(result.minHeight).toBeGreaterThanOrEqual(90);
  expect(result.maxHeight).toBeLessThanOrEqual(280);
  expect(result.maxWidth-result.minWidth).toBeLessThan(2);
  expect(result.overlap).toBe(false);
}

async function expectNarrowReadableTiles(page,rootSelector,expectedCount=5){
  const result=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const grid=root.querySelector('.mm-hub-grid');
    const tiles=[...root.querySelectorAll('.mm-hub-tile')];
    const boxes=tiles.map(x=>x.getBoundingClientRect());
    const copies=tiles.map(x=>{
      const node=x.querySelector('small');
      const style=getComputedStyle(node);
      return {display:style.display,height:node.getBoundingClientRect().height,text:(node.textContent||'').trim()};
    });
    const minHeights=tiles.map(x=>getComputedStyle(x).minHeight);
    return {
      count:tiles.length,
      columns:new Set(tiles.map(x=>Math.round(x.getBoundingClientRect().left))).size,
      copies,
      minHeights,
      maxHeight:Math.max(...boxes.map(x=>x.height)),
      minHeight:Math.min(...boxes.map(x=>x.height)),
      overflowX:Math.max(0,root.scrollWidth-root.clientWidth),
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  },rootSelector);
  expect(result.count).toBe(expectedCount);
  expect(result.columns).toBe(1);
  expect(result.copies.every(x=>x.display!=='none'&&x.height>0&&x.text.length>12)).toBeTruthy();
  expect(result.minHeights.every(x=>parseFloat(x)>=90)).toBeTruthy();
  expect(result.minHeight).toBeGreaterThanOrEqual(90);
  expect(result.maxHeight).toBeLessThan(280);
  expect(result.overflowX).toBeLessThanOrEqual(1);
  expect(result.overlap).toBe(false);
}

async function expectUnifiedLessonCatalog(page){
  const root=page.locator('#path .mm-all-lessons');
  await expect(root).toBeVisible();
  await expect(root.locator('[data-mm-catalog-group]')).toHaveCount(22);
  await expect(root.locator('[data-mm-catalog-item]')).toHaveCount(176);
  const geometry=await page.evaluate(()=>{
    const root=document.querySelector('#path .mm-all-lessons');
    const rect=root.getBoundingClientRect();
    return {width:rect.width,viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewport+2);
  expect(geometry.overflow).toBeLessThanOrEqual(2);
}

async function expectFullWidthPrimaryAction(page,rootSelector){
  const geometry=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const card=root.querySelector('.mm-hub-continue');
    const button=root.querySelector('.mm-hub-continue-action');
    const cr=card.getBoundingClientRect(),br=button.getBoundingClientRect();
    const cs=getComputedStyle(card);
    const inner=cr.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-parseFloat(cs.borderLeftWidth)-parseFloat(cs.borderRightWidth);
    return {buttonWidth:br.width,innerWidth:inner};
  },rootSelector);
  expect(geometry.buttonWidth).toBeGreaterThan(300);
  expect(Math.abs(geometry.buttonWidth-geometry.innerWidth)).toBeLessThan(2);
}

async function openMaterials(page){
  await page.locator('.mobile-nav > button').filter({hasText:'Materials'}).click();
  await expect(page.locator('#materials')).toBeVisible();
  // Lesson navigation is in Learn; Materials keeps the searchable, source-backed catalogue.
  await expect(page.locator('#mmExactMaterialCatalog [data-mm-all-material-index]')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog [data-mm-all-material-query]')).toBeVisible();
  await expect(page.locator('#materials .mat-chapter')).toHaveCount(0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function expectMaterialDensity(page){
  const result=await page.evaluate(()=>{
    const root=document.getElementById('materials');
    const catalogue=root.querySelector('#mmExactMaterialCatalog [data-mm-all-material-index]');
    const search=catalogue?.querySelector('[data-mm-all-material-query]');
    // On the default Materials screen, families are the primary browse cards.
    // Search or opening a family restores full exact-grade detail cards.
    const cards=[...catalogue.querySelectorAll('[data-mm-family-open], [data-mm-material-index-result]')];
    const boxes=cards.slice(0,4).map(card=>card.getBoundingClientRect());
    const firstText=(cards[0]?.textContent||'').trim();
    const searchRect=search?.getBoundingClientRect();
    return {
      count:cards.length,
      searchHeight:searchRect?.height||0,
      searchWidth:searchRect?.width||0,
      firstTextLength:firstText.length,
      overflowX:Math.max(0,root.scrollWidth-root.clientWidth),
      scrollTop:window.scrollY||document.scrollingElement?.scrollTop||0,
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  });
  expect(result.count).toBeGreaterThanOrEqual(4);
  expect(result.searchHeight).toBeGreaterThanOrEqual(36);
  expect(result.searchWidth).toBeGreaterThan(150);
  expect(result.firstTextLength).toBeGreaterThan(30);
  expect(result.overflowX).toBeLessThanOrEqual(1);
  expect(result.scrollTop).toBeLessThanOrEqual(1);
  expect(result.overlap).toBe(false);
}

test.use({viewport:{width:412,height:915}});

test('Learn hub shows the unified compact lesson catalogue under strict CSP',async({page})=>{
  await openApp(page);
  await openHub(page,'Learn','#path .mm-learn-hub');
  await expectUnifiedLessonCatalog(page);
  await expectFullWidthPrimaryAction(page,'#path .mm-learn-hub');
  await page.screenshot({path:'qa-artifacts/mobile-learn-hub-412x915.png',fullPage:true});
});

test('Practice hub keeps compact left-aligned mobile cards under strict CSP',async({page})=>{
  await openApp(page);
  await openHub(page,'Practice','#scenarios .mm-practice-hub');
  await expectReadableTiles(page,'#scenarios .mm-practice-hub');
  await expectFullWidthPrimaryAction(page,'#scenarios .mm-practice-hub');
  await page.screenshot({path:'qa-artifacts/mobile-practice-hub-412x915.png',fullPage:true});
});

test('Materials catalogue remains readable and enters at the top on 412px phones',async({page})=>{
  await openApp(page);
  await openMaterials(page);
  await expectMaterialDensity(page);
  await page.screenshot({path:'qa-artifacts/mobile-materials-412x915.png'});
});

test.describe('360px narrow-phone hubs',()=>{
  test.use({viewport:{width:360,height:800}});

  test('Learn catalogue and Practice cards fit on a narrow phone',async({page})=>{
    await openApp(page);
    await openHub(page,'Learn','#path .mm-learn-hub');
    await expectUnifiedLessonCatalog(page);

    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await expectNarrowReadableTiles(page,'#scenarios .mm-practice-hub');
    await page.screenshot({path:'qa-artifacts/mobile-practice-hub-360x800.png',fullPage:true});
  });

  test('primary tab navigation settles at the top instead of preserving a clipped hub position',async({page})=>{
    await openApp(page);
    await openHub(page,'Materials','#materials');
    await page.evaluate(()=>window.scrollTo(0,document.scrollingElement?.scrollHeight||document.body.scrollHeight));
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0)).toBeGreaterThan(20);
    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0),{timeout:2500}).toBeLessThanOrEqual(1);
  });

  test('Materials catalogue keeps readable results, search tap targets and stable view-entry position',async({page})=>{
    await openApp(page);
    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await page.evaluate(()=>window.scrollTo(0,document.scrollingElement?.scrollHeight||document.body.scrollHeight));
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0)).toBeGreaterThan(20);
    await openMaterials(page);
    await expectMaterialDensity(page);
    await page.screenshot({path:'qa-artifacts/mobile-materials-360x800.png'});
  });
});

test('Unified diagnostic evidence controls remain single-column and readable at 360px',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  await page.locator('#scenarios [data-mm-hub-action="troubleshooting"]').click();
  const picker=page.locator('#modal:not(.hidden) .mm-hub-picker-grid');
  await expect(picker.locator('button')).toHaveCount(3);
  await picker.locator('[data-mm-hub-action="diagnostic-workbench"]').click();
  const root=page.locator('#defects');
  await root.locator('[data-mm-dx-action="choose"]').first().click();
  const labels=root.locator('.mm-dx-check');
  await expect(labels).toHaveCount(6);
  await expect(labels.first().locator('input[type="checkbox"]')).toBeVisible();
  const measure=await page.evaluate(()=>{
    const root=document.getElementById('defects');
    const evidence=root.querySelector('.mm-dx-evidence');
    const labels=[...root.querySelectorAll('.mm-dx-check')];
    const entries=labels.map(label=>{
      const input=label.querySelector('input');
      const span=label.querySelector('span');
      const l=label.getBoundingClientRect(),c=input.getBoundingClientRect(),t=span.getBoundingClientRect();
      return {inputWidth:c.width,inputHeight:c.height,
        labelLeft:l.left,labelRight:l.right,
        checkboxLeft:c.left,checkboxRight:c.right,
        textLeft:t.left,textRight:t.right,
        textHeight:t.height,textWidth:t.width};
    });
    const e=evidence.getBoundingClientRect();
    return {scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      evidenceLeft:e.left,evidenceRight:e.right,entries};
  });
  expect(measure.scrollWidth-measure.clientWidth).toBeLessThanOrEqual(2);
  expect(measure.evidenceRight).toBeLessThanOrEqual(362);
  expect(measure.evidenceLeft).toBeGreaterThanOrEqual(-2);
  for(const entry of measure.entries){
    expect(entry.inputWidth).toBeGreaterThanOrEqual(17);
    expect(entry.inputWidth).toBeLessThanOrEqual(22);
    expect(entry.inputHeight).toBeLessThanOrEqual(22);
    expect(entry.checkboxRight).toBeLessThan(entry.textLeft);
    expect(entry.checkboxLeft).toBeGreaterThanOrEqual(-1);
    expect(entry.textLeft).toBeGreaterThan(entry.checkboxLeft+16);
    expect(entry.textRight).toBeLessThanOrEqual(entry.labelRight+2);
    expect(entry.textWidth).toBeGreaterThan(100);
    expect(entry.textHeight).toBeGreaterThan(10);
  }
  await labels.nth(1).locator('input').check();
  await expect(labels.nth(1).locator('input')).toBeChecked();
  const reported=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(reported.evidenceReportedAvailable).toContain('pressure');
});

test('Core dashboard survives a clobbered legacy currentLesson name without resetting learner state',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const result=await page.evaluate(()=>{
    const original=window.currentLesson;
    const stored=localStorage.getItem('mouldmasterProDB');
    if(typeof original!=='function')throw new Error('core lesson resolver did not initialise');
    try{
      window.currentLesson={invalid:true};
      if(typeof window.currentLesson==='function')throw new Error('collision setup did not take effect');
      // Invoke the original learner renderer; app shell may wrap this function.
      renderDashboard();
      const legacy=typeof window.currentLesson;
      const home=!!document.querySelector('#dashboard')?.children?.length;
      return {legacy,home,storageUnchanged:localStorage.getItem('mouldmasterProDB')===stored};
    }finally{window.currentLesson=original;}
  });
  expect(result.home).toBe(true);
  expect(result.legacy).toBe('object');
  expect(result.storageUnchanged).toBe(true);
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
});

for(const width of [360,412]){
 test('Learn studio owns Arena, all five real question modes and 32 deep answer checks at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  const learn=page.locator('#path .mm-learn-hub');
  await expect(learn.locator('#mmLearnArena')).toBeVisible();
  await expect(learn.locator('#mmLearnQuestions .mm-hub-picker-grid > button')).toHaveCount(5);
  await expect(learn.locator('#mmLearnQuestions')).toContainText('169 governed prompts');
  const combined=learn.locator('.mm-learn-master-lesson');
  await expect(combined).toHaveCount(1);
  await expect(combined.locator(':scope > .mm-learn-studio > .mm-learn-step')).toHaveCount(2);
  await expect(combined.locator(':scope > .mm-learn-step')).toHaveCount(1);
  await expect(combined).toContainText('One lesson, five ways to think');
  await expect(combined).toContainText('3 connected stages');
  await expect(combined).toContainText('32 unscored explanations');
  const palette=await learn.locator('#mmLearnQuestions .mm-hub-picker-grid > button').evaluateAll(nodes=>nodes.map(button=>({background:getComputedStyle(button).backgroundColor,title:getComputedStyle(button.querySelector('b')).color,copy:getComputedStyle(button.querySelector('small')).color}))); 
  expect(palette).toHaveLength(5);
  expect(palette.every(row=>row.background==='rgba(0, 0, 0, 0)'||row.background.startsWith('rgb(')&&!row.background.includes('237, 247, 250'))).toBe(true);
  expect(palette.every(row=>row.title!=='rgb(16, 50, 71)')).toBe(true);
  await expect(learn.locator('#mmLearnReasoning .mm-learn-reasoning-item')).toHaveCount(32);
  await expect(learn.locator('#mmLearnReasoning .mm-learn-reasoning-chapter')).toHaveCount(8);
  await expect(learn.locator('#mmLearnReasoning')).toContainText('32 optional learning checks');
  const chapterCounts=await learn.locator('#mmLearnReasoning .mm-learn-reasoning-chapter').evaluateAll(nodes=>nodes.map(node=>node.querySelectorAll('details.mm-learn-reasoning-item').length));
  expect(chapterCounts).toEqual([4,4,4,4,4,4,4,4]);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-group]')).toHaveCount(22);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-item]')).toHaveCount(176);
  const reasoningChapters=learn.locator('#mmLearnReasoning details.mm-learn-reasoning-chapter');
  await expect(reasoningChapters).toHaveCount(8);
  for(const chapter of await reasoningChapters.all())await expect(chapter).not.toHaveAttribute('open','');
  const compactList=await learn.locator('#mmLearnReasoning .mm-learn-reasoning-list').evaluate(node=>node.getBoundingClientRect().height);
  expect(compactList).toBeLessThan(1000);
  await reasoningChapters.first().locator(':scope > summary').click();
  await expect(reasoningChapters.first()).toHaveAttribute('open','');
  const first=reasoningChapters.first().locator('.mm-learn-reasoning-item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open','');
  await expect(first).toContainText('Suggested answer');
  await expect(first).toContainText('Why that is plausible');
  await expect(first).toContainText('Evidence to verify');
  await expect(first).toContainText('Common mistake to avoid');
  const checks=await page.evaluate(()=>({total:window.MM_QUESTION_CENTRE.counts().total,scroll:document.documentElement.scrollWidth-innerWidth}));
  expect(checks.total).toBe(169);
  expect(checks.scroll).toBeLessThanOrEqual(2);
  await page.evaluate(()=>window.MM_PRIMARY_HUBS.renderLearnHub());
  await expect(page.locator('#path #mmLearnQuestions')).toHaveCount(1);
  await expect(page.locator('#path #mmLearnArena')).toHaveCount(1);
 });
}
test('Android Learn disclosures shorten the long reading path without trapping lessons below the five-tab bar',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await openHub(page,'Learn','#path .mm-learn-hub');
 const chapters=page.locator('#path #mmLearnReasoning details.mm-learn-reasoning-chapter');
 await expect(chapters).toHaveCount(8);
 await expect(page.locator('#path #mmLearnReasoning details.mm-learn-reasoning-item')).toHaveCount(32);
 expect(await chapters.evaluateAll(nodes=>nodes.every(node=>!node.open))).toBe(true);
 const initialHeight=await page.locator('#path #mmLearnReasoning .mm-learn-reasoning-list').evaluate(node=>node.getBoundingClientRect().height);
 await chapters.nth(6).locator(':scope > summary').click();
 await expect(chapters.nth(6).locator('details.mm-learn-reasoning-item').first().locator('summary')).toBeVisible();
 const expandedHeight=await page.locator('#path #mmLearnReasoning .mm-learn-reasoning-list').evaluate(node=>node.getBoundingClientRect().height);
 expect(expandedHeight).toBeGreaterThan(initialHeight+220);
 await chapters.nth(6).locator(':scope > summary').click();
 await expect(chapters.nth(6)).not.toHaveAttribute('open','');
 const footer=page.locator('#path .mm-catalog-extra [data-mm-hub-action="learn-resources"]');
 await footer.scrollIntoViewIfNeeded();
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 const safe=await page.evaluate(()=>{
   const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
   const footer=document.querySelector('#path .mm-catalog-extra button').getBoundingClientRect();
   const screen=getComputedStyle(document.body,'::after');
   return {navTop:nav.top,footerBottom:footer.bottom,scrimHeight:parseFloat(screen.height),scrimEvents:screen.pointerEvents,overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(safe.footerBottom).toBeLessThanOrEqual(safe.navTop+2);
 expect(safe.scrimHeight).toBeGreaterThan(70);
 expect(safe.scrimEvents).toBe('none');
 expect(safe.overflow).toBeLessThanOrEqual(2);
 expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
});

test('Learn Arena boss round keeps source-owned feedback and the scenario return goes back to Learn',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await page.evaluate(()=>switchView('path'));
 await page.locator('#path [data-mm-hub-action="boss-round"]').click();
 const boss=page.locator('#modal:not(.hidden)');
 await expect(boss).toContainText('Boss round');
 await expect(boss.locator('button.choice').first()).toBeVisible();
 await boss.locator('button.choice').first().click();
 await expect(boss.locator('#bossFeedback')).toBeVisible();
 await page.keyboard.press('Escape');
 await page.evaluate(()=>window.closeModal?.());
 await page.locator('#path [data-mm-hub-action="learn-scenarios"]').click();
 await expect(page.locator('#scenarios .scenario')).toHaveCount(40);
 await page.locator('#scenarios .mm-hub-detail-back button').click();
 await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
 await expect(page.locator('#path [data-mm-hub-action="learn-scenarios"]')).toBeFocused();
});
test('Learn Question Centre lanes invoke canonical assessments and preserve scoped counts',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await page.evaluate(()=>switchView('path'));
 await page.locator('#path #mmLearnQuestions [data-mm-hub-action="assessments"]').click();
 await expect(page.locator('#exams')).toBeVisible();
 await expect(page.locator('#exams')).toContainText(/knowledge/i);
 const learnReturn=page.locator('#exams .mm-practice-tool-return .mm-practice-tool-back');
 await expect(learnReturn).toHaveText('← Back to Learn');
 await learnReturn.click();
 await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
 await expect(page.locator('#path #mmLearnQuestions [data-mm-hub-action="assessments"]')).toBeFocused();
 await page.locator('#path #mmLearnQuestions [data-mm-hub-action="scenario-detail"]').click();
 await expect(page.locator('#scenarios .scenario')).toHaveCount(40);
 await page.locator('#scenarios .mm-hub-detail-back button').click();
 await expect(page.locator('#path #mmLearnQuestions')).toBeVisible();
});

test('Learn deep reasoning contains 32 distinct, unscored evidence-and-caveat checks without altering canonical assessment counts',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  const answers=page.locator('#path #mmLearnReasoning');
  const records=await answers.locator('details.mm-learn-reasoning-item').evaluateAll(nodes=>nodes.map(node=>({
    title:node.querySelector('summary strong')?.textContent||'',
    reference:node.querySelector('.mm-learn-reasoning-topic')?.textContent||'',
    explanations:[...node.querySelectorAll('.mm-learn-reasoning-answer p')].map(p=>p.textContent||'')
  })));
  expect(records).toHaveLength(32);
  expect(new Set(records.map(item=>item.reference)).size).toBe(32);
  expect(new Set(records.map(item=>item.title)).size).toBe(32);
  for(const row of records){
    expect(row.title.length).toBeGreaterThan(35);
    expect(row.explanations).toHaveLength(4);
    expect(row.explanations.every(x=>x.length>=50)).toBe(true);
  }
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts())).toEqual({formal:57,scenarios:40,diagnostic:36,materials:24,measured:12,total:169});
  const lastChapter=answers.locator('details.mm-learn-reasoning-chapter').last();
  await expect(lastChapter).not.toHaveAttribute('open','');
  await lastChapter.locator(':scope > summary').click();
  const final=lastChapter.locator('details.mm-learn-reasoning-item').last();
  await final.locator('summary').click();
  await expect(final).toHaveAttribute('open','');
  await expect(final).toContainText('Common mistake to avoid');
});

test('Practice connects the existing troubleshooting tools in one three-stage learning path',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  const root=page.locator('#scenarios .mm-practice-hub');
  const steps=root.locator('.mm-practice-diagnose-stages > div');
  await expect(steps).toHaveCount(3);
  await expect(root.locator('.mm-hub-section:not([aria-label="More recommended practice"]) .mm-hub-grid > button')).toHaveCount(5);
  await expect(steps.first()).toContainText('Observe');
  await expect(steps.last()).toContainText('Verify');
  await root.locator('[data-mm-hub-action="troubleshooting"]').click();
  const modal=page.locator('#modal:not(.hidden) .mm-diagnose-chooser');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.mm-diagnose-step-strip > span')).toHaveCount(3);
  await expect(modal.locator('.mm-hub-picker-grid > button')).toHaveCount(3);
  await expect(modal).toContainText('isolation');
});

test('Materials links native lesson, lab and source-backed grade modes without copying grade records',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('materials'));
  const journey=page.locator('#materials .mm-material-journey');
  await expect(journey).toBeVisible();
  await expect(journey.locator('[data-mm-material-journey]')).toHaveCount(3);
  const guide=journey.locator('.mm-material-journey-reasoning');
  await guide.locator(':scope > summary').click();
  await expect(guide.locator('.mm-material-journey-questions > details')).toHaveCount(5);
  await guide.locator('.mm-material-journey-questions > details').first().locator('summary').click();
  await expect(guide).toContainText('Dryer displays alone');
  await expect(page.locator('#materials [data-mm-all-material-index]')).toHaveCount(1);
  await journey.locator('[data-mm-material-journey="lessons"]').click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await expect(page.locator('#path [data-mm-lesson-catalog]')).toBeVisible();
  await page.evaluate(()=>switchView('materials'));
  await expect(page.locator('#materials .mm-material-journey')).toHaveCount(1);
});

test('Learning Resources consolidates four source-owned destinations without creating an assessment clone',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  await page.locator('#path [data-mm-hub-action="learn-resources"]').click();
  const modal=page.locator('#modal:not(.hidden) .mm-learning-resource-chooser');
  await expect(modal).toBeVisible();
  const controls=modal.locator('.mm-hub-picker-grid > button');
  await expect(controls).toHaveCount(4);
  for(const action of ['visuals','glossary','book','materials'])await expect(modal.locator('.mm-hub-picker-grid > button[data-mm-hub-action="'+action+'"]')).toHaveCount(1);
  const before=await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total);
  expect(before).toBe(169);
  await modal.locator('[data-mm-hub-action="glossary"]').click();
  await expect(page.locator('#glossary')).toBeVisible();
});

test('Safety teaching and the four-checkpoint capstone remain unscored and have no machine controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  const master=page.locator('#path .mm-learn-master-lesson');
  const safety=master.locator('.mm-learn-reasoning-chapter').nth(6);
  const validation=master.locator('.mm-learn-reasoning-chapter').nth(7);
  await expect(safety).toContainText('Recognise hazards');
  await expect(validation).toContainText('defensible evidence');
  await expect(safety.locator('details.mm-learn-reasoning-item')).toHaveCount(4);
  const capstone=master.locator('#mmLearnCapstone');
  await expect(capstone).toBeVisible();
  await expect(capstone.locator('.mm-learn-capstone-steps > details')).toHaveCount(4);
  await capstone.locator('.mm-learn-capstone-steps > details').first().locator('summary').click();
  await expect(capstone).toContainText('known-good baseline');
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
});

test('all canonical interior routes receive the shared responsive visual skin without duplicate UI controls',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  // The reference decoration runs on the next animation frame after shell load.
  // Wait for its real root marker instead of accepting an unfinished render.
  await page.waitForFunction(()=>document.getElementById('lesson')?.classList.contains('mm-reference-subtab'));
  const result=await page.evaluate(()=>({
    states:['lesson','glossary','visuals','simulator','defects','coach','standards','certificates','profile','instructor','exams','diagnosticLabs','materialLabs','processDataLabs','mmVirtualApprenticeship','mmSpatialTwin','mmMaterialCompare','mmMaterialChange','mmBookView']
      .map(id=>({id,exists:!!document.getElementById(id),skinned:document.getElementById(id)?.classList.contains('mm-reference-subtab')||false})),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  expect(result.states.filter(x=>x.exists).length).toBeGreaterThanOrEqual(10);
  expect(result.states.filter(x=>x.exists&& !x.skinned)).toEqual([]);
  expect(result.overflow).toBeLessThanOrEqual(2);
  await page.evaluate(()=>switchView('exams'));
  const exam=page.locator('#exams');
  await expect(exam).toBeVisible();
  await expect(exam.locator('.mm-practice-tool-return')).toHaveCount(1);
  await page.evaluate(()=>switchView('path'));
  await page.evaluate(()=>switchView('exams'));
  await expect(exam.locator('.mm-practice-tool-return')).toHaveCount(1);
});

test('Materials guided learning does not precede or replace the required exact-grade catalogue',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.evaluate(()=>switchView('materials'));
  const index=page.locator('#mmExactMaterialCatalog');
  await expect(index.locator('[data-mm-all-material-index]')).toBeVisible();
  // The reference guide is mounted on a later animation frame in WebKit.
  // Require the actual page state before testing the deterministic first-child contract.
  await expect(index.locator(':scope > .mm-material-journey')).toHaveCount(1);
  const structure=await index.evaluate(root=>({
    firstIsIndex:root.firstElementChild?.hasAttribute('data-mm-all-material-index')===true,
    guideCount:root.querySelectorAll(':scope > .mm-material-journey').length,
    indexCount:root.querySelectorAll(':scope > [data-mm-all-material-index]').length
  }));
  expect(structure).toEqual({firstIsIndex:true,guideCount:1,indexCount:1});
  await page.evaluate(()=>switchView('path'));
  await page.evaluate(()=>switchView('materials'));
  await expect(index.locator(':scope > .mm-material-journey')).toHaveCount(1);
  await expect(index.locator(':scope > [data-mm-all-material-index]')).toHaveCount(1);
  await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
});

test('mobile Practice source-owned choices occupy one readable column at 360 and 412 pixels',async({page})=>{
  await openApp(page);
  for(const width of [360,412]){
    await page.setViewportSize({width,height:850});
    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
    const metrics=await page.locator('#scenarios .mm-practice-hub .mm-hub-section:not([aria-label="More recommended practice"]) .mm-hub-grid').first().evaluate(root=>{
      const tiles=[...root.querySelectorAll(':scope > button.mm-hub-tile')];
      return {columns:new Set(tiles.map(x=>Math.round(x.getBoundingClientRect().left))).size,
        cards:tiles.length,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    expect(metrics.cards).toBe(5);
    expect(metrics.columns).toBe(1);
    expect(metrics.overflow).toBeLessThanOrEqual(2);
  }
});

test('Practice adds five unscored worked fault reviews with mechanisms, verification and original-tool launches',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  const cases=page.locator('#scenarios #mmPracticeCases .mm-practice-case');
  await expect(cases).toHaveCount(5);
  await expect(page.locator('#scenarios #mmPracticeCases')).toContainText('not five more governed scenarios');
  await cases.first().locator('summary').click();
  await expect(cases.first()).toHaveAttribute('open','');
  for(const label of ['Observe the evidence','Compare plausible causes','Verify safely','Common mistake to avoid'])
    await expect(cases.first()).toContainText(label);
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
  await cases.first().locator('[data-mm-hub-action="diagnostic-workbench"]').click();
  await expect(page.locator('#defects')).toBeVisible();
});
test('Resources to Materials closes the chooser and leaves source-backed grade search usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  await page.locator('#path [data-mm-hub-action="learn-resources"]').click();
  await expect(page.locator('#modal:not(.hidden) .mm-learning-resource-chooser')).toBeVisible();
  await page.locator('#modal .mm-learning-resource-chooser [data-mm-hub-action="materials"]').click();
  await expect(page.locator('#modal')).toHaveClass(/hidden/);
  await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog').locator(':scope > [data-mm-all-material-index]')).toHaveCount(1);
});
test('Practice scenario review back restores accessible keyboard focus on its entry action',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  await page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="scenario-detail"]').click();
  await expect(page.locator('#scenarios .mm-hub-detail-back')).toBeVisible();
  await page.locator('#scenarios .mm-hub-detail-back button').click();
  await expect(page.locator('#scenarios .mm-practice-hub [data-mm-hub-action="scenario-detail"]')).toBeFocused();
});


for(const width of [360,412]){
  test('five-stage guided Practice supports evidence choices and remains mobile-readable at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:865});
    await openApp(page);
    await page.evaluate(()=>switchView('scenarios'));
    const root=page.locator('#scenarios #mmPracticeGuided');
    await expect(root).toBeVisible();
    await expect(root.locator('.mm-practice-guided-selector button')).toHaveCount(5);
    await expect(root.locator('.mm-practice-guided-progress > li')).toHaveCount(5);
    await expect(root.locator('.mm-practice-guided-context')).toContainText('Step 1 of 5');
    await expect(root.locator('[data-mm-guided-next]')).toBeDisabled();
    await root.locator('[data-mm-guided-choice="0"]').click();
    await expect(root.locator('.mm-practice-guided-feedback')).toContainText('stronger evidence-led choice');
    await expect(root.locator('.mm-practice-guided-feedback')).toContainText('Stronger response:');
    await root.locator('[data-mm-guided-choice="1"]').click();
    await expect(root.locator('.mm-practice-guided-feedback')).toContainText('Evidence-led choice');
    await expect(root.locator('[data-mm-guided-choice="1"]')).toHaveAttribute('aria-pressed','true');
    for(let i=1;i<5;i++){
      await root.locator('[data-mm-guided-next]').click();
      await expect(root.locator('.mm-practice-guided-context')).toContainText('Step '+(i+1)+' of 5');
      await expect(root.locator('.mm-practice-guided-context h3')).toBeFocused();
      if(i===3)await expect(root).toContainText('Hypothetical training evidence:');
      await root.locator('[data-mm-guided-choice="'+((i+1)%3)+'"]').click();
      await expect(root.locator('.mm-practice-guided-feedback')).toContainText('Evidence-led choice');
    }
    await expect(root.locator('.mm-practice-guided-finish')).toContainText('All five decisions reviewed');
    await expect(root.locator('.mm-practice-guided-finish')).toContainText('not a competency result');
    expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
    const sizes=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      width:window.innerWidth,
      btn:document.querySelector('#mmPracticeGuided [data-mm-guided-tool]')?.getBoundingClientRect().height
    }));
    expect(sizes.overflow).toBeLessThanOrEqual(2);
    expect(sizes.btn).toBeGreaterThanOrEqual(44);
    await root.locator('[data-mm-guided-tool]').click();
    await expect(page.locator('#defects')).toBeVisible();
  });
}
test('guided Practice preserves previous-step review and changing case resets hypothetical evidence',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  const root=page.locator('#scenarios #mmPracticeGuided');
  await root.locator('[data-mm-guided-case="PC-04"]').click();
  await expect(root.locator('.mm-practice-guided-context')).toContainText('Case PC-04');
  await expect(root.locator('[data-mm-guided-case="PC-04"]')).toHaveAttribute('aria-pressed','true');
  await root.locator('[data-mm-guided-choice="1"]').click();
  await root.locator('[data-mm-guided-next]').click();
  await root.locator('[data-mm-guided-prev]').click();
  await expect(root.locator('[data-mm-guided-choice="1"]')).toHaveAttribute('aria-pressed','true');
  await expect(root.locator('.mm-practice-guided-feedback')).toBeVisible();
  const workedCase=page.locator('#scenarios .mm-practice-case').last();
  await workedCase.locator(':scope > summary').click();
  await expect(workedCase).toHaveAttribute('open','');
  await workedCase.locator('[data-mm-guided-case]').click();
  await expect(root.locator('.mm-practice-guided-context')).toContainText('Case PC-05');
  await expect(root.locator('.mm-practice-guided-context')).toContainText('Step 1 of 5');
  await expect(root.locator('[data-mm-guided-next]')).toBeDisabled();
  await expect(root).toContainText('hot-runner');
  await expect(page.locator('#scenarios .mm-practice-case')).toHaveCount(5);
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
});


test('More subtab interior links and buttons use the approved blue learning palette',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();
  const more=page.locator('#modal:not(.hidden) .mm-reference-more-card');
  await expect(more).toHaveCount(6);
  const expanded=page.locator('#modal .mm-reference-more-card[data-mm-more-section="learning"]');
  // The source-owned More menu can restore the open state. Expand only if closed.
  if(!(await expanded.evaluate(el=>el.open)))await expanded.locator(':scope > summary').click();
  const tiles=page.locator('#modal .mm-reference-more-card .mm-more-disclosure-items > .quick-action:visible');
  await expect(tiles.first()).toBeVisible();
  const results=await tiles.evaluateAll(els=>els.map(el=>({
    background:getComputedStyle(el).backgroundImage,
    color:getComputedStyle(el).color,
    minHeight:el.getBoundingClientRect().height
  })));
  expect(results.length).toBeGreaterThan(1);
  expect(results.every(v=>v.background.includes('linear-gradient'))).toBe(true);
  expect(results.every(v=>v.color==='rgb(239, 250, 255)')).toBe(true);
  expect(results.every(v=>v.minHeight>=44)).toBe(true);
});


test('Android More groups are compact until explicitly opened; links stay reachable',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();
  const items=page.locator('#modal:not(.hidden) .mm-more-disclosure');
  await expect(items).toHaveCount(6);
  await expect.poll(()=>items.evaluateAll(nodes=>nodes.map(n=>n.open))).toEqual([false,false,false,false,false,false]);
  const resources=page.locator('#modal .mm-more-disclosure[data-mm-more-section="learning"]');
  await resources.locator(':scope > summary').click();
  await expect(resources).toHaveAttribute('open','');
  await expect(resources.locator('[data-mm-learning-resource-shortcut]')).toBeVisible();
  const compact=await page.locator('#modal .mm-reference-more-card > summary').first().evaluate(el=>({
    height:el.getBoundingClientRect().height,
    icon:getComputedStyle(el,'::before').display,
  }));
  expect(compact.height).toBeLessThan(110);
  expect(compact.icon).toBe('none');
  await resources.locator(':scope > summary').click();
  await expect(resources).not.toHaveAttribute('open','');
  const support=page.locator('#modal .mm-reference-more-extra').first();
  await support.locator(':scope > summary').click();
  await expect(support.locator('a')).toBeVisible();
  await expect(support.locator('a')).toHaveAttribute('href','./support.html');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});
test('small Android Practice stages scroll horizontally with legible full labels and original questions',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  const guided=page.locator('#scenarios #mmPracticeGuided');
  await expect(guided).toBeVisible();
  const progress=guided.locator('.mm-practice-guided-progress');
  await expect(progress).toBeVisible();
  await expect(progress.locator(':scope > li')).toHaveCount(5);
  // WebKit can still be finishing its deferred route render after the
  // children enter the DOM. Geometry is meaningful only once laid out.
  await expect.poll(()=>progress.evaluate(el=>({
    visible:el.getClientRects().length>0,
    client:el.clientWidth,scroll:el.scrollWidth,
    computed:getComputedStyle(el).gridTemplateColumns
  }))).toMatchObject({visible:true});
  await expect.poll(()=>progress.evaluate(el=>el.clientWidth)).toBeGreaterThan(0);
  await expect.poll(()=>progress.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeGreaterThan(0);
  const values=await progress.evaluate(el=>({
    inner:el.clientWidth,scroll:el.scrollWidth,
    font:getComputedStyle(el.querySelector('li small')).fontSize,
    labels:[...el.querySelectorAll('li small')].map(n=>n.textContent.trim()),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  expect(values.scroll).toBeGreaterThan(values.inner);
  expect(values.font).toBe('11px');
  expect(values.labels).toEqual([
    'Identify the fault','Compare possible causes','Choose a safe test',
    'Interpret the result','Verify corrective action'
  ]);
  expect(values.overflow).toBeLessThanOrEqual(2);
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
  await progress.evaluate(el=>el.scrollLeft=el.scrollWidth);
  await expect(progress.locator('li').last()).toContainText('Verify corrective action');
});


test('Android focus scrolls content above the measured bottom navigation',async({page})=>{
  for(const width of [360,390,412]){
    await page.setViewportSize({width,height:800});
    if(!page.url().includes('/index.html'))await openApp(page);
    for(const [view,selector] of [
      ['path','#path .mm-hub-continue [data-mm-hub-action="lesson"]'],
      ['materials','#materials .mm-material-journey-actions button'],
      ['scenarios','#scenarios .mm-practice-guided-controls button']
    ]){
      await page.evaluate(name=>switchView(name),view);
      const control=page.locator(selector).first();
      await expect(control).toBeVisible();
      // The route creates several long material catalog sections. WebKit
      // settles that render asynchronously: wait for its layout, then assert
      // that a real centered scroll makes the action both visible and tappable.
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await expect.poll(async()=>{
        await control.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
        return await page.evaluate(selector=>{
          const target=document.querySelector(selector),nav=document.querySelector('.mobile-nav');
          const a=target?.getBoundingClientRect(),n=nav?.getBoundingClientRect();
          const x=a?(a.left+a.right)/2:0,y=a?(a.top+a.bottom)/2:0;
          const hit=document.elementFromPoint(x,y);
          const ok=!!(target&&n&&a.bottom<=n.top-4&&a.top>=0&&hit&&(hit===target||target.contains(hit)));
          const overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;
          return {ok,controlBottom:a?.bottom,navTop:n?.top,overflowOk:overflow<=2,
            navBottom:n?.bottom,windowHeight:window.innerHeight};
        },selector);
      },{timeout:7000}).toMatchObject({ok:true,overflowOk:true});
      const metrics=await page.evaluate(()=>({
        navBottom:document.querySelector('.mobile-nav').getBoundingClientRect().bottom,
        windowHeight:window.innerHeight,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      }));
      expect(metrics.navBottom).toBeLessThanOrEqual(metrics.windowHeight+2);
      expect(metrics.overflow).toBeLessThanOrEqual(2);
    }
  }
});


test('Android bar and content clearance shrink after a taller navigation state',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  const nav=page.locator('.mobile-nav');
  await expect(nav).toBeVisible();
  await page.evaluate(()=>document.querySelector('.mobile-nav').style.setProperty('min-height','150px','important'));
  await expect.poll(()=>page.evaluate(()=>parseFloat(
    document.documentElement.style.getPropertyValue('--mm-mobile-nav-height')
  ))).toBeGreaterThanOrEqual(150);
  await page.evaluate(()=>document.querySelector('.mobile-nav').style.removeProperty('min-height'));
  await expect.poll(()=>page.evaluate(()=>{
    const measured=parseFloat(document.documentElement.style.getPropertyValue('--mm-mobile-nav-height'));
    const actual=Math.ceil(document.querySelector('.mobile-nav').getBoundingClientRect().height);
    return Number.isFinite(measured)&&actual<150&&measured<150&&measured>=actual;
  })).toBe(true);
  const geometry=await page.evaluate(()=>{
    const actual=Math.ceil(document.querySelector('.mobile-nav').getBoundingClientRect().height);
    const measured=parseFloat(document.documentElement.style.getPropertyValue('--mm-mobile-nav-height'));
    return {actual,measured};
  });
  expect(geometry.actual).toBeLessThan(150);
  expect(geometry.measured).toBeLessThan(150);
  expect(geometry.measured).toBeGreaterThanOrEqual(geometry.actual);
});

test('Android font scaling keeps bottom-nav clearance source-measured',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  const nav=page.locator('.mobile-nav');
  await expect(nav).toBeVisible();
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
  await expect.poll(()=>page.evaluate(()=>{
    const nav=document.querySelector('.mobile-nav');
    const measured=parseFloat(document.documentElement.style.getPropertyValue('--mm-mobile-nav-height'));
    return Number.isFinite(measured)&&measured>=Math.ceil(nav.getBoundingClientRect().height);
  })).toBe(true);
  await page.evaluate(()=>switchView('scenarios'));
  const next=page.locator('#scenarios .mm-practice-guided-controls button').first();
  await expect(next).toBeVisible();
  // On a zoomed phone, WebKit can finish the long Practice render after the
  // first scroll attempt. Recenter after each layout step and require the
  // action to be a real unobscured hit target, rather than accepting a stale
  // bounding rectangle or a hidden button.
  await expect.poll(async()=>{
    await next.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
    return next.evaluate(el=>{
      const a=el.getBoundingClientRect(),nav=document.querySelector('.mobile-nav');
      const n=nav.getBoundingClientRect();
      const x=(a.left+a.right)/2,y=(a.top+a.bottom)/2;
      const hit=document.elementFromPoint(x,y);
      return a.top>=0&&a.bottom<=n.top-4&&hit&&(hit===el||el.contains(hit));
    });
  },{timeout:10000}).toBe(true);
});
