# CAM Recipe: G43 barrel v10

## Summary
Two-setup program for a G43 pistol barrel (small, precision firearm component). Material and machine are **not specified in the export**, but the 12,000 RPM spindle speed and carbide tooling throughout are consistent with aluminum or similar non-ferrous alloy on a high-speed VMC or desktop CNC. Setup 1 machines primary features (slot, pocket, contour, chamfer/trace); Setup 2 flips the part and machines secondary features with a finish contour and chamfer. Total: **2 setups, 7 operations**, using only two tools — a 1/16" flat end mill and a 1/8" chamfer mill.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T40 | **1/16 EM** (Setup 1) | 0.0625" dia, 4-fl, flat, carbide, FL=0.19", CR=0.0" | 2.0–2.4 in/min | Slotting, adaptive roughing, contour finishing |
| T28 | **1/16 EM** (Setup 2) | 0.0625" dia, 4-fl, flat, carbide, FL=0.19", CR=0.0" | 2.5 in/min | Adaptive roughing, contour finishing |
| T4 | **1/8 CHMF** | 0.125" dia, 4-fl, 45° chamfer mill, carbide, FL=0.75" | 20–30 in/min | Trace chamfering (Setup 1), 2D chamfer (Setup 2) |

> Note: T40 and T28 appear to be the same physical tool geometry — the separate tool numbers likely reflect different tool length offsets or presetter measurements for each setup.

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on every operation, no exceptions.
- **Clearance height offset:** **0.4 in** above part — consistent across all 7 ops.
- **Retract height offset:** **0.2 in** above part — consistent across all 7 ops.
- **Cutter compensation:** Computer-side (not controller) where applied (Contour2, Contour3, Chamfer1).
- **Climb milling:** Specified on all adaptive ops.
- **Tolerance:** Tight ops (slot, contours, chamfers) use **0.0004 in**; adaptive roughing ops use **0.004 in** (10× looser — acceptable for roughing).
- **Ramp angle (helix):** **1°** on all adaptive ops — very shallow, appropriate for small-diameter end mills.
- **Stock to leave — finishing contours:** **0.004 in** radial (Contour2, Contour3).
- **Stock to leave — adaptive roughing:** **0.001 in** (leaves near-net for contour finish pass).
- **Stock to leave — chamfer ops:** **0.000 in** (cuts to final dimension).
- **Setup 1 spindle speed:** **12,000 RPM** for all ops including both tools.
- **Setup 2 spindle speed:** **~6,112 RPM** for the 1/16" EM ops (T28); **12,000 RPM** for the chamfer mill (T4). The ~6,112 RPM on T28 is a deliberate override — see Patterns & Gotchas.
- **Plunge feed (most ops):** **13.33 in/min** — this repeats across Setup 1 Op3/Op4 and all Setup 2 ops. The slot op (Setup 1 Op1) uses **2.4 in/min** plunge (matched to cut feed — conservative for slotting). The adaptive ops use ramp feed instead of direct plunge.

---

## Setup-by-Setup

### Setup 1

- **Stock mode:** Fixed tube (round bar/tube stock, dimensions auto-calculated from bounding box rounded up)
- **WCS offset mode:** Simple
- **Stock:** Bounding box of part geometry, ceiling-rounded

#### Operation Flow

**Op 1 — Slot1** `[slot]` — T40, 1/16" EM
> Opens the primary slot feature first, before adaptive clearing removes surrounding material.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **12,000** |
| Cut feed | **2.4 in/min** |
| Plunge feed | **2.4 in/min** (matched to cut feed) |
| Max axial DOC | **0.04 in** |
| Ramp type | Profile |
| Bottom Z offset | **−0.060 in** (cuts below nominal floor) |
| Tolerance | 0.0004 in |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

**Op 2 — 2D Adaptive1 (2)** `[adaptive2d]` — T40, 1/16" EM
> Adaptive roughing of pocket/profile area. Leaves 0.001 in for finish contour.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **12,000** |
| Cut feed | **2.0 in/min** |
| Plunge feed | **1.0 in/min** (reduced — most conservative plunge in program) |
| Ramp feed | **2.0 in/min** |
| Max axial DOC | min(FL × 0.75, dia × 2.5) = min(0.1425, 0.15625) → **~0.1425 in** |
| Optimal load (radial WOC) | **0.001 in** (extremely light — near-finishing load) |
| Ramp type | Helix, **1°** |
| Direction | Climb |
| Stock to leave | **0.001 in** |
| Bottom Z offset | **−0.020 in** |
| Tolerance | 0.004 in |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

**Op 3 — 2D Contour2** `[contour2d]` — T40, 1/16" EM
> Finish contour pass. Leaves 0.004 in stock (spring pass / final wall finish).

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **12,000** |
| Cut feed | **2.0 in/min** |
| Plunge feed | **13.33 in/min** |
| Max axial DOC | FL × 0.75 = **0.1425 in** |
| Ramp type | Profile |
| Stock to leave | **0.004 in** |
| Bottom Z offset | **−0.060 in** (matches slot floor) |
| Tolerance | 0.0004 in |
| Compensation | Computer |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

**Op 4 — Trace1** `[trace]` — T4, 1/8" Chamfer Mill
> Chamfer/edge-break along traced geometry. Two passes for clean chamfer.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **12,000** |
| Cut feed | **30.0 in/min** |
| Plunge feed | **13.33 in/min** |
| Max axial DOC | **0.04 in** |
| Stepover | dia × 0.5 = **0.0625 in** |
| Number of passes | **2** |
| Stock to leave | **0.004 in** |
| Tolerance | 0.0004 in |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

### Setup 2

- **Stock mode:** Default (inherits from Setup 1 result)
- **WCS offset mode:** Keep (preserves WCS from Setup 1 — part is re-fixtured, not re-zeroed from scratch)
- **Stock:** Bounding box ceiling-rounded

#### Operation Flow

**Op 1 — 2D Adaptive3** `[adaptive2d]` — T28, 1/16" EM
> Adaptive roughing of flip-side features. Note reduced RPM vs. Setup 1.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **~6,112 RPM** ⚠️ |
| Cut feed | **2.5 in/min** |
| Plunge feed | **13.33 in/min** |
| Ramp feed | **2.0 in/min** |
| Max axial DOC | min(FL × 0.75, dia × 2.5) → **~0.1425 in** |
| Optimal load (radial WOC) | **0.007 in** (7× heavier than Setup 1 adaptive — true roughing load) |
| Ramp type | Helix, **1°** |
| Direction | Climb |
| Stock to leave | **0.001 in** |
| Bottom Z offset | **0.000 in** |
| Tolerance | 0.004 in |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

**Op 2 — 2D Contour3** `[contour2d]` — T28, 1/16" EM
> Finish contour of flip-side profile. Same convention as Setup 1 contour.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **~6,112 RPM** ⚠️ |
| Cut feed | **2.5 in/min** |
| Plunge feed | **13.33 in/min** |
| Max axial DOC | FL × 0.75 = **0.1425 in** |
| Ramp type | Profile |
| Stock to leave | **0.004 in** |
| Bottom Z offset | **0.000 in** |
| Tolerance | 0.0004 in |
| Compensation | Computer |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

**Op 3 — 2D Chamfer1** `[chamfer2d]` — T4, 1/8" Chamfer Mill
> Final chamfer on flip-side edges. Zero stock to leave — cuts to final dimension.

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **12,000** |
| Cut feed | **20.0 in/min** |
| Plunge feed | **13.33 in/min** |
| Stock to leave | **0.000 in** |
| Bottom Z offset | **0.000 in** |
| Tolerance | 0.0004 in |
| Compensation | Computer |
| Clearance offset | 0.4 in |
| Retract offset | 0.2 in |

---

## Patterns & Gotchas

- **⚠️ Setup 2 RPM is ~6,112, not 12,000.** The 1/16" EM in Setup 2 (T28) runs at roughly half the speed of Setup 1 (T40). This is a deliberate override — likely driven by a different tool length, stick-out, or material condition on the flip side (thinner wall, less support). **Do not normalize to 12,000 RPM without understanding why this was changed.**

- **Setup 1 Op2 optimal load = 0.001 in on a 0.0625" tool.** This is 1.6% of tool diameter — essentially a finishing-style adaptive pass, not a roughing pass. This may be intentional for a very tight feature or thin wall. The Setup 2 adaptive uses 0.007 in (11.2% of dia), which is a more conventional roughing load. These are not interchangeable.

- **Bottom Z offsets are non-zero in Setup 1 and zero in Setup 2.** Setup 1 uses −0.060 in (slot, contour) and −0.020 in (adaptive) to cut below nominal floor — likely breaking through or clearing a feature. Setup 2 uses 0.000 in throughout. When adapting, verify which ops need through-cut offsets.

- **Trace op (Setup 1 Op4) uses 30 in/min cut feed; Chamfer op (Setup 2 Op3) uses 20 in/min.** Both use the same 1/8" chamfer mill at 12,000 RPM. The difference may reflect geometry complexity or edge accessibility. The trace op also leaves 0.004 in stock while the chamfer op leaves 0.000 in — the trace pass is not the final edge condition.

- **The 13.33 in/min plunge feed is a calculated value** (likely 800 IPM ÷ 60, or a post-processor artifact). It appears on all non-slotting plunge moves and is the program's standard "fast plunge" — but it is still a programmed value, not a rapid. Verify your machine's rapid-to-feed transition handles this correctly.

- **Stock-to-leave convention: 0.001 in rough → 0.004 in finish contour → 0.000 in chamfer.** The finish contour intentionally leaves 0.004 in on the wall (not zero). This is either a deliberate spring-pass allowance or a fit/dimension strategy for the barrel. **Do not change to 0.000 in without re-validating final dimensions.**

---

## How to Adapt This for a New Part

- [ ] **Confirm material match.** The 12,000 RPM / flood coolant / carbide combination is tuned for a specific material (likely aluminum or similar). If cutting steel or harder alloy, RPM and feed must be recomputed from scratch — do not reuse these values.
- [ ] **Confirm machine max RPM ≥ 12,000.** Both setups rely on 12,000 RPM for the chamfer mill. Verify spindle capability before posting.
- [ ] **Verify the ~6,112 RPM override reason** before applying Setup 2 parameters to a new part. If the reason was tool stick-out, replicate that condition or recalculate.
- [ ] **Map features to tools:** Slots/pockets/profiles → T40/T28 (1/16" EM); all chamfers/edge-breaks → T4 (1/8" 45° chamfer mill). This two-tool strategy works only if all features are accessible by 0.0625" dia.
- [ ] **Check bottom Z offsets** for any through-features. Setup 1's −0.060 in offsets are feature-specific; new geometry may require different values or none at all.
- [ ] **Optimal load values are feature-specific.** The 0.001 in load in Setup 1 Op2 is not a general roughing parameter — identify whether the new feature has the same thin-wall or tight-clearance constraint before copying it.
- [ ] **Retransfer directly:** Clearance/retract heights (0.4/0.2 in), coolant (flood), cutter comp (computer), ramp angle (1°), climb direction, and tolerance tiers (0.0004 finish / 0.004 rough) are all safe to carry forward as defaults.