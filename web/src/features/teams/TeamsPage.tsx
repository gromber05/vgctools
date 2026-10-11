import { useState } from 'react';
import type { Route } from '@/app/router';
import { Empty } from '@/components/ui';
import type { AppState, Team, Updater } from '@/state/types';
import { NewTeamForm } from './NewTeamForm';
import { TeamCard } from './TeamCard';

interface TeamsPageProps {
  state: AppState;
  update: Updater;
  go: (route: Route) => void;
  /** equipos guardados en este navegador antes de tener cuenta */
  localTeams: Team[];
  onImportLocal: () => void;
  onDismissLocal: () => void;
}

export function TeamsPage({ state, update, go, localTeams, onImportLocal, onDismissLocal }: TeamsPageProps) {
  const [creating, setCreating] = useState(state.teams.length === 0 && localTeams.length === 0);
  const open = (teamId: string) => go({ page: 'team', teamId, section: 'resumen' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tus equipos</h1>
          <p className="lede">Cada equipo guarda sus repeticiones y sus estadísticas por separado.</p>
        </div>
        {!creating && (
          <button className="primary" onClick={() => setCreating(true)}>
            Nuevo equipo
          </button>
        )}
      </div>

      {localTeams.length > 0 && (
        <div className="card import-banner">
          <div>
            <b>
              Tienes {localTeams.length} {localTeams.length === 1 ? 'equipo guardado' : 'equipos guardados'} en este navegador
            </b>
            <p className="muted small">Son de antes de tener cuenta. Súbelos para tenerlos en cualquier dispositivo.</p>
          </div>
          <div className="actions">
            <button className="primary" onClick={onImportLocal}>
              Subir a mi cuenta
            </button>
            <button className="ghost" onClick={onDismissLocal}>
              Ahora no
            </button>
          </div>
        </div>
      )}

      {creating && (
        <NewTeamForm
          onCancel={state.teams.length ? () => setCreating(false) : undefined}
          onCreate={(team) => {
            update((d) => {
              d.teams.unshift(team);
            });
            setCreating(false);
            open(team.id);
          }}
        />
      )}

      {state.teams.length > 0 ? (
        <div className="team-grid">
          {state.teams.map((t) => (
            <TeamCard key={t.id} team={t} onOpen={() => open(t.id)} />
          ))}
        </div>
      ) : (
        !creating && <Empty title="Aún no tienes equipos">Crea uno a partir de tu pokepaste.</Empty>
      )}
    </div>
  );
}
