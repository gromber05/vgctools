import { Block, Empty, Sprite } from '../components/ui';
import type { PasteMon } from '../lib/paste';
import type { Game } from '../lib/replay';
import { moveUsage } from '../lib/stats';
import { pct } from '../lib/util';

export function Moves({ games, team, filterNote }: { games: Game[]; team: PasteMon[]; filterNote: string }) {
  if (!games.length) return <Empty>No hay partidas con los filtros actuales.</Empty>;
  const usage = moveUsage(games);
  const species = [...new Set([...team.map((m) => m.species), ...Object.keys(usage)])];

  return (
    <div className="sheet-grid">
      <p className="hint">Veces que usaste cada movimiento. Los movimientos de tu pokepaste aparecen aunque no los hayas usado. {filterNote}</p>
      <div className="moves-grid">
        {species.map((s) => {
          const counts = { ...Object.fromEntries((team.find((m) => m.species === s)?.moves ?? []).map((m) => [m, 0])), ...usage[s] };
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          return (
            <Block key={s} tone="blue" title={<span className="mon-title"><Sprite name={s} size={40} />{s}</span>}>
              <table className="grid banded-blue">
                <tbody>
                  {rows.map(([move, n]) => (
                    <tr key={move}>
                      <td>{move}</td>
                      <td className="num">{n}</td>
                      <td className="bar-cell"><span className="bar" style={{ width: total ? `${(n / total) * 100}%` : 0 }} /></td>
                      <td className="num muted">{pct(n, total)}</td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td className="muted">Sin datos.</td></tr>}
                </tbody>
              </table>
            </Block>
          );
        })}
      </div>
    </div>
  );
}
