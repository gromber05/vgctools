import { Empty, Sprites } from '../components/ui';
import type { Game } from '../lib/replay';
import { groupSets } from '../lib/stats';
import type { AppState, Updater } from '../lib/storage';

export function Sets({ games, state, update }: { games: Game[]; state: AppState; update: Updater }) {
  if (!games.length) return <Empty>Aún no hay partidas leídas. Añade repeticiones en la pestaña Replays.</Empty>;
  const sets = groupSets(games);
  const won = sets.filter((s) => s.result === 'W').length;
  return (
    <div className="sheet-grid">
      <p className="hint">Las partidas al mejor de 3 se agrupan en un set. Récord de sets: <b>{won}–{sets.length - won}</b></p>
      <div className="table-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th className="rownum">Set</th>
              <th></th>
              <th></th>
              <th>Rival</th>
              <th>Equipo rival</th>
              <th>Marcador</th>
              <th>Partidas</th>
              <th>Notas del set</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s, i) => (
              <tr key={s.key}>
                <td className="rownum">{i + 1}</td>
                <td className={`result r-${s.result}`}>{s.result === 'T' ? 'E' : s.result}</td>
                <td className="muted">vs</td>
                <td>{s.opp}</td>
                <td className="team-opp"><Sprites names={s.games[0].oppTeam} size={32} /></td>
                <td className="num center">{s.wins}–{s.losses}</td>
                <td className="links">
                  {s.games.map((g, k) => (
                    <a key={g.id} className={`glink r-${g.result}`} href={`https://replay.pokemonshowdown.com/${g.id}`} target="_blank" rel="noreferrer">G{g.gameNo ?? k + 1}</a>
                  ))}
                </td>
                <td className="input-cell">
                  <input
                    value={state.setNotes[s.key] ?? ''}
                    aria-label={`Notas del set ${i + 1}`}
                    onChange={(e) => { const v = e.target.value; update((d) => { d.setNotes[s.key] = v; }); }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
