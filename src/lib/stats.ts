import type { Game } from './replay';

export interface Filters {
  result: '' | 'W' | 'L';
  oppMon: string;
  myLead: string;
  myBack: string;
  oppLead: string;
  oppBack: string;
  myMega: string;
  oppMega: string;
  ots: '' | 'yes' | 'no';
  minElo: string;
}

export const emptyFilters: Filters = {
  result: '', oppMon: '', myLead: '', myBack: '', oppLead: '', oppBack: '', myMega: '', oppMega: '', ots: '', minElo: '',
};

const back = (picks: string[], leads: string[]) => picks.filter((p) => !leads.includes(p));

export function applyFilters(games: Game[], f: Filters): Game[] {
  const min = parseInt(f.minElo, 10);
  return games.filter(
    (g) =>
      (!f.result || g.result === f.result) &&
      (!f.oppMon || g.oppTeam.includes(f.oppMon)) &&
      (!f.myLead || g.myLeads.includes(f.myLead)) &&
      (!f.myBack || back(g.myPicks, g.myLeads).includes(f.myBack)) &&
      (!f.oppLead || g.oppLeads.includes(f.oppLead)) &&
      (!f.oppBack || back(g.oppPicks, g.oppLeads).includes(f.oppBack)) &&
      (!f.myMega || (f.myMega === '-' ? !g.myMega : g.myMega === f.myMega)) &&
      (!f.oppMega || (f.oppMega === '-' ? !g.oppMega : g.oppMega === f.oppMega)) &&
      (!f.ots || (f.ots === 'yes') === g.ots) &&
      (isNaN(min) || (g.myElo ?? 0) >= min),
  );
}

export const activeFilterCount = (f: Filters) => Object.values(f).filter(Boolean).length;

export const backOf = back;

export interface Rate {
  games: number;
  wins: number;
}
const rate = (gs: Game[]): Rate => ({ games: gs.length, wins: gs.filter((g) => g.result === 'W').length });

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
    const e = map.get(key) ?? { pair, games: 0, wins: 0 };
    e.games++;
    if (g.result === 'W') e.wins++;
    map.set(key, e);
  }
  return [...map.values()];
}

export function totals(games: Game[]) {
  return { all: rate(games), ots: rate(games.filter((g) => g.ots)), cts: rate(games.filter((g) => !g.ots)) };
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
/** Agrupa las partidas al mejor de 3 por serie; cada partida suelta es su propio set. */
export function groupSets(games: Game[]): SetResult[] {
  const map = new Map<string, Game[]>();
  for (const g of games) {
    const key = g.series ?? g.id;
    map.set(key, [...(map.get(key) ?? []), g]);
  }
  return [...map.entries()]
    .map(([key, gs]) => {
      gs.sort((a, b) => (a.gameNo ?? 0) - (b.gameNo ?? 0) || a.time - b.time);
      const wins = gs.filter((g) => g.result === 'W').length;
      const losses = gs.filter((g) => g.result === 'L').length;
      return { key, opp: gs[0].opp, games: gs, wins, losses, result: wins > losses ? 'W' : losses > wins ? 'L' : 'T' } as SetResult;
    })
    .sort((a, b) => a.games[0].time - b.games[0].time);
}

export function moveUsage(games: Game[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const g of games)
    for (const [mon, moves] of Object.entries(g.myMoves)) {
      const bucket = (out[mon] ??= {});
      for (const [m, n] of Object.entries(moves)) bucket[m] = (bucket[m] ?? 0) + n;
    }
  return out;
}
