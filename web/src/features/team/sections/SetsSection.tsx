import { Empty, ResultBadge } from '@/components/ui';
import { SpriteRow } from '@/components/pokemon/SpriteRow';
import type { Game } from '@/lib/showdown/replay';
import { groupSets } from '@/lib/stats/aggregates';
import type { Team, TeamUpdater } from '@/state/types';

export function SetsSection({ team, games, updateTeam }: { team: Team; games: Game[]; updateTeam: TeamUpdater }) {
  if (!games.length) return <Empty title="Todavía no hay partidas" />;
  const sets = groupSets(games).reverse();
  const won = sets.filter((s) => s.result === 'W').length;

  return (
    <div className="sets">
      <p className="muted small">
        Las partidas al mejor de 3 se agrupan en un set. Récord de sets:{' '}
        <b>
          {won}–{sets.length - won}
        </b>
        .
      </p>
      <ol className="set-list">
        {sets.map((s) => (
          <li key={s.key} className={`card set res-${s.result}`}>
            <div className="set-head">
              <ResultBadge result={s.result} />
              <span className="set-score">
                {s.wins}–{s.losses}
              </span>
              <span>
                vs <b>{s.opp}</b>
              </span>
              <span className="grow" />
              <span className="set-games">
                {s.games.map((g, k) => (
                  <a
                    key={g.id}
                    className={`gpill res-${g.result}`}
                    href={`https://replay.pokemonshowdown.com/${g.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={g.result === 'W' ? 'Victoria' : 'Derrota'}
                  >
                    G{g.gameNo ?? k + 1}
                  </a>
                ))}
              </span>
            </div>
            <SpriteRow names={s.games[0].oppTeam} size={44} />
            <input
              className="note"
              aria-label={`Notas del set contra ${s.opp}`}
              placeholder="Notas del set"
              value={team.setNotes[s.key] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                updateTeam((t) => {
                  t.setNotes[s.key] = v;
                });
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
