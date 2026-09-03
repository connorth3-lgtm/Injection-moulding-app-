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
expected_webkit=chromium_specs-{'pwa-lifecycle\\.spec\\.js'}
need('pwa-lifecycle\\.spec\\.js' in chromium_specs,'Chromium PWA lifecycle regression is missing')
need(webkit_specs==expected_webkit,f'WebKit substantive coverage drifted: {sorted(webkit_specs)} != {sorted(expected_webkit)}')
need("browserName:'webkit'" in webkit,'full WebKit config must run WebKit')
need("serviceWorkers:'block'" in webkit,'WebKit config must explicitly exclude Playwright-unsupported service-worker instrumentation')
need("devices['Desktop Safari']" in webkit,'WebKit full regression must keep desktop Safari-like device defaults')
need("name:'webkit-tablet'" in cross and "devices['iPad (gen 7)']" in cross,'existing WebKit tablet smoke coverage must remain')
need('npx playwright test --config=playwright.webkit-full.config.cjs' in workflow,'Mobile Browser QA does not execute full WebKit substantive regression')
need("'playwright.webkit-full.config.cjs'" in workflow,'Mobile Browser QA path filter does not track the full WebKit config')
need("'qa_webkit_regression.py'" in workflow,'Mobile Browser QA path filter does not track the WebKit coverage contract')
print(f'MouldMaster WebKit regression contract passed ({len(webkit_specs)} substantive specs + tablet smoke; Chromium-only PWA lifecycle explicit)')
