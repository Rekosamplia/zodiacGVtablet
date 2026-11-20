# Oráculo Zodiac Academy — landing + pieza social

- `index.html` — landing responsive (preloader con el logotipo, rueda del libro clicable + rejilla de 12 signos, pieza Story 1080×1920 descargable/compartible). Funciona abriéndola directamente; las imágenes van embebidas en `assets/assets-inline.js`.
- `psd/ZODIAC_ACADEMY_HOROSCOPO_STORY_1080x1920.psd` — pieza por capas. Grupo «SIGNOS · activa solo uno» con los 12 signos (visible: Escorpio).
- `export/` — los 12 PNG finales.
- Textos de horóscopo: `js/signs.js`. Maquetación de la pieza: `js/card.js`.

## Regenerar assets / PSD
```bash
python3 tools/extract_assets.py        # recorta logo, rueda, dragón y portada de ../tex
python3 tools/build_inline_assets.py   # regenera assets/assets-inline.js
python3 -m http.server 8765            # en otra terminal, desde esta carpeta
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=20000 \
  --dump-dom http://localhost:8765/tools/export-layers.html > /tmp/layers.html
python3 tools/build_psd.py /tmp/layers.html
```
