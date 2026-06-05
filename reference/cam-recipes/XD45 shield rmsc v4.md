# CAM Recipe: XD45 Shield RMSC v4

## Summary
Firearm accessory part — an XD45 pistol shield/mount plate for an RMSC red-dot optic. Single setup, 6 operations covering adaptive roughing (two tools), contour finishing, drilling, thread milling, and a final contour pass. Material and machine not specified in export, but flood coolant throughout and carbide tooling suggest metal (likely aluminum or steel). Overall strategy: adaptive rough with large and small tools → contour semi-finish → drill → thread mill → final contour finish.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T7 | **The Ripkey Ripper™ 3/8" Insert Mill** | 0.375" dia, 4-fl, flat, carbide, 0.300" FL, 0.0" CR | 15 ipm (rough), 8 ipm (contour) | Adaptive roughing large features; semi-finish contour |
| T9 | **1/4" Flat End Mill** (Kennametal) | 0.250" dia, 4-fl, flat, carbide, 0.3782" FL, 0.0" CR | 8–10 ipm | Adaptive roughing tight features; final contour finish |
| T8 | **#6-32 Drill** | 0.116" dia, 2-fl, drill, carbide, 1.09" FL | 40 ipm (feed), 2 ipm (plunge) | Drilling clearance/tap holes |
| T2 | **Thread Mill** (TiN coated) | 0.100" dia, 3-fl, thread mill, TiN, 0.787" FL | 18 ipm | Thread milling (7 passes) |

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on every operation — no exceptions.
- **Clearance height offset:** **+0.400"** above part/stock on all 6 ops.
- **Retract height offset:** **+0.200"** on all 6 ops.
- **Stock to leave:** **0.005"** on adaptive roughing ops (1 & 2); **0.004"** on all finishing/drilling/threading ops (3, 4, 5, 6).
- **Ramp type for adaptive ops:** Helix, **0° ramp angle** (near-vertical helix entry).
- **Ramp type for contour ops:** Profile ramp.
- **Cut direction:** Climb milling on all milling ops except Thread1 (conventional — required for thread milling geometry).
- **Cutter compensation:** Computer comp on 2D Contour25 (Op 3); **Control comp** on 2D Contour1 (Op 6) — deliberate difference, see Gotchas.
- **Tolerance:** 0.002" on adaptive ops; tightened to **0.0004"** on both contour finishing ops.
- **WCS stock mode:** Auto-sized from part bounding box with fixed rounding, offset mode = keep (stock wraps part geometry).

---

## Setup-by-Setup

### Setup 1 — Single Setup (all features)

**Stock:** Auto-computed bounding box from part geometry, rounded up to nearest rounding increment, offset mode = keep.  
**WCS:** Not explicitly named; single setup implies top-of-part Z=0 or part origin.

---

#### Op 1 — 2D Adaptive1 | **T7 — 3/8" Ripkey Ripper Insert Mill**
*Primary bulk roughing — large open areas*

| Parameter | Value |
|-----------|-------|
| Strategy | 2D Adaptive (climb) |
| Spindle RPM | **2,500** |
| Ramp RPM | 5,000 (helix entry only) |
| Cut Feed | **15 ipm** |
| Plunge Feed | 13.12 ipm |
| Ramp Feed | 13.12 ipm |
| Max Axial DOC | `min(FL × 0.75, dia × 2.5)` → **0.225"** (FL-limited) |
| Optimal Load (radial) | **0.030"** (8% of dia) |
| Stock to Leave | **0.005"** |
| Tolerance | 0.002" |
| Bottom Z Offset | 0.000" |
| Ramp | Helix, 0° angle |

---

#### Op 2 — 2D Adaptive3 | **T9 — 1/4" Flat End Mill**
*Secondary adaptive roughing — tight pockets/features the 3/8" couldn't reach*

| Parameter | Value |
|-----------|-------|
| Strategy | 2D Adaptive (climb) |
| Spindle RPM | **3,000** |
| Ramp RPM | 3,000 (same as spindle) |
| Cut Feed | **8 ipm** |
| Plunge Feed | 13.12 ipm |
| Max Axial DOC | `min(FL × 0.75, dia × 2.5)` → **0.284"** (FL-limited) |
| Optimal Load (radial) | **0.020"** (8% of dia) |
| Stock to Leave | **0.005"** |
| Tolerance | 0.002" |
| Bottom Z Offset | 0.000" |
| Ramp | Helix, 0° angle |

---

#### Op 3 — 2D Contour25 | **T7 — 3/8" Ripkey Ripper Insert Mill**
*Semi-finish contour — walls, leaving deliberate floor offset for clearance*

| Parameter | Value |
|-----------|-------|
| Strategy | 2D Contour (climb) |
| Spindle RPM | **2,500** |
| Ramp RPM | 2,500 |
| Cut Feed | **8 ipm** |
| Plunge Feed | 13.12 ipm |
| Max Axial DOC | **0.020"** (very shallow — likely a single skim pass) |
| Stock to Leave | **0.004"** |
| Tolerance | **0.0004"** |
| Bottom Z Offset | **+0.045"** (floor intentionally NOT cut to depth) |
| Ramp | Profile |
| Cutter Comp | Computer |

---

#### Op 4 — Drill1 | **T8 — #6-32 Drill (0.116" dia)**
*Drilling — through or clearance holes for mounting screws*

| Parameter | Value |
|-----------|-------|
| Strategy | Drill cycle |
| Spindle RPM | **2,075** |
| Cut Feed | **40 ipm** |
| Plunge Feed | **2 ipm** (very conservative — deliberate) |
| Stock to Leave | 0.004" |
| Bottom Z Offset | **−0.290"** (through-cut, breaks through bottom) |
| Clearance Offset | 0.400" |

---

#### Op 5 — Thread1 | **T2 — Thread Mill (0.100" dia, TiN)**
*Thread milling — 7 passes, conventional direction*

| Parameter | Value |
|-----------|-------|
| Strategy | Thread mill (conventional) |
| Spindle RPM | **5,000** |
| Ramp RPM | 5,000 |
| Cut Feed | **18 ipm** |
| Plunge Feed | 13.12 ipm |
| Radial Stepover | **0.002"** per pass |
| Thread Passes | **7** |
| Stock to Leave | 0.004" |
| Bottom Z Offset | **−0.170"** |
| Pitch | Per tool definition |
| Cutter Comp | Computer |

---

#### Op 6 — 2D Contour1 | **T9 — 1/4" Flat End Mill**
*Final finish contour — tight features, control-side compensation*

| Parameter | Value |
|-----------|-------|
| Strategy | 2D Contour (climb) |
| Spindle RPM | **5,000** |
| Ramp RPM | Per tool (expression) |
| Cut Feed | **10 ipm** |
| Plunge Feed | 13.12 ipm |
| Max Axial DOC | `FL × 0.75` → **0.284"** |
| Stock to Leave | **0.004"** |
| Tolerance | **0.0004"** |
| Bottom Z Offset | 0.000" |
| Ramp | Profile |
| Cutter Comp | **Control** (not computer) |

---

## Patterns & Gotchas

- **Ramp RPM spike on T7 adaptive (Op 1):** Ramp RPM is programmed at **5,000** while cutting RPM is **2,500** — the spindle doubles speed during helix entry. This is unusual; verify the insert mill's insert seating can handle 5k RPM before running.

- **Op 3 bottom Z offset = +0.045":** The 3/8" contour pass deliberately **does not cut to final floor depth** — it leaves 0.045" of material on the bottom. This is likely intentional clearance for a mating feature or to protect a surface finished elsewhere. Do NOT zero this out without understanding the part geometry.

- **Op 4 plunge feed = 2 ipm vs. 40 ipm cut feed:** The drill plunge is extremely conservative (5% of cut feed). This is likely due to the small diameter (0.116") and/or hard material. Do not increase without re-evaluating drill life.

- **Op 4 bottom Z offset = −0.290":** Drill breaks through by 0.290" — confirm this clears the fixture/vise jaw before running. Through-cut offset must be validated against actual stock thickness.

- **Cutter comp split — Computer (Op 3) vs. Control (Op 6):** Op 3 uses computer-side comp (toolpath already offset in CAM); Op 6 uses control-side comp (machine applies the offset at runtime). These are **not interchangeable** — Op 6 allows tool wear offset adjustment at the control without re-posting. Confirm the machine control supports cutter comp before running Op 6.

- **T9 spindle speed jumps from 3,000 RPM (Op 2 rough) to 5,000 RPM (Op 6 finish):** Same tool, different speeds. The finish pass runs 67% faster — appropriate for light finishing cuts but confirm the 1/4" end mill runout is acceptable at 5k before trusting the 0.0004" tolerance.

---

## How to Adapt This for a New Part

1. **Confirm material match.** Feeds/speeds are not labeled by material. If this was cut in aluminum, do not apply these feeds to steel without recalculating. The 2,500 RPM / 15 ipm on a 3/8" insert mill suggests **aluminum** (≈245 SFM) or soft steel.

2. **Re-evaluate T7 insert mill at 5,000 ramp RPM** for any new material — this is the most likely parameter to cause insert failure if the material changes.

3. **Op 3 bottom Z offset (+0.045")** is geometry-specific. Recompute or zero it out based on the new part's floor requirements.

4. **Op 4 drill depth (−0.290")** and **Op 5 thread depth (−0.170")** are feature-specific. Remap to new hole depths; maintain the conservative 2 ipm plunge on small drills.

5. **Op 5 thread pitch** is pulled from the tool definition — confirm T2 thread mill pitch matches the new thread spec before posting.

6. **Op 6 control comp** requires the machine control to have a valid tool radius offset register loaded. Add a setup note to the operator sheet.

7. **Optimal load values (0.030" on 3/8", 0.020" on 1/4")** are conservative (~8% dia). These are safe starting points for a new part but can be increased for aluminum if cycle time is a concern.

8. **Stock-to-leave convention:** 0.005" on roughs, 0.004" on finishes — maintain this split if adding operations to preserve the finishing allowance logic.