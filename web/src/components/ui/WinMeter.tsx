import type { ReactNode } from 'react';
import { pct } from '@/lib/utils';

/** Barra de win%: el relleno es la proporción de victorias, con el dato escrito al lado. */
export function WinMeter({ wins, games, label }: { wins: number; games: number; label?: ReactNode }) {
  return (
    <div className="meter" title={games ? `${wins} victorias de ${games}` : 'Sin partidas'}>
      {label && <span className="meter-label">{label}</span>}
      <span className="meter-track">{games > 0 && <span className="meter-fill" style={{ width: `${(wins / games) * 100}%` }} />}</span>
      <span className="meter-value">{games ? pct(wins, games) : '–'}</span>
      <span className="meter-n">{games ? `${wins}/${games}` : ''}</span>
    </div>
  );
}
