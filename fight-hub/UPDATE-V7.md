# FIGHT HUB v7 — historial relativo al peleador

## Corrección principal

El historial ahora usa **UFCStats como fuente primaria** para WIN/LOST. En la página de detalles de UFCStats, la columna W/L corresponde al peleador cuyo perfil se está viendo, por lo que el resultado se muestra desde su perspectiva.

- Si el peleador del perfil ganó: `WIN` (verde).
- Si perdió: `LOST` (rojo).
- Empate: `DRAW`.
- No Contest: `NC`.
- Siempre se muestra el rival correcto en `VS`.

UFC.com queda como respaldo únicamente si UFCStats no devuelve historial. Las filas ambiguas no se inventan.
