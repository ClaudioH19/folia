// Verificador del HTML generado: enlaces internos, imágenes, recursos externos, estilos en línea, JSON y simuladores.
// Se ejecuta solo desde construir.mjs; también puede usarse suelto: node _motor/verificar.mjs <ruta/manual.html>
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function verificar(html, carpetaSalida) {
  const errores = [], avisos = [];
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const repetidos = ids.filter((x, i) => ids.indexOf(x) !== i);
  [...new Set(repetidos)].forEach((x) => errores.push(`id repetido en el HTML: «${x}»`));
  const hojas = new Set([...html.matchAll(/<article class="hoja[^"]*" id="([^"]+)"/g)].map((m) => m[1]));

  for (const m of html.matchAll(/(?:data-ir|<a [^>]*href)="#([^"]+)"/g)) {
    if (!hojas.has(m[1])) errores.push(`enlace interno roto: «#${m[1]}» no es una hoja`);
  }
  for (const m of html.matchAll(/<img [^>]*src="([^"]+)"/g)) {
    if (/^(https?:)?\/\//.test(m[1])) errores.push(`imagen externa no permitida: ${m[1]}`);
    else if (!existsSync(resolve(carpetaSalida, m[1]))) errores.push(`falta la imagen «${m[1]}» (guárdala en diarios/<slug>/img/)`);
  }
  for (const m of html.matchAll(/<img (?![^>]*\balt=")[^>]*>/g)) errores.push(`imagen sin alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/g)) errores.push(`recurso o enlace externo (el diario debe funcionar sin red): ${m[1]}`);
  for (const m of html.matchAll(/<a class="archivo[^"]*" href="([^"#][^"]*)"/g)) {
    if (!existsSync(resolve(carpetaSalida, m[1]))) avisos.push(`el archivo enlazado «${m[1]}» no existe junto al diario`);
  }
  for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) {
    if (!/^--[a-z-]+:[^;]*(;--[a-z-]+:[^;]*)*;?$/.test(m[1]) && m[1] !== 'position:absolute') errores.push(`estilo en línea no permitido: style="${m[1]}" (usa clases del motor)`);
  }
  for (const m of html.matchAll(/<script(?![^>]*(?:src=|type="application\/json"))[^>]*>/g)) errores.push(`script en línea no permitido: ${m[0]}`);

  let sims = {};
  for (const m of html.matchAll(/<script type="application\/json" id="([^"]+)">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[2]); if (m[1] === 'datos-simuladores') sims = j; } catch (e) { errores.push(`JSON inválido en #${m[1]}`); }
  }
  for (const m of html.matchAll(/data-sim="([^"]+)"/g)) if (!sims[m[1]]) errores.push(`simulador «${m[1]}» sin datos`);

  const tit = html.match(/<title>([^<]*)<\/title>/);
  if (!tit || !tit[1].trim()) errores.push('el diario no tiene <title>');
  const cuenta = (hojas.size);
  if (cuenta < 3) avisos.push(`solo ${cuenta} hojas: ¿falta contenido?`);
  return { errores, avisos };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const f = process.argv[2];
  if (!f) { console.error('uso: node _motor/verificar.mjs <ruta/manual.html>'); process.exit(2); }
  const r = verificar(readFileSync(f, 'utf8'), dirname(resolve(f)));
  r.avisos.forEach((a) => console.warn('  ⚠', a));
  r.errores.forEach((e) => console.error('  ✗', e));
  console.log(r.errores.length ? `✗ ${r.errores.length} error(es)` : '✓ sin errores');
  process.exit(r.errores.length ? 1 : 0);
}
