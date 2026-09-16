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
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  for(const [view,ready] of [
    ['dashboard','#dashboard'],['path','#path .mm-learn-hub'],['scenarios','#scenarios .mm-practice-hub'],['lesson','#lesson']
  ]){
    if(view==='lesson')await page.evaluate(()=>{goLesson(4);switchView('lesson')});
    else await page.evaluate(v=>switchView(v),view);
    await expect(page.locator(ready)).toBeVisible();
    await assertNoHorizontalOverflow(page,view);
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
