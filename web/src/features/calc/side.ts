import { baseSpecies, findItem, findMove, findSpecies, learnableMoves, SPECIES } from '@/lib/champions/data';
import type { CalcMon } from '@/lib/champions/damage';
import { parseSp } from '@/lib/champions/rules';
import type { PasteMon } from '@/lib/showdown/paste';

/** En la calculadora también se puede escribir la Mega directamente («Garchomp-Mega-Z»). */
export const CALC_SPECIES = Object.values(SPECIES)
  .map((s) => s.name)
  .sort();

export interface CalcSide extends CalcMon {
  moves: string[];
}

export const blankSide = (species: string): CalcSide => {
  const s = baseSpecies(species);
  return {
    species: s?.name ?? species,
    item: '',
    ability: s?.abilities[0] ?? '',
    nature: 'Hardy',
    sp: [0, 0, 0, 0, 0, 0],
    boosts: {},
    status: '',
    hpPercent: 100,
    megaEvolved: true,
    moves: ['', '', '', ''],
  };
};

/** Cambia de especie conservando los movimientos que puede aprender; si se elige una Mega, pone su Megapiedra. */
export function sideForSpecies(name: string, previous?: CalcSide): CalcSide {
  const side = blankSide(name);
  const stone = findSpecies(name)?.stone;
  if (stone) side.item = stone;
  if (previous) {
    const learnable = learnableMoves(side.species);
    side.moves = previous.moves.map((m) => (learnable.includes(m) ? m : ''));
  }
  return side;
}

export function sideFromMon(mon: PasteMon): CalcSide {
  const side = sideForSpecies(mon.species);
  return {
    ...side,
    item: findItem(mon.item)?.name ?? (mon.item || side.item),
    ability: mon.ability || side.ability,
    nature: mon.nature || 'Hardy',
    sp: parseSp(mon.evs),
    moves: [...mon.moves.map((m) => findMove(m)?.name ?? m), '', '', '', ''].slice(0, 4),
  };
}
