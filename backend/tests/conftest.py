from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registra los modelos)
from app.db.session import Base, get_db
from app.main import create_app


@pytest.fixture
def client() -> Iterator[TestClient]:
    # Base de datos en memoria y nueva para cada prueba.
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db() -> Iterator[Session]:
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    # Sin "with": no se ejecuta el lifespan, que crearía las tablas en la base de datos real.
    yield TestClient(app)
    engine.dispose()


def register(client: TestClient, username: str = "room3roo", password: str = "contraseña-segura") -> dict[str, str]:
    """Crea una cuenta y devuelve las cabeceras de autorización."""
    res = client.post("/api/auth/register", json={"username": username, "password": password})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}
