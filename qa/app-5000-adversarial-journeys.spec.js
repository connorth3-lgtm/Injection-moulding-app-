const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
test.use({serviceWorkers:'block'});
const widths=[320,360,375,390,412,600,650,700,768,810,1024,1280,1440];
function rng(seed){let x=seed|0;return()=>{x=(x*1664525+1013904223)|0;return(x>>>0)/4294967296}}
async function invariant(page,seed,step){
 const s=await page.evaluate(()=>({failure:!!document.getElementById('mmStartupFailure'),unresolved:window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount?.()??-1,semanticIssues:window.MM_ACCESSIBILITY_HARDENING?.semanticIssues?.()??[],overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,views:[...document.querySelectorAll('main > section.view.active')].length}));
 expect(s.failure,'seed '+seed+' step '+step+' startup failure').toBeFalsy();
 expect(s.unresolved,'seed '+seed+' step '+step+' unresolved semantics: '+JSON.stringify(s.semanticIssues)).toBe(0);
 expect(s.overflow,'seed '+seed+' step '+step+' horizontal overflow').toBeLessThanOrEqual(1);
 expect(s.views,'seed '+seed+' step '+step+' active views').toBeLessThanOrEqual(1);
}
const seedStart=Number(process.env.MM_SEED_START||1),seedEnd=Number(process.env.MM_SEED_END||5000);
for(let seed=seedStart;seed<=seedEnd;seed++){
 test('adversarial journey seed '+String(seed).padStart(4,'0'),async({page})=>{
  test.setTimeout(30000); console.log('[ADV] seed='+seed+' start');
  const r=rng(seed),errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
  await page.addInitScript(({seed})=>{
   const id='torture-'+seed,user={id,name:'Torture QA',role:'learner',completed:seed%3?[1,2]:[],bookmarks:seed%5?[1]:[],notes:{},examScores:{},certificates:[],currentLesson:1+(seed%10),lastSeen:'2026-09-27T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
   if(seed%17===0)localStorage.setItem('mouldmasterProDB','{bad-json');
   else if(seed%19===0)localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'missing',users:{}}));
   else localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:id,users:{[id]:user}}));
  },{seed});
  await page.setViewportSize({width:widths[seed%widths.length],height:640+(seed%4)*120});
  const res=await page.goto(BASE,{waitUntil:'domcontentloaded'});expect(res?.ok()).toBeTruthy();
  await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&!document.getElementById('mmBootstrap')&&typeof window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount==='function');
  await invariant(page,seed,0);
  for(let step=1;step<=20;step++){
   const a=Math.floor(r()*10);
   if(a===0)await page.evaluate(()=>switchView('dashboard'));
   else if(a===1)await page.evaluate(()=>switchView('path'));
   else if(a===2)await page.evaluate(()=>switchView('scenarios'));
   else if(a===3&&await page.evaluate(()=>Boolean(window.MMBook?.open)))await page.evaluate(()=>window.MMBook.open());
   else if(a===4)await page.setViewportSize({width:widths[Math.floor(r()*widths.length)],height:640+Math.floor(r()*400)});
   else if(a===5)await page.evaluate(()=>window.MM_APP_SHELL?.dashboard?.compose?.());
   else if(a===6){const close=page.locator('#modal button').filter({hasText:/close/i}).first();if(await close.isVisible({timeout:1000}).catch(()=>false))await close.click({timeout:3000})}
   else if(a===7){await page.reload({waitUntil:'domcontentloaded',timeout:5000});await page.waitForFunction(()=>typeof window.MM_APP_SHELL_FINALIZED==='string'&&!document.getElementById('mmBootstrap')&&typeof window.MM_ACCESSIBILITY_HARDENING?.unresolvedSemanticCount==='function',null,{timeout:5000})}
   else if(a===8)await page.evaluate(()=>{history.pushState({},'',location.pathname+'#stress');history.back()});
   else await page.evaluate(()=>new Promise(q=>requestAnimationFrame(()=>requestAnimationFrame(q))));
   await invariant(page,seed,step);
  }
  expect(errors,'seed '+seed+' page errors: '+errors.join(' | ')).toEqual([]); console.log('[ADV] seed='+seed+' PASS');
 });
}