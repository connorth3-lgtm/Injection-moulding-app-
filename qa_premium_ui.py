#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path): return (ROOT/path).read_text(encoding='utf-8')

version=json.loads(text('version.json'))
release=str(version.get('web_release') or '')
need(re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+',release) is not None,'premium UI requires a governed web release identity')
css=text('premium-ui.css')
dynamic=text('premium-dynamic.css')
for marker in [
    '--mm-surface-0','--mm-accent','--mm-radius-xl','--mm-shadow-lg',
    '.sidebar{','.hero-main{','.mm-primary-hub','.lesson-body{','.exam-card{',
    '.table-wrap{','.modal-card{','.mobile-nav{','prefers-reduced-motion','forced-colors:active'
]:
    need(marker in css,f'premium UI stylesheet missing governed marker: {marker}')
need('http://' not in css and 'https://' not in css,'premium UI must remain fully local/offline')
need('@import' not in css.lower(),'premium UI must not import remote or implicit stylesheets')
need('http://' not in dynamic and 'https://' not in dynamic,'premium dynamic UI must remain fully local/offline')
need('@import' not in dynamic.lower(),'premium dynamic UI must not import remote or implicit stylesheets')
for marker in ['.mm-today-focus','.mm-learning-progress','.mm-next-card','prefers-reduced-motion','forced-colors:active']:
    need(marker in dynamic,f'premium dynamic stylesheet missing governed marker: {marker}')
# This is deliberately an overlay on the legacy shell. The initial migration measured 367
# explicit overrides. Freeze that debt: later work may reduce it, but any increase needs an
# intentional governance change rather than silently growing the specificity stack.
important_count=css.count('!important')
need(important_count <= 372,'premium UI override specificity grew beyond governed refinement ceiling')
# Consolidation ratchet: the legacy overlay may shrink but must never regain specificity debt.
need('body #dashboard' not in css,'canonical dynamic dashboard surfaces must stay out of the legacy premium overlay')
need(len(css.encode('utf-8')) <= 26000,'premium UI CSS exceeded the 26 KB presentation budget')
need(len(dynamic.encode('utf-8')) <= 7000,'premium dynamic CSS exceeded the 7 KB presentation budget')

index=text('index.html')
need("['premium-ui.css','<link rel=\"stylesheet\" href=\"./premium-ui.css\">']" in index,'premium UI stylesheet must load in first-paint HEAD assets')
need("['premium-dynamic.css','<link rel=\"stylesheet\" href=\"./premium-dynamic.css\">']" in index,'premium dynamic stylesheet must load after the governed premium layer')
need(index.index("['premium-ui.css'") < index.index("['premium-dynamic.css'"),'premium dynamic stylesheet must load after premium-ui.css')
need(f'const SHELL_RELEASE="{release}";' in index,'shell release marker stale')

sw=text('service-worker.js')
need(f"const CACHE_VERSION='{release}';" in sw,'service-worker release marker stale')
need("'./premium-ui.css'" in sw,'premium UI stylesheet missing from atomic offline cache')
need("'./premium-dynamic.css'" in sw,'premium dynamic stylesheet missing from atomic offline cache')

pwa=text('pwa-shell.js')
need(f"const RELEASE='{release}';" in pwa,'PWA shell release marker stale')

pkg=json.loads(text('desktop/electron/package.json'))
extra=[str(x.get('from','')).replace('../../','') for x in pkg.get('build',{}).get('extraResources',[])]
need('premium-ui.css' in extra,'desktop package must include premium UI stylesheet')
need('premium-dynamic.css' in extra,'desktop package must include premium dynamic stylesheet')

integrity=text('desktop/electron/scripts/generate-integrity.cjs')
need("'premium-ui.css'" in integrity,'desktop integrity manifest must hash premium UI stylesheet')
need("'premium-dynamic.css'" in integrity,'desktop integrity manifest must hash premium dynamic stylesheet')
desktop_qa=text('desktop/electron/scripts/qa.cjs')
need("'premium-ui.css'" in desktop_qa,'desktop QA must require premium UI stylesheet')
need("'premium-dynamic.css'" in desktop_qa,'desktop QA must require premium dynamic stylesheet')

release_qa=text('qa_release.py')
need('"premium-ui.css"' in release_qa,'release QA must require premium UI offline governance')
need('"premium-dynamic.css"' in release_qa,'release QA must require premium dynamic offline governance')

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

print(f'PASS: premium industrial UI is first-paint, offline, desktop-integrity, accessibility and cross-browser-regression governed for {release}; legacy !important debt={important_count}.')
