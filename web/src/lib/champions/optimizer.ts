import {
  calcDamage,
  otherSide,
  ROLL_INDEX,
  toMove,
  type CalcField,
  type CalcMon,
  type DamageResult,
  type RollLevel,
  type SideKey,
} from './damage';
import { NATURES, SP_MAX, SP_TOTAL } from './rules';

export type Goal = 'ko' | 'survive';
export type { RollLevel } from './damage';

export interface OptimizeOptions {
  goal: Goal;
  hits: number;
  roll: RollLevel;
  /** Parte de los SP actuales y solo añade; si no, recalcula desde 0 las estadísticas que optimiza. */
  keepSp: boolean;
  changeNature: boolean;
}

export interface Optimized {
  sp: number[];
  nature: string;
  /** SP de diferencia respecto al reparto actual (negativo si libera puntos). */
  delta: number;
  result: DamageResult;
}

export type OptimizeOutcome = { ok: true; best: Optimized } | { ok: false; reason: string };

const HP = 0;
const ATK = 1;
const DEF = 2;
const SPA = 3;
const SPD = 4;

/** ¿Cae el defensor en `hits` golpes con esa tirada? Tiene en cuenta la Baya Zidra. */
export function isKo(result: DamageResult, hits: number, roll: RollLevel, defenderItem: string): boolean {
  const dmg = result.rolls[ROLL_INDEX[roll]] ?? 0;
  if (dmg <= 0) return false;
  let hp = result.hp;
  let berry = defenderItem === 'Sitrus Berry';
  for (let i = 0; i < hits; i++) {
    hp -= dmg;
    if (hp <= 0) return true;
    if (berry && hp <= result.maxHp / 2) {
      hp += Math.floor(result.maxHp / 4);
      berry = false;
    }
  }
  return false;
}

/** Naturalezas a probar: la actual y, si se permite, una que suba `plus` sin tocar lo que ya se optimiza. */
function natureCandidates(current: string, plus: number, protect: number[], dump: number, allow: boolean): string[] {
  if (!allow) return [current];
  const minus = NATURES[current]?.[2];
  const keepMinus = minus !== undefined && minus !== plus && !protect.includes(minus) ? minus : dump;
  const built = Object.keys(NATURES).find((n) => NATURES[n][1] === plus && NATURES[n][2] === keepMinus);
  return [...new Set([current, ...(built ? [built] : [])])];
}

const spSum = (sp: number[]) => sp.reduce((a, b) => a + b, 0);

/**
 * Busca el reparto de Stat Points más barato para que `me` deje KO a `foe` (goal 'ko', con su movimiento `move`)
 * o para que `me` aguante el movimiento `move` de `foe` (goal 'survive').
 */
export function optimizeSp(
  me: CalcMon,
  foe: CalcMon,
  move: string,
  field: CalcField,
  mySide: SideKey,
  opts: OptimizeOptions,
): OptimizeOutcome {
  const attackerSide = opts.goal === 'ko' ? mySide : otherSide(mySide);
  const m = toMove(move, field, attackerSide);
  if (!m) return { ok: false, reason: 'Elige un movimiento de ataque.' };

  const evaluate = (sp: number[], nature: string) => {
    const mon = { ...me, sp, nature };
    const [result] = opts.goal === 'ko' ? calcDamage(mon, foe, [move], field, mySide) : calcDamage(foe, mon, [move], field, attackerSide);
    return result;
  };
  const check = (sp: number[], nature: string) => {
    const r = evaluate(sp, nature);
    return { result: r, ok: isKo(r, opts.hits, opts.roll, opts.goal === 'ko' ? foe.item : me.item) };
  };

  const current = me.sp.map((v) => v ?? 0);
  const floor = (i: number) => (opts.keepSp ? current[i] : 0);
  let best: (Omit<Optimized, 'delta'> & { cost: number; margin: number }) | undefined;

  if (opts.goal === 'ko') {
    if (m.overrideOffensivePokemon === 'target')
      return { ok: false, reason: `${m.name} usa el Ataque del rival: tus SP no cambian su daño.` };
    if (m.named('Seismic Toss', 'Night Shade', 'Super Fang', 'Final Gambit', 'Endeavor', 'Ruination'))
      return { ok: false, reason: `${m.name} hace daño fijo: los SP no lo cambian.` };
    let stat = m.overrideOffensiveStat === 'def' ? DEF : m.category === 'Physical' ? ATK : SPA;
    if (field.wonderRoom && stat === DEF) stat = SPD;
    const budget = SP_TOTAL - spSum(current) + current[stat];
    const dump = stat === ATK ? SPA : ATK;
    for (const nature of natureCandidates(me.nature, stat, [], dump, opts.changeNature)) {
      for (let v = floor(stat); v <= Math.min(SP_MAX, budget); v++) {
        const sp = current.map((x, i) => (i === stat ? v : x));
        const { result, ok } = check(sp, nature);
        if (ok) {
          const better = !best || v < best.cost || (v === best.cost && nature === me.nature);
          if (better) best = { sp, nature, result, cost: v, margin: 0 };
          break;
        }
      }
    }
  } else {
    let stat = m.overrideDefensiveStat === 'def' || (m.category === 'Physical' && m.overrideDefensiveStat !== 'spd') ? DEF : SPD;
    if (field.wonderRoom) stat = stat === DEF ? SPD : DEF;
    const budget = SP_TOTAL - spSum(current) + current[HP] + current[stat];
    const dump = current[ATK] < current[SPA] || (current[ATK] === current[SPA] && me.nature !== 'Hardy') ? ATK : SPA;
    for (const nature of natureCandidates(me.nature, stat, [HP], dump, opts.changeNature)) {
      for (let hp = floor(HP); hp <= SP_MAX; hp++) {
        // Más defensa nunca recibe más daño: búsqueda binaria del mínimo para estos PS.
        let lo = floor(stat);
        let hi = Math.min(SP_MAX, budget - hp);
        if (hi < lo) break;
        let found: { v: number; result: ReturnType<typeof evaluate> } | undefined;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const sp = current.map((x, i) => (i === HP ? hp : i === stat ? mid : x));
          const r = check(sp, nature);
          if (!r.ok) {
            found = { v: mid, result: r.result };
            hi = mid - 1;
          } else lo = mid + 1;
        }
        if (!found) continue;
        const cost = hp + found.v;
        const margin = found.result.hp - found.result.rolls[ROLL_INDEX[opts.roll]] * opts.hits;
        const better =
          !best ||
          cost < best.cost ||
          (cost === best.cost && nature === me.nature && best.nature !== me.nature) ||
          (cost === best.cost && nature === best.nature && margin > best.margin);
        if (better)
          best = { sp: current.map((x, i) => (i === HP ? hp : i === stat ? found!.v : x)), nature, result: found.result, cost, margin };
      }
    }
  }

  if (!best) {
    return {
      ok: false,
      reason:
        opts.goal === 'ko'
          ? 'No se llega al KO ni con todos los SP disponibles en esa estadística.'
          : 'No aguanta ni con todos los SP disponibles en PS y defensa.',
    };
  }
  return { ok: true, best: { sp: best.sp, nature: best.nature, result: best.result, delta: spSum(best.sp) - spSum(current) } };
}
