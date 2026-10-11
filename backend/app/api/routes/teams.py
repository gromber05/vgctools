from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Response, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Team
from app.schemas.team import TeamIn, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])

TeamId = Annotated[str, Path(min_length=1, max_length=36, pattern=r"^[A-Za-z0-9_-]+$")]


def _own_team(db: DbSession, user: CurrentUser, team_id: str) -> Team | None:
    """El equipo si es del usuario. Los de otros usuarios se tratan como inexistentes."""
    team = db.get(Team, team_id)
    return team if team is not None and team.owner_id == user.id else None


@router.get("", response_model=list[TeamOut])
def list_teams(user: CurrentUser, db: DbSession) -> list[Team]:
    return list(db.scalars(select(Team).where(Team.owner_id == user.id).order_by(Team.created_at.desc())))


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: TeamId, user: CurrentUser, db: DbSession) -> Team:
    team = _own_team(db, user, team_id)
    if team is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipo no encontrado.")
    return team


@router.put("/{team_id}", response_model=TeamOut)
def save_team(team_id: TeamId, body: TeamIn, user: CurrentUser, db: DbSession, response: Response) -> Team:
    """Crea el equipo con ese id o lo sustituye entero (la web guarda así sus cambios)."""
    team = _own_team(db, user, team_id)
    if team is None:
        if db.get(Team, team_id) is not None:
            # El id existe pero es de otra cuenta.
            raise HTTPException(status.HTTP_409_CONFLICT, "Ese id de equipo ya está en uso.")
        team = Team(id=team_id, owner_id=user.id)
        db.add(team)
        response.status_code = status.HTTP_201_CREATED
    for field, value in body.model_dump().items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: TeamId, user: CurrentUser, db: DbSession) -> None:
    team = _own_team(db, user, team_id)
    if team is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipo no encontrado.")
    db.delete(team)
    db.commit()
