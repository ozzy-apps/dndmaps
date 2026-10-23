# Fable Map Studio 0.3.1

An offline Linux map painter for DnD campaigns. Material 3 controls, neutral grey surfaces (`#18181a` in dark mode) and blue accents (`#0a84ff`), local project files, procedural materials, imported brush alphas, painted atmosphere, richer lighting, and independently editable map states.

## Install and run

```sh
sudo apt install ./artifacts/fable-map-studio_0.3.1_all.deb
```

Open **Fable Map Studio** in the application launcher, or run `fable-map-studio`. The architecture-independent package declares its Python, GTK 3 and WebKit2 4.1 dependencies. It does not bundle Chromium or install anything during the build.

From source: `npm start`. Browser preview: `npm run dev`, then open http://localhost:5173. The desktop needs your distribution's `python3-gi`, `gir1.2-gtk-3.0`, and `gir1.2-webkit2-4.1` packages.

## Map size and aspect ratio

Click the dimensions above the canvas or use **Project menu → Map size**. Set width/height from 256 to 4096 px per side. Aspect presets include square, 4:3, 3:2, 16:9 and portrait ratios.

- **Keep artwork size:** crop or expand the visible canvas. Artwork beyond its bounds is retained and can reappear when expanded.
- **Scale artwork:** scale rooms, walls, terrain, objects, markers, atmosphere, erasers and light positions/radii to fit. Stroke widths and object scales stay within supported bounds. Circular brushes scale by the geometric mean when changing aspect ratio.

Map resizing is undoable and affects the selected map state. The grid and feet per cell remain independently configurable.

## Painting tools

| Key | Tool | Behavior |
| --- | --- | --- |
| W | Walls | 12 stone, masonry, wood, palisade and hedge materials. Drag a straight wall; Alt constrains its angle to 45° increments. |
| F | Floors | 12 materials, including herringbone oak, mosaic, terracotta, carved stone, ice and earth. Round or square painting; square tips snap to cell centers. |
| R | Rooms | Rectangle, round or cavern floors with optional perimeter walls and an independent wall material. |
| T | Terrain | 12 grasses, mud, moss, water, dirt, gravel, marsh, sand, snow, ash and leaves. Paint under floors or as an overlay. |
| A | Atmosphere | Paint cloud fog, ground mist, smoke, darkness, rain, snowfall or embers. Color, opacity and alpha controls apply. |
| O | Objects | Stamp furniture and dungeon props. Adjust size/rotation; `[` / `]` rotate. |
| L | Lights | Eight source types, including spotlights, candles, lanterns and faerie lights. Set radius, color, intensity, falloff, bloom, direction, cone and optional wall shadows before placing. |
| M | Locations | Add numbered/named DM locations. Click to edit/delete; drag to move. |
| E | Eraser | Partially erase terrain, floors and painted atmosphere with the chosen alpha and opacity. The separate **Objects, walls & rooms** target removes geometry. |
| H | Pan | Drag to pan, or Space + drag from another tool. Scroll to zoom; `0` fits the map. |

**Shift + drag horizontally resizes the current brush without painting.** It also adjusts wall thickness, object size and light radius. The on-canvas HUD shows the result. Alt + drag constrains wall angles.

`G` toggles the grid; `S` toggles snapping. Grid sizes support 16–256 px, with 64/70/140 px presets. Set feet per cell in the inspector. `Ctrl+Z` / `Ctrl+Shift+Z` undo/redo; `Ctrl+S` / `Ctrl+O` save/open projects.

## Alpha textures and erasing

Paint and eraser brushes share seven tips: round, soft round, speckled, grunge, dry streaks, cloud and leaf scatter. Adjust opacity, edge softness, spacing, scatter, rotation and rotation jitter. Terrain also has noise and detail density controls. Brush detail randomness is seeded and survives project save/load.

Use the folder button beside **Alpha texture** to import PNG, JPEG or WebP images up to 4 MB and 4096 px per side. Images are normalized to a 256 × 256 portable PNG. Transparency is preserved; opaque images use white as paint and black as transparency. Up to 12 imported alphas are stored inside the project and shared by its map states.

Partial erasing is non-destructive: the original strokes remain in the project. New painting can refill erased areas because paint and eraser operations retain their order. Undo restores exact pixels. A floor eraser also cuts into room floor surfaces, leaving structural walls intact. Use the geometry target to remove walls, objects, rooms, lights or locations.

## Lighting and color

Ambient light controls overall darkness, including painted fog. **Global haze** scales painted fog, mist and smoke: 0% clears them, 40% uses the brush opacity, and 80% doubles it. It never adds fog to an unpainted area. Cloud fields are continuous across the map, with no repeating tiles. Colored lights, spotlight cones and wall shadows affect painted atmosphere; color grading applies afterward. Rain, snow, embers and painted darkness retain their own opacity.

In **Color & tonal range**, adjust exposure, vibrance, saturation, contrast, shadow lift, temperature and vignette. These settings affect map pixels and exports. Light sources support customizable color, intensity up to 200%, falloff, bloom, direction/cone and optional wall shadows. Wall shadows use a visibility polygon; nearby wall segments block direct light. The **Lighting** canvas view displays source radii.

The sun/moon buttons change only the editor's light/dark interface theme. They do not change artwork or exported map pixels. Per-light controls configure newly placed lights; existing lights can be removed with the geometry eraser and placed again.

## Map states

The state selector above the canvas switches between versions of the same map. Use **+** to duplicate the selected state, then name it (for example Intact, Flooded, Nightfall or Burned).

Each state retains its own dimensions, grid, artwork, lights, atmosphere and color grading. Switching preserves current edits automatically. The **…** button opens state management for renaming, duplicating, switching or deleting. Deletion is undoable; at least one state must remain. A project supports up to 12 states. The project name and imported alpha library are shared.

The project menu includes a dungeon, woodland campsite, and **day/night example**. The day/night example contains a daylight scene and a night version with warm lanterns, cool shrine light, wall shadows and painted mist. Loading an example asks before replacing the current project and is undoable.

## Saving and exports

Projects autosave locally. The desktop writes `~/.local/share/fable-map-studio/autosave.fable` atomically and saves editor preferences in `preferences.json` in the same folder. The browser uses local storage. **Save project** creates a portable `.fable` file containing all map states and custom alpha images.

Versions 1 and 2 migrate into schema 3. Newly saved schema-3 files require Fable 0.3 or later. Project import supports files up to 30 MB.

PNG export follows the selected state's actual dimensions at 1× or 2× resolution, with a 32-megapixel output limit. Maps above 8 megapixels use 1× export. Presets:

- Current view: visible layers, optional grid and current marker display.
- Player gridless / gridded: always omit DM locations.
- DM numbered / named: include a grid and the selected location display.

Exports include the selected state's atmosphere, grading and lights. Multiple-state projects suggest the state name in the exported filename.

## Verification and packaging

```sh
npm test
/usr/bin/python3 tests/native-storage.test.py
/usr/bin/python3 packaging/fable.py --smoke-test --screenshot artifacts/fog-fix.png --capture-theme dark --capture-scene fog --capture-tool atmosphere
npm run package:deb
dpkg-deb --info artifacts/fable-map-studio_0.3.1_all.deb
```

Model tests include fog continuity and haze scaling. Native checks also verify painted fog lighting, alpha preservation, erasing and large-area rendering. Native checks require a graphical session. Smoke mode isolates user autosave/preferences. Native interaction, pixel and asynchronous alpha-import results are saved beside screenshots as `.checks.json`; the generated high-resolution PNG is saved as `sample-map.png`.

## Stack and remaining boundaries

Vanilla JavaScript ES modules and Canvas 2D, bundled local fonts, a Python GTK 3/WebKit2 4.1 shell, and `dpkg-deb`. No NPM runtime dependencies or external accounts/services are required.

Walls remain straight strokes. Room shapes are rectangle/ellipse/procedural cavern. General selection/move/resize of existing props, walls and lights, doors/windows, custom prop packs, multiple floors, and dedicated VTT formats are future work. Painted weather is static in exported images. Large maps with many states/operations render more slowly; map limits, bounded undo storage and output-size limits keep memory use manageable.

See `handoff.md` for the current architecture and continuation notes. Font licenses are in `app/assets`.
