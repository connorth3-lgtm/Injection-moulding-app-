'use strict';

const fs = require('fs');
const assert = require('assert');

const core = fs.readFileSync('MouldMaster_Core_App.html', 'utf8');
const inlineScripts = [...core.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
  .filter(match => !/\bsrc\s*=/i.test(match[1]))
  .map(match => match[2]);

assert.strictEqual(inlineScripts.length, 10, 'canonical core inline script count drifted');

for (let i = 0; i < inlineScripts.length; i += 1) {
  const path = `src/core-runtime/core-inline-${String(i + 1).padStart(3, '0')}.js`;
  const external = fs.readFileSync(path, 'utf8');
  assert.strictEqual(
    external,
    inlineScripts[i],
    `canonical/generated runtime drift: ${path} no longer matches inline script ${i + 1}`
  );
}

console.log('v27 canonical core/runtime byte-sync QA passed');
