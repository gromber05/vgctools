from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

ALGORITHM = "HS256"
_password_hash = PasswordHash.recommended()

_DUMMY_HASH = _password_hash.hash("contraseña-de-relleno-para-igualar-tiempos")


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if hashed is None:
        _password_hash.verify(password, _DUMMY_HASH)
        return False
    return _password_hash.verify(password, hashed)


@dataclass(frozen=True)
class TokenData:
    user_id: int
    version: int


def create_access_token(user_id: int, version: int) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "ver": version,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenData | None:
    try:
        payload = jwt.decode(
            token, get_settings().secret_key, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]}
        )
        return TokenData(user_id=int(payload["sub"]), version=int(payload.get("ver", 0)))
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None
