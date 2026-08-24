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

- PWA / browser shell: `2026.08.24.1`
- Open desktop source: `2026.08.24.1`
- Training content: `2026.08.23.5`
- Audited assessment bank: `2026.08.21.1`
- Legacy Windows recovery lane: `2026.08.21.1`

`version.json` is the machine-readable release record.

## Run the PWA

The hosted PWA is published through GitHub Pages:

`https://connorth3-lgtm.github.io/Injection-moulding-app-/`

The PWA uses an installable web manifest and a service worker for offline support after a successful initial load.

## Open Windows desktop replacement

The preferred replacement for the legacy Windows launcher is under:

`desktop/electron/`

It provides public source and documented builds for portable Windows, NSIS and MSIX/Microsoft Store packaging.

Security controls include:
- SHA-256 verification of bundled MouldMaster application assets before launch;
- Node integration disabled in the renderer;
- context isolation and Electron sandbox enabled;
- renderer permissions denied by default;
- webviews blocked;
- external HTTPS references opened in the system browser;
- a loopback-only `127.0.0.1` application server with an explicit asset allow list;
- exact direct dependency versions plus a committed npm lockfile;
- dependency licence inventory and CycloneDX SBOM generation;
- GitHub Actions build provenance and release hashes.

See `desktop/electron/README.md` and `desktop/electron/THREAT_MODEL.md`.

### Why the old EXE still exists

`MouldMasterAcademy.exe` is retained only as the known-good Windows recovery launcher while the open replacement is built and tested on real Windows hardware. Its original preferred source/build recipe has not been located, so it is **not represented as fully open source**.

The Windows recovery feed must not be migrated to the new desktop package until the open package passes hardware/regression testing and learner-data migration is confirmed.

## Microsoft Store

A gated Store workflow exists at `.github/workflows/microsoft-store-msix.yml`. It intentionally refuses to create a Store package until the exact Microsoft Partner Center identity values are supplied as repository variables.

This prevents invented publisher metadata from being used. Microsoft certification/signing is an external approval step and must not be claimed before it is granted.

## Training certificates

Current MouldMaster certificates are learning-completion records. They are not NZQA qualifications, IACET CEUs, statutory licences, government certifications or proof of legal competence to operate machinery.

Accreditation-readiness material is under `certification/` and credential-governance work is under `credentials/`.

## Sources

The application uses authoritative references from regulators, legislation, standards bodies, research literature and manufacturers. The formal source register is:

`sources/AUTHORITATIVE_SOURCE_REGISTER.md`

External source material remains subject to its publisher's rights. Citing a standard or paper does not relicense its protected text into this project.

Assessment integrity is preserved: general lesson references are not injected into unanswered exams. Exact assessment-item references are reserved for post-grade explanation where provided.

## Safety

MouldMaster is an educational resource. It does not replace:
- machine manufacturer instructions;
- current resin supplier data;
- approved site procedures;
- competent risk assessment;
- authorised energy-isolation procedures;
- applicable legislation and standards;
- employer authorisation and machine-specific practical training.

Do not bypass guards, interlocks or hazardous-energy controls to follow training content.

## Release QA

`qa_release.py` and GitHub Actions enforce core assessment, safety, source, licence and desktop-security invariants.

A release should not be treated as verified merely because source was committed; build/test results and release hashes must also be reviewed.
