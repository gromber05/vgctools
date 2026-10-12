import { defaultField, defaultSideField, type CalcField } from '@/lib/champions/damage';
import { CALC_KEY } from '@/state/consent';
import { blankSide, type CalcSide } from './side';

export interface CalcState {
  left: CalcSide;
  right: CalcSide;
  field: CalcField;
}

/** Rellena con valores por defecto lo que falte, por si lo guardado es de una versión anterior. */
const side = (raw: Partial<CalcSide> | undefined): CalcSide | undefined =>
  raw?.species ? { ...blankSide(raw.species), ...raw, moves: [...(raw.moves ?? []), '', '', '', ''].slice(0, 4) } : undefined;

export function loadCalc(): Partial<CalcState> {
  try {
    const raw = JSON.parse(localStorage.getItem(CALC_KEY) ?? 'null') as Partial<CalcState> | null;
    if (!raw) return {};
    const f = raw.field;
    return {
      left: side(raw.left),
      right: side(raw.right),
      field: f
        ? { ...defaultField, ...f, left: { ...defaultSideField, ...f.left }, right: { ...defaultSideField, ...f.right } }
        : undefined,
    };
  } catch {
    return {};
  }
}

export function saveCalc(state: CalcState) {
  try {
    localStorage.setItem(CALC_KEY, JSON.stringify(state));
  } catch {}
}
