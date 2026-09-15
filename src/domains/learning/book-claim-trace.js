/* MouldMaster Book complete claim/evidence trace — 2026.09.15.6 */
(function(){
'use strict';
if(window.MM_BOOK_CLAIM_TRACE)return;
const VERSION='2026.09.15.6';
const ROOT='./src/domains/learning/book-data/';
const REVIEW_FILES=[
 'book-claim-review-foundations-materials-machine-v1.json',
 'book-claim-review-process-tooling-v1.json',
 'book-claim-review-troubleshooting-v1.json',
 'book-claim-review-engineering-advanced-v1.json',
 'book-claim-review-high-risk-v1.json'
];
const RESOLUTION_FILES=[
 'book-claim-resolution-high-risk-v1.json',
 'book-claim-resolution-high-risk-v2.json',
 'book-claim-resolution-all-v1.json',
 'book-qualification-resolution-all-v1.json'
];
const EXPECTED={chapters:46,claims:137,supported:116,qualified:21,hold:0,conflicting:0};
let ready=false,claims=new Map(),sources=new Map(),error=null,queued=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function json(name){const r=await fetch(ROOT+name,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error(`${name} unavailable (${r.status})`);return r.json()}
function addSource(s){if(!s?.id)return;if(!sources.has(s.id))sources.set(s.id,s)}
function evidenceHtml(ids){const unique=[...new Set(ids||[])];if(!unique.length)return '<li>No evidence identifier recorded.</li>';return unique.map(id=>{const s=sources.get(id);if(!s)return `<li><code>${esc(id)}</code> — source metadata unavailable</li>`;const meta=esc([s.issuer,s.scope].filter(Boolean).join(' — ')),url=String(s.url||'');const label=esc(s.title||s.id);return /^https:\/\//i.test(url)?`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${label}</b></a>${meta?`<br><small>${meta}</small>`:''}</li>`:`<li><b>${label}</b>${meta?`<br><small>${meta}</small>`:''}</li>`}).join('')}
function overlayResolution(resolution,label){
 const id=String(resolution?.claimId||'');const claim=claims.get(id);if(!claim)throw new Error(`Resolution references unknown claim ${id||'<missing>'}`);
 if(resolution.newConclusion)claim.conclusion=resolution.newConclusion;
 if(Array.isArray(resolution.evidence))claim.evidence=[...new Set([...(claim.evidence||[]),...resolution.evidence])];
 claim.history.push({stage:label,conclusion:resolution.newConclusion||claim.conclusion,reason:resolution.reason||'',evidence:resolution.evidence||[]});
}
function buildTrace(reviews,resolutions){
 claims=new Map();sources=new Map();
 const chapterIds=new Set();
 for(const ledger of reviews){
  if(ledger?.schema!==1||ledger?.bookId!=='mouldmaster-book'||!Array.isArray(ledger.chapters))throw new Error('Book claim-review ledger identity check failed');
  for(const s of ledger.sourceSeeds||[])addSource(s);
  for(const chapter of ledger.chapters){
   if(!chapter?.chapterId||!Array.isArray(chapter.claims))throw new Error('Book claim-review chapter record is malformed');chapterIds.add(chapter.chapterId);
   for(const source of chapter.sourceSeeds||[])addSource(source);
   for(const raw of chapter.claims){
    if(!raw?.claimId||claims.has(raw.claimId))throw new Error(`Duplicate or missing Book claim id: ${raw?.claimId||'<missing>'}`);
    claims.set(raw.claimId,{...raw,chapterId:chapter.chapterId,evidence:[...(raw.evidence||[])],history:[{stage:'initial technical review',conclusion:raw.conclusion||'reviewed',reason:raw.basis||'',evidence:raw.evidence||[]}]});
   }
  }
 }
 for(const [index,ledger] of resolutions.entries()){
  if(ledger?.schema!==1||ledger?.bookId!=='mouldmaster-book')throw new Error('Book claim-resolution ledger identity check failed');
  for(const s of ledger.newEvidence||[])addSource(s);
  for(const s of ledger.sourceSeeds||[])addSource(s);
  for(const item of ledger.resolutions||[])overlayResolution(item,RESOLUTION_FILES[index]);
  if(Array.isArray(ledger.remainingQualifiedClaims))for(const item of ledger.remainingQualifiedClaims){
   const id=String(item?.claimId||'');const claim=claims.get(id);if(!claim)throw new Error(`Qualification references unknown claim ${id||'<missing>'}`);
   claim.conclusion='qualified';claim.qualification={reason:item.reason||'',qualificationType:item.qualificationType||'scope boundary',blockingPublication:item.blockingPublication===true};
   claim.history.push({stage:'final qualification',conclusion:'qualified',reason:item.reason||'',evidence:item.evidence||[]});
   if(Array.isArray(item.evidence))claim.evidence=[...new Set([...(claim.evidence||[]),...item.evidence])];
  }
 }
 const counts={chapters:chapterIds.size,claims:claims.size,supported:0,qualified:0,hold:0,conflicting:0};
 for(const claim of claims.values()){const key=claim.conclusion;if(Object.prototype.hasOwnProperty.call(counts,key))counts[key]++}
 for(const [key,value] of Object.entries(EXPECTED))if(counts[key]!==value)throw new Error(`Book complete claim trace mismatch: ${key}=${counts[key]} expected ${value}`);
 return counts;
}
function chapterClaims(id){return [...claims.values()].filter(x=>x.chapterId===id).sort((a,b)=>String(a.claimId).localeCompare(String(b.claimId),undefined,{numeric:true}))}
function traceHtml(chapterId){
 const rows=chapterClaims(chapterId);if(!rows.length)return '<p><small>Complete claim trace unavailable for this chapter.</small></p>';
 return `<details class="mm-book-claim-trace mm-book-complete-claim-trace"><summary><b>Complete claim evidence trace</b> — ${rows.length}/${rows.length} governed claims</summary><p>This is the complete governed claim-level provenance for this chapter: original technical review, later evidence resolutions and any retained scope qualification. It does not imply independent human SME approval.</p><ol>${rows.map(c=>`<li data-mm-book-claim="${esc(c.claimId)}"><p><b>${esc(c.claimId)} — ${esc(c.conclusion)}</b><br>${esc(c.claim||'')}</p>${c.applicability?`<p><small><b>Applicability:</b> ${esc(c.applicability)}</small></p>`:''}${c.exclusions?`<p><small><b>Exclusions:</b> ${esc(c.exclusions)}</small></p>`:''}<p><b>Final evidence</b></p><ul>${evidenceHtml(c.evidence)}</ul><details><summary>Review and resolution history</summary><ul>${c.history.map(h=>`<li><b>${esc(h.stage)} — ${esc(h.conclusion||'reviewed')}</b>${h.reason?`<p>${esc(h.reason)}</p>`:''}${(h.evidence||[]).length?`<ul>${evidenceHtml(h.evidence)}</ul>`:''}</li>`).join('')}</ul></details>${c.qualification?`<p><small><b>Retained qualification:</b> ${esc(c.qualification.reason)} · ${esc(c.qualification.qualificationType)} · publication blocking: ${c.qualification.blockingPublication?'yes':'no'}</small></p>`:''}</li>`).join('')}</ol></details>`;
}
function renderArticle(article){if(!ready||!article)return;const id=article.dataset.mmBookVerifiedChapter;if(!id)return;const old=article.querySelector('.mm-book-claim-trace');const holder=document.createElement('div');holder.innerHTML=traceHtml(id);const next=holder.firstElementChild;if(!next)return;if(old)old.replaceWith(next);else article.appendChild(next)}
function renderAll(){queued=false;if(!ready)return;document.querySelectorAll('[data-mm-book-verified-chapter]').forEach(renderArticle);const status=document.querySelector('[data-mm-book-claim-trace-status]');if(status)status.textContent=`Complete claim trace verified: ${claims.size}/137 governed claims.`}
function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(renderAll,0)}
function installStatus(){const accuracy=document.querySelector('[data-mm-book-accuracy]');if(!accuracy||accuracy.querySelector('[data-mm-book-claim-trace-status]'))return;const p=document.createElement('p');p.className='muted';p.dataset.mmBookClaimTraceStatus='1';p.textContent=error?'Complete claim trace unavailable — do not infer claim-level provenance from chapter anchors alone.':'Loading complete 137-claim evidence trace…';accuracy.appendChild(p)}
async function init(){
 try{
  const [reviews,resolutions]=await Promise.all([Promise.all(REVIEW_FILES.map(json)),Promise.all(RESOLUTION_FILES.map(json))]);
  buildTrace(reviews,resolutions);ready=true;window.dispatchEvent(new CustomEvent('mm:book-claim-trace-ready',{detail:{version:VERSION,claims:claims.size}}));
 }catch(e){error=e;console.error('[MouldMaster Book complete claim trace]',e);window.dispatchEvent(new CustomEvent('mm:book-claim-trace-failed',{detail:{version:VERSION,message:String(e?.message||e)}}));}
 installStatus();queue();
}
const observer=new MutationObserver(()=>{installStatus();queue()});observer.observe(document.documentElement,{childList:true,subtree:true});
window.MM_BOOK_CLAIM_TRACE=Object.freeze({version:VERSION,expected:{...EXPECTED},isReady:()=>ready,getError:()=>error?String(error?.message||error):null,getClaim:id=>claims.get(String(id))||null,getChapterClaims:chapterClaims,renderAll});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
