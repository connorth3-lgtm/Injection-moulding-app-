import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  clampSeparatingForce,
  clampSeparatingForceRange,
  aggregateShotMass,
  pressureValue,
  measuredPressureDifference,
  shotCapacityAssessment,
  clampCapacityAssessment,
  specificPlasticPressureCapacityAssessment,
  volumetricFlowCapacityAssessment,
  plasticisingThroughputAssessment,
  mouldHeightFit,
  openingStrokeFit,
  daylightFit,
  tieBarClearanceFit,
  ejectorStrokeFit,
  machineSuitabilitySummary,
  hydraulicDiameter,
  uniformChannelVolume,
  circularChannelApparentWallShearRate,
  pressureLossModelReadiness,
  fillStageRates,
  screwSweptVolume,
  volumetricFlowFromScrewMotion,
  screwSpeedForVolumetricFlow,
  volumetricTransferBetweenScrews,
  averageResidenceTimeEstimate,
  averageResidenceTimeFromShotCycle,
  relativeCoolingTimeScale,
  amorphousSlabCoolingTimeEstimate,
  linearShrinkageCompensationRange,
  materialMoistureAcceptance,
  gateSealPlateauAssessment,
  channelSemanticReadiness,
  gradeSpecificProcessingBoundary,
  ENGINEERING_EQUATION_IDS,
  ENGINEERING_DOMAIN_BOUNDARY,
} from './src/domains/process/engineering-core.mjs';

// Golden arithmetic: the same synthetic clamp-force teaching example used by the
// next-release Book source. This is an arithmetic estimate, not a machine-rating rule.
const clamp = clampSeparatingForce({
  projectedArea: { value: 120, unit: 'cm²' },
  representativePressure: { value: 55, unit: 'MPa' },
  provenance: 'synthetic-teaching-fixture',
});
assert.equal(clamp.ok, true);
assert.equal(clamp.value.newtons, 660000);
assert.equal(clamp.value.kilonewtons, 660);
assert.equal(clamp.units.force, 'kN');
assert.equal(clamp.authority, 'engineering-estimate-only');
assert.match(clamp.assumptions.join(' '), /not automatically the required machine clamp rating/i);

const clampInSi = clampSeparatingForce({
  projectedArea: { value: 0.012, unit: 'm2' },
  representativePressure: { value: 55_000_000, unit: 'Pa' },
});
assert.equal(clampInSi.ok, true);
assert.equal(clampInSi.value.kilonewtons, 660);

assert.deepEqual(
  clampSeparatingForce({ projectedArea: { value: 120, unit: 'in2' }, representativePressure: { value: 55, unit: 'MPa' } }),
  { ok: false, reason: 'unsupported-projected-area-unit', field: 'projected-area', unit: 'in2' },
);
assert.equal(
  clampSeparatingForce({ projectedArea: { value: 0, unit: 'cm2' }, representativePressure: { value: 55, unit: 'MPa' } }).reason,
  'invalid-projected-area-value',
);

assert.equal(
  clampSeparatingForce({
    projectedArea: { value: 1e308, unit: 'm2' },
    representativePressure: { value: 1e308, unit: 'Pa' },
  }).reason,
  'non-finite-engineering-result',
  'finite inputs that overflow during engineering arithmetic must fail closed',
);

// Golden mass accounting: four 12.5 g parts plus a 5 g cold runner = 55 g/shot.
const shot = aggregateShotMass({
  cavityCount: 4,
  partMass: { value: 12.5, unit: 'g' },
  runnerMass: { value: 5, unit: 'g' },
  provenance: 'synthetic-mass-fixture',
});
assert.equal(shot.ok, true);
assert.deepEqual(shot.value, {
  partContributionG: 50,
  runnerContributionG: 5,
  totalG: 55,
  totalKg: 0.055,
});
assert.equal(shot.authority, 'mass-accounting-only');
assert.match(shot.assumptions.join(' '), /does not establish machine shot-capacity suitability/i);

const runnerless = aggregateShotMass({ cavityCount: 2, partMass: { value: 0.01, unit: 'kg' }, runnerMass: null });
assert.equal(runnerless.ok, true);
assert.equal(runnerless.value.totalG, 20);
assert.equal(aggregateShotMass({ cavityCount: 0, partMass: { value: 10, unit: 'g' } }).reason, 'invalid-cavity-count');
assert.equal(aggregateShotMass({ cavityCount: 1, partMass: { value: -1, unit: 'g' } }).reason, 'invalid-part-mass-value');
assert.equal(aggregateShotMass({ cavityCount: 1, partMass: { value: 1, unit: 'oz' } }).reason, 'unsupported-part-mass-unit');

// Semantic readiness must preserve today's fail-closed runtime rules while the UI
// remains on the frozen .16.2 implementation.
const semanticVectors = [
  { input: {}, expected: ['role', 'meaning', 'unit'] },
  { input: { role: 'actual', meaning: 'Peak injection pressure', unit: 'MPa', samplingBasis: 'per-cycle' }, expected: [] },
  { input: { role: 'actual', meaning: 'Peak injection pressure', unit: 'MPa', samplingBasis: 'unknown' }, expected: ['sampling_basis'] },
  { input: { role: 'quality', meaning: 'Part mass', unit: 'g', samplingBasis: 'batch' }, expected: [] },
  { input: { role: 'derived', meaning: 'Pressure-time area', unit: 'MPa·s', samplingBasis: 'trace-sample' }, expected: [] },
  { input: { role: 'state', meaning: 'Machine phase', unit: '', samplingBasis: 'unknown' }, expected: [] },
  { input: { role: 'structural', meaning: '', unit: '', samplingBasis: 'unknown' }, expected: [] },
  { input: { role: 'command', meaning: 'Velocity command', unit: '', samplingBasis: 'unknown', dynamicUnitColumn: 'velocity_unit' }, expected: [] },
  { input: { role: 'command', meaning: '', unit: 'mm/s', samplingBasis: 'unknown' }, expected: ['meaning'] },
];

function capturedLegacySemanticBlockers({ role = 'unresolved', meaning = '', unit = '', samplingBasis = 'unknown', dynamicUnitColumn = null } = {}) {
  const blockers = [];
  if (role === 'unresolved') blockers.push('role');
  if (!String(meaning || '').trim() && role !== 'structural') blockers.push('meaning');
  if (role !== 'structural' && role !== 'state' && !String(unit || '').trim() && !dynamicUnitColumn) blockers.push('unit');
  if (['actual', 'derived', 'quality'].includes(role) && samplingBasis === 'unknown') blockers.push('sampling_basis');
  return [...new Set(blockers)];
}

for (const vector of semanticVectors) {
  const pure = channelSemanticReadiness(vector.input);
  assert.deepEqual(pure.blockers, vector.expected, `pure semantic blockers drifted for ${JSON.stringify(vector.input)}`);
  assert.deepEqual(
    pure.blockers,
    capturedLegacySemanticBlockers(vector.input),
    `pure domain no longer matches captured .16.2 runtime semantics for ${JSON.stringify(vector.input)}`,
  );
  assert.equal(pure.ready, vector.expected.length === 0);
}

// Guard the equivalence fixture against silent edits to the frozen browser rule.
// If the legacy source changes, this deliberately fails and forces the migration
// owner to re-evaluate the equivalence vectors instead of assuming compatibility.
const legacyRuntime = fs.readFileSync(new URL('./data-integration-runtime.js', import.meta.url), 'utf8');
for (const fragment of [
  "if(role==='unresolved')blockers.push('role')",
  "if(!meaning&&!base.meaning&&role!=='structural')blockers.push('meaning')",
  "if(role!=='structural'&&role!=='state'&&!unit&&!dynamicUnitColumn)blockers.push('unit')",
  "if(['actual','derived','quality'].includes(role)&&sampling_basis==='unknown')blockers.push('sampling_basis')",
]) {
  assert.ok(legacyRuntime.includes(fragment), `captured semantic-readiness equivalence guard no longer matches runtime fragment: ${fragment}`);
}

const gradeBoundary = gradeSpecificProcessingBoundary({
  exactGrade: 'Example PA66-GF30 grade',
  currentSupplierDocument: 'supplier-datasheet-rev-X',
  requestedSetting: 'melt temperature',
});
assert.equal(gradeBoundary.ok, true);
assert.equal(gradeBoundary.value.disposition, 'consult-controlling-grade-document');
assert.equal(gradeBoundary.authority, 'source-first-boundary-only');
assert.equal(gradeSpecificProcessingBoundary({ currentSupplierDocument: 'doc', requestedSetting: 'drying' }).reason, 'exact-grade-required');
assert.equal(gradeSpecificProcessingBoundary({ exactGrade: 'grade', requestedSetting: 'drying' }).reason, 'current-grade-document-required');
assert.equal(gradeSpecificProcessingBoundary({ exactGrade: 'grade', currentSupplierDocument: 'doc' }).reason, 'requested-setting-required');



assert.equal(ENGINEERING_EQUATION_IDS.clampSeparatingForce, 'EQ-CF-001');
assert.equal(ENGINEERING_EQUATION_IDS.gateSealPlateau, 'PROC-GATE-001');

const cavityPressure = pressureValue({
  pressure: { value: 55, unit: 'MPa' },
  kind: 'cavity',
  provenance: 'semantic-pressure-fixture',
});
assert.equal(cavityPressure.ok, true);
assert.equal(cavityPressure.value.megapascals, 55);
assert.equal(cavityPressure.value.bar, 550);
assert.equal(cavityPressure.pressureKind, 'cavity');
assert.equal(cavityPressure.equationId, 'EQ-PRESS-001');
assert.match(cavityPressure.assumptions.join(' '), /does not convert one pressure location/i);
assert.equal(pressureValue({ pressure: { value: 55, unit: 'MPa' } }).reason, 'pressure-kind-required');

assert.equal(
  pressureValue({ pressure: { value: 55, unit: 'mPa' }, kind: 'cavity' }).reason,
  'unsupported-pressure-unit',
  'mPa must never be silently interpreted as MPa',
);
assert.equal(
  pressureValue({ pressure: { value: 55, unit: 'mpa' }, kind: 'cavity' }).reason,
  'unsupported-pressure-unit',
  'lowercase mpa is ambiguous and must not be normalised to MPa',
);


const measuredDrop = measuredPressureDifference({
  upstreamPressure: { value: 95, unit: 'MPa' },
  downstreamPressure: { value: 62, unit: 'MPa' },
  upstreamKind: 'nozzle',
  downstreamKind: 'cavity',
  upstreamLocationId: 'nozzle-transducer-A',
  downstreamLocationId: 'cavity-3-sensor',
  measurementBasisRef: 'cycle-142-fill-end-synchronised',
  provenance: 'controlled-pressure-loss-study',
});
assert.equal(measuredDrop.ok, true);
assert.equal(measuredDrop.value.pressureDifferenceMegapascals, 33);
assert.equal(measuredDrop.value.upstreamNotLowerThanDownstream, true);
assert.equal(measuredDrop.equationId, 'EQ-PRESS-002');
assert.match(measuredDrop.assumptions.join(' '), /not automatically a pressure-loss coefficient/i);

assert.equal(
  measuredPressureDifference({
    upstreamPressure: { value: 120, unit: 'bar' },
    downstreamPressure: { value: 8, unit: 'MPa' },
    upstreamKind: 'hydraulic',
    downstreamKind: 'cavity',
    upstreamLocationId: 'hydraulic-line',
    downstreamLocationId: 'cavity',
    measurementBasisRef: 'same-cycle',
  }).reason,
  'unsupported-upstream-measured-pressure-kind',
);

const negativeMeasuredDrop = measuredPressureDifference({
  upstreamPressure: { value: 50, unit: 'MPa' },
  downstreamPressure: { value: 52, unit: 'MPa' },
  upstreamKind: 'runner',
  downstreamKind: 'cavity',
  upstreamLocationId: 'runner-A',
  downstreamLocationId: 'cavity-A',
  measurementBasisRef: 'trace-sample-55',
});
assert.equal(negativeMeasuredDrop.ok, true);
assert.equal(negativeMeasuredDrop.value.pressureDifferenceMegapascals, -2);
assert.equal(negativeMeasuredDrop.value.upstreamNotLowerThanDownstream, false);
assert.match(negativeMeasuredDrop.assumptions.join(' '), /retained and flagged rather than silently corrected/i);

assert.equal(
  measuredPressureDifference({
    upstreamPressure: { value: 50, unit: 'MPa' },
    downstreamPressure: { value: 45, unit: 'MPa' },
    upstreamKind: 'runner',
    downstreamKind: 'runner',
    upstreamLocationId: 'runner-A',
    downstreamLocationId: 'runner-A',
    measurementBasisRef: 'trace-sample-1',
  }).reason,
  'distinct-pressure-locations-required',
);

const clampRange = clampSeparatingForceRange({
  projectedArea: { value: 100, unit: 'cm²' },
  lowerRepresentativePressure: { value: 40, unit: 'MPa' },
  upperRepresentativePressure: { value: 60, unit: 'MPa' },
});
assert.equal(clampRange.ok, true);
assert.equal(clampRange.value.lowerKilonewtons, 400);
assert.equal(clampRange.value.upperKilonewtons, 600);
assert.equal(clampRange.equationId, 'EQ-CF-002');
assert.equal(
  clampSeparatingForceRange({
    projectedArea: { value: 100, unit: 'cm2' },
    lowerRepresentativePressure: { value: 70, unit: 'MPa' },
    upperRepresentativePressure: { value: 60, unit: 'MPa' },
  }).reason,
  'pressure-range-reversed',
);

assert.equal(
  clampSeparatingForceRange({
    projectedArea: { value: 1, unit: 'Mm2' },
    lowerRepresentativePressure: { value: 40, unit: 'MPa' },
    upperRepresentativePressure: { value: 60, unit: 'MPa' },
  }).reason,
  'unsupported-projected-area-unit',
  'Mm2 must never be silently interpreted as mm2',
);

const machineCapacityIds = {
  machineConfigurationId: 'IMM-07/config-A',
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
};

assert.equal(
  shotCapacityAssessment({
    requiredShotMass: { value: 55, unit: 'g' },
    usableMachineShotMass: { value: 100, unit: 'g' },
  }).reason,
  'missing-machine-configuration-id',
);
assert.equal(
  shotCapacityAssessment({
    ...machineCapacityIds,
    requiredShotMass: { value: 55, unit: 'g' },
    usableMachineShotMass: { value: 100, unit: 'g' },
    capacityBasisRef: 'oem-shot-capacity-basis-rev-A',
  }).reason,
  'capacity-basis-unverified',
);
assert.equal(
  shotCapacityAssessment({
    ...machineCapacityIds,
    requiredShotMass: { value: 55, unit: 'g' },
    usableMachineShotMass: { value: 100, unit: 'g' },
    capacityBasisVerified: true,
  }).reason,
  'capacity-basis-reference-required',
);
const shotCapacity = shotCapacityAssessment({
  ...machineCapacityIds,
  requiredShotMass: { value: 55, unit: 'g' },
  usableMachineShotMass: { value: 0.1, unit: 'kg' },
  capacityBasisVerified: true,
  capacityBasisRef: 'oem-shot-capacity-basis-rev-A',
});
assert.equal(shotCapacity.ok, true);
assert.equal(shotCapacity.value.machineConfigurationId, machineCapacityIds.machineConfigurationId);
assert.equal(shotCapacity.value.injectionUnitConfigurationId, machineCapacityIds.injectionUnitConfigurationId);
assert.equal(shotCapacity.value.capacityBasisRef, 'oem-shot-capacity-basis-rev-A');
assert.equal(shotCapacity.value.utilisationPct, 55);
assert.equal(shotCapacity.value.capacityMarginG, 45);
assert.equal(shotCapacity.value.exceedsUsableCapacity, false);
assert.match(shotCapacity.assumptions.join(' '), /No universal preferred barrel-utilisation percentage/i);

assert.equal(
  aggregateShotMass({
    cavityCount: 1,
    partMass: { value: 1, unit: 'Mg' },
  }).reason,
  'unsupported-part-mass-unit',
  'Mg must never be silently interpreted as mg',
);
assert.equal(
  aggregateShotMass({
    cavityCount: 1,
    partMass: { value: 10, unit: 'g' },
    runnerMass: { value: 1, unit: 'Mg' },
  }).reason,
  'unsupported-runner-mass-unit',
  'runner mass must preserve SI prefix case',
);

const clampCapacity = clampCapacityAssessment({
  machineConfigurationId: machineCapacityIds.machineConfigurationId,
  capacityBasisRef: 'oem-clamp-capacity-rev-A',
  requiredClampForce: { value: 900, unit: 'kN' },
  availableClampForce: { value: 1.2, unit: 'MN' },
});
assert.equal(clampCapacity.ok, true);
assert.equal(clampCapacity.value.machineConfigurationId, machineCapacityIds.machineConfigurationId);
assert.equal(clampCapacity.value.capacityBasisRef, 'oem-clamp-capacity-rev-A');
assert.equal(clampCapacity.value.utilisationPct, 75);
assert.equal(clampCapacity.value.capacityMarginKilonewtons, 300);
assert.equal(clampCapacity.value.exceedsAvailableCapacity, false);
assert.match(clampCapacity.assumptions.join(' '), /does not determine an appropriate operating clamp setpoint/i);

assert.equal(
  clampCapacityAssessment({
    machineConfigurationId: machineCapacityIds.machineConfigurationId,
    capacityBasisRef: 'oem-clamp-capacity-rev-A',
    requiredClampForce: { value: 900, unit: 'kN' },
    availableClampForce: { value: 1200000, unit: 'mN' },
  }).reason,
  'unsupported-available-clamp-force-unit',
  'mN must never be silently interpreted as MN',
);
assert.equal(
  clampCapacityAssessment({
    machineConfigurationId: machineCapacityIds.machineConfigurationId,
    capacityBasisRef: 'oem-clamp-capacity-rev-A',
    requiredClampForce: { value: 900, unit: 'kn' },
    availableClampForce: { value: 1200, unit: 'kN' },
  }).reason,
  'unsupported-required-clamp-force-unit',
  'force units must use canonical SI prefix case',
);

const pressureCapacity = specificPlasticPressureCapacityAssessment({
  ...machineCapacityIds,
  capacityBasisRef: 'oem-specific-plastic-pressure-rev-A',
  requiredPressure: { value: 120, unit: 'MPa' },
  availableMachinePressure: { value: 1500, unit: 'bar' },
});
assert.equal(pressureCapacity.ok, true);
assert.equal(pressureCapacity.value.machineConfigurationId, machineCapacityIds.machineConfigurationId);
assert.equal(pressureCapacity.value.injectionUnitConfigurationId, machineCapacityIds.injectionUnitConfigurationId);
assert.equal(pressureCapacity.value.requiredMegapascals, 120);
assert.equal(pressureCapacity.value.availableMegapascals, 150);
assert.equal(pressureCapacity.value.utilisationPct, 80);
assert.equal(pressureCapacity.value.capacityMarginMegapascals, 30);
assert.match(pressureCapacity.assumptions.join(' '), /hydraulic pressure must not be substituted/i);

const flowCapacity = volumetricFlowCapacityAssessment({
  ...machineCapacityIds,
  capacityBasisRef: 'oem-volumetric-flow-capacity-rev-A',
  requiredFlow: { value: 200, unit: 'cm³/s' },
  availableMachineFlow: { value: 15, unit: 'L/min' },
});
assert.equal(flowCapacity.ok, true);
assert.equal(flowCapacity.value.machineConfigurationId, machineCapacityIds.machineConfigurationId);
assert.equal(flowCapacity.value.injectionUnitConfigurationId, machineCapacityIds.injectionUnitConfigurationId);
assert.equal(flowCapacity.value.requiredCm3S, 200);
assert.ok(Math.abs(flowCapacity.value.availableCm3S - 250) < 1e-12);
assert.ok(Math.abs(flowCapacity.value.utilisationPct - 80) < 1e-12);
assert.ok(Math.abs(flowCapacity.value.capacityMarginCm3S - 50) < 1e-12);

const plasticisingCapacity = plasticisingThroughputAssessment({
  ...machineCapacityIds,
  materialGradeId: 'PA66-GF30-grade-X',
  capacityBasisRef: 'oem-grade-specific-plasticising-trial-rev-A',
  requiredMassRate: { value: 18, unit: 'kg/h' },
  availablePlasticisingRate: { value: 30, unit: 'kg/h' },
});
assert.equal(plasticisingCapacity.ok, true);
assert.equal(plasticisingCapacity.value.machineConfigurationId, machineCapacityIds.machineConfigurationId);
assert.equal(plasticisingCapacity.value.injectionUnitConfigurationId, machineCapacityIds.injectionUnitConfigurationId);
assert.equal(plasticisingCapacity.value.materialGradeId, 'PA66-GF30-grade-X');
assert.equal(plasticisingCapacity.value.requiredGS, 5);
assert.ok(Math.abs(plasticisingCapacity.value.availableGS - (30 * 1000 / 3600)) < 1e-12);
assert.ok(Math.abs(plasticisingCapacity.value.utilisationPct - 60) < 1e-12);
assert.match(plasticisingCapacity.assumptions.join(' '), /Nominal catalogue plasticising rate is not assumed/i);


const commonFitIds = {
  machineConfigurationId: 'IMM-07/config-A',
  mouldConfigurationId: 'MOULD-142/rev-C',
};

const heightFit = mouldHeightFit({
  ...commonFitIds,
  mouldHeight: { value: 420, unit: 'mm' },
  machineMinMouldHeight: { value: 300, unit: 'mm' },
  machineMaxMouldHeight: { value: 550, unit: 'mm' },
  provenance: 'oem-machine-data + approved-tool-drawing',
});
assert.equal(heightFit.ok, true);
assert.equal(heightFit.value.state, 'PASS');
assert.equal(heightFit.value.marginAboveMinimumMm, 120);
assert.equal(heightFit.value.marginBelowMaximumMm, 130);
assert.match(heightFit.assumptions.join(' '), /does not authorize installation/i);
assert.equal(
  mouldHeightFit({
    ...commonFitIds,
    mouldHeight: { value: 420, unit: 'mm' },
    machineMinMouldHeight: { value: 600, unit: 'mm' },
    machineMaxMouldHeight: { value: 500, unit: 'mm' },
  }).reason,
  'machine-mould-height-range-reversed',
);

const openingFit = openingStrokeFit({
  ...commonFitIds,
  requiredOpeningStroke: { value: 450, unit: 'mm' },
  availableOpeningStroke: { value: 500, unit: 'mm' },
});
assert.equal(openingFit.ok, true);
assert.equal(openingFit.value.state, 'PASS');
assert.equal(openingFit.value.marginMm, 50);

const daylight = daylightFit({
  ...commonFitIds,
  mouldClosedHeight: { value: 420, unit: 'mm' },
  requiredOpenGap: { value: 480, unit: 'mm' },
  availableMaximumDaylight: { value: 850, unit: 'mm' },
});
assert.equal(daylight.ok, true);
assert.equal(daylight.value.requiredMaximumPlatenSeparationMm, 900);
assert.equal(daylight.value.state, 'FAIL');
assert.equal(daylight.value.marginMm, -50);

const tieBars = tieBarClearanceFit({
  ...commonFitIds,
  orientedMouldWidth: { value: 620, unit: 'mm' },
  orientedMouldHeight: { value: 580, unit: 'mm' },
  horizontalTieBarClearance: { value: 650, unit: 'mm' },
  verticalTieBarClearance: { value: 570, unit: 'mm' },
});
assert.equal(tieBars.ok, true);
assert.equal(tieBars.value.horizontalFits, true);
assert.equal(tieBars.value.verticalFits, false);
assert.equal(tieBars.value.state, 'FAIL');
assert.match(tieBars.assumptions.join(' '), /does not silently rotate the mould/i);

const ejector = ejectorStrokeFit({
  ...commonFitIds,
  requiredEjectorStroke: { value: 90, unit: 'mm' },
  availableEjectorStroke: { value: 120, unit: 'mm' },
});
assert.equal(ejector.ok, true);
assert.equal(ejector.value.state, 'PASS');
assert.equal(ejector.value.marginMm, 30);

assert.equal(
  openingStrokeFit({
    requiredOpeningStroke: { value: 450, unit: 'mm' },
    availableOpeningStroke: { value: 500, unit: 'mm' },
    mouldConfigurationId: commonFitIds.mouldConfigurationId,
  }).reason,
  'missing-machine-configuration-id',
);

const suitabilityUnknown = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic complete-machine-screen fixture',
  requiredAxisIds: ['mould-height', 'opening-stroke', 'daylight', 'tie-bars', 'ejector', 'shot'],
  assessments: {
    'mould-height': heightFit,
    'opening-stroke': openingFit,
    daylight,
    'tie-bars': null,
    ejector,
    shot: shotCapacity,
  },
});
assert.equal(suitabilityUnknown.ok, true);
assert.equal(suitabilityUnknown.value.summaryState, 'FAIL', 'a known failure must dominate unknown axes');
assert.equal(suitabilityUnknown.value.coverageComplete, false);

const suitabilityPass = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic declared-axis fixture',
  requiredAxisIds: ['mould-height', 'opening-stroke', 'ejector', 'shot'],
  assessments: {
    'mould-height': heightFit,
    'opening-stroke': openingFit,
    ejector,
    shot: shotCapacity,
  },
});
assert.equal(suitabilityPass.ok, true);
assert.equal(suitabilityPass.value.summaryState, 'PASS');
assert.equal(suitabilityPass.value.coverageComplete, true);
assert.match(suitabilityPass.assumptions.join(' '), /not a universal declaration/i);

// Fail closed on truncated required-axis declarations: dropping a blank,
// duplicate or coerced axis could previously yield a misleading overall PASS.
const makeFitSummary = (requiredAxisIds, assessments = {shot:shotCapacity}) =>
  machineSuitabilitySummary({
    machineConfigurationId: commonFitIds.machineConfigurationId,
    injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
    mouldConfigurationId: commonFitIds.mouldConfigurationId,
    basis: 'declared machine-axis integrity fixture',
    requiredAxisIds, assessments,
  });
for (const bad of [['shot', ''],['shot','shot'],['shot',' '],
                   ['shot', 0], ['shot', null], ['shot', {toString:()=> 'shot'}],
                   ['shot', '__proto__'], ['shot', 'constructor'],
                   ['shot', 'CAPACITY']]) {
  const result=makeFitSummary(bad);
  assert.equal(result.ok,false,'misleading PASS accepted malformed required-axis list');
  assert.match(result.reason,/invalid-required-axis-id|duplicate-required-axis-id/);
}
// Sparse arrays and inherited indexed slots must not evade Array.prototype.some.
const sparseAxes = ['shot', 'gate'];
delete sparseAxes[1];
assert.equal(makeFitSummary(sparseAxes).ok, false,
  'sparse required-axis slot must not be omitted from machine-fit declaration');
const inheritedAxis = ['shot', 'gate'];
delete inheritedAxis[1];
Object.setPrototypeOf(inheritedAxis, Object.assign(Object.create(Array.prototype), {1:'gate'}));
assert.equal(makeFitSummary(inheritedAxis).ok, false,
  'inherited required-axis array slot must not count as declared evidence');
// Accessor-index axes are invalid even when the getter returns a valid ID.
// Validation must not execute untrusted getters or infer a PASS from them.
const getterAxes = ['shot', 'gate'];
let getterCalls = 0;
Object.defineProperty(getterAxes, 1, {get(){ getterCalls++; return 'gate'; }, configurable:true});
const getterResult = makeFitSummary(getterAxes);
assert.equal(getterResult.ok, false, 'accessor required-axis entry must fail closed');
assert.equal(getterCalls, 0, 'required-axis validation must not call getters');
// Bound attacker-controlled axis array lengths before allocating traversal state.
const oversizedAxes = ['shot'];
oversizedAxes.length = 1_000_000;
const oversizedResult = makeFitSummary(oversizedAxes);
assert.equal(oversizedResult.ok, false,
  'oversized required-axis declaration must be rejected before traversal');
assert.equal(oversizedResult.reason, 'required-axis-list-required');
// Assessment getters are untrusted evidence, not callable validation hooks.
const accessorAssessments = {};
let assessmentGetterCalls = 0;
Object.defineProperty(accessorAssessments, 'shot', {
  get(){ assessmentGetterCalls++; return shotCapacity; }, configurable:true
});
const accessorAssessmentResult = makeFitSummary(['shot'], accessorAssessments);
assert.equal(accessorAssessmentResult.value.summaryState, 'UNKNOWN');
assert.equal(accessorAssessmentResult.value.axes[0].reason, 'missing-assessment');
assert.equal(assessmentGetterCalls, 0,
  'machine-fit assessment validation must not invoke getter evidence');
// Machine-fit identity/basis objects must not be coerced via custom toString.
let identityCoercionCalls = 0;
const forgedIdentity = {toString(){ identityCoercionCalls++; return machineCapacityIds.machineConfigurationId; }};
const safeInputs = {
  machineConfigurationId: machineCapacityIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'declared machine identity regression',
  requiredAxisIds: ['shot'],
  assessments: {shot: shotCapacity},
};
assert.equal(machineSuitabilitySummary({...safeInputs, machineConfigurationId:forgedIdentity}).ok, false);
assert.equal(machineSuitabilitySummary({...safeInputs, basis:forgedIdentity}).ok, false);
assert.equal(identityCoercionCalls, 0,
  'machine identity or basis must not execute object coercion hooks');
// Revoked proxies are malformed evidence, not uncaught exceptions or PASS.
const revokedAxisInput = Proxy.revocable(['shot'], {});
revokedAxisInput.revoke();
assert.equal(makeFitSummary(revokedAxisInput.proxy).ok, false);
const revokedEvidenceInput = Proxy.revocable({shot: shotCapacity}, {});
revokedEvidenceInput.revoke();
assert.equal(makeFitSummary(['shot'], revokedEvidenceInput.proxy).value.summaryState, 'UNKNOWN');
const badAxisDescriptor = new Proxy(['shot'], {
  getOwnPropertyDescriptor(){ throw Error('malformed evidence descriptor'); },
});
assert.equal(makeFitSummary(badAxisDescriptor).ok, false);
// Option accessors must not be run by destructuring before validation.
let optionsGetterCalls = 0;
for (const unsafeKey of ['machineConfigurationId', 'requiredAxisIds', 'assessments', 'basis']) {
  const accessorOptions = {...safeInputs};
  Object.defineProperty(accessorOptions, unsafeKey, {
    get(){ optionsGetterCalls++; return safeInputs[unsafeKey]; },
  });
  const outcome = machineSuitabilitySummary(accessorOptions);
  assert.equal(outcome.ok, false, `accessor option ${unsafeKey} must fail closed`);
}
assert.equal(optionsGetterCalls, 0, 'machine-fit options must not invoke getter fields');
const revokedOptions = Proxy.revocable(safeInputs, {});
revokedOptions.revoke();
assert.equal(machineSuitabilitySummary(revokedOptions.proxy).ok, false,
  'revoked options proxy must return unsupported, not throw');
// A custom array iterator must never replace the validated own axis slots.
let axisIteratorCalls = 0;
const iteratorSpoofAxes = ['shot'];
Object.defineProperty(iteratorSpoofAxes, Symbol.iterator, {
  value(){ axisIteratorCalls++; throw Error('untrusted required-axis iterator executed'); },
});
assert.equal(makeFitSummary(iteratorSpoofAxes).value.summaryState, 'PASS',
  'valid own axis must be evaluated independently of custom iterators');
assert.equal(axisIteratorCalls, 0);

// Nested assessment data must not execute getters or inherit a fake PASS.
let nestedGetterCalls = 0;
const nestedAccessorValue = {machineConfigurationId: machineCapacityIds.machineConfigurationId};
Object.defineProperty(nestedAccessorValue, 'fits', {
  get(){ nestedGetterCalls++; return true; },
});
const nestedAccessorResult = makeFitSummary(['shot'], {
  shot: {ok:true, value:nestedAccessorValue},
});
assert.equal(nestedAccessorResult.value.summaryState, 'UNKNOWN');
assert.equal(nestedGetterCalls, 0,
  'nested machine-fit assessment getters must not be called');
const inheritedPassValue = Object.create({state:'PASS'});
inheritedPassValue.machineConfigurationId = machineCapacityIds.machineConfigurationId;
assert.equal(makeFitSummary(['shot'], {shot:{ok:true,value:inheritedPassValue}}).value.summaryState,
  'UNKNOWN', 'prototype-inherited state cannot justify PASS');
let innerValueGetterCalls = 0;
const accessorInner = {ok:true};
Object.defineProperty(accessorInner, 'value', {
  get(){ innerValueGetterCalls++; return shotCapacity.value; },
});
assert.equal(makeFitSummary(['shot'], {shot:accessorInner}).value.summaryState, 'UNKNOWN');
assert.equal(innerValueGetterCalls, 0);
const inheritedShot={};
Object.setPrototypeOf(inheritedShot,{shot:shotCapacity});
const inheritedResult=makeFitSummary(['shot'],inheritedShot);
assert.equal(inheritedResult.value.summaryState,'UNKNOWN',
  'inherited/prototype assessment must not count as verified machine-fit evidence');
assert.equal(inheritedResult.value.axes[0].reason,'missing-assessment');
assert.equal(makeFitSummary(['shot'],[shotCapacity]).value.summaryState,'UNKNOWN');
assert.equal(makeFitSummary(['shot']).value.summaryState,'PASS',
  'legitimate exact-identity required machine-fit axis should remain usable');

const wrongMachineShot = shotCapacityAssessment({
  machineConfigurationId: 'IMM-99/config-Z',
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  requiredShotMass: { value: 55, unit: 'g' },
  usableMachineShotMass: { value: 100, unit: 'g' },
  capacityBasisVerified: true,
  capacityBasisRef: 'oem-shot-capacity-other-machine',
});
assert.equal(wrongMachineShot.ok, true);
const crossMachineSummary = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'identity-mismatch-fixture',
  requiredAxisIds: ['shot'],
  assessments: { shot: wrongMachineShot },
});
assert.equal(crossMachineSummary.value.summaryState, 'UNKNOWN');
assert.equal(crossMachineSummary.value.axes[0].reason, 'machine-configuration-mismatch');

const wrongInjectionShot = shotCapacityAssessment({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: 'IU-07/40mm-screw',
  requiredShotMass: { value: 55, unit: 'g' },
  usableMachineShotMass: { value: 100, unit: 'g' },
  capacityBasisVerified: true,
  capacityBasisRef: 'oem-shot-capacity-other-injection-unit',
});
assert.equal(wrongInjectionShot.ok, true);
const crossInjectionSummary = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'identity-mismatch-fixture',
  requiredAxisIds: ['shot'],
  assessments: { shot: wrongInjectionShot },
});
assert.equal(crossInjectionSummary.value.summaryState, 'UNKNOWN');
assert.equal(crossInjectionSummary.value.axes[0].reason, 'injection-unit-configuration-mismatch');

const wrongMouldHeight = mouldHeightFit({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  mouldConfigurationId: 'MOULD-999/rev-A',
  mouldHeight: { value: 420, unit: 'mm' },
  machineMinMouldHeight: { value: 300, unit: 'mm' },
  machineMaxMouldHeight: { value: 550, unit: 'mm' },
});
assert.equal(wrongMouldHeight.ok, true);
const crossMouldSummary = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'identity-mismatch-fixture',
  requiredAxisIds: ['mould-height'],
  assessments: { 'mould-height': wrongMouldHeight },
});
assert.equal(crossMouldSummary.value.summaryState, 'UNKNOWN');
assert.equal(crossMouldSummary.value.axes[0].reason, 'mould-configuration-mismatch');


const suitabilityOnlyUnknown = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic declared-axis fixture',
  requiredAxisIds: ['mould-height', 'unknown-axis'],
  assessments: { 'mould-height': heightFit },
});
assert.equal(suitabilityOnlyUnknown.value.summaryState, 'UNKNOWN');
assert.equal(suitabilityOnlyUnknown.value.coverageComplete, false);

const marginalSummary = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'authorised site threshold fixture',
  requiredAxisIds: ['mould-height', 'site-specific-axis'],
  assessments: {
    'mould-height': heightFit,
    'site-specific-axis': {
      ok: true,
      value: { state: 'MARGINAL' },
      contextIndependent: true,
      contextBasisRef: 'approved-site-context-rule-rev-3',
      marginalBasisRef: 'approved-site-machine-fit-rule-rev-3',
    },
  },
});
assert.equal(marginalSummary.value.summaryState, 'MARGINAL');
assert.match(marginalSummary.assumptions.join(' '), /non-empty marginalBasisRef/i);

const marginalWithoutBasis = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic declared-axis fixture',
  requiredAxisIds: ['mould-height', 'site-specific-axis'],
  assessments: {
    'mould-height': heightFit,
    'site-specific-axis': {
      ok: true,
      value: { state: 'MARGINAL' },
      contextIndependent: true,
      contextBasisRef: 'approved-site-context-rule-rev-3',
    },
  },
});
assert.equal(marginalWithoutBasis.value.summaryState, 'UNKNOWN');
assert.equal(
  marginalWithoutBasis.value.axes.find(axis => axis.id === 'site-specific-axis').reason,
  'marginal-basis-required',
);

const unboundCustomAxis = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'custom-axis-identity-fixture',
  requiredAxisIds: ['custom-axis'],
  assessments: {
    'custom-axis': { ok: true, value: { state: 'PASS' } },
  },
});
assert.equal(unboundCustomAxis.value.summaryState, 'UNKNOWN');
assert.equal(unboundCustomAxis.value.axes[0].reason, 'assessment-identity-unbound');

const missingContextBasis = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'custom-axis-context-fixture',
  requiredAxisIds: ['custom-axis'],
  assessments: {
    'custom-axis': { ok: true, value: { state: 'PASS' }, contextIndependent: true },
  },
});
assert.equal(missingContextBasis.value.summaryState, 'UNKNOWN');
assert.equal(missingContextBasis.value.axes[0].reason, 'context-basis-required');

const contextIndependentPass = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: machineCapacityIds.injectionUnitConfigurationId,
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'custom-axis-context-fixture',
  requiredAxisIds: ['custom-axis'],
  assessments: {
    'custom-axis': {
      ok: true,
      value: { state: 'PASS' },
      contextIndependent: true,
      contextBasisRef: 'approved-context-independent-rule-rev-A',
    },
  },
});
assert.equal(contextIndependentPass.value.summaryState, 'PASS');
assert.equal(contextIndependentPass.value.coverageComplete, true);



const hydraulic = hydraulicDiameter({
  crossSectionArea: { value: 20, unit: 'mm²' },
  wettedPerimeter: { value: 18, unit: 'mm' },
  provenance: 'synthetic-channel-geometry',
});
assert.equal(hydraulic.ok, true);
assert.ok(Math.abs(hydraulic.value.hydraulicDiameterMm - (80 / 18)) < 1e-12);
assert.match(hydraulic.assumptions.join(' '), /does not by itself establish pressure loss/i);

const channelVolume = uniformChannelVolume({
  crossSectionArea: { value: 20, unit: 'mm²' },
  channelLength: { value: 100, unit: 'mm' },
});
assert.equal(channelVolume.ok, true);
assert.ok(Math.abs(channelVolume.value.volumeCm3 - 2) < 1e-12);
assert.match(channelVolume.assumptions.join(' '), /geometric volume only/i);

const circularShear = circularChannelApparentWallShearRate({
  volumetricFlow: { value: 10, unit: 'cm³/s' },
  diameter: { value: 10, unit: 'mm' },
});
assert.equal(circularShear.ok, true);
assert.ok(Math.abs(circularShear.value.apparentWallShearRatePerS - (320 / Math.PI)) < 1e-12);
assert.match(circularShear.assumptions.join(' '), /does not apply a Rabinowitsch correction/i);
assert.match(circularShear.assumptions.join(' '), /does not calculate viscosity/i);

const pressureLossReady = pressureLossModelReadiness({
  materialGradeId: 'PA66-GF30-grade-X',
  rheologyModelRef: 'supplier/CAE-cross-wlf-rev-2',
  thermalStateRef: 'measured-melt-state/trial-14',
  flowPathGeometryRef: 'mould-142-flowpath-rev-C',
  volumetricFlow: { value: 55, unit: 'cm³/s' },
  upstreamPressureKind: 'nozzle',
  downstreamPressureKind: 'cavity',
  upstreamLocationId: 'nozzle-transducer-A',
  downstreamLocationId: 'cavity-3-sensor',
  provenance: 'controlled-trial-14',
});
assert.equal(pressureLossReady.ok, true);
assert.equal(pressureLossReady.value.ready, true);
assert.deepEqual(pressureLossReady.value.blockers, []);
assert.match(pressureLossReady.assumptions.join(' '), /MFR\/MFI alone is not accepted/i);

const pressureLossBlocked = pressureLossModelReadiness({
  volumetricFlow: { value: 55, unit: 'cm³/s' },
  upstreamPressureKind: 'runner',
  downstreamPressureKind: 'runner',
});
assert.equal(pressureLossBlocked.ok, true);
assert.equal(pressureLossBlocked.value.ready, false);
for (const blocker of ['material-grade', 'rheology-model', 'thermal-state', 'flow-path-geometry', 'upstream-pressure-location', 'downstream-pressure-location']) {
  assert.ok(pressureLossBlocked.value.blockers.includes(blocker), `pressure-loss readiness missing blocker ${blocker}`);
}
const sameLocationPressureLoss = pressureLossModelReadiness({
  materialGradeId: 'grade',
  rheologyModelRef: 'rheo',
  thermalStateRef: 'thermal',
  flowPathGeometryRef: 'geometry',
  volumetricFlow: { value: 55, unit: 'cm3/s' },
  upstreamPressureKind: 'runner',
  downstreamPressureKind: 'runner',
  upstreamLocationId: 'runner-sensor-1',
  downstreamLocationId: 'runner-sensor-1',
});
assert.ok(sameLocationPressureLoss.value.blockers.includes('distinct-pressure-locations'));
const pressureLossNoFlow = pressureLossModelReadiness({
  materialGradeId: 'grade',
  rheologyModelRef: 'rheo',
  thermalStateRef: 'thermal',
  flowPathGeometryRef: 'geometry',
  volumetricFlow: { value: 0, unit: 'cm3/s' },
  upstreamPressureKind: 'nozzle',
  downstreamPressureKind: 'cavity',
  upstreamLocationId: 'nozzle-A',
  downstreamLocationId: 'cavity-A',
});
assert.ok(pressureLossNoFlow.value.blockers.includes('volumetric-flow'));

const pressureLossHydraulicBlocked = pressureLossModelReadiness({
  materialGradeId: 'grade',
  rheologyModelRef: 'rheo',
  thermalStateRef: 'thermal',
  flowPathGeometryRef: 'geometry',
  volumetricFlow: { value: 55, unit: 'cm3/s' },
  upstreamPressureKind: 'hydraulic',
  downstreamPressureKind: 'cavity',
  upstreamLocationId: 'hydraulic-line-A',
  downstreamLocationId: 'cavity-A',
});
assert.ok(pressureLossHydraulicBlocked.value.blockers.includes('upstream-pressure-kind'));

const pressureLossCommandBlocked = pressureLossModelReadiness({
  materialGradeId: 'grade',
  rheologyModelRef: 'rheo',
  thermalStateRef: 'thermal',
  flowPathGeometryRef: 'geometry',
  volumetricFlow: { value: 55, unit: 'cm3/s' },
  upstreamPressureKind: 'nozzle',
  downstreamPressureKind: 'pack-command',
  upstreamLocationId: 'nozzle-A',
  downstreamLocationId: 'pack-command',
});
assert.ok(pressureLossCommandBlocked.value.blockers.includes('downstream-pressure-kind'));

const rates = fillStageRates({
  fillTime: { value: 2, unit: 's' },
  fillVolume: { value: 40, unit: 'cm³' },
  fillMass: { value: 30, unit: 'g' },
  injectionStroke: { value: 5, unit: 'cm' },
});
assert.equal(rates.ok, true);
assert.equal(rates.value.volumetricFlowCm3S, 20);
assert.equal(rates.value.massFlowGS, 15);
assert.equal(rates.value.averageScrewRamSpeedMmS, 25);
assert.equal(rates.equationId, 'EQ-FLOW-001');
assert.equal(fillStageRates({ fillTime: { value: 2, unit: 's' } }).reason, 'fill-rate-numerator-required');

assert.equal(
  fillStageRates({
    fillTime: { value: 2, unit: 's' },
    injectionStroke: { value: 1, unit: 'Mm' },
  }).reason,
  'unsupported-injection-stroke-unit',
  'Mm must never be silently interpreted as mm',
);
assert.equal(
  fillStageRates({
    fillTime: { value: 2, unit: 's' },
    fillVolume: { value: 1, unit: 'ML' },
  }).reason,
  'unsupported-fill-volume-unit',
  'ML must never be silently interpreted as mL',
);


assert.equal(
  screwSweptVolume({
    screwDiameter: { value: 40, unit: 'mm' },
    screwStroke: { value: 100, unit: 'mm' },
  }).reason,
  'missing-injection-unit-configuration-id',
);

assert.equal(
  screwSweptVolume({
    screwDiameter: { value: 40, unit: 'mm' },
    screwStroke: { value: 100, unit: 'mm' },
    injectionUnitConfigurationId: 'IMM-A/IU-40',
  }).reason,
  'screw-geometry-basis-reference-required',
);

const swept = screwSweptVolume({
  screwDiameter: { value: 40, unit: 'mm' },
  screwStroke: { value: 100, unit: 'mm' },
  injectionUnitConfigurationId: 'IMM-A/IU-40',
  screwGeometryBasisRef: 'oem-screw-geometry/IU-40-rev-A',
  provenance: 'synthetic-machine-geometry',
});
assert.equal(swept.ok, true);
assert.equal(swept.value.screwGeometryBasisRef, 'oem-screw-geometry/IU-40-rev-A');
assert.ok(Math.abs(swept.value.sweptVolumeCm3 - (Math.PI * 40 ** 2 / 4 * 100 / 1000)) < 1e-12);
assert.equal(swept.equationId, 'EQ-MTRANS-001');
assert.match(swept.assumptions.join(' '), /not automatically delivered melt volume/i);

assert.equal(
  volumetricFlowFromScrewMotion({
    screwDiameter: { value: 40, unit: 'mm' },
    screwLinearSpeed: { value: 80, unit: 'mm/s' },
    injectionUnitConfigurationId: 'IMM-A/IU-40',
    screwGeometryBasisRef: 'oem-screw-geometry/IU-40-rev-A',
  }).reason,
  'screw-motion-basis-reference-required',
);

const screwFlow = volumetricFlowFromScrewMotion({
  screwDiameter: { value: 40, unit: 'mm' },
  screwLinearSpeed: { value: 80, unit: 'mm/s' },
  injectionUnitConfigurationId: 'IMM-A/IU-40',
  screwGeometryBasisRef: 'oem-screw-geometry/IU-40-rev-A',
  screwMotionBasisRef: 'actual-screw-trace/source-cycle-142',
});
assert.equal(screwFlow.ok, true);
assert.equal(screwFlow.value.screwMotionBasisRef, 'actual-screw-trace/source-cycle-142');
assert.ok(Math.abs(screwFlow.value.geometricVolumetricFlowCm3S - (Math.PI * 40 ** 2 / 4 * 80 / 1000)) < 1e-12);
assert.match(screwFlow.assumptions.join(' '), /not proven cavity volumetric flow/i);

assert.equal(
  screwSpeedForVolumetricFlow({
    screwDiameter: { value: 50, unit: 'mm' },
    targetVolumetricFlow: { value: screwFlow.value.geometricVolumetricFlowCm3S, unit: 'cm3/s' },
    injectionUnitConfigurationId: 'IMM-B/IU-50',
    screwGeometryBasisRef: 'oem-screw-geometry/IU-50-rev-B',
  }).reason,
  'target-volumetric-flow-basis-reference-required',
);

const requiredSpeed = screwSpeedForVolumetricFlow({
  screwDiameter: { value: 50, unit: 'mm' },
  targetVolumetricFlow: { value: screwFlow.value.geometricVolumetricFlowCm3S, unit: 'cm3/s' },
  injectionUnitConfigurationId: 'IMM-B/IU-50',
  screwGeometryBasisRef: 'oem-screw-geometry/IU-50-rev-B',
  targetVolumetricFlowBasisRef: 'controlled-transfer-study/rev-C',
});
assert.equal(requiredSpeed.ok, true);
assert.equal(requiredSpeed.value.targetVolumetricFlowBasisRef, 'controlled-transfer-study/rev-C');
assert.ok(Math.abs(requiredSpeed.value.requiredScrewLinearSpeedMmS - (80 * 40 ** 2 / 50 ** 2)) < 1e-12);
assert.match(requiredSpeed.assumptions.join(' '), /not a released machine velocity setpoint/i);

const transferred = volumetricTransferBetweenScrews({
  sourceScrewDiameter: { value: 40, unit: 'mm' },
  sourceScrewLinearSpeed: { value: 80, unit: 'mm/s' },
  sourceInjectionUnitConfigurationId: 'IMM-A/IU-40',
  sourceScrewGeometryBasisRef: 'oem-screw-geometry/IU-40-rev-A',
  sourceScrewMotionBasisRef: 'actual-screw-trace/source-cycle-142',
  targetScrewDiameter: { value: 50, unit: 'mm' },
  targetInjectionUnitConfigurationId: 'IMM-B/IU-50',
  targetScrewGeometryBasisRef: 'oem-screw-geometry/IU-50-rev-B',
  transferStudyBasisRef: 'controlled-transfer-study/rev-C',
  provenance: 'controlled-transfer-fixture',
});
assert.equal(transferred.ok, true);
assert.equal(transferred.value.sourceScrewGeometryBasisRef, 'oem-screw-geometry/IU-40-rev-A');
assert.equal(transferred.value.sourceScrewMotionBasisRef, 'actual-screw-trace/source-cycle-142');
assert.equal(transferred.value.targetScrewGeometryBasisRef, 'oem-screw-geometry/IU-50-rev-B');
assert.equal(transferred.value.transferStudyBasisRef, 'controlled-transfer-study/rev-C');
assert.ok(Math.abs(transferred.value.targetGeometricScrewLinearSpeedMmS - 51.2) < 1e-12);
assert.ok(Math.abs(transferred.value.speedRatioTargetToSource - 0.64) < 1e-12);
assert.equal(transferred.equationId, 'EQ-MTRANS-004');
assert.match(transferred.assumptions.join(' '), /preserves only the same geometric screw-displacement volumetric rate/i);
assert.match(transferred.assumptions.join(' '), /does not prove equivalent cavity fill/i);

assert.equal(
  volumetricFlowFromScrewMotion({
    screwDiameter: { value: 40, unit: 'mm' },
    screwLinearSpeed: { value: 8, unit: 'Mm/s' },
    injectionUnitConfigurationId: 'IMM-A/IU-40',
    screwGeometryBasisRef: 'oem-screw-geometry/IU-40-rev-A',
    screwMotionBasisRef: 'actual-screw-trace/source-cycle-142',
  }).reason,
  'unsupported-screw-linear-speed-unit',
  'Mm/s must never be silently interpreted as mm/s',
);

assert.equal(
  averageResidenceTimeEstimate({
    meltInventoryMass: { value: 500, unit: 'g' },
    massThroughputRate: { value: 1, unit: 'kg/h' },
  }).reason,
  'missing-injection-unit-configuration-id',
);

const residenceContext = {
  injectionUnitConfigurationId: 'IMM-A/IU-40',
  meltInventoryBasisRef: 'injection-unit-melt-inventory-study/rev-A',
};

assert.equal(
  averageResidenceTimeEstimate({
    ...residenceContext,
    meltInventoryMass: { value: 500, unit: 'g' },
    massThroughputRate: { value: 1, unit: 'kg/h' },
  }).reason,
  'throughput-basis-reference-required',
);

const residence = averageResidenceTimeEstimate({
  ...residenceContext,
  throughputBasisRef: 'production-throughput-history/rev-B',
  meltInventoryMass: { value: 500, unit: 'g' },
  massThroughputRate: { value: 1, unit: 'kg/h' },
});
assert.equal(residence.ok, true);
assert.equal(residence.value.injectionUnitConfigurationId, 'IMM-A/IU-40');
assert.equal(residence.value.meltInventoryBasisRef, 'injection-unit-melt-inventory-study/rev-A');
assert.equal(residence.value.throughputBasisRef, 'production-throughput-history/rev-B');
assert.ok(Math.abs(residence.value.minutes - 30) < 1e-12);
assert.match(residence.assumptions.join(' '), /not a residence-time distribution/i);
assert.match(residence.assumptions.join(' '), /does not establish a safe material residence limit/i);

assert.equal(
  averageResidenceTimeFromShotCycle({
    ...residenceContext,
    meltInventoryMass: { value: 500, unit: 'g' },
    shotMass: { value: 25, unit: 'g' },
    cycleTime: { value: 20, unit: 's' },
    cycleTimeBasisRef: 'cycle-trace/rev-C',
  }).reason,
  'shot-mass-basis-reference-required',
);

const residenceFromShot = averageResidenceTimeFromShotCycle({
  ...residenceContext,
  shotMassBasisRef: 'shot-mass-study/rev-C',
  cycleTimeBasisRef: 'cycle-trace/rev-C',
  meltInventoryMass: { value: 500, unit: 'g' },
  shotMass: { value: 25, unit: 'g' },
  cycleTime: { value: 20, unit: 's' },
});
assert.equal(residenceFromShot.ok, true);
assert.equal(residenceFromShot.value.injectionUnitConfigurationId, 'IMM-A/IU-40');
assert.equal(residenceFromShot.value.seconds, 400);
assert.equal(residenceFromShot.value.shotMassG, 25);
assert.equal(residenceFromShot.value.derivedThroughputGS, 1.25);
assert.equal(residenceFromShot.equationId, 'EQ-RES-002');
assert.match(residenceFromShot.assumptions.join(' '), /not a residence-time distribution/i);

const coolingScale = relativeCoolingTimeScale({
  referenceCoolingTime: { value: 15, unit: 's' },
  referenceThickness: { value: 2, unit: 'mm' },
  targetThickness: { value: 3, unit: 'mm' },
});
assert.equal(coolingScale.ok, true);
assert.equal(coolingScale.value.scalingFactor, 2.25);
assert.equal(coolingScale.value.estimatedTargetCoolingTimeS, 33.75);
assert.match(coolingScale.assumptions.join(' '), /not an absolute cooling-time prediction/i);

const coolingWithDiffusivity = relativeCoolingTimeScale({
  referenceCoolingTime: { value: 15, unit: 's' },
  referenceThickness: { value: 2, unit: 'mm' },
  targetThickness: { value: 3, unit: 'mm' },
  referenceThermalDiffusivity: { value: 0.1, unit: 'mm²/s' },
  targetThermalDiffusivity: { value: 0.08, unit: 'mm2/s' },
});
assert.equal(coolingWithDiffusivity.ok, true);
assert.ok(Math.abs(coolingWithDiffusivity.value.estimatedTargetCoolingTimeS - 42.1875) < 1e-12);
assert.equal(
  relativeCoolingTimeScale({
    referenceCoolingTime: { value: 15, unit: 's' },
    referenceThickness: { value: 2, unit: 'mm' },
    targetThickness: { value: 3, unit: 'mm' },
    referenceThermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
  }).reason,
  'both-diffusivities-required',
);

assert.equal(
  relativeCoolingTimeScale({
    referenceCoolingTime: { value: 15, unit: 's' },
    referenceThickness: { value: 2, unit: 'mm' },
    targetThickness: { value: 3, unit: 'mm' },
    referenceThermalDiffusivity: { value: 0.1, unit: 'Mm2/s' },
    targetThermalDiffusivity: { value: 0.08, unit: 'mm2/s' },
  }).reason,
  'unsupported-reference-thermal-diffusivity-unit',
  'Mm2/s must never be silently interpreted as mm2/s',
);



const amorphousCoolingContext = {
  materialGradeId: 'ABS-grade-X',
  materialMorphology: 'amorphous',
  materialMorphologyRef: 'supplier-grade-morphology/rev-A',
  thermalModelBasisRef: 'PIGNON-2018-COOLING-ANALYTICAL',
};

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
    thermalModelBasisRef: 'PIGNON-2018-COOLING-ANALYTICAL',
  }).reason,
  'missing-material-grade-id',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    materialGradeId: 'ABS-grade-X',
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
    thermalModelBasisRef: 'PIGNON-2018-COOLING-ANALYTICAL',
  }).reason,
  'material-morphology-reference-required',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    materialGradeId: 'ABS-grade-X',
    materialMorphology: 'amorphous',
    materialMorphologyRef: 'supplier-grade-morphology/rev-A',
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'thermal-model-basis-reference-required',
);

const amorphousCooling = amorphousSlabCoolingTimeEstimate({
  ...amorphousCoolingContext,
  partThickness: { value: 3, unit: 'mm' },
  thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
  meltTemperature: { value: 230, unit: '°C' },
  mouldSurfaceTemperature: { value: 60, unit: '°C' },
  ejectionTemperature: { value: 90, unit: '°C' },
  ejectionCriterionType: 'centerline-temperature',
  thermalDiffusivityRef: 'grade-property-dataset/rev-4',
  ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
  mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  provenance: 'thermal-screen-fixture',
});
assert.equal(amorphousCooling.ok, true);
assert.ok(Math.abs(amorphousCooling.value.coolingTimeS - 18.020468757556586) < 1e-12);
assert.equal(amorphousCooling.equationId, 'EQ-THERM-002');
assert.equal(amorphousCooling.value.materialMorphology, 'amorphous');
assert.equal(amorphousCooling.value.materialGradeId, 'ABS-grade-X');
assert.equal(amorphousCooling.value.materialMorphologyRef, 'supplier-grade-morphology/rev-A');
assert.equal(amorphousCooling.value.thermalModelBasisRef, 'PIGNON-2018-COOLING-ANALYTICAL');
assert.equal(amorphousCooling.value.temperatureCriterion, 'centerline-first-term-plane-wall');
assert.match(amorphousCooling.assumptions.join(' '), /semi-crystalline solidification\/crystallisation requires a phase-change treatment/i);
assert.match(amorphousCooling.assumptions.join(' '), /not a guaranteed cycle-time setting/i);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    ...amorphousCoolingContext,
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'semi-crystalline',
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'semi-crystalline-requires-phase-change-model',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    ...amorphousCoolingContext,
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 100, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'invalid-thermal-temperature-order',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    ...amorphousCoolingContext,
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: -100, unit: '°C' },
    mouldSurfaceTemperature: { value: -300, unit: '°C' },
    ejectionTemperature: { value: -200, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'centerline-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'invalid-mould-surface-temperature-value',
  'temperatures below absolute zero must fail before thermal arithmetic',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    ...amorphousCoolingContext,
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'centerline-temperature',
    ejectionCriterionRef: 'validated-part-ejection-study/rev-2',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'thermal-diffusivity-reference-required',
);

assert.equal(
  amorphousSlabCoolingTimeEstimate({
    ...amorphousCoolingContext,
    partThickness: { value: 3, unit: 'mm' },
    thermalDiffusivity: { value: 0.1, unit: 'mm2/s' },
    meltTemperature: { value: 230, unit: '°C' },
    mouldSurfaceTemperature: { value: 60, unit: '°C' },
    ejectionTemperature: { value: 90, unit: '°C' },
    materialMorphology: 'amorphous',
    ejectionCriterionType: 'mean-temperature',
    thermalDiffusivityRef: 'grade-property-dataset/rev-4',
    ejectionCriterionRef: 'mean-temperature-study/rev-1',
    mouldSurfaceTemperatureBasisRef: 'instrumented-mould/trial-18',
  }).reason,
  'centerline-ejection-criterion-required',
);

const shrinkageContext = {
  materialGradeId: 'PA66-GF30-grade-X',
  shrinkageDirection: 'flow-direction',
  directionBasisRef: 'mould-flow-axis/drawing-rev-C',
  shrinkageBasisRef: 'supplier-grade-shrinkage-data/rev-A',
  conditioningBasisRef: 'dimensional-conditioning-protocol/rev-B',
};

assert.equal(
  linearShrinkageCompensationRange({
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 1, unit: '%' },
    upperShrinkage: { value: 2, unit: '%' },
  }).reason,
  'missing-material-grade-id',
);
assert.equal(
  linearShrinkageCompensationRange({
    ...shrinkageContext,
    shrinkageDirection: '',
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 1, unit: '%' },
    upperShrinkage: { value: 2, unit: '%' },
  }).reason,
  'shrinkage-direction-required',
);
assert.equal(
  linearShrinkageCompensationRange({
    ...shrinkageContext,
    shrinkageBasisRef: '',
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 1, unit: '%' },
    upperShrinkage: { value: 2, unit: '%' },
  }).reason,
  'shrinkage-basis-reference-required',
);
assert.equal(
  linearShrinkageCompensationRange({
    ...shrinkageContext,
    conditioningBasisRef: '',
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 1, unit: '%' },
    upperShrinkage: { value: 2, unit: '%' },
  }).reason,
  'conditioning-basis-reference-required',
);

const shrinkageRange = linearShrinkageCompensationRange({
  ...shrinkageContext,
  targetPartDimension: { value: 100, unit: 'mm' },
  lowerShrinkage: { value: 1, unit: '%' },
  upperShrinkage: { value: 2, unit: '%' },
  provenance: 'supplier-grade-sheet-rev-A',
});
assert.equal(shrinkageRange.ok, true);
assert.equal(shrinkageRange.value.materialGradeId, 'PA66-GF30-grade-X');
assert.equal(shrinkageRange.value.shrinkageDirection, 'flow-direction');
assert.equal(shrinkageRange.value.directionBasisRef, 'mould-flow-axis/drawing-rev-C');
assert.equal(shrinkageRange.value.shrinkageBasisRef, 'supplier-grade-shrinkage-data/rev-A');
assert.equal(shrinkageRange.value.conditioningBasisRef, 'dimensional-conditioning-protocol/rev-B');
assert.ok(Math.abs(shrinkageRange.value.lowerStartingMouldDimensionMm - (100 / 0.99)) < 1e-12);
assert.ok(Math.abs(shrinkageRange.value.upperStartingMouldDimensionMm - (100 / 0.98)) < 1e-12);
assert.equal(shrinkageRange.equationId, 'EQ-SHR-001');
assert.match(shrinkageRange.assumptions.join(' '), /does not supply a generic polymer shrinkage constant/i);
assert.match(shrinkageRange.assumptions.join(' '), /not treated as interchangeable/i);
assert.match(shrinkageRange.assumptions.join(' '), /not a released tool dimension/i);
assert.equal(
  linearShrinkageCompensationRange({
    ...shrinkageContext,
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 2, unit: '%' },
    upperShrinkage: { value: 1, unit: '%' },
  }).reason,
  'shrinkage-range-reversed',
);


const moisturePass = materialMoistureAcceptance({
  materialGradeId: 'PA66-GF30-grade-X',
  sampleId: 'lot-24/sample-3',
  measuredMoisture: { value: 850, unit: 'ppm' },
  maximumAllowedMoisture: { value: 0.10, unit: '%' },
  measurementUncertainty: { value: 50, unit: 'ppm' },
  moistureBasis: 'mass-fraction',
  measurementMethodRef: 'ISO-15512-lab-method/run-24',
  supplierRequirementRef: 'supplier-grade-guide/rev-7/moisture-limit',
  provenance: 'incoming-material-lab',
});
assert.equal(moisturePass.ok, true);
assert.equal(moisturePass.value.state, 'PASS');
assert.ok(Math.abs(moisturePass.value.upperMeasurementBoundFraction - 0.0009) < 1e-12);
assert.ok(Math.abs(moisturePass.value.maximumAllowedFraction - 0.001) < 1e-12);
assert.equal(moisturePass.equationId, 'EQ-MAT-001');
assert.match(moisturePass.assumptions.join(' '), /does not prescribe dryer temperature/i);

const moistureFail = materialMoistureAcceptance({
  materialGradeId: 'PA66-GF30-grade-X',
  sampleId: 'lot-24/sample-4',
  measuredMoisture: { value: 1250, unit: 'ppm' },
  maximumAllowedMoisture: { value: 1000, unit: 'ppm' },
  measurementUncertainty: { value: 100, unit: 'ppm' },
  measurementMethodRef: 'ISO-15512-lab-method/run-25',
  supplierRequirementRef: 'supplier-grade-guide/rev-7/moisture-limit',
});
assert.equal(moistureFail.ok, true);
assert.equal(moistureFail.value.state, 'FAIL');
assert.ok(moistureFail.value.lowerMeasurementBoundFraction > moistureFail.value.maximumAllowedFraction);

const moistureIndeterminate = materialMoistureAcceptance({
  materialGradeId: 'PA66-GF30-grade-X',
  sampleId: 'lot-24/sample-5',
  measuredMoisture: { value: 950, unit: 'ppm' },
  maximumAllowedMoisture: { value: 1000, unit: 'ppm' },
  measurementUncertainty: { value: 100, unit: 'ppm' },
  measurementMethodRef: 'ISO-15512-lab-method/run-26',
  supplierRequirementRef: 'supplier-grade-guide/rev-7/moisture-limit',
});
assert.equal(moistureIndeterminate.ok, true);
assert.equal(moistureIndeterminate.value.state, 'INDETERMINATE');
assert.ok(moistureIndeterminate.value.lowerMeasurementBoundFraction < moistureIndeterminate.value.maximumAllowedFraction);
assert.ok(moistureIndeterminate.value.upperMeasurementBoundFraction > moistureIndeterminate.value.maximumAllowedFraction);

assert.equal(
  materialMoistureAcceptance({
    materialGradeId: 'PA66-GF30-grade-X',
    sampleId: 'lot-24/sample-6',
    measuredMoisture: { value: 900, unit: 'ppm' },
    maximumAllowedMoisture: { value: 1000, unit: 'ppm' },
    measurementUncertainty: { value: 50, unit: 'ppm' },
    measurementMethodRef: 'ISO-15512-lab-method/run-27',
  }).reason,
  'supplier-requirement-required',
);

assert.equal(
  materialMoistureAcceptance({
    materialGradeId: 'PA66-GF30-grade-X',
    sampleId: 'lot-24/sample-7',
    measuredMoisture: { value: 900, unit: 'PPM' },
    maximumAllowedMoisture: { value: 1000, unit: 'ppm' },
    measurementUncertainty: { value: 50, unit: 'ppm' },
    measurementMethodRef: 'ISO-15512-lab-method/run-28',
    supplierRequirementRef: 'supplier-grade-guide/rev-7/moisture-limit',
  }).reason,
  'unsupported-measured-moisture-unit',
  'moisture units must use the governed canonical spelling rather than guessed case',
);

const gateStudyContext = {
  materialGradeId: 'PA66-GF30-grade-X',
  mouldConfigurationId: 'MOULD-142/rev-C',
  gateId: 'gate-A',
  massMeasurementScopeId: 'single-part-after-standard-conditioning',
  thermalStateRef: 'validated-mould-thermal-state/trial-18',
  measurementSystemBasisRef: 'balance-msa/rev-B',
  studyBasisRef: 'gate-seal-study/protocol-rev-C',
  plateauToleranceBasisRef: 'mass-repeatability-decision-rule/rev-A',
};

assert.equal(
  gateSealPlateauAssessment({
    plateauToleranceMass: { value: 0.03, unit: 'g' },
    points: [],
  }).reason,
  'missing-material-grade-id',
);

const gateStudy = gateSealPlateauAssessment({
  ...gateStudyContext,
  plateauToleranceMass: { value: 0.03, unit: 'g' },
  points: [
    {
      holdTime: { value: 2, unit: 's' },
      partMasses: [{ value: 40.00, unit: 'g' }, { value: 40.02, unit: 'g' }],
      replicateIds: ['h2-r1', 'h2-r2'],
    },
    {
      holdTime: { value: 4, unit: 's' },
      partMasses: [{ value: 40.50, unit: 'g' }, { value: 40.52, unit: 'g' }],
      replicateIds: ['h4-r1', 'h4-r2'],
    },
    {
      holdTime: { value: 6, unit: 's' },
      partMasses: [{ value: 40.70, unit: 'g' }, { value: 40.72, unit: 'g' }],
      replicateIds: ['h6-r1', 'h6-r2'],
    },
    {
      holdTime: { value: 8, unit: 's' },
      partMasses: [{ value: 40.71, unit: 'g' }, { value: 40.72, unit: 'g' }],
      replicateIds: ['h8-r1', 'h8-r2'],
    },
    {
      holdTime: { value: 10, unit: 's' },
      partMasses: [{ value: 40.72, unit: 'g' }, { value: 40.71, unit: 'g' }],
      replicateIds: ['h10-r1', 'h10-r2'],
    },
  ],
});
assert.equal(gateStudy.ok, true);
assert.equal(gateStudy.value.materialGradeId, 'PA66-GF30-grade-X');
assert.equal(gateStudy.value.mouldConfigurationId, 'MOULD-142/rev-C');
assert.equal(gateStudy.value.gateId, 'gate-A');
assert.equal(gateStudy.value.massMeasurementScopeId, 'single-part-after-standard-conditioning');
assert.equal(gateStudy.value.conclusion, 'plateau-consistent-with-entered-tolerance');
assert.equal(gateStudy.value.plateau.earliestConsistentHoldTimeS, 6);
assert.equal(gateStudy.value.plateau.consecutivePointCount, 3);
assert.match(gateStudy.assumptions.join(' '), /not universal proof of an exact physical gate-freeze instant/i);

const noGatePlateau = gateSealPlateauAssessment({
  ...gateStudyContext,
  studyBasisRef: 'gate-seal-study/no-plateau-fixture',
  plateauToleranceMass: { value: 0.001, unit: 'g' },
  points: [
    {
      holdTime: { value: 2, unit: 's' },
      partMasses: [{ value: 40.00, unit: 'g' }, { value: 40.01, unit: 'g' }],
      replicateIds: ['np-h2-r1', 'np-h2-r2'],
    },
    {
      holdTime: { value: 4, unit: 's' },
      partMasses: [{ value: 40.20, unit: 'g' }, { value: 40.21, unit: 'g' }],
      replicateIds: ['np-h4-r1', 'np-h4-r2'],
    },
    {
      holdTime: { value: 6, unit: 's' },
      partMasses: [{ value: 40.30, unit: 'g' }, { value: 40.31, unit: 'g' }],
      replicateIds: ['np-h6-r1', 'np-h6-r2'],
    },
  ],
});
assert.equal(noGatePlateau.ok, true);
assert.equal(noGatePlateau.value.conclusion, 'no-plateau-within-entered-range');
assert.equal(noGatePlateau.value.plateau, null);

assert.equal(
  gateSealPlateauAssessment({
    ...gateStudyContext,
    plateauToleranceMass: { value: 0.02, unit: 'g' },
    points: [
      {
        holdTime: { value: 2, unit: 's' },
        partMasses: [{ value: 40, unit: 'g' }],
        replicateIds: ['short-h2-r1'],
      },
      {
        holdTime: { value: 4, unit: 's' },
        partMasses: [{ value: 40.2, unit: 'g' }, { value: 40.21, unit: 'g' }],
        replicateIds: ['short-h4-r1', 'short-h4-r2'],
      },
      {
        holdTime: { value: 6, unit: 's' },
        partMasses: [{ value: 40.3, unit: 'g' }, { value: 40.31, unit: 'g' }],
        replicateIds: ['short-h6-r1', 'short-h6-r2'],
      },
    ],
  }).reason,
  'insufficient-replicates',
);

assert.equal(
  gateSealPlateauAssessment({
    ...gateStudyContext,
    plateauToleranceMass: { value: 0.02, unit: 'g' },
    points: [
      {
        holdTime: { value: 2, unit: 's' },
        partMasses: [{ value: 40.0, unit: 'g' }, { value: 40.01, unit: 'g' }],
      },
      {
        holdTime: { value: 4, unit: 's' },
        partMasses: [{ value: 40.2, unit: 'g' }, { value: 40.21, unit: 'g' }],
        replicateIds: ['align-h4-r1', 'align-h4-r2'],
      },
      {
        holdTime: { value: 6, unit: 's' },
        partMasses: [{ value: 40.3, unit: 'g' }, { value: 40.31, unit: 'g' }],
        replicateIds: ['align-h6-r1', 'align-h6-r2'],
      },
    ],
  }).reason,
  'replicate-id-alignment-required',
);

const calculationRegistry = JSON.parse(
  fs.readFileSync(new URL('./data/engineering-calculation-registry-v1.json', import.meta.url), 'utf8'),
);
assert.equal(calculationRegistry.status, 'advisory-only');
assert.match(calculationRegistry.unitPolicy, /mPa != MPa/);
assert.match(calculationRegistry.unitPolicy, /Mg != mg/);
const registeredIds = new Set(calculationRegistry.entries.map(entry => entry.id));
for (const equationId of Object.values(ENGINEERING_EQUATION_IDS)) {
  assert.ok(registeredIds.has(equationId), `engineering calculation registry is missing ${equationId}`);
}
assert.equal(registeredIds.size, Object.values(ENGINEERING_EQUATION_IDS).length);
for (const entry of calculationRegistry.entries) {
  assert.ok(entry.scope, `engineering calculation ${entry.id} is missing scope`);
  assert.ok(entry.uncertaintyBoundary, `engineering calculation ${entry.id} is missing uncertainty boundary`);
  assert.ok(Array.isArray(entry.evidenceAnchors) && entry.evidenceAnchors.length > 0, `engineering calculation ${entry.id} is missing evidence anchors`);
  for (const anchor of entry.evidenceAnchors) {
    assert.ok(!/^10\.\d{4,9}\//i.test(anchor), `engineering calculation ${entry.id} uses a raw DOI as an evidence ID: ${anchor}`);
  }
}

assert.ok(calculationRegistry.evidenceResolution, 'engineering calculation registry is missing evidence-resolution contract');
assert.ok(Array.isArray(calculationRegistry.evidenceResolution.governedJsonSources), 'governed evidence source list is missing');
assert.ok(Array.isArray(calculationRegistry.engineeringEvidenceSupplements), 'engineering evidence supplements must be an array');

const resolvedEngineeringEvidence = new Map();
for (const sourceSpec of calculationRegistry.evidenceResolution.governedJsonSources) {
  const sourceDoc = JSON.parse(
    fs.readFileSync(new URL(`./${sourceSpec.path}`, import.meta.url), 'utf8'),
  );
  const records = sourceDoc?.[sourceSpec.collection];
  assert.ok(Array.isArray(records), `engineering evidence collection ${sourceSpec.collection} missing from ${sourceSpec.path}`);
  for (const record of records) {
    if (!record?.id) continue;
    const existing = resolvedEngineeringEvidence.get(record.id);
    if (existing) {
      assert.equal(
        existing.url,
        record.url,
        `governed evidence ID ${record.id} resolves to conflicting URLs in ${existing.__sourcePath} and ${sourceSpec.path}`,
      );
      continue;
    }
    resolvedEngineeringEvidence.set(record.id, { ...record, __sourcePath: sourceSpec.path });
  }
}

for (const record of calculationRegistry.engineeringEvidenceSupplements) {
  assert.ok(record?.id, 'engineering evidence supplement is missing id');
  assert.ok(!resolvedEngineeringEvidence.has(record.id), `engineering evidence supplement duplicates governed source ID ${record.id}`);
  assert.match(String(record.type || ''), /peer-reviewed/i, `engineering evidence supplement ${record.id} must be peer-reviewed`);
  assert.match(String(record.url || ''), /^https:\/\/doi\.org\//i, `engineering evidence supplement ${record.id} must use a canonical DOI URL`);
  assert.match(String(record.checked || ''), /^20\d\d-\d\d-\d\d$/, `engineering evidence supplement ${record.id} must carry a checked date`);
  assert.ok(String(record.scope || '').trim(), `engineering evidence supplement ${record.id} is missing scope`);
  resolvedEngineeringEvidence.set(record.id, { ...record, __sourcePath: 'engineering-calculation-registry-v1.json#engineeringEvidenceSupplements' });
}

const canonicalSourceSpec = calculationRegistry.evidenceResolution.canonicalAcademicUrlSource;
assert.ok(canonicalSourceSpec?.path && canonicalSourceSpec?.collection, 'canonical academic URL source contract is incomplete');
const canonicalSourceDoc = JSON.parse(
  fs.readFileSync(new URL(`./${canonicalSourceSpec.path}`, import.meta.url), 'utf8'),
);
const canonicalAcademicUrls = canonicalSourceDoc?.[canonicalSourceSpec.collection] || {};
assert.equal(typeof canonicalAcademicUrls, 'object');

for (const [id, canonicalUrl] of Object.entries(canonicalAcademicUrls)) {
  const record = resolvedEngineeringEvidence.get(id);
  if (record) resolvedEngineeringEvidence.set(id, { ...record, url: canonicalUrl, canonicalUrlApplied: true });
}

const unresolvedEvidence = [];
for (const entry of calculationRegistry.entries) {
  for (const anchor of entry.evidenceAnchors) {
    const record = resolvedEngineeringEvidence.get(anchor);
    if (!record) {
      unresolvedEvidence.push({ calculationId: entry.id, anchor });
      continue;
    }
    assert.ok(String(record.title || record.name || '').trim(), `engineering evidence ${anchor} is missing title/name`);
    assert.match(String(record.url || ''), /^https:\/\//, `engineering evidence ${anchor} does not resolve to an HTTPS URL`);
  }
}
assert.deepEqual(unresolvedEvidence, [], `engineering calculation evidence contains unresolved anchors: ${JSON.stringify(unresolvedEvidence)}`);

assert.match(calculationRegistry.evidenceResolution.rule, /Every evidenceAnchors ID must resolve/i);
assert.match(calculationRegistry.authorityBoundary, /No calculation.*production recipe.*machine-control/i);

assert.deepEqual(ENGINEERING_DOMAIN_BOUNDARY.dependenciesAllowed, ['plain JavaScript data']);
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('DOM'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('IndexedDB'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('machine control'));
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.productionAuthority, 'none');
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.universalSetpoints, false);

console.log('MouldMaster injection-moulding engineering domain QA passed');
