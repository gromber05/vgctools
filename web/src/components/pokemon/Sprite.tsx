import { useState, useSyncExternalStore } from 'react';
import { ANIMATED, PIXEL, spriteFolders, spriteUrl } from '@/lib/showdown/sprites';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

interface SpriteProps {
  name: string;
  size?: number;
  big?: boolean;
  faded?: boolean;
}

export function Sprite({ name, size = 40, big = false, faded = false }: SpriteProps) {
  const reduced = useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
  const [failed, setFailed] = useState({ name, count: 0 });
  const attempt = failed.name === name ? failed.count : 0;
  const folder = spriteFolders(big, !reduced && !faded)[attempt];
  const cls = [
    'sprite',
    faded && 'is-faded',
    folder && PIXEL.has(folder) && 'is-pixel',
    folder && ANIMATED.has(folder) && 'is-animated',
    big && 'is-big',
  ]
    .filter(Boolean)
    .join(' ');

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
      onError={() => setFailed({ name, count: attempt + 1 })}
    />
  );
}
