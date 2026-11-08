"""Turn cut-out photos into (1) web portraits for the card and (2) the round-thumbnail sprite for the board."""
import sys, os
from PIL import Image

photos, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'portraits'), exist_ok=True)

import json
# visible missionaries with photos only, in the same order as missionaries.js "sprite" index (written by data.mjs)
sprite_ids = json.load(open(os.path.join(out, 'sprite-order.json')))
T, COLS = 120, 16
rows = 10  # fixed 16 x 10 grid: the page's CSS sizes the sprite as 1600% x 1000%
assert len(sprite_ids) <= COLS * rows, 'sprite full: raise rows here and in the page CSS'
TINTS = [(255, 239, 196), (220, 232, 241), (227, 241, 236)]
sprite = Image.new('RGB', (T * COLS, T * rows), TINTS[1])
made, missing = 0, []
for k, i in enumerate(sprite_ids):
    src = os.path.join(photos, f'{i}.png')
    if not os.path.exists(src):
        missing.append(i)
        continue
    im = Image.open(src).convert('RGBA')
    w, h = im.size

    # portrait for the card: max 720px tall, transparent WebP
    scale = min(1.0, 720 / h)
    im.resize((round(w * scale), round(h * scale)), Image.LANCZOS).save(
        os.path.join(out, 'portraits', f'{i}.webp'), quality=82, method=6)

    # thumbnail: square from the top (faces), centered horizontally, on a soft palette tint
    side = min(w, h)
    left = (w - side) // 2
    sq = im.crop((left, 0, left + side, side)).resize((T, T), Image.LANCZOS)
    tile = Image.new('RGBA', (T, T), TINTS[k % 3] + (255,))
    tile.alpha_composite(sq)
    sprite.paste(tile.convert('RGB'), ((k % COLS) * T, (k // COLS) * T))
    made += 1

sprite.save(os.path.join(out, 'thumbs.jpg'), quality=84, optimize=True)
print('portraits:', made, 'missing:', missing)
