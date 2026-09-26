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

for(let run=1;run<=500;run++){
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
      Boolean(window.MM_PRIMARY_HUBS)&&!document.getElementById('mmBootstrap')
    );
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
    const state=await page.evaluate(()=>({
      view:document.body.dataset.mmView||'',
      navGroup:document.body.dataset.mmNavGroup||'',
      unresolved:window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount?.()??-1,
      horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      mobileVisible:[...document.querySelectorAll('.mobile-nav > button')].filter(el=>getComputedStyle(el).display!=='none').length,
      mobileCurrent:[...document.querySelectorAll('.mobile-nav > button[aria-current="page"]')].filter(el=>getComputedStyle(el).display!=='none').length
    }));
    expect(state.view).toBe('dashboard');
    expect(state.navGroup).toBe('home');
    expect(state.unresolved).toBe(0);
    expect(state.horizontalOverflow).toBeLessThanOrEqual(1);
    if(viewport.width<=700){expect(state.mobileVisible).toBe(4);expect(state.mobileCurrent).toBe(1)}
    const action=run%4;
    if(action===0){
      await page.evaluate(()=>switchView('path'));await expect(page.locator('#path')).toBeVisible();
      expect(await page.evaluate(()=>document.body.dataset.mmNavGroup)).toBe('learn');
    }else if(action===1){
      await page.evaluate(()=>switchView('scenarios'));await expect(page.locator('#scenarios')).toBeVisible();
      expect(await page.evaluate(()=>document.body.dataset.mmNavGroup)).toBe('practice');
    }else if(action===2){
      await page.waitForFunction(()=>Boolean(window.MMBook?.open));await page.evaluate(()=>window.MMBook.open());
      await expect(page.locator('#mmBookView')).toBeVisible();
    }else{
      await page.evaluate(()=>switchView('dashboard'));await expect(page.locator('#dashboard')).toBeVisible();
    }
    expect(pageErrors,'page errors in run '+run+': '+pageErrors.join(' | ')).toEqual([]);
    const unexpectedConsole=consoleErrors.filter(message=>!/favicon|Failed to load resource.*404/i.test(message));
    expect(unexpectedConsole,'console errors in run '+run+': '+unexpectedConsole.join(' | ')).toEqual([]);
  });
}
