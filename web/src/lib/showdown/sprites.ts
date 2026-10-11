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

export type SpriteFolder = 'ani' | 'gen5ani' | 'home-centered' | 'gen5' | 'dex';

export const ANIMATED: ReadonlySet<SpriteFolder> = new Set(['ani', 'gen5ani']);
export const PIXEL: ReadonlySet<SpriteFolder> = new Set(['gen5', 'gen5ani']);

export const SPRITE_FOLDERS: Record<'big' | 'small', SpriteFolder[]> = {
  big: ['ani', 'home-centered', 'gen5', 'dex'],
  small: ['gen5ani', 'gen5', 'home-centered', 'dex'],
};

export const spriteFolders = (big: boolean, animated: boolean) =>
  SPRITE_FOLDERS[big ? 'big' : 'small'].filter((f) => animated || !ANIMATED.has(f));

export const spriteUrl = (folder: SpriteFolder, name: string) =>
  `${BASE}/${folder}/${spriteId(name)}.${ANIMATED.has(folder) ? 'gif' : 'png'}`;
