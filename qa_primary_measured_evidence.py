from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
REPORT = ROOT / 'primary-measured-evidence-report.json'

DOI_RE = re.compile(r'^10\.\d{4,9}/\S+$', re.I)
ALLOWED_TIERS = {'A', 'B'}
ALLOWED_RAW = {'public-open', 'not-public-confirmed', 'available-on-request'}
FORBIDDEN_COUNT_TYPES = {
    'review', 'systematic-review', 'simulation-only', 'synthetic-only',
    'conference-abstract-without-measured-methods', 'unverified-third-party-mirror',
    'duplicate-publication-of-same-experiment'
}
EXPECTED_STAGED = {
    'fibre-breakage-retained-length',
    'runner-gate-multicavity-imbalance',
    'hot-runner-actual-behaviour',
    'liquid-silicone-rubber',
    'fluid-assisted-moulding',
    'moisture-drying-degradation',
    'recyclate-process-variability',
    'surface-replication-release',
    'injection-compression-precision-optics',
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing registry dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


index = load(INDEX)
need(index.get('schema') == 1, 'unsupported primary measured evidence schema')
policy = index.get('credibilityPolicy', {})
need(policy.get('predictionIsNotCausation') is True, 'prediction/causation boundary missing')
need(policy.get('universalProcessRecipesAllowed') is False, 'universal recipe boundary missing')
need(policy.get('sameExperimentPaperAndDatasetCountOnce') is True, 'paper/dataset experiment deduplication rule missing')
need(policy.get('minimumRedundancyPerStagedMechanism') == 3, 'staged mechanism redundancy rule drifted')
need(set(policy.get('excludedFromCount', [])) == FORBIDDEN_COUNT_TYPES, 'excluded evidence-type policy drifted')

packs = index.get('packs', [])
need(len(packs) == 5, f'expected 5 primary measured evidence packs, found {len(packs)}')
entries = []
pack_counts = {}
for p in packs:
    path = ROOT / p['path']
    pack = load(path)
    need(pack.get('schema') == 1, f'{p["path"]}: unsupported pack schema')
    rows = pack.get('entries')
    need(isinstance(rows, list), f'{p["path"]}: entries must be a list')
    need(len(rows) == p.get('entries'), f'{p["path"]}: manifest count does not match pack')
    pack_counts[p['path']] = len(rows)
    entries.extend(rows)

summary = index.get('summary', {})
need(len(entries) == 60, f'expected 60 counted primary measured studies, found {len(entries)}')
need(summary.get('publisherVerifiedPeerReviewedPrimaryMeasured') == 60, 'summary primary measured total drifted')
need(summary.get('uniqueDois') == 60, 'summary unique DOI count drifted')

dois = []
experiments = []
tier_counts = {'A': 0, 'B': 0}
for i, e in enumerate(entries, 1):
    prefix = f'entry {i} ({e.get("title", "untitled")})'
    doi = str(e.get('doi', '')).strip()
    need(DOI_RE.fullmatch(doi) is not None, f'{prefix}: valid DOI missing')
    need(bool(str(e.get('title', '')).strip()), f'{prefix}: title missing')
    need(isinstance(e.get('year'), int) and 1900 <= e['year'] <= 2100, f'{prefix}: year invalid')
    need(bool(str(e.get('journal', '')).strip()), f'{prefix}: journal missing')
    need(str(e.get('publisherUrl', '')).strip().startswith('https://'), f'{prefix}: publisher URL must use HTTPS')
    tier = e.get('tier')
    need(tier in ALLOWED_TIERS, f'{prefix}: unsupported credibility tier {tier}')
    tier_counts[tier] += 1
    tags = e.get('tags')
    need(isinstance(tags, list) and tags and all(str(x).strip() for x in tags), f'{prefix}: mechanism tags missing')
    exp = str(e.get('experiment', '')).strip()
    overlap = str(e.get('overlap', '')).strip()
    need(exp, f'{prefix}: experiment identity missing')
    need(overlap, f'{prefix}: overlap group missing')
    experiments.append(exp)
    for field in ['machine', 'material', 'tool', 'scale', 'causal']:
        need(bool(str(e.get(field, '')).strip()), f'{prefix}: {field} context missing')
    signals = e.get('signals')
    outcomes = e.get('outcomes')
    need(isinstance(signals, list) and signals and all(str(x).strip() for x in signals), f'{prefix}: measured signals missing')
    need(isinstance(outcomes, list) and outcomes and all(str(x).strip() for x in outcomes), f'{prefix}: physical quality/material outcomes missing')
    raw = e.get('raw')
    need(isinstance(raw, dict), f'{prefix}: raw-data status missing')
    need(raw.get('status') in ALLOWED_RAW, f'{prefix}: unsupported raw-data status')
    if raw.get('status') == 'public-open':
        need(str(raw.get('location', '')).startswith('https://'), f'{prefix}: public-open raw data need a source location')
    limitation = str(e.get('limitation', '')).strip()
    need(len(limitation) >= 80, f'{prefix}: limitation is too weak')
    searchable = ' '.join([str(e.get('causal', '')), *[str(x) for x in tags]]).lower()
    for forbidden in ['simulation-only', 'synthetic-only', 'review-only']:
        need(forbidden not in searchable, f'{prefix}: forbidden evidence type counted as primary measured: {forbidden}')
    dois.append(doi.lower())

need(len(dois) == len(set(dois)), 'duplicate DOI counted as independent primary measured evidence')
need(len(experiments) == len(set(experiments)), 'duplicate experiment identity counted as an independent primary measured study')
need(tier_counts == {'A': 4, 'B': 56}, f'credibility-tier counts drifted: {tier_counts}')
need(summary.get('tierA') == 4 and summary.get('tierB') == 56, 'manifest tier summary drifted')

by_doi = {e['doi'].lower(): e for e in entries}
candidates = index.get('promotionCandidates', [])
need(len(candidates) == 9, f'expected nine staged promotion candidates, found {len(candidates)}')
need(summary.get('promotionCandidatesStagedNotApplied') == 9, 'promotion-candidate summary drifted')
need(summary.get('stagedMechanismsWithRedundantEvidence') == 9, 'redundant-evidence summary drifted')
seen_mechanisms = set()
redundancy = {}
for c in candidates:
    mid = str(c.get('mechanismId', '')).strip()
    need(mid and mid not in seen_mechanisms, f'duplicate/missing promotion candidate mechanism: {mid}')
    seen_mechanisms.add(mid)
    need(c.get('status') == 'eligible-candidate-not-applied', f'{mid}: candidate must remain staged, not automatically applied')

    q = c.get('qualifyingDois')
    need(isinstance(q, list) and len(q) == 2, f'{mid}: exactly two qualifying DOI references required')
    qn = [str(x).lower() for x in q]
    need(len(qn) == len(set(qn)), f'{mid}: same qualifying DOI used twice')
    need(all(x in by_doi for x in qn), f'{mid}: qualifying DOI missing from primary measured registry')
    a, b = (by_doi[x] for x in qn)
    need(a['experiment'] != b['experiment'], f'{mid}: duplicate experiment counted toward promotion')
    need(a['overlap'] != b['overlap'], f'{mid}: same overlap group counted toward promotion')

    support = c.get('supportingDois')
    need(isinstance(support, list) and support, f'{mid}: at least one independent backup study is required')
    sn = [str(x).lower() for x in support]
    need(len(sn) == len(set(sn)), f'{mid}: duplicate DOI within backup evidence')
    need(not (set(qn) & set(sn)), f'{mid}: qualifying DOI reused as backup evidence')
    need(all(x in by_doi for x in sn), f'{mid}: backup DOI missing from primary measured registry')

    all_refs = [by_doi[x] for x in qn + sn]
    all_experiments = [e['experiment'] for e in all_refs]
    all_overlaps = [e['overlap'] for e in all_refs]
    need(len(set(all_experiments)) >= policy['minimumRedundancyPerStagedMechanism'],
         f'{mid}: fewer than {policy["minimumRedundancyPerStagedMechanism"]} distinct experiments support the staged mechanism')
    need(len(all_experiments) == len(set(all_experiments)), f'{mid}: duplicate experiment reused within qualifying/backup evidence')
    need(len(all_overlaps) == len(set(all_overlaps)), f'{mid}: same overlap group reused within qualifying/backup evidence')
    redundancy[mid] = len(all_refs)

    rationale = str(c.get('independenceRationale', '')).strip().lower()
    need(len(rationale) >= 160, f'{mid}: independence rationale too weak')
    need(('distinct' in rationale or 'separate' in rationale or 'independent' in rationale)
         and ('experiment' in rationale or 'programme' in rationale),
         f'{mid}: rationale must explain independent experimental programmes')
    need('duplicate' in rationale or 're-analys' in rationale, f'{mid}: rationale must address duplicate/re-analysis risk')
    claim = str(c.get('boundedClaim', '')).strip().lower()
    need(len(claim) >= 120, f'{mid}: bounded claim too weak')
    need('do not promote' in claim and 'universal' in claim, f'{mid}: universal-setting boundary missing')

need(seen_mechanisms == EXPECTED_STAGED, f'staged mechanism set drifted: {sorted(seen_mechanisms)}')

# Staging this registry must not silently change the learner-facing mechanism registry.
coverage = load(ROOT / 'data' / 'evidence-coverage-v1.json')
coverage_by_id = {m.get('id'): m for m in coverage.get('mechanisms', [])}
for c in candidates:
    mid = c['mechanismId']
    need(mid in coverage_by_id, f'{mid}: staged candidate not found in mechanism registry')
    need(coverage_by_id[mid].get('promoted') is False and coverage_by_id[mid].get('status') != 'promoted',
         f'{mid}: learner-facing promotion changed without a formal promotion dossier')

report = {
    'schema': 1,
    'source': str(INDEX.relative_to(ROOT)),
    'packCounts': pack_counts,
    'countedPrimaryMeasuredStudies': len(entries),
    'uniqueDois': len(set(dois)),
    'uniqueExperimentIdentities': len(set(experiments)),
    'tierCounts': tier_counts,
    'publicRawOrCompanionTierA': tier_counts['A'],
    'stagedPromotionCandidates': len(candidates),
    'redundantEvidenceCounts': redundancy,
    'minimumRedundancyPerStagedMechanism': policy['minimumRedundancyPerStagedMechanism'],
    'automaticLearnerStatusChanges': 0,
    'duplicateDois': 0,
    'duplicateExperimentIdentities': 0,
    'result': 'pass'
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster primary measured evidence QA passed (60 unique peer-reviewed primary measured studies; 4 Tier A / 56 Tier B; 9 staged mechanisms with independent backup evidence; no automatic status changes)')
