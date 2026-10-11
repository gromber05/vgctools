import { SpriteRow } from '@/components/pokemon/SpriteRow';
import { gamesOf } from '@/state/team';
import type { Team } from '@/state/types';
import { formatDate, pct } from '@/lib/utils';

export function TeamCard({ team, onOpen }: { team: Team; onOpen: () => void }) {
  const games = gamesOf(team);
  const wins = games.filter((g) => g.result === 'W').length;
  const last = games.reduce((max, g) => Math.max(max, g.time), 0);

  return (
    <button className="team-card" onClick={onOpen}>
      <div className="team-card-sprites">
        <SpriteRow names={team.mons.map((m) => m.species)} size={56} />
      </div>
      <div className="team-card-body">
        <div className="team-card-name">{team.name}</div>
        <div className="team-card-stats">
          {games.length ? (
            <>
              <span className="record">
                <b className="w">{wins}</b>–<b className="l">{games.length - wins}</b>
              </span>
              <span>{pct(wins, games.length)}</span>
              <span className="muted">{games.length} partidas</span>
              {last > 0 && <span className="muted">· última {formatDate(last)}</span>}
            </>
          ) : (
            <span className="muted">Sin partidas todavía</span>
          )}
        </div>
      </div>
    </button>
  );
}
