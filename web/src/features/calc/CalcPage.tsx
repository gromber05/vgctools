import { useMemo, useState } from 'react';
import { DataLists } from '@/components/pokemon/DataLists';
import { Card } from '@/components/ui';
import { calcDamage, defaultField, type CalcField, type DamageResult, type Terrain, type Weather } from '@/lib/champions/damage';
import type { Team } from '@/state/types';
import { FieldPanel } from './FieldPanel';
import { MonPanel } from './MonPanel';
import { blankSide, type CalcSide } from './side';

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
  const [left, setLeft] = useState<CalcSide>(exampleAttacker);
  const [right, setRight] = useState<CalcSide>(exampleDefender);
  const [field, setField] = useState<CalcField>(defaultField);

  const results = useMemo(() => {
    const safe = (a: CalcSide, b: CalcSide): DamageResult[] | string => {
      try {
        return calcDamage(a, b, a.moves.filter(Boolean), field);
      } catch {
        return 'Revisa los datos: algún Pokémon, objeto o movimiento no es válido.';
      }
    };
    return { leftToRight: safe(left, right), rightToLeft: safe(right, left) };
  }, [left, right, field]);

  return (
    <div className="page calc-page">
      <DataLists />
      <div className="page-head">
        <div>
          <h1>Calculadora de daño</h1>
          <p className="lede">
            Nivel 50, IVs al máximo y Stat Points, con las potencias de Pokémon Champions. Usa el motor de cálculo de Showdown.
          </p>
        </div>
        <button
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
        >
          Intercambiar
        </button>
      </div>

      <div className="calc-grid">
        <MonPanel title="Pokémon 1" side={left} teams={teams} onChange={setLeft} idPrefix="calc-a" />
        <MonPanel title="Pokémon 2" side={right} teams={teams} onChange={setRight} idPrefix="calc-b" />
      </div>

      <FieldPanel
        field={field}
        onChange={setField}
        weathers={['', 'Sun', 'Rain', 'Sand', 'Snow'] as Weather[]}
        terrains={['', 'Electric', 'Grassy', 'Psychic', 'Misty'] as Terrain[]}
      />

      <div className="two">
        <Card title={`${left.species || 'Pokémon 1'} ataca a ${right.species || 'Pokémon 2'}`}>
          <Results results={results.leftToRight} />
        </Card>
        <Card title={`${right.species || 'Pokémon 2'} ataca a ${left.species || 'Pokémon 1'}`}>
          <Results results={results.rightToLeft} />
        </Card>
      </div>
    </div>
  );
}

function Results({ results }: { results: DamageResult[] | string }) {
  if (typeof results === 'string') return <p className="error small">{results}</p>;
  if (!results.length) return <p className="muted small">Añade movimientos de ataque para ver el daño.</p>;
  return (
    <ul className="dmg-list">
      {results.map((r) => (
        <li key={r.move} className="dmg">
          <div className="dmg-head">
            <b>{r.move}</b>
            <span className="dmg-pct">{r.max === 0 ? 'Sin efecto' : `${r.minPct.toFixed(1)} – ${r.maxPct.toFixed(1)}%`}</span>
          </div>
          {r.max > 0 && (
            <span className="dmg-bar" aria-hidden="true">
              <span className="dmg-min" style={{ width: `${Math.min(100, r.minPct)}%` }} />
              <span className="dmg-max" style={{ width: `${Math.min(100, r.maxPct) - Math.min(100, r.minPct)}%` }} />
            </span>
          )}
          {r.ko && <div className="dmg-ko">{r.ko}</div>}
          {r.desc && <div className="dmg-desc">{r.desc}</div>}
        </li>
      ))}
    </ul>
  );
}
