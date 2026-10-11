from sqlalchemy import create_engine, inspect, text

from app.db.migrate import run_migrations


def test_base_de_datos_nueva(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'nueva.db'}")
    run_migrations(engine)
    columns = {c["name"] for c in inspect(engine).get_columns("users")}
    assert {"token_version", "terms_accepted_at", "terms_version"} <= columns
    run_migrations(engine)


def test_base_de_datos_antigua_conserva_los_datos(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'antigua.db'}")
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE users (id INTEGER PRIMARY KEY, username VARCHAR(32) NOT NULL, "
                "password_hash VARCHAR(255) NOT NULL, showdown_names JSON NOT NULL, created_at DATETIME NOT NULL)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE teams (id VARCHAR(36) PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), "
                "name VARCHAR(120) NOT NULL, paste_url VARCHAR(300) NOT NULL, paste_text TEXT NOT NULL, "
                "mons JSON NOT NULL, entries JSON NOT NULL, set_notes JSON NOT NULL, "
                "created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)"
            )
        )
        conn.execute(text("INSERT INTO users VALUES (1, 'ash', 'hash', '[]', '2026-01-01')"))

    run_migrations(engine)

    with engine.connect() as conn:
        row = conn.execute(text("SELECT username, token_version FROM users")).one()
    assert tuple(row) == ("ash", 0)
