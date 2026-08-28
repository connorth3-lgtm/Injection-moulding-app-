#!/usr/bin/env python3
"""Resolve additive evidence overlays into the CI working copy.

Committed v1 files remain historical baselines. CI and local release validation call this
script before QA/compilation so downstream code sees the current accepted ledger without
rewriting the historical snapshots in Git.
"""
from __future__ import annotations

import copy
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SENSOR_BASE = ROOT / 'data' / 'sensor-machine-health-registry-v1.json'
SENSOR_OVERLAY = ROOT / 'data' / 'sensor-machine-health-registry-v2.json'
TARGET_BASE = ROOT / 'data' / 'content-scale-targets.json'
TARGET_OVERLAY = ROOT / 'data' / 'content-scale-targets-overlay-v2.json'


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path: Path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def materialize_sensor():
    base = load(SENSOR_BASE)
    if base.get('materializedOverlay') == 'data/sensor-machine-health-registry-v2.json':
        need((base.get('summary') or {}).get('acceptedConcepts') == 81, 'already-materialized sensor total drifted')
        return base
    overlay = load(SENSOR_OVERLAY)
    need(overlay.get('schema') == 1 and overlay.get('status') == 'accepted-evidence-reviewed-overlay', 'sensor overlay invalid')
    need(overlay.get('baseRegistry') == 'data/sensor-machine-health-registry-v1.json', 'sensor overlay base mismatch')
    baseline = list(base.get('concepts') or [])
    expected = overlay.get('summary') or {}
    need(len(baseline) == expected.get('baseAccepted') == 26, 'historical sensor baseline drifted')
    added = []
    for ref in overlay.get('packs') or []:
        p = ROOT / ref['path']
        pack = load(p)
        rows = pack.get('entries') or []
        need(pack.get('schema') == 1 and pack.get('status') == 'accepted-evidence-reviewed-overlay-pack', f'{ref["path"]}: invalid pack')
        need(len(rows) == ref.get('entries'), f'{ref["path"]}: manifest count mismatch')
        added.extend(rows)
    need(len(added) == expected.get('overlayAccepted') == 55, 'sensor overlay accepted count drifted')
    rows = baseline + added
    ids = [str(x.get('id', '')) for x in rows]
    need(all(ids) and len(ids) == len(set(ids)), 'resolved sensor registry contains duplicate/missing IDs')
    need(len(rows) == expected.get('resolvedAccepted') == 81, 'resolved sensor total drifted')
    counts = Counter(str(x.get('kind', '')) for x in rows)
    resolved = copy.deepcopy(base)
    resolved['version'] = overlay.get('version')
    resolved['reviewed'] = overlay.get('reviewed')
    resolved['status'] = 'accepted-evidence-reviewed-registry'
    resolved['materializedFromBaseAccepted'] = 26
    resolved['materializedOverlay'] = 'data/sensor-machine-health-registry-v2.json'
    resolved['concepts'] = rows
    resolved['summary'] = {
        'acceptedConcepts': 81,
        'directMeasurementConcepts': counts['direct-measurement'],
        'derivedFeatureConcepts': counts['derived-feature'],
        'diagnosticInterpretationConcepts': counts['diagnostic-interpretation'],
        'measurementIntegrityConcepts': counts['measurement-integrity'],
        'qualityMeasurementConcepts': counts['quality-measurement'],
        'commandSignalConcepts': counts['command-signal'],
        'stateSignalConcepts': counts['state-signal'],
        'kindCounts': dict(sorted(counts.items())),
        'baseAccepted': 26,
        'overlayAccepted': 55,
    }
    write(SENSOR_BASE, resolved)
    return resolved


def materialize_targets():
    base = load(TARGET_BASE)
    if base.get('materializedOverlay') == 'data/content-scale-targets-overlay-v2.json':
        need(base['targets']['sensor_machine_health_concepts']['currentAccepted'] == 81, 'already-materialized target total drifted')
        return base
    overlay = load(TARGET_OVERLAY)
    need(overlay.get('schema') == 1 and overlay.get('status') == 'accepted-count-overlay', 'target overlay invalid')
    need(overlay.get('baseTargets') == 'data/content-scale-targets.json', 'target overlay base mismatch')
    resolved = copy.deepcopy(base)
    for key, value in (overlay.get('acceptedOverrides') or {}).items():
        need(key in resolved.get('targets', {}), f'unknown target override: {key}')
        resolved['targets'][key]['currentAccepted'] = value
    resolved['materializedOverlay'] = 'data/content-scale-targets-overlay-v2.json'
    resolved['materializedBaseVersion'] = base.get('version')
    write(TARGET_BASE, resolved)
    return resolved


sensor = materialize_sensor()
targets = materialize_targets()
need(sensor['summary']['acceptedConcepts'] == targets['targets']['sensor_machine_health_concepts']['currentAccepted'], 'resolved sensor and target totals disagree')
print('MouldMaster evidence overlays materialized (sensor/machine-health: 26 + 55 = 81 accepted concepts)')
