# FIGHT HUB

MVP personal y gratuito para consultar eventos UFC/MMA, carteleras, peleadores, estadísticas y rankings.

## Fuentes

- ESPN: scoreboard y fightcenter públicos/no documentados oficialmente como API pública.
- UFC.com: directorio, perfiles y rankings oficiales mediante lectura server-side del HTML público.

No usa API keys ni servicios de datos de pago. Si una fuente cambia su estructura, la app muestra estados vacíos/error en vez de inventar datos.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000

## Variables

```env
SPORTS_DATA_PROVIDER=espn
NEXT_PUBLIC_APP_NAME=FIGHT HUB
```

## Deploy en Vercel

1. Sube el proyecto a GitHub.
2. En Vercel: Add New > Project > Import `fight-hub`.
3. Añade las dos variables anteriores.
4. Deploy.

No necesitas API key.

## Aviso técnico

Los endpoints de ESPN usados por el proyecto son endpoints públicos utilizados por ESPN, pero no una API pública documentada con SLA. El patrón Provider/Adapter permite reemplazarlos sin reescribir la UI.

## v3 - corrección de TypeScript
Se tiparon explícitamente `fighter`, `stats` y `history` en la página de perfil para evitar el error TS7034/TS7005 durante el build de Vercel.

## v4 — correcciones UFC
- Los próximos eventos ya no muestran `ESTADO NO DISPONIBLE` cuando ESPN los identifica como programados.
- El detalle de eventos usa el scoreboard por fecha como respaldo para arena/ciudad/país.
- Fight History intenta primero el historial publicado en UFC.com y usa UFCStats solo como respaldo.
- Las tarjetas del directorio recuperan la foto del perfil cuando el listado no la entrega.
- Se agregó `Mis peleadores favoritos`, guardado localmente en el navegador/PWA.
- `CHAMPION` solo aparece cuando el perfil oficial incluye la etiqueta exacta `Title Holder`.

## v10 — historial simple corregido
Se restauró el historial basado en UFC.com que sí cargaba visualmente y se corrigió WIN/LOST para que siempre sea relativo al peleador cuyo perfil está abierto.

## v11 — corrección de despliegue
Se corrigió el archivo obsoleto `lib/providers/espnHistoryProvider.ts` que podía quedar en GitHub después de subir versiones nuevas desde el navegador. El historial activo continúa usando el flujo simple de v10.
