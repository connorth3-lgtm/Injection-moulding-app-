/* MouldMaster backup authority UX — 2026.09.15.6 */
(function(){
'use strict';
if(window.MM_BACKUP_AUTHORITY_NOTICE)return;
const VERSION='2026.09.15.6';
const LEGACY_SUCCESS='Backup imported and strictly validated';
const CLEAR_SUCCESS='Progress imported. Certificates and pass authority must be re-earned; local assessment and Learning Insights analytics are reset.';
const baseToast=window.toast;
if(typeof baseToast==='function')window.toast=function(message){return baseToast.call(this,message===LEGACY_SUCCESS?CLEAR_SUCCESS:message)};
function annotate(root=document){
 for(const heading of root.querySelectorAll?.('h2')||[]){
  if(String(heading.textContent||'').trim()!=='Backup & reset')continue;
  const card=heading.closest('.card');if(!card||card.querySelector('[data-mm-backup-authority-note]'))continue;
  const note=document.createElement('div');note.className='callout';note.dataset.mmBackupAuthorityNote='1';
  note.innerHTML='<b>Transfer boundary:</b> Progress, notes and supported training extras can move in a backup. Certificates, pass authority and local analytics do not transfer as trusted evidence; certificates must be re-earned after import.';
  const controls=card.querySelector('.hero-buttons');card.insertBefore(note,controls||null);
 }
}
const observer=new MutationObserver(mutations=>{for(const m of mutations)for(const node of m.addedNodes||[])if(node.nodeType===1)annotate(node)});observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>annotate(),{once:true});else annotate();
window.MM_BACKUP_AUTHORITY_NOTICE=Object.freeze({version:VERSION,legacySuccess:LEGACY_SUCCESS,clearSuccess:CLEAR_SUCCESS,annotate});
})();
