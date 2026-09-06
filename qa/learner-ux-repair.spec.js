const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function seed(page){
  await page.addInitScript(()=>{
    const user={id:'ux-repair-qa',name:'UX Repair QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:6,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'ux-repair-qa',users:{'ux-repair-qa':user}}));
    localStorage.removeItem('mm-assessment-question-history-v4');
    localStorage.removeItem('mm-assessment-result-meta-v1');
  });
}
async function open(page){
  await seed(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS&&window.MM_LEARNER_UX_REPAIR&&window.MM_SIMPLE_LESSON_EXPERIENCE);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}

for(const viewport of [{name:'android-412x915',width:412,height:915},{name:'small-360x800',width:360,height:800}]){
  test.describe(viewport.name,()=>{
    test.use({viewport:{width:viewport.width,height:viewport.height}});

    test('lesson opens as one simple flow with no duplicate mobile chrome',async({page})=>{
      await open(page);
      await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();
      await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
      await page.getByRole('button',{name:/Continue lesson/i}).first().click();
      await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
      await page.waitForFunction(()=>{
        const hidden=s=>[...document.querySelectorAll(s)].every(el=>getComputedStyle(el).display==='none'||el.hidden);
        return hidden('#lesson .mm-mobile-actions,#lesson .mm-mobile-lessons,#lesson .mm-lesson-progress,#lesson .mm-reading-guide,#lesson .mm-read-marker');
      });

      await expect(page.locator('#lesson .mm-mobile-actions')).toBeHidden();
      await expect(page.locator('#lesson .mm-mobile-lessons')).toBeHidden();
      await expect(page.locator('#lesson .mm-lesson-progress')).toBeHidden();
      await expect(page.locator('#lesson .mm-reading-guide')).toBeHidden();
      await expect(page.getByText('Read boxes 1, 2 and 3 in order.')).toBeHidden();

      const geometry=await page.evaluate(()=>{
        const hero=document.querySelector('#lesson .mm-simple-lesson-hero');
        const main=document.querySelector('main.main')||document.querySelector('.main');
        const rect=hero.getBoundingClientRect();
        return {heroTop:rect.top,heroBottom:rect.bottom,windowY:window.scrollY||0,rootY:document.scrollingElement?.scrollTop||0,mainY:main?.scrollTop||0};
      });
      expect(geometry.heroTop).toBeGreaterThanOrEqual(0);
      expect(geometry.heroTop).toBeLessThan(220);
      expect(geometry.windowY).toBeLessThanOrEqual(1);
      expect(geometry.rootY).toBeLessThanOrEqual(1);
      expect(geometry.mainY).toBeLessThanOrEqual(1);

      if(viewport.width===412)await page.screenshot({path:'qa-artifacts/mobile-lesson-412x915.png',fullPage:true});
    });
  });
}

test('learner UX repair preserves the governed selector and adds audited rotation',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await open(page);
  await page.waitForFunction(()=>{
    const snapshot=window.MM_RUNTIME_V2?.snapshot?.();
    return snapshot?.core?.getExamQuestions?.owner==='assessment-runtime-v2'&&window.MM_ASSESSMENT_RUNTIME_V2?.technicalPerExam===7&&window.__MM_ASSESSMENT_ROTATION_V4__;
  });
  const assessment=await page.evaluate(()=>({
    owner:window.MM_RUNTIME_V2.snapshot().core.getExamQuestions.owner,
    technicalPerExam:window.MM_ASSESSMENT_RUNTIME_V2.technicalPerExam,
    technicalBankPerLevel:window.MM_ASSESSMENT_RUNTIME_V2.technicalBankPerLevel,
    rotationVersion:window.__MM_ASSESSMENT_ROTATION_V4__.version,
    bankVersion:window.__MM_ASSESSMENT_ROTATION_V4__.bankVersion
  }));
  expect(assessment.owner).toBe('assessment-runtime-v2');
  expect(assessment.technicalPerExam).toBe(7);
  expect(assessment.technicalBankPerLevel).toBeGreaterThanOrEqual(10);
  expect(assessment.rotationVersion).toBe('2026.09.06.15');
  expect(assessment.bankVersion).toBe('assessment-2026.08.30.1');
});

test('consecutive assessment attempts do not repeat the opening question and forms stay valid',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await open(page);

  const result=await page.evaluate(()=>{
    const inspect=()=>{
      const form=window.activeExam?.questions||[];
      const keys=form.map(q=>String(q.q||'').replace(/\s+/g,' ').trim().toLowerCase());
      return {
        first:keys[0]||'',
        keys,
        valid:form.every(q=>Array.isArray(q.options)&&q.options.length>=2&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length),
        meta:window.MM_ACTIVE_QUESTION_FORM
      };
    };
    startExam('Beginner');
    const first=inspect();
    closeModal();
    startExam('Beginner');
    const second=inspect();
    return {first,second,history:JSON.parse(localStorage.getItem('mm-assessment-question-history-v4')||'{}')};
  });

  expect(result.first.first).not.toBe('');
  expect(result.second.first).not.toBe('');
  expect(result.second.first).not.toBe(result.first.first);
  expect(new Set(result.first.keys).size).toBe(result.first.keys.length);
  expect(new Set(result.second.keys).size).toBe(result.second.keys.length);
  expect(result.first.valid).toBe(true);
  expect(result.second.valid).toBe(true);
  expect(result.second.meta.bankVersion).toBe('assessment-2026.08.30.1');
  expect(result.second.meta.formFingerprint).toMatch(/^form-[0-9a-f]{8}$/);
  const attempts=Object.values(result.history).find(value=>Array.isArray(value)&&value.length>=2);
  expect(attempts).toBeTruthy();
});

test('graded assessment records the exact bank and form metadata used for the attempt',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await open(page);
  const meta=await page.evaluate(()=>{
    startExam('Beginner');
    const form=window.activeExam?.questions||[];
    form.forEach((q,i)=>{
      const input=document.querySelector(`input[name=ex${i}][value="${q.correct}"]`);
      if(input)input.checked=true;
    });
    gradeExam('Beginner');
    const records=JSON.parse(localStorage.getItem('mm-assessment-result-meta-v1')||'[]');
    return {record:records[0]||null,form:window.MM_ACTIVE_QUESTION_FORM};
  });
  expect(meta.record).toBeTruthy();
  expect(meta.record.bankVersion).toBe('assessment-2026.08.30.1');
  expect(meta.record.formFingerprint).toBe(meta.form.formFingerprint);
  expect(meta.record.questionKeys).toEqual(meta.form.questionKeys);
  expect(meta.record.score).toBe(100);
});
