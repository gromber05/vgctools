# VGC Tools

Herramienta web para jugadores de Pokémon VGC: construye tus equipos, calcula daños y analiza tus partidas de Pokémon Showdown en un solo sitio.

VGC Tools está pensada para el formato actual de **Pokémon Champions** (nivel 50, Stat Points y Megaevoluciones) y guarda todo en tu cuenta, de modo que puedes retomar tu trabajo desde cualquier dispositivo.

---

## Funcionalidades

### Constructor de equipos

- Edita cada Pokémon: especie, mote, objeto, habilidad, naturaleza, Stat Points y movimientos.
- Muestra las estadísticas finales a nivel 50 mientras repartes los puntos (máximo 66, y 32 por estadística).
- Comprueba la legalidad del equipo según la regulación vigente: Pokémon permitidos, movimientos que puede aprender, habilidades válidas, Megapiedras compatibles y cláusulas de especie y de objeto.
- Analiza el equipo en conjunto: debilidades y resistencias por tipo (teniendo en cuenta formas Mega y habilidades como Levitación) y cobertura ofensiva de los movimientos.
- Importa y exporta en formato Showdown, compatible con pokepast.es. Los equipos con EVs clásicos se convierten automáticamente a Stat Points.

### Calculadora de daño

- Calcula el daño entre dos Pokémon en ambas direcciones, con el rango en porcentaje y la probabilidad de debilitar (OHKO, 2HKO…).
- Tiene en cuenta naturaleza, Stat Points, objeto, habilidad, Megaevolución, cambios de estadísticas, estado alterado y PS restantes.
- Permite configurar el campo: combate doble, clima, campo, golpe crítico, Refuerzo, Reflejo, Pantalla de Luz, Velo Aurora y Compiescolta.
- Carga cualquier Pokémon de tus equipos con un clic.
- Usa el motor de cálculo oficial de Pokémon Showdown con las potencias de movimientos de Pokémon Champions.

### Análisis de partidas

Pega tus enlaces de repeticiones de Pokémon Showdown y VGC Tools extrae automáticamente los datos de cada partida: resultado, vista previa de ambos jugadores, leads, Pokémon utilizados, Megaevoluciones, hojas de equipo abiertas (OTS), ELO y series al mejor de tres.

Con esa información, cada equipo ofrece:

| Sección         | Contenido                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Resumen**     | Porcentaje de victorias, récord de sets, rendimiento con y sin OTS, evolución del ELO y últimas partidas.              |
| **Partidas**    | Historial completo con los equipos de ambos jugadores, leads destacados y notas por partida.                           |
| **Tus Pokémon** | Frecuencia de uso, porcentaje de victorias al llevarlo, al sacarlo de lead y al megaevolucionar, y uso de movimientos. |
| **Rivales**     | Tu porcentaje de victorias contra cada Pokémon rival y con qué frecuencia lo llevan tus oponentes.                     |
| **Sets**        | Series al mejor de tres agrupadas, con marcador y notas.                                                               |

Todas las estadísticas pueden filtrarse por resultado, Pokémon rival, leads y Pokémon de atrás de cada jugador, Megaevolución, OTS y ELO mínimo.

### Cuenta de usuario

- Registro con usuario y contraseña. Tus equipos, partidas y notas se guardan en el servidor automáticamente.
- Descarga de todos tus datos en un archivo, y borrado completo de la cuenta cuando quieras.
- Página de perfil con un resumen de toda tu actividad y tus Pokémon más utilizados.
- Gestión de tus nombres de Showdown (puedes tener varias cuentas), cambio de contraseña y eliminación de la cuenta.

---

## Primeros pasos

1. **Crea una cuenta** desde la pantalla de inicio.
2. En **Usuario**, añade tu nombre de Pokémon Showdown. Es necesario para identificar qué jugador eres en cada repetición.
3. En **Equipos**, crea un equipo a partir de un enlace de pokepast.es, pegando el texto del equipo o empezando desde cero en el constructor.
4. Dentro del equipo, pulsa **Añadir repeticiones** y pega los enlaces de tus partidas (uno por línea).
5. Consulta las estadísticas en las pestañas del equipo y usa los filtros para estudiar situaciones concretas.

---

## Instalación

### Con Docker (recomendado)

Requisitos: Docker con Docker Compose.

```bash
cp .env.example .env
```

Edita `.env` y define valores propios para `POSTGRES_PASSWORD` y `SECRET_KEY`. Después:

```bash
docker compose up -d --build
```

La aplicación queda disponible en **http://localhost:8180**. Se levantan tres servicios:

| Servicio | Descripción                                                 |
| -------- | ----------------------------------------------------------- |
| `web`    | Interfaz web servida por nginx; redirige `/api` al backend. |
| `api`    | API REST (FastAPI).                                         |
| `db`     | PostgreSQL. Los datos persisten en el volumen `db-data`.    |

Para detener la aplicación: `docker compose down` (los datos se conservan). Para actualizarla tras cambiar el código: `docker compose up -d --build`.

### Configuración

| Variable            | Descripción                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos.                                                              |
| `SECRET_KEY`        | Clave con la que se firman las sesiones. Obligatoria, de al menos 32 caracteres.             |
| `DB_BIND`           | Interfaz en la que se publica PostgreSQL. Por defecto `127.0.0.1` (solo el propio servidor). |
| `DB_PORT`           | Puerto publicado de PostgreSQL. Por defecto `5432`.                                          |

Para generar una clave segura: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

Al arrancar, el backend actualiza automáticamente el esquema de la base de datos (migraciones con Alembic) sin perder datos.

### Acceso remoto a la base de datos

PostgreSQL solo escucha en el propio servidor. Para administrarla desde otro equipo, abre un túnel SSH:

```bash
ssh -N -L 5432:127.0.0.1:5432 usuario@ip-del-servidor
```

Mientras el túnel esté abierto, conecta tu cliente (DBeaver, pgAdmin, `psql`…) a `localhost:5432`, base de datos `vgc_tools`, usuario `vgc_tools` y la contraseña de `POSTGRES_PASSWORD`.

No se recomienda publicar PostgreSQL directamente. Si necesitas acceso desde tu red local sin túnel, define `DB_BIND=0.0.0.0` en `.env`, no abras ese puerto en el router y usa una contraseña robusta.

### Antes de abrir la web al público

1. Sirve la web con **HTTPS** (por ejemplo con un proxy inverso como Caddy, Traefik o Cloudflare Tunnel delante del puerto 8180). Sin HTTPS, las contraseñas viajan sin cifrar.
2. Rellena los datos del titular y de contacto en `web/src/features/legal/legalInfo.ts`; aparecen en la política de privacidad y en los términos de uso.
3. Programa copias de seguridad de la base de datos y guárdalas fuera del servidor.

---

## Desarrollo

<details>
<summary>Entorno local sin Docker</summary>

Requisitos: Python 3.12 o superior y Node.js 20.19 o superior.

**Backend** (`backend/`):

```bash
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

La API se sirve en http://localhost:8000 y su documentación interactiva en http://localhost:8000/docs. Sin configuración adicional utiliza SQLite (`backend/vgc_tools.db`); para otra base de datos, define `DATABASE_URL` en `backend/.env`.

**Frontend** (`web/`):

```bash
npm install
npm run dev
```

La web se sirve en http://localhost:5173 y redirige las peticiones `/api` al backend local.

</details>

<details>
<summary>Comprobaciones de calidad</summary>

| Ubicación  | Comando                                 | Descripción                          |
| ---------- | --------------------------------------- | ------------------------------------ |
| `web/`     | `npm run check`                         | Tipos, ESLint y pruebas (Vitest).    |
| `web/`     | `npm run format`                        | Formato con Prettier.                |
| `web/`     | `npm run data`                          | Regenera los datos de la regulación. |
| `backend/` | `pytest`                                | Pruebas de la API.                   |
| `backend/` | `ruff check . && ruff format --check .` | Lint y formato.                      |

</details>

<details>
<summary>Arquitectura</summary>

```
pokemonvgc/
├── web/                 Frontend: React, TypeScript y Vite
│   ├── src/app/         Estructura de la aplicación y navegación
│   ├── src/features/    Pantallas: auth, teams, team (constructor y estadísticas), calc, user
│   ├── src/components/  Componentes reutilizables
│   ├── src/lib/         Lógica sin interfaz: reglas de Champions, cálculo de daño,
│   │                    lectura de repeticiones y estadísticas (con pruebas)
│   ├── src/state/       Sesión y sincronización con el servidor
│   └── scripts/         Generación de los datos de la regulación
├── backend/             API: FastAPI, SQLAlchemy y PostgreSQL/SQLite
│   ├── app/             Configuración, seguridad, modelos, esquemas y rutas
│   └── tests/           Pruebas de la API
└── docker-compose.yml
```

- Las repeticiones se descargan desde el navegador directamente de Pokémon Showdown; el servidor solo almacena cuentas y equipos.
- Los cambios se envían al servidor automáticamente; el indicador de la barra superior muestra el estado del guardado.
- Las contraseñas se almacenan con Argon2 y las sesiones usan tokens JWT que caducan a los 7 días y se invalidan al cambiar la contraseña.
- Los intentos de inicio de sesión están limitados por IP y por usuario, en nginx y en la API.
- nginx añade cabeceras de seguridad (Content-Security-Policy, X-Frame-Options, etc.). Las fuentes se sirven desde la propia web, sin llamadas a Google.

</details>

<details>
<summary>Referencia de la API</summary>

| Método   | Ruta                 | Descripción                                       |
| -------- | -------------------- | ------------------------------------------------- |
| `POST`   | `/api/auth/register` | Crea una cuenta y devuelve un token de sesión.    |
| `POST`   | `/api/auth/login`    | Inicia sesión y devuelve un token.                |
| `GET`    | `/api/me`            | Datos del usuario.                                |
| `PATCH`  | `/api/me`            | Actualiza los nombres de Showdown.                |
| `POST`   | `/api/me/password`   | Cambia la contraseña y cierra las demás sesiones. |
| `GET`    | `/api/me/export`     | Descarga todos los datos de la cuenta.            |
| `DELETE` | `/api/me`            | Elimina la cuenta y todos sus equipos.            |
| `GET`    | `/api/teams`         | Lista los equipos del usuario.                    |
| `PUT`    | `/api/teams/{id}`    | Crea o actualiza un equipo.                       |
| `DELETE` | `/api/teams/{id}`    | Elimina un equipo.                                |

Las rutas de `/api/me` y `/api/teams` requieren la cabecera `Authorization: Bearer <token>`.

</details>

---

## Limitaciones conocidas

- El análisis de repeticiones solo admite combates dobles (VGC) de Pokémon Showdown.
- En las estadísticas de partidas, las formas Mega se agrupan con su forma base.
- Los datos de la regulación (Pokémon legales, movimientos y objetos) se actualizan regenerándolos con `npm run data` cuando cambia la regulación.

## Créditos

- Datos de Pokémon, sprites y repeticiones: [Pokémon Showdown](https://pokemonshowdown.com/).
- Cálculo de daño: [@smogon/calc](https://github.com/smogon/damage-calc).
- El análisis de partidas se inspira en la hoja PASRS (PALKIA Academy Showdown Reporting Spreadsheet), de Bauerdad y v0Lt.

VGC Tools es un proyecto no oficial y no está afiliado a Nintendo, Creatures, GAME FREAK ni The Pokémon Company. Pokémon y los nombres asociados son marcas registradas de sus respectivos propietarios.
