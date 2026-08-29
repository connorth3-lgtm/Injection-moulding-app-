# Cross-process upper-workpiece source review — 2026-08-29

## Result

The public author/publisher evidence search narrowed the remaining upper-workpiece blocker but did not justify inventing the missing definitions.

Source-backed now:

- exact delivered upper schema: `time`, `injection_pressure_target`, `injection_pressure_actual`, `melt_volume`, `injection_velocity`, `state`
- checked author example time increment: `0.01` in the delivered `time` column
- same-author upper-workpiece fabrication documentation uses `cm³` for switching-point/melt-volume coordinates
- same-author upper-workpiece fabrication documentation uses `cm³/s` for primary and secondary injection velocity
- checked author upper example contains state codes `0`, `1`, `2`, `4`, `8`

Still unresolved from public authoritative sources:

- engineering unit for upper `injection_pressure_target`
- engineering unit for upper `injection_pressure_actual`
- semantic mapping for upper `state` codes `0`, `1`, `2`, `4`, `8`

## Evidence reviewed

- Zenodo record `10.5281/zenodo.17240390`: publisher description of the four synchronized process streams and approximate injection-moulding sampling frequency.
- Author repository `nikolaiwest/cpc-data`: upper/lower loader, exact upper CSV field names and checked-in upper source example.
- Same-author `nikolaiwest/pyscrew` scenario `s05_variations-in-upper-workpiece-fabrication`: upper-workpiece fabrication conditions with switching point in `cm³` and injection velocity in `cm³/s`.
- Public project/paper searches for a pressure-unit table, machine export dictionary, OPC/DAQ mapping or state-code lookup.

No reviewed public source explicitly attached an engineering unit to the upper pressure fields or named the upper state codes.

## Fail-closed decision

- Do not copy the lower-workpiece pressure unit (`bar`) to the upper stream by analogy.
- Do not infer state meanings from the observed code sequence or transition timing.
- Preserve delivered file time vectors rather than forcing the publisher's broad `~1 kHz` description where a source file differs.
- Do not promote additional upper values from this review alone.

The accepted measured time-series baseline therefore remains **21,356,311**, and the fully profiled measured-family count remains **7**.

## Resolution path

Issue #73 should close only after an authoritative author/publisher data dictionary, machine/DAQ export definition, source signal table or direct author clarification establishes:

1. the upper-workpiece pressure unit, and
2. the mapping of state codes `0`, `1`, `2`, `4`, `8`.
