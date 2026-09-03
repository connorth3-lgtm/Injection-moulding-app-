const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'handler-qa',name:'Handler QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'handler-qa',users:{'handler-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_INLINE_HANDLER_BRIDGE?.version==='1');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

test('CSP disables native inline handlers and the live DOM contains none',async({page})=>{
  await openApp(page);
  const state=await page.evaluate(()=>{
    const csp=document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||'';
    const nativeHandlers=[...document.querySelectorAll('*')].flatMap(el=>
      ['onclick','onchange','oninput','onkeydown'].filter(name=>el.hasAttribute(name)).map(name=>`${el.tagName.toLowerCase()}:${name}`)
    );
    return{
      csp,
      nativeHandlers,
      bridgeVersion:window.MM_INLINE_HANDLER_BRIDGE?.version,
      bridgeEvents:window.MM_INLINE_HANDLER_BRIDGE?.events||[]
    };
  });
  expect(state.bridgeVersion).toBe('1');
  expect(state.bridgeEvents).toEqual(['click','change','input','keydown']);
  expect(state.csp).toContain("script-src 'self'");
  expect(state.csp).toContain("script-src-attr 'none'");
  expect(state.csp).not.toContain("script-src-attr 'unsafe-inline'");
  expect(state.nativeHandlers).toEqual([]);
});

test('delegated bridge handles calls, this.value and the Enter condition without eval',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(()=>{
    const originals={switchView:window.switchView,simChange:window.simChange,coachSend:window.coachSend};
    const calls=[];
    try{
      window.switchView=(...args)=>{calls.push(['switchView',...args])};
      window.simChange=(...args)=>{calls.push(['simChange',...args])};
      window.coachSend=(...args)=>{calls.push(['coachSend',...args])};

      const button=document.createElement('button');
      button.setAttribute('data-mm-onclick',"switchView('path');switchView('lesson')");
      document.body.appendChild(button);
      button.click();

      const slider=document.createElement('input');
      slider.value='77';
      slider.setAttribute('data-mm-oninput',"simChange('speed',this.value)");
      document.body.appendChild(slider);
      slider.dispatchEvent(new Event('input',{bubbles:true}));

      const field=document.createElement('input');
      field.setAttribute('data-mm-onkeydown',"if(event.key==='Enter')coachSend()");
      document.body.appendChild(field);
      field.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));

      button.remove();slider.remove();field.remove();
      return{
        calls,
        hasEval:window.MM_INLINE_HANDLER_BRIDGE.allowedCalls.includes('eval'),
        hasFunctionConstructor:window.MM_INLINE_HANDLER_BRIDGE.allowedCalls.includes('Function')
      };
    }finally{
      window.switchView=originals.switchView;
      window.simChange=originals.simChange;
      window.coachSend=originals.coachSend;
    }
  });
  expect(result.calls).toEqual([
    ['switchView','path'],
    ['switchView','lesson'],
    ['simChange','speed','77'],
    ['coachSend']
  ]);
  expect(result.hasEval).toBe(false);
  expect(result.hasFunctionConstructor).toBe(false);
});
