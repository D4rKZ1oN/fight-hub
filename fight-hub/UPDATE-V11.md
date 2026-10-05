# v11 — Build fix

- Corrige el error TS2305 de `espnHistoryProvider.ts`.
- Incluye un archivo de compatibilidad en esa misma ruta para sobreescribir el archivo viejo que quedó en GitHub.
- Vuelve a exportar `fetchHtmlFresh` por compatibilidad.
- El historial activo sigue siendo el sistema simple de v10 (UFC.com + respaldo UFCStats).
