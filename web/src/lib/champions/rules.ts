export const SP_TOTAL = 66;
export const SP_MAX = 32;

export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export const STAT_LABEL = ['PS', 'At', 'Def', 'AtEsp', 'DefEsp', 'Vel'];
const STAT_SD = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

export const NATURES: Record<string, [string, number?, number?]> = {
  Hardy: ['Fuerte'],
  Lonely: ['Huraña', 1, 2],
  Brave: ['Audaz', 1, 5],
  Adamant: ['Firme', 1, 3],
  Naughty: ['Pícara', 1, 4],
  Bold: ['Osada', 2, 1],
  Docile: ['Dócil'],
  Relaxed: ['Plácida', 2, 5],
  Impish: ['Agitada', 2, 3],
  Lax: ['Floja', 2, 4],
  Timid: ['Miedosa', 5, 1],
  Hasty: ['Activa', 5, 2],
  Serious: ['Seria'],
  Jolly: ['Alegre', 5, 3],
  Naive: ['Ingenua', 5, 4],
  Modest: ['Modesta', 3, 1],
  Mild: ['Afable', 3, 2],
  Quiet: ['Mansa', 3, 5],
  Bashful: ['Tímida'],
  Rash: ['Alocada', 3, 4],
  Calm: ['Serena', 4, 1],
  Gentle: ['Amable', 4, 2],
  Sassy: ['Grosera', 4, 5],
  Careful: ['Cauta', 4, 3],
  Quirky: ['Rara'],
};

export const natureLabel = (nature: string) => {
  const n = NATURES[nature];
  if (!n) return nature;
  return n[1] === undefined ? `${nature} · ${n[0]}` : `${nature} · ${n[0]} (+${STAT_LABEL[n[1]]} −${STAT_LABEL[n[2]!]})`;
};

export function calcStat(base: number, sp: number, index: number, nature: string): number {
  if (index === 0) return base + 75 + sp;
  const value = base + 20 + sp;
  const n = NATURES[nature];
  if (n?.[1] === index) return Math.floor((value * 11) / 10);
  if (n?.[2] === index) return Math.floor((value * 9) / 10);
  return value;
}

export const calcStats = (baseStats: number[], sp: number[], nature: string) => baseStats.map((b, i) => calcStat(b, sp[i] ?? 0, i, nature));

export const spTotal = (sp: number[]) => sp.reduce((a, b) => a + (b || 0), 0);

export function parseSp(line: string): number[] {
  const values = [0, 0, 0, 0, 0, 0];
  for (const part of line.split('/')) {
    const m = part.trim().match(/^(\d+)\s+(\w+)$/);
    const i = m ? STAT_SD.findIndex((s) => s.toLowerCase() === m[2].toLowerCase()) : -1;
    if (m && i >= 0) values[i] = +m[1];
  }
  if (values.some((v) => v > SP_MAX)) return values.map((e) => (e >= 4 ? Math.min(SP_MAX, Math.floor((e - 4) / 8) + 1) : 0));
  return values;
}

export const formatSp = (sp: number[]) =>
  sp
    .map((v, i) => (v ? `${v} ${STAT_SD[i]}` : ''))
    .filter(Boolean)
    .join(' / ');

export const spToEv = (sp: number) => (sp > 0 ? Math.min(252, sp * 8 - 4) : 0);
