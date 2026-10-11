import { baseSpecies } from '@/lib/champions/data';
import type { CalcMon } from '@/lib/champions/damage';

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
