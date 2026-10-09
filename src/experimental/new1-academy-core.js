/* NEW1 MouldMaster 3.0 — five connected, development-only training capabilities.
 * Deliberately not part of the production shell / service-worker.
 * Everything is authored formative learning, not machine physics or qualification. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else if(root)root.MM_NEW1_ACADEMY=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const VERSION='new1-academy-prototype-2026.10.09.1';
  const CASE_IDS=Object.freeze(['VA-01','VA-02','VA-03','VA-04','VA-05','VA-06']);
  const STEP_KEYS=Object.freeze(['hypothesis','test','response','verify']);
  const PATHWAYS=Object.freeze([
    {id:'operator',name:'Operator fundamentals',caseIds:['VA-01'],goal:'Record observed variation and compare with a known-good run.'},
    {id:'setter',name:'Setter foundations',caseIds:['VA-01','VA-04'],goal:'Distinguish one controlled response from a process-wide compensation.'},
    {id:'technician',name:'Process technician',caseIds:['VA-02','VA-03'],goal:'Compare cavity-resolved and thermal evidence before testing.'},
    {id:'troubleshooter',name:'Troubleshooter',caseIds:['VA-02','VA-05'],goal:'Keep competing mechanisms open until measurements discriminate them.'},
    {id:'engineer',name:'Process engineer',caseIds:['VA-04','VA-06'],goal:'Verify repeatability, sensor semantics and bounded conclusions.'}
  ]);
  function cleanText(value,max=140){
    return String(value==null?'':value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
  }
  function boundedScore(value){
    const n=Number(value);
    return Number.isInteger(n)&&n>=0&&n<=4?n:null;
  }
  function validCase(id){return CASE_IDS.includes(id)}
  function idFor(id,items){return items.find(x=>x.id===id)||null}
  function chapterRows(bookManifest){
    if(!bookManifest||!Array.isArray(bookManifest.parts))throw Error('The existing Book manifest must be loaded before New1 can run.');
    const rows=[];
    for(const part of bookManifest.parts){
      if(!part||!Array.isArray(part.chapters))throw Error('Malformed governed Book part.');
      for(const chapter of part.chapters){
        if(!chapter||typeof chapter.id!=='string'||!chapter.title)throw Error('Malformed governed Book module.');
        rows.push({
          id:chapter.id,title:cleanText(chapter.title,250),part:cleanText(part.title,150),
          level:cleanText(chapter.level,100),state:cleanText(chapter.state,40),
          sourceIds:Array.isArray(chapter.sourceIds)?chapter.sourceIds.filter(x=>typeof x==='string').slice(0,30):[],
          claimClasses:Array.isArray(chapter.claimClasses)?chapter.claimClasses.filter(x=>typeof x==='string').slice(0,20):[]
        });
      }
    }
    if(new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('Duplicated governed Book module ID.');
    return rows;
  }
  function knowledgeIndex(manifest,crosswalk){
    const chapters=chapterRows(manifest);
    if(chapters.length!==46)throw Error('The governed Book manifest must contain exactly 46 modules.');
    if(!crosswalk||crosswalk.schemaVersion!==1||
      crosswalk.crosswalkId!=='mouldmaster-book-academy-crosswalk'||
      crosswalk.mappingLevel!=='course-level semantic reinforcement'||
      !Array.isArray(crosswalk.courseNames)||crosswalk.courseNames.length!==12||
      !Array.isArray(crosswalk.chapterMappings))
      throw Error('The versioned, course-level Book/curriculum crosswalk is required.');
    const validLabel=value=>typeof value==='string'&&value.length>0&&
      value.length<=160&&value.trim()===value&&!/[\\u0000-\\u001f\\u007f]/.test(value);
    const knownCourses=new Set(crosswalk.courseNames);
    if(knownCourses.size!==12||crosswalk.courseNames.some(x=>!validLabel(x)))
      throw Error('Book crosswalk course registry is invalid or contains duplicates.');
    if(crosswalk.chapterMappings.length!==chapters.length)
      throw Error('Book crosswalk must contain every governed chapter in manifest order.');
    const maps=new Map();
    for(let i=0;i<chapters.length;i++){
      const item=crosswalk.chapterMappings[i],chapter=chapters[i];
      if(!item||item.chapterId!==chapter.id||maps.has(chapter.id))
        throw Error('Book crosswalk chapter order, identity or membership has drifted.');
      if(!Array.isArray(item.courseNames)||!item.courseNames.length||
        item.courseNames.some(x=>!knownCourses.has(x))||
        new Set(item.courseNames).size!==item.courseNames.length)
        throw Error('Book crosswalk chapter has missing, duplicate or unknown courses.');
      if(!Array.isArray(item.themes)||!item.themes.length||
        item.themes.some(x=>!validLabel(x))||
        new Set(item.themes).size!==item.themes.length)
        throw Error('Book crosswalk chapter has invalid or duplicate thematic labels.');
      maps.set(chapter.id,item);
    }
    // Search, case and direct-chapter results must not share mutable arrays
    // with the internal governed index (or the originally supplied manifest).
    const copyChapter=ch=>({
      ...ch,sourceIds:[...ch.sourceIds],claimClasses:[...ch.claimClasses],
      courses:[...ch.courses],themes:[...ch.themes]
    });
    const entries=chapters.map(ch=>({
      ...ch,courses:[...maps.get(ch.id).courseNames],themes:[...maps.get(ch.id).themes]
    }));
    function search(query='',options={}){
      const q=cleanText(query,120).toLowerCase();
      const course=cleanText(options?.course||'',100);
      return entries.filter(ch=>(!course||ch.courses.includes(course))&&
        (!q||[ch.title,ch.id,ch.part,...ch.courses,...ch.themes].join(' ').toLowerCase().includes(q)))
        .slice(0,46).map(copyChapter);
    }
    function forCase(caseId){
      const map={
        'VA-01':['velocity-pressure','shot-utilisation','process-baseline'],
        'VA-02':['multi-cavity','feed-system','cavity-pressure','diagnostic-method'],
        'VA-03':['cooling','dimensional-stability'],
        'VA-04':['gate-seal','sink-voids'],
        'VA-05':['venting','burns','thermal-history'],
        'VA-06':['cavity-pressure','process-monitoring','capability']
      };
      return (Object.prototype.hasOwnProperty.call(map,caseId)?map[caseId]:[])
        .map(id=>idFor(id,entries)).filter(Boolean).map(copyChapter);
    }
    return Object.freeze({
      chapters:entries.length,search,forCase,
      chapter:id=>{const ch=idFor(id,entries);return ch?copyChapter(ch):null;},
      scope:'Book module-level metadata and existing course-level semantic mappings; not automatic lesson/SME verification.'
    });
  }
  function validateFactoryEvidence(source){
    if(!source||source.schemaVersion!==1||source.caseId!=='VA-02'||source.kind!=='authored-synthetic-index')
      throw Error('New1 authored factory-evidence contract missing or unrecognised.');
    const shots=source.shots;
    if(!Array.isArray(shots)||shots.length!==20)throw Error('Expected 20 authored learning shots.');
    const phases=['baseline','drift','fault','recovery'],seen=new Set();
    const rows=shots.map((row,index)=>{
      if(!row||row.shot!==index+1||!phases.includes(row.phase)||!Array.isArray(row.cavities)||row.cavities.length!==4)
        throw Error('Factory training row has invalid shot/cavity identity.');
      if(row.cavities.some(x=>!Number.isFinite(x)||x<95||x>105))throw Error('Factory training row has invalid normalized study index.');
      seen.add(row.phase);
      return Object.freeze({shot:row.shot,phase:row.phase,cavities:Object.freeze([...row.cavities])});
    });
    if(seen.size!==4||phases.some((p,i)=>rows.slice(i*5,(i+1)*5).some(r=>r.phase!==p)))
      throw Error('Factory phases must contain five ordered shot rows each.');
    const baseline=rows.slice(0,5);
    const compare=phase=>{
      const subset=rows.filter(r=>r.phase===phase);
      if(!subset.length)return [];
      return [0,1,2,3].map(i=>{
        const mean=subset.reduce((sum,r)=>sum+r.cavities[i],0)/subset.length;
        const baselineMean=baseline.reduce((sum,r)=>sum+r.cavities[i],0)/baseline.length;
        return {cavity:i+1,index:Math.round(mean*100)/100,changeFromBaseline:Math.round((mean-baselineMean)*100)/100};
      });
    };
    return Object.freeze({
      shots:rows,phases,compare,metricLabel:'Authored relative part-mass index (not grams, a tolerance or production data)',
      boundary:'Deterministic fictional case data only. No physical moulding model, measured production outcomes or process setpoints.'
    });
  }
  function createPathwayView(va,progress){
    const real=progress&&typeof progress==='object'&&progress.completed&&typeof progress.completed==='object'&&!Array.isArray(progress.completed)?progress.completed:{};
    return PATHWAYS.map(path=>{
      const items=path.caseIds.map(id=>{
        const available=va?.cases?.some(row=>row.id===id)===true;
        const old=real[id],best=boundedScore(old?.best);
        return {caseId:id,available,attempted:best!==null,best};
      });
      return {...path,caseIds:[...path.caseIds],cases:items,
        attempted:items.filter(row=>row.attempted).length,
        assigned:items.length,credentialAwarded:false,workplaceValidated:false};
    });
  }
  function trainerDraft(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Trainer assignment must be an object.');
    const title=cleanText(input.title,100);
    if(title.length<5)throw Error('Assignment needs a descriptive title.');
    const level=cleanText(input.level,30);
    if(!PATHWAYS.some(x=>x.id===level))throw Error('Choose an existing formative apprenticeship stage.');
    if(!Array.isArray(input.caseIds)||input.caseIds.length<1||input.caseIds.length>6||input.caseIds.some(x=>!validCase(x)))
      throw Error('Assign only known Virtual Apprenticeship cases.');
    const ids=[...new Set(input.caseIds)];
    const notes=cleanText(input.instructions||'',500);
    return Object.freeze({
      schemaVersion:1,kind:'new1-local-formative-assignment-template',title,level,caseIds:ids,
      instructions:notes,createdFor:'local-supervised-use',includesLearnerData:false,
      accreditation:false,productionAuthority:false
    });
  }
  function assignmentExport(assignment){
    const sanitized=trainerDraft(assignment);
    return JSON.stringify(sanitized,null,2)+'\n';
  }
  function learnerShare(review,permission){
    if(permission!==true)throw Error('Voluntary learner-sharing consent is required on each export.');
    if(!review||review.state!=='formative-review'||!Number.isInteger(review.total)||review.total<0||review.total>4||
      !Array.isArray(review.gaps)||review.gaps.some(g=>!['mechanism','evidence','controlled-response','verification'].includes(g)))
      throw Error('Only a bounded reviewed formative case can be shared.');
    return Object.freeze({
      schemaVersion:1,kind:'new1-voluntary-anonymous-formative-summary',caseId:'VA-02',
      reasoningCount:4,reasoningConsistent:review.total,areasToPractice:[...review.gaps],
      containsLearnerIdentity:false,containsRawEvidence:false,
      limitation:'Anonymous summary may still reveal learning performance. Learner chooses whether to share; no automatic transmission.',
      accreditation:false,workplaceCompetence:false
    });
  }
  function tutorPlan(review,index,vaProgress){
    const total=review?.state==='formative-review'?review.total:null;
    const gaps=review?.state==='formative-review'?review.gaps:[];
    const knowledge=gaps.length?gaps.map(id=>({
      id,chapter:index.chapter({'mechanism':'diagnostic-method','evidence':'cavity-pressure','controlled-response':'feed-system','verification':'multi-cavity'}[id])
    })).filter(row=>row.chapter):[];
    const reviewed=total!==null;
    const prior=vaProgress&&typeof vaProgress==='object'?vaProgress:{};
    return Object.freeze({
      state:reviewed?'coached':'ready-to-practise',
      headline:!reviewed?'Begin with a four-cavity evidence investigation.':total===4?'Evidence reasoning is consistent with the authored case.':'Strengthen the evidence steps that need review.',
      bookRecommendations:knowledge.length?knowledge.map(row=>({id:row.chapter.id,title:row.chapter.title,evidenceState:row.chapter.state})):
        index.forCase('VA-02').slice(0,2).map(ch=>({id:ch.id,title:ch.title,evidenceState:ch.state})),
      recommendedCase:total===4?'VA-06':'VA-02',
      nextCoachingLevel:total===4&&prior.coachingLevel!=='advanced'?'advanced':'beginner',
      source:'Canonical Virtual Apprenticeship keyed score + governed Book module metadata',
      authority:'Feedback is formative and deterministic. It cannot diagnose a real machine or award competence.'
    });
  }
  function createAcademy(deps={}){
    const va=deps.apprenticeship;
    if(!va||!Array.isArray(va.cases)||va.cases.length<6||!va.cases.some(x=>x.id==='VA-02')||
      typeof va.scoreReasoning!=='function')throw Error('Requires canonical Virtual Apprenticeship cases/scorer.');
    const index=knowledgeIndex(deps.bookManifest,deps.crosswalk);
    if(index.chapters!==46)throw Error('New1 must preserve the existing 46 governed Book modules.');
    const factory=validateFactoryEvidence(deps.factoryEvidence);
    const bridge=deps.bridge;
    if(!bridge||typeof bridge.review!=='function'||typeof bridge.getProgress!=='function')
      throw Error('New1 requires the existing Case One bridge for canonical assessment/progress.');
    let lastReview=null;
    function review(answers){
      const result=bridge.review(answers);
      if(result?.state==='formative-review')lastReview=result;
      return result;
    }
    function tutor(){return tutorPlan(lastReview,index,bridge.getProgress())}
    function pathway(){
      let progress;
      try{progress=deps.storage?.get?.('mm_virtual_apprenticeship_v1',null)}catch(_){progress=null}
      return createPathwayView(va,progress);
    }
    return Object.freeze({
      version:VERSION,caseId:'VA-02',factory,index,
      canonicalCase:()=>va.cases.find(row=>row.id==='VA-02'),
      review,lastReview:()=>lastReview,tutor,pathway,
      trainerDraft,assignmentExport,learnerShare,
      openCase:()=>bridge.openCase?.()===true,
      openSpatial:()=>bridge.openSpatial?.()===true,
      openChapter:id=>index.chapter(id)?bridge.openBookChapter?.(id):false,
      boundary:'Development-only educational academy: no measured-machine physics, automatic controller, real-machine settings, learner data upload, human SME approval or accredited qualifications.'
    });
  }
  return Object.freeze({version:VERSION,caseIds:CASE_IDS,steps:STEP_KEYS,pathways:PATHWAYS,knowledgeIndex,
    validateFactoryEvidence,createPathwayView,trainerDraft,assignmentExport,learnerShare,tutorPlan,createAcademy});
});
