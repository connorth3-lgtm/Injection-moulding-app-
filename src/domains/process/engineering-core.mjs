// MouldMaster pure injection-moulding engineering primitives.
// This module has no DOM, browser storage, network, release-plumbing or machine-control dependencies.

const AREA_TO_M2 = Object.freeze({ m2: 1, cm2: 1e-4, mm2: 1e-6 });
const PRESSURE_TO_PA = Object.freeze({ pa: 1, kpa: 1e3, mpa: 1e6, bar: 1e5 });
const MASS_TO_G = Object.freeze({ g: 1, kg: 1000, mg: 0.001 });

function cleanUnit(unit) {
  return String(unit ?? '').trim().toLowerCase().replace('²', '2');
}

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function unsupported(reason, details = {}) {
  return Object.freeze({ ok: false, reason, ...details });
}

function supported(value, metadata = {}) {
  return Object.freeze({ ok: true, value: Object.freeze(value), ...metadata });
}

function convertPositive(quantity, table, field) {
  if (!quantity || typeof quantity !== 'object') return unsupported(`missing-${field}`, { field });
  const value = finitePositive(quantity.value);
  if (value === null) return unsupported(`invalid-${field}-value`, { field });
  const unit = cleanUnit(quantity.unit);
  const factor = table[unit];
  if (!factor) return unsupported(`unsupported-${field}-unit`, { field, unit: String(quantity.unit ?? '') });
  return supported({ si: value * factor, inputValue: value, inputUnit: unit });
}

export function clampSeparatingForce({ projectedArea, representativePressure, provenance = null } = {}) {
  const area = convertPositive(projectedArea, AREA_TO_M2, 'projected-area');
  if (!area.ok) return area;
  const pressure = convertPositive(representativePressure, PRESSURE_TO_PA, 'representative-pressure');
  if (!pressure.ok) return pressure;
  const newtons = area.value.si * pressure.value.si;
  return supported(
    { newtons, kilonewtons: newtons / 1000 },
    {
      units: Object.freeze({ force: 'kN', areaSI: 'm²', pressureSI: 'Pa' }),
      assumptions: Object.freeze([
        'The supplied projected area represents the area relevant to the stated engineering estimate.',
        'The supplied pressure is an explicitly stated representative pressure assumption; it is not inferred cavity pressure.',
        'This arithmetic separating-force estimate is not automatically the required machine clamp rating.',
      ]),
      provenance,
      authority: 'engineering-estimate-only',
    },
  );
}

export function aggregateShotMass({ cavityCount, partMass, runnerMass = { value: 0, unit: 'g' }, provenance = null } = {}) {
  if (!Number.isInteger(cavityCount) || cavityCount < 1) return unsupported('invalid-cavity-count', { field: 'cavityCount' });
  const part = convertPositive(partMass, MASS_TO_G, 'part-mass');
  if (!part.ok) return part;

  let runnerG = 0;
  if (runnerMass != null) {
    const raw = Number(runnerMass?.value);
    if (!Number.isFinite(raw) || raw < 0) return unsupported('invalid-runner-mass-value', { field: 'runner-mass' });
    const unit = cleanUnit(runnerMass?.unit);
    const factor = MASS_TO_G[unit];
    if (!factor) return unsupported('unsupported-runner-mass-unit', { field: 'runner-mass', unit: String(runnerMass?.unit ?? '') });
    runnerG = raw * factor;
  }

  const partsG = cavityCount * part.value.si;
  const totalG = partsG + runnerG;
  return supported(
    { partContributionG: partsG, runnerContributionG: runnerG, totalG, totalKg: totalG / 1000 },
    {
      units: Object.freeze({ mass: 'g' }),
      assumptions: Object.freeze([
        'Every counted cavity is assumed to produce one part of the supplied part mass for this arithmetic estimate.',
        'Runner mass is included only when explicitly supplied; hot-runner or runnerless systems may legitimately use zero.',
        'This mass total does not establish machine shot-capacity suitability without machine/screw-specific usable-capacity evidence.',
      ]),
      provenance,
      authority: 'mass-accounting-only',
    },
  );
}

export function channelSemanticReadiness({ role = 'unresolved', meaning = '', unit = '', samplingBasis = 'unknown', dynamicUnitColumn = null } = {}) {
  const blockers = [];
  const cleanRole = String(role || 'unresolved');
  const cleanMeaning = String(meaning || '').trim();
  const cleanUnitValue = String(unit || '').trim();
  const cleanSampling = String(samplingBasis || 'unknown');
  if (cleanRole === 'unresolved') blockers.push('role');
  if (!cleanMeaning && cleanRole !== 'structural') blockers.push('meaning');
  if (cleanRole !== 'structural' && cleanRole !== 'state' && !cleanUnitValue && !dynamicUnitColumn) blockers.push('unit');
  if (['actual', 'derived', 'quality'].includes(cleanRole) && cleanSampling === 'unknown') blockers.push('sampling_basis');
  return Object.freeze({
    ready: blockers.length === 0,
    blockers: Object.freeze([...new Set(blockers)]),
    inputs: Object.freeze({ role: cleanRole, meaning: cleanMeaning, unit: cleanUnitValue || null, samplingBasis: cleanSampling, dynamicUnitColumn: dynamicUnitColumn || null }),
    authority: 'semantic-readiness-only',
  });
}

export function gradeSpecificProcessingBoundary({ exactGrade, currentSupplierDocument, requestedSetting } = {}) {
  if (!String(exactGrade || '').trim()) return unsupported('exact-grade-required', { field: 'exactGrade' });
  if (!String(currentSupplierDocument || '').trim()) return unsupported('current-grade-document-required', { field: 'currentSupplierDocument' });
  if (!String(requestedSetting || '').trim()) return unsupported('requested-setting-required', { field: 'requestedSetting' });
  return supported(
    { disposition: 'consult-controlling-grade-document', setting: String(requestedSetting).trim() },
    {
      assumptions: Object.freeze(['Processing settings and limits are grade-specific unless an authoritative source explicitly establishes otherwise.']),
      provenance: String(currentSupplierDocument).trim(),
      authority: 'source-first-boundary-only',
    },
  );
}

export const ENGINEERING_DOMAIN_BOUNDARY = Object.freeze({
  dependenciesAllowed: Object.freeze(['plain JavaScript data']),
  dependenciesForbidden: Object.freeze(['DOM', 'IndexedDB', 'localStorage', 'network', 'release plumbing', 'machine control']),
  productionAuthority: 'none',
  universalSetpoints: false,
  rule: 'Unsupported or ambiguous inputs return explicit reasons. Results carry units, assumptions/provenance where applicable, and never authorize production or machine-control changes.',
});
