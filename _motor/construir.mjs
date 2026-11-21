// Construye los diarios: node _motor/construir.mjs [slug …]   (sin argumentos, construye todos)
// Genera manual.html junto a la definición de cada diario y actualiza el índice de la sala.
import { readdirSync, existsSync, mkdirSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { construirDiario } from './diario.mjs';
import { verificar } from './verificar.mjs';
import { emblemaSvg, faviconDe } from './emblemas.mjs';
import { esc } from './diagrama.mjs';

import { proyectosEn, comprobarCupo } from './estante.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIARIOS = join(RAIZ, 'diarios');
const pedidos = process.argv.slice(2);
const todos = proyectosEn(DIARIOS);
const esPlantilla = pedidos[0] === 'plantilla'; // vista previa de la plantilla: _plantilla/manual.html (no entra en la estantería)
if (!esPlantilla) {
  try { comprobarCupo(todos.length); }
  catch (error) { console.error(error.message); process.exit(1); }
}
const slugs = esPlantilla ? ['plantilla'] : (pedidos.length ? pedidos : todos);
const fuente = (slug) => (slug === 'plantilla' ? join(RAIZ, '_motor', 'plantilla') : join(DIARIOS, slug));
const carpetaSalida = (slug) => slug === 'plantilla' ? join(RAIZ, '_plantilla') : fuente(slug);
let fallos = 0;
const defs = [];

for (const slug of slugs) {
  if (slug !== 'plantilla' && !todos.includes(slug)) { console.error(`✗ no existe diarios/${slug}/diario.mjs`); fallos++; continue; }
  console.log(`\n▸ ${slug}`);
  let def;
  try { def = (await import(pathToFileURL(join(fuente(slug), 'diario.mjs')).href + `?t=${Date.now()}`)).default; }
  catch (e) { console.error(`  ✗ la definición no se pudo leer: ${e.message}`); fallos++; continue; }
  if (def.slug !== slug && slug !== 'plantilla') { console.error(`  ✗ «slug» (${def.slug}) debe coincidir con la carpeta (${slug})`); fallos++; continue; }
  const r = construirDiario(def, esPlantilla ? '..' : '../..');
  r.avisos.forEach((a) => console.warn('  ⚠', a));
  if (r.errores.length) { r.errores.forEach((e) => console.error('  ✗', e)); fallos++; continue; }
  const salida = carpetaSalida(slug);
  mkdirSync(salida, { recursive: true });
  const imgDir = join(fuente(slug), 'img');
  if (esPlantilla && existsSync(imgDir)) {
    mkdirSync(join(salida, 'img'), { recursive: true });
    for (const f of readdirSync(imgDir)) if (statSync(join(imgDir, f)).isFile()) copyFileSync(join(imgDir, f), join(salida, 'img', f));
  }
  const v = verificar(r.html, salida);
  v.avisos.forEach((a) => console.warn('  ⚠', a));
  if (v.errores.length) { v.errores.forEach((e) => console.error('  ✗', e)); fallos++; continue; }
  writeFileSync(join(salida, 'manual.html'), r.html);
  console.log(`  ✓ ${salida.slice(RAIZ.length + 1)}/manual.html · ${r.hojas} hojas · ${(r.html.length / 1024).toFixed(0)} KB`);
  defs.push(def);
}

if (esPlantilla) { console.log(fallos ? '\n✗ la plantilla tiene errores' : '\n✓ plantilla lista en _plantilla/manual.html'); process.exit(fallos ? 1 : 0); }

// estantería: se regenera con TODOS los diarios (no solo los pedidos)
const completos = [];
for (const slug of todos) {
  const hecho = defs.find((x) => x.slug === slug);
  completos.push(hecho || (await import(pathToFileURL(join(DIARIOS, slug, 'diario.mjs')).href + `?t=${Date.now()}`)).default);
}
const ordenados = completos.sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.slug.localeCompare(b.slug));
const indice = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diarios de proyecto</title>
<meta name="description" content="Colección de manuales de proyecto para leer y consultar sin conexión.">
<meta name="color-scheme" content="light">
<link rel="icon" href="${faviconDe('libro')}">
<link rel="stylesheet" href="assets/manual.css">
<script src="assets/fondo-sala.js"></script>
<script src="assets/estado-local.js"></script>
</head>
<body class="biblioteca">
<main class="mueble" data-salon="cargando" aria-label="Sala de lectura">
<div class="escenario-sala" hidden>
<canvas tabindex="0" aria-label="Sala de lectura en primera persona" aria-describedby="uso-sala"></canvas>
<span class="mira-sala" aria-hidden="true"></span>
<div class="entrada-sala">
  <section class="cubierta-sala" aria-labelledby="titulo-entrada">
    <div class="marco-sala">
      <div class="sello-sala" aria-hidden="true">${emblemaSvg('libro','emb')}</div>
      <h1 id="titulo-entrada">Manuales</h1>
      <div class="floron-sala" aria-hidden="true"></div>
      <button type="button">Entrar a la sala <span aria-hidden="true">→</span></button>
    </div>
  </section>
</div>
<div class="titulo-lomo" hidden><div role="status"><strong></strong><span class="nombre-manual"></span></div><button type="button" class="abrir-lomo" hidden>Abrir diario</button></div>
<div class="mandos-sala"><p id="uso-sala"><span class="uso-raton">Haz clic en la sala para mirar con el ratón</span><span class="uso-capturado">WASD para caminar · Clic para abrir · Esc para soltar · M para silenciar</span><span class="uso-alternativo">Flechas para mirar y avanzar · Haz clic en un lomo para abrirlo</span><span class="uso-tacto">Desliza para mirar · Toca un libro para ver su título</span></p>
<div class="pasos-sala"><button type="button" data-paso="1" aria-label="Avanzar" title="Avanzar">↑</button><button type="button" data-paso="-1" aria-label="Retroceder" title="Retroceder">↓</button></div></div></div>
<iframe class="diario-en-sala" title="Diario abierto" hidden></iframe>
<button type="button" class="sonido-sala" aria-label="Silenciar sonido" aria-pressed="false" hidden><span aria-hidden="true"></span></button>
<nav class="acceso-libros" aria-label="Libros de la sala">${ordenados.map(d => `<a href="diarios/${esc(d.slug)}/manual.html" data-titulo="${esc(d.titulo)}">${esc(d.marca)}</a>`).join('')}</nav>
<noscript><span class="sin-sala" hidden></span></noscript>
</main>
<script src="assets/three-r170.min.js"></script>
<script src="assets/salon.js"></script>
<script src="assets/sonido-sala.js"></script>
</body>
</html>
`;
writeFileSync(join(RAIZ, 'index.html'), indice);
console.log(`\n${fallos ? '✗' : '✓'} estantería index.html (${completos.length} diarios)${fallos ? ` · ${fallos} diario(s) con errores` : ''}`);
process.exit(fallos ? 1 : 0);
