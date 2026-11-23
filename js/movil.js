// Página que abre el QR: muestra la imagen del signo en el móvil para guardarla o compartirla.
(function () {
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get("signo");
  const s = (window.ZA_SIGNS || []).find((x) => x.id === id);
  if (!s) { location.replace("index.html#picker"); return; }

  const file = `zodiac-academy-horoscopo-${s.id}.png`;
  const src = `export/${file}`;
  document.title = `${s.name} · Tu horóscopo semanal · Zodiac Academy`;
  $("mName").textContent = s.name;
  $("mCard").src = src;
  $("mCard").alt = `Horóscopo semanal de ${s.name} en formato Story`;
  $("mSave").href = src;
  $("mSave").setAttribute("download", file);

  let blob = null;
  const getBlob = async () => blob || (blob = await (await fetch(src)).blob());
  const canShare = (() => {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] })); }
    catch { return false; }
  })();
  if (canShare) {
    $("mShare").hidden = false;
    $("mSave").classList.remove("btn--gold");
    $("mShare").addEventListener("click", async () => {
      try {
        const f = new File([await getBlob()], file, { type: "image/png" });
        await navigator.share({ files: [f], title: `Mi horóscopo semanal: ${s.name}`, text: "#ZodiacAcademy" });
      } catch (e) { /* cancelado */ }
    });
  }
})();
