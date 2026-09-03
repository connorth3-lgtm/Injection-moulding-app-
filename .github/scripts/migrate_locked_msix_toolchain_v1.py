#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


write(
    "desktop/electron/msix-toolchain/package.json",
    """{
  \"name\": \"mouldmaster-msix-toolchain\",
  \"version\": \"1.0.0\",
  \"private\": true,
  \"description\": \"Isolated reproducible MSIX packaging toolchain for MouldMaster Academy.\",
  \"engines\": {
    \"node\": \">=22.12.0\"
  },
  \"devDependencies\": {
    \"electron-builder\": \"27.0.0-alpha.7\"
  }
}
""",
)

pkg = read("desktop/electron/package.json")
pkg = replace_once(
    pkg,
    "npx --yes electron-builder@27.0.0-alpha.7 --win msix",
    "node scripts/run-msix-builder.cjs --win msix",
    "desktop package MSIX command",
)
write("desktop/electron/package.json", pkg)

write(
    "desktop/electron/scripts/run-msix-builder.cjs",
    """'use strict';

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

const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error);
  process.exit(2);
}
process.exit(result.status == null ? 1 : result.status);
""",
)

store = read(".github/workflows/microsoft-store-msix.yml")
store = replace_once(
    store,
    "          cache-dependency-path: desktop/electron/package-lock.json\n",
    "          cache-dependency-path: |\n            desktop/electron/package-lock.json\n            desktop/electron/msix-toolchain/package-lock.json\n",
    "Store workflow npm cache lock inputs",
)
store = replace_once(
    store,
    "      - name: Generate verified application evidence\n",
    "      - name: Install exact locked MSIX toolchain\n        working-directory: desktop/electron/msix-toolchain\n        run: npm ci --no-audit --fund=false\n      - name: Verify exact locked MSIX builder\n        working-directory: desktop/electron\n        run: node scripts/run-msix-builder.cjs --version\n      - name: Generate verified application evidence\n",
    "Store workflow toolchain install",
)
store = replace_once(
    store,
    "npx --yes electron-builder@27.0.0-alpha.7 --win msix --x64 --arm64",
    "node scripts/run-msix-builder.cjs --win msix --x64 --arm64",
    "Store workflow MSIX command",
)
write(".github/workflows/microsoft-store-msix.yml", store)

lock_wf = read(".github/workflows/desktop-dependency-lock.yml")
old_path = "      - 'desktop/electron/package-lock.json'\n"
new_path = (
    "      - 'desktop/electron/package-lock.json'\n"
    "      - 'desktop/electron/msix-toolchain/package.json'\n"
    "      - 'desktop/electron/msix-toolchain/package-lock.json'\n"
    "      - 'desktop/electron/scripts/run-msix-builder.cjs'\n"
)
if lock_wf.count(old_path) != 2:
    raise SystemExit(f"Desktop dependency lock paths: expected two matches, found {lock_wf.count(old_path)}")
lock_wf = lock_wf.replace(old_path, new_path)
lock_wf = lock_wf.replace("actions/checkout@v4", "actions/checkout@v7")
lock_wf = lock_wf.replace("actions/setup-node@v4", "actions/setup-node@v7")
lock_wf = replace_once(
    lock_wf,
    "      - uses: actions/setup-node@v7\n        with:\n          node-version: '22.12.0'\n",
    "      - uses: actions/setup-node@v7\n        with:\n          node-version: '22.12.0'\n          cache: 'npm'\n          cache-dependency-path: |\n            desktop/electron/package-lock.json\n            desktop/electron/msix-toolchain/package-lock.json\n",
    "Desktop dependency lock setup-node",
)
old_step = """      - name: Verify exact npm dependency lock
        working-directory: desktop/electron
        shell: bash
        run: |
          set -euo pipefail
          npm install --package-lock-only --ignore-scripts --no-audit --fund=false
          if ! git diff --exit-code -- package-lock.json; then
            echo '::error::desktop/electron/package-lock.json is not synchronized with package.json. Regenerate it in the same pull request.'
            exit 1
          fi
          git ls-files --error-unmatch package-lock.json >/dev/null
          echo 'desktop/electron/package-lock.json is committed and synchronized.'
"""
new_step = """      - name: Verify exact npm dependency locks and isolated builders
        shell: bash
        run: |
          set -euo pipefail
          npm ci --prefix desktop/electron --ignore-scripts --no-audit --fund=false
          npm ci --prefix desktop/electron/msix-toolchain --ignore-scripts --no-audit --fund=false
          node -e \"const p=require('./desktop/electron/node_modules/electron-builder/package.json'); if(p.version!=='26.15.7') throw new Error('root electron-builder drift: '+p.version)\"
          node desktop/electron/scripts/run-msix-builder.cjs --version
          git ls-files --error-unmatch desktop/electron/package-lock.json >/dev/null
          git ls-files --error-unmatch desktop/electron/msix-toolchain/package-lock.json >/dev/null
          git diff --exit-code -- desktop/electron/package-lock.json desktop/electron/msix-toolchain/package-lock.json
          echo 'Desktop portable/NSIS and isolated MSIX dependency locks are committed and reproducible.'
"""
lock_wf = replace_once(lock_wf, old_step, new_step, "Desktop dependency lock verification")
write(".github/workflows/desktop-dependency-lock.yml", lock_wf)

qa = read("qa_store_submission.py")
qa = replace_once(
    qa,
    "workflow = text(store_workflow_path)\n",
    "workflow = text(store_workflow_path)\ndesktop_pkg = json.loads(text(ROOT / 'desktop/electron/package.json'))\ndesktop_lock = json.loads(text(ROOT / 'desktop/electron/package-lock.json'))\nmsix_pkg = json.loads(text(ROOT / 'desktop/electron/msix-toolchain/package.json'))\nmsix_lock = json.loads(text(ROOT / 'desktop/electron/msix-toolchain/package-lock.json'))\nmsix_runner = text(ROOT / 'desktop/electron/scripts/run-msix-builder.cjs')\ndependency_lock_workflow = text(ROOT / '.github/workflows/desktop-dependency-lock.yml')\n",
    "Store QA toolchain inputs",
)
checks = """# MSIX packaging must be reproducible and isolated from the stable portable/NSIS builder.
require(desktop_pkg['devDependencies'].get('electron-builder') == '26.15.7', 'portable/NSIS electron-builder pin changed unexpectedly')
require('node scripts/run-msix-builder.cjs --win msix' in desktop_pkg['scripts'].get('dist:msix', ''), 'desktop MSIX script must use the locked local runner')
require('npx --yes electron-builder' not in desktop_pkg['scripts'].get('dist:msix', ''), 'desktop MSIX script must not resolve a builder from the network at execution time')
require(desktop_lock['packages']['']['devDependencies'].get('electron-builder') == '26.15.7', 'root desktop lock must preserve electron-builder 26.15.7')
require(msix_pkg.get('devDependencies', {}).get('electron-builder') == '27.0.0-alpha.7', 'MSIX toolchain must pin electron-builder 27.0.0-alpha.7 exactly')
locked_msix = msix_lock.get('packages', {}).get('node_modules/electron-builder')
require(locked_msix is not None and locked_msix.get('version') == '27.0.0-alpha.7', 'MSIX lockfile must resolve electron-builder 27.0.0-alpha.7 exactly')
require(bool(locked_msix.get('resolved')) and bool(locked_msix.get('integrity')), 'MSIX electron-builder lock entry must include resolved tarball and integrity')
require(re.fullmatch(r'sha512-[A-Za-z0-9+/=]+', locked_msix.get('integrity', '')) is not None, 'MSIX electron-builder lock integrity must be SHA-512')
require(\"EXPECTED_VERSION = '27.0.0-alpha.7'\" in msix_runner, 'MSIX runner must fail closed on builder version drift')
require('msix-toolchain' in msix_runner and 'node_modules' in msix_runner and 'spawnSync' in msix_runner, 'MSIX runner must execute only the isolated installed toolchain')
require('npx --yes electron-builder' not in workflow, 'Store workflow must not download electron-builder at package time')
require('desktop/electron/msix-toolchain/package-lock.json' in workflow, 'Store workflow cache must include the MSIX lockfile')
require('working-directory: desktop/electron/msix-toolchain' in workflow and 'npm ci --no-audit --fund=false' in workflow, 'Store workflow must install the isolated MSIX toolchain with npm ci')
require('node scripts/run-msix-builder.cjs --version' in workflow and 'node scripts/run-msix-builder.cjs --win msix --x64 --arm64' in workflow, 'Store workflow must verify and use the locked local MSIX runner')
require('npm ci --prefix desktop/electron' in dependency_lock_workflow and 'npm ci --prefix desktop/electron/msix-toolchain' in dependency_lock_workflow, 'dependency-lock CI must prove both npm lockfiles with npm ci')
require('root electron-builder drift' in dependency_lock_workflow and 'run-msix-builder.cjs --version' in dependency_lock_workflow, 'dependency-lock CI must prove builder isolation')

"""
qa = replace_once(
    qa,
    "# Current Microsoft Store trust boundary: Store MSIX gets Microsoft signing only after certification.\n",
    checks + "# Current Microsoft Store trust boundary: Store MSIX gets Microsoft signing only after certification.\n",
    "Store QA reproducibility checks",
)
write("qa_store_submission.py", qa)

print("Prepared isolated locked MSIX toolchain migration")
