from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent

def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

def specs(source):
    return set(re.findall(r"/([a-z0-9-]+\\\.spec\\\.js)/",source))

chromium=text('playwright.config.cjs')
webkit=text('playwright.webkit-full.config.cjs')
cross=text('playwright.cross-browser.config.cjs')
workflow=text('.github/workflows/mobile-browser-qa.yml')

chromium_specs=specs(chromium)
webkit_specs=specs(webkit)
chromium_only_pwa={'pwa-lifecycle\\.spec\\.js','pwa-two-release-transition\\.spec\\.js'}
expected_webkit=chromium_specs-chromium_only_pwa-{'visual-regression\\.spec\\.js'}
need(chromium_only_pwa <= chromium_specs,'Chromium PWA lifecycle/transition regressions are missing')
need('visual-regression\\.spec\\.js' in chromium_specs,'Chromium immutable visual regression is missing')
need(webkit_specs==expected_webkit,f'WebKit substantive coverage drifted: {sorted(webkit_specs)} != {sorted(expected_webkit)}')
need("browserName:'webkit'" in webkit,'full WebKit config must run WebKit')
need("serviceWorkers:'block'" in webkit,'WebKit config must explicitly exclude Playwright-unsupported service-worker instrumentation')
need("devices['Desktop Safari']" in webkit,'WebKit full regression must keep desktop Safari-like device defaults')
need("name:'webkit-tablet'" in cross and "devices['iPad (gen 7)']" in cross,'existing WebKit tablet smoke coverage must remain')
need('npx playwright test --config=playwright.webkit-full.config.cjs' in workflow,'Mobile Browser QA does not execute full WebKit substantive regression')
preview_universal_trigger="push:\n    branches: [main, preview]\n  workflow_dispatch:" in workflow
if not preview_universal_trigger:
    need("'playwright.webkit-full.config.cjs'" in workflow,'Mobile Browser QA path filter does not track the full WebKit config')
    need("'qa_webkit_regression.py'" in workflow,'Mobile Browser QA path filter does not track the WebKit coverage contract')
else:
    need("branches: [main, preview]" in workflow,'Mobile Browser QA universal trigger must include preview')

# Heavy browser evidence is fanned out across independent jobs so one slow suite
# does not serialize unrelated coverage. The final mobile-browser job remains the
# single fail-closed deployment gate.
for job in ('browser-chromium:','browser-webkit:','browser-cross:','app-500-reliability:','mobile-browser:'):
    need(job in workflow,f'Mobile Browser QA parallel job missing: {job}')
need('matrix:\n        shard: [1, 2, 3, 4, 5]' in workflow,'500-run reliability suite must be split across five shards')
need('fail-fast: false' in workflow,'reliability shards must all complete for full evidence')
need('--shard=${{ matrix.shard }}/5' in workflow,'Playwright reliability sharding is not wired')
need('npx playwright test --config=playwright.substantive.config.cjs' in workflow,'Chromium substantive suite missing')
substantive=text('playwright.substantive.config.cjs')
need("require('./playwright.config.cjs')" in substantive,'substantive Chromium suite must inherit the full Chromium regression configuration')
need(r"testIgnore:/visual-regression\.spec\.js/" in substantive,'substantive Chromium must exclude the separately served immutable visual test file')
need('npx playwright test --config=playwright.webkit-full.config.cjs' in workflow,'WebKit substantive suite missing')
need('npx playwright test --config=playwright.cross-browser.config.cjs' in workflow,'cross-browser smoke suite missing')
need('npx playwright test --config=playwright.reachability.config.cjs' in workflow,'feature reachability suite missing')
need('npx playwright test qa/visual-regression.spec.js --config=playwright.config.cjs' in workflow,'approved visual regression gate missing')
need("id: visual" in workflow,'visual regression step must expose its exact outcome')
need("continue-on-error: ${{ github.base_ref == 'preview' || github.ref_name == 'preview' }}" in workflow,'preview visual drift must remain a non-blocking human HOLD while main remains fail-closed')
need("Record preview visual-baseline HOLD" in workflow and "human visual-baseline approval remains HOLD" in workflow,'preview visual-baseline HOLD must be explicit')
need("protected-main release" in workflow,'visual baseline must remain blocking before protected main release')
need('needs: [browser-chromium, browser-webkit, browser-cross, app-500-reliability]' in workflow,'mobile-browser aggregator must depend on all browser jobs and all reliability shards')
need('name: Enforce complete mobile browser evidence' in workflow,'mobile-browser aggregator must fail closed across all browser evidence')
for expression in (
    '${{ needs.browser-chromium.result }}',
    '${{ needs.browser-webkit.result }}',
    '${{ needs.browser-cross.result }}',
    '${{ needs.app-500-reliability.result }}',
):
    need(expression in workflow,f'mobile-browser aggregator is not wired to {expression}')
need('All five reliability shards did not pass' in workflow,'reliability shard failures must fail the aggregate gate')

print(f'MouldMaster WebKit regression contract passed ({len(webkit_specs)} substantive specs + tablet smoke; Chromium-only service-worker PWA lifecycle/transition explicit; preview visual drift remains a human HOLD while protected-main approval stays fail-closed; substantive browser evidence remains complete before automated preview approval)')
