MOULDMASTER LEGACY WINDOWS RECOVERY FEED

CURRENT DESIGN
- latest.json is the hash-verified recovery manifest used by the legacy installed Windows launcher.
- The recovery feed is intentionally separate from the current PWA/open-Electron release lanes.
- latest.json currently points to the preserved known-good MouldMaster_Core_App.html from the audited 2026.08.21.1 recovery snapshot.
- MouldMasterAcademy.exe remains the legacy native Windows launcher/updater and is retained only for recovery compatibility.
- Newer PWA assessment, reference and analytics layers must NOT be silently inserted into this legacy feed; they ship through the browser/PWA and open Electron desktop lanes unless a separate recovery migration is deliberately validated.

PUBLISH ORDER FOR A FUTURE RECOVERY CONTENT RELEASE
1. Build and test the complete recovery content on the legacy launcher/updater path.
2. Verify learner-data compatibility and the complete assessment/certificate behavior on real Windows hardware.
3. Publish the exact immutable content bytes first.
4. Calculate SHA-256 from those exact bytes.
5. Increment latest.json "version" and set "app_url" to the immutable commit/object plus the verified "sha256".
6. Never publish the manifest before its referenced content exists and has been tested.

OFFLINE / FAIL-SAFE BEHAVIOUR
- The legacy Windows launcher verifies downloaded recovery content before accepting it.
- If verification or update compatibility fails, keep the known-good installed copy rather than replacing it with incomplete content.
- The current open Electron desktop has its own bundled SHA-256 integrity manifest and build workflow; do not conflate those controls with this legacy recovery feed.

WINDOWS SIGNING STATUS
- MouldMasterAcademy.exe is not represented as the preferred open-source public Windows distribution. The repository publishes its exact SHA-256 in latest.json for recovery verification.
- The preferred future public Windows lane is the open Electron package / Microsoft Store path, subject to exact Partner Center identity values, build validation and external Microsoft certification/signing.

CURRENT LEGACY RECOVERY CONTENT
2026.08.21.1

CURRENT PWA TRAINING CONTENT
2026.08.24.2

CURRENT AUDITED QUESTION BANK
2026.08.24.2

CURRENT ASSESSMENT QUALITY / ANALYTICS HARDENING
2026.08.24.3

LEARNER-SCOPED ASSESSMENT STORAGE
2026.08.24.4

The different versions are intentional. version.json is the machine-readable source of truth for current release lanes; latest.json is the machine-readable source of truth only for the legacy Windows recovery lane.
