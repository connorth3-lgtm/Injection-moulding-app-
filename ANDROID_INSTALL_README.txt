MOULDMASTER ACADEMY — ANDROID INSTALLABLE APP

LIVE APP
https://connorth3-lgtm.github.io/Injection-moulding-app-/

PUBLISHING
GitHub Pages: Deploy from branch > main > /(root)

PWA FILES
  index.html
  MouldMaster_Academy_App.html
  manifest.webmanifest
  service-worker.js
  version.json
  reading-patch.css
  reading-patch.js
  training-upgrade.js
  training-qa-fix.js
  pwa-shell.js
  mouldmaster-192.png
  mouldmaster-512.png
  .nojekyll

INSTALL ON ANDROID
1. Open the live app in Chrome while online.
2. Let it finish loading once.
3. Chrome menu > Install app / Add to Home screen.
4. Confirm Install.

UPDATE / OFFLINE DESIGN
- index.html is now a direct bootstrap; it no longer relies on service-worker text rewriting to pretend the source is current.
- The service worker caches the exact unversioned URLs requested by the bootstrap and uses ignoreSearch only as a compatibility fallback.
- The audited core app, training scripts, CSS, manifest, icons and metadata are all cached for offline use after a successful online load.
- Navigation is network-first while online and only a root/index response can refresh the cached bootstrap, preventing another HTML page from replacing the offline shell.
- Learner progress remains in the browser/app profile during application updates.

DATA / ASSESSMENT HARDENING
- Spaced repetition uses question-bank-versioned IDs rather than question wording.
- Backup/import validates and serialises core learner data and training extras before any storage changes, with rollback if a write fails.
- Backup imports are limited to 10 MiB, reject duplicate learner identifiers after sanitisation and keep each learner's stored ID aligned with its database key.
- Imported progress never imports certificate authority; certificates must be re-earned by passing a newly submitted assessment on that device.
- A submitted exam is locked after its first grading, so revealed answers cannot be re-used to regrade the same attempt.
- A confirmed factory reset clears spaced-review and practical sign-off data even when the main learner database was already in its pristine state.
- Auto-selected lesson references are subject-curated; if no relevant general reference matches, the app says so instead of showing an unrelated source.
- Older NZ injection/blow-moulding guidance is explicitly labelled legacy/supplementary; current HSWA/WorkSafe/site requirements control.
- Existing audited answer keys, the >=80% overall threshold and the zero-wrong safety-critical regional gate are unchanged.

VERSIONING
Android shell: 2026.08.23.9
Training content: 2026.08.23.4
Audited core question bank: 2026.08.21.1

The separate versions are intentional: visual/runtime shell changes, training/lesson changes and the audited assessment bank are tracked independently.
