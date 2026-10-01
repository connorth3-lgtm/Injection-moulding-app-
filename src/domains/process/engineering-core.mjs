// MouldMaster pure injection-moulding engineering primitives.
// This module has no DOM, browser storage, network, release-plumbing or machine-control dependencies.

const AREA_TO_M2 = Object.freeze({ m2: 1, cm2: 1e-4, mm2: 1e-6 });
const PRESSURE_TO_PA = Object.freeze({ pa: 1, kpa: 1e3, mpa: 1e6, bar: 1e5 });
const MASS_TO_G = Object.freeze({ g: 1, kg: 1000, mg: 0.001 });
const FORCE_TO_N = Object.freeze({ n: 1, kn: 1000, mn: 1e6 });
const VOLUME_RATE_TO_CM3_S = Object.freeze({
  'cm3/s': 1,
  'ml/s': 1,
  'cm3/min': 1 / 60,
  'l/min': 1000 / 60,
});
const VOLUME_TO_CM3 = Object.freeze({ cm3: 1, ml: 1, l: 1000, m3: 1e6, mm3: 0.001 });
const LENGTH_TO_MM = Object.freeze({ mm: 1, cm: 10, m: 1000 });
const TIME_TO_S = Object.freeze({ s: 1, sec: 1, min: 60, h: 3600 });
const MASS_RATE_TO_G_S = Object.freeze({
  'g/s': 1,
  'kg/s': 1000,
  'g/min': 1 / 60,
  'kg/min': 1000 / 60,
  'g/h': 1 / 3600,
  'kg/h': 1000 / 3600,
});
const DIFFUSIVITY_TO_MM2_S = Object.freeze({ 'mm2/s': 1, 'cm2/s': 100, 'm2/s': 1e6 });
const PRESSURE_KINDS = Object.freeze([
  'hydraulic',
  'specific-plastic',
  'nozzle',
  'runner',
  'cavity',
  'pack-command',
]);

export const ENGINEERING_EQUATION_IDS = Object.freeze({
  pressureConversion: 'EQ-PRESS-001',
  clampSeparatingForce: 'EQ-CF-001',
  clampSeparatingForceRange: 'EQ-CF-002',
  aggregateShotMass: 'EQ-SHOT-001',
  shotCapacityAssessment: 'EQ-SHOT-002',
  clampCapacityAssessment: 'EQ-CAP-001',
  specificPlasticPressureCapacityAssessment: 'EQ-CAP-002',
  volumetricFlowCapacityAssessment: 'EQ-CAP-003',
  plasticisingThroughputAssessment: 'EQ-CAP-004',
  fillStageRates: 'EQ-FLOW-001',
  averageResidenceTime: 'EQ-RES-001',
  averageResidenceFromShotCycle: 'EQ-RES-002',
  relativeCoolingTimeScale: 'EQ-THERM-001',
  gateSealPlateau: 'PROC-GATE-001',
});

function cleanUnit(unit) {
  return String(unit ?? '').trim().toLowerCase().replaceAll('²', '2').replaceAll('³', '3').replace(/\s+/g, '');
}

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function unsupported(reason, details = {}) {
  return Object.freeze({ ok: false, reason, ...details });
}

function supported(value, metadata = {}) {
  return Object.freeze({ ok: true, value: Object.freeze(value), ...metadata });
}

function convertPositive(quantity, table, field) {
  if (!quantity || typeof quantity !== 'object') return unsupported(`missing-${field}`, { field });
  const value = finitePositive(quantity.value);
  if (value === null) return unsupported(`invalid-${field}-value`, { field });
  const unit = cleanUnit(quantity.unit);
  const factor = table[unit];
  if (!factor) return unsupported(`unsupported-${field}-unit`, { field, unit: String(quantity.unit ?? '') });
  return supported({ si: value * factor, inputValue: value, inputUnit: unit });
}

export function clampSeparatingForce({ projectedArea, representativePressure, provenance = null } = {}) {
  const area = convertPositive(projectedArea, AREA_TO_M2, 'projected-area');
  if (!area.ok) return area;
  const pressure = convertPositive(representativePressure, PRESSURE_TO_PA, 'representative-pressure');
  if (!pressure.ok) return pressure;
  const newtons = area.value.si * pressure.value.si;
  return supported(
    { newtons, kilonewtons: newtons / 1000 },
    {
      equationId: ENGINEERING_EQUATION_IDS.clampSeparatingForce,
      units: Object.freeze({ force: 'kN', areaSI: 'm²', pressureSI: 'Pa' }),
      assumptions: Object.freeze([
        'The supplied projected area represents the area relevant to the stated engineering estimate.',
        'The supplied pressure is an explicitly stated representative pressure assumption; it is not inferred cavity pressure.',
        'This arithmetic separating-force estimate is not automatically the required machine clamp rating.',
      ]),
      provenance,
      authority: 'engineering-estimate-only',
    },
  );
}

export function aggregateShotMass({ cavityCount, partMass, runnerMass = { value: 0, unit: 'g' }, provenance = null } = {}) {
  if (!Number.isInteger(cavityCount) || cavityCount < 1) return unsupported('invalid-cavity-count', { field: 'cavityCount' });
  const part = convertPositive(partMass, MASS_TO_G, 'part-mass');
  if (!part.ok) return part;

  let runnerG = 0;
  if (runnerMass != null) {
    const raw = Number(runnerMass?.value);
    if (!Number.isFinite(raw) || raw < 0) return unsupported('invalid-runner-mass-value', { field: 'runner-mass' });
    const unit = cleanUnit(runnerMass?.unit);
    const factor = MASS_TO_G[unit];
    if (!factor) return unsupported('unsupported-runner-mass-unit', { field: 'runner-mass', unit: String(runnerMass?.unit ?? '') });
    runnerG = raw * factor;
  }

  const partsG = cavityCount * part.value.si;
  const totalG = partsG + runnerG;
  return supported(
    { partContributionG: partsG, runnerContributionG: runnerG, totalG, totalKg: totalG / 1000 },
    {
      equationId: ENGINEERING_EQUATION_IDS.aggregateShotMass,
      units: Object.freeze({ mass: 'g' }),
      assumptions: Object.freeze([
        'Every counted cavity is assumed to produce one part of the supplied part mass for this arithmetic estimate.',
        'Runner mass is included only when explicitly supplied; hot-runner or runnerless systems may legitimately use zero.',
        'This mass total does not establish machine shot-capacity suitability without machine/screw-specific usable-capacity evidence.',
      ]),
      provenance,
      authority: 'mass-accounting-only',
    },
  );
}

export function channelSemanticReadiness({ role = 'unresolved', meaning = '', unit = '', samplingBasis = 'unknown', dynamicUnitColumn = null } = {}) {
  const blockers = [];
  const cleanRole = String(role || 'unresolved');
  const cleanMeaning = String(meaning || '').trim();
  const cleanUnitValue = String(unit || '').trim();
  const cleanSampling = String(samplingBasis || 'unknown');
  if (cleanRole === 'unresolved') blockers.push('role');
  if (!cleanMeaning && cleanRole !== 'structural') blockers.push('meaning');
  if (cleanRole !== 'structural' && cleanRole !== 'state' && !cleanUnitValue && !dynamicUnitColumn) blockers.push('unit');
  if (['actual', 'derived', 'quality'].includes(cleanRole) && cleanSampling === 'unknown') blockers.push('sampling_basis');
  return Object.freeze({
    ready: blockers.length === 0,
    blockers: Object.freeze([...new Set(blockers)]),
    inputs: Object.freeze({ role: cleanRole, meaning: cleanMeaning, unit: cleanUnitValue || null, samplingBasis: cleanSampling, dynamicUnitColumn: dynamicUnitColumn || null }),
    authority: 'semantic-readiness-only',
  });
}

export function gradeSpecificProcessingBoundary({ exactGrade, currentSupplierDocument, requestedSetting } = {}) {
  if (!String(exactGrade || '').trim()) return unsupported('exact-grade-required', { field: 'exactGrade' });
  if (!String(currentSupplierDocument || '').trim()) return unsupported('current-grade-document-required', { field: 'currentSupplierDocument' });
  if (!String(requestedSetting || '').trim()) return unsupported('requested-setting-required', { field: 'requestedSetting' });
  return supported(
    { disposition: 'consult-controlling-grade-document', setting: String(requestedSetting).trim() },
    {
      assumptions: Object.freeze(['Processing settings and limits are grade-specific unless an authoritative source explicitly establishes otherwise.']),
      provenance: String(currentSupplierDocument).trim(),
      authority: 'source-first-boundary-only',
    },
  );
}


function convertPositiveBase(quantity, table, field, baseUnit) {
  if (!quantity || typeof quantity !== 'object') return unsupported(`missing-${field}`, { field });
  const value = finitePositive(quantity.value);
  if (value === null) return unsupported(`invalid-${field}-value`, { field });
  const unit = cleanUnit(quantity.unit);
  const factor = table[unit];
  if (!factor) return unsupported(`unsupported-${field}-unit`, { field, unit: String(quantity.unit ?? '') });
  return supported({ base: value * factor, baseUnit, inputValue: value, inputUnit: unit });
}

function optionalPositiveBase(quantity, table, field, baseUnit) {
  if (quantity == null) return supported({ base: null, baseUnit, inputValue: null, inputUnit: null });
  return convertPositiveBase(quantity, table, field, baseUnit);
}

export function pressureValue({ pressure, kind, provenance = null } = {}) {
  const converted = convertPositive(pressure, PRESSURE_TO_PA, 'pressure');
  if (!converted.ok) return converted;
  const pressureKind = String(kind || '').trim().toLowerCase().replaceAll('_', '-');
  if (!PRESSURE_KINDS.includes(pressureKind)) {
    return unsupported('pressure-kind-required', {
      field: 'kind',
      allowedKinds: PRESSURE_KINDS,
    });
  }
  const pascals = converted.value.si;
  return supported(
    {
      pascals,
      kilopascals: pascals / 1e3,
      megapascals: pascals / 1e6,
      bar: pascals / 1e5,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.pressureConversion,
      pressureKind,
      provenance,
      assumptions: Object.freeze([
        'This function converts units only. It does not convert one pressure location or machine pressure type into another.',
        'Hydraulic, specific-plastic, nozzle, runner, cavity and pack-command pressures remain semantically distinct.',
      ]),
      authority: 'unit-conversion-only',
    },
  );
}

export function clampSeparatingForceRange({ projectedArea, lowerRepresentativePressure, upperRepresentativePressure, provenance = null } = {}) {
  const area = convertPositive(projectedArea, AREA_TO_M2, 'projected-area');
  if (!area.ok) return area;
  const low = convertPositive(lowerRepresentativePressure, PRESSURE_TO_PA, 'lower-representative-pressure');
  if (!low.ok) return low;
  const high = convertPositive(upperRepresentativePressure, PRESSURE_TO_PA, 'upper-representative-pressure');
  if (!high.ok) return high;
  if (low.value.si > high.value.si) {
    return unsupported('pressure-range-reversed', { field: 'representative-pressure-range' });
  }
  const lowerNewtons = area.value.si * low.value.si;
  const upperNewtons = area.value.si * high.value.si;
  return supported(
    {
      lowerNewtons,
      upperNewtons,
      lowerKilonewtons: lowerNewtons / 1000,
      upperKilonewtons: upperNewtons / 1000,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.clampSeparatingForceRange,
      units: Object.freeze({ force: 'kN', areaSI: 'm²', pressureSI: 'Pa' }),
      assumptions: Object.freeze([
        'The pressure range is supplied explicitly and represents an engineering range for pressure acting over the stated projected area.',
        'The result is a separating-force range, not a prescribed machine clamp setting or safety factor.',
        'Spatial pressure gradients, mould/platen deflection, tie-bar load distribution and dynamic effects are not resolved by this screening calculation.',
      ]),
      provenance,
      authority: 'engineering-range-estimate-only',
    },
  );
}

export function shotCapacityAssessment({ requiredShotMass, usableMachineShotMass, capacityBasisVerified = false, provenance = null } = {}) {
  const required = convertPositive(requiredShotMass, MASS_TO_G, 'required-shot-mass');
  if (!required.ok) return required;
  const usable = convertPositive(usableMachineShotMass, MASS_TO_G, 'usable-machine-shot-mass');
  if (!usable.ok) return usable;
  if (capacityBasisVerified !== true) {
    return unsupported('capacity-basis-unverified', {
      field: 'capacityBasisVerified',
      detail: 'Mass-based machine shot capacity must be verified as applicable to the actual material/equivalent basis before comparison.',
    });
  }
  const utilisationPct = 100 * required.value.si / usable.value.si;
  return supported(
    {
      requiredShotG: required.value.si,
      usableMachineShotG: usable.value.si,
      utilisationPct,
      capacityMarginG: usable.value.si - required.value.si,
      exceedsUsableCapacity: required.value.si > usable.value.si,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.shotCapacityAssessment,
      units: Object.freeze({ mass: 'g', utilisation: '%' }),
      assumptions: Object.freeze([
        'Required and usable machine shot masses are on a verified comparable material/equivalent basis.',
        'No universal preferred barrel-utilisation percentage is inferred by this function.',
        'Machine suitability also depends on pressure, flow, plasticising, residence, mould fit and other machine/tool requirements.',
      ]),
      provenance,
      authority: 'capacity-screen-only',
    },
  );
}


function capacityComparison(requiredBase, availableBase) {
  const utilisationPct = 100 * requiredBase / availableBase;
  return {
    utilisationPct,
    capacityMargin: availableBase - requiredBase,
    exceedsAvailableCapacity: requiredBase > availableBase,
  };
}

export function clampCapacityAssessment({ requiredClampForce, availableClampForce, provenance = null } = {}) {
  const required = convertPositiveBase(requiredClampForce, FORCE_TO_N, 'required-clamp-force', 'N');
  if (!required.ok) return required;
  const available = convertPositiveBase(availableClampForce, FORCE_TO_N, 'available-clamp-force', 'N');
  if (!available.ok) return available;
  const comparison = capacityComparison(required.value.base, available.value.base);
  return supported(
    {
      requiredKilonewtons: required.value.base / 1000,
      availableKilonewtons: available.value.base / 1000,
      utilisationPct: comparison.utilisationPct,
      capacityMarginKilonewtons: comparison.capacityMargin / 1000,
      exceedsAvailableCapacity: comparison.exceedsAvailableCapacity,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.clampCapacityAssessment,
      units: Object.freeze({ force: 'kN', utilisation: '%' }),
      assumptions: Object.freeze([
        'The required force supplied to this function is already the applicable engineering clamp requirement for the stated case.',
        'The available force is the verified usable clamp capacity of the exact machine/configuration.',
        'This function compares capacity only; it does not determine an appropriate operating clamp setpoint or invent a preferred utilisation margin.',
      ]),
      provenance,
      authority: 'capacity-screen-only',
    },
  );
}

export function specificPlasticPressureCapacityAssessment({ requiredPressure, availableMachinePressure, provenance = null } = {}) {
  const required = pressureValue({ pressure: requiredPressure, kind: 'specific-plastic', provenance });
  if (!required.ok) return required;
  const available = pressureValue({ pressure: availableMachinePressure, kind: 'specific-plastic', provenance });
  if (!available.ok) return available;
  const comparison = capacityComparison(required.value.pascals, available.value.pascals);
  return supported(
    {
      requiredMegapascals: required.value.megapascals,
      availableMegapascals: available.value.megapascals,
      utilisationPct: comparison.utilisationPct,
      capacityMarginMegapascals: comparison.capacityMargin / 1e6,
      exceedsAvailableCapacity: comparison.exceedsAvailableCapacity,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.specificPlasticPressureCapacityAssessment,
      units: Object.freeze({ pressure: 'MPa', utilisation: '%' }),
      assumptions: Object.freeze([
        'Both values are verified on the same specific-plastic/injection-pressure basis; hydraulic pressure must not be substituted without a verified machine conversion basis.',
        'The required pressure is established independently from appropriate process/mould evidence; this function does not predict cavity or flow-path pressure demand.',
        'No preferred pressure-utilisation percentage is inferred.',
      ]),
      provenance,
      authority: 'capacity-screen-only',
    },
  );
}

export function volumetricFlowCapacityAssessment({ requiredFlow, availableMachineFlow, provenance = null } = {}) {
  const required = convertPositiveBase(requiredFlow, VOLUME_RATE_TO_CM3_S, 'required-volumetric-flow', 'cm3/s');
  if (!required.ok) return required;
  const available = convertPositiveBase(availableMachineFlow, VOLUME_RATE_TO_CM3_S, 'available-machine-flow', 'cm3/s');
  if (!available.ok) return available;
  const comparison = capacityComparison(required.value.base, available.value.base);
  return supported(
    {
      requiredCm3S: required.value.base,
      availableCm3S: available.value.base,
      utilisationPct: comparison.utilisationPct,
      capacityMarginCm3S: comparison.capacityMargin,
      exceedsAvailableCapacity: comparison.exceedsAvailableCapacity,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.volumetricFlowCapacityAssessment,
      units: Object.freeze({ flow: 'cm³/s', utilisation: '%' }),
      assumptions: Object.freeze([
        'Required and available flow values use a verified comparable volumetric basis.',
        'This is a machine-capacity comparison, not a melt-front velocity, gate shear-rate or cavity-fill prediction.',
        'No preferred flow-utilisation percentage is inferred.',
      ]),
      provenance,
      authority: 'capacity-screen-only',
    },
  );
}

export function plasticisingThroughputAssessment({ requiredMassRate, availablePlasticisingRate, provenance = null } = {}) {
  const required = convertPositiveBase(requiredMassRate, MASS_RATE_TO_G_S, 'required-mass-rate', 'g/s');
  if (!required.ok) return required;
  const available = convertPositiveBase(availablePlasticisingRate, MASS_RATE_TO_G_S, 'available-plasticising-rate', 'g/s');
  if (!available.ok) return available;
  const comparison = capacityComparison(required.value.base, available.value.base);
  return supported(
    {
      requiredGS: required.value.base,
      availableGS: available.value.base,
      utilisationPct: comparison.utilisationPct,
      capacityMarginGS: comparison.capacityMargin,
      exceedsAvailableCapacity: comparison.exceedsAvailableCapacity,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.plasticisingThroughputAssessment,
      units: Object.freeze({ massRate: 'g/s', utilisation: '%' }),
      assumptions: Object.freeze([
        'Required and available plasticising rates are verified as comparable for the actual material, screw/configuration and stated conditions.',
        'Nominal catalogue plasticising rate is not assumed to equal usable grade-specific recovery capability unless that basis is verified.',
        'No preferred throughput-utilisation percentage is inferred.',
      ]),
      provenance,
      authority: 'capacity-screen-only',
    },
  );
}

export function fillStageRates({ fillTime, fillVolume = null, fillMass = null, injectionStroke = null, provenance = null } = {}) {
  const time = convertPositiveBase(fillTime, TIME_TO_S, 'fill-time', 's');
  if (!time.ok) return time;
  const volume = optionalPositiveBase(fillVolume, VOLUME_TO_CM3, 'fill-volume', 'cm3');
  if (!volume.ok) return volume;
  const mass = optionalPositiveBase(fillMass, MASS_TO_G, 'fill-mass', 'g');
  if (!mass.ok) return mass;
  const stroke = optionalPositiveBase(injectionStroke, LENGTH_TO_MM, 'injection-stroke', 'mm');
  if (!stroke.ok) return stroke;
  if (volume.value.base === null && mass.value.base === null && stroke.value.base === null) {
    return unsupported('fill-rate-numerator-required', { field: 'fillVolume|fillMass|injectionStroke' });
  }
  const seconds = time.value.base;
  return supported(
    {
      fillTimeS: seconds,
      volumetricFlowCm3S: volume.value.base === null ? null : volume.value.base / seconds,
      massFlowGS: mass.value.base === null ? null : mass.value.base / seconds,
      averageScrewRamSpeedMmS: stroke.value.base === null ? null : stroke.value.base / seconds,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.fillStageRates,
      units: Object.freeze({ time: 's', volumetricFlow: 'cm³/s', massFlow: 'g/s', screwRamSpeed: 'mm/s' }),
      assumptions: Object.freeze([
        'Each numerator covers the same fill-stage interval as the supplied fill time.',
        'Average screw/ram forward speed is not melt-front velocity.',
        'No shear rate, apparent viscosity or pressure loss is inferred without flow-path geometry and appropriate rheology.',
      ]),
      provenance,
      authority: 'measured-rate-arithmetic-only',
    },
  );
}

export function averageResidenceTimeEstimate({ meltInventoryMass, massThroughputRate, provenance = null } = {}) {
  const inventory = convertPositiveBase(meltInventoryMass, MASS_TO_G, 'melt-inventory-mass', 'g');
  if (!inventory.ok) return inventory;
  const throughput = convertPositiveBase(massThroughputRate, MASS_RATE_TO_G_S, 'mass-throughput-rate', 'g/s');
  if (!throughput.ok) return throughput;
  const seconds = inventory.value.base / throughput.value.base;
  return supported(
    { seconds, minutes: seconds / 60, hours: seconds / 3600, throughputGS: throughput.value.base },
    {
      equationId: ENGINEERING_EQUATION_IDS.averageResidenceTime,
      units: Object.freeze({ time: 's', throughput: 'g/s' }),
      assumptions: Object.freeze([
        'This is a steady-throughput average inventory/throughput estimate, not a residence-time distribution.',
        'Stagnant regions, screw-channel distribution, hot-runner inventory, interruptions, purging and material recirculation are not represented unless included in the supplied inventory/throughput basis.',
        'Material degradation limits remain grade- and condition-specific and require current supplier evidence.',
      ]),
      provenance,
      authority: 'average-residence-estimate-only',
    },
  );
}

export function averageResidenceTimeFromShotCycle({ meltInventoryMass, shotMass, cycleTime, provenance = null } = {}) {
  const shot = convertPositiveBase(shotMass, MASS_TO_G, 'shot-mass', 'g');
  if (!shot.ok) return shot;
  const cycle = convertPositiveBase(cycleTime, TIME_TO_S, 'cycle-time', 's');
  if (!cycle.ok) return cycle;
  const throughputGS = shot.value.base / cycle.value.base;
  const result = averageResidenceTimeEstimate({
    meltInventoryMass,
    massThroughputRate: { value: throughputGS, unit: 'g/s' },
    provenance,
  });
  if (!result.ok) return result;
  return supported(
    {
      ...result.value,
      shotMassG: shot.value.base,
      cycleTimeS: cycle.value.base,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.averageResidenceFromShotCycle,
      units: result.units,
      assumptions: Object.freeze([
        ...result.assumptions,
        'The derived throughput assumes the stated shot mass leaves the plasticising system once per stated cycle; purge, reject and interruption flows are excluded unless represented separately.',
      ]),
      provenance,
      authority: 'average-residence-estimate-only',
    },
  );
}

export function relativeCoolingTimeScale({
  referenceCoolingTime,
  referenceThickness,
  targetThickness,
  referenceThermalDiffusivity = null,
  targetThermalDiffusivity = null,
  provenance = null,
} = {}) {
  const time = convertPositiveBase(referenceCoolingTime, TIME_TO_S, 'reference-cooling-time', 's');
  if (!time.ok) return time;
  const refThickness = convertPositiveBase(referenceThickness, LENGTH_TO_MM, 'reference-thickness', 'mm');
  if (!refThickness.ok) return refThickness;
  const targetThicknessValue = convertPositiveBase(targetThickness, LENGTH_TO_MM, 'target-thickness', 'mm');
  if (!targetThicknessValue.ok) return targetThicknessValue;

  let diffusivityRatio = 1;
  let referenceAlpha = null;
  let targetAlpha = null;
  if (referenceThermalDiffusivity != null || targetThermalDiffusivity != null) {
    if (referenceThermalDiffusivity == null || targetThermalDiffusivity == null) {
      return unsupported('both-diffusivities-required', { field: 'referenceThermalDiffusivity|targetThermalDiffusivity' });
    }
    const refAlpha = convertPositiveBase(referenceThermalDiffusivity, DIFFUSIVITY_TO_MM2_S, 'reference-thermal-diffusivity', 'mm2/s');
    if (!refAlpha.ok) return refAlpha;
    const targetAlphaResult = convertPositiveBase(targetThermalDiffusivity, DIFFUSIVITY_TO_MM2_S, 'target-thermal-diffusivity', 'mm2/s');
    if (!targetAlphaResult.ok) return targetAlphaResult;
    referenceAlpha = refAlpha.value.base;
    targetAlpha = targetAlphaResult.value.base;
    diffusivityRatio = referenceAlpha / targetAlpha;
  }

  const thicknessRatio = targetThicknessValue.value.base / refThickness.value.base;
  const scalingFactor = thicknessRatio ** 2 * diffusivityRatio;
  return supported(
    {
      referenceCoolingTimeS: time.value.base,
      estimatedTargetCoolingTimeS: time.value.base * scalingFactor,
      scalingFactor,
      thicknessRatio,
      referenceThermalDiffusivityMm2S: referenceAlpha,
      targetThermalDiffusivityMm2S: targetAlpha,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.relativeCoolingTimeScale,
      units: Object.freeze({ time: 's', thickness: 'mm', thermalDiffusivity: 'mm²/s' }),
      assumptions: Object.freeze([
        'This is a first-order diffusion scaling comparison, not an absolute cooling-time prediction.',
        'The reference and target are assumed to have comparable thermal boundary conditions, ejection criterion and one-dimensional characteristic thickness behaviour.',
        'Crystallisation/latent heat, thermal contact resistance, local geometry, coolant circuit resistance, mould material and transient cycle-to-cycle thermal state can invalidate simple thickness-squared scaling.',
      ]),
      provenance,
      authority: 'relative-thermal-screen-only',
    },
  );
}

function sampleMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values, mean = sampleMean(values)) {
  if (values.length < 2) return null;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function gateSealPlateauAssessment({ points, plateauToleranceMass, provenance = null } = {}) {
  if (!Array.isArray(points) || points.length < 3) {
    return unsupported('at-least-three-hold-time-points-required', { field: 'points' });
  }
  const tolerance = convertPositiveBase(plateauToleranceMass, MASS_TO_G, 'plateau-tolerance-mass', 'g');
  if (!tolerance.ok) return tolerance;

  const rows = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index] || {};
    const hold = convertPositiveBase(point.holdTime, TIME_TO_S, `points[${index}].hold-time`, 's');
    if (!hold.ok) return hold;
    if (!Array.isArray(point.partMasses) || point.partMasses.length < 2) {
      return unsupported('insufficient-replicates', { field: `points[${index}].partMasses`, minimum: 2 });
    }
    const masses = [];
    for (let massIndex = 0; massIndex < point.partMasses.length; massIndex += 1) {
      const converted = convertPositiveBase(point.partMasses[massIndex], MASS_TO_G, `points[${index}].partMasses[${massIndex}]`, 'g');
      if (!converted.ok) return converted;
      masses.push(converted.value.base);
    }
    const meanG = sampleMean(masses);
    rows.push({
      holdTimeS: hold.value.base,
      replicateCount: masses.length,
      meanMassG: meanG,
      sampleStandardDeviationG: sampleStandardDeviation(masses, meanG),
      minimumMassG: Math.min(...masses),
      maximumMassG: Math.max(...masses),
    });
  }

  rows.sort((a, b) => a.holdTimeS - b.holdTimeS);
  for (let index = 1; index < rows.length; index += 1) {
    if (Math.abs(rows[index].holdTimeS - rows[index - 1].holdTimeS) < 1e-12) {
      return unsupported('duplicate-hold-time', { field: 'points', holdTimeS: rows[index].holdTimeS });
    }
  }

  const adjacentMeanChangesG = rows.slice(1).map((row, index) => ({
    fromHoldTimeS: rows[index].holdTimeS,
    toHoldTimeS: row.holdTimeS,
    changeG: row.meanMassG - rows[index].meanMassG,
    absoluteChangeG: Math.abs(row.meanMassG - rows[index].meanMassG),
  }));

  let candidateIndex = null;
  for (let index = 0; index <= rows.length - 3; index += 1) {
    const remainingChanges = adjacentMeanChangesG.slice(index);
    if (remainingChanges.length >= 2 && remainingChanges.every(change => change.absoluteChangeG <= tolerance.value.base)) {
      candidateIndex = index;
      break;
    }
  }

  const plateau = candidateIndex === null
    ? null
    : {
        earliestConsistentHoldTimeS: rows[candidateIndex].holdTimeS,
        consecutivePointCount: rows.length - candidateIndex,
        maximumAdjacentMeanChangeG: Math.max(...adjacentMeanChangesG.slice(candidateIndex).map(change => change.absoluteChangeG)),
      };

  return supported(
    {
      conclusion: plateau ? 'plateau-consistent-with-entered-tolerance' : 'no-plateau-within-entered-range',
      plateauToleranceG: tolerance.value.base,
      plateau,
      points: rows,
      adjacentMeanChangesG,
    },
    {
      equationId: ENGINEERING_EQUATION_IDS.gateSealPlateau,
      units: Object.freeze({ time: 's', mass: 'g' }),
      assumptions: Object.freeze([
        'The tolerance is supplied by the user from an appropriate measurement/process decision basis; the function does not invent a universal plateau threshold.',
        'At least two repeated mass observations are required at every hold time and at least three hold-time levels are required.',
        'A mass plateau is evidence consistent with diminishing additional material transfer for this material, gate, mould and thermal state; it is not universal proof of an exact physical gate-freeze instant.',
        'Relevant dimensional, cavity-pressure or quality evidence may still be needed before declaring additional hold time ineffective.',
      ]),
      provenance,
      authority: 'controlled-study-analysis-only',
    },
  );
}

export const ENGINEERING_DOMAIN_BOUNDARY = Object.freeze({
  dependenciesAllowed: Object.freeze(['plain JavaScript data']),
  dependenciesForbidden: Object.freeze(['DOM', 'IndexedDB', 'localStorage', 'network', 'release plumbing', 'machine control']),
  productionAuthority: 'none',
  universalSetpoints: false,
  rule: 'Unsupported or ambiguous inputs return explicit reasons. Results carry units, assumptions/provenance where applicable, and never authorize production or machine-control changes.',
});
