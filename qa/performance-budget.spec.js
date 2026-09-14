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
