/* MouldMaster learner UI polish — 2026.09.17.1
 * Presentation/navigation refinement only. Evidence, assessment, safety and
 * production-authority semantics remain owned by their governed runtimes.
 */
(function(){
'use strict';
if(window.MM_LEARNER_UI_POLISH)return;
const VERSION='2026.09.17.1';
const DESKTOP_QUERY='(min-width:1101px)';
const WIDE_QUERY='(min-width:701px)';
let queued=false;

function ensureStyles(){
  if(document.querySelector('link[data-mm-learner-ui-polish]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`./src/domains/shell/learner-ui-polish.css?v=${encodeURIComponent(VERSION)}`;
  link.dataset.mmLearnerUiPolish=VERSION;
  document.head.appendChild(link);
}
function wide(){return !!window.matchMedia?.(WIDE_QUERY).matches}
function desktop(){return !!window.matchMedia?.(DESKTOP_QUERY).matches}
function safe(fn){try{return typeof fn==='function'?fn():undefined}catch(error){console.warn('[MouldMaster UI polish]',error);return undefined}}

function runQuickAction(action){
  switch(action){
    case 'practice': return safe(()=>window.switchView?.('scenarios'));
    case 'book': return safe(()=>window.MMBook?.open?.());
    case 'materials': return safe(()=>window.switchView?.('materials'));
    case 'mould-master': return safe(()=>window.MM_MOULD_MASTER_WORKSPACE?.open?.()||window.switchView?.('defects'));
  }
}
function homeBalanceMarkup(){
  return `<div class="mm-home-balance-copy"><span class="eyebrow">Quick access</span><h2>Your moulding workspace</h2><p>Jump into the task you need without searching through the full tool set.</p></div><div class="mm-home-balance-grid"><button type="button" data-mm-home-action="practice"><span class="mm-home-balance-icon" aria-hidden="true">◎</span><span><b>Practice</b><small>Work one evidence-first shop-floor decision.</small></span></button><button type="button" data-mm-home-action="book"><span class="mm-home-balance-icon mm-book-mark" aria-hidden="true"></span><span><b>Book</b><small>Open the governed injection moulding reference.</small></span></button><button type="button" data-mm-home-action="materials"><span class="mm-home-balance-icon" aria-hidden="true">◇</span><span><b>Material science</b><small>Review polymer families and behaviour.</small></span></button><button type="button" data-mm-home-action="mould-master"><span class="mm-home-balance-icon" aria-hidden="true">◆</span><span><b>Mould Master</b><small>Build an evidence-led troubleshooting case.</small></span></button></div>`;
}
function syncHomeBalance(){
  const root=document.getElementById('dashboard');
  if(!root)return;
  let panel=root.querySelector('[data-mm-home-balance]');
  if(!wide()){
    panel?.remove();
    return;
  }
  if(!panel){
    panel=document.createElement('section');
    panel.className='card mm-home-balance';
    panel.dataset.mmHomeBalance=VERSION;
    panel.setAttribute('aria-label','Quick workspace access');
    panel.innerHTML=homeBalanceMarkup();
    panel.addEventListener('click',event=>{
      const button=event.target?.closest?.('[data-mm-home-action]');
      if(button)runQuickAction(button.dataset.mmHomeAction);
    });
  }
  const focus=root.querySelector('.mm-today-focus');
  const focusSlot=focus?.closest?.('.mm-dashboard-slot');
  const anchor=focusSlot||focus;
  if(anchor&&panel.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',panel);
  else if(!anchor&&!panel.isConnected)root.prepend(panel);
}

function syncBookDisclosure(){
  const view=document.getElementById('mmBookView');
  if(!view)return;
  const hero=view.querySelector('[data-mm-book-hero]');
  if(hero){
    const title=hero.querySelector(':scope > h2');
    if(title&&!title.dataset.mmUiPolished){
      title.textContent='Injection moulding: foundations to advanced troubleshooting';
      title.dataset.mmUiPolished='1';
    }
    const intro=[...hero.querySelectorAll(':scope > p')].find(p=>!p.matches('[data-mm-book-summary],[data-mm-book-sme-status]'));
    if(intro&&!intro.dataset.mmUiPolished){
      intro.textContent='A practical chapter reference with evidence, applicability and review boundaries available when you need them.';
      intro.dataset.mmUiPolished='1';
    }
    const summary=hero.querySelector('[data-mm-book-summary]');
    const sme=hero.querySelector('[data-mm-book-sme-status]');
    let details=hero.querySelector('.mm-book-governance');
    if((summary||sme)&&!details){
      details=document.createElement('details');
      details.className='mm-book-governance';
      const heading=document.createElement('summary');
      heading.innerHTML='<b>Publication & review status</b><span>Evidence and independent-review details</span>';
      const body=document.createElement('div');
      body.className='mm-book-governance-body';
      details.append(heading,body);
      const actions=hero.querySelector('.mm-book-hero-actions');
      actions?.insertAdjacentElement('beforebegin',details)||hero.appendChild(details);
    }
    const body=details?.querySelector('.mm-book-governance-body');
    if(body){
      if(summary&&summary.parentElement!==body)body.appendChild(summary);
      if(sme&&sme.parentElement!==body)body.appendChild(sme);
      if(!body.querySelector('[data-mm-book-boundary-note]')){
        const note=document.createElement('p');
        note.dataset.mmBookBoundaryNote='1';
        note.className='muted tiny';
        note.textContent='Evidence verification does not replace current machine, mould, material, hot-runner, workplace or independent-human review requirements.';
        body.appendChild(note);
      }
    }
    const listen=hero.querySelector('[data-mm-book-mode="listen"]');
    if(listen&&!listen.disabled&&listen.textContent!=='Listen to Book')listen.textContent='Listen to Book';
  }

  const accuracy=view.querySelector('[data-mm-book-accuracy]');
  if(accuracy&&!accuracy.querySelector('.mm-book-assurance-details')){
    const details=document.createElement('details');
    details.className='mm-book-assurance-details';
    const summary=document.createElement('summary');
    summary.innerHTML='<b>Accuracy & assurance boundary</b><span>What “evidence verified” does and does not mean</span>';
    const body=document.createElement('div');
    body.className='mm-book-assurance-body';
    while(accuracy.firstChild)body.appendChild(accuracy.firstChild);
    details.append(summary,body);
    accuracy.appendChild(details);
  }
  if(!view.classList.contains('hidden')&&document.getElementById('pageTitle')?.textContent==='Book'){
    const subtitle=document.getElementById('pageSubtitle');
    const text='Evidence-governed injection moulding reference.';
    if(subtitle&&subtitle.textContent!==text)subtitle.textContent=text;
  }
}

const DESKTOP_HIDE_LABELS=/^(Diagnostic labs|Data diagnosis|Material labs|Measured data|Process simulator|Defect finder|Learning insights)$/i;
function hideNavButton(button,hidden){
  if(!button)return;
  if(hidden){
    if(button.dataset.mmUiPolishHidden!=='1'){
      button.dataset.mmUiPolishHidden='1';
      button.dataset.mmUiPolishPrevHidden=button.hidden?'1':'0';
      button.dataset.mmUiPolishPrevAria=button.hasAttribute('aria-hidden')?button.getAttribute('aria-hidden'):'__none__';
      button.dataset.mmUiPolishPrevTab=button.hasAttribute('tabindex')?button.getAttribute('tabindex'):'__none__';
    }
    button.hidden=true;button.setAttribute('aria-hidden','true');button.tabIndex=-1;
  }else if(button.dataset.mmUiPolishHidden==='1'){
    button.hidden=button.dataset.mmUiPolishPrevHidden==='1';
    if(button.dataset.mmUiPolishPrevAria==='__none__')button.removeAttribute('aria-hidden');else button.setAttribute('aria-hidden',button.dataset.mmUiPolishPrevAria);
    if(button.dataset.mmUiPolishPrevTab==='__none__')button.removeAttribute('tabindex');else button.setAttribute('tabindex',button.dataset.mmUiPolishPrevTab);
    delete button.dataset.mmUiPolishHidden;delete button.dataset.mmUiPolishPrevHidden;delete button.dataset.mmUiPolishPrevAria;delete button.dataset.mmUiPolishPrevTab;
  }
}
function syncDesktopNavigation(){
  const nav=document.getElementById('nav');
  if(!nav)return;
  const isDesktop=desktop();
  [...nav.querySelectorAll(':scope > button')].forEach(button=>{
    if(button.dataset.mmDesktopMoreTools)return;
    const label=(button.textContent||'').replace(/\s+/g,' ').trim();
    hideNavButton(button,isDesktop&&DESKTOP_HIDE_LABELS.test(label));
  });
  let more=nav.querySelector('[data-mm-desktop-more-tools]');
  if(isDesktop&&!more){
    more=document.createElement('button');
    more.type='button';
    more.dataset.mmDesktopMoreTools='1';
    more.className='mm-desktop-more-tools';
    more.innerHTML='<span class="mm-more-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>More tools</span>';
    more.addEventListener('click',()=>safe(()=>window.openMobileMenu?.()));
    nav.appendChild(more);
  }
  if(more)more.hidden=!isDesktop;
}

function syncReadAloudLabel(){
  const host=document.querySelector('.mm-read-aloud details:not([open]) summary');
  if(host&&!host.getAttribute('aria-label'))host.setAttribute('aria-label','Read aloud');
}
function run(){
  syncHomeBalance();
  syncBookDisclosure();
  syncDesktopNavigation();
  syncReadAloudLabel();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;run()});
}
function install(){
  ensureStyles();
  run();
  // Shell render/view lifecycle events cover app-owned mutations. Avoid a whole-body characterData observer,
  // which previously scheduled a full polish pass for every text mutation in the application.
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('mm:domains-ready',schedule);
  window.MM_APP_SHELL?.events?.onRender?.('dashboard',schedule);
  window.MM_APP_SHELL?.events?.onViewChange?.(schedule);
  window.MM_LEARNER_UI_POLISH=Object.freeze({version:VERSION,refresh:schedule});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
