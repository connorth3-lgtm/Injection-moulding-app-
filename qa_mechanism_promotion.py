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


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing promotion dependency: {path.relative_to(ROOT)}')
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
overlay = load(OVERLAY_PATH)
primary_index = load(PRIMARY_INDEX_PATH)
author_meta = load(AUTHOR_PATH)

need(overlay.get('schema') == 1, 'unsupported promotion overlay schema')
need(overlay.get('baseRegistry') == 'data/evidence-coverage-v1.json', 'promotion overlay base registry drifted')
need(overlay.get('primaryMeasuredRegistry') == 'data/primary-measured-evidence-registry-v1.json', 'promotion overlay primary registry drifted')
need(overlay.get('authorMetadata') == 'data/primary-measured-promotion-authors-v1.json', 'promotion overlay author metadata drifted')

primary_by_doi = {}
for manifest in primary_index.get('packs', []):
    pack = load(ROOT / manifest['path'])
    rows = pack.get('entries', [])
    need(len(rows) == manifest.get('entries'), f"{manifest['path']}: primary pack manifest count drifted")
    for row in rows:
        doi = str(row.get('doi', '')).strip().lower()
        need(doi and doi not in primary_by_doi, f'duplicate DOI while resolving promotion registry: {doi}')
        primary_by_doi[doi] = row

authors_by_doi = {}
for row in author_meta.get('entries', []):
    doi = str(row.get('doi', '')).strip().lower()
    authors = row.get('authors')
    need(re.fullmatch(r'10\.\d{4,9}/\S+', doi, flags=re.I) is not None, f'author metadata DOI invalid: {doi}')
    need(doi not in authors_by_doi, f'duplicate author metadata DOI: {doi}')
    need(isinstance(authors, list) and authors and all(str(x).strip() for x in authors), f'author metadata missing authors: {doi}')
    authors_by_doi[doi] = authors

overlay_by_mid = {}
for item in overlay.get('promotions', []):
    mid = str(item.get('mechanismId', '')).strip()
    need(mid in mechanisms, f'promotion overlay references unknown mechanism: {mid}')
    need(mid not in overlay_by_mid, f'duplicate mechanism in promotion overlay: {mid}')
    q = item.get('qualifyingSources')
    need(isinstance(q, list) and len(q) >= rule.get('minimumIndependentPublisherVerifiedPrimaryMeasured', 2), f'{mid}: overlay qualifying sources too weak')
    for src in q:
        need(src.get('role') == 'primary-measured-study' and src.get('verification') == 'publisher-verified', f'{mid}: overlay qualifying source is not publisher-verified primary measured')
        doi = doi_from_source_id(src.get('id'))
        need(doi in primary_by_doi, f'{mid}: overlay DOI absent from canonical primary measured registry: {doi}')
        need(str(src.get('title', '')).strip() == str(primary_by_doi[doi].get('title', '')).strip(), f'{mid}: overlay title does not match canonical primary measured entry: {doi}')
    overlay_by_mid[mid] = item

need(len(overlay_by_mid) == 9, f'expected nine formal overlay promotions, found {len(overlay_by_mid)}')
summary = overlay.get('summary', {})
need(summary.get('basePromoted') == 3 and summary.get('overlayPromoted') == 9 and summary.get('resolvedPromoted') == 12,
     'promotion overlay summary drifted')
need(summary.get('resolvedProvisional') == 0 and summary.get('resolvedGaps') == 0, 'promotion overlay must resolve all 12 mechanisms')

need(DOSSIER_DIR.exists(), 'mechanism promotion evidence directory missing')
dossiers = sorted(DOSSIER_DIR.glob('*.json'))
need(dossiers, 'no mechanism promotion dossiers found')

results = []
seen_dossier_mechanisms = set()
for path in dossiers:
    d = load(path)
    mid = d.get('mechanismId')
    need(mid in mechanisms, f'{path.name}: mechanism not found in evidence registry: {mid}')
    need(mid not in seen_dossier_mechanisms, f'{path.name}: duplicate promotion dossier for mechanism {mid}')
    seen_dossier_mechanisms.add(mid)
    need(d.get('registryTarget') == 'data/evidence-coverage-v1.json', f'{path.name}: unexpected registry target')
    schema = d.get('schema')
    need(schema in {1, 2}, f'{path.name}: unsupported schema {schema}')

    snap = d.get('promotionRuleSnapshot', {})
    for key in [
        'minimumIndependentPublisherVerifiedPrimaryMeasured',
        'requiresMeasuredSignals',
        'requiresPhysicalQualityOutcome',
        'requiresExperimentalContext',
        'requiresExplicitLimitation',
        'predictionIsNotCausation',
        'universalProcessRecipesAllowed',
    ]:
        need(snap.get(key) == rule.get(key), f'{path.name}: promotion rule snapshot drifted for {key}')

    studies = []
    if schema == 1:
        raw_studies = d.get('studies')
        need(isinstance(raw_studies, list), f'{path.name}: studies must be a list')
        for study in raw_studies:
            studies.append({
                'id': study.get('id'),
                'doi': study.get('doi'),
                'title': study.get('title'),
                'year': study.get('year'),
                'journal': study.get('journal'),
                'publisherUrl': study.get('publisherUrl'),
                'authors': study.get('authors'),
                'role': study.get('role'),
                'verification': study.get('verification'),
                'independenceKey': study.get('independenceKey'),
                'materialContext': study.get('materialContext'),
                'toolContext': study.get('toolContext'),
                'measuredSignals': study.get('measuredSignals'),
                'physicalQualityOutcomes': study.get('physicalQualityOutcomes'),
                'supports': study.get('supports'),
                'limitation': study.get('limitation'),
            })
    else:
        need(d.get('promotionOverlayTarget') == 'data/evidence-promotion-overlay-v2.json', f'{path.name}: promotion overlay target drifted')
        need(d.get('primaryMeasuredRegistryTarget') == 'data/primary-measured-evidence-registry-v1.json', f'{path.name}: primary measured registry target drifted')
        need(d.get('authorMetadataTarget') == 'data/primary-measured-promotion-authors-v1.json', f'{path.name}: author metadata target drifted')
        q = d.get('qualifyingDois')
        need(isinstance(q, list), f'{path.name}: qualifyingDois must be a list')
        for raw_doi in q:
            doi = str(raw_doi).strip().lower()
            need(doi in primary_by_doi, f'{path.name}: qualifying DOI missing from canonical primary measured registry: {doi}')
            need(doi in authors_by_doi, f'{path.name}: qualifying DOI missing author/team metadata: {doi}')
            row = primary_by_doi[doi]
            studies.append({
                'id': f'doi:{doi}',
                'doi': doi,
                'title': row.get('title'),
                'year': row.get('year'),
                'journal': row.get('journal'),
                'publisherUrl': row.get('publisherUrl'),
                'authors': authors_by_doi[doi],
                'role': 'primary-measured-study',
                'verification': 'publisher-verified',
                'independenceKey': row.get('experiment'),
                'materialContext': row.get('material'),
                'toolContext': row.get('tool'),
                'measuredSignals': row.get('signals'),
                'physicalQualityOutcomes': row.get('outcomes'),
                'supports': f"Canonical primary measured evidence tags: {', '.join(str(x) for x in row.get('tags', []))}.",
                'limitation': row.get('limitation'),
            })

    min_required = rule.get('minimumIndependentPublisherVerifiedPrimaryMeasured', 2)
    need(len(studies) >= min_required, f'{path.name}: fewer than {min_required} qualifying studies')

    rationale = str(d.get('independenceRationale', '')).strip()
    need(len(rationale) >= 120, f'{path.name}: independence rationale is missing or too weak')
    rationale_lower = rationale.lower()
    need(('distinct' in rationale_lower or 'separate' in rationale_lower or 'independent' in rationale_lower)
         and ('experiment' in rationale_lower or 'programme' in rationale_lower),
         f'{path.name}: independence rationale must explain distinct experimental evidence')
    need('duplicate' in rationale_lower or 're-analys' in rationale_lower,
         f'{path.name}: independence rationale must address duplicate/re-analysis risk')

    dois = []
    independence = []
    author_sets = []
    qualifying = 0
    for i, study in enumerate(studies, 1):
        prefix = f'{path.name}: study {i}'
        need(study.get('role') == 'primary-measured-study', f'{prefix}: role must be primary-measured-study')
        need(study.get('verification') == 'publisher-verified', f'{prefix}: study is not publisher-verified')
        doi = str(study.get('doi', '')).strip()
        need(re.fullmatch(r'10\.\d{4,9}/\S+', doi, flags=re.I) is not None, f'{prefix}: valid DOI missing')
        need(str(study.get('id', '')).lower() == f'doi:{doi}'.lower(), f'{prefix}: id/DOI mismatch')
        url = str(study.get('publisherUrl', '')).strip()
        need(url.startswith('https://'), f'{prefix}: publisher URL must use HTTPS')
        need(bool(str(study.get('journal', '')).strip()), f'{prefix}: journal missing')
        need(isinstance(study.get('year'), int) and 1900 <= study['year'] <= 2100, f'{prefix}: year invalid')
        authors = study.get('authors')
        need(isinstance(authors, list) and authors and all(str(x).strip() for x in authors), f'{prefix}: authors missing')
        normalized_authors = frozenset(norm_author(x) for x in authors if norm_author(x))
        need(normalized_authors, f'{prefix}: normalized author set is empty')
        measured = study.get('measuredSignals')
        outcomes = study.get('physicalQualityOutcomes')
        need(isinstance(measured, list) and measured and all(str(x).strip() for x in measured), f'{prefix}: measured signals missing')
        need(isinstance(outcomes, list) and outcomes and all(str(x).strip() for x in outcomes), f'{prefix}: physical quality outcomes missing')
        need(bool(str(study.get('materialContext', '')).strip()), f'{prefix}: material context missing')
        need(bool(str(study.get('toolContext', '')).strip()), f'{prefix}: tool context missing')
        need(bool(str(study.get('supports', '')).strip()), f'{prefix}: bounded support statement missing')
        limitation = str(study.get('limitation', '')).strip()
        need(len(limitation) >= 50, f'{prefix}: limitation is too weak')
        key = str(study.get('independenceKey', '')).strip()
        need(key, f'{prefix}: independence key missing')
        dois.append(doi.lower())
        independence.append(key)
        author_sets.append(normalized_authors)
        qualifying += 1

    need(len(dois) == len(set(dois)), f'{path.name}: duplicate DOI counted as independent evidence')
    need(len(independence) == len(set(independence)), f'{path.name}: duplicate experiment/independence key counted twice')
    need(len(author_sets) == len(set(author_sets)), f'{path.name}: identical author set counted as independent evidence without a distinct team/programme')
    need(qualifying >= min_required, f'{path.name}: promotion minimum not met')

    eligibility = d.get('eligibility', {})
    need(eligibility.get('independentPublisherVerifiedPrimaryMeasured') == qualifying, f'{path.name}: eligibility count does not match qualifying studies')
    for flag in [
        'meetsMinimumIndependentStudies',
        'measuredSignalsPresent',
        'physicalQualityOutcomesPresent',
        'experimentalContextPresent',
        'explicitLimitationsPresent',
        'eligibleForPromotion',
    ]:
        need(eligibility.get(flag) is True, f'{path.name}: eligibility flag not true: {flag}')

    claim = str(d.get('promotionClaim', '')).strip()
    need(len(claim) >= 100, f'{path.name}: promotion claim is too weak')
    lower = claim.lower()
    for required_phrase in ['measured', 'physical part-quality', 'do not promote', 'universal']:
        need(required_phrase in lower, f'{path.name}: promotion claim boundary missing: {required_phrase}')
    for forbidden in ['always set', 'must set', 'universal setpoint', 'universal limit', 'guaranteed root cause']:
        need(forbidden not in lower, f'{path.name}: unsafe universal/causal promotion language: {forbidden}')

    registry_item = mechanisms[mid]
    applied = eligibility.get('registryPromotionApplied') is True
    if schema == 1:
        if applied:
            need(registry_item.get('status') == 'promoted' and registry_item.get('promoted') is True,
                 f'{path.name}: legacy dossier says promotion applied but base registry is not promoted')
            need(registry_item.get('publisherVerifiedPrimaryMeasured') == qualifying,
                 f'{path.name}: base registry verified-study count does not match legacy dossier')
        else:
            need(registry_item.get('status') != 'promoted' and registry_item.get('promoted') is False,
                 f'{path.name}: base registry is promoted before legacy dossier marks promotion applied')
    else:
        need(applied is True, f'{path.name}: schema-2 dossier must represent an explicitly applied formal overlay promotion')
        need(registry_item.get('promoted') is False and registry_item.get('status') != 'promoted',
             f'{path.name}: schema-2 overlay is only for mechanisms not already promoted in the historical base registry')
        ov = overlay_by_mid.get(mid)
        need(ov is not None, f'{path.name}: applied schema-2 dossier missing from promotion overlay')
        need(ov.get('dossier') == str(path.relative_to(ROOT)), f'{path.name}: overlay dossier path mismatch')
        overlay_dois = [doi_from_source_id(x.get('id')) for x in ov.get('qualifyingSources', [])]
        need(overlay_dois == dois, f'{path.name}: dossier DOI order/set disagrees with promotion overlay')

    results.append({
        'mechanismId': mid,
        'dossier': str(path.relative_to(ROOT)),
        'schema': schema,
        'qualifyingStudies': qualifying,
        'eligibleForPromotion': True,
        'registryPromotionApplied': applied,
        'applicationLayer': 'base-registry' if schema == 1 else 'formal-overlay',
        'independenceRationaleRecorded': True,
    })

need(len(results) == 12, f'expected 12 formal promotion dossiers, found {len(results)}')
need(set(x['mechanismId'] for x in results) == set(mechanisms), 'every priority mechanism must have exactly one promotion dossier')
need(set(overlay_by_mid) == {x['mechanismId'] for x in results if x['schema'] == 2}, 'promotion overlay/dossier mechanism set mismatch')

report = {
    'schema': 2,
    'dossierCount': len(results),
    'eligibleCount': sum(1 for x in results if x['eligibleForPromotion']),
    'appliedCount': sum(1 for x in results if x['registryPromotionApplied']),
    'baseRegistryApplied': sum(1 for x in results if x['applicationLayer'] == 'base-registry' and x['registryPromotionApplied']),
    'formalOverlayApplied': sum(1 for x in results if x['applicationLayer'] == 'formal-overlay' and x['registryPromotionApplied']),
    'resolvedPromotedMechanisms': summary.get('resolvedPromoted'),
    'results': results,
    'result': 'pass',
}
REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f"MouldMaster mechanism promotion QA passed ({len(results)} dossiers; {report['baseRegistryApplied']} base + {report['formalOverlayApplied']} overlay promotions; {report['resolvedPromotedMechanisms']} resolved promoted mechanisms; independence rationales checked)")
