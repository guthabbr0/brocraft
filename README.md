# BroCraft 1.2: Living World

An original, offline-first voxel survival sandbox with an adaptive cinematic score, a new species-specific creature and material soundbank, and configurable browser-safe controls.

## New in this edition

**Shift sprints. C crouches.** Both are configurable in Controls. Control is no longer a movement modifier. Optional active-world close confirmation and fullscreen W protection add browser-dependent safeguards.

Open **Sound studio > Living world lab** to audition eight creature voices, compare fourteen materials and tool tiers, or enter **The listening glade**, a real editable Creative soundcheck world. The embedded bank has 385 original synthesized clips. Positional stereo, wall muffling, cave reflections, natural ambience and optional captions bring the environment forward without replacing the original four-layer score. Start with a low device volume.

Read `LIVING-WORLD.md` for the full guide and `tests/LIVING-WORLD-TESTING.md` for this edition's verification. `EPIC-AUDIO.md` remains the prior soundtrack's authoring documentation, not this edition's current testing report.

The world-save schema remains compatible. Export a backup before switching HTML files or browser storage origins; import it through Singleplayer to create a separate copy.

## Start playing

**The simplest route:** open `index.html` in a desktop browser, choose **Create a new world**, choose Survival or Creative, then click **Enter world**. The standalone `BroCraft-LIVING-WORLD.html` edition contains exactly the same game in one file.

Open the actual HTML file in a full browser tab; not a file preview or embedded chat viewer. The game requires WebGL 2 and pointer lock. Allow the browser to capture the mouse when entering a world. Press Escape to release it.

**For a consistent save location:** use the included optional localhost launcher. It requires Python 3, but no Python packages:

```sh
python3 run.py
```

On Windows, double-click `play.bat` or run `py -3 run.py`. On macOS/Linux, run `sh play.sh`. The launcher opens:

```text
http://127.0.0.1:8765/index.html
```

Keep the terminal open while playing. Ctrl+C stops the launcher. It binds only to `127.0.0.1`, not your network interface. Use the same address and port for the same browser saves.

```sh
python3 run.py --no-browser
python3 run.py --port 8766
```

Changing the browser profile, host, or port changes the local save location. Export a backup before switching. Direct-file browser storage can behave differently from a stable localhost origin.

## Your first day

The default seed is `first-light`. New Survival worlds begin with an empty backpack on dry ground near trees.

1. Walk up to a tree. Hold left mouse on the trunk until the log breaks; walk over the dropped log to collect it. Gather at least three logs.
2. Press **E**. Use the recipe book to make planks, sticks, and a workbench. **Fill crafting grid** moves real ingredients from your inventory; click the result to actually craft it. Shift-click the result to put crafted items directly into your backpack.
3. Put the workbench in the hotbar. Select it, look at the ground, and right-click to place it. Right-click the placed workbench to open its larger crafting grid.
4. Make a wooden pickaxe from three planks and two sticks. Use it on stone to collect cobblestone. Upgrade to stone tools and build a furnace.
5. Mine coal or smelt logs into charcoal. Combine coal/charcoal with a stick for torches. Build a shelter before dark, and place torches inside.
6. Harvest berry shrubs with right mouse or obtain meat from wildlife. Cook meat in a furnace. Select food and right-click to eat. A bedroll made from wool and planks sets your respawn point and lets you skip the night.

The recipe book explains ingredient costs and marks recipes that require a workbench. Recipes also work when placed manually, including mirrored tool layouts and shifted patterns.

## Controls

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Look |
| Space | Jump; swim upward |
| Shift | Sprint |
| C | Crouch; descend while flying |
| Left mouse | Hold to mine; attack creatures |
| Right mouse | Place, use a workstation, harvest berries, or eat |
| 1-9 / mouse wheel | Select the hotbar slot |
| E | Open/close inventory |
| Escape | Pause / close inventory |
| Q | Drop one held item |
| G | Field guide |
| M | Mute/unmute all audio |
| N | Toggle the soundtrack |
| F3 | Frame, chunk, position, and lighting diagnostics |
| F5 | Save the world |
| Double-tap Space | Toggle flight in Creative |
| Middle mouse | Copy the targeted block in Creative |

**Inventory:** click or drag to move a stack; right-click to take half; right-click with a held stack to deposit one; click a different item to swap; Shift-click to transfer. Closing the inventory returns held/crafting items to your backpack, dropping overflow safely into the world. Tool durability is shown below its icon.

**Creative:** all items are available in the inventory's Catalog tab. Click a catalog entry to take a stack; Shift-click to add it to your backpack. Blocks are unlimited, breaking is nearly instant, and survival damage is disabled. Flight still respects solid-block collision.

## Included gameplay

### A generated world, not a fixed scene

Seeded terrain streams in 16 × 16 × 96 chunks. It includes meadows, woodlands, highlands, deserts, snowfields, shores and oceans, with river channels, submerged basins, caves and ravines. Oak and birch trees, conifer-shaped snowy trees, flowers, grass, ferns, mushrooms, berry shrubs and cacti populate suitable areas. Rare cabins and ruins offer shelter or loot.

Coal, iron, copper, gold, emberstone and aether resources occur underground at different depths. Deepstone, bedrock and deep lava form the lower world. There are 42 non-air block types, 19 additional material/food items and 16 tools across Wood, Stone, Iron and Aether tiers.

### Gathering, crafting and building

Mining uses block hardness, preferred tools and resource-tier requirements, with progress feedback, particles, sounds and collectible drops. Placement is against the selected face and cannot put a solid block inside the player. The actual inventory controls building and tool use.

There are 27 spatial crafting recipes, personal 2 × 2 crafting, placed 3 × 3 workbenches, 27-slot chests and three-slot furnaces. Furnaces consume fuel and process materials while their interface is closed, as long as the world simulation is running. They pause when the world is paused or closed; they do not calculate offline wall-clock progress.

### Survival and creatures

Health, hunger, regeneration, drowning, fall damage, cactus/lava damage, death, dropped inventory and respawning are implemented. Dropped items expire after five minutes of simulated world time.

Four peaceful creatures;Meadow ox, Snoutling, Cloud sheep and Peep;wander and flee when hurt. Four hostile types;Night husk, Bone archer, Cave crawler and Fuse stalker;pursue or attack under their respective conditions. Archers fire visible projectiles; stalkers warn before exploding and can damage terrain. Weapons have different damage and cooldowns. Creature AI is intentionally basic rather than a full navigation system.

### Atmosphere and presentation

A 15-minute day/night cycle drives sky brightness, the square sun and moon, stars and hostile activity. Caves have reduced skylight, torches propagate local illumination, and meshes include baked ambient occlusion. Water is translucent and supports swimming, buoyancy and an underwater overlay.

There is an animated first-person hand/held item, view bobbing, a selected-block outline, progressive mining cracks, particles, tooltips, status feedback and synthesized sounds. The menus include world creation, saved worlds, options, controls, pause, death, import and export.

## Saving and backups

The production save store uses IndexedDB, with a localStorage fallback. It stores the seed, edited blocks, player position and orientation, inventory and durability, health/hunger, world time and mode, station contents and furnace progress, nearby creatures, drops and journey progress.

The game autosaves every 45 seconds of active simulation. Use **F5**, **Save world**, or **Save & quit** for a manual save. A save failure is shown rather than silently reported as success.

**Export backup** in the pause menu creates a `.brocraft.json` file. **Singleplayer → Import save** creates a separate world copy from that file. Keep exported backups before clearing browser data or moving between browsers. Browser storage is not cloud storage.

A best-effort unload recovery record is also written, but it is not a replacement for manual backups.

## Performance and implementation boundaries

The renderer uses hidden-face culling, per-chunk meshes, frustum culling, an original atlas, separate transparent geometry, incremental chunk generation/rebuilding, limited creature simulation distance and chunk unloading. It does not create a scene object for every terrain cube.

For slower machines, reduce Render distance and Render resolution in Options. The supplied test environment used software-rendered Chromium rather than a desktop GPU; **60 FPS on normal hardware has not been established by a benchmark**.

This is a playable original implementation, not feature parity with Minecraft. Not included: multiplayer, automation circuits, enchantments, equipment/armor systems, advanced creature pathfinding, a player bow, dynamic flowing liquids, greedy meshing, worker-thread generation, wall-mounted torches, or complex settlements/mineshaft structures. Water/lava are generated or placed cells rather than a fluid solver. The world has a fixed vertical height of 96 blocks and horizontally streamed terrain. Very distant coordinates are subject to floating-point/rendering limits.

The inventory does not pause survival simulation. Escape opens the actual pause menu. Do not spend the night sorting items unprotected.

## Source and tests

```text
index.html             Ready-to-play, self-contained build
src/core.js            Definitions, inventory utilities, recipes, smelting, terrain, DDA raycast
src/render.js          Procedural assets, WebGL 2, atlas, mesh generation and lighting
src/audio.js           Adaptive score, mixer, EQ, peak control and diagnostics
src/foley.js           Soundbank playback, positioning, occlusion, room effect and ambience
src/controls.js        Saved rebinding and optional browser-shortcut safeguards
src/soundcheck.js      Editable listening-glade world construction
src/game.js            Player simulation, interactions, streaming, saving and rendering
src/creatures.js       Creature geometry, AI, combat and projectiles
src/ui.js              Menus, inventory, crafting and startup
src/style.css          Interface styling
src/shell.html         Document skeleton
build.py               Standard-library single-file builder
run.py                 Optional local HTTP launcher
play.bat / play.sh     Launcher shortcuts
assets/audio/          Original score stems, 385-clip foley bank and listening samplers
tools/compose_score.py Original composition and synthesis source
tools/compose_foley.py Original animal, material and ambience synthesis source
LIVING-WORLD.md        Current controls, audio, transfer guide and implementation notes
EPIC-AUDIO.md          Prior score authoring documentation
tests/                 Game/audio test suites, reports and verification limits
```

Rebuild with `python3 build.py`. To also write a separately named copy:

```sh
python3 build.py --standalone BroCraft-LIVING-WORLD.html
node tests/core.test.cjs
```

The browser suite additionally requires Playwright and a Chromium executable. Its explicit in-memory storage adapter exists **only in the test harness**, not in the game. See `tests/LIVING-WORLD-TESTING.md` for coverage, commands and verification limits.

All engine code, game art and sound generation in this project are original. No proprietary Minecraft assets are included. The project is distributed under the included MIT license.
