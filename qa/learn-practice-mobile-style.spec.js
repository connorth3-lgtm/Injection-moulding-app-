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
  // Shell finalization can precede the reference-layout script's DOM-ready boot
  // in WebKit. Wait for the actual shared-layout marker before asserting CSS.
  await page.waitForFunction(()=>document.documentElement.classList.contains('mm-reference-layout'));
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

// Materials is the owner's compact, information-rich pattern for the whole
// learner experience; verify the new summary is informative, not a replacement
// for technical content, and all four primary destinations still work.
for(const width of [360,412]){
 test('Materials-style compact hierarchy retains full primary-tab information at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:915});
  await openApp(page);
  await page.waitForFunction(()=>document.documentElement.classList.contains('mm-reference-layout'));
  const tools=page.locator('#dashboard .mm-reference-quick-tool');
  await expect(tools).toHaveCount(4);
  await expect(page.locator('#dashboard .mm-reference-quick-copy small')).toHaveCount(4);
  await expect(tools.first()).toContainText('Search grades and properties');
  const homeLayout=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#dashboard .mm-reference-quick-tool')];
    return {columns:new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().left))).size,
      readable:nodes.every(n=>n.querySelector('small')?.getBoundingClientRect().height>0)};
  });
  // Match the Materials catalogue: full-width action rows on mobile.
  expect(homeLayout.columns).toBe(1);
  expect(homeLayout.readable).toBe(true);
  const homeOrder=await page.evaluate(()=>({
    hero:document.querySelector('#dashboard .mm-reference-home-hero').getBoundingClientRect().top,
    shortcut:document.querySelector('#dashboard .mm-reference-home-practice').getBoundingClientRect().top,
    focus:document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect().top,
    tools:document.querySelector('#dashboard .mm-reference-quick-tools').getBoundingClientRect().top
  }));
  expect(homeOrder.shortcut).toBeGreaterThan(homeOrder.hero);
  // Home's canonical dashboard registry can rearrange its focus card during
  // learner state restoration. Both information surfaces must stay readable
  // without overlapping, regardless of which one is first.
  const homeSeparation=await page.evaluate(()=>{
    const focus=document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect();
    const tools=document.querySelector('#dashboard .mm-reference-quick-tools').getBoundingClientRect();
    return tools.bottom<=focus.top+1||focus.bottom<=tools.top+1;
  });
  expect(homeSeparation).toBe(true);
  if(width===412){
    const fs=require('node:fs');fs.mkdirSync('qa-artifacts',{recursive:true});
    await page.screenshot({path:'qa-artifacts/pr640-tidy-home-412x915.png',animations:'disabled'});
  }

  await page.evaluate(()=>switchView('path'));
  const learn=page.locator('#path .mm-learn-hub');
  await expect(learn.locator('#mmLearnCourses .mm-catalog-head')).toBeVisible();
  await expect(learn.locator('#mmLearnCourses .mm-catalog-head')).toContainText('120 core');
  await expect(learn.locator('#mmLearnCourses .mm-catalog-head')).toContainText('36 material science');
  await expect(learn.locator('#mmLearnQuestions .mm-hub-picker-grid>button')).toHaveCount(5);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-item]')).toHaveCount(176);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-query]')).toBeVisible();
  const learnOrder=await page.evaluate(()=>({
    library:document.querySelector('#mmLearnCourses').getBoundingClientRect().top,
    arena:document.querySelector('#mmLearnArena').getBoundingClientRect().top
  }));
  expect(learnOrder.library).toBeLessThan(learnOrder.arena);
  await learn.locator('[data-mm-catalog-query]').fill('cushion');
  await expect(learn.locator('[data-mm-catalog-count]')).toContainText('lesson');
  await learn.locator('[data-mm-catalog-query]').fill('');
  if(width===412)await page.screenshot({path:'qa-artifacts/pr640-tidy-learn-412x915.png',animations:'disabled'});

  await page.evaluate(()=>switchView('scenarios'));
  const practice=page.locator('#scenarios .mm-practice-hub');
  await expect(practice.locator('.mm-hub-section-head')).toContainText('40 scenarios');
  await expect(practice.locator('.mm-hub-section-head')).toContainText('169 governed prompts');
  await expect(practice.locator('.mm-practice-guided')).toBeVisible();
  await expect(practice.locator('.mm-hub-grid>.mm-hub-tile')).toHaveCount(5);
  const practiceOrder=await page.evaluate(()=>({
    tools:document.querySelector('#scenarios #mmPracticeToolResults').getBoundingClientRect().top,
    guided:document.querySelector('#scenarios .mm-practice-guided').getBoundingClientRect().top
  }));
  expect(practiceOrder.tools).toBeLessThan(practiceOrder.guided);
  await practice.locator('[data-mm-practice-query]').fill('process data');
  await expect(practice.locator('#mmPracticeToolResults>button:visible')).toHaveCount(1);
  await expect(practice.locator('[data-mm-practice-count]')).toHaveText('1 tool shown');
  await practice.locator('[data-mm-practice-query]').fill('');
  if(width===412)await page.screenshot({path:'qa-artifacts/pr640-tidy-practice-412x915.png',animations:'disabled'});

  await page.evaluate(()=>switchView('materials'));
  await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
  await expect(page.locator('#materials [data-mm-all-material-index]')).toBeVisible();
  if(width===412)await page.screenshot({path:'qa-artifacts/pr640-tidy-materials-412x915.png',animations:'disabled'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
 });
}

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
 test('Learn offers five governed modes, 120 core lessons and no extra questions section at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});
  await openApp(page);
  await page.evaluate(()=>switchView('path'));
  const learn=page.locator('#path .mm-learn-hub');
  await expect(learn.locator('#mmLearnArena')).toBeVisible();
  const tools=learn.locator('#mmLearnQuestions .mm-hub-picker-grid > button');
  await expect(tools).toHaveCount(5);
  await expect(learn.locator('#mmLearnQuestions')).toContainText('169 governed prompts');
  await expect(learn.locator('#mmLearnReasoning, #mmPracticeReasoning, .mm-question-centre-optional')).toHaveCount(0);
  await expect(learn.locator('.mm-learn-reasoning-item, .mm-learn-reasoning-chapter')).toHaveCount(0);
  const master=learn.locator('.mm-learn-master-lesson');
  await expect(master).toContainText('32 optional questions inside their relevant core lessons');
  await expect(master.locator('.mm-learn-studio > .mm-learn-step')).toHaveCount(2);
  const practiceReflect=master.locator('.mm-learn-studio > .mm-learn-step-practice');
  await expect(practiceReflect).toHaveCount(1);
  await expect(practiceReflect.locator('.mm-learn-step-num')).toHaveText('02');
  await expect(practiceReflect.locator('.mm-learn-step-head')).toContainText('Practise & reflect');
  await expect(practiceReflect.locator('#mmLearnQuestions')).toHaveCount(1);
  await expect(practiceReflect.locator('#mmLearnCapstone')).toHaveCount(1);
  await expect(master.locator('.mm-learn-step-reasoning')).toHaveCount(0);
  await expect(master.locator('.mm-learn-capstone-steps > details')).toHaveCount(4);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-group]')).toHaveCount(22);
  await expect(learn.locator('#mmLearnCourses [data-mm-catalog-item]')).toHaveCount(176);
  await expect(learn.locator('#mmLearnCourses [data-mm-lesson-id]')).toHaveCount(120);
  const jump=await learn.locator('.mm-learn-jump > a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  expect(new Set(jump).size).toBe(jump.length);
  expect(jump).not.toContain('#mmLearnReasoning');
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
 });
}
test('Android Learn bottom navigation does not trap the last learning-resource action',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await openHub(page,'Learn','#path .mm-learn-hub');
 await expect(page.locator('#path #mmLearnReasoning')).toHaveCount(0);
 const footer=page.locator('#path .mm-catalog-extra [data-mm-hub-action="learn-resources"]');
 await footer.scrollIntoViewIfNeeded();
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 const safe=await page.evaluate(()=>{
   const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
   const footer=document.querySelector('#path .mm-catalog-extra button').getBoundingClientRect();
   return {navTop:nav.top,footerBottom:footer.bottom,overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(safe.footerBottom).toBeLessThanOrEqual(safe.navTop+2);
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

test('all 32 unscored source questions map to distinct existing core lessons without modifying assessment scoring',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const info=await page.evaluate(()=>{
    const row=window.MM_LESSON_REASONING?.crosswalk?.()||[];
    return {count:window.MM_LESSON_REASONING?.count||0,
      row:row.map(q=>({...q,title:window.MM_DATA.lessons.find(l=>l.id===q.lessonId)?.title||''})),
      lessons:window.MM_DATA.lessons.length,
      governed:window.MM_QUESTION_CENTRE.counts()};
  });
  expect(info.count).toBe(32);
  expect(info.row).toHaveLength(32);
  expect(info.lessons).toBe(120);
  expect(new Set(info.row.map(q=>q.id)).size).toBe(32);
  expect(new Set(info.row.map(q=>q.lessonId)).size).toBe(32);
  expect(info.row.every(q=>q.lessonId>=1&&q.lessonId<=120&&q.title.length>2)).toBe(true);
  expect(info.row.find(q=>q.id==='LR-01')).toMatchObject({lessonId:46,title:'Cushion control'});
  expect(info.row.find(q=>q.id==='LR-02')).toMatchObject({lessonId:54,title:'Splay'});
  expect(info.row.find(q=>q.id==='LR-32')).toMatchObject({lessonId:80,title:'Change control'});
  expect(info.governed).toEqual({formal:57,scenarios:40,diagnostic:36,materials:24,measured:12,total:169});
  await page.evaluate(()=>window.MM_LESSON_CATALOG.open());
  for(const [id,qaId,topic] of [[46,'LR-01','Cushion stability'],[54,'LR-02','Silver streaks'],[80,'LR-32','Material substitution approval']]){
    const course=page.locator('#path [data-mm-lesson-id="'+id+'"]').locator('xpath=ancestor::*[@data-mm-catalog-group]');
    if(!(await course.evaluate(el=>el.open)))await course.locator(':scope > summary').click();
    await page.locator('#path [data-mm-lesson-id="'+id+'"]').click();
    const section=page.locator('#lesson #mmLessonReasoning');
    await expect(section).toHaveCount(1);
    await expect(section).toHaveAttribute('data-mm-lesson-reasoning-id',String(id));
    await expect(section.locator('.mm-lesson-reasoning-question')).toHaveCount(1);
    await expect(section).toContainText(topic);
    await expect(section.locator('.mm-lesson-reasoning-group')).not.toHaveAttribute('open','');
    await section.locator('.mm-lesson-reasoning-group > summary').click();
    const check=section.locator('.mm-lesson-reasoning-question');
    await expect(check).toHaveAttribute('data-mm-lesson-reasoning-question',qaId);
    await check.locator('summary').click();
    await expect(check).toContainText('Suggested answer');
    await expect(check).toContainText('Why that is plausible');
    await expect(check).toContainText('Evidence to verify');
    await expect(check).toContainText('Common mistake to avoid');
    // Capture the first integrated LESSON question, not the top of Learn.
    // This is unapproved, exact-source review evidence and never a baseline.
    if(id===46){
      // Regression from the real Android visual capture: the legacy
      // reference lesson palette forces dark text with !important on all p
      // elements. These answers sit on a dark card and need AA contrast.
      const contrast=await page.evaluate(()=>{
        const container=document.querySelector('#lesson #mmLessonReasoning');
        const targets=[...container.querySelectorAll('.mm-lesson-reasoning-answer>p'),container.querySelector('.mm-lesson-reasoning-questions>.mm-learn-safety-note')].filter(Boolean);
        const components=color=>color.slice(color.indexOf('(')+1,color.indexOf(')')).split(',').slice(0,3).map(v=>Number(v.trim()));
        const luminance=rgb=>rgb.map(v=>{let c=v/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const background=[7,30,48]; // rgba(5,25,41,.82) over #0e344f
        return targets.map(node=>{
          const foreground=components(getComputedStyle(node).color);
          const a=luminance(foreground),b=luminance(background);
          return {text:node.textContent.trim().slice(0,60),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
        });
      });
      expect(contrast.length).toBe(5);
      expect(contrast.every(row=>row.ratio>=4.5)).toBe(true);
      const fs=require('node:fs');
      fs.mkdirSync('qa-artifacts',{recursive:true});
      await check.scrollIntoViewIfNeeded();
      await page.screenshot({path:'qa-artifacts/pr640-core-lesson-46-integrated-open-390x844.png',animations:'disabled'});
      await section.screenshot({path:'qa-artifacts/pr640-core-lesson-46-answer-expanded.png',animations:'disabled'});
    }
    if(id===54){
      const fs=require('node:fs');
      fs.mkdirSync('qa-artifacts',{recursive:true});
      await section.screenshot({path:'qa-artifacts/pr640-core-lesson-54-answer-expanded.png',animations:'disabled'});
      await check.locator('summary').scrollIntoViewIfNeeded();
      await page.screenshot({path:'qa-artifacts/pr640-core-lesson-54-integrated-open-390x844.png',animations:'disabled'});
    }
    if(id===46||id===54){
      // Verify that the entire safety notice is reachable ABOVE fixed mobile
      // navigation after ordinary scrolling. A cropped first screenshot is
      // not evidence that the final lines can be read on a real phone.
      const notice=section.locator('.mm-lesson-reasoning-questions > .mm-learn-safety-note');
      await notice.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
      const placement=await page.evaluate(()=>{
        const text=document.querySelector('#lesson #mmLessonReasoning .mm-learn-safety-note').getBoundingClientRect();
        const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
        return {top:text.top,bottom:text.bottom,navTop:nav.top,
          overflowX:document.documentElement.scrollWidth-window.innerWidth};
      });
      expect(placement.top).toBeGreaterThanOrEqual(0);
      expect(placement.bottom+12).toBeLessThanOrEqual(placement.navTop);
      expect(placement.overflowX).toBeLessThanOrEqual(2);
      await page.screenshot({
        path:'qa-artifacts/pr640-core-lesson-'+id+'-safety-above-nav-390x844.png',
        animations:'disabled'
      });
    }
    // Re-enter via the real public catalogue path instead of invoking the
    // intentionally private mountLesson() closure. An actual revisit must
    // produce exactly one mapped teaching section with no duplicate prompts.
    await page.evaluate(()=>window.MM_LESSON_CATALOG.open());
    const revisit=page.locator('#path [data-mm-lesson-id="'+id+'"]');
    const group=revisit.locator('xpath=ancestor::*[@data-mm-catalog-group]');
    if(!(await group.evaluate(el=>el.open)))await group.locator(':scope > summary').click();
    await revisit.click();
    await expect(page.locator('#lesson #mmLessonReasoning')).toHaveCount(1);
    await expect(page.locator('#lesson [data-mm-lesson-reasoning-question="'+qaId+'"]')).toHaveCount(1);
    await page.evaluate(()=>window.MM_LESSON_CATALOG.open());
  }
  // Provenance travels with the real screenshot artifact; neither screenshots
  // nor this manifest constitute the owner's approval.
  const fs=require('node:fs');
  fs.mkdirSync('qa-artifacts',{recursive:true});
  fs.writeFileSync('qa-artifacts/pr640-lesson-review-source.json',JSON.stringify({
    release:'2026.10.17.1',sourceSha:process.env.MM_LESSON_REVIEW_SHA||null,
    viewport:{width:390,height:844},lessonIds:[46,54],
    safetyNoticeAboveFixedNavChecked:true,
    visualOwnerApproved:false,visualBaselineChanged:false,
    source:'actual Playwright Chromium in-lesson captures'
  },null,2)+'\n');
  // Unrelated core lessons get no empty or duplicate teaching block.
  const first=page.locator('#path [data-mm-lesson-id="1"]');
  if(!(await first.locator('xpath=ancestor::*[@data-mm-catalog-group]').evaluate(el=>el.open)))await first.locator('xpath=ancestor::*[@data-mm-catalog-group]').locator(':scope > summary').click();
  await first.click();
  await expect(page.locator('#lesson #mmLessonReasoning')).toHaveCount(0);
  expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts().total)).toBe(169);
});
test('Practice Question Centre retains just five governed launchers, without a second copy of lesson checks',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await page.evaluate(()=>window.MM_QUESTION_CENTRE.open());
 const centre=page.locator('#scenarios .mm-question-centre-card');
 await expect(centre).toBeVisible();
 await expect(centre.locator('.mm-hub-picker-grid > button')).toHaveCount(5);
 await expect(centre.locator('#mmPracticeReasoning, #mmLearnReasoning, .mm-question-centre-optional')).toHaveCount(0);
 expect(await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts())).toEqual({formal:57,scenarios:40,diagnostic:36,materials:24,measured:12,total:169});
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
  // The previous eight-chapter safety list was intentionally retired.
  // Verify its actual safety prompt in the relevant canonical core lesson.
  await expect(master.locator('.mm-learn-reasoning-chapter')).toHaveCount(0);
  const capstone=master.locator('#mmLearnCapstone');
  await expect(capstone).toBeVisible();
  await expect(capstone.locator('.mm-learn-capstone-steps > details')).toHaveCount(4);
  await capstone.locator('.mm-learn-capstone-steps > details').first().locator('summary').click();
  await expect(capstone).toContainText('known-good baseline');
  await page.evaluate(()=>window.MM_LESSON_CATALOG.open());
  const safetyLesson=page.locator('#path [data-mm-lesson-id="6"]');
  const safetyCourse=safetyLesson.locator('xpath=ancestor::*[@data-mm-catalog-group]');
  if(!(await safetyCourse.evaluate(el=>el.open)))await safetyCourse.locator(':scope > summary').click();
  await safetyLesson.click();
  const safety=page.locator('#lesson #mmLessonReasoning');
  await expect(safety).toHaveAttribute('data-mm-lesson-reasoning-id','6');
  await expect(safety.locator('[data-mm-lesson-reasoning-question="LR-25"]')).toHaveCount(1);
  await safety.locator('.mm-lesson-reasoning-group > summary').click();
  const question=safety.locator('.mm-lesson-reasoning-question');
  await question.locator('summary').click();
  await expect(question).toContainText('open guard');
  await expect(question).toContainText('Common mistake to avoid');
  await expect(safety).toContainText('These optional questions do not affect the 169 governed assessment prompts');
  await expect(safety.locator('button,[data-mm-onclick]')).toHaveCount(0);
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
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
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
  // `open` is a reflected boolean property; assert the disclosure state
  // directly instead of relying on a serialized empty attribute in WebKit.
  await expect(cases.first()).toHaveJSProperty('open',true);
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
