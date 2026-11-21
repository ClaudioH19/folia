import { d } from './bloques.mjs';
// Motor del diario: convierte la definición de un proyecto (diarios/<slug>/diario.mjs) en un libro HTML de una sola página.
// Reglas que el motor hace cumplir: lectura lineal (sin pestañas ni submenús), una idea por hoja, sin recursos externos,
// sin secretos, imágenes con texto alternativo y diagramas con pie. Los avisos no detienen la construcción; los errores sí.
import { ICONOS, ACTORES, ico } from './iconos.mjs';
import { emblemaSvg, faviconDe, EMBLEMAS } from './emblemas.mjs';
import { renderDiagrama, esc } from './diagrama.mjs';

const SELLO = '<svg class="sello" viewBox="0 0 100 100" aria-hidden="true"><circle pathLength="1" cx="50" cy="50" r="42"/><path pathLength="1" d="M30 52l14 14 27-30"/></svg>';
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<pattern id="p-diag" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#f9f0d5"/><line x1="0" y1="0" x2="0" y2="7" stroke="#c9b283" stroke-width="1.5"/></pattern>
<pattern id="p-punto" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#f9f0d5"/><circle cx="3.5" cy="3.5" r="1.05" fill="#b39560"/></pattern>
</defs></svg>`;

const plano = (html) => String(html).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SECRETOS = [/AKIA[0-9A-Z]{16}/, /ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /-----BEGIN [A-Z ]*PRIVATE KEY/, /AGE-SECRET-KEY-/, /age1[a-z0-9]{50,}/, /\bsk-[A-Za-z0-9]{20,}/, /xox[bap]-[A-Za-z0-9-]{10,}/];

export function construirDiario(def, raiz = '..') {
  const avisos = [], errores = [];
  const err = (m) => errores.push(m), aviso = (m) => avisos.push(m);
  // ───── validación de la definición ─────
  for (const k of ['slug', 'marca', 'titulo', 'emblema', 'portada', 'capitulos']) if (!def[k]) err(`falta «${k}» en la definición`);
  if (errores.length) return { html: '', avisos, errores };
  if (!def.emblemaRaw && !EMBLEMAS[def.emblema]) err(`emblema «${def.emblema}» no existe (opciones: ${Object.keys(EMBLEMAS).join(', ')})`);
  const idsCap = new Set(['portada', 'indice']);
  def.capitulos.forEach((c) => {
    if (!KEBAB.test(c.id)) err(`id de capítulo «${c.id}» debe ser kebab-case (a-z, 0-9 y guiones)`);
    if (idsCap.has(c.id)) err(`id de capítulo repetido o reservado: «${c.id}»`);
    idsCap.add(c.id);
    if (c.posit.length > 18) err(`posit «${c.posit}» de ${c.id}: máximo 18 caracteres`);
  });
  if (errores.length) return { html: '', avisos, errores };

  const ctx = { sims: {}, simIcons: new Set(), fig: 0, dg: 0, imgs: [], capitulosConMarcas: new Set() };

  // ───── expandir capítulos en hojas ─────
  const hojas = [];
  def.capitulos.forEach((c, ci) => {
    const nro = ci + 1;
    const base = { cap: c.id, capNro: nro, capPosit: c.posit, etiqueta: c.etiqueta };
    let lista = [];
    if (c.tipo === 'pasos') {
      const pasos = c.pasos, total = pasos.length, grupo = Math.max(1, c.porHoja || 1);
      const antes = [];
      if (c.bajada) antes.push({ t: 'p', html: c.bajada });
      antes.push(...(c.antes || []));
      antes.push({ t: 'resumenPasos', pasos, ancho: true });
      lista.push({ titulo: '', cols: c.cols, bloques: antes, intro: true });
      for (let i = 0; i < total; i += grupo) {
        const gr = pasos.slice(i, i + grupo).map((p, j) => ({ t: 'paso', p, n: i + j + 1, total, mostrarTitulo: grupo > 1 }));
        const tit = grupo === 1 ? pasos[i].titulo : `Pasos ${i + 1}–${Math.min(total, i + grupo)}`;
        lista.push({ titulo: tit, cols: c.cols, bloques: gr, fase: pasos[i].fase || '', esPaso: true });
      }
      lista.push({ titulo: 'Capítulo terminado', cols: '1', bloques: [{ t: 'final', texto: c.finalTexto, final: c.final, resumen: c.resumenFinal }], esFin: true });
    } else lista = c.hojas.map((h) => ({ ...h }));
    lista.forEach((h, k) => {
      hojas.push({ ...base, id: k === 0 ? c.id : `${c.id}-${k + 1}`, k, m: lista.length, apertura: k === 0, def: c, ...h });
    });
    hojas.push({ id: `_pausa-${c.id}`, titulo: 'Página en blanco', separador: true, herramientas: [] });
  });
  const preliminares = [];
  function preliminar(tipo, titulo) {
    let id = tipo;
    while (hojas.some(h => h.id === id)) id += '-diario';
    preliminares.push({ id, titulo, tipo });
  }
  if (def.situaciones?.length) preliminar('rutas', 'Guía de consulta');
  if (def.portada.ruta?.length || def.portada.chips?.length || def.pie) preliminar('ficha', 'Ficha del proyecto');
  const todas = [{ id: 'portada', titulo: 'Portada' }, { id: 'indice', titulo: 'Índice' }, ...preliminares, ...hojas];
  todas.forEach((h, i) => { h.num = i + 1; });

  // ───── bloques ─────
  function checklistHtml(items, titulo, h, clase = 'listo') {
    ctx.capitulosConMarcas.add(h.cap);
    return `<div class="${clase}"><h4>✓ ${esc(titulo)}</h4>${items.map((x, k) => `<label><input type="checkbox" data-ck="${h.id}:${k}"><span>${x}</span></label>`).join('')}</div>`;
  }
  function pasoHtml(b, h) {
    const p = b.p;
    if (!p.titulo || !p.resumen) err(`paso sin título o resumen en el capítulo «${h.cap}»`);
    if (!ACTORES[p.donde]) err(`paso «${p.titulo}»: «donde» debe ser uno de ${Object.keys(ACTORES).join(', ')}`);
    const [nombre, ic] = ACTORES[p.donde] || [p.donde, 'archivo'];
    let o = `<section class="b paso"><div class="paso-cab"><span class="paso-n">Paso ${b.n} de ${b.total}</span><span class="donde">${ico(ic)}${esc(nombre)}</span>${p.opcional ? '<span class="donde opc">Opcional</span>' : ''}${p.tiempo ? `<span class="tiempo">${esc(p.tiempo)}</span>` : ''}</div>`;
    if (b.mostrarTitulo) o += `<h3 class="sub">${esc(p.titulo)}</h3>`;
    o += `<p class="p res">${p.resumen}</p>`;
    if (p.puntos) o += `<ul class="lista">${p.puntos.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    (p.cmds || []).forEach((c) => { o += cmdHtml(c.c, c.t); });
    if (p.aviso) o += avisoHtml(p.aviso.tipo || 'info', p.aviso.texto);
    if (p.listo?.length) o += checklistHtml(p.listo, 'Listo cuando…', h);
    return o + '</section>';
  }
  const cmdHtml = (c, titulo = 'Terminal') => `<div class="cmd"><header><span>${esc(titulo)}</span><button type="button" data-copiar>Copiar</button></header><pre>${esc(c)}</pre></div>`;
  const avisoHtml = (tipo, html) => `<div class="aviso${tipo === 'ojo' ? ' ojo' : tipo === 'alerta' ? ' alerta' : ''}">${html}</div>`;

  function bloque(b, h) {
    const cl = `b${b.ancho ? ' ancho' : ''}`;
    switch (b.t) {
      case 'p': return `<p class="${cl} p">${b.html}</p>`;
      case 'sub': return `<h3 class="${cl} sub">${b.html}</h3>`;
      case 'lista': return `<${b.orden ? 'ol' : 'ul'} class="${cl} lista">${b.items.map((x) => `<li>${x}</li>`).join('')}</${b.orden ? 'ol' : 'ul'}>`;
      case 'aviso': return `<div class="${cl} aviso${b.tipo === 'ojo' ? ' ojo' : b.tipo === 'alerta' ? ' alerta' : ''}">${b.html}</div>`;
      case 'nota': return `<aside class="${cl} nota-mano">${b.html}</aside>`;
      case 'cita': return `<blockquote class="${cl} cita">${b.html}${b.autor ? `<cite>— ${esc(b.autor)}</cite>` : ''}</blockquote>`;
      case 'orn': return `<div class="${cl} orn" aria-hidden="true"><span></span></div>`;
      case 'codigo': return `<div class="${cl} cmd"><header><span>${esc(b.titulo)}</span><button type="button" data-copiar>Copiar</button></header><pre>${esc(b.c)}</pre></div>`;
      case 'checklist': return checklistHtml(b.items, b.titulo, h, `${cl} listo`);
      case 'tabla': return `<div class="${cl} tabla"><table><thead><tr>${b.cab.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${b.filas.map((f) => `<tr>${f.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'diagrama': {
        ctx.dg += 1; ctx.fig += 1;
        if (!b.cfg.pie) aviso(`diagrama sin «pie» en la hoja «${h.id}»: todo diagrama lleva pie de figura`);
        const g = renderDiagrama(b.cfg, `dg${ctx.dg}`);
        return `<figure class="${cl} fig"><div class="lienzo">${g.svg}</div><figcaption><b>Fig. ${ctx.fig}</b> ${esc(b.cfg.pie || '')}</figcaption>${g.leyenda}</figure>`;
      }
      case 'svg': { ctx.fig += 1; return `<figure class="${cl} fig"><div class="lienzo"><svg viewBox="${b.viewBox}" role="img" aria-label="${esc(b.alt)}">${b.html}</svg></div><figcaption><b>Fig. ${ctx.fig}</b> ${esc(b.pie || b.alt)}</figcaption></figure>`; }
      case 'imagen': { ctx.imgs.push(b.src); return `<figure class="${cl} foto" style="--rot:${b.rotar || 0}deg"><span class="cinta-foto" aria-hidden="true"></span><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${b.pie ? `<figcaption>${esc(b.pie)}</figcaption>` : ''}</figure>`; }
      case 'estados': return `<div class="${cl} tarjetas">${b.items.map((e, i) => `<div class="est ${e.k}"><b>${e.t}</b>${e.etiqueta ? `<span class="pastilla ${e.k}">${esc(e.etiqueta)}</span>` : ''}<small>${e.d}</small></div>`).join('')}</div>`;
      case 'resumenEstados': return `<div class="${cl} resumen-estados" data-contador-estados><div class="num"><i></i><div><strong data-n="ok">0</strong><span>funcionando</span></div></div><div class="num"><i></i><div><strong data-n="pend">0</strong><span>construido o apagado</span></div></div><div class="num"><i></i><div><strong data-n="no">0</strong><span>pendientes</span></div></div></div>`;
      case 'datos': {
        const card = (x) => `<div class="dato ${x.k}"><div class="ico">${ico(x.ico || 'archivo')}</div><div><b>${x.t}</b><span class="como">${x.d}</span></div></div>`;
        if (!b.grupos) return `<div class="${cl} datos">${b.items.map(card).join('')}</div>`;
        return `<div class="${cl} datos-grupos">${Object.entries(b.grupos).map(([k, tit]) => { const its = b.items.filter((x) => x.k === k); return its.length ? `<h3 class="sub">${tit}</h3><div class="datos">${its.map(card).join('')}</div>` : ''; }).join('')}</div>`;
      }
      case 'riesgos': return `<div class="${cl} riesgos">${b.items.map((r) => `<div class="riesgo"><span class="nivel ${r.nivel}">${r.nivel}</span><span>${r.html}</span></div>`).join('')}</div>`;
      case 'archivos': return `<div class="${cl} archivos">${b.items.map((a) => `<a class="archivo" href="${esc(a.href)}"><div class="ico">${ico(a.ico || 'archivo')}</div><div><b>${esc(a.nombre)}</b><span>${a.desc}</span></div></a>`).join('')}</div>`;
      case 'sim': {
        if (ctx.sims[b.id] && ctx.sims[b.id] !== b.cfg) err(`simulador «${b.id}» definido dos veces con datos distintos`);
        ctx.sims[b.id] = b.cfg; b.cfg.etapas.forEach((e) => { if (!ICONOS[e.i]) err(`simulador «${b.id}»: icono «${e.i}» no existe`); ctx.simIcons.add(e.i); });
        return `<div class="${cl} sim" data-sim="${b.id}"></div>`;
      }
      case 'par': return bloque(b.a, h) + bloque(b.b, h);
      case 'paso': return pasoHtml(b, h);
      case 'resumenPasos': {
        let fase = '', o = '<ol class="b resumen-pasos ancho">';
        b.pasos.forEach((p, i) => {
          if (p.fase && p.fase !== fase) { fase = p.fase; o += `<li class="fase">${esc(fase)}</li>`; }
          o += `<li><span class="n">${i + 1}</span><a class="t" href="#${h.cap}-${2 + Math.floor(i / Math.max(1, h.def.porHoja || 1))}">${esc(p.titulo)}</a><span class="m">${p.opcional ? 'opcional' : ''}${p.opcional && p.tiempo ? ' · ' : ''}${p.tiempo ? esc(p.tiempo) : ''}</span></li>`;
        });
        return o + '</ol>';
      }
      case 'final': {
        const conMarcas = ctx.capitulosConMarcas.has(h.cap);
        const resumen = b.resumen?.length ? `<ul class="lista resumen-final">${b.resumen.map((item) => `<li>${item}</li>`).join('')}</ul>` : '';
        const marcas = conMarcas ? `<p class="checks-res" data-checks-de="${h.cap}"></p>` : '';
        const reiniciar = conMarcas ? `<button class="btn suave" type="button" data-reiniciar="${h.cap}">↺ Borrar mis marcas de este capítulo</button>` : '';
        return `<div class="b final ancho">${SELLO}<h3>${esc(b.final)}</h3>${b.texto ? `<p class="p">${b.texto}</p>` : ''}${resumen}${marcas}<div class="btns"><button class="btn solido" type="button" data-ir="#indice">Volver al índice</button>${reiniciar}</div></div>`;
      }
      default: err(`bloque desconocido «${b.t}» en la hoja ${h.id}`); return '';
    }
  }

  // El mismo folio recibe el título, el índice, los apuntes o los bloques del autor.
  function pagina(h, interior, clase = '') {
    const valor = h.cols == null || h.cols === 'auto' ? 1 : h.cols;
    const cols = valor === '1' ? 1 : valor === '2' ? 2 : valor;
    if (![1, 2].includes(cols)) err(`hoja «${h.id}»: cols admite 1 o 2`);
    const herramientas = h.herramientas ?? h.def?.herramientas ?? [d.destacado(), d.posit()];
    if (!Array.isArray(herramientas) || herramientas.some(x => !['subrayado','notaPersonal','posit'].includes(x?.t))) {
      err(`herramientas de margen no válidas en «${h.id}»`);
      return '';
    }
    const activas = new Set(herramientas.map(x => x.t === 'notaPersonal' ? 'posit' : x.t));
    const accion = (atributo, icono, nombre) => `<button type="button" class="accion-papel" ${atributo} aria-label="${nombre}" title="${nombre}">${ico(icono)}</button>`;
    const enlace = (href, icono, nombre) => `<a href="${href}" class="accion-papel" aria-label="${nombre}" title="${nombre}">${ico(icono)}</a>`;
    return `<article class="hoja ${clase}" id="${h.id}" data-herramientas="${[...activas].join(' ')}" data-columnas="${cols === 2 ? 2 : 1}" data-cap="${esc(h.cap || h.id)}" data-posit="${esc(plano(h.titulo || h.capPosit))}"${h.separador ? ' aria-label="Página en blanco"' : ''}${h.num === 1 ? '' : ' hidden'}>
<div class="margen-superior"><nav class="atajos" aria-label="Navegación del diario">${enlace(raiz + '/index.html','estanteria','Volver a la sala')}${enlace('#portada','libro','Portada')}${enlace('#indice','indice','Índice')}</nav>
</div>
<div class="hoja-in"><div class="superficie"><div class="texto-folio">${interior}</div><div class="papeles"></div></div></div>
<footer class="margen-inferior">${accion('data-prev','anterior','Página anterior')}<span class="folio" aria-label="Página ${h.num}">${h.num}</span>${accion('data-next','siguiente','Página siguiente')}</footer>
</article>`;
  }
  function cabecera(etiqueta, titulo) {
    return `<header class="hoja-cab"><div class="cap">${esc(etiqueta)}</div><h2 class="titulo" tabindex="-1">${titulo}</h2></header>`;
  }
  const hojasHtml = hojas.map(h => {
    if (h.separador) return pagina(h, '', 'hoja-en-blanco');
    const bloques = h.bloques.map(b => bloque(b, h)).join('\n');
    const largo = plano(bloques).length;
    if (largo > 5200) err(`hoja «${h.id}» tiene ${largo} caracteres: divídela`);
    else if (largo > 2600 || h.bloques.length > 9) aviso(`hoja «${h.id}» es larga: considera dividirla`);
    if (h.bloques.filter(b => b.t === 'diagrama').length > 1) aviso(`hoja «${h.id}» tiene más de un diagrama`);
    SECRETOS.forEach(re => { if (re.test(bloques)) err(`posible secreto en la hoja «${h.id}»`); });
    const c = h.def;
    const cab = cabecera(`Capítulo ${h.capNro} · ${h.apertura ? c.etiqueta : h.fase || c.posit}`, h.apertura ? c.titulo : h.titulo);
    const bajada = h.apertura && c.tipo !== 'pasos' && c.bajada ? `<p class="bajada">${c.bajada}</p>` : '';
    const nota = h.apertura && c.nota ? `<p class="nota-margen">${c.nota}</p>` : '';
    return pagina(h, cab + bajada + nota + `<div class="cuerpo">${bloques}</div>`);
  });
  const pt = def.portada;
  const portadaHtml = pagina(todas[0], `<div class="portadilla">
<p class="institucion">${esc(pt.sup)}</p>
<div class="sello-titulo" aria-hidden="true">${emblemaSvg(def.emblema, 'emb', def.emblemaRaw)}</div>
<h1 tabindex="-1">${esc(def.titulo)}</h1><div class="floron" aria-hidden="true">❧</div>
<p class="lead">${pt.lead}</p>
<p class="edicion">${esc(pt.edicion || '')}</p><a class="retomar" data-continuar hidden></a>
</div>`, 'portada');
  const entradas = [
    ...preliminares.map(h => [h, h.titulo]),
    ...def.capitulos.map(c => [hojas.find(h => h.id === c.id), c.titulo])
  ];
  const toc = entradas.map(([h,t]) => `<li><a href="#${h.id}"><span>${t}</span><i aria-hidden="true"></i><b>${h.num}</b></a></li>`).join('');
  const indiceHtml = pagina(todas[1], cabecera(def.marca, 'Índice') + `<ol class="toc">${toc}</ol>`);
  const prelimHtml = preliminares.map(h => {
    if (h.tipo === 'rutas') {
      const tareas = def.situaciones.map(s => {
        if (!idsCap.has(s.cap)) err(`situación «${s.t}» apunta al capítulo inexistente «${s.cap}»`);
        return `<li><a href="#${esc(s.cap)}">${s.t}</a><p>${s.d}</p></li>`;
      }).join('');
      return pagina(h, cabecera(def.marca, h.titulo) + `<ol class="consultas">${tareas}</ol>`);
    }
    const estado = { ok: 'Verificado', pend: 'Sin verificar o inactivo', no: 'Pendiente' };
    const chips = (pt.chips || []).map(c => `<li>${esc(c.t)} <em>· ${esc(estado[c.k] || c.k)}</em></li>`).join('');
    const ruta = pt.ruta?.length ? `<p>${pt.ruta.map(esc).join(' · ')}</p>` : '';
    return pagina(h, cabecera(def.marca, h.titulo) + ruta + (chips ? `<ul class="lista">${chips}</ul>` : '') + (def.pie ? `<p class="nota-margen">${def.pie}</p>` : ''));
  });
  const cuerpo = [portadaHtml, indiceHtml, ...prelimHtml, ...hojasHtml].join('\n');

  const iconosSim = Object.fromEntries([...ctx.simIcons].map((n) => [n, ICONOS[n]]));
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const N = todas.length;
  const barra = [['mano','Mano','Arrastra hacia abajo para avanzar, hacia arriba para volver y de lado para pasar la hoja.'],['subrayado','Destacar','Elige un color y selecciona texto'],['posit','Pósit','Pega un pósit en la página']].map(([tool,nombre,ayuda]) =>
    `<button type="button" data-tool="${tool}" title="${ayuda}" aria-pressed="${tool === 'mano'}">${ico(tool)}<span>${nombre}</span></button>`
  ).join('');
  const paleta = ['miel','rosa','menta','azul'].map(c =>
    `<button type="button" data-color="${c}" aria-label="Destacar en ${c}" title="${c}" aria-pressed="false"></button>`
  ).join('');
  const historial = [['deshacer','Deshacer','Ctrl+Z'],['rehacer','Rehacer','Ctrl+R']].map(([accion,nombre,atajo]) =>
    `<button type="button" data-historial="${accion}" aria-label="${nombre}" title="${nombre} (${atajo})" disabled>${ico(accion)}</button>`
  ).join('');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(def.titulo)} · ${esc(def.marca)}</title>
<meta name="description" content="${esc(def.descripcion || def.titulo)}">
<meta name="color-scheme" content="light">
<link rel="icon" href="${faviconDe(def.emblema, def.emblemaRaw)}">
<link rel="stylesheet" href="${raiz}/assets/manual.css">
<script src="${raiz}/assets/fondo-sala.js"></script>
<script src="${raiz}/assets/estado-local.js"></script>
</head>
<body class="diario">
${DEFS}
<div class="mesa lector">
<nav class="barra-lectura" aria-label="Herramientas de lectura">${barra}<div class="paleta" role="group" aria-label="Color del destacado" hidden>${paleta}<button type="button" data-aplicar-tinta hidden>Aplicar</button></div><div class="historial-lectura" role="group" aria-label="Historial de anotaciones">${historial}</div></nav>
<div class="libro" id="libro" data-modo="mano">
<main class="hojas" id="hojas" aria-label="Diario">${cuerpo}<div class="fondo-giro" aria-hidden="true" inert hidden></div><div class="vuelta" aria-hidden="true" inert hidden></div></main>
<nav class="pestanas-personales" aria-label="Páginas con pósits" hidden></nav>
</div></div>
<span class="posicion solo-lector" aria-live="polite">Página 1 de ${N}</span>
<div class="aviso-lector" role="status" hidden></div>
<script type="application/json" id="datos-simuladores">${json(ctx.sims)}</script>
<script type="application/json" id="datos-iconos">${json(iconosSim)}</script>
<script src="${raiz}/assets/manual.js"></script>
<script src="${raiz}/assets/marginalia.js"></script>
</body>
</html>
`;
  return { html, avisos, errores, imgs: ctx.imgs, hojas: todas.length };
}
