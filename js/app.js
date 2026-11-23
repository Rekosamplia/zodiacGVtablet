(function () {
  const A = window.ZA_ASSETS, SIGNS = window.ZA_SIGNS;
  const $ = (id) => document.getElementById(id);
  const glyph = (g) => g + "︎"; // fuerza el glifo en modo texto (no emoji)

  // Imágenes del DOM y máscaras del preloader desde el bundle inline
  document.querySelectorAll("[data-asset]").forEach((img) => { img.src = A[img.dataset.asset]; });
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
    const cfg = window.ZA_CONFIG || {};
    const qrUrl = new URL(`tu-horoscopo.html?signo=${s.id}`, cfg.publicUrl || location.href).href;
    window.ZAQR.toCanvas($("qr"), qrUrl, { scale: 8, margin: 3 });
    $("qr").dataset.url = qrUrl;

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
  $("ctaPick").addEventListener("click", (e) => { e.preventDefault(); goToPicker(); });
  $("btnAgain").addEventListener("click", goToPicker);
})();
