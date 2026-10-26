"""Turns raw generated art (visual/sprites_v1/*.png) into game sprites in public/sprites.

Cuts the soft glow halo the generator leaves around figures, removes stray specks,
crops to the figure and scales to the size the game draws at 2x.
Usage: python3 tools/prep_sprites.py <raw dir> [public/sprites]
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

# raw file -> (sprite name, height px, alpha cut). Flames and ghosts keep their soft edges.
SPRITES = {
    'hero_ren': ('hero_m', 256, 150), 'hero_yuki': ('hero_f', 256, 150),
    'kappa': ('kappa', 192, 150), 'tanuki': ('tanuki', 192, 150), 'ashigaru': ('ashigaru', 192, 150),
    'yurei': ('yurei', 192, 40), 'skull': ('skull', 160, 40), 'onibi': ('onibi', 128, 30),
    'oni': ('oni', 192, 150), 'boss_necro': ('necro', 320, 150),
}


def key_background(im):
    """Generator returned an opaque image: flood the border colour out to transparency."""
    im = im.convert('RGBA')
    w, h = im.size
    mask = Image.new('L', im.size, 0)
    rgb = im.convert('RGB')
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        tmp = rgb.copy()
        from PIL import ImageDraw
        ImageDraw.floodfill(tmp, seed, (255, 0, 255), thresh=40)
        px = tmp.load()
        mpx = mask.load()
        for y in range(h):
            for x in range(w):
                if px[x, y] == (255, 0, 255):
                    mpx[x, y] = 255
    a = Image.eval(mask, lambda v: 255 - v)
    im.putalpha(a)
    return im


def clean(im, cut):
    im = im.convert('RGBA')
    if im.getchannel('A').getextrema()[0] == 255:
        im = key_background(im)
    r, g, b, a = im.split()
    # hard cut of the halo, then a 1px erode so no tinted fringe is left on the edge
    a = a.point(lambda v: 0 if v < cut else v)
    if cut > 100:
        a = Image.composite(a, Image.new('L', a.size, 0), a.filter(ImageFilter.MinFilter(3)).point(lambda v: 255 if v else 0))
    im = Image.merge('RGBA', (r, g, b, a))
    box = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(box) if box else im


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2] if len(sys.argv) > 2 else 'public/sprites')
    out.mkdir(parents=True, exist_ok=True)
    for raw, (name, height, cut) in SPRITES.items():
        f = src / (raw + '.png')
        if not f.exists():
            print('skip', raw)
            continue
        im = clean(Image.open(f), cut)
        w = round(im.width * height / im.height)
        im = im.resize((w, height), Image.LANCZOS)
        im.save(out / (name + '.png'), optimize=True)
        print(name, im.size, (out / (name + '.png')).stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
