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
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await expect(page.locator('.mobile-nav > button')).toHaveCount(5);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function openPracticeHub(page){
  await page.locator('.mobile-nav > button').filter({hasText:'Practice'}).click();
  await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
  await expectOnlyCurrent(page,'Practice');
}
async function openPracticeAction(page,action){
  const button=page.locator(`#scenarios [data-mm-hub-action="${action}"]`);
  await expect(button).toBeVisible();
  await button.click();
}
async function openLearnHub(page){
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  await expectOnlyCurrent(page,'Learn');
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

    test('Home is lean, XP-free, includes the Book resume surface, and Practice owns troubleshooting',async({page})=>{
      await openApp(page);
      await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
      const homeBook=page.locator('#dashboard [data-mm-home-book]');
      await expect(homeBook).toHaveCount(1);
      await expect(homeBook).toBeVisible();
      await expect(homeBook).toHaveAttribute('aria-label','MouldMaster Book');
      await expect(homeBook.getByRole('button',{name:/Open Book|Keep Reading/})).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(0);
      await expect(page.locator('#dashboard .mm-home-utility')).toHaveCount(0);
      await expect(page.locator('#dashboard .mm-home-balance')).toBeVisible();
      await expect(page.locator('#dashboard .mm-home-balance [data-mm-home-action]')).toHaveCount(2);
      await expect(page.locator('#dashboard .mm-home-balance')).not.toContainText(/Materials|Practice|Saved lessons|Browse learning|Reference book/i);
      const firstViewport=await page.evaluate(()=>{
        const focus=document.querySelector('#dashboard .mm-today-focus').getBoundingClientRect();
        const book=document.querySelector('#dashboard [data-mm-home-book]').getBoundingClientRect();
        const tools=document.querySelector('#dashboard .mm-home-balance').getBoundingClientRect();
        const nav=document.querySelector('.mobile-nav').getBoundingClientRect();
        return {focusBottom:focus.bottom,bookTop:book.top,bookBottom:book.bottom,toolsTop:tools.top,navTop:nav.top};
      });
      expect(firstViewport.bookTop).toBeGreaterThanOrEqual(firstViewport.focusBottom-1);
      expect(firstViewport.bookBottom).toBeLessThanOrEqual(firstViewport.navTop+2);
      expect(firstViewport.toolsTop).toBeGreaterThanOrEqual(firstViewport.bookBottom-1);
      await expect(page.locator('#continueBtn')).toBeHidden();
      await expect(page.locator('#dashboard .mm-home-core-hero')).toBeHidden();
      await expect(page.locator('#dashboard .mm-home-kpis')).toBeHidden();
      await expect(page.locator('#dashboard .fun-dashboard')).toHaveCount(0);
      await expect(page.locator('#dashboard')).not.toContainText(/\bXP\b/i);
      await expect(page.locator('#dashboard')).not.toContainText(/workshop rank|learning streak|badges/i);
      await expect(page.locator('#mm-src-open')).toBeHidden();
      await expect(page.locator('#mmrd-open')).toBeHidden();
      await expectOnlyCurrent(page,'Home');

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

      await openPracticeHub(page);
      await openPracticeAction(page,'troubleshooting');
      await expect(page.locator('#defects').getByRole('heading',{name:'Defect Finder + Troubleshooting Coach'})).toBeVisible();
      await expect(page.locator('#defects [data-mm-dx-action="choose"]').first()).toBeVisible();
      await expect(page.locator('#modal')).toHaveClass(/hidden/);
      await expectOnlyCurrent(page,'Practice');
      // Mould Master remains separately reachable from the Home specialist tools.
      await page.evaluate(()=>switchView('dashboard'));
      await page.locator('#dashboard [data-mm-home-action="mould-master"]').click();
      await expect(page.locator('#mmMouldMasterWorkspace')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Troubleshooting casebook'})).toBeVisible();
    });

    test('Data diagnosis and the 50-case deep dive are directly reachable from Practice',async({page})=>{
      await openApp(page);
      await openPracticeHub(page);
      await openPracticeAction(page,'process-data');
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
    test('Open 20-pass · 200-case atlas from Practice, filter a pass, and inspect the full evidence chain',async({page})=>{
      await openApp(page);
      await openPracticeHub(page);
      await openPracticeAction(page,'process-data');
      await expect(page.getByRole('button',{name:'Open 20-pass · 200-case atlas'})).toBeVisible();
      await page.getByRole('button',{name:'Open 20-pass · 200-case atlas'}).click();
      await expect(page.getByRole('heading',{name:'200 advanced process-data cases'})).toBeVisible();
      await expect(page.locator('.at20-card')).toHaveCount(200);
      await page.locator('[data-at20-pass]').selectOption('16');
      await expect(page.locator('.at20-card')).toHaveCount(10);
      await page.getByRole('button',{name:'Inspect evidence case'}).first().click();
      await expect(page.locator('.at20-table tbody tr')).toHaveCount(4);
      await expect(page.getByText('Ranked root-cause mechanism')).toBeVisible();
      await expect(page.getByText('Best next evidence',{exact:true})).toBeVisible();
      await expect(page.getByText('Verification',{exact:true})).toBeVisible();
      await expect(page.getByText(/Compensation trap/i)).toBeVisible();
      await expect(page.getByText(/Baseline index 100/i)).toBeVisible();
      await expect(page.getByRole('button',{name:'Export 72-cycle CSV'})).toBeVisible();
      await expectOnlyCurrent(page,'Practice');
    });

    test('Local shot CSV intake strips raw identifiers in the real UI',async({page})=>{
      await openApp(page);
      await openPracticeHub(page);
      await openPracticeAction(page,'process-data');
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

    test('Lesson opens at the top without the duplicate fixed completion bar',async({page})=>{
      await openApp(page);
      await openLearnHub(page);
      await scrollAppToBottom(page);
      await page.getByRole('button',{name:/Continue lesson/i}).first().click();
      await expect(page.locator('#lesson')).toBeVisible();
      await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
      await expect(page.locator('.mm-mobile-actions')).toBeHidden();
      const position=await page.evaluate(()=>({windowY:window.scrollY||0,rootY:document.scrollingElement?.scrollTop||0}));
      expect(position.windowY).toBeLessThanOrEqual(1);
      expect(position.rootY).toBeLessThanOrEqual(1);
      await expectOnlyCurrent(page,'Learn');
    });

    test('Primary mobile navigation and the reduced More tools are keyboard reachable',async({page})=>{
      await openApp(page);
      const nav=page.locator('.mobile-nav > button');
      const expected=['Home','Learn','Materials','Practice','More'];
      await nav.nth(0).focus();
      for(let i=0;i<expected.length;i++){
        const focused=await page.evaluate(()=>document.activeElement?.textContent||'');
        expect(focused).toContain(expected[i]);
        if(i<expected.length-1)await page.keyboard.press('Tab');
      }
      await page.keyboard.press('Enter');
      await expect(page.locator('#modal .modal-card')).toBeVisible();
      await expect(page.locator('[data-mm-registry-menu="mould-master"]')).toHaveCount(0);
      await expect(page.locator('[data-mm-registry-menu="process-data"]')).toHaveCount(0);
      await expect(page.locator('[data-mm-registry-menu="diagnostic-labs"]')).toHaveCount(0);
      await expect(page.locator('[data-mm-registry-menu="material-labs"]')).toHaveCount(0);
      await expect(page.locator('#modal .quick-action').filter({hasText:'Process simulator'})).toHaveCount(0);
      await expect(page.locator('#modal .quick-action').filter({hasText:'Defect finder'})).toHaveCount(0);
      await expect(page.locator('#modal .quick-action').filter({hasText:'Troubleshooting coach'})).toHaveCount(0);
      await expect(page.locator('[data-mm-registry-menu="book"]')).toHaveCount(1);
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

test('late dashboard modules recompose idempotently without making retired Home sections visible',async({page})=>{
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
  await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__qaLateRenderCount)).toBeGreaterThanOrEqual(1);
  await page.evaluate(()=>window.__qaLateUnregister());
  await expect(page.locator('[data-mm-dashboard-section="qa-late-dashboard"]')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-today-focus')).toHaveCount(1);
  await expect(page.locator('#dashboard .mm-home-task-hub')).toHaveCount(0);
});

test('capture Android-like Home regression artifact after bootstrap is gone and retired gamification is absent',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await expect(page.locator('#mmBootstrap')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
  await expect(page.locator('#dashboard .mm-home-task-hub')).toBeHidden();
  await expect(page.locator('#dashboard .fun-dashboard')).toHaveCount(0);
  await expect(page.locator('#dashboard')).not.toContainText(/\bXP\b/i);
  await expect(page.locator('#dashboard')).not.toContainText(/workshop rank|learning streak|badges/i);
  await page.screenshot({path:'qa-artifacts/mobile-home-412x915.png',fullPage:true});
});


test('UI audit contract: one page title, compact header actions, useful Home, dense hubs, and unobstructed lesson content',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await expect(page.locator('#dashboard .mm-home-utility')).toHaveCount(0);
  await expect(page.locator('#dashboard .mm-home-balance')).toBeVisible();
  expect(await page.evaluate(()=>{
    const focus=document.querySelector('#dashboard .mm-today-focus');
    const workbench=document.querySelector('#dashboard .mm-home-balance');
    return Boolean(focus&&workbench&&(focus.compareDocumentPosition(workbench)&Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBeTruthy();
  const searchBox=await page.locator('#searchBtn').boundingBox();
  expect(searchBox.width).toBeLessThanOrEqual(48);
  expect(searchBox.height).toBeGreaterThanOrEqual(44);
  const listen=page.locator('.mm-read-aloud');
  await expect(listen).toBeVisible();
  expect(await listen.evaluate(el=>el.parentElement?.classList.contains('top-actions'))).toBeTruthy();

  await openLearnHub(page);
  await expect(page.locator('body[data-mm-view="path"] .topbar>div:first-child')).toBeHidden();
  await expect(page.locator('#path .mm-primary-hub-head h1')).toHaveCount(1);
  expect(await page.locator('#path .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);

  await openPracticeHub(page);
  await expect(page.locator('body[data-mm-view="scenarios"] .topbar>div:first-child')).toBeHidden();
  expect(await page.locator('#scenarios .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);

  await openLearnHub(page);
  await page.getByRole('button',{name:/Continue lesson/i}).first().click();
  await expect(page.locator('#lesson .lesson-quest')).toHaveCount(0);
  await expect(page.locator('#lesson .mm-simple-lesson-start')).toHaveCount(0);
  await expect(page.locator('body[data-mm-view="lesson"] .topbar>div:first-child')).toBeHidden();
  const overlap=await page.evaluate(()=>{
    const a=document.querySelector('.mm-read-aloud details')?.getBoundingClientRect();
    const lesson=document.querySelector('#lesson .mm-simple-lesson-hero')?.getBoundingClientRect();
    if(!a||!lesson)return true;
    return !(a.right<=lesson.left||a.left>=lesson.right||a.bottom<=lesson.top||a.top>=lesson.bottom);
  });
  expect(overlap).toBeFalsy();
});

test('active Mission Control does not cover Book or clip context on Android-size Home',async({page})=>{
  // Regression for a user Android capture: stage bar over Book CTA and clipped context.
  // Assert rendered browser geometry, not just the presence of CSS strings.
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.waitForFunction(()=>Boolean(window.MM_MISSION_CONTROL?.startMission));
  const mc=page.locator('#mmMissionControl');
  const book=page.locator('#dashboard [data-mm-home-book]');
  await page.evaluate(()=>window.MM_MISSION_CONTROL.startMission({
    title:'QA mobile mission layout only',
    kind:'investigation',
    stage:'baseline',
    context:{
      machine:'Electric press — long QA machine context',
      mould:'Four-cavity training mould context',
      material:'Engineering polymer example grade',
      part:'Long fictional housing reference',
      caseId:'QA-MOBILE-CONTEXT-CASE'
    }
  }));
  await expect(mc.locator('.mm-mc-timeline')).toBeVisible();
  await expect(book).toBeVisible();
  await expect(mc.locator('[data-mm-mc-stage]')).toHaveCount(8);

  for(const width of [320,360,390,412]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const geometry=await page.evaluate(()=>{
      const root=document.querySelector('#mmMissionControl');
      const context=root.querySelector('.mm-mc-context-items');
      const timeline=root.querySelector('.mm-mc-timeline');
      const next=root.querySelector('[data-mm-mc-next]');
      const stages=[...root.querySelectorAll('[data-mm-mc-stage]')];
      const focus=document.querySelector('#dashboard .mm-today-focus');
      const book=document.querySelector('#dashboard [data-mm-home-book]');
      const main=document.querySelector('main.main')||document.querySelector('.main');
      const cr=context.getBoundingClientRect();
      const tr=timeline.getBoundingClientRect();
      const fr=focus.getBoundingClientRect();
      const br=book.getBoundingClientRect();
      const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const visibleText=[...context.querySelectorAll('b')].every(label=>{
        const box=label.getBoundingClientRect();
        return box.left>=cr.left-1&&box.right<=cr.right+1&&
          label.scrollWidth<=label.clientWidth+1;
      });
      return {
        position:getComputedStyle(timeline).position,
        columns:getComputedStyle(context).gridTemplateColumns.trim().split(/\s+/).length,
        contextScroll:context.scrollWidth-context.clientWidth,
        contextFits:visibleText,
        contextBottom:cr.bottom,
        stageTop:tr.top,stageBottom:tr.bottom,
        firstCardTop:fr.top,bookTop:br.top,
        overlapsFocus:overlap(tr,fr),
        overlapsBook:overlap(tr,br),
        nextHeight:next.getBoundingClientRect().height,
        minStageHeight:Math.min(...stages.map(el=>el.getBoundingClientRect().height)),
        totalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        mainPaddingBottom:parseFloat(getComputedStyle(main).paddingBottom)
      };
    });
    expect(geometry.position,'stage bar must be in normal flow at '+width).not.toBe('fixed');
    expect(geometry.position,'stage bar must not float over cards at '+width).not.toBe('sticky');
    expect(geometry.stageTop,'timeline follows context at '+width).toBeGreaterThanOrEqual(geometry.contextBottom-2);
    expect(geometry.firstCardTop,'focus follows timeline at '+width).toBeGreaterThanOrEqual(geometry.stageBottom-2);
    expect(geometry.bookTop,'Book follows timeline at '+width).toBeGreaterThanOrEqual(geometry.stageBottom-2);
    expect(geometry.overlapsFocus).toBe(false);
    expect(geometry.overlapsBook).toBe(false);
    expect(geometry.columns,'no horizontally clipped context at '+width).toBe(width<=320?1:2);
    expect(geometry.contextScroll,'context must not scroll sideways at '+width).toBeLessThanOrEqual(1);
    expect(geometry.contextFits,'every context value must fit at '+width).toBe(true);
    expect(geometry.totalOverflow,'no page-wide horizontal overflow at '+width).toBeLessThanOrEqual(1);
    expect(geometry.nextHeight).toBeGreaterThanOrEqual(44);
    expect(geometry.minStageHeight).toBeGreaterThanOrEqual(44);
    expect(geometry.mainPaddingBottom).toBeGreaterThan(0);
  }

  // The Book CTA must remain tappable when scrolled into view.
  await page.setViewportSize({width:390,height:844});
  const button=book.locator('button').first();
  await button.scrollIntoViewIfNeeded();
  const unobstructed=await button.evaluate(btn=>{
    const r=btn.getBoundingClientRect();
    const x=Math.max(1,Math.min(innerWidth-2,(r.left+r.right)/2));
    const y=Math.max(1,Math.min(innerHeight-2,(r.top+r.bottom)/2));
    const top=document.elementFromPoint(x,y);
    return Boolean(top&&(top===btn||btn.contains(top)));
  });
  expect(unobstructed,'Book CTA must not be masked by mission or mobile chrome').toBe(true);
});
