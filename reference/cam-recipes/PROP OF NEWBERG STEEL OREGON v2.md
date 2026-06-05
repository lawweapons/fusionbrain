# CAM Recipe: PROP OF NEWBERG STEEL OREGON v2

## Summary
A turned/milled combination part (likely a steel shaft, hub, or similar rotational component) attributed to Newberg Steel, Oregon. Material is **steel** (inferred from document name and conservative turning speeds). Two setups: Setup 1 is a milling/probing setup using a solid stock model with WCS probing and a fine trace operation; Setup 2 is a lathe/mill-turn setup using a fixed-cylinder stock model covering face turning, center drilling, OD roughing, OD finishing, and ID boring. Machine not specified in export. Total: **8 operations** across 2 setups.

---

## Tools Used

| Tool # | Description | Geometry | Typical Cutting Feed | Used For |
|--------|-------------|----------|----------------------|----------|
| T1 (Setup 1) | **6mm PROBE** | Ø0.2362″, probe type, HSS, 0-flute, FL=0.472″ | 40 ipm (probing) | WCS probing (2 ops) |
| T14 (Setup 1) | **1/16 BM** | Ø0.0625″, 4-flute ball end mill, carbide, FL=0.15″ (Kennametal 1257537) | 4 ipm | Fine trace engraving/marking |
| T1 (Setup 2) | **CNMG120404UF-YG3020** | Ø0.5″ turning insert, CR=0.015625″, carbide | 40 ipm | Face turning, OD roughing, OD finishing |
| T12 (Setup 2) | **1.25 INSERT DRILL** | Ø1.25″, 2-flute, carbide, FL=3.0″, flat end mill type | 40 ipm (feed); 7.33 ipm (plunge) | Center/through drilling |
| T14 (Setup 2) | **1IN BORE BAR** | Ø0.5″ turning boring bar, CR=0.032″, carbide | 40 ipm | ID bore roughing |

---

## House Rules (Conventions Held Across Operations)

- **Cutting feed = 40 ipm** on every single operation — this is a universal constant in this program, not computed per-tool. Do not assume it is optimal for a new tool or material without verification.
- **Spindle RPM = 500 rpm** on all turning operations (Setup 2, T1 and T14 boring bar). SFM values differ (3600 vs. 7080) but RPM is locked at 500 — likely a lathe speed limit or conservative steel setting.
- **Coolant = flood** on all cutting operations (Trace1, Drill1, all turning ops).
- **Tolerance = 0.0004″** across all operations.
- **Clearance height offset = 0.4″**, **Retract height offset = 0.2″** — consistent across milling and drilling ops.
- **Plunge feed convention (milling):** `cutFeed / 3` for non-drill tools. Trace1 plunge = **2.5 ipm** (= 4 ipm ÷ ~1.6, slightly less than ÷3 — may be a manual override). Drill1 plunge = **7.33 ipm** (= 40 ipm ÷ ~5.45, also a manual override).
- **Stock to leave:** Only explicitly set on Trace1 (**0.004″**) and Drill1 (**0.004″**). Turning ops do not show an explicit stock-to-leave value in the digest.
- **Thread passes = 1** on all turning ops; **thread passes = 2** on Trace1 (two-pass trace).
- **Stock mode:** Setup 1 = solid body stock (bounding box auto-rounded); Setup 2 = fixed cylinder stock (bounding box auto-rounded).
- **Offset mode = simple** on both setups.

---

## Setup-by-Setup

### Setup 1 — Milling / WCS Establishment
**Stock:** Solid model, bounding box auto-rounded to nearest rounding increment (X/Y/Z).
**WCS:** Established via probing (two separate probe ops before any cutting).

| # | Operation | Strategy | Tool | Key Parameters |
|---|-----------|----------|------|----------------|
| 1 | **Probe WCS1** | Probing | T1 – 6mm Probe | Probe feed: **40 ipm**; Entry: **120 ipm**; Clearance: **2.0″**; Retract: **0.2″**; Tol: **0.0004″** |
| 2 | **Probe WCS2** | Probing | T1 – 6mm Probe | Same as Probe WCS1 — second datum/surface probe |
| 3 | **Trace1 (2)** | Trace (2 passes) | T14 – 1/16 BM | RPM: **12,000**; Cut feed: **4 ipm**; Plunge: **2.5 ipm**; Ramp feed: **13.33 ipm**; Max axial DOC: **0.010″**; Stepover: **0.03125″** (50% dia); Stock to leave: **0.004″**; Tol: **0.0004″**; Coolant: flood; Clearance: **0.4″**; Retract: **0.2″** |

**Flow rationale:** Probe twice to confirm WCS before committing the fragile 1/16″ ball mill to a fine trace. Two probe ops suggest two reference surfaces or datums are being qualified.

---

### Setup 2 — Lathe / Mill-Turn
**Stock:** Fixed cylinder, bounding box auto-rounded.
**WCS:** Not probed — fixed setup assumed pre-qualified.

| # | Operation | Strategy | Tool | Key Parameters |
|---|-----------|----------|------|----------------|
| 1 | **Face1** | Turning face | T1 – CNMG120404UF | RPM: **500**; SFM: **3600 ipm**; Cut feed: **40 ipm**; Stepover: **0.040″**; Dir: outside→inside; Comp: computer; Coolant: flood; Tol: **0.0004″** |
| 2 | **Drill1** | Drilling | T12 – 1.25 Insert Drill | RPM: **~1467**; Cut feed: **40 ipm**; Plunge: **7.33 ipm**; Stock to leave: **0.004″**; Bottom Z offset: **−0.100″** (through-cut); Clearance: **0.4″**; Retract: **0.2″**; Coolant: flood |
| 3 | **Profile Roughing2** | Turning profile rough | T1 – CNMG120404UF | RPM: **500**; SFM: **3600 ipm**; Cut feed: **40 ipm**; Stepover: auto (≥1.5× CR = ≥0.023″); Dir: front→back; Comp: control; Coolant: flood; Tol: **0.0004″** |
| 4 | **Profile Finishing1** | Turning profile finish | T1 – CNMG120404UF | RPM: **500**; SFM: **3600 ipm**; Cut feed: **40 ipm**; Stepover: auto (≥1.5× CR); Dir: front→back; Comp: **computer** (changed from control); Coolant: flood; Tol: **0.0004″** |
| 5 | **Profile Roughing3** | Turning bore rough | T14 – 1IN Bore Bar | RPM: **500**; SFM: **7080 ipm** (different from OD ops — larger effective diameter or different insert); Cut feed: **40 ipm**; Stepover: auto (≥1.5× CR = ≥0.048″); Dir: front→back; Comp: control; Coolant: flood; Tol: **0.0004″** |

**Flow rationale:** Face first to establish Z datum → drill center bore to open ID for boring bar clearance → OD rough → OD finish → ID bore rough. No ID finishing op present in digest; bore may be finished in a subsequent operation not captured, or left at rough tolerance.

---

## Patterns & Gotchas

- **40 ipm is a universal feed rate — not optimized per tool.** The 1/16″ ball mill at 12,000 RPM cutting at 4 ipm is a deliberate conservative engraving feed. The 1.25″ insert drill at ~1467 RPM cutting at 40 ipm is a completely different chip load regime. Do not blindly carry 40 ipm to a new tool without computing chip load.
- **500 RPM on all turning ops is likely a machine or material constraint for steel**, not a calculated optimum. The SFM values (3600 vs. 7080) are inconsistent with a single RPM at a single diameter — the 7080 SFM on the bore bar at 500 RPM implies a much larger effective cutting diameter in the formula, or the SFM field is a formula artifact. Verify actual cutting speed against insert manufacturer's recommendation for the steel grade.
- **Drill1 bottom Z offset = −0.100″** — this is a deliberate through-cut/breakthrough offset. Do not remove this offset if the part requires a clean through-hole; it ensures the insert drill fully clears the back face.
- **Trace1 uses 2 passes (threadPasses=2)** with **0.004″ stock to leave** — the trace is not cutting to net; it leaves material. If this is an engraving or marking operation, confirm whether the 0.004″ offset is intentional (shallow mark) or a leftover from a roughing template.
- **Compensation mode changes between roughing and finishing on OD:** Roughing uses `comp=control` (cutter comp at the controller); Finishing switches to `comp=computer` (Fusion offsets the path). This is a deliberate choice — do not swap these without understanding your controller's cutter comp behavior.
- **No ID finishing operation is present.** Profile Roughing3 (bore bar) has no corresponding finishing pass in the digest. Either the bore is left at rough tolerance, a finishing op was deleted/suppressed, or it exists in a third setup not captured. Verify bore tolerance requirements before running.

---

## How to Adapt This for a New Part

- [ ] **Confirm material is steel.** 500 RPM / 40 ipm turning parameters and 12,000 RPM / 4 ipm trace are tuned for steel. Aluminum, stainless, or titanium require recalculated feeds and speeds — do not reuse blindly.
- [ ] **Confirm machine RPM limits** — 500 RPM lock on turning suggests a specific lathe spindle range; 12,000 RPM on the 1/16″ BM suggests a high-speed milling spindle. Verify both are available on the target machine.
- [ ] **Re-qualify WCS probing geometry.** The two probe ops in Setup 1 reference specific surfaces. Map Probe WCS1 and WCS2 to equivalent datums on the new part before running.
- [ ] **Recalculate Drill1 RPM and plunge** if drill diameter changes. The ~1467 RPM is diameter-dependent; the 7.33 ipm plunge (≈ feed/5.5) is a conservative override — recompute for new drill geometry.
- [ ] **Trace1 tool (T14, 1/16″ BM) maps to fine engraving/marking features only.** If the new part has no marking requirement, suppress this op. If feature depth changes, re-evaluate the 0.010″ max DOC and 0.004″ stock-to-leave.
- [ ] **CNMG120404UF (T1) maps to all OD turning and facing.** Corner radius = 0.015625″ — verify this insert geometry is appropriate for the new part's shoulder radii and surface finish requirements.
- [ ] **1IN Bore Bar (T14, Setup 2) maps to ID features ≥ ~1.0″ diameter.** If bore diameter changes significantly, recalculate RPM (currently locked at 500) and verify bar reach vs. FL.
- [ ] **Add an ID finishing pass** if bore tolerance is tighter than rough — this program has none.
- [ ] **Stock rounding convention** (both setups use `Math.ceilto` bounding box) — confirm the rounding increment (`job_stockFixedRoundingValue`) matches available raw stock sizes at Newberg Steel or the new supplier.