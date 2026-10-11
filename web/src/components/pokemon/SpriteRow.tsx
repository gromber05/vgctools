import { Sprite } from './Sprite';

interface SpriteRowProps {
  names: string[];
  size?: number;
  active?: string[];
  lead?: string[];
}

export function SpriteRow({ names, size = 36, active, lead }: SpriteRowProps) {
  return (
    <span className="sprite-row">
      {names.map((n, i) => (
        <span key={`${n}-${i}`} className={lead?.includes(n) ? 'sprite-slot is-lead' : 'sprite-slot'}>
          <Sprite name={n} size={size} faded={!!active && !active.includes(n)} />
        </span>
      ))}
    </span>
  );
}
