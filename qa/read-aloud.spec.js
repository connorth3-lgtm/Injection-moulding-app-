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

test('privacy notice distinguishes Book screen reading from continuous background Listening', async ({page}) => {
  await page.goto('http://127.0.0.1:4173/privacy.html');
  const text=await page.locator('body').innerText();
  expect(text).toContain('Book\'s one-screen Read Aloud');
  expect(text).toContain('complete canonical lesson library');
  expect(text).toContain('may continue speaking when this app is in the background');
  expect(text).toContain('Use Pause or Stop');
  expect(text).not.toContain('Playback stops on app navigation and is paused when the app is hidden.');
});
test('expanded tablet Book speech controls occupy layout instead of overlaying reading', async ({page}) => {
  await seedLearner(page);
  await page.setViewportSize({width:810,height:1080});
  await page.goto(APP);
  await page.waitForFunction(()=>window.MMBook?.open&&window.MM_APP_SHELL_FINALIZED);
  await page.evaluate(async()=>{await window.MMBook.ready;window.MMBook.open();await window.MMBook.load();});
  const player=page.locator('.mm-read-aloud details');
  await player.evaluate(el=>{el.open=true;});
  await expect(player).toBeVisible();
  const result=await page.evaluate(()=>{
    const d=document.querySelector('.mm-read-aloud details');
    const v=document.querySelector('#mmBookView');
    const p=d.getBoundingClientRect(),b=v.getBoundingClientRect();
    return {position:getComputedStyle(d).position,playerBottom:p.bottom,bookTop:b.top,playerWidth:p.width,bodyWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
  });
  expect(result.position).toBe('relative');
  expect(result.bookTop).toBeGreaterThanOrEqual(result.playerBottom-2);
  expect(result.bodyWidth).toBeLessThanOrEqual(result.viewportWidth+2);
});
test('mobile bottom sheet leaves scroll clearance for Book chapter text and controls',async({page})=>{
  await seedLearner(page);
  await page.setViewportSize({width:360,height:800});
  await page.goto(APP);
  await page.waitForFunction(()=>window.MMBook?.open&&window.MM_APP_SHELL_FINALIZED);
  await page.evaluate(async()=>{await window.MMBook.ready;window.MMBook.open();await window.MMBook.load();});
  const details=page.locator('.mm-read-aloud details');
  await details.evaluate(el=>{el.open=true});
  await expect(details).toBeVisible();
  const geometry=await page.evaluate(()=>{
    const panel=document.querySelector('.mm-read-aloud details');
    const book=document.getElementById('mmBookView');
    const rect=panel.getBoundingClientRect();
    return {clearance:parseFloat(getComputedStyle(book).paddingBottom)||0,panelHeight:rect.height,viewportHeight:innerHeight,width:document.documentElement.scrollWidth,viewportWidth:innerWidth};
  });
  expect(geometry.clearance).toBeGreaterThanOrEqual(235);
  expect(geometry.panelHeight).toBeLessThan(geometry.viewportHeight-75);
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth+2);
});
test('public preview status is shown only for a preview URL, not local desktop paths', async ({page}) => {
  await seedLearner(page);
  await page.goto(APP);
  await page.waitForFunction(()=>window.MM_REFERENCE_LAYOUT?.refresh);
  await expect(page.locator('#mmPreviewStatus')).toHaveCount(0);
  await page.evaluate(()=>{history.replaceState(null,'','/preview/');window.MM_REFERENCE_LAYOUT.refresh()});
  await expect(page.locator('#mmPreviewStatus')).toBeVisible();
  await expect(page.locator('#mmPreviewStatus a')).toHaveAttribute('href','./privacy.html');
  await expect(page.locator('#mmPreviewStatus')).toContainText('NON-PRODUCTION PREVIEW');
  await page.evaluate(()=>window.switchView('path'));
  await expect(page.locator('#mmPreviewStatus')).toBeVisible();
});
test('Read Aloud integrates with the real shell, docks in the header without covering learner content, and scopes itself to visible learner text', async ({ page }) => {
  await seedLearner(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });

  const host=page.locator('.mm-read-aloud');
  // Book-only design: no global Read Aloud button on the Home tab.
  await expect(host).toBeHidden();
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED&&window.MMBook?.open));
  await page.evaluate(async()=>{await window.MMBook.ready;window.MMBook.open();await window.MMBook.load()});
  await expect(page.locator('#mmBookView')).toBeVisible();
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-version','2026.10.04.2');
  await expect.poll(()=>page.evaluate(()=>window.MMReadAloud?.version||'')).toBe('2026.10.04.2');
  await expect(host.locator('summary')).toContainText('Listen');

  const placement=await page.evaluate(()=>{
    const host=document.querySelector('.mm-read-aloud');
    const actions=document.querySelector('.top-actions');
    const details=host?.querySelector('details');
    return host&&actions&&details?{parent:host.parentElement===actions,position:getComputedStyle(host).position,width:details.getBoundingClientRect().width,height:details.getBoundingClientRect().height}:null;
  });
  expect(placement).not.toBeNull();
  expect(placement.parent).toBeTruthy();
  expect(placement.position).toBe('relative');
  expect(placement.width).toBeLessThanOrEqual(48);
  expect(placement.height).toBeGreaterThanOrEqual(44);

  await host.locator('details').evaluate(el=>{el.open=true;});
  await expect(host.locator('[data-mm-read="play"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="prev"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="next"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="stop"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="speed"]')).toHaveValue('1');

  // Book player expands within Book chrome, not over the reading surface.
  await expect.poll(()=>host.locator('details').evaluate(el=>getComputedStyle(el).position)).toBe('relative');
  await expect.poll(()=>page.evaluate(()=>{
    const book=document.getElementById('mmBookView');
    const details=document.querySelector('.mm-read-aloud details[open]');
    if(!book||!details)return false;
    const content=book.getBoundingClientRect(),player=details.getBoundingClientRect();
    return content.top>=player.bottom-2||content.bottom<=player.top+2;
  })).toBeTruthy();

  const visibilityCheck=await page.evaluate(() => {
    // The Book has an explicit narration boundary: insert the visible probe
    // inside Contents, not in a sibling shell panel outside the Book.
    const root=document.querySelector('#mmBookView [data-mm-book-contents]')||document.querySelector('.main')||document.body;
    const visible=document.createElement('p');visible.id='mmQaVisibleSpeech';visible.textContent='Read aloud visible sentinel sentence.';
    const hidden=document.createElement('p');hidden.id='mmQaHiddenSpeech';hidden.hidden=true;hidden.textContent='Read aloud hidden sentinel sentence.';
    root.append(visible,hidden);
    const texts=(window.MMReadAloud?.refresh?.()||[]).map(item=>item.text);
    visible.remove();hidden.remove();
    return {visible:texts.includes('Read aloud visible sentinel sentence.'),hidden:texts.includes('Read aloud hidden sentinel sentence.'),supported:window.MMReadAloud?.supported===true};
  });
  expect(visibilityCheck.visible).toBeTruthy();
  expect(visibilityCheck.hidden).toBeFalsy();
  // Leaving Book removes audio chrome from the entire main app.
  await page.evaluate(()=>switchView('dashboard'));
  await expect(host).toBeHidden();
  await page.evaluate(()=>window.MMBook.open());
  await expect(host).toBeVisible();
  // Book exit correctly stops speech and collapses the player; reopening
  // it restores the product's Ready state before checking voice capability.
  await host.locator('details').evaluate(el=>{el.open=true;});
  await expect(host.locator('[data-mm-read="play"]')).toBeVisible();

  const capability=host.locator('summary span');
  const status=host.locator('.mm-read-status');
  if(visibilityCheck.supported){
    await expect(capability).toHaveText('Device voice');
    await expect(status).toHaveText('Ready');
  }else{
    await expect(capability).toHaveText('Unavailable');
    await expect(status).toHaveText('Read Aloud is not available in this browser/device.');
    await expect(host.locator('[data-mm-read="play"]')).toBeDisabled();
  }
  // The deployed stylesheet, not an unapproved inline style, provides the
  // actual high-contrast focus marker for Listening route arrival.
  await page.evaluate(()=>window.MMReadAloud.openListening());
  const heading=page.locator('#mmListeningView .mm-listening-hero h2');
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS('outline-style','solid');
});

test('Read Aloud supported-path controls execute the exact product runtime in a deterministic speech harness', async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Read Aloud QA</title></head><body><main class="main"><h1>Read Aloud harness</h1><p id="mmQaVisibleSpeech">Read aloud visible sentinel sentence.</p><p id="mmQaHiddenSpeech" hidden>Read aloud hidden sentinel sentence.</p></main></body></html>`);

  await page.evaluate(() => {
    class QaSpeechSynthesisUtterance {constructor(text=''){this.text=String(text);this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={speaking:false,paused:false,pending:false,getVoices(){return[{name:'QA Voice',lang:'en-US',default:true}];},speak(utterance){this.speaking=true;this.paused=false;window.__mmReadAloudSpoken=String(utterance.text||'');window.__mmReadAloudRate=Number(utterance.rate||1);queueMicrotask(()=>utterance.onstart?.());},cancel(){this.speaking=false;this.paused=false;},pause(){this.speaking=false;this.paused=true;window.__mmReadAloudPaused=true;},resume(){this.speaking=true;this.paused=false;window.__mmReadAloudResumed=true;}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,writable:true,value:QaSpeechSynthesisUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,writable:true,value:synth});
  });

  await page.addScriptTag({path:'read-aloud.js'});
  await expect.poll(()=>page.evaluate(()=>window.MMReadAloud?.supported===true)).toBeTruthy();
  const host=page.locator('.mm-read-aloud');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-version','2026.10.04.2');
  await host.locator('details').evaluate(el=>{el.open=true;});

  const visibilityCheck=await page.evaluate(() => {
    const texts=(window.MMReadAloud?.refresh?.()||[]).map(item=>item.text);
    return {visible:texts.includes('Read aloud visible sentinel sentence.'),hidden:texts.includes('Read aloud hidden sentinel sentence.')};
  });
  expect(visibilityCheck.visible).toBeTruthy();expect(visibilityCheck.hidden).toBeFalsy();

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

test('Read Aloud waits for delayed Windows voices and selects the device voice before speaking', async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><main class="main"><p>Delayed Windows voice sentinel.</p></main></body></html>`);
  await page.evaluate(() => {
    class QaSpeechSynthesisUtterance {constructor(text=''){this.text=String(text);this.lang='';this.voice=null;this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const listeners=new Set();let ready=false;const voice={name:'Windows QA Voice',lang:'en-NZ',default:true};
    const synth={getVoices(){return ready?[voice]:[];},speak(utterance){window.__mmDelayedVoiceName=utterance.voice?.name||'';window.__mmDelayedSpeech=utterance.text;queueMicrotask(()=>utterance.onstart?.());},cancel(){},pause(){},resume(){},addEventListener(type,fn){if(type==='voiceschanged')listeners.add(fn);},removeEventListener(type,fn){if(type==='voiceschanged')listeners.delete(fn);}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,writable:true,value:QaSpeechSynthesisUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,writable:true,value:synth});
    setTimeout(()=>{ready=true;for(const fn of [...listeners])fn();},120);
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const host=page.locator('.mm-read-aloud');
  await host.locator('details').evaluate(el=>{el.open=true;});
  await host.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmDelayedVoiceName||'')).toBe('Windows QA Voice');
  await expect.poll(()=>page.evaluate(()=>window.__mmDelayedSpeech||'')).toContain('Delayed Windows voice sentinel.');
  await expect(host.locator('.mm-read-status')).toHaveText('Reading');
});

test('Android empty voice list speaks within the original tap without waiting for voiceschanged', async ({ page }) => {
  await page.setContent('<!doctype html><html lang="en"><body><main class="main"><h1>Android read aloud</h1><p>Android default voice starts on the first tap.</p></main></body></html>');
  await page.evaluate(() => {
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class QaSpeechSynthesisUtterance {constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    let inGesture=false;
    document.addEventListener('click',event=>{
      if(!event.target.closest?.('[data-mm-read="play"]'))return;
      inGesture=true;
      setTimeout(()=>{inGesture=false;},0);
    },true);
    const synth={
      getVoices(){return [];}, // Android Chrome need not expose installed voices.
      speak(utterance){
        window.__mmAndroidSpoken=utterance.text;
        window.__mmAndroidSpeechInsideGesture=inGesture;
        window.__mmAndroidLanguage=utterance.lang;
        queueMicrotask(()=>utterance.onstart?.());
      },
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaSpeechSynthesisUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const host=page.locator('.mm-read-aloud');
  await host.locator('details').evaluate(el=>{el.open=true;});
  await host.locator('[data-mm-read="play"]').click();
  // The reader speaks the first *visible text node* (h1) before the paragraph.
  // The first-tap assertion must not require skipping the heading.
  await expect.poll(()=>page.evaluate(()=>window.__mmAndroidSpoken||'')).toBe('Android read aloud');
  expect(await page.evaluate(()=>window.__mmAndroidSpeechInsideGesture)).toBe(true);
  expect(await page.evaluate(()=>window.__mmAndroidLanguage)).toBe('en');
  await expect(host.locator('.mm-read-status')).toHaveText('Reading');
  await host.locator('[data-mm-read="stop"]').click();
});

test('iOS empty voice list starts speech within the original tap task',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div class="top-actions"></div><main class="main"><p>iOS device voice starts from this lesson sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'});
    class QaUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    window.__mmIosInTap=false;
    document.addEventListener('click',event=>{
      if(!event.target.closest?.('[data-mm-read="play"]'))return;
      window.__mmIosInTap=true;
      setTimeout(()=>{window.__mmIosInTap=false;},0);
    },true);
    const synth={
      getVoices(){return[];},
      speak(utterance){
        window.__mmIosSpoken=utterance.text;
        window.__mmIosSpokeInTap=window.__mmIosInTap;
        queueMicrotask(()=>utterance.onstart?.());
      },
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true;});
  await player.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmIosSpoken||'')).toContain('iOS device voice starts');
  expect(await page.evaluate(()=>window.__mmIosSpokeInTap)).toBe(true);
  await expect(player.locator('.mm-read-status')).toHaveText('Reading');
});

test('Automatic sentence chaining stops when the lesson rewrites its visible text',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p id="lessonText">First continuing sentence. Outdated follow-up sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={current:null,spoken:[],
      getVoices(){return[];},
      speak(u){this.current=u;this.spoken.push(u.text);queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    window.__mmChainSpeech=synth;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  const play=reader.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await page.locator('#lessonText').evaluate(el=>{el.textContent='First continuing sentence. Updated follow-up sentence.';});
  await page.evaluate(()=>window.__mmChainSpeech.current?.onend?.());
  await expect(reader.locator('.mm-read-status')).toHaveText('Stopped after screen changed');
  await expect(play).toHaveText('Listen');
  expect(await page.evaluate(()=>window.__mmChainSpeech.spoken)).toEqual(['First continuing sentence.']);
  await play.click();
  await expect(play).toHaveText('Pause');
  expect(await page.evaluate(()=>window.__mmChainSpeech.spoken)).toEqual(['First continuing sentence.','First continuing sentence.']);
});

test('Hidden child text never remains a playable sentence under a visible parent',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>Visible intro sentence. <span id="oldText">Old section sentence.</span><span id="newText" hidden>New visible section sentence.</span></p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={getVoices(){return[];},speak(u){window.__mmHiddenSpoken=u.text;window.__mmHiddenCount=(window.__mmHiddenCount||0)+1;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  await reader.locator('[data-mm-read="play"]').click();
  await expect(reader.locator('[data-mm-read="play"]')).toHaveText('Pause');
  await reader.locator('[data-mm-read="stop"]').click();
  await page.evaluate(()=>{
    document.getElementById('oldText').hidden=true;
    document.getElementById('newText').hidden=false;
  });
  await reader.locator('[data-mm-read="next"]').click();
  await expect(reader.locator('[data-mm-read="current"]')).toHaveText('New visible section sentence.');
  expect(await page.evaluate(()=>window.__mmHiddenCount)).toBe(1);
  await reader.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmHiddenSpoken)).toBe('New visible section sentence.');
});

test('In-place lesson text updates refresh the next sentence without replaying old text',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p id="lessonText">Unchanged heading sentence. Old second sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={getVoices(){return[];},
      speak(u){window.__mmRewriteSpoken=u.text;window.__mmRewriteSpeakCount=(window.__mmRewriteSpeakCount||0)+1;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  const play=reader.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await reader.locator('[data-mm-read="stop"]').click();
  await page.locator('#lessonText').evaluate(el=>{el.textContent='Unchanged heading sentence. Updated second sentence.';});
  await reader.locator('[data-mm-read="next"]').click();
  await expect(reader.locator('[data-mm-read="current"]')).toHaveText('Updated second sentence.');
  expect(await page.evaluate(()=>window.__mmRewriteSpeakCount)).toBe(1);
  await play.click();
  await expect.poll(()=>page.evaluate(()=>window.__mmRewriteSpoken)).toBe('Updated second sentence.');
});

test('Throwing speech-utterance constructor leaves a restartable device player',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>Recover after a device utterance failure.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    window.__mmFailSpeechCtor=true;
    class Utterance{constructor(text=''){
      if(window.__mmFailSpeechCtor)throw new Error('OS utterance provider failed');
      this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;
    }}
    const synth={getVoices(){return[];},
      speak(u){window.__mmCtorSpoken=u.text;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  const play=reader.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Listen');
  await expect(reader.locator('.mm-read-status')).toHaveText('Device voice could not be prepared. Tap Listen again.');
  await page.evaluate(()=>{window.__mmFailSpeechCtor=false});
  await play.click();
  await expect(play).toHaveText('Pause');
  await expect.poll(()=>page.evaluate(()=>window.__mmCtorSpoken||'')).toContain('Recover after a device utterance failure.');
});

test('Switching screens after Stop refreshes the sentence queue before navigation and Play',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><section id="readingA"><p>Old page first sentence. Old page second sentence.</p></section><section id="readingB" hidden><p>New page first sentence. New page second sentence.</p></section></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={getVoices(){return[];},speak(u){window.__mmPageSpeech=u.text;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  await reader.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmPageSpeech||'')).toBe('Old page first sentence.');
  await reader.locator('[data-mm-read="stop"]').click();
  await page.evaluate(()=>{
    document.getElementById('readingA').hidden=true;
    document.getElementById('readingB').hidden=false;
  });
  await reader.locator('[data-mm-read="next"]').click();
  await expect(reader.locator('[data-mm-read="current"]')).toContainText('New page second sentence.');
  await expect(reader.locator('[data-mm-read="play"]')).toHaveText('Listen');
  expect(await page.evaluate(()=>window.__mmPageSpeech)).toBe('Old page first sentence.');
  await reader.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmPageSpeech)).toBe('New page second sentence.');
});

test('Sentence navigation while paused cues audio without restarting it until Listen',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>First navigation sentence. Second navigation sentence. Third navigation sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const voice={current:null,started:0,
      getVoices(){return[];},
      speak(u){this.current=u;this.started++;window.__mmNavSpeech=u.text;queueMicrotask(()=>u.onstart?.());},
      cancel(){this.current=null;},pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    window.__mmNavVoice=voice;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:voice});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true});
  const play=player.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await expect.poll(()=>page.evaluate(()=>window.__mmNavSpeech)).toContain('First navigation sentence.');
  await play.click();
  await expect(play).toHaveText('Resume');
  await player.locator('[data-mm-read="next"]').click();
  await expect(play).toHaveText('Listen');
  await expect(player.locator('.mm-read-status')).toHaveText('Sentence selected. Press Listen to start.');
  expect(await page.evaluate(()=>window.__mmNavVoice.started)).toBe(1);
  await expect(player.locator('[data-mm-read="current"]')).toContainText('Second navigation sentence.');
  await play.click();
  await expect.poll(()=>page.evaluate(()=>window.__mmNavSpeech)).toContain('Second navigation sentence.');
  await expect.poll(()=>page.evaluate(()=>window.__mmNavVoice.started)).toBe(2);
});

test('Entering Listening stops active single-screen audio without autoplaying a lesson',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div id="app"><nav id="nav"><button data-view="path">Learn</button></nav><main id="mainContent" class="main"><section id="path" class="view"><p>Current Book paragraph is speaking from the compact reader.</p></section><div class="top-actions"></div></main></div></body></html>');
  await page.evaluate(()=>{
    window.MM_DATA={lessons:[
      {id:1,title:'First handoff lesson',intro:'First learner lesson.'},
      {id:2,title:'Second handoff lesson',intro:'Second learner lesson.'}
    ]};
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={started:0,canceled:0,current:null,getVoices(){return[];},
      speak(u){this.current=u;this.started++;window.__mmHandoffLastSpoken=u.text;queueMicrotask(()=>u.onstart?.());},
      cancel(){this.canceled++;this.current=null;},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    window.__mmHandoffSynth=synth;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const compact=page.locator('.mm-read-aloud');
  await compact.locator('details').evaluate(el=>{el.open=true});
  const listen=compact.locator('[data-mm-read="play"]');
  await listen.click();
  await expect(listen).toHaveText('Pause');
  await expect.poll(()=>page.evaluate(()=>window.__mmHandoffLastSpoken)).toContain('Current Book paragraph');
  const countBefore=await page.evaluate(()=>window.__mmHandoffSynth.started);
  await page.locator('[data-mm-listening-tab]').click();
  await expect(page.locator('#mmListeningView')).toBeVisible();
  await expect(listen).toHaveText('Listen');
  await expect.poll(()=>page.evaluate(()=>window.__mmHandoffSynth.current===null)).toBeTruthy();
  await page.locator('#mmListeningView [data-mm-listening="next-lesson"]').click();
  await expect(page.locator('#mmListeningView [data-mm-listening-lesson]')).toContainText('Second handoff lesson');
  expect(await page.evaluate(()=>window.__mmHandoffSynth.started)).toBe(countBefore);
  await page.locator('#mmListeningView [data-mm-listening="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmHandoffLastSpoken)).toContain('Second handoff lesson');
  expect(await page.evaluate(()=>window.__mmHandoffSynth.started)).toBe(countBefore+1);
});

test('Listening navigation while stopped is silent and Play starts selected lesson',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><nav id="nav"><button data-view="path">Learn</button></nav><main id="mainContent" class="main"><section id="path" class="view">Learn</section></main></body></html>');
  await page.evaluate(()=>{
    window.MM_DATA={lessons:[
      {id:1,title:'First lesson',intro:'First lesson detail.'},
      {id:2,title:'Second lesson',intro:'Second lesson detail.'}
    ]};
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const voice={started:0,getVoices(){return[];},
      speak(u){this.started++;window.__mmJumpSpeech=u.text;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
    window.__mmJumpVoice=voice;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:voice});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  await page.locator('[data-mm-listening-tab]').click();
  const player=page.locator('#mmListeningView');
  await player.locator('[data-mm-listening="next-lesson"]').click();
  await expect(player.locator('[data-mm-listening-lesson]')).toContainText('Lesson 2');
  expect(await page.evaluate(()=>window.__mmJumpVoice.started)).toBe(0);
  await expect(player.locator('[data-mm-listening-status]')).toHaveText('Lesson or sentence selected. Press Play to listen.');
  await player.locator('[data-mm-listening="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmJumpSpeech)).toContain('Second lesson');
  expect(await page.evaluate(()=>window.__mmJumpVoice.started)).toBe(1);
  await player.locator('[data-mm-listening="stop"]').click();
  await player.locator('[data-mm-listening="prev-lesson"]').click();
  expect(await page.evaluate(()=>window.__mmJumpVoice.started)).toBe(1);
  await expect(player.locator('[data-mm-listening-lesson]')).toContainText('Lesson 1');
  await player.locator('[data-mm-listening="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmJumpSpeech)).toContain('First lesson');
  expect(await page.evaluate(()=>window.__mmJumpVoice.started)).toBe(2);
});

test('Changing narration speed while paused never resumes speech without Play',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>First spoken sentence. Second spoken sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class QaUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={
      getVoices(){return[];},
      speak(utterance){window.__mmSpeedStarts=(window.__mmSpeedStarts||0)+1;window.__mmSpeedRate=utterance.rate;queueMicrotask(()=>utterance.onstart?.());},
      cancel(){},pause(){window.__mmSpeedPaused=true;},resume(){window.__mmSpeedResumed=true;},
      addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true});
  const play=player.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  expect(await page.evaluate(()=>window.__mmSpeedStarts)).toBe(1);
  await play.click();
  await expect(play).toHaveText('Resume');
  await player.locator('[data-mm-read="speed"]').selectOption('1.25');
  await expect(play).toHaveText('Resume');
  await expect(player.locator('.mm-read-status')).toHaveText('Paused. Updated speed applies to the next sentence.');
  expect(await page.evaluate(()=>window.__mmSpeedStarts)).toBe(1);
  await play.click();
  await expect(play).toHaveText('Pause');
  expect(await page.evaluate(()=>window.__mmSpeedResumed)).toBe(true);
  await player.locator('[data-mm-read="next"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmSpeedStarts)).toBe(2);
  expect(await page.evaluate(()=>window.__mmSpeedRate)).toBe(1.25);
});

test('Throwing OS pause and resume recover to restartable narration controls',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>Device pause and resume failure recovery.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class QaUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    window.__mmFailPause=true;window.__mmFailResume=false;
    const synth={
      getVoices(){return[];},
      speak(utterance){queueMicrotask(()=>utterance.onstart?.());},
      cancel(){},
      pause(){if(window.__mmFailPause)throw new Error('OS pause failed');},
      resume(){if(window.__mmFailResume)throw new Error('OS resume failed');},
      addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true});
  const play=player.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await play.click();
  await expect(play).toHaveText('Listen');
  await expect(player.locator('.mm-read-status')).toHaveText('Device voice could not pause. Start playback again.');
  await page.evaluate(()=>{window.__mmFailPause=false;window.__mmFailResume=true;});
  await play.click();
  await expect(play).toHaveText('Pause');
  await play.click();
  await expect(play).toHaveText('Resume');
  await play.click();
  await expect(play).toHaveText('Listen');
  await expect(player.locator('.mm-read-status')).toHaveText('Device voice could not resume. Start playback again.');
  await play.click();
  await expect(play).toHaveText('Pause');
  // A background switch must also fail closed when the device refuses Pause.
  await page.evaluate(()=>{
    window.__mmFailPause=true;
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(play).toHaveText('Listen');
  await expect(player.locator('.mm-read-status')).toHaveText('Device voice could not pause while hidden. Start playback again.');
});

test('Throwing device cancellation and voice discovery cannot strand Read Aloud controls',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div class="top-actions"></div><main class="main"><p>Safe reading after a device voice error.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class QaUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={
      getVoices(){throw new Error('Device voice service unavailable');},
      speak(utterance){window.__mmErrorSpeech=utterance.text;queueMicrotask(()=>utterance.onstart?.());},
      cancel(){throw new Error('Device cancel service unavailable');},
      pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true});
  const play=player.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await expect.poll(()=>page.evaluate(()=>window.__mmErrorSpeech||'')).toContain('Safe reading');
  await player.locator('[data-mm-read="stop"]').click();
  await expect(player.locator('.mm-read-status')).toHaveText('Stopped');
  await expect(play).toHaveText('Listen');
  await play.click();
  await expect(play).toHaveText('Pause');
});

test('Completing a single-screen reading never claims the whole lesson library finished',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><body><div class="top-actions"></div><main class="main"><p>One finished reading sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={
      current:null,getVoices(){return[];},
      speak(utterance){this.current=utterance;queueMicrotask(()=>utterance.onstart?.());},
      cancel(){this.current=null;},pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    window.__mmEndSpeech=synth;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const reader=page.locator('.mm-read-aloud');
  await reader.locator('details').evaluate(el=>{el.open=true});
  await reader.locator('[data-mm-read="play"]').click();
  await expect(reader.locator('[data-mm-read="play"]')).toHaveText('Pause');
  await page.evaluate(()=>window.__mmEndSpeech.current?.onend?.());
  await expect(reader.locator('.mm-read-status')).toHaveText('Finished reading');
  await expect(reader.locator('[data-mm-read="play"]')).toHaveText('Listen');
});

test('Speech interruption exits stale playing state and Stop ignores synchronous cancel errors',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div class="top-actions"></div><main class="main"><p>Read aloud interruption recovery sentence.</p></main></body></html>');
  await page.evaluate(()=>{
    class QaUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={
      current:null,
      getVoices(){return[{name:'QA Voice',lang:'en-NZ',default:true}];},
      speak(utterance){this.current=utterance;queueMicrotask(()=>utterance.onstart?.());},
      cancel(){const active=this.current;this.current=null;active?.onerror?.({error:'canceled'});},
      pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    window.__mmQaSpeech=synth;
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true;});
  const play=player.locator('[data-mm-read="play"]');
  await play.click();
  await expect(play).toHaveText('Pause');
  await page.evaluate(()=>window.__mmQaSpeech.current?.onerror?.({error:'interrupted'}));
  await expect(player.locator('.mm-read-status')).toHaveText('Device interrupted playback. Press Listen to restart.');
  await expect(play).toHaveText('Listen');
  await play.click();
  await expect(play).toHaveText('Pause');
  await player.locator('[data-mm-read="stop"]').click();
  await expect(player.locator('.mm-read-status')).toHaveText('Stopped');
  await expect(play).toHaveText('Listen');
});

test('Unavailable speech provider disables both playback launchers without offering a broken action',async({page})=>{
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div id="app"><nav id="nav"><button data-view="path">Path</button></nav><main id="mainContent" class="main"><section id="path" class="view"><p>Ordinary lesson content.</p></section><div class="top-actions"></div></main></div></body></html>');
  await page.evaluate(()=>{
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:null});
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:null});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const compact=page.locator('.mm-read-aloud');
  await expect(compact.locator('[data-mm-read="play"]')).toBeDisabled();
  await expect(compact.locator('summary')).toContainText('Unavailable');
  await page.locator('[data-mm-listening-tab]').click();
  const listening=page.locator('#mmListeningView');
  await expect(listening.locator('[data-mm-listening="play"]')).toBeDisabled();
  await expect(listening.locator('[data-mm-listening-status]')).toHaveText('Speech synthesis is unavailable');
});

test('Listening tab builds a continuous lesson playlist and exposes long-session controls', async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div id="app"><aside><nav id="nav"><button data-view="path">Path</button></nav></aside><main id="mainContent" class="main"><section id="path" class="view"><p>Path content</p></section><header><div class="top-actions"></div></header></main></div></body></html>`);
  await page.evaluate(() => {
    window.MM_DATA={lessons:[
      {id:1,title:'Moulding basics',intro:'Injection moulding starts with controlled material preparation.',summary:'Control the process window.',objectives:['Recognise the cycle.'],keypoints:['Record evidence.'],exercise:'Observe one cycle.'},
      {id:2,title:'Material preparation',intro:'Drying depends on the material.',summary:'Use supplier evidence.',objectives:['Check drying requirements.'],keypoints:['Avoid assumptions.'],exercise:'Review a material sheet.'}
    ]};
    class QaSpeechSynthesisUtterance {constructor(text=''){this.text=String(text);this.lang='';this.voice=null;this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const synth={getVoices(){return[{name:'QA Voice',lang:'en-NZ',default:true}];},speak(utterance){window.__mmListeningSpeakCount=(window.__mmListeningSpeakCount||0)+1;window.__mmListeningSpoken=utterance.text;window.__mmListeningRate=utterance.rate;queueMicrotask(()=>utterance.onstart?.());},cancel(){},pause(){window.__mmListeningPaused=true;},resume(){window.__mmListeningResumed=true;},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,writable:true,value:QaSpeechSynthesisUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,writable:true,value:synth});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const tab=page.locator('[data-mm-listening-tab]');
  await expect(tab).toBeVisible();
  await tab.click();
  const view=page.locator('#mmListeningView');
  await expect(view).toBeVisible();
  await expect(view).toContainText('Listen through MouldMaster lessons continuously');
  await expect(view.locator('.mm-listening-hero h2')).toBeFocused();
  await view.locator('[data-mm-listening="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmListeningSpoken||'')).toContain('Moulding basics');
  await expect(view.locator('[data-mm-listening-lesson]')).toContainText('Lesson 1');
  await view.locator('[data-mm-listening-speed]').selectOption('1.25');
  await expect.poll(()=>page.evaluate(()=>window.__mmListeningRate)).toBe(1.25);
  await view.locator('[data-mm-listening="next-lesson"]').click();
  await expect(view.locator('[data-mm-listening-lesson]')).toContainText('Lesson 2');
  // Long-session speed controls follow the same paused-user-intent rule.
  const beforeSpeedEdit=await page.evaluate(()=>window.__mmListeningSpeakCount);
  await view.locator('[data-mm-listening="play"]').click();
  await expect(view.locator('[data-mm-listening="play"]')).toHaveText('Resume');
  await view.locator('[data-mm-listening-speed]').selectOption('1.5');
  await expect(view.locator('[data-mm-listening="play"]')).toHaveText('Resume');
  await expect(view.locator('[data-mm-listening-status]')).toHaveText('Paused. Updated speed applies to the next sentence.');
  expect(await page.evaluate(()=>window.__mmListeningSpeakCount)).toBe(beforeSpeedEdit);
  await view.locator('[data-mm-listening="play"]').click();
  await expect(view.locator('[data-mm-listening="play"]')).toHaveText('Pause');
  await view.locator('[data-mm-listening="stop"]').click();
  await expect(view.locator('[data-mm-listening-status]')).toHaveText('Stopped');
  // Stopping must not turn Play into one-screen narration of the controls.
  // Restart the selected lesson from the canonical course playlist.
  await page.evaluate(()=>{window.__mmListeningSpoken='';});
  await view.locator('[data-mm-listening="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmListeningSpoken||'')).toContain('Material preparation');
  await expect(view.locator('[data-mm-listening-lesson]')).toContainText('Lesson 2');
  await expect(view.locator('[data-mm-listening-status]')).toHaveText('Listening session playing');
  // A programmatic core view switch can hide the custom Listening screen
  // without a nav click. Reopening must restore the real visible view,
  // active tab and keyboard focus instead of trusting a stale boolean.
  await page.evaluate(()=>{
    document.getElementById('mmListeningView').classList.add('hidden');
    document.getElementById('path').classList.remove('hidden');
    document.querySelector('[data-mm-listening-tab]').classList.remove('active');
  });
  await tab.focus();
  await tab.press('Enter');
  await expect(view).toBeVisible();
  await expect(view.locator('.mm-listening-hero h2')).toBeFocused();
  await expect(tab).toHaveClass(/active/);
  await expect(page.locator('#path')).toHaveClass(/hidden/);
});


test('Book verified listening starts Android device speech in the original tap and stops on Contents',async({page})=>{
  await seedLearner(page);
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class QaUtterance{
      constructor(text=''){this.text=String(text);this.lang='';this.voice=null;this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}
    }
    document.addEventListener('click',event=>{
      if(!event.target.closest?.('[data-mm-book-mode="listen"]'))return;
      window.__mmBookOriginalTap=true;
      setTimeout(()=>{window.__mmBookOriginalTap=false;},0);
    },true);
    const synth={
      getVoices(){return[];},
      speak(utterance){
        window.__mmBookSpokenText=utterance.text;
        window.__mmBookSpeechInTap=window.__mmBookOriginalTap===true;
        queueMicrotask(()=>utterance.onstart?.());
      },
      cancel(){window.__mmBookCancelCount=(window.__mmBookCancelCount||0)+1;},
      pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QaUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  });
  await page.goto(APP,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MMBook?.ready&&window.MMReadAloud?.supported&&window.MM_APP_SHELL_FINALIZED));
  await page.evaluate(async()=>{await window.MMBook.ready;window.MMBook.open();await window.MMBook.load();});
  const listen=page.locator('#mmBookView [data-mm-book-mode="listen"]');
  await expect(listen).toBeEnabled();
  // Reproduce the real Book navigation path: a prior Contents queue still
  // exists while idle. The original Android gesture must not rebuild the
  // 20-chapter reader once for stale cleanup and then again for Play.
  await page.evaluate(()=>{
    if(!window.MMReadAloud.refresh().length)throw Error('Book Contents should contain readable text');
    window.__mmBookQueueWalks=0;
    const nativeWalker=document.createTreeWalker.bind(document);
    document.createTreeWalker=function(root,...args){
      if(root?.matches?.('[data-mm-book-reader]'))window.__mmBookQueueWalks+=1;
      return nativeWalker(root,...args);
    };
  });
  await listen.click();
  await expect.poll(()=>page.evaluate(()=>window.__mmBookSpokenText||'')).not.toBe('');
  expect(await page.evaluate(()=>window.__mmBookQueueWalks)).toBe(1);
  expect(await page.evaluate(()=>window.__mmBookSpeechInTap)).toBe(true);
  await expect(page.locator('#mmBookView [data-mm-book-reader]')).toBeVisible();
  await expect(page.locator('#mmBookView .mm-book-reader-module').first()).toBeVisible();
  const player=page.locator('.mm-read-aloud');
  await expect(player.locator('details')).toHaveAttribute('open','');
  await expect(player.locator('.mm-read-status')).toHaveText('Reading');
  await page.locator('#mmBookView [data-mm-book-back]').first().click();
  await expect(page.locator('#mmBookView [data-mm-book-contents]')).toBeVisible();
  await expect(player.locator('details')).not.toHaveAttribute('open','');
  await expect(player.locator('.mm-read-status')).toHaveText('Stopped');
});


test('Book audio speaks Book chapter prose instead of a visible scenario or exam card',async({page})=>{
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>
    <div class="top-actions"></div><main class="main">
      <section class="exam-card"><p>Wrong exam prompt must never be spoken.</p></section>
      <section class="scenario"><p>Wrong scenario panel must never be spoken.</p></section>
      <section id="mmBookView" class="view"><section data-mm-book-contents hidden><h2>Contents only</h2></section>
        <section data-mm-book-reader><button type="button" data-mm-book-back>Book contents</button>
          <article class="mm-book-reader-chapter"><h2>Correct Book chapter heading.</h2>
            <p>Correct governed Book prose follows this heading.</p>
          </article>
        </section>
      </section>
    </main>
  </body></html>`);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:
      'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'});
    class SpeechUtterance{constructor(text=''){this.text=text;this.lang='';this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const device={
      getVoices(){return[];},cancel(){},pause(){},resume(){},
      addEventListener(){},removeEventListener(){},
      speak(utterance){window.__mmBookTargetSpoken=utterance.text;queueMicrotask(()=>utterance.onstart?.());}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:SpeechUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:device});
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const player=page.locator('.mm-read-aloud');
  await player.locator('details').evaluate(el=>{el.open=true;});
  await player.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmBookTargetSpoken||'')).toBe('Correct Book chapter heading.');
  await expect(player.locator('[data-mm-read="current"]')).toHaveText('Correct Book chapter heading.');
  // The visible player counter is part of the regression: unrelated exam and
  // scenario prose must not inflate Book progress or the speaking queue.
  await expect(player.locator('[data-mm-read="position"]')).toHaveText('1 / 2');
  await page.evaluate(()=>window.MMReadAloud.stop());
  const result=await page.evaluate(()=>window.MMReadAloud.refresh().map(u=>u.text));
  expect(result).toContain('Correct governed Book prose follows this heading.');
  expect(result).not.toContain('Wrong exam prompt must never be spoken.');
  expect(result).not.toContain('Wrong scenario panel must never be spoken.');
  expect(result).not.toContain('Book contents');
});

test('Book continuous listening retains late chapters beyond the generic 1200 sentence limit',async({page})=>{
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>
    <div class="top-actions"></div><main class="main">
      <section id="mmBookView" class="view"><section data-mm-book-contents hidden></section>
        <section data-mm-book-reader><article class="mm-book-reader-chapter" id="bookAudioLong"></article></section>
      </section>
    </main>
  </body></html>`);
  await page.evaluate(()=>{
    const host=document.getElementById('bookAudioLong');
    const chunk=document.createDocumentFragment();
    for(let i=0;i<1210;i++){
      const p=document.createElement('p');
      p.textContent=i===1209?'Final source-reviewed Book chapter sentence.':`Book narration sentence ${i} is visible.`;
      chunk.appendChild(p);
    }
    host.appendChild(chunk);
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const units=await page.evaluate(()=>window.MMReadAloud.refresh().map(u=>u.text));
  expect(units).toHaveLength(1210);
  expect(units[0]).toBe('Book narration sentence 0 is visible.');
  expect(units.at(-1)).toBe('Final source-reviewed Book chapter sentence.');
});

test('Book Contents narration does not pick an unrelated screen when the reader is hidden',async({page})=>{
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>
    <div class="top-actions"></div><main class="main">
      <section class="scenario"><p>Wrong training screen should be ignored.</p></section>
      <section id="mmBookView" class="view"><section data-mm-book-contents>
        <h2>Book Contents heading.</h2><p>Choose a reader chapter from the Book.</p></section>
        <section data-mm-book-reader hidden><p>Invisible previous Book chapter.</p></section>
      </section>
    </main>
  </body></html>`);
  await page.addScriptTag({path:'read-aloud.js'});
  const units=await page.evaluate(()=>window.MMReadAloud.refresh().map(u=>u.text));
  expect(units).toEqual(['Book Contents heading.','Choose a reader chapter from the Book.']);
});
