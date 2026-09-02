#!/usr/bin/env python3
"""QA for contextual research utilisation and connected local process-data wiring."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def need(ok: bool, msg: str) -> None:
    if not ok:
        raise AssertionError(msg)


def extract_assets(text: str, name: str) -> set[str]:
    match = re.search(rf"const\s+{name}\s*=\s*\[(.*?)\]\s*;", text, re.S)
    need(match is not None, f"service worker {name} list missing")
    return set(re.findall(r"['\"]\./([^'\"]+)['\"]", match.group(1)))


def main() -> None:
    manifest = json.loads((ROOT / 'data/research-utilisation-manifest-v1.json').read_text(encoding='utf-8'))
    public_manifest = json.loads((ROOT / 'research-utilisation-manifest.json').read_text(encoding='utf-8'))
    current = json.loads((ROOT / 'current-data-manifest.json').read_text(encoding='utf-8'))
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    worker = (ROOT / 'service-worker.js').read_text(encoding='utf-8')
    engine = (ROOT / 'research-evidence-engine.js').read_text(encoding='utf-8')
    context = (ROOT / 'research-data-context.js').read_text(encoding='utf-8')
    micro = (ROOT / 'research-evidence-microlearning.js').read_text(encoding='utf-8')
    adaptive = (ROOT / 'adaptive-learning.js').read_text(encoding='utf-8')
    effectiveness = (ROOT / 'learning-effectiveness.js').read_text(encoding='utf-8')
    specialist_quality = (ROOT / 'specialist-learning-quality.js').read_text(encoding='utf-8')
    desktop_pkg = json.loads((ROOT / 'desktop/electron/package.json').read_text(encoding='utf-8'))
    desktop_integrity = (ROOT / 'desktop/electron/scripts/generate-integrity.cjs').read_text(encoding='utf-8')

    runtime_files = manifest.get('runtimeFiles') or []
    need(len(runtime_files) >= 13, 'research/adaptive/effectiveness runtime manifest unexpectedly small')
    for rel in runtime_files:
        need((ROOT / rel).exists(), f'research runtime file missing: {rel}')
        need(f"['./{rel}'" in index, f'bootstrap does not load research runtime: {rel}')

    optional = extract_assets(worker, 'OPTIONAL')
    core = extract_assets(worker, 'CORE')
    for rel in runtime_files:
        need(rel in optional, f'research runtime should be optional offline asset: {rel}')
    for rel in ['data-integration-runtime.js', 'process-data-intelligence-ui.js', 'process-data-semantic-registry.json', 'current-data-manifest.json', 'research-utilisation-manifest.json']:
        need(rel in core, f'connected process-data/research core asset missing: {rel}')
    for rel in ['data-integration-runtime.js', 'process-data-intelligence-ui.js']:
        need(f"['./{rel}'" in index, f'bootstrap does not explicitly load connected data runtime: {rel}')

    cache_revision = re.search(r"CACHE_REVISION='([^']+)'", worker)
    runtime_version = re.search(r'RUNTIME_ASSET_VERSION="([^"]+)"', index)
    expected_cache = re.search(r'EXPECTED_STATIC_CACHE="([^"]+)"', index)
    need(cache_revision and runtime_version and expected_cache, 'cache/runtime version metadata missing')
    need(cache_revision.group(1).startswith('maturity-hardening-v2-'), 'audited cache family must be preserved')
    need(runtime_version.group(1).endswith('-maturity-hardening-v2'), 'audited runtime family must be preserved')
    cache_date = re.search(r'(\d{8})$', cache_revision.group(1))
    need(cache_date and runtime_version.group(1).startswith(cache_date.group(1)), 'cache/runtime dates must match')
    need(expected_cache.group(1) == f"mouldmaster-static-2026.08.26.2-{cache_revision.group(1)}", 'bootstrap expected cache does not match worker')

    research = current.get('researchUtilisation') or {}
    need(research.get('manifest') == './research-utilisation-manifest.json', 'current manifest must point to public research utilisation manifest')
    need(research.get('promotedMechanisms') == 12, 'current manifest promoted mechanism total must be 12')
    need(research.get('publisherVerifiedPrimaryMeasuredStudies') == 70, 'current manifest verified primary measured total must be 70')
    need(research.get('evidenceQualitySeparatedFromApplicability') is True, 'evidence quality/applicability separation missing')
    need(research.get('supportsFalsification') is True, 'falsification support missing')
    need(research.get('supportsVerificationPlans') is True, 'verification-plan support missing')
    need(research.get('supportsDelayedTransferChecks') is True, 'delayed transfer support missing')
    need(research.get('supportsPrivacyThresholdedDifficultyCalibration') is True, 'privacy-thresholded difficulty calibration missing')
    need(research.get('supportsAggregateItemDiscrimination') is True, 'aggregate item discrimination support missing')
    need(public_manifest['evidence']['promotedMechanisms'] == research['promotedMechanisms'], 'public research manifest promoted total drifted')
    need(public_manifest['evidence']['publisherVerifiedPrimaryMeasuredStudies'] == research['publisherVerifiedPrimaryMeasuredStudies'], 'public research manifest primary-study total drifted')
    need(public_manifest['connectedData']['rawUpload'] is False, 'public research manifest must preserve no-upload boundary')
    learning = public_manifest.get('learning', {})
    need(learning.get('formalAssessmentUnchanged') is True, 'public adaptive learning boundary missing')
    need(learning.get('delayedTransferIntervalsDays') == [7, 30], 'public retention intervals drifted')
    need(learning.get('difficultyCalibrationMinimumAnonymousProfiles') == 5, 'public calibration profile threshold drifted')
    need(learning.get('difficultyCalibrationMinimumAttempts') == 12, 'public calibration attempt threshold drifted')
    need(learning.get('calibratedChallengeLevels') == ['support', 'standard', 'stretch'], 'public challenge levels drifted')
    need(learning.get('specialistTransferLessons', {}).get('liquid-silicone-rubber') == 'S17', 'LSR specialist route missing')
    need(learning.get('specialistTransferLessons', {}).get('fluid-assisted-moulding') == 'S18', 'assisted-moulding specialist route missing')
    need(learning.get('specialistTransferLessons', {}).get('injection-compression-precision-optics') == 'S20', 'precision-optics specialist route missing')

    need(engine.count("status:'promoted'") >= 12, 'runtime engine must retain all 12 promoted mechanisms')
    need(len(set(re.findall(r"doi:10\.[0-9]{4,9}/[^'\"]+", engine))) >= 24, 'runtime engine needs at least 24 primary source links')
    for token in ['datasetContext', 'semantic process-data', 'site-process-data', 'workspace-case', 'similarEvidence']:
        need(token in context, f'research/data bridge missing behavior: {token}')
    for token in [
        'What changed — and what to check next', 'changeSentence', 'Baseline ${fmt(f.baseline)} → current ${fmt(f.current)}',
        "baselineSelect?.value", "baselineSelect.addEventListener('change'", 'Save as troubleshooting case',
        'What would weaken this explanation', 'The decision brief follows the user-selected local baseline'
    ]:
        need(token in context, f'technician-first Run Insights behavior missing: {token}')
    for token in ['buildPractice','strongest discriminating evidence','correctIndex','weakeningAnswer','choiceMeta','formal assessment','retentionIntervalDays','challenge']:
        need(token in micro, f'contextual formative-practice behavior missing: {token}')
    for token in ['stageForMechanism','reasoningProfile','practice_misconception','SPECIALIST_GAPS','SPECIALIST_LESSONS','lessonChallenge']:
        need(token in adaptive,f'adaptive learning runtime behavior missing: {token}')
    for token in ['itemStats','challengeFor','dueTransferChecks','practiceIntent','anonymousReport','MIN_PROFILES=5','MIN_ATTEMPTS=12','RETENTION_DAYS=[7,30]']:
        need(token in effectiveness, f'learning effectiveness runtime behavior missing: {token}')
    for token in ['S17','S18','S20','Evidence reasoning mastery','openForMechanism','practice_complete']:
        need(token in specialist_quality, f'specialist transfer runtime behavior missing: {token}')
    for token in ['Reason it through','data-mm-ri-choice','practice_miss','practice_complete','Run-linked practice stays outside the formal assessment bank']:
        need(token in context, f'Run Insights formative learning integration missing: {token}')

    need(current['boundaries']['researchDoesNotMeanUniversal'] is True, 'research boundary missing')
    need(current['boundaries']['predictionIsNotCausation'] is True, 'prediction/causation boundary missing')
    need(current['localProcessData']['rawUpload'] is False, 'local process data must remain no-upload')

    desktop_from = {x.get('from') for x in desktop_pkg['build']['extraResources'] if isinstance(x, dict)}
    desktop_required = runtime_files + ['measured-evidence-integration.js', 'measured-evidence-decision.js', 'research-utilisation-manifest.json']
    for rel in desktop_required:
        need(f'../../{rel}' in desktop_from, f'desktop package missing research/evidence asset: {rel}')
        need(f"'{rel}'" in desktop_integrity, f'desktop integrity set missing research/evidence asset: {rel}')

    print(
        'Research runtime wiring QA passed: '
        f"{research['promotedMechanisms']} promoted mechanisms, "
        f"{research['publisherVerifiedPrimaryMeasuredStudies']} verified primary studies, "
        f"{len(runtime_files)} research/adaptive/effectiveness runtime modules; Run Insights, calibrated staged reasoning, delayed retention, specialist transfer and local-only learning effectiveness guarded."
    )


if __name__ == '__main__':
    main()
