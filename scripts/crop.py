"""Rectangular crops of each card's photo panel (flag background kept) + the round-thumbnail sprite.
Only visible missionaries (sprite-order.json, written by data.mjs) are processed."""
import sys, os, json
from PIL import Image

cards, out = sys.argv[1], sys.argv[2]
ids = json.load(open(os.path.join(out, 'sprite-order.json')))
os.makedirs(os.path.join(out, 'photos'), exist_ok=True)

PANEL = {152: (680, 245, 1080, 545)}            # white-layout card: photo sits on the right
TOP, BOTTOM, LEFT, MAX_RIGHT = 207, 692, 6, 652
FACE = {152: (730, 250, 1030, 550)}
FACE_DEFAULT = (100, 215, 560, 675)             # square around faces for the round thumbnail


def text_column_start(im):
    """Where the description text column begins. That column holds only black ink on the peach
    background (every pixel is peach scaled toward black), while photos and flags have other colours.
    Returns the left edge of the run of such 'ink-on-peach' columns that reaches x=689, minus a gap."""
    bg = im.getpixel((8, 8))
    px = im.load()
    def inky(p):
        r = [p[c] / max(bg[c], 1) for c in range(3)]
        return max(r) - min(r) < 0.10 and max(r) < 1.06
    def col_text(x): return all(inky(px[x, y]) for y in range(TOP + 15, BOTTOM - 5, 2))
    x = 689
    while x > 540 and col_text(x):
        x -= 1
    start = x + 1
    if start > 688:          # no text column inside the window
        return MAX_RIGHT
    # walk back to the first column that actually has ink (skip the clean peach gutter)
    while start < 689 and all(sum(px[start, y]) > 3 * min(bg) - 40 for y in range(TOP + 15, BOTTOM - 5, 2)):
        start += 1
    return min(MAX_RIGHT, start - 12)


T, COLS, ROWS = 120, 16, 10
assert len(ids) <= COLS * ROWS
sprite = Image.new('RGB', (T * COLS, T * ROWS), (220, 232, 241))
rights = {}
for k, i in enumerate(ids):
    im = Image.open(os.path.join(cards, f'{i}.png')).convert('RGB')
    if i in PANEL:
        box = PANEL[i]
    else:
        right = text_column_start(im)
        rights[i] = right
        box = (LEFT, TOP, right, BOTTOM)
    im.crop(box).save(os.path.join(out, 'photos', f'{i}.jpg'), quality=86, optimize=True, progressive=True)
    sprite.paste(im.crop(FACE.get(i, FACE_DEFAULT)).resize((T, T), Image.LANCZOS), ((k % COLS) * T, (k // COLS) * T))
sprite.save(os.path.join(out, 'thumbs.jpg'), quality=84, optimize=True)
narrowed = {i: r for i, r in rights.items() if r < MAX_RIGHT}
print('photos:', len(ids), '| narrowed to avoid text:', narrowed)
