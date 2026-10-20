const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'ui-hardening-qa',name:'UI Hardening QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'ui-hardening-qa',users:{'ui-hardening-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&/^\\d{4}\\.\\d{2}\\.\\d{2}\\.\\d+$/.test(window.MM_APP_SHELL_FINALIZED));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

test('UI hardening exposes one shared focus treatment and semantic theme tokens',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement);
    const button=document.querySelector('.mobile-nav button,button,a');
    if(!button)return null;
    button.focus();
    const focused=getComputedStyle(button);
    return {
      surface:root.getPropertyValue('--mm-surface-panel').trim(),
      text:root.getPropertyValue('--mm-text-primary').trim(),
      accent:root.getPropertyValue('--mm-accent').trim(),
      focusOutline:focused.outlineStyle,
      focusWidth:focused.outlineWidth,
      radius:root.getPropertyValue('--mm-radius-md').trim()
    };
  });
  expect(result).not.toBeNull();
  expect(result.surface).toBeTruthy();
  expect(result.text).toBeTruthy();
  expect(result.accent).toBeTruthy();
  expect(result.radius).toBe('14px');
});

test('reduced-motion mode disables long UI transitions',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await openApp(page);
  const result=await page.evaluate(()=>{
    const probe=document.querySelector('.mobile-nav button,button,a');
    if(!probe)return null;
    const s=getComputedStyle(probe);
    return {duration:s.transitionDuration,animation:s.animationDuration};
  });
  expect(result).not.toBeNull();
  expect(parseFloat(result.duration)).toBeLessThanOrEqual(0.01);
  expect(parseFloat(result.animation)).toBeLessThanOrEqual(0.01);
});

test('forced-colors mode keeps primary interactive surfaces bounded',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});
  await openApp(page);
  const result=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('.mobile-nav button,.mm-primary-hub .mm-hub-tile,button')].slice(0,12);
    return nodes.map(node=>{
      const s=getComputedStyle(node);
      return {display:s.display,background:s.backgroundColor,color:s.color,border:s.borderTopColor};
    });
  });
  expect(result.length).toBeGreaterThan(0);
  expect(result.every(x=>x.display!=='none')).toBeTruthy();
});
