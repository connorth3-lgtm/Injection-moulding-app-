import assert from 'node:assert/strict';
import {
  finiteNumber,
  numericSummary,
  referenceScale,
  normalizedReferenceShift,
  symmetricGroupSeparation,
  cavitySpecificSummary,
  capabilityIndices,
  energyPerGoodPart,
  PROCESS_STATISTICS_BOUNDARY,
} from './src/domains/process/process-statistics.mjs';

assert.equal(finiteNumber(''), null);
assert.equal(finiteNumber('   '), null);
assert.equal(finiteNumber(null), null);
assert.equal(finiteNumber(undefined), null);
assert.equal(finiteNumber('not-a-number'), null);
assert.equal(finiteNumber(Infinity), null);
assert.equal(finiteNumber(0), 0);
assert.equal(finiteNumber('0'), 0);

const summary = numericSummary(['', 0, '1', 2, null]);
assert.deepEqual({ n: summary.n, min: summary.min, max: summary.max, mean: summary.mean }, { n: 3, min: 0, max: 2, mean: 1 });

assert.equal(referenceScale(numericSummary([5])), null);
assert.equal(referenceScale(numericSummary([5, 5, 5])), null);
assert.ok(referenceScale(numericSummary([4, 5, 6])) > 0);

const onePoint = normalizedReferenceShift([5], [6]);
assert.equal(onePoint.score, null);
assert.equal(onePoint.reason, 'insufficient-reference-sample');

const constant = normalizedReferenceShift([5, 5, 5], [6, 6, 6]);
assert.equal(constant.score, null);
assert.equal(constant.reason, 'unestimable-reference-spread');

const validShift = normalizedReferenceShift([4, 5, 6], [6, 7, 8]);
assert.ok(Number.isFinite(validShift.score));
assert.ok(validShift.score > 0);

const underpoweredGroups = symmetricGroupSeparation([1, 2], [3, 4]);
assert.equal(underpoweredGroups.score, null);
assert.equal(underpoweredGroups.reason, 'insufficient-group-support');

const zeroSpreadGroups = symmetricGroupSeparation([1, 1, 1], [2, 2, 2]);
assert.equal(zeroSpreadGroups.score, null);
assert.equal(zeroSpreadGroups.reason, 'zero-group-spread');

const separation = symmetricGroupSeparation([1, 2, 3], [2, 3, 4]);
assert.ok(Number.isFinite(separation.score));
assert.equal(separation.metric, 'symmetric-unweighted-rms-group-spread-separation');



const cavitySummary = cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-stabilised-run/cavity-labelled-parts',
  samplingBasisRef: 'cavity-labelled-sampling-plan-rev-A',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'part-mass-msa-rev-A',
  minimumPerCavity: 3,
  cavities: [
    { cavityId: 'C1', values: [10.00, 10.02, 9.98] },
    { cavityId: 'C2', values: [10.10, 10.12, 10.08] },
    { cavityId: 'C3', values: [9.95, 9.96, 9.94] },
  ],
});
assert.equal(cavitySummary.reason, null);
assert.equal(cavitySummary.result.cavityCount, 3);
assert.equal(cavitySummary.result.samplingBasisRef, 'cavity-labelled-sampling-plan-rev-A');
assert.equal(cavitySummary.result.measurementSystemBasisRef, 'part-mass-msa-rev-A');
assert.equal(cavitySummary.result.minimumMeanCavityId, 'C3');
assert.equal(cavitySummary.result.maximumMeanCavityId, 'C2');
assert.ok(Math.abs(cavitySummary.result.rangeOfCavityMeans - 0.15) < 1e-12);
assert.ok(Number.isFinite(cavitySummary.result.relativeRangePct));
assert.match(cavitySummary.assumptions.join(' '), /not a universal balance acceptance decision/i);
assert.match(cavitySummary.assumptions.join(' '), /Cavity identity is preserved/i);

assert.equal(cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-run',
  samplingBasisRef: 'sampling-plan-A',
  measurementSystemAdequate: false,
  cavities: [
    { cavityId: 'C1', values: [10, 10, 10] },
    { cavityId: 'C2', values: [10, 10, 10] },
  ],
}).reason, 'measurement-system-not-confirmed');

assert.equal(cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-run',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'msa-A',
  cavities: [
    { cavityId: 'C1', values: [10, 10, 10] },
    { cavityId: 'C2', values: [10, 10, 10] },
  ],
}).reason, 'sampling-basis-reference-required');

assert.equal(cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-run',
  samplingBasisRef: 'sampling-plan-A',
  measurementSystemAdequate: true,
  cavities: [
    { cavityId: 'C1', values: [10, 10, 10] },
    { cavityId: 'C2', values: [10, 10, 10] },
  ],
}).reason, 'measurement-system-basis-required');

assert.equal(cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-run',
  samplingBasisRef: 'sampling-plan-A',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'msa-A',
  cavities: [
    { cavityId: 'C1', values: [10, 10, 10] },
    { cavityId: 'C1', values: [10, 10, 10] },
  ],
}).reason, 'duplicate-cavity-id');

assert.equal(cavitySpecificSummary({
  measurementUnit: 'g',
  samplingBasis: 'same-run',
  samplingBasisRef: 'sampling-plan-A',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'msa-A',
  minimumPerCavity: 3,
  cavities: [
    { cavityId: 'C1', values: [10, 10] },
    { cavityId: 'C2', values: [10, 10, 10] },
  ],
}).reason, 'insufficient-cavity-support');

const blockedCapability = capabilityIndices({
  meanValue: 10.08,
  spreadValue: 0.04,
  lowerSpecLimit: 9.8,
  upperSpecLimit: 10.2,
  spreadBasis: 'within-subgroup',
});
assert.equal(blockedCapability.indices, null);
assert.equal(blockedCapability.reason, 'capability-prerequisites-unmet');
for (const blocker of ['process-stability', 'measurement-system', 'sampling-adequacy', 'distribution-model', 'spread-estimator', 'measurement-unit', 'specification-basis']) {
  assert.ok(blockedCapability.blockers.includes(blocker), `missing capability blocker ${blocker}`);
}

const bareTrueCapability = capabilityIndices({
  meanValue: 10.08,
  spreadValue: 0.04,
  lowerSpecLimit: 9.8,
  upperSpecLimit: 10.2,
  spreadBasis: 'within-subgroup',
  spreadEstimatorRef: 'pooled-within-subgroup-sigma-fixture',
  measurementUnit: 'mm',
  processStable: true,
  measurementSystemAdequate: true,
  samplingAdequacyConfirmed: true,
  distributionModelAdequate: true,
  specificationBasisRef: 'synthetic-drawing-rev-A',
});
assert.equal(bareTrueCapability.indices, null);
assert.equal(bareTrueCapability.reason, 'capability-prerequisites-unmet');
for (const blocker of ['process-stability-basis', 'measurement-system-basis', 'sampling-adequacy-basis', 'distribution-model-basis']) {
  assert.ok(bareTrueCapability.blockers.includes(blocker), `bare true capability flag missing evidence-basis blocker ${blocker}`);
}

const cpCpk = capabilityIndices({
  meanValue: 10.08,
  spreadValue: 0.04,
  lowerSpecLimit: 9.8,
  upperSpecLimit: 10.2,
  spreadBasis: 'within-subgroup',
  spreadEstimatorRef: 'pooled-within-subgroup-sigma-fixture',
  measurementUnit: 'mm',
  processStable: true,
  processStabilityBasisRef: 'control-chart-stability-study-rev-A',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'msa-study-rev-A',
  samplingAdequacyConfirmed: true,
  samplingAdequacyBasisRef: 'sampling-plan-rev-A',
  distributionModelAdequate: true,
  distributionModelBasisRef: 'distribution-check-rev-A',
  specificationBasisRef: 'synthetic-drawing-rev-A',
});
assert.equal(cpCpk.reason, null);
assert.ok(Math.abs(cpCpk.indices.Cp - (0.4 / 0.24)) < 1e-12);
assert.ok(Math.abs(cpCpk.indices.Cpk - 1) < 1e-12);
assert.ok(Math.abs(cpCpk.indices.Cpu - 1) < 1e-12);
assert.ok(Math.abs(cpCpk.indices.Cpl - (0.28 / 0.12)) < 1e-12);
assert.equal(cpCpk.family.potential, 'Cp');
assert.equal(cpCpk.inputs.processStabilityBasisRef, 'control-chart-stability-study-rev-A');
assert.equal(cpCpk.inputs.measurementSystemBasisRef, 'msa-study-rev-A');
assert.equal(cpCpk.inputs.samplingAdequacyBasisRef, 'sampling-plan-rev-A');
assert.equal(cpCpk.inputs.distributionModelBasisRef, 'distribution-check-rev-A');
assert.match(cpCpk.assumptions.join(' '), /does not grade capability against a universal acceptance threshold/i);

const ppPpk = capabilityIndices({
  meanValue: 10.08,
  spreadValue: 0.05,
  lowerSpecLimit: 9.8,
  upperSpecLimit: 10.2,
  spreadBasis: 'overall-long-term',
  spreadEstimatorRef: 'overall-sample-sd-fixture',
  measurementUnit: 'mm',
  processStable: true,
  processStabilityBasisRef: 'control-chart-stability-study-rev-A',
  measurementSystemAdequate: true,
  measurementSystemBasisRef: 'msa-study-rev-A',
  samplingAdequacyConfirmed: true,
  samplingAdequacyBasisRef: 'sampling-plan-rev-A',
  distributionModelAdequate: true,
  distributionModelBasisRef: 'distribution-check-rev-A',
  specificationBasisRef: 'synthetic-drawing-rev-A',
});
assert.equal(ppPpk.reason, null);
assert.ok('Pp' in ppPpk.indices);
assert.ok('Ppk' in ppPpk.indices);
assert.ok(!('Cp' in ppPpk.indices));
assert.equal(ppPpk.family.centeringAdjusted, 'Ppk');

assert.equal(capabilityIndices({
  meanValue: 10,
  spreadValue: 0.04,
  lowerSpecLimit: 10.2,
  upperSpecLimit: 9.8,
  spreadBasis: 'within-subgroup',
}).reason, 'invalid-specification-order');

assert.equal(capabilityIndices({
  meanValue: 10,
  spreadValue: 0.04,
  lowerSpecLimit: 9.8,
  upperSpecLimit: 10.2,
  spreadBasis: 'unlabelled-sd',
  spreadEstimatorRef: 'some-estimator',
  measurementUnit: 'mm',
}).reason, 'spread-basis-required');

const incompleteEnergy = energyPerGoodPart([
  { energy: 0.5, quality: 1 },
  { energy: '', quality: 1 },
], { energyKey: 'energy', qualityKey: 'quality', unit: 'kWh', samplingBasis: 'per-cycle' });
assert.equal(incompleteEnergy.valueKwh, null);
assert.equal(incompleteEnergy.reason, 'incomplete-aligned-coverage');

const wrongSampling = energyPerGoodPart([
  { energy: 0.5, quality: 1 },
], { energyKey: 'energy', qualityKey: 'quality', unit: 'kWh', samplingBasis: 'trace-sample' });
assert.equal(wrongSampling.valueKwh, null);
assert.equal(wrongSampling.reason, 'energy-not-confirmed-per-cycle');

const validEnergy = energyPerGoodPart([
  { energy: 500, quality: 1 },
  { energy: 500, quality: 0 },
  { energy: 500, quality: 1 },
], { energyKey: 'energy', qualityKey: 'quality', unit: 'Wh', samplingBasis: 'per-cycle' });
assert.equal(validEnergy.reason, null);
assert.equal(validEnergy.totalKwh, 1.5);
assert.equal(validEnergy.goodParts, 2);
assert.equal(validEnergy.valueKwh, 0.75);

assert.equal(PROCESS_STATISTICS_BOUNDARY.machineControl, 'none');
assert.equal(PROCESS_STATISTICS_BOUNDARY.productionAuthority, 'none');
assert.equal(PROCESS_STATISTICS_BOUNDARY.causalProof, false);
assert.equal(PROCESS_STATISTICS_BOUNDARY.universalLimits, false);

console.log('MouldMaster pure process-statistics domain QA passed');
