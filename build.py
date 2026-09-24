#!/usr/bin/env python3
"""Build the offline single-file edition. No third-party packages required."""
from pathlib import Path
import argparse
import base64
import json


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--standalone', type=Path, help='Also write a standalone copy to this path')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    css = (root / 'src/style.css').read_text(encoding='utf-8')
    scripts = ['core.js', 'controls.js', 'render.js', 'audio.js', 'foley.js', 'game.js', 'creatures.js', 'soundcheck.js', 'ui.js']
    js = '\n\n'.join((root / 'src' / name).read_text(encoding='utf-8') for name in scripts)
    score_dir = root / 'assets/audio'
    data = {'title': 'First Light, Last Stand', 'duration': 128,
            'stems': {name: base64.b64encode((score_dir / f'{name}.mp3').read_bytes()).decode('ascii')
                      for name in ('horizon', 'motion', 'titan', 'impact')}}
    foley = json.loads((score_dir / 'living-world.json').read_text())
    foley['audio'] = base64.b64encode((score_dir / 'living-world.mp3').read_bytes()).decode('ascii')
    js = 'const FOLEY_DATA=' + json.dumps(foley, separators=(',', ':')) + ';\n' + js
    js = 'const SOUNDTRACK_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n' + js
    if '</script' in js.lower():
        raise ValueError('Unsafe inline script terminator in the source')
    html = (root / 'src/shell.html').read_text(encoding='utf-8')
    html = html.replace('/*__CSS__*/', css).replace('/*__SCRIPT__*/', js)
    (root / 'index.html').write_text(html, encoding='utf-8')
    if args.standalone:
        args.standalone.write_text(html, encoding='utf-8')
    print(f'Built index.html: {len(html.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    main()
