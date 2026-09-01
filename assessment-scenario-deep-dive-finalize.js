/* MouldMaster guided-scenario deep-dive finalizer — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
const EXPECTED=8;
const feedback=(options,correct,why)=>options.map((option,i)=>i===correct?`Correct. ${why}`:`Not the best answer. “${option}” does not fit the evidence in this case. ${why}`);
const PATCH={
 'Fill time drifts but recipe does not':['Over an hour, fill time slowly increases while saved recipe values remain unchanged and no alarm is active.',['Increase the injection-speed setpoint until the historical fill time returns','Compare fill-time/pressure actuals, material condition and thermal actuals with the known-good baseline','Increase hold pressure because the part may be under-packed','Treat the unchanged recipe as proof the machine is repeating and investigate inspection first'],1,'Setpoints do not prove the material or machine response stayed constant. Compare actual process and material/thermal evidence with the known-good state.'],
 'One cavity becomes light':['In an eight-cavity mould, one cavity gradually loses part mass while the other seven remain stable.',['Increase total shot size for all eight cavities','Inspect the affected branch/gate and compare cavity-specific filling/pressure or short-shot evidence before global changes','Increase hold time for every cavity','Treat the average eight-cavity part mass as the primary diagnostic because the machine feeds all cavities from one shot'],1,'A one-cavity change points first to a local flow-path, gate, vent or thermal condition. Preserve cavity identity before global changes.'],
 'Recovery time becomes erratic':['Screw recovery time becomes erratic and cushion variation appears at the same time, while cooling-water actuals remain stable.',['Check feed/material delivery, recovery actuals and shot-delivery consistency','Extend cooling time because the two variations appeared in the same cycle','Increase clamp force to stabilise screw recovery','Treat recovery variation as cosmetic if average part mass is still on target'],0,'Recovery and cushion changing together point toward feed, plasticising or shot-delivery behaviour and should be investigated before compensating elsewhere.'],
 'Dimension shifts after water-line work':['A critical dimension shifts immediately after mould-water hoses were disconnected and reconnected during maintenance.',['Change hold pressure until the dimension returns to nominal','Verify circuit routing, flow, inlet/outlet temperatures and mould thermal balance against the known-good state','Move V/P transfer because the part dimension changed after maintenance','Wait for a full production shift before checking the cooling circuit'],1,'The timing strongly implicates the system that was changed. Verify the cooling circuit and thermal state before creating a new packing process.'],
 'Part sticks after texture change':['Ejection force rises and local drag marks appear after a new surface texture is added to the mould.',['Review draft, texture direction/depth, local cooling, ejection loading and tooling condition','Increase packing pressure because a tighter part always ejects more consistently','Increase initial fill speed so the polymer copies the texture more aggressively','Attribute the problem to robot take-out timing without first checking release from the mould'],0,'Texture changes the mechanical release condition and can increase required draft/ejection load. Review tool geometry, local thermal state and ejection evidence before compensation.'],
 'Cpk drops after gauge change':['The moulding process appears stable by existing checks, but calculated Cpk drops immediately after a new measurement fixture is introduced.',['Change moulding settings until the new Cpk returns to the old value','Re-establish measurement-system adequacy and compare the new fixture with the previous method before interpreting process capability','Increase sample size but keep the new fixture unverified','Widen the specification because the process did not physically change'],1,'A measurement-system change can alter observed bias and variation. Capability should not be used to tune the process until the measurement system is shown to be adequate.'],
 'DOE result changes by run order':['In a DOE, one factor appears important, but all of its high settings were run late in the shift and all low settings early.',['Accept the effect because the high-level runs consistently produced the same direction of response','Treat time as a potential confounder and redesign or analyse the study with appropriate randomisation/blocking','Remove replication because the factor effect is already visually clear','Average the early and late responses without preserving run order'],1,'Factor level and time are aligned, so drift can be mistaken for a factor effect. The study must separate or account for that nuisance variable.'],
 'Pressure sensor disagrees with machine':['An in-cavity pressure trace changes near end of fill while the machine peak injection pressure remains nearly constant.',['Treat the stable machine peak as proof that the cavity pressure sensor is wrong','Recognise that the signals are measured at different locations and investigate the local cavity event plus sensor health','Treat machine peak pressure and local cavity pressure as interchangeable because both use pressure units','Ignore the cavity signal unless part mass has already moved out of specification'],1,'Machine and local cavity pressure are related but physically different measurements. A local change can occur without a comparable change in the machine peak, and sensor condition should also be verified.']
};
function apply(){
 if(window.MM_SCENARIO_DEEP_DIVE_FINALIZED?.version===VERSION)return;
 const D=window.MM_DATA;
 if(!D||!Array.isArray(D.scenarios))throw new Error('MouldMaster scenario data must load before guided-scenario finalization');
 const rows=D.scenarios;let applied=0,created=0;
 for(const [title,p] of Object.entries(PATCH)){
  const matches=rows.filter(s=>s?.title===title);
  if(matches.length>1)throw new Error(`Guided-scenario title is duplicated: ${title}`);
  let s=matches[0];
  if(!s){s={title};rows.push(s);created++}
  const [situation,choices,correct,why]=p;
  Object.assign(s,{situation,choices:choices.slice(),correct,why,feedback:feedback(choices,correct,why)});
  applied++;
 }
 if(applied!==EXPECTED)throw new Error(`Guided-scenario deep-dive finalization mismatch: ${applied}/${EXPECTED}`);
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.questionDeepDive={...(D.assessmentQA.questionDeepDive||{}),scenarioItemsRewritten:applied,scenarioItemsMaterialized:created,scenarioFinalizerVersion:VERSION};
 window.MM_SCENARIO_DEEP_DIVE_FINALIZED={version:VERSION,applied,created,scope:'Materializes any missing member of the eight reviewed guided scenarios, applies the reviewed deep-dive wording once, and completes before psychometric hardening. The later training-upgrade initializer detects the same titles and does not duplicate them.'};
}
apply();
})();
