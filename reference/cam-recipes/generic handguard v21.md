# CAM Recipe: generic handguard v21

## Summary
A firearm handguard component machined in two setups (flip op), almost certainly aluminum given tool names, speeds, and Lakeshore Carbide tooling. Machine not specified in export. Each setup opens with a probing sequence to establish WCS, then runs a 2D adaptive roughing pass followed by 2D contour finishing passes. Total: 2 setups, 12 operations.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T1 | **6mm PROBE** | 0.236" dia, 0-flute, HSS, probe type | 40 in/min touch feed | WCS probing both setups |
| T7 | **1/4 AL FINISH EM** | 0.250" dia, 4-flute, flat end mill, HSS, 0.625" FL | 50–60 in/min | 2D contour finishing |
| T27 | **1/4 AL ROUGH** | 0.250" dia, 3-flute, bull nose (CR=0.010"), carbide, 0.800" FL — Lakeshore 160RFA14 | 100 in/min | 2D adaptive roughing |

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on all cutting operations (both tools, both setups)
- **Clearance height offset:** **0.4 in** above part on all milling ops
- **Retract height offset:** **0.2 in** on all milling ops; **2.0 in** on all probe ops
- **Cutter compensation:** Computer (not controller) on all contour ops
- **Direction:** Climb milling on all adaptive ops
- **Ramp type — adaptive:** Helix at **1°** ramp angle
- **Ramp type — contour:** Profile ramp
- **Tolerance — adaptive:** 0.004 in (roughing tolerance)
- **Tolerance — contour:** 0.0004 in (finishing tolerance, 10× tighter)
- **Probe touch feed:** 40 in/min; approach/entry: 120 in/min
- **Probe clearance:** 2.0 in; retract: 0.2 in
- **Max axial DOC — adaptive:** `min(FL × 0.75, dia × 2.5)` = min(0.600", 0.625") → **0.600"** effective cap
- **Max axial DOC — contour:** `FL × 0.75` → **0.469"** (T7) / **0.600"** (T27 in Op 5)
- **Setup 2 stock mode:** `previoussetup` — stock is inherited from Setup 1 simulation; no new stock definition

---

## Setup-by-Setup

### Setup 1 — Side 1

**Stock:** Auto-fit bounding box (default mode, rounded up). WCS: WCS2 (probed in-cycle).

| # | Operation | Tool | Spindle RPM | Cut Feed | Plunge Feed | Ramp Feed | Max Axial DOC | Optimal Load | Stock to Leave | Bottom Z Offset | Notes |
|---|-----------|------|-------------|----------|-------------|-----------|---------------|--------------|----------------|-----------------|-------|
| 1 | **Probe WCS2 (2)** | T1 6mm Probe | — | 40 in/min | 13.3 in/min (formula) | — | — | — | — | 0 mm | First probe cycle, establishes WCS2 |
| 2 | **Probe WCS2** | T1 6mm Probe | — | 40 in/min | 13.3 in/min (formula) | — | — | — | — | 0 mm | Second probe cycle, confirms WCS2 |
| 3 | **2D Adaptive1** | T27 1/4 AL ROUGH | **12,000** | **100 in/min** | **60 in/min** | 50 in/min | 0.600" | **0.070"** | **+0.005"** | **−0.050"** | Primary bulk roughing; bottom offset cuts 0.050" below nominal floor — likely clears a ledge or ensures full floor cleanup |
| 4 | **2D Adaptive1 (2)** | T27 1/4 AL ROUGH | **12,000** | **100 in/min** | **13.3 in/min** | 50 in/min | 0.600" | **0.060"** | **+0.005"** | 0" | Secondary roughing region; tighter optimal load (0.060") vs Op 3 — likely a tighter pocket or internal feature; plunge reduced to 13.3 in/min |
| 5 | **2D Contour1** | T27 1/4 AL ROUGH | **12,000** | **100 in/min** | **60 in/min** | 50 in/min | 0.600" | — | **+0.004"** | 0" | Roughing contour pass with T27 before finish tool; leaves 0.004" for finish |
| 6 | **2D Contour1 (2)** | T7 1/4 AL FINISH EM | **10,000** | **60 in/min** | **13.3 in/min** | = plunge | 0.469" | — | **+0.004"** | 0" | First finish contour pass |
| 7 | **2D Contour1 (3)** | T7 1/4 AL FINISH EM | **10,000** | **50 in/min** | **13.3 in/min** | = plunge | 0.469" | — | **+0.004"** | **−0.020"** | Finish contour with bottom offset −0.020" — cuts slightly below nominal; likely a through-feature or undercut cleanup |
| 8 | **2D Contour1 (4)** | T7 1/4 AL FINISH EM | **10,000** | **50 in/min** | **13.3 in/min** | = plunge | 0.469" | — | **−0.020"** | 0" | **Stock to leave = −0.020"** (negative = cuts 0.020" past nominal wall) — deliberate spring pass / interference fit cleanup |

---

### Setup 2 — Side 2 (Flip)

**Stock:** Inherited from Setup 1 (`previoussetup`). WCS: WCS3 (probed in-cycle). Offset mode: simple.

| # | Operation | Tool | Spindle RPM | Cut Feed | Plunge Feed | Ramp Feed | Max Axial DOC | Optimal Load | Stock to Leave | Bottom Z Offset | Notes |
|---|-----------|------|-------------|----------|-------------|-----------|---------------|--------------|----------------|-----------------|-------|
| 1 | **Probe WCS3 (2)** | T1 6mm Probe | — | 40 in/min | 13.3 in/min | — | — | — | — | 0 mm | First probe cycle, establishes WCS3 after flip |
| 2 | **Probe WCS3** | T1 6mm Probe | — | 40 in/min | 13.3 in/min | — | — | — | — | 0 mm | Second probe cycle, confirms WCS3 |
| 3 | **2D Adaptive2** | T27 1/4 AL ROUGH | **12,000** | **100 in/min** | **13.3 in/min** | 50 in/min | 0.600" | **0.040"** | **+0.005"** | 0" | Roughing side 2; notably tighter optimal load (0.040") than Setup 1 — likely less material or more delicate geometry on back side |
| 4 | **2D Contour2** | T7 1/4 AL FINISH EM | **10,000** | **50 in/min** | **13.3 in/min** | = plunge | 0.469" | — | **+0.004"** | 0" | Finish contour side 2; straightforward — no bottom offset or negative stock |

---

## Patterns & Gotchas

- **Op 3 (Setup 1) plunge = 60 in/min vs. 13.3 in/min everywhere else.** The 60 in/min plunge on the first adaptive op is a deliberate exception — likely entering into open stock where a helix ramp is unobstructed. All other adaptive and contour ops use the conservative **13.3 in/min** (≈ feedCutting/7.5). Do not copy the 60 in/min plunge into confined pockets.

- **Op 8 (Setup 1): Stock to leave = −0.020".** This is a negative stock-to-leave contour — the tool intentionally cuts 0.020" past the nominal wall. This is a spring pass or interference-fit feature. **Do not treat this as a standard finish pass** when adapting; verify the target dimension before reusing.

- **Op 7 (Setup 1): Bottom Z offset = −0.020".** Combined with Op 8's negative stock, Setup 1 has two separate "cut past nominal" operations targeting different axes (Z-floor and XY-wall). These are almost certainly for specific features (e.g., a slot that must clear a mating part). Confirm geometry before reusing either offset.

- **Op 3 (Setup 1) bottom Z offset = −0.050".** The roughing adaptive pass cuts 0.050" below the nominal floor. This is likely to ensure the floor is fully cleared before contouring, or to rough a step/ledge. The subsequent adaptive Op 4 has 0" bottom offset — they target different floor levels.

- **Optimal load steps down across adaptive ops: 0.070" → 0.060" → 0.040".** Each adaptive op uses a progressively tighter radial engagement. This is intentional — tighter geometry or less remaining stock in later ops. **Do not normalize these to a single value.**

- **T7 (finish EM) is HSS, not carbide.** At 10,000 RPM on a 0.250" tool, SFM ≈ 654 — aggressive for HSS but consistent with aluminum. If substituting a carbide finish EM, RPM could be increased, but verify the programmed feeds are still appropriate for the new tool's chip load.

- **Dual probing per setup (two probe ops in sequence).** Both setups run two probe cycles before cutting. This is likely probing two datums (e.g., X/Y bore + Z surface, or two bores for rotation correction). Do not collapse to a single probe op without understanding what each cycle is measuring.

---

## How to Adapt This for a New Part

- [ ] **Confirm material is aluminum.** All speeds (12k/10k RPM), feeds (100/60/50 in/min), and tool selections are aluminum-specific. For any other material, recompute entirely.
- [ ] **Confirm machine can reach 12,000 RPM** with adequate spindle power for a 0.250" 3-flute carbide tool at 100 in/min.
- [ ] **Verify Lakeshore 160RFA14 (T27) is in your tool library** or substitute a comparable 3-flute 0.250" carbide bull nose (CR=0.010") for aluminum. Keep the 0.800" flute length if using similar axial DOC.
- [ ] **Map adaptive optimal loads to your pocket geometry:** Use 0.070" (28% dia) for open roughing, 0.060" for semi-confined, 0.040" for tight/back-side features.
- [ ] **Review all bottom Z offsets before posting:** −0.050" (rough floor), −0.020" (finish floor), and −0.020" stock-to-leave are part-specific. Reset to 0" and re-apply only where your geometry requires it.
- [ ] **Preserve the dual-probe sequence** if your fixture has two datum features. If your fixture has only one datum, one probe op per setup is sufficient.
- [ ] **Setup 2 stock mode = `previoussetup`** — this requires Setup 1 to simulate cleanly. If running Setup 2 standalone (e.g., re-run after a crash), redefine stock manually.
- [ ] **Contour ramp = profile** on all finish passes — ensure your contour geometry has a valid lead-in point; profile ramp can fail on fully closed pockets without a pre-drilled entry.
- [ ] **T7 is HSS** — if your shop standardizes on carbide finish EMs, re-evaluate RPM and feed for the new tool before running.