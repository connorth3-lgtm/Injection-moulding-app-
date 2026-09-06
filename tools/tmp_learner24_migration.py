from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')
def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old,new,1)

# Governed web release identity.
for rel in ['index.html','pwa-shell.js','service-worker.js','version.json','qa_release.py']:
    text=read(rel)
    if '2026.09.06.23' not in text: raise SystemExit(f'{rel}: .23 release marker missing')
    write(rel,text.replace('2026.09.06.23','2026.09.06.24'))

# Learner flow: canonical saved state, deterministic ranked search and useful Home shortcuts.
p='learning-experience.js'; text=read(p)
text=replace_once(text,'/* MouldMaster learning experience tightening — 2026.08.26.1 */','/* MouldMaster learning experience tightening — 2026.09.07.1 */',p)
text=replace_once(text,"const VERSION='2026.08.26.1';","const VERSION='2026.09.07.1';",p)
css_anchor='.mm-home-utility{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mm-home-utility button{min-height:44px;padding:8px 11px}\n'
css_extra='''.mm-saved-list{display:grid;gap:8px;margin-top:14px}.mm-saved-row{width:100%;min-height:54px;padding:11px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center;text-align:left;border:1px solid #304b69;border-radius:12px;background:#102039;color:#edf5ff}.mm-saved-row:hover,.mm-saved-row:focus-visible{border-color:#69a8ff;background:#152a45}.mm-saved-row b{display:block}.mm-saved-row small{display:block;margin-top:3px;color:#9fb3cb}.mm-saved-empty{padding:14px;border:1px dashed #35516f;border-radius:12px;color:#aebfd4}.mm-search-result-type{display:inline-block;min-width:64px;margin-right:7px;color:#9fd8ff;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.mm-search-result-reason{display:block;margin-top:3px;color:#91a8c4;font-size:11px}.mm-home-resume-label{display:inline-flex;align-items:center;gap:5px;margin-bottom:2px;color:#9ff3df;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}\n'''
text=replace_once(text,css_anchor,css_anchor+css_extra,p)
context_anchor="""function jumpTo(id){\n  const el=document.getElementById(id);\n  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});\n}\nwindow.mmLearningJump=jumpTo;\n"""
flow_code=r'''

function lessonById(id){return D?.lessons?.find(x=>x.id===Number(id))||null}
function courseForLesson(lesson){return lesson?D?.courses?.find(x=>x.id===lesson.course)||null:null}
function openSavedLesson(id){
  const lesson=lessonById(id);if(!lesson)return;
  user.currentLesson=lesson.id;persist();
  if(typeof closeModal==='function')closeModal();
  if(typeof switchView==='function')switchView('lesson');
  try{window.scrollTo({top:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
}
function openSavedLessons(){
  const ids=(Array.isArray(user?.bookmarks)?user.bookmarks:[]).map(Number).filter(id=>lessonById(id));
  const rows=ids.map(id=>{
    const lesson=lessonById(id),course=courseForLesson(lesson);
    return `<button class="mm-saved-row" type="button" data-mm-saved-lesson="${lesson.id}"><span><b>${esc(lesson.title)}</b><small>${course?`Track ${course.id}: ${esc(course.name)}`:'Saved lesson'}</small></span><span aria-hidden="true">Open →</span></button>`;
  }).join('');
  if(typeof openModal!=='function')return;
  openModal(`<span class="eyebrow">Learn</span><h2>Saved lessons</h2><p class="muted">${ids.length?`${ids.length} lesson${ids.length===1?'':'s'} saved on this device.`:'Bookmark a lesson and it will appear here.'}</p>${rows?`<div class="mm-saved-list">${rows}</div>`:'<div class="mm-saved-empty">No saved lessons yet.</div>'}`);
  document.querySelectorAll('#modal [data-mm-saved-lesson]').forEach(button=>button.addEventListener('click',()=>openSavedLesson(button.dataset.mmSavedLesson)));
}
window.mmOpenSavedLessons=openSavedLessons;
window.mmOpenSavedLesson=openSavedLesson;

function normaliseSearch(value){return String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function flattenText(value,out=[]){
  if(value==null)return out;
  if(typeof value==='string'||typeof value==='number')out.push(String(value));
  else if(Array.isArray(value))value.forEach(v=>flattenText(v,out));
  else if(typeof value==='object')Object.values(value).forEach(v=>flattenText(v,out));
  return out;
}
function rankText(query,title,body){
  const q=normaliseSearch(query),t=normaliseSearch(title),b=normaliseSearch(body);if(!q)return 0;
  const tokens=q.split(' ').filter(Boolean);let score=0;
  if(t===q)score+=220;else if(t.startsWith(q))score+=150;else if(t.includes(q))score+=115;
  for(const token of tokens){if(t.split(' ').includes(token))score+=42;else if(t.includes(token))score+=25;if(b.includes(token))score+=7}
  if(tokens.every(token=>t.includes(token)))score+=55;
  if(tokens.every(token=>`${t} ${b}`.includes(token)))score+=20;
  return score;
}
function rankedSearch(query){
  const results=[];
  for(const lesson of D?.lessons||[]){
    const course=courseForLesson(lesson);const body=flattenText(lesson).join(' ');const title=lesson.title||'';
    const score=rankText(query,title,`${course?.name||''} ${body}`);if(!score)continue;
    results.push({type:'Lesson',name:title,score,reason:course?`Track ${course.id}: ${course.name}`:'Learning path',action:()=>openSavedLesson(lesson.id)});
  }
  for(const [term,definition] of Object.entries(D?.glossary||{})){
    const score=rankText(query,term,definition);if(!score)continue;
    results.push({type:'Glossary',name:term,score,reason:String(definition).slice(0,90),action:()=>{if(typeof closeModal==='function')closeModal();if(typeof switchView==='function')switchView('glossary');requestAnimationFrame(()=>{const input=document.getElementById('glossarySearch');if(input){input.value=term;if(typeof filterGlossary==='function')filterGlossary()}})}});
  }
  return results.sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type)||a.name.localeCompare(b.name)).slice(0,12);
}
window.mmRankedSearch=rankedSearch;
window.doSearch=function(){
  const input=document.getElementById('searchInput'),area=document.getElementById('searchResults');if(!input||!area)return;
  const query=input.value.trim();if(!query){area.innerHTML='<div class="p muted">Type a lesson or moulding term.</div>';return}
  const results=rankedSearch(query);
  area.innerHTML=results.length?results.map((row,i)=>`<button class="search-item" type="button" data-mm-search-result="${i}"><span class="mm-search-result-type">${esc(row.type)}</span>${esc(row.name)}<small class="mm-search-result-reason">${esc(row.reason)}</small></button>`).join(''):'<div class="p muted">No matches. Try a shorter moulding term.</div>';
  area.querySelectorAll('[data-mm-search-result]').forEach(button=>button.addEventListener('click',()=>results[Number(button.dataset.mmSearchResult)]?.action()));
};
'''
text=replace_once(text,context_anchor,context_anchor+flow_code,p)
text=text.replace("<span class=\"eyebrow\">Today’s focus</span>","<span class=\"mm-home-resume-label\">Resume</span><span class=\"eyebrow\">Today’s focus</span>",1)
text=replace_once(text,"data-mm-onclick=\"switchView('profile')\">☆ Saved lessons","data-mm-onclick=\"mmOpenSavedLessons()\">☆ Saved lessons",p)
text=replace_once(text,'window.MM_LEARNING_EXPERIENCE={version:VERSION,decorateLesson,decorateDashboard,completeAndContinue};','window.MM_LEARNING_EXPERIENCE={version:VERSION,decorateLesson,decorateDashboard,completeAndContinue,openSavedLessons,rankedSearch};',p)
write(p,text)

# Saved lessons in the Learn hub use the same canonical bookmark workspace.
p='primary-learning-practice-hubs.js'; text=read(p)
text=replace_once(text,"case 'saved': closePicker(); return switchView('profile');","case 'saved': closePicker(); return typeof window.mmOpenSavedLessons==='function'?window.mmOpenSavedLessons():switchView('profile');",p)
write(p,text)

# Final lesson completion button names the actual next lesson while keeping one clear ending.
p='lesson-simple-experience.js'; text=read(p)
text=replace_once(text,'/* MouldMaster simple lesson experience — 2026.09.07.3 */','/* MouldMaster simple lesson experience — 2026.09.07.4 */',p)
text=replace_once(text,"const VERSION='2026.09.07.3';","const VERSION='2026.09.07.4';",p)
anchor="""  actions.classList.add('mm-simple-completion');\n  const meta=article.querySelector('.mm-simple-lesson-hero .mm-simple-lesson-meta');\n"""
insert="""  actions.classList.add('mm-simple-completion');\n  const primary=actions.querySelector(':scope > .primary');\n  const ctx=coreContext();\n  if(primary&&ctx){\n    const globalIndex=D.lessons.findIndex(item=>item.id===ctx.lesson.id);\n    const next=D.lessons[globalIndex+1]||null;\n    if(next){\n      const shortTitle=String(next.title||'Next lesson');\n      const visible=shortTitle.length>42?shortTitle.slice(0,39)+'…':shortTitle;\n      const nextText=`Next: ${visible} →`;\n      if(primary.textContent!==nextText)primary.textContent=nextText;\n      primary.setAttribute('aria-label',`Finished reading. Continue to ${shortTitle}`);\n    }else{\n      if(primary.textContent!=='Finish learning path ✓')primary.textContent='Finish learning path ✓';\n      primary.setAttribute('aria-label','Finished reading. Complete the learning path');\n    }\n  }\n  const meta=article.querySelector('.mm-simple-lesson-hero .mm-simple-lesson-meta');\n"""
text=replace_once(text,anchor,insert,p)
write(p,text)

# Assessment recommendation: post-grade only, no answer/scoring changes.
p='assessment-ux.js'; text=read(p)
text=replace_once(text,'/* MouldMaster assessment experience — question-only focus mode 2026-09-06.9 */','/* MouldMaster assessment experience — question-only focus mode 2026-09-07.1 */',p)
text=replace_once(text,"const VERSION='2026.09.06.9';","const VERSION='2026.09.07.1';",p)
css='  .mm-exam-reviewed .answer-row.incorrect{background:#2a171d;border-color:#74424d}\n'
extra='  .mm-assessment-next{margin-top:14px;padding:14px 15px;border:1px solid #34516e;border-radius:13px;background:#10243a}.mm-assessment-next strong{display:block;margin:3px 0 5px}.mm-assessment-next p{margin:0 0 10px;color:#b9cade;line-height:1.45}.mm-assessment-next button{min-height:44px}\n'
text=replace_once(text,css,css+extra,p)
function_anchor='function decorateReview(){\n'
recommend=r'''function assessmentNextTarget(modal,passed){
  try{
    const completed=Array.isArray(user?.completed)?user.completed:[];
    const title=(modal?.querySelector('[id^="mmDialogTitle"],h2')?.textContent||'').toLowerCase();
    const level=['beginner','intermediate','advanced'].find(value=>title.includes(value));
    const courses=(D?.courses||[]).filter(course=>!level||String(course.level||'').toLowerCase().includes(level));
    let id=null;
    for(const course of courses){id=(course.lessonIds||[]).find(candidate=>!completed.includes(candidate));if(id)break}
    if(!id)id=(D?.lessons||[]).find(item=>!completed.includes(item.id))?.id||user?.currentLesson;
    const lesson=(D?.lessons||[]).find(item=>item.id===id);if(!lesson)return null;
    return {lesson,passed};
  }catch(_){return null}
}
window.mmAssessmentOpenNext=function(id){
  const lesson=(D?.lessons||[]).find(item=>item.id===Number(id));if(!lesson)return;
  user.currentLesson=lesson.id;persist();if(typeof closeModal==='function')closeModal();if(typeof switchView==='function')switchView('lesson');
};

'''
text=replace_once(text,function_anchor,recommend+function_anchor,p)
anchor="""  result.replaceChildren(summary);result.setAttribute('role','status');result.tabIndex=-1;\n"""
replacement="""  const nextTarget=assessmentNextTarget(modal,passed);\n  if(nextTarget){\n    const next=document.createElement('section');next.className='mm-assessment-next';next.setAttribute('aria-label','Recommended next step');\n    const label=document.createElement('span');label.className='eyebrow';label.textContent='What next';\n    const heading=document.createElement('strong');heading.textContent=nextTarget.lesson.title;\n    const copy=document.createElement('p');copy.textContent=passed?'Keep the momentum: continue with the next incomplete lesson.':'Review this lesson, then retry with the rationale fresh in mind.';\n    const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Open recommended lesson →';button.setAttribute('data-mm-onclick',`mmAssessmentOpenNext(${nextTarget.lesson.id})`);\n    next.append(label,heading,copy,button);summary.appendChild(next);\n  }\n  result.replaceChildren(summary);result.setAttribute('role','status');result.tabIndex=-1;\n"""
text=replace_once(text,anchor,replacement,p)
write(p,text)

# Align QA contracts that explicitly pin these component versions.
for q in (ROOT/'qa').glob('*.js'):
    text=q.read_text(encoding='utf-8'); orig=text
    if 'MM_ASSESSMENT_UX' in text: text=text.replace('2026.09.06.9','2026.09.07.1')
    if 'MM_SIMPLE_LESSON_EXPERIENCE' in text: text=text.replace('2026.09.07.3','2026.09.07.4')
    if text!=orig:q.write_text(text,encoding='utf-8')

# Add focused learner-flow QA.
flow_spec=r'''const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
async function openApp(page){
  await page.addInitScript(()=>{
    const user={id:'flow-qa',name:'Flow QA',role:'learner',completed:[1,2,3],bookmarks:[2,7],notes:{},examScores:{},certificates:[],currentLesson:4,lastSeen:'2026-09-06T12:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
    localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'flow-qa',users:{'flow-qa':user}}));
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_LEARNING_EXPERIENCE?.version==='2026.09.07.1');
  await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));
}
test('Home resumes canonical currentLesson and Saved lessons uses canonical bookmarks',async({page})=>{
  await page.setViewportSize({width:412,height:915});await openApp(page);
  await expect(page.locator('#dashboard .mm-home-resume-label')).toHaveText('Resume');
  const expected=await page.evaluate(()=>currentLesson().title);
  await expect(page.locator('#dashboard .mm-today-focus h2')).toHaveText(expected);
  await page.getByRole('button',{name:/Saved lessons/i}).click();
  await expect(page.getByRole('heading',{name:'Saved lessons'})).toBeVisible();
  await expect(page.locator('#modal [data-mm-saved-lesson]')).toHaveCount(2);
  await page.locator('#modal [data-mm-saved-lesson="7"]').click();
  await expect(page.locator('#lesson')).toBeVisible();
  expect(await page.evaluate(()=>user.currentLesson)).toBe(7);
});
test('ranked offline search prefers an exact lesson title over body-only matches',async({page})=>{
  await openApp(page);
  const title=await page.evaluate(()=>D.lessons[6].title);
  const rows=await page.evaluate(q=>window.mmRankedSearch(q).slice(0,3).map(x=>({type:x.type,name:x.name,score:x.score})),title);
  expect(rows[0].type).toBe('Lesson');expect(rows[0].name).toBe(title);expect(rows[0].score).toBeGreaterThan(rows[1]?.score||0);
});
test('lesson has one completion action that names the actual next lesson',async({page})=>{
  await page.setViewportSize({width:412,height:915});await openApp(page);await page.evaluate(()=>switchView('lesson'));
  await page.waitForFunction(()=>window.MM_SIMPLE_LESSON_EXPERIENCE?.version==='2026.09.07.4');
  const nextTitle=await page.evaluate(()=>{const i=D.lessons.findIndex(x=>x.id===user.currentLesson);return D.lessons[i+1]?.title||''});
  const button=page.locator('#lesson .lesson-actions-sticky.mm-simple-completion > .primary');
  await expect(button).toHaveCount(1);await expect(button).toContainText('Next:');
  await expect(button).toHaveAttribute('aria-label',new RegExp(nextTitle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('assessment recommendation appears only after grading and points to a real lesson',async({page})=>{
  await openApp(page);await page.evaluate(()=>startExam('Beginner'));
  await page.waitForFunction(()=>window.activeExam?.questions?.length>0&&document.querySelector('#examQuestions'));
  await expect(page.locator('.mm-assessment-next')).toHaveCount(0);
  await page.evaluate(()=>{window.activeExam.questions.forEach((q,i)=>{const input=document.querySelector(`input[name=ex${i}][value="${q.correct}"]`);input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))});gradeExam('Beginner')});
  await expect(page.locator('#examResult .mm-assessment-next')).toBeVisible();
  await expect(page.locator('#examResult .mm-assessment-next button')).toHaveText(/Open recommended lesson/);
});
'''
write('qa/learner-next-flow.spec.js',flow_spec)

# True image baselines: pinned Chromium screenshots become required test snapshots.
visual_spec=r'''const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
async function seed(page){await page.addInitScript(()=>{
  let s=123456789;Math.random=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);Date.now=()=>1788732000000;
  const user={id:'visual-qa',name:'Visual QA',role:'learner',completed:[1,2,3,4,5],bookmarks:[2,7],notes:{6:'Check mould safety and baseline evidence.'},examScores:{},certificates:[],currentLesson:6,lastSeen:'2026-09-06T12:00:00.000Z',onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};
  localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'visual-qa',users:{'visual-qa':user}}));
  localStorage.removeItem('mm_assessment_opening_history_v1');
});}
async function open(page,w,h){await page.setViewportSize({width:w,height:h});await seed(page);await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.MM_APP_SHELL_FINALIZED==='2026.08.26.4'&&window.MM_PRIMARY_HUBS&&window.MM_LEARNING_EXPERIENCE?.version==='2026.09.07.1');await page.waitForFunction(()=>!document.getElementById('mmBootstrap'));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snap(page,name){await expect(page).toHaveScreenshot(name,{animations:'disabled',caret:'hide',fullPage:false,scale:'css',threshold:0.2,maxDiffPixelRatio:0.015});}
test('visual baseline · Home · 360x800',async({page})=>{await open(page,360,800);await snap(page,'home-360x800.png')});
test('visual baseline · Home · 412x915',async({page})=>{await open(page,412,915);await snap(page,'home-412x915.png')});
test('visual baseline · Learn · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'Learn'}).click();await expect(page.locator('#path .mm-learn-hub')).toBeVisible();await snap(page,'learn-412x915.png')});
test('visual baseline · Practice · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'Practice'}).click();await expect(page.locator('#scenarios .mm-practice-hub')).toBeVisible();await snap(page,'practice-412x915.png')});
test('visual baseline · Lesson · 412x915',async({page})=>{await open(page,412,915);await page.evaluate(()=>switchView('lesson'));await page.waitForFunction(()=>window.MM_SIMPLE_LESSON_EXPERIENCE?.version==='2026.09.07.4');await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-412x915.png')});
test('visual baseline · More · 412x915',async({page})=>{await open(page,412,915);await page.locator('.mobile-nav > button').filter({hasText:'More'}).click();await expect(page.locator('#modal .modal-card')).toBeVisible();await snap(page,'more-412x915.png')});
test('visual baseline · Assessment · 412x915',async({page})=>{await open(page,412,915);await page.evaluate(()=>startExam('Beginner'));await expect(page.locator('#examQuestions .mm-current-question')).toBeVisible();await snap(page,'assessment-412x915.png')});
test('visual baseline · Listen expanded · 412x915',async({page})=>{await open(page,412,915);const details=page.locator('.mm-read-aloud details');await details.locator('summary').click();await expect(details).toHaveAttribute('open','');await snap(page,'listen-expanded-412x915.png')});
test('visual baseline · Home · 810x1080',async({page})=>{await open(page,810,1080);await snap(page,'home-810x1080.png')});
test('visual baseline · Lesson · 810x1080',async({page})=>{await open(page,810,1080);await page.evaluate(()=>switchView('lesson'));await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-810x1080.png')});
test('visual baseline · Home · 1440x900',async({page})=>{await open(page,1440,900);await snap(page,'home-1440x900.png')});
test('visual baseline · Lesson · 1440x900',async({page})=>{await open(page,1440,900);await page.evaluate(()=>switchView('lesson'));await expect(page.locator('#lesson .mm-simple-lesson-hero')).toBeVisible();await snap(page,'lesson-1440x900.png')});
'''
write('qa/ui-visual-regression.spec.js',visual_spec)

# Put flow and image baselines in the required Chromium gate.
p='playwright.config.cjs';text=read(p)
old="/inline-style-csp\\.spec\\.js/]"
new="/inline-style-csp\\.spec\\.js/,/learner-next-flow\\.spec\\.js/,/ui-visual-regression\\.spec\\.js/]"
text=replace_once(text,old,new,p);write(p,text)

# Ensure main pushes that touch these owned runtimes also run Mobile Browser QA.
p='.github/workflows/mobile-browser-qa.yml';text=read(p)
anchor="      - 'learning-experience.js'\n"
extra="      - 'lesson-simple-experience.js'\n      - 'assessment-ux.js'\n      - 'primary-learning-practice-hubs.js'\n      - 'qa/learner-next-flow.spec.js'\n      - 'qa/ui-visual-regression.spec.js'\n"
text=replace_once(text,anchor,anchor+extra,p);write(p,text)

print('Learner .24 migration staged successfully.')
