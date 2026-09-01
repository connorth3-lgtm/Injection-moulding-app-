# Accessibility and real-device validation protocol

Reviewed: 2 September 2026

## Automated coverage added in this hardening wave

MouldMaster now has a Playwright startup/accessibility regression matrix for Chromium, Firefox and WebKit in addition to the existing Chromium mobile viewport tests. The automated matrix checks coherent startup, page errors, duplicate IDs, image alternative text, accessible names on visible interactive controls, form labels, dialog naming/modal semantics, key landmarks, non-empty headings and basic keyboard focus progression.

These automated checks are regression evidence. They are **not** a WCAG conformance statement and they do not prove compatibility with a physical assistive-technology/device combination.

## Manual checks still required for a formal accessibility claim

Record pass/fail outside learner data and attach only non-sensitive summary evidence to the release record.

### Windows / NVDA

- current supported Windows 10 or Windows 11;
- current NVDA with current Chrome or Edge;
- keyboard-only sign-in/onboarding or test-profile entry, Home, Learn, Practice, More, one lesson, one assessment, review feedback and one modal/dialog;
- confirm focus order, visible focus, control names/states, headings/landmarks, status announcements and dialog focus containment/return;
- check 100% and 200% zoom/reflow.

### macOS / VoiceOver

- current supported macOS and Safari;
- VoiceOver navigation through the same critical learner journey;
- confirm headings, landmarks, buttons, assessment choices, feedback, modal focus and external-link behavior;
- check 100% and 200% zoom/reflow.

### iOS / VoiceOver / installed PWA

- current supported iPhone/iPad and Safari;
- install the PWA from the production Pages URL;
- complete one online launch, one offline relaunch and one update to a newer tested runtime;
- confirm Home, Learn, Practice and More remain reachable with VoiceOver;
- confirm assessment choices and result/review content are announced meaningfully;
- confirm a partial/offline update does not strand the installed app between runtime versions.

### Android / TalkBack / installed PWA

- current supported Android device and Chrome;
- install from the production Pages URL;
- repeat online launch, offline relaunch and runtime-update checks;
- traverse the critical learner journey with TalkBack and switch/accessibility focus as appropriate;
- verify fixed navigation does not obscure focused content at common text/display scaling settings.

## Release boundary

Normal learner release may rely on the automated matrix plus the existing safety/release QA when the product does not claim formal WCAG conformance. Any public statement such as “WCAG AA conformant”, “screen-reader certified” or equivalent remains blocked until the manual checks above are completed, defects are resolved and the evidence is reviewed.

Real iOS/Android PWA and NVDA/VoiceOver execution cannot be substituted by GitHub-hosted browser emulation. This document intentionally keeps those states **manual evidence required** until a human completes them on representative hardware/software.
