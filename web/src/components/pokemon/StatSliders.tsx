import type { ReactNode } from 'react';
import type { StatMod } from '@/lib/champions/effective';
import { calcStats, NATURES, SP_MAX, SP_TOTAL, spTotal, STAT_LABEL } from '@/lib/champions/rules';

const BASE_SCALE = 180;

interface StatSlidersProps {
  baseStats: number[] | null;
  sp: number[];
  nature: string;
  onChange: (index: number, value: number) => void;
  label: string;
  extra?: (index: number) => ReactNode;
  /** Valor final tras objetos, habilidades, cambios de nivel…; se muestra pequeño al lado. */
  modified?: (StatMod | undefined)[];
}

export function StatSliders({ baseStats, sp, nature, onChange, label, extra, modified }: StatSlidersProps) {
  const stats = baseStats ? calcStats(baseStats, sp, nature) : null;
  const n = NATURES[nature];
  const total = spTotal(sp);
  const left = SP_TOTAL - total;

  return (
    <div className={modified?.some(Boolean) ? 'stats-panel has-mods' : 'stats-panel'} role="group" aria-label={label}>
      {STAT_LABEL.map((name, i) => {
        const mod = n?.[1] === i ? 'is-plus' : n?.[2] === i ? 'is-minus' : '';
        const base = baseStats?.[i] ?? 0;
        return (
          <div key={name} className={`stat-row ${mod}`}>
            <span className="stat-name">
              {name}
              {mod === 'is-plus' ? ' +' : mod === 'is-minus' ? ' −' : ''}
            </span>
            <span className="stat-base" title="Estadística base">
              <span className="stat-base-bar" style={{ width: `${Math.min(100, (base / BASE_SCALE) * 100)}%` }} />
              <span className="stat-base-num">{baseStats ? base : '–'}</span>
            </span>
            <input
              className="stat-slider"
              type="range"
              min={0}
              max={SP_MAX}
              step={1}
              value={sp[i] ?? 0}
              style={{ ['--fill' as string]: `${((sp[i] ?? 0) / SP_MAX) * 100}%` }}
              onChange={(e) => onChange(i, +e.target.value)}
              aria-label={`Stat Points de ${name}`}
            />
            <input
              className="stat-sp"
              type="number"
              min={0}
              max={SP_MAX}
              inputMode="numeric"
              value={sp[i] ?? 0}
              onChange={(e) => onChange(i, Math.max(0, Math.min(SP_MAX, parseInt(e.target.value, 10) || 0)))}
              aria-label={`Stat Points de ${name} (número)`}
            />
            <span className="stat-final">
              {stats?.[i] ?? '–'}
              {stats && modified?.[i] && (
                <span
                  className={modified[i]!.value > stats[i] ? 'stat-mod is-up' : 'stat-mod is-down'}
                  title={modified[i]!.notes.join(' · ')}
                  aria-label={`Con modificadores: ${modified[i]!.value} (${modified[i]!.notes.join(', ')})`}
                >
                  {modified[i]!.value}
                </span>
              )}
            </span>
            {extra && <span className="stat-extra">{extra(i)}</span>}
          </div>
        );
      })}
      <div className={left < 0 ? 'stats-total is-over' : 'stats-total'}>
        <span className="stats-total-track">
          <span style={{ width: `${Math.min(100, (total / SP_TOTAL) * 100)}%` }} />
        </span>
        <span>{left >= 0 ? `Quedan ${left} de ${SP_TOTAL} SP` : `Te pasas ${-left} SP (máximo ${SP_TOTAL})`}</span>
      </div>
    </div>
  );
}
