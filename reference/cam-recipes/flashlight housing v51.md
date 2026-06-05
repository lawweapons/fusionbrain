# CAM Recipe: flashlight housing v51

## Summary
Multi-sided flashlight housing machined across 4 setups (Setup1 = primary features, Setup3 = flip/second side, Setup4(2) = third orientation, Setup4 = fourth orientation). Material is consistent with aluminum (tool names explicitly say "AL," all ops run 12k RPM or near it, flood coolant throughout). Machine not specified in export. Total: 44 operations spanning adaptive roughing, 2D contour finishing, flow surface finishing, slotting, 3D contour, trace, and chamfering. Strategy is classic rough-then-finish-then-chamfer within each setup, with negative stock-to-leave used deliberately on several finish contours to achieve final dimension.

---

## Tools Used

| T# | Description | Type | Dia | CR | Flutes | FL | Mat | Typical Cut Feed | Used For |
|---|---|---|---|---|---|---|---|---|---|
| T26 | **1/2 AL ROUGHER** | Flat EM | 0.500" | 0.000" | 3 | 1.270" | Carbide | 100–140 ipm | Facing, large adaptive roughing |
| T10 | **1/2 al finish long** | Flat EM | 0.500" | 0.000" | 3 | 2.000" | HSS | 60 ipm | Large pocket adaptive + contour finishing |
| T29 | **1/4 al finish long** | Flat EM | 0.250" | 0.000" | 3 | 1.300" | HSS | 54–60 ipm | Facing, adaptive, contour finishing (Setup3) |
| T7 | **1/4 AL FINISH EM** | Flat EM | 0.250" | 0.000" | 2 | 0.500" | HSS | 36–75 ipm | Contour finishing, adaptive (Setups 1, 3, 4) |
| T5 | **3/8 ROUGH EM LONG** | Flat EM | 0.375" | 0.000" | 3 | 0.750" | Carbide (Lakeshore) | 87.9 ipm | Narrow pocket adaptive roughing |
| T27 | **1/4 AL ROUGH** | Bull nose EM | 0.250" | 0.010" | 3 | 0.800" | Carbide (Lakeshore) | 100 ipm | Adaptive roughing (Setup4) |
| T11 | **3/16 AL rough** | Bull nose EM | 0.1875" | 0.010" | 3 | 0.5625" | HSS | 54 ipm | Small pocket adaptive roughing |
| T23 | **3/16 4F BNM R.015** | Bull nose EM | 0.1875" | 0.015" | 4 | 0.4375" | Carbide | 25 ipm | Small contour finishing |
| T17 | **1/4in 6F R.030** | Bull nose EM | 0.250" | 0.030" | 6 | 0.750" | Carbide | 170.7 ipm | Flow surface finishing |
| T30 | **1/8 EM** | Flat EM | 0.125" | 0.000" | 4 | 0.375" | Carbide | 30–100 ipm | Small adaptive, slots, contours, flow, 3D contour |
| T4 | **1/8 CHMF** | Chamfer mill | 0.125" | 0.000" | 4 | 0.125" | Carbide | 60 ipm | Chamfering, trace engraving |
| T18 | **1/4 chmf** | Chamfer mill | 0.250" | 0.000" | 2 | 0.750" | HSS | 40–60 ipm | Chamfering (Setups 3, 4) |

---

## House Rules (Conventions Held Across Operations)

- **Spindle RPM: 12,000 RPM** on virtually all ops. Three exceptions use calculated SFM-based values: T5 = **11,713.8 RPM**, T17 = **10,160.5 RPM**, T23 = **10,185.9 RPM** — these are the carbide finishing tools where SFM was the design intent.
- **Coolant: Flood** on every single operation, no exceptions.
- **Clearance height offset: 0.4"** above part — consistent across all 44 ops.
- **Retract height offset: 0.2"** above part — consistent across all 44 ops.
- **Ramp type for adaptive ops: Helix at 1°** ramp angle — universal for all adaptive clearing.
- **Ramp type for contour ops: Profile** — universal for all 2D contour finishing.
- **Direction for adaptive: Climb** — all adaptive ops.
- **Default plunge feed: 13.33 ipm** — this is the baseline plunge for most ops (≈ 10% of a 140 ipm cut feed; scales down proportionally). Deliberate overrides: T10 ops use **30 ipm** plunge; Setup3 T29 adaptive uses **50 ipm** plunge; Setup3/4 T7 contours use **50 ipm** plunge; T23 uses **25 ipm** plunge = cut feed (light finishing tool).
- **Rough tolerance: 0.004"** — all adaptive roughing ops.
- **Finish tolerance: 0.0004"** — all contour, flow, chamfer, and finishing ops.
- **Stock mode: Solid** for Setup1; **Previous setup** for Setups 3, 4(2), and 4 — each setup inherits the prior result.
- **WCS offset mode: Simple** across all setups.
- **Bottom Z offset: 0"** is the default. Deliberate through-cut overrides noted below.

---

## Setup-by-Setup

### Setup 1 — Primary Side (14 ops, stock from solid)

**Stock:** Sized to bounding box of part geometry (ceiling-rounded). WCS: simple offset.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Opt. Load | Stock to Leave | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2D Adaptive rough — large pockets | **T26 1/2 AL ROUGHER** | 12,000 | 140 ipm | 13.33 ipm | 0.500" | 0.100" | +0.020" | Helix 1°, tol 0.004" |
| 2 | 2D Contour — finish profile | **T7 1/4 AL FINISH EM** | 12,000 | 36 ipm | 13.33 ipm | 75% FL | — | **−0.080"** | Tol 0.0004", comp=computer; **aggressive negative offset — intentional undercut** |
| 3 | 2D Adaptive rough — narrow pockets | **T5 3/8 ROUGH EM LONG** | 11,714 | 87.9 ipm | 13.33 ipm | 0.200" | 0.040" | +0.010" | Ramp feed 50 ipm, helix 1° |
| 4 | 2D Adaptive rough — narrow pockets (2) | **T5 3/8 ROUGH EM LONG** | 11,714 | 87.9 ipm | 13.33 ipm | min(75%FL, 2.5×D) | 0.050" | +0.010" | **Bottom Z −0.060"** (through-cut intent) |
| 5 | 2D Adaptive — large finish pocket | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | min(75%FL, 2.5×D) | 0.150" | +0.010" | Helix 1°, tol 0.004" |
| 6 | 2D Contour — finish wall | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | 75% FL | — | +0.004" | Tol 0.0004", comp=**control** |
| 7 | 2D Contour — finish wall (neg stock) | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | 75% FL | — | **−0.030"** | Tol 0.0004", comp=control |
| 8 | 2D Contour — finish wall (neg stock + Z offset) | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | 75% FL | — | **−0.030"** | **Bottom Z −0.060"**, comp=control |
| 9 | 2D Contour — finish wall (neg stock) | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | 75% FL | — | **−0.030"** | Tol 0.0004", comp=computer |
| 10 | 2D Contour — finish wall (neg stock + Z offset) | **T10 1/2 al finish long** | 12,000 | 60 ipm | 30 ipm | 75% FL | — | **−0.030"** | **Bottom Z −0.050"**, comp=computer |
| 11 | Flow surface finish | **T17 1/4in 6F R.030** | 10,161 | 170.7 ipm | 13.33 ipm | — | — | +0.004" | Stepover **0.003"**, both ways, tol 0.0004" |
| 12 | 2D Adaptive — small pocket rough | **T11 3/16 AL rough** | 12,000 | 54 ipm | 13.33 ipm | 0.250" | 0.030" | +0.005" | Ramp feed 40 ipm, helix 1° |
| 13 | 2D Contour — small pocket finish | **T23 3/16 4F BNM R.015** | 10,186 | 25 ipm | 25 ipm | 75% FL | — | +0.004" | Tol 0.0004", comp=control; plunge = cut feed |
| 14 | 2D Chamfer | **T4 1/8 CHMF** | 12,000 | 60 ipm | 13.33 ipm | — | — | 0" | Tol 0.0004", comp=computer |

**Flow:** Large rough → undercut finish contour → narrow rough (×2) → large finish adaptive → multiple finish contours (with neg stock) → flow surface → small pocket rough → small pocket finish → chamfer.

---

### Setup 2 (Setup3) — Second Side (9 ops, stock from previous setup)

**Stock:** Inherited from Setup1. WCS: simple offset.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Opt. Load | Stock to Leave | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Face mill — rough | **T26 1/2 AL ROUGHER** | 12,000 | 100 ipm | 13.33 ipm | 0.040" | — | — | Stepover 0.100", both ways, **Bottom Z +0.010"** (leaves skin) |
| 2 | 2D Adaptive rough | **T26 1/2 AL ROUGHER** | 12,000 | 90 ipm | 30 ipm | 0.300" | 0.030" | +0.015" | **Bottom Z −0.030"**, helix 1° |
| 3 | Face mill — finish | **T29 1/4 al finish long** | 12,000 | 60 ipm | 13.33 ipm | 0.040" | — | 0" | Stepover = formula (≈70% of flat dia), both ways |
| 4 | 2D Adaptive finish | **T29 1/4 al finish long** | 12,000 | 54 ipm | 50 ipm | min(75%FL, 2.5×D) | 0.010" | +0.015" | **Bottom Z −0.030"**, helix 1° |
| 5 | 2D Contour finish | **T29 1/4 al finish long** | 12,000 | 54 ipm | 50 ipm | 75% FL | — | +0.004" | **Bottom Z −0.030"**, comp=control |
| 6 | 2D Contour chamfer (slow) | **T18 1/4 chmf** | 12,000 | 40 ipm | 13.33 ipm | 75% FL | — | +0.004" | Comp=computer |
| 7 | 2D Contour chamfer | **T18 1/4 chmf** | 12,000 | 60 ipm | 13.33 ipm | 75% FL | — | +0.004" | Comp=computer |
| 8 | 2D Contour chamfer | **T18 1/4 chmf** | 12,000 | 60 ipm | 13.33 ipm | 75% FL | — | +0.004" | Comp=computer |
| 9 | 2D Contour chamfer | **T18 1/4 chmf** | 12,000 | 60 ipm | 13.33 ipm | 75% FL | — | +0.004" | Comp=computer |

**Flow:** Rough face → adaptive rough → finish face → adaptive finish → contour finish → chamfers (×4, note OP6 uses 40 ipm vs. 60 ipm on the others — likely a different feature or first-pass caution).

---

### Setup 3 — Setup4 (2) — Third Orientation (12 ops, stock from previous setup)

**Stock:** Inherited. WCS: simple offset.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Opt. Load | Stock to Leave | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2D Contour finish | **T7 1/4 AL FINISH EM** | 12,000 | 36 ipm | 13.33 ipm | 75% FL | — | +0.004" | Comp=computer, tol 0.0004" |
| 2 | 2D Adaptive | **T7 1/4 AL FINISH EM** | 12,000 | 75 ipm | 50 ipm | min(75%FL, 2.5×D) | 0.020" | +0.001" | Helix 1°, tol 0.004" |
| 3 | 2D Contour finish | **T7 1/4 AL FINISH EM** | 12,000 | 75 ipm | 50 ipm | 75% FL | — | +0.004" | Comp=computer |
| 4 | 2D Adaptive — small | **T30 1/8 EM** | 12,000 | 53 ipm | 30 ipm | min(75%FL, 2.5×D) | 0.010"