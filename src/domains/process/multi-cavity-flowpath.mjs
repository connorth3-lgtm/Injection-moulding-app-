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
