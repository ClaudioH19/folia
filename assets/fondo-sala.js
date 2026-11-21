/* Comparte una imagen del último encuadre entre la sala y sus diarios. */
(() => {
  const carpeta = new URL('./', document.currentScript.src);
  const clave = 'diario:fondo-sala:' + carpeta.href;
  function leer() {
    try {
      const imagen = sessionStorage.getItem(clave);
      return /^data:image\/(webp|png);base64,[A-Za-z0-9+/=]+$/.test(imagen || '') ? imagen : null;
    } catch {
      return null;
    }
  }
  function guardar(lienzo) {
    if (!lienzo.width || !lienzo.height) return;
    try {
      const imagen = document.createElement('canvas');
      const escala = Math.min(1, 960 / Math.max(lienzo.width, lienzo.height));
      imagen.width = Math.round(lienzo.width * escala);
      imagen.height = Math.round(lienzo.height * escala);
      const ctx = imagen.getContext('2d');
      ctx.fillStyle = '#382e25';
      ctx.fillRect(0, 0, imagen.width, imagen.height);
      ctx.drawImage(lienzo, 0, 0, imagen.width, imagen.height);
      sessionStorage.setItem(clave, imagen.toDataURL('image/webp', .72));
    } catch {
      // La vista de entrada local sirve de fondo cuando el navegador no comparte almacenamiento.
    }
  }
  window.fondoSala = { guardar };
  const imagen = leer();
  if (imagen) document.documentElement.style.setProperty('--fondo-sala', 'url("' + imagen + '")');
  if (parent !== window) {
    const destino = location.origin === 'null' ? '*' : location.origin;
    document.addEventListener('click', e => {
      if (!e.target.closest('a[aria-label="Volver a la sala"]') || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      parent.postMessage('diario:cerrar', destino);
    });
    document.addEventListener('keydown', e => {
      if(e.key.toLowerCase()!=='m' || e.repeat || e.ctrlKey || e.altKey || e.metaKey ||
         e.target.closest?.('textarea,input,select,[contenteditable]'))return;
      parent.postMessage('diario:silenciar', destino);
    });
  }
})();
