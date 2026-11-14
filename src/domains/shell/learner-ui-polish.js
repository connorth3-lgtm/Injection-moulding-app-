/* MouldMaster learner UI polish — 2026.11.14.3
 * Presentation/navigation refinement only. Evidence, assessment, safety and
 * production-authority semantics remain owned by their governed runtimes.
 */
(function(){
'use strict';
if(window.MM_LEARNER_UI_POLISH)return;
const VERSION='2026.11.14.3';
// Cache-bust stylesheet revisions without claiming a new governed app release.
const STYLE_REV='2026.10.20.2-pr640-materials-parity';
const DESKTOP_QUERY='(min-width:1101px)';
const WIDE_QUERY='(min-width:701px)';
let queued=false;

function ensureStyles(){
  if(document.querySelector('link[data-mm-learner-ui-polish]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`./src/domains/shell/learner-ui-polish.css?v=${encodeURIComponent(STYLE_REV)}`;
  link.dataset.mmLearnerUiPolish=VERSION;
  document.head.appendChild(link);
}
function wide(){return !!window.matchMedia?.(WIDE_QUERY).matches}
function desktop(){return !!window.matchMedia?.(DESKTOP_QUERY).matches}
function safe(fn){try{return typeof fn==='function'?fn():undefined}catch(error){console.warn('[MouldMaster UI polish]',error);return undefined}}

function runQuickAction(action){
  switch(action){
    case 'mould-master': return safe(()=>{
      window.switchView?.('scenarios');
      window.MM_PRIMARY_HUBS?.renderPracticeHub?.();
      window.requestAnimationFrame(()=>document.querySelector('#scenarios [data-mm-hub-action="problem-practice"]')?.click());
    });
    case 'recent-case': {
      const row=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()?.[0];
      return safe(()=>row?window.MM_MOULD_MASTER_WORKSPACE?.open?.(row.id):window.MM_MOULD_MASTER_WORKSPACE?.open?.());
    }
  }
}
function homeActivity(){
  const cases=window.MM_MOULD_MASTER_WORKSPACE?.cases?.()||[];
  return {recent:cases[0]||null}
}
function homeBalanceMarkup(){
  // The current lesson and Book already own the primary Home decisions.
  // Keep advanced tools useful but visually quiet and user-collapsible.
  return `<details class="mm-home-toolbox" data-mm-home-toolbox open>
    <summary><span class="mm-home-toolbox-label"><b>Toolbox</b><small>Optional diagnosis tools</small></span><span class="mm-home-toolbox-hint">Show / hide <span aria-hidden="true">⌄</span></span></summary>
    <div class="mm-home-toolbox-body">
      <div class="mm-home-balance-grid">
        <button type="button" data-mm-home-action="mould-master"><span class="mm-home-balance-icon" aria-hidden="true">◆</span><span><b>Troubleshoot</b><small>Choose a guided diagnosis route for a moulding problem.</small></span><span class="mm-home-action-arrow" aria-hidden="true">→</span></button>
      </div>
      <div data-mm-home-recent-slot hidden></div>
    </div>
  </details>`;
}

function syncHomeBalanceContent(panel){
  const a=homeActivity();
  const slot=panel.querySelector('[data-mm-home-recent-slot]');
  if(!slot)return;
  let button=slot.querySelector('[data-mm-home-action="recent-case"]');
  if(!a.recent){
    button?.remove();
    slot.hidden=true;
    return;
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='mm-home-recent';
    button.dataset.mmHomeAction='recent-case';
    button.innerHTML='<span><span class="eyebrow">Recent case</span><b data-mm-home-recent-title></b><small data-mm-home-recent-status></small></span><span aria-hidden="true">→</span>';
    slot.appendChild(button);
  }
  const title=button.querySelector('[data-mm-home-recent-title]');
  const status=button.querySelector('[data-mm-home-recent-status]');
  const nextTitle=String(a.recent.title||'Untitled troubleshooting case');
  const nextStatus=`${String(a.recent.status||'Investigating')} · continue where you left off`;
  if(title&&title.textContent!==nextTitle)title.textContent=nextTitle;
  if(status&&status.textContent!==nextStatus)status.textContent=nextStatus;
  slot.hidden=false;
}
function syncHomeBalance(){
  const root=document.getElementById('dashbo