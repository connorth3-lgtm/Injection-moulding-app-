/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: assessment-foundation-runtime-pack.js
 */

/* >>> assessment-100-pass.js */
/* MouldMaster 100-pass data and assessment audit metadata — 2026-08-24 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D)throw new Error('MouldMaster core data must load before assessment audit metadata');
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.reviewed='24 August 2026';
D.assessmentQA.auditVersion='100-pass full data and assessment audit';
D.assessmentQA.scope='12 courses, 120 lessons, 12 core defect records, 30 technical exam items, 27 UK/US/NZ regional safety/compliance items, 40 scenario drills after the assessment-quality expansion, answer keys, rationales, distractor feedback, source links, option shuffling, certification logic and release shipping integrity.';
D.assessmentQA.deepAudit={
  passCount:100,
  auditDate:'24 August 2026',
  technicalQuestions:30,
  regionalQuestions:27,
  totalExamQuestions:57,
  baseScenarios:8,
  addedScenarios:32,
  scenarioDrills:40,
  rules:[
    'One defensible best answer per exam item.',
    'Every regional exam item remains safety-critical.',
    'Runtime option shuffling must preserve the keyed correct answer and its feedback.',
    'A certificate requires at least 80% overall and zero wrong safety-critical regional answers.',
    'Wrong options are assessment distractors, not production or safety instructions.',
    'No assessment teaches a universal resin or machine setpoint as a production rule.',
    'Technical rationales must state mechanism/evidence rather than trial-and-error recipes.',
    'Jurisdiction-specific items must cite the governing regulator, legislation or standards source.',
    'Current law and future commencement dates must be kept separate.',
    'Reference/research layers must not alter live exam questions or answer keys.'
  ],
  sourceStatus:{
    iso20430:'ISO 20430:2020 is published and at ISO stage 90.93 (confirmed; systematic review closed in 2025).',
    bsi20430:'BS EN ISO 20430:2020 is listed by BSI as Current, Under Review.',
    b151:'PLASTICS lists ANSI/PLASTICS B151.1-2017 as published and an active project being reviewed to align with ISO 20430.',
    nzAmendment:'New Zealand Health and Safety at Work Amendment Act 2026 was assented on 9 July 2026 and section 2 sets commencement for 1 April 2027.'
  }
};
D.assessmentQA.passes100='Executable checks are maintained in qa_100_pass.py and documented in sources/ASSESSMENT_AND_DATA_100_PASS_AUDIT.md.';
window.MM_ASSESSMENT_AUDIT_100={version:'2026-08-24',passCount:100,examQuestions:57,scenarioDrills:40};
})();
/* <<< assessment-100-pass.js */

/* >>> assessment-deep-dive.js */
/* MouldMaster assessment deep dive — 2026-08-30 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D?.exams||!D?.scenarios)throw new Error('MouldMaster assessment data must load before deep-dive patch');
const feedback=(options,correct,why)=>options.map((option,i)=>i===correct?`Correct. ${why}`:`Not the best answer. “${option}” does not fit the evidence in this case. ${why}`);
const row=(question,options,correct,why,reference,url)=>[question,options,correct,why,reference,url,feedback(options,correct,why),false];
function set(level,index,item){if(!D.exams?.[level]?.[index])throw new Error(`Missing ${level} question ${index}`);D.exams[level][index]=item;}
const T={
 Beginner:[
  row('A stable process is being checked during pack/hold. As hold time is increased in controlled steps, part mass initially rises and then reaches a repeatable plateau while fill behaviour and shot delivery remain stable. What does the plateau most strongly support?',['Part-mass plateau supports gate seal for this condition','The non-return valve has failed because part mass stopped increasing','The mould is fully cooled as soon as the mass reaches a plateau','The clamp force is exactly correct because the part mass is stable'],0,'A repeatable part-mass plateau during a controlled hold-time study supports effective gate seal for that tested condition. It does not by itself diagnose the check valve, cooling completion or exact clamp requirement.','Jansen, Pantani & Titomanlio — holding time and gate freeze effects','https://doi.org/10.1002/pen.10186'),
  row('Cushion moves from its normal value on one cycle, but part mass, fill time, transfer position and the next several cycles remain normal. What is the strongest conclusion?',['Treat the single cushion change as sufficient evidence of non-return-valve leakage','Treat the unchanged fill time as proof the resin moisture level has increased','Insufficient evidence; trend repeated shot-delivery actuals first','Restore the historical cushion with hold pressure before collecting more evidence'],2,'One isolated cushion change is a signal to review, not proof of a specific mechanism. Root-cause confidence increases when cushion changes repeat and align with delivered mass, transfer, injection actuals, recovery or other shot-delivery evidence.','Shot-delivery evidence principle; measured process actuals should be interpreted as a linked pattern',null),
  row('The injection-speed setpoint is unchanged, but actual fill time becomes longer and the pressure response also changes. What does this evidence show?',['The saved recipe proves the physical filling process is unchanged','The actual fill response changed; compare it with the known-good baseline','The quality gauge must be responsible because the speed command did not change','Hold pressure should be changed first because it controls velocity-controlled fill time'],1,'A setpoint is a command, not proof of the achieved physical response. Measured fill time and pressure actuals show that the machine/material response changed even though the command did not.','AVAPS/scatimdata measured injection-pressure and flow evidence','https://doi.org/10.3390/polym15040978'),
  row('All barrel-zone actual temperatures are at their setpoints, but a correctly performed melt-temperature check is higher than expected. Which explanation is most technically sound?',['The melt-temperature check must be wrong whenever all barrel zones are on setpoint','Shear, screw work, residence and throughput also affect actual melt temperature','Mould-surface temperature directly determines the polymer temperature inside the barrel','Clamp force is the main reason melt temperature can differ from barrel-zone temperatures'],1,'Barrel-zone control describes heater-zone conditions, not the complete thermal history of the polymer. Screw work, shear, residence time, throughput and heat transfer can move actual melt temperature away from displayed zone values.','Injection-moulding thermal-process principle',null),
  row('A hygroscopic resin is being prepared for production after its material container was open longer than normal. What is the strongest general action before compensating with machine settings?',['Use the same drying time used for any resin in the same polymer family','Verify the exact grade’s approved moisture and drying requirement','Increase barrel temperature so any remaining moisture is driven off during plasticising','Extend drying time indefinitely until the surface appearance improves'],1,'Moisture limits, drying conditions and allowable exposure are grade-specific. Verify the applicable material requirement and the actual material condition rather than using a generic family recipe or machine-setting workaround.','Material-specific processing requirements should be verified against current resin-supplier or validated site data',null),
  row('During a process comparison, V/P transfer occurs earlier than the known-good cycle and the cavity-pressure rise changes at the same point. What is the most useful interpretation?',['V/P transfer is only a screen setting, so the pressure response is unrelated','Compare the physical fill-to-pack transition and pressure response first','The change proves the mould cooling circuit is blocked','Increase screw recovery speed because V/P transfer occurs during plasticising'],1,'V/P transfer is the transition from velocity-controlled filling to pressure-controlled packing. A changed transfer event together with a changed pressure response is linked evidence that the fill-to-pack boundary changed.','AVAPS/scatimdata measured filling-pressure evidence','https://doi.org/10.3390/polym15040978'),
  row('Flash appears at one local corner after mould service, while machine clamp behaviour and the other cavities remain stable. What is the strongest first conclusion about clamp force?',['Increase global clamp force because any flash proves clamp force is too low','Inspect the serviced local shutoff before changing global clamp force','Reduce clamp force because the other cavities are stable','Projected area no longer matters when only one cavity flashes'],1,'A new one-location flash after local service is stronger evidence for a local tooling/seating issue than for a global clamp deficit. Check the changed system before global process compensation.','Injection-moulding clamp/projected-area and local-tooling troubleshooting principles',null),
  row('A family mould shows one branch filling later after a gate/runner repair, while the other branches remain close to baseline and machine peak pressure rises. What should be checked next?',['Check the repaired runner/gate branch with cavity-specific fill evidence','Cooling time for every cavity because the machine pressure rose','Robot take-out timing because one branch fills later','Part inspection only, because the gate is just an opening and does not influence pressure loss'],0,'The gate and runner form a restricted flow path. A new branch-specific fill delay plus higher pressure after repair points directly to the repaired flow path, so preserve branch/cavity identity and test that restriction hypothesis.','Cavity-pressure and flow-path evidence in injection moulding','https://doi.org/10.1007/s00170-023-11100-1'),
  row('After a mould-water connection problem, one side of the tool runs warmer and the part begins to warp in the same direction while fill time and part mass stay near baseline. Which check is strongest?',['Verify cooling flow, routing and local mould temperatures','Increase packing pressure until warpage disappears','Change injection speed because fill time is already stable','Ignore the thermal evidence because part mass is unchanged'],0,'The changed cooling system, local thermal imbalance and directional warpage form a coherent evidence chain. Verify the affected circuit and thermal condition before unrelated process compensation.','Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/'),
  row('A previously stable part starts failing a critical dimension even though the saved recipe still matches the approved setup sheet. What is the strongest first troubleshooting approach?',['Adjust hold pressure because it directly influences many moulded dimensions','Reload the saved recipe and treat matching setpoints as proof the process is restored','Compare current process actuals and material condition with the known-good baseline','Replace the measuring device before checking whether the measurement system actually changed'],2,'Matching setpoints do not prove that the material, machine, mould thermal state or measurement system is behaving as before. First define what changed by comparing current evidence with the known-good condition.','Injection-moulding troubleshooting principle',null)
 ],
 Intermediate:[
  row('During a controlled hold-time study, which result most strongly supports effective gate seal for the tested process condition?',['Cushion remains similar while hold time is increased','Peak injection pressure changes very little as hold time is increased','A repeatable part-mass plateau as hold time increases','The screw finishes recovery before the mould opens'],2,'If increasing hold time no longer produces a measurable increase in part mass under stable conditions, additional material is no longer being transmitted effectively through the gate. Treat the plateau as study evidence for that process condition, not as a universal gate-freeze time.','Jansen, Pantani & Titomanlio — holding time and gate freeze effects','https://doi.org/10.1002/pen.10186'),
  row('A dark mark repeats at the last region to fill. Fill time is stable, the mark is strongly location-specific, and it becomes less severe during a controlled slower end-of-fill test. Which mechanism is best supported for the next inspection?',['Trapped gas at the end-of-fill vent','A random dimensional-gauge error','Check-ring leakage during screw recovery','Insufficient cooling after ejection'],0,'End-of-fill location plus sensitivity to the local filling condition supports a trapped-gas/venting mechanism more strongly than unrelated machine, measurement or cooling explanations. Inspect the vent/gas-escape path and confirm with controlled evidence.','Injection-moulding burn-mark and venting evidence','https://doi.org/10.3390/POLYM13234087'),
  row('Splay increases after a moisture-sensitive material system was open to humid air. Dryer settings still display their usual values, but no current moisture result is available. Which evidence would best discriminate moisture from a filling-related streak mechanism?',['Use an approved moisture test, drying history and controlled fill comparison','Use part-mass trend plus a higher hold-pressure trial with the dryer unchanged','Use dryer setpoint/history plus visual inspection without measuring resin moisture','Use clamp-force and mould-temperature history from the same humid-air exposure'],0,'The exposure history raises a moisture hypothesis, but a displayed dryer setpoint is not proof of resin condition. Direct moisture/drying evidence combined with controlled process observations is more discriminating than unrelated compensation.','Material-specific drying/moisture and defect-analysis principle',null),
  row('One cavity begins flashing immediately after insert service. Cavity-specific mass and local parting-line evidence change only on that cavity, while overall machine pressure and the other cavities remain stable. What is the strongest next action?',['Inspect the local insert/shutoff before global process changes','Increase clamp force for the whole mould','Reduce hold pressure until the flashing cavity looks acceptable','Average all cavity measurements because the machine uses one shot'],0,'The cavity-specific change immediately after local service makes a local tooling condition the strongest hypothesis. Global changes can over-correct stable cavities and obscure the maintenance-related cause.','Local tooling fault isolation and cavity-specific evidence principle',null),
  row('During a short-shot cavity-balance study, seven cavities reach a similar fill fraction but one branch consistently lags. What evidence would best separate a local branch restriction from a global material-viscosity shift?',['Compare cavity-specific fill evidence with the lagging runner/gate branch','Increase melt temperature globally and accept the first condition that balances the mould','Use only the average shot weight across all cavities','Increase hold time because packing will reveal the original fill balance'],0,'A global viscosity shift should tend to affect the shared flow system, whereas a repeatable single-branch lag points toward local resistance or thermal/gate differences. Preserve cavity identity and inspect the lagging path.','In-cavity pressure and failure-diagnosis evidence','https://doi.org/10.1007/s00170-023-11100-1'),
  row('Cushion and part mass begin varying together on a process that was previously stable. Which investigation is most diagnostic before changing packing pressure?',['Run a longer cooling-time study to see whether part mass stabilises','Check shot delivery, non-return-valve behaviour, feed consistency, transfer and injection actuals','Increase hold time until the average part mass returns to target','Re-zero the dimensional gauge because measurement variation is the most likely cause of cushion variation'],1,'Simultaneous cushion and part-mass variation points first toward delivered-shot consistency. Investigate the feed/plasticising/shot-delivery path and actuals before using packing pressure to compensate.','Machine/process troubleshooting principle',null),
  row('After an unusually long hot shutdown, black specks appear during restart. Fill pressure and mould cooling are otherwise close to baseline. What recovery evidence would most strongly support degraded/stagnant material as the mechanism?',['Specks clear through the approved purge/start-up sequence','The specks disappear after increasing clamp force','The average part mass remains unchanged','Cooling time is increased without changing the material in the barrel'],0,'A symptom that follows excessive hot residence and clears as the material path is safely purged and returned to its validated thermal history supports degradation or stagnant hold-up. Use the approved material-specific purge/start-up procedure.','Material thermal-history and residence-time principle',null),
  row('Cooling time is being reduced in controlled steps on a stable moulding process. Which evidence set is strongest for choosing the lower acceptable limit?',['Total cycle time and robot take-out time only','Part mass and peak injection pressure only','Ejection, dimensions, warpage and function','Screw recovery time and cushion only'],2,'Cooling should be reduced to a validated quality/stability boundary, not merely to the fastest ejection. The evidence is whether the part can be ejected and subsequently meets dimensional, warpage, appearance and functional requirements.','Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/'),
  row('Warpage drifts gradually while cavity fill time, transfer and part mass remain stable. One mould-water return temperature separates from the known-good pattern and local surface temperature follows it. Which test is most discriminating?',['Check affected-circuit flow and local mould temperatures','Increase injection speed because the part is warped','Change shot size because part mass is stable','Adjust the dimensional gauge until the historical mean is restored'],0,'Stable filling/shot evidence makes a filling-volume explanation weaker, while the cooling-circuit and local-temperature changes align with differential cooling and shrinkage. Verify the thermal circuit before compensation.','Zhao et al. — shrinkage/warpage and interacting moulding parameters','https://pubmed.ncbi.nlm.nih.gov/35194289/'),
  row('When is changing one factor at a time most defensible as an engineering experiment?',['When screening many factors and interactions with the fewest informative runs','For a focused confirmation where interactions are not central','Whenever the process has automatic data logging, because logging removes confounding','When the experiment cannot be randomised, because one-factor-at-a-time eliminates time drift'],1,'A one-factor-at-a-time change is useful for focused mechanism confirmation when interactions are not central. When several factors or interactions matter, a suitably designed experiment is usually more informative and efficient.','NIST/SEMATECH e-Handbook — experimental design principles','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm')
 ],
 Advanced:[
  row('A critical dimension has Cp comfortably above the target but Cpk is much lower, the control chart is otherwise stable and the measurement system is adequate. What is the strongest interpretation?',['The process is relatively tight but poorly centred','The process is unstable because Cp is higher than Cpk','The measurement system must be biased because Cpk is lower','The specification limits should be widened until Cp and Cpk match'],0,'Cp reflects potential capability from spread, whereas Cpk also reflects centring relative to the nearest specification limit. With stability and measurement adequacy established, a much lower Cpk is evidence to examine process centring rather than redefine the specification.','NIST/SEMATECH e-Handbook — process capability','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'),
  row('A four-cavity mould has an acceptable pooled Cpk, but the cavity-specific means are visibly separated. What is the strongest engineering interpretation?',['The pooled Cpk proves every cavity is capable because all cavities share the same process settings','Check cavity-specific or rational-subgroup capability, not only pooled Cpk','Increase the sample size until the pooled Cpk becomes insensitive to cavity identity','Use Cp instead of Cpk because Cp automatically removes cavity-to-cavity mean differences'],1,'Capability analysis should reflect actual process structure. Pooling distinct cavity populations can hide shifts or variation, so stability, measurement adequacy and cavity-specific or rational-subgroup behaviour should be evaluated before relying on one pooled index.','NIST/SEMATECH e-Handbook — process capability and process stability','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'),
  row('A two-factor moulding study shows that increasing mould temperature improves a dimension at low packing pressure but worsens it at high packing pressure. What is the strongest interpretation?',['The factors interact; mould-temperature effect depends on packing pressure','The mould-temperature main effect alone is sufficient and packing pressure can be ignored','One-factor-at-a-time testing would necessarily reveal the same relationship with fewer runs','The result proves one globally optimal mould temperature for every packing pressure'],0,'When the response to one factor changes with the level of another factor, the factors interact. A suitable factorial/DOE structure can reveal this relationship; main effects alone can hide it.','NIST/SEMATECH e-Handbook — design of experiments','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'),
  row('In a DOE, every high setting of one factor was run late in the shift and every low setting was run early. The factor appears significant. What is the main interpretation risk?',['Run order may confound the factor with time drift; randomise or block','The factor is more credible because the run order was consistent','Replication is unnecessary because the factor produced a monotonic response with time','A normal response distribution would prove that time drift did not bias the factor estimate'],0,'When factor level and run time move together, the estimated factor effect can contain warm-up, material, environmental, tooling or other time-related change. Randomisation or suitable blocking is needed to separate nuisance effects.','NIST/SEMATECH e-Handbook — experimental design principles','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'),
  row('Machine peak injection pressure is stable, but an in-cavity pressure trace changes near end of fill and the affected part feature also changes. Which conclusion is strongest?',['The cavity sensor must be faulty because machine pressure did not move','Treat machine/nozzle and cavity pressure as different-location signals','The in-cavity value should be copied directly into the machine pressure setpoint','Stable machine peak pressure proves the polymer experienced the same pressure history everywhere in the cavity'],1,'Pressure is lost and redistributed through the nozzle, runner, gate and cavity, and a cavity sensor observes one local location. Stable machine pressure does not prove a stable local cavity-pressure history; investigate the process event and sensor condition.','Tsou et al. — oil/nozzle/cavity pressure correlation in injection moulding','https://doi.org/10.1515/ipp-2022-4281'),
  row('A proposed process window was mapped in sequence from low to high settings, but the material lot changed halfway through and viscosity-related fill pressure shifted at the same time. Can the boundary be treated as a validated factor window?',['Yes; one completed run at each setting is enough even though the material lot changed','No; lot and factor are confounded, so repeat or redesign to separate their effects','Yes; pool all in-specification parts and treat the lot change as normal process noise','Yes; settings define the process window even if viscosity-related response changed'],1,'A useful process window must connect controlled factors to acceptable response boundaries. If factor progression and material lot change together, their effects cannot be separated from this evidence alone.','NIST/SEMATECH e-Handbook — experimental design and confounding','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'),
  row('A DOE model predicts an acceptable dimension at the selected condition, but independent confirmation runs are consistently shifted from the prediction while the measurement system remains adequate. What is the strongest response?',['Accept the model because the original DOE was statistically significant','Treat the failed confirmation as evidence the model does not yet generalise','Change the specification to include the confirmation mean','Average the DOE and confirmation data without preserving which runs were confirmatory'],1,'Confirmation runs test whether the selected condition reproduces the predicted response outside the runs used to estimate the model. A repeatable mismatch is evidence to investigate the model, nuisance changes or omitted mechanisms.','NIST/SEMATECH e-Handbook — confirmation runs','https://www.itl.nist.gov/div898/handbook/pri/section4/pri46.htm'),
  row('A validated mould is moved to a receiving machine with a different screw diameter and different injection-control dynamics. Which transfer strategy provides the strongest evidence of process equivalence?',['Copy the original screw positions, speeds and pressure settings numerically','Match the same percentages of each machine’s rated speed and pressure','Reproduce the relevant material/process outputs—such as fill behaviour, pressure response, transfer condition, melt/thermal state and part quality—on a receiving machine proven capable of doing so','Match total cycle time first and treat the remaining settings as equivalent if the parts look acceptable'],2,'Different screw geometry, pressure definitions and control dynamics can produce different physical material conditions from similar-looking settings. Transfer should demonstrate that the receiving machine reproduces the relevant process outputs and product requirements.','Injection-moulding process-transfer principle',null),
  row('Two polypropylene grades have similar published MFR values but show different fill-pressure and flow-length behaviour in the same mould. What is the strongest conclusion?',['The pressure difference proves one MFR certificate is incorrect','MFR does not fully describe moulding rheology or mouldability','Equal MFR values mean the two grades should use the same injection-speed profile if mould temperature is unchanged','Flow-length differences can only be caused by gate wear when MFR values are similar'],1,'MFR is useful for a specified test condition, but injection moulding subjects material to different shear rates, pressure, thermal history and geometry. Similar MFR does not guarantee identical mould filling or pressure response.','Hamdi — polypropylene MFR versus injection-moulding flow length','https://doi.org/10.1007/s13367-023-00081-y'),
  row('A pressure-loss review has an upstream machine-pressure channel and a cavity-pressure channel, but the upstream export unit/reference definition has not been authoritatively confirmed. What is the strongest engineering conclusion?',['Subtract the two numeric columns because both are labelled pressure','Assume the upstream channel uses the same unit as another machine dataset','Insufficient evidence until location, units and timing are verified','Convert both columns to bar using their average values'],2,'Pressure-loss calculations require semantically compatible measurements. Similar names or plausible magnitudes are not enough: location, units/reference, signal definition and timing must be established before numeric subtraction is treated as physical evidence.','Tsou et al. — pressure measurements at different moulding-system locations','https://doi.org/10.1515/ipp-2022-4281')
 ]
};
for(const [level,items] of Object.entries(T))items.forEach((item,i)=>set(level,i,item));
const SCENARIO={
 "Cushion suddenly varies":["A stable job begins showing cushion variation and part-mass variation, while the barrel setpoints have not changed.",["Run a gate-seal study first", "Check shot-delivery/NRV, feed and injection actuals", "Focus first on mould-water balance", "Change hold pressure and judge the result by part mass"],1,"Cushion and part-mass variation together point first toward delivered-shot consistency. Check the shot-delivery mechanism and actuals before compensating with hold pressure."],
 "Burn at end of fill":["A dark burn appears consistently at the last place to fill. The location is repeatable from cycle to cycle.",["Inspect end-of-fill venting and test fill-speed sensitivity", "Treat residence time as the only possible mechanism", "Change mould temperature first without checking the burn location mechanism", "Start with a gate-seal study"],0,"A repeatable end-of-fill burn strongly supports trapped/compressed gas or a locally aggressive filling condition. Confirm with vent inspection and a controlled speed study."],
 "Flash after tool change":["A mould that previously ran clean begins flashing on one local corner immediately after maintenance; the rest of the parting line is unchanged.",["Inspect local parting-line/insert seating", "Reduce pack/hold pressure and accept the first setting that removes visible flash", "Change melt temperature first", "Run a cooling-time study first"],0,"The timing and localised location point first toward tooling/seating. Process changes could hide the symptom without fixing the cause."],
 "Long cycle, stable quality":["Quality is stable, cooling occupies most of the cycle, and the part is being ejected well below the historical temperature/quality limit.",["Study cooling time against ejection and part quality", "Reduce hold time first regardless of gate-seal behaviour", "Increase fill speed to reduce total cycle time", "Change mould-water temperature and cooling time together"],0,"Cooling is the dominant opportunity. A controlled cooling study links cycle reduction to the actual ejection-quality limit."],
 "Splay after humid-air exposure":["Silver streaks increase on a moisture-sensitive resin after the material-handling system was open to humid air.",["Verify drying history and actual material moisture", "Change fill speed first to see whether appearance improves", "Change mould temperature first", "Increase hold pressure and compare surface appearance"],0,"The material-history change makes moisture the highest-priority hypothesis to verify before compensating with unrelated process settings."],
 "Pressure rise after runner repair":["A family mould shows one branch filling later and peak injection pressure increases immediately after a runner repair.",["Run a cavity-balance study and inspect the repaired runner", "Change cooling time first", "Increase melt temperature until the pressure returns to its old value", "Rebalance hold pressure between cavities"],0,"The timing, pressure change and branch asymmetry point toward flow balance or a new restriction in the repaired runner."],
 "Dimension drifts by shift":["A critical dimension shifts between day and night shift, but the saved recipe values are identical.",["Trend cooling, material, process and measurement evidence by shift", "Assume the recipe proves the process is identical and investigate inspection only", "Change shot size on the shift with the larger dimension", "Change hold pressure until both shifts average the same dimension"],0,"Identical setpoints do not prove identical thermal conditions, actual machine response, material state or measurement practice."],
 "Sink remains after gate seal":["During a controlled hold-time study, part mass reaches a repeatable plateau, but sink over a thick boss remains.",["Continue extending hold time beyond the confirmed plateau", "Check local gate, geometry and cooling after gate seal", "Increase injection speed first", "Change screw recovery settings first"],1,"Once the part-mass plateau indicates effective gate seal under the tested condition, additional hold time will not transmit more material through that gate. The remaining mechanism needs to be sought in geometry, gate effectiveness and local thermal/packing behaviour."],
 'Fill time drifts but recipe does not':['Over an hour, fill time slowly increases while saved recipe values remain unchanged and no alarm is active.',['Increase the injection-speed setpoint until the historical fill time returns','Compare current fill/pressure, material and thermal actuals with baseline','Increase hold pressure because the part may be under-packed','Treat the unchanged recipe as proof the machine is repeating and investigate inspection first'],1,'Setpoints do not prove the material or machine response stayed constant. Compare actual process and material/thermal evidence with the known-good state.'],
 'One cavity becomes light':['In an eight-cavity mould, one cavity gradually loses part mass while the other seven remain stable.',['Increase total shot size for all eight cavities','Inspect the affected branch/gate using cavity-specific fill evidence','Increase hold time for every cavity','Treat the average eight-cavity part mass as the primary diagnostic because the machine feeds all cavities from one shot'],1,'A one-cavity change points first to a local flow-path, gate, vent or thermal condition. Preserve cavity identity before global changes.'],
 'Recovery time becomes erratic':['Screw recovery time becomes erratic and cushion variation appears at the same time, while cooling-water actuals remain stable.',['Check feed, recovery actuals and shot-delivery repeatability','Extend cooling time because the two variations appeared in the same cycle','Increase clamp force to stabilise screw recovery','Treat recovery variation as cosmetic if average part mass is still on target'],0,'Recovery and cushion changing together point toward feed, plasticising or shot-delivery behaviour and should be investigated before compensating elsewhere.'],
 'Dimension shifts after water-line work':['A critical dimension shifts immediately after mould-water hoses were disconnected and reconnected during maintenance.',['Change hold pressure until the dimension returns to nominal','Verify cooling routing, flow and thermal balance against baseline','Move V/P transfer because the part dimension changed after maintenance','Wait for a full production shift before checking the cooling circuit'],1,'The timing strongly implicates the system that was changed. Verify the cooling circuit and thermal state before creating a new packing process.'],
 'Part sticks after texture change':['Ejection force rises and local drag marks appear after a new surface texture is added to the mould.',['Review draft, texture, cooling, ejection load and tooling condition','Increase packing pressure because a tighter part always ejects more consistently','Increase initial fill speed so the polymer copies the texture more aggressively','Attribute the problem to robot take-out timing without first checking release from the mould'],0,'Texture changes the mechanical release condition and can increase required draft/ejection load. Review tool geometry, local thermal state and ejection evidence before compensation.'],
 'Cpk drops after gauge change':['The moulding process appears stable by existing checks, but calculated Cpk drops immediately after a new measurement fixture is introduced.',['Change moulding settings until the new Cpk returns to the old value','Verify the new measurement fixture before interpreting Cpk','Increase sample size but keep the new fixture unverified','Widen the specification because the process did not physically change'],1,'A measurement-system change can alter observed bias and variation. Capability should not be used to tune the process until the measurement system is shown to be adequate.'],
 'DOE result changes by run order':['In a DOE, one factor appears important, but all of its high settings were run late in the shift and all low settings early.',['Accept the effect because the high-level runs consistently produced the same direction of response','Treat run order as a confounder; randomise/block the study','Remove replication because the factor effect is already visually clear','Average the early and late responses without preserving run order'],1,'Factor level and time are aligned, so drift can be mistaken for a factor effect. The study must separate or account for that nuisance variable.'],
 'Pressure sensor disagrees with machine':['An in-cavity pressure trace changes near end of fill while the machine peak injection pressure remains nearly constant.',['Treat the stable machine peak as proof that the cavity pressure sensor is wrong','Treat pressures as different-location signals; check the cavity event and sensor','Treat machine peak pressure and local cavity pressure as interchangeable because both use pressure units','Ignore the cavity signal unless part mass has already moved out of specification'],1,'Machine and local cavity pressure are related but physically different measurements. A local change can occur without a comparable change in the machine peak, and sensor condition should also be verified.']
};
for(const s of D.scenarios){const p=SCENARIO[s.title];if(!p)continue;const [situation,choices,correct,why]=p;Object.assign(s,{situation,choices,correct,why,feedback:feedback(choices,correct,why)});}
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.questionDeepDive={reviewed:'30 August 2026',examItemsReviewed:57,scenariosReviewed:16,technicalItemsRewritten:30,scenarioItemsRewritten:16,regionalAnswerChanges:0,designCoverage:{observation:true,decision:true,discrimination:true,verification:true,insufficientEvidence:true},principles:['All technical exam items require evidence interpretation, a diagnostic decision, a discriminating test, verification logic or recognition that evidence is insufficient.','Preserve one defensible best answer while making distractors plausible competing mechanisms.','Prefer linked multi-signal evidence over one-value root-cause claims.','Do not equate machine settings with physical process outputs.','Do not infer signal units, references or semantics from names or plausible magnitudes.','Keep regional safety/compliance keys jurisdiction-specific and unchanged in the regional deep-dive layer.']};
window.MM_QUESTION_DEEP_DIVE={version:'2026-08-30',technicalRewrites:30,scenarioRewrites:16,regionalAnswerChanges:0,allTechnicalEvidenceReasoning:true};
})();
/* <<< assessment-deep-dive.js */

/* >>> assessment-answer-cue-fix.js */
/* MouldMaster assessment answer-cue and regional hardening — 2026-08-30 */
(function(){
'use strict';
const D=window.MM_DATA;
const transfer=D?.exams?.Advanced?.[7];
if(!Array.isArray(transfer)||!Array.isArray(transfer[1])||transfer[1].length!==4||transfer[2]!==2)throw new Error('Advanced process-transfer question shape changed');
transfer[1][2]='Match validated physical process outputs on a capable receiving machine';

if(!D?.regionalQuestions)throw new Error('Regional assessment data must load before regional hardening');
const regionalRow=(question,options,correct,why,reference,url)=>[
 question,options,correct,why,reference,url,
 options.map((option,i)=>i===correct?`Correct. ${why}`:`Not the best answer. “${option}” does not satisfy the cited requirement for this case. ${why}`),
 true
];
function regionalSet(region,level,index,item){
 const current=D.regionalQuestions?.[region]?.[level]?.[index];
 if(!current)throw new Error(`Missing regional question ${region}/${level}/${index}`);
 if(Number(current[2])!==Number(item[2]))throw new Error(`Regional key changed for ${region}/${level}/${index}`);
 D.regionalQuestions[region][level][index]=item;
}
const R={
 UK:{
  Beginner:[
   regionalRow('An operator can reach a moving dangerous part when an access door is open. Which response best follows the UK guarding hierarchy?',['Rely on training because the danger is visible','Use a warning label and keep the door usable during cycling','Prevent access or stop dangerous movement before access','Allow access if the cycle is normally automatic'],2,'PUWER Regulation 11 requires effective measures to prevent access to dangerous parts or to stop dangerous movement before a person can reach it. Training and warnings do not replace suitable guarding where access to danger is possible.','PUWER 1998 Regulation 11 — dangerous parts of machinery','https://www.legislation.gov.uk/uksi/1998/2306/regulation/11'),
   regionalRow('During start-up, the operator-gate interlock has been defeated so production can continue. What is the strongest action?',['Continue only at reduced injection speed','Post a second operator at the gate','Use an emergency stop as the replacement safeguard','Stop normal use until the interlock is restored'],3,'A defeated operator-gate interlock removes a primary safeguarding function. Normal production should not continue by substituting speed reduction, supervision or an emergency stop for the required protective function.','HSE plastics-processing machinery safety guidance','https://www.hse.gov.uk/pubns/plasindx.htm'),
   regionalRow('A new polymer grade produces visible fume and odour during purging. What is the most defensible UK response?',['Assess the fume hazard and apply the relevant exposure controls','Assume the fume is safe if the barrel is inside the supplier temperature range','Use odour strength as the exposure limit','Ignore the fume if the purge lasts less than five minutes'],0,'Plastics-processing fume must be assessed and controlled; odour or a nominal process temperature does not establish safe exposure. The applicable legal framework depends on the UK jurisdiction and the substance/process involved.','HSE PPIS13 — Controlling fume during plastics processing','https://www.hse.gov.uk/pubns/ppis13.htm')
  ],
  Intermediate:[
   regionalRow('A UK-wide training sheet says “PUWER 1998 applies identically in Great Britain and Northern Ireland.” What is the best correction?',['Keep it unchanged because PUWER numbering is identical everywhere','Use GB PUWER 1998 or NI 1999 rules according to jurisdiction','Replace both with ISO 20430 because standards supersede workplace law','Use only the machinery manufacturer manual because workplace regulations are optional'],1,'Great Britain uses the Provision and Use of Work Equipment Regulations 1998, while Northern Ireland has the Provision and Use of Work Equipment Regulations (Northern Ireland) 1999. Training should identify the applicable jurisdiction rather than treating them as one instrument.','Provision and Use of Work Equipment Regulations (Northern Ireland) 1999','https://www.legislation.gov.uk/nisr/1999/305/made'),
   regionalRow('Maintenance requires a guard to be removed and exposes electrical, hydraulic, pneumatic and stored mechanical energy. What is the strongest UK control before the work starts?',['Press the emergency stop and begin work','Ask the operator to stand at the controls','Isolate all energy and verify safe state before access','Reduce pressure settings but leave power available for convenience'],2,'PUWER isolation duties require suitable means to isolate equipment from all sources of energy where necessary for safety. Maintenance access should use the authorised isolation procedure and address stored as well as supplied energy.','PUWER 1998 Regulation 19 — isolation from sources of energy','https://www.legislation.gov.uk/uksi/1998/2306/regulation/19'),
   regionalRow('A validation team says ISO 20430:2020 certification means workplace PUWER duties no longer need to be considered. What is the strongest interpretation?',['Correct, because an ISO standard replaces national workplace law','Correct only for new machines','Correct if the CE/UKCA documentation is complete','Incorrect: ISO 20430 does not replace workplace law'],3,'A machinery safety standard can support design and risk-control decisions, but it does not displace the employer/user duties imposed by applicable workplace legislation such as PUWER.','BS EN ISO 20430:2020 — injection moulding machine safety requirements','https://knowledge.bsigroup.com/products/plastics-and-rubber-machines-injection-moulding-machines-safety-requirements-1')
  ],
  Advanced:[
   regionalRow('A robot and conveyor are added to an existing injection-moulding machine. Which UK assessment approach is strongest before production release?',['Assess the integrated cell and all foreseeable access/tasks as one system','Assess only the robot because the moulding machine was previously approved','Assess only normal automatic production, not setup or recovery tasks','Rely on the individual suppliers’ declarations without checking the integrated hazards'],0,'PUWER applies to work equipment as used. Integration can create new trapping, access, sequencing and intervention hazards, so the combined system and foreseeable tasks need to be assessed rather than relying on component status alone.','HSE — PUWER overview','https://www.hse.gov.uk/work-equipment-machinery/puwer-overview.htm'),
   regionalRow('A machine has current conformity documentation and was designed to ISO 20430. What is the strongest conclusion about the employer’s UK workplace duties?',['The employer has no further machinery duties once conformity documentation exists','Conformity evidence does not remove the employer’s workplace duties','Only the resin supplier remains responsible for safe use','Workplace duties apply only after a machine has been modified'],1,'Product conformity and standards are relevant evidence, but the dutyholder still has workplace obligations for the way equipment is selected, installed, used and maintained.','HSE — PUWER overview','https://www.hse.gov.uk/work-equipment-machinery/puwer-overview.htm'),
   regionalRow('A DOE proposal says a guard interlock must be defeated so an engineer can observe the mould area during automatic cycling. What is the strongest response?',['Accept it if the DOE is statistically important','Accept it with a second observer','Redesign the DOE without defeating safeguards','Use a lower clamp force as the safety control'],2,'Experimental objectives do not justify defeating required safeguarding. The study should be redesigned so measurements or observation are obtained without exposing people to dangerous parts.','PUWER 1998 Regulation 11 — dangerous parts of machinery','https://www.legislation.gov.uk/uksi/1998/2306/regulation/11')
  ]
 },
 US:{
  Beginner:[
   regionalRow('A horizontal injection-moulding machine exposes a point of operation that an operator could reach during the cycle. What is the strongest OSHA-based requirement?',['A painted floor line is sufficient','Experienced operators may work without a guard','A warning sign is enough if the cycle is fast','Use effective point-of-operation guarding'],3,'OSHA 29 CFR 1910.212 requires one or more guarding methods to protect operators and other employees from hazards such as point-of-operation exposure.','OSHA 29 CFR 1910.212 — general machine guarding','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212'),
   regionalRow('The operator gate interlock on an injection-moulding machine is bypassed after a fault. What is the strongest action?',['Keep the gate/interlock effective in production','Run only small parts until maintenance arrives','Use the emergency stop instead of the gate interlock','Allow experienced operators to reach in between cycles'],0,'The operator gate and interlocks are protective functions. A bypassed safeguard is not made acceptable by operator experience, smaller parts or relying on an emergency stop.','OSHA Injection Molding eTool — operator gate and interlocks','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'),
   regionalRow('A new purge compound is introduced and employees may be exposed to its hazards. What should be checked first under the federal Hazard Communication framework?',['Whether the cycle time changes','Use HazCom labels, SDS and training','Whether the compound improves colour change','Only the supplier invoice'],1,'OSHA 1910.1200 requires hazard communication elements such as classification information, labels, safety data sheets and employee information/training for hazardous chemicals in the workplace.','OSHA 29 CFR 1910.1200 — Hazard Communication','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200')
  ],
  Intermediate:[
   regionalRow('A stuck part must be cleared from inside the danger zone and the task can expose hazardous electrical, hydraulic or stored energy. Which federal OSHA control is strongest when 1910.147 applies?',['Press cycle stop and reach in','Use the operator gate only','Apply LOTO before servicing access','Ask a second employee to watch the controls'],2,'When servicing or maintenance can expose employees to unexpected energisation, start-up or release of stored energy, 29 CFR 1910.147 requires hazardous-energy control according to the standard and the employer’s procedure.','OSHA 29 CFR 1910.147 — control of hazardous energy','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'),
   regionalRow('An emergency stop has been pressed, but hydraulic and stored mechanical energy remain. What is the strongest conclusion before servicing?',['The emergency stop is equivalent to lockout/tagout','The machine is safe because motion has stopped','Only electrical energy matters under lockout/tagout','Emergency stop is not energy isolation; apply LOTO'],3,'Stopping motion is not the same as isolating hazardous energy. Servicing controls must address the energy sources and stored energy covered by the applicable energy-control procedure.','OSHA 29 CFR 1910.147 — control of hazardous energy','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'),
   regionalRow('A safety engineer asks how ANSI/PLASTICS B151.1-2017 should be treated in a US machine-safety review. Which answer is strongest?',['B151.1 informs controls; OSHA duties still apply','It is federal law and automatically replaces OSHA regulations','It applies only to resin suppliers','It makes machine-specific risk assessment unnecessary'],0,'B151.1 is an industry machinery-safety standard rather than a substitute for applicable OSHA requirements. It can inform the state of practice while legal and machine-specific duties remain controlling.','PLASTICS Industry Association — Machinery Safety Standards Committee','https://www.plasticsindustry.org/advocacy/codes-standards/machinery-safety-standards-committee/')
  ],
  Advanced:[
   regionalRow('A company operates injection-moulding plants in several US states. What is the strongest approach before applying one safety-compliance assumption to every site?',['Use only federal OSHA because State Plans cannot differ','Apply the governing federal OSHA or State Plan rules','Use the least restrictive rule found across the sites','Use the machine supplier’s home-state rules everywhere'],1,'OSHA-approved State Plans operate in many jurisdictions and must be at least as effective as federal OSHA; site-specific jurisdiction therefore matters when determining the applicable requirements.','OSHA — State Plans','https://www.osha.gov/stateplans'),
   regionalRow('A technician argues that a quick in-cycle adjustment automatically qualifies for OSHA’s minor-servicing exception to lockout/tagout. What is the strongest interpretation?',['Any task under five minutes qualifies','Any task done by a skilled technician qualifies','Only when narrow criteria and alternative protection are met','The exception applies whenever an emergency stop is within reach'],2,'The minor-servicing exception in 1910.147(a)(2)(ii) is conditional, not a general “quick task” exemption. The required criteria and effective alternative protective measures must be satisfied.','OSHA 29 CFR 1910.147(a)(2)(ii) — minor servicing exception','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'),
   regionalRow('A robot is integrated with the injection-moulding machine and shares access gates and sequence controls. Which safety review is strongest?',['Review only the robot program','Review only the moulding machine operator gate','Treat the two machines as independent because each has its own controller','Assess and safeguard the integrated robot/moulding cell as one system'],3,'Integration can create hazards at the interfaces between the robot, moulding machine and cell access system. The safeguarding and energy-control review should cover the complete operating system and foreseeable tasks.','OSHA Injection Molding eTool — integrated machinery safety','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines/safety-tour-view-1')
  ]
 },
 NZ:{
  Beginner:[
   regionalRow('A production manager says machine safety is mainly the operator’s responsibility because the operator presses cycle start. What is the strongest HSWA interpretation?',['The PCBU holds the primary reasonably-practicable health and safety duty','The operator alone carries the primary duty','The machine supplier always holds the workplace primary duty after installation','Safety duties end once a worker signs a training sheet'],0,'Under HSWA the PCBU holds the primary duty of care, so far as is reasonably practicable. Worker duties exist as well, but they do not transfer the PCBU’s primary duty to the operator.','Health and Safety at Work Act 2015 — primary duty of care','https://www.legislation.govt.nz/act/public/2015/70/en/latest/'),
   regionalRow('A guarding hazard can either be eliminated by changing the task or merely reduced by administrative controls. Which NZ risk-control approach is strongest?',['Start with the cheapest control','Eliminate risk first; otherwise minimise it','Use PPE first because it is easiest to audit','Accept the risk if workers are experienced'],1,'New Zealand machinery guidance reflects the HSWA hierarchy: eliminate risks so far as is reasonably practicable and, where elimination is not reasonably practicable, minimise them so far as is reasonably practicable.','WorkSafe NZ — Safe use of machinery','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'),
   regionalRow('A safety-device test fails on an injection-moulding press just before a production run. What is the strongest action?',['Run at half speed until the next maintenance window','Add a warning sign and continue','Keep it out of use until the safeguard is restored','Allow only senior operators to run it'],2,'A failed safeguard or interlock is a safety defect, not a production parameter. The press should not return to normal use until the protective function is restored and the machine is safe.','WorkSafe NZ — Working safely with plastic production machinery','https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/injection-blow-moulding/')
  ],
  Intermediate:[
   regionalRow('Maintenance cleaning requires access around electrical, hydraulic, pneumatic and stored mechanical energy. Which NZ approach is strongest before the work begins?',['Use only the moulding-machine stop button','Turn the temperature controllers off','Ask another worker not to touch the controls','Isolate all energy and verify safe state'],3,'WorkSafe lockout guidance requires machinery to be safely isolated so harmful unexpected movement or energy release cannot occur during servicing. Relevant supplied and stored energy must be addressed.','WorkSafe NZ — Keeping workers safe with machine lockouts','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/'),
   regionalRow('A team wants a recognised technical benchmark for machinery safeguarding while designing controls under NZ law. What is the strongest use of AS/NZS 4024?',['Use AS/NZS 4024 as safety evidence while still meeting legal duties','Treat it as a replacement for HSWA','Use it only for imported European machines','Ignore it because standards can never inform reasonably practicable controls'],0,'The AS/NZS 4024 machinery-safety series can inform the state of knowledge and appropriate safeguards. It does not replace the legal duties or the need to address the actual machine and task risks.','WorkSafe NZ — machinery safety and lockout guidance','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/'),
   regionalRow('Service work is complete and the machine is about to be returned to production. What is the strongest restart check?',['Restart immediately if maintenance says the repair is finished','Verify safeguards before authorised return to service','Leave guards open for the first cycle so the repair can be observed','Use a slower cycle instead of verifying the safeguards'],1,'Return to service should restore the protective systems and confirm the machine is safe before normal operation. A slower cycle is not a substitute for functioning guards and interlocks.','WorkSafe NZ — Keeping workers safe with machine lockouts','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/')
  ],
  Advanced:[
   regionalRow('An engineer says “AS/NZS 4024 compliance replaces our HSWA duties.” What is the strongest interpretation?',['Correct if the machine is less than ten years old','Correct if a supplier signs the risk assessment','HSWA duties remain; standards inform controls','Incorrect only for presses with robots'],2,'Standards can provide strong technical evidence for risk control, but they do not displace statutory duties under HSWA. The dutyholder must still ensure the actual work risks are managed so far as is reasonably practicable.','WorkSafe NZ — machinery safety and lockout guidance','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/'),
   regionalRow('A robot and conveyor are added to an injection-moulding cell. Which NZ risk assessment is strongest?',['Assess only the robot because it is the new item','Assess only automatic production, not setup or intervention','Rely on the robot supplier’s declaration and leave the old machine assessment unchanged','Assess the integrated system, interfaces, tasks and safeguards as a whole'],3,'Machinery risk assessment should address the system as actually used. Integration can create new access, trapping, sequencing and intervention hazards that are missed if each component is considered in isolation.','WorkSafe NZ — Safe use of machinery','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'),
   regionalRow('On 30 August 2026, a training note says the Health and Safety at Work Amendment Act 2026 is already in force. What is the strongest correction?',['Not yet in force; commencement is 1 April 2027','The Act came into force on Royal assent','The Act was repealed before enactment','The commencement date is controlled by each employer'],0,'The Health and Safety at Work Amendment Act 2026 was enacted in July 2026 but its commencement is 1 April 2027. Training must distinguish enacted future law from requirements already in force.','Health and Safety at Work Amendment Act 2026','https://www.legislation.govt.nz/act/public/2026/38/en/latest/')
  ]
 }
};
for(const [region,levels] of Object.entries(R))for(const [level,items] of Object.entries(levels))items.forEach((item,i)=>regionalSet(region,level,i,item));
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.regionalDeepDive={reviewed:'30 August 2026',regionalItemsRewritten:27,regionalAnswerChanges:0,appliedSafety:true,officialSources:true};
window.MM_REGIONAL_QUESTION_DEEP_DIVE={version:'2026-08-30',regionalRewrites:27,regionalAnswerChanges:0,appliedSafety:true};
})();
/* <<< assessment-answer-cue-fix.js */

/* >>> assessment-storage-scope.js */
/* MouldMaster learner-scoped assessment storage — 2026-09-11.1 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof localStorage==='undefined')return;
const VERSION='2026.09.11.1';
const ANALYTICS_BASE='mm_assessment_analytics_v1';
const TIMING_BASE='mm_assessment_exposure_timing_v1';
const ROTATION_BASE='mm_assessment_opening_history_v1';
const QUESTION_HISTORY_BASE='mm-assessment-question-history-v4';
const RESULT_META_BASE='mm-assessment-result-meta-v1';
const BASES=[ANALYTICS_BASE,TIMING_BASE,ROTATION_BASE,QUESTION_HISTORY_BASE,RESULT_META_BASE];
if(window.MM_ASSESSMENT_STORAGE_SCOPE?.version===VERSION)return;
const rawGet=localStorage.getItem.bind(localStorage);
const rawSet=localStorage.setItem.bind(localStorage);
const rawRemove=localStorage.removeItem.bind(localStorage);
const rawKey=localStorage.key.bind(localStorage);
let sharedMigration={status:'not-run',migrated:0,removedDuplicate:0,conflicts:0,ambiguous:0};
let sharedMigrationComplete=false;
function learnerId(){
 try{
  if(typeof db!=='undefined'&&db&&db.activeUser)return String(db.activeUser).slice(0,160);
  if(typeof user!=='undefined'&&user&&user.id)return String(user.id).slice(0,160);
 }catch(_){}
 return 'anonymous';
}
function hashScope(value){
 const s=String(value||'anonymous');let h1=0xdeadbeef^s.length,h2=0x41c6ce57^s.length;
 for(let i=0;i<s.length;i++){const ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
 h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
 return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
}
function profileIds(){try{return typeof db!=='undefined'&&db?.users&&typeof db.users==='object'&&!Array.isArray(db.users)?Object.keys(db.users).map(String).filter(Boolean):[]}catch(_){return[]}}
function rawScopedKey(base,token){return `${base}::${String(token)}`}
function sharedScope(){const s=window.MM_LEARNER_SCOPE;return s&&typeof s.tokenFor==='function'?s:null}
function migrateFallbackScopes(){
 const shared=sharedScope();if(!shared)return {status:'shared-unavailable',migrated:0,removedDuplicate:0,conflicts:0,ambiguous:0};
 const ids=[...new Set(profileIds())],byOld=new Map();
 for(const id of ids){const token=hashScope(id);if(!byOld.has(token))byOld.set(token,[]);byOld.get(token).push(id)}
 let migrated=0,removedDuplicate=0,conflicts=0,ambiguous=0;
 for(const base of BASES){
  for(const [oldToken,owners] of byOld){
   const oldKey=rawScopedKey(base,oldToken),legacy=rawGet(oldKey);if(legacy==null)continue;
   if(owners.length!==1){ambiguous++;continue}
   const target=rawScopedKey(base,shared.tokenFor(owners[0])),current=rawGet(target);
   if(current==null){rawSet(target,legacy);if(rawGet(target)===legacy){rawRemove(oldKey);migrated++}else conflicts++;continue}
   if(current===legacy){rawRemove(oldKey);removedDuplicate++;continue}
   conflicts++;
  }
 }
 return {status:conflicts||ambiguous?'partial-fail-closed':'migrated',migrated,removedDuplicate,conflicts,ambiguous}
}
function ensureSharedMigration(){
 if(sharedMigrationComplete||!sharedScope())return sharedMigration;
 sharedMigration=migrateFallbackScopes();sharedMigrationComplete=true;return sharedMigration
}
function scopeToken(raw=learnerId()){
 const shared=sharedScope();if(shared){ensureSharedMigration();return shared.tokenFor(raw)}
 return hashScope(raw)
}
function scopedKey(base,raw=learnerId()){
 const k=String(base);return BASES.includes(k)?rawScopedKey(k,scopeToken(raw)):k
}
function rawKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=rawKey(i);if(k!=null)out.push(k)}return out}
function assessmentKey(k){return BASES.some(base=>k===base||k.startsWith(base+'::'))}
function getItem(base){return rawGet(scopedKey(base))}
function setItem(base,value){rawSet(scopedKey(base),String(value));return true}
function removeItem(base){rawRemove(scopedKey(base));return true}
function read(base,fallback=null){try{const raw=getItem(base);if(raw==null)return fallback;const value=JSON.parse(raw);return value==null?fallback:value}catch(_){return fallback}}
function write(base,value){try{return setItem(base,JSON.stringify(value))}catch(_){return false}}
function clearAll(){for(const k of rawKeys())if(assessmentKey(k))rawRemove(k)}
function cancelInMemoryAttempt(){
 try{if(typeof activeExam!=='undefined')activeExam=null}catch(_){}
 try{window.activeExam=null}catch(_){}
}
function migrateLegacy(){
 let migrated=0,removedDuplicate=0,conflicts=0,ambiguous=0;
 const ids=[...new Set(profileIds())],active=learnerId(),sole=ids.length===1?ids[0]:null;
 for(const base of BASES){
  const old=rawGet(base);if(old==null)continue;
  if(!sole||active!==sole){ambiguous++;continue}
  const target=scopedKey(base,sole),current=rawGet(target);
  if(current==null){
   rawSet(target,old);
   if(rawGet(target)===old){rawRemove(base);migrated++}else conflicts++;
   continue
  }
  if(current===old){rawRemove(base);removedDuplicate++;continue}
  conflicts++;
 }
 return {status:conflicts||ambiguous?'partial-fail-closed':'migrated',migrated,removedDuplicate,conflicts,ambiguous};
}
function wrapLearnerChange(name){
 const base=typeof window[name]==='function'?window[name]:null;if(!base||base.__mmAssessmentScopeWrapped)return;
 const wrapped=function(){const before=learnerId();try{return base.apply(this,arguments)}finally{if(learnerId()!==before)cancelInMemoryAttempt()}};
 Object.defineProperty(wrapped,'__mmAssessmentScopeWrapped',{value:true});window[name]=wrapped;
}
const legacy=migrateLegacy();
wrapLearnerChange('switchUser');
wrapLearnerChange('createLearner');
const baseReset=typeof window.resetData==='function'?window.resetData:null;
if(baseReset&&!baseReset.__mmAssessmentScopeWrapped){
 const wrappedReset=function(){
  let before=null;try{before=rawGet('mouldmasterProDB')}catch(_){}
  const r=baseReset.apply(this,arguments);
  setTimeout(()=>{try{const after=rawGet('mouldmasterProDB');if(after!==before){cancelInMemoryAttempt();clearAll()}}catch(_){}},0);
  return r;
 };
 Object.defineProperty(wrappedReset,'__mmAssessmentScopeWrapped',{value:true});window.resetData=wrappedReset;
}
window.addEventListener?.('mm:domains-ready',()=>ensureSharedMigration(),{once:true});
window.MM_ASSESSMENT_STORAGE_SCOPE={
 version:VERSION,
 scopeToken,
 key:scopedKey,
 getItem,
 setItem,
 removeItem,
 read,
 write,
 analyticsKey:()=>scopedKey(ANALYTICS_BASE),
 timingKey:()=>scopedKey(TIMING_BASE),
 rotationKey:()=>scopedKey(ROTATION_BASE),
 questionHistoryKey:()=>scopedKey(QUESTION_HISTORY_BASE),
 resultMetaKey:()=>scopedKey(RESULT_META_BASE),
 clearAll,
 cancelInMemoryAttempt,
 migrateFallbackScopes:ensureSharedMigration,
 legacyMigration:{...legacy},
 get sharedMigration(){return {...sharedMigration}},
 scopeProvider:()=>sharedScope()?'MM_LEARNER_SCOPE':'compatibility-hash',
 learnerScoped:true,
 prototypeInterception:false,
 boundary:'Assessment persistence is explicit: callers use this API for learner-scoped analytics and assessment metadata. Native browser storage methods are never replaced. Single-owner legacy values are copied and verified before removal; ambiguous or conflicting legacy data remains untouched and is never inherited automatically.'
};
})();
/* <<< assessment-storage-scope.js */

/* >>> assessment-quality-suite.js */
/* MouldMaster assessment quality suite — 2026-08-24.2 */
(function(){
'use strict';
const D=window.MM_DATA;
const ASSESSMENT_STORAGE=window.MM_ASSESSMENT_STORAGE_SCOPE;
if(!D||!D.exams||!D.regionalQuestions||!D.scenarios)throw new Error('MouldMaster assessment data must load before quality suite');
if(!ASSESSMENT_STORAGE||typeof ASSESSMENT_STORAGE.read!=='function'||typeof ASSESSMENT_STORAGE.write!=='function'||typeof ASSESSMENT_STORAGE.removeItem!=='function')throw new Error('Learner-scoped assessment storage must load before quality suite');

const VERSION='2026.08.24.2';
const ANALYTICS_KEY='mm_assessment_analytics_v1';
const REVIEW_KEY='mm_spaced_review_v2';
const SOURCE_REVIEWED='2026-08-26';
const SOURCE_REVIEW_BY='2026-11-26';
const LEVELS=['Beginner','Intermediate','Advanced'];
const REGIONS=['UK','US','NZ'];
const BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting'];
const LABELS={materials:'Materials & rheology',machine:'Machine & controls',tooling:'Tooling & thermal',process:'Process development',quality:'Quality & statistics',troubleshooting:'Troubleshooting',safety:'Safety & compliance'};
const IDENTITY_LOCK_VERSION='2026.09.10.1';
const LOCKED_IDENTITIES=[{"stableId":"reg:NZ:Advanced:0","fingerprint":"fnv1a-a15f8593","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"NZ","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-engineer-compliance-replaces-duties","reviewedContentFingerprint":"fnv1a-199267ab","reviewedSourceFingerprint":"fnv1a-1b03a7f5"},{"stableId":"reg:NZ:Advanced:1","fingerprint":"fnv1a-144d4d23","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"NZ","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-robot-conveyor-added-injection","reviewedContentFingerprint":"fnv1a-bedda5f7","reviewedSourceFingerprint":"fnv1a-4f95fc65"},{"stableId":"reg:NZ:Advanced:2","fingerprint":"fnv1a-580a34ce","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"NZ","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-august-training-health-safety","reviewedContentFingerprint":"fnv1a-24ccd71f","reviewedSourceFingerprint":"fnv1a-94086ca3"},{"stableId":"reg:NZ:Beginner:0","fingerprint":"fnv1a-3fd3af5d","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-production-manager-machine-safety","reviewedContentFingerprint":"fnv1a-ee9dcf53","reviewedSourceFingerprint":"fnv1a-0e9f6305"},{"stableId":"reg:NZ:Beginner:1","fingerprint":"fnv1a-d1eea52d","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-safety-isolation","reviewedContentFingerprint":"fnv1a-20cf90a1","reviewedSourceFingerprint":"fnv1a-5e0e5600"},{"stableId":"reg:NZ:Beginner:2","fingerprint":"fnv1a-02582e6c","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-safety-device-fails-injection","reviewedContentFingerprint":"fnv1a-adc5aab8","reviewedSourceFingerprint":"fnv1a-91ad0bc9"},{"stableId":"reg:NZ:Intermediate:0","fingerprint":"fnv1a-86bce288","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-maintenance-cleaning-requires-access","reviewedContentFingerprint":"fnv1a-b4cbdc9b","reviewedSourceFingerprint":"fnv1a-93a4f3b5"},{"stableId":"reg:NZ:Intermediate:1","fingerprint":"fnv1a-f0ce1300","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-safety-isolation","reviewedContentFingerprint":"fnv1a-79cfafc2","reviewedSourceFingerprint":"fnv1a-97cfc0a3"},{"stableId":"reg:NZ:Intermediate:2","fingerprint":"fnv1a-91e9176b","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"NZ","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-nz-service-complete-machine-about","reviewedContentFingerprint":"fnv1a-990327b5","reviewedSourceFingerprint":"fnv1a-d0b819b9"},{"stableId":"reg:UK:Advanced:0","fingerprint":"fnv1a-b8cb8dd1","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"UK","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-robot-conveyor-added-existing","reviewedContentFingerprint":"fnv1a-4dc790aa","reviewedSourceFingerprint":"fnv1a-85fee13d"},{"stableId":"reg:UK:Advanced:1","fingerprint":"fnv1a-474a887e","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"UK","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-machine-current-conformity-documentation","reviewedContentFingerprint":"fnv1a-7d90096b","reviewedSourceFingerprint":"fnv1a-4de986be"},{"stableId":"reg:UK:Advanced:2","fingerprint":"fnv1a-159f7dfb","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"UK","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-doe","reviewedContentFingerprint":"fnv1a-c4560032","reviewedSourceFingerprint":"fnv1a-9baa4b0f"},{"stableId":"reg:UK:Beginner:0","fingerprint":"fnv1a-0a0d80ea","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-safety-isolation","reviewedContentFingerprint":"fnv1a-36b2ae6a","reviewedSourceFingerprint":"fnv1a-a09c7118"},{"stableId":"reg:UK:Beginner:1","fingerprint":"fnv1a-e8da0d83","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-safety-isolation","reviewedContentFingerprint":"fnv1a-9a87d5b7","reviewedSourceFingerprint":"fnv1a-fa684cf5"},{"stableId":"reg:UK:Beginner:2","fingerprint":"fnv1a-7ff0db5b","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-polymer-grade-produces-visible","reviewedContentFingerprint":"fnv1a-2b93dd0d","reviewedSourceFingerprint":"fnv1a-a50f30ef"},{"stableId":"reg:UK:Intermediate:0","fingerprint":"fnv1a-eaf64e0b","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-training-sheet-puwer-applies","reviewedContentFingerprint":"fnv1a-d05db0a3","reviewedSourceFingerprint":"fnv1a-a366041d"},{"stableId":"reg:UK:Intermediate:1","fingerprint":"fnv1a-4d2f2a2e","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-safety-isolation","reviewedContentFingerprint":"fnv1a-bc0c6665","reviewedSourceFingerprint":"fnv1a-fe383e7c"},{"stableId":"reg:UK:Intermediate:2","fingerprint":"fnv1a-89bd4d3a","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"UK","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-uk-validation-20430-certification-means","reviewedContentFingerprint":"fnv1a-71cbf510","reviewedSourceFingerprint":"fnv1a-2decd9d4"},{"stableId":"reg:US:Advanced:0","fingerprint":"fnv1a-cbad36e1","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"US","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-us-company-operates-injection-moulding","reviewedContentFingerprint":"fnv1a-3bc48420","reviewedSourceFingerprint":"fnv1a-0fa97694"},{"stableId":"reg:US:Advanced:1","fingerprint":"fnv1a-24e5b049","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"US","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-us-safety-isolation","reviewedContentFingerprint":"fnv1a-7d1b29aa","reviewedSourceFingerprint":"fnv1a-7df76c51"},{"stableId":"reg:US:Advanced:2","fingerprint":"fnv1a-94ed16f7","reviewedRevision":2,"kind":"regional","level":"Advanced","region":"US","difficulty":"Expert safety","competency":"safety","competencies":["safety"],"concept":"safety-us-robot-integrated-injection-moulding","reviewedContentFingerprint":"fnv1a-e0aeed2e","reviewedSourceFingerprint":"fnv1a-dfb23c8e"},{"stableId":"reg:US:Beginner:0","fingerprint":"fnv1a-5bbfd852","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-horizontal-injection-moulding-machine","reviewedContentFingerprint":"fnv1a-2f7ff710","reviewedSourceFingerprint":"fnv1a-9284ce40"},{"stableId":"reg:US:Beginner:1","fingerprint":"fnv1a-55f7f381","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-safety-isolation","reviewedContentFingerprint":"fnv1a-af83166f","reviewedSourceFingerprint":"fnv1a-1f3831de"},{"stableId":"reg:US:Beginner:2","fingerprint":"fnv1a-209cf97b","reviewedRevision":2,"kind":"regional","level":"Beginner","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-purge-compound-introduced-employees","reviewedContentFingerprint":"fnv1a-5bc93f66","reviewedSourceFingerprint":"fnv1a-d32f03e0"},{"stableId":"reg:US:Intermediate:0","fingerprint":"fnv1a-081176be","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-stuck-cleared-inside-danger","reviewedContentFingerprint":"fnv1a-7350fed8","reviewedSourceFingerprint":"fnv1a-2b1d715d"},{"stableId":"reg:US:Intermediate:1","fingerprint":"fnv1a-e4ee2e71","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-emergency-pressed-hydraulic-stored","reviewedContentFingerprint":"fnv1a-3e81d5d3","reviewedSourceFingerprint":"fnv1a-2b1d715d"},{"stableId":"reg:US:Intermediate:2","fingerprint":"fnv1a-56dc09c4","reviewedRevision":2,"kind":"regional","level":"Intermediate","region":"US","difficulty":"Applied safety","competency":"safety","competencies":["safety"],"concept":"safety-us-safety-engineer-plastics-should","reviewedContentFingerprint":"fnv1a-f4c86623","reviewedSourceFingerprint":"fnv1a-8a4a208a"},{"stableId":"tech:Advanced:0","fingerprint":"fnv1a-9eaca470","reviewedRevision":3,"kind":"technical","level":"Advanced","region":null,"difficulty":"Diagnostic","competency":"quality","competencies":["quality","troubleshooting"],"concept":"capability","reviewedContentFingerprint":"fnv1a-8bd0f301","reviewedSourceFingerprint":"fnv1a-646818ab"},{"stableId":"tech:Advanced:1","fingerprint":"fnv1a-5cdb31e1","reviewedRevision":2,"kind":"technical","level":"Advanced","region":null,"difficulty":"Diagnostic","competency":"tooling","competencies":["tooling","quality","troubleshooting"],"concept":"capability","reviewedContentFingerprint":"fnv1a-ff52dfd1","reviewedSourceFingerprint":"fnv1a-81b6dc5a"},{"stableId":"tech:Advanced:2","fingerprint":"fnv1a-68539e4f","reviewedRevision":3,"kind":"technical","level":"Advanced","region":null,"difficulty":"Diagnostic","competency":"tooling","competencies":["tooling","process","quality","troubleshooting"],"concept":"factor-moulding-study-shows","reviewedContentFingerprint":"fnv1a-8a34bdf8","reviewedSourceFingerprint":"fnv1a-750deb38"},{"stableId":"tech:Advanced:3","fingerprint":"fnv1a-ad59ed03","reviewedRevision":2,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"quality","competencies":["quality"],"concept":"doe","reviewedContentFingerprint":"fnv1a-5a193092","reviewedSourceFingerprint":"fnv1a-1e6184fb"},{"stableId":"tech:Advanced:4","fingerprint":"fnv1a-dbd05a3b","reviewedRevision":2,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"machine","competencies":["machine","tooling","process","troubleshooting"],"concept":"cavity-pressure","reviewedContentFingerprint":"fnv1a-7bc46e8b","reviewedSourceFingerprint":"fnv1a-34a4082e"},{"stableId":"tech:Advanced:5","fingerprint":"fnv1a-e2f9fd96","reviewedRevision":3,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"materials","competencies":["materials","process"],"concept":"mfr-rheology","reviewedContentFingerprint":"fnv1a-4acaec64","reviewedSourceFingerprint":"fnv1a-6818d37a"},{"stableId":"tech:Advanced:6","fingerprint":"fnv1a-0137f76c","reviewedRevision":3,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"quality","competencies":["quality","troubleshooting"],"concept":"measurement","reviewedContentFingerprint":"fnv1a-5e9b4a68","reviewedSourceFingerprint":"fnv1a-866abf5b"},{"stableId":"tech:Advanced:7","fingerprint":"fnv1a-0b5566a6","reviewedRevision":2,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"machine","competencies":["machine","tooling","process","troubleshooting"],"concept":"process-transfer","reviewedContentFingerprint":"fnv1a-afef1a15","reviewedSourceFingerprint":"fnv1a-1f79575c"},{"stableId":"tech:Advanced:8","fingerprint":"fnv1a-ed37656d","reviewedRevision":2,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"materials","competencies":["materials","tooling","process","troubleshooting"],"concept":"mfr-rheology","reviewedContentFingerprint":"fnv1a-55b10a1c","reviewedSourceFingerprint":"fnv1a-63559e49"},{"stableId":"tech:Advanced:9","fingerprint":"fnv1a-2ed306b9","reviewedRevision":3,"kind":"technical","level":"Advanced","region":null,"difficulty":"Expert","competency":"machine","competencies":["machine","tooling","process","troubleshooting"],"concept":"pressure-review-upstream-machine","reviewedContentFingerprint":"fnv1a-74f6b49b","reviewedSourceFingerprint":"fnv1a-ec39afef"},{"stableId":"tech:Beginner:0","fingerprint":"fnv1a-ea6393c4","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Foundation","competency":"process","competencies":["process","quality"],"concept":"shot-delivery","reviewedContentFingerprint":"fnv1a-dad505dc","reviewedSourceFingerprint":"fnv1a-36af43d1"},{"stableId":"tech:Beginner:1","fingerprint":"fnv1a-3e4677f6","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Foundation","competency":"machine","competencies":["machine","process","troubleshooting"],"concept":"shot-delivery","reviewedContentFingerprint":"fnv1a-3e6fc795","reviewedSourceFingerprint":"fnv1a-1f79575c"},{"stableId":"tech:Beginner:2","fingerprint":"fnv1a-93d23461","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Foundation","competency":"machine","competencies":["machine","process","quality","troubleshooting"],"concept":"setpoint-actual","reviewedContentFingerprint":"fnv1a-24380e05","reviewedSourceFingerprint":"fnv1a-7cc5339c"},{"stableId":"tech:Beginner:3","fingerprint":"fnv1a-04cae342","reviewedRevision":2,"kind":"technical","level":"Beginner","region":null,"difficulty":"Foundation","competency":"materials","competencies":["materials","machine"],"concept":"setpoint-actual","reviewedContentFingerprint":"fnv1a-ec71bdf7","reviewedSourceFingerprint":"fnv1a-44e56d72"},{"stableId":"tech:Beginner:4","fingerprint":"fnv1a-e2604a5d","reviewedRevision":2,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"materials","competencies":["materials","machine","troubleshooting"],"concept":"moisture-drying","reviewedContentFingerprint":"fnv1a-9431db61","reviewedSourceFingerprint":"fnv1a-6d6a773c"},{"stableId":"tech:Beginner:5","fingerprint":"fnv1a-1e9466c4","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"tooling","competencies":["tooling","process","troubleshooting"],"concept":"during-process-comparison-transfer","reviewedContentFingerprint":"fnv1a-96cb5a9c","reviewedSourceFingerprint":"fnv1a-ef98ac47"},{"stableId":"tech:Beginner:6","fingerprint":"fnv1a-f68fe26b","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"machine","competencies":["machine","tooling","troubleshooting"],"concept":"flash-appears-local-corner","reviewedContentFingerprint":"fnv1a-67105fe7","reviewedSourceFingerprint":"fnv1a-039729bd"},{"stableId":"tech:Beginner:7","fingerprint":"fnv1a-44874ab5","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"machine","competencies":["machine","tooling","process"],"concept":"cavity-pressure","reviewedContentFingerprint":"fnv1a-6aa6de51","reviewedSourceFingerprint":"fnv1a-a4619674"},{"stableId":"tech:Beginner:8","fingerprint":"fnv1a-4e72086b","reviewedRevision":3,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"tooling","competencies":["tooling","process","troubleshooting"],"concept":"after-mould-water-connection","reviewedContentFingerprint":"fnv1a-08012b43","reviewedSourceFingerprint":"fnv1a-bbdf861c"},{"stableId":"tech:Beginner:9","fingerprint":"fnv1a-f94a69d5","reviewedRevision":2,"kind":"technical","level":"Beginner","region":null,"difficulty":"Applied","competency":"quality","competencies":["quality","troubleshooting"],"concept":"setpoint-actual","reviewedContentFingerprint":"fnv1a-106504d6","reviewedSourceFingerprint":"fnv1a-81b6dc5a"},{"stableId":"tech:Intermediate:0","fingerprint":"fnv1a-7ed65e2d","reviewedRevision":2,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Applied","competency":"tooling","competencies":["tooling","process"],"concept":"gate-seal","reviewedContentFingerprint":"fnv1a-8e40b5b6","reviewedSourceFingerprint":"fnv1a-86365307"},{"stableId":"tech:Intermediate:1","fingerprint":"fnv1a-c6545e90","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Applied","competency":"process","competencies":["process","troubleshooting"],"concept":"repeats-region-stable-strongly","reviewedContentFingerprint":"fnv1a-f510bfe4","reviewedSourceFingerprint":"fnv1a-a7fcfeaa"},{"stableId":"tech:Intermediate:2","fingerprint":"fnv1a-0721b222","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Applied","competency":"materials","competencies":["materials","process","troubleshooting"],"concept":"moisture-drying","reviewedContentFingerprint":"fnv1a-61f3cd87","reviewedSourceFingerprint":"fnv1a-cd4a12ab"},{"stableId":"tech:Intermediate:3","fingerprint":"fnv1a-30947697","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Diagnostic","competency":"machine","competencies":["machine","tooling","process","troubleshooting"],"concept":"tooling-locality","reviewedContentFingerprint":"fnv1a-31eef55a","reviewedSourceFingerprint":"fnv1a-039729bd"},{"stableId":"tech:Intermediate:4","fingerprint":"fnv1a-c497dd13","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Diagnostic","competency":"materials","competencies":["materials","tooling","process"],"concept":"mfr-rheology","reviewedContentFingerprint":"fnv1a-9edca544","reviewedSourceFingerprint":"fnv1a-6cd5ca8f"},{"stableId":"tech:Intermediate:5","fingerprint":"fnv1a-8e611994","reviewedRevision":2,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Diagnostic","competency":"machine","competencies":["machine","process","troubleshooting"],"concept":"shot-delivery","reviewedContentFingerprint":"fnv1a-e29bd500","reviewedSourceFingerprint":"fnv1a-f68ed5f8"},{"stableId":"tech:Intermediate:6","fingerprint":"fnv1a-0438ad1e","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Diagnostic","competency":"materials","competencies":["materials","machine","tooling","process"],"concept":"shot-delivery","reviewedContentFingerprint":"fnv1a-6b1f00b7","reviewedSourceFingerprint":"fnv1a-cbef3d89"},{"stableId":"tech:Intermediate:7","fingerprint":"fnv1a-9c16ccd6","reviewedRevision":2,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Diagnostic","competency":"tooling","competencies":["tooling","troubleshooting"],"concept":"cooling-thermal","reviewedContentFingerprint":"fnv1a-3a061fcc","reviewedSourceFingerprint":"fnv1a-b5e9d71c"},{"stableId":"tech:Intermediate:8","fingerprint":"fnv1a-05babde6","reviewedRevision":3,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Applied","competency":"tooling","competencies":["tooling","process","troubleshooting"],"concept":"cooling-thermal","reviewedContentFingerprint":"fnv1a-eacc6fa7","reviewedSourceFingerprint":"fnv1a-bbdf861c"},{"stableId":"tech:Intermediate:9","fingerprint":"fnv1a-46566f2e","reviewedRevision":2,"kind":"technical","level":"Intermediate","region":null,"difficulty":"Applied","competency":"quality","competencies":["quality"],"concept":"doe","reviewedContentFingerprint":"fnv1a-9350d241","reviewedSourceFingerprint":"fnv1a-6d7f006e"}];
const IDENTITY_BY_FINGERPRINT=new Map(LOCKED_IDENTITIES.map(x=>[x.fingerprint,Object.freeze({...x,competencies:Object.freeze((x.competencies||[]).slice())})]));
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
const shuffle=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
function read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'');return obj(x)?x:d}catch(_){return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}}

function competencySet(text){
 const t=norm(text),out=[];
 if(/resin|polymer|material|moisture|dry|mfr|mvr|rheolog|viscos|melt temp|temperature check|crystalli|regrind|recycl/.test(t))out.push('materials');
 if(/machine|screw|cushion|recovery|non-return|check ring|barrel|controller|setpoint|injection unit|clamp|transfer position|hydraulic|servo/.test(t))out.push('machine');
 if(/mould|mold|cavity|gate|runner|vent|cooling|water line|parting line|ejection|hot runner|valve gate|surface temperature|tool/.test(t))out.push('tooling');
 if(/fill|pack|hold|gate seal|velocity|pressure|cycle|process window|transfer|shot|flow|shear|residence/.test(t))out.push('process');
 if(/cpk|ppk|capability|measurement|gauge|gage|doe|experiment|random|block|validation|specification|sample|control chart|quality|dimension/.test(t))out.push('quality');
 if(/diagnos|troubleshoot|first|strongest|investigat|drift|changes|becomes|fails|defect|short shot|flash|sink|splay|burn|weld|warpage|brittle|disagree/.test(t))out.push('troubleshooting');
 return [...new Set(out)];
}
function primaryCompetency(text,index){const a=competencySet(text);if(a.length)return a[0];return BLUEPRINT[index%BLUEPRINT.length]}
function concept(text){
 const t=norm(text);
 const defs=[['moisture-drying',/moisture|hygroscopic|dry/],['mfr-rheology',/\bmfr\b|\bmvr\b|rheolog|viscos/],['gate-seal',/gate seal|gate freeze|mass plateau/],['cavity-pressure',/cavity pressure|in-cavity|machine peak pressure/],['shot-delivery',/cushion|non-return|check ring|shot delivery|recovery/],['cooling-thermal',/cooling|water line|mould-surface|mold-surface|warpage/],['capability',/cpk|ppk|capability/],['measurement',/measurement|gauge|gage|fixture/],['doe',/\bdoe\b|experiment|randomis|randomiz|blocking|confound/],['process-transfer',/receiving machine|process equivalence|transfer strategy/],['setpoint-actual',/setpoint|saved recipe|known-good baseline/],['tooling-locality',/one cavity|local flow|branch|parting line|gate wear/],['safety-isolation',/lockout|isolation|interlock|guard|hazardous energy/]];
 for(const [id,re] of defs)if(re.test(t))return id;
 return t.split(/[^a-z0-9]+/).filter(x=>x.length>4).slice(0,4).join('-')||'general';
}
function difficulty(level,index){
 if(level==='Beginner')return index<4?'Foundation':'Applied';
 if(level==='Intermediate')return index<3?'Applied':index<8?'Diagnostic':'Applied';
 return index<3?'Diagnostic':'Expert';
}
function techId(level,index){return `tech:${level}:${index}`}
function regId(region,level,index){return `reg:${region}:${level}:${index}`}
function scenarioId(index){return `scenario:${String(index+1).padStart(2,'0')}`}

const META_BY_TEXT=new Map();
function fnv1a32(value){let h=2166136261;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0')}
function identityFingerprint(q,kind,level,region){const options=Array.isArray(q?.[1])?q[1]:[],correct=Number(q?.[2]),sorted=options.map(norm).sort(),correctText=Number.isInteger(correct)&&correct>=0&&correct<options.length?norm(options[correct]):'';return fnv1a32([kind,level||'',region||'',norm(q?.[0]),sorted.join('␞'),correctText].join('␟'))}
function identityFor(q,kind,level,region,index){
 const fingerprint=identityFingerprint(q,kind,level,region),locked=IDENTITY_BY_FINGERPRINT.get(fingerprint);
 if(!locked)throw new Error(`Assessment identity drift: ${kind}:${region||''}:${level}:${index} is not in reviewed identity lock ${IDENTITY_LOCK_VERSION}`);
 if(locked.kind!==kind||locked.level!==level||(locked.region||null)!==(region||null))throw new Error(`Assessment identity context drift for ${locked.stableId}`);
 const inferredCompetencies=kind==='technical'?competencySet(q[0]):['safety'],inferredPrimary=kind==='technical'?(inferredCompetencies[0]||BLUEPRINT[index%BLUEPRINT.length]):'safety',inferredConcept=kind==='technical'?concept(q[0]):'safety-'+region.toLowerCase()+'-'+concept(q[0]);
 return {...locked,revision:VERSION,bankIndex:index,identityFingerprint:fingerprint,metadataInference:{competency:inferredPrimary,competencies:inferredCompetencies,concept:inferredConcept,matches:locked.competency===inferredPrimary&&locked.concept===inferredConcept}};
}
function rebuildMeta(){
 META_BY_TEXT.clear();const seen=new Set();
 LEVELS.forEach(level=>(D.exams[level]||[]).forEach((q,i)=>{const m=identityFor(q,'technical',level,null,i);if(seen.has(m.stableId))throw new Error(`Duplicate reviewed assessment identity ${m.stableId}`);seen.add(m.stableId);META_BY_TEXT.set(norm(q[0]),m)}));
 REGIONS.forEach(region=>LEVELS.forEach(level=>(D.regionalQuestions[region]?.[level]||[]).forEach((q,i)=>{const m=identityFor(q,'regional',level,region,i);if(seen.has(m.stableId))throw new Error(`Duplicate reviewed assessment identity ${m.stableId}`);seen.add(m.stableId);META_BY_TEXT.set(norm(q[0]),m)})));
 if(seen.size!==LOCKED_IDENTITIES.length)throw new Error(`Assessment identity lock coverage drift: ${seen.size}/${LOCKED_IDENTITIES.length}`);
}
function normaliseTech(q,i,level){const m=identityFor(q,'technical',level,null,i);return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:!!q[7],kind:'technical',...m}}
function normaliseReg(q,i,region,level){const m=identityFor(q,'regional',level,region,i);return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:q[7]!==false,kind:'regional',region,...m}}
function shuffleOptions(item){const mapped=item.options.map((text,oldIndex)=>({text,correct:oldIndex===item.correct,feedback:item.optionFeedback?.[oldIndex]||null}));const mixed=shuffle(mapped);return {...item,options:mixed.map(x=>x.text),optionFeedback:mixed.map(x=>x.feedback),correct:mixed.findIndex(x=>x.correct)}}

function selectBlueprint(level){
 const pool=(D.exams[level]||[]).map((q,i)=>normaliseTech(q,i,level));
 const unused=new Set(pool.map((_,i)=>i)),selected=[];
 for(const want of BLUEPRINT){
  let idx=[...unused].find(i=>pool[i].competencies.includes(want));
  if(idx==null)idx=[...unused].find(i=>pool[i].competency===want);
  if(idx==null)continue;
  selected.push(pool[idx]);unused.delete(idx);
 }
 while(selected.length<7&&unused.size){
  const usedConcepts=new Set(selected.map(x=>x.concept));
  let idx=[...unused].find(i=>!usedConcepts.has(pool[i].concept));if(idx==null)idx=[...unused][0];selected.push(pool[idx]);unused.delete(idx);
 }
 return shuffle(selected.slice(0,7));
}
function blueprintCoverage(items){const c=new Set();items.forEach(x=>(x.competencies||[x.competency]).forEach(k=>c.add(k)));return [...c]}

/* Replace random technical sampling with a competency-balanced blueprint while preserving the regional safety rules. */
window.getExamQuestions=function(level,region){
 rebuildMeta();
 const technical=selectBlueprint(level);let regs=[];
 if(region==='ALL')REGIONS.forEach(r=>regs.push(...(D.regionalQuestions[r]?.[level]||[]).map((q,i)=>normaliseReg(q,i,r,level))));
 else regs=shuffle((D.regionalQuestions[region]?.[level]||[]).map((q,i)=>normaliseReg(q,i,region,level))).slice(0,3);
 return shuffle(technical.concat(regs)).map(shuffleOptions);
};

function mergeReview(a,b){return {id:b.id||a.id,stage:Math.max(+a.stage||0,+b.stage||0),due:Math.min(+a.due||Date.now(),+b.due||Date.now()),wrong:(+a.wrong||0)+(+b.wrong||0),right:(+a.right||0)+(+b.right||0),last:Math.max(+a.last||0,+b.last||0),confidence:b.confidence||a.confidence||'medium'}}
function migrateStableReviewIds(){
 const st=read(REVIEW_KEY,{items:{}});if(!obj(st.items))return 0;let moved=0;
 for(const [id,x] of Object.entries({...st.items})){
  let m=/^tech:[^:]+:([^:]+):(\d+)$/.exec(id),stable=null;
  if(m)stable=techId(m[1],+m[2]);
  if(!stable){m=/^reg:[^:]+:([^:]+):([^:]+):(\d+)$/.exec(id);if(m)stable=regId(m[1],m[2],+m[3])}
  if(stable&&stable!==id){const v={...x,id:stable};st.items[stable]=st.items[stable]?mergeReview(st.items[stable],v):v;delete st.items[id];moved++}
 }
 if(moved)write(REVIEW_KEY,st);return moved;
}

const MORE_SCENARIOS=[
 ['Hot-runner heater duty rises','One hot-runner zone holds its displayed temperature, but heater output gradually rises and its cavity group begins to change mass.',['Increase hold pressure for all cavities','Compare heater duty and branch-specific cavity evidence','Lower every manifold setpoint','Ignore heater output because displayed temperature is correct'],1,'A rising duty requirement can reveal changing heat loss, heater/sensor condition or leakage before displayed temperature moves.','tooling','Diagnostic','Hot-runner thermal-control evidence','https://doi.org/10.3390/polym16081057'],
 ['Cooling flow drops on one circuit','A mould cooling circuit shows lower flow and higher pressure drop while ejection temperature and warpage drift locally.',['Reduce total cycle time','Check coolant flow','Increase packing pressure','Change injection speed'],1,'The hydraulic and thermal evidence points directly to the affected cooling circuit.','tooling','Diagnostic','Cooling-system condition and thermal balance','https://doi.org/10.1007/s00170-019-04697-9'],
 ['Check-ring sealing trend changes','Part mass and cushion become less repeatable while recovery is normal and material feed appears stable.',['Test check-ring sealing','Increase mould temperature','Change robot take-out timing','Increase cooling time'],0,'Variation that links cushion and delivered mass with otherwise normal recovery supports a shot-sealing investigation.','machine','Diagnostic','Shot-delivery consistency','https://doi.org/10.3390/s22134792'],
 ['Black specks after a long shutdown','Black specks appear during restart after material remained hot in the barrel longer than the normal validated residence condition.',['Increase barrel temperature to flush faster','Purge safely and check degraded hold-up','Increase packing pressure','Reduce clamp force'],1,'The timing supports degraded or stagnant material as a hypothesis; use the approved purge/startup method rather than adding heat.','materials','Applied','Thermal history and degradation investigation',null],
 ['End-of-fill burn repeats','A burn mark repeatedly appears at the same end-of-fill location while fill time remains stable.',['Check local venting','Increase hold time','Increase clamp force','Change cooling time'],0,'A repeatable end-of-fill burn strongly supports trapped/compressed gas or local venting evidence.','troubleshooting','Applied','Burn-mark and venting mechanism','https://doi.org/10.3390/POLYM13234087'],
 ['Weld line passes appearance but fails load','A reinforced part looks acceptable, but mechanical failures repeatedly start at a weld-line region.',['Approve it because the line is cosmetic','Validate weld-line flow and mechanics','Increase clamp force','Polish the opposite mould half'],1,'Structural weld-line performance depends on local joining and reinforcement orientation, not appearance alone.','quality','Expert','Composite weld-line performance','https://doi.org/10.1007/S40684-020-00226-2'],
 ['One cavity flashes after tool service','After mould service, flash appears on one cavity while the other cavities and machine clamp behaviour remain stable.',['Increase clamp force for the mould','Inspect the local shutoff','Reduce shot size globally','Lower all mould temperatures'],1,'A one-cavity change immediately after tool work points first to a local tooling condition.','tooling','Applied','Local tooling fault isolation',null],
 ['Valve-gate cavity timing separates','Sequential valve-gate cavities begin showing different fill signatures although the machine recipe is unchanged.',['Change the main injection speed first','Check valve-gate timing and cavity evidence','Increase total hold time','Average all cavity traces and ignore identity'],1,'Sequential gating creates cavity-specific timing; preserve cavity identity and check the actuator/timing path.','tooling','Diagnostic','Sequential gate balance',null],
 ['Pressure area changes but peak is stable','Peak cavity pressure is similar to baseline, but pressure-time area and part dimension move together.',['Treat the cycle as unchanged because the peak is stable','Review pressure history, transfer and sensor health','Increase clamp force','Ignore the dimension because pressure peak passed'],1,'A single peak value can miss meaningful changes in duration and pressure history.','process','Diagnostic','Pressure-curve feature monitoring','https://doi.org/10.1007/s00170-023-11100-1'],
 ['Vision rejects a new colour','Automated visual rejects rise immediately after an approved colour/gloss change while independent dimensional and visual audit samples remain acceptable.',['Change moulding pressure until the camera passes parts','Verify vision metrology before changing moulding','Disable all rejects permanently','Increase cooling time'],1,'The inspection input distribution changed; verify the measurement/vision system before moving a stable process.','quality','Diagnostic','Vision domain shift and inspection validation','https://doi.org/10.1088/1361-6501/ad1c4c'],
 ['Cavity sensor becomes noisy after service','A cavity-pressure trace becomes noisy immediately after cable routing and connector service.',['Retrain every quality model first','Check sensor zero and acquisition path','Increase injection pressure','Ignore the signal if part mass is stable'],1,'A change immediately after instrumentation work makes the measurement chain a primary hypothesis.','machine','Applied','Sensor measurement integrity','https://doi.org/10.1109/tim.2024.3522402'],
 ['Robot delay increases cycle only','Overall cycle time increases, but moulding phase times and part quality remain unchanged while robot-clear time is longer.',['Change cooling time','Check robot handshake','Increase injection speed','Change hold pressure'],1,'The changed phase is automation time, so diagnose the automation sequence while preserving validated process phases.','machine','Applied','Automation cycle-state diagnosis',null],
 ['Energy per part rises with stable cycle','Cycle time and quality remain stable but energy per accepted part rises.',['Change injection speed immediately','Check energy phases and boundary','Increase shot size','Reduce all heater setpoints'],1,'Locate the energy increase before changing a stable moulding process.','quality','Diagnostic','Energy KPI normalisation',null],
 ['Overmould bond weak far from gate','A hard/soft overmould joint has good bond near the gate but lower peel strength at the far end.',['Assume the material pair is incompatible everywhere','Map interface thermal/flow history','Increase clamp force','Shorten cooling only'],1,'Position-dependent bond strength supports a local interface thermal/flow history investigation.','materials','Expert','Overmould interface qualification','https://doi.org/10.1002/APP.50294'],
 ['Insert temperature varies','Overmould bond results vary with the delay between insert heating and mould close.',['Record insert/interface thermal state and transfer delay','Increase injection speed without measuring insert temperature','Change part specification','Ignore the delay because heater setpoint is fixed'],0,'Heater setpoint does not prove the insert reaches the same interface temperature at injection.','materials','Diagnostic','Insert thermal-state control',null],
 ['Microfeature underfills while bulk part fills','Overall part mass and cavity fill are acceptable but microgrooves are incompletely replicated.',['Increase hold pressure globally first','Check local thermal, venting and microflow evidence','Increase clamp force','Treat total part mass as proof the microfeatures are full'],1,'Microfeatures can be limited by local freeze-off, gas escape and scale-dependent flow even when the bulk part is full.','tooling','Expert','Microfeature replication','https://doi.org/10.3390/POLYM13193236'],
 ['Foamed part meets weight but loses stiffness','A microcellular part reaches its mass-reduction target but fails a stiffness requirement.',['Accept it because weight target is the process objective','Check cell structure and relevant mechanical response','Increase gas dose automatically','Reduce clamp force'],1,'Foam acceptance needs structure/property evidence, not mass reduction alone.','materials','Expert','Microcellular structure-property response','https://doi.org/10.1002/pen.26700'],
 ['Foamed surface develops swirl','A foamed moulding has acceptable internal density but develops swirl/roughness on a cosmetic surface.',['Treat it as moisture splay automatically','Check skin/thermal history and foaming method','Increase hold pressure until the swirl disappears','Change the dimensional specification'],1,'Foam-related surface morphology can differ from moisture splay and should be diagnosed from the foaming/skin mechanism.','troubleshooting','Diagnostic','Foam surface formation','https://doi.org/10.3390/polym14061078'],
 ['Recycled PP has same MFR but fills differently','A new recycled-PP lot has a similar MFR result but needs a different pressure response to reach the same fill.',['Reject the MFR test as invalid','Compare process actuals with rheology evidence','Copy the previous lot’s settings because MFR matches','Increase mould temperature until pressure matches'],1,'Similar MFR does not guarantee identical shear-dependent moulding rheology or composition.','materials','Diagnostic','MFR versus mouldability','https://doi.org/10.1007/s13367-023-00081-y'],
 ['Gate erosion changes balance','A fibre-filled multicavity mould slowly develops a branch imbalance and gate dimensions show measurable wear.',['Correct the imbalance permanently with cavity-independent machine settings','Restore worn flow geometry, then reconfirm process balance','Increase cooling time','Ignore wear if average part mass passes'],1,'Abrasive wear can change local pressure drop; repair the physical cause before locking in compensation.','tooling','Diagnostic','Tool wear and maintenance','https://doi.org/10.1515/ipp-2022-0014'],
 ['Hot-runner leak suspected','Degraded material appears near a manifold/nozzle interface and a zone’s heater demand changes unexpectedly.',['Continue production until displayed temperature moves','Isolate safely and inspect the hot-runner','Increase injection pressure','Open the hot runner while hot and pressurised'],1,'The evidence can indicate leakage or local thermal trouble and requires the supplier/site safe service procedure.','tooling','Applied','Hot-runner service evidence',null],
 ['Warm-up state changes first-off parts','Dimensions drift for early cycles after a long cold start and stabilise after the mould and hot runner reach equilibrium.',['Save a separate permanent packing correction for the first cycles','Control the approved warm-up state before production','Increase clamp force during startup','Ignore first-off parts without a defined startup plan'],1,'Thermal equilibrium is a process state; startup acceptance should be defined and controlled separately from steady production.','process','Applied','Commissioning/warm-up baseline',null],
 ['Mass prediction stays good but dimension model worsens','A quality model still predicts part mass accurately but its dimension prediction error increases after a material-lot change.',['Assume all model outputs remain valid because one target is accurate','Check target-specific model drift and independent dimensional truth','Change the dimension specification','Retrain using the failed predictions as ground truth'],1,'Different quality targets can depend on different signal features; one accurate output does not validate another.','quality','Expert','Model drift and external validation',null],
 ['Cooling change improves cycle but worsens warp','A cooling redesign reduces cycle time but increases a critical warpage mode.',['Keep the faster cycle because cooling improved','Revalidate thermal/ejection quality window','Increase injection speed to counter warpage','Average the old and new cooling times'],1,'Cooling efficiency and thermal balance are not identical objectives; the redesigned condition must meet the actual part-quality boundary.','tooling','Expert','Cooling design validation','https://doi.org/10.4028/p-q2k0v8']
];
function scenarioFeedback(options,correct,why){return options.map((_,i)=>i===correct?'Correct. '+why:'Not the strongest first move. This option does not test the mechanism most directly supported by the stated evidence.')}
function addScenarios(){
 const have=new Set(D.scenarios.map(s=>norm(s.title)));
 for(const a of MORE_SCENARIOS){if(have.has(norm(a[0])))continue;D.scenarios.push({title:a[0],situation:a[1],choices:a[2],correct:a[3],why:a[4],feedback:scenarioFeedback(a[2],a[3],a[4]),category:a[5],difficulty:a[6],reference:a[7],sourceUrl:a[8]||null})}
 D.scenarios.forEach((s,i)=>{s.mmStableId=s.mmStableId||scenarioId(i);s.difficulty=s.difficulty|| (i<8?'Foundation':i<16?'Diagnostic':'Applied');s.category=s.category||primaryCompetency(s.title+' '+s.situation,i);s.revision=VERSION});
}

function analytics(){const a=ASSESSMENT_STORAGE.read(ANALYTICS_KEY,{schema:1,version:VERSION,questions:{},scenarios:{},exams:{},started:0,graded:0});a.schema=1;a.version=VERSION;a.questions=obj(a.questions)?a.questions:{};a.scenarios=obj(a.scenarios)?a.scenarios:{};a.exams=obj(a.exams)?a.exams:{};return a}
function saveAnalytics(a){ASSESSMENT_STORAGE.write(ANALYTICS_KEY,a)}
function updateQuestionAnalytics(q,selected,ok,ms){const a=analytics(),id=q.stableId||q.mmStableId||q.mmId||norm(q.q);const x=a.questions[id]||{stableId:id,attempts:0,correct:0,wrong:0,unanswered:0,totalResponseMs:0,optionSelections:{},difficulty:q.difficulty||'',competency:q.competency||'',concept:q.concept||'',stem:q.q||''};x.attempts++;if(selected==null)x.unanswered++;else{x.optionSelections[q.options[selected]]=(x.optionSelections[q.options[selected]]||0)+1;ok?x.correct++:x.wrong++}if(Number.isFinite(ms)&&ms>=0){x.totalResponseMs+=Math.min(ms,3600000);x.lastResponseMs=Math.min(ms,3600000)}x.last=Date.now();a.questions[id]=x;saveAnalytics(a)}
function updateExamAnalytics(level,region,pct,passed){const a=analytics(),key=level+'-'+region,x=a.exams[key]||{attempts:0,passes:0,best:0,totalScore:0};x.attempts++;x.passes+=passed?1:0;x.best=Math.max(x.best,pct);x.totalScore+=pct;x.last=Date.now();a.exams[key]=x;a.graded=(a.graded||0)+1;saveAnalytics(a)}
function updateScenarioAnalytics(s,selected,ok){const a=analytics(),id=s.mmStableId||norm(s.title),x=a.scenarios[id]||{stableId:id,title:s.title,attempts:0,correct:0,wrong:0,selections:{},category:s.category||'',difficulty:s.difficulty||''};x.attempts++;ok?x.correct++:x.wrong++;x.selections[s.choices[selected]]=(x.selections[s.choices[selected]]||0)+1;x.last=Date.now();a.scenarios[id]=x;saveAnalytics(a)}
function analyticsSummary(){const a=analytics(),qs=Object.values(a.questions),attempts=qs.reduce((n,x)=>n+x.attempts,0),correct=qs.reduce((n,x)=>n+x.correct,0),hard=qs.filter(x=>x.attempts>=1).sort((x,y)=>(x.correct/x.attempts)-(y.correct/y.attempts)||y.attempts-x.attempts).slice(0,3),slow=qs.filter(x=>x.totalResponseMs>0).sort((x,y)=>(y.totalResponseMs/y.attempts)-(x.totalResponseMs/x.attempts)).slice(0,3);return {attempts,accuracy:attempts?Math.round(correct/attempts*100):null,hard,slow,examAttempts:Object.values(a.exams).reduce((n,x)=>n+x.attempts,0)}}

let examSession=null;
function applyQuestionBadges(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const cards=[...document.querySelectorAll('#examQuestions .question')];
 cards.forEach((card,i)=>{const q=activeExam.questions[i],b=card.querySelector('b');if(!q||!b||card.querySelector('.mm-qmeta'))return;const meta=document.createElement('div');meta.className='mm-qmeta';meta.innerHTML=`<span>${esc(q.difficulty||'Applied')}</span><span>${esc(LABELS[q.competency]||q.competency||'General')}</span><span>${esc(q.stableId||q.mmStableId||'')}</span>`;b.insertAdjacentElement('afterend',meta)});
}
function startTiming(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const now=performance.now();examSession={started:now,firstResponse:{},graded:false};const a=analytics();a.started=(a.started||0)+1;saveAnalytics(a);
 document.querySelectorAll('#examQuestions input[type=radio]').forEach(input=>input.addEventListener('change',()=>{const m=/ex(\d+)/.exec(input.name);if(!m||!examSession)return;const i=+m[1];if(examSession.firstResponse[i]==null)examSession.firstResponse[i]=performance.now()-now},{passive:true}));
}
function sourceFreshness(q){if(!q?.sourceUrl)return 'No external URL on this item; use the cited engineering rationale and current controlled documents.';const today=new Date().toISOString().slice(0,10);return today>SOURCE_REVIEW_BY?`Source review due — last curated ${SOURCE_REVIEWED}. Recheck edition/status before formal use.`:`Source status/freshness reviewed ${SOURCE_REVIEWED}; next scheduled review by ${SOURCE_REVIEW_BY}.`}
function enhanceReview(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;const rows=[...document.querySelectorAll('#answerReview .answer-row')];rows.forEach((row,i)=>{if(row.querySelector('.mm-evidence')||!activeExam.questions[i])return;const q=activeExam.questions[i],url=q.sourceUrl?`<a class="standard-link" href="${esc(q.sourceUrl)}" target="_blank" rel="noopener">Open exact source ↗</a>`:'No external URL is assigned to this engineering-principle item.';row.insertAdjacentHTML('beforeend',`<details class="mm-evidence"><summary>Evidence, difficulty & revision</summary><div><b>${esc(LABELS[q.competency]||q.competency||'General')}</b> · ${esc(q.difficulty||'Applied')} · <code>${esc(q.stableId||q.mmStableId||q.mmId||'')}</code></div><p>${esc(q.reference||'Engineering principle')}</p><p>${url}</p><small>${esc(sourceFreshness(q))} · Question revision ${esc(q.revision||VERSION)}</small></details>`)});
}
function addStyles(){if(document.getElementById('mm-assessment-quality-style'))return;const s=document.createElement('style');s.id='mm-assessment-quality-style';s.textContent=`.mm-qmeta{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0 8px}.mm-qmeta span{font-size:9.5px;border:1px solid #36506e;border-radius:999px;padding:3px 6px;color:#a9bdd6;background:#0b192a}.mm-evidence{margin-top:9px;padding-top:8px;border-top:1px solid #2a425e}.mm-evidence summary{cursor:pointer;color:#72e6cd;font-size:12px;font-weight:700}.mm-evidence p{margin:6px 0;font-size:11.5px}.mm-evidence code{font-size:10px;color:#a9bdd6}.mm-analytics{padding:16px;margin-top:14px}.mm-analytics-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mm-analytics-grid>div{padding:10px;border:1px solid #2b405b;border-radius:9px;background:#0d1c30}.mm-analytics-grid b{display:block;font-size:20px}.mm-analytics ul{margin:8px 0 0;padding-left:18px;color:#b8c9dc;font-size:12px}@media(max-width:680px){.mm-analytics-grid{grid-template-columns:1fr}.mm-qmeta span{font-size:9px}}`;document.head.appendChild(s)}

const baseStart=typeof window.startExam==='function'?window.startExam:(typeof startExam==='function'?startExam:null);
if(baseStart)window.startExam=function(){const r=baseStart.apply(this,arguments);setTimeout(()=>{applyQuestionBadges();startTiming()},0);return r};
const baseGrade=typeof window.gradeExam==='function'?window.gradeExam:(typeof gradeExam==='function'?gradeExam:null);
if(baseGrade)window.gradeExam=function(level){
 if(typeof activeExam!=='undefined'&&activeExam?.level===level&&examSession&&!examSession.graded){let correct=0,criticalWrong=0;activeExam.questions.forEach((q,i)=>{const el=document.querySelector(`input[name=ex${i}]:checked`),selected=el?+el.value:null,ok=selected===q.correct;if(ok)correct++;if(q.critical&&!ok)criticalWrong++;updateQuestionAnalytics(q,selected,ok,examSession.firstResponse[i]??(performance.now()-examSession.started))});const pct=Math.round(correct/activeExam.questions.length*100),passed=pct>=80&&criticalWrong===0;updateExamAnalytics(level,activeExam.region,pct,passed);examSession.graded=true}
 const r=baseGrade.apply(this,arguments);setTimeout(enhanceReview,0);return r;
};
const baseAnswer=typeof window.answerScenario==='function'?window.answerScenario:(typeof answerScenario==='function'?answerScenario:null);
if(baseAnswer)window.answerScenario=function(i,ci,el){const s=D.scenarios[i],ok=!!s&&ci===s.correct;if(s)updateScenarioAnalytics(s,ci,ok);const r=baseAnswer.apply(this,arguments);if(s){const f=document.getElementById('sf'+i);if(f){const fb=s.feedback?.[ci]||s.why,src=s.sourceUrl?`<div class="ref"><a class="standard-link" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.reference||'Evidence source')} ↗</a></div>`:`<div class="ref">Reference: ${esc(s.reference||'Evidence-based injection-moulding principle')}</div>`;f.innerHTML=`<b>${ok?'Strong choice ✓':'Not the strongest first move'}</b><br>${esc(fb)}${src}<div class="tiny muted">${esc(s.difficulty||'Applied')} · ${esc(LABELS[s.category]||s.category||'General')} · ${esc(s.mmStableId||'')}</div>`}}return r};
const baseRenderExams=typeof window.renderExams==='function'?window.renderExams:(typeof renderExams==='function'?renderExams:null);
if(baseRenderExams)window.renderExams=function(){const r=baseRenderExams.apply(this,arguments);const host=document.getElementById('exams');if(host&&!host.querySelector('.mm-analytics')){const s=analyticsSummary(),hard=s.hard.map(x=>`<li>${esc(x.stem||x.stableId)} — ${Math.round(x.correct/x.attempts*100)}% correct</li>`).join('')||'<li>No graded question data yet.</li>',slow=s.slow.map(x=>`<li>${esc(x.stem||x.stableId)} — ${Math.round(x.totalResponseMs/x.attempts/1000)}s average</li>`).join('')||'<li>No response-time data yet.</li>';host.insertAdjacentHTML('beforeend',`<section class="card mm-analytics"><span class="eyebrow">Device-local learning analytics</span><h3>Question performance</h3><p class="muted">Stored only in this browser/device. It is not uploaded by MouldMaster.</p><div class="mm-analytics-grid"><div><span class="muted tiny">Question attempts</span><b>${s.attempts}</b></div><div><span class="muted tiny">Answer accuracy</span><b>${s.accuracy==null?'—':s.accuracy+'%'}</b></div><div><span class="muted tiny">Exam attempts</span><b>${s.examAttempts}</b></div></div><div class="grid2" style="margin-top:10px"><div><b>Hardest so far</b><ul>${hard}</ul></div><div><b>Slowest so far</b><ul>${slow}</ul></div></div><button class="ghost" type="button" style="margin-top:10px" data-mm-onclick="MM_ASSESSMENT_ANALYTICS.reset()">Reset local analytics</button></section>`)}return r};

function nearDuplicates(){const rows=[];for(const level of LEVELS)for(const q of D.exams[level]||[])rows.push({id:META_BY_TEXT.get(norm(q[0]))?.stableId||'',text:q[0],level});const pairs=[];const tok=s=>new Set(norm(s).split(/[^a-z0-9]+/).filter(x=>x.length>3&&!['which','what','strongest','first','most','when','does','with','from','that','this'].includes(x)));for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){if(rows[i].level!==rows[j].level)continue;const a=tok(rows[i].text),b=tok(rows[j].text),inter=[...a].filter(x=>b.has(x)).length,uni=new Set([...a,...b]).size,score=uni?inter/uni:0;if(score>=.72)pairs.push({...rows[i],other:rows[j].id,score:+score.toFixed(2)})}return pairs}
function leakRisks(){const out=[];for(const level of LEVELS)(D.exams[level]||[]).forEach((q,i)=>{const lens=q[1].map(x=>String(x).length),c=lens[q[2]],others=lens.filter((_,j)=>j!==q[2]),med=others.sort((a,b)=>a-b)[1];if(c>med*1.85&&c-med>28)out.push({id:identityFor(q,'technical',level,null,i).stableId,type:'correct-option-length',correctLength:c,peerMedian:med})});return out}

addScenarios();rebuildMeta();const migrated=migrateStableReviewIds();addStyles();
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.qualitySuite={version:VERSION,reviewed:'26 August 2026',questionBankRevision:VERSION,stableQuestionIds:true,identityLockVersion:IDENTITY_LOCK_VERSION,identityLockedQuestions:LOCKED_IDENTITIES.length,analytics:'device-local only',examBlueprint:['Materials & rheology','Machine & controls','Tooling & thermal','Process development','Quality & statistics','Troubleshooting','Safety & compliance'],technicalExamItems:30,regionalExamItems:27,totalExamItems:57,scenarioDrills:D.scenarios.length,sourceFreshnessReviewed:SOURCE_REVIEWED,sourceFreshnessReviewBy:SOURCE_REVIEW_BY,migratedLegacyReviewRecords:migrated};
if(D.assessmentQA.deepAudit)D.assessmentQA.deepAudit.scenarioDrills=D.scenarios.length;
D.assessmentQA.questionRevisionHistory=[
 {version:'2026.08.21.1',date:'21 August 2026',change:'Prior stable assessment bank identifier used by spaced review.'},
 {version:'2026.08.24',date:'24 August 2026',change:'100-pass structural/safety audit and deep question review.'},
 {version:VERSION,date:'24 August 2026',change:'Stable IDs, competency blueprint, local analytics, per-question evidence, difficulty calibration, scenario expansion, duplicate/leak checks and freshness monitoring.'}
];
window.MM_ASSESSMENT_ANALYTICS={version:VERSION,summary:analyticsSummary,export:()=>analytics(),reset:()=>{ASSESSMENT_STORAGE.removeItem(ANALYTICS_KEY);try{window.renderExams?.()}catch(_){}}};
window.MM_ASSESSMENT_QUALITY={version:VERSION,identityLockVersion:IDENTITY_LOCK_VERSION,identityCount:LOCKED_IDENTITIES.length,blueprint:BLUEPRINT.slice(),labels:{...LABELS},scenarioCount:D.scenarios.length,questionCount:57,nearDuplicates:nearDuplicates(),answerLeakRisks:leakRisks(),coverage:(level)=>blueprintCoverage(selectBlueprint(level)),resolveIdentity:(q,kind,level,region,index)=>identityFor(q,kind,level,region,index),sourceReview:{reviewed:SOURCE_REVIEWED,reviewBy:SOURCE_REVIEW_BY}};
})();
/* <<< assessment-quality-suite.js */

/* >>> assessment-stable-review-bridge.js */
/* MouldMaster stable spaced-review ID + blueprint guard — reviewed answer validation 2026-09-10 */
(function(){
'use strict';
const S=window.MM_ASSESSMENT_QUALITY,D=window.MM_DATA;
if(!S||!D||typeof window.getExamQuestions!=='function')throw new Error('Assessment quality suite must load before stable review bridge');

/* Reviewed keyed wording contract. The strings below are authored upstream in the source
   banks. This bridge is validation-only: it must never rewrite learner-visible assessment
   text. A mismatch is source drift and fails closed until the content is re-reviewed. */
const STRICT_ANSWER_BALANCE={
 'tech:Beginner:0':'Part-mass plateau supports gate seal for this condition',
 'tech:Beginner:1':'Insufficient evidence; trend repeated shot-delivery actuals first',
 'tech:Beginner:2':'The actual fill response changed; compare it with the known-good baseline',
 'tech:Beginner:3':'Shear, screw work, residence and throughput also affect actual melt temperature',
 'tech:Beginner:4':'Verify the exact grade’s approved moisture and drying requirement',
 'tech:Beginner:5':'Compare the physical fill-to-pack transition and pressure response first',
 'tech:Beginner:6':'Inspect the serviced local shutoff before changing global clamp force',
 'tech:Beginner:7':'Check the repaired runner/gate branch with cavity-specific fill evidence',
 'tech:Beginner:8':'Verify cooling flow, routing and local mould temperatures',
 'tech:Beginner:9':'Compare current process actuals and material condition with the known-good baseline',
 'tech:Intermediate:0':'A repeatable part-mass plateau as hold time increases',
 'tech:Intermediate:1':'Trapped gas at the end-of-fill vent',
 'tech:Intermediate:3':'Inspect the local insert/shutoff before global process changes',
 'tech:Intermediate:4':'Compare cavity-specific fill evidence with the lagging runner/gate branch',
 'tech:Intermediate:6':'Specks clear through the approved purge/start-up sequence',
 'tech:Intermediate:7':'Ejection, dimensions, warpage and function',
 'tech:Intermediate:8':'Check affected-circuit flow and local mould temperatures',
 'tech:Intermediate:9':'For a focused confirmation where interactions are not central',
 'tech:Advanced:0':'The process is relatively tight but poorly centred',
 'tech:Advanced:1':'Check cavity-specific or rational-subgroup capability, not only pooled Cpk',
 'tech:Advanced:2':'The factors interact; mould-temperature effect depends on packing pressure',
 'tech:Advanced:3':'Run order may confound the factor with time drift; randomise or block',
 'tech:Advanced:4':'Treat machine/nozzle and cavity pressure as different-location signals',
 'tech:Advanced:6':'Treat the failed confirmation as evidence the model does not yet generalise',
 'tech:Advanced:7':'Match validated physical process outputs on a capable receiving machine',
 'tech:Advanced:8':'MFR does not fully describe moulding rheology or mouldability',
 'tech:Advanced:9':'Insufficient evidence until location, units and timing are verified',

 'reg:UK:Beginner:0':'Prevent access or stop dangerous movement before access',
 'reg:UK:Beginner:1':'Stop normal use until the interlock is restored',
 'reg:UK:Beginner:2':'Assess the fume hazard and apply the relevant exposure controls',
 'reg:UK:Intermediate:0':'Use GB PUWER 1998 or NI 1999 rules according to jurisdiction',
 'reg:UK:Intermediate:1':'Isolate all energy and verify safe state before access',
 'reg:UK:Intermediate:2':'Incorrect: ISO 20430 does not replace workplace law',
 'reg:UK:Advanced:0':'Assess the integrated cell and all foreseeable access/tasks as one system',
 'reg:UK:Advanced:1':'Conformity evidence does not remove the employer’s workplace duties',
 'reg:UK:Advanced:2':'Redesign the DOE without defeating safeguards',
 'reg:US:Beginner:0':'Use effective point-of-operation guarding',
 'reg:US:Beginner:1':'Keep the gate/interlock effective in production',
 'reg:US:Beginner:2':'Use HazCom labels, SDS and training',
 'reg:US:Intermediate:0':'Apply LOTO before servicing access',
 'reg:US:Intermediate:1':'Emergency stop is not energy isolation; apply LOTO',
 'reg:US:Intermediate:2':'B151.1 informs controls; OSHA duties still apply',
 'reg:US:Advanced:0':'Apply the governing federal OSHA or State Plan rules',
 'reg:US:Advanced:1':'Only when narrow criteria and alternative protection are met',
 'reg:US:Advanced:2':'Assess and safeguard the integrated robot/moulding cell as one system',
 'reg:NZ:Beginner:0':'The PCBU holds the primary reasonably-practicable health and safety duty',
 'reg:NZ:Beginner:1':'Eliminate risk first; otherwise minimise it',
 'reg:NZ:Beginner:2':'Keep it out of use until the safeguard is restored',
 'reg:NZ:Intermediate:0':'Isolate all energy and verify safe state',
 'reg:NZ:Intermediate:1':'Use AS/NZS 4024 as safety evidence while still meeting legal duties',
 'reg:NZ:Intermediate:2':'Verify safeguards before authorised return to service',
 'reg:NZ:Advanced:0':'HSWA duties remain; standards inform controls',
 'reg:NZ:Advanced:1':'Assess the integrated system, interfaces, tasks and safeguards as a whole',
 'reg:NZ:Advanced:2':'Not yet in force; commencement is 1 April 2027',

 'scenario:01':'Check shot-delivery/NRV, feed and injection actuals',
 'scenario:02':'Inspect end-of-fill venting and test fill-speed sensitivity',
 'scenario:03':'Inspect local parting-line/insert seating',
 'scenario:04':'Study cooling time against ejection and part quality',
 'scenario:05':'Verify drying history and actual material moisture',
 'scenario:06':'Run a cavity-balance study and inspect the repaired runner',
 'scenario:07':'Trend cooling, material, process and measurement evidence by shift',
 'scenario:08':'Check local gate, geometry and cooling after gate seal',
 'scenario:09':'Compare current fill/pressure, material and thermal actuals with baseline',
 'scenario:10':'Inspect the affected branch/gate using cavity-specific fill evidence',
 'scenario:11':'Check feed, recovery actuals and shot-delivery repeatability',
 'scenario:12':'Verify cooling routing, flow and thermal balance against baseline',
 'scenario:13':'Review draft, texture, cooling, ejection load and tooling condition',
 'scenario:14':'Verify the new measurement fixture before interpreting Cpk',
 'scenario:15':'Treat run order as a confounder; randomise/block the study',
 'scenario:16':'Treat pressures as different-location signals; check the cavity event and sensor',
 'scenario:17':'Compare heater duty and branch-specific cavity evidence',
 'scenario:18':'Check coolant flow',
 'scenario:19':'Test check-ring sealing',
 'scenario:20':'Purge safely and check degraded hold-up',
 'scenario:21':'Check local venting',
 'scenario:22':'Validate weld-line flow and mechanics',
 'scenario:23':'Inspect the local shutoff',
 'scenario:24':'Check valve-gate timing and cavity evidence',
 'scenario:25':'Review pressure history, transfer and sensor health',
 'scenario:26':'Verify vision metrology before changing moulding',
 'scenario:27':'Check sensor zero and acquisition path',
 'scenario:28':'Check robot handshake',
 'scenario:29':'Check energy phases and boundary',
 'scenario:30':'Map interface thermal/flow history',
 'scenario:31':'Record insert/interface thermal state and transfer delay',
 'scenario:32':'Check local thermal, venting and microflow evidence',
 'scenario:33':'Check cell structure and relevant mechanical response',
 'scenario:34':'Check skin/thermal history and foaming method',
 'scenario:35':'Compare process actuals with rheology evidence',
 'scenario:36':'Restore worn flow geometry, then reconfirm process balance',
 'scenario:37':'Isolate safely and inspect the hot-runner',
 'scenario:38':'Control the approved warm-up state before production',
 'scenario:39':'Check target-specific model drift and independent dimensional truth',
 'scenario:40':'Revalidate thermal/ejection quality window'
};

function optionsOf(q){return q?.options??q?.[1]}
function correctOf(q){return Number(q?.correct??q?.[2])}
function validateReviewedAnswers(requireFull){
 let validated=0;
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
  const id=`tech:${level}:${i}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)continue;
  const q=D.exams[level][i],opts=optionsOf(q),key=correctOf(q);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);if(String(opts[key])!==replacement)throw new Error(`Reviewed keyed answer drift: ${id}`);validated++;
 }
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){
  const id=`reg:${region}:${level}:${i}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)continue;
  const q=D.regionalQuestions[region][level][i],opts=optionsOf(q),key=correctOf(q);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);if(String(opts[key])!==replacement)throw new Error(`Reviewed keyed answer drift: ${id}`);validated++;
 }
 (D.scenarios||[]).forEach((s,i)=>{
  const id=s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,replacement=STRICT_ANSWER_BALANCE[id];if(!replacement)return;
  const opts=s.choices,key=Number(s.correct);if(!Array.isArray(opts)||opts.length!==4||key<0||key>3)throw new Error(`Strict answer-balance source invalid: ${id}`);if(String(opts[key])!==replacement)throw new Error(`Reviewed keyed answer drift: ${id}`);validated++;
 });
 if(validated>94||requireFull&&validated!==94)throw new Error(`Reviewed keyed answer coverage mismatch: ${validated}/94`);
 window.MM_STABLE_REVIEW_BRIDGE.strictAnswerBalance.validated=validated;
 return validated;
}

const base=window.getExamQuestions;
window.getExamQuestions=function(){
 validateReviewedAnswers(false);
 const rows=base.apply(this,arguments);
 const technical=rows.filter(q=>q&&q.kind==='technical');
 const covered=new Set();
 technical.forEach(q=>(Array.isArray(q.competencies)&&q.competencies.length?q.competencies:[q.competency]).filter(Boolean).forEach(c=>covered.add(c)));
 const missing=(S.blueprint||[]).filter(c=>!covered.has(c));
 if(missing.length)throw new Error(`Assessment blueprint incomplete: missing ${missing.join(', ')}`);
 rows.forEach(q=>{if(q&&q.stableId)q.mmId=q.stableId});
 return rows;
};

window.MM_STABLE_REVIEW_BRIDGE={version:'2026.09.10.1',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{validated:0,required:94,runtimeTextMutations:0,policy:'Reviewed keyed answer wording is source-authored; runtime validates drift only; key indexes unchanged'}};
validateReviewedAnswers(false);
function finalizeBalance(){validateReviewedAnswers(true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finalizeBalance,{once:true});else finalizeBalance();
})();
/* <<< assessment-stable-review-bridge.js */

/* >>> assessment-analytics-ui.js */
/* MouldMaster local assessment analytics review UI — 2026-08-24.2 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D)return;
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
function correctText(id){
 let m=/^tech:([^:]+):(\d+)$/.exec(id);if(m){const q=D.exams?.[m[1]]?.[+m[2]];return q?q[1][q[2]]:null}
 m=/^reg:([^:]+):([^:]+):(\d+)$/.exec(id);if(m){const q=D.regionalQuestions?.[m[1]]?.[m[2]]?.[+m[3]];return q?q[1][q[2]]:null}
 return null;
}
function metrics(){
 const a=window.MM_ASSESSMENT_ANALYTICS?.export?.()||{questions:{},exams:{}};
 const byDifficulty={},distractors=[];
 for(const q of Object.values(a.questions||{})){
  const d=q.difficulty||'Unclassified',x=byDifficulty[d]||(byDifficulty[d]={attempts:0,correct:0});x.attempts+=q.attempts||0;x.correct+=q.correct||0;
  const correct=correctText(q.stableId),wrong=Object.entries(q.optionSelections||{}).filter(([o])=>o!==correct).sort((x,y)=>y[1]-x[1]);
  if(wrong.length&&q.attempts){distractors.push({id:q.stableId,stem:q.stem,option:wrong[0][0],count:wrong[0][1],rate:Math.round(wrong[0][1]/q.attempts*100)})}
 }
 const exams=Object.entries(a.exams||{}).map(([key,x])=>({key,attempts:x.attempts||0,passRate:x.attempts?Math.round((x.passes||0)/x.attempts*100):0,average:x.attempts?Math.round((x.totalScore||0)/x.attempts):0,best:x.best||0})).sort((a,b)=>b.attempts-a.attempts||a.key.localeCompare(b.key));
 return {raw:a,byDifficulty:Object.entries(byDifficulty).map(([difficulty,x])=>({difficulty,...x,accuracy:x.attempts?Math.round(x.correct/x.attempts*100):0})),distractors:distractors.sort((a,b)=>b.count-a.count||b.rate-a.rate).slice(0,5),exams};
}
function enhance(){
 const host=document.querySelector('.mm-analytics');if(!host||host.querySelector('[data-mm-analytics-review]'))return;
 const m=metrics(),diff=m.byDifficulty.map(x=>`<li><b>${esc(x.difficulty)}</b>: ${x.accuracy}% (${x.correct}/${x.attempts})</li>`).join('')||'<li>No difficulty data yet.</li>',dist=m.distractors.map(x=>`<li><b>${esc(x.id)}</b> — ${esc(x.option)} · ${x.rate}% of attempts</li>`).join('')||'<li>No wrong-answer selections recorded yet.</li>',exam=m.exams.map(x=>`<li><b>${esc(x.key)}</b>: ${x.passRate}% pass · ${x.average}% avg · ${x.best}% best (${x.attempts} attempt${x.attempts===1?'':'s'})</li>`).join('')||'<li>No exam attempts recorded yet.</li>';
 host.insertAdjacentHTML('beforeend',`<details data-mm-analytics-review="1" style="margin-top:12px"><summary style="cursor:pointer;color:#72e6cd;font-weight:700">Question-bank analytics detail</summary><div class="grid2" style="margin-top:10px"><div><b>Accuracy by difficulty</b><ul>${diff}</ul></div><div><b>Most-selected wrong distractors</b><ul>${dist}</ul></div></div><div style="margin-top:10px"><b>Exam pass rates</b><ul>${exam}</ul></div><button type="button" class="ghost" style="margin-top:8px" data-mm-onclick="MM_ASSESSMENT_ANALYTICS_REVIEW.exportJSON()">Export local analytics JSON</button></details>`);
}
const base=typeof window.renderExams==='function'?window.renderExams:null;if(base)window.renderExams=function(){const r=base.apply(this,arguments);setTimeout(enhance,0);return r};
window.MM_ASSESSMENT_ANALYTICS_REVIEW={version:'2026.08.24.2',metrics,enhance,exportJSON(){const blob=new Blob([JSON.stringify(metrics(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-question-analytics.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,0),{once:true});else setTimeout(enhance,0);
})();
/* <<< assessment-analytics-ui.js */

/* >>> assessment-final-hardening.js */
/* MouldMaster final assessment hardening — 2026-08-24.3 */
(function(){
'use strict';
const D=window.MM_DATA;
const A=window.MM_ASSESSMENT_ANALYTICS;
const S=window.MM_ASSESSMENT_STORAGE_SCOPE;
if(!D||!A||!S||typeof S.read!=='function'||typeof window.startExam!=='function'||typeof window.gradeExam!=='function')throw new Error('Assessment quality, learner storage and analytics must load before final hardening');

const VERSION='2026.08.24.3';
const BANK_VERSION='2026.08.30.1';
const TIMING_KEY='mm_assessment_exposure_timing_v1';
const SOURCE_REVIEWED='2026-08-26';
const SOURCE_REVIEW_BY='2026-11-26';
const BASELINE={revision:1,date:'2026-08-20',change:'Safety-first audited assessment baseline.'};
const REVISION2={
 'tech:Beginner:3':{revision:2,date:'2026-08-24',change:'Deepened barrel-setpoint versus measured melt-temperature reasoning and made competing thermal explanations more realistic.'},
 'tech:Beginner:4':{revision:2,date:'2026-08-24',change:'Reframed drying around grade-specific moisture evidence rather than generic drying recipes.'},
 'tech:Beginner:9':{revision:2,date:'2026-08-24',change:'Changed from simple troubleshooting recognition to comparison against known-good evidence.'},
 'tech:Intermediate:0':{revision:2,date:'2026-08-24',change:'Clarified that a part-mass plateau is supporting gate-seal evidence for the tested condition, not universal proof.'},
 'tech:Intermediate:5':{revision:2,date:'2026-08-24',change:'Strengthened shot-delivery diagnosis before packing compensation.'},
 'tech:Intermediate:7':{revision:2,date:'2026-08-24',change:'Expanded cooling acceptance to include ejection condition, conditioned dimensions, warpage and product requirements.'},
 'tech:Intermediate:9':{revision:2,date:'2026-08-24',change:'Clarified the legitimate use and limitations of one-factor-at-a-time testing.'},
 'tech:Advanced:1':{revision:2,date:'2026-08-24',change:'Added pooled-versus-cavity-specific capability and rational-subgroup reasoning.'},
 'tech:Advanced:3':{revision:2,date:'2026-08-24',change:'Replaced definition recall with a real DOE time-confounding case.'},
 'tech:Advanced:4':{revision:2,date:'2026-08-24',change:'Distinguished upstream machine/nozzle pressure from local cavity-pressure history.'},
 'tech:Advanced:7':{revision:2,date:'2026-08-24',change:'Reframed machine transfer around reproduced physical process outputs and receiving-machine capability.'},
 'tech:Advanced:8':{revision:2,date:'2026-08-24',change:'Added research-backed distinction between MFR and moulding rheology/mouldability.'}
};
const REGIONAL_REVISION_CHANGE='Reframed jurisdiction-specific safety/compliance recall into an applied decision while retaining the safety-critical answer key and direct official/standards evidence.';
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<3;i++)REVISION2[`reg:${region}:${level}:${i}`]={revision:2,date:'2026-08-30',change:REGIONAL_REVISION_CHANGE};
const REVISION3={
 'tech:Beginner:0':{revision:3,date:'2026-08-30',change:'Replaced definition recall with a controlled hold-time/part-mass plateau interpretation while retaining the pack/hold competency.'},
 'tech:Beginner:1':{revision:3,date:'2026-08-30',change:'Changed cushion recognition into a linked shot-delivery evidence case where one isolated value is insufficient for root-cause assignment.'},
 'tech:Beginner:2':{revision:3,date:'2026-08-30',change:'Reframed injection-speed knowledge around unchanged commands versus changed fill-time and pressure actuals.'},
 'tech:Beginner:5':{revision:3,date:'2026-08-30',change:'Reframed V/P transfer as interpretation of the measured fill-to-pack transition and cavity-pressure response.'},
 'tech:Beginner:6':{revision:3,date:'2026-08-30',change:'Reframed clamp reasoning around local flash evidence after service instead of automatic global clamp compensation.'},
 'tech:Beginner:7':{revision:3,date:'2026-08-30',change:'Reframed gate/runner knowledge as a branch-specific fill-delay and pressure-loss diagnostic after repair.'},
 'tech:Beginner:8':{revision:3,date:'2026-08-30',change:'Reframed cooling knowledge around circuit/thermal evidence and directional warpage while filling remains stable.'},
 'tech:Intermediate:1':{revision:3,date:'2026-08-30',change:'Changed burn-mark troubleshooting into an end-of-fill location and controlled-speed discrimination case for trapped gas/venting.'},
 'tech:Intermediate:2':{revision:3,date:'2026-08-30',change:'Changed splay troubleshooting into a moisture-versus-filling discrimination case requiring direct material-condition evidence.'},
 'tech:Intermediate:3':{revision:3,date:'2026-08-30',change:'Changed flash troubleshooting into cavity-specific post-service fault isolation before global process changes.'},
 'tech:Intermediate:4':{revision:3,date:'2026-08-30',change:'Changed cavity-balance knowledge into a local-branch restriction versus global-viscosity discrimination test.'},
 'tech:Intermediate:6':{revision:3,date:'2026-08-30',change:'Changed black-speck troubleshooting into thermal-history diagnosis with recovery evidence through the approved purge/start-up sequence.'},
 'tech:Intermediate:8':{revision:3,date:'2026-08-30',change:'Changed warpage troubleshooting into a cooling-circuit thermal-evidence discrimination case with stable fill/shot evidence.'},
 'tech:Advanced:0':{revision:3,date:'2026-08-30',change:'Changed capability recall into Cp-versus-Cpk interpretation with stability and measurement adequacy established.'},
 'tech:Advanced:2':{revision:3,date:'2026-08-30',change:'Changed DOE recall into interpretation of a factor interaction where the direction of one effect depends on another factor.'},
 'tech:Advanced:5':{revision:3,date:'2026-08-30',change:'Changed process-window knowledge into a fail-closed validation case where factor progression is confounded with a material-lot viscosity shift.'},
 'tech:Advanced:6':{revision:3,date:'2026-08-30',change:'Changed DOE-model knowledge into independent confirmation-run reasoning when predictions fail to reproduce.'},
 'tech:Advanced:9':{revision:3,date:'2026-08-30',change:'Changed pressure-loss recall into an explicit insufficient-evidence case when pressure-channel location, unit/reference or timing semantics are unresolved.'}
};
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const read=(k,d)=>S.read(k,d);
const write=(k,v)=>S.write(k,v);
function revisionFor(id){return REVISION3[id]||REVISION2[id]||BASELINE}
function allStableIds(){
 const out=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++)out.push(`tech:${level}:${i}`);
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++)out.push(`reg:${region}:${level}:${i}`);
 return out;
}

let timingSession=null;
function activeNow(){
 if(!timingSession)return performance.now();
 const now=performance.now();
 return now-(timingSession.hiddenAccum||0)-(timingSession.hiddenSince==null?0:now-timingSession.hiddenSince);
}
function markExposure(i){if(timingSession&&timingSession.firstExposure[i]==null)timingSession.firstExposure[i]=activeNow()}
function visibleFraction(el){
 const r=el.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight||0,vw=window.innerWidth||document.documentElement.clientWidth||0;
 const h=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0)),w=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0));
 const area=Math.max(1,r.width*r.height);return h*w/area;
}
function initExposureTiming(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 if(timingSession?.observer)try{timingSession.observer.disconnect()}catch(_){}
 timingSession={exam:activeExam,firstExposure:{},response:{},hiddenAccum:0,hiddenSince:document.hidden?performance.now():null,graded:false,observer:null};
 const cards=[...document.querySelectorAll('#examQuestions .question')];
 const visibilityCheck=()=>cards.forEach((card,i)=>{if(visibleFraction(card)>=0.55)markExposure(i)});
 if('IntersectionObserver' in window){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>=0.55){const i=cards.indexOf(e.target);if(i>=0)markExposure(i)}}),{threshold:[0.55]});
  cards.forEach(c=>obs.observe(c));timingSession.observer=obs;
 }else{
  window.addEventListener('scroll',visibilityCheck,{passive:true,once:false});
 }
 cards.forEach((card,i)=>{
  const expose=()=>markExposure(i);
  card.addEventListener('focusin',expose,{passive:true});card.addEventListener('pointerdown',expose,{passive:true});card.addEventListener('touchstart',expose,{passive:true});
  card.querySelectorAll('input[type=radio]').forEach(input=>input.addEventListener('change',()=>{markExposure(i);if(timingSession&&timingSession.response[i]==null)timingSession.response[i]=Math.max(0,activeNow()-timingSession.firstExposure[i])},{passive:true}));
 });
 document.addEventListener('visibilitychange',()=>{
  if(!timingSession)return;
  const now=performance.now();
  if(document.hidden&&timingSession.hiddenSince==null)timingSession.hiddenSince=now;
  else if(!document.hidden&&timingSession.hiddenSince!=null){timingSession.hiddenAccum+=now-timingSession.hiddenSince;timingSession.hiddenSince=null;visibilityCheck()}
 },{passive:true});
 setTimeout(visibilityCheck,0);
}
function timingStore(){const x=read(TIMING_KEY,{schema:1,version:VERSION,questions:{}});x.schema=1;x.version=VERSION;x.questions=x.questions&&typeof x.questions==='object'?x.questions:{};return x}
function persistExposureTiming(){
 if(!timingSession||timingSession.graded||timingSession.exam!==activeExam)return;
 const store=timingStore();
 activeExam.questions.forEach((q,i)=>{
  const ms=timingSession.response[i];if(!Number.isFinite(ms))return;
  const id=q.stableId||q.mmId;if(!id)return;
  const x=store.questions[id]||{stableId:id,attempts:0,totalResponseMs:0,minResponseMs:null,maxResponseMs:0,lastResponseMs:null};
  const v=Math.min(Math.max(0,Math.round(ms)),3600000);x.attempts++;x.totalResponseMs+=v;x.lastResponseMs=v;x.minResponseMs=x.minResponseMs==null?v:Math.min(x.minResponseMs,v);x.maxResponseMs=Math.max(x.maxResponseMs||0,v);x.last=Date.now();store.questions[id]=x;
 });
 timingSession.graded=true;write(TIMING_KEY,store);
}
function patchedAnalyticsExport(){
 const raw=A.__mmOriginalExport?A.__mmOriginalExport():A.export();
 const out=JSON.parse(JSON.stringify(raw||{})),t=timingStore();out.responseTimingBasis='first meaningful question exposure (>=55% visible or direct interaction), excluding hidden-tab time';
 for(const [id,x] of Object.entries(t.questions||{})){
  if(!out.questions?.[id])continue;const q=out.questions[id];
  q.legacyExamElapsedTotalMs=q.totalResponseMs??0;q.legacyExamElapsedLastMs=q.lastResponseMs??null;
  q.totalResponseMs=x.totalResponseMs;q.lastResponseMs=x.lastResponseMs;q.responseTimingAttempts=x.attempts;q.minResponseMs=x.minResponseMs;q.maxResponseMs=x.maxResponseMs;q.responseTimingBasis=out.responseTimingBasis;
 }
 return out;
}
function installAnalyticsExportPatch(){
 if(A.__mmExposureTimingPatched)return;
 const original=A.export.bind(A),originalReset=typeof A.reset==='function'?A.reset.bind(A):null;
 A.__mmOriginalExport=original;A.__mmOriginalReset=originalReset;A.export=patchedAnalyticsExport;
 if(originalReset)A.reset=function(){S.removeItem(TIMING_KEY);timingSession=null;return originalReset()};
 A.__mmExposureTimingPatched=true;
}
function slowestExposure(){
 const t=timingStore(),a=patchedAnalyticsExport(),rows=Object.values(t.questions||{}).filter(x=>x.attempts>0).map(x=>({id:x.stableId,avg:x.totalResponseMs/x.attempts,stem:a.questions?.[x.stableId]?.stem||x.stableId}));
 return rows.sort((x,y)=>y.avg-x.avg).slice(0,3);
}
function rewriteTimingPanel(){
 const host=document.querySelector('.mm-analytics');if(!host)return;
 const blocks=[...host.querySelectorAll('.grid2>div')],target=blocks.find(x=>/Slowest so far/i.test(x.textContent||''));if(!target)return;
 const rows=slowestExposure();target.innerHTML=`<b>Slowest by question exposure</b><ul>${rows.length?rows.map(x=>`<li>${esc(x.stem)} — ${Math.round(x.avg/1000)}s average</li>`).join(''):'<li>No exposure-based response-time data yet.</li>'}</ul><small class="muted">Timing starts when a question is substantially visible or directly interacted with; hidden-tab time is excluded.</small>`;
}
function enhanceRevisionDetails(){
 if(typeof activeExam==='undefined'||!activeExam?.questions)return;
 const rows=[...document.querySelectorAll('#answerReview .answer-row')];
 rows.forEach((row,i)=>{
  const q=activeExam.questions[i],panel=row.querySelector('.mm-evidence');if(!q||!panel||panel.querySelector('.mm-revision-detail'))return;
  const id=q.stableId||q.mmId||'',r=revisionFor(id),research=String(q.sourceUrl||'').startsWith('https://doi.org/');
  panel.insertAdjacentHTML('beforeend',`<div class="mm-revision-detail"><b>Question revision ${r.revision}</b> · ${esc(r.date)}<br>${esc(r.change)}</div>`);
  const small=panel.querySelector('small');if(small&&research)small.textContent=`Research DOI resolver set reviewed ${SOURCE_REVIEWED}; scheduled DOI recheck by ${SOURCE_REVIEW_BY}. · Question revision ${r.revision}`;
 });
}
function addStyles(){if(document.getElementById('mm-final-assessment-style'))return;const s=document.createElement('style');s.id='mm-final-assessment-style';s.textContent='.mm-revision-detail{margin-top:8px;padding:8px 10px;border-left:3px solid #55d6be;background:#0b192a;border-radius:6px;font-size:11.5px;line-height:1.45}.mm-revision-detail b{color:#72e6cd}';document.head.appendChild(s)}

installAnalyticsExportPatch();addStyles();
const baseStart=window.startExam;window.startExam=function(){const r=baseStart.apply(this,arguments);setTimeout(initExposureTiming,0);return r};
const baseGrade=window.gradeExam;window.gradeExam=function(){persistExposureTiming();const r=baseGrade.apply(this,arguments);setTimeout(()=>{enhanceRevisionDetails();rewriteTimingPanel()},20);return r};
const baseRender=typeof window.renderExams==='function'?window.renderExams:null;if(baseRender)window.renderExams=function(){const r=baseRender.apply(this,arguments);setTimeout(rewriteTimingPanel,20);return r};

D.assessmentQA=D.assessmentQA||{};D.assessmentQA.finalHardening={version:VERSION,bankVersion:BANK_VERSION,stableIds:allStableIds().length,revision2Items:Object.keys(REVISION2).length,revision3Items:Object.keys(REVISION3).length,responseTiming:'first meaningful question exposure; hidden-tab time excluded',researchFreshness:'separate DOI resolver QA'};
window.MM_QUESTION_REVISIONS={version:VERSION,bankVersion:BANK_VERSION,stableIds:allStableIds(),baseline:{...BASELINE},revision2:{...REVISION2},revision3:{...REVISION3},forId:revisionFor};
window.MM_ASSESSMENT_FINAL_HARDENING={version:VERSION,responseTimingKey:TIMING_KEY,rewriteTimingPanel,enhanceRevisionDetails};
})();
/* <<< assessment-final-hardening.js */
