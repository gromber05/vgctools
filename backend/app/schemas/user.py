from datetime import datetime
from typing import Annotated

from pydantic import BeforeValidator, Field, StringConstraints, field_validator

from app.schemas.base import CamelModel

Username = Annotated[
    str,
    BeforeValidator(lambda v: v.strip().lower() if isinstance(v, str) else v),
    StringConstraints(pattern=r"^[a-z0-9_.-]{3,32}$"),
]
Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]
ShowdownName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class Credentials(CamelModel):
    username: Username
    password: Password


class Registration(Credentials):
    accept_terms: bool

    @field_validator("accept_terms")
    @classmethod
    def _must_accept(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Tienes que aceptar los términos de uso y la política de privacidad.")
        return v


class UserOut(CamelModel):
    id: int
    username: str
    showdown_names: list[str]
    created_at: datetime


class UserUpdate(CamelModel):
    showdown_names: list[ShowdownName] = Field(max_length=10)


class PasswordChange(CamelModel):
    current_password: str
    new_password: Password


class AccountDeletion(CamelModel):
    password: str


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
