const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');
const BASE='http://127.0.0.1:4173/';

async function openApp(page,width,learningAwards=[]){
  await page.addInitScript(({learningAwards})=>{
    const id='reachability-qa',user={id,name:'Reachability QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},learningAwards,currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
      localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  },{learningAwards});
  await page.setViewportSize({width,height:900});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&!document.getElementById('mmBootstrap')&&!!window.MMBook,{timeout:30000});
  await page.evaluate(async()=>{if(window.MM_ACCESSIBILITY_HARDENING_LOADING)await window.MM_ACCESSIBILITY_HARDENING_LOADING});
  await page.waitForFunction(()=>window.MM_ACCESSIBILITY_HARDENING?.nonBlockingDrawersExcluded===true,{timeout:10000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}
async function mobileHub(page,name){await page.locator('.mobile-nav > button').filter({hasText:name}).click()}
async function mobileMore(page){await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();await expect(page.locator('#modal .modal-card')).toBeVisible()}
async function revealMoreAction(page,action){
  // A More destination is reachable through a visible native disclosure,
  // not required to be permanently visible inside a collapsed category.
  const group=action.locator('xpath=ancestor::details[contains(@class,"mm-more-disclosure")][1]');
  await expect(group.locator(':scope > summary')).toBeVisible();
  if(!(await group.evaluate(node=>node.open)))await group.locator(':scope > summary').click();
  await expect(action).toBeVisible({timeout:10000});
}

async function closeModal(page){const b=page.getByRole('button',{name:/^close$/i}).first();if(await b.isVisible().catch(()=>false))await b.click();await expect(page.locator('#modal')).toHaveClass(/hidden/)}
async function expectVisible(page,selector){await expect(page.locator(selector)).toBeVisible({timeout:10000})}
async function expectNoHorizontalOverflow(page,label){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);expect(overflow,label+' must not introduce horizontal page overflow').toBeFalsy()}
async function openAssessmentsFromQuestionCentre(page,width){
 if(width<=900)await mobileHub(page,'Learn');
 else{const learn=page.locator('#nav button[data-view="path"]');await expect(learn).toBeVisible();await learn.click()}
 await expectVisible(page,'#path .mm-learn-hub');
 const centre=page.locator('#path [data-mm-hub-action="question-centre"]');await expect(centre).toBeVisible();await centre.click();
 await expectVisible(page,'#path .mm-question-centre');
 const assessments=page.locator('#path .mm-question-centre [data-mm-hub-action="assessments"]');await expect(assessments).toBeVisible();await assessments.click();
 await expectVisible(page,'#exams');
}

async function openDeepLink(page,view){
 await page.addInitScript(()=>{
  const id='deep-link-qa',user={id,name:'Deep Link QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},learningAwards:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
  localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
 });
 await page.setViewportSize({width:768,height:900});
 await page.goto(BASE+'index.html?view='+encodeURIComponent(view),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&!document.getElementById('mmBootstrap'),{timeout:30000});
 await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
}
test.describe('canonical startup deep links',()=>{
 test('core and compatibility view routes open their requested learner surfaces',async({page})=>{
  for(const [view,selector] of [['materials','#materials'],['assessment','#exams'],['standards','#standards']]){
   await openDeepLink(page,view);
   await expectVisible(page,selector);
  }
 });
 test('custom governed routes open Book, process data and readiness surfaces',async({page})=>{
  for(const [view,selector] of [['book','#mmBookView'],['processDataLabs','#processDataLabs'],['standards-readiness','#mmStandardsReadinessView']]){
   await openDeepLink(page,view);
   await expectVisible(page,selector);
  }
 });
});

test('regional study pathways connect the app and Book on a phone',async({page})=>{
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 await openApp(page,360);
 await mobileMore(page);
 const launcher=page.locator('[data-mm-registry-menu="standards-readiness"]');
 await revealMoreAction(page,launcher);
 await launcher.click();
 const readiness=page.locator('#mmStandardsReadinessView');
 const group=readiness.getByRole('group',{name:'Choose education pathway region'});
 const cards=readiness.locator('[data-education-pathway]');
 const knownModules=await page.evaluate(async()=>{
  const manifest=await window.MMBook.load();
  return manifest.parts.flatMap(part=>part.chapters.map(chapter=>chapter.id));
 });
 for(const [region,headings] of [
  ['New Zealand',[/Plastics Processing \(Level 3\)/,/Plastics Processing \(Level 4\)/]],
  ['United Kingdom',[/Polymer processing technician/,/Scientific, Technical and Formulation Processing/,/Polymer Processing Operations apprenticeships/,/Polymer processing operations apprenticeship framework/]],
  ['India',[/Assistant Machine Operator.*Injection Moulding/,/Machine Operator.*Injection Molding/]],
 ]){
  const regionButton=group.getByRole('button',{name:region,exact:true});
  await regionButton.focus();
  await regionButton.press('Enter');
  await expect(regionButton).toBeFocused();
  await expect(regionButton).toHaveAttribute('aria-pressed','true');
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(cards).toHaveCount(headings.length);
  for(const title of headings)await expect(cards.getByRole('heading',{name:title})).toBeVisible();
  for(const card of await cards.all()){
   const moduleIds=await card.locator('[data-education-book-module]').evaluateAll(nodes=>nodes.map(node=>node.dataset.educationBookModule));
   expect(moduleIds.length).toBeGreaterThan(0);
   expect(moduleIds.filter(id=>!knownModules.includes(id))).toEqual([]);
   await expect(card.getByRole('link').first()).toHaveAttribute('href',/^https:\/\//);
   const course=card.locator('[data-education-course]');
   await course.locator(':scope > summary').click();
   await expect(course.getByText('Draft for provider review',{exact:true})).toBeVisible();
   await expect(course.getByText(/^Study and evidence map/)).toBeVisible();
   await course.locator(':scope > summary').click();
  }
  if(region==='United Kingdom'){
   const england=cards.locator('[data-education-course="uk-england-st1328"]');
   await england.locator(':scope > summary').click();
   await england.getByText('End-point assessment methods',{exact:true}).click();
   await expect(england.getByRole('heading',{name:'Workplace observation with questions'})).toBeVisible();
   await expect(england.getByText(/40-question test with 60 minutes/)).toBeVisible();
   await england.locator(':scope > summary').click();
  }
  await expectNoHorizontalOverflow(page,region+' regional study pathways');
 }
 // Pathway cards are the elements carrying data-education-pathway. Search
 // from the readiness view so this selector matches the card itself rather
 // than looking for a nested card inside the collection of cards.
 const indiaAssistant=readiness.locator('[data-education-pathway="india-cipet-amo-im"]');
 await expect(indiaAssistant.getByRole('link',{name:/National Qualification Register/}).first()).toHaveAttribute('href','https://www.nqr.gov.in/qualifications/14257');
 await indiaAssistant.getByText('Official qualification modules and hours').click();
 await expect(indiaAssistant.getByText('Mandatory on-the-job training (30 h)')).toBeVisible();
 await expect(indiaAssistant.getByText(/Theory 50 h · Practical 130 h/)).toBeVisible();
 const assistantPack=indiaAssistant.locator('[data-education-course="india-cipet-amo-im"]');
 await assistantPack.locator(':scope > summary').click();
 await assistantPack.getByText('Delivery and training records',{exact:true}).click();
 await expect(assistantPack.getByText(/NQR page classifies the 480 hours as 120 theory/)).toBeVisible();
 await expect(assistantPack.getByText(/lists DGT\/VSQ\/N0101 as V2.0/)).toBeVisible();
 const indiaOperator=readiness.locator('[data-education-pathway="india-cipet-mo-im"]');
 await expect(indiaOperator.getByRole('link',{name:/National Qualification Register/}).first()).toHaveAttribute('href','https://www.nqr.gov.in/qualifications/14350');
 await indiaOperator.getByText('Official qualification modules and hours').click();
 await expect(indiaOperator.getByText('Mandatory on-the-job training (30 h)')).toBeVisible();
 await expect(indiaOperator.getByText(/Theory 90 h · Practical 180 h/)).toBeVisible();
 const india=indiaOperator.locator('[data-education-course="india-cipet-mo-im"]');
 await india.locator(':scope > summary').click();
 await india.getByText('Delivery and training records',{exact:true}).click();
 await expect(india.getByText(/180 theory, 30 employability, 360 practical and 30 mandatory on-the-job hours/)).toBeVisible();
 await expect(india.getByText(/200 theory and 400 practical marks/)).toBeVisible();
 await india.getByText(/^Study and evidence map/).click();
 await expect(india.getByText(/CPC\/N0221 AO11 \(repeated source row\)/)).toBeVisible();
 const indiaSafety=india.locator('[data-education-exercise="india-5s"]');
 await india.locator('[data-education-workbook="india-5s"]').first().click();
 await expect(indiaSafety.locator(':scope > summary')).toBeFocused();
 const hindi=indiaSafety.locator('details[lang="hi"]');
 await hindi.locator(':scope > summary').click();
 await expect(hindi.locator('ol > li').first()).toBeVisible();
 await hindi.getByText('उत्तर और कारण देखें',{exact:true}).first().click();
 await expect(hindi.locator('ol details[open] p')).toBeVisible();
 await expectNoHorizontalOverflow(page,'Expanded India mapping and Hindi workbook');
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
 await expectNoHorizontalOverflow(page,'Expanded India mapping at 200% text scaling');
 await page.evaluate(()=>{document.documentElement.style.fontSize=''});
 await india.getByText('Provider review and blank records',{exact:true}).click();
 const downloaded=page.waitForEvent('download');
 await india.getByRole('button',{name:'Download draft assessor pack'}).click();
 const download=await downloaded;
 expect(download.suggestedFilename()).toBe('mouldmaster-india-cipet-mo-im-assessor-draft.md');
 const assessorPack=await readFile(await download.path(),'utf8');
 for(const marker of ['Draft for provider review','## Formative workbooks','## Provider review','Workplace observation','180 theory, 30 employability','CPC/N0221 AO11 (repeated source row)','काल्पनिक']){
  expect(assessorPack).toContain(marker);
 }
 await india.locator(':scope > summary').click();
 await indiaOperator.getByRole('button',{name:'What Injection Moulding Is',exact:true}).click();
 const book=page.locator('#mmBookView');
 await expect(book.locator('[data-mm-book-reader] h2')).toHaveText('What injection moulding is and what the process must achieve');
 await book.getByRole('button',{name:'Book contents'}).click();
 await book.getByText('Reading guide & editorial notes',{exact:true}).click();
 await book.getByRole('button',{name:'Regional study pathways: NZ, UK and India'}).click();
 await expect(group.getByRole('button',{name:'India',exact:true})).toHaveAttribute('aria-pressed','true');
 await indiaOperator.getByRole('button',{name:'Open Practice in the app'}).click();
 await expectVisible(page,'#scenarios .mm-practice-hub');
 await mobileMore(page);
 const bookLink=page.locator('[data-mm-registry-menu="book"]');
 await revealMoreAction(page,bookLink);
 await bookLink.click();
 const supplements=book.locator('[data-mm-book-education-supplements]');
 await supplements.locator(':scope > summary').click();
 const workbook=supplements.locator('[data-education-exercise="quality-record"]');
 await workbook.locator(':scope > summary').click();
 await expect(workbook.getByText(/fictional training drawing/)).toBeVisible();
 await supplements.locator('[data-education-course-link="nz-nzqa-4401"]').click();
 const operator=cards.locator('[data-education-course="nz-nzqa-4401"]');
 await expect(operator.locator(':scope > summary')).toBeFocused();
 const change=operator.locator('[data-education-practical="27926"]');
 await change.locator(':scope > summary').click();
 await expect(change.getByText(/two eligible advanced moulds/)).toBeVisible();
 await expect(change.getByText(/three different types/)).toBeVisible();
 await expect(change.locator('ol > li')).toHaveCount(8);
 await operator.getByText(/^Study and evidence map/).click();
 const lesson=operator.locator('[data-education-lesson="41"]').first();
 const title=(await lesson.textContent()).split(' · ')[1];
 await lesson.click();
 await expect(page.locator('#lesson').getByRole('heading',{name:title,exact:true})).toBeVisible();
 await expectVisible(page,'#lesson');
 expect(pageErrors).toEqual([]);
});

for(const viewport of [{name:'mobile',width:412},{name:'tablet',width:768},{name:'desktop',width:1440}]){
 test.describe('UI-only feature reachability '+viewport.name,()=>{
  test('dashboard never exposes obsolete three-certificate denominator',async({page})=>{
   await openApp(page,viewport.width,['Beginner-ALL','Beginner-UK','Beginner-US','Beginner-NZ']);
   await expect(page.locator('#dashboard')).not.toContainText('4/3');
   const state=await page.evaluate(()=>{
     const rows=[...document.querySelectorAll('#dashboard .statline')],row=rows.find(x=>String(x.textContent||'').includes('Certificates earned'));
     return row?{present:true,value:String(row.querySelector('b')?.textContent||''),visible:!!(row.offsetWidth||row.offsetHeight||row.getClientRects().length)}:{present:false}
   });
   if(state.present)expect(state.value).toBe('4');
  });
  test('Book is discoverable and opens through visible UI',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){await mobileMore(page);const book=page.locator('[data-mm-registry-menu="book"]');await revealMoreAction(page,book);await book.click()}
   else {const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();const book=page.locator('[data-mm-registry-menu="book"]');await revealMoreAction(page,book);await book.click()}
   await expectVisible(page,'#mmBookView');
  });
  test('Measured evidence references stay inside the Process Data practice flow',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){await mobileHub(page,'Practice');await expectVisible(page,'#scenarios .mm-practice-hub')}
   else {const practice=page.locator('#nav button[data-view="scenarios"]');await expect(practice).toBeVisible();await practice.click();await expectVisible(page,'#scenarios .mm-practice-hub')}
   const process=page.locator('#scenarios [data-mm-hub-action="process-data"]');await expect(process).toBeVisible();await process.click();
   await expectVisible(page,'#processDataLabs');
   const labs=page.locator('#processDataLabs');
   await expect(labs.locator('.pd-hero')).toContainText('Start with a guided case');
   await expect(page.locator('#processDataLabs > .pd-toolbar [data-pd-practice]')).toHaveCount(0);
   await expect(labs.locator('[data-mme-catalog-launcher]')).toHaveCount(0);
   const register=labs.locator('[data-mme-catalog-inline]');await expect(register).toBeVisible();
   await register.locator('summary').click();
   await expect(register.locator('.mme-card')).toHaveCount(17);
   await expect(register.locator('.mme-card a[href]')).toHaveCount(17);
   await expect(page.locator('#pageTitle')).not.toHaveText('Measured Data');
  });
  test('core learning and practice destinations are reachable by clicks',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await mobileHub(page,'Learn');await expectVisible(page,'#path .mm-learn-hub');
    await mobileHub(page,'Materials');await expectVisible(page,'#materials');
    await openAssessmentsFromQuestionCentre(page,viewport.width);
    await mobileHub(page,'Practice');await page.locator('#scenarios [data-mm-hub-action="labs"]').click();await page.locator('#modal [data-mm-hub-action="simulator"]').click();await expectVisible(page,'#simulator');
   }else{
    for(const [view,selector] of [['path','#path'],['scenarios','#scenarios'],['materials','#materials']]){
     const b=page.locator('#nav button[data-view="'+view+'"]');await expect(b).toBeVisible();await b.click();await expectVisible(page,selector);
    }
   }
  });

  test('Book and assessment surfaces survive zoom and preserve focus recovery',async({page})=>{
   await openApp(page,viewport.width);await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
   if(viewport.width<=900){await mobileMore(page);const trigger=page.locator('.mobile-nav > button').filter({hasText:'More'});await closeModal(page);await expect(trigger).toBeFocused();await mobileMore(page);const book=page.locator('[data-mm-registry-menu="book"]');await revealMoreAction(page,book);await book.click()}
   else {const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();const book=page.locator('[data-mm-registry-menu="book"]');await revealMoreAction(page,book);await book.click()}
   await expectVisible(page,'#mmBookView');await expectNoHorizontalOverflow(page,'Book at 200% text scaling');
   await openAssessmentsFromQuestionCentre(page,viewport.width);await expectNoHorizontalOverflow(page,'Assessments at 200% text scaling');
  });
  test('reference UI exposes one canonical launcher without duplicate desktop controls',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
    await mobileMore(page);await revealMoreAction(page,page.locator('[data-mm-registry-menu="reference-data"]'));
   }else{
    await expect(page.locator('#mmrd-open')).toBeVisible();await expect(page.locator('#mm-src-open')).toBeHidden();
    await expect(page.locator('#mm-src-open')).toHaveAttribute('aria-hidden','true');await expect(page.locator('#mm-src-open')).toHaveAttribute('tabindex','-1');
    const visibleReferenceLaunchers=await page.locator('#mm-src-open:visible,#mmrd-open:visible').count();expect(visibleReferenceLaunchers).toBe(1);
   }
  });
  test('reference launcher state follows tablet-to-desktop resize without duplicates',async({page})=>{
   await openApp(page,768);
   await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
   await page.setViewportSize({width:1024,height:900});
   await expect(page.locator('#mmrd-open')).toBeVisible();await expect(page.locator('#mm-src-open')).toBeHidden();
   await expect(page.locator('#mm-src-open')).toHaveAttribute('aria-hidden','true');await expect(page.locator('#mm-src-open')).toHaveAttribute('tabindex','-1');
   await page.setViewportSize({width:768,height:900});
   await expect(page.locator('#mm-src-open')).toBeHidden();await expect(page.locator('#mmrd-open')).toBeHidden();
  });
  test('shell-registered tools are discoverable through their intended visible surface',async({page})=>{
   await openApp(page,viewport.width);
   if(viewport.width<=900){
    await mobileMore(page);
    for(const id of ['book','learning-insights','repair-app-files'])await revealMoreAction(page,page.locator('[data-mm-registry-menu="'+id+'"]'));
    await closeModal(page);await mobileHub(page,'Practice');
    for(const action of ['problem-practice','process-data','labs'])await expect(page.locator('#scenarios [data-mm-hub-action="'+action+'"]')).toBeVisible();
   }else{
    const more=page.locator('#nav [data-mm-desktop-more-tools]');await expect(more).toBeVisible();await more.click();await expect(page.locator('#modal .modal-card')).toBeVisible();
    for(const name of ['Standards & safety','Profile & data'])await revealMoreAction(page,page.locator('#modal .quick-action').filter({hasText:name}));
    for(const name of ['Process simulator','Defect finder','Troubleshooting coach','Knowledge checks'])await expect(page.locator('#modal .quick-action').filter({hasText:name})).toHaveCount(0);
    await closeModal(page);
    const practice=page.locator('#nav button[data-view="scenarios"]');await expect(practice).toBeVisible();await practice.click();await expectVisible(page,'#scenarios .mm-practice-hub');
    for(const action of ['problem-practice','process-data','labs'])await expect(page.locator('#scenarios [data-mm-hub-action="'+action+'"]')).toBeVisible();
    await expect(page.locator('#scenarios [data-mm-hub-action="question-centre"]')).toHaveCount(0);
   }
  });
 });
}


test('desktop References drawer remains explicitly non-blocking and keeps canonical launcher semantics',async({page})=>{
 await openApp(page,1440);
 await expect(page.locator('#mmrd-open')).toBeVisible();
 await page.locator('#mmrd-open').click();
 const drawer=page.locator('.mmrd');
 await expect(drawer).toBeVisible();
 await expect(drawer).toHaveAttribute('data-mm-non-blocking','1');
 await expect(drawer).toHaveAttribute('aria-modal','false');
 expect(await page.evaluate(()=>window.MM_ACCESSIBILITY_HARDENING?.nonBlockingDrawersExcluded===true)).toBeTruthy();
 await page.setViewportSize({width:768,height:900});
 await expect(page.locator('#mmrd-open')).toBeHidden();
 await expect(drawer).toHaveAttribute('aria-modal','false');
 await page.setViewportSize({width:1440,height:900});
 await expect(page.locator('#mmrd-open')).toBeVisible();
 await expect(drawer).toHaveAttribute('aria-modal','false');
});
