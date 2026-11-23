"""Genera los favicons a partir del escudo ZA (AF LOGO ZA ESCUDO_NEGRO.ai).

El original es una línea negra sobre transparente, que desaparece en pestañas
oscuras: se rellena el escudo de negro de marca y la línea y las letras pasan a
dorado, para que se lea en navegadores claros y oscuros.

Uso:
  python3 tools/build_favicon.py [ruta/al/escudo.ai]
"""
import sys
from pathlib import Path
import fitz, numpy as np
from PIL import Image
from scipy import ndimage

BASE = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop/ZODIAC ACADEMY/01_AAFF/MARCAJES BOLAS URNA/AF LOGO ZA ESCUDO_NEGRO.ai"
OUT = BASE / "assets" / "favicon"
OUT.mkdir(parents=True, exist_ok=True)
BLACK, GOLD = (11, 10, 9), (214, 190, 110)  # dorado algo más claro que --gold para contraste a 16 px

S = 1024
page = fitz.open(SRC)[0]
pix = page.get_pixmap(matrix=fitz.Matrix(S / page.rect.width, S / page.rect.height), alpha=True)
line = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, 4)[..., 3] / 255.0

# interior del escudo = todo lo que no conecta con el exterior
outside = ndimage.label(line < 0.5)[0]
inside = (outside != outside[0, 0]) | (line >= 0.5)
inside = ndimage.binary_fill_holes(inside)
fill = ndimage.gaussian_filter(inside.astype(float), 0.8)  # borde suave

rgb = np.empty((S, S, 3))
rgb[:] = BLACK
rgb = rgb * (1 - line[..., None]) + np.array(GOLD) * line[..., None]
alpha = np.maximum(fill, line)
icon = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8))
icon = icon.crop(icon.getchannel("A").getbbox())

def square(size, pad=0.06, bg=None):
    canvas = Image.new("RGBA", (size, size), bg + (255,) if bg else (0, 0, 0, 0))
    inner = round(size * (1 - 2 * pad))
    im = icon.copy(); im.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas

for size in (32, 192, 512):
    square(size, pad=0.02 if size == 32 else 0.06).save(OUT / f"favicon-{size}.png", optimize=True)
square(180, pad=0.14, bg=BLACK).save(OUT / "apple-touch-icon.png", optimize=True)  # iOS no admite transparencia
square(256, pad=0.02).save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print(sorted(p.name for p in OUT.iterdir()))
