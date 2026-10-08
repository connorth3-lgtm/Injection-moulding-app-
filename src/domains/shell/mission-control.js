/* MouldMaster Mission Control — app-wide apprenticeship shell 2026.10.08.5 */
(function(){
'use strict';
if(window.MM_MISSION_CONTROL)return;

const VERSION='2026.10.08.5';
const STORAGE_KEY='mm_mission_control_v1';
const STAGES=Object.freeze([
  ['brief','Brief'],
  ['baseline','Baseline'],
  ['evidence','Evidence'],
  ['hypothesis','Hypothesis'],
  ['test','Test'],
  ['intervention','Intervention'],
  ['verification','Verification'],
  ['reflection','Reflection']
]);
const MODES=Object.freeze({
  learner:{label:'Learner',description:'Guided explanations, visible evidence prompts and learning support.'},
  technician:{label:'Technician',description:'Faster task flow with concise prompts and operational context.'},
  engineer:{label:'Engineer',description:'Dense evidence context with minimal teaching chrome.'}
});
const DEFAULT_STATE=Object.freeze({
  schema:1,
  mode:'learner',
  surface:'dashboard',
  mission:null,
  evidence:[],
  drawerOpen:false,
  paletteOpen:false
});
const FIXED_COMMANDS=Object.freeze([
  {id:'home',label:'Home',hint:'Today, mission resume and learning focus',keywords:'dashboard today'},
  {id:'learn',label:'Learn',hint:'Lessons and learning pathway',keywords:'lesson theory pathway'},
  {id:'practice',label:'Practice',hint:'Guided practice and diagnostics',keywords:'scenario training'},
  {id:'materials',label:'Materials',hint:'Material families and governed evidence',keywords:'resin polymer grade'},
  {id:'spatial',label:'Spatial Twin',hint:'Enter the explorable moulding cell',keywords:'digital twin cell simulator'},
  {id:'apprentice',label:'Virtual Apprenticeship',hint:'Evidence-first shop-floor investigations',keywords:'case scenario diagnosis'},
  {id:'mould-master',label:'Mould Master',hint:'Build a persistent troubleshooting case',keywords:'diagnose case evidence'},
  {id:'process-data',label:'Process Data',hint:'Analyse machine, cavity and quality signals',keywords:'chart csv trend'},
  {id:'book',label:'Book',hint:'Governed injection moulding reference',keywords:'reference chapter'},
  {id:'exams',label:'Assessments',hint:'Formal knowledge checks',keywords:'exam questions assessment'},
  {id:'profile',label:'Progress',hint:'Learner progress and saved work',keywords:'profile certificate progress'},
  {id:'standards',label:'Standards',hint:'Standards and evidence readiness',keywords:'standards evidence governance'},
  {id:'mission-new',label:'Start a mission',hint:'Create a persistent learning or diagnostic mission',keywords:'new investigation task'},
  {id:'evidence-open',label:'Open evidence drawer',hint:'See observations, hypotheses, notes and verification evidence',keywords:'evidence notes'},
  {id:'mode-cycle',label:'Change workspace mode',hint:'Learner · Technician · Engineer',keywords:'mode role density'}
]);

let state=loadState();
let installed=false;
let dashboardRegistered=false;
let unbindView=null;

function clone(v){return JSON.parse(JSON.stringify(v))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function runtimeStorage(){return window.MM_RUNTIME_V2?.storage||null}
function normalizeContext(input={}){
  return {
    machine:String(input.machine||'').trim(),
    mould:String(input.mould||'').trim(),
    material:String(input.material||'').trim(),
    part:String(input.part||input.product||'').trim(),
    caseId:String(input.caseId||input.case||'').trim()
  }
}
function normalizeMission(input={}){
  const stage=STAGES.some(x=>x[0]===input.stage)?input.stage:'brief';
  return {
    id:String(input.id||('mission-'+Date.now().toString(36))),
    title:String(input.title||'Untitled mission').trim().slice(0,140),
    kind:String(input.kind||'learning').trim().slice(0,48),
    stage,
    context:normalizeContext(input.context||{}),
    startedAt:String(input.startedAt||new Date().toISOString()),
    updatedAt:String(input.updatedAt||new Date().toISOString())
  }
}
function loadState(){
  const saved=runtimeStorage()?.get?.(STORAGE_KEY,null);
  if(!saved||typeof saved!=='object')return clone(DEFAULT_STATE);
  return {
    ...clone(DEFAULT_STATE),
    ...saved,
    mode:MODES[saved.mode]?saved.mode:'learner',
    mission:saved.mission?normalizeMission(saved.mission):null,
    evidence:Array.isArray(saved.evidence)?saved.evidence.slice(-100):[]
  }
}
function saveState(){
  if(state.mission)state.mission.updatedAt=new Date().toISOString();
  runtimeStorage()?.set?.(STORAGE_KEY,{
    schema:1,mode:state.mode,surface:state.surface,mission:state.mission,evidence:state.evidence,
    drawerOpen:false,paletteOpen:false
  });
  window.dispatchEvent(new CustomEvent('mm:mission-change',{detail:snapshot()}));
}
function snapshot(){return Object.freeze({version:VERSION,mode:state.mode,surface:state.surface,mission:state.mission?clone(state.mission):null,evidence:clone(state.evidence)})}
function activeStageIndex(){const id=state.mission?.stage||'brief';const i=STAGES.findIndex(x=>x[0]===id);return i<0?0:i}
function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el}
function root(){return document.getElementById('mmMissionControl')}
function contextValue(v,fallback='Not set'){return String(v||'').trim()||fallback}
function currentLessonContext(){
  try{
    if(typeof currentLesson==='function'){
      const l=currentLesson();
      if(l)return {title:l.title||l.name||'',id:l.id||''}
    }
  }catch(_){}
  return null
}
function contextMarkup(){
  const m=state.mission,c=m?.context||{};
  return `<div class="mm-mc-context" aria-label="Mission context">
    <button type="button" class="mm-mc-brand" data-mm-mc-palette aria-label="Open Mission Control command search"><span class="mm-mc-orb" aria-hidden="true">MM</span><span><small>Mission Control</small><b>${esc(m?.title||'No active mission')}</b></span><kbd>⌘K</kbd></button>
    <div class="mm-mc-context-items">
      <div><span>Machine</span><b>${esc(contextValue(c.machine))}</b></div>
      <div><span>Mould</span><b>${esc(contextValue(c.mould))}</b></div>
      <div><span>Material</span><b>${esc(contextValue(c.material))}</b></div>
      <div><span>Part</span><b>${esc(contextValue(c.part))}</b></div>
      <div><span>Case</span><b>${esc(contextValue(c.caseId))}</b></div>
    </div>
    <div class="mm-mc-actions">
      <button type="button" class="ghost" data-mm-mc-mode title="Change Mission Control workspace mode">${esc(MODES[state.mode].label)}</button>
      <button type="button" class="secondary" data-mm-mc-evidence>Evidence <span>${state.evidence.length}</span></button>
    </div>
  </div>`;
}
function timelineMarkup(){
  if(!state.mission)return `<div class="mm-mc-timeline mm-mc-empty"><button type="button" data-mm-mc-new><b>Start a mission</b><span>Keep context, evidence and progress connected across the app.</span></button></div>`;
  const active=activeStageIndex();
  return `<div class="mm-mc-timeline" aria-label="Mission timeline">
    <div class="mm-mc-stage-track">${STAGES.map(([id,label],i)=>`<button type="button" data-mm-mc-stage="${id}" class="${i===active?'active':''} ${i<active?'complete':''}" aria-current="${i===active?'step':'false'}"><span>${i+1}</span><b>${esc(label)}</b></button>`).join('')}</div>
    <button type="button" class="mm-mc-next" data-mm-mc-next ${active>=STAGES.length-1?'disabled':''}>Next →</button>
  </div>`;
}
function evidenceMarkup(){
  const rows=state.evidence.slice().reverse();
  return `<div class="mm-mc-drawer-panel" role="dialog" aria-modal="false" aria-label="Mission evidence">
    <header><div><span class="eyebrow">Mission evidence</span><h2>${esc(state.mission?.title||'Evidence drawer')}</h2></div><button type="button" class="ghost" data-mm-mc-drawer-close aria-label="Close evidence drawer">×</button></header>
    <div class="mm-mc-evidence-form">
      <label>Evidence type<select data-mm-mc-evidence-kind><option value="observed">Observed</option><option value="measured">Measured</option><option value="hypothesis">Hypothesis</option><option value="unknown">Unknown</option><option value="note">Note</option><option value="verification">Verification</option></select></label>
      <label class="wide">Add to the evidence chain<textarea data-mm-mc-evidence-text rows="3" placeholder="Record what is known, measured, inferred or still unknown."></textarea></label>
      <button type="button" class="primary" data-mm-mc-evidence-add>Add evidence</button>
    </div>
    <div class="mm-mc-evidence-list">${rows.length?rows.map(row=>`<article class="mm-mc-evidence-row" data-kind="${esc(row.kind)}"><div><span>${esc(row.kind)}</span><time>${esc(new Date(row.at).toLocaleString())}</time></div><p>${esc(row.text)}</p><button type="button" class="ghost" data-mm-mc-evidence-remove="${esc(row.id)}">Remove</button></article>`).join(''):'<div class="mm-mc-empty-state"><b>No mission evidence yet.</b><p>Add observations, measurements, hypotheses and verification notes here. They stay learner-scoped on this device.</p></div>'}</div>
    <footer>Learning/evidence boundary: Mission Control organises context and reasoning. It does not authorise machine, mould, material, maintenance, safeguarding or production changes.</footer>
  </div>`;
}
function commandItems(){
  const dynamic=[];
  document.querySelectorAll('#nav button,.mobile-nav button').forEach((el,i)=>{
    const label=(el.textContent||'').trim().replace(/\s+/g,' ');
    if(label&&label.length<80)dynamic.push({id:'dom-'+i,label,hint:'App navigation',keywords:label.toLowerCase(),element:el});
  });
  return [...FIXED_COMMANDS,...dynamic].filter((row,i,arr)=>arr.findIndex(x=>x.label.toLowerCase()===row.label.toLowerCase())===i);
}
function paletteMarkup(){
  return `<div class="mm-mc-palette-backdrop" data-mm-mc-palette-close>
    <section class="mm-mc-palette" role="dialog" aria-modal="true" aria-label="Mission Control command search" data-mm-mc-palette-panel>
      <header><span class="mm-mc-orb" aria-hidden="true">MM</span><input type="search" data-mm-mc-query placeholder="Search MouldMaster or type a command…" autocomplete="off" aria-label="Search MouldMaster commands"><button type="button" class="ghost" data-mm-mc-palette-close>Esc</button></header>
      <div class="mm-mc-command-results" data-mm-mc-results></div>
      <footer><span>↑↓ navigate</span><span>Enter open</span><span>Esc close</span><span>/ or ⌘K search</span></footer>
    </section>
  </div>`;
}
function render(){
  const host=root();if(!host)return;
  host.innerHTML=contextMarkup()+timelineMarkup()+
    `<div class="mm-mc-drawer ${state.drawerOpen?'open':''}" aria-hidden="${state.drawerOpen?'false':'true'}">${evidenceMarkup()}</div>`+
    `<div class="mm-mc-palette-host ${state.paletteOpen?'open':''}" aria-hidden="${state.paletteOpen?'false':'true'}">${state.paletteOpen?paletteMarkup():''}</div>`;
  bind(host);
  document.body.dataset.mmMissionMode=state.mode;
  document.body.classList.toggle('mm-mission-active',Boolean(state.mission));
  if(state.paletteOpen)renderCommands('');
}
function install(){
  if(installed&&root())return true;
  const host=make('div','mm-mission-control');host.id='mmMissionControl';
  const main=document.querySelector('.main')||document.querySelector('main')||document.body.firstElementChild;
  if(main&&main.parentNode)main.parentNode.insertBefore(host,main);else document.body.prepend(host);
  installed=true;render();bindShell();registerDashboard();return true;
}
function bind(host){
  host.querySelector('[data-mm-mc-palette]')?.addEventListener('click',openPalette);
  host.querySelector('[data-mm-mc-evidence]')?.addEventListener('click',()=>toggleDrawer(true));
  host.querySelector('[data-mm-mc-mode]')?.addEventListener('click',cycleMode);
  host.querySelector('[data-mm-mc-new]')?.addEventListener('click',startMissionDialog);
  host.querySelector('[data-mm-mc-next]')?.addEventListener('click',nextStage);
  host.querySelectorAll('[data-mm-mc-stage]').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.mmMcStage)));
  host.querySelector('[data-mm-mc-drawer-close]')?.addEventListener('click',()=>toggleDrawer(false));
  host.querySelector('[data-mm-mc-evidence-add]')?.addEventListener('click',addEvidenceFromDrawer);
  host.querySelectorAll('[data-mm-mc-evidence-remove]').forEach(b=>b.addEventListener('click',()=>removeEvidence(b.dataset.mmMcEvidenceRemove)));
  host.querySelectorAll('[data-mm-mc-palette-close]').forEach(b=>b.addEventListener('click',e=>{if(e.target===b||b.tagName==='BUTTON')closePalette()}));
  const panel=host.querySelector('[data-mm-mc-palette-panel]');panel?.addEventListener('click',e=>e.stopPropagation());
  const q=host.querySelector('[data-mm-mc-query]');q?.addEventListener('input',()=>renderCommands(q.value));q?.addEventListener('keydown',paletteKeydown);
}
function startMission(input={}){
  state.mission=normalizeMission(input);
  state.evidence=[];
  state.drawerOpen=false;state.paletteOpen=false;saveState();render();registerDashboard(true);return snapshot()
}
function startMissionDialog(){
  const lesson=currentLessonContext();
  const title=prompt('Mission title',lesson?.title?('Learn: '+lesson.title):'Investigate moulding evidence');
  if(!String(title||'').trim())return false;
  return startMission({title:String(title).trim(),kind:lesson?'learning':'investigation',stage:'brief'})
}
function attachContext(input={},options={}){
  const context=normalizeContext(input);
  if(!state.mission&&options.startIfEmpty!==false){
    state.mission=normalizeMission({title:options.title||context.caseId||'Injection moulding mission',kind:options.kind||'investigation',stage:options.stage||'brief',context})
  }else if(state.mission){
    state.mission.context={...state.mission.context,...Object.fromEntries(Object.entries(context).filter(([,v])=>v))};
    if(options.title)state.mission.title=String(options.title).slice(0,140);
    if(options.stage&&STAGES.some(x=>x[0]===options.stage))state.mission.stage=options.stage;
  }
  saveState();render();registerDashboard(true);return snapshot()
}
function setStage(id){
  if(!state.mission||!STAGES.some(x=>x[0]===id))return false;
  state.mission.stage=id;saveState();render();registerDashboard(true);return true
}
function nextStage(){if(!state.mission)return false;const i=activeStageIndex();if(i>=STAGES.length-1)return false;return setStage(STAGES[i+1][0])}
function setMode(id){if(!MODES[id])return false;state.mode=id;saveState();render();return true}
function cycleMode(){const ids=Object.keys(MODES),i=ids.indexOf(state.mode);setMode(ids[(i+1)%ids.length])}
function addEvidence(input={}){
  const text=String(input.text||'').trim();if(!text)return false;
  const kind=['observed','measured','hypothesis','unknown','note','verification'].includes(input.kind)?input.kind:'note';
  state.evidence.push({id:'e-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),kind,text:text.slice(0,1600),at:new Date().toISOString(),surface:state.surface});
  state.evidence=state.evidence.slice(-100);saveState();render();registerDashboard(true);return true
}
function addEvidenceFromDrawer(){
  const host=root(),kind=host?.querySelector('[data-mm-mc-evidence-kind]')?.value||'note',box=host?.querySelector('[data-mm-mc-evidence-text]');
  if(!box)return false;const ok=addEvidence({kind,text:box.value});if(ok){state.drawerOpen=true;render()}return ok
}
function removeEvidence(id){state.evidence=state.evidence.filter(x=>x.id!==id);saveState();render();registerDashboard(true)}
function toggleDrawer(open=!state.drawerOpen){state.drawerOpen=Boolean(open);if(state.drawerOpen)state.paletteOpen=false;render();requestAnimationFrame(()=>root()?.querySelector('[data-mm-mc-evidence-text]')?.focus())}
function openPalette(){state.paletteOpen=true;state.drawerOpen=false;render();requestAnimationFrame(()=>root()?.querySelector('[data-mm-mc-query]')?.focus())}
function closePalette(){state.paletteOpen=false;render()}
function paletteKeydown(e){
  const buttons=[...root().querySelectorAll('[data-mm-mc-command]')],current=document.activeElement,idx=buttons.indexOf(current);
  if(e.key==='ArrowDown'){e.preventDefault();(buttons[idx+1]||buttons[0])?.focus()}
  else if(e.key==='ArrowUp'){e.preventDefault();(buttons[idx-1]||buttons.at(-1))?.focus()}
  else if(e.key==='Escape'){e.preventDefault();closePalette()}
}
function renderCommands(query=''){
  const box=root()?.querySelector('[data-mm-mc-results]');if(!box)return;
  const q=String(query).trim().toLowerCase(),rows=commandItems().filter(row=>!q||(`${row.label} ${row.hint||''} ${row.keywords||''}`).toLowerCase().includes(q)).slice(0,18);
  box.innerHTML=rows.length?rows.map((row,i)=>`<button type="button" data-mm-mc-command="${esc(row.id)}" data-mm-mc-index="${i}"><span><b>${esc(row.label)}</b><small>${esc(row.hint||'Open')}</small></span><kbd>↵</kbd></button>`).join(''):'<div class="mm-mc-empty-state"><b>No matching command.</b><p>Try a view, tool, material, evidence or mission term.</p></div>';
  box.querySelectorAll('[data-mm-mc-command]').forEach(b=>b.addEventListener('click',()=>executeCommand(rows[Number(b.dataset.mmMcIndex)])));
}
function executeCommand(row){
  if(!row)return false;closePalette();
  if(row.element){row.element.click();return true}
  const view=id=>{try{window.switchView?.(id);return true}catch(_){return false}};
  switch(row.id){
    case 'home':return view('dashboard');case 'learn':return view('path');case 'practice':return view('scenarios');case 'materials':return view('materials');
    case 'exams':return view('exams');case 'profile':return view('profile');case 'standards':return view('standards');
    case 'spatial':return window.MM_SPATIAL_TWIN?.open?.({})??view('simulator');
    case 'apprentice':return window.MM_VIRTUAL_APPRENTICESHIP?.openCase?.(0)??view('simulator');
    case 'mould-master':return window.MM_MOULD_MASTER_WORKSPACE?.open?.()??view('defects');
    case 'process-data':return window.MM_PROCESS_DATA_DIAGNOSTICS?.open?.()??view('scenarios');
    case 'book':return window.MMBook?.open?.()??false;
    case 'mission-new':return startMissionDialog();
    case 'evidence-open':toggleDrawer(true);return true;
    case 'mode-cycle':cycleMode();return true;
    default:return false;
  }
}
function setSurface(id){state.surface=String(id||'').trim()||'unknown';saveState();render()}
function bindShell(){
  if(unbindView)return;
  const shell=window.MM_APP_SHELL;
  if(shell?.events?.onViewChange){
    unbindView=shell.events.onViewChange(id=>setSurface(id));
    for(const id of ['dashboard','lesson'])shell.events.onRender?.(id,()=>setSurface(id));
  }
}
function dashboardHtml(){
  if(!state.mission)return `<section class="card mm-mc-home-card"><div><span class="eyebrow">Mission Control</span><h2>Start a connected learning mission</h2><p>Keep context, evidence and progress linked while you move through lessons, Spatial Twin, Materials, Book and diagnostics.</p></div><button type="button" class="primary" data-mm-mc-home-start>Start mission</button></section>`;
  const c=state.mission.context||{},stage=STAGES[activeStageIndex()][1];
  return `<section class="card mm-mc-home-card"><div><span class="eyebrow">Continue mission · ${esc(stage)}</span><h2>${esc(state.mission.title)}</h2><p>${esc([c.machine,c.mould,c.material,c.part].filter(Boolean).join(' · ')||'Context follows you across MouldMaster.')}</p><div class="mm-mc-home-meta"><span>${state.evidence.length} evidence items</span><span>${esc(MODES[state.mode].label)} mode</span></div></div><div class="mm-mc-home-actions"><button type="button" class="primary" data-mm-mc-home-evidence>Open evidence</button><button type="button" class="ghost" data-mm-mc-home-command>Find a tool</button></div></section>`;
}
function renderDashboardCard(slot){
  slot.innerHTML=dashboardHtml();
  slot.querySelector('[data-mm-mc-home-start]')?.addEventListener('click',startMissionDialog);
  slot.querySelector('[data-mm-mc-home-evidence]')?.addEventListener('click',()=>toggleDrawer(true));
  slot.querySelector('[data-mm-mc-home-command]')?.addEventListener('click',openPalette);
}
function registerDashboard(force=false){
  const shell=window.MM_APP_SHELL;if(!shell?.dashboard?.register)return;
  if(dashboardRegistered&&!force){shell.dashboard.requestCompose?.();return}
  if(!dashboardRegistered){shell.dashboard.register({id:'mission-control',zone:'before',order:5,render:renderDashboardCard});dashboardRegistered=true}
  shell.dashboard.requestCompose?.();
}
function keydown(e){
  const target=e.target,typing=target&&['INPUT','TEXTAREA','SELECT'].includes(target.tagName);
  if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();openPalette();return}
  if(!typing&&e.key==='/'){e.preventDefault();openPalette();return}
  if(e.key==='Escape'){
    if(state.paletteOpen){e.preventDefault();closePalette()}
    else if(state.drawerOpen){e.preventDefault();toggleDrawer(false)}
  }
}
function installWhenReady(){if(!document.body)return false;install();bindShell();registerDashboard();return true}

window.addEventListener('keydown',keydown);
window.addEventListener('mm:domains-ready',()=>{bindShell();registerDashboard();render()});
window.MM_MISSION_CONTROL=Object.freeze({
  version:VERSION,stages:STAGES,modes:MODES,install,startMission,attachContext,setStage,nextStage,setMode,
  addEvidence,toggleDrawer,openPalette,closePalette,setSurface,state:snapshot,
  boundary:'Learner-scoped mission orchestration and evidence organisation only; no machine-control, production-setting, maintenance, safeguarding or competence-signoff authority.'
});
try{window.MM_RUNTIME_V2?.registerModule?.('mission-control',{version:VERSION,type:'app-shell',scope:'persistent-context-mission-evidence-command',authority:'learning-and-evidence-organisation-only'})}catch(_){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installWhenReady,{once:true});else installWhenReady();
})();
