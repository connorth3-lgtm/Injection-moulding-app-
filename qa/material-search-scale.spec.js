const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function seed(page){
  await page.addInitScript(()=>{
    const user={id:'material-scale-qa',name:'Material Scale QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'material-scale-qa',users:{'material-scale-qa':user}}));
  });
}
async function installScaleCatalog(page){
  await page.evaluate(async()=>{
    const original=await window.MM_MATERIAL_REGISTRY.all();
    const byManufacturer=[];
    for(const grade of original||[]){if(!byManufacturer.some(x=>x.manufacturer?.id===grade.manufacturer?.id))byManufacturer.push(grade)}
    const templates=byManufacturer.slice(0,3);
    if(templates.length<2)throw new Error('scale fixture needs at least two source manufacturers');
    const synthetic=Array.from({length:72},(_,i)=>{
      const src=JSON.parse(JSON.stringify(templates[i%templates.length]));
      const n=String(i+1).padStart(3,'0');
      src.id=`qa-scale-${n}`;
      src.brand='ScaleLab';
      src.grade=`SCALE-${n}`;
      src.aliases=[...(src.aliases||[]),'scale fixture'];
      src.provenance={...(src.provenance||{}),notes:'Synthetic browser-scale fixture derived from an already-authorized runtime record; never production material evidence.'};
      return src;
    });
    window.MM_MATERIAL_SEARCH._buildForTest(synthetic);
  });
}

async function openMaterials(page){
  await seed(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_MATERIAL_REGISTRY&&window.MM_MATERIAL_SEARCH&&window.MM_MATERIAL_SEARCH_PAGINATION&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await installScaleCatalog(page);
  await page.locator('.mobile-nav > button').filter({hasText:'Materials'}).click();
  await expect(page.locator('#mmExactMaterialCatalog')).toHaveCount(1);
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog')).toHaveAttribute('data-mm-material-search-mode','indexed');
}

test('unified materials catalogue paginates 72 exact grades without exposing a second hidden list',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openMaterials(page);
  const root=page.locator('#mmExactMaterialCatalog');
  const search=root.locator('[data-mm-all-material-query]');
  const status=root.locator('[data-mm-all-material-status]');
  const rows=root.locator('[data-mm-material-index-result]');
  const previous=root.locator('[data-mm-all-material-page="previous"]');
  const next=root.locator('[data-mm-all-material-page="next"]');

  await search.fill('ScaleLab');
  await expect(status).toContainText('72 matching material records · page 1 of 6');
  await expect(rows).toHaveCount(12);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const firstPageFirst=await rows.first().getAttribute('data-mm-material-index-result');

  await next.click();
  await expect(status).toContainText('page 2 of 6');
  await expect(rows).toHaveCount(12);
  await expect(previous).toBeEnabled();
  const secondPageFirst=await rows.first().getAttribute('data-mm-material-index-result');
  expect(secondPageFirst).not.toBe(firstPageFirst);

  await search.fill('SCALE-001');
  await expect(status).toContainText('1 matching material records · page 1 of 1');
  await expect(rows).toHaveCount(1);
  await expect(previous).toBeDisabled();
  await expect(next).toBeDisabled();

  await search.fill('ScaleLab');
  await expect(status).toContainText('72 matching material records · page 1 of 6');
  const filters=root.locator('[data-mm-all-material-filters]');
  await filters.locator('summary').click();
  const manufacturer=filters.locator('[data-mm-all-material-manufacturer]');
  await manufacturer.selectOption({index:1});
  await expect(status).toContainText('matching material records · page 1 of');
  const filteredCount=Number((await status.textContent()).match(/^(\d+) matching/)?.[1]);
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(72);
  await expect(rows.first()).toBeVisible();
  await expect(status).toHaveAttribute('role','status');
  await expect(status).toHaveAttribute('aria-live','polite');

  // The underlying 24-row indexed grade service stays testable without
  // making its old duplicate catalogue visible to learners.
  const indexed=await page.evaluate(()=>window.MM_MATERIAL_SEARCH.searchPage('ScaleLab',{page:2,pageSize:24}));
  expect(indexed.total).toBe(72);
  expect(indexed.items).toHaveLength(24);
  expect(indexed.page).toBe(2);

  const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth}));
  expect(geometry.page).toBeLessThanOrEqual(geometry.viewport+1);
});
