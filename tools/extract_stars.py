"""Rasteriza las estrellas del vector (fondo_estrellas.ai) a un PNG transparente
y lo aclara: se conservan todos los destellos grandes, parte de las estrellas
y muy poco polvo, para que el fondo alrededor del logotipo no quede cargado.

Uso:
  python3 tools/extract_stars.py [ruta/al/fondo_estrellas.ai]
"""
import sys
from pathlib import Path
import fitz, numpy as np
from PIL import Image
from scipy import ndimage

BASE = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE.parents[1] / "ESTRELLAS ZODIAC VECTOR" / "fondo_estrellas.ai"
OUT = BASE / "assets" / "estrellas.png"
ZOOM = 1.5            # 1672×941 pt -> 2508×1412 px
KEEP = {"polvo": 0.18, "estrella": 0.5, "destello": 1.0}

pix = fitz.open(SRC)[0].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), alpha=False)
rgb = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, 3).astype(np.float32)

# Fondo casi negro -> transparente; el dorado conserva su color con alfa por luminancia
lum = rgb.max(axis=2)
alpha = np.clip((lum - 28) / (255 - 28), 0, 1)

lab, n = ndimage.label(alpha > 0.06)
areas = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
rng = np.random.default_rng(1982)
keep = np.zeros(n + 1, bool)
for i, a in enumerate(areas, start=1):
    kind = "destello" if a > 260 * ZOOM**2 else "estrella" if a > 14 * ZOOM**2 else "polvo"
    keep[i] = rng.random() < KEEP[kind]
mask = keep[lab]
# lo que queda fuera de cualquier componente (halo muy tenue) se descarta
alpha = alpha * ndimage.binary_dilation(mask, iterations=2)

col = np.clip(rgb / np.maximum(lum, 1)[..., None] * 255, 0, 255)
out = np.dstack([col, alpha * 255]).astype(np.uint8)
Image.fromarray(out).save(OUT, optimize=True)
print(OUT.name, pix.w, "x", pix.h, "componentes", n, "conservados", int(keep.sum()))
