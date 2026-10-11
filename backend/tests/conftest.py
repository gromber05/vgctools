from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.core.rate_limit import auth_limiter
from app.db.session import Base, get_db
from app.main import create_app

assert models


@pytest.fixture
def client() -> Iterator[TestClient]:
    auth_limiter.reset()
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
    yield TestClient(app)
    engine.dispose()


def register(client: TestClient, username: str = "room3roo", password: str = "contraseña-segura") -> dict[str, str]:
    res = client.post("/api/auth/register", json={"username": username, "password": password, "acceptTerms": True})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}
