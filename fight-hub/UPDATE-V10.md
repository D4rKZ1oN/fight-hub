# v10 — Historial simple WIN / LOST corregido

Esta versión vuelve al historial simple que sí aparecía en pantalla.

- Fuente principal: `Athlete Record` de UFC.com, igual que en la versión que sí mostraba historial.
- No usa ESPN para reemplazar el historial.
- No depende de UFCStats para que aparezcan las filas; UFCStats queda solo como respaldo si UFC.com no entrega historial.
- La etiqueta del resultado se convierte a la perspectiva del peleador cuyo perfil se está viendo:
  - `WIN` verde si ese peleador ganó.
  - `LOST` rojo si ese peleador perdió.
  - `DRAW` y `NC` se conservan.
- El rival sigue apareciendo junto con fecha, método, round y tiempo.

La corrección clave es que UFC.com puede marcar el resultado con relación al primer nombre del matchup. Ahora Fight Hub detecta en qué lado aparece el peleador del perfil y, si está del segundo lado, invierte WIN/LOSS.
