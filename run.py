#!/usr/bin/env python3
"""Serve BroCraft on a stable localhost origin. Python standard library only."""
from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765,
                        help='Local port; keep it unchanged to use the same browser saves (default: 8765)')
    parser.add_argument('--no-browser', action='store_true', help='Do not automatically open a browser tab')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('--port must be between 1024 and 65535')
    if not (ROOT / 'index.html').is_file():
        print('index.html is missing. Run: python build.py', file=sys.stderr)
        return 1
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as exc:
        print(f'Cannot start the local server on port {args.port}: {exc}', file=sys.stderr)
        print('Close another running BroCraft launcher, or choose a port with --port.', file=sys.stderr)
        print('Changing the port uses a different browser save location. Export a backup first.', file=sys.stderr)
        return 1
    url = f'http://127.0.0.1:{args.port}/index.html'
    print(f'BroCraft is ready: {url}', flush=True)
    print('Keep this window open while playing. Press Ctrl+C to stop.', flush=True)
    print('The server is bound to your own computer only.', flush=True)
    if not args.no_browser:
        timer = threading.Timer(0.5, lambda: webbrowser.open(url))
        timer.daemon = True
        timer.start()
    try:
        with server:
            server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print('\nBroCraft launcher stopped.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
