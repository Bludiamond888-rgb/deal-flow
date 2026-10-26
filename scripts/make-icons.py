"""Generate PWA / iOS icons — slate tile with indigo flow mark."""
from PIL import Image, ImageDraw
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
SLATE = (15, 23, 42, 255)       # #0f172a
INDIGO = (79, 70, 229, 255)     # #4f46e5
GREEN = (22, 163, 74, 255)      # #16a34a
WHITE = (255, 255, 255, 255)

def mark(d, cx, cy, s):
    # three stacked flow bars suggesting a Sankey
    bars = [
        (cx - s * 0.32, cy - s * 0.28, s * 0.38, s * 0.14, WHITE),
        (cx - s * 0.08, cy - s * 0.06, s * 0.40, s * 0.12, INDIGO),
        (cx + s * 0.02, cy + s * 0.14, s * 0.30, s * 0.12, GREEN),
    ]
    for x, y, w, h, fill in bars:
        d.rounded_rectangle([x, y, x + w, y + h], radius=int(s * 0.04), fill=fill)
    # connector wedges
    d.polygon([(cx + s * 0.06, cy - s * 0.21), (cx + s * 0.18, cy - s * 0.06), (cx + s * 0.06, cy + s * 0.06)], fill=(148, 163, 184, 255))

def icon(size, mode):
    S = size * 4
    if mode == 'any':
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=SLATE)
        mark(d, S / 2, S / 2, S * 0.62)
    else:
        im = Image.new('RGBA', (S, S), SLATE)
        d = ImageDraw.Draw(im)
        mark(d, S / 2, S / 2, S * (0.5 if mode == 'maskable' else 0.62))
    return im.resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
icon(192, 'any').save(f'{OUT}/icon-192.png')
icon(512, 'any').save(f'{OUT}/icon-512.png')
icon(512, 'maskable').save(f'{OUT}/icon-maskable-512.png')
icon(180, 'apple').convert('RGB').save(f'{OUT}/apple-touch-icon.png')
icon(32, 'any').save(f'{OUT}/favicon-32.png')
print('ok')
