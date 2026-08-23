/* MouldMaster reading/question enhancement — 2026.08.23.2 */
(function(){
  const lessonSources=[
    ["ISO 20430:2020","Injection moulding machine safety requirements.","https://www.iso.org/standard/68000.html"],
    ["HSE — Injection moulding machine safety","UK practical safeguarding guidance.","https://www.hse.gov.uk/pubns/plasindx.htm"],
    ["OSHA Injection Molding eTool","US machine guarding and safe-access guidance.","https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines"],
    ["WorkSafe NZ — Injection and blow moulding","New Zealand machinery safety guidance for moulding presses.","https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/injection-blow-moulding/"],
    ["NIST — Engineering Statistics Handbook","Process capability, DOE, measurement and statistical engineering reference.","https://www.itl.nist.gov/div898/handbook/"],
    ["Autodesk Moldflow — Cooling stage","Reference on heat removal and cooling-stage behaviour.","https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html"],
    ["ISO 1133-1:2022","MFR/MVR testing and limits of correlation to processing behaviour.","https://www.iso.org/standard/83905.html"],
    ["Trotta et al. (2021), Polymer Testing","Injection-moulding rheology and shear-thinning behaviour.","https://doi.org/10.1016/j.polymertesting.2021.107068"],
    ["Zhao et al. (2022), Int. J. Advanced Manufacturing Technology","Review of warpage/shrinkage mechanisms and process-parameter effects.","https://consensus.app/papers/recent-progress-in-minimizing-the-warpage-and-shrinkage-zhao-lian/87423bb5d6e15bcba62bfe49843785c7/?utm_source=chatgpt"]
  ];

  const fallbacks={
    stats:[
      ["NIST — Process capability","Cp/Cpk interpretation, assumptions and process stability.","https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm"],
      ["NIST — Design of experiments","Main effects, interactions and experimental design principles.","https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm"],
      ["NIST — Confirmation runs","Why selected experimental conditions should be confirmed.","https://www.itl.nist.gov/div898/handbook/pri/section4/pri46.htm"]
    ],
    material:[
      ["ISO 1133-1:2022","MFR/MVR test method and limitations for processing correlation.","https://www.iso.org/standard/83905.html"],
      ["Trotta et al. (2021), Polymer Testing","High-shear injection-moulding rheology and shear thinning.","https://doi.org/10.1016/j.polymertesting.2021.107068"],
      ["Zhao et al. (2022) review","Warpage/shrinkage mechanisms and effects of moulding parameters.","https://consensus.app/papers/recent-progress-in-minimizing-the-warpage-and-shrinkage-zhao-lian/87423bb5d6e15bcba62bfe49843785c7/?utm_source=chatgpt"]
    ],
    cooling:[
      ["Autodesk Moldflow — Cooling stage","Cooling removes heat until the part reaches an acceptable ejection condition.","https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html"],
      ["Zhao et al. (2022) review","Review of cooling, holding, temperature, shrinkage and warpage relationships.","https://consensus.app/papers/recent-progress-in-minimizing-the-warpage-and-shrinkage-zhao-lian/87423bb5d6e15bcba62bfe49843785c7/?utm_source=chatgpt"]
    ],
    packing:[
      ["Autodesk Moldflow — Packing guidance","Packing, hold-time and gate-freeze behaviour.","https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html"],
      ["Zhao et al. (2022) review","Holding pressure/time effects on shrinkage and warpage.","https://consensus.app/papers/recent-progress-in-minimizing-the-warpage-and-shrinkage-zhao-lian/87423bb5d6e15bcba62bfe49843785c7/?utm_source=chatgpt"]
    ],
    safety:[
      ["ISO 20430:2020","International injection moulding machine safety requirements.","https://www.iso.org/standard/68000.html"],
      ["HSE — Injection moulding safety","UK practical safety guidance.","https://www.hse.gov.uk/pubns/plasindx.htm"],
      ["OSHA Injection Molding eTool","US injection-moulding machinery safety guidance.","https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines"],
      ["WorkSafe NZ — Injection and blow moulding","New Zealand moulding-machinery guidance.","https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/injection-blow-moulding/"]
    ],
    process:[
      ["ISO 20430:2020","Machine safety requirements relevant to process work.","https://www.iso.org/standard/68000.html"],
      ["Trotta et al. (2021), Polymer Testing","Rheology evidence for flow-rate/viscosity reasoning.","https://doi.org/10.1016/j.polymertesting.2021.107068"],
      ["Autodesk Moldflow — Cooling stage","Cooling-stage process reference.","https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html"]
    ]
  };

  function esc(s){return String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));}
  function norm(s){return String(s||"").replace(/\s+/g," ").trim().toLowerCase();}
  function refHTML(items){return `<div class="question-ref-list">${items.map(x=>`<a class="question-ref-link" target="_blank" rel="noopener" href="${x[2]}"><span><b>${esc(x[0])}</b><small>${esc(x[1])}</small></span><span>Open ↗</span></a>`).join("")}</div>`;}

  function questionBank(){
    const D=window.MM_DATA;if(!D)return new Map();
    const map=new Map();
    const add=q=>{if(Array.isArray(q)&&q.length>=5)map.set(norm(q[0]),q);};
    Object.values(D.exams||{}).forEach(arr=>(arr||[]).forEach(add));
    Object.values(D.regionalQuestions||{}).forEach(reg=>Object.values(reg||{}).forEach(arr=>(arr||[]).forEach(add)));
    return map;
  }

  function fallbackFor(stem){
    const s=norm(stem);
    if(/cp|cpk|ppk|capability|doe|experiment|random|confirmation|factor|interaction/.test(s))return fallbacks.stats;
    if(/material|resin|moisture|dry|viscos|melt temperature|residence|degrad|polymer/.test(s))return fallbacks.material;
    if(/cool|warpage|shrink|ejection/.test(s))return fallbacks.cooling;
    if(/pack|hold|gate seal|gate freeze|cushion/.test(s))return fallbacks.packing;
    if(/guard|interlock|lockout|hazard|safety|robot|puwer|osha|worksafe|hswa|iso 20430/.test(s))return fallbacks.safety;
    return fallbacks.process;
  }

  function stemFromQuestion(el){
    const clone=el.cloneNode(true);
    clone.querySelectorAll('.option,input,label,button,.question-reference,.feedback,.explanation').forEach(x=>x.remove());
    return clone.textContent.replace(/^\s*\d+[.)]\s*/,"").replace(/\s+/g," ").trim();
  }

  function enhanceQuestions(){
    const bank=questionBank();
    document.querySelectorAll('.question').forEach(el=>{
      if(el.dataset.refsEnhanced)return;
      const stem=stemFromQuestion(el);
      if(!stem||stem.length<12)return;
      let q=bank.get(norm(stem));
      if(!q){
        for(const [k,v] of bank){if(norm(stem).includes(k)||k.includes(norm(stem))){q=v;break;}}
      }
      const items=[];
      if(q&&q[4])items.push([q[4],"Primary reference named in this question's rationale.",q[5]||""]);
      let usable=items.filter(x=>x[2]);
      const fallback=fallbackFor(stem);
      for(const x of fallback){if(usable.length>=3)break;if(!usable.some(y=>y[2]===x[2]))usable.push(x);}
      const box=document.createElement('section');
      box.className='question-reference';
      box.innerHTML=`<span class="eyebrow">References for this question</span><h4>Check the source behind the concept</h4><p>These references support the engineering or safety principle being tested. They do not reveal which option is correct; use the wording and evidence in the question.</p>${refHTML(usable.slice(0,3))}`;
      el.appendChild(box);
      el.dataset.refsEnhanced='1';
    });
  }

  function enhanceLesson(){
    const article=document.querySelector('#lesson article.lesson-body');
    if(!article||article.dataset.readEnhanced)return;
    const hs=[...article.querySelectorAll('h3')];
    const wrap=(heading,cls,label,title)=>{
      const h=hs.find(x=>norm(x.textContent)===norm(heading));if(!h)return;
      const nodes=[];let n=h.nextSibling;while(n&&!(n.nodeType===1&&n.tagName==='H3')){const next=n.nextSibling;nodes.push(n);n=next;}
      const sec=document.createElement('section');sec.className=`lesson-read-block ${cls}`;sec.innerHTML=`<span class="eyebrow">${label}</span><h3>${title}</h3>`;nodes.forEach(x=>sec.appendChild(x));h.replaceWith(sec);
    };
    const firstP=[...article.children].find(x=>x.tagName==='P');if(firstP){const d=document.createElement('div');d.className='lesson-read-block lesson-intro';d.innerHTML='<span class="eyebrow">Introduction</span>';firstP.replaceWith(d);d.appendChild(firstP);}
    wrap('Learning objectives','lesson-objectives','Learning objectives','By the end of this lesson');
    wrap('Key engineering points','lesson-points','Key engineering points','What to remember');
    wrap('Shop-floor exercise','lesson-exercise','Shop-floor exercise','Apply the idea');
    if(!article.querySelector('.lesson-source-box')){
      const box=document.createElement('section');box.className='lesson-source-box';box.innerHTML=`<span class="eyebrow">Sources & further reading</span><h3>Check the evidence behind this lesson</h3><div class="lesson-source-list">${lessonSources.slice(0,6).map(x=>`<a class="lesson-source-link" target="_blank" rel="noopener" href="${x[2]}"><span><b>${esc(x[0])}</b><small>${esc(x[1])}</small></span><span>Open ↗</span></a>`).join('')}</div>`;article.appendChild(box);
    }
    article.dataset.readEnhanced='1';
  }

  function run(){enhanceLesson();enhanceQuestions();}
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
