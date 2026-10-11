# Laboratorio VGC

Seguimiento de repeticiones de Pokémon Showdown para VGC, con aspecto de hoja de cálculo. Inspirado en la hoja **PASRS** (PALKIA Academy Showdown Reporting Spreadsheet) de Bauerdad y v0Lt.

Pegas tus enlaces de repeticiones y la app lee cada partida directamente de Showdown: resultado, equipos de la vista previa, leads, Pokémon que salieron, Megas, OTS, ELO y movimientos usados.

## Pestañas

| Pestaña | Qué muestra |
| --- | --- |
| **Inicio** | Tu nombre de Showdown, tu pokepaste y un resumen. |
| **Replays** | Lista de enlaces con notas. Lee las repeticiones de Showdown. |
| **Partida a partida** | Una fila por partida, con filtros (resultado, Pokémon rival, leads y atrás de cada lado, Megas, OTS, ELO mínimo). |
| **Sets** | Partidas al mejor de 3 agrupadas en sets, con marcador y notas. |
| **Uso** | Win% total, OTS/CTS, Win% de cada Pokémon llevado, de lead y con Mega, y parejas de leads. |
| **Matchups** | Mejores y peores Pokémon rivales, cuáles llevan más o menos, y detalle de hasta 8. |
| **Movimientos** | Cuántas veces usaste cada movimiento con cada Pokémon. |

Uso, Matchups y Movimientos respetan los filtros de «Partida a partida».

## Uso

```bash
npm install
npm run dev
```

Abre http://localhost:5173 y:

1. En **Inicio**, escribe tu nombre de Showdown y carga tu pokepaste.
2. En **Replays**, pega los enlaces (uno por línea) y pulsa **Añadir**.

Los datos se guardan en el `localStorage` del navegador.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm test` | Pruebas del lector de repeticiones (Vitest) |
| `npm run typecheck` | Solo comprobación de tipos |

## Estructura

```
src/
  lib/replay.ts    lectura y análisis del log de Showdown
  lib/stats.ts     filtros y estadísticas (uso, leads, matchups, sets, movimientos)
  lib/paste.ts     lectura de pokepast.es
  lib/storage.ts   estado y guardado en localStorage
  components/ui.tsx  sprites, bloques con marco, celdas
  sheets/          una vista por pestaña
```

Los sprites se cargan desde `play.pokemonshowdown.com`.

## Limitaciones

- Solo dobles de Showdown (VGC).
- Las Megas cuentan como su forma base en las estadísticas.
- Si cambias tu nombre de Showdown después de leer partidas, usa «Volver a leer todas».
