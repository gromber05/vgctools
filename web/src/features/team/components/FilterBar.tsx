import type { Game } from '@/lib/showdown/replay';
import { activeFilterCount, backOf, emptyFilters, type Filters } from '@/lib/stats/filters';

const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();

interface Props {
  games: Game[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  shown: number;
}

export function FilterBar({ games, filters, setFilters, shown }: Props) {
  const n = activeFilterCount(filters);
  const set = (k: keyof Filters) => (v: string) => setFilters({ ...filters, [k]: v });

  const pick = (k: keyof Filters, label: string, options: (string | [string, string])[]) => (
    <label className={filters[k] ? 'chip-select on' : 'chip-select'}>
      <span>{label}</span>
      <select value={filters[k]} onChange={(e) => set(k)(e.target.value)} aria-label={label}>
        <option value="">Todos</option>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );

  return (
    <div className="filterbar">
      {pick('result', 'Resultado', [
        ['W', 'Victorias'],
        ['L', 'Derrotas'],
      ])}
      {pick('oppMon', 'Rival tiene', uniq(games.flatMap((g) => g.oppTeam)))}
      {pick('myLead', 'Tu lead', uniq(games.flatMap((g) => g.myLeads)))}
      {pick('myBack', 'Tu atrás', uniq(games.flatMap((g) => backOf(g.myPicks, g.myLeads))))}
      {pick('oppLead', 'Su lead', uniq(games.flatMap((g) => g.oppLeads)))}
      {pick('oppBack', 'Su atrás', uniq(games.flatMap((g) => backOf(g.oppPicks, g.oppLeads))))}
      {pick('myMega', 'Tu Mega', [['-', 'Sin Mega'], ...uniq(games.map((g) => g.myMega))])}
      {pick('oppMega', 'Su Mega', [['-', 'Sin Mega'], ...uniq(games.map((g) => g.oppMega))])}
      {pick('ots', 'OTS', [
        ['yes', 'Sí'],
        ['no', 'No'],
      ])}
      <label className={filters.minElo ? 'chip-select on' : 'chip-select'}>
        <span>ELO mín.</span>
        <input
          id="min-elo"
          inputMode="numeric"
          value={filters.minElo}
          onChange={(e) => set('minElo')(e.target.value.replace(/\D/g, ''))}
          placeholder="—"
        />
      </label>
      {n > 0 && (
        <>
          <span className="filter-count">
            {shown} de {games.length} partidas
          </span>
          <button className="link-btn" onClick={() => setFilters(emptyFilters)}>
            Quitar filtros
          </button>
        </>
      )}
    </div>
  );
}
