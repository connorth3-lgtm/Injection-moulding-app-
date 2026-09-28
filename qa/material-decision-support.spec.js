const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function openMaterials(page,width=412){
  await page.setViewportSize({width,height:915});
  await page.addInitScript(()=>{
    const id='material-decision-qa',user={id,name:'Material Decision QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_MATERIAL_REGISTRY&&window.MM_PRIMARY_HUBS));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await page.locator('#path [data-mm-hub-action="materials"]').click();
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
}

test('exact-grade decision support exposes drying, shrinkage and condition-matched comparisons without ranking materials',async({page})=>{
  await openMaterials(page);
  const root=page.locator('#mmExactMaterialCatalog');
  await expect(root.locator('[data-mm-material-decision]')).toBeVisible();
  await root.locator('[data-mm-compare-a]').selectOption('mat-lgchem-lupoy-gp1000l');
  await root.locator('[data-mm-compare-b]').selectOption('mat-lgchem-lupoy-gp1000ml');
  await root.locator('[data-mm-run-material-compare]').click();

  const result=root.locator('[data-mm-material-compare-result]');
  await expect(result.locator('.mm-material-compare-card')).toHaveCount(2);
  await expect(result).toContainText('LG Chem · LUPOY · GP1000L');
  await expect(result).toContainText('LG Chem · LUPOY · GP1000ML');
  await expect(result).toContainText('Drying / moisture evidence');
  await expect(result).toContainText('No published drying or moisture observation in this exact-grade record.');
  await expect(result).toContainText('Drying temperature');
  await expect(result).toContainText('100–120 °C');
  await expect(result).toContainText('Maximum moisture content');
  await expect(result).toContainText('0.02 %');
  await expect(result).toContainText('Condition-matched numeric observations');
  await expect(result).toContainText('Melt Flow Rate');
  await expect(result).toContainText('23.4 g/10min');
  await expect(result).toContainText('15 g/10min');
  await expect(result).toContainText('Mould Shrinkage');
  await expect(result).toContainText('Shrinkage / warpage reasoning');
  await expect(result).toContainText('not a part-warpage prediction');
  await expect(result).toContainText('not a material ranking or production recipe');
  await expect(result).not.toContainText(/best material|recommended material|winner/i);

  const checklist=root.locator('.mm-material-change-checklist');
  await expect(checklist).toContainText('Material-change evidence checklist');
  await expect(checklist.locator('li')).toHaveCount(6);
  await expect(checklist).toContainText('Do not copy a drying recipe from another grade.');
  await expect(checklist).toContainText('does not prescribe purge temperatures');

  const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth}));
  expect(geometry.page).toBeLessThanOrEqual(geometry.viewport+1);
});

test('decision support blocks direct numeric comparison when governed test conditions do not match',async({page})=>{
  await openMaterials(page,768);
  const root=page.locator('#mmExactMaterialCatalog');
  await root.locator('[data-mm-compare-a]').selectOption('mat-lgchem-lupoy-gp5206f');
  await root.locator('[data-mm-compare-b]').selectOption('mat-lotte-infino-nh-1034r');
  await root.locator('[data-mm-run-material-compare]').click();
  const result=root.locator('[data-mm-material-compare-result]');
  await expect(result).toContainText('No directly comparable numeric observations.');
  await expect(result).toContainText('test conditions do not form an exact match');
  await expect(result).toContainText('LG Chem · LUPOY · GP5206F');
  await expect(result).toContainText('LOTTE Chemical · INFINO · NH-1034R');

  const api=await page.evaluate(async()=>window.MM_MATERIAL_REGISTRY.decisionComparison(['mat-lgchem-lupoy-gp5206f','mat-lotte-infino-nh-1034r']));
  expect(api.ready).toBe(true);
  expect(api.matched).toHaveLength(0);
  expect(api.boundary).toMatch(/directly comparable only when/);
});
