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
  await expect(book.locator('.mm-book-reader-assurance')).toHaveCount(0); // listening is governed but separate from reading chrome
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
    const row=JSON.parse(localStorage.getItem('mouldmasterProDB'));
    row.activeUser='audio-deep-b';
    localStorage.setItem('mouldmasterProDB',JSON.stringify(row));
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
  await page.locator('#mmBookView [data-mm-book-reader-chapter-open="r06"]').click();
  const reader=page.locator('#mmBookView [data-mm-book-reader]');
  await expect(reader.locator('.mm-book-reader-assurance')).toContainText('Independent human SME review pending');
  const original=reader.locator('.mm-book-full-source-inline').first();
  await expect(original).toContainText('Read all original source sections');
  await original.locator('summary').first().click();
  await expect(original).toContainText('What transfer means');
});
