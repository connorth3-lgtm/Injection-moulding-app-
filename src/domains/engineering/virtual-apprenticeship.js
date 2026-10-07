/* MouldMaster Virtual Apprenticeship — evidence-first simulator practice 2026.10.08.2 */
(function(){
'use strict';
if(window.MM_VIRTUAL_APPRENTICESHIP)return;
const VERSION='2026.10.08.2';
const STORAGE_KEY='mm_virtual_apprenticeship_v1';
const LEVELS=Object.freeze({
  beginner:{label:'Beginner · guided',feedback:'immediate'},
  developing:{label:'Developing · partial guidance',feedback:'stage'},
  advanced:{label:'Advanced · evidence first',feedback:'final'}
});
const CASES=Object.freeze([
  {
    id:'VA-01',title:'Fill time drifts with the recipe unchanged',difficulty:'Beginner',focus:'Separate observed process change from a guessed cause.',
    brief:'A stable moulding cell begins filling more slowly even though the recorded recipe has not changed. The task is to decide what evidence would discriminate between material, delivery and tooling explanations before changing several controls.',
    baseline:'Known-good run established on the same machine, mould and material family. No authorised process change has been recorded.',
    observations:[
      ['Fill time','longer than the validated baseline'],['Transfer pressure','higher'],['Cushion','shifted from the known-good pattern'],['Part mass','slightly lower'],['Recorded setpoints','unchanged']
    ],
    model:{fillAgg:42,transfer:48,pack:50,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:75,moistureConfidence:70},
    hypothesis:{
      prompt:'Which working hypothesis is most defensible first?',
      options:[
        ['h1','The process evidence shows increased resistance or reduced delivered flow; material state, restriction and shot-delivery behaviour remain competing explanations.',true,'Good. This stays at mechanism level and keeps competing causes open.'],
        ['h2','The barrel temperature must be too low because fill time increased.',false,'Too specific. A slower fill does not by itself identify barrel temperature as the cause.'],
        ['h3','Increase injection pressure immediately until fill time returns to normal.',false,'That is a response, not a diagnosis, and it risks masking the underlying change.']
      ]
    },
    test:{
      prompt:'What is the best next evidence?',
      options:[
        ['t1','Compare actual shot-delivery/transfer behaviour, material-state evidence and any available cavity-pressure trace against the known-good run.',true,'Good. These observations can separate delivery, material and flow-path explanations.'],
        ['t2','Raise melt temperature and see whether the part fills.',false,'A production setting change is not the first discriminating measurement.'],
        ['t3','Inspect only the final part and ignore process traces.',false,'Part evidence matters, but ignoring process evidence throws away information needed to discriminate causes.']
      ]
    },
    response:{
      prompt:'If the evidence identifies one cause, what response style is best?',
      options:[
        ['r1','Use one authorised, cause-linked correction or controlled test, record it, and leave unrelated variables unchanged.',true,'Good. One controlled response preserves the evidence chain.'],
        ['r2','Change speed, pressure, temperature and hold together to recover the part quickly.',false,'Multiple simultaneous changes destroy diagnostic resolution.'],
        ['r3','Save the new compensation as the standard recipe without checking the physical cause.',false,'Compensation is not proof of root-cause recovery.']
      ]
    },
    verify:{
      prompt:'What would count as meaningful verification?',
      options:[
        ['v1','Confirm the relevant process signals and quality outcome return toward the known-good pattern across a repeat window, not a single acceptable part.',true,'Good. Verification needs repeat behaviour and the expected evidence response.'],
        ['v2','One visually acceptable part is enough.',false,'A single part is weak evidence for durable recovery.'],
        ['v3','The alarm disappeared, so no further evidence is needed.',false,'Alarm state alone does not establish process or quality recovery.']
      ]
    }
  },
  {
    id:'VA-02',title:'One cavity becomes light',difficulty:'Beginner',focus:'Use cavity identity instead of treating the mould as one average process.',
    brief:'A four-cavity tool has been stable. One cavity begins producing lighter parts while the other three remain close to baseline.',
    baseline:'All four cavities previously tracked together within the site-approved inspection method.',
    observations:[['Cavity 1-3 mass','near baseline'],['Cavity 4 mass','lower'],['Overall machine cycle','stable'],['Material lot','unchanged'],['Defect location','cavity-specific']],
    model:{fillAgg:50,transfer:47,pack:47,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:68,moistureConfidence:85},
    hypothesis:{prompt:'Which interpretation best fits the evidence?',options:[
      ['h1','Prioritise cavity-specific flow, gate, vent, hot-runner or local thermal evidence before changing the whole-machine recipe.',true,'Good. The evidence is localised to one cavity.'],
      ['h2','The whole machine is under-packing all cavities equally.',false,'That conflicts with the three cavities remaining near baseline.'],
      ['h3','The material supplier is certainly responsible.',false,'The current pattern is cavity-specific, so a global material claim is not supported.']
    ]},
    test:{prompt:'What is the strongest next comparison?',options:[
      ['t1','Compare cavity-resolved mass/pressure/temperature evidence and inspect the local gate, vent and hot-runner path for cavity 4.',true,'Good. Preserve cavity identity and compare the local path with peer cavities.'],
      ['t2','Average the four cavity masses into one number.',false,'Averaging can hide the very imbalance you need to diagnose.'],
      ['t3','Increase hold pressure for every cavity immediately.',false,'A global compensation can disturb good cavities and does not explain the local change.']
    ]},
    response:{prompt:'What response protects learning value?',options:[
      ['r1','Correct or test the identified local mechanism under authorised conditions, then compare cavity 4 with its own baseline and peer cavities.',true,'Good. Local cause, local response, local verification.'],
      ['r2','Compensate globally until cavity 4 is heavy enough.',false,'This can over-pack other cavities and conceal the imbalance.'],
      ['r3','Remove cavity 4 from inspection so the average looks stable.',false,'Deleting inconvenient evidence is not process recovery.']
    ]},
    verify:{prompt:'What verification is strongest?',options:[
      ['v1','Cavity 4 returns toward its prior mass/process signature while cavities 1-3 remain stable over a repeat window.',true,'Good. Recovery should be both local and non-damaging to the other cavities.'],
      ['v2','The overall four-cavity average improves.',false,'An average can improve while one cavity remains abnormal.'],
      ['v3','The next shot looks acceptable.',false,'One shot is insufficient for stable cavity-balance verification.']
    ]}
  },
  {
    id:'VA-03',title:'Dimension shifts after water-line work',difficulty:'Developing',focus:'Connect intervention timing to thermal evidence before tuning unrelated controls.',
    brief:'A dimensional feature shifts after cooling-circuit maintenance. The process recipe is unchanged and visual appearance remains acceptable.',
    baseline:'Stable dimensional and cycle history existed before the water-line intervention.',
    observations:[['Intervention','cooling circuit serviced'],['Dimension','shifted after restart'],['Cycle time','similar'],['Visual defect','none obvious'],['Recipe','unchanged']],
    model:{fillAgg:50,transfer:50,pack:50,hold:50,meltOffset:0,mouldOffset:8,cooling:46,clampMargin:25,vent:75,moistureConfidence:85},
    hypothesis:{prompt:'What is the best first mechanism frame?',options:[
      ['h1','A changed mould thermal condition is plausible; verify coolant flow/temperature and mould-surface balance before treating the dimension shift as a packing problem.',true,'Good. Intervention timing makes the thermal path a strong testable lead without proving it.'],
      ['h2','Increase hold pressure because dimensions changed.',false,'Dimension change alone does not identify pack pressure as the cause.'],
      ['h3','Assume the gauge is wrong and ignore the cooling intervention.',false,'Gauge integrity should be checked, but the intervention timing is relevant evidence, not noise.']
    ]},
    test:{prompt:'Which evidence would discriminate best?',options:[
      ['t1','Compare coolant supply/return/flow evidence, mould-surface temperature distribution and gauge verification against the pre-maintenance baseline.',true,'Good. This tests both the thermal hypothesis and the measurement system.'],
      ['t2','Change cooling time until the dimension is acceptable.',false,'That is compensation before establishing whether cooling delivery actually changed.'],
      ['t3','Measure only one part at room temperature.',false,'One part cannot separate thermal drift, measurement variation and normal process variation.']
    ]},
    response:{prompt:'What controlled response is appropriate?',options:[
      ['r1','Restore the verified cooling-circuit condition or correct the identified measurement issue, then keep unrelated process controls fixed.',true,'Good. Address the evidence-backed change first.'],
      ['r2','Change cooling time, hold pressure and mould-temperature setpoint together.',false,'Multiple changes make it hard to know what recovered the dimension.'],
      ['r3','Create a new nominal dimension in the inspection system.',false,'Changing the target is not process recovery.']
    ]},
    verify:{prompt:'How should recovery be verified?',options:[
      ['v1','Confirm the thermal/measurement evidence and the dimension return toward baseline over a meaningful repeat run.',true,'Good. Verify both the mechanism evidence and the quality outcome.'],
      ['v2','Dimension is in spec once, so the mechanism is proven.',false,'Conformance on one reading does not establish cause or stability.'],
      ['v3','Cooling flow is present, therefore all thermal behaviour is normal.',false,'Flow presence alone does not establish balanced temperature or heat transfer.']
    ]}
  },
  {
    id:'VA-04',title:'Sink changes with hold-time study',difficulty:'Developing',focus:'Distinguish gate-seal evidence from unlimited hold-time adjustment.',
    brief:'A learner is asked to investigate sink on a thick feature. The goal is to decide what a hold-time study can and cannot prove.',
    baseline:'Material, mould and process are kept otherwise stable for a controlled educational study.',
    observations:[['Part mass','rises with early hold-time increases'],['Part mass plateau','appears later in the study'],['Sink','improves initially'],['Cycle cost','rises with added hold time'],['Gate-seal state','not yet independently confirmed']],
    model:{fillAgg:50,transfer:50,pack:54,hold:62,meltOffset:0,mouldOffset:0,cooling:52,clampMargin:25,vent:75,moistureConfidence:85},
    hypothesis:{prompt:'What is the strongest interpretation?',options:[
      ['h1','The mass plateau is useful gate-seal evidence under this study context, but it does not prove universal optimum hold time or eliminate geometry/cooling causes of sink.',true,'Good. This keeps the study bounded to what it measured.'],
      ['h2','The longest hold time is always the best production setting.',false,'A study plateau does not create a universal recipe.'],
      ['h3','Any remaining sink proves the material is defective.',false,'Sink has multiple possible mechanisms and geometry/thermal context matters.']
    ]},
    test:{prompt:'What should the learner check next?',options:[
      ['t1','Confirm repeatable mass plateau behaviour and inspect local section thickness, gate path and cooling evidence.',true,'Good. Gate-seal evidence and local part/tool context should be considered together.'],
      ['t2','Keep extending hold time indefinitely.',false,'Beyond gate seal, additional hold time may add cycle cost without useful packing effect.'],
      ['t3','Ignore part mass because only appearance matters.',false,'Part mass is useful evidence in a controlled gate-seal study.']
    ]},
    response:{prompt:'What response reflects good engineering reasoning?',options:[
      ['r1','Use the study to bound effective hold duration, then investigate remaining local sink through geometry, packing path and cooling evidence.',true,'Good. Use the study result as one piece of the evidence chain.'],
      ['r2','Raise hold pressure and hold time together until sink disappears.',false,'Changing two variables together weakens the learning value and may create other problems.'],
      ['r3','Declare the study complete as soon as one part looks better.',false,'A controlled study needs repeat evidence, not one appearance judgment.']
    ]},
    verify:{prompt:'What verification is appropriate?',options:[
      ['v1','Repeat the study point around the plateau and verify both mass behaviour and the quality feature over multiple shots.',true,'Good. Repeatability supports the bounded study conclusion.'],
      ['v2','The last part in the series is the heaviest, so it must be best.',false,'Heaviest does not automatically mean best or necessary.'],
      ['v3','Cycle time increased, therefore packing improved.',false,'Longer cycle time is not proof of effective packing.']
    ]}
  },
  {
    id:'VA-05',title:'Burn mark appears near end of fill',difficulty:'Advanced',focus:'Use location and gas-flow evidence without turning a symptom into a guaranteed cause.',
    brief:'A burn-like mark appears near the end of fill on one region of the part. The learner must separate trapped-gas/venting evidence from thermal degradation and other mechanisms.',
    baseline:'The part previously ran without the mark under the same documented process family.',
    observations:[['Defect location','near end-of-fill region'],['Fill time','slightly shorter'],['Mould vent condition','not recently verified'],['Material history','no confirmed change'],['Mark repeatability','intermittent']],
    model:{fillAgg:58,transfer:52,pack:50,hold:50,meltOffset:1,mouldOffset:0,cooling:50,clampMargin:25,vent:38,moistureConfidence:85},
    hypothesis:{prompt:'Choose the most defensible hypothesis statement.',options:[
      ['h1','Trapped gas/vent restriction is a plausible mechanism because of location and fill behaviour, but material degradation and local thermal effects remain competing explanations until evidence separates them.',true,'Good. Location is useful evidence, not absolute proof.'],
      ['h2','A burn mark always means injection speed is too high.',false,'The symptom is not uniquely diagnostic.'],
      ['h3','Material degradation is impossible because the material lot did not change.',false,'Thermal history can change without a lot change.']
    ]},
    test:{prompt:'What is the best next evidence?',options:[
      ['t1','Inspect/verify the local vent path and compare defect location with end-of-fill/cavity-pressure behaviour and material thermal-history evidence.',true,'Good. This tests the leading mechanism while retaining alternatives.'],
      ['t2','Reduce speed until the mark disappears and stop investigating.',false,'Symptom suppression can occur without establishing root cause.'],
      ['t3','Increase clamp force because the mark is near the parting line.',false,'Clamp force is not the first discriminating evidence for a burn-like mark.']
    ]},
    response:{prompt:'If the vent path is found restricted, what response is best?',options:[
      ['r1','Restore the authorised vent condition, keep unrelated settings stable, and document the intervention.',true,'Good. Cause-linked correction preserves the diagnostic chain.'],
      ['r2','Reduce fill speed permanently without servicing the restriction.',false,'That may compensate for the symptom while leaving the physical restriction.'],
      ['r3','Open the mould manually while running to inspect gas escape.',false,'Unsafe. Never bypass guarding or hazardous-energy controls for a learning exercise.']
    ]},
    verify:{prompt:'What verifies the conclusion?',options:[
      ['v1','The defect and relevant pressure/fill evidence recover after the vent correction over a repeat run, with no new adverse quality signal.',true,'Good. Mechanism-linked evidence and quality should recover together.'],
      ['v2','The first part after cleaning has no mark.',false,'One part is weak evidence for durable recovery.'],
      ['v3','The operator says it looks better.',false,'Operator observation matters, but repeat measured/inspection evidence is still needed.']
    ]}
  },
  {
    id:'VA-06',title:'Pressure signal disagrees with the machine summary',difficulty:'Advanced',focus:'Treat signal semantics and sensor integrity as engineering evidence, not housekeeping.',
    brief:'A cavity-pressure trace suggests a major process shift, but the machine summary and part mass remain close to baseline. The learner must decide whether to diagnose the process or first diagnose the measurement.',
    baseline:'Cavity-pressure and machine-summary signals previously moved coherently during known process changes.',
    observations:[['Cavity-pressure trace','large apparent shift'],['Machine summary','near baseline'],['Part mass','near baseline'],['Recent sensor work','yes'],['Sensor zero/calibration record','not yet checked']],
    model:{fillAgg:50,transfer:50,pack:50,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:75,moistureConfidence:85},
    hypothesis:{prompt:'What is the best first hypothesis?',options:[
      ['h1','Measurement integrity or signal semantics may have changed; verify sensor zero/calibration/channel mapping before treating the pressure shift as a physical process change.',true,'Good. Contradictory evidence makes measurement integrity a first-class hypothesis.'],
      ['h2','The process definitely changed because cavity pressure is the most important signal.',false,'No single signal is automatically authoritative when the evidence conflicts.'],
      ['h3','Ignore the cavity sensor permanently because the machine summary is stable.',false,'The sensor may be valuable once its integrity and semantics are verified.']
    ]},
    test:{prompt:'What is the most discriminating next test?',options:[
      ['t1','Check sensor identity, zero/calibration state, channel mapping, units and time alignment, then compare with an independent physical/quality signal.',true,'Good. Verify the measurement chain before using it as process evidence.'],
      ['t2','Change the process until the cavity trace returns to its old shape.',false,'Changing production to fit an unverified signal is backwards.'],
      ['t3','Delete the conflicting channel from the dataset.',false,'Removing contradictory evidence hides uncertainty rather than resolving it.']
    ]},
    response:{prompt:'If a channel mapping error is confirmed, what next?',options:[
      ['r1','Correct the authorised measurement mapping, document the change, and re-establish the baseline before interpreting later traces.',true,'Good. A changed measurement system invalidates direct comparison with the old baseline.'],
      ['r2','Keep the old baseline because the process recipe did not change.',false,'Measurement-system changes can invalidate historical comparisons even if the recipe is unchanged.'],
      ['r3','Average the incorrect and correct channels together.',false,'Averaging does not repair semantic or calibration errors.']
    ]},
    verify:{prompt:'What verifies measurement recovery?',options:[
      ['v1','The corrected channel behaves coherently with known events/independent evidence and a new traceable baseline is recorded.',true,'Good. Re-establish confidence before making process claims.'],
      ['v2','The graph looks smoother.',false,'Visual smoothness is not calibration or semantic verification.'],
      ['v3','The old alarm threshold no longer triggers.',false,'Alarm behaviour alone does not validate the measurement chain.']
    ]}
  }
]);
const STEP_KEYS=Object.freeze(['hypothesis','test','response','verify']);
const state={caseIndex:0,level:'beginner',answers:{},checked:false};
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function byId(id){return document.getElementById(id)}
function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el}
function scopedStorage(){return window.MM_RUNTIME_V2?.storage||null}
function loadProgress(){const row=scopedStorage()?.get(STORAGE_KEY,{schema:1,completed:{},attempts:0});return row&&typeof row==='object'?row:{schema:1,completed:{},attempts:0}}
function saveProgress(progress){return scopedStorage()?.set(STORAGE_KEY,progress)===true}
function scoreReasoning(caseDef,answers){
  const dimensions={};let total=0;
  for(const key of STEP_KEYS){
    const selected=String(answers?.[key]||'');
    const option=caseDef?.[key]?.options?.find(row=>row[0]===selected)||null;
    const correct=Boolean(option?.[2]);dimensions[key]={selected,correct,feedback:option?.[3]||'No answer selected.'};if(correct)total++;
  }
  return {total,max:STEP_KEYS.length,pct:Math.round(total/STEP_KEYS.length*100),dimensions};
}
function levelPolicy(){return LEVELS[state.level]||LEVELS.beginner}
function caseDef(){return CASES[state.caseIndex]||CASES[0]}
function applyCaseToSimulator(caseRow=caseDef()){
  if(!window.simulatorState||typeof window.updateSimulator!=='function')return false;
  Object.assign(window.simulatorState,caseRow.model||{});
  for(const [key,value] of Object.entries(caseRow.model||{})){
    const range=document.querySelector(`#simulator input[type="range"][data-mm-oninput*="simChange('${key}'"],#simulator input[type="range"][oninput*="simChange('${key}'"]`);
    if(range)range.value=String(value);
    const out=byId(`sim_${key}`);if(out&&typeof window.safeSimLabel==='function')out.value=window.safeSimLabel(key,value);
  }
  window.updateSimulator();
  const msg=byId('mmVaBridgeStatus');if(msg)msg.textContent='Case directions loaded into the relative training model. These are authored educational states, not a physics prediction or production recipe.';
  return true;
}
function progressSummary(){
  const p=loadProgress(),done=Object.keys(p.completed||{}).length,best=Math.max(0,...Object.values(p.completed||{}).map(x=>Number(x?.best||0)));
  return `${done}/${CASES.length} cases completed · best reasoning score ${best}/${STEP_KEYS.length}`;
}
function radioGroup(step,row){
  const wrap=make('fieldset','content-block');wrap.dataset.mmVaStep=step;
  const legend=make('legend','',row.prompt);wrap.appendChild(legend);
  const list=make('div','form-grid');
  for(const [id,label] of row.options){
    const option=make('label','choice');
    const input=document.createElement('input');input.type='radio';input.name=`mm-va-${step}`;input.value=id;input.checked=state.answers[step]===id;
    const span=make('span','',label);option.append(input,span);list.appendChild(option);
    input.addEventListener('change',()=>{state.answers[step]=id;state.checked=false;renderFeedback(step);updateCheckButton()});
  }
  wrap.appendChild(list);
  const feedback=make('div','tiny muted');feedback.id=`mmVaFeedback-${step}`;feedback.setAttribute('aria-live','polite');wrap.appendChild(feedback);
  return wrap;
}
function renderFeedback(step){
  const el=byId(`mmVaFeedback-${step}`);if(!el)return;
  const policy=levelPolicy(),row=caseDef()[step],selected=state.answers[step];
  const option=row.options.find(x=>x[0]===selected);
  if(!option){el.textContent='';return}
  if(policy.feedback==='immediate')el.textContent=option[3];
  else if(policy.feedback==='stage')el.textContent=option[2]?'Reasoning step recorded. This choice is evidence-consistent.':'Reasoning step recorded. Re-check whether this choice separates evidence from action.';
  else el.textContent='Choice recorded. Advanced mode withholds coaching until final review.';
}
function updateCheckButton(){const b=byId('mmVaCheck');if(b)b.disabled=!STEP_KEYS.every(key=>state.answers[key])}
function renderResult(){
  const box=byId('mmVaResult');if(!box)return;
  if(!state.checked){box.replaceChildren();return}
  const row=caseDef(),result=scoreReasoning(row,state.answers),heading=make('h3','',`Reasoning quality: ${result.total}/${result.max}`);
  const summary=make('p','',result.total===4?'Strong evidence chain: observation → mechanism → discriminating test → controlled response → verification.':result.total>=3?'Good chain with one area to strengthen before treating the conclusion as robust.':result.total>=2?'Partial chain. Slow down and separate diagnosis, action and verification.':'The current choices jump too quickly from symptom to action. Rebuild the evidence chain before changing the process.');
  box.replaceChildren(heading,summary);
  const ul=document.createElement('ul');
  for(const key of STEP_KEYS){const d=result.dimensions[key],li=make('li','',`${key==='test'?'Next evidence':key[0].toUpperCase()+key.slice(1)}: ${d.correct?'✓':'Review'} — ${d.feedback}`);ul.appendChild(li)}
  box.appendChild(ul);
  const boundary=make('p','tiny muted','Training result only. A high score does not authorise a real machine, mould, material, maintenance, safeguarding or production change.');box.appendChild(boundary);
  const progress=loadProgress();progress.attempts=Number(progress.attempts||0)+1;progress.completed=progress.completed||{};const old=progress.completed[row.id]||{};progress.completed[row.id]={best:Math.max(Number(old.best||0),result.total),last:result.total,level:state.level,updated:new Date().toISOString()};saveProgress(progress);
  const p=byId('mmVaProgress');if(p)p.textContent=progressSummary();
  for(const key of STEP_KEYS){const el=byId(`mmVaFeedback-${key}`);if(el)el.textContent=result.dimensions[key].feedback}
}
function resetCase(){state.answers={};state.checked=false;renderCase()}
function renderCase(){
  const host=byId('mmVirtualApprenticeship');if(!host)return;
  const row=caseDef();host.replaceChildren();
  const head=make('div','section-head');const hcopy=make('div');hcopy.append(make('span','eyebrow','Virtual apprenticeship'),make('h2','',row.title),make('p','muted',row.focus));const pill=make('span','pill',`${row.id} · ${row.difficulty}`);head.append(hcopy,pill);host.appendChild(head);
  const controls=make('div','grid2');
  const caseLabel=make('label','', 'Case');const caseSelect=document.createElement('select');caseSelect.id='mmVaCaseSelect';CASES.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=`${c.id} · ${c.title}`;o.selected=i===state.caseIndex;caseSelect.appendChild(o)});caseLabel.appendChild(caseSelect);
  const levelLabel=make('label','', 'Coaching level');const levelSelect=document.createElement('select');for(const [id,v] of Object.entries(LEVELS)){const o=document.createElement('option');o.value=id;o.textContent=v.label;o.selected=id===state.level;levelSelect.appendChild(o)}levelLabel.appendChild(levelSelect);controls.append(caseLabel,levelLabel);host.appendChild(controls);
  caseSelect.addEventListener('change',()=>{state.caseIndex=Number(caseSelect.value)||0;state.answers={};state.checked=false;renderCase()});
  levelSelect.addEventListener('change',()=>{state.level=levelSelect.value in LEVELS?levelSelect.value:'beginner';state.checked=false;renderCase()});
  const brief=make('div','callout');brief.append(make('b','', 'Shop-floor brief'),document.createElement('br'),document.createTextNode(row.brief));host.appendChild(brief);
  const evidence=make('div','content-block');evidence.append(make('h3','', 'Evidence board'),make('p','tiny muted',`Baseline: ${row.baseline}`));const table=make('div','table-wrap');const t=document.createElement('table');t.className='table';t.innerHTML='<thead><tr><th>Signal / context</th><th>Observed change</th></tr></thead>';const body=document.createElement('tbody');for(const [name,value] of row.observations){const tr=document.createElement('tr');const a=document.createElement('td');a.textContent=name;const b=document.createElement('td');b.textContent=value;tr.append(a,b);body.appendChild(tr)}t.appendChild(body);table.appendChild(t);evidence.appendChild(table);host.appendChild(evidence);
  const bridge=make('div','hero-buttons');const load=make('button','secondary','Load case directions into process simulator');load.type='button';load.addEventListener('click',()=>applyCaseToSimulator(row));const status=make('span','tiny muted','Authored case evidence is separate from physical prediction.');status.id='mmVaBridgeStatus';bridge.append(load,status);host.appendChild(bridge);
  const investigation=make('div','content-block');investigation.append(make('h3','', 'Your investigation'),make('p','muted','Commit to a mechanism, choose the most discriminating next evidence, select one controlled response, then define verification.'));
  for(const key of STEP_KEYS)investigation.appendChild(radioGroup(key,row[key]));host.appendChild(investigation);
  const actions=make('div','hero-buttons');const check=make('button','primary','Review my reasoning');check.type='button';check.id='mmVaCheck';check.disabled=!STEP_KEYS.every(key=>state.answers[key]);check.addEventListener('click',()=>{state.checked=true;renderResult()});const again=make('button','ghost','Reset this case');again.type='button';again.addEventListener('click',resetCase);actions.append(check,again);host.appendChild(actions);
  const result=make('div','content-block');result.id='mmVaResult';result.setAttribute('aria-live','polite');host.appendChild(result);
  const progress=make('p','tiny muted',progressSummary());progress.id='mmVaProgress';host.appendChild(progress);
  host.appendChild(make('p','legal-note','Safety boundary: this virtual apprenticeship teaches evidence-led reasoning. It does not simulate validated machine physics, prescribe production settings, bypass safeguards, or authorise machine/mould/material/maintenance/production changes.'));
  for(const key of STEP_KEYS)renderFeedback(key);renderResult();updateCheckButton();
}
function install(){
  const root=byId('simulator');if(!root||byId('mmVirtualApprenticeship'))return false;
  const host=make('section','card form-card');host.id='mmVirtualApprenticeship';
  const output=root.querySelector('.output-panel');if(output)root.insertBefore(host,output);else root.appendChild(host);
  renderCase();return true;
}
function installWhenReady(){if(install())return;let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer)},250)}
const api=Object.freeze({version:VERSION,cases:CASES,levels:LEVELS,scoreReasoning,applyCaseToSimulator,install,resetCase,storageKey:STORAGE_KEY,boundary:'Authored learning cases and reasoning coaching only; no machine-control, production-setting or predictive-physics authority.'});
window.MM_VIRTUAL_APPRENTICESHIP=api;
try{window.MM_RUNTIME_V2?.registerModule?.('virtual-apprenticeship',{version:VERSION,type:'simulator-learning',scope:'authored-evidence-first-cases',authority:'training-only'})}catch(_){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installWhenReady,{once:true});else installWhenReady();
window.addEventListener?.('mm:domains-ready',installWhenReady,{once:true});
})();
