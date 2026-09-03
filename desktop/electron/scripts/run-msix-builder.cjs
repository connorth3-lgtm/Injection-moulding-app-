'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const EXPECTED_VERSION = '27.0.0-alpha.7';
const toolchainRoot = path.resolve(__dirname, '..', 'msix-toolchain');
const packageJsonPath = path.join(toolchainRoot, 'node_modules', 'electron-builder', 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('Locked MSIX toolchain is not installed. Run npm ci in desktop/electron/msix-toolchain first.');
  process.exit(2);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (pkg.version !== EXPECTED_VERSION) {
  console.error(`MSIX builder version mismatch: expected ${EXPECTED_VERSION}, got ${pkg.version || '<missing>'}`);
  process.exit(2);
}

const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin['electron-builder'];
if (!bin) {
  console.error('Locked MSIX electron-builder package does not expose the electron-builder CLI.');
  process.exit(2);
}

const cliPath = path.resolve(path.dirname(packageJsonPath), bin);
if (!fs.existsSync(cliPath)) {
  console.error(`Locked MSIX electron-builder CLI is missing: ${cliPath}`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--verify-toolchain') {
  console.log(`electron-builder ${pkg.version} (${cliPath})`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [cliPath, ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error);
  process.exit(2);
}
process.exit(result.status == null ? 1 : result.status);
