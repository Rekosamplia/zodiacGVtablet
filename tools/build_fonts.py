"""Descarga de Google Fonts las tipografías de la landing (solo los subconjuntos
necesarios) y las embebe en css/fonts.css como data-URI, para que funcione sin
internet y abriendo index.html como archivo local (file://), donde Chrome no
carga fuentes desde archivos sueltos.

Uso:
  python3 tools/build_fonts.py
"""
import base64, re, urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
CSS_URL = ("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700"
           "&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,500"
           "&family=Noto+Sans+Symbols:wght@400;600&display=swap")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
KEEP = {"Cinzel": {"latin"}, "Cormorant Garamond": {"latin"}, "Noto Sans Symbols": {"symbols"}}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})).read()

css = get(CSS_URL).decode()
blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
cache, out = {}, ["/* Tipografías embebidas (generado por tools/build_fonts.py). Licencia: SIL Open Font License. */"]
for subset, block in blocks:
    fam = re.search(r"font-family: '([^']+)'", block).group(1)
    if subset not in KEEP.get(fam, ()):
        continue
    url = re.search(r"url\((https://[^)]+)\)", block).group(1)
    if url not in cache:
        cache[url] = "data:font/woff2;base64," + base64.b64encode(get(url)).decode()
    out.append(block.replace(url, cache[url]))
(BASE / "css" / "fonts.css").write_text("\n".join(out) + "\n")
print(len(out) - 1, "@font-face,", len(cache), "archivos,", round((BASE / "css" / "fonts.css").stat().st_size / 1024), "KB")
