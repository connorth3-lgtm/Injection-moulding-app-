#!/usr/bin/env python3
"""Build the minimal public GitHub Pages artifact for MouldMaster."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".pages-dist"

EXTRA_FILES = (
    "service-worker.js",
    "latest.json",
    "LICENSE",
    "NOTICE",
    "THIRD_PARTY_NOTICES.md",
)

FORBIDDEN_PREFIXES = (
    ".github/",
    "audit/",
    "certification/",
    "credentials/",
    "data/",
    "desktop/",
    "qa/",
    "sources/",
    "tools/",
)

FORBIDDEN_SUFFIXES = (
    ".exe",
    ".py",
    ".ps1",
    ".cjs",
)

LOCAL_FETCH_RE = re.compile(r"""fetch\s*\(\s*(['\"])([^'\"]+)\1""")
SERVICE_WORKER_RE = re.compile(r"""serviceWorker\.register\s*\(\s*(['\"])([^'\"]+)\1""")
CSS_URL_RE = re.compile(r"""url\(\s*(['\"]?)([^)'\"]+)\1\s*\)""")


class LocalReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        wanted = {"src", "href"}
        for key, value in attrs:
            if key in wanted and value:
                self.references.append(value)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_service_worker_core() -> list[str]:
    source = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    match = re.search(r"const\s+CORE\s*=\s*\[(.*?)\]\s*;", source, flags=re.S)
    if not match:
        raise SystemExit("Could not locate service-worker CORE asset list")
    assets = re.findall(r"""['\"]\./([^'\"]+)['\"]""", match.group(1))
    if not assets:
        raise SystemExit("Service-worker CORE asset list is empty")
    return assets


def normalise_local_reference(raw: str) -> str | None:
    raw = raw.strip()
    if not raw or raw.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    parts = urlsplit(raw)
    if parts.scheme or parts.netloc:
        return None
    path = unquote(parts.path).replace("\\", "/")
    if not path:
        return None
    while path.startswith("./"):
        path = path[2:]
    if path.startswith("/"):
        path = path[1:]
    if not path:
        return None
    bits = Path(path).parts
    if ".." in bits:
        raise SystemExit(f"Unsafe parent-path public reference: {raw}")
    return "/".join(bits)


def validate_boundary(rel: str) -> None:
    lower = rel.lower()
    if any(lower.startswith(prefix) for prefix in FORBIDDEN_PREFIXES):
        raise SystemExit(f"Forbidden repository area selected for Pages: {rel}")
    if any(lower.endswith(suffix) for suffix in FORBIDDEN_SUFFIXES):
        raise SystemExit(f"Forbidden file type selected for Pages: {rel}")
    if Path(rel).name.startswith("qa_"):
        raise SystemExit(f"QA file selected for Pages: {rel}")


def validate_runtime_references(public_files: set[str]) -> None:
    missing: set[str] = set()

    for rel in sorted(public_files):
        path = ROOT / rel
        refs: list[str] = []
        if path.suffix.lower() in {".html", ".htm"}:
            parser = LocalReferenceParser()
            parser.feed(path.read_text(encoding="utf-8"))
            refs.extend(parser.references)
        if path.suffix.lower() == ".css":
            refs.extend(match.group(2) for match in CSS_URL_RE.finditer(path.read_text(encoding="utf-8")))
        if path.suffix.lower() in {".js", ".html", ".htm"}:
            text = path.read_text(encoding="utf-8")
            refs.extend(match.group(2) for match in LOCAL_FETCH_RE.finditer(text))
            refs.extend(match.group(2) for match in SERVICE_WORKER_RE.finditer(text))

        for raw in refs:
            target = normalise_local_reference(raw)
            if not target:
                continue
            if target in public_files:
                continue
            candidate = ROOT / target
            if candidate.exists() and candidate.is_file():
                missing.add(f"{rel} -> {target}")

    if missing:
        details = "\n".join(f"  - {item}" for item in sorted(missing))
        raise SystemExit(f"Runtime references files outside the Pages allowlist:\n{details}")


def extract_runtime_metadata() -> tuple[str, str, str]:
    hardening = (ROOT / "assessment-psychometric-hardening.js").read_text(encoding="utf-8")
    version_match = re.search(r"""const\s+VERSION\s*=\s*['\"]([^'\"]+)['\"]""", hardening)
    if not version_match:
        raise SystemExit("Could not extract assessment psychometric runtime version")

    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    cache_match = re.search(r"""CACHE_VERSION\s*=\s*['\"]([^'\"]+)['\"]""", worker)
    revision_match = re.search(r"""CACHE_REVISION\s*=\s*['\"]([^'\"]+)['\"]""", worker)
    if not cache_match or not revision_match:
        raise SystemExit("Could not extract service-worker cache metadata")

    return version_match.group(1), cache_match.group(1), revision_match.group(1)


def main() -> None:
    public_files = set(extract_service_worker_core())
    public_files.update(EXTRA_FILES)

    for rel in sorted(public_files):
        validate_boundary(rel)
        path = ROOT / rel
        if not path.exists() or not path.is_file():
            raise SystemExit(f"Required public asset is missing: {rel}")

    validate_runtime_references(public_files)

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for rel in sorted(public_files):
        src = ROOT / rel
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    runtime_version, cache_version, cache_revision = extract_runtime_metadata()
    source_sha = os.environ.get("GITHUB_SHA", "local")
    deployment = {
        "schema": 1,
        "source_sha": source_sha,
        "source_ref": os.environ.get("GITHUB_REF_NAME", "local"),
        "assessment_runtime": runtime_version,
        "service_worker_cache_version": cache_version,
        "service_worker_cache_revision": cache_revision,
        "artifact_policy": "service-worker-core-plus-minimal-public-metadata",
    }
    (OUT / "deployment.json").write_text(
        json.dumps(deployment, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    manifest_files = sorted(public_files | {"deployment.json"})
    manifest = {
        "schema": 1,
        "source_sha": source_sha,
        "asset_count": len(manifest_files),
        "assets": {
            rel: {
                "sha256": sha256(OUT / rel),
                "bytes": (OUT / rel).stat().st_size,
            }
            for rel in manifest_files
        },
    }
    (OUT / "pages-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    print(
        f"Pages artifact ready: {len(manifest_files)} public assets "
        f"(assessment runtime {runtime_version}, source {source_sha[:12]})."
    )
    print("Excluded repository areas: " + ", ".join(FORBIDDEN_PREFIXES))


if __name__ == "__main__":
    main()
