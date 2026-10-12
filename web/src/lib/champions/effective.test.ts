import { describe, expect, it } from 'vitest';
import { effectiveStats } from './effective';

const stats = [207, 146, 98, 90, 95, 137];

describe('estadísticas efectivas', () => {
  it('Pañuelo Elegido multiplica la Velocidad', () => {
    const mods = effectiveStats(stats, { species: 'Basculegion', item: 'Choice Scarf', ability: 'Adaptability' });
    expect(mods[5]).toEqual({ value: 205, notes: ['Pañuelo Elegido ×1,5'] });
    expect(mods.filter(Boolean)).toHaveLength(1);
  });

  it('suma cambios de nivel, habilidades y campo', () => {
    const mods = effectiveStats(stats, {
      species: 'Kingdra',
      item: '',
      ability: 'Swift Swim',
      boosts: { atk: -1, spe: 1 },
      weather: 'Rain',
      tailwind: true,
    });
    expect(mods[1]?.value).toBe(97);
    expect(mods[5]).toEqual({ value: 820, notes: ['+1', 'Nado Rápido ×2', 'Tailwind ×2'] });
  });

  it('las habilidades condicionales solo cuentan si se cumplen', () => {
    expect(effectiveStats(stats, { species: 'Kingdra', item: '', ability: 'Swift Swim' }).every((m) => !m)).toBe(true);
    expect(effectiveStats(stats, { species: 'X', item: '', ability: 'Guts', status: 'brn' })[1]?.value).toBe(219);
    expect(effectiveStats(stats, { species: 'X', item: '', ability: '', status: 'par' })[5]?.value).toBe(68);
  });
});
