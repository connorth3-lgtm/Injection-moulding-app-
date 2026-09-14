const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'book-assurance-qa',name:'Book Assurance QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'book-assurance-qa',users:{'book-assurance-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS&&window.MMBook,{timeout:30000});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

test('Book distinguishes evidence verification from independent human validation',async({page})=>{
  await openApp(page);
  const bookButton=page.locator('button[data-mm-book-tab]');
  await expect(bookButton).toBeVisible();
  await bookButton.click();

  const view=page.locator('#mmBookView');
  await expect(view).toBeVisible();
  await expect(view.locator('[data-mm-book-summary]')).toContainText('46 governed chapters');

  const contract=await page.evaluate(()=>{
    const data=window.MMBook?.getSmeReview?.();
    if(!data)return null;
    const approved=new Set((data.reviews||[]).filter(review=>review?.conclusion==='approved').map(review=>review.chapterId)).size;
    return {status:data.status,total:(data.chapterIds||[]).length,approved};
  });
  expect(contract,'governed Book SME review contract should be available in the installed release').not.toBeNull();
  const expectedState=contract.status==='validated'&&contract.approved===contract.total?'validated':'pending';
  await expect(view.locator('[data-mm-book-sme-status]')).toHaveText(`Independent human SME review: ${expectedState} — ${contract.approved}/${contract.total} chapters approved.`);

  const chapterButtons=view.locator('.mm-book-chapter-button');
  await expect(chapterButtons).toHaveCount(46);
  await expect(chapterButtons.first()).toContainText('Evidence verified');
  await expect(view).not.toContainText(/\bVerified\b(?!\s+means)/);

  const boundary=view.locator('[data-mm-book-accuracy]');
  await expect(boundary).toContainText('Evidence verified');
  await expect(boundary).toContainText('does not imply independent human SME approval');
  await expect(boundary).toContainText('physical-device validation');
  await expect(boundary).toContainText('learner-outcome validation');
});
