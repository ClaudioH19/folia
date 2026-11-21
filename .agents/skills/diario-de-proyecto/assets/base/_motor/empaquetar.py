"""Empaqueta únicamente los recursos genéricos necesarios para crear diarios."""
from pathlib import Path
from shutil import copy2
from tempfile import NamedTemporaryFile
from zipfile import ZipFile, ZIP_DEFLATED

raiz = Path(__file__).resolve().parents[1]
nombre = "diario-de-proyecto"
skill = raiz / ".agents" / "skills" / nombre
archivos = ["SKILL.md", "scripts/nuevo.mjs"]
motor = (
    "bloques.mjs", "construir.mjs", "estante.mjs", "diagrama.mjs", "diario.mjs",
    "emblemas.mjs", "iconos.mjs", "verificar.mjs", "servir.mjs", "empaquetar.py", "REGLAS-DEL-DIARIO.md",
    "plantilla/diario.mjs", "plantilla/img/ejemplo.svg",
)
arranque = ("AGENTS.md", "CLAUDE.md", "README.md", ".gitignore", ".graphifyignore", ".obsidian/app.json", "notas/Indice.md", "docs/portada.webp", "docs/ejemplo.html", "docs/diario-ejemplo.webp")
for recurso in [*arranque, *("_motor/" + item for item in motor), "assets/manual.css", "assets/manual.js", "assets/marginalia.js", "assets/three-r170.min.js", "assets/THREE-LICENSE.txt", "assets/salon.js", "assets/sonido-sala.js", "assets/fondo-sala.js", "assets/estado-local.js", "assets/sala-fondo.webp", "assets/cuero-verde.webp", "assets/fibra.png", "assets/cuero-graneado.webp"]:
    ruta = "assets/base/" + recurso
    destino = skill / ruta
    destino.parent.mkdir(parents=True, exist_ok=True)
    copy2(raiz / recurso, destino)
    archivos.append(ruta)

salida = raiz / (nombre + ".zip")
with NamedTemporaryFile(dir=raiz, delete=False, suffix=".tmp") as archivo:
    temporal = Path(archivo.name)
try:
    with ZipFile(temporal, "w", compression=ZIP_DEFLATED) as paquete:
        for ruta in archivos:
            paquete.write(skill / ruta, nombre + "/" + ruta)
    temporal.replace(salida)
finally:
    temporal.unlink(missing_ok=True)
print(salida)

