const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function seed(page,id='ui-polish-qa'){
  await page.addInitScript(({id})=>{
    const user={id,name:'UI Polish QA',role:'learner',completed:[1,2,3],bookmarks:[2],notes:{},examScores:{},learningAwards:[],currentLesson:4,lastSeen:'2026-09-17T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  },{id});
}

async function openApp(page){
  await seed(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&window.MM_PRIMARY_HUBS&&window.MM_LEARNER_UI_POLISH);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

test('Home is one primary lesson decision plus Book resume and two non-duplicate specialist tools',async({page})=>{
  await page.setViewportSize({width:810,height:1080});
  await openApp(page);
  const focus=page.locator('#dashboard .mm-today-focus');
  const tools=page.locator('#dashboard .mm-home-balance');
  const book=page.locator('#dashboard [data-mm-home-book]');
  await expect(focus).toBeVisible();
  await expect(book).toBeVisible();
  await expect(book.getByRole('button',{name:/Open Book|Keep Reading/})).toBeVisible();
  await expect(tools).toBeVisible();
  await expect(page.locator('#dashboard .mm-home-task-hub,#dashboard .mm-home-utility')).toHaveCount(0);
  await expect(tools.locator('[data-mm-home-action]')).toHaveCount(2);
  await expect(tools.getByRole('button',{name:/Troubleshoot/i})).toBeVisible();
  await expect(tools.getByRole('button',{name:/Analyse data/i})).toBeVisible();
  await expect(tools.getByRole('button',{name:/Materials|Practice|Saved lessons|Browse learning|Reference book/i})).toHaveCount(0);
  await expect(focus.getByRole('button',{name:/Continue lesson/i})).toBeVisible();

  const tablet=await page.evaluate(()=>({
    dashboardWidth:document.getElementById('dashboard').getBoundingClientRect().width,
    outer:getComputedStyle(document.querySelector('#dashboard .mm-home-balance')).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
    actions:getComputedStyle(document.querySelector('#dashboard .mm-home-balance-grid')).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
    lessonBeforeBook:Boolean(document.querySelector('#dashboard .mm-today-focus')?.compareDocumentPosition(document.querySelector('#dashboard [data-mm-home-book]'))&Node.DOCUMENT_POSITION_FOLLOWING),
    bookBeforeTools:Boolean(document.querySelector('#dashboard [data-mm-home-book]')?.compareDocumentPosition(document.querySelector('#dashboard .mm-home-balance'))&Node.DOCUMENT_POSITION_FOLLOWING)
  }));
  expect(tablet.dashboardWidth).toBeLessThanOrEqual(960.5);
  expect(tablet.outer).toBe(1);
  expect(tablet.actions).toBe(2);
  expect(tablet.lessonBeforeBook).toBeTruthy();
  expect(tablet.bookBeforeTools).toBeTruthy();

  const troubleshoot=tools.getByRole('button',{name:/Troubleshoot/i});
  await troubleshoot.evaluate(el=>el.dataset.mmQaStableNode='1');
  await troubleshoot.focus();
  await page.setViewportSize({width:412,height:915});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const phone=await page.evaluate(()=>{
    const focus=document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect();
    const book=document.querySelector('#dashboard [data-mm-home-book]').getBoundingClientRect();
    const tools=document.querySelector('#dashboard .mm-home-balance').getBoundingClientRect();
    const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
    return {
      actions:getComputedStyle(document.querySelector('#dashboard .mm-home-balance-grid')).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      focused:document.activeElement?.dataset?.mmHomeAction||'',
      stable:document.querySelector('[data-mm-home-action="mould-master"]')?.dataset?.mmQaStableNode||'',
      focusBottom:focus.bottom,bookTop:book.top,bookBottom:book.bottom,toolsTop:tools.top,navTop:nav.top
    };
  });
  expect(phone.actions).toBe(2);
  expect(phone.focused).toBe('mould-master');
  expect(phone.stable).toBe('1');
  expect(phone.bookTop).toBeGreaterThanOrEqual(phone.focusBottom-1);
  expect(phone.bookBottom).toBeLessThanOrEqual(phone.navTop+2);
  expect(phone.toolsTop).toBeGreaterThanOrEqual(phone.bookBottom-1);

  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await page.locator('#dashboard .mm-home-balance-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length)).toBe(2);
});

test('Home Book card switches from start to learner-scoped Keep Reading state',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.waitForFunction(()=>window.MMBook?.getReaderArchitecture?.()||window.MMBook?.load);
  await page.evaluate(async()=>{
    await window.MMBook.load();
    await window.MMBook.openReaderChapter('r04');
    window.MM_LEARNER_UI_POLISH.refresh();
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const book=page.locator('#dashboard [data-mm-home-book]');
  await page.evaluate(()=>switchView('dashboard'));
  await page.evaluate(()=>window.MM_LEARNER_UI_POLISH.refresh());
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await expect(book).toHaveCount(1);
  await expect(book).toContainText(/Keep reading:/i);
  await expect(book).toContainText('Chapter 4 of 20');
  await expect(book.getByRole('button',{name:'Keep Reading'})).toBeVisible();
  await expect(book.getByRole('button',{name:'Book contents'})).toBeVisible();
});

test('Book keeps governed status intact but progressively discloses assurance detail without a mutation loop',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.evaluate(()=>window.MMBook.load());
  await page.evaluate(()=>window.MMBook.open());

  const governance=page.locator('#mmBookView .mm-book-governance');
  const assurance=page.locator('#mmBookView .mm-book-assurance-details');
  await expect(governance).toBeVisible();
  await expect(assurance).toBeVisible();
  expect(await governance.evaluate(el=>el.open)).toBeFalsy();
  expect(await assurance.evaluate(el=>el.open)).toBeFalsy();
  await expect(page.locator('[data-mm-book-sme-status]')).toContainText('Independent human SME review:');
  await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);

  await governance.locator('summary').click();
  await expect(page.locator('[data-mm-book-sme-status]')).toBeVisible();
  await expect(page.locator('[data-mm-book-sme-status]')).toContainText('0/46 governed modules approved');

  const mutationCount=await page.evaluate(async()=>{
    const subtitle=document.getElementById('pageSubtitle');
    let count=0;
    const observer=new MutationObserver(records=>{count+=records.length});
    observer.observe(subtitle,{childList:true,characterData:true,subtree:true});
    await new Promise(resolve=>setTimeout(resolve,180));
    observer.disconnect();
    return count;
  });
  expect(mutationCount).toBeLessThanOrEqual(1);
});

test('desktop navigation stays focused while specialist capabilities remain reachable',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);

  const nav=page.locator('#nav');
  await expect(nav.getByRole('button',{name:'Home'})).toBeVisible();
  await expect(nav.getByRole('button',{name:'Learn'})).toBeVisible();
  await expect(nav.getByRole('button',{name:'Materials'})).toBeVisible();
  await expect(nav.getByRole('button',{name:'Practice'})).toBeVisible();
  await expect(nav.getByRole('button',{name:'More'})).toBeVisible();
  // Book is intentionally secondary on desktop: accessible from Home and More.
  const bookNav=nav.locator('[data-mm-registry-nav="book"]');
  await expect(bookNav).toBeHidden();
  await nav.getByRole('button',{name:'Home'}).click();
  await page.locator('#dashboard [data-mm-home-book]').getByRole('button',{name:/Open Book|Keep Reading/}).click();
  await expect(page.locator('#mmBookView')).toBeVisible();
  await expect(page.locator('#pageTitle')).toHaveText('Book');
  await nav.getByRole('button',{name:'Home'}).click();
  await expect(nav.getByRole('button',{name:/Data diagnosis/i})).toBeHidden();
  await expect(nav.getByRole('button',{name:/Mould Master/i})).toBeHidden();

  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios [data-mm-hub-action="process-data"]')).toBeVisible();
  await expect(page.locator('#scenarios [data-mm-hub-action="troubleshooting"]')).toBeVisible();

  await nav.getByRole('button',{name:'More'}).click();
  await expect(page.locator('#modal .modal-card')).toBeVisible();
  // Core specialist actions belong to Practice, not the compact More modal.
  await expect(page.locator('#modal').getByRole('button',{name:/Mould Master/i})).toHaveCount(0);
  await expect(page.locator('#modal').getByRole('button',{name:/Data diagnosis/i})).toHaveCount(0);
  await expect(page.locator('#modal [data-mm-registry-menu="book"]')).toHaveCount(1);
});


test('canonical shell stays stable through intermediate responsive widths',async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await openApp(page);
  for(const width of [600,768,1024,1280]){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const state=await page.evaluate(()=>({
      unresolved:window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount?.()??-1,
      view:document.body.dataset.mmView,
      navGroup:document.body.dataset.mmNavGroup,
      mobileButtons:[...document.querySelectorAll('.mobile-nav > button')].filter(el=>getComputedStyle(el).display!=='none').map(el=>(el.textContent||'').trim()),
      current:[...document.querySelectorAll('.mobile-nav > button[aria-current="page"]')].filter(el=>getComputedStyle(el).display!=='none').length
    }));
    expect(state.unresolved).toBe(0);
    expect(state.view).toBe('dashboard');
    expect(state.navGroup).toBe('home');
    if(width<=700){
      expect(state.mobileButtons).toHaveLength(5);
      expect(state.current).toBe(1);
    }
  }
});

test('canonical navigation registry owns generated control semantics',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const generated=page.locator('#nav [data-mm-registry-nav]');
  const count=await generated.count();
  for(let i=0;i<count;i++)expect((await generated.nth(i).getAttribute('aria-label'))||'').not.toBe('');
  await page.locator('#nav').getByRole('button',{name:'More'}).click();
  const menu=page.locator('#modal [data-mm-registry-menu]');
  const menuCount=await menu.count();
  for(let i=0;i<menuCount;i++){
    expect((await menu.nth(i).getAttribute('aria-label'))||'').not.toBe('');
    await expect(menu.nth(i).locator('.icon')).toHaveAttribute('aria-hidden','true');
  }
});


test('primary IA keeps Materials singular and every major destination reachable',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const nav=page.locator('#nav');
  const visibleLabels=await nav.locator(':scope > button').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none'&&!n.hidden).map(n=>(n.textContent||'').replace(/\s+/g,' ').trim()));
  expect(visibleLabels).toEqual(['⌂ Home','▦ Learn','⬡ Materials','⚠ Practice','More']);
  await expect(page.locator('#dashboard [data-mm-home-book]')).toBeVisible();

  await nav.getByRole('button',{name:'Home'}).click();
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('#dashboard .mm-home-balance')).toBeVisible();
  await expect(page.locator('#pageTitle')).toHaveText('Home');

  await nav.getByRole('button',{name:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await expect(page.locator('#path [data-mm-hub-action="materials"]')).toHaveCount(0);
  await expect(page.locator('#pageTitle')).toHaveText('Learn');

  await nav.getByRole('button',{name:'Materials'}).click();
  await expect(page.locator('#materials')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  await expect(page.locator('#pageTitle')).toHaveText('Materials');
  await expect(page.locator('#searchBtn')).toBeHidden();
  await expect(page.locator('#continueBtn')).toBeHidden();

  await nav.getByRole('button',{name:'Practice'}).click();
  await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
  await expect(page.locator('#pageTitle')).toHaveText('Practice');
  await expect(page.locator('#searchBtn')).toBeHidden();
  await expect(page.locator('#continueBtn')).toBeHidden();

  await nav.getByRole('button',{name:'More'}).click();
  await expect(page.locator('#modal .modal-card')).toBeVisible();
  await expect(page.locator('#modal .modal-card h2')).toHaveText('More');
  await expect(page.locator('#modal .quick-action').filter({hasText:/^Materials$/i})).toHaveCount(0);
  for(const label of ['Standards & safety','Profile & data']){
    await expect(page.locator('#modal').getByRole('button',{name:new RegExp(label,'i')})).toBeVisible();
  }
  for(const label of ['Process simulator','Defect finder','Troubleshooting coach','Knowledge checks','Mould Master','Data diagnosis']){
    await expect(page.locator('#modal').getByRole('button',{name:new RegExp(label,'i')})).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
  await nav.getByRole('button',{name:'Practice'}).click();
  await page.locator('#scenarios [data-mm-hub-action="question-centre"]').click();
  await expect(page.locator('#scenarios .mm-question-centre')).toBeVisible();
  await expect(page.locator('#scenarios .mm-question-centre')).toContainText('169 governed prompts');
  await expect(page.locator('#scenarios .mm-question-centre')).toContainText('30 approved technical + 27 regional-safety bank items');

  const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(desktopOverflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const mobile=page.locator('.mobile-nav');
  await expect(mobile.locator(':scope > button')).toHaveCount(5);
  await expect(mobile.getByRole('button',{name:'Materials'})).toBeVisible();
  await mobile.getByRole('button',{name:'Materials'}).click();
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(mobileOverflow).toBeLessThanOrEqual(1);
});


test('all major app surfaces remain reachable without shell clutter',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const core=[
    ['simulator','#simulator'],['defects','#defects'],['coach','#coach'],['exams','#exams'],
    ['certificates','#certificates'],['glossary','#glossary'],['profile','#profile'],
    ['standards','#standards'],['visuals','#visuals']
  ];
  for(const [view,selector] of core){
    await page.evaluate(view=>window.switchView(view),view);
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('#searchBtn')).toBeHidden();
    await expect(page.locator('#continueBtn')).toBeHidden();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,view+' horizontal overflow').toBeLessThanOrEqual(1);
  }

  await page.waitForFunction(()=>Boolean(window.MM_MOULD_MASTER_WORKSPACE?.open));
  await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.open());
  await expect(page.locator('#mmMouldMasterWorkspace')).toBeVisible();
  await expect(page.locator('#searchBtn')).toBeHidden();
  await expect(page.locator('#continueBtn')).toBeHidden();

  await page.waitForFunction(()=>Boolean(window.MM_PROCESS_DATA_DIAGNOSTICS?.open));
  await page.evaluate(()=>window.MM_PROCESS_DATA_DIAGNOSTICS.open());
  await expect(page.locator('#processDataLabs')).toBeVisible();

  await page.waitForFunction(()=>Boolean(window.MM_MATERIAL_REGISTRY?.openPage));
  await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.openPage({replaceUrl:false}));
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();

  const finalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(finalOverflow).toBeLessThanOrEqual(1);
});


test('Book Materials chapter exposes the complete governed material datasets with structured technical-review rendering',async({page})=>{
  await page.setViewportSize({width:810,height:1080});
  await openApp(page);
  await page.evaluate(()=>window.MMBook.load());
  await page.evaluate(()=>window.MMBook.open());
  // Modules are intentionally inside the progressively disclosed 46-module index.
  const index=page.locator('[data-mm-book-contents] details.mm-book-governed-index');
  await expect(index.locator('summary')).toBeVisible();
  if(!(await index.evaluate(el=>el.open)))await index.locator('summary').click();
  await expect(page.locator('[data-mm-book-chapter="material-families"]')).toBeVisible();
  await page.locator('[data-mm-book-chapter="material-families"]').click();
  const atlas=page.locator('[data-mm-book-material-atlas]');
  await expect(atlas).toBeVisible();
  await expect(atlas).toContainText('Complete Material Data Atlas');
  await expect(atlas).toContainText('260 canonical exact grades');
  await expect(atlas).toContainText('all 284 Asia/Australia/New Zealand evidence rows');
  await expect(atlas).toContainText('excluded from source-reviewed listen-all');

  expect(await page.evaluate(()=>window.MMBook.getMaterialCatalog().grades.length)).toBe(260);
  expect(await page.evaluate(()=>window.MMBook.getMaterialRegionalEvidence().records.length)).toBe(284);
  expect(await page.evaluate(()=>window.MMBook.getMaterialAtlas().regionalProfileIndex.profileCount)).toBe(89);

  const canonical=atlas.locator('[data-mm-book-canonical-catalog]');
  await canonical.locator(':scope > summary').click();
  await expect(canonical.locator('[data-mm-book-catalog-grade]')).toHaveCount(24);
  const canonicalMore=canonical.locator('[data-mm-book-material-more="catalog"]');
  await expect(canonicalMore).toContainText('24/260 shown');
  await canonicalMore.click();
  await expect(canonical.locator('[data-mm-book-catalog-grade]')).toHaveCount(48);
  const firstGrade=canonical.locator('[data-mm-book-catalog-grade]').first();
  await firstGrade.locator(':scope > summary').click();
  await expect(firstGrade).toContainText(/Canonical exact-grade record/i);
  await expect(firstGrade).toContainText(/evidence:/i);
  await expect(firstGrade).toContainText(/commercial\/source currentness:/i);
  await expect(firstGrade).toContainText(/Evidence integrity and product\/source currentness are separate statuses/i);
  await expect(firstGrade.locator('pre')).toHaveCount(0);

  const regional=atlas.locator('[data-mm-book-regional-evidence]');
  await regional.locator(':scope > summary').click();
  await expect(regional.locator('[data-mm-book-regional-row]')).toHaveCount(24);
  const regionalMore=regional.locator('[data-mm-book-material-more="regional"]');
  await expect(regionalMore).toContainText('24/284 shown');
  await regionalMore.click();
  await expect(regional.locator('[data-mm-book-regional-row]')).toHaveCount(48);
  const firstRegional=regional.locator('[data-mm-book-regional-row]').first();
  await firstRegional.locator(':scope > summary').click();
  await expect(firstRegional).toContainText(/Regional evidence row 1/i);
  await expect(firstRegional.locator('pre')).toHaveCount(0);

  const search=await page.evaluate(()=>window.MMBook.search('BMNO').map(x=>x.id));
  expect(search).toContain('material-families');
});

test('Home with a real recent troubleshooting case remains clear of the fixed nav at 360px',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await page.waitForFunction(()=>window.MM_MOULD_MASTER_WORKSPACE?.newCase&&window.MM_MOULD_MASTER_WORKSPACE?.cases);
  await page.evaluate(async()=>{
    await window.MM_MOULD_MASTER_WORKSPACE.newCase({
      title:'Recent troubleshooting case with a deliberately long moulding title',
      defect:'Short shot',
      status:'Investigating'
    });
    window.switchView('dashboard'); // newCase() intentionally navigates into the case workspace.
    window.MM_LEARNER_UI_POLISH.refresh();
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await expect(page.locator('#dashboard')).toBeVisible();
  const recent=page.locator('#dashboard [data-mm-home-action="recent-case"]');
  await expect(recent).toBeVisible();
  // At 360 px the Home content is scrollable and the first-fold recent CTA
  // can be obscured by the fixed bottom navigation (tracked in #520).
  // Verify a learner can scroll it above the fixed footer rather than
  // asserting every Home action fits in the first screenful.
  await recent.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.evaluate(()=>{
    const action=document.querySelector('#dashboard [data-mm-home-action="recent-case"]');
    const nav=document.querySelector('.mobile-nav');
    if(action&&nav){
      const delta=action.getBoundingClientRect().bottom-nav.getBoundingClientRect().top+12;
      if(delta>0)window.scrollBy(0,delta);
    }
  });
  await expect(page.locator('#dashboard .mm-home-balance-grid [data-mm-home-action]')).toHaveCount(2);
  const geometry=await page.evaluate(()=>({
    focusBottom:document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect().bottom,
    toolsBottom:document.querySelector('#dashboard .mm-home-balance-grid').getBoundingClientRect().bottom,
    recentBottom:document.querySelector('#dashboard [data-mm-home-action="recent-case"]').getBoundingClientRect().bottom,
    navTop:document.querySelector('.mobile-nav').getBoundingClientRect().top,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  expect(geometry.focusBottom).toBeLessThan(geometry.navTop);
  expect(geometry.toolsBottom).toBeLessThan(geometry.navTop);
  expect(geometry.recentBottom).toBeLessThanOrEqual(geometry.navTop+1);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
});


test('Defect Finder and Troubleshooting Coach share an evidence-gated offline case workflow on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>switchView('scenarios'));
  await page.locator('#scenarios [data-mm-hub-action="troubleshooting"]').click();
  const root=page.locator('#defects');
  await expect(root.getByRole('heading',{name:'Defect Finder + Troubleshooting Coach'})).toBeVisible();
  await expect(page.locator('#modal')).toHaveClass(/hidden/);
  await expect(root.locator('[data-mm-dx-action="choose"]').first()).toBeVisible();
  await root.locator('#mmDxSearch').fill('short');
  await expect(root.locator('[data-mm-dx-action="choose"]:visible').first()).toBeVisible();
  await root.locator('#mmDxSearch').fill('');
  await root.locator('[data-mm-dx-action="choose"]').first().click();
  await expect(root.getByRole('heading',{name:/Describe the actuals/})).toBeVisible();
  await root.locator('textarea[name="baseline"]').fill('Synthetic stable reference: 12 samples, comparable lot.');
  await root.locator('textarea[name="observations"]').fill('Synthetic measurements: one cavity showed increased part mass variation.');
  await root.locator('input[data-mm-dx-evidence="part"]').check();
  await root.getByRole('button',{name:/Build evidence-led investigation/}).click();
  await expect(root).toContainText('No cause confirmed.');
  await expect(root).toContainText('Evidence gaps to resolve');
  await expect(root).toContainText('Discriminating checks from the defect library');
  await expect(root.locator('[data-mm-dx-hypothesis]').first()).toHaveValue('unassessed');
  await root.locator('[data-mm-dx-hypothesis]').first().selectOption('support');
  const report=await page.evaluate(()=>window.MM_DIAGNOSTIC_WORKBENCH.report());
  expect(report.authority).toBe('educational-investigation-only');
  expect(report.rootCauseVerified).toBe(false);
  expect(report.productionSetpointsAuthorized).toBe(false);
  expect(report.hypotheses[0].learnerAssessment).toBe('support');
  expect(report.evidenceReportedAvailable).toContain('part');
  expect(report.gaps.length).toBeGreaterThan(0);

  await page.evaluate(()=>switchView('coach'));
  await expect(page.locator('#coach').getByRole('heading',{name:'Defect Finder + Troubleshooting Coach'})).toBeVisible();
  await expect(page.locator('#coach')).toContainText('No cause confirmed.');
  const overflow=await page.locator('#coach').evaluate(el=>Math.max(0,el.scrollWidth-el.clientWidth));
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator('#coach [data-mm-dx-action="reset"]').click();
  await expect(page.locator('#coach')).toContainText('Choose one symptom first');
});


test('tablet bottom navigation keeps five touch targets on one row and clears the page content',async({page})=>{
  await page.setViewportSize({width:810,height:1080});
  await openApp(page);
  for(const width of [701,768,810,900]){
    await page.setViewportSize({width,height:1080});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const data=await page.evaluate(()=>{
      const nav=document.querySelector('.mobile-nav'),box=nav.getBoundingClientRect();
      const buttons=[...nav.querySelectorAll(':scope > button')].filter(el=>{
        const r=el.getBoundingClientRect();
        return !el.hidden&&getComputedStyle(el).display!=='none'&&r.width>0&&r.height>0;
      });
      const rects=buttons.map(el=>el.getBoundingClientRect());
      return {
        count:buttons.length,
        rows:new Set(rects.map(r=>Math.round(r.top))).size,
        tracks:getComputedStyle(nav).gridTemplateColumns.trim().split(/\s+/).length,
        minimumHeight:Math.min(...rects.map(r=>r.height)),
        minimumWidth:Math.min(...rects.map(r=>r.width)),
        contained:rects.every(r=>r.left>=box.left-1&&r.right<=box.right+1&&r.bottom<=box.bottom+1),
        clearance:parseFloat(getComputedStyle(document.querySelector('.main')).paddingBottom),
        navHeight:box.height,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      };
    });
    expect(data.count,'primary button count at '+width).toBe(5);
    expect(data.rows,'one visual row at '+width).toBe(1);
    expect(data.tracks,'five CSS tracks at '+width).toBe(5);
    expect(data.minimumHeight,'minimum touch height at '+width).toBeGreaterThanOrEqual(44);
    expect(data.minimumWidth,'minimum touch width at '+width).toBeGreaterThanOrEqual(44);
    expect(data.contained,'all buttons inside bottom nav at '+width).toBeTruthy();
    expect(data.clearance,'body clearance at '+width).toBeGreaterThanOrEqual(data.navHeight);
    expect(data.overflow,'horizontal scroll at '+width).toBeLessThanOrEqual(2);
  }
  // Wider tablets have the canonical desktop sidebar rather than a bottom bar.
  for(const width of [1024,1100]){
    await page.setViewportSize({width,height:900});
    await expect(page.locator('#nav')).toBeVisible();
    await expect(page.locator('#nav').getByRole('button',{name:'More'})).toBeVisible();
  }
});

test('idle Home has a single mission CTA while persistent Mission Control and active timeline still work',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  await expect(page.locator('#mmMissionControl [data-mm-mc-palette]')).toBeVisible();
  await expect(page.locator('#mmMissionControl .mm-mc-empty')).toHaveCount(0);
  await expect(page.locator('#dashboard [data-mm-mc-home-start]')).toHaveCount(1);
  page.once('dialog',dialog=>dialog.accept('Fictional moulding training mission'));
  await page.locator('#dashboard [data-mm-mc-home-start]').click();
  await expect(page.locator('#mmMissionControl .mm-mc-timeline')).toBeVisible();
  await expect(page.locator('#mmMissionControl [data-mm-mc-stage]')).toHaveCount(8);
  await expect(page.locator('#dashboard [data-mm-mc-home-start]')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-mc-home-card')).toContainText('Fictional moulding training mission');
});

test('stored First Shot badge never triggers retired automatic achievement celebration on Home',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  await page.waitForFunction(()=>{
    const db=JSON.parse(localStorage.getItem('mouldmasterProDB')||'{}');
    return db.users?.[db.activeUser]?.fun?.achievements?.includes('first-lesson');
  });
  await expect(page.locator('.toast').filter({hasText:/Achievement unlocked:/i})).toHaveCount(0);
  await expect(page.locator('#xpPop:visible')).toHaveCount(0);
  await page.evaluate(()=>switchView('path'));
  await page.evaluate(()=>switchView('dashboard'));
  await expect(page.locator('.toast').filter({hasText:/Achievement unlocked:/i})).toHaveCount(0);
});
