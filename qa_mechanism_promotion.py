from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / 'data' / 'evidence-coverage-v1.json'
DOSSIER_DIR = ROOT / 'data' / 'mechanism-promotion-evidence'
REPORT_PATH = ROOT / 'mechanism-promotion-report.json'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing promotion dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


registry = load(REGISTRY_PATH)
rule = registry.get('promotionRule', {})
mechanisms = {m.get('id'): m for m in registry.get('mechanisms', [])}

need(DOSSIER_DIR.exists(), 'mechanism promotion evidence directory missing')
dossiers = sorted(DOSSIER_DIR.glob('*.json'))
need(dossiers, 'no mechanism promotion dossiers found')

results = []
for path in dossiers:
    d = load(path)
    mid = d.get('mechanismId')
    need(mid in mechanisms, f'{path.name}: mechanism not found in evidence registry: {mid}')
    need(d.get('registryTarget') == 'data/evidence-coverage-v1.json', f'{path.name}: unexpected registry target')
    need(d.get('schema') == 1, f'{path.name}: unsupported schema')

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

    studies = d.get('studies')
    need(isinstance(studies, list), f'{path.name}: studies must be a list')
    min_required = rule.get('minimumIndependentPublisherVerifiedPrimaryMeasured', 2)
    need(len(studies) >= min_required, f'{path.name}: fewer than {min_required} qualifying studies')

    dois = []
    independence = []
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
        qualifying += 1

    need(len(dois) == len(set(dois)), f'{path.name}: duplicate DOI counted as independent evidence')
    need(len(independence) == len(set(independence)), f'{path.name}: duplicate experiment/independence key counted twice')
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
    if applied:
        need(registry_item.get('status') == 'promoted' and registry_item.get('promoted') is True,
             f'{path.name}: dossier says promotion applied but registry is not promoted')
        need(registry_item.get('publisherVerifiedPrimaryMeasured') == qualifying,
             f'{path.name}: registry verified-study count does not match dossier')
    else:
        need(registry_item.get('status') != 'promoted' and registry_item.get('promoted') is False,
             f'{path.name}: registry is promoted before dossier marks promotion applied')

    results.append({
        'mechanismId': mid,
        'dossier': str(path.relative_to(ROOT)),
        'qualifyingStudies': qualifying,
        'eligibleForPromotion': True,
        'registryPromotionApplied': applied,
    })

report = {
    'schema': 1,
    'dossierCount': len(results),
    'eligibleCount': sum(1 for x in results if x['eligibleForPromotion']),
    'appliedCount': sum(1 for x in results if x['registryPromotionApplied']),
    'results': results,
    'result': 'pass',
}
REPORT_PATH.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f"MouldMaster mechanism promotion QA passed ({len(results)} dossiers; {report['eligibleCount']} eligible; {report['appliedCount']} applied)")
