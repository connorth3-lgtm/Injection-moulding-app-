# Verified manufacturer source index

Last checked: **2026-09-30**

This index records official manufacturer sources that can be used to build exact-model records. It does not claim that all historical manuals are publicly downloadable.

| Manufacturer | Verified official source | What it is useful for |
|---|---|---|
| ARBURG | https://www.arburg.com/en/technical-data/ | Current ALLROUNDER technical/performance data and mould-installation dimensions. |
| ARBURG | https://www.arburg.com/en/contact/technical-service/ | Machine-specific technical service route. |
| ENGEL | https://www.engelglobal.com/us/digital-solutions/e-connect-portal | e-connect machine park; ENGEL states technical data, maintenance history and manuals are available there. |
| Sumitomo (SHI) Demag | https://www.sumitomo-shi-demag.eu/products/myconnect | myConnect / myDocumentation; latest digital machine documents and maintenance functions. |
| FANUC ROBOSHOT | https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s50ib | Official ROBOSHOT technical specifications and downloadable product documents. |
| FANUC ROBOSHOT α-S100iB | https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s100ib | Primary OEM exact α-S100iB dimensions, distinct clamp/platen options and screw/pressure operating modes. Serial-specific setup, true fitted CNC/unit and service docs still need confirmation. |
| Haitian / Zhafir | https://eu.haitianinter.com/products/ | Current Haitian and Zhafir machine-family overview. |
| Haitian / Zhafir | https://vt.haitianinter.com/service/ | Official spare-parts, technical-service, remote troubleshooting and training network. |
| KraussMaffei | https://www.kraussmaffei.com/en/service/sales-service | Official injection-moulding machinery service area. |
| KraussMaffei | https://events.kraussmaffei.com/en/K-2025 | Official description of pioneersClub access to machines and relevant documents. |
| Shibaura Machine | https://shibaura-machine.com/injection-molding-machines/ | Current machine/controller information. |
| Shibaura Machine | https://shibaura-machine.com/articles/im-2020-8-26-user-friendly-v70-controller-features-on-board-pdf-machine-manual/ | Confirms V70-equipped machines include a searchable on-board PDF machine manual. |
| Milacron | https://www.milacron.com/parts-service/ | OEM lifecycle service, parts, training and rebuild support. |
| Milacron | https://store.milacron.com/store | Service Hub machine/document access for registered users. |
| NISSEI | https://www.nisseiplastic.com/en/products/ | Current horizontal, vertical and special injection-moulding machine product/specification pages. |
| JSW | https://www.jsw.co.jp/en/product/business/molding_machine/mm_0400/ | Official injection-moulding machine technical information and product-catalog access. |
| Hwamda | https://www.hwamda.com/en/ | Current manufacturer identity / product and support starting point. |

## Research rule

Manufacturer portals are a **starting point**, not automatic proof that a document applies to a particular machine.

For every manual or schematic, record:

- manufacturer;
- exact model/series;
- controller/HMI revision where known;
- document title and revision/date;
- whether it is public, account-only, machine-resident, dealer-only or archived;
- exact URL or provenance;
- verification status;
- limitations.

A controller manual, family brochure or later machine generation must never be silently relabelled as an exact OEM machine/service manual.

## First official model-level records — checked 2026-10-08

The following *manufacturer-owned* pages identify the published **FNX-Ⅳ**, not older FNX series, and explicitly distinguish injection-unit alternatives:

| Exact OEM model | OEM specification page | Verified model-level scope | Not established |
|---|---|---|---|
| NISSEI FNX110Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX110%E2%85%A3 | 1100 kN nominal clamp; 12A standard versus 18A injection-unit screw/capacity/pressure options; published mechanical dimensions | Installed injection-unit option, serial/revision, actual usable capability, machine maintenance manual |
| NISSEI FNX220Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX220%E2%85%A3 | 2110 kN nominal clamp; 50A standard versus 71A injection-unit screw/capacity/pressure options; published mechanical dimensions | Installed injection-unit option, serial/revision, actual usable capability, machine maintenance manual |

The machine registry stores a pressure value *with its matching screw diameter and injection unit*, not as a universal capacity for the model. A machine-fit screen must continue to require independently confirmed fitted injection-unit and machine identities. No unknown OEM electrical, hydraulic or parts documentation is treated as discovered.

## Additional NISSEI FNX-Ⅳ exact-model source records — 2026-10-09

These official primary-OEM specifications support model-level geometry, clamp figures, screw diameters, injection volumes and pressures for separately listed injection units. They do **not** identify the injection-unit assembly actually installed on a specific machine or verify controller, service manual or maintenance state.

| Exact OEM model | OEM data | Clamp | Published injection-unit variants | Still unverified |
|---|---|---:|---|---|
| FNX80Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX80%E2%85%A3 | 792 kN | 9A standard; 12A optional | Installed unit/serial, manuals, actual usable limits |
| FNX140Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX140%E2%85%A3 | 1370 kN | 25A standard; 36A optional | Installed unit/serial, manuals, actual usable limits |
| FNX180Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX180%E2%85%A3 | 1750 kN | 36A standard; 25A optional | Installed unit/serial, manuals, actual usable limits |
| FNX280Ⅳ | https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=FNX280%E2%85%A3 | 2740 kN | 71A standard; 100A optional | Installed unit/serial, manuals, actual usable limits |

All screw-specific dimensions, capacity and pressure sets are bound to their exact OEM option IDs in `machine-library-v1.json`; regression QA checks these pairs and model geometry. These are published catalogue values, **not** validated machine limits, physical test evidence or permissions to copy production recipes.

## Exact FANUC ROBOSHOT α-S130iB OEM model record — 9 October 2026

The primary [FANUC Europe ROBOSHOT α-S130iB technical specifications](https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s130ib) verify a **1300 kN** clamp, **400 mm** clamp stroke, **530 × 530 mm** tie bars, **730 × 730 mm** platens, and **100 mm** ejector stroke. Only the single-platen die-height variant is represented: **200–570 mm** standard or **200–670 mm** increased (optional). There is no claimed double-platen configuration or increased clamp rating for this exact model.

The separately labelled published *200 mm/s base* operating table pairs screw diameters **26/28/32/36/40 mm** with injection volumes **50/58/103/147/181 cm³**, injection/hold **pressure 1 290/270/250/190/160 MPa** and distinct **pressure 2 260/240/220/190/160 MPa**. High-duty, 350 mm/s and high-pressure-fill figures must not be combined with these base-mode values. Note that the FANUC America website's short model summary appears to duplicate `26` in place of the fourth `36` mm screw; this registry uses the internally coherent FANUC Europe OEM five-column table, also reflected in other official FANUC localisations.

This is the **ninth** detailed model across the eleven indexed OEMs, not a verified installed machine or evidence of the fitted unit, controller firmware, die-height option, service manuals, or production-safe process limits. The three key external measured-data acquisition issues and Hwamda HMD400M6 exact service-manual search remain independent OPEN requirements.

## FANUC ROBOSHOT α-S150iB separate exact OEM model — 9 October 2026

Manufacturer: [FANUC America α-S150iB model specs](https://www.fanucamerica.com/products/roboshot/roboshot-a-s150ib) and [FANUC Europe 2021 technical sheet](https://www.fanuc.eu/~/media/files/pdf/products/roboshot/datasheets/en/datasheets-2021/datasheets-a-s150ib-en.pdf?la=bg). The OEM's **1500 kN** base (optional **1800 kN** increased) clamp has a **440 mm** stroke, **560 × 510 mm** tie bars, **800 × 750 mm** platens and **150 mm** ejector. OEM-published double platen ranges are **200–500 mm**, increased **200–600 mm**; single platen **275–575 mm**, increased **275–675 mm**. The *200 mm/s base-mode* six-column screw/injection-volume/pressure-1/pressure-2 table is preserved without mixing modes: **32/36/40/44/48/52 mm** with **121/153/188/268/318/442 cm³**, pressure 1 **310/310/260/220/230/200 MPa** and pressure 2 **280/280/260/220/230/200 MPa**. OEM footnotes say these are unit output/settings rather than measured resin pressure, depend on screw/cylinder choice and cannot be guaranteed simultaneously with top speed. These values do not apply to the differently sized **α-S150iB Small Capacity** configuration or 350 mm/s mode.

This is the **tenth** detailed machine model among the eleven manufacturer indexes. The actual machine serial, fitted injection-unit/screw/barrel, clamp/die-height options, controller/firmware, usable ratings and machine-specific electrical/hydraulic/service documentation are still unknown. The library is research data, not a rated machine-fit or process recipe authority.

**OEM revision conflict — not a current pressure limit:** The [FANUC 2024 ROBOSHOT α-iB series brochure](https://www.fanuc.eu/~/media/files/pdf/products/roboshot/mbr-04413-rs%20roboshot%20alpha%20ib%20series/v4/roboshot-alpha-ib-series-brochure-en-2024.pdf?la=sl) publishes **190/160 MPa** for the 48/52 mm screw's pressure-1/pressure-2 200 mm/s rows, whereas the retained **2021 model-specific datasheet** shows **230/200 MPa** in each respective row. The registry explicitly labels the 2021 values and source conflict; actual applicability to a machine serial/screw/barrel, injection mode and manufacturing generation remains **UNKNOWN**. Never silently merge or substitute these source versions.


## FANUC ROBOSHOT α-S50iB — distinct exact model (10 October 2026)

[FANUC Europe’s primary OEM α-S50iB specification](https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s50ib) identifies the **500 kN** nominal versus **650 kN increased** clamp separately, 250 mm clamp stroke, 360 × 320 mm tie-bar opening, 500 × 470 mm platen and 70 mm ejector stroke. Single-platen die-height is **210–410 mm** (increased **210–460 mm**); double-platen is **150–350 mm** (increased **150–400 mm**). The platen variants are not interchangeable.

The published **350 mm/s** operation table matches screws **18/20/22/26/28/32 mm**, maximum injection volumes **19/24/29/50/58/76 cm³**, pressure-1 **280/310/290/240/220/180 MPa** and pressure-2 **260/280/260/210/190/150 MPa**, respectively. The same OEM page also publishes a distinct **550 mm/s** table and high-pressure-filling figures; these must **not** be merged with the stored 350 mm/s columns. Published screw/cylinder pressures are not measurements of resin pressure or guaranteed simultaneously available speed and pressure.

The registry is **research-only**: no real machine serial, actual installed clamp/platen and screw options, controller/firmware, manufacture year, usable production limits, electrical/hydraulic documentation or service manual have been verified. This adds the **eleventh detailed exact-model** record across the eleven OEM index categories, not an eleventh manufacturer and not production-machine approval. Issue #430 remains open for further models and service documentation.
