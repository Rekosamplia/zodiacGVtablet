"""Extrae logo, rueda zodiacal, dragón y portada desde las texturas del proyecto
como PNG dorados con transparencia (alpha a partir de la luminancia)."""
import sys, numpy as np
from pathlib import Path
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
TEX = ROOT / "tex"
OUT = Path(__file__).resolve().parents[1] / "assets"
GOLD = np.array([197, 175, 95], dtype=np.float32)

panel = np.asarray(Image.open(TEX / "display/DISPLAY_PANEL_CARA.png").convert("RGB")).astype(np.float32)

def gold_alpha(rgb):
    lum = rgb.mean(axis=2)
    a = np.clip((lum - 14) / (155 - 14), 0, 1)
    return a

def to_rgba(alpha):
    h, w = alpha.shape
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = GOLD.astype(np.uint8)
    out[..., 3] = (alpha * 255).astype(np.uint8)
    return Image.fromarray(out)

def drop_small(alpha, min_area):
    lab, n = ndimage.label(alpha > 0.15)
    sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = sizes >= min_area
    mask = keep[lab]
    mask = ndimage.binary_dilation(mask, iterations=2)
    return alpha * mask

def trim(img, pad=8):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))

# 1) Logo (sin estrellas sueltas)
logo = panel[20:760, 380:2080]
a = drop_small(gold_alpha(logo), 900)
trim(to_rgba(a)).save(OUT / "logo-zodiac-academy.png", optimize=True)

# 2) Rueda zodiacal (centrada), máscara circular suave, sin el texto ACADEMY
cx, cy, R = 1211, 1576, 985
wheel = panel[cy - R:cy + R, cx - R:cx + R].copy()
a = gold_alpha(wheel)
a[: (790 - (cy - R)), :] = 0
yy, xx = np.mgrid[-R:R, -R:R]
d = np.sqrt(xx ** 2 + yy ** 2)
a *= np.clip((R - d) / 25, 0, 1)
to_rgba(a).save(OUT / "rueda-zodiacal.png", optimize=True)

# 3) Dragón (silueta negra de la portada -> dorado). Se descartan las letras que tocan el borde.
cov = np.asarray(Image.open(TEX / "libro/LIBRO_PORTADA.png").convert("RGB")).astype(np.float32)
box = cov[1440:1680, 1090:1420]
a = np.clip((150 - box.mean(axis=2)) / (150 - 30), 0, 1)
lab, n = ndimage.label(a > 0.1)
objs = ndimage.find_objects(lab)
H, W = a.shape
keep = np.zeros(n + 1, bool)
for i, sl in enumerate(objs):
    touches = sl[0].start == 0 or sl[1].start == 0 or sl[0].stop == H or sl[1].stop == W
    keep[i + 1] = not touches
dr = to_rgba(a * keep[lab])
dr = trim(dr)
dr.resize((dr.width * 3, dr.height * 3), Image.LANCZOS).save(OUT / "dragon.png", optimize=True)

# 4) Portada del libro (recorte sin marcas de troquel)
cover = Image.open(TEX / "libro/LIBRO_PORTADA.png").convert("RGB")
cover.crop((0, 0, 1528, 2448)).resize((764, 1224), Image.LANCZOS).save(OUT / "portada-libro.jpg", quality=90)

for f in sorted(OUT.iterdir()):
    print(f.name, Image.open(f).size)
