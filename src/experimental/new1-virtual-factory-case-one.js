/* New1 Virtual Factory Case One — development-only bridge; not a deployed learner runtime. */
(function(root,make){
  'use strict';
  const api=make();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else if(root)root.MM_NEW1_VIRTUAL_FACTORY=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const VERSION='new1-case-one-proposal-2026.10.09';
  const CASE_ID='VA-02';
  const VA_PROGRESS_KEY='mm_virtual_apprenticeship_v1';
  const FLOW=Object.freeze([
    {id:'brief',label:'Factory brief'},
    {id:'baseline',label:'Known-good evidence'},
    {id:'evidence',label:'Compare four cavities'},
    {id:'hypothesis',label:'Rank competing mechanisms'},
    {id:'test',label:'Choose discriminating evidence'},
    {id:'intervention',label:'Plan one authorised response'},
    {id:'verification',label:'Verify every cavity'},
    {id:'reflection',label:'Reflect and target practice'}
  ]);
  const BOOK=Object.freeze([
    {id:'multi-cavity',label:'Multi-cavity balance',purpose:'Preserve cavity identity before using a mould average.'},
    {id:'feed-system',label:'Runner and gate flow path',purpose:'Investigate one local path without assuming a global recipe problem.'},
    {id:'cavity-pressure',label:'Cavity-pressure evidence',purpose:'Interpret local traces with verified timebase and sensor meaning.'},
    {id:'diagnostic-method',label:'Evidence-led diagnostic method',purpose:'Separate the observed fault from a testable cause.'}
  ]);
  const COMPETENCIES=Object.freeze([
    {id:'mechanism',step:'hypothesis',label:'Competing-mechanism reasoning',chapter:'diagnostic-method'},
    {id:'evidence',step:'test',label:'Discriminating evidence choice',chapter:'cavity-pressure'},
    {id:'controlled-response',step:'response',label:'Cause-linked intervention planning',chapter:'feed-system'},
    {id:'verification',step:'verify',label:'Cavity-resolved recovery verification',chapter:'multi-cavity'}
  ]);
  const MISSION_CONTEXT=Object.freeze({
    machine:'Virtual training press',
    mould:'Four-cavity learning tool',
    material:'Unspecified study material',
    part:'Cavity-resolved practice part',
    caseId:CASE_ID
  });
  function caseRow(apprenticeship){
    return apprenticeship&&Array.isArray(apprenticeship.cases)?
      apprenticeship.cases.find(row=>row&&row.id===CASE_ID)||null:null;
  }
  function safeInt(value,min,max){
    const n=Number(value);
    return Number.isInteger(n)?Math.max(min,Math.min(max,n)):min;
  }
  function assess(answers,apprenticeship){
    const row=caseRow(apprenticeship);
    if(!row||typeof apprenticeship.scoreReasoning!=='function')
      return {state:'unavailable',reason:'The governed Virtual Apprenticeship case is not loaded.'};
    const missing=COMPETENCIES.filter(item=>!row[item.step].options.some(option=>option[0]===String(answers?.[item.step]||'')))
      .map(item=>item.step);
    if(missing.length)return {state:'incomplete',missing,reason:'Finish all four evidence decisions before reviewing the reasoning.'};
    const result=apprenticeship.scoreReasoning(row,answers);
    if(!result||!Number.isInteger(result.total)||result.max!==4||!result.dimensions)
      return {state:'unavailable',reason:'The governed scoring result is unavailable.'};
    const dimensions=COMPETENCIES.map(item=>({
      id:item.id,step:item.step,label:item.label,correct:result.dimensions[item.step]?.correct===true,
      chapter:item.chapter
    }));
    const gaps=dimensions.filter(item=>!item.correct);
    const chapter=(gaps[0]||dimensions[3]).chapter;
    const topic=BOOK.find(item=>item.id===chapter);
    return {
      state:'formative-review',caseId:CASE_ID,total:result.total,max:result.max,
      dimensions,gaps:gaps.map(item=>item.id),
      tutor:gaps.length?
        'Revisit '+topic.label+' and repeat the '+gaps[0].label.toLowerCase()+' decision. Explain what evidence would change your conclusion.':
        'All four reasoning choices are consistent with the authored case. Repeat under a harder coaching level and reflect on alternative mechanisms.',
      recommendedBookId:chapter,
      credentialAwarded:false,productionAuthority:false
    };
  }
  function readExistingProgress(storage){
    if(!storage||typeof storage.get!=='function')return {state:'unavailable',reason:'Learner-scoped Runtime V2 storage is unavailable.'};
    let record;
    try{record=storage.get(VA_PROGRESS_KEY,null)}catch(_){return {state:'unavailable',reason:'Learner-scoped progress cannot be read.'}}
    const attempt=record&&typeof record==='object'&&!Array.isArray(record)&&
      record.completed&&typeof record.completed==='object'&&!Array.isArray(record.completed)?
      record.completed[CASE_ID]:null;
    if(!attempt||typeof attempt!=='object'||Array.isArray(attempt))
      return {state:'not-attempted',caseId:CASE_ID,credentialAwarded:false};
    return {
      state:'formative-attempt',caseId:CASE_ID,
      best:safeInt(attempt.best,0,4),last:safeInt(attempt.last,0,4),
      coachingLevel:['beginner','developing','advanced'].includes(attempt.level)?attempt.level:'unknown',
      credentialAwarded:false
    };
  }
  function createBridge(services){
    const deps=services||{};
    function apprentice(){return deps.apprenticeship||null}
    function book(){return deps.book||null}
    function spatial(){return deps.spatial||null}
    function runtime(){return deps.runtime||null}
    function openCase(){
      const va=apprentice(),row=caseRow(va);
      if(!row||typeof va.openCase!=='function')return false;
      const index=va.cases.indexOf(row);
      return va.openCase(index)===true;
    }
    function openSpatial(){
      const va=apprentice(),row=caseRow(va),twin=spatial();
      if(!row||!twin||typeof twin.open!=='function')return false;
      return twin.open({caseIndex:va.cases.indexOf(row)})===true;
    }
    function openBookChapter(id){
      if(!BOOK.some(item=>item.id===id)||typeof book()?.openChapter!=='function')return false;
      return book().openChapter(id);
    }
    function getProgress(){return readExistingProgress(runtime()?.storage)}
    function review(answers){return assess(answers,apprentice())}
    return Object.freeze({openCase,openSpatial,openBookChapter,getProgress,review});
  }
  function mount(target,bridge){
    if(!target||typeof target.appendChild!=='function'||!bridge||typeof document==='undefined')return false;
    if(target.querySelector?.('[data-mm-new1-case-one]'))return true;
    const host=document.createElement('section');
    host.className='card';
    host.dataset.mmNew1CaseOne='1';
    const heading=document.createElement('h2');heading.textContent='Virtual Factory · Case One';
    const intro=document.createElement('p');
    intro.textContent='In a simulated four-cavity tool, one cavity becomes light. Review the Book, compare cavity evidence, test a hypothesis and verify recovery using the existing apprenticeship.';
    host.append(heading,intro);
    const actions=document.createElement('div');actions.className='hero-buttons';
    function button(label,fn){
      const b=document.createElement('button');b.type='button';b.className='secondary';
      b.textContent=label;b.addEventListener('click',fn);actions.appendChild(b);
    }
    button('Enter factory case',()=>bridge.openCase());
    button('Inspect the Spatial Twin',()=>bridge.openSpatial());
    button('Read multi-cavity Book module',()=>bridge.openBookChapter('multi-cavity'));
    host.appendChild(actions);
    const progress=document.createElement('p');progress.className='tiny muted';
    const observed=bridge.getProgress();
    progress.textContent=observed.state==='formative-attempt'?
      'Local formative record: best '+observed.best+'/4 evidence decisions. Not a competence certificate.':
      'No completed local formative case review is recorded for this learner.';
    host.appendChild(progress);
    const boundary=document.createElement('p');boundary.className='legal-note';
    boundary.textContent='Training only. Scenario numbers and outcomes are authored, not validated machine physics. No safeguarding, production recipe, machine-control, accreditation or workplace competence authority.';
    host.appendChild(boundary);target.appendChild(host);return true;
  }
  return Object.freeze({
    version:VERSION,caseId:CASE_ID,stageFlow:FLOW,bookLinks:BOOK,competencies:COMPETENCIES,
    missionContext:MISSION_CONTEXT,assess,readExistingProgress,createBridge,mount,
    status:'development-only; intentionally not loaded by the governed public runtime',
    boundary:'One case links existing authored simulation, Book and learner-scoped formative records; no parallel answer keys, learner store, machine control or competence sign-off.'
  });
});
