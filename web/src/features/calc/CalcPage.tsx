import { useEffect, useMemo, useState } from 'react';
import { DataLists } from '@/components/pokemon/DataLists';
import {
  calcDamage,
  defaultField,
  finalSpeeds,
  type CalcField,
  type DamageResult,
  type RollLevel,
  type SideKey,
  type Terrain,
  type Weather,
} from '@/lib/champions/damage';
import { useConsent } from '@/state/consent';
import type { Team } from '@/state/types';
import { BattleCard } from './BattleCard';
import { FieldPanel } from './FieldPanel';
import { MonPanel } from './MonPanel';
import { blankSide, CALC_SPECIES, type CalcSide } from './side';
import { loadCalc, saveCalc } from './storage';

const exampleAttacker = (): CalcSide => ({
  ...blankSide('Garchomp'),
  nature: 'Jolly',
  ability: 'Rough Skin',
  sp: [2, 32, 0, 0, 0, 32],
  moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'],
});
const exampleDefender = (): CalcSide => ({
  ...blankSide('Incineroar'),
  item: 'Sitrus Berry',
  ability: 'Intimidate',
  nature: 'Careful',
  sp: [32, 0, 10, 0, 22, 2],
  moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'Parting Shot'],
});

export function CalcPage({ teams }: { teams: Team[] }) {
  const [saved] = useState(loadCalc);
  const [left, setLeft] = useState<CalcSide>(() => saved.left ?? exampleAttacker());
  const [right, setRight] = useState<CalcSide>(() => saved.right ?? exampleDefender());
  const [field, setField] = useState<CalcField>(() => saved.field ?? defaultField);
  const consent = useConsent();

  useEffect(() => {
    if (consent === 'accepted') saveCalc({ left, right, field });
  }, [consent, left, right, field]);

  const results = useMemo(() => {
    const safe = (a: CalcSide, b: CalcSide, from: SideKey): DamageResult[] | string => {
      try {
        return calcDamage(a, b, a.moves.filter(Boolean), field, from);
      } catch {
        return 'Revisa los datos: algún Pokémon, objeto o movimiento no es válido.';
      }
    };
    return { leftToRight: safe(left, right, 'left'), rightToLeft: safe(right, left, 'right') };
  }, [left, right, field]);

  const speed = useMemo(() => {
    try {
      return finalSpeeds(left, right, field);
    } catch {
      return undefined;
    }
  }, [left, right, field]);

  const [picked, setPicked] = useState<Record<SideKey, string>>({ left: '', right: '' });
  const [rolls, setRolls] = useState<Record<SideKey, RollLevel>>({ left: 'high', right: 'high' });
  const activeResult = (res: DamageResult[] | string, move: string) =>
    typeof res === 'string' ? undefined : (res.find((r) => r.move === move) ?? res[0]);

  const leftName = left.species || 'Pokémon 1';
  const rightName = right.species || 'Pokémon 2';

  const swap = () => {
    setLeft(right);
    setRight(left);
    setField({ ...field, left: field.right, right: field.left });
    setPicked({ left: picked.right, right: picked.left });
    setRolls({ left: rolls.right, right: rolls.left });
  };

  return (
    <div className="page calc-page">
      <DataLists />
      <datalist id="dl-calc-species">
        {CALC_SPECIES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="calc-head">
        <h1>Calculadora de daño</h1>
        <span className="muted small">Nivel 50 · IVs al máximo · Stat Points de Champions · motor de Showdown</span>
        <button className="small" onClick={swap}>
          Intercambiar
        </button>
      </div>

      <div className="calc-duel">
        <BattleCard
          mon={left}
          results={results.leftToRight}
          selected={picked.left}
          onSelect={(m) => setPicked({ ...picked, left: m })}
          roll={rolls.left}
          onRoll={(r) => setRolls({ ...rolls, left: r })}
          incoming={activeResult(results.rightToLeft, picked.right)}
          incomingRoll={rolls.right}
        />
        <BattleCard
          mon={right}
          results={results.rightToLeft}
          selected={picked.right}
          onSelect={(m) => setPicked({ ...picked, right: m })}
          roll={rolls.right}
          onRoll={(r) => setRolls({ ...rolls, right: r })}
          incoming={activeResult(results.leftToRight, picked.left)}
          incomingRoll={rolls.left}
          mirrored
        />
      </div>

      <div className="calc-fieldbar">
        <FieldPanel
          field={field}
          onChange={setField}
          weathers={['', 'Sun', 'Rain', 'Sand', 'Snow'] as Weather[]}
          terrains={['', 'Electric', 'Grassy', 'Psychic', 'Misty'] as Terrain[]}
        />
        {speed && <SpeedLine left={leftName} right={rightName} speed={speed} trickRoom={field.trickRoom} />}
      </div>

      <div className="calc-duel">
        <MonPanel
          title="Pokémon 1"
          side={left}
          foe={right}
          mySide="left"
          field={field}
          onFieldChange={setField}
          teams={teams}
          onChange={setLeft}
          idPrefix="calc-a"
        />
        <MonPanel
          title="Pokémon 2"
          side={right}
          foe={left}
          mySide="right"
          field={field}
          onFieldChange={setField}
          teams={teams}
          onChange={setRight}
          idPrefix="calc-b"
        />
      </div>
    </div>
  );
}

function SpeedLine({ left, right, speed, trickRoom }: { left: string; right: string; speed: Record<SideKey, number>; trickRoom: boolean }) {
  let verdict: string;
  if (speed.left === speed.right) verdict = 'Empate: orden aleatorio';
  else {
    const leftFirst = speed.left > speed.right !== trickRoom;
    verdict = `${leftFirst ? left : right} va antes${trickRoom ? ' (Trick Room)' : ''}`;
  }
  return (
    <p className="speed-line">
      <span>
        Vel. <b>{speed.left}</b> · <b>{speed.right}</b>
      </span>
      <span className="muted">{verdict}</span>
    </p>
  );
}
