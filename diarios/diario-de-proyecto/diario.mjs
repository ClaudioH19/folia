import { d } from '../../_motor/bloques.mjs';

export default {
  slug: 'diario-de-proyecto',
  marca: 'Diario de proyecto',
  titulo: 'Cómo leer y escribir un diario de proyecto',
  emblema: 'libro',
  descripcion: 'Abre un libro en la sala, añade el manual de otro proyecto o corrige una receta que ha cambiado.',
  portada: {
    sup: 'Manuales de la colección',
    lead: '¿Tienes la colección en tu equipo y buscas un libro? ¿Tienes un proyecto que aún no figura en el estante? Elige tu caso en la <a href="#rutas">guía de consulta</a>. También puedes volver a una receta para ponerla al día.',
  },
  situaciones: [
    { cap: 'abrir-sala', t: 'Tengo la colección y quiero abrir un libro', d: 'Entra en la sala local y reconoce el diario por el título de su portada.' },
    { cap: 'crear-diario', t: 'Tengo el manual en otro proyecto y quiero añadirlo al estante', d: 'Convierte una tarea del proyecto en una receta que puedas abrir desde su propio lomo.' },
    { cap: 'actualizar-diario', t: 'Un paso del diario ya no coincide con el proyecto', d: 'Corrige la receta y comprueba que el enlace habitual lleva al paso actualizado.' },
  ],
  capitulos: [
    d.pasos({
      id: 'abrir-sala', posit: 'Abrir la sala', etiqueta: 'Lectura', titulo: 'Abre un libro desde la sala',
      bajada: 'Con la colección ya compilada, puedes llegar a la portada del libro en un par de minutos.',
      antes: [d.p('Necesitas un navegador. Para usar el servidor local, abre una terminal en la carpeta que contiene <code>_motor</code> e <code>index.html</code>. Necesitas Node.js 18 o posterior.')],
      pasos: [
        {
          titulo: 'Inicia el servidor de la colección', donde: 'equipo',
          resumen: 'Ejecuta el comando y deja abierta esa terminal mientras lees. Si ya tienes esta colección en marcha, usa la dirección que muestra su terminal.',
          cmds: [{ t: 'Desde la colección', c: 'node _motor/servir.mjs' }],
          puntos: ['Si el puerto pertenece a otra colección, ejecuta <code>node _motor/servir.mjs 4318</code> y abre la dirección que imprima la consola.'],
          aviso: { tipo: 'info', texto: 'Si solo quieres leer el HTML, abre <code>index.html</code> en el navegador y sigue desde la entrada de la sala.' },
          listo: ['La consola muestra la dirección de Manuales, por defecto <code>http://127.0.0.1:4317/manuales/</code>, o ya ves la colección abierta en el navegador.'],
        },
        {
          titulo: 'Entra en la sala de lectura', donde: 'equipo',
          resumen: 'En la dirección local, pulsa <strong>Entrar a la sala</strong> en la portada <strong>Manuales</strong>. Si el navegador muestra una lista de libros, puedes elegir el título directamente.',
          listo: ['Ves la estantería o la lista de títulos de la colección.'],
        },
        {
          titulo: 'Abre el libro por su título', donde: 'equipo',
          resumen: 'Apunta al lomo y haz clic cuando aparezca el título que buscas. Para abrir este libro, busca <strong>Diario de proyecto</strong>.',
          puntos: ['Con teclado, usa Tab hasta enfocar el libro y pulsa Enter.', 'En una pantalla táctil, toca el lomo y pulsa <strong>Abrir diario</strong>.'],
          listo: ['La portada del libro elegido está a la vista. La de este volumen dice «Cómo leer y escribir un diario de proyecto».'],
        },
      ],
      final: 'Libro abierto', finalTexto: 'El atajo <strong>Volver a la sala</strong> te devuelve al estante para elegir otro título.',
    }),
    d.pasos({
      id: 'crear-diario', posit: 'Crear un diario', etiqueta: 'Primera edición', titulo: 'Crea un diario desde otro proyecto',
      bajada: 'Lleva una tarea documentada a un libro propio. El tiempo de redacción depende de lo que necesites comprobar en el proyecto.',
      antes: [d.p('Necesitas Node.js 18 o posterior, el manual o las notas del proyecto y una carpeta de destino vacía o una colección existente. El ejemplo usa <code>huerto</code> como nombre de carpeta del libro. Elige uno libre, en minúsculas y con guiones entre palabras.')],
      pasos: [
        {
          titulo: 'Abre la skill desde el proyecto de origen', donde: 'equipo',
          resumen: 'Abre Codex o Claude Code en el proyecto cuyo manual quieres documentar. Si instalaste la skill en tu carpeta personal, invoca <code>$diario-de-proyecto</code> en Codex o <code>/diario-de-proyecto</code> en Claude Code.',
          listo: ['El agente reconoce la skill y puede leer la documentación del proyecto abierto.'],
        },
        {
          titulo: 'Crea el libro en la colección de destino', donde: 'equipo',
          resumen: 'Ejecuta el comando desde el proyecto externo. Indica la carpeta donde instalaste la skill y la ruta completa de la colección de destino. Conserva las comillas si hay espacios.',
          cmds: [{ t: 'Desde el proyecto de origen', c: 'node "<ruta-a-la-skill>/scripts/nuevo.mjs" "<ruta-de-la-coleccion>" huerto' }],
          aviso: { tipo: 'info', texto: 'Si el libro ya existe y quieres revisarlo, sigue la receta <a href="#actualizar-diario">Actualiza una receta del diario</a>.' },
          listo: ['La consola indica qué archivo editar. Su ruta termina en <code>diarios/huerto/diario.mjs</code> dentro de la colección elegida.'],
        },
        {
          titulo: 'Escribe la primera receta', donde: 'equipo',
          resumen: 'Sustituye el ejemplo de <code>diarios/huerto/diario.mjs</code> por una tarea del manual de origen. Puedes pedírselo a Codex desde el proyecto indicando la fuente y la ruta de destino.',
          puntos: ['Pon el nombre del proyecto en <code>marca</code> y el propósito del libro en <code>titulo</code>. Conserva el <code>slug</code> que creó el comando.', 'Describe el problema del lector en <code>situaciones</code>. Haz coincidir su <code>cap</code> con el <code>id</code> de una receta <code>d.pasos</code>.', 'Comprueba las acciones con la fuente. En cada paso indica qué hacer y qué señal permite marcar «Listo cuando…».'],
          listo: ['La situación apunta a la receta por su identificador y el último paso nombra un resultado que el lector puede observar.'],
        },
        {
          titulo: 'Compila el nuevo diario', donde: 'equipo',
          resumen: 'Abre la terminal en la colección de destino y usa el mismo nombre que elegiste al crear el libro. El motor genera el HTML y actualiza el estante.',
          cmds: [{ t: 'Desde la colección de destino', c: 'node _motor/construir.mjs huerto' }],
          listo: ['La consola marca con ✓ el manual de huerto y la estantería. Has resuelto los errores y revisado los avisos que hayan aparecido.'],
        },
        {
          titulo: 'Prueba la entrada de la guía', donde: 'equipo',
          resumen: 'Abre el nuevo libro <a href="#abrir-sala">desde la sala</a>. En la guía de consulta, elige la situación que acabas de escribir y sigue un paso desde el resumen.',
          listo: ['El lomo lleva a tu libro y la situación lleva a una hoja donde puedes leer la acción y su «Listo cuando…».'],
        },
      ],
      final: 'Primera receta disponible', finalTexto: 'Ya puedes llevar al lector desde el problema que reconoce hasta una acción que puede comprobar.',
    }),
    d.pasos({
      id: 'actualizar-diario', posit: 'Actualizar', etiqueta: 'Nueva edición', titulo: 'Actualiza una receta del diario',
      bajada: 'Si cambió un comando o el resultado de un paso, puedes corregir su hoja en unos minutos una vez confirmado el cambio.',
      antes: [d.p('Ten a mano la fuente vigente del proyecto, la definición del libro en la colección y Node.js 18 o posterior.')],
      pasos: [
        {
          titulo: 'Localiza el paso que cambió', donde: 'equipo',
          resumen: 'Sigue la situación desde la guía y compara el paso con el manual o el código vigente del proyecto.',
          listo: ['Puedes señalar el título de la hoja, la instrucción que ha caducado y el resultado que ahora debe ver el lector.'],
        },
        {
          titulo: 'Corrige la hoja en su definición', donde: 'equipo',
          resumen: 'Edita el paso en <code>diarios/&lt;slug&gt;/diario.mjs</code>. Si cambió la salida esperada, ajusta también <code>listo</code>.',
          puntos: ['Para una corrección en la misma hoja, conserva el identificador del capítulo y la posición del paso y de sus casillas. El motor usa esos datos para los enlaces y las marcas.'],
          listo: ['La definición contiene la acción vigente y su comprobación en el mismo paso.'],
        },
        {
          titulo: 'Regenera el libro corregido', donde: 'equipo',
          resumen: 'Desde la colección, compila con el nombre de la carpeta del diario. Este comando actualiza el libro que estás leyendo. Para otro volumen, cambia el último argumento.',
          cmds: [{ t: 'Desde la colección', c: 'node _motor/construir.mjs diario-de-proyecto' }],
          listo: ['La consola muestra ✓ junto al manual del libro corregido y al índice de la estantería.'],
        },
        {
          titulo: 'Recorre la ruta de la corrección', donde: 'equipo',
          resumen: 'Vuelve a abrir el diario desde la sala. Sigue la situación y elige el paso corregido en el resumen del procedimiento. Usa el atajo <strong>Índice</strong> para regresar.',
          listo: ['Has visto la instrucción y su comprobación actualizadas en la hoja esperada. El índice vuelve a mostrar el capítulo.'],
        },
      ],
      final: 'Corrección comprobada', finalTexto: 'La misma situación de la guía lleva a la receta revisada.',
    }),
  ],
};
