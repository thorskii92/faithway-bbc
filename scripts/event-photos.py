"""Make web-size copies of an event's photos from a Gallery folder.

Usage: python scripts/event-photos.py "Gallery/<folder>" prototype/img/events/<slug> [first.jpg second.jpg ...]

Writes 01.jpg, 02.jpg ... (max 1600px, for the gallery/lightbox) and 01-sm.jpg ... (max 720px, for
cards and thumbnails). Files named on the command line come first, in that order (the first one is the
event's cover photo); any other photos in the folder follow, sorted by name.
"""
import sys, os, glob
from PIL import Image, ImageOps

src, dst, *order = sys.argv[1:]
os.makedirs(dst, exist_ok=True)
for old in glob.glob(os.path.join(dst, '*.jpg')):
    os.remove(old)

files = sorted(f for f in os.listdir(src) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
ordered = [f for f in order if f in files] + [f for f in files if f not in order]
for n, name in enumerate(ordered, 1):
    im = ImageOps.exif_transpose(Image.open(os.path.join(src, name))).convert('RGB')
    for suffix, size, q in (('', 1600, 80), ('-sm', 720, 78)):
        copy = im.copy()
        copy.thumbnail((size, size), Image.LANCZOS)
        copy.save(os.path.join(dst, f'{n:02d}{suffix}.jpg'), quality=q, optimize=True, progressive=True)
    print(f'{n:02d} <- {name} {im.size}')
