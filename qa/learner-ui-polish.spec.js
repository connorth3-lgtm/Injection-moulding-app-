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

test('Materials deep link is intentional but does not become the Home relaunch route',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await seed(page,'material-relaunch-qa');
  await page.goto(BASE+'?view=materials&qaToken=keep',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED&&window.MM_MATERIAL_REGISTRY));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#materials')).toBeVisible();
  await expect(page.locator('.mobile-nav > button[data-view="materials"]')).toHaveAttribute('aria-current','page');
  expect(new URL(page.url()).searchParams.get('view')).toBe('materials');

  await page.locator('.mobile-nav > button[data-view="dashboard"]').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  const homeUrl=new URL(page.url());
  expect(homeUrl.searchParams.has('view')).toBe(false);
  expect(homeUrl.searchParams.get('qaToken')).toBe('keep');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&!document.getElementById('mmBootstrap'));
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('.mobile-nav > button[data-view="dashboard"]')).toHaveAttribute('aria-current','page');
  expect(new URL(page.url()).searchParams.has('view')).toBe(false);
});

test('six mobile tabs start with actionable content instead of oversized introductions',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  const nav=page.locator('.mobile-nav');
  await expect(page.locator('body[data-mm-view="dashboard"] .topbar>div:first-child')).toBeHidden();
  await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
  await expect(page.locator('#searchBtn')).toBeVisible();

  await nav.getByRole('button',{name:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub>.mm-primary-hub-head')).toBeHidden();
  await expect(page.locator('#path .mm-hub-continue [data-mm-hub-action="lesson"]')).toBeVisible();

  await nav.getByRole('button',{name:'Materials'}).click();
  await expect(page.locator('#materials #mmExactMaterialCatalog .mm-exact-head')).toBeHidden();
  await expect(page.locator('#materials .mm-material-all-index-head h3')).toBeVisible();
  await expect(page.locator('#materials [data-mm-all-material-query]')).toBeVisible();
  await expect(page.locator('#materials [data-mm-catalogue-boundary]')).toBeAttached();
  await expect(page.locator('#materials .mm-material-catalogue-tools')).toBeVisible();
  await expect(page.locator('#materials [data-mm-all-material-results] [data-mm-family-open="PP"]')).toBeVisible();
  await expect(page.locator('#materials [data-mm-exact-query]')).toBeHidden();
  await expect(page.locator('#materials [data-mm-exact-results]')).toBeHidden();

  aw