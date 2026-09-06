from pathlib import Path
import re, subprocess

ROOT=Path('.')

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')
def one(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 occurrence, got {n}')
    return text.replace(old,new,1)
def one_re(text,pattern,repl,label,flags=0):
    out,n=re.subn(pattern,repl,text,count=1,flags=flags)
    if n!=1: raise SystemExit(f'{label}: expected 1 match, got {n}')
    return out

def grep_files(value):
    try: return [Path(x) for x in subprocess.check_output(['git','grep','-Il',value],text=True).splitlines()]
    except subprocess.CalledProcessError: return []

# ---- Canonical shell + responsive layout -------------------------------------------------
p=Path('ui-shell.css'); s=read(p)
s=one(s,':root{--mm-mobile-nav-clearance:104px;--shadow:0 7px 22px rgba(0,0,0,.18)}',
''':root{--mm-mobile-nav-clearance:104px;--mm-control-size:44px;--mm-control-large:48px;--mm-radius-sm:12px;--mm-radius-md:14px;--mm-radius-lg:16px;--shadow:0 7px 22px rgba(0,0,0,.18)}

/* One visible page title on self-titled learner views. */
body[data-mm-view="path"] .topbar>div:first-child,
body[data-mm-view="scenarios"] .topbar>div:first-child,
body[data-mm-view="lesson"] .topbar>div:first-child{display:none!important}
body[data-mm-view="path"] .topbar,
body[data-mm-view="scenarios"] .topbar,
body[data-mm-view="lesson"] .topbar{justify-content:flex-end!important}

.mm-home-utility{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-top:10px!important}
.mm-home-utility button{min-height:var(--mm-control-size)!important;padding:8px 11px!important;border-radius:var(--mm-radius-sm)!important}
''','shell tokens')
s=one(s,'#app .top-actions{gap:6px!important;flex:0 0 auto!important;align-items:flex-start!important}',
'''#app .top-actions{width:auto!important;gap:6px!important;flex:0 0 auto!important;align-items:flex-start!important;margin-left:auto!important}
  #app .top-actions>*{flex:0 0 auto!important}''','top actions')
s=one(s,'#app #searchBtn{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;font-size:0!important;display:grid!important;place-items:center!important}',
'''#app #searchBtn{flex:0 0 var(--mm-control-size)!important;width:var(--mm-control-size)!important;min-width:var(--mm-control-size)!important;height:var(--mm-control-size)!important;min-height:var(--mm-control-size)!important;padding:0!important;font-size:0!important;display:grid!important;place-items:center!important;border-radius:var(--mm-radius-sm)!important}''','search geometry')
s=one(s,'  .mm-primary-hub .mm-hub-grid{grid-template-columns:1fr!important;gap:8px!important}',
'  .mm-primary-hub .mm-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}','phone hub grid')
s=one(s,'  .mm-primary-hub .mm-hub-tile{min-height:0!important;padding:14px 15px!important;border-radius:14px!important}',
'  .mm-primary-hub .mm-hub-tile{min-height:96px!important;padding:13px!important;border-radius:var(--mm-radius-md)!important}','phone hub tile')
s=one(s,'  .mm-primary-hub .mm-hub-tile .eyebrow{font-size:9px!important;margin-bottom:4px!important}',
'  .mm-primary-hub .mm-hub-tile .eyebrow{display:none!important}','phone hub eyebrow')
s=one(s,'  .mm-primary-hub .mm-hub-tile small{font-size:13px!important;line-height:1.38!important;margin-top:5px!important}',
'  .mm-primary-hub .mm-hub-tile small{display:none!important}','phone hub description')
anchor='@media(max-width:390px){\n'
tablet='''@media(min-width:701px) and (max-width:900px){
  #app{grid-template-columns:1fr!important}
  .sidebar{position:relative!important;height:auto!important;padding:10px 12px!important}
  .sidebar .brand,.sidebar .profile-mini,.sidebar .sidebar-foot,.sidebar .nav-group-label{display:none!important}
  .sidebar nav{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
  .sidebar nav>button{min-height:var(--mm-control-size)!important;justify-content:center!important;padding:8px!important;text-align:center!important}
  .sidebar .more-nav{grid-column:1/-1!important;margin-top:2px!important;padding-top:6px!important}
  .main{padding-top:16px!important}
}
@media(max-width:380px){.mm-primary-hub .mm-hub-grid{grid-template-columns:1fr!important}}

'''
if tablet not in s: s=one(s,anchor,tablet+anchor,'tablet regime')
write(p,s)

# ---- Home utility row ---------------------------------------------------------------------
p=Path('learning-experience.js'); s=read(p)
s=one(s,'.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}',
'.mm-today-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}\n.mm-home-utility{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mm-home-utility button{min-height:44px;padding:8px 11px}','home utility style')
needle='<div class="mm-today-meta"><span class="pill">${c.lesson.duration} min lesson</span><span class="pill">${user.dailyMinutes||15} min daily goal</span><span class="pill">${overall}% overall</span></div>'
s=one(s,needle,needle+'\n        <div class="mm-home-utility" aria-label="Home shortcuts"><button class="ghost" type="button" data-mm-onclick="switchView(\'scenarios\')">◎ Daily practice</button><button class="ghost" type="button" data-mm-onclick="switchView(\'profile\')">☆ Saved lessons</button></div>','home utility markup')
s=s.replace('<span class="mm-home-action-icon">⚠</span>','<span class="mm-home-action-icon">◎</span>')
write(p,s)

# ---- Lesson opening, disclosures and observer scope ---------------------------------------
p=Path('lesson-simple-experience.js'); s=read(p)
s=s.replace('width:42px;min-width:42px;height:42px','width:44px;min-width:44px;height:44px')
s=s.replace("#lesson.mm-simple-lesson .mm-simple-note-disclosure>summary::before{content:'＋';margin-right:8px;color:#9fd8ff;font-weight:700}","#lesson.mm-simple-lesson .mm-simple-note-disclosure>summary::before{content:'▸';margin-right:8px;color:#9fd8ff;font-weight:700}")
s=s.replace("#lesson.mm-simple-lesson .mm-simple-note-disclosure[open]>summary::before{content:'−'}","#lesson.mm-simple-lesson .mm-simple-note-disclosure[open]>summary::before{content:'▾'}")
s=one_re(s,r'\n\.mm-simple-lesson-start\{.*?\}\n','\n','remove start style',re.S)
s=one(s,'<div class="mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></div><button class="primary mm-simple-lesson-start" type="button">Start lesson ↓</button>',
'<div class="mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>','remove start button')
s=one_re(s,r"\n\s*hero\.querySelector\('\.mm-simple-lesson-start'\)\?\.addEventListener\('click',\(\)=>\{.*?\n\s*\}\);",'', 'remove start listener',re.S)
s=one(s,"  root.classList.add('mm-simple-lesson');","  root.classList.add('mm-simple-lesson');\n  root.querySelectorAll('.lesson-quest').forEach(el=>el.remove());",'remove duplicate mission')
s=one(s,"const observer=new MutationObserver(()=>queueMicrotask(apply));\nif(document.body)observer.observe(document.body,{childList:true,subtree:true});",
"const observer=new MutationObserver(()=>queueMicrotask(apply));\nconst observedLesson=document.getElementById('lesson');\nif(observedLesson)observer.observe(observedLesson,{childList:true,subtree:true});",'scope simple lesson observer')
write(p,s)

p=Path('lesson-deep-authoring-v2.js'); s=read(p)
s=one(s,'.mm-deep-v2 details>summary{padding:11px 15px;cursor:pointer;list-style:none}',
'.mm-deep-v2 details>summary{min-height:46px;display:flex;align-items:center;padding:10px 13px;cursor:pointer;list-style:none}','detail disclosure')
s=one(s,"if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});",
"const lessonRoot=document.getElementById('lesson');if(lessonRoot)new MutationObserver(schedule).observe(lessonRoot,{childList:true,subtree:true});",'scope deep observer')
write(p,s)

# ---- Read Aloud: dock collapsed control in header; overlay only when opened ----------------
p=Path('read-aloud.js'); s=read(p)
s=one(s,"const VERSION='2026.09.07.2';","const VERSION='2026.09.07.3';",'read aloud version')
css='''
      .mm-read-aloud{position:relative;z-index:9;width:auto;font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf5ff}
      .mm-read-aloud details{border:1px solid #3b5575;border-radius:12px;background:#0c1929;box-shadow:none;overflow:hidden}
      .mm-read-aloud details:not([open]){width:44px;height:44px;margin:0}
      .mm-read-aloud summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 10px;cursor:pointer;font-weight:800;background:#12243a}
      .mm-read-aloud details:not([open]) summary{width:44px;min-width:44px;height:44px;min-height:44px;padding:0;justify-content:center;border-radius:12px}
      .mm-read-aloud details:not([open]) summary b{font-size:0}.mm-read-aloud details:not([open]) summary b::before{content:'🔊';font-size:18px;line-height:1}
      .mm-read-aloud details:not([open]) summary span{display:none}
      .mm-read-aloud details[open]{position:fixed;right:12px;top:72px;z-index:2147482000;width:min(360px,calc(100vw - 24px));box-shadow:0 12px 36px rgba(0,0,0,.35)}
      .mm-read-aloud summary::-webkit-details-marker{display:none}.mm-read-aloud summary span{color:#a9bdd6;font-size:12px;font-weight:600}
      .mm-read-panel{padding:12px;display:grid;gap:10px}.mm-read-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr 1fr;gap:7px}
      .mm-read-controls button,.mm-read-speed{min-height:44px;border:1px solid #3c5878;border-radius:9px;background:#162b46;color:#f5f9ff;padding:8px}.mm-read-controls button:disabled{opacity:.45;cursor:not-allowed}
      .mm-read-play{background:#55d6be!important;color:#07131b!important;border-color:#55d6be!important;font-weight:850}
      .mm-read-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#b8c9dd;font-size:12px}.mm-read-meta label{display:flex;align-items:center;gap:6px;color:#b8c9dd}
      .mm-read-speed{width:auto;min-height:38px;padding:6px 8px;margin:0}.mm-read-status{margin:0;color:#cbd8e7}.mm-read-current{margin:0;padding:9px 10px;border-radius:9px;background:#192f4b;color:#fff;border-left:3px solid #55d6be;max-height:92px;overflow:auto}
      .mm-read-source-active{outline:3px solid #55d6be!important;outline-offset:4px!important;border-radius:4px}.mm-read-note{margin:0;color:#95abc4;font-size:11px}
      @media(max-width:700px){.mm-read-aloud details[open]{top:auto;right:8px;bottom:calc(var(--mm-mobile-nav-clearance,104px) + env(safe-area-inset-bottom) + 10px);width:calc(100vw - 16px)}.mm-read-controls{grid-template-columns:1fr 1fr 1fr 1fr}}
      @media(prefers-reduced-motion:reduce){.mm-read-aloud *{scroll-behavior:auto!important}}
    '''
s=one_re(s,r"style\.textContent=`.*?\n    `;\n    document\.head\.appendChild\(style\);","style.textContent=`"+css+"`;\n    document.head.appendChild(style);",'read aloud css',re.S)
s=one_re(s,r"\n    document\.body\.appendChild\(host\);\n    const syncMobileClearance=\(\)=>\{.*?\n    window\.addEventListener\('resize',syncMobileClearance,\{passive:true\}\);",
"\n    const actions=document.querySelector('#app .top-actions,.top-actions');\n    (actions||document.body).appendChild(host);",'read aloud dock',re.S)
write(p,s)

# ---- Touch targets + navigation semantics -------------------------------------------------
p=Path('assessment-ux.js'); s=read(p)
s=s.replace('.mm-step{width:34px;height:34px;','.mm-step{width:38px;height:38px;')
s=s.replace('.mm-exam-steps{gap:5px}.mm-step{width:31px;height:31px;border-radius:9px}', '.mm-exam-steps{gap:5px}.mm-step{width:38px;height:38px;border-radius:9px}')
write(p,s)

p=Path('MouldMaster_Core_App.html'); s=read(p)
s=one(s,'<button data-view="path">▦<span>Learn</span></button>','<button data-view="path">▤<span>Learn</span></button>','learn icon')
s=one(s,'<button data-view="scenarios">⚠<span>Practice</span></button>','<button data-view="scenarios">◎<span>Practice</span></button>','practice icon')
write(p,s)

# ---- QA: explicit owned Read Aloud contracts ---------------------------------------------
p=Path('qa_read_aloud.py'); s=read(p); s=s.replace('2026.09.07.2','2026.09.07.3')
s=s.replace('    "var(--mm-mobile-nav-clearance,104px)",','    "#app .top-actions,.top-actions",\n    "details[open]",')
write(p,s)

p=Path('qa/read-aloud.spec.js'); s=read(p); s=s.replace("'2026.09.07.2'","'2026.09.07.3'")
s=s.replace('stays above mobile navigation','docks in the header without covering learner content')
s=one_re(s,r"\n  const placement=await page\.evaluate\(\(\)=>\{.*?expect\(placement\.listenBottom\)\.toBeLessThanOrEqual\(placement\.navTop\+1\);",
'''\n  const placement=await page.evaluate(()=>{\n    const host=document.querySelector('.mm-read-aloud');\n    const actions=document.querySelector('.top-actions');\n    const details=host?.querySelector('details');\n    return host&&actions&&details?{parent:host.parentElement===actions,position:getComputedStyle(host).position,width:details.getBoundingClientRect().width,height:details.getBoundingClientRect().height}:null;\n  });\n  expect(placement).not.toBeNull();\n  expect(placement.parent).toBeTruthy();\n  expect(placement.position).toBe('relative');\n  expect(placement.width).toBeLessThanOrEqual(48);\n  expect(placement.height).toBeGreaterThanOrEqual(44);''','read aloud browser geometry',re.S)
write(p,s)

# version manifest owns the public Read Aloud component identifier.
p=Path('version.json'); s=read(p)
s=one(s,'"read_aloud_version": "2026.09.07.2"','"read_aloud_version": "2026.09.07.3"','manifest read aloud version')
write(p,s)

# ---- QA: visual hierarchy/geometry contract -----------------------------------------------
p=Path('qa/mobile-viewport.spec.js'); s=read(p)
if 'UI audit contract: one page title' not in s:
    s += r'''

test('UI audit contract: one page title, compact header actions, useful Home, dense hubs, and unobstructed lesson content',async({page})=>{
  await page.setViewportSize({width:412,height:915});
  await openApp(page);
  await expect(page.locator('#dashboard .mm-home-utility')).toBeVisible();
  await expect(page.locator('#dashboard .mm-home-utility button')).toHaveCount(2);
  const searchBox=await page.locator('#searchBtn').boundingBox();
  expect(searchBox.width).toBeLessThanOrEqual(48);
  expect(searchBox.height).toBeGreaterThanOrEqual(44);
  const listen=page.locator('.mm-read-aloud');
  await expect(listen).toBeVisible();
  expect(await listen.evaluate(el=>el.parentElement?.classList.contains('top-actions'))).toBeTruthy();

  await openLearnHub(page);
  await expect(page.locator('body[data-mm-view="path"] .topbar>div:first-child')).toBeHidden();
  await expect(page.locator('#path .mm-primary-hub-head h1')).toHaveCount(1);
  expect(await page.locator('#path .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);

  await openPracticeHub(page);
  await expect(page.locator('body[data-mm-view="scenarios"] .topbar>div:first-child')).toBeHidden();
  expect(await page.locator('#scenarios .mm-hub-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);

  await openLearnHub(page);
  await page.getByRole('button',{name:/Continue lesson/i}).first().click();
  await expect(page.locator('#lesson .lesson-quest')).toHaveCount(0);
  await expect(page.locator('#lesson .mm-simple-lesson-start')).toHaveCount(0);
  await expect(page.locator('body[data-mm-view="lesson"] .topbar>div:first-child')).toBeHidden();
  const overlap=await page.evaluate(()=>{
    const a=document.querySelector('.mm-read-aloud details')?.getBoundingClientRect();
    const lesson=document.querySelector('#lesson .mm-simple-lesson-hero')?.getBoundingClientRect();
    if(!a||!lesson)return true;
    return !(a.right<=lesson.left||a.left>=lesson.right||a.bottom<=lesson.top||a.top>=lesson.bottom);
  });
  expect(overlap).toBeFalsy();
});
'''
write(p,s)

# ---- Governed web release .23 --------------------------------------------------------------
old='2026.09.06.22'; new='2026.09.06.23'
ignore={Path('tools/ui_consolidation_migration.py'),Path('tools/ui_consolidation_migration_v2.py'),Path('.github/workflows/ui-consolidation-migration.yml')}
allowed={Path('index.html'),Path('version.json'),Path('service-worker.js'),Path('pwa-shell.js'),Path('qa_release.py'),Path('qa_web_release_identity.py')}
paths=[p for p in grep_files(old) if p not in ignore]
unknown=[p for p in paths if p not in allowed]
if unknown: raise SystemExit('unexpected .22 release marker in: '+', '.join(map(str,unknown)))
for q in paths:
    t=q.read_text(encoding='utf-8')
    q.write_text(t.replace(old,new),encoding='utf-8')
print('release files:',', '.join(map(str,paths)))

print('UI consolidation v2 complete')
