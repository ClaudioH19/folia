# Crear o editar un diario

Lee [las reglas del diario](_motor/REGLAS-DEL-DIARIO.md) y [la skill](.agents/skills/diario-de-proyecto/SKILL.md). El [ejemplo editable](_motor/plantilla/diario.mjs) muestra las primitivas.

- Empieza por lo que le ocurre al lector y el resultado que busca. Enlaza cada situación de la guía a su receta.
- Usa una acción principal por paso. Incorpora una señal observable junto a la acción si ayuda a avanzar, elegir una ruta o detectar un fallo. Reserva «Listo cuando…» para revisiones donde marcar varios puntos aporte valor.
- Cierra con unas pocas viñetas solo si ayudan a retomar una decisión, una precaución o el paso siguiente.
- Usa una columna para recetas y hasta dos para consulta breve. Coloca diagramas e imágenes donde ayuden a actuar.
- Edita `diarios/<slug>/diario.mjs` y ejecuta `node _motor/construir.mjs <slug>`. El motor añade los folios en blanco. Verifica los enlaces y el flujo en el HTML generado.

Si existe un grafo local de Graphify, úsalo para ubicar archivos y relaciones. Confirma las afirmaciones con las fuentes antes de incorporarlas al diario.
