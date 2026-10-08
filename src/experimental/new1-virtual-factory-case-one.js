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
    function caseDefinition(){return caseRow(apprentice())}
    function runtimeStorage(){return runtime()?.storage||null}
    function openCase(){
      const va=apprentice(),row=caseDefinition();
      if(!row||typeof va.openCase!=='function')return false;
      return va.openCase(va.cases.indexOf(row))===true;
    }
    function openSpatial(){
      const va=apprentice(),row=caseDefinition(),twin=spatial();
      if(!row||!twin||typeof twin.open!=='function')return false;
      return twin.open({caseIndex:va.cases.indexOf(row)})===true;
    }
    function openBookChapter(id){
      if(!BOOK.some(item=>item.id===id)||typeof book()?.openChapter!=='function')return false;
      return book().openChapter(id);
    }
    function getProgress(){return readExistingProgress(runtimeStorage())}
    function review(answers){return assess(answers,apprentice())}
    return Object.freeze({openCase,openSpatial,openBookChapter,getProgress,review,caseDefinition,runtimeStorage});
  }
  /*
   * One ephemeral worksheet, tied to the current learner identity. Its choices
   * never write progress, change a formal answer key or compete with the native
   * apprenticeship assessment. The native case remains the owner of completion.
   */
  function createJourney(bridge){
    let token=null,answers={},reviewed=null;
    function learnerToken(){
      try{
        const value=bridge.runtimeStorage()?.learnerToken?.();
        return typeof value==='string'&&value.trim()?value:null;
      }catch(_){return null}
    }
    function synchronize(){
      const active=learnerToken();
      if(active!==token){token=active;answers={};reviewed=null;}
      return token!==null;
    }
    function choose(step,optionId){
      if(!synchronize())return false;
      const row=bridge.caseDefinition();
      if(!COMPETENCIES.some(item=>item.step===step)||!row||!Array.isArray(row[step]?.options))return false;
      if(!row[step].options.some(item=>item[0]===optionId))return false;
      answers={...answers,[step]:optionId};reviewed=null;
      return true;
    }
    function snapshot(){
      const ready=synchronize();
      return Object.freeze({state:ready?'ready':'no-learner',answers:{...answers},reviewed:reviewed?{...reviewed}:null});
    }
    function review(){
      if(!synchronize())return {state:'no-learner',reason:'Choose a learner profile before reviewing this case.'};
      const result=bridge.review(answers);
      reviewed=result.state==='formative-review'?result:null;
      return result;
    }
    function reset(){synchronize();answers={};reviewed=null}
    return Object.freeze({choose,snapshot,review,reset});
  }
  let mountCount=0;
  function mount(target,bridge){
    if(!target||typeof target.appendChild!=='function'||!bridge||typeof document==='undefined')return false;
    if(target.querySelector?.('[data-mm-new1-case-one]'))return true;
    const row=bridge.caseDefinition?.();
    if(!row||row.id!==CASE_ID)return false;
    const journey=createJourney(bridge),instance=++mountCount;
    const el=(tag,cls,text)=>{
      const node=document.createElement(tag);
      if(cls)node.className=cls;
      if(text!==undefined)node.textContent=text;
      return node;
    };
    const host=el('section','card');
    host.dataset.mmNew1CaseOne='1';
    host.appendChild(el('h2','', 'Virtual Factory · Case One'));
    host.appendChild(el('p','', 'A four-cavity mould has one lighter cavity. Compare evidence, consult the governed Book, choose a discriminating test and verify all four cavities. This worksheet is formative; completing it does not update certificates.'));
    const actions=el('div','hero-buttons');
    function button(label,fn,container=actions){
      const b=el('button','secondary',label);b.type='button';
      b.addEventListener('click',fn);container.appendChild(b);return b;
    }
    button('Open the canonical apprenticeship case',()=>bridge.openCase());
    button('Inspect this cell in Spatial Twin',()=>bridge.openSpatial());
    button('Read multi-cavity Book module',()=>bridge.openBookChapter('multi-cavity'));
    host.appendChild(actions);
    const board=el('section','content-block');
    board.appendChild(el('h3','', 'Observed evidence'));
    board.appendChild(el('p','tiny muted','Known good: '+String(row.baseline||'Baseline not provided.')));
    const list=el('dl','mm-new1-factory-evidence');
    for(const [label,value] of row.observations||[]){
      list.append(el('dt','',label),el('dd','',value));
    }
    board.appendChild(list);host.appendChild(board);
    const worksheet=el('section','content-block');
    worksheet.appendChild(el('h3','', 'Your evidence-to-recovery worksheet'));
    worksheet.appendChild(el('p','tiny muted','Every choice comes from the existing VA-02 case. Nothing is sent to a server or stored as an award.'));
    const fields=[];
    const status=el('p','tiny muted');
    status.setAttribute('aria-live','polite');
    function updateSelection(){
      const snap=journey.snapshot();
      status.textContent=snap.state==='ready'?'Draft choices stay on this screen until you reset or change learner.':'Select a learner profile to make worksheet choices. Existing learner records remain separate.';
      for(const input of fields)input.checked=snap.answers[input.dataset.mmNew1Step]===input.value;
    }
    for(const item of COMPETENCIES){
      const step=row[item.step];
      const group=el('fieldset','content-block');
      group.appendChild(el('legend','',item.label+' — '+step.prompt));
      for(const option of step.options){
        const label=el('label','choice');
        const input=el('input');input.type='radio';input.name='new1-'+instance+'-'+item.step;
        input.value=option[0];input.dataset.mmNew1Step=item.step;
        input.addEventListener('change',()=>{
          if(!journey.choose(item.step,input.value)){updateSelection();return;}
          results.replaceChildren();updateSelection();
        });
        fields.push(input);label.append(input,el('span','',option[1]));group.appendChild(label);
      }
      const help=el('div','tiny muted');
      const open=button('Read: '+(BOOK.find(b=>b.id===item.chapter)?.label||item.chapter),()=>bridge.openBookChapter(item.chapter),help);
      open.className='ghost';group.appendChild(help);worksheet.appendChild(group);
    }
    worksheet.appendChild(status);
    const controls=el('div','hero-buttons');
    const results=el('section','content-block');results.setAttribute('aria-live','polite');
    button('Review draft reasoning',()=>{
      const result=journey.review();results.replaceChildren();
      if(result.state!=='formative-review'){results.appendChild(el('p','',result.reason||'Complete the worksheet before reviewing.'));return;}
      results.appendChild(el('h3','', 'Formative reasoning: '+result.total+'/'+result.max));
      for(const d of result.dimensions){
        results.appendChild(el('p','', (d.correct?'Consistent: ':'Revisit: ')+d.label));
      }
      results.appendChild(el('p','',result.tutor));
      button('Open recommended Book module',()=>bridge.openBookChapter(result.recommendedBookId),results).className='ghost';
      results.appendChild(el('p','tiny muted','This draft worksheet is not an assessed apprenticeship completion. Complete the canonical case to record formative progress for your learner.'));
    },controls);
    button('Reset draft choices',()=>{journey.reset();results.replaceChildren();updateSelection();},controls).className='ghost';
    worksheet.append(controls,results);host.appendChild(worksheet);
    const progress=el('p','tiny muted');
    function refreshProgress(){
      const observed=bridge.getProgress();
      progress.textContent=observed.state==='formative-attempt'?
        'Canonical local formative record: best '+observed.best+'/4 evidence decisions. Not a competence certificate.':
        observed.state==='not-attempted'?'No completed canonical case review is recorded for this learner.':
        'Learner-scoped Runtime V2 progress is unavailable. Nothing has been credited.';
      updateSelection();
    }
    button('Refresh canonical case progress',refreshProgress,host).className='ghost';
    host.appendChild(progress);
    host.appendChild(el('p','legal-note','Training only. Scenario evidence is authored, not validated machine physics. No safeguarding, production recipe, machine-control, accreditation or workplace competence authority.'));
    target.appendChild(host);refreshProgress();return true;
  }
  return Object.freeze({
    version:VERSION,caseId:CASE_ID,stageFlow:FLOW,bookLinks:BOOK,competencies:COMPETENCIES,
    missionContext:MISSION_CONTEXT,assess,readExistingProgress,createBridge,createJourney,mount,
    status:'development-only; intentionally not loaded by the governed public runtime',
    boundary:'One case links existing authored simulation, Book and learner-scoped formative records; no parallel answer keys, learner store, machine control or competence sign-off.'
  });
});
