from typing import Annotated

from pydantic import BeforeValidator, Field, StringConstraints

from app.schemas.base import CamelModel

# Los nombres de usuario no distinguen mayúsculas: se guardan en minúsculas.
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


class UserOut(CamelModel):
    id: int
    username: str
    showdown_names: list[str]


class UserUpdate(CamelModel):
    showdown_names: list[ShowdownName] = Field(max_length=10)


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
