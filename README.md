# MouldMaster Academy

MouldMaster Academy is an open-source injection-moulding learning platform covering beginner foundations through advanced process engineering, troubleshooting, materials, statistics, tooling, automation and jurisdiction-aware safety learning.

## Open source

Repository-owned source code, documentation and original project assets are licensed under **Apache License 2.0** unless a file explicitly states otherwise. Apache-2.0 includes an express contributor patent licence.

See:
- `LICENSE`
- `OPEN_SOURCE_AND_PATENT_POLICY.md`
- `THIRD_PARTY_NOTICES.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

The project maintainers do not intend to seek patent protection over implementation contributed to this public repository. This is not a worldwide third-party patent clearance or freedom-to-operate opinion.

## Current release lanes

- PWA / browser shell: `2026.11.14.3`
- Learn Question Centre: 214 total prompts, including 45 formative material-science questions
- Open Windows desktop: `2026.09.29.1`
- Android shell: `2026.11.08.1` (WebView content: hosted `/preview/`, currently web release `2026.11.14.2`)
- Training content: `2026.08.26.1`
- Audited assessment bank: `2026.08.30.1`
- Assessment quality / analytics hardening: `2026.08.24.3`
- Learner-scoped assessment storage: `2026.08.24.4`
- Question evidence approval: `2026.10.05.1`
- Frozen legacy Windows recovery lane: `2026.08.21.1`

`version.json` is the machine-readable release record and is the source of truth for release identifiers.

The Android package versions its native shell separately from the web content. Its WebView loads the hosted `/preview/` route, so it receives that route's current standards and Book content when online. This does not prove physical-device installation, offline behavior, audio continuity, or Play Store readiness; those remain separate checks.

## Run the PWA

The browser/PWA lane is published through GitHub Pages:

`https://connorth3-lgtm.github.io/Injection-moulding-app-/`

The Pages **production root is fail-closed** when the current learner-runtime fingerprint does not yet have current physical-device authorization. In that state the root serves a release-hold page and the exact governed learner candidate is available only under the clearly labelled non-production `/preview/` path for review and device validation. Prior-release physical evidence is never silently inherited by changed runtime bytes.

The PWA uses an installable web manifest and a service worker for offline support after a successful initial load. The current shell caches the audited core, assessment/runtime layers, guided learning, specialist curriculum, reference data and the privacy/support pages required by the public app. Governed learner-runtime changes must advance the web release/cache identity; mandatory Release QA compares each change with its parent so an installed PWA cannot silently reuse the previous cache generation after runtime bytes change. Release QA also derives the browser shell/domain load graph independently and rejects any shell/runtime asset that is not present in the service-worker governance set.

## Controlled tester handoff (non-production only)

**Do not circulate the learner preview until it is verified as the intended hosted release.** Merging a PR into the `preview` **Git branch** does not deploy it to the hosted `/preview/` URL. The hosted preview is staged by the protected-`main` Pages release-hold workflow, while production-root publication remains blocked by the distinct physical-device authorization gate.

Tester-facing documentation and owner preflight:

- [Owner handoff and no-send checklist](docs/TESTER_HANDOFF.md) — exact protected-main deployment, live-source verification, safety and privacy STOP conditions.
- [Tester quick start](docs/TESTER_QUICK_START.md) — fictional local profile, learning tasks, feedback and local data limits.
- [Invitation template](docs/TESTER_INVITATION.md) — copy only after preflight is com