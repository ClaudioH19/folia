import { cpSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const origen = fileURLToPath(new URL('../', import.meta.url));
const agentes = { codex: '.agents', claude: '.claude' };

try {
  let perfil = homedir();
  let agente = 'ambos';
  for (const argumento of process.argv.slice(2)) {
    if (argumento.startsWith('--perfil=') && argumento.length > '--perfil='.length) {
      perfil = resolve(argumento.slice('--perfil='.length));
    } else if (['--agente=codex', '--agente=claude', '--agente=ambos'].includes(argumento)) {
      agente = argumento.slice('--agente='.length);
    } else {
      throw new Error('Uso: node instalar.mjs [--agente=codex|claude|ambos] [--perfil=<carpeta>]');
    }
  }
  for (const [nombre, carpeta] of Object.entries(agentes)) {
    if (agente !== 'ambos' && agente !== nombre) continue;
    const destino = join(perfil, carpeta, 'skills', 'diario-de-proyecto');
    mkdirSync(dirname(destino), { recursive: true });
    mkdirSync(destino, { recursive: true });
    if (realpathSync(origen) !== realpathSync(destino)) {
      for (const recurso of ['SKILL.md', 'scripts', 'assets']) {
        cpSync(join(origen, recurso), join(destino, recurso), { recursive: true });
      }
    }
    console.log(`${nombre === 'codex' ? 'Codex' : 'Claude Code'}: ${destino}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
