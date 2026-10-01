import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  clampSeparatingForce,
  clampSeparatingForceRange,
  aggregateShotMass,
  pressureValue,
  shotCapacityAssessment,
  clampCapacityAssessment,
  specificPlasticPressureCapacityAssessment,
  volumetricFlowCapacityAssessment,
  plasticisingThroughputAssessment,
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
assert.equal(flowCapacity.value.utilisationPct, 80);
assert.ok(Math.abs(flowCapacity.value.capacityMarginCm3S - 50) < 1e-12);

const plasticisingCapacity = plasticisingThroughputAssessment({
  requiredMassRate: { value: 18, unit: 'kg/h' },
  availablePlasticisingRate: { value: 30, unit: 'kg/h' },
});
assert.equal(plasticisingCapacity.ok, true);
assert.equal(plasticisingCapacity.value.requiredGS, 5);
assert.ok(Math.abs(plasticisingCapacity.value.availableGS - (30 * 1000 / 3600)) < 1e-12);
assert.equal(plasticisingCapacity.value.utilisationPct, 60);
assert.match(plasticisingCapacity.assumptions.join(' '), /Nominal catalogue plasticising rate is not assumed/i);

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
