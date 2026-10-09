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
