# CAM Recipe: flashlight heatsink v6

## Summary
Cylindrical flashlight heatsink machined from round stock (fixed-cylinder stock mode). Material is almost certainly **aluminum** (tool names explicitly say "AL FINISH" / "AL ROUGH"; 12,000 RPM spindle throughout). Single setup, 8 operations: face → drill → two adaptive roughing passes → two contour finish passes → one adaptive finish pass → chamfer. Machine not specified in export.

---

## Tools Used

| T# | Description | Geometry | Cutting Feed | Used For |
|----|-------------|----------|-------------|----------|
| **T7** | **1/4 AL FINISH EM** | 0.250″ dia, 0-CR, 2-flute, flat end mill, HSS, 0.5″ FL | 50 in/min (36 in/min for one contour) | Face, finish contours, finish adaptive |
| **T45** | **#24 Drill** | 0.152″ dia, 2-flute, HSS, 1.4″ FL | 40 in/min | Drilling |
| **T27** | **1/4 AL ROUGH** (Lakeshore Carbide 160RFA14) | 0.250″ dia, 0.010″ CR, 3-flute, bull nose, carbide, 0.8″ FL | 100 in/min | Adaptive roughing |
| **T18** | **1/4 CHMF** | 0.250″ dia, 45° chamfer mill, 2-flute, HSS, 0.75″ FL | 60 in/min | Chamfering |

---

## House Rules (Conventions Held Across Operations)

- **Spindle RPM: 12,000** on all ops except the drill (5,277 RPM). This is an aluminum-specific speed — do not transfer to steel/titanium.
- **Coolant: Flood** on every operation.
- **Clearance height offset: 0.4″** on all ops.
- **Retract height offset: 0.2″** on all ops.
- **WCS offset mode: simple.**
- **Stock mode: fixed cylinder** — stock dimensions auto-rounded up from part bounding box.
- **Climb milling** used on all adaptive ops.
- **Ramp type: helix at 1°** for all adaptive ops; **profile ramp** for all contour ops.
- **Plunge feed convention:** adaptive roughing uses ~13.3 in/min (≈13% of cut feed); finish contours and chamfer use 50–60 in/min (matching or near cut feed); drill plunge is 15.8 in/min.
- **Tolerance:** tight ops (face, contours, chamfer) = **0.0004″**; adaptive ops = **0.004″** (10× looser — expected for roughing/semi-finish).
- **Computer cutter compensation** applied on all contour and chamfer ops.

---

## Setup-by-Setup

### Setup 1 — Single Setup (Top-Down, Cylindrical Stock)

**Stock:** Fixed cylinder, dimensions auto-computed from part bounding box (rounded up). Offset mode: simple.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Stepover / Opt. Load | Stock to Leave | Bottom Z Offset | Notes |
|---|-----------|------|-----|----------|--------|---------|----------------------|----------------|-----------------|-------|
| 1 | **Face1** (face) | T7 – 1/4 AL FINISH EM | 12,000 | 50 in/min | 50 in/min | **0.040″** | 70% of effective dia | 0″ | 0″ | Both-ways direction; opens the face |
| 2 | **Drill1** (drill) | T45 – #24 Drill | 5,277 | 40 in/min | 15.8 in/min | — | — | **0.004″** | 0″ | Only op not at 12k RPM; leaves 0.004″ stock |
| 3 | **2D Adaptive1** (adaptive2d) | T27 – 1/4 AL ROUGH | 12,000 | 100 in/min | 13.3 in/min | 0.75× FL or 2.5× dia | **Opt. load 0.050″** (20% dia) | **0.010″** | **−0.100″** | First roughing region; bottom offset cuts 0.1″ below nominal — likely clears a shoulder/step |
| 4 | **2D Adaptive2** (adaptive2d) | T27 – 1/4 AL ROUGH | 12,000 | 100 in/min | 13.3 in/min | 0.75× FL or 2.5× dia | **Opt. load 0.050″** (20% dia) | **0.010″** | 0″ | Second roughing region; ramp feed bumped to 70 in/min vs. 50 in/min in Op 3 |
| 5 | **2D Contour1** (contour2d) | T7 – 1/4 AL FINISH EM | 12,000 | 50 in/min | 13.3 in/min | 0.75× FL | — | **0.004″** | **−0.100″** | Finish contour matching Op 3 region; still leaves 0.004″; bottom offset matches Op 3 |
| 6 | **2D Adaptive2 (2)** (adaptive2d) | T7 – 1/4 AL FINISH EM | 12,000 | 50 in/min | 30 in/min | 0.75× FL or 2.5× dia | **Opt. load 0.170″** (68% dia) | **0.010″** | 0″ | Finish tool used in adaptive mode — large opt. load clears remaining 0.010″ stock efficiently |
| 7 | **2D Contour1 (2)** (contour2d) | T7 – 1/4 AL FINISH EM | 12,000 | **36 in/min** | 50 in/min | 0.75× FL | — | **0.004″** | 0″ | Final wall finish; feed deliberately reduced to 36 in/min — only deliberate feed override in program |
| 8 | **2D Chamfer1** (chamfer2d) | T18 – 1/4 CHMF | 12,000 | 60 in/min | 60 in/min | — | — | 0″ | 0″ | Deburr/chamfer; plunge = cut feed (no ramp needed for chamfer entry) |

---

## Patterns & Gotchas

- **The −0.100″ bottom Z offset on Ops 3 & 5 is intentional.** The adaptive rough and its paired contour finish both push 0.100″ below the nominal floor — this likely breaks through a shoulder, undercut, or ensures full cleanup of a step feature. Do **not** zero this out on a new part without understanding the geometry.
- **Op 6 uses the finish tool (T7) in adaptive mode with 0.170″ optimal load (68% of diameter).** This is a deliberate semi-finish/cleanup pass, not a true adaptive rough. The large engagement is safe here only because Op 3/4 already left just 0.010″ stock. Do not apply this load to a fresh-stock adaptive.
- **Op 7 feed is 36 in/min vs. 50 in/min everywhere else for T7.** This is the only deliberate feed reduction in the program — used on the final wall contour, suggesting a tighter surface finish requirement or a thin-wall concern on that feature.
- **Drill Op 2 leaves 0.004″ stock radially.** This is unusual for a drill — it may be a pilot hole intended for a subsequent reaming or tapping operation not present in this program, or it's a Fusion artifact from the stock-to-leave field being populated. Verify intent before running.
- **All adaptive ops use 1° helix ramp angle.** This is very shallow — appropriate for aluminum but means longer ramp paths. Do not increase ramp angle without checking flute length clearance.
- **12,000 RPM is aluminum-specific.** T7 and T18 are HSS — 12k RPM on HSS is only viable in aluminum. If material changes, recalculate SFM and reduce RPM accordingly before running.

---

## How to Adapt This for a New Part

- [ ] **Confirm material is aluminum.** All speeds/feeds are tuned for aluminum. Any other material requires full recalculation.
- [ ] **Confirm machine can reach 12,000 RPM** with adequate spindle power at that speed.
- [ ] **Verify stock is cylindrical.** Program uses fixed-cylinder stock mode. Prismatic stock requires setup change.
- [ ] **Check the −0.100″ bottom Z offsets (Ops 3 & 5)** against new part geometry — do not carry over blindly.
- [ ] **T27 (Lakeshore 160RFA14) is a specific carbide tool.** If substituting, match: 0.250″ dia, 0.010″ corner radius, 3-flute, 0.8″ FL minimum. Recheck optimal load (currently 0.050″ / 20% dia).
- [ ] **Op 6 adaptive load (0.170″) assumes ≤0.010″ remaining stock.** If roughing stock-to-leave changes, recalculate this load.
- [ ] **Op 7 feed (36 in/min) may be feature-specific** — evaluate whether the new part's wall has the same finish requirement or thin-wall concern before inheriting it.
- [ ] **Drill T45 (#24 / 0.152″)** maps to a specific hole size. Any new hole diameter requires a new drill selection and RPM recalculation.
- [ ] **Tolerance split (0.0004″ finish / 0.004″ rough) is a good convention to preserve** — carry it forward to new ops of the same type.
- [ ] **Flood coolant assumed available.** If running dry or mist, reduce feeds and verify chip evacuation, especially on the drill.