# CAM Recipe: P365 Swampfox Sentinel (shield rmsc, romeo zero) v14

## Summary
Single-setup milling program for a Sig P365 optic mounting plate/adapter — specifically a Swampfox Sentinel footprint adapter compatible with Shield RMSC and Romeo Zero red dot sights. Material and machine are **not specified in export**, but tooling (carbide insert mill, small-diameter end mills, 6-32 thread mill) is consistent with aluminum or steel pistol slide work. One setup, six operations: adaptive roughing → finish contouring → drilling → thread milling.

---

## Tools Used

| T# | Description | Dia | Flutes | Type | Material | Cutting Feed | Used For |
|----|-------------|-----|--------|------|----------|-------------|----------|
| T7 | **The Ripkey Ripper (TM) 3/8" insert mill** | 0.375 in | 4 | Flat end mill | Carbide | 15 in/min (rough), 8 in/min (finish) | Bulk adaptive roughing, semi-finish contour |
| T9 | **1/4 Flat End Mill** (Kennametal) | 0.250 in | 4 | Flat end mill | Carbide | 8–10 in/min | Fine adaptive clearing, finish contour |
| T8 | **6/32 Drill** | 0.116 in | 2 | Drill | Carbide | 40 in/min (programmed), 2 in/min plunge | Mounting hole drilling |
| T2 | **Thread Mill** (unnamed) | 0.100 in | 3 | Thread mill | TiN coated | 18 in/min | 6-32 thread milling |

---

## House Rules (Conventions Held Across Operations)

- **Coolant:** Flood on every operation — no exceptions.
- **Clearance height offset:** **0.4 in** above part on all 6 ops.
- **Retract height offset:** **0.2 in** above part on all 6 ops.
- **Stock to leave:** **0.005 in** on roughing ops (Ops 1–2); **0.004 in** on finishing/drilling/threading ops (Ops 3–6). The 0.001 in difference is intentional — finishing ops take a slightly tighter leave.
- **Climb milling** is the default for all milling ops; **Op 5 (thread mill) is conventional** — deliberate, do not change.
- **Cutter compensation:** Op 3 uses **computer** comp; Op 6 uses **control** comp — these differ intentionally (see Patterns & Gotchas).
- **Ramp type:** Helix ramp on adaptive ops (Ops 1–2); profile ramp on contour ops (Ops 3, 6); drill Op 4 plunges direct.
- **Ramp angle:** 0° specified on helix ramps (Ops 1–2, 5) — Fusion interprets this as default/auto helix angle.
- **Bottom Z offset:** Varies per op — see per-op detail. Not a fixed convention; each is deliberate.
- **Tolerance:** Roughing = **0.002 in**; finishing contours = **0.0004 in** (5× tighter).

---

## Setup-by-Setup

### Setup 1 — Setup1

**Stock:** Auto-sized from model bounding box (default mode, rounded up to nearest rounding increment). No fixed offset specified — stock wraps model extents.
**WCS:** Not explicitly named; offset mode = `keep` (preserves existing WCS from model).

---

#### Op 1 — 2D Adaptive1 *(Bulk Roughing — Large Features)*
**Strategy:** 2D Adaptive Clearing
**Tool:** T7 — **3/8" Ripkey Ripper insert mill**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **2,500** |
| Ramp RPM | **5,000** (doubled for entry) |
| Cut Feed | **15 in/min** |
| Plunge Feed | **13.12 in/min** |
| Ramp Feed | **13.12 in/min** |
| Max Axial DOC | `min(flute_length × 0.75, dia × 2.5)` → ~**0.225 in** (0.75 × 0.3 in FL) |
| Optimal Load (radial) | **0.030 in** (8% of dia — very light, insert mill protection) |
| Stock to Leave | **0.005 in** |
| Tolerance | **0.002 in** |
| Ramp Type | Helix, 0° angle |
| Direction | Climb |
| Bottom Z Offset | **0 in** |

---

#### Op 2 — 2D Adaptive3 *(Fine Roughing — Small/Tight Features)*
**Strategy:** 2D Adaptive Clearing
**Tool:** T9 — **1/4" Flat End Mill**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **3,000** |
| Ramp RPM | **3,000** (same as cut) |
| Cut Feed | **8 in/min** |
| Plunge Feed | **5 in/min** |
| Ramp Feed | = Plunge feed |
| Max Axial DOC | `min(FL × 0.75, dia × 2.5)` → ~**0.284 in** (0.75 × 0.378 in FL) |
| Optimal Load (radial) | **0.020 in** (8% of dia) |
| Stock to Leave | **0.005 in** |
| Tolerance | **0.002 in** |
| Ramp Type | Helix, 0° angle |
| Direction | Climb |
| Bottom Z Offset | **0 in** |

---

#### Op 3 — 2D Contour25 *(Semi-Finish / Precision Wall Contour)*
**Strategy:** 2D Contour
**Tool:** T7 — **3/8" Ripkey Ripper insert mill**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **2,500** |
| Ramp RPM | **2,500** |
| Cut Feed | **8 in/min** |
| Plunge Feed | **13.12 in/min** |
| Entry Feed | **8 in/min** |
| Max Axial DOC | **0.020 in** (very shallow — finish skim passes) |
| Stock to Leave | **0.004 in** |
| Tolerance | **0.0004 in** |
| Ramp Type | Profile |
| Cutter Comp | **Computer** |
| Bottom Z Offset | **+0.045 in** (intentionally above true bottom — does NOT cut to floor) |
| Direction | Climb |

> ⚠️ The **+0.045 in bottom Z offset** means this contour stops 0.045 in above the pocket floor. This is deliberate — likely leaving the floor for a separate op or protecting a feature below.

---

#### Op 4 — Drill1 *(Mounting Hole Drilling)*
**Strategy:** Drill cycle
**Tool:** T8 — **6/32 Drill (0.116 in dia)**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **2,075** |
| Cut Feed | **40 in/min** (programmed — likely a Fusion default passthrough; see Gotchas) |
| Plunge Feed | **2 in/min** |
| Stock to Leave | **0.004 in** |
| Bottom Z Offset | **−0.290 in** (through-cut: extends 0.29 in below nominal bottom) |
| Coolant | Flood |

> ⚠️ The **40 in/min cut feed** on a 0.116 in drill is almost certainly a Fusion formula default, not an intentional feed. The **2 in/min plunge** is the operative drilling feed. Verify before running.

---

#### Op 5 — Thread1 *(6-32 Thread Milling)*
**Strategy:** Thread Mill
**Tool:** T2 — **Thread Mill, 0.100 in dia, TiN coated**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **5,000** |
| Ramp RPM | **5,000** |
| Cut Feed | **18 in/min** |
| Plunge Feed | **13.12 in/min** |
| Entry Feed | **39.37 in/min** (~1,000 mm/min — Fusion unit conversion artifact) |
| Stepover | **0.002 in** per pass |
| Thread Passes | **7** |
| Stock to Leave | **0.004 in** |
| Direction | **Conventional** |
| Bottom Z Offset | **−0.170 in** (thread extends 0.17 in below nominal) |
| Cutter Comp | Computer |
| Pitch | Per tool definition |

---

#### Op 6 — 2D Contour1 *(Final Finish Contour)*
**Strategy:** 2D Contour
**Tool:** T9 — **1/4" Flat End Mill**

| Parameter | Value |
|-----------|-------|
| Spindle RPM | **5,000** |
| Ramp RPM | = Spindle RPM |
| Cut Feed | **10 in/min** |
| Plunge Feed | **13.12 in/min** |
| Max Axial DOC | `FL × 0.75` → ~**0.284 in** |
| Stock to Leave | **0.004 in** |
| Tolerance | **0.0004 in** |
| Ramp Type | Profile |
| Cutter Comp | **Control** |
| Bottom Z Offset | **0 in** (cuts to true floor) |
| Direction | Climb |

---

## Patterns & Gotchas

- **Op 1 ramp RPM doubles to 5,000 during helix entry** while cutting RPM stays at 2,500. This is an insert mill protection strategy — the insert mill enters fast and light, then slows for cutting. Do not normalize these to the same value.

- **Op 3 bottom Z offset = +0.045 in is a deliberate floor avoidance.** The 3/8" insert mill is being used only to clean walls, not the floor. If you move this to 0, you risk the insert mill dragging across a precision floor surface. Op 6 (1/4" end mill) handles the floor finish.

- **Op 4 drill "cut feed" of 40 in/min is a Fusion formula passthrough default**, not a real programmed feed. The actual drilling feed is the **2 in/min plunge feed**. Any post-processor that uses `tool_feedCutting` for the drill cycle will output 40 in/min — verify your post handles drill cycles correctly.

- **Op 5 thread mill runs conventional direction** — all other milling ops are climb. This is standard practice for thread milling to control thread geometry and tool deflection. Do not switch to climb without re-validating thread fit.

- **Op 3 uses computer compensation; Op 6 uses control compensation.** Op 3 (insert mill, semi-finish) offloads comp to CAM for a clean toolpath. Op 6 (finish contour, 1/4" EM) uses control comp, meaning the machine applies the radius offset at runtime — allows diameter wear compensation at the controller without re-posting.

- **The 0.030 in optimal load on the 3/8" insert mill (Op 1) is only 8% of diameter** — extremely conservative. This is likely driven by the insert mill's geometry or the workpiece material hardness. Do not increase this without knowing the material; insert mills in steel require very different parameters than aluminum.

---

## How to Adapt This for a New Part

- [ ] **Confirm material match.** The conservative optimal loads (8% dia) and moderate RPMs suggest steel or hard aluminum. If running 6061 aluminum, optimal load can likely increase to 20–35% dia and RPMs can increase significantly.
- [ ] **Confirm machine rigidity** before increasing Op 1 optimal load — insert mills are sensitive to chatter at low radial engagement.
- [ ] **T7 (3/8" insert mill)** maps to: large open pocket roughing, wall semi-finishing where floor contact must be avoided.
- [ ] **T9 (1/4" EM)** maps to: tight-clearance adaptive clearing, final finish contours to floor, any feature the 3/8" can't reach.
- [ ] **T8 + T2 pair** maps to: any 6-32 tapped hole. Drill first with T8 (bottom Z −0.290 in for through or adjust for blind), thread mill with T2 (7 passes, 0.002 in stepover).
- [ ] **Bottom Z offsets must be recomputed** for every new part — these are geometry-specific, not transferable.
- [ ] **Op 3 +0.045 in floor avoidance** — re-evaluate whether your new part needs this or if the insert mill can safely reach the floor.
- [ ] **Op 6 control comp** — verify your controller supports cutter comp and that the tool diameter offset register is set correctly before running.
- [ ] **Tolerances:** Roughing at 0.002 in, finishing at 0.0004 in — these are appropriate for precision fit parts (optic mounting). Do not loosen finishing tolerance if dimensional fit to optic footprint is critical.