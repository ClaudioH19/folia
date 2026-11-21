// PLANTILLA de diario. Cópiala a diarios/<slug>/diario.mjs (y cambia «slug»), borra lo que no uses y construye:
//   node _motor/construir.mjs <slug>          ← un diario
//   node _motor/construir.mjs plantilla       ← vista previa de ESTA plantilla en _plantilla/manual.html
// Antes de escribir, lee _motor/REGLAS-DEL-DIARIO.md. El texto de ejemplo explica cada primitiva; reemplázalo por el real.
import { d } from '../../_motor/bloques.mjs';

export default {
  slug: 'plantilla',                       // = nombre de la carpeta diarios/<slug>/
  marca: 'Nombre corto del proyecto',      // sale en la cabecera y en el lomo
  titulo: 'Qué hace este diario',          // título de la portada
  emblema: 'libro',                        // microscopio | sitio | engranaje | escudo | servidor | nube | matraz | libro | llave | base
  descripcion: 'Una frase: para qué sirve este diario.',
  pie: 'Diario generado el AAAA-MM-DD a partir del repositorio. Si algo difiere, manda el repositorio.',
  portada: {
    sup: 'Organización · Proyecto',
    lead: 'Dos o tres frases: qué cubre el diario y a quién le sirve. Admite <strong>negrita</strong>.',
    ruta: ['Origen', 'Camino', 'Destino'],  // recorrido de la portada (opcional)
    chips: [{ k: 'ok', t: 'Lo que funciona' }, { k: 'pend', t: 'Lo construido sin verificar' }, { k: 'no', t: 'Lo que falta' }],
    edicion: 'Edición del AAAA-MM-DD',
  },
  // «¿En qué situación estás?»: cada entrada de la guía lleva al capítulo (id) donde esa persona empieza a leer
  situaciones: [
    { cap: 'procedimiento', ico: 'caja', t: 'Tengo la definición y aún no veo el diario', d: 'Genera el HTML y comprueba que el lomo aparece en la sala.' },
    { cap: 'bloques', ico: 'archivo', t: 'Busco un bloque para una hoja', d: 'Consulta ejemplos de texto, comandos, figuras y tablas.' },
  ],
  capitulos: [
    // ── Capítulo de procedimiento: cada paso es UNA hoja ──
    d.pasos({
      id: 'procedimiento', posit: 'Generar diario', etiqueta: 'Primera edición', titulo: 'Genera y abre el diario',
      bajada: 'Sigue esta receta si ya tienes un archivo diario.mjs y todavía no puedes abrir el diario desde la sala.',
      antes: [d.aviso('info', 'Necesitas Node.js 18 o superior y una consola abierta en la raíz de la colección.')],
      pasos: [
        { titulo: 'Genera los diarios', donde: 'equipo',
          resumen: 'Ejecuta el generador desde la raíz de la colección. Si informa de un error, corrige el archivo que indica antes de abrir la sala.',
          cmds: [{ t: 'En tu equipo', c: 'node _motor/construir.mjs' }] },
        { titulo: 'Abre el diario desde la sala', donde: 'equipo',
          resumen: 'Abre index.html en el navegador y elige el lomo del proyecto.' },
      ],
      final: 'Diario disponible', finalTexto: 'Puedes volver a la sala con el icono del estante.',
    }),

    // ── Capítulo normal: cada hoja es UNA idea ──
    d.capitulo({
      id: 'bloques', posit: 'Bloques', etiqueta: 'Catálogo', titulo: 'Catálogo de bloques',
      bajada: 'Cada hoja se lee de arriba abajo. Cada hoja admite una o dos columnas de contenido.',
      hojas: [
        d.hoja({ titulo: 'Texto', cols: 2, herramientas: [d.destacado(), d.posit()], bloques: [
          d.p('Un párrafo normal. Admite <strong>negrita</strong>, <em>cursiva</em>, <code>código</code> y enlaces a otras hojas: <a href="#procedimiento">ir al procedimiento</a>.'),
          d.sub('Un subtítulo dentro de la hoja'),
          d.lista(['Elemento con viñeta.', 'Otro elemento.']),
          d.numerada(['Primero.', 'Después.']),
          d.nota('Anotación manuscrita: una sola frase.'),
          d.cita('Una cita breve, con autoría.', 'Quién lo dijo'),
          d.aviso('info', 'Aviso informativo.'),
          d.aviso('ojo', 'Aviso de precaución.'),
          d.aviso('alerta', 'Aviso de riesgo real: pérdida de datos o seguridad.'),
        ] }),
        d.hoja({ titulo: 'Código, listas de comprobación y tablas', bloques: [
          d.codigo('git status\ngit log --oneline -5', { titulo: 'En tu equipo' }),
          d.checklist(['Comprueba que tienes acceso a la copia de respaldo.', 'Anota la versión a la que vas a volver.'], { titulo: 'Antes de restaurar' }),
          d.tabla({ cab: ['Elemento', 'Dónde', 'Si falta'], filas: [['<code>a.json</code>', 'Bóveda', 'Se regenera'], ['<code>b.json</code>', 'Servidor', 'Pérdida de datos']] }),
        ] }),
        d.hoja({ titulo: 'Un diagrama', cols: 1, bloques: [d.diagrama({
          alt: 'Descripción corta del diagrama para lectores de pantalla.',
          pie: 'Texto del pie de figura: qué se ve y cómo leerlo.',
          // columnas (c) y filas (f) empiezan en 0; cs/fs = cuántas ocupa. tipo: caja | app | dato | secreto | oscuro
          nodos: [
            { id: 'a', c: 0, f: 0, t: 'Origen', ls: ['detalle corto'], tipo: 'app', info: 'Aparece numerado y en la leyenda.' },
            { id: 'b', c: 1, f: 0, t: 'Camino', info: 'Qué hace esta pieza.' },
            { id: 'c', c: 2, f: 0, t: 'Destino', tipo: 'dato', info: 'Dónde terminan los datos.' },
            { id: 'k', c: 1, f: 1, t: 'Clave', tipo: 'secreto', info: 'Algo secreto, no visible.' },
          ],
          // tipo de enlace: trafico (fino) | flujo (grueso: despliegue, copia) | punteado (relación indirecta)
          enlaces: [{ de: 'a', a: 'b' }, { de: 'b', a: 'c', tipo: 'flujo', etiqueta: 'copia' }, { de: 'k', a: 'b', tipo: 'punteado' }],
          zonas: [{ t: 'Servidor', nodos: ['b', 'k'] }],
        })] }),
        d.hoja({ titulo: 'Una imagen', bloques: [
          d.p('Las imágenes viven en <code>diarios/&lt;slug&gt;/img/</code> y SIEMPRE llevan texto alternativo.'),
          d.imagen({ src: 'img/ejemplo.svg', alt: 'Dibujo de ejemplo con dos cajas unidas por una flecha.', pie: 'Pie manuscrito de la foto', rotar: -1.2 }),
        ] }),
        d.hoja({ titulo: 'Tarjetas', bloques: [
          d.resumenEstados(),
          d.estados([
            { k: 'ok', t: 'Funciona', d: 'Probado en producción.', etiqueta: 'Verificado' },
            { k: 'pend', t: 'Construido', d: 'Está en código, falta probarlo.', etiqueta: 'Sin verificar' },
            { k: 'no', t: 'Falta', d: 'No existe todavía.', etiqueta: 'Pendiente' },
          ]),
          d.datos([{ k: 'cif', ico: 'candado', t: 'Dato cifrado', d: 'Cómo se protege.' }, { k: 'claro', ico: 'ojo', t: 'Dato en claro', d: 'Por qué está así.' }]),
          d.riesgos([{ nivel: 'alto', html: 'Riesgo alto.' }, { nivel: 'medio', html: 'Riesgo medio.' }, { nivel: 'bajo', html: 'Riesgo bajo.' }]),
          d.archivos([{ href: 'img/ejemplo.svg', nombre: 'ejemplo.svg', desc: 'Abre la ilustración de ejemplo', ico: 'archivo' }]),
        ] }),
        d.hoja({ titulo: 'Simulador', bloques: [d.sim('flujo', {
          exitoT: 'Terminó bien', exito: 'Qué queda al final si todo sale bien.',
          // i = icono (ver ICONOS en _motor/iconos.mjs); falla = qué pasa si esa etapa falla ('' si no puede fallar)
          etapas: [
            { t: 'Etapa 1', s: 'subtítulo', i: 'git', d: 'Qué ocurre aquí.', falla: '' },
            { t: 'Etapa 2', s: 'subtítulo', i: 'prueba', d: 'Qué ocurre aquí.', falla: '<strong>Se detiene.</strong> Nada se daña.' },
            { t: 'Etapa 3', s: 'subtítulo', i: 'check', d: 'Qué ocurre aquí.', falla: 'Qué pasa si falla.' },
          ],
        })] }),
        d.hoja({ titulo: 'Dos entradas consecutivas', bloques: [
          d.orn(),
          d.par(d.aviso('info', 'Primer bloque del grupo.'), d.aviso('ojo', 'Segundo bloque.')),
          d.p('Cualquier bloque acepta <code>{ ancho: true }</code> como último argumento: en el modo de 2 columnas cruza ambas. Las tablas, diagramas, simuladores y tarjetas ya lo hacen solos.', { ancho: true }),
        ] }),
      ],
    }),
  ],
};
