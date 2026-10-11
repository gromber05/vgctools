import { describe, expect, it } from 'vitest';
import { diffState } from './sync';
import { createTeam } from './team';
import type { AppState } from './types';

const base = (): AppState => ({ v: 3, names: ['room3roo'], teams: [createTeam('A'), createTeam('B')] });

describe('diffState', () => {
  it('no manda nada si no hay cambios', () => {
    const s = base();
    expect(diffState(s, structuredClone(s))).toEqual([]);
  });

  it('detecta nombres, equipos nuevos, editados y borrados', () => {
    const prev = base();
    const next = structuredClone(prev);
    next.names = ['room3roo', 'alt'];
    next.teams[0].name = 'A editado';
    next.teams.splice(1, 1);
    const nuevo = createTeam('C');
    next.teams.push(nuevo);

    const ops = diffState(prev, next);
    expect(ops).toContainEqual({ kind: 'names', names: ['room3roo', 'alt'] });
    expect(ops).toContainEqual({ kind: 'save', team: next.teams[0] });
    expect(ops).toContainEqual({ kind: 'save', team: nuevo });
    expect(ops).toContainEqual({ kind: 'delete', teamId: prev.teams[1].id });
    expect(ops).toHaveLength(4);
  });
});
