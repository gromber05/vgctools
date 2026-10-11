from alembic import context

from app import models
from app.db.session import Base, engine

target_metadata = Base.metadata
assert models

connection = context.config.attributes.get("connection")


def run() -> None:
    context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()


if connection is None:
    with engine.begin() as connection:
        run()
else:
    run()
