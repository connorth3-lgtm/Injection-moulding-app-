/* MouldMaster Book runtime — evidence-governed publication authorization. */
(function(){
  'use strict';
  const VERSION='2026.10.06.5';
  if(window.MMBook?.version===VERSION)return;
  const BOOK_DATA='./src/domains/learning/book-data/';
  const AUTH_PATH=`${BOOK_DATA}book-publication-authorization-v1.json`;
  const SME_PATH=`${BOOK_DATA}book-sme-review-v1.json`;
  const QUAL_PATH=`${BOOK_DATA}book-qualification-resolution-all-v1.json`;
  const HIGH_RISK_PATH=`${BOOK_DATA}book-claim-resolution-high-risk-v1.json`;
  const WORKED_CASES_PATH=`${BOOK_DATA}book-worked-engineering-cases-v1.json`;
  const DIAGRAMS_PATH=`${BOOK_DATA}book-engineering-diagrams-v1.json`;
  const ENRICHMENT_PATH=`${BOOK_DATA}book-evidence-enrichment-v2.json`;
  const CLAIM_EVIDENCE_PATH=`${BOOK_DATA}book-claim-evidence-reference-v1.json`;
  const READER_PATH=`${BOOK_DATA}book-reader-architecture-v2.json`;
  const EDITORIAL_REVIEW_PATH=`${BOOK_DATA}book-editorial-expansion-review-v1.json`;
  const MATERIAL_ATLAS_PATH=`${BOOK_DATA}book-material-grade-atlas-v1.json`;
  const MATERIAL_REGIONAL_PATH=`${BOOK_DATA}book-material-regional-evidence-v1.json`;
  const MATERIAL_CATALOG_PATH='./material-catalog-v1.json';
  const MATERIAL_SEARCH_INDEX_PATH=`${BOOK_DATA}book-material-search-index-v1.json`;
  const MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1='2a0049aae93bffc278a14a539f34e9c5a5c57ad4';
  const MATERIAL_PAGE_SIZE=24;
  const BATCH_PATHS=[`${BOOK_DATA}book-authored-foundations-v1.json`,`${BOOK_DATA}book-evidence-registry-v1.json`,`${BOOK_DATA}book-chapters-materials-machine-v1.json`,`${BOOK_DATA}book-authored-remaining-v1.json`];
  const AUTH_GIT_BLOB_SHA1='a6e90d0ac0914412a816e1b9858aaff54c057f9a';
  const REQUIRED_INTEGRITY_FILES=['book-manifest-v1.json','book-sme-review-v1.json','book-qualification-resolution-all-v1.json','book-claim-resolution-high-risk-v1.json','book-claim-resolution-high-risk-v2.json','book-claim-resolution-all-v1.json','book-claim-review-foundations-materials-machine-v1.json','book-claim-review-process-tooling-v1.json','book-claim-review-troubleshooting-v1.json','book-claim-review-engineering-advanced-v1.json','book-claim-review-high-risk-v1.json','book-authored-foundations-v1.json','book-evidence-registry-v1.json','book-chapters-materials-machine-v1.json','book-authored-remaining-v1.json','book-worked-engineering-cases-v1.json','book-engineering-diagrams-v1.json','book-evidence-enrichment-v2.json','book-claim-evidence-reference-v1.json','book-reader-architecture-v2.json','book-editorial-expansion-review-v1.json','book-material-grade-atlas-v1.json','book-material-regional-evidence-v1.json','material-catalog-v1.json'];
  const CANONICAL_SOURCE_URLS=Object.freeze({
    'OUBELLAOUCH-2024-FIBRE-ORIENTATION':'https://doi.org/10.1007/s00170-024-12990-5',
    'BIELENBERG-2025-SWITCHOVER-REVIEW':'https://doi.org/10.3390/polym17081096',
    'ZHAO-2022-WARPAGE-SHRINKAGE-REVIEW':'https://doi.org/10.1007/s00170-022-08859-0',
    'PARIZS-2023-IN-MOLD-SENSORS':'https://doi.org/10.3390/s23031735',
    'LI-2024-WELD-LINE-REVIEW':'https://doi.org/10.1007/s00170-024-13607-7'
  });
  const EVIDENCE_IDENTITIES=Object.freeze({
    'BASF-INJECTION-PROBLEMS':Object.freeze({family:'BASF Injection Molding Troubleshooter',sameAs:'BASF-INJECTION-TROUBLESHOOTER'}),
    'BASF-INJECTION-TROUBLESHOOTER':Object.freeze({family:'BASF Injection Molding Troubleshooter'}),
    'NIST-SEMATECH-HANDBOOK':Object.freeze({family:'NIST/SEMATECH Engineering Statistics Handbook'}),
    'NIST-MEASUREMENT-CHARACTERIZATION':Object.freeze({family:'NIST/SEMATECH Engineering Statistics Handbook'}),
    'NIST-SEMATECH-DOE':Object.freeze({family:'NIST/SEMATECH Engineering Statistics Handbook'}),
    'NIST-SEMATECH-CAPABILITY':Object.freeze({family:'NIST/SEMATECH Engineering Statistics Handbook'}),
    'PARIZS-2023-IN-MOLD-SENSORS':Object.freeze({family:'Parizs et al. 2023 in-mould sensor study'}),
    'PARIZS-2023-IN-MOLD-SENSORS-WORKED':Object.freeze({family:'Parizs et al. 2023 in-mould sensor study',sameAs:'PARIZS-2023-IN-MOLD-SENSORS'})
  });
  let manifest=null,manifestPromise=null,materialPromise=null,coldMaterialSearchPromise=null,publicationAuthorization=null,bookSmeReview=null,qualificationReview=null,highRiskReview=null,workedCaseLedger=null,workedCasesByChapter=new Map(),diagramLedger=null,diagramsByChapter=new Map(),evidenceEnrichmentLedger=null,claimEvidenceReference=null,claimEvidenceByChapter=new Map(),claimEvidenceClaimsByChapter=new Map(),readerArchitecture=null,editorialExpansionReview=null,materialAtlas=null,materialCatalog=null,materialRegionalEvidence=null,materialSearchIndex={catalog:[],regional:[]},integrityMap=null,ui=null,previousView=null,open=false,contentsScrollY=0;
  const BOOK_RESUME_PREFIX='mm_book_resume_v1::',LEGACY_BOOK_RESUME_KEY='mouldmasterBookResume:v1',BOOK_RESUME_SCHEMA=1;
  let activeReadingPosition=null,resumeScrollTimer=0,boundBookScrollRoot=null,bookScrollStyleRestore=null;
  function resumeStorageKey(){
    const scope=window.MM_LEARNER_SCOPE;
    if(!scope?.storageKey||!scope?.token)return null;
    try{scope.registerStoragePrefix?.(BOOK_RESUME_PREFIX);return scope.storageKey(BOOK_RESUME_PREFIX,scope.token())}catch(_){return null}
  }
  function migrateExperimentalResume(){
    const key=resumeStorageKey();if(!key)return;
    try{
      const legacy=localStorage.getItem(LEGACY_BOOK_RESUME_KEY);if(legacy==null)return;
      const ids=window.MM_LEARNER_SCOPE?.knownIds?.()||[];
      if(ids.length===1&&localStorage.getItem(key)==null)localStorage.setItem(key,legacy);
      localStorage.removeItem(LEGACY_BOOK_RESUME_KEY);
    }catch(_){}
  }
  function validResumeShape(value){return value&&typeof value==='object'&&value.schema===BOOK_RESUME_SCHEMA&&value.bookRelease===VERSION&&typeof value.id==='string'&&value.id.length>0&&['reader-chapter','chapter'].includes(value.kind)}
  function readResume(){
    const key=resumeStorageKey();if(!key)return null;
    try{const value=JSON.parse(localStorage.getItem(key)||'null');if(!validResumeShape(value)){if(value!=null)localStorage.removeItem(key);return null}return value}catch(_){return null}
  }
  function writeResume(position,{notify=false}={}){
    const key=resumeStorageKey();if(!key)return false;
    try{localStorage.setItem(key,JSON.stringify(position));if(notify)window.dispatchEvent(new CustomEvent('mm:book-resume-change',{detail:{...position}}));return true}catch(_){return false}
  }
  function bookScrollRoot(){
    const main=document.querySelector('#mainContent,.main,main');
    if(main){
      const overflow=String(getComputedStyle(main).overflowY||'').toLowerCase();
      const hasScrollRange=(Number(main.scrollHeight)||0)>(Number(main.clientHeight)||0)+1;
      if(/^(auto|scroll|overlay)$/.test(overflow)&&hasScrollRange)return main;
    }
    return document.scrollingElement||document.documentElement;
  }
  function isDocumentScrollRoot(root){return !root||root===document.scrollingElement||root===document.documentElement||root===document.body}
  function bookViewportTop(){
    const root=bookScrollRoot();
    if(isDocumentScrollRoot(root))return 80;
    const rect=root.getBoundingClientRect();
    return Math.max(0,Math.round(rect.top))+8;
  }
  function setBookInstantScroll(active){
    const html=document.documentElement,body=document.body;
    if(active){
      if(bookScrollStyleRestore)return;
      bookScrollStyleRestore={html:html?.style?.scrollBehavior||'',body:body?.style?.scrollBehavior||''};
      if(html)html.style.scrollBehavior='auto';
      if(body)body.style.scrollBehavior='auto';
      return;
    }
    if(!bookScrollStyleRestore)return;
    if(html)html.style.scrollBehavior=bookScrollStyleRestore.html;
    if(body)body.style.scrollBehavior=bookScrollStyleRestore.body;
    bookScrollStyleRestore=null;
  }
  function scrollBookBy(delta){
    const root=bookScrollRoot(),amount=Number(delta)||0;
    if(!amount)return;
    const target=isDocumentScrollRoot(root)?(document.scrollingElement||document.documentElement):root;
    target.scrollTop=(Number(target.scrollTop)||0)+amount;
  }
  function scrollBookTo(top){
    const root=bookScrollRoot(),value=Math.max(0,Number(top)||0);
    const target=isDocumentScrollRoot(root)?(document.scrollingElement||document.documentElement):root;
    target.scrollTop=value;
  }
  function bindBookScrollRoot(){
    const root=bookScrollRoot();
    if(isDocumentScrollRoot(root)||root===boundBookScrollRoot)return;
    boundBookScrollRoot?.removeEventListener?.('scroll',queueReadingScrollSave);
    root.addEventListener('scroll',queueReadingScrollSave,{passive:true});
    boundBookScrollRoot=root;
  }
  function readerAnchor(){
    if(!ui?.reader||ui.reader.hidden)return {anchorId:'',anchorIndex:-1,anchorText:'',anchorOffset:0};
    const top=bookViewportTop(),heads=[...ui.reader.querySelectorAll('h2[data-mm-book-anchor],h3[data-mm-book-anchor],h4[data-mm-book-anchor]')],eligible=heads.map((el,index)=>({el,index,rect:el.getBoundingClientRect()})).filter(x=>x.rect.top<=top);
    const picked=(eligible.length?eligible[eligible.length-1]:heads[0]?{el:heads[0],index:0,rect:heads[0].getBoundingClientRect()}:null);
    return picked?{anchorId:String(picked.el.dataset.mmBookAnchor||''),anchorIndex:picked.index,anchorText:String(picked.el.textContent||'').trim().slice(0,240),anchorOffset:Math.round(picked.rect.top),anchorOffsetId:String(picked.el.dataset.mmBookAnchor||'')}:{anchorId:'',anchorIndex:-1,anchorText:'',anchorOffset:0,anchorOffsetId:''};
  }
  function rememberReadingPosition(kind,id,title,scrollY=0){
    const anchor=readerAnchor(),position={schema:BOOK_RESUME_SCHEMA,bookRelease:VERSION,kind,id,title:String(title||'Book'),scrollY:Math.max(0,Math.round(Number(scrollY)||0)),anchorId:anchor.anchorId,anchorIndex:anchor.anchorIndex,anchorText:anchor.anchorText,anchorOffset:anchor.anchorOffset,anchorOffsetId:anchor.anchorOffsetId,updatedAt:new Date().toISOString()};
    activeReadingPosition=position;writeResume(position,{notify:true});return position
  }
  function updateReadingScroll({notify=false}={}){
    if(!open||!activeReadingPosition||ui?.reader?.hidden)return false;
    const anchor=readerAnchor(),next={...activeReadingPosition,scrollY:bookScrollTop(),anchorId:anchor.anchorId,anchorIndex:anchor.anchorIndex,anchorText:anchor.anchorText,anchorOffset:anchor.anchorOffset,anchorOffsetId:anchor.anchorOffsetId,updatedAt:new Date().toISOString()};
    activeReadingPosition=next;return writeResume(next,{notify})
  }
  function flushReadingPosition({notify=false}={}){clearTimeout(resumeScrollTimer);resumeScrollTimer=0;return updateReadingScroll({notify})}
  function queueReadingScrollSave(){if(!open||!activeReadingPosition)return;clearTimeout(resumeScrollTimer);resumeScrollTimer=setTimeout(()=>updateReadingScroll(),180)}
  function restoreReadingPosition(snapshot){
    clearTimeout(resumeScrollTimer);resumeScrollTimer=0;activeReadingPosition={...snapshot};
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!ui?.reader||ui.reader.hidden)return;
      const heads=[...ui.reader.querySelectorAll('h2[data-mm-book-anchor],h3[data-mm-book-anchor],h4[data-mm-book-anchor]')],anchorId=String(snapshot.anchorId||''),index=Number.isInteger(snapshot.anchorIndex)?snapshot.anchorIndex:-1,wanted=String(snapshot.anchorText||'').trim();
      const byId=anchorId?heads.find(el=>el.dataset.mmBookAnchor===anchorId):null;
      const heading=byId||(index>=0&&index<heads.length?heads[index]:null)||(wanted?heads.find(el=>String(el.textContent||'').trim()===wanted):null);
      if(heading){
        const savedOffset=Number(snapshot.anchorOffset),offsetIdentity=String(snapshot.anchorOffsetId||'');
        const desired=byId&&offsetIdentity===anchorId&&Number.isFinite(savedOffset)?savedOffset:bookViewportTop();
        scrollBookBy(heading.getBoundingClientRect().top-desired);
      }else scrollBookTo(snapshot.scrollY);
    }));
  }
  function clearResume(){
    const key=resumeStorageKey();activeReadingPosition=null;clearTimeout(resumeScrollTimer);resumeScrollTimer=0;
    if(!key)return false;try{localStorage.removeItem(key);window.dispatchEvent(new CustomEvent('mm:book-resume-change',{detail:null}));return localStorage.getItem(key)==null}catch(_){return false}
  }
  migrateExperimentalResume();
  window.addEventListener('scroll',queueReadingScrollSave,{passive:true});
  window.addEventListener('pagehide',()=>flushReadingPosition());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushReadingPosition()});
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateLabel=state=>({planned:'Planned','source-review':'Source review','technical-review':'Technical review',verified:'Source evidence reviewed',hold:'Hold'}[state]||state);
  const fileName=path=>String(path||'').split('/').pop();
  const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
  async function gitBlobSha1(bytes){
    if(!globalThis.crypto?.subtle)throw new Error('Book byte-integrity verification is unavailable in this browser');
    const body=new Uint8Array(bytes),header=new TextEncoder().encode(`blob ${body.byteLength}\0`),payload=new Uint8Array(header.byteLength+body.byteLength);
    payload.set(header,0);payload.set(body,header.byteLength);
    return hex(await crypto.subtle.digest('SHA-1',payload));
  }
  async function verifiedJson(path,expectedSha){
    const expected=expectedSha||integrityMap?.[fileName(path)];
    if(!/^[0-9a-f]{40}$/.test(String(expected||'')))throw new Error(`Book byte-integrity identity missing for ${fileName(path)}`);
    const r=await fetch(path,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error(`${path} unavailable (${r.status})`);
    const bytes=await r.arrayBuffer(),actual=await gitBlobSha1(bytes);
    if(actual!==expected)throw new Error(`Book byte-integrity mismatch for ${fileName(path)}`);
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }
  function validateIntegrityAuthorization(auth){
    const cfg=auth?.runtimeIntegrity;
    if(cfg?.algorithm!=='git-blob-sha1'||!cfg.gitBlobSha1ByFile||typeof cfg.gitBlobSha1ByFile!=='object')throw new Error('Book publication authorization byte-integrity contract missing');
    for(const name of REQUIRED_INTEGRITY_FILES)if(!/^[0-9a-f]{40}$/.test(String(cfg.gitBlobSha1ByFile[name]||'')))throw new Error(`Book publication authorization integrity coverage missing: ${name}`);
    integrityMap=Object.freeze({...cfg.gitBlobSha1ByFile});
  }
  function applyPublicationAuthorization(data,declared,auth){
    if(auth?.schema!==1||auth?.bookId!==data.bookId)throw new Error('Book publication authorization identity check failed');if(auth.status!=='authorized')return;if(auth.learnerFacingPublicationLabel!=='Source evidence reviewed')throw new Error('Book learner-facing assurance terminology mismatch');
    if(auth?.authorizationBasis?.sourceRevision!=='7ef28bd8b02994223e320fda64e99808357d3219')throw new Error('Book publication authorization source revision mismatch');
    if(auth?.governanceSnapshot?.manifestVersion!==data.version)throw new Error('Book publication authorization manifest version mismatch');const snapshot=auth.governanceSnapshot||{};
    if(snapshot.chapters!==46||snapshot.claims!==137||snapshot.supported!==116||snapshot.qualified!==21||snapshot.hold!==0||snapshot.conflicting!==0||snapshot.scopeQualifiedClaimsBlockingPublication!==0)throw new Error('Book publication authorization governance snapshot mismatch');
    const ids=Array.isArray(auth.authorizedChapterIds)?auth.authorizedChapterIds:[];if(ids.length!==declared.size||new Set(ids).size!==ids.length)throw new Error('Book publication authorization chapter coverage mismatch');
    for(const id of ids){const chapter=declared.get(id);if(!chapter)throw new Error(`Book publication authorization contains unknown chapter: ${id}`);chapter.state='verified';}publicationAuthorization=auth;
  }
  function validateReaderArchitecture(data,declared,auth){
    if(data?.schema!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='governed-derived-reader-map'||!Array.isArray(data.readerChapters))throw new Error('Book reader architecture identity check failed');
    const permit=auth?.readerArchitectureAuthorization;if(permit?.status!=='authorized-derived-structure'||permit?.release!==VERSION||permit?.ledger!=='data/book-reader-architecture-v2.json'||permit?.readerChapterCount!==20||permit?.governedModuleCount!==46||permit?.noNewTechnicalClaims!==true||permit?.independentSmeStatus!=='hold')throw new Error('Book reader architecture authorization missing');
    if(data.readerChapters.length!==20)throw new Error('Book reader chapter count mismatch');
    const readerIds=new Set(),moduleIds=[];
    for(const reader of data.readerChapters){
      if(!reader?.id||readerIds.has(reader.id)||!reader?.title||!reader?.goal||!Array.isArray(reader.moduleIds)||!reader.moduleIds.length||!['Foundation','Technician','Engineer','Advanced'].includes(reader.depthBand)||!Array.isArray(reader.learningObjectives)||reader.learningObjectives.length<2||!Array.isArray(reader.checkQuestions)||reader.checkQuestions.length<3||!reader.applyPrompt||!reader.evidenceBoundary)throw new Error('Invalid Book reader chapter');
      readerIds.add(reader.id);
      for(const id of reader.moduleIds){if(!declared.has(id))throw new Error(`Unknown governed module in reader architecture: ${id}`);moduleIds.push(id);}
    }
    if(moduleIds.length!==declared.size||new Set(moduleIds).size!==moduleIds.length||moduleIds.some(id=>!declared.has(id)))throw new Error('Book reader architecture must cover every governed module exactly once');
    const target=data.targetWordsPerReaderChapter||{};if(target.nominal!==1000||!Array.isArray(target.range)||target.range[0]!==850||target.range[1]!==1400)throw new Error('Book reader editorial target drift');
    return data;
  }
  function validateEditorialExpansionReview(data,declared,auth){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='repository-technical-review-complete'||!Array.isArray(data.reviewedModules))throw new Error('Book editorial expansion review identity check failed');
    const permit=auth?.editorialExpansionAuthorization;if(permit?.status!=='authorized-repository-technical-source-review'||permit?.release!==VERSION||permit?.ledger!=='data/book-editorial-expansion-review-v1.json'||permit?.moduleCount!==37||permit?.noNewClaimIds!==true||permit?.independentSmeStatus!=='hold')throw new Error('Book editorial expansion authorization missing');
    if(data.reviewedModules.length!==37||data?.acceptanceRules?.independentSmeStatus!=='hold')throw new Error('Book editorial expansion review coverage mismatch');
    const seen=new Set();
    for(const item of data.reviewedModules){
      if(!item?.moduleId||seen.has(item.moduleId)||!declared.has(item.moduleId)||!Array.isArray(item.governedClaimIds)||!item.governedClaimIds.length||item.conclusion!=='compatible-with-existing-governed-claim-scope')throw new Error('Invalid Book editorial expansion review record');
      seen.add(item.moduleId);
      const expected=integrityMap?.[fileName(item.authoredPath)];if(!expected||item.authoredGitBlobSha1!==expected)throw new Error(`Book editorial expansion byte mismatch: ${item.moduleId}`);
    }
    if(data?.readerArchitecture?.gitBlobSha1!==integrityMap?.['book-reader-architecture-v2.json']||data?.readerArchitecture?.conclusion!=='structural-only-no-new-technical-claims')throw new Error('Book editorial review reader-architecture binding mismatch');
    return data;
  }
  function validateSmeReview(data,declared){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||!Array.isArray(data.chapterIds)||!Array.isArray(data.reviews))throw new Error('Book SME review contract identity check failed');
    if(data.chapterIds.length!==declared.size||new Set(data.chapterIds).size!==data.chapterIds.length)throw new Error('Book SME review chapter coverage mismatch');for(const id of data.chapterIds)if(!declared.has(id))throw new Error(`Book SME review contains unknown chapter: ${id}`);if(workedCaseLedger){const expected=workedCaseLedger.cases.map(x=>x.id),actual=Array.isArray(data.workedCaseIds)?data.workedCaseIds:[];if(data.release!==VERSION||actual.length!==expected.length||expected.some(id=>!actual.includes(id)))throw new Error('Book SME worked-case scope mismatch');}if(evidenceEnrichmentLedger){const expected=evidenceEnrichmentLedger.chapterPatches.map(x=>x.chapterId),actual=Array.isArray(data.enrichmentChapterIds)?data.enrichmentChapterIds:[];if(data.release!==VERSION||actual.length!==expected.length||expected.some(id=>!actual.includes(id)))throw new Error('Book SME enrichment scope mismatch');}if(diagramLedger){const expected=diagramLedger.diagrams.map(x=>x.id),actual=Array.isArray(data.diagramIds)?data.diagramIds:[];if(data.release!==VERSION||actual.length!==expected.length||expected.some(id=>!actual.includes(id)))throw new Error('Book SME diagram scope mismatch');}
    const approved=new Set();for(const review of data.reviews){if(!review?.chapterId||!declared.has(review.chapterId))throw new Error(`Book SME review record has unknown chapter: ${review?.chapterId||'missing'}`);if(review.conclusion==='approved')approved.add(review.chapterId);}if(data.status==='validated'&&approved.size!==declared.size)throw new Error('Book SME review cannot be validated without approval coverage for every chapter');return data;
  }
  function validateQualificationReview(data){if(data?.schema!==1||data?.bookId!=='mouldmaster-book'||!Array.isArray(data.resolutions)||!Array.isArray(data.remainingQualifiedClaims))throw new Error('Book qualification-resolution identity check failed');const c=data.effectiveCountsAfterQualificationReview||{};if(c.chapters!==46||c.claims!==137||c.supported!==116||c.qualified!==21||c.hold!==0||c.conflicting!==0)throw new Error('Book qualification-resolution counts mismatch');return data;}
  function validateWorkedCases(data,declared,sourceMap,manifestData,auth){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='authorized-synthetic-teaching'||!Array.isArray(data.cases)||!Array.isArray(data.sourceSeeds))throw new Error('Book worked-case ledger identity check failed');
    const permit=auth?.workedCasesAuthorization;if(permit?.status!=='authorized'||permit?.release!==VERSION||permit?.ledger!=='data/book-worked-engineering-cases-v1.json'||permit?.caseCount!==27||permit?.claimCount!==27||permit?.independentSmeStatus!=='hold')throw new Error('Book worked-case publication authorization missing');
    for(const source of data.sourceSeeds){
      if(!source?.id||!source?.title||!source?.url||!source?.scope)throw new Error('Incomplete worked-case evidence source');
      const existing=sourceMap.get(source.id);
      if(existing){
        const fields=['type','issuer','title','url','checked','state','scope','canonicalUrl'];
        if(fields.some(key=>String(existing[key]??'')!==String(source[key]??'')))throw new Error(`Conflicting worked-case source id: ${source.id}`);
        continue;
      }
      sourceMap.set(source.id,source);manifestData.sourceSeeds.push(source);
    }
    if(data.cases.length!==27)throw new Error('Book worked-case count mismatch');const caseIds=new Set(),claimIds=new Set();
    for(const item of data.cases){
      if(!item?.id||caseIds.has(item.id))throw new Error(`Duplicate or missing worked-case id: ${item?.id||'missing'}`);caseIds.add(item.id);
      if(!item?.chapterId||!declared.has(item.chapterId))throw new Error(`Invalid worked-case chapter binding: ${item?.chapterId||'missing'}`);
      if(item.synthetic!==true||!item.title||!item.setup||!item.interpretation||!Array.isArray(item.calculationSteps)||!item.calculationSteps.length||!Array.isArray(item.boundaries)||!item.boundaries.length)throw new Error(`Incomplete worked-case teaching contract: ${item.id}`);
      if(!Array.isArray(item.sourceIds)||!item.sourceIds.length)throw new Error(`Worked case lacks evidence anchors: ${item.id}`);for(const id of item.sourceIds)if(!sourceMap.has(id))throw new Error(`Unknown worked-case source ${id} in ${item.id}`);
      if(!Array.isArray(item.claims)||item.claims.length!==1)throw new Error(`Worked case must have one governed case claim: ${item.id}`);
      const claim=item.claims[0];if(!claim?.id||claimIds.has(claim.id)||claim.conclusion!=='supported-with-explicit-synthetic-scope'||!claim.statement)throw new Error(`Invalid worked-case claim: ${item.id}`);claimIds.add(claim.id);for(const id of claim.sourceIds||[])if(!sourceMap.has(id))throw new Error(`Unknown worked-case claim source ${id} in ${claim.id}`);
    }
    const authority=data.authorityBoundary||{};if(authority.productionUse!=='advisory-only'||authority.validatedRecipeAuthority!==false||authority.automaticMachineControl!==false||authority.universalSetpoints!==false)throw new Error('Worked-case authority boundary weakened');
    return data;
  }
  function validateEngineeringDiagrams(data,declared,auth){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='governed-instructional-diagrams'||!Array.isArray(data.diagrams))throw new Error('Book engineering-diagram ledger identity check failed');
    const permit=auth?.diagramAuthorization;if(permit?.status!=='authorized-instructional-diagrams'||permit?.release!==VERSION||permit?.ledger!=='data/book-engineering-diagrams-v1.json'||permit?.diagramCount!==21||permit?.independentSmeStatus!=='hold')throw new Error('Book engineering-diagram publication authorization missing');
    if(data.diagrams.length!==21)throw new Error('Book engineering-diagram count mismatch');
    const ids=new Set();
    for(const item of data.diagrams){
      if(!item?.id||ids.has(item.id)||!item?.chapterId||!declared.has(item.chapterId))throw new Error('Invalid or duplicate Book engineering diagram');
      ids.add(item.id);
      if(!item?.title||!item?.asset||!item?.alt||!item?.caption||!/^[0-9a-f]{40}$/.test(String(item.gitBlobSha1||'')))throw new Error(`Incomplete Book engineering diagram: ${item.id}`);
      if(!/^assets\/book-diagrams\/[a-z0-9-]+\.svg$/.test(item.asset))throw new Error(`Unsafe Book diagram asset path: ${item.asset}`);
    }
    const boundary=data.authorityBoundary||{};if(boundary.productionUse!=='advisory-only'||boundary.machineSpecific!==false||boundary.scaleDrawing!==false||boundary.validatedDesignAuthority!==false||boundary.independentSmeStatus!=='hold')throw new Error('Book engineering-diagram authority boundary weakened');
    return data;
  }
  function validateClaimEvidenceReference(data,declared,sourceMap,manifestData,auth){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='governed-reader-claim-evidence-index'||!Array.isArray(data.sourceSeeds)||!Array.isArray(data.chapters))throw new Error('Book claim-evidence reference identity check failed');
    const permit=auth?.claimEvidenceReferenceAuthorization;if(permit?.status!=='authorized-derived-evidence-index'||permit?.release!==VERSION||permit?.ledger!=='data/book-claim-evidence-reference-v1.json'||permit?.chapterCount!==46||permit?.sourceCount!==52||permit?.claimCount!==137||permit?.noNewClaims!==true||permit?.independentSmeStatus!=='hold')throw new Error('Book claim-evidence reference authorization missing');
    if(data.chapterCount!==46||data.sourceCount!==52||data.claimCount!==137||data.sourceSeeds.length!==52||data.chapters.length!==46)throw new Error('Book claim-evidence reference coverage mismatch');
    const sourceIds=new Set();for(const source of data.sourceSeeds){if(!source?.id||!source?.title||!source?.url||!source?.scope||sourceIds.has(source.id))throw new Error('Invalid or duplicate claim-evidence source');sourceIds.add(source.id);if(!sourceMap.has(source.id)){sourceMap.set(source.id,source);manifestData.sourceSeeds.push(source);}}
    const chapterIds=new Set(),claimIds=new Set();let claimCount=0;for(const row of data.chapters){if(!row?.chapterId||chapterIds.has(row.chapterId)||!declared.has(row.chapterId)||!Array.isArray(row.evidenceIds)||!row.evidenceIds.length||!Array.isArray(row.claims)||!row.claims.length)throw new Error('Invalid claim-evidence chapter coverage');chapterIds.add(row.chapterId);if(new Set(row.evidenceIds).size!==row.evidenceIds.length)throw new Error(`Duplicate claim-evidence id in ${row.chapterId}`);for(const id of row.evidenceIds)if(!sourceMap.has(id))throw new Error(`Unknown claim-evidence source ${id} in ${row.chapterId}`);for(const claim of row.claims){if(!claim?.claimId||claimIds.has(claim.claimId)||!Array.isArray(claim.evidenceIds)||!claim.evidenceIds.length)throw new Error(`Invalid claim-evidence claim in ${row.chapterId}`);claimIds.add(claim.claimId);claimCount++;for(const id of claim.evidenceIds){if(!row.evidenceIds.includes(id)||!sourceMap.has(id))throw new Error(`Invalid claim-evidence source ${id} in ${claim.claimId}`);}}}
    if(chapterIds.size!==declared.size||[...declared.keys()].some(id=>!chapterIds.has(id))||claimCount!==137)throw new Error('Book claim-evidence chapter/claim coverage incomplete');
    const boundary=data.authorityBoundary||{};if(boundary.presentationOnly!==true||boundary.noNewClaims!==true||boundary.noEvidenceUpgrades!==true||boundary.noProductionAuthority!==true||boundary.independentSmeStatus!=='hold')throw new Error('Book claim-evidence authority boundary weakened');
    return data;
  }
  function claimEvidenceIds(chapterId){return claimEvidenceByChapter.get(chapterId)||[];}
  function claimEvidenceRows(chapterId){return claimEvidenceClaimsByChapter.get(chapterId)||[];}
  function validateEvidenceEnrichment(data,declared,sourceMap,manifestData,auth){
    if(data?.schemaVersion!==1||data?.bookId!=='mouldmaster-book'||data?.release!==VERSION||data?.status!=='governed-publication-candidate'||!Array.isArray(data.chapterPatches)||!Array.isArray(data.sourceSeeds))throw new Error('Book evidence-enrichment ledger identity check failed');
    const permit=auth?.evidenceEnrichmentAuthorization;if(permit?.status!=='authorized'||permit?.release!==VERSION||permit?.ledger!=='data/book-evidence-enrichment-v2.json'||permit?.chapterCount!==10||permit?.sectionCount!==14||permit?.independentSmeStatus!=='hold')throw new Error('Book evidence-enrichment publication authorization missing');
    const authority=data.authorityBoundary||{};if(authority.productionUse!=='advisory-only'||authority.validatedRecipeAuthority!==false||authority.automaticMachineControl!==false||authority.universalSetpoints!==false||authority.independentSmeStatus!=='hold')throw new Error('Book evidence-enrichment authority boundary weakened');
    for(const source of data.sourceSeeds){if(!source?.id||!source?.title||!source?.url||!source?.scope)throw new Error('Incomplete evidence-enrichment source record');if(sourceMap.has(source.id))throw new Error(`Duplicate evidence-enrichment source id: ${source.id}`);sourceMap.set(source.id,source);manifestData.sourceSeeds.push(source);}
    const chapterIds=new Set(),titles=new Set();let sectionCount=0;
    for(const patch of data.chapterPatches){const chapter=declared.get(patch?.chapterId);if(!chapter||chapterIds.has(patch.chapterId))throw new Error(`Invalid or duplicate evidence-enrichment chapter: ${patch?.chapterId||'missing'}`);chapterIds.add(patch.chapterId);if(!Array.isArray(patch.sourceIds)||!Array.isArray(patch.sections)||!patch.sections.length)throw new Error(`Incomplete evidence-enrichment patch: ${patch.chapterId}`);for(const id of patch.sourceIds)if(!sourceMap.has(id))throw new Error(`Unknown evidence-enrichment source ${id} in ${patch.chapterId}`);chapter.sourceIds=[...new Set([...(chapter.sourceIds||[]),...patch.sourceIds])];for(const section of patch.sections){if(!section?.title||!section?.text||titles.has(`${patch.chapterId}::${section.title}`))throw new Error(`Invalid or duplicate evidence-enrichment section in ${patch.chapterId}`);titles.add(`${patch.chapterId}::${section.title}`);if((chapter.sections||[]).some(x=>x.title===section.title))throw new Error(`Evidence-enrichment section already exists in base chapter: ${patch.chapterId} / ${section.title}`);chapter.sections.push(section);sectionCount++;}}
    if(chapterIds.size!==10||sectionCount!==14)throw new Error('Book evidence-enrichment coverage mismatch');return data;
  }
  function validateMaterialAtlas(data,auth){
    if(data?.schemaVersion!==2||data?.bookId!=='mouldmaster-book'||data?.status!=='technical-review-material-atlas'||data?.atlasVersion!=='2026.10.01.2'||data?.bookRuntimeCompatibility!==VERSION)throw new Error('Book material atlas identity check failed');
    if(data?.canonicalCatalog?.gradeCount!==260||data?.regionalEvidence?.recordCount!==284||data?.regionalProfileIndex?.profileCount!==89)throw new Error('Book material atlas complete-coverage declaration mismatch');
    const statuses=data?.regionalEvidence?.statusCounts||{};
    if(statuses['candidate-complete']!==161||statuses['candidate-partial']!==7||statuses.conditional!==4||statuses['discovery-only']!==112)throw new Error('Book material atlas regional-status coverage mismatch');
    if(data?.regionalEvidence?.policy?.noUniversalSettings!==true||data?.regionalEvidence?.policy?.noInterpolationAcrossGrades!==true)throw new Error('Book material atlas source policy weakened');
    const permit=auth?.materialAtlasAuthorization;
    if(permit?.status!=='authorized-technical-review-appendix'||permit?.atlasVersion!==data.atlasVersion||permit?.canonicalGradeCount!==260||permit?.regionalEvidenceRowCount!==284||permit?.independentSmeStatus!=='hold')throw new Error('Book material atlas authorization missing');
    return data;
  }
  function validateMaterialCatalog(data,atlas,auth){
    if(data?.schemaVersion!==1||data?.status!=='validated'||!Array.isArray(data.manufacturers)||!Array.isArray(data.grades)||data.grades.length!==260)throw new Error('Book canonical material catalogue identity check failed');
    if(data.grades.length!==atlas?.canonicalCatalog?.gradeCount)throw new Error('Book canonical material catalogue coverage mismatch');
    const ids=new Set();
    for(const grade of data.grades){
      if(!grade?.id||!grade?.grade||!grade?.manufacturer?.name||!grade?.polymer?.family||ids.has(grade.id))throw new Error(`Invalid canonical material grade: ${grade?.id||'missing'}`);
      ids.add(grade.id);
      if(grade?.provenance?.stage!=='validated'&&grade?.provenance?.stage!=='published')throw new Error(`Canonical material grade is not validated/published: ${grade.id}`);
    }
    if((auth?.materialAtlasAuthorization||{}).canonicalCatalog!=='material-catalog-v1.json')throw new Error('Book canonical material catalogue authorization mismatch');
    return data;
  }
  function validateMaterialRegionalEvidence(data,atlas,auth){
    if(data?.version!=='2026-09-28.40'||!Array.isArray(data.records)||data.records.length!==284)throw new Error('Book regional material evidence identity check failed');
    const counts={};for(const row of data.records)counts[row?.status]=(counts[row?.status]||0)+1;
    for(const [key,value] of Object.entries(atlas.regionalEvidence.statusCounts||{}))if(counts[key]!==value)throw new Error(`Book regional material evidence status mismatch: ${key}`);
    if(data?.policy?.noUniversalSettings!==true||data?.policy?.noInterpolationAcrossGrades!==true||data?.policy?.typicalValuesAreNotSpecifications!==true)throw new Error('Book regional material evidence policy weakened');
    if((auth?.materialAtlasAuthorization||{}).regionalEvidence!=='data/asian-aus-nz-material-grade-extraction-wave2-v1.json')throw new Error('Book regional material evidence authorization mismatch');
    return data;
  }
  function materialScalar(value){
    if(value===null||value===undefined||value==='')return '—';
    if(typeof value==='boolean')return value?'yes':'no';
    return String(value);
  }
  function materialValueHtml(value,depth=0){
    if(value===null||value===undefined||typeof value!=='object')return esc(materialScalar(value));
    if(depth>3)return esc(JSON.stringify(value));
    if(Array.isArray(value)){
      if(!value.length)return '—';
      if(value.every(x=>x===null||typeof x!=='object'))return `<span>${value.map(materialScalar).map(esc).join(' · ')}</span>`;
      return `<ul class="mm-book-material-nested">${value.map(x=>`<li>${materialValueHtml(x,depth+1)}</li>`).join('')}</ul>`;
    }
    return `<dl class="mm-book-material-kv">${Object.entries(value).map(([key,val])=>`<div><dt>${esc(key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' '))}</dt><dd>${materialValueHtml(val,depth+1)}</dd></div>`).join('')}</dl>`;
  }
  function canonicalGradeHtml(grade){
    const manufacturer=grade.manufacturer?.name||'Unknown manufacturer',family=grade.polymer?.family||'Unknown polymer',provenance=grade.provenance?.stage||'unreviewed',lifecycle=grade.lifecycle?.status||'unknown',checkedAt=grade.lifecycle?.checkedAt||'not recorded';
    const properties=(grade.properties||[]).map(p=>`<tr><th scope="row">${esc(p.property||'Property')}</th><td>${esc([p.value,p.unit].filter(x=>x!==null&&x!==undefined&&x!=='').join(' '))}</td><td>${esc([p.testMethod,p.temperatureC!=null?`${p.temperatureC} °C`:'',p.loadKg!=null?`${p.loadKg} kg`:'',p.direction&&p.direction!=='not-applicable'?p.direction:''].filter(Boolean).join(' · '))}</td><td>${esc(p.limitations||'')}</td></tr>`).join('');
    const processing=(grade.processing||[]).map(p=>{const range=p.value!=null?`${p.value} ${p.unit||''}`:[p.min,p.max].some(x=>x!=null)?`${p.min??'—'}–${p.max??'—'} ${p.unit||''}`:'—';return `<tr><th scope="row">${esc(p.parameter||'Processing guidance')}</th><td>${esc(range.trim())}</td><td>${esc(p.condition||'')}</td></tr>`;}).join('');
    const sources=(grade.sources||[]).map(s=>`<li>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(s.title||s.publisher||s.id)}</b></a>`:`<b>${esc(s.title||s.publisher||s.id)}</b>`}<br><small>${esc([s.publisher,s.kind,s.documentDate].filter(Boolean).join(' · '))}</small></li>`).join('');
    return `<details class="mm-book-material-profile" data-mm-book-catalog-grade="${esc(grade.id)}"><summary><span><b>${esc(manufacturer)} — ${esc(grade.grade)}</b><small>${esc([grade.brand,family,`evidence: ${provenance}`,`commercial/source currentness: ${lifecycle}`,`checked: ${checkedAt}`].filter(Boolean).join(' · '))}</small></span><span aria-hidden="true">+</span></summary><div class="mm-book-material-profile-body"><p><b>Canonical exact-grade record.</b> Evidence integrity and product/source currentness are separate statuses: a provenance-reviewed value can still have unknown lifecycle/currentness. Supplier values remain conditional on the shown method, condition and current source documentation.</p>${grade.composition?.notes?`<p>${esc(grade.composition.notes)}</p>`:''}${properties?`<h4>Measured properties</h4><div class="mm-book-table-wrap"><table><thead><tr><th>Property</th><th>Value</th><th>Condition / method</th><th>Boundary</th></tr></thead><tbody>${properties}</tbody></table></div>`:''}${processing?`<h4>Supplier processing guidance</h4><div class="mm-book-table-wrap"><table><thead><tr><th>Parameter</th><th>Value / range</th><th>Boundary</th></tr></thead><tbody>${processing}</tbody></table></div>`:''}${sources?`<h4>Sources</h4><ul>${sources}</ul>`:''}</div></details>`;
  }
  function regionalRecordHtml(row,index){
    const maker=row.manufacturer||row.organization||row.country||'Regional evidence',single=row.grade||'',multi=Array.isArray(row.grades)?row.grades.map(x=>typeof x==='string'?x:x?.grade).filter(Boolean):[],label=single||multi.slice(0,3).join(', ')||row.recordType||row.polymer||`Record ${index+1}`,meta=[row.polymer,row.region||row.country,row.recordType,row.status].filter(Boolean).join(' · ');
    return `<details class="mm-book-material-profile" data-mm-book-regional-row="${index}"><summary><span><b>${esc(maker)} — ${esc(label)}</b><small>${esc(meta)}</small></span><span aria-hidden="true">+</span></summary><div class="mm-book-material-profile-body"><p><b>Regional evidence row ${index+1}.</b> This preserves complete source-wave context; discovery, partial and conditional rows are not promoted to exact-grade specifications.</p>${materialValueHtml(row)}</div></details>`;
  }
  function materialPageButton(kind,shown,total){
    if(shown>=total)return '';
    return `<button type="button" class="ghost" data-mm-book-material-more="${kind}">Load ${Math.min(MATERIAL_PAGE_SIZE,total-shown)} more · ${shown}/${total} shown</button>`;
  }
  function materialAtlasHtml(chapter){
    if(chapter?.id!=='material-families')return '';
    if(!materialAtlas||!materialCatalog||!materialRegionalEvidence)return '<section class="mm-book-material-atlas" data-mm-book-material-atlas><span class="eyebrow">Technical-review material reference — excluded from source-reviewed listen-all</span><h3 data-mm-book-anchor="module:material-families:atlas">Complete Material Data Atlas</h3><p data-mm-book-material-status role="status">Loading governed material evidence on demand…</p></section>';
    const gradeCount=Math.min(MATERIAL_PAGE_SIZE,materialCatalog.grades.length),regionalCount=Math.min(MATERIAL_PAGE_SIZE,materialRegionalEvidence.records.length);
    const grades=materialCatalog.grades.slice(0,gradeCount).map(canonicalGradeHtml).join('');
    const regional=materialRegionalEvidence.records.slice(0,regionalCount).map((row,index)=>regionalRecordHtml(row,index)).join('');
    const counts=materialAtlas.regionalEvidence.statusCounts;
    return `<section class="mm-book-material-atlas" data-mm-book-material-atlas><span class="eyebrow">Technical-review material reference — excluded from source-reviewed listen-all</span><h3 data-mm-book-anchor="module:material-families:atlas">Complete Material Data Atlas</h3><p>${esc(materialAtlas.boundary)}</p><p><b>Complete governed coverage:</b> ${materialCatalog.grades.length} canonical exact grades plus all ${materialRegionalEvidence.records.length} Asia/Australia/New Zealand evidence rows (${counts['candidate-complete']} complete · ${counts['candidate-partial']} partial · ${counts.conditional} conditional · ${counts['discovery-only']} discovery-only). The 89-profile regional index remains a reconciliation view, not the coverage boundary.</p><p><small>Large evidence sets are rendered progressively to keep the learner interface responsive; pagination does not change governed coverage.</small></p><details class="mm-book-material-atlas-disclosure" data-mm-book-canonical-catalog><summary><b>Canonical exact-grade catalogue</b><span>${materialCatalog.grades.length} grades</span></summary><div class="mm-book-material-atlas-list" data-mm-book-material-list="catalog">${grades}</div>${materialPageButton('catalog',gradeCount,materialCatalog.grades.length)}</details><details class="mm-book-material-atlas-disclosure" data-mm-book-regional-evidence><summary><b>Regional evidence wave</b><span>${materialRegionalEvidence.records.length} records</span></summary><div class="mm-book-material-atlas-list" data-mm-book-material-list="regional">${regional}</div>${materialPageButton('regional',regionalCount,materialRegionalEvidence.records.length)}</details></section>`;
  }
  function bindMaterialPagination(root){
    for(const button of root?.querySelectorAll?.('[data-mm-book-material-more]')||[]){
      button.addEventListener('click',()=>{
        const kind=button.dataset.mmBookMaterialMore,list=root.querySelector(`[data-mm-book-material-list="${kind}"]`);
        if(!list)return;
        const rows=kind==='catalog'?materialCatalog?.grades||[]:materialRegionalEvidence?.records||[];
        const shown=list.children.length,next=Math.min(rows.length,shown+MATERIAL_PAGE_SIZE);
        const html=kind==='catalog'?rows.slice(shown,next).map(canonicalGradeHtml).join(''):rows.slice(shown,next).map((row,index)=>regionalRecordHtml(row,shown+index)).join('');
        list.insertAdjacentHTML('beforeend',html);
        if(next>=rows.length)button.remove();else button.textContent=`Load ${Math.min(MATERIAL_PAGE_SIZE,rows.length-next)} more · ${next}/${rows.length} shown`;
      });
    }
  }
  function smeStatusText(){if(!bookSmeReview)return 'Independent human SME review: status unavailable — do not infer approval.';const total=bookSmeReview.chapterIds.length,approved=new Set(bookSmeReview.reviews.filter(r=>r?.conclusion==='approved').map(r=>r.chapterId)).size;return `Independent human SME review: ${bookSmeReview.status==='validated'&&approved===total?'validated':'pending'} — ${approved}/${total} governed modules approved. Reader chapters are derived groupings, not separate SME approvals.`;}
  function canonicalUrl(source){return publicationAuthorization?.canonicalAcademicEvidenceUrls?.[source?.id]||CANONICAL_SOURCE_URLS[source?.id]||source?.canonicalUrl||source?.url||'';}
  async function loadManifest(){
    const auth=await verifiedJson(AUTH_PATH,AUTH_GIT_BLOB_SHA1);validateIntegrityAuthorization(auth);
    const data=await verifiedJson(`${BOOK_DATA}book-manifest-v1.json`);if(data?.schema!==1||data?.bookId!=='mouldmaster-book'||!Array.isArray(data.parts)||!Array.isArray(data.sourceSeeds))throw new Error('Book manifest identity check failed');
    const declared=new Map((data.parts||[]).flatMap(p=>p.chapters||[]).map(ch=>[ch.id,ch]));if(declared.size!==(data.parts||[]).reduce((n,p)=>n+(p.chapters||[]).length,0))throw new Error('Duplicate chapter id in Book manifest');
    const sourceMap=new Map((data.sourceSeeds||[]).map(source=>[source.id,source]));if(sourceMap.size!==data.sourceSeeds.length)throw new Error('Duplicate source id in Book manifest');const authoredIds=new Set(),batches=await Promise.all(BATCH_PATHS.map(path=>verifiedJson(path)));
    for(const batch of batches){if(batch?.schema!==1||batch?.bookId!==data.bookId||!Array.isArray(batch.chapters))throw new Error('Book authored-batch identity check failed');for(const source of batch.sourceSeeds||[]){if(!source?.id||!source?.title||!source?.url||!source?.scope)throw new Error('Incomplete Book source record');if(sourceMap.has(source.id))throw new Error(`Duplicate authored source id: ${source.id}`);sourceMap.set(source.id,source);data.sourceSeeds.push(source);}for(const authored of batch.chapters){if(!authored?.id||authoredIds.has(authored.id))throw new Error(`Duplicate authored chapter id: ${authored?.id||'missing'}`);authoredIds.add(authored.id);const chapter=declared.get(authored.id);if(!chapter)throw new Error(`Authored chapter is not declared in manifest: ${authored.id}`);const effectiveState=authored.state||(batch.status==='technical-review'?'technical-review':chapter.state);if(effectiveState==='verified')throw new Error(`Authored draft cannot self-promote to verified: ${authored.id}`);if(!authored.applicability||!Array.isArray(authored.sections)||!authored.sections.length)throw new Error(`Incomplete authored chapter: ${authored.id}`);for(const sourceId of authored.sourceIds||[])if(!sourceMap.has(sourceId))throw new Error(`Unknown source ${sourceId} in ${authored.id}`);Object.assign(chapter,authored,{state:effectiveState});}}
    if(authoredIds.size!==declared.size)throw new Error('Book authored chapter coverage is incomplete');
    readerArchitecture=validateReaderArchitecture(await verifiedJson(READER_PATH),declared,auth);
    editorialExpansionReview=validateEditorialExpansionReview(await verifiedJson(EDITORIAL_REVIEW_PATH),declared,auth);
    qualificationReview=validateQualificationReview(await verifiedJson(QUAL_PATH));
    highRiskReview=await verifiedJson(HIGH_RISK_PATH);if(highRiskReview?.schema!==1||highRiskReview?.bookId!==data.bookId)throw new Error('Book high-risk evidence identity mismatch');
    for(const ledger of [highRiskReview,qualificationReview])for(const source of ledger?.newEvidence||[])if(source?.id&&!sourceMap.has(source.id))sourceMap.set(source.id,source);
    claimEvidenceReference=validateClaimEvidenceReference(await verifiedJson(CLAIM_EVIDENCE_PATH),declared,sourceMap,data,auth);claimEvidenceByChapter=new Map(claimEvidenceReference.chapters.map(row=>[row.chapterId,row.evidenceIds]));claimEvidenceClaimsByChapter=new Map(claimEvidenceReference.chapters.map(row=>[row.chapterId,row.claims]));
    workedCaseLedger=validateWorkedCases(await verifiedJson(WORKED_CASES_PATH),declared,sourceMap,data,auth);workedCasesByChapter=new Map();for(const item of workedCaseLedger.cases){const rows=workedCasesByChapter.get(item.chapterId)||[];rows.push(item);workedCasesByChapter.set(item.chapterId,rows);}
    diagramLedger=validateEngineeringDiagrams(await verifiedJson(DIAGRAMS_PATH),declared,auth);diagramsByChapter=new Map();for(const item of diagramLedger.diagrams){const rows=diagramsByChapter.get(item.chapterId)||[];rows.push(item);diagramsByChapter.set(item.chapterId,rows);}
    evidenceEnrichmentLedger=validateEvidenceEnrichment(await verifiedJson(ENRICHMENT_PATH),declared,sourceMap,data,auth);
    bookSmeReview=validateSmeReview(await verifiedJson(SME_PATH),declared);
    applyPublicationAuthorization(data,declared,auth);return data;
  }
  function failBook(error){
    if(ui){ui.summary.textContent='Book manifest, governed content or publication authorization could not be verified. Technical content remains unavailable.';if(ui.smeStatus)ui.smeStatus.textContent='Independent human SME review: status unavailable — do not infer approval.';ui.parts.innerHTML='<section class="card"><h3>Book unavailable</h3><p>The governed Book release failed its runtime identity or exact-byte checks, so MouldMaster has failed closed.</p></section>';}
    console.error('MouldMaster Book:',error);
  }
  async function ensureManifest(){
    if(manifest)return manifest;
    if(!manifestPromise)manifestPromise=loadManifest().then(data=>{manifest=data;renderOverview();window.dispatchEvent(new CustomEvent('mm:book-manifest-ready',{detail:{version:VERSION,contentRelease:publicationAuthorization?.version||''}}));return data}).catch(error=>{manifestPromise=null;failBook(error);throw error});
    return manifestPromise;
  }
  async function ensureMaterialData(){
    await ensureManifest();
    if(materialAtlas&&materialCatalog&&materialRegionalEvidence)return {atlas:materialAtlas,catalog:materialCatalog,regional:materialRegionalEvidence};
    if(!materialPromise)materialPromise=(async()=>{
      const atlas=validateMaterialAtlas(await verifiedJson(MATERIAL_ATLAS_PATH),publicationAuthorization);
      const catalog=validateMaterialCatalog(await verifiedJson(MATERIAL_CATALOG_PATH),atlas,publicationAuthorization);
      const regional=validateMaterialRegionalEvidence(await verifiedJson(MATERIAL_REGIONAL_PATH),atlas,publicationAuthorization);
      materialAtlas=atlas;materialCatalog=catalog;materialRegionalEvidence=regional;
      materialSearchIndex={
        catalog:catalog.grades.map(g=>[g.manufacturer?.name,g.brand,g.grade,g.polymer?.family,...(g.aliases||[])].join(' ').toLowerCase()),
        regional:regional.records.map(row=>JSON.stringify(row).toLowerCase())
      };
      return {atlas,catalog,regional};
    })().catch(error=>{materialPromise=null;throw error});
    return materialPromise;
  }
  async function hydrateMaterialAtlas(){
    const shell=ui?.reader?.querySelector?.('[data-mm-book-material-atlas]');if(!shell)return;
    try{await ensureMaterialData();if(!shell.isConnected)return;const chapter=allChapters().find(ch=>ch.id==='material-families');shell.outerHTML=materialAtlasHtml(chapter);bindMaterialPagination(ui.reader);emitBookRender('material-atlas','material-families');}
    catch(error){if(shell.isConnected)shell.innerHTML='<span class="eyebrow">Technical-review material reference</span><h3>Material Data Atlas unavailable</h3><p>The governed material files could not be verified, so the appendix failed closed.</p>';console.error('MouldMaster Book material atlas:',error);}
  }
  const allChapters=()=> (manifest?.parts||[]).flatMap(part=>part.chapters||[]),allReaderChapters=()=>readerArchitecture?.readerChapters||[],verifiedChapters=()=>allChapters().filter(ch=>ch.state==='verified');
  function evidenceMap(){const map=new Map((manifest?.sourceSeeds||[]).map(x=>[x.id,x]));for(const ledger of [highRiskReview,qualificationReview])for(const x of ledger?.newEvidence||[])if(x?.id&&!map.has(x.id))map.set(x.id,x);for(const x of workedCaseLedger?.sourceSeeds||[])if(x?.id&&!map.has(x.id))map.set(x.id,x);return map;}
  function evidenceIdentity(id){const row=EVIDENCE_IDENTITIES[String(id)]||null;return row?{...row}:null;}
  function evidenceIdentityMeta(id){const row=evidenceIdentity(id);if(!row)return '';return [`Evidence family: ${row.family}`,row.sameAs&&row.sameAs!==String(id)?`Same underlying record as: ${row.sameAs}`:'' ].filter(Boolean).join(' · ');}
  function evidenceItem(id){const s=evidenceMap().get(id);if(!s)return `<code>${esc(id)}</code>`;const label=esc(s.title||s.id),meta=esc([s.issuer,s.scope].filter(Boolean).join(' — ')),identity=esc([`Evidence record: ${id}`,evidenceIdentityMeta(id)].filter(Boolean).join(' · ')),url=canonicalUrl(s);return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${label}</b></a>${meta?`<br><small>${meta}</small>`:''}${identity?`<br><small>${identity}</small>`:''}`:`<b>${label}</b>${meta?`<br><small>${meta}</small>`:''}${identity?`<br><small>${identity}</small>`:''}`;}
  function sourceHtml(chapter){const map=evidenceMap(),ids=[...new Set([...(chapter.sourceIds||[]),...claimEvidenceIds(chapter.id)])],sources=ids.map(id=>map.get(id)).filter(Boolean);return sources.length?`<h4>Chapter evidence anchors</h4><ul>${sources.map(s=>{const url=canonicalUrl(s),identity=evidenceIdentityMeta(s.id);return `<li>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${esc(s.title)}</b></a>`:`<b>${esc(s.title)}</b>`}<br><small>${esc([s.id,identity,s.scope].filter(Boolean).join(' — '))}</small></li>`}).join('')}</ul>`:'<p>No chapter source anchor has been attached.</p>';}
  function claimTraceHtml(chapter){if(!qualificationReview)return '<p><small>Publication claim trace unavailable.</small></p>';const governed=claimEvidenceRows(chapter.id),prefix=`${chapter.id}-`,resolved=(qualificationReview.resolutions||[]).filter(x=>String(x.claimId||'').startsWith(prefix)),qualified=(qualificationReview.remainingQualifiedClaims||[]).filter(x=>String(x.claimId||'').startsWith(prefix));const governedRows=governed.map(x=>`<li><b>${esc(x.claimId)} — governed evidence</b><ul>${x.evidenceIds.map(id=>`<li>${evidenceItem(id)}</li>`).join('')}</ul></li>`).join(''),rows=resolved.map(x=>`<li><b>${esc(x.claimId)} — ${esc(x.newConclusion||'reviewed')}</b><p>${esc(x.reason||'')}</p>${(x.evidence||[]).length?`<ul>${x.evidence.map(id=>`<li>${evidenceItem(id)}</li>`).join('')}</ul>`:''}</li>`).join(''),qs=qualified.map(x=>`<li><b>${esc(x.claimId)} — scope-qualified</b><p>${esc(x.reason||'')}</p><small>${esc(x.qualificationType||'scope boundary')} · publication blocking: ${x.blockingPublication?'yes':'no'}</small></li>`).join('');return `<details class="mm-book-claim-trace"><summary><b>Publication claim trace</b> — evidence and publication decisions</summary><p>This trace exposes the governed claim-review evidence for every claim in the module, plus any later evidence upgrade or deliberate scope qualification. It supplements, rather than replaces, the chapter's source anchors.</p>${governedRows?`<h4>Governed claim evidence</h4><ul>${governedRows}</ul>`:''}${rows||qs?`<h4>Later publication decisions</h4><ul>${rows}${qs}</ul>`:''}</details>`;}
  function diagramHtml(chapter){const items=diagramsByChapter.get(chapter.id)||[];return items.map(item=>`<figure class="mm-book-engineering-diagram" data-mm-book-diagram="${esc(item.id)}"><img src="./${esc(item.asset)}" alt="${esc(item.alt)}" loading="lazy" decoding="async"><figcaption><b>${esc(item.title)}</b><br><span>${esc(item.caption)}</span><br><small>Governed instructional diagram · not to scale · independent human SME review remains pending.</small></figcaption></figure>`).join('');}
  function workedCaseHtml(chapter){
    const items=workedCasesByChapter.get(chapter.id)||[];
    const list=(title,rows)=>Array.isArray(rows)&&rows.length?`<h4>${esc(title)}</h4><ul>${rows.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
    return items.map(item=>{
      const table=item.table&&Array.isArray(item.table.columns)&&Array.isArray(item.table.rows)?`<div class="mm-book-table-wrap"><table><thead><tr>${item.table.columns.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${item.table.rows.map(row=>`<tr>${row.map((x,i)=>i===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
      return `<section class="mm-book-worked-case" data-mm-worked-case="${esc(item.id)}"><span class="eyebrow">Worked example — synthetic teaching data</span><h3 data-mm-book-anchor="case:${esc(item.id)}">${esc(item.title)}</h3><p>${esc(item.setup)}</p>${table}${list('Observations',item.observations)}${list('Assumptions',item.assumptions)}${list('Units',item.units)}${list('Calculation / reasoning',item.calculationSteps)}<h4>Interpretation</h4><p>${esc(item.interpretation)}</p>${list('Boundaries',item.boundaries)}<h4>Evidence anchors</h4><ul>${item.sourceIds.map(id=>`<li>${evidenceItem(id)}</li>`).join('')}</ul><p><small>Case claim: ${esc(item.claims[0].id)} · ${esc(item.claims[0].conclusion)}. Independent human SME review remains pending.</small></p></section>`;
    }).join('');
  }
  function readerReferencesHtml(reader,modules){
    const ids=new Set();
    for(const ch of modules){for(const id of ch.sourceIds||[])ids.add(id);for(const id of claimEvidenceIds(ch.id))ids.add(id);}
    for(const patch of evidenceEnrichmentLedger?.chapterPatches||[])if(reader.moduleIds.includes(patch.chapterId))for(const id of patch.sourceIds||[])ids.add(id);
    for(const item of workedCaseLedger?.cases||[])if(reader.moduleIds.includes(item.chapterId))for(const id of item.sourceIds||[])ids.add(id);
    if(!ids.size)return '';
    return `<section class="mm-book-reader-references"><h3 data-mm-book-anchor="reader:${esc(reader.id)}:references">Chapter references</h3><p><small>Conventional reader view of governed evidence used by the modules, enrichment and worked cases in this chapter.</small></p><ul>${[...ids].map(id=>`<li>${evidenceItem(id)}</li>`).join('')}</ul></section>`;
  }
  function readerLearningHtml(reader){
    return `<section class="mm-book-reader-learning"><span class="eyebrow">${esc(reader.depthBand)} depth</span><h3 data-mm-book-anchor="reader:${esc(reader.id)}:learning">Learning check</h3><h4 data-mm-book-anchor="reader:${esc(reader.id)}:learning:objectives">By the end of this chapter</h4><ul>${reader.learningObjectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4 data-mm-book-anchor="reader:${esc(reader.id)}:learning:check">Check your understanding</h4><ol>${reader.checkQuestions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h4 data-mm-book-anchor="reader:${esc(reader.id)}:learning:apply">Apply it</h4><p>${esc(reader.applyPrompt)}</p><p><small><b>Evidence boundary:</b> ${esc(reader.evidenceBoundary)}</small></p></section>`;
  }
  function verifiedChapterHtml(chapter,options={}){const sections=Array.isArray(chapter.sections)?chapter.sections:[],includeTechnicalMaterial=options.includeTechnicalMaterial!==false;return `<article class="mm-book-verified-chapter" data-mm-book-verified-chapter="${esc(chapter.id)}"><span class="eyebrow">Source evidence reviewed</span><h2 data-mm-book-anchor="chapter:${esc(chapter.id)}">${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'See attached evidence and controlling documentation.')}</p>${sections.map((s,index)=>`<section><h3 data-mm-book-anchor="chapter:${esc(chapter.id)}:section:${index}">${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${diagramHtml(chapter)}${workedCaseHtml(chapter)}${includeTechnicalMaterial?materialAtlasHtml(chapter):''}${sourceHtml(chapter)}${claimTraceHtml(chapter)}</article>`;}
  function readerModuleHtml(chapter){
    const sections=Array.isArray(chapter.sections)?chapter.sections:[],verified=chapter.state==='verified';
    const status=verified?'Source evidence reviewed':stateLabel(chapter.state);
    const boundary=!verified&&chapter.reviewBoundary?`<div class="callout"><b>Review boundary:</b> ${esc(chapter.reviewBoundary)}</div>`:'';
    return `<section class="mm-book-reader-module" data-mm-book-reader-module="${esc(chapter.id)}"><span class="eyebrow">${esc(status)} · governed module</span><h3 data-mm-book-anchor="module:${esc(chapter.id)}">${esc(chapter.title)}</h3><p><b>Applicability:</b> ${esc(chapter.applicability||'See governed module scope.')}</p>${boundary}${sections.map((s,index)=>`<section><h4 data-mm-book-anchor="module:${esc(chapter.id)}:section:${index}">${esc(s.title||'')}</h4><p>${esc(s.text||'')}</p></section>`).join('')}${diagramHtml(chapter)}${workedCaseHtml(chapter)}${chapter.id==='material-families'?materialAtlasHtml(chapter):''}${sourceHtml(chapter)}${verified?claimTraceHtml(chapter):''}</section>`;
  }
  function readerChapterHtml(reader){
    const modules=reader.moduleIds.map(id=>allChapters().find(ch=>ch.id===id));if(modules.some(x=>!x))throw new Error(`Reader chapter contains unavailable governed module: ${reader.id}`);
    const verified=modules.every(ch=>ch.state==='verified'),label=verified?'Source evidence reviewed modules':'Contains technical-review module(s)';
    return `<article class="mm-book-reader-chapter" data-mm-book-reader-chapter="${esc(reader.id)}"><span class="eyebrow">Reader chapter · ${esc(reader.depthBand)} depth · ${esc(label)}</span><h2 data-mm-book-anchor="reader:${esc(reader.id)}">${esc(reader.title)}</h2><p>${esc(reader.goal)}</p>${reader.sequencePrompt?`<div class="callout"><b>How to read this chapter:</b> ${esc(reader.sequencePrompt)}</div>`:''}<div class="callout"><b>How this chapter is governed:</b> This reader chapter is a structural grouping of ${modules.length} governed module${modules.length===1?'':'s'}. Technical claims, evidence status and independent SME review remain attached to those modules.</div>${modules.map(readerModuleHtml).join('')}${readerLearningHtml(reader)}${readerReferencesHtml(reader,modules)}</article>`;
  }
  function renderOverview(){
    if(!ui||!manifest||!readerArchitecture)return;
    const verified=verifiedChapters(),review=allChapters().filter(ch=>ch.state==='technical-review'),readers=allReaderChapters();
    ui.summary.textContent=`${readers.length} reader chapters · ${allChapters().length} governed modules · ${review.length} modules in technical review · ${verified.length} source-reviewed modules`;
    if(ui.smeStatus)ui.smeStatus.textContent=smeStatusText();
    ui.parts.innerHTML=`<section class="card"><span class="eyebrow">Reader contents</span><h3>20 substantial chapters, backed by 46 governed modules</h3><p class="muted">Reader chapters improve flow and reduce fragmentation. The underlying module IDs remain the evidence, claim and SME-review units.</p><div>${readers.map((reader,index)=>{const modules=reader.moduleIds.map(id=>allChapters().find(ch=>ch.id===id)).filter(Boolean),verifiedModules=modules.filter(ch=>ch.state==='verified').length;return `<button type="button" class="ghost mm-book-chapter-button" data-mm-book-reader-chapter-open="${esc(reader.id)}"><b>${index+1}. ${esc(reader.title)}</b><br><small>${esc(reader.depthBand)} · ${modules.length} governed module${modules.length===1?'':'s'} · ${verifiedModules}/${modules.length} source-reviewed</small></button>`}).join('')}</div><details class="mm-book-governed-index"><summary><b>Governed module index</b> — 46 traceable review units</summary>${(manifest.parts||[]).map((part,partIndex)=>`<section><h4>${esc(part.title)}</h4><div>${(part.chapters||[]).map((chapter,chapterIndex)=>`<button type="button" class="ghost mm-book-chapter-button" data-mm-book-chapter="${esc(chapter.id)}"><b>${chapterIndex+1}. ${esc(chapter.title)}</b><br><small>${esc(chapter.level)} · ${esc(stateLabel(chapter.state))}</small></button>`).join('')}</div></section>`).join('')}</details></section>`;
    ui.parts.querySelectorAll('[data-mm-book-reader-chapter-open]').forEach(b=>b.addEventListener('click',()=>showReaderChapter(b.dataset.mmBookReaderChapterOpen)));
    ui.parts.querySelectorAll('[data-mm-book-chapter]').forEach(b=>b.addEventListener('click',()=>showChapter(b.dataset.mmBookChapter)));
    ui.listen.disabled=!verified.length;ui.listen.textContent=verified.length?'Listen to source-reviewed Book':'Listening unlocks after source evidence review';
  }
  function showReaderChapter(id){
    const reader=allReaderChapters().find(x=>x.id===id);if(!reader||!ui)return;
    contentsScrollY=bookScrollTop();restoreBookChrome();const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';
    ui.reader.innerHTML=`${back}${readerChapterHtml(reader)}`;ui.contents.hidden=true;ui.reader.hidden=false;bindBack();bindMaterialPagination(ui.reader);rememberReadingPosition('reader-chapter',id,reader.title,0);scrollBookReaderToTop();emitBookRender('reader-chapter',id);
    if(reader.moduleIds.includes('material-families'))void hydrateMaterialAtlas();
  }
  function restoreBookChrome(){if(!ui)return;ui.hero.hidden=false;ui.accuracy.hidden=false;}function stopBookSpeech(){try{window.MMReadAloud?.stop?.();}catch(_){}}function bookScrollTop(){const root=bookScrollRoot();return Math.max(0,isDocumentScrollRoot(root)?document.scrollingElement?.scrollTop||0:root.scrollTop||0);}function scrollBookReaderToTop(){requestAnimationFrame(()=>{if(!ui?.reader)return;scrollBookBy(ui.reader.getBoundingClientRect().top-bookViewportTop());const heading=ui.reader.querySelector('h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});}function showContents({restoreScroll=true}={}){if(!ui)return;stopBookSpeech();const active=document.activeElement;if(active&&ui.reader?.contains(active)&&typeof active.blur==='function')active.blur();restoreBookChrome();ui.reader.hidden=true;ui.contents.hidden=false;void ui.contents.offsetHeight;if(restoreScroll)scrollBookTo(contentsScrollY);}function bindBack(){ui?.reader?.querySelector('[data-mm-book-back]')?.addEventListener('click',()=>showContents());}
  function emitBookRender(kind,id=''){window.dispatchEvent(new CustomEvent('mm:book-render',{detail:{kind,id}}));}function showChapter(id){const chapter=allChapters().find(ch=>ch.id===id);if(!chapter||!ui)return;contentsScrollY=bookScrollTop();const sections=Array.isArray(chapter.sections)?chapter.sections:[];restoreBookChrome();const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`;else if(chapter.state==='technical-review'&&sections.length)ui.reader.innerHTML=`${back}<span class="eyebrow">Technical review draft — source evidence review incomplete</span><h2>${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'Under review.')}</p><div class="callout"><b>Review boundary:</b> ${esc(chapter.reviewBoundary||'This draft is visible for technical review. Do not treat it as a machine setting, safety procedure or source-reviewed production instruction.')}</div>${sections.map((s,index)=>`<section><h3 data-mm-book-anchor="chapter:${esc(chapter.id)}:section:${index}">${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${sourceHtml(chapter)}`;else ui.reader.innerHTML=`${back}<span class="eyebrow">${esc(stateLabel(chapter.state))}</span><h2>${esc(chapter.title)}</h2><p><b>This chapter is not being published as technical teaching content yet.</b></p><p>MouldMaster is reviewing the claims, applicability and sources first.</p>${sourceHtml(chapter)}`;ui.contents.hidden=true;ui.reader.hidden=false;bindBack();rememberReadingPosition('chapter',id,chapter.title,0);scrollBookReaderToTop();emitBookRender('chapter',id);if(id==='material-families')void hydrateMaterialAtlas();}
  function startVerifiedListening(){if(!ui)return;const verified=verifiedChapters();if(!verified.length)return;const reader=window.MMReadAloud,details=document.querySelector('.mm-read-aloud details'),play=document.querySelector('.mm-read-aloud [data-mm-read="play"]');if(!reader?.supported||!details||!play){ui.summary.textContent='Source-reviewed Book text is available to read, but device speech synthesis is unavailable.';return;}reader.stop?.();const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';ui.reader.innerHTML=`${back}${verified.map(chapter=>verifiedChapterHtml(chapter,{includeTechnicalMaterial:false})).join('')}`;ui.contents.hidden=true;ui.hero.hidden=true;ui.accuracy.hidden=true;ui.reader.hidden=false;bindBack();scrollBookReaderToTop();requestAnimationFrame(()=>{reader.refresh?.();details.open=true;play.click();});emitBookRender('listening');}
  function openBook(){if(!ui)return;previousView=[...document.querySelectorAll('.view')].find(v=>!v.classList.contains('hidden')&&v!==ui.view)||previousView;document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));ui.view.classList.remove('hidden');restoreBookChrome();open=true;setBookInstantScroll(true);document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));ui.nav.classList.add('active');const title=document.getElementById('pageTitle'),subtitle=document.getElementById('pageSubtitle');if(title)title.textContent='Book';if(subtitle)subtitle.textContent='Evidence-governed injection moulding reference — 20 reader chapters preserve 46 module-level claim and source boundaries.';contentsScrollY=0;showContents({restoreScroll:false});scrollBookTo(0);emitBookRender('contents');if(!manifest){ui.summary.textContent='Loading governed Book content on demand…';ui.smeStatus.textContent='Independent human SME review status loads with the Book content.';void ensureManifest().catch(()=>{});}}
  async function openChapter(id){openBook();try{await ensureManifest();showChapter(id);}catch(_){}}
  async function openResume(){
    const saved=readResume();if(!saved){openBook();return false}
    openBook();
    try{
      await ensureManifest();const snapshot={...saved};
      const exists=snapshot.kind==='reader-chapter'?allReaderChapters().some(x=>x.id===snapshot.id):allChapters().some(x=>x.id===snapshot.id);
      if(!exists){clearResume();showContents();return false}
      if(snapshot.kind==='reader-chapter')showReaderChapter(snapshot.id);else showChapter(snapshot.id);
      restoreReadingPosition(snapshot);return true
    }catch(_){return false}
  }
  function getResume(){const saved=readResume();return saved?{...saved}:null}
  function leaveBook(){if(!open)return;flushReadingPosition({notify:true});stopBookSpeech();open=false;ui?.view?.classList.add('hidden');ui?.nav?.classList.remove('active');setBookInstantScroll(false);}
  function searchBook(query){const q=String(query||'').trim().toLowerCase();if(q.length<2||!manifest)return[];const matches=allChapters().filter(ch=>[ch.title,ch.applicability,...(ch.sections||[]).flatMap(s=>[s.title,s.text])].join(' ').toLowerCase().includes(q));const materialHit=materialSearchIndex.catalog.some(text=>text.includes(q))||materialSearchIndex.regional.some(text=>text.includes(q));if(materialHit){const chapter=allChapters().find(ch=>ch.id==='material-families');if(chapter&&!matches.includes(chapter))matches.unshift(chapter);}return matches.slice(0,6);}
  const normalizeMaterialSearch=value=>String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  async function coldMaterialSearchTerms(){if(materialSearchIndex.catalog.length||materialSearchIndex.regional.length)return [...materialSearchIndex.catalog,...materialSearchIndex.regional];if(!coldMaterialSearchPromise)coldMaterialSearchPromise=verifiedJson(MATERIAL_SEARCH_INDEX_PATH,MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1).then(data=>{const counts=data?.sourceCounts||{},entries=Array.isArray(data?.entries)?data.entries:[];if(data?.schemaVersion!==1||data?.release!=='2026.10.04.3'||counts.canonicalExactGrades!==260||counts.regionalEvidenceRows!==284||counts.total!==544||entries.length!==544)throw new Error('Book material search index identity check failed');const terms=entries.map(item=>String(item?.search||'').trim()).filter(Boolean);if(terms.length!==544)throw new Error('Book material search index coverage mismatch');return terms;}).catch(error=>{coldMaterialSearchPromise=null;throw error});return coldMaterialSearchPromise;}
  async function coldMaterialHit(query){const normalized=normalizeMaterialSearch(query),tokens=normalized.split(/\s+/).filter(Boolean);if(tokens.length===0)return false;const hot=[...materialSearchIndex.catalog,...materialSearchIndex.regional];if(hot.some(text=>tokens.every(token=>normalizeMaterialSearch(text).includes(token))))return true;try{const terms=await coldMaterialSearchTerms();return terms.some(text=>tokens.every(token=>text.includes(token)));}catch(_){return false;}}
  async function appendBookSearchResults(){const input=document.getElementById('globalSearch'),host=document.getElementById('searchResults');if(!input||!host)return;const raw=String(input.value||''),q=raw.trim().toLowerCase();if(q.length<2)return;try{await ensureManifest();}catch(_){return}const rows=searchBook(q);if(!rows.some(ch=>ch.id==='material-families')&&await coldMaterialHit(q)){const materialChapter=allChapters().find(ch=>ch.id==='material-families');if(materialChapter)rows.unshift(materialChapter);}if(String(input.value||'').trim().toLowerCase()!==q)return;host.querySelectorAll('[data-mm-book-search-result]').forEach(x=>x.remove());for(const chapter of rows.slice(0,6)){const button=document.createElement('button');button.type='button';button.className='search-item';button.dataset.mmBookSearchResult='1';const title=document.createElement('b');title.textContent=`Book: ${chapter.title}`;const br=document.createElement('br'),meta=document.createElement('span');meta.className='muted tiny';meta.textContent=`${chapter.level} · evidence-governed chapter`;button.append(title,br,meta);button.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}void openChapter(chapter.id)});host.appendChild(button);}}
  function installBookSearch(){if(window.__MM_BOOK_SEARCH_BOUND__===VERSION)return true;const base=window.doSearch;if(typeof base!=='function')return false;window.doSearch=function(){const result=base.apply(this,arguments);void appendBookSearchResults();return result};window.__MM_BOOK_SEARCH_BOUND__=VERSION;return true;}
  function bindBookSearchInput(){if(window.__MM_BOOK_SEARCH_INPUT_BOUND__===VERSION)return;document.addEventListener('input',event=>{if(event.target?.id==='globalSearch')void appendBookSearchResults();});window.__MM_BOOK_SEARCH_INPUT_BOUND__=VERSION;}
  function armBookSearch(){bindBookSearchInput();if(installBookSearch())return;window.addEventListener('mm:domains-ready',installBookSearch,{once:true});window.addEventListener('load',installBookSearch,{once:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installBookSearch,{once:true});else queueMicrotask(installBookSearch);}
  function createUI(){const nav=document.getElementById('nav'),main=document.querySelector('#mainContent,.main,main');if(!nav||!main||document.getElementById('mmBookView'))return;const button=document.createElement('button');button.type='button';button.dataset.mmBookTab='1';button.innerHTML='<span class="mm-book-nav-icon" aria-hidden="true"></span><span>Book</span>';button.setAttribute('aria-label','Book');const listening=nav.querySelector('[data-mm-listening-tab]'),path=nav.querySelector('[data-view="path"]');(listening||path)?.insertAdjacentElement('afterend',button);if(!listening&&!path)nav.prepend(button);const view=document.createElement('section');view.id='mmBookView';view.className='view hidden';view.innerHTML=`<section class="card" data-mm-book-hero><span class="eyebrow">MouldMaster Book</span><h2>Injection moulding from foundations to advanced troubleshooting</h2><p>The Book is source-first and evidence-governed. Twenty reader chapters group 46 traceable modules for a clearer learning flow. Source-reviewed modules retain their applicability and exclusions; machine, material, mould, hot-runner and workplace-specific requirements remain controlling.</p><p data-mm-book-summary>Loading governed Book manifest…</p><p data-mm-book-sme-status class="muted">Loading independent human SME review status…</p><div class="mm-book-hero-actions"><button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after source evidence review</button></div></section><section data-mm-book-contents><div data-mm-book-parts></div></section><section class="card" data-mm-book-reader hidden></section><section class="card" data-mm-book-accuracy><h3>Accuracy and assurance boundary</h3><p><b>Source evidence reviewed</b> applies to the governed module wording, not to a reader-chapter title. Reader chapters are structural groupings and cannot upgrade evidence status. The Book does not replace current grade, machine, mould, hot-runner, product or site-specific documentation.</p><p><b>Independent validation:</b> source evidence review does not imply independent human SME approval, physical-device validation, curriculum SME approval, learner-outcome validation, accreditation or production validation. Those remain separate external gates.</p></section>`;main.appendChild(view);ui={view,nav:button,hero:view.querySelector('[data-mm-book-hero]'),accuracy:view.querySelector('[data-mm-book-accuracy]'),summary:view.querySelector('[data-mm-book-summary]'),smeStatus:view.querySelector('[data-mm-book-sme-status]'),parts:view.querySelector('[data-mm-book-parts]'),contents:view.querySelector('[data-mm-book-contents]'),reader:view.querySelector('[data-mm-book-reader]'),listen:view.querySelector('[data-mm-book-mode="listen"]')};button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBook();});ui.listen.addEventListener('click',startVerifiedListening);}
  async function init(){createUI();bindBookScrollRoot();armBookSearch();return true;}
  document.addEventListener('click',event=>{const target=event.target?.closest?.('nav button,[data-view],[data-page]');if(!target||target.dataset.mmBookTab)return;if(open)leaveBook();},true);
  let ready;
  bindBookSearchInput();
  window.MMBook=Object.freeze({version:VERSION,open:openBook,openResume,getResume,clearResume,resumeStorageKey,openChapter,openReaderChapter:async id=>{openBook();try{await ensureManifest();showReaderChapter(id);}catch(_){}},search:searchBook,load:ensureManifest,loadMaterials:ensureMaterialData,getManifest:()=>manifest,getReaderArchitecture:()=>readerArchitecture,getEditorialExpansionReview:()=>editorialExpansionReview,getPublicationAuthorization:()=>publicationAuthorization,getSmeReview:()=>bookSmeReview,getQualificationReview:()=>qualificationReview,getWorkedCases:()=>workedCaseLedger,getEvidenceEnrichment:()=>evidenceEnrichmentLedger,getClaimEvidenceReference:()=>claimEvidenceReference,getEngineeringDiagrams:()=>diagramLedger,getMaterialAtlas:()=>materialAtlas,getMaterialCatalog:()=>materialCatalog,getMaterialRegionalEvidence:()=>materialRegionalEvidence,getEvidenceIdentity:evidenceIdentity,getIntegrityMap:()=>integrityMap?{...integrityMap}:null,verifiedChapters,startVerifiedListening,get ready(){return ready;}});
  ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',()=>resolve(init()),{once:true})).then(x=>x):init();
})();
