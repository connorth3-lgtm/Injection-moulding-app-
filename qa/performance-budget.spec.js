const {test,expect}=require('@playwright/test');
const budget=require('./performance-budget.json');
const BASE='http://127.0.0.1:4173/';

async function seedLearner(page){
  await page.addInitScript(()=>{
    const user={id:'performance-qa',name:'Performance QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'performance-qa',users:{'performance-qa':user}}));
  });
}

test('startup and browser resource growth stay inside regression ceilings',async({page,browserName})=>{
  await seedLearner(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS,{timeout:budget.startupReadyMsMax});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:budget.startupReadyMsMax});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);

  const measured=await page.evaluate(()=>{
    const resources=performance.getEntriesByType('resource');
    const scripts=resources.filter(entry=>entry.initiatorType==='script'||/\.js(?:[?#]|$)/i.test(entry.name));
    return {
      startupReadyMs:performance.now(),
      scriptResourceCount:scripts.length,
      scriptEncodedBytes:scripts.reduce((sum,entry)=>sum+(Number(entry.encodedBodySize)||0),0),
      domNodeCount:document.getElementsByTagName('*').length
    };
  });

  expect(measured.startupReadyMs,`${browserName} startup-ready time ${Math.round(measured.startupReadyMs)}ms exceeds regression ceiling`).toBeLessThanOrEqual(budget.startupReadyMsMax);
  expect(measured.scriptResourceCount,`${browserName} loaded ${measured.scriptResourceCount} script resources`).toBeLessThanOrEqual(budget.scriptResourceCountMax);
  expect(measured.scriptEncodedBytes,`${browserName} loaded ${measured.scriptEncodedBytes} encoded script bytes`).toBeLessThanOrEqual(budget.scriptEncodedBytesMax);
  expect(measured.domNodeCount,`${browserName} rendered ${measured.domNodeCount} DOM nodes`).toBeLessThanOrEqual(budget.domNodeCountMax);
});


test('4x CPU-throttled startup remains inside the low-resource regression ceiling',async({page,browserName})=>{
  test.skip(browserName!=='chromium','CPU throttling is a Chromium-only CI guardrail');
  const session=await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  try{
    await seedLearner(page);
    const started=Date.now();
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS,{timeout:budget.cpuThrottledStartupReadyMsMax});
    await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:budget.cpuThrottledStartupReadyMsMax});
    await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
    expect(Date.now()-started).toBeLessThanOrEqual(budget.cpuThrottledStartupReadyMsMax);
  }finally{
    await session.send('Emulation.setCPUThrottlingRate',{rate:1}).catch(()=>{});
  }
});

test('repeated navigation does not accumulate unbounded DOM or resource entries',async({page})=>{
  await seedLearner(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS,{timeout:budget.startupReadyMsMax});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:budget.startupReadyMsMax});

  // Warm every view once so lazy first-render construction is not mislabeled as a leak.
  await page.evaluate(()=>{
    for(const view of ['dashboard','path','scenarios','materials','dashboard'])window.switchView(view);
  });
  await page.waitForTimeout(100);
  const before=await page.evaluate(()=>document.getElementsByTagName('*').length);
  const half=Math.max(1,Math.floor(budget.longSessionCycles/2));

  await page.evaluate(cycles=>{
    performance.clearResourceTimings();
    const sequence=['dashboard','path','scenarios','materials','dashboard'];
    for(let i=0;i<cycles;i++)for(const view of sequence)window.switchView(view);
  },half);
  await page.waitForTimeout(250);

  const midpoint=await page.evaluate(()=>document.getElementsByTagName('*').length);
  await page.evaluate(cycles=>{
    performance.clearResourceTimings();
    const sequence=['dashboard','path','scenarios','materials','dashboard'];
    for(let i=0;i<cycles;i++)for(const view of sequence)window.switchView(view);
  },budget.longSessionCycles-half);
  await page.waitForTimeout(250);

  const steady=await page.evaluate(()=>({
    nodes:document.getElementsByTagName('*').length,
    resources:performance.getEntriesByType('resource').length
  }));

  expect(midpoint-before,'first-half warmed DOM growth exceeded regression ceiling').toBeLessThanOrEqual(budget.longSessionDomGrowthMax);
  expect(steady.nodes-midpoint,'steady-state DOM continued growing across the second half').toBeLessThanOrEqual(budget.longSessionDomGrowthMax);
  expect(steady.resources,'steady-state resource requests continued during repeated navigation').toBeLessThanOrEqual(budget.longSessionSteadyStateResourceEntriesMax);
});
