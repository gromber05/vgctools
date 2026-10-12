import { calculate, Field, Generations, Move, Pokemon, Side } from '@smogon/calc';
import { getFinalSpeed } from '@smogon/calc/dist/mechanics/util';
import { baseSpecies, battleForm, findMove } from './data';
import { evToSp, STAT_KEYS, spToEv, type StatKey } from './rules';

const gen = Generations.get(9);

export type Status = '' | 'brn' | 'par' | 'psn' | 'tox' | 'slp' | 'frz';
export type Weather = '' | 'Sun' | 'Rain' | 'Sand' | 'Snow';
export type Terrain = '' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty';
export type SideKey = 'left' | 'right';
/** Tirada del atacante que se tiene en cuenta: la más baja (KO asegurado), la media o la más alta (aguante asegurado). */
export type RollLevel = 'low' | 'mid' | 'high';
export const ROLL_INDEX: Record<RollLevel, number> = { low: 0, mid: 7, high: 15 };

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

/** Efectos que dependen del lado del campo: los ofensivos se aplican cuando ese lado ataca y los defensivos cuando recibe. */
export interface SideField {
  crit: boolean;
  singleTarget: boolean;
  helpingHand: boolean;
  steelySpirit: boolean;
  battery: boolean;
  powerSpot: boolean;
  tailwind: boolean;
  reflect: boolean;
  lightScreen: boolean;
  auroraVeil: boolean;
  friendGuard: boolean;
  stealthRock: boolean;
  spikes: number;
  seeded: boolean;
}

export interface CalcField {
  doubles: boolean;
  weather: Weather;
  terrain: Terrain;
  gravity: boolean;
  magicRoom: boolean;
  wonderRoom: boolean;
  trickRoom: boolean;
  fairyAura: boolean;
  darkAura: boolean;
  auraBreak: boolean;
  left: SideField;
  right: SideField;
}

export const defaultSideField: SideField = {
  crit: false,
  singleTarget: false,
  helpingHand: false,
  steelySpirit: false,
  battery: false,
  powerSpot: false,
  tailwind: false,
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  stealthRock: false,
  spikes: 0,
  seeded: false,
};

export const defaultField: CalcField = {
  doubles: true,
  weather: '',
  terrain: '',
  gravity: false,
  magicRoom: false,
  wonderRoom: false,
  trickRoom: false,
  fairyAura: false,
  darkAura: false,
  auraBreak: false,
  left: defaultSideField,
  right: defaultSideField,
};

export interface DamageResult {
  move: string;
  min: number;
  max: number;
  minPct: number;
  maxPct: number;
  /** Las 16 tiradas posibles (sumando cada golpe en los movimientos multigolpe). */
  rolls: number[];
  /** PS actuales del defensor. */
  hp: number;
  maxHp: number;
  ko: string;
  desc: string;
}

export const otherSide = (side: SideKey): SideKey => (side === 'left' ? 'right' : 'left');

export function toPokemon(mon: CalcMon): Pokemon {
  const form = battleForm(mon.species, mon.item);
  const useMega = !!form?.mega && mon.megaEvolved;
  const name = useMega ? form!.species.name : (baseSpecies(mon.species)?.name ?? mon.species);
  const pokemon = new Pokemon(gen, name, {
    level: 50,
    nature: mon.nature || 'Hardy',
    item: mon.item || undefined,
    ability: useMega ? form!.species.abilities[0] : mon.ability || undefined,
    evs: Object.fromEntries(STAT_KEYS.map((k, i) => [k, spToEv(mon.sp[i] ?? 0)])),
    ivs: Object.fromEntries(STAT_KEYS.map((k) => [k, 31])),
    boosts: mon.boosts,
    status: mon.status || undefined,
  });
  pokemon.originalCurHP = Math.max(1, Math.round((pokemon.maxHP() * mon.hpPercent) / 100));
  return pokemon;
}

/** PS actuales y máximos con el porcentaje de vida restante. */
export function hpOf(mon: CalcMon): { hp: number; maxHp: number } {
  const p = toPokemon(mon);
  return { hp: p.curHP(), maxHp: p.maxHP() };
}

const toSide = (s: SideField) =>
  new Side({
    isHelpingHand: s.helpingHand,
    isSteelySpirit: s.steelySpirit,
    isBattery: s.battery,
    isPowerSpot: s.powerSpot,
    isTailwind: s.tailwind,
    isReflect: s.reflect,
    isLightScreen: s.lightScreen,
    isAuroraVeil: s.auroraVeil,
    isFriendGuard: s.friendGuard,
    isSR: s.stealthRock,
    spikes: s.spikes,
    isSeeded: s.seeded,
  });

export function toField(field: CalcField, attackerSide: SideKey = 'left'): Field {
  return new Field({
    gameType: field.doubles ? 'Doubles' : 'Singles',
    weather: field.weather || undefined,
    terrain: field.terrain || undefined,
    isGravity: field.gravity,
    isMagicRoom: field.magicRoom,
    isWonderRoom: field.wonderRoom,
    isFairyAura: field.fairyAura,
    isDarkAura: field.darkAura,
    isAuraBreak: field.auraBreak,
    attackerSide: toSide(field[attackerSide]),
    defenderSide: toSide(field[otherSide(attackerSide)]),
  });
}

export function toMove(name: string, field: CalcField, attackerSide: SideKey = 'left'): Move | undefined {
  const data = findMove(name);
  if (!data || data.category === 'Status') return undefined;
  const side = field[attackerSide];
  return new Move(gen, data.name, {
    isCrit: side.crit,
    overrides: { basePower: data.power, ...(side.singleTarget ? { target: 'normal' as const } : {}) },
  });
}

/** Suma por tirada los golpes de un movimiento multigolpe; devuelve siempre 16 valores. */
export function damageRolls(damage: number | number[] | number[][]): number[] {
  if (typeof damage === 'number') return Array(16).fill(damage);
  if (Array.isArray(damage[0])) {
    const hits = damage as number[][];
    return hits[0].map((_, i) => hits.reduce((sum, h) => sum + h[i], 0));
  }
  return damage as number[];
}

/** El motor de Showdown describe la inversión en EVs (0–252); en Champions son Stat Points (0–32). */
export const spDesc = (desc: string) =>
  desc.replace(
    /(?<![\d.+-])(\d+)([+-]?) (HP|Atk|Def|SpA|SpD|Spe)\b/g,
    (_, ev: string, mod: string, stat: string) => `${evToSp(+ev)}${mod} ${stat}`,
  );

export function calcDamage(
  attacker: CalcMon,
  defender: CalcMon,
  moves: string[],
  field: CalcField,
  attackerSide: SideKey = 'left',
): DamageResult[] {
  const atk = toPokemon(attacker);
  const def = toPokemon(defender);
  const calcField = toField(field, attackerSide);

  return moves.flatMap((name) => {
    const move = toMove(name, field, attackerSide);
    if (!move) return [];
    const result = calculate(gen, atk, def, move, calcField);
    const [min, max] = result.range();
    const maxHp = def.maxHP();
    let ko = '';
    let desc = '';
    if (max > 0) {
      try {
        ko = result.kochance().text;
        desc = spDesc(result.desc());
      } catch {}
    }
    const rolls = damageRolls(result.damage);
    return [{ move: name, min, max, minPct: (min / maxHp) * 100, maxPct: (max / maxHp) * 100, rolls, hp: def.curHP(), maxHp, ko, desc }];
  });
}

/** Velocidad final de cada lado con Tailwind, objetos, habilidades, cambios de nivel y parálisis. */
export function finalSpeeds(left: CalcMon, right: CalcMon, field: CalcField): { left: number; right: number } {
  const calcField = toField(field, 'left');
  return {
    left: getFinalSpeed(gen, toPokemon(left), calcField, calcField.attackerSide),
    right: getFinalSpeed(gen, toPokemon(right), calcField, calcField.defenderSide),
  };
}
