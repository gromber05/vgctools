import { describe, expect, it } from 'vitest';
import { parsePaste, exportPaste } from '@/lib/showdown/paste';
import { calcDamage, defaultField, spDesc, type CalcMon } from './damage';
import { battleForm, canLearn } from './data';
import { setWarnings } from './legality';
import { calcStats, formatSp, parseSp, spToEv } from './rules';
import { effectiveness } from './typechart';

const mon = (over: Partial<CalcMon>): CalcMon => ({
  species: 'Incineroar',
  item: '',
  ability: '',
  nature: 'Hardy',
  sp: [0, 0, 0, 0, 0, 0],
  boosts: {},
  status: '',
  hpPercent: 100,
  megaEvolved: true,
  ...over,
});

describe('reglas de stats', () => {
  it('calcula stats a nivel 50 con Stat Points', () => {
    expect(calcStats([108, 130, 95, 80, 85, 102], [2, 32, 0, 0, 0, 32], 'Jolly')).toEqual([185, 182, 115, 90, 105, 169]);
  });

  it('lee y escribe la línea de puntos, y convierte EVs clásicos', () => {
    expect(parseSp('32 HP / 2 SpD')).toEqual([32, 0, 0, 0, 2, 0]);
    expect(parseSp('252 Atk / 4 Def / 252 Spe')).toEqual([0, 32, 1, 0, 0, 32]);
    expect(formatSp([32, 0, 0, 0, 2, 0])).toBe('32 HP / 2 SpD');
  });

  it('los EVs equivalentes dan la misma stat', () => {
    expect(spToEv(32)).toBe(252);
    expect(spToEv(1)).toBe(4);
    expect(spToEv(0)).toBe(0);
  });
});

describe('datos y legalidad', () => {
  it('resuelve la forma Mega con su piedra', () => {
    expect(battleForm('Garchomp', 'Garchompite Z')?.species.name).toBe('Garchomp-Mega-Z');
    expect(battleForm('Garchomp', 'Choice Scarf')?.mega).toBe(false);
  });

  it('detecta sets ilegales', () => {
    const team = parsePaste(
      'Incineroar @ Sitrus Berry\nAbility: Levitate\nEVs: 30 HP / 30 Def / 10 Spe\n- Fake Out\n- Moonblast\n\nGarchomp @ Sitrus Berry\n- Earthquake',
    );
    const w = setWarnings(team[0], team);
    expect(w).toContain('Has repartido 70 Stat Points; el máximo es 66.');
    expect(w).toContain('Incineroar no puede tener Levitate.');
    expect(w).toContain('Incineroar no aprende Moonblast.');
    expect(w).toContain('Cláusula de objeto: Sitrus Berry está repetido.');
    expect(canLearn('Incineroar', 'Fake Out')).toBe(true);
  });

  it('exportar y volver a leer conserva el equipo', () => {
    const team = parsePaste('Tanque (Kingambit) @ Black Glasses\nAbility: Defiant\nEVs: 32 HP / 32 Atk\nAdamant Nature\n- Kowtow Cleave');
    expect(parsePaste(exportPaste(team))).toEqual(team);
  });
});

describe('tabla de tipos', () => {
  it('multiplica tipos y aplica habilidades', () => {
    expect(effectiveness('Ground', ['Fire', 'Dark'])).toBe(2);
    expect(effectiveness('Ice', ['Dragon', 'Ground'])).toBe(4);
    expect(effectiveness('Ground', ['Steel'], 'Levitate')).toBe(0);
  });
});

describe('calculadora', () => {
  it('da el mismo daño que Showdown con Stat Points', () => {
    const [eq] = calcDamage(
      mon({ species: 'Garchomp', nature: 'Jolly', sp: [0, 32, 0, 0, 0, 32] }),
      mon({ species: 'Incineroar', nature: 'Careful', sp: [32, 0, 0, 0, 1, 0] }),
      ['Earthquake'],
      defaultField,
    );
    expect([eq.min, eq.max]).toEqual([138, 164]);
    expect(eq.ko).toMatch(/2HKO/);
    expect(eq.desc).toMatch(/^32\+? Atk Garchomp Earthquake vs\. 32 HP \/ 0 Def Incineroar/);
  });

  it('describe la inversión en Stat Points y no en EVs', () => {
    expect(spDesc('+1 252+ Atk Garchomp Earthquake vs. 252 HP / 76 Def Incineroar: 126-150 (62.3 - 74.2%)')).toBe(
      '+1 32+ Atk Garchomp Earthquake vs. 32 HP / 10 Def Incineroar: 126-150 (62.3 - 74.2%)',
    );
  });

  it('usa la forma Mega y omite movimientos de estado', () => {
    const res = calcDamage(
      mon({ species: 'Garchomp', item: 'Garchompite Z', nature: 'Timid', sp: [0, 0, 0, 32, 0, 32] }),
      mon({ species: 'Incineroar' }),
      ['Draco Meteor', 'Protect'],
      defaultField,
    );
    expect(res).toHaveLength(1);
    expect(res[0].desc).toContain('Garchomp-Mega-Z');
  });
});
