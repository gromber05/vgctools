import { useState } from 'react';
import { CommitInput } from '@/components/ui';
import { AbilityPicker, ItemPicker, MovePicker, PickField } from '@/components/pokemon/Pickers';
import { Sprite } from '@/components/pokemon/Sprite';
import { StatSliders } from '@/components/pokemon/StatSliders';
import { TypeChip, TypeChips } from '@/components/pokemon/TypeChip';
import { baseSpecies, battleForm, findMove, learnableMoves, SPECIES_NAMES } from '@/lib/champions/data';
import { effectiveStats } from '@/lib/champions/effective';
import { setWarnings } from '@/lib/champions/legality';
import { calcStats, formatSp, NATURES, natureLabel, parseSp, SP_MAX } from '@/lib/champions/rules';
import type { PasteMon } from '@/lib/showdown/paste';

const CATEGORY = { Physical: 'Físico', Special: 'Especial', Status: 'Estado' } as const;

interface SetEditorProps {
  index: number;
  mon: PasteMon;
  team: PasteMon[];
  onChange: (mon: PasteMon) => void;
  onRemove: () => void;
}

export function SetEditor({ index, mon, team, onChange, onRemove }: SetEditorProps) {
  const species = baseSpecies(mon.species);
  const form = battleForm(mon.species, mon.item);
  const sp = parseSp(mon.evs);
  const [picker, setPicker] = useState<{ kind: 'move'; slot: number } | { kind: 'item' } | { kind: 'ability' } | null>(null);
  const warnings = setWarnings(mon, team);
  const set = (patch: Partial<PasteMon>) => onChange({ ...mon, ...patch });

  const changeSpecies = (name: string) => {
    const next = baseSpecies(name);
    if (!next) return set({ species: name });
    const keep = new Set(learnableMoves(next.name));
    set({ species: next.name, ability: next.abilities[0], moves: mon.moves.map((m) => (keep.has(m) ? m : '')) });
  };

  const setSp = (i: number, value: number) => {
    const next = [...sp];
    next[i] = Math.max(0, Math.min(SP_MAX, value || 0));
    set({ evs: formatSp(next) });
  };

  const setMove = (k: number, name: string) => {
    const moves = [...mon.moves, '', '', '', ''].slice(0, 4);
    moves[k] = name;
    set({ moves });
  };

  return (
    <article className="card set-editor">
      <header className="set-head">
        <span className="set-sprite">
          {species ? <Sprite name={form?.species.name ?? species.name} size={96} big /> : <span className="set-slot">{index + 1}</span>}
        </span>
        <div className="set-title">
          <CommitInput
            key={mon.species}
            className="species-input"
            list="dl-species"
            value={mon.species}
            options={SPECIES_NAMES}
            onCommit={changeSpecies}
            placeholder="Pokémon"
            aria-label={`Pokémon ${index + 1}`}
          />
          <div className="set-types">
            {form && <TypeChips types={form.species.types} />}
            {form?.mega && <span className="mega-tag">Mega</span>}
          </div>
        </div>
        <button className="icon-btn" onClick={onRemove} aria-label={`Quitar Pokémon ${index + 1}`} title="Quitar">
          ×
        </button>
      </header>

      <div className="set-fields">
        <label className="field">
          <span>Objeto</span>
          <PickField
            value={mon.item}
            placeholder="Sin objeto"
            onClick={() => setPicker({ kind: 'item' })}
            label={`Objeto del Pokémon ${index + 1}`}
          />
        </label>
        <label className="field">
          <span>Habilidad</span>
          <PickField
            value={mon.ability}
            placeholder="—"
            onClick={() => setPicker({ kind: 'ability' })}
            label={`Habilidad del Pokémon ${index + 1}`}
            disabled={!species}
          />
        </label>
        <label className="field">
          <span>Naturaleza</span>
          <select value={mon.nature || 'Hardy'} onChange={(e) => set({ nature: e.target.value })}>
            {Object.keys(NATURES).map((n) => (
              <option key={n} value={n}>
                {natureLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Mote</span>
          <CommitInput key={mon.nickname} value={mon.nickname} onCommit={(v) => set({ nickname: v })} placeholder="Opcional" />
        </label>
      </div>

      <div className="section-label">Estadísticas</div>
      <StatSliders
        baseStats={form?.species.stats ?? null}
        sp={sp}
        nature={mon.nature}
        onChange={setSp}
        label="Stat Points"
        modified={
          form
            ? effectiveStats(calcStats(form.species.stats, sp, mon.nature), {
                species: form.species.name,
                item: mon.item,
                ability: form.mega ? form.species.abilities[0] : mon.ability,
              })
            : undefined
        }
      />

      <div className="section-label">Movimientos</div>
      <div className="set-moves">
        {[0, 1, 2, 3].map((k) => {
          const name = mon.moves[k] ?? '';
          const move = findMove(name);
          return (
            <div key={k} className="move-field">
              <PickField
                value={name}
                placeholder={`Movimiento ${k + 1}`}
                onClick={() => setPicker({ kind: 'move', slot: k })}
                label={`Movimiento ${k + 1}`}
                disabled={!species}
              />
              <span className="move-meta">
                {move && (
                  <>
                    <TypeChip type={move.type} small />
                    <span className={`move-cat is-${move.category.toLowerCase()}`}>{CATEGORY[move.category]}</span>
                    {move.power ? <span>{move.power}</span> : null}
                    {move.priority ? (
                      <span>
                        Prioridad {move.priority > 0 ? '+' : ''}
                        {move.priority}
                      </span>
                    ) : null}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {picker?.kind === 'move' && species && (
        <MovePicker
          open
          onClose={() => setPicker(null)}
          species={species.name}
          current={mon.moves}
          value={mon.moves[picker.slot] ?? ''}
          onPick={(v) => setMove(picker.slot, v)}
        />
      )}
      {picker?.kind === 'item' && (
        <ItemPicker open onClose={() => setPicker(null)} species={mon.species} value={mon.item} onPick={(v) => set({ item: v })} />
      )}
      {picker?.kind === 'ability' && species && (
        <AbilityPicker
          open
          onClose={() => setPicker(null)}
          abilities={species.abilities}
          value={mon.ability}
          onPick={(v) => set({ ability: v })}
        />
      )}

      {warnings.length > 0 && (
        <ul className="warnings">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
