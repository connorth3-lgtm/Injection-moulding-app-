/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: learning-foundation-runtime-pack.js
 */

/* >>> reading-patch.js */
/* MouldMaster lesson-reading enhancement — 2026.09.14.1 */
(function(){
  'use strict';
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function marker(el,step,label,primary){
    if(!el)return;
    el.classList.add('lesson-read-block');
    if(primary)el.classList.add('lesson-read-primary');
    if(el.querySelector(':scope > .mm-read-marker'))return;
    const m=document.createElement('div');
    m.className='mm-read-marker';
    m.innerHTML=`<b>${step}</b><span>${label}</span>`;
    el.prepend(m);
  }
  function enhanceLesson(){
    const article=document.querySelector('#lesson article.lesson-body');
    if(!article)return;
    if(!article.querySelector(':scope > .mm-reading-guide')){
      const guide=document.createElement('div');
      guide.className='mm-reading-guide';
      guide.setAttribute('role','note');
      guide.innerHTML='<span>START HERE</span><div><strong>Read boxes 1, 2 and 3 in order.</strong><p>Then complete yellow box 4. Open <b>Extra help</b> only if you want examples or a simpler explanation.</p></div>';
      const progress=article.querySelector(':scope > .mm-lesson-progress');
      progress?progress.after(guide):article.prepend(guide);
    }
    const blocks=[...article.children].filter(x=>x.classList?.contains('content-block'));
    const findBlock=(pattern)=>blocks.find(x=>pattern.test(norm(x.querySelector('h3')?.textContent)));
    const intro=findBlock(/^why this matters$/)||blocks[0];
    const objectives=findBlock(/^by the end of this lesson|^learning objectives/);
    const points=findBlock(/^key points$|^key engineering points|^what to remember/);
    const exercise=[...article.children].find(x=>x.classList?.contains('callout'));
    marker(intro,'1','READ THIS FIRST',true);
    marker(objectives,'2','READ NEXT');
    marker(points,'3','MAIN POINTS');
    marker(exercise,'4','DO THIS AFTER READING');
    exercise?.classList.add('lesson-read-task');
    const teaching=article.querySelector('#mmTeaching');
    if(teaching&&!teaching.parentElement?.classList.contains('mm-extra-help')){
      const details=document.createElement('details');
      details.className='mm-extra-help';
      details.innerHTML='<summary><span>Extra help</span><b>Show examples and explanations</b></summary>';
      teaching.before(details);
      details.appendChild(teaching);
    }
    const next=article.querySelector('.lesson-actions-sticky .primary');
    if(next&&/^complete\s*&\s*continue/i.test(next.textContent||''))next.textContent='Finished reading — next lesson →';
    article.dataset.readEnhanced='1';
  }
  function loadReadAloud(){
    if(window.MMReadAloud||document.querySelector('script[data-mm-read-aloud-runtime]'))return;
    const script=document.createElement('script');
    script.src='./read-aloud.js';
    script.dataset.mmReadAloudRuntime='1';
    script.async=false;
    document.head.appendChild(script);
  }
  function loadBook(){
    if(window.MMBook||document.querySelector('script[data-mm-book-runtime]'))return;
    const script=document.createElement('script');
    script.src='./book-runtime.js';
    script.dataset.mmBookRuntime='1';
    script.async=false;
    document.head.appendChild(script);
  }
  function settleViewTop(){
    const main=document.querySelector('main.main')||document.querySelector('.main');
    if(main)main.scrollTop=0;
    if(document.body)document.body.scrollTop=0;
    const scrolling=document.scrollingElement;if(scrolling)scrolling.scrollTop=0;
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){window.scrollTo(0,0)}
  }
  function installStableViewEntry(){
    const current=window.switchView;
    /* Runtime V2 owns the canonical switchView dispatcher once it is present.
       Do not wrap that dispatcher from a MutationObserver callback: rebinding a
       Runtime-owned global recreates wrapper chains and can turn shell adoption
       into recursive switchView/scrollTo calls. The pre-Runtime wrapper, when
       installed during initial parsing, is already retained as the captured
       legacy implementation inside Runtime V2. */
    if(typeof current!=='function'||current.__mmStableViewEntry||current.__mmRuntimeV2)return false;
    const wrapped=function(){
      const active=document.activeElement;
      if(active&&typeof active.blur==='function')active.blur();
      const root=document.documentElement;
      const previousAnchor=root.style.overflowAnchor;
      const nativeScrollTo=window.scrollTo;
      root.style.overflowAnchor='none';
      settleViewTop();
      window.scrollTo=function(leftOrOptions,top){
        if(leftOrOptions&&typeof leftOrOptions==='object')return nativeScrollTo.call(window,{...leftOrOptions,behavior:'auto'});
        return nativeScrollTo.call(window,leftOrOptions,top);
      };
      let result;
      try{result=current.apply(this,arguments)}finally{window.scrollTo=nativeScrollTo}
      settleViewTop();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{settleViewTop();root.style.overflowAnchor=previousAnchor}));
      return result;
    };
    wrapped.__mmStableViewEntry=true;
    wrapped.__mmStableViewEntryBase=current;
    window.switchView=wrapped;
    window.__MM_STABLE_VIEW_ENTRY__='2026.09.14.1';
    return true;
  }
  const run=()=>{enhanceLesson();installStableViewEntry()};
  const boot=()=>{run();loadReadAloud();loadBook();};
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* <<< reading-patch.js */

/* >>> training-upgrade.js */
/* MouldMaster guided training upgrade v2 — content 2026.08.23.5 */
(function(){
'use strict';
const REVIEW_KEY='mm_spaced_review_v2', SIGN_KEY='mm_practical_signoff_v1', DAY=86400000;
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const load=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||'');return x&&typeof x==='object'?x:d}catch(_){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const qt=q=>q?.q??q?.[0]??'', qo=q=>q?.options??q?.[1]??[], qc=q=>Number(q?.correct??q?.[2]??0), qw=q=>q?.explanation??q?.why??q?.[3]??'', qfb=q=>q?.optionFeedback??q?.feedback??q?.[6]??[], qu=q=>q?.sourceUrl??q?.url??q?.[5]??'', qr=q=>q?.reference??q?.source??q?.[4]??'';

const SRC={
 safety:[['ISO 20430:2020','Injection moulding machine safety requirements.','https://www.iso.org/standard/68000.html'],['HSE — Plastics processing safety','UK machinery and plastics-processing guidance.','https://www.hse.gov.uk/pubns/plasindx.htm'],['OSHA Injection Molding eTool','US machine guarding and safe-access guidance.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],['WorkSafe NZ — Safe use of machinery','NZ machinery risk-management guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/']],
 stats:[['NIST Engineering Statistics Handbook','Capability, measurement, DOE and statistical engineering.','https://www.itl.nist.gov/div898/handbook/'],['NIST — Process capability','Capability concepts and interpretation prerequisites.','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],['NIST — Experimental design','Factors, interactions, randomisation and blocking.','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm']],
 material:[['ISO 1133-1:2022','MFR/MVR testing under specified conditions.','https://www.iso.org/standard/83905.html'],['ASTM D1238','Melt-flow-rate test method for thermoplastics.','https://store.astm.org/standards/d1238'],['Trotta et al. (2021), Polymer Testing','Injection-moulding rheology and shear-thinning behaviour.','https://doi.org/10.1016/j.polymertesting.2021.107068'],['Hu et al. (2022), Polymers','Cooling-rate effects on polypropylene crystallisation.','https://doi.org/10.3390/polym14173646']],
 thermal:[['Autodesk Moldflow — Cooling stage','Cooling-stage heat removal and solidification background.','https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'],['Zhao et al. (2022), Int J Adv Manuf Technol','Review of injection-moulding warpage/shrinkage and interacting process parameters.','https://pubmed.ncbi.nlm.nih.gov/35194289/'],['Hu et al. (2022), Polymers','Cooling-rate effects on crystallisation behaviour.','https://doi.org/10.3390/polym14173646']],
 pack:[['Autodesk Moldflow — Packing guidance','Packing, hold and gate-freeze background.','https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html'],['Zhao et al. (2022), Int J Adv Manuf Technol','Review of packing/cooling/process effects on shrinkage and warpage.','https://pubmed.ncbi.nlm.nih.gov/35194289/']],
 flow:[['Trotta et al. (2021), Polymer Testing','High-shear moulding rheology and shear thinning.','https://doi.org/10.1016/j.polymertesting.2021.107068'],['Zhao et al. (2022), Int J Adv Manuf Technol','Multi-parameter injection-moulding review.','https://pubmed.ncbi.nlm.nih.gov/35194289/']],
 tooling:[['ISO 20430:2020','Safety requirements at machine/tool interfaces.','https://www.iso.org/standard/68000.html'],['Zhao et al. (2022), Int J Adv Manuf Technol','Process/tooling interactions relevant to dimensional response.','https://pubmed.ncbi.nlm.nih.gov/35194289/']],
 automation:[['ISO 20430:2020','Injection moulding machinery safety requirements.','https://www.iso.org/standard/68000.html'],['OSHA Injection Molding eTool','Integrated guarding and safe access around moulding machinery.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],['WorkSafe NZ — Safe use of machinery','Machinery safeguarding and risk-control guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/']]
};
function categories(text){const t=String(text||'').toLowerCase(),c=[];if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell/.test(t))c.push('safety');if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling/.test(t))c.push('stats');if(/material|polymer|rheology|viscosity|mfr|mvr|moisture|dry|crystall|degrad|residence|regrind/.test(t))c.push('material');if(/cool|temperature|thermal|warpage|shrink|ejection/.test(t))c.push('thermal');if(/pack|hold|gate seal|sink/.test(t))c.push('pack');if(/fill|flow|pressure loss|shear|jet|weld|short shot|vent|burn/.test(t))c.push('flow');if(/\bmould\b|\bmold\b|runner|gate|tool|cavity|draft|clamp/.test(t))c.push('tooling');if(/automation|sensor|vision|eoat|robot|mes|traceability/.test(t))c.push('automation');return [...new Set(c)];}
function refsFor(text,count=3){const out=[];for(const cat of categories(text))for(const s of (SRC[cat]||[]))if(!out.some(x=>x[2]===s[2]))out.push(s);return out.slice(0,count)}
function refsHTML(text,title='Evidence & further reading'){const a=refsFor(text);if(!a.length)return `<section class="mm-ref-panel"><span class="eyebrow">References</span><h3>${title}</h3><p>No general external source was auto-selected for this topic. Use the lesson rationale, current machine/tool documentation, approved site procedures and any source specifically cited by the question or material grade.</p></section>`;return `<section class="mm-ref-panel"><span class="eyebrow">References</span><h3>${title}</h3>${a.map(s=>`<a href="${s[2]}" target="_blank" rel="noopener"><b>${esc(s[0])}</b><small>${esc(s[1])}</small><em>Open ↗</em></a>`).join('')}<p>General references support mechanisms, not universal production settings. Current supplier data, machine documentation, approved procedures and applicable law control specific limits.</p></section>`}

const GUIDES=[
 [/cycle|phase/,['The moulding cycle is a sequence of filling, transfer, packing/holding, cooling, recovery and mould movement. Each phase has a different physical purpose.','Compare phase times and actual values with a known-good cycle.','A total cycle gets longer: first identify which phase changed.','Treating total cycle time as one number and missing the changing phase.']],
 [/setpoint|actual|controller/,['A setpoint is a command; an actual is evidence of what the machine and material actually did.','Trend fill time, peak pressure, transfer position, cushion and recovery time.','The recipe is unchanged but fill time drifts: compare actuals first.','Assuming equal recipes prove equal processes.']],
 [/cushion|non-return|check valve/,['Cushion and shot-delivery consistency help reveal how repeatably material was delivered and packed.','Trend cushion, transfer, pressure and part mass together.','Cushion and mass vary together: investigate delivery before compensating with hold.','Masking unstable delivery with more packing.']],
 [/moisture|dry|splay/,['Moisture-sensitive grades need grade-specific drying, handling and verification.','Check dryer performance, material history and the approved moisture method.','Splay follows humid exposure: verify moisture before unrelated machine changes.','Using one generic drying recipe for all resins.']],
 [/viscosity|rheology|shear|mfr|mvr/,['Thermoplastic apparent viscosity depends on shear rate, temperature and material history; most melts are shear-thinning.','Compare controlled fill-rate response and pressure while holding other conditions stable.','A speed study changes pressure response even when the material grade is unchanged.','Treating MFR as a complete moulding rheology curve.']],
 [/cool|warpage|shrink|temperature/,['Cooling and thermal balance affect solidification, shrinkage, ejection stability and warpage.','Track water condition, mould-surface temperature, ejection condition and dimensions.','A water-line change is followed by dimensional drift: verify the thermal system first.','Optimising cycle time without checking the quality boundary.']],
 [/pack|hold|gate seal|sink/,['Packing compensates volumetric shrinkage while the gate still transmits useful pressure.','Use part-mass/gate-seal evidence plus local geometry and cooling.','Part mass reaches a plateau: extra hold time may no longer transmit useful pressure.','Extending hold time after effective gate seal.']],
 [/short shot|burn|vent|weld|jet|flow/,['Flow defects are diagnosed by locating where the filling pattern, gas escape or joining flow fronts differ from the intended mechanism.','Use partial fills, pressure/fill-time actuals and physical flow-path evidence.','An end-fill burn points strongly toward gas escape/venting evidence.','Changing several unrelated settings at once.']],
 [/capability|cpk|ppk|measurement|doe|factor|random|validation/,['Statistical conclusions depend on stable processes, adequate measurement and a design that supports the question being asked.','Verify stability/measurement first; use DOE structure when interactions matter.','A factor run only late in the shift may be confounded with time.','Treating one capability number or unstructured trial as proof.']],
 [/guard|interlock|lockout|isolation|safety|robot|automation/,['Safeguards and authorised isolation are safety controls, not process variables.','Verify safeguard status and use the applicable site isolation/risk-control procedure.','A failed interlock is a safety defect, not a troubleshooting shortcut.','Bypassing protection to keep production running.']],
 [/runner|gate|cavity|draft|tooling|tool design|clamp|parting line|hot runner/,['Tooling geometry and condition shape flow, sealing, cooling and ejection; local defects often require local evidence.','Inspect the exact affected location and compare cavity/branch behaviour before global changes.','Local flash appears after tool work: inspect local seating/parting-line condition first.','Using a global process change to hide a local tooling fault.']]
];
const COURSE_GUIDES={
 'Foundations':['Injection moulding turns a controlled polymer melt into a repeatable part through filling, packing, cooling and ejection.','Identify the current cycle phase, relevant setpoints and measured actuals before drawing a conclusion.','Map a normal production cycle from material feed through part ejection.','Treating the whole process as one setting or one symptom.'],
 'Machine & Controls':['The machine creates and measures the motions, forces, temperatures and timing used by the process.','Compare commanded values, measured actuals and machine capability with a known-good cycle.','A recipe is unchanged but an actual drifts: investigate the machine response.','Assuming the controller display proves the physical process repeated.'],
 'Materials':['Material chemistry, grade, condition and processing history control how the polymer flows and performs.','Verify the exact grade, supplier data, handling history and relevant material condition.','Two grades share a family name but require different handling and validation.','Using family-level rules as a substitute for grade-specific evidence.'],
 'Mould Design':['Mould geometry, feeding, venting, cooling and ejection create local process conditions inside each cavity.','Compare cavities and inspect the affected flow path, vent, cooling circuit or ejection feature.','One cavity changes while the others remain stable: investigate local evidence first.','Using a global machine change to hide a local mould condition.'],
 'Process Setup':['A robust setup deliberately establishes filling, transfer, packing, cooling and recovery from a recorded baseline.','Record actuals and part responses while changing one authorised factor at a time.','Build a process window from controlled studies, then document its centre and limits.','Copying settings without confirming the transferred process.'],
 'Defect Troubleshooting':['A defect is evidence of one or more physical mechanisms, not a direct instruction to change a setting.','Locate the defect, compare known-good evidence and test the strongest competing causes.','A defect appears in one cavity: separate local from system-wide causes first.','Changing several variables at once until appearance improves.'],
 'Scientific Moulding':['Scientific moulding uses measured process studies to separate filling, transfer, packing, cooling and recovery effects.','Use repeatable actuals, controlled studies and confirmed responses rather than recipe values alone.','A viscosity or gate-seal study defines evidence for a process decision.','Calling an undocumented setting change a scientific study.'],
 'Capability & Validation':['Validation links a stable, measured process to defined product requirements and an approved control strategy.','Confirm measurement adequacy and stability before interpreting capability or validation evidence.','A capable result is supported by stable data, suitable measurement and a justified sampling plan.','Treating a single Cpk value as proof regardless of stability or measurement.'],
 'DOE & Statistics':['Designed experiments separate factor effects from noise only when their structure supports the conclusion.','Check randomisation, blocking, replication, interactions and measurement before accepting an effect.','A factor run only late in a shift may be confounded with time.','Changing many factors informally and calling the result a DOE.'],
 'Automation & Sensors':['Automation combines machinery, controls and people into one integrated system whose process and safety states must be designed together.','Verify sensor location, calibration, sequence logic, guarding and failure response.','A cavity sensor and machine sensor disagree because they measure different locations and events.','Assuming automation removes the need for integrated risk assessment.'],
 'Advanced Tooling & Simulation':['Advanced tooling and simulation predict local flow and thermal behaviour, but predictions must be checked against the real mould and process.','Compare model assumptions with cavity, cooling, pressure, temperature and part evidence.','A simulation trend is validated against short-shot or sensor evidence before release.','Treating a simulation image as proof without checking assumptions.'],
 'Expert Process Engineering':['Expert decisions integrate material, machine, mould, method, measurement, safety and economics without losing traceability.','State the competing mechanisms, evidence, constraints and confirmation test.','A change proposal includes technical evidence, risk, validation and control-plan impact.','Optimising one metric while ignoring system constraints and downstream risk.']
};
function packGuide(a){return {plain:a[0],evidence:a[1],example:a[2],mistake:a[3]}}
function guide(title,courseName){const t=String(title||'').toLowerCase();for(const [r,a] of GUIDES)if(r.test(t))return packGuide(a);return packGuide(COURSE_GUIDES[courseName]||COURSE_GUIDES['Expert Process Engineering'])}
function enrichLessons(D){D.lessons.forEach(l=>{l.mmGuide=guide(l.title,l.courseName)})}

const EXTRA=[
 ['Fill time drifts but recipe does not','Over an hour, fill time slowly increases while saved recipe values remain unchanged.',['Increase injection speed until the old fill time returns','Compare fill-time/pressure actuals, material condition and thermal actuals with the known-good baseline','Increase hold pressure','Change cooling time first'],1,'Setpoints do not prove the material or machine response stayed constant.'],
 ['One cavity becomes light','In an eight-cavity mould, one cavity gradually loses part mass while seven remain stable.',['Increase total shot size','Inspect the affected branch/gate and compare cavity balance before global changes','Increase hold time for every cavity','Reduce clamp force'],1,'A single-cavity change points first to local flow-path, gate, vent or thermal evidence.'],
 ['Recovery time becomes erratic','Recovery time becomes erratic and cushion variation appears at the same time.',['Check feed/material delivery, recovery actuals and shot-delivery consistency','Increase cooling time','Change clamp force','Change robot delay'],0,'Recovery and cushion evidence point toward feed/plasticising/shot delivery.'],
 ['Dimension shifts after water-line work','A critical dimension moves immediately after mould-water hoses were reconnected.',['Change hold pressure first','Verify circuit connection, flow and mould-surface temperature balance','Change transfer','Increase fill speed'],1,'The timing strongly implicates the changed thermal system.'],
 ['Part sticks after texture change','Ejection force rises after a new surface texture is added.',['Review draft, texture direction, local cooling/ejection and tooling condition','Raise packing','Increase fill speed','Let the robot pull harder'],0,'Texture changes release behaviour; review tooling/ejection evidence.'],
 ['Cpk drops after gauge change','Process and parts appear stable, but Cpk drops immediately after a new measurement fixture is introduced.',['Change moulding settings','Verify the measurement system before interpreting capability','Increase sample size only','Change specifications'],1,'A measurement-system change can alter observed variation.'],
 ['DOE result changes by run order','A factor appears important only when all high settings were run late in the shift.',['Accept the effect as proven','Consider time confounding and randomise/block appropriately','Remove replication','Change the specification'],1,'Run order can confound factor effects with time-related nuisance changes.'],
 ['Pressure sensor disagrees with machine','An in-cavity sensor trace changes while machine peak pressure is nearly constant.',['Assume one instrument is wrong','Recognise different measurement locations and investigate the local cavity event plus sensor health','Copy cavity pressure into the machine setpoint','Ignore the cavity sensor'],1,'Machine and local cavity pressure are different measurements.']
];
function addScenarios(D){const have=new Set((D.scenarios||[]).map(x=>x.title));for(const a of EXTRA)if(!have.has(a[0]))D.scenarios.push({title:a[0],situation:a[1],choices:a[2],correct:a[3],why:a[4],feedback:a[2].map((_,i)=>i===a[3]?a[4]:'This does not directly test the mechanism best supported by the evidence.')})}

const BANK_VERSION='2026.08.21.1';
function bankId(D,q,level,region){const text=qt(q);if(region){const a=D.regionalQuestions?.[region]?.[level]||[],i=a.findIndex(x=>qt(x)===text);return i>=0?`reg:${BANK_VERSION}:${region}:${level}:${i}`:null}const a=D.exams?.[level]||[],i=a.findIndex(x=>qt(x)===text);return i>=0?`tech:${BANK_VERSION}:${level}:${i}`:null}
function patchQuestionIds(D){const base=window.getExamQuestions;if(typeof base!=='function')return;window.getExamQuestions=function(level,region){const arr=base.apply(this,arguments);arr.forEach(q=>{q.mmId=bankId(D,q,level,q.region||null)||`legacy:${level}:${String(qt(q)).slice(0,80)}`});return arr}}
function findById(D,id){let m=/^tech:([^:]+):([^:]+):(\d+)$/.exec(id);if(m)return m[1]===BANK_VERSION?{level:m[2],q:D.exams?.[m[2]]?.[+m[3]]}:null;m=/^reg:([^:]+):([^:]+):([^:]+):(\d+)$/.exec(id);if(m)return m[1]===BANK_VERSION?{reg:m[2],level:m[3],q:D.regionalQuestions?.[m[2]]?.[m[3]]?.[+m[4]]}:null;m=/^tech:([^:]+):(\d+)$/.exec(id);if(m)return {level:m[1],q:D.exams?.[m[1]]?.[+m[2]]};m=/^reg:([^:]+):([^:]+):(\d+)$/.exec(id);if(m)return {reg:m[1],level:m[2],q:D.regionalQuestions?.[m[1]]?.[m[2]]?.[+m[3]]};return null}
function recordReview(q,ok,confidence){if(!q)return;const id=q.mmId||`legacy:${String(qt(q)).slice(0,160)}`,st=load(REVIEW_KEY,{items:{}}),x=st.items[id]||{id,stage:0,right:0,wrong:0,due:Date.now()};if(ok){x.right++;x.stage=Math.min(5,x.stage+1);if(confidence==='low')x.stage=Math.max(1,x.stage-1);x.due=Date.now()+([1,2,4,7,14,30][x.stage]||30)*DAY}else{x.wrong++;x.stage=0;x.due=Date.now()+DAY}x.last=Date.now();x.confidence=confidence||'medium';st.items[id]=x;save(REVIEW_KEY,st)}
function due(){return Object.values(load(REVIEW_KEY,{items:{}}).items||{}).filter(x=>x.due<=Date.now()||x.wrong>x.right).sort((a,b)=>(b.wrong-b.right)-(a.wrong-a.right)||a.due-b.due)}
function difficulty(level,i,q){if(q?.region)return level==='Advanced'?'Expert safety':'Applied safety';if(level==='Beginner')return i<3?'Foundation':'Applied';if(level==='Intermediate')return i<3?'Applied':'Diagnostic';return i<3?'Diagnostic':'Expert'}
function readHint(t){if(/checked first|check first/i.test(t))return 'Choose the first check that most directly tests the evidence.';if(/purpose/i.test(t))return 'Ask what job the phase, component or study is meant to do.';return 'Separate the symptom from the cause and choose the option best supported by measurable evidence.'}
function exactRefs(q){return qu(q)?[[qr(q)||'Question source','Source cited by this assessment item.',qu(q)]]:[]}

function lessonHTML(l){const g=l.mmGuide||guide(l.title,l.courseName);return `<section class="mm-teaching-grid" id="mmTeaching"><div class="mm-teach mm-plain"><span>PLAIN ENGLISH</span><h3>What this means</h3><p>${esc(g.plain)}</p></div><div class="mm-teach"><span>REAL MOULDING EXAMPLE</span><h3>What it looks like</h3><p>${esc(g.example)}</p></div><div class="mm-teach mm-mistake"><span>COMMON MISTAKE</span><h3>What to avoid</h3><p>${esc(g.mistake)}</p></div><div class="mm-teach"><span>EVIDENCE TO CHECK</span><h3>What would prove it?</h3><p>${esc(g.evidence)}</p></div></section>${refsHTML(l.title+' '+(l.courseName||''))}`}
function patchLesson(D){if(typeof window.renderLesson!=='function')return;const base=window.renderLesson;window.renderLesson=function(){base.apply(this,arguments);try{const l=typeof window.currentLesson==='function'?window.currentLesson():null,b=document.querySelector('#lesson .lesson-body');if(!l||!b)return;if(!b.querySelector('#mmTeaching'))(b.querySelector('.callout')||b.querySelector('h3')||b).insertAdjacentHTML('afterend',lessonHTML(l));const c=D.courses.find(x=>x.id===l.course);if(c&&!b.querySelector('.mm-lesson-progress')){const i=c.lessonIds.indexOf(l.id)+1;b.insertAdjacentHTML('afterbegin',`<div class="mm-lesson-progress"><div><b>Lesson ${i} of ${c.lessonIds.length}</b><span>${Math.round(i/c.lessonIds.length*100)}%</span></div><i><b style="width:${i/c.lessonIds.length*100}%"></b></i></div>`)}if(innerWidth<720&&!b.querySelector('.mm-mobile-lessons')){const side=document.querySelector('#lesson .lesson-side');if(side){const x=document.createElement('button');x.className='secondary mm-mobile-lessons';x.textContent='☰ Lesson list';x.onclick=()=>side.classList.toggle('mm-open');b.prepend(x)}}}catch(_){}}}
function patchExam(){
 if(typeof window.startExam!=='function'||typeof window.gradeExam!=='function')return;
 const start=window.startExam,grade=window.gradeExam;
 window.startExam=function(level){
  const r=start.apply(this,arguments);
  if(window.activeExam)window.activeExam.mmSubmitted=false;
  setTimeout(()=>document.querySelectorAll('#examQuestions .question').forEach((el,i)=>{
   const q=window.activeExam?.questions?.[i];if(!q||el.querySelector('.mm-qmeta'))return;
   el.querySelector('b')?.insertAdjacentHTML('afterend',`<div class="mm-qmeta"><span>${esc(difficulty(level,i,q))}</span><span>References after grading</span></div><div class="question-plain-language"><b>How to read this:</b> ${esc(readHint(qt(q)))}</div>`);
   el.insertAdjacentHTML('beforeend',`<div class="mm-confidence"><b>Confidence:</b><label><input type="radio" name="conf${i}" value="low"> Low</label><label><input type="radio" name="conf${i}" value="medium" checked> Medium</label><label><input type="radio" name="conf${i}" value="high"> High</label></div>`);
  }),0);
  return r;
 };
 window.gradeExam=function(level){
  const exam=window.activeExam;
  if(!exam)return grade.apply(this,arguments);
  if(exam.mmSubmitted){window.toast?.('This attempt has already been graded. Start a new exam to try again.');return false}
  exam.mmSubmitted=true;
  const qs=exam.questions||[],res=qs.map((q,i)=>{const a=document.querySelector(`input[name=ex${i}]:checked`),c=document.querySelector(`input[name=conf${i}]:checked`);return {q,sel:a?+a.value:null,conf:c?.value||'medium'}});
  let r;
  try{r=grade.apply(this,arguments)}catch(e){exam.mmSubmitted=false;throw e}
  document.querySelectorAll('#examQuestions input').forEach(x=>x.disabled=true);
  const gradeButton=[...document.querySelectorAll('#examQuestions ~ button, #modal button')].find(x=>/grade/i.test(x.textContent||''));
  if(gradeButton){gradeButton.disabled=true;gradeButton.textContent='Attempt graded'}
  res.forEach(x=>recordReview(x.q,x.sel===qc(x.q),x.conf));
  setTimeout(()=>{
   const host=document.querySelector('#answerReview');if(!host||document.querySelector('.mm-learning-debrief'))return;
   const html=res.map((x,i)=>{const o=qo(x.q),f=qfb(x.q),cr=qc(x.q),refs=exactRefs(x.q);return `<details class="mm-debrief"><summary>${x.sel===cr?'✓':'↻'} Question ${i+1} · ${esc(difficulty(level,i,x.q))} · ${esc(x.conf)} confidence</summary><div><h4>Why the best answer is best</h4><p>${esc(qw(x.q)||'The best answer follows the mechanism and evidence described in the question.')}</p><h4>Why the other choices are weaker</h4><ul>${o.map((v,j)=>j===cr?'':`<li><b>${esc(v)}</b> — ${esc(f[j]||'This choice does not test the strongest mechanism supported by the evidence.')}</li>`).join('')}</ul><h4>References</h4>${refs.length?refs.map(s=>`<a class="mm-ref-link" href="${s[2]}" target="_blank" rel="noopener"><b>${esc(s[0])}</b><small>${esc(s[1])}</small></a>`).join(''):'<p>No external source was attached to this item; use its audited rationale.</p>'}</div></details>`}).join('');
   host.insertAdjacentHTML('afterend',`<section class="mm-learning-debrief"><h3>Learning debrief</h3><p>This submitted attempt is locked. Wrong choices are explained as misconceptions, not recommended process changes.</p>${html}</section>`);
  },0);
  return r;
 };
}
window.mmOpenReview=function(){const D=window.MM_DATA,items=due().map(x=>({x,z:findById(D,x.id)})).filter(v=>v.z?.q).slice(0,10);if(!items.length){window.openModal?.('<h2>Review weak areas</h2><div class="callout">Nothing is due right now.</div>');return}window.mmReviewItems=items;window.openModal?.(`<span class="eyebrow">Spaced repetition</span><h2>Review weak areas</h2>${items.map((v,i)=>`<div class="question"><b>${i+1}. ${esc(qt(v.z.q))}</b>${qo(v.z.q).map((o,j)=>`<label class="option"><input type="radio" name="rv${i}" value="${j}"> ${esc(o)}</label>`).join('')}<button class="secondary" data-mm-onclick="mmCheckReview(${i},this)">Check answer</button><div class="feedback hidden"></div></div>`).join('')}`)};
window.mmCheckReview=function(i,b){const v=window.mmReviewItems?.[i],q=v?.z?.q,r=document.querySelector(`input[name=rv${i}]:checked`),f=b.parentElement.querySelector('.feedback');if(!q||!r){f.classList.remove('hidden');f.textContent='Choose an answer first.';return}q.mmId=v.x.id;const ok=+r.value===qc(q);recordReview(q,ok,'medium');f.classList.remove('hidden');f.innerHTML=`<b>${ok?'Correct ✓':'Review again'}</b><br>${esc(qw(q))}`;b.disabled=true};
function patchExamHome(){if(typeof window.renderExams!=='function')return;const base=window.renderExams;window.renderExams=function(){base.apply(this,arguments);const h=document.querySelector('#exams');if(h&&!h.querySelector('.mm-review-card'))h.insertAdjacentHTML('afterbegin',`<div class="card mm-review-card"><div><span class="eyebrow">Spaced repetition</span><h3>Review weak areas</h3><p>Missed and low-confidence questions return on an increasing schedule using stable question-bank IDs.</p></div><div><b>${due().length}</b><span>due / weak</span><button class="secondary" data-mm-onclick="mmOpenReview()">Start review</button></div></div>`)}}

const SIGN=['Identify guarded danger zones and explain why safeguards must remain effective','Explain the purpose of each major moulding-cycle phase','Distinguish setpoints from measured actuals','Recognise V/P transfer, cushion and shot-delivery evidence','Verify material identity and grade-specific handling information','Use safe authorised troubleshooting methods','Recognise common defect mechanisms','Collect a known-good baseline before process changes','Explain cavity-balance or partial-fill evidence','Explain gate-seal evidence','Interpret a simple process trend','Escalate conditions requiring maintenance, engineering or safety authority'];
const signData=()=>load(SIGN_KEY,{checks:{},supervisor:'',date:'',notes:''});
window.mmSaveSignoff=function(){const d=signData();SIGN.forEach((_,i)=>d.checks[i]=!!document.querySelector(`#mmSign${i}`)?.checked);d.supervisor=document.querySelector('#mmSupervisor')?.value||'';d.date=document.querySelector('#mmSignDate')?.value||'';d.notes=document.querySelector('#mmSignNotes')?.value||'';save(SIGN_KEY,d);window.toast?.('Practical sign-off saved locally')};
function signHTML(){const d=signData();return `<section class="card mm-signoff"><span class="eyebrow">Practical competency</span><h2>Supervisor sign-off</h2><p>This local workplace learning record is not an accredited licence or legal compliance certificate.</p><div class="mm-sign-progress"><b>${Object.values(d.checks).filter(Boolean).length}/${SIGN.length}</b> observed</div>${SIGN.map((x,i)=>`<label><input id="mmSign${i}" type="checkbox" ${d.checks[i]?'checked':''}> <span>${esc(x)}</span></label>`).join('')}<div class="mm-sign-grid"><label>Supervisor / assessor<input id="mmSupervisor" value="${esc(d.supervisor)}"></label><label>Date<input id="mmSignDate" type="date" value="${esc(d.date)}"></label></div><label>Evidence / notes<textarea id="mmSignNotes">${esc(d.notes)}</textarea></label><button class="primary" data-mm-onclick="mmSaveSignoff()">Save practical record</button></section>`}
function patchCert(){if(typeof window.renderCertificates!=='function')return;const base=window.renderCertificates;window.renderCertificates=function(){base.apply(this,arguments);const h=document.querySelector('#certificates');if(h&&!h.querySelector('.mm-signoff'))h.insertAdjacentHTML('beforeend',signHTML())}}

function init(){const D=window.MM_DATA;if(!D||!Array.isArray(D.lessons)){setTimeout(init,100);return}if(window.__MM_TRAINING_V2__)return;window.__MM_TRAINING_V2__=true;enrichLessons(D);addScenarios(D);patchQuestionIds(D);patchLesson(D);patchExam();patchExamHome();patchCert();try{if(document.querySelector('#lesson:not(.hidden)'))window.renderLesson?.();if(document.querySelector('#exams:not(.hidden)'))window.renderExams?.()}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* <<< training-upgrade.js */

/* >>> training-qa-fix.js */
/* MouldMaster training data/assessment bridge — 2026.09.15.4 */
(function(){
'use strict';
const REVIEW_KEY='mm_spaced_review_v2', LEGACY_REVIEW='mm_spaced_review_v1', SIGN_KEY='mm_practical_signoff_v1';
const ASSESSMENT_ANALYTICS_PREFIXES=['mm_assessment_analytics_v1','mm_assessment_exposure_timing_v1','mm_assessment_opening_history_v1','mm-assessment-question-history-v4','mm-assessment-result-meta-v1'];
const LEARNING_ANALYTICS_PREFIX='mm_learning_analytics_v1::';
const ANALYTICS_CLEANUP_CODE='MM_ANALYTICS_CLEANUP_FAILED';
const LEARNER_ID_RE=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
function canonicalLearnerId(v){const s=String(v??'');if(!LEARNER_ID_RE.test(s))throw new Error('Invalid learner identifier');return s}
function cleanupError(area,detail){const e=new Error(`Local ${area} cleanup could not be verified${detail?`: ${detail}`:''}`);e.code=ANALYTICS_CLEANUP_CODE;e.area=area;return e}
function matchingKeys(predicate,area){
 try{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&predicate(k))out.push(k)}return [...new Set(out)]}
 catch(e){throw cleanupError(area,'storage index unavailable')}
}
function clearMatchingStores(area,predicate){
 const targets=matchingKeys(predicate,area);
 for(const k of targets){try{localStorage.removeItem(k)}catch(e){throw cleanupError(area,`delete failed for ${k}`)}}
 const remaining=matchingKeys(predicate,area);
 if(remaining.length)throw cleanupError(area,`remaining key(s): ${remaining.slice(0,3).join(', ')}`);
 return Object.freeze({area,removed:targets.length,verified:true})
}
function clearAssessmentAnalyticsStores(){return clearMatchingStores('assessment analytics',k=>ASSESSMENT_ANALYTICS_PREFIXES.some(p=>k===p||k.startsWith(p+'::')))}
function clearLearningAnalyticsStores(){return clearMatchingStores('Learning Insights analytics',k=>k.startsWith(LEARNING_ANALYTICS_PREFIX))}
function clearAllAnalyticsStores(){
 const results={},errors=[];
 for(const [name,fn] of [['assessment',clearAssessmentAnalyticsStores],['learning',clearLearningAnalyticsStores]]){try{results[name]=fn()}catch(e){errors.push(e)}}
 if(errors.length){const e=cleanupError('analytics',errors.map(x=>x.message).join(' | '));e.causes=errors;throw e}
 return Object.freeze({assessment:results.assessment.removed,learning:results.learning.removed,total:results.assessment.removed+results.learning.removed,verified:true})
}
function clearTrainingExtrasStores(){return clearMatchingStores('training extras',k=>k===REVIEW_KEY||k===LEGACY_REVIEW||k===SIGN_KEY)}
function cancelActiveExam(){
 try{if(typeof activeExam!=='undefined')activeExam=null}catch(_){}
 try{window.activeExam=null}catch(_){}
}

function mirror(){try{if(typeof activeExam==='undefined'||!activeExam)return;(activeExam.questions||[]).forEach(q=>{if(!q||typeof q!=='object')return;if(q.why==null)q.why=q.explanation;if(q.source==null)q.source=q.reference;if(q.url==null)q.url=q.sourceUrl;if(q.feedback==null)q.feedback=q.optionFeedback});window.activeExam=activeExam}catch(e){console.warn('[MouldMaster] exam bridge:',e)}}
const baseStart=window.startExam;if(typeof baseStart==='function')window.startExam=function(){const r=baseStart.apply(this,arguments);mirror();setTimeout(mirror,0);return r};

const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), clamp=(n,a,b,d=0)=>Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d;
function cleanReview(v){const out={items:{}};if(!obj(v)||!obj(v.items))return out;for(const [id,x] of Object.entries(v.items).slice(0,1000)){if(!obj(x))continue;const sid=String(id).slice(0,220);if(!/^(tech|reg|legacy):/.test(sid))continue;out.items[sid]={id:sid,stage:Math.floor(clamp(x.stage,0,5)),due:clamp(x.due,0,4102444800000,Date.now()),wrong:Math.floor(clamp(x.wrong,0,100000)),right:Math.floor(clamp(x.right,0,100000)),last:clamp(x.last,0,4102444800000),confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'medium'}}return out}
function cleanSign(v){const o={checks:{},supervisor:'',date:'',notes:''};if(!obj(v))return o;if(obj(v.checks))for(const [k,b] of Object.entries(v.checks).slice(0,50))o.checks[String(k).slice(0,20)]=b===true;o.supervisor=String(v.supervisor||'').slice(0,160);o.date=String(v.date||'').slice(0,20);o.notes=String(v.notes||'').slice(0,10000);return o}
function read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'');return obj(x)?x:d}catch(_){return d}}
function restoreSnapshot(before){let failed=false;for(const [k,v] of Object.entries(before)){try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(_){failed=true}}return !failed}
function cleanupFailureMessage(action,rolledBack=true){return `${action} was not completed because local analytics/training cleanup could not be fully verified.${rolledBack?' Existing learner progress was kept.':''} Some old analytics may already have been removed. Clear this app/site data before handing the same browser profile to another learner if the warning persists.`}

window.exportData=function(){try{const p=JSON.parse(JSON.stringify(db));p.backupFormat='mouldmaster-backup-v2';p.trainingExtras={version:2,spacedReview:cleanReview(read(REVIEW_KEY,{items:{}})),practicalSignoff:cleanSign(read(SIGN_KEY,{}))};const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);window.toast?.('Backup exported with review and sign-off data')}catch(e){alert('Backup could not be created on this device.')}};

window.importData=function(file){
 if(!file)return;
 if(file.size>10*1024*1024){alert('That backup is too large to import safely. No existing data was changed.');return}
 const r=new FileReader();
 r.onload=()=>{
  let committed=false;
  try{
   const x=JSON.parse(r.result);
   if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string'||!x.users[x.activeUser])throw new Error('Invalid backup structure');
   if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');
   const users={};
   for(const [id,u] of Object.entries(x.users).slice(0,500)){
    const sid=canonicalLearnerId(id),clean=normaliseImportedUser(u,sid);
    if(users[sid])throw new Error('Invalid or duplicate learner identifier');
    if(u?.id!=null&&canonicalLearnerId(u.id)!==sid)throw new Error('Learner identifier mismatch');
    clean.id=sid;
    clean.certificates=[];clean.certificateMeta={};clean.examPassStatus={};
    users[sid]=clean;
   }
   const active=canonicalLearnerId(x.activeUser);
   if(!users[active])throw new Error('Missing active learner');
   const extras=obj(x.trainingExtras)?x.trainingExtras:{};
   const cleanR=cleanReview(extras.spacedReview||{items:{}}),cleanS=cleanSign(extras.practicalSignoff||{});
   const proposed={activeUser:active,users};
   const writes={mouldmasterProDB:JSON.stringify(proposed),[REVIEW_KEY]:JSON.stringify(cleanR),[SIGN_KEY]:JSON.stringify(cleanS)};
   const keys=[...Object.keys(writes),LEGACY_REVIEW],before={};
   keys.forEach(k=>before[k]=localStorage.getItem(k));
   try{
    for(const [k,v] of Object.entries(writes))localStorage.setItem(k,v);
    localStorage.removeItem(LEGACY_REVIEW);
    clearAllAnalyticsStores();
   }catch(storageError){
    const rolledBack=restoreSnapshot(before);
    if(storageError?.code===ANALYTICS_CLEANUP_CODE){storageError.importRollbackVerified=rolledBack;throw storageError}
    throw storageError;
   }
   db=proposed;user=db.users[db.activeUser];committed=true;cancelActiveExam();
   try{updateGlobalProgress();switchView('profile')}catch(uiError){console.warn('[MouldMaster] imported data saved; view refresh failed:',uiError)}
   window.toast?.('Progress imported. Certificates must be re-earned; local assessment and Learning Insights analytics were reset and verified.');
  }catch(e){
   if(e?.code===ANALYTICS_CLEANUP_CODE){alert(cleanupFailureMessage('Import',e.importRollbackVerified!==false));return}
   if(committed)alert('Progress was imported, but the screen could not refresh. Reopen MouldMaster.');
   else alert('That file is not a valid MouldMaster backup. No existing data was changed.');
  }
 };
 r.readAsText(file);
};

function labelLearnerReset(){if(typeof document==='undefined')return;document.querySelectorAll?.('[data-mm-onclick="resetData()"]').forEach?.(button=>{if(String(button.textContent||'').trim()==='Reset all local data')button.textContent='Reset learner data'})}
const baseRenderProfile=window.renderProfile;if(typeof baseRenderProfile==='function')window.renderProfile=function(){const result=baseRenderProfile.apply(this,arguments);labelLearnerReset();return result};
const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){
 if(!confirm('Reset local MouldMaster learner profiles, progress, analytics and training extras? Saved process-data evidence is managed separately in Process Data.'))return;
 try{clearAllAnalyticsStores();clearTrainingExtrasStores()}
 catch(e){console.error('[MouldMaster] factory reset cleanup blocked:',e);alert(cleanupFailureMessage('Factory reset',false));return}
 const proposedReset=JSON.parse(JSON.stringify(defaultDB));
 const resetUser=proposedReset.users[proposedReset.activeUser];if(resetUser)resetUser.lastSeen=new Date().toISOString();
 try{localStorage.setItem('mouldmasterProDB',JSON.stringify(proposedReset))}catch(e){alert('Factory reset could not save the clean learner state. Analytics were cleared, but existing progress was not replaced. Reopen MouldMaster and try again.');return}
 const beforeDb=db;db=proposedReset;user=db.users[db.activeUser];if(db!==beforeDb)cancelActiveExam();
 try{updateGlobalProgress();renderProfile()}catch(uiError){console.warn('[MouldMaster] reset saved; view refresh failed:',uiError)}
 window.toast?.('Learner data reset. Local assessment and Learning Insights analytics were cleared and verified. Saved process-data evidence was not deleted.');
 labelLearnerReset();
};
labelLearnerReset();

try{if(!localStorage.getItem(REVIEW_KEY)&&localStorage.getItem(LEGACY_REVIEW))localStorage.setItem(REVIEW_KEY,JSON.stringify({items:{}}))}catch(_){}
window.MM_TRAINING_DATA_BRIDGE={version:'2026.09.15.4',cleanupFailureCode:ANALYTICS_CLEANUP_CODE,canonicalLearnerId,clearAssessmentAnalyticsStores,clearLearningAnalyticsStores,clearAllAnalyticsStores,clearTrainingExtrasStores,cancelActiveExam};
})();
/* <<< training-qa-fix.js */
