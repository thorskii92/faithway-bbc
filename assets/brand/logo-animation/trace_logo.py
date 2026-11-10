"""Trace the original logo (assets/brand/logo-full.jpg) into separate SVG parts for the animation.

Writes logo-parts.json (paths in a 1000x1000 space = 2x the 500px original) and diagnostic images.
Usage: uv run --with potracer --with pillow --with numpy --with scipy python -I trace_logo.py <logo.jpg> <outDir>
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
import potrace

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
UP = 8                      # upscale factor for sub-pixel accurate edges
TO1000 = 1000 / (500 * UP)  # traced pixel -> 1000-space

img = Image.open(SRC).convert('L')
big = img.resize((500 * UP, 500 * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.35))
L = np.asarray(big).astype(np.float32)
ink = L < 182               # midway between background (~251) and logo blue (~110)

def c1000(v):
    return round(v * TO1000, 2)

def trace(mask, alphamax=1.0, opttol=0.25):
    """potrace a boolean mask -> SVG path data (1000-space)."""
    ys, xs = np.nonzero(mask)
    y0, y1, x0, x1 = max(ys.min() - 4, 0), ys.max() + 5, max(xs.min() - 4, 0), xs.max() + 5
    bm = potrace.Bitmap(~mask[y0:y1, x0:x1])   # potracer treats False as ink
    path = bm.trace(turdsize=20, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=alphamax, opticurve=True, opttolerance=opttol)
    P = lambda p: f'{c1000(p.x + x0)} {c1000(p.y + y0)}'
    d = []
    for curve in path:
        d.append('M' + P(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                d.append('L' + P(seg.c) + ' L' + P(seg.end_point))
            else:
                d.append('C' + P(seg.c1) + ' ' + P(seg.c2) + ' ' + P(seg.end_point))
        d.append('Z')
    return ' '.join(d)

def bbox(mask):
    ys, xs = np.nonzero(mask)
    return [c1000(xs.min()), c1000(ys.min()), c1000(xs.max() + 1), c1000(ys.max() + 1)]

# ---------- the mark: everything above the word "Palawan" ----------
mark_limit = int(240 * UP)          # original y=240 (~1000-space 480)
mark = ink.copy(); mark[mark_limit:] = False
lab, n = ndimage.label(mark)
comps = []
for i in range(1, n + 1):
    m = lab == i
    area = int(m.sum())
    if area < 400: continue
    ys, xs = np.nonzero(m)
    comps.append(dict(i=i, area=area, cx=c1000(xs.mean()), cy=c1000(ys.mean()), box=bbox(m)))
comps.sort(key=lambda c: (c['box'][1], c['box'][0]))
print('mark components:')
for c in comps: print('  ', c)

parts = {}
def find(pred):
    for c in comps:
        if pred(c): return c
    return None

# dove: small parts at the very top (the outline may split into a few pieces)
dove_ids = [c['i'] for c in comps if c['box'][3] < 145 and 455 < c['cx'] < 575 and c['area'] < 60000]
dove = np.isin(lab, dove_ids)
# cross + road: the component that runs down the middle
cr = find(lambda c: c['box'][0] < 512 < c['box'][2] and c['box'][1] < 160 and c['box'][3] > 440)
crossroad = lab == cr['i']
# arcs: tall, beside the cross, above the book
arcs = [c for c in comps if c['i'] not in dove_ids and c['i'] != cr['i'] and c['box'][1] < 120 and c['box'][3] < 310]
arcs.sort(key=lambda c: c['cx'])
arcL, arcR = lab == arcs[0]['i'], lab == arcs[1]['i']
# book: everything else in the mark
used = set(dove_ids) | {cr['i'], arcs[0]['i'], arcs[1]['i']}
book = [c for c in comps if c['i'] not in used]
print('dove', dove_ids, 'cross/road', cr['i'], 'arcs', [a['i'] for a in arcs], 'book', [b['i'] for b in book])

# split cross from road where the stem starts to widen
rows = crossroad.sum(axis=1)
stem_w = np.median(rows[int(170 * UP / 2 * 2 / 2):int(260 * UP / 2 * 2 / 2)][rows[int(170 * UP / 2 * 2 / 2):int(260 * UP / 2 * 2 / 2)] > 0])
ys = np.nonzero(rows)[0]
cut = None
for y in range(int(150 * UP), ys.max()):
    if rows[y] > stem_w * 1.6:
        cut = y; break
cross = crossroad.copy(); cross[cut:] = False
road = crossroad.copy(); road[:cut] = False
print('stem width (px@up)', stem_w, 'cut y (1000-space)', c1000(cut))

# crossbar band (rows much wider than the stem)
bar_rows = np.nonzero(cross.sum(axis=1) > stem_w * 3)[0]
bar_y0, bar_y1 = c1000(bar_rows.min()), c1000(bar_rows.max() + 1)
stem_cols = np.nonzero(cross[int((bar_rows.max() + cut) / 2)])[0]
stem_x0, stem_x1 = c1000(stem_cols.min()), c1000(stem_cols.max() + 1)

# circle fit from both arcs (least squares on all arc pixels)
yy, xx = np.nonzero(arcL | arcR)
A = np.c_[2 * xx, 2 * yy, np.ones(len(xx))]
b = xx ** 2 + yy ** 2
cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
R = np.sqrt(c + cx ** 2 + cy ** 2)
def angles(m):
    yy, xx = np.nonzero(m)
    a = np.degrees(np.arctan2(yy - cy, xx - cx)) % 360
    return a
aL, aR = angles(arcL), angles(arcR)
# left arc runs from the bottom (~100deg) round through 180 to the top (~250deg); right from ~290 through 360 to ~80
aL_start, aL_end = float(aL.min()), float(aL.max())
aR_u = np.where(aR < 180, aR + 360, aR)
aR_start, aR_end = float(aR_u.min()), float(aR_u.max())
thick = float((arcL.sum() / (np.radians(aL_end - aL_start) * R)))
print('circle', c1000(cx), c1000(cy), 'r', c1000(R), 'thickness', c1000(thick), 'left', aL_start, aL_end, 'right', aR_start, aR_end)

# dove wings vs body: wings are the part above/left of the line from the tail-top to the neck
# (found from the dove's own outline; refined by eye in the diagnostic image)
dbox = bbox(dove)
print('dove box', dbox)

# white fill behind the dove line art (its silhouette)
dove_fill = ndimage.binary_fill_holes(ndimage.binary_closing(dove, iterations=UP))

# book halves: split by the spine
spine = c1000(cx)
book_parts = []
for bc in book:
    m = lab == bc['i']
    side = 'L' if bc['cx'] < spine else 'R'
    book_parts.append(dict(side=side, d=trace(m), box=bc['box']))

parts = dict(
    circle=dict(cx=c1000(cx), cy=c1000(cy), r=c1000(R), thick=c1000(thick),
                left=[aL_start, aL_end], right=[aR_start, aR_end]),
    arcL=trace(arcL), arcR=trace(arcR),
    cross=trace(cross), cross_info=dict(cut=c1000(cut), bar=[bar_y0, bar_y1], stem=[stem_x0, stem_x1], top=bbox(cross)[1], bar_x=[bbox(cross)[0], bbox(cross)[2]]),
    road=trace(road), road_box=bbox(road), crossroad=trace(crossroad),
    dove=trace(dove, alphamax=1.1, opttol=0.3), dove_fill=trace(dove_fill, alphamax=1.2, opttol=0.4), dove_box=dbox,
    book=book_parts, spine=spine,
)

# ---------- text: line and word boxes from the original ----------
text = ink.copy(); text[:mark_limit] = False
rows = text.sum(axis=1) > 0
lines, inl = [], False
for y, v in enumerate(rows):
    if v and not inl: y0 = y; inl = True
    if not v and inl:
        if y - y0 > UP * 2: lines.append((y0, y))
        inl = False
rgb_small = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
def line_color(y0, y1, x0, x1):
    # median colour of the stroke cores in the ORIGINAL pixels (ignores anti-aliased edges)
    px = rgb_small[int(y0 / UP):int(y1 / UP) + 1, int(x0 / UP):int(x1 / UP) + 1].reshape(-1, 3)
    lum = px.mean(axis=1)
    core = px[lum < np.percentile(lum, 12)]
    return '#%02X%02X%02X' % tuple(int(v) for v in np.median(core, axis=0))

NAMES = ['palawan', 'faithway', 'church', 'est', 'tagline']
info = []
for li, (y0, y1) in enumerate(lines):
    seg = np.zeros_like(text); seg[y0:y1] = text[y0:y1]
    cols = seg.sum(axis=0) > 0
    xs = np.nonzero(cols)[0]
    # words: split where the column gap is wider than 17 units (1000-space)
    groups, start, last = [], xs[0], xs[0]
    for x in xs[1:]:
        if (x - last) * TO1000 > 17:
            groups.append((start, last + 1)); start = x
        last = x
    groups.append((start, last + 1))
    if li < 2: groups = [(xs[0], xs[-1] + 1)]       # Palawan, FAITHWAY: one word each
    words = []
    for (a, b) in groups:
        m = np.zeros_like(seg); m[:, a:b] = seg[:, a:b]
        words.append(dict(d=trace(m, alphamax=1.0, opttol=0.2), box=bbox(m)))
    entry = dict(name=NAMES[li] if li < len(NAMES) else 'line%d' % li, y0=c1000(y0), y1=c1000(y1), x0=c1000(xs[0]), x1=c1000(xs[-1] + 1),
                 color=line_color(y0, y1, xs[0], xs[-1] + 1), words=words)
    if li == 4:
        # tagline: one piece per letter (merge i-dots into their stems), left to right
        lab2, n2 = ndimage.label(seg)
        comps2 = []
        for i in range(1, n2 + 1):
            m = lab2 == i
            yy, xx = np.nonzero(m)
            comps2.append(dict(k=i, m=m, area=len(xx), x0=xx.min(), x1=xx.max(), cy=yy.mean()))
        med = np.median([c['area'] for c in comps2])
        mid = (y0 + y1) / 2
        letters = [c for c in comps2 if not (c['area'] < med * .3 and c['cy'] < mid)]
        keep = {c['k'] for c in letters}
        for c in comps2:
            if c['k'] in keep: continue
            host = min(letters, key=lambda L: abs((L['x0'] + L['x1']) / 2 - (c['x0'] + c['x1']) / 2))
            host['m'] = host['m'] | c['m']
        letters.sort(key=lambda c: (c['x0'] + c['x1']) / 2)
        entry['letters'] = [dict(d=trace(c['m'], alphamax=1.0, opttol=0.2), box=bbox(c['m'])) for c in letters]
    info.append(entry)
parts['text'] = info
print('text lines:')
for t in info: print('  ', t['name'], t['y0'], t['y1'], t['x0'], t['x1'], len(t['words']), 'words', len(t.get('letters', [])), 'letters', t['color'])

json.dump(parts, open(os.path.join(OUT, 'logo-parts.json'), 'w'), indent=1)

# diagnostic: colour each part over the original
vis = Image.open(SRC).convert('RGB').resize((1000, 1000)).convert('RGBA')
ov = Image.new('RGBA', vis.size, (0, 0, 0, 0))
small = lambda m: Image.fromarray((m * 255).astype(np.uint8)).resize((1000, 1000))
for m, col in [(arcL, (255, 0, 0, 120)), (arcR, (255, 120, 0, 120)), (cross, (0, 160, 0, 140)), (road, (0, 90, 255, 140)), (dove, (200, 0, 200, 160))] + [(lab == bc['i'], (0, 200, 200, 120) if bc['cx'] < spine else (200, 200, 0, 120)) for bc in book]:
    ov.paste(Image.new('RGBA', vis.size, col), (0, 0), small(m))
Image.alpha_composite(vis, ov).save(os.path.join(OUT, 'diag-parts.png'))
print('done')
