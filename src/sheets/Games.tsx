import { Empty, FilterSelect, ResultCell, Sprites } from '../components/ui';
import type { Game } from '../lib/replay';
import { activeFilterCount, applyFilters, backOf, emptyFilters, type Filters } from '../lib/stats';

const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort().map((x): [string, string] => [x, x]);

export function FiltersBar({ games, filters, setFilters }: { games: Game[]; filters: Filters; setFilters: (f: Filters) => void }) {
  const set = (k: keyof Filters) => (v: string) => setFilters({ ...filters, [k]: v });
  const n = activeFilterCount(filters);
  return (
    <div className="filters">
      <div className="fbox">
        <FilterSelect label="Resultado" value={filters.result} options={[['W', 'Victoria'], ['L', 'Derrota']]} onChange={set('result')} />
        <FilterSelect label="Pokémon rival" value={filters.oppMon} options={uniq(games.flatMap((g) => g.oppTeam))} onChange={set('oppMon')} />
      </div>
      <div className="fbox">
        <div className="fbox-title">Tú</div>
        <FilterSelect label="Lead" value={filters.myLead} options={uniq(games.flatMap((g) => g.myLeads))} onChange={set('myLead')} />
        <FilterSelect label="Atrás" value={filters.myBack} options={uniq(games.flatMap((g) => backOf(g.myPicks, g.myLeads)))} onChange={set('myBack')} />
      </div>
      <div className="fbox">
        <div className="fbox-title">Rival</div>
        <FilterSelect label="Lead" value={filters.oppLead} options={uniq(games.flatMap((g) => g.oppLeads))} onChange={set('oppLead')} />
        <FilterSelect label="Atrás" value={filters.oppBack} options={uniq(games.flatMap((g) => backOf(g.oppPicks, g.oppLeads)))} onChange={set('oppBack')} />
      </div>
      <div className="fbox">
        <div className="fbox-title">Mega</div>
        <FilterSelect label="Tú" value={filters.myMega} options={[['-', 'Sin Mega'], ...uniq(games.map((g) => g.myMega))]} onChange={set('myMega')} />
        <FilterSelect label="Rival" value={filters.oppMega} options={[['-', 'Sin Mega'], ...uniq(games.map((g) => g.oppMega))]} onChange={set('oppMega')} />
      </div>
      <div className="fbox">
        <FilterSelect label="OTS" value={filters.ots} options={[['yes', 'Sí'], ['no', 'No']]} onChange={set('ots')} />
        <label className="filter">
          <span>ELO mín.</span>
          <input id="min-elo" inputMode="numeric" value={filters.minElo} onChange={(e) => set('minElo')(e.target.value.replace(/\D/g, ''))} placeholder="-cualquiera-" className={filters.minElo ? 'on' : ''} />
        </label>
      </div>
      {n > 0 && <button className="ghost small" onClick={() => setFilters(emptyFilters)}>Quitar filtros ({n})</button>}
    </div>
  );
}

export function Games({ games, filters, setFilters }: { games: Game[]; filters: Filters; setFilters: (f: Filters) => void }) {
  if (!games.length) return <Empty>Aún no hay partidas leídas. Añade repeticiones en la pestaña Replays.</Empty>;
  const shown = applyFilters(games, filters);
  return (
    <div className="sheet-grid">
      <FiltersBar games={games} filters={filters} setFilters={setFilters} />
      <div className="table-wrap">
        <table className="grid games">
          <thead>
            <tr>
              <th className="rownum">Partida</th>
              <th>Resultado</th>
              <th></th>
              <th>Rival</th>
              <th>Replay</th>
              <th>Equipo rival</th>
              <th>Tus picks</th>
              <th>Sus picks</th>
              <th>Mega tú</th>
              <th>Mega rival</th>
              <th>OTS</th>
              <th>ELO tú</th>
              <th>ELO rival</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => (
              <tr key={g.id}>
                <td className="rownum">{games.indexOf(g) + 1}</td>
                <ResultCell result={g.result} />
                <td className="muted">vs</td>
                <td>{g.opp}</td>
                <td><a href={`https://replay.pokemonshowdown.com/${g.id}`} target="_blank" rel="noreferrer">Replay</a></td>
                <td className="team-opp"><Sprites names={g.oppTeam} size={32} mark={g.oppPicks} /></td>
                <td className="team-mine"><Sprites names={[...g.myLeads, ...backOf(g.myPicks, g.myLeads)]} size={32} mark={g.myLeads} /></td>
                <td className="team-theirs"><Sprites names={[...g.oppLeads, ...backOf(g.oppPicks, g.oppLeads)]} size={32} mark={g.oppLeads} /></td>
                <td>{g.myMega ? <Sprites names={[g.myMega]} size={32} /> : <span className="muted">–</span>}</td>
                <td>{g.oppMega ? <Sprites names={[g.oppMega]} size={32} /> : <span className="muted">–</span>}</td>
                <td className="center">{g.ots ? 'Sí' : 'No'}</td>
                <td className={`num ${g.myEloAfter && g.myElo ? (g.myEloAfter >= g.myElo ? 'elo-up' : 'elo-down') : ''}`}>
                  {g.myElo ?? '–'}{g.myEloAfter ? ` → ${g.myEloAfter}` : ''}
                </td>
                <td className="num">{g.oppElo ?? '–'}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={13} className="muted center">Ninguna partida cumple los filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="hint">En «Equipo rival» se marcan los que llevó. En los picks, los dos primeros (marcados) son los leads.</p>
    </div>
  );
}
