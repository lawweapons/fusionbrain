# CAM Recipe: flashlight cap v29

## Summary
A small cylindrical flashlight cap machined in 3 setups (likely aluminum, based on tool descriptions and speeds — material not explicitly named in export). The part features adaptive-roughed pockets/profiles, flow-finished curved surfaces, a small slot, and chamfered edges. Stock is defined as a fixed cylinder in all setups. Total: 22 operations across 3 setups, progressing from bulk roughing → wall finishing → surface finishing → chamfering in each setup.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T26 | **1/2 AL ROUGHER** | 0.500" dia, 3-flute, flat EM, carbide, FL=1.27" | **100 ipm** | S1 bulk adaptive roughing |
| T29 | **1/4 al finish long** | 0.250" dia, 3-flute, flat EM, HSS, FL=1.30" | **60 ipm** | S1 contour wall finish |
| T27 | **1/4 AL ROUGH** (Lakeshore 160RFA14) | 0.250" dia, 3-flute, bull nose EM, carbide, CR=0.010", FL=0.80" | **50–100 ipm** | S1/S2/S3 adaptive roughing of pockets |
| T17 | **1/4in 6F R.030** | 0.250" dia, 6-flute, bull nose EM, carbide, CR=0.030", FL=0.75" | **100–200 ipm** | S1 adaptive + contour + flow surface finishing |
| T4 | **1/8 CHMF** | 0.125" dia, 4-flute, 45° chamfer mill, carbide, FL=0.125" | **60 ipm** | All setups chamfering |
| T30 | **1/8 EM** | 0.125" dia, 4-flute, flat EM, carbide, FL=0.375" | **30–40 ipm** | S2 small pocket adaptive + contour |
| T7 | **1/4 AL FINISH EM** | 0.250" dia, 2-flute, flat EM, HSS, FL=0.50" | **36 ipm** | S3 adaptive finish + contour |
| T40 | **1/16 em** | 0.0625" dia, 4-flute, flat EM, carbide, FL=0.25" | **9.6 ipm** | S3 slot |

---

## House Rules (Conventions Held Across Operations)

- **Spindle RPM: 12,000 RPM** on all tools except T17 (**~10,160 RPM** — a deliberate SFM-derived value, not a round number; do not override to 12k)
- **Coolant: flood** on every single operation, no exceptions
- **Clearance height offset: 0.4"** above part — consistent across all 22 ops
- **Retract height offset: 0.2"** above part — consistent across all 22 ops
- **Ramp type for adaptive ops: helix at 1°** ramp angle; contour ops use **profile** ramp
- **Plunge feed convention:** adaptive ops = **13.33 ipm** (= ~1/7.5 of cut feed, likely a formula-driven value); contour/chamfer ops vary (30–60 ipm); slot uses 13.33 ipm
- **Roughing tolerance: 0.004"**; finishing tolerance: **0.0004"** — a 10× tightening at finish ops
- **Climb milling** on all adaptive ops
- **Stock to leave on roughing passes: 0.010"** (most adaptive ops); finish contours target **0.004"** stock to leave (effectively a spring-pass allowance)
- **Bottom Z offset on most ops: 0"** — exceptions are deliberate (see Patterns & Gotchas)
- **Entry feed** resolves to cut feed for all non-probe tools (formula passthrough)

---

## Setup-by-Setup

### Setup 1 — Primary Side (13 ops)
**Stock:** Fixed cylinder, auto-sized to part bounding box (ceiling-rounded).  
**WCS offset mode:** Simple.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-----------|-------|
| 1 | **2D Adaptive1** — bulk rough | T26 1/2 AL ROUGHER | 12,000 | 100 ipm | 13.33 ipm | **0.600"** | **0.100"** | 0.010" | 0.004" | Bottom Z −0.030"; helix 1°; climb |
| 2 | **2D Contour1** — wall finish | T29 1/4 al finish long | 12,000 | 60 ipm | 30 ipm | 75% FL | — | 0.004" | 0.0004" | Bottom Z −0.030"; profile ramp; comp=computer |
| 3 | **2D Adaptive8** — pocket rough | T27 1/4 AL ROUGH | 12,000 | 100 ipm | 13.33 ipm | min(75%FL, 2.5D) | **0.050"** | 0.010" | 0.004" | Ramp feed 50 ipm; helix 1°; climb |
| 4 | **2D Adaptive3** — pocket rough | T17 1/4in 6F R.030 | **10,160** | 100 ipm | 13.33 ipm | min(75%FL, 2.5D) | **0.4×D = 0.100"** | 0.020" | 0.004" | Helix 1°; climb |
| 5 | **2D Contour3** — wall finish | T17 1/4in 6F R.030 | **10,160** | 100 ipm | 60 ipm | 75% FL | — | **−0.060"** | 0.0004" | **Negative stock = intentional overcut/press-fit feature**; profile ramp; comp=computer |
| 6 | **Flow1** — surface finish pass 1 | T17 1/4in 6F R.030 | **10,160** | 100 ipm | 13.33 ipm | — | — | 0.004" | 0.0004" | Stepover **0.005"**; both ways |
| 7–12 | **Flow1 (9),(2),(4),(5),(6),(7)** — surface finish passes 2–7 | T17 1/4in 6F R.030 | **10,160** | **200 ipm** | 13.33 ipm | — | — | 0.004" | 0.0004" | Stepover **0.005"**; both ways; feed doubled vs. Flow1 |
| 13 | **Trace1** — chamfer | T4 1/8 CHMF | 12,000 | 60 ipm | 50 ipm | 0.040" | — | 0.004" | 0.0004" | **2 thread passes**; stepover = 50% dia |

**Flow:** Bulk rough (large tool) → wall finish (long reach) → pocket rough (carbide bull) → pocket rough (6F bull, tighter load) → overcut contour → 7× flow surface finish passes → chamfer trace.

---

### Setup 2 — Second Side / Flip (4 ops)
**Stock:** Fixed cylinder, auto-sized.  
**WCS offset mode:** Simple.

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-----------|-------|
| 1 | **2D Adaptive5** — pocket rough | T27 1/4 AL ROUGH | 12,000 | **50 ipm** | 13.33 ipm | min(75%FL, 2.5D) | **0.020"** | 0.010" | 0.004" | Ramp feed 20 ipm; very tight load — confined pocket; helix 1° |
| 2 | **2D Adaptive7** — small pocket rough | T30 1/8 EM | 12,000 | 30 ipm | 13.33 ipm | **0.150"** | **0.100"** | 0.001" | 0.004" | Ramp feed 20 ipm; helix 1°; near-net stock leave |
| 3 | **2D Contour6** — wall finish | T30 1/8 EM | 12,000 | 40 ipm | 13.33 ipm | 75% FL | — | 0.004" | 0.0004" | Profile ramp; **comp=control** (not computer) |
| 4 | **2D Chamfer1** — chamfer | T4 1/8 CHMF | 12,000 | 60 ipm | 13.33 ipm | — | — | **0"** | 0.0004" | comp=computer; zero stock leave on chamfer |

**Flow:** Pocket rough (1/4") → small pocket rough (1/8") → 1/8" wall finish → chamfer.

---

### Setup 3 — Third Side / Features (5 ops)
**Stock:** Default mode (not fixed cylinder).  
**WCS offset mode:** Keep (preserves prior WCS — likely a soft-jaw or re-chuck setup).

| # | Operation | Tool | RPM | Cut Feed | Plunge | Max DOC | Optimal Load | Stock to Leave | Tolerance | Notes |
|---|-----------|------|-----|----------|--------|---------|--------------|----------------|-----------|-------|
| 1 | **2D Adaptive9** — rough | T27 1/4 AL ROUGH | 12,000 | 100 ipm | 13.33 ipm | min(75%FL, 2.5D) | **0.050"** | 0.010" | 0.004" | Ramp feed 50 ipm; helix 1° |
| 2 | **2D Adaptive9(2)** — finish adaptive | T7 1/4 AL FINISH EM | 12,000 | **36 ipm** | 13.33 ipm | min(75%FL, 2.5D) | **0.150"** | 0.005" | 0.004" | HSS 2-flute; high radial load (0.15" = 60%D) for finishing |
| 3 | **2D Contour7** — wall finish | T7 1/4 AL FINISH EM | 12,000 | 36 ipm | 13.33 ipm | 75% FL | — | 0.004" | 0.0004" | Profile ramp; comp=computer |
| 4 | **Slot3** — slot | T40 1/16 em | 12,000 | **9.6 ipm** | 13.33 ipm | **0.040"** | — | — | 0.0004" | Ramp feed 10 ipm; profile ramp; bottom Z **−0.020"** (through-cut) |
| 5 | **2D Contour8** — chamfer | T4 1/8 CHMF | 12,000 | 60 ipm | 13.33 ipm | 75% FL | — | 0.004" | 0.0004" | Profile ramp; comp=computer |

**Flow:** Rough → finish adaptive (HSS, low feed, high radial) → wall contour finish → tiny slot (through-cut) → chamfer.

---

## Patterns & Gotchas

- **T17 runs at ~10,160 RPM, not 12,000.** This is a computed SFM-based value for the 6-flute carbide bull nose — do not round up to 12k. The 6-flute geometry at 12k would likely over-chip-load or chatter on this small part.
- **Setup 1, Op 5 (2D Contour3) has stock-to-leave = −0.060".** This is an intentional **overcut** — almost certainly a press-fit bore or a feature requiring interference. Do not "correct" this to a positive value when adapting.
- **Flow pass 1 (Op 6) runs at 100 ipm; Flow passes 2–7 (Ops 7–12) run at 200 ipm.** The first pass is likely a full-depth scallop-clearing pass; subsequent passes are lighter cleanup at double feed. Both use identical 0.005" stepover and 0.004" stock-to-leave.
- **Setup 2, Op 3 uses comp=control** (not comp=computer like all other contour ops). This means cutter radius compensation is pushed to the machine controller — verify your controller handles this correctly before running; do not swap to computer comp without re-verifying the toolpath geometry.
- **Setup 2, Op 2 (1/8 EM adaptive) leaves only 0.001" stock** — this is essentially a near-net roughing pass, not a true rough. The 1/8" tool is likely finishing a small pocket in one shot.
- **Setup 3 uses stockMode=default and offsetMode=keep** — this is a re-chuck or soft-jaw op that intentionally preserves the WCS from a prior setup. Do not reset WCS for Setup 3; the program depends on the existing coordinate system being maintained.
- **The 1/16" slot (Setup 3, Op 4) has bottom Z offset = −0.020"** — a deliberate through-cut overrun. At 9.6 ipm and 0.040" DOC, this tool is running conservatively; do not increase DOC on a 1/16" carbide EM.

---

## How to Adapt This for a New Part

- [ ] **Confirm material is aluminum.** All speeds (12,000 RPM), feeds (100–200 ipm on 1/4" tools), and tool selections (HSS finish EMs, flood coolant) are tuned for aluminum. Recompute everything for any other material.
- [ ] **Confirm machine max RPM ≥ 12,000** and that spindle can sustain it under flood coolant.
- [ ] **Map features to tools:** Large open pockets → T26; medium pockets/profiles → T27 (rough) then T17 or T7 (finish); small pockets < 0.200" wide → T30; slots ≤ 0.100" wide → T40; all chamfers → T4.
- [ ] **Preserve the 0.004" roughing / 0.0004" finishing tolerance split** — this is a deliberate quality gate, not arbitrary.
- [ ] **Re-evaluate the −0.060" stock-to-leave on any bore/contour** — this is part-specific for a press/interference fit. Replace with your actual fit requirement.
- [ ] **Re-evaluate all bottom Z offsets** (−0.030" in S1 Op1/Op2; −0.020" in S3 Op4) — these are geometry-specific through-cut or face-cleanup values.
- [ ] **Do not reuse T17's 10,160 RPM blindly** — recalculate from your target SFM for the actual material and tool coating.
- [ ] **Setup 3 WCS (offsetMode=keep)** — if re-chucking on a new part, verify datum transfer method matches your fixturing; this is the most setup-