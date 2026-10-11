import type { Game } from '@/lib/showdown/replay';

export interface Rate {
  games: number;
  wins: number;
}

const rate = (games: Game[]): Rate => ({ games: games.length, wins: games.filter((g) => g.result === 'W').length });

export const winRatio = (r: Rate) => (r.games ? r.wins / r.games : 0);

export function totals(games: Game[]) {
  return {
    all: rate(games),
    ots: rate(games.filter((g) => g.ots)),
    cts: rate(games.filter((g) => !g.ots)),
  };
}

export interface MonUsage {
  species: string;
  brought: Rate;
  lead: Rate;
  mega: Rate;
}

export function usageByMon(games: Game[], team: string[]): MonUsage[] {
  const species = [...new Set([...team, ...games.flatMap((g) => g.myTeam)])];
  return species.map((s) => ({
    species: s,
    brought: rate(games.filter((g) => g.myPicks.includes(s))),
    lead: rate(games.filter((g) => g.myLeads.includes(s))),
    mega: rate(games.filter((g) => g.myMega === s)),
  }));
}

export interface LeadPair extends Rate {
  pair: string[];
}

export function leadPairs(games: Game[]): LeadPair[] {
  const map = new Map<string, LeadPair>();
  for (const g of games) {
    if (g.myLeads.length < 2) continue;
    const pair = [...g.myLeads].sort();
    const key = pair.join('|');
    const entry = map.get(key) ?? { pair, games: 0, wins: 0 };
    entry.games++;
    if (g.result === 'W') entry.wins++;
    map.set(key, entry);
  }
  return [...map.values()];
}

export interface OppMon {
  species: string;
  seen: Rate;
  brought: Rate;
  lead: Rate;
}

export function opponentMons(games: Game[]): OppMon[] {
  const species = [...new Set(games.flatMap((g) => g.oppTeam))];
  return species.map((s) => ({
    species: s,
    seen: rate(games.filter((g) => g.oppTeam.includes(s))),
    brought: rate(games.filter((g) => g.oppPicks.includes(s))),
    lead: rate(games.filter((g) => g.oppLeads.includes(s))),
  }));
}

export interface SetResult {
  key: string;
  opp: string;
  games: Game[];
  wins: number;
  losses: number;
  result: 'W' | 'L' | 'T';
}

export function groupSets(games: Game[]): SetResult[] {
  const map = new Map<string, Game[]>();
  for (const g of games) {
    const key = g.series ?? g.id;
    map.set(key, [...(map.get(key) ?? []), g]);
  }
  return [...map.entries()]
    .map(([key, gs]): SetResult => {
      gs.sort((a, b) => (a.gameNo ?? 0) - (b.gameNo ?? 0) || a.time - b.time);
      const wins = gs.filter((g) => g.result === 'W').length;
      const losses = gs.filter((g) => g.result === 'L').length;
      return { key, opp: gs[0].opp, games: gs, wins, losses, result: wins > losses ? 'W' : losses > wins ? 'L' : 'T' };
    })
    .sort((a, b) => a.games[0].time - b.games[0].time);
}

export function moveUsage(games: Game[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const g of games) {
    for (const [mon, moves] of Object.entries(g.myMoves)) {
      const bucket = (out[mon] ??= {});
      for (const [move, n] of Object.entries(moves)) bucket[move] = (bucket[move] ?? 0) + n;
    }
  }
  return out;
}
