#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
OLD='2026.09.16.1'
NEW='2026.09.16.2'

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
def replace_once(text,old,new,label):
    if text.count(old)!=1: raise SystemExit(f'{label}: expected one match, found {text.count(old)}')
    return text.replace(old,new,1)

def patch_book(text):
    text=text.replace("const VERSION='2026.09.16.1';","const VERSION='2026.09.16.2';")
    text=replace_once(text,
      "let manifest=null,publicationAuthorization=null,bookSmeReview=null,qualificationReview=null,highRiskReview=null,ui=null,previousView=null,open=false;",
      "let manifest=null,publicationAuthorization=null,bookSmeReview=null,qualificationReview=null,highRiskReview=null,ui=null,previousView=null,open=false,contentsScrollY=0;",
      'Book state')
    old="function restoreBookChrome(){if(!ui)return;ui.hero.hidden=false;ui.accuracy.hidden=false;}function stopBookSpeech(){try{window.MMReadAloud?.stop?.();}catch(_){}}function showContents(){if(!ui)return;stopBookSpeech();restoreBookChrome();ui.reader.hidden=true;ui.contents.hidden=false;}function bindBack(){ui?.reader?.querySelector('[data-mm-book-back]')?.addEventListener('click',showContents);}"
    new="function restoreBookChrome(){if(!ui)return;ui.hero.hidden=false;ui.accuracy.hidden=false;}function stopBookSpeech(){try{window.MMReadAloud?.stop?.();}catch(_){}}function bookScrollTop(){const main=document.querySelector('#mainContent,.main,main');return Math.max(0,window.scrollY||document.documentElement.scrollTop||main?.scrollTop||0);}function scrollBookReaderToTop(){requestAnimationFrame(()=>{if(!ui?.reader)return;ui.reader.scrollIntoView({block:'start',behavior:'auto'});const heading=ui.reader.querySelector('h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});}function showContents(){if(!ui)return;stopBookSpeech();restoreBookChrome();ui.reader.hidden=true;ui.contents.hidden=false;requestAnimationFrame(()=>window.scrollTo({top:contentsScrollY,behavior:'auto'}));}function bindBack(){ui?.reader?.querySelector('[data-mm-book-back]')?.addEventListener('click',showContents);}"
    text=replace_once(text,old,new,'Book contents navigation')
    old="function showChapter(id){const chapter=allChapters().find(ch=>ch.id===id);if(!chapter||!ui)return;const sections=Array.isArray(chapter.sections)?chapter.sections:[];restoreBookChrome();const back='<button type=\"button\" class=\"ghost\" data-mm-book-back>← Book contents</button>';"
    new="function showChapter(id){const chapter=allChapters().find(ch=>ch.id===id);if(!chapter||!ui)return;contentsScrollY=bookScrollTop();const sections=Array.isArray(chapter.sections)?chapter.sections:[];restoreBookChrome();const back='<button type=\"button\" class=\"ghost\" data-mm-book-back>← Book contents</button>';"
    text=replace_once(text,old,new,'Book chapter scroll capture')
    text=replace_once(text,"ui.contents.hidden=true;ui.reader.hidden=false;bindBack();}","ui.contents.hidden=true;ui.reader.hidden=false;bindBack();scrollBookReaderToTop();}",'Book chapter top reset')
    text=replace_once(text,"ui.contents.hidden=true;ui.hero.hidden=true;ui.accuracy.hidden=true;ui.reader.hidden=false;bindBack();requestAnimationFrame(()=>{reader.refresh?.();details.open=true;play.click();});}","ui.contents.hidden=true;ui.hero.hidden=true;ui.accuracy.hidden=true;ui.reader.hidden=false;bindBack();scrollBookReaderToTop();requestAnimationFrame(()=>{reader.refresh?.();details.open=true;play.click();});}",'Book listening top reset')
    text=replace_once(text,"window.scrollTo({top:0,behavior:'smooth'});}","contentsScrollY=0;showContents();}",'Book open contents')
    text=replace_once(text,"button.innerHTML='📖 <span>Book</span>';","button.innerHTML='<span class=\"mm-book-nav-icon\" aria-hidden=\"true\"></span><span>Book</span>';button.setAttribute('aria-label','Book');",'Book nav icon')
    old='<div><button type="button" class="primary" data-mm-book-mode="read">Read Book</button> <button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after evidence verification</button></div>'
    new='<div class="mm-book-hero-actions"><button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after evidence verification</button></div>'
    text=replace_once(text,old,new,'Book redundant CTA')
    text=replace_once(text,"view.querySelector('[data-mm-book-mode=\"read\"]').addEventListener('click',showContents);ui.listen.addEventListener('click',startVerifiedListening);","ui.listen.addEventListener('click',startVerifiedListening);",'Book read binding')
    return text

for path in ['book-runtime.js','src/domains/learning/book-runtime.js']:
    write(path,patch_book(read(path)))

# Tablet becomes a compact four-destination bottom navigation instead of a full tool matrix.
ui=read('ui-shell.css')
old='''@media(min-width:701px) and (max-width:900px){\n  #app{grid-template-columns:1fr!important}\n  .sidebar{position:relative!important;height:auto!important;padding:10px 12px!important}\n  .sidebar .brand,.sidebar .profile-mini,.sidebar .sidebar-foot,.sidebar .nav-group-label{display:none!important}\n  .sidebar nav{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}\n  .sidebar nav>button{min-height:var(--mm-control-size)!important;justify-content:center!important;padding:8px!important;text-align:center!important}\n  .sidebar .more-nav{grid-column:1/-1!important;margin-top:2px!important;padding-top:6px!important}\n  .main{padding-top:16px!important}\n}'''
new='''@media(min-width:701px) and (max-width:900px){\n  :root{--mm-mobile-nav-clearance:96px}\n  #app{grid-template-columns:1fr!important}\n  .sidebar{display:none!important}\n  .main{padding:18px 22px calc(var(--mm-mobile-nav-clearance) + env(safe-area-inset-bottom))!important}\n  .mobile-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:40!important;background:rgba(7,16,28,.97)!important;border-top:1px solid #263b58!important;padding:7px 10px calc(7px + env(safe-area-inset-bottom))!important;box-shadow:0 -10px 26px rgba(0,0,0,.25)!important}\n  .mobile-nav button{min-height:52px!important;border:0!important;background:transparent!important;color:#9eb1c3!important;padding:6px!important;border-radius:10px!important;display:grid!important;gap:2px!important;place-items:center!important;font-size:18px!important}\n  .mobile-nav button span{font-size:11px!important}\n  .mobile-nav button.active{color:#eafffa!important;background:rgba(29,61,78,.72)!important;box-shadow:inset 0 0 0 1px rgba(95,224,198,.16)!important}\n}'''
ui=replace_once(ui,old,new,'tablet shell')
# Draw search icon with CSS instead of a font-dependent glyph.
ui=replace_once(ui,'#app #searchBtn::before{content:"⌕";font-size:20px;line-height:1}','#app #searchBtn::before{content:"";width:14px;height:14px;border:2px solid currentColor;border-radius:50%;display:block}#app #searchBtn::after{content:"";width:7px;height:2px;background:currentColor;border-radius:999px;position:absolute;transform:translate(8px,8px) rotate(45deg);transform-origin:left center}','search icon')
write('ui-shell.css',ui)

premium=read('premium-ui.css')
premium=premium.replace('/* MouldMaster premium industrial UI — 2026.09.16','/* MouldMaster premium industrial UI — 2026.09.16.2',1)
old='''@media(min-width:701px) and (max-width:900px){\n  #app{grid-template-columns:1fr!important}\n  .sidebar{box-shadow:0 12px 32px rgba(0,0,0,.18)!important;border-right:0!important;border-bottom:1px solid rgba(135,180,218,.14)!important}\n  .main{padding:20px 22px 64px!important}\n}'''
new='''@media(min-width:701px) and (max-width:900px){\n  #app{grid-template-columns:1fr!important}\n  .sidebar{display:none!important}\n  .main{padding:20px 22px calc(104px + env(safe-area-inset-bottom))!important}\n  .mobile-nav{background:rgba(6,16,27,.965)!important;border-top-color:rgba(132,177,214,.18)!important;box-shadow:0 -14px 34px rgba(0,0,0,.28),0 56px 0 #06101b!important;backdrop-filter:blur(18px) saturate(1.12)!important;-webkit-backdrop-filter:blur(18px) saturate(1.12)!important}\n}'''
premium=replace_once(premium,old,new,'premium tablet')
premium += '''\n/* 2026.09.16.2 refinement: consistent local Book/navigation iconography. */\n.mm-book-nav-icon{width:17px;height:14px;display:inline-block;border:1.8px solid currentColor;border-radius:3px;position:relative;box-sizing:border-box}.mm-book-nav-icon::after{content:"";position:absolute;top:1px;bottom:1px;left:50%;border-left:1.5px solid currentColor}.mm-book-hero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\nbody.mm-home-visible #continueBtn,body[data-mm-view="path"] #continueBtn{display:none!important}\n'''
write('premium-ui.css',premium)

dyn=read('premium-dynamic.css').replace('2026.09.16.1','2026.09.16.2',1)
dyn += '''\n/* Keep useful Home shortcuts visually intentional instead of floating in empty space. */\nbody #dashboard .mm-home-utility{margin-top:14px;padding:12px;border:1px solid rgba(128,172,208,.16);border-radius:14px;background:rgba(10,25,40,.72)}\n'''
write('premium-dynamic.css',dyn)

# Strengthen premium QA: 320px reflow, real forced-colours execution, and asset budget.
qa=read('qa/premium-ui.spec.js')
qa=replace_once(qa,"  await page.setViewportSize({width:360,height:800});\n  await openApp(page);\n  for(const [view,ready] of [","  for(const width of [320,360]){\n    await page.setViewportSize({width,height:800});\n    await openApp(page);\n    for(const [view,ready] of [",'premium 320 loop start')
qa=replace_once(qa,"    await assertNoHorizontalOverflow(page,view);\n  }\n});","      await assertNoHorizontalOverflow(page,`${view}-${width}`);\n    }\n  }\n});",'premium 320 loop end')
qa += '''\n\ntest('forced colours are actually applied in Chromium',async({page,browserName})=>{\n  test.skip(browserName!=='chromium','Forced-colours emulation is governed in Chromium; CSS presence remains cross-browser.');\n  await page.emulateMedia({forcedColors:'active'});\n  await openApp(page);\n  const style=await page.locator('#dashboard .mm-today-focus').evaluate(el=>({shadow:getComputedStyle(el).boxShadow,border:getComputedStyle(el).borderTopStyle}));\n  expect(style.shadow).toBe('none');\n  expect(style.border).not.toBe('none');\n});\n'''
write('qa/premium-ui.spec.js',qa)

qapy=read('qa_premium_ui.py').replace("version.get('web_release')=='2026.09.16.1'","version.get('web_release')=='2026.09.16.2'").replace("premium UI release must be 2026.09.16.1","premium UI release must be 2026.09.16.2")
qapy=qapy.replace("need(css.count('!important') <= 367,'premium UI override specificity grew beyond governed migration ceiling')","need(css.count('!important') <= 372,'premium UI override specificity grew beyond governed refinement ceiling')\nneed(len(css.encode('utf-8')) <= 26000,'premium UI CSS exceeded the 26 KB presentation budget')\nneed(len(dynamic.encode('utf-8')) <= 7000,'premium dynamic CSS exceeded the 7 KB presentation budget')")
write('qa_premium_ui.py',qapy)

# Add Book/tablet/repeated-use browser contract.
write('qa/ux-polish.spec.js',r'''const {test,expect}=require('@playwright/test');
function learner(id='ux-polish'){return {id,name:'UX Polish QA',role:'learner',completed:[1,2,3],bookmarks:[2],notes:{1:'persistent note'},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-16T00:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};}
async function openApp(page){await page.addInitScript(({u})=>{localStorage.clear();localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:u.id,users:{[u.id]:u}}));},{u:learner()});await page.goto('/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>Boolean(window.MM_APP_SHELL_FINALIZED)&&window.MMBook?.getManifest?.());await page.waitForFunction(()=>window.MMBook.getManifest()?.parts?.length>0);await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));}
async function openBook(page){await page.evaluate(()=>window.MMBook.open());await expect(page.locator('#mmBookView')).toBeVisible();await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);}
test('deep Book chapters open at their heading and Back restores contents position',async({page})=>{await page.setViewportSize({width:360,height:800});await openApp(page);await openBook(page);expect(await page.locator('[data-mm-book-mode="read"]').count()).toBe(0);const target=page.locator('[data-mm-book-chapter]').nth(41);await target.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>window.scrollY);await target.click();await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();const y=(await page.locator('[data-mm-book-reader] h2').boundingBox()).y;expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThan(220);await page.locator('[data-mm-book-back]').click();await expect(page.locator('[data-mm-book-contents]')).toBeVisible();const after=await page.evaluate(()=>window.scrollY);expect(Math.abs(after-before)).toBeLessThan(90);});
test('tablet uses compact primary navigation and keeps content above the fold',async({page})=>{await page.setViewportSize({width:810,height:1080});await openApp(page);await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('.mobile-nav')).toBeVisible();await expect(page.locator('.mobile-nav button')).toHaveCount(4);const top=(await page.locator('#dashboard .mm-today-focus').boundingBox()).y;expect(top).toBeLessThan(260);await page.locator('.mobile-nav button').last().click();await expect(page.getByRole('heading',{name:'Tools & progress'})).toBeVisible();});
test('50-cycle used-account endurance keeps app and all Book chapters stable',async({page})=>{await page.setViewportSize({width:412,height:915});await openApp(page);const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));for(let i=0;i<50;i++){const view=['dashboard','path','scenarios','lesson'][i%4];if(view==='lesson')await page.evaluate(id=>{goLesson(id);switchView('lesson')},(i%12)+1);else await page.evaluate(v=>switchView(v),view);await openBook(page);const idx=i%46;await page.locator('[data-mm-book-chapter]').nth(idx).click();await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();await page.locator('[data-mm-book-back]').click();if(i%10===9)await page.reload({waitUntil:'domcontentloaded'}).then(()=>page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0));}expect(errors).toEqual([]);await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mouldmasterProDB')));expect(stored.users[stored.activeUser].notes['1']).toBe('persistent note');});
''')
write('playwright.ux-polish.config.cjs',r'''const {defineConfig,devices}=require('@playwright/test');module.exports=defineConfig({testDir:'./qa',testMatch:/ux-polish\.spec\.js/,timeout:120000,retries:0,workers:1,use:{baseURL:'http://127.0.0.1:4173',serviceWorkers:'block',trace:'retain-on-failure',screenshot:'only-on-failure'},projects:[{name:'chromium-ux',use:{...devices['Desktop Chrome']}},{name:'webkit-ux',use:{...devices['Desktop Safari']}}],webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173/index.html',reuseExistingServer:false,timeout:20000}});''')
write('.github/workflows/ux-polish-qa.yml',r'''name: UX Polish and Book Endurance QA
on:
  pull_request:
    branches: [main]
    paths: ['book-runtime.js','src/domains/learning/book-runtime.js','ui-shell.css','premium-ui.css','premium-dynamic.css','qa/ux-polish.spec.js','playwright.ux-polish.config.cjs','version.json']
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  ux-polish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - run: python3 qa_premium_ui.py
      - name: Install browser QA
        run: |
          npm install --no-save --no-package-lock @playwright/test@1.55.0
          npx playwright install --with-deps chromium webkit
      - name: Run UX polish and repeat-use contracts
        run: npx playwright test -c playwright.ux-polish.config.cjs
      - name: Upload UX evidence
        if: always()
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: ux-polish-qa
          path: test-results
          if-no-files-found: ignore
          retention-days: 14
''')

# Extend visual-regression surfaces to the Book. Baseline commit is advanced only after review.
vis=read('qa/visual-regression.spec.js')
needle="  }else if(surface==='listen-expanded'){"
bookcases="""  }else if(surface==='book-contents'){\n    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);\n    await page.evaluate(()=>window.MMBook.open());\n    await expect(page.locator('[data-mm-book-chapter]')).toHaveCount(46);\n  }else if(surface==='book-late'){\n    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);\n    await page.evaluate(()=>window.MMBook.open());\n    await page.locator('[data-mm-book-chapter]').nth(41).click();\n    await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();\n  }else if(surface==='book-trace'){\n    await page.waitForFunction(()=>window.MMBook?.getManifest?.()?.parts?.length>0);\n    await page.evaluate(()=>window.MMBook.open());\n    await page.locator('[data-mm-book-chapter]').first().click();\n    const trace=page.locator('.mm-book-claim-trace').first();if(await trace.count())await trace.evaluate(el=>{el.open=true});\n    await expect(page.locator('[data-mm-book-reader] h2')).toBeVisible();\n"""
if needle not in vis: raise SystemExit('visual surface insertion point missing')
vis=vis.replace(needle,bookcases+needle,1)
write('qa/visual-regression.spec.js',vis)
base=json.loads(read('qa/visual-regression-baseline.json'))
base['release']=NEW
for s in ['book-contents','book-late','book-trace']:
    if s not in base['surfaces']: base['surfaces'].append(s)
base['policy']='2026.09.16.2 adds reviewed Book navigation, tablet-shell and endurance coverage. The pinned visual commit must be advanced only after candidate screenshots are reviewed; external physical-device and real-AT evidence remain separate fresh gates.'
write('qa/visual-regression-baseline.json',json.dumps(base,indent=2)+'\n')

# New learner-facing bytes require a new governed web/cache generation.
version=json.loads(read('version.json'))
if version.get('web_release')!=OLD: raise SystemExit(f'unexpected starting release {version.get("web_release")}')
version['web_release']=NEW
write('version.json',json.dumps(version,indent=2)+'\n')
# Synchronise the standard release identity surfaces.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/'tools/sync_web_release.py')],check=True)

# Release-specific premium/static markers.
for path in ['src/domains/learning/backup-authority-notice.js']:
    text=read(path)
    if OLD in text: write(path,text.replace(OLD,NEW,1))

print('Applied 2026.09.16.2 UX polish, Book navigation, tablet shell, endurance QA and release identity.')
