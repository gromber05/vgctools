import { describe, expect, it } from 'vitest';
import sample from './__fixtures__/replay-sample.json';
import { parseReplay, replayIdFromUrl, type ReplayJSON } from './replay';

const replay = sample as ReplayJSON;

describe('replayIdFromUrl', () => {
  it('acepta enlaces con y sin parámetros', () => {
    expect(replayIdFromUrl('https://replay.pokemonshowdown.com/gen9championsvgc2026regmcbo3-2696334940')).toBe(
      'gen9championsvgc2026regmcbo3-2696334940',
    );
    expect(replayIdFromUrl('https://replay.pokemonshowdown.com/gen9championsvgc2026regmcbo3-2696334940?p2')).toBe(
      'gen9championsvgc2026regmcbo3-2696334940',
    );
    expect(replayIdFromUrl('https://replay.pokemonshowdown.com/gen9vgc2025regi-123-abcdefpw')).toBe('gen9vgc2025regi-123-abcdefpw');
    expect(replayIdFromUrl('hola')).toBeNull();
  });
});

describe('parseReplay', () => {
  const g = parseReplay(replay, ['room3roo']);

  it('detecta jugador, rival y resultado', () => {
    expect(g.me).toBe('room3roo');
    expect(g.opp).toBe('Hiboy662');
    expect(g.result).toBe('W');
  });

  it('lee equipos, leads, picks y megas', () => {
    expect(g.myTeam).toEqual(['Incineroar', 'Rillaboom', 'Metagross', 'Volcarona', 'Garchomp', 'Sneasler']);
    expect(g.myLeads).toEqual(['Rillaboom', 'Sneasler']);
    expect(g.myPicks).toEqual(['Rillaboom', 'Sneasler', 'Volcarona', 'Garchomp']);
    expect(g.oppLeads).toEqual(['Golisopod', 'Tyranitar']);
    expect(g.myMega).toBe('Garchomp');
    expect(g.oppMega).toBe('Golisopod');
  });

  it('lee OTS, ELO y la serie al mejor de 3', () => {
    expect(g.ots).toBe(true);
    expect(g.myElo).toBe(1007);
    expect(g.myEloAfter).toBe(1045);
    expect(g.oppElo).toBe(1000);
    expect(g.gameNo).toBe(1);
    expect(g.series).toBe('gen9championsvgc2026regmcbo3-2696334939');
  });

  it('cuenta los movimientos propios', () => {
    expect(g.myMoves.Sneasler['Close Combat']).toBe(3);
    expect(g.myMoves.Garchomp.Flamethrower).toBe(1);
  });

  it('da un error claro si tu nombre no está', () => {
    expect(() => parseReplay(replay, ['otro'])).toThrow(/No encuentro tu nombre/);
  });
});
