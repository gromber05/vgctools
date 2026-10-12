import { Sprite } from '@/components/pokemon/Sprite';
import { TypeChips } from '@/components/pokemon/TypeChip';
import { TYPE_STYLE, typeColor } from '@/components/pokemon/typeIcons';
import { baseSpecies, battleForm, findMove } from '@/lib/champions/data';
import { hpOf, ROLL_INDEX, type DamageResult, type RollLevel } from '@/lib/champions/damage';
import { Segmented } from './Segmented';
import type { CalcSide } from './side';

const ROLLS: [RollLevel, string][] = [
  ['low', 'Baja'],
  ['mid', 'Media'],
  ['high', 'Alta'],
];

interface BattleCardProps {
  mon: CalcSide;
  /** Daño de los movimientos de este Pokémon al rival. */
  results: DamageResult[] | string;
  selected: string;
  onSelect: (move: string) => void;
  roll: RollLevel;
  onRoll: (roll: RollLevel) => void;
  /** Movimiento elegido por el rival contra este Pokémon y su tirada, para la barra de PS. */
  incoming?: DamageResult;
  incomingRoll: RollLevel;
  mirrored?: boolean;
}

export function BattleCard({ mon, results, selected, onSelect, roll, onRoll, incoming, incomingRoll, mirrored }: BattleCardProps) {
  const species = baseSpecies(mon.species);
  const form = battleForm(mon.species, mon.item);
  const shown = form?.mega && !mon.megaEvolved ? species : form?.species;
  const list = typeof results === 'string' ? [] : results;
  const active = list.find((r) => r.move === selected) ?? list[0];

  let hp = 0;
  let maxHp = 0;
  try {
    ({ hp, maxHp } = hpOf(mon));
  } catch {}
  const taken = incoming ? (incoming.rolls[ROLL_INDEX[incomingRoll]] ?? 0) : 0;
  const left = Math.max(0, hp - taken);
  const pct = maxHp ? (left / maxHp) * 100 : 0;
  const tone = pct > 50 ? 'is-high' : pct > 20 ? 'is-mid' : 'is-low';

  return (
    <section className={`card battle-card${mirrored ? ' is-mirrored' : ''}`}>
      <div className="battle-top">
        <div className="battle-mon">
          {shown ? <Sprite name={shown.name} size={72} big /> : <span className="set-slot">?</span>}
          <div className="battle-plate">
            <div className="battle-name">
              <b>{shown?.name ?? (mon.species || '—')}</b>
              {shown && <TypeChips types={shown.types} small />}
            </div>
            <div
              className={`hp-bar ${tone}`}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={maxHp}
              aria-valuenow={left}
              aria-label="PS restantes"
            >
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="hp-num">
              <b>{left}</b>/{maxHp} PS
              {incoming && taken > 0 && <span className="muted"> · tras {incoming.move}</span>}
            </div>
          </div>
        </div>

        <ul className="battle-moves">
          {typeof results === 'string' && <li className="error small">{results}</li>}
          {mon.moves.map((name, i) => {
            const data = name ? findMove(name) : undefined;
            const r = list.find((x) => x.move === name);
            const type = data?.type ?? 'Normal';
            return (
              <li key={i}>
                <button
                  type="button"
                  className={name ? 'move-pill' : 'move-pill is-empty'}
                  style={{ ['--type' as string]: typeColor(type) }}
                  aria-pressed={!!r && r.move === active?.move}
                  disabled={!r}
                  onClick={() => r && onSelect(r.move)}
                  title={data?.category === 'Status' ? 'Movimiento de estado: no hace daño' : undefined}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={TYPE_STYLE[type]?.icon ?? ''} />
                  </svg>
                  {name || 'Sin movimiento'}
                </button>
                <span className="move-pct">
                  {r && r.max === 0 ? 'Sin efecto' : r ? `${r.minPct.toFixed(1)} – ${r.maxPct.toFixed(1)}%` : '0 – 0%'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {active && (
        <div className="battle-detail">
          <div className="battle-roll">
            <span className="muted small">Tirada</span>
            <Segmented label="Tirada de daño" value={roll} options={ROLLS} onChange={onRoll} />
            {active.ko && <b className="small">{active.ko}</b>}
          </div>
          {active.max > 0 && (
            <div className="battle-rolls">
              {active.rolls.map((v, i) => (
                <span key={i} className={i === ROLL_INDEX[roll] ? 'is-picked' : undefined}>
                  {v}
                </span>
              ))}
            </div>
          )}
          {active.desc && (
            <div className="battle-desc">
              <span>{active.desc}</span>
              <button
                className="ghost small"
                onClick={() => navigator.clipboard?.writeText(active.desc).catch(() => {})}
                aria-label="Copiar cálculo"
              >
                Copiar
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
