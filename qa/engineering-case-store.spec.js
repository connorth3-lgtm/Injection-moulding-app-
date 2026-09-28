const {test,expect}=require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';
const USER_A='engineering-store-qa-a';
const USER_B='engineering-store-qa-b';
const LEGACY_CASE_ID='legacy-engineering-case';

function legacyLearnerToken(raw){let h=2166136261;for(const ch of String(raw)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
const SEEDED_LEGACY_KEY=`mm_mould_master_cases_v1::${legacyLearnerToken(USER_A)}`;

async function waitForApp(page){
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_ENGINEERING_STORE&&window.MM_MOULD_MASTER_WORKSPACE&&window.MM_MATERIAL_REGISTRY,{timeout:30000});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.hydrate({force:true}));
}

async function switchLearner(page,id){
  await page.evaluate(next=>{if(typeof switchUser!=='function')throw new Error('switchUser unavailable');switchUser(next)},id);
  await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.open());
}

test('Mould Master uses one owner-scoped IndexedDB store with one-time legacy import',async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(({userA,userB,legacyKey,legacyCaseId})=>{
    const makeUser=(id,name)=>({id,name,role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},examPassStatus:{},certificates:[],certificateMeta:{},currentLesson:1,lastSeen:new Date().toISOString(),region:'ALL',experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,onboardingDone:true});
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:userA,users:{[userA]:makeUser(userA,'Engineering QA A'),[userB]:makeUser(userB,'Engineering QA B')}}));
    localStorage.setItem(legacyKey,JSON.stringify([{id:legacyCaseId,createdAt:'2026-08-01T00:00:00.000Z',updatedAt:'2026-08-01T00:00:00.000Z',title:'Legacy imported title',defect:'Short shot',material:'Legacy material',status:'Investigating'}]));
  },{userA:USER_A,userB:USER_B,legacyKey:SEEDED_LEGACY_KEY,legacyCaseId:LEGACY_CASE_ID});

  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await waitForApp(page);

  const imported=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),LEGACY_CASE_ID);
  expect(imported).toBeTruthy();
  expect(imported.title).toBe('Legacy imported title');
  expect(imported.legacySource).toBe('mm_mould_master_cases_v1');
  expect(await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.canonicalStore)).toBe('indexeddb-v2');
  const migratedLegacyKey=await page.evaluate(()=>window.MM_ENGINEERING_STORE.legacyKey());
  expect(migratedLegacyKey).not.toBe(SEEDED_LEGACY_KEY);
  const legacyRaw=await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey);
  expect(legacyRaw).toBeTruthy();
  expect(await page.evaluate(key=>localStorage.getItem(key),SEEDED_LEGACY_KEY)).toBeNull();

  await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.open(id),LEGACY_CASE_ID);
  const title=page.locator('[data-mw-field="title"]');
  await expect(title).toHaveValue('Legacy imported title');
  await title.fill('Canonical IndexedDB edit');
  await page.getByRole('button',{name:'Save case'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.getCase(id).then(c=>c?.title==='Canonical IndexedDB edit'),LEGACY_CASE_ID);
  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);

  await page.reload({waitUntil:'domcontentloaded'});
  await waitForApp(page);
  expect((await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),LEGACY_CASE_ID)).title).toBe('Canonical IndexedDB edit');
  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);

  await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.open(id),LEGACY_CASE_ID);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Delete case'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.getCase(id).then(c=>c===null),LEGACY_CASE_ID);
  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);

  await page.reload({waitUntil:'domcontentloaded'});
  await waitForApp(page);
  expect(await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),LEGACY_CASE_ID)).toBeNull();
  expect(await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.cases().some(c=>c.id==='legacy-engineering-case'))).toBeFalsy();

  const caseA=await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.newCase({title:'Learner A only'}));
  expect((await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),caseA)).title).toBe('Learner A only');

  await switchLearner(page,USER_B);
  const tokenB=await page.evaluate(id=>window.MM_LEARNER_SCOPE.tokenFor(id),USER_B);
  expect(tokenB).toMatch(/^[0-9a-f]{32}$/);
  expect(tokenB).not.toBe(legacyLearnerToken(USER_B));
  expect(await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.learnerToken())).toBe(tokenB);
  expect(await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),caseA)).toBeNull();
  expect(await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.cases().some(c=>c.id===id),caseA)).toBeFalsy();
  const caseB=await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.newCase({title:'Learner B only'}));
  expect((await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),caseB)).title).toBe('Learner B only');

  await switchLearner(page,USER_A);
  const tokenA=await page.evaluate(id=>window.MM_LEARNER_SCOPE.tokenFor(id),USER_A);
  expect(tokenA).toMatch(/^[0-9a-f]{32}$/);
  expect(tokenA).not.toBe(legacyLearnerToken(USER_A));
  expect(await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.learnerToken())).toBe(tokenA);
  expect((await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),caseA)).title).toBe('Learner A only');
  expect(await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),caseB)).toBeNull();
  expect(await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.cases().some(c=>c.id===id),caseB)).toBeFalsy();

  const materialCase=await page.evaluate(()=>window.MM_MATERIAL_REGISTRY.startMouldMasterCase('mat-lotte-infino-nh-1033'));
  let materialRecord=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),materialCase);
  expect(materialRecord.materialGradeId).toBe('mat-lotte-infino-nh-1033');
  let links=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),materialCase);
  expect(links.some(x=>x.kind==='material-grade'&&x.targetId==='mat-lotte-infino-nh-1033')).toBeTruthy();

  const evidence=page.locator('[data-mw-field="evidence"]');
  await evidence.fill('Measured evidence retained after exact-grade case creation.');
  await page.getByRole('button',{name:'Save case'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.getCase(id).then(c=>c?.evidence.includes('Measured evidence retained')),materialCase);
  materialRecord=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),materialCase);
  expect(materialRecord.materialGradeId).toBe('mat-lotte-infino-nh-1033');
  links=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),materialCase);
  expect(links.some(x=>x.kind==='material-grade'&&x.targetId==='mat-lotte-infino-nh-1033')).toBeTruthy();

  await page.locator('[data-mw-field="machine"]').fill('Press 07');
  await page.locator('[data-mw-field="machineId"]').fill('IMM-07');
  await page.locator('[data-mw-field="mould"]').fill('Tool 184 · cavity 3');
  await page.locator('[data-mw-field="mouldId"]').fill('MOULD-184');
  await page.locator('[data-mw-field="product"]').fill('Pump housing assembly');
  await page.locator('[data-mw-field="productId"]').fill('PROD-PUMP-01');
  await page.locator('[data-mw-field="part"]').fill('Pump housing');
  await page.locator('[data-mw-field="partId"]').fill('PART-184-03');
  await page.getByRole('button',{name:'Save case'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.getCase(id).then(c=>c?.partId==='PART-184-03'),materialCase);

  materialRecord=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),materialCase);
  expect(materialRecord.machineId).toBe('IMM-07');
  expect(materialRecord.mouldId).toBe('MOULD-184');
  expect(materialRecord.productId).toBe('PROD-PUMP-01');
  expect(materialRecord.partId).toBe('PART-184-03');
  expect(materialRecord.schemaVersion).toBe(4);

  links=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),materialCase);
  expect(links.some(x=>x.kind==='machine'&&x.targetId==='IMM-07')).toBeTruthy();
  expect(links.some(x=>x.kind==='mould'&&x.targetId==='MOULD-184')).toBeTruthy();
  expect(links.some(x=>x.kind==='product'&&x.targetId==='PROD-PUMP-01')).toBeTruthy();
  expect(links.some(x=>x.kind==='part'&&x.targetId==='PART-184-03')).toBeTruthy();

  const context=await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.engineeringContext(id),materialCase);
  expect(context.materialGradeId).toBe('mat-lotte-infino-nh-1033');
  expect(context.machineId).toBe('IMM-07');
  expect(context.mouldId).toBe('MOULD-184');
  expect(context.productId).toBe('PROD-PUMP-01');
  expect(context.partId).toBe('PART-184-03');
  await expect(page.locator('[data-mw-engineering-context]')).toContainText('Press 07');
  await expect(page.locator('[data-mw-engineering-context]')).toContainText('Tool 184');
  await expect(page.locator('[data-mw-engineering-context]')).toContainText('Pump housing');
  await expect(page.locator('[data-mw-engineering-context]')).toContainText('Exact-grade evidence');

  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);
});