import { CommitInput } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import { StatSliders } from '@/components/pokemon/StatSliders';
import { TypeChips } from '@/components/pokemon/TypeChip';
import { baseSpecies, battleForm, findItem, findMove, ITEM_NAMES, learnableMoves, SPECIES_NAMES } from '@/lib/champions/data';
import type { Status } from '@/lib/champions/damage';
import { NATURES, natureLabel, parseSp, SP_MAX, STAT_KEYS, STAT_LABEL } from '@/lib/champions/rules';
import type { Team } from '@/state/types';
import { blankSide, type CalcSide } from './side';

const STATUS: [Status, string][] = [
  ['', 'Sano'],
  ['brn', 'Quemado'],
  ['par', 'Paralizado'],
  ['psn', 'Envenenado'],
  ['tox', 'Gravemente envenenado'],
  ['slp', 'Dormido'],
  ['frz', 'Congelado'],
];
const BOOSTS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

interface MonPanelProps {
  title: string;
  side: CalcSide;
  teams: Team[];
  onChange: (side: CalcSide) => void;
  idPrefix: string;
}

export function MonPanel({ title, side, teams, onChange, idPrefix }: MonPanelProps) {
  const species = baseSpecies(side.species);
  const form = battleForm(side.species, side.item);
  const shown = form?.mega && !side.megaEvolved ? species! : form?.species;
  const learnable = species ? learnableMoves(species.name) : [];
  const set = (patch: Partial<CalcSide>) => onChange({ ...side, ...patch });

  const loadFromTeam = (value: string) => {
    const [teamId, idx] = value.split(':');
    const mon = teams.find((t) => t.id === teamId)?.mons[+idx];
    if (!mon) return;
    onChange({
      ...blankSide(mon.species),
      item: mon.item,
      ability: mon.ability || (baseSpecies(mon.species)?.abilities[0] ?? ''),
      nature: mon.nature || 'Hardy',
      sp: parseSp(mon.evs),
      moves: [...mon.moves, '', '', '', ''].slice(0, 4),
    });
  };

  return (
    <section className="card calc-mon">
      <header className="calc-mon-head">
        <h3>{title}</h3>
        {teams.some((t) => t.mons.length) && (
          <select
            id={`${idPrefix}-load`}
            value=""
            onChange={(e) => loadFromTeam(e.target.value)}
            aria-label={`Cargar ${title.toLowerCase()} de tus equipos`}
          >
            <option value="">Cargar de tus equipos…</option>
            {teams.map((t) => (
              <optgroup key={t.id} label={t.name}>
                {t.mons.map((m, i) => (
                  <option key={i} value={`${t.id}:${i}`}>
                    {m.nickname ? `${m.nickname} (${m.species})` : m.species}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </header>

      <div className="calc-mon-id">
        {shown ? <Sprite name={shown.name} size={80} big /> : <span className="set-slot">?</span>}
        <div className="grow">
          <CommitInput
            key={side.species}
            className="species-input"
            list="dl-species"
            value={side.species}
            options={SPECIES_NAMES}
            onCommit={(v) => onChange({ ...blankSide(v), moves: side.moves.map((m) => (learnableMoves(v).includes(m) ? m : '')) })}
            aria-label={`Pokémon ${title.toLowerCase()}`}
          />
          <div className="set-types">
            {shown && <TypeChips types={shown.types} />}
            {form?.mega && (
              <label className="check">
                <input type="checkbox" checked={side.megaEvolved} onChange={(e) => set({ megaEvolved: e.target.checked })} />{' '}
                Megaevolucionado
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="set-fields">
        <label className="field">
          <span>Objeto</span>
          <CommitInput
            key={side.item}
            list="dl-items"
            value={side.item}
            options={ITEM_NAMES}
            onCommit={(v) => set({ item: findItem(v)?.name ?? v })}
          />
        </label>
        <label className="field">
          <span>Habilidad</span>
          <select value={side.ability} onChange={(e) => set({ ability: e.target.value })} disabled={!!form?.mega && side.megaEvolved}>
            {(form?.mega && side.megaEvolved ? form.species.abilities : (species?.abilities ?? [])).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Naturaleza</span>
          <select value={side.nature} onChange={(e) => set({ nature: e.target.value })}>
            {Object.keys(NATURES).map((n) => (
              <option key={n} value={n}>
                {natureLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={side.status} onChange={(e) => set({ status: e.target.value as Status })}>
            {STATUS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <StatSliders
        baseStats={shown?.stats ?? null}
        sp={side.sp}
        nature={side.nature}
        label={`Stat Points ${title.toLowerCase()}`}
        onChange={(i, value) => set({ sp: side.sp.map((v, j) => (j === i ? Math.max(0, Math.min(SP_MAX, value)) : v)) })}
        extra={(i) => {
          const key = STAT_KEYS[i];
          if (key === 'hp')
            return (
              <label className="hp-pct" title="PS que le quedan">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={side.hpPercent}
                  onChange={(e) => set({ hpPercent: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 100)) })}
                  aria-label="Porcentaje de PS restantes"
                />
                %
              </label>
            );
          return (
            <select
              className="boost"
              value={side.boosts[key] ?? 0}
              onChange={(e) => set({ boosts: { ...side.boosts, [key]: +e.target.value } })}
              aria-label={`Cambio de nivel de ${STAT_LABEL[i]}`}
            >
              {BOOSTS.map((b) => (
                <option key={b} value={b}>
                  {b > 0 ? `+${b}` : b}
                </option>
              ))}
            </select>
          );
        }}
      />

      <datalist id={`${idPrefix}-moves`}>
        {learnable.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <div className="set-moves">
        {side.moves.map((name, k) => (
          <CommitInput
            key={`${k}-${name}`}
            list={`${idPrefix}-moves`}
            value={name}
            options={learnable}
            onCommit={(v) => set({ moves: side.moves.map((m, j) => (j === k ? (findMove(v)?.name ?? v) : m)) })}
            placeholder={`Movimiento ${k + 1}`}
            aria-label={`Movimiento ${k + 1} ${title.toLowerCase()}`}
          />
        ))}
      </div>
    </section>
  );
}
