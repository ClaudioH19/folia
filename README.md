# Diarios de proyectos

Una biblioteca local de manuales interactivos. Entra en una sala 3D, elige un libro y encuentra la receta que corresponde a tu situación. Cada diario combina pasos verificables, páginas de consulta, diagramas, notas y destacados.

![Portada de Manuales, un libro de cuero verde delante de la sala de lectura](docs/portada.webp)

## La colección, explicada como diario

<a href="./docs/ejemplo.html"><img src="./docs/diario-ejemplo.webp" alt="Diario de la propia colección, abierto en la guía de consulta por situaciones"></a>

El ejemplo explica cómo abrir la sala, crear un diario desde otro proyecto y actualizarlo. Abre el [ejemplo HTML](./docs/ejemplo.html) en el navegador desde la carpeta del repositorio. En la colección original, su definición editable está en `diarios/diario-de-proyecto/diario.mjs`.

## Abrir la colección

Con Node.js 18 o posterior, ejecuta desde la raíz:

```sh
node _motor/construir.mjs
node _motor/servir.mjs
```

Abre [Manuales en localhost](http://127.0.0.1:4317/manuales/). El servidor guarda las anotaciones y preferencias en `.manuales/estado.json`.

## Escribir un diario

1. Crea un proyecto con `node .agents/skills/diario-de-proyecto/scripts/nuevo.mjs . mi-proyecto`.
2. Edita `diarios/mi-proyecto/diario.mjs`. Describe primero las situaciones que llevan a una acción y enlázalas a recetas que terminan con una comprobación.
3. Ejecuta `node _motor/construir.mjs mi-proyecto` y abre el diario desde la sala.

Consulta las [reglas editoriales y las primitivas](./_motor/REGLAS-DEL-DIARIO.md) y el [diario de ejemplo](./_motor/plantilla/diario.mjs).

### Crear un diario desde otro proyecto

La carpeta abierta en el agente es el **proyecto fuente**. La **colección de destino** es la que contiene `_motor/` y `diarios/`. El agente lee la fuente y crea el diario en la colección.

Para tener la skill disponible en cualquier proyecto local, copia su carpeta completa desde `.agents/skills/diario-de-proyecto/` de esta colección a una de estas ubicaciones:

| Agente | Carpeta personal | Invocación |
| --- | --- | --- |
| Codex | `~/.agents/skills/diario-de-proyecto/` | `$diario-de-proyecto` |
| Claude Code | `~/.claude/skills/diario-de-proyecto/` | `/diario-de-proyecto` |

Para instalarla desde GitHub, clona el repositorio y copia la carpeta completa de la skill. Así se conservan los scripts, el generador, las primitivas, el lector y los recursos de la sala. Ejecuta en PowerShell:

```powershell
git clone https://github.com/ClaudioH19/diarios-de-proyectos.git
$skill = (Resolve-Path '.\diarios-de-proyectos\.agents\skills\diario-de-proyecto').Path
foreach ($directorio in @('.agents/skills', '.claude/skills')) {
  $destino = Join-Path $env:USERPROFILE "$directorio/diario-de-proyecto"
  New-Item -ItemType Directory -Path $destino -Force | Out-Null
  Get-ChildItem -LiteralPath $skill -Force | Copy-Item -Destination $destino -Recurse -Force
}
```

Si ya tienes el repositorio en tu equipo, apunta `$skill` a su carpeta `.agents/skills/diario-de-proyecto`. Para actualizar la instalación personal, ejecuta `git pull` en el repositorio clonado y vuelve a copiar esa carpeta.

Abre una sesión en el otro proyecto, invoca la skill y pide algo así:

> Usa este proyecto como fuente. Crea el diario `mi-proyecto` en la colección `C:/ruta/Diarios de proyectos`. Documenta los procedimientos como recetas por situación y verifica el diario generado.

Si el agente tiene un espacio de escritura restringido, añade la colección como carpeta de trabajo autorizada. También puedes llamar al script directamente desde el otro proyecto:

```powershell
$coleccion = 'C:/ruta/Diarios de proyectos'
node "$coleccion/.agents/skills/diario-de-proyecto/scripts/nuevo.mjs" "$coleccion" mi-proyecto
# Escribe el contenido en diarios/mi-proyecto/diario.mjs dentro de la colección.
node "$coleccion/_motor/construir.mjs" mi-proyecto
```

[Ubicaciones de skills en Codex](https://developers.openai.com/codex/skills) · [Ubicaciones de skills en Claude Code](https://code.claude.com/docs/en/skills)

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `diarios/<slug>/` | Definición editable, imágenes locales y diario HTML generado |
| `_motor/` | Primitivas, reglas, generador y servidor |
| `assets/` | Lector y sala interactiva |
| `notas/` | Notas Markdown de trabajo para Obsidian |
| `.agents/skills/diario-de-proyecto/` | Skill y recursos para iniciar otras colecciones |

## Conectar herramientas

- **Obsidian.** Abre la raíz como bóveda y empieza por [el índice de notas](./notas/Indice.md). Puedes usar notas Markdown como fuente al preparar una receta. [Administrar bóvedas](https://obsidian.md/help/manage-vaults)
- **Codex y Claude Code.** Abre el proyecto desde su raíz. [AGENTS.md](./AGENTS.md) enlaza a las reglas y a la skill. [CLAUDE.md](./CLAUDE.md) importa ese mismo archivo. En Codex puedes pedir «Usa `$diario-de-proyecto` para documentar qué hacer cuando falla una actualización». [Codex](https://developers.openai.com/codex/guides/agents-md) · [Claude Code](https://code.claude.com/docs/en/memory)
- **Graphify.** Instala `graphifyy` con `uv tool install graphifyy` y ejecuta `graphify extract . --code-only` desde la raíz para mapear el código localmente. Lleva ese mapa a la bóveda con `graphify export obsidian --dir notas/graphify`. Para invocarlo desde el asistente, usa `graphify codex install --project` o `graphify claude install --project`. [.graphifyignore](./.graphifyignore) delimita el material que se analiza. La extracción semántica de documentos usa el modelo que configures. [Graphify](https://github.com/Graphify-Labs/graphify)

Para compartir la skill, genera su ZIP con `python _motor/empaquetar.py`.
