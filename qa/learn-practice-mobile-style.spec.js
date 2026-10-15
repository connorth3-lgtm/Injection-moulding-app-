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
 test('Learn studio owns Arena, all five real question modes and six independent answer checks at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  const learn=page.locator('#path .mm-learn-hub');
  await expect(learn.locator('#mmLearnArena')).toBeVisible();
  await expect(learn.locator('#mmLearnQuestions .mm-hub-picker-grid > button')).toHaveCount(5);
  await expect(learn.locator('#mmLearnQuestions')).toContainText('169 governed prompts');
  await expect(learn.locator('#mmLearnReasoning .mm-learn-reasoning-item')).toHaveCount(6);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-group]')).toHaveCount(22);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-item]')).toHaveCount(176);
  const first=learn.locator('#mmLearnReasoning .mm-learn-reasoning-item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open','');
  await expect(first).toContainText('Suggested answer');
  await expect(first).toContainText('Why it matters');
  const checks=await page.evaluate(()=>({total:window.MM_QUESTION_CENTRE.counts().total,scroll:document.documentElement.scrollWidth-innerWidth}));
  expect(checks.total).toBe(169);
  expect(checks.scroll).toBeLessThanOrEqual(2);
  await page.evaluate(()=>window.MM_PRIMARY_HUBS.renderLearnHub());
  await expect(page.locator('#path #mmLearnQuestions')).toHaveCount(1);
  await expect(page.locator('#path #mmLearnArena')).toHaveCount(1);
 });
}
test('Learn Arena boss round keeps source-owned feedback and the scenario return goes back to Learn',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await page.evaluate(()=>switchView('path'));
 await page.locator('#path [data-mm-hub-action="boss-round"]').click();
 const boss=page.locator('#modal:not(.hidden)');
 await expect(boss).toContainText('Boss round');
 await expect(boss.locator('button.choice')).toHaveCount(3);
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
 await expect(page.locator('#exams')).toContainText('knowledge');
 await page.evaluate(()=>switchView('path'));
 await page.locator('#path #mmLearnQuestions [data-mm-hub-action="scenario-detail"]').click();
 await expect(page.locator('#scenarios .scenario')).toHaveCount(40);
 await page.locator('#scenarios .mm-hub-detail-back button').click();
 await expect(page.locator('#path #mmLearnQuestions')).toBeVisible();
});
