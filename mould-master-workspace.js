/* MouldMaster evidence-led troubleshooting workspace — 2026.08.26.1 */
(function(){
'use strict';
const VERSION='2026.08.26.1';
const STORAGE_BASE='mm_mould_master_cases_v1::';
const MAX_CASES=80;
let activeId='';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function learnerId(){try{return String((typeof db!=='undefined'&&db?.activeUser)||user?.id||'anonymous')}catch(_){return'anonymous'}}
function token(raw=learnerId()){let h=2166136261;for(const ch of String(raw)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function storageKey(){return STORAGE_BASE+token()}
function read(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function publishCasesChanged(cases){try{window.dispatchEvent(new CustomEvent('mm:mould-master-cases-changed',{detail:{learnerToken:token(),storageKey:storageKey(),cases:cases.map(x=>({...x}))}}))}catch(_){}}
function write(cases){const snapshot=cases.slice(0,MAX_CASES);try{localStorage.setItem(storageKey(),JSON.stringify(snapshot))}catch(_){}publishCasesChanged(snapshot)}
function uid(){try{return crypto.randomUUID()}catch(_){return 'case-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}}
function now(){return new Date().toISOString()}
function blank(){return{id:uid(),createdAt:now(),updatedAt:now(),title:'',defect:'',material:'',machine:'',mould:'',onset:'Unknown / not yet defined',location:'',baseline:'',evidence:'',hypothesis:'',controlledTest:'',testResult:'',afterChange:'',verification:'',conclusion:'',status:'Investigating'}}
function all(){return read().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))}
function get(id){return all().find(x=>x.id===id)||null}
function saveCase(c){const cases=all().filter(x=>x.id!==c.id);c.updatedAt=now();cases.unshift(c);write(cases);return c}
function deleteCase(id){write(all().filter(x=>x.id!==id));if(activeId===id)activeId=''}

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
function casesHtml(active){const cs=all();if(!cs.length)return '<div class="mw-empty">No saved cases yet.</div>';return `<div class="mw-cases">${cs.slice(0,12).map(c=>`<div class="mw-case"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><small>${esc(status(c))} · ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button class="ghost" type="button" data-mw-open="${esc(c.id)}">${c.id===active?'Open':'View'}</button></div>`).join('')}</div>`}

function renderCase(c){activeId=c.id;const host=section();c.status=status(c);const pct=completeness(c);host.innerHTML=`
<div class="mw-hero card"><div class="eyebrow">Evidence-led troubleshooting workspace</div><h2>Mould Master case</h2><p>Define the symptom, localise where and when it occurs, compare against a known-good baseline, rank mechanisms, run the smallest controlled discriminating test, then verify the before/after result.</p><div class="mw-loop"><span>1 Define</span><span>2 Localise</span><span>3 Collect evidence</span><span>4 Rank mechanism</span><span>5 Controlled test</span><span>6 Verify</span></div><div class="mw-boundary"><b>Production boundary:</b> this workspace organises evidence and learning. It does not provide universal temperatures, pressures, speeds, force limits or authorisation to defeat safeguards. Verify the exact resin, machine, mould, validated process, approved site procedure and applicable safety requirements before real changes.</div></div>
<div class="mw-toolbar"><div><b>${esc(c.title||c.defect||'Untitled case')}</b><div class="mw-help">Saved locally for this learner only.</div></div><div class="mw-actions"><button class="secondary" type="button" data-mw-new>New case</button><button class="ghost" type="button" data-mw-list>Case list</button><button class="ghost" type="button" data-mw-export>Export case</button></div></div>
<div class="mw-layout">
  <div class="mw-panel card"><h3>Case evidence record</h3><div class="mw-form">
    ${textField('Case title','title',c,false,'Use a short identifier such as “Cavity 3 flash after insert change”.')}
    <label>Defect / symptom<select data-mw-field="defect">${defectOptions(c)}</select><div class="mw-help">Select the closest visible symptom; the mechanism still has to be proven.</div></label>
    ${textField('Material / grade','material',c,false,'Record the exact grade and lot when known.')}
    ${textField('Machine / cell','machine',c,false,'Record the actual machine/cell, not only a recipe name.')}
    ${textField('Mould / tool / cavity','mould',c,false,'Include cavity, gate, insert or local area where relevant.')}
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
    <div class="mw-panel card"><h3>Case status</h3><div class="mw-kpi"><span>Evidence chain</span><b>${esc(c.status)}</b></div><div class="mw-kpi"><span>Record completeness</span><b>${pct}%</b><div class="mw-progress"><i style="width:${pct}%"></i></div></div><div class="mw-kpi"><span>Decision rule</span><b>${c.verification.trim()?'Verification recorded':'Do not standardise yet'}</b></div></div>
    <div class="mw-panel card"><h3>Defect evidence board</h3>${evidenceBoard(c)}</div>
    <div class="mw-panel card">${relatedHtml(c)}</div>
  </aside>
</div>`;wire(host,c)}

function collect(c){document.querySelectorAll('#mmMouldMasterWorkspace [data-mw-field]').forEach(el=>{c[el.dataset.mwField]=el.value});c.status=status(c);return c}
function wire(host,c){
  let timer=null;host.querySelectorAll('[data-mw-field]').forEach(el=>el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{collect(c);saveCase(c)},500)}));
  host.querySelector('[data-mw-save]')?.addEventListener('click',()=>{collect(c);saveCase(c);renderCase(c);window.toast?.('Mould Master case saved')});
  host.querySelector('[data-mw-new]')?.addEventListener('click',()=>{const n=saveCase(blank());renderCase(n)});
  host.querySelector('[data-mw-list]')?.addEventListener('click',renderList);
  host.querySelector('[data-mw-delete]')?.addEventListener('click',()=>{if(!confirm('Delete this local troubleshooting case?'))return;deleteCase(c.id);renderList()});
  host.querySelector('[data-mw-export]')?.addEventListener('click',()=>exportCase(collect(c)));
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
  host.querySelector('[data-mw-field="defect"]')?.addEventListener('change',()=>{collect(c);saveCase(c);renderCase(c)})
}
function exportCase(c){const payload={schema:1,version:VERSION,exportedAt:now(),trainingBoundary:'Evidence record only; not a universal production recipe or machine authorisation.',case:c};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mouldmaster-case-${String(c.title||c.id).replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,48)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function renderList(){activeId='';const host=section();host.innerHTML=`<div class="mw-hero card"><div class="eyebrow">Mould Master</div><h2>Troubleshooting casebook</h2><p>Keep diagnosis tied to the evidence chain rather than a sequence of unrecorded machine adjustments.</p><div class="mw-boundary"><b>Local-only record:</b> cases stay in this browser/desktop profile unless you explicitly export a case JSON file. No case data is uploaded by this module.</div></div><div class="mw-toolbar"><div><h2 style="margin:0">Saved cases</h2><p class="muted" style="margin:4px 0 0">${all().length} local case${all().length===1?'':'s'}</p></div><button class="primary" type="button" data-mw-new>New case</button></div><div class="mw-panel card">${casesHtml('')}</div>`;host.querySelector('[data-mw-new]')?.addEventListener('click',()=>{const c=saveCase(blank());renderCase(c)});host.querySelectorAll('[data-mw-open]').forEach(b=>b.addEventListener('click',()=>{const c=get(b.dataset.mwOpen);if(c)renderCase(c)}))}
function open(id){style();const host=section();hideViews();host.classList.remove('hidden');header();mark();const c=id&&get(id)||get(activeId);if(c)renderCase(c);else renderList();window.scrollTo?.({top:0,behavior:'smooth'})}
function newCase(seed={}){const c=saveCase({...blank(),...seed,id:uid(),createdAt:now(),updatedAt:now()});open(c.id);return c.id}

style();section();
window.mmOpenMouldMaster=()=>open();
window.MM_MOULD_MASTER_WORKSPACE={version:VERSION,open,newCase,cases:()=>all().map(x=>({...x})),getCase:id=>{const c=get(id);return c?{...c}:null},scope:'Learner-scoped local evidence casebook; no network upload, universal production setpoints, assessment mutation or machine authorisation.'};
})();
