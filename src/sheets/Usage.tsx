import { Block, Empty, RateCells, Sprite, Sprites } from '../components/ui';
import type { Game } from '../lib/replay';
import { leadPairs, totals, usageByMon } from '../lib/stats';
import { pct } from '../lib/util';

export function Usage({ games, team, filterNote }: { games: Game[]; team: string[]; filterNote: string }) {
  if (!games.length) return <Empty>No hay partidas con los filtros actuales.</Empty>;
  const t = totals(games);
  const mons = usageByMon(games, team);
  const pairs = leadPairs(games);
  const common = [...pairs].sort((a, b) => b.games - a.games || b.wins / b.games - a.wins / a.games).slice(0, 8);
  const best = [...pairs].sort((a, b) => b.wins / b.games - a.wins / a.games || b.games - a.games).slice(0, 8);

  return (
    <div className="sheet-grid">
      <p className="hint">Estadísticas según los filtros de «Partida a partida». {filterNote}</p>

      <Block title="Win% total" tone="green" className="totals">
        <table className="kv inline">
          <tbody>
            <tr>
              <th>Win%</th><td className="num strong">{pct(t.all.wins, t.all.games)}</td>
              <th>OTS Win%</th><td className="num">{pct(t.ots.wins, t.ots.games)}</td>
              <th>CTS Win%</th><td className="num">{pct(t.cts.wins, t.cts.games)}</td>
              <th>Partidas</th><td className="num">{t.all.games}</td>
            </tr>
          </tbody>
        </table>
      </Block>

      <div className="two-col">
        <Block title="Win% por Pokémon" tone="blue">
          <table className="grid banded-blue">
            <thead>
              <tr><th></th><th colSpan={2}>Win% (llevado)</th><th colSpan={2}>Lead Win%</th><th colSpan={2}>Mega Win%</th></tr>
            </thead>
            <tbody>
              {mons.map((m) => (
                <tr key={m.species}>
                  <td className="sprite-col"><Sprite name={m.species} size={36} /></td>
                  <RateCells {...m.brought} />
                  <RateCells {...m.lead} />
                  <RateCells {...m.mega} />
                </tr>
              ))}
            </tbody>
          </table>
        </Block>

        <div className="stack">
          <Block title="Leads más comunes" tone="orange">
            <PairTable rows={common} />
          </Block>
          <Block title="Mejores leads" tone="orange">
            <PairTable rows={best} />
          </Block>
        </div>
      </div>
    </div>
  );
}

function PairTable({ rows }: { rows: { pair: string[]; games: number; wins: number }[] }) {
  if (!rows.length) return <p className="muted">Sin datos.</p>;
  return (
    <table className="grid banded-orange">
      <tbody>
        {rows.map((r) => (
          <tr key={r.pair.join('|')}>
            <td><Sprites names={r.pair} size={36} /></td>
            <td className="num">{r.wins} de {r.games} partidas</td>
            <td className="num strong">{pct(r.wins, r.games)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
