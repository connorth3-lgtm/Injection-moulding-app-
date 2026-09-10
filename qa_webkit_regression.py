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
need("'playwright.webkit-full.config.cjs'" in workflow,'Mobile Browser QA path filter does not track the full WebKit config')
need("'qa_webkit_regression.py'" in workflow,'Mobile Browser QA path filter does not track the WebKit coverage contract')

# Visual review is an approval gate, not a reason to discard the remaining
# browser evidence. Independent suites must run to completion and the final
# workflow step must still fail closed if any tolerated test outcome failed.
for step_id in ('visual_lock','chromium_regression','webkit_regression','cross_browser_smoke'):
    need(f'id: {step_id}\n        continue-on-error: true' in workflow,f'{step_id} must collect its outcome without short-circuiting later browser evidence')
need('name: Enforce browser and visual approval gates' in workflow,'Mobile Browser QA needs an explicit final fail-closed gate')
need(workflow.index('name: Upload browser QA artifacts') < workflow.index('name: Enforce browser and visual approval gates'),'browser artifacts must upload before the final approval gate is enforced')
for expression in (
    '${{ steps.visual_lock.outcome }}',
    '${{ steps.chromium_regression.outcome }}',
    '${{ steps.webkit_regression.outcome }}',
    '${{ steps.cross_browser_smoke.outcome }}',
):
    need(expression in workflow,f'final browser gate is not wired to {expression}')
need('check_gate "Immutable .25 visual baseline approval" "$VISUAL_OUTCOME"' in workflow,'immutable visual drift must remain fail-closed after evidence collection')
need('if [ "$failed" -ne 0 ]; then' in workflow and 'exit 1' in workflow,'final browser gate must fail the job when an approval/test outcome is unresolved')

print(f'MouldMaster WebKit regression contract passed ({len(webkit_specs)} substantive specs + tablet smoke; Chromium-only service-worker PWA lifecycle/transition and immutable visual baseline explicit; browser evidence remains complete before final fail-closed approval)')
