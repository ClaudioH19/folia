# Reglas para escribir el diario de un proyecto

Estas reglas las sigue **cualquier agente (o persona)** que cree o modifique un diario en `la carpeta de la colección`.
Un diario es un libro: cubierta de cuero, hojas de papel claro e índice por capítulo. Se lee **de principio a fin, en orden**.

## 1. Principios (no negociables)

1. **Lineal y secuencial.** La portadilla identifica el diario y la guía de consulta reúne las entradas por tarea. El índice enumera capítulos con su título completo. El resumen de un procedimiento enlaza a cada paso y desde ahí se puede seguir hoja por hoja.
   **Prohibido** dentro de una hoja: pestañas, submenús, acordeones, filtros, «ver más», carruseles o cualquier
   control que esconda contenido. Si hay varios caminos (p. ej. tres tipos de incidente), cada camino es **su propio capítulo**
   y la hoja anterior los enlaza.
2. **Una idea por hoja.** Si una hoja pide scroll largo o mezcla dos ideas, divídela. El motor avisa desde ~2.600 caracteres
   y **falla** desde 5.200.
3. **Describe la salida cuando guíe una decisión.** Si un resultado observable ayuda a avanzar, elegir una rama o corregir un fallo, escríbelo junto a la acción. Omite «Listo cuando…» por defecto. Incluye casillas si la persona las pide o si marcar varios puntos ayuda en una revisión real.
4. **Verdad antes que estética.** No marques «funciona» lo que solo está construido. Usa los tres estados:
   `ok` (verificado en el entorno real), `pend` (construido/probado en local, sin verificar) y `no` (no existe). No inventes datos, cifras ni versiones.
5. **Cero secretos.** Ninguna clave, contraseña, token, IP real, correo personal ni volcado. Usa marcadores: `<dominio>`, `<SHA del servidor>`.
   El motor rechaza patrones comunes de secretos (claves privadas, `ghp_…`, `AKIA…`, `age1…`), pero la responsabilidad es de quien escribe.
6. **Español**, tuteo claro y sin jerga innecesaria. Frases cortas. Una instrucción por frase.
7. **Sin marcas inventadas.** No crees logos ni activos de una institución. Los emblemas del motor son dibujos genéricos.
8. **Funciona sin red.** Nada de CDN, fuentes ni imágenes externas. Todo local.

9. **Empieza por la situación del lector.** Identifica en qué estado está, qué necesita lograr y cómo sabrá que terminó. Cada situación que requiere acciones distintas debe tener una entrada en la guía de consulta y una receta en el capítulo enlazado.

## 2. Estructura de un diario

```
la carpeta de la colección
├─ assets/manual.css · manual.js     ← motor visual (no editar para escribir contenido)
├─ _motor/                            ← motor y reglas (este documento)
├─ diarios/<slug>/diario.mjs          ← EL CONTENIDO (lo único que escribes)
├─ diarios/<slug>/img/                ← imágenes del diario
├─ diarios/<slug>/manual.html                 ← generado (no editar a mano)
├─ diarios/<slug>/configuracion/              ← plantillas de archivos enlazables (opcional)
└─ index.html                         ← estantería, generada
```

`diarios/<slug>/diario.mjs` exporta por defecto `{ slug, marca, titulo, emblema, descripcion, pie, portada, situaciones, capitulos }`.
Parte siempre de `_motor/plantilla/diario.mjs` (se ve en `_plantilla/manual.html` con `node _motor/construir.mjs plantilla`).

Orden recomendado de capítulos (omite los que no apliquen): **Instalar → Actualizar → Estado → Arquitectura → Datos/Seguridad → Flujo (simuladores) → Recuperación (concentrador + un capítulo por situación) → Custodia → Riesgos → Archivos**.
El campo histórico `posit` identifica el capítulo en las hojas interiores y admite hasta 18 caracteres.

## 3. Tipos de capítulo

- `d.pasos({...})` — **procedimiento**. Genera: hoja de apertura (resumen de todos los pasos) + **una hoja por paso** + hoja de cierre con sello.
  Cada paso: `{ fase?, titulo, donde, tiempo?, opcional?, resumen, puntos?, cmds?, aviso?, listo? }`.
  `donde` ∈ `equipo | github | vps | cloudflare | google | proxy | bobeda | dti`. `fase` se escribe en el primer paso de cada fase.
  `porHoja: 2` solo si los pasos son diminutos. El cierre admite `finalTexto` y un `resumenFinal: ['…', '…']` opcional.
- `d.capitulo({...})` — **explicación**. Lista de `d.hoja({ titulo, bloques })`; cada hoja es una idea.

Ids de capítulo: kebab-case (`rec-perdida`). Las hojas toman `id` (la primera) o `id-2`, `id-3`… (las siguientes):
enlaza con `<a href="#rec-perdida">` o `<a href="#flujo-2">`. El motor falla si un enlace apunta a una hoja que no existe.

El motor añade una página en blanco al final de cada capítulo, incluido el último. El índice omite esos folios. Conserva los identificadores de las hojas de contenido al revisar una edición.

## 4. Bloques (primitivas `d.*`)

| Quiero… | Usa |
|---|---|
| Párrafo, subtítulo, viñetas, numeración | `d.p`, `d.sub`, `d.lista`, `d.numerada` |
| Aviso (info / precaución / riesgo real) | `d.aviso('info' \| 'ojo' \| 'alerta', html)` |
| Anotación manuscrita, cita, separador | `d.nota`, `d.cita`, `d.orn` |
| Comando copiable | `d.codigo(texto, { titulo })` |
| Lista de comprobación opcional, con casillas persistentes | `d.checklist([...])` |
| Tabla | `d.tabla({ cab, filas })` |
| **Diagrama** (nodos en cuadrícula; el motor traza cables, numeración y leyenda) | `d.diagrama({ alt, pie, nodos, enlaces, zonas })` |
| SVG propio (último recurso) | `d.svg({ html, viewBox, alt, pie })` |
| **Imagen** (en `img/`, con `alt`) | `d.imagen({ src: 'img/x.png', alt, pie, rotar })` |
| Tarjetas de estado (con recuento inmediato) | `d.resumenEstados()` + `d.estados([{ k, t, d, etiqueta }])` |
| Qué dato se guarda y cómo | `d.datos(items, { grupos })` |
| Riesgos con nivel | `d.riesgos([{ nivel: 'alto' \| 'medio' \| 'bajo', html }])` |
| Archivos descargables | `d.archivos([{ href, nombre, desc, ico }])` |
| Simulador de etapas con «probar qué pasa si falla…» | `d.sim(id, { exitoT, exito, etapas })` |
| Dos entradas consecutivas | `d.par(a, b)` |

Todo texto admite HTML mínimo: `<strong> <em> <code> <a href="#hoja">`. Nada de `<script>`, `<style>`, `style="…"` ni clases propias (el verificador lo rechaza).

### Diagramas

- Dibuja un flujo cuando importe el orden, y una arquitectura cuando importe quién se conecta con quién. Ordena las flechas en una dirección coherente y numera los hitos cuando ayude a seguir la receta. El pie debe decir qué acción, decisión o comprobación aporta la figura.

- Coordenadas: `c` (columna) y `f` (fila) desde 0; `cs`/`fs` = cuántas ocupa. **Máximo 4 columnas** (si no, el texto queda diminuto) y ~5 filas.
- Tipos de nodo: `caja` (infraestructura), `app` (hachurado: aplicación), `dato` (gris: datos y respaldos), `secreto` (punteado), `oscuro` (destino crítico).
- Tipos de enlace: `trafico` (fino), `flujo` (grueso: despliegue/copia), `punteado` (relación indirecta). Opcional `etiqueta`, `desde`/`hacia` (`der|izq|arr|aba`).
- Nodo con `info` → aparece **numerado** y explicado en la leyenda (al pasar el cursor se resalta). Texto del nodo ≤ ~27 caracteres por línea y ≤ 2 líneas secundarias.
- Un diagrama por hoja, con `pie` y `alt`. Zonas (`zonas:[{ t, nodos:[ids] }]`) enmarcan lo que está dentro de un mismo servidor/red; no incluyas ahí nodos que estén fuera.
- Coloca la figura junto al texto que la explica. Si queda ilegible a página completa, divídela en etapas y mantén cerca de cada parte las etiquetas y la explicación que se necesitan para entenderla.
- No dibujes SVG a mano si el diagrama cabe en la cuadrícula.

### Imágenes

- Incluye una imagen cuando ayude a reconocer un control, el resultado esperado o una señal de fallo. Recorta al elemento que importa y usa en el texto los mismos nombres de la interfaz. Comprueba que se lea en móvil.

- Formatos PNG/JPG/WebP/SVG, ≤ 600 KB cada una; ancho útil ≈ 900 px. Nombres en minúsculas con guiones.
- `alt` obligatorio: describe lo que se ve y por qué importa. Capturas de pantalla: **sin datos personales ni secretos** (recórtalas o difúminalas).
- No pegues el logo de una institución; no hay autorización de marca.

## 5. Composición del folio

Cada página tiene una sola caja de lectura. Usa `d.hoja({ cols: 1, bloques: [...] })` para instrucciones, diagramas y tablas. Usa `cols: 2` para texto que se pueda leer en columnas cortas. La opción omitida y el valor histórico `auto` se interpretan como una columna. Un valor distinto de 1 o 2 en una definición nueva produce un error.

Inserta el contenido con las primitivas de la sección 4, en orden de lectura. La opción `ancho: true` cruza las dos columnas dentro de la misma página. Las agrupaciones antiguas con `d.par` se leen como dos entradas consecutivas. Al estrechar la ventana, el libro muestra un solo folio y el texto pasa a una columna en teléfonos.

### Marcas personales del lector

En modo Mano, arrastra hacia abajo para avanzar hacia el final del folio o hacia arriba para volver al inicio. Arrastra de lado para pasar la hoja. La rueda y el trackpad solo desplazan el contenido del folio. Usa el arrastre lateral, los botones o las flechas para cambiar de página. La barra también permite destacar texto en cuatro colores y pegar pósits. Cada pósit se edita sobre el folio y se mueve por su tira superior. Su pestaña numerada abre la página y enfoca la nota. El navegador guarda el texto, la posición y los destacados. Durante la sesión, Deshacer (`Ctrl+Z`) y Rehacer (`Ctrl+R`, `Ctrl+Y` o `Ctrl+Mayús+Z`) recorren los cambios de anotaciones del diario.

Configura las herramientas por hoja o procedimiento con `d.destacado()` y `d.posit()`. Las definiciones anteriores pueden seguir usando `d.subrayado()` y `d.notaPersonal()`. Usa `d.nota(texto)` para las notas del autor. Los diagramas se ajustan al folio al abrirlo. **Ampliar diagrama** permite recorrer los detalles dentro de la página y **Ajustar a la página** recupera la vista completa.

## 6. Diseño de contenido

- Formula las situaciones como hechos observables y acciones que el lector quiere resolver. Por ejemplo, «El servidor nuevo está vacío → Instala el sistema» o «La actualización falló → Restaura la versión anterior». Cada entrada dice cuándo seguir esa ruta y qué resultado esperar.
- Usa `d.pasos` para las recetas. Ordena por dependencia real y presenta los requisitos antes de necesitarlos. Empieza cada paso con un verbo en imperativo. Si importa en qué pantalla, carpeta o herramienta se realiza, indícalo antes de la instrucción. [Procedimientos paso a paso de Microsoft](https://learn.microsoft.com/en-us/style-guide/procedures-instructions/writing-step-by-step-instructions)
- Conserva un párrafo, tabla o figura si permite elegir la ruta, ejecutar la acción, evitar un error o comprobar el resultado. Recorta antecedentes, repeticiones y teoría que no cambien qué debe hacer el lector. Coloca los detalles consultables en un capítulo breve y enlázalo desde el paso que los necesita.
- Usa una columna para recetas, comandos, comprobaciones y figuras. Reserva dos columnas para material breve de consulta que se lea de corrido. Reparte las recetas largas en folios consecutivos.

- Abre la portada con el propósito del manual. En `situaciones`, usa tareas reconocibles y una frase sobre el resultado. La ruta y los estados opcionales aparecen en la ficha del proyecto.
- El índice y los resúmenes de pasos se generan desde los títulos. Escribe «Restaura una copia» o «Dónde se guardan los archivos» cuando esas sean las preguntas que trae el lector.
- Al pasar de pliego, una hoja gira brevemente desde el lomo. El texto se presenta completo de inmediato. Los diagramas permanecen quietos y los simuladores arrancan bajo demanda. Respeta la preferencia de movimiento reducido.


- En la primera hoja del capítulo, usa la `bajada` para decir qué logrará el lector. Estima la duración solo si puedes respaldarla y le sirve para planificar.
- Titula cada paso con un verbo y su objeto («Crea el bucket de respaldos»). Usa `resumen` para la instrucción principal, `puntos` para detalles necesarios, `cmds` para comandos y `aviso` para una precaución. Incluye el resultado esperado junto a la instrucción cuando guíe la acción siguiente. Reserva `listo` para casillas opcionales. [Guía de procedimientos de Google](https://developers.google.com/style/procedures)
- Ofrece un ejemplo breve con datos concretos si evita que el lector tenga que adivinar cómo aplicar un paso. Quita el detalle prescindible y coloca el ejemplo o diagrama donde se usa. [Guía sobre carga cognitiva de NSW](https://education.nsw.gov.au/about-us/education-data-and-research/cese/publications/practical-guides-for-educators/managing-cognitive-load-through-effective-presentations), [guía educativa del IES](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)
- En recetas complejas, usa `resumenFinal` con dos a cuatro viñetas solo si ayudan a retomar el trabajo. Recupera una decisión, una precaución o la ruta siguiente. Evita repetir los pasos y deja el cierre breve cuando la receta sea simple.
- Si el objetivo explícito del capítulo es aprender, puedes incluir una pregunta breve de repaso y una respuesta consultable. La práctica de recuperar información de memoria ha mejorado el recuerdo diferido de textos en estudios experimentales. [Roediger y Karpicke](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- Un `aviso('alerta')` solo para pérdida de datos o seguridad; si todo es alerta, nada lo es.
- `nota` (manuscrita): máximo una frase corta por hoja.
- Comandos: uno por línea, sin salida esperada mezclada; si hay variables, usa `<marcador>` y explícalo en el resumen.
- Textos de estado deben coincidir con la verdad del repositorio: revisa el código, `docs/` y la bitácora antes de afirmar.
- Identidad: paleta de cuero y pergamino (no cambiarla); estados con glifos/tramas, no solo color.

## 7. Cómo construir y verificar

```
node _motor/construir.mjs                      # todos los diarios + estantería
node _motor/construir.mjs <slug>               # solo uno
node _motor/construir.mjs plantilla            # vista previa de la plantilla
node _motor/verificar.mjs diarios/<slug>/manual.html   # solo el verificador
```

El constructor **falla** (código 1) por: campos faltantes, ids repetidos o no kebab-case, posit > 18 caracteres, paso sin título/resumen/`donde`,
hoja de más de 5.200 caracteres, enlace interno a una hoja inexistente, imagen faltante o sin `alt`, simulador con icono inexistente,
recurso externo, estilo/script en línea y posibles secretos. **Avisa** ante una hoja larga, más de un diagrama por hoja, un diagrama sin pie o un archivo enlazado que no existe.
**Arregla todos los errores y revisa todos los avisos** antes de dar el diario por terminado.

Después de construir, **míralo** (servidor local, p. ej. `python -m http.server` en `la carpeta de la colección`, y abre `diarios/<slug>/manual.html`):
portada, índice, un paso, el diagrama, un simulador, y un folio con dos columnas. Detén el servidor al terminar.

## 8. Lo que NO debes hacer

- Editar a mano `diarios/<slug>/manual.html`, `index.html`, `assets/manual.css` o `assets/manual.js` para añadir contenido. Si falta una primitiva, **pídela/propónla** (se añade al motor), no la imites con HTML.
- Dejar texto de plantilla («Quiero hacer X», `AAAA-MM-DD`) en un diario real.
- Afirmar que algo está desplegado, cifrado o verificado sin evidencia.

## 9. Lista final antes de entregar

- [ ] `node _motor/construir.mjs` termina con ✓ y sin avisos sin justificar.
- [ ] Cada capítulo se puede leer de corrido, sin pestañas ni submenús.
- [ ] Cada situación enlaza a una receta concreta. Las salidas, casillas y viñetas finales ayudan a actuar o a retomar el trabajo.
- [ ] El motor dejó una página en blanco después de cada capítulo.
- [ ] Estados (`ok/pend/no`) coinciden con la realidad del repositorio.
- [ ] No hay secretos, datos personales ni marcas inventadas.
- [ ] Revisado en el navegador en 1 y 2 columnas.
- [ ] Informé al usuario qué cambió y qué quedó sin verificar.
