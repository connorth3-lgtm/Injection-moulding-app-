/* MouldMaster standards and readiness — governed read-only support. */
(function(){
'use strict';
if(window.MM_STANDARDS_READINESS)return;
const VERSION='2026.11.07.1';
const QMS='./src/domains/quality/data/quality-management-iso9001-v1.json';
const NZQA='./src/domains/learning/book-data/nzqa-education-readiness-v1.json';
const EDUCATION='./data/education-pathways-nz-uk-india-v1.json';
let data=null,view=null,navDispose=null,activeRegion='nz';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getJson(url){const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error(url+' unavailable ('+r.status+')');return r.json();}
function titleFor(id){return String(id||'').split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');}
function style(){
 if(document.getElementById('mm-standards-readiness-style'))return;
 const s=document.createElement('style');s.id='mm-standards-readiness-style';s.textContent=
 '.mm-readiness-view{display:grid;gap:14px}.mm-readiness-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'+
 '.mm-readiness-card{border:1px solid #304b69;border-radius:14px;background:#0e1d31;padding:16px}.mm-readiness-card h3{margin:.25rem 0 .5rem}'+
 '.mm-readiness-card h4{margin:1rem 0 .35rem}.mm-readiness-card ul{margin:.4rem 0 .8rem;padding-left:1.2rem}.mm-readiness-card li{margin:.3rem 0}'+
 '.mm-readiness-boundary{border-left:4px solid var(--accent);padding:10px 12px;background:#10243d;border-radius:8px;line-height:1.45}'+
 '.mm-readiness-table{width:100%;border-collapse:collapse;font-size:.92rem}.mm-readiness-table th,.mm-readiness-table td{border-bottom:1px solid #29415d;padding:8px;text-align:left;vertical-align:top}'+
 '.mm-readiness-badges,.mm-pathway-tabs,.mm-pathway-chapters{display:flex;gap:7px;flex-wrap:wrap}.mm-readiness-badge{border:1px solid #3a5876;border-radius:999px;padding:4px 8px;font-size:.78rem}'+
 '.mm-pathway-tabs{margin:12px 0}.mm-pathway-tabs button,.mm-pathway-chapters button,.mm-book-pathway-card button{border:1px solid #3a5876;border-radius:999px;background:#142943;color:inherit;padding:8px 12px;cursor:pointer}.mm-pathway-tabs button[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}'+
 '.mm-pathway-list{display:grid;gap:12px}.mm-pathway-card{border:1px solid #304b69;border-radius:14px;background:#0e1d31;padding:16px}.mm-pathway-card h3{margin:.25rem 0 .5rem}.mm-pathway-card h4{margin:1rem 0 .35rem}.mm-pathway-card a{color:#80d9ff}.mm-pathway-chapters button{font:inherit}.mm-book-pathway-card{margin-top:14px;padding:14px;border:1px solid #304b69;border-radius:12px;background:#0e1d31}.mm-book-pathway-card h3{margin:.1rem 0 .35rem}.mm-book-pathway-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'+
 '@media(max-width:760px){.mm-readiness-grid{grid-template-columns:1fr}.mm-readiness-card,.mm-pathway-card{padding:14px}.mm-readiness-table{font-size:.84rem}}';
 document.head.appendChild(s);
}
function qmsHtml(q){
 const current=(q.standards||[]).find(x=>x.role==='current-published-requirements-basis');
 const vocab=(q.standards||[]).find(x=>x.role==='current-terminology-basis');
 return '<article class="mm-readiness-card"><span class="eyebrow">Quality management support</span><h3>ISO 9001 support — evidence, not certification</h3>'+
 '<p>MouldMaster supports evidence discipline and learning relevant to a QMS. It does <b>not</b> establish organisational conformity, certification, accreditation or auditor approval.</p>'+
 '<div class="mm-readiness-badges"><span class="mm-readiness-badge">'+esc(current?.title||'Current requirements basis unavailable')+'</span><span class="mm-readiness-badge">'+esc(vocab?.title||'Vocabulary basis unavailable')+'</span></div>'+
 '<h4>Clause-to-feature support</h4><table class="mm-readiness-table"><thead><tr><th>Clause</th><th>Theme</th><th>Support</th></tr></thead><tbody>'+(q.supportMap||[]).map(r=>'<tr><th scope="row">'+esc(r.clause)+'</th><td>'+esc(r.theme)+'</td><td>'+esc(r.supportLevel)+'</td></tr>').join('')+'</tbody></table>'+
 '<h4>Evidence templates</h4><ul>'+(q.recordTemplates||[]).map(t=>'<li><b>'+esc(t.title)+'</b> — '+esc(t.purpose)+'</li>').join('')+'</ul>'+
 ((q.packagingExamples||[]).length?'<h4>Real packaging example</h4>'+q.packagingExamples.map(x=>'<section class="mm-readiness-boundary"><b>'+esc(x.title)+'</b><p>'+esc(x.interpretation)+'</p><p><b>Observed:</b> '+esc(x.observedMaterialIdentity?.brand||'Unknown brand')+' · '+esc(x.observedMaterialIdentity?.polymerFamily||'Unknown polymer')+' · exact grade '+esc(x.observedMaterialIdentity?.exactGradeStatus||'unresolved')+'.</p><p><b>Verification:</b> '+esc(x.currentCertificateStatus||x.verificationState||'not independently verified')+'.</p><ul>'+(x.boundaries||[]).map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section>').join(''):'')+
 '<div class="mm-readiness-boundary"><b>Boundary:</b> use a licensed copy of ISO 9001 for requirement text. MouldMaster paraphrases support themes and does not replace an organisation’s controlled QMS, competent auditor or certification body.</div></article>';
}
function nzqaHtml(n){
 const current=n.currentInjectionMouldingStandards||[],expired=n.expiredStandardsNotForCurrentAssessmentMapping||[];
 const gates=n.gates||[];
 return '<article class="mm-readiness-card"><span class="eyebrow">New Zealand education readiness</span><h3>NZQA preparation — not approval</h3>'+
 '<p>The governed NZQA mapping covers <b>'+esc((n.chapterMap||[]).length)+'</b> Book modules and '+esc((n.learningOutcomes||[]).length)+' draft learning outcomes. It is a provider-readiness aid, not an NZQA result.</p>'+
 '<h4>Current Injection Moulding context</h4><div class="mm-readiness-badges">'+current.map(x=>'<span class="mm-readiness-badge">US '+esc(x.id)+' · CMR '+esc(x.cmr||'external')+'</span>').join('')+'</div>'+
 '<h4>Expired / excluded from current assessment mapping</h4><p>'+expired.map(esc).join(', ')+'</p>'+
 '<h4>External gates</h4><ul>'+gates.map(g=>'<li><b>'+esc(g.id)+'</b> — '+esc(g.status)+': '+esc(g.label||g.description||'provider-controlled gate')+'</li>').join('')+'</ul>'+
 '<div class="mm-readiness-boundary"><b>Boundary:</b> app learning is formative. Provider ownership, final level/credits, approved summative assessment, consent to assess, moderation, workplace evidence, learner administration and NZQA approval/accreditation remain external.</div></article>';
}
function activitiesHtml(e,p){
 const byId=new Map((e.practiceActivities||[]).map(x=>[x.id,x]));
 return (p.practiceActivityIds||[]).map(id=>byId.get(id)).filter(Boolean).map(x=>'<li><b>'+esc(x.title)+'</b> — '+esc(x.description)+'</li>').join('');
}
function modulesHtml(p){
 if(!(p.modules||[]).length)return '';
 return '<details><summary>Official qualification modules and hours</summary><ul>'+p.modules.map(m=>'<li><b>'+esc(m.code)+'</b> — '+esc(m.title)+' ('+esc(m.hours)+' h)</li>').join('')+'</ul></details>';
}
function pathwayHtml(e,p){
 const chapters=(p.bookChapterIds||[]).map(id=>'<button type="button" data-book-chapter="'+esc(id)+'">'+esc(titleFor(id))+'</button>').join('');
 const outcomes=(p.studyOutcomes||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const gates=(p.formalRequirements||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const url=String(p.source?.url||'');
 const sourceLink=url.indexOf('https://')===0?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open official source: '+esc(p.source.title||'framework reference')+'</a>':'';
 return '<article class="mm-pathway-card"><span class="eyebrow">'+esc(p.nation)+' · '+esc(p.frameworkRef)+'</span><h3>'+esc(p.title)+'</h3>'+
 '<div class="mm-readiness-badges"><span class="mm-readiness-badge">'+esc(p.level)+'</span><span class="mm-readiness-badge">'+esc(p.status)+'</span><span class="mm-readiness-badge">'+esc(p.duration)+'</span></div>'+
 '<p>'+esc(p.scopeNote)+'</p>'+modulesHtml(p)+
 '<h4>Study outcomes this Book can support</h4><ul>'+outcomes+'</ul>'+
 '<h4>Open mapped Book modules</h4><div class="mm-pathway-chapters">'+chapters+'</div>'+
 '<h4>Practice in the app</h4><ul>'+activitiesHtml(e,p)+'</ul>'+
 '<h4>Still needs the relevant provider or workplace</h4><ul>'+gates+'</ul>'+
 '<p>'+sourceLink+'</p></article>';
}
function educationHtml(e){
 const selected=(e.regionTabs||[]).find(x=>x.id===activeRegion)||e.regionTabs?.[0];
 const tabs=(e.regionTabs||[]).map(x=>'<button type="button" data-region="'+esc(x.id)+'" aria-pressed="'+(x.id===activeRegion?'true':'false')+'">'+esc(x.label)+'</button>').join('');
 const pathways=(e.pathways||[]).filter(p=>p.region===(selected?.id||'nz'));
 return '<section class="card"><span class="eyebrow">Regional study pathways · checked '+esc(e.checked)+'</span><h2>Study injection moulding in your framework context</h2>'+
 '<p>Choose a region to see the official framework context, Book modules, app practice, and external assessment requirements. UK routes are separated by nation.</p>'+
 '<div class="mm-readiness-boundary"><b>Study-support mapping only.</b> This crosswalk is provisional and is not formal qualification equivalence, accreditation, credit, provider consent, assessed competence, or authority to operate a machine.</div>'+
 '<div class="mm-pathway-tabs" role="group" aria-label="Choose education pathway region">'+tabs+'</div></section>'+
 '<section class="mm-pathway-list">'+pathways.map(p=>pathwayHtml(e,p)).join('')+'</section>';
}
function ensureView(){
 if(view)return view;
 style();const main=document.querySelector('#mainContent,.main,main');if(!main)return null;
 view=document.createElement('section');view.id='mmStandardsReadinessView';view.className='view hidden mm-readiness-view';view.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Loading current governed support contracts…</p></section>';
 view.addEventListener('click',function(event){
  const regionButton=event.target?.closest?.('[data-region]');
  if(regionButton){activeRegion=regionButton.dataset.region||'nz';render();return;}
  const chapterButton=event.target?.closest?.('[data-book-chapter]');
  if(chapterButton){window.MMBook?.openChapter?.(chapterButton.dataset.bookChapter);return;}
 });
 main.appendChild(view);return view;
}
function render(){
 const root=ensureView();if(!root||!data)return;
 root.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Use these surfaces to understand evidence and provider-readiness boundaries. They do not create certification, accreditation, consent, competence or production authority.</p></section>'+
 educationHtml(data.education)+'<section class="mm-readiness-grid">'+qmsHtml(data.qms)+nzqaHtml(data.nzqa)+'</section>';
}
function open(region){
 if(region&&['nz','uk','india'].includes(region))activeRegion=region;
 const root=ensureView();if(!root)return;
 render();document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));root.classList.remove('hidden');
 const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');if(title)title.textContent='Standards & readiness';if(sub)sub.textContent='New Zealand, UK nation-specific, and India study pathways';
 window.MM_APP_SHELL?.navigation?.setCustomActive?.('standards-readiness','more');
}
function install(){
 const shell=window.MM_APP_SHELL;if(!shell?.navigation?.register)return false;
 if(!navDispose)navDispose=shell.navigation.register({id:'standards-readiness',label:'Standards & readiness',icon:'§',description:'ISO 9001 support and NZ, UK, and India education pathway maps.',order:55,group:'progress',mobileGroup:'more',action:()=>open()});
 return true;
}
function mountBookPathwayCard(){
 const hero=document.querySelector('#mmBookView [data-mm-book-hero]');
 if(!hero||hero.querySelector('#mm-book-pathway-card'))return false;
 const card=document.createElement('section');card.id='mm-book-pathway-card';card.className='mm-book-pathway-card';
 card.innerHTML='<span class="eyebrow">Regional study pathways</span><h3>Use this Book with NZ, UK, and India study routes</h3><p>Open a nation-aware map to see related Book modules, app practice, and the parts that require a provider or workplace.</p><div class="mm-book-pathway-actions"></div>';
 const actions=card.querySelector('.mm-book-pathway-actions');
 [['nz','New Zealand'],['uk','United Kingdom'],['india','India']].forEach(item=>{
  const button=document.createElement('button');button.type='button';button.dataset.openRegion=item[0];button.textContent=item[1];
  button.addEventListener('click',function(){
   activeRegion=item[0];
   const navButton=document.querySelector('#nav [data-mm-registry-nav="standards-readiness"]');
   if(navButton)navButton.click();else open(item[0]);
  });
  actions.appendChild(button);
 });
 hero.appendChild(card);return true;
}
async function init(){
 ensureView();
 try{
  const [qms,nzqa,education]=await Promise.all([getJson(QMS),getJson(NZQA),getJson(EDUCATION)]);
  if(qms?.id!=='mouldmaster-iso9001-qms-support'||nzqa?.id!=='mouldmaster-nzqa-education-readiness'||education?.id!=='mouldmaster-regional-education-pathways')throw new Error('readiness contract identity mismatch');
  data=Object.freeze({qms,nzqa,education});render();mountBookPathwayCard();
 }catch(e){if(view)view.innerHTML='<section class="card"><h2>Standards & readiness unavailable</h2><p>The governed support contracts could not be verified or loaded. No compliance or approval status should be inferred.</p></section>';console.error('[MouldMaster readiness]',e);}
 install();
}
window.addEventListener('mm:book-manifest-ready',mountBookPathwayCard);
if(!install())window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_STANDARDS_READINESS=Object.freeze({version:VERSION,open,getData:()=>data});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();