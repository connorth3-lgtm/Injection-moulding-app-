const { test, expect } = require('@playwright/test');

const APP='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function seedLearner(page){
  await page.addInitScript(() => {
    const user={
      id:'read-aloud-qa',name:'Read Aloud QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'
    };
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'read-aloud-qa',users:{'read-aloud-qa':user}}));
  });
}

async function setBookFixture(page,html,...options){
  const source=String(html);
  if(/id=["']mmBookView["']/i.test(source))return page.setContent(source,...options);
  const wrapped=source.replace(/<body\b[^>]*>/i,
    match=>match+'<div id="mmBookView"><section data-mm-book-contents>')
    .replace(/<\/body\s*>/i,'</section></div></body>');
  return page.setContent(wrapped,...options);
}

test('Delayed device speech can start after the page hides for screen-off listening', async ({page}) => {
  await setBookFixture(page,'<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>Screen-off Book narration can begin while the app is hidden.</p></main></body></html>');
  await page.evaluate(()=>{
    class Voice{constructor(text=''){this.text=text;this.onstart=null;this.onend=null;this.onerror=null;}}
    const speech={starts:0,cancels:0,pauses:0,last:null,getVoices(){return[];},speak(u){this.starts++;this.last=u;},
      cancel(){this.cancels++;},pause(){this.pauses++;},resume(){},addEventListener(){},removeEventListener(){}};
    window.__hiddenStartVoice=speech;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Voice});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:speech});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const host=page.locator('.mm-read-aloud');
  await host.locator('details').evaluate(el=>{el.open=true});
  await host.locator('[data-mm-read="play"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Starting…');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(host.locator('.mm-read-status')).toHaveText('Loading device voice…');
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Starting…');
  // The delayed voice lookup must still start from the original Listen action.
  await page.waitForTimeout(1300);
  expect(await page.evaluate(()=>window.__hiddenStartVoice.starts)).toBe(1);
  await page.evaluate(()=>window.__hiddenStartVoice.last.onstart?.());
  await expect(host.locator('.mm-read-status')).toHaveText('Reading');
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Pause');
  expect(await page.evaluate(()=>({cancels:window.__hiddenStartVoice.cancels,pauses:window.__hiddenStartVoice.pauses}))).toEqual({cancels:0,pauses:0});
});

test('Late OS onstart and sentence chaining continue after the page hides', async ({page}) => {
  await setBookFixture(page,'<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>First screen-off sentence. Second screen-off sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla/5.0 (Linux; Android 15; Pixel)'});
    class Voice{constructor(text=''){this.text=text;this.onstart=null;this.onend=null;this.onerror=null;}}
    const speech={starts:0,cancels:0,pauses:0,utterances:[],getVoices(){return[];},speak(u){this.starts++;this.last=u;this.utterances.push(u);},
      cancel(){this.cancels++;},pause(){this.pauses++;},resume(){},addEventListener(){},removeEventListener(){}};
    window.__lateStartVoice=speech;
    Object.defineProp