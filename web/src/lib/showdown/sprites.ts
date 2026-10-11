import { toID } from '@/lib/utils';

/** Nombres con guion que no son formas ("Kommo-o", "Chi-Yu"…). */
const HYPHENATED = new Set(['kommoo', 'hakamoo', 'jangmoo', 'hooh', 'porygonz', 'wochien', 'chienpao', 'tinglu', 'chiyu']);

/** Id de sprite de Showdown: "Garchomp-Mega-Z" → "garchomp-megaz". */
export function spriteId(name: string) {
  const clean = name.replace(/-\*$/, '');
  const id = toID(clean);
  const dash = clean.indexOf('-');
  if (dash < 0 || HYPHENATED.has(id)) return id;
  return toID(clean.slice(0, dash)) + '-' + toID(clean.slice(dash + 1));
}

const BASE = 'https://play.pokemonshowdown.com/sprites';

export type SpriteFolder = 'home-centered' | 'gen5' | 'dex';

/** Orden de carpetas a probar: grande = render 3D de HOME; pequeño = sprite pixel de 5ª gen. */
export const SPRITE_FOLDERS: Record<'big' | 'small', SpriteFolder[]> = {
  big: ['home-centered', 'gen5', 'dex'],
  small: ['gen5', 'home-centered', 'dex'],
};

export const spriteUrl = (folder: SpriteFolder, name: string) => `${BASE}/${folder}/${spriteId(name)}.png`;
