const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page,width,height){
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>{
    const user={id:'evidence-decision-qa',name:'Evidence QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'evidence-decision-qa',users:{'evidence-decision-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_MEASURED_EVIDENCE&&window.MM_MEASURED_EVIDENCE_DECISIONS&&!document.getElementById('mmBootstrap'));
}

async function injectDecisionContext(page,text){
  await page.evaluate(context=>{
    const host=document.getElementById('processDataLabs');
    host.classList.remove('hidden');
    host.querySelectorAll('[data-mm-measured-evidence="relevant"],[data-qa-evidence-context]').forEach(x=>x.remove());
    const p=document.createElement('p');p.dataset.qaEvidenceContext='1';p.textContent=context;host.appendChild(p);
  },text);
  await expect(page.locator('#processDataLabs [data-mm-measured-evidence="relevant"]')).toBeVisible();
  await expect(page.locator('#processDataLabs [data-mme-decision-legend]')).toBeVisible();
}

test('mobile decision evidence explains a direct cavity-sensor match without horizontal overflow',async({page})=>{
  await openApp(page,412,915);
  const explained=await page.evaluate(()=>window.MM_MEASURED_EVIDENCE_DECISIONS.explain('cavity pressure cavity temperature pascoe medical process trace',4));
  expect(explained[0].id).toBe('impure-pascoe-2022');
  expect(explained[0].role).toBe('direct');
  expect(explained[0].matches).toContain('cavity pressure');
  await injectDecisionContext(page,'cavity pressure cavity temperature pascoe medical process trace');
  const panel=page.locator('#processDataLabs [data-mm-measured-evidence="relevant"]');
  await expect(panel.locator('[data-mme-decision-role="direct"]').first()).toBeVisible();
  await expect(panel.locator('[data-mme-why]').first()).toContainText('Why relevant:');
  await expect(panel.locator('[data-mme-why]').first()).toContainText(/Matched topic/);
  const geometry=await panel.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,columns:getComputedStyle(el.querySelector('.mme-grid')).gridTemplateColumns}));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth+1);
  expect(geometry.columns.trim().split(/\s+/).length).toBe(1);
});

test('desktop decision evidence labels XRD as supporting material evidence and preserves safety boundary',async({page})=>{
  await openApp(page,1280,800);
  const explained=await page.evaluate(()=>window.MM_MEASURED_EVIDENCE_DECISIONS.explain('nylon 12 pa12 xrd crystallinity crystal structure',4));
  expect(explained[0].id).toBe('mendeley-8c8fjwcw86-v1');
  expect(explained[0].role).toBe('supporting');
  expect(explained[0].roleLabel).toBe('Supporting material evidence');
  await injectDecisionContext(page,'nylon 12 pa12 xrd crystallinity crystal structure');
  const panel=page.locator('#processDataLabs [data-mm-measured-evidence="relevant"]');
  await expect(panel.locator('[data-mme-decision-role="supporting"]').first()).toContainText('Supporting material evidence');
  await expect(panel.locator('[data-mme-why]').first()).toContainText('xrd');
  await expect(panel).toContainText('not a root-cause verdict');
  await expect(panel).toContainText('universal setpoint');
});
