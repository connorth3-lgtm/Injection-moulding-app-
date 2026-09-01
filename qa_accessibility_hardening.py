from pathlib import Path

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'accessibility-hardening.js').read_text(encoding='utf-8')
for marker in ['aria-modal','aria-labelledby','Close dialog','focusTrap:true','focusRestore:true','forced-colors:active','prefers-contrast:more','noopener','noreferrer','role\',\'status','formal WCAG conformance still requires manual']:
    need(marker in src,f'accessibility hardening marker missing: {marker}')
need("e.key!=='Tab'" in src,'dialog keyboard focus trap missing')
need('lastFocus.focus' in src,'dialog focus restoration missing')
need('img:not([alt])' in src,'missing-image-alt fallback missing')
need('a[target="_blank"]' in src,'external link isolation scan missing')
print('MouldMaster accessibility hardening QA passed (dialog focus containment/restore, live status, forced colors/contrast, safer external links)')
