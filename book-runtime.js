/* MouldMaster Book foundation runtime — evidence-governed, no automatic verification. */
(function(){
  'use strict';
  const VERSION='2026.09.14.2';
  let manifest=null,ui=null,previousView=null,open=false;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateLabel=state=>({planned:'Planned','source-review':'Source review','technical-review':'Technical review',verified:'Verified',hold:'Hold'}[state]||state);
  async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path} unavailable (${r.status})`);return r.json();}
  async function loadManifest(){
    const data=await json('./data/book-manifest-v1.json');
    if(data?.schema!==1||data?.bookId!=='mouldmaster-book')throw new Error('Book manifest identity check failed');
    const batches=await Promise.all(['./data/book-authored-foundations-v1.json'].map(path=>json(path)));
    for(const batch of batches){
      if(batch?.schema!==1||batch?.bookId!==data.bookId)throw new Error('Book authored-batch identity check failed');
      for(const source of batch.sourceSeeds||[])if(!(data.sourceSeeds||[]).some(x=>x.id===source.id))data.sourceSeeds.push(source);
      for(const authored of batch.chapters||[]){
        const chapter=(data.parts||[]).flatMap(p=>p.chapters||[]).find(x=>x.id===authored.id);
        if(!chapter)throw new Error(`Authored chapter is not declared in manifest: ${authored.id}`);
        Object.assign(chapter,authored);
      }
    }
    return data;
  }
  const allChapters=()=> (manifest?.parts||[]).flatMap(part=>part.chapters||[]);
  const verifiedChapters=()=>allChapters().filter(ch=>ch.state==='verified');
  function renderOverview(){
    if(!ui||!manifest)return;const verified=verifiedChapters(),review=allChapters().filter(ch=>ch.state==='technical-review');
    ui.summary.textContent=`${manifest.parts.length} parts · ${allChapters().length} governed chapters · ${review.length} in technical review · ${verified.length} verified for publication`;
    ui.parts.innerHTML=(manifest.parts||[]).map((part,partIndex)=>`<section class="card"><span class="eyebrow">Part ${partIndex+1}</span><h3>${esc(part.title.replace(/^Part\s+\d+\s+[—-]\s*/,''))}</h3><div>${(part.chapters||[]).map((chapter,chapterIndex)=>`<button type="button" class="ghost" data-mm-book-chapter="${esc(chapter.id)}" style="width:100%;text-align:left;margin:6px 0"><b>${chapterIndex+1}. ${esc(chapter.title)}</b><br><small>${esc(chapter.level)} · ${esc(stateLabel(chapter.state))}</small></button>`).join('')}</div></section>`).join('');
    ui.parts.querySelectorAll('[data-mm-book-chapter]').forEach(b=>b.addEventListener('click',()=>showChapter(b.dataset.mmBookChapter)));
    ui.listen.disabled=!verified.length;ui.listen.textContent=verified.length?'Listen to verified Book':'Listening unlocks after verification';
  }
  function sourceHtml(chapter){const sources=(chapter.sourceIds||[]).map(id=>(manifest.sourceSeeds||[]).find(s=>s.id===id)).filter(Boolean);return sources.length?`<h4>Evidence anchors currently attached</h4><ul>${sources.map(s=>`<li><b>${esc(s.id)}</b> — ${esc(s.title)}<br><small>${esc(s.scope)}</small></li>`).join('')}</ul>`:'<p>No source has been attached to this chapter yet.</p>';}
  function showChapter(id){
    const chapter=allChapters().find(ch=>ch.id===id);if(!chapter||!ui)return;const sections=Array.isArray(chapter.sections)?chapter.sections:[];
    const back='<button type="button" class="ghost" data-mm-book-back>← Book contents</button>';
    if(chapter.state==='verified')ui.reader.innerHTML=`${back}<span class="eyebrow">Verified</span><h2>${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'See attached evidence and controlling documentation.')}</p>${sections.map(s=>`<section><h3>${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${sourceHtml(chapter)}`;
    else if(chapter.state==='technical-review'&&sections.length)ui.reader.innerHTML=`${back}<span class="eyebrow">Technical review draft — not verified</span><h2>${esc(chapter.title)}</h2><p><b>Applicability:</b> ${esc(chapter.applicability||'Under review.')}</p><div class="callout"><b>Review boundary:</b> This draft is visible for technical review. Do not treat it as a machine setting, safety procedure or verified production instruction.</div>${sections.map(s=>`<section><h3>${esc(s.title||'')}</h3><p>${esc(s.text||'')}</p></section>`).join('')}${sourceHtml(chapter)}`;
    else ui.reader.innerHTML=`${back}<span class="eyebrow">${esc(stateLabel(chapter.state))}</span><h2>${esc(chapter.title)}</h2><p><b>This chapter is not being published as technical teaching content yet.</b></p><p>MouldMaster is reviewing the claims, applicability and sources first. Existing Academy lesson text is not automatically treated as verified Book evidence.</p>${sourceHtml(chapter)}<p><small>Claim classes: ${esc((chapter.claimClasses||[]).join(', '))}</small></p>`;
    ui.contents.hidden=true;ui.reader.hidden=false;ui.reader.querySelector('[data-mm-book-back]')?.addEventListener('click',()=>{ui.reader.hidden=true;ui.contents.hidden=false;});
  }
  function openBook(){if(!ui)return;previousView=[...document.querySelectorAll('.view')].find(v=>!v.classList.contains('hidden')&&v!==ui.view)||previousView;document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));ui.view.classList.remove('hidden');open=true;document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));ui.nav.classList.add('active');const title=document.getElementById('pageTitle'),subtitle=document.getElementById('pageSubtitle');if(title)title.textContent='Book';if(subtitle)subtitle.textContent='Evidence-governed injection moulding reference — read or listen as chapters are verified.';window.scrollTo({top:0,behavior:'smooth'});}
  function leaveBook(){if(!open)return;open=false;ui?.view?.classList.add('hidden');ui?.nav?.classList.remove('active');}
  function createUI(){
    const nav=document.getElementById('nav'),main=document.querySelector('#mainContent,.main,main');if(!nav||!main||document.getElementById('mmBookView'))return;
    const button=document.createElement('button');button.type='button';button.dataset.mmBookTab='1';button.innerHTML='📖 <span>Book</span>';const listening=nav.querySelector('[data-mm-listening-tab]'),path=nav.querySelector('[data-view="path"]');(listening||path)?.insertAdjacentElement('afterend',button);if(!listening&&!path)nav.prepend(button);
    const view=document.createElement('section');view.id='mmBookView';view.className='view hidden';view.innerHTML=`<section class="card"><span class="eyebrow">MouldMaster Book</span><h2>Injection moulding from foundations to advanced troubleshooting</h2><p>The Book is being built source-first. Review drafts are clearly marked; technical teaching content becomes verified only after its evidence, scope and applicability pass the Book accuracy rules.</p><p data-mm-book-summary>Loading governed Book manifest…</p><div><button type="button" class="primary" data-mm-book-mode="read">Read Book</button> <button type="button" class="ghost" data-mm-book-mode="listen" disabled>Listening unlocks after verification</button></div></section><section data-mm-book-contents><div data-mm-book-parts></div></section><section class="card" data-mm-book-reader hidden></section><section class="card"><h3>Accuracy boundary</h3><p>Material, machine, mould, hot-runner and workplace-specific requirements override generic guidance. Unsupported numbers and unresolved conflicting evidence are held rather than presented confidently.</p></section>`;main.appendChild(view);
    ui={view,nav:button,summary:view.querySelector('[data-mm-book-summary]'),parts:view.querySelector('[data-mm-book-parts]'),contents:view.querySelector('[data-mm-book-contents]'),reader:view.querySelector('[data-mm-book-reader]'),listen:view.querySelector('[data-mm-book-mode="listen"]')};button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBook();});view.querySelector('[data-mm-book-mode="read"]').addEventListener('click',()=>{ui.reader.hidden=true;ui.contents.hidden=false;});
  }
  async function init(){createUI();try{manifest=await loadManifest();renderOverview();}catch(error){if(ui){ui.summary.textContent='Book manifest could not be verified. Technical content remains unavailable.';ui.parts.innerHTML='<section class="card"><h3>Book unavailable</h3><p>The evidence manifest failed to load or validate, so MouldMaster has failed closed.</p></section>';}console.error('MouldMaster Book:',error);}}
  document.addEventListener('click',event=>{const target=event.target?.closest?.('nav button,[data-view],[data-page]');if(!target||target.dataset.mmBookTab)return;if(open)leaveBook();},true);
  window.MMBook={version:VERSION,open:openBook,getManifest:()=>manifest,verifiedChapters};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();