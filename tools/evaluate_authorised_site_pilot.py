#!/usr/bin/env python3
"""Fail-closed acceptance evaluator for an authorised MouldMaster real-site pilot.

The evaluator reads a prepared/pseudonymised CSV and a human review JSON, but emits
aggregate acceptance evidence only. It never copies source rows, identifiers, ranges,
free text, timestamps or production recipes into the output report.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
from pathlib import Path

FORBIDDEN_HEADER_TOKENS=(
    'customer','operator','employee','person','name','email','phone','address','serial',
    'timestamp','datetime','free_text','comment','part_number','customer_part','site_name'
)
REQUIRED_PHASES={'baseline','fault','recovery'}
EVIDENCE_FIELDS={
    'fill_time_s','transfer_position_mm','transfer_pressure_mpa','cushion_mm',
    'recovery_time_s','cycle_time_s','tcu_supply_c','tcu_return_c','tcu_flow_lpm',
    'hot_runner_actual_c','part_mass_g','dimension_value','peak_cavity_pressure_mpa'
}
REQUIRED_REVIEW_FLAGS=(
    'site_authorisation_confirmed',
    'approved_learning_research_use_confirmed',
    'raw_data_retained_outside_public_repository',
    'prepared_data_human_reviewed_for_reidentification_risk',
    'independent_finding_compared',
    'evidence_requested_before_setting_change',
    'root_cause_separated_from_compensation',
    'recovery_checked_against_mechanism',
    'evidence_retention_governance_confirmed',
)

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def read_csv(path:Path):
    with path.open('r',encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        headers=[str(x or '').strip() for x in (reader.fieldnames or [])]
        rows=list(reader)
    return headers,rows

def clean_category(value,max_len=80):
    text=str(value or '').strip()
    allowed='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-.:/'
    return ''.join(c for c in text if c in allowed)[:max_len]

def evaluate(csv_path:Path,review_path:Path):
    headers,rows=read_csv(csv_path)
    review=json.loads(review_path.read_text(encoding='utf-8'))
    reasons=[]
    if not rows: reasons.append('prepared dataset contains no data rows')
    lower=[h.lower() for h in headers]
    for h in lower:
        if any(tok in h for tok in FORBIDDEN_HEADER_TOKENS): reasons.append(f'forbidden identifier/free-text field present: {h}')
    if len(headers)!=len(set(headers)): reasons.append('prepared dataset has duplicate headers')
    if 'phase' not in headers: reasons.append('prepared dataset does not contain phase')
    phases={str(r.get('phase','')).strip().lower().replace('_','-') for r in rows}
    canonical={'known-good':'baseline','known_good':'baseline','verification':'recovery'}
    phases={canonical.get(x,x) for x in phases if x}
    missing=sorted(REQUIRED_PHASES-phases)
    if missing: reasons.append('required pilot phases missing: '+', '.join(missing))
    evidence=sorted(EVIDENCE_FIELDS.intersection(headers))
    if len(evidence)<3: reasons.append('fewer than three recognised physical/quality evidence fields are present')
    if 'shot_index' not in headers: reasons.append('prepared dataset does not preserve shot_index sequence')
    for flag in REQUIRED_REVIEW_FLAGS:
        if review.get(flag) is not True: reasons.append(f'human review flag is not confirmed: {flag}')
    role=clean_category(review.get('independent_reviewer_role'))
    finding=clean_category(review.get('independent_finding_category'))
    mechanisms=[clean_category(x) for x in review.get('mouldmaster_ranked_mechanisms',[]) if clean_category(x)]
    alignment=clean_category(review.get('top_rank_alignment')).lower()
    if not role: reasons.append('independent reviewer role is missing')
    if not finding: reasons.append('independent engineering finding category is missing')
    if not mechanisms: reasons.append('MouldMaster ranked mechanisms are missing')
    if alignment not in {'aligned','partially-aligned','not-aligned'}: reasons.append('top-rank alignment must be aligned, partially-aligned, or not-aligned')
    case_alias=clean_category(review.get('case_alias')) or 'CASE'
    result={
        'schema':1,
        'status':'accepted-real-site-pilot' if not reasons else 'pilot-review-incomplete',
        'claim_allowed':'real-site pilot completed for this bounded reviewed case' if not reasons else 'pilot-ready',
        'claim_forbidden':'universal production validation, universal root cause, production recipe, machinery authorisation',
        'case_alias':case_alias,
        'prepared_input':{
            'sha256':sha256(csv_path),
            'rows':len(rows),
            'columns':len(headers),
            'recognised_evidence_fields':evidence,
            'phases_present':sorted(phases),
            'raw_rows_emitted':False,
            'raw_values_emitted':False,
        },
        'independent_review':{
            'reviewer_role_category':role,
            'finding_category':finding,
            'mouldmaster_ranked_mechanisms':mechanisms[:5],
            'top_rank_alignment':alignment or 'not-reviewed',
            'ambiguity_count':len(review.get('ambiguities_or_missing_signals') or []),
            'content_action_count':len(review.get('content_or_data_actions') or []),
        },
        'acceptance':{
            'passed':not reasons,
            'reasons':reasons,
            'policy':'Acceptance requires site authorisation, prepared-data privacy review, baseline/fault/recovery evidence, independent engineering comparison, recovery check and governed evidence retention.'
        },
        'privacy':'Aggregate acceptance report only. No source rows, timestamps, customer/person/site identifiers, raw values, minima/maxima, free text or production settings are emitted.',
        'safety':'No pilot result authorises a production change, safeguard bypass, machine intervention or hazardous-energy work. Actual work remains governed by authorised site procedures and applicable law.'
    }
    return result

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--prepared-csv',required=True,type=Path)
    p.add_argument('--review-json',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    args=p.parse_args()
    if not args.prepared_csv.is_file(): raise SystemExit('prepared CSV not found')
    if not args.review_json.is_file(): raise SystemExit('review JSON not found')
    report=evaluate(args.prepared_csv,args.review_json)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    print(f"Authorised site-pilot evaluation: {report['status']} ({report['prepared_input']['rows']} rows; {len(report['acceptance']['reasons'])} blocking issue(s)).")
    if report['status']!='accepted-real-site-pilot': raise SystemExit(2)

if __name__=='__main__':main()
