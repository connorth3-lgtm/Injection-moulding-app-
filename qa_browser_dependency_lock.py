from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
expected = {"@playwright/test": "1.55.0", "pixelmatch": "5.3.0", "pngjs": "7.0.0"}
need(pkg.get("private") is True, "browser QA package must be private")
need(pkg.get("devDependencies") == expected, "browser QA direct dependency pins drifted")
need(lock.get("lockfileVersion") == 3, "browser QA lockfileVersion must remain 3")
root = (lock.get("packages") or {}).get("") or {}
need(root.get("devDependencies") == expected, "browser QA lock root pins drifted")

expected_integrity = {
    "node_modules/@playwright/test": "sha512-04IXzPwHrW69XusN/SIdDdKZBzMfOT9UNT/YiJit/xpy2VuAoB8NHc8Aplb96zsWDddLnbkPL3TsmrS04ZU2xQ==",
    "node_modules/playwright": "sha512-sdCWStblvV1YU909Xqx0DhOjPZE4/5lJsIS84IfN9dAZfcl/CIZ5O8l3o0j7hPMjDvqoTF8ZUcc+i/GL5erstA==",
    "node_modules/playwright-core": "sha512-GvZs4vU3U5ro2nZpeiwyb0zuFaqb9sUiAJuyrWpcGouD8y9/HLgGbNRjIph7zU9D3hnPaisMl9zG9CgFi/biIg==",
    "node_modules/pixelmatch": "sha512-o8mkY4E/+LNUf6LzX96ht6k6CEDi65k9G2rjMtBe9Oo+VPKSvl+0GKHuH/AlG+GA5LPG/i5hrekkxUc3s2HU+Q==",
    "node_modules/pixelmatch/node_modules/pngjs": "sha512-TRzzuFRRmEoSW/p1KVAmiOgPco2Irlah+bGFCeNfJXxxYGwSw7YwAOAcd7X28K/m5bjBWKsC29KyoMfHbypayg==",
    "node_modules/pngjs": "sha512-LKWqWJRhstyYo9pGvgor/ivk2w94eSjE3RGVuzLGlr3NmD8bf7RcYGze1mNdEHRP6TRP6rMuDHk5t44hnTRyow==",
}
packages = lock.get("packages") or {}
need((packages.get("node_modules/@playwright/test") or {}).get("bin") == {"playwright": "cli.js"}, "Playwright test bin metadata drifted")
need((packages.get("node_modules/playwright") or {}).get("bin") == {"playwright": "cli.js"}, "Playwright bin metadata drifted")
need((packages.get("node_modules/playwright-core") or {}).get("bin") == {"playwright-core": "cli.js"}, "Playwright core bin metadata drifted")
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
