from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, inspect

MIGRATIONS_DIR = Path(__file__).parent / "migrations"
BASELINE = "0001"


def run_migrations(engine: Engine) -> None:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        tables = set(inspect(connection).get_table_names())
        if "users" in tables and "alembic_version" not in tables:
            command.stamp(config, BASELINE)
        command.upgrade(config, "head")
