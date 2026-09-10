#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / 'MouldMaster_Core_App.html'
DEEP = ROOT / 'assessment-deep-dive.js'
BRIDGE = ROOT / 'assessment-stable-review-bridge.js'
APPROVAL = ROOT / 'assessment-evidence-approval.js'


def need(ok: bool, msg: str) -> None:
    if not ok:
        raise SystemExit(msg)


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def write(path: Path, text: str) -> None:
    path.write_text(text, encoding='utf-8')


def restore_frozen_core() -> None:
    p = subprocess.run(
        ['git', 'checkout', '--', CORE.relative_to(ROOT).as_posix()],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
    )
    need(p.returncode == 0, 'could not restore frozen core: ' + (p.stderr or p.stdout))


def core_data() -> dict:
    src = read(CORE)
    marker = 'window.MM_DATA = '
    need(marker in src, 'MM_DATA marker missing from frozen core')
    data, _ = json.JSONDecoder().raw_decode(src[src.index(marker) + len(marker):])
    need(len(data.get('scenarios') or []) >= 8, 'frozen core scenario bank is unexpectedly short')
    return data


def reviewed_contract() -> dict[str, str]:
    src = read(BRIDGE)
    start = src.index('const STRICT_ANSWER_BALANCE={')
    end = src.index('\n};', start)
    pairs = re.findall(r"^\s*'([^']+)':'([^']*)',?\s*$", src[start:end], re.M)
    out = dict(pairs)
    need(len(out) == 94, f'reviewed answer contract changed: {len(out)}/94')
    for i in range(1, 9):
        need(f'scenario:{i:02d}' in out, f'missing reviewed core scenario contract: scenario:{i:02d}')
    return out


def author_core_scenarios() -> list[str]:
    data = core_data()
    contract = reviewed_contract()
    entries = []
    titles = []
    for i, scenario in enumerate(data['scenarios'][:8], start=1):
        item_id = f'scenario:{i:02d}'
        title = str(scenario['title'])
        situation = str(scenario['situation'])
        choices = list(scenario['choices'])
        key = int(scenario['correct'])
        why = str(scenario.get('why') or '')
        need(len(choices) == 4 and 0 <= key < 4, f'{item_id}: invalid frozen core scenario shape')
        choices[key] = contract[item_id]
        entries.append(
            f' {json.dumps(title, ensure_ascii=False)}:'
            f'[{json.dumps(situation, ensure_ascii=False)},'
            f'{json.dumps(choices, ensure_ascii=False)},'
            f'{key},{json.dumps(why, ensure_ascii=False)}],'
        )
        titles.append(title)

    src = read(DEEP)
    marker = 'const SCENARIO={\n'
    need(marker in src, 'assessment deep-dive scenario authoring map missing')
    for title in titles:
        need(json.dumps(title, ensure_ascii=False) not in src, f'core scenario already authored in deep-dive: {title}')
    src = src.replace(marker, marker + '\n'.join(entries) + '\n', 1)
    src = src.replace('scenarioItemsRewritten:8', 'scenarioItemsRewritten:16', 1)
    src = src.replace("scenarioRewrites:8,regionalAnswerChanges:0", "scenarioRewrites:16,regionalAnswerChanges:0", 1)
    write(DEEP, src)
    return titles


def update_approval_pin(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    p = subprocess.run(['git', 'hash-object', rel], cwd=ROOT, capture_output=True, text=True)
    need(p.returncode == 0, f'git hash-object failed for {rel}: {p.stderr}')
    sha = p.stdout.strip()
    src = read(APPROVAL)
    pattern = re.compile(rf"'{re.escape(rel)}':'[0-9a-f]{{40}}'")
    src, count = pattern.subn(f"'{rel}':'{sha}'", src, count=1)
    need(count == 1, f'approval pin not found for {rel}')
    write(APPROVAL, src)
    return sha


def main() -> None:
    restore_frozen_core()
    titles = author_core_scenarios()
    core_pin = update_approval_pin(CORE)
    deep_pin = update_approval_pin(DEEP)
    print(json.dumps({
        'frozenCorePreserved': True,
        'coreScenarioAnswersAuthoredInDeepDive': len(titles),
        'titles': titles,
        'approvalPins': {
            CORE.relative_to(ROOT).as_posix(): core_pin,
            DEEP.relative_to(ROOT).as_posix(): deep_pin,
        },
    }, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
