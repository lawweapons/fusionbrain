# Threading Reference — Single-Point Threading on a Lathe

## UN (Unified National) thread depth math

For 60° flat-crest threads (UN/UNF/UNEF):

```
Thread Depth (single side) = 0.6495 × pitch
Pitch = 1 / TPI (threads per inch)
Major diameter (full nominal) = thread Major
Minor diameter ≈ Major − 2 × Depth

Class 2A external thread allowance ≈ pitch × 0.06 (deduct from major OD)
```

## Common firearm thread specs

| Thread | TPI | Pitch (in) | Depth/side (in) | Tenon OD target (Class 2A external) |
|---|---|---|---|---|
| 1/2-28 | 28 | 0.03571 | 0.0232 | 0.4986 (max), 0.4906 (min) |
| 9/16-24 | 24 | 0.04167 | 0.0271 | 0.5611 (max), 0.5519 (min) |
| 5/8-24 | 24 | 0.04167 | 0.0271 | 0.6236 (max), 0.6144 (min) |
| 11/16-24 | 24 | 0.04167 | 0.0271 | 0.6861 (max), 0.6769 (min) |
| 3/4-24 | 24 | 0.04167 | 0.0271 | 0.7486 (max), 0.7394 (min) |
| .578-28 (Polish/AK) | 28 | 0.03571 | 0.0232 | 0.5766 (max), 0.5686 (min) |
| .625-24 (USSR/AK custom) | 24 | 0.04167 | 0.0271 | 0.6236 (max), 0.6144 (min) |
| 14×1L (left-hand metric) | — | 0.0394 (1.0 mm) | 0.0256 | 0.5476 (max) |
| M14×1 RH | — | 0.0394 | 0.0256 | 0.5476 (max) |
| M15×1 LH | — | 0.0394 | 0.0256 | 0.5870 (max) |
| M18×1 RH | — | 0.0394 | 0.0256 | 0.7050 (max) |

## Single-point threading infeed schedules

Two common strategies:

### Constant decreasing depth (modified flank, the safe default)
- Pass 1: 0.010" depth
- Pass 2: 0.008"
- Pass 3: 0.006"
- Pass 4: 0.004"
- Pass 5: 0.003"
- Pass 6: 0.002"
- Pass 7: 0.001"
- Spring pass: 0.000" (one or two no-feed passes to clean up)

The chip cross-section stays roughly constant because the engaged flank length grows as the tool gets deeper.

### Constant chip-cross-section (advanced, fewer passes)
Calculate by formula in Sandvik's threading application guide. Used in production where pass count matters; not necessary for one-off barrel work.

## Tool selection for barrel threading

- **External threading insert, partial profile (laydown insert, e.g., Sandvik 16ER, Iscar GTI, Carmex GE):** flexible — one insert handles a TPI range. Sharp 60° point. Use for stainless, alloy steel.
- **External threading insert, full profile:** cuts root and crest in one — better thread form but TPI-specific. Use when you do a lot of one TPI.
- **HSS or CGT cobalt single-point ground tool:** budget option. Need to grind exact 60° angle and clean rake. Avoid for stainless.

For barrels (steel, sometimes stainless):
- **Carbide insert** is the right answer. TiAlN or TiCN coated.
- **NR (nose radius) = 0** for sharp single-point form. Some inserts have a tiny .005 NR which is OK for tougher materials.
- **G50 max spindle clamp** is critical — CSS would otherwise overspeed the tiny diameters at thread relief.

## Common G-code modes encountered in lathe threading

| Code | Plain English |
|---|---|
| G50 S### | Clamp max RPM to ### during CSS (constant surface speed) |
| G96 S### | CSS on, surface speed = ### SFM. RPM auto-adjusts as X (diameter) changes |
| G97 S### | CSS off, fixed RPM = ### |
| G99 | Feed in inches per revolution (in/rev) — standard for lathe |
| G98 | Feed in inches per minute — usually not used for threading |
| G32 X.. Z.. F.. | Single-line single-point thread cut. F is pitch. Used by simple posts. |
| G76 P.. Q.. R.. / G76 X.. Z.. P.. Q.. F.. | Multi-pass threading cycle. Haas/Fanuc lathe — does the entire thread including infeed. |
| M03 / M04 | Spindle CW / CCW (for lathe, M03 spins toward operator if standing in front) |
| M08 / M09 | Coolant on / off |
| T0101 | Turret position 1, offset 1. T0202 = position 2 offset 2. etc. |

## Pre-threading verification checklist

1. **Tenon OD** measured with mic — should be at the Class 2A max (or 0.001" under) so thread fits gauge cleanly without reverse cuts
2. **Tenon length** matches your thread length spec (typically 0.400" for muzzle threads)
3. **Relief groove** at the back of the tenon, deeper than thread depth, wide enough for tool runout (at least .060" wide for typical insert)
4. **Spindle runout** indicated <0.001" TIR at the muzzle face
5. **Tool tip height** on centerline (use a tool setter or shim test)
6. **Tool path zero** — the leading edge of the first thread crest should be at Z+0.0 or slightly into the tenon (not past the relief groove)

## In-process gauging

- Run all decreasing infeed passes EXCEPT the last 0.001"
- Stop. Try the GO gauge. If it threads on full length without binding, run one spring pass.
- If GO gauge binds: run a 0.0005 finishing pass, retest.
- NO-GO gauge should NOT thread on more than 1.5 turns. If it threads further, the OD was too small (took off too much) — start from a larger blank next time.
- For class 2A muzzles, slight oversize on tenon OD (tight GO) is preferred over undersize (loose, leaks gas, suppressor wobble).

## Common threading mistakes

1. **Threading before finishing the OD.** Thread crest will mirror any oversize/undersize from the rough turn. Always profile-finish before threading.
2. **No relief groove (or too narrow).** Insert can't exit cleanly; you'll either crash or get a torn last thread.
3. **Wrong feed direction relative to spindle direction.** On a Haas TL-1 with normal CW spindle, you cut from the muzzle end toward the chuck (Z negative-going). Reversing this without flipping the insert kills the form.
4. **CSS on during threading.** RPM must be CONSTANT during a threading pass — synchronization breaks otherwise. Use G97 fixed RPM or a G50 clamp during the thread cycle.
5. **Spindle too fast for a small thread.** ½-28 in 4140 should be 400-700 RPM, not 1500. Insert thermal damage if you push speed.
6. **Galling on stainless.** Use plenty of coolant, lower SFM (150-180 not 200+), and a sharper insert with TiAlN coating.
7. **Burr at the muzzle crown after threading.** Always plan a chamfer operation AFTER the thread (small 45° break, 0.005-0.010" wide on the crest).

## Class fits — when to use which

- **Class 2A** (the default) — interchange with any 2B internal thread. Standard for muzzle devices, barrel nuts, optic mounts.
- **Class 3A** — tighter fit, no clearance. Almost never used on muzzle threads (suppressor mounts need to thread on/off cleanly even when slightly fouled). DO NOT use Class 3A unless a print specifically calls it out.
- **Class 1A** — loose. Avoid; you'll get rattle.
