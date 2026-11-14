const {test,expect}=require('@playwright/test');

function learner(id='premium-ui-qa'){
  return {id,name:'Premium UI QA',role:'learner',completed:[1,2,3],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-16T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
}

async function openApp(page){
  await page.addInitScript(({user})=>{
    let db=null;
    try{db=JSON.parse(localStorage.getItem('mouldmasterProDB')||'null')}catch(_){}
    const seeded=Boolean(db&&db.activeUser===user.id&&db.users&&db.users[user.id]);
    if(!seeded){
      localStorage.clear();
      localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:user.id,users:{[user.id]:user}}));
    }
  },{user:learner()});
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&typeof window.switchView==='function');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

async function assertNoHorizontalOverflow(page,label){
  const dims=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(dims.scrollWidth,`${label}: no horizontal overflow`).toBeLessThanOrEqual(dims.clientWidth+1);
}

test('compact desktop shell retains Materials and specialist More access',async({page})=>{
  await page.setViewportSize({width:1440,height:860});
  await openApp(page);
  const nav=page.locator('#nav');
  for(const label of ['Home','Learn','Materials','Practice']){
    await expect(nav.locator(':scope > button:visible').filter({hasText:label})).toHaveCount(1);
  }
  await expect(nav.locator('button[data-mm-desktop-more-tools]')).toBeVisible();
  // Advanced tools remain reachable through the existing modal: no cloned
  // button hierarchy or changed routing contract is added to the app shell.
  await nav.locator('button[data-mm-desktop-more-tools]').click();
  await expect(page.locator('#modal')).toBeVisible();
  const references=page.locator('#modal [data-mm-more-section="references"]');
  await expect(references.locator(':scope > summary')).toBeVisible();
  // Approved desktop More starts expanded; phone More starts collapsed.
  // Exercise the visible category only if it is currently closed.
  if(!(await references.evaluate(el=>el.open)))await references.locator(':scope > summary').click();
  await expect(page.locator('#modal').getByRole('button',{name:'Standards & safety'})).toBeVisible();
  await page.locator('#modal').getByRole('button',{name:'Standards & safety'}).click();
  await expect(page.locator('#standards')).toBeVisible();
});

test('Book reading and Practice both omit Mission Control strip without losing learner workspace',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openApp(page);
  const mission=page.locator('#mmMissionControl > .mm-mc-context');
  await expect(mission).toBeHidden();
  await page.evaluate(()=>switchView('scenarios'));
  await expect(mission).toBeHidden();
  // Exercise the REAL learner navigation path: Practice → Home → Open Book.
  // Direct MMBook.open() skips the shell's custom-view synchronisation, and
  // can race with an outstanding Practice view render under Chromium/WebKit.
  await page.evaluate(async()=>{await window.MMBook.ready;switchView('dashboard')});
  const bookAction=page.locator('#dashboard [data-mm-home-book-action="contents"]');
  await expect(bookAction).toBeVisible();
  await bookAction.click();
  await expect(page.locator('#mmBookView')).toBeVisible();
  await page.evaluate(()=>window.MMBook.load());
  await expect(mission).toBeHidden();
  await expect(page.locator('#pageSubtitle')).toBeHidden();
  // The mission's overlays and learner data remain mounted while the shared
  // status strip stays hidden on every app surface, not only in the Book.
  await expect(page.locator('#mmMissionControl .mm-mc-p