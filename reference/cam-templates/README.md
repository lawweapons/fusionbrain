# CAM Templates

Captured "good" CAM programs from validated Fusion documents, kept here as the reference for what working programs look like and as recipe sources for new parts.

## How a template gets into this folder

1. A working CAM program exists in a Fusion document and the toolpaths have been verified (simulation, dry run, or actually cut a part).
2. Through Fusion MCP, dump every operation's settings — strategy, tool, spindle, feeds, plunge, ramp, tolerance, stock-to-leave, optimal load, stepover, ramp type, heights (clearance/retract/feed/top/bottom), linking (retraction policy, stay-down) — for every operation in every setup of that document.
3. Format the dump as markdown using the same shape as `op-1-2-3-flashlight-cap.md`:
   - **Document context** (machine, material, library, setups/operations counts)
   - **Universal house rules** (values consistent across all ops in the program)
   - **Strategy-default rules** (per-strategy tolerance / stock-to-leave / direction / ramp type)
   - **Tool inventory** (T#, description, geometry, material, typical feed)
   - **Per-tool feed/speed recipes** (one block per tool, listing op variants)
   - **Setup-by-setup operation flow** (numbered, in machining order)
   - **Notable patterns / gotchas** (the "why" lines)
   - **How to use this template for a new part** (selection rules)
4. Save the file in `reference/cam-templates/` with a slug-style name matching the source doc.
5. Ingest into FusionBrain via `/api/admin/upload` (or the existing markdown drop zone in the admin UI) so chat retrieves it as `source_type: 'markdown'`.

## How a template gets used for a new part

When designing CAM for a new part, ask FusionBrain something like:

> "I'm setting up a CAM program for a new 6061 cap on the VF-2. Walk me through using the same operation flow we used on the OP 1 2 3 flashlight cap."

Chat will retrieve the matching template chunks, apply the per-tool recipes and the universal house rules, and adapt the operation flow to the new part's geometry. Confirm tool availability against `cloud://VF2SSYT` before generating toolpaths.

## Templates in this folder

| File | Source doc | Material | Machine | Notes |
|---|---|---|---|---|
| `op-1-2-3-flashlight-cap.md` | OP 1 2 3 Flashlight Cap v5 | 6061 aluminum | Haas VF-2 | 3 setups, 19 ops; canonical reference for AR15 flashlight family parts |
