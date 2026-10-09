# Physical PWA device validation — staged 2026.10.09.5

**STATUS: HOLD — NOT APPROVED / NO HUMAN VALIDATION.**

The proposed `2026.10.09.5` UI-timing candidate improves More-dialog isolation, first-run onboarding polish and removes an obsolete certificate statline mutator. Its web/PWA identity is separate from the deployed `2026.10.09.4` preview. **It has not been merged, deployed, independently tested or approved.**

**Required evidence:** Real iOS/iPadOS and Android install, update, offline/restart/reboot, local data resilience, safe-area tabs and storage pressure.

The earlier `2026.10.09.4` retained candidate (source `ff53e2958d7c97d99aba890a23ba7caf4f21d3c6`, public fingerprint `sha256:7776a3ccccd8d049e7b9a5167e957651220d8f98a8da3b51b046ab85ae0f53a8`) is **history only** and must not authorize this changed runtime. Retained technical candidate: source `581e08e58f0b9ec3c7a3501f9a3a71d47ed2c184`, public-runtime fingerprint `sha256:216ec18dc5687ffbbb6aecee36b595533b65deb6c25c2c2bb7693f0bc6a97bcf`, successful producer run `37878945696`, artifact `11593612154` (SHA-256 `sha256:d5309909602f89c47afda61418489e1543eccfbdd3b71dbefc892fdbaf5990eb`, expires `2027-01-07T03:22:06Z`). This identifies technical test bytes only; PR-head CI, human visual acceptance, real devices, NVDA/VoiceOver, SMEs, learner outcomes, NZQA/provider evidence and production authorization remain independent HOLDs. Browser automation and emulation are not physical/device or human validation.

The `2026.10.09.5` visual check compares against previous owner-approved `.4` baseline with the strict 12-pixel limit. Any changed imagery still requires scoped visual acceptance. All seven external-validation streams, production-root launch, provider/accreditation assertions, signed Windows package distribution and manufacturing/recipe authority remain **HOLD**. See `qa/EXTERNAL_VALIDATION_2026.10.09.5.md` and issue #379.
