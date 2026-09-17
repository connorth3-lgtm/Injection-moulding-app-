import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  clampSeparatingForce,
  aggregateShotMass,
  channelSemanticReadiness,
  gradeSpecificProcessingBoundary,
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

assert.deepEqual(ENGINEERING_DOMAIN_BOUNDARY.dependenciesAllowed, ['plain JavaScript data']);
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('DOM'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('IndexedDB'));
assert.ok(ENGINEERING_DOMAIN_BOUNDARY.dependenciesForbidden.includes('machine control'));
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.productionAuthority, 'none');
assert.equal(ENGINEERING_DOMAIN_BOUNDARY.universalSetpoints, false);

console.log('MouldMaster injection-moulding engineering domain QA passed');
