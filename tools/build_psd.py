"""Construye el PSD por capas de la pieza social a partir del volcado de
tools/export-layers.html (Chrome headless --dump-dom) y exporta los 12 PNG finales.

Uso:
  python3 tools/build_psd.py <layers_dom.html>
"""
import base64, html, io, json, re, sys
from pathlib import Path
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import Group, PixelLayer
from psd_tools.constants import Compression

BASE = Path(__file__).resolve().parents[1]
ACTIVE = "escorpio"  # signo visible por defecto en el PSD

dom = Path(sys.argv[1]).read_text()
data = json.loads(html.unescape(re.search(r'<pre id="out">(.*?)</pre>', dom, re.S).group(1)))
W, H = data["size"]

def img(uri):
    return Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))).convert("RGBA")

def add(parent, name, im, visible=True):
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return
    x0, y0, x1, y1 = bbox
    # PixelLayer.frompil convierte al modo del documento (RGB) y pierde el alfa,
    # así que se construye la capa directamente con el canal de transparencia.
    rec, chans = PixelLayer._build_layer_record_and_channels(im.crop(bbox), name, x0, y0, Compression.RLE)
    layer = PixelLayer(parent, rec, chans)
    parent.append(layer)
    layer.visible = visible
    return layer

psd = PSDImage.new("RGB", (W, H), color=(11, 10, 9))
signs_group = None
for L in data["layers"]:
    if not L["perSign"]:
        add(psd, L["name"], img(data["common"][L["id"]]))
        continue
    if signs_group is None:
        signs_group = Group.new(psd, "SIGNOS · activa solo uno", open_folder=True)
        sub = {}
        for sid, s in data["signs"].items():
            g = Group.new(signs_group, s["name"].upper(), open_folder=(sid == ACTIVE))
            g.visible = sid == ACTIVE
            sub[sid] = g
    for sid, s in data["signs"].items():
        add(sub[sid], f'{L["name"]} · {s["name"]}', img(s["layers"][L["id"]]))

# En los grupos, el orden queda de abajo a arriba como en el canvas (texto encima).
out_psd = BASE / "psd" / "ZODIAC_ACADEMY_HOROSCOPO_STORY_1080x1920.psd"
out_psd.parent.mkdir(exist_ok=True)
psd.save(out_psd)

out_png = BASE / "export"
out_png.mkdir(exist_ok=True)
for sid, uri in data["full"].items():
    img(uri).convert("RGB").save(out_png / f"zodiac-academy-horoscopo-{sid}.png", optimize=True)

print("PSD:", out_psd, round(out_psd.stat().st_size / 1e6, 1), "MB")
print("PNG:", len(data["full"]), "->", out_png)
