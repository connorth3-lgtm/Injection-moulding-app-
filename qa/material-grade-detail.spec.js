const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'material-detail-qa',name:'Material Detail QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'material-detail-qa',users:{'material-detail-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_MATERIAL_REGISTRY&&document.querySelector('[data-mm-product-area="materials"]'));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

for(const viewport of [{name:'android-412x915',width:412,height:915},{name:'small-360x800',width:360,height:800}]){
  test(`${viewport.name}: exact LOTTE, LG Chem and KEPITAL grades keep property, processing and provenance context visible`,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await openApp(page);
    await page.locator('[data-mm-product-area="materials"]').click();
    await expect(page.locator('#materials')).toBeVisible();
    await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
    await expect(page.locator('[data-mm-material-grade]')).toHaveCount(11);

    const search=page.locator('[data-mm-exact-query]');
    await search.fill('NH-1033');
    const card=page.locator('[data-mm-material-grade="mat-lotte-infino-nh-1033"]');
    await expect(card).toBeVisible();
    await expect(page.locator('[data-mm-material-grade]')).toHaveCount(1);
    await expect(card).toContainText('Melt Flow Index · 35 g/10min');
    await expect(card).toContainText('ISO 1133 · 220°C · 10 kg');

    const details=card.locator('details.mm-exact-detail');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open','');
    await expect(details).toContainText('Properties');
    await expect(details).toContainText('Supplier limitation');
    await expect(details).toContainText('not an official material specification or mould-design value');
    await expect(details).toContainText('Comparable when conditions match');
    await expect(details).toContainText('Context only');
    await expect(details).toContainText('Supplier processing guidance');
    await expect(details).toContainText('Starting evidence, not a production recipe.');
    await expect(details).toContainText('Mould temperature');
    await expect(details).toContainText('60–90 °C');
    await expect(details).toContainText('Dehumidifier drying temperature');
    await expect(details).toContainText('80 °C');
    await expect(details).toContainText('Dehumidifier drying time');
    await expect(details).toContainText('3 hr');
    await expect(details).toContainText('Moisture after drying');
    await expect(details).toContainText('0.04 %');

    const sources=details.locator('.mm-exact-sources a');
    await expect(sources).toHaveCount(2);
    await expect(sources.first()).toHaveAttribute('href',/https:\/\/product\.lottechem\.com\/en\/advanced_materials\//);
    await expect(sources.first()).toHaveAttribute('target','_blank');
    await expect(sources.first()).toHaveAttribute('rel',/noopener/);
    await expect(card.getByRole('button',{name:'Start Mould Master case'})).toBeVisible();

    await search.fill('GP5206F');
    const lgCard=page.locator('[data-mm-material-grade="mat-lgchem-lupoy-gp5206f"]');
    await expect(lgCard).toBeVisible();
    await expect(page.locator('[data-mm-material-grade]')).toHaveCount(1);
    await expect(lgCard).toContainText('LG Chem · LUPOY · GP5206F');
    await expect(lgCard).toContainText('Melt Flow Rate · 3 g/10min');
    await expect(lgCard).toContainText('ISO 1133 · 250°C · 2.16 kg');
    await expect(lgCard).toContainText('3 sourced properties · 5 processing observations');

    const lgDetails=lgCard.locator('details.mm-exact-detail');
    await lgDetails.locator('summary').click();
    await expect(lgDetails).toHaveAttribute('open','');
    await expect(lgDetails).toContainText('Mould Shrinkage');
    await expect(lgDetails).toContainText('0.2-0.4 %');
    await expect(lgDetails).toContainText('ISO 294-4 · 2.0 mm · flow direction');
    await expect(lgDetails).toContainText('ISO 294-4 · 2.0 mm · transverse direction');
    await expect(lgDetails).toContainText('Supplier processing guidance');
    await expect(lgDetails).toContainText('Starting evidence, not a production recipe.');
    await expect(lgDetails).toContainText('Drying temperature');
    await expect(lgDetails).toContainText('75–85 °C');
    await expect(lgDetails).toContainText('Maximum moisture content');
    await expect(lgDetails).toContainText('0.02 %');
    await expect(lgDetails).toContainText('Melt temperature');
    await expect(lgDetails).toContainText('235–265 °C');
    await expect(lgDetails).toContainText('Mould temperature');
    await expect(lgDetails).toContainText('50–80 °C');
    await expect(lgDetails).toContainText('Lifecycle status: unknown');
    await expect(lgDetails).toContainText('provenance validated');

    const lgSources=lgDetails.locator('.mm-exact-sources a');
    await expect(lgSources).toHaveCount(1);
    await expect(lgSources.first()).toHaveAttribute('href',/https:\/\/www\.lgchemon\.com\/sfc\/servlet\.shepherd\/document\/download\//);
    await expect(lgSources.first()).toHaveAttribute('target','_blank');
    await expect(lgSources.first()).toHaveAttribute('rel',/noopener/);
    await expect(lgCard.getByRole('button',{name:'Start Mould Master case'})).toBeVisible();

    await search.fill('FG2025');
    const kepCard=page.locator('[data-mm-material-grade="mat-kepital-fg2025"]');
    await expect(kepCard).toBeVisible();
    await expect(page.locator('[data-mm-material-grade]')).toHaveCount(1);
    await expect(kepCard).toContainText('Korea Polyacetal (KPAC) · KEPITAL · FG2025');
    await expect(kepCard).toContainText('Mould Shrinkage · 0.7 %');
    await expect(kepCard).toContainText('ISO 294-4 · 2.0 mm · flow direction');
    await expect(kepCard).toContainText('1 sourced properties · 5 processing observations');
    await expect(kepCard).not.toContainText('Melt Flow');

    const kepDetails=kepCard.locator('details.mm-exact-detail');
    await kepDetails.locator('summary').click();
    await expect(kepDetails).toHaveAttribute('open','');
    await expect(kepDetails).toContainText('Supplier limitation');
    await expect(kepDetails).toContainText('not a production specification or mould-design value');
    await expect(kepDetails).toContainText('Pre-drying temperature');
    await expect(kepDetails).toContainText('80–90 °C');
    await expect(kepDetails).toContainText('Pre-drying time');
    await expect(kepDetails).toContainText('3–4 hr');
    await expect(kepDetails).toContainText('Maximum moisture content');
    await expect(kepDetails).toContainText('0.1 %');
    await expect(kepDetails).toContainText('Mould temperature');
    await expect(kepDetails).toContainText('60–80 °C');
    await expect(kepDetails).toContainText('Barrel temperature');
    await expect(kepDetails).toContainText('170–210 °C');
    await expect(kepDetails).toContainText('Starting evidence, not a production recipe.');
    await expect(kepDetails).toContainText('Lifecycle status: unknown');
    await expect(kepDetails).toContainText('provenance validated');

    const kepSources=kepDetails.locator('.mm-exact-sources a');
    await expect(kepSources).toHaveCount(2);
    await expect(kepSources.first()).toHaveAttribute('href',/https:\/\/www\.gpac-kpac\.com\/tcpdf\/kepital\/download\.php|https:\/\/gpac-kpac\.com\/tcpdf\/kepital\/download\.php/);
    await expect(kepSources.nth(1)).toHaveAttribute('href',/https:\/\/www\.gpac-kpac\.com\/en\/product\/pop_grade\.php/);
    await expect(kepSources.first()).toHaveAttribute('target','_blank');
    await expect(kepSources.first()).toHaveAttribute('rel',/noopener/);
    await expect(kepCard.getByRole('button',{name:'Start Mould Master case'})).toBeVisible();

    const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth,wrappers:[...document.querySelectorAll('.mm-exact-table-wrap')].map(x=>({client:x.clientWidth,scroll:x.scrollWidth}))}));
    expect(geometry.page).toBeLessThanOrEqual(geometry.viewport+1);
    expect(geometry.wrappers.length).toBeGreaterThanOrEqual(2);
    expect(geometry.wrappers.some(x=>x.scroll>x.client)).toBeTruthy();
  });
}
