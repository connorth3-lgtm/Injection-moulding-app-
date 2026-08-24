# MouldMaster Open Desktop — Threat Model

Status: security model for the open Electron replacement.

## Security objective

The desktop wrapper must not turn ordinary MouldMaster training HTML/JavaScript into privileged native code. It must fail closed if bundled training assets are altered, keep learner-facing web content in a sandboxed renderer, and prevent external web pages from inheriting desktop privileges.

## Trust boundaries

### 1. Electron main process — privileged
The main process can access the local filesystem and operating-system APIs. Its source is intentionally small and auditable.

Controls:
- no remote application code is loaded into the privileged process;
- required MouldMaster assets are SHA-256 verified before a window is opened;
- the expected-hash manifest is read from inside packaged `app.asar`, not from the external asset directory it verifies;
- Electron embedded ASAR integrity validation is enabled and Electron is configured to load application code only from `app.asar`;
- `ELECTRON_RUN_AS_NODE`, `NODE_OPTIONS`, and command-line Node inspector support are disabled through Electron fuses;
- only the integrity-manifest allow list of local application files is served;
- the local server accepts only GET and HEAD requests;
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
The desktop package bundles the PWA/training files from the repository under `resources/mouldmaster`.

Controls:
- `scripts/generate-integrity.cjs` records SHA-256 for required assets;
- the same manifest is included inside `app.asar`, where Electron's embedded ASAR-integrity validation anchors it to the packaged application;
- `src/main.cjs` recomputes and compares the external asset hashes before launch;
- missing or changed files stop startup and show a fail-safe error;
- integrity failure is never converted into a bypass/fallback-to-unverified-content path;
- an external copy of `integrity.json` may be retained for release evidence, but runtime trust does not depend on that copy.

For an unsigned portable build, a hostile actor able to replace the executable and the application package together remains outside this integrity boundary. Direct public distribution should therefore use trusted code signing. Microsoft Store distribution adds Microsoft signing/certification and can additionally enforce MSIX package integrity.

### 5. Dependencies/build system
Electron, electron-builder and their transitive packages are third-party code.

Controls:
- Electron and the stable portable/NSIS electron-builder dependency are exact-pinned;
- `package-lock.json` locks their transitive versions, registry URLs and integrity hashes;
- build CI uses `npm ci` rather than unconstrained install/update;
- the Store workflow invokes the exact MSIX-capable `electron-builder@27.0.0-alpha.7` beta because MSIX is not available in the pinned v26 stable line;
- a dependency licence inventory is generated;
- a CycloneDX SBOM is generated for the locked desktop dependency graph;
- build-tool versions and the source commit are recorded by repository configuration/artifacts;
- upgrades must re-run QA and Windows packaging tests.

## Main threats considered

| Threat | Primary mitigation |
| --- | --- |
| Altered bundled lesson/assessment JS | trusted in-ASAR manifest + SHA-256 verification before launch |
| Replaced/unpacked Electron application code | embedded ASAR integrity + only-load-from-ASAR fuses |
| Malicious external reference page | open externally in system browser |
| Renderer JavaScript gaining filesystem/native access | no Node integration, sandbox, context isolation, no preload API |
| Node environment/inspector abuse against packaged app | Electron fuses disable run-as-Node, NODE_OPTIONS and CLI inspector arguments |
| Unintended camera/microphone/location access | deny renderer permission requests |
| Remote site embedded as privileged webview | webviews blocked |
| Local path traversal through loopback server | strict single-filename allow list |
| Unexpected HTTP method against local server | GET/HEAD only |
| LAN access to local content server | bind only to 127.0.0.1, random port |
| Dependency drift | exact direct versions + package-lock + npm ci |
| Compromised release provenance | source commit + SHA256SUMS + integrity manifest + SBOM artifacts |
| Tampered Store-installed package | Store signing plus MSIX package integrity where enabled |

## Explicit non-goals

The wrapper does not claim to:
- make an already-compromised operating system trustworthy;
- make an unsigned portable executable equivalent to a trusted code-signed distribution;
- provide DRM or prevent a user modifying their own open-source copy;
- prove worldwide patent freedom-to-operate;
- replace antivirus/OS security controls;
- turn a completion certificate into legal machinery competence or an accredited qualification.

## Security regression gates

Repository QA must fail if core controls such as renderer sandboxing, context isolation, disabled Node integration, permission denial, webview blocking, loopback-only binding, trusted-manifest placement, ASAR-integrity fuses or asset hash verification are removed.

Any future native feature should be exposed through a minimal, explicitly validated preload/API surface. Do not enable generic Node integration as a shortcut.
