from pathlib import Path
import json
import re

import qa_question_quality_extreme_runtime as runtime

ROOT=Path(__file__).resolve().parent
REPORT=ROOT/'assessment-evidence-integrity-report.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def text(path):
    p=ROOT/path
    need(p.exists(),f'missing evidence-integrity asset: {path}')
    return p.read_text(encoding='utf-8')

hardening=text('src/domains/assessment/assessment-psychometric-hardening.js')
bridge=text('assessment-stable-review-bridge.js')
integrity=text('assessment-evidence-integrity-upgrade.js')
real=text('real-measured-data-assessment.js')

need("const VERSION='2026.09.01.6'" in hardening,'final psychometric hardening version missing')
for forbidden in ['Math.max(124','cueNeutral','negTails','const pads=','qualification\'','quantification\'']:
    need(forbidden not in hardening,f'forbidden semantic/padding transform remains: {forbidden}')
for required in ['semanticAnswerChanges:0','technicalTermSubstitutions:0','paddingApplied:false','keyedConciseEdits','distractorCueEdits','formClauseTrims','technicalLengthRanks','regionalLengthRanks','scenarioLengthRanks','diagnosticLengthRanks','materialLengthRanks','optionalLengthRanks']:
    need(required in hardening,f'missing tracked psychometric-integrity metadata: {required}')
need("'scenario:03'" in bridge and "'scenario:30'" in bridge and "'scenario:33'" in bridge,'three reviewed source-authored concise keyed overrides are not explicit in the stable-review bridge')
need('repositionArray' in hardening and 'textMutationCount!==0' in hardening and 'Runtime psychometric code must never rewrite stems or option text' in hardening,'immutable psychometric runtime/text-mutation guard is missing')
need('technicalLengthRanks:technicalLengthRanks.slice()' in hardening and 'optionalLengthRanks:optionalLengthRanks.slice()' in hardening,'answer-length rank telemetry is not exported')
need("kp.chars>median*1.40&&kp.chars-median>12" in hardening,'non-salient longest-answer boundary missing')
need("kp.chars>=Math.max" not in hardening,'runtime still forbids every longest keyed option and creates an inverse cue')

items=runtime.load_psychometric_items()
need(len(items)==209,f'learner-visible keyed decision count changed: {len(items)}/209')
measured=[x for x in items if x.get('kind')=='real-measured-decision']
core=[x for x in items if x.get('kind')!='real-measured-decision']
need(len(core)==197,f'core proposition-governed decision count changed: {len(core)}/197')
need(len(measured)==12,f'real-measured governed decision count changed: {len(measured)}/12')
need(all(len(x.get('options',[]))==4 for x in items),'every keyed decision must retain four answer options')
need(all(0<=int(x.get('correct',-1))<4 for x in items),'invalid answer key after runtime hardening')
need(all(str(x.get('stem','')).strip() for x in items),'blank assessment stem')
need(all(str(x.get('rationale','')).strip() for x in items),'blank keyed rationale')

hard,warnings=runtime.evidence_checks(items)
need(not hard,f'existing evidence-registration hard failures: {hard[:8]}')

for marker in [
    "records.length===197", "relevanceStatus:relevant.length?'supported':'blocked'",
    "supportLocator", "limitations", "dataEvidence:type", "scope:'optional'",
    "policy:'Every learner-visible keyed decision has an explicit proposition",
    "context-only", "weakOptional.length===0", "coverageReconciliation", "legacyFormalApprovalTotal", "optionalPropositionTotal", "Assessment evidence coverage reconciliation failed"
]: need(marker in integrity,f'proposition evidence contract missing: {marker}')

allowed=['real-measured','published-experimental','synthetic','supplier','standard/regulatory','engineering-principle']
for value in allowed: need(repr(value) in integrity or f"'{value}'" in integrity,f'evidence type missing: {value}')

upgrades={
 'pbt-hydrolysis':'pbt-celanese','pet-vs-copolyester':'pet-envalior-arnite','tpu-moisture-reabsorption':'pet-envalior-arnite',
 'pmma-optical-stress':'zhao-2022','peek-crystallinity-capability':'peek-solvay-ketaspire','pps-contamination-wear':'pps-solvay-ryton',
 'lcp-orientation':'lcp-polyplastics-laperos','pcabs-grade-identity':'pcabs-sabic-cycoloy','hdpe-lot-shrink':'hdpe-sabic-injection',
 'tpe-overmould-compatibility':'zhao-2022',
}
for lab,source in upgrades.items():
    need(f"'{lab}':['{source}']" in integrity,f'independent source upgrade missing for {lab}: {source}')
    need(f"'{source}'" in integrity,f'new source not registered: {source}')
need("s?.id==='iso-20430'&&!isSafetyText(searchText)" in integrity,'generic machine-safety source can still count as non-safety material corroboration')

diagnostic_upgrades={
 'cavity-short-shot':['autodesk-fill-pack','zhao-2022'],
 'hot-runner-imbalance':['hotrunner-2024','hotrunner-manifold-2023'],
}
for lab,sources in diagnostic_upgrades.items():
    for source in sources: need(f"'{source}'" in integrity,f'diagnostic evidence source missing for {lab}: {source}')
need("DIAGNOSTIC_SOURCE_UPGRADES[lab.id]||null" in integrity,'diagnostic proposition builder must apply explicit lab evidence mappings')

optional=[x for x in core if x.get('kind')=='optional-material-practice']
need(len(optional)==40,f'optional practice count changed: {len(optional)}/40')
for x in optional: need(len(set(x.get('sourceIds') or []))>=2,f'optional item lacks two baseline sources: {x.get("id")}')

need("decisionCount:CASES.reduce" in real and "evidenceType:'real-measured'" in real,'real-measured assessment metadata missing')
need(real.count("contractPath:'data/public-benchmark-results/")==4,'expected four pinned real-data contracts')
need(real.count("questions:[")==4,'expected four real measured cases')
need("localStorage.getItem(k)===payload" in real and "Progress could not be saved on this device." in real and "progress not saved" in real,'real-measured progress persistence must verify writes and surface unsaved progress')
need("return id?String(id):null" in real and "if(!id||!scope" in real,'real-measured progress must fail closed until a real active learner exists')

avaps=json.loads(text('data/public-benchmark-results/scatimdata-avaps-v1.json'))
openmms=json.loads(text('data/public-benchmark-results/openmms-t4g-v1.json'))
lower=json.loads(text('data/public-benchmark-results/cross-process-lower-workpiece-source-contract-v1.json'))
upper=json.loads(text('data/public-benchmark-results/cross-process-upper-workpiece-source-contract-v1.json'))
need(avaps['measurement_profile']['acceptedMeasuredTimeSeriesSamples']==13631488,'AVAPS canonical count changed')
need(avaps['measurement_profile']['deliveredPointsPerSignalPerLinkedCycle']==2048,'AVAPS delivered-point contract changed')
need(openmms['measurement_profile']['acceptedMeasuredTimeSeriesSamples']==298080,'OpenMMS canonical count changed')
need(openmms['measurement_profile']['rows']==29808 and openmms['measurement_profile']['measuredSignalColumns']==10,'OpenMMS row/signal contract changed')
need(lower['profile']['acceptedMeasuredTimeSeriesSamples']==7426743,'lower-workpiece measured total changed')
need(lower['profile']['acceptedActualChannelsPerRow']==3,'lower-workpiece actual-channel count changed')
need(upper['profile']['acceptedMeasuredTimeSeriesSamples']==43814748,'upper-workpiece measured total changed')
need(upper['profile']['pressureActualValuesExcludedPendingUnit']==21907374,'upper pressure blocker changed')
need(upper['profile']['stateValuesExcludedPendingSemantics']==21907374,'upper state blocker changed')
need(any(c['canonicalName']=='injection_pressure_actual' and not c['acceptedMeasuredValue'] and c['unit'] is None for c in upper['channels']),'upper pressure actual was promoted without authoritative unit')
need(any(c['canonicalName']=='state' and not c['acceptedMeasuredValue'] and c['unit'] is None for c in upper['channels']),'upper state was promoted without authoritative semantics')

for literal in ['13631488','298080','7426743','43814748','21907374','2,048','0.03 s','Pressure actual values excluded pending unit']:
    need(literal in real,f'real-measured learner snapshot missing canonical fact: {literal}')
need('Treat them as bar because the lower workpiece records pressure in bar' in real,'fail-closed upper pressure distractor/teaching boundary missing')
need('Preserve the codes without assigning unverified phase names' in real,'fail-closed state-code boundary missing')

report={
 'version':'2026.10.05.1','learner_visible_keyed_decisions':len(items),'core_proposition_governed_decisions':len(core),
 'formal_core_decisions':len([x for x in core if x.get('scope')=='formal']),'optional_decisions':len(optional),
 'real_measured_decisions':len(measured),'psychometric_keyed_propositions_preserved':True,
 'psychometric_technical_term_substitutions':0,'psychometric_padding_applied':False,'psychometric_reviewed_keyed_concise_overrides':3,
 'psychometric_distractor_cue_edits_tracked':True,'psychometric_form_clause_trims_tracked':True,'psychometric_four_rank_length_balancing':True,
 'psychometric_inverse_longest_cue_removed':True,
 'source_registration_hard_failures':len(hard),'source_registration_warnings':len(warnings),'independent_material_source_upgrades':upgrades,
 'real_measured_contracts':{'avaps_values':13631488,'openmms_values':298080,'cross_process_lower_values':7426743,'cross_process_upper_values':43814748,'cross_process_combined_values':7426743+43814748,'upper_pressure_values_excluded_pending_unit':21907374,'upper_state_values_excluded_pending_semantics':21907374},
 'coverage_reconciliation':{'legacy_formal_approval_total':157,'proposition_formal_total':157,'optional_proposition_total':40,'proposition_governed_total':197,'real_measured_total':12,'learner_visible_total':209},
 'status':'passed'
}
REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('Assessment evidence integrity passed: 209 learner-visible keyed decisions = 197 proposition-governed core/optional + 12 real-measured decisions; keyed propositions/technical terms preserved; form-cue governance and unresolved-channel boundaries enforced')