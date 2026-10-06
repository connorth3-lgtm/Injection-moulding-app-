# Client compatibility matrix

Release lanes are intentionally independent. Equality of version numbers is not required; compatibility with the governed contracts below is.

| Client | Current release | Runtime/content contract | Persistence contract | Validation boundary |
| --- | --- | --- | --- | --- |
| Web/PWA | 2026.10.07.3 | current runtime-domain manifest; content 2026.08.26.1; question bank 2026.08.30.1 | shared-origin learner state plus governed IndexedDB domains | automated browser/PWA gates; physical-device and real-AT evidence remain external |
| Open desktop | 2026.09.29.1 | integrity-packaged web runtime/domain assets served from stable `127.0.0.1:43139` origin | same stable browser origin; packaged bytes integrity checked | automated build/security gates; real Windows distribution/signing remains external |
| Android | 2026.08.26.2 | separately released mobile lane; must not be assumed equivalent to the current web release solely from version date | platform-specific release contract | physical-device validation remains external unless genuine evidence is attached |
| Windows recovery | 2026.08.21.1 | frozen recovery lane, not the current learner runtime | legacy/recovery semantics only | frozen bytes; never modify to reduce current architecture debt |

Machine-readable release identities remain authoritative in `version.json`. This matrix documents compatibility boundaries and must not be used to promote an external HOLD to PASS.


## New2 feature availability

| Capability | Web/PWA 2026.10.07.3 | Open desktop 2026.09.29.1 candidate | Android 2026.08.26.2 |
| --- | --- | --- | --- |
| 260 exact-grade material catalogue | Included | Included in candidate build | Do not assume parity |
| Material → Machine → Mould → Product → Part links | Included | Included in candidate build | Do not assume parity |
| Structured closed-loop evidence | Included | Included in candidate build | Do not assume parity |
| Schema-4 engineering case export/import | Included | Included in candidate build | Do not assume parity |
| Append-only evidence revisions / void audit | Included | Included in candidate build | Do not assume parity |
| Exact-head CI risk coverage meta-gate | Release governance | Release governance | Not an Android runtime capability |

The desktop entry above describes repository-built candidate contents, not signed-package or Microsoft Store acceptance. Android parity requires a separately versioned Android release plus genuine device validation; the existing Android release must not be relabelled as containing New2.