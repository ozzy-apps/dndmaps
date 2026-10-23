# Fable — DnD map studio

## Current release — 0.3.1
- Fog rendering fixed: continuous world-space clouds, painted atmosphere responds to ambient/source lighting, Global haze scales painted fog/mist/smoke, and automatic fog banks are removed. Source passed **99 native interaction/pixel/alpha checks**, **26 model tests**, and **2 storage tests**.
- Package: `artifacts/fable-map-studio_0.3.1_all.deb`. Source QA screenshot/report: `artifacts/fog-fix.png` and `.checks.json` (generated QA artifacts stay local). Extracted package passed the same **99/99** native checks. GitHub push is the remaining release step.
- Features: variable map size/aspect, alpha tips/import, partial textured erasing, Shift-drag sizing, point/spot lights and grading, painted atmosphere, named independent map states, Material 3 neutral grey/blue light/dark UI.
- Version 1/2 files migrate to schema 3. Existing map strokes and saved haze values are retained. New maps contain no painted fog. New files need Fable 0.3+.
- `npm start` opens the desktop; `npm run dev` serves browser preview. Install with `sudo apt install ./artifacts/fable-map-studio_0.3.1_all.deb`. No system-wide installation performed.
- Publish destination: https://github.com/ozzy-apps/dndmaps (`main`). The workspace `.git` is a read-only placeholder; Git operations use `/tmp/fable-dndmaps-publish`. Source and latest .deb/examples are tracked; old packages/screenshots/check reports are ignored.

### Current architecture
- Vanilla JavaScript ES modules + Canvas 2D, bundled fonts/assets, Python GTK 3/WebKit2 4.1 desktop shell, and `dpkg-deb`. No NPM runtime dependencies or remote services.
- `app/model.js`: schema 3, v1/v2 migration, dynamic dimensions, scene capture/switch/duplicate/delete, resizing/scaling, ordered paint IDs, bounds validation, demos and undo with a memory bound.
- `app/alphas.js`: generated alpha tips, normalized portable image import, decoded-image preparation and revision-based cache invalidation.
- `app/procedural.js`: terrain textures and alpha-stamped masks with spacing/scatter/rotation/jitter; dimension-aware bounds and caches; floor/wall details.
- `app/atmosphere-field.js`: deterministic non-periodic warped cloud density and haze scaling.
- `app/atmosphere.js`: world-space atmosphere atlas, lit brush previews, and destination-out erasing.
- `app/lighting.js`: source color/intensity/falloff/bloom/cones; optional wall visibility polygons; exposure/vibrance/saturation/contrast/shadow/temperature/vignette grading.
- `app/renderer.js`: ordered per-layer compositing, dynamic map size, separate paint/erase layers, lighting/atmosphere/grading, viewport overlays and actual-size PNG export.
- `app/studio-controls.js`: map-size/aspect and named-state dialogs, alpha import, shared paint controls, light options and grading.
- `app/app.js`, `index.html`, `styles.css`: ten tools, pointer gestures, neutral light/dark UI, shortcuts, persistence, project and PNG flows.
- `packaging/fable.py`: native window/dialogs, 30 MB project cap, atomic persistence and isolated native QA. Tests: `tests/model.test.js`, `native-storage.test.py`, `native-interactions.js`, `alpha-import.js`, `atmosphere-render.js`.

### Current boundaries and next steps
1. Add general selection/move/resize and editing existing lights/props/walls. Current per-light controls apply to new stamps; geometry eraser removes existing sources. Markers already move/edit.
2. Add doors/windows, continuous/curved wall strokes and freeform room polygons.
3. Profile very large maps and many states. Current dimensions: 256–4096 px per side; up to 12 states; PNG output <=32 MP (large maps use 1×). Alpha library: 12 custom 256 px tips. Visibility shadows use at most 650 nearby wall segments per light.
4. Add multiple floors, custom prop packs, dedicated VTT formats and wider distribution QA. Painted weather is static; alpha erasing affects painted surfaces, while structural geometry has a separate remove mode.

The earlier release notes and build steps below are historical.


## Previous release — 0.2.0 (October 23, 2026)
- **Complete and verified.** Installable package: `artifacts/fable-map-studio_0.2.0_all.deb` (~260 KB). The extracted package also passes all 48 core native checks; the outdoor capture adds a 49th check.
- 18 model/preferences checks and 2 isolated storage checks pass. Both UI themes were visually inspected. Final reports and screenshots: `artifacts/upgrade-light.{png,checks.json}` and `artifacts/upgrade-dark.{png,checks.json}`.
- New features: 12 walls, 12 floors, 12 terrain materials; independent floor brush; rectangle/round/cavern rooms with optional chosen walls; noise/opacity/softness/density brush controls and ground/overlay placement; persistent light/dark UI; editable draggable DM locations; VTT grid presets; player and DM PNG variants.
- Existing v1 maps migrate to project schema v2. New v2 files require Fable 0.2 or later. Interface preferences remain separate from map atmosphere/data.
- Useful ideas adopted from the brother's roadmap: local map studio, remembered preferences, dark mode, 70/140 px grids, DM markers, player/DM variants. No framework rewrite or publishing-suite features were needed.
- Source desktop app opened after the final verification. No system-wide installation or publication was performed.
- The steps below record the original prototype and upgrade history. This section describes the state at version 0.2.

### Current modules
- `app/materials.js`: shared 50-asset registry/category metadata.
- `app/model.js`: v2 document, v1 migration, bounds/validation, room boundaries, geometry, resampling, two demos, undo history.
- `app/procedural.js`: tileable layered noise, textured terrain atlases/masks, grass/mud/snow/sand/leaves details, extra floor and wall renderers, caches.
- `app/renderer.js`: room/floor/terrain compositing, two-pass walls, props, lighting, viewport, marker overlays and PNG export.
- `app/preferences.js`, `theme-init.js`: sanitized persisted editor settings and early theme application.
- `app/app.js`, `index.html`, `styles.css`: nine tools, controls, theme, markers, dialogs, persistence, exports.
- `packaging/fable.py`: GTK/WebKit host, native file dialogs, atomic project/preferences storage, isolated native tests and captures.
- `tests/model.test.js`, `tests/native-storage.test.py`, `tests/native-interactions.js`: verified behavior and pixel invariants.

### Next useful work
1. Full selection/move/resize for existing objects, walls, floors, rooms and lights; partial stroke erasing. Markers already support move/edit/delete.
2. Door/window brushes, editable map dimensions, freeform room boundaries and continuous/curved wall drawing.
3. Custom asset import, lighting occlusion, multiple map floors, and dedicated VTT formats.
4. Performance work for larger documents and automated real file-dialog checks on more Debian/Ubuntu versions.


## Project
An installable Linux desktop map painter for DnD encounters. The user requested a highly detailed, atmospheric prototype with wall drawing, snapping, and a configurable grid. UI follows Material 3 and contains functional text only.

## Step 1 — Foundation
- Empty project inspected. No existing code or dependencies.
- Planned stack: local HTML/CSS/JavaScript, Canvas 2D rendering, a lightweight GTK/WebKit desktop shell, and Debian packaging using `dpkg-deb`.
- The browser preview and desktop app will share the same offline frontend.
- Procedural artwork avoids external assets and supports editing at every zoom level.

## Implementation steps
1. Build the Material 3 editor and procedural sample dungeon.
2. Implement snapped wall strokes, room drawing, terrain painting, object placement, lights, erase, pan/zoom, undo/redo, configurable grid, and local saving.
3. Add PNG export and project JSON save/open.
4. Package and inspect the `.deb`, test the visible prototype and critical interactions.
5. Record completed behavior, validation results, limitations, and follow-up work here.

## Next AI
Continue from the implementation files in this directory. Do not replace the prototype with a static image. Update this file at each completed step.

## Step 2 — Editor and rendering
- Added the Material 3 editor shell, responsive styling, bundled local fonts with licenses, custom SVG icons, and app icon.
- `app/model.js`: editable sample dungeon, brush/material registry, snapping, geometry helpers, bounded undo history, and strict project validation.
- `app/renderer.js`: deterministic Canvas 2D stone/wood floors, masonry walls, props, terrain, atmospheric light/fog, thumbnails, transform-aware pan/zoom, and high resolution PNG rendering.
- No runtime NPM dependencies. Confirmed GTK 3 and WebKit2 4.1 are installed locally.
- Next: connect editor interactions, add desktop bridge and Debian packaging, then verify with browser and native shell.

## Step 3 — Functional prototype and desktop packaging
- `app/app.js` connects all seven tools, endpoint/grid snapping, room floors and perimeter walls, soft terrain painting, object rotation/scale, light placement, erase, pan/zoom, keyboard shortcuts, undo/redo, atmosphere controls, layer visibility, and autosave.
- Project menu supports rename, new, sample reload, and project import. Explicit replacement dialog protects the current document; undo can restore it.
- Portable `.fable` JSON with strict validation and optional-grid 1×/2× PNG export.
- `packaging/fable.py` provides the native window, local-only navigation, file dialogs, and persistent desktop autosave. `scripts/build-deb.py` builds a conventional architecture-independent `.deb` with launcher, icon, and declared GTK/WebKit dependencies.
- Added model tests and a native WebKit integration script.
- Local browser preview server started at 127.0.0.1:5173. Browser plugin bootstrap failed internally (`BROWSER_USE_SECURITY_MODE` on undefined environment); proceeding with the real GTK/WebKit shell for QA.
- Next: run native and model checks, visually inspect, fix issues, package and deliver.

## Step 4 — Validation and visual refinement
- Initial native WebKit integration run passed 21 checks, including actual pointer-driven tool handlers, snapping, undo/redo, grid controls, atmosphere, visibility, dialogs, and JSON round-trip restoration.
- Eight model tests pass when run directly with `node tests/model.test.js`; this environment's sandboxed `node --test` reporter collapses the module into one test-file result.
- Visually inspected `artifacts/prototype.png`. Refined stone surface grain, ground texture, debris, corner moss, and squared wall ends.
- Added isolated smoke-test state so QA never writes a user's native autosave or browser local storage.
- Extended native checks to verify actual 2× PNG output and its 3072 × 2560 dimensions. Exported sample map will be written beside the prototype screenshot.
- Debian package built and inspected: architecture `all`, desktop launcher/icon included, GTK/WebKit/Python dependencies declared, font licenses bundled. Native shell runs successfully in the desktop session.
- Remaining: complete final export checks, rebuild package with refinements, verify extracted-package launch, leave the app open for the user, and record final limits.

## Step 5 — Delivered prototype
- Final package: `artifacts/fable-map-studio_0.1.0_all.deb` (~247 KB; architecture independent).
- Preview: `artifacts/prototype.png` (1520 × 1000). Export: `artifacts/sample-map.png` (3072 × 2560, without grid).
- Verified the actual extracted Debian package launches and passes all **23 native integration checks**. All **8 model tests** also pass. Python files compile cleanly and Debian archive metadata/contents were inspected.
- Native app left running for the user. Browser preview is available at `http://localhost:5173` while the development server remains running.
- Install: `sudo apt install ./artifacts/fable-map-studio_0.1.0_all.deb`. Run source: `npm start`. Browser: `npm run dev`. Rebuild: `npm run package:deb`.
- No system-wide installation was performed. The `.deb` is ready for the user to install.

## Architecture for continuation
- `app/index.html` / `styles.css`: editor shell and Material 3 style; bundled local fonts and SVG art in `app/assets`.
- `app/model.js`: versioned document schema, sample geometry, asset registry, validation, snapping, history.
- `app/renderer.js`: deterministic procedural artwork and cached ground; scene rasterization; separate viewport transforms, grid, cursor and previews; PNG export.
- `app/app.js`: tool interactions, UI state, undoable mutations, autosave, browser downloads / native message bridge. Public `window.Fable` exposes document snapshots, view transforms, import, PNG export, and notifications for the native shell and tests.
- `packaging/fable.py`: GTK 3/WebKit2 4.1 host, native open/save dialogs, atomic autosave under the user's data directory, local navigation restriction, isolated smoke mode, snapshot capture.
- `scripts/build-deb.py`: staging, conventional launcher/desktop/icon entries, dependency declaration, `dpkg-deb` archive generation. No NPM dependencies or build pipeline.
- `tests/model.test.js`: 8 model checks. `tests/native-interactions.js`: 23 real WebKit UI checks (including generated PNG signature and dimensions). Run native checks with `/usr/bin/python3 packaging/fable.py --smoke-test --screenshot artifacts/prototype.png` in a graphical session.

## Known prototype boundaries and logical next steps
1. Add selection and moving/resizing existing walls, objects, rooms, and lights. Currently erase/repaint or undo performs edits.
2. Support editable map dimensions, freeform rooms, curved/continuous wall strokes, doors, and windows. Current world is 1536 × 1280 px; grid and scale are configurable; each wall drag draws one straight segment.
3. Add richer asset packs, custom asset import, and GPU/composited rendering for large maps. Current assets are procedural and entirely offline.
4. Add lighting occlusion and optional fog-of-war. Current lights are visual radial overlays and can shine across walls.
5. Add multiple floors, VTT formats, packaged release signing, and distribution-version compatibility checks. Only this local GTK/WebKit environment has been verified.
6. Consider a dedicated native save-state test with temporary data directories. Existing smoke checks intentionally isolate autosave and do not interact with the real native file dialogs.

No external services, accounts, image generation, or remote hosting are required.

## Upgrade step 1 — October 23: scope and source review
- Read the brother's pasted project notes. They contain a proposed architecture and feature roadmap, not reusable implementation code.
- Retain the working offline Canvas + GTK/WebKit stack. Adopt relevant map-studio ideas: remembered editor preferences, light/dark interface modes, 70/140 px VTT grid presets, map markers, and player/DM export variants.
- Requested core work: expand wall/floor/terrain materials, add independent floor painting, shaped rooms, and deterministic grass/mud noise brushes with opacity/softness/detail controls.
- Preserve existing `.fable` projects through schema migration. Keep UI text functional and styling consistent with Material 3.
- Planned steps: document/model changes; renderer and procedural brush library; editor/theme/marker/export integration; native tests and visual QA; rebuild `.deb` and update documentation.

## Upgrade step 2 — Brush engine, document model, and editor integration
- Added `app/materials.js`: 50 unique assets (12 walls, 12 floors, 12 terrain, 10 objects, 4 lights), with metadata-based filtering.
- Added `app/procedural.js`: tileable layered noise, detailed grass blades, mud puddles, leaves, sand, snow, gravel, feathered stroke masks, continuous stroke resampling, caching, new floor patterns and palisade/hedge/dry-stone walls.
- Project schema v2 adds painted floors, shaped rooms, markers, and terrain/marker visibility. `validateDocument` migrates v1 projects on a cloned copy. Grid maximum expanded to 256 px.
- Added standalone floor tool, rectangular/round/cavern rooms, optional walls with independently chosen wall material, and terrain opacity/softness/noise/density controls.
- Added persistent light/dark UI preferences, native preferences storage, remembered room/terrain/marker settings, and 64/70/140 px grid presets.
- Added editable/draggable DM markers and player/DM PNG export variants. A woodland campsite demo exercises outdoor materials.
- Updated version to 0.2.0. Pending: native tests, legacy project checks, visual QA of both themes and material swatches, documentation and final package rebuild.

## Upgrade step 3 — Native QA and refinements
- First native run passed 43 interaction checks, covering all nine tools, new materials, painted floors, shaped rooms, remembered brush state, theme switching, marker dragging, and player/DM export options.
- Added pixel-level checks for deterministic noise, opacity, floor/terrain ordering, and unchanged exports across interface themes.
- Fixed terrain ordering with an explicit ground/overlay placement setting. Legacy strokes default to overlay, preserving the flooded crypt and moss; outdoor fields sit under rooms.
- Refined herringbone floor pattern and batched wall shadows before surface drawing so round room segments do not obscure each other.
- Added isolated native persistence tests: light/dark and brush settings save atomically; smoke runs never write real autosave/preferences.
- Inspected the dark outdoor screenshot: all new terrain thumbnails render, controls are readable, labels and player export separation work.

## Upgrade step 4 — Release 0.2 packaging and validation
- 18 model/preferences tests and 2 isolated native-storage tests pass.
- Final dark/outdoor native run passed 49 interaction and pixel checks. Report: `artifacts/upgrade-dark.checks.json`.
- Verified noise changes painted pixels, saved/reloaded terrain is deterministic, opacity affects pixels, ground vs overlay order works, v1 files migrate, and light/dark UI produces identical map exports.
- Visually inspected the dark outdoor editor after fixing segmented room shadows. Terrain thumbnails and brush controls are functional and readable.
- Built `artifacts/fable-map-studio_0.2.0_all.deb` (architecture all, ~260 KB), inspected Debian metadata, and extracted its contents for native package verification.
- Added portable example projects `artifacts/Briarwood Crossing.fable` and `artifacts/The Hollow Sanctum.fable`. README now documents all new tools, persistence, compatibility, variants, and limitations.
- Remaining for this release: inspect final light-mode capture and finish extracted-package verification; leave the updated editor open.

## Upgrade step 5 — Delivered
- Extracted `.deb` verification passed all 48 core native checks. Final light-mode screenshot inspected; flooded crypt and moss remain visible, walls join correctly, new materials and theme controls render.
- Dark/outdoor capture passed 49 checks; model/preferences suite 18/18 and native storage 2/2 pass.
- Updated source app opened for the user; `.deb`, example projects, screenshots, reports, README, and this handoff are ready.
- No required work remains for this requested upgrade. Remaining limitations and next steps are documented above and in README.

## Upgrade 0.3 — Step 1: requested scope
- Add editable map dimensions/aspect ratios with non-destructive canvas resizing or artwork scaling.
- Add reusable alpha brush tips (including image import), textured partial erasing, brush spacing/scatter/rotation, and Shift-drag resizing. Wall angle constraint moves to Alt-drag.
- Expand point/spot lighting with color, falloff, intensity, bloom and optional wall shadows; add exposure/vibrance/contrast controls.
- Add painted fog, smoke, darkness and particle atmosphere on a separate layer.
- Add named, independently editable states of the same map inside one project, including duplicate/switch/rename/delete and persistence.
- Restyle both UI modes to neutral grey, dark base #18181a and accent #0a84ff. Preserve Material 3 controls and functional text.
- Keep the offline GTK/WebKit/Canvas stack and rebuild the .deb after native/model/pixel verification. Migrate earlier .fable files.

## Upgrade 0.3 — Step 2: model/rendering and controls
- Schema v3 supports variable map dimensions, grading, ordered atmosphere/eraser strokes, imported alpha assets, and up to 12 independently editable map states. v1/v2 migration is implemented.
- Added alpha tip generation/import, spacing/scatter/rotation, painted atmospheric textures, destination-out erasing, dynamic-size rendering/export, point/spot light options, optional visibility polygons for wall shadows, and pixel color grading.
- New map-size/aspect and state dialogs; shared alpha controls; Shift-drag resizing with a HUD; Alt-drag wall angle constraints. Added seven painted atmosphere materials and four additional light types.
- UI now uses neutral surfaces with #18181a dark base and #0a84ff accent. Map artwork and lighting remain separate from UI theme.
- Next: run model and native tests, resolve integration/visual issues, verify state persistence and dynamic PNG dimensions, update documentation and package 0.3.

## Upgrade 0.3 — Step 3: interaction and pixel verification
- Native checks now exercise real Shift-pointer resizing without paint; map-size/aspect controls and dynamic PNG dimensions; state duplicate/switch/rename/delete/undo/file round trips; textured partial erasing and repainting; fog painting/visibility; spot-light parameters; and actual exposure/vibrance pixel changes.
- All initial 0.3 checks passed. Added asynchronous alpha-image normalization/import tests and extra light occlusion/cone pixel checks.
- Fixed alpha-import cache invalidation and completion callbacks so custom tips render after image decoding; opaque images use luminance, transparent images retain alpha, including non-square sources.
- Added a day/night example with independent states, point lights, wall shadows, and painted mist. It is available in the project menu and does not replace user artwork automatically.
- Next: finish the extended native run, visually inspect the day/night capture and light UI, update 0.3 docs/package and final handoff.

## Upgrade 0.3 — Step 4: full verification and packaging
- Full dark/day-night native run passed **80** interaction, pixel and asynchronous alpha-import checks. Report: `artifacts/studio-0.3.checks.json`.
- Imported non-square alpha normalization, white/black transparency, portable custom-alpha validation, and actual imported-alpha painting all pass. Invalid image formats are rejected.
- Verified map-size/aspect PNG dimensions, independent state persistence/undo, partial erasing and repaint order, fog layer visibility, exposure/vibrance pixels, spotlight cones and wall shadows, and exact requested UI color tokens.
- **24** model/preferences tests and **2** native atomic-storage tests pass. Bounded undo memory and failed-alpha decoding guards were added.
- Visually inspected dark Nightfall state with fog, cool shrine light and warm cottage lamps. README documents every requested control and practical limits.
- Built and inspected `artifacts/fable-map-studio_0.3.0_all.deb` (~274 KB; architecture all). The portable two-state example is `artifacts/Briarwood - Day and Night.fable`.
- Remaining: complete extracted-package verification/light-theme visual inspection and open the updated editor.

## Upgrade 0.3 — Step 5: final QA refinements
- Inspected the neutral light interface from extracted package files; controls, blue selection states and imported alpha preview are readable.
- Fixed zero-intensity light behavior: intensity 0 now disables both the light and its bloom; bloom strength scales with intensity. Added an export-pixel regression check.
- Rebuilt the final .deb and started its complete native verification, including image import and the day/night state capture.
- No further feature work is planned for this requested upgrade; remaining work is verification completion and opening the app.

## Upgrade 0.3 — Step 6: delivered
- Final extracted-package verification passed **81/81** native checks, including zero-intensity bloom, alpha import, light occlusion, dynamic PNG dimensions and complete map-state round trips.
- Model/preferences **24/24**, native storage **2/2**, and Python compilation pass. Inspected dark and light screenshots.
- Package, state example, screenshots, check reports, README and current handoff are ready. Updated app opened for the user.
- No required work remains for the requested upgrade; future scope is listed at the top.

## Fog fix 0.3.1 — Step 1
- User reported visible repeated fog tiles, painted fog ignoring lighting/Global haze, and unwanted automatic fog. Fix all three while preserving existing painted strokes.
- Root causes: atmosphere textures are clipped 512 px images repeated by createPattern; atmosphere is composited after world lighting; the haze slider generates six unrelated fog banks in drawLighting.
- Plan: continuous non-periodic world-space atmosphere fields; light the painted atmosphere while preserving its alpha; haze scales painted fog/mist/smoke only; remove automatic banks.
- User additionally authorized pushing the completed app/fix to https://github.com/ozzy-apps/dndmaps. Verify, then commit/push without overwriting remote history.

## Fog fix 0.3.1 — Step 2: implementation
- Added pure absolute-coordinate, warped multiscale cloud fields in `app/atmosphere-field.js`. Atmosphere now uses a map-sized atlas and world-space mask sampling instead of repeated 512 px tiles. Weather particles also use the full map.
- Painted atmosphere receives the same ambient shade as the scene and source colors/cones/wall shadows with source-atop compositing, preserving painted alpha. Brush previews use the same lighting. Grading remains after atmosphere.
- Removed all automatic haze banks. Global haze scales painted fog/mist/smoke (0 clears, 40 neutral, 80 doubles); new maps use 40 with no painted atmosphere. Existing projects/states retain saved values and strokes.
- Updated 0.3.1 metadata/documentation. Remote repository is empty; separate Git checkout is `/tmp/fable-dndmaps-publish` because workspace `.git` is a read-only placeholder.
- Next: regression tests for seams, lighting, alpha, haze, persistence and large-area painting; native QA; package; commit/push verified files.

## Fog fix 0.3.1 — Step 3: source verification
- Native interaction/pixel/async tests pass **99/99**. Tests cover seams across 512/1024 boundaries, non-repetition, ambient/source color, cone/shadow behavior, alpha preservation, erasing, exact preview matching, haze slider pixel changes, unpainted maps, and save/load determinism.
- Model tests **26/26** and atomic native storage **2/2** pass.
- Visually inspected `artifacts/fog-fix.png`: painted fog covers most of a 1536 × 1280 woodland map with warm/cool lighting and no square seams. Added `--capture-scene fog` for repeatable large-area QA.
- Regenerated bundled .fable demos with current defaults. Added persistent `AGENTS.md` user instructions and ignore rules for local QA/older packages.
- Next: build/inspect/extract .deb, verify the packaged app, then commit/push to main and verify remote SHA.

## Fog fix 0.3.1 — Step 4: package verified, publication ready
- Built and inspected architecture-all .deb 0.3.1 (282,250 bytes), extracted it into `/tmp/fable-0.3.1-check`, and verified **99/99** native checks from packaged files. No system installation required.
- Inspected the packaged light-theme large-area fog capture (`artifacts/fog-fix-package.png`). Cloud textures are continuous and ambient/source lighting applies.
- Prepared initial main-branch source, licenses, docs, tests, three portable examples and latest .deb in the separate Git checkout. Older packages and generated QA images/reports remain local.
- Next: commit/push to the explicitly authorized GitHub repository and verify the remote commit matches.
