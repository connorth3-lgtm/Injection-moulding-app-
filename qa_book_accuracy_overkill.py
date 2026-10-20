#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GATE = json.loads((ROOT / 'data/book-accuracy-gate-v1.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
RUNTIME = (ROOT / 'book-runtime.js').read_text(encoding='utf-8')

assert GATE['schema'] == 1 and GATE['bookId'] == 'mouldmaster-book'
assert GATE['policy'] == 'accuracy-overkill'
assert GATE['defaultDisposition'] == 'fail-closed'
assert GATE['verificationUnit'] == 'claim'
assert GATE['verifiedChapterCountAuthorizedByThisGate'] == 0
assert GATE['currentBookDisposition'] == 'technical-review-only'

required_claim = set(GATE['requiredForEverySubstantiveClaim'])
for item in ['stable claim id','exact chapter and section location','claim class','applicability and exclusions','at least one traceable evidence record','source checked date and currency state']:
    assert item in required_claim

numeric = set(GATE['numericClaimRequirements'])
for item in ['SI unit','primary source or declared measured basis','no conversion into a universal production setpoint']:
    assert item in numeric

high = GATE['highConsequenceRules']
for key in ['safety','gradeSpecificProcessing','machineSpecific','mouldOrHotRunnerSpecific','troubleshooting','dimensionalClaims']:
    assert high.get(key), f'missing high-consequence rule: {key}'
assert 'guaranteed' in high['troubleshooting'].lower()
assert 'grade-specific' in high['gradeSpecificProcessing'].lower()

anchors = {x['id']: x for x in GATE['evidenceAnchorsConfirmed2026_09_14']}
for sid in ['ISO-294-4-2018','ISO-20457-2026','ASTM-D955-21','ZHAO-2022-WARPAGE-SHRINKAGE-REVIEW']:
    assert sid in anchors
    assert anchors[sid]['url'].startswith('https://')
    assert anchors[sid]['status']
    assert anchors[sid]['scope']
assert 'supersedes iso 20457:2018' in anchors['ISO-20457-2026']['scope'].lower()

# The Book must remain closed to verification until claim-level records are actually added and resolved.
chapters = [c for p in MANIFEST['parts'] for c in p.get('chapters', [])]
assert len(chapters) == 46
assert not any(c.get('state') == 'verified' for c in chapters), 'accuracy gate forbids premature verified chapters'
assert 'batch.status===\'technical-review\'' in RUNTIME
assert "chapter.state==='verified'" in RUNTIME

print('PASS: overkill Book accuracy gate is fail-closed at claim level; 0 chapters prematurely verified')
