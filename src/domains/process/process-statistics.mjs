// MouldMaster pure process-statistics domain primitives.
// No DOM, storage, network, machine-control or production-authority dependencies.

export function finiteNumber(value) {
  if (value == null) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function sampleSd(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function quantile(sortedValues, q) {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
}

export function numericSummary(values) {
  const finite = values.map(finiteNumber).filter(value => value !== null).sort((a, b) => a - b);
  return Object.freeze({
    n: finite.length,
    min: finite[0] ?? null,
    q1: quantile(finite, 0.25),
    median: quantile(finite, 0.5),
    q3: quantile(finite, 0.75),
    max: finite.at(-1) ?? null,
    mean: mean(finite),
    sd: sampleSd(finite),
  });
}

export function referenceScale(summary) {
  if (!summary || Number(summary.n) < 2) return null;
  const sd = finiteNumber(summary.sd);
  const q1 = finiteNumber(summary.q1);
  const q3 = finiteNumber(summary.q3);
  const robust = q1 !== null && q3 !== null ? Math.abs(q3 - q1) / 1.349 : null;
  const candidates = [sd, robust].filter(value => value !== null && value > 0);
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

export function normalizedReferenceShift(referenceValues, currentValues) {
  const reference = numericSummary(referenceValues);
  const current = numericSummary(currentValues);
  if (reference.n < 2) return Object.freeze({ score: null, reason: 'insufficient-reference-sample', reference, current });
  if (current.n < 1) return Object.freeze({ score: null, reason: 'missing-current-sample', reference, current });
  const scale = referenceScale(reference);
  if (scale === null) return Object.freeze({ score: null, reason: 'unestimable-reference-spread', reference, current });
  const score = Math.abs(current.mean - reference.mean) / scale;
  return Object.freeze({ score, reason: null, referenceScale: scale, reference, current });
}

export function symmetricGroupSeparation(leftValues, rightValues, minimumPerGroup = 3) {
  const left = leftValues.map(finiteNumber).filter(value => value !== null);
  const right = rightValues.map(finiteNumber).filter(value => value !== null);
  if (left.length < minimumPerGroup || right.length < minimumPerGroup) {
    return Object.freeze({ score: null, reason: 'insufficient-group-support', leftN: left.length, rightN: right.length });
  }
  const leftSd = sampleSd(left);
  const rightSd = sampleSd(right);
  const spread = Math.sqrt((leftSd ** 2 + rightSd ** 2) / 2);
  if (!(spread > 0)) {
    return Object.freeze({ score: null, reason: 'zero-group-spread', leftN: left.length, rightN: right.length });
  }
  return Object.freeze({
    score: Math.abs(mean(left) - mean(right)) / spread,
    reason: null,
    leftN: left.length,
    rightN: right.length,
    referenceSpread: spread,
    metric: 'symmetric-unweighted-rms-group-spread-separation',
  });
}


export function capabilityIndices({
  meanValue,
  spreadValue,
  lowerSpecLimit,
  upperSpecLimit,
  spreadBasis,
  processStable = false,
  measurementSystemAdequate = false,
  samplingAdequacyConfirmed = false,
  distributionModelAdequate = false,
  specificationBasisRef,
} = {}) {
  const meanValueNumber = finiteNumber(meanValue);
  const spread = finiteNumber(spreadValue);
  const lsl = finiteNumber(lowerSpecLimit);
  const usl = finiteNumber(upperSpecLimit);
  const basis = String(spreadBasis || '').trim().toLowerCase();
  const specRef = String(specificationBasisRef || '').trim();

  if (meanValueNumber === null) return Object.freeze({ indices: null, reason: 'invalid-mean' });
  if (!(spread > 0)) return Object.freeze({ indices: null, reason: 'invalid-spread' });
  if (lsl === null || usl === null) return Object.freeze({ indices: null, reason: 'two-sided-specification-required' });
  if (!(lsl < usl)) return Object.freeze({ indices: null, reason: 'invalid-specification-order' });
  if (!['within-subgroup', 'overall-long-term'].includes(basis)) {
    return Object.freeze({ indices: null, reason: 'spread-basis-required', allowed: Object.freeze(['within-subgroup', 'overall-long-term']) });
  }

  const blockers = [];
  if (processStable !== true) blockers.push('process-stability');
  if (measurementSystemAdequate !== true) blockers.push('measurement-system');
  if (samplingAdequacyConfirmed !== true) blockers.push('sampling-adequacy');
  if (distributionModelAdequate !== true) blockers.push('distribution-model');
  if (!specRef) blockers.push('specification-basis');
  if (blockers.length) {
    return Object.freeze({
      indices: null,
      reason: 'capability-prerequisites-unmet',
      blockers: Object.freeze(blockers),
      spreadBasis: basis,
    });
  }

  const potential = (usl - lsl) / (6 * spread);
  const upper = (usl - meanValueNumber) / (3 * spread);
  const lower = (meanValueNumber - lsl) / (3 * spread);
  const centeringAdjusted = Math.min(upper, lower);
  const family = basis === 'within-subgroup'
    ? Object.freeze({ potential: 'Cp', centeringAdjusted: 'Cpk', upper: 'Cpu', lower: 'Cpl' })
    : Object.freeze({ potential: 'Pp', centeringAdjusted: 'Ppk', upper: 'Ppu', lower: 'Ppl' });

  return Object.freeze({
    indices: Object.freeze({
      [family.potential]: potential,
      [family.centeringAdjusted]: centeringAdjusted,
      [family.upper]: upper,
      [family.lower]: lower,
    }),
    reason: null,
    spreadBasis: basis,
    family,
    inputs: Object.freeze({
      mean: meanValueNumber,
      spread,
      lowerSpecLimit: lsl,
      upperSpecLimit: usl,
      specificationBasisRef: specRef,
    }),
    assumptions: Object.freeze([
      'The supplied spread is an appropriate standard-deviation estimate for the declared spread basis and is not silently substituted between within-subgroup and overall/long-term variation.',
      'Process stability, measurement-system adequacy, sampling adequacy, distribution/model adequacy and specification authority are caller-confirmed prerequisites, not inferred from the arithmetic.',
      'The calculation does not grade capability against a universal acceptance threshold; product/customer/site requirements control any acceptance criterion.',
      'These indices describe spread and centring relative to specification under the stated assumptions and do not establish process causation or production authorization.',
    ]),
    authority: 'capability-arithmetic-only',
  });
}

export function energyPerGoodPart(rows, { energyKey, qualityKey, unit, samplingBasis }) {
  if (samplingBasis !== 'per-cycle') return Object.freeze({ valueKwh: null, reason: 'energy-not-confirmed-per-cycle' });
  const factor = ({ kwh: 1, wh: 1 / 1000, j: 1 / 3.6e6, kj: 1 / 3600, mj: 1 / 3.6 })[String(unit || '').toLowerCase()];
  if (!factor) return Object.freeze({ valueKwh: null, reason: 'unsupported-energy-unit' });
  if (!Array.isArray(rows) || !rows.length) return Object.freeze({ valueKwh: null, reason: 'no-rows' });

  let total = 0;
  let good = 0;
  for (const row of rows) {
    const energy = finiteNumber(row?.[energyKey]);
    const quality = row?.[qualityKey];
    if (energy === null || (quality !== 0 && quality !== 1)) {
      return Object.freeze({ valueKwh: null, reason: 'incomplete-aligned-coverage' });
    }
    total += energy * factor;
    if (quality === 1) good += 1;
  }
  if (!good) return Object.freeze({ valueKwh: null, reason: 'no-good-parts' });
  return Object.freeze({ valueKwh: total / good, reason: null, totalKwh: total, goodParts: good, rows: rows.length });
}

export const PROCESS_STATISTICS_BOUNDARY = Object.freeze({
  productionAuthority: 'none',
  machineControl: 'none',
  causalProof: false,
  universalLimits: false,
  rule: 'Results are descriptive site-local evidence aids. Units, sampling semantics, context and adequacy must be explicit before a score is computed.',
});
