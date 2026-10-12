import type { CalcField, SideField, Terrain, Weather } from '@/lib/champions/damage';

const WEATHER_LABEL: Record<Weather, string> = { '': 'No weather', Sun: 'Sun', Rain: 'Rain', Sand: 'Sand', Snow: 'Snow' };
const TERRAIN_LABEL: Record<Terrain, string> = {
  '': 'No terrain',
  Electric: 'Electric Terrain',
  Grassy: 'Grassy Terrain',
  Psychic: 'Psychic Terrain',
  Misty: 'Misty Terrain',
};

type BoolKey<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];

const GLOBAL_TOGGLES: [BoolKey<CalcField>, string][] = [
  ['doubles', 'Doubles'],
  ['trickRoom', 'Trick Room'],
  ['gravity', 'Gravity'],
  ['magicRoom', 'Magic Room'],
  ['wonderRoom', 'Wonder Room'],
  ['fairyAura', 'Fairy Aura'],
  ['darkAura', 'Dark Aura'],
  ['auraBreak', 'Aura Break'],
];

const ATTACK_TOGGLES: [BoolKey<SideField>, string][] = [
  ['helpingHand', 'Helping Hand'],
  ['crit', 'Critical Hit'],
  ['singleTarget', 'Single Target'],
  ['steelySpirit', 'Steely Spirit'],
  ['battery', 'Battery'],
  ['powerSpot', 'Power Spot'],
  ['tailwind', 'Tailwind'],
];

const DEFENSE_TOGGLES: [BoolKey<SideField>, string][] = [
  ['reflect', 'Reflect'],
  ['lightScreen', 'Light Screen'],
  ['auroraVeil', 'Aurora Veil'],
  ['friendGuard', 'Friend Guard'],
  ['stealthRock', 'Stealth Rock'],
  ['seeded', 'Leech Seed'],
];

interface FieldPanelProps {
  field: CalcField;
  onChange: (field: CalcField) => void;
  weathers: Weather[];
  terrains: Terrain[];
}

function Chip({ checked, onChange, label, title }: { checked: boolean; onChange: (v: boolean) => void; label: string; title?: string }) {
  return (
    <label className="chip-toggle" title={title}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Clima, campo y efectos que afectan a los dos lados. */
export function FieldPanel({ field, onChange, weathers, terrains }: FieldPanelProps) {
  const set = (patch: Partial<CalcField>) => onChange({ ...field, ...patch });
  return (
    <section className="card field-panel" aria-label="Campo">
      <div className="field-selects">
        <select value={field.weather} onChange={(e) => set({ weather: e.target.value as Weather })} aria-label="Clima">
          {weathers.map((w) => (
            <option key={w} value={w}>
              {WEATHER_LABEL[w]}
            </option>
          ))}
        </select>
        <select value={field.terrain} onChange={(e) => set({ terrain: e.target.value as Terrain })} aria-label="Campo">
          {terrains.map((t) => (
            <option key={t} value={t}>
              {TERRAIN_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="chips">
        {GLOBAL_TOGGLES.map(([key, label]) => (
          <Chip key={key} checked={field[key]} onChange={(v) => set({ [key]: v })} label={label} />
        ))}
      </div>
    </section>
  );
}

/** Efectos del lado de un Pokémon: los de ataque cuentan cuando golpea y los de defensa cuando recibe. */
export function SideOptions({ side, onChange, name }: { side: SideField; onChange: (side: SideField) => void; name: string }) {
  const set = (patch: Partial<SideField>) => onChange({ ...side, ...patch });
  return (
    <div className="side-options" role="group" aria-label={`Campo en el lado de ${name}`}>
      <div className="chips">
        <span className="chips-label">Ataque</span>
        {ATTACK_TOGGLES.map(([k, label]) => (
          <Chip
            key={k}
            checked={side[k]}
            onChange={(v) => set({ [k]: v })}
            label={label}
            title={k === 'singleTarget' ? 'Quita la reducción de daño de los movimientos que golpean a varios' : undefined}
          />
        ))}
      </div>
      <div className="chips">
        <span className="chips-label">Defensa</span>
        {DEFENSE_TOGGLES.map(([k, label]) => (
          <Chip key={k} checked={side[k]} onChange={(v) => set({ [k]: v })} label={label} />
        ))}
        <label className="chip-toggle chip-select-sm">
          Spikes
          <select value={side.spikes} onChange={(e) => set({ spikes: +e.target.value })} aria-label={`Spikes en el lado de ${name}`}>
            {[0, 1, 2, 3].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
