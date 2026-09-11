
/* ===== content_patch.js ===== */
/* Fine-tooth-comb content improvements. Assessment banks are not changed here. */
(function(){
  const D=window.MM_DATA;
  const coursePractice={
    "Foundations": t=>`Observe or review a real moulding cycle with an authorised operator. For “${t}”, identify the relevant cycle phase or process signal, write down one measured actual you would use, and explain what would make that evidence trustworthy.`,
    "Machine & Controls": t=>`Using the machine manual, approved training machine, or a labelled diagram, locate the feature related to “${t}”. Record its purpose, one measured actual or status signal, and one limitation that would matter when transferring a process between machines.`,
    "Materials": t=>`Choose one resin you actually use or a supplier datasheet example. For “${t}”, identify the material-specific guidance you would verify, the evidence you would record, and one consequence of operating outside the validated material condition.`,
    "Mould Design": t=>`Trace “${t}” on a mould drawing, flow sketch, cooling diagram or approved training tool. Identify how it could influence filling, pressure, cooling, venting, ejection or dimensional behaviour, then state what evidence would confirm the effect.`,
    "Process Setup": t=>`Take a known-good setup sheet or training example. For “${t}”, separate the machine command from the process actual, identify the acceptance check, and write the smallest controlled change you would use if the actual moved outside the known-good range.`,
    "Defect Troubleshooting": t=>`For “${t}”, define the symptom precisely, rank at least three plausible mechanisms using Material–Machine–Mould–Method–Measurement, then choose one safe evidence-gathering check that would discriminate between the leading causes.`,
    "Scientific Moulding": t=>`Design a paper study for “${t}”: define the question, controlled variables, deliberate change, measured response and stop/acceptance criteria. Do not choose production settings from this exercise; the aim is to learn experimental structure.`,
    "Capability & Validation": t=>`For “${t}”, list the data prerequisites that must be true before drawing a conclusion: process stability, measurement adequacy, sampling, specification/acceptance criteria and any validation/change-control requirements.`,
    "DOE & Statistics": t=>`Turn “${t}” into a small experimental plan. Define factors, levels, response(s), nuisance variables, randomisation/blocking needs and the confirmation step you would require before changing a production standard.`,
    "Automation & Sensors": t=>`Map the sequence or signal related to “${t}” in an approved cell diagram. Identify what the signal proves, what it does not prove, and which safeguarding/authorised-access assumptions must remain true during operation and maintenance.`,
    "Advanced Tooling & Simulation": t=>`For “${t}”, write one prediction from a simulation or engineering model and one real-world measurement or moulding study you would use to challenge that prediction. Treat simulation as evidence to verify, not as a production instruction.`,
    "Expert Process Engineering": t=>`For “${t}”, build a one-page evidence plan: define the business/quality problem, known-good baseline, critical process outputs, possible interactions, safety/validation constraints, decision rule and how the learning will be standardised for other shifts or machines.`
  };
  const evidenceByCourse={
    "Foundations":"Cycle phase, setpoint vs actual, repeatability over several cycles, part observation.",
    "Machine & Controls":"Machine manual definition, set vs actual, alarm/status history, capability/limit information.",
    "Materials":"Supplier/validated material requirement, lot/handling history, drying or conditioning evidence where applicable.",
    "Mould Design":"Drawing/tool condition, short-shot or pressure evidence, temperature/flow observations, cavity-to-cavity comparison where relevant.",
    "Process Setup":"Known-good baseline, fill time, transfer, peak pressure, cushion, recovery, thermal condition and critical part response as applicable.",
    "Defect Troubleshooting":"Exact defect location/time, known-good comparison, material/machine/mould/method/measurement evidence.",
    "Scientific Moulding":"Controlled inputs, measured actuals, repeat runs, clear response definition and study assumptions.",
    "Capability & Validation":"Stable process evidence, measurement-system evidence, sampling plan, specifications and change-control context.",
    "DOE & Statistics":"Run order, factor settings, response data, nuisance-variable record, model diagnostics and confirmation runs.",
    "Automation & Sensors":"Sequence state, sensor location/function, interlock/safeguard status, trace data and maintenance/access condition.",
    "Advanced Tooling & Simulation":"Model assumptions, mesh/material/model inputs where relevant, physical measurements and correlation error.",
    "Expert Process Engineering":"Cross-functional evidence, economic impact, process actuals, maintenance/tooling condition, risk and verification plan."
  };
  const trapByCourse={
    "Foundations":"Treating a saved recipe value as proof that the material experienced the same process.",
    "Machine & Controls":"Assuming the same controller number means the same physical process on another machine.",
    "Materials":"Using a generic temperature or drying rule instead of current resin-specific/validated guidance.",
    "Mould Design":"Trying to process around a tooling restriction without first proving the physical mechanism.",
    "Process Setup":"Changing several variables together and losing cause-and-effect.",
    "Defect Troubleshooting":"Adjusting the setting most associated with the defect name before defining the actual mechanism.",
    "Scientific Moulding":"Running a “study” while uncontrolled variables move enough to explain the response.",
    "Capability & Validation":"Quoting capability from unstable data or an inadequate measurement system.",
    "DOE & Statistics":"Treating statistical significance, a fitted model or an optimum as self-validating without engineering confirmation.",
    "Automation & Sensors":"Assuming a sensor, interlock or robot state proves more than that device actually measures or controls.",
    "Advanced Tooling & Simulation":"Treating a simulation image as truth without checking assumptions against physical evidence.",
    "Expert Process Engineering":"Optimising a local metric while shifting risk, cost or instability somewhere else in the system."
  };
  D.lessons.forEach(l=>{
    const maker=coursePractice[l.courseName];
    if(maker) l.exercise=maker(l.title);
    l.evidencePrompt=evidenceByCourse[l.courseName]||"Record the evidence that would support or reject the engineering conclusion.";
    l.commonTrap=trapByCourse[l.courseName]||"Do not substitute an assumption for measured evidence.";
  });
  if(D.standards?.common?.[0]){
    D.standards.common[0].scope += " ISO states that ISO 20430:2020 is not applicable to injection moulding machines manufactured before the date of its publication; older machines still require appropriate legal/risk-control assessment and applicable safeguards.";
  }
})();

