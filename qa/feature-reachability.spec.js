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
    for(const [label,selector] of [['My learning path','#path'],['Practice scenarios','#scenarios'],['Material science','#materials']]){
     const b=page.locator('#nav button').filter({hasText:new RegExp('^\\s*'+label+'\\s*$','i')}).first();await expect(b).toBeVisible();await b.click();await expectVisible(page,selector);
    }
   }
  });
  test('shell-registered tools are discoverable through their intended visible surface',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await mobileMore(page);
    for(const id of ['book','learning-insights','repair-app-files'])await expect(page.locator('[data-mm-registry-menu="'+id+'"]')).toBeVisible();
    await closeModal(page);await mobileHub(page,'Practice');
    for(const action of ['troubleshooting','process-data','labs'])await expect(page.locator('#scenarios [data-mm-hub-action="'+action+'"]')).toBeVisible();
   }else{
    const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();await expect(page.locator('#modal .modal-card')).toBeVisible();for(const id of ['mould-master','diagnostic-labs','process-data','material-labs','learning-insights'])await expect(page.locator('[data-mm-registry-menu="'+id+'"]')).toBeVisible();
   }
  });
 });
}
