import { describe, expect, it } from 'vitest';
import { blankSide } from '@/features/calc/side';
import { calcDamage, defaultField } from './damage';
import { isKo, optimizeSp, type OptimizeOptions } from './optimizer';

const chomp = { ...blankSide('Garchomp'), nature: 'Adamant', sp: [0, 32, 0, 0, 0, 32], moves: ['Dragon Claw'] };
const roar = { ...blankSide('Incineroar'), nature: 'Careful', sp: [0, 0, 0, 0, 0, 0], moves: ['Flare Blitz'] };
const opts = (o: Partial<OptimizeOptions>): OptimizeOptions => ({
  goal: 'survive',
  hits: 2,
  roll: 'high',
  keepSp: false,
  changeNature: false,
  ...o,
});

describe('optimizador de SP', () => {
  it('encuentra el mínimo de PS y Defensa para aguantar y uno menos ya no basta', () => {
    const out = optimizeSp(roar, chomp, 'Dragon Claw', defaultField, 'right', opts({}));
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const { sp } = out.best;
    expect(sp[1] + sp[3] + sp[4] + sp[5]).toBe(0);
    const ko = (hp: number, def: number) => {
      const [hit] = calcDamage(chomp, { ...roar, sp: [hp, 0, def, 0, 0, 0] }, ['Dragon Claw'], defaultField);
      return isKo(hit, 2, 'high', roar.item);
    };
    expect(ko(sp[0], sp[2])).toBe(false);
    for (let hp = 0; hp <= 32; hp++)
      for (let def = 0; def <= 32 && hp + def < sp[0] + sp[2]; def++) expect(ko(hp, def), `${hp} PS / ${def} Def`).toBe(true);
  });

  it('busca los SP de ataque justos para el KO', () => {
    const target = { ...roar, sp: [20, 0, 0, 0, 0, 0] };
    const out = optimizeSp(
      { ...chomp, sp: [0, 0, 0, 0, 0, 32] },
      target,
      'Dragon Claw',
      defaultField,
      'left',
      opts({ goal: 'ko', roll: 'low', hits: 3 }),
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const atk = out.best.sp[1];
    expect(isKo(out.best.result, 3, 'low', target.item)).toBe(true);
    if (atk > 0) {
      const [less] = calcDamage({ ...chomp, sp: [0, atk - 1, 0, 0, 0, 32] }, target, ['Dragon Claw'], defaultField);
      expect(isKo(less, 3, 'low', target.item)).toBe(false);
    }
  });

  it('con «conservar mis SP» nunca baja lo que ya hay invertido', () => {
    const out = optimizeSp({ ...roar, sp: [32, 0, 10, 0, 0, 0] }, chomp, 'Dragon Claw', defaultField, 'right', opts({ keepSp: true }));
    if (out.ok) {
      expect(out.best.sp[0]).toBeGreaterThanOrEqual(32);
      expect(out.best.sp[2]).toBeGreaterThanOrEqual(10);
    }
  });

  it('puede proponer una naturaleza que suba la estadística optimizada', () => {
    const out = optimizeSp(
      { ...chomp, nature: 'Jolly', sp: [0, 0, 0, 0, 0, 32] },
      roar,
      'Dragon Claw',
      defaultField,
      'left',
      opts({ goal: 'ko', changeNature: true }),
    );
    expect(out.ok).toBe(true);
    if (out.ok && out.best.nature !== 'Jolly') expect(out.best.nature).toBe('Adamant');
  });

  it('no optimiza movimientos que no dependen de los SP', () => {
    const out = optimizeSp(chomp, roar, 'Protect', defaultField, 'left', opts({ goal: 'ko' }));
    expect(out.ok).toBe(false);
  });

  it('la Baya Zidra cuenta para el 2HKO', () => {
    const hit = { move: 'x', min: 60, max: 60, minPct: 60, maxPct: 60, rolls: Array(16).fill(60), hp: 100, maxHp: 100, ko: '', desc: '' };
    expect(isKo(hit, 2, 'high', '')).toBe(true);
    expect(isKo(hit, 2, 'high', 'Sitrus Berry')).toBe(false);
    expect(isKo(hit, 3, 'high', 'Sitrus Berry')).toBe(true);
  });
});
