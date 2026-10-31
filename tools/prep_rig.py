"""Turns a raw generated rig set (visual/rig_<hero>/*.png) into public/rig and updates public/rig/rig.json.

Body parts go to public/rig/<m|f>/, gear, weapons and effects are shared at public/rig/.
Each entry in rig.json: drawn size at scale 1 (w, h) and the x of the top / bottom joint (0..1).
Usage: python3 tools/prep_rig.py <raw dir> <m|f> [public/rig]
"""
import json
import sys
from pathlib import Path
from PIL import Image
from prep_sprites import clean

# name -> (drawn size px at scale 1, which side it fixes, alpha cut)
BODY = {
    'head': (30, 'h', 150), 'torso': (38, 'h', 150), 'coat': (40, 'h', 150), 'hair': (50, 'h', 60),
    'upper_arm': (27, 'h', 150), 'forearm': (28, 'h', 150), 'thigh': (32, 'h', 150), 'shin': (32, 'h', 150),
    'saya': (56, 'w', 150),
}
SHARED = {
    'eq_helm': (22, 'h', 150), 'eq_armor': (48, 'h', 150), 'eq_arms': (22, 'h', 150), 'eq_legs': (20, 'h', 150), 'eq_charm': (10, 'h', 150),
    'w_katana': (60, 'w', 150), 'w_naginata': (110, 'w', 150), 'w_yumi': (84, 'h', 150), 'w_shuriken': (14, 'w', 150),
    'fx_slash': (100, 'w', 20), 'fx_slash_gold': (100, 'w', 20), 'fx_petals': (100, 'w', 20),
}
SCALE = 3  # stored pixels per drawn pixel, sharp on 2x phone screens and in the gear tab


def joint_x(im, top):
    """mean x of opaque pixels in the top or bottom 6% of rows, 0..1 of the width"""
    a = im.getchannel('A')
    w, h = a.size
    band = max(1, h * 6 // 100)
    rows = range(0, band) if top else range(h - band, h)
    px = a.load()
    xs = [x for y in rows for x in range(w) if px[x, y] > 128]
    return round(sum(xs) / len(xs) / w, 3) if xs else 0.5


def main():
    src, g = Path(sys.argv[1]), sys.argv[2]
    out = Path(sys.argv[3] if len(sys.argv) > 3 else 'public/rig')
    (out / g).mkdir(parents=True, exist_ok=True)
    mf = out / 'rig.json'
    meta = json.loads(mf.read_text()) if mf.exists() else {}
    for table, prefix in ((BODY, g + '/'), (SHARED, '')):
        for name, (size, side, cut) in table.items():
            f = src / (name + '.png')
            if not f.exists():
                continue
            im = clean(Image.open(f), cut)
            w, h = (size * im.width / im.height, size) if side == 'h' else (size, size * im.height / im.width)
            px = (max(1, round(w * SCALE)), max(1, round(h * SCALE)))
            if px[0] < im.width:
                im = im.resize(px, Image.LANCZOS)
            im.save(out / (prefix + name + '.png'), optimize=True)
            meta[prefix + name] = {'w': round(w, 2), 'h': round(h, 2), 'top': joint_x(im, True), 'bot': joint_x(im, False)}
            print(prefix + name, meta[prefix + name])
    mf.write_text(json.dumps(meta, indent=1, sort_keys=True))


if __name__ == '__main__':
    main()
