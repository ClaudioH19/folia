/* Sonidos originales sintetizados localmente con Web Audio. */
(() => {
  const guardado = window.guardadoDiario || window.localStorage;
  const boton = document.querySelector('.sonido-sala');
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!boton || !Audio) return;
  const clave = 'diario:sala:silencio';
  let contexto, mezcla, pasos, papel, paso = 0, silenciado = false;
  try { silenciado = guardado.getItem(clave) === '1'; } catch {}

  function crearBuffer(segundos, sintetizar) {
    const frecuencia = contexto.sampleRate;
    const buffer = contexto.createBuffer(1, Math.round(segundos * frecuencia), frecuencia);
    sintetizar(buffer.getChannelData(0), frecuencia);
    return buffer;
  }
  function ambiente() {
    const acordes = [[45,52,59,64],[41,48,55,60],[48,55,62,64],[43,50,57,62]];
    return crearBuffer(24, (muestras, hz) => {
      for (const [indice, notas] of acordes.entries()) {
        const comienzo = indice * 6 * hz;
        const largo = 9 * hz;
        const tonos = notas.map(nota => 440 * 2 ** ((nota - 69) / 12));
        for (let i = 0; i < largo; i++) {
          const t = i / hz;
          const entrada = Math.min(t / 2.8, 1, (9 - t) / 3.1);
          let sonido = 0;
          for (const tono of tonos) {
            const fase = 2 * Math.PI * tono * t;
            sonido += Math.sin(fase) + .13 * Math.sin(fase * 2) + .15 * Math.sin(fase * 1.002);
          }
          muestras[(comienzo + i) % muestras.length] += sonido * entrada ** 2 * .038;
        }
      }
    });
  }
  function alfombra(variante) {
    return crearBuffer(.23, (muestras, hz) => {
      let fibra = 0, semilla = 261 + variante * 31;
      for (let i = 0; i < muestras.length; i++) {
        const t = i / hz;
        semilla = (Math.imul(1664525, semilla) + 1013904223) >>> 0;
        const ruido = semilla / 2147483648 - 1;
        fibra += (ruido - fibra) * Math.min(1, 2 * Math.PI * 130 / hz);
        const contacto = Math.min(1, t / .021) * Math.min(1, (.23 - t) / .045);
        const talon = Math.sin(2 * Math.PI * (57 + variante * 4 - 38 * t) * t);
        const apoyo = Math.sin(2 * Math.PI * (94 + variante * 3) * t);
        muestras[i] = contacto * (.26 * talon * Math.exp(-25 * t) + .035 * apoyo * Math.exp(-37 * t)
          + fibra * .075 * Math.exp(-14 * t));
      }
    });
  }
  function reproducir(buffer, volumen, bucle = false) {
    const fuente = contexto.createBufferSource();
    const nivel = contexto.createGain();
    nivel.gain.value = volumen;
    fuente.buffer = buffer;
    fuente.loop = bucle;
    fuente.connect(nivel).connect(mezcla);
    if (!bucle) fuente.onended = () => { fuente.disconnect(); nivel.disconnect(); };
    fuente.start();
  }
  function hoja() {
    return crearBuffer(.38, (muestras, hz) => {
      let semilla=831, fibra=0;
      for(let i=0;i<muestras.length;i++){
        const t=i/hz;
        semilla=(Math.imul(1664525,semilla)+1013904223)>>>0;
        fibra+=(semilla/2147483648-1-fibra)*.12;
        const roce=Math.sin(Math.PI*t/.38)**2;
        const pliegue=Math.exp(-((t-.23)**2)/.0015);
        muestras[i]=fibra*(roce*.36+pliegue*.11);
      }
    });
  }
  function actualizar() {
    boton.setAttribute('aria-pressed', String(silenciado));
    boton.title = silenciado ? 'Activar sonido' : 'Silenciar sonido';
    if (mezcla) mezcla.gain.setTargetAtTime(silenciado ? 0 : 1, contexto.currentTime, .045);
  }
  function activar() {
    if (silenciado || document.hidden) return;
    if (!contexto) {
      contexto = new Audio();
      mezcla = contexto.createGain();
      mezcla.gain.value = 0;
      mezcla.connect(contexto.destination);
      pasos = [alfombra(0), alfombra(1), alfombra(2)];
      papel = hoja();
      reproducir(ambiente(), .15, true);
      actualizar();
    }
    if (contexto.state !== 'running') contexto.resume().catch(() => {});
  }
  function pausar() { if (contexto?.state === 'running') contexto.suspend().catch(() => {}); }
  boton.hidden = false;
  actualizar();
  boton.addEventListener('click', () => {
    silenciado = !silenciado;
    try { guardado.setItem(clave, silenciado ? '1' : '0'); } catch {}
    actualizar();
    if (!silenciado) activar();
  });
  function gesto(e) {
    if (e.target instanceof Element && e.target.closest('.sonido-sala')) return;
    if (e.type !== 'keydown' || !['Tab','Escape'].includes(e.key)) activar();
  }
  document.addEventListener('pointerdown', gesto);
  document.addEventListener('pointerup', e => { if (e.pointerType === 'touch') gesto(e); });
  document.addEventListener('keydown', gesto);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); else if (contexto) activar(); });
  window.addEventListener('pagehide', pausar);
  window.addEventListener('pageshow', () => { if (contexto) activar(); });
  window.sonidoSala = {
    abrirLibro() {
      if (!silenciado && contexto?.state === 'running') reproducir(papel, .18);
    },
    paso() {
      if (!silenciado && contexto?.state === 'running') reproducir(pasos[paso++ % pasos.length], .24);
    }
  };
})();
