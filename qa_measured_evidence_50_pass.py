from pathlib import Path
from collections import Counter
import json
import re

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data' / 'measured-evidence-50-pass.json'
DOC = ROOT / 'sources' / 'MEASURED_EVIDENCE_50_PASS.md'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def read(path):
    return path.read_text(encoding='utf-8')


need(DATA.exists(), 'measured-evidence registry missing')
obj = json.loads(read(DATA))
passes = obj.get('passes', [])
themes = obj.get('themes', [])
need(obj.get('schema') == 1, 'measured-evidence schema drifted')
need(len(themes) == 10 and len(set(themes)) == 10, 'expected 10 unique measured-evidence themes')
need(len(passes) == 50, f'expected 50 measured-evidence passes, got {len(passes)}')
need([p.get('pass') for p in passes] == list(range(1, 51)), 'measured-evidence pass numbers must be exactly 1..50')
ids = [p.get('id') for p in passes]
need(len(set(ids)) == 50 and all(ids), 'measured-evidence pass IDs must be non-empty and unique')
urls = [p.get('sourceUrl') for p in passes]
need(len(set(urls)) == 50, 'each measured-evidence pass must currently point to a distinct primary source/dataset URL')

required = {'pass','id','theme','evidenceType','sourceTitle','sourceUrl','access','measuredSignals','learningUse','limitation'}
theme_counts = Counter()
type_counts = Counter()
for p in passes:
    need(set(p) == required, f"{p.get('id')} measured-evidence schema fields drifted: {set(p)}")
    need(p['theme'] in themes, f"{p['id']} uses an unknown theme")
    theme_counts[p['theme']] += 1
    type_counts[p['evidenceType']] += 1
    need(p['evidenceType'] in {'open-measured-dataset','embargoed-measured-dataset','primary-measured-study'}, f"{p['id']} has an unsupported evidence type")
    need(isinstance(p['sourceTitle'], str) and len(p['sourceTitle']) >= 16, f"{p['id']} needs a meaningful source title")
    need(re.match(r'^https://', p['sourceUrl']) is not None, f"{p['id']} source must use https")
    need(isinstance(p['measuredSignals'], list) and len(p['measuredSignals']) >= 2, f"{p['id']} needs at least two measured signals/outcomes")
    need(len(set(p['measuredSignals'])) == len(p['measuredSignals']), f"{p['id']} repeats measured signals")
    need(len(p['learningUse']) >= 50 and len(p['limitation']) >= 45, f"{p['id']} needs explicit learning use and limitation")
    joined = ' '.join([p['sourceTitle'], p['learningUse'], p['limitation'], *p['measuredSignals']]).lower()
    for banned in ['universal setpoint', 'copy this setting', 'production recipe:', 'acceptance limit:']:
        need(banned not in joined, f"{p['id']} contains production-authority language: {banned}")

need(all(theme_counts[t] == 5 for t in themes), f'expected exactly 5 passes per theme, got {dict(theme_counts)}')
need(type_counts['open-measured-dataset'] >= 5, 'need at least five openly accessible measured datasets')
need(type_counts['embargoed-measured-dataset'] >= 2, 'need explicit embargo handling for at least two measured datasets')
need(type_counts['primary-measured-study'] >= 40, 'need at least forty primary measured studies')
need('no production recipes' in obj.get('scope','').lower(), 'registry must state the no-production-recipe boundary')

need(DOC.exists(), 'measured-evidence deep-dive document missing')
doc = read(DOC)
for marker in ['50 independent measured-evidence passes','10 themes × 5 passes','Open measured datasets','Embargoed measured datasets','What this changes in MouldMaster','What still needs real publisher files']:
    need(marker in doc, f'measured-evidence document missing marker: {marker}')
need('data/measured-evidence-50-pass.json' in doc, 'measured-evidence document must link the machine-readable registry')

for wf in ['.github/workflows/qa.yml','.github/workflows/open-desktop-build.yml','.github/workflows/publish-open-desktop.yml','.github/workflows/microsoft-store-msix.yml']:
    text = read(ROOT / wf)
    need('python qa_measured_evidence_50_pass.py' in text, f'{wf} must gate the 50-pass measured-evidence audit')

print(f"MouldMaster measured-evidence QA passed (50 passes; 10 themes x 5; {type_counts['open-measured-dataset']} open measured datasets; {type_counts['embargoed-measured-dataset']} embargoed datasets explicitly bounded; {type_counts['primary-measured-study']} primary measured studies; 0 synthetic rows relabelled as measured)")
