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
          resumen: 'Ejecuta el comando, deja abierta la terminal y abre la dirección que imprime. El puerto habitual es 4317. Si ya tienes esta colección en marcha, usa su dirección.',
          cmds: [{ t: 'Desde la colección', c: 'node _motor/servir.mjs' }],
          puntos: ['Si el puerto pertenece a otra colección, ejecuta <code>node _motor/servir.mjs 4318</code> y abre la dirección que imprima la consola.'],
          aviso: { tipo: 'info', texto: 'Si solo quieres leer el HTML, abre <code>index.html</code> en el navegador y sigue desde la entrada de la sala.' },
        },
        {
          titulo: 'Entra en la sala de lectura', donde: 'equipo',
          resumen: 'En la dirección local, pulsa <strong>Entrar a la sala</strong> en la portada <strong>Manuales</strong>. Si el navegador muestra una lista de libros, puedes elegir el título directamente.',
        },
        {
          titulo: 'Abre el libro por su título', donde: 'equipo',
          resumen: 'Apunta al lomo y haz clic cuando aparezca el título que buscas. Para abrir este libro, busca <strong>Diario de proyecto</strong>.',
          puntos: ['Con teclado, usa Tab hasta enfocar el libro y pulsa Enter.', 'En una pantalla táctil, toca el lomo y pulsa <strong>Abrir diario</strong>.'],
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
          resumen: 'Abre Codex o Claude Code en el proyecto que quieres documentar. Invoca <code>$diario-de-proyecto</code> en Codex o <code>/diario-de-proyecto</code> en Claude Code.',
          puntos: ['Si falta la skill, ejecuta este comando desde la colección que la contiene y abre una sesión nueva en el proyecto de origen. El README incluye la instalación desde GitHub.'],
          cmds: [{ t: 'Desde la colección de la skill', c: 'node .agents/skills/diario-de-proyecto/scripts/instalar.mjs' }],
        },
        {
          titulo: 'Crea el libro en la colección de destino', donde: 'equipo',
          resumen: 'Desde el proyecto externo, indica la carpeta donde instalaste la skill y la ruta completa de la colección. La consola imprime la ruta del archivo que vas a editar.',
          cmds: [{ t: 'Desde el proyecto de origen', c: 'node "<ruta-a-la-skill>/scripts/nuevo.mjs" "<ruta-de-la-coleccion>" huerto' }],
          aviso: { tipo: 'info', texto: 'Si el libro ya existe y quieres revisarlo, sigue la receta <a href="#actualizar-diario">Actualiza una receta del diario</a>.' },
        },
        {
          titulo: 'Escribe la primera receta', donde: 'equipo',
          resumen: 'Sustituye el ejemplo de <code>diarios/huerto/diario.mjs</code> por una tarea del manual de origen. Puedes pedírselo a Codex desde el proyecto indicando la fuente y la ruta de destino.',
          puntos: ['Pon el nombre del proyecto en <code>marca</code> y el propósito del libro en <code>titulo</code>. Conserva el <code>slug</code> que creó el comando.', 'Describe el problema del lector en <code>situaciones</code>. Haz coincidir su <code>cap</code> con el <code>id</code> de una receta <code>d.pasos</code>.', 'Ordena las acciones según el manual o el código. Junto a una acción, indica qué salida observar si de ella depende el paso siguiente.'],
        },
        {
          titulo: 'Compila el nuevo diario', donde: 'equipo',
          resumen: 'Abre la terminal en la colección de destino y usa el mismo nombre que elegiste al crear el libro. El motor genera el HTML y actualiza el estante.',
          cmds: [{ t: 'Desde la colección de destino', c: 'node _motor/construir.mjs huerto' }],
        },
        {
          titulo: 'Prueba la entrada de la guía', donde: 'equipo',
          resumen: 'Abre el nuevo libro <a href="#abrir-sala">desde la sala</a>. En la guía de consulta, elige la situación que acabas de escribir y sigue un paso desde el resumen.',
        },
      ],
      final: 'Primera receta disponible',
      resumenFinal: [
        'El proyecto fuente respalda los pasos. La colección guarda el libro y sus recursos.',
        'Si el agente no puede escribir en la colección, autoriza esa carpeta para guardar la edición.',
        'Cuando cambie el procedimiento, vuelve a <a href="#actualizar-diario">la receta de actualización</a> para conservar los enlaces del libro.',
      ],
    }),
    d.pasos({
      id: 'actualizar-diario', posit: 'Actualizar', etiqueta: 'Nueva edición', titulo: 'Actualiza una receta del diario',
      bajada: 'Si cambió un comando o el resultado de un paso, puedes corregir su hoja en unos minutos una vez confirmado el cambio.',
      antes: [d.p('Ten a mano la fuente vigente del proyecto, la definición del libro en la colección y Node.js 18 o posterior.')],
      pasos: [
        {
          titulo: 'Localiza el paso que cambió', donde: 'equipo',
          resumen: 'Sigue la situación desde la guía y compara el paso con el manual o el código vigente del proyecto.',
        },
        {
          titulo: 'Corrige la hoja en su definición', donde: 'equipo',
          resumen: 'Edita el paso en <code>diarios/&lt;slug&gt;/diario.mjs</code>. Si el lector necesita reconocer una salida para continuar, descríbela junto a la instrucción.',
          puntos: ['Conserva el identificador del capítulo y la posición del paso si quieres mantener su enlace.'],
        },
        {
          titulo: 'Regenera el libro corregido', donde: 'equipo',
          resumen: 'Desde la colección, compila con el nombre de la carpeta del diario. Este comando actualiza el libro que estás leyendo. Para otro volumen, cambia el último argumento.',
          cmds: [{ t: 'Desde la colección', c: 'node _motor/construir.mjs diario-de-proyecto' }],
        },
        {
          titulo: 'Recorre la ruta de la corrección', donde: 'equipo',
          resumen: 'Vuelve a abrir el diario desde la sala. Sigue la situación y elige el paso corregido en el resumen del procedimiento. Usa el atajo <strong>Índice</strong> para regresar.',
        },
      ],
      final: 'Corrección comprobada', finalTexto: 'La misma situación de la guía lleva a la receta revisada.',
    }),
  ],
};
