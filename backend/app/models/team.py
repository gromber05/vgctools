from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User


def _now() -> datetime:
    return datetime.now(UTC)


class Team(Base):
    """Un equipo con su pokepaste y sus repeticiones.

    Los Pokémon, las repeticiones y las notas de sets se guardan como JSON: la web los
    lee y escribe siempre juntos, y su forma la define el frontend (`web/src/state/types.ts`).
    """

    __tablename__ = "teams"

    # El id lo genera la web, así un equipo creado sin conexión mantiene su id.
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    paste_url: Mapped[str] = mapped_column(String(300), default="")
    paste_text: Mapped[str] = mapped_column(Text, default="")
    mons: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    entries: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    set_notes: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    owner: Mapped["User"] = relationship(back_populates="teams")
