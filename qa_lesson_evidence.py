from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / 'lesson-evidence-gap-report.json'


def need(condition, message):
    if not condition:
        raise AssertionError(message)


def text(name):
    return (ROOT / name).read_text(encoding='utf-8')


for name in ['MouldMaster_Core_App.html', 'source-library.js', 'assessment-evidence-sources.js', 'lesson-evidence-depth.js']:
    need((ROOT / name).exists(), f'lesson evidence dependency missing: {name}')

core = text('MouldMaster_Core_App.html')
marker = 'window.MM_DATA = '
need(marker in core, 'canonical MM_DATA marker missing')
start = core.index(marker) + len(marker)
raw = core[start:].lstrip()
data, consumed = json.JSONDecoder().raw_decode(raw)
lessons = data.get('lessons', [])
courses = data.get('courses', [])
need(len(lessons) == 120, f'expected 120 canonical lessons, found {len(lessons)}')
need(len(courses) == 12, f'expected 12 canonical courses, found {len(courses)}')
need(len({x.get("id") for x in lessons}) == 120, 'lesson IDs must be unique')
need(len({x.get("title") for x in lessons}) == 120, 'lesson titles must be unique')

module = text('lesson-evidence-depth.js')
for required in [
    'EUROMAP 77 — IMM/MES data exchange',
    'FDA — Process Validation: General Principles and Practices',
    'Autodesk Moldflow — Draft Angle result',
    'topicSources',
    "'fallback-only'",
    'MM_LESSON_EVIDENCE_AUDIT',
    'not universal production recipes',
]:
    need(required in module, f'lesson evidence depth marker missing: {required}')
need('http://' not in module, 'lesson evidence sources must use HTTPS')

node = r"""
const fs=require('fs'),path=require('path');
global.window=global;
global.location={href:'https://mouldmaster.test/'};
global.document={readyState:'loading',documentElement:null,addEventListener(){},querySelector(){return null},createElement(){return {}}};
global.MutationObserver=class{observe(){}};
global.requestAnimationFrame=fn=>fn();
for(const name of ['assessment-evidence-sources.js','source-library.js','lesson-evidence-depth.js']) require(path.resolve(process.cwd(),name));
const lessons=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(!global.MM_LESSON_EVIDENCE_AUDIT) throw new Error('lesson evidence audit API missing');
process.stdout.write(JSON.stringify(global.MM_LESSON_EVIDENCE_AUDIT.auditAll(lessons)));
"""

helper = None
data_file = None
try:
    with tempfile.NamedTemporaryFile('w', suffix='.cjs', delete=False, encoding='utf-8') as f:
        f.write(node)
        helper = Path(f.name)
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False)
        data_file = Path(f.name)
    p = subprocess.run(['node', str(helper), str(data_file)], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    need(p.returncode == 0, 'lesson evidence runtime audit failed: ' + p.stderr[:2000])
    audit = json.loads(p.stdout)
finally:
    if helper:
        helper.unlink(missing_ok=True)
    if data_file:
        data_file.unlink(missing_ok=True)

rows = audit.get('lessons', [])
counts = audit.get('counts', {})
need(audit.get('total') == 120 and len(rows) == 120, 'lesson evidence audit must cover all 120 lessons')
need(counts.get('fallback-only') == 0, 'topic evidence gap remains: ' + ', '.join(x['title'] for x in rows if x['status'] == 'fallback-only'))
need(counts.get('strong', 0) >= 90, f'lesson evidence depth too shallow: only {counts.get("strong", 0)} lessons have 2+ topic-specific sources')
need({x.get('course') for x in rows} == {x.get('name') for x in courses}, 'lesson evidence audit must represent all 12 courses')

for row in rows:
    need(row.get('topicCount', 0) >= 1, f'lesson {row.get("id")} has no topic-specific source')
    need(1 <= row.get('displayCount', 0) <= 5, f'lesson {row.get("id")} display source count outside 1..5')
    urls = [s.get('url', '') for s in row.get('topicSources', [])]
    need(all(u.startswith('https://') for u in urls), f'lesson {row.get("id")} has non-HTTPS topic source')
    need(len(urls) == len(set(urls)), f'lesson {row.get("id")} has duplicate topic sources')

by_title = {x['title']: x for x in rows}
for title, needle in {
    'IQ concepts': 'fda.gov',
    'OQ concepts': 'fda.gov',
    'PQ concepts': 'fda.gov',
    'MES basics': 'euromap.org/euromap77',
    'Traceability': 'euromap.org/euromap77',
    'Draft and texture': 'help.autodesk.com',
    'Ejection': 'help.autodesk.com',
    'Vision inspection': 'doi.org/10.3390/pr11020411',
    'Maintenance-process interaction': 'doi.org/10.3390/app15169259',
}.items():
    need(any(needle.lower() in s['url'].lower() for s in by_title[title]['topicSources']), f'{title} missing required topic evidence family')

report = {
    'schema': 1,
    'audit_version': audit.get('version'),
    'total_lessons': 120,
    'course_count': 12,
    'counts': counts,
    'fallback_only': [x for x in rows if x['status'] == 'fallback-only'],
    'supported_only': [x for x in rows if x['status'] == 'supported'],
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f"MouldMaster lesson evidence QA passed (120 lessons; {counts.get('strong',0)} strong; {counts.get('supported',0)} supported; 0 fallback-only)")
