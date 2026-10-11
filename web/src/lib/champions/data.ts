import raw from '@/data/champions.json';
import { toID } from '@/lib/utils';

export interface Species {
  name: string;
  types: string[];
  stats: number[];
  abilities: string[];
  learnset?: string[];
  mega?: boolean;
  base?: string;
  stone?: string;
}

export interface MoveData {
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  power: number;
  accuracy: number;
  priority: number;
  target: string;
  desc: string;
}

export interface Item {
  name: string;
  megaStone?: Record<string, string>;
}

const data = raw as unknown as {
  generated: string;
  species: Record<string, Species>;
  moves: Record<string, MoveData>;
  items: Record<string, Item>;
};

export const DATA_DATE = data.generated;
export const SPECIES = data.species;
export const MOVES = data.moves;
export const ITEMS = data.items;

const byName = <T extends { name: string }>(table: Record<string, T>) =>
  Object.fromEntries(Object.entries(table).map(([id, v]) => [toID(v.name), id]));
const speciesIndex = byName(SPECIES);
const itemIndex = byName(ITEMS);
const moveIndex = byName(MOVES);

export const SPECIES_NAMES = Object.values(SPECIES)
  .filter((s) => !s.mega)
  .map((s) => s.name)
  .sort();
export const ITEM_NAMES = Object.values(ITEMS)
  .map((i) => i.name)
  .sort();

export const findSpecies = (name: string): Species | undefined => SPECIES[speciesIndex[toID(name)]];
export const findItem = (name: string): Item | undefined => ITEMS[itemIndex[toID(name)]];
export const findMove = (name: string): MoveData | undefined => MOVES[moveIndex[toID(name)]];

export function baseSpecies(name: string): Species | undefined {
  const s = findSpecies(name);
  return s?.mega ? SPECIES[s.base!] : s;
}

export function battleForm(speciesName: string, itemName: string): { species: Species; mega: boolean } | undefined {
  const base = baseSpecies(speciesName);
  if (!base) return undefined;
  const megaName = findItem(itemName)?.megaStone?.[base.name];
  const mega = megaName ? findSpecies(megaName) : undefined;
  return mega ? { species: mega, mega: true } : { species: base, mega: false };
}

export const learnableMoves = (speciesName: string): string[] =>
  (baseSpecies(speciesName)?.learnset ?? []).map((id) => MOVES[id].name).sort();

export const canLearn = (speciesName: string, moveName: string) => {
  const id = moveIndex[toID(moveName)];
  return !!id && !!baseSpecies(speciesName)?.learnset?.includes(id);
};
