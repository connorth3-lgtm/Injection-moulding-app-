from pathlib import Path
import re, subprocess

ROOT=Path('.')

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,s): (ROOT/path).write_text(s,encoding='utf-8')
def once(s,old,new,label):
    n=s.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 occurrence, got {n}')
    return s.replace(old,new,1)
def regex_once(s,pat,repl,label,flags=0):
    out,n=re.subn(pat,repl,s,count=1,flags=flags)
    if n!=1: raise SystemExit(f'{label}: expected 1 regex match, got {n}')
    return out

def tracked_with(value):
    try:
        out=subprocess.check_output(['git','grep','-Il',value],text=True).splitlines()
    except subprocess.CalledProcessError:
        out=[]
    return [Path(x) for x in out]

# 1) Canonical shell styling: one page title, fixed compact top actions, useful Home,
#    denser mobile hubs and an explicit tablet regime.
p=Path('ui-shell.css'); s=read(p)
s=once(s,':root{--mm-mobile-nav-clearance:104px;--shadow:0 7px 22px rgba(0,0,0,.18)}',
''':root{--mm-mobile-nav-clearance:104px;--mm-control-size:44px;--mm-control-large:48px;--mm-radius-sm:12px;--mm-radius-md:14px;--mm-radius-lg:16px;--shadow:0 7px 22px rgba(0,0,0,.18)}\n\n/* Canonical page hierarchy: Learn, Practice and Lesson own their visible H1. */\nbody[data-mm-view="path"] .topbar>div:first-child,\nbody[data-mm-view="scenarios"] .topbar>div:first-child,\nbody[data-mm-view="lesson"] .topbar>div:first-child{display:none!important}\nbody[data-mm-view="path"] .topbar,body[data-mm-view="scenarios"] .topbar,body[data-mm-view="lesson"] .topbar{justify-content:flex-end!important}\n\n/* Small Home utilities replace the old empty lower viewport without restoring dashboard clutter. */\n.mm-home-utility{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-top:10px!important}\n.mm-home-utility button{min-height:var(--mm-control-size)!important;padding:8px 11px!important;border-radius:var(--mm-radius-sm)!important}\n''','ui root tokens')
s=once(s,'#app .top-actions{gap:6px!important;flex:0 0 auto!important;align-items:flex-start!important}',
'''#app .top-actions{width:auto!important;gap:6px!important;flex:0 0 auto!important;align-items:flex-start!important;margin-left:auto!important}\n  #app .top-actions>*{flex:0 0 auto!important}\n  #app .top-actions #continueBtn{display:none!important}''','mobile top actions')
s=s.replace('  #app .top-actions #continueBtn{display:none!important}\n  #app .top-actions #continueBtn{display:none!important}\n','  #app .top-actions #continueBtn{display:none!important}\n')
s=once(s,'#app #searchBtn{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;font-size:0!important;display:grid!important;place-items:center!important}',
'''#app #searchBtn{flex:0 0 var(--mm-control-size)!important;width:var(--mm-control-size)!important;min-width:var(--mm-control-size)!important;height:var(--mm-control-size)!important;min-height:var(--mm-control-size)!important;padding:0!important;font-size:0!important;display:grid!important;place-items:center!important;border-radius:var(--mm-radius-sm)!important}''','compact search')
s=once(s,'  .mm-primary-hub .mm-hub-grid{grid-template-columns:1fr!important;gap:8px!important}',
'''  .mm-primary-hub .mm-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}''','mobile hub grid')
s=once(s,'  .mm-primary-hub .mm-hub-tile{min-height:0!important;padding:14px 15px!important;border-radius:14px!important}',
'''  .mm-primary-hub .mm-hub-tile{min-height:96px!important;padding:13px!important;border-radius:var(--mm-radius-md)!important}''','mobile hub tile')
s=once(s,'  .mm-primary-hub .mm-hub-tile .eyebrow{font-size:9px!important;margin-bottom:4px!important}',
'''  .mm-primary-hub .mm-hub-tile .eyebrow{display:none!important}''','hub eyebrow')
s=once(s,'  .mm-primary-hub .mm-hub-tile small{font-size:13px!important;line-height:1.38!important;margin-top:5px!important}',
'''  .mm-primary-hub .mm-hub-tile small{display:none!important}''','hub mobile description')
anchor='@media(max-width:390px){\n'
tablet='''@media(min-width:701px) and (max-width:900px){\n  #app{grid-template-columns:1fr!important}\n  .sidebar{position:relative!important;height:auto!important;padding:10px 12px!important}\n  .sidebar .brand,.sidebar .profile-mini,.sidebar .sidebar-foot,.sidebar .nav-group-label{display:none!important}\n  .sidebar nav{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}\n  .sidebar nav>button{min-height:var(--mm-control-size)!important;justify-content:center!important;padding:8px!important;text-align:center!important}\n  .sidebar .more-nav{grid-column:1/-1!important;margin-top:2px!important;padding-top:6px!important}\n  .main{padding-top:16px!important}\n}\n\n@media(max-width:380px){\n  .mm-primary-hub .mm-hub-grid{grid-template-columns:1fr!important}\n}\n\n'''
if tablet not in s:
    s=once(s,anchor,tablet+anchor,'tablet block')
write(p,s)

# 2) Home: add two compact useful shortcuts, no dashboard wall.
p=Path('learning-experience.js'); s=read(p)
s=once(s,"const VERSION='2026.08.26.1';","const VERSION='2026.08.26.2';",'learning experience version')
s=once(s,'.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}',
'''.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}\n.mm-home-utility{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mm-home-utility button{min-height:44px;padding:8px 11px}''','home utility styles')
s=once(s,'<div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>',
'''<div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>\n        <div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-onclick="switchView('scenarios')">◎ Daily practice</button><button class="ghost" type="button" data-mm-onclick="switchView('profile')">☆ Saved lessons</button></div>''','home utility markup')
s=s.replace('<span class="mm-home-action-icon">⚠</span>','<span class="mm-home-action-icon">◎</span>')
write(p,s)

# 3) Lesson: remove duplicate mission/start layers, standardize disclosures and scope mutation work.
p=Path('lesson-simple-experience.js'); s=read(p)
s=once(s,"const VERSION='2026.09.07.3';","const VERSION='2026.09.07.4';",'simple lesson version')
s=s.replace('width:42px;min-width:42px;height:42px','width:44px;min-width:44px;height:44px')
s=s.replace("#lesson.mm-simple-lesson .mm-simple-note-disclosure>summary::before{content:'＋';margin-right:8px;color:#9fd8ff;font-weight:700}","#lesson.mm-simple-lesson .mm-simple-note-disclosure>summary::before{content:'▸';margin-right:8px;color:#9fd8ff;font-weight:700}")
s=s.replace("#lesson.mm-simple-lesson .mm-simple-note-disclosure[open]>summary::before{content:'−'}","#lesson.mm-simple-lesson .mm-simple-note-disclosure[open]>summary::before{content:'▾'}")
s=regex_once(s,r"\n\.mm-simple-lesson-start\{.*?\}\n",'\n','start CSS',flags=re.S)
s=once(s,'<div class="mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></div><button class="primary mm-simple-lesson-start" type="button">Start lesson ↓</button>',
'<div class="mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>','start markup')
s=regex_once(s,r"\n\s*hero\.querySelector\('\.mm-simple-lesson-start'\)\?\.addEventListener\('click',\(\)=>\{.*?\n\s*\}\);",'', 'start listener',flags=re.S)
s=once(s,"  root.classList.add('mm-simple-lesson');","  root.classList.add('mm-simple-lesson');\n  root.querySelectorAll('.lesson-quest').forEach(el=>el.remove());",'remove mission quest')
s=once(s,"const observer=new MutationObserver(()=>queueMicrotask(apply));\nif(document.body)observer.observe(document.body,{childList:true,subtree:true});",
"const observer=new MutationObserver(()=>queueMicrotask(apply));\nconst observedLesson=document.getElementById('lesson');\nif(observedLesson)observer.observe(observedLesson,{childList:true,subtree:true});",'scope lesson observer')
write(p,s)

# 4) More detail uses the same disclosure geometry and its observer is lesson-scoped.
p=Path('lesson-deep-authoring-v2.js'); s=read(p)
s=once(s,"const VERSION='2026.09.07.4';","const VERSION='2026.09.07.5';",'deep lesson version')
s=once(s,'.mm-deep-v2 details>summary{padding:11px 15px;cursor:pointer;list-style:none}',
'.mm-deep-v2 details>summary{min-height:46px;display:flex;align-items:center;padding:10px 13px;cursor:pointer;list-style:none}', 'detail summary geometry')
s=once(s,"if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});",
"const lessonRoot=document.getElementById('lesson');if(lessonRoot)new MutationObserver(schedule).observe(lessonRoot,{childList:true,subtree:true});",'scope deep observer')
write(p,s)

# 5) Read Aloud: dock the collapsed affordance in the header; only the user-opened panel overlays.
p=Path('read-aloud.js'); s=read(p)
s=once(s,"const VERSION='2026.09.07.2';","const VERSION='2026.09.07.3';",'read aloud version')
new_css='''\n      .mm-read-aloud{position:relative;z-index:9;width:auto;font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf5ff}\n      .mm-read-aloud details{border:1px solid #3b5575;border-radius:12px;background:#0c1929;box-shadow:none;overflow:hidden}\n      .mm-read-aloud details:not([open]){width:44px;height:44px;margin:0}\n      .mm-read-aloud summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 10px;cursor:pointer;font-weight:800;background:#12243a}\n      .mm-read-aloud details:not([open]) summary{width:44px;min-width:44px;height:44px;min-height:44px;padding:0;justify-content:center;border-radius:12px}\n      .mm-read-aloud details:not([open]) summary b{font-size:0}.mm-read-aloud details:not([open]) summary b::before{content:'🔊';font-size:18px;line-height:1}\n      .mm-read-aloud details:not([open]) summary span{display:none}\n      .mm-read-aloud details[open]{position:fixed;right:12px;top:72px;z-index:2147482000;width:min(360px,calc(100vw - 24px));box-shadow:0 12px 36px rgba(0,0,0,.35)}\n      .mm-read-aloud summary::-webkit-details-marker{display:none}.mm-read-aloud summary span{color:#a9bdd6;font-size:12px;font-weight:600}\n      .mm-read-panel{padding:12px;display:grid;gap:10px}.mm-read-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr 1fr;gap:7px}\n      .mm-read-controls button,.mm-read-speed{min-height:44px;border:1px solid #3c5878;border-radius:9px;background:#162b46;color:#f5f9ff;padding:8px}.mm-read-controls button:disabled{opacity:.45;cursor:not-allowed}\n      .mm-read-play{background:#55d6be!important;color:#07131b!important;border-color:#55d6be!important;font-weight:850}\n      .mm-read-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#b8c9dd;font-size:12px}.mm-read-meta label{display:flex;align-items:center;gap:6px;color:#b8c9dd}\n      .mm-read-speed{width:auto;min-height:38px;padding:6px 8px;margin:0}.mm-read-status{margin:0;color:#cbd8e7}.mm-read-current{margin:0;padding:9px 10px;border-radius:9px;background:#192f4b;color:#fff;border-left:3px solid #55d6be;max-height:92px;overflow:auto}\n      .mm-read-source-active{outline:3px solid #55d6be!important;outline-offset:4px!important;border-radius:4px}.mm-read-note{margin:0;color:#95abc4;font-size:11px}\n      @media(max-width:700px){.mm-read-aloud details[open]{top:auto;right:8px;bottom:calc(var(--mm-mobile-nav-clearance,104px) + env(safe-area-inset-bottom) + 10px);width:calc(100vw - 16px)}.mm-read-controls{grid-template-columns:1fr 1fr 1fr 1fr}}\n      @media(prefers-reduced-motion:reduce){.mm-read-aloud *{scroll-behavior:auto!important}}\n    '''
s=regex_once(s,r"style\.textContent=`.*?\n    `;\n    document\.head\.appendChild\(style\);", "style.textContent=`"+new_css+"`;\n    document.head.appendChild(style);", 'read aloud CSS', flags=re.S)
s=once(s,'    document.body.appendChild(host);\n    const syncMobileClearance=()=>{\n      if(window.matchMedia?.(\'(max-width:680px)\').matches){\n        host.style.bottom=\'calc(var(--mm-mobile-nav-clearance,104px) + env(safe-area-inset-bottom) + 14px)\';\n      }else{\n        host.style.removeProperty(\'bottom\');\n      }\n    };\n    syncMobileClearance();\n    window.addEventListener(\'resize\',syncMobileClearance,{passive:true});',
'''    const actions=document.querySelector('#app .top-actions,.top-actions');\n    (actions||document.body).appendChild(host);''','read aloud docking')
write(p,s)

# 6) Assessment pager touch targets.
p=Path('assessment-ux.js'); s=read(p)
s=once(s,"const VERSION='2026.09.06.9';","const VERSION='2026.09.06.10';",'assessment version')
s=s.replace('.mm-step{width:34px;height:34px;','.mm-step{width:38px;height:38px;')
s=s.replace('.mm-exam-steps{gap:5px}.mm-step{width:31px;height:31px;border-radius:9px}', '.mm-exam-steps{gap:5px}.mm-step{width:38px;height:38px;border-radius:9px}')
write(p,s)

# 7) Navigation icon semantics.
p=Path('MouldMaster_Core_App.html'); s=read(p)
s=once(s,'<button data-view="path">▦<span>Learn</span></button>','<button data-view="path">▤<span>Learn</span></button>','learn nav icon')
s=once(s,'<button data-view="scenarios">⚠<span>Practice</span></button>','<button data-view="scenarios">◎<span>Practice</span></button>','practice nav icon')
write(p,s)

# 8) Browser QA: prove the audit defects cannot return.
p=Path('qa/mobile-viewport.spec.js'); s=read(p)
insert='''\n\ntest('UI audit contract: one page title, compact header actions, useful Home, dense hubs, and unobstructed lesson content',async({page})=>{\n  await page.setViewportSize({width:412,height:915});\n  await openApp(page);\n  await expect(page.locator('#dashboard .mm-home-utility')).toBeVisible();\n  await expect(page.locator('#dashboard .mm-home-utility button')).toHaveCount(2);\n  const searchBox=await page.locator('#searchBtn').boundingBox();\n  expect(searchBox.width).toBeLessThanOrEqual(48);\n  expect(searchBox.height).toBeGreaterThanOrEqual(44);\n  const listen=page.locator('.mm-read-aloud');\n  await expect(listen).toBeVisible();\n  expect(await listen.evaluate(el=>el.parentElement?.classList.contains('top-actions'))).toBeTruthy();\n\n  await openLearnHub(page);\n  await expect(page.locator('body[data-mm-view="path"] .topbar>div:first-child')).toBeHidden();\n  await expect(page.locator('#path .mm-primary-hub-head h1')).toHaveCount(1);\n  const learnCols=await page.locator('#path .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);\n  expect(learnCols).toBe(2);\n\n  await openPracticeHub(page);\n  await expect(page.locator('body[data-mm-view="scenarios"] .topbar>div:first-child')).toBeHidden();\n  const practiceCols=await page.locator('#scenarios .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);\n  expect(practiceCols).toBe(2);\n\n  await openLearnHub(page);\n  await page.getByRole('button',{name:/Continue lesson/i}).first().click();\n  await expect(page.locator('#lesson .lesson-quest')).toHaveCount(0);\n  await expect(page.locator('#lesson .mm-simple-lesson-start')).toHaveCount(0);\n  await expect(page.locator('body[data-mm-view="lesson"] .topbar>div:first-child')).toBeHidden();\n  const collapsed=page.locator('.mm-read-aloud details');\n  await expect(collapsed).not.toHaveAttribute('open','');\n  const overlap=await page.evaluate(()=>{\n    const a=document.querySelector('.mm-read-aloud details')?.getBoundingClientRect();\n    const lesson=document.querySelector('#lesson .mm-simple-lesson-hero')?.getBoundingClientRect();\n    if(!a||!lesson)return true;\n    return !(a.right<=lesson.left||a.left>=lesson.right||a.bottom<=lesson.top||a.top>=lesson.bottom);\n  });\n  expect(overlap).toBeFalsy();\n  for(const selector of ['#mmLessonDeepV2 details>summary','.mm-simple-note-disclosure>summary','.mm-simple-measured-evidence>summary']){\n    const el=page.locator(selector).first();\n    if(await el.count())expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);\n  }\n});\n'''
if 'UI audit contract: one page title' not in s: s += insert
write(p,s)

# 9) Read Aloud QA follows header-docked semantics.
p=Path('qa/read-aloud.spec.js'); s=read(p)
s=s.replace("'2026.09.07.2'","'2026.09.07.3'")
s=once(s,"test('Read Aloud integrates with the real shell, stays above mobile navigation, and scopes itself to visible learner text'",
"test('Read Aloud integrates with the real shell, docks in the header without covering learner content, and scopes itself to visible learner text'",'read aloud test title')
s=regex_once(s,r"\n  const placement=await page\.evaluate\(\(\)=>\{.*?expect\(placement\.listenBottom\)\.toBeLessThanOrEqual\(placement\.navTop\+1\);",
'''\n  const placement=await page.evaluate(()=>{\n    const host=document.querySelector('.mm-read-aloud');\n    const actions=document.querySelector('.top-actions');\n    const details=host?.querySelector('details');\n    return host&&actions&&details?{parent:host.parentElement===actions,position:getComputedStyle(host).position,width:details.getBoundingClientRect().width,height:details.getBoundingClientRect().height}:null;\n  });\n  expect(placement).not.toBeNull();\n  expect(placement.parent).toBeTruthy();\n  expect(placement.position).toBe('relative');\n  expect(placement.width).toBeLessThanOrEqual(48);\n  expect(placement.height).toBeGreaterThanOrEqual(44);''','read aloud placement QA',flags=re.S)
write(p,s)

# Static Read Aloud contract updates: component version + docking invariant.
p=Path('qa_read_aloud.py'); s=read(p)
s=s.replace('2026.09.07.2','2026.09.07.3')
s=s.replace('    "var(--mm-mobile-nav-clearance,104px)",','    "#app .top-actions,.top-actions",\n    "details[open]",')
s=s.replace('mobile-nav-clear','header-docked')
write(p,s)

# 10) Component version mirrors are targeted by ownership markers so unrelated
# release/content versions that happen to share the same date are never rewritten.
def replace_owned_mirrors(old,new,needles,label):
    touched=[]
    for q in [Path(x) for x in subprocess.check_output(['git','ls-files'],text=True).splitlines()]:
        if not q.is_file(): continue
        if not (str(q).startswith('qa') or str(q).startswith('.github/')): continue
        try: text=q.read_text(encoding='utf-8')
        except UnicodeDecodeError: continue
        if old not in text or not any(n in text for n in needles): continue
        q.write_text(text.replace(old,new),encoding='utf-8'); touched.append(q)
    if touched: print(label,':',', '.join(map(str,touched)))

replace_owned_mirrors('2026.09.07.3','2026.09.07.4',['lesson-simple-experience','MM_SIMPLE_LESSON_EXPERIENCE'],'simple lesson QA mirrors')
replace_owned_mirrors('2026.09.07.4','2026.09.07.5',['lesson-deep-authoring-v2','MM_LESSON_DEEP_AUTHORING_V2'],'deep lesson QA mirrors')
replace_owned_mirrors('2026.09.06.9','2026.09.06.10',['assessment-ux','MM_ASSESSMENT'],'assessment UX QA mirrors')
replace_owned_mirrors('2026.08.26.1','2026.08.26.2',['learning-experience','MM_LEARNING_EXPERIENCE'],'learning experience QA mirrors')

# Read Aloud is also part of the public version manifest.
vp=Path('version.json'); version_text=vp.read_text(encoding='utf-8')
version_text=version_text.replace('"read_aloud_version": "2026.09.07.2"','"read_aloud_version": "2026.09.07.3"')
vp.write_text(version_text,encoding='utf-8')

# 11) Governed web release .23. Only release-identity files are allowed to carry this exact marker.
old='2026.09.06.22'; new='2026.09.06.23'
allowed={Path(x) for x in ['index.html','version.json','service-worker.js','pwa-shell.js','qa_release.py','qa_web_release_identity.py']}
release_paths=tracked_with(old)
unknown=[p for p in release_paths if p not in allowed]
if unknown: raise SystemExit('unexpected .22 release marker in: '+', '.join(map(str,unknown)))
for q in release_paths:
    text=q.read_text(encoding='utf-8')
    q.write_text(text.replace(old,new),encoding='utf-8')
print('release identity:',', '.join(map(str,release_paths)))

print('UI consolidation migration complete')
