#!/usr/bin/env python3
"""Build the GitHub Pages release-hold artifact.

The root publication remains a release hold while production PWA evidence is pending.
Optionally, the already-built public learner artifact may be copied under /preview/ as
a clearly separated non-production preview. This does not change production readiness,
the governed physical-device contract, or the production verifier.

When a preview is staged, the hold root also publishes a tiny migration-only service
worker. Its sole job is to replace an older installed root PWA worker and move stale
root clients onto /preview/. It does not cache or serve learner runtime assets and does
not change the release-hold status of the production root.

The hold site also exposes one standalone, inline-only device metadata helper so a
physical device can report the non-sensitive values needed by the governed validation
contract. The helper does not load the learner runtime, register a service worker,
transmit data, or persist captured values.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_FILES = {"index.html", "404.html", "device-validation.html"}
MIGRATION_FILE = "service-worker.js"
MARKER = 'data-mm-release-hold="true"'
HELPER_MARKER = 'data-mm-device-metadata-helper="true"'
PREVIEW_MARKER = 'content="non-production-preview"'
MIGRATION_REGISTER_MARKER = 'data-mm-release-hold-migration="true"'
MIGRATION_WORKER_MARKER = "MouldMaster release-hold migration worker"
PREVIEW_REQUIRED = {"index.html", "manifest.webmanifest", "service-worker.js", "version.json"}


def migration_registration() -> str:
    return f"""<script {MIGRATION_REGISTER_MARKER}>
(function(){{
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('./service-worker.js',{{scope:'./'}})
    .then(function(reg){{return reg.update();}})
    .catch(function(){{}});
}})();
</script>"""


def migration_worker() -> str:
    return f"""/* {MIGRATION_WORKER_MARKER} */
'use strict';
const PREVIEW_PATH='./preview/';

function previewUrl(){{return new URL(PREVIEW_PATH,self.registration.scope)}}
function shouldMove(url){{
  const preview=previewUrl();
  return url.origin===preview.origin&&!url.pathname.startsWith(preview.pathname);
}}

self.addEventListener('install',event=>{{event.waitUntil(self.skipWaiting())}});
self.addEventListener('activate',event=>{{
  event.waitUntil((async()=>{{
    await self.clients.claim();
    const preview=previewUrl();
    const windows=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});
    await Promise.all(windows.map(async client=>{{
      try{{
        const url=new URL(client.url);
        if(shouldMove(url))await client.navigate(preview.href);
      }}catch(_){{}}
    }}));
  }})());
}});
self.addEventListener('fetch',event=>{{
  if(event.request.method!=='GET'||event.request.mode!=='navigate')return;
  const url=new URL(event.request.url);
  if(shouldMove(url))event.respondWith(Promise.resolve(Response.redirect(previewUrl().href,302)));
}});
"""


def document(*, not_found: bool = False, preview_available: bool = False) -> str:
    heading = "MouldMaster page unavailable" if not_found else "MouldMaster production release on hold"
    detail = (
        "This path is not part of the currently published release-hold site."
        if not_found
        else "The production PWA remains gated while required physical-device validation is pending."
    )
    helper = (
        ""
        if not_found
        else '<p><a href="device-validation.html">Capture device validation metadata on this device</a></p>'
    )
    preview = (
        '<p><a href="preview/">Open the current non-production MouldMaster preview</a></p>'
        if (preview_available and not not_found)
        else ""
    )
    migration = migration_registration() if (preview_available and not not_found) else ""
    boundary = (
        "No learner application runtime is served from this root release-hold page. "
        "The separate /preview/ path is non-production and does not satisfy or bypass the production validation gate."
        if preview_available and not not_found
        else "No learner application runtime, assessment content, repository tooling or legacy distribution files are served from this Pages publication."
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>MouldMaster release hold</title>
</head>
<body>
  <main {MARKER}>
    <h1>{heading}</h1>
    <p>{detail}</p>
    <p>{boundary}</p>
    {preview}
    {helper}
  </main>
  {migration}
</body>
</html>
"""


def validate_helper(payload: str) -> None:
    if HELPER_MARKER not in payload:
        raise SystemExit("device metadata helper marker is missing")
    lowered = payload.lower()
    forbidden_network_tokens = (
        "fetch(",
        "xmlhttprequest",
        "sendbeacon",
        "websocket",
        "serviceworker",
        "localstorage",
        "sessionstorage",
        "indexeddb",
    )
    found = [token for token in forbidden_network_tokens if token in lowered]
    if found:
        raise SystemExit("device metadata helper must remain local-only; forbidden token(s): " + ", ".join(found))
    if '<script src=' in lowered or '<link ' in lowered:
        raise SystemExit("device metadata helper must not reference external runtime assets")


def validate_migration_worker(payload: str) -> None:
    required = (
        MIGRATION_WORKER_MARKER,
        "./preview/",
        "self.skipWaiting()",
        "self.clients.claim()",
        "client.navigate(preview.href)",
        "Response.redirect(previewUrl().href,302)",
    )
    missing = [token for token in required if token not in payload]
    if missing:
        raise SystemExit("release-hold migration worker is incomplete: " + ", ".join(missing))
    lowered = payload.lower()
    if "caches.open" in lowered or ".put(" in lowered or "mouldmaster_core_app" in lowered:
        raise SystemExit("release-hold migration worker must never cache or serve learner runtime assets")


def stage_preview(preview_source: Path, preview_target: Path) -> None:
    if not preview_source.is_dir():
        raise SystemExit(f"preview source is missing or not a directory: {preview_source}")
    source_files = {path.relative_to(preview_source).as_posix() for path in preview_source.rglob("*") if path.is_file()}
    missing = sorted(PREVIEW_REQUIRED - source_files)
    if missing:
        raise SystemExit("preview source is missing required public runtime files: " + ", ".join(missing))
    shutil.copytree(preview_source, preview_target)
    index_path = preview_target / "index.html"
    payload = index_path.read_text(encoding="utf-8")
    marker = '<meta name="mm-publication-boundary" content="non-production-preview">'
    if PREVIEW_MARKER not in payload:
        if "<head>" not in payload:
            raise SystemExit("preview index.html does not contain a head element")
        payload = payload.replace("<head>", "<head>\n  " + marker, 1)
        index_path.write_text(payload, encoding="utf-8")


def build(target: Path, preview_source: Path | None = None) -> set[str]:
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    preview_available = preview_source is not None
    (target / "index.html").write_text(document(preview_available=preview_available), encoding="utf-8")
    (target / "404.html").write_text(document(not_found=True), encoding="utf-8")

    helper_source = ROOT / "device-validation.html"
    if not helper_source.is_file():
        raise SystemExit("device-validation.html source is missing")
    helper_payload = helper_source.read_text(encoding="utf-8")
    validate_helper(helper_payload)
    (target / "device-validation.html").write_text(helper_payload, encoding="utf-8")

    allowed_root_files = set(ALLOWED_FILES)
    if preview_available:
        worker_payload = migration_worker()
        validate_migration_worker(worker_payload)
        (target / MIGRATION_FILE).write_text(worker_payload, encoding="utf-8")
        allowed_root_files.add(MIGRATION_FILE)

    root_files = {path.name for path in target.iterdir() if path.is_file()}
    if root_files != allowed_root_files:
        raise SystemExit(f"release-hold artifact boundary mismatch (root files): {sorted(root_files)}")

    if preview_source is not None:
        stage_preview(preview_source, target / "preview")

    for name in ("index.html", "404.html"):
        payload = (target / name).read_text(encoding="utf-8")
        if MARKER not in payload:
            raise SystemExit(f"release-hold marker missing from {name}")
        lowered = payload.lower()
        if "<link" in lowered:
            raise SystemExit(f"release-hold document unexpectedly references active linked assets: {name}")
        if name == "404.html" and "<script" in lowered:
            raise SystemExit("release-hold 404 document must remain script-free")
        if name == "index.html":
            if preview_available:
                if payload.count("<script") != 1 or MIGRATION_REGISTER_MARKER not in payload or "<script src=" in lowered:
                    raise SystemExit("release-hold root may contain only the inline stale-PWA migration registration")
                if "mouldmaster_core_app" in lowered or "manifest.webmanifest" in lowered:
                    raise SystemExit("release-hold root must not load learner runtime assets")
            elif "<script" in lowered:
                raise SystemExit("release-hold root must remain script-free when no preview is staged")

    files = {path.relative_to(target).as_posix() for path in target.rglob("*") if path.is_file()}
    return files


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=".pages-hold")
    parser.add_argument("--preview-source")
    args = parser.parse_args()
    preview_source = Path(args.preview_source) if args.preview_source else None
    files = build(Path(args.output), preview_source=preview_source)
    preview_note = " with a separated non-production /preview/ learner runtime and stale-PWA migration worker" if preview_source else ""
    print(
        f"Pages release-hold artifact ready: {len(files)} public files{preview_note}; "
        "production remains gated and the device metadata helper remains local-only."
    )


if __name__ == "__main__":
    main()
