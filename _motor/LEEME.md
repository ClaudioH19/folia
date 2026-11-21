# Motor de diarios

Convierte `diarios/<slug>/diario.mjs` en un libro HTML (`diarios/<slug>/manual.html`) y regenera la estantería (`index.html`).
Sin dependencias: solo Node 18+ y un navegador.

| Archivo | Para qué |
|---|---|
| `bloques.mjs` | Las primitivas `d.*` que se usan al escribir (párrafos, pasos, diagramas, imágenes, simuladores…) |
| `diario.mjs` | Renderizador: capítulos → hojas → HTML, portada, índice, validaciones |
| `diagrama.mjs` | Diagramas declarativos (cuadrícula, cables con codos, leyenda) |
| `emblemas.mjs` | Emblemas de portada/lomo/favicon por proyecto (`microscopio`, `sitio`, `engranaje`, `escudo`, `servidor`, `nube`, `matraz`, `libro`, `llave`, `base`) |
| `iconos.mjs` | Iconos de actores y simuladores |
| `verificar.mjs` | Verificador del HTML generado |
| `construir.mjs` | Línea de comandos |
| `plantilla/` | Diario de ejemplo con todos los bloques |
| `REGLAS-DEL-DIARIO.md` | **Contrato para quien escribe un diario (agente o persona)** |

```
node _motor/construir.mjs               # todos
node _motor/construir.mjs wp-dir        # uno
node _motor/construir.mjs plantilla     # vista previa de la plantilla en _plantilla/manual.html
```

Nuevo diario: copia `plantilla/diario.mjs` a `diarios/<slug>/diario.mjs`, cambia `slug`, escribe y construye.
Nuevo emblema: añade un trazo de 64×64 a `emblemas.mjs` (solo líneas, sin relleno) o pasa `emblemaRaw` en el diario.
La skill local está en `.agents/skills/diario-de-proyecto/`. Si editas el motor o el lector, ejecuta `python _motor/empaquetar.py` desde la colección para actualizar sus recursos y el ZIP de la raíz. Comparte ese ZIP para distribuir el generador, las primitivas y las interfaces sin los diarios de esta colección.

Abre la colección con `node _motor/servir.mjs` y visita <http://127.0.0.1:4317/manuales/>. El servidor guarda los cambios de lectura en `.manuales/estado.json`. Conserva ese archivo junto a tu colección para recuperar las preferencias y anotaciones.

La estantería admite 18 proyectos en tres niveles de seis. Si se supera el cupo, el constructor avisa antes de escribir archivos.
