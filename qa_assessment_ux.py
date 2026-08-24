from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise AssertionError(message)


ux = (ROOT / 'assessment-ux.js').read_text(encoding='utf-8')
index = (ROOT / 'index.html').read_text(encoding='utf-8')
sw = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
integrity = (ROOT / 'desktop/electron/scripts/generate-integrity.cjs').read_text(encoding='utf-8')
pkg = json.loads((ROOT / 'desktop/electron/package.json').read_text(encoding='utf-8'))

for marker in [
    'mm-focus-mode',
    'mm-option-selected',
    'mm-step-answered',
    'aria-live',
    'Review unanswered',
    'grade.disabled',
    'mm-exam-reviewed',
    'window.startExam=function',
    'window.gradeExam=function',
]:
    require(marker in ux, f'assessment UX safeguard missing: {marker}')

require('D.exams' not in ux, 'assessment UX layer must not rewrite the exam question bank')
require('activeExam.questions=' not in ux, 'assessment UX layer must not rewrite active assessment questions')
require("['./assessment-ux.js','<script src=\"./assessment-ux.js\">']" in index, 'assessment UX must load from the runtime bootstrap')
require(index.find('assessment-final-hardening.js') < index.find('assessment-ux.js'), 'assessment UX must load after final assessment hardening')
require("'./assessment-ux.js'" in sw, 'assessment UX must be available offline')
require("'assessment-ux.js'" in integrity, 'desktop integrity manifest must include assessment UX')
extra = pkg['build']['extraResources']
from_paths = {x.get('from') for x in extra if isinstance(x, dict)}
require('../../assessment-ux.js' in from_paths, 'desktop bundle must include assessment UX')

print('MouldMaster assessment UX QA passed')
