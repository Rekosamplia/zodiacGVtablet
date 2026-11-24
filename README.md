# Oráculo Zodiac Academy — landing + pieza social

- `index.html` — landing responsive (preloader con el logotipo, rueda del libro clicable + rejilla de 12 signos, pieza Story 1080×1920 descargable/compartible). Funciona abriéndola directamente; las imágenes van embebidas en `assets/assets-inline.js`.
- `psd/ZODIAC_ACADEMY_HOROSCOPO_STORY_1080x1920.psd` — pieza por capas. Grupo «SIGNOS · activa solo uno» con los 12 signos (visible: Escorpio).
- `export/` — los 12 PNG finales.
- Textos de horóscopo: `js/signs.js`. Maquetación de la pieza: `js/card.js`.
- QR del resultado: abre `tu-horoscopo.html?signo=<signo>` en el móvil, que muestra `export/zodiac-academy-horoscopo-<signo>.png` con botones de Compartir (menú del sistema: Instagram, WhatsApp…) y Guardar. **Antes de publicar**, pon la dirección pública en `js/config.js` (`publicUrl`) si la landing se va a abrir desde otra dirección (p. ej. una pantalla en local). Si cambias los textos de `js/signs.js`, regenera los PNG de `export/` (ver abajo) para que la página del QR muestre lo mismo. Generador QR propio, sin dependencias: `js/qr.js`.

## Tablet en local, sin internet (modo kiosco)
La landing está preparada para abrirse como archivo local, sin servidor ni conexión:
imágenes y tipografías van embebidas (`assets/assets-inline.js`, `css/fonts.css`) y
`js/config.js` trae `kiosk: true`, que oculta Descargar, Compartir y el QR.

1. Copia la carpeta **completa** `ZODIAC_HOROSCOPO` a la tablet (no solo `index.html`).
   Para el kiosco basta con: `index.html`, `css/`, `js/`, `assets/` (las carpetas
   `export/`, `psd/` y `tools/` no hacen falta en la tablet).
2. **Android (recomendado):** instala *Fully Kiosk Browser* → *Settings › Web Content
   Settings › Start URL* = `file:///sdcard/Download/ZODIAC_HOROSCOPO/index.html`
   (ajusta la ruta a donde la copies). En *Web Content Settings* activa *Enable File
   Access* / *Allow local file access*. En *Kiosk Mode* actívalo para bloquear la
   tablet en la landing, y en *Fullscreen* para ocultar barras.
   **iPad:** Safari no abre webs locales desde Archivos; usa una app de kiosco que
   admita contenido local (p. ej. *Kiosk Pro*) e importa la carpeta en ella.
3. Activa el modo avión o desconecta la wifi y recorre la landing entera:
   preloader, rueda, un signo, resultado y «Elegir otro signo».
4. Configura la tablet para que no se apague la pantalla (lo hace Fully Kiosk con
   *Keep Screen On*).

Para volver a la versión web (con Descargar, Compartir y QR) pon `kiosk: false` en
`js/config.js`. Si en kiosco quieres el QR, publica `tu-horoscopo.html` + `export/`
+ `css/` + `js/signs.js` + `js/movil.js` +
`assets/favicon/` en una web y pon su dirección en `publicUrl`.

## Regenerar assets / PSD
```bash
python3 tools/extract_assets.py        # recorta logo, rueda, dragón y portada de ../tex
python3 tools/build_favicon.py         # favicons desde el escudo ZA (AF LOGO ZA ESCUDO_NEGRO.ai) -> assets/favicon/
python3 tools/build_cover2.py          # portada plana del libro 2 enderezando el mockup ZODIAC VIDEOS/.../libro_ZA2.png
python3 tools/extract_stars.py         # estrellas del vector ESTRELLAS ZODIAC VECTOR/fondo_estrellas.ai (aclaradas)
python3 tools/build_inline_assets.py   # regenera assets/assets-inline.js
python3 tools/build_fonts.py           # descarga y embebe las tipografías en css/fonts.css (necesita internet)
python3 -m http.server 8765            # en otra terminal, desde esta carpeta
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=20000 \
  --dump-dom http://localhost:8765/tools/export-layers.html > /tmp/layers.html
python3 tools/build_psd.py /tmp/layers.html
```
