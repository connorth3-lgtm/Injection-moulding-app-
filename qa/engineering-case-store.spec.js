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
  expect(await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.canonicalStore)).toBe('mouldmaster-engineering-v2/db3');
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

  await page.evaluate(id=>window.MM_ENGINEERING_STORE.saveCaseEvidence(id,{kind:'controlled-trial',title:'Legacy archive retention proof',sourceRef:'QA-LEGACY-ARCHIVE',result:'Evidence must survive case archive'}),LEGACY_CASE_ID);
  await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.open(id),LEGACY_CASE_ID);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Archive case'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.getCase(id).then(c=>c===null),LEGACY_CASE_ID);
  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);
  const archivedLegacy=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id,window.MM_ENGINEERING_STORE.learnerToken(),{includeArchived:true}),LEGACY_CASE_ID);
  expect(archivedLegacy.archivedAt).toBeTruthy();
  expect(archivedLegacy.status).toBe('Archived');
  const archivedEvidence=await page.evaluate(id=>window.MM_ENGINEERING_STORE.listCaseEvidence(id),LEGACY_CASE_ID);
  expect(archivedEvidence).toHaveLength(1);
  expect(archivedEvidence[0].title).toBe('Legacy archive retention proof');
  const archivedAudit=await page.evaluate(id=>window.MM_ENGINEERING_STORE.evidenceAuditTrail(id),LEGACY_CASE_ID);
  expect(archivedAudit.some(x=>x.action==='case-archive')).toBeTruthy();

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

  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.linksForCase(id).then(rows=>
    ['machine','mould','product','part'].every(kind=>rows.some(x=>x.kind===kind))
  ),materialCase);
  links=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),materialCase);
  expect(links.some(x=>x.kind==='machine'&&x.targetId==='IMM-07')).toBeTruthy();
  expect(links.some(x=>x.kind==='mould'&&x.targetId==='MOULD-184')).toBeTruthy();
  expect(links.some(x=>x.kind==='product'&&x.targetId==='PROD-PUMP-01')).toBeTruthy();
  expect(links.some(x=>x.kind==='part'&&x.targetId==='PART-184-03')).toBeTruthy();
  await page.evaluate(id=>window.MM_ENGINEERING_STORE.linkCaseDataset(id,'qa-process-dataset-001','QA prepared dataset'),materialCase);
  links=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),materialCase);
  expect(links.some(x=>x.kind==='process-dataset'&&x.targetId==='qa-process-dataset-001'&&x.meta?.label==='QA prepared dataset')).toBeTruthy();

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

  const evidencePanel=page.locator('[data-mw-case-evidence]');
  await expect(evidencePanel).toContainText('Closed-loop evidence');
  await evidencePanel.locator('[data-mw-evidence-field="kind"]').selectOption('dimensional-check');
  await evidencePanel.locator('[data-mw-evidence-field="title"]').fill('Cavity 3 critical dimension');
  await evidencePanel.locator('[data-mw-evidence-field="sourceRef"]').fill('QC-REPORT-184-03');
  await evidencePanel.locator('[data-mw-evidence-field="materialLot"]').fill('LOT-NH1033-2409');
  await evidencePanel.locator('[data-mw-evidence-field="measurement"]').fill('42.18');
  await evidencePanel.locator('[data-mw-evidence-field="unit"]').fill('mm');
  await evidencePanel.locator('[data-mw-evidence-field="methodRef"]').fill('CMM-WI-17 · three repeats');
  await evidencePanel.locator('[data-mw-evidence-field="acceptanceStatus"]').selectOption('accepted');
  await evidencePanel.locator('[data-mw-evidence-field="acceptanceBasis"]').fill('DRAWING-184-03 REV C · QA disposition QA-8821');
  await evidencePanel.locator('[data-mw-evidence-field="result"]').fill('Dimension verified against the controlled inspection record.');
  await evidencePanel.locator('[data-mw-evidence-field="notes"]').fill('Three repeat measurements retained; method and source reference recorded.');
  await evidencePanel.getByRole('button',{name:'Add evidence record'}).click();
  await page.waitForFunction(id=>window.MM_ENGINEERING_STORE.listCaseEvidence(id).then(items=>items.length===1),materialCase);

  const caseEvidence=await page.evaluate(id=>window.MM_ENGINEERING_STORE.listCaseEvidence(id),materialCase);
  expect(caseEvidence).toHaveLength(1);
  expect(caseEvidence[0].kind).toBe('dimensional-check');
  expect(caseEvidence[0].sourceRef).toBe('QC-REPORT-184-03');
  expect(caseEvidence[0].materialLot).toBe('LOT-NH1033-2409');
  expect(caseEvidence[0].measurement).toBe('42.18');
  expect(caseEvidence[0].unit).toBe('mm');
  expect(caseEvidence[0].methodRef).toBe('CMM-WI-17 · three repeats');
  expect(caseEvidence[0].acceptanceStatus).toBe('accepted');
  expect(caseEvidence[0].acceptanceBasis).toContain('DRAWING-184-03');
  expect(caseEvidence[0].schemaVersion).toBe(2);
  expect(caseEvidence[0].complete).toBeTruthy();
  expect(caseEvidence[0].context.materialGradeId).toBe('mat-lotte-infino-nh-1033');
  expect(caseEvidence[0].context.machineId).toBe('IMM-07');
  expect(caseEvidence[0].context.mouldId).toBe('MOULD-184');
  expect(caseEvidence[0].context.productId).toBe('PROD-PUMP-01');
  expect(caseEvidence[0].context.partId).toBe('PART-184-03');
  const evidenceSummary=await page.evaluate(id=>window.MM_MOULD_MASTER_WORKSPACE.evidenceSummary(id),materialCase);
  expect(evidenceSummary.count).toBe(1);
  expect(evidenceSummary.activeCount).toBe(1);
  expect(evidenceSummary.completeCount).toBe(1);
  expect(evidenceSummary.incompleteCount).toBe(0);
  expect(evidenceSummary.byKind['dimensional-check']).toBe(1);
  expect(evidenceSummary.acceptance.accepted).toBe(1);
  const tokenOther=await page.evaluate(id=>window.MM_LEARNER_SCOPE.tokenFor(id),USER_B);
  expect(await page.evaluate(({id,token})=>window.MM_ENGINEERING_STORE.listCaseEvidence(id,token),{id:materialCase,token:tokenOther})).toEqual([]);
  await expect(evidencePanel).toContainText('Cavity 3 critical dimension');
  await expect(evidencePanel).toContainText('42.18 mm');

  const originalEvidenceId=caseEvidence[0].id;
  const overwriteError=await page.evaluate(async({caseId,id})=>{
    try{await window.MM_ENGINEERING_STORE.saveCaseEvidence(caseId,{id,kind:'dimensional-check',title:'overwrite attempt',sourceRef:'bad',measurement:'1',unit:'mm',methodRef:'bad',result:'bad'});return null}catch(error){return String(error.message||error)}
  },{caseId:materialCase,id:originalEvidenceId});
  expect(overwriteError).toContain('append-only');

  const revised=await page.evaluate(({id})=>window.MM_ENGINEERING_STORE.reviseCaseEvidence(id,{
    measurement:'42.19',
    result:'Repeat inspection after gauge verification.',
    acceptanceStatus:'accepted',
    acceptanceBasis:'DRAWING-184-03 REV C · QA disposition QA-8822'
  }),{id:originalEvidenceId});
  expect(revised.revisionOf).toBe(originalEvidenceId);
  expect(revised.measurement).toBe('42.19');

  await page.evaluate(({id})=>window.MM_ENGINEERING_STORE.voidCaseEvidence(id,'Superseded by verified repeat measurement'),{id:originalEvidenceId});
  const evidenceAfterAudit=await page.evaluate(id=>window.MM_ENGINEERING_STORE.listCaseEvidence(id),materialCase);
  expect(evidenceAfterAudit).toHaveLength(2);
  expect(evidenceAfterAudit.find(x=>x.id===originalEvidenceId).voided).toBeTruthy();
  expect(evidenceAfterAudit.find(x=>x.revisionOf===originalEvidenceId).voided).toBeFalsy();
  const auditTrail=await page.evaluate(id=>window.MM_ENGINEERING_STORE.evidenceAuditTrail(id),materialCase);
  expect(auditTrail).toHaveLength(1);
  expect(auditTrail[0].action).toBe('void');
  expect(auditTrail[0].reason).toContain('Superseded');

  const orphanAuditError=await page.evaluate(id=>{
    const store=window.MM_ENGINEERING_STORE,c={id,title:'Orphan audit QA'},evidence=[{id:'qa-evidence-1',recordType:'evidence',kind:'controlled-trial',title:'QA evidence',sourceRef:'QA',result:'retained'}];
    try{store.validateCaseBundle({schema:4,case:c,evidence,evidenceAudit:[{recordType:'audit',action:'void',targetEvidenceId:'missing-evidence',reason:'invalid QA reference'}],links:[]});return null}catch(error){return String(error.message||error)}
  },materialCase);
  expect(orphanAuditError).toContain('unknown evidence id');

  const restoreResult=await page.evaluate(async id=>{
    const store=window.MM_ENGINEERING_STORE;
    const c=await store.getCase(id),evidence=await store.listCaseEvidence(id),evidenceAudit=await store.evidenceAuditTrail(id),links=await store.linksForCase(id);
    return store.importCaseBundle({schema:4,version:'qa',case:c,evidence,evidenceAudit,links,engineeringContext:window.MM_MOULD_MASTER_WORKSPACE.engineeringContext(id)});
  },materialCase);
  expect(restoreResult.caseId).not.toBe(materialCase);
  expect(restoreResult.evidenceImported).toBe(2);
  expect(restoreResult.auditImported).toBe(1);
  expect(restoreResult.linksImported).toBe(6);
  expect(restoreResult.destructive).toBeFalsy();
  const restoredCase=await page.evaluate(id=>window.MM_ENGINEERING_STORE.getCase(id),restoreResult.caseId);
  expect(restoredCase.materialGradeId).toBe('mat-lotte-infino-nh-1033');
  expect(restoredCase.machineId).toBe('IMM-07');
  expect(restoredCase.mouldId).toBe('MOULD-184');
  expect(restoredCase.productId).toBe('PROD-PUMP-01');
  expect(restoredCase.partId).toBe('PART-184-03');
  const restoredLinks=await page.evaluate(id=>window.MM_ENGINEERING_STORE.linksForCase(id),restoreResult.caseId);
  expect(restoredLinks).toHaveLength(6);
  expect(restoredLinks.some(x=>x.kind==='process-dataset'&&x.targetId==='qa-process-dataset-001'&&x.meta?.label==='QA prepared dataset')).toBeTruthy();
  const restoredEvidence=await page.evaluate(id=>window.MM_ENGINEERING_STORE.listCaseEvidence(id),restoreResult.caseId);
  expect(restoredEvidence).toHaveLength(2);
  expect(restoredEvidence.filter(x=>x.voided)).toHaveLength(1);
  expect(restoredEvidence.find(x=>x.revisionOf)?.measurement).toBe('42.19');

  await page.waitForFunction(()=>window.MM_CONNECTED_PROCESS_DATA?.cases?.similarCases);
  const relatedCase=await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.newCase({
    title:'Repeat pump housing investigation',
    defect:'Short shot',
    materialGradeId:'mat-lotte-infino-nh-1033',
    material:'LOTTE Chemical · INFINO · NH-1033',
    machineId:'IMM-07',
    machine:'Press 07',
    mouldId:'MOULD-184',
    mould:'Tool 184 · cavity 3',
    productId:'PROD-PUMP-01',
    product:'Pump housing assembly',
    partId:'PART-184-03',
    part:'Pump housing'
  }));
  const similar=await page.evaluate(id=>window.MM_CONNECTED_PROCESS_DATA.cases.similarCases(id),relatedCase);
  const prior=similar.find(x=>x.caseId===materialCase);
  expect(prior).toBeTruthy();
  expect(prior.score).toBeGreaterThanOrEqual(20);
  expect(prior.context.machineId).toBe('IMM-07');
  expect(prior.context.mouldId).toBe('MOULD-184');
  expect(prior.context.productId).toBe('PROD-PUMP-01');
  expect(prior.context.partId).toBe('PART-184-03');

  expect(await page.evaluate(key=>localStorage.getItem(key),migratedLegacyKey)).toBe(legacyRaw);
});