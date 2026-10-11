import type { AppState, Team } from './types';

export type SyncOp = { kind: 'names'; names: string[] } | { kind: 'save'; team: Team } | { kind: 'delete'; teamId: string };

export function diffState(prev: AppState, next: AppState): SyncOp[] {
  const ops: SyncOp[] = [];
  if (prev.names.join('\n') !== next.names.join('\n')) ops.push({ kind: 'names', names: next.names });

  const before = new Map(prev.teams.map((t) => [t.id, t]));
  for (const team of next.teams) {
    const old = before.get(team.id);
    if (old !== team && JSON.stringify(old) !== JSON.stringify(team)) ops.push({ kind: 'save', team });
    before.delete(team.id);
  }
  for (const teamId of before.keys()) ops.push({ kind: 'delete', teamId });
  return ops;
}
