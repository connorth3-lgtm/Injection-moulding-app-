const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'cross-browser-qa',name:'Cross Browser QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'cross-browser-qa',users:{'cross-browser-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&!document.getElementById('mmBootstrap'));
  await page.waitForFunction(()=>['approved','review-required'].includes(window.MM_ASSESSMENT_DISCRIMINATION_HARDENING?.status),null,{timeout:10000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

test('runtime starts coherently with the audited hardening layers',async({page,browserName})=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await openApp(page);
  const state=await page.evaluate(()=>({
    discrimination:window.MM_ASSESSMENT_DISCRIMINATION_HARDENING||null,
    atlasEvidence:window.MM_PROCESS_ATLAS_CASE_EVIDENCE||null,
    psychometric:window.MM_PSYCHOMETRIC_HARDENING||null,
    shell:window.MM_APP_SHELL_FINALIZED,
    browser:navigator.userAgent
  }));
  expect(state.shell).toBe('2026.08.26.4');
  expect(state.discrimination?.status,`${browserName} discrimination metadata: ${JSON.stringify(state.discrimination)}`).toBe('approved');
  expect(state.discrimination?.targetedItems).toBe(111);
  expect(state.discrimination?.cueWarningsAfter).toBe(0);
  expect(state.atlasEvidence?.status).toBe('approved');
  expect(state.atlasEvidence?.cases).toBe(200);
  expect(state.psychometric?.itemsHardened).toBe(197);
  expect(errors,`${browserName} page errors`).toEqual([]);
});

test('automated semantic accessibility audit has no structural failures',async({page})=>{
  await openApp(page);
  const failures=await page.evaluate(()=>{
    const out=[];
    const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
    const ids=new Map();document.querySelectorAll('[id]').forEach(el=>{ids.set(el.id,(ids.get(el.id)||0)+1)});for(const [id,n] of ids)if(n>1)out.push(`duplicate-id:${id}:${n}`);
    document.querySelectorAll('img').forEach((el,i)=>{if(!el.hasAttribute('alt'))out.push(`img-alt:${i}`)});
    document.querySelectorAll('button,a[href]').forEach((el,i)=>{if(!visible(el))return;const name=(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').replace(/\s+/g,' ').trim();if(!name)out.push(`interactive-name:${el.tagName}:${i}`)});
    document.querySelectorAll('input,select,textarea').forEach((el,i)=>{if(!visible(el))return;const labelled=(el.labels&&el.labels.length)||el.getAttribute('aria-label')||el.getAttribute('aria-labelledby');if(!labelled)out.push(`form-label:${el.tagName}:${i}`)});
    document.querySelectorAll('[role="dialog"],dialog').forEach((el,i)=>{if(!visible(el))return;if(el.getAttribute('aria-modal')!=='true'&&el.tagName!=='DIALOG')out.push(`dialog-modal:${i}`);if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby'))out.push(`dialog-name:${i}`)});
    if(!document.querySelector('main,.main'))out.push('landmark-main');
    if(!document.querySelector('nav,#nav,.mobile-nav'))out.push('landmark-nav');
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el,i)=>{if(visible(el)&&!(el.textContent||'').trim())out.push(`empty-heading:${i}`)});
    return out;
  });
  expect(failures).toEqual([]);
});

test('keyboard focus enters and advances through the learner interface',async({page})=>{
  await openApp(page);
  const seen=[];
  for(let i=0;i<8;i++){
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(()=>{const el=document.activeElement;return el?`${el.tagName}#${el.id||''}.${el.className||''}`:'none'}));
  }
  expect(seen.some(x=>!x.startsWith('BODY')&&!x.startsWith('HTML')&&x!=='none')).toBeTruthy();
  expect(new Set(seen).size).toBeGreaterThan(2);
});
