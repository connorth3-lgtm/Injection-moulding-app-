const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const id='book-engagement-qa';
    const user={id,name:'Book Engagement QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MMBook&&!!window.MM_ACTIVITY_EVENTS_V2&&!!window.MM_LEARNER_MODEL,{timeout:30000});
  await page.evaluate(()=>window.MMBook.ready);
}

test('Book engagement is learner-scoped, deduplicated and excluded from mastery',async({page})=>{
  await page.setViewportSize({width:1024,height:900});
  await openApp(page);

  const result=await page.evaluate(async()=>{
    await window.MMBook.load();
    const chapters=window.MMBook.verifiedChapters();
    if(!chapters.length)throw new Error('No evidence-verified Book chapter available for regression test');
    const chapter=chapters[0];
    const before=window.MM_LEARNER_MODEL.build();
    const beforeTopics=JSON.stringify(before.topics);
    const beforeRecommendations=JSON.stringify(window.MM_LEARNER_MODEL.recommendations(20));

    window.MMBook.openChapter(chapter.id);
    window.MMBook.openChapter(chapter.id);
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'listening'}}));
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'listening'}}));

    const bookEvents=window.MM_ACTIVITY_EVENTS_V2.events({includeLegacy:false}).filter(e=>e.activityType==='book');
    const after=window.MM_LEARNER_MODEL.build();
    const afterRecommendations=window.MM_LEARNER_MODEL.recommendations(20);
    const chapterEvents=bookEvents.filter(e=>e.type==='book_chapter_open'&&e.itemId===chapter.id);
    const listeningEvents=bookEvents.filter(e=>e.type==='book_listening_start');

    window.MM_ACTIVITY_EVENTS_V2.clear();
    const cleared=window.MM_ACTIVITY_EVENTS_V2.events({includeLegacy:false});
    window.MMBook.openChapter(chapter.id);
    const afterReset=window.MM_ACTIVITY_EVENTS_V2.events({includeLegacy:false}).filter(e=>e.type==='book_chapter_open'&&e.itemId===chapter.id);

    return {
      chapterId:chapter.id,
      chapterEvents:chapterEvents.length,
      listeningEvents:listeningEvents.length,
      engagement:after.bookEngagement,
      topicsUnchanged:JSON.stringify(after.topics)===beforeTopics,
      recommendationsUnchanged:JSON.stringify(afterRecommendations)===beforeRecommendations,
      clearedCount:cleared.length,
      afterResetCount:afterReset.length
    };
  });

  expect(result.chapterEvents).toBe(1);
  expect(result.listeningEvents).toBe(1);
  expect(result.engagement.some(x=>x.chapterId===result.chapterId&&x.opens===1)).toBeTruthy();
  expect(result.engagement.some(x=>x.chapterId===null&&x.listeningStarts===1)).toBeTruthy();
  expect(result.topicsUnchanged).toBeTruthy();
  expect(result.recommendationsUnchanged).toBeTruthy();
  expect(result.clearedCount).toBe(0);
  expect(result.afterResetCount).toBe(1);
});
