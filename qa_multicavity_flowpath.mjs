// New2 candidate geometry contract; no physical prediction/production approval implied.
import assert from 'node:assert/strict';
import { multiCavityFlowPathGeometry } from './src/domains/process/multi-cavity-flowpath.mjs';

const fixture = {
  mouldConfigurationId: 'MOULD-142/rev-C',
  geometryBasisRef: 'CAD-runner-sections/rev-C',
  topologyBasisRef: 'controlled-cavity-path-list/rev-C',
  segments: [
    { segmentId: 'common', crossSectionArea: { value: 20, unit: 'mm2' }, channelLength: { value: 100, unit: 'mm' }, wettedPerimeter: { value: 18, unit: 'mm' } },
    { segmentId: 'A', crossSectionArea: { value: 10, unit: 'mm2' }, channelLength: { value: 300, unit: 'mm' } },
    { segmentId: 'B', crossSectionArea: { value: 10, unit: 'mm2' }, channelLength: { value: 400, unit: 'mm' } },
  ],
  cavityPaths: [
    { cavityId: 'cavity-A', segmentIds: ['common', 'A'] },
    { cavityId: 'cavity-B', segmentIds: ['common', 'B'] },
  ],
};

const good = multiCavityFlowPathGeometry(fixture);
assert.equal(good.ok, true);
assert.equal(good.authority, 'geometry-teaching-candidate-only');
assert.equal(good.value.cavityCount, 2);
assert.deepEqual(good.value.sharedSegmentIds, ['common']);
assert.ok(Math.abs(good.value.uniqueGeometricVolumeCm3 - 9) < 1e-12);
assert.ok(Math.abs(good.value.cavityPaths[0].geometricPathVolumeCm3 - 5) < 1e-12);
assert.ok(Math.abs(good.value.cavityPaths[1].geometricPathVolumeCm3 - 6) < 1e-12);
assert.ok(Math.abs(good.value.segments[0].hydraulicDiameterMm - 80 / 18) < 1e-12);
assert.match(good.assumptions.join(' '), /cannot establish cavity balance/i);

const invalid = overrides => multiCavityFlowPathGeometry({ ...fixture, ...overrides });
assert.equal(invalid({ mouldConfigurationId: '' }).reason, 'mould-configuration-id-required');
assert.equal(invalid({ geometryBasisRef: '' }).reason, 'flow-path-geometry-basis-required');
assert.equal(invalid({ topologyBasisRef: '' }).reason, 'cavity-path-topology-basis-required');
assert.equal(invalid({ cavityPaths: [fixture.cavityPaths[0]] }).reason, 'at-least-two-cavity-paths-required');
assert.equal(invalid({ cavityPaths: [fixture.cavityPaths[0], fixture.cavityPaths[0]] }).reason, 'duplicate-cavity-id');
assert.equal(invalid({ cavityPaths: [{ cavityId: 'cavity-A', segmentIds: ['common', 'common'] }, fixture.cavityPaths[1]] }).reason, 'repeated-segment-in-cavity-path');
assert.equal(invalid({ cavityPaths: [{ cavityId: 'cavity-A', segmentIds: ['missing'] }, fixture.cavityPaths[1]] }).reason, 'unknown-path-segment-id');
assert.equal(invalid({ cavityPaths: [{ cavityId: 'cavity-A', segmentIds: ['common', 'A'] }, { cavityId: 'cavity-B', segmentIds: ['common'] }] }).reason, 'unreferenced-flow-path-segments');
assert.equal(invalid({ segments: [...fixture.segments, fixture.segments[0]] }).reason, 'duplicate-segment-id');
assert.equal(invalid({ segments: [{ ...fixture.segments[0], channelLength: { value: 1, unit: 'Mm' } }, ...fixture.segments.slice(1)] }).reason, 'unsupported-channel-length-unit');
assert.equal(invalid({ segments: [{ ...fixture.segments[0], crossSectionArea: { value: 1e308, unit: 'm2' }, channelLength: { value: 1e308, unit: 'm' } }, ...fixture.segments.slice(1)] }).reason, 'non-finite-engineering-result');

console.log('New2 multi-cavity flow-path geometry candidate QA passed');
