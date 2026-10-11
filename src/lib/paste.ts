import { baseName } from './util';

export interface PasteMon {
  species: string;
  item: string;
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
      const paren = head.match(/\(([^)]+)\)\s*$/);
      return {
        species: baseName(paren ? paren[1] : head),
        item: item.trim(),
        moves: lines.filter((l) => l.startsWith('-')).map((l) => l.slice(1).trim()),
      };
    });
}

/** Descarga un equipo de pokepast.es (acepta el enlace normal). */
export async function fetchPaste(url: string): Promise<{ text: string; team: PasteMon[] }> {
  const m = url.trim().match(/pokepast\.es\/([a-z0-9]+)/i);
  if (!m) throw new Error('El enlace no es de pokepast.es.');
  const res = await fetch(`https://pokepast.es/${m[1]}/json`);
  if (!res.ok) throw new Error(`pokepast.es respondió ${res.status}.`);
  const data = (await res.json()) as { paste: string };
  const team = parsePaste(data.paste);
  if (!team.length) throw new Error('El pokepaste está vacío.');
  return { text: data.paste, team };
}
