const {test,expect}=require('@playwright/test');
function learner(id='ux-polish'){return {id,name:'UX Polish QA',role:'learner',completed:[1,2,3],bookmarks:[2],notes:{1:'persistent note'},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-16T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};}
async function waitForAppReady(page){await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS&&window.MMBook);await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));await page.waitForFunction(()=>!document.getElementById('mmAppSplash'));await page.waitForFunction(()=>{const dash=document.getElementById('dashboard');return Boolean(dash?.innerHTML.trim()&&document.querySelectorAll('#nav button[data-view]').length);});await expect(page.locator('#mmStartupFailure')).toHaveCount(0);}
async function openApp(page){await page.addInitScript(({u})=>{if(sessionStorage.getItem('mmUxPolishSeeded')==='1')return;localStorage.clear();localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:u.id,users:{[u.id]:u}}));sessionStorage.setItem('mmUxPolishSeeded','1');},{u:learner()});await page.goto('/index.html',{waitUntil:'domcontentloaded'});await waitForAppReady(page);}
async function openBook(page){
  await page.evaluate(async()=>{window.MMBook.open();await window.MMBook.load();});
  await expect(page.locator('#mmBookView')).toBeVisible();
  await page.waitForFunction(()=>window.MMBook.getManifest()?.parts?.length>0);
  const contents=page.locator('[data-mm-book-contents]');
  if(!(await contents.isVisible())){
    await expect(page.locator('[data-mm-book-back]')).toBeVisible();
    await page.locator('[data-mm-book-back]').click();
  }
  await expect(contents).toBeVisible();
  const index=contents.locator('details.mm-book-governed-index');
  await expect(index.locator('summary')).toBeVisible();
  if(!(await index.evaluate(el=>el.open)))await index.locator('summary').click();
  await expect(contents.locator('[data-mm-book-chapter]').first()).toBeVisible();
  await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);
}
test('deep Book chapters open at their heading and Back restores contents position',async({page})=>{await page.setViewportSize({width:360,height:800});await openApp(page);await openBook(page);expect(await page.locator('[data-mm-book-mode="read"]').count()).toBe(0);const target=page.locator('[data-mm-book-chapter]').nth(41);await target.scrollIntoViewIfNeeded();await page.evaluate(()=>{window.__mmBookClickY=null;document.addEventListener('pointerdown',()=>{window.__mmBookClickY=window.scrollY;},{capture:true,once:true})});await target.click();const before=await page.evaluate(()=>window.__mmBookClickY);expect(before).not.toBeNull();await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();const y=(await page.locator('[data-mm-book-reader] h2').boundingBox()).y;expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThan(220);await page.locator('[data-mm-book-back]').click();await expect(page.locator('[data-mm-book-contents]')).toBeVisible();await expect.poll(async()=>Math.abs((await page.evaluate(()=>window.scrollY))-before),{timeout:3000}).toBeLessThan(90);});
test('Book reader page turns preserve the contents bookmark',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openApp(page);
  await openBook(page);
  const target=page.locator('[data-mm-book-reader-chapter-open]').nth(15);
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(()=>{window.__mmBookClickY=null;document.addEventListener('pointerdown',()=>{window.__mmBookClickY=window.scrollY;},{capture:true,once:true})});
  await target.click();
  const before=await page.evaluate(()=>window.__mmBookClickY);
  expect(before).not.toBeNull();
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  await page.locator('[data-mm-book-page-turn]').last().click();
  await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  await page.locator('[data-mm-book-back]').first().click();
  await expect(page.locator('[data-mm-book-contents]')).toBeVisible();
  await expect.poll(async()=>Math.abs((await page.evaluate(()=>window.scrollY))-before),{timeout:3000}).toBeLessThan(90);
});
test('tablet uses compact primary navigation and keeps content above the fold',async({page})=>{await page.setViewportSize({width:810,height:1080});await openApp(page);await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('.mobile-nav')).toBeVisible();await expect(page.locator('.mobile-nav button')).toHaveCount(5);const top=(await page.locator('#dashboard .mm-today-focus').boundingBox()).y;expect(top).toBeLessThan(260);await page.locator('.mobile-nav button').last().click();await expect(page.getByRole('heading',{name:'More'})).toBeVisible();});
test('50-cycle used-account endurance keeps app and all Book chapters stable',async({page})=>{test.setTimeout(300000);await page.setViewportSize({width:412,height:915});await openApp(page);const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));for(let i=0;i<50;i++){const view=['dashboard','path','scenarios','lesson'][i%4];if(view==='lesson')await page.evaluate(id=>{goLesson(id);switchView('lesson')},(i%12)+1);else await page.evaluate(v=>switchView(v),view);await openBook(page);const idx=i%46;await page.locator('[data-mm-book-chapter]').nth(idx).click();await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();await page.locator('[data-mm-book-back]').click();if(i%10===9){await page.reload({waitUntil:'domcontentloaded'});await waitForAppReady(page);}}expect(errors).toEqual([]);await openBook(page);await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mouldmasterProDB')));expect(stored.users[stored.activeUser].notes['1']).toBe('persistent note');});
