<h1 align="center">Folia · Diarios de proyectos</h1>

<p align="center">Manuales por situación en una biblioteca 3D que funciona en local.</p>

<p align="center">
  <a href="#probar-el-diario"><img src="./docs/diario-ejemplo.webp" width="900" alt="Diario abierto con la guía de consulta a la izquierda y los pasos para abrir un libro a la derecha"></a>
</p>

<p align="center">
  <a href="#abrir-la-colección">Abrir la colección</a> ·
  <a href="#instalar-la-skill-en-un-comando">Instalar la skill</a> ·
  <a href="./_motor/REGLAS-DEL-DIARIO.md">Reglas de redacción</a>
</p>

La skill aporta el lector, la biblioteca y las primitivas. Codex o Claude Code pueden concentrarse en convertir el material de un proyecto en recetas, comandos y diagramas. El lector elige la situación que le interesa y puede destacar texto o pegar pósits mientras consulta el diario.

## Probar el diario

Abre [`docs/ejemplo.html`](./docs/ejemplo.html) en tu navegador desde una copia del repositorio. En la guía de consulta, elige **Tengo el manual en otro proyecto y quiero añadirlo al estante** para recorrer una receta completa.

- [Ver cómo se hojea el diario](https://github.com/ClaudioH19/folia/blob/main/docs/demo-diario.gif)
- [Leer la definición editable del ejemplo](https://github.com/ClaudioH19/folia/blob/main/diarios/diario-de-proyecto/diario.mjs)

## Abrir la colección

Con Node.js 18 o posterior, ejecuta desde la raíz:

```sh
node _motor/construir.mjs
node _motor/servir.mjs
```

Abre [Manuales en localhost](http://127.0.0.1:4317/manuales/). El servidor guarda las anotaciones y preferencias en `.manuales/estado.json`.

## Escribir un diario

1. Crea un proyecto con `node .agents/skills/diario-de-proyecto/scripts/nuevo.mjs . mi-proyecto`.
2. Edita `diarios/mi-proyecto/diario.mjs`. Empieza por las situaciones del lector y enlaza cada una a la receta correspondiente. Incluye resultados esperados cuando guíen la acción siguiente y reserva las viñetas finales para recetas que convenga poder retomar.
3. Ejecuta `node _motor/construir.mjs mi-proyecto` y abre el diario desde la sala.

Consulta las [reglas editoriales y las primitivas](./_motor/REGLAS-DEL-DIARIO.md) y el [diario de ejemplo](./_motor/plantilla/diario.mjs).

## Instalar la skill en un comando

Pega el bloque completo en PowerShell. Requiere Git y Node.js 18 o posterior. Instala la skill con el generador, el lector y sus recursos para ambos agentes.

```powershell
& {
  $temporal = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  $copiaDiarios = Join-Path $temporal ("folia-skill-" + [guid]::NewGuid())
  try {
    git clone --depth 1 https://github.com/ClaudioH19/folia.git $copiaDiarios
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo clonar el repositorio de la skill.' }
    node (Join-Path $copiaDiarios '.agents/skills/diario-de-proyecto/scripts/instalar.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar la skill.' }
  } finally {
    if ((Split-Path -Parent $copiaDiarios) -eq $temporal.TrimEnd([IO.Path]::DirectorySeparatorChar) -and (Test-Path -LiteralPath $copiaDiarios)) {
      Remove-Item -LiteralPath $copiaDiarios -Recurse -Force
    }
  }
}
```

Repite el comando para actualizar. Si ya tienes el repositorio clonado, ejecuta `node .agents/skills/diario-de-proyecto/scripts/instalar.mjs` desde su raíz. Si recibiste el ZIP, descomprímelo y ejecuta `node scripts/instalar.mjs` desde la carpeta `diario-de-proyecto`. Añade `--agente=codex` o `--agente=claude` al comando de Node para instalar solo en ese agente.

| Agente | Carpeta personal | Invocación |
| --- | --- | --- |
| Codex | `~/.agents/skills/diario-de-proyecto/` | `$diario-de-proyecto` |
| Claude Code | `~/.claude/skills/diario-de-proyecto/` | `/diario-de-proyecto` |

### Crear un diario desde otro proyecto

La carpeta abierta en el agente es el **proyecto fuente**. La **colección de destino** es la que contiene `_motor/` y `diarios/`. El agente lee la fuente y crea el diario en la colección.

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
