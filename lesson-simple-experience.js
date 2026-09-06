/* MouldMaster simple lesson experience — 2026.09.06.1 */
(function(){
'use strict';
if(window.MM_SIMPLE_LESSON_EXPERIENCE)return;

const VERSION='2026.09.06.1';
const style=document.createElement('style');
style.id='mm-simple-lesson-style';
style.textContent=`
#lesson.mm-simple-lesson{max-width:1120px;margin:0 auto}
#lesson.mm-simple-lesson .lesson-breadcrumb,#lesson.mm-simple-lesson .lesson-header-card,#lesson.mm-simple-lesson .mm-learning-progress,#lesson.mm-simple-lesson .mm-learning-jumps{display:none!important}
#lesson.mm-simple-lesson .lesson-layout{grid-template-columns:minmax(0,1fr) 260px;gap:18px;align-items:start}
#lesson.mm-simple-lesson .lesson-body{padding:0;background:transparent;border:0;box-shadow:none}
#lesson.mm-simple-lesson .lesson-body>.eyebrow,#lesson.mm-simple-lesson .lesson-body>h2{display:none!important}
.mm-simple-lesson-hero{padding:25px 27px;margin:0 0 18px;border:1px solid #36516f;border-radius:19px;background:linear-gradient(180deg,#13283e,#102338);box-shadow:var(--shadow)}
.mm-simple-lesson-hero .eyebrow{display:block;margin-bottom:8px;font-size:12px;letter-spacing:.13em}
.mm-simple-lesson-hero h1{margin:0;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-.025em}
.mm-simple-lesson-summary{margin:11px 0 0!important;color:#bfd0e4!important;font-size:17px;line-height:1.55!important;max-width:820px}
.mm-simple-lesson-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.mm-simple-lesson-hero .mini-bar{margin:15px 0 0}
.mm-simple-lesson-start{width:100%;margin-top:17px;min-height:50px;font-size:16px}
#lesson.mm-simple-lesson .content-block,#lesson.mm-simple-lesson .mm-simple-section,#lesson.mm-simple-lesson .callout,#lesson.mm-simple-lesson .mm-next-card{padding:20px 21px;margin:0 0 14px;border:1px solid #304a68;border-radius:17px;background:linear-gradient(180deg,#112238,#0e1d31);box-shadow:none}
#lesson.mm-simple-lesson .callout{border-left:1px solid #304a68;color:#d7e5f3}
#lesson.mm-simple-lesson .content-block h3,#lesson.mm-simple-lesson .mm-simple-section h3,#lesson.mm-simple-lesson .mm-next-card h3{margin:0 0 10px;font-size:19px;line-height:1.25}
#lesson.mm-simple-lesson .content-block p,#lesson.mm-simple-lesson .content-block li,#lesson.mm-simple-lesson .mm-simple-section p,#lesson.mm-simple-lesson .mm-simple-section li,#lesson.mm-simple-lesson .callout{font-size:15px;line-height:1.65;color:#c7d6e8}
#lesson.mm-simple-lesson ul{margin:8px 0 0;padding-left:21px}#lesson.mm-simple-lesson li+li{margin-top:7px}
#lesson.mm-simple-lesson .note-area{min-height:120px;background:#0a1728;border-color:#36506d;font-size:15px;line-height:1.5}
#lesson.mm-simple-lesson .hero-buttons{display:flex;gap:9px;flex-wrap:wrap;margin:15px 0}
#lesson.mm-simple-lesson .hero-buttons .primary{min-height:48px;flex:1}
#lesson.mm-simple-lesson .mm-next-card{margin-top:14px}
#lesson.mm-simple-lesson .lesson-side{padding:15px;border-radius:17px;background:linear-gradient(180deg,#112238,#0d1b2d)}
#lesson.mm-simple-lesson .lesson-side h3{font-size:16px}#lesson.mm-simple-lesson .lesson-list{gap:5px;max-height:62vh}
#lesson.mm-simple-lesson .lesson-list button{padding:10px;border-radius:10px;font-size:12px}
.mm-simple-material-lesson{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
.mm-simple-material-hero{padding:24px 25px;margin-bottom:15px;border:1px solid #36516f;border-radius:19px;background:linear-gradient(180deg,#13283e,#102338)}
.mm-simple-material-hero h2{font-size:clamp(27px,4vw,38px)!important;line-height:1.12;margin:7px 0 9px!important}.mm-simple-material-hero p{margin:0;color:#bfd0e4!important;line-height:1.55!important}
.mm-simple-material-lesson>h3,.mm-simple-material-lesson>.mat-evidence,.mm-simple-material-lesson>.mat-trap,.mm-simple-material-lesson>.mat-disclaimer{padding:19px 20px;margin:0;border:1px solid #304a68;background:linear-gradient(180deg,#112238,#0e1d31)}
.mm-simple-material-lesson>h3{margin-top:14px;border-radius:17px 17px 0 0;border-bottom:0;font-size:19px}.mm-simple-material-lesson>h3+ul{margin:0;padding:0 39px 19px;border:1px solid #304a68;border-top:0;border-radius:0 0 17px 17px;background:linear-gradient(180deg,#112238,#0e1d31)}
.mm-simple-material-lesson>.mat-evidence,.mm-simple-material-lesson>.mat-trap,.mm-simple-material-lesson>.mat-disclaimer{margin-top:14px;border-radius:17px;line-height:1.6}
.mm-simple-material-lesson .lesson-actions-sticky{border-radius:15px}
#mmSpecialistBody.mm-simple-specialist-lesson{font-size:15px;line-height:1.65}#mmSpecialistBody.mm-simple-specialist-lesson>section,#mmSpecialistBody.mm-simple-specialist-lesson>.card{border-radius:17px!important}
@media(max-width:900px){#lesson.mm-simple-lesson .lesson-layout{grid-template-columns:1fr}#lesson.mm-simple-lesson .lesson-side{display:none!important}}
@media(max-width:760px){
 #lesson.mm-simple-lesson{padding-bottom:78px}
 .mm-simple-lesson-hero{padding:21px 20px;margin-bottom:14px;border-radius:18px}.mm-simple-lesson-hero h1{font-size:31px}.mm-simple-lesson-summary{font-size:16px}
 #lesson.mm-simple-lesson .content-block,#lesson.mm-simple-lesson .mm-simple-section,#lesson.mm-simple-lesson .callout,#lesson.mm-simple-lesson .mm-next-card{padding:18px 19px;margin-bottom:12px;border-radius:16px}
 #lesson.mm-simple-lesson .mm-mobile-actions{grid-template-columns:auto minmax(0,1fr)}
 .mm-simple-material-hero{padding:21px 20px;border-radius:18px}.mm-simple-material-lesson>h3,.mm-simple-material-lesson>.mat-evidence,.mm-simple-material-lesson>.mat-trap,.mm-simple-material-lesson>.mat-disclaimer{padding-left:18px;padding-right:18px}
}
`;
document.head.appendChild(style);

function coreContext(){
  try{
    if(typeof currentLesson!=='function'||typeof D==='undefined')return null;
    const lesson=currentLesson();
    const course=D.courses.find(x=>x.id===lesson.course);
    if(!lesson||!course)return null;
    const position=Math.max(0,course.lessonIds.indexOf(lesson.id));
    const completed=typeof user!=='undefined'&&Array.isArray(user.completed)?course.lessonIds.filter(id=>user.completed.includes(id)).length:0;
    const pct=Math.round(completed/course.lessonIds.length*100);
    return {lesson,course,position,completed,pct};
  }catch(_){return null}
}
function safe(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function relabel(head){
  const text=(head.textContent||'').trim();
  if(/^Learning objectives$/i.test(text)||/^By the end of this lesson/i.test(text))head.textContent='What you’ll be able to do';
  else if(/^Key engineering points$/i.test(text)||/^Key points$/i.test(text))head.textContent='What you need to know';
  else if(/^Shop-floor exercise$/i.test(text))head.textContent='Try it';
  else if(/^Your lesson notes$/i.test(text))head.textContent='Your notes';
}
function wrapLooseSections(article){
  const headings=Array.from(article.children).filter(el=>el.tagName==='H3');
  for(const heading of headings){
    if(heading.parentElement!==article)continue;
    const section=document.createElement('section');
    section.className='content-block mm-simple-section';
    const nextStart=heading.nextElementSibling;
    article.insertBefore(section,heading);
    section.appendChild(heading);
    let node=nextStart;
    while(node&&node.parentElement===article&&node.tagName!=='H3'&&!node.matches('.hero-buttons,.mm-next-card,.mm-learning-progress,.mm-learning-jumps')){
      const next=node.nextElementSibling;
      section.appendChild(node);
      node=next;
    }
  }
}
function simplifyCoreLesson(){
  const root=document.getElementById('lesson');
  const article=root?.querySelector('.lesson-body');
  if(!root||!article)return;
  const context=coreContext();
  root.classList.add('mm-simple-lesson');
  root.querySelector('.lesson-breadcrumb')?.remove();
  root.querySelector('.lesson-header-card')?.remove();
  article.querySelectorAll(':scope > .mm-learning-progress,:scope > .mm-learning-jumps,:scope > .mm-simple-lesson-hero').forEach(el=>el.remove());

  const directEyebrow=Array.from(article.children).find(el=>el.classList?.contains('eyebrow'));
  const directTitle=Array.from(article.children).find(el=>el.tagName==='H2');
  if(directEyebrow)directEyebrow.style.display='none';
  if(directTitle)directTitle.style.display='none';

  article.querySelectorAll('h3').forEach(relabel);
  wrapLooseSections(article);

  if(context){
    const {lesson,course,position,pct}=context;
    const hero=document.createElement('section');
    hero.className='mm-simple-lesson-hero';
    hero.setAttribute('aria-label','Lesson overview');
    hero.innerHTML=`<span class="eyebrow">Track ${course.id} · Lesson ${position+1}/${course.lessonIds.length}</span><h1>${safe(lesson.title)}</h1><p class="mm-simple-lesson-summary">${safe(lesson.summary||lesson.intro||'')}</p><div class="mm-simple-lesson-meta"><span class="pill">${lesson.duration} min lesson</span><span class="pill">${safe(course.name)}</span><span class="pill">${pct}% track</span></div><div class="mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></div><button class="primary mm-simple-lesson-start" type="button">Start lesson ↓</button>`;
    article.insertBefore(hero,article.firstChild);
    hero.querySelector('.mm-simple-lesson-start')?.addEventListener('click',()=>{
      const target=article.querySelector('.content-block,.mm-simple-section,.callout');
      target?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
}
function simplifyMaterialLesson(){
  for(const article of document.querySelectorAll('.mat-lesson')){
    article.classList.add('mm-simple-material-lesson');
    if(article.querySelector(':scope > .mm-simple-material-hero'))continue;
    const eyebrow=Array.from(article.children).find(el=>el.classList?.contains('eyebrow'));
    const title=Array.from(article.children).find(el=>el.tagName==='H2');
    const intro=title?.nextElementSibling?.tagName==='P'?title.nextElementSibling:null;
    if(!title)return;
    const hero=document.createElement('section');hero.className='mm-simple-material-hero';
    article.insertBefore(hero,article.firstChild);
    if(eyebrow)hero.appendChild(eyebrow);hero.appendChild(title);if(intro)hero.appendChild(intro);
  }
}
function simplifySpecialistLesson(){
  const body=document.getElementById('mmSpecialistBody');
  if(body)body.classList.add('mm-simple-specialist-lesson');
}
function apply(){simplifyCoreLesson();simplifyMaterialLesson();simplifySpecialistLesson()}

window.MM_APP_SHELL?.events?.onRender?.('lesson',()=>requestAnimationFrame(simplifyCoreLesson));
const observer=new MutationObserver(()=>queueMicrotask(apply));
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
apply();
window.MM_SIMPLE_LESSON_EXPERIENCE={version:VERSION,apply,simplifyCoreLesson,simplifyMaterialLesson,observer};
})();
