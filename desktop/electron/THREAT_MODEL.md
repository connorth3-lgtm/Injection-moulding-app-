# MouldMaster Open Desktop — Threat Model

Status: initial security model for the open Electron replacement.

## Security objective

The desktop wrapper must not turn ordinary MouldMaster training HTML/JavaScript into privileged native code. It must fail closed if bundled training assets are altered, keep learner-facing web content in a sandboxed renderer, and prevent external web pages from inheriting desktop privileges.

## Trust boundaries

### 1. Electron main process — privileged
The main process can access the local filesystem and operating-system APIs. Its source is intentionally small and auditable.

Controls:
- no remote application code is loaded into the privileged process;
- required MouldMaster assets are SHA-256 verified before a window is opened;
- only an allow-listed set of local files is served;
- local serving binds to `127.0.0.1` on a random ephemeral port;
- the loopback server does not bind to LAN/public interfaces;
- path traversal is rejected;
- the server uses `nosniff`, no-store caching and same-origin resource policy headers.

### 2. Renderer — unprivileged
The MouldMaster UI runs as ordinary browser content.

Controls:
- `nodeIntegration: false`;
- `contextIsolation: true`;
- `sandbox: true`;
- `webSecurity: true`;
- insecure mixed content is disallowed;
- renderer permission requests are denied by default;
- `<webview>` attachment is blocked;
- production DevTools are disabled.

No preload bridge is currently exposed. This is intentional: the training application does not require native APIs.

### 3. External sources — untrusted web
References to regulators, standards bodies, research papers and manufacturers are useful learning links but are not trusted desktop content.

Controls:
- new windows are denied inside Electron;
- HTTPS reference links are handed to the user's normal system browser;
- navigation outside the local MouldMaster origin is prevented in the application window.

### 4. Packaged training assets
The desktop package bundles the PWA/training files from the repository.

Controls:
- `scripts/generate-integrity.cjs` records SHA-256 for required assets;
- `src/main.cjs` recomputes and compares those hashes before launch;
- missing or changed files stop startup and show a fail-safe error;
- integrity failure is never converted into a bypass/fallback-to-unverified-content path.

MSIX can additionally use Windows package-integrity enforcement after Store signing.

### 5. Dependencies/build system
Electron, electron-builder and their transitive packages are third-party code.

Controls:
- direct versions are exact-pinned;
- `package-lock.json` locks transitive versions, registry URLs and integrity hashes;
- build CI uses `npm ci` rather than unconstrained install/update;
- a dependency licence inventory is generated;
- a CycloneDX SBOM is generated for release auditing;
- upgrades must re-run QA and Windows packaging tests.

## Main threats considered

| Threat | Primary mitigation |
| --- | --- |
| Altered bundled lesson/assessment JS | SHA-256 verification before launch |
| Malicious external reference page | open externally in system browser |
| Renderer JavaScript gaining filesystem/native access | no Node integration, sandbox, context isolation, no preload API |
| Unintended camera/microphone/location access | deny renderer permission requests |
| Remote site embedded as privileged webview | webviews blocked |
| Local path traversal through loopback server | strict single-filename allow list |
| LAN access to local content server | bind only to 127.0.0.1, random port |
| Dependency drift | package-lock + npm ci |
| Compromised release provenance | source commit + SHA256SUMS + integrity manifest + SBOM artifacts |
| Tampered Store-installed package | Store signing plus MSIX package integrity where enabled |

## Explicit non-goals

The wrapper does not claim to:
- make an already-compromised operating system trustworthy;
- provide DRM or prevent a user modifying their own open-source copy;
- prove worldwide patent freedom-to-operate;
- replace antivirus/OS security controls;
- turn a completion certificate into legal machinery competence or an accredited qualification.

## Security regression gates

Repository QA must fail if core controls such as renderer sandboxing, context isolation, disabled Node integration, permission denial, webview blocking, loopback-only binding or asset hash verification are removed.

Any future native feature should be exposed through a minimal, explicitly validated preload/API surface. Do not enable generic Node integration as a shortcut.
