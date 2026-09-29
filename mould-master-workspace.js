/* MouldMaster evidence-led troubleshooting workspace — 2026.09.29.6 */
(function(){
'use strict';
const VERSION='2026.09.29.6';
const MAX_CASES=80;
let activeId='';
let caseCache=[];
let hydrationPromise=null;
let hydratedLearnerToken='';
let storageFailure='';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function engineeringStore(){return window.MM_ENGINEERING_STORE||null}
async function resolveStore(){
  let store=engineeringStore();if(store)return store;
  try{if(window.MM_DOMAIN_BOOTSTRAP?.ready)await window.MM_DOMAIN_BOOTSTRAP.ready}catch(_){}
  return engineeringStore()
}
function uid(){try{return crypto.randomUUID()}catch(_){return 'case-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}}
function now(){return new Date().toISOString()}
function blank(){return{id:uid(),createdAt:now(),updatedAt:now(),title:'',defectId:null,defect:'',materialGradeId:null,material:'',machineId:null,machine:'',mouldId:null,mould:'',productId:null,product:'',partId:null,part:'',cavityId:null,onset:'Unknown / not yet defined',location:'',baseline:'',evidence:'',hypothesis:'',controlledTest:'',testResult:'',afterChange:'',verification:'',conclusion:'',status:'Investigating'}}
function all(){return caseCache.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))}
function get(id){return all().find(x=>x.id===id)||null}
function replaceCache(cases){caseCache=(Array.isArray(cases)?cases:[]).slice(0,MAX_CASES).map(x=>({...x}));return all()}
async function hydrate({force=false}={}){
  const store=await resolveStore();if(!store)throw new Error('Engineering case store unavailable');
  const owner=store.learnerToken();
  if(!force&&hydrationPromise&&hydratedLearnerToken===owner)return hydrationPromise;
  if(hydratedLearnerToken!==owner){activeId='';caseCache=[]}
  hydratedLearnerToken=owner;
  hydrationPromise=(async()=>{
    await store.bootstrap?.();
    const cases=await store.listCases(owner);
    if(hydratedLearnerToken!==owner)return all();
    storageFailure='';return replaceCache(cases)
  })().catch(err=>{if(hydratedLearnerToken===owner){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] canonical case store unavailable',err)}return all()});
  return hydrationPromise
}
async function saveCase(c){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  c.status=status(c);c.updatedAt=now();
  const saved=await store.saveCase(c,{token:owner});
  await store.linkCaseContext?.(saved.id,saved,owner);
  const cases=all().filter(x=>x.id!==saved.id);caseCache=[{...saved},...cases].slice(0,MAX_CASES);return saved
}
async function deleteCase(id){
  await hydrate();const store=await resolveStore();if(!store)throw new Error(storageFailure||'Engineering case store unavailable');
  let owner=store.learnerToken();if(hydratedLearnerToken!==owner){await hydrate({force:true});owner=store.learnerToken()}
  const removed=await store.deleteCase(id,owner);if(removed)caseCache=all().filter(x=>x.id!==id);if(activeId===id)activeId='';return removed
}
function persistenceError(err){storageFailure=String(err?.message||err);console.warn('[MouldMaster workspace] case persistence failed',err);window.toast?.('Case could not be saved locally')}

function defects(){try{return Array.isArray(D?.defects)?D.defects:[]}catch(_){return[]}}
function lessons(){try{return Array.isArray(D?.lessons)?D.lessons:[]}catch(_){return[]}}
function specialist(){return window.MM_SPECIALIST_CURRICULUM?.lessons||[]}
function dataCases(){
  const guided=(window.MM_PROCESS_DATA_DIAGNOSTICS?.cases||[]).map(x=>({...x,origin:'Guided 14'}));
  const deep=(window.MM_PROCESS_DATA_DEEP_DIVE_50?.cases||[]).map(x=>({...x,origin:'50-case deep dive'}));
  const atlas=(window.MM_PROCESS_DATA_20_PASS_ATLAS?.cases||[]).map(x=>({...x,kind:x.kind||x.domain||'20-pass atlas',origin:'20-pass atlas'}));
  return [...guided,...deep,...atlas]
}
function materialLabs(){return window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[]}
function selectedDefect(c){return defects().find(d=>d.name===c.defect)||null}
const SHORT_TERMS=new Set(['PP','PC','ABS','POM','PET','PBT','TPU','PMMA','PEEK','PPS','LCP','HDPE','PA66','PA6','PPA','PEI','TPE'].map(x=>x.toLowerCase()));
function words(v){return String(v||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>3||SHORT_TERMS.has(x))}
function caseTerms(c){return [...new Set(words([c.defect,c.material,c.title,c.evidence,c.hypothesis].join(' ')))].slice(0,28)}
function scoreText(text,terms){const s=String(text||'').toLowerCase();return terms.reduce((n,t)=>n+(s.includes(t)?1:0),0)}
function relatedLessons(c){const terms=caseTerms(c);return lessons().map(l=>({l,score:scoreText([l.title,l.summary,l.intro,(l.keypoints||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.l)}
function relatedSpecialist(c){const terms=caseTerms(c);return specialist().map(l=>({l,score:scoreText([l.title,l.level].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.l)}
function relatedData(c){const terms=caseTerms(c);return dataCases().map(x=>({x,score:scoreText([x.title,x.kind,x.domain,x.passTitle,x.fault,x.diagnosis,x.next,(x.signals||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.x)}
function relatedMaterial(c){const terms=caseTerms(c);return materialLabs().map(x=>({x,score:scoreText([x.title,x.focus,(x.materials||[]).join(' ')].join(' '),terms)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.x)}

function status(c){
  if(c.conclusion.trim()&&c.verification.trim()&&c.afterChange.trim())return 'Verified / documented';
  if(c.testResult.trim())return 'Tested — verification pending';
  if(c.controlledTest.trim())return 'Test planned';
  if(c.hypothesis.trim())return 'Mechanism ranked';
  return 'Investigating'
}
function completeness(c){const fields=['defect','onset','baseline','evidence','hypothesis','controlledTest','testResult','afterChange','verification','conclusion'];return Math.round(fields.filter(k=>String(c[k]||'').trim()).length/fields.length*100)}

function style(){if(document.getElementById('mm-mould-master-style'))return;const s=document.createElement('style');s.id='mm-mould-master-style';s.textContent=`
#mmMouldMasterWorkspace{--mw-line:#31506f;--mw-soft:#0e1d31}.mw-hero{padding:22px;background:radial-gradient(circle at 92% 0%,rgba(85,214,190,.17),transparent 33%),linear-gradient(135deg,#13273d,#0d1b2e)}.mw-hero h2{font-size:30px;margin:7px 0 8px}.mw-hero p{max-width:920px;line-height:1.6;color:#bfd0e2}.mw-boundary{margin-top:12px;padding:12px 14px;border:1px solid #6b5e2d;border-radius:10px;background:#292413;color:#f2e6b4;font-size:12px;line-height:1.55}.mw-loop{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:14px}.mw-loop span{padding:8px 5px;text-align:center;border:1px solid #31506f;border-radius:9px;background:#102137;color:#bfd3e8;font-size:10px}.mw-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}.mw-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:14px}.mw-panel{padding:18px}.mw-panel h3{margin:0 0 10px}.mw-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.mw-form .wide{grid-column:1/-1}.mw-form textarea{min-height:96px}.mw-form textarea.tall{min-height:132px}.mw-help{font-size:11px;color:var(--muted);line-height:1.45;margin-top:5px}.mw-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.mw-summary{display:grid;gap:10px}.mw-kpi{padding:13px;border:1px solid #2d4764;border-radius:10px;background:#0e1d31}.mw-kpi span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.mw-kpi b{display:block;margin-top:4px}.mw-list{display:grid;gap:7px}.mw-item{padding:10px 11px;border:1px solid #2f4a68;border-radius:10px;background:#0f2035}.mw-item b{display:block;margin-bottom:4px}.mw-item p{margin:0;color:#b8c9dc;font-size:12px;line-height:1.45}.mw-chip-row{display:flex;gap:6px;flex-wrap:wrap}.mw-chip{font-size:10px;border:1px solid #3b5978;border-radius:999px;padding:4px 7px;color:#c4d8ed;background:#102137}.mw-cases{display:grid;gap:8px}.mw-case{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid #304b69;border-radius:11px;background:#0e1d31}.mw-case small{color:var(--muted)}.mw-danger{border-color:#6b3b45!important;color:#ffc7d0!important}.mw-evidence-board{display:grid;gap:8px}.mw-evidence-row{padding:10px 12px;border-left:4px solid #69a8ff;background:#102137;border-radius:8px;line-height:1.45;font-size:12px}.mw-mechanism{border-left-color:#ffd166}.mw-check{border-left-color:#55d6be}.mw-empty{padding:14px;border:1px dashed #3a5675;border-radius:10px;color:var(--muted);font-size:12px}.mw-related button{width:100%;text-align:left;margin-top:6px}.mw-progress{height:7px;background:#20344d;border-radius:99px;overflow:hidden}.mw-progress i{display:block;height:100%;background:linear-gradient(90deg,#55d6be,#69a8ff)}
@media(max-width:900px){.mw-layout{grid-template-columns:1fr}.mw-loop{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.mw-form{grid-template-columns:1fr}.mw-form .wide{grid-column:auto}.mw-loop{grid-template-columns:repeat(2,1fr)}.mw-toolbar button{flex:1}.mw-panel{padding:15px}}
`;document.head.appendChild(s)}
function section(){let x=document.getElementById('mmMouldMasterWorkspace');if(x)return x;x=document.createElement('section');x.id='mmMouldMasterWorkspace';x.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(x);return x}
function hideViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function header(){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent='Mould Master';if(p)p.textContent='Build an evidence-led troubleshooting case from symptom to verified conclusion.'}
function mark(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));window.MM_APP_SHELL?.navigation?.setCustomActive?.('mould-master','practice')}

function defectOptions(c){return `<option value="">Select a defect / symptom…</option>${defects().map(d=>`<option ${d.name===c.defect?'selected':''}>${esc(d.name)}</option>`).join('')}`}
function onsetOptions(c){const vals=['Unknown / not yet defined','Just started','After material change','After mould maintenance','After machine change','After restart / setup','Gradually over time','Intermittent'];return vals.map(x=>`<option ${x===c.onset?'selected':''}>${esc(x)}</option>`).join('')}
function textField(label,key,c,wide=false,help=''){return `<label class="${wide?'wide':''}">${esc(label)}<input data-mw-field="${key}" value="${esc(c[key]||'')}">${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}
function area(label,key,c,help='',tall=false){return `<label class="wide">${esc(label)}<textarea class="${tall?'tall':''}" data-mw-field="${key}">${esc(c[key]||'')}</textarea>${help?`<div class="mw-help">${esc(help)}</div>`:''}</label>`}

function evidenceBoard(c){const d=selectedDefect(c);if(!d)return '<div class="mw-empty">Choose a defect to load its known symptom, mechanism candidates and evidence checks. These are prompts to investigate, not an automatic diagnosis.</div>';return `<div class="mw-evidence-board"><div class="mw-evidence-row"><b>Observed symptom pattern</b><br>${esc(d.symptom||'')}</div>${(d.mechanisms||[]).slice(0,5).map(x=>`<div class="mw-evidence-row mw-mechanism"><b>Mechanism candidate</b><br>${esc(x)}</div>`).join('')}${(d.checks||[]).slice(0,6).map(x=>`<div class="mw-evidence-row mw-check"><b>Evidence to collect</b><br>${esc(x)}</div>`).join('')}</div>`}
function relatedHtml(c){
  const ls=relatedLessons(c),ss=relatedSpecialist(c),ds=relatedData(c),ms=relatedMaterial(c);
  const lessonButtons=ls.length?ls.map(l=>`<button class="ghost" type="button" data-mw-lesson="${l.id}">${esc(l.id+'. '+l.title)}</button>`).join(''):'<div class="mw-empty">Add a defect, material or evidence terms to surface related lessons.</div>';
  const spec=ss.length?`<div class="mw-chip-row">${ss.map(x=>`<span class="mw-chip">${esc(x.id+' · '+x.title)}</span>`).join('')}</div>`:'';
  const data=ds.length?ds.map(x=>`<button class="ghost" type="button" data-mw-data="${esc(x.id)}" data-mw-data-origin="${esc(x.origin||'Guided 14')}">${esc(x.origin||'Data case')} · ${esc(x.title)}</button>`).join(''):'';
  const mat=ms.length?ms.map(x=>`<button class="ghost" type="button" data-mw-material="${esc(x.id)}">Material lab · ${esc(x.title)}</button>`).join(''):'';
  return `<div class="mw-related"><h3>Learning & evidence links</h3>${lessonButtons}${spec}${data}${mat}<button class="ghost" type="button" data-mw-defects>Open Defect Finder</button><button class="ghost" type="button" data-mw-diagnostic>Open Diagnostic Labs</button><button class="ghost" type="button" data-mw-data-home>Open Data Diagnosis</button><p class="mw-help">Use these links to learn the mechanism or test your reasoning. Case notes remain your own local evidence record.</p></div>`
}
async function hydrateEngineeringContext(host,c){
  const panel=host.querySelector('[data-mw-engineering-context]');if(!panel)return;
  const rows=[
    ['Material',c.material||'Not identified',c.materialGradeId||''],
    ['Machine',c.machine||'Not identified',c.machineId||''],
    ['Mould',c.mould||'Not identified',c.mouldId||''],
    ['Product / assembly',c.product||'Not identified',c.productId||''],
    ['Part / component',c.part||'Not identified',c.partId||'']
  ];
  let materialEvidence='';
  if(c.materialGradeId&&window.MM_MATERIAL_REGISTRY?.get){
    try{
      const grade=await window.MM_MATERIAL_REGISTRY.get(c.materialGradeId);
      if(grade)materialEvidence=`<div class="mw-kpi"><span>Exact-grade evidence</span><b>${esc((grade.properties||[]).length+' properties · '+(grade.processing||[]).length+' processing observations · '+(grade.sources||[]).length+' primary/source records')}</b></div>`;
    }catch(_){}
  }
  panel.innerHTML=`<h3>Engineering context</h3>${rows.map(([label,name,id])=>`<div class="mw-kpi"><span>${esc(label)}</span><b>${esc(name)}</b>${id?`<div class="mw-help">ID: ${esc(id)}</div>`:''}</div>`).join('')}${materialEvidence}<p class="mw-help">These identities keep material evidence, machine/cell history, mould/tool history and product/part quality evidence attached to the same troubleshooting case.</p>`;
}
const EVIDENCE_KIND_LABELS={
  'controlled-trial':'Controlled trial',
  'dimensional-check':'Dimensional / quality check',
  'defect-observation':'Defect observation',
  'maintenance-event':'Maintenance event',
  'material-lot':'Material lot / batch',
  'acceptance-check':'Acceptance / release check'
};
function evidenceKindOptions(selected='controlled-trial'){return Object.entries(EVIDENCE_KIND_LABELS).map(([value,label])=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`).join('')}
function evidenceAcceptanceOptions(selected='not-assessed'){return [['not-assessed','Not assessed'],['pending','Pending'],['accepted','Accepted'],['rejected','Rejected']].map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${label}</option>`).join('')}
function evidenceItemHtml(item){return `<div class="mw-evidence-row"><b>${esc(EVIDENCE_KIND_LABELS[item.kind]||item.kind)} · ${esc(item.title||'Untitled evidence')}</b><br><span class="mw-help">${esc(item.occurredAt||'')} · ${esc(item.acceptanceStatus||'not-assessed')}${item.sourceRef?` · source ${esc(item.sourceRef)}`:''} · ${item.complete?'complete':'incomplete'}${item.voided?' · VOID':''}</span>${item.materialLot?`<div><b>Lot / batch:</b> ${esc(item.materialLot)}</div>`:''}${item.measurement?`<div><b>Measurement:</b> ${esc(item.measurement)} ${esc(item.unit||'')}</div>`:''}${item.methodRef?`<div><b>Method / basis:</b> ${esc(item.methodRef)}</div>`:''}${item.acceptanceBasis?`<div><b>Acceptance basis:</b> ${esc(item.acceptanceBasis)}</div>`:''}${item.result?`<div><b>Result:</b> ${esc(item.result)}</div>`:''}${item.revisionOf?`<div><b>Revision of:</b> ${esc(item.revisionOf)}</div>`:''}${item.voided?`<div><b>Void reason:</b> ${esc(item.voidReason||'Not recorded')}</div>`:''}${!item.complete?`<div class="mw-help">Missing required evidence: ${esc((item.missingFields||[]).join(', '))}</div>`:''}${item.notes?`<div><b>Notes:</b> ${esc(item.notes)}</div>`:''}${item.voided?'':`<button class="ghost" type="button" data-mw-evidence-revise="${esc(item.id)}">Revise evidence</button><button class="ghost" type="button" data-mw-evidence-void="${esc(item.id)}">Void evidence</button>`}</div>`}
async function hydrateCaseEvidence(host,c){
  const panel=host.querySelector('[data-mw-case-evidence]');if(!panel)return;
  const store=await resolveStore();if(!store?.listCaseEvidence){panel.innerHTML='<h3>Closed-loop evidence</h3><div class="mw-empty">Structured evidence store unavailable.</div>';return}
  const items=await store.listCaseEvidence(c.id,store.learnerToken()),summary=await store.evidenceSummary(c.id,store.learnerToken());
  panel.innerHTML=`<h3>Closed-loop evidence</h3><div class="mw-kpi"><span>Active evidence</span><b>${summary.activeCount} / ${summary.count}</b><div class="mw-help">${summary.completeCount} complete · ${summary.incompleteCount} incomplete · ${summary.voidedCount} voided. Site-local records tied to stable engineering identities.</div></div>
  <div class="mw-form">
    <label>Evidence type<select data-mw-evidence-field="kind">${evidenceKindOptions()}</select></label>
    <label>Evidence title<input data-mw-evidence-field="title" placeholder="e.g. Cavity 3 dimension after controlled trial"></label>
    <label>Occurred at<input type="datetime-local" data-mw-evidence-field="occurredAt" value="${esc(new Date().toISOString().slice(0,16))}"></label>
    <label>Source / record reference<input data-mw-evidence-field="sourceRef" placeholder="inspection report, work order, trial sheet…"></label>
    <label>Material lot / batch<input data-mw-evidence-field="materialLot" placeholder="supplier / lot / batch identifier"></label>
    <label>Measurement<input data-mw-evidence-field="measurement" placeholder="numeric value or controlled observation"></label>
    <label>Unit<input data-mw-evidence-field="unit" placeholder="mm, g, %, cycles…"></label>
    <label>Method / measurement basis<input data-mw-evidence-field="methodRef" placeholder="gauge, test method, sample plan, work instruction…"></label>
    <label>Acceptance<select data-mw-evidence-field="acceptanceStatus">${evidenceAcceptanceOptions()}</select></label>
    <label class="wide">Acceptance basis / authority<input data-mw-evidence-field="acceptanceBasis" placeholder="approved drawing/spec, QA disposition, authorised release reference…"></label>
    <label class="wide">Result<textarea data-mw-evidence-field="result" placeholder="What was actually observed?"></textarea></label>
    <label class="wide">Notes<textarea data-mw-evidence-field="notes" placeholder="Method, sample size, measurement confidence, maintenance finding, limitations…"></textarea></label>
  </div>
  <div class="mw-actions"><button class="primary" type="button" data-mw-evidence-add>Add evidence record</button></div>
  <div class="mw-evidence-board">${items.length?items.map(evidenceItemHtml).join(''):'<div class="mw-empty">No structured trial, quality, maintenance, lot or acceptance evidence recorded yet.</div>'}</div>
  <p class="mw-help">Evidence records preserve what was observed and where it belongs. They do not by themselves prove causation or authorize a process change.</p>`;
  panel.querySelector('[data-mw-evidence-add]')?.addEventListener('click',async()=>{
    try{
      const input={};panel.querySelectorAll('[data-mw-evidence-field]').forEach(el=>input[el.dataset.mwEvidenceField]=el.value);
      if(input.occurredAt)input.occurredAt=new Date(input.occurredAt).toISOString();
      const revisionOf=panel.dataset.mwRevisionOf||'';
      if(revisionOf)await store.reviseCaseEvidence(revisionOf,input,store.learnerToken());
      else await store.saveCaseEvidence(c.id,input,store.learnerToken());
      await hydrateCaseEvidence(host,c);window.toast?.(revisionOf?'Evidence revision saved; original retained':'Evidence record saved');
    }catch(err){persistenceError(err)}
  });
  panel.querySelectorAll('[data-mw-evidence-revise]').forEach(btn=>btn.addEventListener('click',()=>{
    const item=items.find(x=>x.id===btn.dataset.mwEvidenceRevise);if(!item)return;
    panel.dataset.mwRevisionOf=item.id;
    for(const field of panel.querySelectorAll('[data-mw-evidence-field]')){
      let value=item[field.dataset.mwEvidenceField]??'';
      if(field.dataset.mwEvidenceField==='occurredAt'&&value)value=String(value).slice(0,16);
      field.value=String(value);
    }
    const add=panel.querySelector('[data-mw-evidence-add]');if(add)add.textContent='Save evidence revision';
    panel.querySelector('[data-mw-evidence-field="title"]')?.focus();
  }));
  panel.querySelectorAll('[data-mw-evidence-void]').forEach(btn=>btn.addEventListener('click',async()=>{
    const reason=prompt('Why is this evidence being voided? The original record will be retained in the audit trail.','');
    if(!String(reason||'').trim())return;
    try{await store.voidCaseEvidence(btn.dataset.mwEvidenceVoid,reason,store.learnerToken());await hydrateCaseEvidence(host,c);window.toast?.('Evidence void recorded; original retained')}catch(err){persistenceError(err)}
  }))
}
function casesHtml(active){const cs=all();if(!cs.length)return '<div class="mw-empty">No saved cases yet.</div>';return `<div class="mw-cases">${cs.slice(0,12).map(c=>`<div class="mw-case"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><small>${esc(status(c))} · ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button class="ghost" type="button" data-mw-open="${esc(c.id)}">${c.id===active?'Open':'View'}</button></div>`).join('')}</div>`}

function renderCase(c){activeId=c.id;const host=section();c.status=status(c);const pct=completeness(c);host.innerHTML=`
<div class="mw-hero card"><div class="eyebrow">Evidence-led troubleshooting workspace</div><h2>Mould Master case</h2><p>Define the symptom, localise where and when it occurs, compare against a known-good baseline, rank mechanisms, run the smallest controlled discriminating test, then verify the before/after result.</p><div class="mw-loop"><span>1 Define</span><span>2 Localise</span><span>3 Collect evidence</span><span>4 Rank mechanism</span><span>5 Controlled test</span><span>6 Verify</span></div><div class="mw-boundary"><b>Production boundary:</b> this workspace organises evidence and learning. It does not provide universal temperatures, pressures, speeds, force limits or authorisation to defeat safeguards. Verify the exact resin, machine, mould, validated process, approved site procedure and applicable safety requirements before real changes.</div></div>
<div class="mw-toolbar"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><div class="mw-help">Saved locally for this learner only.</div></div><div class="mw-actions"><button class="secondary" type="button" data-mw-new>New case</button><button class="ghost" type="button" data-mw-list>Case list</button><button class="ghost" type="button" data-mw-export>Export case</button></div></div>
<div class="mw-layout">
  <div class="mw-panel card"><h3>Case evidence record</h3><div class="mw-form">
    ${textField('Case title','title',c,false,'Use a short identifier such as “Cavity 3 flash after insert change”.')}
    <label>Defect / symptom<select data-mw-field="defect">${defectOptions(c)}</select><div class="mw-help">Select the closest visible symptom; the mechanism still has to be proven.</div></label>
    ${textField('Material / grade','material',c,false,'Record the exact grade and lot when known.')}
    ${textField('Exact material grade ID','materialGradeId',c,false,'Use the catalogue grade ID when this case is tied to a published exact grade.')}
    ${textField('Machine / cell','machine',c,false,'Record the actual machine/cell, not only a recipe name.')}
    ${textField('Machine / cell ID','machineId',c,false,'Use a stable plant identifier such as IMM-07 or CELL-2.')}
    ${textField('Mould / tool / cavity','mould',c,false,'Include cavity, gate, insert or local area where relevant.')}
    ${textField('Mould / tool ID','mouldId',c,false,'Use a stable mould/tool identifier so cases can be grouped over time.')}
    ${textField('Product / assembly','product',c,false,'Record the customer/product or assembly this part belongs to.')}
    ${textField('Product / assembly ID','productId',c,false,'Use the controlled product/assembly identifier when known.')}
    ${textField('Part / component','part',c,false,'Record the moulded component or part name.')}
    ${textField('Part / component ID','partId',c,false,'Use the drawing, SKU or internal part identifier when known.')}
    <label>When did it start?<select data-mw-field="onset">${onsetOptions(c)}</select><div class="mw-help">Timing around a change event is often strong localisation evidence.</div></label>
    ${textField('Where / how often','location',c,true,'e.g. cavity-specific, one side of part, every cycle, intermittent, after warm-up.')}
    ${area('Known-good baseline','baseline',c,'Record the last verified-good condition: actuals, material state, tool/cooling condition and part response as applicable.')}
    ${area('Current measured evidence','evidence',c,'Use actual measurements, alarms, trends, part location/pattern and physical inspection. Separate facts from assumptions.',true)}
    ${area('Ranked mechanism / hypothesis','hypothesis',c,'State the mechanism and why the evidence supports it more strongly than alternatives. Do not write a setting change as the diagnosis.')}
    ${area('Smallest controlled discriminating test','controlledTest',c,'Define one safe test or inspection that separates plausible mechanisms while staying inside approved limits.',true)}
    ${area('Test result','testResult',c,'Record what actually changed and whether the result supported or weakened the mechanism.')}
    ${area('After-change / recovery evidence','afterChange',c,'Compare the same signals and part response used in the baseline. Recovery toward baseline strengthens causal confidence.')}
    ${area('Verification & repeatability','verification',c,'Record repeat cycles, independent quality checks, measurement confidence and any maintenance/tooling confirmation.')}
    ${area('Conclusion / standardisation','conclusion',c,'State what was proven, what remains uncertain, and what approved standard/work instruction/change-control action follows.',true)}
  </div><div class="mw-actions"><button class="primary" type="button" data-mw-save>Save case</button><button class="danger mw-danger" type="button" data-mw-delete>Delete case</button></div></div>
  <aside class="mw-summary">
    <div class="mw-panel card" data-mw-engineering-context><h3>Engineering context</h3><div class="mw-empty">Loading linked material, machine, mould and product/part context…</div></div>
    <div class="mw-panel card" data-mw-case-evidence><h3>Closed-loop evidence</h3><div class="mw-empty">Loading trial, quality, maintenance, lot and acceptance evidence…</div></div>
    <div class="mw-panel card"><h3>Case status</h3><div class="mw-kpi"><span>Evidence chain</span><b>${esc(c.status)}</b></div><div class="mw-kpi"><span>Record completeness</span><b>${pct}%</b><div class="mw-progress"><i style="width:${pct}%"></i></div></div><div class="mw-kpi"><span>Decision rule</span><b>${c.verification.trim()?'Verification recorded':'Do not standardise yet'}</b></div></div>
    <div class="mw-panel card"><h3>Defect evidence board</h3>${evidenceBoard(c)}</div>
    <div class="mw-panel card">${relatedHtml(c)}</div>
  </aside>
</div>`;wire(host,c);hydrateEngineeringContext(host,c);hydrateCaseEvidence(host,c)}

function collect(c){document.querySelectorAll('#mmMouldMasterWorkspace [data-mw-field]').forEach(el=>{c[el.dataset.mwField]=el.value});c.status=status(c);return c}
function wire(host,c){
  let timer=null;host.querySelectorAll('[data-mw-field]').forEach(el=>el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{try{await saveCase(collect(c))}catch(err){persistenceError(err)}},500)}));
  host.querySelector('[data-mw-save]')?.addEventListener('click',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved);window.toast?.('Mould Master case saved')}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const n=await saveCase(blank());renderCase(n)}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-list]')?.addEventListener('click',()=>renderList());
  host.querySelector('[data-mw-delete]')?.addEventListener('click',async()=>{if(!confirm('Delete this local troubleshooting case?'))return;try{await deleteCase(c.id);renderList()}catch(err){persistenceError(err)}});
  host.querySelector('[data-mw-export]')?.addEventListener('click',async()=>{try{await exportCase(collect(c))}catch(err){persistenceError(err)}});
  host.querySelectorAll('[data-mw-lesson]').forEach(b=>b.addEventListener('click',()=>{try{user.currentLesson=Number(b.dataset.mwLesson);persist();switchView('lesson')}catch(_){}}));
  host.querySelector('[data-mw-defects]')?.addEventListener('click',()=>switchView('defects'));
  host.querySelector('[data-mw-diagnostic]')?.addEventListener('click',()=>window.MM_DIAGNOSTIC_LABS?.open?.());
  host.querySelector('[data-mw-data-home]')?.addEventListener('click',()=>window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.());
  host.querySelectorAll('[data-mw-data]').forEach(b=>b.addEventListener('click',()=>{
    const origin=b.dataset.mwDataOrigin||'Guided 14',id=b.dataset.mwData;
    if(origin==='20-pass atlas'){
      window.MM_PROCESS_DATA_20_PASS_ATLAS?.open?.();
      return setTimeout(()=>document.querySelector(`[data-at20-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    if(origin==='50-case deep dive'){
      window.MM_PROCESS_DATA_DEEP_DIVE_50?.open?.();
      return setTimeout(()=>document.querySelector(`[data-dd50-open="${CSS.escape(id)}"]`)?.click(),0)
    }
    window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.();
    setTimeout(()=>document.querySelector(`[data-pd-start="${CSS.escape(id)}"]`)?.click(),0)
  }));
  host.querySelectorAll('[data-mw-material]').forEach(b=>b.addEventListener('click',()=>{window.MM_MATERIAL_BEHAVIOUR_LABS?.open?.();setTimeout(()=>document.querySelector(`[data-ml-start="${CSS.escape(b.dataset.mwMaterial)}"]`)?.click(),0)}));
  host.querySelector('[data-mw-field="defect"]')?.addEventListener('change',async()=>{try{const saved=await saveCase(collect(c));renderCase(saved)}catch(err){persistenceError(err)}})
}
async function exportCase(c){const store=await resolveStore(),owner=store?.learnerToken?.(),evidence=store?.listCaseEvidence?await store.listCaseEvidence(c.id,owner):[],evidenceAudit=store?.evidenceAuditTrail?await store.evidenceAuditTrail(c.id,owner):[],links=store?.linksForCase?await store.linksForCase(c.id,owner):[];const payload={schema:4,version:VERSION,engineeringContext:{materialGradeId:c.materialGradeId||null,machineId:c.machineId||null,mouldId:c.mouldId||null,productId:c.productId||null,partId:c.partId||null},links,evidence,evidenceAudit,exportedAt:now(),trainingBoundary:'Evidence record only; not a universal production recipe or machine authorisation.',case:c};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-case-${String(c.title||c.id).replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,48)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
async function importCaseFile(file){
  if(!file)throw new Error('Choose a MouldMaster case JSON file');
  if(file.size>5*1024*1024)throw new Error('Case import is limited to 5 MiB');
  const parsed=JSON.parse(await file.text()),store=await resolveStore();if(!store?.importCaseBundle)throw new Error('Engineering case restore is unavailable');
  const result=await store.importCaseBundle(parsed,store.learnerToken());
  await hydrate({force:true});await open(result.caseId);return result
}
function renderList(){activeId='';const host=section();host.innerHTML=`<div class="mw-hero card"><div class="eyebrow">Mould Master</div><h2>Troubleshooting casebook</h2><p>Keep diagnosis tied to the evidence chain rather than a sequence of unrecorded machine adjustments.</p><div class="mw-boundary"><b>Local-only record:</b> cases stay in this browser/desktop profile unless you explicitly export a case JSON file. Restores create a new learner-owned case rather than overwriting an existing case. No case data is uploaded by this module.</div></div><div class="mw-toolbar"><div><h2 style="margin:0">Saved cases</h2><p class="muted" style="margin:4px 0 0">${all().length} local case${all().length===1?'':'s'}</p></div><div class="mw-actions"><button class="primary" type="button" data-mw-new>New case</button><button class="ghost" type="button" data-mw-import>Import case</button></div></div><div class="mw-panel card">${casesHtml('')}</div>`;host.querySelector('[data-mw-new]')?.addEventListener('click',async()=>{try{const c=await saveCase(blank());renderCase(c)}catch(err){persistenceError(err)}});host.querySelector('[data-mw-import]')?.addEventListener('click',()=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{try{const result=await importCaseFile(input.files?.[0]);window.toast?.(`Imported case with ${result.evidenceImported} evidence record${result.evidenceImported===1?'':'s'}`)}catch(err){persistenceError(err)}});input.click()});host.querySelectorAll('[data-mw-open]').forEach(b=>b.addEventListener('click',()=>{const c=get(b.dataset.mwOpen);if(c)renderCase(c)}))}
async function open(id){style();await hydrate();const host=section();hideViews();host.classList.remove('hidden');header();mark();const c=id&&get(id)||get(activeId);if(c)renderCase(c);else renderList();window.scrollTo?.({top:0,behavior:'smooth'})}
async function newCase(seed={}){await hydrate();const c=await saveCase({...blank(),...seed,id:uid(),createdAt:now(),updatedAt:now()});await open(c.id);return c.id}

style();section();
window.mmOpenMouldMaster=()=>open();
window.MM_MOULD_MASTER_WORKSPACE={version:VERSION,canonicalStore:'mouldmaster-engineering-v2/db3',hydrate,open,newCase,importCaseFile,cases:()=>all().map(x=>({...x})),getCase:id=>{const c=get(id);return c?{...c}:null},evidence:async id=>{const store=await resolveStore();return store?.listCaseEvidence?store.listCaseEvidence(id,store.learnerToken()):[]},evidenceSummary:async id=>{const store=await resolveStore();return store?.evidenceSummary?store.evidenceSummary(id,store.learnerToken()):null},engineeringContext:id=>{const c=get(id);return c?{materialGradeId:c.materialGradeId||null,material:c.material||'',machineId:c.machineId||null,machine:c.machine||'',mouldId:c.mouldId||null,mould:c.mould||'',productId:c.productId||null,product:c.product||'',partId:c.partId||null,part:c.part||''}:null},learnerToken:()=>hydratedLearnerToken,storageError:()=>storageFailure,scope:'Learner-scoped local IndexedDB evidence casebook; legacy localStorage is migration input only; no network upload, universal production setpoints, assessment mutation or machine authorisation.'};
window.addEventListener('mm:domains-ready',()=>hydrate({force:true}),{once:true});
})();
