const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
const VIEWPORTS=[
  {name:'phone-360',width:360,height:800},
  {name:'phone-412',width:412,height:915},
  {name:'tablet-768',width:768,height:1024},
  {name:'desktop-1024',width:1024,height:900},
  {name:'desktop-1440',width:1440,height:900}
];
test.use({serviceWorkers:'block'});

async function seed(page,run){
  await page.addInitScript(({run})=>{
    const id='audit-500-'+run;
    const user={id,name:'500 Run QA',role:'learner',completed:[1,2],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:3,lastSeen:'2026-09-27T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  },{run});
}

const FAMILIES=['home','learn','practice','book','materials','responsive','more','lesson','process-data','shell'];

for(let run=1;run<=500;run++){
  const family=FAMILIES[Math.floor((run-1)/50)];
  const variant=(run-1)%50;
  const viewport=VIEWPORTS[(run-1)%VIEWPORTS.length];
  test('individual app run '+String(run).padStart(3,'0')+' · '+viewport.name,async({page})=>{
    const pageErrors=[],consoleErrors=[];
    page.on('pageerror',error=>pageErrors.push(String(error?.message||error)));
    page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await seed(page,run);
    const response=await page.goto(BASE,{waitUntil:'domcontentloaded'});
    expect(response?.ok()).toBeTruthy();
    await page.waitForFunction(()=>
      typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0&&
      Boolean(window.MM_PRIMARY_HUBS)&&
      typeof window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount==='function'&&
      !document.getElementById('mmBootstrap')
    );
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
    const state=await page.evaluate(()=>({
      view:document.body.dataset.mmView||'',
      navGroup:document.body.dataset.mmNavGroup||'',
      unresolved:window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount?.()??-1,\n      semanticIssues:window.MM_ACCESSIBILITY_HARDENING?.semanticIssues?.()??[],
      horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      mobileVisible:[...document.querySelectorAll('.mobile-nav > button')].filter(el=>getComputedStyle(el).display!=='none').length,
      mobileCurrent:[...document.querySelectorAll('.mobile-nav > button[aria-current="page"]')].filter(el=>getComputedStyle(el).display!=='none').length
    }));
    expect(state.view).toBe('dashboard');
    expect(state.navGroup).toBe('home');
    expect(state.unresolved,'unresolved accessibility semantics: '+JSON.stringify(state.semanticIssues)).toBe(0);
    expect(state.horizontalOverflow).toBeLessThanOrEqual(1);
    if(viewport.width<=700){expect(state.mobileVisible).toBe(4);expect(state.mobileCurrent).toBe(1)}
    if(family==='home'){
      await expect(page.locator('#dashboard')).toBeVisible();
      await expect(page.locator('#dashboard')).not.toContainText(/workshop rank|learning streak/i);
    }else if(family==='learn'){
      await page.evaluate(()=>switchView('path'));await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
      expect(await page.evaluate(()=>document.body.dataset.mmNavGroup)).toBe('learn');
    }else if(family==='practice'){
      await page.evaluate(()=>switchView('scenarios'));await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
      expect(await page.evaluate(()=>document.body.dataset.mmNavGroup)).toBe('practice');
    }else if(family==='book'){
      await page.waitForFunction(()=>Boolean(window.MMBook?.open));await page.evaluate(()=>window.MMBook.open());
      await expect(page.locator('#mmBookView')).toBeVisible();
      await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
      const chapters=page.locator('[data-mm-book-chapter]');
      expect(await chapters.count()).toBeGreaterThanOrEqual(46);
      await chapters.nth(variant%Math.min(46,await chapters.count())).click();
      await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
    }else if(family==='materials'){
      await page.evaluate(()=>switchView('path'));const b=page.locator('#path [data-mm-hub-action="materials"]');await expect(b).toBeVisible();await b.click();
      await expect(page.locator('#mmExactMaterialCatalog')).toHaveCount(1);
    }else if(family==='responsive'){
      const widths=[360,412,600,650,700,768,810,900,1024,1280,1440];
      await page.setViewportSize({width:widths[variant%widths.length],height:900});
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }else if(family==='more'){
      if(viewport.width<=700){await page.locator('.mobile-nav > button').filter({hasText:'More'}).click()}
      else{await page.locator('#nav').getByRole('button',{name:/More tools/i}).click()}
      await expect(page.locator('#modal .modal-card')).toBeVisible();
    }else if(family==='lesson'){
      await page.evaluate(()=>switchView('path'));const b=page.getByRole('button',{name:/Continue lesson/i}).first();await expect(b).toBeVisible();await b.click();
      await expect(page.locator('#lesson')).toBeVisible();await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
    }else if(family==='process-data'){
      await page.evaluate(()=>switchView('scenarios'));const b=page.locator('#scenarios [data-mm-hub-action="process-data"]');await expect(b).toBeVisible();await b.click();
      await expect(page.locator('#processDataLabs')).toBeVisible();await expect(page.getByRole('heading',{name:'Guided Data Diagnosis'})).toBeVisible();
    }else if(family==='shell'){
      await page.evaluate(()=>{window.MM_APP_SHELL.dashboard.compose();window.MM_APP_SHELL.dashboard.compose()});
      await expect(page.locator('#dashboard .mm-today-focus')).toHaveCount(1);
      expect(await page.evaluate(()=>window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount?.()??-1)).toBe(0);
    }
    expect(pageErrors,'page errors in run '+run+': '+pageErrors.join(' | ')).toEqual([]);
    const unexpectedConsole=consoleErrors.filter(message=>!/favicon|Failed to load resource.*404/i.test(message));
    expect(unexpectedConsole,'console errors in run '+run+': '+unexpectedConsole.join(' | ')).toEqual([]);
  });
}
