import { useState } from 'react';
import { CommitInput } from '@/components/ui';
import { AbilityPicker, ItemPicker, MovePicker, PickField } from '@/components/pokemon/Pickers';
import { StatSliders } from '@/components/pokemon/StatSliders';
import { baseSpecies, battleForm } from '@/lib/champions/data';
import type { CalcField, SideKey, Status } from '@/lib/champions/damage';
import { calcStats, formatSp, NATURES, natureLabel, SP_MAX, STAT_KEYS, STAT_LABEL } from '@/lib/champions/rules';
import { effectiveStats } from '@/lib/champions/effective';
import { exportPaste, parsePaste } from '@/lib/showdown/paste';
import type { Team } from '@/state/types';
import { SideOptions } from './FieldPanel';
import { Modal } from '@/components/ui';
import { Optimizer } from './Optimizer';
import { CALC_SPECIES, sideForSpecies, sideFromMon, type CalcSide } from './side';

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

type PickerState = { kind: 'move'; slot: number } | { kind: 'item' } | { kind: 'ability' } | null;

interface MonPanelProps {
  title: string;
  side: CalcSide;
  foe: CalcSide;
  mySide: SideKey;
  field: CalcField;
  onFieldChange: (field: CalcField) => void;
  teams: Team[];
  onChange: (side: CalcSide) => void;
  idPrefix: string;
}

export function MonPanel({ title, side, foe, mySide, field, onFieldChange, teams, onChange, idPrefix }: MonPanelProps) {
  const species = baseSpecies(side.species);
  const form = battleForm(side.species, side.item);
  const shown = form?.mega && !side.megaEvolved ? species! : form?.species;
  const set = (patch: Partial<CalcSide>) => onChange({ ...side, ...patch });
  const [picker, setPicker] = useState<PickerState>(null);
  const [modal, setModal] = useState<'' | 'optimizer' | 'set'>('');

  const loadFromTeam = (value: string) => {
    const [teamId, idx] = value.split(':');
    const mon = teams.find((t) => t.id === teamId)?.mons[+idx];
    if (mon) onChange(sideFromMon(mon));
  };

  return (
    <section className="card calc-mon">
      <header className="calc-mon-head">
        <CommitInput
          key={side.species}
          className="species-input"
          list="dl-calc-species"
          value={side.species}
          options={CALC_SPECIES}
          onCommit={(v) => onChange(sideForSpecies(v, side))}
          aria-label={`Especie de ${title.toLowerCase()}`}
          placeholder={title}
        />
        {form?.mega && (
          <label className="check small">
            <input type="checkbox" checked={side.megaEvolved} onChange={(e) => set({ megaEvolved: e.target.checked })} /> Mega
          </label>
        )}
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

      <div className="set-fields">
        <label className="field">
          <span>Objeto</span>
          <PickField
            value={side.item}
            placeholder="Sin objeto"
            onClick={() => setPicker({ kind: 'item' })}
            label={`Objeto de ${title.toLowerCase()}`}
          />
        </label>
        <label className="field">
          <span>Habilidad</span>
          <PickField
            value={form?.mega && side.megaEvolved ? form.species.abilities[0] : side.ability}
            placeholder="—"
            onClick={() => setPicker({ kind: 'ability' })}
            label={`Habilidad de ${title.toLowerCase()}`}
            disabled={!species || (!!form?.mega && side.megaEvolved)}
          />
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
        modified={
          shown
            ? effectiveStats(calcStats(shown.stats, side.sp, side.nature), {
                species: shown.name,
                item: side.item,
                ability: form?.mega && side.megaEvolved ? shown.abilities[0] : side.ability,
                status: side.status,
                boosts: side.boosts,
                weather: field.weather,
                terrain: field.terrain,
                tailwind: field[mySide].tailwind,
              })
            : undefined
        }
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

      <div className="set-moves">
        {side.moves.map((name, k) => (
          <PickField
            key={k}
            value={name}
            placeholder={`Movimiento ${k + 1}`}
            onClick={() => setPicker({ kind: 'move', slot: k })}
            label={`Movimiento ${k + 1} de ${title.toLowerCase()}`}
            disabled={!species}
          />
        ))}
      </div>
      {picker?.kind === 'move' && species && (
        <MovePicker
          open
          onClose={() => setPicker(null)}
          species={species.name}
          current={side.moves}
          value={side.moves[picker.slot]}
          onPick={(v) => set({ moves: side.moves.map((m, j) => (j === picker.slot ? v : m)) })}
        />
      )}
      {picker?.kind === 'item' && (
        <ItemPicker open onClose={() => setPicker(null)} species={side.species} value={side.item} onPick={(v) => set({ item: v })} />
      )}
      {picker?.kind === 'ability' && species && (
        <AbilityPicker
          open
          onClose={() => setPicker(null)}
          abilities={species.abilities}
          value={side.ability}
          onPick={(v) => set({ ability: v })}
        />
      )}

      <SideOptions side={field[mySide]} onChange={(s) => onFieldChange({ ...field, [mySide]: s })} name={side.species || title} />
      <div className="calc-tools">
        <button className="small" onClick={() => setModal('optimizer')}>
          Optimizador de SP
        </button>
        <button className="small" onClick={() => setModal('set')}>
          Importar / exportar set
        </button>
      </div>
      <Modal open={modal === 'optimizer'} onClose={() => setModal('')} title={`Optimizador de SP · ${side.species || title}`}>
        <Optimizer
          me={side}
          foe={foe}
          mySide={mySide}
          field={field}
          onApply={(patch) => {
            set(patch);
            setModal('');
          }}
        />
      </Modal>
      <Modal open={modal === 'set'} onClose={() => setModal('')} title={`Set de ${side.species || title}`}>
        {modal === 'set' && <SetText side={side} onImport={onChange} />}
      </Modal>
    </section>
  );
}

function SetText({ side, onImport }: { side: CalcSide; onImport: (side: CalcSide) => void }) {
  const current = () =>
    exportPaste([
      {
        species: side.species,
        nickname: '',
        item: side.item,
        ability: side.ability,
        nature: side.nature,
        evs: formatSp(side.sp),
        moves: side.moves,
      },
    ]);
  const [text, setText] = useState(current);
  const [msg, setMsg] = useState('');

  return (
    <div className="set-text">
      <textarea
        rows={8}
        className="mono"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Set en formato Showdown"
        spellCheck={false}
      />
      <div className="row">
        <button
          className="small"
          onClick={() => {
            const [mon] = parsePaste(text);
            if (!mon) return setMsg('No encuentro ningún Pokémon en el texto.');
            onImport(sideFromMon(mon));
            setMsg(`Cargado ${mon.species}.`);
          }}
        >
          Importar
        </button>
        <button
          className="small"
          onClick={async () => {
            const out = current();
            setText(out);
            try {
              await navigator.clipboard.writeText(out);
              setMsg('Copiado.');
            } catch {
              setMsg('No se pudo copiar: selecciona el texto y cópialo a mano.');
            }
          }}
        >
          Copiar set
        </button>
        {msg && <span className="muted small">{msg}</span>}
      </div>
    </div>
  );
}
