import { Empty, ResultBadge } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import { SpriteRow } from '@/components/pokemon/SpriteRow';
import { replayIdFromUrl, type Game } from '@/lib/showdown/replay';
import { formatDate } from '@/lib/utils';
import { backOf } from '@/lib/stats/filters';
import type { Entry, Team, TeamUpdater } from '@/state/types';

interface Props {
  team: Team;
  games: Game[];
  allGames: Game[];
  loading: Set<string>;
  canRead: boolean;
  updateTeam: TeamUpdater;
  onLoad: (entries: Pick<Entry, 'id' | 'url'>[]) => void;
}

export function GamesSection({ team, games, allGames, loading, canRead, updateTeam, onLoad }: Props) {
  const filtered = games.length !== allGames.length;
  const shownIds = new Set(games.map((g) => g.id));
  // Sin filtros se ven también las pendientes y las que fallaron; con filtros, solo las partidas que cumplen.
  const rows = team.entries
    .map((e, i) => ({ e, n: i + 1 }))
    .filter(({ e }) => (e.game ? shownIds.has(e.game.id) : !filtered))
    .reverse();
  const pending = team.entries.filter((e) => !e.game && !loading.has(e.id));

  return (
    <div className="games">
      <div className="toolbar">
        <span className="muted small">
          {filtered ? `${games.length} de ${allGames.length} partidas` : `${team.entries.length} repeticiones`} · las más recientes arriba
        </span>
        <div className="toolbar-actions">
          {pending.length > 0 && (
            <button onClick={() => onLoad(pending)} disabled={!canRead}>
              Leer pendientes ({pending.length})
            </button>
          )}
          {team.entries.length > 0 && (
            <button className="ghost" onClick={() => onLoad(team.entries)} disabled={!canRead}>
              Volver a leer todas
            </button>
          )}
        </div>
      </div>
      {!canRead && team.entries.length > 0 && (
        <p className="warn small">Pon tu nombre de Showdown arriba a la derecha para poder leer las repeticiones.</p>
      )}

      {rows.length === 0 && <Empty title={filtered ? 'Ninguna partida cumple los filtros' : 'Todavía no hay repeticiones'} />}

      <ol className="game-list">
        {rows.map(({ e, n }) => (
          <li key={e.id} className={`game ${e.game ? `res-${e.game.result}` : 'pending'}`}>
            {e.game ? (
              <GameCard game={e.game} n={n} />
            ) : (
              <div className="game-head">
                <span className="game-n">#{n}</span>
                <a href={e.url} target="_blank" rel="noreferrer" className="mono small">
                  {replayIdFromUrl(e.url)}
                </a>
                <span className={e.error ? 'error small' : 'muted small'}>
                  {loading.has(e.id) ? 'Leyendo…' : (e.error ?? 'Pendiente de leer')}
                </span>
              </div>
            )}
            <div className="game-foot">
              <input
                className="note"
                aria-label={`Notas de la partida ${n}`}
                placeholder="Notas: qué pasó, qué cambiar…"
                value={e.note}
                onChange={(ev) => {
                  const v = ev.target.value;
                  updateTeam((t) => {
                    const x = t.entries.find((y) => y.id === e.id);
                    if (x) x.note = v;
                  });
                }}
              />
              <button
                className="ghost small"
                onClick={() =>
                  updateTeam((t) => {
                    t.entries = t.entries.filter((y) => y.id !== e.id);
                  })
                }
                aria-label={`Quitar partida ${n}`}
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GameCard({ game: g, n }: { game: Game; n: number }) {
  const eloDelta = g.myElo != null && g.myEloAfter != null ? g.myEloAfter - g.myElo : null;
  return (
    <>
      <div className="game-head">
        <span className="game-n">#{n}</span>
        <ResultBadge result={g.result} />
        <span className="game-opp">
          vs <b>{g.opp}</b>
          {g.oppElo ? <span className="muted"> ({g.oppElo})</span> : null}
        </span>
        {g.gameNo && <span className="chip">Bo3 · G{g.gameNo}</span>}
        {g.ots && <span className="chip">OTS</span>}
        <span className="grow" />
        {g.myElo != null && (
          <span className="elo-delta">
            ELO {g.myElo}
            {g.myEloAfter != null && (
              <>
                {' '}
                → {g.myEloAfter}{' '}
                <b className={eloDelta! >= 0 ? 'w' : 'l'}>
                  {eloDelta! >= 0 ? '+' : ''}
                  {eloDelta}
                </b>
              </>
            )}
          </span>
        )}
        <span className="muted small">{formatDate(g.time)}</span>
        <a href={`https://replay.pokemonshowdown.com/${g.id}`} target="_blank" rel="noreferrer">
          Replay
        </a>
      </div>
      <div className="game-teams">
        <div className="side">
          <span className="side-label">Tú</span>
          <SpriteRow names={[...g.myLeads, ...backOf(g.myPicks, g.myLeads)]} lead={g.myLeads} size={44} />
          {g.myMega && (
            <span className="mega" title={`Mega ${g.myMega}`}>
              <Sprite name={g.myMega} size={22} /> Mega
            </span>
          )}
        </div>
        <div className="side">
          <span className="side-label">Rival</span>
          <SpriteRow names={orderOpp(g)} active={g.oppPicks} lead={g.oppLeads} size={44} />
          {g.oppMega && (
            <span className="mega" title={`Mega ${g.oppMega}`}>
              <Sprite name={g.oppMega} size={22} /> Mega
            </span>
          )}
        </div>
      </div>
    </>
  );
}

/** Equipo rival: primero sus leads, luego los que sacó atrás, luego los que se quedaron fuera. */
const orderOpp = (g: Game) => [...g.oppLeads, ...backOf(g.oppPicks, g.oppLeads), ...g.oppTeam.filter((s) => !g.oppPicks.includes(s))];
