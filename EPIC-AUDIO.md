# BroCraft 1.1: Epic Audio Edition

## Play

Open `index.html` in a full desktop browser tab. The standalone copy is named `BroCraft-EPIC.html`. Everything needed to play, including all four soundtrack layers, is embedded in that file. No installation, streaming account, or runtime network access is required.

Click **Sound studio**, then choose **Cinematic**, **BOOM BOOM**, or **Soft**. The score starts after a click, and the ordinary world-creation and game controls are unchanged. Sound studio is also accessible through Options and the pause menu.

Start with the device volume low and raise it gradually. The new effects and music are considerably stronger than the original mix. The software has compression and peak control, but it cannot control physical speaker or headphone output levels.

## The new score

**First Light, Last Stand** is an original 128-second hybrid orchestral/synth composition, arranged as a continuous 64-bar loop. It is synthesized, not a recording of a live orchestra. No existing film score, commercial song, proprietary game sound, or external sample library was used.

Four stereo layers start at the same audio-clock timestamp and keep the same loop boundaries:

| Layer | Musical role |
|---|---|
| Horizon | Sustained strings, vowel-like choir textures, and a recurring piano figure |
| Motion | Alternating staccato upper strings and a lower cello-like pulse |
| Titan | Low brass foundations and a slower horn-like melody |
| Impact | Large modal drums, tom answers, sub-bass accents, cymbals, and rising noise swells |

The layers crossfade rather than restarting when the scene changes. Exploration opens the mix; night and caves emphasize tension and low resonance; nearby hostiles or low health bring in the action layers. Underwater playback is filtered. Pausing returns to a lighter menu arrangement while keeping the musical transport running.

**Epic intensity** increases the action layers throughout the game. **BOOM BOOM** pushes those layers forward even outside combat. **Audition a mood** previews each arrangement in the studio; leaving the studio returns to adaptive mode.

The separate `assets/audio/First-Light-Last-Stand.mp3` is a listening arrangement of the same composition, with its own introduction, build, quieter passage, climax, and ending. The game uses the synchronized stems instead of this mastered listening file.

## Mixer and shortcuts

The studio provides independent Master, Soundtrack, Sound effects, and World ambience levels. Bass and treble use shelves centred at 110 Hz and 4.2 kHz. The interface displays their dimensionless amplitude multipliers. All changes apply while audio is playing and are saved through the existing settings system.

**M** toggles all sound. **N** toggles only the soundtrack. These shortcuts are ignored while typing in an input field. The studio also includes an impact test, a spectrum display, playback position, and an explicit enable/retry button.

The original effects have been rebuilt with stronger bodies, clearer transients, and longer low-frequency tails where appropriate. Mining and footsteps retain material-dependent variation. Important damage and explosion sounds briefly lower the music so their feedback stays distinct.

The audio graph has separate channel gains, environmental filters, bass and treble EQ, a compressor, a soft peak ceiling, and a final master gain. Gain changes are ramped to reduce clicks. Completed effect voices disconnect, simultaneous effects are capped, and repeated clicks or music toggles do not create duplicate soundtrack players. Audio suspends when the page is hidden and resumes when the browser allows it.

## Keep your world

The world generator and save schema are unchanged. Before moving to the new HTML file, export a backup from the original game's pause menu. In this edition, open **Singleplayer > Import save** to bring that world across as a separate copy.

The optional `python3 run.py` launcher still serves the game at the same localhost address and port. Use the same browser profile and origin to retain access to the same browser-local storage. Direct-file storage can vary across browsers; exporting a backup is the reliable transfer route.

An old explicit master setting of zero is preserved. The original low, nonzero default is raised on the first upgrade; other new controls receive the Cinematic defaults. Existing gameplay settings are retained.

## Build and source

`python3 build.py` rebuilds the ready-to-play `index.html` with Python's standard library. `python3 build.py --standalone BroCraft-EPIC.html` also writes a named standalone copy. The four MP3 stems are embedded as base64; playing the game does not fetch them separately.

`src/audio.js` contains the mixer, procedural effects, scene routing, transport, and audio diagnostics. `tools/compose_score.py` contains the original composition and instrument synthesis. Re-rendering the music requires Python with NumPy, SciPy, and SoundFile, plus FFmpeg. Those are authoring dependencies only, not game dependencies.

The score uses deterministic additive voices, detuned ensembles, resonant drum modes, and a synthesized stereo reverb impulse. Reverb tails are wrapped into the stem starts. The original stem timing is preserved when encoded and decoded; the delivered Chromium test decoded all four stems to exactly 128 seconds.

## Verification and limitations

See `tests/EPIC-TESTING.md` and the adjacent JSON reports for the executed checks. They exercise real Web Audio signal rendering, controls, scene routing, loop playback, mute, source cleanup, and live game integration.

The environment blocks ordinary browser navigation, so the browser tests load the exact HTML with `page.set_content` and use an explicit test-only in-memory storage adapter. Native storage durability across browser restarts was not reverified. The test adapter is not in the distributed game. Audio was inspected through real browser analysers and offline signal rendering; physical speaker/headphone output and subjective listening quality were not verified here. Other browser engines were not exercised in this run.

The compressed score increases the standalone file size and decoded audio memory use compared with the original effects-only edition. The game keeps four decoded stereo stems in memory to support synchronized crossfades. The soundtrack is one original composition with adaptive arrangements, not an unlimited catalogue of songs.
