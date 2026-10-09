# FANUC ROBOSHOT α-S50iB — OEM option-boundary research

**Status:** primary-OEM model-level source checked 10 October 2026; **NOT a serial-verified installed machine**, machine-fit approval or released machine-library record. Tracked in [#430](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/430).

## Source identity

- Manufacturer: FANUC.
- Exact model label: **ROBOSHOT α-S50iB** (not α-S100iB, α-S130iB or α-S150iB).
- Manufacturer primary technical-specification page: https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s50ib
- Evidence type: public manufacturer model/option table. This is not a controller manual, as-built serial data or certified machine acceptance test.
- Web page reviewed: **10 October 2026**. A web page can change; archive the exact relevant OEM revision/technical sheet separately before promoting individual numeric option entries.

## Manufacturer-published model options (NOT one combined machine)

| Dimension | OEM-published value | Interpretation |
| --- | --- | --- |
| Clamp mechanism | 5-point double toggle | Published model family mechanism |
| Nominal clamp | 500 kN (50 tonf) | Base figure; do not silently substitute increased option |
| Increased clamp | 650 kN (65 tonf) | **Optional** rating, not available to an unidentified machine |
| Clamping stroke | 250 mm | Model published mechanical stroke |
| Tie-bar spacing, H×V | 360 × 320 mm | Confirm actual usable clearance and tooling before installation |
| Platen size, H×V | 500 × 470 mm | Published platen dimensions |
| Single-platen die height | 210–410 mm | Standard single-platen configuration only |
| Single-platen increased die height | 210–460 mm | **Increased option** only |
| Double-platen die height | 150–350 mm | Standard double-platen configuration only |
| Double-platen increased die height | 150–400 mm | **Increased option** only |
| Ejector stroke | 70 mm | Physical stroke; force option separately sourced |
| Ejector force | 20 kN nominal; increased 60 kN | **Increased force is not an assumed standard** |
| Nozzle touch force | 15 kN nominal; increased 30 kN | Optional, not a resin-processing pressure limit |
| Screw diameter alternatives | 18, 20, 22, 26, 28, 32 mm | **One fitted screw/unit must be verified**, not all at once |
| Corresponding maximum injection volumes | 19, 24, 29, 50, 58, 76 cm³ | Paired **in the same screw order**, not interchangeable ratings |

These figures are published machine/option specifications only. They are **not** validated usable shot mass, resin pressure limits, production process windows, mould-installation permission or machine-control setpoints. Do not conflate high-pressure filling with injection/hold modes or assume simultaneous maximum speed and pressure; retain separate screw/operating-mode tables and OEM footnotes before releasing a full machine-fit record.

## Unknown / blocked for current exact-machine suitability

- Installed machine serial, manufacturing revision, country-specific ratings and fitted single-/double-platen/clamp/ejector options: **unknown**.
- Fitted screw/barrel and injection-unit identity, actual available volume, shot-mass conversion and operating-mode pressure envelopes: **unknown** until checked on the machine and against the matching OEM revision.
- Controller/CNC software and HMI family, service manuals, electrical/hydraulic drawings, optional equipment and safety interlocks: **not verified by this source**. Obtain manufacturer/service documentation for the exact fitted machine.
- Gate based on tie bars and die height is incomplete without platen/locating geometry, connected equipment, guarding, verified installation and site-specific engineering acceptance.

## Promotion checklist

Before adding `fanuc-roboshot-alpha-s50ib` to the public `machine-library-v1.json` or promoting its suitability to anything above **UNKNOWN**:

1. Preserve an exact cited OEM document version and reconcile current web-page tables with any issued revision.
2. Model **single vs double platen**, **standard vs increased clamp/die-height/ejector/nozzle** as separate, explicitly identified options.
3. Model injection screw/operating-mode columns as distinct variants; retain exact units, source identifiers and footnotes; never interpolate, coerce or combine unrelated options.
4. Verify installed serial/controller/injection unit and source provenance independently; absent fields fail closed.
5. Add schema, import/library and machine-fit adversarial regressions; use the next governed runtime release with exact-head candidate evidence if any learner-facing file changes.
6. Keep all physical/site/SME and production-authority HOLDs until genuine independent evidence exists.

**Disposition:** official source verified for preliminary research; public model promotion and serial/configuration fit remain **HOLD**.
