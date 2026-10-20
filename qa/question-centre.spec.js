const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function loadLearner(page,{region='ALL'}={}){
  await page.addInitScript(({region})=>{
    const id='question-centre-qa';
    const user={id,name:'Question Centre QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:6,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  },{region});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_QUESTION_CENTRE&&window.MM_ASSESSMENT_QUALITY&&typeof window.getExamQuestions==='function'&&typeof window.switchView==='function');
}

test('Question Centre gathers the main governed question modes and keeps context on common phone widths',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await loadLearner(page);
  await page.evaluate(()=>switchView('scenarios'));
  await expect(page.locator('#scenarios')).toContainText('Question Centre');
  const visibleDescriptions=page.locator('#scenarios .mm-hub-tile small:visible');
  expect(await visibleDescriptions.count()).toBeGreaterThan(0);

  await page.getByRole('button',{name:'Open Question Centre →'}).click();
  const modal=page.locator('#modal:not(.hidden)');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading',{name:'Choose how you want to be questioned'})).toBeVisible();
  for(const name of ['Formal knowledge checks','Shop-floor scenarios','Diagnostic questions','Material questions','Measured-evidence decisions']){
    await expect(modal.getByRole('button',{name:new RegExp(name)})).toBeVisible();
  }
  await expect(modal).toContainText('169 governed question/decision prompts');
  const counts=await page.evaluate(()=>window.MM_QUESTION_CENTRE.counts());
  expect(counts).toEqual({formal:57,scenarios:40,diagnostic:36,materials:24,measured:12,total:169});
});

test('learner-scoped competency blueprint makes all 30 technical items reachable across repeated forms',async({page})=>{
  await loadLearner(page,{region:'NZ'});
  const result=await page.evaluate(()=>{
    const levels=['Beginner','Intermediate','Advanced'],out={};
    for(const level of levels){
      const seen=new Set(),forms=[];
      for(let attempt=0;attempt<8;attempt++){
        const rows=getExamQuestions(level,'NZ');
        const tech=rows.filter(q=>q.kind==='technical');
        tech.forEach(q=>seen.add(q.stableId));
        const coverage=new Set();
        tech.forEach(q=>(q.competencies||[q.competency]).forEach(x=>coverage.add(x)));
        forms.push({count:tech.length,coverage:coverage.size});
      }
      out[level]={seen:[...seen].sort(),forms};
    }
    return {out,key:window.MM_ASSESSMENT_STORAGE_SCOPE.blueprintHistoryKey(),history:window.MM_ASSESSMENT_STORAGE_SCOPE.read('mm_assessment_blueprint_history_v1',null)};
  });
  for(const level of ['Beginner','Intermediate','Advanced']){
    expect(result.out[level].seen).toHaveLength(10);
    for(const form of result.out[level].forms){
      expect(form.count).toBe(7);
      expect(form.coverage).toBeGreaterThanOrEqual(5);
    }
  }
  expect(result.key).toContain('mm_assessment_blueprint_history_v1::');
  expect(result.history?.levels?.Beginner?.attempts).toBeGreaterThanOrEqual(8);
});

test('assessment landing copy tells the truth for Compare All and single-region modes',async({page})=>{
  await loadLearner(page,{region:'ALL'});
  await page.evaluate(()=>switchView('exams'));
  const exams=page.locator('#exams');
  await expect(exams).toContainText('7 audited process questions plus 9 safety/compliance questions');
  await expect(exams).toContainText('Compare All tests every UK, US and NZ regional item');
  await expect(exams.locator('.exam-card').first()).toContainText('16 questions · 9 safety-critical');

  await page.evaluate(()=>{user.region='NZ';renderExams()});
  await expect(exams).toContainText('7 audited process questions plus 3 safety/compliance questions');
  await expect(exams.locator('.exam-card').first()).toContainText('10 questions · 3 safety-critical');
});

test('More routes maintenance through Support rather than presenting repair as a learning tool',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await loadLearner(page);
  await page.evaluate(()=>openMobileMenu());
  const modal=page.locator('#modal:not(.hidden)');
  await expect(modal).toContainText('Support & app maintenance');
  await expect(modal).not.toContainText(/^Repair app files$/);
});
