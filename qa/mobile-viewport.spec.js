const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function seedLearner(page){
  await page.addInitScript(()=>{
    const user={id:'mobile-qa',name:'Mobile QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'mobile-qa',users:{'mobile-qa':user}}));
  });
}
async function openApp(page){
  await seedLearner(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await expect(page.locator('.mobile-nav > button')).toHaveCount(6);
  await expect(page.locator('.mobile-nav > button').filter({hasText:'Maths'})).toHaveCount(1);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function openPracticeHub(page){
  await page.locator('.mobile-nav > button').filter({hasText:'Practice'}).click();
  await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
  await expectOnlyCurrent(page,'Practice');
}
async function openPracticeAction(page,action){
  const button=page.locator(`#scenarios [data-mm-hub-action="${action}"]`);
  await expect(button).toBeVisible();
  await button.click();
}
async function openLearnHub(page){
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await expectOnlyCurrent(page,'Learn');
}
async function scrollAppToBottom(page){
  await page.evaluate(()=>{
    const main=document.querySelector('main.main')||document.querySelector('.main');
    if(main&&main.scrollHeight>main.clientHeight)main.scrollTop=main.scrollHeight;
    const root=document.scrollingElement;
    if(root&&root.scrollHeight>root.clientHeight)root.scrollTop=root.scrollHeight;
  });
  await page.waitForFunction(()=>{
    const main=document.querySelector('main.main')||document.querySelector('.main');
    const root=document.scrollingElement;
    const mainDone=!main||main.scrollHeight<=main.clientHeight||main.scrollTop+main.clientHeight>=main.scrollHeight-2;
    const rootDone=!root||root.scrollHeight<=root.clientHeight||root.scrollTop+root.clientHeight>=root.scrollHeight-2;
    return mainDone&&rootDone;
  });
}
async function expectOnlyCurrent(page,label){
  const current=page.locator('.mobile-nav > button[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toContainText(label);
}

for(const viewport of [{name:'android-412x915',width:412,height:915},{name:'small-360x800',width:360,height:800}]){
  test.describe(viewport.name,()=>{
    test.use({viewport:{width:viewport.width,height:viewport.height}});

    test('Home is lean, XP-free, includes the Book resume surface, and Practice owns troubleshooting',async({page})=>{
      await openApp(page);
      await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
      const homeBook=page.locator('#dashboard [data-mm-home-book]');
      await expect(homeBook).toHaveCount(1);
      await expect(homeBook).toBeVisible();
      await expect(homeBook).toHaveAttribute('aria-label','MouldMaster Book');
      await expect(homeBook.getByRole('button',{name:/Open Book|Keep Reading/})).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(0);
      await expect(page.locator('#dashboard .mm-home-utility')).toHaveCount(0);
      await expect(page.locator('#dashboard .mm-home-balance')).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-balanc