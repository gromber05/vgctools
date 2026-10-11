import { baseName } from '@/lib/utils';

export interface PasteMon {
  species: string;
  nickname: string;
  item: string;
  ability: string;
  nature: string;
  /** línea de EVs / Stat Points tal cual, p. ej. "32 HP / 32 Atk / 2 Spe" */
  evs: string;
  moves: string[];
}

/** Lee un equipo en formato Showdown. */
export function parsePaste(text: string): PasteMon[] {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim());
      const [headRaw, item = ''] = lines[0].split(' @ ');
      const head = headRaw.replace(/\((M|F)\)\s*$/, '').trim();
      const paren = head.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      const field = (prefix: string) =>
        lines
          .find((l) => l.startsWith(prefix))
          ?.slice(prefix.length)
          .trim() ?? '';
      return {
        species: baseName(paren ? paren[2] : head),
        nickname: paren ? paren[1] : '',
        item: item.trim(),
        ability: field('Ability:'),
        nature: lines.find((l) => / Nature$/.test(l))?.replace(/ Nature$/, '') ?? '',
        evs: field('EVs:'),
        moves: lines.filter((l) => l.startsWith('-')).map((l) => l.slice(1).trim()),
      };
    })
    .filter((m) => m.species);
}

/** Descarga un equipo de pokepast.es (acepta el enlace normal). */
export async function fetchPaste(url: string): Promise<{ text: string; title: string; team: PasteMon[] }> {
  const m = url.trim().match(/pokepast\.es\/([a-z0-9]+)/i);
  if (!m) throw new Error('El enlace no es de pokepast.es.');
  const res = await fetch(`https://pokepast.es/${m[1]}/json`);
  if (!res.ok) throw new Error(`pokepast.es respondió ${res.status}.`);
  const data = (await res.json()) as { paste: string; title?: string };
  const team = parsePaste(data.paste);
  if (!team.length) throw new Error('El pokepaste está vacío.');
  return { text: data.paste, title: data.title ?? '', team };
}
