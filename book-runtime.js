/* MouldMaster Book foundation runtime — evidence-governed, no automatic verification. */
(function(){
  'use strict';
  const VERSION='2026.09.14.1';
  let manifest=null;
  let ui=null;
  let previousView=null;
  let open=false;

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateLabel=state=>({planned:'Planned','source-review':'Source review','technical-review':'Technical review',verified:'Verified',hold:'Hold'}[state]||state);

  async function loadManifest(){
    const response=await fetch('./data/book-manifest-v1.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Book manifest unavailable (${response.status})`);
    const data=await response.json();
    if(data?.schema!==1||data?.bookId!=='mouldmaster-book')throw new Error('Book manifest identity check failed');
    return data;
  }

  function verifiedChapters(){
    return (manifest?.parts||[]).flatMap(part=>part.chapters||[]).filter(ch=>ch.state==='verified');
  }

  function renderOverview(){
    if(!ui||!manifest)return;
    const verified=verifiedChapters();
    ui.summary.textContent=`${manifest.parts.length} parts · ${(manifest.parts||[]).reduce((n,p)=>n+(p.chapters||[]).length,0)} governed chapters · ${verified.length} verified for publication`;
    ui.parts.innerHTML=(manifest.parts||[]).map((part,partIndex)=>`<section class="card"><span class="eyebrow">Part ${partIndex+1}</span><h3>${esc(part.title.replace(/^Part\s+\d+\s+[—-]\s*/,''))}</h3><div>${(part.chapters||[]).map((chapter,chapterIndex)=>`<button type="button" class="ghost" data-mm-book-chapter="${esc(chapter.id)}" style="width:100%;text-align:left;margin:6px 0"><b>${chapterIndex+1}. ${esc(chapter.title)}</b><br><small>${esc(chapter.level)} · ${esc(stateLabel(chapter.state))}</small></button>`).join('')}</div></section>`).join('');
    ui.parts.querySelectorAll('[data-mm-book-chapter]').forEach(button=>button.addEventListener('click',()=>showChapter(button.dataset.mmBookChapter)));
    ui.listen.disabled=!verified.length;
    ui.listen.textContent=verified.length?'Listen to verified Book':'Listening unlocks after verification';
  }

  function showChapter(id){
    const part=(manifest?.parts||[]).find(p=>(p.chapters||[]).some(ch=>ch.id===id));
    const chapter=part?.chapters?.find(ch=>ch.id===id);
    if(!chapter||!ui)return;
    const sources=(chapter.sourceIds||[]).map(sourceId=>(manifest.sourceSeeds||[]).find(source=>source.id===sourceId)).filter(Boolean);
    const sourceHtml=sources.length?`<h4>Evidence anchors currently attached</h4><ul>${sources.map(source=>`<li><b>${esc(source.id)}</b> — ${esc(source.title)}<br><small>${esc(source.scope)}</small></li>`).join('')}</ul>`:'<p>No source has been attached to this chapter yet.</p>';
    if(chapter.state!=='verified'){
      ui.reader.innerHTML=`<button type="button" class="ghost" data-mm-book-back>← Book contents</button><span class="eyebrow">${esc(stateLabel(chapter.state))}</span><h2>${esc(chapter.title)}</h2><p><b>This chapter is not being published as technical teaching content yet.</b></p><p>MouldMaster is reviewing the claims, applicability and sources first. Existing Academy lesson text is not automatically treated as verified Book evidence.</p>${sourceHtml}<p><small>Claim classes: ${esc((chapter.claimClasses||[]).join(', '))}</small></p>`;
    }else{
      const sections=Array.isArray(chapter.sections)?chapter.sections:[];
      ui.reader.innerHTML=`<button type="button" class="ghost" data-mm-book-back>← Book contents</button><span class="eyebrow">Verified</span><h2>${esc(chapter.title)}</h2>${sections.map(section=>`<section><h3>${esc(section.title||'')}</h3><p>${esc(section.text||'')}</p></section>`).join('')}${sourceHtml}`;
    }
    ui.contents.hidden=true;ui.reader.hidden=false;
    ui.reader.querySelector('[data-mm-book-back]')?.addEventListener('click',()=>{ui.reader.hidden=true;ui.contents.hidden=false;});
  }

  function openBook(){
    if(!ui)return;
    previousView=[...document.querySelectorAll('.view')].find(view=>!view.classList.contains('hidden')&&view!==ui.view)||previousView;
    document.querySelectorAll('.view').forEach(view=>view.classList.add('hidden'));
    ui.view.classList.remove('hidden');open=true;
    document.querySelectorAll('#nav button').forEach(button=>button.classList.remove('active'));
    ui.nav.classList.add('active');
    const title=document.getElementById('pageTitle');const subtitle=document.getElementById('pageSubtitle');
    if(title)title.textContent='Book';if(subtitle)subtitle.textContent='Evidence-governed injection moulding reference — read or listen as chapters are verified.';
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function leaveBook(){if(!open)return;open=false;ui?.view?.classList.add('hidden');ui?.nav?.classList.remove('active');}

  function createUI(){
    const nav=document.getElementById('nav');
    const main=document.querySelector('#mainContent,.main,main');
    if(!nav||!main||document.getElementById('mmBookView'))return;
    const button=document.createElement('button');button.type='button';button.dataset.mmBookTab='1';button.innerHTML='📖 <span>Book</span>';
    const listening=nav.querySelector('[data-mm-listening-tab]');const path=nav.querySelector('[data-view="path"]');
    (listening||path)?.insertAdjacentElement('afterend',button);if(!listening&&!path)nav.prepend(button);
    const view=document.createElement('section');view.id='mmBookView';view.className='view hidden';
    view.innerHTML=`<section class="card"><span class="eyebrow">MouldMaster Book</span><h2>Injection moulding from foundations to advanced troubleshooting</h2><p>The Book is being built source-first. Chapters are visible in the review queue, but technical teaching content is only released after its evidence, scope and applicability pass the Book accuracy rules.</p><p data-mm-book-summary>Loading governed Book manifest…</p><div><button type="button" class="primary" data-mm-book-mode="read">Read Book</button> <button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after verification</button></div></section><section data-mm-book-contents><div data-mm-book-parts></div></section><section class="card" data-mm-book-reader hidden></section><section class="card"><h3>Accuracy boundary</h3><p>Material, machine, mould, hot-runner and workplace-specific requirements override generic guidance. Unsupported numbers and unresolved conflicting evidence are held rather than presented confidently.</p></section>`;
    main.appendChild(view);
    ui={view,nav:button,summary:view.querySelector('[data-mm-book-summary]'),parts:view.querySelector('[data-mm-book-parts]'),contents:view.querySelector('[data-mm-book-contents]'),reader:view.querySelector('[data-mm-book-reader]'),listen:view.querySelector('[data-mm-book-mode="listen"]')};
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openBook();});
    view.querySelector('[data-mm-book-mode="read"]').addEventListener('click',()=>{ui.reader.hidden=true;ui.contents.hidden=false;});
  }

  async function init(){
    createUI();
    try{manifest=await loadManifest();renderOverview();}
    catch(error){if(ui){ui.summary.textContent='Book manifest could not be verified. Technical content remains unavailable.';ui.parts.innerHTML='<section class="card"><h3>Book unavailable</h3><p>The evidence manifest failed to load or validate, so MouldMaster has failed closed.</p></section>';}console.error('MouldMaster Book:',error);}
  }

  document.addEventListener('click',event=>{const target=event.target?.closest?.('nav button,[data-view],[data-page]');if(!target||target.dataset.mmBookTab)return;if(open)leaveBook();},true);
  window.MMBook={version:VERSION,open:openBook,getManifest:()=>manifest,verifiedChapters};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
