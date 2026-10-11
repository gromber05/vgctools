# VGC Tools

Organiza tus equipos de Pokémon VGC y analiza tus repeticiones de Pokémon Showdown. Inspirado en la hoja **PASRS** (PALKIA Academy Showdown Reporting Spreadsheet) de Bauerdad y v0Lt, pero como web con cuentas de usuario, sprites y un equipo por página.

```
pokemonvgc/
  web/                 frontend (React + Vite + TypeScript)
  backend/             API (FastAPI + SQLAlchemy)
  docker-compose.yml   web + API + PostgreSQL, en el puerto 8180
```

## Qué hace

- **Cuentas:** te registras con usuario y contraseña; tus equipos y tus nombres de Showdown se guardan en el servidor.
- **Equipos:** crea uno por cada pokepaste (enlace de pokepast.es o texto en formato Showdown). Cada equipo guarda sus partidas por separado.
- **Repeticiones:** pega enlaces de `replay.pokemonshowdown.com` y la web lee de cada partida el resultado, la vista previa de ambos, leads, quién salió, Megas, OTS, ELO, serie Bo3 y movimientos usados.
- **Resumen, Partidas, Tus Pokémon, Rivales y Sets:** win% total y por Pokémon, por lead y con Mega, gráfico de ELO, leads más usados, tu win% contra cada Pokémon rival y uso de movimientos, con filtros como en PASRS.

## Arrancar con Docker (recomendado)

```bash
cp .env.example .env      # y cambia POSTGRES_PASSWORD y SECRET_KEY
docker compose up -d --build
```

Abre http://localhost:8180. Nginx sirve la web y pasa `/api` al backend; los datos viven en el volumen `db-data` de PostgreSQL.

## Desarrollo sin Docker

Backend (Python 3.12+), en `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate          # en Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload    # http://localhost:8000, documentación en /docs
```

Sin configuración usa SQLite (`backend/vgc_tools.db`). Para otra base de datos pon `DATABASE_URL` en `backend/.env`.

Frontend (Node 20.19+), en `web/`:

```bash
npm install
npm run dev                      # http://localhost:5173 (redirige /api al puerto 8000)
```

## Comprobaciones

| Dónde      | Comando                                        | Qué hace                        |
| ---------- | ---------------------------------------------- | ------------------------------- |
| `web/`     | `npm run check`                                | Tipos + ESLint + pruebas Vitest |
| `web/`     | `npm run format`                               | Prettier                        |
| `backend/` | `pytest`                                       | Pruebas de la API               |
| `backend/` | `ruff check . && ruff format --check .`        | Lint y formato                  |

## API

| Método   | Ruta                  | Qué hace                                         |
| -------- | --------------------- | ------------------------------------------------ |
| `POST`   | `/api/auth/register`  | Crea una cuenta y devuelve el token              |
| `POST`   | `/api/auth/login`     | Devuelve el token                                |
| `GET`    | `/api/me`             | Tu usuario y tus nombres de Showdown             |
| `PATCH`  | `/api/me`             | Cambia tus nombres de Showdown                   |
| `GET`    | `/api/teams`          | Tus equipos                                      |
| `PUT`    | `/api/teams/{id}`     | Crea o sustituye un equipo                       |
| `DELETE` | `/api/teams/{id}`     | Borra un equipo                                  |

Las rutas de `/me` y `/teams` necesitan la cabecera `Authorization: Bearer <token>`. Con el backend arrancado, la documentación interactiva está en `/docs`.

## Estructura

```
web/src/
  app/          App, cabecera y rutas
  features/     auth/ (entrar), teams/ (lista), team/ (página de equipo: components/ y sections/)
  components/   ui/ (piezas genéricas) y pokemon/ (sprites)
  api/          cliente HTTP y llamadas a la API
  lib/          lógica pura con pruebas: showdown/ (repeticiones, pokepastes, sprites) y stats/
  state/        tipos, sesión y sincronización con el servidor (useAccount), carga de repeticiones
  styles/       tokens (claro/oscuro), base, layout, componentes y vistas

backend/app/
  main.py       crea la app y registra las rutas
  core/         configuración (variables de entorno) y seguridad (contraseñas Argon2, JWT)
  db/           motor y sesión de SQLAlchemy
  models/       tablas: users y teams
  schemas/      modelos de entrada y salida (JSON en camelCase)
  api/          dependencias (usuario actual) y rutas
backend/tests/  pruebas con una base de datos en memoria
```

Cómo encaja:

- La web lee las repeticiones directamente de Showdown y guarda el resultado en el equipo; el backend solo guarda cuentas y equipos.
- Cada cambio en la web se envía al servidor poco después (`state/useAccount.ts`); la cabecera muestra «Guardado», «Guardando…» o el error.
- Si tenías equipos guardados en el navegador de la versión anterior, al entrar se ofrece subirlos a tu cuenta.

## Limitaciones

- Solo dobles de Showdown (VGC).
- Las Megas cuentan como su forma base en las estadísticas.
- Las tablas se crean al arrancar el backend; si cambias los modelos, toca añadir migraciones (por ejemplo con Alembic).
