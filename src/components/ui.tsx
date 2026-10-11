import { useState, type ReactNode } from 'react';
import { pct, toID } from '../lib/util';

/** Nombres con guion que no son formas ("Kommo-o", "Chi-Yu"…). */
const HYPHENATED = new Set(['kommoo', 'hakamoo', 'jangmoo', 'hooh', 'porygonz', 'wochien', 'chienpao', 'tinglu', 'chiyu']);

export function spriteId(name: string) {
  const clean = name.replace(/-\*$/, '');
  const id = toID(clean);
  const dash = clean.indexOf('-');
  if (dash < 0 || HYPHENATED.has(id)) return id;
  return toID(clean.slice(0, dash)) + '-' + toID(clean.slice(dash + 1));
}

const SOURCES = [
  (id: string) => `https://play.pokemonshowdown.com/sprites/gen5/${id}.png`,
  (id: string) => `https://play.pokemonshowdown.com/sprites/home-centered/${id}.png`,
  (id: string) => `https://play.pokemonshowdown.com/sprites/dex/${id}.png`,
];

export function Sprite({ name, size = 40 }: { name: string; size?: number }) {
  const [src, setSrc] = useState(0);
  const id = spriteId(name);
  if (src >= SOURCES.length)
    return (
      <span className="sprite-fallback" style={{ width: size, height: size }} title={name}>
        {name.slice(0, 3)}
      </span>
    );
  return (
    <img
      className="sprite"
      src={SOURCES[src](id)}
      alt={name}
      title={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setSrc((s) => s + 1)}
    />
  );
}

export function Sprites({ names, size, mark }: { names: string[]; size?: number; mark?: string[] }) {
  return (
    <span className="sprites">
      {names.map((n, i) => (
        <span key={n + i} className={mark?.includes(n) ? 'sprite-cell marked' : 'sprite-cell'}>
          <Sprite name={n} size={size} />
        </span>
      ))}
    </span>
  );
}

type Tone = 'blue' | 'orange' | 'green' | 'gold' | 'red' | 'gray';

/** Bloque con marco grueso de color, como los rangos con borde de la hoja. */
export function Block({ title, tone = 'blue', children, className = '' }: { title?: ReactNode; tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <section className={`block tone-${tone} ${className}`}>
      {title && <h2 className="block-title">{title}</h2>}
      <div className="block-body">{children}</div>
    </section>
  );
}

/** "3 de 4 · 75%" */
export function RateCells({ wins, games }: { wins: number; games: number }) {
  if (!games) return <td className="num muted" colSpan={2}>–</td>;
  return (
    <>
      <td className="num">{wins} de {games}</td>
      <td className="num strong">{pct(wins, games)}</td>
    </>
  );
}

export function ResultCell({ result }: { result: 'W' | 'L' | 'T' }) {
  const label = { W: 'Victoria', L: 'Derrota', T: 'Empate' }[result];
  return <td className={`result r-${result}`}>{label}</td>;
}

export function FilterSelect({ label, value, options, onChange, any = '-cualquiera-' }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; any?: string }) {
  return (
    <label className="filter">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={value ? 'on' : ''}>
        <option value="">{any}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
