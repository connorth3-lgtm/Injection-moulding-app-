#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / 'src' / 'domains' / 'research' / 'governed-mechanisms.js'
BASE = ROOT / 'data' / 'evidence-coverage-v1.json'
OVERLAY = ROOT / 'data' / 'evidence-promotion-overlay-v2.json'


def need(ok, message):
    if not ok:
        raise AssertionError(message)


base = json.loads(BASE.read_text(encoding='utf-8'))
overlay = json.loads(OVERLAY.read_text(encoding='utf-8'))
mechanisms = {row['id']: row for row in base['mechanisms']}
promotions = {row['mechanismId']: row for row in overlay['promotions']}
need(len(mechanisms) == 12, 'expected 12 governed mechanisms')
need(overlay['summary']['resolvedPromoted'] == 12, 'formal promotion overlay no longer resolves all mechanisms')
need(overlay['summary']['basePromoted'] == 3 and overlay['summary']['overlayPromoted'] == 9, 'promotion layer totals drifted')

node = r"""
const m=require('./src/domains/research/governed-mechanisms.js');
const out={catalog:m.catalog,tests:{}};
out.tests.multi=m.retrieve({text:'multicavity runner imbalance',signals:['cavity pressure'],outcomes:['cavity-specific part quality']},3);
out.tests.moisture=m.retrieve({text:'dryer moisture hydrolysis',signals:['measured moisture'],outcomes:['impact strength']},3);
out.tests.unknown=m.retrieve('astronomy telescope nebula quasar',3);
out.tests.plan=m.localEvidencePlan({text:'cavity pressure runner imbalance'},'runner-gate-multicavity-imbalance');
out.tests.empty=m.localEvidencePlan({},'not-a-mechanism');
console.log(JSON.stringify(out));
"""
proc = subprocess.run(['node', '-e', node], cwd=ROOT, capture_output=True, text=True)
need(proc.returncode == 0, 'governed research runtime failed under Node: ' + (proc.stderr or proc.stdout))
runtime = json.loads(proc.stdout)
catalog = runtime['catalog']
need(len(catalog) == 12, 'runtime catalog must contain exactly the 12 governed mechanisms')
need(len({row['id'] for row in catalog}) == 12, 'runtime mechanism ids must be unique')
need(sum(row['promotionLayer'] == 'base-registry' for row in catalog) == 3, 'runtime base promotion count drifted')
need(sum(row['promotionLayer'] == 'formal-overlay' for row in catalog) == 9, 'runtime overlay promotion count drifted')

for row in catalog:
    mid = row['id']
    need(mid in mechanisms, f'runtime mechanism absent from evidence coverage registry: {mid}')
    source = mechanisms[mid]
    need(row['title'] == source['title'], f'{mid}: title drifted from governed base registry')
    need(row['whyItMatters'] == source['whyItMatters'], f'{mid}: mechanism context drifted from governed base registry')
    need(row['desiredEvidence'] == source['desiredEvidence'], f'{mid}: desired evidence drifted from governed base registry')
    need(row['limitation'] == source['limitation'], f'{mid}: limitation drifted from governed base registry')
    need(row['evidenceState'] == 'promoted', f'{mid}: resolved runtime evidence state must be promoted')
    if source.get('status') == 'promoted' and source.get('promoted') is True:
        need(row['promotionLayer'] == 'base-registry', f'{mid}: historical base promotion mislabeled')
        expected_sources = [
            {'id': s['id'], 'title': s['title'], 'role': s['role'], 'verification': s['verification']}
            for s in source.get('sources', [])
            if s.get('role') == 'primary-measured-study' and s.get('verification') == 'publisher-verified'
        ]
    else:
        need(mid in promotions, f'{mid}: non-base mechanism missing formal promotion overlay')
        need(row['promotionLayer'] == 'formal-overlay', f'{mid}: formal overlay promotion mislabeled')
        expected_sources = promotions[mid]['qualifyingSources']
    need(len(expected_sources) >= base['promotionRule']['minimumIndependentPublisherVerifiedPrimaryMeasured'], f'{mid}: insufficient qualifying current sources')
    need(row['sources'] == expected_sources, f'{mid}: runtime qualifying sources drifted from current promotion authority')

multi = runtime['tests']['multi']
need(multi and multi[0]['id'] == 'runner-gate-multicavity-imbalance', 'multicavity context did not prioritize governed runner/gate mechanism')
need(multi[0]['applicability']['label'] in {'high', 'moderate'}, 'multicavity applicability unexpectedly weak')
moisture = runtime['tests']['moisture']
need(moisture and moisture[0]['id'] == 'moisture-drying-degradation', 'moisture context did not prioritize governed moisture mechanism')
need(runtime['tests']['unknown'] == [], 'unrelated context should not produce a research mechanism match')
plan = runtime['tests']['plan']
need(plan['mechanismId'] == 'runner-gate-multicavity-imbalance', 'local evidence plan identity drifted')
need(plan['evidenceState'] == 'promoted' and len(plan['sources']) >= 2, 'local evidence plan lost governed evidence state/sources')
need(plan['collect'] == mechanisms['runner-gate-multicavity-imbalance']['desiredEvidence'], 'local evidence plan must collect governed desired evidence')
need('not local root cause' in plan['boundary'].lower(), 'local evidence plan must preserve causation boundary')
need(runtime['tests']['empty'] is None, 'unknown mechanism without context must fail closed')

source_text = RUNTIME.read_text(encoding='utf-8')
for forbidden in ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage']:
    need(forbidden not in source_text, f'governed research runtime must remain read-only/network-free: {forbidden}')
need('Evidence quality and local applicability remain separate' in source_text, 'research applicability boundary is missing')
need('universal setpoints' in source_text, 'universal-setpoint boundary is missing')

print('MouldMaster governed research applicability QA passed: 12 resolved promotions stay authority-synced, qualifying sources remain exact, local relevance is separate from evidence quality, and research support stays read-only/non-causal.')
