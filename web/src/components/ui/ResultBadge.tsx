const LABELS = {
  long: { W: 'Victoria', L: 'Derrota', T: 'Empate' },
  short: { W: 'V', L: 'D', T: 'E' },
} as const;

export function ResultBadge({ result, short = false }: { result: 'W' | 'L' | 'T'; short?: boolean }) {
  return <span className={`badge res-${result}`}>{LABELS[short ? 'short' : 'long'][result]}</span>;
}
