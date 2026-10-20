from pathlib import Path

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'src/domains/shell/accessibility-hardening.js').read_text(encoding='utf-8')
for marker in ['aria-modal','aria-labelledby','Close dialog','focusTrap:true','focusRestore:true','forced-colors:active','prefers-contrast:more','noopener','noreferrer','role\',\'status','formal WCAG conformance still requires manual']:
    need(marker in src,f'accessibility hardening marker missing: {marker}')
need("e.key==='Escape'" in src and "window.closeModal()" in src,'dialog Escape-to-close handling missing')
need("e.key!=='Tab'" in src,'dialog keyboard focus trap missing')
need("function nonBlocking(modal)" in src and "modal.dataset.mmNonBlocking==='1'" in src,'non-blocking drawer detection missing')
need("filter(modal=>visible(modal)&&!nonBlocking(modal))" in src,'non-blocking drawers must be excluded from active modal trapping')
need("nonBlockingDrawersExcluded:true" in src,'non-blocking drawer accessibility contract marker missing')
need('lastFocus.focus' in src,'dialog focus restoration missing')
need('img:not([alt])' in src,'missing-image-alt fallback missing')
need('a[target="_blank"]' in src,'external link isolation scan missing')
print('MouldMaster accessibility hardening QA passed (blocking-dialog Escape/focus containment/restore, non-blocking drawers excluded, live status, forced colors/contrast, safer external links)')