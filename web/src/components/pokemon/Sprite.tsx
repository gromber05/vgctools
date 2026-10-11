import { useState } from 'react';
import { SPRITE_FOLDERS, spriteUrl } from '@/lib/showdown/sprites';

interface SpriteProps {
  name: string;
  size?: number;
  /** render 3D grande en vez de sprite pixel */
  big?: boolean;
  /** atenuado: estaba en el equipo pero no salió */
  faded?: boolean;
}

export function Sprite({ name, size = 40, big = false, faded = false }: SpriteProps) {
  const [attempt, setAttempt] = useState(0);
  const folders = SPRITE_FOLDERS[big ? 'big' : 'small'];
  const folder = folders[attempt];
  const cls = ['sprite', faded && 'is-faded', folder === 'gen5' && 'is-pixel'].filter(Boolean).join(' ');

  if (!folder) {
    return (
      <span className={`${cls} sprite-missing`} style={{ width: size, height: size }} title={name}>
        {name.slice(0, 3)}
      </span>
    );
  }
  return (
    <img
      className={cls}
      src={spriteUrl(folder, name)}
      alt={name}
      title={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  );
}
