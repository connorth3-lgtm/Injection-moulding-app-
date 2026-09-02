# Elastomer and rubber process-model extension — 2026-09-03

## Scope

This extension separates three engineering categories that must not share one process model:

1. **Flexible PVC compounds** — melt-processable thermoplastics; compound formulation and hardness control the usable window.
2. **Thermoplastic elastomers (TPE/TPV/TPU)** — melt-processable thermoplastics; normal melt/mould/cooling logic applies when exact-grade supplier data exist.
3. **LSR/HCR/vulcanized rubbers** — cure/vulcanization materials; cure chemistry, mould/cure temperature, cure time, scorch safety, vacuum/venting and post-cure can control production. These records must not inherit thermoplastic melt or cooling assumptions.

## Added selector classes

### Flexible PVC / PVC-like elastomers
- Flexible PVC ~40A / 50A / 60A / 70A / 80A / 90A
- Medical flexible PVC
- Flame-retardant flexible PVC
- NBR/PVC oil-resistant polyblend

### Thermoplastic elastomers
- TPE-S soft / medium / hard
- TPV soft / medium / hard
- TPU 60A / 70A / 80A / 90A / 95A / Shore-D
- Bio-based / renewable-content TPU
- Conductive / ESD TPE
- Food-contact TPE
- Medical TPE
- Bondable / overmoulding TPE

### Cure/vulcanized rubbers
- Liquid silicone rubber (LSR)
- High-consistency silicone rubber (HCR/HTV)
- EPDM
- NBR
- HNBR
- FKM
- FFKM
- SBR
- Natural rubber
- Chloroprene rubber (CR)
- Butyl rubber (IIR)
- Acrylic rubber (ACM)
- Ethylene acrylic elastomer (AEM)
- Epichlorohydrin rubber (ECO)

## Primary source anchors retained in the runtime

- Wacker Chemie — ELASTOSIL LR 3004/40 A/B (LSR), two-component 1:1 injection-moulding silicone.
- Wacker Chemie — ELASTOSIL R 420/70 S (HCR), peroxide-vulcanized solid silicone rubber.
- ExxonMobil Product Solutions — Vistalon 5600 EPDM; Exxon butyl rubber family.
- Zeon Chemicals — Nipol 1042 NBR; Sivic Z730 NBR/PVC; HyTemp AR22 ACM; Hydrin H55 ECO.
- ARLANXEO — Therban HNBR family; Buna SE 1502 H E-SBR.
- Syensqo — Tecnoflon FKM and PFR/FFKM families.
- Denka — DCR-36 chloroprene rubber, identified by the supplier as suitable for injection.
- Sri Trang Agro-Industry — STR20 technically specified natural rubber.
- DuPont — Vamac Ultra DX AEM technical bulletin.

## Data discipline

- Exact compound cure conditions are not inferred from base-polymer identity.
- `meltC` must remain null for LSR/HCR/thermoset-rubber process records.
- A rubber family or base polymer can identify chemistry and source provenance without claiming a complete molding recipe.
- Hardness selector classes are navigation/application classes until an exact commercial compound is selected.
- Cure chemistry and post-cure requirements remain grade/compound specific unless the exact supplier record publishes them.

## Production boundary

Production use requires the exact compound/grade and revision, cure package, compound storage/handling requirements, injection unit and cold-runner/hot-mould configuration where applicable, mould temperature, cure study, scorch margin, vent/vacuum design, validated ejection temperature/state, post-cure requirements, and machine/mould safety procedures.