from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.config import LEGAL_VERSION
from app.core.rate_limit import auth_limiter, client_ip
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.user import Credentials, Registration, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def token_for(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id, user.token_version), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(body: Registration, db: DbSession, request: Request) -> TokenOut:
    auth_limiter.hit(f"register:{client_ip(request)}")
    if db.scalar(select(User).where(User.username == body.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese nombre de usuario ya está cogido.")
    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        showdown_names=[],
        terms_accepted_at=datetime.now(UTC),
        terms_version=LEGAL_VERSION,
    )
    db.add(user)
    db.commit()
    return token_for(user)


@router.post("/login", response_model=TokenOut)
def login(body: Credentials, db: DbSession, request: Request) -> TokenOut:
    auth_limiter.hit(f"login-ip:{client_ip(request)}")
    auth_limiter.hit(f"login-user:{body.username}")
    user = db.scalar(select(User).where(User.username == body.username))
    if not verify_password(body.password, user.password_hash if user else None) or user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos.")
    return token_for(user)
