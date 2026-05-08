# CAM Template: OP 1 2 3 Flashlight Cap v5

A canonical, working three-setup CAM program for Robert's flashlight cap part. Captured from a live, validated Fusion document via Fusion MCP. This template is the reference for what "good" looks like when programming similar 6061-aluminum, AR15-family parts on the **Haas VF-2** (`VF2SSYT` tool library).

When asked to help with CAM for a new part of similar character (small AL part, multi-setup, mixed roughing + finishing + chamfer), use this as the reference for:
- Tool selections
- Spindle / feed / plunge / ramp values per tool
- Pass parameters per strategy (tolerance, stock-to-leave, optimal load, stepover, ramp type)
- Heights conventions (clearance / retract / feed / top / bottom)
- Linking conventions (retraction policy, stay-down)

---

## Document context

| | |
|---|---|
| Source document | OP 1 2 3 Flashlight Cap v5 |
| Project | AR15 / Flashlight 2.0 |
| Material | 6061-T6 aluminum (assumed from family) |
| Machine | Haas VF-2 |
| Tool library | `cloud://VF2SSYT` |
| Setups | 3 (Op1, OP21, OP3) |
| Operations | 19 total |

---

## Universal house rules (held across all 19 operations unless noted)

| Field | Value | Notes |
|---|---|---|
| Spindle speed | **12,000 RPM** | Max VF-2; flat-out for every op |
| Plunge feed | **13.33 IPM** | Fusion's stored default ratio (≈1/10 of cutting feed at 140 IPM); overridden on slot, chamfer, certain finishing contours |
| Coolant | **flood** | Every op |
| Clearance height | **0.4"** from retract height | |
| Retract height | **0.2"** from stock top | Slot exception: 0.3" |
| Feed height | **0.2"** from top | |
| Top height | from stock top @ 0" | Some ops use "from point" instead |
| Stock offsets | **0.04" sides + 0.04" top + 0" bottom** | Every setup |
| WCS orientation | **axesZX** | Every setup |

### Strategy-default rules

| Strategy | Tolerance | Stock to leave | Direction | Ramp type |
|---|---|---|---|---|
| `face` | 0.0004" | (n/a) | both ways | (n/a) |
| `adaptive2d` (rough) | **0.004"** | 0.01–0.015" | climb | helix |
| `adaptive2d` (finish-style) | 0.004" | 0.015" | climb | helix |
| `contour2d` (finish) | **0.0004"** | 0.004" | (n/a) | profile |
| `contour2d` (bulk leave) | 0.0004" | 0.05" | (n/a) | profile |
| `slot` | 0.0004" | (n/a) | (n/a) | profile |
| `chamfer2d` | 0.0004" | **0**" | (n/a) | profile |

### Heights for through-cuts

When the operation cuts through-features or to a defined Z bottom, the bottom-height offset is set **−0.020"** to ensure clean breakthrough (used in Op1 / 2-3-4 of this template).

### Linking — adaptive defaults

```
retractionPolicy: 'full'
stayDownLevel:    'level0'
```

---

## Tool inventory used (5 distinct tools)

| T# | Description | Geometry | Material | Cutting feed (typical) | Used for |
|---|---|---|---|---|---|
| **T5** | 1/8 CHMF | 1/8" 4-flute chamfer mill, 0.75" flute | Carbide | 48 IPM | Chamfering small features |
| **T14** | 1/4 al rough | 1/4" 3-flute flat EM, 0.75" flute | Carbide | 80 IPM | Adaptive roughing of medium pockets |
| **T18** | 1/4 chmf | 1/4" 2-flute chamfer mill, 45°, 0.75" flute | HSS | 40 IPM | Chamfering larger edges |
| **T23** | 1/4 AL FINISH EM | 1/4" 4-flute flat EM, 0.5" flute | HSS | 30–67 IPM (depends on op) | Most finishing — face, contour, slot |
| **T26** | 1/2 AL ROUGHER | 1/2" 3-flute flat EM, 1.27" flute | Carbide | 140 IPM | All facing + Op1 large adaptive |

---

## Per-tool feed/speed recipes

These are the actual values from this program, validated. When programming a new similar part with one of these tools, default to these.

### T26 · 1/2 AL ROUGHER (carbide)
- **Face**: 12000 RPM, 140 IPM cut, 13.33 IPM plunge, 100 IPM ramp, 0.04" DOC
- **Adaptive 2D**: 12000 RPM, 140 IPM cut, 13.33 IPM plunge, 100 IPM ramp, optimal load 0.1", stock to leave 0.015"

### T14 · 1/4 al rough (carbide)
- **Adaptive 2D**: 12000 RPM, 80 IPM cut, 13.33 IPM plunge, 100 IPM ramp, optimal load 0.05", stock to leave 0.01"

### T23 · 1/4 AL FINISH EM (HSS)
- **Adaptive 2D (finish-style)**: 12000 RPM, 50 IPM cut, 13.33 plunge, =plunge ramp, optimal load 0.01", stock to leave 0.015"
- **Contour 2D (finish)**: 12000 RPM, 50 IPM cut, 13.33 plunge, =plunge ramp, stock to leave 0.004", stepover 0.005"
- **Contour 2D (bulk-leave)**: 12000 RPM, 50 IPM cut, 40 IPM plunge, =plunge ramp, stock to leave 0.05", stepover 0.1"
- **Face**: 12000 RPM, 67.2 IPM cut, 13.33 plunge, =plunge ramp, 0.04" DOC, both ways
- **Slot**: 12000 RPM, 30 IPM cut, 13.33 plunge, **30 IPM ramp**, 0.04" DOC, stepover dia/2 = 0.125", retract 0.3"

### T18 · 1/4 chmf (HSS, 45° taper)
- **Contour 2D (chamfer)**: 12000 RPM, 40 IPM cut, 13.33 plunge, =plunge ramp, stock to leave 0.004", stepover 0.030"

### T5 · 1/8 CHMF (carbide, 4-flute)
- **Contour 2D (chamfer)**: 12000 RPM, 48 IPM cut, 13.33 plunge, =plunge ramp, stock to leave 0.004", stepover ≈0.119" (95% of dia)
- **2D Chamfer**: 12000 RPM, 48 IPM cut, **60 IPM plunge**, =plunge ramp, stock to leave 0"

---

## Setup-by-setup detail

### Setup 1 — `Op1`
- Stock: solid model bbox + 0.04 sides / 0.04 top
- Stock dimensions: 1.732" × 1.500" × 0.550"
- WCS: stockPoint @ top center
- Operation flow:
  1. **Face1** — top facing with T26 1/2 carbide rougher (140 IPM, 0.04 DOC)
  2. **2D Adaptive1** — bulk roughing with T26 (climb, helix ramp, optimal load 0.1, stock to leave 0.015, bottom −0.020 for breakthrough)
  3. **2D Adaptive1 (2)** — finer adaptive cleanup with T23 1/4 finish (optimal load 0.01 — very tight)
  4. **2D Contour1** — finish profile with T23 (stepover 0.005, stock to leave 0.004, bottom −0.020)
  5. **Face2** — secondary surface facing with T23 (67.2 IPM, 0.04 DOC)
  6. **2D Contour2 (4)** — chamfer with T18 1/4 chmf (40 IPM, stepover 0.030)

### Setup 2 — `OP21`
- Stock: solid (1.673" × 1.673" × 0.550")
- WCS: point @ bottom center
- Operation flow:
  1. **Face3 (3)** — top facing with T26 (140 IPM)
  2. **2D Adaptive2 (4)** & **(5)** — pair of roughing passes with T14 1/4 carbide rougher (80 IPM, optimal load 0.05); (5) starts 0.010" higher and bottoms "from contour"
  3. **Face3 (4)** — secondary face with T23 (67.2 IPM)
  4. **Slot1 (2)** — slotting with T23 (30 IPM cut, 30 IPM ramp, stepover dia/2, retract 0.3")
  5. **2D Contour3 (5)** — finish profile with T23 (50 IPM cut, **40 IPM plunge**, stock to leave 0.004)
  6. **2D Contour3 (6) / (7) / (8)** — three identical bulk-leave contour passes with T23 (stock to leave **0.05"** — leaves material for downstream ops, stepover 0.1)
  7. **2D Contour4 (3)** — chamfer with T5 1/8 carbide chamfer (48 IPM)
  8. **2D Chamfer1 (3)** — dedicated chamfer with T5 (48 IPM, **60 IPM plunge**, stock to leave 0)

### Setup 3 — `OP3`
- Stock: relative box (default mode), 1.150" × 0.500" × 1.193"
- WCS: point @ bottom center
- Operation flow:
  1. **2D Contour5 (3)** — finish profile with T23 (30 IPM cut, 30 IPM plunge, stepover 95% of dia ≈ 0.2375)
  2. **2D Contour5 (4)** — same tool, stepover 0.030

---

## Notable patterns / gotchas to remember

1. **12,000 RPM is universal** — the VF-2 runs flat-out for every op in this program. This is correct for 6061 + carbide/HSS in light-cut conditions, but for steel or stainless this would NOT apply. Keep the 12k as a starting point only when material is 6061-family aluminum.
2. **Plunge = 13.33 IPM is Fusion's default ratio**, not a deliberate choice. It's used in 16 of 19 ops. The deliberate overrides are:
   - Slot (T23): plunge stays 13.33 but **ramp = 30 IPM** (ramping into a slot needs more axial speed)
   - 2D Chamfer (T5): plunge = **60 IPM** (chamfer mills tool-down fast since they're not engaging full diameter)
   - 2D Contour bulk-leave (T23, OP21): plunge = **40 IPM** (more aggressive on a bulk pass with large stock-to-leave)
3. **Bottom-height offset for through-cuts is −0.020"**, not 0. Op1 uses this consistently.
4. **Bulk-leave contour pattern**: when you see a contour with `stock to leave = 0.05"` it's intentional — it's leaving material for a downstream op to remove. Don't mistake this for a finishing pass.
5. **Tight optimal load** (0.01") on a 1/4" finish endmill turns Adaptive into a finishing strategy instead of a roughing one. Used when the geometry is too organic for Contour but still needs a fine pass.
6. **Stock offsets 0.04 / 0.04 / 0** — Robert's standard for solid-model stock mode in this part family.

---

## How to use this template for a new part

When Robert asks to design CAM for a new similar part:

1. **Confirm material + machine** — if 6061 + VF-2, this template applies directly. If steel or different machine, only the *structure* of the program transfers; the spindle/feed values do not.
2. **Pick tools from `cloud://VF2SSYT`** matching the family above (T5, T14, T18, T23, T26 are the workhorses).
3. **Default to the per-tool recipes** for spindle/feed/plunge/ramp.
4. **Pick the operation flow that matches the geometry**:
   - Has a top face needing flattening → start with **Face** (T26 if aggressive, T23 if light)
   - Has bulk material to remove → **2D Adaptive** with T26 (large) or T14 (medium)
   - Has finished walls/contours → **2D Contour** with T23 (stepover 0.005 for finish, 0.030 for medium)
   - Has slots → **Slot** strategy with T23
   - Has edges to chamfer → **2D Chamfer** with T5 (small) or T18 (large)
5. **Apply the heights conventions** (clearance 0.4 / retract 0.2 / feed 0.2 / bottom 0 or −0.020 for through-cuts).
6. **Apply the universal flags**: coolant=flood, climb direction for adaptive, helix ramp for adaptive, profile ramp for contour, retraction policy=full, stay-down=level0.
7. **Always verify by simulation before posting to G-code.**
