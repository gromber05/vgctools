from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.api.deps import CurrentUser, DbSession
from app.api.routes.auth import token_for
from app.core.rate_limit import auth_limiter
from app.core.security import hash_password, verify_password
from app.schemas.team import TeamOut
from app.schemas.user import AccountDeletion, PasswordChange, TokenOut, UserOut, UserUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserOut)
def read_me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("", response_model=UserOut)
def update_me(body: UserUpdate, user: CurrentUser, db: DbSession) -> UserOut:
    user.showdown_names = body.showdown_names
    db.commit()
    return UserOut.model_validate(user)


@router.post("/password", response_model=TokenOut)
def change_password(body: PasswordChange, user: CurrentUser, db: DbSession) -> TokenOut:
    auth_limiter.hit(f"password:{user.id}")
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta.")
    user.password_hash = hash_password(body.new_password)
    user.token_version += 1
    db.commit()
    return token_for(user)


@router.get("/export")
def export_data(user: CurrentUser, response: Response) -> dict[str, Any]:
    response.headers["Content-Disposition"] = f'attachment; filename="vgc-tools-{user.username}.json"'
    return {
        "exportedAt": datetime.now(UTC).isoformat(),
        "user": {
            "username": user.username,
            "showdownNames": user.showdown_names,
            "createdAt": user.created_at.isoformat(),
            "termsAcceptedAt": user.terms_accepted_at.isoformat() if user.terms_accepted_at else None,
            "termsVersion": user.terms_version,
        },
        "teams": [TeamOut.model_validate(t).model_dump(mode="json", by_alias=True) for t in user.teams],
    }


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(body: AccountDeletion, user: CurrentUser, db: DbSession) -> None:
    auth_limiter.hit(f"delete:{user.id}")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña no es correcta.")
    db.delete(user)
    db.commit()
