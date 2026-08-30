/* MouldMaster Diagnostic Learning Labs — evidence-first, answer-cue-balanced practice */
(function(){
'use strict';

const VERSION='2026.08.30.2';
const STORAGE_BASE='mm_diagnostic_labs_v1';
const C=(text,feedback,correct=false)=>({text,feedback,...(correct?{correct:true}:{})});
const ORDER={0:[0,1,2,3],1:[1,0,2,3],2:[1,2,0,3],3:[1,2,3,0]};
function S(stage,question,correctText,correctFeedback,wrong,pos){
  const raw=[C(correctText,correctFeedback,true),...wrong.map(x=>C(x[0],x[1]))];
  return {stage,question,choices:ORDER[pos].map(i=>raw[i])};
}

const LABS=[
  {
    id:'cavity-short-shot',title:'One cavity is short',level:'Intermediate',focus:'Local vs global evidence',
    summary:'An 8-cavity PA66-GF30 mould runs with stable overall fill time and pressure, but cavity 8 is repeatedly short.',
    evidence:['Cavities 1–7 fill normally.','Cavity 8 is consistently short at the same end-of-fill area.','Overall fill time and peak pressure are stable.','Material condition checks are within the approved requirement.'],
    related:['Short shot','Cavity-to-cavity imbalance','Reject pattern by cavity/time','Gate','Vent'],
    steps:[
      S('Observe','What does the evidence point to first?','A local flow-path or venting condition at cavity 8','Correct. A repeatable one-cavity defect with stable global signals makes a local branch, gate, runner or vent condition the strongest first hypothesis.',[
        ['A system-wide barrel-temperature shift that should influence multiple cavities in a similar way','A global thermal shift is less consistent with seven cavities remaining normal.'],
        ['A packing-stage holding-pressure deficit after the velocity-controlled filling phase has ended','Holding pressure acts after filling and does not explain why only one cavity repeatedly fails to complete fill.'],
        ['A clamp-force shortfall expected to show broader mould-opening or flash evidence across the tool','Clamp force is not the strongest explanation for a cavity-specific short shot with otherwise stable behaviour.']
      ],1),
      S('Best next test','Which check gives the most diagnostic information next?','Compare cavity 8 gate, runner and vent condition with a known-good cavity','Correct. Preserve cavity identity and compare the local flow path before changing a stable global process.',[
        ['Raise the barrel-temperature profile across the machine and judge whether all cavities respond together','That changes the full process before the local restriction hypothesis is tested.'],
        ['Increase hold time and use packed part mass as the main indicator even though cavity 8 is short during fill','Hold-time changes cannot restore material that never reached the end of the cavity during filling.'],
        ['Increase clamp force and use mould-opening response as the primary test of the cavity-specific short shot','That does not directly test the suspected local restriction or venting mechanism.']
      ],3),
      S('Controlled response','If the local restriction is confirmed, what is the best learning principle?','Correct the local restriction, then verify the validated process response','Correct. Fix the confirmed mechanism and demonstrate recovery rather than hiding it with unrelated global adjustments.',[
        ['Increase injection pressure until cavity 8 fills, accepting higher load across the otherwise stable cavities','That can mask a tooling problem and expose stable cavities or the mould to unnecessary load.'],
        ['Change injection speed, pressure and temperature together so the symptom is removed as quickly as possible','Multiple simultaneous changes destroy the evidence needed to learn which factor mattered.'],
        ['Ignore cavity identity and accept the pooled shot weight as proof that all cavities are filling correctly','Pooled shot data can hide one weak cavity and erase the most diagnostic pattern.']
      ],0),
      S('Explain','Why is cavity identity so useful?','It preserves cavity identity, separating local from system-wide causes','Correct. Location-specific patterns help distinguish local tooling/flow-path mechanisms from machine, material or thermal changes that affect the whole shot.',[
        ['It proves the material condition is correct whenever seven of eight cavities continue to fill normally','Cavity identity narrows the mechanism but does not prove every other input is correct.'],
        ['It means machine actuals no longer need to be reviewed once the defect is assigned to a single cavity','Machine actuals still help confirm that global filling behaviour remained stable.'],
        ['It identifies the exact production setting that should be changed without any confirming inspection or controlled test','Location guides diagnosis; it does not provide a universal setting or eliminate confirmation.']
      ],2)
    ]
  },
  {
    id:'splay-moisture',title:'Silver streaks after a material change',level:'Intermediate',focus:'Material condition and evidence',
    summary:'Silver streaks appear after a new lot of moisture-sensitive resin is loaded. The dryer display looks normal.',
    evidence:['The defect began soon after the material-lot change.','Dryer set temperature and displayed dew point look normal.','No confirmed resin moisture measurement has been taken.','The defect appears as silver streaking rather than an incomplete fill.'],
    related:['Splay / silver streaks','Material moisture actual','Dryer dew point / air condition','Material-lot change verification'],
    steps:[
      S('Observe','What is the most important uncertainty?','Whether actual resin moisture meets the exact grade requirement','Correct. Dryer displays are supporting evidence; the unresolved variable is the actual material condition reaching the machine.',[
        ['Whether clamp force has fallen enough to change the moulding response after the material-lot change','Clamp force is poorly connected to the material-handling timing and silver-streak pattern.'],
        ['Whether cooling time has become excessive and is creating the observed silver streak pattern after fill','Cooling time is not the strongest first explanation for streaking that begins with material exposure.'],
        ['Whether ejector speed changed during the same shift and is marking the part after it leaves the cavity','Ejection occurs after the streak-forming melt behaviour and does not fit the timing evidence.']
      ],2),
      S('Best next test','Which test is strongest?','Measure resin moisture and verify the drying/handling path','Correct. Direct material-condition evidence plus the handling path discriminates moisture from filling or tooling alternatives.',[
        ['Treat the normal displayed dew point as sufficient proof that dry resin is reaching the machine hopper','A normal dryer display alone does not prove that the pellets at the machine meet the grade moisture limit.'],
        ['Increase injection pressure and judge the streak response without first checking the material condition','That changes filling without testing the moisture hypothesis raised by the handling history.'],
        ['Polish the mould surface and use the cosmetic change as the primary test of the moisture hypothesis','Surface tooling is a weak first test when the defect timing points toward material condition.']
      ],0),
      S('Controlled response','If excessive moisture is confirmed, what is the correct principle?','Restore approved conditioning, verify moisture, then reassess','Correct. Use the exact grade and site-approved requirement, confirm the actual material state, and only then judge the moulding response.',[
        ['Apply one fixed drying cycle to every nylon grade so material handling is standardised across jobs','Drying requirements are grade-, equipment- and handling-specific rather than one universal recipe.'],
        ['Raise melt temperature to drive moisture out during plasticising and judge the part appearance afterward','Processing wet moisture-sensitive resin can cause degradation; barrel heat is not a safe substitute for conditioning.'],
        ['Mask the visible streaking with colour adjustment while leaving the material-conditioning uncertainty unresolved','That hides appearance without correcting or verifying the material mechanism.']
      ],3),
      S('Explain','What is the main lesson from the normal dryer display?','Displayed dryer values are not verified resin condition','Correct. Setpoints and displayed air conditions are useful context, but they are not the same as an independently verified material actual.',[
        ['Dryer instrumentation should be disregarded completely because it cannot contribute useful evidence about air condition','Dryer data are useful when interpreted with airflow, residence, handling and direct moisture evidence.'],
        ['Material-lot changes can be ignored once the dryer has returned to its normal screen values','Lot and handling history remain relevant even when displayed dryer conditions recover.'],
        ['Silver streaking has one universal cause, so independent material and process checks are unnecessary','Splay can arise from moisture, contamination, volatiles, degradation or air entrainment.']
      ],1)
    ]
  },
  {
    id:'pressure-limited-fill',title:'The machine is not following the speed setting',level:'Advanced',focus:'Setpoint vs actual',
    summary:'A technician increases programmed injection velocity, but actual fill time hardly changes and the actual velocity trace remains below command.',
    evidence:['Commanded velocity was increased.','Actual velocity remains below the command during the same region of fill.','Injection pressure is running near the machine/process limit.','Fill time changes very little.'],
    related:['Injection velocity actual','Peak injection pressure','Pressure-limited fill detection','Machine setpoints vs actuals'],
    steps:[
      S('Observe','What mechanism best fits?','The fill is pressure-limited and cannot achieve commanded velocity','Correct. The command rises but the achieved velocity does not, while pressure demand is near the applicable limit.',[
        ['The controller is ignoring the programmed velocity profile and should be treated as failed without further checks','The actual trace and pressure demand support a capability/pressure limitation before a controller-failure claim.'],
        ['Holding time is controlling screw velocity during the velocity-controlled filling phase of the cycle','Holding occurs after the filling phase and is not the command that sets injection velocity.'],
        ['Clamp force is determining the injection velocity because mould restraint directly sets screw speed','Clamp force restrains mould opening; it does not command screw velocity.']
      ],3),
      S('Best next test','What should be compared next?','Compare commanded and actual velocity with pressure demand and limit','Correct. Those signals directly test whether the machine is following the requested profile within the approved capability envelope.',[
        ['Review only the programmed velocity setpoint and assume the physical fill response should match that screen value','The problem is specifically a mismatch between command and achieved response, so setpoint alone is insufficient.'],
        ['Use total cycle time alone as the deciding signal even if the fill phase changes independently','Total cycle time can remain similar while the filling phase is pressure-limited.'],
        ['Use clamp tonnage alone to determine whether the machine can follow the requested injection-velocity profile','Clamp tonnage does not establish injection-velocity following capability.']
      ],1),
      S('Controlled response','What is the right diagnostic principle?','Find the cause of high pressure demand before requesting more speed','Correct. Investigate material state, restriction, thermal condition and machine capability before demanding an unattainable response.',[
        ['Continue raising the velocity command until the displayed setpoint is well above the actual machine capability','A command above achievable capability does not create the intended actual velocity.'],
        ['Raise all available machine pressure and force limits before identifying why the process demand increased','Limits may protect machine, mould, material or process capability and should not be bypassed as a diagnostic shortcut.'],
        ['Ignore the actual velocity trace and tune from the saved recipe because commands define the physical process','Commands are not proof of the achieved physical process; the actual trace is central evidence.']
      ],2),
      S('Explain','Why are actuals important for process transfer?','Actual process response, not copied setpoints, defines transfer','Correct. Transfer should reproduce relevant physical outputs and remain within the receiving machine capability, not merely copy screen numbers.',[
        ['Actuals make material-condition data unnecessary because machine response alone fully describes the process','Material condition remains part of the moulding system and can alter the achieved response.'],
        ['Actual measurements are only relevant on electric machines and can be ignored on hydraulic equipment','Measured process response is useful across machine architectures.'],
        ['Actual process traces make runner, gate and tooling pressure losses irrelevant during machine-to-machine transfer','Tooling geometry and local pressure loss remain critical even when machine actuals are available.']
      ],0)
    ]
  },
  {
    id:'check-ring-repeatability',title:'Cushion and part mass are wandering',level:'Advanced',focus:'Shot-delivery repeatability',
    summary:'Cycle-to-cycle cushion, transfer position and part mass vary while programmed settings remain unchanged.',
    evidence:['Cushion varies more than normal.','Transfer position and part mass move with the variation.','The programmed recipe has not changed.','The variation repeats over consecutive cycles.'],
    related:['Cushion','Transfer position','Part mass','Check-ring repeatability study','Non-return valve / check ring'],
    steps:[
      S('Observe','Which system deserves early investigation?','Shot-delivery and check-ring repeatability','Correct. Coupled movement in cushion, transfer and mass is strong evidence to investigate effective shot delivery and non-return-valve repeatability.',[
        ['Mould-surface texture variation that would change appearance without explaining cushion, transfer and mass movement','Texture does not explain the coupled process-signal movement shown here.'],
        ['Robot take-out timing variation occurring after moulding but coinciding with the observed shot-delivery drift','Robot timing can affect handling but not this linked shot-delivery signature.'],
        ['Clamp-opening speed variation after cooling that would not normally create the coupled filling signals shown','Clamp opening occurs after the shot is formed and is not linked to cushion/transfer variation.']
      ],0),
      S('Best next test','What is the best learning-oriented test?','Run a repeatability study of transfer, cushion and part mass','Correct. A sequence of aligned shot-delivery responses can demonstrate repeatability before any compensating process change.',[
        ['Increase shot size until average mass returns to target and then treat the higher average as proof of repeatability','Changing the average can hide cycle-to-cycle instability rather than identify it.'],
        ['Change shot size and holding pressure together, then compare only the final average part mass','Changing multiple factors makes the shot-delivery mechanism harder to isolate.'],
        ['Judge the system from one cycle and assume that a single acceptable cushion value represents repeatability','Repeatability requires a sequence of cycles, not one acceptable observation.']
      ],2),
      S('Controlled response','If a mechanical repeatability problem is confirmed, what should happen?','Repair the repeatability cause, then restore the validated process','Correct. Stable process development depends on stable shot delivery; correct the mechanical cause before tuning around it.',[
        ['Build a new process recipe around the unstable shot-delivery behaviour and accept the mechanical variation as baseline','A recipe cannot make an unstable mechanical delivery system repeatable.'],
        ['Increase clamp force to compensate for the changing cushion and part mass even though clamp behaviour is not implicated','Clamp force is unrelated to non-return-valve sealing repeatability.'],
        ['Stop recording cushion so the remaining process data appear more stable during production review','Removing a useful signal hides evidence instead of correcting the instability.']
      ],1),
      S('Explain','Why trend several signals together?','Converging signals strengthen or weaken a suspected mechanism','Correct. Independent responses that move together provide stronger diagnostic evidence than one isolated number.',[
        ['Correlated movement guarantees one unique root cause and removes the need to test alternative explanations','Correlation strengthens a hypothesis but does not guarantee a single cause.'],
        ['Trending process signals replaces physical inspection and maintenance checks once a statistical pattern appears','Process data and physical inspection complement each other.'],
        ['Multiple signals make the time sequence unimportant even when the problem is intermittent or drifting','Time sequence is often essential for understanding drift and intermittency.']
      ],3)
    ]
  },
  {
    id:'cooling-warpage',title:'Warpage grows after mould maintenance',level:'Intermediate',focus:'Thermal balance',
    summary:'A part begins warping after mould maintenance even though the machine recipe is unchanged.',
    evidence:['Warpage increased immediately after mould maintenance.','The programmed recipe is unchanged.','One cooling circuit shows lower flow than its validated baseline.','Mould-surface temperatures are less balanced than before.'],
    related:['Warpage','Cooling-circuit flow','Cooling-circuit baseline','Mould-surface temperature'],
    steps:[
      S('Observe','What evidence is strongest?','The post-maintenance cooling-flow and thermal imbalance','Correct. Timing plus a measured circuit-flow and local-temperature change supports a thermal mechanism more strongly than unchanged commands.',[
        ['The unchanged injection-speed command, despite no evidence that filling behaviour changed after maintenance','An unchanged setpoint is background information, not the strongest cause evidence.'],
        ['The part colour, treated as the primary explanation despite the measured cooling-circuit change','Colour alone does not explain the measured circuit and thermal imbalance.'],
        ['The operator shift, even though the symptom began with a documented physical maintenance intervention','The maintenance-linked physical evidence is stronger than a shift association.']
      ],1),
      S('Best next test','What should be checked before process adjustment?','Verify circuit routing, flow, temperatures and local thermal balance','Correct. Confirm that the cooling system returned to its validated configuration before changing a previously stable recipe.',[
        ['Increase hold pressure immediately and judge warpage before checking whether the cooling circuit returned to baseline','That changes packing without testing the measured thermal imbalance.'],
        ['Increase injection velocity globally even though fill behaviour remained stable across the maintenance event','That does not explain the post-maintenance circuit-flow change.'],
        ['Ignore the measured flow difference because surface temperatures are close enough to the previous average','Temperature alone can mask a flow problem until local thermal balance shifts.']
      ],3),
      S('Controlled response','If a circuit is misconnected or restricted, what is the preferred response?','Restore the cooling circuit baseline, then verify part response','Correct. Restore the physical cooling condition and verify temperature, dimensions, warpage and process stability.',[
        ['Make a permanent packing-pressure compensation so production can continue without correcting the changed cooling condition','That can hide the cooling fault and introduce new residual-stress or dimensional effects.'],
        ['Lengthen cooling time until the symptom is hidden, without identifying whether a connection or restriction changed','More time may mask symptoms but does not correct the changed circuit condition.'],
        ['Increase mould-close force and treat the mechanical closing system as the primary control for coolant flow','Clamp closing force does not restore coolant routing or flow.']
      ],0),
      S('Explain','Why is a cooling baseline valuable?','A baseline makes cooling changes measurable rather than speculative','Correct. A known-good circuit and thermal reference makes post-maintenance routing, blockage and balance changes easier to isolate.',[
        ['A cooling baseline means mould temperature should never vary and any change automatically indicates a failed circuit','Thermal systems vary; a baseline provides context for meaningful change rather than a no-variation rule.'],
        ['A cooling baseline replaces dimensional and warpage inspection once flow and temperature values are recorded','Part-quality responses remain essential to deciding whether the process is acceptable.'],
        ['A cooling baseline provides one universal coolant-flow target that can be copied to any mould and circuit','Cooling requirements remain mould-, circuit- and product-specific.']
      ],2)
    ]
  },
  {
    id:'gate-seal-study',title:'Does more hold time still help?',level:'Advanced',focus:'Scientific moulding study design',
    summary:'A learner wants to know whether extra hold time still changes the packed part after the gate has stopped transmitting useful pressure.',
    evidence:['The process is otherwise stable.','Part mass is measured with a consistent method.','Hold time can be varied in controlled steps.','The exact gate/material/process condition must be studied rather than assumed.'],
    related:['Gate-seal study','Part mass','Process window study','Hold pressure actual'],
    steps:[
      S('Observe','What response is useful for a basic gate-seal study?','Part mass across controlled hold-time steps','Correct. A repeatable part-mass plateau is useful evidence that additional hold time is no longer adding measurable material for the tested condition.',[
        ['Only the programmed hold-time value, without measuring whether the part or process response changes','A study needs a measured response, not the input value by itself.'],
        ['Only total cycle time, even though it does not show whether additional material still passes through the gate','Cycle time does not establish whether packing material is still transmitted through the gate.'],
        ['Only clamp-force data, despite clamp load not being the response used to establish effective gate seal','Clamp force is not the primary response for this study.']
      ],2),
      S('Best next test','How should the study be run?','Vary hold time alone and record a repeatable response','Correct. A controlled factor, stable important conditions and repeated response data make the gate-seal evidence interpretable.',[
        ['Change hold time, holding pressure and cooling together, then attribute any result to the time change','That confounds the study and makes causal interpretation weak.'],
        ['Use one shot at each condition and assume that a single observation is enough despite process variation','A single observation can be misleading when process or measurement variation is present.'],
        ['Copy the gate-seal time from another mould even though gate geometry, resin and thermal condition differ','Gate-seal behaviour is specific to the gate, resin, geometry and thermal condition.']
      ],0),
      S('Controlled response','What does a repeatable mass plateau mean?','Extra hold time no longer adds meaningful part mass','Correct. Under the studied stable condition, additional hold time is no longer producing a meaningful mass response; relevant dimensions and quality still require verification.',[
        ['The same hold time is now proven correct for every resin, gate geometry and moulding condition','The conclusion is specific to the tested material, geometry and process state.'],
        ['Holding pressure can be ignored completely once a mass plateau has appeared in the time study','Pressure magnitude and transmission remain relevant; the study addresses the time response being tested.'],
        ['Cooling time should automatically be set equal to the observed hold-time plateau for production','Cooling and gate seal are governed by different response criteria.']
      ],3),
      S('Explain','Why is this better than guessing?','It links a controlled input change to a measured response','Correct. This is the scientific-moulding principle of relating a deliberate input to a repeatable measured outcome.',[
        ['It guarantees full product validation from one gate-seal study without the remaining quality and capability evidence','A gate-seal study is one component of process-development evidence, not complete validation.'],
        ['It removes the need to verify material, machine and supplier constraints because the part-mass response is sufficient','Material and equipment limits still define the allowable study and production space.'],
        ['It proves longer hold time is universally harmful rather than establishing a condition-specific response plateau','The result is condition-specific and does not make longer hold universally wrong.']
      ],1)
    ]
  },
  {
    id:'measurement-noise',title:'The dimension moves — or does it?',level:'Advanced',focus:'Measurement system thinking',
    summary:'A critical dimension appears to drift, but repeated measurements of the same parts vary almost as much as the reported process change.',
    evidence:['Different operators obtain noticeably different values on the same parts.','Measurement timing after moulding is inconsistent.','The apparent process shift is small compared with measurement spread.','The moulding process signals themselves look stable.'],
    related:['Measurement system analysis','Measurement-system study before process adjustment','Measurement conditioning-time control','Dimensional drift'],
    steps:[
      S('Observe','What should be questioned first?','Whether the measurement can resolve the reported process shift','Correct. Adjustment and capability decisions are unreliable if measurement variation is comparable with the apparent process change.',[
        ['Whether injection pressure should be changed before verifying that the dimensional measurement is repeatable','Changing a stable process before verifying measurement can turn gauge noise into real process variation.'],
        ['Whether the mould surface should be reworked even though operator-to-operator measurement spread is already evident','The direct evidence points first to measurement-system adequacy, not mould rework.'],
        ['Whether robot speed should be adjusted because the measured dimension varies between operators','Robot speed is not supported by the operator-to-operator measurement evidence.']
      ],3),
      S('Best next test','What should be standardised and studied?','Standardise method, fixture, conditioning and MSA checks','Correct. Establish resolution, repeatability, reproducibility, method, fixture and conditioning before interpreting small process shifts.',[
        ['Review only the machine setpoint screen and assume a stable recipe proves the dimensional reading is accurate','Machine setpoints do not establish measurement-system capability.'],
        ['Average all readings together without separating operator, timing, fixture or repeatability effects','Averages can hide a measurement system that is not repeatable or reproducible.'],
        ['Use drawing tolerance alone to decide whether the measurement system is capable of supporting the decision','Tolerance matters, but a capable method must still be demonstrated.']
      ],1),
      S('Controlled response','What is the safest process-learning principle?','Verify the measurement before adjusting a stable process','Correct. Establish that the signal is real, then reassess the process evidence before making a production change.',[
        ['Adjust the moulding process after every individual reading so the process follows the measurement in real time','That can create real process variation in response to measurement noise.'],
        ['Tighten process-control limits until the chart looks better, without establishing whether the gauge is resolving change','Control limits do not improve the measurement system.'],
        ['Stop measuring the characteristic so measurement variation no longer appears in the process review','The objective is trustworthy measurement, not removal of quality evidence.']
      ],2),
      S('Explain','Why can conditioning time matter for plastic parts?','Plastic dimensions can change during post-mould conditioning','Correct. Temperature, crystallisation and moisture state can continue changing after ejection, depending on the polymer and specification.',[
        ['All plastic dimensions become fixed at ejection, so later changes must be measurement error or machine drift','Many polymers continue thermal, crystalline or moisture-related dimensional change after moulding.'],
        ['Conditioning is only relevant to metals and does not affect polymer temperature, moisture or crystallisation state','Plastics can be strongly affected by temperature and moisture history.'],
        ['Conditioning time directly sets machine injection pressure and therefore should be treated as a machine parameter','Conditioning affects the part measurement state, not the machine pressure setpoint.']
      ],0)
    ]
  },
  {
    id:'hot-runner-imbalance',title:'One hot-runner branch behaves differently',level:'Very Advanced',focus:'Thermal/flow evidence',
    summary:'Two cavities fed by one branch begin filling differently even though displayed hot-runner temperatures appear equal.',
    evidence:['The imbalance is repeatable by branch/cavity.','Displayed zone temperatures are close to setpoint.','One controller zone shows unusually high output compared with its peer.','The machine fill trace remains stable overall.'],
    related:['Hot-runner zone actuals','Hot-runner branch balance check','Hot-runner manifold','Cavity-to-cavity pressure delta'],
    steps:[
      S('Observe','Why is equal displayed temperature not enough?','Near-setpoint temperature does not prove equal delivered branch condition','Correct. Heater output, heat loss, local restriction and delivered melt condition can differ even while a sensor reads close to setpoint.',[
        ['Hot-runner systems cannot affect cavity balance, so branch-specific fill differences must originate elsewhere','Hot-runner branch condition can directly affect delivered heat and pressure loss.'],
        ['Every thermocouple should be treated as incorrect whenever two cavities supplied by one branch behave differently','The lesson is to combine sensor, controller and branch-response evidence, not distrust every thermocouple.'],
        ['Clamp force determines manifold temperature and should be adjusted before reviewing heater output or branch response','Clamp force is unrelated to manifold heater control.']
      ],0),
      S('Best next test','What should be compared?','Compare zone actual/output, branch response and cavity pressure/fill','Correct. Relate controller demand and temperature actuals to branch/gate and cavity response so the local thermal/flow hypothesis can be tested.',[
        ['Compare only the temperature setpoints because equal commands establish that each branch receives equal melt condition','Equal setpoints do not establish equal heater output, sensor condition or delivered melt state.'],
        ['Use only total shot weight even though pooled mass can hide opposite cavity-to-cavity fill differences','Combined mass can hide branch and cavity imbalance.'],
        ['Use only cooling time and ignore fill-stage branch evidence because temperature problems occur after filling','The observed imbalance is occurring in the hot-runner/filling path, so fill-stage evidence is directly relevant.']
      ],2),
      S('Controlled response','What should happen if a heater/thermocouple or branch fault is confirmed?','Repair the local hardware/control fault, then verify branch balance','Correct. Restore the physical/control system with approved procedures and demonstrate local recovery before rewriting the validated recipe.',[
        ['Keep increasing the affected zone setpoint until the branch fills, without confirming heater or thermocouple health','Blindly raising setpoint can worsen thermal history and does not establish the fault mechanism.'],
        ['Raise all barrel-zone temperatures to compensate for the local branch while preserving the faulty hot-runner state','That changes the global thermal condition to hide a local hardware problem.'],
        ['Increase clamp force and use the change in mould restraint as the primary response to a hot-runner control fault','Clamp force cannot repair a heater, thermocouple or branch restriction.']
      ],1),
      S('Explain','What broader troubleshooting habit does this teach?','Use location, timing and multiple signals to separate local from global faults','Correct. Good diagnosis asks where the change occurs, when it appears and which independent actuals move with it.',[
        ['Change the easiest available setting first and treat any short-term improvement as proof of root cause','Ease of adjustment is not evidence of causality.'],
        ['Treat displayed values as untrustworthy whenever one sensor disagrees with the observed part behaviour','Displayed values remain useful when interpreted with sensor limitations and independent evidence.'],
        ['Create a new process recipe for each defect instead of checking whether material, tooling or equipment changed','Many defects originate in material, tooling, maintenance or equipment conditions that should be corrected directly.']
      ],3)
    ]
  },
  {
    id:'local-flash',title:'Flash only at one shutoff',level:'Intermediate',focus:'Mechanism before adjustment',
    summary:'Flash appears repeatedly at one local shutoff after tool work while the rest of the parting line remains clean.',
    evidence:['Flash is confined to one shutoff/parting-line location.','The symptom began after tool work.','Other cavities/regions remain acceptable.','No broad rise in cavity-filling demand is evident.'],
    related:['Flash','Parting line','Mould support / pillars','Process audit trail'],
    steps:[
      S('Observe','What should be suspected first?','A local shutoff seating, damage or support condition','Correct. Location and timing favour a local tooling mechanism before a whole-process clamp or packing explanation.',[
        ['A global clamp-force shortage that should normally create broader mould-opening or flash evidence','A global clamp deficit is less consistent with one post-service shutoff being affected.'],
        ['A material-drying problem that would be expected to affect resin condition rather than one repaired shutoff','Material moisture does not fit the local flash location and tool-work timing.'],
        ['A robot-vacuum fault occurring after moulding that cannot create flash at a specific shutoff interface','Robot vacuum acts after moulding and cannot create flash at the shutoff interface.']
      ],1),
      S('Best next test','What is the strongest next action?','Inspect the flash location, seating/support and tool condition','Correct. Diagnose the changed physical interface with approved safe access before changing global process conditions.',[
        ['Raise global clamp force until the flash disappears, accepting higher mould load without inspecting the repaired shutoff','That can mask damage, increase mould stress and delay correction of the local mechanism.'],
        ['Reduce all pressure settings together and accept any new filling or packing changes as part of the correction','A global reduction can create other quality problems without fixing the local shutoff.'],
        ['Increase cooling time and use the cosmetic flash response as the main test of a local shutoff-seating problem','Cooling time does not test the suspected local sealing condition.']
      ],3),
      S('Controlled response','If local damage is found, what is the educational principle?','Restore the tooling condition, then verify the known process','Correct. Mechanism-first troubleshooting protects tooling and quality; repair the local condition before using process force as compensation.',[
        ['Make the compensating process change permanent and allow the process window to depend on the unresolved tooling defect','That leaves the process dependent on an unresolved mechanical condition.'],
        ['Disable mould protection so the tool closes harder and use increased closing force to overcome the damaged interface','Safeguards must never be bypassed to maintain production or compensate for tooling damage.'],
        ['Ignore the defect location and treat every flash mechanism as a pressure-only problem across the full shot','Flash can result from local seating, damage, support, venting or process pressure; location remains diagnostic.']
      ],0),
      S('Explain','Why should troubleshooting begin with defect location?','Location separates local mould features from whole-shot variables','Correct. A global variable is a weaker first hypothesis when only one local feature changes, although confirmation is still required.',[
        ['Location proves the exact root cause without any confirming inspection, process comparison or controlled test','Location narrows hypotheses but does not prove the exact mechanism by itself.'],
        ['Location removes the need to review process actuals because a local defect cannot have any process contribution','Process actuals still help establish whether global conditions changed.'],
        ['Location matters only for cosmetic defects and should not influence diagnosis of filling, flash or dimensional issues','Location is useful across filling, venting, flash, dimensions, ejection and other mechanisms.']
      ],2)
    ]
  }
];

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function learnerToken(){let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeState(state){try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch(_){}}
function labState(id){const all=readState();return all[id]||{attempts:0,completed:false,bestScore:0,firstTry:false}}
function saveLab(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}
let activeLabId=null,answers=[],attemptHadError=false;

function style(){
  if(document.getElementById('mm-diagnostic-labs-style'))return;
  const s=document.createElement('style');s.id='mm-diagnostic-labs-style';s.textContent=`
#diagnosticLabs{--dl-line:#2e4868;--dl-soft:#0e1e32;--dl-accent:#55d6be}.dl-hero{padding:24px}.dl-hero h2{font-size:30px;margin:7px 0 9px}.dl-hero p{max-width:850px;color:#bfd0e2;line-height:1.6}.dl-note{margin-top:13px;padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px}.dl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.dl-stat{padding:14px}.dl-stat b{display:block;font-size:24px;margin-top:4px}.dl-stat span{font-size:11px;color:var(--muted)}.dl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dl-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.dl-card h3{margin:7px 0 8px}.dl-card p{color:var(--muted);line-height:1.52;font-size:13px;flex:1}.dl-meta,.dl-related,.dl-actions{display:flex;gap:6px;flex-wrap:wrap}.dl-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.dl-card-foot,.dl-toolbar{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-top:12px}.dl-done{color:var(--good);font-size:12px;font-weight:800}.dl-lab{display:grid;gap:14px}.dl-panel{padding:20px}.dl-evidence{display:grid;gap:8px;margin:12px 0}.dl-evidence div{padding:10px 12px;border:1px solid #2e4665;background:#0d1d31;border-radius:9px;color:#c8d7e7;font-size:13px}.dl-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.dl-progress span{height:7px;border-radius:99px;background:#253951}.dl-progress span.done{background:var(--accent)}.dl-progress span.current{outline:2px solid #68a7ff;outline-offset:2px}.dl-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.dl-question{font-size:19px;font-weight:800;margin:8px 0 12px}.dl-choices{display:grid;gap:8px}.dl-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.dl-choice.correct{border-color:#4a8a75;background:#123229}.dl-choice.wrong{border-color:#7c4651;background:#321a22}.dl-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55}.dl-feedback.bad{background:#2b1d20;border-color:#653f48}.dl-summary{padding:18px}.dl-learning-loop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:14px}.dl-learning-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}@media(max-width:900px){.dl-grid{grid-template-columns:1fr}.dl-learning-loop{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dl-stats{grid-template-columns:1fr}.dl-toolbar button{width:100%}}`;
  document.head.appendChild(s);
}
function ensureSection(){let section=document.getElementById('diagnosticLabs');if(section)return section;section=document.createElement('section');section.className='view hidden';section.id='diagnosticLabs';const main=document.getElementById('mainContent')||document.querySelector('main.main');if(main)main.appendChild(section);return section}
function ensureNav(){const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-diagnostic-labs]'))return;const btn=document.createElement('button');btn.type='button';btn.dataset.mmDiagnosticLabs='1';btn.innerHTML='⌁ <span>Diagnostic labs</span>';const anchor=nav.querySelector('button[data-view="scenarios"]');if(anchor)anchor.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openLabs()})}
function patchMobileMore(){if(window.__MM_DIAGNOSTIC_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-diagnostic-menu]'))return;const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmDiagnosticMenu='1';b.innerHTML='<span class="icon">⌁</span><b>Diagnostic labs</b><small>Practise evidence-first troubleshooting.</small>';b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openLabs()});grid.appendChild(b)});return r};window.__MM_DIAGNOSTIC_MORE_PATCH__=true}
function setHeader(title,subtitle){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=title;if(p)p.textContent=subtitle}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-diagnostic-labs]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click();else location.hash=''}
function stats(){const state=readState();let done=0,totalBest=0,attempted=0;LABS.forEach(l=>{const s=state[l.id];if(s?.completed)done++;if(s?.attempts){attempted++;totalBest+=Number(s.bestScore||0)}});return {done,attempted,avg:attempted?Math.round(totalBest/attempted):0}}
function cardHtml(lab){const s=labState(lab.id);return `<article class="dl-card card"><div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div><h3>${escapeHtml(lab.title)}</h3><p>${escapeHtml(lab.summary)}</p><div class="dl-card-foot"><span class="${s.completed?'dl-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-dl-start="${escapeHtml(lab.id)}">${s.completed?'Practise again':'Start lab'}</button></div></article>`}
function renderHome(){activeLabId=null;answers=[];attemptHadError=false;const host=ensureSection();if(!host)return;const st=stats();host.innerHTML=`<div class="dl-hero card"><div class="eyebrow">Evidence-first practice</div><h2>Diagnostic Learning Labs</h2><p>Use real injection-moulding signal relationships to separate observations, mechanisms, discriminating tests and recovery evidence.</p><div class="dl-learning-loop"><span>1 Observe</span><span>2 Diagnose</span><span>3 Test</span><span>4 Respond</span><span>5 Explain</span></div><div class="dl-note"><b>Training boundary:</b> these are educational scenarios, not universal production recipes. Verify the exact resin grade, machine and mould documentation, approved site procedures and process limits before real production changes.</div></div><div class="dl-stats"><div class="dl-stat card"><span>Labs completed</span><b>${st.done}/${LABS.length}</b></div><div class="dl-stat card"><span>Labs attempted</span><b>${st.attempted}</b></div><div class="dl-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div><div class="dl-toolbar"><div><h2 style="margin:0">Choose a case</h2><p class="muted" style="margin:4px 0 0">Focus on evidence before touching a setting.</p></div><button class="ghost" data-dl-back>Back to practice</button></div><div class="dl-grid" style="margin-top:12px">${LABS.map(cardHtml).join('')}</div>`}
function openLab(id){const lab=LABS.find(x=>x.id===id);if(!lab)return;activeLabId=id;answers=new Array(lab.steps.length).fill(null);attemptHadError=false;const prior=labState(id);saveLab(id,{...prior,attempts:Number(prior.attempts||0)+1});renderLab(0)}
function choiceHtml(c,i,selected){const chosen=selected===i;const cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="dl-choice${cls}" data-dl-choice="${i}" ${selected===null?'':'disabled'}>${escapeHtml(c.text)}</button>`}
function feedbackHtml(choice){return `<div class="dl-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good diagnosis':'Re-check the evidence'}</b><br>${escapeHtml(choice.feedback)}</div>`}
function renderLab(stepIndex){const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return renderHome();const host=ensureSection(),step=lab.steps[stepIndex],selected=answers[stepIndex];host.innerHTML=`<div class="dl-lab"><div class="dl-toolbar"><button class="ghost" data-dl-home>← All labs</button><button class="ghost" data-dl-back>Back to practice</button></div><div class="dl-panel card"><div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div><h2>${escapeHtml(lab.title)}</h2><p class="muted">${escapeHtml(lab.summary)}</p><div class="dl-progress">${lab.steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div><div class="dl-panel card"><h3>Evidence board</h3><div class="dl-evidence">${lab.evidence.map(x=>`<div>${escapeHtml(x)}</div>`).join('')}</div></div><div class="dl-panel card"><div class="dl-stage">${escapeHtml(step.stage)} · ${stepIndex+1}/${lab.steps.length}</div><div class="dl-question">${escapeHtml(step.question)}</div><div class="dl-choices">${step.choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(step.choices[selected])}${selected===null?'':`<div class="dl-actions">${stepIndex<lab.steps.length-1?'<button class="primary" data-dl-next>Next step</button>':'<button class="primary" data-dl-finish>Finish lab</button>'}<button class="ghost" data-dl-retry-step>Try this question again</button></div>`}</div><div class="dl-panel card"><b>Related reference topics</b><div class="dl-related">${lab.related.map(x=>`<span class="dl-chip">${escapeHtml(x)}</span>`).join('')}</div><p class="tiny muted">Exact production limits remain grade-, machine-, mould- and site-specific.</p></div></div>`;host.dataset.step=String(stepIndex)}
function finishLab(){const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;const correct=lab.steps.reduce((n,s,i)=>n+(s.choices[answers[i]]?.correct?1:0),0),score=Math.round(correct/lab.steps.length*100),prior=labState(lab.id),firstTry=Number(prior.attempts||0)===1&&!attemptHadError&&score===100;saveLab(lab.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score),firstTry:Boolean(prior.firstTry||firstTry)});const host=ensureSection();host.innerHTML=`<div class="dl-summary card"><div class="eyebrow">Lab complete</div><strong>${score}% · ${correct}/${lab.steps.length} decisions</strong><h2>${escapeHtml(lab.title)}</h2><p class="muted">${score===100?'You followed the evidence through the full reasoning chain.':'Review the missed steps and try again. Learn which evidence supports which mechanism rather than memorising option position.'}</p><div class="dl-actions"><button class="primary" data-dl-home>Choose another lab</button><button class="secondary" data-dl-restart>Practise this lab again</button><button class="ghost" data-dl-back>Back to practice</button></div></div>`}
function handleClick(e){const target=e.target.closest('[data-dl-start],[data-dl-home],[data-dl-back],[data-dl-choice],[data-dl-next],[data-dl-finish],[data-dl-retry-step],[data-dl-restart]');if(!target)return;if(target.dataset.dlStart)return openLab(target.dataset.dlStart);if(target.hasAttribute('data-dl-home'))return renderHome();if(target.hasAttribute('data-dl-back'))return backToPractice();if(target.hasAttribute('data-dl-restart'))return openLab(activeLabId);const host=ensureSection(),stepIndex=Number(host?.dataset.step||0),lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;if(target.dataset.dlChoice!==undefined){const i=Number(target.dataset.dlChoice);answers[stepIndex]=i;if(!lab.steps[stepIndex].choices[i]?.correct)attemptHadError=true;return renderLab(stepIndex)}if(target.hasAttribute('data-dl-retry-step')){answers[stepIndex]=null;return renderLab(stepIndex)}if(target.hasAttribute('data-dl-next'))return renderLab(Math.min(stepIndex+1,lab.steps.length-1));if(target.hasAttribute('data-dl-finish'))return finishLab()}
function openLabs(){style();const host=ensureSection();if(!host)return;hideOtherViews();host.classList.remove('hidden');markNav();setHeader('Diagnostic labs','Practise evidence-first injection moulding troubleshooting.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})}
function install(){style();ensureSection();ensureNav();patchMobileMore();const host=document.getElementById('diagnosticLabs');if(host&&!host.__mmDlClick){host.addEventListener('click',handleClick);host.__mmDlClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
install();window.addEventListener('load',schedule);
window.MM_DIAGNOSTIC_LABS={version:VERSION,labs:LABS,open:openLabs,storage:'learner-scoped local progress only'};
})();