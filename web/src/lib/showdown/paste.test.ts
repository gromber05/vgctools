import { describe, expect, it } from 'vitest';
import { parsePaste } from './paste';

describe('parsePaste', () => {
  const team = parsePaste(
    'Tanque (Metagross-Mega) (M) @ Metagrossite\nAbility: Tough Claws\nEVs: 17 HP / 5 Atk / 26 Spe\nAdamant Nature\n- Iron Head\n- Protect\n\nIncineroar @ Sitrus Berry\n- Fake Out',
  );

  it('quita género y formas Mega y guarda el apodo', () => {
    expect(team.map((m) => m.species)).toEqual(['Metagross', 'Incineroar']);
    expect(team[0].nickname).toBe('Tanque');
    expect(team[1].nickname).toBe('');
  });

  it('lee objeto, habilidad, naturaleza, puntos y movimientos', () => {
    expect(team[0]).toMatchObject({
      item: 'Metagrossite',
      ability: 'Tough Claws',
      nature: 'Adamant',
      evs: '17 HP / 5 Atk / 26 Spe',
      moves: ['Iron Head', 'Protect'],
    });
  });
});
