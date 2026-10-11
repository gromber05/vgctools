import { useMemo, useState } from 'react';
import { href, type Route, type Section } from '@/app/router';
import { activeFilterCount, applyFilters, emptyFilters, type Filters } from '@/lib/stats/filters';
import { gamesOf } from '@/state/team';
import type { AppState, Team, TeamUpdater, Updater } from '@/state/types';
import type { LoadReplays } from '@/state/useReplayLoader';
import { AddReplays } from './components/AddReplays';
import { FilterBar } from './components/FilterBar';
import { TeamHero } from './components/TeamHero';
import { GamesSection } from './sections/GamesSection';
import { MonsSection } from './sections/MonsSection';
import { Overview } from './sections/Overview';
import { RivalsSection } from './sections/RivalsSection';
import { SetsSection } from './sections/SetsSection';

const TABS: [Section, string][] = [
  ['resumen', 'Resumen'],
  ['partidas', 'Partidas'],
  ['pokemon', 'Tus Pokémon'],
  ['rivales', 'Rivales'],
  ['sets', 'Sets'],
];

interface TeamPageProps {
  state: AppState;
  team: Team;
  section: Section;
  update: Updater;
  go: (route: Route) => void;
  loading: Set<string>;
  loadReplays: LoadReplays;
}

export function TeamPage({ state, team, section, update, go, loading, loadReplays }: TeamPageProps) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [adding, setAdding] = useState(team.entries.length === 0);

  const games = useMemo(() => gamesOf(team), [team]);
  const filtered = useMemo(() => applyFilters(games, filters), [games, filters]);
  const canRead = state.names.length > 0;

  const updateTeam: TeamUpdater = (fn) =>
    update((d) => {
      const t = d.teams.find((x) => x.id === team.id);
      if (t) fn(t);
    });
  const goSection = (s: Section) => go({ page: 'team', teamId: team.id, section: s });
  /** Aplica un filtro nuevo (sustituyendo los anteriores) y lleva a la lista de partidas. */
  const filterBy = (patch: Partial<Filters>) => {
    setFilters({ ...emptyFilters, ...patch });
    goSection('partidas');
  };

  return (
    <div className="page">
      <a className="back" href={href({ page: 'teams' })}>
        ← Tus equipos
      </a>

      <TeamHero
        team={team}
        games={games}
        adding={adding}
        onToggleAdd={() => setAdding((a) => !a)}
        onRename={(name) =>
          updateTeam((t) => {
            t.name = name;
          })
        }
        onDelete={() => {
          update((d) => {
            d.teams = d.teams.filter((t) => t.id !== team.id);
          });
          go({ page: 'teams' });
        }}
        onOpenMons={() => goSection('pokemon')}
      />

      {adding && (
        <AddReplays
          team={team}
          canRead={canRead}
          onAdd={(entries) => {
            updateTeam((t) => {
              t.entries.push(...entries);
            });
            if (canRead) void loadReplays(team.id, entries);
            setAdding(false);
            goSection('partidas');
          }}
        />
      )}

      <nav className="tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <a key={key} role="tab" aria-selected={section === key} href={href({ page: 'team', teamId: team.id, section: key })}>
            {label}
            {key === 'partidas' && games.length > 0 && <span className="count">{games.length}</span>}
          </a>
        ))}
      </nav>

      {games.length > 0 && section !== 'sets' && (
        <FilterBar games={games} filters={filters} setFilters={setFilters} shown={filtered.length} />
      )}

      {section === 'resumen' && (
        <Overview games={filtered} team={team} filtered={activeFilterCount(filters) > 0} goSection={goSection} filterBy={filterBy} />
      )}
      {section === 'partidas' && (
        <GamesSection
          team={team}
          games={filtered}
          allGames={games}
          loading={loading}
          canRead={canRead}
          updateTeam={updateTeam}
          onLoad={(entries) => void loadReplays(team.id, entries)}
        />
      )}
      {section === 'pokemon' && <MonsSection team={team} games={filtered} filterBy={filterBy} />}
      {section === 'rivales' && <RivalsSection games={filtered} filterBy={filterBy} />}
      {section === 'sets' && <SetsSection team={team} games={games} updateTeam={updateTeam} />}
    </div>
  );
}
