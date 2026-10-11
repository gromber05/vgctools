import { calculate, Field, Generations, Move, Pokemon } from '@smogon/calc';
import { baseSpecies, battleForm, findMove } from './data';
import { STAT_KEYS, spToEv, type StatKey } from './rules';

const gen = Generations.get(9);

export type Status = '' | 'brn' | 'par' | 'psn' | 'tox' | 'slp' | 'frz';
export type Weather = '' | 'Sun' | 'Rain' | 'Sand' | 'Snow';
export type Terrain = '' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty';

export interface CalcMon {
  species: string;
  item: string;
  ability: string;
  nature: string;
  sp: number[];
  boosts: Partial<Record<Exclude<StatKey, 'hp'>, number>>;
  status: Status;
  hpPercent: number;
  megaEvolved: boolean;
}

export interface CalcField {
  doubles: boolean;
  weather: Weather;
  terrain: Terrain;
  crit: boolean;
  helpingHand: boolean;
  reflect: boolean;
  lightScreen: boolean;
  auroraVeil: boolean;
  friendGuard: boolean;
}

export const defaultField: CalcField = {
  doubles: true,
  weather: '',
  terrain: '',
  crit: false,
  helpingHand: false,
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
};

export interface DamageResult {
  move: string;
  min: number;
  max: number;
  minPct: number;
  maxPct: number;
  ko: string;
  desc: string;
}

function toPokemon(mon: CalcMon): Pokemon {
  const form = battleForm(mon.species, mon.item);
  const useMega = !!form?.mega && mon.megaEvolved;
  const name = useMega ? form!.species.name : (baseSpecies(mon.species)?.name ?? mon.species);
  return new Pokemon(gen, name, {
    level: 50,
    nature: mon.nature || 'Hardy',
    item: mon.item || undefined,
    ability: useMega ? form!.species.abilities[0] : mon.ability || undefined,
    evs: Object.fromEntries(STAT_KEYS.map((k, i) => [k, spToEv(mon.sp[i] ?? 0)])),
    ivs: Object.fromEntries(STAT_KEYS.map((k) => [k, 31])),
    boosts: mon.boosts,
    status: mon.status || undefined,
  });
}

export function calcDamage(attacker: CalcMon, defender: CalcMon, moves: string[], field: CalcField): DamageResult[] {
  const atk = toPokemon(attacker);
  const def = toPokemon(defender);
  def.originalCurHP = Math.max(1, Math.round((def.maxHP() * defender.hpPercent) / 100));

  const calcField = new Field({
    gameType: field.doubles ? 'Doubles' : 'Singles',
    weather: field.weather || undefined,
    terrain: field.terrain || undefined,
    attackerSide: { isHelpingHand: field.helpingHand },
    defenderSide: {
      isReflect: field.reflect,
      isLightScreen: field.lightScreen,
      isAuroraVeil: field.auroraVeil,
      isFriendGuard: field.friendGuard,
    },
  });

  return moves
    .map((name) => ({ name, data: findMove(name) }))
    .filter(({ data }) => data && data.category !== 'Status')
    .map(({ name, data }) => {
      const move = new Move(gen, data!.name, { isCrit: field.crit, overrides: { basePower: data!.power } });
      const result = calculate(gen, atk, def, move, calcField);
      const [min, max] = result.range();
      const hp = def.maxHP();
      let ko = '';
      let desc = '';
      if (max > 0) {
        try {
          ko = result.kochance().text;
          desc = result.desc();
        } catch {}
      }
      return { move: name, min, max, minPct: (min / hp) * 100, maxPct: (max / hp) * 100, ko, desc };
    });
}
