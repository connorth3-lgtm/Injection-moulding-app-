const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function seed(page){
  await page.addInitScript(()=>{
    const user={id:'ux-repair-qa',name:'UX Repair QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:6,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'ux-repair-qa',users:{'ux-repair-qa':user}}));
    localStorage.removeItem('mm_exam_question_rotation_v2');
  });
}
async function open(page){
  await seed(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS&&window.MM_LEARNER_UX_REPAIR&&window.MM_SIMPLE_LESSON_EXPERIENCE);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

for(const viewport of [{name:'android-412x915',width:412,height:915},{name:'small-360x800',width:360,height:800}]){
  test.describe(viewport.name,()=>{
    test.use({viewport:{width:viewport.width,height:viewport.height}});

    test('lesson opens as one simple flow with no duplicate mobile chrome',async({page})=>{
      await open(page);
      await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
      await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
      await page.getByRole('button',{name:/Continue lesson/i}).first().click();
      await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
      await page.waitForFunction(()=>{
        const hidden=s=>[...document.querySelectorAll(s)].every(el=>getComputedStyle(el).display==='none'||el.hidden);
        return hidden('#lesson .mm-mobile-actions,#lesson .mm-mobile-lessons,#lesson .mm-lesson-progress,#lesson .mm-reading-guide,#lesson .mm-read-marker');
      });

      await expect(page.locator('#lesson .mm-mobile-actions')).toBeHidden();
      await expect(page.locator('#lesson .mm-mobile-lessons')).toBeHidden();
      await expect(page.locator('#lesson .mm-lesson-progress')).toBeHidden();
      await expect(page.locator('#lesson .mm-reading-guide')).toBeHidden();
      await expect(page.getByText('Read boxes 1, 2 and 3 in order.')).toBeHidden();

      const geometry=await page.evaluate(()=>{
        const hero=document.querySelector('#lesson .mm-simple-lesson-hero');
        const main=document.querySelector('main.main')||document.querySelector('.main');
        const rect=hero.getBoundingClientRect();
        return {heroTop:rect.top,heroBottom:rect.bottom,windowY:window.scrollY||0,rootY:document.scrollingElement?.scrollTop||0,mainY:main?.scrollTop||0};
      });
      expect(geometry.heroTop).toBeGreaterThanOrEqual(0);
      expect(geometry.heroTop).toBeLessThan(220);
      expect(geometry.windowY).toBeLessThanOrEqual(1);
      expect(geometry.rootY).toBeLessThanOrEqual(1);
      expect(geometry.mainY).toBeLessThanOrEqual(1);

      if(viewport.width===412)await page.screenshot({path:'qa-artifacts/mobile-lesson-412x915.png',fullPage:true});
    });
  });
}

test('restarting a knowledge check rotates the core question set without changing its size',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await open(page);
  await page.evaluate(()=>switchView('exams'));
  await expect(page.locator('#exams')).toBeVisible();
  await page.waitForFunction(()=>window.startExam?.__mmQuestionRotation===true);

  const start=page.locator('#exams button').filter({hasText:/^Start/}).first();
  await start.click();
  await expect(page.locator('#examQuestions .question')).toHaveCount(10);
  const first=await page.locator('#examQuestions .question').evaluateAll(nodes=>nodes.map(node=>(node.querySelector('b')?.textContent||'').replace(/^\d+\.\s*/,'').trim()));
  await page.evaluate(()=>closeModal());

  await start.click();
  await expect(page.locator('#examQuestions .question')).toHaveCount(10);
  const second=await page.locator('#examQuestions .question').evaluateAll(nodes=>nodes.map(node=>(node.querySelector('b')?.textContent||'').replace(/^\d+\.\s*/,'').trim()));

  expect(second).toHaveLength(first.length);
  expect(second).not.toEqual(first);
  expect(new Set(second).size).toBe(second.length);
});
