/* MouldMaster lesson-reading enhancement — 2026.08.23.3 */
(function(){
  'use strict';
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function enhanceLesson(){
    const article=document.querySelector('#lesson article.lesson-body');
    if(!article||article.dataset.readEnhanced)return;
    const hs=[...article.querySelectorAll('h3')];
    const wrap=(heading,cls,label,title)=>{
      const h=hs.find(x=>norm(x.textContent)===norm(heading));if(!h)return;
      const nodes=[];let n=h.nextSibling;
      while(n&&!(n.nodeType===1&&n.tagName==='H3')){const next=n.nextSibling;nodes.push(n);n=next;}
      const sec=document.createElement('section');sec.className=`lesson-read-block ${cls}`;sec.innerHTML=`<span class="eyebrow">${label}</span><h3>${title}</h3>`;
      nodes.forEach(x=>sec.appendChild(x));h.replaceWith(sec);
    };
    const firstP=[...article.children].find(x=>x.tagName==='P');
    if(firstP){const d=document.createElement('div');d.className='lesson-read-block lesson-intro';d.innerHTML='<span class="eyebrow">Introduction</span>';firstP.replaceWith(d);d.appendChild(firstP);}
    wrap('Learning objectives','lesson-objectives','Learning objectives','By the end of this lesson');
    wrap('Key engineering points','lesson-points','Key engineering points','What to remember');
    wrap('Shop-floor exercise','lesson-exercise','Shop-floor exercise','Apply the idea');
    article.dataset.readEnhanced='1';
  }
  const run=()=>enhanceLesson();
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
