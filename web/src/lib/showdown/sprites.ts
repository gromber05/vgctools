import { toID } from '@/lib/utils';

const HYPHENATED = new Set(['kommoo', 'hakamoo', 'jangmoo', 'hooh', 'porygonz', 'wochien', 'chienpao', 'tinglu', 'chiyu']);

export function spriteId(name: string) {
  const clean = name.replace(/-\*$/, '');
  const id = toID(clean);
  const dash = clean.indexOf('-');
  if (dash < 0 || HYPHENATED.has(id)) return id;
  return toID(clean.slice(0, dash)) + '-' + toID(clean.slice(dash + 1));
}

const BASE = 'https://play.pokemonshowdown.com/sprites';

export type SpriteFolder = 'home-centered' | 'gen5' | 'dex';

export const SPRITE_FOLDERS: Record<'big' | 'small', SpriteFolder[]> = {
  big: ['home-centered', 'gen5', 'dex'],
  small: ['gen5', 'home-centered', 'dex'],
};

export const spriteUrl = (folder: SpriteFolder, name: string) => `${BASE}/${folder}/${spriteId(name)}.png`;
