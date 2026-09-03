
/* ===== app.js ===== */

const D = window.MM_DATA;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const defaultDB = {
  activeUser: "learner-1",
  users: {
    "learner-1": {id:"learner-1",name:"Learner 1",role:"learner",completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString()}
  }
};
const PRISTINE_DB = JSON.parse(JSON.stringify(defaultDB));
let db;
try{ db = JSON.parse(localStorage.getItem("mouldmasterProDB")) || JSON.parse(JSON.stringify(PRISTINE_DB)) }catch(e){ db=JSON.parse(JSON.stringify(PRISTINE_DB)) }
if(!db.users || !db.activeUser){db=defaultDB}
let user = db.users[db.activeUser];
if(user.onboardingDone === undefined) user.onboardingDone = false;
if(!user.experience) user.experience = "Beginner";
if(!user.goal) user.goal = "Learn the full process";
if(!user.dailyMinutes) user.dailyMinutes = 15;
if(!user.region) user.region = "ALL";
let currentView = "dashboard";
let simulatorState = {speed:55,transfer:96,hold:55,holdTime:5,melt:235,mould:55,cooling:14,clamp:75,vent:70,moisture:25};

function persist(){
  user.lastSeen = new Date().toISOString();
  db.users[db.activeUser]=user;
  localStorage.setItem("mouldmasterProDB",JSON.stringify(db));
  updateGlobalProgress();
}
function toast(msg){
  const t=$("#toast"); t.textContent=msg;t.classList.remove("hidden");
  setTimeout(()=>t.classList.add("hidden"),2200);
}
function switchView(id){
  currentView=id;
  $$(".view").forEach(v=>v.classList.add("hidden"));
  $("#"+id).classList.remove("hidden");
  $$("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  const titles={
    dashboard:["Home","Your next step is always shown first."],
    path:["My learning path","Follow a clear route from beginner fundamentals to expert engineering."],
    lesson:["Lesson","One focused topic at a time, with practical takeaways."],
    visuals:["Animated visuals","See the moulding process instead of only reading about it."],
    simulator:["Process simulator","Move process variables and see how relative defect risk changes."],
    defects:["Defect finder","Start with the symptom, then work toward evidence and likely causes."],
    scenarios:["Practice scenarios","Build troubleshooting judgement with realistic shop-floor problems."],
    coach:["Troubleshooting coach","Get structured guidance for defects, process questions and study topics."],
    exams:["Knowledge checks","Check what you know and earn local learning certificates."],
    certificates:["Certificates","View and print certificates you have earned."],
    instructor:["Instructor dashboard","Review local learner progress on this device."],
    glossary:["Glossary","Find technical terms in plain language."],
    profile:["Profile & data","Personalise your learning and manage local progress data."],
    standards:["Standards & safety","UK, US and New Zealand machinery-safety references used by the learning platform."]
  };
  $("#pageTitle").textContent=titles[id][0];$("#pageSubtitle").textContent=titles[id][1];
  renderView(id);
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("#nav button").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
$("#continueBtn").onclick=()=>{switchView("lesson")};
$("#searchBtn").onclick=openSearch;

function completedPct(){
  return Math.round((user.completed?.length||0)/D.lessons.length*100);
}
function courseProgress(course){
  const done=course.lessonIds.filter(id=>user.completed.includes(id)).length;
  return {done,total:course.lessonIds.length,pct:Math.round(done/course.lessonIds.length*100)};
}
function currentLesson(){ return D.lessons.find(l=>l.id===user.currentLesson)||D.lessons[0] }
function updateGlobalProgress(){
  const pct=completedPct();
  $("#sideProgress").style.width=pct+"%";$("#sideProgressText").textContent=pct+"%";
  $("#profileMini").innerHTML=`<div class="row"><div class="row" style="justify-content:flex-start"><div class="avatar">${(user.name||"L").slice(0,1).toUpperCase()}</div><div><b>${esc(user.name)}</b><div class="tiny muted">${esc(user.role||"learner")}</div></div></div><span class="pill">${pct}%</span></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

function renderView(id){
  if(id==="dashboard")renderDashboard();
  if(id==="path")renderPath();
  if(id==="lesson")renderLesson();
  if(id==="visuals")renderVisuals();
  if(id==="simulator")renderSimulator();
  if(id==="defects")renderDefects();
  if(id==="scenarios")renderScenarios();
  if(id==="coach")renderCoach();
  if(id==="exams")renderExams();
  if(id==="certificates")renderCertificates();
  if(id==="instructor")renderInstructor();
  if(id==="glossary")renderGlossary();
  if(id==="profile")renderProfile();
  if(id==="standards")renderStandards();
}
function renderDashboard(){
  const pct=completedPct(), c=currentLesson();
  const certs=user.certificates?.length||0;
  $("#dashboard").innerHTML=`
  <div class="hero">
    <div class="card hero-main">
      <span class="eyebrow">Personalised learning path</span>
      <h2>From first moulding cycle to advanced process engineering.</h2>
      <p>Train machine fundamentals, material behaviour, tooling, process development, scientific moulding, validation, DOE, automation, simulation and expert root-cause thinking.</p>
      <div class="hero-buttons">
        <button class="primary" data-mm-onclick="switchView('lesson')">Continue: ${esc(c.title)}</button>
        <button class="secondary" data-mm-onclick="switchView('simulator')">Open process simulator</button>
        <button class="ghost" data-mm-onclick="switchView('scenarios')">Practice troubleshooting</button>
      </div>
    </div>
    <div class="card statbox">
      <div class="statline"><span class="muted tiny">Overall progress</span><b>${pct}%</b></div>
      <div class="statline"><span class="muted tiny">Lessons completed</span><b>${user.completed.length}/${D.lessons.length}</b></div>
      <div class="statline"><span class="muted tiny">Certificates earned</span><b>${certs}/3</b></div>
    </div>
  </div>
  <div class="kpis">
    <div class="card kpi"><span>Micro-lessons</span><b>120</b></div>
    <div class="card kpi"><span>Technical tracks</span><b>12</b></div>
    <div class="card kpi"><span>Defects in lab</span><b>${D.defects.length}</b></div>
    <div class="card kpi"><span>Scenario drills</span><b>${D.scenarios.length}</b></div>
  </div>
  <div class="section-head"><div><h2>Continue your path</h2><p>Progress moves from core concepts toward evidence-based engineering.</p></div><button class="ghost" data-mm-onclick="switchView('path')">View all tracks</button></div>
  <div class="grid">${D.courses.slice(0,6).map(courseCard).join("")}</div>`;
}
function courseCard(c){
  const p=courseProgress(c);
  return `<div class="card course-card">
    <span class="eyebrow">${esc(c.level)}</span><h3>${c.id}. ${esc(c.name)}</h3><p>${esc(c.description)}</p>
    <div class="mini-bar"><span style="width:${p.pct}%"></span></div>
    <div class="course-bottom"><span class="pill">${p.done}/${p.total} complete</span><button class="secondary" data-mm-onclick="openCourse(${c.id})">${p.pct?"Resume":"Start"}</button></div>
  </div>`;
}
function openCourse(id){
  const c=D.courses.find(x=>x.id===id);
  const next=c.lessonIds.find(id=>!user.completed.includes(id))||c.lessonIds[0];
  user.currentLesson=next;persist();switchView("lesson");
}
function renderPath(){
  $("#path").innerHTML=`<div class="section-head"><div><h2>Beginner → Expert pathway</h2><p>Each track contains 10 concise lessons plus practical exercises.</p></div><span class="pill">120 lessons</span></div>
  <div class="learning-map">${D.courses.map(c=>{const p=courseProgress(c);return `<div class="card track-row"><div><span class="eyebrow">${esc(c.level)}</span><h3 style="margin:6px 0">${c.id}. ${esc(c.name)}</h3></div><div><p class="muted">${esc(c.description)}</p><div class="mini-bar"><span style="width:${p.pct}%"></span></div></div><div><b>${p.pct}% complete</b><div style="margin-top:8px"><button class="secondary" data-mm-onclick="openCourse(${c.id})">Open track</button></div></div></div>`}).join("")}</div>`;
}
function renderLesson(){
  const l=currentLesson(), c=D.courses.find(x=>x.id===l.course);
  const bookmarked=user.bookmarks?.includes(l.id);
  $("#lesson").innerHTML=`<div class="lesson-layout">
    <article class="card lesson-body">
      <span class="eyebrow">${esc(l.level)} · ${l.duration} min</span>
      <h2>${l.id}. ${esc(l.title)}</h2>
      <p>${esc(l.intro)}</p>
      <div class="callout"><b>Lesson focus:</b> ${esc(l.summary)}</div>
      <h3>Learning objectives</h3><ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <h3>Key engineering points</h3><ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <h3>Shop-floor exercise</h3><p>${esc(l.exercise)}</p>
      <div class="callout"><b>Evidence habit:</b> Record the starting condition, the change, the measured response and your conclusion. This makes troubleshooting transferable to other machines, moulds and shifts.</div>
      <h3>Your lesson notes</h3>
      <textarea class="note-area" id="lessonNotes" placeholder="Record observations, machine examples, questions or formulas...">${esc(user.notes?.[l.id]||"")}</textarea>
      <div class="hero-buttons">
        <button class="primary" data-mm-onclick="completeLesson(${l.id})">${user.completed.includes(l.id)?"Completed ✓":"Mark complete"}</button>
        <button class="secondary" data-mm-onclick="saveLessonNote(${l.id})">Save notes</button>
        <button class="ghost" data-mm-onclick="toggleBookmark(${l.id})">${bookmarked?"★ Bookmarked":"☆ Bookmark"}</button>
      </div>
    </article>
    <aside class="card lesson-side">
      <span class="eyebrow">Track ${c.id}: ${esc(c.name)}</span>
      <div class="mini-bar"><span style="width:${courseProgress(c).pct}%"></span></div>
      <div class="lesson-list">${c.lessonIds.map(id=>{const x=D.lessons.find(q=>q.id===id);return `<button class="${id===l.id?"active":""}" data-mm-onclick="goLesson(${id})">${user.completed.includes(id)?"✓ ":""}${id}. ${esc(x.title)}</button>`}).join("")}</div>
      <button class="secondary" style="width:100%;margin-top:12px" data-mm-onclick="nextLesson()">Next lesson →</button>
    </aside>
  </div>`;
}
function goLesson(id){user.currentLesson=id;persist();renderLesson();window.scrollTo({top:0,behavior:"smooth"})}
function nextLesson(){let id=user.currentLesson+1;if(id>D.lessons.length)id=1;goLesson(id)}
function completeLesson(id){if(!user.completed.includes(id))user.completed.push(id);persist();renderLesson();toast("Lesson completed")}
function saveLessonNote(id){user.notes=user.notes||{};user.notes[id]=$("#lessonNotes").value;persist();toast("Notes saved")}
function toggleBookmark(id){user.bookmarks=user.bookmarks||[];const i=user.bookmarks.indexOf(id);if(i>=0)user.bookmarks.splice(i,1);else user.bookmarks.push(id);persist();renderLesson()}

function renderVisuals(){
 $("#visuals").innerHTML=`
 <div class="grid2">
   <div class="card visual-wrap">
     <span class="eyebrow">Animated cycle visual</span><h2>Injection moulding cycle</h2>
     <div class="machine-scene"><div class="barrel"></div><div class="screw"></div><div class="nozzle"></div><div class="mould"><div></div><div></div></div><div class="cavity"></div><div class="flow-dot"></div></div>
     <div class="phase-tabs">
       <button data-mm-onclick="phaseExplain('Plasticising')">Plasticising</button><button data-mm-onclick="phaseExplain('Filling')">Filling</button><button data-mm-onclick="phaseExplain('Pack / hold')">Pack / hold</button><button data-mm-onclick="phaseExplain('Cooling')">Cooling</button><button data-mm-onclick="phaseExplain('Ejection')">Ejection</button>
     </div>
     <div class="callout" id="phaseText"><b>Watch the animation:</b> the screw prepares and delivers melt, the cavity fills, pressure is held while the gate is effective, then the part cools.</div>
   </div>
   <div class="card visual-wrap">
     <span class="eyebrow">Flow visual</span><h2>Fountain flow concept</h2>
     <div style="height:310px;display:grid;place-items:center;background:#0b1728;border:1px solid #2c4465;border-radius:16px;overflow:hidden">
       <svg viewBox="0 0 620 300" width="100%" height="100%" aria-label="Fountain flow schematic">
        <defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#55d6be"/></linearGradient></defs>
        <rect x="40" y="80" width="540" height="140" rx="18" fill="#1b2d47" stroke="#526f96" stroke-width="5"/>
        <path d="M65,150 C160,90 245,100 330,150 C420,205 500,190 555,150" fill="none" stroke="url(#g1)" stroke-width="22" stroke-linecap="round">
          <animate attributeName="stroke-dasharray" values="0 900;900 0" dur="4s" repeatCount="indefinite"/>
        </path>
        <path d="M70,151 C170,150 270,150 545,150" fill="none" stroke="#dcecff" stroke-width="3" stroke-dasharray="8 10"/>
        <text x="65" y="55" fill="#dcecff" font-size="20">Hotter core moves forward</text>
        <text x="315" y="260" fill="#9fb4d0" font-size="17">Flow reaches the front, turns toward the wall, then freezes progressively</text>
       </svg>
     </div>
     <p class="muted">This simplified schematic helps explain skin/core differences, orientation and why changing fill speed can alter surface and dimensional behaviour.</p>
   </div>
 </div>`;
}
function phaseExplain(p){
 const m={
  "Plasticising":"The screw rotates and moves backward as polymer is conveyed, melted and metered. Watch recovery time, screw speed, back pressure and melt condition.",
  "Filling":"The screw moves forward under velocity control. Fill time, transfer position and peak injection pressure are key actuals.",
  "Pack / hold":"Control changes from velocity to pressure. Packing compensates shrinkage until the gate stops transmitting pressure.",
  "Cooling":"Heat is removed through the mould and coolant system. Cooling balance strongly influences cycle, dimensions and warpage.",
  "Ejection":"The mould opens and the part is removed. Ejection should occur only when the part is sufficiently stable for the geometry and quality requirement."
 }[p];
 $("#phaseText").innerHTML=`<b>${p}:</b> ${m}`;
}

function renderSimulator(){
 $("#simulator").innerHTML=`
 <div class="grid2">
 <div class="card form-card">
  <span class="eyebrow">Educational process model</span><h2>Machine & process inputs</h2>
  <p class="muted">Move the controls. The model predicts relative defect risk for learning only; it is not a replacement for material/machine/tooling data.</p>
  <div class="form-grid">
   ${slider("Injection speed","speed",20,100,simulatorState.speed,"%")}
   ${slider("Transfer fill","transfer",85,100,simulatorState.transfer,"%")}
   ${slider("Hold pressure","hold",20,100,simulatorState.hold,"%")}
   ${slider("Hold time","holdTime",1,12,simulatorState.holdTime,"s")}
   ${slider("Melt temp","melt",180,320,simulatorState.melt,"°C")}
   ${slider("Mould temp","mould",20,120,simulatorState.mould,"°C")}
   ${slider("Cooling time","cooling",4,35,simulatorState.cooling,"s")}
   ${slider("Clamp margin","clamp",30,120,simulatorState.clamp,"%")}
   ${slider("Venting quality","vent",10,100,simulatorState.vent,"%")}
   ${slider("Moisture risk","moisture",0,100,simulatorState.moisture,"%")}
  </div>
  <div class="hero-buttons"><button class="secondary" data-mm-onclick="resetSimulator()">Reset</button><button class="ghost" data-mm-onclick="simPreset('robust')">Robust preset</button><button class="ghost" data-mm-onclick="simPreset('trouble')">Trouble preset</button></div>
 </div>
 <div class="card output-panel">
   <span class="eyebrow">Predicted response</span><h2>Relative defect risk</h2>
   <div class="part-visual"><div class="part-shape"></div><div id="simOverlay" class="defect-overlay"></div></div>
   <div id="riskList"></div>
   <div class="callout" id="simAdvice"></div>
 </div></div>`;
 updateSimulator();
}
function slider(label,key,min,max,val,unit){
 return `<label>${label}<div class="range-row"><input type="range" min="${min}" max="${max}" value="${val}" data-mm-oninput="simChange('${key}',this.value)"><input id="sim_${key}" value="${val}${unit}" readonly></div></label>`;
}
function simChange(k,v){simulatorState[k]=+v;const units={speed:"%",transfer:"%",hold:"%",holdTime:"s",melt:"°C",mould:"°C",cooling:"s",clamp:"%",vent:"%",moisture:"%"};$("#sim_"+k).value=v+units[k];updateSimulator()}
function clamp01(x){return Math.max(0,Math.min(100,x))}
function simRisks(){
 const s=simulatorState;
 return {
  "Short shot":clamp01((95-s.transfer)*9 + (45-s.speed)*.8 + (220-s.melt)*.22 + (50-s.hold)*.18),
  "Flash":clamp01((s.transfer-97)*12 + (s.hold-65)*.55 + (60-s.clamp)*1.1 + (s.melt-255)*.12),
  "Sink":clamp01((55-s.hold)*.8 + (5-s.holdTime)*8 + (12-s.cooling)*1.7),
  "Burn":clamp01((s.speed-70)*.8 + (55-s.vent)*1.1 + (s.melt-270)*.16),
  "Splay":clamp01(s.moisture*.75 + (s.melt-285)*.15 + (s.speed-85)*.3),
  "Warpage":clamp01((13-s.cooling)*3 + Math.abs(s.mould-60)*.28 + (s.hold-80)*.18)
 }
}
function updateSimulator(){
 const r=simRisks();
 $("#riskList").innerHTML=Object.entries(r).map(([k,v])=>`<div class="risk"><span>${k}</span><div class="riskbar"><span style="width:${v}%"></span></div><b>${Math.round(v)}</b></div>`).join("");
 const top=Object.entries(r).sort((a,b)=>b[1]-a[1])[0];
 let advice=top[1]<30?"The simulated process is in a relatively low-risk region. Now challenge one variable at a time to see which responses are most sensitive.":`Highest predicted risk: <b>${top[0]}</b>. Use the Defect Lab to inspect likely mechanisms, then make a controlled test rather than changing several settings.`;
 $("#simAdvice").innerHTML=advice;
 const ov=$("#simOverlay");let html="";
 if(r["Burn"]>55)html+=`<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#54200f;right:34%;top:32%;box-shadow:0 0 18px #ff7b00"></div>`;
 if(r["Flash"]>55)html+=`<div style="position:absolute;width:180px;height:8px;background:#55d6be;left:calc(50% - 90px);top:calc(50% + 56px);border-radius:50%"></div>`;
 if(r["Short shot"]>55)html+=`<div style="position:absolute;width:75px;height:125px;background:#0c182a;right:calc(50% - 80px);top:calc(50% - 62px);transform:rotate(12deg)"></div>`;
 if(r["Splay"]>55)html+=`<div style="position:absolute;width:95px;height:3px;background:#eef8ff;left:calc(50% - 45px);top:44%;transform:rotate(25deg);box-shadow:0 12px #eef8ff,0 24px #eef8ff"></div>`;
 ov.innerHTML=html;
}
function resetSimulator(){simulatorState={speed:55,transfer:96,hold:55,holdTime:5,melt:235,mould:55,cooling:14,clamp:75,vent:70,moisture:25};renderSimulator()}
function simPreset(p){
 simulatorState=p==="robust"?{speed:62,transfer:96,hold:62,holdTime:6,melt:240,mould:60,cooling:15,clamp:90,vent:90,moisture:5}:{speed:92,transfer:99,hold:85,holdTime:2,melt:290,mould:35,cooling:7,clamp:45,vent:25,moisture:80};renderSimulator()
}

function renderDefects(){
 $("#defects").innerHTML=`<div class="section-head"><div><h2>Defect diagnosis library</h2><p>Start with the physical mechanism and evidence before adjusting the process.</p></div><input id="defectSearch" style="max-width:320px" placeholder="Search defects..." data-mm-oninput="filterDefects()"></div><div class="grid" id="defectGrid">${D.defects.map(defectCard).join("")}</div>`;
}
function defectCard(d,i){return `<div class="card defect-card" data-defect="${esc((d.name+" "+d.symptom+" "+d.mechanisms.join(" ")).toLowerCase())}"><span class="eyebrow">Defect ${i+1}</span><h3>${esc(d.name)}</h3><p>${esc(d.symptom)}</p><button class="secondary" data-mm-onclick="openDefect(${i})">Diagnose</button></div>`}
function filterDefects(){const q=$("#defectSearch").value.toLowerCase();$$("[data-defect]").forEach(x=>x.classList.toggle("hidden",!x.dataset.defect.includes(q)))}
function openDefect(i){
 const d=D.defects[i];
 openModal(`<span class="eyebrow">Defect lab</span><h2>${esc(d.name)}</h2><p class="muted">${esc(d.symptom)}</p><div class="grid2"><div><h3>Likely mechanisms</h3><div class="cause-list">${d.mechanisms.map(x=>`<div class="cause">${esc(x)}</div>`).join("")}</div></div><div><h3>Evidence / checks</h3><div class="cause-list">${d.checks.map(x=>`<div class="cause">${esc(x)}</div>`).join("")}</div></div></div><div class="callout"><b>Best practice:</b> rank mechanisms by evidence, then run the smallest controlled test that distinguishes between them.</div><button class="primary" data-mm-onclick="closeModal();switchView('coach');setCoachPrompt('${esc(d.name).replace(/'/g,"\\'")}')">Ask coach about ${esc(d.name)}</button>`);
}

function renderScenarios(){
 $("#scenarios").innerHTML=`<div class="section-head"><div><h2>Shop-floor decision drills</h2><p>Choose the strongest next action based on the evidence provided.</p></div><span class="pill">${D.scenarios.length} scenarios</span></div><div class="grid2">${D.scenarios.map((s,i)=>`<div class="card scenario"><span class="eyebrow">Scenario ${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.situation)}</p>${s.choices.map((c,ci)=>`<button class="choice" data-mm-onclick="answerScenario(${i},${ci},this)">${esc(c)}</button>`).join("")}<div id="sf${i}" class="feedback hidden"></div></div>`).join("")}</div>`;
}
function answerScenario(i,ci,el){
 const s=D.scenarios[i],f=$("#sf"+i);f.classList.remove("hidden");
 f.innerHTML=`<b>${ci===s.correct?"Strong choice ✓":"Not the strongest first move"}</b><br>${esc(s.why)}`;
 [...el.parentNode.querySelectorAll(".choice")].forEach((b,j)=>{b.style.borderColor=j===s.correct?"#55d6be":""});
}

let coachHistory=[];
function renderCoach(){
 $("#coach").innerHTML=`<div class="grid2"><div class="card chat"><span class="eyebrow">Offline reasoning engine</span><h2>Troubleshooting Coach</h2><p class="muted">This version uses a transparent rule-based expert system in your browser. It does not send production data to an external AI service.</p><div class="chat-log" id="chatLog"></div><div class="chat-form"><input id="coachInput" placeholder="Describe a defect or ask a learning question..." data-mm-onkeydown="if(event.key==='Enter')coachSend()"><button class="primary" data-mm-onclick="coachSend()">Send</button></div></div>
 <div class="card form-card"><span class="eyebrow">Structured prompt builder</span><h2>Give the coach better evidence</h2>
 <div class="form-grid" style="grid-template-columns:1fr"><label>Defect<select id="coachDefect"><option value="">Select...</option>${D.defects.map(d=>`<option>${esc(d.name)}</option>`).join("")}</select></label><label>When did it start?<select id="coachWhen"><option>Just started</option><option>After material change</option><option>After mould maintenance</option><option>After machine change</option><option>Gradually over time</option></select></label><label>Evidence<textarea id="coachEvidence" placeholder="e.g. peak pressure up 18%, cushion varies, dryer alarm, one cavity only..."></textarea></label></div><button class="secondary" style="margin-top:12px" data-mm-onclick="coachBuild()">Build diagnosis</button>
 <div class="callout"><b>For production:</b> verify recommendations against the resin supplier, machine limits, mould documentation, validated process requirements and your site's safety procedures.</div></div></div>`;
 if(!coachHistory.length)coachHistory=[{role:"bot",text:"Describe the symptom, when it started, and any measured changes. I’ll structure the likely mechanisms and the next evidence to collect."}];
 drawChat();
}
function drawChat(){const l=$("#chatLog");if(!l)return;l.innerHTML=coachHistory.map(m=>`<div class="msg ${m.role}">${m.text}</div>`).join("");l.scrollTop=l.scrollHeight}
function setCoachPrompt(x){setTimeout(()=>{if($("#coachInput")){$("#coachInput").value=x+" troubleshooting";coachSend()}},50)}
function coachBuild(){
 const d=$("#coachDefect").value,w=$("#coachWhen").value,e=$("#coachEvidence").value;
 $("#coachInput").value=`${d||"Moulding defect"}. Started: ${w}. Evidence: ${e||"none recorded yet"}`;
 coachSend();
}
function coachSend(){
 const inp=$("#coachInput");if(!inp||!inp.value.trim())return;const q=inp.value.trim();coachHistory.push({role:"user",text:esc(q)});inp.value="";
 coachHistory.push({role:"bot",text:coachReply(q)});drawChat();
}
function coachReply(q){
 const s=q.toLowerCase();
 const d=D.defects.find(x=>s.includes(x.name.toLowerCase()));
 if(d)return `<b>${esc(d.name)} — likely mechanisms to rank:</b><br>1) ${esc(d.mechanisms.slice(0,3).join("; "))}.<br><br><b>Next evidence:</b> ${esc(d.checks.slice(0,4).join("; "))}.<br><br>Change one variable at a time unless you are deliberately running a designed experiment.`;
 if(s.includes("cushion"))return "Cushion variation should be evaluated with part mass, transfer position, peak pressure and shot delivery. Check non-return valve repeatability, feed consistency, recovery and whether the process is pressure-limited before compensating with hold pressure.";
 if(s.includes("cpk")||s.includes("capability"))return "Before interpreting Cpk, confirm process stability, adequate sampling and a capable measurement system. Cpk reflects spread and centring relative to specification; it does not prove the process mechanism is understood.";
 if(s.includes("gate seal")||s.includes("hold time"))return "A gate-seal study typically increases hold time in steps while tracking part mass. When additional hold time no longer increases mass, the gate is effectively sealed for that condition.";
 if(s.includes("viscosity")||s.includes("fill speed"))return "For a scientific-moulding style speed study, keep the transfer condition consistent, vary fill speed deliberately, and compare fill time and peak pressure with a consistent relative-viscosity method. Look for a robust region, not a single magic speed.";
 return "Structure the problem as Material, Machine, Mould, Method and Measurement. Define exactly where and when the symptom occurs, compare current actuals with a known-good process, rank the mechanisms by evidence, then run one controlled confirmation test.";
}

function renderExams(){
 $("#exams").innerHTML=`<div class="section-head"><div><h2>Certification ladder</h2><p>Pass each exam at 80% or better. Certificates are stored locally for this learner.</p></div></div>
 <div class="grid">${Object.keys(D.exams).map(level=>{const score=user.examScores?.[level];return `<div class="card exam-card"><span class="eyebrow">${level}</span><h3>${level} Injection Moulding Certificate</h3><p class="muted">10 questions · pass mark 80%</p><div class="course-bottom"><span class="pill">${score==null?"Not attempted":"Best: "+score+"%"}</span><button class="secondary" data-mm-onclick="startExam('${level}')">Start exam</button></div></div>`}).join("")}</div>`;
}
function startExam(level){
 const q=D.exams[level];
 openModal(`<span class="eyebrow">${level} certification</span><h2>${level} exam</h2><div id="examQuestions">${q.map((x,i)=>`<div class="question"><b>${i+1}. ${esc(x[0])}</b>${x[1].map((o,j)=>`<label class="option"><input type="radio" name="ex${i}" value="${j}"> ${esc(o)}</label>`).join("")}</div>`).join("")}</div><button class="primary" data-mm-onclick="gradeExam('${level}')">Grade exam</button><div id="examResult" class="callout hidden"></div>`);
}
function gradeExam(level){
 const q=D.exams[level];let n=0;q.forEach((x,i)=>{const r=document.querySelector(`input[name=ex${i}]:checked`);if(r&&+r.value===x[2])n++});
 const pct=Math.round(n/q.length*100);user.examScores=user.examScores||{};user.examScores[level]=Math.max(user.examScores[level]||0,pct);
 let earned=false;if(pct>=80 && !user.certificates.includes(level)){user.certificates.push(level);earned=true}
 persist();
 const r=$("#examResult");r.classList.remove("hidden");r.innerHTML=`<b>${n}/${q.length} correct — ${pct}%</b><br>${pct>=80?"Pass ✓"+(earned?" Certificate earned.":""):"Review the relevant learning tracks and try again."}`;
}
function renderCertificates(){
 const levels=["Beginner","Intermediate","Advanced"];
 $("#certificates").innerHTML=`<div class="section-head"><div><h2>Your certificates</h2><p>Certificates are local learning records, not third-party accredited qualifications.</p></div></div><div class="grid">${levels.map(l=>user.certificates.includes(l)?certificateCard(l):`<div class="card cert"><div class="seal">MM</div><h2>${l}</h2><p class="muted">Not yet earned</p><button class="secondary no-print" data-mm-onclick="switchView('exams')">Take exam</button></div>`).join("")}</div>`;
}
function certificateCard(l){
 return `<div class="card cert"><div class="seal">MM</div><span class="eyebrow">Certificate of completion</span><h2>${l} Injection Moulding</h2><p>This certifies that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${l} knowledge assessment.</p><p class="muted">Local learning record · ${new Date().toLocaleDateString()}</p><button class="secondary no-print" data-mm-onclick="window.print()">Print / Save as PDF</button></div>`;
}

function renderInstructor(){
 const users=Object.values(db.users);
 $("#instructor").innerHTML=`<div class="kpis"><div class="card kpi"><span>Local learners</span><b>${users.length}</b></div><div class="card kpi"><span>Total completions</span><b>${users.reduce((n,u)=>n+(u.completed?.length||0),0)}</b></div><div class="card kpi"><span>Certificates</span><b>${users.reduce((n,u)=>n+(u.certificates?.length||0),0)}</b></div><div class="card kpi"><span>Course size</span><b>120</b></div></div>
 <div class="section-head"><div><h2>Learner overview</h2><p>This offline version manages profiles stored on this device.</p></div><button class="primary" data-mm-onclick="newLearner()">Add learner</button></div>
 <div class="card table-wrap"><table class="table"><thead><tr><th>Learner</th><th>Progress</th><th>Beginner</th><th>Intermediate</th><th>Advanced</th><th>Last activity</th><th></th></tr></thead><tbody>${users.map(u=>`<tr><td><b>${esc(u.name)}</b></td><td>${Math.round((u.completed?.length||0)/D.lessons.length*100)}%</td><td>${u.examScores?.Beginner??"—"}</td><td>${u.examScores?.Intermediate??"—"}</td><td>${u.examScores?.Advanced??"—"}</td><td>${new Date(u.lastSeen||Date.now()).toLocaleDateString()}</td><td><button class="ghost" data-mm-onclick="switchUser('${u.id}')">${u.id===db.activeUser?"Active":"Open"}</button></td></tr>`).join("")}</tbody></table></div>`;
}
function newLearner(){
 openModal(`<span class="eyebrow">Instructor</span><h2>Add learner</h2><label>Learner name<input id="newLearnerName" placeholder="e.g. Sam Taylor"></label><button class="primary" style="margin-top:12px" data-mm-onclick="createLearner()">Create profile</button>`);
}
function createLearner(){
 const name=$("#newLearnerName").value.trim();if(!name)return;
 const id="learner-"+Date.now();db.users[id]={id,name,role:"learner",completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString()};db.activeUser=id;user=db.users[id];persist();closeModal();updateGlobalProgress();renderInstructor();toast("Learner created");
}
function switchUser(id){persist();db.activeUser=id;user=db.users[id];persist();updateGlobalProgress();renderInstructor();toast("Switched learner")}

function renderGlossary(){
 $("#glossary").innerHTML=`<div class="section-head"><div><h2>Injection moulding glossary</h2><p>Search terms used throughout the platform.</p></div><input id="glossarySearch" style="max-width:340px" placeholder="Search..." data-mm-oninput="filterGlossary()"></div><div class="glossary-grid" id="glossaryGrid">${Object.entries(D.glossary).map(([k,v])=>`<div class="card term" data-term="${esc((k+" "+v).toLowerCase())}"><b>${esc(k)}</b><p>${esc(v)}</p></div>`).join("")}</div>`;
}
function filterGlossary(){const q=$("#glossarySearch").value.toLowerCase();$$("[data-term]").forEach(x=>x.classList.toggle("hidden",!x.dataset.term.includes(q)))}

function renderProfile(){
 $("#profile").innerHTML=`<div class="grid2"><div class="card form-card"><span class="eyebrow">Learner profile</span><h2>${esc(user.name)}</h2><label>Name<input id="profileName" value="${esc(user.name)}"></label><label style="display:block;margin-top:10px">Role<select id="profileRole"><option ${user.role==="learner"?"selected":""}>learner</option><option ${user.role==="instructor"?"selected":""}>instructor</option></select></label><button class="primary" style="margin-top:12px" data-mm-onclick="saveProfile()">Save profile</button></div>
 <div class="card form-card"><span class="eyebrow">Local data</span><h2>Backup & reset</h2><p class="muted">Export progress as JSON for backup, or import it later on the same or another browser.</p><div class="hero-buttons"><button class="secondary" data-mm-onclick="exportData()">Export JSON</button><label class="ghost" style="display:inline-block">Import JSON<input type="file" accept=".json" data-mm-onchange="importData(this.files[0])" style="display:none"></label><button class="danger" data-mm-onclick="resetData()">Reset all local data</button></div></div></div>
 <div class="section-head"><div><h2>Bookmarks</h2><p>Saved lessons for review.</p></div></div><div class="grid">${(user.bookmarks||[]).map(id=>{const l=D.lessons.find(x=>x.id===id);return l?`<div class="card course-card"><span class="eyebrow">${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><button class="secondary" data-mm-onclick="goLesson(${id});switchView('lesson')">Open lesson</button></div>`:""}).join("")||`<div class="card form-card"><p class="muted">No bookmarks yet.</p></div>`}`;
}
function saveProfile(){user.name=$("#profileName").value.trim()||user.name;user.role=$("#profileRole").value;persist();updateGlobalProgress();renderProfile();toast("Profile updated")}
function exportData(){
 const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mouldmaster-progress.json";a.click();URL.revokeObjectURL(a.href)
}
function importData(file){
 if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.users||!x.activeUser)throw 0;db=x;user=db.users[db.activeUser];persist();updateGlobalProgress();renderProfile();toast("Data imported")}catch(e){alert("That file is not a valid MouldMaster backup.")}};r.readAsText(file)
}
function resetData(){if(confirm("Reset all local MouldMaster users and progress?")){db=JSON.parse(JSON.stringify(defaultDB));user=db.users[db.activeUser];persist();updateGlobalProgress();renderProfile();toast("Data reset")}}

function openSearch(){
 openModal(`<span class="eyebrow">Global search</span><h2>Search the academy</h2><input id="globalSearch" placeholder="Try: gate seal, warpage, Cpk, venting..." data-mm-oninput="doSearch()" autofocus><div id="searchResults" class="search-results" style="margin-top:12px"></div>`);
 setTimeout(()=>$("#globalSearch")?.focus(),50)
}
function doSearch(){
 const q=$("#globalSearch").value.toLowerCase().trim();if(q.length<2){$("#searchResults").innerHTML="";return}
 const ls=D.lessons.filter(l=>(l.title+" "+l.summary+" "+l.courseName).toLowerCase().includes(q)).slice(0,8);
 const ds=D.defects.filter(d=>(d.name+" "+d.symptom+" "+d.mechanisms.join(" ")).toLowerCase().includes(q)).slice(0,4);
 $("#searchResults").innerHTML=ls.map(l=>`<button class="search-item" data-mm-onclick="closeModal();goLesson(${l.id});switchView('lesson')"><b>Lesson:</b> ${esc(l.title)}<br><span class="muted tiny">${esc(l.courseName)}</span></button>`).join("")+ds.map(d=>`<div class="search-item"><b>Defect:</b> ${esc(d.name)}<br><span class="muted tiny">${esc(d.symptom)}</span></div>`).join("")||`<div class="muted">No matches.</div>`
}
function openModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML=""}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

updateGlobalProgress();
renderDashboard();


/* ---------- Friendly Edition behaviour ---------- */
function learnerLevelLabel(){
  const pct=completedPct();
  if(pct>=75) return "Very advanced";
  if(pct>=50) return "Advanced";
  if(pct>=25) return "Intermediate";
  return user.experience || "Beginner";
}
function recommendedCourses(){
  const firstUnfinished=D.courses.find(c=>courseProgress(c).pct<100) || D.courses[D.courses.length-1];
  const start=Math.max(0,firstUnfinished.id-1);
  return D.courses.slice(start,start+3);
}
function updateGlobalProgress(){
  const pct=completedPct();
  if($("#sideProgress")) $("#sideProgress").style.width=pct+"%";
  if($("#sideProgressText")) $("#sideProgressText").textContent=pct+"%";
  if($("#profileMini")) $("#profileMini").innerHTML=`<div class="row"><div class="row" style="justify-content:flex-start"><div class="avatar">${(user.name||"L").slice(0,1).toUpperCase()}</div><div><b>${esc(user.name)}</b><div class="tiny muted">${esc(learnerLevelLabel())}</div></div></div><span class="pill">${pct}%</span></div>`;
  const admin=$("#instructorNav"); if(admin) admin.style.display=user.role==="instructor"?"flex":"none";
}
function renderDashboard(){
  const pct=completedPct(), l=currentLesson(), certs=user.certificates?.length||0;
  const course=D.courses.find(c=>c.id===l.course);
  const cp=courseProgress(course);
  const firstName=(user.name||"Learner").split(" ")[0];
  $("#dashboard").innerHTML=`
    <div class="friendly-hero">
      <div class="card next-step">
        <span class="eyebrow">Welcome, ${esc(firstName)}</span>
        <h2>${pct===0?"Start with one short lesson.":"Your next lesson is ready."}</h2>
        <p><b>${esc(course.name)} · Lesson ${l.id}</b><br>${esc(l.title)} — about ${l.duration} minutes.</p>
        <div class="mini-bar" style="max-width:520px"><span style="width:${cp.pct}%"></span></div>
        <div class="track-status" style="margin-top:8px"><span class="status-dot active"></span>${cp.done} of ${cp.total} lessons complete in this track</div>
        <div class="hero-buttons">
          <button class="primary" data-mm-onclick="switchView('lesson')">${pct===0?"Start first lesson":"Continue learning"} →</button>
          <button class="ghost" data-mm-onclick="switchView('path')">See my full path</button>
        </div>
      </div>
      <div class="card progress-card">
        <div class="progress-ring" style="--p:${pct}"><strong>${pct}%</strong></div>
        <b>${user.completed.length} of ${D.lessons.length} lessons</b>
        <span class="muted tiny" style="margin-top:5px">${certs} certificate${certs===1?"":"s"} earned</span>
      </div>
    </div>

    <div class="section-head"><div><h2>What would you like to do?</h2><p>Use these when you want something other than your next lesson.</p></div></div>
    <div class="quick-grid">
      <button class="quick-action" data-mm-onclick="switchView('scenarios')"><span class="icon">⚠</span><b>Practice a problem</b><small>Make decisions in realistic shop-floor scenarios.</small></button>
      <button class="quick-action" data-mm-onclick="switchView('defects')"><span class="icon">◇</span><b>Find a defect</b><small>Look up likely mechanisms and useful checks.</small></button>
      <button class="quick-action" data-mm-onclick="switchView('simulator')"><span class="icon">⚙</span><b>Try the simulator</b><small>See how process variables influence relative risk.</small></button>
      <button class="quick-action" data-mm-onclick="switchView('coach')"><span class="icon">✦</span><b>Ask the coach</b><small>Turn a symptom or technical question into a structured next step.</small></button>
    </div>

    <div class="section-head"><div><h2>Your next learning tracks</h2><p>Only the most relevant tracks are shown here.</p></div><button class="ghost" data-mm-onclick="switchView('path')">Show all 12</button></div>
    <div class="grid">${recommendedCourses().map(courseCard).join("")}</div>

    <div class="section-head"><div><h2>How MouldMaster works</h2></div></div>
    <div class="how-grid">
      <div class="card how-card"><div class="step-num">1</div><b>Learn one concept</b><p class="muted">Short lessons keep the technical content manageable.</p></div>
      <div class="card how-card"><div class="step-num">2</div><b>Practice the decision</b><p class="muted">Use scenarios, defect diagnosis and the simulator.</p></div>
      <div class="card how-card"><div class="step-num">3</div><b>Check your knowledge</b><p class="muted">Take staged assessments and revisit weak areas.</p></div>
    </div>`;
}
function renderPath(){
  $("#path").innerHTML=`
    <div class="tip"><span>💡</span><div><b>You do not need to complete everything at once.</b><br>Follow the tracks in order if you are new. Experienced moulders can open any track and use the lessons as a reference.</div></div>
    <div class="section-head"><div><h2>Your path from beginner to expert</h2><p>Each track contains 10 short lessons.</p></div><span class="pill">${user.completed.length}/120 lessons done</span></div>
    <div class="learning-map">
      ${D.courses.map(c=>{
        const p=courseProgress(c), done=p.pct===100, active=p.pct>0&&p.pct<100;
        return `<div class="card track-row">
          <div>
            <div class="track-status"><span class="status-dot ${done?"done":active?"active":""}"></span>${done?"Completed":active?"In progress":"Not started"}</div>
            <h3 style="margin:6px 0">${c.id}. ${esc(c.name)}</h3>
            <span class="pill">${esc(c.level)}</span>
          </div>
          <div><p class="muted">${esc(c.description)}</p><div class="mini-bar"><span style="width:${p.pct}%"></span></div></div>
          <div><b>${p.done}/${p.total}</b><div class="tiny muted" style="margin:3px 0 9px">lessons complete</div><button class="${active?"primary":"secondary"}" data-mm-onclick="openCourse(${c.id})">${done?"Review":active?"Continue":"Open track"}</button></div>
        </div>`;
      }).join("")}
    </div>`;
}
function renderLesson(){
  const l=currentLesson(), c=D.courses.find(x=>x.id===l.course), p=courseProgress(c);
  const bookmarked=user.bookmarks?.includes(l.id);
  const previous=l.id>1?l.id-1:null, next=l.id<D.lessons.length?l.id+1:null;
  $("#lesson").innerHTML=`
    <div class="lesson-breadcrumb"><button data-mm-onclick="switchView('path')">My learning path</button><span>›</span><span>${esc(c.name)}</span><span>›</span><b>${esc(l.title)}</b></div>
    <div class="card lesson-header-card">
      <span class="eyebrow">${esc(l.level)}</span>
      <h2>${esc(l.title)}</h2>
      <p class="muted">${esc(l.summary)}</p>
      <div class="lesson-meta"><span class="pill">⏱ ${l.duration} min</span><span class="pill">Track ${c.id} of 12</span><span class="pill">${p.done}/${p.total} track lessons complete</span></div>
      <div class="mini-bar"><span style="width:${p.pct}%"></span></div>
    </div>

    <div class="lesson-layout">
      <article class="card lesson-body">
        <div class="content-block">
          <h3>Why this matters</h3>
          <p>${esc(l.intro)}</p>
        </div>

        <div class="content-block">
          <h3>By the end of this lesson, you should be able to…</h3>
          <ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
        </div>

        <div class="content-block">
          <h3>Key points</h3>
          <ul>${l.keypoints.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
        </div>

        <div class="callout"><b>Try it on the shop floor:</b><br>${esc(l.exercise)}</div>

        <div class="content-block">
          <h3>Your notes</h3>
          <p class="muted tiny">Save examples from your own machines, moulds or materials here.</p>
          <textarea class="note-area" id="lessonNotes" placeholder="Type notes here...">${esc(user.notes?.[l.id]||"")}</textarea>
          <button class="secondary" style="margin-top:8px" data-mm-onclick="saveLessonNote(${l.id})">Save notes</button>
        </div>

        <div class="lesson-actions-sticky">
          ${previous?`<button class="ghost" data-mm-onclick="goLesson(${previous})">← Previous</button>`:""}
          <button class="ghost" data-mm-onclick="toggleBookmark(${l.id})">${bookmarked?"★ Saved":"☆ Save lesson"}</button>
          <button class="primary" data-mm-onclick="completeAndNext(${l.id})">${user.completed.includes(l.id)?"Next lesson →":"Complete & continue →"}</button>
        </div>
      </article>

      <aside class="card lesson-side">
        <span class="eyebrow">This track</span>
        <h3 style="margin:6px 0 3px">${esc(c.name)}</h3>
        <p class="tiny muted">Choose another lesson whenever you need it.</p>
        <div class="lesson-list">${c.lessonIds.map(id=>{
          const x=D.lessons.find(q=>q.id===id);
          return `<button class="${id===l.id?"active":""}" data-mm-onclick="goLesson(${id})">${user.completed.includes(id)?"✓ ":""}${esc(x.title)}</button>`;
        }).join("")}</div>
      </aside>
    </div>`;
}
function completeAndNext(id){
  if(!user.completed.includes(id)) user.completed.push(id);
  let next=id+1;
  if(next>D.lessons.length){persist();toast("You completed the full learning path!");switchView("exams");return}
  user.currentLesson=next;persist();toast("Lesson complete");renderLesson();window.scrollTo({top:0,behavior:"smooth"});
}
function showOnboarding(){
  openModal(`<div class="onboarding">
    <span class="eyebrow">Welcome to MouldMaster</span>
    <h2>Let’s set up your learning path.</h2>
    <p>This takes one screen. You can change these choices later.</p>

    <label>Your name<input id="onName" value="${esc(user.name==="Learner 1"?"":user.name)}" placeholder="e.g. Alex"></label>

    <h3>How much injection moulding experience do you have?</h3>
    <div class="choice-cards">
      <label class="choice-card"><input type="radio" name="onExp" value="Beginner" checked><b>New / Beginner</b><br><small class="muted">Start with the fundamentals.</small></label>
      <label class="choice-card"><input type="radio" name="onExp" value="Intermediate"><b>Some experience</b><br><small class="muted">Start around process setup.</small></label>
      <label class="choice-card"><input type="radio" name="onExp" value="Advanced"><b>Experienced</b><br><small class="muted">Start around scientific moulding.</small></label>
    </div>

    <h3>What is your main goal?</h3>
    <select id="onGoal">
      <option>Learn the full process</option>
      <option>Troubleshoot defects better</option>
      <option>Become a process technician</option>
      <option>Become a process engineer</option>
      <option>Improve mould/tooling knowledge</option>
      <option>Prepare for certification</option>
    </select>

    <h3>How long would you like a normal study session to be?</h3>
    <div class="daily-select">
      <label><input type="radio" name="onMin" value="10">10 min</label>
      <label><input type="radio" name="onMin" value="15" checked>15 min</label>
      <label><input type="radio" name="onMin" value="30">30 min</label>
    </div>

    <div class="hero-buttons" style="margin-top:18px">
      <button class="primary" data-mm-onclick="finishOnboarding()">Build my path →</button>
      <button class="ghost" data-mm-onclick="skipOnboarding()">Use defaults</button>
    </div>
  </div>`);
}
function finishOnboarding(){
  const name=$("#onName").value.trim();
  const exp=document.querySelector('input[name=onExp]:checked')?.value||"Beginner";
  const mins=+(document.querySelector('input[name=onMin]:checked')?.value||15);
  user.name=name||"Learner";
  user.experience=exp;
  user.goal=$("#onGoal").value;
  user.dailyMinutes=mins;
  user.onboardingDone=true;
  if(user.completed.length===0){
    user.currentLesson=exp==="Advanced"?61:exp==="Intermediate"?41:1;
  }
  persist();closeModal();updateGlobalProgress();renderDashboard();
  toast("Your learning path is ready");
}
function skipOnboarding(){user.onboardingDone=true;persist();closeModal();renderDashboard()}
function renderProfile(){
  $("#profile").innerHTML=`
    <div class="grid2">
      <div class="card form-card">
        <span class="eyebrow">Learning preferences</span>
        <h2>${esc(user.name)}</h2>
        <label>Name<input id="profileName" value="${esc(user.name)}"></label>
        <label style="display:block;margin-top:10px">Experience<select id="profileExperience">
          ${["Beginner","Intermediate","Advanced"].map(x=>`<option ${user.experience===x?"selected":""}>${x}</option>`).join("")}
        </select></label>
        <label style="display:block;margin-top:10px">Main goal<select id="profileGoal">
          ${["Learn the full process","Troubleshoot defects better","Become a process technician","Become a process engineer","Improve mould/tooling knowledge","Prepare for certification"].map(x=>`<option ${user.goal===x?"selected":""}>${x}</option>`).join("")}
        </select></label>
        <label style="display:block;margin-top:10px">Normal study session<select id="profileMinutes">
          ${[10,15,30].map(x=>`<option value="${x}" ${user.dailyMinutes==x?"selected":""}>${x} minutes</option>`).join("")}
        </select></label>
        <label style="display:block;margin-top:10px">Role<select id="profileRole"><option ${user.role==="learner"?"selected":""}>learner</option><option ${user.role==="instructor"?"selected":""}>instructor</option></select></label>
        <button class="primary" style="margin-top:12px" data-mm-onclick="saveFriendlyProfile()">Save preferences</button>
      </div>
      <div class="card form-card">
        <span class="eyebrow">Your progress</span><h2>${completedPct()}% complete</h2>
        <p class="muted">${user.completed.length} lessons completed · ${user.certificates.length} certificates earned</p>
        <div class="mini-bar"><span style="width:${completedPct()}%"></span></div>
        <div class="hero-buttons"><button class="secondary" data-mm-onclick="exportData()">Export backup</button><label class="ghost" style="display:inline-block">Import backup<input type="file" accept=".json" data-mm-onchange="importData(this.files[0])" style="display:none"></label></div>
        <details style="margin-top:18px"><summary class="muted tiny" style="cursor:pointer">Advanced data options</summary><button class="danger" style="margin-top:10px" data-mm-onclick="resetData()">Reset all local data</button></details>
      </div>
    </div>
    <div class="section-head"><div><h2>Saved lessons</h2><p>Lessons you bookmarked for quick review.</p></div></div>
    <div class="grid">${(user.bookmarks||[]).map(id=>{const l=D.lessons.find(x=>x.id===id);return l?`<div class="card course-card"><span class="eyebrow">${esc(l.level)}</span><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><button class="secondary" data-mm-onclick="goLesson(${id});switchView('lesson')">Open lesson</button></div>`:""}).join("")||`<div class="card empty-friendly"><div class="big-icon">☆</div><b>No saved lessons yet</b><p class="muted">Use “Save lesson” while studying and it will appear here.</p></div>`}
    </div>`;
}
function saveFriendlyProfile(){
  user.name=$("#profileName").value.trim()||user.name;
  user.experience=$("#profileExperience").value;
  user.goal=$("#profileGoal").value;
  user.dailyMinutes=+$("#profileMinutes").value;
  user.role=$("#profileRole").value;
  persist();updateGlobalProgress();renderProfile();toast("Preferences saved");
}

/* Keep duplicate mobile navigation in sync and open onboarding on first run. */
$$(".mobile-nav button").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.view)switchView(b.dataset.view)}));
const originalSwitchView = switchView;
switchView = function(id){
  originalSwitchView(id);
  $$(".mobile-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
};
updateGlobalProgress();
renderDashboard();
setTimeout(()=>{ if(!user.onboardingDone) showOnboarding(); },120);


/* ---------- Regional standards layer: UK / US / NZ ---------- */
function regionName(code){
  return ({UK:"United Kingdom",US:"United States",NZ:"New Zealand",ALL:"UK + US + NZ comparison"})[code] || code;
}
function regionSpelling(){
  return user.region==="US" ? "molding" : "moulding";
}
function standardsBanner(){
  return `<div class="region-banner">
    <div><b>Standards mode: ${esc(regionName(user.region||"ALL"))}</b><div class="tiny muted">References reviewed ${esc(D.standards.verified)}. Technical process questions are universal; legal/safety questions are jurisdiction-specific.</div></div>
    <button class="ghost" data-mm-onclick="switchView('standards')">View references</button>
  </div>`;
}
function setRegion(code){
  user.region=code; persist();
  if(currentView==="standards") renderStandards();
  else renderView(currentView);
  toast("Standards mode: "+regionName(code));
}
function regionButtons(){
  return `<div class="region-switch">
    ${["ALL","UK","US","NZ"].map(r=>`<button class="${user.region===r?"active":""}" data-mm-onclick="setRegion('${r}')">${r==="ALL"?"Compare all":r}</button>`).join("")}
  </div>`;
}
function renderStandards(){
  const selected=user.region==="ALL"?["UK","US","NZ"]:[user.region];
  const cards = [];
  for(const item of D.standards.common){
    cards.push(`<div class="card standard-card"><span class="eyebrow">International</span><h3>${esc(item.name)}</h3><p>${esc(item.scope)}</p><a class="standard-link" href="${item.url}" target="_blank" rel="noopener">Open official/reference source ↗</a></div>`);
  }
  for(const r of selected){
    for(const item of D.standards[r]){
      cards.push(`<div class="card standard-card"><span class="eyebrow">${esc(regionName(r))}</span><h3>${esc(item.name)}</h3><p>${esc(item.scope)}</p><a class="standard-link" href="${item.url}" target="_blank" rel="noopener">Open source ↗</a></div>`);
    }
  }
  $("#standards").innerHTML=`
    <div class="legal-note"><b>Training scope:</b> This platform teaches recognised safety principles and cites current official/standards sources, but it is not a legal compliance certificate. Site procedures, machine documentation, risk assessments and current law still control actual work.</div>
    <div class="section-head"><div><h2>Choose your standards mode</h2><p>Use one jurisdiction for assessments, or compare all three while studying.</p></div><span class="pill">Verified ${esc(D.standards.verified)}</span></div>
    ${regionButtons()}
    <div class="grid">${cards.join("")}</div>
    <div class="callout"><b>Terminology:</b> UK and New Zealand normally use “injection moulding”; US sources normally use “injection molding”. The engineering process is the same, but legal duties and named standards are shown by jurisdiction.</div>
    ${selected.includes("NZ")?`<div class="legal-note"><b>NZ future-law flag:</b> the Health and Safety at Work Amendment Act 2026 has passed but comes into force on <b>1 April 2027</b>. This August 2026 build therefore uses the current HSWA framework and flags the upcoming change for later review.</div>`:""}`;
}

function technicalExplanation(q){
  const correct=q[1][q[2]];
  return `Correct answer: ${esc(correct)}. This is a process-engineering principle rather than a country-specific legal requirement. Apply it within material-supplier guidance, machine/tool limits and your site's approved process.`;
}
function getExamQuestions(level, region){
  const base=(D.exams[level]||[]).slice(0,7).map(q=>({
    q:q[0], options:q[1], correct:q[2], explanation:technicalExplanation(q), reference:"Common injection moulding engineering principle"
  }));
  let regs=[];
  if(region==="ALL"){
    const order=["UK","US","NZ"];
    regs=order.map(r=>{
      const q=D.regionalQuestions[r][level][0];
      return {q:`[${r}] ${q[0]}`,options:q[1],correct:q[2],explanation:q[3],reference:q[4],region:r};
    });
  }else{
    regs=(D.regionalQuestions[region]?.[level]||[]).map(q=>({q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],region}));
  }
  return base.concat(regs);
}
let activeExam=null;

function renderExams(){
  const region=user.region||"ALL";
  $("#exams").innerHTML=`${standardsBanner()}
    <div class="section-head"><div><h2>Knowledge checks</h2><p>Each assessment contains 7 universal process questions and 3 safety/compliance questions for the selected standards mode.</p></div></div>
    ${regionButtons()}
    <div class="grid">${Object.keys(D.exams).map(level=>{
      const key=level+"-"+region;
      const score=user.examScores?.[key] ?? user.examScores?.[level];
      return `<div class="card exam-card"><span class="eyebrow">${level}</span><h3>${level} ${region==="US"?"Injection Molding":"Injection Moulding"} Knowledge Check</h3><p class="muted">10 questions · 80% pass mark · ${esc(regionName(region))}</p><div class="course-bottom"><span class="pill">${score==null?"Not attempted":"Best: "+score+"%"}</span><button class="secondary" data-mm-onclick="startExam('${level}')">Start</button></div></div>`;
    }).join("")}</div>`;
}
function startExam(level){
  const region=user.region||"ALL";
  activeExam={level,region,questions:getExamQuestions(level,region)};
  const q=activeExam.questions;
  openModal(`${standardsBanner()}<span class="eyebrow">${esc(level)} · ${esc(regionName(region))}</span><h2>${esc(level)} knowledge check</h2>
    <p class="muted">For compliance questions, answer according to the jurisdiction shown. “Compare all” includes one UK, one US and one NZ safety question.</p>
    <div id="examQuestions">${q.map((x,i)=>`<div class="question"><b>${i+1}. ${esc(x.q)}</b>${x.options.map((o,j)=>`<label class="option"><input type="radio" name="ex${i}" value="${j}"> ${esc(o)}</label>`).join("")}</div>`).join("")}</div>
    <button class="primary" data-mm-onclick="gradeExam('${level}')">Grade & review answers</button>
    <div id="examResult" class="callout hidden"></div>
    <div id="answerReview" class="answer-review"></div>`);
}
function gradeExam(level){
  if(!activeExam || activeExam.level!==level) return;
  const q=activeExam.questions;
  let n=0;
  const review=[];
  q.forEach((x,i)=>{
    const r=document.querySelector(`input[name=ex${i}]:checked`);
    const selected=r?+r.value:null;
    const ok=selected===x.correct;
    if(ok)n++;
    review.push(`<div class="answer-row ${ok?"correct":"incorrect"}"><b>${i+1}. ${ok?"Correct ✓":"Review needed"}</b><br><span class="tiny">Your answer: ${selected==null?"No answer":esc(x.options[selected])}</span><br><span class="tiny">Correct answer: <b>${esc(x.options[x.correct])}</b></span><p class="muted" style="margin:7px 0 0">${x.explanation}</p><div class="ref">Reference: ${esc(x.reference)}</div></div>`);
  });
  const pct=Math.round(n/q.length*100);
  const key=level+"-"+activeExam.region;
  user.examScores=user.examScores||{};
  user.examScores[key]=Math.max(user.examScores[key]||0,pct);
  const certKey=level+"-"+activeExam.region;
  let earned=false;
  if(pct>=80 && !user.certificates.includes(certKey)){user.certificates.push(certKey);earned=true}
  persist();
  const result=$("#examResult");result.classList.remove("hidden");
  result.innerHTML=`<b>${n}/${q.length} correct — ${pct}%</b><br>${pct>=80?"Pass ✓"+(earned?" Regional learning certificate earned.":""):"Review the explanations below, then revisit the relevant lesson or standards page."}`;
  $("#answerReview").innerHTML=review.join("");
}

function renderCertificates(){
  const levels=["Beginner","Intermediate","Advanced"], region=user.region||"ALL";
  $("#certificates").innerHTML=`${standardsBanner()}<div class="section-head"><div><h2>Your certificates</h2><p>Local learning records only — not accredited legal-compliance qualifications.</p></div></div><div class="grid">${levels.map(l=>{
    const key=l+"-"+region;
    return user.certificates.includes(key)?certificateCard(l,region):`<div class="card cert"><div class="seal">MM</div><h2>${l}</h2><p class="muted">${esc(regionName(region))}<br>Not yet earned in this standards mode</p><button class="secondary no-print" data-mm-onclick="switchView('exams')">Take knowledge check</button></div>`;
  }).join("")}</div>`;
}
function certificateCard(level,region){
  return `<div class="card cert"><div class="seal">MM</div><span class="eyebrow">Local learning certificate</span><h2>${esc(level)} ${region==="US"?"Injection Molding":"Injection Moulding"}</h2><p>This records that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${esc(level)} assessment in <b>${esc(regionName(region))}</b> standards mode.</p><p class="muted">Not an accredited compliance qualification · ${new Date().toLocaleDateString()}</p><button class="secondary no-print" data-mm-onclick="window.print()">Print / Save as PDF</button></div>`;
}

/* Regionalise coach answers for safety/compliance topics. */
const baseCoachReply = coachReply;
coachReply = function(q){
  const s=q.toLowerCase(), r=user.region||"ALL";
  const safetyWords=["guard","interlock","lockout","tagout","loto","safety","hazard","maintenance","fume","sds","coshh","osha","puwer","hswa","4024","b151"];
  if(safetyWords.some(w=>s.includes(w))){
    const blocks=[];
    const regions=r==="ALL"?["UK","US","NZ"]:[r];
    for(const code of regions){
      if(code==="UK"){
        blocks.push(`<b>UK:</b> Treat guarding/interlocks as safety controls, not process variables. In Great Britain use PUWER 1998 (including Reg. 11 for dangerous parts); Northern Ireland has PUWER 1999. HSE PPIS4 is specific injection-moulding guidance, and BS EN ISO 20430:2020 is the relevant machinery-safety standard. For plastics fume, use the applicable COSHH/HSE control approach.`);
      }
      if(code==="US"){
        blocks.push(`<b>US:</b> OSHA 29 CFR 1910.212 covers general machine guarding. Covered servicing with unexpected startup or hazardous-energy release requires the 1910.147 energy-control approach. Hazard Communication is 1910.1200. ANSI/PLASTICS B151.1-2017 is the current PLASTICS-listed injection molding machine consensus standard.`);
      }
      if(code==="NZ"){
        blocks.push(`<b>NZ:</b> HSWA 2015 places the primary duty on the PCBU. WorkSafe says eliminate machinery hazards where reasonably practicable before relying on guarding, and identifies AS/NZS 4024 as current safeguarding state-of-knowledge guidance. The 2026 HSWA Amendment Act does not come into force until 1 April 2027.`);
      }
    }
    return blocks.join("<br><br>")+`<br><br><b>Action rule:</b> Never bypass a safeguard to solve a process problem. Use the site's authorised risk assessment, isolation procedure, manufacturer instructions and current jurisdictional requirements.`;
  }
  return baseCoachReply(q);
};

/* Region context on scenarios and defect pages. */
const baseRenderScenarios=renderScenarios;
renderScenarios=function(){
  baseRenderScenarios();
  $("#scenarios").insertAdjacentHTML("afterbegin",standardsBanner());
};
const baseRenderDefects=renderDefects;
renderDefects=function(){
  baseRenderDefects();
  $("#defects").insertAdjacentHTML("afterbegin",standardsBanner());
};

/* Standards choice in onboarding/profile. */
const oldShowOnboarding=showOnboarding;
showOnboarding=function(){
  oldShowOnboarding();
  const goal=$("#onGoal");
  if(goal){
    goal.insertAdjacentHTML("afterend",`<h3>Which standards do you want to study?</h3>
      <select id="onRegion">
        <option value="ALL">Compare UK, US and New Zealand</option>
        <option value="UK">United Kingdom</option>
        <option value="US">United States</option>
        <option value="NZ">New Zealand</option>
      </select>`);
  }
};
finishOnboarding=function(){
  const name=$("#onName").value.trim();
  const exp=document.querySelector('input[name=onExp]:checked')?.value||"Beginner";
  const mins=+(document.querySelector('input[name=onMin]:checked')?.value||15);
  user.name=name||"Learner";
  user.experience=exp;
  user.goal=$("#onGoal").value;
  user.dailyMinutes=mins;
  user.region=$("#onRegion")?.value||"ALL";
  user.onboardingDone=true;
  if(user.completed.length===0) user.currentLesson=exp==="Advanced"?61:exp==="Intermediate"?41:1;
  persist();closeModal();updateGlobalProgress();renderDashboard();toast("Your learning path is ready");
};

const oldRenderProfile=renderProfile;
renderProfile=function(){
  oldRenderProfile();
  const role=$("#profileRole");
  if(role && !$("#profileRegion")){
    role.parentElement.insertAdjacentHTML("beforebegin",`<label style="display:block;margin-top:10px">Standards mode<select id="profileRegion">
      <option value="ALL" ${user.region==="ALL"?"selected":""}>Compare UK + US + NZ</option>
      <option value="UK" ${user.region==="UK"?"selected":""}>United Kingdom</option>
      <option value="US" ${user.region==="US"?"selected":""}>United States</option>
      <option value="NZ" ${user.region==="NZ"?"selected":""}>New Zealand</option>
    </select></label>`);
  }
};
saveFriendlyProfile=function(){
  user.name=$("#profileName").value.trim()||user.name;
  user.experience=$("#profileExperience").value;
  user.goal=$("#profileGoal").value;
  user.dailyMinutes=+$("#profileMinutes").value;
  user.region=$("#profileRegion")?.value||user.region||"ALL";
  user.role=$("#profileRole").value;
  persist();updateGlobalProgress();renderProfile();toast("Preferences saved");
};

/* Add standards banner to home and path after existing friendly renders. */
const friendlyDashboard=renderDashboard;
renderDashboard=function(){
  friendlyDashboard();
  $("#dashboard").insertAdjacentHTML("afterbegin",standardsBanner());
};
const friendlyPath=renderPath;
renderPath=function(){
  friendlyPath();
  $("#path").insertAdjacentHTML("afterbegin",standardsBanner());
};

/* Re-render now that the standards overrides are active. */
updateGlobalProgress();
renderDashboard();


/* ---------- Deep question-quality audit: 20 Aug 2026 ---------- */
function shuffleCopy(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function normaliseTechnicalQuestion(q){
  return {q:q[0],options:q[1],correct:q[2],explanation:q[3]||technicalExplanation(q),reference:q[4]||"Common injection moulding engineering principle",sourceUrl:null,kind:"technical"};
}
function normaliseRegionalQuestion(q,region){
  return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,region,kind:"regional"};
}
function shuffleOptions(item){
  const mapped=item.options.map((text,oldIndex)=>({text,correct:oldIndex===item.correct}));
  const mixed=shuffleCopy(mapped);
  return {...item,options:mixed.map(x=>x.text),correct:mixed.findIndex(x=>x.correct)};
}
getExamQuestions=function(level,region){
  const technical=shuffleCopy((D.exams[level]||[]).map(normaliseTechnicalQuestion)).slice(0,7);
  let regs=[];
  if(region==="ALL"){
    regs=["UK","US","NZ"].map(r=>normaliseRegionalQuestion(shuffleCopy(D.regionalQuestions[r][level])[0],r));
  }else{
    regs=shuffleCopy((D.regionalQuestions[region]?.[level]||[]).map(q=>normaliseRegionalQuestion(q,region))).slice(0,3);
  }
  return shuffleCopy(technical.concat(regs)).map(shuffleOptions);
};
startExam=function(level){
  const region=user.region||"ALL";
  activeExam={level,region,questions:getExamQuestions(level,region)};
  const q=activeExam.questions;
  openModal(`${standardsBanner()}<span class="eyebrow">${esc(level)} · ${esc(regionName(region))}</span><h2>${esc(level)} knowledge check</h2>
    <p class="muted">Questions and answer order are randomised. Regional safety questions are labelled in Compare All mode and include an official source in the answer review.</p>
    <div class="legal-note"><b>Assessment quality review:</b> ${esc(D.assessmentQA.reviewed)}. One best answer is intended for every item. If site instructions or a current official source conflict with this training, stop and use the current authorised requirement.</div>
    <div id="examQuestions">${q.map((x,i)=>`<div class="question"><b>${i+1}. ${x.region?`[${x.region}] `:""}${esc(x.q)}</b>${x.options.map((o,j)=>`<label class="option"><input type="radio" name="ex${i}" value="${j}"> ${esc(o)}</label>`).join("")}</div>`).join("")}</div>
    <button class="primary" data-mm-onclick="gradeExam('${level}')">Grade & review answers</button>
    <div id="examResult" class="callout hidden"></div><div id="answerReview" class="answer-review"></div>`);
};
gradeExam=function(level){
  if(!activeExam||activeExam.level!==level)return;
  let n=0; const review=[];
  activeExam.questions.forEach((x,i)=>{
    const r=document.querySelector(`input[name=ex${i}]:checked`),selected=r?+r.value:null,ok=selected===x.correct;
    if(ok)n++;
    const src=x.sourceUrl?`<div class="ref">Reference: <a class="standard-link" href="${x.sourceUrl}" target="_blank" rel="noopener">${esc(x.reference)} ↗</a></div>`:`<div class="ref">Reference: ${esc(x.reference)}</div>`;
    review.push(`<div class="answer-row ${ok?"correct":"incorrect"}"><b>${i+1}. ${ok?"Correct ✓":"Review needed"}</b><br><span class="tiny">Your answer: ${selected==null?"No answer":esc(x.options[selected])}</span><br><span class="tiny">Correct answer: <b>${esc(x.options[x.correct])}</b></span><p class="muted" style="margin:7px 0 0">${esc(x.explanation)}</p>${src}</div>`);
  });
  const pct=Math.round(n/activeExam.questions.length*100),key=level+"-"+activeExam.region;
  user.examScores=user.examScores||{};user.examScores[key]=Math.max(user.examScores[key]||0,pct);
  const certKey=key;let earned=false;
  if(pct>=80&&!user.certificates.includes(certKey)){user.certificates.push(certKey);earned=true}
  persist();
  const result=$("#examResult");result.classList.remove("hidden");
  result.innerHTML=`<b>${n}/${activeExam.questions.length} correct — ${pct}%</b><br>${pct>=80?"Pass ✓"+(earned?" Regional learning certificate earned.":""):"Review each rationale and official regional source below before trying another randomised assessment."}`;
  $("#answerReview").innerHTML=review.join("");
};

const qaRenderStandards=renderStandards;
renderStandards=function(){
  qaRenderStandards();
  $("#standards").insertAdjacentHTML("afterbegin",`<div class="tip"><span>✓</span><div><b>Assessment QA completed ${esc(D.assessmentQA.reviewed)}</b><br>${esc(D.assessmentQA.scope)} Correct-answer positions and option order are randomised at assessment time.</div></div>`);
  if((user.region||"ALL")==="US"){
    $("#standards").insertAdjacentHTML("beforeend",`<div class="legal-note"><b>US jurisdiction note:</b> OSHA-approved State Plans must be at least as effective as federal OSHA and may use different or more stringent requirements. Always check the state-plan jurisdiction for the actual facility.</div>`);
  }
};


/* ---------- 10-pass safety-first question audit: 20 Aug 2026 ---------- */
function normaliseTechnicalQuestion10(q){
  return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:!!q[7],kind:"technical"};
}
function normaliseRegionalQuestion10(q,region){
  return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:q[7]!==false,region,kind:"regional"};
}
function shuffleOptions10(item){
  const mapped=item.options.map((text,oldIndex)=>({text,correct:oldIndex===item.correct,feedback:item.optionFeedback?.[oldIndex]||null}));
  const mixed=shuffleCopy(mapped);
  return {...item,options:mixed.map(x=>x.text),optionFeedback:mixed.map(x=>x.feedback),correct:mixed.findIndex(x=>x.correct)};
}
getExamQuestions=function(level,region){
  const technical=shuffleCopy((D.exams[level]||[]).map(normaliseTechnicalQuestion10)).slice(0,7);
  let regs=[];
  if(region==="ALL") regs=["UK","US","NZ"].map(r=>normaliseRegionalQuestion10(shuffleCopy(D.regionalQuestions[r][level])[0],r));
  else regs=shuffleCopy((D.regionalQuestions[region]?.[level]||[]).map(q=>normaliseRegionalQuestion10(q,region))).slice(0,3);
  return shuffleCopy(technical.concat(regs)).map(shuffleOptions10);
};
startExam=function(level){
  const region=user.region||"ALL";
  activeExam={level,region,questions:getExamQuestions(level,region)};
  const q=activeExam.questions;
  openModal(`${standardsBanner()}<span class="eyebrow">${esc(level)} · ${esc(regionName(region))}</span><h2>${esc(level)} knowledge check</h2>
    <div class="legal-note"><b>Safety-first assessment:</b> Wrong options are testing distractors, not recommended procedures. To pass, you need at least 80% overall <b>and every regional safety/compliance question correct</b>.</div>
    <p class="muted">Question and answer order are randomised. After grading, every incorrect selection is debriefed and regional items link to an official source.</p>
    <div id="examQuestions">${q.map((x,i)=>`<div class="question"><b>${i+1}. ${x.region?`[${x.region}] `:""}${esc(x.q)}</b>${x.options.map((o,j)=>`<label class="option"><input type="radio" name="ex${i}" value="${j}"> ${esc(o)}</label>`).join("")}</div>`).join("")}</div>
    <button class="primary" data-mm-onclick="gradeExam('${level}')">Grade & review every answer</button><div id="examResult" class="callout hidden"></div><div id="answerReview" class="answer-review"></div>`);
};
gradeExam=function(level){
  if(!activeExam||activeExam.level!==level)return;
  let totalCorrect=0,criticalWrong=0; const review=[];
  activeExam.questions.forEach((x,i)=>{
    const r=document.querySelector(`input[name=ex${i}]:checked`),selected=r?+r.value:null,ok=selected===x.correct;
    if(ok) totalCorrect++; if(x.critical && !ok) criticalWrong++;
    const src=x.sourceUrl?`<div class="ref">Reference: <a class="standard-link" href="${x.sourceUrl}" target="_blank" rel="noopener">${esc(x.reference)} ↗</a></div>`:`<div class="ref">Reference: ${esc(x.reference)}</div>`;
    let feedback='';
    if(ok) feedback=x.explanation;
    else if(selected==null) feedback='No answer was selected. Review the correct rationale before the next attempt.';
    else feedback=(x.optionFeedback?.[selected]||'This distractor is not a recommended instruction.')+' '+x.explanation;
    const safetyTag=x.critical?`<span class="pill" style="margin-left:6px">Safety-critical</span>`:'';
    review.push(`<div class="answer-row ${ok?"correct":"incorrect"}"><b>${i+1}. ${ok?"Correct ✓":"Review needed"}</b>${safetyTag}<br><span class="tiny">Your answer: ${selected==null?"No answer":esc(x.options[selected])}</span><br><span class="tiny">Correct answer: <b>${esc(x.options[x.correct])}</b></span><p class="muted" style="margin:7px 0 0">${esc(feedback)}</p>${src}</div>`);
  });
  const pct=Math.round(totalCorrect/activeExam.questions.length*100),passed=pct>=80&&criticalWrong===0,key=level+"-"+activeExam.region;
  user.examScores=user.examScores||{}; user.examScores[key]=Math.max(user.examScores[key]||0,pct);
  let earned=false; if(passed&&!user.certificates.includes(key)){user.certificates.push(key);earned=true}
  persist();
  const result=$("#examResult"); result.classList.remove("hidden");
  result.innerHTML=`<b>${totalCorrect}/${activeExam.questions.length} correct — ${pct}%</b><br>${passed?`Pass ✓${earned?" Regional learning certificate earned.":""}`:`Not passed yet. ${criticalWrong?criticalWrong+" safety-critical regional answer(s) need correction. ":""}Review the rationales before another attempt.`}`;
  $("#answerReview").innerHTML=review.join("");
};
answerScenario=function(i,ci,el){
  const s=D.scenarios[i],f=$("#sf"+i),ok=ci===s.correct; f.classList.remove("hidden");
  const detail=s.feedback?.[ci]||s.why;
  f.innerHTML=`<b>${ok?"Strong choice ✓":"Not the strongest next step"}</b><br>${esc(detail)}${ok?"":`<br><br><b>Recommended reasoning:</b> ${esc(s.why)}`}`;
  [...el.parentNode.querySelectorAll(".choice")].forEach((b,j)=>{b.style.borderColor=j===s.correct?"#55d6be":""});
};
const renderStandards10=renderStandards;
renderStandards=function(){
  renderStandards10();
  $("#standards").insertAdjacentHTML("afterbegin",`<div class="tip"><span>✓</span><div><b>10-pass question audit complete — ${esc(D.assessmentQA.reviewed)}</b><br>Safety-critical regional questions are mandatory for a pass. Wrong choices are debriefed as distractors, not procedures.</div></div>`);
};


/* =========================================================
   Engaging Edition — UX/gamification layer.
   IMPORTANT: question text, answer keys, rationales and
   regional safety pass logic are NOT changed here.
   ========================================================= */

function funToday(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dayDiff(a,b){
  if(!a||!b)return 999;
  const A=new Date(a+"T12:00:00"),B=new Date(b+"T12:00:00");
  return Math.round((B-A)/86400000);
}
function funEnsure(){
  user.fun=user.fun||{};
  const f=user.fun;
  if(f.xp==null) f.xp=(user.completed?.length||0)*25+(user.certificates?.length||0)*200;
  if(!f.rewarded) f.rewarded={};
  if(!f.achievements) f.achievements=[];
  if(f.sound==null) f.sound=false;
  if(f.celebrations==null) f.celebrations=true;
  if(f.scenarioCorrect==null) f.scenarioCorrect=0;
  if(f.scenarioAttempts==null) f.scenarioAttempts=0;
  if(f.bossWins==null) f.bossWins=0;
  if(f.streak==null) f.streak=0;
  return f;
}
function touchFunDay(){
  const f=funEnsure(),today=funToday();
  if(f.lastActiveDate!==today){
    const gap=dayDiff(f.lastActiveDate,today);
    f.streak=(gap===1)?Math.max(1,f.streak+1):1;
    f.lastActiveDate=today;
    persist();
  }
}
function funLevels(){
  return [
    [0,"Pellet Rookie","●"],
    [150,"Cycle Starter","◔"],
    [400,"Process Scout","◆"],
    [800,"Defect Detective","◇"],
    [1400,"Window Builder","▦"],
    [2200,"Scientific Moulder","⚗"],
    [3200,"Process Engineer","⚙"],
    [4500,"Moulding Master","★"]
  ];
}
function funLevelInfo(){
  const xp=funEnsure().xp,levels=funLevels();
  let idx=0;
  for(let i=0;i<levels.length;i++) if(xp>=levels[i][0])idx=i;
  const cur=levels[idx],next=levels[Math.min(idx+1,levels.length-1)];
  const atMax=idx===levels.length-1;
  const span=atMax?1:(next[0]-cur[0]);
  const progress=atMax?100:Math.max(0,Math.min(100,Math.round((xp-cur[0])/span*100)));
  return {name:cur[1],icon:cur[2],start:cur[0],next:next[0],nextName:next[1],progress,atMax};
}
function funTone(kind="good"){
  const f=funEnsure(); if(!f.sound)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    osc.frequency.value=kind==="good"?660:kind==="level"?880:330;
    gain.gain.setValueAtTime(.045,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);
    osc.start();osc.stop(ctx.currentTime+.17);
  }catch(e){}
}
function confetti(count=34){
  const f=funEnsure();
  if(!f.celebrations||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const layer=$("#celebrationLayer");if(!layer)return;
  const colors=["#55d6be","#68a7ff","#ffd166","#a88cff","#7ce6a3"];
  for(let i=0;i<count;i++){
    const b=document.createElement("i");b.className="confetti-bit";
    b.style.left=(Math.random()*100)+"vw";b.style.background=colors[i%colors.length];
    b.style.setProperty("--drift",(Math.random()*180-90)+"px");
    b.style.setProperty("--dur",(1.1+Math.random()*1.1)+"s");
    b.style.setProperty("--rot",(Math.random()*180)+"deg");
    layer.appendChild(b);setTimeout(()=>b.remove(),2400);
  }
}
function xpPop(amount,label){
  const el=$("#xpPop");if(!el)return;
  el.textContent=`+${amount} XP · ${label}`;
  el.classList.remove("hidden"); el.style.animation="none"; void el.offsetWidth; el.style.animation="";
  setTimeout(()=>el.classList.add("hidden"),1500);
}
function awardXP(amount,key,label,{celebrate=false}={}){
  const f=funEnsure();
  if(f.rewarded[key])return false;
  f.rewarded[key]=Date.now(); f.xp+=amount;
  const before=funLevelInfo().name;
  persist(); xpPop(amount,label); funTone("good");
  if(celebrate)confetti();
  checkAchievements();
  updateFunHud();
  return true;
}
const FUN_ACHIEVEMENTS=[
  {id:"first-lesson",icon:"🚀",name:"First Shot",desc:"Complete your first lesson.",test:()=>user.completed.length>=1},
  {id:"ten-lessons",icon:"🔟",name:"Ten Cycles In",desc:"Complete 10 lessons.",test:()=>user.completed.length>=10},
  {id:"half-path",icon:"🧭",name:"Halfway Hero",desc:"Complete 60 lessons.",test:()=>user.completed.length>=60},
  {id:"full-path",icon:"🏁",name:"Full Process",desc:"Complete all 120 lessons.",test:()=>user.completed.length>=120},
  {id:"scenario-one",icon:"🕵️",name:"Process Detective",desc:"Solve a troubleshooting scenario.",test:()=>funEnsure().scenarioCorrect>=1},
  {id:"scenario-five",icon:"🧠",name:"Evidence Hunter",desc:"Solve 5 different scenarios.",test:()=>funEnsure().scenarioCorrect>=5},
  {id:"boss-one",icon:"👑",name:"Arena Winner",desc:"Win a troubleshooting boss round.",test:()=>funEnsure().bossWins>=1},
  {id:"cert-one",icon:"🛡️",name:"Safety Gate",desc:"Earn a regional knowledge certificate.",test:()=>user.certificates.length>=1}
];
function checkAchievements(){
  const f=funEnsure();
  let newOnes=[];
  for(const a of FUN_ACHIEVEMENTS){
    if(a.test()&&!f.achievements.includes(a.id)){f.achievements.push(a.id);newOnes.push(a)}
  }
  if(newOnes.length){
    persist();confetti(24);funTone("level");
    setTimeout(()=>toast(`Achievement unlocked: ${newOnes[0].name}`),120);
  }
}
function achievementsHTML(){
  const unlocked=funEnsure().achievements;
  return `<div class="achievement-grid">${FUN_ACHIEVEMENTS.map(a=>`
    <div class="achievement ${unlocked.includes(a.id)?"unlocked":"locked"}">
      <div class="medal">${a.icon}</div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
    </div>`).join("")}</div>`;
}
function updateFunHud(){
  const f=funEnsure(),lvl=funLevelInfo();
  const box=$("#profileMini");
  if(box&&!box.querySelector(".fun-hud")){
    box.insertAdjacentHTML("beforeend",`<div class="fun-hud">
      <span class="fun-chip xp">⚡ <b id="hudXp">${f.xp}</b> XP</span>
      <span class="fun-chip streak">🔥 <b id="hudStreak">${f.streak}</b> day</span>
      <span class="fun-chip level">${lvl.icon} <span id="hudLevel">${esc(lvl.name)}</span></span>
    </div>`);
  }else{
    if($("#hudXp"))$("#hudXp").textContent=f.xp;
    if($("#hudStreak"))$("#hudStreak").textContent=f.streak;
    if($("#hudLevel"))$("#hudLevel").textContent=lvl.name;
  }
}
function dailyScenarioIndex(){
  const s=funToday().replaceAll("-","");
  let n=0;for(const ch of s)n=(n*31+ch.charCodeAt(0))>>>0;
  return n%D.scenarios.length;
}
function dailyDone(){return !!funEnsure().rewarded["daily-"+funToday()]}
function openDailyChallenge(){
  const i=dailyScenarioIndex(),s=D.scenarios[i];
  openModal(`<span class="eyebrow">Daily 5-minute challenge</span><h2>${esc(s.title)}</h2>
    <p class="muted">${esc(s.situation)}</p>
    <div class="exam-integrity">The scenario and recommended reasoning come from the audited training content. XP is only an engagement reward; it does not affect certificates.</div>
    ${s.choices.map((c,ci)=>`<button class="choice" data-mm-onclick="answerDailyChallenge(${i},${ci},this)">${esc(c)}</button>`).join("")}
    <div id="dailyFeedback" class="feedback hidden"></div>`);
}
function answerDailyChallenge(i,ci,el){
  const s=D.scenarios[i],ok=ci===s.correct,f=$("#dailyFeedback");
  f.classList.remove("hidden");
  const detail=s.feedback?.[ci]||s.why;
  f.innerHTML=`<b>${ok?"Solved ✓":"Not quite — use the evidence"}</b><br>${esc(detail)}${ok?"":`<br><br><b>Recommended reasoning:</b> ${esc(s.why)}`}`;
  [...el.parentNode.querySelectorAll(".choice")].forEach((b,j)=>b.style.borderColor=j===s.correct?"#55d6be":"");
  if(ok)awardXP(40,"daily-"+funToday(),"Daily challenge",{celebrate:true});
}
function funDashboardPanel(){
  const f=funEnsure(),lvl=funLevelInfo();
  return `<div class="fun-dashboard">
    <div class="card mission-card">
      <div class="mission-label"><span class="mission-dot"></span> TODAY'S MISSION</div>
      <h2>${dailyDone()?"Daily challenge complete ✓":"Solve one real moulding decision"}</h2>
      <p>${dailyDone()?"Nice work. Your next best move is to continue the learning path or try a boss round.":"A short scenario keeps troubleshooting judgement sharp without changing any of the audited assessment rules."}</p>
      <div class="hero-buttons">
        <button class="primary" data-mm-onclick="${dailyDone()?"switchView('lesson')":"openDailyChallenge()"}">${dailyDone()?"Continue learning →":"Take daily challenge +40 XP"}</button>
        <button class="ghost" data-mm-onclick="switchView('scenarios')">Open Troubleshooting Arena</button>
      </div>
    </div>
    <div class="card level-card">
      <span class="eyebrow">Your workshop rank</span>
      <h3>${lvl.icon} ${esc(lvl.name)}</h3>
      <div style="font-size:27px;font-weight:900">${f.xp} XP</div>
      <div class="level-track"><span style="width:${lvl.progress}%"></span></div>
      <div class="level-next">${lvl.atMax?"Top rank reached":"Next: "+esc(lvl.nextName)+" at "+lvl.next+" XP"}</div>
      <div class="fun-hud" style="margin-top:13px"><span class="fun-chip streak">🔥 ${f.streak}-day learning streak</span><span class="fun-chip">🏅 ${f.achievements.length}/${FUN_ACHIEVEMENTS.length} badges</span></div>
    </div>
  </div>`;
}

/* Enrich dashboard without replacing the user-friendly or standards-aware content. */
const engagingBaseDashboard=renderDashboard;
renderDashboard=function(){
  engagingBaseDashboard();
  const d=$("#dashboard"); if(!d)return;
  const banner=d.querySelector(".region-banner");
  if(banner)banner.insertAdjacentHTML("afterend",funDashboardPanel());
  else d.insertAdjacentHTML("afterbegin",funDashboardPanel());
  d.insertAdjacentHTML("beforeend",`<div class="section-head"><div><h2>Achievements</h2><p>Rewards recognise practice and consistency — never a substitute for competence.</p></div></div>${achievementsHTML()}`);
};

/* Make lesson progression feel like a mission, without changing lesson content. */
const engagingBaseLesson=renderLesson;
renderLesson=function(){
  engagingBaseLesson();
  const body=$("#lesson .lesson-body");
  const l=currentLesson();
  if(body){
    body.insertAdjacentHTML("afterbegin",`<div class="lesson-quest"><b>🎯 Mission ${l.id}/120 · ${esc(l.title)}</b><small>Understand the mechanism, connect it to evidence, then apply it to the shop-floor exercise. Complete the lesson for 25 XP.</small></div>`);
  }
};
const engagingBaseComplete=completeAndNext;
completeAndNext=function(id){
  const wasNew=!user.completed.includes(id);
  engagingBaseComplete(id);
  if(wasNew)awardXP(25,"lesson-"+id,"Lesson complete",{celebrate:id%10===0});
};

/* Troubleshooting Arena */
const engagingBaseScenarios=renderScenarios;
renderScenarios=function(){
  engagingBaseScenarios();
  const s=$("#scenarios");if(!s)return;
  const f=funEnsure();
  const banner=s.querySelector(".region-banner");
  const html=`<div class="arena-banner">
    <span class="eyebrow">Troubleshooting Arena</span><h2>Think like a process detective.</h2>
    <p>Every scenario keeps the audited engineering reasoning intact. The game layer rewards choosing the strongest evidence-based next step — not guessing faster.</p>
    <div class="scenario-scoreboard">
      <div class="scorebox"><strong>${f.scenarioCorrect}</strong><span>Solved</span></div>
      <div class="scorebox"><strong>${f.bossWins}</strong><span>Boss wins</span></div>
      <div class="scorebox"><strong>${f.xp}</strong><span>Total XP</span></div>
    </div>
    <button class="primary" data-mm-onclick="startBossRound()">👑 Start 3-scenario boss round</button>
  </div>`;
  if(banner)banner.insertAdjacentHTML("afterend",html);else s.insertAdjacentHTML("afterbegin",html);
};
const engagingBaseScenario=answerScenario;
answerScenario=function(i,ci,el){
  const wasRewarded=!!funEnsure().rewarded["scenario-"+i],ok=ci===D.scenarios[i].correct;
  engagingBaseScenario(i,ci,el);
  funEnsure().scenarioAttempts++;
  if(ok&&!wasRewarded){
    funEnsure().scenarioCorrect++;
    persist();
    awardXP(30,"scenario-"+i,"Scenario solved",{celebrate:false});
  }
};

let bossState=null;
function startBossRound(){
  const picks=shuffleCopy(D.scenarios.map((_,i)=>i)).slice(0,3);
  bossState={picks,pos:0,score:0,answered:false};
  drawBossRound();
}
function drawBossRound(){
  const i=bossState.picks[bossState.pos],s=D.scenarios[i];
  openModal(`<span class="eyebrow">Boss round · ${bossState.pos+1}/3</span><h2>${esc(s.title)}</h2>
    <div class="boss-progress">${[0,1,2].map(x=>`<span class="${x<bossState.pos?"done":""}"></span>`).join("")}</div>
    <p class="muted">${esc(s.situation)}</p>
    ${s.choices.map((c,ci)=>`<button class="choice" data-mm-onclick="answerBoss(${ci},this)">${esc(c)}</button>`).join("")}
    <div id="bossFeedback" class="feedback hidden"></div>`);
}
function answerBoss(ci,el){
  if(bossState.answered)return;
  bossState.answered=true;
  const i=bossState.picks[bossState.pos],s=D.scenarios[i],ok=ci===s.correct,f=$("#bossFeedback");
  if(ok)bossState.score++;
  f.classList.remove("hidden");
  const detail=s.feedback?.[ci]||s.why;
  f.innerHTML=`<b>${ok?"Strong call ✓":"Evidence check"}</b><br>${esc(detail)}${ok?"":`<br><br><b>Recommended reasoning:</b> ${esc(s.why)}`}<br><br><button class="secondary" data-mm-onclick="nextBoss()">${bossState.pos===2?"See result":"Next scenario →"}</button>`;
  [...el.parentNode.querySelectorAll(".choice")].forEach((b,j)=>b.style.borderColor=j===s.correct?"#55d6be":"");
}
function nextBoss(){
  if(bossState.pos<2){bossState.pos++;bossState.answered=false;drawBossRound();return}
  const score=bossState.score;
  if(score===3){
    funEnsure().bossWins++;persist();
    awardXP(100,"boss-"+Date.now(),"Perfect boss round",{celebrate:true});
  }else if(score===2)awardXP(45,"boss-practice-"+Date.now(),"Boss practice");
  openModal(`<span class="eyebrow">Boss round complete</span><h2>${score===3?"Perfect process judgement 👑":score===2?"Strong run":"Good practice round"}</h2>
    <p class="muted">You solved <b>${score}/3</b>. ${score===3?"All three decisions matched the audited evidence-based reasoning.":"Review any missed reasoning and try another random set when ready."}</p>
    <div class="hero-buttons"><button class="primary" data-mm-onclick="closeModal();startBossRound()">Play another round</button><button class="ghost" data-mm-onclick="closeModal()">Back to scenarios</button></div>`);
}

/* Simulator rescue mini-game: engagement only, explicitly simulation-based. */
let rescueActive=false;
const engagingBaseSimulator=renderSimulator;
renderSimulator=function(){
  engagingBaseSimulator();
  const left=$("#simulator .form-card");
  if(left)left.insertAdjacentHTML("afterbegin",`<div class="sim-challenge">
    <span class="eyebrow">Process Rescue</span><h3>Can you stabilise the simulated process?</h3>
    <p>Start from a deliberately poor simulated condition. Bring every displayed relative defect-risk score below 45. This is a game using the educational model — not a production recipe.</p>
    <button class="secondary" data-mm-onclick="startRescueChallenge()">Start rescue</button>
    <button class="ghost" data-mm-onclick="checkRescueChallenge()">Check my process</button>
  </div>`);
};
function startRescueChallenge(){
  rescueActive=true;simPreset("trouble");toast("Rescue started: get every simulated risk below 45");
}
function checkRescueChallenge(){
  if(!rescueActive){toast("Start a rescue challenge first");return}
  const r=simRisks(),max=Math.max(...Object.values(r));
  if(max<45){
    rescueActive=false;awardXP(60,"rescue-"+funToday(),"Process rescue",{celebrate:true});
    toast("Process rescued in the learning simulator");
  }else{
    const worst=Object.entries(r).sort((a,b)=>b[1]-a[1])[0];
    toast(`Still unstable: highest simulated risk is ${worst[0]} (${Math.round(worst[1])})`);
  }
}

/* Wrap the final audited exam grader: competence rules stay untouched;
   only rewards are added AFTER the audited result is calculated. */
const engagingAuditedGradeExam=gradeExam;
gradeExam=function(level){
  if(!activeExam||activeExam.level!==level)return;
  let correct=0,criticalWrong=0;
  activeExam.questions.forEach((x,i)=>{
    const r=document.querySelector(`input[name=ex${i}]:checked`);
    const ok=!!r && +r.value===x.correct;
    if(ok)correct++; if(x.critical&&!ok)criticalWrong++;
  });
  const pct=Math.round(correct/activeExam.questions.length*100);
  const passed=pct>=80&&criticalWrong===0;
  engagingAuditedGradeExam(level);
  if(passed){
    awardXP(pct===100?180:120,`exam-pass-${level}-${activeExam.region}`,(pct===100?"Perfect knowledge check":"Knowledge check passed"),{celebrate:true});
    const result=$("#examResult");
    if(result)result.insertAdjacentHTML("beforeend",`<br><span class="integrity-lock">🔒 Certificate rule unchanged: ≥80% overall + every safety-critical regional question correct.</span>`);
  }
};

/* Make assessment presentation lively while preserving question integrity. */
const engagingBaseStartExam=startExam;
startExam=function(level){
  engagingBaseStartExam(level);
  const questions=$("#examQuestions");
  if(questions)questions.insertAdjacentHTML("beforebegin",`<div class="exam-integrity">🎮 <b>Challenge mode:</b> question and option order are randomised for variety. 🔒 <b>Integrity lock:</b> the audited question meanings, correct answers, rationales and mandatory safety gate are unchanged.</div>`);
};

/* Fun controls in profile */
const engagingBaseProfile=renderProfile;
renderProfile=function(){
  engagingBaseProfile();
  const card=$("#profile .grid2 .form-card:last-child");
  if(card){
    const f=funEnsure();
    card.insertAdjacentHTML("beforeend",`<div class="fun-settings">
      <h3 style="margin-bottom:0">Experience settings</h3>
      <div class="toggle-row"><div><b>Celebrations</b><div class="tiny muted">Confetti for milestones and challenges.</div></div><input type="checkbox" ${f.celebrations?"checked":""} data-mm-onchange="toggleFunSetting('celebrations',this.checked)"></div>
      <div class="toggle-row"><div><b>Optional sound</b><div class="tiny muted">Short success tones only.</div></div><input type="checkbox" ${f.sound?"checked":""} data-mm-onchange="toggleFunSetting('sound',this.checked)"></div>
    </div>`);
  }
  $("#profile").insertAdjacentHTML("beforeend",`<div class="section-head"><div><h2>Achievements</h2><p>Designed to reward learning behaviour, not replace assessment.</p></div></div>${achievementsHTML()}`);
};
function toggleFunSetting(key,value){funEnsure()[key]=value;persist();if(key==="sound"&&value)funTone("good");}

/* Show XP/rank in profile mini card after any existing progress render. */
const engagingBaseUpdateGlobal=updateGlobalProgress;
updateGlobalProgress=function(){engagingBaseUpdateGlobal();updateFunHud()};

/* Keep streak/activity and achievement state healthy on launch/navigation. */
checkAchievements();updateFunHud();
const engagingBaseSwitchView=switchView;
switchView=function(id){
  engagingBaseSwitchView(id);
  updateFunHud();
};
renderDashboard();


/* =========================================================
   Fine-tooth-comb hardening layer — 20 Aug 2026
   Does not modify the audited question/answer bank.
   ========================================================= */

/* Safer persistence and true factory reset. */
persist=function(){
  user.lastSeen=new Date().toISOString();
  db.users[db.activeUser]=user;
  try{ localStorage.setItem("mouldmasterProDB",JSON.stringify(db)); }catch(e){ /* app remains usable for this session */ }
  updateGlobalProgress();
};
resetData=function(){
  if(confirm("Reset all local MouldMaster users and progress on this device? This cannot be undone unless you exported a backup.")){
    db=JSON.parse(JSON.stringify(PRISTINE_DB)); user=db.users[db.activeUser];
    if(user.onboardingDone===undefined)user.onboardingDone=false;
    if(!user.experience)user.experience="Beginner"; if(!user.goal)user.goal="Learn the full process"; if(!user.dailyMinutes)user.dailyMinutes=15; if(!user.region)user.region="ALL";
    persist();updateGlobalProgress();switchView("dashboard");toast("Local data reset");
  }
};
function normaliseImportedUser(u,id){
  if(!u||typeof u!=="object")throw new Error("Invalid learner");
  return {
    ...u,id:String(u.id||id),name:String(u.name||"Learner"),role:u.role==="instructor"?"instructor":"learner",
    completed:Array.isArray(u.completed)?u.completed.filter(x=>Number.isInteger(x)&&x>=1&&x<=D.lessons.length):[],
    bookmarks:Array.isArray(u.bookmarks)?u.bookmarks.filter(x=>Number.isInteger(x)&&x>=1&&x<=D.lessons.length):[],
    notes:(u.notes&&typeof u.notes==="object"&&!Array.isArray(u.notes))?u.notes:{},
    examScores:(u.examScores&&typeof u.examScores==="object"&&!Array.isArray(u.examScores))?u.examScores:{},
    certificates:Array.isArray(u.certificates)?u.certificates.map(String):[],
    currentLesson:Number.isInteger(u.currentLesson)&&u.currentLesson>=1&&u.currentLesson<=D.lessons.length?u.currentLesson:1,
    region:["ALL","UK","US","NZ"].includes(u.region)?u.region:"ALL",
    experience:["Beginner","Intermediate","Advanced"].includes(u.experience)?u.experience:"Beginner",
    goal:String(u.goal||"Learn the full process"),dailyMinutes:[10,15,30].includes(+u.dailyMinutes)?+u.dailyMinutes:15,
    certificateMeta:(u.certificateMeta&&typeof u.certificateMeta==="object"&&!Array.isArray(u.certificateMeta))?u.certificateMeta:{},
    examPassStatus:(u.examPassStatus&&typeof u.examPassStatus==="object"&&!Array.isArray(u.examPassStatus))?u.examPassStatus:{}
  };
}
importData=function(file){
  if(!file)return; const r=new FileReader();
  r.onload=()=>{try{
    const x=JSON.parse(r.result); if(!x||typeof x!=="object"||!x.users||typeof x.users!=="object"||!x.activeUser||!x.users[x.activeUser])throw new Error("Invalid backup structure");
    const users={};Object.entries(x.users).forEach(([id,u])=>users[id]=normaliseImportedUser(u,id));
    db={...x,users,activeUser:String(x.activeUser)};if(!db.users[db.activeUser])throw new Error("Missing active learner");
    user=db.users[db.activeUser];persist();updateGlobalProgress();switchView("profile");toast("Backup imported and validated");
  }catch(e){alert("That file is not a valid MouldMaster backup. No existing data was changed.")}};
  r.readAsText(file);
};

/* Learning streaks count meaningful learning activity, not app opens/navigation. */
function recordLearningDay(){
  const f=funEnsure(),today=funToday();
  if(f.lastLearningDate!==today){
    const gap=dayDiff(f.lastLearningDate,today);
    f.streak=(gap===1)?Math.max(1,(f.streak||0)+1):1;
    f.lastLearningDate=today;
  }
}
const fineAwardXP=awardXP;
awardXP=function(amount,key,label,opts={}){
  const f=funEnsure(); if(f.rewarded[key])return false;
  recordLearningDay();
  return fineAwardXP(amount,key,label,opts);
};

/* Compare All assesses ALL 9 regional items, not one sample per jurisdiction. */
getExamQuestions=function(level,region){
  const technical=shuffleCopy((D.exams[level]||[]).map(normaliseTechnicalQuestion10)).slice(0,7);
  let regs=[];
  if(region==="ALL"){
    ["UK","US","NZ"].forEach(r=>{
      regs.push(...(D.regionalQuestions[r]?.[level]||[]).map(q=>normaliseRegionalQuestion10(q,r)));
    });
  }else{
    regs=shuffleCopy((D.regionalQuestions[region]?.[level]||[]).map(q=>normaliseRegionalQuestion10(q,region))).slice(0,3);
  }
  return shuffleCopy(technical.concat(regs)).map(shuffleOptions10);
};
function examQuestionCount(region){return region==="ALL"?16:10}
function regionalQuestionCount(region){return region==="ALL"?9:3}
renderExams=function(){
  const region=user.region||"ALL",qCount=examQuestionCount(region),rCount=regionalQuestionCount(region);
  user.examPassStatus=user.examPassStatus||{};
  $("#exams").innerHTML=`${standardsBanner()}${regionButtons()}
    <div class="section-head"><div><h2>Knowledge checks</h2><p>Each assessment uses 7 audited process questions plus ${rCount} safety/compliance question${rCount===1?"":"s"}. ${region==="ALL"?"Compare All tests every UK, US and NZ regional item at that level.":"All regional items at that level are tested."}</p></div></div>
    <div class="exam-integrity">🔒 <b>Competence gate:</b> pass requires at least 80% overall <b>and every safety-critical regional item correct</b>. XP and achievements cannot change this rule.</div>
    <div class="grid">${Object.keys(D.exams).map(level=>{
      const key=level+"-"+region,score=user.examScores?.[key],passed=!!user.examPassStatus[key]||user.certificates.includes(key);
      const status=score==null?"Not attempted":passed?`Passed · best ${score}%`:`Not passed · best ${score}%`;
      return `<div class="card exam-card"><span class="eyebrow">${level}</span><h3>${level} ${region==="US"?"Injection Molding":"Injection Moulding"} Knowledge Check</h3><p class="muted">${qCount} questions · ${rCount} safety-critical · ${esc(regionName(region))}</p><div class="course-bottom"><span class="pill">${status}</span><button class="secondary" data-mm-onclick="startExam('${level}')">Start</button></div></div>`;
    }).join("")}</div>`;
};

/* Track true pass status and certificate earned date around the audited grader. */
const fineGradeExam=gradeExam;
gradeExam=function(level){
  if(!activeExam||activeExam.level!==level)return;
  let correct=0,criticalWrong=0;
  activeExam.questions.forEach((x,i)=>{const r=document.querySelector(`input[name=ex${i}]:checked`),ok=!!r&&+r.value===x.correct;if(ok)correct++;if(x.critical&&!ok)criticalWrong++;});
  const pct=Math.round(correct/activeExam.questions.length*100),passed=pct>=80&&criticalWrong===0,key=level+"-"+activeExam.region;
  const had=user.certificates.includes(key);
  fineGradeExam(level);
  user.examPassStatus=user.examPassStatus||{}; if(passed)user.examPassStatus[key]=true; else if(user.examPassStatus[key]!==true)user.examPassStatus[key]=false;
  user.certificateMeta=user.certificateMeta||{};
  if(passed&&!had&&!user.certificateMeta[key]) user.certificateMeta[key]={earnedAt:new Date().toISOString(),score:pct,region:activeExam.region,level};
  persist();
};
function certificateDateText(key){
  const iso=user.certificateMeta?.[key]?.earnedAt;
  return iso?new Date(iso).toLocaleDateString():"Previously earned — original date not stored";
}
certificateCard=function(level,region){
  const key=level+"-"+region;
  return `<div class="card cert"><div class="seal">MM</div><span class="eyebrow">Local learning certificate</span><h2>${esc(level)} ${region==="US"?"Injection Molding":"Injection Moulding"}</h2><p>This records that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${esc(level)} assessment in <b>${esc(regionName(region))}</b> standards mode.</p><p class="muted">Not an accredited compliance qualification · ${esc(certificateDateText(key))}</p><button class="secondary no-print" data-mm-onclick="printCertificate('${level}','${region}')">Print this certificate</button></div>`;
};
function printCertificate(level,region){
  const key=level+"-"+region,date=certificateDateText(key);
  const w=window.open("","_blank","width=900,height=650"); if(!w){toast("Allow pop-ups to print a single certificate");return}
  w.opener=null;
  const d=w.document;
  d.title="MouldMaster Certificate";
  const meta=d.createElement("meta");meta.setAttribute("charset","utf-8");d.head.appendChild(meta);
  const style=d.createElement("style");style.textContent="body{font-family:system-ui;padding:45px;text-align:center}.box{border:10px double #24364d;padding:50px;max-width:760px;margin:auto}.seal{font-size:48px}.muted{color:#555}";d.head.appendChild(style);
  const box=d.createElement("div");box.className="box";
  box.innerHTML=`<div class="seal">MM</div><h1>${esc(level)} ${region==="US"?"Injection Molding":"Injection Moulding"}</h1><p>This records that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${esc(level)} assessment in <b>${esc(regionName(region))}</b> standards mode.</p><p class="muted">Local learning record · Not an accredited compliance qualification<br>${esc(date)}</p>`;
  d.body.appendChild(box);
  setTimeout(()=>{w.focus();w.print()},0);
}

/* Instructor dashboard understands regional score keys. */
function bestRegionalScore(u,level){
  const vals=Object.entries(u.examScores||{}).filter(([k,v])=>k===level||k.startsWith(level+"-")).map(([,v])=>+v).filter(Number.isFinite);return vals.length?Math.max(...vals):null;
}
renderInstructor=function(){
  if(user.role!=="instructor"){$("#instructor").innerHTML=`<div class="card empty-friendly"><div class="big-icon">🔒</div><b>Instructor view is hidden for learner profiles</b><p class="muted">Change the local profile role only if this device is being used for instructor administration.</p></div>`;return}
  const users=Object.values(db.users);
  $("#instructor").innerHTML=`<div class="kpis"><div class="card kpi"><span>Local learners</span><b>${users.length}</b></div><div class="card kpi"><span>Total lesson completions</span><b>${users.reduce((n,u)=>n+(u.completed?.length||0),0)}</b></div><div class="card kpi"><span>Certificates</span><b>${users.reduce((n,u)=>n+(u.certificates?.length||0),0)}</b></div><div class="card kpi"><span>Course size</span><b>${D.lessons.length}</b></div></div>
  <div class="section-head"><div><h2>Learner overview</h2><p>Local device profiles only; this is not a secure LMS identity system.</p></div><button class="primary" data-mm-onclick="newLearner()">Add learner</button></div>
  <div class="card table-wrap"><table class="table"><thead><tr><th>Learner</th><th>Progress</th><th>Beginner best</th><th>Intermediate best</th><th>Advanced best</th><th>Certificates</th><th>Last activity</th><th></th></tr></thead><tbody>${users.map(u=>`<tr><td><b>${esc(u.name)}</b></td><td>${Math.round((u.completed?.length||0)/D.lessons.length*100)}%</td><td>${bestRegionalScore(u,"Beginner")??"—"}</td><td>${bestRegionalScore(u,"Intermediate")??"—"}</td><td>${bestRegionalScore(u,"Advanced")??"—"}</td><td>${u.certificates?.length||0}</td><td>${new Date(u.lastSeen||Date.now()).toLocaleDateString()}</td><td><button class="ghost" data-mm-onclick="switchUser('${u.id}')">${u.id===db.activeUser?"Active":"Open"}</button></td></tr>`).join("")}</tbody></table></div>`;
};

/* Simulator: relative-to-validated-baseline model. No universal resin temperature recipe. */
simulatorState={fillAgg:50,transfer:50,pack:50,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:75,moistureConfidence:85};
function safeSimLabel(k,v){
  if(k==="transfer")return v<45?"Earlier":v>55?"Later":"Baseline";
  if(k==="hold")return v<45?"Shorter than baseline":v>55?"Longer than baseline":"Baseline";
  if(k==="meltOffset"||k==="mouldOffset")return `${v>0?"+":""}${v} °C offset`;
  if(k==="cooling")return v<45?"Less margin":v>55?"More margin":"Baseline";
  if(k==="clampMargin")return `${v}% modelled margin`;
  return `${v}/100`;
}
function safeSlider(label,key,min,max,val,help){return `<label>${label}<div class="range-row"><input type="range" min="${min}" max="${max}" value="${val}" data-mm-oninput="simChange('${key}',this.value)"><input id="sim_${key}" value="${esc(safeSimLabel(key,val))}" readonly></div><span class="tiny muted">${help}</span></label>`}
simRisks=function(){
  const s=simulatorState;
  const short=clamp01(8+(45-s.fillAgg)*.7+(47-s.transfer)*1.7+Math.max(0,-s.meltOffset)*1.5+(45-s.pack)*.35);
  const flash=clamp01(6+(s.transfer-55)*1.8+(s.pack-62)*.8+(15-s.clampMargin)*2+Math.max(0,s.meltOffset)*.7);
  const sink=clamp01(8+(48-s.pack)*1.2+(45-s.hold)*1.1+(42-s.cooling)*.5);
  const burn=clamp01(5+(s.fillAgg-70)*1.1+(55-s.vent)*1.25+Math.max(0,s.meltOffset-8)*1.2);
  const splay=clamp01(5+(60-s.moistureConfidence)*1.15+(s.fillAgg-82)*.35+Math.max(0,s.meltOffset-12)*.8);
  const warp=clamp01(7+(42-s.cooling)*.9+Math.abs(s.mouldOffset)*1.15+Math.abs(s.pack-55)*.22);
  return {"Short shot":short,"Flash":flash,"Sink":sink,"Burn":burn,"Splay":splay,"Warpage":warp};
};
simChange=function(k,v){simulatorState[k]=+v;if($("#sim_"+k))$("#sim_"+k).value=safeSimLabel(k,+v);updateSimulator()};
simPreset=function(p){
  simulatorState=p==="robust"?{fillAgg:55,transfer:50,pack:55,hold:55,meltOffset:0,mouldOffset:0,cooling:58,clampMargin:30,vent:90,moistureConfidence:95}:{fillAgg:92,transfer:72,pack:82,hold:28,meltOffset:18,mouldOffset:-16,cooling:24,clampMargin:8,vent:25,moistureConfidence:25};
  renderSimulator();
};
resetSimulator=function(){simulatorState={fillAgg:50,transfer:50,pack:50,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:75,moistureConfidence:85};renderSimulator()};
renderSimulator=function(){
  $("#simulator").innerHTML=`<div class="legal-note"><b>Training model — not a processing recipe:</b> every setting below is relative to a material-, mould- and machine-specific validated/known-good baseline. This simulator intentionally does not provide universal melt, mould, transfer, packing or cooling targets.</div>
  <div class="grid2" style="margin-top:14px"><div class="card form-card">
  <div class="sim-challenge"><span class="eyebrow">Process Rescue</span><h3>Can you stabilise the simulated process?</h3><p>Start from a deliberately poor relative condition. Bring every displayed training-risk indicator below 45. The indicators are educational scores, not probabilities, specifications or safe production limits.</p><button class="secondary" data-mm-onclick="startRescueChallenge()">Start rescue</button> <button class="ghost" data-mm-onclick="checkRescueChallenge()">Check my process</button></div>
  <span class="eyebrow">Relative process model</span><h2>Move away from or back toward a known-good baseline</h2><div class="form-grid">
  ${safeSlider("Fill aggressiveness","fillAgg",0,100,simulatorState.fillAgg,"Relative training index; not a machine speed setting.")}
  ${safeSlider("V/P transfer timing","transfer",0,100,simulatorState.transfer,"50 = known-good baseline; left earlier, right later.")}
  ${safeSlider("Packing intensity","pack",0,100,simulatorState.pack,"Relative to the validated/known-good packing condition.")}
  ${safeSlider("Hold duration","hold",0,100,simulatorState.hold,"Relative to a known gate-seal/validated baseline.")}
  ${safeSlider("Melt-temperature deviation","meltOffset",-20,20,simulatorState.meltOffset,"Offset only; the correct target comes from resin/validated process guidance.")}
  ${safeSlider("Mould-temperature deviation","mouldOffset",-20,20,simulatorState.mouldOffset,"Offset only; the correct target is process/tool specific.")}
  ${safeSlider("Cooling margin","cooling",0,100,simulatorState.cooling,"Relative to the known-good ejection/quality condition.")}
  ${safeSlider("Clamp margin","clampMargin",0,50,simulatorState.clampMargin,"Conceptual margin above the modelled opening-force requirement; verify real calculations separately.")}
  ${safeSlider("Venting condition","vent",0,100,simulatorState.vent,"Qualitative condition indicator, not a vent dimension.")}
  ${safeSlider("Moisture-control confidence","moistureConfidence",0,100,simulatorState.moistureConfidence,"Confidence in material-specific drying/handling control where applicable.")}
  </div><div class="hero-buttons"><button class="secondary" data-mm-onclick="resetSimulator()">Reset to baseline</button><button class="ghost" data-mm-onclick="simPreset('robust')">Balanced example</button><button class="ghost" data-mm-onclick="simPreset('trouble')">Unstable example</button></div></div>
  <div class="card output-panel"><span class="eyebrow">Educational response</span><h2>Relative defect-risk indicators</h2><div class="part-visual"><div class="part-shape"></div><div id="simOverlay" class="defect-overlay"></div></div><div id="riskList"></div><div class="callout" id="simAdvice"></div><p class="tiny muted">These scores show direction-of-effect in a simplified training model. They are not defect probabilities and must not be used to set a production process.</p></div></div>`;
  updateSimulator();
};

/* Improve lesson evidence literacy using content_patch fields. */
const fineRenderLesson=renderLesson;
renderLesson=function(){
  fineRenderLesson(); const l=currentLesson(),body=$("#lesson .lesson-body"); if(!body)return;
  const actions=body.querySelector(".lesson-actions-sticky");
  const block=document.createElement("div");block.className="content-block";
  block.innerHTML=`<h3>Evidence check</h3><p><b>Capture:</b> ${esc(l.evidencePrompt||"")}</p><p><b>Common trap:</b> ${esc(l.commonTrap||"")}</p>`;
  if(actions)body.insertBefore(block,actions);else body.appendChild(block);
};

/* Visuals are conceptual, not simulation/CFD. */
const fineRenderVisuals=renderVisuals;
renderVisuals=function(){fineRenderVisuals();$("#visuals").insertAdjacentHTML("afterbegin",`<div class="tip"><span>◉</span><div><b>Conceptual visuals</b><br>The animations explain process ideas; they are not scale drawings, CFD results, safety diagrams or machine-specific operating instructions.</div></div>`)};

/* Search lessons, defects, glossary and standards. */
doSearch=function(){
  const q=$("#globalSearch").value.toLowerCase().trim();if(q.length<2){$("#searchResults").innerHTML="";return}
  const ls=D.lessons.filter(l=>(l.title+" "+l.summary+" "+l.courseName).toLowerCase().includes(q)).slice(0,6);
  const ds=D.defects.filter(d=>(d.name+" "+d.symptom+" "+d.mechanisms.join(" ")).toLowerCase().includes(q)).slice(0,3);
  const gs=Object.entries(D.glossary).filter(([k,v])=>(k+" "+v).toLowerCase().includes(q)).slice(0,4);
  const ss=[...D.standards.common,...D.standards.UK,...D.standards.US,...D.standards.NZ].filter(x=>(x.name+" "+x.scope).toLowerCase().includes(q)).slice(0,3);
  const html=ls.map(l=>`<button class="search-item" data-mm-onclick="closeModal();goLesson(${l.id});switchView('lesson')"><b>Lesson:</b> ${esc(l.title)}<br><span class="muted tiny">${esc(l.courseName)}</span></button>`).join("")+
  ds.map(d=>`<button class="search-item" data-mm-onclick="closeModal();switchView('defects')"><b>Defect:</b> ${esc(d.name)}<br><span class="muted tiny">${esc(d.symptom)}</span></button>`).join("")+
  gs.map(([k,v])=>`<button class="search-item" data-mm-onclick="closeModal();switchView('glossary')"><b>Glossary:</b> ${esc(k)}<br><span class="muted tiny">${esc(v)}</span></button>`).join("")+
  ss.map(x=>`<button class="search-item" data-mm-onclick="closeModal();switchView('standards')"><b>Standard:</b> ${esc(x.name)}<br><span class="muted tiny">${esc(x.scope)}</span></button>`).join("");
  $("#searchResults").innerHTML=html||`<div class="muted">No matches.</div>`;
};

/* Modal keyboard/focus behaviour. */
let fineLastFocus=null;const fineOpenModal=openModal,fineCloseModal=closeModal;
openModal=function(html){fineLastFocus=document.activeElement;fineOpenModal(html);setTimeout(()=>{const m=$("#modal");const target=m?.querySelector("input,select,textarea,button:not(.modal-close),a[href]")||m?.querySelector(".modal-close");target?.focus()},0)};
closeModal=function(){fineCloseModal();if(fineLastFocus&&typeof fineLastFocus.focus==="function")fineLastFocus.focus();fineLastFocus=null};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").classList.contains("hidden"))closeModal()});

/* Mobile More menu gives access to all major tools. */
function openMobileMenu(){openModal(`<span class="eyebrow">More</span><h2>Tools & progress</h2><div class="grid2">
  <button class="quick-action" data-mm-onclick="closeModal();switchView('simulator')"><span class="icon">⚙</span><b>Process simulator</b><small>Relative training model.</small></button>
  <button class="quick-action" data-mm-onclick="closeModal();switchView('defects')"><span class="icon">◇</span><b>Defect finder</b><small>Mechanisms and evidence checks.</small></button>
  <button class="quick-action" data-mm-onclick="closeModal();switchView('coach')"><span class="icon">✦</span><b>Troubleshooting coach</b><small>Structured offline guidance.</small></button>
  <button class="quick-action" data-mm-onclick="closeModal();switchView('exams')"><span class="icon">✓</span><b>Knowledge checks</b><small>Safety-gated assessments.</small></button>
  <button class="quick-action" data-mm-onclick="closeModal();switchView('standards')"><span class="icon">§</span><b>Standards & safety</b><small>UK, US and NZ references.</small></button>
  <button class="quick-action" data-mm-onclick="closeModal();switchView('profile')"><span class="icon">⚙</span><b>Profile & data</b><small>Preferences and backup.</small></button>
</div>`)}

/* Ensure new learner objects receive current schema defaults. */
const fineCreateLearner=createLearner;
createLearner=function(){
  const name=$("#newLearnerName")?.value.trim();if(!name)return;
  const id="learner-"+Date.now();db.users[id]={id,name,role:"learner",completed:[],bookmarks:[],notes:{},examScores:{},examPassStatus:{},certificates:[],certificateMeta:{},currentLesson:1,lastSeen:new Date().toISOString(),region:user.region||"ALL",experience:"Beginner",goal:"Learn the full process",dailyMinutes:15,onboardingDone:true};db.activeUser=id;user=db.users[id];persist();closeModal();updateGlobalProgress();renderInstructor();toast("Learner created");
};

/* Final home refresh after hardening overrides. */
updateGlobalProgress();renderDashboard();

