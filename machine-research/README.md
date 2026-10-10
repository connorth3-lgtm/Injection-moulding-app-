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


## OEM verified model expansion — 2026-10-09

NISSEI's primary FNX-Ⅳ technical pages now support three more exact model records: **FNX80Ⅳ**, **FNX140Ⅳ** and **FNX180Ⅳ**. The detailed research registry therefore rises from three to **six model records** without inventing serial/configuration authority. The separate 9A/12A, 25A/36A variants remain screw-diameter/pressure/shot-capacity linked and covered by `qa_machine_library.py`; installed machine, controller and maintenance documents remain UNKNOWN. No production machine-fit approval or OEM service documentation acquisition is inferred.


## FNX280Ⅳ exact-model expansion — 2026-10-09

The [primary-OEM FNX280Ⅳ performance table](https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX280%E2%85%A3) verifies the published **2740 kN** hybrid FNX-Ⅳ machine, **830 mm** clamp stroke, **320 mm** minimum mould thickness, **1150 mm** maximum daylight, **660 × 660 mm** tie-bar clearance, **955 × 955 mm** die plate, and **130 mm** ejector stroke. Its **standard 71A** and **optional 100A** injection units have different source-published screw, capacity and maximum-pressure tables and are *never* silently interchangeable. This is the seventh detailed model in the 11-manufacturer index. It does not establish the fitted injection unit, actual machine serial, available usable capability, controller/HMI or machine-specific service schematics; real fit/operational decisions require those separately.


## Second OEM with source-scoped detailed model record — 2026-10-09

The official [FANUC ROBOSHOT α-S100iB specifications](https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s100ib) add a separately sourced **eighth** detailed model, spanning **FANUC, NISSEI and Hwamda** within the eleven-OEM index. The published 1000 kN base versus 1250 kN increased clamp must remain distinct. So must the single/double platen and increased die-height ranges, and the 200 mm/s base screw-table injection/hold pressure mode **1 versus 2**. The FANUC product page does not identify any particular *installed* injection-unit assembly, so the record **deliberately does not invent** a named injection-unit variant or fitted unit ID; it displays the OEM's six screw/volume/pressure columns in a clearly labelled, separate operating-mode table. Specific electrical/hydraulic drawings, firmware and the on-site usable capacity remain missing. The source-backed numbers are not permission to prescribe production limits or approve a machine-mould fit.

## FANUC ROBOSHOT α-S130iB source-bound expansion — 9 October 2026

The ninth detailed exact-model record uses FANUC Europe's primary [α-S130iB specifications](https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s130ib): **1300 kN** clamp, single-platen **200–570 mm** standard or **200–670 mm** increased die-height, five individually linked screw/injection-volume/pressure-1/pressure-2 columns at the source-defined **200 mm/s base mode**, and model-specific platen/tie-bar/stroke figures. The catalogue's 200 mm/s values do **not** establish the actual fitted injection unit or apply to other speed/pressure modes. Missing controller, OEM service and circuit documents remain **missing**; machine-fit, production recipes and human/device validation remain unapproved.

## FANUC ROBOSHOT α-S150iB model-only record — 9 October 2026

The [FANUC America published specifications](https://www.fanucamerica.com/products/roboshot/roboshot-a-s150ib) and [FANUC Europe 2021 OEM datasheet](https://www.fanuc.eu/~/media/files/pdf/products/roboshot/datasheets/en/datasheets-2021/datasheets-a-s150ib-en.pdf?la=bg) add the **tenth** detailed OEM-sourced machine model. This is the conventional α-S150iB configuration, *not* the distinct small-capacity screw version. **1500/optional 1800 kN** clamps, independent single/double-platen mould-height options, and six screw-specific **200 mm/s base-mode** volume/pressure-1/pressure-2 columns remain source-paired. A machine's real fitted configuration, usable pressure/flow, measured production data, OEM maintenance/service documents and physical acceptance are all **unknown/OPEN**; no production parameter or machine safety certification can be inferred.

**OEM revision conflict — not a current pressure limit:** The [FANUC 2024 ROBOSHOT α-iB series brochure](https://www.fanuc.eu/~/media/files/pdf/products/roboshot/mbr-04413-rs%20roboshot%20alpha%20ib%20series/v4/roboshot-alpha-ib-series-brochure-en-2024.pdf?la=sl) publishes **190/160 MPa** for the 48/52 mm screw's pressure-1/pressure-2 200 mm/s rows, whereas the retained **2021 model-specific datasheet** shows **230/200 MPa** in each respective row. The registry explicitly labels the 2021 values and source conflict; actual applicability to a machine serial/screw/barrel, injection mode and manufacturing generation remains **UNKNOWN**. Never silently merge or substitute these source versions. 
