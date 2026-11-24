// Renderizador de la pieza social (Story 1080×1920). Cada capa es una función
// independiente para poder exportarlas por separado al PSD.
(function () {
  const W = 1080, H = 1920;
  const GOLD = "#c5af5f", GOLD_LIGHT = "#ecd99c", CREAM = "#efe6cf", BLACK = "#0b0a09";
  const F_TITLE = "Cinzel", F_TEXT = "'Cormorant Garamond'";

  const images = {};
  function loadImages() {
    const src = window.ZA_ASSETS;
    return Promise.all(Object.keys(src).map((k) => new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { images[k] = im; res(); };
      im.onerror = rej;
      im.src = src[k];
    })));
  }
  function loadFonts() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load(`700 90px ${F_TITLE}`),
      document.fonts.load(`600 30px ${F_TITLE}`),
      document.fonts.load(`500 40px ${F_TEXT}`),
      document.fonts.load(`italic 500 36px ${F_TEXT}`),
    ]).catch(() => {});
  }
  let readyP;
  const ready = () => (readyP ||= Promise.all([loadImages(), loadFonts()]));

  // PRNG determinista para que el cielo sea siempre igual
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }
  function spaced(ctx, text, x, y, spacing, align = "center") {
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    const prev = ctx.textAlign; ctx.textAlign = "left";
    chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
    ctx.textAlign = prev;
    return total;
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(/\s+/); const lines = []; let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function divider(ctx, cx, y, half, gap) {
    ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - half, y); ctx.lineTo(cx - gap, y);
    ctx.moveTo(cx + gap, y); ctx.lineTo(cx + half, y);
    ctx.stroke();
    sparkle(ctx, cx, y, 12);
    [cx - half, cx + half].forEach((x) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
  }

  const WHEEL = { cx: 540, cy: 790, size: 580 };
  const SIGN_R = 0.65; // radio relativo del anillo de glifos en la ilustración

  // ——— Capas (de abajo a arriba). `perSign` = cambia con el signo ———
  const LAYERS = [
    { id: "fondo", name: "Fondo negro", draw(ctx) { ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H); } },
    { id: "estrellas", name: "Cielo estrellado", draw(ctx) {
      const r = rng(1982); ctx.fillStyle = GOLD;
      for (let i = 0; i < 320; i++) {
        const x = r() * W, y = r() * H, s = r();
        ctx.globalAlpha = 0.25 + r() * 0.6;
        if (s > 0.93) sparkle(ctx, x, y, 5 + r() * 7);
        else { ctx.beginPath(); ctx.arc(x, y, 0.8 + s * 2.2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    } },
    { id: "halo", name: "Halo dorado", draw(ctx) {
      const g = ctx.createRadialGradient(WHEEL.cx, WHEEL.cy, 40, WHEEL.cx, WHEEL.cy, 520);
      g.addColorStop(0, "rgba(197,175,95,0.22)"); g.addColorStop(1, "rgba(197,175,95,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } },
    { id: "marco", name: "Marco", draw(ctx) {
      ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.7; ctx.lineWidth = 2; ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.strokeRect(52, 52, W - 104, H - 104);
      ctx.globalAlpha = 1;
      [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => sparkle(ctx, x, y, 16));
    } },
    { id: "logo", name: "Logotipo Zodiac Academy", draw(ctx) {
      const im = images.logo, w = 600, h = w * im.height / im.width;
      ctx.drawImage(im, (W - w) / 2, 130, w, h);
    } },
    { id: "kicker", name: "Titular «Tu horóscopo semanal»", draw(ctx) {
      ctx.fillStyle = GOLD_LIGHT; ctx.font = `600 28px ${F_TITLE}`; ctx.textBaseline = "middle";
      const tw = spaced(ctx, "TU HORÓSCOPO SEMANAL", 540, 455, 9);
      divider(ctx, 540, 455, tw / 2 + 120, tw / 2 + 26);
    } },
    { id: "rueda", name: "Rueda zodiacal (libro)", draw(ctx) {
      const { cx, cy, size } = WHEEL;
      ctx.drawImage(images.wheel, cx - size / 2, cy - size / 2, size, size);
    } },
    { id: "resalte", name: "Resalte del signo", perSign: true, draw(ctx, s) {
      const { cx, cy, size } = WHEEL, rad = (s.angle * Math.PI) / 180;
      const x = cx + Math.cos(rad) * (size / 2) * SIGN_R, y = cy + Math.sin(rad) * (size / 2) * SIGN_R;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 60);
      g.addColorStop(0, "rgba(236,217,156,.45)"); g.addColorStop(1, "rgba(236,217,156,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = 3; ctx.shadowColor = GOLD_LIGHT; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } },
    { id: "nombre", name: "Nombre del signo", perSign: true, draw(ctx, s) {
      const g = ctx.createLinearGradient(0, 1110, 0, 1200);
      g.addColorStop(0, GOLD_LIGHT); g.addColorStop(1, GOLD);
      ctx.fillStyle = g; ctx.font = `700 ${s.name.length > 9 ? 80 : 92}px ${F_TITLE}`;
      ctx.textBaseline = "alphabetic";
      spaced(ctx, s.name.toUpperCase(), 540, 1190, 6);
    } },
    { id: "fechas", name: "Fechas y elemento", perSign: true, draw(ctx, s) {
      ctx.fillStyle = CREAM; ctx.globalAlpha = 0.85; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.font = `italic 500 36px ${F_TEXT}`;
      ctx.fillText(`${s.dates}  ·  Elemento ${s.element}`, 540, 1246);
      ctx.globalAlpha = 1;
      divider(ctx, 540, 1290, 150, 24);
    } },
    { id: "texto", name: "Texto del horóscopo", perSign: true, draw(ctx, s) {
      ctx.fillStyle = CREAM; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      let size = 42, lines;
      do { ctx.font = `500 ${size}px ${F_TEXT}`; lines = wrap(ctx, s.text, 840); size -= 1; }
      while (lines.length * size * 1.34 > 330 && size > 30);
      const lh = (size + 1) * 1.34;
      lines.forEach((l, i) => ctx.fillText(l, 540, 1360 + i * lh));
    } },
    { id: "portada", name: "Portadas de los libros 1 y 2", draw(ctx) {
      const w = 96, gap = 14, y = 1686;
      [images.cover, images.cover2].forEach((im, i) => {
        const h = w * im.height / im.width, x = 196 + i * (w + gap);
        ctx.save(); ctx.shadowColor = "rgba(197,175,95,.35)"; ctx.shadowBlur = 22;
        ctx.drawImage(im, x, y, w, h); ctx.restore();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
      });
    } },
    { id: "pie", name: "Texto pie", draw(ctx) {
      const x = 438;
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = GOLD_LIGHT; ctx.font = `600 30px ${F_TITLE}`; spaced(ctx, "ZODIAC ACADEMY", x, 1730, 3, "left");
      ctx.fillStyle = CREAM; ctx.font = `italic 500 32px ${F_TEXT}`;
      ctx.fillText("1 · El despertar", x, 1772); ctx.fillText("2 · Despiadados", x, 1808);
      ctx.fillStyle = GOLD; ctx.font = `600 22px ${F_TITLE}`; spaced(ctx, "#ZODIACACADEMY", x, 1850, 4, "left");
    } },
    { id: "dragon", name: "Dragón", draw(ctx) {
      const w = 150, h = w * images.dragon.height / images.dragon.width;
      ctx.drawImage(images.dragon, 800, 1712, w, h);
    } },
  ];

  function render(canvas, sign, opts = {}) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    for (const L of LAYERS) {
      if (opts.only && opts.only !== L.id) continue;
      ctx.save(); L.draw(ctx, sign); ctx.restore();
    }
    return canvas;
  }

  window.ZACard = { W, H, LAYERS, ready, render };
})();
