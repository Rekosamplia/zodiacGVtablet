"""Genera assets/assets-inline.js con las imágenes en data-URI para que la landing
funcione (y permita descargar el canvas) incluso abriendo index.html en local."""
import base64, io, json
from pathlib import Path
from PIL import Image
A = Path(__file__).resolve().parents[1] / "assets"
spec = {"logo": ("logo-zodiac-academy.png", 1400, "PNG"), "wheel": ("rueda-zodiacal.png", 1400, "PNG"),
        "dragon": ("dragon.png", 500, "PNG"), "cover": ("portada-libro.jpg", 400, "JPEG")}
out = {}
for key, (fn, w, fmt) in spec.items():
    im = Image.open(A / fn)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, fmt, **({"optimize": True} if fmt == "PNG" else {"quality": 88}))
    mime = "image/png" if fmt == "PNG" else "image/jpeg"
    out[key] = f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()
    print(key, im.size, len(out[key]) // 1024, "KB")
(A / "assets-inline.js").write_text("window.ZA_ASSETS = " + json.dumps(out) + ";\n")
