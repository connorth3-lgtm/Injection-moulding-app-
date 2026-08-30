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
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&document.querySelector('#dashboard .mm-home-task-hub'));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await expect(page.locator('.mobile-nav > button')).toHaveCount(4);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
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

    test('Home is task-first, clear of the fixed nav, and Mould Master is one tap away',async({page})=>{
      await openApp(page);
      await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-task-hub')).toBeVisible();
      await expect(page.locator('#continueBtn')).toBeHidden();
      await expect(page.getByRole('button',{name:/Diagnose a moulding problem/i})).toBeVisible();
      await expect(page.getByRole('button',{name:/Analyse process data/i})).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-core-hero')).toBeHidden();
      await expect(page.locator('#dashboard .mm-home-kpis')).toBeHidden();
      await expectOnlyCurrent(page,'Home');

      const specialist=page.locator('#mmSpecialistDashboard');
      await expect(specialist).toBeVisible();
      await expect(page.locator('#mmSpecialistDashboard > p')).toBeHidden();

      await scrollAppToBottom(page);
      const geometry=await page.evaluate(()=>{
        const nav=document.querySelector('.mobile-nav');
        const dashboard=document.getElementById('dashboard');
        const visible=[...dashboard.children].filter(x=>getComputedStyle(x).display!=='none');
        const last=visible[visible.length-1];
        const nr=nav.getBoundingClientRect(),lr=last.getBoundingClientRect();
        const main=document.querySelector('main.main')||document.querySelector('.main');
        return {navTop:nr.top,lastBottom:lr.bottom,position:getComputedStyle(nav).position,clearance:getComputedStyle(document.documentElement).getPropertyValue('--mm-mobile-nav-clearance').trim(),mainPaddingBottom:main?getComputedStyle(main).paddingBottom:''};
      });
      expect(geometry.position).toBe('fixed');
      expect(geometry.clearance).not.toBe('');
      expect(geometry.mainPaddingBottom).not.toBe('0px');
      expect(geometry.lastBottom).toBeLessThanOrEqual(geometry.navTop+1);

      await page.getByRole('button',{name:/Diagnose a moulding problem/i}).click();
      await expect(page.locator('#mmMouldMasterWorkspace')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Troubleshooting casebook'})).toBeVisible();
      await expectOnlyCurrent(page,'Practice');
    });

    test('Data diagnosis and the 50-case deep dive are directly reachable',async({page})=>{
      await openApp(page);
      await page.getByRole('button',{name:/Analyse process data/i}).click();
      await expect(page.locator('#processDataLabs')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Guided Data Diagnosis'})).toBeVisible();
      await expect(page.getByRole('button',{name:'Open 50-case data deep dive'})).toBeVisible();
      await expectOnlyCurrent(page,'Practice');

      await page.getByRole('button',{name:'Open 50-case data deep dive'}).click();
      await expect(page.getByRole('heading',{name:'50-case data deep dive'})).toBeVisible();
      await expect(page.locator('.dd50-card')).toHaveCount(50);
      await page.locator('[data-dd50-kind]').selectOption('quality-sensor');
      await expect(page.locator('.dd50-card')).toHaveCount(10);
      await page.locator('.dd50-card [data-dd50-open]').first().click();
      await expect(page.getByText('Baseline → fault → recovery')).toBeVisible();
      await expect(page.locator('.dd50-table tbody tr')).toHaveCount(4);
      await expect(page.getByText('Ranked mechanism:')).toBeVisible();
      await expect(page.getByText('Best next evidence:')).toBeVisible();
      await expect(page.getByRole('button',{name:'Export 72-cycle CSV'})).toBeVisible();
      await expectOnlyCurrent(page,'Practice');
    });

    test('Open 20-pass · 200-case atlas, filter a pass, and inspect the full evidence chain',async({page})=>{
      await openApp(page);
      await page.getByRole('button',{name:/Analyse process data/i}).click();
      await expect(page.getByRole('button',{name:'Open 20-pass · 200-case atlas'})).toBeVisible();
      await page.getByRole('button',{name:'Open 20-pass · 200-case atlas'}).click();
      await expect(page.getByRole('heading',{name:'200 advanced process-data cases'})).toBeVisible();
      await expect(page.locator('.at20-card')).toHaveCount(200);
      await page.locator('[data-at20-pass]').selectOption('16');
      await expect(page.locator('.at20-card')).toHaveCount(10);
      await page.getByRole('button',{name:'Inspect evidence case'}).first().click();
      await expect(page.locator('.at20-table tbody tr')).toHaveCount(4);
      await expect(page.getByText('Ranked root-cause mechanism')).toBeVisible();
      await expect(page.getByText('Best next evidence')).toBeVisible();
      await expect(page.getByText('Verification')).toBeVisible();
      await expect(page.getByText(/Compensation trap/i)).toBeVisible();
      await expect(page.getByText(/Baseline index 100/i)).toBeVisible();
      await expect(page.getByRole('button',{name:'Export 72-cycle CSV'})).toBeVisible();
      await expectOnlyCurrent(page,'Practice');
    });

    test('Local shot CSV intake strips raw identifiers in the real UI',async({page})=>{
      await openApp(page);
      await page.getByRole('button',{name:/Analyse process data/i}).click();
      await expect(page.getByRole('button',{name:'Prepare real shot CSV locally'})).toBeVisible();
      await page.getByRole('button',{name:'Prepare real shot CSV locally'}).click();
      await expect(page.getByRole('heading',{name:'Prepare shot data without uploading it'})).toBeVisible();
      const csv='timestamp,machine,mould,material_grade,material_lot,customer_name,fill_time_s,cushion_mm,quality_result,comment\n2026-08-26T10:00:00Z,IMM-SECRET,TOOL-SECRET,PA66-GF30,LOT-SECRET,Customer Secret,1.20,4.5,PASS,private note\n2026-08-26T10:00:30Z,IMM-SECRET,TOOL-SECRET,PA66-GF30,LOT-SECRET,Customer Secret,1.24,4.4,FAIL,private note two\n';
      await page.locator('[data-pdi-file]').setInputFiles({name:'shot-export.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
      await expect(page.locator('.pdi-kpi').first()).toContainText('2');
      await expect(page.locator('.pdi-rule').filter({hasText:'timestamp'}).locator('b.drop')).toHaveText('drop');
      await expect(page.locator('.pdi-rule').filter({hasText:'machine'}).locator('b.alias')).toHaveText('alias');
      await expect(page.locator('.pdi-rule').filter({hasText:'fill_time_s'}).locator('b.keep')).toHaveText('keep');
      await expect(page.locator('.pdi-rule').filter({hasText:'quality_result'}).locator('b.quality')).toHaveText('quality');
      await expect(page.getByRole('button',{name:'Export prepared CSV'})).toBeEnabled();
      await expect(page.getByRole('button',{name:'Export data dictionary'})).toBeEnabled();
      await expect(page.locator('body')).not.toContainText('IMM-SECRET');
      await expect(page.locator('body')).not.toContainText('TOOL-SECRET');
      await expect(page.locator('body')).not.toContainText('Customer Secret');
      await expectOnlyCurrent(page,'Practice');
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
      await expectOnlyCurrent(page,'Learn');
    });

    test('Primary mobile navigation and More tools are keyboard reachable',async({page})=>{
      await openApp(page);
      const nav=page.locator('.mobile-nav > button');
      const expected=['Home','Learn','Practice','More'];
      await nav.nth(0).focus();
      for(let i=0;i<expected.length;i++){
        const focused=await page.evaluate(()=>document.activeElement?.textContent||'');
        expect(focused).toContain(expected[i]);
        if(i<expected.length-1)await page.keyboard.press('Tab');
      }
      await page.keyboard.press('Enter');
      await expect(page.locator('#modal .modal-card')).toBeVisible();
      await expect(page.locator('[data-mm-registry-menu="mould-master"]')).toHaveCount(1);
      await expect(page.locator('[data-mm-registry-menu="process-data"]')).toHaveCount(1);
      await expect(page.locator('[data-mm-registry-menu="learning-insights"]')).toHaveCount(1);
      await expect(page.locator('[data-mm-registry-menu="repair-app-files"]')).toHaveCount(1);
      const insights=page.locator('[data-mm-registry-menu="learning-insights"]');
      await insights.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#learningInsights')).toBeVisible();
      await expectOnlyCurrent(page,'More');
    });
  });
}

test('late dashboard modules recompose idempotently without duplicating adopted Home content',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await page.evaluate(()=>{
    window.__qaLateRenderCount=0;
    window.__qaLateUnregister=window.MM_APP_SHELL.dashboard.register({
      id:'qa-late-dashboard',zone:'after',order:95,
      render:slot=>{window.__qaLateRenderCount+=1;slot.innerHTML='<section id="qaLateDashboard">Late module</section>'}
    });
  });
  await expect(page.locator('[data-mm-dashboard-section="qa-late-dashboard"]')).toHaveCount(1);
  await page.evaluate(()=>{window.MM_APP_SHELL.dashboard.compose();window.MM_APP_SHELL.dashboard.compose()});
  await expect(page.locator('[data-mm-dashboard-section="qa-late-dashboard"]')).toHaveCount(1);
  await expect(page.locator('#dashboard .mm-today-focus')).toHaveCount(1);
  await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(1);
  expect(await page.evaluate(()=>window.__qaLateRenderCount)).toBeGreaterThanOrEqual(1);
  await page.evaluate(()=>window.__qaLateUnregister());
  await expect(page.locator('[data-mm-dashboard-section="qa-late-dashboard"]')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-today-focus')).toHaveCount(1);
  await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(1);
});

test('capture Android-like Home regression artifact after bootstrap is gone',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await expect(page.locator('#mmBootstrap')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-home-task-hub')).toBeVisible();
  await page.screenshot({path:'qa-artifacts/mobile-home-412x915.png',fullPage:true});
});
