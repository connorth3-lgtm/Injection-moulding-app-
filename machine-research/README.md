# Injection Moulding Machine Research Library

This directory tracks verified injection-moulding machine information, manuals, controller documentation, service-document gaps and research history.

The public page is:

- `/machine-library.html`
- structured registry: `/machine-library-v1.json`

## Scope

This is **not** a single-machine notebook. It is a manufacturer-wide library intended to grow across all injection moulding machine makes, series, controller families and exact models.

The source index currently includes verified official starting points for:

- Hwamda
- ARBURG
- ENGEL
- Sumitomo (SHI) Demag
- FANUC ROBOSHOT
- Haitian / Zhafir
- KraussMaffei
- Shibaura Machine / Toshiba Machine
- Milacron
- NISSEI
- JSW

Manufacturer inclusion does not mean every historical model has been researched yet. Exact-model records are added only when model identity and source provenance can be checked.

Each machine record should separate:

1. exact-model machine specifications;
2. controller/HMI identification;
3. controller manuals;
4. OEM machine operation/service manuals;
5. electrical and hydraulic drawings;
6. parts and lubrication documentation;
7. provenance and confidence.

## Verification rules

- **verified** — exact model/document identity is supported by a primary or directly matching source.
- **strong_match** — strong family/controller match, but the exact hardware revision is not independently confirmed.
- **reference_only** — useful adjacent documentation that must not be treated as the exact OEM manual.
- **lead** — possible source awaiting verification.
- **missing** — expected/needed document not located.

Do not collapse conflicting specification variants into one silent value. Keep source variants separate and explain the conflict.

## Manufacturer-first workflow

For each manufacturer:

1. index the official product, technical-data, service and customer-document portals;
2. add exact model/series records from primary or directly matching sources;
3. record controller/HMI generation separately from the machine model;
4. identify whether the operator/service manual is public, portal-only, machine-resident, dealer-only or missing;
5. keep OEM electrical/hydraulic drawings separate from generic controller documentation;
6. log research date, source URL and confidence.

This lets the library cover current and legacy machines without implying that a family brochure is the same thing as a machine-specific service manual.

## Current exact-model starting record

- Hwamda HMD400M6 — active research.
- Exact HMD400M6 technical/dimensional data: found.
- Techmation M8M/M10M-family controller documentation: strong match.
- Full Hwamda HMD400M6 operation/service manual: not yet found.
- Machine-specific electrical schematic: not yet found.
- Machine-specific hydraulic schematic: not yet found.
- OEM I/O allocation, lubrication chart and parts book: not yet found.

See `hwamda/HMD400M6.md`.

## Manufacturer-model expansion — 2026-10-08

Two NISSEI FNX-Ⅳ OEM-published exact-model records have been added: **FNX110Ⅳ** and **FNX220Ⅳ**. These bring the current detailed model total to **three** across the existing eleven manufacturer source indexes. The NISSEI records preserve standard and optional injection-unit/screw/pressure/capacity variants and keep fitted serial, controller firmware, machine-specific manuals and as-built usable capability unknown. See [manufacturer source index](./MANUFACTURER-SOURCES.md).

The original HMD400M6 service-document chase remains open: [OEM document request checklist](./hwamda/OEM_DOCUMENT_REQUEST_CHECKLIST.md). No unverified manual, circuit drawing or later M6-S generation was promoted.

