import type { Game } from '@/lib/showdown/replay';

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
  result: '',
  oppMon: '',
  myLead: '',
  myBack: '',
  oppLead: '',
  oppBack: '',
  myMega: '',
  oppMega: '',
  ots: '',
  minElo: '',
};

export const backOf = (picks: string[], leads: string[]) => picks.filter((p) => !leads.includes(p));

const megaMatches = (filter: string, mega: string | null) => !filter || (filter === '-' ? !mega : mega === filter);

export function applyFilters(games: Game[], f: Filters): Game[] {
  const minElo = parseInt(f.minElo, 10);
  return games.filter(
    (g) =>
      (!f.result || g.result === f.result) &&
      (!f.oppMon || g.oppTeam.includes(f.oppMon)) &&
      (!f.myLead || g.myLeads.includes(f.myLead)) &&
      (!f.myBack || backOf(g.myPicks, g.myLeads).includes(f.myBack)) &&
      (!f.oppLead || g.oppLeads.includes(f.oppLead)) &&
      (!f.oppBack || backOf(g.oppPicks, g.oppLeads).includes(f.oppBack)) &&
      megaMatches(f.myMega, g.myMega) &&
      megaMatches(f.oppMega, g.oppMega) &&
      (!f.ots || (f.ots === 'yes') === g.ots) &&
      (isNaN(minElo) || (g.myElo ?? 0) >= minElo),
  );
}

export const activeFilterCount = (f: Filters) => Object.values(f).filter(Boolean).length;
