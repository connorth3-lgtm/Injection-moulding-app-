from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
JS = (ROOT / 'diagnostic-learning-labs.js').read_text(encoding='utf-8')
INDEX = (ROOT / 'index.html').read_text(encoding='utf-8')
SW = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
PKG = (ROOT / 'desktop' / 'electron' / 'package.json').read_text(encoding='utf-8')
INTEGRITY = (ROOT / 'desktop' / 'electron' / 'scripts' / 'generate-integrity.cjs').read_text(encoding='utf-8')


def need(condition, message):
    if not condition:
        raise AssertionError(message)


need("MM_DIAGNOSTIC_LABS" in JS, 'diagnostic lab public metadata missing')
need("learner-scoped local progress only" in JS, 'diagnostic progress must remain local/learner scoped')
need("Training boundary:" in JS, 'educational/production boundary missing')
need("not universal production recipes" in JS, 'universal-recipe warning missing')
need("Verify the exact resin grade" in JS, 'grade/machine/mould verification warning missing')
need("Diagnostic Learning Labs" in JS and "Evidence-first practice" in JS, 'diagnostic learning UI missing')
need("Observe" in JS and "Best next test" in JS and "Controlled response" in JS and "Explain" in JS, 'learning-loop stages incomplete')

ids = re.findall(r"\n\s*id:'([a-z0-9-]+)'", JS)
need(len(ids) >= 8, f'expected at least 8 diagnostic labs, found {len(ids)}')
need(len(ids) == len(set(ids)), 'diagnostic lab IDs must be unique')
for expected in [
    'cavity-short-shot',
    'splay-moisture',
    'pressure-limited-fill',
    'check-ring-repeatability',
    'cooling-warpage',
    'gate-seal-study',
    'measurement-noise',
    'hot-runner-imbalance',
    'local-flash',
]:
    need(expected in ids, f'missing diagnostic lab: {expected}')

for concept in [
    'Cavity-to-cavity imbalance',
    'Material moisture actual',
    'Pressure-limited fill detection',
    'Check-ring repeatability study',
    'Cooling-circuit baseline',
    'Gate-seal study',
    'Measurement system analysis',
    'Hot-runner branch balance check',
    'Parting line',
]:
    need(concept in JS, f'reference-data concept not connected to labs: {concept}')

need('disable mould protection so the tool closes harder' in JS, 'expected safety distractor missing')
need('Safeguards must never be bypassed' in JS, 'safety distractor must be explicitly rejected')
need('bypass guards' not in JS.lower(), 'unsafe bypass instruction detected')
need('defeat interlocks' not in JS.lower(), 'unsafe interlock-defeat instruction detected')

asset = './diagnostic-learning-labs.js'
need(asset in INDEX, 'browser shell does not load diagnostic learning labs')
need(asset in SW, 'diagnostic learning labs missing from offline cache')
need('../../diagnostic-learning-labs.js' in PKG, 'desktop package does not include diagnostic learning labs')
need("'diagnostic-learning-labs.js'" in INTEGRITY, 'desktop integrity manifest generator does not cover diagnostic learning labs')

need('data-mm-diagnostic-labs' in JS, 'desktop/sidebar launcher missing')
need('data-mm-diagnostic-menu' in JS, 'mobile More-menu launcher missing')
need("button[data-view=\"scenarios\"]" in JS, 'practice-area return path missing')
need('localStorage' in JS and 'fetch(' not in JS, 'diagnostic progress must not upload or fetch production data')

print(f'MouldMaster diagnostic learning QA passed ({len(ids)} labs)')
