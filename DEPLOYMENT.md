# BroCraft Living World: hosted release

The playable static game is `public/index.html`. It includes all gameplay code, the four-layer original score, and the Living World foley bank. No runtime network dependencies are required after the page has loaded.

## Vercel

Import this repository, select branch `main`, Framework Preset **Other**, and Root Directory **.**. The checked-in `vercel.json` selects `public` as Output Directory and disables the build and install commands. No environment variables are needed. The import staging branch is not deployed.

## Build locally

To assemble the single-file game using the checked-in audio assets:

```sh
python3 build.py
```

To run the complete publication verification (Node, FFmpeg and Python audio dependencies required):

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-build.txt
.venv/bin/python scripts/build_static.py
```

The build workflow runs after source changes on `main`. It verifies cached audio, regenerates assets when the composition source changes, runs the 22 core tests, verifies clip counts and stem lengths, checks JavaScript syntax and commits the updated static output. A branch that changes during a build is never overwritten.

## Provenance and limits

The 22 source files were imported from the BroCraft 1.2 Living World project supplied in this conversation. `SOURCE-IMPORT.json` records the original file hashes. Audio assets were regenerated using those original deterministic composers, not fetched from another game. Encoded MP3 bytes can differ between toolchain versions.

`BUILD-REPORT.json` describes the publication checks actually executed. The full historical browser test suites and screenshots remain in the original downloadable project archive; this publication job does not claim to rerun those suites.

Worlds remain stored in the browser. Use the game's Export backup and Import save controls to transfer them to the hosted origin or another device.
