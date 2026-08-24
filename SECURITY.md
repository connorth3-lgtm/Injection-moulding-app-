# Security Policy

## Supported release lanes

Security fixes are prioritised for:
- the current hosted PWA/browser release;
- the current open desktop source under `desktop/electron/`;
- the known-good legacy Windows recovery lane only where necessary to preserve safe recovery/migration.

The legacy `MouldMasterAcademy.exe` should not receive new feature development. The preferred direction is migration to the openly buildable desktop package after validation.

## Reporting a vulnerability

Please avoid publishing an exploitable vulnerability, learner-data exposure or integrity-bypass proof publicly before maintainers have had a reasonable chance to assess it.

If private reporting is available for this GitHub repository, use GitHub's private security reporting/security-advisory mechanism. If it is not enabled, open a minimal issue asking for a private security contact **without posting secrets, learner data, exploit payloads or bypass instructions**.

Useful details include:
- affected release/commit;
- affected platform;
- clear reproduction conditions;
- security impact;
- whether assessment integrity, local learner data or package/update integrity is affected;
- suggested mitigation if known.

Never include real learner personally identifying information in a report.

## Security invariants

Changes must preserve the following unless an equally strong documented replacement is reviewed:

### Assessment / learner records
- unanswered assessments must not be given answer-revealing references;
- safety-critical pass gates must not be bypassed;
- imported backups must not silently import earned certificates as trusted credentials;
- malformed imports must fail without corrupting existing learner data.

### Web/PWA
- offline/service-worker updates must not silently replace core content with missing or failed network responses;
- external learning sources are references, not trusted executable application code.

### Open desktop
- SHA-256 verification of bundled required assets before application launch;
- `nodeIntegration: false`;
- `contextIsolation: true`;
- `sandbox: true`;
- renderer permissions denied by default;
- webview attachment blocked;
- external HTTPS pages opened outside the privileged application window;
- local server bound to `127.0.0.1` only;
- explicit file allow list and traversal rejection;
- exact dependency lock for release builds;
- dependency licence inventory and SBOM release evidence.

### Windows recovery
- SHA-256/update verification must never be bypassed merely to make an update install;
- the known-good recovery package remains available until the open replacement is proven on real Windows hardware;
- do not advise users to disable antivirus, Defender, SmartScreen, firewall or other operating-system protections to install MouldMaster.

## Dependency/security updates

Electron and packaging dependencies should be reviewed regularly for upstream security releases. Upgrading a runtime is not a blind version bump: regenerate the lockfile/SBOM/licence inventory, rerun repository QA, build on Windows, inspect artifacts, and retest the assessment/PWA/offline paths.

## Scope limitations

MouldMaster's security controls do not make a compromised operating system trustworthy, provide DRM, guarantee patent freedom-to-operate, or replace workplace machinery-safety controls.
