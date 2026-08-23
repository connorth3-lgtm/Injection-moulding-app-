/* MouldMaster training QA compatibility fix — 2026.08.23.4 */
(function(){
  'use strict';
  const baseStart=window.startExam;
  if(typeof baseStart!=='function') return;

  function mirrorExamState(){
    try{
      if(typeof activeExam==='undefined' || !activeExam) return;
      (activeExam.questions||[]).forEach(q=>{
        if(q && typeof q==='object'){
          if(q.why==null && q.explanation!=null) q.why=q.explanation;
          if(q.source==null && q.reference!=null) q.source=q.reference;
          if(q.url==null && q.sourceUrl!=null) q.url=q.sourceUrl;
          if(q.feedback==null && q.optionFeedback!=null) q.feedback=q.optionFeedback;
        }
      });
      window.activeExam=activeExam;
    }catch(e){
      console.warn('[MouldMaster QA] Could not mirror exam state:',e);
    }
  }

  window.startExam=function(){
    const result=baseStart.apply(this,arguments);
    mirrorExamState();
    setTimeout(mirrorExamState,0);
    return result;
  };
})();
