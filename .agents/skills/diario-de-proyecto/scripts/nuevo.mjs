import { closeSync, cpSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';



const [destino, slug] = process.argv.slice(2);
const reservados = ['assets', 'diarios', 'plantilla', 'con', 'nul', 'prn', 'aux'];
if (!destino || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || reservados.includes(slug) || /^(com|lpt)[1-9]$/.test(slug)) {
  console.error('Uso: node scripts/nuevo.mjs <colección> <slug-en-minúsculas>');
  process.exit(2);
}
const recursos = new URL('../assets/base/', import.meta.url);
const base = fileURLToPath(recursos);
const { proyectosEn, comprobarCupo } = await import(new URL('_motor/estante.mjs', recursos));
const raiz = resolve(destino);
const motor = join(raiz, '_motor');
if (existsSync(raiz) && readdirSync(raiz).length && !existsSync(join(motor, 'construir.mjs'))) {
  throw new Error('Elige una carpeta vacía o una colección de diarios existente.');
}
if (existsSync(join(raiz, 'diarios', slug)) || existsSync(join(raiz, slug))) {
  throw new Error('Ese diario ya existe. Edita su definición o elige otro slug.');
}
mkdirSync(raiz, { recursive: true });
if (!existsSync(motor)) {
  cpSync(join(base, '_motor'), motor, { recursive: true, force: false, errorOnExist: true });
  cpSync(join(base, 'assets'), join(raiz, 'assets'), { recursive: true, force: false, errorOnExist: true });
  const skillLocal = join(raiz,'.agents','skills','diario-de-proyecto');
  if (!existsSync(skillLocal)) cpSync(fileURLToPath(new URL('../',import.meta.url)),skillLocal,{recursive:true});
  for (const nombre of ['AGENTS.md','CLAUDE.md','README.md','.gitignore','.graphifyignore','.obsidian','notas','docs']) {
    const origen = join(base,nombre);
    if (existsSync(origen)) cpSync(origen,join(raiz,nombre),{recursive:true,force:false});
  }
}
const diarios = join(raiz, 'diarios');
mkdirSync(diarios, { recursive: true });
const temporal = mkdtempSync(join(raiz, '.nuevo-'));
try {
  cpSync(join(motor, 'plantilla'), temporal, { recursive: true });
  const fuente = join(temporal, 'diario.mjs');
  const texto = readFileSync(fuente, 'utf8').replace("slug: 'plantilla'", "slug: '" + slug + "'");
  writeFileSync(fuente, texto);
  // Serializa la comprobación y el alta para dos creadores que disputan la última plaza.
  const bloqueo = join(raiz, '.alta-diario.lock');
  let descriptor;
  try {
    descriptor = openSync(bloqueo, 'wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error('Hay otra alta en curso. Reintenta cuando termine.');
  }
  try {
    comprobarCupo(proyectosEn(diarios).length + 1);
    renameSync(temporal, join(diarios, slug));
  } finally {
    closeSync(descriptor);
    unlinkSync(bloqueo);
  }
} finally {
  rmSync(temporal, { recursive: true, force: true });
}
console.log('Edita ' + join(diarios, slug, 'diario.mjs'));
console.log('Desde ' + raiz + ' ejecuta: node _motor/construir.mjs ' + slug);

