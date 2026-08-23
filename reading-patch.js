/* MouldMaster lesson-reading enhancement — 2026.08.23.5 */
(function(){
  'use strict';
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function marker(el,step,label,primary){
    if(!el)return;
    el.classList.add('lesson-read-block');
    if(primary)el.classList.add('lesson-read-primary');
    if(el.querySelector(':scope > .mm-read-marker'))return;
    const m=document.createElement('div');
    m.className='mm-read-marker';
    m.innerHTML=`<b>${step}</b><span>${label}</span>`;
    el.prepend(m);
  }
  function enhanceLesson(){
    const article=document.querySelector('#lesson article.lesson-body');
    if(!article)return;
    if(!article.querySelector(':scope > .mm-reading-guide')){
      const guide=document.createElement('div');
      guide.className='mm-reading-guide';
      guide.setAttribute('role','note');
      guide.innerHTML='<span>START HERE</span><div><strong>Read boxes 1, 2 and 3 in order.</strong><p>Then do the yellow box marked 4. The smaller example boxes underneath are extra help.</p></div>';
      const progress=article.querySelector(':scope > .mm-lesson-progress');
      progress?progress.after(guide):article.prepend(guide);
    }
    const blocks=[...article.children].filter(x=>x.classList?.contains('content-block'));
    const findBlock=(pattern)=>blocks.find(x=>pattern.test(norm(x.querySelector('h3')?.textContent)));
    const intro=findBlock(/^why this matters$/)||blocks[0];
    const objectives=findBlock(/^by the end of this lesson|^learning objectives/);
    const points=findBlock(/^key points$|^key engineering points|^what to remember/);
    const exercise=[...article.children].find(x=>x.classList?.contains('callout'));
    marker(intro,'1','READ THIS FIRST',true);
    marker(objectives,'2','READ NEXT');
    marker(points,'3','MAIN POINTS');
    marker(exercise,'4','DO THIS AFTER READING');
    exercise?.classList.add('lesson-read-task');
    const teaching=article.querySelector('#mmTeaching');
    if(teaching&&!teaching.parentElement?.classList.contains('mm-extra-help')){
      const details=document.createElement('details');
      details.className='mm-extra-help';
      details.innerHTML='<summary><span>Extra help</span><b>Show examples and explanations</b></summary>';
      teaching.before(details);
      details.appendChild(teaching);
    }
    const next=article.querySelector('.lesson-actions-sticky .primary');
    if(next&&/^complete\s*&\s*continue/i.test(next.textContent||''))next.textContent='Finished reading — next lesson →';
    article.dataset.readEnhanced='1';
  }
  const run=()=>enhanceLesson();
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
