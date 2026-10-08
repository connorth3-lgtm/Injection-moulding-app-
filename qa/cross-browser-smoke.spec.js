const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';

async function seedLearner(page){
  await page.addInitScript(()=>{
    const user={id:'cross-browser-qa',name:'Cross Browser QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'cross-browser-qa',users:{'cross-browser-qa':user}}));
  });
}

async function openApp(page){
  await seedLearner(page);
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>(typeof window.MM_APP_SHELL_FINALIZED==='string'&&window.MM_APP_SHELL_FINALIZED.length>0)&&window.MM_PRIMARY_HUBS,{timeout:30000});
  await page.waitForFunction(()=>window.MM_INLINE_HANDLER_BRIDGE?.version==='1',{timeout:30000});
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'),{timeout:30000});
  await expect(page.locator('#mmStartupFailure')).toHaveCount(0);
  await expect(page.locator('#modal')).toBeHidden();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function openMaterials(page){
  const desktopMaterials=page.locator('#nav button[data-view="materials"]');
  if(await desktopMaterials.isVisible()){
    await desktopMaterials.click();
  }else{
    const materials=page.locator('.mobile-nav > button').filter({hasText:'Materials'});
    await expect(materials).toBeVisible();
    await materials.click();
  }
  await expect(page.locator('#materials')).toBeVisible();
}

test('core shell and exact-grade Materials work without layout overflow',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err.message||err)));
  await openApp(page);
  await openMaterials(page);
  await expect(page.locator('#mmExactMaterialCatalog')).toBeVisible({timeout:30000});
  await expect(page.locator('[data-mm-material-grade]').first()).toBeVisible();
  const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+2);
  expect(errors).toEqual([]);
});

test('Mission Control dashboard and stale controls remain isolated on A → B → A profile switches',async({page})=>{
  await openApp(page);
  await page.waitForFunction(()=>!!window.MM_MISSION_CONTROL&&!!window.MM_APP_SHELL?.dashboard?.compose);
  const result=await page.evaluate(()=>{
    const mission=window.MM_MISSION_CONTROL;
    mission.startMission({title:'Browser QA — private learner A mission',stage:'evidence'});
    mission.addEvidence({kind:'measured',text:'Browser QA A-only evidence'});
    window.MM_APP_SHELL.dashboard.compose();
    const before=document.querySelector('#dashboard .mm-mc-home-card')?.textContent||'';
    const staleEvidence=document.querySelector('#dashboard [data-mm-mc-home-evidence]');
    const staleMode=document.querySelector('#mmMissionControl [data-mm-mc-mode]');
    const initialA=mission.state();
    const other={...user,id:'cross-browser-qa-b',name:'Learner B',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1};
    db.users[other.id]=other;
    switchUser(other.id);
    // Compose synchronously in this SAME browser task, before click/focus events.
    // requestCompose() defers until requestAnimationFrame, so inspecting its
    // DOM immediately would be testing old markup, not new profile state.
    window.MM_APP_SHELL.dashboard.compose();
    const bCard=document.querySelector('#dashboard .mm-mc-home-card')?.textContent||'';
    staleEvidence?.click();
    staleMode?.click();
    const bState=mission.state();
    mission.startMission({title:'Browser QA — learner B mission',stage:'brief'});
    const advanceB=mission.nextStage();
    const savedB=mission.state();
    switchUser('cross-browser-qa');
    window.MM_APP_SHELL.dashboard.compose();
    const aCard=document.querySelector('#dashboard .mm-mc-home-card')?.textContent||'';
    const recoveredA=mission.state();
    return {
      sawA:before.includes('private learner A mission'),
      sawNoA:bCard.includes('Start a connected learning mission')&&!bCard.includes('private learner A mission'),
      evidenceFromA:initialA.evidence.length,
      bInitiallyEmpty:bState.mission===null&&bState.evidence.length===0,
      bUnchangedByStaleMode:bState.mode==='learner',
      bAdvanced:advanceB&&savedB.mission?.stage==='baseline',
      aRecovered:aCard.includes('private learner A mission')&&recoveredA.evidence.length===1&&recoveredA.mission?.stage==='evidence',
      aNeverSawB:!aCard.includes('learner B mission')
    };
  });
  expect(result).toEqual({
    sawA:true,sawNoA:true,evidenceFromA:1,
    bInitiallyEmpty:true,bUnchangedByStaleMode:true,bAdvanced:true,
    aRecovered:true,aNeverSawB:true
  });
});

test('engineering store enforces learner ownership for direct case reads',async({page})=>{
  await openApp(page);
  await page.waitForFunction(()=>!!window.MM_ENGINEERING_STORE,{timeout:30000});
  const result=await page.evaluate(async()=>{
    const s=window.MM_ENGINEERING_STORE;
    const tokenA=s.learnerToken('qa-owner-a'),tokenB=s.learnerToken('qa-owner-b');
    const record=await s.saveCase({id:'case-cross-browser-owner-test',title:'ownership test',learnerToken:tokenA},{token:tokenA});
    const own=await s.getCase(record.id,tokenA),foreign=await s.getCase(record.id,tokenB);
    await s.deleteCase(record.id,tokenA);
    return {own:!!own,foreign:!!foreign};
  });
  expect(result).toEqual({own:true,foreign:false});
});

test('Mould Master case changes reach the canonical engineering store without a compatibility bridge',async({page})=>{
  await openApp(page);
  await page.waitForFunction(()=>!!window.MM_ENGINEERING_STORE&&!!window.MM_MOULD_MASTER_WORKSPACE,{timeout:30000});
  const id=await page.evaluate(()=>window.MM_MOULD_MASTER_WORKSPACE.newCase({title:'Cross-browser parity test',material:'PC/ABS'}));
  await page.waitForFunction(async caseId=>{
    const record=await window.MM_ENGINEERING_STORE.getCase(caseId);
    return record?.title==='Cross-browser parity test'&&record?.material==='PC/ABS';
  },id,{timeout:10000});
  const result=await page.evaluate(async caseId=>{
    const store=window.MM_ENGINEERING_STORE;
    const workspace=window.MM_MOULD_MASTER_WORKSPACE;
    const record=await store.getCase(caseId);
    return {persisted:!!record,title:record?.title||'',material:record?.material||'',canonicalStore:workspace.canonicalStore||'',bridgePresent:!!window.MM_CASE_STORE_BRIDGE};
  },id);
  expect(result).toEqual({persisted:true,title:'Cross-browser parity test',material:'PC/ABS',canonicalStore:'mouldmaster-engineering-v2/db3',bridgePresent:false});
});

test('visible learner shell has basic semantic accessibility integrity',async({page,browserName})=>{
  await openApp(page);
  const failures=await page.evaluate(()=>{
    const out=[];
    const visible=el=>{
      const style=getComputedStyle(el),rect=el.getBoundingClientRect();
      return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
    };
    const ids=new Map();
    document.querySelectorAll('[id]').forEach(el=>ids.set(el.id,(ids.get(el.id)||0)+1));
    for(const [id,count] of ids)if(count>1)out.push(`duplicate-id:${id}:${count}`);
    document.querySelectorAll('img').forEach((el,index)=>{if(visible(el)&&!el.hasAttribute('alt'))out.push(`visible-img-alt:${index}`)});
    document.querySelectorAll('button,a[href]').forEach((el,index)=>{
      if(!visible(el))return;
      const name=(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.getAttribute('title')||el.textContent||'').replace(/\s+/g,' ').trim();
      if(!name)out.push(`interactive-name:${el.tagName}:${index}`);
    });
    document.querySelectorAll('input,select,textarea').forEach((el,index)=>{
      if(!visible(el))return;
      const labelled=(el.labels&&el.labels.length)||el.getAttribute('aria-label')||el.getAttribute('aria-labelledby');
      if(!labelled)out.push(`form-label:${el.tagName}:${index}`);
    });
    document.querySelectorAll('[role="dialog"],dialog').forEach((el,index)=>{
      if(!visible(el))return;
      if(el.tagName!=='DIALOG'&&el.getAttribute('aria-modal')!=='true')out.push(`dialog-modal:${index}`);
      if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby'))out.push(`dialog-name:${index}`);
    });
    if(!document.querySelector('main,.main'))out.push('landmark-main');
    if(!document.querySelector('nav,#nav,.mobile-nav'))out.push('landmark-nav');
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el,index)=>{if(visible(el)&&!(el.textContent||'').trim())out.push(`empty-heading:${index}`)});
    return out;
  });
  expect(failures,`${browserName} semantic accessibility failures`).toEqual([]);
});

test('keyboard focus advances through multiple visible learner controls',async({page,browserName})=>{
  await openApp(page);
  const seen=[];
  for(let i=0;i<10;i++){
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(()=>{
      const el=document.activeElement;
      if(!el)return null;
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
      return {tag:el.tagName,id:el.id||'',name:(el.getAttribute('aria-label')||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,80),visible:style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0};
    }));
  }
  const focusable=seen.filter(x=>x&&x.visible&&!['BODY','HTML'].includes(x.tag));
  const identities=new Set(focusable.map(x=>`${x.tag}#${x.id}:${x.name}`));
  expect(focusable.length,`${browserName} should move focus into visible learner controls`).toBeGreaterThanOrEqual(4);
  expect(identities.size,`${browserName} focus should progress rather than remain trapped on one control`).toBeGreaterThanOrEqual(3);
  const reverseProbe=page.locator('button:visible,a[href]:visible,input:visible,select:visible,textarea:visible').nth(2);
  await reverseProbe.focus();
  await page.keyboard.press('Shift+Tab');
  const afterReverse=await page.evaluate(()=> {
    const el=document.activeElement;
    if(!el)return {tag:'',visible:false};
    const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
    return {tag:el.tagName,visible:style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0};
  });
  expect(afterReverse.visible,`${browserName} reverse keyboard focus should move to another visible interface control`).toBeTruthy();
  expect(['BODY','HTML',''].includes(afterReverse.tag),`${browserName} reverse keyboard focus should not fall out of the interface`).toBeFalsy();
});
