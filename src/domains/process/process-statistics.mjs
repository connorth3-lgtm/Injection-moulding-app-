// MouldMaster pure process-statistics domain primitives.
// No DOM, storage, network, machine-control or production-authority dependencies.

export function finiteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(input)) return null;
  const number = Number(input);
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



export function cavitySpecificSummary({
  cavities,
  measurementUnit,
  samplingBasis,
  samplingBasisRef,
  measurementSystemAdequate = false,
  measurementSystemBasisRef,
  minimumPerCavity = 3,
} = {}) {
  const unit = String(measurementUnit || '').trim();
  const basis = String(samplingBasis || '').trim();
  const basisRef = String(samplingBasisRef || '').trim();
  const measurementRef = String(measurementSystemBasisRef || '').trim();
  if (!unit) return Object.freeze({ result: null, reason: 'measurement-unit-required' });
  if (!basis) return Object.freeze({ result: null, reason: 'sampling-basis-required' });
  if (!basisRef) return Object.freeze({ result: null, reason: 'sampling-basis-reference-required' });
  if (measurementSystemAdequate !== true) {
    return Object.freeze({ result: null, reason: 'measurement-system-not-confirmed' });
  }
  if (!measurementRef) return Object.freeze({ result: null, reason: 'measurement-system-basis-required' });
  if (!Number.isInteger(minimumPerCavity) || minimumPerCavity < 2) {
    return Object.freeze({ result: null, reason: 'invalid-minimum-per-cavity' });
  }
  if (!Array.isArray(cavities) || cavities.length < 2) {
    return Object.freeze({ result: null, reason: 'at-least-two-cavities-required' });
  }

  const seen = new Set();
  const summaries = [];
  for (let index = 0; index < cavities.length; index += 1) {
    const row = cavities[index] || {};
    const cavityId = String(row.cavityId || '').trim();
    if (!cavityId) return Object.freeze({ result: null, reason: 'cavity-id-required', cavityIndex: index });
    if (seen.has(cavityId)) return Object.freeze({ result: null, reason: 'duplicate-cavity-id', cavityId });
    seen.add(cavityId);
    if (!Array.isArray(row.values)) {
      return Object.freeze({ result: null, reason: 'cavity-values-required', cavityId });
    }
    const values = row.values.map(finiteNumber).filter(value => value !== null);
    if (values.length !== row.values.length) {
      return Object.freeze({ result: null, reason: 'non-finite-cavity-value', cavityId });
    }
    if (values.length < minimumPerCavity) {
      return Object.freeze({
        result: null,
        reason: 'insufficient-cavity-support',
        cavityId,
        n: values.length,
        minimumPerCavity,
      });
    }
    summaries.push(Object.freeze({ cavityId, ...numericSummary(values) }));
  }

  const cavityMeans = summaries.map(summary => summary.mean);
  const meanOfCavityMeans = mean(cavityMeans);
  let minimum = summaries[0];
  let maximum = summaries[0];
  for (const summary of summaries.slice(1)) {
    if (summary.mean < minimum.mean) minimum = summary;
    if (summary.mean > maximum.mean) maximum = summary;
  }
  const rangeOfCavityMeans = maximum.mean - minimum.mean;
  const relativeRangePct = Math.abs(meanOfCavityMeans) > Number.EPSILON
    ? 100 * rangeOfCavityMeans / Math.abs(meanOfCavityMeans)
    : null;

  return Object.freeze({
    result: Object.freeze({
      cavityCount: summaries.length,
      measurementUnit: unit,
      samplingBasis: basis,
      samplingBasisRef: basisRef,
      measurementSystemBasisRef: measurementRef,
      minimumPerCavity,
      cavities: Object.freeze(summaries),
      meanOfCavityMeans,
      minimumMeanCavityId: minimum.cavityId,
      minimumCavityMean: minimum.mean,
      maximumMeanCavityId: maximum.cavityId,
      maximumCavityMean: maximum.mean,
      rangeOfCavityMeans,
      relativeRangePct,
    }),
    reason: null,
    assumptions: Object.freeze([
      'Cavity identity is preserved; values are not pooled before each cavity is summarised.',
      'The result is descriptive evidence of between-cavity response, not a universal balance acceptance decision.',
      'A relative range is reported only when the mean of cavity means is meaningfully non-zero; no generic tolerance is applied.',
      'Sampling basis and measurement-system adequacy are caller-confirmed with explicit evidence references; the function does not infer cycle alignment, rational subgrouping, causation or tooling root cause.',
    ]),
    authority: 'cavity-specific-descriptive-statistics-only',
  });
}

export function capabilityIndices({
  meanValue,
  spreadValue,
  lowerSpecLimit,
  upperSpecLimit,
  spreadBasis,
  spreadEstimatorRef,
  measurementUnit,
  processStable = false,
  processStabilityBasisRef,
  measurementSystemAdequate = false,
  measurementSystemBasisRef,
  samplingAdequacyConfirmed = false,
  samplingAdequacyBasisRef,
  distributionModelAdequate = false,
  distributionModelBasisRef,
  specificationBasisRef,
} = {}) {
  const meanValueNumber = finiteNumber(meanValue);
  const spread = finiteNumber(spreadValue);
  const lsl = finiteNumber(lowerSpecLimit);
  const usl = finiteNumber(upperSpecLimit);
  const basis = String(spreadBasis || '').trim().toLowerCase();
  const estimatorRef = String(spreadEstimatorRef || '').trim();
  const unit = String(measurementUnit || '').trim();
  const stabilityRef = String(processStabilityBasisRef || '').trim();
  const measurementRef = String(measurementSystemBasisRef || '').trim();
  const samplingRef = String(samplingAdequacyBasisRef || '').trim();
  const distributionRef = String(distributionModelBasisRef || '').trim();
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
  else if (!stabilityRef) blockers.push('process-stability-basis');
  if (measurementSystemAdequate !== true) blockers.push('measurement-system');
  else if (!measurementRef) blockers.push('measurement-system-basis');
  if (samplingAdequacyConfirmed !== true) blockers.push('sampling-adequacy');
  else if (!samplingRef) blockers.push('sampling-adequacy-basis');
  if (distributionModelAdequate !== true) blockers.push('distribution-model');
  else if (!distributionRef) blockers.push('distribution-model-basis');
  if (!estimatorRef) blockers.push('spread-estimator');
  if (!unit) blockers.push('measurement-unit');
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
      measurementUnit: unit,
      spreadEstimatorRef: estimatorRef,
      processStabilityBasisRef: stabilityRef,
      measurementSystemBasisRef: measurementRef,
      samplingAdequacyBasisRef: samplingRef,
      distributionModelBasisRef: distributionRef,
      specificationBasisRef: specRef,
    }),
    assumptions: Object.freeze([
      'The supplied spread is an appropriate standard-deviation estimate for the declared spread basis, carries an explicit estimator reference and common measurement unit, and is not silently substituted between within-subgroup and overall/long-term variation.',
      'Process stability, measurement-system adequacy, sampling adequacy, distribution/model adequacy and specification authority are caller-confirmed prerequisites with explicit basis references, not inferred from the arithmetic.',
      'The calculation does not grade capability against a universal acceptance threshold; product/customer/site requirements control any acceptance criterion.',
      'These indices describe spread and centring relative to specification under the stated assumptions and do not establish process causation or production authorization.',
    ]),
    authority: 'capability-arithmetic-only',
  });
}

export function energyPerGoodPart(rows, {
  energyKey,
  qualityKey,
  cycleIdKey,
  unit,
  samplingBasis,
  samplingBasisRef,
  energyMeasurementBasisRef,
  qualityDispositionBasisRef,
  // Count good units explicitly for multi-cavity or mixed-disposition cycles.
  // Legacy single-part fixtures must confirm that assumption and its basis.
  goodPartCountKey,
  goodPartCountBasisRef,
  singlePartPerCycleConfirmed = false,
} = {}) {
  const energyField = String(energyKey || '').trim();
  const qualityField = String(qualityKey || '').trim();
  const cycleField = String(cycleIdKey || '').trim();
  const samplingRef = String(samplingBasisRef || '').trim();
  const energyRef = String(energyMeasurementBasisRef || '').trim();
  const qualityRef = String(qualityDispositionBasisRef || '').trim();
  const countField = String(goodPartCountKey || '').trim();
  const countRef = String(goodPartCountBasisRef || '').trim();

  if (!energyField) return Object.freeze({ valueKwh: null, reason: 'energy-key-required' });
  if (!qualityField) return Object.freeze({ valueKwh: null, reason: 'quality-key-required' });
  if (!cycleField) return Object.freeze({ valueKwh: null, reason: 'cycle-id-key-required' });
  if (samplingBasis !== 'per-cycle') return Object.freeze({ valueKwh: null, reason: 'energy-not-confirmed-per-cycle' });
  if (!samplingRef) return Object.freeze({ valueKwh: null, reason: 'sampling-basis-reference-required' });
  if (!energyRef) return Object.freeze({ valueKwh: null, reason: 'energy-measurement-basis-required' });
  if (!qualityRef) return Object.freeze({ valueKwh: null, reason: 'quality-disposition-basis-required' });
  if (!countRef) return Object.freeze({ valueKwh: null, reason: 'good-part-count-basis-required' });
  if (!countField && singlePartPerCycleConfirmed !== true) return Object.freeze({ valueKwh: null, reason: 'good-part-count-required' });

  const normalizedUnit = String(unit || '').toLowerCase();
  const factor = ({ kwh: 1, wh: 1 / 1000, j: 1 / 3.6e6, kj: 1 / 3600, mj: 1 / 3.6 })[normalizedUnit];
  if (!factor) return Object.freeze({ valueKwh: null, reason: 'unsupported-energy-unit' });
  if (!Array.isArray(rows) || !rows.length) return Object.freeze({ valueKwh: null, reason: 'no-rows' });

  let total = 0;
  let good = 0;
  const seenCycleIds = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const cycleId = String(row?.[cycleField] ?? '').trim();
    if (!cycleId) return Object.freeze({ valueKwh: null, reason: 'cycle-id-required', rowIndex: index });
    if (seenCycleIds.has(cycleId)) {
      return Object.freeze({ valueKwh: null, reason: 'duplicate-cycle-id', cycleId });
    }
    seenCycleIds.add(cycleId);

    const energy = finiteNumber(row?.[energyField]);
    const quality = row?.[qualityField];
    if (energy === null || (quality !== 0 && quality !== 1)) {
      return Object.freeze({ valueKwh: null, reason: 'incomplete-aligned-coverage', cycleId });
    }
    if (energy < 0) {
      return Object.freeze({ valueKwh: null, reason: 'negative-energy-value', cycleId });
    }
    let count = quality;
    if (countField) {
      const raw = row?.[countField];
      count = typeof raw === 'number' ? raw
        : typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
      if (!Number.isSafeInteger(count) || count < 0 || (quality === 0 && count !== 0) || (quality === 1 && count < 1)) {
        return Object.freeze({ valueKwh: null, reason: 'invalid-good-part-count', cycleId });
      }
    }
    const increment = energy * factor;
    if (!Number.isFinite(increment) || !Number.isFinite(total + increment)) {
      return Object.freeze({ valueKwh: null, reason: 'non-finite-energy-total', cycleId });
    }
    if (!Number.isSafeInteger(good + count)) return Object.freeze({ valueKwh: null, reason: 'unsafe-good-part-count', cycleId });
    total += increment;
    good += count;
  }
  if (!good) return Object.freeze({ valueKwh: null, reason: 'no-good-parts' });
  const intensity = total / good;
  if (!Number.isFinite(intensity)) return Object.freeze({ valueKwh: null, reason: 'non-finite-energy-intensity' });
  return Object.freeze({
    valueKwh: intensity,
    reason: null,
    totalKwh: total,
    goodParts: good,
    goodPartCountKey: countField || null,
    goodPartCountBasisRef: countRef,
    singlePartPerCycleConfirmed: !countField,
    rows: rows.length,
    cycleCount: seenCycleIds.size,
    samplingBasis: 'per-cycle',
    samplingBasisRef: samplingRef,
    energyMeasurementBasisRef: energyRef,
    qualityDispositionBasisRef: qualityRef,
    assumptions: Object.freeze([
      'Every included row represents one uniquely identified cycle with aligned energy, quality disposition and a cited good-part count basis.',
      countField ? 'Good parts are explicitly counted per cycle; rejected and partially accepted cycles contribute energy to the total while only accepted units enter the denominator.' : 'A documented one-accepted-part-per-cycle assumption is required when explicit good-part counts are unavailable.',
      'The energy channel is confirmed as per-cycle on the stated measurement basis and converted to kWh using only the declared unit.',
      'All cycle energy, including energy consumed by rejected parts, remains in the numerator while only good parts contribute to the denominator.',
      'The quality-disposition basis defines the entered 0/1 labels; the function does not infer product acceptance or root cause.',
      'The result is descriptive energy intensity for the supplied aligned cycle set, not a universal efficiency target or causal proof.',
    ]),
    authority: 'aligned-energy-intensity-only',
  });
}

export const PROCESS_STATISTICS_BOUNDARY = Object.freeze({
  productionAuthority: 'none',
  machineControl: 'none',
  causalProof: false,
  universalLimits: false,
  rule: 'Results are descriptive site-local evidence aids. Units, sampling semantics, context and adequacy must be explicit before a score is computed.',
});
