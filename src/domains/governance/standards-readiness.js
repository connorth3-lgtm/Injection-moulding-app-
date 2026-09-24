/* MouldMaster standards and readiness — governed read-only support. */
(function(){
'use strict';
if(window.MM_STANDARDS_READINESS)return;
const VERSION='2026.09.18.4';
const QMS='./src/domains/quality/data/quality-management-iso9001-v1.json';
const NZQA='./src/domains/learning/book-data/nzqa-education-readiness-v1.json';
let data=null,view=null,navDispose=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getJson(url){const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error(`${url} unavailable (${r.status})`);return r.json();}
function style(){
 if(document.getElementById('mm-standards-readiness-style'))return;
 const s=document.createElement('style');s.id='mm-standards-readiness-style';s.textContent=`
.mm-readiness-view{display:grid;gap:14px}.mm-readiness-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mm-readiness-card{border:1px solid #304b69;border-radius:14px;background:#0e1d31;padding:16px}.mm-readiness-card h3{margin:.25rem 0 .5rem}
.mm-readiness-card h4{margin:1rem 0 .35rem}.mm-readiness-card ul{margin:.4rem 0 .8rem;padding-left:1.2rem}.mm-readiness-card li{margin:.3rem 0}
.mm-readiness-boundary{border-left:4px solid var(--accent);padding:10px 12px;background:#10243d;border-radius:8px;line-height:1.45}
.mm-readiness-table{width:100%;border-collapse:collapse;font-size:.92rem}.mm-readiness-table th,.mm-readiness-table td{border-bottom:1px solid #29415d;padding:8px;text-align:left;vertical-align:top}
.mm-readiness-badges{display:flex;gap:7px;flex-wrap:wrap}.mm-readiness-badge{border:1px solid #3a5876;border-radius:999px;padding:4px 8px;font-size:.78rem}
@media(max-width:760px){.mm-readiness-grid{grid-template-columns:1fr}.mm-readiness-card{padding:14px}.mm-readiness-table{font-size:.84rem}}
`;document.head.appendChild(s);
}
function qmsHtml(q){
 const current=(q.standards||[]).find(x=>x.role==='current-published-requirements-basis');
 const vocab=(q.standards||[]).find(x=>x.role==='current-terminology-basis');
 return `<article class="mm-readiness-card"><span class="eyebrow">Quality management support</span><h3>ISO 9001 support — evidence, not certification</h3>
 <p>MouldMaster supports evidence discipline and learning relevant to a QMS. It does <b>not</b> establish organisational conformity, certification, accreditation or auditor approval.</p>
 <div class="mm-readiness-badges"><span class="mm-readiness-badge">${esc(current?.title||'Current requirements basis unavailable')}</span><span class="mm-readiness-badge">${esc(vocab?.title||'Vocabulary basis unavailable')}</span></div>
 <h4>Clause-to-feature support</h4><table class="mm-readiness-table"><thead><tr><th>Clause</th><th>Theme</th><th>Support</th></tr></thead><tbody>${(q.supportMap||[]).map(r=>`<tr><th scope="row">${esc(r.clause)}</th><td>${esc(r.theme)}</td><td>${esc(r.supportLevel)}</td></tr>`).join('')}</tbody></table>
 <h4>Evidence templates</h4><ul>${(q.recordTemplates||[]).map(t=>`<li><b>${esc(t.title)}</b> — ${esc(t.purpose)}</li>`).join('')}</ul>
 <div class="mm-readiness-boundary"><b>Boundary:</b> use a licensed copy of ISO 9001 for requirement text. MouldMaster paraphrases support themes and does not replace an organisation's controlled QMS, competent auditor or certification body.</div></article>`;
}
function nzqaHtml(n){
 const current=n.currentInjectionMouldingStandards||[],expired=n.expiredStandardsNotForCurrentAssessmentMapping||[];
 const gates=n.gates||[];
 return `<article class="mm-readiness-card"><span class="eyebrow">Education readiness</span><h3>NZQA readiness — preparation, not approval</h3>
 <p>The governed mapping covers <b>${esc((n.chapterMap||[]).length)}</b> Book chapters and ${esc((n.learningOutcomes||[]).length)} draft learning outcomes. It is a provider-readiness aid, not an NZQA result.</p>
 <h4>Current Injection Moulding context</h4><div class="mm-readiness-badges">${current.map(x=>`<span class="mm-readiness-badge">US ${esc(x.id)} · CMR ${esc(x.cmr||'external')}</span>`).join('')}</div>
 <h4>Expired / excluded from current mapping</h4><p>${expired.map(esc).join(', ')}</p>
 <h4>External gates</h4><ul>${gates.map(g=>`<li><b>${esc(g.id)}</b> — ${esc(g.status)}: ${esc(g.label||g.description||'provider-controlled gate')}</li>`).join('')}</ul>
 <div class="mm-readiness-boundary"><b>Boundary:</b> app learning is formative. Provider ownership, final level/credits, approved summative assessment, consent to assess, moderation, workplace evidence, learner administration and NZQA approval/accreditation remain external.</div></article>`;
}
function ensureView(){
 if(view)return view;
 style();const main=document.querySelector('#mainContent,.main,main');if(!main)return null;
 view=document.createElement('section');view.id='mmStandardsReadinessView';view.className='view hidden mm-readiness-view';view.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Loading current governed support contracts…</p></section>';main.appendChild(view);return view;
}
function render(){
 const root=ensureView();if(!root||!data)return;
 root.innerHTML=`<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Use these surfaces to understand evidence and provider-readiness boundaries. They do not create certification, accreditation, consent, competence or production authority.</p></section><section class="mm-readiness-grid">${qmsHtml(data.qms)}${nzqaHtml(data.nzqa)}</section>`;
}
function open(){
 const root=ensureView();if(!root)return;document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));root.classList.remove('hidden');
 const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');if(title)title.textContent='Standards & readiness';if(sub)sub.textContent='ISO 9001 support and NZQA provider-readiness boundaries';
 window.MM_APP_SHELL?.navigation?.setCustomActive?.('standards-readiness','more');
}
function install(){
 const shell=window.MM_APP_SHELL;if(!shell?.navigation?.register)return false;
 if(!navDispose)navDispose=shell.navigation.register({id:'standards-readiness',label:'Standards & readiness',icon:'§',description:'ISO 9001 support and NZQA provider-readiness boundaries.',order:55,group:'progress',mobileGroup:'more',action:open});
 return true;
}
async function init(){
 ensureView();
 try{const [qms,nzqa]=await Promise.all([getJson(QMS),getJson(NZQA)]);if(qms?.id!=='mouldmaster-iso9001-qms-support'||nzqa?.id!=='mouldmaster-nzqa-education-readiness')throw new Error('readiness contract identity mismatch');data=Object.freeze({qms,nzqa});render();}
 catch(e){if(view)view.innerHTML='<section class="card"><h2>Standards & readiness unavailable</h2><p>The governed support contracts could not be verified or loaded. No compliance or approval status should be inferred.</p></section>';console.error('[MouldMaster readiness]',e);}
 install();
}
if(!install())window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_STANDARDS_READINESS=Object.freeze({version:VERSION,open,getData:()=>data});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
