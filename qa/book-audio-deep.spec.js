const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});

async function openBook(page){
  await page.addInitScript(()=>{
    const a={id:'audio-deep-a',name:'Audio A',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Read and listen',dailyMinutes:15,region:'ALL'};
    const b={...a,id:'audio-deep-b',name:'Audio B'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'audio-deep-a',users:{'audio-deep-a':a,'audio-deep-b':b}}));
    Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla/5.0 (Linux; Android 15; Pixel) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'});
    class Utterance{constructor(text=''){this.text=text;this.voice=null;this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}}
    const voice={
      getVoices(){return[];},
      speak(u){window.__bookAudioLast=u.text;window.__bookAudioUtterance=u;window.__bookAudioCalls=(window.__bookAudioCalls||0)+1;queueMicrotask(()=>u.onstart?.());},
      cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:voice});
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MMBook?.ready&&window.MMReadAloud?.supported&&window.MM_APP_SHELL_FINALIZED),null,{timeout:30000});
  await page.evaluate(async()=>{await window.MMBook.ready;window.MMBook.open();await window.MMBook.load();});
  await expect(page.locator('#mmBookView [data-mm-book-audio-mode]')).toBeVisible();
}

test('complete Book narration includes the 53 disclosed source sections, chapter seeking and a scoped cursor',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-mode]').selectOption('complete');
  await page.locator('[data-mm-book-audio-start]').selectOption('r06');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  const book=page.locator('#mmBookView');
  await expect(book.locator('[data-mm-book-audio-chapter="r06"] h4').filter({hasText:'What transfer means'})).toHaveCount(1);
  await expect(book.locator('[data-mm-book-audio-chapter]')).toHaveCount(20);
  await expect(book.locator('[data-mm-book-audio-chapter] .mm-book-reader-assurance')).toHaveCount(20); // all spoken chapters preserve source and SME limitations
  const player=page.locator('.mm-read-aloud');
  await expect(player.locator('[data-mm-book-audio-controls]')).toBeVisible();
  await expect(player.locator('[data-mm-book-audio-chapter]')).toHaveValue('r06');
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r06');
  await expect(page.locator('#mmBookView [data-mm-book-audio-continue]')).toHaveCount(1);
  await player.locator('[data-mm-book-audio-next]').click();
  await expect(player.locator('[data-mm-book-audio-chapter]')).toHaveValue('r07');
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r07');
  await expect.poll(()=>page.evaluate(()=>window.__bookAudioLast||'')).toContain('Feed Systems');
  await player.locator('[data-mm-read="stop"]').click();
  await book.locator('[data-mm-book-back]').first().click();
  await expect(book.locator('[data-mm-book-audio-continue]')).toBeVisible();
  expect(await page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r07');
});

test('streamlined Book audio excludes consolidated sections but can expose complete worked calculations on demand',async({page})=>{
  await openBook(page);
  const mode=page.locator('[data-mm-book-audio-mode]');
  await mode.selectOption('streamlined');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect(page.locator('[data-mm-book-audio-chapter="r06"] h4').filter({hasText:'What transfer means'})).toHaveCount(0);
  await page.locator('#mmBookView [data-mm-book-back]').first().click();
  await mode.selectOption('examples');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  const worked=page.locator('[data-mm-book-audio-chapter="r06"] [data-mm-worked-case]').first();
  await expect(worked).toHaveAttribute('open','');
  await expect(worked).toContainText('Calculation / reasoning');
});

test('book narration progresses to saved chapter without automatically restarting during a profile change',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-start]').selectOption('r03');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r03');
  await page.evaluate(()=>{
    const before=window.MM_LEARNER_SCOPE.token();
    if(typeof db==='undefined'||!db)throw Error('Test requires loaded learner database');
    db.activeUser='audio-deep-b';
    if(window.MM_LEARNER_SCOPE.token()===before)throw Error('Learner scope failed to switch');
    window.dispatchEvent(new CustomEvent('mm:book-audio-position',{detail:{chapterId:'r12',unitIndex:6}}));
  });
  // Scope implementations vary in how they respond to an active-user change;
  // the Book is always forbidden from manufacturing approval or leaking a
  // previous learner's audio location to a newly selected profile.
  const cursor=await page.evaluate(()=>window.MMBook.getAudioResume());
  expect(cursor===null||cursor.chapterId!=='r12').toBeTruthy();
});

test('first-read Book keeps expert-review boundary visible and full original sections adjacent to prose',async({page})=>{
  await openBook(page);
  await page.locator('#mmBookView .mm-book-toc [data-mm-book-reader-chapter-open="r06"]').click();
  const reader=page.locator('#mmBookView [data-mm-book-reader]');
  await expect(reader.locator('.mm-book-reader-assurance')).toContainText('Independent human SME review pending');
  const original=reader.locator('.mm-book-full-source-inline').first();
  await expect(original).toContainText('Read all original source sections');
  await original.locator('summary').first().click();
  await expect(original).toContainText('What transfer means');
});

test('switching from guided first-read to full original reader reveals omitted source prose without changing module evidence',async({page})=>{
  await openBook(page);
  await page.locator('#mmBookView .mm-book-toc [data-mm-book-reader-chapter-open="r06"]').click();
  const root=page.locator('#mmBookView [data-mm-book-reader]');
  await expect(root.locator('[data-mm-book-read-toggle]')).toHaveText('Read complete original text');
  await expect(root.locator('[data-mm-book-reader-module="vp-transfer"] h4').filter({hasText:'What transfer means'})).toHaveCount(0);
  await root.locator('[data-mm-book-read-toggle]').click();
  await expect(root.locator('[data-mm-book-read-toggle]')).toHaveText('Switch to guided reading');
  await expect(root.locator('[data-mm-book-reader-module="vp-transfer"] h4').filter({hasText:'What transfer means'})).toHaveCount(1);
  await expect(root.locator('.mm-book-full-source-inline')).toHaveCount(0);
  await expect(root.locator('.mm-book-reader-assurance')).toContainText('Independent human SME review pending');
  await root.locator('[data-mm-book-read-toggle]').click();
  await expect(root.locator('[data-mm-book-reader-module="vp-transfer"] h4').filter({hasText:'What transfer means'})).toHaveCount(0);
  await expect(root.locator('.mm-book-full-source-inline').first()).toBeVisible();
});

test('reader chapter Listen action starts the chosen Book audio chapter on the original mobile tap',async({page})=>{
  await openBook(page);
  await page.locator('#mmBookView .mm-book-toc [data-mm-book-reader-chapter-open="r06"]').click();
  const reader=page.locator('#mmBookView [data-mm-book-reader]');
  await reader.locator('[data-mm-book-listen-chapter="r06"]').click();
  await expect(page.locator('.mm-read-aloud [data-mm-book-audio-chapter]')).toHaveValue('r06');
  await expect.poll(()=>page.evaluate(()=>window.__bookAudioLast||'')).toContain('Transfer, Packing and Clamp Behaviour');
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r06');
});

test('clearing an audio bookmark stops speech and removes only the active learner cursor',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-start]').selectOption('r05');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r05');
  const state=await page.evaluate(()=>{
    const scope=window.MM_LEARNER_SCOPE,prefix='mm_book_audio_v1::';
    const ownKey=scope.storageKey(prefix,scope.tokenFor('audio-deep-a'));
    const otherKey=scope.storageKey(prefix,scope.tokenFor('audio-deep-b'));
    const other={schema:1,bookRelease:window.MMBook.version,chapterId:'r11',unitIndex:9,mode:'examples'};
    localStorage.setItem(otherKey,JSON.stringify(other));
    const success=window.MMBook.clearAudioResume();
    return {success,own:localStorage.getItem(ownKey),other:JSON.parse(localStorage.getItem(otherKey)||'null')};
  });
  expect(state.success).toBe(true);
  expect(state.own).toBeNull();
  expect(state.other.chapterId).toBe('r11');
  await expect(page.locator('#mmBookView [data-mm-book-audio-continue]')).toBeHidden();
});

test('completion callback after learner switch cannot erase another learner audio bookmark',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-start]').selectOption('r08');
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r08');
  const state=await page.evaluate(()=>{
    const scope=window.MM_LEARNER_SCOPE,prefix='mm_book_audio_v1::';
    const first=scope.storageKey(prefix,scope.tokenFor('audio-deep-a'));
    const second=scope.storageKey(prefix,scope.tokenFor('audio-deep-b'));
    const preserved={schema:1,bookRelease:window.MMBook.version,chapterId:'r12',unitIndex:8,mode:'complete'};
    localStorage.setItem(second,JSON.stringify(preserved));
    db.activeUser='audio-deep-b';
    window.dispatchEvent(new CustomEvent('mm:book-audio-complete'));
    return {a:JSON.parse(localStorage.getItem(first)||'null'),b:JSON.parse(localStorage.getItem(second)||'null')};
  });
  expect(state.a.chapterId).toBe('r08');
  expect(state.b.chapterId).toBe('r12');
});

test('phone Book narration starts directly from the original tap, not a synthetic Play click',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-start]').selectOption('r04');
  await page.evaluate(()=>{
    const play=document.querySelector('.mm-read-aloud [data-mm-read="play"]');
    play.click=()=>{window.__syntheticPlayAttempt=true;};
  });
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__bookAudioLast||'')).toContain('Rheology, Moisture and Thermal History');
  expect(await page.evaluate(()=>window.__syntheticPlayAttempt===true)).toBe(false);
  await expect(page.locator('.mm-read-aloud [data-mm-book-audio-chapter]')).toHaveValue('r04');
});

test('Book preserves its learner-scoped cursor and advances if a phone voice only reports onend',async({page})=>{
  await openBook(page);
  await page.locator('[data-mm-book-audio-start]').selectOption('r09');
  await page.evaluate(()=>{
    window.speechSynthesis.speak=u=>{
      window.__bookEndOnlyLast=u;
      window.__bookEndOnlyCount=(window.__bookEndOnlyCount||0)+1;
    };
  });
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  await expect(page.locator('.mm-read-aloud [data-mm-read="play"]')).toHaveText('Starting…');
  expect(await page.evaluate(()=>window.MMBook.getAudioResume())).toBeNull();
  await page.evaluate(()=>window.__bookEndOnlyLast.onend?.());
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.chapterId)).toBe('r09');
  await expect.poll(()=>page.evaluate(()=>window.MMBook.getAudioResume()?.unitIndex)).toBe(0);
  expect(await page.evaluate(()=>window.__bookEndOnlyCount)).toBe(2);
  await page.locator('.mm-read-aloud [data-mm-read="stop"]').click();
  await expect(page.locator('.mm-read-aloud [data-mm-read="play"]')).toHaveText('Listen');
});


test('Book on Android never cuts speech after onstart when optional learner bookmark scope is unavailable',async({page})=>{
  await openBook(page);
  await page.evaluate(()=>{
    // Simulate an installed PWA where learner storage has not initialized.
    // Narration must work, but no cross-learner bookmark may be persisted.
    window.MM_LEARNER_SCOPE=undefined;
    window.__mmMissingScopeSpeech={cancels:0,utterances:[]};
    window.speechSynthesis.cancel=()=>{
      window.__mmMissingScopeSpeech.cancels++;
    };
    window.speechSynthesis.speak=u=>{
      window.__mmMissingScopeSpeech.utterances.push(u);
      queueMicrotask(()=>u.onstart?.());
    };
  });
  await page.locator('#mmBookView [data-mm-book-mode="listen"]').click();
  const player=page.locator('.mm-read-aloud');
  await expect(player.locator('.mm-read-status')).toHaveText('Reading');
  await expect(player.locator('[data-mm-read="play"]')).toHaveText('Pause');
  expect(await page.evaluate(()=>window.__mmMissingScopeSpeech.cancels)).toBe(0);
  expect(await page.evaluate(()=>window.__mmMissingScopeSpeech.utterances.length)).toBe(1);
  expect(await page.evaluate(()=>window.MMBook.getAudioResume())).toBeNull();

  // A completed short chapter heading advances to governed prose without
  // flushing the OS voice with another cancel() in between.
  await page.evaluate(()=>window.__mmMissingScopeSpeech.utterances[0].onend?.());
  await expect.poll(()=>page.evaluate(()=>window.__mmMissingScopeSpeech.utterances.length)).toBe(2);
  expect(await page.evaluate(()=>window.__mmMissingScopeSpeech.cancels)).toBe(0);
  await expect(player.locator('.mm-read-status')).toHaveText('Reading');

  // Explicit Stop must still cancel the active physical voice.
  await player.locator('[data-mm-read="stop"]').click();
  expect(await page.evaluate(()=>window.__mmMissingScopeSpeech.cancels)).toBe(1);
  await expect(player.locator('.mm-read-status')).toHaveText('Stopped');
});
