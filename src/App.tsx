import { useCallback, useMemo, useState } from 'react';
import { fetchReplay, parseReplay, type Game } from './lib/replay';
import { activeFilterCount, applyFilters, emptyFilters, type Filters } from './lib/stats';
import { useAppState, type Entry } from './lib/storage';
import { pct } from './lib/util';
import { Games } from './sheets/Games';
import { Home } from './sheets/Home';
import { Matchups } from './sheets/Matchups';
import { Moves } from './sheets/Moves';
import { Replays } from './sheets/Replays';
import { Sets } from './sheets/Sets';
import { Usage } from './sheets/Usage';

const TABS = [
  ['home', 'Inicio'],
  ['replays', 'Replays'],
  ['games', 'Partida a partida'],
  ['sets', 'Sets'],
  ['usage', 'Uso'],
  ['matchups', 'Matchups'],
  ['moves', 'Movimientos'],
] as const;
type Tab = (typeof TABS)[number][0];

const CONCURRENCY = 4;

export default function App() {
  const [state, update] = useAppState();
  const [tab, setTab] = useState<Tab>(() => (state.entries.length ? 'games' : 'home'));
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const games = useMemo(() => state.entries.map((e) => e.game).filter((g): g is Game => !!g), [state.entries]);
  const filtered = useMemo(() => applyFilters(games, filters), [games, filters]);
  const nFilters = activeFilterCount(filters);
  const filterNote = nFilters ? `Hay ${nFilters} filtro${nFilters > 1 ? 's' : ''} activo${nFilters > 1 ? 's' : ''}: ${filtered.length} de ${games.length} partidas.` : '';

  const loadEntries = useCallback(
    async (list: Pick<Entry, 'id' | 'url'>[]) => {
      const names = state.names;
      const queue = [...list];
      setLoading((l) => new Set([...l, ...list.map((e) => e.id)]));
      const worker = async () => {
        for (let e = queue.shift(); e; e = queue.shift()) {
          const entry = e;
          try {
            const game = parseReplay(await fetchReplay(entry.url), names);
            update((d) => {
              const t = d.entries.find((x) => x.id === entry.id);
              if (t) { t.game = game; delete t.error; }
            });
          } catch (err) {
            update((d) => {
              const t = d.entries.find((x) => x.id === entry.id);
              if (t) { t.error = (err as Error).message || 'No se pudo leer.'; delete t.game; }
            });
          }
          setLoading((l) => { const n = new Set(l); n.delete(entry.id); return n; });
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    },
    [state.names, update],
  );

  const wins = games.filter((g) => g.result === 'W').length;

  return (
    <div className="app">
      <header className="docbar">
        <div className="doc-icon" aria-hidden="true">VGC</div>
        <div className="doc-meta">
          <div className="doc-title">Laboratorio VGC</div>
          <div className="doc-sub">{state.names.length ? state.names.join(', ') : 'Sin nombre de Showdown'} · {games.length} partidas · {wins}–{games.length - wins} · {pct(wins, games.length)}</div>
        </div>
        {loading.size > 0 && <div className="doc-status">Leyendo {loading.size} repeticiones…</div>}
      </header>
      <div className="formula-bar">
        <span className="fx">fx</span>
        <span className="formula">{TABS.find(([k]) => k === tab)?.[1]}{nFilters && ['games', 'usage', 'matchups', 'moves'].includes(tab) ? ` · ${filtered.length} de ${games.length} partidas (filtrado)` : ''}</span>
      </div>

      <main className="sheet">
        {tab === 'home' && <Home state={state} update={update} games={games} goTo={(t) => setTab(t as Tab)} />}
        {tab === 'replays' && <Replays state={state} update={update} loading={loading} onLoad={loadEntries} />}
        {tab === 'games' && <Games games={games} filters={filters} setFilters={setFilters} />}
        {tab === 'sets' && <Sets games={games} state={state} update={update} />}
        {tab === 'usage' && <Usage games={filtered} team={state.team.map((m) => m.species)} filterNote={filterNote} />}
        {tab === 'matchups' && <Matchups games={filtered} filterNote={filterNote} />}
        {tab === 'moves' && <Moves games={filtered} team={state.team} filterNote={filterNote} />}
      </main>

      <nav className="sheet-tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
