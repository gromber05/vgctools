import { useState } from 'react';
import { Empty, ResultBadge } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import { SpriteRow } from '@/components/pokemon/SpriteRow';
import { replayIdFromUrl, type Game } from '@/lib/showdown/replay';
import { formatDate } from '@/lib/utils';
import { backOf } from '@/lib/stats/filters';
import { findAbility, findItem, findMove } from '@/lib/champions/data';
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
        <p className="warn small">
          Pon tu nombre de Showdown en <a href="#/usuario">Usuario</a> para poder leer las repeticiones.
        </p>
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
  const [open, setOpen] = useState(false);
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
        <button className="ghost small" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Ocultar ▴' : 'Detalles ▾'}
        </button>
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
      {open && <GameDetails game={g} />}
    </>
  );
}

function GameDetails({ game: g }: { game: Game }) {
  const outdated = g.kos === undefined;
  const mins = g.duration ? Math.round(g.duration / 60) : null;
  return (
    <div className="game-details">
      <p className="muted small">
        {g.format} · {g.turns} turnos{mins ? ` · ~${mins} min` : ''}
      </p>
      {outdated && <p className="warn small">Vuelve a leer esta repetición para ver los KOs y los movimientos del rival.</p>}

      {g.kos && g.kos.length > 0 && (
        <section>
          <h4>KOs</h4>
          <ol className="ko-list">
            {g.kos.map((k, i) => (
              <li key={i} className={k.mine ? 'l' : 'w'}>
                <span className="game-n">T{k.turn}</span>
                <Sprite name={k.mon} size={28} />
                <span>
                  {k.mine ? 'Cae tu' : 'Cae el'} <b>{k.mon}</b>
                  {k.by && <span className="muted"> · {k.by}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="game-teams">
        <MoveTable title="Tus movimientos" moves={g.myMoves} order={g.myPicks} />
        {g.oppMoves && <MoveTable title="Movimientos del rival" moves={g.oppMoves} order={g.oppPicks} />}
      </div>

      {g.oppSets && g.oppSets.length > 0 && (
        <section>
          <h4>Sets del rival (OTS)</h4>
          <div className="set-grid">
            {g.oppSets.map((s) => (
              <div key={s.species} className="revealed-set">
                <div className="side">
                  <Sprite name={s.species} size={32} />
                  <b>{s.species}</b>
                </div>
                <span className="muted small">
                  {findItem(s.item)?.name ?? s.item} · {findAbility(s.ability)?.name ?? s.ability}
                </span>
                <span className="small">{s.moves.map((m) => findMove(m)?.name ?? m).join(' / ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MoveTable({ title, moves, order }: { title: string; moves: Game['myMoves']; order: string[] }) {
  const mons = [...order.filter((m) => moves[m]), ...Object.keys(moves).filter((m) => !order.includes(m))];
  return (
    <section>
      <h4>{title}</h4>
      {mons.length === 0 && <p className="muted small">Ninguno registrado.</p>}
      <ul className="move-table">
        {mons.map((mon) => (
          <li key={mon}>
            <Sprite name={mon} size={28} />
            <span className="small">
              {Object.entries(moves[mon])
                .sort((a, b) => b[1] - a[1])
                .map(([m, n]) => `${m}${n > 1 ? ` ×${n}` : ''}`)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const orderOpp = (g: Game) => [...g.oppLeads, ...backOf(g.oppPicks, g.oppLeads), ...g.oppTeam.filter((s) => !g.oppPicks.includes(s))];
