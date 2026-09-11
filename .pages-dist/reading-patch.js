/* MouldMaster lesson-reading enhancement — 2026.09.07.5 */
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
      guide.innerHTML='<span>START HERE</span><div><strong>Read boxes 1, 2 and 3 in order.</strong><p>Then complete yellow box 4. Open <b>Extra help</b> only if you want examples or a simpler explanation.</p></div>';
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
  function loadReadAloud(){
    if(window.MMReadAloud||document.querySelector('script[data-mm-read-aloud-runtime]'))return;
    const script=document.createElement('script');
    script.src='./read-aloud.js';
    script.dataset.mmReadAloudRuntime='1';
    script.async=false;
    document.head.appendChild(script);
  }
  function settleViewTop(){
    const main=document.querySelector('main.main')||document.querySelector('.main');
    if(main)main.scrollTop=0;
    if(document.body)document.body.scrollTop=0;
    const scrolling=document.scrollingElement;if(scrolling)scrolling.scrollTop=0;
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
  }
  function installStableViewEntry(){
    const current=window.switchView;
    /* Runtime V2 owns the canonical switchView dispatcher once it is present.
       Do not wrap that dispatcher from a MutationObserver callback: rebinding a
       Runtime-owned global recreates wrapper chains and can turn shell adoption
       into recursive switchView/scrollTo calls. The pre-Runtime wrapper, when
       installed during initial parsing, is already retained as the captured
       legacy implementation inside Runtime V2. */
    if(typeof current!=='function'||current.__mmStableViewEntry||current.__mmRuntimeV2)return false;
    const wrapped=function(){
      const active=document.activeElement;
      if(active&&typeof active.blur==='function')active.blur();
      const root=document.documentElement;
      const previousAnchor=root.style.overflowAnchor;
      const nativeScrollTo=window.scrollTo;
      root.style.overflowAnchor='none';
      settleViewTop();
      window.scrollTo=function(leftOrOptions,top){
        if(leftOrOptions&&typeof leftOrOptions==='object')return nativeScrollTo.call(window,{...leftOrOptions,behavior:'auto'});
        return nativeScrollTo.call(window,leftOrOptions,top);
      };
      let result;
      try{result=current.apply(this,arguments)}finally{window.scrollTo=nativeScrollTo}
      settleViewTop();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{settleViewTop();root.style.overflowAnchor=previousAnchor}));
      return result;
    };
    wrapped.__mmStableViewEntry=true;
    wrapped.__mmStableViewEntryBase=current;
    window.switchView=wrapped;
    window.__MM_STABLE_VIEW_ENTRY__='2026.09.07.5';
    return true;
  }
  const run=()=>{enhanceLesson();installStableViewEntry()};
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();loadReadAloud();},{once:true});else{run();loadReadAloud();}
})();
