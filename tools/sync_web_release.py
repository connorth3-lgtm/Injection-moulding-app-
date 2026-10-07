#!/usr/bin/env python3
"""Synchronise browser/PWA release identity from version.json.

`version.json` is the authoritative source for the browser release. This helper
keeps runtime cache identity, release QA expectations, and public fallback
version labels coherent so a governed learner-runtime change cannot leave one
surface pinned to an older release.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_RE = re.compile(r"^\d{4}\.\d{2}\.\d{2}\.\d+$")


def replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    out, count = re.subn(pattern, replacement, text, count=1, flags=re.M)
    if count != 1:
        raise SystemExit(f"Could not synchronise {label}: expected exactly one match, found {count}")
    return out


def desired_files() -> dict[Path, str]:
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    web_release = str(version.get("web_release", ""))
    if not VERSION_RE.fullmatch(web_release):
        raise SystemExit("version.json web_release must use YYYY.MM.DD.N")

    worker_path = ROOT / "service-worker.js"
    worker = worker_path.read_text(encoding="utf-8")
    revision_match = re.search(r"^const CACHE_REVISION='([^']+)';$", worker, flags=re.M)
    if not revision_match:
        raise SystemExit("service-worker CACHE_REVISION is missing")
    cache_revision = revision_match.group(1)
    worker = replace_once(
        worker,
        r"^const CACHE_VERSION='[^']+';$",
        f"const CACHE_VERSION='{web_release}';",
        "service-worker CACHE_VERSION",
    )

    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = replace_once(
        index,
        r'^    const SHELL_RELEASE="[^"]+";$',
        f'    const SHELL_RELEASE="{web_release}";',
        "index SHELL_RELEASE",
    )
    index = replace_once(
        index,
        r'^    const RUNTIME_ASSET_VERSION=(?:"[^"]+"|SHELL_RELEASE);$',
        '    const RUNTIME_ASSET_VERSION=SHELL_RELEASE;',
        "index RUNTIME_ASSET_VERSION",
    )
    expected_cache = f"mouldmaster-static-{web_release}-{cache_revision}"
    index = replace_once(
        index,
        r'^    const EXPECTED_STATIC_CACHE="[^"]+";$',
        f'    const EXPECTED_STATIC_CACHE="{expected_cache}";',
        "index EXPECTED_STATIC_CACHE",
    )

    shell_path = ROOT / "src/domains/shell/pwa-shell.js"
    shell = shell_path.read_text(encoding="utf-8")
    shell = replace_once(
        shell,
        r"^const RELEASE='[^']+';$",
        f"const RELEASE='{web_release}';",
        "pwa-shell RELEASE",
    )

    release_qa_path = ROOT / "qa_release.py"
    release_qa = replace_once(
        release_qa_path.read_text(encoding="utf-8"),
        r'^WEB_RELEASE = "[^"]+"$',
        f'WEB_RELEASE = "{web_release}"',
        "qa_release WEB_RELEASE",
    )

    release_docs_qa_path = ROOT / "qa_release_docs.py"
    release_docs_qa = replace_once(
        release_docs_qa_path.read_text(encoding="utf-8"),
        r"('web_release'\s*:\s*)'[^']+'",
        rf"\g<1>'{web_release}'",
        "qa_release_docs web_release",
    )

    readme_path = ROOT / "README.md"
    readme = replace_once(
        readme_path.read_text(encoding="utf-8"),
        r"^(\- PWA / browser shell: `)[^`]+(`)$",
        rf"\g<1>{web_release}\g<2>",
        "README PWA/browser release",
    )

    support_path = ROOT / "support.html"
    support = replace_once(
        support_path.read_text(encoding="utf-8"),
        r'(<[^>]+id="mmPwa"[^>]*>)[^<]+(</[^>]+>)',
        rf"\g<1>{web_release}\g<2>",
        "support PWA release fallback",
    )

    health_contract_path = ROOT / "data" / "health-program-v1.json"
    health_contract = replace_once(
        health_contract_path.read_text(encoding="utf-8"),
        r'("currentWebRelease"\s*:\s*")[^"]+(")',
        rf"\g<1>{web_release}\g<2>",
        "health program currentWebRelease",
    )

    health_status_path = ROOT / "HEALTH_STATUS.md"
    health_status = replace_once(
        health_status_path.read_text(encoding="utf-8"),
        r"^(Current learner-facing web release: \*\*)[^*]+(\*\*)$",
        rf"\g<1>{web_release}\g<2>",
        "health status current release",
    )
    health_status = replace_once(
        health_status,
        r"^(- Current learner-facing web release: \*\*)[^*]+(\*\*\.)$",
        rf"\g<1>{web_release}\g<2>",
        "health status current release contract",
    )

    governance_status_path = ROOT / "GOVERNANCE_STATUS.md"
    governance_status = replace_once(
        governance_status_path.read_text(encoding="utf-8"),
        r"^(Current governed web candidate: \*\*`)[^`]+(`\*\*\.)$",
        rf"\g<1>{web_release}\g<2>",
        "governance status current release",
    )

    compatibility_path = ROOT / "docs" / "CLIENT_COMPATIBILITY_MATRIX.md"
    compatibility = replace_once(
        compatibility_path.read_text(encoding="utf-8"),
        r"^(\| Web/PWA \| )\d{4}\.\d{2}\.\d{2}\.\d+( \|)",
        rf"\g<1>{web_release}\g<2>",
        "client compatibility Web/PWA release row",
    )
    compatibility = replace_once(
        compatibility,
        r"^(\| Capability \| Web/PWA )\d{4}\.\d{2}\.\d{2}\.\d+( \|)",
        rf"\g<1>{web_release}\g<2>",
        "client compatibility capability header",
    )

    polish_js_path = ROOT / "src" / "domains" / "shell" / "learner-ui-polish.js"
    polish_js = replace_once(
        polish_js_path.read_text(encoding="utf-8"),
        r"^(\/\* MouldMaster learner UI polish — )\d{4}\.\d{2}\.\d{2}\.\d+",
        rf"\g<1>{web_release}",
        "learner UI polish header",
    )
    polish_js = replace_once(
        polish_js,
        r"^const VERSION='[^']+';$",
        f"const VERSION='{web_release}';",
        "learner UI polish VERSION",
    )

    polish_css_path = ROOT / "src" / "domains" / "shell" / "learner-ui-polish.css"
    polish_css = replace_once(
        polish_css_path.read_text(encoding="utf-8"),
        r"^(\/\* MouldMaster learner UI polish — )\d{4}\.\d{2}\.\d{2}\.\d+( \*\/)$",
        rf"\g<1>{web_release}\g<2>",
        "learner UI polish CSS header",
    )
    polish_css = replace_once(
        polish_css,
        r"^(\/\* Canonical Home hierarchy — )\d{4}\.\d{2}\.\d{2}\.\d+( \*\/)$",
        rf"\g<1>{web_release}\g<2>",
        "learner UI Home polish release marker",
    )

    return {
        worker_path: worker,
        index_path: index,
        shell_path: shell,
        release_qa_path: release_qa,
        release_docs_qa_path: release_docs_qa,
        readme_path: readme,
        support_path: support,
        health_contract_path: health_contract,
        health_status_path: health_status,
        governance_status_path: governance_status,
        compatibility_path: compatibility,
        polish_js_path: polish_js,
        polish_css_path: polish_css,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = []
    for path, desired in desired_files().items():
        current = path.read_text(encoding="utf-8")
        if current == desired:
            continue
        changed.append(path.relative_to(ROOT).as_posix())
        if not args.check:
            path.write_text(desired, encoding="utf-8")
    if args.check and changed:
        raise SystemExit("Web release identity is out of sync: " + ", ".join(changed))
    if args.check:
        print("Web release identity is synchronised")
    elif changed:
        print("Synchronised web release identity: " + ", ".join(changed))
    else:
        print("Web release identity already synchronised")


if __name__ == "__main__":
    main()