#!/usr/bin/env python3
"""Repair transitional hardening migrations before their final generated commit.

This file exists only to make the migration deterministic and YAML-independent. It can be
removed after the hardening branch is merged and the repaired source files are committed.
"""
from __future__ import annotations

import py_compile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


def repair_freeze_quoting()->None:
    p=ROOT/'tools'/'finalize_assessment_hardening.py'
    t=p.read_text(encoding='utf-8')
    old_open="    new_optional=r'''def load_optional_runtime():"
    new_open='    new_optional=r"""def load_optional_runtime():'
    old_close="    return items'''\n    replace_section"
    new_close='    return items"""\n    replace_section'
    if old_open in t:t=t.replace(old_open,new_open,1)
    if old_close in t:t=t.replace(old_close,new_close,1)
    if new_open not in t or new_close not in t:raise SystemExit('Assessment freeze quoting repair did not converge')
    literal="node=block+r'''\\nconst fs=require('fs'),vm=require('vm');"
    actual="node=block+r'''\nconst fs=require('fs'),vm=require('vm');"
    if literal in t:t=t.replace(literal,actual,1)
    if actual not in t:raise SystemExit('Assessment freeze embedded Node newline repair did not converge')
    p.write_text(t,encoding='utf-8')


def repair_freeze_v2_quoting()->None:
    p=ROOT/'tools'/'finalize_assessment_hardening_v2.py'
    if not p.exists():return
    t=p.read_text(encoding='utf-8')
    old_open="    replacement=r'''def load_optional_runtime():"
    new_open='    replacement=r"""def load_optional_runtime():'
    old_close="    return items'''\n    replace_section(RUNTIME_QA"
    new_close='    return items"""\n    replace_section(RUNTIME_QA'
    if old_open in t:t=t.replace(old_open,new_open,1)
    if old_close in t:t=t.replace(old_close,new_close,1)
    if new_open not in t or new_close not in t:raise SystemExit('Assessment freeze v2 quoting repair did not converge')
    p.write_text(t,encoding='utf-8')


def repair_optional_isolation()->None:
    p=ROOT/'tools'/'apply_audit_hardening.py'
    t=p.read_text(encoding='utf-8')
    old=""" }));
}
if(optionalChoicesValidated!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesValidated}/40`);
if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
window.MM_QUESTION_QUALITY_OVERLAY={"""
    new=""" }));
 if(optionalChoicesValidated!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesValidated}/40`);
 if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
}
window.MM_QUESTION_QUALITY_OVERLAY={"""
    if old in t:t=t.replace(old,new,1)
    elif new not in t:raise SystemExit('Optional-practice isolation validation anchor moved')
    p.write_text(t,encoding='utf-8')


def main()->None:
    repair_freeze_quoting();repair_freeze_v2_quoting();repair_optional_isolation()
    for name in ('tools/finalize_assessment_hardening.py','tools/finalize_assessment_hardening_v2.py','tools/apply_audit_hardening.py'):
        if (ROOT/name).exists():py_compile.compile(str(ROOT/name),doraise=True)
    print('Hardening migration sources repaired and syntax-checked.')

if __name__=='__main__':main()
