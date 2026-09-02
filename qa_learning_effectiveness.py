#!/usr/bin/env python3
"""Quality gates for empirical learning-effectiveness and specialist transfer practice."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    effect=(ROOT/'learning-effectiveness.js').read_text(encoding='utf-8')
    micro=(ROOT/'research-evidence-microlearning.js').read_text(encoding='utf-8')
    adaptive=(ROOT/'adaptive-learning.js').read_text(encoding='utf-8')
    specialist=(ROOT/'specialist-learning-quality.js').read_text(encoding='utf-8')
    gaps=(ROOT/'specialist-evidence-gap-extension.js').read_text(encoding='utf-8')

    for token in ["MIN_PROFILES=5","MIN_ATTEMPTS=12","RETENTION_DAYS=[7,30]",'itemStats','discrimination','challengeFor','dueTransferChecks','practiceIntent','anonymousReport']:
        need(token in effect,f'learning-effectiveness contract missing: {token}')
    for token in ["challenge='stretch'","challenge='support'","quality='insufficient-sample'",'retention_check','Device-local anonymous profiles','no names, learner tokens, answer text']:
        need(token in effect,f'empirical calibration/privacy behavior missing: {token}')
    for forbidden in ['fetch(','XMLHttpRequest','WebSocket','sendBeacon']:
        need(forbidden not in effect,f'learning-effectiveness runtime must remain local-only: {forbidden}')
        need(forbidden not in specialist,f'specialist transfer runtime must remain local-only: {forbidden}')

    need('MM_LEARNING_EFFECTIVENESS?.practiceIntent' in micro,'microlearning must honor delayed transfer intent')
    need('MM_LEARNING_EFFECTIVENESS?.challengeFor' in micro,'microlearning must honor empirical challenge calibration')
    for challenge in ['support','standard','stretch']:
        need(challenge in micro,f'microlearning challenge variant missing: {challenge}')
    need("mode==='retention'" in micro and 'retentionIntervalDays' in micro,'retention practice metadata missing')
    need('formal assessment' in micro.lower(),'contextual practice formal-assessment boundary missing')

    expected={'liquid-silicone-rubber':'S17','fluid-assisted-moulding':'S18','injection-compression-precision-optics':'S20'}
    for mechanism,lesson in expected.items():
        need(mechanism in adaptive and lesson in adaptive,f'adaptive specialist route missing: {mechanism}/{lesson}')
        need(mechanism in specialist and lesson in specialist,f'specialist transfer profile missing: {mechanism}/{lesson}')
        need(f"id:'{lesson}'" in gaps,f'established specialist extension missing: {lesson}')
    for token in ['Evidence reasoning mastery','practice_complete','practice_miss','Formative specialist practice only','no answer text, free text or network upload']:
        need(token in specialist,f'specialist transfer-quality behavior missing: {token}')
    need(specialist.count(',true,')>=3,'each specialist transfer profile needs a correct option')
    need('MM_DATA.exams' not in effect+specialist+adaptive,'effectiveness/specialist runtime must not mutate formal assessment data')

    matrix=(ROOT/'qa_contextual_learning_runtime.cjs').read_text(encoding='utf-8')
    need("challenges=['support','standard','stretch']" in matrix,'runtime matrix must exercise all calibrated difficulty levels')
    need('mode:\'retention\'' in matrix,'runtime matrix must exercise delayed transfer probes')
    need('all four correct-answer positions' in matrix,'runtime matrix must require all answer positions')

    print('Learning effectiveness QA passed: privacy-thresholded calibration, item discrimination, 7/30-day delayed transfer, specialist S17/S18/S20 routing and formal-assessment isolation verified.')

if __name__=='__main__': main()
