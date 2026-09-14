'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const values = new Map();
global.document = {
  getElementById(id) {
    if (id === 'simulator') return null;
    if (!values.has(id)) return null;
    return { value: values.get(id) };
  }
};
global.window = {
  renderSimulator() {},
  updateSimulator() {}
};

require(path.join(__dirname, 'src/domains/engineering/engineer-simulator-ui.js'));
const api = global.window.MM_ENGINEER_SIMULATOR_UI;
assert.ok(api, 'engineer simulator API was not registered');
assert.equal(api.version, '2026.09.15.1');

const flow = api.calculateFlowMetrics(2, 40, 30, 50);
assert.ok(flow, 'valid flow measurements must produce a result');
assert.equal(flow.volumetricFlowCm3S, 20, '40 cm³ / 2 s must equal 20 cm³/s');
assert.equal(flow.massFlowGS, 15, '30 g / 2 s must equal 15 g/s');
assert.equal(flow.averageStrokeSpeedMmS, 25, '50 mm / 2 s must equal 25 mm/s');

const fastFlow = api.calculateFlowMetrics('0.25', '12.5', '7.5', '18');
assert.ok(fastFlow, 'decimal engineering measurements must be accepted');
assert.equal(fastFlow.volumetricFlowCm3S, 50, '12.5 cm³ / 0.25 s must equal 50 cm³/s');
assert.equal(fastFlow.massFlowGS, 30, '7.5 g / 0.25 s must equal 30 g/s');
assert.equal(fastFlow.averageStrokeSpeedMmS, 72, '18 mm / 0.25 s must equal 72 mm/s');
assert.equal(api.calculateFlowMetrics('', 40, 30, 50), null, 'blank fill time must fail closed');
assert.equal(api.calculateFlowMetrics(0, 40, 30, 50), null, 'zero fill time must fail closed');
assert.equal(api.calculateFlowMetrics(-1, 40, 30, 50), null, 'negative fill time must fail closed');
assert.equal(api.calculateFlowMetrics(2, '', '', ''), null, 'no measured numerator must return no calculation');
assert.equal(api.calculateFlowMetrics(2, -1, '', ''), null, 'negative measured numerator must not create a flow result');

for (const [key, value] of Object.entries({fillTime:2,vpFill:95,packPressure:60,holdTime:4,meltTemp:245,mouldTemp:80,coolingTime:18})) {
  values.set(`mm_baseline_${key}`, String(value));
  values.set(`mm_current_${key}`, String(value));
}
const baselineModel = api.deriveMetricModel();
assert.equal(baselineModel.ok, true, 'complete identical baseline/current measurements must produce a model');
for (const key of ['fillAgg','transfer','pack','hold','cooling']) {
  assert.equal(baselineModel.derived[key], 50, `${key} must map an unchanged baseline/current ratio to training index 50`);
}
assert.equal(baselineModel.derived.meltOffset, 0, 'unchanged melt temperature must map to 0 °C deviation');
assert.equal(baselineModel.derived.mouldOffset, 0, 'unchanged mould temperature must map to 0 °C deviation');

values.set('mm_clamp_area', '100');
values.set('mm_clamp_pressure', '50');
values.set('mm_clamp_capacity', '1000');
const clamp = api.deriveClamp();
assert.ok(clamp, 'valid clamp measurements must produce a result');
assert.equal(clamp.openingForceKN, 500, '50 MPa × 100 cm² × 0.1 must equal 500 kN');
assert.equal(clamp.utilisationPct, 50, '500 kN / 1000 kN must equal 50% utilisation');
assert.equal(clamp.marginOnRequiredPct, 100, '1000 kN capacity over 500 kN requirement must equal 100% margin on requirement');

values.set('mm_clamp_area', '1');
values.set('mm_clamp_pressure', '1');
values.set('mm_clamp_capacity', '0.1');
const unitClamp = api.deriveClamp();
assert.ok(unitClamp, 'unit-scale clamp inputs must produce a result');
assert.equal(unitClamp.openingForceKN, 0.1, '1 MPa × 1 cm² must equal 0.1 kN');
assert.equal(unitClamp.utilisationPct, 100, '0.1 kN required / 0.1 kN available must equal 100% utilisation');
assert.equal(unitClamp.marginOnRequiredPct, 0, 'equal required and available clamp force must give zero capacity margin');
values.set('mm_clamp_pressure', '');
assert.equal(api.deriveClamp(), null, 'blank cavity pressure must fail closed');
values.set('mm_clamp_pressure', '-10');
assert.equal(api.deriveClamp(), null, 'negative cavity pressure must fail closed');

const source = require('node:fs').readFileSync(path.join(__dirname, 'src/domains/engineering/engineer-simulator-ui.js'), 'utf8');
for (const marker of [
  'Fill time', 's', 'MPa', 'bar', '°C', 'cm²', 'kN', 'cm³/s', 'g/s', 'mm/s',
  '1 MPa = 10 bar',
  'F[kN] = average cavity pressure[MPa] × projected area[cm²] × 0.1',
  'Screw/ram speed is not melt-front velocity',
  'do not mix hydraulic and plastic pressure',
  'unchanged current value maps to training index 50',
  'Ratio-normalised reference = 50',
  'not physical units or probabilities',
  'not probabilities, Cp/Cpk values, specifications or production limits'
]) {
  assert.ok(source.includes(marker), `missing engineering-unit/scope marker: ${marker}`);
}

console.log('Engineer simulator unit, arithmetic and baseline-index QA passed');
