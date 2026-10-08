/**
 * New2: evidence-scoped multi-cavity runner geometry, not a flow/pressure solver.
 * Educational pure module; no browser/global IO and no production authority.
 * Reuses canonical engineering-core primitives rather than duplicating arithmetic.
 */
import { uniformChannelVolume, hydraulicDiameter } from './engineering-core.mjs';

const reject = (reason, details = {}) => Object.freeze({ ok: false, reason, ...details });
const identity = value => String(value ?? '').trim();

export function multiCavityFlowPathGeometry({
  mouldConfigurationId,
  geometryBasisRef,
  topologyBasisRef,
  segments,
  cavityPaths,
  provenance = null,
} = {}) {
  const mould = identity(mouldConfigurationId);
  if (!mould) return reject('mould-configuration-id-required');
  const geometry = identity(geometryBasisRef);
  if (!geometry) return reject('flow-path-geometry-basis-required');
  const topology = identity(topologyBasisRef);
  if (!topology) return reject('cavity-path-topology-basis-required');
  if (!Array.isArray(segments) || !segments.length) return reject('flow-path-segments-required');
  if (!Array.isArray(cavityPaths) || cavityPaths.length < 2) return reject('at-least-two-cavity-paths-required');

  const geometryById = new Map();
  for (const [index, segment] of segments.entries()) {
    const segmentId = identity(segment?.segmentId);
    if (!segmentId) return reject('segment-id-required', { index });
    if (geometryById.has(segmentId)) return reject('duplicate-segment-id', { segmentId });
    const volume = uniformChannelVolume({
      crossSectionArea: segment.crossSectionArea,
      channelLength: segment.channelLength,
      provenance,
    });
    if (!volume.ok) return reject(volume.reason, { segmentId, field: volume.field });
    let hydraulicDiameterMm = null;
    if (segment.wettedPerimeter != null) {
      const diameter = hydraulicDiameter({
        crossSectionArea: segment.crossSectionArea,
        wettedPerimeter: segment.wettedPerimeter,
        provenance,
      });
      if (!diameter.ok) return reject(diameter.reason, { segmentId, field: diameter.field });
      hydraulicDiameterMm = diameter.value.hydraulicDiameterMm;
    }
    geometryById.set(segmentId, Object.freeze({
      segmentId,
      volumeCm3: volume.value.volumeCm3,
      channelLengthMm: volume.value.channelLengthMm,
      hydraulicDiameterMm,
    }));
  }

  const cavityIds = new Set();
  const segmentUsage = new Map();
  const cavityRows = [];
  for (const [index, cavity] of cavityPaths.entries()) {
    const cavityId = identity(cavity?.cavityId);
    if (!cavityId) return reject('cavity-id-required', { index });
    if (cavityIds.has(cavityId)) return reject('duplicate-cavity-id', { cavityId });
    cavityIds.add(cavityId);
    if (!Array.isArray(cavity.segmentIds) || !cavity.segmentIds.length) {
      return reject('cavity-segment-path-required', { cavityId });
    }
    const local = new Set();
    let pathVolumeCm3 = 0;
    for (const rawSegmentId of cavity.segmentIds) {
      const segmentId = identity(rawSegmentId);
      if (!geometryById.has(segmentId)) return reject('unknown-path-segment-id', { cavityId, segmentId });
      if (local.has(segmentId)) return reject('repeated-segment-in-cavity-path', { cavityId, segmentId });
      local.add(segmentId);
      segmentUsage.set(segmentId, (segmentUsage.get(segmentId) || 0) + 1);
      pathVolumeCm3 += geometryById.get(segmentId).volumeCm3;
      if (!Number.isFinite(pathVolumeCm3)) return reject('non-finite-engineering-result');
    }
    cavityRows.push(Object.freeze({
      cavityId,
      segmentIds: Object.freeze([...local]),
      geometricPathVolumeCm3: pathVolumeCm3,
    }));
  }

  const segmentRows = [...geometryById.values()];
  const unreferenced = segmentRows.filter(row => !segmentUsage.has(row.segmentId)).map(row => row.segmentId);
  if (unreferenced.length) return reject('unreferenced-flow-path-segments', { segmentIds: Object.freeze(unreferenced) });
  const uniqueGeometricVolumeCm3 = segmentRows.reduce((total, row) => total + row.volumeCm3, 0);
  if (!Number.isFinite(uniqueGeometricVolumeCm3)) return reject('non-finite-engineering-result');
  return Object.freeze({
    ok: true,
    equationId: 'EQ-FLOWPATH-004-CANDIDATE',
    authority: 'geometry-teaching-candidate-only',
    provenance,
    units: Object.freeze({ volume: 'cm³', length: 'mm' }),
    value: Object.freeze({
      mouldConfigurationId: mould,
      geometryBasisRef: geometry,
      topologyBasisRef: topology,
      cavityCount: cavityRows.length,
      segments: Object.freeze(segmentRows),
      cavityPaths: Object.freeze(cavityRows),
      uniqueGeometricVolumeCm3,
      sharedSegmentIds: Object.freeze(segmentRows.filter(row => segmentUsage.get(row.segmentId) > 1).map(row => row.segmentId)),
    }),
    assumptions: Object.freeze([
      'Each cross-section is uniform along its declared length; transitions, gates and junctions require separate geometry.',
      'Unique segment volume is counted once for the mould and along every named cavity route using that segment.',
      'Declared topology and geometry references do not independently prove CAD connectivity or the actual machine configuration.',
      'Path volumes cannot establish cavity balance, flow split, pressure loss, shear heating, gate suitability or filling order.',
      'Research-stage geometric accounting only: no production setpoints or machine-control authority.',
    ]),
  });
}

/**
 * Cross-reference a multi-cavity geometry *candidate* with cavity-specific
 * measurement provenance for human review. This validates metadata linkage,
 * not underlying sensor records, physical fill balance or gate seal.
 *
 * Requiring one common shot window, acquisition and timebase prevents the
 * caller from quietly combining unrelated cavity traces as if synchronised.
 */
export function multiCavityEvidenceCoverage({
  geometryResult,
  measurementCampaignId,
  acquisitionBasisRef,
  shotWindowRef,
  timebaseSynchronisationRef,
  cavityTraces,
  gateSealStudies = null,
} = {}) {
  const ref = value => typeof value === 'string' ? value.trim() : '';
  if (!geometryResult?.ok || geometryResult.authority !== 'geometry-teaching-candidate-only'
      || !Array.isArray(geometryResult.value?.cavityPaths)
      || geometryResult.value.cavityPaths.length < 2) {
    return reject('valid-multi-cavity-geometry-candidate-required');
  }
  const campaign = ref(measurementCampaignId);
  const acquisition = ref(acquisitionBasisRef);
  const window = ref(shotWindowRef);
  const synchronisation = ref(timebaseSynchronisationRef);
  if (!campaign) return reject('measurement-campaign-id-required');
  if (!acquisition) return reject('acquisition-basis-required');
  if (!window) return reject('common-shot-window-required');
  if (!synchronisation) return reject('timebase-synchronisation-reference-required');
  if (!Array.isArray(cavityTraces)) return reject('cavity-traces-required');

  const cavityIds = geometryResult.value.cavityPaths.map(x => x.cavityId);
  if (cavityIds.some(id => !ref(id)) || new Set(cavityIds).size !== cavityIds.length) {
    return reject('invalid-geometry-cavity-identities');
  }
  const expected = new Set(cavityIds);
  const mapped = new Map();
  for (const [index, trace] of cavityTraces.entries()) {
    const cavityId = ref(trace?.cavityId);
    if (!cavityId) return reject('trace-cavity-id-required', { index });
    if (!expected.has(cavityId)) return reject('trace-unknown-cavity-id', { cavityId });
    if (mapped.has(cavityId)) return reject('duplicate-cavity-trace', { cavityId });
    for (const [field, reason] of [
      ['cavityPressureLocationId', 'cavity-pressure-location-id-required'],
      ['cavityPressureSignalRef', 'cavity-pressure-signal-reference-required'],
      ['sensorCalibrationRef', 'sensor-calibration-reference-required'],
      ['shotWindowRef', 'trace-shot-window-required'],
      ['timebaseSynchronisationRef', 'trace-timebase-reference-required'],
    ]) {
      if (!ref(trace?.[field])) return reject(reason, { cavityId });
    }
    if (trace.shotWindowRef.trim() !== window) return reject('trace-shot-window-mismatch', { cavityId });
    if (trace.timebaseSynchronisationRef.trim() !== synchronisation) {
      return reject('trace-timebase-mismatch', { cavityId });
    }
    mapped.set(cavityId, Object.freeze({
      cavityId,
      cavityPressureLocationId: ref(trace.cavityPressureLocationId),
      cavityPressureSignalRef: ref(trace.cavityPressureSignalRef),
      sensorCalibrationRef: ref(trace.sensorCalibrationRef),
      shotWindowRef: window,
      timebaseSynchronisationRef: synchronisation,
    }));
  }
  const missing = cavityIds.filter(id => !mapped.has(id));
  if (missing.length) return reject('missing-cavity-traces', { cavityIds: Object.freeze(missing) });

  let studies = null;
  if (gateSealStudies != null) {
    if (!Array.isArray(gateSealStudies)) return reject('gate-seal-studies-must-be-array');
    const studyMap = new Map();
    for (const [index, study] of gateSealStudies.entries()) {
      const cavityId = ref(study?.cavityId);
      if (!cavityId) return reject('gate-seal-cavity-id-required', { index });
      if (!expected.has(cavityId)) return reject('gate-seal-unknown-cavity-id', { cavityId });
      if (studyMap.has(cavityId)) return reject('duplicate-gate-seal-cavity-id', { cavityId });
      const studyRef = ref(study?.gateSealStudyRef);
      if (!studyRef) return reject('gate-seal-study-reference-required', { cavityId });
      studyMap.set(cavityId, Object.freeze({ cavityId, gateSealStudyRef: studyRef }));
    }
    const absent = cavityIds.filter(id => !studyMap.has(id));
    if (absent.length) return reject('missing-gate-seal-studies', { cavityIds: Object.freeze(absent) });
    studies = Object.freeze(cavityIds.map(id => studyMap.get(id)));
  }

  return Object.freeze({
    ok: true,
    authority: 'cavity-evidence-linkage-only',
    status: 'reference-coverage-complete-unverified',
    measurementCampaignId: campaign,
    acquisitionBasisRef: acquisition,
    shotWindowRef: window,
    timebaseSynchronisationRef: synchronisation,
    mouldConfigurationId: geometryResult.value.mouldConfigurationId,
    geometryBasisRef: geometryResult.value.geometryBasisRef,
    topologyBasisRef: geometryResult.value.topologyBasisRef,
    cavityTraces: Object.freeze(cavityIds.map(id => mapped.get(id))),
    gateSealStudies: studies,
    gateSealCoverage: studies ? 'references-present-not-validated' : 'not-provided',
    validatedBalance: false,
    productionAuthority: false,
    assumptions: Object.freeze([
      'References must be independently audited against the actual sensor locations, serial/mould configuration, calibration, shots and acquisition clocks.',
      'Matching timebase and shot-window labels do not prove synchronisation, calibration accuracy, waveform quality or representative process stability.',
      'Presence of gate-seal study references does not demonstrate gate seal, pressure retention or balanced filling.',
      'No flow-split, cavity balance, shear heating, pressure loss, setpoint or physical validation is inferred from this metadata coverage.',
    ]),
  });
}


/**
 * Runner-tree and cavity-gate *identity* audit. Geometry alone cannot establish
 * flow balancing: this checks paths share segments only as common prefixes,
 * and ensures every cavity has a distinct identified gate/source reference.
 * No pressure, viscosity, flow split or production authority is inferred.
 */
export function multiCavityGateTopologyReadiness({
  geometryResult, topologyVerificationRef, cavityGates,
} = {}) {
  const ref = value => typeof value === 'string' ? value.trim() : '';
  if (!geometryResult?.ok || geometryResult.authority !== 'geometry-teaching-candidate-only'
      || !Array.isArray(geometryResult.value?.cavityPaths)
      || geometryResult.value.cavityPaths.length < 2) {
    return reject('valid-multi-cavity-geometry-candidate-required');
  }
  const topologyRef = ref(topologyVerificationRef);
  if (!topologyRef) return reject('verified-path-topology-reference-required');
  if (!Array.isArray(cavityGates)) return reject('cavity-gates-required');
  const paths = geometryResult.value.cavityPaths;
  const known = new Set(paths.map(x => x.cavityId));
  const gateByCavity = new Map();
  const gateIds = new Set();
  for (const [index, gate] of cavityGates.entries()) {
    const cavityId = ref(gate?.cavityId);
    const gateId = ref(gate?.gateId);
    const gateGeometryBasisRef = ref(gate?.gateGeometryBasisRef);
    if (!cavityId) return reject('gate-cavity-id-required', { index });
    if (!known.has(cavityId)) return reject('unknown-gate-cavity', { cavityId });
    if (gateByCavity.has(cavityId)) return reject('duplicate-gate-cavity', { cavityId });
    if (!gateId) return reject('gate-id-required', { cavityId });
    if (!gateGeometryBasisRef) return reject('gate-geometry-reference-required', { cavityId });
    if (gateIds.has(gateId)) return reject('same-gate-assigned-to-multiple-cavities', { gateId });
    gateIds.add(gateId);
    gateByCavity.set(cavityId,Object.freeze({cavityId,gateId,gateGeometryBasisRef}));
  }
  const missing = paths.filter(p => !gateByCavity.has(p.cavityId)).map(p => p.cavityId);
  if (missing.length) return reject('missing-cavity-gate-identities',{cavityIds:Object.freeze(missing)});
  // Paths may have distinct roots (e.g. separate feed circuits). However,
  // a purported tree cannot split and later reconverge at the same segment.
  for (let a = 0; a < paths.length; a++) {
    const first = paths[a];
    for (let b = a + 1; b < paths.length; b++) {
      const other = paths[b];
      let diverged = false;
      const left = new Set(first.segmentIds);
      const right = new Set(other.segmentIds);
      for (let i = 0; i < Math.max(first.segmentIds.length,other.segmentIds.length);i++) {
        const x = first.segmentIds[i], y = other.segmentIds[i];
        if (x !== y) diverged = true;
        if (diverged && ((x && right.has(x)) || (y && left.has(y)))) {
          return reject('non-tree-shared-segment-after-divergence',{
            cavityIds:Object.freeze([first.cavityId,other.cavityId]),
          });
        }
      }
    }
  }
  return Object.freeze({
    ok:true,
    status:'gate-path-identity-audited-unverified',
    authority:'runner-tree-metadata-only',
    productionAuthority:false,
    geometryBasisRef:geometryResult.value.geometryBasisRef,
    topologyBasisRef:geometryResult.value.topologyBasisRef,
    topologyVerificationRef:topologyRef,
    gates:Object.freeze(paths.map(p=>gateByCavity.get(p.cavityId))),
    assumptions:Object.freeze([
      'Reported segment paths and gate IDs still require an independent CAD/as-built and mould-configuration audit.',
      'This screen assumes directed non-reconvergent runner trees. Manifolds with real reconvergence require a different validated topology model.',
      'Shared prefix and gate identity cannot establish runner balance, valve-gate timing, shear, pressure loss, gate seal or cavity quality.',
      'No validated machine settings or production process control is authorised.',
    ]),
  });
}
