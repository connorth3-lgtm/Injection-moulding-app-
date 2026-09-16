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

test('tablet and desktop Home use the available canvas without bloating phone Home',async({page})=>{
  await page.setViewportSize({width:810,height:1080});
  await openApp(page);
  const balance=page.locator('#dashboard .mm-home-balance');
  await expect(balance).toBeVisible();
  await expect(balance.locator('[data-mm-home-action]')).toHaveCount(4);
  await expect(balance.getByRole('button',{name:/Practice/i})).toBeVisible();
  await expect(balance.getByRole('button',{name:/Book/i})).toBeVisible();
  await expect(balance.getByRole('button',{name:/Material science/i})).toBeVisible();
  await expect(balance.getByRole('button',{name:/Mould Master/i})).toBeVisible();

  await page.setViewportSize({width:412,height:915});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await expect(page.locator('#dashboard .mm-home-balance')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
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
  await expect(nav.getByRole('button',{name:/Home/i})).toBeVisible();
  await expect(nav.getByRole('button',{name:/Learn/i})).toBeVisible();
  await expect(nav.getByRole('button',{name:/Practice/i})).toBeVisible();
  await expect(nav.getByRole('button',{name:/Book/i})).toBeVisible();
  await expect(nav.getByRole('button',{name:/More tools/i})).toBeVisible();
  await expect(nav.getByRole('button',{name:/Data diagnosis/i})).toBeHidden();
  await expect(nav.getByRole('button',{name:/Diagnostic labs/i})).toBeHidden();
  await expect(nav.getByRole('button',{name:/Material labs/i})).toBeHidden();

  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios [data-mm-hub-action="process-data"]')).toBeVisible();
  await expect(page.locator('#scenarios [data-mm-hub-action="troubleshooting"]')).toBeVisible();

  await nav.getByRole('button',{name:/More tools/i}).click();
  await expect(page.locator('#modal .modal-card')).toBeVisible();
});
