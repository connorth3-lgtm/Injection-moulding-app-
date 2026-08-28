from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / 'data' / 'evidence-coverage-v1.json'
OVERLAY_PATH = ROOT / 'data' / 'evidence-promotion-overlay-v2.json'
PRIMARY_INDEX_PATH = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
AUTHOR_PATH = ROOT / 'data' / 'primary-measured-promotion-authors-v1.json'
DOSSIER_DIR = ROOT / 'data' / 'mechanism-promotion-evidence'
REPORT_PATH = ROOT / 'mechanism-promotion-report.json'
DOI_RE = re.compile(r'10\.\d{4,9}/\S+', re.I)


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing promotion dependency: {path.relative_to(ROOT).as_posix()}')
    return json.loads(path.read_text(encoding='utf-8'))


def norm_author(value):
    return re.sub(r'[^a-z0-9]+', '', str(value).lower())


def doi_from_source_id(value):
    value = str(value).strip()
    need(value.lower().startswith('doi:'), f'overlay qualifying source is not DOI keyed: {value}')
    return value[4:].lower()


registry = load(REGISTRY_PATH)
rule = registry.get('promotionRule', {})
mechanisms = {m.get('id'): m for m in registry.get('mechanisms', [])}
need(len(mechanisms) == 12, 'expected 12 priority mechanisms')
overlay = load(OVERLAY_PATH)
primary_index = load(PRIMARY_INDEX_PATH)
author_meta = load(AUTHOR_PATH)

for key, expected in {
    'baseRegistry': 'data/evidence-coverage-v1.json',
    'primaryMeasuredRegistry': 'data/primary-measured-evidence-registry-v1.json',
    'authorMetadata': 'data/primary-measured-promotion-authors-v1.json',
}.items():
    need(overlay.get(key) == expected, f'promotion overlay {key} drifted')
need(overlay.get('schema') == 1, 'unsupported promotion overlay schema')

primary_by_doi = {}
for manifest in primary_index.get('packs', []):
    pack = load(ROOT / manifest['path'])
    rows = pack.get('entries', [])
    need(len(rows) == manifest.get('entries'), f"{manifest['path']}: primary pack manifest count drifted")
    for row in rows:
        doi = str(row.get('doi', '')).strip().lower()
        need(DOI_RE.fullmatch(doi) is not None, f'canonical primary entry has invalid DOI: {doi}')
        need(doi not in primary_by_doi, f'duplicate DOI while resolving promotion registry: {doi}')
        primary_by_doi[doi] = row

summary_total = (primary_index.get('summary') or {}).get('publisherVerifiedPeerReviewedPrimaryMeasured')
need(len(primary_by_doi) == summary_total, 'canonical primary registry DOI total disagrees with summary')

authors_by_doi = {}
for row in author_meta.get('entries', []):
    doi = str(row.get('doi', '')).strip().lower()
    authors = row.get('authors')
    need(DOI_RE.fullmatch(doi) is not None, f'author metadata DOI invalid: {doi}')
    need(doi not in authors_by_doi, f'duplicate author metadata DOI: {doi}')
    need(isinstance(authors, list) and authors and all(str(x).strip() for x in authors), f'author metadata missing authors: {doi}')
    authors_by_doi[doi] = authors

overlay_by_mid = {}
for item in overlay.get('promotions', []):
    mid = str(item.get('mechanismId', '')).strip()
    need(mid in mechanisms and mid not in overlay_by_mid, f'promotion overlay mechanism invalid/duplicated: {mid}')
    sources = item.get('qualifyingSources')
    need(isinstance(sources, list) and len(sources) >= rule.get('minimumIndependentPublisherVerifiedPrimaryMeasured', 2), f'{mid}: overlay qualifying sources too weak')
    for source in sources:
        need(source.get('role') == 'primary-measured-study', f'{mid}: overlay source role is not primary measured')
        need(source.get('verification') == 'publisher-verified', f'{mid}: overlay source is not publisher verified')
        doi = doi_from_source_id(source.get('id'))
        need(doi in primary_by_doi, f'{mid}: overlay DOI absent from canonical primary registry: {doi}')
        need(str(source.get('title', '')).strip() == str(primary_by_doi[doi].get('title', '')).strip(), f'{mid}: overlay/canonical title mismatch: {doi}')
    overlay_by_mid[mid] = item

need(len(overlay_by_mid) == 9, f'expected nine overlay promotions, found {len(overlay_by_mid)}')
osummary = overlay.get('summary', {})
need(osummary.get('basePromoted') == 3 and osummary.get('overlayPromoted') == 9, 'promotion overlay base/overlay totals drifted')
need(osummary.get('resolvedPromoted') == 12 and osummary.get('resolvedProvisional') == 0 and osummary.get('resolvedGaps') == 0, 'promotion overlay must resolve all 12 mechanisms')

need(DOSSIER_DIR.exists(), 'mechanism promotion evidence directory missing')
dossiers = sorted(DOSSIER_DIR.glob('*.json'))
need(len(dossiers) == 12, f'expected 12 formal promotion dossiers, found {len(dossiers)}')

results = []
seen_mechanisms = set()
for path in dossiers:
    rel = path.relative_to(ROOT).as_posix()
    d = load(path)
    mid = d.get('mechanismId')
    need(mid in mechanisms, f'{path.name}: mechanism not found in evidence registry: {mid}')
    need(mid not in seen_mechanisms, f'{path.name}: duplicate dossier for mechanism {mid}')
    seen_mechanisms.add(mid)
    need(d.get('registryTarget') == 'data/evidence-coverage-v1.json', f'{path.name}: registry target drifted')
    schema = d.get('schema')
    need(schema in {1, 2}, f'{path.name}: unsupported schema {schema}')

    snap = d.get('promotionRuleSnapshot', {})
    for key in [
        'minimumIndependentPublisherVerifiedPrimaryMeasured', 'requiresMeasuredSignals',
        'requiresPhysicalQualityOutcome', 'requiresExperimentalContext',
        'requiresExplicitLimitation', 'predictionIsNotCausation',
        'universalProcessRecipesAllowed',
    ]:
        need(snap.get(key) == rule.get(key), f'{path.name}: promotion rule snapshot drifted for {key}')

    studies = []
    if schema == 1:
        raw_studies = d.get('studies')
        need(isinstance(raw_studies, list), f'{path.name}: studies must be a list')
        for s in raw_studies:
            studies.append({
                'id': s.get('id'), 'doi': s.get('doi'), 'title': s.get('title'),
                'year': s.get('year'), 'journal': s.get('journal'), 'publisherUrl': s.get('publisherUrl'),
                'authors': s.get('authors'), 'role': s.get('role'), 'verification': s.get('verification'),
                'independenceKey': s.get('independenceKey'), 'materialContext': s.get('materialContext'),
                'toolContext': s.get('toolContext'), 'measuredSignals': s.get('measuredSignals'),
                'physicalQualityOutcomes': s.get('physicalQualityOutcomes'), 'supports': s.get('supports'),
                'limitation': s.get('limitation'),
            })
    else:
        need(d.get('promotionOverlayTarget') == 'data/evidence-promotion-overlay-v2.json', f'{path.name}: promotion overlay target drifted')
        need(d.get('primaryMeasuredRegistryTarget') == 'data/primary-measured-evidence-registry-v1.json', f'{path.name}: primary registry target drifted')
        need(d.get('authorMetadataTarget') == 'data/primary-measured-promotion-authors-v1.json', f'{path.name}: author target drifted')
        q = d.get('qualifyingDois')
        need(isinstance(q, list), f'{path.name}: qualifyingDois must be a list')
        for raw_doi in q:
            doi = str(raw_doi).strip().lower()
            need(doi in primary_by_doi, f'{path.name}: qualifying DOI absent from canonical registry: {doi}')
            need(doi in authors_by_doi, f'{path.name}: qualifying DOI missing author metadata: {doi}')
            row = primary_by_doi[doi]
            studies.append({
                'id': f'doi:{doi}', 'doi': doi, 'title': row.get('title'), 'year': row.get('year'),
                'journal': row.get('journal'), 'publisherUrl': row.get('publisherUrl'), 'authors': authors_by_doi[doi],
                'role': 'primary-measured-study', 'verification': 'publisher-verified',
                'independenceKey': row.get('experiment'), 'materialContext': row.get('material'),
                'toolContext': row.get('tool'), 'measuredSignals': row.get('signals'),
                'physicalQualityOutcomes': row.get('outcomes'),
                'supports': f"Canonical primary measured evidence tags: {', '.join(str(x) for x in row.get('tags', []))}.",
                'limitation': row.get('limitation'),
            })

    minimum = rule.get('minimumIndependentPublisherVerifiedPrimaryMeasured', 2)
    need(len(studies) >= minimum, f'{path.name}: fewer than {minimum} qualifying studies')

    rationale = str(d.get('independenceRationale', '')).strip()
    rlower = rationale.lower()
    need(len(rationale) >= 120, f'{path.name}: independence rationale too weak')
    need(('distinct' in rlower or 'separate' in rlower or 'independent' in rlower) and ('experiment' in rlower or 'programme' in rlower), f'{path.name}: rationale must explain independent experiments')
    need('duplicate' in rlower or 're-analys' in rlower, f'{path.name}: rationale must address duplicate/re-analysis risk')

    dois, experiments, author_sets = [], [], []
    for i, s in enumerate(studies, 1):
        prefix = f'{path.name}: study {i}'
        doi = str(s.get('doi', '')).strip().lower()
        need(s.get('role') == 'primary-measured-study' and s.get('verification') == 'publisher-verified', f'{prefix}: not publisher-verified primary measured')
        need(DOI_RE.fullmatch(doi) is not None, f'{prefix}: valid DOI missing')
        need(str(s.get('id', '')).lower() == f'doi:{doi}', f'{prefix}: id/DOI mismatch')
        need(str(s.get('publisherUrl', '')).startswith('https://'), f'{prefix}: publisher URL invalid')
        need(bool(str(s.get('journal', '')).strip()), f'{prefix}: journal missing')
        need(isinstance(s.get('year'), int) and 1900 <= s['year'] <= 2100, f'{prefix}: year invalid')
        authors = s.get('authors')
        need(isinstance(authors, list) and authors, f'{prefix}: authors missing')
        aset = frozenset(norm_author(x) for x in authors if norm_author(x))
        need(aset, f'{prefix}: normalized author set empty')
        for field in ['measuredSignals', 'physicalQualityOutcomes']:
            vals = s.get(field)
            need(isinstance(vals, list) and vals and all(str(x).strip() for x in vals), f'{prefix}: {field} missing')
        for field in ['materialContext', 'toolContext', 'supports']:
            need(bool(str(s.get(field, '')).strip()), f'{prefix}: {field} missing')
        need(len(str(s.get('limitation', '')).strip()) >= 50, f'{prefix}: limitation too weak')
        exp = str(s.get('independenceKey', '')).strip()
        need(exp, f'{prefix}: independence key missing')
        dois.append(doi); experiments.append(exp); author_sets.append(aset)

    need(len(dois) == len(set(dois)), f'{path.name}: duplicate DOI counted as independent evidence')
    need(len(experiments) == len(set(experiments)), f'{path.name}: duplicate experiment counted twice')
    need(len(author_sets) == len(set(author_sets)), f'{path.name}: identical author set counted as independent evidence')

    eligibility = d.get('eligibility', {})
    need(eligibility.get('independentPublisherVerifiedPrimaryMeasured') == len(studies), f'{path.name}: eligibility count mismatch')
    for flag in ['meetsMinimumIndependentStudies','measuredSignalsPresent','physicalQualityOutcomesPresent','experimentalContextPresent','explicitLimitationsPresent','eligibleForPromotion']:
        need(eligibility.get(flag) is True, f'{path.name}: eligibility flag not true: {flag}')

    claim = str(d.get('promotionClaim', '')).strip()
    clower = claim.lower()
    need(len(claim) >= 100, f'{path.name}: promotion claim too weak')
    for phrase in ['measured', 'physical part-quality', 'do not promote', 'universal']:
        need(phrase in clower, f'{path.name}: promotion claim boundary missing: {phrase}')
    for forbidden in ['always set','must set','universal setpoint','universal limit','guaranteed root cause']:
        need(forbidden not in clower, f'{path.name}: unsafe promotion wording: {forbidden}')

    base = mechanisms[mid]
    applied = eligibility.get('registryPromotionApplied') is True
    if schema == 1:
        need(applied is True, f'{path.name}: legacy promoted dossier must remain applied')
        need(base.get('status') == 'promoted' and base.get('promoted') is True, f'{path.name}: legacy dossier/base registry disagree')
        need(base.get('publisherVerifiedPrimaryMeasured') == len(studies), f'{path.name}: base verified count mismatch')
        layer = 'base-registry'
    else:
        need(applied is True, f'{path.name}: schema-2 dossier must be explicitly applied')
        need(base.get('promoted') is False and base.get('status') != 'promoted', f'{path.name}: overlay is only for historical non-promoted mechanisms')
        ov = overlay_by_mid.get(mid)
        need(ov is not None, f'{path.name}: dossier missing from overlay')
        need(ov.get('dossier') == rel, f'{path.name}: overlay dossier path mismatch')
        overlay_dois = [doi_from_source_id(x.get('id')) for x in ov.get('qualifyingSources', [])]
        need(overlay_dois == dois, f'{path.name}: dossier DOI order/set disagrees with overlay')
        layer = 'formal-overlay'

    results.append({
        'mechanismId': mid, 'dossier': rel, 'schema': schema,
        'qualifyingStudies': len(studies), 'eligibleForPromotion': True,
        'registryPromotionApplied': applied, 'applicationLayer': layer,
        'independenceRationaleRecorded': True,
    })

need(seen_mechanisms == set(mechanisms), 'every priority mechanism must have exactly one promotion dossier')
need(sum(1 for x in results if x['applicationLayer'] == 'base-registry') == 3, 'expected three historical base promotions')
need(sum(1 for x in results if x['applicationLayer'] == 'formal-overlay') == 9, 'expected nine formal overlay promotions')
need(all(x['registryPromotionApplied'] for x in results), 'all 12 resolved promotions must be explicitly applied')

report = {
    'schema': 2,
    'dossierCount': len(results),
    'eligibleCount': len(results),
    'appliedCount': len(results),
    'baseRegistryApplied': 3,
    'formalOverlayApplied': 9,
    'resolvedPromoted': 12,
    'results': results,
    'result': 'pass',
}
REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster mechanism promotion QA passed (12 dossiers; 3 historical base + 9 formal overlay; 12 resolved promoted; cross-platform paths normalized)')
