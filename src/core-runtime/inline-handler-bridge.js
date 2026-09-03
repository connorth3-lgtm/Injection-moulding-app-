(function(){
  'use strict';
  if(window.MM_INLINE_HANDLER_BRIDGE)return;

  const VERSION='1';
  const EVENTS=Object.freeze(['click','change','input','keydown']);
  const ATTR_PREFIX='data-mm-on';
  const ALLOWED_CALLS=new Set([
    'MM_ASSESSMENT_ANALYTICS.reset',
    'MM_ASSESSMENT_ANALYTICS_REVIEW.exportJSON',
    'answerBoss','answerDailyChallenge','answerScenario',
    'checkRescueChallenge','closeModal','coachBuild','coachSend','completeAndNext','completeLesson','completeMaterialLesson','createLearner',
    'doSearch','exportData','filterDefects','filterGlossary','filterMaterialExplorer','finishOnboarding',
    'goLesson','gradeExam','gradeMaterialQuiz','importData',
    'mmCheckReview','mmCompleteAndContinue','mmCurriculumOpen','mmLearningJump','mmNextLesson','mmOpenDataDiagnosis','mmOpenMouldMaster','mmOpenReview','mmPreviousLesson','mmSaveSignoff',
    'mmSpecialistClose','mmSpecialistGapLesson','mmSpecialistGapToggle','mmSpecialistLesson','mmSpecialistOpen','mmSpecialistPractice','mmSpecialistToggle',
    'newLearner','nextBoss','nextLesson','openCourse','openDefect','openMaterialChapter','openMaterialLesson','openMobileMenu',
    'phaseExplain','printCertificate','resetData','resetSimulator','saveFriendlyProfile','saveLessonNote','saveProfile','setCoachPrompt','setRegion','simChange','simPreset','skipOnboarding','startBossRound','startExam','startRescueChallenge','switchMaterialTab','switchUser','switchView',
    'toggleBookmark','toggleFunSetting','updateCrystalLab','updateDryLab','updateFibreLab','updateRheologyLab','window.print'
  ]);

  function bridgeError(message,detail){
    const error=new Error(`MouldMaster inline-handler bridge: ${message}`);
    if(detail!==undefined)error.detail=detail;
    console.error(error);
    return error;
  }

  function splitTopLevel(source,delimiter){
    const parts=[];
    let start=0,depth=0,quote='',escaped=false;
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quote){
        if(escaped){escaped=false;continue}
        if(ch==='\\'){escaped=true;continue}
        if(ch===quote)quote='';
        continue;
      }
      if(ch==='\''||ch==='"'){quote=ch;continue}
      if(ch==='('||ch==='['||ch==='{'){depth++;continue}
      if(ch===')'||ch===']'||ch==='}'){depth--;if(depth<0)throw bridgeError('unbalanced handler expression',source);continue}
      if(ch===delimiter&&depth===0){parts.push(source.slice(start,i));start=i+1}
    }
    if(quote||depth!==0)throw bridgeError('unterminated handler expression',source);
    parts.push(source.slice(start));
    return parts;
  }

  function decodeQuoted(token){
    const quote=token[0];
    if((quote!=='\''&&quote!=='"')||token[token.length-1]!==quote)throw bridgeError('invalid quoted argument',token);
    let out='';
    for(let i=1;i<token.length-1;i++){
      let ch=token[i];
      if(ch!=='\\'){out+=ch;continue}
      i++;
      if(i>=token.length-1)throw bridgeError('dangling string escape',token);
      ch=token[i];
      const escapes={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0','\\':'\\','\'':'\'','"':'"'};
      if(Object.prototype.hasOwnProperty.call(escapes,ch)){out+=escapes[ch];continue}
      if(ch==='x'){
        const raw=token.slice(i+1,i+3);
        if(!/^[0-9a-f]{2}$/i.test(raw))throw bridgeError('invalid hex escape',token);
        out+=String.fromCharCode(parseInt(raw,16));i+=2;continue;
      }
      if(ch==='u'){
        const raw=token.slice(i+1,i+5);
        if(!/^[0-9a-f]{4}$/i.test(raw))throw bridgeError('invalid unicode escape',token);
        out+=String.fromCharCode(parseInt(raw,16));i+=4;continue;
      }
      out+=ch;
    }
    return out;
  }

  function parseArg(raw,element,event){
    const token=raw.trim();
    if(!token)throw bridgeError('empty call argument',raw);
    if((token[0]==='\''||token[0]==='"'))return decodeQuoted(token);
    if(/^-?(?:\d+\.?\d*|\.\d+)$/.test(token)){
      const value=Number(token);
      if(!Number.isFinite(value))throw bridgeError('non-finite numeric argument',token);
      return value;
    }
    if(token==='true')return true;
    if(token==='false')return false;
    if(token==='null')return null;
    if(token==='this')return element;
    if(token==='event')return event;
    if(token==='this.value')return element.value;
    if(token==='this.checked')return Boolean(element.checked);
    if(token==='this.files[0]')return element.files&&element.files[0];
    throw bridgeError('unsupported call argument',token);
  }

  function resolveCallable(path){
    if(!ALLOWED_CALLS.has(path))throw bridgeError('call target is not allowlisted',path);
    const parts=path.split('.');
    let owner=window;
    for(let i=0;i<parts.length-1;i++){
      owner=owner&&owner[parts[i]];
      if(owner==null)throw bridgeError('call owner is unavailable',path);
    }
    const fn=owner&&owner[parts[parts.length-1]];
    if(typeof fn!=='function')throw bridgeError('call target is unavailable',path);
    return{owner,fn};
  }

  function executeCall(statement,element,event){
    const match=statement.trim().match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(([\s\S]*)\)$/);
    if(!match)throw bridgeError('unsupported handler statement',statement);
    const target=match[1];
    const argsSource=match[2].trim();
    const args=argsSource?splitTopLevel(argsSource,',').map(arg=>parseArg(arg,element,event)):[];
    const callable=resolveCallable(target);
    return callable.fn.apply(callable.owner,args);
  }

  function executeHandler(source,element,event){
    let body=String(source||'').trim();
    if(!body)return;
    const conditional=body.match(/^if\s*\(\s*event\.key\s*={2,3}\s*(['"])Enter\1\s*\)\s*([\s\S]+)$/);
    if(conditional){
      if(event.key!=='Enter')return;
      body=conditional[2].trim();
    }
    let result;
    for(const statement of splitTopLevel(body,';')){
      if(!statement.trim())continue;
      result=executeCall(statement,element,event);
      if(result===false)event.preventDefault();
    }
    return result;
  }

  function eventPath(event){
    if(typeof event.composedPath==='function')return event.composedPath();
    const path=[];
    let node=event.target;
    while(node){path.push(node);node=node.parentNode}
    path.push(window);
    return path;
  }

  for(const eventName of EVENTS){
    document.addEventListener(eventName,event=>{
      const attr=ATTR_PREFIX+eventName;
      for(const node of eventPath(event)){
        if(node===document||node===window)break;
        if(!(node instanceof Element)||!node.hasAttribute(attr))continue;
        try{executeHandler(node.getAttribute(attr),node,event)}catch(error){
          if(!(error instanceof Error))console.error(bridgeError('unexpected execution failure',error));
        }
      }
    },false);
  }

  window.MM_INLINE_HANDLER_BRIDGE=Object.freeze({
    version:VERSION,
    events:EVENTS,
    allowedCalls:Object.freeze(Array.from(ALLOWED_CALLS).sort()),
    executeForTest:(source,element,event)=>executeHandler(source,element,event)
  });
})();
