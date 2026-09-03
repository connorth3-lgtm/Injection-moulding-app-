
/* ===== plugin_verification_patch.js ===== */

/* =========================================================
   Plugin-Verified Hardening Patch — 20 Aug 2026
   Cross-check inputs:
   - Data Analytics validation/data-quality methodology
   - Consensus + SciSpace peer-reviewed polymer research
   - Official OSHA / ISO / BSI / WorkSafe sources
   - Midpage legal connector attempted but unavailable due auth
   ========================================================= */

/* ---------- Strict backup import allowlist ---------- */
function pvCleanString(v,max=10000){
  return String(v==null?"":v).slice(0,max);
}
function pvUniqueInts(xs,min,max){
  return [...new Set((Array.isArray(xs)?xs:[]).filter(x=>Number.isInteger(x)&&x>=min&&x<=max))];
}
function pvCleanObjectStrings(obj,maxValue=10000){
  const out={};
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return out;
  for(const [k,v] of Object.entries(obj).slice(0,1000)){
    if(typeof v==="string"||typeof v==="number"||typeof v==="boolean")out[pvCleanString(k,160)]=pvCleanString(v,maxValue);
  }
  return out;
}
function pvCleanScores(obj){
  const out={};
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return out;
  for(const [k,v] of Object.entries(obj).slice(0,100)){
    const n=Number(v);
    if(Number.isFinite(n)&&n>=0&&n<=100)out[pvCleanString(k,120)]=Math.round(n*10)/10;
  }
  return out;
}
function pvCleanPassStatus(obj){
  const out={};
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return out;
  for(const [k,v] of Object.entries(obj).slice(0,100))out[pvCleanString(k,120)]=v===true;
  return out;
}
function pvCleanCertificateMeta(obj){
  const out={};
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return out;
  for(const [k,v] of Object.entries(obj).slice(0,100)){
    if(!v||typeof v!=="object"||Array.isArray(v))continue;
    const score=Number(v.score);
    out[pvCleanString(k,120)]={
      earnedAt: typeof v.earnedAt==="string" ? pvCleanString(v.earnedAt,80) : new Date().toISOString(),
      score: Number.isFinite(score)&&score>=0&&score<=100 ? Math.round(score*10)/10 : null,
      region:["ALL","UK","US","NZ"].includes(v.region)?v.region:"ALL",
      level:["Beginner","Intermediate","Advanced"].includes(v.level)?v.level:"Beginner"
    };
  }
  return out;
}
function pvCleanFun(obj){
  const f=(obj&&typeof obj==="object"&&!Array.isArray(obj))?obj:{};
  const safeNum=(v,lo,hi,d=0)=>Number.isFinite(+v)?Math.max(lo,Math.min(hi,+v)):d;
  return {
    xp:safeNum(f.xp,0,10000000,0),
    rewarded:pvCleanObjectStrings(f.rewarded,80),
    achievements:Array.isArray(f.achievements)?[...new Set(f.achievements.map(x=>pvCleanString(x,80)))].slice(0,200):[],
    sound:f.sound===true,
    celebrations:f.celebrations!==false,
    scenarioCorrect:safeNum(f.scenarioCorrect,0,100000,0),
    scenarioAttempts:safeNum(f.scenarioAttempts,0,100000,0),
    bossWins:safeNum(f.bossWins,0,100000,0),
    streak:safeNum(f.streak,0,10000,0),
    lastLearningDate:typeof f.lastLearningDate==="string"?pvCleanString(f.lastLearningDate,20):undefined,
    lastActiveDate:typeof f.lastActiveDate==="string"?pvCleanString(f.lastActiveDate,20):undefined
  };
}
function pvCleanMaterialScience(obj){
  const m=(obj&&typeof obj==="object"&&!Array.isArray(obj))?obj:{};
  return {
    completed:pvUniqueInts(m.completed,1,36),
    bestQuiz:Number.isFinite(+m.bestQuiz)?Math.max(0,Math.min(100,+m.bestQuiz)):null,
    quizAttempts:Number.isFinite(+m.quizAttempts)?Math.max(0,Math.min(100000,Math.floor(+m.quizAttempts))):0,
    currentLesson:Number.isInteger(m.currentLesson)&&m.currentLesson>=1&&m.currentLesson<=36?m.currentLesson:1
  };
}
normaliseImportedUser=function(u,id){
  if(!u||typeof u!=="object"||Array.isArray(u))throw new Error("Invalid learner");
  const notes={};
  if(u.notes&&typeof u.notes==="object"&&!Array.isArray(u.notes)){
    for(const [k,v] of Object.entries(u.notes)){
      const lid=Number(k);
      if(Number.isInteger(lid)&&lid>=1&&lid<=D.lessons.length)notes[String(lid)]=pvCleanString(v,20000);
    }
  }
  return {
    id:pvCleanString(u.id||id,160)||pvCleanString(id,160),
    name:pvCleanString(u.name||"Learner",120)||"Learner",
    role:u.role==="instructor"?"instructor":"learner",
    completed:pvUniqueInts(u.completed,1,D.lessons.length),
    bookmarks:pvUniqueInts(u.bookmarks,1,D.lessons.length),
    notes,
    examScores:pvCleanScores(u.examScores),
    examPassStatus:pvCleanPassStatus(u.examPassStatus),
    certificates:Array.isArray(u.certificates)?[...new Set(u.certificates.map(x=>pvCleanString(x,120)))].slice(0,100):[],
    certificateMeta:pvCleanCertificateMeta(u.certificateMeta),
    currentLesson:Number.isInteger(u.currentLesson)&&u.currentLesson>=1&&u.currentLesson<=D.lessons.length?u.currentLesson:1,
    region:["ALL","UK","US","NZ"].includes(u.region)?u.region:"ALL",
    experience:["Beginner","Intermediate","Advanced"].includes(u.experience)?u.experience:"Beginner",
    goal:pvCleanString(u.goal||"Learn the full process",300)||"Learn the full process",
    dailyMinutes:[10,15,30].includes(+u.dailyMinutes)?+u.dailyMinutes:15,
    onboardingDone:u.onboardingDone===true,
    lastSeen:typeof u.lastSeen==="string"?pvCleanString(u.lastSeen,80):new Date().toISOString(),
    fun:pvCleanFun(u.fun),
    materialScience:pvCleanMaterialScience(u.materialScience)
  };
};

/* Also prevent arbitrary top-level properties from imported backup files. */
importData=function(file){
  if(!file)return; const r=new FileReader();
  r.onload=()=>{try{
    const x=JSON.parse(r.result);
    if(!x||typeof x!=="object"||Array.isArray(x)||!x.users||typeof x.users!=="object"||Array.isArray(x.users)||!x.activeUser||!x.users[x.activeUser])throw new Error("Invalid backup structure");
    const entries=Object.entries(x.users).slice(0,500);
    const users={}; entries.forEach(([id,u])=>users[pvCleanString(id,160)]=normaliseImportedUser(u,id));
    const active=pvCleanString(x.activeUser,160);
    if(!users[active])throw new Error("Missing active learner");
    const proposed={activeUser:active,users};
    db=proposed;user=db.users[db.activeUser];
    persist();updateGlobalProgress();switchView("profile");toast("Backup imported and strictly validated");
  }catch(e){alert("That file is not a valid MouldMaster backup. No existing data was changed.")}};
  r.readAsText(file);
};

/* ---------- Accessibility: explicit names for simulator controls ---------- */
safeSlider=function(label,key,min,max,val,help){
  const units={speed:"%",transfer:"%",hold:"%",holdTime:"s",melt:"",mould:"",cooling:"s",clamp:"%",vent:"%",moisture:"%"};
  return `<label>${esc(label)}
    <div class="range-row">
      <input aria-label="${esc(label)}" type="range" min="${min}" max="${max}" value="${val}" oninput="simChange('${key}',this.value)">
      <input aria-label="${esc(label)} current display" id="sim_${key}" value="${val}${units[key]||""}" readonly>
    </div>
    ${help?`<small class="muted">${esc(help)}</small>`:""}
  </label>`;
};

/* ---------- US HazCom 2024 revision transition note ---------- */
const PV_renderStandards_base=renderStandards;
renderStandards=function(){
  PV_renderStandards_base();
  const selected=user.region==="ALL"?["UK","US","NZ"]:[user.region];
  if(selected.includes("US")){
    $("#standards").insertAdjacentHTML("beforeend",`<div class="legal-note">
      <b>US Hazard Communication transition — current as of 20 August 2026:</b>
      OSHA's revised Hazard Communication Standard is still in a staged transition.
      Manufacturers/importers/distributors evaluating <b>substances</b> had a compliance deadline of <b>19 May 2026</b>;
      employers have until <b>20 November 2026</b>, as necessary, to update workplace labels, the HazCom program and additional training for newly identified hazards for substances.
      Mixture deadlines extend to <b>19 November 2027</b> for manufacturers/importers/distributors and <b>19 May 2028</b> for employer workplace updates.
      During the applicable transition periods, OSHA permits compliance with the current or prior version as specified in 1910.1200(j).
      <div class="ref">Source: OSHA 29 CFR 1910.1200(j), current 20 Aug 2026.</div>
    </div>`);
  }
};

/* ---------- Clarify ISO 1133-2 review status in Material Science references ---------- */
const PV_renderMaterialReferences_base=renderMaterialReferences;
renderMaterialReferences=function(){
  const html=PV_renderMaterialReferences_base();
  return html.replace(
    `Provides a specific MFR/MVR method for materials whose rheology is sensitive to time-temperature history and/or moisture, reinforcing why material history matters.`,
    `Provides a specific MFR/MVR method for materials whose rheology is sensitive to time-temperature history and/or moisture, reinforcing why material history matters. ISO currently lists this 2011 edition in review, so its status should be re-checked before formal programme use.`
  );
};

/* ---------- QA provenance panel ---------- */
function pvAuditPanel(){
  return `<div class="card standard-card" style="margin-top:14px">
    <span class="eyebrow">Independent cross-checks</span>
    <h3>Plugin-assisted QA provenance</h3>
    <p>This build was cross-checked using Data Analytics validation/data-quality methodology, two independent academic-research indexes (Consensus and SciSpace), current official OSHA/ISO/BSI/WorkSafe sources, and automated browser/runtime tests. The Midpage legal connector was attempted but required reauthentication, so no legal proposition was accepted from that unavailable connector.</p>
    <div class="mat-tags">
      <span class="mat-tag">Assessment QA</span><span class="mat-tag">Scientific literature</span><span class="mat-tag">Official standards</span><span class="mat-tag">Runtime regression</span><span class="mat-tag">Import hardening</span>
    </div>
  </div>`;
}
const PV_renderProfile_base=renderProfile;
renderProfile=function(){
  PV_renderProfile_base();
  $("#profile").insertAdjacentHTML("beforeend",pvAuditPanel());
};

