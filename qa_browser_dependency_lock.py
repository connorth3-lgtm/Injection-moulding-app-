from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
expected = {"@playwright/test": "1.63.0", "pixelmatch": "7.2.0", "pngjs": "7.0.0"}
need(pkg.get("private") is True, "browser QA package must be private")
need(pkg.get("devDependencies") == expected, "browser QA direct dependency pins drifted")
need(lock.get("lockfileVersion") == 3, "browser QA lockfileVersion must remain 3")
root = (lock.get("packages") or {}).get("") or {}
need(root.get("devDependencies") == expected, "browser QA lock root pins drifted")

expected_integrity = {
    "node_modules/@playwright/test": "sha512-oxMK4vllB9RK5NQ2l1pq1IfOf2AvnEuj/vYGDj0H2nMtmtZpKtCwt/l00GEO6xjGfpBNAvjovvYdCm50dRQkpQ==",
    "node_modules/playwright": "sha512-+7ziBLidS4NaNCdt57SUDT+wYmmd5fmiQejUic/kb+YsYSCPyOOE9sebzMjNmQrsnNpDJqd4WHvV/8lfKfUDUg==",
    "node_modules/playwright-core": "sha512-rYCsBF/M5HjUch52bbtVONEFjv6Xu8sm8h72dNlR5bzIE1fvC/bxgspzkjSfU+MweEMmPM8KJebG6nnyxo5mCg==",
    "node_modules/pixelmatch": "sha512-xhcb4yHu9sM/G7foGzoLtXYcC0zHEaOXXjRKhGup0fw78Nf2Tkiapv4EQyMzrbcmQPsllAI7DbFY2UT7PlI9Pg==",
    "node_modules/pngjs": "sha512-LKWqWJRhstyYo9pGvgor/ivk2w94eSjE3RGVuzLGlr3NmD8bf7RcYGze1mNdEHRP6TRP6rMuDHk5t44hnTRyow==",
}
packages = lock.get("packages") or {}
need((packages.get("node_modules/@playwright/test") or {}).get("bin") == {"playwright": "cli.js"}, "Playwright test bin metadata drifted")
need((packages.get("node_modules/playwright") or {}).get("bin") == {"playwright": "cli.js"}, "Playwright bin metadata drifted")
need((packages.get("node_modules/playwright-core") or {}).get("bin") == {"playwright-core": "cli.js"}, "Playwright core bin metadata drifted")
need((packages.get("node_modules/@playwright/test") or {}).get("engines", {}).get("node") == ">=20", "Playwright test Node floor drifted")
need((packages.get("node_modules/playwright") or {}).get("engines", {}).get("node") == ">=20", "Playwright Node floor drifted")
visual = (ROOT / "qa" / "visual-regression.spec.js").read_text(encoding="utf-8")
need("await import('pixelmatch')" in visual, "pixelmatch 7 must be loaded through ESM import")
need("checkerboard:false" in visual, "pixelmatch 7 must preserve the approved pre-v7 white-background transparency semantics")
for path, integrity in expected_integrity.items():
    need((packages.get(path) or {}).get("integrity") == integrity, f"browser QA lock integrity drifted: {path}")

workflows = [
    ".github/workflows/mobile-browser-qa.yml",
    ".github/workflows/ux-polish-qa.yml",
    ".github/workflows/premium-ui-qa.yml",
    ".github/workflows/adversarial-5000.yml",
]
for rel in workflows:
    content = (ROOT / rel).read_text(encoding="utf-8")
    need("npm ci --no-audit --fund=false" in content, f"{rel} must install the committed QA lock with npm ci")
    need("npm install --no-save" not in content and "--no-package-lock" not in content, f"{rel} reintroduced an unlocked browser QA install")

print("Browser QA dependency lock passed: Playwright/pixelmatch/pngjs direct and transitive package integrity is committed and workflows use npm ci.")
