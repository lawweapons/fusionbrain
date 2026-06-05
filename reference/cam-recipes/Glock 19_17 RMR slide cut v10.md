# CAM Recipe: Glock 19/17 RMR Slide Cut v10

## Summary
This program machines an RMR (Trijicon RMR) optic cut into a Glock 19/17 pistol slide — a rectangular pocket with a floor, sidewall contour, and two 4-40 UNC threaded mounting holes. Material is not explicitly declared in the export but the specific cutting force value (1500 N/mm²) and conservative feeds/speeds are consistent with hardened steel (likely 17-4 PH or 416 stainless). Two setups with identical operation sequences are present — **Setup 1** uses a Fingersoll insert mill (T7 flat) and a Kenametal 1/4" end mill; **Setup 2 (VF4)** substitutes an Ingersoll 3/8" bull nose modular (T20) for the same pocket/contour ops and a different 1/4" flat end mill (T6). Both setups share the same drill (T8, #32) and thread mill (0.100" dia, 32 TPI). Program name: **41917**, comment: *G19/17 RMR .365 offset* (Setup 1) / *.365 breech offset* (Setup 2). Total: 2 setups, 11 operations (5 + 6, including 1 Manual NC pass-through).

---

## Tools Used

| Tool # | Description | Geometry | Typical Cut Feed | Used For |
|--------|-------------|----------|-----------------|----------|
| **T7** (Setup 1) | **"The Ripkey Ripper" 3/8" insert mill** (Fingersoll) | 0.375" dia, 4-flute, flat end mill, carbide, 0.300" FL, 0.675" SL | **15 ipm** (adaptive) / **8 ipm** (contour) | RMR pocket adaptive roughing + floor/wall contour |
| **T20** (Setup 2) | **3/8" BNM modular** (Ingersoll #5840004) | 0.375" dia, 4-flute, bull nose end mill, carbide, 0.031" CR, 0.270" FL | **15 ipm** (adaptive) / **8 ipm** (contour) | Same pocket adaptive roughing + contour (Setup 2 substitute) |
| **T8** | **#32 / 6-32 drill** | 0.116" dia, 2-flute, carbide, 118° tip, 1.090" FL | **2 ipm** (plunge/drill) | Pilot holes for 4-40 mounting screws |
| **T2** (Setup 1) | **32 TPI thread mill, 0.100" dia** | 0.100" dia, 3-flute, TiN coated, 0.787" FL, 0.03125" pitch | **7.5 ipm** | 4-40 UNC internal thread milling |
| **T7** (Setup 2) | **32 TPI thread mill, 0.100" dia** (Lakeshore Carbide) | 0.100" dia, 3-flute, TiN coated, 0.787" FL, 0.03125" pitch | **18 ipm** | 4-40 UNC internal thread milling (Setup 2) |
| **T9** (Setup 1) | **1/4" flat end mill** (Kenametal) | 0.250" dia, 5-flute, carbide, 0.750" FL | **10 ipm** | Final RMR pocket wall contour finish |
| **T6** (Setup 2) | **1/4" flat end mill** (no vendor listed) | 0.250" dia, 4-flute, carbide, 0.500" FL | **10 ipm** | Final RMR pocket wall contour finish (Setup 2) |

**Holders (all ops):** Maritool CAT40-ER32-2.35 (T7/T8/T2/T9); Maritool CAT40-ER32-1.85 (T9 Setup 1 only); T20 and T6 (Setup 2) have no holder attached in model.

---

## House Rules (Conventions Held Across Operations)

- **Spindle RPM:** **2,500 RPM** for all 3/8" milling ops (both setups). **2,075 RPM** for #32 drill. Thread mill spindle speed resolves to **5,000 RPM** (formula-driven for non-tap thread mills). Setup 2 T6 contour: **~4,584 RPM** (surface-speed driven at 300 SFM).
- **Plunge feed:** ~**13.12–13.33 ipm** across all milling tools (formula-derived, consistent). Drill plunge is a deliberate exception: **2 ipm** (very conservative for small carbide drill in hard steel).
- **Drill retract feed:** **100 ipm** (Setup 1) / **~39.4 ipm** (Setup 2) — rapid retract out of hole.
- **Coolant:** **Flood** on all operations, no exceptions.
- **Clearance height:** **+0.400" above stock top** (absolute ~15.24 mm) — consistent across all ops.
- **Retract height:** **+0.200" above stock top** (absolute ~5.08 mm) — consistent across all ops.
- **Safe Z (home):** **+5 mm above stock top**.
- **WCS origin:** Top-center of stock (box point), Z-X orientation mode.
- **Work offset:** G54 (WCS #1), program name **41917**.
- **Stock offsets:** 0.040" sides and top, 0.000" bottom — no bottom stock.
- **Ramp type:** Helix, **2°** ramp angle — universal across all milling ops.
- **Direction:** Climb milling on all adaptive and contour ops.
- **Tolerance:** **0.002"** on adaptive ops; **0.0004"** on contour/finish ops.
- **Stock to leave (radial/axial):** **0.005"** on adaptive roughing; **0.004"** on contour semi-finish passes; **0.000"** on final finish (no explicit finish-to-zero pass — the contour ops carry 0.004" stock to leave, meaning the walls are not cut to net in this program as documented).

---

## Setup-by-Setup

### Setup 1 — "Setup1"
**Stock:** Model-flush (no bottom offset), 0.040" sides/top. Part envelope: ~6.85" × 1.006" × 0.847" (170.8 × 25.6 × 21.5 mm). WCS: top-center of stock.

#### Operation Flow

**1. 2D Adaptive1** — *RMR pocket roughing*
- **Tool:** T7 — **3/8" Ripkey Ripper insert mill**
- **Strategy:** 2D Adaptive (trochoidal), climb
- **Spindle RPM:** 2,500 | **Cut feed:** 15 ipm | **Plunge feed:** ~13.12 ipm
- **Optimal load (radial WOC):** **0.030"** (8% of dia — very light engagement for insert mill in hard steel)
- **Max axial DOC:** `min(FL×0.75, dia×2.5)` = **0.225"** (FL-limited at 0.300" FL)
- **Bottom Z:** −0.121" (−3.073 mm absolute)
- **Stock to leave:** **0.005"** radial, **0.000"** axial
- **Ramp:** Helix, 2°
- **Lift height:** 0.005" (minimal lift for stay-down linking)

**2. 2D Contour25** — *RMR pocket wall semi-finish*
- **Tool:** T7 — **3/8" Ripkey Ripper insert mill**
- **Strategy:** 2D Contour, climb, left compensation (computer)
- **Spindle RPM:** 2,500 | **Cut feed:** 8 ipm | **Plunge feed:** ~13.12 ipm
- **Max axial DOC (stepdown):** **0.020"** | **Finishing stepdown:** 0.005"
- **Finishing stepovers:** 2 passes at 0.0375" (10% dia)
- **Bottom Z:** −0.076" (−1.930 mm absolute)
- **Stock to leave:** **0.004"** radial and axial
- **Lead-in:** 0.020" radius arc, 20° sweep, 0.020" linear
- **Ramp:** Profile ramp

**3. Drill1** — *4-40 tap drill (#32)*
- **Tool:** T8 — **#32 / 6-32 carbide drill, 0.116"**
- **Strategy:** Drilling cycle (standard)
- **Spindle RPM:** 2,075 | **Plunge feed:** **2 ipm** | **Retract feed:** 100 ipm
- **Bottom Z:** −0.270" (−6.858 mm absolute, from model top)
- **Cycle:** Standard drilling (no peck specified in cycle type)
- **Stock to leave:** 0.004"

**4. Thread1** — *4-40 UNC thread milling*
- **Tool:** T2 — **0.100" dia, 32 TPI thread mill (TiN coated)**
- **Strategy:** Thread milling, conventional direction
- **Spindle RPM:** 5,000 | **Cut feed:** 7.5 ipm | **Plunge feed:** ~13.12 ipm
- **Thread:** 4-40 UNC, Class 3B, right-hand, internal
- **Pitch:** 0.03125" (32 TPI)
- **Pitch diameter offset:** 0.023"
- **Number of stepovers:** 6 at **0.002"** each
- **Null (spring) pass:** Yes
- **Top Z:** +0.014" (+0.356 mm) | **Bottom Z:** −0.236" (−5.994 mm)
- **Stock to leave:** 0.004"

**5. 2D Contour1** — *RMR pocket final wall finish*
- **Tool:** T9 — **1/4" Kenametal flat end mill, 5-flute**
- **Strategy:** 2D Contour, climb, left compensation (**control** — cutter comp output to machine)
- **Spindle RPM:** 5,000 | **Cut feed:** 10 ipm | **Plunge feed:** ~13.33 ipm
- **Max axial DOC:** `FL×0.75` = **0.563"** (single depth pass — no multiple stepdowns set)
- **Finishing stepovers:** 2 passes at 0.025" (10% dia)
- **Bottom Z:** −0.121" (−3.073 mm absolute)
- **Stock to leave:** **0.004"** radial and axial
- **Lead-in:** 0" radius, 0.300" linear extension (straight plunge-in approach)
- **Ramp:** Profile ramp

---

### Setup 2 — "VF4"
**Stock/WCS:** Identical to Setup 1. Program comment: *G19/17 RMR, .365 breech offset*. Same 5-op sequence plus one Manual NC, with tool substitutions noted below.

#### Operation Flow

**1. 2D Adaptive1 (2)** — *RMR pocket roughing*
- **Tool:** T20 — **3/8" Ingersoll BNM modular bull nose, 0.031" CR**
- All parameters identical to Setup 1 Op 1 except: corner radius 0.031" (bull nose vs. sharp flat)
- **Spindle RPM:** 2,500 | **Cut feed:** 15 ipm | **Optimal load:** 0.030" | **Max DOC:** 0.203" (FL×0.75 at 0.270" FL)

**2. 2D Contour25 (2)** — *RMR pocket wall semi-finish*
- **Tool:** T20 — **3/8" Ingersoll BNM modular**
- **Spindle RPM:** 2,500 | **Cut feed:** 8 ipm | **Stepdown:** 0.020" | **Finishing stepdown:** 0.005"
- All other parameters identical to Setup 1 Op 2

**3. Drill1 (2)** — *4-40 tap drill*
- **Tool:** T8 — **#32 carbide drill** (same as Setup 1)
- **Spindle RPM:** 2,075 | **Plunge feed:** 2 ipm | **Retract feed:** ~39.4 ipm
- Bottom Z: −0.270" — identical to Setup 1

**4. Thread1 (2)** — *4-40 UNC thread milling*
- **Tool:** T7 (Setup 2 numbering) — **0.100" Lakeshore Carbide 32 TPI thread mill**
- **Spindle RPM:** 5,000 | **Cut feed:** **18 ipm** ← *increased from 7.5 ipm in Setup 1*
- **Pitch diameter offset:** **0.0245"** ← *slightly tighter than Setup 1's 0.023"*
- **Number of stepovers:** **7** at 0.002" ← *one more pass than Setup 1*
- **Compensation type:** **Control** (machine cutter comp) vs. Setup 1's Computer comp
- All other thread parameters identical

**5. 2D Contour1 (2)** — *RMR pocket final wall finish*
- **Tool:** T6 — **1/4" flat end mill, 4-flute** (shorter FL: 0.500" vs. 0.750")
- **Spindle RPM:** ~4,584 (300 SFM surface speed driven) | **Cut feed:** 10 ipm
- **Compensation type:** **Control** (machine cutter comp)
- **Max axial DOC:** `FL×0.75` = **0.375"**
- All other parameters identical to Setup 1 Op 5

**6. Manual NC1** — *Tool change pass-through*
- **Content:** `M06 T8;`
- No dwell. This is a bare pass-through block — likely a manual tool change call or a post-processor workaround.

---

## Patterns & Gotchas

- **Optimal load of 0.030" on a 3/8" tool = 8% radial engagement.** This is intentionally very conservative — consistent with hard steel (likely 400-series stainless or 17-4 PH slide). Do NOT scale this up to aluminum-style 30–40% engagement without re-evaluating the insert grade and spindle power.

- **The 2D Contour ops leave 0.004" stock to leave on both radial and axial walls.** There is no explicit zero-stock finishing pass in this program. The "final" 1/4" contour (Op 5) still carries 0.004" stock. If net-size walls are required, a dedicated zero-stock finish pass must be added or the stock-to-leave must be zeroed on Op 5.

- **Thread mill feed rate diverges significantly between setups:** Setup 1 uses **7.5 ipm** (conservative break-in), Setup 2 uses **18 ipm** (proven aggressive). The Setup 2 value also adds a 7th stepover pass and uses machine cutter comp instead of computer comp — this combination was the validated production setting. Do not use Setup 1 thread parameters as the reference for production.

- **Drill plunge at 2 ipm is intentionally slow** for a 0.116" carbide drill in hard steel. The retract feed (