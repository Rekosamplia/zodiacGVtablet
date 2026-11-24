// Configuración de la landing.
window.ZA_CONFIG = {
  // kiosk: true  -> versión para la tablet en local, sin internet. Oculta Descargar,
  //                 Compartir y el QR (guardarían la imagen en la propia tablet o
  //                 llevarían al móvil a una página que no existe).
  // kiosk: false -> versión web normal, con Descargar, Compartir y QR.
  kiosk: true,

  // publicUrl: dirección pública donde estén alojados tu-horoscopo.html y la carpeta
  // export/ (con / final), p. ej. "https://oraculo.ejemplo.com/". Si se rellena, el QR
  // aparece también en modo kiosco y apunta allí. Vacío en modo web = la misma
  // dirección desde la que se abre la landing.
  publicUrl: "",
};
