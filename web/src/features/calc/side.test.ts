import { describe, expect, it } from 'vitest';
import { battleForm } from '@/lib/champions/data';
import { calcDamage, defaultField } from '@/lib/champions/damage';
import { parsePaste } from '@/lib/showdown/paste';
import { blankSide, sideForSpecies, sideFromMon } from './side';

describe('Megas en la calculadora', () => {
  it('elegir la Mega por nombre pone su piedra y usa sus estadísticas', () => {
    const side = sideForSpecies('Garchomp-Mega-Z');
    expect(side.species).toBe('Garchomp');
    expect(side.item).toBe('Garchompite Z');
    expect(battleForm(side.species, side.item)?.species.name).toBe('Garchomp-Mega-Z');
  });

  it('un set pegado con Megapiedra calcula con la Mega', () => {
    const [mon] = parsePaste('Froslass-Mega @ Froslassite\nAbility: Snow Cloak\nEVs: 32 SpA / 32 Spe\nModest Nature\n- Blizzard');
    const side = sideFromMon(mon);
    expect(side.species).toBe('Froslass');
    const [hit] = calcDamage(side, blankSide('Incineroar'), side.moves, defaultField);
    expect(hit.desc).toContain('Froslass-Mega');
    const [plain] = calcDamage({ ...side, megaEvolved: false }, blankSide('Incineroar'), side.moves, defaultField);
    expect(hit.max).toBeGreaterThan(plain.max);
  });

  it('cambiar de especie conserva los movimientos que puede aprender', () => {
    const before = { ...blankSide('Incineroar'), moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'Parting Shot'] };
    expect(sideForSpecies('Charizard-Mega-Y', before).moves.filter(Boolean)).not.toContain('Darkest Lariat');
  });
});
