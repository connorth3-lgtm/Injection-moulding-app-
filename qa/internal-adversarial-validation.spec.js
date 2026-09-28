const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
const A='internal-validation-a';
const B='internal-validation-b';

function learner(id,name){
  return {id,name,role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},examPassStatus:{},certificates:[],certificateMeta:{},currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
}
async function openApp(page){
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:a.id,users:{[a.id]:a,[b.id]:b}}));
  },{a:learner(A,'Internal QA A'),b:learner(B,'Internal QA B')});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MM_ACTIVITY_EVENTS_V2&&!!window.MM_LEARNER_MODEL&&!!window.MM_LEARNER_SCOPE&&!!window.MM_ASSESSMENT_STORAGE_SCOPE&&typeof window.startExam==='function'&&typeof window.switchUser==='function',{timeout:30000});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}
async function switchLearner(page,id){
  await page.evaluate(next=>switchUser(next),id);
  await page.waitForFunction(next=>window.MM_LEARNER_SCOPE.activeId()===next,id);
}

test('corrupt scoped activity and assessment JSON fails closed without cross-learner leakage',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(({a,b})=>{
    const scope=window.MM_LEARNER_SCOPE,activity=window.MM_ACTIVITY_EVENTS_V2,assessment=window.MM_ASSESSMENT_STORAGE_SCOPE;
    const ta=scope.tokenFor(a),tb=scope.tokenFor(b);
    const activityA=scope.storageKey('mm_activity_events_v2::',ta),activityB=scope.storageKey('mm_activity_events_v2::',tb);
    localStorage.setItem(activityA,'{"broken":');
    localStorage.setItem(activityB,JSON.stringify({schema:2,version:'fixture',events:[{v:2,t:'2026-09-28T00:00:00.000Z',type:'practice_choice',activityType:'scenario',activityId:'scenario:b-only',itemId:'b-only',correct:true,competencyIds:['b-only']}]}));
    localStorage.setItem(assessment.analyticsKey(),'{bad-json');
    const aNative=activity.events({includeLegacy:false});
    const aAssessment=assessment.read('mm_assessment_analytics_v1',{safe:true});
    switchUser(b);
    const bNative=activity.events({includeLegacy:false});
    const bModel=window.MM_LEARNER_MODEL.build();
    switchUser(a);
    const aAgain=activity.events({includeLegacy:false});
    const aModel=window.MM_LEARNER_MODEL.build();
    return {
      aNative:aNative.length,
      aAssessment,
      bNative:bNative.map(x=>x.itemId),
      bTopics:bModel.topics.map(x=>x.key),
      aAgain:aAgain.length,
      aTopics:aModel.topics.map(x=>x.key)
    };
  },{a:A,b:B});
  expect(result.aNative).toBe(0);
  expect(result.aAssessment).toEqual({safe:true});
  expect(result.bNative).toEqual(['b-only']);
  expect(result.bTopics).toContain('competency:b-only');
  expect(result.aAgain).toBe(0);
  expect(result.aTopics).not.toContain('competency:b-only');
});

test('interrupted assessment does not resurrect answers after reload or learner switch',async({page})=>{
  await openApp(page);
  await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>document.querySelectorAll('#examQuestions .question').length===16&&document.querySelector('#modal:not(.hidden)'));
  const first=page.locator('#examQuestions .question.mm-current-question input[type=radio]').first();
  await first.check();
  await expect(first).toBeChecked();

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MM_ASSESSMENT_STORAGE_SCOPE&&typeof window.startExam==='function'&&!document.getElementById('mmBootstrap'),{timeout:30000});
  expect(await page.evaluate(()=>typeof activeExam==='undefined'||activeExam===null)).toBeTruthy();

  await switchLearner(page,B);
  await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>document.querySelectorAll('#examQuestions .question').length===16&&document.querySelector('#modal:not(.hidden)'));
  await expect(page.locator('#examQuestions input[type=radio]:checked')).toHaveCount(0);
});

test('invalid backup import leaves the learner database byte-for-byte unchanged',async({page})=>{
  await openApp(page);
  const before=await page.evaluate(()=>localStorage.getItem('mouldmasterProDB'));
  let alertText='';
  page.once('dialog',async dialog=>{alertText=dialog.message();await dialog.accept()});
  await page.evaluate(()=>window.importData(new File(['{"activeUser":"missing","users":{}}'], 'invalid-backup.json',{type:'application/json'})));
  await expect.poll(()=>alertText,{timeout:10000}).toMatch(/not a valid MouldMaster backup|could not be stored safely/i);
  const after=await page.evaluate(()=>localStorage.getItem('mouldmasterProDB'));
  expect(after).toBe(before);
});

test('activity evidence stays bounded, sanitized and free of arbitrary payload fields',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(()=>{
    const scope=window.MM_LEARNER_SCOPE,api=window.MM_ACTIVITY_EVENTS_V2;
    api.clear();
    const key=scope.storageKey('mm_activity_events_v2::',scope.token());
    const seed=Array.from({length:3000},(_,i)=>({v:2,t:'2026-09-28T00:00:00.000Z',type:'practice_choice',activityType:'scenario',activityId:'scenario:seed',itemId:'seed-'+i,correct:true,competencyIds:['seed']}));
    localStorage.setItem(key,JSON.stringify({schema:2,version:'fixture',events:seed}));
    const recorded=api.record('evil<script>',{activityType:'scenario<script>',activityId:'id<script>',itemId:'item<script>',reason:'reason<script>',score:999,competencyIds:['competency<script>'],freeText:'must-not-persist'});
    const native=api.events({includeLegacy:false});
    const stored=JSON.parse(localStorage.getItem(key));
    return {length:native.length,first:native[0]?.itemId,last:native.at(-1),recorded,storedLength:stored.events.length};
  });
  expect(result.length).toBe(3000);
  expect(result.storedLength).toBe(3000);
  expect(result.first).toBe('seed-1');
  expect(result.last.score).toBe(100);
  expect(result.last.type).toBe('evilscript');
  expect(result.last.activityType).toBe('scenarioscript');
  expect(result.last).not.toHaveProperty('freeText');
  expect(JSON.stringify(result.last)).not.toContain('<script>');
});

test('repeated learner switching keeps Book/activity session dedupe scoped to the active learner',async({page})=>{
  await openApp(page);
  const result=await page.evaluate(({a,b})=>{
    const api=window.MM_ACTIVITY_EVENTS_V2;
    api.clear();
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'chapter',id:'chapter-switch-test'}}));
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'chapter',id:'chapter-switch-test'}}));
    const a1=api.events({includeLegacy:false}).filter(e=>e.type==='book_chapter_open').length;
    switchUser(b);
    api.clear();
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'chapter',id:'chapter-switch-test'}}));
    const b1=api.events({includeLegacy:false}).filter(e=>e.type==='book_chapter_open').length;
    switchUser(a);
    const a2=api.events({includeLegacy:false}).filter(e=>e.type==='book_chapter_open').length;
    api.clear();
    window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind:'chapter',id:'chapter-switch-test'}}));
    const aAfterReset=api.events({includeLegacy:false}).filter(e=>e.type==='book_chapter_open').length;
    return {a1,b1,a2,aAfterReset};
  },{a:A,b:B});
  expect(result).toEqual({a1:1,b1:1,a2:1,aAfterReset:1});
});


test('uniquely owned legacy activity storage migrates to the strong learner token without duplication',async({page})=>{
  const legacyToken=id=>{let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
  await page.addInitScript(({a,legacy})=>{
    const user={id:a,name:'Migration QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},examPassStatus:{},certificates:[],certificateMeta:{},currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:a,users:{[a]:user}}));
    localStorage.setItem('mm_activity_events_v2::'+legacy,JSON.stringify({schema:2,version:'legacy-fixture',events:[{v:2,t:'2026-09-28T00:00:00.000Z',type:'practice_choice',activityType:'scenario',activityId:'scenario:legacy',itemId:'legacy',correct:true,competencyIds:['legacy-migrated']}]}));
  },{a:A,legacy:legacyToken(A)});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MM_ACTIVITY_EVENTS_V2&&!!window.MM_LEARNER_SCOPE&&!document.getElementById('mmBootstrap'),{timeout:30000});
  const result=await page.evaluate(legacy=>{
    const scope=window.MM_LEARNER_SCOPE,api=window.MM_ACTIVITY_EVENTS_V2;
    const strong=scope.storageKey('mm_activity_events_v2::',scope.token());
    const old='mm_activity_events_v2::'+legacy;
    const events=api.events({includeLegacy:false});
    return {events:events.map(e=>e.itemId),strong:localStorage.getItem(strong),legacy:localStorage.getItem(old)};
  },legacyToken(A));
  expect(result.events).toEqual(['legacy']);
  expect(result.strong).toBeTruthy();
  expect(result.legacy).toBeNull();
});
