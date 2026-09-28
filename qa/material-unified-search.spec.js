const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function openMaterials(page,width=412){
  await page.setViewportSize({width,height:915});
  await page.addInitScript(()=>{
    const id='material-unified-search-qa',user={id,name:'Material Search QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_MATERIAL_REGISTRY&&window.MM_MATERIAL_SEARCH&&window.MM_MATERIAL_SEARCH_PAGINATION&&window.MM_REFERENCE_DATA&&window.MM_MATERIAL_BEHAVIOUR_LABS));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
  await page.locator('#path [data-mm-hub-action="materials"]').click();
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  await expect(page.locator('[data-mm-all-material-index]')).toBeVisible();
}

test('unified material index searches exact-grade processing evidence, family reference data and material labs',async({page})=>{
  await openMaterials(page);
  const root=page.locator('#mmExactMaterialCatalog');
  const query=root.locator('[data-mm-all-material-query]');
  const type=root.locator('[data-mm-all-material-type]');
  const results=root.locator('[data-mm-all-material-results]');
  const status=root.locator('[data-mm-all-material-status]');

  await type.selectOption('exact-grade');
  await query.fill('maximum moisture content');
  await expect(status).toContainText('matching material records');
  await expect(results.locator('[data-mm-material-index-type="exact-grade"]')).not.toHaveCount(0);
  await expect(results).toContainText('LG Chem · LUPOY · GP1000ML');
  await expect(results).toContainText('Maximum moisture content');

  await type.selectOption('reference-material');
  await query.fill('hydrolysis');
  await expect(results.locator('[data-mm-material-index-type="reference-material"]')).toHaveCount(1);
  await expect(results).toContainText('PBT');
  await expect(results).toContainText(/hydrolysis/i);

  await type.selectOption('material-lab');
  await query.fill('formaldehyde');
  await expect(results.locator('[data-mm-material-index-type="material-lab"]')).toHaveCount(1);
  await expect(results).toContainText('POM: thermal abuse is a material-safety problem');
  await expect(results).toContainText(/formaldehyde/i);

  await type.selectOption('');
  await query.fill('warpage');
  await expect(results.locator('[data-mm-material-index-result]')).not.toHaveCount(0);
  const types=await results.locator('[data-mm-material-index-result]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.mmMaterialIndexType))]);
  expect(types.length).toBeGreaterThan(1);

  const stats=await page.evaluate(()=>window.MM_MATERIAL_SEARCH.stats());
  expect(stats.documents).toBeGreaterThan(stats.grades);
  expect(stats.types).toContain('exact-grade');
  expect(stats.types).toContain('reference-material');
  expect(stats.types).toContain('material-lab');

  const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth}));
  expect(geometry.page).toBeLessThanOrEqual(geometry.viewport+1);
});

test('unified index can jump an exact-grade result into the exact-grade catalog search',async({page})=>{
  await openMaterials(page,768);
  const root=page.locator('#mmExactMaterialCatalog');
  await root.locator('[data-mm-all-material-type]').selectOption('exact-grade');
  await root.locator('[data-mm-all-material-query]').fill('GP5206F');
  const result=root.locator('[data-mm-material-index-result="grade:mat-lgchem-lupoy-gp5206f"]');
  await expect(result).toBeVisible();
  await result.getByRole('button',{name:'Show exact grade'}).click();
  await expect(root.locator('[data-mm-exact-query]')).toHaveValue('mat-lgchem-lupoy-gp5206f');
  await expect(root.locator('[data-mm-material-grade="mat-lgchem-lupoy-gp5206f"]')).toBeVisible();
  await expect(root.locator('[data-mm-material-grade]')).toHaveCount(1);
});


test('material catalogue can browse exact grades by region, country, manufacturer and family without implying origin',async({page})=>{
  await openMaterials(page,768);
  const root=page.locator('#mmExactMaterialCatalog');
  const region=root.locator('[data-mm-all-material-region]');
  const country=root.locator('[data-mm-all-material-country]');
  const manufacturer=root.locator('[data-mm-all-material-manufacturer]');
  const family=root.locator('[data-mm-all-material-family]');
  const type=root.locator('[data-mm-all-material-type]');
  const results=root.locator('[data-mm-all-material-results]');
  const boundary=root.locator('[data-mm-catalogue-boundary]');

  await expect(boundary).toContainText("manufacturer's country");
  await expect(boundary).toContainText(/does not prove exact-grade manufacturing origin|neither proves exact-grade manufacturing origin/i);

  await type.selectOption('exact-grade');
  await region.selectOption({label:'Asia-Pacific'});
  await country.selectOption({label:'South Korea'});
  await expect(results.locator('[data-mm-material-index-type="exact-grade"]')).not.toHaveCount(0);
  await expect(results).toContainText('Asia-Pacific');
  await expect(results).toContainText('South Korea');

  const manufacturerOptions=await manufacturer.locator('option').evaluateAll(opts=>opts.map(o=>({value:o.value,text:o.textContent||''})));
  const lg=manufacturerOptions.find(o=>/LG Chem/.test(o.text));
  expect(lg).toBeTruthy();
  await manufacturer.selectOption(lg.value);

  const familyOptions=await family.locator('option').evaluateAll(opts=>opts.map(o=>o.textContent||''));
  expect(familyOptions).toContain('PC');
  await family.selectOption('PC');

  await expect(results).toContainText(/LG Chem/);
  await expect(results).toContainText(/PC/);

  const facets=await page.evaluate(()=>window.MM_MATERIAL_SEARCH.facets());
  expect(facets.regions).toContain('Asia-Pacific');
  expect(facets.countries).toContain('South Korea');
  expect(facets.boundary).toMatch(/does not prove exact-grade manufacturing origin|neither field proves exact-grade manufacturing origin/i);
});
