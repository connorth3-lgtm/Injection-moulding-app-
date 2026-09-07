const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/index.html';

async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'hub-style-qa',name:'Hub Style QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'hub-style-qa',users:{'hub-style-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS);
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}

async function openHub(page,label,selector){
  await page.locator('.mobile-nav > button').filter({hasText:label}).click();
  await expect(page.locator(selector)).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function expectReadableTiles(page,rootSelector){
  const result=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const grid=root.querySelector('.mm-hub-grid');
    const tiles=[...root.querySelectorAll('.mm-hub-tile')];
    const first=tiles[0];
    const tile=getComputedStyle(first);
    const eyebrow=getComputedStyle(first.querySelector('.eyebrow'));
    const title=getComputedStyle(first.querySelector('b'));
    const copy=getComputedStyle(first.querySelector('small'));
    const action=getComputedStyle(first.querySelector('.mm-hub-tile-action'));
    const helper=root.querySelector('.mm-hub-section-head p');
    const boxes=tiles.map(x=>x.getBoundingClientRect());
    return {
      count:tiles.length,
      columns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      display:tile.display,
      direction:tile.flexDirection,
      align:tile.alignItems,
      textAlign:tile.textAlign,
      whiteSpace:tile.whiteSpace,
      background:tile.backgroundColor,
      eyebrowDisplay:eyebrow.display,
      titleDisplay:title.display,
      copyDisplay:copy.display,
      actionDisplay:action.display,
      helperDisplay:helper?getComputedStyle(helper).display:null,
      minHeight:Math.min(...boxes.map(x=>x.height)),
      maxWidth:Math.max(...boxes.map(x=>x.width)),
      minWidth:Math.min(...boxes.map(x=>x.width)),
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  },rootSelector);
  expect(result.count).toBe(4);
  expect(result.columns).toBe(2);
  expect(result.display).toBe('flex');
  expect(result.direction).toBe('column');
  expect(result.align).toBe('flex-start');
  expect(result.textAlign).toBe('left');
  expect(result.whiteSpace).toBe('normal');
  expect(result.background).not.toBe('rgb(128, 128, 128)');
  // 412px phones keep the deliberately dense two-column presentation.
  expect(result.eyebrowDisplay).toBe('none');
  expect(result.titleDisplay).toBe('block');
  expect(result.copyDisplay).toBe('none');
  expect(result.actionDisplay).toBe('none');
  expect(result.helperDisplay).toBe('none');
  expect(result.minHeight).toBeGreaterThanOrEqual(94);
  expect(result.maxWidth-result.minWidth).toBeLessThan(2);
  expect(result.overlap).toBe(false);
}

async function expectNarrowReadableTiles(page,rootSelector){
  const result=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const grid=root.querySelector('.mm-hub-grid');
    const tiles=[...root.querySelectorAll('.mm-hub-tile')];
    const boxes=tiles.map(x=>x.getBoundingClientRect());
    const copies=tiles.map(x=>{
      const node=x.querySelector('small');
      const style=getComputedStyle(node);
      return {display:style.display,height:node.getBoundingClientRect().height,text:(node.textContent||'').trim()};
    });
    const minHeights=tiles.map(x=>getComputedStyle(x).minHeight);
    return {
      count:tiles.length,
      columns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      copies,
      minHeights,
      maxHeight:Math.max(...boxes.map(x=>x.height)),
      minHeight:Math.min(...boxes.map(x=>x.height)),
      overflowX:Math.max(0,root.scrollWidth-root.clientWidth),
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  },rootSelector);
  expect(result.count).toBe(4);
  expect(result.columns).toBe(1);
  expect(result.copies.every(x=>x.display!=='none'&&x.height>0&&x.text.length>12)).toBeTruthy();
  expect(result.minHeights.every(x=>x==='0px')).toBeTruthy();
  expect(result.minHeight).toBeGreaterThanOrEqual(70);
  expect(result.maxHeight).toBeLessThan(165);
  expect(result.overflowX).toBeLessThanOrEqual(1);
  expect(result.overlap).toBe(false);
}

async function expectFullWidthPrimaryAction(page,rootSelector){
  const geometry=await page.evaluate(rootSelector=>{
    const root=document.querySelector(rootSelector);
    const card=root.querySelector('.mm-hub-continue');
    const button=root.querySelector('.mm-hub-continue-action');
    const cr=card.getBoundingClientRect(),br=button.getBoundingClientRect();
    const cs=getComputedStyle(card);
    const inner=cr.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-parseFloat(cs.borderLeftWidth)-parseFloat(cs.borderRightWidth);
    return {buttonWidth:br.width,innerWidth:inner};
  },rootSelector);
  expect(geometry.buttonWidth).toBeGreaterThan(300);
  expect(Math.abs(geometry.buttonWidth-geometry.innerWidth)).toBeLessThan(2);
}

async function openMaterials(page){
  await openHub(page,'Learn','#path .mm-learn-hub');
  await page.locator('#path .mm-hub-tile').filter({hasText:'Material science'}).click();
  await expect(page.locator('#materials')).toBeVisible();
  await expect(page.locator('#materials .mat-chapter').first()).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function expectMaterialDensity(page){
  const result=await page.evaluate(()=>{
    const root=document.getElementById('materials');
    const cards=[...root.querySelectorAll('.mat-chapter')];
    const first=cards[0];
    const copy=first.querySelector('p');
    const action=first.querySelector('.course-bottom button,.course-bottom .primary,.course-bottom .secondary,button');
    const boxes=cards.slice(0,4).map(card=>card.getBoundingClientRect());
    return {
      count:cards.length,
      minHeight:getComputedStyle(first).minHeight,
      firstHeight:first.getBoundingClientRect().height,
      copyHeight:copy?.getBoundingClientRect().height||0,
      copyText:(copy?.textContent||'').trim(),
      actionHeight:action?.getBoundingClientRect().height||0,
      overflowX:Math.max(0,root.scrollWidth-root.clientWidth),
      scrollTop:window.scrollY||document.scrollingElement?.scrollTop||0,
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  });
  expect(result.count).toBeGreaterThanOrEqual(4);
  expect(result.minHeight).toBe('0px');
  expect(result.firstHeight).toBeLessThan(300);
  expect(result.copyHeight).toBeGreaterThan(20);
  expect(result.copyText.length).toBeGreaterThan(30);
  expect(result.actionHeight).toBeGreaterThanOrEqual(44);
  expect(result.overflowX).toBeLessThanOrEqual(1);
  expect(result.scrollTop).toBeLessThanOrEqual(1);
  expect(result.overlap).toBe(false);
}

test.use({viewport:{width:412,height:915}});

test('Learn hub keeps compact left-aligned mobile cards under strict CSP',async({page})=>{
  await openApp(page);
  await openHub(page,'Learn','#path .mm-learn-hub');
  await expectReadableTiles(page,'#path .mm-learn-hub');
  await expectFullWidthPrimaryAction(page,'#path .mm-learn-hub');
  await page.screenshot({path:'qa-artifacts/mobile-learn-hub-412x915.png',fullPage:true});
});

test('Practice hub keeps compact left-aligned mobile cards under strict CSP',async({page})=>{
  await openApp(page);
  await openHub(page,'Practice','#scenarios .mm-practice-hub');
  await expectReadableTiles(page,'#scenarios .mm-practice-hub');
  await expectFullWidthPrimaryAction(page,'#scenarios .mm-practice-hub');
  await page.screenshot({path:'qa-artifacts/mobile-practice-hub-412x915.png',fullPage:true});
});

test('Material chapters are content-driven and enter at the top on 412px phones',async({page})=>{
  await openApp(page);
  await openMaterials(page);
  await expectMaterialDensity(page);
  await page.screenshot({path:'qa-artifacts/mobile-materials-412x915.png',fullPage:true});
});

test.describe('360px narrow-phone hubs',()=>{
  test.use({viewport:{width:360,height:800}});

  test('Learn and Practice use content-driven one-column cards instead of empty title slabs',async({page})=>{
    await openApp(page);
    await openHub(page,'Learn','#path .mm-learn-hub');
    await expectNarrowReadableTiles(page,'#path .mm-learn-hub');

    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await expectNarrowReadableTiles(page,'#scenarios .mm-practice-hub');
    await page.screenshot({path:'qa-artifacts/mobile-practice-hub-360x800.png',fullPage:true});
  });

  test('primary tab navigation settles at the top instead of preserving a clipped hub position',async({page})=>{
    await openApp(page);
    await openHub(page,'Learn','#path .mm-learn-hub');
    await page.evaluate(()=>window.scrollTo(0,document.scrollingElement?.scrollHeight||document.body.scrollHeight));
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0)).toBeGreaterThan(20);
    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0),{timeout:2500}).toBeLessThanOrEqual(1);
  });

  test('Material chapters keep readable copy, tap targets and stable view-entry position',async({page})=>{
    await openApp(page);
    await openHub(page,'Practice','#scenarios .mm-practice-hub');
    await page.evaluate(()=>window.scrollTo(0,document.scrollingElement?.scrollHeight||document.body.scrollHeight));
    await expect.poll(()=>page.evaluate(()=>window.scrollY||document.scrollingElement?.scrollTop||0)).toBeGreaterThan(20);
    await openMaterials(page);
    await expectMaterialDensity(page);
    await page.screenshot({path:'qa-artifacts/mobile-materials-360x800.png',fullPage:true});
  });
});
