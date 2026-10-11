import { describe, expect, it } from 'vitest';
import sample from '@/lib/showdown/__fixtures__/replay-sample.json';
import { parseReplay, type ReplayJSON } from '@/lib/showdown/replay';
import { groupSets, leadPairs, moveUsage, opponentMons, usageByMon } from './aggregates';
import { applyFilters, emptyFilters } from './filters';

const g = parseReplay(sample as ReplayJSON, ['room3roo']);

describe('estadísticas', () => {
  it('uso de tus Pokémon', () => {
    const garchomp = usageByMon([g], [])?.find((m) => m.species === 'Garchomp');
    expect(garchomp?.mega).toEqual({ games: 1, wins: 1 });
    expect(garchomp?.lead.games).toBe(0);
  });

  it('parejas de leads', () => {
    expect(leadPairs([g])).toEqual([{ pair: ['Rillaboom', 'Sneasler'], games: 1, wins: 1 }]);
  });

  it('rivales vistos y llevados', () => {
    const rivals = opponentMons([g]);
    expect(rivals.find((m) => m.species === 'Pelipper')?.brought.games).toBe(1);
    expect(rivals.find((m) => m.species === 'Rillaboom')?.brought.games).toBe(0);
  });

  it('sets y movimientos', () => {
    expect(groupSets([g])[0]).toMatchObject({ result: 'W', wins: 1, losses: 0 });
    expect(moveUsage([g, g]).Sneasler['Close Combat']).toBe(6);
  });
});

describe('filtros', () => {
  it('filtran por rival, lead y Mega', () => {
    expect(applyFilters([g], { ...emptyFilters, oppMon: 'Pelipper' })).toHaveLength(1);
    expect(applyFilters([g], { ...emptyFilters, myLead: 'Garchomp' })).toHaveLength(0);
    expect(applyFilters([g], { ...emptyFilters, myMega: '-' })).toHaveLength(0);
    expect(applyFilters([g], { ...emptyFilters, minElo: '1100' })).toHaveLength(0);
  });
});
