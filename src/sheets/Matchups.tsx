import { useState } from 'react';
import { Block, Empty, RateCells, Sprite } from '../components/ui';
import type { Game } from '../lib/replay';
import { opponentMons, type OppMon } from '../lib/stats';
import { pct } from '../lib/util';

const winRate = (m: OppMon) => m.seen.wins / m.seen.games;
const attendance = (m: OppMon) => m.brought.games / m.seen.games;

export function Matchups({ games, filterNote }: { games: Game[]; filterNote: string }) {
  const [minGames, setMinGames] = useState(2);
  const [picked, setPicked] = useState<string[]>([]);
  if (!games.length) return <Empty>No hay partidas con los filtros actuales.</Empty>;

  const all = opponentMons(games).sort((a, b) => b.seen.games - a.seen.games || a.species.localeCompare(b.species));
  const enough = all.filter((m) => m.seen.games >= minGames);
  const top = (fn: (m: OppMon) => number, dir: 1 | -1) => [...enough].sort((a, b) => dir * (fn(b) - fn(a)) || b.seen.games - a.seen.games).slice(0, 5);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : p.length < 8 ? [...p, s] : p));
  const detail = picked.map((s) => all.find((m) => m.species === s)).filter((m): m is OppMon => !!m);

  return (
    <div className="sheet-grid">
      <p className="hint">
        Pokémon rivales vistos en la vista previa. Solo cuentan los vistos al menos{' '}
        <select id="min-games" value={minGames} onChange={(e) => setMinGames(+e.target.value)}>
          {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>{' '}
        veces. {filterNote}
      </p>
      {!enough.length && <Empty>Ningún Pokémon rival aparece {minGames} veces o más todavía. Baja el mínimo o añade más repeticiones.</Empty>}
      {!!enough.length && (
        <div className="four-col">
          <Block title="Mejores matchups" tone="green"><MonList rows={top(winRate, 1)} value={(m) => pct(m.seen.wins, m.seen.games)} sub={(m) => `${m.seen.games} partidas`} /></Block>
          <Block title="Peores matchups" tone="red"><MonList rows={top(winRate, -1)} value={(m) => pct(m.seen.wins, m.seen.games)} sub={(m) => `${m.seen.games} partidas`} /></Block>
          <Block title="Más los llevan" tone="blue"><MonList rows={top(attendance, 1)} value={(m) => pct(m.brought.games, m.seen.games)} sub={(m) => `${m.brought.games} de ${m.seen.games}`} /></Block>
          <Block title="Menos los llevan" tone="orange"><MonList rows={top(attendance, -1)} value={(m) => pct(m.brought.games, m.seen.games)} sub={(m) => `${m.brought.games} de ${m.seen.games}`} /></Block>
        </div>
      )}

      <Block title={`Matchups concretos (elige hasta 8: ${picked.length}/8)`} tone="gold">
        <div className="picker">
          {all.map((m) => (
            <button key={m.species} className={picked.includes(m.species) ? 'pick on' : 'pick'} onClick={() => toggle(m.species)} title={`${m.species} · ${m.seen.games} partidas`}>
              <Sprite name={m.species} size={32} />
            </button>
          ))}
        </div>
        {detail.length ? (
          <table className="grid">
            <thead>
              <tr><th></th><th>Pokémon</th><th colSpan={2}>Tu win% si está en su equipo</th><th colSpan={2}>Tu win% si lo llevan</th><th colSpan={2}>Tu win% si sale de lead</th><th>Lo llevan</th></tr>
            </thead>
            <tbody>
              {detail.map((m) => (
                <tr key={m.species}>
                  <td className="sprite-col"><Sprite name={m.species} size={36} /></td>
                  <td>{m.species}</td>
                  <RateCells {...m.seen} />
                  <RateCells {...m.brought} />
                  <RateCells {...m.lead} />
                  <td className="num">{pct(m.brought.games, m.seen.games)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Pulsa en los Pokémon de arriba para ver sus datos.</p>
        )}
      </Block>
    </div>
  );
}

function MonList({ rows, value, sub }: { rows: OppMon[]; value: (m: OppMon) => string; sub: (m: OppMon) => string }) {
  return (
    <table className="grid">
      <tbody>
        {rows.map((m) => (
          <tr key={m.species}>
            <td className="sprite-col"><Sprite name={m.species} size={36} /></td>
            <td>{m.species}<div className="sub">{sub(m)}</div></td>
            <td className="num strong">{value(m)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
