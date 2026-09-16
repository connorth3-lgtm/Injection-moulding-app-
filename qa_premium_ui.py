#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path): return (ROOT/path).read_text(encoding='utf-8')

version=json.loads(text('version.json'))
need(version.get('web_release')=='2026.09.16.1','premium UI release must be 2026.09.16.1')
css=text('premium-ui.css')
for marker in [
    '--mm-surface-0','--mm-accent','--mm-radius-xl','--mm-shadow-lg',
    '.sidebar{','.hero-main{','.mm-primary-hub','.lesson-body{','.exam-card{',
    '.table-wrap{','.modal-card{','.mobile-nav{','prefers-reduced-motion','forced-colors:active'
]:
    need(marker in css,f'premium UI stylesheet missing governed marker: {marker}')
need('http://' not in css and 'https://' not in css,'premium UI must remain fully local/offline')
need('@import' not in css.lower(),'premium UI must not import remote or implicit stylesheets')
# This is deliberately an overlay on the legacy shell. Freeze its override debt here so
# later visual work cannot silently turn the migration layer into an unbounded specificity stack.
need(css.count('!important') < 360,'premium UI override specificity grew beyond governed migration ceiling')

index=text('index.html')
need("['premium-ui.css','<link rel=\"stylesheet\" href=\"./premium-ui.css\">']" in index,'premium UI stylesheet must load in first-paint HEAD assets')
need('const SHELL_RELEASE="2026.09.16.1";' in index,'shell release marker stale')

sw=text('service-worker.js')
need("const CACHE_VERSION='2026.09.16.1';" in sw,'service-worker release marker stale')
need("'./premium-ui.css'" in sw,'premium UI stylesheet missing from atomic offline cache')

pwa=text('pwa-shell.js')
need("const RELEASE='2026.09.16.1';" in pwa,'PWA shell release marker stale')

pkg=json.loads(text('desktop/electron/package.json'))
extra=[str(x.get('from','')).replace('../../','') for x in pkg.get('build',{}).get('extraResources',[])]
need('premium-ui.css' in extra,'desktop package must include premium UI stylesheet')

integrity=text('desktop/electron/scripts/generate-integrity.cjs')
need("'premium-ui.css'" in integrity,'desktop integrity manifest must hash premium UI stylesheet')
desktop_qa=text('desktop/electron/scripts/qa.cjs')
need("'premium-ui.css'" in desktop_qa,'desktop QA must require premium UI stylesheet')

release_qa=text('qa_release.py')
need('"premium-ui.css"' in release_qa,'release QA must require premium UI offline governance')

mobile=text('.github/workflows/mobile-browser-qa.yml')
need("- '*.css'" in mobile,'Mobile Browser QA must trigger for root stylesheet changes')
need("- 'qa/**/*.spec.js'" in mobile,'Mobile Browser QA must trigger for learner browser specs')

permanent=text('.github/workflows/premium-ui-qa.yml')
for marker in ['python qa_premium_ui.py','playwright.premium.config.cjs','chromium-premium','webkit-premium','Upload premium UI review artifacts']:
    need(marker in permanent,f'permanent premium UI workflow missing: {marker}')

config=text('playwright.premium.config.cjs')
need("testMatch:/premium-ui\\.spec\\.js/" in config,'premium Playwright config must target premium-ui.spec.js')
need("baseURL:'http://127.0.0.1:4173'" in config,'premium Playwright config must bind the local review server')

spec=text('qa/premium-ui.spec.js')
for marker in ['premium UI stylesheet is active','no horizontal overflow','reduced motion','forced-colour-safe']:
    need(marker in spec,f'premium browser contract missing: {marker}')

print('PASS: premium industrial UI is first-paint, offline, desktop-integrity, accessibility and cross-browser-regression governed.')
