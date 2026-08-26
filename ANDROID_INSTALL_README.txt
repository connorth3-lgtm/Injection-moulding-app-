MOULDMASTER ACADEMY — ANDROID INSTALLABLE APP

LIVE APP
https://connorth3-lgtm.github.io/Injection-moulding-app-/

PUBLISHING
GitHub Pages: Deploy from branch > main > /(root)

PWA / OFFLINE APPLICATION FILES
  index.html
  MouldMaster_Core_App.html
  MouldMaster_Academy_App.html
  manifest.webmanifest
  service-worker.js
  version.json
  reading-patch.css
  reading-patch.js
  training-upgrade.js
  training-qa-fix.js
  assessment-100-pass.js
  assessment-deep-dive.js
  assessment-answer-cue-fix.js
  assessment-storage-scope.js
  assessment-quality-suite.js
  assessment-stable-review-bridge.js
  assessment-analytics-ui.js
  assessment-final-hardening.js
  assessment-ux.js
  source-library.js
  reference-data.js
  reference-data.html
  reference-deep-dive.js
  reference-research-extension.js
  reference-20x-extension.js
  reference-2026-expansion.js
  reference-sources.js
  reference-browser-ui.js
  diagnostic-learning-labs.js
  material-behaviour-labs.js
  app-shell-registry.js
  process-data-diagnostics.js
  learning-experience.js
  curriculum-integration.js
  specialist-curriculum.js
  mould-master-workspace.js
  app-shell-finalize.js
  learning-analytics.js
  assessment-evidence-sources.js
  evidence-maturity-deep-dive.js
  evidence-maturity-formal-bridge.js
  lesson-evidence-depth.js
  assessment-evidence-approval.js
  pwa-shell.js
  privacy.html
  support.html
  mouldmaster-192.png
  mouldmaster-512.png
  .nojekyll

INSTALL ON ANDROID
1. Open the live app in Chrome while online.
2. Let it finish loading once.
3. Chrome menu > Install app / Add to Home screen.
4. Confirm Install.

UPDATE / OFFLINE DESIGN
- index.html is a direct bootstrap; it does not rely on service-worker text rewriting to pretend the source is current.
- The service worker caches the exact unversioned application URLs requested by the bootstrap and uses ignoreSearch only as a compatibility fallback.
- The audited core app, assessment/training layers, canonical app shell, Mould Master evidence casebook, Diagnostic Learning Labs, Material Behaviour Labs, guided process-data practice, lesson-to-practice curriculum integration, specialist extensions, local learner analytics, evidence-approval/maturity layers, reference browser/data, privacy/support pages, manifest, icons and version metadata are cached for offline use after a successful install/update.
- Navigation is network-first while online and only a root/index response can refresh the cached bootstrap, preventing another HTML page from replacing the offline shell.
- Learner progress remains in the browser/app profile during application updates.

DATA / ASSESSMENT HARDENING
- Spaced repetition uses stable question IDs independent of content-release wording; older version-prefixed review records are migrated conservatively.
- Backup/import validates and serialises core learner data and training extras before storage changes, with rollback if a core/training write fails.
- Backup imports are limited to 10 MiB, reject duplicate learner identifiers after sanitisation and keep each learner's stored ID aligned with its database key.
- Imported progress never imports certificate authority; certificates must be re-earned by passing a newly submitted assessment on that device.
- Assessment analytics are device-local and scoped to the active learner profile so shared-browser learners do not intentionally share question-performance history.
- Assessment analytics are not included in progress backups. A successful progress import resets local assessment analytics to prevent history from being attributed to imported learner records.
- Response-time analytics start from meaningful question exposure and exclude time while the page is hidden.
- A submitted exam is locked after its first grading, so revealed answers cannot be re-used to regrade the same attempt.
- A confirmed factory reset clears spaced-review, practical sign-off and all assessment-analytics stores.
- All 157 keyed learner questions across formal exams/scenarios, Diagnostic Learning Labs and Material Behaviour Labs are subject to the evidence-approval release gate. Unmatched technical topics fail closed rather than receiving a generic source.
- The canonical curriculum remains 120 core lessons; lesson-to-practice integration links each core lesson to formative evidence practice, while 12 specialist extensions remain optional and separate from certificate completion.
- Mould Master troubleshooting cases are learner-scoped, local evidence records. They organise symptom, baseline, measured evidence, ranked mechanism, controlled test and verification; they do not provide universal production setpoints or machine-control authority.
- Auto-selected lesson references are subject-curated; if no relevant general reference matches, the app says so instead of showing an unrelated source.
- Older NZ injection/blow-moulding guidance is explicitly labelled legacy/supplementary; current HSWA/WorkSafe/site requirements control.
- Current answer keys, the >=80% overall threshold and the zero-wrong safety-critical regional gate remain unchanged.

VERSIONING
Android/PWA shell: 2026.08.26.2
Training content: 2026.08.26.1
Audited question bank: 2026.08.24.2
Assessment quality / analytics hardening: 2026.08.24.3
Learner-scoped assessment storage: 2026.08.24.4
Question evidence approval: 2026.08.25.2

version.json is the machine-readable source of truth. The separate versions are intentional: shell/runtime, training content, audited question bank, assessment-quality logic, analytics-storage privacy and evidence approval can change independently.
