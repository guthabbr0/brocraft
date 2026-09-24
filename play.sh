#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
if command -v python3 >/dev/null 2>&1; then
    exec python3 run.py "$@"
elif command -v python >/dev/null 2>&1; then
    exec python run.py "$@"
else
    printf '%s\n' 'Python 3 is needed only for this optional launcher.' 'You can also open index.html directly in a desktop browser.' >&2
    exit 1
fi
