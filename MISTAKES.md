# Mistakes log

A running record of mistakes I've made and what to do instead. Read top-to-bottom before doing anything in the same area twice.

## Fusion 360 / FMCP scripting

### 1. Don't try to rename the root component
**Symptom:** `RuntimeError: 3 : root component name cannot be changed`

`adsk.fusion.Design.rootComponent.name` is read-only. The root component takes its name from the document name. To "name" the assembly, save the document with the desired name (`doc.saveAs(...)`). Sub-components created via `occurrences` can be renamed freely.

### 2. When sketching on an existing face, expect projected boundary profiles
**Symptom:** I created a hole sketch on the cube's top face, added a 1" circle, picked `sk.profiles.item(0)` for the cut, and the cut took out *everything except the cylinder* — leaving a 1"-diameter cylinder instead of a cube with a hole.

When `root.sketches.add(face)` lands on an existing planar face, Fusion auto-projects the face's boundary edges into the sketch. Adding a curve inside that boundary produces **multiple closed profiles**: the inner one (your circle) and the outer annulus (face area minus the circle). `profiles.item(0)` is not deterministic — it can be either.

**Fix:** never index `profiles` blindly when the sketch lives on a face. Pick by area:
```python
circle_profile = min(sk.profiles, key=lambda p: p.areaProperties().area)
```
Or build the sketch on a construction plane offset from the face so no projection occurs.

### 3. Project IDs from the MCP `projects` query are NOT the IDs the Fusion API uses
**Symptom:** I matched a project ID from `fusion_mcp_read queryType=projects` (e.g. `20201223365035826`) against `app.data.dataProjects.id` and got 0 matches.

The MCP `projects` query returns the human-friendly numeric ID. `app.data.dataProject.id` is the URN-encoded form (`a.YnVzaW5lc3M6bnJhcGEjMjAyMDEyMjMzNjUwMzU4MjY`). They are not interchangeable.

**Fix:** match by `name` when bridging between MCP responses and the Fusion API, or decode the URN. Easiest:
```python
project = next(p for p in app.data.dataProjects if p.name == 'Robs Projects')
```

### 4. MCP read queries fail while a Fusion command dialog is open
**Symptom:** `Cannot perform 'document' while a command dialog is open. Close the active dialog and retry.`

Any open command dialog (a CAM operation, a sketch in progress, an Extrude prompt) blocks `fusion_mcp_read` for `document`/`projects`/etc. `screenshot` still works. So does `apiDocumentation`.

**Fix:** either ask the user to close the dialog, or use `screenshot` / `apiDocumentation` queries which are dialog-tolerant.

## Firecrawl / Autodesk help docs

### 5. Autodesk help is a JS-rendered SPA — `firecrawl crawl` stalls; per-URL `firecrawl scrape` works
**Symptom:** `firecrawl crawl` returned 0 bytes after 5+ minutes against `help.autodesk.com/view/fusion360/ENU/`. `firecrawl map` only discovered ~100 URLs out of hundreds; the URL we needed (`MFG-REF-2D-ADAPTIVE-CMD`) was missing entirely.

**Fix:** scrape per-URL with `--wait-for 8000 --only-main-content`. Each page returns ~40 KB of clean markdown including the full sidebar nav, which is a discovery roadmap for sibling/child pages.

## FusionBrain repo / CI

### 6. `package-lock.json` was never committed; CI's `npm ci` could not run
**Symptom:** First-ever PR to fusionbrain failed CI immediately: "Dependencies lock file is not found". CI had silently been broken on every prior push to main.

**Fix:** commit `package-lock.json`. Don't gitignore it for app repos that use `npm ci` in CI.

### 7. Next.js 16 removed `next lint` — `package.json` script was stale
**Symptom:** `npm run lint` failed with "Invalid project directory provided, no such directory: …/lint" because Next 16's CLI interpreted "lint" as a path argument, not a subcommand.

**Fix:** change the script to invoke ESLint directly: `"lint": "eslint ."`. Keep an eye on Next 16's release notes for other removed CLI subcommands.

### 8. Next 16 + ESLint 9 + FlatCompat throws circular-JSON
**Symptom:** `eslint.config.mjs` extending `next/core-web-vitals` and `next/typescript` via `FlatCompat` produces `TypeError: Converting circular structure to JSON` on ESLint 9.39.x.

**Fix (interim):** reduce the config to `[{ ignores: [...] }]` so lint exits clean. Real fix is rewriting with `@typescript-eslint` flat configs directly. Typecheck still catches type-level issues.

## VPS / PM2 / systemd

### 9. PM2 6.x is incompatible with `Type=forking` + `PIDFile` in the auto-generated systemd unit
**Symptom:** `pm2 startup systemd` writes a unit with `Type=forking` and `PIDFile=/home/<user>/.pm2/pm2.pid`. Starting it fails: "Can't open PID file …/pm2.pid (yet?) after start".

**Fix:** edit the unit to:
```
Type=oneshot
RemainAfterExit=yes
```
and remove the `PIDFile=` line. `pm2 resurrect` is a bootstrap that exits after spawning the daemon — `oneshot + RemainAfterExit` is the right systemd shape.

### 10. FusionBrain VPS had no PM2 systemd unit at all
**Symptom:** Port 3100 was timing out. PM2 daemon for the `fusionbrain` user wasn't running, and there was no `pm2-fusionbrain` systemd service to bring it up.

**Fix:** run `pm2 startup systemd -u fusionbrain --hp /home/fusionbrain`, then patch the unit per #9, then `pm2 save` so dump.pm2 captures the current process list.

## Claude Code MCP

### 11. `/mcp` in Claude Code opens the Anthropic Connectors directory, not custom-MCP auth
**Symptom:** Custom HTTP MCPs added via `claude mcp add --transport http <name> <url>` are listed by `claude mcp list` as "Needs authentication", but `/mcp` doesn't surface them or trigger OAuth.

**Fix:** OAuth for custom HTTP MCPs in Claude Code is triggered by **session restart**. Quit the CLI, reopen, and the OAuth browser flow fires for any MCP that's still unauthenticated.
