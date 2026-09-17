import assert from 'node:assert/strict';
import {
  finiteNumber,
  numericSummary,
  referenceScale,
  normalizedReferenceShift,
  symmetricGroupSeparation,
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
