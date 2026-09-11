'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'data-integration-runtime.js'), 'utf8');

function extract(name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing runtime helper: ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}(`, start) : -1;
  if (nextName && end < 0) throw new Error(`missing runtime helper boundary: ${nextName}`);
  return source.slice(start, end < 0 ? source.length : end);
}

const helperSource = [
  extract('num', 'mean'),
  extract('mean', 'variance'),
  extract('variance', 'quantile'),
  extract('quantile', 'stats'),
  extract('stats', 'roleToKind'),
  extract('format', 'normContext'),
].join('\n');

const helpers = new Function(`${helperSource}\nreturn {num, stats, format};`)();
const { num, stats, format } = helpers;

function equal(actual, expected, label) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

for (const [input, expected, label] of [
  ['', null, 'empty string is missing'],
  ['   ', null, 'whitespace string is missing'],
  [null, null, 'null is missing'],
  [undefined, null, 'undefined is missing'],
  ['bad', null, 'invalid numeric text is missing'],
  [NaN, null, 'NaN is missing'],
  [Infinity, null, 'infinity is missing'],
  [0, 0, 'numeric zero is preserved'],
  ['0', 0, 'string zero is preserved'],
  [' 3.5 ', 3.5, 'trimmed finite numeric text is accepted'],
]) equal(num(input), expected, label);

const sample = stats(['', ' ', null, undefined, 'bad', 0, '0', '2']);
equal(sample.n, 3, 'stats exclude missing/invalid values without dropping zero');
equal(sample.min, 0, 'stats minimum preserves zero');
equal(sample.max, 2, 'stats maximum');
equal(sample.mean, 2 / 3, 'stats mean is not biased by missing values becoming zero');

equal(format(''), '—', 'blank display remains missing');
equal(format(null), '—', 'null display remains missing');
equal(format(0), '0', 'measured zero remains visible');

console.log('Process-data statistics regression passed: missing values stay missing and genuine zero remains numeric.');
