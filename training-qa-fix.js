/* MouldMaster training QA compatibility fix — 2026.08.23.5 */
(function(){
  'use strict';
  const REVIEW_KEY='mm_spaced_review_v1';
  const SIGN_KEY='mm_practical_signoff_v1';

  const baseStart=window.startExam;
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
    }catch(e){console.warn('[MouldMaster QA] Could not mirror exam state:',e)}
  }
  if(typeof baseStart==='function'){
    window.startExam=function(){const result=baseStart.apply(this,arguments);mirrorExamState();setTimeout(mirrorExamState,0);return result};
  }

  function safeParse(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'');return v&&typeof v==='object'&&!Array.isArray(v)?v:fallback}catch(_){return fallback}}
  function cleanReview(v){
    const out={items:{}};
    if(!v||typeof v!=='object'||Array.isArray(v)||!v.items||typeof v.items!=='object'||Array.isArray(v.items))return out;
    for(const [id,x] of Object.entries(v.items).slice(0,1000)){
      if(!x||typeof x!=='object'||Array.isArray(x))continue;
      const num=(n,lo,hi,d=0)=>Number.isFinite(+n)?Math.max(lo,Math.min(hi,+n)):d;
      out.items[String(id).slice(0,200)]={stage:Math.floor(num(x.stage,0,5,0)),due:num(x.due,0,4102444800000,Date.now()),wrong:Math.floor(num(x.wrong,0,100000,0)),right:Math.floor(num(x.right,0,100000,0)),last:num(x.last,0,4102444800000,0),confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'medium',prompt:String(x.prompt||'').slice(0,1000)};
    }
    return out;
  }
  function cleanSign(v){
    const out={checks:{},supervisor:'',date:'',notes:''};
    if(!v||typeof v!=='object'||Array.isArray(v))return out;
    if(v.checks&&typeof v.checks==='object'&&!Array.isArray(v.checks))for(const [k,b] of Object.entries(v.checks).slice(0,50))out.checks[String(k).slice(0,20)]=b===true;
    out.supervisor=String(v.supervisor||'').slice(0,160);out.date=String(v.date||'').slice(0,20);out.notes=String(v.notes||'').slice(0,10000);return out;
  }

  window.exportData=function(){
    try{
      const payload=JSON.parse(JSON.stringify(db));
      payload.trainingExtras={version:1,spacedReview:cleanReview(safeParse(REVIEW_KEY,{items:{}})),practicalSignoff:cleanSign(safeParse(SIGN_KEY,{}))};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
      if(typeof toast==='function')toast('Backup exported with training review data');
    }catch(e){alert('Backup could not be created on this device.')}
  };

  const baseImport=window.importData;
  if(typeof baseImport==='function'){
    window.importData=function(file){
      if(!file)return;
      const extrasReader=new FileReader();
      extrasReader.onload=()=>{try{
        const x=JSON.parse(extrasReader.result);
        const validMain=x&&typeof x==='object'&&!Array.isArray(x)&&x.users&&typeof x.users==='object'&&!Array.isArray(x.users)&&typeof x.activeUser==='string'&&x.users[x.activeUser];
        if(validMain&&x.trainingExtras&&typeof x.trainingExtras==='object'&&!Array.isArray(x.trainingExtras)){
          localStorage.setItem(REVIEW_KEY,JSON.stringify(cleanReview(x.trainingExtras.spacedReview)));
          localStorage.setItem(SIGN_KEY,JSON.stringify(cleanSign(x.trainingExtras.practicalSignoff)));
        }
      }catch(_){} };
      extrasReader.readAsText(file);
      return baseImport.apply(this,arguments);
    };
  }

  const baseReset=window.resetData;
  if(typeof baseReset==='function'){
    window.resetData=function(){
      const before=localStorage.getItem('mouldmasterProDB');
      const result=baseReset.apply(this,arguments);
      setTimeout(()=>{const after=localStorage.getItem('mouldmasterProDB');if(before!==after){localStorage.removeItem(REVIEW_KEY);localStorage.removeItem(SIGN_KEY);window.activeExam=null}},0);
      return result;
    };
  }
})();
