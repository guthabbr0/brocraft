# BroCraft 1.2: Living World

## Play this edition

Open `index.html`, or the standalone `BroCraft-LIVING-WORLD.html`, in a full desktop browser tab. Everything needed to play is inside that HTML file, including the original score and the new foley bank. No account, installation, CDN or runtime asset download is required.

From the title, open **Sound studio > Living world lab**. Click an animal, compare materials and tools, or choose **Enter the listening glade** to explore a real, editable Creative soundcheck world. Sound studio is also available from Options and the pause menu.

Begin with a low device volume and raise it gradually. Software peak control limits digital samples, not physical speaker or headphone output.

## A world with its own voice

The new bank contains **385 original synthesized clips**. It is embedded as one MP3 audio sprite and decoded once, then small regions are played for individual events. These are synthesized sounds, not recordings of real animals.

| Category | What is included | Clips |
|---|---|---:|
| Materials | 14 material families, 4 actions, 4 variants per action | 224 |
| Tools | Pickaxe, axe, shovel, sword and hand layers, across 4 synthesis tiers with 3 variants | 60 |
| Creatures | 8 species, each with 4 idle, 2 hurt and 2 death calls | 64 |
| World events | 11 events, each with 3 variants | 33 |
| Continuous textures | Wind, water, cave and night loops | 4 |
| **Total** | | **385** |

The four synthesis tiers for bare hands are authoring-bank variants; ordinary gameplay uses the first hand tier. The 16 actual craftable tools retain their existing Wood, Stone, Iron and Aether tiers.

**Creatures:** Cloud sheep bleat; Meadow oxen moo; Snoutlings grunt; Peeps cluck. The Night husk, Bone archer, Cave crawler and Fuse stalker have distinct growls, rattles, scraping chatter and hisses. Idle calls have individual timers instead of a constant chorus. Hurt and death reactions are separate. Small footfall layers accompany nearby moving animals.

**Materials:** stone, wood, dirt, grass, sand, gravel, glass, snow, ice, leaves, wool, metal, crystal and water. Footsteps, mining, final destruction and placement each have separate textures. Four variants per action avoid consecutive identical samples. Mining combines the target material with the actual held tool. Ordinary building blocks use the hand overlay, never a tool inferred from the block's preferred harvesting tool.

**World details:** ambient birds, crickets, cave drips, water, bubbles and fire; chest opening and closing, inventory cloth, landing, weapon swishes and tool breakage. Loop beds fade as the environment changes or the world pauses. A bounded nearby scan detects water and fire sources; this is a deliberately lightweight approximation rather than an acoustic simulation of every block.

## Space, surfaces and the soundtrack

Positional foley follows the listener's heading and source location using stereo panning, distance attenuation and filtering. Moving creature sources update while playing. A bounded, read-only voxel ray checks intervening opaque solid blocks; walls soften the source and reduce its high frequencies. It does not generate terrain for audio queries.

A shared stereo convolution effect adds short reflections, with a stronger send in caves. Underwater playback keeps the existing environmental filtering. **Directional stereo** can be switched off; the source becomes centred while the room effect may still have a small stereo spread. This is stereo positioning, not HRTF headphone rendering or physically complete propagation.

The original **First Light, Last Stand** composition and its four synchronized 128 s stems remain unchanged. Exploration, night, cave, underwater and combat arrangements continue blending without restarting the score. **Give the world room** briefly lowers the music for nearby animal calls and breaking blocks. Disable it in the lab for an uninterrupted music level.

**Score & mix** includes separate Master, Soundtrack, Sound effects, Creature voices and World ambience controls, plus bass, treble, epic intensity and cave resonance. Creature volume is nested under Sound effects. The Cinematic, BOOM BOOM and Soft presets remain available. Presets reset all their included audio controls, including the new settings.

The lab's **Solo world audio** is temporary. It does not save a music mute; leaving the studio restores the score. Optional **Sound captions** show brief labels and approximate directions for selected calls and events, not every possible sound.

## The listening glade

This is an ordinary new Creative world, not a static menu scene. It has fourteen material lanes with destructible pillars, four animal stalls, a small stone listening chamber, water, a torch, and real workbench, furnace and chest blocks. The hotbar includes four pickaxe tiers and iron tools. The terrain, walls and props can be edited and saved normally.

The glade button only creates a world from the title context. While another world is active it is disabled, so it cannot replace the current adventure. Save and quit first. World generation outside the small glade remains the normal seeded BroCraft terrain.

## Browser-safe controls

| Default input | Action |
|---|---|
| W A S D | Move |
| Shift, either side | Sprint |
| C | Crouch, edge protection; descend during Creative flight |
| Space | Jump, swim up, rise during flight |
| Double-tap Space | Toggle Creative flight |
| E | Inventory |
| G | Controls and field guide |
| Q | Drop one item |
| M | Mute all audio |
| N | Toggle soundtrack |
| F5 | Save world |
| F3 | Diagnostics |
| Escape | Release pointer / pause / close inventory |
| 1-9 and mouse wheel | Hotbar selection |

Open **Controls**, scroll to **Make it yours**, click a binding and press a new key. Fourteen gameplay actions are configurable. Conflicts swap places; Escape cancels capture. Bindings save through the normal options store, and on-screen key hints follow the changes. Restore defaults returns Shift sprint and C crouch.

Control, Alt, Meta, browser navigation keys and hotbar number keys are not assignable. The accepted set is letter keys, arrow keys, Space, Shift, F2, F3 and F5. Escape and the mouse buttons remain fixed. Shift-click continues to transfer inventory stacks, independently of the sprint binding.

**Ctrl+W is no longer part of the gameplay controls.** A delivered Ctrl+W or Meta+W event is suppressed during active play, but a browser can reserve it before the page receives it. Do not rely on JavaScript alone to disable native browser shortcuts.

**Warn before closing an active world** is enabled by default. It requests a browser leave confirmation and writes the existing best-effort recovery snapshot. Browsers control whether the confirmation appears; it is not a guarantee against tab closure or data loss. An inactive title screen does not request it.

**Fullscreen W protection** is optional and starts only after an explicit click. Where supported and permitted, the game requests Keyboard Lock for W while actively pointer-locked and in fullscreen. It releases the lock when leaving those conditions. Escape is never requested. Restricted previews, browsers or devices may reject this feature; ordinary Shift/C controls do not depend on it.

## Keep your current world

The world-save schema is unchanged. Export a backup from the old EPIC edition before switching: **Pause > Export backup**. In this edition use **Singleplayer > Import save** to create a separate copy.

The optional Python launcher retains the same default localhost origin and port. Use the same browser profile and origin to retain access to browser-local worlds. Storage associated with a directly opened file varies by browser; exported JSON backups are the dependable transfer route.

## Other fixes

Building blocks and tools share item metadata. A block's preferred harvesting tool could previously be mistaken for a held tool, resulting in a non-finite mining duration. Mining now requires an actual durable tool before applying its speed bonus.

The new worst-case audio stress render exposed a reconstruction overshoot after the original oversampled shaper. A second, non-oversampled output shaper now bounds final digital samples before the master gain. Normal-level signals below its knee are unchanged. This does not establish a safe physical listening level.

## Source, provenance and limitations

The reference site supplied in the request, `https://mcopus55-1.vercel.app/`, was inaccessible from the build environment. No source, audio asset or recording could be inspected there. This edition implements the requested species-specific voices and varied foley independently; it is not an exact port, an audited match, or a measured A/B comparison with that site.

The terrain renderer and original music assets are retained. No multiplayer or hosting feature was added. Existing gameplay boundaries remain: basic creature pathfinding, static liquids, a fixed vertical world height and no claim of full Minecraft feature parity.

Build the standalone game with Python's standard library:

```sh
python3 build.py --standalone BroCraft-LIVING-WORLD.html
```

The main new files are `src/foley.js`, `src/controls.js`, `src/soundcheck.js`, `assets/audio/living-world.json`, and `tools/compose_foley.py`. Re-rendering the bank requires NumPy, SciPy, SoundFile and FFmpeg; these are authoring dependencies only. `assets/audio/Living-World-Soundcheck.mp3` is a short sequence of the actual bank clips, not a separately embellished demo.

See `tests/LIVING-WORLD-TESTING.md` and its adjacent JSON reports for executed tests and measured limits. Physical listening, native storage persistence after browser restart, other browser engines, native Keyboard Lock permission flows and desktop-GPU frame rates were not verified here.
