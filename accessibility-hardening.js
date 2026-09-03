/* MouldMaster accessibility/browser hardening — 2026-09-03 */
(function(){
'use strict';
if(window.MM_ACCESSIBILITY_HARDENING)return;
const VERSION='2026.09.03.1';
let lastFocus=null,activeModal=null;
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function visible(el){if(!el||!el.isConnected)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
function focusables(root){return [...root.querySelectorAll(FOCUSABLE)].filter(visible)}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function style(){if(document.getElementById('mm-a11y-hardening-style'))return;const s=document.createElement('style');s.id='mm-a11y-hardening-style';s.textContent=`
.mm-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
@media(forced-colors:active){button,.card,.option,.mm-option-card{forced-color-adjust:auto;border:1px solid ButtonText!important}.primary,.mm-read-play{background:ButtonFace!important;color:ButtonText!important}.answer-row.correct,.mma-option.correct{outline:3px solid Highlight!important}.answer-row.incorrect,.mma-option.wrong{outline:3px solid Mark!important}}
@media(prefers-contrast:more){:focus-visible{outline-width:4px!important}.muted,.tiny{opacity:1!important}.card{border-width:2px!important}}
`;document.head.appendChild(s)}
function liveRegion(){let r=document.getElementById('mmA11yStatus');if(r)return r;r=document.createElement('div');r.id='mmA11yStatus';r.className='mm-sr-only';r.setAttribute('role','status');r.setAttribute('aria-live','polite');r.setAttribute('aria-atomic','true');document.body.appendChild(r);return r}
function announce(text){const r=liveRegion();r.textContent='';setTimeout(()=>{r.textContent=String(text||'')},20)}
function labelDialog(modal){
  const card=modal.querySelector('.modal-card')||modal.firstElementChild;if(!card)return;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  if(!modal.getAttribute('aria-label')&&!modal.getAttribute('aria-labelledby')){
    const heading=card.querySelector('h1,h2,h3');
    if(heading){if(!heading.id)heading.id=`mmDialogTitle${Date.now().toString(36)}`;modal.setAttribute('aria-labelledby',heading.id)}else modal.setAttribute('aria-label','MouldMaster dialog')
  }
  const close=card.querySelector('.modal-close');if(close&&!close.getAttribute('aria-label'))close.setAttribute('aria-label','Close dialog');
  if(!card.hasAttribute('tabindex'))card.tabIndex=-1;
}
function openDialog(modal){
  if(activeModal===modal)return;lastFocus=document.activeElement&&document.activeElement!==document.body?document.activeElement:lastFocus;activeModal=modal;labelDialog(modal);
  requestAnimationFrame(()=>{const card=modal.querySelector('.modal-card')||modal;const first=focusables(card)[0]||card;try{first.focus({preventScroll:true})}catch(_){first.focus?.()}announce(modal.querySelector('h1,h2,h3')?.textContent||'Dialog opened')})
}
function closeDialog(modal){if(activeModal!==modal)return;activeModal=null;requestAnimationFrame(()=>{if(lastFocus?.isConnected)try{lastFocus.focus({preventScroll:true})}catch(_){lastFocus.focus?.()}})}
function trap(e){if(e.key!=='Tab'||!activeModal||!visible(activeModal))return;const card=activeModal.querySelector('.modal-card')||activeModal,items=focusables(card);if(!items.length){e.preventDefault();card.focus();return}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
function nodes(root,selector){if(!root)return[];const out=[];if(root.nodeType===1&&root.matches?.(selector))out.push(root);if(root.querySelectorAll)out.push(...root.querySelectorAll(selector));return out}
function safeLinks(root=document){for(const a of nodes(root,'a[target="_blank"]')){const rel=new Set(String(a.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');a.rel=[...rel].join(' ')}}
function decorateControls(root=document){
  for(const img of nodes(root,'img:not([alt])'))img.alt='';
  for(const button of nodes(root,'button'))if(!clean(button.textContent)&&!button.getAttribute('aria-label')&&!button.getAttribute('aria-labelledby'))button.setAttribute('aria-label','Action');
  for(const input of nodes(root,'input,select,textarea')){if(input.getAttribute('aria-label')||input.getAttribute('aria-labelledby')||input.id&&document.querySelector?.(`label[for="${CSS.escape(input.id)}"]`)||input.closest('label'))continue;const p=input.getAttribute('placeholder');if(p)input.setAttribute('aria-label',p)}
}
function syncModalState(){const modals=[...document.querySelectorAll('.modal')].filter(visible);if(modals.length)openDialog(modals[modals.length-1]);else if(activeModal)closeDialog(activeModal)}
function scan(root=document){style();liveRegion();safeLinks(root);decorateControls(root);for(const modal of nodes(root,'.modal'))labelDialog(modal);syncModalState()}
document.addEventListener('keydown',trap,true);
document.addEventListener('click',e=>{const t=e.target.closest?.('button,a,[role="button"]');if(t)lastFocus=t},true);
const observer=new MutationObserver(mutations=>{
  const roots=new Set();
  for(const mutation of mutations){
    if(mutation.type==='attributes')roots.add(mutation.target);
    for(const node of mutation.addedNodes||[])if(node.nodeType===1)roots.add(node);
  }
  for(const root of roots)scan(root);
  if(!roots.size)syncModalState();
});
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']});
window.addEventListener('pageshow',()=>scan(document));document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
window.MM_ACCESSIBILITY_HARDENING=Object.freeze({version:VERSION,focusTrap:true,focusRestore:true,forcedColors:true,moreContrast:true,externalLinkIsolation:true,mutationScope:'changed-subtrees',announce,scan,scope:'Runtime accessibility safeguards; formal WCAG conformance still requires manual assistive-technology and browser testing.'});
scan(document);
})();
