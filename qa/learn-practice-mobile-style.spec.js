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
      maxWidth:Math.max(...boxes.map(x=>x.width)),
      minWidth:Math.min(...boxes.map(x=>x.width)),
      overlap:boxes.some((a,i)=>boxes.some((b,j)=>j>i&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left))
    };
  },rootSelector);
  expect(result.count).toBe(4);
  expect(result.display).toBe('flex');
  expect(result.direction).toBe('column');
  expect(result.align).toBe('flex-start');
  expect(result.textAlign).toBe('left');
  expect(result.whiteSpace).toBe('normal');
  expect(result.background).not.toBe('rgb(128, 128, 128)');
  expect(result.eyebrowDisplay).toBe('block');
  expect(result.titleDisplay).toBe('block');
  expect(result.copyDisplay).toBe('block');
  expect(result.actionDisplay).toBe('none');
  expect(result.helperDisplay).toBe('none');
  expect(result.maxWidth-result.minWidth).toBeLessThan(2);
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
