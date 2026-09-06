const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
async function seed(page){await page.addInitScript(()=>{
  let s=123456789;Math.random=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);Date.now=()=>1788732000000;
  const user={id:'visual-qa',name:'Visual QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[2,7],notes:{6:'Check mould safety and baseline evidence.'},examScores:{},certificates:[],currentLesson:6,lastSeen:'2026-09-06T12:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
  localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'visual-qa',users:{'visual-qa':user}}));
  localStorage.removeItem('mm_assessment_opening_history_v1');
});}
async function open(page,w,h){await page.setViewportSize({width:w,height:h});await seed(page);await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS&&window.MM_LEARNING_EXPERIENCE?.version==='2026.09.07.1');await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snap(page,name){await expect(page).toHaveScreenshot(name,{animations:'disabled',caret:'hide',fullPage:false,scale:'css',threshold:0.2,maxDiffPixelRatio:0.015});}
test('visual baseline · Home · 360x800',async({page})=>{await open(page,360,800);await snap(page,'home-360x800.png')});
test('visual baseline · Home · 412x915',async({page})=>{await open(page,412,915);await snap(page,'home-412x915.png')});
test('visual baseline · Learn · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();await expect(page.locator('#path .mm-learn-hub')).toBeVisible();await snap(page,'learn-412x915.png')});
test('visual baseline · Practice · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'Practice'}).click();await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();await snap(page,'practice-412x915.png')});
test('visual baseline · Lesson · 412x915',async({page})=>{await open(page,412,915);await page.evaluate(()=>switchView('lesson'));await page.waitForFunction(()=>window.MM_SIMPLE_LESSON_EXPERIENCE?.version==='2026.09.07.4');await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-412x915.png')});
test('visual baseline · More · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();await expect(page.locator('#modal .modal-card')).toBeVisible();await snap(page,'more-412x915.png')});
test('visual baseline · Assessment · 412x915',async({page})=>{await open(page,412,915);await page.evaluate(()=>startExam('Beginner'));await expect(page.locator('#examQuestions .mm-current-question')).toBeVisible();await snap(page,'assessment-412x915.png')});
test('visual baseline · Listen expanded · 412x915',async({page})=>{await open(page,412,915);const details=page.locator('.mm-read-aloud details');await details.locator('summary').click();await expect(details).toHaveAttribute('open','');await snap(page,'listen-expanded-412x915.png')});
test('visual baseline · Home · 810x1080',async({page})=>{await open(page,810,1080);await snap(page,'home-810x1080.png')});
test('visual baseline · Lesson · 810x1080',async({page})=>{await open(page,810,1080);await page.evaluate(()=>switchView('lesson'));await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-810x1080.png')});
test('visual baseline · Home · 1440x900',async({page})=>{await open(page,1440,900);await snap(page,'home-1440x900.png')});
test('visual baseline · Lesson · 1440x900',async({page})=>{await open(page,1440,900);await page.evaluate(()=>switchView('lesson'));await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-1440x900.png')});
