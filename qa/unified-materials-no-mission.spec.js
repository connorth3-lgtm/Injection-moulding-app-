const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'unified-ui-qa',name:'Unified UI QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'unified-ui-qa',users:{'unified-ui-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_MATERIAL_SEARCH_PAGINATION&&window.MM_MISSION_CONTROL&&window.MM_APP_SHELL_FINALIZED);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}
for(const width of [320,360,390,412]){
  test(`unified mobile Materials at ${width}px has one search, one list, and per-grade actions`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await openApp(page);
    await page.locator('.mobile-nav > button').filter({hasText:'Materials'}).click();
    const cat=page.locator('#mmExactMaterialCatalog');
    await expect(cat).toBeVisible();
    await expect(cat.locator('[data-mm-all-material-index]')).toHaveCount(1);
    await expect(cat.getByRole('heading',{name:'All materials'})).toBeVisible();
    await expect(cat.locator('[data-mm-exact-query]')).toBeHidden();
    await expect(cat.locator('[data-mm-exact-manufacturer]')).toBeHidden();
    await expect(cat.locator('[data-mm-exact-results]')).toBeHidden();
    await expect(cat.locator('[data-mm-all-material-query]')).toBeVisible();
    await expect(cat.locator('[data-mm-all-material-results]')).toBeVisible();
    await expect(cat.locator('[data-mm-all-material-filters]')).not.toHaveAttribute('open','');
    await cat.locator('[data-mm-all-material-query]').fill('GP5206F');
    const result=cat.locator('[data-mm-material-index-result="grade:mat-lgchem-lupoy-gp5206f"]');
    await expect(result).toHaveCount(1);
    await result.locator('summary').first().click();
    await expect(result).toHaveAttribute('open','');
    await expect(result.locator('[data-mm-material-grade="mat-lgchem-lupoy-gp5206f"]')).toBeVisible();
    await expect(result).toContainText('3 sourced properties');
    const gradeDetails=result.locator('details.mm-exact-detail');
    await gradeDetails.locator('summary').click();
    await expect(gradeDetails).toContainText('Primary sources');
    await expect(gradeDetails).toContainText('Maximum moisture content');
    await expect(gradeDetails.locator('.mm-exact-sources a')).toHaveCount(1);
    await expect(result.getByRole('button',{name:'Start Mould Master case'})).toBeVisible();
    await expect(result.getByRole('button',{name:'Compare grades'})).toBeVisible();
    await expect(result.getByRole('button',{name:'Change assistant'})).toBeVisible();
    await expect(result.getByRole('button',{name:'Material learning'})).toBeVisible();
    await result.getByRole('button',{name:'Compare grades'}).click();
    await expect(cat.locator('[data-mm-material-workflows]')).toHaveAttribute('open','');
    await expect(cat.locator('[data-mm-compare-a]')).toHaveValue('mat-lgchem-lupoy-gp5206f');
    await result.getByRole('button',{name:'Change assistant'}).click();
    await expect(cat.locator('[data-mm-change-before]')).toHaveValue('mat-lgchem-lupoy-gp5206f');
    const widthDiff=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(widthDiff).toBeLessThanOrEqual(2);
  });
}
test('all primary routes hide the retired mission case grid/stepper while saving evidence',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openApp(page);
  await page.evaluate(()=>{
    window.MM_MISSION_CONTROL.startMission({title:'QA saved material case',context:{machine:'Electric press',material:'PA11',caseId:'QA-PRIVATE-CASE'}});
    window.MM_MISSION_CONTROL.addEvidence({kind:'measured',text:'QA source-backed record'});
  });
  for(const view of ['dashboard','path','materials','scenarios']){
    await page.evaluate(v=>switchView(v),view);
    const mc=page.locator('#mmMissionControl');
    await expect(mc).toHaveCount(1);
    await expect(mc.locator('.mm-mc-context')).toHaveCount(0);
    await expect(mc.locator('.mm-mc-timeline')).toHaveCount(0);
    await expect(mc.locator('.mm-mc-context-items')).toHaveCount(0);
    await expect(mc.locator('[data-mm-mc-next]')).toHaveCount(0);
  }
  const state=await page.evaluate(()=>window.MM_MISSION_CONTROL.state());
  expect(state.mission.context.caseId).toBe('QA-PRIVATE-CASE');
  expect(state.evidence).toHaveLength(1);
  await page.evaluate(()=>window.MM_MISSION_CONTROL.toggleDrawer(true));
  await expect(page.locator('#mmMissionControl .mm-mc-evidence-row')).toContainText('QA source-backed record');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#mmMissionControl .mm-mc-palette')).toBeVisible();
});
