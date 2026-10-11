import { useState } from 'react';
import { Sprite } from '@/components/pokemon/Sprite';
import type { Game } from '@/lib/showdown/replay';
import { pct } from '@/lib/utils';
import type { Team } from '@/state/types';

interface TeamHeroProps {
  team: Team;
  games: Game[];
  adding: boolean;
  onToggleAdd: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onOpenMons: () => void;
}

/** Cabecera del equipo: nombre editable, récord, acciones y los 6 Pokémon en grande. */
export function TeamHero({ team, games, adding, onToggleAdd, onRename, onDelete, onOpenMons }: TeamHeroProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wins = games.filter((g) => g.result === 'W').length;

  return (
    <header className="team-hero">
      <div className="hero-main">
        <input className="team-title" aria-label="Nombre del equipo" value={team.name} onChange={(e) => onRename(e.target.value)} />
        <div className="hero-record">
          {games.length ? (
            <>
              <span className="record big">
                <b className="w">{wins}</b>
                <span>–</span>
                <b className="l">{games.length - wins}</b>
              </span>
              <span className="hero-pct">{pct(wins, games.length)}</span>
              <span className="muted">en {games.length} partidas</span>
            </>
          ) : (
            <span className="muted">Sin partidas todavía</span>
          )}
        </div>
        <div className="hero-actions">
          <button className="primary" onClick={onToggleAdd}>
            {adding ? 'Cerrar' : 'Añadir repeticiones'}
          </button>
          {team.pasteUrl && (
            <a className="btn ghost" href={team.pasteUrl} target="_blank" rel="noreferrer">
              Ver pokepaste
            </a>
          )}
          {confirmDelete ? (
            <span className="confirm">
              ¿Borrar el equipo y sus partidas?
              <button className="danger" onClick={onDelete}>
                Borrar
              </button>
              <button className="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button className="ghost" onClick={() => setConfirmDelete(true)}>
              Borrar equipo
            </button>
          )}
        </div>
      </div>
      <div className="hero-team">
        {team.mons.map((m, i) => (
          <button key={`${m.species}-${i}`} className="hero-mon" onClick={onOpenMons} title={m.species}>
            <Sprite name={m.species} size={88} big />
            <span>{m.nickname || m.species}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
