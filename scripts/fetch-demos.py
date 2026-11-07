"""Downloads and resizes the public-domain exercise photos used by the how-to demos.

Source: free-exercise-db by yuhonas (https://github.com/yuhonas/free-exercise-db), released under the Unlicense.
Usage: python3 scripts/fetch-demos.py  (reads demo ids from src/plan/exercises.ts)
"""
import io
import pathlib
import re
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "plan" / "exercises.ts"
OUT = ROOT / "public" / "demos"
BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

ids = sorted(set(re.findall(r"demo: '([^']+)'", SRC.read_text())))
print(f"{len(ids)} demos")
failed = []
for demo in ids:
    for frame in (0, 1):
        dest = OUT / demo / f"{frame}.jpg"
        if dest.exists():
            continue
        try:
            with urllib.request.urlopen(f"{BASE}/{demo}/{frame}.jpg", timeout=30) as r:
                img = Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception as e:  # noqa: BLE001
            failed.append(f"{demo}/{frame}: {e}")
            continue
        if img.width > 480:
            img = img.resize((480, round(img.height * 480 / img.width)), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, "JPEG", quality=72, optimize=True, progressive=True)
if failed:
    print("FAILED:\n" + "\n".join(failed))
    sys.exit(1)
print("done")
