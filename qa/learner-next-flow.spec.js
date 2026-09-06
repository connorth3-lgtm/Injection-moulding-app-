const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'flow-qa',name:'Flow QA',role:'learner',completed:[1,2,3],bookmarks:[2,7],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-06T12:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'flow-qa',users:{'flow-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_LEARNING_EXPERIENCE?.version==='2026.09.07.1');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}
test('Home resumes canonical currentLesson and Saved lessons uses canonical bookmarks',async({page})=>{
  await page.setViewportSize({width:412,height:915});await openApp(page);
  await expect(page.locator('#dashboard .mm-home-resume-label')).toHaveText('Resume');
  const expected=await page.evaluate(()=>currentLesson().title);
  await expect(page.locator('#dashboard .mm-today-focus h2')).toHaveText(expected);
  await page.getByRole('button',{name:/Saved lessons/i}).click();
  await expect(page.getByRole('heading',{name:'Saved lessons'})).toBeVisible();
  await expect(page.locator('#modal [data-mm-saved-lesson]')).toHaveCount(2);
  await page.locator('#modal [data-mm-saved-lesson="7"]').click();
  await expect(page.locator('#lesson')).toBeVisible();
  expect(await page.evaluate(()=>user.currentLesson)).toBe(7);
});
test('ranked offline search prefers an exact lesson title over body-only matches',async({page})=>{
  await openApp(page);
  const title=await page.evaluate(()=>D.lessons[6].title);
  const rows=await page.evaluate(q=>window.mmRankedSearch(q).slice(0,3).map(x=>({type:x.type,name:x.name,score:x.score})),title);
  expect(rows[0].type).toBe('Lesson');expect(rows[0].name).toBe(title);expect(rows[0].score).toBeGreaterThan(rows[1]?.score||0);
});
test('lesson has one completion action that names the actual next lesson',async({page})=>{
  await page.setViewportSize({width:412,height:915});await openApp(page);await page.evaluate(()=>switchView('lesson'));
  await page.waitForFunction(()=>window.MM_SIMPLE_LESSON_EXPERIENCE?.version==='2026.09.07.4');
  const nextTitle=await page.evaluate(()=>{const i=D.lessons.findIndex(x=>x.id===user.currentLesson);return D.lessons[i+1]?.title||''});
  const button=page.locator('#lesson .lesson-actions-sticky.mm-simple-completion > .primary');
  await expect(button).toHaveCount(1);await expect(button).toContainText('Next:');
  await expect(button).toHaveAttribute('aria-label',new RegExp(nextTitle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('assessment recommendation appears only after grading and points to a real lesson',async({page})=>{
  await openApp(page);await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>window.activeExam?.questions?.length>0&&document.querySelector('#examQuestions'));
  await expect(page.locator('.mm-assessment-next')).toHaveCount(0);
  await page.evaluate(()=>{window.activeExam.questions.forEach((q,i)=>{const input=document.querySelector(`input[name=ex${i}][value="${q.correct}"]`);input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))});gradeExam('Beginner')});
  await expect(page.locator('#examResult .mm-assessment-next')).toBeVisible();
  await expect(page.locator('#examResult .mm-assessment-next button')).toHaveText(/Open recommended lesson/);
});
