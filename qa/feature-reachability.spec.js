const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';

async function openApp(page,width){
  await page.addInitScript(()=>{
    const id='reachability-qa',user={id,name:'Reachability QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  });
  await page.setViewportSize({width,height:900});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&!document.getElementById('mmBootstrap')&&!!window.MMBook,{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}
async function mobileHub(page,name){await page.locator('.mobile-nav > button').filter({hasText:name}).click()}
async function mobileMore(page){await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();await expect(page.locator('#modal .modal-card')).toBeVisible()}
async function closeModal(page){const b=page.getByRole('button',{name:/^close$/i}).first();if(await b.isVisible().catch(()=>false))await b.click();await expect(page.locator('#modal')).toHaveClass(/hidden/)}
async function expectVisible(page,selector){await expect(page.locator(selector)).toBeVisible({timeout:10000})}
async function expectNoHorizontalOverflow(page,label){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);expect(overflow,label+' must not introduce horizontal page overflow').toBeFalsy()}

for(const viewport of [{name:'mobile',width:412},{name:'tablet',width:768},{name:'desktop',width:1440}]){
 test.describe('UI-only feature reachability '+viewport.name,()=>{
  test('Book is discoverable and opens through visible UI',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){await mobileMore(page);const book=page.locator('[data-mm-registry-menu="book"]');await expect(book).toBeVisible();await book.click()}
   else {const book=page.locator('#nav [data-mm-book-tab],#nav [data-mm-book-tab="1"],#nav button').filter({hasText:/^\s*Book\s*$/}).first();await expect(book).toBeVisible();await book.click()}
   await expectVisible(page,'#mmBookView');
  });
  test('core learning and practice destinations are reachable by clicks',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await mobileHub(page,'Learn');await expectVisible(page,'#path .mm-learn-hub');
    await page.locator('#path [data-mm-hub-action="materials"]').click();await expectVisible(page,'#materials');
    await mobileHub(page,'Practice');await expectVisible(page,'#scenarios .mm-practice-hub');
    await page.locator('#scenarios [data-mm-hub-action="assessments"]').click();await expectVisible(page,'#exams');
    await mobileHub(page,'Practice');await page.locator('#scenarios [data-mm-hub-action="labs"]').click();await page.locator('#modal [data-mm-hub-action="simulator"]').click();await expectVisible(page,'#simulator');
   }else{
    for(const [view,selector] of [['path','#path'],['scenarios','#scenarios'],['materials','#materials']]){
     const b=page.locator('#nav button[data-view="'+view+'"]');await expect(b).toBeVisible();await b.click();await expectVisible(page,selector);
    }
   }
  });

  test('Book and assessment surfaces survive zoom and preserve focus recovery',async({page})=>{
   await openApp(page,viewport.width);await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
   if(viewport.width<=900){await mobileMore(page);const trigger=page.locator('.mobile-nav > button').filter({hasText:'More'});await closeModal(page);await expect(trigger).toBeFocused();await mobileMore(page);const book=page.locator('[data-mm-registry-menu="book"]');await expect(book).toBeVisible();await book.click()}
   else {const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();const book=page.locator('[data-mm-registry-menu="book"]');await expect(book).toBeVisible();await book.click()}
   await expectVisible(page,'#mmBookView');await expectNoHorizontalOverflow(page,'Book at 200% text scaling');
   if(viewport.width<=900){await mobileHub(page,'Practice');await page.locator('#scenarios [data-mm-hub-action="assessments"]').click()}else{const practice=page.locator('#nav button[data-view="scenarios"]');await practice.click();const assessments=page.locator('#scenarios [data-mm-hub-action="assessments"]');if(await assessments.isVisible().catch(()=>false))await assessments.click()}
   await expectVisible(page,'#exams');await expectNoHorizontalOverflow(page,'Assessments at 200% text scaling');
  });
  test('reference UI exposes one canonical launcher without duplicate desktop controls',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
    await mobileMore(page);await expect(page.locator('[data-mm-registry-menu="reference-data"]')).toBeVisible();
   }else{
    await expect(page.locator('#mmrd-open')).toBeVisible();await expect(page.locator('#mm-src-open')).toBeHidden();
    await expect(page.locator('#mm-src-open')).toHaveAttribute('aria-hidden','true');await expect(page.locator('#mm-src-open')).toHaveAttribute('tabindex','-1');
    const visibleReferenceLaunchers=await page.locator('#mm-src-open:visible,#mmrd-open:visible').count();expect(visibleReferenceLaunchers).toBe(1);
   }
  });
  test('reference launcher state follows tablet-to-desktop resize without duplicates',async({page})=>{
   await openApp(page,768);
   await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
   await page.setViewportSize({width:1024,height:900});
   await expect(page.locator('#mmrd-open')).toBeVisible();await expect(page.locator('#mm-src-open')).toBeHidden();
   await expect(page.locator('#mm-src-open')).toHaveAttribute('aria-hidden','true');await expect(page.locator('#mm-src-open')).toHaveAttribute('tabindex','-1');
   await page.setViewportSize({width:768,height:900});
   await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
  });
  test('shell-registered tools are discoverable through their intended visible surface',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await mobileMore(page);
    for(const id of ['book','learning-insights','repair-app-files'])await expect(page.locator('[data-mm-registry-menu="'+id+'"]')).toBeVisible();
    await closeModal(page);await mobileHub(page,'Practice');
    for(const action of ['troubleshooting','process-data','labs'])await expect(page.locator('#scenarios [data-mm-hub-action="'+action+'"]')).toBeVisible();
   }else{
    const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();await expect(page.locator('#modal .modal-card')).toBeVisible();
    for(const name of ['Process simulator','Defect finder','Troubleshooting coach','Knowledge checks','Standards & safety','Profile & data'])await expect(page.locator('#modal .quick-action').filter({hasText:name})).toBeVisible();
   }
  });
 });
}


test('desktop References drawer remains explicitly non-blocking and keeps canonical launcher semantics',async({page})=>{
 await openApp(page,1440);
 await expect(page.locator('#mmrd-open')).toBeVisible();
 await page.locator('#mmrd-open').click();
 const drawer=page.locator('.mmrd');
 await expect(drawer).toBeVisible();
 await expect(drawer).toHaveAttribute('data-mm-non-blocking','1');
 await expect(drawer).toHaveAttribute('aria-modal','false');
 expect(await page.evaluate(()=>window.MM_ACCESSIBILITY_HARDENING?.nonBlockingDrawersExcluded===true)).toBeTruthy();
 await page.setViewportSize({width:768,height:900});
 await expect(page.locator('#mmrd-open')).toBeHidden();
 await expect(drawer).toHaveAttribute('aria-modal','false');
 await page.setViewportSize({width:1440,height:900});
 await expect(page.locator('#mmrd-open')).toBeVisible();
 await expect(drawer).toHaveAttribute('aria-modal','false');
});
