import { useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui';
import { baseSpecies, findAbility, findMove, ITEMS, learnableMoves, type MoveData } from '@/lib/champions/data';
import { TypeChip } from './TypeChip';

const CATEGORY = { Physical: ['Fís', 'Físico'], Special: ['Esp', 'Especial'], Status: ['Est', 'Estado'] } as const;

/** Cuántos Pokémon golpea el movimiento en dobles. */
const TARGETS: Record<string, string> = {
  normal: '1',
  any: '1',
  adjacentFoe: '1',
  randomNormal: '1',
  adjacentAlly: '1',
  adjacentAllyOrSelf: '1',
  allAdjacentFoes: '2',
  allAdjacent: '3',
};

const matches = (q: string, ...fields: string[]) => {
  const needle = q.trim().toLowerCase();
  return !needle || fields.some((f) => f.toLowerCase().includes(needle));
};

/** Botón con aspecto de campo que abre un selector. */
export function PickField({
  value,
  placeholder,
  onClick,
  label,
  disabled,
}: {
  value: string;
  placeholder: string;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="pick-field" onClick={onClick} aria-label={label} disabled={disabled}>
      <span className={value ? undefined : 'muted'}>{value || placeholder}</span>
    </button>
  );
}

function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      className="picker-search"
      type="search"
      data-autofocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="picker-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

type SortKey = 'name' | 'type' | 'power' | 'accuracy' | 'pp';

interface MovePickerProps {
  open: boolean;
  onClose: () => void;
  species: string;
  /** Movimientos que ya lleva el set: salen arriba. */
  current: string[];
  value: string;
  onPick: (move: string) => void;
}

export function MovePicker({ open, onClose, species, current, value, onPick }: MovePickerProps) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'name', desc: false });
  const pick = (name: string) => {
    onPick(name);
    onClose();
  };

  const all = learnableMoves(species)
    .map((n) => findMove(n)!)
    .filter((m) => m && matches(q, m.name, m.type, m.desc, CATEGORY[m.category][1]));
  const dir = sort.desc ? -1 : 1;
  all.sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    return (typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv))) * dir || a.name.localeCompare(b.name);
  });
  const inSet = all.filter((m) => current.includes(m.name));
  const rest = all.filter((m) => !current.includes(m.name));

  const head = (key: SortKey, text: string) => (
    <button
      type="button"
      className={sort.key === key ? 'is-sorted' : undefined}
      onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : key !== 'name' && key !== 'type' })}
    >
      {text}
      {sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : ''}
    </button>
  );

  const row = (m: MoveData) => (
    <button
      key={m.name}
      type="button"
      className={m.name === value ? 'picker-row move-row is-current' : 'picker-row move-row'}
      onClick={() => pick(m.name)}
    >
      <b className="pr-name">{m.name}</b>
      <span className={`pr-cat move-cat is-${m.category.toLowerCase()}`} title={CATEGORY[m.category][1]}>
        {CATEGORY[m.category][0]}
      </span>
      <span className="pr-type">
        <TypeChip type={m.type} small />
      </span>
      <span className="pr-num" data-label="BP">
        {m.power || '—'}
      </span>
      <span className="pr-num" data-label="ACC">
        {m.accuracy ? `${m.accuracy}%` : '—'}
      </span>
      <span className="pr-num" data-label="PP">
        {m.pp}
      </span>
      <span className="pr-num" data-label="OBJ">
        {m.category === 'Status' ? '—' : (TARGETS[m.target] ?? '—')}
      </span>
      <span className="pr-desc">{m.desc}</span>
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title={`Movimientos de ${baseSpecies(species)?.name ?? species}`} className="modal-wide">
      <div className="picker-tools">
        <Search value={q} onChange={setQ} placeholder="Buscar por nombre, tipo o efecto" />
        {value && (
          <button className="small" onClick={() => pick('')}>
            Quitar movimiento
          </button>
        )}
      </div>
      <div className="picker-list">
        <div className="picker-row move-row picker-head">
          {head('name', 'Nombre')}
          <span>Cat.</span>
          {head('type', 'Tipo')}
          {head('power', 'BP')}
          {head('accuracy', 'Prec.')}
          {head('pp', 'PP')}
          <span title="Pokémon a los que golpea en dobles">Obj.</span>
          <span>Descripción</span>
        </div>
        {inSet.length > 0 && <Section title="En el set">{inSet.map(row)}</Section>}
        <Section title={`Movimientos (${rest.length})`}>
          {rest.map(row)}
          {!all.length && <p className="muted small">Ningún movimiento coincide con la búsqueda.</p>}
        </Section>
      </div>
    </Modal>
  );
}

interface SimplePickerProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onPick: (value: string) => void;
}

export function AbilityPicker({ open, onClose, value, onPick, abilities }: SimplePickerProps & { abilities: string[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Habilidad" className="modal-wide">
      <div className="picker-list">
        {abilities.map((name) => (
          <button
            key={name}
            type="button"
            className={name === value ? 'picker-row text-row is-current' : 'picker-row text-row'}
            onClick={() => {
              onPick(name);
              onClose();
            }}
          >
            <b className="pr-name">{name}</b>
            <span className="pr-desc">{findAbility(name)?.desc}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function ItemPicker({ open, onClose, value, onPick, species }: SimplePickerProps & { species: string }) {
  const [q, setQ] = useState('');
  const base = baseSpecies(species)?.name ?? '';
  const pick = (name: string) => {
    onPick(name);
    onClose();
  };
  const items = Object.values(ITEMS)
    .filter((i) => (!i.megaStone || (base && i.megaStone[base])) && matches(q, i.name, i.desc))
    .sort((a, b) => a.name.localeCompare(b.name));
  const stones = items.filter((i) => i.megaStone);
  const rest = items.filter((i) => !i.megaStone);
  const row = (i: (typeof items)[number]) => (
    <button
      key={i.name}
      type="button"
      className={i.name === value ? 'picker-row text-row is-current' : 'picker-row text-row'}
      onClick={() => pick(i.name)}
    >
      <b className="pr-name">{i.name}</b>
      <span className="pr-desc">{i.desc}</span>
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Objeto" className="modal-wide">
      <div className="picker-tools">
        <Search value={q} onChange={setQ} placeholder="Buscar objeto o efecto" />
        {value && (
          <button className="small" onClick={() => pick('')}>
            Sin objeto
          </button>
        )}
      </div>
      <div className="picker-list">
        {stones.length > 0 && <Section title="Megapiedra">{stones.map(row)}</Section>}
        <Section title={`Objetos (${rest.length})`}>
          {rest.map(row)}
          {!items.length && <p className="muted small">Ningún objeto coincide con la búsqueda.</p>}
        </Section>
      </div>
    </Modal>
  );
}
