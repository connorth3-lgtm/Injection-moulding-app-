const {test,expect}=require('@playwright/test');
const LAB='/tools/new1-academy-workbench.html';
async function load(page){
  await page.goto(LAB,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#academyStatus')).toContainText('Development workbench ready',{timeout:30000});
  await expect(page.locator('#academyTabs button')).toHaveCount(5);
  await expect(page.getByRole('heading',{name:'Virtual Factory — Case One'})).toBeVisible();
}
test('all five New1 development pillars stay usable and do not launch new production authority',async({page})=>{
  await load(page);
  await expect(page.locator('.metrics .metric')).toHaveCount(4);
  await page.getByRole('button',{name:'recovery',exact:true}).click();
  await expect(page.locator('.scroll tbody tr')).toHaveCount(5);
  await page.getByRole('button',{name:'Review my reasoning'}).click();
  await expect(page.locator('#new1Review')).toContainText('Finish all four evidence decisions');
  const canonical=await page.evaluate(()=>{
    const row=window.MM_VIRTUAL_APPRENTICESHIP.cases.find(x=>x.id==='VA-02');
    return Object.fromEntries(['hypothesis','test','response','verify'].map(k=>[k,row[k].options.find(x=>x[2]===true)[0]]));
  });
  for(const [step,id] of Object.entries(canonical)){
    await page.locator('input[name="new1-'+step+'"][value="'+id+'"]').check();
  }
  await page.getByRole('button',{name:'Review my reasoning'}).click();
  await expect(page.locator('#new1Review')).toContainText('Formative reasoning 4/4');
  await page.locator('#academyTabs').getByRole('button',{name:'Personal tutor'}).click();
  await expect(page.locator('#academyPanel')).toContainText('Recommended practice: VA-06');
  await page.locator('#academyTabs').getByRole('button',{name:'Encyclopaedia'}).click();
  await expect(page.getByRole('heading',{name:'Engineering Encyclopaedia'})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search governed Book modules'}).fill('multi-cavity');
  await expect(page.locator('.cards .panel')).toHaveCount(1);
  await expect(page.locator('.cards .panel')).toContainText('Evidence status: source-review',{ignoreCase:true});
  await page.locator('#academyTabs').getByRole('button',{name:'Apprenticeship'}).click();
  await expect(page.locator('.cards .panel')).toHaveCount(5);
  await expect(page.locator('#academyPanel')).toContainText('Formal credential: not awarded');
  await page.locator('#academyTabs').getByRole('button',{name:'Trainer workspace'}).click();
  await page.getByPlaceholder('Four-cavity diagnosis session').fill('Supervised four-cavity case');
  await page.getByRole('button',{name:'Generate local assignment JSON'}).click();
  await expect(page.locator('.editor .output')).toContainText('new1-local-formative-assignment-template');
  await expect(page.locator('.editor .output')).toContainText('VA-02');
  await page.getByRole('button',{name:'Prepare summary'}).click();
  await expect(page.locator('.panel .output').last()).toContainText('consent is required');
  await page.getByRole('checkbox',{name:'I agree to prepare my anonymous formative summary.'}).check();
  await page.getByRole('button',{name:'Prepare summary'}).click();
  await expect(page.locator('.panel .output').last()).toContainText('"reasoningConsistent": 4');
  await expect(page.locator('.panel .output').last()).toContainText('"containsLearnerIdentity": false');
});
test('New1 lab remains operable on a narrow mobile viewport without page-level horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await load(page);
  for(const label of ['Encyclopaedia','Personal tutor','Apprenticeship','Trainer workspace','Virtual Factory']){
    await page.locator('#academyTabs').getByRole('button',{name:label}).click();
    const w=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    expect(w.scroll-w.client,'page-level overflow in '+label).toBeLessThanOrEqual(2);
    if(label==='Trainer workspace'){
      const checkboxWidths=await page.locator('.editor input[type=checkbox]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
      expect(checkboxWidths.length).toBeGreaterThan(0);
      for(const width of checkboxWidths)expect(width,'Trainer checkbox must not fill the form width').toBeLessThanOrEqual(24);
    }
  }
});
