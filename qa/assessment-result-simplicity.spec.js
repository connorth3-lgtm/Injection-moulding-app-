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
  await page.waitForFunction(()=>window.MM_ASSESSMENT_UX?.version==='2026.09.06.9'&&typeof window.startExam==='function'&&typeof window.gradeExam==='function');
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
  await expect(visibleRows.locator('.mm-revision-detail')).toHaveCount(0);
  await expect(visibleRows).not.toContainText('Question revision');
  await expect(visibleRows).not.toContainText('DOI resolver set reviewed');
});

test('assessment question and review remain usable at 200% text scaling with keyboard focus',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openAssessment(page);
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
  const noOverflow=async label=>{const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);expect(overflow,label+' must not overflow horizontally').toBeFalsy()};
  await noOverflow('live assessment');
  const first=page.locator('#examQuestions .question.mm-current-question input[type=radio]').first();
  await first.focus();await page.keyboard.press('Space');await expect(first).toBeChecked();
  await page.getByRole('button',{name:'Next question'}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('#examQuestions .question').nth(1).locator('.mm-question-stem')).toBeFocused();
  await page.evaluate(()=>{
    const form=window.activeExam.questions;
    form.forEach((q,i)=>{const input=document.querySelector(`input[name=ex${i}][value="${q.correct}"]`);if(input&&!input.checked){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))}});
    const firstInput=document.querySelector('input[name=ex0]');if(firstInput){firstInput.checked=false;const wrong=(window.activeExam.questions[0].correct+1)%window.activeExam.questions[0].options.length;const bad=document.querySelector(`input[name=ex0][value="${wrong}"]`);if(bad){bad.checked=true;bad.dispatchEvent(new Event('change',{bubbles:true}))}}
    gradeExam('Beginner');
  });
  await expect(page.locator('#examResult')).toBeFocused();
  await noOverflow('assessment review');
  await expect(page.locator('#answerReview .answer-row:visible')).toHaveCount(1);
});


test('fixed assessment footer does not cover the active question at 200% text scaling',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openAssessment(page);
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
  const last=page.locator('#examQuestions .question.mm-current-question label').last();
  await last.scrollIntoViewIfNeeded();
  const geometry=await page.evaluate(()=>{
    const option=[...document.querySelectorAll('#examQuestions .question.mm-current-question label')].at(-1);
    const nav=document.querySelector('.mm-exam-nav');
    const card=document.querySelector('.modal-card.mm-assessment-modal');
    if(!option||!nav||!card)return null;
    const o=option.getBoundingClientRect(),n=nav.getBoundingClientRect(),cs=getComputedStyle(card);
    return {optionBottom:o.bottom,navTop:n.top,scrollPaddingBottom:parseFloat(cs.scrollPaddingBottom)||0,paddingBottom:parseFloat(cs.paddingBottom)||0};
  });
  expect(geometry).not.toBeNull();
  expect(geometry.optionBottom).toBeLessThanOrEqual(geometry.navTop+1);
  expect(geometry.scrollPaddingBottom).toBeGreaterThanOrEqual(180);
  expect(geometry.paddingBottom).toBeGreaterThanOrEqual(180);
});


test('assessment modal closes on Escape, restores focus and hides non-current controls from navigation',async({page})=>{
  await page.setViewportSize({width:768,height:900});
  await page.addInitScript(()=>{
    const user={id:'escape-focus-qa',name:'Escape Focus QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:6,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'escape-focus-qa',users:{'escape-focus-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_ACCESSIBILITY_HARDENING?.escapeClosesDialog===true&&typeof window.startExam==='function');
  const trigger=page.locator('.mobile-nav > button').filter({hasText:'Practice'}).first();
  await trigger.focus();
  await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>document.querySelectorAll('#examQuestions .question').length===16&&document.querySelector('#modal:not(.hidden)'));
  const hiddenState=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#examQuestions .question')];
    return cards.slice(1).every(card=>{
      const inputs=[...card.querySelectorAll('input,button,a,[tabindex]')];
      return card.getAttribute('aria-hidden')==='true'&&getComputedStyle(card).display==='none'&&inputs.every(el=>el.getClientRects().length===0);
    });
  });
  expect(hiddenState).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toHaveClass(/hidden/);
  await expect(trigger).toBeFocused();
});


test('assessment listing states the 16-question Compare All contract and 10-question single-region contract',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await page.addInitScript(()=>{
    const user={id:'contract-copy-qa',name:'Contract Copy QA',role:'learner',completed:[1,2,3],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'contract-copy-qa',users:{'contract-copy-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.switchView==='function'&&typeof window.renderExams==='function'&&window.MM_ASSESSMENT_FINAL_HARDENING?.syncExamListingContractCopy);
  await page.evaluate(()=>switchView('exams'));
  await expect(page.locator('#exams .exam-card .muted').first()).toContainText('16 questions · 7 technical + 9 regional safety');
  await expect(page.locator('#exams .section-head p')).toContainText('all 9 UK/US/NZ safety-compliance items');

  await page.evaluate(()=>setRegion('NZ'));
  await expect(page.locator('#exams .exam-card .muted').first()).toContainText('10 questions · 7 technical + 3 regional safety');
  await expect(page.locator('#exams .section-head p')).toContainText('7 technical questions plus 3 safety/compliance questions');
});
