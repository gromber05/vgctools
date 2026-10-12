import { useState } from 'react';
import { findMove } from '@/lib/champions/data';
import type { CalcField, SideKey } from '@/lib/champions/damage';
import { optimizeSp, type Goal, type OptimizeOptions, type OptimizeOutcome, type RollLevel } from '@/lib/champions/optimizer';
import { formatSp, NATURES, natureLabel, STAT_LABEL } from '@/lib/champions/rules';
import { Segmented } from './Segmented';
import type { CalcSide } from './side';

const HITS: [number, string][] = [
  [1, 'OHKO'],
  [2, '2HKO'],
  [3, '3HKO'],
  [4, '4HKO'],
];
const ROLLS: [RollLevel, string][] = [
  ['low', 'Baja'],
  ['mid', 'Media'],
  ['high', 'Alta'],
];

interface OptimizerProps {
  me: CalcSide;
  foe: CalcSide;
  mySide: SideKey;
  field: CalcField;
  onApply: (patch: Pick<CalcSide, 'sp' | 'nature'>) => void;
}

/** Estadística que la naturaleza actual sube y la propuesta ya no. */
const lostPlus = (from: string, to: string) => {
  const plus = NATURES[from]?.[1];
  return plus !== undefined && plus !== NATURES[to]?.[1] ? STAT_LABEL[plus] : '';
};

const attackingMoves = (side: CalcSide) => side.moves.filter((m) => m && findMove(m) && findMove(m)!.category !== 'Status');

export function Optimizer({ me, foe, mySide, field, onApply }: OptimizerProps) {
  const [goal, setGoal] = useState<Goal>('survive');
  const [hits, setHits] = useState(1);
  const [roll, setRoll] = useState<RollLevel>('high');
  const [keepSp, setKeepSp] = useState(true);
  const [changeNature, setChangeNature] = useState(false);
  const [pickedMove, setPickedMove] = useState('');
  const [run, setRun] = useState<{ key: string; outcome: OptimizeOutcome }>();

  const moves = attackingMoves(goal === 'ko' ? me : foe);
  const move = moves.includes(pickedMove) ? pickedMove : (moves[0] ?? '');
  const opts: OptimizeOptions = { goal, hits, roll, keepSp, changeNature };
  const key = JSON.stringify([me, foe, field, opts, move]);
  const outcome = run?.key === key ? run.outcome : undefined;

  return (
    <div className="optimizer">
      <div className="optimizer-body">
        <div className="optimizer-line">
          <span>Gastar los mínimos SP para</span>
          <Segmented
            label="Objetivo"
            value={goal}
            options={[
              ['survive', 'Aguantar'],
              ['ko', 'Dejar KO'],
            ]}
            onChange={setGoal}
          />
        </div>
        <div className="optimizer-line">
          <span>{goal === 'ko' ? `a ${foe.species || 'el rival'} con` : `el`}</span>
          <select value={move} onChange={(e) => setPickedMove(e.target.value)} aria-label="Movimiento" disabled={!moves.length}>
            {!moves.length && <option value="">Sin movimientos de ataque</option>}
            {moves.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {goal === 'survive' && <span>de {foe.species || 'el rival'}</span>}
          <Segmented label="Golpes" value={hits} options={HITS} onChange={setHits} />
        </div>
        <div className="optimizer-line">
          <span title="Tirada de daño del atacante: baja = KO asegurado, alta = aguante asegurado">Tirada</span>
          <Segmented label="Tirada de daño" value={roll} options={ROLLS} onChange={setRoll} />
        </div>
        <div className="optimizer-line">
          <label className="check">
            <input type="checkbox" checked={keepSp} onChange={(e) => setKeepSp(e.target.checked)} /> Conservar mis SP
          </label>
          <label className="check">
            <input type="checkbox" checked={changeNature} onChange={(e) => setChangeNature(e.target.checked)} /> Permitir cambiar la
            naturaleza
          </label>
          <button
            className="primary small"
            disabled={!move}
            onClick={() => setRun({ key, outcome: optimizeSp(me, foe, move, field, mySide, opts) })}
          >
            Optimizar
          </button>
        </div>

        {outcome && !outcome.ok && <p className="error small">{outcome.reason}</p>}
        {outcome?.ok && (
          <div className="optimizer-result">
            <div>
              <b>{formatSp(outcome.best.sp) || 'Sin SP'}</b>
              <span className="muted small">
                {' · '}
                {outcome.best.delta > 0
                  ? `${outcome.best.delta} SP más`
                  : outcome.best.delta < 0
                    ? `libera ${-outcome.best.delta} SP`
                    : 'sin cambiar el total de SP'}
              </span>
            </div>
            {outcome.best.nature !== me.nature && (
              <div className="small">
                Naturaleza: {natureLabel(outcome.best.nature)}
                {lostPlus(me.nature, outcome.best.nature) && (
                  <span className="muted"> · deja de subir {lostPlus(me.nature, outcome.best.nature)}</span>
                )}
              </div>
            )}
            {outcome.best.nature === me.nature && outcome.best.sp.every((v, i) => v === me.sp[i]) && (
              <div className="small muted">Tu reparto actual ya lo consigue.</div>
            )}
            <div className="small">
              {outcome.best.result.minPct.toFixed(1)} – {outcome.best.result.maxPct.toFixed(1)}%
              {outcome.best.result.ko && ` · ${outcome.best.result.ko}`}
            </div>
            <button className="small" onClick={() => onApply({ sp: outcome.best.sp, nature: outcome.best.nature })}>
              Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
