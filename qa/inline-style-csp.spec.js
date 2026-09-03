const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'style-qa',name:'Style QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'style-qa',users:{'style-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_INLINE_STYLE_BRIDGE?.version==='1');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

test('strict style CSP uses exact hashes and runtime style blocks remain active',async({page})=>{
  await openApp(page);
  const state=await page.evaluate(()=>{
    const csp=document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||'';
    const style=document.getElementById('mm-app-shell-registry-style');
    return{
      csp,
      hashCount:(csp.match(/'sha256-[A-Za-z0-9+/=]+'/g)||[]).length,
      bridgeVersion:window.MM_INLINE_STYLE_BRIDGE?.version,
      registryRules:style?.sheet?.cssRules?.length||0,
      bodyBoxSizing:getComputedStyle(document.body).boxSizing
    };
  });
  expect(state.bridgeVersion).toBe('1');
  expect(state.csp).toContain("style-src 'self'");
  expect(state.csp).toContain("style-src-attr 'none'");
  expect(state.csp).not.toContain("'unsafe-inline'");
  expect(state.hashCount).toBeGreaterThan(10);
  expect(state.registryRules).toBeGreaterThan(0);
  expect(state.bodyBoxSizing).toBe('border-box');
});

test('legacy style attributes are neutralized at HTML sinks and applied through CSSOM properties',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(()=>{
    const holder=document.createElement('div');
    document.body.appendChild(holder);
    holder.innerHTML='<div id="mmStyleProbe" style="margin-top:13px;width:42%;--probe:7"></div>';
    const probe=document.getElementById('mmStyleProbe');
    const first={
      dataStyle:probe.getAttribute('data-mm-style'),
      marginTop:probe.style.marginTop,
      width:probe.style.width,
      custom:probe.style.getPropertyValue('--probe')
    };
    holder.insertAdjacentHTML('beforeend','<div id="mmStyleProbe2" style="display:block;padding:5px !important"></div>');
    const probe2=document.getElementById('mmStyleProbe2');
    const second={
      dataStyle:probe2.getAttribute('data-mm-style'),
      display:probe2.style.display,
      padding:probe2.style.padding,
      priority:probe2.style.getPropertyPriority('padding')
    };
    holder.remove();
    return{first,second,transformed:window.MM_INLINE_STYLE_BRIDGE.transformForTest('<p style="color:red">x</p>')};
  });
  expect(result.first).toEqual({dataStyle:null,marginTop:'13px',width:'42%',custom:'7'});
  expect(result.second).toEqual({dataStyle:null,display:'block',padding:'5px',priority:'important'});
  expect(result.transformed).toBe('<p data-mm-style="color:red">x</p>');
});
