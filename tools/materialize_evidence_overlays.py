#!/usr/bin/env python3
"""Resolve additive evidence overlays into the CI working copy.

Committed v1 files remain historical/source-reviewed baselines. Overlay-aware CI
materializes only evidence that is currently rights-executable and backed by an
existing canonical profile. No raw third-party payload or measured-dataset
acceptance state is changed here.
"""
from __future__ import annotations

import copy
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIMARY_BASE = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
PRIMARY_OVERLAY = ROOT / 'data' / 'primary-measured-evidence-overlay-v2.json'
SENSOR_BASE = ROOT / 'data' / 'sensor-machine-health-registry-v1.json'
SENSOR_OVERLAY = ROOT / 'data' / 'sensor-machine-health-registry-v2.json'
TARGET_BASE = ROOT / 'data' / 'content-scale-targets.json'
TARGET_OVERLAY = ROOT / 'data' / 'content-scale-targets-overlay-v2.json'

PROFILE_ALIASES = {
    'data/public-benchmark-results/scatimdata-v1.json':
        'data/public-benchmark-results/scatimdata-avaps-v1.json',
    'data/public-benchmark-results/cross-process-chain-v1.json':
        'data/public-benchmark-results/cross-process-chain-17240390-v1.json',
}
EXPECTED_SENSOR_KINDS = {
    'direct-measurement': 36,
    'derived-feature': 5,
    'diagnostic-interpretation': 5,
    'measurement-integrity': 7,
    'quality-measurement': 5,
    'command-signal': 1,
    'state-signal': 1,
}


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path: Path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def materialize_primary():
    base = load(PRIMARY_BASE)
    if base.get('materializedOverlay') == 'data/primary-measured-evidence-overlay-v2.json':
        summary = base.get('summary') or {}
        need(summary.get('publisherVerifiedPeerReviewedPrimaryMeasured') == 70, 'already-materialized primary total drifted')
        need(summary.get('uniqueDois') == 70 and summary.get('tierA') == 4 and summary.get('tierB') == 66, 'already-materialized primary summary drifted')
        return base

    overlay = load(PRIMARY_OVERLAY)
    need(overlay.get('schema') == 1 and overlay.get('status') == 'accepted-primary-measured-overlay', 'primary overlay invalid')
    need(overlay.get('baseRegistry') == 'data/primary-measured-evidence-registry-v1.json', 'primary overlay base mismatch')
    base_summary = base.get('summary') or {}
    expected_base = overlay.get('baseSummary') or {}
    for key in ['publisherVerifiedPeerReviewedPrimaryMeasured', 'tierA', 'tierB', 'uniqueDois']:
        need(base_summary.get(key) == expected_base.get(key), f'primary base checkpoint drifted: {key}')
    need(base_summary.get('publisherVerifiedPeerReviewedPrimaryMeasured') == 60, 'historical primary baseline must remain 60')
    need(len(base.get('packs') or []) == 5, 'historical primary pack manifest drifted')
    need(len(base.get('promotionCandidates') or []) == overlay.get('promotionCandidatesInheritedFromBase') == 9, 'primary promotion-candidate inheritance drifted')

    added_packs = overlay.get('addedPacks') or []
    need(len(added_packs) == 2, 'primary overlay must contain exactly two additive packs')
    added_entries = []
    for ref in added_packs:
        pack = load(ROOT / ref['path'])
        rows = pack.get('entries') or []
        need(pack.get('schema') == 1, f'{ref["path"]}: unsupported pack schema')
        need(len(rows) == ref.get('entries') == 5, f'{ref["path"]}: additive pack count mismatch')
        added_entries.extend(rows)
    need(len(added_entries) == 10, 'primary overlay additive total drifted')

    base_dois = set()
    for ref in base.get('packs') or []:
        pack = load(ROOT / ref['path'])
        rows = pack.get('entries') or []
        need(len(rows) == ref.get('entries'), f'{ref["path"]}: base pack count mismatch')
        base_dois.update(str(x.get('doi', '')).lower() for x in rows)
    added_dois = [str(x.get('doi', '')).lower() for x in added_entries]
    need(all(added_dois) and len(added_dois) == len(set(added_dois)), 'primary overlay contains duplicate/missing DOIs')
    need(not (base_dois & set(added_dois)), 'primary overlay duplicates a base primary DOI')

    resolved = copy.deepcopy(base)
    resolved['version'] = overlay.get('version')
    resolved['reviewed'] = overlay.get('reviewed')
    resolved['materializedFromBaseAccepted'] = 60
    resolved['materializedOverlay'] = 'data/primary-measured-evidence-overlay-v2.json'
    resolved['packs'] = list(base.get('packs') or []) + added_packs
    effective = overlay.get('effectiveSummary') or {}
    resolved['summary'] = {
        **base_summary,
        'publisherVerifiedPeerReviewedPrimaryMeasured': effective.get('publisherVerifiedPeerReviewedPrimaryMeasured'),
        'tierA': effective.get('tierA'),
        'tierB': effective.get('tierB'),
        'uniqueDois': effective.get('uniqueDois'),
    }
    need(resolved['summary']['publisherVerifiedPeerReviewedPrimaryMeasured'] == 70, 'resolved primary total drifted')
    need(resolved['summary']['tierA'] == 4 and resolved['summary']['tierB'] == 66 and resolved['summary']['uniqueDois'] == 70, 'resolved primary summary drifted')
    write(PRIMARY_BASE, resolved)
    return resolved


def normalize_sensor_concept(raw):
    concept = copy.deepcopy(raw)
    evidence = []
    for source in concept.get('evidence') or []:
        item = copy.deepcopy(source)
        if item.get('type') == 'dataset-profile':
            path = str(item.get('path', '')).strip()
            path = PROFILE_ALIASES.get(path, path)
            item['path'] = path
            if not path or not (ROOT / path).exists():
                continue
        evidence.append(item)
    concept['evidence'] = evidence
    return concept if evidence else None


def materialize_sensor():
    base = load(SENSOR_BASE)
    if base.get('materializedOverlay') == 'data/sensor-machine-health-registry-v2.json':
        summary = base.get('summary') or {}
        need(summary.get('acceptedConcepts') == 60, 'already-materialized sensor total drifted')
        need(summary.get('baseAccepted') == 23 and summary.get('overlayAccepted') == 37, 'already-materialized sensor layer split drifted')
        return base

    overlay = load(SENSOR_OVERLAY)
    need(overlay.get('schema') == 1 and overlay.get('status') == 'evidence-reviewed-overlay-with-rights-gates', 'sensor overlay invalid')
    need(overlay.get('baseRegistry') == 'data/sensor-machine-health-registry-v1.json', 'sensor overlay base mismatch')
    source_base = list(base.get('concepts') or [])
    expected = overlay.get('summary') or {}
    need(len(source_base) == expected.get('sourceReviewedBase') == 26, 'source-reviewed sensor base drifted')

    source_overlay = []
    for ref in overlay.get('packs') or []:
        pack = load(ROOT / ref['path'])
        rows = pack.get('entries') or []
        need(pack.get('schema') == 1 and pack.get('status') == 'accepted-evidence-reviewed-overlay-pack', f'{ref["path"]}: invalid reviewed pack')
        need(len(rows) == ref.get('entries'), f'{ref["path"]}: manifest count mismatch')
        source_overlay.extend(rows)
    need(len(source_overlay) == expected.get('sourceReviewedOverlay') == 55, 'source-reviewed sensor overlay total drifted')

    source_ids = [str(x.get('id', '')) for x in source_base + source_overlay]
    need(all(source_ids) and len(source_ids) == len(set(source_ids)), 'source-reviewed sensor registry contains duplicate/missing IDs')

    accepted_base = [x for raw in source_base if (x := normalize_sensor_concept(raw)) is not None]
    accepted_overlay = [x for raw in source_overlay if (x := normalize_sensor_concept(raw)) is not None]
    need(len(accepted_base) == expected.get('acceptedBaseAfterRightsAndCanonicalProfileGates') == 23, 'rights/profile-gated base sensor total drifted')
    need(len(accepted_overlay) == expected.get('acceptedOverlayAfterRightsAndCanonicalProfileGates') == 37, 'rights/profile-gated overlay sensor total drifted')

    rows = accepted_base + accepted_overlay
    need(len(rows) == expected.get('resolvedAccepted') == 60, 'resolved sensor total drifted')
    need(len(source_ids) - len(rows) == expected.get('deferredSourceReviewedConcepts') == 21, 'deferred sensor concept total drifted')
    ids = [str(x.get('id', '')) for x in rows]
    need(len(ids) == len(set(ids)), 'resolved sensor registry contains duplicate IDs')
    need(not any(x.startswith('sig-probayes-') for x in ids), 'ProBayes-dependent concepts must remain deferred while reuse rights are blocked')
    for blocked_id in ['sig-nozzle-front-pressure-direct', 'sig-nozzle-back-pressure-direct', 'sig-nozzle-pressure-difference-derived']:
        need(blocked_id not in ids, f'{blocked_id} must remain deferred while SKZ LoKI reuse rights are blocked')

    counts = Counter(str(x.get('kind', '')) for x in rows)
    need(dict(counts) == EXPECTED_SENSOR_KINDS, f'resolved sensor kind counts drifted: {dict(counts)}')
    resolved = copy.deepcopy(base)
    resolved['version'] = overlay.get('version')
    resolved['reviewed'] = overlay.get('reviewed')
    resolved['status'] = 'accepted-rights-and-canonical-profile-gated-registry'
    resolved['materializedFromSourceBaseReviewed'] = 26
    resolved['materializedFromBaseAccepted'] = 23
    resolved['materializedOverlay'] = 'data/sensor-machine-health-registry-v2.json'
    resolved['concepts'] = rows
    resolved['summary'] = {
        'acceptedConcepts': 60,
        'directMeasurementConcepts': counts['direct-measurement'],
        'derivedFeatureConcepts': counts['derived-feature'],
        'diagnosticInterpretationConcepts': counts['diagnostic-interpretation'],
        'measurementIntegrityConcepts': counts['measurement-integrity'],
        'qualityMeasurementConcepts': counts['quality-measurement'],
        'commandSignalConcepts': counts['command-signal'],
        'stateSignalConcepts': counts['state-signal'],
        'kindCounts': dict(sorted(counts.items())),
        'sourceReviewedBase': 26,
        'sourceReviewedOverlay': 55,
        'baseAccepted': 23,
        'overlayAccepted': 37,
        'deferredSourceReviewedConcepts': 21,
    }
    write(SENSOR_BASE, resolved)
    return resolved


def materialize_targets():
    base = load(TARGET_BASE)
    if base.get('materializedOverlay') == 'data/content-scale-targets-overlay-v2.json':
        targets = base.get('targets') or {}
        need(targets['primary_measured_studies']['currentAccepted'] == 70, 'already-materialized primary target drifted')
        need(targets['peer_reviewed_research_records']['currentAccepted'] == 70, 'already-materialized research target drifted')
        need(targets['sensor_machine_health_concepts']['currentAccepted'] == 60, 'already-materialized sensor target drifted')
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


primary = materialize_primary()
sensor = materialize_sensor()
targets = materialize_targets()
need(primary['summary']['publisherVerifiedPeerReviewedPrimaryMeasured'] == targets['targets']['primary_measured_studies']['currentAccepted'] == 70, 'resolved primary and target totals disagree')
need(targets['targets']['peer_reviewed_research_records']['currentAccepted'] == 70, 'resolved peer-reviewed target total disagrees')
need(sensor['summary']['acceptedConcepts'] == targets['targets']['sensor_machine_health_concepts']['currentAccepted'] == 60, 'resolved sensor and target totals disagree')
print('MouldMaster evidence overlays materialized (primary: 60 + 10 = 70; sensor/machine-health: 60 accepted, 21 source-reviewed concepts deferred by rights/profile gates)')
