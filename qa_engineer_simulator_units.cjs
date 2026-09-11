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
assert.equal(api.version, '2026.09.11.3');

const flow = api.calculateFlowMetrics(2, 40, 30, 50);
assert.ok(flow, 'valid flow measurements must produce a result');
assert.equal(flow.volumetricFlowCm3S, 20, '40 cm³ / 2 s must equal 20 cm³/s');
assert.equal(flow.massFlowGS, 15, '30 g / 2 s must equal 15 g/s');
assert.equal(flow.averageStrokeSpeedMmS, 25, '50 mm / 2 s must equal 25 mm/s');
assert.equal(api.calculateFlowMetrics('', 40, 30, 50), null, 'blank fill time must fail closed');
assert.equal(api.calculateFlowMetrics(0, 40, 30, 50), null, 'zero fill time must fail closed');
assert.equal(api.calculateFlowMetrics(2, '', '', ''), null, 'no measured numerator must return no calculation');

values.set('mm_clamp_area', '100');
values.set('mm_clamp_pressure', '50');
values.set('mm_clamp_capacity', '1000');
const clamp = api.deriveClamp();
assert.ok(clamp, 'valid clamp measurements must produce a result');
assert.equal(clamp.openingForceKN, 500, '50 MPa × 100 cm² × 0.1 must equal 500 kN');
assert.equal(clamp.utilisationPct, 50, '500 kN / 1000 kN must equal 50% utilisation');
assert.equal(clamp.marginOnRequiredPct, 100, '1000 kN capacity over 500 kN requirement must equal 100% margin on requirement');
values.set('mm_clamp_pressure', '');
assert.equal(api.deriveClamp(), null, 'blank cavity pressure must fail closed');

const source = require('node:fs').readFileSync(path.join(__dirname, 'src/domains/engineering/engineer-simulator-ui.js'), 'utf8');
for (const marker of [
  'Fill time', 's', 'MPa', 'bar', '°C', 'cm²', 'kN', 'cm³/s', 'g/s', 'mm/s',
  'Screw/ram speed is not melt-front velocity',
  'do not mix hydraulic and plastic pressure',
  'not probabilities, Cp/Cpk values, specifications or production limits'
]) {
  assert.ok(source.includes(marker), `missing engineering-unit/scope marker: ${marker}`);
}

console.log('Engineer simulator unit and arithmetic QA passed');
