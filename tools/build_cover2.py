"""Obtiene la portada plana de Zodiac Academy 2 (Despiadados) enderezando la
cara frontal del mockup 3D libro_ZA2.png (no hay portada plana en el material).

Uso:
  python3 tools/build_cover2.py [ruta/a/libro_ZA2.png]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE.parents[1] / "ZODIAC VIDEOS/VIDEO/CAPAS ZODIAC/libro_ZA2.png"
OUT = BASE / "assets" / "portada-libro-2.jpg"
W, H = 764, 1224  # mismas proporciones que portada-libro.jpg (libro 1)
# esquinas de la cara frontal en el mockup (sup-izq, sup-der, inf-der, inf-izq)
CORNERS = [(114, 185), (1153, 115), (1153, 2011), (139, 1860)]
INSET = 4  # recorta el filo para no arrastrar transparencia del borde

A, b = [], []
for (x, y), (u, v) in zip(CORNERS, [(-INSET, -INSET), (W + INSET, -INSET), (W + INSET, H + INSET), (-INSET, H + INSET)]):
    A += [[u, v, 1, 0, 0, 0, -x * u, -x * v], [0, 0, 0, u, v, 1, -y * u, -y * v]]
    b += [x, y]
coef = np.linalg.solve(np.array(A, float), np.array(b, float))
im = Image.open(SRC).convert("RGBA").transform((W, H), Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)
flat = Image.new("RGB", (W, H), (11, 10, 9)); flat.paste(im, (0, 0), im)
flat.save(OUT, quality=90)
print(OUT.name, flat.size)
