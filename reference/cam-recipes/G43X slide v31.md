# CAM Recipe: G43X slide v31

## Summary
Small precision slide component (~0.866" × 0.847" cross-section) machined in 3 setups. Material and machine not specified in export, but the combination of flood coolant, carbide tooling, 12,000 RPM cap, and a 74° dovetail mill strongly suggests aluminum or similar non-ferrous alloy on a compact VMC. The overall strategy is: adaptive rough → contour finish → chamfer/trace detail, repeated per setup face, with a dedicated dovetail-milling sequence in Setup 2 for the slide feature.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cut Feed | Used For |
|--------|-------------|----------|-----------------|----------|
| T30 | **1/8" Flat EM** | 0.125" dia, 4-fl, 0.375" FL, carbide, square | 12–20 ipm | Primary adaptive roughing & contour finishing |
| T27 | **1/8" Flat EM** (alt offset) | 0.125" dia, 4-fl, 0.375" FL, carbide, square | 14.67 ipm | Contour finish in Setup 3 (separate T# from T30 — note deliberate split) |
| T40 | **1/16" Flat EM** | 0.0625" dia, 4-fl, 0.190" FL, carbide, square | 2.4–4.89 ipm | Small-feature adaptive roughing & contour finishing |
| T4 | **1/8" Chamfer Mill** | 0.125" dia, 4-fl, 45° taper, 0.75" FL, carbide | 20–30 ipm | Edge chamfering all setups |
| T14 | **1/16" Ball EM** (Kennametal 1257537) | 0.0625" dia, 4-fl, 0.15" FL, carbide, R=0.03125" | 2.0 ipm | Trace/engraving passes (2 thread passes each) |
| T29 | **74° Dovetail Mill** | 0.250"/0.249" dia, 4-fl, 16° taper, 0.15" FL, carbide | 0.6–1.5 ipm | Dovetail slot trace & contour (Setup 2 only) |

---

## House Rules (Conventions Held Across Operations)

- **Spindle RPM:** **12,000 RPM** is the standard for all tools except: T30 in Setup 1 Op 1 (**6,111 RPM** — deliberate override, see Patterns), and T29 dovetail (**~1,528–1,534 RPM** — geometry-driven low speed).
- **Plunge feed:** **13.333 ipm** universally across all ops and all tools — *except* T14 ball EM Trace ops where plunge = **2.0 ipm** (matches cut feed; very conservative for engraving).
- **Ramp type:** Adaptive ops use **helix ramp at 1°**; contour ops use **profile ramp**; trace ops have no ramp (direct plunge at reduced feed).
- **Ramp feed:** Set to `tool_feedPlunge` (= 13.333 ipm) for most ops; T40 Op 1 Setup 1 uses **10.0 ipm** ramp feed (explicit override).
- **Coolant:** **Flood** on every operation, no exceptions.
- **Clearance height offset:** **0.4"** above part — consistent across all ops/setups.
- **Retract height offset:** **0.2"** above part — consistent across all ops/setups.
- **Climb milling:** All adaptive ops specify **climb** direction.
- **Tolerance:** Adaptive roughing = **0.004"**; contour finishing and chamfer/trace = **0.0004"** (10× tighter).
- **Cutter compensation:** Contour and chamfer ops use **computer** compensation (no machine-side comp).
- **Stock to leave (adaptive rough):** **0.001"** radial (most ops); Setup 1 Op 1 uses **0.002"** (slightly more conservative first-op buffer).
- **Stock to leave (contour finish):** **0.004"** in most contour passes — *note: this is a semi-finish leave, not zero.*
- **Stock to leave (chamfer):** **0.000"** — chamfer cuts to net.
- **Max axial DOC (adaptive):** Formula-driven: `min(FL × 0.75, dia × 2.5)` — resolves to ~0.281" for 1/8" EM, ~0.143" for 1/16" EM.
- **Bottom Z offset:** **−0.020"** through-cut offset in Setup 1 adaptive/contour ops; **0.000"** in Setups 2 & 3 (Setup 1 is cutting through or to a floor that needs clearance).

---

## Setup-by-Setup

### Setup 1 — First Face
**Stock:** Solid body; Y = 0.866", Z = 0.847"; X auto-calculated from model extents. WCS offset mode: keep.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-------|
| 1 | **2D Adaptive rough** — primary pockets | **T30 1/8" EM** | **6,112** | **14.67 ipm** | 13.33 ipm | FL×0.75 or dia×2.5 | **0.010"** | 0.002" | Low RPM override; very tight 0.010" load for 1/8" tool; bottom Z −0.020" |
| 2 | **2D Adaptive rough** — small features | **T40 1/16" EM** | 12,000 | **2.4 ipm** | 13.33 ipm | FL×0.75 or dia×2.5 | **0.001"** | 0.001" | Ramp feed explicit 10 ipm; bottom Z −0.020" |
| 3 | **2D Contour semi-finish** | **T40 1/16" EM** | 12,000 | **4.89 ipm** | 13.33 ipm | FL×0.75 | — | 0.004" | Tol 0.0004"; profile ramp; bottom Z −0.020" |
| 4 | **2D Chamfer** | **T4 1/8" CHMF** | 12,000 | **30 ipm** | 13.33 ipm | — | — | 0.000" | Fastest feed in program; net cut |
| 5 | **Trace** — engraving/detail | **T14 1/16" BM** | 12,000 | **2.0 ipm** | **2.0 ipm** | 0.040" | — | 0.004" | 2 thread passes; stepover = dia×0.5; plunge = cut feed |

---

### Setup 2 — Second Face (Dovetail Side)
**Stock:** Solid body; Y = 0.866", Z = 0.847"; X auto-calculated. WCS offset mode: keep.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-------|
| 1 | **2D Adaptive rough** | **T30 1/8" EM** | 12,000 | **12.0 ipm** | 13.33 ipm | FL×0.75 or dia×2.5 | **0.015"** | 0.001" | Bottom Z = 0; standard setup |
| 2 | **2D Contour semi-finish** | **T30 1/8" EM** | 12,000 | **14.67 ipm** | 13.33 ipm | FL×0.75 | — | 0.004" | Tol 0.0004"; profile ramp |
| 3 | **Trace** — dovetail slot, pass 1 | **T29 74° Dovetail** | **1,528** | **0.6 ipm** | 13.33 ipm | 0.040" | — | 0.004" | Entry feed 5 ipm; 2 thread passes; extremely conservative |
| 4 | **Trace** — dovetail slot, pass 2 | **T29 74° Dovetail** | **1,528** | **1.5 ipm** | 13.33 ipm | 0.040" | — | 0.004" | Same tool, higher feed — likely a second depth or cleanup pass |
| 5 | **2D Contour** — dovetail finish | **T29 74° Dovetail** (0.249" dia) | **1,534** | **1.0 ipm** | 13.33 ipm | FL×0.75 | — | 0.004" | Dia programmed as 0.249" (−0.001" offset from nominal) — deliberate tool wear/fit compensation |

---

### Setup 3 — Third Face
**Stock:** Default mode (auto-fit from model extents); X/Y/Z all auto-calculated. WCS offset mode: keep.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-------|
| 1 | **2D Adaptive rough** — large features | **T30 1/8" EM** | 12,000 | **20.0 ipm** | 13.33 ipm | FL×0.75 or dia×2.5 | **0.020"** | 0.001" | Highest cut feed in program for this tool |
| 2 | **2D Contour semi-finish** — large features | **T27 1/8" EM** | 12,000 | **14.67 ipm** | 13.33 ipm | FL×0.75 | — | **0.001"** | T27 ≠ T30 — separate tool number; stock-to-leave 0.001" (tighter than other contours) |
| 3 | **2D Adaptive rough** — small features | **T40 1/16" EM** | 12,000 | **4.89 ipm** | 13.33 ipm | FL×0.75 or dia×2.5 | **0.005"** | 0.001" | |
| 4 | **2D Contour semi-finish** — small features | **T40 1/16" EM** | 12,000 | **4.89 ipm** | 13.33 ipm | FL×0.75 | — | 0.004" | Same feed as adaptive above |
| 5 | **2D Chamfer** | **T4 1/8" CHMF** | 12,000 | **20.0 ipm** | 13.33 ipm | — | — | 0.000" | 20 ipm vs. 30 ipm in Setup 1 — different chamfer geometry/depth |
| 6 | **Trace** — engraving/detail | **T14 1/16" BM** | 12,000 | **2.0 ipm** | **2.0 ipm** | 0.040" | — | 0.004" | Identical to Setup 1 Op 5; 2 thread passes |

---

## Patterns & Gotchas

- **Setup 1 Op 1 runs at 6,112 RPM** (not 12,000) with a very tight **0.010" optimal load** on the 1/8" EM. This is likely the first cut into raw stock on a potentially harder face or with a longer stick-out condition — do not blindly normalize to 12,000 RPM without understanding why this was dialed back.
- **Contour "finish" passes leave 0.004" stock** in most cases — this is a *semi-finish*, not a true finish pass. If your application requires a true net contour, add a zero-stock-to-leave finish pass. The exception is Setup 3 Op 2 (T27) which leaves only **0.001"**.
- **T27 and T30 are both 1/8" flat EMs with identical geometry but different tool numbers.** This is intentional — likely a separate physical tool reserved for the finish contour in Setup 3, possibly with a known offset or fresher edge. Do not consolidate to one tool number without verifying.
- **The dovetail tool is programmed at 0.249" diameter in Op 5 (Setup 2)** vs. 0.250" in Ops 3–4. This −0.001" diameter offset is a deliberate fit/clearance compensation for the dovetail slide fit — do not correct it to 0.250".
- **Dovetail feeds are extremely conservative** (0.6–1.5 ipm at 1,528 RPM). The plunge feed of 13.333 ipm is carried over from the house rule but is irrelevant — the trace strategy does not plunge into material. Verify entry moves are safe before running.
- **The 1/16" ball EM Trace ops set plunge = cut feed = 2.0 ipm** and use 2 thread passes. This is an engraving/marking operation, not a profiling pass. The **0.004" stock-to-leave** on trace ops means the ball is not cutting to net depth — intentional for marking without over-cutting.

---

## How to Adapt This for a New Part

- [ ] **Confirm material match.** All feeds/speeds are tuned for what appears to be aluminum. If cutting steel, brass, or plastic, recompute every feed and speed from scratch — do not reuse these values.
- [ ] **Confirm machine RPM limit.** 12,000 RPM is the ceiling used throughout. If your spindle tops out lower, recalculate feeds proportionally.
- [ ] **Verify dovetail angle.** The 74°/16° taper dovetail is part-specific. Confirm your slide geometry matches before reusing T29 parameters.
- [ ] **Check bottom Z offsets.** Setup 1 uses −0.020" through-cut offsets; Setups 2 & 3 use 0.000". Map these to your actual floor/through conditions — a wrong sign here cuts into a fixture.
- [ ] **T27 vs. T30 distinction.** If your tool crib uses one 1/8" EM for both roughing and finishing, consolidate — but re-verify the 0.001" stock-to-leave contour in Setup 3 Op 2 is achievable with a used tool.
- [ ] **Trace ops are part-marking features.** If your part has no engraving/marking requirement, suppress T14 ops entirely. If it does, confirm the Kennametal 1257537 geometry matches your feature depth.
- [ ] **Optimal load scaling:** Loads range from 0.001" (1/16" EM, 1.6% dia) to 0.020" (1/8" EM, 16% dia). These are conservative-to-moderate for aluminum adaptive. Scale proportionally if changing tool diameter.
- [ ] **Semi-finish stock convention:** Decide upfront whether your application needs a true net finish pass — if so, add a zero-stock contour op after each 0.004"-leave contour.