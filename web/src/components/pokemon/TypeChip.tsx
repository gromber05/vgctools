import { TYPE_ES } from '@/lib/champions/typechart';
import { TYPE_STYLE, typeColor } from './typeIcons';

export function TypeChip({ type, small = false }: { type: string; small?: boolean }) {
  const color = typeColor(type);
  return (
    <span className={small ? 'type-badge is-small' : 'type-badge'} style={{ ['--type' as string]: color }}>
      <span className="type-badge-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d={TYPE_STYLE[type]?.icon ?? ''} fill={color} />
        </svg>
      </span>
      <span className="type-badge-name">{TYPE_ES[type] ?? type}</span>
    </span>
  );
}

export function TypeChips({ types, small }: { types: string[]; small?: boolean }) {
  return (
    <span className="type-chips">
      {types.map((t) => (
        <TypeChip key={t} type={t} small={small} />
      ))}
    </span>
  );
}
