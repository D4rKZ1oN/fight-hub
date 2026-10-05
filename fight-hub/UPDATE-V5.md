# FIGHT HUB v5 — búsqueda + historial

## Cambios

1. Búsqueda de peleadores más tolerante:
   - normaliza acentos, apóstrofes y mayúsculas;
   - intenta primero el directorio oficial de UFC;
   - si falta una coincidencia exacta, verifica el slug directo del perfil;
   - usa UFCStats únicamente como índice secundario de nombres y solo devuelve candidatos que tengan perfil UFC válido.

2. Fight History:
   - victorias muestran **GANÓ**;
   - derrotas muestran **PERDIÓ**;
   - también aparece **GANÓ CONTRA** / **PERDIÓ CONTRA** encima del rival;
   - DRAW y NC mantienen estados separados.

No se inventan resultados ni peleadores.
