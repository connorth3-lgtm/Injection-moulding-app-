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

async function openApp(page,url,id,{candidate=false}={}){
  await seed(page,id);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&window.MM_PRIMARY_HUBS&&typeof window.switchView==='function');
  if(candidate)await page.waitForFunction(()=>Boolean(window.MM_LEARNER_UI_POLISH));
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function clearTransientUi(page){
  await page.evaluate(()=>{
    document.querySelectorAll('[data-mm-visual-bg-hidden="true"]').forEach(node=>{
      node.hidden=false;
      node.removeAttribute('data-mm-visual-bg-hidden');
    });
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

async function normalizeCaptureState(page,surface){
  await page.evaluate(({surface})=>{
    document.querySelectorAll('.toast').forEach(node=>node.remove());
    const sidebar=document.querySelector('.sidebar');
    if(sidebar)sidebar.scrollTop=0;
    const nav=document.getElementById('nav');
    if(nav)nav.scrollTop=0;
    const active=document.activeElement;
    if(active&&active!==document.body&&typeof active.blur==='function')active.blur();
    if(surface==='assessment'){
      Array.from(document.body.children).forEach(node=>{
        if(node.id==='modal'||node.tagName==='SCRIPT')return;
        if(!node.hidden){
          node.hidden=true;
          node.setAttribute('data-mm-visual-bg-hidden','true');
        }
      });
    }
  },{surface});
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
  }else if(surface==='materials'){
    await page.evaluate(()=>switchView('materials'));
    await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible();
  }else if(surface==='practice'){
    await page.evaluate(()=>switchView('scenarios'));
    await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();
  }else if(surface==='lesson'){
    await page.evaluate(()=>{goLesson(4);switchView('lesson')});
    await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();
  }else if(surface==='more'){
    await page.evaluate(()=>openMobileMenu());
    await expect(page.locator('#modal .modal-card')).toBeVisible();
    await expect(page.getByRole('heading',{name:'More'})).toBeVisible();
  }else if(surface==='assessment'){
    await page.evaluate(()=>{
      switchView('exams');
      const fixture=Array.from({length:16},(_,i)=>({
        q:`Visual regression question ${String(i+1).padStart(2,'0')}: which response best demonstrates a controlled evidence-based decision?`,
        options:[
          'Compare the relevant actuals with the known-good baseline',
          'Change several settings together and judge appearance only',
          'Treat one isolated signal as proof of the root cause',
          'Ignore the measured response because the recipe is unchanged'
        ],
        correct:0,
        explanation:'Visual fixture only: preserve deterministic assessment layout while membership-selection policy is tested elsewhere.',
        reference:'Visual regression fixture',
        stableId:`visual-regression:${String(i+1).padStart(2,'0')}`,
        mmStableId:`visual-regression:${String(i+1).padStart(2,'0')}`,
        difficulty:'Foundation',
        competency:'General'
      }));
      const original=window.getExamQuestions;
      window.getExamQuestions=()=>fixture.map(q=>({...q,options:q.options.slice()}));
      try{startExam('Beginner')}finally{window.getExamQuestions=original}
    });
    await page.waitForFunction(()=>Array.isArray(window.activeExam?.questions)&&window.activeExam.questions.length===16&&document.querySelectorAll('#examQuestions .question').length===16);
    await expect(page.locator('#examQuestions')).toBeVisible();
  }else if(surface==='book-contents'){
    await page.evaluate(()=>window.MMBook.open());
    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
    await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);
  }else if(surface==='book-materials'){
    await page.evaluate(()=>window.MMBook.open());
    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
    await page.locator('[data-mm-book-chapter="material-families"]').click();
    await expect(page.locator('[data-mm-book-material-atlas]')).toBeVisible();
    const canonical=page.locator('[data-mm-book-canonical-catalog]');
    await canonical.locator(':scope > summary').click();
    const first=canonical.locator('[data-mm-book-catalog-grade]').first();
    await first.locator(':scope > summary').click();
    await expect(first).toBeVisible();
  }else if(surface==='book-late'){
    await page.evaluate(()=>window.MMBook.open());
    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
    await page.locator('[data-mm-book-chapter]').nth(41).click();
    await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  }else if(surface==='book-trace'){
    await page.evaluate(()=>window.MMBook.open());
    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);
    await page.locator('[data-mm-book-chapter]').first().click();
    const trace=page.locator('.mm-book-claim-trace').first();if(await trace.count())await trace.evaluate(el=>{el.open=true});
    await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();
  }else if(surface==='listen-expanded'){
    await page.evaluate(()=>switchView('dashboard'));
    const host=page.locator('.mm-read-aloud');
    await expect(host).toBeVisible();
    await host.locator('details').evaluate(el=>{el.open=true});
    await expect(host.locator('[data-mm-read="play"]')).toBeVisible();
  }else if(surface==='listening'){
    await page.waitForFunction(()=>typeof window.MMReadAloud?.openListening==='function');
    await page.evaluate(()=>window.MMReadAloud.openListening());
    await expect(page.locator('#mmListeningView')).toBeVisible();
    await expect(page.locator('[data-mm-listening="play"]')).toBeVisible();
  }else{
    throw new Error(`Unknown visual surface: ${surface}`);
  }
  await normalizeCaptureState(page,surface);
}

async function capture(page,file,surface){
  if(surface==='assessment'){
    return page.locator('#modal .modal-card').screenshot({path:file,animations:'disabled',caret:'hide'});
  }
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
  test(`${viewport.name} matches approved ${manifest.release} baseline across learner surfaces`,async({browser})=>{
    test.setTimeout(120000);
    fs.mkdirSync(ARTIFACT_ROOT,{recursive:true});
    const candidateContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block'});
    const baselineContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block'});
    const candidate=await candidateContext.newPage();
    const baseline=await baselineContext.newPage();
    const learnerId=`visual-${viewport.name}`;
    await openApp(candidate,CANDIDATE_URL,learnerId,{candidate:true});
    await openApp(baseline,BASELINE_URL,learnerId);

    try{
      for(const surface of manifest.surfaces){
        await prepareSurface(candidate,surface);
        await prepareSurface(baseline,surface);
        const stem=`${viewport.name}-${surface}`;
        const candidatePath=path.join(ARTIFACT_ROOT,`${stem}.png`);
        const baselinePath=path.join(ARTIFACT_ROOT,`${stem}-baseline.png`);
        const diffPath=path.join(ARTIFACT_ROOT,`${stem}-diff.png`);
        const candidateBuffer=await capture(candidate,candidatePath,surface);
        const baselineBuffer=await capture(baseline,baselinePath,surface);
        const diffPixels=compare(baselineBuffer,candidateBuffer,diffPath);
        expect(diffPixels,`${stem} drifted by ${diffPixels} pixels from ${manifest.release} @ ${manifest.commit}`).toBeLessThanOrEqual(manifest.maxDiffPixels);
      }
    }finally{
      await candidateContext.close();
      await baselineContext.close();
    }
  });
}
