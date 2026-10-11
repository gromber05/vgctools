import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import create_access_token, decode_access_token


def test_produccion_exige_clave_propia():
    with pytest.raises(ValidationError):
        Settings(environment="production")
    with pytest.raises(ValidationError):
        Settings(environment="production", secret_key="corta")
    assert Settings(environment="production", secret_key="x" * 40).is_production


def test_token_con_version():
    data = decode_access_token(create_access_token(7, 3))
    assert data is not None and data.user_id == 7 and data.version == 3
    assert decode_access_token("no-es-un-token") is None
