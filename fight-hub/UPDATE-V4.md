# FIGHT HUB v4 — UFC fixes

Esta versión corrige los seis puntos solicitados:

1. **Estados de próximos eventos**: usa el estado de ESPN y, si el evento proviene del calendario futuro, lo marca como `PRÓXIMAMENTE` en vez de `ESTADO NO DISPONIBLE`.
2. **Arena/ubicación**: complementa Fightcenter con el scoreboard de ESPN del día del evento para recuperar venue, ciudad, estado y país.
3. **Fight History**: intenta primero leer `athlete record` desde UFC.com, incluyendo páginas anteriores; UFCStats queda solo como respaldo.
4. **Fotos del directorio**: mejora la extracción de imágenes del listado y, si falta una, la tarjeta consulta el perfil en segundo plano.
5. **Mis peleadores favoritos**: nueva colección local en `/fighters`, con estrella para agregar/quitar. Se guarda en `localStorage` del navegador/PWA.
6. **Champion**: ya no busca la palabra genérica `Champion`; solo muestra la insignia cuando UFC.com publica la etiqueta exacta `Title Holder`.

## Actualizar en GitHub / Vercel

Sube **el contenido de esta carpeta** a la raíz de tu repositorio `fight-hub`, reemplazando los archivos existentes. Haz `Commit changes`. Vercel detectará el commit y desplegará automáticamente.

Los favoritos son personales del navegador/dispositivo actual. No requieren cuenta ni base de datos.
