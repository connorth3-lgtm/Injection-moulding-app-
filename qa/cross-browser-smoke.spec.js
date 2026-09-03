const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';

test('core shell and exact-grade Materials work without layout overflow',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err.message||err)));
  await page.goto(BASE,{waitUntil:'load'});
  await expect(page.locator('#dashboard')).toBeVisible({timeout:30000});
  await page.locator('#nav button[data-view="materials"]').click();
  await expect(page.locator('#materials')).toBeVisible();
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible({timeout:30000});
  await expect(page.locator('[data-mm-material-grade]').first()).toBeVisible();
  const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+2);
  expect(errors).toEqual([]);
});

test('engineering store enforces learner ownership for direct case reads',async({page})=>{
  await page.goto(BASE,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.MM_ENGINEERING_STORE,{timeout:30000});
  const result=await page.evaluate(async()=>{
    const s=window.MM_ENGINEERING_STORE;
    const tokenA=s.learnerToken('qa-owner-a'),tokenB=s.learnerToken('qa-owner-b');
    const record=await s.saveCase({id:'case-cross-browser-owner-test',title:'ownership test',learnerToken:tokenA},{token:tokenA});
    const own=await s.getCase(record.id,tokenA),foreign=await s.getCase(record.id,tokenB);
    await s.deleteCase(record.id,tokenA);
    return {own:!!own,foreign:!!foreign};
  });
  expect(result).toEqual({own:true,foreign:false});
});
