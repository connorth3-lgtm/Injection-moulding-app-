/* MouldMaster Diagnostic Learning Labs — education-first practice module */
(function(){
'use strict';

const VERSION='2026.08.25.1';
const STORAGE_BASE='mm_diagnostic_labs_v1';

const LABS=[
  {
    id:'cavity-short-shot',
    title:'One cavity is short',
    level:'Intermediate',
    focus:'Local vs global evidence',
    summary:'An 8-cavity PA66-GF30 mould runs with stable overall fill time and pressure, but cavity 8 is repeatedly short.',
    evidence:[
      'Cavities 1–7 fill normally.',
      'Cavity 8 is consistently short at the same end-of-fill area.',
      'Overall fill time and peak pressure are stable.',
      'Material condition checks are within the approved requirement.'
    ],
    related:['Short shot','Cavity-to-cavity imbalance','Reject pattern by cavity/time','Gate','Vent'],
    steps:[
      {stage:'Observe',question:'What does the evidence point to first?',choices:[
        {text:'A local cavity, gate, runner or vent condition',correct:true,feedback:'Correct. A repeatable one-cavity defect with stable global process signals strongly favours a local flow-path or tooling cause.'},
        {text:'A global barrel-temperature problem',feedback:'A global thermal problem would normally be expected to influence more than one cavity. The cavity pattern is stronger evidence.'},
        {text:'Insufficient holding pressure',feedback:'Holding pressure acts after filling and does not explain why only one cavity repeatedly fails to complete fill.'},
        {text:'Low clamp force',feedback:'Clamp force is not the first explanation for a cavity-specific short shot.'}
      ]},
      {stage:'Best next test',question:'Which check gives the most diagnostic information next?',choices:[
        {text:'Inspect and compare cavity 8 gate/runner/vent condition with the other cavities',correct:true,feedback:'Correct. Compare the local flow path before changing a stable global process.'},
        {text:'Raise every barrel zone',feedback:'That changes the entire process before the local evidence has been investigated.'},
        {text:'Increase hold time',feedback:'Hold-time changes cannot restore material that never reached the end of the cavity during fill.'},
        {text:'Increase clamp force',feedback:'That does not test the suspected restriction or venting mechanism.'}
      ]},
      {stage:'Controlled response',question:'If the local restriction is confirmed, what is the best learning principle?',choices:[
        {text:'Correct the local cause and then verify the process has returned to its validated state',correct:true,feedback:'Correct. Fix the mechanism rather than hiding it with unrelated global adjustments.'},
        {text:'Keep increasing injection pressure until cavity 8 fills',feedback:'This can mask a tooling problem and expose the other cavities or mould to unnecessary load.'},
        {text:'Change several settings together',feedback:'Multiple simultaneous changes destroy the evidence needed to learn which factor mattered.'},
        {text:'Ignore cavity identity and judge only total shot weight',feedback:'Pooled data can hide a weak cavity.'}
      ]},
      {stage:'Explain',question:'Why is cavity identity so useful?',choices:[
        {text:'It separates local tooling/flow-path problems from system-wide machine or material problems',correct:true,feedback:'Exactly. Patterns by cavity are often more diagnostic than an overall reject percentage.'},
        {text:'It proves the material is always good',feedback:'Cavity identity narrows the mechanism; it does not prove every other input is correct.'},
        {text:'It removes the need to measure process actuals',feedback:'Actual process data are still valuable for confirming that the global process remained stable.'},
        {text:'It tells you the exact setting to change',feedback:'It guides diagnosis, not a universal recipe.'}
      ]}
    ]
  },
  {
    id:'splay-moisture',
    title:'Silver streaks after a material change',
    level:'Intermediate',
    focus:'Material condition and evidence',
    summary:'Silver streaks appear after a new lot of moisture-sensitive resin is loaded. The dryer display looks normal.',
    evidence:[
      'The defect began soon after the material-lot change.',
      'Dryer set temperature and displayed dew point look normal.',
      'No confirmed resin moisture measurement has been taken.',
      'The defect appears as silver streaking rather than an incomplete fill.'
    ],
    related:['Splay / silver streaks','Material moisture actual','Dryer dew point / air condition','Material-lot change verification'],
    steps:[
      {stage:'Observe',question:'What is the most important uncertainty?',choices:[
        {text:'Whether the resin reaching the machine is actually within the grade-specific moisture requirement',correct:true,feedback:'Correct. Dryer displays are supporting evidence, not proof of resin moisture at the machine.'},
        {text:'Whether clamp force is high enough',feedback:'Clamp force is poorly connected to the observed streaking mechanism.'},
        {text:'Whether cooling time is too long',feedback:'Cooling time is not the strongest first explanation for silver streaking immediately after a material change.'},
        {text:'Whether ejector speed is too low',feedback:'Ejection does not explain the material-lot timing or streak pattern.'}
      ]},
      {stage:'Best next test',question:'Which test is strongest?',choices:[
        {text:'Measure material moisture with an approved method and verify the full drying/handling path',correct:true,feedback:'Correct. Verify the actual material condition, airflow/residence/handling and the exact supplier requirement.'},
        {text:'Assume the displayed dew point proves the resin is dry',feedback:'A good dew-point display alone does not prove dry resin is reaching the hopper outlet.'},
        {text:'Increase injection pressure',feedback:'That does not test the suspected volatile/moisture mechanism.'},
        {text:'Polish the mould',feedback:'Surface tooling should not be the first action when the timing points toward material condition.'}
      ]},
      {stage:'Controlled response',question:'If excessive moisture is confirmed, what is the correct principle?',choices:[
        {text:'Restore the supplier/site-approved material conditioning process, then verify resin condition before judging the moulding process',correct:true,feedback:'Correct. Use the exact grade requirement rather than a generic drying recipe.'},
        {text:'Use one drying recipe for every nylon grade',feedback:'Drying requirements are grade- and equipment-specific.'},
        {text:'Raise melt temperature to evaporate the moisture during injection',feedback:'Processing wet moisture-sensitive resin can cause degradation; temperature is not a safe substitute for correct conditioning.'},
        {text:'Hide the streaks by changing colour',feedback:'That does not correct the material mechanism.'}
      ]},
      {stage:'Explain',question:'What is the main lesson from the normal dryer display?',choices:[
        {text:'A setpoint or display is not the same as a verified process/material actual',correct:true,feedback:'Exactly. MouldMaster teaches setpoints, actuals and independent evidence as different things.'},
        {text:'Dryer instrumentation is never useful',feedback:'Dryer data are useful, but must be interpreted with airflow, residence, handling and moisture evidence.'},
        {text:'Material lots never affect moulding',feedback:'Lot changes can matter and should remain traceable.'},
        {text:'Splay always has one cause',feedback:'Splay can also come from contamination, volatiles, degradation or air entrainment.'}
      ]}
    ]
  },
  {
    id:'pressure-limited-fill',
    title:'The machine is not following the speed setting',
    level:'Advanced',
    focus:'Setpoint vs actual',
    summary:'A technician increases programmed injection velocity, but actual fill time hardly changes and the actual velocity trace remains below command.',
    evidence:[
      'Commanded velocity was increased.',
      'Actual velocity remains below the command during the same region of fill.',
      'Injection pressure is running near the machine/process limit.',
      'Fill time changes very little.'
    ],
    related:['Injection velocity actual','Peak injection pressure','Pressure-limited fill detection','Machine setpoints vs actuals'],
    steps:[
      {stage:'Observe',question:'What mechanism best fits?',choices:[
        {text:'The fill is pressure-limited, so the machine cannot achieve the commanded velocity',correct:true,feedback:'Correct. A higher velocity setpoint has little effect if available pressure/force is already limiting motion.'},
        {text:'The controller must be ignoring every setting',feedback:'The actual trace and pressure demand point to a physical/control limit rather than proof of a failed controller.'},
        {text:'Holding time is controlling fill velocity',feedback:'Holding occurs after the velocity-controlled filling phase.'},
        {text:'Clamp force sets injection velocity',feedback:'Clamp force restrains mould opening; it does not command screw velocity.'}
      ]},
      {stage:'Best next test',question:'What should be compared next?',choices:[
        {text:'Commanded vs actual velocity together with the pressure trace and the approved pressure limit',correct:true,feedback:'Correct. Those signals show whether the machine can physically follow the requested profile.'},
        {text:'Only the velocity setpoint screen',feedback:'The issue is specifically that setpoint and actual are different.'},
        {text:'Only total cycle time',feedback:'Total cycle time can stay similar while fill behaviour changes.'},
        {text:'Only clamp tonnage',feedback:'That does not test velocity-following capability.'}
      ]},
      {stage:'Controlled response',question:'What is the right diagnostic principle?',choices:[
        {text:'Find why pressure demand is high or why capability is limited before commanding more speed',correct:true,feedback:'Correct. Investigate material state, restriction, thermal condition, machine capability and the validated process envelope.'},
        {text:'Keep raising the velocity setpoint indefinitely',feedback:'A command above achievable capability does not create the intended actual velocity.'},
        {text:'Raise every machine limit',feedback:'Limits may protect machine, mould, material or process capability and must not be bypassed casually.'},
        {text:'Ignore the actual trace',feedback:'The actual trace is the key evidence in this scenario.'}
      ]},
      {stage:'Explain',question:'Why are actuals important for process transfer?',choices:[
        {text:'Different machines may interpret or achieve the same nominal setpoint differently, while actual process responses show what happened',correct:true,feedback:'Exactly. Transfer should be based on measurable process behaviour and machine capability, not copied screen numbers alone.'},
        {text:'Actuals eliminate the need for material data',feedback:'Material condition remains part of the process system.'},
        {text:'Actuals are only useful for electric machines',feedback:'Actual process measurements are valuable across machine types.'},
        {text:'Actuals make tooling irrelevant',feedback:'Tooling pressure loss and flow geometry remain critical.'}
      ]}
    ]
  },
  {
    id:'check-ring-repeatability',
    title:'Cushion and part mass are wandering',
    level:'Advanced',
    focus:'Shot-delivery repeatability',
    summary:'Cycle-to-cycle cushion, transfer position and part mass vary while programmed settings remain unchanged.',
    evidence:[
      'Cushion varies more than normal.',
      'Transfer position and part mass move with the variation.',
      'The programmed recipe has not changed.',
      'The variation repeats over consecutive cycles.'
    ],
    related:['Cushion','Transfer position','Part mass','Check-ring repeatability study','Non-return valve / check ring'],
    steps:[
      {stage:'Observe',question:'Which system deserves early investigation?',choices:[
        {text:'Shot delivery and non-return-valve/check-ring repeatability',correct:true,feedback:'Correct. Coupled movement in cushion, transfer and mass is useful evidence of unstable effective shot delivery.'},
        {text:'Mould texture',feedback:'Texture does not explain the coupled process-signal movement.'},
        {text:'Robot pick timing',feedback:'Robot timing may affect cycle handling but not this shot-delivery signature.'},
        {text:'Clamp opening speed',feedback:'Clamp opening occurs after the shot is formed.'}
      ]},
      {stage:'Best next test',question:'What is the best learning-oriented test?',choices:[
        {text:'Run a controlled repeatability study using transfer, cushion and a suitable response such as part mass',correct:true,feedback:'Correct. Demonstrate repeatability before compensating with unrelated settings.'},
        {text:'Increase shot size until the average part is heavier',feedback:'That can hide the instability rather than identify its cause.'},
        {text:'Change shot size and hold pressure together',feedback:'Changing multiple factors makes the mechanism harder to isolate.'},
        {text:'Judge one cycle only',feedback:'Repeatability problems require a sequence of cycles.'}
      ]},
      {stage:'Controlled response',question:'If a mechanical repeatability problem is confirmed, what should happen?',choices:[
        {text:'Address the machine/mechanical cause and re-establish the validated process rather than tuning around instability',correct:true,feedback:'Correct. Stable process development depends on stable shot delivery.'},
        {text:'Build a new recipe around the unstable condition',feedback:'A recipe cannot make an unstable mechanical system repeatable.'},
        {text:'Increase clamp force',feedback:'Clamp force is unrelated to check-ring sealing repeatability.'},
        {text:'Stop recording cushion',feedback:'Removing the signal removes useful evidence.'}
      ]},
      {stage:'Explain',question:'Why trend several signals together?',choices:[
        {text:'Correlated movement across independent responses strengthens or weakens a suspected mechanism',correct:true,feedback:'Exactly. Good troubleshooting uses converging evidence, not one isolated number.'},
        {text:'It guarantees a single root cause',feedback:'Correlated evidence improves diagnosis but does not guarantee one cause.'},
        {text:'It replaces physical inspection',feedback:'Process data and physical inspection complement each other.'},
        {text:'It lets you ignore time sequence',feedback:'Time sequence is often essential for understanding drift and intermittency.'}
      ]}
    ]
  },
  {
    id:'cooling-warpage',
    title:'Warpage grows after mould maintenance',
    level:'Intermediate',
    focus:'Thermal balance',
    summary:'A part begins warping after mould maintenance even though the machine recipe is unchanged.',
    evidence:[
      'Warpage increased immediately after mould maintenance.',
      'The programmed recipe is unchanged.',
      'One cooling circuit shows lower flow than its validated baseline.',
      'Mould-surface temperatures are less balanced than before.'
    ],
    related:['Warpage','Cooling-circuit flow','Cooling-circuit baseline','Mould-surface temperature'],
    steps:[
      {stage:'Observe',question:'What evidence is strongest?',choices:[
        {text:'The changed cooling-flow/thermal balance after maintenance',correct:true,feedback:'Correct. Timing plus a measured circuit-flow change gives a strong thermal mechanism.'},
        {text:'The unchanged injection-speed setpoint',feedback:'An unchanged setpoint is background information, not the strongest cause evidence.'},
        {text:'The part colour',feedback:'Colour alone does not explain the measured cooling imbalance.'},
        {text:'The operator shift',feedback:'There is stronger physical evidence tied directly to the maintenance event.'}
      ]},
      {stage:'Best next test',question:'What should be checked before process adjustment?',choices:[
        {text:'Circuit identity/connections, actual flow and supply/return plus relevant mould-surface temperatures',correct:true,feedback:'Correct. Verify that the cooling system returned to its validated configuration.'},
        {text:'Increase hold pressure immediately',feedback:'That changes packing without testing the measured thermal imbalance.'},
        {text:'Increase injection velocity',feedback:'That does not explain the post-maintenance circuit-flow change.'},
        {text:'Ignore circuit flow because temperatures look close',feedback:'Temperature alone can mask flow loss until local thermal balance shifts.'}
      ]},
      {stage:'Controlled response',question:'If a circuit is misconnected or restricted, what is the preferred response?',choices:[
        {text:'Restore the approved cooling circuit condition, then verify part temperature/dimensions and process stability',correct:true,feedback:'Correct. Restore the physical baseline before rewriting a previously stable recipe.'},
        {text:'Compensate permanently with packing changes',feedback:'That can hide the cooling fault and create new stresses.'},
        {text:'Lengthen cycle without investigating flow',feedback:'More time may mask symptoms but does not correct the changed circuit condition.'},
        {text:'Increase mould-close force',feedback:'Clamp closing force does not restore coolant flow.'}
      ]},
      {stage:'Explain',question:'Why is a cooling baseline valuable?',choices:[
        {text:'It turns post-maintenance flow and thermal changes into measurable evidence rather than guesswork',correct:true,feedback:'Exactly. Baselines make hidden connection, blockage and balance problems easier to isolate.'},
        {text:'It means mould temperature never changes',feedback:'Thermal systems still vary; a baseline gives a reference for meaningful comparison.'},
        {text:'It replaces dimensional inspection',feedback:'Dimensions remain an important quality response.'},
        {text:'It gives a universal coolant flow for every mould',feedback:'Cooling requirements are mould- and circuit-specific.'}
      ]}
    ]
  },
  {
    id:'gate-seal-study',
    title:'Does more hold time still help?',
    level:'Advanced',
    focus:'Scientific moulding study design',
    summary:'A learner wants to know whether extra hold time still changes the packed part after the gate has stopped transmitting useful pressure.',
    evidence:[
      'The process is otherwise stable.',
      'Part mass is measured with a consistent method.',
      'Hold time can be varied in controlled steps.',
      'The exact gate/material/process condition must be studied rather than assumed.'
    ],
    related:['Gate-seal study','Part mass','Process window study','Hold pressure actual'],
    steps:[
      {stage:'Observe',question:'What response is useful for a basic gate-seal study?',choices:[
        {text:'Part mass (and relevant dimensions/quality) across controlled hold-time steps',correct:true,feedback:'Correct. A plateau can show when additional hold time no longer produces a meaningful response for that condition.'},
        {text:'Only the programmed hold-time value',feedback:'The study needs a measured part/process response, not the input alone.'},
        {text:'Only total cycle time',feedback:'Cycle time does not demonstrate whether pressure was still transmitted through the gate.'},
        {text:'Only clamp force',feedback:'Clamp force is not the study response.'}
      ]},
      {stage:'Best next test',question:'How should the study be run?',choices:[
        {text:'Change hold time systematically while holding other important conditions stable and record the response',correct:true,feedback:'Correct. One controlled factor and a defined response make the evidence interpretable.'},
        {text:'Change hold time, pressure and cooling together',feedback:'That confounds the study and makes the result ambiguous.'},
        {text:'Use one shot at each condition with no repeatability check',feedback:'A single observation can be misleading when process or measurement variation is present.'},
        {text:'Copy another mould’s gate-seal time',feedback:'Gate-seal behaviour is specific to the gate, material, geometry and thermal condition.'}
      ]},
      {stage:'Controlled response',question:'What does a repeatable mass plateau mean?',choices:[
        {text:'Additional hold time is no longer producing a meaningful mass response under the studied condition',correct:true,feedback:'Correct. Confirm the relevant dimensions and quality requirements too.'},
        {text:'The same hold time is correct for every resin and mould',feedback:'The conclusion is specific to the studied process condition.'},
        {text:'Holding pressure can now be ignored',feedback:'Pressure magnitude and transmission still matter; the study only addresses the time response being tested.'},
        {text:'Cooling time should automatically equal hold time',feedback:'Those phases are governed by different mechanisms.'}
      ]},
      {stage:'Explain',question:'Why is this better than guessing?',choices:[
        {text:'It connects a deliberate input change to a measured response and establishes evidence for the process window',correct:true,feedback:'Exactly. This is the scientific-moulding mindset MouldMaster should teach.'},
        {text:'It guarantees the product is validated',feedback:'A gate-seal study is one piece of process-development evidence, not full validation.'},
        {text:'It removes the need for supplier information',feedback:'Material and supplier limits still matter.'},
        {text:'It proves longer hold time is always bad',feedback:'The study determines when additional time stops adding useful response; the result is condition-specific.'}
      ]}
    ]
  },
  {
    id:'measurement-noise',
    title:'The dimension moves — or does it?',
    level:'Advanced',
    focus:'Measurement system thinking',
    summary:'A critical dimension appears to drift, but repeated measurements of the same parts vary almost as much as the reported process change.',
    evidence:[
      'Different operators obtain noticeably different values on the same parts.',
      'Measurement timing after moulding is inconsistent.',
      'The apparent process shift is small compared with measurement spread.',
      'The moulding process signals themselves look stable.'
    ],
    related:['Measurement system analysis','Measurement-system study before process adjustment','Measurement conditioning-time control','Dimensional drift'],
    steps:[
      {stage:'Observe',question:'What should be questioned first?',choices:[
        {text:'Whether the measurement system is capable of resolving the process difference',correct:true,feedback:'Correct. Process capability and adjustment decisions are unreliable if measurement variation dominates.'},
        {text:'Whether injection pressure should be increased',feedback:'Changing the process before verifying the measurement risks tuning to noise.'},
        {text:'Whether the mould should be polished',feedback:'There is direct evidence of measurement inconsistency.'},
        {text:'Whether the robot is too fast',feedback:'Robot speed is not supported by the evidence given.'}
      ]},
      {stage:'Best next test',question:'What should be standardised and studied?',choices:[
        {text:'Measurement method, fixture, timing/conditioning, resolution and repeatability/reproducibility',correct:true,feedback:'Correct. Establish whether the measurement can support the intended decision.'},
        {text:'Only the machine setpoint screen',feedback:'The uncertainty is in the measurement evidence.'},
        {text:'Only the average of all readings',feedback:'Averages can hide a measurement system that is not repeatable or reproducible.'},
        {text:'Only the drawing tolerance',feedback:'Tolerance matters, but you still need a capable measurement method.'}
      ]},
      {stage:'Controlled response',question:'What is the safest process-learning principle?',choices:[
        {text:'Do not adjust a stable process to chase an unverified measurement signal',correct:true,feedback:'Correct. Verify the measurement first, then reassess the process evidence.'},
        {text:'Adjust after every single reading',feedback:'That can create process variation in response to measurement noise.'},
        {text:'Tighten the process limits until the data look better',feedback:'Limits do not improve the measurement system.'},
        {text:'Stop measuring the characteristic',feedback:'The goal is a trustworthy measurement, not removal of quality evidence.'}
      ]},
      {stage:'Explain',question:'Why can conditioning time matter for plastic parts?',choices:[
        {text:'Temperature, crystallisation and moisture conditioning can change dimensions after ejection, depending on the material',correct:true,feedback:'Exactly. Comparing parts in different physical states can create false drift.'},
        {text:'All plastics stop changing the instant they eject',feedback:'Many polymers continue thermal or moisture-related dimensional change after moulding.'},
        {text:'Conditioning only matters for metal',feedback:'Plastics can be strongly affected by temperature and moisture history.'},
        {text:'Conditioning time sets machine pressure',feedback:'It affects the measurement state, not the machine pressure setpoint.'}
      ]}
    ]
  },
  {
    id:'hot-runner-imbalance',
    title:'One hot-runner branch behaves differently',
    level:'Very Advanced',
    focus:'Thermal/flow evidence',
    summary:'Two cavities fed by one branch begin filling differently even though displayed hot-runner temperatures appear equal.',
    evidence:[
      'The imbalance is repeatable by branch/cavity.',
      'Displayed zone temperatures are close to setpoint.',
      'One controller zone shows unusually high output compared with its peer.',
      'The machine fill trace remains stable overall.'
    ],
    related:['Hot-runner zone actuals','Hot-runner branch balance check','Hot-runner manifold','Cavity-to-cavity pressure delta'],
    steps:[
      {stage:'Observe',question:'Why is equal displayed temperature not enough?',choices:[
        {text:'A sensor can read near setpoint while heater output, heat loss, local restriction or delivered melt condition differs',correct:true,feedback:'Correct. Temperature display is one signal; branch behaviour and controller output provide additional evidence.'},
        {text:'Hot runners never affect cavity balance',feedback:'Hot-runner branch condition can directly affect delivered heat and pressure loss.'},
        {text:'Every thermocouple is always wrong',feedback:'The lesson is to combine evidence, not distrust all sensors.'},
        {text:'Clamp force determines manifold temperature',feedback:'Clamp force is unrelated to manifold heater control.'}
      ]},
      {stage:'Best next test',question:'What should be compared?',choices:[
        {text:'Zone actuals and output, branch/gate response, cavity fill/pressure evidence and heater/thermocouple health',correct:true,feedback:'Correct. Compare the thermal control evidence with the local flow response.'},
        {text:'Only the setpoint values',feedback:'Setpoints are already equal and have not explained the observed imbalance.'},
        {text:'Only total shot weight',feedback:'Combined mass can hide cavity imbalance.'},
        {text:'Only cooling time',feedback:'The evidence points to the hot-runner branch during fill.'}
      ]},
      {stage:'Controlled response',question:'What should happen if a heater/thermocouple or branch fault is confirmed?',choices:[
        {text:'Correct the hardware/control fault using approved procedures, then verify branch balance before changing the validated recipe',correct:true,feedback:'Correct. Restore the physical system rather than tuning the whole process around a faulty branch.'},
        {text:'Keep raising the affected temperature setpoint',feedback:'Blindly raising setpoint can worsen thermal degradation and does not prove the fault mechanism.'},
        {text:'Raise all barrel zones to match',feedback:'That changes the global thermal state to compensate for a local hot-runner problem.'},
        {text:'Increase clamp force',feedback:'Clamp force cannot repair a heater or thermocouple issue.'}
      ]},
      {stage:'Explain',question:'What broader troubleshooting habit does this teach?',choices:[
        {text:'Use location, timing and multiple independent signals to distinguish local faults from global process changes',correct:true,feedback:'Exactly. Good diagnosis asks where the problem is, when it appears and which actuals changed.'},
        {text:'Always change the easiest setting first',feedback:'Ease of adjustment is not evidence of causality.'},
        {text:'Displayed values are never trustworthy',feedback:'Displayed values are useful when interpreted with other evidence and sensor limitations.'},
        {text:'Every defect needs a new recipe',feedback:'Many defects come from material, tooling, maintenance or equipment conditions that should be corrected directly.'}
      ]}
    ]
  },
  {
    id:'local-flash',
    title:'Flash only at one shutoff',
    level:'Intermediate',
    focus:'Mechanism before adjustment',
    summary:'Flash appears repeatedly at one local shutoff after tool work while the rest of the parting line remains clean.',
    evidence:[
      'Flash is confined to one shutoff/parting-line location.',
      'The symptom began after tool work.',
      'Other cavities/regions remain acceptable.',
      'No broad rise in cavity-filling demand is evident.'
    ],
    related:['Flash','Parting line','Mould support / pillars','Process audit trail'],
    steps:[
      {stage:'Observe',question:'What should be suspected first?',choices:[
        {text:'A local seating, damage, contamination, alignment or support condition at the shutoff',correct:true,feedback:'Correct. Location and timing favour a local tooling mechanism.'},
        {text:'A need for maximum clamp force',feedback:'Extra clamp force should not be used to hide a damaged or poorly seated shutoff.'},
        {text:'A drying problem',feedback:'Material moisture does not fit the local flash location and post-tool-work timing.'},
        {text:'A robot vacuum fault',feedback:'Robot vacuum does not create flash at a shutoff.'}
      ]},
      {stage:'Best next test',question:'What is the strongest next action?',choices:[
        {text:'Inspect the exact flash location, seating/support and tool condition using approved safe procedures',correct:true,feedback:'Correct. Diagnose the physical interface before changing global process conditions.'},
        {text:'Raise clamp force until the flash disappears',feedback:'That can mask damage, increase mould stress and delay proper correction.'},
        {text:'Reduce every pressure setting',feedback:'A global reduction may create other quality problems without fixing the local shutoff.'},
        {text:'Increase cooling time',feedback:'Cooling time does not test the suspected local sealing condition.'}
      ]},
      {stage:'Controlled response',question:'If local damage is found, what is the educational principle?',choices:[
        {text:'Repair/restore the tooling condition and verify the known process, rather than using process force to compensate for damage',correct:true,feedback:'Correct. Mechanism-first troubleshooting protects both quality and tooling.'},
        {text:'Make the compensating process change permanent',feedback:'That makes the process dependent on an unresolved mechanical defect.'},
        {text:'Disable mould protection so the tool closes harder',feedback:'Safeguards must never be bypassed to maintain production.'},
        {text:'Ignore the location because flash is always a pressure problem',feedback:'Flash can be driven by local damage, seating, support, vent or process pressure; location matters.'}
      ]},
      {stage:'Explain',question:'Why should troubleshooting begin with defect location?',choices:[
        {text:'Location helps separate local mould features from variables that affect the whole shot',correct:true,feedback:'Exactly. A global variable is a weaker first hypothesis when only one local feature is affected.'},
        {text:'Location always proves the exact cause',feedback:'It narrows hypotheses but still requires confirmation.'},
        {text:'Location makes process data unnecessary',feedback:'Process actuals still help show whether global conditions changed.'},
        {text:'Location only matters for cosmetic defects',feedback:'Location is valuable for fill, flash, burns, dimensions, ejection and many other mechanisms.'}
      ]}
    ]
  }
];

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function learnerToken(){
  let raw='anonymous';
  try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}
  let h=2166136261;
  for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36);
}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){
  try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}
  catch(_){return {}}
}
function writeState(state){try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch(_){}}
function labState(id){const all=readState();return all[id]||{attempts:0,completed:false,bestScore:0,firstTry:false}}
function saveLab(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}

let activeLabId=null;
let answers=[];
let attemptHadError=false;

function style(){
  if(document.getElementById('mm-diagnostic-labs-style'))return;
  const s=document.createElement('style');s.id='mm-diagnostic-labs-style';s.textContent=`
#diagnosticLabs{--dl-line:#2e4868;--dl-soft:#0e1e32;--dl-accent:#55d6be}
.dl-hero{padding:24px;background:radial-gradient(circle at 90% 10%,rgba(85,214,190,.18),transparent 34%),linear-gradient(135deg,#13263d,#0e1d31)}
.dl-hero h2{font-size:30px;margin:7px 0 9px}.dl-hero p{max-width:850px;color:#bfd0e2;line-height:1.6}
.dl-note{margin-top:13px;padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px}
.dl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.dl-stat{padding:14px}.dl-stat b{display:block;font-size:24px;margin-top:4px}.dl-stat span{font-size:11px;color:var(--muted)}
.dl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dl-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.dl-card h3{margin:7px 0 8px}.dl-card p{color:var(--muted);line-height:1.52;font-size:13px;flex:1}.dl-meta{display:flex;gap:6px;flex-wrap:wrap}.dl-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.dl-card-foot{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px}.dl-done{color:var(--good);font-size:12px;font-weight:800}
.dl-lab{display:grid;gap:14px}.dl-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.dl-panel{padding:20px}.dl-panel h2,.dl-panel h3{margin-top:0}.dl-evidence{display:grid;gap:8px;margin:12px 0}.dl-evidence div{padding:10px 12px;border:1px solid #2e4665;background:#0d1d31;border-radius:9px;color:#c8d7e7;font-size:13px}.dl-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.dl-progress span{height:7px;border-radius:99px;background:#253951}.dl-progress span.done{background:var(--accent)}.dl-progress span.current{outline:2px solid #68a7ff;outline-offset:2px}.dl-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.dl-question{font-size:19px;font-weight:800;margin:8px 0 12px}.dl-choices{display:grid;gap:8px}.dl-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.dl-choice:hover{background:#17304b}.dl-choice[disabled]{cursor:default;opacity:.88}.dl-choice.correct{border-color:#4a8a75;background:#123229}.dl-choice.wrong{border-color:#7c4651;background:#321a22}.dl-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.dl-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.dl-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.dl-related{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.dl-summary{padding:18px;border:1px solid #3b5a79;background:#10243a;border-radius:13px}.dl-summary strong{font-size:22px}.dl-learning-loop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:14px}.dl-learning-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}
@media(max-width:900px){.dl-grid{grid-template-columns:1fr}.dl-learning-loop{grid-template-columns:1fr 1fr}.dl-stats{grid-template-columns:1fr 1fr 1fr}}
@media(max-width:560px){.dl-stats{grid-template-columns:1fr}.dl-progress{gap:4px}.dl-toolbar{align-items:stretch}.dl-toolbar button{width:100%}}
`;
  document.head.appendChild(s);
}

function ensureSection(){
  let section=document.getElementById('diagnosticLabs');
  if(section)return section;
  section=document.createElement('section');section.className='view hidden';section.id='diagnosticLabs';
  const main=document.getElementById('mainContent')||document.querySelector('main.main');
  if(main)main.appendChild(section);
  return section;
}

function ensureNav(){
  const nav=document.getElementById('nav');if(!nav)return;
  if(nav.querySelector('[data-mm-diagnostic-labs]'))return;
  const btn=document.createElement('button');btn.type='button';btn.dataset.mmDiagnosticLabs='1';btn.innerHTML='⌁ <span>Diagnostic labs</span>';
  const anchor=nav.querySelector('button[data-view="scenarios"]');
  if(anchor)anchor.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
  btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openLabs()});
}

function patchMobileMore(){
  if(window.__MM_DIAGNOSTIC_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;
  const base=window.openMobileMenu;
  window.openMobileMenu=function(){
    const r=base.apply(this,arguments);
    requestAnimationFrame(()=>{
      const grid=document.querySelector('#modal .modal-card .grid2');
      if(!grid||grid.querySelector('[data-mm-diagnostic-menu]'))return;
      const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmDiagnosticMenu='1';
      b.innerHTML='<span class="icon">⌁</span><b>Diagnostic labs</b><small>Practise evidence-first troubleshooting.</small>';
      b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openLabs()});
      grid.appendChild(b);
    });
    return r;
  };
  window.__MM_DIAGNOSTIC_MORE_PATCH__=true;
}

function setHeader(title,subtitle){
  const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');
  if(h)h.textContent=title;if(p)p.textContent=subtitle;
}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-diagnostic-labs]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click();else location.hash=''}

function stats(){
  const state=readState();let done=0,totalBest=0,attempted=0;
  LABS.forEach(l=>{const s=state[l.id];if(s?.completed)done++;if(s?.attempts){attempted++;totalBest+=Number(s.bestScore||0)}});
  return {done,attempted,avg:attempted?Math.round(totalBest/attempted):0};
}

function renderHome(){
  activeLabId=null;answers=[];attemptHadError=false;
  const host=ensureSection();if(!host)return;
  const st=stats();
  host.innerHTML=`
    <div class="dl-hero card">
      <div class="eyebrow">Evidence-first practice</div>
      <h2>Diagnostic Learning Labs</h2>
      <p>Learn how experienced moulders separate symptoms from mechanisms. Each lab asks you to observe the pattern, choose the strongest next test, make a controlled response and explain why.</p>
      <div class="dl-learning-loop"><span>1 Observe</span><span>2 Diagnose</span><span>3 Test</span><span>4 Respond</span><span>5 Explain</span></div>
      <div class="dl-note"><b>Training boundary:</b> these are educational scenarios, not universal production recipes. Verify the exact resin grade, machine and mould documentation, approved site procedures and process limits before real production changes.</div>
    </div>
    <div class="dl-stats">
      <div class="dl-stat card"><span>Labs completed</span><b>${st.done}/${LABS.length}</b></div>
      <div class="dl-stat card"><span>Labs attempted</span><b>${st.attempted}</b></div>
      <div class="dl-stat card"><span>Average best score</span><b>${st.avg}%</b></div>
    </div>
    <div class="dl-toolbar"><div><h2 style="margin:0">Choose a case</h2><p class="muted" style="margin:4px 0 0">Focus on the evidence before touching a setting.</p></div><button class="ghost" data-dl-back>Back to practice</button></div>
    <div class="dl-grid" style="margin-top:12px">${LABS.map(l=>cardHtml(l)).join('')}</div>`;
}

function cardHtml(lab){
  const s=labState(lab.id);return `<article class="dl-card card">
    <div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div>
    <h3>${escapeHtml(lab.title)}</h3><p>${escapeHtml(lab.summary)}</p>
    <div class="dl-card-foot"><span class="${s.completed?'dl-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-dl-start="${escapeHtml(lab.id)}">${s.completed?'Practise again':'Start lab'}</button></div>
  </article>`}

function openLab(id){
  const lab=LABS.find(x=>x.id===id);if(!lab)return;
  activeLabId=id;answers=new Array(lab.steps.length).fill(null);attemptHadError=false;
  const prior=labState(id);saveLab(id,{...prior,attempts:Number(prior.attempts||0)+1});renderLab(0);
}

function renderLab(stepIndex){
  const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return renderHome();
  const host=ensureSection();const step=lab.steps[stepIndex];const selected=answers[stepIndex];
  host.innerHTML=`<div class="dl-lab">
    <div class="dl-toolbar"><button class="ghost" data-dl-home>← All labs</button><button class="ghost" data-dl-back>Back to practice</button></div>
    <div class="dl-panel card">
      <div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div>
      <h2 style="margin:8px 0">${escapeHtml(lab.title)}</h2><p class="muted">${escapeHtml(lab.summary)}</p>
      <div class="dl-progress">${lab.steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div>
    </div>
    <div class="dl-panel card"><h3>Evidence board</h3><div class="dl-evidence">${lab.evidence.map(x=>`<div>${escapeHtml(x)}</div>`).join('')}</div></div>
    <div class="dl-panel card">
      <div class="dl-stage">${escapeHtml(step.stage)} · ${stepIndex+1}/${lab.steps.length}</div>
      <div class="dl-question">${escapeHtml(step.question)}</div>
      <div class="dl-choices">${step.choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>
      ${selected===null?'':feedbackHtml(step.choices[selected])}
      ${selected===null?'':`<div class="dl-actions">${stepIndex<lab.steps.length-1?'<button class="primary" data-dl-next>Next step</button>':'<button class="primary" data-dl-finish>Finish lab</button>'}<button class="ghost" data-dl-retry-step>Try this question again</button></div>`}
    </div>
    <div class="dl-panel card"><b>Related reference topics</b><div class="dl-related">${lab.related.map(x=>`<span class="dl-chip">${escapeHtml(x)}</span>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">Use Reference Data to explore these concepts in more depth. Treat exact production limits as grade-, machine-, mould- and site-specific.</p></div>
  </div>`;
  host.dataset.step=String(stepIndex);
}
function choiceHtml(c,i,selected){
  const chosen=selected===i;const cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="dl-choice${cls}" data-dl-choice="${i}" ${selected===null?'':'disabled'}>${escapeHtml(c.text)}</button>`
}
function feedbackHtml(choice){return `<div class="dl-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good diagnosis':'Re-check the evidence'}</b><br>${escapeHtml(choice.feedback)}</div>`}

function finishLab(){
  const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;
  const correct=lab.steps.reduce((n,s,i)=>n+(s.choices[answers[i]]?.correct?1:0),0);const score=Math.round(correct/lab.steps.length*100);
  const prior=labState(lab.id);const firstTry=Number(prior.attempts||0)===1&&!attemptHadError&&score===100;
  saveLab(lab.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score),firstTry:Boolean(prior.firstTry||firstTry)});
  const host=ensureSection();host.innerHTML=`<div class="dl-summary card"><div class="eyebrow">Lab complete</div><strong>${score}% · ${correct}/${lab.steps.length} decisions</strong><h2>${escapeHtml(lab.title)}</h2><p class="muted">${score===100?'You followed the evidence through the full reasoning chain.':'Review the missed steps and try again. The goal is not to memorise an answer; it is to learn which evidence supports which mechanism.'}</p><div class="dl-actions"><button class="primary" data-dl-home>Choose another lab</button><button class="secondary" data-dl-restart>Practise this lab again</button><button class="ghost" data-dl-back>Back to practice</button></div></div>`;
}

function handleClick(e){
  const target=e.target.closest('[data-dl-start],[data-dl-home],[data-dl-back],[data-dl-choice],[data-dl-next],[data-dl-finish],[data-dl-retry-step],[data-dl-restart]');if(!target)return;
  if(target.dataset.dlStart)return openLab(target.dataset.dlStart);
  if(target.hasAttribute('data-dl-home'))return renderHome();
  if(target.hasAttribute('data-dl-back'))return backToPractice();
  if(target.hasAttribute('data-dl-restart'))return openLab(activeLabId);
  const host=ensureSection();const stepIndex=Number(host?.dataset.step||0);const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;
  if(target.dataset.dlChoice!==undefined){const i=Number(target.dataset.dlChoice);answers[stepIndex]=i;if(!lab.steps[stepIndex].choices[i]?.correct)attemptHadError=true;return renderLab(stepIndex)}
  if(target.hasAttribute('data-dl-retry-step')){answers[stepIndex]=null;return renderLab(stepIndex)}
  if(target.hasAttribute('data-dl-next'))return renderLab(Math.min(stepIndex+1,lab.steps.length-1));
  if(target.hasAttribute('data-dl-finish'))return finishLab();
}

function openLabs(){
  style();const host=ensureSection();if(!host)return;
  hideOtherViews();host.classList.remove('hidden');markNav();setHeader('Diagnostic labs','Practise evidence-first injection moulding troubleshooting.');renderHome();
  window.scrollTo?.({top:0,behavior:'smooth'});
}

function install(){
  style();ensureSection();ensureNav();patchMobileMore();
  const host=document.getElementById('diagnosticLabs');if(host&&!host.__mmDlClick){host.addEventListener('click',handleClick);host.__mmDlClick=true}
}

let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
install();window.addEventListener('load',schedule);
window.MM_DIAGNOSTIC_LABS={version:VERSION,labs:LABS.map(x=>({id:x.id,title:x.title,level:x.level,focus:x.focus})),open:openLabs,storage:'learner-scoped local progress only'};
})();
