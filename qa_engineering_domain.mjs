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
  averageResidenceTimeEstimate,
  averageResidenceTimeFromShotCycle,
  relativeCoolingTimeScale,
  linearShrinkageCompensationRange,
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
  shotCapacityAssessment({
    requiredShotMass: { value: 55, unit: 'g' },
    usableMachineShotMass: { value: 100, unit: 'g' },
  }).reason,
  'capacity-basis-unverified',
);
const shotCapacity = shotCapacityAssessment({
  requiredShotMass: { value: 55, unit: 'g' },
  usableMachineShotMass: { value: 0.1, unit: 'kg' },
  capacityBasisVerified: true,
});
assert.equal(shotCapacity.ok, true);
assert.equal(shotCapacity.value.utilisationPct, 55);
assert.equal(shotCapacity.value.capacityMarginG, 45);
assert.equal(shotCapacity.value.exceedsUsableCapacity, false);
assert.match(shotCapacity.assumptions.join(' '), /No universal preferred barrel-utilisation percentage/i);


const clampCapacity = clampCapacityAssessment({
  requiredClampForce: { value: 900, unit: 'kN' },
  availableClampForce: { value: 1.2, unit: 'MN' },
});
assert.equal(clampCapacity.ok, true);
assert.equal(clampCapacity.value.utilisationPct, 75);
assert.equal(clampCapacity.value.capacityMarginKilonewtons, 300);
assert.equal(clampCapacity.value.exceedsAvailableCapacity, false);
assert.match(clampCapacity.assumptions.join(' '), /does not determine an appropriate operating clamp setpoint/i);

assert.equal(
  clampCapacityAssessment({
    requiredClampForce: { value: 900, unit: 'kN' },
    availableClampForce: { value: 1200000, unit: 'mN' },
  }).reason,
  'unsupported-available-clamp-force-unit',
  'mN must never be silently interpreted as MN',
);
assert.equal(
  clampCapacityAssessment({
    requiredClampForce: { value: 900, unit: 'kn' },
    availableClampForce: { value: 1200, unit: 'kN' },
  }).reason,
  'unsupported-required-clamp-force-unit',
  'force units must use canonical SI prefix case',
);

const pressureCapacity = specificPlasticPressureCapacityAssessment({
  requiredPressure: { value: 120, unit: 'MPa' },
  availableMachinePressure: { value: 1500, unit: 'bar' },
});
assert.equal(pressureCapacity.ok, true);
assert.equal(pressureCapacity.value.requiredMegapascals, 120);
assert.equal(pressureCapacity.value.availableMegapascals, 150);
assert.equal(pressureCapacity.value.utilisationPct, 80);
assert.equal(pressureCapacity.value.capacityMarginMegapascals, 30);
assert.match(pressureCapacity.assumptions.join(' '), /hydraulic pressure must not be substituted/i);

const flowCapacity = volumetricFlowCapacityAssessment({
  requiredFlow: { value: 200, unit: 'cm³/s' },
  availableMachineFlow: { value: 15, unit: 'L/min' },
});
assert.equal(flowCapacity.ok, true);
assert.equal(flowCapacity.value.requiredCm3S, 200);
assert.ok(Math.abs(flowCapacity.value.availableCm3S - 250) < 1e-12);
assert.ok(Math.abs(flowCapacity.value.utilisationPct - 80) < 1e-12);
assert.ok(Math.abs(flowCapacity.value.capacityMarginCm3S - 50) < 1e-12);

const plasticisingCapacity = plasticisingThroughputAssessment({
  requiredMassRate: { value: 18, unit: 'kg/h' },
  availablePlasticisingRate: { value: 30, unit: 'kg/h' },
});
assert.equal(plasticisingCapacity.ok, true);
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
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
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
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
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

const suitabilityOnlyUnknown = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic declared-axis fixture',
  requiredAxisIds: ['mould-height', 'unknown-axis'],
  assessments: { 'mould-height': heightFit },
});
assert.equal(suitabilityOnlyUnknown.value.summaryState, 'UNKNOWN');
assert.equal(suitabilityOnlyUnknown.value.coverageComplete, false);

const marginalSummary = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'authorised site threshold fixture',
  requiredAxisIds: ['mould-height', 'site-specific-axis'],
  assessments: {
    'mould-height': heightFit,
    'site-specific-axis': { ok: true, value: { state: 'MARGINAL' }, marginalBasisRef: 'approved-site-machine-fit-rule-rev-3' },
  },
});
assert.equal(marginalSummary.value.summaryState, 'MARGINAL');
assert.match(marginalSummary.assumptions.join(' '), /non-empty marginalBasisRef/i);

const marginalWithoutBasis = machineSuitabilitySummary({
  machineConfigurationId: commonFitIds.machineConfigurationId,
  injectionUnitConfigurationId: 'IU-07/55mm-screw',
  mouldConfigurationId: commonFitIds.mouldConfigurationId,
  basis: 'synthetic declared-axis fixture',
  requiredAxisIds: ['mould-height', 'site-specific-axis'],
  assessments: {
    'mould-height': heightFit,
    'site-specific-axis': { ok: true, value: { state: 'MARGINAL' } },
  },
});
assert.equal(marginalWithoutBasis.value.summaryState, 'UNKNOWN');
assert.equal(
  marginalWithoutBasis.value.axes.find(axis => axis.id === 'site-specific-axis').reason,
  'marginal-basis-required',
);


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

const residence = averageResidenceTimeEstimate({
  meltInventoryMass: { value: 500, unit: 'g' },
  massThroughputRate: { value: 1, unit: 'kg/h' },
});
assert.equal(residence.ok, true);
assert.ok(Math.abs(residence.value.minutes - 30) < 1e-12);
assert.match(residence.assumptions.join(' '), /not a residence-time distribution/i);

const residenceFromShot = averageResidenceTimeFromShotCycle({
  meltInventoryMass: { value: 500, unit: 'g' },
  shotMass: { value: 25, unit: 'g' },
  cycleTime: { value: 20, unit: 's' },
});
assert.equal(residenceFromShot.ok, true);
assert.equal(residenceFromShot.value.seconds, 400);
assert.equal(residenceFromShot.value.shotMassG, 25);
assert.equal(residenceFromShot.equationId, 'EQ-RES-002');

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
  linearShrinkageCompensationRange({
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 1, unit: '%' },
    upperShrinkage: { value: 2, unit: '%' },
  }).reason,
  'shrinkage-range-provenance-required',
);
const shrinkageRange = linearShrinkageCompensationRange({
  targetPartDimension: { value: 100, unit: 'mm' },
  lowerShrinkage: { value: 1, unit: '%' },
  upperShrinkage: { value: 2, unit: '%' },
  provenance: 'supplier-grade-sheet-rev-A',
});
assert.equal(shrinkageRange.ok, true);
assert.ok(Math.abs(shrinkageRange.value.lowerStartingMouldDimensionMm - (100 / 0.99)) < 1e-12);
assert.ok(Math.abs(shrinkageRange.value.upperStartingMouldDimensionMm - (100 / 0.98)) < 1e-12);
assert.equal(shrinkageRange.equationId, 'EQ-SHR-001');
assert.match(shrinkageRange.assumptions.join(' '), /does not supply a generic polymer shrinkage constant/i);
assert.match(shrinkageRange.assumptions.join(' '), /not a released tool dimension/i);
assert.equal(
  linearShrinkageCompensationRange({
    targetPartDimension: { value: 100, unit: 'mm' },
    lowerShrinkage: { value: 2, unit: '%' },
    upperShrinkage: { value: 1, unit: '%' },
    provenance: 'test',
  }).reason,
  'shrinkage-range-reversed',
);

const gateStudy = gateSealPlateauAssessment({
  plateauToleranceMass: { value: 0.03, unit: 'g' },
  points: [
    { holdTime: { value: 2, unit: 's' }, partMasses: [{ value: 40.00, unit: 'g' }, { value: 40.02, unit: 'g' }] },
    { holdTime: { value: 4, unit: 's' }, partMasses: [{ value: 40.50, unit: 'g' }, { value: 40.52, unit: 'g' }] },
    { holdTime: { value: 6, unit: 's' }, partMasses: [{ value: 40.70, unit: 'g' }, { value: 40.72, unit: 'g' }] },
    { holdTime: { value: 8, unit: 's' }, partMasses: [{ value: 40.71, unit: 'g' }, { value: 40.72, unit: 'g' }] },
    { holdTime: { value: 10, unit: 's' }, partMasses: [{ value: 40.72, unit: 'g' }, { value: 40.71, unit: 'g' }] },
  ],
});
assert.equal(gateStudy.ok, true);
assert.equal(gateStudy.value.conclusion, 'plateau-consistent-with-entered-tolerance');
assert.equal(gateStudy.value.plateau.earliestConsistentHoldTimeS, 6);
assert.equal(gateStudy.value.plateau.consecutivePointCount, 3);
assert.match(gateStudy.assumptions.join(' '), /not universal proof of an exact physical gate-freeze instant/i);

const noGatePlateau = gateSealPlateauAssessment({
  plateauToleranceMass: { value: 0.001, unit: 'g' },
  points: [
    { holdTime: { value: 2, unit: 's' }, partMasses: [{ value: 40.00, unit: 'g' }, { value: 40.01, unit: 'g' }] },
    { holdTime: { value: 4, unit: 's' }, partMasses: [{ value: 40.20, unit: 'g' }, { value: 40.21, unit: 'g' }] },
    { holdTime: { value: 6, unit: 's' }, partMasses: [{ value: 40.30, unit: 'g' }, { value: 40.31, unit: 'g' }] },
  ],
});
assert.equal(noGatePlateau.ok, true);
assert.equal(noGatePlateau.value.conclusion, 'no-plateau-within-entered-range');
assert.equal(noGatePlateau.value.plateau, null);
assert.equal(
  gateSealPlateauAssessment({
    plateauToleranceMass: { value: 0.02, unit: 'g' },
    points: [
      { holdTime: { value: 2, unit: 's' }, partMasses: [{ value: 40, unit: 'g' }] },
      { holdTime: { value: 4, unit: 's' }, partMasses: [{ value: 40.2, unit: 'g' }, { value: 40.21, unit: 'g' }] },
      { holdTime: { value: 6, unit: 's' }, partMasses: [{ value: 40.3, unit: 'g' }, { value: 40.31, unit: 'g' }] },
    ],
  }).reason,
  'insufficient-replicates',
);


const calculationRegistry = JSON.parse(
  fs.readFileSync(new URL('./data/engineering-calculation-registry-v1.json', import.meta.url), 'utf8'),
);
assert.equal(calculationRegistry.status, 'advisory-only');
const registeredIds = new Set(calculationRegistry.entries.map(entry => entry.id));
for (const equationId of Object.values(ENGINEERING_EQUATION_IDS)) {
  assert.ok(registeredIds.has(equationId), `engineering calculation registry is missing ${equationId}`);
}
assert.equal(registeredIds.size, Object.values(ENGINEERING_EQUATION_IDS).length);
for (const entry of calculationRegistry.entries) {
  assert.ok(entry.scope, `engineering calculation ${entry.id} is missing scope`);
  assert.ok(entry.uncertaintyBoundary, `engineering calculation ${entry.id} is missing uncertainty boundary`);
  assert.ok(Array.isArray(entry.evidenceAnchors) && entry.evidenceAnchors.length > 0, `engineering calculation ${entry.id} is missing evidence anchors`);
}
assert.match(calculationRegistry.authorityBoundary, /No calculation.*production recipe.*machine-control/i);

assert.deepEqual(ENGINEERING_DOMAIN_BOUNDARY.dependenciesAllowed, ['plain JavaScript data']);
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('DOM'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('IndexedDB'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('machine control'));
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.productionAuthority, 'none');
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.universalSetpoints, false);

console.log('MouldMaster injection-moulding engineering domain QA passed');
