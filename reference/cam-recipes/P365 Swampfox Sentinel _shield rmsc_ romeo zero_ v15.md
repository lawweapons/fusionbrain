# CAM Recipe: P365 Swampfox Sentinel (shield rmsc, romeo zero) v15

## Summary

Optic mounting plate / adapter for a SIG P365 pistol, designed to accept Swampfox Sentinel, Shield RMSC, and Romeo Zero footprints. Material and machine not explicitly specified in export, but conservative feeds/speeds (2500–3000 RPM on 3/8" tools) are consistent with **steel or aluminum alloy** — context (firearm part, insert mill selection) strongly suggests **steel**. Two setups (Setup1 and VF4), each with 6 operations in identical sequence: bulk adaptive rough → detail adaptive rough → contour finish → drill → thread mill → final contour. The VF4 setup uses a bull nose end mill and higher-RPM 1/4" end mill, suggesting a Haas VF4 VMC as the target machine for Setup 2.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T7 (S1) | **The Ripkey Ripper (TM) 3/8" insert mill** | 0.375" dia, 4FL, flat, carbide, 0.3" FL, Fingersoll | 15 ipm (adaptive), 8 ipm (contour) | Bulk adaptive roughing, contour semi-finish |
| T9 (S1) | **1/4 Flat End Mill** | 0.250" dia, 4FL, flat, carbide, 0.3782" FL, Kennametal | 8–10 ipm | Detail adaptive roughing, final contour |
| T8 (both) | **6/32 Drill** | 0.116" dia, 2FL, drill, carbide, 1.09" FL | 40 ipm (feed), 2 ipm (plunge) | Pilot/through holes for 6-32 screws |
| T2 (S1) / T7 (S2) | **32 TPI Thread Mill, 0.100" dia** | 0.100" dia, 3FL, thread mill, TiN coated, 0.787" FL | 7.5 ipm (S1) / 18 ipm (S2) | 6-32 thread milling |
| T20 (S2) | **3/8 BNM Modular** | 0.375" dia, 4FL, bull nose, carbide, CR=0.031", 0.27" FL, Ingersoll #5840004 | 15 ipm (adaptive), 8 ipm (contour) | Bulk adaptive roughing, contour semi-finish (Setup 2) |
| T6 (S2) | **1/4 Flat End Mill** | 0.250" dia, 4FL, flat, carbide, 0.5" FL | 36.67 ipm (adaptive), 10 ipm (contour) | Detail adaptive roughing, final contour (Setup 2) |

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on every operation, no exceptions.
- **Clearance height offset:** **0.4"** above part — consistent across all 12 operations.
- **Retract height offset:** **0.2"** above part — consistent across all 12 operations.
- **Adaptive roughing stock to leave:** **0.005"** on all adaptive ops (both setups).
- **Contour/drill/thread stock to leave:** **0.004"** on all finishing/drilling/threading ops.
- **Adaptive roughing tolerance:** **0.002"** on all adaptive ops.
- **Contour finish tolerance:** **0.0004"** on all contour finish ops — 5× tighter than roughing.
- **Ramp type for adaptive:** Helix, **0° ramp angle** (straight helix entry).
- **Ramp type for contour:** Profile ramp.
- **Adaptive direction:** Climb milling throughout.
- **Thread direction:** Conventional (both setups) — standard for thread milling.
- **Drill plunge feed:** **2 ipm** — deliberately slow, hard-coded override vs. ~13 ipm used everywhere else.
- **Bottom Z offset on contour semi-finish (Op 3 both setups):** **+0.045"** — intentional floor clearance, NOT cutting to depth.
- **Bottom Z offset on drill:** **−0.290"** — through-cut with positive breakthrough.
- **Bottom Z offset on thread mill:** **−0.170"** — thread depth below surface.
- **Compensation:** Op 3 contour = computer comp; Op 6 contour = **control comp** (deliberate difference — see Gotchas).

---

## Setup-by-Setup

### Setup 1: Setup1

**Stock:** Bounding-box auto-stock (default mode, rounded up to nearest rounding increment), offsets kept from model.
**WCS:** Not explicitly named; default orientation.

| # | Operation | Strategy | Tool | Spindle RPM | Cut Feed | Plunge Feed | Max Axial DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|----------|------|-------------|----------|-------------|---------------|--------------|----------------|-----------|-------|
| 1 | 2D Adaptive1 | 2D Adaptive | T7 – 3/8" insert mill | **2500 RPM** | **15 ipm** | 13.12 ipm | 0.75×FL or 2.5×D (auto) | **0.030"** | 0.005" | 0.002" | Helix entry, climb, bulk rough |
| 2 | 2D Adaptive3 | 2D Adaptive | T9 – 1/4" flat EM | **3000 RPM** | **8 ipm** | 13.12 ipm | 0.75×FL or 2.5×D (auto) | **0.020"** | 0.005" | 0.002" | Helix entry, climb, detail rough |
| 3 | 2D Contour25 | 2D Contour | T7 – 3/8" insert mill | **2500 RPM** | **8 ipm** | 13.12 ipm | **0.020"** | — | 0.004" | **0.0004"** | Profile ramp, +0.045" floor offset, computer comp, semi-finish walls |
| 4 | Drill1 | Drill | T8 – 6/32 drill | **2075 RPM** | **40 ipm** | **2 ipm** | — | — | 0.004" | auto | −0.290" bottom offset (through) |
| 5 | Thread1 | Thread Mill | T2 – 32 TPI thread mill | **5000 RPM** | **7.5 ipm** | 13.12 ipm | — | 0.002" stepover | 0.004" | — | 6 passes, conventional, −0.170" bottom, computer comp |
| 6 | 2D Contour1 | 2D Contour | T9 – 1/4" flat EM | **5000 RPM** | **10 ipm** | 13.12 ipm | 0.75×FL (auto) | — | 0.004" | **0.0004"** | Profile ramp, 0" floor offset, **control comp** |

**Op flow logic:** Large-tool bulk adaptive → small-tool detail adaptive (cleans corners/features too small for 3/8") → semi-finish contour walls with 3/8" (leaving floor proud at +0.045") → drill screw holes → thread mill → final contour finish with 1/4" at control comp.

---

### Setup 2: VF4

**Stock:** Same bounding-box auto-stock convention as Setup 1.
**WCS:** Named "VF4" — implies Haas VF4 VMC, second op / flip setup.

| # | Operation | Strategy | Tool | Spindle RPM | Cut Feed | Plunge Feed | Max Axial DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|----------|------|-------------|----------|-------------|---------------|--------------|----------------|-----------|-------|
| 1 | 2D Adaptive1 (2) | 2D Adaptive | T20 – 3/8" BNM modular | **2500 RPM** | **15 ipm** | 13.33 ipm | 0.75×FL or 2.5×D (auto) | **0.030"** | 0.005" | 0.002" | Helix entry, climb, bulk rough |
| 2 | 2D Adaptive3 (2) | 2D Adaptive | T6 – 1/4" flat EM | **~6112 RPM** | **~36.67 ipm** | 13.33 ipm | 0.75×FL or 2.5×D (auto) | **0.020"** | 0.005" | 0.002" | Helix entry, climb, detail rough — **significantly higher RPM/feed than Setup 1** |
| 3 | 2D Contour25 (2) | 2D Contour | T20 – 3/8" BNM modular | **2500 RPM** | **8 ipm** | 13.33 ipm | **0.020"** | — | 0.004" | **0.0004"** | Profile ramp, +0.045" floor offset, computer comp |
| 4 | Drill1 (2) | Drill | T8 – 6/32 drill | **2075 RPM** | **40 ipm** | **2 ipm** | — | — | 0.004" | auto | −0.290" bottom offset (through) — identical to Setup 1 |
| 5 | Thread1 (2) | Thread Mill | T7 – 32 TPI thread mill | **5000 RPM** | **18 ipm** | 13.12 ipm | — | 0.002" stepover | 0.004" | — | **7 passes** (vs. 6 in S1), conventional, −0.170" bottom, computer comp, **cut feed 2.4× higher than Setup 1** |
| 6 | 2D Contour1 (2) | 2D Contour | T6 – 1/4" flat EM | **5000 RPM** | **10 ipm** | 13.33 ipm | 0.75×FL (auto) | — | 0.004" | **0.0004"** | Profile ramp, 0" floor offset, **control comp** |

**Op flow logic:** Mirrors Setup 1 exactly in sequence. Key differences: bull nose replaces insert mill (better for second-op interrupted cuts / edge conditions), 1/4" EM runs at ~6112 RPM / 36.67 ipm (likely SFM-driven from a different tool library entry), thread mill gets 7 passes and 18 ipm vs. 6 passes / 7.5 ipm.

---

## Patterns & Gotchas

- **+0.045" floor offset on Op 3 (both setups) is intentional.** The 2D Contour25 semi-finish does NOT cut to final floor depth — it is a wall-finishing pass only. Do not zero this out without understanding the floor finish strategy (there is no dedicated floor finish op; the adaptive ops handle floor stock).

- **Control comp on Op 6 vs. computer comp on Op 3.** Op 3 uses computer compensation (Fusion outputs the offset path); Op 6 uses control compensation (the machine controller applies the radius offset). If posting to a control that doesn't support cutter comp (G41/G42), Op 6 must be switched to computer comp before running.

- **Thread mill pass count differs between setups: 6 passes (Setup 1) vs. 7 passes (Setup 2).** The cut feed also jumps from 7.5 ipm to 18 ipm. These are not copy-paste errors — they reflect tuned parameters for each side of the part. Do not blindly copy Setup 1 thread parameters to Setup 2 or vice versa.

- **Setup 2 Op 2 runs at ~6112 RPM / 36.67 ipm** — more than double the Setup 1 equivalent (3000 RPM / 8 ipm) on the same nominal 1/4" tool. The Setup 2 tool has a longer flute (0.5" vs. 0.378") and appears to be a different, higher-performance tool despite the same diameter. Verify tool identity before substituting.

- **Drill plunge is hard-coded at 2 ipm** — an order of magnitude slower than all other plunge feeds (~13 ipm). This is deliberate for the small 0.116" drill. Do not normalize it to the house plunge convention.

- **The 3/8" insert mill (Setup 1, T7) runs at only 2500 RPM** — this is consistent with a steel workpiece where insert geometry and chip load dictate conservative SFM. The Setup 2 1/4" EM at 6112 RPM is not contradictory — it's a different tool class. If this part were aluminum, both would be running 10,000+ RPM; the low speeds confirm a ferrous or hard material.

---

## How to Adapt This for a New Part

- [ ] **Confirm material match.** All speeds/feeds are tuned for what appears to be steel. If switching to aluminum, titanium, or stainless, recompute RPM and feed for every tool — do not reuse these values.
- [ ] **Confirm machine match.** Setup 2 is named "VF4" — verify spindle max RPM, taper (likely CAT40/BT40), and that the tool numbers (T6, T7, T8, T20) match your carousel layout before running.
- [ ] **Verify tool library entries.** T7 in Setup 1 is the insert mill; T7 in Setup 2 is the thread mill — tool numbers are NOT consistent across setups. Map tools by description, not number, when adapting.
- [ ] **Adaptive optimal loads (0.030" for 3/8", 0.020" for 1/4") are conservative** — appropriate for steel. For aluminum, optimal load can typically be increased to 15–25% of diameter; for harder steels, leave as-is or reduce.
- [ ] **The +0.045" floor offset on Op 3 must be re-evaluated** for any part with different floor finish requirements. If your part needs a finished floor from the contour op, zero this out.
- [ ] **Thread mill pass count and feed** should be re-derived from the thread mill manufacturer's data for any new thread size or material. The 6 vs. 7 pass difference between setups is a validated tuning result — treat it as a starting point only.
- [ ] **Control comp (Op 6) requires G41/G42 support.** Confirm your post processor and control support cutter compensation before running, or switch to computer comp in Fusion.
- [ ] **Stock-to-leave convention:** 0.005" on roughs, 0.004" on finishes — this is a tight but workable convention for steel. Preserve it unless you have a specific reason to change (e.g., adding a dedicated spring-pass).