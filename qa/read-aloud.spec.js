const { test, expect } = require('@playwright/test');

const APP='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

const SPEECH_FIXTURE=`
(() => {
  class QaSpeechSynthesisUtterance {
    constructor(text=''){
      this.text=String(text);
      this.lang='';
      this.rate=1;
      this.onstart=null;
      this.onend=null;
      this.onerror=null;
    }
  }
  const qaSynth={
    speaking:false,
    paused:false,
    pending:false,
    getVoices(){return[];},
    speak(utterance){
      this.speaking=true;
      this.paused=false;
      window.__mmReadAloudSpoken=String(utterance.text||'');
      window.__mmReadAloudRate=Number(utterance.rate||1);
      queueMicrotask(()=>utterance.onstart?.());
    },
    cancel(){this.speaking=false;this.paused=false;},
    pause(){this.speaking=false;this.paused=true;window.__mmReadAloudPaused=true;},
    resume(){this.speaking=true;this.paused=false;window.__mmReadAloudResumed=true;}
  };
  const install=(name,value)=>{
    try{
      Object.defineProperty(window,name,{configurable:true,enumerable:true,writable:true,value});
      return window[name]===value;
    }catch(_){
      try{window[name]=value;return window[name]===value}catch(__){return false}
    }
  };
  const utteranceInstalled=install('SpeechSynthesisUtterance',QaSpeechSynthesisUtterance);
  let synthInstalled=install('speechSynthesis',qaSynth);
  if(!synthInstalled&&window.speechSynthesis){
    try{
      const native=window.speechSynthesis;
      native.speak=qaSynth.speak.bind(qaSynth);
      native.cancel=qaSynth.cancel.bind(qaSynth);
      native.pause=qaSynth.pause.bind(qaSynth);
      native.resume=qaSynth.resume.bind(qaSynth);
      synthInstalled=true;
    }catch(_){ }
  }
  window.__mmReadAloudFixtureInstalled=utteranceInstalled&&synthInstalled;
})();
`;

test('Read Aloud renders and reads only visible learner text', async ({ page }) => {
  await page.addInitScript(() => {
    const user={
      id:'read-aloud-qa',
      name:'Read Aloud QA',
      role:'learner',
      completed:[],
      bookmarks:[],
      notes:{},
      examScores:{},
      certificates:[],
      currentLesson:1,
      lastSeen:new Date().toISOString(),
      onboardingDone:true,
      experience:'Beginner',
      goal:'Learn the full process',
      dailyMinutes:15,
      region:'ALL'
    };
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'read-aloud-qa',users:{'read-aloud-qa':user}}));
  });

  await page.route('**/read-aloud.js*', async route => {
    const response=await route.fetch();
    const source=await response.text();
    await route.fulfill({response,body:`${SPEECH_FIXTURE}\n${source}`});
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });

  const fixture=await page.evaluate(()=>({
    installed:window.__mmReadAloudFixtureInstalled===true,
    supported:window.MMReadAloud?.supported===true
  }));
  expect(fixture).toEqual({installed:true,supported:true});

  const host=page.locator('.mm-read-aloud');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-version','2026.09.01.1');
  await host.locator('details').evaluate(el=>{el.open=true;});

  await expect(host.locator('[data-mm-read="play"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="prev"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="next"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="stop"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="speed"]')).toHaveValue('1');

  const visibilityCheck=await page.evaluate(() => {
    const root=document.querySelector('.main')||document.querySelector('main')||document.body;
    const visible=document.createElement('p');
    visible.id='mmQaVisibleSpeech';
    visible.textContent='Read aloud visible sentinel sentence.';
    const hidden=document.createElement('p');
    hidden.id='mmQaHiddenSpeech';
    hidden.hidden=true;
    hidden.textContent='Read aloud hidden sentinel sentence.';
    root.append(visible,hidden);
    const texts=(window.MMReadAloud?.refresh?.()||[]).map(item=>item.text);
    visible.remove();hidden.remove();
    return {
      visible:texts.includes('Read aloud visible sentinel sentence.'),
      hidden:texts.includes('Read aloud hidden sentinel sentence.')
    };
  });
  expect(visibilityCheck.visible).toBeTruthy();
  expect(visibilityCheck.hidden).toBeFalsy();

  await host.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmReadAloudSpoken||'')).not.toBe('');
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Pause');
  await expect(host.locator('[data-mm-read="current"]')).not.toBeEmpty();

  await host.locator('[data-mm-read="play"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Resume');
  expect(await page.evaluate(()=>window.__mmReadAloudPaused===true)).toBeTruthy();
  await host.locator('[data-mm-read="play"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Pause');
  expect(await page.evaluate(()=>window.__mmReadAloudResumed===true)).toBeTruthy();

  await host.locator('[data-mm-read="speed"]').selectOption('1.25');
  await expect.poll(()=>page.evaluate(()=>window.__mmReadAloudRate)).toBe(1.25);

  await host.locator('[data-mm-read="stop"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Listen');
  await expect(host.locator('.mm-read-status')).toHaveText('Stopped');
});
