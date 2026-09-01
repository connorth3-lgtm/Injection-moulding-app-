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
import math
import re
from pathlib import Path

FORBIDDEN_HEADER_TOKENS=(
    'customer','operator','employee','person','name','email','phone','address','serial',
    'timestamp','datetime','free_text','comment','part_number','customer_part','site_name'
)
FORBIDDEN_CATEGORY_TOKENS=(
    'customer','operator','employee','person','email','phone','address','serial','site name',
    'part number','customer part','machine serial'
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

def category_is_safe(value:str)->bool:
    low=' '.join(str(value or '').lower().replace('_',' ').replace('-',' ').split())
    return bool(low) and not any(tok in low for tok in FORBIDDEN_CATEGORY_TOKENS)

def parse_finite_number(value):
    text=str(value or '').strip()
    if not text:return None
    try:value=float(text)
    except (TypeError,ValueError):return 'invalid'
    return value if math.isfinite(value) else 'invalid'

def canonical_phase(value):
    text=str(value or '').strip().lower().replace('_','-')
    return {'known-good':'baseline','known good':'baseline','verification':'recovery'}.get(text,text)

def evaluate(csv_path:Path,review_path:Path):
    headers,rows=read_csv(csv_path)
    review=json.loads(review_path.read_text(encoding='utf-8'))
    reasons=[]
    if review.get('schema')!=1: reasons.append('human review schema must be 1')
    if not rows: reasons.append('prepared dataset contains no data rows')
    lower=[h.lower() for h in headers]
    if len(lower)!=len(set(lower)): reasons.append('prepared dataset has duplicate headers when compared case-insensitively')
    header_by_lower={h.lower():h for h in headers}
    for h in lower:
        if any(tok in h for tok in FORBIDDEN_HEADER_TOKENS): reasons.append(f'forbidden identifier/free-text field present: {h}')

    phase_header=header_by_lower.get('phase')
    shot_header=header_by_lower.get('shot_index')
    if phase_header is None: reasons.append('prepared dataset does not contain phase')
    if shot_header is None: reasons.append('prepared dataset does not preserve shot_index sequence')

    row_phases=[]
    phase_counts={p:0 for p in sorted(REQUIRED_PHASES)}
    unexpected_phases=set()
    for row in rows:
        phase=canonical_phase(row.get(phase_header,'')) if phase_header else ''
        row_phases.append(phase)
        if phase in REQUIRED_PHASES: phase_counts[phase]+=1
        elif phase: unexpected_phases.add(phase)
    missing=[p for p in sorted(REQUIRED_PHASES) if phase_counts[p]==0]
    if missing: reasons.append('required pilot phases missing: '+', '.join(missing))
    if unexpected_phases: reasons.append('unexpected pilot phase labels are present; prepared acceptance data must use baseline, fault and recovery only')

    shot_indexes=[]
    if shot_header is not None:
        for row in rows:
            raw=parse_finite_number(row.get(shot_header,''))
            if raw is None or raw=='invalid' or not float(raw).is_integer():
                reasons.append('shot_index contains blank, non-numeric, non-finite or non-integer values')
                shot_indexes=[]
                break
            shot_indexes.append(int(raw))
        if shot_indexes:
            if len(shot_indexes)!=len(set(shot_indexes)): reasons.append('shot_index values are not unique')
            if any(b<=a for a,b in zip(shot_indexes,shot_indexes[1:])): reasons.append('shot_index sequence is not strictly increasing in prepared row order')

    evidence_headers=[header_by_lower[name] for name in sorted(EVIDENCE_FIELDS) if name in header_by_lower]
    if len(evidence_headers)<3: reasons.append('fewer than three recognised physical/quality evidence fields are present')
    phase_spanning=[]
    invalid_evidence_fields=[]
    for header in evidence_headers:
        numeric_by_phase={p:0 for p in REQUIRED_PHASES}
        invalid=False
        for row,phase in zip(rows,row_phases):
            value=parse_finite_number(row.get(header,''))
            if value=='invalid': invalid=True;continue
            if value is not None and phase in REQUIRED_PHASES:numeric_by_phase[phase]+=1
        if invalid: invalid_evidence_fields.append(header.lower())
        if all(numeric_by_phase[p]>0 for p in REQUIRED_PHASES): phase_spanning.append(header.lower())
    if invalid_evidence_fields: reasons.append('recognised evidence fields contain non-numeric or non-finite populated values: '+', '.join(sorted(invalid_evidence_fields)))
    if len(phase_spanning)<3: reasons.append('fewer than three recognised numeric evidence fields span baseline, fault and recovery')

    for flag in REQUIRED_REVIEW_FLAGS:
        if review.get(flag) is not True: reasons.append(f'human review flag is not confirmed: {flag}')
    role=clean_category(review.get('independent_reviewer_role'))
    finding=clean_category(review.get('independent_finding_category'))
    mechanisms=[clean_category(x) for x in review.get('mouldmaster_ranked_mechanisms',[]) if clean_category(x)]
    alignment=clean_category(review.get('top_rank_alignment')).lower()
    if not role: reasons.append('independent reviewer role is missing')
    elif not category_is_safe(role): reasons.append('independent reviewer role contains identifier-like content; use a role category only')
    if not finding: reasons.append('independent engineering finding category is missing')
    elif not category_is_safe(finding): reasons.append('independent engineering finding contains identifier-like content; use a mechanism category only')
    if not mechanisms: reasons.append('MouldMaster ranked mechanisms are missing')
    elif any(not category_is_safe(x) for x in mechanisms): reasons.append('MouldMaster ranked mechanisms contain identifier-like content; use mechanism categories only')
    if alignment not in {'aligned','partially-aligned','not-aligned'}: reasons.append('top-rank alignment must be aligned, partially-aligned, or not-aligned')

    requested_alias=clean_category(review.get('case_alias'))
    alias_ok=bool(re.fullmatch(r'CASE-[A-Za-z0-9-]{1,24}',requested_alias))
    if not alias_ok: reasons.append('case_alias must be a non-identifying CASE-... alias')
    case_alias=requested_alias if alias_ok else 'CASE-REDACTED'
    result={
        'schema':2,
        'status':'accepted-real-site-pilot' if not reasons else 'pilot-review-incomplete',
        'claim_allowed':'real-site pilot completed for this bounded reviewed case' if not reasons else 'pilot-ready',
        'claim_forbidden':'universal production validation, universal root cause, production recipe, machinery authorisation',
        'case_alias':case_alias,
        'prepared_input':{
            'sha256':sha256(csv_path),
            'rows':len(rows),
            'columns':len(headers),
            'recognised_evidence_fields':sorted(h.lower() for h in evidence_headers),
            'phase_spanning_numeric_fields':sorted(phase_spanning),
            'phase_row_counts':phase_counts,
            'phases_present':sorted(p for p,n in phase_counts.items() if n),
            'shot_index_validated':bool(shot_indexes) and not any('shot_index' in r for r in reasons),
            'raw_rows_emitted':False,
            'raw_values_emitted':False,
        },
        'independent_review':{
            'reviewer_role_category':role if category_is_safe(role) else 'redacted-invalid-category',
            'finding_category':finding if category_is_safe(finding) else 'redacted-invalid-category',
            'mouldmaster_ranked_mechanisms':[x for x in mechanisms[:5] if category_is_safe(x)],
            'top_rank_alignment':alignment or 'not-reviewed',
            'ambiguity_count':len(review.get('ambiguities_or_missing_signals') or []),
            'content_action_count':len(review.get('content_or_data_actions') or []),
        },
        'acceptance':{
            'passed':not reasons,
            'reasons':reasons,
            'policy':'Acceptance requires site authorisation, prepared-data privacy review, a unique increasing shot sequence, at least three numeric evidence fields spanning baseline/fault/recovery, independent engineering comparison, recovery check and governed evidence retention.'
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
