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


test('Material Change Assistant builds a sourced delta report without prescribing production settings',async({page})=>{
  await openMaterials(page,768);
  const root=page.locator('#mmExactMaterialCatalog');
  const assistant=root.locator('[data-mm-material-change-assistant]');
  await expect(assistant).toBeVisible();
  await assistant.locator('[data-mm-change-before]').selectOption('mat-lgchem-lupoy-gp1000ml');
  await assistant.locator('[data-mm-change-after]').selectOption('mat-lgchem-lupoy-gp5206f');
  await assistant.locator('[data-mm-run-material-change]').click();

  const result=assistant.locator('[data-mm-material-change-result]');
  await expect(result).toContainText('LG Chem · LUPOY · GP1000ML → LG Chem · LUPOY · GP5206F');
  await expect(result).toContainText('Identity and composition');
  await expect(result).toContainText('Polymer family');
  await expect(result).toContainText('PC');
  await expect(result).toContainText('PC/ABS');
  await expect(result).toContainText('Drying / moisture');
  await expect(result).toContainText('Drying temperature');
  await expect(result).toContainText('100–120 °C');
  await expect(result).toContainText('75–85 °C');
  await expect(result).toContainText('Maximum moisture content');
  await expect(result).toContainText('No published change');
  await expect(result).toContainText('Rheology / melt-flow evidence');
  await expect(result).toContainText('Not directly comparable');
  await expect(result).toContainText('governed test conditions differ');
  await expect(result).toContainText('Shrinkage evidence');
  await expect(result).toContainText('0.6-0.8 %');
  await expect(result).toContainText('0.2-0.4 %');
  await expect(result).toContainText('Thermal guidance');
  await expect(result).toContainText('Verification actions before an approved process change');
  await expect(result).toContainText('do not copy the old grade recipe');
  await expect(result).toContainText('coupon shrinkage alone is not a warpage prediction');
  await expect(result).toContainText('Evidence coverage');
  await expect(result).toContainText('Unresolved change flags');
  await expect(result).toContainText('Verification gates before site approval');
  await expect(result).toContainText('Material handling evidence');
  await expect(result).toContainText('Machine / mould compatibility');
  await expect(result).toContainText('Controlled trial and acceptance evidence');
  await expect(result).toContainText('Primary-source trail');
  await expect(result.getByRole('link',{name:'Open primary source'})).toHaveCount(2);
  await expect(result).toContainText('does not rank materials');
  await expect(result).toContainText('does not prescribe purge/changeover settings');
  await expect(result).not.toContainText(/set injection temperature to|set mould temperature to|recommended setpoint|winner/i);

  const api=await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.materialChangeReport('mat-lgchem-lupoy-gp1000ml','mat-lgchem-lupoy-gp5206f'));
  expect(api.ready).toBe(true);
  expect(api.identity.some(x=>x.label==='Polymer family'&&x.status==='changed')).toBe(true);
  expect(api.drying.some(x=>x.label==='Maximum moisture content'&&x.status==='unchanged')).toBe(true);
  expect(api.flow.some(x=>x.status==='not-directly-comparable')).toBe(true);
  expect(api.shrinkage.some(x=>x.status==='changed')).toBe(true);
  expect(api.coverage.before.totalCategories).toBe(5);
  expect(api.coverage.after.totalCategories).toBe(5);
  expect(api.flags.length).toBeGreaterThan(0);
  expect(api.validationGates).toHaveLength(5);
  expect(api.validationGates.some(x=>x.id==='controlled-trial'&&x.open===true)).toBe(true);
  expect(api.actions.length).toBeGreaterThanOrEqual(5);
  expect(api.boundary).toMatch(/does not rank materials/);
});

test('Material Change Assistant exposes evidence gaps rather than assuming equivalence',async({page})=>{
  await openMaterials(page,412);
  const report=await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.materialChangeReport('mat-lgchem-lupoy-gp1000l','mat-lgchem-lupoy-gp1000ml'));
  expect(report.ready).toBe(true);
  expect(report.missingBefore).toContain('drying / moisture');
  expect(report.missingBefore).toContain('thermal processing guidance');
  expect(report.missingAfter).not.toContain('drying / moisture');
  expect(report.actions.some(x=>/Close important evidence gaps/.test(x))).toBe(true);
});
