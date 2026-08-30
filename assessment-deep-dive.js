/* MouldMaster assessment deep dive — 2026-08-30 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D||!D.exams||!D.scenarios)throw new Error('MouldMaster assessment data must load before deep-dive patch');

const wrong=(why)=>`Not the best answer. ${why}`;
const q=(question,options,correct,why,reference,url,feedback)=>[question,options,correct,why,reference,url,feedback,false];
function set(level,index,row){if(!D.exams[level]||!D.exams[level][index])throw new Error(`Missing ${level} question ${index}`);D.exams[level][index]=row;}

/* Beginner: every item now requires interpreting evidence, selecting a check, or recognising an evidence limit. */
set('Beginner',0,q(
 'A stable process is being checked during pack/hold. As hold time is increased in controlled steps, part mass initially rises and then reaches a repeatable plateau while fill behaviour and shot delivery remain stable. What does the plateau most strongly support?',
 ['The gate is effectively sealed for the tested condition, so additional hold time is no longer adding measurable material','The non-return valve has failed because part mass stopped increasing','The mould is fully cooled as soon as the mass reaches a plateau','The clamp force is exactly correct because the part mass is stable'],
 0,
 'A repeatable part-mass plateau during a controlled hold-time study supports effective gate seal for that tested condition. It does not by itself diagnose the check valve, cooling completion or exact clamp requirement.',
 'Jansen, Pantani & Titomanlio — holding time and gate freeze effects','https://doi.org/10.1002/pen.10186',
 ['Correct. The evidence supports a gate-seal conclusion for the tested stable condition.',wrong('A mass plateau in this study does not isolate non-return-valve condition.'),wrong('Gate seal and sufficient cooling for ejection are different physical events.'),wrong('Stable mass does not establish the exact clamp-force requirement.')]
));
set('Beginner',1,q(
 'Cushion moves from its normal value on one cycle, but part mass, fill time, transfer position and the next several cycles remain normal. What is the strongest conclusion?',
 ['The non-return valve has definitely failed','The material is definitely wetter than normal','There is not enough evidence to assign a root cause; trend repeated shot-delivery evidence and investigate if the change persists','Increase hold pressure immediately to restore the historical cushion'],
 2,
 'One isolated cushion change is a signal to review, not proof of a specific mechanism. Root-cause confidence increases when cushion changes repeat and align with delivered mass, transfer, injection actuals, recovery or other shot-delivery evidence.',
 'Shot-delivery evidence principle; measured process actuals should be interpreted as a linked pattern',null,
 [wrong('A check-valve problem is possible, but one isolated cushion value does not prove it.'),wrong('Moisture cannot be diagnosed from cushion alone.'),'Correct. Preserve the observation, look for repeatability and linked evidence, and avoid assigning a cause from one scalar value.',wrong('Changing hold pressure can mask the evidence without explaining the isolated cushion change.')]
));
set('Beginner',2,q(
 'The injection-speed setpoint is unchanged, but actual fill time becomes longer and the pressure response also changes. What does this evidence show?',
 ['The saved recipe proves the physical filling process is unchanged','The machine/material response has changed even though the command is the same, so actuals should be compared with the known-good baseline','The quality gauge must be responsible because the speed command did not change','Hold pressure should be changed first because it controls velocity-controlled fill time'],
 1,
 'A setpoint is a command, not proof of the achieved physical response. Real injection-moulding datasets contain measured pressure, flow and other actual channels precisely because the response can move while commands remain unchanged.',
 'AVAPS/scatimdata measured injection-pressure and flow evidence','https://doi.org/10.3390/polym15040978',
 [wrong('Matching commands do not guarantee matching actual process response.'),'Correct. The changed fill-time and pressure actuals are direct evidence that the process response changed.',wrong('A quality gauge cannot cause the machine fill-time and pressure actuals to change.'),wrong('Packing occurs after filling and is not the first explanation for a changed velocity-controlled fill response.')]
));
set('Beginner',3,q(
 'All barrel-zone actual temperatures are at their setpoints, but a correctly performed melt-temperature check is higher than expected. Which explanation is most technically sound?',
 ['The melt-temperature check must be wrong whenever all barrel zones are on setpoint','Actual melt temperature is also influenced by screw work, shear, residence time, throughput and heat transfer','Mould-surface temperature directly determines the polymer temperature inside the barrel','Clamp force is the main reason melt temperature can differ from barrel-zone temperatures'],
 1,
 'Barrel-zone control describes heater-zone conditions, not the complete thermal history of the polymer. Screw work, shear, residence time, throughput and heat transfer can move actual melt temperature away from the displayed zone values.',
 'Injection-moulding thermal-process principle',null,
 [wrong('A valid melt-temperature measurement is independent evidence and should be investigated rather than rejected because the controller is on setpoint.'),'Correct. The polymer receives heat from more than the barrel heaters, and its thermal history depends on the actual process.',wrong('Mould temperature affects the melt after it enters the mould; it does not directly define melt temperature inside the barrel.'),wrong('Clamp force can affect mould opening/flash risk, but it is not the primary mechanism setting melt temperature in the barrel.')]
));
set('Beginner',4,q(
 'A hygroscopic resin is being prepared for production after its material container was open longer than normal. What is the strongest general action before compensating with machine settings?',
 ['Use the same drying time used for any resin in the same polymer family','Verify the exact grade’s current supplier or validated site moisture/drying requirements and check the material condition using the approved method','Increase barrel temperature so any remaining moisture is driven off during plasticising','Extend drying time indefinitely until the surface appearance improves'],
 1,
 'Moisture limits, drying conditions and allowable exposure are grade-specific. The evidence-based response is to verify the applicable material requirement and the actual material condition rather than using a generic family recipe or a machine-setting workaround.',
 'Material-specific processing requirements should be verified against current resin-supplier or validated site data',null,
 [wrong('Materials in the same polymer family can have different additives, moisture limits and drying requirements.'),'Correct. Verify the grade-specific requirement and actual material condition before changing unrelated process settings.',wrong('Higher barrel temperature can worsen degradation in a moisture-sensitive material and is not a moisture-verification method.'),wrong('Drying longer is not automatically better; excessive time or temperature can also damage some materials.')]
));
set('Beginner',5,q(
 'During a process comparison, V/P transfer occurs earlier than the known-good cycle and the cavity-pressure rise changes at the same point. What is the most useful interpretation?',
 ['V/P transfer is only a screen setting, so the pressure response is unrelated','The fill-to-pack transition changed in the physical process; compare the transfer trigger, fill condition and pressure response before compensating elsewhere','The change proves the mould cooling circuit is blocked','Increase screw recovery speed because V/P transfer occurs during plasticising'],
 1,
 'V/P transfer is the transition from velocity-controlled filling to pressure-controlled packing. A changed transfer event together with a changed pressure response is process evidence that should be investigated as a linked fill/pack boundary.',
 'AVAPS/scatimdata measured filling-pressure evidence','https://doi.org/10.3390/polym15040978',
 [wrong('The transfer command affects the physical filling/packing sequence and can change the observed response.'),'Correct. Use the transfer and pressure evidence together to determine how the fill-to-pack boundary changed.',wrong('Cooling restriction is not established by this fill/pack evidence alone.'),wrong('Screw recovery is a different phase from V/P transfer.')]
));
set('Beginner',6,q(
 'Flash appears at one local corner after mould service, while machine clamp behaviour and the other cavities remain stable. What is the strongest first conclusion about clamp force?',
 ['Increase global clamp force because any flash proves clamp force is too low','The local pattern does not by itself prove a global clamp-force shortage; inspect the serviced parting-line/insert area and compare local evidence first','Reduce clamp force because the other cavities are stable','Projected area no longer matters when only one cavity flashes'],
 1,
 'Cavity pressure acting over projected area contributes to mould-opening force, but a new one-location flash after local service is stronger evidence for a local tooling/seating issue than for a global clamp deficit. Check the changed system first.',
 'Injection-moulding clamp/projected-area and local-tooling troubleshooting principles',null,
 [wrong('A global clamp change can hide a local tooling problem and affect every cavity.'),'Correct. The location and timing are discriminating evidence and should be investigated before global compensation.',wrong('Stable cavities do not justify lowering clamp force without a separate capability assessment.'),wrong('Projected area remains part of clamp-force reasoning even though the immediate symptom is local.')]
));
set('Beginner',7,q(
 'A family mould shows one branch filling later after a gate/runner repair, while the other branches remain close to baseline and machine peak pressure rises. What should be checked next?',
 ['The repaired branch geometry and gate/runner restriction using cavity-specific or short-shot evidence','Cooling time for every cavity because the machine pressure rose','Robot take-out timing because one branch fills later','Part inspection only, because the gate is just an opening and does not influence pressure loss'],
 0,
 'The gate and runner form a restricted flow path. A new branch-specific fill delay plus higher pressure after repair points directly to the repaired flow path, so preserve branch/cavity identity and test that restriction hypothesis.',
 'Cavity-pressure and flow-path evidence in injection moulding','https://doi.org/10.1007/s00170-023-11100-1',
 ['Correct. The branch-specific change and repair timing make the local flow path the strongest next check.',wrong('Cooling occurs later and does not first explain a new fill-path pressure loss.'),wrong('Robot timing does not cause a cavity branch to fill later during injection.'),wrong('Gate and runner geometry directly influence shear, pressure loss and filling pattern.')]
));
set('Beginner',8,q(
 'After a mould-water connection problem, one side of the tool runs warmer and the part begins to warp in the same direction while fill time and part mass stay near baseline. Which check is strongest?',
 ['Verify cooling-circuit routing, flow and inlet/outlet temperatures and compare mould thermal balance with the known-good state','Increase packing pressure until warpage disappears','Change injection speed because fill time is already stable','Ignore the thermal evidence because part mass is unchanged'],
 0,
 'The changed cooling system, local thermal imbalance and directional warpage form a coherent evidence chain. Verify the affected circuit and thermal condition before using unrelated process settings as compensation.',
 'Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/',
 ['Correct. This directly tests the system that changed and the mechanism consistent with the warpage direction.',wrong('Packing can influence shrinkage but would be compensation before the known thermal change is verified.'),wrong('Stable fill time makes a filling-speed explanation weaker than the observed cooling change.'),wrong('Stable mass does not rule out differential cooling and shrinkage.')]
));
set('Beginner',9,q(
 'A previously stable part starts failing a critical dimension even though the saved recipe still matches the approved setup sheet. What is the strongest first troubleshooting approach?',
 ['Adjust hold pressure because it directly influences many moulded dimensions','Reload the saved recipe and treat matching setpoints as proof the process is restored','Compare current process actuals, material/thermal condition and measurement evidence with the known-good baseline','Replace the measuring device before checking whether the measurement system actually changed'],
 2,
 'Matching setpoints do not prove that the material, machine, mould thermal state or measurement system is behaving as before. First define what changed by comparing current evidence with the known-good condition.',
 'Injection-moulding troubleshooting principle',null,
 [wrong('Hold pressure may move a dimension, but changing it first can mask the actual cause.'),wrong('A recipe contains commands, not proof that the physical process repeated.'),'Correct. A known-good comparison separates machine, material, mould, method and measurement changes before compensation.',wrong('Measurement should be checked, but replacing equipment before establishing that it changed is not the strongest first step.')]
));

/* Intermediate: distinguish competing mechanisms and choose evidence that can discriminate them. */
set('Intermediate',0,q(
 'During a controlled hold-time study, which result most strongly supports effective gate seal for the tested process condition?',
 ['Cushion remains similar while hold time is increased','Peak injection pressure changes very little as hold time is increased','Part mass reaches a repeatable plateau as hold time is increased under otherwise stable conditions and adequate measurement resolution','The screw finishes recovery before the mould opens'],
 2,
 'If increasing hold time no longer produces a measurable increase in part mass under stable conditions, additional material is no longer being transmitted effectively through the gate. Treat the plateau as study evidence for that process condition, not as a universal gate-freeze time.',
 'Jansen, Pantani & Titomanlio — holding time and gate freeze effects','https://doi.org/10.1002/pen.10186',
 [wrong('Stable cushion supports shot repeatability but does not directly show whether additional hold time is still adding material through the gate.'),wrong('Peak injection pressure is mainly associated with filling and does not directly identify when packing flow through the gate stops.'),'Correct. A repeatable mass plateau is the most direct of these choices, provided the process and measurement are stable.',wrong('Recovery timing is a cycle-sequencing issue and does not demonstrate gate seal.')]
));
set('Intermediate',1,q(
 'A dark mark repeats at the last region to fill. Fill time is stable, the mark is strongly location-specific, and it becomes less severe during a controlled slower end-of-fill test. Which mechanism is best supported for the next inspection?',
 ['Trapped/compressed gas and inadequate local venting','A random dimensional-gauge error','Check-ring leakage during screw recovery','Insufficient cooling after ejection'],
 0,
 'End-of-fill location plus sensitivity to the local filling condition supports a trapped-gas/venting mechanism more strongly than unrelated machine, measurement or cooling explanations. Inspect the vent/gas-escape path and confirm with controlled evidence.',
 'Injection-moulding burn-mark and venting evidence','https://doi.org/10.3390/POLYM13234087',
 ['Correct. Location and controlled speed response make gas compression/venting the strongest supported next mechanism.',wrong('A dimensional gauge does not create a repeatable physical burn mark at end of fill.'),wrong('Check-ring leakage can affect shot delivery but is not the strongest explanation for this location-specific burn evidence.'),wrong('Cooling after filling does not explain the end-of-fill burn pattern as directly.')]
));
set('Intermediate',2,q(
 'Splay increases after a moisture-sensitive material system was open to humid air. Dryer settings still display their usual values, but no current moisture result is available. Which evidence would best discriminate moisture from a filling-related streak mechanism?',
 ['An approved material-moisture check together with drying-air/history evidence, compared with controlled fill observations','A higher hold-pressure trial only','The saved dryer setpoint by itself','Clamp-force history from the same shift'],
 0,
 'The exposure history raises a moisture hypothesis, but a displayed dryer setpoint is not proof of resin condition. Direct moisture/drying evidence combined with controlled process observations is more discriminating than unrelated compensation.',
 'Material-specific drying/moisture and defect-analysis principle',null,
 ['Correct. This directly tests the suspected material condition while retaining process evidence needed to distinguish another streak mechanism.',wrong('Hold pressure occurs after filling and does not directly test material moisture.'),wrong('A dryer command does not prove the material reached or retained the required moisture condition.'),wrong('Clamp force does not discriminate moisture from a filling-related splay mechanism.')]
));
set('Intermediate',3,q(
 'One cavity begins flashing immediately after insert service. Cavity-specific mass and local parting-line evidence change only on that cavity, while overall machine pressure and the other cavities remain stable. What is the strongest next action?',
 ['Inspect insert seating, shutoff/parting-line condition and that cavity’s local pressure/fill evidence before a global process change','Increase clamp force for the whole mould','Reduce hold pressure until the flashing cavity looks acceptable','Average all cavity measurements because the machine uses one shot'],
 0,
 'The cavity-specific change immediately after local service makes a local tooling condition the strongest hypothesis. Global changes can over-correct stable cavities and obscure the maintenance-related cause.',
 'Local tooling fault isolation and cavity-specific evidence principle',null,
 ['Correct. Preserve cavity identity and test the system that changed.',wrong('A global clamp change is weakly targeted when only the serviced cavity changed.'),wrong('Reducing hold can hide flash while altering packing in every cavity.'),wrong('Pooling removes the cavity identity that makes this evidence diagnostically useful.')]
));
set('Intermediate',4,q(
 'During a short-shot cavity-balance study, seven cavities reach a similar fill fraction but one branch consistently lags. What evidence would best separate a local branch restriction from a global material-viscosity shift?',
 ['Repeat cavity-specific fill/pressure evidence while inspecting the lagging runner/gate branch','Increase melt temperature globally and accept the first condition that balances the mould','Use only the average shot weight across all cavities','Increase hold time because packing will reveal the original fill balance'],
 0,
 'A global viscosity shift should tend to affect the shared flow system, whereas a repeatable single-branch lag points toward local resistance or thermal/gate differences. Preserve cavity identity and inspect the lagging path.',
 'In-cavity pressure and failure-diagnosis evidence','https://doi.org/10.1007/s00170-023-11100-1',
 ['Correct. Cavity-specific repetition and local inspection directly discriminate a branch problem from a global shift.',wrong('A global temperature change can compensate for a restriction without identifying it.'),wrong('A pooled mass hides which branch is different.'),wrong('Packing occurs after the filling comparison and can obscure rather than reveal the original balance.')]
));
set('Intermediate',5,q(
 'Cushion and part mass begin varying together on a process that was previously stable. Which investigation is most diagnostic before changing packing pressure?',
 ['Run a longer cooling-time study to see whether part mass stabilises','Check shot delivery, non-return-valve behaviour, feed consistency, transfer and injection actuals','Increase hold time until the average part mass returns to target','Re-zero the dimensional gauge because measurement variation is the most likely cause of cushion variation'],
 1,
 'Simultaneous cushion and part-mass variation points first toward delivered-shot consistency. Investigate the feed/plasticising/shot-delivery path and actuals before using packing pressure to compensate.',
 'Machine/process troubleshooting principle',null,
 [wrong('Cooling can change dimensions and ejection condition, but it does not directly explain varying screw cushion.'),'Correct. This tests the mechanisms most directly connected to both cushion and delivered mass.',wrong('More hold can mask unstable shot delivery and create a different packing condition.'),wrong('A dimensional gauge cannot cause the machine cushion to vary, so it is not the first common-cause hypothesis.')]
));
set('Intermediate',6,q(
 'After an unusually long hot shutdown, black specks appear during restart. Fill pressure and mould cooling are otherwise close to baseline. What recovery evidence would most strongly support degraded/stagnant material as the mechanism?',
 ['The specks reduce through the approved purge/start-up sequence while residence history returns to the validated condition','The specks disappear after increasing clamp force','The average part mass remains unchanged','Cooling time is increased without changing the material in the barrel'],
 0,
 'A symptom that follows excessive hot residence and clears as the material path is safely purged/returned to its validated thermal history supports degradation or stagnant hold-up. Use the approved material-specific purge/start-up procedure rather than adding heat.',
 'Material thermal-history and residence-time principle',null,
 ['Correct. The timing and recovery behaviour align with the suspected degraded/stagnant material mechanism.',wrong('Clamp force does not remove degraded material from the melt path.'),wrong('Stable mass does not rule out degraded contaminants or specks.'),wrong('Longer cooling does not address material that degraded before entering the mould.')]
));
set('Intermediate',7,q(
 'Cooling time is being reduced in controlled steps on a stable moulding process. Which evidence set is strongest for choosing the lower acceptable limit?',
 ['Total cycle time and robot take-out time only','Part mass and peak injection pressure only','Ejection condition plus the critical dimensions, warpage and any relevant appearance/functional criteria after the defined conditioning time','Screw recovery time and cushion only'],
 2,
 'Cooling should be reduced to a validated quality/stability boundary, not merely to the fastest ejection. The relevant evidence is whether the part can be ejected and subsequently meets dimensional, warpage, appearance and functional requirements.',
 'Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/',
 [wrong('Cycle time is the objective, but it does not establish the quality boundary.'),wrong('Mass and filling pressure are useful process signals but do not by themselves demonstrate adequate cooling/ejection stability.'),'Correct. The lower limit must remain inside the part’s actual ejection and quality requirements.',wrong('Recovery and cushion describe plasticising/shot delivery rather than the cooled part’s release and dimensional stability.')]
));
set('Intermediate',8,q(
 'Warpage drifts gradually while cavity fill time, transfer and part mass remain stable. One mould-water return temperature separates from the known-good pattern and local surface temperature follows it. Which test is most discriminating?',
 ['Verify flow, pressure drop and supply/return temperatures on the affected cooling circuit and compare local mould temperature','Increase injection speed because the part is warped','Change shot size because part mass is stable','Adjust the dimensional gauge until the historical mean is restored'],
 0,
 'Stable filling/shot evidence makes a filling-volume explanation weaker, while the cooling-circuit and local-temperature changes align with differential cooling and shrinkage. Verify the thermal circuit before compensation.',
 'Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/',
 ['Correct. The thermal evidence is both changed and physically linked to the observed warpage mechanism.',wrong('Injection speed is not the most targeted test when fill evidence remains stable.'),wrong('Stable mass is evidence against an unexplained shot-volume change being the first hypothesis.'),wrong('Changing the measurement system to force the old mean destroys evidence rather than diagnosing the process.')]
));
set('Intermediate',9,q(
 'When is changing one factor at a time most defensible as an engineering experiment?',
 ['When screening many factors and interactions with the fewest informative runs','For a focused confirmation test where the suspected mechanism is narrow and important interactions are not central to the decision','Whenever the process has automatic data logging, because logging removes confounding','When the experiment cannot be randomised, because one-factor-at-a-time eliminates time drift'],
 1,
 'A one-factor-at-a-time change is useful for focused mechanism confirmation when interactions are not central. When several factors or interactions matter, a suitably designed experiment is usually more informative and efficient.',
 'NIST/SEMATECH e-Handbook — experimental design principles','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm',
 [wrong('Screening many factors and interactions is a classic reason to use a structured DOE rather than OFAT.'),'Correct. OFAT is strongest as a focused diagnostic or confirmation tool, not as a substitute for an interaction-capable design.',wrong('Logging improves records but does not remove confounding or interactions.'),wrong('OFAT can still be confounded with time; lack of randomisation does not make it immune to drift.')]
));

/* Advanced: interpretation under ambiguity, confounding, validation and signal-semantics limits. */
set('Advanced',0,q(
 'A critical dimension has Cp comfortably above the target but Cpk is much lower, the control chart is otherwise stable and the measurement system is adequate. What is the strongest interpretation?',
 ['The process spread may be relatively small but the mean is poorly centred toward one specification limit','The process is unstable because Cp is higher than Cpk','The measurement system must be biased because Cpk is lower','The specification limits should be widened until Cp and Cpk match'],
 0,
 'Cp reflects potential capability from spread, whereas Cpk also reflects centring relative to the nearest specification limit. With stability and measurement adequacy established, a much lower Cpk is evidence to examine process centring rather than redefine the specification.',
 'NIST/SEMATECH e-Handbook — process capability','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm',
 ['Correct. The evidence is consistent with reasonable spread but off-centre operation.',wrong('Cp greater than Cpk does not by itself demonstrate instability.'),wrong('Measurement bias is possible in general, but the question states the measurement system is adequate.'),wrong('Specifications are product requirements, not a tuning variable for capability indices.')]
));
set('Advanced',1,q(
 'A four-cavity mould has an acceptable pooled Cpk, but the cavity-specific means are visibly separated. What is the strongest engineering interpretation?',
 ['The pooled Cpk proves every cavity is capable because all cavities share the same process settings','Cavity-to-cavity structure can be hidden by pooling; check stability, measurement adequacy and cavity-specific or rational-subgroup capability as appropriate','Increase the sample size until the pooled Cpk becomes insensitive to cavity identity','Use Cp instead of Cpk because Cp automatically removes cavity-to-cavity mean differences'],
 1,
 'Capability analysis should reflect the actual process structure. Pooling distinct cavity populations can hide shifts or inflate/obscure variation, so stability, measurement adequacy and rational subgrouping/cavity-specific behaviour should be evaluated before relying on one pooled index.',
 'NIST/SEMATECH e-Handbook — process capability and process stability','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm',
 [wrong('Common settings do not guarantee identical cavity populations or centring.'),'Correct. Preserve cavity identity long enough to determine whether pooling is statistically and engineering-wise defensible.',wrong('More pooled data can estimate the same mixed distribution more precisely without resolving the underlying cavity structure.'),wrong('Cp ignores centring but does not remove or solve a mixture of different cavity populations.')]
));
set('Advanced',2,q(
 'A two-factor moulding study shows that increasing mould temperature improves a dimension at low packing pressure but worsens it at high packing pressure. What is the strongest interpretation?',
 ['There is evidence of an interaction: the effect of mould temperature depends on packing pressure','The mould-temperature main effect alone is sufficient and packing pressure can be ignored','One-factor-at-a-time testing would necessarily reveal the same relationship with fewer runs','The result proves one globally optimal mould temperature for every packing pressure'],
 0,
 'When the response to one factor changes with the level of another factor, the factors interact. A suitable factorial/DOE structure can reveal this relationship; main effects alone can hide it.',
 'NIST/SEMATECH e-Handbook — design of experiments','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm',
 ['Correct. The direction of the temperature effect changes with packing pressure, which is interaction evidence.',wrong('Ignoring the second factor would discard the defining pattern in the data.'),wrong('OFAT is not designed to estimate interactions efficiently.'),wrong('The observed interaction argues against claiming one universal optimum from this result.')]
));
set('Advanced',3,q(
 'In a DOE, every high setting of one factor was run late in the shift and every low setting was run early. The factor appears significant. What is the main interpretation risk?',
 ['The factor effect may be confounded with time-related drift; randomisation or suitable blocking is needed to separate them','The factor is more credible because the run order was consistent','Replication is unnecessary because the factor produced a monotonic response with time','A normal response distribution would prove that time drift did not bias the factor estimate'],
 0,
 'When factor level and run time move together, the estimated factor effect can contain warm-up, material, environmental, tooling or other time-related change. Randomisation and/or blocking are design tools for separating those nuisance effects.',
 'NIST/SEMATECH e-Handbook — experimental design principles','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm',
 ['Correct. The design cannot distinguish the factor from time if they are aligned.',wrong('A consistent but confounded order makes causal interpretation weaker, not stronger.'),wrong('A clean-looking trend does not quantify experimental error or remove the need for replication when replication is required.'),wrong('Distribution shape does not establish that the factor assignment was independent of time-related nuisance changes.')]
));
set('Advanced',4,q(
 'Machine peak injection pressure is stable, but an in-cavity pressure trace changes near end of fill and the affected part feature also changes. Which conclusion is strongest?',
 ['The cavity sensor must be faulty because machine pressure did not move','Machine/nozzle and local cavity pressure are measurements at different locations; investigate the local flow/packing event and sensor health before assuming equivalence','The in-cavity value should be copied directly into the machine pressure setpoint','Stable machine peak pressure proves the polymer experienced the same pressure history everywhere in the cavity'],
 1,
 'Pressure is lost and redistributed through the nozzle, runner, gate and cavity, and a cavity sensor observes one local location. Stable machine pressure therefore does not prove a stable local cavity-pressure history. Investigate both the process event and sensor condition.',
 'Tsou et al. — oil/nozzle/cavity pressure correlation in injection moulding','https://doi.org/10.1515/ipp-2022-4281',
 [wrong('Sensor health is one hypothesis, but location-dependent process change is also physically plausible and must be investigated.'),'Correct. The signals are related but are not interchangeable measurements.',wrong('The signals have different definitions and locations; copying one numeric value into another control variable is not a valid transfer method.'),wrong('Pressure varies spatially and temporally through the flow path, so one stable upstream peak cannot prove the full cavity history repeated.')]
));
set('Advanced',5,q(
 'A proposed process window was mapped in sequence from low to high settings, but the material lot changed halfway through and viscosity-related fill pressure shifted at the same time. Can the boundary be treated as a validated factor window?',
 ['Yes, because every setting was tested once','No. The factor level is confounded with material lot; repeat or redesign the study so the window boundary is separated from the lot change','Yes, if all parts inside specification are pooled','Yes, because a process window is based on settings rather than physical response'],
 1,
 'A useful process window must connect controlled factors to acceptable response boundaries. If factor progression and material lot change together, their effects cannot be separated from this evidence alone.',
 'NIST/SEMATECH e-Handbook — experimental design and confounding','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm',
 [wrong('One observation per condition does not remove the material-lot confounding.'),'Correct. The current evidence is insufficient to assign the boundary to the intended factor independently of lot.'),wrong('Pooling acceptable parts can hide the confounding rather than resolve it.'),wrong('A process window must be linked to achieved physical response and product acceptance, not commands alone.')]
));
set('Advanced',6,q(
 'A DOE model predicts an acceptable dimension at the selected condition, but independent confirmation runs are consistently shifted from the prediction while the measurement system remains adequate. What is the strongest response?',
 ['Accept the model because the original DOE was statistically significant','Treat the confirmation mismatch as evidence that the model/conditions do not yet generalise; investigate drift, omitted factors or model form before release','Change the specification to include the confirmation mean','Average the DOE and confirmation data without preserving which runs were confirmatory'],
 1,
 'Confirmation runs test whether the selected condition reproduces the predicted response outside the runs used to estimate the model. A repeatable mismatch is evidence to investigate the model, nuisance changes or omitted mechanisms.',
 'NIST/SEMATECH e-Handbook — confirmation runs','https://www.itl.nist.gov/div898/handbook/pri/section4/pri46.htm',
 [wrong('Statistical significance in the fitted data does not override failed independent confirmation.'),'Correct. Confirmation is a falsifiable check of the selected model/condition and the mismatch must be explained.',wrong('Specifications are requirements, not a way to rescue an unconfirmed model.'),wrong('Preserving confirmation identity is important evidence about model performance.')]
));
set('Advanced',7,q(
 'A validated mould is moved to a receiving machine with a different screw diameter and different injection-control dynamics. Which transfer strategy provides the strongest evidence of process equivalence?',
 ['Copy the original screw positions, speeds and pressure settings numerically','Match the same percentages of each machine’s rated speed and pressure','Reproduce the relevant material/process outputs—such as fill behaviour, pressure response, transfer condition, melt/thermal state and part quality—on a receiving machine proven capable of doing so','Match total cycle time first and treat the remaining settings as equivalent if the parts look acceptable'],
 2,
 'Different screw geometry, pressure definitions and control dynamics can produce different physical material conditions from similar-looking settings. Transfer should demonstrate that the receiving machine can reproduce the relevant process outputs and product requirements within the approved process strategy.',
 'Injection-moulding process-transfer principle',null,
 [wrong('Screw position and speed values are machine-geometry dependent and are not automatically transferable.'),wrong('Percentage of rated capability does not guarantee the same melt velocity, pressure history or process response.'),'Correct. Transfer the physical process and verified outputs, not merely the recipe numbers.',wrong('Cycle time and appearance alone are insufficient evidence of process equivalence for a validated process.')]
));
set('Advanced',8,q(
 'Two polypropylene grades have similar published MFR values but show different fill-pressure and flow-length behaviour in the same mould. What is the strongest conclusion?',
 ['The pressure difference proves one MFR certificate is incorrect','MFR is measured under specified test conditions and is not a complete description of shear- and temperature-dependent moulding rheology or mouldability','Equal MFR values mean the two grades should use the same injection-speed profile if mould temperature is unchanged','Flow-length differences can only be caused by gate wear when MFR values are similar'],
 1,
 'MFR is useful for a specified test condition, but injection moulding subjects material to different shear rates, pressure, thermal history and geometry. Similar MFR therefore does not guarantee identical mould filling or pressure response.',
 'Hamdi — polypropylene MFR versus injection-moulding flow length','https://doi.org/10.1007/s13367-023-00081-y',
 [wrong('A process difference does not by itself invalidate either standardized MFR result.'),'Correct. MFR is one material descriptor, not a complete moulding rheology curve or mouldability guarantee.',wrong('Similar MFR does not establish equivalent dynamic viscosity across the moulding shear/temperature range.'),wrong('Gate wear is one possible local cause, but it is not the only mechanism consistent with similar MFR and different moulding flow response.')]
));
set('Advanced',9,q(
 'A pressure-loss review has an upstream machine-pressure channel and a cavity-pressure channel, but the upstream export unit/reference definition has not been authoritatively confirmed. What is the strongest engineering conclusion?',
 ['Subtract the two numeric columns because both are labelled pressure','Assume the upstream channel uses the same unit as another machine dataset','There is insufficient evidence for a defensible quantitative pressure-loss calculation until each channel’s location, unit/reference and time alignment are verified','Convert both columns to bar using their average values'],
 2,
 'Pressure-loss calculations require semantically compatible measurements. Similar names or plausible magnitudes are not enough: measurement location, units/reference, signal definition and timing must be established before numeric subtraction is treated as physical evidence.',
 'Tsou et al. — pressure measurements at different moulding-system locations','https://doi.org/10.1515/ipp-2022-4281',
 [wrong('A shared word in the column names does not establish compatible units, references or measurement locations.'),wrong('Semantics from another dataset cannot be transferred without authoritative evidence.'),'Correct. Fail closed on the quantitative claim until signal semantics are established.',wrong('A numerical conversion cannot be inferred from average magnitude.')]
));

/* Scenario deepening: preserve the answer key while replacing weak or operationally unsafe distractors with plausible competing diagnoses. */
const SCENARIO={
 'Fill time drifts but recipe does not':{
  situation:'Over an hour, fill time slowly increases while saved recipe values remain unchanged and no alarm is active.',
  choices:['Increase the injection-speed setpoint until the historical fill time returns','Compare fill-time/pressure actuals, material condition and thermal actuals with the known-good baseline','Increase hold pressure because the part may be under-packed','Treat the unchanged recipe as proof the machine is repeating and investigate inspection first'],correct:1,
  why:'Setpoints do not prove the material or machine response stayed constant. The first diagnostic step is to compare actual process and material/thermal evidence with the known-good state.',
  feedback:[wrong('This can compensate for a changing viscosity, restriction or machine response without identifying it.'),'Correct. It tests the most direct evidence behind a changing fill response.',wrong('Hold occurs after filling and does not explain why velocity-controlled filling itself became slower.'),wrong('An unchanged recipe is only evidence that commands are the same, not that the physical response is the same.')]
 },
 'One cavity becomes light':{
  situation:'In an eight-cavity mould, one cavity gradually loses part mass while the other seven remain stable.',
  choices:['Increase total shot size for all eight cavities','Inspect the affected branch/gate and compare cavity-specific filling/pressure or short-shot evidence before global changes','Increase hold time for every cavity','Treat the average eight-cavity part mass as the primary diagnostic because the machine feeds all cavities from one shot'],correct:1,
  why:'A one-cavity change points first to a local flow-path, gate, vent or thermal condition. Global changes can over-correct the seven stable cavities.',
  feedback:[wrong('A global volume change affects all cavities and can hide the local imbalance.'),'Correct. Preserve cavity identity and investigate the branch that actually changed.',wrong('Longer hold cannot repair a fill-path restriction or imbalance that occurs before packing.'),wrong('A pooled average can hide the exact cavity that is drifting.')]
 },
 'Recovery time becomes erratic':{
  situation:'Screw recovery time becomes erratic and cushion variation appears at the same time, while cooling-water actuals remain stable.',
  choices:['Check feed/material delivery, recovery actuals and shot-delivery consistency','Extend cooling time because the two variations appeared in the same cycle','Increase clamp force to stabilise screw recovery','Treat recovery variation as cosmetic if average part mass is still on target'],correct:0,
  why:'Recovery and cushion changing together point toward feed, plasticising or shot-delivery behaviour and should be investigated before compensating elsewhere.',
  feedback:['Correct. These signals share the feed/plasticising/shot-delivery path.',wrong('Stable cooling evidence and the nature of the two signals make cooling a weaker first hypothesis.'),wrong('Clamp force does not directly control screw recovery.'),wrong('A drifting delivery system can become a quality problem even before the average part mass moves out of target.')]
 },
 'Dimension shifts after water-line work':{
  situation:'A critical dimension shifts immediately after mould-water hoses were disconnected and reconnected during maintenance.',
  choices:['Change hold pressure until the dimension returns to nominal','Verify circuit routing, flow, inlet/outlet temperatures and mould thermal balance against the known-good state','Move V/P transfer because the part dimension changed after maintenance','Wait for a full production shift before checking the cooling circuit'],correct:1,
  why:'The timing strongly implicates the system that was changed. Verify the cooling circuit and thermal state before creating a new packing process.',
  feedback:[wrong('Packing can move dimensions but would be compensation before the changed thermal system is verified.'),'Correct. This directly tests the maintenance-related change and its physical effect.',wrong('Transfer is a filling/packing boundary and is less directly tied to the known maintenance event.'),wrong('A known changed system should be checked promptly rather than allowing more product to run without evidence.')]
 },
 'Part sticks after texture change':{
  situation:'Ejection force rises and local drag marks appear after a new surface texture is added to the mould.',
  choices:['Review draft, texture direction/depth, local cooling, ejection loading and tooling condition','Increase packing pressure because a tighter part always ejects more consistently','Increase initial fill speed so the polymer copies the texture more aggressively','Attribute the problem to robot take-out timing without first checking release from the mould'],correct:0,
  why:'Texture changes the mechanical release condition and can increase required draft/ejection load. Tool geometry, local thermal state and ejection evidence should be reviewed before process compensation.',
  feedback:['Correct. It examines the mechanisms directly changed by the texture and the observed release problem.',wrong('More packing can increase contact/shrink-on-core force and does not diagnose the release geometry.'),wrong('Faster filling can change surface replication but does not establish why the part is mechanically sticking.'),wrong('Robot timing occurs after or during take-out; first establish whether the part is actually releasing correctly from the mould.')]
 },
 'Cpk drops after gauge change':{
  situation:'The moulding process and part measurements appear stable by existing checks, but calculated Cpk drops immediately after a new measurement fixture is introduced.',
  choices:['Change moulding settings until the new Cpk returns to the old value','Re-establish measurement-system adequacy and compare the new fixture with the previous method before interpreting process capability','Increase sample size but keep the new fixture unverified','Widen the specification because the process did not physically change'],correct:1,
  why:'A measurement-system change can alter observed bias and variation. Capability should not be used to tune the moulding process until the measurement system is shown to be adequate.',
  feedback:[wrong('This risks adjusting a stable process to compensate for a measurement change.'),'Correct. Measurement adequacy is a prerequisite for a defensible capability conclusion.',wrong('More measurements from an unverified method do not establish that the method is accurate or repeatable enough.'),wrong('Product specifications are requirements, not a knob for restoring a statistical index.')]
 },
 'DOE result changes by run order':{
  situation:'In a DOE, one factor appears important, but all of its high settings were run late in the shift and all low settings early.',
  choices:['Accept the effect because the high-level runs consistently produced the same direction of response','Treat time as a potential confounder and redesign or analyse the study with appropriate randomisation/blocking','Remove replication because the factor effect is already visually clear','Average the early and late responses without preserving run order'],correct:1,
  why:'Factor level and time are aligned, so drift can be mistaken for a factor effect. The study must separate or account for that nuisance variable.',
  feedback:[wrong('Consistency does not distinguish the factor from a time-related change when they occurred together.'),'Correct. The design must separate factor effect from drift.',wrong('Replication estimates variation; removing it does not solve confounding.'),wrong('Discarding run order removes evidence needed to diagnose the confounding problem.')]
 },
 'Pressure sensor disagrees with machine':{
  situation:'An in-cavity pressure trace changes near end of fill while the machine peak injection pressure remains nearly constant.',
  choices:['Treat the stable machine peak as proof that the cavity pressure sensor is wrong','Recognise that the signals are measured at different locations and investigate the local cavity event plus sensor health','Treat machine peak pressure and local cavity pressure as interchangeable because both use pressure units','Ignore the cavity signal unless part mass has already moved out of specification'],correct:1,
  why:'Machine and local cavity pressure are related but physically different measurements. A local change can occur without a comparable change in the machine peak, and sensor condition should also be verified.',
  feedback:[wrong('A stable upstream signal does not prove a downstream local signal is faulty.'),'Correct. Location, pressure loss and timing matter, and sensor health remains part of the check.',wrong('Equal units do not make signals from different process locations equivalent.'),wrong('A diagnostic signal can reveal process change before a final quality characteristic crosses its limit.')]
 }
};
for(const s of D.scenarios){const p=SCENARIO[s.title];if(p)Object.assign(s,p);}

D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.questionDeepDive={
 reviewed:'30 August 2026',
 examItemsReviewed:57,
 scenariosReviewed:16,
 technicalItemsRewritten:30,
 scenarioItemsRewritten:8,
 regionalAnswerChanges:0,
 designCoverage:{observation:true,decision:true,discrimination:true,verification:true,insufficientEvidence:true},
 principles:[
  'All technical exam items require evidence interpretation, a diagnostic decision, a discriminating test, verification logic or recognition that evidence is insufficient.',
  'Preserve one defensible best answer while making distractors plausible competing mechanisms.',
  'Prefer linked multi-signal evidence over one-value root-cause claims.',
  'Explain why the nearest competing answer is weaker, not only why the keyed answer is right.',
  'Do not equate machine settings with physical process outputs.',
  'Do not infer signal units, references or semantics from names or plausible magnitudes.',
  'Do not treat MFR as a complete moulding rheology description.',
  'Treat cavity pressure as a local measurement, not an interchangeable machine-pressure value.',
  'Treat part-mass plateau as evidence of effective gate seal only under the tested stable condition.',
  'Check measurement adequacy and process structure before capability interpretation.',
  'Use randomisation/blocking and confirmation to challenge experimental conclusions.',
  'Keep legal/safety questions jurisdiction-specific; no regional keyed answer changed in this review.'
 ],
 evidence:[
  ['AVAPS/scatimdata — measured pressure/flow response','https://doi.org/10.3390/polym15040978'],
  ['Jansen, Pantani & Titomanlio — holding time and gate freeze effects','https://doi.org/10.1002/pen.10186'],
  ['Hamdi (2024) — MFR versus injection-moulding flow length','https://doi.org/10.1007/s13367-023-00081-y'],
  ['Tsou et al. (2023) — oil/nozzle/cavity pressure correlation','https://doi.org/10.1515/ipp-2022-4281'],
  ['Araújo et al. (2023) — in-cavity pressure failure diagnosis','https://doi.org/10.1007/s00170-023-11100-1'],
  ['Liew et al. (2022) — barrel/nozzle/cavity sensing','https://doi.org/10.3390/s22134792'],
  ['Zhao et al. — shrinkage and warpage evidence','https://pubmed.ncbi.nlm.nih.gov/35194289/'],
  ['NIST — process capability','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],
  ['NIST — design of experiments','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'],
  ['NIST — confirmation runs','https://www.itl.nist.gov/div898/handbook/pri/section4/pri46.htm'],
  ['ISO 20430:2020','https://www.iso.org/standard/68000.html'],
  ['OSHA 1910.147','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'],
  ['WorkSafe NZ — machine lockouts','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/']
 ]
};
window.MM_QUESTION_DEEP_DIVE={version:'2026-08-30',technicalRewrites:30,scenarioRewrites:8,regionalAnswerChanges:0,allTechnicalEvidenceReasoning:true};
})();