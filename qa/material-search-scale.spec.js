const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function seed(page){
  await page.addInitScript(()=>{
    const user={id:'material-scale-qa',name:'Material Scale QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'material-scale-qa',users:{'material-scale-qa':user}}));
  });
  await page.route('**/material-catalog-v1.json',async route=>{
    const response=await route.fetch();
    const original=await response.json();
    const byManufacturer=[];
    for(const grade of original.grades||[]){if(!byManufacturer.some(x=>x.manufacturer?.id===grade.manufacturer?.id))byManufacturer.push(grade)}
    const templates=byManufacturer.slice(0,3);
    if(templates.length<2)throw new Error('scale fixture needs at least two source manufacturers');
    const synthetic=Array.from({length:72},(_,i)=>{
      const src=JSON.parse(JSON.stringify(templates[i%templates.length]));
      const n=String(i+1).padStart(3,'0');
      src.id=`qa-scale-${n}`;
      src.brand='ScaleLab';
      src.grade=`SCALE-${n}`;
      src.aliases=[...(src.aliases||[]),'scale fixture'];
      src.provenance={...(src.provenance||{}),notes:'Synthetic browser-scale fixture derived from a validated record; never production material evidence.'};
      return src;
    });
    await route.fulfill({response,json:{...original,catalogVersion:'qa-scale-72',grades:synthetic}});
  });
}

async function openMaterials(page){
  await seed(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_MATERIAL_REGISTRY&&window.MM_MATERIAL_SEARCH&&window.MM_MATERIAL_SEARCH_PAGINATION);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await page.locator('[data-mm-product-area="materials"]').click();
  await expect(page.locator('#mmExactMaterialCatalog')).toHaveCount(1);
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog')).toHaveAttribute('data-mm-material-search-mode','indexed');
}

test('indexed exact-grade catalog paginates beyond the old 40-card ceiling and resets filters accessibly',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openMaterials(page);
  const root=page.locator('#mmExactMaterialCatalog');
  const search=root.locator('[data-mm-exact-query]');
  const status=root.locator('[data-mm-material-page-status]');
  const previous=root.getByRole('button',{name:'Previous'});
  const next=root.getByRole('button',{name:'Next'});

  const started=Date.now();
  await search.fill('ScaleLab');
  await expect(status).toContainText('72 matching exact grades · page 1 of 3');
  expect(Date.now()-started).toBeLessThan(1500);
  await expect(root.locator('[data-mm-material-grade]')).toHaveCount(24);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const firstPageFirst=await root.locator('[data-mm-material-grade]').first().getAttribute('data-mm-material-grade');

  await next.click();
  await expect(status).toContainText('page 2 of 3');
  await expect(root.locator('[data-mm-material-grade]')).toHaveCount(24);
  await expect(previous).toBeEnabled();
  const secondPageFirst=await root.locator('[data-mm-material-grade]').first().getAttribute('data-mm-material-grade');
  expect(secondPageFirst).not.toBe(firstPageFirst);

  await search.fill('SCALE-001');
  await expect(status).toContainText('1 matching exact grades · page 1 of 1');
  await expect(root).toHaveAttribute('data-mm-material-page','1');
  await expect(root.locator('[data-mm-material-grade]')).toHaveCount(1);

  await search.fill('ScaleLab');
  await expect(status).toContainText('72 matching exact grades · page 1 of 3');
  const manufacturer=root.locator('[data-mm-exact-manufacturer]');
  await manufacturer.selectOption({index:1});
  await expect(status).toContainText('matching exact grades · page 1 of 1');
  await expect(root.locator('[data-mm-material-grade]')).toHaveCount(24);
  await expect(status).toHaveAttribute('role','status');
  await expect(status).toHaveAttribute('aria-live','polite');

  const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth}));
  expect(geometry.page).toBeLessThanOrEqual(geometry.viewport+1);
});
