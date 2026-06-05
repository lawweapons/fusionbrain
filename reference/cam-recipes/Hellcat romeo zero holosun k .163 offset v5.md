# CAM Recipe: Hellcat Romeo Zero Holosun K .163 Offset v5

## Summary
Firearm slide optic cut — specifically a Romeo Zero / Holosun K footprint cut with a 0.163" Z-offset on a Springfield Hellcat slide. Material not explicitly named in export but context (pistol slide, conservative feeds/speeds) strongly indicates **steel** (likely 4140/17-4 or similar). Two setups (Setup1 and VF4) run an identical 6-operation sequence — rough adaptive → finish adaptive → contour finish → drill → thread mill → outer contour — suggesting the program was ported between two machines or fixtures. Total: **12 operations across 2 setups**.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cut Feed | Used For |
|--------|-------------|----------|-----------------|----------|
| T7 (S1) / T20 (S2) | **The Ripkey Ripper™ 3/8" Insert Mill** / **3/8 BNM Modular** | 0.375" dia, 4-fl, flat/bull-nose (CR=0.031" on S2), carbide, FL=0.30"/0.27" | 15 in/min | Bulk adaptive roughing of optic pocket |
| T9 (S1) / T6 (S2) | **1/4" Flat End Mill** (Kennametal S1; generic S2) | 0.25" dia, 4-fl, flat, carbide, FL=0.378"/0.500" | 8–36.7 in/min | Finish adaptive (small features) + outer contour |
| T8 (both) | **6/32 Drill** | 0.116" dia, 2-fl, carbide, FL=1.09" | 40 in/min (programmed) | Mounting screw holes |
| T2 (S1) / T7 (S2) | **32 TPI Thread Mill, 0.100" dia** | 0.100" dia, 3-fl, TiN coated, FL=0.787" | 7.5 / 18 in/min | 6-32 threaded mounting holes |

> **Note:** Setup 2 (VF4) uses a bull-nose variant (CR=0.031") for the 3/8" rougher and a longer 1/4" EM (FL=0.500" vs 0.378"). Tool numbers shift between setups — verify T# assignments before posting.

---

## House Rules (Conventions Held Across Operations)

- **Clearance height offset:** **0.4"** above part — consistent across all 12 ops.
- **Retract height offset:** **0.2"** above part — consistent across all 12 ops.
- **Coolant:** **Flood** on every operation, no exceptions.
- **Climb milling** on all adaptive and contour ops except thread milling (conventional).
- **Adaptive roughing stock-to-leave:** **0.005"** on all adaptive ops (both setups).
- **Contour/drill/thread stock-to-leave:** **0.004"** on all finishing, drilling, and thread ops.
- **Adaptive tolerance:** **0.002"** on all adaptive ops.
- **Contour finish tolerance:** **0.0004"** on all 2D contour finish ops.
- **Ramp type — adaptive:** Helix, **0° ramp angle** (straight helix entry).
- **Ramp type — contour:** Profile ramp.
- **Cutter comp — contour finish (Op 3):** Computer-side comp; **outer contour (Op 6):** Control-side comp (Setup 1) / Computer-side comp (Setup 2) — **deliberate difference, verify before running**.
- **Bottom Z offset — Op 3 (contour finish):** **+0.045"** (intentional floor clearance / not cutting to full depth on this pass).
- **Bottom Z offset — drill:** **−0.290"** (through-drill, breaking through).
- **Bottom Z offset — thread:** **−0.170"** (thread depth stop).

---

## Setup-by-Setup

### Setup 1 — "Setup1"

**Stock:** Bounding-box auto-stock from model extents, offset mode = keep (no additional stock added beyond model bounds).
**WCS:** Not explicitly named; default Fusion WCS from model.

| # | Operation | Strategy | Tool | Spindle RPM | Cut Feed | Plunge Feed | Max Axial DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|----------|------|------------|---------|------------|--------------|-------------|---------------|-----------|-------|
| 1 | **2D Adaptive1** | 2D Adaptive (rough) | T7 — 3/8" Insert Mill | **2500** | **15 in/min** | 13.12 in/min | 0.75×FL or 2.5×D (formula) | **0.030"** | 0.005" | 0.002" | Helix entry, climb, ramp RPM 5000 |
| 2 | **2D Adaptive3** | 2D Adaptive (finish features) | T9 — 1/4" EM | **3000** | **8 in/min** | 5 in/min | 0.75×FL or 2.5×D | **0.020"** | 0.005" | 0.002" | Helix entry, climb |
| 3 | **2D Contour25** | 2D Contour (wall finish) | T7 — 3/8" Insert Mill | **2500** | **8 in/min** | 13.12 in/min | **0.020"** | — | 0.004" | 0.0004" | Profile ramp; **bottom Z +0.045"**; computer comp |
| 4 | **Drill1** | Drilling | T8 — 6/32 Drill | **2075** | **40 in/min** | **2 in/min** | — | — | 0.004" | tool_dia/100 | Bottom Z **−0.290"** (through) |
| 5 | **Thread1** | Thread milling | T2 — 32 TPI Thread Mill | **5000** | **7.5 in/min** | 13.12 in/min | — | Stepover **0.002"** | 0.004" | — | Conventional; **6 passes**; bottom Z −0.170"; computer comp |
| 6 | **2D Contour1** | 2D Contour (outer profile) | T9 — 1/4" EM | **5000** | **10 in/min** | 13.12 in/min | 0.75×FL | — | 0.004" | 0.0004" | Profile ramp; bottom Z 0.000"; **control-side comp** |

---

### Setup 2 — "VF4" (Haas VF4 or equivalent)

**Stock:** Same bounding-box auto-stock convention as Setup 1.
**WCS:** Named "VF4" — machine-specific WCS, confirm G54 offset before running.

| # | Operation | Strategy | Tool | Spindle RPM | Cut Feed | Plunge Feed | Max Axial DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|----------|------|------------|---------|------------|--------------|-------------|---------------|-----------|-------|
| 1 | **2D Adaptive1 (2)** | 2D Adaptive (rough) | T20 — 3/8 BNM Modular | **2500** | **15 in/min** | 13.33 in/min | 0.75×FL or 2.5×D | **0.030"** | 0.005" | 0.002" | Helix entry, climb |
| 2 | **2D Adaptive3 (2)** | 2D Adaptive (finish features) | T6 — 1/4" EM | **SFM-driven: 300 SFM** (~4584 RPM calc) | **36.67 in/min** | 13.33 in/min | 0.75×FL or 2.5×D | **0.020"** | 0.005" | 0.002" | Helix entry, climb; **feed is SFM-formula-driven — verify actual RPM on machine** |
| 3 | **2D Contour25 (2)** | 2D Contour (wall finish) | T20 — 3/8 BNM Modular | **2500** | **10 in/min** | 13.33 in/min | **0.020"** | — | 0.004" | 0.0004" | Profile ramp; **bottom Z +0.045"**; computer comp |
| 4 | **Drill1 (2)** | Drilling | T8 — 6/32 Drill | **2075** | **40 in/min** | **2 in/min** | — | — | 0.004" | tool_dia/100 | Bottom Z **−0.290"** (through); identical to Setup 1 |
| 5 | **Thread1 (2)** | Thread milling | T7 — 32 TPI Thread Mill | **5000** | **18 in/min** | 13.12 in/min | — | Stepover **0.002"** | 0.004" | — | Conventional; **7 passes** (vs. 6 in S1); bottom Z −0.170"; computer comp |
| 6 | **2D Contour1 (2)** | 2D Contour (outer profile) | T6 — 1/4" EM | **SFM-driven: 300 SFM** | **10 in/min** | 13.33 in/min | 0.75×FL | — | 0.004" | 0.0004" | Profile ramp; bottom Z 0.000"; **computer-side comp** (differs from S1 Op 6) |

---

## Patterns & Gotchas

- **Thread mill cut feed differs significantly between setups: 7.5 in/min (Setup 1) vs. 18 in/min (Setup 2), and pass count differs (6 vs. 7).** This is a deliberate machine-specific tuning difference — do NOT swap these values between setups without re-validating thread quality. The 18 in/min on Setup 2 is aggressive for a 0.100" thread mill in steel.

- **Setup 2 Op 2 and Op 6 use SFM-formula-driven RPM (300 SFM → ~4584 RPM on 0.25" tool).** The cut feed of 36.67 in/min on Op 2 is formula-computed and unusually high compared to Setup 1's 8 in/min on the same feature — confirm this is intentional for the VF4's rigidity and the specific 1/4" EM in T6 (longer FL=0.500").

- **Bottom Z offset of +0.045" on Op 3 (contour finish) in both setups** means the wall finish pass does NOT cut to the pocket floor. This is intentional — likely leaving floor cleanup to the adaptive passes or protecting a critical Z datum. Do not zero this out without understanding the floor finish strategy.

- **Drill plunge feed is 2 in/min** — dramatically slower than all other plunge feeds (~13 in/min). This is correct for a 0.116" drill in steel; do not normalize it to match other ops.

- **Cutter comp convention differs between setups on Op 6:** Setup 1 uses **control-side comp**; Setup 2 uses **computer-side comp**. Verify which your post-processor and controller expect — mixing these on the same machine will cause dimensional errors.

- **The 0.030" optimal load on the 3/8" rougher is very conservative** (~8% of diameter). This is appropriate for steel with an insert mill but will produce long cycle times. Do not increase without confirming insert grade and machine rigidity.

---

## How to Adapt This for a New Part

1. **Confirm material match.** All feeds/speeds are tuned for steel (likely hardened pistol slide material). If cutting aluminum, RPM and feed can be increased substantially — these values are NOT aluminum-safe at face value (too slow).
2. **Confirm machine match.** Setup 1 vs. Setup 2 (VF4) have different tool numbers and some different feeds. Identify which setup maps to your machine before posting.
3. **Re-verify tool numbers.** T7 in Setup 1 is the insert mill; T7 in Setup 2 is the thread mill. Tool number collisions exist between setups — audit the tool table before combining or reusing.
4. **Optic footprint geometry:** The 0.163" Z-offset is baked into the model/WCS, not a CAM parameter. If adapting for a different optic height, update the model and re-verify all bottom Z offsets, especially the +0.045" contour floor clearance.
5. **Thread mill passes:** 6 passes (S1) or 7 passes (S2) for 6-32 threads. If changing thread spec, recalculate passes and stepover from scratch — do not carry over.
6. **Drill through-depth (−0.290"):** Confirm this clears your specific slide wall thickness. This is a through-hole value — blind hole applications require a new bottom Z.
7. **Contour comp mode (Op 6):** Decide control vs. computer comp based on your controller capability before running. Measure first part carefully.
8. **Stock-to-leave convention:** 0.005" on roughs, 0.004" on finishes — these are the cleanup margins. If adding a dedicated floor finish op, account for these offsets.