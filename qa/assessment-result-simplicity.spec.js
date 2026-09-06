const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openAssessment(page){
  await page.addInitScript(()=>{
    const user={id:'simple-result-qa',name:'Simple Result QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:6,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'simple-result-qa',users:{'simple-result-qa':user}}));
    localStorage.removeItem('mm-assessment-question-history-v4');
    localStorage.removeItem('mm-assessment-result-meta-v1');
    localStorage.removeItem('mm_assessment_opening_history_v1');
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_ASSESSMENT_UX?.version==='2026.09.07.1'&&typeof window.startExam==='function'&&typeof window.gradeExam==='function');
  await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>Array.isArray(window.activeExam?.questions)&&window.activeExam.questions.length===16&&document.querySelectorAll('#examQuestions .question').length===16);
}

test('graded assessment shows one clear result and only answers needing review',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openAssessment(page);

  await page.evaluate(()=>{
    const form=window.activeExam.questions;
    form.forEach((q,i)=>{
      const selected=i===0?(q.correct+1)%q.options.length:q.correct;
      const input=document.querySelector(`input[name=ex${i}][value="${selected}"]`);
      if(!input)throw new Error(`missing assessment input ${i}`);
      input.checked=true;
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    gradeExam('Beginner');
  });

  const result=page.locator('#examResult');
  await expect(result.locator('.mm-result-summary')).toBeVisible();
  await expect(result.locator('.mm-result-score')).toContainText('%');
  await expect(result).not.toContainText('Certificate rule unchanged');
  await expect(page.locator('#examQuestions')).toBeHidden();

  const visibleRows=page.locator('#answerReview .answer-row:visible');
  await expect(visibleRows).toHaveCount(1);
  await expect(page.locator('#answerReview .answer-row.correct:visible')).toHaveCount(0);
  await expect(visibleRows).toContainText('Question 1');
  await expect(visibleRows).toContainText('Your answer:');
  await expect(visibleRows).toContainText('Correct answer:');
  await expect(page.locator('#mmReviewIntro')).toBeVisible();

  const source=visibleRows.locator('details.mm-review-source');
  await expect(source).toHaveCount(1);
  await expect(source).not.toHaveAttribute('open','');
  await expect(source.locator('summary')).toHaveText('Source');
});