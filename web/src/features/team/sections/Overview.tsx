import { Card, Empty, ResultBadge, StatTile, WinMeter } from '@/components/ui';
import { EloChart } from '../components/EloChart';
import { Sprite } from '@/components/pokemon/Sprite';
import { SpriteRow } from '@/components/pokemon/SpriteRow';
import type { Game } from '@/lib/showdown/replay';
import type { Section } from '@/app/router';
import { groupSets, leadPairs, opponentMons, totals, usageByMon } from '@/lib/stats/aggregates';
import type { Filters } from '@/lib/stats/filters';
import type { Team } from '@/state/types';
import { pct } from '@/lib/utils';

interface Props {
  games: Game[];
  team: Team;
  filtered: boolean;
  goSection: (s: Section) => void;
  filterBy: (f: Partial<Filters>) => void;
}

export function Overview({ games, team, filtered, goSection, filterBy }: Props) {
  if (!games.length) {
    return filtered ? (
      <Empty title="Ninguna partida cumple los filtros" />
    ) : (
      <Empty title="Todavía no hay partidas">Pulsa «Añadir repeticiones» y pega tus enlaces de Showdown.</Empty>
    );
  }
  const t = totals(games);
  const sets = groupSets(games);
  const setWins = sets.filter((s) => s.result === 'W').length;
  const lastElo = [...games].reverse().find((g) => g.myEloAfter ?? g.myElo);
  const mons = usageByMon(
    games,
    team.mons.map((m) => m.species),
  );
  const pairs = leadPairs(games);
  const common = [...pairs].sort((a, b) => b.games - a.games || b.wins - a.wins).slice(0, 4);
  const rivals = opponentMons(games).filter((m) => m.seen.games >= 2);
  const rate = (m: { seen: { wins: number; games: number } }) => m.seen.wins / m.seen.games;
  const worst = [...rivals].sort((a, b) => rate(a) - rate(b) || b.seen.games - a.seen.games).slice(0, 4);
  const recent = [...games].slice(-5).reverse();

  return (
    <div className="overview">
      <div className="tiles">
        <StatTile label="Win%" value={pct(t.all.wins, t.all.games)} sub={`${t.all.wins}–${t.all.games - t.all.wins} en partidas`} />
        <StatTile label="Sets" value={`${setWins}–${sets.length - setWins}`} sub={pct(setWins, sets.length)} />
        <StatTile label="Con OTS" value={pct(t.ots.wins, t.ots.games)} sub={`${t.ots.games} partidas`} />
        <StatTile label="Sin OTS" value={pct(t.cts.wins, t.cts.games)} sub={`${t.cts.games} partidas`} />
        <StatTile
          label="ELO actual"
          value={lastElo ? (lastElo.myEloAfter ?? lastElo.myElo) : '–'}
          sub={lastElo ? `vs ${lastElo.opp}` : 'sin partidas puntuadas'}
        />
      </div>

      <div className="two">
        <Card title="ELO">
          <EloChart games={games} />
        </Card>
        <Card
          title="Últimas partidas"
          action={
            <button className="link-btn" onClick={() => goSection('partidas')}>
              Ver todas
            </button>
          }
        >
          <ul className="recent">
            {recent.map((g) => (
              <li key={g.id}>
                <ResultBadge result={g.result} short />
                <span className="recent-opp">vs {g.opp}</span>
                <SpriteRow names={g.oppTeam} size={30} active={g.oppPicks} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="two">
        <Card
          title="Tus Pokémon"
          action={
            <button className="link-btn" onClick={() => goSection('pokemon')}>
              Detalle
            </button>
          }
        >
          <ul className="mon-meters">
            {mons.map((m) => (
              <li key={m.species}>
                <Sprite name={m.species} size={40} />
                <div className="grow">
                  <div className="row-between">
                    <b>{m.species}</b>
                    <span className="muted small">llevado en {pct(m.brought.games, games.length)}</span>
                  </div>
                  <WinMeter wins={m.brought.wins} games={m.brought.games} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="stack">
          <Card title="Leads más usados">
            {common.length ? (
              <ul className="pairs">
                {common.map((p) => (
                  <li key={p.pair.join()}>
                    <button className="pair" onClick={() => filterBy({ myLead: p.pair[0] })} title="Ver partidas con este lead">
                      <SpriteRow names={p.pair} size={40} />
                    </button>
                    <WinMeter wins={p.wins} games={p.games} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Sin datos.</p>
            )}
          </Card>
          <Card
            title="Rivales que más te cuestan"
            action={
              <button className="link-btn" onClick={() => goSection('rivales')}>
                Todos
              </button>
            }
          >
            {worst.length ? (
              <ul className="pairs">
                {worst.map((m) => (
                  <li key={m.species}>
                    <button className="pair" onClick={() => filterBy({ oppMon: m.species })} title={`Ver partidas contra ${m.species}`}>
                      <Sprite name={m.species} size={40} /> <span>{m.species}</span>
                    </button>
                    <WinMeter wins={m.seen.wins} games={m.seen.games} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Aparecen cuando un Pokémon rival sale en 2 partidas o más.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
