import { useState } from 'react';
import { Empty, WinMeter } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import type { Game } from '@/lib/showdown/replay';
import { opponentMons, type OppMon } from '@/lib/stats/aggregates';
import type { Filters } from '@/lib/stats/filters';
import { pct } from '@/lib/utils';

const SORTS: Record<string, [string, (a: OppMon, b: OppMon) => number]> = {
  seen: ['Más vistos', (a, b) => b.seen.games - a.seen.games],
  worst: ['Peor matchup', (a, b) => a.seen.wins / a.seen.games - b.seen.wins / b.seen.games || b.seen.games - a.seen.games],
  best: ['Mejor matchup', (a, b) => b.seen.wins / b.seen.games - a.seen.wins / a.seen.games || b.seen.games - a.seen.games],
  brought: ['Más los llevan', (a, b) => b.brought.games / b.seen.games - a.brought.games / a.seen.games || b.seen.games - a.seen.games],
  benched: ['Menos los llevan', (a, b) => a.brought.games / a.seen.games - b.brought.games / b.seen.games || b.seen.games - a.seen.games],
};

export function RivalsSection({ games, filterBy }: { games: Game[]; filterBy: (f: Partial<Filters>) => void }) {
  const [sort, setSort] = useState('seen');
  const [min, setMin] = useState(1);
  if (!games.length) return <Empty title="No hay partidas con estos filtros" />;

  const mons = opponentMons(games)
    .filter((m) => m.seen.games >= min)
    .sort((a, b) => SORTS[sort][1](a, b) || a.species.localeCompare(b.species));

  return (
    <div className="rivals">
      <div className="toolbar">
        <div className="seg" role="tablist">
          {Object.entries(SORTS).map(([k, [label]]) => (
            <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)}>
              {label}
            </button>
          ))}
        </div>
        <label className="small">
          Vistos al menos{' '}
          <select id="min-seen" value={min} onChange={(e) => setMin(+e.target.value)}>
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>{' '}
          veces
        </label>
      </div>
      {!mons.length && <Empty title={`Ningún rival aparece ${min} veces o más`}>Baja el mínimo o añade más repeticiones.</Empty>}
      <div className="rival-grid">
        {mons.map((m) => (
          <button
            key={m.species}
            className="rival"
            onClick={() => filterBy({ oppMon: m.species })}
            title={`Ver partidas contra ${m.species}`}
          >
            <Sprite name={m.species} size={72} big />
            <div className="rival-name">{m.species}</div>
            <div className="muted small">
              visto en {m.seen.games} {m.seen.games === 1 ? 'partida' : 'partidas'}
            </div>
            <WinMeter label="Tu win%" wins={m.seen.wins} games={m.seen.games} />
            <div className="rival-facts">
              <span>
                Lo llevan <b>{pct(m.brought.games, m.seen.games)}</b>
              </span>
              <span>
                De lead <b>{pct(m.lead.games, m.seen.games)}</b>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
