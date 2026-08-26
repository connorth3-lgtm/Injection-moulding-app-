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
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.2'&&document.querySelector('#dashboard .mm-home-task-hub'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

for(const viewport of [{name:'android-412x915',width:412,height:915},{name:'small-360x800',width:360,height:800}]){
  test.describe(viewport.name,()=>{
    test.use({viewport:{width:viewport.width,height:viewport.height}});

    test('Home is task-first, clear of the fixed nav, and Mould Master is one tap away',async({page})=>{
      await openApp(page);
      await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-task-hub')).toBeVisible();
      await expect(page.locator('#continueBtn')).toBeHidden();
      await expect(page.getByRole('button',{name:/Diagnose a moulding problem/i})).toBeVisible();
      await expect(page.getByRole('button',{name:/Analyse process data/i})).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-core-hero')).toBeHidden();
      await expect(page.locator('#dashboard .mm-home-kpis')).toBeHidden();

      const specialist=page.locator('#mmSpecialistDashboard');
      await expect(specialist).toBeVisible();
      const specialistParagraph=page.locator('#mmSpecialistDashboard > p');
      await expect(specialistParagraph).toBeHidden();

      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      await page.waitForTimeout(80);
      const geometry=await page.evaluate(()=>{
        const nav=document.querySelector('.mobile-nav');
        const dashboard=document.getElementById('dashboard');
        const visible=[...dashboard.children].filter(x=>getComputedStyle(x).display!=='none');
        const last=visible[visible.length-1];
        const nr=nav.getBoundingClientRect(),lr=last.getBoundingClientRect();
        return {navTop:nr.top,lastBottom:lr.bottom,position:getComputedStyle(nav).position,clearance:getComputedStyle(document.documentElement).getPropertyValue('--mm-mobile-nav-clearance').trim()};
      });
      expect(geometry.position).toBe('fixed');
      expect(geometry.clearance).not.toBe('');
      expect(geometry.lastBottom).toBeLessThanOrEqual(geometry.navTop+1);

      await page.getByRole('button',{name:/Diagnose a moulding problem/i}).click();
      await expect(page.locator('#mmMouldMasterWorkspace')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Troubleshooting casebook'})).toBeVisible();
      await expect(page.locator('.mobile-nav button').filter({hasText:'Practice'})).toHaveAttribute('aria-current','page');
    });

    test('Data diagnosis is directly reachable and mobile active state remains accessible',async({page})=>{
      await openApp(page);
      await page.getByRole('button',{name:/Analyse process data/i}).click();
      await expect(page.locator('#processDataLabs')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Guided Data Diagnosis'})).toBeVisible();
      await expect(page.locator('.mobile-nav button').filter({hasText:'Practice'})).toHaveAttribute('aria-current','page');
    });

    test('Lesson action bar sits above the global mobile navigation',async({page})=>{
      await openApp(page);
      await page.getByRole('button',{name:/Continue lesson/i}).first().click();
      await expect(page.locator('#lesson')).toBeVisible();
      await expect(page.locator('.mm-mobile-actions')).toBeVisible();
      const boxes=await page.evaluate(()=>{
        const local=document.querySelector('.mm-mobile-actions').getBoundingClientRect();
        const global=document.querySelector('.mobile-nav').getBoundingClientRect();
        return {localBottom:local.bottom,globalTop:global.top};
      });
      expect(boxes.localBottom).toBeLessThanOrEqual(boxes.globalTop+1);
      await expect(page.locator('.mobile-nav button').filter({hasText:'Learn'})).toHaveAttribute('aria-current','page');
    });
  });
}

test('capture Android-like Home regression artifact',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.screenshot({path:'qa-artifacts/mobile-home-412x915.png',fullPage:true});
});
