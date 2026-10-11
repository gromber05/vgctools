from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import CamelModel


class TeamIn(CamelModel):
    """Equipo tal y como lo maneja la web. `mons` y `entries` se guardan sin tocar."""

    name: str = Field(min_length=1, max_length=120)
    paste_url: str = Field(default="", max_length=300)
    paste_text: str = Field(default="", max_length=20_000)
    mons: list[dict[str, Any]] = Field(default_factory=list, max_length=12)
    entries: list[dict[str, Any]] = Field(default_factory=list, max_length=5_000)
    set_notes: dict[str, str] = Field(default_factory=dict)


class TeamOut(TeamIn):
    id: str
    created_at: datetime
    updated_at: datetime
