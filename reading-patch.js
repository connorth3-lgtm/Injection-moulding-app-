/* MouldMaster reading/question enhancement — 2026.08.23.3 */
(function(){
  'use strict';
  function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function refHTML(items){return `<div class="question-ref-list">${items.map(x=>`<a class="question-ref-link" target="_blank" rel="noopener" href="${x[2]}"><span><b>${esc(x[0])}</b><small>${esc(x[1])}</small></span><span>Open ↗</span></a>`).join('')}</div>`;}

  function questionBank(){
    const D=window.MM_DATA;if(!D)return new Map();
    const map=new Map(),add=q=>{if(Array.isArray(q)&&q.length>=5)map.set(norm(q[0]),q);};
    Object.values(D.exams||{}).forEach(arr=>(arr||[]).forEach(add));
    Object.values(D.regionalQuestions||{}).forEach(reg=>Object.values(reg||{}).forEach(arr=>(arr||[]).forEach(add)));
    return map;
  }

  function stemFromQuestion(el){
    const clone=el.cloneNode(true);
    clone.querySelectorAll('.option,input,label,button,.question-reference,.feedback,.explanation').forEach(x=>x.remove());
    return clone.textContent.replace(/^\s*\d+[.)]\s*/,'').replace(/\s+/g,' ').trim();
  }

  function enhanceQuestions(){
    const bank=questionBank();
    document.querySelectorAll('.question').forEach(el=>{
      if(el.dataset.refsEnhanced)return;
      const stem=stemFromQuestion(el);if(!stem||stem.length<12)return;
      let q=bank.get(norm(stem));
      if(!q)for(const [k,v] of bank){if(norm(stem).includes(k)||k.includes(norm(stem))){q=v;break;}}
      const usable=q&&q[4]&&q[5]?[[q[4],'Primary reference named in this question\'s rationale.',q[5]]]:[];
      el.dataset.refsEnhanced='1';
      if(!usable.length)return;
      const box=document.createElement('section');
      box.className='question-reference';
      box.innerHTML=`<span class="eyebrow">Reference for this question</span><h4>Check the cited source</h4><p>This is the exact source attached to the audited assessment item. It does not reveal which option is correct.</p>${refHTML(usable)}`;
      el.appendChild(box);
    });
  }

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

  function run(){enhanceLesson();enhanceQuestions();}
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
