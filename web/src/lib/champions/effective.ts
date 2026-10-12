import type { Status, Terrain, Weather } from './damage';

/** Lo que puede cambiar una estadística ya calculada: objeto, habilidad y, en la calculadora, el combate. */
export interface StatContext {
  species: string;
  item: string;
  ability: string;
  status?: Status;
  boosts?: Partial<Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  weather?: Weather;
  terrain?: Terrain;
  tailwind?: boolean;
}

export interface StatMod {
  value: number;
  /** Qué la cambia, para el tooltip («Pañuelo Elegido ×1,5»). */
  notes: string[];
}

const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const ATK = 1;
const DEF = 2;
const SPA = 3;
const SPE = 5;

const stageMult = (stage: number) => (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage));
const fmt = (m: number) => `×${String(m).replace('.', ',')}`;

/** Estadísticas efectivas; `undefined` en las que no cambia nada. */
export function effectiveStats(stats: number[], ctx: StatContext): (StatMod | undefined)[] {
  const mods: [number, number, string][] = [];
  const add = (i: number, m: number, why: string) => mods.push([i, m, why]);
  const hasStatus = !!ctx.status;

  if (ctx.item === 'Choice Scarf') add(SPE, 1.5, 'Pañuelo Elegido');
  if (ctx.item === 'Iron Ball') add(SPE, 0.5, 'Bola Férrea');
  if (ctx.item === 'Light Ball' && ctx.species.startsWith('Pikachu')) {
    add(ATK, 2, 'Bolaluz');
    add(SPA, 2, 'Bolaluz');
  }

  switch (ctx.ability) {
    case 'Huge Power':
      add(ATK, 2, 'Potencia');
      break;
    case 'Pure Power':
      add(ATK, 2, 'Energía Pura');
      break;
    case 'Hustle':
      add(ATK, 1.5, 'Entusiasmo');
      break;
    case 'Fur Coat':
      add(DEF, 2, 'Pelaje Recio');
      break;
    case 'Guts':
      if (hasStatus) add(ATK, 1.5, 'Agallas');
      break;
    case 'Marvel Scale':
      if (hasStatus) add(DEF, 1.5, 'Escama Especial');
      break;
    case 'Quick Feet':
      if (hasStatus) add(SPE, 1.5, 'Pies Rápidos');
      break;
    case 'Swift Swim':
      if (ctx.weather === 'Rain') add(SPE, 2, 'Nado Rápido');
      break;
    case 'Chlorophyll':
      if (ctx.weather === 'Sun') add(SPE, 2, 'Clorofila');
      break;
    case 'Sand Rush':
      if (ctx.weather === 'Sand') add(SPE, 2, 'Ímpetu Arena');
      break;
    case 'Slush Rush':
      if (ctx.weather === 'Snow') add(SPE, 2, 'Quitanieves');
      break;
    case 'Surge Surfer':
      if (ctx.terrain === 'Electric') add(SPE, 2, 'Cola Surf');
      break;
    case 'Solar Power':
      if (ctx.weather === 'Sun') add(SPA, 1.5, 'Poder Solar');
      break;
    case 'Grass Pelt':
      if (ctx.terrain === 'Grassy') add(DEF, 1.5, 'Manto Frondoso');
      break;
  }
  if (ctx.tailwind) add(SPE, 2, 'Tailwind');
  if (ctx.status === 'par' && ctx.ability !== 'Quick Feet') add(SPE, 0.5, 'Parálisis');

  return stats.map((base, i) => {
    if (i === 0) return undefined;
    const notes: string[] = [];
    let value = base;
    const stage = ctx.boosts?.[KEYS[i] as Exclude<(typeof KEYS)[number], 'hp'>] ?? 0;
    if (stage) {
      value = Math.floor(value * stageMult(stage));
      notes.push(stage > 0 ? `+${stage}` : `${stage}`);
    }
    for (const [j, m, why] of mods) {
      if (j !== i) continue;
      value = Math.floor(value * m);
      notes.push(`${why} ${fmt(m)}`);
    }
    return value === base ? undefined : { value, notes };
  });
}
