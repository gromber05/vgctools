import { useState } from 'react';
import type { Game } from '@/lib/showdown/replay';

/** Evolución de tu ELO partida a partida (solo partidas con rating). */
export function EloChart({ games }: { games: Game[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = games
    .map((g, i) => ({ i: i + 1, elo: g.myEloAfter ?? g.myElo, g }))
    .filter((p): p is { i: number; elo: number; g: Game } => p.elo != null);
  if (pts.length < 2) return <p className="muted small">El gráfico de ELO aparece cuando tengas al menos 2 partidas puntuadas.</p>;

  const W = 560,
    H = 160,
    L = 40,
    R = 48,
    T = 12,
    B = 22;
  const lo = Math.min(...pts.map((p) => p.elo)),
    hi = Math.max(...pts.map((p) => p.elo));
  const pad = Math.max(10, (hi - lo) * 0.1);
  const y0 = lo - pad,
    y1 = hi + pad;
  const x = (k: number) => L + (k / (pts.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(p.elo).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const ticks = [lo, Math.round((lo + hi) / 2), hi].filter((v, i, a) => a.indexOf(v) === i);
  const h = hover != null ? pts[hover] : null;

  return (
    <div className="elo">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`ELO de ${pts[0].elo} a ${last.elo} en ${pts.length} partidas`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">
              {v}
            </text>
          </g>
        ))}
        <path d={path} className="elo-line" />
        {pts.map((p, k) => (
          <circle key={k} cx={x(k)} cy={y(p.elo)} r={hover === k ? 5 : 3} className={`elo-dot res-${p.g.result}`} />
        ))}
        <text x={x(pts.length - 1) + 8} y={y(last.elo) + 4} className="axis strong">
          {last.elo}
        </text>
        {h && <line x1={x(hover!)} x2={x(hover!)} y1={T} y2={H - B} className="crosshair" />}
        {pts.map((_, k) => (
          <rect
            key={k}
            x={x(k) - (W - L - R) / pts.length / 2}
            y={0}
            width={(W - L - R) / pts.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(k)}
          />
        ))}
      </svg>
      <div className="elo-tip" aria-live="polite">
        {h ? (
          <>
            Partida {h.i} · {h.g.result === 'W' ? 'victoria' : h.g.result === 'L' ? 'derrota' : 'empate'} vs {h.g.opp} · ELO <b>{h.elo}</b>
          </>
        ) : (
          <>Pasa el ratón por el gráfico para ver cada partida.</>
        )}
      </div>
    </div>
  );
}
