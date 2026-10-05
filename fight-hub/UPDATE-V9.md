# v9 — historial restaurado con ESPN

- El historial ahora usa como fuente principal la página pública **ESPN MMA Fight History** de cada peleador.
- ESPN publica por fila: fecha, oponente, resultado W/L, método/decisión, round, tiempo y evento.
- `W` se normaliza como `WIN` y `L` como `LOSS`; la UI muestra `LOST` en rojo para una derrota.
- El resultado se toma de la página de historial del propio peleador, por lo que siempre está expresado desde su perspectiva.
- UFCStats queda solamente como respaldo si ESPN no devuelve historial.
- No se inventan resultados si ninguna fuente devuelve datos verificables.
