(function () {
  const A = window.ZA_ASSETS, SIGNS = window.ZA_SIGNS;
  const $ = (id) => document.getElementById(id);
  const glyph = (g) => g + "︎"; // fuerza el glifo en modo texto (no emoji)

  // Imágenes del DOM y máscaras del preloader desde el bundle inline
  document.querySelectorAll("[data-asset]").forEach((img) => { img.src = A[img.dataset.asset]; });
  // Modo kiosco (tablet en local): sin descargar/compartir; QR solo si hay dirección pública
  const cfg = window.ZA_CONFIG || {};
  const showQR = !cfg.kiosk || !!cfg.publicUrl;
  document.body.classList.toggle("is-kiosk", !!cfg.kiosk);
  if (!showQR) $("qrBox").remove();

  const root = document.documentElement.style;
  root.setProperty("--logo", `url("${A.logo}")`);
  root.setProperty("--wheel-center", `url("${A.wheelCenter}")`);
  root.setProperty("--wheel-ring", `url("${A.wheelRing}")`);
  root.setProperty("--stars", `url("${A.stars}")`);

  // ——— Preloader: mínimo 3,4 s de animación y espera a fuentes/imágenes ———
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minTime = new Promise((r) => setTimeout(r, reduce ? 300 : 3400));
  Promise.all([minTime, window.ZACard.ready()]).then(() => {
    $("preloader").classList.add("is-done");
    document.body.classList.remove("is-loading");
  });

  // ——— Rueda con zonas clicables + rejilla ———
  const spots = $("wheelSpots"), list = $("signs");
  const R = 32.5; // % del radio donde están los glifos en la ilustración
  SIGNS.forEach((s) => {
    const rad = (s.angle * Math.PI) / 180;
    const b = document.createElement("button");
    b.type = "button"; b.className = "wheel__spot"; b.dataset.id = s.id;
    b.style.left = 50 + R * Math.cos(rad) + "%";
    b.style.top = 50 + R * Math.sin(rad) + "%";
    b.setAttribute("aria-label", `${s.name}, ${s.dates}`);
    b.addEventListener("click", () => select(s));
    spots.appendChild(b);

    const li = document.createElement("li");
    li.innerHTML = `<button type="button" class="sign" data-id="${s.id}">
      <span class="sign__glyph" aria-hidden="true">${glyph(s.glyph)}</span>
      <span class="sign__name">${s.name}</span>
      <span class="sign__dates">${s.dates}</span></button>`;
    li.firstElementChild.addEventListener("click", () => select(s));
    list.appendChild(li);
  });

  let current = null, rotation = 0;
  const canvas = $("card");

  async function select(s) {
    current = s;
    // gira la rueda por el camino más corto para dejar el signo arriba
    const target = -90 - s.angle;
    let delta = ((target - rotation) % 360 + 540) % 360 - 180;
    rotation += delta;
    $("wheelRot").style.transform = `rotate(${rotation}deg)`;
    $("wheel").classList.add("has-selection");
    document.querySelectorAll("[data-id]").forEach((el) =>
      el.classList.toggle("is-active", el.dataset.id === s.id));

    $("rGlyph").textContent = glyph(s.glyph);
    $("rName").textContent = s.name;
    $("rMeta").textContent = `${s.dates} · Elemento ${s.element}`;
    $("rText").textContent = s.text;
    $("btnShare").hidden = !canShareFiles();
    // QR que abre la imagen de este signo en el móvil del usuario
    const qrUrl = new URL(`tu-horoscopo.html?signo=${s.id}`, cfg.publicUrl || location.href).href;
    if (showQR) {
      window.ZAQR.toCanvas($("qr"), qrUrl, { scale: 8, margin: 3 });
      $("qr").dataset.url = qrUrl;
    }

    await window.ZACard.ready();
    window.ZACard.render(canvas, s);
    const res = $("result");
    res.hidden = false;
    setTimeout(() => res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), reduce ? 0 : 650);
  }

  const fileName = () => `zodiac-academy-horoscopo-${current.id}.png`;
  const toBlob = () => new Promise((r) => canvas.toBlob(r, "image/png"));
  function canShareFiles() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] })); }
    catch { return false; }
  }

  $("btnDownload").addEventListener("click", async () => {
    const url = URL.createObjectURL(await toBlob());
    const a = Object.assign(document.createElement("a"), { href: url, download: fileName() });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  $("btnShare").addEventListener("click", async () => {
    const file = new File([await toBlob()], fileName(), { type: "image/png" });
    try {
      await navigator.share({ files: [file], title: `Mi horóscopo Zodiac Academy: ${current.name}`, text: "Consulta el oráculo de Zodiac Academy ✦ #ZodiacAcademy" });
    } catch (e) { /* cancelado por el usuario */ }
  });
  // Baja a la sección de la rueda dejándola centrada en pantalla
  // (si en móvil es más alta que la pantalla, la alinea arriba).
  function goToPicker() {
    const sec = $("picker");
    const fits = sec.offsetHeight <= window.innerHeight + 2;
    sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: fits ? "center" : "start" });
  }
  let pickerAt = 0;
  const goPicker = () => { pickerAt = Date.now(); goToPicker(); };
  $("ctaPick").addEventListener("click", (e) => { e.preventDefault(); goPicker(); });
  $("btnAgain").addEventListener("click", goPicker);

  // ——— Pantalla completa ———
  // Los navegadores solo permiten entrar en pantalla completa tras un gesto del
  // usuario, así que se activa con el primer toque o clic en la landing.
  // (Instalada en la pantalla de inicio, el manifest ya la abre sin navegador.)
  const fsEl = document.documentElement;
  const requestFs = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const installed = matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
  if (requestFs && !installed) {
    const enterFs = (e) => {
      // Compartir/Descargar necesitan el gesto del usuario para sí mismos: ahí no se pide
      if (e.target.closest && e.target.closest("#btnShare, #btnDownload")) return;
      document.removeEventListener("click", enterFs, true);
      document.removeEventListener("keydown", enterFs, true);
      if (isFs()) return;
      try {
        const r = requestFs.call(fsEl, { navigationUI: "hide" });
        if (r && r.catch) r.catch(() => {});
      } catch (err) { /* no permitido: se sigue en modo normal */ }
    };
    document.addEventListener("click", enterFs, true);
    document.addEventListener("keydown", enterFs, true);
    // Al entrar cambia la altura de la pantalla: si se iba a la rueda, se vuelve a centrar
    const onFsChange = () => { if (Date.now() - pickerAt < 2000) setTimeout(goToPicker, 120); };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
  }
})();
