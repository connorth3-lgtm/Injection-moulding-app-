const fs=require('fs');
const path=require('path');
const pixelmatch=require('pixelmatch');
const {PNG}=require('pngjs');
const {test,expect}=require('@playwright/test');

const manifest=require('./visual-regression-baseline.json');
const CANDIDATE_URL=process.env.MM_VISUAL_CANDIDATE_URL||'http://127.0.0.1:4173/index.html';
const BASELINE_URL=process.env.MM_VISUAL_BASE_URL||'http://127.0.0.1:4174/index.html';
const ARTIFACT_ROOT=path.join(process.cwd(),'qa-artifacts','visual-regression');

test.use({serviceWorkers:'block'});

function learner(id){
  return {
    id,
    name:'Visual Regression QA',
    role:'learner',
    completed:[1,2,3],
    bookmarks:[2],
    notes:{1:'Deterministic visual regression note.'},
    examScores:{},
    certificates:[],
    currentLesson:4,
    lastSeen:'2026-09-06T21:30:00.000Z',
    onboardingDone:true,
    experience:'Beginner',
    goal:'Learn the full process',
    dailyMinutes:15,
    region:'ALL'
  };
}

async function seed(page,id){
  await page.addInitScript(({id,user})=>{
    localStorage.clear();
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
    localStorage.removeItem('mm-assessment-question-history-v4');
    localStorage.removeItem('mm-assessment-result-meta-v1');
    localStorage.removeItem('mm_assessment_opening_history_v1');
    let state=0x23a55a17;
    Math.random=()=>{
      state=(Math.imul(state,1664525)+1013904223)>>>0;
      return state/0x100000000;
    };
  },{id,user:learner(id)});
}

async function openApp(page,url,id){
  await seed(page,id);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS&&typeof window.switchView==='function');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function clearTransientUi(page){
  await page.evaluate(()=>{
    document.querySelectorAll('.toast').forEach(node=>node.remove());
    try{window.closeModal?.()}catch(_){}
    const details=document.querySelector('.mm-read-aloud details');
    if(details)details.open=false;
    window.scrollTo(0,0);
    if(document.scrollingElement)document.scrollingElement.scrollTop=0;
    const main=document.querySelector('main.main')||document.querySelector('.main');
    if(main)main.scrollTop=0;
  });
}

async function normalizeCaptureState(page){
  await page.evaluate(()=>{
    document.querySelectorAll('.toast').forEach(node=>node.remove());
    const active=document.activeElement;
    if(active&&active!==document.body&&typeof active.blur==='function')active.blur();
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function prepareSurface(page,surface){
  await clearTransientUi(page);
  if(surface==='home'){
    await page.evaluate(()=>switchView('dashboard'));
    await expect(page.locator('#dashboard .mm-today-focus')).toBeVisible();
  }else if(surface==='learn'){
    await page.evaluate(()=>switchView('path'));
    await expect(page.locator('#path .mm-learn-hub')).toBeVisible();
  }else if(surface==='practice'){
    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
  }else if(surface==='lesson'){
    await page.evaluate(()=>{goLesson(4);switchView('lesson')});
    await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
  }else if(surface==='more'){
    await page.evaluate(()=>openMobileMenu());
    await expect(page.locator('#modal .modal-card')).toBeVisible();
    await expect(page.getByRole('heading',{name:'Tools & progress'})).toBeVisible();
  }else if(surface==='assessment'){
    await page.evaluate(()=>{switchView('exams');startExam('Beginner')});
    await page.waitForFunction(()=>Array.isArray(window.activeExam?.questions)&&window.activeExam.questions.length===16&&document.querySelectorAll('#examQuestions .question').length===16);
    await expect(page.locator('#examQuestions')).toBeVisible();
  }else if(surface==='listen-expanded'){
    await page.evaluate(()=>switchView('dashboard'));
    const host=page.locator('.mm-read-aloud');
    await expect(host).toBeVisible();
    await host.locator('details').evaluate(el=>{el.open=true});
    await expect(host.locator('[data-mm-read="play"]')).toBeVisible();
  }else{
    throw new Error(`Unknown visual surface: ${surface}`);
  }
  await normalizeCaptureState(page);
}

async function capture(page,file){
  return page.screenshot({path:file,fullPage:false,animations:'disabled',caret:'hide'});
}

function compare(baseBuffer,candidateBuffer,diffPath){
  const base=PNG.sync.read(baseBuffer);
  const candidate=PNG.sync.read(candidateBuffer);
  expect(candidate.width).toBe(base.width);
  expect(candidate.height).toBe(base.height);
  const diff=new PNG({width:base.width,height:base.height});
  const diffPixels=pixelmatch(base.data,candidate.data,diff.data,base.width,base.height,{threshold:0.05,includeAA:false});
  if(diffPixels>manifest.maxDiffPixels)fs.writeFileSync(diffPath,PNG.sync.write(diff));
  return diffPixels;
}

for(const viewport of manifest.viewports){
  test(`${viewport.name} matches immutable .23 baseline across learner surfaces`,async({browser})=>{
    fs.mkdirSync(ARTIFACT_ROOT,{recursive:true});
    const candidateContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block'});
    const baselineContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block'});
    const candidate=await candidateContext.newPage();
    const baseline=await baselineContext.newPage();
    const learnerId=`visual-${viewport.name}`;
    await openApp(candidate,CANDIDATE_URL,learnerId);
    await openApp(baseline,BASELINE_URL,learnerId);

    try{
      for(const surface of manifest.surfaces){
        await prepareSurface(candidate,surface);
        await prepareSurface(baseline,surface);
        const stem=`${viewport.name}-${surface}`;
        const candidatePath=path.join(ARTIFACT_ROOT,`${stem}.png`);
        const baselinePath=path.join(ARTIFACT_ROOT,`${stem}-baseline.png`);
        const diffPath=path.join(ARTIFACT_ROOT,`${stem}-diff.png`);
        const candidateBuffer=await capture(candidate,candidatePath);
        const baselineBuffer=await capture(baseline,baselinePath);
        const diffPixels=compare(baselineBuffer,candidateBuffer,diffPath);
        expect(diffPixels,`${stem} drifted by ${diffPixels} pixels from ${manifest.release} @ ${manifest.commit}`).toBeLessThanOrEqual(manifest.maxDiffPixels);
      }
    }finally{
      await candidateContext.close();
      await baselineContext.close();
    }
  });
}
