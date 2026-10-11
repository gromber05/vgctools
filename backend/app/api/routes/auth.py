from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.user import Credentials, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_for(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(body: Credentials, db: DbSession) -> TokenOut:
    if db.scalar(select(User).where(User.username == body.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese nombre de usuario ya está cogido.")
    user = User(username=body.username, password_hash=hash_password(body.password), showdown_names=[])
    db.add(user)
    db.commit()
    return _token_for(user)


@router.post("/login", response_model=TokenOut)
def login(body: Credentials, db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.username == body.username))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos.")
    return _token_for(user)
