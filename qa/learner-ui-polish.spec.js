const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function seed(page,id='ui-polish-qa'){
  await page.addInitScript(({id})=>{
    const user={id,name:'UI Polish QA',role:'learner',completed:[1,2,3],bookmarks:[2],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-17T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
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

test('Home is one primary lesson decision plus Book and two non-duplicate specialist tools',async({page})=>{
  await page.setViewportSize({width:810,height:1080});
  await openApp(page);
  const focus=page.locator('#dashboard .mm-today-focus');
  const book=page.locator('#dashboard [data-mm-home-book]');
  const tools=page.locator('#dashboard .mm-home-balance');
  await expect(focus).toBeVisible();
  await expect(book).toBeVisible();
  await expect(book.getByRole('button',{name:'Open Book'})).toBeVisible();
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
    return {
      actions:getComputedStyle(document.querySelector('#dashboard .mm-home-balance-grid')).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      focused:document.activeElement?.dataset?.mmHomeAction||'',
      stable:document.querySelector('[data-mm-home-action="mould-master"]')?.dataset?.mmQaStableNode||'',
      focusBottom:focus.bottom,bookTop:book.top,bookBottom:book.bottom,toolsTop:tools.top
    };
  });
  expect(phone.actions).toBe(2);
  expect(phone.focused).toBe('mould-master');
  expect(phone.stable).toBe('1');
  expect(phone.bookTop).toBeGreaterThanOrEqual(phone.focusBottom-1);
  expect(phone.toolsTop).toBeGreaterThanOrEqual(phone.bookBottom-1);

  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await page.locator('#dashboard .mm-home-balance-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length)).toBe(2);
});
test('Book keeps governed status intact but progressively discloses assurance detail without a mutation loop',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
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
  await expect(page.locator('[data-mm-book-sme-status]')).toContainText('0/46 chapters approved');

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
  await expect(nav.getByRole('button',{name:/Book/i})).toBeHidden();
  await expect(nav.getByRole('button',{name:/Data diagnosis/i})).toBeHidden();
  await expect(nav.getByRole('button',{name:/Mould Master/i})).toBeHidden();

  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios [data-mm-hub-action="process-data"]')).toBeVisible();
  await expect(page.locator('#scenarios [data-mm-hub-action="troubleshooting"]')).toBeVisible();

  await nav.getByRole('button',{name:'More'}).click();
  await expect(page.locator('#modal .modal-card')).toBeVisible();
  await expect(page.locator('#modal').getByRole('button',{name:/Mould Master/i})).toBeVisible();
  await expect(page.locator('#modal').getByRole('button',{name:/Data diagnosis/i})).toBeVisible();
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
  for(const label of ['Process simulator','Defect finder','Troubleshooting coach','Knowledge checks','Standards & safety','Profile & data','Mould Master','Data diagnosis']){
    await expect(page.locator('#modal').getByRole('button',{name:new RegExp(label,'i')})).toBeVisible();
  }

  const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(desktopOverflow).toBeLessThanOrEqual(1);

  await page.keyboard.press('Escape');
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
  await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
  await page.evaluate(()=>window.MMBook.open());
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
  await canonical.locator('summary').click();
  await expect(canonical.locator('[data-mm-book-catalog-grade]')).toHaveCount(260);
  const firstGrade=canonical.locator('[data-mm-book-catalog-grade]').first();
  await firstGrade.locator('summary').click();
  await expect(firstGrade).toContainText(/Canonical exact-grade record/i);
  await expect(firstGrade).toContainText(/evidence:/i);
  await expect(firstGrade).toContainText(/commercial\/source currentness:/i);
  await expect(firstGrade).toContainText(/Evidence integrity and product\/source currentness are separate statuses/i);
  await expect(firstGrade.locator('pre')).toHaveCount(0);

  const regional=atlas.locator('[data-mm-book-regional-evidence]');
  await regional.locator('summary').click();
  await expect(regional.locator('[data-mm-book-regional-row]')).toHaveCount(284);
  const firstRegional=regional.locator('[data-mm-book-regional-row]').first();
  await firstRegional.locator('summary').click();
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
    window.MM_LEARNER_UI_POLISH.refresh();
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const recent=page.locator('#dashboard [data-mm-home-action="recent-case"]');
  await expect(recent).toBeVisible();
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
