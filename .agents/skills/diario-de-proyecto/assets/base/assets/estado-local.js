/* Usa el navegador al abrir archivos directamente y replica los cambios en el servidor local. */
(() => {
  const estado = window.estadoManualLocal;
  const endpoint = new URL('../estado', document.currentScript.src);
  if (estado) {
    try {
      for (const [clave, valor] of Object.entries(estado)) {
        if (clave.startsWith('diario:') && typeof valor === 'string') localStorage.setItem(clave, valor);
      }
    } catch {}
    delete window.estadoManualLocal;
  }
  function replicar(clave, valor) {
    if (!estado) return;
    fetch(endpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({clave,valor}), keepalive:true
    }).then(respuesta=>{
      if(!respuesta.ok)throw new Error(String(respuesta.status));
    }).catch(()=>console.warn('El cambio quedó en el navegador. El archivo local no se pudo actualizar.'));
  }
  window.guardadoDiario = {
    getItem: clave => localStorage.getItem(clave),
    key: indice => localStorage.key(indice),
    get length() { return localStorage.length; },
    setItem(clave,valor) { localStorage.setItem(clave,valor);replicar(clave,valor); },
    removeItem(clave) { localStorage.removeItem(clave);replicar(clave,null); }
  };
})();
