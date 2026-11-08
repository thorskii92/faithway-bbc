import sys, os, time
from PIL import Image
from rembg import remove, new_session
src, out = sys.argv[1], sys.argv[2]
skip = {20, 150, 151, 154, 155}
ids = [i for i in range(1, 154) if i not in skip]
regions = {152: (690, 250, 1070, 610)}
sess = new_session('u2net_human_seg')
t0 = time.time()
for n, i in enumerate(ids, 1):
    dst = os.path.join(out, f'{i}.png')
    if os.path.exists(dst):
        continue
    im = Image.open(os.path.join(src, f'{i}.png')).convert('RGB')
    crop = im.crop(regions.get(i, (0, 190, 690, 695)))
    cut = remove(crop, session=sess, post_process_mask=True)
    a = cut.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    bbox = a.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    cut.save(dst)
    print(f'{n}/{len(ids)} card {i} {cut.size} {time.time() - t0:.0f}s', flush=True)
print('DONE', flush=True)
