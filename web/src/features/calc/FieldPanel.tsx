import type { CalcField, Terrain, Weather } from '@/lib/champions/damage';

const WEATHER_ES: Record<Weather, string> = { '': 'Sin clima', Sun: 'Sol', Rain: 'Lluvia', Sand: 'Tormenta de arena', Snow: 'Nieve' };
const TERRAIN_ES: Record<Terrain, string> = {
  '': 'Sin campo',
  Electric: 'Eléctrico',
  Grassy: 'Hierba',
  Psychic: 'Psíquico',
  Misty: 'Niebla',
};

const TOGGLES: [keyof CalcField, string][] = [
  ['doubles', 'Combate doble'],
  ['crit', 'Golpe crítico'],
  ['helpingHand', 'Refuerzo (atacante)'],
  ['reflect', 'Reflejo (defensor)'],
  ['lightScreen', 'Pantalla de Luz (defensor)'],
  ['auroraVeil', 'Velo Aurora (defensor)'],
  ['friendGuard', 'Compiescolta (defensor)'],
];

interface FieldPanelProps {
  field: CalcField;
  onChange: (field: CalcField) => void;
  weathers: Weather[];
  terrains: Terrain[];
}

export function FieldPanel({ field, onChange, weathers, terrains }: FieldPanelProps) {
  const set = (patch: Partial<CalcField>) => onChange({ ...field, ...patch });
  return (
    <section className="card field-panel" aria-label="Campo">
      <label className="field">
        <span>Clima</span>
        <select value={field.weather} onChange={(e) => set({ weather: e.target.value as Weather })}>
          {weathers.map((w) => (
            <option key={w} value={w}>
              {WEATHER_ES[w]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Campo</span>
        <select value={field.terrain} onChange={(e) => set({ terrain: e.target.value as Terrain })}>
          {terrains.map((t) => (
            <option key={t} value={t}>
              {TERRAIN_ES[t]}
            </option>
          ))}
        </select>
      </label>
      <div className="toggles">
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="check">
            <input type="checkbox" checked={!!field[key]} onChange={(e) => set({ [key]: e.target.checked })} /> {label}
          </label>
        ))}
      </div>
      <p className="muted small">Los efectos de «defensor» se aplican al Pokémon que recibe el golpe en cada cálculo.</p>
    </section>
  );
}
