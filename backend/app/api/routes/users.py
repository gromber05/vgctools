from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserOut)
def read_me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("", response_model=UserOut)
def update_me(body: UserUpdate, user: CurrentUser, db: DbSession) -> UserOut:
    user.showdown_names = body.showdown_names
    db.commit()
    return UserOut.model_validate(user)
