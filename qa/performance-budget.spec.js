const { test, expect } = require('@playwright/test');
const budget=require('./performance-budget-v1.json');

const APP='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function seedLearner(page){
  await page.addInitScript(()=>{
    const user={id:'performance-qa',name:'Performance QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'performance-qa',users:{'performance-qa':user}}));
  });
}

test('production shell reaches the learner-usable state within the browser performance budget',async({page},testInfo)=>{
  await seedLearner(page);
  const started=Date.now();
  await page.goto(APP,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(
    ()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&!!document.querySelector('#dashboard .mm-home-task-hub')&&!document.getElementById('mmBootstrap'),
    null,
    {timeout:budget.max_shell_ready_ms}
  );
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const shellReadyMs=Date.now()-started;
  const metrics=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0];
    const resources=performance.getEntriesByType('resource');
    const decodedBodyBytes=resources.reduce((sum,item)=>sum+Number(item.decodedBodySize||0),0);
    return {
      navigationResponseEndMs:nav?Math.round(nav.responseEnd):null,
      domContentLoadedMs:nav?Math.round(nav.domContentLoadedEventEnd):null,
      loadEventMs:nav&&nav.loadEventEnd?Math.round(nav.loadEventEnd):null,
      resourceCount:resources.length,
      decodedBodyBytes:Math.round(decodedBodyBytes)
    };
  });
  const report={shellReadyMs,...metrics};
  console.log('MouldMaster browser startup performance:',JSON.stringify(report));
  await testInfo.attach('startup-performance.json',{body:Buffer.from(JSON.stringify(report,null,2)),contentType:'application/json'});

  expect(shellReadyMs,'time to learner-usable shell').toBeLessThanOrEqual(budget.max_shell_ready_ms);
  expect(metrics.resourceCount,'startup resource request count').toBeLessThanOrEqual(budget.max_startup_resource_count);
  if(metrics.decodedBodyBytes>0){
    expect(metrics.decodedBodyBytes,'startup decoded resource bytes').toBeLessThanOrEqual(budget.max_startup_decoded_bytes);
  }
});
