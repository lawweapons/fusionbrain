# CAM Recipe: Glock 19/17 RMR Slide Cut v10

## Summary
This program machines an RMR (Trijicon RMR) optic cut into a Glock 19/17 pistol slide — a precision pocket with threaded mounting holes. Material is hardened steel (implied by conservative feeds/speeds and flood coolant; not explicitly stated in export). Machine is named **VF4** (Setup 2), consistent with a Haas VF-series VMC. Two setups, 11 operations total (plus 1 Manual NC). Overall strategy: adaptive rough the pocket → contour finish the walls → drill mounting holes → thread-mill 6-32 threads → contour a secondary feature.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cut Feed | Used For |
|--------|-------------|----------|-----------------|----------|
| T7 (S1) | **The Ripkey Ripper (TM) 3/8" Insert Mill** | 0.375" dia, 0.0" CR, 4 fl, 0.3" FL, carbide flat EM, Fingersoll | 15 ipm (adaptive) / 8 ipm (contour) | Adaptive roughing + wall finish contour |
| T8 (S1/S2) | **6/32 Drill (#32 drill)** | 0.116" dia, 2 fl, 1.09" FL, carbide drill | 40 ipm | Mounting hole drilling |
| T2 (S1) / T7 (S2) | **32 TPI Thread Mill, 0.100" dia** | 0.1" dia, 3 fl, 0.787" FL, TiN-coated thread mill | 7.5 ipm (S1) / 18 ipm (S2) | 6-32 thread milling |
| T9 (S1) | **1/4 Flat End Mill** | 0.25" dia, 0.0" CR, 5 fl, 0.75" FL, carbide, Kennametal | 10 ipm | Secondary contour feature |
| T20 (S2) | **3/8 BNM Modular** | 0.375" dia, 0.031" CR (bull nose), 4 fl, 0.27" FL, carbide, Ingersoll #5840004 | 15 ipm (adaptive) / 8 ipm (contour) | Adaptive roughing + wall finish contour |
| T6 (S2) | **1/4 Flat End Mill** | 0.25" dia, 0.0" CR, 4 fl, 0.5" FL, carbide | 10 ipm | Secondary contour feature |

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on every cutting operation, both setups.
- **Clearance height offset:** **0.4"** above part — consistent across all ops, both setups.
- **Retract height offset:** **0.2"** above part — consistent across all ops, both setups.
- **Stock to leave (finish stock):** **0.004"** on all contour/drill/thread ops; **0.005"** on adaptive roughing ops.
- **Adaptive roughing spindle speed:** **2500 RPM** on both setups (conservative for steel).
- **Adaptive optimal load:** **0.03"** — very light radial engagement; this is a trochoidal/adaptive strategy on a hard material.
- **Adaptive roughing feed:** **15 ipm** on both setups.
- **Contour finish feed:** **8 ipm** on both setups.
- **Thread mill direction:** **Conventional** milling on both setups (standard for thread milling).
- **Thread mill bottom Z offset:** **-0.16"** both setups (controls thread depth).
- **Drill bottom Z offset:** **-0.27"** both setups (through/clearance depth for 6-32 holes).
- **Ramp type for adaptive:** Helix, **0° ramp angle** (near-vertical helix entry).
- **Ramp type for contours:** Profile ramp.
- **Adaptive cut direction:** Climb milling.
- **Tolerance — roughing:** 0.002"; **finishing contours:** 0.0004".
- **Cutter comp:** Computer comp on finish contours (Setup 1 Op2, Setup 2 Op2); control comp on secondary contour (Op5 both setups). Note the deliberate split.

---

## Setup-by-Setup

### Setup 1 — "Setup1"
**Stock:** Bounding-box auto stock (offset mode: keep). WCS: not explicitly named.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Stepover / Opt. Load | Stock to Leave | Tolerance | Notes |
|---|-----------|------|-----|----------|--------|---------|----------------------|----------------|-----------|-------|
| 1 | **2D Adaptive1** — pocket rough | T7 3/8" Insert Mill | **2500** | **15 ipm** | 13.12 ipm | `min(FL×0.75, dia×2.5)` | **0.03" opt. load** | **0.005"** | 0.002" | Helix entry, 0° ramp, climb |
| 2 | **2D Contour25** — wall finish | T7 3/8" Insert Mill | **2500** | **8 ipm** | 13.12 ipm | **0.02"** | — | **0.004"** | 0.0004" | Profile ramp, computer comp |
| 3 | **Drill1** — mounting holes | T8 #32 Drill | **2075** | **40 ipm** | **2 ipm** | — | — | 0.004" | — | Bottom Z offset **−0.27"** |
| 4 | **Thread1** — 6-32 threads | T2 Thread Mill 0.1" | **5000** | **7.5 ipm** | 13.12 ipm | — | **0.002" stepover** | 0.004" | — | **6 passes**, conventional, bottom Z **−0.16"**, computer comp |
| 5 | **2D Contour1** — secondary feature | T9 1/4" EM 5-fl | **5000** | **10 ipm** | 13.33 ipm | `FL×0.75` | — | 0.004" | 0.0004" | Profile ramp, **control comp** |

---

### Setup 2 — "VF4"
**Stock:** Bounding-box auto stock (offset mode: keep). WCS: VF4 (Haas VF-series VMC implied). This setup mirrors Setup 1 with tool substitutions and one notable parameter change.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Stepover / Opt. Load | Stock to Leave | Tolerance | Notes |
|---|-----------|------|-----|----------|--------|---------|----------------------|----------------|-----------|-------|
| 1 | **2D Adaptive1 (2)** — pocket rough | T20 3/8" BNM | **2500** | **15 ipm** | 13.33 ipm | `min(FL×0.75, dia×2.5)` | **0.03" opt. load** | **0.005"** | 0.002" | Helix entry, 0° ramp, climb |
| 2 | **2D Contour25 (2)** — wall finish | T20 3/8" BNM | **2500** | **8 ipm** | 13.33 ipm | **0.02"** | — | **0.004"** | 0.0004" | Profile ramp, computer comp |
| 3 | **Drill1 (2)** — mounting holes | T8 #32 Drill | **2075** | **40 ipm** | **2 ipm** | — | — | 0.004" | — | Bottom Z offset **−0.27"** |
| 4 | **Thread1 (2)** — 6-32 threads | T7 Thread Mill 0.1" | **5000** | **18 ipm** ⚠️ | 13.12 ipm | — | **0.002" stepover** | 0.004" | — | **7 passes** (vs. 6 in S1), conventional, bottom Z **−0.16"**, **control comp** (vs. computer in S1) |
| 5 | **2D Contour1 (2)** — secondary feature | T6 1/4" EM 4-fl | **300 SFM** (~4584 RPM) | **10 ipm** | 13.33 ipm | `FL×0.75` | — | 0.004" | 0.0004" | Profile ramp, **control comp**; RPM computed from SFM, not hardcoded |
| 6 | **Manual NC1** | — | — | — | — | — | — | — | — | Manual G-code block — contents not in export |

---

## Patterns & Gotchas

- **Thread mill feed was revised between setups:** Setup 1 uses **7.5 ipm** with **6 passes**; Setup 2 uses **18 ipm** with **7 passes**. This is a deliberate tuning change — do NOT blindly copy Setup 1 thread parameters to a new program. Setup 2 values appear to be the refined/proven version.

- **0.03" optimal load on a 3/8" tool = 8% radial engagement.** This is intentionally conservative for hardened steel. Do not scale this up for aluminum or softer materials without recalculating — it will leave excessive cycle time.

- **The 3/8" insert mill (Setup 1) is replaced by a 3/8" bull nose EM (Setup 2).** The BNM has a 0.031" corner radius. If reusing Setup 1 geometry on a machine with only the BNM, verify that the corner radius doesn't violate inside-corner geometry on the RMR pocket.

- **Drill plunge is 2 ipm** — dramatically slower than all other plunge feeds (~13 ipm). This is intentional for a small-diameter carbide drill in steel. Do not normalize this to match other ops.

- **Cutter comp split (computer vs. control):** Finish contours (Op 2 both setups) use computer comp; the secondary contour (Op 5 both setups) uses control comp. This is a deliberate choice — likely because the secondary feature benefits from on-machine comp adjustment. Verify your controller handles this correctly before running.

- **Manual NC1 (Setup 2, Op 6):** Contents unknown from export. This likely contains a custom probing cycle, a specific G-code for the VF4, or a fixture release move. **Do not skip this op without understanding its content** — it may be safety-critical or required for part release.

---

## How to Adapt This for a New Part

1. **Confirm material match.** These feeds/speeds (2500 RPM, 15 ipm, 0.03" opt. load) are tuned for hardened steel slide material. Recalculate for any other material.
2. **Confirm machine match.** Setup 2 is named "VF4" — verify spindle taper, max RPM, and coolant type before posting to a different machine. The Manual NC1 block may be VF4-specific.
3. **RMR pocket geometry:** The 0.02" max axial DOC on finish contours and 0.0004" tolerance are specific to the tight tolerances of an optic mounting pocket. Retain these for any precision pocket finish pass.
4. **Thread mill passes:** Use Setup 2's **7-pass / 18 ipm** values as the proven baseline for 6-32 threads in this material. Adjust pass count if thread depth changes.
5. **Drill depth offset (−0.27"):** Tied to the specific slide thickness and hole-through requirement. Remeasure for any new slide variant.
6. **Tool substitution:** If the Ingersoll BNM (T20) is unavailable, the Fingersoll insert mill (T7/S1) is a proven substitute at identical feeds — but verify corner radius compatibility with pocket geometry.
7. **The 1/4" EM (Op 5):** Setup 2 uses SFM-driven RPM (300 SFM) rather than a hardcoded value. Ensure your CAM post correctly resolves this for the target machine's RPM range.