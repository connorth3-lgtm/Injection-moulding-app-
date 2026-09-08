'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');

const result = spawnSync(
  'python',
  ['tools/externalize_core_scripts.py', '--check'],
  { encoding: 'utf8' }
);

if (result.error) throw result.error;

assert.strictEqual(
  result.status,
  0,
  `transform-aware core/runtime sync check failed\nstdout:\n${result.stdout || ''}\nstderr:\n${result.stderr || ''}`
);

assert.match(
  result.stdout || '',
  /Core CSP migration check passed:/,
  'canonical externalization checker did not report a successful deterministic transform check'
);

console.log('v27 canonical core/runtime transform-aware sync QA passed');
