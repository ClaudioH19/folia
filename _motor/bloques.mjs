// Primitivas para escribir un diario. Cada función devuelve un objeto simple; el motor (diario.mjs) lo convierte en HTML.
// Todo texto admite HTML mínimo: <strong>, <em>, <code>, <a href="#id-de-hoja">. Nada de <script> ni estilos en línea.
// Opciones comunes: { ancho: true } → el bloque ocupa las DOS columnas cuando el lector activa «2 columnas».

const falta = (que, donde) => { throw new Error(`d.${donde}: falta ${que}`); };
const lista = (x, donde) => { if (!Array.isArray(x) || !x.length) falta('una lista no vacía', donde); return x; };

export const d = {
  // ── texto ──
  p: (html, o = {}) => (html ? { t: 'p', html, ...o } : falta('el texto', 'p')),
  sub: (html, o = {}) => (html ? { t: 'sub', html, ...o } : falta('el texto', 'sub')),
  lista: (items, o = {}) => ({ t: 'lista', items: lista(items, 'lista'), orden: false, ...o }),
  numerada: (items, o = {}) => ({ t: 'lista', items: lista(items, 'numerada'), orden: true, ...o }),
  // tipo: 'info' | 'ojo' (precaución) | 'alerta' (riesgo real: pérdida de datos, seguridad)
  aviso: (tipo, html, o = {}) => { if (!['info', 'ojo', 'alerta'].includes(tipo)) falta("un tipo 'info' | 'ojo' | 'alerta'", 'aviso'); return { t: 'aviso', tipo, html, ...o }; },
  nota: (html, o = {}) => ({ t: 'nota', html, ...o }), // anotación manuscrita al margen (usar con medida: 1 frase)
  cita: (html, autor = '', o = {}) => ({ t: 'cita', html, autor, ...o }),
  orn: () => ({ t: 'orn' }),

  // ── técnico ──
  // codigo('comando\notro', { titulo: 'En el VPS' }). Nunca pongas secretos reales: usa <marcador>.
  codigo: (c, o = {}) => (c ? { t: 'codigo', c, titulo: 'Terminal', ...o } : falta('el código', 'codigo')),
  checklist: (items, o = {}) => ({ t: 'checklist', items: lista(items, 'checklist'), titulo: 'Listo cuando…', ...o }),
  tabla: ({ cab, filas, ancho = true, ...o }) => ({ t: 'tabla', cab: lista(cab, 'tabla.cab'), filas: lista(filas, 'tabla.filas'), ancho, ...o }),

  // ── gráficos ──
  // Diagrama en cuadrícula (ver _motor/diagrama.mjs). nodos: {id,c,f,cs?,fs?,t,ls?,tipo?,info?}; enlaces: {de,a,tipo?,etiqueta?}
  diagrama: (cfg) => ({ t: 'diagrama', cfg: { ...cfg }, ancho: cfg.ancho !== false }),
  // Escape: SVG propio. Debe usar clases del motor (caja, azul, verde, ambar, cable, t, s) y viewBox.
  svg: ({ html, viewBox, alt, pie, ancho = true }) => (html && viewBox && alt ? { t: 'svg', html, viewBox, alt, pie, ancho } : falta('html, viewBox y alt', 'svg')),
  // Imagen guardada en <carpeta-del-diario>/img/. alt es obligatorio.
  imagen: ({ src, alt, pie = '', ancho = false, rotar = 0 }) => (src && alt ? { t: 'imagen', src, alt, pie, ancho, rotar } : falta('src y alt', 'imagen')),

  // ── tarjetas ──
  // items: { k: 'ok' | 'pend' | 'no', t, d, etiqueta }
  estados: (items, o = {}) => ({ t: 'estados', items: lista(items, 'estados'), ...o }),
  // items: { k: 'cif' | 'hash' | 'claro' | cualquiera, ico, t, d }; con grupos:{k:'Título'} se agrupan con encabezados (sin filtros)
  datos: (items, o = {}) => ({ t: 'datos', items: lista(items, 'datos'), ...o }),
  riesgos: (items, o = {}) => ({ t: 'riesgos', items: lista(items, 'riesgos'), ...o }), // { nivel: 'alto'|'medio'|'bajo', html }
  archivos: (items, o = {}) => ({ t: 'archivos', items: lista(items, 'archivos'), ...o }), // { href, nombre, desc, ico }
  resumenEstados: () => ({ t: 'resumenEstados' }),

  // ── dinámico ──
  // Simulador de etapas con «probar qué pasa si falla…». cfg: { exitoT, exito, etapas:[{t,s,i,d,falla}] }
  sim: (id, cfg) => (id && cfg && Array.isArray(cfg.etapas) ? { t: 'sim', id, cfg, ancho: true } : falta('id y cfg.etapas', 'sim')),

  // Herramientas de margen que puede habilitar el autor en una hoja o procedimiento.
  posit: () => ({ t: 'posit' }),
  subrayado: () => ({ t: 'subrayado' }),
  destacado: () => ({ t: 'subrayado' }),
  notaPersonal: () => ({ t: 'posit' }),

  // ── composición ──
  // Agrupación compatible de dos entradas consecutivas. La hoja define las columnas.
  par: (a, b, o = {}) => ({ t: 'par', a, b, ancho: true, ...o }),

  // hoja: UNA idea por hoja. cols: 1 | 2
  hoja: ({ titulo = '', cols = 1, herramientas, bloques }) => ({ titulo, cols, herramientas, bloques: lista(bloques, 'hoja.bloques') }),

  // capítulo manual: id corto en kebab-case, posit ≤ 16 caracteres
  capitulo: ({ id, posit, etiqueta, titulo, bajada = '', nota = '', hojas }) => {
    if (!id || !posit || !etiqueta || !titulo) falta('id, posit, etiqueta y titulo', 'capitulo');
    return { tipo: 'normal', id, posit, etiqueta, titulo, bajada, nota, hojas: lista(hojas, `capitulo(${id}).hojas`) };
  },

  // capítulo de procedimiento: cada paso es una hoja. pasos: [{ fase?, titulo, donde, tiempo?, opcional?, resumen, puntos?, cmds?:[{t,c}], aviso?:{tipo,texto}, listo?:[...] }]
  // porHoja: pasos por hoja (1 por defecto; 2 solo si los pasos son muy cortos)
  pasos: ({ id, posit, etiqueta, titulo, bajada = '', nota = '', pasos, porHoja = 1, final, finalTexto = '', antes = [], cols = 1, herramientas }) => {
    if (!id || !posit || !etiqueta || !titulo) falta('id, posit, etiqueta y titulo', 'pasos');
    return { tipo: 'pasos', id, posit, etiqueta, titulo, bajada, nota, pasos: lista(pasos, `pasos(${id}).pasos`), porHoja, final: final || '¡Listo!', finalTexto, antes, cols, herramientas };
  },
};
