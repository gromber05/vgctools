import { WinMeter } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import type { PasteMon } from '@/lib/showdown/paste';
import type { Game } from '@/lib/showdown/replay';
import { moveUsage, usageByMon } from '@/lib/stats/aggregates';
import type { Filters } from '@/lib/stats/filters';
import type { Team } from '@/state/types';
import { pct } from '@/lib/utils';

export function MonsSection({ team, games, filterBy }: { team: Team; games: Game[]; filterBy: (f: Partial<Filters>) => void }) {
  const usage = usageByMon(
    games,
    team.mons.map((m) => m.species),
  );
  const moves = moveUsage(games);

  return (
    <div className="mon-grid">
      {usage.map((u) => {
        const set: PasteMon | undefined = team.mons.find((m) => m.species === u.species);
        const counts: Record<string, number> = { ...Object.fromEntries((set?.moves ?? []).map((m) => [m, 0])), ...moves[u.species] };
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return (
          <article key={u.species} className="card mon-card">
            <div className="mon-top">
              <Sprite name={u.species} size={112} big />
              <div className="mon-id">
                <h3>{set?.nickname || u.species}</h3>
                {set?.nickname && <div className="muted small">{u.species}</div>}
                {set && (
                  <dl className="set-info">
                    {set.item && (
                      <>
                        <dt>Objeto</dt>
                        <dd>{set.item}</dd>
                      </>
                    )}
                    {set.ability && (
                      <>
                        <dt>Habilidad</dt>
                        <dd>{set.ability}</dd>
                      </>
                    )}
                    {set.nature && (
                      <>
                        <dt>Naturaleza</dt>
                        <dd>{set.nature}</dd>
                      </>
                    )}
                    {set.evs && (
                      <>
                        <dt>Puntos</dt>
                        <dd className="mono small">{set.evs}</dd>
                      </>
                    )}
                  </dl>
                )}
                {!set && <p className="muted small">No está en tu pokepaste.</p>}
              </div>
            </div>

            <div className="mon-stats">
              <div className="mon-stat-line">
                <span>Lo llevaste</span>
                <b>
                  {u.brought.games} de {games.length}
                </b>
                <span className="muted">{pct(u.brought.games, games.length)}</span>
              </div>
              <WinMeter label="Llevado" wins={u.brought.wins} games={u.brought.games} />
              <WinMeter label="De lead" wins={u.lead.wins} games={u.lead.games} />
              {u.mega.games > 0 && <WinMeter label="Con Mega" wins={u.mega.wins} games={u.mega.games} />}
            </div>

            <div className="moves">
              <div className="moves-head">
                <span>Movimientos</span>
                <span className="muted small">{total} usos</span>
              </div>
              {rows.length ? (
                rows.map(([m, c]) => (
                  <div key={m} className="move-row">
                    <span className="move-name">{m}</span>
                    <span className="move-bar">
                      <span style={{ width: total ? `${(c / total) * 100}%` : 0 }} />
                    </span>
                    <span className="move-n">{c}</span>
                  </div>
                ))
              ) : (
                <p className="muted small">Sin movimientos registrados.</p>
              )}
            </div>

            {u.lead.games > 0 && (
              <button className="link-btn" onClick={() => filterBy({ myLead: u.species })}>
                Ver partidas en las que salió de lead
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
