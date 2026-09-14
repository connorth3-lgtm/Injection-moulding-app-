/* MouldMaster Book runtime — evidence-governed publication authorization. */
(function(){
  'use strict';
  const VERSION='2026.09.15.1';
  const BOOK_DATA='./src/domains/learning/book-data/';
  const AUTH_PATH=`${BOOK_DATA}book-publication-authorization-v1.json`;
  const BATCH_PATHS=[
    `${BOOK_DATA}book-authored-foundations-v1.json`,
    `${BOOK_DATA}book-evidence-registry-v1.json`,
    `${BOOK_DATA}book-chapters-materials-machine-v1.json`,
    `${BOOK_DATA}book-authored-remaining-v1.json`
  ];
  let manifest=null,publicationAuthorization=null,ui=null,previousView=null,open=false;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateLabel=state=>({planned:'Planned','source-review':'Source review','technical-review':'Technical review',verified:'Evidence verified',hold:'Hold'}[state]||state);
  async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path} unavailable (${r.status})`);return r.json();}
  function applyPublicationAuthorization(data,declared,auth){
    if(auth?.schema!==1||auth?.bookId!==data.bookId)throw new Error('Book publication authorization identity check failed');
    if(auth.status!=='authorized')return;
    if(auth?.governanceSnapshot?.manifestVersion!==data.version)throw new Error('Book publication authorization manifest version mismatch');
    const snapshot=auth.governanceSnapshot||{};
    if(snapshot.chapters!==46||snapshot.claims!==137||snapshot.supported!==116||snapshot.qualified!==21||snapshot.hold!==0||snapshot.conflicting!==0||snapshot.scopeQualifiedClaimsBlockingPublication!==0)throw new Error('Book publication authorization governance snapshot mismatch');
    const ids=Array.isArray(auth.authorizedChapterIds)?auth.authorizedChapterIds:[];
    if(ids.length!==declared.size||new Set(ids).size!==ids.length)throw new Error('Book publication authorization chapter coverage mismatch');
    for(const id of ids){const chapter=declared.get(id);if(!chapter)throw new Error(`Book publication authorization contains unknown chapter: ${id}`);chapter.state='verified';}
    publicationAuthorization=auth;
  }
  async function loadManifest(){
    const data=await json(`${BOOK_DATA}book-manifest-v1.json`);
    if(data?.schema!==1||data?.bookId!=='mouldmaster-book'||!Array.isArray(data.parts)||!Array.isArray(data.sourceSeeds))throw new Error('Book manifest identity check failed');
    const declared=new Map((data.parts||[]).flatMap(p=>p.chapters||[]).map(ch=>[ch.id,ch]));
    if(declared.size!==(data.parts||[]).reduce((n,p)=>n+(p.chapters||[]).length,0))throw new Error('Duplicate chapter id in Book manifest');
    const sourceMap=new Map((data.sourceSeeds||[]).map(source=>[source.id,source]));
    if(sourceMap.size!==data.sourceSeeds.length)throw new Error('Duplicate source id in Book manifest');
    const authoredIds=new Set();
    const batches=await Promise.all(BATCH_PATHS.map(path=>json(path)));
    for(const batch of batches){
      if(batch?.schema!==1||batch?.bookId!==data.bookId||!Array.isArray(batch.chapters))throw new Error('Book authored-batch identity check failed');
      for(const source of batch.sourceSeeds||[]){
        if(!source?.id||!source?.title||!source?.url||!source?.scope)throw new Error('Incomplete Book source record');
        if(sourceMap.has(source.id))throw new Error(`Duplicate authored source id: ${source.id}`);
        sourceMap.set(source.id,source);data.sourceSeeds.push(source);
      }
      for(const authored of batch.chapters){
        if(!authored?.id||authoredIds.has(authored.id))throw new Error(`Duplicate authored chapter id: ${authored?.id||'missing'}`);
        authoredIds.add(authored.id);
        const chapter=declared.get(authored.id);
        if(!chapter)throw new Error(`Authored chapter is not declared in manifest: ${authored.id}`);
        const effectiveState=authored.state||(batch.status==='technical-review'?'technical-review':chapter.state);
        if(effectiveState==='verified')throw new Error(`Authored draft cannot self-promote to verified: ${authored.id}`);
        if(!authored.applicability||!Array.isArray(authored.sections)||!authored.sections.length)throw new Error(`Incomplete authored chapter: ${authored.id}`);
        for(const sourceId of authored.sourceIds||[])if(!sourceMap.has(sourceId))throw new Error(`Unknown source ${sourceId} in ${authored.id}`);
        Object.assign(chapter,authored,{state:effectiveState});
      }
    }
    if(authoredIds.size!==declared.size)throw new Error('Book authored chapter coverage is incomplete');
    const auth=await json(AUTH_PATH);
    applyPublicationAuthorization(data,declared,auth);
    return data;
  }
  const allChapters=()=> (manifest?.parts||[]).flatMap(part=>part.chapters||[]);
  const verifiedChapters=()=>allChapters().filter(ch=>ch.state==='verified');
  function renderOverview(){
    if(!ui||!manifest)return;const verified=verifiedChapters(),review=allChapters().filter(ch=>ch.state==='technical-review');
    ui.summary.textContent=`${manifest.parts.length} parts · ${allChapters().length} governed chapters · ${review.length} in technical review · ${verified.length} evidence-verified for publication`;
    ui.parts.innerHTML=(manifest.parts||[]).map((part,partIndex)=>`<section class="card"><span class="eyebrow">Part ${partIndex+1}</span><h3>${esc(part.title.replace(/^Part\s+\d+\s+[—-]\s*/,''))}</h3><div>${(part.chapters||[]).map((chapter,chapterIndex)=>`<button type="button" class="ghost mm-book-chapter-button" data-mm-book-chapter="${esc(chapter.id)}"><b>${chapterIndex+1}. ${esc(chapter.title)}</b><br><small>${esc(chapter.level)} · ${esc(stateLabel(chapter.state))}</small></button>`).join('')}</div></section>`).join('');
    ui.parts.querySelectorAll('[data-mm-book-chapter]').forEach(b=>b.addEventListener('click',()=>showChapter(b.dataset.mmBookChapter)));
    ui.listen.disabled=!verified.length;ui.listen.textContent=verified.length?'Listen to evidence-verified Book':'Listening unlocks after evidence verification';
  }
  function sourceHtml(chapter){const sources=(chapter.sourceIds||[]).map(id=>(manifest.sourceSeeds||[]).find(s=>s.id===id)).filter(Boolean);return sources.length?`<h4>Evidence anchors currently attached</h4><ul>${sources.map(s=>`<li><b>${esc(s.id)}</b> — ${esc(s.title)}<br><small>${esc(s.scope)}</small></li>`).join('')}</ul>`:'<p>No source has been attached to this chapter yet.</p>';}
  function verifiedChapterHtml(chapter){const sections=Array.isArray(chapter.sections)?chapter.sections:[];return `<article class="mm-book-verified-chapter" data-mm-book-verified-chapter="${esc(chapter.id)}"><span class="eyebrow">Evidence verified</span><h2>${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'See attached evidence and controlling documentation.')}</p>${sections.map(s=>`<section><h3>${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${sourceHtml(chapter)}</article>`;}
  function restoreBookChrome(){if(!ui)return;ui.hero.hidden=false;ui.accuracy.hidden=false;}
  function stopBookSpeech(){try{window.MMReadAloud?.stop?.();}catch(_){ }}
  function showContents(){if(!ui)return;stopBookSpeech();restoreBookChrome();ui.reader.hidden=true;ui.contents.hidden=false;}
  function bindBack(){ui?.reader?.querySelector('[data-mm-book-back]')?.addEventListener('click',showContents);}
  function showChapter(id){
    const chapter=allChapters().find(ch=>ch.id===id);if(!chapter||!ui)return;const sections=Array.isArray(chapter.sections)?chapter.sections:[];
    restoreBookChrome();
    const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';
    if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`;
    else if(chapter.state==='technical-review'&&sections.length)ui.reader.innerHTML=`${back}<span class="eyebrow">Technical review draft — not evidence verified</span><h2>${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'Under review.')}</p><div class="callout"><b>Review boundary:</b> ${esc(chapter.reviewBoundary||'This draft is visible for technical review. Do not treat it as a machine setting, safety procedure or evidence-verified production instruction.')}</div>${sections.map(s=>`<section><h3>${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${sourceHtml(chapter)}`;
    else ui.reader.innerHTML=`${back}<span class="eyebrow">${esc(stateLabel(chapter.state))}</span><h2>${esc(chapter.title)}</h2><p><b>This chapter is not being published as technical teaching content yet.</b></p><p>MouldMaster is reviewing the claims, applicability and sources first. Existing Academy lesson text is not automatically treated as evidence-verified Book content.</p>${sourceHtml(chapter)}<p><small>Claim classes: ${esc((chapter.claimClasses||[]).join(', '))}</small></p>`;
    ui.contents.hidden=true;ui.reader.hidden=false;bindBack();
  }
  function startVerifiedListening(){
    if(!ui)return;const verified=verifiedChapters();if(!verified.length)return;
    const reader=window.MMReadAloud,details=document.querySelector('.mm-read-aloud details'),play=document.querySelector('.mm-read-aloud [data-mm-read="play"]');
    if(!reader?.supported||!details||!play){ui.summary.textContent='Evidence-verified Book text is available to read, but device speech synthesis is unavailable.';return;}
    reader.stop?.();
    const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';
    ui.reader.innerHTML=`${back}${verified.map(verifiedChapterHtml).join('')}`;
    ui.contents.hidden=true;ui.hero.hidden=true;ui.accuracy.hidden=true;ui.reader.hidden=false;bindBack();
    requestAnimationFrame(()=>{reader.refresh?.();details.open=true;play.click();});
  }
  function openBook(){if(!ui)return;previousView=[...document.querySelectorAll('.view')].find(v=>!v.classList.contains('hidden')&&v!==ui.view)||previousView;document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));ui.view.classList.remove('hidden');restoreBookChrome();open=true;document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));ui.nav.classList.add('active');const title=document.getElementById('pageTitle'),subtitle=document.getElementById('pageSubtitle');if(title)title.textContent='Book';if(subtitle)subtitle.textContent='Evidence-governed injection moulding reference — evidence-verified chapters retain explicit scope and source boundaries.';window.scrollTo({top:0,behavior:'smooth'});}
  function leaveBook(){if(!open)return;stopBookSpeech();open=false;ui?.view?.classList.add('hidden');ui?.nav?.classList.remove('active');}
  function createUI(){
    const nav=document.getElementById('nav'),main=document.querySelector('#mainContent,.main,main');if(!nav||!main||document.getElementById('mmBookView'))return;
    const button=document.createElement('button');button.type='button';button.dataset.mmBookTab='1';button.innerHTML='📖 <span>Book</span>';const listening=nav.querySelector('[data-mm-listening-tab]'),path=nav.querySelector('[data-view="path"]');(listening||path)?.insertAdjacentElement('afterend',button);if(!listening&&!path)nav.prepend(button);
    const view=document.createElement('section');view.id='mmBookView';view.className='view hidden';view.innerHTML=`<section class="card" data-mm-book-hero><span class="eyebrow">MouldMaster Book</span><h2>Injection moulding from foundations to advanced troubleshooting</h2><p>The Book is source-first and evidence-governed. Evidence-verified chapters retain their applicability and exclusions; machine, material, mould, hot-runner and workplace-specific requirements remain controlling.</p><p data-mm-book-summary>Loading governed Book manifest…</p><div><button type="button" class="primary" data-mm-book-mode="read">Read Book</button> <button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after evidence verification</button></div></section><section data-mm-book-contents><div data-mm-book-parts></div></section><section class="card" data-mm-book-reader hidden></section><section class="card" data-mm-book-accuracy><h3>Accuracy and assurance boundary</h3><p><b>Evidence verified</b> means the generic Book wording passed MouldMaster's evidence and publication gates. It does not replace current grade, machine, mould, hot-runner, product or site-specific documentation.</p><p><b>Independent validation:</b> evidence verification does not imply independent human SME approval, physical-device validation, curriculum SME approval or learner-outcome validation. Those are separate external gates and must be reported separately.</p></section>`;main.appendChild(view);
    ui={view,nav:button,hero:view.querySelector('[data-mm-book-hero]'),accuracy:view.querySelector('[data-mm-book-accuracy]'),summary:view.querySelector('[data-mm-book-summary]'),parts:view.querySelector('[data-mm-book-parts]'),contents:view.querySelector('[data-mm-book-contents]'),reader:view.querySelector('[data-mm-book-reader]'),listen:view.querySelector('[data-mm-book-mode="listen"]')};button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBook();});view.querySelector('[data-mm-book-mode="read"]').addEventListener('click',showContents);ui.listen.addEventListener('click',startVerifiedListening);
  }
  async function init(){createUI();try{manifest=await loadManifest();renderOverview();}catch(error){if(ui){ui.summary.textContent='Book manifest, governed content or publication authorization could not be verified. Technical content remains unavailable.';ui.parts.innerHTML='<section class="card"><h3>Book unavailable</h3><p>The governed Book release failed its runtime identity checks, so MouldMaster has failed closed.</p></section>';}console.error('MouldMaster Book:',error);}}
  document.addEventListener('click',event=>{const target=event.target?.closest?.('nav button,[data-view],[data-page]');if(!target||target.dataset.mmBookTab)return;if(open)leaveBook();},true);
  window.MMBook={version:VERSION,open:openBook,getManifest:()=>manifest,getPublicationAuthorization:()=>publicationAuthorization,verifiedChapters,startVerifiedListening};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();