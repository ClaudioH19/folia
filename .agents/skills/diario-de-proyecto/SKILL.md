---
name: diario-de-proyecto
description: Crea o actualiza un manual HTML de proyecto con aspecto de diario antiguo, accesos por tarea, procedimientos verificables y una estantería que funciona sin conexión.
---

# Diario de proyecto

Parte del manual, el repositorio o las notas que la persona quiera documentar. La unidad del diario es la situación del lector. Empieza por su estado observable, lo que quiere lograr y cómo sabrá que terminó. Enlaza cada entrada de la guía a una receta secuencial con los requisitos, una acción por paso y una comprobación observable. Conserva la información que sirva para decidir, actuar, evitar un error o verificar. Lleva las explicaciones de consulta a capítulos breves enlazados desde el paso pertinente. Distingue lo documentado, lo probado localmente y lo verificado en el entorno real.

## Composición

Cada página admite `cols: 1` o `cols: 2`. El contenido entra en `bloques` mediante las primitivas `d.*`. Usa una columna para recetas, comandos, verificaciones y figuras. Reserva dos columnas para material de consulta breve. El motor agrega una página en blanco al final de cada capítulo. Tanto la portadilla como el índice, la guía, la ficha y los capítulos usan folios numerados. En escritorio se ven dos folios enfrentados. Sus columnas se configuran por separado.

En modo Mano, arrastra hacia abajo para avanzar hacia el final del folio o hacia arriba para volver al inicio. Arrastra de lado para pasar la hoja. La rueda y el trackpad solo desplazan el contenido del folio. Usa el arrastre lateral, los botones o las flechas para cambiar de página. La barra también permite destacar texto en cuatro colores y pegar pósits. Cada pósit se edita sobre el folio y se mueve por su tira superior. Su pestaña numerada abre la página y enfoca la nota. El navegador guarda el texto, la posición y los destacados. Durante la sesión, Deshacer (`Ctrl+Z`) y Rehacer (`Ctrl+R`, `Ctrl+Y` o `Ctrl+Mayús+Z`) recorren los cambios de anotaciones del diario.

Configura las herramientas por hoja o procedimiento con `d.destacado()` y `d.posit()`. Las definiciones anteriores pueden seguir usando `d.subrayado()` y `d.notaPersonal()`. Usa `d.nota(texto)` para las notas del autor. Los diagramas se ajustan al folio al abrirlo. **Ampliar diagrama** permite recorrer los detalles dentro de la página y **Ajustar a la página** recupera la vista completa.

La colección abre dentro de una sala navideña en primera persona. Haz clic en la sala para capturar el puntero y mirar con el ratón. Usa WASD para caminar, la mira para apuntar a un libro y Esc para devolver el cursor. M silencia el audio durante la exploración. En móvil, desliza para mirar. Al apuntar a un lomo, se ilumina y muestra el título del diario. Pulsa para sacarlo. En móvil, toca el lomo y pulsa **Abrir diario**. Con Tab se enfoca cada volumen y con Enter se abre. La biblioteca admite 18 diarios en tres niveles de seis. La animación ambiental del fuego, la luz y la nieve respeta la preferencia de movimiento reducido. Si WebGL no está disponible, el índice ofrece enlaces directos. La música y los pasos se sintetizan sin conexión y se pueden silenciar con el botón de la esquina superior.

## Crear una edición

Al abrir un diario, el lector conserva el encuadre de la sala como fondo difuminado durante la sesión. Si se abre por enlace directo sin una vista guardada, usa la imagen local de entrada.

Necesitas Node.js 18 o posterior para generar el HTML. Para leerlo basta un navegador. Las rutas siguientes son relativas a la carpeta de la skill, salvo el comando de construcción que se ejecuta desde la colección.

### Cuando el proyecto fuente está en otra carpeta

Trata la carpeta que el agente tiene abierta como fuente de documentación. Usa la ruta de colección indicada en la petición como destino. Lee el código, manual o notas de la fuente y escribe el diario solo en `diarios/<slug>/` de la colección. Si la colección es externa al espacio de escritura, pide acceso a esa carpeta. Si no se indicó colección y hay varias opciones, solicita la ruta antes de escribir.

Desde cualquier carpeta, ejecuta `node "<ruta-a-la-skill>/scripts/nuevo.mjs" "<ruta-a-la-colección>" <slug>`. Para una edición existente, conserva su slug e identificadores y edita directamente su definición. Construye con `node "<ruta-a-la-colección>/_motor/construir.mjs" <slug>`. La URL del resultado es `/manuales/diarios/<slug>/manual.html` en el servidor de la colección.

### Redactar y verificar

1. Ejecuta `node scripts/nuevo.mjs "<carpeta-de-la-coleccion>" <slug>`. Crea el motor local y un ejemplo editable en `diarios/<slug>/diario.mjs`. En una colección existente, usa el motor que ya tiene. Si el diario ya existe, edita su definición directamente.
2. Consulta el [contrato de las primitivas](assets/base/_motor/REGLAS-DEL-DIARIO.md) y el [diario de ejemplo](assets/base/_motor/plantilla/diario.mjs). El motor genera la sala interactiva desde los diarios de la colección y aplica el lector de folios a cada edición. Usa las primitivas necesarias para el contenido del proyecto.
3. Sustituye el ejemplo por el manual real. En la guía de consulta usa `situaciones` para las entradas más frecuentes, con un verbo y un resultado reconocible. El índice ya enumera todos los capítulos. Titula cada hoja con la pregunta que responde o la acción que permite realizar. Agrupa operaciones cortas cuando comparten una comprobación. Mantén comandos, precauciones y comprobación junto al paso correspondiente.
4. Usa `d.pasos` para procedimientos y `d.capitulo` para explicación o consulta. Enlaza las ramas por su identificador estable. Reserva los simuladores para procesos donde recorrer las etapas o elegir un fallo ayude a entender el resultado. En actualizaciones, conserva los enlaces y las marcas ya utilizadas cuando el contenido siga siendo el mismo.
5. Desde la colección ejecuta `node _motor/construir.mjs <slug>`. Al preparar una colección para uso local, levanta o reutiliza el servidor de abajo y entrega su URL. Abre el diario desde la sala y prueba una ruta desde la guía de consulta, un paso desde el índice del procedimiento y la vuelta al índice. Revisa móvil y movimiento reducido si cambiaste el lector. Comprueba las descargas y resuelve los avisos del contenido real.

Entrega la ubicación del HTML y las comprobaciones pendientes. Para distribuir un diario offline, incluye su carpeta generada con sus recursos, la carpeta compartida `assets/` y el `index.html` de la colección con los diarios que enlaza. Para distribuir esta skill, comparte el ZIP original.

## Uso después de descargar

Descomprime la carpeta `diario-de-proyecto` en `.agents/skills/` del proyecto donde usarás Codex. Pide, por ejemplo, «Usa $diario-de-proyecto para convertir el manual de este repositorio en un diario HTML». También puedes ejecutar los comandos anteriores directamente desde una copia descomprimida.

## Abrir en localhost

Después de construir una colección, ejecuta `node _motor/servir.mjs` desde su raíz y abre <http://127.0.0.1:4317/manuales/>. El proceso usa Node.js y escucha en la interfaz local. Si el puerto está ocupado por otra colección, pásale un puerto distinto como primer argumento y entrega la URL correspondiente. Reutiliza el proceso si esa misma colección ya está disponible.

En Windows, si quieres dejarlo en segundo plano, ejecuta desde la raíz de la colección:

```powershell
$proceso = Start-Process -FilePath node -ArgumentList '_motor/servir.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -PassThru
$proceso.Id
```

Puedes detener ese proceso con `Stop-Process -Id $proceso.Id` desde la misma consola. En primer plano se detiene con Ctrl+C.

La portada **Manuales** solicita el clic de entrada que el navegador necesita para tomar el control del ratón y activar el sonido. El lector se abre sobre la sala, por lo que la música continúa si el sonido está activo. El servidor guarda el silencio, el progreso, las comprobaciones y las anotaciones en `.manuales/estado.json` cuando hay cambios. Mantén ese archivo local y fuera del ZIP. Al abrir el HTML directamente, los cambios se guardan en el navegador.

