/* MouldMaster reading/source enhancement — 2026.08.23 */
(function(){
  const sources=[
    ["ISO 20430:2020","Injection moulding machine safety requirements.","https://www.iso.org/standard/68000.html"],
    ["HSE — Injection moulding machine safety","UK practical safeguarding guidance.","https://www.hse.gov.uk/pubns/plasindx.htm"],
    ["OSHA Injection Molding eTool","US machine guarding and safe-access guidance.","https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines"],
    ["WorkSafe NZ — Injection and blow moulding","New Zealand machinery safety guidance for moulding presses.","https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/injection-blow-moulding/"],
    ["NIST — Engineering Statistics Handbook","Process capability, DOE, measurement and statistical engineering reference.","https://www.itl.nist.gov/div898/handbook/"],
    ["Autodesk Moldflow — Cooling stage","Reference on heat removal and cooling-stage behaviour.","https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html"],
    ["ISO 1133-1:2022","MFR/MVR testing and limits of correlation to processing behaviour.","https://www.iso.org/standard/83905.html"],
    ["Trotta et al. (2021), Polymer Testing","Injection-moulding rheology and shear-thinning behaviour.","https://doi.org/10.1016/j.polymertesting.2021.107068"]
  ];

  function esc(s){return String(s).replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));}

  function wrapSection(article, headingText, cls, eyebrow, title){
    const headings=[...article.querySelectorAll(':scope > h3')];
    const h=headings.find(x=>x.textContent.trim()===headingText);
    if(!h || h.closest('.lesson-read-block')) return;
    const box=document.createElement('section'); box.className='lesson-read-block '+cls;
    const eb=document.createElement('span'); eb.className='eyebrow'; eb.textContent=eyebrow;
    const nh=document.createElement('h3'); nh.textContent=title;
    box.append(eb,nh);
    let n=h.nextSibling; h.remove();
    while(n && !(n.nodeType===1 && n.tagName==='H3')){const next=n.nextSibling; box.appendChild(n); n=next;}
    article.insertBefore(box,n||null);
  }

  function enhance(){
    const article=document.querySelector('#lesson article.lesson-body');
    if(!article || article.dataset.readingEnhanced==='1') return;
    article.dataset.readingEnhanced='1';

    const title=article.querySelector(':scope > h2');
    if(title){
      let n=title.nextSibling;
      while(n && n.nodeType!==1) n=n.nextSibling;
      if(n && n.tagName==='P'){
        const box=document.createElement('div'); box.className='lesson-read-block lesson-intro';
        box.innerHTML='<span class="eyebrow">Introduction</span>';
        n.parentNode.insertBefore(box,n); box.appendChild(n);
      }
    }

    wrapSection(article,'Learning objectives','lesson-objectives','Learning objectives','By the end of this lesson');
    wrapSection(article,'Key engineering points','lesson-points','Key engineering points','What to remember');
    wrapSection(article,'Shop-floor exercise','lesson-exercise','Shop-floor exercise','Apply the idea');

    if(!article.querySelector('.lesson-source-box')){
      const box=document.createElement('section'); box.className='lesson-source-box';
      box.innerHTML='<span class="eyebrow">Sources & further reading</span><h3>Check the evidence behind this lesson</h3><p>These references support the engineering and safety principles used throughout MouldMaster. For production limits and legal duties, use the current source for the actual resin, machine, site and jurisdiction.</p><div class="lesson-source-list">'+sources.map(x=>'<a class="lesson-source-link" href="'+x[2]+'" target="_blank" rel="noopener"><span><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></span><span>Open ↗</span></a>').join('')+'</div><p class="lesson-source-note">These links support learning and verification; they do not replace approved site procedures, current supplier TDS/SDS, machine documentation or applicable law.</p>';
      const notes=[...article.querySelectorAll(':scope > h3')].find(x=>x.textContent.trim()==='Your lesson notes');
      article.insertBefore(box,notes||null);
    }
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(enhance));
  obs.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('load',enhance);
  setTimeout(enhance,250);
})();
