# MouldMaster Deep Dive v2 — Wave 5 execution

Status date: 2026-08-28

Wave 5 preserves Waves 1–4 and adds **100 new evidence-discovery passes, IDs 401–500**, bringing the protected cumulative execution to **500 passes**.

- Wave 5 passes: **100**
- `seeded_with_primary`: **95**
- `gap_seeded`: **5**
- Cumulative passes: **500**
- Machine-readable ledger: `data/deep-dive-v2-wave5-100-pass.json`

`seeded_with_primary` means at least one relevant primary/experimental anchor was found. It is not a claim that the domain is saturated or that the full 2,000-paper / 1,000-primary-study programme is complete. Gaps remain explicit instead of being padded with weak sources.

## Deepened evidence in this run

Wave 5 deliberately goes deeper than the earlier waves in:

- non-return-valve closure/backflow and screw/plasticisation state;
- feed-throat pellet behaviour and recovery stability;
- demoulding adhesion, coatings, ejector loads and high-frequency release force;
- polymer–mould thermal contact resistance and air-gap development;
- real cooling-channel fouling, pressure loss and additive-manufactured channel roughness;
- hot-runner stagnation, thermal asymmetry and multi-cavity balance;
- hygroscopic polymer conditioning and local moisture gradients;
- repeated recyclate degradation, VOCs, molecular-weight and rheology drift;
- filler orientation, anisotropic shrinkage and warpage;
- flow marks, blush, gloss/topography and weld-line visibility;
- gas-assisted, LSR, rubber and reactive cure behaviour;
- acoustic emission, ultrasound, capacitance, tie-bar and optical metrology;
- time-series quality prediction, drift-aware monitoring and transfer learning;
- phase-resolved energy, MIM/CIM feedstock rheology and in-mould electronics reliability.

## Examples of new/strong anchors

- `10.1016/j.jmapro.2024.03.019` — NRV fault diagnosis from machine signals.
- `10.1063/1.4873755` — ultrasound for screw/plasticisation state.
- `10.3390/polym15051285` — measured adhesion-induced demoulding force.
- `10.1002/pen.70028` and `10.1002/pen.26592` — polymer–mould thermal contact resistance/heat transfer.
- `10.2478/ama-2024-0067` — measured mould-cooling fouling/pressure-loss behaviour.
- `10.1002/ADV.10027` and `10.1016/j.polymdegradstab.2023.110617` — repeated processing, VOC/rheology/molecular degradation.
- `10.1179/146580100101541003` and `10.1002/app.53381` — LSR pressure/crosslink evidence.
- `10.1080/09349847.2015.1061074` — acoustic-emission detection of mould damage.
- `10.1002/APP.40346` — wireless melt-front sensing over more than 450 cycles.
- `10.1007/s00170-020-06511-3` — transfer learning across injection-moulded part processes.
- `10.1007/S40684-018-0002-0` — measured electricity use across injection-moulding machines/materials.
- `10.3390/MET7040120` and `10.1002/MAWE.201800217` — MIM rheology/powder loading, shrinkage and densification.

## Evidence rules retained

1. Previous waves are never overwritten by a new run.
2. Primary-search hits still require identity/scope checks before final evidence-registry promotion.
3. Paper-specific settings remain local evidence, not universal recipes.
4. Reviews and broader manufacturing evidence are discovery aids, not substitutes for injection-moulding primary evidence.
5. Measured and synthetic provenance stays explicit.
6. Full waveforms, cavity identity and sensor location are retained whenever available.
7. Prediction/classification accuracy is not proof of physical root cause or safe autonomous control.
